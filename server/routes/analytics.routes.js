import express from "express";
import {
  getAnalyticsDashboard,
  getAverages,
  getCombinedSummary,
  getFinancialSummary,
  getMonthlyProfit,
  getProfitByDistributor,
  getProfitByProduct,
  getSalesTimeline,
} from "../controllers/analytics.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";
import { businessContext } from "../middleware/business.middleware.js";
import { cacheMiddleware } from "../middleware/cache.middleware.js";

const router = express.Router();

// Caché de 5 minutos para analytics (scoped por negocio)
router.use(protect, businessContext, admin);

router.get(
  "/monthly-profit",
  cacheMiddleware(300, "analytics"),
  getMonthlyProfit
);
router.get(
  "/profit-by-product",
  cacheMiddleware(300, "analytics"),
  getProfitByProduct
);
router.get(
  "/profit-by-distributor",
  cacheMiddleware(300, "analytics"),
  getProfitByDistributor
);
router.get("/averages", cacheMiddleware(300, "analytics"), getAverages);
router.get(
  "/sales-timeline",
  cacheMiddleware(300, "analytics"),
  getSalesTimeline
);
router.get(
  "/financial-summary",
  cacheMiddleware(300, "analytics"),
  getFinancialSummary
);
router.get(
  "/dashboard",
  cacheMiddleware(300, "analytics"),
  getAnalyticsDashboard
);
router.get(
  "/combined-summary",
  cacheMiddleware(300, "analytics"),
  getCombinedSummary
);

export default router;
