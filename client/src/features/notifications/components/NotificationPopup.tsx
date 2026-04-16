import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusiness } from "../../../context/BusinessContext";
import { isEmployeeRole } from "../../../shared/utils/roleAliases";
import { authService } from "../../auth/services";
import { notificationService } from "../services";
import type { Notification } from "../types/notification.types";

const resolveSenderName = (notification: Notification): string => {
  const sender = notification.sender;
  if (!sender || typeof sender === "string") {
    return "Administración";
  }

  const name = String(sender.name || "").trim();
  return name || "Administración";
};

const formatTimestamp = (rawDate?: string): string => {
  if (!rawDate) return "Ahora";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "Ahora";

  return date.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function NotificationPopup() {
  const navigate = useNavigate();
  const { business, businessId: contextBusinessId, hydrating } = useBusiness();
  const businessId = business?._id || contextBusinessId || null;
  const user = authService.getCurrentUser();
  const isEmployeeSession = isEmployeeRole(user?.role);

  const [currentNotification, setCurrentNotification] =
    useState<Notification | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const dismissedIdsRef = useRef<Set<string>>(new Set());

  const loadPendingNotification = useCallback(async () => {
    if (!businessId || !isEmployeeSession || hydrating) {
      setCurrentNotification(null);
      return;
    }

    setLoading(true);
    try {
      const response = await notificationService.getPending({
        limit: 5,
        businessId,
      });
      const nextNotification = response.notifications.find(
        notification => !dismissedIdsRef.current.has(notification._id)
      );
      setCurrentNotification(nextNotification || null);
    } catch {
      setCurrentNotification(null);
    } finally {
      setLoading(false);
    }
  }, [businessId, hydrating, isEmployeeSession]);

  useEffect(() => {
    dismissedIdsRef.current.clear();
    if (!businessId) {
      setCurrentNotification(null);
    }
  }, [businessId]);

  useEffect(() => {
    void loadPendingNotification();
  }, [loadPendingNotification]);

  useEffect(() => {
    const refreshPopup = () => {
      void loadPendingNotification();
    };

    window.addEventListener("auth-changed", refreshPopup);
    window.addEventListener("session-refresh", refreshPopup);

    return () => {
      window.removeEventListener("auth-changed", refreshPopup);
      window.removeEventListener("session-refresh", refreshPopup);
    };
  }, [loadPendingNotification]);

  const senderName = useMemo(
    () =>
      currentNotification
        ? resolveSenderName(currentNotification)
        : "Administración",
    [currentNotification]
  );

  const closeAndMarkViewed = async () => {
    if (!currentNotification || closing || !businessId) return;

    const notificationId = currentNotification._id;
    dismissedIdsRef.current.add(notificationId);
    setClosing(true);

    try {
      await notificationService.markAsViewed(notificationId, businessId);
    } catch {
      // Evita bloquear el flujo del usuario si falla la red momentáneamente.
    } finally {
      setClosing(false);
      setCurrentNotification(null);
      void loadPendingNotification();
    }
  };

  if (
    !businessId ||
    !isEmployeeSession ||
    hydrating ||
    loading ||
    !currentNotification
  ) {
    return null;
  }

  return (
    <div className="z-120 fixed inset-0 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-cyan-300/30 bg-[linear-gradient(140deg,rgba(6,14,28,0.95),rgba(9,25,45,0.95))] p-6 shadow-[0_24px_60px_rgba(8,47,73,0.45)] sm:p-7">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/35 bg-cyan-400/10 text-xl text-cyan-100">
            🔔
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">
              Notificación interna
            </p>
            <p className="text-sm text-slate-300">De {senderName}</p>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white">
          {currentNotification.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-200 sm:text-base">
          {currentNotification.message}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-slate-300/90">
          <span>{formatTimestamp(currentNotification.createdAt)}</span>
          <span className="rounded-full border border-cyan-300/30 px-3 py-1 text-cyan-100">
            Mensaje pendiente
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/staff/notifications")}
            className="min-h-11 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 transition-all duration-300 hover:border-cyan-300/60 hover:bg-cyan-400/10"
          >
            Ver historial
          </button>
          <button
            type="button"
            onClick={closeAndMarkViewed}
            disabled={closing}
            className="min-h-11 rounded-xl border border-cyan-300/40 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-50 transition-all duration-300 hover:bg-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {closing ? "Guardando..." : "Entendido"}
          </button>
        </div>
      </div>
    </div>
  );
}
