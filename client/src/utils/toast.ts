/**
 * Sistema de toasts para mostrar notificaciones al usuario
 */

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Estado global simple para los toasts
const toastListeners: Array<(toasts: Toast[]) => void> = [];
let toastList: Toast[] = [];

const notifyListeners = () => {
  toastListeners.forEach(listener => listener([...toastList]));
};

/**
 * Función para mostrar toasts desde cualquier parte de la aplicación
 */
export const toast = {
  show: (type: ToastType, message: string, duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    toastList = [...toastList, { id, type, message, duration }];
    notifyListeners();

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }

    return id;
  },

  success: (message: string, duration?: number) =>
    toast.show("success", message, duration),

  error: (message: string, duration?: number) =>
    toast.show("error", message, duration ?? 7000),

  warning: (message: string, duration?: number) =>
    toast.show("warning", message, duration),

  info: (message: string, duration?: number) =>
    toast.show("info", message, duration),

  dismiss: (id: string) => {
    toastList = toastList.filter(t => t.id !== id);
    notifyListeners();
  },

  dismissAll: () => {
    toastList = [];
    notifyListeners();
  },
};

export const subscribeToToasts = (listener: (toasts: Toast[]) => void) => {
  toastListeners.push(listener);
  return () => {
    const index = toastListeners.indexOf(listener);
    if (index > -1) toastListeners.splice(index, 1);
  };
};
