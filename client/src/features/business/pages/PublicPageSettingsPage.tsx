import { useBusiness } from "../../../context/BusinessContext";
import PublicPageSettingsPanel from "../components/PublicPageSettingsPanel";

export default function PublicPageSettingsPage() {
  const { businessId, business, refresh } = useBusiness();

  return (
    <div className="space-y-6 pb-32">
      <PublicPageSettingsPanel
        businessId={businessId}
        business={business}
        onRefresh={refresh}
      />
    </div>
  );
}
