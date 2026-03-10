// store/authStore.js
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,

  init: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("user");
      const storedUser = userStr ? JSON.parse(userStr) : null;

      if (token && storedUser) {
        set({ token, user: storedUser, loading: false });
        // Only call getMe if it's a REAL token (not dev bypass)
        if (!token.startsWith("dev_token")) {
          try {
            const { authAPI } = await import("../services/api");
            const res = await authAPI.getMe();
            const freshUser = res.data.user;
            set({ user: freshUser });
            await AsyncStorage.setItem("user", JSON.stringify(freshUser));
          } catch {
            // Token expired - logout
            set({ user: null, token: null });
            await AsyncStorage.multiRemove(["token", "user"]);
          }
        }
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  setAuth: async (token, user) => {
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));
    set({ token, user, loading: false });
  },

  updateUser: async (updates) => {
    const updated = { ...get().user, ...updates };
    set({ user: updated });
    await AsyncStorage.setItem("user", JSON.stringify(updated));
  },

  logout: async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    set({ user: null, token: null, loading: false });
  },
}));