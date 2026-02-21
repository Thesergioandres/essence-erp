import express from "express";
import { protect } from "../../../../middleware/auth.middleware.js";
import {
  businessContext,
  checkPlanLimits,
  requireFeature,
  requirePermission,
} from "../../../../middleware/business.middleware.js";
import BranchController from "../controllers/BranchController.js";
import StockController from "../controllers/StockController.js";

const router = express.Router();
router.use(protect, businessContext, requireFeature("inventory"));

router.get(
  "/",
  requirePermission({ module: "inventory", action: "read" }),
  BranchController.getAll.bind(BranchController),
);
router.get(
  "/:id",
  requirePermission({ module: "inventory", action: "read" }),
  BranchController.getById.bind(BranchController),
);
router.get(
  "/:branchId/stock",
  requirePermission({ module: "inventory", action: "read" }),
  StockController.getBranchStock.bind(StockController),
);
router.post(
  "/",
  requirePermission({ module: "inventory", action: "create" }),
  checkPlanLimits("branches"),
  BranchController.create.bind(BranchController),
);
router.put(
  "/:id",
  requirePermission({ module: "inventory", action: "update" }),
  BranchController.update.bind(BranchController),
);
router.delete(
  "/:id",
  requirePermission({ module: "inventory", action: "delete" }),
  BranchController.delete.bind(BranchController),
);

export default router;
