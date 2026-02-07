import mongoose from "mongoose";
import BranchStock from "../../../../models/BranchStock.js";
import DefectiveProduct from "../../../../models/DefectiveProduct.js";
import DistributorStock from "../../../../models/DistributorStock.js";
import Product from "../../../../models/Product.js";
import ProfitHistory from "../../../../models/ProfitHistory.js";

export class DefectiveProductRepository {
  async reportFromAdmin(data, businessId, userId) {
    const product = await Product.findOne({
      _id: data.productId,
      business: businessId,
    });

    if (!product) {
      const err = new Error("Producto no encontrado");
      err.statusCode = 404;
      throw err;
    }

    if (product.warehouseStock < data.quantity) {
      const err = new Error(
        `Stock insuficiente en bodega. Disponible: ${product.warehouseStock}`,
      );
      err.statusCode = 400;
      throw err;
    }

    const lossAmount = data.hasWarranty
      ? 0
      : (product.purchasePrice || 0) * data.quantity;

    const defectiveReport = await DefectiveProduct.create({
      distributor: null,
      product: data.productId,
      business: businessId,
      quantity: data.quantity,
      reason: data.reason,
      images: data.images || [],
      hasWarranty: data.hasWarranty,
      warrantyStatus: data.hasWarranty ? "pending" : "not_applicable",
      lossAmount,
      stockOrigin: "warehouse",
      status: "confirmado",
      confirmedAt: Date.now(),
      confirmedBy: userId,
      adminNotes: data.hasWarranty
        ? "Reporte con garantía - pendiente reposición de stock"
        : "Reporte sin garantía - pérdida registrada",
    });

    product.warehouseStock -= data.quantity;
    product.totalStock = Math.max(0, (product.totalStock || 0) - data.quantity);
    await product.save();

    return defectiveReport;
  }

  async reportFromDistributor(data, businessId, distributorId) {
    const product = await Product.findOne({
      _id: data.productId,
      business: businessId,
    });

    if (!product) {
      const err = new Error("Producto no encontrado");
      err.statusCode = 404;
      throw err;
    }

    const distributorStock = await DistributorStock.findOne({
      distributor: distributorId,
      product: data.productId,
      business: businessId,
    });

    if (!distributorStock || distributorStock.quantity < data.quantity) {
      const err = new Error("Stock insuficiente del distribuidor");
      err.statusCode = 400;
      throw err;
    }

    const defectiveReport = await DefectiveProduct.create({
      distributor: distributorId,
      product: data.productId,
      business: businessId,
      quantity: data.quantity,
      reason: data.reason,
      images: data.images || [],
      hasWarranty: data.hasWarranty,
      warrantyStatus: data.hasWarranty ? "pending" : "not_applicable",
      lossAmount: 0,
      stockOrigin: "distributor",
      status: "pendiente",
    });

    return defectiveReport;
  }

