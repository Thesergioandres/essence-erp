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

  const logoField = (business as { logo?: unknown } | null)?.logo;
  const logoFromBusiness =
    typeof logoField === "string"
      ? logoField.trim()
      : typeof logoField === "object" && logoField
        ? (logoField as { url?: string }).url?.trim() || null
        : null;

  const businessLogo = business?.logoUrl?.trim() || logoFromBusiness || null;

  const storedLogo = customLogo?.trim() || null;

  return businessLogo || storedLogo || "/erp-logo.png";
}
