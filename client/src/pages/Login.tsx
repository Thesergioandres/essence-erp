import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/services.ts";

export default function Login() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"admin" | "distribuidor" | null>(
    null
  );
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

      // Verificar que el tipo de usuario coincida con la selección
      if (userType === "distribuidor" && response.role !== "distribuidor") {
        setError("Esta cuenta no es de tipo Distribuidor");
        authService.logout();
        setLoading(false);
        return;
      }

      if (
        userType === "admin" &&
        !["admin", "super_admin", "god"].includes(response.role)
      ) {
        setError("Esta cuenta no es de tipo Administrador");
        authService.logout();
        setLoading(false);
        return;
      }

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

          <p className="max-w-2xl text-base text-gray-300 sm:text-lg">
            Inicia sesión para administrar inventario, catálogos, comisiones y
            módulos por negocio. Seguridad y control en un solo panel.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              "Roles y permisos",
              "KPIs en vivo",
              "Jobs automáticos",
              "Multi-negocio",
            ].map(item => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm text-gray-200"
              >
                <span className="h-2 w-2 rounded-full bg-green-400" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Auth column */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-purple-900/40 backdrop-blur-xl sm:p-8 lg:p-10">
          {!userType ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
                  Acceso
                </p>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                  Elige tu tipo de cuenta
                </h2>
                <p className="mt-1 text-sm text-gray-300">
                  Ingresa como administrador del ERP o como distribuidor.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setUserType("admin")}
                  className="w-full rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-700 to-fuchsia-600 p-4 text-left shadow-md transition hover:shadow-purple-800/40 focus:outline-none focus:ring-2 focus:ring-purple-500 active:scale-[0.99] sm:p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Administrador</p>
                      <p className="text-sm text-gray-200">
                        Acceso completo al sistema
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setUserType("distribuidor")}
                  className="w-full rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-700 to-cyan-600 p-4 text-left shadow-md transition hover:shadow-blue-800/40 focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.99] sm:p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Distribuidor</p>
                      <p className="text-sm text-gray-200">
                        Gestión de ventas y productos
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
                    Ingreso
                  </p>
                  <h2 className="text-2xl font-bold sm:text-3xl">
                    {userType === "admin" ? "Admin" : "Distribuidor"}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setUserType(null);
                    setError("");
                    setFormData({ email: "", password: "" });
                  }}
                  className="text-sm text-gray-300 transition hover:text-white"
                >
                  ← Cambiar
                </button>
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
                  className={`w-full rounded-lg py-3 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#070910] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
                    userType === "admin"
                      ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 focus:ring-purple-500"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-500"
                  }`}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </button>
              </form>
            </div>
          )}

          <div className="mt-6 space-y-2 text-center text-sm text-gray-400">
            <p>
              ¿No tienes cuenta?{" "}
              <a
                href="/register"
                className="font-semibold text-purple-300 hover:text-white"
              >
                Regístrate
              </a>
            </p>
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
