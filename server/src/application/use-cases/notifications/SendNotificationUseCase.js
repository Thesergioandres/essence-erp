import mongoose from "mongoose";
import Membership from "../../../infrastructure/database/models/Membership.js";
import { employeeRoleQuery } from "../../../utils/roleAliases.js";

const SENDER_ALLOWED_ROLES = new Set(["admin", "super_admin", "god"]);
const PRIORITIES = new Set(["low", "medium", "high", "urgent"]);

const isValidObjectId = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const sanitizeText = (value) => String(value || "").trim();

const parseTargetEmployees = (rawValue) => {
  if (!Array.isArray(rawValue)) return [];

  return [...new Set(rawValue)]
    .map((value) => String(value || "").trim())
    .filter((value) => isValidObjectId(value));
};

export class SendNotificationUseCase {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute({ businessId, senderId, senderRole, payload = {} }) {
    if (!businessId || !isValidObjectId(String(businessId))) {
      const err = new Error("Negocio inválido para enviar notificación");
      err.statusCode = 400;
      throw err;
    }

    if (!senderId || !isValidObjectId(String(senderId))) {
      const err = new Error("Usuario emisor inválido");
      err.statusCode = 400;
      throw err;
    }

    if (!SENDER_ALLOWED_ROLES.has(String(senderRole || ""))) {
      const err = new Error(
        "Solo admin, super_admin o god pueden enviar notificaciones",
      );
      err.statusCode = 403;
      throw err;
    }

    const title = sanitizeText(payload.title);
    const message = sanitizeText(payload.message);

    if (title.length < 3 || title.length > 100) {
      const err = new Error("El título debe tener entre 3 y 100 caracteres");
      err.statusCode = 400;
      throw err;
    }

    if (message.length < 3 || message.length > 500) {
      const err = new Error("El mensaje debe tener entre 3 y 500 caracteres");
      err.statusCode = 400;
      throw err;
    }

    const sendToAll = payload.sendToAll === true;
    const selectedEmployees = parseTargetEmployees(payload.targetEmployees);

    if (!sendToAll && selectedEmployees.length === 0) {
      const err = new Error("Debes seleccionar al menos un empleado");
      err.statusCode = 400;
      throw err;
    }

    const membershipFilter = {
      business: businessId,
      role: employeeRoleQuery,
      status: "active",
      ...(sendToAll ? {} : { user: { $in: selectedEmployees } }),
    };

    const memberships = await Membership.find(membershipFilter)
      .select("user")
      .lean();

    const resolvedTargetEmployees = [
      ...new Set(
        memberships
          .map((membership) => String(membership?.user || "").trim())
          .filter((userId) => isValidObjectId(userId)),
      ),
    ];

    if (resolvedTargetEmployees.length === 0) {
      const err = new Error("No se encontraron empleados activos para enviar");
      err.statusCode = 404;
      throw err;
    }

    if (!sendToAll) {
      const missingEmployees = selectedEmployees.filter(
        (employeeId) => !resolvedTargetEmployees.includes(employeeId),
      );

      if (missingEmployees.length > 0) {
        const err = new Error(
          "Uno o más empleados no pertenecen al negocio actual",
        );
        err.statusCode = 400;
        throw err;
      }
    }

    const priority = PRIORITIES.has(String(payload.priority || ""))
      ? String(payload.priority)
      : "medium";

    const notification = await this.notificationRepository.create({
      business: businessId,
      sender: senderId,
      title,
      message,
      targetEmployees: resolvedTargetEmployees,
      viewedBy: [],
      priority,
      type: "system",
      user: null,
      targetRole: "employee",
      read: false,
      readAt: null,
      data: {
        origin: "manual_admin_notification",
        sendToAll,
      },
    });

    return {
      notification,
      targetCount: resolvedTargetEmployees.length,
      sendToAll,
    };
  }
}

export default SendNotificationUseCase;
