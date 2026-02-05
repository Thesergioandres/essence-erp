/**
 * Settings Types (Payment & Delivery Methods)
 * Feature-Based Architecture
 */

export interface PaymentMethod {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  isDefault?: boolean;
  requiresProof?: boolean;
  instructions?: string;
  isSystem?: boolean;
  isCredit?: boolean;
  requiresConfirmation?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryMethod {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  isDefault?: boolean;
  estimatedTime?: string;
  cost?: number;
  defaultCost?: number;
  hasVariableCost?: boolean;
  requiresAddress?: boolean;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Provider {
  _id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
