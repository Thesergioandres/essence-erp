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
import { admin, protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
} from "../middleware/business.middleware.js";

const router = express.Router();

// Proteger todas las rutas y solo permitir admin
router.use(protect, businessContext, requireFeature("sales"));
router.use(admin);

// Rutas de estadísticas
router.get("/stats/overview", getSpecialSalesStatistics);
router.get("/stats/distribution", getDistributionByPerson);
router.get("/stats/top-products", getTopProducts);

// Rutas CRUD
router.route("/").post(createSpecialSale).get(getAllSpecialSales);

router
  .route("/:id")
  .get(getSpecialSaleById)
  .put(updateSpecialSale)
  .delete(deleteSpecialSale);

// Ruta para cancelar venta especial
router.put("/:id/cancel", cancelSpecialSale);

export default router;
