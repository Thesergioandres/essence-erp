import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/services.ts";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    const token = localStorage.getItem("token");

    if (user && token) {
      // Redirect based on role
      if (user.role === "distribuidor") {
        navigate("/distributor/dashboard", { replace: true });
      } else if (
        user.role === "admin" ||
        user.role === "super_admin" ||
        user.role === "god"
      ) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

      // Redirect based on user role
      if (response.role === "distribuidor") {
        navigate("/distributor/dashboard");
      } else if (
        response.role === "admin" ||
        response.role === "super_admin" ||
        response.role === "god"
      ) {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
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
    <div className="min-h-screen bg-[#070910] px-4 py-10 text-white sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center">
        {/* Info column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <img
              src="/erp-logo.png"
              alt="Essence ERP"
              className="h-14 w-auto sm:h-16"
              loading="lazy"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
                Essence ERP
              </p>
              <h1 className="bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-3xl font-extrabold leading-tight text-transparent sm:text-4xl lg:text-5xl">
                Control total de tus operaciones
              </h1>
            </div>
          </div>
        </div>

        {/* Auth column */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-purple-900/40 backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
                Acceso
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Inicia sesión
              </h2>
              <p className="mt-1 text-sm text-gray-300">
                Una sola puerta de entrada. Te llevamos al panel correcto según
                tu rol.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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
                  autoComplete="email"
                  inputMode="email"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder-gray-500 transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="tu@email.com"
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
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder-gray-500 transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-purple-700 hover:to-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#070910] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </button>
            </form>

            <div className="text-center text-sm text-gray-300">
              ¿No tienes cuenta?
              <button
                onClick={() => navigate("/register")}
                className="ml-1 font-semibold text-purple-300 underline-offset-2 hover:underline"
                type="button"
              >
                Regístrate
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-center text-sm text-gray-400">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Essence. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
