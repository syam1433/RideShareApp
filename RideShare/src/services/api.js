// src/services/api.ts
import axios from "axios";

const backendUrlFromEnv = (import.meta.env.VITE_BACKEND_URL || "").trim();
const defaultBackendUrl = import.meta.env.DEV ? "http://localhost:5000" : "https://rideshareapp-1.onrender.com";
const BACKEND_URL = (backendUrlFromEnv || defaultBackendUrl).replace(/\/$/, "");
const API_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s timeout for model processing
});

// Only add token — NOTHING ELSE
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // CRITICAL: Do NOT set Content-Type or Accept here
  // FormData must set multipart/form-data automatically

  return config;
}, (error) => {
  return Promise.reject(error);
});


// Response interceptor: Handle common errors globally
API.interceptors.response.use(
  (response) => response,

  (error) => {
    // 401 → Unauthorized (token expired/invalid → force logout)
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized → Logging out');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      // Optional: toast message
      // toast.error("Session expired. Please login again.");
      window.location.href = '/login'; // or use navigate if in context
    }

    // 403 → Forbidden (e.g. role mismatch)
    if (error.response?.status === 403) {
      console.warn('403 Forbidden → Access denied');
      // Optional: toast.error("You don't have permission for this action");
    }

    // Network error or timeout
    if (!error.response) {
      console.error('Network error or timeout:', error.message);
      // toast.error("Network error. Please check your connection.");
    }

    // Pass the error forward so individual components can handle it
    return Promise.reject(error);
  }
);

export default API;