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
import { protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../middleware/business.middleware.js";

const router = express.Router();

router.use(protect, businessContext, requireFeature("inventory"));

// Rutas para distribuidores
router.post(
  "/",
  requirePermission({ module: "inventory", action: "create" }),
  reportDefectiveProduct
);
router.get(
  "/distributor/:distributorId?",
  requirePermission({ module: "inventory", action: "read" }),
  getDistributorDefectiveReports
);

// Rutas de administrador
router.post(
  "/admin",
  requirePermission({ module: "inventory", action: "create" }),
  reportDefectiveProductAdmin
);
router.post(
  "/branch",
  requirePermission({ module: "inventory", action: "create" }),
  reportDefectiveProductBranch
);
router.get(
  "/",
  requirePermission({ module: "inventory", action: "read" }),
  getAllDefectiveReports
);
router.put(
  "/:id/confirm",
  requirePermission({ module: "inventory", action: "update" }),
  confirmDefectiveProduct
);
router.put(
  "/:id/reject",
  requirePermission({ module: "inventory", action: "update" }),
  rejectDefectiveProduct
);

export default router;
