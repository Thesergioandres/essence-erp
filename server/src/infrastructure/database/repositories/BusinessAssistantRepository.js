import mongoose from "mongoose";
import BusinessAssistantConfig from "../../../../models/BusinessAssistantConfig.js";
import Category from "../../../../models/Category.js";
import Product from "../../../../models/Product.js";
import Sale from "../../../../models/Sale.js";
import { aiService } from "../../services/ai.service.js";
import { AdvancedAnalyticsRepository } from "./AdvancedAnalyticsRepository.js";

const analyticsRepository = new AdvancedAnalyticsRepository();

export class BusinessAssistantRepository {
  suggestPromotion(products, sales, options = {}) {
    const staleDays = options.staleDays ?? 45;
    const minStock = options.minStock ?? 8;
    const comboSize = options.comboSize ?? 3;
    const maxCombos = options.maxCombos ?? 3;
    const now = new Date();
    const staleDate = new Date(now.getTime() - staleDays * 24 * 60 * 60 * 1000);

    const lastSaleByProduct = new Map();
    sales.forEach((sale) => {
      const productId = sale.product?.toString?.() || null;
      if (!productId) return;
      const saleDate = sale.saleDate ? new Date(sale.saleDate) : null;
      if (!saleDate || Number.isNaN(saleDate.getTime())) return;
      const existing = lastSaleByProduct.get(productId);
      if (!existing || saleDate > existing) {
        lastSaleByProduct.set(productId, saleDate);
      }
    });

    const staleProducts = products.filter((product) => {
      const productId = product._id?.toString?.() || "";
      const lastSale = lastSaleByProduct.get(productId);
      const stock = Number(product.stock ?? product.totalStock ?? 0);
      if (stock < minStock) return false;
      if (!lastSale) return true;
      return lastSale < staleDate;
    });

    const sorted = staleProducts.sort((a, b) => {
      const stockA = Number(a.stock ?? a.totalStock ?? 0);
      const stockB = Number(b.stock ?? b.totalStock ?? 0);
      return stockB - stockA;
    });

    const picks = sorted.slice(0, comboSize * maxCombos);
    const combos = [];
    for (let i = 0; i < picks.length; i += comboSize) {
      const group = picks.slice(i, i + comboSize);
      if (group.length < comboSize) break;
      const names = group.map((p) => p.name).join(" + ");
      combos.push({
        type: "combo",
        title: `📦 Combo Reactivacion: ${names}`,
        description: `Productos sin ventas en ${staleDays} dias y stock >= ${minStock}. Ideal para reactivar rotacion con un combo.`,
        products: group.map((p) => p._id.toString()),
      });
      if (combos.length >= maxCombos) break;
    }

    return combos;
  }

  async getOrCreateConfig(businessId) {
    if (!businessId) {
      return BusinessAssistantConfig.findOne({
        $or: [{ business: { $exists: false } }, { business: null }],
      });
    }

    const existing = await BusinessAssistantConfig.findOne({
      business: businessId,
    });
    if (existing) return existing;

    const fallback = await BusinessAssistantConfig.findOne({
      $or: [{ business: { $exists: false } }, { business: null }],
    });

    const payload = fallback ? fallback.toObject() : {};
    delete payload._id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.__v;

    const config = await BusinessAssistantConfig.findOneAndUpdate(
      { business: businessId },
      { $setOnInsert: { ...payload, business: businessId } },
      { new: true, upsert: true },
    );

    return config;
  }

