import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/services";

export default function LoginGod() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    const token = localStorage.getItem("token");

    if (user && token) {
      if (user.role === "god") {
        navigate("/god", { replace: true });
      } else {
        setError("No tienes permisos de rol GOD");
        localStorage.removeItem("token");
      }
    }
  }, [navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.login(
        formData.email,
        formData.password
      );

      if (response.role !== "god") {
        setError("No tienes permisos de rol GOD");
        localStorage.removeItem("token");
        return;
      }

      navigate("/god");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Error al iniciar sesión";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-5xl font-bold text-transparent">
            ESSENCE
          </h1>
          <p className="text-lg text-indigo-200">Acceso Modo GOD</p>
        </div>

        <div className="rounded-2xl border border-indigo-700/60 bg-gray-800/70 p-8 shadow-2xl shadow-indigo-900/40 backdrop-blur">
          <div className="mb-6 flex items-center justify-center">
            <div className="rounded-full bg-indigo-600/20 p-3">
              <svg
                className="h-8 w-8 text-indigo-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20a7 7 0 10-14 0h14z"
                />
              </svg>
            </div>
          </div>

          <h2 className="mb-6 text-center text-2xl font-bold text-white">
            Iniciar Sesión - GOD
          </h2>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/60 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-indigo-600 bg-gray-900/60 px-4 py-3 text-white placeholder-gray-500 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="god@ejemplo.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-indigo-600 bg-gray-900/60 px-4 py-3 text-white placeholder-gray-500 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 py-3 font-semibold text-white transition hover:from-indigo-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-indigo-200">
            <a href="/login/admin" className="block hover:text-white">
              ¿Eres admin? Inicia sesión aquí
            </a>
            <a href="/login/distributor" className="block hover:text-white">
              ¿Eres distribuidor? Inicia sesión aquí
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          © 2025 Essence. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
