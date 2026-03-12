// store/slices/discoverSlice.js
// ─────────────────────────────────────────────────────────────────────────────
// DISCOVER SLICE — manages the swipe deck of profiles
// ─────────────────────────────────────────────────────────────────────────────

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { matchingAPI } from "../../services/api";

const initialState = {
   profiles: [], // array of compatible profiles from server
   loading: false,
   error: null,
   isEmpty: false, // true when server returns 0 profiles
};

// ── Fetch profiles for discover deck ─────────────────────────────────────────
export const fetchProfiles = createAsyncThunk(
   "discover/fetchProfiles",
   async (params = {}, { rejectWithValue }) => {
      try {
         console.log(
            "[DISCOVER SLICE] fetchProfiles: calling /matching/discover...",
         );
         const res = await matchingAPI.discover({ limit: 10, ...params });
         console.log(
            `[DISCOVER SLICE] fetchProfiles: received ${res.data.profiles.length} profiles`,
         );
         return res.data.profiles;
      } catch (err) {
         const message =
            err.response?.data?.message ||
            err.message ||
            "Failed to load profiles";
         console.error("[DISCOVER SLICE] fetchProfiles error:", message);
         return rejectWithValue(message);
      }
   },
);

// ── Like a profile ─────────────────────────────────────────────────────────
export const likeProfile = createAsyncThunk(
   "discover/likeProfile",
   async (userId, { rejectWithValue }) => {
      try {
         console.log(`[DISCOVER SLICE] likeProfile: liking userId: ${userId}`);
         const res = await matchingAPI.like(userId);
         console.log(
            `[DISCOVER SLICE] likeProfile: isMatch=${res.data.isMatch}`,
         );
         return { userId, ...res.data };
      } catch (err) {
         const message = err.response?.data?.message || err.message;
         console.error("[DISCOVER SLICE] likeProfile error:", message);
         return rejectWithValue(message);
      }
   },
);

// ── Pass a profile ────────────────────────────────────────────────────────────
export const passProfile = createAsyncThunk(
   "discover/passProfile",
   async (userId, { rejectWithValue }) => {
      try {
         console.log(`[DISCOVER SLICE] passProfile: passing userId: ${userId}`);
         await matchingAPI.pass(userId);
         return userId;
      } catch (err) {
         const message = err.response?.data?.message || err.message;
         console.error("[DISCOVER SLICE] passProfile error:", message);
         return rejectWithValue(message);
      }
   },
);

const discoverSlice = createSlice({
   name: "discover",
   initialState,
   reducers: {
      // Remove a profile from local deck immediately (optimistic UI)
      // This makes the swipe feel instant — we don't wait for API
      removeProfile: (state, action) => {
         const userId = action.payload;
         state.profiles = state.profiles.filter((p) => p.user.id !== userId);
         console.log(
            `[DISCOVER SLICE] removeProfile: removed ${userId}, ${state.profiles.length} remaining`,
         );
      },
      clearError: (state) => {
         state.error = null;
      },
   },
   extraReducers: (builder) => {
      builder
         .addCase(fetchProfiles.pending, (state) => {
            state.loading = true;
            state.error = null;
            state.isEmpty = false;
         })
         .addCase(fetchProfiles.fulfilled, (state, action) => {
            state.loading = false;
            state.profiles = action.payload;
            state.isEmpty = action.payload.length === 0;
         })
         .addCase(fetchProfiles.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
         });

      // After like/pass, the profile is already removed optimistically
      // We just handle the fulfilled/rejected states
      builder
         .addCase(likeProfile.rejected, (state, action) => {
            console.error(
               "[DISCOVER SLICE] likeProfile rejected:",
               action.payload,
            );
         })
         .addCase(passProfile.rejected, (state, action) => {
            console.error(
               "[DISCOVER SLICE] passProfile rejected:",
               action.payload,
            );
         });
   },
});

export const { removeProfile, clearError } = discoverSlice.actions;

export const selectProfiles = (state) => state.discover.profiles;
export const selectDiscoverLoading = (state) => state.discover.loading;
export const selectDiscoverError = (state) => state.discover.error;
export const selectIsEmpty = (state) => state.discover.isEmpty;

export default discoverSlice.reducer;
