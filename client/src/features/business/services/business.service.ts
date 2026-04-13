/**
 * Business Services
 * Extracted from monolithic api/services.ts
 * Handles business management and AI assistant
 */

import api from "../../../api/axios";
import type { User } from "../../auth/types/auth.types";
import type {
  Business,
  BusinessAssistantActionType,
  BusinessAssistantConfig,
  BusinessAssistantRecommendationsResponse,
  BusinessMembership,
} from "../types/business.types";

type MembershipsResponse = {
  memberships: Array<
    BusinessMembership & {
      business: Business;
    }
  >;
  activeMembership?: BusinessMembership & {
    business: Business;
  };
};

const MY_MEMBERSHIPS_CACHE_TTL_MS = 15 * 1000;
const MY_MEMBERSHIPS_RATE_LIMIT_FALLBACK_MS = 20 * 1000;
const MY_MEMBERSHIPS_TRANSIENT_FALLBACK_MS = 5 * 1000;

let myMembershipsInFlight: Promise<MembershipsResponse> | null = null;
let myMembershipsInFlightToken: string | null = null;
let myMembershipsRateLimitedUntil = 0;
let myMembershipsCache: {
  value: MembershipsResponse;
  fetchedAt: number;
  token: string | null;
} | null = null;
let myMembershipsRequestSequence = 0;

const resolveBusinessId = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value === "object") {
    const recordValue = value as { _id?: unknown; id?: unknown };
    if (typeof recordValue._id === "string" && recordValue._id.trim()) {
      return recordValue._id;
    }
    if (typeof recordValue.id === "string" && recordValue.id.trim()) {
      return recordValue.id;
    }
  }

  return null;
};

const normalizeMembershipWithBusiness = (
  business: Business,
  membership?: BusinessMembership
): (BusinessMembership & { business: Business }) | null => {
  if (!membership) {
    return null;
  }

  return {
    ...membership,
    business,
  };
};

const primeMembershipsAfterCreate = (
  business: Business,
  membership?: BusinessMembership
): MembershipsResponse | null => {
  const normalizedMembership = normalizeMembershipWithBusiness(
    business,
    membership
  );

  if (!normalizedMembership) {
    return null;
  }

  let nextMemberships: Array<BusinessMembership & { business: Business }> = [
    normalizedMembership,
  ];

  if (typeof localStorage !== "undefined") {
    const rawUser = localStorage.getItem("user");

    if (rawUser) {
      try {
        const parsedUser = JSON.parse(rawUser) as {
          memberships?: Array<BusinessMembership & { business: Business }>;
        } & Record<string, unknown>;

        const currentMemberships = Array.isArray(parsedUser.memberships)
          ? parsedUser.memberships
          : [];

        const createdBusinessId = resolveBusinessId(business);
        const withoutCreatedBusiness = currentMemberships.filter(existing => {
          const existingBusinessId = resolveBusinessId(existing.business);

          if (createdBusinessId && existingBusinessId) {
            return existingBusinessId !== createdBusinessId;
          }

          return existing._id !== normalizedMembership._id;
        });

        nextMemberships = [normalizedMembership, ...withoutCreatedBusiness];

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...parsedUser,
            memberships: nextMemberships,
          })
        );
      } catch {
        nextMemberships = [normalizedMembership];
      }
    }
  }

  const activeMembership =
    nextMemberships.find(candidate => candidate.status === "active") ||
    nextMemberships[0] ||
    undefined;

  return {
    memberships: nextMemberships,
    activeMembership,
  };
};

const invalidateMembershipCacheState = () => {
  myMembershipsRequestSequence += 1;
  myMembershipsInFlight = null;
  myMembershipsInFlightToken = null;
  myMembershipsRateLimitedUntil = 0;
  myMembershipsCache = null;
};

const isMembershipCacheFresh = (currentToken: string | null) =>
  Boolean(
    myMembershipsCache &&
    myMembershipsCache.token === currentToken &&
    Date.now() - myMembershipsCache.fetchedAt < MY_MEMBERSHIPS_CACHE_TTL_MS
  );

