/**
 * Customer & Segment Types
 * Feature-Based Architecture
 */

export interface Customer {
  _id: string;
  business: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  segment?: string | Segment | null;
  segments?: string[];
  points: number;
  totalSpend: number;
  totalDebt: number;
  ordersCount: number;
  lastPurchaseAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Segment {
  _id: string;
  name: string;
  key?: string;
  description?: string;
  customerCount?: number;
  createdAt?: string | Date;
  updatedAt?: string;
}
