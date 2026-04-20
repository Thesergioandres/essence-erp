import { Building2, CalendarRange, RefreshCw, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, LoadingSpinner, toast } from "../../../shared/components/ui";
import { branchService } from "../../branches/services";
import type { Branch } from "../../business/types/business.types";
import { scheduleService } from "../services";
import type {
  EmployeeScheduleEntry,
  ScheduleDay,
  ScheduleOverviewResponse,
} from "../types/schedule.types";

const DAYS: Array<{ key: ScheduleDay; label: string }> = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miercoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sabado" },
  { key: "sunday", label: "Domingo" },
];

const getEmployeeName = (entry: EmployeeScheduleEntry) => {
  if (typeof entry.employeeId === "string") {
    return "Colaborador";
  }

  return entry.employeeId?.name || "Colaborador";
};

const getBranchName = (entry: EmployeeScheduleEntry) => {
  if (typeof entry.sedeId === "string") {
    return "Sede";
  }

  return entry.sedeId?.name || "Sede";
};

const buildEmptyOverview = (): ScheduleOverviewResponse => ({
  schedules: [],
  groupedByDay: {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  },
  total: 0,
});

export default function AdminScheduleOverviewPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [overview, setOverview] =
    useState<ScheduleOverviewResponse>(buildEmptyOverview);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "refresh") {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const branchList = await branchService.getAll();
      setBranches(branchList);

      const fallbackBranch = selectedBranchId || branchList[0]?._id || "";
      if (fallbackBranch !== selectedBranchId) {
        setSelectedBranchId(fallbackBranch);
      }

      const data = await scheduleService.getOverview(
        fallbackBranch ? { sedeId: fallbackBranch } : undefined
      );
      setOverview(data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "No se pudo cargar el calendario"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData("initial");
  }, []);

  useEffect(() => {
    if (!selectedBranchId || loading) {
      return;
    }

    const reloadByBranch = async () => {
      try {
        const data = await scheduleService.getOverview({
          sedeId: selectedBranchId,
        });
        setOverview(data);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "No se pudo filtrar el calendario por sede"
        );
      }
    };

    reloadByBranch();
  }, [selectedBranchId]);

  const totalTeams = useMemo(() => {
    const uniqueEmployees = new Set(
      overview.schedules.map(entry =>
        typeof entry.employeeId === "string"
          ? entry.employeeId
          : entry.employeeId?._id
      )
    );

    return uniqueEmployees.size;
  }, [overview]);

  if (loading) {
    return (
      <main className="min-h-[60vh] pb-32">
        <div className="mx-auto flex max-w-5xl items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-32 pt-4 sm:px-6 lg:px-8">
      <section className="bg-linear-to-br rounded-3xl border border-white/10 from-slate-950 via-slate-900 to-cyan-950 p-6 shadow-[0_24px_80px_rgba(8,47,73,0.35)] transition-all duration-300 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-200">
              <CalendarRange className="h-4 w-4" />
              Vision Operativa
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
              Horarios del Equipo por Sede
            </h1>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Vista consolidada para coordinacion semanal y cobertura por dia.
            </p>
          </div>

          <Button
            onClick={() => loadData("refresh")}
            disabled={refreshing}
            className="min-h-11 rounded-xl border border-cyan-300/30 bg-cyan-500/20 px-4 text-cyan-100 hover:bg-cyan-500/30"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Turnos
            </p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {overview.total}
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Colaboradores
            </p>
            <p className="mt-1 text-2xl font-semibold text-cyan-200">
              {totalTeams}
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Sede filtrada
            </p>
            <p className="mt-1 text-base font-semibold text-white">
              {branches.find(branch => branch._id === selectedBranchId)?.name ||
                "Todas"}
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl sm:p-6">
        <label className="space-y-1 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Filtrar por sede
          </span>
          <select
            value={selectedBranchId}
            onChange={event => setSelectedBranchId(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition-all duration-300 focus:border-cyan-400/70"
          >
            {branches.map(branch => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {DAYS.map(day => {
          const items = overview.groupedByDay?.[day.key] || [];

          return (
            <article
              key={day.key}
              className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl transition-all duration-300 hover:border-cyan-500/40 sm:p-5"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <h2 className="text-lg font-semibold text-white">
                  {day.label}
                </h2>
                <span className="rounded-full border border-cyan-300/30 bg-cyan-500/15 px-3 py-1 text-xs text-cyan-100">
                  {items.length} turnos
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-400">
                    Sin disponibilidad registrada.
                  </p>
                ) : (
                  items.map(entry => (
                    <div
                      key={entry._id}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
                    >
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-100">
                        <Users className="h-4 w-4 text-cyan-300" />
                        {getEmployeeName(entry)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {getBranchName(entry)}
                      </p>
                      <p className="mt-2 text-sm text-cyan-200">
                        {entry.startTime} - {entry.endTime}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
