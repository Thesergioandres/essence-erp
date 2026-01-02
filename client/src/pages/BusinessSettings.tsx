import { Suspense, useEffect, useMemo, useState } from "react";
import { businessService } from "../api/services";
import { useBusiness } from "../context/BusinessContext";
import type { BusinessFeatures } from "../types";
import AuditLogs from "./AuditLogs";
import Distributors from "./Distributors";
import GamificationConfig from "./GamificationConfig";
import Rankings from "./Rankings";

interface FormState {
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactLocation: string;
  features: BusinessFeatures;
}

const defaultFeatures: BusinessFeatures = {
  products: true,
  inventory: true,
  sales: true,
  gamification: true,
  incidents: true,
  expenses: true,
  assistant: false,
  reports: true,
  transfers: true,
};

export default function BusinessSettings() {
  const { business, businessId, refresh, features } = useBusiness();
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    contactWhatsapp: "",
    contactLocation: "",
    features: defaultFeatures,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<
    "business" | "distributors" | "gamification" | "rankings" | "audit"
  >("business");

  const sectionCards = useMemo(
    () => [
      {
        key: "business" as const,
        title: "Datos del negocio",
        desc: "Información general y contacto",
      },
      {
        key: "distributors" as const,
        title: "Distribuidores",
        desc: "Gestiona tu red de distribuidores",
      },
      {
        key: "gamification" as const,
        title: "Gamificación",
        desc: "Configura puntos y rankings",
      },
      {
        key: "rankings" as const,
        title: "Rankings",
        desc: "Visualiza la clasificación",
      },
      {
        key: "audit" as const,
        title: "Auditoría",
        desc: "Historial de acciones y logs",
      },
    ],
    []
  );

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || "",
        description: business.description || "",
        contactEmail: business.contactEmail || "",
        contactPhone: business.contactPhone || "",
        contactWhatsapp: business.contactWhatsapp || "",
        contactLocation: business.contactLocation || "",
        features: business.config?.features || features || defaultFeatures,
      });
    }
  }, [business, features]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleToggleFeature = (key: keyof BusinessFeatures) => {
    setForm(prev => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features?.[key] },
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!businessId) {
      setError("Selecciona un negocio antes de actualizar.");
      return;
    }
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await businessService.updateBusiness(businessId, {
        name: form.name,
        description: form.description,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        contactWhatsapp: form.contactWhatsapp,
        contactLocation: form.contactLocation,
      });
      await businessService.updateBusinessFeatures(businessId, form.features);
      setMessage("Datos del negocio actualizados");
      await refresh();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "No se pudo actualizar el negocio";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-linear-to-br min-h-screen from-gray-900 via-purple-900/20 to-gray-900">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Configurar negocio
          </h1>
          <p className="mt-2 text-sm text-gray-400 sm:text-base">
            Actualiza la información de contacto que usa el catálogo y los
            enlaces de WhatsApp.
          </p>
        </div>

        <div className="mb-8 grid gap-4 rounded-xl border border-gray-800 bg-gray-800/60 p-4 sm:grid-cols-2">
          {sectionCards.map(link => (
            <button
              type="button"
              key={link.key}
              onClick={() => setSelectedView(link.key)}
              className={`group flex items-center justify-between rounded-lg border px-4 py-3 text-left transition hover:border-purple-400/60 hover:bg-white/10 ${
                selectedView === link.key
                  ? "border-purple-400/70 bg-white/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-purple-100">
                  {link.title}
                </p>
                <p className="text-xs text-gray-400">{link.desc}</p>
              </div>
              <span className="text-sm text-purple-200 group-hover:translate-x-1 group-hover:text-purple-100">
                →
              </span>
            </button>
          ))}
        </div>

        {!businessId && (
          <div className="mb-4 rounded-lg border border-yellow-500 bg-yellow-500/10 p-4 text-yellow-200">
            No hay negocio seleccionado. Inicia sesión y selecciona un negocio
            para editarlo.
          </div>
        )}

        <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-6 shadow-xl backdrop-blur">
          <Suspense fallback={<div className="text-white">Cargando...</div>}>
            {selectedView === "business" && (
              <>
                {error && (
                  <div className="mb-4 rounded-lg border border-red-500 bg-red-500/10 p-3 text-sm text-red-300">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="mb-4 rounded-lg border border-green-500 bg-green-500/10 p-3 text-sm text-green-300">
                    {message}
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-gray-200">
                        Nombre del negocio
                      </label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-gray-600 bg-gray-900/60 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ej: Essence"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-gray-200">
                        Descripción
                      </label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full rounded-lg border border-gray-600 bg-gray-900/60 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Breve descripción del negocio"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-200">
                        Correo de contacto
                      </label>
                      <input
                        type="email"
                        name="contactEmail"
                        value={form.contactEmail}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-600 bg-gray-900/60 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-200">
                        Teléfono de contacto
                      </label>
                      <input
                        name="contactPhone"
                        value={form.contactPhone}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-600 bg-gray-900/60 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ej: +57 3000000000"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-200">
                        WhatsApp
                      </label>
                      <input
                        name="contactWhatsapp"
                        value={form.contactWhatsapp}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-600 bg-gray-900/60 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Número para link de WhatsApp"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-200">
                        Ubicación
                      </label>
                      <input
                        name="contactLocation"
                        value={form.contactLocation}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-600 bg-gray-900/60 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ciudad / dirección"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold text-white">
                          Funcionalidades activas
                        </p>
                        <p className="text-sm text-gray-400">
                          Enciende o apaga módulos según lo que usa este
                          negocio.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {(
                        [
                          "products",
                          "inventory",
                          "sales",
                          "expenses",
                          "reports",
                          "assistant",
                          "gamification",
                          "transfers",
                          "incidents",
                        ] as (keyof BusinessFeatures)[]
                      ).map(key => {
                        const labelMap: Record<keyof BusinessFeatures, string> =
                          {
                            products: "Productos",
                            inventory: "Inventario",
                            sales: "Ventas",
                            gamification: "Gamificación",
                            incidents: "Incidencias",
                            expenses: "Gastos",
                            assistant: "Business Assistant",
                            reports: "Reportes",
                            transfers: "Transferencias",
                          };
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleToggleFeature(key)}
                            className={`flex items-center justify-between rounded-lg border px-3 py-3 text-left transition hover:border-purple-400/60 hover:text-white ${
                              form.features?.[key]
                                ? "border-purple-500/50 bg-purple-500/10 text-white"
                                : "border-white/10 bg-white/0 text-gray-200"
                            }`}
                          >
                            <div>
                              <p className="text-sm font-semibold">
                                {labelMap[key]}
                              </p>
                              <p className="text-xs text-gray-400">
                                {form.features?.[key]
                                  ? "Activo para este negocio"
                                  : "Desactivado para este negocio"}
                              </p>
                            </div>
                            <span
                              className={`h-5 w-9 rounded-full border transition ${
                                form.features?.[key]
                                  ? "border-purple-400 bg-purple-500/30"
                                  : "border-white/20 bg-white/0"
                              }`}
                            >
                              <span
                                className={`block h-4 w-4 translate-x-0.5 rounded-full bg-white transition ${
                                  form.features?.[key] ? "translate-x-4" : ""
                                }`}
                              />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !businessId}
                    className="bg-linear-to-r w-full rounded-lg from-purple-600 to-pink-600 px-4 py-3 text-base font-semibold text-white transition hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Guardando..." : "Guardar cambios"}
                  </button>
                </form>
              </>
            )}

            {selectedView === "distributors" && <Distributors />}
            {selectedView === "gamification" && <GamificationConfig />}
            {selectedView === "rankings" && <Rankings />}
            {selectedView === "audit" && <AuditLogs />}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
