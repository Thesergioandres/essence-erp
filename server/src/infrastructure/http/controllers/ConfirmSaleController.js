import { ConfirmSalePaymentUseCase } from "../../../application/use-cases/sales/ConfirmSalePaymentUseCase.js";

const confirmSalePaymentUseCase = new ConfirmSalePaymentUseCase();

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

    const result = await confirmSalePaymentUseCase.execute({
      saleId,
      businessId,
      userId: req.user?._id || req.user?.id || null,
    });

    return res.json({
      success: true,
      message: result.alreadyConfirmed
        ? "La venta ya estaba confirmada"
        : "Venta confirmada correctamente",
      sale: result.sale,
    });
  } catch (error) {
    console.error("❌ [CONFIRM SALE] Error:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 500 ? "Error al confirmar la venta" : error.message,
    });
  }
}
