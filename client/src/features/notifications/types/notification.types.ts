/**
 * Notification Types
 * Feature-Based Architecture
 */

export type NotificationType =
  | "sale"
  | "low_stock"
  | "stock_entry"
  | "promotion"
  | "credit_overdue"
  | "credit_payment"
  | "subscription"
  | "incident"
  | "achievement"
  | "ranking"
  | "system"
  | "reminder";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface NotificationUserRef {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface NotificationViewedBy {
  user: string | NotificationUserRef;
  viewedAt?: string;
}

export interface Notification {
  _id: string;
  business: string;
  sender?: string | NotificationUserRef | null;
  targetEmployees?: Array<string | NotificationUserRef>;
  viewedBy?: NotificationViewedBy[];
  viewed?: boolean;
  user?: string;
  targetRole?: "admin" | "employee" | "all";
  type?: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  read?: boolean;
  readAt?: string;
  link?: string;
  relatedEntity?: {
    type: string;
    id: string;
  };
  data?: Record<string, unknown>;
  expiresAt?: string;
  pushSent: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationListResult {
  notifications: Notification[];
  unreadCount: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SendNotificationPayload {
  title: string;
  message: string;
  sendToAll: boolean;
  targetEmployees: string[];
  priority?: NotificationPriority;
}
