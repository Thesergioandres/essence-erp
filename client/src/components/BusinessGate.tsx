import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useBusiness } from "../context/BusinessContext";
import { authService } from "../features/auth/services";
import { useSession } from "../hooks/useSession";
import BusinessSelector from "./BusinessSelector";

interface BusinessGateProps {
  children: ReactNode;
  requiredFeature?: keyof ReturnType<typeof useBusiness>["features"];
}

export default function BusinessGate({
  children,
  requiredFeature,
}: BusinessGateProps) {
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

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!businessId || !business) {
    if (
      !loading &&
      !hydrating &&
      user?.role === "super_admin" &&
      user?.status === "active" &&
      memberships.length === 0
    ) {
      return <Navigate to="/onboarding" replace />;
    }

    return (
      <div className="space-y-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
        <div className="font-semibold text-amber-200">
          {loading
            ? "Cargando negocios..."
            : "Selecciona un negocio para continuar"}
        </div>
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
