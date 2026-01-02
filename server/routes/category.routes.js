import express from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "../controllers/category.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";
import { businessContext } from "../middleware/business.middleware.js";

const router = express.Router();

// Rutas protegidas por negocio
router.use(protect, businessContext);

router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Rutas protegidas (solo admin)
router.post("/", admin, createCategory);
router.put("/:id", admin, updateCategory);
router.delete("/:id", admin, deleteCategory);

export default router;
