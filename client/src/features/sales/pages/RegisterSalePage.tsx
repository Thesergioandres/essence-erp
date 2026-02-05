/**
 * Admin Register Sale Page - Full Bulk Order System
 * Complete order management with location context, advanced cart, financial logic,
 * warranty management, and customer integration
 */

import { CheckCircle, FileText, RefreshCcw, ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "../../../hooks/useSession";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { branchService } from "../../branches/services/branch.service";
import { businessService } from "../../business/services/business.service";
import type { Branch } from "../../business/types/business.types";
import { distributorService } from "../../distributors/services/distributor.service";
import { productsService } from "../../inventory/api/products.service";
import type { Product } from "../../inventory/types/product.types";
import {
  CustomerSelector,
  FinancialPanel,
  InventoryGrid,
  LocationSelector,
  OrderCart,
  OrderSummary,
  WarrantySection,
} from "../components/admin-order";
import { initialOrderState, orderReducer } from "../reducers/orderReducer";
import {
  defectiveProductService,
  saleService,
} from "../services/sales.service";
import type {
  AdminOrderPayload,
  ProductWithStock,
} from "../types/admin-order.types";

export default function RegisterSalePage() {
  const { user, loading: userLoading } = useSession(); // Get user from session
  const isDistributor = user?.role === "distribuidor";

  // Debug: Ver qué rol tiene el usuario
  console.log("👤 [RegisterSalePage] User:", user);
  console.log("👤 [RegisterSalePage] User role:", user?.role);
  console.log("👤 [RegisterSalePage] isDistributor:", isDistributor);

  // State: Order managed by reducer
  const [order, dispatch] = useReducer(orderReducer, {
    ...initialOrderState,
    locationType: isDistributor ? "distributor" : "warehouse", // Default start
    locationName: isDistributor ? "Mi Inventario" : "Bodega Principal",
  });

  // State: Data sources
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [branchStock, setBranchStock] = useState<Map<string, number>>(
    new Map()
  );
  const [distributorHasStock, setDistributorHasStock] = useState<boolean>(true);

  // State: Loading/Error/Success
  const [dataLoading, setDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saleResult, setSaleResult] = useState<{
    success: boolean;
    saleGroupId: string;
    totalAmount: number;
    totalItems: number;
  } | null>(null);

  // Initialize ONLY ONCE
  /* Removed the useEffect that forces location reset on mount to avoid overriding user selection */

  // Update location when user loads (fix timing issue)
  useEffect(() => {
    if (user && isDistributor) {
      dispatch({
        type: "SET_LOCATION",
        locationType: "distributor",
        locationId: "",
        locationName: "Mi Inventario",
      });
    }
  }, [user, isDistributor]);

  // ==================== DATA FETCHING ====================
  useEffect(() => {
    // Don't fetch until user session is loaded
    if (userLoading) {
      console.log("⏳ Waiting for user to load...");
      return;
    }

    const fetchData = async () => {
      setDataLoading(true);
      try {
        if (isDistributor) {
          // 1. Fetch Distributor Inventory (Personal Stock)
          // 2. Fetch Allowed Branches (Company Stock)
          console.log("🔍 Fetching Distributor Data...");
          const [distProductsRes, membershipsRes, allBranches] =
            await Promise.all([
              distributorService.getProducts(),
              businessService.getMyMemberships(),
              branchService.getAll(),
            ]);
          console.log("✅ Distributor Products Res:", distProductsRes);

          const activeMembership = membershipsRes.activeMembership;
          const allowedBranchIds = activeMembership?.allowedBranches || [];

          const distributorBranches = allBranches.filter(
            b => allowedBranchIds.includes(b._id) && b.active !== false
          );
          setBranches(distributorBranches);

          const allProducts = await productsService.getProducts();
          const distStockMap = new Map<string, number>();
          distProductsRes.products.forEach((item: any) => {
            if (item.product && item.product._id) {
              distStockMap.set(String(item.product._id), item.quantity);
            }
          });
          console.log("📦 Map Size:", distStockMap.size);
          console.log("📦 Map Entries:", Array.from(distStockMap.entries()));

          // Verificar si el distribuidor tiene stock
          const hasStock =
            distStockMap.size > 0 &&
            Array.from(distStockMap.values()).some(qty => qty > 0);
          setDistributorHasStock(hasStock);

          // Auto-seleccionar: si tiene stock -> "Mi Inventario", si no -> primera sede
          if (hasStock) {
            console.log(
              "📍 Distribuidor con stock, seleccionando Mi Inventario"
            );
            dispatch({
              type: "SET_LOCATION",
              locationType: "distributor",
              locationId: user?._id || "",
              locationName: "Mi Inventario",
            });
          } else if (distributorBranches.length > 0) {
            const firstBranch = distributorBranches[0];
            console.log(
              "📍 Distribuidor sin stock, seleccionando sede:",
              firstBranch.name
            );
            dispatch({
              type: "SET_LOCATION",
              locationType: "branch",
              locationId: firstBranch._id,
              locationName: firstBranch.name,
            });
          }

          const mappedProducts: ProductWithStock[] = (
            allProducts as Product[]
          ).map(p => ({
            _id: p._id,
            name: p.name,
            purchasePrice: p.distributorPrice || p.purchasePrice || 0, // Profit base with fallback
            clientPrice: p.clientPrice ?? p.suggestedPrice ?? 0,
            distributorPrice: p.distributorPrice ?? 0,
            warehouseStock: p.warehouseStock ?? 0, // HYBRID MODEL: Distributors CAN see warehouse stock for dropshipping
            totalStock: p.totalStock ?? 0,
            distributorStock: distStockMap.get(p._id) || 0,
            category: p.category,
            image: p.image ?? undefined,
          }));

          setProducts(mappedProducts);
        } else {
          // Fetch Admin Data
          const [branchesData, productsData] = await Promise.all([
            branchService.getAll(),
            productsService.getProducts(),
          ]);
          setBranches(branchesData);

          const productsWithStock: ProductWithStock[] = (
            productsData as Product[]
          ).map(p => ({
            _id: p._id,
            name: p.name,
            purchasePrice: p.purchasePrice,
            clientPrice: p.clientPrice ?? p.suggestedPrice ?? 0,
            distributorPrice: p.distributorPrice,
            warehouseStock: p.warehouseStock ?? 0,
            totalStock: p.totalStock ?? 0,
            category: p.category,
            image: p.image ?? undefined,
          }));
          setProducts(productsWithStock);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [userLoading, isDistributor]);

  // Fetch branch stock when branch location is selected
  useEffect(() => {
    const fetchBranchStock = async () => {
      if (order.locationType !== "branch" || !order.locationId) return;

      try {
        console.log("📦 Fetching branch stock for:", order.locationId);
        const branchStockData = await branchService.getBranchStock(
          order.locationId
        );

        const stockMap = new Map<string, number>();
        branchStockData.stock.forEach(item => {
          if (item.product?._id) {
            stockMap.set(String(item.product._id), item.quantity || 0);
          }
        });

        console.log("📦 Branch stock map size:", stockMap.size);
        setBranchStock(stockMap);
      } catch (error) {
        console.error("Error fetching branch stock:", error);
      }
    };

    fetchBranchStock();
  }, [order.locationType, order.locationId]);

  // Products with correct stock based on location
  const productsWithLocationStock = useMemo(() => {
    return products.map(p => {
      let stock = 0;
      // Warehouse stock (Admin OR Distributor in dropshipping mode)
      if (order.locationType === "warehouse") stock = p.warehouseStock ?? 0;
      // Branch stock (specific branch selected)
      else if (order.locationType === "branch")
        stock = branchStock.get(p._id) ?? 0;
      // Distributor's personal inventory
      else if (order.locationType === "distributor")
        stock = p.distributorStock ?? 0;

      return {
        ...p,
        branchStock: order.locationType === "branch" ? stock : undefined,
        distributorStock:
          order.locationType === "distributor" ? stock : undefined,
        // HYBRID MODEL: Distributors CAN see warehouse stock for dropshipping
        warehouseStock:
          order.locationType === "warehouse" ? stock : p.warehouseStock,
      };
    });
  }, [products, order.locationType, branchStock, isDistributor]);

  // ==================== HANDLERS ====================
  const handleLocationChange = useCallback(
    (
      type: "warehouse" | "branch" | "distributor",
      id: string,
      name: string
    ) => {
      // Allow Distributors to switch between "distributor" (My Inventory) and "branch" (Allowed Warehouse)
      // They cannot select "warehouse" (Main Warehouse) usually, unless its a branch?
      // LocationSelector sends "warehouse" type for the main button.
      // If distributor tries to click "Bodega" button -> blocked?
      // We will handle this in UI, but here we allow the change.

      dispatch({
        type: "SET_LOCATION",
        locationType: type as any,
        locationId: id,
        locationName: name,
      });
    },
    []
  );

  const handleAddProduct = useCallback(
    (product: ProductWithStock, quantity: number) => {
      let stock = 0;
      if (order.locationType === "warehouse") stock = product.warehouseStock;
      else if (order.locationType === "branch")
        stock = product.branchStock ?? 0;
      else if (order.locationType === "distributor")
        stock = product.distributorStock ?? 0;

      // ... rest of logic
      dispatch({
        type: "ADD_ITEM",
        item: {
          productId: product._id,
          productName: product.name,
          quantity,
          unitPrice: product.clientPrice,
          purchasePrice: product.purchasePrice,
          availableStock: stock,
          category:
            typeof product.category === "object"
              ? product.category?.name
              : product.category,
          image: product.image,
        },
      });
    },
    [order.locationType]
  );

  const handleUpdateItem = useCallback(
    (itemId: string, updates: { quantity?: number; unitPrice?: number }) => {
      dispatch({ type: "UPDATE_ITEM", itemId, updates });
    },
    []
  );

  const handleRemoveItem = useCallback((itemId: string) => {
    dispatch({ type: "REMOVE_ITEM", itemId });
  }, []);

  const handleConfirmOrder = useCallback(async () => {
    if (order.items.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Generate unique sale group ID
      const saleGroupId = uuidv4();

      // Build payload for sale items
      const payload: AdminOrderPayload = {
        items: order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          salePrice: item.unitPrice,
        })),
        paymentMethodId: order.paymentMethod,
        paymentType: order.paymentMethod,
        notes: order.notes || undefined,
        discount:
          order.discount ||
          (order.subtotal * order.discountPercent) / 100 ||
          undefined,
        saleGroupId,
      };

      // Add branch ID if selling from branch
      if (order.locationType === "branch" && order.locationId) {
        payload.branchId = order.locationId;
      }

      // Add customer if selected
      if (order.customerId) {
        payload.customerId = order.customerId;
      }

      // Add delivery info (only shipping cost, not deliveryMethodId as it's a string)
      if (order.deliveryMethod === "delivery") {
        payload.shippingCost = order.shippingCost;
        // Don't send deliveryMethodId as "delivery" string - backend expects ObjectId or nothing
      }

      // Add credit details
      if (order.paymentMethod === "credit") {
        payload.creditDueDate = order.creditDueDate || undefined;
        payload.initialPayment = order.initialPayment || undefined;
      }

      // Add additional costs
      if (order.additionalCosts.length > 0) {
        payload.additionalCosts = order.additionalCosts.map(c => ({
          type: c.type || "other",
          description: c.description,
          amount: c.amount,
        }));
      }

      // Process all sale items in a single batch request (V2 API)
      let totalProcessedItems = 0;
      let totalAmount = 0;

      try {
        const result = await saleService.registerBulk({
          items: payload.items,
          branchId: payload.branchId,
          paymentMethodId: payload.paymentMethodId,
          paymentType: payload.paymentType,
          customerId: payload.customerId,
          notes: payload.notes,
          discount: payload.discount,
          saleGroupId: saleGroupId,
          creditDueDate: payload.creditDueDate,
          initialPayment: payload.initialPayment,
          // Don't send deliveryMethodId - not supported as string
          shippingCost: payload.shippingCost,
          additionalCosts: payload.additionalCosts,
        });

        totalProcessedItems = payload.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        totalAmount = payload.items.reduce(
          (sum, item) => sum + item.salePrice * item.quantity,
          0
        );
      } catch (err: any) {
        console.error(`Error processing order:`, err);
        throw new Error(
          err.response?.data?.message || "Error al procesar el pedido"
        );
      }

      // Process warranty items as defective products
      for (const warranty of order.warranties) {
        try {
          await defectiveProductService.reportAdmin({
            productId: warranty.productId,
            quantity: warranty.quantity,
            reason:
              warranty.reason ||
              `${warranty.type === "supplier_replacement" ? "Reemplazo proveedor" : "Pérdida total"} - Orden ${saleGroupId}`,
          });
        } catch (err) {
          console.error(
            `Error processing warranty for ${warranty.productName}:`,
            err
          );
          // Don't fail the whole order for warranty errors
        }
      }

      // Success!
      setSaleResult({
        success: true,
        saleGroupId,
        totalAmount,
        totalItems: totalProcessedItems,
      });
    } catch (err: any) {
      console.error("Error submitting order:", err);
      setSubmitError(err.message || "Error al procesar el pedido");
    } finally {
      setIsSubmitting(false);
    }
  }, [order]);

  const handleNewOrder = useCallback(() => {
    dispatch({ type: "CLEAR_ORDER" });
    setSaleResult(null);
    setSubmitError(null);
  }, []);

  // ==================== LOADING STATE ====================
  if (dataLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070910]">
        <LoadingSpinner />
      </div>
    );
  }

  // ==================== SUCCESS STATE ====================
  if (saleResult?.success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#070910] p-6 text-white">
        <div className="mb-6 rounded-full bg-green-500/10 p-6">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>
        <h1 className="mb-2 text-4xl font-bold">¡Pedido Confirmado!</h1>
        <p className="mb-8 text-gray-400">
          La transacción ha sido procesada exitosamente.
        </p>

        <div className="w-full max-w-md space-y-4 rounded-2xl border border-gray-700 bg-gray-800/50 p-6">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Pagado:</span>
            <span className="text-2xl font-bold text-white">
              ${saleResult.totalAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Items Procesados:</span>
            <span className="text-white">{saleResult.totalItems}</span>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <p className="text-center text-xs text-gray-500">
              ID del Pedido: {saleResult.saleGroupId}
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleNewOrder}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-8 py-4 font-bold text-white transition hover:bg-purple-700"
          >
            <RefreshCcw className="h-5 w-5" />
            Nuevo Pedido
          </button>
          <button
            onClick={() => {
              // Could navigate to sales history or print receipt
              window.print();
            }}
            className="flex items-center gap-2 rounded-xl border border-gray-600 px-8 py-4 font-medium text-gray-300 transition hover:bg-gray-800"
          >
            <FileText className="h-5 w-5" />
            Imprimir
          </button>
        </div>
      </div>
    );
  }

  // ==================== MAIN VIEW ====================
  return (
    <div className="min-h-screen bg-[#070910] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
            <ShoppingBag className="h-7 w-7 text-purple-400 sm:h-8 sm:w-8" />
            Registrar Venta
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {isDistributor ? "Panel de Distribuidor" : "Panel de Administrador"}
          </p>
        </div>

        {/* Error Alert */}
        {submitError && (
          <div className="mb-4 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-300">
            <p className="font-medium">Error al procesar el pedido</p>
            <p className="text-sm opacity-80">{submitError}</p>
          </div>
        )}

        {/* NEW LAYOUT: Two Main Columns */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ============ LEFT COLUMN: Products & Cart ============ */}
          <div className="space-y-4">
            {/* Location Selector - Compact */}
            <LocationSelector
              locationType={order.locationType}
              locationId={order.locationId}
              branches={branches}
              onLocationChange={handleLocationChange}
            />

            {/* Inventory Grid - Main Focus */}
            <InventoryGrid
              products={productsWithLocationStock}
              locationType={order.locationType}
              loading={dataLoading}
              onAddProduct={handleAddProduct}
            />

            {/* Cart - Below Inventory */}
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                🛒 Carrito
                {order.items.length > 0 && (
                  <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-sm text-purple-300">
                    {order.items.length}
                  </span>
                )}
              </h3>
              <OrderCart
                items={order.items}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
              />
            </div>
          </div>

          {/* ============ RIGHT COLUMN: Options & Summary ============ */}
          <div className="space-y-4">
            {/* Customer Selector */}
            <CustomerSelector
              customerId={order.customerId}
              customerName={order.customerName}
              onSelectCustomer={(id, name) =>
                dispatch({
                  type: "SET_CUSTOMER",
                  customerId: id,
                  customerName: name,
                })
              }
            />

            {/* Financial Panel - Compact */}
            <FinancialPanel
              paymentMethod={order.paymentMethod}
              deliveryMethod={order.deliveryMethod}
              shippingCost={order.shippingCost}
              discount={order.discount}
              discountPercent={order.discountPercent}
              additionalCosts={order.additionalCosts}
              creditDueDate={order.creditDueDate}
              initialPayment={order.initialPayment}
              totalPayable={order.totalPayable}
              onPaymentMethodChange={method =>
                dispatch({ type: "SET_PAYMENT_METHOD", method })
              }
              onDeliveryMethodChange={method =>
                dispatch({ type: "SET_DELIVERY_METHOD", method })
              }
              onShippingCostChange={cost =>
                dispatch({ type: "SET_SHIPPING_COST", cost })
              }
              onDiscountChange={amount =>
                dispatch({ type: "SET_DISCOUNT", amount })
              }
              onDiscountPercentChange={percent =>
                dispatch({ type: "SET_DISCOUNT_PERCENT", percent })
              }
              onAddCost={cost =>
                dispatch({ type: "ADD_ADDITIONAL_COST", cost })
              }
              onRemoveCost={costId =>
                dispatch({ type: "REMOVE_ADDITIONAL_COST", costId })
              }
              onCreditDueDateChange={date =>
                dispatch({ type: "SET_CREDIT_DUE_DATE", date })
              }
              onInitialPaymentChange={amount =>
                dispatch({ type: "SET_INITIAL_PAYMENT", amount })
              }
            />

            {/* Notes - Compact */}
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4">
              <h4 className="mb-2 text-sm font-medium text-gray-400">
                📝 Notas
              </h4>
              <textarea
                value={order.notes}
                onChange={e =>
                  dispatch({ type: "SET_NOTES", notes: e.target.value })
                }
                className="h-20 w-full rounded-lg border border-gray-600 bg-gray-900/50 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                placeholder="Notas opcionales..."
              />
            </div>

            {/* Warranty Section - Collapsible */}
            <WarrantySection
              warranties={order.warranties}
              products={products}
              onAddWarranty={warranty =>
                dispatch({ type: "ADD_WARRANTY", warranty })
              }
              onRemoveWarranty={warrantyId =>
                dispatch({ type: "REMOVE_WARRANTY", warrantyId })
              }
            />

            {/* Order Summary - Sticky at bottom */}
            <div className="lg:sticky lg:top-4">
              <OrderSummary
                order={order}
                isSubmitting={isSubmitting}
                onConfirm={handleConfirmOrder}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
