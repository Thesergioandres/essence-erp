import { notificationUseCases } from "../../../application/use-cases/notifications/buildNotificationUseCases.js";

const {
  sendNotificationUseCase,
  getPendingNotificationsUseCase,
  markAsViewedUseCase,
  markAllAsViewedUseCase,
  getNotificationHistoryUseCase,
} = notificationUseCases;

const resolveBusinessId = (req) =>
  req.businessId || req.headers["x-business-id"];
const resolveUserId = (req) => String(req.user?._id || req.user?.id || "");
const resolveRole = (req) =>
  String(req.membership?.role || req.user?.role || "");

const resolveErrorStatus = (error) => {
  if (error?.statusCode) return error.statusCode;
  if (error?.name === "ValidationError") return 400;
  if (error?.name === "CastError") return 400;
  return 500;
};

export class NotificationController {
  async getPending(req, res) {
    try {
      const businessId = resolveBusinessId(req);
      const userId = resolveUserId(req);

      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const result = await getPendingNotificationsUseCase.execute({
        businessId,
        employeeId: userId,
        page: req.query?.page,
        limit: req.query?.limit,
      });

      res.json({
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount,
        pagination: result.pagination,
      });
    } catch (error) {
      const status = resolveErrorStatus(error);
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async getHistory(req, res) {
    try {
      const businessId = resolveBusinessId(req);
      const userId = resolveUserId(req);
      const userRole = resolveRole(req);

      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const result = await getNotificationHistoryUseCase.execute({
        businessId,
        userId,
        userRole,
        page: req.query?.page,
        limit: req.query?.limit,
      });

      res.json({
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount,
        pagination: result.pagination,
      });
    } catch (error) {
      const status = resolveErrorStatus(error);
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async send(req, res) {
    try {
      const businessId = resolveBusinessId(req);
      const senderId = resolveUserId(req);
      const senderRole = resolveRole(req);

      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, message: "Falta x-business-id" });
      }

      const result = await sendNotificationUseCase.execute({
        businessId,
        senderId,
        senderRole,
        payload: req.body || {},
      });

      res.status(201).json({
        success: true,
        message: "Notificación enviada exitosamente",
        data: result.notification,
        targetCount: result.targetCount,
      });
    } catch (error) {
      const status = resolveErrorStatus(error);
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async markAsViewed(req, res) {
    try {
      const businessId = resolveBusinessId(req);
      const userId = resolveUserId(req);

      const notification = await markAsViewedUseCase.execute({
        businessId,
        employeeId: userId,
        notificationId: req.params.id,
      });

      res.json({ success: true, data: notification });
    } catch (error) {
      const status = resolveErrorStatus(error);
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async markAllAsViewed(req, res) {
    try {
      const businessId = resolveBusinessId(req);
      const userId = resolveUserId(req);
      const userRole = resolveRole(req);

      const result = await markAllAsViewedUseCase.execute({
        businessId,
        userId,
        userRole,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      const status = resolveErrorStatus(error);
      res.status(status).json({ success: false, message: error.message });
    }
  }

  // Legacy handlers (compatibilidad con frontend previo)
  async getAll(req, res) {
    if (req.query?.read === "false" || req.query?.unreadOnly === "true") {
      return this.getPending(req, res);
    }

    return this.getHistory(req, res);
  }

  async create(req, res) {
    return this.send(req, res);
  }

  async markAsRead(req, res) {
    return this.markAsViewed(req, res);
  }

  async markAllAsRead(req, res) {
    return this.markAllAsViewed(req, res);
  }
}
