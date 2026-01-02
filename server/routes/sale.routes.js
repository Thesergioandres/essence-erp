import express from "express";
import {
  confirmPayment,
  deleteSale,
  fixAdminSales,
  getAllSales,
  getDistributorSales,
  getSalesByDistributor,
  getSalesByProduct,
  registerAdminSale,
  registerSale,
} from "../controllers/sale.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
} from "../middleware/business.middleware.js";
import { cacheMiddleware } from "../middleware/cache.middleware.js";

const router = express.Router();

// ⚠️ IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros
// POST /admin debe ir ANTES de GET / para evitar que "admin" sea interpretado como un ID

// Registrar venta como admin (stock general) - DEBE IR PRIMERO
router.post(
  "/admin",
  protect,
  businessContext,
  requireFeature("sales"),
  admin,
  registerAdminSale
);

// Fix temporal: actualizar ventas admin pendientes a confirmadas
router.post(
  "/fix-admin-sales",
  protect,
  businessContext,
  requireFeature("sales"),
  admin,
  fixAdminSales
);

// Rutas para distribuidores
router.post(
  "/",
  protect,
  businessContext,
  requireFeature("sales"),
  registerSale
);
router.get(
  "/distributor/:distributorId?",
  protect,
  businessContext,
  requireFeature("sales"),
  getDistributorSales
);

// Rutas de administrador
router.get(
  "/",
  protect,
  businessContext,
  requireFeature("sales"),
  admin,
  cacheMiddleware(60, "sales"),
  getAllSales
);
router.get(
  "/report/by-product",
  protect,
  businessContext,
  requireFeature("sales"),
  admin,
  getSalesByProduct
);
router.get(
  "/report/by-distributor",
  protect,
  businessContext,
  requireFeature("sales"),
  admin,
  getSalesByDistributor
);
router.put(
  "/:id/confirm-payment",
  protect,
  businessContext,
  requireFeature("sales"),
  admin,
  confirmPayment
);

// Eliminar venta (admin)
router.delete(
  "/:id",
  protect,
  businessContext,
  requireFeature("sales"),
  admin,
  deleteSale
);

export default router;
