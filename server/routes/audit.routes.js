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
import { protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../middleware/business.middleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación de admin y negocio seleccionado
router.use(
  protect,
  businessContext,
  requireFeature("reports"),
  requirePermission({ module: "analytics", action: "read" })
);

router.get("/logs", getAuditLogs);
router.get("/logs/:id", getAuditLogById);
router.get("/daily-summary", getDailySummary);
router.get("/user-activity/:userId", getUserActivity);
router.get("/entity-history/:entityType/:entityId", getEntityHistory);
router.get("/stats", getAuditStats);
router.delete(
  "/cleanup",
  requirePermission({ module: "analytics", action: "delete" }),
  cleanupOldLogs
);

export default router;
