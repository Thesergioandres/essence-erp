import express from "express";
import {
  cancelSpecialSale,
  createSpecialSale,
  deleteSpecialSale,
  getAllSpecialSales,
  getDistributionByPerson,
  getSpecialSaleById,
  getSpecialSalesStatistics,
  getTopProducts,
  updateSpecialSale,
} from "../controllers/specialSale.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../middleware/business.middleware.js";

const router = express.Router();

// Proteger todas las rutas con permisos granulares
router.use(protect, businessContext, requireFeature("sales"));

// Rutas de estadísticas
router.get(
  "/stats/overview",
  requirePermission({ module: "promotions", action: "read" }),
  getSpecialSalesStatistics
);
router.get(
  "/stats/distribution",
  requirePermission({ module: "promotions", action: "read" }),
  getDistributionByPerson
);
router.get(
  "/stats/top-products",
  requirePermission({ module: "promotions", action: "read" }),
  getTopProducts
);

// Rutas CRUD
router
  .route("/")
  .post(
    requirePermission({ module: "promotions", action: "create" }),
    createSpecialSale
  )
  .get(
    requirePermission({ module: "promotions", action: "read" }),
    getAllSpecialSales
  );

router
  .route("/:id")
  .get(
    requirePermission({ module: "promotions", action: "read" }),
    getSpecialSaleById
  )
  .put(
    requirePermission({ module: "promotions", action: "update" }),
    updateSpecialSale
  )
  .delete(
    requirePermission({ module: "promotions", action: "delete" }),
    deleteSpecialSale
  );

// Ruta para cancelar venta especial
router.put(
  "/:id/cancel",
  requirePermission({ module: "promotions", action: "update" }),
  cancelSpecialSale
);

export default router;