  async findByBusiness(businessId, filters = {}) {
    const query = { business: businessId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.distributor) {
      query.distributor = filters.distributor;
    }

    if (filters.stockOrigin) {
      query.stockOrigin = filters.stockOrigin;
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      DefectiveProduct.find(query)
        .populate("product", "name image purchasePrice averageCost")
        .populate("distributor", "name email")
        .populate("confirmedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DefectiveProduct.countDocuments(query),
    ]);

    await this.normalizeConfirmedLosses(businessId, reports);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async normalizeConfirmedLosses(businessId, reports) {
    if (!Array.isArray(reports) || reports.length === 0) return;

    const fixes = reports.map(async (report) => {
      if (report.status !== "confirmado" || report.hasWarranty) return;

      const product =
        report.product && typeof report.product === "object"
          ? report.product
          : null;

      const unitCost = product?.averageCost || product?.purchasePrice || 0;
      if (!unitCost) return;

      const quantity = report.quantity || 0;
      const correctLoss = unitCost * quantity;

      if (Number(report.lossAmount || 0) !== correctLoss) {
        await DefectiveProduct.updateOne(
          { _id: report._id },
          { $set: { lossAmount: correctLoss } },
        );

        report.lossAmount = correctLoss;
      }

      await this.syncDefectiveProfitHistoryLoss(
        businessId,
        report,
        correctLoss,
        product?.name,
      );
    });

    await Promise.all(fixes);
  }

  async syncDefectiveProfitHistoryLoss(
    businessId,
    report,
    correctLoss,
    productName,
  ) {
    if (!correctLoss || !Number.isFinite(correctLoss)) return;

    const originLabel =
      report.stockOrigin === "distributor" ? " (Distribuidor)" : "";
    const dateBase = report.confirmedAt || report.updatedAt || report.createdAt;

    const baseFilter = {
      business: businessId,
      type: "ajuste",
      "metadata.eventName": "defective_loss",
    };

    const reportId = report?._id;
    let history = reportId
      ? await ProfitHistory.findOne({
          ...baseFilter,
          "metadata.reportId": reportId,
        })
      : null;

    if (!history) {
      const description = `Pérdida por defectuoso${originLabel} (${report.quantity}): ${productName || "Producto"}`;
      const dateStart = dateBase ? new Date(dateBase) : null;
      const dateEnd = dateBase ? new Date(dateBase) : null;

      if (dateStart && dateEnd) {
        dateStart.setHours(0, 0, 0, 0);
        dateEnd.setHours(23, 59, 59, 999);
      }

      const dateFilter =
        dateStart && dateEnd
          ? { date: { $gte: dateStart, $lte: dateEnd } }
          : {};

      history = await ProfitHistory.findOne({
        ...baseFilter,
        description,
        ...dateFilter,
      }).sort({ date: -1 });
    }

    if (!history) {
      const confirmedById =
        report.confirmedBy && typeof report.confirmedBy === "object"
          ? report.confirmedBy._id
          : report.confirmedBy;

      if (!confirmedById) return;

      await ProfitHistory.create({
        business: businessId,
        user: confirmedById,
        type: "ajuste",
        amount: -correctLoss,
        product:
          report.product && typeof report.product === "object"
            ? report.product._id
            : report.product,
        description: `Pérdida por defectuoso${originLabel} (${report.quantity}): ${productName || "Producto"}`,
        date: dateBase ? new Date(dateBase) : new Date(),
        metadata: {
          quantity: report.quantity,
          salePrice: 0,
          saleId: null,
          eventName: "defective_loss",
          reportId: reportId,
          unitCost: correctLoss / (report.quantity || 1),
        },
      });
      return;
    }

    const expectedAmount = -correctLoss;
    if (history.amount === expectedAmount) return;

    history.amount = expectedAmount;
    history.product =
      report.product && typeof report.product === "object"
        ? report.product._id
        : report.product;
    history.metadata = {
      ...history.metadata,
      reportId: reportId || history.metadata?.reportId,
      unitCost: correctLoss / (report.quantity || 1),
    };

    await history.save();
  }

  async findById(id, businessId) {
    const report = await DefectiveProduct.findOne({
      _id: id,
      business: businessId,
    })
      .populate("product", "name image purchasePrice distributorPrice")
      .populate("distributor", "name email")
      .populate("confirmedBy", "name email")
      .lean();

    return report;
  }

  async confirmReport(id, businessId, userId, data) {
    const report = await DefectiveProduct.findOne({
      _id: id,
      business: businessId,
    });

    if (!report) {
      const err = new Error("Reporte no encontrado");
      err.statusCode = 404;
      throw err;
    }

    if (report.status !== "pendiente") {
      const err = new Error("El reporte ya fue procesado");
      err.statusCode = 400;
      throw err;
    }

    const product = await Product.findOne({
      _id: report.product,
      business: businessId,
    }).lean();

    if (!product) {
      const err = new Error("Producto no encontrado");
      err.statusCode = 404;
      throw err;
    }

    const hasWarranty = Boolean(data?.hasWarranty);
    const unitCost = product.averageCost || product.purchasePrice || 0;
    const lossAmount = hasWarranty ? 0 : unitCost * report.quantity;

    report.status = "confirmado";
    report.confirmedAt = Date.now();
    report.confirmedBy = userId;
    report.adminNotes = data.adminNotes;
    report.hasWarranty = hasWarranty;
    report.warrantyStatus = hasWarranty ? "approved" : "not_applicable";
    report.lossAmount = lossAmount;

    if (report.stockOrigin === "distributor") {
      const distributorStock = await DistributorStock.findOne({
        distributor: report.distributor,
        product: report.product,
        business: businessId,
      });

      if (distributorStock) {
        distributorStock.quantity -= report.quantity;
        await distributorStock.save();
      }

      await Product.findByIdAndUpdate(report.product, {
        $inc: { totalStock: -report.quantity },
      });
    } else if (report.stockOrigin === "branch" && report.branch) {
      await BranchStock.findOneAndUpdate(
        {
          branch: report.branch,
          product: report.product,
          business: businessId,
        },
        { $inc: { quantity: -report.quantity } },
      );

      await Product.findByIdAndUpdate(report.product, {
        $inc: { totalStock: -report.quantity },
      });
    } else if (report.stockOrigin === "warehouse") {
      await Product.findByIdAndUpdate(report.product, {
        $inc: {
          warehouseStock: -report.quantity,
          totalStock: -report.quantity,
        },
      });
    }

    if (!hasWarranty && lossAmount > 0) {
      const existing = await ProfitHistory.findOne({
        business: businessId,
        type: "ajuste",
        "metadata.eventName": "defective_loss",
        "metadata.reportId": report._id,
      });

      if (existing) {
        if (existing.amount !== -lossAmount) {
          existing.amount = -lossAmount;
          existing.product = report.product;
          existing.metadata = {
            ...existing.metadata,
            quantity: report.quantity,
            unitCost,
          };
          await existing.save();
        }
      } else {
        await ProfitHistory.create({
          business: businessId,
          user: userId,
          type: "ajuste",
          amount: -lossAmount,
          product: report.product,
          description: `Pérdida por defectuoso (${report.quantity}): ${product.name}`,
          date: new Date(),
          metadata: {
            quantity: report.quantity,
            salePrice: 0,
            saleId: null,
            eventName: "defective_loss",
            reportId: report._id,
            unitCost,
          },
        });
      }
    }

    await report.save();
    return report;
  }

  async rejectReport(id, businessId, userId, data) {
    const report = await DefectiveProduct.findOne({
      _id: id,
      business: businessId,
    });

    if (!report) {
      const err = new Error("Reporte no encontrado");
      err.statusCode = 404;
      throw err;
    }

    if (report.status !== "pendiente") {
      const err = new Error("El reporte ya fue procesado");
      err.statusCode = 400;
      throw err;
    }

    report.status = "rechazado";
    report.confirmedAt = Date.now();
    report.confirmedBy = userId;
    report.adminNotes = data.adminNotes;

    await report.save();
    return report;
  }

  async approveWarranty(id, businessId, userId, data) {
    const report = await DefectiveProduct.findOne({
      _id: id,
      business: businessId,
    });

    if (!report) {
      const err = new Error("Reporte no encontrado");
      err.statusCode = 404;
      throw err;
    }

    if (!report.hasWarranty) {
      const err = new Error("El reporte no tiene garantía");
      err.statusCode = 400;
      throw err;
    }

    if (report.warrantyStatus === "approved") {
      const err = new Error("La garantía ya fue aprobada");
      err.statusCode = 400;
      throw err;
    }

    if (report.warrantyStatus === "rejected") {
      const err = new Error("La garantía ya fue rechazada");
      err.statusCode = 400;
      throw err;
    }

    if (report.stockRestored) {
      const err = new Error("El stock ya fue repuesto");
      err.statusCode = 400;
      throw err;
    }

    report.warrantyStatus = "approved";
    report.stockRestored = true;
    report.stockRestoredAt = new Date();
    report.lossAmount = 0;
    report.adminNotes = data?.adminNotes || report.adminNotes;

    const quantity = report.quantity || 0;
    let newStock = { warehouseStock: 0, totalStock: 0 };

    if (quantity > 0) {
      if (report.stockOrigin === "distributor" && report.distributor) {
        await DistributorStock.findOneAndUpdate(
          {
            distributor: report.distributor,
            product: report.product,
            business: businessId,
          },
          { $inc: { quantity } },
        );

        const product = await Product.findByIdAndUpdate(
          report.product,
          { $inc: { totalStock: quantity } },
          { new: true },
        ).lean();
        newStock = {
          warehouseStock: product?.warehouseStock || 0,
          totalStock: product?.totalStock || 0,
        };
      } else if (report.stockOrigin === "branch" && report.branch) {
        await BranchStock.findOneAndUpdate(
          {
            branch: report.branch,
            product: report.product,
            business: businessId,
          },
          { $inc: { quantity } },
        );

        const product = await Product.findByIdAndUpdate(
          report.product,
          { $inc: { totalStock: quantity } },
          { new: true },
        ).lean();
        newStock = {
          warehouseStock: product?.warehouseStock || 0,
          totalStock: product?.totalStock || 0,
        };
      } else {
        const product = await Product.findByIdAndUpdate(
          report.product,
          { $inc: { warehouseStock: quantity, totalStock: quantity } },
          { new: true },
        ).lean();
        newStock = {
          warehouseStock: product?.warehouseStock || 0,
          totalStock: product?.totalStock || 0,
        };
      }
    }

    await report.save();
    return { report, newStock };
  }

  async rejectWarranty(id, businessId, userId, data) {
    const report = await DefectiveProduct.findOne({
      _id: id,
      business: businessId,
    });

    if (!report) {
      const err = new Error("Reporte no encontrado");
      err.statusCode = 404;
      throw err;
    }

    if (!report.hasWarranty) {
      const err = new Error("El reporte no tiene garantía");
      err.statusCode = 400;
      throw err;
    }

    if (report.warrantyStatus === "approved") {
      const err = new Error("La garantía ya fue aprobada");
      err.statusCode = 400;
      throw err;
    }

    if (report.warrantyStatus === "rejected") {
      const err = new Error("La garantía ya fue rechazada");
      err.statusCode = 400;
      throw err;
    }

    const product = await Product.findOne({
      _id: report.product,
      business: businessId,
    }).lean();

    if (!product) {
      const err = new Error("Producto no encontrado");
      err.statusCode = 404;
      throw err;
    }

    const unitCost = product.averageCost || product.purchasePrice || 0;
    const lossAmount = unitCost * (report.quantity || 0);

    report.warrantyStatus = "rejected";
    report.lossAmount = lossAmount;
    report.adminNotes = data?.adminNotes || report.adminNotes;

    if (lossAmount > 0) {
      const existing = await ProfitHistory.findOne({
        business: businessId,
        type: "ajuste",
        "metadata.eventName": "defective_loss",
        "metadata.reportId": report._id,
      });

      if (existing) {
        if (existing.amount !== -lossAmount) {
          existing.amount = -lossAmount;
          existing.product = report.product;
          existing.metadata = {
            ...existing.metadata,
            quantity: report.quantity,
            unitCost,
          };
          await existing.save();
        }
      } else {
        await ProfitHistory.create({
          business: businessId,
          user: userId,
          type: "ajuste",
          amount: -lossAmount,
          product: report.product,
          description: `Pérdida por garantía rechazada (${report.quantity}): ${product.name}`,
          date: new Date(),
          metadata: {
            quantity: report.quantity,
            salePrice: 0,
            saleId: null,
            eventName: "defective_loss",
            reportId: report._id,
            unitCost,
          },
        });
      }
    }

    await report.save();
    return { report, lossAmount };
  }

  async cancelReport(id, businessId) {
    const report = await DefectiveProduct.findOne({
      _id: id,
      business: businessId,
    });

    if (!report) {
      const err = new Error("Reporte no encontrado");
      err.statusCode = 404;
      throw err;
    }

    const shouldRestore =
      report.status === "confirmado" && !report.stockRestored;
    const quantity = report.quantity || 0;

    if (shouldRestore && quantity > 0) {
      if (report.stockOrigin === "distributor" && report.distributor) {
        await DistributorStock.findOneAndUpdate(
          {
            distributor: report.distributor,
            product: report.product,
            business: businessId,
          },
          { $inc: { quantity } },
        );

        await Product.findByIdAndUpdate(report.product, {
          $inc: { totalStock: quantity },
        });
      } else if (report.stockOrigin === "branch" && report.branch) {
        await BranchStock.findOneAndUpdate(
          {
            branch: report.branch,
            product: report.product,
            business: businessId,
          },
          { $inc: { quantity } },
        );

        await Product.findByIdAndUpdate(report.product, {
          $inc: { totalStock: quantity },
        });
      } else {
        await Product.findByIdAndUpdate(report.product, {
          $inc: { warehouseStock: quantity, totalStock: quantity },
        });
      }
    }

    await DefectiveProduct.deleteOne({ _id: report._id });

    return {
      restoredQuantity: shouldRestore ? quantity : 0,
      restoredTo: report.stockOrigin || "warehouse",
    };
  }

  async getStats(businessId) {
    // Convertir businessId a ObjectId si es string
    const businessObjectId = mongoose.Types.ObjectId.isValid(businessId)
      ? new mongoose.Types.ObjectId(businessId)
      : businessId;

    const summary = await DefectiveProduct.aggregate([
      { $match: { business: businessObjectId } },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalLoss: { $sum: "$lossAmount" },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "pendiente"] }, 1, 0] },
          },
          confirmedCount: {
            $sum: { $cond: [{ $eq: ["$status", "confirmado"] }, 1, 0] },
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ["$status", "rechazado"] }, 1, 0] },
          },
          withWarranty: {
            $sum: { $cond: ["$hasWarranty", 1, 0] },
          },
          warrantyPending: {
            $sum: { $cond: [{ $eq: ["$warrantyStatus", "pending"] }, 1, 0] },
          },
          warrantyApproved: {
            $sum: { $cond: [{ $eq: ["$warrantyStatus", "approved"] }, 1, 0] },
          },
          stockRestored: {
            $sum: { $cond: ["$stockRestored", "$quantity", 0] },
          },
        },
      },
    ]);

    const stats = summary[0] || {
      totalReports: 0,
      totalQuantity: 0,
      totalLoss: 0,
      pendingCount: 0,
      confirmedCount: 0,
      rejectedCount: 0,
      withWarranty: 0,
      warrantyPending: 0,
      warrantyApproved: 0,
      stockRestored: 0,
    };

    return stats;
  }
}
