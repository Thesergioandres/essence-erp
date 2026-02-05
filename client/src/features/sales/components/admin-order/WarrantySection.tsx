/**
 * Warranty Section Component
 * Register defective/warranty items within the order flow
 */

import { AlertTriangle, Plus, Shield, Trash2, X } from "lucide-react";
import { useState } from "react";
import type {
  ProductWithStock,
  WarrantyItem,
} from "../../types/admin-order.types";

interface WarrantySectionProps {
  warranties: WarrantyItem[];
  products: ProductWithStock[];
  onAddWarranty: (warranty: Omit<WarrantyItem, "id">) => void;
  onRemoveWarranty: (warrantyId: string) => void;
}

export function WarrantySection({
  warranties,
  products,
  onAddWarranty,
  onRemoveWarranty,
}: WarrantySectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState<"supplier_replacement" | "total_loss">(
    "total_loss"
  );
  const [reason, setReason] = useState("");

  const handleAdd = () => {
    const product = products.find(p => p._id === selectedProduct);
    if (!product) return;

    onAddWarranty({
      productId: product._id,
      productName: product.name,
      quantity,
      type,
      reason,
      availableStock: product.warehouseStock,
    });

    // Reset form
    setSelectedProduct("");
    setQuantity(1);
    setType("total_loss");
    setReason("");
    setIsAdding(false);
  };

  return (
    <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="flex items-center gap-2 font-medium text-orange-400">
          <Shield className="h-5 w-5" />
          Garantías y Pérdidas
        </h4>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className={`rounded-lg p-1.5 transition ${
            isAdding
              ? "bg-red-500/20 text-red-400"
              : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
          }`}
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {/* Add Warranty Form */}
      {isAdding && (
        <div className="mb-4 space-y-3 rounded-lg border border-orange-500/30 bg-gray-900/50 p-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Producto</label>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
            >
              <option value="">Seleccionar producto...</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>
                  {product.name} (Stock: {product.warehouseStock})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Tipo</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as typeof type)}
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
              >
                <option value="supplier_replacement">
                  Reemplazo Proveedor
                </option>
                <option value="total_loss">Pérdida Total</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe el problema..."
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
            />
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedProduct}
            className="w-full rounded-lg bg-orange-600 py-2 font-medium text-white transition hover:bg-orange-700 disabled:opacity-50"
          >
            Registrar Garantía/Pérdida
          </button>
        </div>
      )}

      {/* Warranty List */}
      {warranties.length > 0 ? (
        <div className="space-y-2">
          {warranties.map(warranty => (
            <div
              key={warranty.id}
              className="flex items-center justify-between rounded-lg border border-orange-500/20 bg-gray-900/50 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`h-4 w-4 ${
                      warranty.type === "total_loss"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  />
                  <span className="truncate font-medium text-white">
                    {warranty.productName}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs">
                  <span className="text-gray-400">
                    Cant: {warranty.quantity}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 ${
                      warranty.type === "total_loss"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-yellow-500/20 text-yellow-300"
                    }`}
                  >
                    {warranty.type === "total_loss"
                      ? "Pérdida Total"
                      : "Reemplazo Proveedor"}
                  </span>
                </div>
                {warranty.reason && (
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {warranty.reason}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemoveWarranty(warranty.id)}
                className="ml-2 rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500">
          No hay garantías registradas en esta orden
        </p>
      )}

      {/* Info Note */}
      <div className="mt-3 rounded-lg bg-gray-900/30 p-2 text-xs text-gray-500">
        <strong className="text-orange-400">Nota:</strong> Los productos de
        garantía se descontarán del stock pero NO se añadirán al total de la
        venta.
      </div>
    </div>
  );
}
