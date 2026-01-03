import { Link, useLocation } from "react-router-dom";

export default function AccountHold() {
  const location = useLocation();
  const reasonFromState = (location.state as { reason?: string } | null)
    ?.reason;
  const reasonFromQuery = new URLSearchParams(location.search).get("reason");
  const reasonFromStorage = localStorage.getItem("accessHoldReason");

  const reason =
    reasonFromState || reasonFromQuery || reasonFromStorage || "pending";
  const isExpired = reason === "expired";
  const isOwnerInactive = reason === "owner_inactive";

  const handleBackToLogin = () => {
    // Limpia sesión y bandera de hold para evitar redirección automática de nuevo
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("businessId");
    localStorage.removeItem("accessHoldReason");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="max-w-lg rounded-2xl border border-white/10 bg-gray-900/70 p-8 text-center shadow-xl">
        <h1 className="mb-3 text-2xl font-bold text-white">
          {isExpired
            ? "Suscripción expirada"
            : isOwnerInactive
              ? "Acceso deshabilitado"
              : "Cuenta en revisión"}
        </h1>
        <p className="text-gray-300">
          {isExpired
            ? "Tu suscripción ha terminado. Contacta al usuario con rol GOD para renovarla."
            : isOwnerInactive
              ? "El administrador de tu empresa no tiene acceso activo. Contacta a tu admin para reactivar la cuenta."
              : "Tu cuenta está pendiente de activación manual. Contacta al usuario con rol GOD para activarla y recibir instrucciones de pago."}
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            onClick={handleBackToLogin}
            replace
            className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-white"
          >
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}
