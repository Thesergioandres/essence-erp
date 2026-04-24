import {
  buildPromotionSalesSummary,
  normalizeId,
} from "../../../utils/promotionMetrics.js";
import Membership from "../../database/models/Membership.js";
import ProfitHistory from "../../database/models/ProfitHistory.js";
import Promotion from "../../database/models/Promotion.js";
import Sale from "../../database/models/Sale.js";
import Product from "../../database/models/Product.js";
import GamificationConfig from "../../database/models/GamificationConfig.js";
import EmployeePoints from "../../database/models/EmployeePoints.js";
import { GamificationService } from "../../../domain/services/GamificationService.js";

export async function confirmSalePayment(req, res) {
  try {
    const { saleId } = req.params;
    const businessId =
      req.businessId || req.headers["x-business-id"] || req.business?._id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Falta x-business-id",
      });
    }

    const sale = await Sale.findOne({
      _id: saleId,
      business: businessId,
    }).lean();

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Venta no encontrada",
      });
    }

    if (sale.paymentStatus === "confirmado") {
      return res.json({
        success: true,
        message: "La venta ya estaba confirmada",
        sale,
      });
    }

    const confirmedAt = new Date();

    await Sale.updateOne(
      { _id: sale._id },
      {
        $set: {
          paymentStatus: "confirmado",
          paymentConfirmedAt: confirmedAt,
          paymentConfirmedBy: req.user?._id,
        },
      },
    );

    const existingProfit = await ProfitHistory.findOne({
      $or: [
        { sale: sale._id },
        { "metadata.saleId": sale._id.toString() },
        ...(sale.saleId ? [{ "metadata.saleId": sale.saleId }] : []),
      ],
    }).lean();

    if (!existingProfit) {
      const saleDate = sale.saleDate || confirmedAt;

      if (sale.employee && sale.employeeProfit > 0) {
        await ProfitHistory.create({
          business: businessId,
          user: sale.employee,
          type: "venta_normal",
          amount: sale.employeeProfit,
          sale: sale._id,
          product: sale.product,
          description: `Comisión por venta ${sale.saleId}`,
          date: saleDate,
          metadata: {
            quantity: sale.quantity,
            salePrice: sale.salePrice,
            saleId: sale.saleId,
            commission: sale.employeeProfitPercentage,
          },
        });
      }

      if (sale.adminProfit > 0) {
        const adminMembership = await Membership.findOne({
          business: businessId,
          role: "admin",
          status: "active",
        })
          .select("user")
          .lean();

        if (adminMembership) {
          await ProfitHistory.create({
            business: businessId,
            user: adminMembership.user,
            type: "venta_normal",
            amount: sale.adminProfit,
            sale: sale._id,
            product: sale.product,
            description: sale.employee
              ? `Ganancia de venta ${sale.saleId} (employee)`
              : `Venta directa ${sale.saleId}`,
            date: saleDate,
            metadata: {
              quantity: sale.quantity,
              salePrice: sale.salePrice,
              saleId: sale.saleId,
            },
          });
        }
      }
    }

    // === GAMIFICATION: Accrue points if not already accrued ===
    if (sale.employee && sale.paymentStatus !== "confirmado") {
      const [gamificationConfig, product, existingPointsHistory] = await Promise.all([
        GamificationConfig.findOne({ business: businessId, enabled: true }).lean(),
        Product.findById(sale.product).select("gamificationPointsMultiplier").lean(),
        EmployeePoints.findOne({
          employee: sale.employee,
          business: businessId,
          "history.sale": sale._id,
        }).lean(),
      ]);

      if (gamificationConfig && product && !existingPointsHistory) {
        const pointsMultiplier = product.gamificationPointsMultiplier || 1;
        const amountPerPoint =
          gamificationConfig.pointsRatio?.amountPerPoint || 1000;

        const { points } = GamificationService.calculatePointsForSale(
          sale.totalPrice || sale.salePrice * sale.quantity,
          pointsMultiplier,
          amountPerPoint,
        );

        if (points > 0) {
          const pointsEntry = {
            type: "earned",
            points,
            sale: sale._id,
            saleGroupId: sale.saleGroupId,
            productName: sale.productName || "Producto",
            multiplier: pointsMultiplier,
            saleAmount: sale.totalPrice || sale.salePrice * sale.quantity,
            description: `+${points} pts por venta confirmada ${sale.saleId}`,
            createdAt: new Date(),
          };

          const updatedPoints = await EmployeePoints.findOneAndUpdate(
            { employee: sale.employee, business: businessId },
            {
              $inc: { currentPoints: points },
              $push: {
                history: {
                  $each: [pointsEntry],
                  $slice: -500,
                },
              },
              $set: { lastPointsEarnedAt: new Date() },
            },
            { upsert: true, new: true },
          );

          if (updatedPoints) {
            const tierResult = GamificationService.resolveTier(
              updatedPoints.currentPoints,
              gamificationConfig.tiers,
            );
            updatedPoints.currentTier = {
              name: tierResult.tier?.name || null,
              bonusPercentage: tierResult.bonusPercentage,
            };
            await updatedPoints.save();
          }
        }
      }
    }

    const updatedSale = await Sale.findById(sale._id).lean();

    if (updatedSale?.isPromotion && updatedSale?.promotion) {
      const promotionId = normalizeId(updatedSale.promotion);
      if (promotionId && !updatedSale.promotionMetricsApplied) {
        const promotion = await Promotion.findOne({
          _id: promotionId,
          business: businessId,
        })
          .select("_id totalStock currentStock comboItems")
          .lean();

        const groupFilter = updatedSale.saleGroupId
          ? {
              business: businessId,
              saleGroupId: updatedSale.saleGroupId,
              promotion: promotionId,
            }
          : { _id: updatedSale._id };

        const promotionSales = await Sale.find(groupFilter).lean();
        const summary = promotion
          ? buildPromotionSalesSummary(promotion, promotionSales)
          : null;

        if (promotion && summary && summary.usageCount > 0) {
          const update = {
            $inc: {
              usageCount: summary.usageCount,
              totalRevenue: summary.revenue,
              totalUnitsSold: summary.unitsSold,
            },
          };

          const currentStock =
            promotion.currentStock ?? promotion.totalStock ?? null;
          if (currentStock !== null) {
            update.$set = {
              currentStock: Math.max(
                0,
                Number(currentStock) - summary.usageCount,
              ),
            };
          }

          await Promotion.updateOne(
            { _id: promotionId, business: businessId },
            update,
          );

          await Sale.updateMany(groupFilter, {
            $set: { promotionMetricsApplied: true },
          });
        }
      }
    }

    return res.json({
      success: true,
      message: "Venta confirmada correctamente",
      sale: updatedSale || sale,
    });
  } catch (error) {
    console.error("❌ [CONFIRM SALE] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error al confirmar la venta",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
