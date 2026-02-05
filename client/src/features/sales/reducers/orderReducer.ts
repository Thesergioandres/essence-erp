/**
 * Order Reducer for Admin Bulk Order System
 * Handles complex state management with automatic recalculation
 */

import { v4 as uuidv4 } from "uuid";
import type {
  AdditionalCost,
  OrderAction,
  OrderItem,
  OrderState,
  WarrantyItem,
} from "../types/admin-order.types";

// ==================== INITIAL STATE ====================
export const initialOrderState: OrderState = {
  // Location
  locationType: "warehouse",
  locationId: null,
  locationName: "Bodega Principal",

  // Items
  items: [],
  warranties: [],

  // Customer
  customerId: null,
  customerName: null,

  // Financial
  paymentMethod: "cash",
  deliveryMethod: "pickup",
  shippingCost: 0,
  discount: 0,
  discountPercent: 0,
  additionalCosts: [],

  // Credit
  creditDueDate: null,
  initialPayment: 0,

  // Notes
  notes: "",

  // Calculated
  subtotal: 0,
  totalCosts: 0,
  grossProfit: 0,
  netProfit: 0,
  totalPayable: 0,
};

// ==================== CALCULATION HELPERS ====================
const calculateItemMetrics = (
  item: Omit<OrderItem, "subtotal" | "grossProfit">
): OrderItem => {
  const subtotal = item.quantity * item.unitPrice;
  const purchasePrice = item.purchasePrice || 0; // Safeguard against undefined/NaN
  const grossProfit = subtotal - item.quantity * purchasePrice;
  return { ...item, subtotal, grossProfit } as OrderItem;
};

const recalculateTotals = (state: OrderState): OrderState => {
  // Subtotal from items
  const subtotal = state.items.reduce((sum, item) => sum + item.subtotal, 0);

  // Total additional costs
  const totalAdditionalCosts = state.additionalCosts.reduce(
    (sum, cost) => sum + cost.amount,
    0
  );

  // Gross profit from items
  const itemsGrossProfit = state.items.reduce(
    (sum, item) => sum + item.grossProfit,
    0
  );

  // Calculate discount (use amount or percentage)
  let discountAmount = state.discount;
  if (state.discountPercent > 0 && state.discount === 0) {
    discountAmount = (subtotal * state.discountPercent) / 100;
  }

  // Total costs = shipping + additional costs (for display only)
  const totalCosts = state.shippingCost + totalAdditionalCosts;

  // Net profit calculation:
  // - Gross profit from items (sale price - purchase price)
  // - Additional costs reduce profit (vendor pays these)
  // - Discount reduces profit (vendor gives up this money)
  // - Shipping does NOT reduce profit (customer pays this)
  const netProfit = itemsGrossProfit - totalAdditionalCosts - discountAmount;

  // Total payable = subtotal + shipping + additional costs - discount
  const totalPayable =
    subtotal + state.shippingCost + totalAdditionalCosts - discountAmount;

  return {
    ...state,
    subtotal,
    totalCosts,
    grossProfit: itemsGrossProfit,
    netProfit,
    totalPayable: Math.max(0, totalPayable),
  };
};

// ==================== REDUCER ====================
export function orderReducer(
  state: OrderState,
  action: OrderAction
): OrderState {
  let newState: OrderState;

  switch (action.type) {
    case "SET_LOCATION":
      newState = {
        ...state,
        locationType: action.locationType,
        locationId: action.locationId,
        locationName: action.locationName,
        // Clear items when location changes (stock context changes)
        items: [],
        warranties: [],
      };
      break;

    case "ADD_ITEM": {
      const existingIndex = state.items.findIndex(
        i => i.productId === action.item.productId
      );

      if (existingIndex >= 0) {
        // Update existing item quantity
        const updatedItems = state.items.map((item, index) => {
          if (index === existingIndex) {
            const newQty = item.quantity + action.item.quantity;
            return calculateItemMetrics({ ...item, quantity: newQty });
          }
          return item;
        });
        newState = { ...state, items: updatedItems };
      } else {
        // Add new item
        const newItem = calculateItemMetrics({
          ...action.item,
          id: uuidv4(),
        });
        newState = { ...state, items: [...state.items, newItem] };
      }
      break;
    }

    case "UPDATE_ITEM": {
      const updatedItems = state.items.map(item => {
        if (item.id === action.itemId) {
          const updatedItem = { ...item, ...action.updates };
          return calculateItemMetrics(updatedItem);
        }
        return item;
      });
      newState = { ...state, items: updatedItems };
      break;
    }

    case "REMOVE_ITEM":
      newState = {
        ...state,
        items: state.items.filter(item => item.id !== action.itemId),
      };
      break;

    case "ADD_WARRANTY": {
      const newWarranty: WarrantyItem = {
        ...action.warranty,
        id: uuidv4(),
      };
      newState = { ...state, warranties: [...state.warranties, newWarranty] };
      break;
    }

    case "REMOVE_WARRANTY":
      newState = {
        ...state,
        warranties: state.warranties.filter(w => w.id !== action.warrantyId),
      };
      break;

    case "SET_CUSTOMER":
      newState = {
        ...state,
        customerId: action.customerId,
        customerName: action.customerName,
      };
      break;

    case "SET_PAYMENT_METHOD":
      newState = {
        ...state,
        paymentMethod: action.method,
        // Clear credit fields if not credit
        creditDueDate: action.method === "credit" ? state.creditDueDate : null,
        initialPayment: action.method === "credit" ? state.initialPayment : 0,
      };
      break;

    case "SET_DELIVERY_METHOD":
      newState = {
        ...state,
        deliveryMethod: action.method,
        // Clear shipping cost if pickup
        shippingCost: action.method === "pickup" ? 0 : state.shippingCost,
      };
      break;

    case "SET_SHIPPING_COST":
      newState = { ...state, shippingCost: Math.max(0, action.cost) };
      break;

    case "SET_DISCOUNT":
      newState = {
        ...state,
        discount: Math.max(0, action.amount),
        discountPercent: 0,
      };
      break;

    case "SET_DISCOUNT_PERCENT":
      newState = {
        ...state,
        discountPercent: Math.max(0, Math.min(100, action.percent)),
        discount: 0,
      };
      break;

    case "ADD_ADDITIONAL_COST": {
      const newCost: AdditionalCost = {
        ...action.cost,
        id: uuidv4(),
      };
      newState = {
        ...state,
        additionalCosts: [...state.additionalCosts, newCost],
      };
      break;
    }

    case "REMOVE_ADDITIONAL_COST":
      newState = {
        ...state,
        additionalCosts: state.additionalCosts.filter(
          c => c.id !== action.costId
        ),
      };
      break;

    case "SET_CREDIT_DUE_DATE":
      newState = { ...state, creditDueDate: action.date };
      break;

    case "SET_INITIAL_PAYMENT":
      newState = { ...state, initialPayment: Math.max(0, action.amount) };
      break;

    case "SET_NOTES":
      newState = { ...state, notes: action.notes };
      break;

    case "CLEAR_ORDER":
      newState = {
        ...initialOrderState,
        locationType: state.locationType,
        locationId: state.locationId,
        locationName: state.locationName,
      };
      break;

    case "RECALCULATE":
      newState = state;
      break;

    default:
      return state;
  }

  // Always recalculate totals after any action
  return recalculateTotals(newState);
}
