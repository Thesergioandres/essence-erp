import express from "express";
import {
  confirmPayment,
  deleteSale,
  deleteSaleGroup,
  fixAdminSales,
  getAllSales,
  getDistributorSales,
  getSalesByDistributor,
  getSalesByProduct,
  registerAdminSale,
  registerSale,
} from "../controllers/sale.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../middleware/business.middleware.js";
import { cacheMiddleware } from "../middleware/cache.middleware.js";

const router = express.Router();
const branchFromReq = (req) =>
  req.body?.branch || req.body?.branchId || req.params?.branchId;

// ⚠️ IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros
// POST /admin debe ir ANTES de GET / para evitar que "admin" sea interpretado como un ID

// Registrar venta como admin (stock general) - DEBE IR PRIMERO
router.post(
  "/admin",
  protect,
  businessContext,
  requireFeature("sales"),
  requirePermission({
    module: "sales",
    action: "create",
    branchResolver: branchFromReq,
  }),
  registerAdminSale,
);

// Fix temporal: actualizar ventas admin pendientes a confirmadas
router.post(
  "/fix-admin-sales",
  protect,
  businessContext,
  requireFeature("sales"),
  requirePermission({ module: "sales", action: "update" }),
  fixAdminSales,
);

// Rutas para distribuidores
router.post(
  "/",
  protect,
  businessContext,
  requireFeature("sales"),
  requirePermission({
    module: "sales",
    action: "create",
    branchResolver: branchFromReq,
  }),
  registerSale,
);
router.get(
  "/distributor/:distributorId?",
  protect,
  businessContext,
  requireFeature("sales"),
  requirePermission({ module: "sales", action: "read" }),
  getDistributorSales,
);

// Rutas de administrador
router.get(
  "/",
  protect,
  businessContext,
  requireFeature("sales"),
  requirePermission({ module: "sales", action: "read" }),
  cacheMiddleware(15, "sales:list"),
  cacheMiddleware(60, "sales"),
  getAllSales,
);
router.get(
  "/report/by-product",
  protect,
  businessContext,
  requireFeature("sales"),
  requirePermission({ module: "sales", action: "read" }),
  getSalesByProduct,
);
router.get(
  "/report/by-distributor",
  protect,
  businessContext,
  requireFeature("sales"),
  requirePermission({ module: "sales", action: "read" }),
  getSalesByDistributor,
);
router.put(
  "/:id/confirm-payment",
  protect,
  businessContext,
  requireFeature("sales"),
  requirePermission({ module: "sales", action: "update" }),
  confirmPayment,
);

// ⭐ Eliminar grupo de ventas completo (ANTES de /:id para evitar conflictos)
router.delete(
  "/group/:saleGroupId",
  protect,
  businessContext,
  requireFeature("sales"),
  requirePermission({ module: "sales", action: "delete" }),
  deleteSaleGroup,
);

// Eliminar venta individual (admin)
router.delete(
  "/:id",
  protect,
  businessContext,
  requireFeature("sales"),
  requirePermission({ module: "sales", action: "delete" }),
  deleteSale,
);

export default router;
