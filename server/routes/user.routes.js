import express from "express";
import { getAllUsers } from "../controllers/auth.controller.js";
import {
  activateUser,
  deleteUser,
  extendSubscription,
  listUsers,
  pauseSubscription,
  resumeSubscription,
  suspendUser,
} from "../controllers/userAccess.controller.js";
import { admin, god, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// @route   GET /api/users
// @desc    Obtener todos los usuarios
// @access  Private/Admin
router.get("/", protect, admin, getAllUsers);

// Panel GOD
router.get("/god/all", protect, god, listUsers);
router.post("/god/:id/activate", protect, god, activateUser);
router.post("/god/:id/suspend", protect, god, suspendUser);
router.post("/god/:id/delete", protect, god, deleteUser);
router.post("/god/:id/extend", protect, god, extendSubscription);
router.post("/god/:id/pause", protect, god, pauseSubscription);
router.post("/god/:id/resume", protect, god, resumeSubscription);

export default router;
