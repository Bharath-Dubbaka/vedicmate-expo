// services/api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5000/api";
// 10.0.2.2 = Android emulator localhost. Change to your server IP for device testing.

const api = axios.create({
   baseURL: BASE_URL,
   timeout: 15000,
   headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach JWT ──────────────────────
api.interceptors.request.use(async (config) => {
   const token = await AsyncStorage.getItem("token");
   if (token) config.headers.Authorization = `Bearer ${token}`;
   return config;
});

// ── Response interceptor: handle 401 ────────────────────
api.interceptors.response.use(
   (res) => res,
   async (err) => {
      if (err.response?.status === 401) {
         await AsyncStorage.multiRemove(["token", "user"]);
         // Navigation to auth handled by root layout
      }
      return Promise.reject(err);
   },
);

// ── Auth ─────────────────────────────────────────────────
export const authAPI = {
   googleLogin: (idToken) => api.post("/auth/google", { idToken }),
   getMe: () => api.get("/auth/me"),
   savePushToken: (pushToken) => api.patch("/auth/push-token", { pushToken }),
};

// ── Onboarding ───────────────────────────────────────────
export const onboardingAPI = {
   saveBirthDetails: (data) => api.post("/onboarding/birth-details", data),
   saveProfile: (data) => api.post("/onboarding/profile", data),
   complete: () => api.post("/onboarding/complete"),
   getCosmicProfile: () => api.get("/onboarding/cosmic-profile"),
};

// ── Matching ─────────────────────────────────────────────
export const matchingAPI = {
   discover: (params) => api.get("/matching/discover", { params }),
   getCompatibility: (userId) => api.get(`/matching/compatibility/${userId}`),
   like: (userId) => api.post(`/matching/like/${userId}`),
   pass: (userId) => api.post(`/matching/pass/${userId}`),
   getMatches: () => api.get("/matching/matches"),
   unmatch: (matchId) => api.delete(`/matching/unmatch/${matchId}`),
};

// ── Chat ─────────────────────────────────────────────────
export const chatAPI = {
   getMessages: (matchId, params) =>
      api.get(`/chat/${matchId}/messages`, { params }),
   sendMessage: (matchId, data) => api.post(`/chat/${matchId}/messages`, data),
   deleteMessage: (matchId, msgId) =>
      api.delete(`/chat/${matchId}/messages/${msgId}`),
};

export default api;
