// store/slices/matchesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { matchingAPI } from "../../services/api";

const initialState = {
  matches: [],
  loading: false,
  error: null,
};

export const fetchMatches = createAsyncThunk(
  "matches/fetchMatches",
  async (_, { rejectWithValue }) => {
    try {
      console.log("[MATCHES SLICE] fetchMatches: calling /matching/matches...");
      const res = await matchingAPI.getMatches();
      console.log(`[MATCHES SLICE] fetchMatches: received ${res.data.matches.length} matches`);
      return res.data.matches;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      console.error("[MATCHES SLICE] fetchMatches error:", message);
      return rejectWithValue(message);
    }
  }
);

const matchesSlice = createSlice({
  name: "matches",
  initialState,
  reducers: {
    // Called when Socket.io emits a new match event
    addMatch: (state, action) => {
      console.log("[MATCHES SLICE] addMatch:", action.payload.matchId);
      // Avoid duplicates
      const exists = state.matches.some((m) => m.matchId === action.payload.matchId);
      if (!exists) {
        state.matches.unshift(action.payload); // add to top
      }
    },
    // Update lastMessage preview when a new chat message arrives
    updateLastMessage: (state, action) => {
      const { matchId, message } = action.payload;
      const match = state.matches.find((m) => m.matchId === matchId);
      if (match) {
        match.lastMessage = message;
        match.unreadCount = (match.unreadCount || 0) + 1;
      }
    },
    // Clear unread count when user opens chat
    clearUnread: (state, action) => {
      const matchId = action.payload;
      const match = state.matches.find((m) => m.matchId === matchId);
      if (match) {
        match.unreadCount = 0;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false;
        state.matches = action.payload;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addMatch, updateLastMessage, clearUnread } = matchesSlice.actions;

export const selectMatches = (state) => state.matches.matches;
export const selectMatchesLoading = (state) => state.matches.loading;
export const selectTotalUnread = (state) =>
  state.matches.matches.reduce((sum, m) => sum + (m.unreadCount || 0), 0);

export default matchesSlice.reducer;