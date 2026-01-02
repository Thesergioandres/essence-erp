import express from "express";
import {
  backfillProfitHistoryFromSales,
  createProfitEntry,
  getComparativeAnalysis,
  getProfitSummary,
  getUserBalance,
  getUserProfitHistory,
} from "../controllers/profitHistory.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
} from "../middleware/business.middleware.js";

const router = express.Router();

router.use(protect, businessContext, requireFeature("reports"));

// Rutas protegidas (admin o propio usuario)
router.get("/user/:userId", getUserProfitHistory);
router.get("/balance/:userId", getUserBalance);

// Rutas admin
router.get("/summary", admin, getProfitSummary);
router.get("/comparative", admin, getComparativeAnalysis);
router.post("/", admin, createProfitEntry);
router.post("/backfill/sales", admin, backfillProfitHistoryFromSales);

export default router;
