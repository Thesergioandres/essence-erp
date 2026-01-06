import express from "express";
import {
  cleanupOldNotifications,
  createNotification,
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "../controllers/notification.controller.js";
import { runNotificationChecks } from "../jobs/notification.cron.js";
import { admin, protect } from "../middleware/auth.middleware.js";
import { businessContext } from "../middleware/business.middleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación y contexto de negocio
router.use(protect);
router.use(businessContext);

// Obtener contador de no leídas (ruta específica antes de :id)
router.get("/unread-count", getUnreadCount);

// Marcar todas como leídas
router.post("/read-all", markAllAsRead);

// Limpieza de notificaciones antiguas (solo admin)
router.delete("/cleanup", admin, cleanupOldNotifications);

// Ejecutar verificaciones manuales (créditos vencidos, stock bajo)
router.post("/run-checks", admin, async (req, res) => {
  try {
    const result = await runNotificationChecks();
    res.json({
      success: true,
      message: "Verificaciones ejecutadas correctamente",
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// CRUD de notificaciones
router.route("/").get(getNotifications).post(admin, createNotification);

router.route("/:id").delete(deleteNotification);

// Marcar como leída
router.patch("/:id/read", markAsRead);

export default router;
