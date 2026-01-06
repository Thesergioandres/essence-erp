import express from "express";
import {
  createBranchTransfer,
  listBranchTransfers,
} from "../controllers/branchTransfer.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../middleware/business.middleware.js";

const router = express.Router();

const WAREHOUSE_KEY = "warehouse";

const ensureBranchAccess = (req, res, next) => {
  const allowedBranches = req.membership?.allowedBranches;
  if (!Array.isArray(allowedBranches) || allowedBranches.length === 0) {
    return next();
  }

  const ids = [req.body?.originBranchId, req.body?.targetBranchId]
    .filter(Boolean)
    .filter((id) => id !== WAREHOUSE_KEY);

  const hasAccess = ids.every((id) =>
    allowedBranches.some((branch) => branch?.toString() === id?.toString())
  );

  if (!hasAccess) {
    return res.status(403).json({
      message: "No tienes acceso a esta sede",
      module: "transfers",
      action: req.method === "GET" ? "read" : "create",
    });
  }

  next();
};

router.use(
  protect,
  businessContext,
  requireFeature("inventory"),
  requireFeature("transfers")
);

router.post(
  "/",
  requirePermission({ module: "transfers", action: "create" }),
  ensureBranchAccess,
  createBranchTransfer
);
router.get(
  "/",
  requirePermission({ module: "transfers", action: "read" }),
  ensureBranchAccess,
  listBranchTransfers
);

export default router;
