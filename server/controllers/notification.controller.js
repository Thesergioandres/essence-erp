import Notification from "../models/Notification.js";
import { logApiError, logApiInfo } from "../utils/logger.js";

/**
 * @desc    Obtener notificaciones del usuario actual
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res) => {
  const requestId = req.reqId;
  const businessId = req.businessId;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    const { read, type, limit = 50, page = 1 } = req.query;

    // Filtro base: notificaciones del negocio dirigidas al usuario o a su rol
    const filter = {
      business: businessId,
      $or: [
        { user: userId },
        { user: null, targetRole: "all" },
        {
          user: null,
          targetRole:
            userRole === "admin" || userRole === "super_admin"
              ? "admin"
              : userRole,
        },
      ],
    };

    if (read !== undefined) {
      filter.read = read === "true";
    }

    if (type) {
      filter.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, read: false }),
    ]);

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      requestId,
    });
  } catch (error) {
    logApiError({
      message: "Error al obtener notificaciones",
      module: "notification",
      requestId,
      businessId,
      userId,
      stack: error.stack,
    });
    res.status(500).json({
      message: error.message,
      requestId,
    });
  }
};

/**
 * @desc    Marcar notificación como leída
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res) => {
  const requestId = req.reqId;
  const businessId = req.businessId;
  const userId = req.user?.id;

  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        business: businessId,
        $or: [{ user: userId }, { user: null }],
      },
      {
        read: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notificación no encontrada",
        requestId,
      });
    }

    res.json({
      success: true,
      notification,
      requestId,
    });
  } catch (error) {
    logApiError({
      message: "Error al marcar notificación como leída",
      module: "notification",
      requestId,
      businessId,
      userId,
      stack: error.stack,
    });
    res.status(500).json({
      message: error.message,
      requestId,
    });
  }
};

/**
 * @desc    Marcar todas las notificaciones como leídas
 * @route   POST /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req, res) => {
  const requestId = req.reqId;
  const businessId = req.businessId;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    const result = await Notification.updateMany(
      {
        business: businessId,
        read: false,
        $or: [
          { user: userId },
          { user: null, targetRole: "all" },
          {
            user: null,
            targetRole:
              userRole === "admin" || userRole === "super_admin"
                ? "admin"
                : userRole,
          },
        ],
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    logApiInfo({
      message: "notifications_marked_all_read",
      module: "notification",
      requestId,
      businessId,
      userId,
      extra: { count: result.modifiedCount },
    });

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      requestId,
    });
  } catch (error) {
    logApiError({
      message: "Error al marcar todas como leídas",
      module: "notification",
      requestId,
      businessId,
      userId,
      stack: error.stack,
    });
    res.status(500).json({
      message: error.message,
      requestId,
    });
  }
};

/**
 * @desc    Crear una notificación (uso interno/admin)
 * @route   POST /api/notifications
 * @access  Private/Admin
 */
export const createNotification = async (req, res) => {
  const requestId = req.reqId;
  const businessId = req.businessId;
  const userId = req.user?.id;

  try {
    const {
      type,
      title,
      message,
      priority,
      link,
      targetUserId,
      targetRole,
      data,
    } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        message: "Tipo, título y mensaje son obligatorios",
        requestId,
      });
    }

    const notification = await Notification.createWithLog(
      {
        business: businessId,
        user: targetUserId || null,
        targetRole: targetRole || "all",
        type,
        title,
        message,
        priority: priority || "medium",
        link,
        data,
      },
      requestId
    );

    res.status(201).json({
      success: true,
      notification,
      requestId,
    });
  } catch (error) {
    logApiError({
      message: "Error al crear notificación",
      module: "notification",
      requestId,
      businessId,
      userId,
      stack: error.stack,
    });
    res.status(500).json({
      message: error.message,
      requestId,
    });
  }
};

/**
 * @desc    Eliminar una notificación
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res) => {
  const requestId = req.reqId;
  const businessId = req.businessId;
  const userId = req.user?.id;

  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      business: businessId,
      $or: [{ user: userId }, { user: null }],
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notificación no encontrada",
        requestId,
      });
    }

    res.json({
      success: true,
      message: "Notificación eliminada",
      requestId,
    });
  } catch (error) {
    logApiError({
      message: "Error al eliminar notificación",
      module: "notification",
      requestId,
      businessId,
      userId,
      stack: error.stack,
    });
    res.status(500).json({
      message: error.message,
      requestId,
    });
  }
};

/**
 * @desc    Obtener contador de no leídas
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = async (req, res) => {
  const requestId = req.reqId;
  const businessId = req.businessId;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    const count = await Notification.countDocuments({
      business: businessId,
      read: false,
      $or: [
        { user: userId },
        { user: null, targetRole: "all" },
        {
          user: null,
          targetRole:
            userRole === "admin" || userRole === "super_admin"
              ? "admin"
              : userRole,
        },
      ],
    });

    res.json({
      success: true,
      unreadCount: count,
      requestId,
    });
  } catch (error) {
    logApiError({
      message: "Error al obtener contador de no leídas",
      module: "notification",
      requestId,
      businessId,
      userId,
      stack: error.stack,
    });
    res.status(500).json({
      message: error.message,
      requestId,
    });
  }
};

/**
 * @desc    Limpiar notificaciones antiguas (admin)
 * @route   DELETE /api/notifications/cleanup
 * @access  Private/Admin
 */
export const cleanupOldNotifications = async (req, res) => {
  const requestId = req.reqId;
  const businessId = req.businessId;
  const userId = req.user?.id;

  try {
    const { daysOld = 30 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

    const result = await Notification.deleteMany({
      business: businessId,
      createdAt: { $lt: cutoffDate },
      read: true,
    });

    logApiInfo({
      message: "notifications_cleanup",
      module: "notification",
      requestId,
      businessId,
      userId,
      extra: { deletedCount: result.deletedCount, daysOld },
    });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
      requestId,
    });
  } catch (error) {
    logApiError({
      message: "Error en limpieza de notificaciones",
      module: "notification",
      requestId,
      businessId,
      userId,
      stack: error.stack,
    });
    res.status(500).json({
      message: error.message,
      requestId,
    });
  }
};
