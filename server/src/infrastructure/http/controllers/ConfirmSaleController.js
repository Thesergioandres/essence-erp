import Membership from "../../../../models/Membership.js";
import Product from "../../../../models/Product.js";
import ProfitHistory from "../../../../models/ProfitHistory.js";
import Sale from "../../../../models/Sale.js";
import { applySaleGamification } from "../../../../utils/gamificationEngine.js";

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

      if (sale.distributor && sale.distributorProfit > 0) {
        await ProfitHistory.create({
          business: businessId,
          user: sale.distributor,
          type: "venta_normal",
          amount: sale.distributorProfit,
          sale: sale._id,
          product: sale.product,
          description: `Comisión por venta ${sale.saleId}`,
          date: saleDate,
          metadata: {
            quantity: sale.quantity,
            salePrice: sale.salePrice,
            saleId: sale.saleId,
            commission: sale.distributorProfitPercentage,
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
            description: sale.distributor
              ? `Ganancia de venta ${sale.saleId} (distribuidor)`
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

    const updatedSale = await Sale.findById(sale._id).lean();
    if (updatedSale?.distributor) {
      const product = updatedSale.product
        ? await Product.findById(updatedSale.product).lean()
        : null;
      await applySaleGamification({
        businessId,
        sale: updatedSale,
        product,
      });
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
