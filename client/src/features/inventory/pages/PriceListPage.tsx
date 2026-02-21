import { Check, Loader2, Pencil, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { productService } from "../services/inventory.service";
import type { Product } from "../types/product.types";

type RowDraft = {
  price: string;
  wholesalePrice: string;
};

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const toSafeNumber = (value: string | number | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const marginPercent = (cost: number, publicPrice: number): number => {
  if (publicPrice <= 0) return 0;
  return ((publicPrice - cost) / publicPrice) * 100;
};

export default function PriceListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await productService.getAll({ limit: 1000 });
        const data = response?.data || [];
        setProducts(data);

        const initialDrafts: Record<string, RowDraft> = {};
        data.forEach((item: Product) => {
          initialDrafts[item._id] = {
            price: String(item.clientPrice ?? 0),
            wholesalePrice: String(item.distributorPrice ?? 0),
          };
        });
        setDrafts(initialDrafts);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            "No se pudo cargar la lista de precios"
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const startEdit = (id: string) => {
    setEditingId(id);
  };

  const cancelEdit = (id: string) => {
    const product = products.find(item => item._id === id);
    if (product) {
      setDrafts(prev => ({
        ...prev,
        [id]: {
          price: String(product.clientPrice ?? 0),
          wholesalePrice: String(product.distributorPrice ?? 0),
        },
      }));
    }
    setEditingId(null);
  };

  const savePrices = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;

    const price = toSafeNumber(draft.price);
    const wholesalePrice = toSafeNumber(draft.wholesalePrice);

    if (price < 0 || wholesalePrice < 0) {
      setError("Los precios no pueden ser negativos");
      return;
    }

    try {
      setSavingId(id);
      setError("");
      const updated = await productService.updatePrices(id, {
        price,
        wholesalePrice,
      });

      setProducts(prev =>
        prev.map(item => (item._id === id ? { ...item, ...updated } : item))
      );
      setEditingId(null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "No se pudo actualizar el precio"
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleDraftChange = (
    id: string,
    field: keyof RowDraft,
    value: string
  ) => {
    setDrafts(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { price: "0", wholesalePrice: "0" }),
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h1 className="text-2xl font-bold text-white">Lista de Precios</h1>
        <p className="mt-2 text-sm text-gray-300">
          Edita precios en línea y controla el margen proyectado por producto.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-black/20 text-xs uppercase tracking-wide text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-right">Costo adquisición</th>
                <th className="px-4 py-3 text-right">Precio público</th>
                <th className="px-4 py-3 text-right">Precio distribuidor</th>
                <th className="px-4 py-3 text-right">Margen proyectado</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-300"
                  >
                    Cargando productos...
                  </td>
                </tr>
              ) : sortedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-300"
                  >
                    No hay productos disponibles.
                  </td>
                </tr>
              ) : (
                sortedProducts.map(item => {
                  const isEditing = editingId === item._id;
                  const isSaving = savingId === item._id;
                  const draft = drafts[item._id] || {
                    price: String(item.clientPrice ?? 0),
                    wholesalePrice: String(item.distributorPrice ?? 0),
                  };

                  const projectedPrice = isEditing
                    ? toSafeNumber(draft.price)
                    : toSafeNumber(item.clientPrice);

                  const projectedMargin = marginPercent(
                    toSafeNumber(item.purchasePrice),
                    projectedPrice
                  );

                  return (
                    <tr key={item._id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white">{item.name}</td>
                      <td className="px-4 py-3 text-right text-gray-200">
                        {currency.format(toSafeNumber(item.purchasePrice))}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-100">
                        {isEditing ? (
                          <input
                            value={draft.price}
                            onChange={e =>
                              handleDraftChange(
                                item._id,
                                "price",
                                e.target.value
                              )
                            }
                            type="number"
                            min="0"
                            className="w-32 rounded-lg border border-white/15 bg-black/20 px-2 py-1 text-right text-sm text-white"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(item._id)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/10"
                          >
                            {currency.format(toSafeNumber(item.clientPrice))}
                            <Pencil className="h-3.5 w-3.5 text-gray-400" />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-100">
                        {isEditing ? (
                          <input
                            value={draft.wholesalePrice}
                            onChange={e =>
                              handleDraftChange(
                                item._id,
                                "wholesalePrice",
                                e.target.value
                              )
                            }
                            type="number"
                            min="0"
                            className="w-32 rounded-lg border border-white/15 bg-black/20 px-2 py-1 text-right text-sm text-white"
                          />
                        ) : (
                          currency.format(toSafeNumber(item.distributorPrice))
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-semibold ${
                            projectedMargin >= 20
                              ? "text-emerald-300"
                              : projectedMargin >= 10
                                ? "text-yellow-300"
                                : "text-rose-300"
                          }`}
                        >
                          {projectedMargin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => savePrices(item._id)}
                              disabled={isSaving}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-60"
                              title="Guardar"
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelEdit(item._id)}
                              disabled={isSaving}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 disabled:opacity-60"
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(item._id)}
                            className="rounded-md border border-white/15 px-3 py-1 text-xs text-gray-200 hover:border-white/30 hover:bg-white/10"
                          >
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
