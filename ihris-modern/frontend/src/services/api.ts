import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || "/api";

const AUTH_STORAGE_KEY = "ihris-auth-storage";

/** يقرأ الرمز من متجر المصادقة (zustand persist) مع الرجوع للمفتاح القديم. */
function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token;
      if (typeof token === "string" && token) return token;
    }
  } catch {
    // تخزين تالف — نتجاهله ونكمل بالمفتاح القديم
  }
  return localStorage.getItem("ihris_token");
}

function clearStoredSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem("ihris_token");
  localStorage.removeItem("ihris_user");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearStoredSession();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
