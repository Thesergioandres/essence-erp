import mongoose from "mongoose";

const isValidObjectId = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

export class MarkAsViewedUseCase {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute({ businessId, employeeId, notificationId }) {
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

    if (!notificationId || !isValidObjectId(String(notificationId))) {
      const err = new Error("Notificación inválida");
      err.statusCode = 400;
      throw err;
    }

    return this.notificationRepository.markAsViewed(
      notificationId,
      businessId,
      employeeId,
    );
  }
}

export default MarkAsViewedUseCase;
