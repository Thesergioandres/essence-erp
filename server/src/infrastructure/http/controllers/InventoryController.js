import inventoryPersistenceUseCase from "../../../application/use-cases/repository-gateways/InventoryPersistenceUseCase.js";

const createHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeCreateEntryPayload = (payload = {}) => {
  const normalizedPayload = { ...payload };

  const quantity = Number(payload.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw createHttpError("Cantidad invalida", 400);
  }
  normalizedPayload.quantity = quantity;

  if (payload.unitCost !== undefined && payload.unitCost !== "") {
    const unitCost = Number(payload.unitCost);
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      throw createHttpError("unitCost invalido", 400);
    }
    normalizedPayload.unitCost = unitCost;
  } else {
    delete normalizedPayload.unitCost;
  }

  if (payload.additionalCosts !== undefined && payload.additionalCosts !== "") {
    if (!Array.isArray(payload.additionalCosts)) {
      const additionalCosts = Number(payload.additionalCosts);
      if (!Number.isFinite(additionalCosts) || additionalCosts < 0) {
        throw createHttpError("additionalCosts invalido", 400);
      }
      normalizedPayload.additionalCosts = additionalCosts;
    }
  } else {
    delete normalizedPayload.additionalCosts;
  }

  return normalizedPayload;
};

class InventoryController {
  async createEntry(req, res) {
    try {
      const businessId = req.businessId || req.headers["x-business-id"];
      if (!businessId)
        return res.status(400).json({ message: "Falta x-business-id" });

      const payload = normalizeCreateEntryPayload(req.body || {});

      const result = await inventoryPersistenceUseCase.createEntry(
        businessId,
        payload,
        req.user?.id || req.user?._id,
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async listEntries(req, res) {
    try {
      const businessId = req.businessId || req.headers["x-business-id"];
      if (!businessId)
        return res.status(400).json({ message: "Falta x-business-id" });

      const { page, limit, ...filters } = req.query;
      const result = await inventoryPersistenceUseCase.listEntries(
        businessId,
        filters,
        page,
        limit,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async updateEntry(req, res) {
    try {
      const businessId = req.businessId || req.headers["x-business-id"];
      if (!businessId)
        return res.status(400).json({ message: "Falta x-business-id" });

      const result = await inventoryPersistenceUseCase.updateEntry(
        businessId,
        req.params.id,
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async deleteEntry(req, res) {
    try {
      const businessId = req.businessId || req.headers["x-business-id"];
      if (!businessId)
        return res.status(400).json({ message: "Falta x-business-id" });

      const result = await inventoryPersistenceUseCase.deleteEntry(
        businessId,
        req.params.id,
        req.user?.id,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }
}

export default new InventoryController();
