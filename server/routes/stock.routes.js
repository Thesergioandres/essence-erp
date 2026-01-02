import express from "express";
import {
  assignStockToDistributor,
  getAllDistributorsStock,
  getDistributorStock,
  getStockAlerts,
  getTransferHistory,
  transferStockBetweenDistributors,
  withdrawStockFromDistributor,
} from "../controllers/stock.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
} from "../middleware/business.middleware.js";
import { cacheMiddleware } from "../middleware/cache.middleware.js";

const router = express.Router();

// Rutas de administrador
router.post(
  "/assign",
  protect,
  businessContext,
  admin,
  requireFeature("inventory"),
  assignStockToDistributor
);
router.post(
  "/withdraw",
  protect,
  businessContext,
  admin,
  requireFeature("inventory"),
  withdrawStockFromDistributor
);
router.get(
  "/all",
  protect,
  businessContext,
  admin,
  requireFeature("inventory"),
  cacheMiddleware(60, "stock:all"),
  getAllDistributorsStock
);
router.get(
  "/alerts",
  protect,
  businessContext,
  admin,
  requireFeature("inventory"),
  cacheMiddleware(30, "stock:alerts"),
  getStockAlerts
);
router.get(
  "/transfers",
  protect,
  businessContext,
  admin,
  requireFeature("inventory"),
  requireFeature("transfers"),
  getTransferHistory
); // Historial de transferencias

// Rutas para distribuidor
router.get(
  "/distributor/:distributorId",
  protect,
  businessContext,
  requireFeature("inventory"),
  getDistributorStock
);
router.post(
  "/transfer",
  protect,
  businessContext,
  requireFeature("inventory"),
  requireFeature("transfers"),
  transferStockBetweenDistributors
);

export default router;
