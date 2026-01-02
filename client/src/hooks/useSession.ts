import { useEffect, useState } from "react";
import api from "../api/axios";
import { authService } from "../api/services";
import type { Membership, User } from "../types";

interface SessionState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useSession() {
  const [state, setState] = useState<SessionState>({
    user: authService.getCurrentUser(),
    loading: false,
    error: null,
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const profile = await authService.getProfile();
        if (!mounted) return;
        setState(prev => {
          const merged = { ...prev.user, ...profile } as User;
          localStorage.setItem("user", JSON.stringify(merged));
          return { user: merged, loading: false, error: null };
        });

        // Si es god y no hay businessId, intenta fijar el único negocio asignado
        const hasBusiness = !!localStorage.getItem("businessId");
        if (profile.role === "god" && !hasBusiness) {
          try {
            const { data } = await api.get<{ memberships: Membership[] }>(
              "/business/me/memberships"
            );
            const memberships = data?.memberships || [];
            if (memberships.length === 1 && memberships[0]?.business?._id) {
              localStorage.setItem("businessId", memberships[0].business._id);
            }
          } catch (err) {
            console.warn(
              "No se pudo fijar businessId para god en session",
              err
            );
          }
        }
      } catch (error) {
        console.error("useSession profile error", error);
        if (!mounted) return;
        setState(prev => ({
          ...prev,
          loading: false,
          error: "No se pudo cargar perfil",
        }));
      }
    };
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
