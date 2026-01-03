import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService, uploadService } from "../api/services";
import { useBrandLogo } from "../hooks/useBrandLogo";

export default function Register() {
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const brandLogo = useBrandLogo();

  // Asegura que el branding del login/landing no se contamine con logos subidos durante registro
  useEffect(() => {
    localStorage.removeItem("brandLogoUrl");
    localStorage.removeItem("brandLogoPublicId");
    window.dispatchEvent(new Event("brand-logo-updated"));
  }, []);

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogoFile(file ?? null);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

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

      // Una vez con token, subir logo protegido (solo para guardar luego en backend); no alteres brand del login
      if (logoFile) {
        try {
          await uploadService.uploadImage(logoFile);
        } catch (uploadErr) {
          console.error("Logo upload failed", uploadErr);
          setError("Cuenta creada, pero el logo no se pudo subir.");
        }
      }

      setSuccess("Registro exitoso, continuemos configurando tu negocio...");
      navigate("/onboarding", { replace: true });
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "No se pudo completar el registro";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070910] px-4 py-10 text-white sm:px-6 lg:px-12">
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
              <h1 className="bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-3xl font-extrabold leading-tight text-transparent sm:text-4xl lg:text-5xl">
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
            <div className="mb-4 rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-200">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-200">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-gray-500 transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-gray-500 transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">
                  Número de teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  inputMode="tel"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-gray-500 transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: +57 300 000 0000"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-200">
                  Lugar / Dirección
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-gray-500 transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ciudad, país o dirección completa"
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
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-gray-500 transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-gray-500 transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-200">
                  Logo de la empresa (opcional)
                </label>
                <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo seleccionado"
                        className="h-14 w-auto rounded-md border border-white/10 bg-gray-900 object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-white/20 bg-gray-900/50 text-xs text-gray-400">
                        PNG/JPG
                      </div>
                    )}
                    <p className="text-sm text-gray-300">
                      Sube un logo que usaremos en la navegación y el panel.
                      Recomendado 512x512 png con fondo transparente.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-purple-400 hover:text-purple-100">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      Subir logo
                    </label>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(null);
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-sm text-gray-200 transition hover:border-red-400 hover:text-red-200"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 text-base font-semibold text-white transition hover:from-purple-700 hover:to-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#070910] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creando cuenta..." : "Registrarme"}
            </button>
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
