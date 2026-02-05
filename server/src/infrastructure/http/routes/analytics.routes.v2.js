import express from "express";
import { protect } from "../../../../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../../../../middleware/business.middleware.js";
import {
  getDashboardStats,
  getDistributorEstimatedProfit,
  getEstimatedProfit,
} from "../controllers/AnalyticsController.js";

const router = express.Router();

// GET /api/v2/analytics/dashboard
router.get(
  "/dashboard",
  protect,
  businessContext,
  requireFeature("analytics"), // Assuming feature flag
  requirePermission({ module: "analytics", action: "read" }),
  getDashboardStats,
);

// GET /api/v2/analytics/estimated-profit
router.get(
  "/estimated-profit",
  protect,
  businessContext,
  requirePermission({ module: "analytics", action: "read" }),
  getEstimatedProfit,
);

// GET /api/v2/analytics/distributor/estimated-profit
router.get(
  "/distributor/estimated-profit",
  protect,
  businessContext,
  requirePermission({ module: "analytics", action: "read" }),
  getDistributorEstimatedProfit,
);

export default router;
