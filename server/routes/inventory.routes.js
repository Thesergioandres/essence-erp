import express from "express";
import {
  createInventoryEntry,
  listInventoryEntries,
} from "../controllers/inventory.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../middleware/business.middleware.js";

const router = express.Router();

router.use(protect, businessContext, requireFeature("inventory"));

router.post(
  "/receipts",
  requirePermission({ module: "inventory", action: "create" }),
  createInventoryEntry
);

router.get(
  "/receipts",
  requirePermission({ module: "inventory", action: "read" }),
  listInventoryEntries
);

export default router;
