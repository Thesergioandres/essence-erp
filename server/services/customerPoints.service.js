/**
 * Servicio de puntos de fidelización para clientes
 * Gestiona acumulación, redención y consulta de puntos
 */

import Customer from "../models/Customer.js";
import { logApiError, logApiInfo } from "../utils/logger.js";

// Configuración por defecto
const DEFAULT_CONFIG = {
  pointsPerDollar: 1, // 1 punto por cada $1 gastado
  pointValue: 0.01, // Cada punto vale $0.01
  minPointsToRedeem: 100, // Mínimo 100 puntos para canjear
  maxRedemptionPercent: 50, // Máximo 50% del total puede pagarse con puntos
  expirationMonths: 12, // Puntos expiran en 12 meses
};

/**
 * Calcula los puntos ganados por una compra
 */
export function calculatePointsEarned(amount, config = DEFAULT_CONFIG) {
  if (amount <= 0) return 0;
  return Math.floor(amount * config.pointsPerDollar);
}

/**
 * Calcula el valor monetario de los puntos
 */
export function calculatePointsValue(points, config = DEFAULT_CONFIG) {
  if (points <= 0) return 0;
  return points * config.pointValue;
}

/**
 * Calcula los puntos necesarios para un monto
 */
export function calculatePointsNeeded(amount, config = DEFAULT_CONFIG) {
  if (amount <= 0) return 0;
  return Math.ceil(amount / config.pointValue);
}

/**
 * Acumula puntos para un cliente después de una venta
 */
