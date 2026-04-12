import { type ReactNode, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useBusiness } from "../context/BusinessContext";
import { authService } from "../features/auth/services";
import { useSession } from "../hooks/useSession";
import BusinessSelector from "./BusinessSelector";

const BUSINESS_GATE_DEBUG_PREFIX = "[Essence Debug] | BusinessGate |";

interface BusinessGateProps {
  children: ReactNode;
  requiredFeature?: keyof ReturnType<typeof useBusiness>["features"];
}

export default function BusinessGate({
  children,
  requiredFeature,
}: BusinessGateProps) {
  const navigate = useNavigate();
  const {
    business,
    businessId,
    loading,
    error,
    features,
    hydrating,
    memberships,
  } = useBusiness();
  const { loading: authLoading } = useSession();
  const user = authService.getCurrentUser();
  const hasSelectedBusiness = Boolean(businessId && business);
  const hasMemberships = memberships.length > 0;
  const lastBlockReasonRef = useRef<string | null>(null);
  const canCreateBusiness =
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.role === "god";

  useEffect(() => {
    if (authLoading || hydrating || loading || hasSelectedBusiness) {
      lastBlockReasonRef.current = null;
      return;
    }

    const blockReason = hasMemberships
      ? "sin-negocio-seleccionado"
      : "sin-membresias";

    if (lastBlockReasonRef.current === blockReason) {
      return;
    }

    lastBlockReasonRef.current = blockReason;

    console.warn(`${BUSINESS_GATE_DEBUG_PREFIX} Compuerta bloqueada`, {
      blockReason,
      membershipsLength: memberships.length,
      businessId,
      role: user?.role,
      status: user?.status,
      error,
    });
  }, [
    authLoading,
    businessId,
    error,
    hasMemberships,
    hasSelectedBusiness,
    hydrating,
    loading,
    memberships.length,
    user?.role,
    user?.status,
  ]);

  const handleLogout = () => {
    authService.logout();
    navigate("/login", { replace: true });
  };

  const handleCreateBusiness = () => {
    navigate("/onboarding", { replace: true });
  };

  const renderLoader = (message: string) => (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-300/40 border-t-cyan-200" />
      <span>{message}</span>
    </div>
  );

  // REMOVED: El BusinessContext ya maneja el refresh inicial.
  // El useEffect anterior que llamaba refresh() causaba un loop infinito.

  if (authLoading || hydrating) {
    return renderLoader("Preparando tu negocio...");
  }

  if (loading) {
    return renderLoader("Cargando contexto de negocio...");
  }

  if (!hasSelectedBusiness) {
    if (!hasMemberships) {
      return (
        <div className="space-y-4 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-4 text-sm text-cyan-100">
          <div>
            <p className="font-semibold text-cyan-200">
              Bienvenido, aun no perteneces a ningun negocio.
            </p>
            <p className="mt-1 text-cyan-100/80">
              Para continuar, crea tu primer negocio o cierra sesion para entrar
              con otra cuenta.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canCreateBusiness && (
              <button
                type="button"
                onClick={handleCreateBusiness}
                className="rounded-md border border-cyan-300/50 bg-cyan-400/10 px-3 py-2 font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Crear mi primer negocio
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-white/30 bg-white/5 px-3 py-2 font-semibold text-white transition hover:bg-white/10"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
        <div className="font-semibold text-amber-200">
          Selecciona un negocio para continuar
        </div>
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}
        <BusinessSelector />
      </div>
    );
  }

  if (requiredFeature && features && features[requiredFeature] === false) {
    const isAssistantBlocked = requiredFeature === "assistant";
    return (
      <div className="rounded-lg border border-purple-400/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-100">
        {isAssistantBlocked
          ? "Business Assistant está disponible solo para el plan Enterprise."
          : "Esta funcionalidad está desactivada para el negocio seleccionado."}
      </div>
    );
  }

  return <>{children}</>;
}
