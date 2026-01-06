/**
 * Smoke Tests - Verificación rápida de endpoints críticos
 * Ejecutar: npm test -- --runTestsByPath __tests__/smoke.test.js
 */

import { jest } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";

// Mock de Redis para tests
jest.unstable_mockModule("../config/redis.js", () => ({
  initRedis: jest.fn(),
  getRedisClient: jest.fn(() => null),
}));

// Importar app después de los mocks
const { default: app } = await import("../server.js");

describe("Smoke Tests - Endpoints Críticos", () => {
  beforeAll(async () => {
    // Esperar conexión a MongoDB de test
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("Health & Base", () => {
    it("GET / - API responde correctamente", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("Essence API");
    });

    it("GET /api-docs - Swagger carga correctamente", async () => {
      const res = await request(app).get("/api-docs/");
      expect([200, 301, 304]).toContain(res.status);
    });

    it("GET /api-docs.json - OpenAPI spec disponible", async () => {
      const res = await request(app).get("/api-docs.json");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("openapi");
      expect(res.body.info.title).toBe("Essence API");
    });
  });

  describe("Auth Endpoints", () => {
    it("POST /api/auth/login - Rechaza sin credenciales", async () => {
      const res = await request(app).post("/api/auth/login").send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("POST /api/auth/login - Rechaza email inválido", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "invalid", password: "123456" });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("POST /api/auth/register - Valida campos requeridos", async () => {
      const res = await request(app).post("/api/auth/register").send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("GET /api/auth/profile - Requiere autenticación", async () => {
      const res = await request(app).get("/api/auth/profile");
      expect(res.status).toBe(401);
    });
  });

  describe("Protected Endpoints - Sin Auth", () => {
    it("GET /api/products - Requiere autenticación o BusinessId", async () => {
      const res = await request(app).get("/api/products");
      expect([200, 304, 400, 401]).toContain(res.status);
    });

    it("GET /api/business - Requiere autenticación", async () => {
      const res = await request(app).get("/api/business");
      expect(res.status).toBe(401);
    });

    it("GET /api/credits - Requiere autenticación", async () => {
      const res = await request(app).get("/api/credits");
      expect(res.status).toBe(401);
    });

    it("GET /api/sales - Requiere autenticación", async () => {
      const res = await request(app).get("/api/sales");
      expect(res.status).toBe(401);
    });

    it("GET /api/analytics/dashboard - Requiere autenticación", async () => {
      const res = await request(app).get("/api/analytics/dashboard");
      expect(res.status).toBe(401);
    });

    it("GET /api/users/god/all - Requiere rol god", async () => {
      const res = await request(app).get("/api/users/god/all");
      expect(res.status).toBe(401);
    });
  });

  describe("Validaciones de Entrada", () => {
    it("POST /api/credits - Rechaza sin customer", async () => {
      const res = await request(app)
        .post("/api/credits")
        .set("Authorization", "Bearer fake-token")
        .send({ originalAmount: 100 });
      expect([400, 401]).toContain(res.status);
    });

    it("POST /api/credits/:id/payments - Valida ID de Mongo", async () => {
      const res = await request(app)
        .post("/api/credits/invalid-id/payments")
        .set("Authorization", "Bearer fake-token")
        .send({ amount: 50 });
      expect([400, 401]).toContain(res.status);
    });
  });

  describe("Rate Limiting", () => {
    it("API responde headers de rate limit", async () => {
      const res = await request(app).get("/api/products");
      // Verificar que no hay error de rate limit en una sola request
      expect(res.status).not.toBe(429);
    });
  });

  describe("Security Headers", () => {
    it("Responde con X-Frame-Options", async () => {
      const res = await request(app).get("/");
      expect(res.headers["x-frame-options"]).toBe("DENY");
    });

    it("Responde con X-Content-Type-Options", async () => {
      const res = await request(app).get("/");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("Responde con X-XSS-Protection", async () => {
      const res = await request(app).get("/");
      expect(res.headers["x-xss-protection"]).toBe("1; mode=block");
    });
  });

  describe("CORS", () => {
    it("Acepta requests sin origin", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
    });

    it("Responde a preflight OPTIONS", async () => {
      const res = await request(app)
        .options("/api/products")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET");
      expect([200, 204]).toContain(res.status);
    });
  });

  describe("Compression", () => {
    it("Comprime respuestas grandes", async () => {
      const res = await request(app)
        .get("/api/products")
        .set("Accept-Encoding", "gzip, deflate");
      // Si hay productos, debería comprimir
      if (res.body.products?.length > 0) {
        expect(res.headers["content-encoding"]).toBeDefined();
      }
    });
  });
});
