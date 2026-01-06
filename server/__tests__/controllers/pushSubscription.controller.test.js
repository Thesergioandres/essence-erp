/**
 * Tests para el controlador de suscripciones push
 * Tests unitarios de validación de entrada
 */

import { describe, expect, it, jest } from "@jest/globals";
import {
  getVapidPublicKey,
  subscribePush,
} from "../../controllers/pushSubscription.controller.js";

describe("pushSubscription.controller", () => {
  describe("subscribePush", () => {
    it("debería rechazar suscripción sin datos válidos", async () => {
      const req = {
        requestId: "test-123",
        body: {},
        user: { _id: "user123" },
        businessId: "biz123",
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await subscribePush(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Datos de suscripción inválidos",
        })
      );
    });

    it("debería rechazar suscripción sin endpoint", async () => {
      const req = {
        requestId: "test-123",
        body: {
          subscription: { keys: { p256dh: "key1", auth: "key2" } },
        },
        user: { _id: "user123" },
        businessId: "biz123",
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await subscribePush(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("debería rechazar suscripción sin keys", async () => {
      const req = {
        requestId: "test-123",
        body: {
          subscription: { endpoint: "https://push.example.com/abc" },
        },
        user: { _id: "user123" },
        businessId: "biz123",
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await subscribePush(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getVapidPublicKey", () => {
    it("debería retornar la clave pública VAPID cuando está configurada", async () => {
      const originalEnv = process.env.VAPID_PUBLIC_KEY;
      process.env.VAPID_PUBLIC_KEY = "test-vapid-key-12345";

      const req = { requestId: "test-123" };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getVapidPublicKey(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          publicKey: "test-vapid-key-12345",
        })
      );

      process.env.VAPID_PUBLIC_KEY = originalEnv;
    });

    it("debería retornar 503 si VAPID no está configurado", async () => {
      const originalEnv = process.env.VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PUBLIC_KEY;

      const req = { requestId: "test-123" };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getVapidPublicKey(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Push notifications not configured",
        })
      );

      process.env.VAPID_PUBLIC_KEY = originalEnv;
    });
  });
});
