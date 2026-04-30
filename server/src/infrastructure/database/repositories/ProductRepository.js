import Branch from "../models/Branch.js";
import BranchStock from "../models/BranchStock.js";
import EmployeeStock from "../models/EmployeeStock.js";
import InventoryEntry from "../models/InventoryEntry.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

export class ProductRepository {
  /**
   * Find product by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return Product.findById(id).lean();
  }

  /**
   * Find all products for a business
   * @param {string} businessId
   * @param {Object} filter
   * @returns {Promise<Array>}
   */
  async findAll(businessId, filter = {}) {
    const normalizedFilter = { business: businessId, ...filter };
    if (typeof normalizedFilter.isDeleted === "undefined") {
      normalizedFilter.isDeleted = { $ne: true };
    }

    return Product.find(normalizedFilter)
      .populate("category", "name color icon")
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Update stock atomically.
   * Optional session support for both standalone and replica set MongoDB.
   *
   * ⚠️ NOTE: This updates totalStock (global counter) only.
   * For warehouse-specific updates, use updateWarehouseStock().
   *
  /**
   * Update stock atomically.
   *
   * @param {string} productId
   * @param {number} quantityChange - Negative to reduce, Positive to add
   * @param {mongoose.ClientSession} session - Optional
   * @returns {Promise<Object>} Updated document
   */
  async updateStock(productId, quantityChange, session) {
    const update = {
      $inc: {
        totalStock: quantityChange,
      },
    };

    const query = { _id: productId };
    if (quantityChange < 0) {
      query.totalStock = { $gte: Math.abs(quantityChange) };
    }

    const options = { new: true, runValidators: true };
    if (session) options.session = session;

    const product = await Product.findOneAndUpdate(query, update, options);

    if (!product) {
      if (quantityChange < 0) {
        throw new Error(
          "No se pudo actualizar el stock global: Producto no encontrado o stock insuficiente.",
        );
      }
      throw new Error("Producto no encontrado.");
    }

    return product.toObject();
  }

  /**
   * Update warehouse stock specifically (for admin sales).
   *
   * @param {string} productId
   * @param {number} quantityChange - Negative to reduce, Positive to add
   * @param {mongoose.ClientSession} session - Optional
   * @returns {Promise<Object>} Updated document
   */
  async updateWarehouseStock(productId, quantityChange, session) {
    const update = {
      $inc: {
        warehouseStock: quantityChange,
      },
    };

    const query = { _id: productId };
    if (quantityChange < 0) {
      query.warehouseStock = { $gte: Math.abs(quantityChange) };
    }

    const options = { new: true, runValidators: true };
    if (session) options.session = session;

    const product = await Product.findOneAndUpdate(query, update, options);

    if (!product) {
      if (quantityChange < 0) {
        throw new Error(
          "Stock insuficiente en bodega o producto no encontrado.",
        );
      }
      throw new Error("Producto no encontrado.");
    }

    return product.toObject();
  }

  /**
   * Create a new product
   * @param {Object} data
   * @param {mongoose.ClientSession} session - Optional
   */
  async create(data, session) {
    const [product] = session
      ? await Product.create([data], { session })
      : await Product.create([data]);
    return product;
  }

  /**
   * Update a product by ID
   * @param {string} id
   * @param {string} businessId
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async update(id, businessId, updateData) {
    const product = await Product.findOneAndUpdate(
      { _id: id, business: businessId },
      { $set: updateData },
      { new: true, runValidators: true },
    );
    return product;
  }

  /**
   * Update a product and register manual stock adjustments when needed.
   * @param {string} id
   * @param {string} businessId
   * @param {Object} updateData
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async updateWithManualStock(id, businessId, updateData, userId) {
    const product = await Product.findOne({ _id: id, business: businessId });
    if (!product) return null;

    const hasTotalStock = Object.prototype.hasOwnProperty.call(
      updateData,
      "totalStock",
    );
    const hasWarehouseStock = Object.prototype.hasOwnProperty.call(
      updateData,
      "warehouseStock",
    );

    if (hasTotalStock || hasWarehouseStock) {
      const distStocks = await EmployeeStock.find({
        product: id,
        business: businessId,
      });
      const totalEmployee = distStocks.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0,
      );

      const bodegaBranches = await Branch.find({
        business: businessId,
        $or: [{ name: /^bodega$/i }, { isWarehouse: true }],
      })
        .select("_id")
        .lean();
      const bodegaIds = bodegaBranches.map((branch) => branch._id);

      const branchStocks = await BranchStock.find({
        product: id,
        business: businessId,
        ...(bodegaIds.length > 0 ? { branch: { $nin: bodegaIds } } : {}),
      });
      const totalBranch = branchStocks.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0,
      );

      const currentWarehouse = product.warehouseStock || 0;
      let desiredWarehouse = currentWarehouse;
      const providedWarehouse = hasWarehouseStock
        ? Number(updateData.warehouseStock)
        : null;
      const warehouseChanged =
        hasWarehouseStock &&
        !Number.isNaN(providedWarehouse) &&
        providedWarehouse !== currentWarehouse;

      if (warehouseChanged) {
        desiredWarehouse = Number(providedWarehouse);
      } else if (hasTotalStock) {
        const desiredTotal = Number(updateData.totalStock);
        desiredWarehouse = desiredTotal - totalEmployee - totalBranch;
      }

      if (Number.isNaN(desiredWarehouse) || desiredWarehouse < 0) {
        throw new Error("El stock en bodega no puede ser negativo");
      }

      updateData.warehouseStock = desiredWarehouse;
      updateData.totalStock = desiredWarehouse + totalEmployee + totalBranch;

      const diff = desiredWarehouse - currentWarehouse;
      if (diff !== 0) {
        const unitCost = product.averageCost || product.purchasePrice || 0;
        const totalCost = diff * unitCost;

        if (!userId) {
          throw new Error("Usuario requerido para registrar ajuste de stock");
        }

        await InventoryEntry.create({
          business: businessId,
          product: product._id,
          user: userId,
          type: "adjustment",
          quantity: diff,
          unitCost,
          totalCost,
          averageCostAfter: product.averageCost || unitCost,
          notes: "Ajuste manual de stock desde panel de edicion",
          destination: "warehouse",
          metadata: {
            previousWarehouseStock: currentWarehouse,
            newWarehouseStock: desiredWarehouse,
          },
        });
      }
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, business: businessId },
      { $set: updateData },
      { new: true, runValidators: true },
    );
    return updatedProduct;
  }

  /**
   * Update product public/employee prices.
   * @param {string} id
   * @param {string} businessId
   * @param {{ clientPrice?: number, employeePrice?: number }} priceData
   * @returns {Promise<Object|null>}
   */
  async updatePrices(id, businessId, priceData) {
    const updateData = {};

    if (typeof priceData.clientPrice === "number") {
      updateData.clientPrice = priceData.clientPrice;
    }

    if (typeof priceData.employeePrice === "number") {
      updateData.employeePrice = priceData.employeePrice;
      updateData.employeePriceManual = true;
      updateData.employeePriceManualValue = priceData.employeePrice;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No se enviaron precios para actualizar");
    }

    return Product.findOneAndUpdate(
      { _id: id, business: businessId },
      { $set: updateData },
      { new: true, runValidators: true },
    );
  }

  /**
   * Delete a product by ID
   * @param {string} id
   * @param {string} businessId
   * @returns {Promise<Object>}
   */
  async delete(id, businessId) {
    const product = await Product.findOne({ _id: id, business: businessId });
    if (!product) {
      throw new Error("Producto no encontrado");
    }

    const deletedAt = new Date();

    await Promise.all([
      BranchStock.deleteMany({ business: businessId, product: id }),
      EmployeeStock.deleteMany({ business: businessId, product: id }),
      InventoryEntry.updateMany(
        { business: businessId, product: id, deleted: { $ne: true } },
        { $set: { deleted: true, deletedAt } },
      ),
      User.updateMany(
        { business: businessId, assignedProducts: id },
        { $pull: { assignedProducts: id } },
      ),
    ]);

    product.isDeleted = true;
    product.deletedAt = deletedAt;
    product.totalStock = 0;
    product.warehouseStock = 0;
    product.totalInventoryValue = 0;

    await product.save();
    return product;
  }
}
