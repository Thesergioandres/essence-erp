/**
 * AdvertisingPage — Generador de Publicidad (Auto-Ads)
 *
 * Genera automáticamente banners promocionales usando los productos
 * del inventario. El usuario puede descargar, compartir o copiar
 * el texto de venta con un solo clic.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useProducts } from "../../inventory/hooks/useProducts";
import { useBusiness } from "../../../context/BusinessContext";
import { useBrandLogo } from "../../../hooks/useBrandLogo";
import AdCard from "../components/AdCard";
import type { AdProduct, TemplateType } from "../types/advertising.types";
import type { Product } from "../../inventory/types/product.types";
import { templateList } from "../utils/templateThemes";

const TEMPLATES: TemplateType[] = templateList.map(t => t.id);

/** Convierte un Product del inventario a un AdProduct simplificado */
function toAdProduct(p: Product): AdProduct {
  return {
    _id: p._id,
    name: p.name,
    price: p.clientPrice ?? p.suggestedPrice ?? p.distributorPrice,
    originalPrice: p.suggestedPrice ?? undefined,
    image: p.image?.url,
    category:
      typeof p.category === "object" && p.category !== null
        ? p.category.name
        : undefined,
    description: p.description,
  };
}

/** Elige N productos aleatorios sin repetir */
function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  while (result.length < n && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

export default function AdvertisingPage() {
  const { products, loading, error } = useProducts();
  const { business } = useBusiness();
  const logoUrl = useBrandLogo();

  const [selectedTemplate, setSelectedTemplate] = useState<
    TemplateType | "all"
  >("all");
  const [search, setSearch] = useState("");
  const [showOnlyWithImage, setShowOnlyWithImage] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  // Productos activos con stock
  const activeProducts = useMemo(
    () => products.filter(p => p.active !== false).map(toAdProduct),
    [products]
  );

  // "Sugerencias del Día" — 6 productos aleatorios (se regeneran con el botón)
  const [suggestionSeed, setSuggestionSeed] = useState(0);
  const suggestions = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _seed = suggestionSeed; // forzar recálculo
    const withImage = activeProducts.filter(p => p.image);
    return pickRandom(withImage.length >= 6 ? withImage : activeProducts, 6);
  }, [activeProducts, suggestionSeed]);

  const refreshSuggestions = useCallback(
    () => setSuggestionSeed(s => s + 1),
    []
  );

  // Filtrado de la galería completa
  const filteredProducts = useMemo(() => {
    let list = activeProducts;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }
    if (showOnlyWithImage) {
      list = list.filter(p => p.image);
    }
    return list;
  }, [activeProducts, search, showOnlyWithImage]);

  useEffect(() => {
    setVisibleCount(24);
  }, [search, showOnlyWithImage, selectedTemplate]);

  const templatesToShow: TemplateType[] =
    selectedTemplate === "all" ? TEMPLATES : [selectedTemplate];

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  const businessName = business?.name || "";

  // ───── Render ─────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Cargando productos…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-xl bg-red-50 p-8 text-center text-red-600">
          <p className="text-lg font-semibold">Error al cargar productos</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      {/* ──── Header ──── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          🎨 Generador de Publicidad
        </h1>
        <p className="mt-1 text-gray-500">
          Tu app te diseña los posts. Descarga, comparte o copia el texto de
          venta con un clic.
        </p>
      </div>

      {/* ──── Sugerencias del Día ──── */}
      {suggestions.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              ✨ Sugerencias del Día
            </h2>
            <button
              onClick={refreshSuggestions}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Nuevas ideas
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map(product => {
              const tpl =
                TEMPLATES[
                  Math.abs(
                    product._id
                      .split("")
                      .reduce((a, c) => a + c.charCodeAt(0), 0)
                  ) % TEMPLATES.length
                ];
              return (
                <AdCard
                  key={`sug-${product._id}-${tpl}`}
                  product={product}
                  template={tpl}
                  logoUrl={logoUrl}
                  businessName={businessName}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ──── Filtros ──── */}
      <section>
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          {/* Buscar */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar producto…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Selector de template */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-500">
              Estilo
            </label>
            <select
              value={selectedTemplate}
              onChange={e =>
                setSelectedTemplate(e.target.value as TemplateType | "all")
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Todos</option>
              {templateList.map(t => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Solo con imagen */}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showOnlyWithImage}
              onChange={e => setShowOnlyWithImage(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Con foto
          </label>
        </div>
      </section>

      {/* ──── Galería Completa ──── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          📸 Todos los Diseños ({filteredProducts.length} productos ×{" "}
          {templatesToShow.length} plantillas)
        </h2>

        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-300 py-16 text-center text-gray-500">
            <p className="text-lg font-medium">No hay productos disponibles</p>
            <p className="mt-1 text-sm">
              Agrega productos a tu inventario para generar publicidad.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map(product =>
              templatesToShow.map(tpl => (
                <AdCard
                  key={`${product._id}-${tpl}`}
                  product={product}
                  template={tpl}
                  logoUrl={logoUrl}
                  businessName={businessName}
                />
              ))
            )}
          </div>
        )}

        {filteredProducts.length > visibleProducts.length && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setVisibleCount(c => c + 24)}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Cargar mas
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
