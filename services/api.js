// services/api.js
// ─────────────────────────────────────────────────────────────────────────────
// API SERVICE — Axios client
//
// React.js vs React Native:
//   In React.js: you'd typically use fetch() or axios, interceptors work same way.
//   In React Native: axios works identically. The difference is:
//     - No browser cookies (we use JWT in Authorization header instead)
//     - No CORS issues on device (CORS is only a browser restriction)
//     - Use your machine's IP (not localhost) when testing on a physical device
//       because "localhost" on Android means the phone itself, not your computer!
//       10.0.2.2 = Android emulator's alias for host machine
//       Your actual IP (192.168.x.x) = for physical device on same WiFi
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Base URL ──────────────────────────────────────────────────────────────────
// EXPO_PUBLIC_ prefix makes env vars available in Expo (like REACT_APP_ in CRA)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5000/api";
console.log("[API] Base URL:", BASE_URL);

// ── Create Axios instance ─────────────────────────────────────────────────────
const api = axios.create({
   baseURL: BASE_URL,
   timeout: 15000, // 15 seconds — longer for mobile networks
   headers: { "Content-Type": "application/json" },
});

// ── Request Interceptor: attach JWT to every request ─────────────────────────
// This is the equivalent of adding Authorization header manually each time
// The interceptor runs BEFORE every request automatically
api.interceptors.request.use(
   async (config) => {
      // Get token from AsyncStorage (same as localStorage in React.js but async)
      const token = await AsyncStorage.getItem("token");
      if (token) {
         config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(
         `[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`,
      );
      return config;
   },
   (error) => {
      console.error("[API REQUEST ERROR]", error.message);
      return Promise.reject(error);
   },
);

// ── Response Interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
   (res) => {
      console.log(`[API RESPONSE] ${res.status} ${res.config.url}`);
      return res;
   },
   async (err) => {
      const status = err.response?.status;
      const url = err.config?.url;
      console.error(
         `[API ERROR] ${status} ${url} — ${err.response?.data?.message || err.message}`,
      );

      if (status === 401) {
         // Token expired or invalid — clear storage
         // The NavigationGuard in _layout.jsx will handle redirect to login
         console.log("[API] 401 received — clearing auth tokens");
         await AsyncStorage.multiRemove(["token", "user"]);
      }
      return Promise.reject(err);
   },
);

// ─────────────────────────────────────────────────────────────────────────────
// API FUNCTION GROUPS
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
   register: (data) => api.post("/auth/register", data),
   login: (data) => api.post("/auth/login", data),
   getMe: () => api.get("/auth/me"),
   savePushToken: (pushToken) => api.patch("/auth/push-token", { pushToken }),
};

// ── Onboarding ────────────────────────────────────────────────────────────────
export const onboardingAPI = {
   saveBirthDetails: (data) => api.post("/onboarding/birth-details", data),
   saveProfile: (data) => api.post("/onboarding/profile", data),
   complete: () => api.post("/onboarding/complete"),
   getCosmicProfile: () => api.get("/onboarding/cosmic-profile"),
};

// ── Matching ──────────────────────────────────────────────────────────────────
export const matchingAPI = {
   discover: (params) => api.get("/matching/discover", { params }),
   getCompatibility: (userId) => api.get(`/matching/compatibility/${userId}`),
   like: (userId) => api.post(`/matching/like/${userId}`),
   pass: (userId) => api.post(`/matching/pass/${userId}`),
   getMatches: () => api.get("/matching/matches"),
   unmatch: (matchId) => api.delete(`/matching/unmatch/${matchId}`),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
   getMessages: (matchId, params) =>
      api.get(`/chat/${matchId}/messages`, { params }),
   sendMessage: (matchId, data) => api.post(`/chat/${matchId}/messages`, data),
};

export default api;
