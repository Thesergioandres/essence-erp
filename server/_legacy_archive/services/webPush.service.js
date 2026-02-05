/**
 * Web Push Notification Service
 * Envía notificaciones push a los clientes suscritos
 */

import webpush from "web-push";
import PushSubscription from "../models/PushSubscription.js";
import { logApiError, logApiInfo } from "../utils/logger.js";

// Configurar VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@essence.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log("[API INFO] Web push VAPID configured");
} else {
  console.warn("[API WARN] VAPID keys not configured - push disabled");
}

/**
 * Envía una notificación push a un usuario específico
 */
export async function sendPushToUser(userId, notification, requestId) {
  try {
    const subscriptions = await PushSubscription.find({
      user: userId,
      active: true,
    });

    if (!subscriptions.length) {
      logApiInfo("No active subscriptions for user", requestId, { userId });
      return { sent: 0, failed: 0 };
    }

    const payload = JSON.stringify({
      title: notification.title || "Essence",
      body: notification.body || "",
      icon: notification.icon || "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: notification.tag || "default",
      data: {
        url: notification.url || "/",
        ...notification.data,
      },
      requireInteraction: notification.requireInteraction || false,
      actions: notification.actions,
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        sent++;
      } catch (error) {
        failed++;

        // Remove invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.findByIdAndUpdate(sub._id, { active: false });
          logApiInfo("Removed invalid push subscription", requestId, {
            subscriptionId: sub._id,
          });
        } else {
          logApiError("Push notification failed", error, requestId, {
            subscriptionId: sub._id,
          });
        }
      }
    }

    logApiInfo("Push notifications sent", requestId, { userId, sent, failed });
    return { sent, failed };
  } catch (error) {
    logApiError("sendPushToUser failed", error, requestId, { userId });
    throw error;
  }
}

/**
 * Envía notificación push a múltiples usuarios
 */
export async function sendPushToUsers(userIds, notification, requestId) {
  const results = { total: 0, sent: 0, failed: 0 };

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, notification, requestId);
    results.total++;
    results.sent += result.sent;
    results.failed += result.failed;
  }

  return results;
}

/**
 * Envía notificación a todos los usuarios de un negocio
 */
export async function sendPushToBusiness(businessId, notification, requestId) {
  try {
    const subscriptions = await PushSubscription.find({
      business: businessId,
      active: true,
    });

    if (!subscriptions.length) {
      logApiInfo("No active subscriptions for business", requestId, {
        businessId,
      });
      return { sent: 0, failed: 0 };
    }

    const payload = JSON.stringify({
      title: notification.title || "Essence",
      body: notification.body || "",
      icon: notification.icon || "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: notification.tag || `business-${businessId}`,
      data: {
        url: notification.url || "/",
        businessId,
        ...notification.data,
      },
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        sent++;
      } catch (error) {
        failed++;
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.findByIdAndUpdate(sub._id, { active: false });
        }
      }
    }

    logApiInfo("Business push notifications sent", requestId, {
      businessId,
      sent,
      failed,
    });

    return { sent, failed };
  } catch (error) {
    logApiError("sendPushToBusiness failed", error, requestId, { businessId });
    throw error;
  }
}

/**
 * Notificaciones predefinidas
 */
export const PushTemplates = {
  lowStock: (productName, quantity) => ({
    title: "⚠️ Stock Bajo",
    body: `${productName} tiene solo ${quantity} unidades`,
    tag: "low-stock",
    url: "/admin/stock",
    requireInteraction: true,
  }),

  newSale: (amount, branch) => ({
    title: "💰 Nueva Venta",
    body: `Venta de $${amount.toFixed(2)} en ${branch}`,
    tag: "new-sale",
    url: "/admin/sales",
  }),

  creditDue: (customerName, amount, daysOverdue) => ({
    title: "📅 Crédito Vencido",
    body: `${customerName} debe $${amount.toFixed(2)} (${daysOverdue} días)`,
    tag: "credit-due",
    url: "/admin/credits",
    requireInteraction: true,
  }),

  subscriptionExpiring: (daysLeft) => ({
    title: "⏰ Suscripción por Vencer",
    body: `Tu suscripción vence en ${daysLeft} días`,
    tag: "subscription",
    url: "/admin/settings/subscription",
    requireInteraction: true,
  }),

  newDistributorSale: (distributorName, amount) => ({
    title: "🎉 Venta de Distribuidor",
    body: `${distributorName} realizó una venta de $${amount.toFixed(2)}`,
    tag: "distributor-sale",
    url: "/admin/distributors",
  }),

  goalAchieved: (goalName) => ({
    title: "🏆 Meta Alcanzada",
    body: `¡Felicidades! Has completado: ${goalName}`,
    tag: "gamification",
    url: "/admin/gamification",
  }),
};

export default {
  sendPushToUser,
  sendPushToUsers,
  sendPushToBusiness,
  PushTemplates,
};
