// store/slices/premiumSlice.js
// Premium state lives in Redux so every component reads the same value.
// usePremium hook reads from this slice instead of local state.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "vedicmate_premium_cache";
const FREE_DAILY_LIMIT = 15;

// ── Async thunk: fetch status from backend ────────────────────────────────────
export const fetchPremiumStatus = createAsyncThunk(
   "premium/fetchStatus",
   async (_, { rejectWithValue }) => {
      try {
         // Dynamic import to avoid circular deps
         const api = (await import("../../services/api")).default;
         const res = await api.get("/premium/status");
         const { premium, swipes, boost } = res.data;

         const data = { premium, swipes, boost, cachedAt: Date.now() };
         await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
         return data;
      } catch (err) {
         if (err.response?.status === 401)
            return rejectWithValue("unauthenticated");
         // Try cache on network failure
         try {
            const cached = await AsyncStorage.getItem(CACHE_KEY);
            if (cached) return JSON.parse(cached);
         } catch {}
         return rejectWithValue(err.message);
      }
   },
);

// ── Async thunk: purchase / grant dev premium ─────────────────────────────────
// export const purchasePremium = createAsyncThunk(
//    "premium/purchase",
//    async (
//       { planKey = "annual", devMode = false } = {},
//       { dispatch, rejectWithValue },
//    ) => {
//       try {
//          const api = (await import("../../services/api")).default;
//          const res = await api.post("/premium/verify", { devMode: true });
//          if (res.data?.success) {
//             // Immediately re-fetch the authoritative status from backend
//             await dispatch(fetchPremiumStatus());
//             return { success: true };
//          }
//          return rejectWithValue("Purchase failed");
//       } catch (err) {
//          return rejectWithValue(err.response?.data?.message || err.message);
//       }
//    },
// );

const initialState = {
   isLoading: false,
   isPremium: false,
   plan: null,
   expiresAt: null,
   swipesRemaining: FREE_DAILY_LIMIT,
   swipeLimit: FREE_DAILY_LIMIT,
   swipesAllowed: true,
   boostActive: false,
   boostExpiresAt: null,
   initialized: false, // true after first successful fetch
};

const premiumSlice = createSlice({
   name: "premium",
   initialState,
   reducers: {
      // Called when user swipes — optimistic local decrement
      decrementSwipe: (state) => {
         if (state.isPremium) return;
         const next = Math.max(
            0,
            (state.swipesRemaining ?? FREE_DAILY_LIMIT) - 1,
         );
         state.swipesRemaining = next;
         if (next === 0) state.swipesAllowed = false;
      },
      // Called on logout — reset everything
      resetPremium: (state) => {
         Object.assign(state, initialState);
      },
   },
   extraReducers: (builder) => {
      builder
         .addCase(fetchPremiumStatus.pending, (state) => {
            state.isLoading = true;
         })
         .addCase(fetchPremiumStatus.fulfilled, (state, action) => {
            const { premium = {}, swipes = {}, boost = {} } = action.payload;
            state.isLoading = false;
            state.initialized = true;
            state.isPremium = premium.isActive ?? false;
            state.plan = premium.plan ?? null;
            state.expiresAt = premium.expiresAt ?? null;
            state.swipesAllowed = state.isPremium
               ? true
               : (swipes.allowed ?? true);
            state.swipesRemaining = state.isPremium
               ? null
               : (swipes.remaining ?? FREE_DAILY_LIMIT);
            state.swipeLimit = state.isPremium
               ? null
               : (swipes.limit ?? FREE_DAILY_LIMIT);
            state.boostActive = boost.active ?? false;
            state.boostExpiresAt = boost.expiresAt ?? null;
         })
         .addCase(fetchPremiumStatus.rejected, (state) => {
            state.isLoading = false;
         });
   },
});

export const { decrementSwipe, resetPremium } = premiumSlice.actions;

// Selectors
export const selectIsPremium = (s) => s.premium.isPremium;
export const selectPremiumPlan = (s) => s.premium.plan;
export const selectPremiumExpiresAt = (s) => s.premium.expiresAt;
export const selectSwipesRemaining = (s) => s.premium.swipesRemaining;
export const selectSwipesAllowed = (s) => s.premium.swipesAllowed;
export const selectSwipeLimit = (s) => s.premium.swipeLimit;
export const selectBoostActive = (s) => s.premium.boostActive;
export const selectPremiumLoading = (s) => s.premium.isLoading;
export const selectPremiumInitialized = (s) => s.premium.initialized;

export default premiumSlice.reducer;
