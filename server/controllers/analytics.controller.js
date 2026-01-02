import mongoose from "mongoose";
import DefectiveProduct from "../models/DefectiveProduct.js";
import Sale from "../models/Sale.js";
import SpecialSale from "../models/SpecialSale.js";

// Construye un rango de fechas usando la zona horaria de Colombia (UTC-5)
const buildColombiaRange = (startStr, endStr) => {
  if (!startStr && !endStr) return null;

  const range = {};

  if (startStr) {
    const date = new Date(startStr);
    range.$gte = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        5,
        0,
        0,
        0
      )
    );
  }
  if (endStr) {
    const date = new Date(endStr);
    range.$lte = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate() + 1,
        4,
        59,
        59,
        999
      )
    );
  }

  return range;
};

// @desc    Obtener resumen de ganancias del mes actual
// @route   GET /api/analytics/monthly-profit
// @access  Private/Admin
export const getMonthlyProfit = async (req, res) => {
  try {
    const businessFilter = req.businessId ? { business: req.businessId } : {};

    // Límites de mes en UTC para evitar desfaces por timezone
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();

    const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0) - 1);

    const startOfLastMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endOfLastMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0) - 1);

    const businessMatch = businessFilter.business
      ? { business: new mongoose.Types.ObjectId(businessFilter.business) }
      : {};

    const baseSaleMatch = {
      paymentStatus: "confirmado",
      ...businessMatch,
    };

    const sumPipeline = (start, end) => [
      { $match: { ...baseSaleMatch } },
      {
        $addFields: {
          opDate: { $ifNull: ["$saleDate", "$createdAt"] },
        },
      },
      {
        $match: {
          opDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          adminProfit: { $sum: "$adminProfit" },
          distributorProfit: { $sum: "$distributorProfit" },
          totalProfit: { $sum: "$totalProfit" },
          revenue: { $sum: { $multiply: ["$salePrice", "$quantity"] } },
          cost: { $sum: { $multiply: ["$purchasePrice", "$quantity"] } },
          salesCount: { $sum: 1 },
          unitsCount: { $sum: "$quantity" },
        },
      },
    ];

    const sumSpecialPipeline = (start, end) => [
      { $match: { status: "active", ...businessFilter } },
      {
        $addFields: {
          opDate: { $ifNull: ["$saleDate", "$createdAt"] },
        },
      },
      {
        $match: {
          opDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: "$totalProfit" },
          revenue: { $sum: { $multiply: ["$specialPrice", "$quantity"] } },
          cost: { $sum: { $multiply: ["$cost", "$quantity"] } },
          salesCount: { $sum: 1 },
          unitsCount: { $sum: "$quantity" },
        },
      },
    ];

    const [currentSaleAgg, lastSaleAgg, currentSpecialAgg, lastSpecialAgg] =
      await Promise.all([
        Sale.aggregate(sumPipeline(startOfMonth, endOfMonth)),
        Sale.aggregate(sumPipeline(startOfLastMonth, endOfLastMonth)),
        SpecialSale.aggregate(sumSpecialPipeline(startOfMonth, endOfMonth)),
        SpecialSale.aggregate(
          sumSpecialPipeline(startOfLastMonth, endOfLastMonth)
        ),
      ]);

    const normalize = (main = {}, special = {}) => {
      const m = main || {};
      const s = special || {};
      return {
        adminProfit: m.adminProfit || 0,
        distributorProfit: m.distributorProfit || 0,
        totalProfit: (m.totalProfit || 0) + (s.totalProfit || 0),
        revenue: (m.revenue || 0) + (s.revenue || 0),
        cost: (m.cost || 0) + (s.cost || 0),
        salesCount: (m.salesCount || 0) + (s.salesCount || 0),
        unitsCount: (m.unitsCount || 0) + (s.unitsCount || 0),
      };
    };

    const currentMonth = normalize(currentSaleAgg[0], currentSpecialAgg[0]);
    const lastMonth = normalize(lastSaleAgg[0], lastSpecialAgg[0]);

    // Calcular porcentaje de crecimiento
    const growthPercentage =
      lastMonth.totalProfit > 0
        ? ((currentMonth.totalProfit - lastMonth.totalProfit) /
            lastMonth.totalProfit) *
          100
        : currentMonth.totalProfit > 0
        ? 100
        : 0;

    res.json({
      currentMonth,
      lastMonth,
      growthPercentage: parseFloat(growthPercentage.toFixed(2)),
      averageTicket:
        currentMonth.salesCount > 0
          ? currentMonth.revenue / currentMonth.salesCount
          : 0,
      // Debug info
      _debug: {
        nowUTC: now.toISOString(),
        nowColombia: now.toISOString(),
        startOfMonth: startOfMonth.toISOString(),
        endOfMonth: endOfMonth.toISOString(),
        startOfLastMonth: startOfLastMonth.toISOString(),
        endOfLastMonth: endOfLastMonth.toISOString(),
        currentMonthSalesCount: currentMonth.salesCount,
        lastMonthSalesCount: lastMonth.salesCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener ganancias por producto
// @route   GET /api/analytics/profit-by-product
// @access  Private/Admin
export const getProfitByProduct = async (req, res) => {
  try {
    const businessFilter = req.businessId ? { business: req.businessId } : {};
    const { startDate, endDate } = req.query;

    const filter = { paymentStatus: "confirmado", ...businessFilter };
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) {
        // Convertir fecha a inicio del día en Colombia (00:00 Colombia = 05:00 UTC)
        const date = new Date(startDate);
        filter.saleDate.$gte = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            5,
            0,
            0
          )
        );
      }
      if (endDate) {
        // Convertir fecha a fin del día en Colombia (23:59:59 Colombia = 04:59:59 UTC del día siguiente)
        const date = new Date(endDate);
        filter.saleDate.$lte = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate() + 1,
            4,
            59,
            59,
            999
          )
        );
      }
    }

    const profitByProduct = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$product",
          totalQuantity: { $sum: "$quantity" },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ["$salePrice", "$quantity"] } },
          totalCost: { $sum: { $multiply: ["$purchasePrice", "$quantity"] } },
          totalAdminProfit: { $sum: "$adminProfit" },
          totalDistributorProfit: { $sum: "$distributorProfit" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          productId: "$_id",
          productName: "$product.name",
          productImage: "$product.image",
          totalQuantity: 1,
          totalSales: 1,
          totalRevenue: 1,
          totalCost: 1,
          totalAdminProfit: 1,
          totalDistributorProfit: 1,
          totalProfit: 1,
          profitMargin: {
            $cond: [
              { $gt: ["$totalRevenue", 0] },
              {
                $multiply: [
                  { $divide: ["$totalProfit", "$totalRevenue"] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { totalProfit: -1 } },
    ]);

    res.json(profitByProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener ganancias por distribuidor
// @route   GET /api/analytics/profit-by-distributor
// @access  Private/Admin
export const getProfitByDistributor = async (req, res) => {
  try {
    const businessFilter = req.businessId ? { business: req.businessId } : {};
    const { startDate, endDate } = req.query;

    const filter = { paymentStatus: "confirmado", ...businessFilter };
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) {
        // Convertir fecha a inicio del día en Colombia (00:00 Colombia = 05:00 UTC)
        const date = new Date(startDate);
        filter.saleDate.$gte = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            5,
            0,
            0
          )
        );
      }
      if (endDate) {
        // Convertir fecha a fin del día en Colombia (23:59:59 Colombia = 04:59:59 UTC del día siguiente)
        const date = new Date(endDate);
        filter.saleDate.$lte = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate() + 1,
            4,
            59,
            59,
            999
          )
        );
      }
    }

    const profitByDistributor = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$distributor",
          totalQuantity: { $sum: "$quantity" },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ["$salePrice", "$quantity"] } },
          totalCost: { $sum: { $multiply: ["$purchasePrice", "$quantity"] } },
          totalAdminProfit: { $sum: "$adminProfit" },
          totalDistributorProfit: { $sum: "$distributorProfit" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "distributor",
        },
      },
      { $unwind: "$distributor" },
      {
        $project: {
          distributorId: "$_id",
          distributorName: "$distributor.name",
          distributorEmail: "$distributor.email",
          totalQuantity: 1,
          totalSales: 1,
          totalRevenue: 1,
          totalCost: 1,
          totalAdminProfit: 1,
          totalDistributorProfit: 1,
          totalProfit: 1,
          averageSale: { $divide: ["$totalRevenue", "$totalSales"] },
        },
      },
      { $sort: { totalAdminProfit: -1 } },
    ]);

    res.json(profitByDistributor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener promedios diarios/semanales/mensuales
// @route   GET /api/analytics/averages
// @access  Private/Admin
export const getAverages = async (req, res) => {
  try {
    const businessFilter = req.businessId ? { business: req.businessId } : {};
    const {
      period = "month",
      startDate: startDateStr,
      endDate: endDateStr,
    } = req.query; // day, week, month

    const now = new Date();
    let startDate, endDate, days;

    const buildColombiaRange = (startStr, endStr) => {
      if (!startStr && !endStr) return null;

      const range = {};

      if (startStr) {
        const date = new Date(startStr);
        range.$gte = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            5,
            0,
            0,
            0
          )
        );
      }
      if (endStr) {
        const date = new Date(endStr);
        range.$lte = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate() + 1,
            4,
            59,
            59,
            999
          )
        );
      }

      return range;
    };

    const computeDaysInclusive = (startStr, endStr) => {
      if (!startStr || !endStr) return null;
      const s = new Date(startStr);
      const e = new Date(endStr);
      const sDay = Date.UTC(
        s.getUTCFullYear(),
        s.getUTCMonth(),
        s.getUTCDate()
      );
      const eDay = Date.UTC(
        e.getUTCFullYear(),
        e.getUTCMonth(),
        e.getUTCDate()
      );
      const diff = Math.floor((eDay - sDay) / 86400000) + 1;
      return Math.max(diff, 1);
    };

    const customDays = computeDaysInclusive(startDateStr, endDateStr);

    if (startDateStr || endDateStr) {
      const range = buildColombiaRange(startDateStr, endDateStr);
      startDate = range?.$gte;
      endDate = range?.$lte;
      days = customDays ?? 1;
    } else {
      switch (period) {
        case "day":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          days = 1;
          break;
        case "week":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          days = 7;
          break;
        case "month":
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          days = now.getDate();
          break;
      }
    }

    const saleFilter = {
      paymentStatus: "confirmado",
      ...businessFilter,
      ...(startDate || endDate
        ? {
            saleDate: {
              ...(startDate ? { $gte: startDate } : {}),
              ...(endDate ? { $lte: endDate } : {}),
            },
          }
        : { saleDate: { $gte: startDate } }),
    };

    const specialFilter = {
      status: "active",
      ...businessFilter,
      ...(startDate || endDate
        ? {
            saleDate: {
              ...(startDate ? { $gte: startDate } : {}),
              ...(endDate ? { $lte: endDate } : {}),
            },
          }
        : { saleDate: { $gte: startDate } }),
    };

    const [sales, specialSales] = await Promise.all([
      Sale.find(saleFilter),
      SpecialSale.find(specialFilter),
    ]);

    const totals = sales.reduce(
      (acc, sale) => {
        acc.totalRevenue += sale.salePrice * sale.quantity;
        acc.totalProfit += sale.totalProfit;
        acc.totalSales += 1;
        acc.totalUnits += sale.quantity;
        return acc;
      },
      { totalRevenue: 0, totalProfit: 0, totalSales: 0, totalUnits: 0 }
    );

    // Incluir ventas especiales en promedios
    specialSales.forEach((sale) => {
      totals.totalRevenue += sale.specialPrice * sale.quantity;
      totals.totalProfit += sale.totalProfit;
      totals.totalSales += 1;
      totals.totalUnits += sale.quantity;
    });

    res.json({
      period,
      days,
      averageRevenuePerDay: totals.totalRevenue / days,
      averageProfitPerDay: totals.totalProfit / days,
      averageSalesPerDay: totals.totalSales / days,
      averageUnitsPerDay: totals.totalUnits / days,
      totalRevenue: totals.totalRevenue,
      totalProfit: totals.totalProfit,
      totalSales: totals.totalSales,
      totalUnits: totals.totalUnits,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener datos para gráfica de ventas en el tiempo
// @route   GET /api/analytics/sales-timeline
// @access  Private/Admin
export const getSalesTimeline = async (req, res) => {
  try {
    const businessFilter = req.businessId ? { business: req.businessId } : {};
    const {
      days = 30,
      startDate: startDateStr,
      endDate: endDateStr,
    } = req.query;

    let dateFilter;
    if (startDateStr || endDateStr) {
      dateFilter = buildColombiaRange(startDateStr, endDateStr);
    } else {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      startDate.setHours(0, 0, 0, 0);
      dateFilter = { $gte: startDate };
    }

    const sales = await Sale.find({
      saleDate: dateFilter,
      paymentStatus: "confirmado",
      ...businessFilter,
    }).sort({ saleDate: 1 });

    const specialSales = await SpecialSale.find({
      saleDate: dateFilter,
      status: "active",
      ...businessFilter,
    }).sort({ saleDate: 1 });

    // Agrupar por día
    const salesByDay = {};
    const toColombiaDayKey = (date) => {
      // Convertimos a día Colombia (UTC-5) para evitar corrimientos de fecha
      const colombia = new Date(date.getTime() - 5 * 60 * 60000);
      return colombia.toISOString().split("T")[0];
    };
    sales.forEach((sale) => {
      if (!sale.saleDate) return; // omit invalid records
      const day = toColombiaDayKey(sale.saleDate);
      if (!salesByDay[day]) {
        salesByDay[day] = {
          date: day,
          sales: 0,
          revenue: 0,
          profit: 0,
          units: 0,
          cost: 0,
        };
      }
      salesByDay[day].sales += 1;
      salesByDay[day].revenue += sale.salePrice * sale.quantity;
      salesByDay[day].profit += sale.totalProfit;
      salesByDay[day].units += sale.quantity;
      salesByDay[day].cost += sale.purchasePrice * sale.quantity;
    });

    // Agregar ventas especiales
    specialSales.forEach((sale) => {
      if (!sale.saleDate) return; // omit invalid records
      const day = toColombiaDayKey(sale.saleDate);
      if (!salesByDay[day]) {
        salesByDay[day] = {
          date: day,
          sales: 0,
          revenue: 0,
          profit: 0,
          units: 0,
          cost: 0,
        };
      }
      salesByDay[day].sales += 1;
      salesByDay[day].revenue += sale.specialPrice * sale.quantity;
      salesByDay[day].profit += sale.totalProfit;
      salesByDay[day].units += sale.quantity;
      salesByDay[day].cost += sale.cost * sale.quantity;
    });

    const timeline = Object.values(salesByDay);
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener resumen financiero completo
// @route   GET /api/analytics/financial-summary
// @access  Private/Admin
export const getFinancialSummary = async (req, res) => {
  try {
    const businessFilter = req.businessId ? { business: req.businessId } : {};
    const { startDate, endDate } = req.query;

    const filter = { paymentStatus: "confirmado", ...businessFilter };
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) {
        // Convertir fecha a inicio del día en Colombia (00:00 Colombia = 05:00 UTC)
        const date = new Date(startDate);
        filter.saleDate.$gte = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            5,
            0,
            0
          )
        );
      }
      if (endDate) {
        // Convertir fecha a fin del día en Colombia (23:59:59 Colombia = 04:59:59 UTC del día siguiente)
        const date = new Date(endDate);
        filter.saleDate.$lte = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate() + 1,
            4,
            59,
            59,
            999
          )
        );
      }
    }

    const sales = await Sale.find(filter);

    const specialFilter = { status: "active", ...businessFilter };
    if (startDate || endDate) {
      specialFilter.saleDate = {};
      if (startDate) {
        const date = new Date(startDate);
        specialFilter.saleDate.$gte = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            5,
            0,
            0
          )
        );
      }
      if (endDate) {
        const date = new Date(endDate);
        specialFilter.saleDate.$lte = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate() + 1,
            4,
            59,
            59,
            999
          )
        );
      }
    }

    const specialSales = await SpecialSale.find(specialFilter);

    const defectiveDateRange = buildColombiaRange(startDate, endDate);

    const defectiveProducts = await DefectiveProduct.find({
      status: "confirmado",
      ...businessFilter,
      ...(defectiveDateRange ? { reportDate: defectiveDateRange } : {}),
    });

    // Calcular totales
    const totals = sales.reduce(
      (acc, sale) => {
        acc.totalCost += sale.purchasePrice * sale.quantity;
        acc.totalRevenue += sale.salePrice * sale.quantity;
        acc.totalAdminProfit += sale.adminProfit;
        acc.totalDistributorProfit += sale.distributorProfit;
        acc.totalProfit += sale.totalProfit;
        acc.totalSales += 1;
        acc.totalUnits += sale.quantity;
        return acc;
      },
      {
        totalCost: 0,
        totalRevenue: 0,
        totalAdminProfit: 0,
        totalDistributorProfit: 0,
        totalProfit: 0,
        totalSales: 0,
        totalUnits: 0,
      }
    );

    // Agregar ventas especiales a los totales
    specialSales.forEach((sale) => {
      totals.totalCost += sale.cost * sale.quantity;
      totals.totalRevenue += sale.specialPrice * sale.quantity;
      totals.totalProfit += sale.totalProfit;
      totals.totalSales += 1;
      totals.totalUnits += sale.quantity;
    });

    // Calcular pérdidas por defectuosos
    const defectiveLoss = defectiveProducts.reduce((sum, def) => {
      return sum + def.quantity;
    }, 0);

    res.json({
      ...totals,
      profitMargin:
        totals.totalRevenue > 0
          ? (totals.totalProfit / totals.totalRevenue) * 100
          : 0,
      averageTicket:
        totals.totalSales > 0 ? totals.totalRevenue / totals.totalSales : 0,
      defectiveUnits: defectiveLoss,
      defectiveRate:
        totals.totalUnits > 0 ? (defectiveLoss / totals.totalUnits) * 100 : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener dashboard completo de analytics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
export const getAnalyticsDashboard = async (req, res) => {
  try {
    const businessFilter = req.businessId ? { business: req.businessId } : {};
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Ventas del mes
    const monthlySales = await Sale.find({
      saleDate: { $gte: startOfMonth },
      paymentStatus: "confirmado",
      ...businessFilter,
    });

    // Ventas especiales del mes
    const monthlySpecialSales = await SpecialSale.find({
      saleDate: { $gte: startOfMonth },
      status: "active",
      ...businessFilter,
    });

    // Top productos
    const topProducts = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startOfMonth },
          paymentStatus: "confirmado",
          ...businessFilter,
        },
      },
      {
        $group: {
          _id: "$product",
          totalQuantity: { $sum: "$quantity" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          name: "$product.name",
          image: "$product.image",
          totalQuantity: 1,
          totalProfit: 1,
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);

    // Top distribuidores
    const topDistributors = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startOfMonth },
          paymentStatus: "confirmado",
          ...businessFilter,
        },
      },
      {
        $group: {
          _id: "$distributor",
          totalSales: { $sum: 1 },
          totalProfit: { $sum: "$adminProfit" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "distributor",
        },
      },
      { $unwind: "$distributor" },
      {
        $project: {
          name: "$distributor.name",
          totalSales: 1,
          totalProfit: 1,
        },
      },
      { $sort: { totalProfit: -1 } },
      { $limit: 5 },
    ]);

    const monthlyTotals = monthlySales.reduce(
      (acc, sale) => {
        acc.totalRevenue += sale.salePrice * sale.quantity;
        acc.totalProfit += sale.totalProfit;
        acc.totalSales += 1;
        return acc;
      },
      { totalRevenue: 0, totalProfit: 0, totalSales: 0 }
    );

    // Agregar ventas especiales a los totales mensuales
    monthlySpecialSales.forEach((sale) => {
      monthlyTotals.totalRevenue += sale.specialPrice * sale.quantity;
      monthlyTotals.totalProfit += sale.totalProfit;
      monthlyTotals.totalSales += 1;
    });

    res.json({
      monthlyTotals,
      topProducts,
      topDistributors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener resumen combinado (ventas normales + especiales)
// @route   GET /api/analytics/combined-summary
// @access  Private/Admin
export const getCombinedSummary = async (req, res) => {
  try {
    const businessFilter = req.businessId ? { business: req.businessId } : {};
    const { startDate, endDate } = req.query;

    // Filtros para ventas normales
    const salesFilter = { paymentStatus: "confirmado", ...businessFilter };
    if (startDate || endDate) {
      salesFilter.saleDate = {};
      if (startDate) {
        const date = new Date(startDate);
        salesFilter.saleDate.$gte = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            5,
            0,
            0
          )
        );
      }
      if (endDate) {
        const date = new Date(endDate);
        salesFilter.saleDate.$lte = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate() + 1,
            4,
            59,
            59,
            999
          )
        );
      }
    }

    // Filtros para ventas especiales
    const specialSalesFilter = { status: "active", ...businessFilter };
    if (startDate || endDate) {
      specialSalesFilter.saleDate = {};
      if (startDate) specialSalesFilter.saleDate.$gte = new Date(startDate);
      if (endDate) specialSalesFilter.saleDate.$lte = new Date(endDate);
    }

    // Obtener ventas normales
    const normalSales = await Sale.find(salesFilter);
    const normalTotals = normalSales.reduce(
      (acc, sale) => {
        acc.revenue += sale.salePrice * sale.quantity;
        acc.cost += sale.purchasePrice * sale.quantity;
        acc.profit += sale.totalProfit;
        acc.count += 1;
        return acc;
      },
      { revenue: 0, cost: 0, profit: 0, count: 0 }
    );

    // Obtener ventas especiales
    const specialSales = await SpecialSale.find(specialSalesFilter);
    const specialTotals = specialSales.reduce(
      (acc, sale) => {
        acc.revenue += sale.specialPrice * sale.quantity;
        acc.cost += sale.cost * sale.quantity;
        acc.profit += sale.totalProfit;
        acc.count += 1;
        return acc;
      },
      { revenue: 0, cost: 0, profit: 0, count: 0 }
    );

    res.json({
      success: true,
      data: {
        normal: {
          revenue: normalTotals.revenue,
          cost: normalTotals.cost,
          profit: normalTotals.profit,
          count: normalTotals.count,
        },
        special: {
          revenue: specialTotals.revenue,
          cost: specialTotals.cost,
          profit: specialTotals.profit,
          count: specialTotals.count,
        },
        combined: {
          revenue: normalTotals.revenue + specialTotals.revenue,
          cost: normalTotals.cost + specialTotals.cost,
          profit: normalTotals.profit + specialTotals.profit,
          count: normalTotals.count + specialTotals.count,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener resumen combinado:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el resumen combinado",
    });
  }
};
