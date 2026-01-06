/**
 * Tests para el servicio de puntos de clientes
 */

import { describe, expect, it } from "@jest/globals";
import customerPointsService from "../../services/customerPoints.service.js";

const {
  calculatePointsEarned,
  calculatePointsValue,
  calculatePointsNeeded,
  validateRedemption,
  DEFAULT_CONFIG,
} = customerPointsService;

describe("customerPoints.service", () => {
  describe("calculatePointsEarned", () => {
    it("debería calcular puntos correctamente (1 punto por $1)", () => {
      expect(calculatePointsEarned(100)).toBe(100);
      expect(calculatePointsEarned(50.99)).toBe(50); // Floor
      expect(calculatePointsEarned(0)).toBe(0);
      expect(calculatePointsEarned(-10)).toBe(0);
    });

    it("debería respetar config personalizada", () => {
      const customConfig = { ...DEFAULT_CONFIG, pointsPerDollar: 2 };
      expect(calculatePointsEarned(100, customConfig)).toBe(200);
    });
  });

  describe("calculatePointsValue", () => {
    it("debería calcular valor monetario (0.01 por punto)", () => {
      expect(calculatePointsValue(100)).toBe(1);
      expect(calculatePointsValue(1000)).toBe(10);
      expect(calculatePointsValue(0)).toBe(0);
      expect(calculatePointsValue(-50)).toBe(0);
    });

    it("debería respetar config personalizada", () => {
      const customConfig = { ...DEFAULT_CONFIG, pointValue: 0.05 };
      expect(calculatePointsValue(100, customConfig)).toBe(5);
    });
  });

  describe("calculatePointsNeeded", () => {
    it("debería calcular puntos necesarios para un monto", () => {
      expect(calculatePointsNeeded(1)).toBe(100); // $1 = 100 puntos
      expect(calculatePointsNeeded(5)).toBe(500);
      expect(calculatePointsNeeded(0)).toBe(0);
      expect(calculatePointsNeeded(-1)).toBe(0);
    });
  });

  describe("validateRedemption", () => {
    it("debería rechazar si puntos menores al mínimo", () => {
      const result = validateRedemption(500, 50, 100); // 50 < 100 min
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Mínimo 100 puntos para canjear");
    });

    it("debería rechazar si puntos insuficientes", () => {
      const result = validateRedemption(50, 100, 100); // tiene 50, quiere 100
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Puntos insuficientes. Disponibles: 50");
    });

    it("debería rechazar si excede máximo permitido (50% del total)", () => {
      // Venta de $10, máximo descuento $5 (500 puntos)
      // Cliente intenta usar 1000 puntos = $10
      const result = validateRedemption(1000, 1000, 10);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Máximo"))).toBe(true);
    });

    it("debería aprobar redención válida", () => {
      // Cliente tiene 500 puntos, usa 200, venta $100
      // 200 puntos = $2, máximo $50, ok
      const result = validateRedemption(500, 200, 100);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.redemptionValue).toBe(2); // $2
    });

    it("debería aprobar uso del máximo permitido", () => {
      // Venta $100, máximo $50 (5000 puntos)
      // Cliente tiene 10000 puntos, usa 5000
      const result = validateRedemption(10000, 5000, 100);
      expect(result.valid).toBe(true);
      expect(result.redemptionValue).toBe(50);
    });
  });

  describe("DEFAULT_CONFIG", () => {
    it("debería tener valores por defecto correctos", () => {
      expect(DEFAULT_CONFIG.pointsPerDollar).toBe(1);
      expect(DEFAULT_CONFIG.pointValue).toBe(0.01);
      expect(DEFAULT_CONFIG.minPointsToRedeem).toBe(100);
      expect(DEFAULT_CONFIG.maxRedemptionPercent).toBe(50);
      expect(DEFAULT_CONFIG.expirationMonths).toBe(12);
    });
  });
});
