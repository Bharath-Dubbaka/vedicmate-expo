// store/slices/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { chatAPI } from "../../services/api";

const initialState = {
   // messages is a map: { [matchId]: [...messages] }
   // This way we cache messages for multiple chats
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
      // Add a single message (from socket or sent by user)
      addMessage: (state, action) => {
         const { matchId, message } = action.payload;
         if (!state.messagesByMatch[matchId]) {
            state.messagesByMatch[matchId] = [];
         }
         // Avoid duplicates (check by _id)
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

export const selectMessages = (matchId) => (state) =>
   state.chat.messagesByMatch[matchId] || [];
export const selectChatLoading = (matchId) => (state) =>
   state.chat.loadingByMatch[matchId] || false;

export default chatSlice.reducer;
