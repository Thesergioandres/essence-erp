import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusiness } from "../../../context/BusinessContext";
import { isEmployeeRole } from "../../../shared/utils/roleAliases";
import { logUI } from "../../../utils/logger";
import { authService } from "../../auth/services";
import { businessService } from "../../business/services";
import { notificationService } from "../../notifications/services";
import type {
  Notification,
  NotificationPriority,
} from "../types/notification.types";

interface NotificationsProps {
  asDropdown?: boolean;
  onClose?: () => void;
}

type HistoryFilter = "all" | "unread" | "read";

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
}

const ADMIN_ROLES = new Set(["admin", "super_admin", "god"]);

const formatTime = (dateStr?: string) => {
  if (!dateStr) return "Ahora";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Ahora";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
};

const resolveSenderName = (notification: Notification) => {
  if (!notification.sender || typeof notification.sender === "string") {
    return "Administración";
  }

  return notification.sender.name?.trim() || "Administración";
};

const resolveTargetCount = (notification: Notification) => {
  if (Array.isArray(notification.targetEmployees)) {
    return notification.targetEmployees.length;
  }

  return notification.user ? 1 : 0;
};

const resolveViewedCount = (notification: Notification) => {
  if (Array.isArray(notification.viewedBy)) {
    return notification.viewedBy.length;
  }

  return notification.read ? 1 : 0;
};

