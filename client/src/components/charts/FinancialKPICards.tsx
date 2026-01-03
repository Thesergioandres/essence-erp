import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { advancedAnalyticsService } from "../../api/services";

interface KPI {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

export const FinancialKPICards: React.FC<{
  reloadKey?: number;
  startDate?: string;
  endDate?: string;
}> = ({ reloadKey = 0, startDate, endDate }) => {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await advancedAnalyticsService.getFinancialKPIs({
          startDate,
          endDate,
        });
        console.log("Financial KPIs Response:", response);
        setKpis(response);
      } catch (error) {
        console.error("Error al cargar KPIs financieros:", error);
        setKpis(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reloadKey, startDate, endDate]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg border border-gray-800 bg-gray-900/60 p-6"
          ></div>
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  const safeNumber = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const formatMoney = (val: any) => `$${safeNumber(val).toFixed(0)}`;

  const summary = kpis?.kpis || kpis || {};
  const daily = kpis?.daily || {};
  const weekly = kpis?.weekly || {};
  const monthly = kpis?.monthly || {};

  const hasCustomRange = Boolean(startDate || endDate);
  const rangeLabel = hasCustomRange ? "(rango)" : "";
  const todayLabel = hasCustomRange ? "Ventas rango" : "Ventas Hoy";
  const todayRevenueLabel = hasCustomRange ? "Ingresos rango" : "Ingresos Hoy";
  const todayProfitLabel = hasCustomRange ? "Ganancia rango" : "Ganancia Hoy";
  const weekSalesLabel = hasCustomRange ? "Ventas rango" : "Ventas Semana";
  const weekRevenueLabel = hasCustomRange
    ? "Ingresos rango"
    : "Ingresos Semana";
  const weekProfitLabel = hasCustomRange ? "Ganancia rango" : "Ganancia Semana";
  const monthSalesLabel = hasCustomRange ? "Ventas rango" : "Ventas Mes";
  const monthRevenueLabel = hasCustomRange ? "Ingresos rango" : "Ingresos Mes";
  const monthProfitLabel = hasCustomRange ? "Ganancia rango" : "Ganancia Mes";
  const avgTicketLabel = hasCustomRange
    ? "Ticket promedio rango"
    : "Ticket promedio";

  const kpiCards: KPI[] = [
    {
      id: "todaySales",
      label: todayLabel,
      value: safeNumber(daily.sales ?? summary.todaySales),
      icon: <ShoppingCart className="h-8 w-8" />,
      color: "bg-purple-500",
    },
    {
      id: "todayRevenue",
      label: todayRevenueLabel,
      value: formatMoney(daily.revenue ?? summary.todayRevenue),
      icon: <DollarSign className="h-8 w-8" />,
      color: "bg-violet-500",
    },
    {
      id: "todayProfit",
      label: todayProfitLabel,
      value: formatMoney(daily.profit ?? summary.todayProfit),
      icon: <TrendingUp className="h-8 w-8" />,
      color: "bg-emerald-500",
    },
    {
      id: "weekSales",
      label: weekSalesLabel,
      value: safeNumber(weekly.sales ?? summary.weekSales),
      icon: <ShoppingCart className="h-8 w-8" />,
      color: "bg-pink-500",
    },
    {
      id: "weekRevenue",
      label: weekRevenueLabel,
      value: formatMoney(weekly.revenue ?? summary.weekRevenue),
      icon: <DollarSign className="h-8 w-8" />,
      color: "bg-teal-500",
    },
    {
      id: "weekProfit",
      label: weekProfitLabel,
      value: formatMoney(weekly.profit ?? summary.weekProfit),
      icon: <TrendingUp className="h-8 w-8" />,
      color: "bg-green-500",
    },
    {
      id: "monthSales",
      label: monthSalesLabel,
      value: safeNumber(monthly.sales ?? summary.monthSales),
      icon: <ShoppingCart className="h-8 w-8" />,
      color: "bg-blue-500",
    },
    {
      id: "monthRevenue",
      label: monthRevenueLabel,
      value: formatMoney(monthly.revenue ?? summary.monthRevenue),
      icon: <DollarSign className="h-8 w-8" />,
      color: "bg-indigo-600",
    },
    {
      id: "monthProfit",
      label: monthProfitLabel,
      value: formatMoney(monthly.profit ?? summary.monthProfit),
      icon: <TrendingUp className="h-8 w-8" />,
      color: "bg-cyan-600",
    },
    {
      id: "avgTicket",
      label: avgTicketLabel,
      value: formatMoney(summary.averageTicket ?? kpis?.avgTicket),
      icon: <Target className="h-8 w-8" />,
      color: "bg-orange-500",
    },
    {
      id: "activeDistributors",
      label: "Distribuidores activos",
      value: safeNumber(summary.totalActiveDistributors),
      icon: <Users className="h-8 w-8" />,
      color: "bg-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {kpiCards.map((kpi, index) => (
        <motion.div
          key={kpi.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900"
        >
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className={`${kpi.color} rounded-lg p-3 text-white`}>
                {kpi.icon}
              </div>
              {kpi.change !== undefined && (
                <div
                  className={`flex items-center ${
                    kpi.change >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {kpi.change >= 0 ? (
                    <TrendingUp className="mr-1 h-5 w-5" />
                  ) : (
                    <TrendingDown className="mr-1 h-5 w-5" />
                  )}
                  <span className="font-semibold">{Math.abs(kpi.change)}%</span>
                </div>
              )}
            </div>
            <div>
              <p className="mb-1 text-sm text-gray-400">{kpi.label}</p>
              <p className="text-3xl font-bold text-white">{kpi.value}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
