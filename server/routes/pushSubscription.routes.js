/**
 * Rutas de suscripciones push
 */

import express from "express";
import {
  deleteSubscription,
  getSubscriptions,
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
  updatePreferences,
} from "../controllers/pushSubscription.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /push/vapid-key:
 *   get:
 *     summary: Obtener clave pública VAPID
 *     tags: [Push Notifications]
 *     responses:
 *       200:
 *         description: Clave pública VAPID
 */
router.get("/vapid-key", getVapidPublicKey);

// Rutas que requieren autenticación
router.use(protect);

/**
 * @swagger
 * /notifications/subscribe:
 *   post:
 *     summary: Registrar suscripción push
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription
 *             properties:
 *               subscription:
 *                 type: object
 *                 properties:
 *                   endpoint:
 *                     type: string
 *                   keys:
 *                     type: object
 *                     properties:
 *                       p256dh:
 *                         type: string
 *                       auth:
 *                         type: string
 *               userAgent:
 *                 type: string
 *     responses:
 *       201:
 *         description: Suscripción registrada
 */
router.post("/subscribe", subscribePush);

/**
 * @swagger
 * /notifications/unsubscribe:
 *   post:
 *     summary: Desactivar suscripción push
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *             properties:
 *               endpoint:
 *                 type: string
 *     responses:
 *       200:
 *         description: Suscripción desactivada
 */
router.post("/unsubscribe", unsubscribePush);

/**
 * @swagger
 * /notifications/subscriptions:
 *   get:
 *     summary: Listar suscripciones del usuario
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de suscripciones
 */
router.get("/subscriptions", getSubscriptions);

/**
 * @swagger
 * /notifications/preferences:
 *   patch:
 *     summary: Actualizar preferencias de notificación
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferences:
 *                 type: object
 *                 properties:
 *                   sales:
 *                     type: boolean
 *                   stock:
 *                     type: boolean
 *                   credits:
 *                     type: boolean
 *                   subscriptions:
 *                     type: boolean
 *                   gamification:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Preferencias actualizadas
 */
router.patch("/preferences", updatePreferences);

/**
 * @swagger
 * /notifications/subscriptions/{id}:
 *   delete:
 *     summary: Eliminar suscripción específica
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Suscripción eliminada
 */
router.delete("/subscriptions/:id", deleteSubscription);

export default router;
