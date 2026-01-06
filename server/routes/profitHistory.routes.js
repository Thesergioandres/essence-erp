import express from "express";
import {
  backfillProfitHistoryFromSales,
  createProfitEntry,
  getAdminProfitHistoryOverview,
  getComparativeAnalysis,
  getProfitSummary,
  getUserBalance,
  getUserProfitHistory,
} from "../controllers/profitHistory.controller.js";
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
  requireFeature("reports"),
  requirePermission({ module: "analytics", action: "read" })
);

// Rutas protegidas (admin o propio usuario)
router.get("/user/:userId", getUserProfitHistory);
router.get("/balance/:userId", getUserBalance);

// Rutas admin
router.get(
  "/summary",
  requirePermission({ module: "analytics", action: "read" }),
  getProfitSummary
);
router.get(
  "/comparative",
  requirePermission({ module: "analytics", action: "read" }),
  getComparativeAnalysis
);
router.get(
  "/admin/overview",
  requirePermission({ module: "analytics", action: "read" }),
  getAdminProfitHistoryOverview
);
router.post(
  "/",
  requirePermission({ module: "analytics", action: "create" }),
  createProfitEntry
);
router.post(
  "/backfill/sales",
  requirePermission({ module: "analytics", action: "create" }),
  backfillProfitHistoryFromSales
);

export default router;
