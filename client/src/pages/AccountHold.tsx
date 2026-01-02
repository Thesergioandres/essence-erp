import { Link, useLocation } from "react-router-dom";

export default function AccountHold() {
  const location = useLocation();
  const reason = (location.state as { reason?: string } | null)?.reason;
  const isExpired = reason === "expired";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="max-w-lg rounded-2xl border border-white/10 bg-gray-900/70 p-8 text-center shadow-xl">
        <h1 className="mb-3 text-2xl font-bold text-white">
          {isExpired ? "Suscripción expirada" : "Cuenta en revisión"}
        </h1>
        <p className="text-gray-300">
          {isExpired
            ? "Tu suscripción ha terminado. Contacta al usuario con rol GOD para renovarla."
            : "Tu cuenta está pendiente de activación manual. Contacta al usuario con rol GOD para activarla y recibir instrucciones de pago."}
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-white"
          >
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}