const resolveRetryAfterMs = (rawRetryAfter: unknown): number => {
  if (typeof rawRetryAfter !== "string") {
    return MY_MEMBERSHIPS_RATE_LIMIT_FALLBACK_MS;
  }

  const trimmed = rawRetryAfter.trim();
  if (!trimmed) {
    return MY_MEMBERSHIPS_RATE_LIMIT_FALLBACK_MS;
  }

  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds * 1000;
  }

  const retryAfterDate = Date.parse(trimmed);
  if (Number.isNaN(retryAfterDate)) {
    return MY_MEMBERSHIPS_RATE_LIMIT_FALLBACK_MS;
  }

  return Math.max(retryAfterDate - Date.now(), 1000);
};

const readMembershipsFromStoredSession = (): MembershipsResponse | null => {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const rawUser = localStorage.getItem("user");
  if (!rawUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(rawUser) as {
      memberships?: Array<BusinessMembership & { business: Business }>;
    };

    const memberships = Array.isArray(parsedUser.memberships)
      ? parsedUser.memberships
      : [];

    if (memberships.length === 0) {
      return null;
    }

    const activeMembership = memberships.find(
      membership => membership.status === "active"
    );

    return {
      memberships,
      activeMembership,
    };
  } catch {
    return null;
  }
};

