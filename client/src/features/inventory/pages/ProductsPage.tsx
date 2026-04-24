import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Box,
  Tag,
  AlertCircle,
  CheckCircle2,
  Package,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  LoadingSpinner,
} from "../../../shared/components/ui";
import {
  buildCacheKey,
  readSessionCache,
  writeSessionCache,
} from "../../../utils/requestCache";
import { categoryService, productService } from "../services/inventory.service";
import type { Category, Product } from "../types/product.types";

const PRODUCTS_CACHE_TTL_MS = 60 * 1000;
const CATEGORIES_CACHE_TTL_MS = 5 * 60 * 1000;

const formatCurrency = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);
};

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const firstSegment = location.pathname.split("/").filter(Boolean)[0] || "";
  const areaBase = firstSegment ? `/${firstSegment}` : "/admin";
  const addProductRoute = `${areaBase}/add-product`;
  const productDetailRoute = (productId: string) =>
    `${areaBase}/products/${productId}`;
  const productEditRoute = (productId: string) =>
    `${areaBase}/products/${productId}/edit`;
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [stockFilter, setStockFilter] = useState<string>("");

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, categoryFilter, sortBy, sortOrder, stockFilter]);

  const loadData = async () => {
    try {
      const filters: Record<string, string | boolean | number> = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
        excludePromotions: true,
      };
      if (categoryFilter) filters.category = categoryFilter;
      if (search) filters.search = search;
      if (stockFilter === "inStock") filters.inStock = true;
      if (stockFilter === "outOfStock") filters.inStock = false;

      const productsKey = buildCacheKey("products:list", filters);
      const categoriesKey = buildCacheKey("categories:list");

      const cachedProducts = readSessionCache<{
        data: Product[];
        pagination?: typeof pagination;
      }>(productsKey, PRODUCTS_CACHE_TTL_MS);
      const cachedCategories = readSessionCache<Category[]>(
        categoriesKey,
        CATEGORIES_CACHE_TTL_MS
      );

      if (cachedCategories?.length) setCategories(cachedCategories);
      if (cachedProducts?.data?.length) {
        setProducts(cachedProducts.data);
        if (cachedProducts.pagination) setPagination(cachedProducts.pagination);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const [productsData, categoriesData] = await Promise.all([
        productService.getAll(filters),
        cachedCategories?.length
          ? Promise.resolve(cachedCategories)
          : categoryService.getAll(),
      ]);

      setProducts(productsData.data);
      if (productsData.pagination) {
        setPagination(productsData.pagination);
      }
      setCategories(categoriesData);

      writeSessionCache(productsKey, {
        data: productsData.data,
        pagination: productsData.pagination,
      });
      writeSessionCache(categoriesKey, categoriesData);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Error al cargar los datos";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar el producto "${name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await productService.delete(id);
      await loadData();
    } catch (err) {
      const response = (
        err as { response?: { status?: number; data?: { message?: string } } }
      )?.response;

      // Si el producto no existe (404), es un "fantasma" - removerlo del estado local
      if (response?.status === 404) {
        setProducts(prev => prev.filter(p => p._id !== id));
        // Limpiar cache de productos para evitar ghost entries
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith("products:")) {
            sessionStorage.removeItem(key);
          }
        });
        setError("");
        return;
      }

      const message =
        response?.data?.message || "No se pudo eliminar el producto";
      setError(message);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesSearch;
  });

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStockBadge = (product: Product) => {
    const stock = product.totalStock || 0;
    const lowStock = product.lowStockAlert || 5;

    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-500/20">
          <AlertCircle size={12} />
          Sin stock
        </span>
      );
    }
    if (stock <= lowStock) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
          <AlertCircle size={12} />
          Stock bajo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 size={12} />
        En stock
      </span>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gray-900/40 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-pink-600/10 blur-3xl" />
        
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-600/20 p-2.5 text-purple-400 ring-1 ring-purple-500/30">
                <Package size={24} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Catálogo
              </h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-gray-400 sm:text-base">
              Gestiona el inventario central de Essence. Monitorea existencias, ajusta precios y mantén tu catálogo actualizado.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(addProductRoute)}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-purple-600 to-pink-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/40"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
            <Plus size={20} className="transition-transform group-hover:rotate-90" />
            Nuevo producto
          </motion.button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-purple-400" />
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter") {
                setPagination(prev => ({ ...prev, page: 1 }));
                loadData();
              }
            }}
            placeholder="Buscar productos..."
            className="w-full rounded-xl border border-white/10 bg-gray-900/50 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-purple-500/50 focus:bg-gray-900/80 focus:outline-none focus:ring-4 focus:ring-purple-500/10"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={event => {
              setCategoryFilter(event.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full appearance-none rounded-xl border border-white/10 bg-gray-900/50 pl-10 pr-10 py-3 text-sm text-white backdrop-blur-sm focus:border-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-500/10"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={event => {
            const [field, order] = event.target.value.split("-");
            setSortBy(field);
            setSortOrder(order as "asc" | "desc");
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="w-full rounded-xl border border-white/10 bg-gray-900/50 px-4 py-3 text-sm text-white backdrop-blur-sm focus:border-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-500/10"
        >
          <option value="createdAt-desc">Más recientes</option>
          <option value="createdAt-asc">Más antiguos</option>
          <option value="clientPrice-desc">Mayor precio</option>
          <option value="clientPrice-asc">Menor precio</option>
          <option value="totalStock-desc">Mayor stock</option>
          <option value="totalStock-asc">Menor stock</option>
        </select>

        <select
          value={stockFilter}
          onChange={event => {
            setStockFilter(event.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="w-full rounded-xl border border-white/10 bg-gray-900/50 px-4 py-3 text-sm text-white backdrop-blur-sm focus:border-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-500/10"
        >
          <option value="">Todo el stock</option>
          <option value="inStock">Con stock</option>
          <option value="outOfStock">Sin stock</option>
        </select>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/5 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Resultados:</span>
            <span className="text-sm font-bold text-white">{pagination.total}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-sm text-gray-500">Stock Total:</span>
            <span className="text-sm font-bold text-emerald-400">
              {filteredProducts.reduce((sum, p) => sum + (p.totalStock || 0), 0)}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setSearch(""); setCategoryFilter(""); setSortBy("createdAt"); 
            setSortOrder("desc"); setStockFilter(""); setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="text-xs font-semibold text-gray-400 transition hover:text-white"
        >
          Limpiar filtros
        </button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          <AlertCircle size={16} />
          {error}
        </motion.div>
      )}

      {loading ? (
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 animate-pulse">Sincronizando catálogo...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
          <Box size={48} className="mb-4 text-gray-600" />
          <p className="text-lg font-medium text-gray-400">No hay productos que coincidan</p>
          <p className="text-sm text-gray-500">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <>
          {/* Mobile Grid View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, idx) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(productDetailRoute(product._id))}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900/40 p-4 active:scale-[0.98] transition-all"
                >
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0">
                      {product.image?.url ? (
                        <img
                          src={product.image.url}
                          alt={product.name}
                          className="h-full w-full rounded-xl object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-800 text-gray-600">
                          <Package size={24} />
                        </div>
                      )}
                      <div className="absolute -right-1 -top-1">
                        {getStockBadge(product)}
                      </div>
                    </div>
                    
                    <div className="flex flex-1 flex-col justify-center min-w-0">
                      <h3 className="truncate font-bold text-white">{product.name}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <Tag size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-400 truncate">
                          {typeof product.category === "string" ? product.category : product.category.name}
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-lg font-black text-purple-400">
                          {formatCurrency(product.clientPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(productEditRoute(product._id)); }}
                      className="flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
                    >
                      <Edit2 size={14} />
                      Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(product._id, product.name); }}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop Table View */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-gray-900/20 backdrop-blur-md md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Producto</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Categoría</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Precios</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {filteredProducts.map((product, idx) => (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => navigate(productDetailRoute(product._id))}
                        className="group cursor-pointer transition-colors hover:bg-white/2"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all">
                              {product.image?.url ? (
                                <img src={product.image.url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-600">
                                  <Package size={20} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white group-hover:text-purple-400 transition-colors">{product.name}</p>
                              <p className="truncate text-xs text-gray-500 max-w-[200px]">{product.description || 'Sin descripción'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800/50 px-2.5 py-1 text-xs font-medium text-gray-300 ring-1 ring-inset ring-white/5">
                            <Tag size={12} className="text-gray-500" />
                            {typeof product.category === "string" ? product.category : product.category.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-black text-white">{formatCurrency(product.clientPrice)}</span>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="text-gray-500">Dist:</span>
                              <span className="font-bold text-cyan-400">{formatCurrency(product.employeePrice)}</span>
                              <span className={`px-1 rounded-sm ${product.employeePriceMode === 'manual' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-500'}`}>
                                {product.employeePriceMode === 'manual' ? 'M' : 'A'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            {getStockBadge(product)}
                            <span className="text-[10px] text-gray-500 ml-1">Total: {product.totalStock}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(productEditRoute(product._id)); }}
                              className="p-2 text-gray-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(product._id, product.name); }}
                              className="p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                            <ChevronRight size={18} className="text-gray-700" />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/5 bg-gray-900/40 px-6 py-4 backdrop-blur-sm sm:flex-row">
              <span className="text-sm text-gray-500">
                Mostrando <span className="text-white font-bold">{filteredProducts.length}</span> de <span className="text-white font-bold">{pagination.total}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5"
                >
                  Anterior
                </button>
                <div className="flex items-center px-4 text-sm font-medium text-gray-400">
                  {pagination.page} / {pagination.pages}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasMore}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
