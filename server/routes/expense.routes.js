import express from "express";
import {
  createExpense,
  deleteExpense,
  getExpenseById,
  getExpenses,
  updateExpense,
} from "../controllers/expense.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../middleware/business.middleware.js";
import { cacheMiddleware } from "../middleware/cache.middleware.js";

const router = express.Router();

router.use(protect, businessContext, requireFeature("expenses"));

router.get(
  "/",
  requirePermission({ module: "expenses", action: "read" }),
  cacheMiddleware(120, "expenses"),
  getExpenses
);
router.post(
  "/",
  requirePermission({ module: "expenses", action: "create" }),
  createExpense
);

router.get(
  "/:id",
  requirePermission({ module: "expenses", action: "read" }),
  cacheMiddleware(300, "expense"),
  getExpenseById
);
router.put(
  "/:id",
  requirePermission({ module: "expenses", action: "update" }),
  updateExpense
);
router.delete(
  "/:id",
  requirePermission({ module: "expenses", action: "delete" }),
  deleteExpense
);

export default router;
