/**
 * Common Types (Expense, IssueReport, DefectiveProduct)
 * Feature-Based Architecture
 */

export interface Expense {
  _id: string;
  type: string;
  category?: string;
  amount: number;
  description?: string;
  expenseDate: string;
  createdBy?: unknown | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IssueReport {
  _id: string;
  message: string;
  stackTrace?: string;
  logs: string[];
  clientContext?: {
    url?: string;
    userAgent?: string;
    appVersion?: string;
    businessId?: string | null;
  };
  screenshotUrl?: string;
  screenshotPublicId?: string;
  status: "open" | "reviewing" | "closed";
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface DefectiveProduct {
  _id: string;
  distributor?: { _id: string; name: string; email?: string } | string | null;
  branch?: { _id: string; name: string } | string | null;
  product:
    | { _id: string; name: string; image?: { url: string; publicId?: string } }
    | string
    | null;
  quantity: number;
  reason: string;
  images?: Array<{ url: string; publicId: string }>;
  hasWarranty?: boolean;
  warrantyStatus?: "pending" | "approved" | "rejected" | "not_applicable";
  lossAmount?: number;
  stockRestored?: boolean;
  stockRestoredAt?: string;
  status: "pendiente" | "confirmado" | "rechazado";
  reportDate: string;
  confirmedAt?: string;
  confirmedBy?: unknown | string;
  adminNotes?: string;
  saleGroupId?: string;
  origin?: "direct" | "order";
  createdAt?: string;
  updatedAt?: string;
}
