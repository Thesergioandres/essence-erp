import express from "express";
import { upload } from "../../../../config/cloudinary.js";
import { protect } from "../../../../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../../../../middleware/business.middleware.js";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  updateStock,
} from "../controllers/ProductController.js";

const router = express.Router();

// Get all products for business
router.get("/", protect, businessContext, getAllProducts);

// Get single product by ID
router.get("/:id", protect, businessContext, getProductById);

// Create Product
router.post(
  "/",
  protect,
  businessContext,
  requireFeature("inventory"),
  requirePermission({ module: "inventory", action: "create" }),
  upload.single("image"),
  createProduct,
);

// Update Product
router.put(
  "/:id",
  protect,
  businessContext,
  requireFeature("inventory"),
  requirePermission({ module: "inventory", action: "update" }),
  upload.single("image"),
  updateProduct,
);

// Update Stock (Dedicated endpoint)
router.patch(
  "/:id/stock",
  protect,
  businessContext,
  requireFeature("inventory"),
  requirePermission({ module: "inventory", action: "update" }),
  updateStock,
);

// Delete Product
router.delete(
  "/:id",
  protect,
  businessContext,
  requireFeature("inventory"),
  requirePermission({ module: "inventory", action: "delete" }),
  deleteProduct,
);

export default router;
