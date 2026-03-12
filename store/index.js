// store/index.js
// ─────────────────────────────────────────────────────────────────────────────
// REDUX TOOLKIT STORE
//
// React.js vs React Native note:
//   Redux RTK works EXACTLY the same in React Native as in React.js!
//   The store, slices, thunks — 100% identical.
//   The only difference: we use AsyncStorage (from React Native) instead of
//   localStorage (which doesn't exist in React Native).
//
// Why RTK over Zustand?
//   - Redux DevTools (you can inspect state in Flipper/browser devtools)
//   - createAsyncThunk handles loading/error states automatically
//   - RTK Query (future) for auto-caching API calls
//   - More structured — better for team projects
// ─────────────────────────────────────────────────────────────────────────────

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import discoverReducer from "./slices/discoverSlice";
import matchesReducer from "./slices/matchesSlice";
import chatReducer from "./slices/chatSlice";

export const store = configureStore({
   reducer: {
      auth: authReducer, // user session, token, onboarding state
      discover: discoverReducer, // swipe deck profiles
      matches: matchesReducer, // matched users list
      chat: chatReducer, // messages per match
   },
   middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
         // AsyncStorage operations are async so we allow non-serializable values
         // (Date objects from API responses)
         serializableCheck: {
            ignoredActions: ["auth/setAuth", "chat/addMessage"],
            ignoredPaths: ["chat.messages"],
         },
      }),
});

// ── TypeScript-style exports for useSelector/useDispatch ─────────────────────
// In React Native + JS, these are just re-exports — useful to have
export const getState = store.getState;
export const dispatch = store.dispatch;