export async function accumulatePoints(
  customerId,
  saleAmount,
  saleId,
  requestId,
  config = DEFAULT_CONFIG
) {
  try {
    const pointsEarned = calculatePointsEarned(saleAmount, config);

    if (pointsEarned <= 0) {
      return { success: true, pointsEarned: 0 };
    }

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      {
        $inc: { points: pointsEarned, totalPointsEarned: pointsEarned },
        $push: {
          pointsHistory: {
            type: "earned",
            amount: pointsEarned,
            balance: 0, // Se actualizará después
            description: `Compra #${saleId}`,
            reference: saleId,
            referenceModel: "Sale",
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!customer) {
      logApiError("Customer not found for points", null, requestId, {
        customerId,
      });
      return { success: false, error: "Cliente no encontrado" };
    }

    // Actualizar balance en el historial
    await Customer.updateOne(
      { _id: customerId, "pointsHistory.reference": saleId },
      { $set: { "pointsHistory.$.balance": customer.points } }
    );

    logApiInfo("Points accumulated", requestId, {
      customerId,
      pointsEarned,
      newBalance: customer.points,
    });

    return {
      success: true,
      pointsEarned,
      newBalance: customer.points,
    };
  } catch (error) {
    logApiError("accumulatePoints failed", error, requestId, { customerId });
    return { success: false, error: error.message };
  }
}

/**
 * Redime puntos de un cliente
 */
export async function redeemPoints(
  customerId,
  pointsToRedeem,
  saleId,
  requestId,
  config = DEFAULT_CONFIG
) {
  try {
    // Validaciones
    if (pointsToRedeem < config.minPointsToRedeem) {
      return {
        success: false,
        error: `Mínimo ${config.minPointsToRedeem} puntos para canjear`,
      };
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return { success: false, error: "Cliente no encontrado" };
    }

    if (customer.points < pointsToRedeem) {
      return {
        success: false,
        error: `Puntos insuficientes. Disponibles: ${customer.points}`,
      };
    }

    const monetaryValue = calculatePointsValue(pointsToRedeem, config);

    // Descontar puntos
    customer.points -= pointsToRedeem;
    customer.totalPointsRedeemed =
      (customer.totalPointsRedeemed || 0) + pointsToRedeem;
    customer.pointsHistory.push({
      type: "redeemed",
      amount: -pointsToRedeem,
      balance: customer.points,
      description: `Canje en venta #${saleId}`,
      reference: saleId,
      referenceModel: "Sale",
      createdAt: new Date(),
    });

    await customer.save();

    logApiInfo("Points redeemed", requestId, {
      customerId,
      pointsRedeemed: pointsToRedeem,
      monetaryValue,
      newBalance: customer.points,
    });

    return {
      success: true,
      pointsRedeemed: pointsToRedeem,
      monetaryValue,
      newBalance: customer.points,
    };
  } catch (error) {
    logApiError("redeemPoints failed", error, requestId, { customerId });
    return { success: false, error: error.message };
  }
}

/**
 * Ajusta puntos manualmente (bonificación o corrección)
 */
export async function adjustPoints(
  customerId,
  pointsAdjustment,
  reason,
  userId,
  requestId
) {
  try {
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return { success: false, error: "Cliente no encontrado" };
    }

    const newBalance = customer.points + pointsAdjustment;

    if (newBalance < 0) {
      return { success: false, error: "El balance no puede ser negativo" };
    }

    customer.points = newBalance;
    if (pointsAdjustment > 0) {
      customer.totalPointsEarned =
        (customer.totalPointsEarned || 0) + pointsAdjustment;
    }

    customer.pointsHistory.push({
      type: pointsAdjustment > 0 ? "bonus" : "adjustment",
      amount: pointsAdjustment,
      balance: newBalance,
      description: reason,
      adjustedBy: userId,
      createdAt: new Date(),
    });

    await customer.save();

    logApiInfo("Points adjusted", requestId, {
      customerId,
      adjustment: pointsAdjustment,
      reason,
      newBalance,
      adjustedBy: userId,
    });

    return {
      success: true,
      adjustment: pointsAdjustment,
      newBalance,
    };
  } catch (error) {
    logApiError("adjustPoints failed", error, requestId, { customerId });
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene el historial de puntos de un cliente
 */
export async function getPointsHistory(customerId, options = {}) {
  const { limit = 50, skip = 0 } = options;

  const customer = await Customer.findById(customerId)
    .select("points totalPointsEarned totalPointsRedeemed pointsHistory")
    .lean();

  if (!customer) {
    return null;
  }

  const history = (customer.pointsHistory || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(skip, skip + limit);

  return {
    currentPoints: customer.points || 0,
    totalEarned: customer.totalPointsEarned || 0,
    totalRedeemed: customer.totalPointsRedeemed || 0,
    history,
    totalRecords: customer.pointsHistory?.length || 0,
  };
}

/**
 * Expira puntos antiguos
 */
export async function expireOldPoints(
  businessId,
  requestId,
  config = DEFAULT_CONFIG
) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - config.expirationMonths);

    // Buscar clientes con puntos que tienen historial antiguo sin actividad
    const customers = await Customer.find({
      business: businessId,
      points: { $gt: 0 },
      updatedAt: { $lt: cutoffDate },
    });

    let totalExpired = 0;

    for (const customer of customers) {
      const expiredPoints = customer.points;
      customer.points = 0;
      customer.pointsHistory.push({
        type: "expired",
        amount: -expiredPoints,
        balance: 0,
        description: `Puntos expirados por inactividad (${config.expirationMonths} meses)`,
        createdAt: new Date(),
      });
      await customer.save();
      totalExpired += expiredPoints;
    }

    logApiInfo("Points expiration completed", requestId, {
      businessId,
      customersAffected: customers.length,
      totalPointsExpired: totalExpired,
    });

    return {
      customersAffected: customers.length,
      totalPointsExpired: totalExpired,
    };
  } catch (error) {
    logApiError("expireOldPoints failed", error, requestId, { businessId });
    throw error;
  }
}

/**
 * Valida si un cliente puede redimir puntos en una venta
 */
export function validateRedemption(
  customerPoints,
  pointsToRedeem,
  saleTotal,
  config = DEFAULT_CONFIG
) {
  const errors = [];

  if (pointsToRedeem < config.minPointsToRedeem) {
    errors.push(`Mínimo ${config.minPointsToRedeem} puntos para canjear`);
  }

  if (pointsToRedeem > customerPoints) {
    errors.push(`Puntos insuficientes. Disponibles: ${customerPoints}`);
  }

  const maxRedeemable = Math.floor(
    saleTotal * (config.maxRedemptionPercent / 100)
  );
  const redemptionValue = calculatePointsValue(pointsToRedeem, config);

  if (redemptionValue > maxRedeemable) {
    const maxPoints = calculatePointsNeeded(maxRedeemable, config);
    errors.push(
      `Máximo ${maxPoints} puntos (${config.maxRedemptionPercent}% del total)`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    redemptionValue: errors.length === 0 ? redemptionValue : 0,
  };
}

export default {
  calculatePointsEarned,
  calculatePointsValue,
  calculatePointsNeeded,
  accumulatePoints,
  redeemPoints,
  adjustPoints,
  getPointsHistory,
  expireOldPoints,
  validateRedemption,
  DEFAULT_CONFIG,
};
