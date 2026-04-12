import { useCallback, useMemo, type ChangeEvent } from "react";
import { useBusiness } from "../context/BusinessContext";

type MembershipLike = {
  _id: string;
  business: unknown;
};

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const resolveEntityId = (value: unknown): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[object Object]") {
      return "";
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

const resolveMembershipBusinessId = (membership: MembershipLike) => {
  return resolveEntityId(membership.business);
};

const resolveMembershipBusinessName = (membership: MembershipLike) => {
  const business = membership.business as unknown;

  if (!business || typeof business !== "object") {
    return "Sin nombre";
  }

  const candidate = business as { name?: unknown };
  if (typeof candidate.name !== "string") {
    return "Sin nombre";
  }

  const trimmedName = candidate.name.trim();
  return trimmedName || "Sin nombre";
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
