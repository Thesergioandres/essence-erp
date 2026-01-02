import express from "express";
import {
  createExpense,
  deleteExpense,
  getExpenseById,
  getExpenses,
  updateExpense,
} from "../controllers/expense.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
} from "../middleware/business.middleware.js";
import { cacheMiddleware } from "../middleware/cache.middleware.js";

const router = express.Router();

router.use(protect, businessContext, requireFeature("expenses"));

router.get("/", admin, cacheMiddleware(120, "expenses"), getExpenses);
router.post("/", admin, createExpense);

router.get("/:id", admin, cacheMiddleware(300, "expense"), getExpenseById);
router.put("/:id", admin, updateExpense);
router.delete("/:id", admin, deleteExpense);

export default router;
