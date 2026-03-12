// store/slices/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createSelector } from "@reduxjs/toolkit";
import { chatAPI } from "../../services/api";

const initialState = {
   // messages is a map: { [matchId]: [...messages] }
   messagesByMatch: {},
   loadingByMatch: {},
   currentMatchId: null,
};

export const fetchMessages = createAsyncThunk(
   "chat/fetchMessages",
   async (matchId, { rejectWithValue }) => {
      try {
         console.log(`[CHAT SLICE] fetchMessages for matchId: ${matchId}`);
         const res = await chatAPI.getMessages(matchId, { limit: 40 });
         console.log(
            `[CHAT SLICE] fetchMessages: got ${res.data.messages.length} messages`,
         );
         return { matchId, messages: res.data.messages };
      } catch (err) {
         const message = err.response?.data?.message || err.message;
         console.error("[CHAT SLICE] fetchMessages error:", message);
         return rejectWithValue({ matchId, error: message });
      }
   },
);

const chatSlice = createSlice({
   name: "chat",
   initialState,
   reducers: {
      addMessage: (state, action) => {
         const { matchId, message } = action.payload;
         if (!state.messagesByMatch[matchId]) {
            state.messagesByMatch[matchId] = [];
         }
         // Avoid duplicates (check by _id or tempId)
         const exists = state.messagesByMatch[matchId].some(
            (m) => m._id === message._id || m._id === message.tempId,
         );
         if (!exists) {
            state.messagesByMatch[matchId].push(message);
         }
         console.log(
            `[CHAT SLICE] addMessage to ${matchId}: "${message.text?.substring(0, 30)}..."`,
         );
      },
      setCurrentMatch: (state, action) => {
         state.currentMatchId = action.payload;
      },
      clearChat: (state, action) => {
         const matchId = action.payload;
         delete state.messagesByMatch[matchId];
      },
   },
   extraReducers: (builder) => {
      builder
         .addCase(fetchMessages.pending, (state, action) => {
            const matchId = action.meta.arg;
            state.loadingByMatch[matchId] = true;
         })
         .addCase(fetchMessages.fulfilled, (state, action) => {
            const { matchId, messages } = action.payload;
            state.loadingByMatch[matchId] = false;
            state.messagesByMatch[matchId] = messages;
         })
         .addCase(fetchMessages.rejected, (state, action) => {
            const matchId = action.payload?.matchId;
            if (matchId) state.loadingByMatch[matchId] = false;
         });
   },
});

export const { addMessage, setCurrentMatch, clearChat } = chatSlice.actions;

// ─────────────────────────────────────────────────────────────────────────────
// MEMOIZED SELECTORS
// Using createSelector so the selector factory doesn't return a new function
// reference on every render (which caused the "Selector unknown returned a
// different result" warning in react-redux).
//
// Usage in component:
//   const messages = useSelector(selectMessagesByMatchId(matchId));
//   const loading  = useSelector(selectChatLoadingByMatchId(matchId));
// ─────────────────────────────────────────────────────────────────────────────

// Cache the last-created selector per matchId so React-Redux can detect
// that the same selector instance is being passed across renders.
const messagesSelectorCache = {};
const loadingSelectorCache = {};

export const selectMessagesByMatchId = (matchId) => {
   if (!messagesSelectorCache[matchId]) {
      messagesSelectorCache[matchId] = createSelector(
         (state) => state.chat.messagesByMatch[matchId],
         (messages) => messages ?? [],
      );
   }
   return messagesSelectorCache[matchId];
};

export const selectChatLoadingByMatchId = (matchId) => {
   if (!loadingSelectorCache[matchId]) {
      loadingSelectorCache[matchId] = createSelector(
         (state) => state.chat.loadingByMatch[matchId],
         (loading) => loading ?? false,
      );
   }
   return loadingSelectorCache[matchId];
};

// Keep old names as aliases so existing imports don't break
// (just replace the implementation — no need to hunt down every usage)
export const selectMessages = selectMessagesByMatchId;
export const selectChatLoading = selectChatLoadingByMatchId;

export default chatSlice.reducer;
