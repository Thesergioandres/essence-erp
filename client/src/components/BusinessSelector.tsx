import { useCallback, useMemo, type ChangeEvent } from "react";
import { useBusiness } from "../context/BusinessContext";

type MembershipLike = {
  _id: string;
  business: unknown;
  businessId?: unknown;
  businessName?: unknown;
};

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
const OBJECT_ID_WRAPPER_REGEX = /ObjectId\(["']?([a-f\d]{24})["']?\)/i;

const resolveEntityId = (value: unknown): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[object Object]") {
      return "";
    }

    const objectIdWrapperMatch = trimmed.match(OBJECT_ID_WRAPPER_REGEX);
    if (objectIdWrapperMatch?.[1]) {
      return objectIdWrapperMatch[1];
    }

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed) as {
          $oid?: unknown;
          _id?: unknown;
          id?: unknown;
          businessId?: unknown;
        };

        return (
          resolveEntityId(parsed.$oid) ||
          resolveEntityId(parsed._id) ||
          resolveEntityId(parsed.id) ||
          resolveEntityId(parsed.businessId) ||
          trimmed
        );
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const candidate = value as {
    _id?: unknown;
    id?: unknown;
    $oid?: unknown;
    businessId?: unknown;
  };

  const resolvedByStructure =
    resolveEntityId(candidate._id) ||
    resolveEntityId(candidate.id) ||
    resolveEntityId(candidate.$oid) ||
    resolveEntityId(candidate.businessId);

  if (resolvedByStructure) {
    return resolvedByStructure;
  }

  if (typeof (value as { toString?: unknown }).toString === "function") {
    const rawValue = (value as { toString: () => string }).toString();
    const stringified = typeof rawValue === "string" ? rawValue.trim() : "";

    if (
      stringified &&
      stringified !== "[object Object]" &&
      OBJECT_ID_REGEX.test(stringified)
    ) {
      return stringified;
    }
  }

  return "";
};

const resolveEntityIdDeep = (
  value: unknown,
  depth = 0,
  visited: WeakSet<object> = new WeakSet()
): string => {
  if (depth > 5) {
    return "";
  }

  const direct = resolveEntityId(value);
  if (direct) {
    return direct;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  if (visited.has(value)) {
    return "";
  }
  visited.add(value);

  const recordValue = value as Record<string, unknown>;
  const priorityKeys = [
    "_id",
    "id",
    "$oid",
    "businessId",
    "business_id",
    "business",
  ];

  for (const key of priorityKeys) {
    if (!(key in recordValue)) continue;
    const nested = resolveEntityIdDeep(recordValue[key], depth + 1, visited);
    if (nested) {
      return nested;
    }
  }

  return "";
};

const resolveMembershipBusinessId = (membership: MembershipLike) => {
  const businessReference = membership.business ?? membership.businessId;
  return resolveEntityIdDeep(businessReference);
};

const resolveMembershipBusinessName = (membership: MembershipLike) => {
  const business = (membership.business ?? membership.businessId) as unknown;

  if (business && typeof business === "object") {
    const candidate = business as { name?: unknown };
    if (typeof candidate.name === "string") {
      const trimmedName = candidate.name.trim();
      if (trimmedName) {
        return trimmedName;
      }
    }
  }

  if (typeof membership.businessName === "string") {
    const trimmedName = membership.businessName.trim();
    if (trimmedName) {
      return trimmedName;
    }
  }

  return "Sin nombre";
};

export default function BusinessSelector() {
  const {
    memberships,
    businessId,
    selectBusiness,
    refresh,
    loading,
    error,
    hydrating,
  } = useBusiness();

  const businessOptions = useMemo(
    () =>
      memberships
        .map(membership => ({
          key: membership._id,
          id: resolveMembershipBusinessId(membership),
          name: resolveMembershipBusinessName(membership),
        }))
        .filter(option => Boolean(option.id)),
    [memberships]
  );

  const hasBusinesses = businessOptions.length > 0;

  const label = useMemo(() => {
    if (loading || hydrating) return "Cargando negocios...";
    if (error) return error;
    return "Negocio";
  }, [loading, hydrating, error]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const selectedBusinessId = resolveEntityId(event.target.value) || null;
      selectBusiness(selectedBusinessId);
    },
    [selectBusiness]
  );

  // REMOVED: El BusinessContext ya maneja el refresh inicial.
  // El useEffect anterior que llamaba refresh() causaba un loop infinito.

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-semibold text-white">{label}</span>
        {loading && <span className="text-[10px] text-gray-400">Cargando</span>}
      </div>
      {hasBusinesses ? (
        <select
          value={businessId ?? ""}
          onChange={handleChange}
          className="w-full rounded-md border border-white/10 bg-gray-900/60 px-2 py-1 text-xs text-white focus:border-purple-400 focus:outline-none"
        >
          {businessOptions.map(option => (
            <option key={option.key} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      ) : loading || hydrating ? (
        <p className="text-[11px] text-amber-200/80">Cargando negocios...</p>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-amber-200/80">
            No encontramos negocios activos en este momento.
          </p>
          <button
            type="button"
            onClick={() => {
              void refresh();
            }}
            className="rounded-md border border-amber-300/40 bg-amber-400/10 px-2 py-1 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-400/20"
          >
            Reintentar carga
          </button>
        </div>
      )}
    </div>
  );
}