  async generateRecommendations(businessId, params = {}) {
    if (!businessId) {
      throw new Error("Falta el negocio para generar recomendaciones");
    }

    const businessObjectId = new mongoose.Types.ObjectId(String(businessId));
    const config = await this.getOrCreateConfig(businessId);

    const horizonDays = params.horizonDays || config.horizonDaysDefault || 90;
    const recentDays = params.recentDays || config.recentDaysDefault || 30;

    const now = new Date();
    const horizonDate = new Date(
      now.getTime() - horizonDays * 24 * 60 * 60 * 1000,
    );
    const recentDate = new Date(
      now.getTime() - recentDays * 24 * 60 * 60 * 1000,
    );

    const [products, sales, categories, financialKPIs] = await Promise.all([
      Product.find({
        business: businessObjectId,
        isDeleted: { $ne: true },
      }).lean(),
      Sale.find({
        business: businessObjectId,
        saleDate: { $gte: horizonDate },
        paymentStatus: "confirmado",
      }).lean(),
      Category.find({ business: businessObjectId }).lean(),
      analyticsRepository
        .getFinancialKPIs(businessId, params.startDate, params.endDate)
        .catch(() => null),
    ]);

    const netProfitRange =
      typeof financialKPIs?.range?.netProfit === "number"
        ? financialKPIs.range.netProfit
        : 0;
    const allowInvestment = netProfitRange > 0;

    const recommendations = [];

    for (const product of products) {
      const productSales = sales.filter(
        (s) => s.product.toString() === product._id.toString(),
      );
      const recentSales = productSales.filter((s) => s.saleDate >= recentDate);

      if (product.stock < 10 && recentSales.length > 0) {
        recommendations.push({
          type: "inventory",
          priority: "high",
          productId: product._id,
          productName: product.name,
          action: allowInvestment ? "buy_more_inventory" : "pause_purchases",
          reason: allowInvestment
            ? `Stock bajo (${product.stock} unidades) con ventas recientes`
            : "Ganancia neta del periodo baja; prioriza liquidez antes de reinvertir.",
          suggestedQuantity: allowInvestment
            ? Math.max(20, recentSales.length * 2)
            : undefined,
        });
      }

      if (product.stock > 50 && recentSales.length === 0) {
        recommendations.push({
          type: "inventory",
          priority: "medium",
          productId: product._id,
          productName: product.name,
          action: "pause_purchases",
          reason: `Stock alto (${product.stock} unidades) sin ventas recientes`,
        });
      }

      const avgSalePrice =
        productSales.length > 0
          ? productSales.reduce((sum, s) => sum + s.salePrice, 0) /
            productSales.length
          : 0;

      // Usar clientPrice o suggestedPrice como precio de venta actual
      const currentProductPrice =
        product.clientPrice || product.suggestedPrice || 0;
      if (avgSalePrice > 0 && currentProductPrice < avgSalePrice * 0.9) {
        recommendations.push({
          type: "pricing",
          priority: "low",
          productId: product._id,
          productName: product.name,
          action: "adjust_price",
          reason: "Precio actual por debajo del promedio histórico",
          currentPrice: currentProductPrice,
          suggestedPrice: Math.round(avgSalePrice * 0.95),
        });
      }
    }

    const promotions = this.suggestPromotion(products, sales, {
      staleDays: 45,
      minStock: 8,
      comboSize: 3,
    });

    return {
      recommendations,
      promotions,
      metadata: {
        generatedAt: now,
        horizonDays,
        recentDays,
        productsAnalyzed: products.length,
        salesAnalyzed: sales.length,
        netProfitRange,
      },
    };
  }

  async updateConfig(businessId, data) {
    let config = await BusinessAssistantConfig.findOne({
      business: businessId,
    });

    if (!config) {
      config = await BusinessAssistantConfig.create({
        ...data,
        business: businessId,
      });
    } else {
      Object.assign(config, data);
      await config.save();
    }

    return config;
  }

  async askAssistant(businessId, question) {
    if (!aiService || !aiService.generateAssistantResponse) {
      throw new Error("AI Service no disponible");
    }

    const businessObjectId = new mongoose.Types.ObjectId(String(businessId));

    const [products, sales] = await Promise.all([
      Product.find({
        business: businessObjectId,
        isDeleted: { $ne: true },
      })
        .limit(50)
        .lean(),
      Sale.find({ business: businessObjectId })
        .sort({ saleDate: -1 })
        .limit(100)
        .lean(),
    ]);

    const context = {
      totalProducts: products.length,
      totalSales: sales.length,
      topProducts: products
        .slice(0, 5)
        .map((p) => ({ name: p.name, stock: p.stock })),
    };

    const response = await aiService.generateAssistantResponse(
      question,
      context,
    );
    return response;
  }
}
