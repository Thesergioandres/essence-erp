import mongoose from "mongoose";
import { isEmployeeRole } from "../../../utils/roleAliases.js";

const isValidObjectId = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

export class GetNotificationHistoryUseCase {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute({ businessId, userId, userRole, page = 1, limit = 30 }) {
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
      return this.notificationRepository.findForEmployee(businessId, userId, {
        includeViewed: true,
        page,
        limit,
      });
    }

    return this.notificationRepository.findHistoryForBusiness(businessId, {
      page,
      limit,
    });
  }
}

export default GetNotificationHistoryUseCase;
