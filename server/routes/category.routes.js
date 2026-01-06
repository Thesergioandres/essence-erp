import express from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "../controllers/category.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../middleware/business.middleware.js";

const router = express.Router();

// Rutas protegidas por negocio
router.use(
  protect,
  businessContext,
  requireFeature("products"),
  requirePermission({ module: "products", action: "read" })
);

router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Rutas protegidas con permisos de productos
router.post(
  "/",
  requirePermission({ module: "products", action: "create" }),
  createCategory
);
router.put(
  "/:id",
  requirePermission({ module: "products", action: "update" }),
  updateCategory
);
router.delete(
  "/:id",
  requirePermission({ module: "products", action: "delete" }),
  deleteCategory
);

export default router;
