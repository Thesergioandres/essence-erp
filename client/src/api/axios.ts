import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    const businessId = localStorage.getItem("businessId");

    const url = config.url || "";
    const allowsWithoutBusiness =
      url.startsWith("/auth") ||
      url.startsWith("/business/me/memberships") ||
      (config.method === "post" && url === "/business");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!businessId && token && !allowsWithoutBusiness) {
      return Promise.reject(
        new Error("Debes seleccionar un negocio antes de continuar")
      );
    }

    if (businessId) {
      config.headers["x-business-id"] = businessId;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
