import express from "express";
import {
  confirmDefectiveProduct,
  getAllDefectiveReports,
  getDistributorDefectiveReports,
  rejectDefectiveProduct,
  reportDefectiveProduct,
  reportDefectiveProductAdmin,
  reportDefectiveProductBranch,
} from "../controllers/defectiveProduct.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";
import { businessContext } from "../middleware/business.middleware.js";

const router = express.Router();

router.use(protect, businessContext);

// Rutas para distribuidores
router.post("/", reportDefectiveProduct);
router.get("/distributor/:distributorId?", getDistributorDefectiveReports);

// Rutas de administrador
router.post("/admin", admin, reportDefectiveProductAdmin);
router.post("/branch", admin, reportDefectiveProductBranch);
router.get("/", admin, getAllDefectiveReports);
router.put("/:id/confirm", admin, confirmDefectiveProduct);
router.put("/:id/reject", admin, rejectDefectiveProduct);

export default router;
