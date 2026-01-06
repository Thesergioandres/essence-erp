import Branch from "../models/Branch.js";
import BranchStock from "../models/BranchStock.js";
import InventoryEntry from "../models/InventoryEntry.js";
import Product from "../models/Product.js";
import Provider from "../models/Provider.js";

const resolveBusinessId = (req) =>
  req.businessId || req.headers["x-business-id"] || req.query.businessId;

const ensureBranch = async (businessId, branchId) => {
  if (!branchId) return null;
  const branch = await Branch.findOne({ _id: branchId, business: businessId });
  if (!branch) throw new Error("Sede inválida para este negocio");
  return branch;
};

const generateRequestId = () => {
  const now = new Date();
  return `REQ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(now.getDate()).padStart(2, "0")}-${now.getTime()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

export const createInventoryEntry = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const {
      product: productId,
      quantity,
      branch: branchId,
      provider: providerId,
      notes,
    } = req.body;

    if (!productId || !quantity) {
      return res
        .status(400)
        .json({ message: "producto y cantidad son obligatorios" });
    }

    const product = await Product.findOne({
      _id: productId,
      $or: [
        { business: businessId },
        { business: { $exists: false } },
        { business: null },
      ],
    });
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const branch = await ensureBranch(businessId, branchId);
    if (providerId) {
      const provider = await Provider.findOne({
        _id: providerId,
        business: businessId,
      });
      if (!provider) {
        return res.status(404).json({ message: "Proveedor no encontrado" });
      }
    }

    const destination = branch ? "branch" : "warehouse";
    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: "Cantidad inválida" });
    }

    // Actualizar stocks
    product.totalStock = (product.totalStock || 0) + qty;
    if (destination === "branch") {
      await BranchStock.findOneAndUpdate(
        { business: businessId, branch: branch._id, product: product._id },
        { $inc: { quantity: qty } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      product.warehouseStock = (product.warehouseStock || 0) + qty;
    }
    await product.save({ validateBeforeSave: false });

    const entry = await InventoryEntry.create({
      business: businessId,
      branch: branch?._id || null,
      product: product._id,
      provider: providerId || null,
      user: req.user.id,
      quantity: qty,
      notes,
      destination,
      requestId: req.body.requestId || generateRequestId(),
    });

    res.status(201).json({ entry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listInventoryEntries = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const { branchId, providerId, productId, startDate, endDate } = req.query;
    const filter = { business: businessId };

    if (branchId) filter.branch = branchId;
    if (providerId) filter.provider = providerId;
    if (productId) filter.product = productId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const entries = await InventoryEntry.find(filter)
      .sort({ createdAt: -1 })
      .populate("product", "name")
      .populate("branch", "name")
      .populate("provider", "name")
      .populate("user", "name email")
      .lean();

    res.json({ entries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
