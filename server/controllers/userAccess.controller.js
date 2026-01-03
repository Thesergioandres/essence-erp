import AuditLog from "../models/AuditLog.js";
import Business from "../models/Business.js";
import BusinessAssistantConfig from "../models/BusinessAssistantConfig.js";
import Category from "../models/Category.js";
import DefectiveProduct from "../models/DefectiveProduct.js";
import DistributorStats from "../models/DistributorStats.js";
import DistributorStock from "../models/DistributorStock.js";
import Expense from "../models/Expense.js";
import Membership from "../models/Membership.js";
import PeriodWinner from "../models/PeriodWinner.js";
import Product from "../models/Product.js";
import ProfitHistory from "../models/ProfitHistory.js";
import Sale from "../models/Sale.js";
import SpecialSale from "../models/SpecialSale.js";
import Stock from "../models/Stock.js";
import StockTransfer from "../models/StockTransfer.js";
import User from "../models/User.js";

const addDuration = (baseDate, { days = 0, months = 0, years = 0 }) => {
  const date = new Date(baseDate || Date.now());
  if (years) date.setFullYear(date.getFullYear() + Number(years));
  if (months) date.setMonth(date.getMonth() + Number(months));
  if (days) date.setDate(date.getDate() + Number(days));
  return date;
};

export const listUsers = async (_req, res) => {
  const users = await User.find({}).select("-password").sort({ createdAt: -1 });
  res.json({ success: true, data: users });
};

export const activateUser = async (req, res) => {
  const { id } = req.params;
  const { days = 30, months = 0, years = 0 } = req.body || {};
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  user.status = "active";
  user.active = true;
  user.subscriptionExpiresAt = addDuration(Date.now(), { days, months, years });
  user.pausedRemainingMs = 0;
  await user.save();
  res.json({ success: true, user });
};

export const suspendUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
  user.status = "suspended";
  user.active = false;
  await user.save();
  res.json({ success: true, user });
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    // Negocios creados por el usuario (solo super admins / creadores)
    const businessIds = await Business.find({ createdBy: user._id }).distinct(
      "_id"
    );

    // Borrar datos atados a esos negocios
    if (businessIds.length) {
      await Promise.all([
        Sale.deleteMany({ business: { $in: businessIds } }),
        Product.deleteMany({ business: { $in: businessIds } }),
        Category.deleteMany({ business: { $in: businessIds } }),
        Membership.deleteMany({ business: { $in: businessIds } }),
        Stock.deleteMany({ business: { $in: businessIds } }),
        StockTransfer.deleteMany({ business: { $in: businessIds } }),
        DistributorStock.deleteMany({ business: { $in: businessIds } }),
        DistributorStats.deleteMany({ business: { $in: businessIds } }),
        Expense.deleteMany({ business: { $in: businessIds } }),
        ProfitHistory.deleteMany({ business: { $in: businessIds } }),
        AuditLog.deleteMany({ business: { $in: businessIds } }),
        DefectiveProduct.deleteMany({ business: { $in: businessIds } }),
        SpecialSale.deleteMany({ business: { $in: businessIds } }),
        PeriodWinner.deleteMany({ business: { $in: businessIds } }),
        BusinessAssistantConfig.deleteMany({ business: { $in: businessIds } }),
      ]);

      await Business.deleteMany({ _id: { $in: businessIds } });
    }

    // Limpiar memberships y datos personales del usuario en cualquier negocio
    await Membership.deleteMany({ user: user._id });

    await user.deleteOne();

    res.json({ success: true, deletedBusinesses: businessIds.length });
  } catch (error) {
    console.error("deleteUser error", error);
    res
      .status(500)
      .json({ message: "Error eliminando usuario", error: error.message });
  }
};

export const extendSubscription = async (req, res) => {
  const { id } = req.params;
  const { days = 0, months = 0, years = 0 } = req.body || {};
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  const base =
    user.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt) > new Date()
      ? user.subscriptionExpiresAt
      : Date.now();
  user.subscriptionExpiresAt = addDuration(base, { days, months, years });
  user.status = "active";
  user.active = true;
  await user.save();
  res.json({ success: true, user });
};

export const pauseSubscription = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  if (user.status !== "active") {
    return res
      .status(400)
      .json({ message: "Solo se puede pausar desde estado active" });
  }
  if (!user.subscriptionExpiresAt) {
    return res
      .status(400)
      .json({ message: "El usuario no tiene suscripción activa" });
  }

  const remaining = new Date(user.subscriptionExpiresAt).getTime() - Date.now();
  user.pausedRemainingMs = Math.max(0, remaining);
  user.subscriptionExpiresAt = null;
  user.status = "paused";
  user.active = false;
  await user.save();
  res.json({ success: true, user });
};

export const resumeSubscription = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  if (user.status !== "paused") {
    return res
      .status(400)
      .json({ message: "Solo se puede reanudar desde estado paused" });
  }

  const remaining = user.pausedRemainingMs || 0;
  const expiresAt = new Date(Date.now() + remaining);
  user.subscriptionExpiresAt = expiresAt;
  user.pausedRemainingMs = 0;
  user.status = "active";
  user.active = true;
  await user.save();
  res.json({ success: true, user });
};
