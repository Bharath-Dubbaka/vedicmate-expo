// store/slices/authSlice.js
// ─────────────────────────────────────────────────────────────────────────────
// AUTH SLICE — Redux Toolkit
//
// React.js vs React Native:
//   - React.js: localStorage.setItem("token", token)
//   - React Native: await AsyncStorage.setItem("token", token)
//   AsyncStorage is async (returns Promises), localStorage is synchronous.
//   This is why we use async thunks for everything here.
//
// Redux Toolkit concepts used:
//   - createSlice: combines actions + reducer in one place (no more action creators!)
//   - createAsyncThunk: handles async operations with auto pending/fulfilled/rejected states
//   - extraReducers: handle thunk lifecycle in the slice
// ─────────────────────────────────────────────────────────────────────────────

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../../services/api";

// ── INITIAL STATE ─────────────────────────────────────────────────────────────
const initialState = {
   user: null, // full user object from DB
   token: null, // JWT string
   loading: true, // true while checking AsyncStorage on app start
   authLoading: false, // true during login/register API call
   error: null, // error message string or null
};

// ─────────────────────────────────────────────────────────────────────────────
// ASYNC THUNKS
// createAsyncThunk(actionName, asyncFunction)
// Auto-dispatches:
//   - actionName/pending   → loading = true
//   - actionName/fulfilled → loading = false, payload = return value
//   - actionName/rejected  → loading = false, error = thrown error
// ─────────────────────────────────────────────────────────────────────────────

// ── INIT: Check AsyncStorage on app launch ────────────────────────────────────
export const initAuth = createAsyncThunk(
   "auth/init",
   async (_, { rejectWithValue }) => {
      try {
         console.log(
            "[AUTH SLICE] initAuth: checking AsyncStorage for saved session...",
         );

         // AsyncStorage stores strings only — we JSON.stringify user objects on save
         const token = await AsyncStorage.getItem("token");
         const userStr = await AsyncStorage.getItem("user");
         const storedUser = userStr ? JSON.parse(userStr) : null;

         if (!token || !storedUser) {
            console.log("[AUTH SLICE] initAuth: no saved session found");
            return { token: null, user: null };
         }

         console.log(
            `[AUTH SLICE] initAuth: found token, refreshing user from API...`,
         );

         // Always refresh user from DB on app start to get latest data
         // (kundli might have been computed, preferences updated, etc.)
         try {
            const res = await authAPI.getMe();
            const freshUser = res.data.user;
            console.log(
               `[AUTH SLICE] initAuth: user refreshed from API — ${freshUser.email}`,
            );

            // Update AsyncStorage with fresh user data
            await AsyncStorage.setItem("user", JSON.stringify(freshUser));
            return { token, user: freshUser };
         } catch (apiErr) {
            // If 401 — token expired. Clear and force re-login.
            if (apiErr.response?.status === 401) {
               console.log(
                  "[AUTH SLICE] initAuth: token expired, clearing session",
               );
               await AsyncStorage.multiRemove(["token", "user"]);
               return { token: null, user: null };
            }
            // Network error — use cached user data (offline support)
            console.log(
               "[AUTH SLICE] initAuth: API unreachable, using cached user",
            );
            return { token, user: storedUser };
         }
      } catch (err) {
         console.error("[AUTH SLICE] initAuth error:", err.message);
         return rejectWithValue(err.message);
      }
   },
);

// ── REGISTER ──────────────────────────────────────────────────────────────────
export const register = createAsyncThunk(
   "auth/register",
   async ({ name, email, password }, { rejectWithValue }) => {
      try {
         console.log(`[AUTH SLICE] register: attempting for email: ${email}`);

         const res = await authAPI.register({ name, email, password });
         const { token, user } = res.data;

         console.log(`[AUTH SLICE] register: success — userId: ${user.id}`);

         // Persist to AsyncStorage for next app launch
         await AsyncStorage.setItem("token", token);
         await AsyncStorage.setItem("user", JSON.stringify(user));

         return { token, user };
      } catch (err) {
         const message =
            err.response?.data?.message || err.message || "Registration failed";
         console.error("[AUTH SLICE] register error:", message);
         return rejectWithValue(message);
      }
   },
);

