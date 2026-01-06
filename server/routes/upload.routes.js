import express from "express";
import upload from "../config/multer.js";
import { deleteImage, uploadImage } from "../controllers/upload.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/business.middleware.js";

const router = express.Router();

// Subir imagen: requiere login y permiso de config/create
router.post(
  "/",
  protect,
  requirePermission({ module: "config", action: "create" }),
  upload.single("image"),
  uploadImage
);
// Eliminar imagen: mantener restricción de admin
router.delete(
  "/:publicId",
  protect,
  requirePermission({ module: "config", action: "delete" }),
  deleteImage
);

export default router;
