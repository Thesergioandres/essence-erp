/**
 * Controlador de suscripciones push
 */

import PushSubscription from "../models/PushSubscription.js";
import { logApiError, logApiInfo } from "../utils/logger.js";

/**
 * POST /api/notifications/subscribe
 * Registra una nueva suscripción push
 */
export const subscribePush = async (req, res) => {
  const requestId = req.requestId;

  try {
    const { subscription, userAgent } = req.body;
    const userId = req.user._id;
    const businessId = req.businessId;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: "Datos de suscripción inválidos",
        requestId,
      });
    }

    // Upsert subscription
    const pushSub = await PushSubscription.findOneAndUpdate(
      {
        user: userId,
        "subscription.endpoint": subscription.endpoint,
      },
      {
        user: userId,
        business: businessId,
        subscription,
        userAgent,
        active: true,
        lastUsed: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    logApiInfo("Push subscription registered", requestId, {
      userId,
      subscriptionId: pushSub._id,
    });

    res.status(201).json({
      success: true,
      message: "Suscripción registrada",
      data: { id: pushSub._id },
      requestId,
    });
  } catch (error) {
    logApiError("subscribePush failed", error, requestId);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Suscripción ya existe",
        requestId,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al registrar suscripción",
      requestId,
    });
  }
};

/**
 * POST /api/notifications/unsubscribe
 * Desactiva una suscripción push
 */
export const unsubscribePush = async (req, res) => {
  const requestId = req.requestId;

  try {
    const { endpoint } = req.body;
    const userId = req.user._id;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: "Endpoint requerido",
        requestId,
      });
    }

    const result = await PushSubscription.findOneAndUpdate(
      {
        user: userId,
        "subscription.endpoint": endpoint,
      },
      {
        active: false,
      }
    );

    logApiInfo("Push subscription deactivated", requestId, {
      userId,
      found: !!result,
    });

    res.json({
      success: true,
      message: "Suscripción desactivada",
      requestId,
    });
  } catch (error) {
    logApiError("unsubscribePush failed", error, requestId);
    res.status(500).json({
      success: false,
      message: "Error al desactivar suscripción",
      requestId,
    });
  }
};

/**
 * GET /api/notifications/subscriptions
 * Lista las suscripciones del usuario
 */
export const getSubscriptions = async (req, res) => {
  const requestId = req.requestId;

  try {
    const userId = req.user._id;

    const subscriptions = await PushSubscription.find({
      user: userId,
      active: true,
    }).select("userAgent preferences lastUsed createdAt");

    res.json({
      success: true,
      data: subscriptions,
      requestId,
    });
  } catch (error) {
    logApiError("getSubscriptions failed", error, requestId);
    res.status(500).json({
      success: false,
      message: "Error al obtener suscripciones",
      requestId,
    });
  }
};

/**
 * PATCH /api/notifications/preferences
 * Actualiza preferencias de notificación
 */
export const updatePreferences = async (req, res) => {
  const requestId = req.requestId;

  try {
    const { preferences } = req.body;
    const userId = req.user._id;

    if (!preferences || typeof preferences !== "object") {
      return res.status(400).json({
        success: false,
        message: "Preferencias inválidas",
        requestId,
      });
    }

    await PushSubscription.updateMany(
      { user: userId, active: true },
      { $set: { preferences } }
    );

    logApiInfo("Push preferences updated", requestId, { userId });

    res.json({
      success: true,
      message: "Preferencias actualizadas",
      requestId,
    });
  } catch (error) {
    logApiError("updatePreferences failed", error, requestId);
    res.status(500).json({
      success: false,
      message: "Error al actualizar preferencias",
      requestId,
    });
  }
};

/**
 * DELETE /api/notifications/subscriptions/:id
 * Elimina una suscripción específica
 */
export const deleteSubscription = async (req, res) => {
  const requestId = req.requestId;

  try {
    const { id } = req.params;
    const userId = req.user._id;

    const result = await PushSubscription.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Suscripción no encontrada",
        requestId,
      });
    }

    logApiInfo("Push subscription deleted", requestId, {
      userId,
      subscriptionId: id,
    });

    res.json({
      success: true,
      message: "Suscripción eliminada",
      requestId,
    });
  } catch (error) {
    logApiError("deleteSubscription failed", error, requestId);
    res.status(500).json({
      success: false,
      message: "Error al eliminar suscripción",
      requestId,
    });
  }
};

/**
 * GET /api/push/vapid-key
 * Devuelve la clave pública VAPID para el cliente
 */
export const getVapidPublicKey = async (req, res) => {
  const requestId = req.requestId;

  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;

    if (!publicKey) {
      return res.status(503).json({
        success: false,
        message: "Push notifications not configured",
        requestId,
      });
    }

    logApiInfo("VAPID public key requested", requestId);

    res.json({
      success: true,
      publicKey,
    });
  } catch (error) {
    logApiError("getVapidPublicKey failed", error, requestId);
    res.status(500).json({
      success: false,
      message: "Error al obtener clave VAPID",
      requestId,
    });
  }
};