export default function NotificationsPage({
  asDropdown = false,
  onClose,
}: NotificationsProps) {
  const navigate = useNavigate();
  const { business, businessId: contextBusinessId, hydrating } = useBusiness();
  const businessId = business?._id || contextBusinessId || null;
  const user = authService.getCurrentUser();

  const isEmployeeSession = isEmployeeRole(user?.role);
  const canSendNotifications = ADMIN_ROLES.has(String(user?.role || ""));

  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<NotificationPriority>("medium");
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!businessId || hydrating) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await notificationService.getHistory({
        limit: asDropdown ? 10 : 80,
        businessId,
      });

      setNotifications(response.notifications || []);
    } catch (error) {
      setErrorMessage("No pudimos cargar las notificaciones");
      logUI.error("Error al cargar historial de notificaciones", {
        module: "notifications",
        businessId,
        error,
      });
    } finally {
      setLoading(false);
    }
  }, [asDropdown, businessId, hydrating]);

  const loadEmployees = useCallback(async () => {
    if (!businessId || hydrating || !canSendNotifications) {
      setEmployees([]);
      return;
    }

    setLoadingEmployees(true);
    try {
      const response = await businessService.listMembers(businessId);
      const members = Array.isArray(response?.members) ? response.members : [];

      const employeeOptions = members
        .filter(
          member => member?.status === "active" && member?.role === "employee"
        )
        .map(member => {
          const userRecord =
            member.user && typeof member.user === "object" ? member.user : null;

          return {
            id: userRecord?._id || "",
            name: userRecord?.name || "Empleado",
            email: userRecord?.email || "",
          };
        })
        .filter(item => Boolean(item.id));

      setEmployees(employeeOptions);
    } catch (error) {
      logUI.error("No se pudieron cargar los empleados para segmentación", {
        module: "notifications",
        businessId,
        error,
      });
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, [businessId, canSendNotifications, hydrating]);

  useEffect(() => {
    if (!businessId || hydrating) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    void loadNotifications();
  }, [businessId, hydrating, loadNotifications]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const isNotificationRead = useCallback(
    (notification: Notification) => {
      if (isEmployeeSession) {
        return notification.read === true;
      }

      const targetCount = resolveTargetCount(notification);
      if (targetCount > 0) {
        return resolveViewedCount(notification) >= targetCount;
      }

      return notification.read === true;
    },
    [isEmployeeSession]
  );

  const unreadCount = useMemo(
    () =>
      notifications.filter(notification => !isNotificationRead(notification))
        .length,
    [isNotificationRead, notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (historyFilter === "unread") {
      return notifications.filter(
        notification => !isNotificationRead(notification)
      );
    }

    if (historyFilter === "read") {
      return notifications.filter(notification =>
        isNotificationRead(notification)
      );
    }

    return notifications;
  }, [historyFilter, isNotificationRead, notifications]);

  const handleToggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds(previous =>
      previous.includes(employeeId)
        ? previous.filter(id => id !== employeeId)
        : [...previous, employeeId]
    );
  };

  const handleMarkAsViewed = async (notificationId: string) => {
    if (!businessId) {
      return;
    }

    try {
      await notificationService.markAsViewed(notificationId, businessId);
      setNotifications(previous =>
        previous.map(notification =>
          notification._id === notificationId
            ? {
                ...notification,
                read: true,
                readAt: new Date().toISOString(),
              }
            : notification
        )
      );
    } catch (error) {
      logUI.error("Error al marcar notificación como vista", {
        module: "notifications",
        businessId,
        notificationId,
        error,
      });
    }
  };

  const handleSendNotification = async () => {
    const safeTitle = title.trim();
    const safeMessage = message.trim();

    if (!businessId) {
      setErrorMessage("Debes seleccionar un negocio antes de enviar");
      return;
    }

    if (!safeTitle || !safeMessage) {
      setErrorMessage("El título y el mensaje son obligatorios");
      return;
    }

    if (!sendToAll && selectedEmployeeIds.length === 0) {
      setErrorMessage("Selecciona al menos un empleado para segmentar");
      return;
    }

    setSending(true);
    setErrorMessage(null);

    try {
      await notificationService.send({
        title: safeTitle,
        message: safeMessage,
        sendToAll,
        targetEmployees: sendToAll ? [] : selectedEmployeeIds,
        priority,
      });

      setTitle("");
      setMessage("");
      setPriority("medium");
      setSendToAll(true);
      setSelectedEmployeeIds([]);

      await loadNotifications();
    } catch (error) {
      const apiMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "No se pudo enviar la notificación";
      setErrorMessage(apiMessage);
      logUI.error("Error enviando notificación multi-tenant", {
        module: "notifications",
        error,
      });
    } finally {
      setSending(false);
    }
  };

  const goToHistoryRoute = () => {
    if (asDropdown) {
      navigate(
        isEmployeeSession ? "/staff/notifications" : "/admin/notifications"
      );
      onClose?.();
    }
  };

  if (asDropdown) {
    return (
      <div className="w-96 overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(150deg,rgba(8,47,73,0.95),rgba(10,14,35,0.95))] shadow-[0_24px_60px_rgba(2,6,23,0.45)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="text-sm font-semibold text-cyan-100">
            Notificaciones
          </h3>
          <span className="rounded-full border border-cyan-300/40 px-2 py-0.5 text-xs text-cyan-100">
            {unreadCount} pendientes
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-slate-300">
              Cargando...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-300">
              No hay notificaciones
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <button
                key={notification._id}
                type="button"
                onClick={() => {
                  if (isEmployeeSession && notification.read !== true) {
                    void handleMarkAsViewed(notification._id);
                  }

                  if (notification.link) {
                    window.location.href = notification.link;
                    onClose?.();
                    return;
                  }

                  goToHistoryRoute();
                }}
                className={`block w-full border-b border-white/5 px-4 py-3 text-left transition-colors duration-300 hover:bg-cyan-400/10 ${
                  notification.read === true
                    ? "bg-transparent"
                    : "bg-cyan-400/12"
                }`}
              >
                <p className="text-sm font-semibold text-slate-100">
                  {notification.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-300">
                  {notification.message}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {formatTime(notification.createdAt)}
                </p>
              </button>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={goToHistoryRoute}
          className="min-h-11 w-full border-t border-white/10 px-4 py-3 text-sm font-medium text-cyan-100 transition-colors duration-300 hover:bg-cyan-400/10"
        >
          Ver historial completo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Notificaciones
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {unreadCount > 0
                ? `${unreadCount} notificaciones pendientes`
                : "Todo está al día"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setHistoryFilter("all")}
              className={`min-h-11 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
                historyFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter("unread")}
              className={`min-h-11 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
                historyFilter === "unread"
                  ? "bg-cyan-700 text-white"
                  : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
              }`}
            >
              Sin leer
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter("read")}
              className={`min-h-11 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
                historyFilter === "read"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Leídas
            </button>
          </div>
        </div>
      </section>

      {canSendNotifications && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Enviar aviso al equipo
            </h2>
            <p className="text-sm text-slate-600">
              Segmenta por todos los empleados o por nombres específicos.
            </p>
          </div>

          <div className="grid gap-4">
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="Título de la notificación"
              className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />

            <textarea
              value={message}
              onChange={event => setMessage(event.target.value)}
              rows={3}
              placeholder="Mensaje para tu equipo"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={priority}
                onChange={event =>
                  setPriority(event.target.value as NotificationPriority)
                }
                className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              >
                <option value="low">Prioridad baja</option>
                <option value="medium">Prioridad media</option>
                <option value="high">Prioridad alta</option>
                <option value="urgent">Prioridad urgente</option>
              </select>

              <div className="flex min-h-11 items-center justify-between rounded-xl border border-slate-300 px-4 py-2">
                <span className="text-sm text-slate-700">
                  Todos los empleados
                </span>
                <button
                  type="button"
                  onClick={() => setSendToAll(previous => !previous)}
                  className={`h-7 w-12 rounded-full p-1 transition-all duration-300 ${
                    sendToAll ? "bg-cyan-600" : "bg-slate-300"
                  }`}
                  aria-label="Alternar envío a todos"
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white transition-transform duration-300 ${
                      sendToAll ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {!sendToAll && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Selección específica
                </p>

                {loadingEmployees ? (
                  <p className="text-sm text-slate-600">
                    Cargando empleados...
                  </p>
                ) : employees.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    No hay empleados activos disponibles.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {employees.map(employee => {
                      const checked = selectedEmployeeIds.includes(employee.id);

                      return (
                        <label
                          key={employee.id}
                          className={`flex min-h-11 cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition-all duration-300 ${
                            checked
                              ? "border-cyan-500 bg-cyan-50 text-cyan-800"
                              : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"
                          }`}
                        >
                          <span className="text-sm">
                            {employee.name}
                            {employee.email ? (
                              <span className="ml-1 text-xs text-slate-500">
                                ({employee.email})
                              </span>
                            ) : null}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleEmployee(employee.id)}
                            className="h-4 w-4 rounded border-slate-300 text-cyan-600"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                disabled={sending}
                onClick={handleSendNotification}
                className="min-h-11 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Enviando..." : "Enviar notificación"}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {errorMessage && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-6">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Cargando historial...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No hay notificaciones para este filtro.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map(notification => {
              const targetCount = resolveTargetCount(notification);
              const viewedCount = resolveViewedCount(notification);
              const isRead = isNotificationRead(notification);

              return (
                <article
                  key={notification._id}
                  className={`px-5 py-4 transition-colors duration-300 hover:bg-slate-50 sm:px-6 ${
                    isRead ? "bg-white" : "bg-cyan-50/35"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">
                          {notification.title}
                        </h3>
                        {!isRead && (
                          <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                            Nueva
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-700">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatTime(notification.createdAt)} · Enviada por{" "}
                        {resolveSenderName(notification)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canSendNotifications && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                          Vistas {viewedCount}/{targetCount}
                        </span>
                      )}

                      {isEmployeeSession && !isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsViewed(notification._id)}
                          className="min-h-11 rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 transition-colors duration-300 hover:bg-cyan-100"
                        >
                          Marcar vista
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
