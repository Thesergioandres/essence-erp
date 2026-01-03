import { useEffect, useMemo, useState } from "react";
import { branchService } from "../api/services";
import { Button } from "../components/Button";
import type { Branch } from "../types";

interface FormState {
  name: string;
  address: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  timezone: string;
}

const DEFAULT_FORM: FormState = {
  name: "",
  address: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  timezone: "America/Bogota",
};

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const activeCount = useMemo(
    () => branches.filter(b => b.active !== false).length,
    [branches]
  );

  useEffect(() => {
    void loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await branchService.list();
      setBranches(data || []);
    } catch (err) {
      console.error("loadBranches", err);
      setError("No se pudieron cargar las sedes");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setError("El nombre es obligatorio");
      return;
    }
    try {
      setSaving(true);
      const branch = await branchService.create({
        name: trimmedName,
        address: form.address.trim() || undefined,
        contactName: form.contactName.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        timezone: form.timezone,
      });
      setBranches(prev => [branch, ...prev]);
      setForm(DEFAULT_FORM);
      setSuccess("Sede creada correctamente");
    } catch (err) {
      console.error("createBranch", err);
      setError("No se pudo crear la sede");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    setError("");
    setSuccess("");
    setUpdatingId(branch._id);
    try {
      const updated = await branchService.update(branch._id, {
        active: branch.active === false ? true : false,
      });
      setBranches(prev => prev.map(b => (b._id === branch._id ? updated : b)));
      setSuccess(
        `Sede ${updated.active === false ? "desactivada" : "activada"}`
      );
    } catch (err) {
      console.error("toggleActive", err);
      setError("No se pudo actualizar el estado de la sede");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (branch: Branch) => {
    const confirmDelete = window.confirm(
      `¿Eliminar la sede "${branch.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmDelete) return;
    setError("");
    setSuccess("");
    setDeletingId(branch._id);
    try {
      await branchService.remove(branch._id);
      setBranches(prev => prev.filter(b => b._id !== branch._id));
      setSuccess("Sede eliminada");
    } catch (err) {
      console.error("deleteBranch", err);
      setError("No se pudo eliminar la sede");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Sedes</h1>
        <p className="mt-2 text-gray-400">
          Crea y administra las sedes desde las que venderás y llevarás
          inventario.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-700 bg-gray-800/60 p-5 shadow-lg"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Crear sede</h2>
            <span className="text-xs text-gray-400">Zona horaria opcional</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Nombre *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ej. Sede Centro"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Calle 123 #45-67"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Contacto
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={form.contactName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Nombre de contacto"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="3001234567"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="contacto@empresa.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Zona horaria
                </label>
                <select
                  name="timezone"
                  value={form.timezone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="America/Bogota">America/Bogota</option>
                  <option value="America/Mexico_City">
                    America/Mexico_City
                  </option>
                  <option value="America/Lima">America/Lima</option>
                  <option value="America/Santiago">America/Santiago</option>
                  <option value="America/Argentina/Buenos_Aires">
                    America/Argentina/Buenos_Aires
                  </option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Crear sede"}
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Listado</h2>
                <p className="text-sm text-gray-400">
                  {loading
                    ? "Cargando sedes..."
                    : `${branches.length} sede(s), ${activeCount} activas`}
                </p>
              </div>
              <button
                onClick={() => void loadBranches()}
                className="rounded-lg border border-gray-600 px-3 py-1 text-xs font-semibold text-gray-200 transition hover:border-purple-500 hover:text-white"
                disabled={loading}
              >
                Recargar
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4 text-gray-400">
                Cargando...
              </div>
            ) : branches.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-700 bg-gray-900/40 p-6 text-center text-gray-400">
                No hay sedes registradas.
              </div>
            ) : (
              branches.map(branch => (
                <div
                  key={branch._id}
                  className="rounded-lg border border-gray-700 bg-gray-900/60 p-4 shadow"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-white">
                          {branch.name}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${branch.active === false ? "bg-red-500/20 text-red-300" : "bg-green-500/15 text-green-200"}`}
                        >
                          {branch.active === false ? "Inactiva" : "Activa"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {branch.address || "Sin dirección"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {branch.contactName || "Sin contacto"}
                        {branch.contactPhone ? ` · ${branch.contactPhone}` : ""}
                        {branch.contactEmail ? ` · ${branch.contactEmail}` : ""}
                      </p>
                      <p className="text-xs text-gray-500">{branch.timezone}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleToggleActive(branch)}
                        disabled={updatingId === branch._id}
                        className="rounded-lg border border-gray-600 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-purple-500 hover:text-white disabled:opacity-60"
                      >
                        {branch.active === false ? "Activar" : "Desactivar"}
                      </button>
                      <button
                        onClick={() => handleDelete(branch)}
                        disabled={deletingId === branch._id}
                        className="rounded-lg border border-red-700/60 px-3 py-2 text-xs font-semibold text-red-200 transition hover:border-red-600 hover:text-white disabled:opacity-60"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
