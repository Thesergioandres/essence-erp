import express from "express";
import {
  getComparativeAnalysis,
  getDistributorRankings,
  getFinancialKPIs,
  getLowStockVisual,
  getProductRotation,
  getSalesByCategory,
  getSalesFunnel,
  getSalesTimeline,
  getTopProducts,
} from "../controllers/advancedAnalytics.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
} from "../middleware/business.middleware.js";

const router = express.Router();

router.use(protect, businessContext, requireFeature("reports"), admin);

router.get("/sales-timeline", getSalesTimeline);
router.get("/top-products", getTopProducts);
router.get("/sales-by-category", getSalesByCategory);
router.get("/distributor-rankings", getDistributorRankings);
router.get("/low-stock-visual", getLowStockVisual);
router.get("/product-rotation", getProductRotation);
router.get("/financial-kpis", getFinancialKPIs);
router.get("/comparative-analysis", getComparativeAnalysis);
router.get("/sales-funnel", getSalesFunnel);

export default router;
