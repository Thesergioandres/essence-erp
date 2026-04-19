import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { businessService } from "../features/business/services";
import type {
  Business,
  BusinessFeatures,
  Membership,
} from "../features/business/types/business.types";
import { globalSettingsService } from "../features/common/services";

type AssistantPlanMap = Record<string, boolean>;

interface BusinessContextValue {
  businessId: string | null;
  business: Business | null;
  features: BusinessFeatures;
  memberships: Membership[];
  hydrating: boolean;
  loading: boolean;
  error: string | null;
  selectBusiness: (id: string | null) => void;
  refresh: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(
  undefined
);

const defaultFeatures: BusinessFeatures = {
  products: true,
  inventory: true,
  sales: true,
  gamification: true,
  incidents: true,
  expenses: true,
  assistant: false,
  reports: true,
  transfers: true,
  employees: true,
  rankings: true,
  branches: true,
  credits: true,
  customers: true,
  defectiveProducts: true,
};

const defaultAssistantByPlan: AssistantPlanMap = {
  starter: false,
  pro: false,
  enterprise: true,
};

const sanitizeIdString = (raw: string): string => {
  const trimmed = String(raw || "").trim();
  if (
    !trimmed ||
    trimmed === "[object Object]" ||
    trimmed === "undefined" ||
    trimmed === "null"
  ) {
    return "";
  }

  const objectIdMatch = trimmed.match(/[a-fA-F0-9]{24}/);
  if (objectIdMatch) {
    return objectIdMatch[0];
  }

  return trimmed;
};

const bytesToHexObjectId = (bytes: unknown): string => {
  if (!Array.isArray(bytes) || bytes.length !== 12) {
    return "";
  }

  const isValidByteArray = bytes.every(
    item => typeof item === "number" && item >= 0 && item <= 255
  );
  if (!isValidByteArray) {
    return "";
  }

  return bytes
    .map(item => item.toString(16).padStart(2, "0"))
    .join("")
    .toLowerCase();
};

const resolveEntityId = (value: unknown): string => {
  if (typeof value === "string") {
    return sanitizeIdString(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const candidate = value as {
    _id?: unknown;
    id?: unknown;
    $oid?: unknown;
    oid?: unknown;
    businessId?: unknown;
    business_id?: unknown;
    toHexString?: () => string;
    toString?: () => string;
    buffer?: unknown;
    data?: unknown;
  };

  const fromToHex =
    typeof candidate.toHexString === "function"
      ? sanitizeIdString(candidate.toHexString())
      : "";

  const nested =
    resolveEntityId(candidate._id) ||
    resolveEntityId(candidate.id) ||
    resolveEntityId(candidate.$oid) ||
    resolveEntityId(candidate.oid) ||
    resolveEntityId(candidate.businessId) ||
    resolveEntityId(candidate.business_id);

  const fromBuffer =
    bytesToHexObjectId(candidate.buffer) || bytesToHexObjectId(candidate.data);

  if (fromToHex) {
    return fromToHex;
  }

  if (fromBuffer) {
    return fromBuffer;
  }

  if (nested) {
    return nested;
  }

  if (typeof candidate.toString === "function") {
    return sanitizeIdString(candidate.toString());
  }

  return "";
};

const getMembershipBusinessId = (membership: {
  business?: unknown;
  businessId?: unknown;
  business_id?: unknown;
}): string => {
  return (
    resolveEntityId(membership.business) ||
    resolveEntityId(membership.businessId) ||
    resolveEntityId(membership.business_id)
  );
};

const normalizeMembershipBusiness = (membership: Membership): Membership => {
  const resolvedBusinessId = getMembershipBusinessId(
    membership as Membership & { businessId?: unknown; business_id?: unknown }
  );

  if (!resolvedBusinessId) {
    return membership;
  }

  if (typeof membership.business === "string") {
    return {
      ...membership,
      business: {
        _id: resolvedBusinessId,
        name: "Negocio",
      } as Membership["business"],
    };
  }

  if (membership.business && typeof membership.business === "object") {
    return {
      ...membership,
      business: {
        ...(membership.business as Record<string, unknown>),
        _id: resolvedBusinessId,
      } as Membership["business"],
    };
  }

  return membership;
};

const hasSameMembershipSnapshot = (
  current: Membership[],
  next: Membership[]
) => {
  if (current.length !== next.length) {
    return false;
  }

  return current.every((membership, index) => {
    const nextMembership = next[index];
    if (!nextMembership) return false;

    return (
      membership._id === nextMembership._id &&
      membership.status === nextMembership.status &&
      membership.role === nextMembership.role &&
      getMembershipBusinessId(membership) ===
        getMembershipBusinessId(nextMembership)
    );
  });
};

/**
 * Read memberships from localStorage user object (set by login)
 * This prevents the "amnesia" bug where memberships are empty until API responds
 */
function hydrateFromStoredSession(): Membership[] {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.memberships || [];
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businessId, setBusinessId] = useState<string | null>(
    localStorage.getItem("businessId")
  );
  // 🔑 FIX: Initialize memberships from localStorage to prevent redirect flash
  const [memberships, setMemberships] = useState<Membership[]>(
    hydrateFromStoredSession
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [assistantByPlan, setAssistantByPlan] = useState<AssistantPlanMap>(
    defaultAssistantByPlan
  );
  const tokenRef = useRef<string | null>(localStorage.getItem("token"));
  const isFetchingRef = useRef(false); // Guard against concurrent refresh calls
  const retryRef = useRef(0); // Guard for auto-retry

  const syncBusinessId = (id: string | null) => {
    setBusinessId(prev => (prev === id ? prev : id));
    if (id) {
      localStorage.setItem("businessId", id);
    } else {
      localStorage.removeItem("businessId");
    }
  };

  const refresh = useCallback(async () => {
    // Debounce: Skip if already fetching
    if (isFetchingRef.current) {
      console.log("[BusinessContext] Refresh skipped - already fetching");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setMemberships(prev => (prev.length > 0 ? [] : prev));
      syncBusinessId(null);
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const [{ memberships: fetched }, publicSettings] = await Promise.all([
        businessService.getMyMemberships(),
        globalSettingsService.getPublicSettings().catch(() => null),
      ]);

      if (publicSettings?.plans) {
        const assistantMap = Object.values(
          publicSettings.plans as Record<
            string,
            {
              id?: string;
              features?: { businessAssistant?: boolean };
            }
          >
        ).reduce<AssistantPlanMap>(
          (acc, planConfig) => {
            const planId = String(planConfig?.id || "")
              .trim()
              .toLowerCase();
            if (!planId) return acc;

            acc[planId] = planConfig?.features?.businessAssistant === true;
            return acc;
          },
          { ...defaultAssistantByPlan }
        );

        setAssistantByPlan(assistantMap);
      }

      console.log(
        "[BusinessContext] Fetched memberships:",
        fetched?.length,
        fetched
      );

      const fetchedMemberships = (Array.isArray(fetched) ? fetched : []).map(
        membership => normalizeMembershipBusiness(membership as Membership)
      );

      setMemberships(prev =>
        hasSameMembershipSnapshot(prev, fetchedMemberships)
          ? prev
          : fetchedMemberships
      );

      // Safe Retry Logic: Si devuelve vacío y no hemos reintentado, prueba una vez más
      if (fetchedMemberships.length === 0 && retryRef.current < 1) {
        console.log("[BusinessContext] Empty list, retrying once...");
        retryRef.current += 1;
        isFetchingRef.current = false; // Liberar lock para el reintento
        setTimeout(() => refresh(), 800);
        return;
      }

      // Si éxito, limpiar reintentos
      if (fetchedMemberships.length > 0) {
        retryRef.current = 0;
      }

      const stored = resolveEntityId(localStorage.getItem("businessId"));
      const hasStored =
        stored.length > 0 &&
        fetchedMemberships.some(m => getMembershipBusinessId(m) === stored);
      const onlyOne =
        fetchedMemberships.length === 1
          ? getMembershipBusinessId(fetchedMemberships[0]) || null
          : null;
      const nextId = hasStored ? stored : onlyOne;

      syncBusinessId(nextId);
    } catch (err) {
      const status = (err as { response?: { status?: number; data?: any } })
        ?.response?.status;
      const code = (err as { response?: { status?: number; data?: any } })
        ?.response?.data?.code;
      const isSessionBootstrapError =
        status === 401 || status === 403 || status === 404;

      // Si el token quedó viejo/ilegal y el backend responde 401, limpia sesión
      // Para 403, solo limpiar si NO es "owner_inactive" ni "pending" (usuario recién registrado)
      const isPendingUser = code === "pending";
      const isOwnerInactive = code === "owner_inactive";

      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        syncBusinessId(null);
        setMemberships(prev => (prev.length > 0 ? [] : prev));
      } else if (status === 403 && !isOwnerInactive && !isPendingUser) {
        // 403 por otras razones (token inválido, etc) - limpiar sesión
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        syncBusinessId(null);
        setMemberships(prev => (prev.length > 0 ? [] : prev));
      }
      // Si es usuario pending (recién registrado), NO limpiar token - solo marcar memberships vacías
      if (isPendingUser || status === 403) {
        setMemberships(prev => (prev.length > 0 ? [] : prev));
      }

      if (!isSessionBootstrapError && !isPendingUser) {
        console.error("Error fetching memberships", err);
        setError("No se pudieron cargar tus negocios");
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await refresh();
      setInitializing(false);
    };
    void run();
  }, [refresh]);

  // Escuchar cambios de sesión y refrescar membresías.
  useEffect(() => {
    const handleSessionRefresh = async () => {
      tokenRef.current = localStorage.getItem("token");
      await refresh();
    };

    window.addEventListener("auth-changed", handleSessionRefresh);

    return () => {
      window.removeEventListener("auth-changed", handleSessionRefresh);
    };
  }, [refresh]);

  useEffect(() => {
    const currentToken = localStorage.getItem("token");
    if (currentToken !== tokenRef.current) {
      tokenRef.current = currentToken;
      void refresh();
    }
  }, [refresh]);

  const selectedMembership = useMemo(
    () =>
      memberships.find(m => getMembershipBusinessId(m) === businessId) ?? null,
    [memberships, businessId]
  );

  useEffect(() => {
    if (initializing) {
      return;
    }

    if (businessId && selectedMembership) {
      return;
    }

    const activeMembershipIds = Array.from(
      new Set(
        memberships
          .filter(membership => membership.status === "active")
          .map(getMembershipBusinessId)
          .filter(Boolean)
      )
    );

    if (!businessId && activeMembershipIds.length === 1) {
      syncBusinessId(activeMembershipIds[0]);
      return;
    }

    if (businessId && !selectedMembership && activeMembershipIds.length === 1) {
      syncBusinessId(activeMembershipIds[0]);
    }
  }, [businessId, initializing, memberships, selectedMembership]);

  const selectedBusiness = useMemo(() => {
    if (!selectedMembership) {
      return null;
    }

    return typeof selectedMembership.business === "object"
      ? selectedMembership.business
      : null;
  }, [selectedMembership]);

  const features = useMemo<BusinessFeatures>(() => {
    const selectedPlan = String(selectedBusiness?.plan || "starter")
      .trim()
      .toLowerCase();
    const baseFeatures = selectedBusiness?.config?.features || {};
    const fallbackAssistant = assistantByPlan.starter ?? false;

    return {
      ...defaultFeatures,
      ...baseFeatures,
      assistant: assistantByPlan[selectedPlan] ?? fallbackAssistant,
    };
  }, [assistantByPlan, selectedBusiness]);

  const value: BusinessContextValue = {
    businessId: businessId || null,
    business: selectedBusiness,
    features,
    memberships,
    hydrating: initializing,
    loading,
    error,
    selectBusiness: syncBusinessId,
    refresh,
  };

  return (
    <BusinessContext.Provider value={value}>
      {initializing && tokenRef.current ? (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-200">
          Cargando negocio...
        </div>
      ) : (
        children
      )}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error("useBusiness debe usarse dentro de BusinessProvider");
  }
  return ctx;
};
