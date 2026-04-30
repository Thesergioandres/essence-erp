import { httpClient } from "../../../shared/api/httpClient";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from "../types/auth.types";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // V2 Endpoint
    const response = await httpClient.post<AuthResponse>(
      "/auth/login",
      credentials
    );
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    // V2 Endpoint
    const response = await httpClient.post<AuthResponse>(
      "/auth/register",
      credentials
    );
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("businessId");
    localStorage.removeItem("accessHoldReason");
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr);
    return null;
  },
};
