import { useMemo } from "react";
import { useBusiness } from "../context/BusinessContext";

type MembershipLike = {
  business: unknown;
};

const resolveMembershipBusinessId = (membership: MembershipLike) => {
  const business = membership.business as unknown;

  if (typeof business === "string") {
    const trimmed = business.trim();
    return trimmed || "";
  }

  if (!business || typeof business !== "object") {
    return "";
  }

  const candidate = business as { _id?: unknown; id?: unknown };
  const byUnderscoreId =
    typeof candidate._id === "string" ? candidate._id.trim() : "";
  const byId = typeof candidate.id === "string" ? candidate.id.trim() : "";

  return byUnderscoreId || byId || "";
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
  const { memberships, businessId, selectBusiness, loading, error, hydrating } =
    useBusiness();

  const hasBusinesses = memberships.length > 0;

  const label = useMemo(() => {
    if (loading || hydrating) return "Cargando negocios...";
    if (error) return error;
    return "Negocio";
  }, [loading, hydrating, error]);

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
          onChange={e => selectBusiness(e.target.value || null)}
          className="w-full rounded-md border border-white/10 bg-gray-900/60 px-2 py-1 text-xs text-white focus:border-purple-400 focus:outline-none"
        >
          {memberships.map(membership => (
            <option
              key={membership._id}
              value={resolveMembershipBusinessId(membership)}
            >
              {resolveMembershipBusinessName(membership)}
            </option>
          ))}
        </select>
      ) : loading || hydrating ? (
        <p className="text-[11px] text-amber-200/80">Cargando negocios...</p>
      ) : (
        <p className="text-[11px] text-amber-200/80">
          Actualizando negocios...
        </p>
      )}
    </div>
  );
}
