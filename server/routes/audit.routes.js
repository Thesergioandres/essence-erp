import express from "express";
import {
  cleanupOldLogs,
  getAuditLogById,
  getAuditLogs,
  getAuditStats,
  getDailySummary,
  getEntityHistory,
  getUserActivity,
} from "../controllers/audit.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
} from "../middleware/business.middleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación de admin y negocio seleccionado
router.use(protect, businessContext, requireFeature("reports"), admin);

router.get("/logs", getAuditLogs);
router.get("/logs/:id", getAuditLogById);
router.get("/daily-summary", getDailySummary);
router.get("/user-activity/:userId", getUserActivity);
router.get("/entity-history/:entityType/:entityId", getEntityHistory);
router.get("/stats", getAuditStats);
router.delete("/cleanup", cleanupOldLogs);

export default router;
