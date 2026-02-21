import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBrandLogo } from "../../../hooks/useBrandLogo";
import { Button, Input } from "../../../shared/components/ui";
import { authService } from "../services";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const brandLogo = useBrandLogo();

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();
    const digitsInPhone = trimmedPhone.replace(/\D/g, "");
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;

    if (!trimmedName || /\d/.test(trimmedName)) {
      setError("El nombre no debe contener números");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setError("Ingresa un correo electrónico válido");
      return;
    }

    if (/[a-zA-Z]/.test(trimmedPhone) || digitsInPhone.length < 7) {
      setError("Ingresa un teléfono válido (solo números y mínimo 7 dígitos)");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        password: formData.password,
        phone: trimmedPhone,
        address: formData.address.trim(),
        logo: null,
      };

      await authService.register(payload);

      setSuccess("✅ Registro completado. Tienes 7 días gratis para probar.");
      setLoading(false);

      // Redirigir después de 2 segundos para que el usuario vea el mensaje
      setTimeout(() => {
        navigate("/admin/create-business", {
          replace: true,
        });
      }, 2000);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "No se pudo completar el registro";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-app-base min-h-screen px-4 py-10 text-white sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <img
              src={brandLogo}
              alt="Essence ERP"
              className="h-14 w-auto sm:h-16"
              loading="lazy"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
                Essence ERP
              </p>
              <h1 className="bg-linear-to-r from-purple-200 to-pink-200 bg-clip-text text-3xl font-extrabold leading-tight text-transparent sm:text-4xl lg:text-5xl">
                Crea tu cuenta y opera tu negocio
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-base text-gray-300 sm:text-lg">
            Configura tu panel para gestionar inventario, catálogos, comisiones
            y analítica desde un solo lugar. Onboarding guiado y soporte
            incluido.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              "Onboarding asistido",
              "Roles y permisos",
              "KPIs en vivo",
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

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-purple-900/40 backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
              Registro
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Crear cuenta
            </h2>
            <p className="mt-1 text-sm text-gray-300">
              Te tomará menos de un minuto.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-green-500/50 bg-green-500/10 p-4">
              <p className="text-sm font-semibold text-green-200">{success}</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent"></div>
                <span className="text-xs text-green-300">
                  Preparando tu cuenta...
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Nombre completo"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <Input
                  label="Correo electrónico"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <Input
                  label="Número de teléfono"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  inputMode="tel"
                  placeholder="Ej: +57 300 000 0000"
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Lugar / Dirección"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Ciudad, país o dirección completa"
                />
              </div>

              <div>
                <Input
                  label="Contraseña"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="bg-linear-to-r mt-2 w-full from-purple-600 to-fuchsia-600 text-base font-semibold text-white hover:from-purple-700 hover:to-fuchsia-700 focus:ring-purple-500"
            >
              {loading ? "Creando cuenta..." : "Registrarme"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-400">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-purple-300 hover:text-white">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
