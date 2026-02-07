/**
 * Financial Panel Component
 * Payment methods, delivery options, discounts, and additional costs
 */

import {
  Banknote,
  Calendar,
  CreditCard,
  DollarSign,
  Percent,
  Plus,
  Truck,
  X,
} from "lucide-react";
import { useState } from "react";
import type {
  AdditionalCost,
  DeliveryMethod,
  PaymentMethod,
} from "../../types/admin-order.types";

interface FinancialPanelProps {
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  shippingCost: number;
  discount: number;
  discountPercent: number;
  additionalCosts: AdditionalCost[];
  creditDueDate: string | null;
  initialPayment: number;
  totalPayable: number;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  onShippingCostChange: (cost: number) => void;
  onDiscountChange: (amount: number) => void;
  onDiscountPercentChange: (percent: number) => void;
  onAddCost: (cost: Omit<AdditionalCost, "id">) => void;
  onRemoveCost: (costId: string) => void;
  onCreditDueDateChange: (date: string | null) => void;
  onInitialPaymentChange: (amount: number) => void;
}

export function FinancialPanel({
  paymentMethod,
  deliveryMethod,
  shippingCost,
  discount,
  discountPercent,
  additionalCosts,
  creditDueDate,
  initialPayment,
  totalPayable,
  onPaymentMethodChange,
  onDeliveryMethodChange,
  onShippingCostChange,
  onDiscountChange,
  onDiscountPercentChange,
  onAddCost,
  onRemoveCost,
  onCreditDueDateChange,
  onInitialPaymentChange,
}: FinancialPanelProps) {
  const [showAddCost, setShowAddCost] = useState(false);
  const [newCost, setNewCost] = useState({
    type: "",
    description: "",
    amount: 0,
  });
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">(
    "amount"
  );

  const handleAddCost = () => {
    if (newCost.description && newCost.amount !== 0) {
      onAddCost(newCost);
      setNewCost({ type: "", description: "", amount: 0 });
      setShowAddCost(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment Method */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-400">
          <CreditCard className="h-4 w-4" />
          Método de Pago
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "cash", label: "Efectivo", icon: Banknote },
            { value: "transfer", label: "Transfer", icon: CreditCard },
            { value: "credit", label: "Crédito", icon: Calendar },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onPaymentMethodChange(value as PaymentMethod)}
              className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-sm transition ${
                paymentMethod === value
                  ? "border-purple-500 bg-purple-500/20 text-purple-300"
                  : "border-gray-600 bg-gray-800/50 text-gray-400 hover:border-gray-500"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Credit Details */}
        {paymentMethod === "credit" && (
          <div className="mt-4 space-y-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                value={creditDueDate || ""}
                onChange={e => onCreditDueDateChange(e.target.value || null)}
                className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Pago Inicial (Opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={initialPayment || ""}
                  onChange={e => onInitialPaymentChange(Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/50 py-2 pl-7 pr-3 text-white"
                />
              </div>
              <p className="mt-1 text-xs text-yellow-500/80">
                Deuda restante: $
                {(totalPayable - initialPayment).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delivery Method */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-400">
          <Truck className="h-4 w-4" />
          Entrega
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onDeliveryMethodChange("pickup")}
            className={`rounded-lg border px-4 py-2 text-sm transition ${
              deliveryMethod === "pickup"
                ? "border-green-500 bg-green-500/20 text-green-300"
                : "border-gray-600 bg-gray-800/50 text-gray-400 hover:border-gray-500"
            }`}
          >
            Retiro en Tienda
          </button>
          <button
            type="button"
            onClick={() => onDeliveryMethodChange("delivery")}
            className={`rounded-lg border px-4 py-2 text-sm transition ${
              deliveryMethod === "delivery"
                ? "border-blue-500 bg-blue-500/20 text-blue-300"
                : "border-gray-600 bg-gray-800/50 text-gray-400 hover:border-gray-500"
            }`}
          >
            Envío a Domicilio
          </button>
        </div>

        {/* Shipping Cost */}
        {deliveryMethod === "delivery" && (
          <div className="mt-3">
            <label className="mb-1 block text-xs text-gray-400">
              Costo de Envío
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                value={shippingCost || ""}
                onChange={e => onShippingCostChange(Number(e.target.value))}
                placeholder="0"
                className="w-full rounded-lg border border-gray-600 bg-gray-900/50 py-2 pl-7 pr-3 text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Discount */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-400">
          <Percent className="h-4 w-4" />
          Descuento
        </h4>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDiscountMode("amount")}
            className={`rounded-lg border px-3 py-1.5 text-xs transition ${
              discountMode === "amount"
                ? "border-purple-500 bg-purple-500/20 text-purple-300"
                : "border-gray-600 text-gray-400"
            }`}
          >
            <DollarSign className="inline h-3 w-3" /> Monto
          </button>
          <button
            type="button"
            onClick={() => setDiscountMode("percent")}
            className={`rounded-lg border px-3 py-1.5 text-xs transition ${
              discountMode === "percent"
                ? "border-purple-500 bg-purple-500/20 text-purple-300"
                : "border-gray-600 text-gray-400"
            }`}
          >
            <Percent className="inline h-3 w-3" /> Porcentaje
          </button>
        </div>
        <div className="relative mt-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {discountMode === "amount" ? "$" : "%"}
          </span>
          <input
            type="number"
            value={
              discountMode === "amount" ? discount || "" : discountPercent || ""
            }
            onChange={e =>
              discountMode === "amount"
                ? onDiscountChange(Number(e.target.value))
                : onDiscountPercentChange(Number(e.target.value))
            }
            placeholder="0"
            className="w-full rounded-lg border border-gray-600 bg-gray-900/50 py-2 pl-7 pr-3 text-white"
          />
        </div>
      </div>

      {/* Additional Costs */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-medium text-gray-400">
            <DollarSign className="h-4 w-4" />
            Costos Adicionales
          </h4>
          <button
            type="button"
            onClick={() => setShowAddCost(!showAddCost)}
            className="rounded-lg bg-gray-700 p-1.5 text-gray-300 transition hover:bg-gray-600"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Add Cost Form */}
        {showAddCost && (
          <div className="mb-3 space-y-2 rounded-lg border border-gray-600 bg-gray-900/50 p-3">
            <input
              type="text"
              placeholder="Descripción (ej: Empaque regalo)"
              value={newCost.description}
              onChange={e =>
                setNewCost({ ...newCost, description: e.target.value })
              }
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Monto (negativo descuenta)"
                  value={newCost.amount || ""}
                  onChange={e =>
                    setNewCost({ ...newCost, amount: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 py-2 pl-7 pr-3 text-sm text-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Usa valores negativos para descontar del total.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCost}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white"
              >
                Agregar
              </button>
            </div>
          </div>
        )}

        {/* Cost List */}
        {additionalCosts.length > 0 ? (
          <div className="space-y-2">
            {additionalCosts.map(cost => {
              const isNegative = cost.amount < 0;
              return (
                <div
                  key={cost.id}
                  className="flex items-center justify-between rounded-lg bg-gray-900/50 px-3 py-2"
                >
                  <span className="text-sm text-gray-300">
                    {cost.description}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isNegative ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isNegative ? "-" : "+"}$
                      {Math.abs(cost.amount).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveCost(cost.id)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-xs text-gray-500">
            Sin costos adicionales
          </p>
        )}
      </div>
    </div>
  );
}
