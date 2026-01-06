/**
 * Controlador para el sistema de puntos de clientes
 */

import { v4 as uuidv4 } from "uuid";
import Customer from "../models/Customer.js";
import customerPointsService from "../services/customerPoints.service.js";
import { logApiError, logApiInfo } from "../utils/logger.js";

const resolveBusinessId = (req) =>
  req.businessId || req.headers["x-business-id"] || req.query.businessId;

/**
 * GET /api/customers/:customerId/points
 * Obtiene el balance y resumen de puntos de un cliente
 */
export const getCustomerPoints = async (req, res) => {
  const requestId = uuidv4();
  try {
    const { customerId } = req.params;
    const businessId = resolveBusinessId(req);

    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      business: businessId,
    }).select("name points totalPointsEarned totalPointsRedeemed");

    if (!customer) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    logApiInfo("getCustomerPoints", requestId, { customerId });

    res.json({
      customerId,
      name: customer.name,
      currentPoints: customer.points || 0,
      totalEarned: customer.totalPointsEarned || 0,
      totalRedeemed: customer.totalPointsRedeemed || 0,
      pointValue: customerPointsService.DEFAULT_CONFIG.pointValue,
      monetaryValue: customerPointsService.calculatePointsValue(
        customer.points || 0
      ),
    });
  } catch (error) {
    logApiError("getCustomerPoints", error, requestId);
    res
      .status(500)
      .json({ message: "Error al obtener puntos", error: error.message });
  }
};

/**
 * GET /api/customers/:customerId/points/history
 * Obtiene el historial de puntos de un cliente
 */
export const getPointsHistory = async (req, res) => {
  const requestId = uuidv4();
  try {
    const { customerId } = req.params;
    const businessId = resolveBusinessId(req);
    const { limit = 50, skip = 0 } = req.query;

    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    // Verificar que el cliente pertenece al negocio
    const customerExists = await Customer.findOne({
      _id: customerId,
      business: businessId,
    }).select("_id");

    if (!customerExists) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const history = await customerPointsService.getPointsHistory(customerId, {
      limit: parseInt(limit, 10),
      skip: parseInt(skip, 10),
    });

    logApiInfo("getPointsHistory", requestId, {
      customerId,
      records: history?.totalRecords,
    });

    res.json(history);
  } catch (error) {
    logApiError("getPointsHistory", error, requestId);
    res
      .status(500)
      .json({ message: "Error al obtener historial", error: error.message });
  }
};

/**
 * POST /api/customers/:customerId/points/adjust
 * Ajusta manualmente los puntos de un cliente (bonus o corrección)
 */
export const adjustPoints = async (req, res) => {
  const requestId = uuidv4();
  try {
    const { customerId } = req.params;
    const businessId = resolveBusinessId(req);
    const { points, reason } = req.body;

    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    if (typeof points !== "number" || points === 0) {
      return res
        .status(400)
        .json({ message: "Puntos debe ser un número distinto de cero" });
    }

    if (!reason || reason.trim().length < 3) {
      return res
        .status(400)
        .json({ message: "Debe proporcionar una razón válida" });
    }

    // Verificar que el cliente pertenece al negocio
    const customerExists = await Customer.findOne({
      _id: customerId,
      business: businessId,
    }).select("_id");

    if (!customerExists) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const result = await customerPointsService.adjustPoints(
      customerId,
      points,
      reason.trim(),
      req.user?._id,
      requestId
    );

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    logApiInfo("adjustPoints", requestId, { customerId, points, reason });

    res.json({
      message: points > 0 ? "Puntos bonificados" : "Puntos ajustados",
      ...result,
    });
  } catch (error) {
    logApiError("adjustPoints", error, requestId);
    res
      .status(500)
      .json({ message: "Error al ajustar puntos", error: error.message });
  }
};

/**
 * POST /api/customers/:customerId/points/validate-redemption
 * Valida si un cliente puede canjear cierta cantidad de puntos
 */
export const validateRedemption = async (req, res) => {
  const requestId = uuidv4();
  try {
    const { customerId } = req.params;
    const businessId = resolveBusinessId(req);
    const { points, saleTotal } = req.body;

    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    if (typeof points !== "number" || points <= 0) {
      return res
        .status(400)
        .json({ message: "Puntos debe ser un número positivo" });
    }

    if (typeof saleTotal !== "number" || saleTotal <= 0) {
      return res
        .status(400)
        .json({ message: "Total de venta debe ser positivo" });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      business: businessId,
    }).select("points");

    if (!customer) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const validation = customerPointsService.validateRedemption(
      customer.points,
      points,
      saleTotal
    );

    logApiInfo("validateRedemption", requestId, {
      customerId,
      points,
      saleTotal,
      valid: validation.valid,
    });

    res.json({
      ...validation,
      customerPoints: customer.points,
    });
  } catch (error) {
    logApiError("validateRedemption", error, requestId);
    res
      .status(500)
      .json({ message: "Error al validar redención", error: error.message });
  }
};

/**
 * POST /api/points/expire
 * Expira puntos antiguos de todos los clientes de un negocio (cron job o admin)
 */
export const expirePoints = async (req, res) => {
  const requestId = uuidv4();
  try {
    const businessId = resolveBusinessId(req);

    if (!businessId) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    // Solo admin o superadmin puede ejecutar esto
    if (!["admin", "superadmin", "god"].includes(req.user?.role)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const result = await customerPointsService.expireOldPoints(
      businessId,
      requestId
    );

    logApiInfo("expirePoints", requestId, { businessId, ...result });

    res.json({
      message: "Expiración de puntos completada",
      ...result,
    });
  } catch (error) {
    logApiError("expirePoints", error, requestId);
    res
      .status(500)
      .json({ message: "Error al expirar puntos", error: error.message });
  }
};

/**
 * GET /api/points/config
 * Obtiene la configuración de puntos del sistema
 */
export const getPointsConfig = async (req, res) => {
  const requestId = uuidv4();
  try {
    logApiInfo("getPointsConfig", requestId);

    res.json({
      config: customerPointsService.DEFAULT_CONFIG,
      description: {
        pointsPerDollar: "Puntos ganados por cada $1 de compra",
        pointValue: "Valor monetario de cada punto ($)",
        minPointsToRedeem: "Mínimo de puntos requerido para canjear",
        maxRedemptionPercent:
          "Porcentaje máximo del total que puede pagarse con puntos",
        expirationMonths:
          "Meses de inactividad antes de que expiren los puntos",
      },
    });
  } catch (error) {
    logApiError("getPointsConfig", error, requestId);
    res.status(500).json({ message: "Error al obtener configuración" });
  }
};

export default {
  getCustomerPoints,
  getPointsHistory,
  adjustPoints,
  validateRedemption,
  expirePoints,
  getPointsConfig,
};
