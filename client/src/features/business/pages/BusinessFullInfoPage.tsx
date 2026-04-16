import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Building2,
  CreditCard,
  LayoutGrid,
  Mail,
  Package,
  Phone,
  RefreshCw,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  LoadingSpinner,
} from "../../../shared/components/ui";
import { analyticsService } from "../../analytics/services";

type ExportListItem = Record<string, unknown>;

interface ExportSummary {
  totalBranches: number;
  totalUsers: number;
  totalCategories: number;
  totalProducts: number;
  totalCustomers: number;
  totalSales: number;
  totalExpenses: number;
  totalCredits: number;
}

interface ExportBusiness {
  _id?: string;
  name?: string;
  status?: string;
  plan?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  slug?: string;
  createdAt?: string;
}

interface ExportUser {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
}

interface ExportBranch {
  _id?: string;
  name?: string;
  status?: string;
  createdAt?: string;
}

interface ExportProduct {
  _id?: string;
  name?: string;
  salePrice?: number;
}

interface BusinessFullExportData {
  exportInfo?: {
    exportDate?: string;
    businessName?: string;
  };
  organization?: {
    business?: ExportBusiness | null;
    branches?: ExportBranch[];
    users?: ExportUser[];
    memberships?: ExportListItem[];
  };
  catalog?: {
    categories?: ExportListItem[];
    products?: ExportProduct[];
    providers?: ExportListItem[];
    customers?: ExportListItem[];
    segments?: ExportListItem[];
  };
  inventory?: {
    branchStocks?: ExportListItem[];
    employeeStocks?: ExportListItem[];
    inventoryEntries?: ExportListItem[];
    stockTransfers?: ExportListItem[];
    branchTransfers?: ExportListItem[];
    defectiveProducts?: ExportListItem[];
  };
  transactions?: {
    sales?: ExportListItem[];
    specialSales?: ExportListItem[];
    expenses?: ExportListItem[];
    credits?: ExportListItem[];
    creditPayments?: ExportListItem[];
  };
  summary?: Partial<ExportSummary>;
}

const defaultSummary: ExportSummary = {
  totalBranches: 0,
  totalUsers: 0,
  totalCategories: 0,
  totalProducts: 0,
  totalCustomers: 0,
  totalSales: 0,
  totalExpenses: 0,
  totalCredits: 0,
};

const countFormatter = new Intl.NumberFormat("es-CO");

const formatCount = (value: number) => countFormatter.format(value);

