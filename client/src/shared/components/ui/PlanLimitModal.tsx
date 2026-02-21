import { Button } from "./Button";

interface PlanLimitModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  plan?: string;
  currentUsage?: number;
  currentLimit?: number;
}

export default function PlanLimitModal({
  open,
  onClose,
  title,
  description,
  plan,
  currentUsage,
  currentLimit,
}: PlanLimitModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-fuchsia-400/25 bg-gray-900 p-6 text-white shadow-2xl shadow-fuchsia-900/30">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200">
          Límite alcanzado
        </p>
        <h3 className="mt-2 text-xl font-bold">{title}</h3>
        <p className="mt-2 text-sm text-gray-300">{description}</p>

        {(currentUsage !== undefined || currentLimit !== undefined) && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-gray-200">
            Uso actual: <strong>{currentUsage ?? "-"}</strong> / Límite:{" "}
            <strong>{currentLimit ?? "-"}</strong>
          </div>
        )}

        <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          {plan ? `Tu plan actual es ${plan.toUpperCase()}. ` : ""}
          Actualiza tu suscripción para seguir creciendo sin bloqueos.
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onClose}>Entendido</Button>
        </div>
      </div>
    </div>
  );
}
