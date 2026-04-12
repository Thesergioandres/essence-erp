import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeEmployeeRole } from "../../../shared/utils/roleAliases";
import { authService } from "../api/auth.service";
import type {
  LoginCredentials,
  RegisterCredentials,
} from "../types/auth.types";

const resolveEntityId = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[object Object]") {
      return null;
    }
    return trimmed;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    _id?: unknown;
    id?: unknown;
    $oid?: unknown;
  };

  return (
    resolveEntityId(candidate._id) ||
    resolveEntityId(candidate.id) ||
    resolveEntityId(candidate.$oid) ||
    null
  );
};

const waitForBusinessHydration = async (timeoutMs = 2200): Promise<void> => {
  if (typeof window === "undefined") {
    return;
  }

  const hasBusinessId = () =>
    Boolean(resolveEntityId(localStorage.getItem("businessId")));
  if (hasBusinessId()) {
    return;
  }

  await new Promise<void>(resolve => {
    const startedAt = Date.now();

    const finish = () => {
      window.clearInterval(pollId);
      window.removeEventListener("session-refresh", onSessionRefresh);
      window.removeEventListener("auth-changed", onSessionRefresh);
      resolve();
    };

    const onSessionRefresh = () => {
      if (hasBusinessId()) {
        finish();
      }
    };

    const pollId = window.setInterval(() => {
      const timedOut = Date.now() - startedAt >= timeoutMs;
      if (hasBusinessId() || timedOut) {
        finish();
      }
    }, 80);

    window.addEventListener("session-refresh", onSessionRefresh);
    window.addEventListener("auth-changed", onSessionRefresh);
  });
};

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);

      // 🔑 POLYFILL: Map memberships to legacy business field for backward compatibility
      const memberships = response.memberships || [];
      const primaryBusiness = memberships[0]?.business;
      const normalizedRole = normalizeEmployeeRole(response.role);
      const businessId =
        resolveEntityId(primaryBusiness) || resolveEntityId(response.business);
      const userId = resolveEntityId(response._id);

      // Save Session
      localStorage.setItem("token", response.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: userId || response._id,
          name: response.name,
          email: response.email,
          role: normalizedRole,
          status: response.status,
          business: businessId || undefined, // Legacy compatibility
          memberships, // New V2 data
        })
      );

      if (businessId) {
        localStorage.setItem("businessId", businessId);
      } else {
        localStorage.removeItem("businessId");
      }

      // 🔔 Notify BusinessContext that auth changed
      window.dispatchEvent(new Event("auth-changed"));

      // Redirect Logic
      if (response.status === "pending") {
        navigate("/account-hold");
      } else if (normalizedRole === "employee") {
        await waitForBusinessHydration();
        navigate("/staff/dashboard", { replace: true });
      } else if (["admin", "super_admin", "god"].includes(normalizedRole)) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || "Error al iniciar sesión";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(credentials);

      // 🔑 POLYFILL: Map memberships to legacy business field
      const memberships = response.memberships || [];
      const primaryBusiness = memberships[0]?.business;
      const businessId =
        resolveEntityId(primaryBusiness) || resolveEntityId(response.business);
      const userId = resolveEntityId(response._id);

      localStorage.setItem("token", response.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...response,
          _id: userId || response._id,
          business: businessId || undefined,
          memberships,
        })
      );

      if (businessId) {
        localStorage.setItem("businessId", businessId);
      } else {
        localStorage.removeItem("businessId");
      }

      navigate("/"); // Default redirect
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || "Error al registrarse";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    navigate("/login", { replace: true });
  };

  return {
    login,
    register,
    logout,
    isLoading,
    error,
  };
};
