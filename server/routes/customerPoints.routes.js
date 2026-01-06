/**
 * Rutas para el sistema de puntos de clientes
 */

import express from "express";
import {
  adjustPoints,
  expirePoints,
  getCustomerPoints,
  getPointsConfig,
  getPointsHistory,
  validateRedemption,
} from "../controllers/customerPoints.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PointsBalance:
 *       type: object
 *       properties:
 *         customerId:
 *           type: string
 *         name:
 *           type: string
 *         currentPoints:
 *           type: integer
 *         totalEarned:
 *           type: integer
 *         totalRedeemed:
 *           type: integer
 *         pointValue:
 *           type: number
 *         monetaryValue:
 *           type: number
 *     PointsHistoryEntry:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [earned, redeemed, bonus, adjustment, expired]
 *         amount:
 *           type: integer
 *         balance:
 *           type: integer
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/customers/{customerId}/points:
 *   get:
 *     summary: Obtiene el balance de puntos de un cliente
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-business-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Balance de puntos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PointsBalance'
 */
router.get("/customers/:customerId/points", protect, getCustomerPoints);

/**
 * @swagger
 * /api/customers/{customerId}/points/history:
 *   get:
 *     summary: Obtiene el historial de puntos de un cliente
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-business-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Historial de puntos
 */
router.get("/customers/:customerId/points/history", protect, getPointsHistory);

/**
 * @swagger
 * /api/customers/{customerId}/points/adjust:
 *   post:
 *     summary: Ajusta manualmente los puntos de un cliente
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-business-id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - points
 *               - reason
 *             properties:
 *               points:
 *                 type: integer
 *                 description: Puntos a agregar (positivo) o quitar (negativo)
 *               reason:
 *                 type: string
 *                 description: Razón del ajuste
 *     responses:
 *       200:
 *         description: Puntos ajustados exitosamente
 */
router.post("/customers/:customerId/points/adjust", protect, adjustPoints);

/**
 * @swagger
 * /api/customers/{customerId}/points/validate-redemption:
 *   post:
 *     summary: Valida si un cliente puede canjear puntos
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-business-id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - points
 *               - saleTotal
 *             properties:
 *               points:
 *                 type: integer
 *                 description: Puntos a canjear
 *               saleTotal:
 *                 type: number
 *                 description: Total de la venta
 *     responses:
 *       200:
 *         description: Resultado de la validación
 */
router.post(
  "/customers/:customerId/points/validate-redemption",
  protect,
  validateRedemption
);

/**
 * @swagger
 * /api/points/expire:
 *   post:
 *     summary: Expira puntos antiguos (solo admin)
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-business-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado de la expiración
 */
router.post("/points/expire", protect, expirePoints);

/**
 * @swagger
 * /api/points/config:
 *   get:
 *     summary: Obtiene la configuración del sistema de puntos
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración de puntos
 */
router.get("/points/config", protect, getPointsConfig);

export default router;
