import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AccountHold() {
  const location = useLocation();
  const { logout } = useAuth();
  const reasonFromState = (location.state as { reason?: string } | null)
    ?.reason;
  const reasonFromQuery = new URLSearchParams(location.search).get("reason");
  const reasonFromStorage = localStorage.getItem("accessHoldReason");

  const reason =
    reasonFromState || reasonFromQuery || reasonFromStorage || "pending";
  const isExpired = reason === "expired";
  const isOwnerInactive = reason === "owner_inactive";
  const isOwnerExpired = reason === "owner_expired";

  const handleBackToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="max-w-lg rounded-2xl border border-white/10 bg-gray-900/70 p-8 text-center shadow-xl">
        <h1 className="mb-3 text-2xl font-bold text-white">
          {isExpired
            ? "Suscripción expirada"
            : isOwnerExpired
              ? "Suscripción del negocio expirada"
              : isOwnerInactive
                ? "Acceso deshabilitado"
                : "Cuenta en revisión"}
        </h1>
        <p className="text-gray-300">
          {isExpired
            ? "Tu suscripción ha terminado. Contacta al usuario con rol GOD para renovarla."
            : isOwnerExpired
              ? "La suscripción del administrador de tu negocio ha expirado. Contacta a tu administrador para que renueve la suscripción."
              : isOwnerInactive
                ? "El administrador de tu empresa no tiene acceso activo. Contacta a tu admin para reactivar la cuenta."
                : "Tu cuenta está pendiente de activación manual. Envía tu comprobante de pago al WhatsApp 3185753007 para activar tu plan por 30 días."}
        </p>
        <div className="mt-6">
          <button
            onClick={handleBackToLogin}
            className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-white hover:opacity-90 transition-opacity"
          >
            Volver al login
          </button>
        </div>
      </div>
    </div>
  );
}