// ==================== BUSINESS SERVICE ====================
export const businessService = {
  async create(data: {
    name: string;
    description?: string;
    type:
      | "retail"
      | "wholesale"
      | "manufacturing"
      | "services"
      | "distribution"
      | "ecommerce";
    size: "micro" | "small" | "medium" | "large";
    industry?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
    currency?: string;
    timezone?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactWhatsapp?: string;
    contactLocation?: string;
    logoUrl?: string;
    logoPublicId?: string;
    logo?: {
      url: string;
      thumbnailUrl?: string;
    };
  }): Promise<{
    message: string;
    business: Business;
    membership?: BusinessMembership;
  }> {
    const response = await api.post("/business", data);
    const payload = response.data as {
      message?: string;
      business?: Business;
      membership?: BusinessMembership;
      data?:
        | Business
        | { business?: Business; membership?: BusinessMembership };
    };

    const dataPayload = payload.data as
      | Business
      | { business?: Business; membership?: BusinessMembership }
      | undefined;

    const business =
      payload.business ||
      (dataPayload as { business?: Business } | undefined)?.business ||
      (dataPayload as Business | undefined);

    if (!business || !business._id) {
      throw new Error("No se pudo resolver el negocio creado");
    }

    const membership =
      payload.membership ||
      (dataPayload as { membership?: BusinessMembership } | undefined)
        ?.membership;

    invalidateMembershipCacheState();

    const primedMemberships = primeMembershipsAfterCreate(business, membership);
    if (primedMemberships) {
      myMembershipsCache = {
        value: primedMemberships,
        fetchedAt: Date.now(),
        token:
          typeof localStorage === "undefined"
            ? null
            : localStorage.getItem("token"),
      };
    }

    return {
      message: payload.message || "Negocio creado",
      business,
      membership,
    };
  },

  async getMyMemberships(): Promise<MembershipsResponse> {
    const currentToken = localStorage.getItem("token");

    if (isMembershipCacheFresh(currentToken) && myMembershipsCache) {
      return myMembershipsCache.value;
    }

    if (myMembershipsInFlight && myMembershipsInFlightToken === currentToken) {
      return myMembershipsInFlight;
    }

    if (myMembershipsInFlightToken !== currentToken) {
      myMembershipsInFlight = null;
      myMembershipsInFlightToken = null;
    }

    const now = Date.now();
    if (now < myMembershipsRateLimitedUntil) {
      const fallback =
        myMembershipsCache?.token === currentToken
          ? myMembershipsCache.value
          : readMembershipsFromStoredSession();
      if (fallback) {
        return fallback;
      }
    }

    const requestSequence = ++myMembershipsRequestSequence;
    myMembershipsInFlightToken = currentToken;
    myMembershipsInFlight = api
      .get<{
        success: boolean;
        data: MembershipsResponse;
      }>("/business/my-memberships")
      .then(response => {
        const activeToken = localStorage.getItem("token");
        const isStaleRequest =
          requestSequence !== myMembershipsRequestSequence ||
          activeToken !== myMembershipsInFlightToken;

        if (isStaleRequest) {
          return readMembershipsFromStoredSession() || response.data.data;
        }

        myMembershipsCache = {
          value: response.data.data,
          fetchedAt: Date.now(),
          token: activeToken,
        };
        myMembershipsRateLimitedUntil = 0;
        return response.data.data;
      })
      .catch(error => {
        const activeToken = localStorage.getItem("token");
        const isStaleRequest =
          requestSequence !== myMembershipsRequestSequence ||
          activeToken !== myMembershipsInFlightToken;

        if (isStaleRequest) {
          const fallback = readMembershipsFromStoredSession();
          if (fallback) {
            return fallback;
          }
          throw error;
        }

        const status = (error as { response?: { status?: number } })?.response
          ?.status;

        if (status === 429) {
          const retryAfterHeader = (
            error as {
              response?: {
                headers?: Record<string, unknown>;
              };
            }
          )?.response?.headers?.["retry-after"];

          myMembershipsRateLimitedUntil =
            Date.now() + resolveRetryAfterMs(retryAfterHeader);

          const fallback =
            myMembershipsCache?.token === currentToken
              ? myMembershipsCache.value
              : readMembershipsFromStoredSession();
          if (fallback) {
            return fallback;
          }
        }

        if (status && status >= 500) {
          myMembershipsRateLimitedUntil =
            Date.now() + MY_MEMBERSHIPS_TRANSIENT_FALLBACK_MS;

          const fallback =
            myMembershipsCache?.token === currentToken
              ? myMembershipsCache.value
              : readMembershipsFromStoredSession();

          console.warn(
            "[Essence Debug] | business.service | getMyMemberships recibio 5xx transitorio",
            {
              status,
              fallbackAvailable: Boolean(fallback),
              fallbackMs: MY_MEMBERSHIPS_TRANSIENT_FALLBACK_MS,
            }
          );

          if (fallback) {
            return fallback;
          }
        }

        throw error;
      })
      .finally(() => {
        if (requestSequence === myMembershipsRequestSequence) {
          myMembershipsInFlight = null;
          myMembershipsInFlightToken = null;
        }
      });

    return myMembershipsInFlight;
  },

  async updateBusiness(
    businessId: string,
    data: Partial<{
      name: string;
      slug: string;
      landingTemplate: "modern" | "minimal" | "bold";
      description: string;
      type: string;
      size: string;
      industry: string;
      address: string;
      phone: string;
      email: string;
      website: string;
      taxId: string;
      currency: string;
      timezone: string;
      contactEmail: string;
      contactPhone: string;
      contactWhatsapp: string;
      contactLocation: string;
      logo: { url: string; thumbnailUrl?: string };
      logoUrl: string;
      logoPublicId: string;
    }>
  ): Promise<{
    message: string;
    business: Business;
  }> {
    const response = await api.put(`/business/${businessId}`, data);
    return response.data;
  },

  async updateBusinessFeatures(
    businessId: string,
    features: Partial<Record<string, boolean>>
  ): Promise<{
    message: string;
    business: Business;
  }> {
    const response = await api.put(`/business/${businessId}/features`, {
      features,
    });
    return response.data;
  },

  async checkSlugAvailability(
    businessId: string,
    slug: string
  ): Promise<{ slug: string; available: boolean }> {
    const response = await api.get(
      `/business/${businessId}/slug-availability`,
      {
        params: { slug },
      }
    );

    const payload = response.data?.data || response.data;
    return {
      slug: payload.slug,
      available: Boolean(payload.available),
    };
  },

  async updatePublicStorefront(
    businessId: string,
    data: {
      slug: string;
      landingTemplate: "modern" | "minimal" | "bold";
    }
  ): Promise<{ message?: string; business: Business }> {
    const response = await api.put(`/business/${businessId}`, data);
    const payload = response.data?.data || response.data;
    return payload;
  },

  async listMembers(businessId: string): Promise<{
    members: Array<{
      _id: string;
      user: User;
      role: "admin" | "employee" | "viewer";
      status: "active" | "invited" | "disabled";
      permissions?: Record<string, Record<string, boolean>>;
      branches?: string[];
      joinedAt?: Date;
      invitedBy?: User;
    }>;
    pendingInvites: Array<{
      email: string;
      role: string;
      expiresAt: Date;
      invitedBy: User;
    }>;
  }> {
    const response = await api.get(`/business/${businessId}/members`);
    // V2 API devuelve { success: true, data: { members, pendingInvites } } O a veces solo data: [members]
    const apiResponse = response.data;

    const rawData = apiResponse.data || apiResponse;

    if (Array.isArray(rawData)) {
      return {
        members: rawData,
        pendingInvites: [],
      };
    }

    return rawData;
  },

  async updateMemberBranches(
    businessId: string,
    membershipId: string,
    branches: string[]
  ): Promise<{
    message: string;
    membership: BusinessMembership;
  }> {
    const response = await api.put(
      `/business/${businessId}/members/${membershipId}`,
      { allowedBranches: branches }
    );
    return response.data;
  },

  async addMember(
    businessId: string,
    data: {
      email?: string;
      userId?: string;
      role: "admin" | "employee" | "viewer";
      permissions?: string[];
      branches?: string[];
    }
  ): Promise<{
    message: string;
    invite?: {
      email: string;
      expiresAt: Date;
    };
    membership?: BusinessMembership;
  }> {
    const response = await api.post(`/business/${businessId}/members`, data);
    return response.data;
  },

  async findMemberCandidate(
    businessId: string,
    email: string
  ): Promise<{
    user: User;
    alreadyMember: boolean;
    membership?: BusinessMembership | null;
  }> {
    const encodedEmail = encodeURIComponent(email.trim());
    const response = await api.get(
      `/business/${businessId}/members/find-user/${encodedEmail}`
    );

    const apiResponse = response.data;
    const payload = apiResponse?.data || apiResponse;

    return {
      user: payload.user,
      alreadyMember: Boolean(payload.alreadyMember),
      membership: payload.membership || null,
    };
  },

  async updateMemberPermissions(
    businessId: string,
    userId: string,
    data: {
      role?: "admin" | "employee" | "viewer";
      permissions?: Record<string, unknown>;
      branches?: string[];
      commissionSettings?: {
        fixedCommissionOnly: boolean;
        customCommissionRate: number | null;
      };
    }
  ): Promise<{
    message: string;
    membership: BusinessMembership;
  }> {
    const response = await api.put(
      `/business/${businessId}/members/${userId}`,
      data
    );
    return response.data;
  },

  async removeMember(
    businessId: string,
    userId: string
  ): Promise<{
    message: string;
  }> {
    const response = await api.delete(
      `/business/${businessId}/members/${userId}`
    );
    return response.data;
  },

  async getBusinessSettings(businessId: string): Promise<{
    settings: {
      lowStockThreshold: number;
      criticalStockThreshold: number;
      defaultPaymentTerms: number;
      defaultWarrantyDays: number;
      enableEmailNotifications: boolean;
      enablePushNotifications: boolean;
      autoConfirmPayments: boolean;
    };
  }> {
    const response = await api.get(`/business/${businessId}/settings`);
    return response.data;
  },

  async updateBusinessSettings(
    businessId: string,
    settings: Partial<{
      lowStockThreshold: number;
      criticalStockThreshold: number;
      defaultPaymentTerms: number;
      defaultWarrantyDays: number;
      enableEmailNotifications: boolean;
      enablePushNotifications: boolean;
      autoConfirmPayments: boolean;
    }>
  ): Promise<{
    message: string;
    settings: Record<string, any>;
  }> {
    const response = await api.put(`/business/${businessId}/settings`, {
      settings,
    });
    return response.data;
  },
};

