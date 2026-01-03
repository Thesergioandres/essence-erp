import { useEffect, useState } from "react";
import { useBusiness } from "../context/BusinessContext";

// Small helper to centralize brand logo resolution: business logo -> stored custom logo -> default.
export function useBrandLogo() {
  const { business } = useBusiness();
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("brandLogoUrl") || undefined;
    setCustomLogo(stored || null);

    const handleUpdate = () => {
      const updated = localStorage.getItem("brandLogoUrl") || undefined;
      setCustomLogo(updated || null);
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("brand-logo-updated", handleUpdate);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("brand-logo-updated", handleUpdate);
    };
  }, []);

  const businessLogo =
    business?.logoUrl?.trim() ||
    (typeof (business as Record<string, unknown> | null)?.logo === "string"
      ? ((business as Record<string, string>).logo || "").trim()
      : (
          business as Record<string, { url?: string }> | null
        )?.logo?.url?.trim()) ||
    null;

  const storedLogo = customLogo?.trim() || null;

  return businessLogo || storedLogo || "/erp-logo.png";
}
