import express from "express";
import { upload } from "../config/cloudinary.js";
import {
  createProduct,
  deleteProduct,
  getDistributorCatalog,
  getDistributorPrice,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/product.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
} from "../middleware/business.middleware.js";
import { cacheMiddleware } from "../middleware/cache.middleware.js";

const router = express.Router();

// Rutas protegidas específicas (DEBEN ir ANTES de las rutas con parámetros)
router.get(
  "/my-catalog",
  protect,
  businessContext,
  requireFeature("products"),
  getDistributorCatalog
); // Catálogo personal del distribuidor

// Rutas públicas con caché
router.get("/", cacheMiddleware(600, "products"), getProducts); // 10 minutos
router.get("/:id", cacheMiddleware(600, "product"), getProduct); // 10 minutos

// Rutas protegidas
router.get(
  "/:id/distributor-price/:distributorId",
  protect,
  businessContext,
  requireFeature("products"),
  getDistributorPrice
);

// Rutas protegidas (solo admin) - con upload de imagen
router.post(
  "/",
  protect,
  businessContext,
  requireFeature("products"),
  admin,
  upload.single("image"),
  createProduct
);
router.put(
  "/:id",
  protect,
  businessContext,
  requireFeature("products"),
  admin,
  upload.single("image"),
  updateProduct
);
router.delete(
  "/:id",
  protect,
  businessContext,
  requireFeature("products"),
  admin,
  deleteProduct
);

export default router;
