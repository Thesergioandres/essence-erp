import express from "express";
import upload from "../config/multer.js";
import { deleteImage, uploadImage } from "../controllers/upload.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Subir imagen: requiere login (no admin)
router.post("/", protect, upload.single("image"), uploadImage);
// Eliminar imagen: mantener restricción de admin
router.delete("/:publicId", protect, admin, deleteImage);

export default router;
