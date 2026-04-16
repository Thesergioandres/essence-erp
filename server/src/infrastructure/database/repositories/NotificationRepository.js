import { isEmployeeRole } from "../../../utils/roleAliases.js";
import Notification from "../models/Notification.js";

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const normalizePriority = (priority) => {
  if (["low", "medium", "high", "urgent"].includes(priority)) {
    return priority;
  }
  return "medium";
};

const buildEmployeeRecipientFilter = (employeeId) => ({
  $or: [
    { targetEmployees: employeeId },
    {
      $and: [{ "targetEmployees.0": { $exists: false } }, { user: employeeId }],
    },
    {
      $and: [
        { "targetEmployees.0": { $exists: false } },
        { user: null, targetRole: "employee" },
      ],
    },
    {
      $and: [
        { "targetEmployees.0": { $exists: false } },
        { user: null, targetRole: "all" },
      ],
    },
  ],
});

const enrichEmployeeViewState = (notification, employeeId) => {
  const viewedByEmployee = Array.isArray(notification.viewedBy)
    ? notification.viewedBy.some(
        (entry) => String(entry?.user) === String(employeeId),
      )
    : false;

  const hasExplicitTargets =
    Array.isArray(notification.targetEmployees) &&
    notification.targetEmployees.length > 0;

  const readState = hasExplicitTargets
    ? viewedByEmployee
    : viewedByEmployee || notification.read === true;

  return {
    ...notification,
    viewed: viewedByEmployee,
    read: readState,
  };
};

export class NotificationRepository {
  async findForEmployee(businessId, employeeId, options = {}) {
    const page = toPositiveInt(options.page, 1);
    const limit = Math.min(toPositiveInt(options.limit, 20), 100);
    const skip = (page - 1) * limit;
    const includeViewed = options.includeViewed === true;

    const baseFilter = {
      business: businessId,
      ...buildEmployeeRecipientFilter(employeeId),
    };

    const pendingFilter = {
      $or: [
        {
          "targetEmployees.0": { $exists: true },
          "viewedBy.user": { $ne: employeeId },
        },
        {
          $and: [
            { "targetEmployees.0": { $exists: false } },
            { "viewedBy.user": { $ne: employeeId } },
            { read: { $ne: true } },
          ],
        },
      ],
    };

    const historyFilter = includeViewed
      ? baseFilter
      : {
          ...baseFilter,
          ...pendingFilter,
        };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(historyFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "name email role")
        .lean(),
      Notification.countDocuments(historyFilter),
      Notification.countDocuments({
        ...baseFilter,
        ...pendingFilter,
      }),
    ]);

    return {
      notifications: notifications.map((item) =>
        enrichEmployeeViewState(item, employeeId),
      ),
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findHistoryForBusiness(businessId, options = {}) {
    const page = toPositiveInt(options.page, 1);
    const limit = Math.min(toPositiveInt(options.limit, 30), 100);
    const skip = (page - 1) * limit;

    const filter = {
      business: businessId,
      sender: { $ne: null },
    };

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "name email role")
        .populate("targetEmployees", "name email")
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findByUser(businessId, userId, userRole, filters = {}) {
    if (isEmployeeRole(userRole)) {
      const includeViewed = filters.read === "false" ? false : true;
      const result = await this.findForEmployee(businessId, userId, {
        includeViewed,
        page: filters.page,
        limit: filters.limit,
      });

      if (filters.read === "true") {
        return {
          ...result,
          notifications: result.notifications.filter((item) => item.read),
        };
      }

      return result;
    }

    const roleTarget =
      userRole === "admin" || userRole === "super_admin" || userRole === "god"
        ? "admin"
        : userRole;

    const filter = {
      business: businessId,
      $or: [
        { user: userId },
        { sender: userId },
        { user: null, targetRole: "all" },
        { user: null, targetRole: roleTarget },
      ],
    };

    if (filters.read !== undefined) {
      filter.read = filters.read === "true";
    }

    if (filters.type) {
      filter.type = filters.type;
    }

    const page = toPositiveInt(filters.page, 1);
    const limit = Math.min(toPositiveInt(filters.limit, 50), 100);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "name email role")
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, read: false }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async create(data) {
    const payload = {
      ...data,
      priority: normalizePriority(data?.priority),
      read: data?.read === true,
      readAt: data?.read === true ? new Date() : null,
    };

    const notification = await Notification.create(payload);
    return notification;
  }

  async markAsViewed(id, businessId, employeeId) {
    const notification = await Notification.findOne({
      _id: id,
      business: businessId,
      ...buildEmployeeRecipientFilter(employeeId),
    });

    if (!notification) {
      const err = new Error("Notificación no encontrada");
      err.statusCode = 404;
      throw err;
    }

    notification.markViewedBy(employeeId);
    await notification.save();

    return notification;
  }

  async markAllAsViewed(businessId, employeeId) {
    const pending = await Notification.find({
      business: businessId,
      ...buildEmployeeRecipientFilter(employeeId),
      read: { $ne: true },
      "viewedBy.user": { $ne: employeeId },
    })
      .select("_id")
      .lean();

    if (pending.length === 0) {
      return { modifiedCount: 0 };
    }

    const now = new Date();
    const updates = pending.map((notification) => ({
      updateOne: {
        filter: {
          _id: notification._id,
          business: businessId,
          "viewedBy.user": { $ne: employeeId },
        },
        update: {
          $push: { viewedBy: { user: employeeId, viewedAt: now } },
        },
      },
    }));

    const result = await Notification.bulkWrite(updates, { ordered: false });
    return { modifiedCount: result.modifiedCount || 0 };
  }

  async markAsRead(id, businessId, userId) {
    return this.markAsViewed(id, businessId, userId);
  }

  async markAllAsRead(businessId, userId, userRole) {
    if (isEmployeeRole(userRole)) {
      return this.markAllAsViewed(businessId, userId);
    }

    const result = await Notification.updateMany(
      {
        business: businessId,
        read: false,
        $or: [
          { user: userId },
          { user: null, targetRole: "all" },
          { user: null, targetRole: "admin" },
        ],
      },
      {
        read: true,
        readAt: new Date(),
      },
    );

    return { modifiedCount: result.modifiedCount || 0 };
  }

  async delete(id, businessId) {
    const notification = await Notification.findOneAndDelete({
      _id: id,
      business: businessId,
    });

    if (!notification) {
      const err = new Error("Notificación no encontrada");
      err.statusCode = 404;
      throw err;
    }

    return notification;
  }
}
