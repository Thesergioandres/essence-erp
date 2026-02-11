import React, { useEffect, useMemo, useState } from "react";
import { analyticsService } from "../../analytics/services";
import type {
  GamificationConfig,
  RankingEntry,
} from "../../analytics/types/gamification.types";
import { gamificationService } from "../../common/services";
import { saleService } from "../../sales/services";
import type { Sale } from "../../sales/types/sales.types";
import LeaderboardTable from "../components/LeaderboardTable";

interface EstimatedProfitProduct {
  productId: string;
  name: string;
  image?: { url: string; publicId: string };
  quantity: number;
  distributorPrice: number;
  clientPrice: number;
  investment: number;
  salesValue: number;
  estimatedProfit: number;
  profitPercentage: string;
}

interface DistributorEstimate {
  grossProfit: number;
  netProfit: number;
  totalProducts: number;
  totalUnits: number;
  investment: number;
  salesValue: number;
  profitMargin: string;
  profitability?: number; // Ganancia / Ventas × 100
  products: EstimatedProfitProduct[];
}

export default function DistributorStats() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  });
  const [chartRange, setChartRange] = useState<"7d" | "30d" | "90d">("30d");
  const [previousStats, setPreviousStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
  });
  const [estimatedProfit, setEstimatedProfit] =
    useState<DistributorEstimate | null>(null);
  const [loadingEstimated, setLoadingEstimated] = useState(true);
  const [showEstimatedProducts, setShowEstimatedProducts] = useState(false);
  const [rankingData, setRankingData] = useState<RankingEntry[]>([]);
  const [gamificationConfig, setGamificationConfig] =
    useState<GamificationConfig | null>(null);

  const loadStats = React.useCallback(async () => {
    try {
      setLoading(true);

      const startDate = dateRange.startDate;
      const endDate = dateRange.endDate;
      const rangeStart = new Date(`${startDate}T00:00:00`);
      const rangeEnd = new Date(`${endDate}T23:59:59`);
      const dayMs = 24 * 60 * 60 * 1000;
      const rangeDays = Math.max(
        1,
        Math.round((rangeEnd.getTime() - rangeStart.getTime()) / dayMs) + 1
      );
      const prevEnd = new Date(rangeStart.getTime() - dayMs);
      const prevStart = new Date(prevEnd.getTime() - (rangeDays - 1) * dayMs);

      const [currentRes, previousRes] = await Promise.all([
        saleService.getDistributorSales(undefined, {
          startDate,
          endDate,
          limit: 500,
        }),
        saleService.getDistributorSales(undefined, {
          startDate: prevStart.toISOString().slice(0, 10),
          endDate: prevEnd.toISOString().slice(0, 10),
          limit: 500,
        }),
      ]);

      const currentSales = currentRes?.sales || [];
      const previousSales = previousRes?.sales || [];
      setSales(currentSales);

      const prevStats = previousRes?.stats || {
        totalSales: previousSales.length,
        totalRevenue: previousSales.reduce(
          (sum, sale) => sum + sale.salePrice * sale.quantity,
          0
        ),
        totalDistributorProfit: previousSales.reduce(
          (sum, sale) => sum + (sale.distributorProfit || 0),
          0
        ),
      };

      setPreviousStats({
        totalSales: prevStats.totalSales || 0,
        totalRevenue: prevStats.totalRevenue || 0,
        totalProfit: prevStats.totalDistributorProfit || 0,
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange.endDate, dateRange.startDate]);

  const loadEstimatedProfit = React.useCallback(async () => {
    try {
      setLoadingEstimated(true);
      const response = await analyticsService.getDistributorEstimatedProfit();
      setEstimatedProfit(response.estimatedProfit as any);
    } catch (error) {
      console.error("Error al cargar ganancia estimada:", error);
    } finally {
      setLoadingEstimated(false);
    }
  }, []);

  const loadRanking = React.useCallback(async () => {
    try {
      const businessId = localStorage.getItem("businessId") || undefined;
      const [configRes, rankingRes] = await Promise.all([
        gamificationService.getConfig().catch(() => null),
        gamificationService
          .getRanking({ period: "current", businessId })
          .catch(() => null),
      ]);
      setGamificationConfig(configRes as GamificationConfig | null);
      setRankingData(rankingRes?.rankings || []);
    } catch (error) {
      console.error("Error al cargar ranking:", error);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [dateRange.endDate, dateRange.startDate, loadStats]);

  useEffect(() => {
    loadEstimatedProfit();
  }, [loadEstimatedProfit]);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) =>
    `${value.toFixed(1).replace("-0.0", "0.0")}%`;

  const calculateDelta = (current: number, previous: number) => {
    if (!previous) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const setPresetRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setDateRange({
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    });
  };

  // Calcular estadísticas
  const totalSales = sales.length;
  const totalRevenue = sales.reduce(
    (sum, sale) => sum + sale.salePrice * sale.quantity,
    0
  );
  const totalProfit = sales.reduce(
    (sum, sale) => sum + (sale.distributorProfit || 0),
    0
  );
  const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  const avgProfit = totalSales > 0 ? totalProfit / totalSales : 0;
  const adminDue = sales.reduce((sum, sale) => {
    const pct = sale.distributorProfitPercentage ?? 0;
    const fallbackDistributorPrice = sale.salePrice * ((100 - pct) / 100);
    const unitPrice = sale.distributorPrice ?? fallbackDistributorPrice;
    return sum + unitPrice * sale.quantity;
  }, 0);
  const netCommission = totalProfit;

  const deltaSales = calculateDelta(totalSales, previousStats.totalSales);
  const deltaRevenue = calculateDelta(totalRevenue, previousStats.totalRevenue);
  const deltaProfit = calculateDelta(totalProfit, previousStats.totalProfit);
  const previousAvgSale = previousStats.totalSales
    ? previousStats.totalRevenue / previousStats.totalSales
    : 0;
  const deltaAvgSale = calculateDelta(avgSaleValue, previousAvgSale);

  // Productos más vendidos
  const productSales = sales.reduce(
    (acc, sale) => {
      const product = typeof sale.product === "object" ? sale.product : null;
      if (!product) return acc;

      const existing = acc.find(item => item.productId === product._id);
      if (existing) {
        existing.quantity += sale.quantity;
        existing.revenue += sale.salePrice * sale.quantity;
        existing.profit += sale.distributorProfit;
      } else {
        acc.push({
          productId: product._id,
          productName: product.name,
          productImage: product.image?.url,
          quantity: sale.quantity,
          revenue: sale.salePrice * sale.quantity,
          profit: sale.distributorProfit,
        });
      }
      return acc;
    },
    [] as Array<{
      productId: string;
      productName: string;
      productImage?: string;
      quantity: number;
      revenue: number;
      profit: number;
    }>
  );

  const topProducts = productSales
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const topProductsByProfit = [...productSales]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    sales.forEach(sale => {
      const key = sale.paymentMethodCode || "sin_metodo";
      const current = map.get(key) || { count: 0, revenue: 0 };
      map.set(key, {
        count: current.count + 1,
        revenue: current.revenue + sale.salePrice * sale.quantity,
      });
    });
    return Array.from(map.entries()).map(([key, value]) => ({
      key,
      label:
        key === "cash"
          ? "Efectivo"
          : key === "transfer"
            ? "Transferencia"
            : key === "credit"
              ? "Credito"
              : "Otro",
      ...value,
    }));
  }, [sales]);

  const deliveryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach(sale => {
      const key = sale.deliveryMethodCode || "sin_entrega";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([key, count]) => ({
      key,
      label: key === "delivery" ? "Domicilio" : "Retiro",
      count,
    }));
  }, [sales]);

  const topCustomers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; revenue: number }
    >();
    sales.forEach(sale => {
      const customerName =
        sale.customerName ||
        (typeof sale.customer === "object" ? sale.customer?.name : "") ||
        "Sin cliente";
      const current = map.get(customerName) || {
        name: customerName,
        count: 0,
        revenue: 0,
      };
      map.set(customerName, {
        name: customerName,
        count: current.count + 1,
        revenue: current.revenue + sale.salePrice * sale.quantity,
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [sales]);

  const chartData = useMemo(() => {
    const end = new Date(`${dateRange.endDate}T00:00:00`);
    const days = chartRange === "7d" ? 7 : chartRange === "30d" ? 30 : 90;
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    const dayMs = 24 * 60 * 60 * 1000;
    const buckets: Array<{ date: string; revenue: number; profit: number }> =
      [];
    for (let i = 0; i < days; i += 1) {
      const current = new Date(start.getTime() + i * dayMs);
      const key = current.toISOString().slice(0, 10);
      buckets.push({ date: key, revenue: 0, profit: 0 });
    }
    const bucketMap = new Map(buckets.map(item => [item.date, item]));
    sales.forEach(sale => {
      const key = sale.saleDate?.slice(0, 10);
      const bucket = bucketMap.get(key);
      if (!bucket) return;
      bucket.revenue += sale.salePrice * sale.quantity;
      bucket.profit += sale.distributorProfit || 0;
    });
    return buckets;
  }, [chartRange, dateRange.endDate, sales]);

  const chartWidth = 640;
  const chartHeight = 160;
  const chartMax = Math.max(
    1,
    ...chartData.map(item => Math.max(item.revenue, item.profit))
  );

  const buildLinePath = (values: number[]) => {
    if (values.length === 0) return "";
    const step = chartWidth / Math.max(values.length - 1, 1);
    return values
      .map((value, index) => {
        const x = index * step;
        const y = chartHeight - (value / chartMax) * chartHeight;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  const buildAreaPath = (values: number[]) => {
    if (values.length === 0) return "";
    const step = chartWidth / Math.max(values.length - 1, 1);
    const line = values
      .map((value, index) => {
        const x = index * step;
        const y = chartHeight - (value / chartMax) * chartHeight;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
    return `${line} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Estadísticas</h1>
          <p className="mt-2 text-gray-400">Análisis de tu desempeño</p>
        </div>

        {/* Date Range Picker */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2">
            <label className="text-xs text-gray-400">Inicio</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-100"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2">
            <label className="text-xs text-gray-400">Fin</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-100"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPresetRange(1)}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-blue-500 hover:text-white"
            >
              Hoy
            </button>
            <button
              onClick={() => setPresetRange(7)}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-blue-500 hover:text-white"
            >
              Semana
            </button>
            <button
              onClick={() => setPresetRange(30)}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-blue-500 hover:text-white"
            >
              Mes
            </button>
            <button
              onClick={() => setPresetRange(90)}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-blue-500 hover:text-white"
            >
              90d
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="bg-linear-to-br rounded-xl border border-gray-700 from-blue-900/50 to-gray-800/50 p-6">
          <p className="text-sm text-gray-400">Total Ventas</p>
          <p className="mt-2 text-3xl font-bold text-white">{totalSales}</p>
          <p
            className={`mt-1 text-xs ${
              deltaSales >= 0 ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {deltaSales >= 0 ? "▲" : "▼"} {formatPercent(deltaSales)}
          </p>
        </div>
        <div className="bg-linear-to-br rounded-xl border border-gray-700 from-green-900/50 to-gray-800/50 p-6">
          <p className="text-sm text-gray-400">Ingresos Totales</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrency(totalRevenue)}
          </p>
          <p
            className={`mt-1 text-xs ${
              deltaRevenue >= 0 ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {deltaRevenue >= 0 ? "▲" : "▼"} {formatPercent(deltaRevenue)}
          </p>
        </div>
        <div className="bg-linear-to-br rounded-xl border border-gray-700 from-purple-900/50 to-gray-800/50 p-6">
          <p className="text-sm text-gray-400">Comision Neta</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrency(netCommission)}
          </p>
          <p
            className={`mt-1 text-xs ${
              deltaProfit >= 0 ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {deltaProfit >= 0 ? "▲" : "▼"} {formatPercent(deltaProfit)}
          </p>
        </div>
        <div className="bg-linear-to-br rounded-xl border border-gray-700 from-yellow-900/50 to-gray-800/50 p-6">
          <p className="text-sm text-gray-400">Ticket Promedio</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrency(avgSaleValue)}
          </p>
          <p
            className={`mt-1 text-xs ${
              deltaAvgSale >= 0 ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {deltaAvgSale >= 0 ? "▲" : "▼"} {formatPercent(deltaAvgSale)}
          </p>
        </div>
        <div className="bg-linear-to-br rounded-xl border border-gray-700 from-cyan-900/50 to-gray-800/50 p-6">
          <p className="text-sm text-gray-400">Saldo a entregar al Admin</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrency(adminDue)}
          </p>
        </div>
        <div className="bg-linear-to-br rounded-xl border border-gray-700 from-emerald-900/40 to-gray-800/50 p-6">
          <p className="text-sm text-gray-400">Ganancia Promedio</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrency(avgProfit)}
          </p>
        </div>
      </div>

      {/* Ganancia Estimada con Inventario Actual */}
      <div className="rounded-xl border border-teal-700/50 bg-gradient-to-br from-teal-900/30 to-gray-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              📊 Ganancia Estimada
            </h2>
            <p className="text-sm text-gray-400">
              Basado en tu inventario actual
            </p>
          </div>
          {estimatedProfit && estimatedProfit.products.length > 0 && (
            <button
              onClick={() => setShowEstimatedProducts(!showEstimatedProducts)}
              className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300 transition hover:bg-teal-500/30"
            >
              {showEstimatedProducts ? "Ocultar productos" : "Ver productos"}
            </button>
          )}
        </div>

        {loadingEstimated ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-500"></div>
          </div>
        ) : estimatedProfit ? (
          <>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                <p className="text-xs text-gray-400">Ganancia Bruta Est.</p>
                <p className="mt-1 text-xl font-bold text-teal-300">
                  {formatCurrency(estimatedProfit.grossProfit)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                <p className="text-xs text-gray-400">Inversión (tu costo)</p>
                <p className="mt-1 text-xl font-bold text-amber-300">
                  {formatCurrency(estimatedProfit.investment)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                <p className="text-xs text-gray-400">Valor en Ventas</p>
                <p className="mt-1 text-xl font-bold text-green-300">
                  {formatCurrency(estimatedProfit.salesValue)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                <p className="text-xs text-gray-400">Productos</p>
                <p className="mt-1 text-xl font-bold text-purple-300">
                  {estimatedProfit.totalProducts}
                </p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                <p className="text-xs text-gray-400">Total Unidades</p>
                <p className="mt-1 text-xl font-bold text-blue-300">
                  {estimatedProfit.totalUnits.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                <p className="text-xs text-gray-400">📈 Rentabilidad</p>
                <p className="mt-1 text-xl font-bold text-teal-300">
                  {estimatedProfit.profitability ??
                    (estimatedProfit.salesValue > 0
                      ? (
                          (estimatedProfit.grossProfit /
                            estimatedProfit.salesValue) *
                          100
                        ).toFixed(1)
                      : 0)}
                  %
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Ganancia / Ventas
                </p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                <p className="text-xs text-gray-400">⚡ Multiplicador</p>
                <p className="mt-1 text-xl font-bold text-amber-300">
                  {estimatedProfit.profitMargin}%
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Ganancia / Inversión
                </p>
              </div>
            </div>

            {/* Lista de productos con ganancia estimada */}
            {showEstimatedProducts && estimatedProfit.products.length > 0 && (
              <div className="mt-4 rounded-lg border border-gray-700 bg-gray-900/30 p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Desglose por Producto
                </h3>
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {estimatedProfit.products
                    .sort((a, b) => b.estimatedProfit - a.estimatedProfit)
                    .map(product => (
                      <div
                        key={product.productId}
                        className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          {product.image?.url && (
                            <img
                              src={product.image.url}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {product.quantity} uds ×{" "}
                              {formatCurrency(product.clientPrice)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-teal-300">
                            {formatCurrency(product.estimatedProfit)}
                          </p>
                          <p className="text-xs text-gray-400">
                            +{product.profitPercentage}%
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-gray-400">
            No tienes inventario disponible para calcular ganancia estimada
          </div>
        )}
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Métricas Adicionales
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
              <span className="text-gray-400">Ganancia promedio por venta</span>
              <span className="text-lg font-bold text-purple-400">
                {formatCurrency(avgProfit)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
              <span className="text-gray-400">
                Productos diferentes vendidos
              </span>
              <span className="text-lg font-bold text-blue-400">
                {productSales.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Margen de ganancia promedio</span>
              <span className="text-lg font-bold text-green-400">
                {totalRevenue > 0
                  ? ((totalProfit / totalRevenue) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Actividad</h2>
            <div className="flex gap-2">
              {["7d", "30d", "90d"].map(range => (
                <button
                  key={range}
                  onClick={() => setChartRange(range as "7d" | "30d" | "90d")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    chartRange === range
                      ? "bg-cyan-500/20 text-cyan-200"
                      : "bg-gray-900/60 text-gray-400 hover:text-white"
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {chartData.length === 0 ? (
            <p className="py-8 text-center text-gray-400">
              No hay datos de ventas
            </p>
          ) : (
            <div className="space-y-3">
              <div className="h-44 w-full rounded-lg border border-gray-700 bg-gray-900/60 p-3">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="h-full w-full"
                >
                  <defs>
                    <linearGradient
                      id="areaRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={buildAreaPath(chartData.map(item => item.revenue))}
                    fill="url(#areaRevenue)"
                  />
                  <path
                    d={buildLinePath(chartData.map(item => item.revenue))}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2"
                  />
                  <path
                    d={buildLinePath(chartData.map(item => item.profit))}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs text-gray-400">
                <span>{chartData[0]?.date}</span>
                <span>{chartData[chartData.length - 1]?.date}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-300">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Ingresos
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-400" />
                  Comision
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment / Delivery / Customers */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Metodos de Pago
          </h2>
          {paymentBreakdown.length === 0 ? (
            <p className="py-6 text-center text-gray-400">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {paymentBreakdown.map(item => (
                <div
                  key={item.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-300">{item.label}</span>
                  <div className="text-right">
                    <p className="font-semibold text-white">{item.count}</p>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Metodos de Entrega
          </h2>
          {deliveryBreakdown.length === 0 ? (
            <p className="py-6 text-center text-gray-400">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {deliveryBreakdown.map(item => (
                <div
                  key={item.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-300">{item.label}</span>
                  <span className="font-semibold text-white">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Top Clientes
          </h2>
          {topCustomers.length === 0 ? (
            <p className="py-6 text-center text-gray-400">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {topCustomers.map(customer => (
                <div
                  key={customer.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-semibold text-white">{customer.name}</p>
                    <p className="text-xs text-gray-400">
                      {customer.count} compras
                    </p>
                  </div>
                  <span className="font-semibold text-emerald-300">
                    {formatCurrency(customer.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Productos Más Vendidos
        </h2>
        {topProducts.length === 0 ? (
          <p className="py-8 text-center text-gray-400">
            No hay datos de productos
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topProducts.map((product, index) => (
              <div
                key={product.productId}
                className="rounded-lg border border-gray-700 bg-gray-900/50 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-linear-to-r flex h-10 w-10 items-center justify-center rounded-full from-blue-600 to-cyan-600 font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {product.productName}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          Unidades vendidas:
                        </span>
                        <span className="font-semibold text-blue-400">
                          {product.quantity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ingresos:</span>
                        <span className="font-semibold text-green-400">
                          {formatCurrency(product.revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ganancia:</span>
                        <span className="font-semibold text-purple-400">
                          {formatCurrency(product.profit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Products by Profit */}
      <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Top Productos por Utilidad
        </h2>
        {topProductsByProfit.length === 0 ? (
          <p className="py-8 text-center text-gray-400">
            No hay datos de productos
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topProductsByProfit.map((product, index) => (
              <div
                key={`${product.productId}-profit`}
                className="rounded-lg border border-gray-700 bg-gray-900/50 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-linear-to-r flex h-10 w-10 items-center justify-center rounded-full from-purple-600 to-indigo-600 font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {product.productName}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Unidades:</span>
                        <span className="font-semibold text-blue-400">
                          {product.quantity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ingresos:</span>
                        <span className="font-semibold text-green-400">
                          {formatCurrency(product.revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Utilidad:</span>
                        <span className="font-semibold text-purple-400">
                          {formatCurrency(product.profit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Ranking Distribuidores
        </h2>
        <LeaderboardTable rankings={rankingData} config={gamificationConfig} />
      </div>
    </div>
  );
}