const formatDate = (dateValue?: string) => {
  if (!dateValue) return "No disponible";

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "No disponible";

  return parsed.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatLabel = (value?: string) => {
  if (!value) return "No definido";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
};

const statusBadgeClass = (status?: string) => {
  const normalizedStatus = (status || "").toLowerCase();

  if (normalizedStatus === "active") {
    return "border border-emerald-400/40 bg-emerald-500/10 text-emerald-200";
  }

  if (normalizedStatus === "archived" || normalizedStatus === "suspended") {
    return "border border-rose-400/40 bg-rose-500/10 text-rose-200";
  }

  return "border border-amber-400/40 bg-amber-500/10 text-amber-200";
};

export default function BusinessFullInfoPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<BusinessFullExportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBusinessData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = await analyticsService.exportFullData();
      if (!payload || typeof payload !== "object") {
        throw new Error("Respuesta invalida del servidor");
      }

      setData(payload as BusinessFullExportData);
    } catch (err) {
      const responseMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;

      setError(
        responseMessage ||
          "No fue posible cargar la informacion completa del negocio."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBusinessData();
  }, [loadBusinessData]);

  const summary = useMemo(
    () => ({
      ...defaultSummary,
      ...data?.summary,
    }),
    [data?.summary]
  );

  const business = data?.organization?.business;
  const branches = data?.organization?.branches || [];
  const users = data?.organization?.users || [];
  const products = data?.catalog?.products || [];
  const categories = data?.catalog?.categories || [];
  const providers = data?.catalog?.providers || [];
  const segments = data?.catalog?.segments || [];

  const inventoryStats = data?.inventory;
  const transactionStats = data?.transactions;

  const activeUsers = users.filter(user => user?.active !== false).length;

  const highlights = [
    {
      label: "Ventas registradas",
      value: summary.totalSales,
      icon: ShoppingBag,
      tone: "from-cyan-500/20 to-cyan-500/0",
    },
    {
      label: "Gastos registrados",
      value: summary.totalExpenses,
      icon: CreditCard,
      tone: "from-rose-500/20 to-rose-500/0",
    },
    {
      label: "Clientes activos",
      value: summary.totalCustomers,
      icon: Users,
      tone: "from-emerald-500/20 to-emerald-500/0",
    },
    {
      label: "Productos en catalogo",
      value: summary.totalProducts,
      icon: Package,
      tone: "from-violet-500/20 to-violet-500/0",
    },
  ];

  const topProducts = products.slice(0, 6);
  const topBranches = branches.slice(0, 6);

  return (
    <div className="bg-linear-to-br min-h-screen from-gray-950 via-slate-900 to-gray-950">
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-32 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <section className="bg-linear-to-r rounded-2xl border border-cyan-500/20 from-cyan-500/10 via-transparent to-transparent p-5 shadow-2xl shadow-cyan-950/30 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/90">
                Panel Ejecutivo
              </p>
              <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Informacion completa del negocio
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                Vista consolidada de organizacion, catalogo, inventario y
                operacion para auditoria y toma de decisiones.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/analytics")}
                className="border-white/20 bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al panel
                </span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => void loadBusinessData()}
                loading={loading}
                className="bg-cyan-600 text-white hover:bg-cyan-700"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Actualizar informacion
                </span>
              </Button>
            </div>
          </div>
        </section>

        {loading && !data && (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="py-16">
              <LoadingSpinner
                size="lg"
                message="Preparando la vista completa del negocio..."
              />
            </CardContent>
          </Card>
        )}

        {error && !data && (
          <Card className="border-rose-500/40 bg-rose-500/10">
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <AlertTriangle className="h-8 w-8 text-rose-300" />
                <p className="max-w-xl text-sm text-rose-100">{error}</p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void loadBusinessData()}
                >
                  Reintentar carga
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {highlights.map(item => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.label}
                    className={`bg-linear-to-br border-white/10 ${item.tone}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-300">{item.label}</p>
                        <span className="rounded-lg border border-white/15 bg-white/5 p-2">
                          <Icon className="h-4 w-4 text-white" />
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-white">
                        {formatCount(Number(item.value || 0))}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            <section className="grid gap-4 xl:grid-cols-5">
              <Card className="border-white/10 bg-white/5 xl:col-span-3">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-cyan-300" />
                    <h2 className="text-lg font-semibold text-white">
                      Organizacion
                    </h2>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-slate-400">Nombre</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {business?.name ||
                          data.exportInfo?.businessName ||
                          "Sin nombre"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-slate-400">Plan actual</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatLabel(business?.plan)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-slate-400">Estado</p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
                          business?.status
                        )}`}
                      >
                        {formatLabel(business?.status)}
                      </span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-slate-400">Creado el</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatDate(business?.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-slate-400">Correo</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-white">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {business?.contactEmail || "No definido"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-slate-400">Telefono</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-white">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {business?.contactPhone ||
                          business?.contactWhatsapp ||
                          "No definido"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5 xl:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-violet-300" />
                    <h2 className="text-lg font-semibold text-white">
                      Resumen operativo
                    </h2>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-sm text-slate-300">
                      Usuarios activos
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {formatCount(activeUsers)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-sm text-slate-300">Sedes</span>
                    <span className="text-sm font-semibold text-white">
                      {formatCount(summary.totalBranches)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-sm text-slate-300">Categorias</span>
                    <span className="text-sm font-semibold text-white">
                      {formatCount(summary.totalCategories)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-sm text-slate-300">Creditos</span>
                    <span className="text-sm font-semibold text-white">
                      {formatCount(summary.totalCredits)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-sm text-slate-300">Segmentos</span>
                    <span className="text-sm font-semibold text-white">
                      {formatCount(segments.length)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-emerald-300" />
                    <h2 className="text-lg font-semibold text-white">
                      Inventario y catalogo
                    </h2>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-slate-400">Productos</p>
                    <p className="text-xl font-bold text-white">
                      {formatCount(summary.totalProducts)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-slate-400">Categorias</p>
                    <p className="text-xl font-bold text-white">
                      {formatCount(categories.length)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-slate-400">Proveedores</p>
                    <p className="text-xl font-bold text-white">
                      {formatCount(providers.length)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-slate-400">
                      Movimientos de stock
                    </p>
                    <p className="text-xl font-bold text-white">
                      {formatCount(inventoryStats?.stockTransfers?.length || 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-slate-400">
                      Ingresos de inventario
                    </p>
                    <p className="text-xl font-bold text-white">
                      {formatCount(
                        inventoryStats?.inventoryEntries?.length || 0
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-slate-400">Stock por sedes</p>
                    <p className="text-xl font-bold text-white">
                      {formatCount(inventoryStats?.branchStocks?.length || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-orange-300" />
                    <h2 className="text-lg font-semibold text-white">
                      Transacciones
                    </h2>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-sm text-slate-300">
                      Ventas estandar
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {formatCount(transactionStats?.sales?.length || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-sm text-slate-300">
                      Ventas especiales
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {formatCount(transactionStats?.specialSales?.length || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-sm text-slate-300">Gastos</span>
                    <span className="text-sm font-semibold text-white">
                      {formatCount(transactionStats?.expenses?.length || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-sm text-slate-300">Creditos</span>
                    <span className="text-sm font-semibold text-white">
                      {formatCount(transactionStats?.credits?.length || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-sm text-slate-300">
                      Pagos de credito
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {formatCount(
                        transactionStats?.creditPayments?.length || 0
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <h2 className="text-lg font-semibold text-white">
                    Sedes registradas
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topBranches.length === 0 && (
                      <p className="text-sm text-slate-400">
                        No hay sedes registradas para este negocio.
                      </p>
                    )}

                    {topBranches.map((branch, index) => (
                      <div
                        key={`${branch._id || branch.name || "branch"}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {branch.name || "Sede sin nombre"}
                          </p>
                          <p className="text-xs text-slate-400">
                            Creada: {formatDate(branch.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
                            branch.status
                          )}`}
                        >
                          {formatLabel(branch.status || "active")}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <h2 className="text-lg font-semibold text-white">
                    Productos destacados
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topProducts.length === 0 && (
                      <p className="text-sm text-slate-400">
                        No hay productos visibles en el catalogo.
                      </p>
                    )}

                    {topProducts.map((product, index) => (
                      <div
                        key={`${product._id || product.name || "product"}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-white">
                          {product.name || "Producto sin nombre"}
                        </p>
                        <span className="text-sm font-medium text-cyan-200">
                          {typeof product.salePrice === "number"
                            ? countFormatter.format(product.salePrice)
                            : "Sin precio"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
