import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from "../features/auth/services";
import { useSession } from "../hooks/useSession";

interface ProtectedRouteProps {
  children: ReactElement;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const { user: sessionUser, loading } = useSession();
  const user = sessionUser || authService.getCurrentUser();

  if (loading && token && user) {
    return children;
  }

  if (loading && (!token || !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-gray-200">
          Validando sesión...
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si el usuario está pending, solo permitir acceso a account-hold
  if (user.status === "pending") {
    return (
      <Navigate
        to="/account-hold"
        replace
        state={{ from: location, reason: "pending" }}
      />
    );
  }

  const isExpired =
    user.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt) < new Date();

  if (user.role !== "god" && (user.status !== "active" || isExpired)) {
    const reason = isExpired ? "expired" : user.status;
    return (
      <Navigate to="/account-hold" replace state={{ from: location, reason }} />
    );
  }

  // If specific roles are required, check if user has the right role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on user's actual role
      const targetPath =
        user.role === "distribuidor"
          ? "/distributor/dashboard"
          : user.role === "admin" || user.role === "super_admin"
            ? "/admin/analytics"
            : user.role === "god"
              ? "/admin/analytics"
              : "/";

      // Avoid redirect loop - only redirect if not already on target path
      if (location.pathname !== targetPath) {
        return <Navigate to={targetPath} replace />;
      }
    }
  }

  return children;
}
