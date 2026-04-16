import mongoose from "mongoose";

const isValidObjectId = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

export class GetPendingNotificationsUseCase {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute({ businessId, employeeId, page = 1, limit = 20 }) {
    if (!businessId || !isValidObjectId(String(businessId))) {
      const err = new Error("Negocio inválido");
      err.statusCode = 400;
      throw err;
    }

    if (!employeeId || !isValidObjectId(String(employeeId))) {
      const err = new Error("Empleado inválido");
      err.statusCode = 400;
      throw err;
    }

    return this.notificationRepository.findForEmployee(businessId, employeeId, {
      includeViewed: false,
      page,
      limit,
    });
  }
}

export default GetPendingNotificationsUseCase;
