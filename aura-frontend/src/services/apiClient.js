import axios from "axios";
import { getCurrentUser, logout } from "./authService";

/*
 * Shared axios instance for the Spring Boot API (everything except /auth, which authService handles).
 *
 * Every request carries the signed-in user's id in the X-User-Id header; the backend uses it to decide
 * which projects the caller may open. Set VITE_API_BASE to point at another server, e.g.
 *   VITE_API_BASE=https://aura.example.com/api
 */
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

export const api = axios.create({ baseURL: API_BASE });

/** Accounts created by the real backend have numeric ids; offline demo accounts do not. */
export const isRemoteUser = (user) => /^\d+$/.test(String(user?.id ?? ""));

api.interceptors.request.use((config) => {
  const user = getCurrentUser();
  if (user?.id != null) config.headers["X-User-Id"] = String(user.id);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // The backend no longer knows this user (e.g. the database was reset): sign out instead of failing silently.
    if (error.response?.status === 401) {
      logout();
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

/** A human-readable message for any failed request. */
export function errorMessage(error) {
  if (error?.response) return error.response.data?.error || `The server rejected the request (${error.response.status}).`;
  if (error?.request) return "Cannot reach the AURA server. Check that the backend is running, then try again.";
  return error?.message || "Something went wrong.";
}
