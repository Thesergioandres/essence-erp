import mongoose from "mongoose";
import { isEmployeeRole } from "../../../utils/roleAliases.js";

const isValidObjectId = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

export class MarkAllAsViewedUseCase {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute({ businessId, userId, userRole }) {
    if (!businessId || !isValidObjectId(String(businessId))) {
      const err = new Error("Negocio inválido");
      err.statusCode = 400;
      throw err;
    }

    if (!userId || !isValidObjectId(String(userId))) {
      const err = new Error("Usuario inválido");
      err.statusCode = 400;
      throw err;
    }

    if (isEmployeeRole(String(userRole || ""))) {
      return this.notificationRepository.markAllAsViewed(businessId, userId);
    }

    return this.notificationRepository.markAllAsRead(
      businessId,
      userId,
      userRole,
    );
  }
}

export default MarkAllAsViewedUseCase;
