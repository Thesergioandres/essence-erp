import express from "express";
import { protect } from "../../../../middleware/auth.middleware.js";
import { getProfile, login, register } from "../controllers/AuthController.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/profile", protect, getProfile);

export default router;
