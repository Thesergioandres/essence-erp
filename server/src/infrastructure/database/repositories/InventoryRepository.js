import mongoose from "mongoose";
import InventoryCalculationService from "../../../domain/services/InventoryCalculationService.js";
import Branch from "../models/Branch.js";
import BranchStock from "../models/BranchStock.js";
import InventoryEntry from "../models/InventoryEntry.js";
import Product from "../models/Product.js";
import Provider from "../models/Provider.js";

const TRANSACTION_UNSUPPORTED_PATTERNS = [
  "Transaction numbers are only allowed",
  "Transaction is not supported",
  "replica set member",
  "not a mongos",
];

const isTransactionUnsupportedError = (error) => {
  const message = String(error?.message || "");
  return TRANSACTION_UNSUPPORTED_PATTERNS.some((pattern) =>
    message.includes(pattern),
  );
};

class InventoryRepository {
  async createEntry(businessId, data, userId) {
    const {
      product: productId,
      quantity,
      branch: branchId,
      provider: providerId,
      notes,
      unitCost: rawUnitCost,
      additionalCosts,
    } = data;

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      const error = new Error("Cantidad invalida");
      error.statusCode = 400;
      throw error;
    }

    const runCreateEntry = async (session = null) => {
      const productQuery = Product.findOne({
        _id: productId,
        business: businessId,
      });
      const product = session
        ? await productQuery.session(session)
        : await productQuery;

      if (!product) {
        const error = new Error("Producto no encontrado");
        error.statusCode = 404;
        throw error;
      }

      let branch = null;
      if (branchId) {
        const branchQuery = Branch.findOne({
          _id: branchId,
          business: businessId,
        });
        branch = session
          ? await branchQuery.session(session)
          : await branchQuery;

        if (!branch) {
          const error = new Error("Sede invalida");
          error.statusCode = 404;
          throw error;
        }
      }

      if (providerId) {
        const providerQuery = Provider.findOne({
          _id: providerId,
          business: businessId,
        });
        const provider = session
          ? await providerQuery.session(session)
          : await providerQuery;

        if (!provider) {
          const error = new Error("Proveedor no encontrado");
          error.statusCode = 404;
          throw error;
        }
      }

      const destination = branch ? "branch" : "warehouse";
      const currentAverageCost =
        product.averageCost || product.purchasePrice || 0;

      const costCalculation =
        InventoryCalculationService.calculateWeightedEntryCost({
          previousStock: product.totalStock || 0,
          previousAverageCost: currentAverageCost,
          incomingQuantity: qty,
          incomingUnitCost:
            Number(rawUnitCost) > 0 ? Number(rawUnitCost) : currentAverageCost,
          additionalCosts,
          costingMethod: product.costingMethod || "average",
        });

      product.totalStock = costCalculation.newTotalStock;
      product.totalInventoryValue = costCalculation.newTotalInventoryValue;
      product.averageCost = costCalculation.newAverageCost;
      product.lastCostUpdate = new Date();

      if (destination === "branch") {
        const branchStockOptions = {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          ...(session ? { session } : {}),
        };

        await BranchStock.findOneAndUpdate(
          { business: businessId, branch: branch._id, product: product._id },
          { $inc: { quantity: qty } },
          branchStockOptions,
        );
      } else {
        product.warehouseStock = (product.warehouseStock || 0) + qty;
      }

      await product.save({
        validateBeforeSave: false,
        ...(session ? { session } : {}),
      });

      const requestId =
        data.requestId ||
        `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const entryPayload = {
        business: businessId,
        branch: branch?._id || null,
        product: product._id,
        provider: providerId || null,
        user: userId,
        quantity: qty,
        unitCost: costCalculation.weightedUnitCost,
        totalCost: costCalculation.totalEntryCost,
        averageCostAfter: costCalculation.newAverageCost,
        notes,
        destination,
        requestId,
        purchaseGroupId: data.purchaseGroupId || null,
        metadata: {
          previousAverageCost: costCalculation.previousAverageCost,
          costingMethod: product.costingMethod || "average",
          baseUnitCost: costCalculation.baseUnitCost,
          baseTotalCost: costCalculation.baseTotalCost,
          additionalCostsTotal: costCalculation.additionalCostsTotal,
          additionalCosts: costCalculation.additionalCostsBreakdown,
        },
      };

      let entry = null;
      if (session) {
        const [createdEntry] = await InventoryEntry.create([entryPayload], {
          session,
        });
        entry = createdEntry;
      } else {
        entry = await InventoryEntry.create(entryPayload);
      }

      return {
        entry,
        costInfo: {
          previousAverageCost: costCalculation.previousAverageCost,
          newAverageCost: costCalculation.newAverageCost,
          totalInventoryValue: costCalculation.newTotalInventoryValue,
          additionalCostsTotal: costCalculation.additionalCostsTotal,
        },
      };
    };

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const result = await runCreateEntry(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      if (isTransactionUnsupportedError(error)) {
        return runCreateEntry();
      }

      throw error;
    } finally {
      session.endSession();
    }
  }

  async listEntries(businessId, filters, page, limit) {
    const { productId, branchId, providerId, destination, startDate, endDate } =
      filters;
    const filter = { business: businessId, deleted: { $ne: true } };
    if (productId) filter.product = productId;
    if (branchId) filter.branch = branchId;
    if (providerId) filter.provider = providerId;
    if (destination) filter.destination = destination;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [entries, total] = await Promise.all([
      InventoryEntry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("product", "name")
        .populate("branch", "name")
        .populate("provider", "name")
        .populate("user", "name email")
        .lean(),
      InventoryEntry.countDocuments(filter),
    ]);

    return {
      entries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  async updateEntry(businessId, entryId, data) {
    const entry = await InventoryEntry.findOne({
      _id: entryId,
      business: businessId,
      deleted: { $ne: true },
    });

    if (!entry) {
      throw new Error("Entrada de inventario no encontrada");
    }

    if (data.notes !== undefined) {
      entry.notes = data.notes;
    }

    if (data.provider !== undefined) {
      if (data.provider) {
        const provider = await Provider.findOne({
          _id: data.provider,
          business: businessId,
        });
        if (!provider) throw new Error("Proveedor no encontrado");
      }
      entry.provider = data.provider || null;
    }

    await entry.save();

    return { entry };
  }

  async deleteEntry(businessId, entryId, userId) {
    const entry = await InventoryEntry.findOne({
      _id: entryId,
      business: businessId,
      deleted: { $ne: true },
    });

    if (!entry) {
      throw new Error("Entrada de inventario no encontrada");
    }

    const product = await Product.findOne({
      _id: entry.product,
      business: businessId,
    });
    if (!product) throw new Error("Producto no encontrado");

    const qty = Number(entry.quantity) || 0;
    if (qty <= 0) {
      throw new Error("Cantidad inválida en la entrada");
    }

    if (entry.destination === "branch") {
      const branchStock = await BranchStock.findOne({
        business: businessId,
        branch: entry.branch,
        product: entry.product,
      });
      const branchQty = branchStock?.quantity || 0;
      if (branchQty < qty) {
        throw new Error("Stock insuficiente en la sede para revertir");
      }

      await BranchStock.findOneAndUpdate(
        { business: businessId, branch: entry.branch, product: entry.product },
        { $inc: { quantity: -qty } },
      );
    } else {
      const warehouseQty = product.warehouseStock || 0;
      if (warehouseQty < qty) {
        throw new Error("Stock insuficiente en bodega para revertir");
      }
      product.warehouseStock = warehouseQty - qty;
    }

    const totalStock = product.totalStock || 0;
    product.totalStock = Math.max(totalStock - qty, 0);

    const totalValue = product.totalInventoryValue || 0;
    const entryValue = Number(entry.totalCost) || 0;
    const newTotalValue = Math.max(totalValue - entryValue, 0);
    product.totalInventoryValue = newTotalValue;

    const usesFixedCosting = product.costingMethod === "fixed";
    product.averageCost = usesFixedCosting
      ? product.averageCost || product.purchasePrice || 0
      : product.totalStock > 0
        ? newTotalValue / product.totalStock
        : product.purchasePrice || 0;
    product.lastCostUpdate = new Date();

    await product.save({ validateBeforeSave: false });

    entry.deleted = true;
    entry.deletedAt = new Date();
    entry.deletedBy = userId || null;
    await entry.save();

    return {
      entry,
      revertedQuantity: qty,
      destination: entry.destination,
    };
  }
}

export default new InventoryRepository();
