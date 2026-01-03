import { useEffect, useMemo, useState } from "react";
import { profitHistoryService } from "../api/services";
import { useBusiness } from "../context/BusinessContext";
import type {
  ProfitHistoryAdminDistributor,
  ProfitHistoryAdminEntry,
  ProfitHistoryAdminOverview,
} from "../types";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

const quickRanges = [
  { label: "Últimos 7 días", days: 7 },
  { label: "Últimos 30 días", days: 30 },
  { label: "Últimos 90 días", days: 90 },
];

const isValidObjectId = (value: string) => /^[a-f\d]{24}$/i.test(value);

export default function ProfitHistory() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<ProfitHistoryAdminOverview | null>(
    null
  );
  const [selectedDistributor, setSelectedDistributor] = useState<string>("");
  const [limit, setLimit] = useState(150);

  const today = useMemo(() => new Date(), []);
  const [dateRange, setDateRange] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: toISODate(start),
      endDate: toISODate(today),
    };
  });

  const { businessId } = useBusiness();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = ["admin", "super_admin", "god"].includes(currentUser?.role);

  const loadOverview = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await profitHistoryService.getAdminOverview({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        distributorId: selectedDistributor || undefined,
        limit,
      });
      setOverview(data);
    } catch (error) {
      console.error("Error cargando overview de ganancias", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // No dependemos de businessId para god/super_admin, pero lo mantenemos para refrescar cuando cambie
    void loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedDistributor,
    dateRange.startDate,
    dateRange.endDate,
    limit,
    businessId,
  ]);

  const distributors = useMemo<ProfitHistoryAdminDistributor[]>(() => {
    if (!overview) return [];
    return overview.distributors;
  }, [overview]);

  const distributorOptions = useMemo(() => {
    const seen = new Set<string>();
    return distributors.filter(dist => {
      const allow = dist.id === "admin" || isValidObjectId(dist.id);
      if (!allow) return false;
      if (seen.has(dist.id)) return false;
      seen.add(dist.id);
      return true;
    });
  }, [distributors]);

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateRange({ startDate: toISODate(start), endDate: toISODate(end) });
  };

  if (!isAdmin) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <div className="text-lg text-gray-200">
          Solo los administradores pueden ver este módulo.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-purple-300/70">
            Reporte vivo
          </p>
          <h1 className="text-3xl font-bold text-white">
            Historial de ganancias
          </h1>
          <p className="text-sm text-gray-400">
            Calculado directamente desde las ventas, sin depender de registros
            previos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {quickRanges.map(range => (
            <button
              key={range.days}
              onClick={() => handleQuickRange(range.days)}
              className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-100 transition hover:border-purple-400/60 hover:bg-purple-500/20"
            >
              {range.label}
            </button>
          ))}
          <button
            onClick={() => setDateRange({ startDate: "", endDate: "" })}
            className="rounded-full border border-gray-600 bg-gray-800 px-3 py-1 text-sm text-gray-200 transition hover:border-gray-500"
          >
            Todo el tiempo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-gray-900 p-4 text-white shadow-lg">
          <p className="text-sm text-purple-100">Ganancia total</p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(overview?.summary.totalProfit || 0)}
          </p>
          <p className="text-xs text-purple-100/80">
            Incluye admin y distribuidores
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-white">
          <p className="text-sm text-gray-300">Ganancia admin</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">
            {formatCurrency(overview?.summary.adminProfit || 0)}
          </p>
          <p className="text-xs text-gray-400">
            Ventas directas y margen admin
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-white">
          <p className="text-sm text-gray-300">Ganancia distribuidores</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-300">
            {formatCurrency(overview?.summary.distributorProfit || 0)}
          </p>
          <p className="text-xs text-gray-400">Comisiones pagadas</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-white">
          <p className="text-sm text-gray-300">Promedio por venta</p>
          <p className="mt-2 text-2xl font-semibold text-amber-300">
            {formatCurrency(overview?.summary.averageTicket || 0)}
          </p>
          <p className="text-xs text-gray-400">
            {overview?.summary.count || 0} ventas en ventana
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Distribuidor
            </label>
            <select
              value={selectedDistributor}
              onChange={e => setSelectedDistributor(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            >
              <option value="">Todos</option>
              <option value="admin">Solo ventas admin</option>
              {distributorOptions
                .filter(d => d.id !== "admin")
                .map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.email ? `(${d.email})` : ""}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Fecha inicio
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Fecha fin
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Máx. ventas
            </label>
            <input
              type="number"
              min={20}
              max={400}
              value={limit}
              onChange={e => setLimit(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/70 shadow-lg xl:col-span-3">
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <div>
              <p className="text-sm text-gray-400">Transacciones recientes</p>
              <p className="text-lg font-semibold text-white">
                {overview?.summary.count || 0} ventas
              </p>
            </div>
            <button
              onClick={loadOverview}
              className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 transition hover:border-purple-400 hover:text-white"
            >
              Recargar
            </button>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[960px] divide-y divide-gray-800">
              <thead className="sticky top-0 bg-gray-950/80 backdrop-blur">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Venta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Distribuidor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Ganancia dist
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Ganancia admin
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray-400"
                    >
                      Cargando...
                    </td>
                  </tr>
                )}

                {!loading && (!overview || overview.entries.length === 0) && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray-400"
                    >
                      No hay ventas en el rango seleccionado.
                    </td>
                  </tr>
                )}

                {!loading &&
                  overview?.entries.map((entry: ProfitHistoryAdminEntry) => (
                    <tr key={entry.id} className="hover:bg-gray-950/40">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-200">
                        {formatDateTime(entry.date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {entry.saleId || entry.id}
                          </span>
                          {entry.eventName && (
                            <span className="text-xs text-purple-300">
                              {entry.eventName}
                            </span>
                          )}
                          <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-gray-800 px-2 py-0.5 text-[11px] font-semibold uppercase text-gray-200">
                            <span
                              className={
                                entry.source === "special"
                                  ? "text-pink-300"
                                  : "text-emerald-300"
                              }
                            >
                              ●
                            </span>
                            {entry.source === "special" ? "Especial" : "Normal"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-100">
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {entry.distributorName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {entry.distributorEmail || "Admin"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-200">
                        {entry.productName || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-cyan-300">
                        {formatCurrency(entry.distributorProfit)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-emerald-300">
                        {formatCurrency(entry.adminProfit)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-purple-200">
                        {formatCurrency(entry.totalProfit)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Vista móvil en tarjetas */}
          <div className="space-y-3 md:hidden">
            {loading && (
              <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-center text-gray-300">
                Cargando...
              </div>
            )}

            {!loading && (!overview || overview.entries.length === 0) && (
              <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-center text-gray-300">
                No hay ventas en el rango seleccionado.
              </div>
            )}

            {!loading &&
              overview?.entries.map(entry => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-gray-800 bg-gray-900 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {formatDateTime(entry.date)}
                      </p>
                      <p className="text-sm font-semibold text-white">
                        {entry.saleId || entry.id}
                      </p>
                      {entry.eventName && (
                        <p className="text-xs text-purple-300">
                          {entry.eventName}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-2 py-1 text-[11px] font-semibold uppercase text-gray-200">
                      <span
                        className={
                          entry.source === "special"
                            ? "text-pink-300"
                            : "text-emerald-300"
                        }
                      >
                        ●
                      </span>
                      {entry.source === "special" ? "Especial" : "Normal"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-gray-200">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-400">Distribuidor</span>
                      <span className="text-right font-semibold text-white">
                        {entry.distributorName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-400">Producto</span>
                      <span className="text-right text-white">
                        {entry.productName || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-400">Ganancia dist</span>
                      <span className="font-semibold text-cyan-300">
                        {formatCurrency(entry.distributorProfit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-400">Ganancia admin</span>
                      <span className="font-semibold text-emerald-300">
                        {formatCurrency(entry.adminProfit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-400">Total</span>
                      <span className="font-semibold text-purple-200">
                        {formatCurrency(entry.totalProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Ranking distribuidores</p>
              <p className="text-lg font-semibold text-white">Top comisiones</p>
            </div>
            <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200">
              {distributors.filter(d => d.id !== "admin").length} activos
            </span>
          </div>

          <div className="space-y-3">
            {distributors.length === 0 && (
              <p className="text-sm text-gray-400">
                Aún no hay ventas registradas en este rango.
              </p>
            )}

            {distributors
              .filter(d => d.id !== "admin")
              .map((dist: ProfitHistoryAdminDistributor) => (
                <div
                  key={dist.id}
                  className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2"
                >
                  <div>
                    <p className="font-semibold text-gray-100">{dist.name}</p>
                    <p className="text-xs text-gray-400">{dist.email || ""}</p>
                    <p className="text-xs text-gray-500">{dist.sales} ventas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-cyan-300">
                      {formatCurrency(dist.distributorProfit)}
                    </p>
                    <p className="text-xs text-gray-400">Comisión</p>
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-5 rounded-lg border border-gray-800 bg-gray-950/60 p-3">
            <p className="text-sm font-semibold text-white">Ventas admin</p>
            <p className="text-xs text-gray-400">
              Incluye ventas directas y margen de cada venta de distribuidor.
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-300">Total admin</span>
              <span className="font-semibold text-emerald-300">
                {formatCurrency(
                  distributors.find(d => d.id === "admin")?.adminProfit || 0
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
