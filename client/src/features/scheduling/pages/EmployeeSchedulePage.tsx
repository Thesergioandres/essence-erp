import { CalendarDays, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, LoadingSpinner, toast } from "../../../shared/components/ui";
import { branchService } from "../../branches/services";
import type { Branch } from "../../business/types/business.types";
import { scheduleService } from "../services";
import type {
  EmployeeScheduleEntry,
  ScheduleDay,
  ScheduleEntryInput,
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

interface DayDraft {
  enabled: boolean;
  sedeId: string;
  startTime: string;
  endTime: string;
}

const buildInitialDraft = (): Record<ScheduleDay, DayDraft> =>
  DAYS.reduce(
    (accumulator, day) => {
      accumulator[day.key] = {
        enabled: false,
        sedeId: "",
        startTime: "09:00",
        endTime: "18:00",
      };
      return accumulator;
    },
    {} as Record<ScheduleDay, DayDraft>
  );

const mapScheduleToDraft = (
  schedules: EmployeeScheduleEntry[]
): Record<ScheduleDay, DayDraft> => {
  const draft = buildInitialDraft();

  for (const entry of schedules) {
    const day = entry.day;
    if (!draft[day]) {
      continue;
    }

    draft[day] = {
      enabled: true,
      sedeId:
        typeof entry.sedeId === "string"
          ? entry.sedeId
          : entry.sedeId?._id || "",
      startTime: entry.startTime,
      endTime: entry.endTime,
    };
  }

  return draft;
};

const validateDraft = (draft: Record<ScheduleDay, DayDraft>) => {
  for (const day of DAYS) {
    const current = draft[day.key];
    if (!current.enabled) {
      continue;
    }

    if (!current.sedeId) {
      return `Selecciona una sede para ${day.label}`;
    }

    if (!current.startTime || !current.endTime) {
      return `Completa el horario de ${day.label}`;
    }

    if (current.startTime >= current.endTime) {
      return `El rango horario de ${day.label} no es valido`;
    }
  }

  return null;
};

export default function EmployeeSchedulePage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [draft, setDraft] =
    useState<Record<ScheduleDay, DayDraft>>(buildInitialDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [branchList, schedules] = await Promise.all([
        branchService.getAll(),
        scheduleService.getMySchedule(),
      ]);
      setBranches(branchList);
      setDraft(mapScheduleToDraft(schedules));
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "No se pudo cargar tu disponibilidad semanal"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const enabledCount = useMemo(
    () => DAYS.filter(day => draft[day.key]?.enabled).length,
    [draft]
  );

  const updateDay = (day: ScheduleDay, patch: Partial<DayDraft>) => {
    setDraft(previous => ({
      ...previous,
      [day]: {
        ...previous[day],
        ...patch,
      },
    }));
  };

  const buildPayload = (): ScheduleEntryInput[] =>
    DAYS.filter(day => draft[day.key].enabled).map(day => ({
      day: day.key,
      sedeId: draft[day.key].sedeId,
      startTime: draft[day.key].startTime,
      endTime: draft[day.key].endTime,
    }));

  const handleSave = async () => {
    const validationMessage = validateDraft(draft);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload();
      const saved = await scheduleService.saveMySchedule(payload);
      setDraft(mapScheduleToDraft(saved));
      toast.success("Disponibilidad semanal guardada correctamente");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "No se pudo guardar la disponibilidad"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[60vh] pb-32">
        <div className="mx-auto flex max-w-4xl items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-32 pt-4 sm:px-6">
      <section className="bg-linear-to-br rounded-3xl border border-white/10 from-slate-950 via-slate-900 to-cyan-950 p-6 shadow-[0_24px_80px_rgba(8,47,73,0.35)] transition-all duration-300 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-200">
              <CalendarDays className="h-4 w-4" />
              Agenda Semanal
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
              Disponibilidad del Colaborador
            </h1>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Define en que dias y sedes estaras disponible para operar.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Dias activos
            </p>
            <p className="text-2xl font-semibold text-white">
              {enabledCount}/7
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl sm:p-6">
        {DAYS.map(day => {
          const current = draft[day.key];

          return (
            <article
              key={day.key}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-all duration-300 hover:border-cyan-500/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-100">
                  {day.label}
                </h2>

                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={current.enabled}
                    onChange={event =>
                      updateDay(day.key, { enabled: event.target.checked })
                    }
                    className="h-4 w-4 accent-cyan-500"
                  />
                  Disponible
                </label>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 text-xs text-slate-400">
                  <span>Sede</span>
                  <select
                    disabled={!current.enabled}
                    value={current.sedeId}
                    onChange={event =>
                      updateDay(day.key, { sedeId: event.target.value })
                    }
                    className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition-all duration-300 focus:border-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <option value="">Selecciona una sede</option>
                    {branches.map(branch => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-xs text-slate-400">
                  <span>Inicio</span>
                  <input
                    disabled={!current.enabled}
                    type="time"
                    value={current.startTime}
                    onChange={event =>
                      updateDay(day.key, { startTime: event.target.value })
                    }
                    className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition-all duration-300 focus:border-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-45"
                  />
                </label>

                <label className="space-y-1 text-xs text-slate-400">
                  <span>Fin</span>
                  <input
                    disabled={!current.enabled}
                    type="time"
                    value={current.endTime}
                    onChange={event =>
                      updateDay(day.key, { endTime: event.target.value })
                    }
                    className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition-all duration-300 focus:border-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-45"
                  />
                </label>
              </div>
            </article>
          );
        })}
      </section>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-h-11 rounded-xl border border-cyan-300/30 bg-cyan-500/20 px-4 text-cyan-100 hover:bg-cyan-500/30"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Guardando..." : "Guardar disponibilidad"}
        </Button>
      </div>
    </main>
  );
}
