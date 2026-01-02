import { useEffect, useState } from "react";
import { useBusiness } from "../context/BusinessContext";

// Small helper to centralize brand logo resolution: business logo -> stored custom logo -> default.
export function useBrandLogo() {
  const { business } = useBusiness();
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("brandLogoUrl");
    setCustomLogo(stored);

    const handleUpdate = () => {
      setCustomLogo(localStorage.getItem("brandLogoUrl"));
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("brand-logo-updated", handleUpdate);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("brand-logo-updated", handleUpdate);
    };
  }, []);

  return business?.logoUrl || customLogo || "/erp-logo.png";
}