// ==================== BUSINESS ASSISTANT SERVICE ====================
export const businessAssistantService = {
  normalizeResponse<T>(response: {
    data: T | { success?: boolean; data?: T };
  }) {
    const payload = response?.data as any;
    return payload?.data ?? payload;
  },
  mapLegacyRecommendations(payload: any) {
    if (
      !payload?.recommendations ||
      payload?.recommendations?.[0]?.recommendation
    ) {
      return payload;
    }

    const mapAction = (action: string): BusinessAssistantActionType => {
      switch (action) {
        case "buy_more_inventory":
        case "pause_purchases":
        case "decrease_price":
        case "increase_price":
        case "run_promotion":
        case "review_margin":
        case "clearance":
        case "keep":
          return action;
        case "adjust_price":
          return "increase_price";
        default:
          return "keep";
      }
    };

    const mapCategory = (type: string | undefined) => {
      switch (type) {
        case "inventory":
          return "inventario";
        case "pricing":
          return "precio";
        default:
          return "operacion";
      }
    };

    const mapConfidence = (priority: string | undefined) => {
      switch (priority) {
        case "high":
          return 0.9;
        case "medium":
          return 0.7;
        case "low":
        default:
          return 0.5;
      }
    };

    const horizonDays = payload?.metadata?.horizonDays ?? null;
    const recentDays = payload?.metadata?.recentDays ?? 0;
    const generatedAt =
      payload?.metadata?.generatedAt || new Date().toISOString();

    return {
      generatedAt,
      window: {
        horizonDays,
        recentDays,
        startDate: null,
        endDate: null,
      },
      recommendations: payload.recommendations.map((item: any) => {
        const action = mapAction(item.action);
        return {
          productId: item.productId || item.product?._id || "",
          productName: item.productName || item.title || "Producto",
          categoryId: null,
          categoryName: null,
          abcClass: "C",
          stock: {
            warehouseStock: item.stock ?? 0,
            totalStock: item.stock ?? 0,
            lowStockAlert: 0,
          },
          metrics: {
            recentDays,
            horizonDays,
            recentUnits: 0,
            prevUnits: 0,
            unitsGrowthPct: 0,
            recentRevenue: 0,
            recentProfit: 0,
            recentMarginPct: 0,
            avgDailyUnits: 0,
            daysCover: null,
            recentAvgPrice: 0,
            categoryAvgPrice: 0,
            priceVsCategoryPct: 0,
          },
          recommendation: {
            primary: {
              action,
              title: item.title || action,
              confidence: mapConfidence(item.priority),
              category: mapCategory(item.type),
            },
            actions: [],
            justification: item.reason ? [item.reason] : [],
            score: { impactScore: 0 },
            notes: item.reason,
          },
        };
      }),
      promotions: payload.promotions || [],
    } as BusinessAssistantRecommendationsResponse;
  },
  async getRecommendations(): Promise<{
    recommendations: Array<{
      _id: string;
      type:
        | "restock"
        | "promotion"
        | "pricing"
        | "customer"
        | "inventory"
        | "sales";
      priority: "high" | "medium" | "low";
      title: string;
      description: string;
      data?: Record<string, any>;
      actions?: Array<{
        label: string;
        action: string;
        params?: Record<string, any>;
      }>;
      expiresAt?: Date;
      createdAt: Date;
    }>;
    summary: {
      total: number;
      highPriority: number;
      byType: Record<string, number>;
    };
  }> {
    const response = await api.get("/business-assistant/recommendations");
    const payload = businessAssistantService.normalizeResponse(response);
    return businessAssistantService.mapLegacyRecommendations(payload);
  },

  async getConfig(): Promise<BusinessAssistantConfig> {
    const response = await api.get("/business-assistant/config");
    return businessAssistantService.normalizeResponse(response);
  },

  async updateConfig(
    config: Partial<BusinessAssistantConfig>
  ): Promise<BusinessAssistantConfig> {
    const response = await api.put("/business-assistant/config", config);
    return businessAssistantService.normalizeResponse(response);
  },

  async createRecommendationsJob(): Promise<{
    message: string;
    jobId: string;
  }> {
    const response = await api.post(
      "/business-assistant/recommendations/generate"
    );
    return businessAssistantService.normalizeResponse(response);
  },

  async getRecommendationsJob(jobId: string): Promise<{
    status: "pending" | "processing" | "completed" | "failed";
    progress?: number;
    result?: any;
    error?: string;
  }> {
    const response = await api.get(
      `/business-assistant/recommendations/job/${jobId}`
    );
    const payload = businessAssistantService.normalizeResponse(response);
    if (payload?.status === "completed" && payload?.result) {
      return {
        ...payload,
        result: businessAssistantService.mapLegacyRecommendations(
          payload.result
        ),
      };
    }
    return payload;
  },

  async getStrategicAnalysis(): Promise<{
    analysis: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
      keyMetrics: {
        healthScore: number;
        growthRate: number;
        profitTrend: "up" | "down" | "stable";
        customerSatisfaction?: number;
      };
      recommendations: string[];
    };
    generatedAt: Date;
  }> {
    const response = await api.get("/business-assistant/strategic-analysis");
    return businessAssistantService.normalizeResponse(response);
  },

  async getLatestAnalysis(): Promise<{
    analysis: {
      id: string;
      type: string;
      data: Record<string, any>;
      insights: string[];
      createdAt: Date;
    };
  }> {
    const response = await api.get("/business-assistant/analysis/latest");
    return businessAssistantService.normalizeResponse(response);
  },
};
