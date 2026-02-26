// src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

/* ==============================
   HELPERS
============================== */

// ✅ Read token from BOTH storages (supports your login using sessionStorage too)
export const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

// ✅ Set token to storage (choose local by default; allow session storage if you want)
export const setToken = (token, { persist = "local" } = {}) => {
  // persist: "local" | "session"
  const setIn = persist === "session" ? sessionStorage : localStorage;
  const removeFrom = persist === "session" ? localStorage : sessionStorage;

  if (token) {
    setIn.setItem("token", token);
    // remove from the other storage to avoid conflicts
    removeFrom.removeItem("token");
  } else {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
  }

  // ✅ notify app (Layout, route guards, etc.)
  window.dispatchEvent(new Event("auth-changed"));
};

// ✅ Clear token + user from both storages
export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  window.dispatchEvent(new Event("auth-changed"));
};

/* ==============================
   REQUEST INTERCEPTOR
============================== */

API.interceptors.request.use(
  (req) => {
    const token = getToken();
    if (token) req.headers.Authorization = `Bearer ${token}`;
    else delete req.headers.Authorization; // ✅ important after logout
    return req;
  },
  (error) => Promise.reject(error)
);

/* ==============================
   RESPONSE INTERCEPTOR
============================== */

let isRedirecting = false;

API.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🔴 No response (server down / CORS / network issue)
    if (!error.response) {
      console.error("Network error / server down / CORS blocked:", error.message);
      return Promise.reject(error);
    }

    const { status } = error.response;

    // 🔐 Token expired / invalid
    if (status === 401) {
      console.warn("401 Unauthorized → clearing auth");

      clearAuth();

      // prevent redirect loop
      if (!isRedirecting && window.location.pathname !== "/login") {
        isRedirecting = true;

        // ✅ keep redirect safe + avoid history back to protected pages
        // (Layout can also call navigate("/login", { replace: true }) on auth-changed)
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default API;