// ── LOGIN ─────────────────────────────────────────────────────────────────────
export const login = createAsyncThunk(
   "auth/login",
   async ({ email, password }, { rejectWithValue }) => {
      try {
         console.log(`[AUTH SLICE] login: attempting for email: ${email}`);

         const res = await authAPI.login({ email, password });
         const { token, user } = res.data;

         console.log(
            `[AUTH SLICE] login: success — userId: ${user.id}, onboardingComplete: ${user.onboardingComplete}`,
         );

         await AsyncStorage.setItem("token", token);
         await AsyncStorage.setItem("user", JSON.stringify(user));

         return { token, user };
      } catch (err) {
         const message =
            err.response?.data?.message || err.message || "Login failed";
         console.error("[AUTH SLICE] login error:", message);
         return rejectWithValue(message);
      }
   },
);

// ── LOGOUT ────────────────────────────────────────────────────────────────────
export const logout = createAsyncThunk(
   "auth/logout",
   async (_, { rejectWithValue }) => {
      try {
         console.log("[AUTH SLICE] logout: clearing session...");
         await AsyncStorage.multiRemove(["token", "user"]);
         console.log("[AUTH SLICE] logout: done");
         return null;
      } catch (err) {
         console.error("[AUTH SLICE] logout error:", err.message);
         return rejectWithValue(err.message);
      }
   },
);

// ── UPDATE USER (local + AsyncStorage sync) ───────────────────────────────────
// Used after onboarding steps to update user in both Redux state AND AsyncStorage
export const updateUser = createAsyncThunk(
   "auth/updateUser",
   async (updates, { getState, rejectWithValue }) => {
      try {
         console.log("[AUTH SLICE] updateUser:", Object.keys(updates));

         const currentUser = getState().auth.user;
         const updatedUser = { ...currentUser, ...updates };

         await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
         return updatedUser;
      } catch (err) {
         console.error("[AUTH SLICE] updateUser error:", err.message);
         return rejectWithValue(err.message);
      }
   },
);

// ─────────────────────────────────────────────────────────────────────────────
// SLICE DEFINITION
// ─────────────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
   name: "auth",
   initialState,
   reducers: {
      // Sync action to clear errors (e.g. when user edits login form after an error)
      clearError: (state) => {
         state.error = null;
      },
   },
   extraReducers: (builder) => {
      // ── initAuth ──────────────────────────────────────────────────────────────
      builder
         .addCase(initAuth.pending, (state) => {
            state.loading = true;
         })
         .addCase(initAuth.fulfilled, (state, action) => {
            state.loading = false;
            state.token = action.payload.token;
            state.user = action.payload.user;
            console.log(
               "[AUTH SLICE] initAuth fulfilled — user:",
               action.payload.user?.email || "none",
            );
         })
         .addCase(initAuth.rejected, (state) => {
            state.loading = false;
            state.token = null;
            state.user = null;
         });

      // ── register ──────────────────────────────────────────────────────────────
      builder
         .addCase(register.pending, (state) => {
            state.authLoading = true;
            state.error = null;
         })
         .addCase(register.fulfilled, (state, action) => {
            state.authLoading = false;
            state.token = action.payload.token;
            state.user = action.payload.user;
         })
         .addCase(register.rejected, (state, action) => {
            state.authLoading = false;
            state.error = action.payload; // error message string
         });

      // ── login ─────────────────────────────────────────────────────────────────
      builder
         .addCase(login.pending, (state) => {
            state.authLoading = true;
            state.error = null;
         })
         .addCase(login.fulfilled, (state, action) => {
            state.authLoading = false;
            state.token = action.payload.token;
            state.user = action.payload.user;
         })
         .addCase(login.rejected, (state, action) => {
            state.authLoading = false;
            state.error = action.payload;
         });

      // ── logout ────────────────────────────────────────────────────────────────
      builder.addCase(logout.fulfilled, (state) => {
         state.user = null;
         state.token = null;
         state.error = null;
         state.authLoading = false;
      });

      // ── updateUser ────────────────────────────────────────────────────────────
      builder.addCase(updateUser.fulfilled, (state, action) => {
         state.user = action.payload;
      });
   },
});

export const { clearError } = authSlice.actions;

// ── SELECTORS ─────────────────────────────────────────────────────────────────
// Selectors extract specific pieces of state
// In React.js: useSelector(state => state.auth.user)
// In React Native: EXACTLY the same! useSelector works identically.
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsLoading = (state) => state.auth.loading;
export const selectAuthLoading = (state) => state.auth.authLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsLoggedIn = (state) => !!state.auth.token;
export const selectOnboardingComplete = (state) =>
   state.auth.user?.onboardingComplete;

export default authSlice.reducer;
