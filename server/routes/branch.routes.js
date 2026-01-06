import express from "express";
import {
  createBranch,
  deleteBranch,
  listBranches,
  updateBranch,
} from "../controllers/branch.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../middleware/business.middleware.js";

const router = express.Router();

router.use(protect, businessContext, requireFeature("inventory"));

router.post(
  "/",
  requirePermission({ module: "inventory", action: "create" }),
  createBranch
);
router.get(
  "/",
  requirePermission({ module: "inventory", action: "read" }),
  listBranches
);
router.patch(
  "/:id",
  requirePermission({ module: "inventory", action: "update" }),
  updateBranch
);
router.delete(
  "/:id",
  requirePermission({ module: "inventory", action: "delete" }),
  deleteBranch
);

export default router;
