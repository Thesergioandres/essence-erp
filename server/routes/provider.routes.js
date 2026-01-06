import express from "express";
import {
  createProvider,
  deleteProvider,
  getProvider,
  listProviders,
  updateProvider,
} from "../controllers/provider.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../middleware/business.middleware.js";

const router = express.Router();

router.use(
  protect,
  businessContext,
  requireFeature("inventory"),
  requireFeature("providers")
);

router.post(
  "/",
  requirePermission({ module: "providers", action: "create" }),
  createProvider
);
router.get(
  "/",
  requirePermission({ module: "providers", action: "read" }),
  listProviders
);
router.get(
  "/:id",
  requirePermission({ module: "providers", action: "read" }),
  getProvider
);
router.patch(
  "/:id",
  requirePermission({ module: "providers", action: "update" }),
  updateProvider
);
router.delete(
  "/:id",
  requirePermission({ module: "providers", action: "delete" }),
  deleteProvider
);

export default router;
