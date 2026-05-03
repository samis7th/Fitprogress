import axios from "axios";

import { ensureAccessToken, logout, refreshSession } from "./auth.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await ensureAccessToken();
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  } catch (err) {
    logout();
    return Promise.reject(err);
  }
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const token = await refreshSession();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch {
        logout();
      }
    } else if (error.response?.status === 401) {
      logout();
    }

    return Promise.reject(error);
  },
);

export default api;
