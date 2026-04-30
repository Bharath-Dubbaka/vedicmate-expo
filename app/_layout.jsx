// app/_layout.jsx
//
// Root layout. Handles fonts, auth session restore, push notifications,
// and RevenueCat initialization — but only after login is confirmed.

// Root layout — wraps everything in ThemeProvider.
// StatusBar now adapts to current theme.

import { useEffect, useRef } from "react";
import { Alert, AppState } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "../store";
import {
  initAuth,
  selectToken,
  selectIsLoading,
  selectOnboardingComplete,
  selectUser,
} from "../store/slices/authSlice";
import {
  useFonts,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
} from "@expo-google-fonts/cinzel";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import {
  registerForPushNotifications,
  subscribeToForegroundNotifications,
  subscribeToNotificationResponse,
  getInitialNotification,
  clearBadgeCount,
} from "../services/notifications";
import { fetchPremiumStatus, resetPremium } from "../store/slices/premiumSlice";
import Constants from "expo-constants";

import Purchases from "react-native-purchases";
// let Purchases = null;
// try {
//   Purchases = require("react-native-purchases").default;
// } catch (e) {
//   console.log("[RC] not available:", e.message);
// }
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://c9539b5c6ceb33f566bd0011e2a3a07d@o4511310075527168.ingest.de.sentry.io/4511310078541904",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

SplashScreen.preventAutoHideAsync();

// Redirects the user to the correct screen based on auth + onboarding state
function NavigationGuard() {
  const router = useRouter();
  const segments = useSegments();
  const token = useSelector(selectToken);
  const loading = useSelector(selectIsLoading);
  const onboardingComplete = useSelector(selectOnboardingComplete);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";
    const inTabs = segments[0] === "(tabs)";
    const isPhotoUpload = segments[1] === "photo-upload";
    if (isPhotoUpload) return;

    if (!token) {
      if (!inAuth) router.replace("/(auth)");
    } else if (!onboardingComplete) {
      if (!inOnboarding) router.replace("/(onboarding)/birth-details");
    } else {
      if (!inTabs) router.replace("/(tabs)/discover");
    }
  }, [token, loading, onboardingComplete, segments]);

  return null;
}

// Handles notification taps and routes to the correct screen
function PushNotificationHandler() {
  const router = useRouter();
  const token = useSelector(selectToken);

  const handleNotificationData = (data) => {
    if (!data || !token) return;
    if (data.type === "match" && data.matchId) router.push("/(tabs)/matches");
    else if (data.type === "message" && data.matchId)
      router.push(`/(tabs)/chat/${data.matchId}`);
    else if (data.type === "liked") router.push("/(tabs)/matches");
  };

  useEffect(() => {
    if (!token) return;
    getInitialNotification().then((data) => {
      if (data && Object.keys(data).length > 0)
        setTimeout(() => handleNotificationData(data), 1000);
    });
    const unsubForeground = subscribeToForegroundNotifications(
      ({ title, body, data }) => {
        Alert.alert(title || "VedicFind", body || "", [
          { text: "Dismiss", style: "cancel" },
          { text: "View", onPress: () => handleNotificationData(data) },
        ]);
      },
    );
    const unsubResponse = subscribeToNotificationResponse(
      handleNotificationData,
    );
    return () => {
      unsubForeground();
      unsubResponse();
    };
  }, [token]);

  return null;
}

// Initializes RevenueCat and fetches premium status only after login.
// Separated into its own component so it re-renders when token changes.
//PRODUCTION
function PremiumInit() {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const user = useSelector(selectUser);
  const prevTokenRef = useRef(null);
  // console.log("[RC] logging in user:", user?.id);

  // separate effect just for RC login
  useEffect(() => {
    if (user?.id) {
      Purchases.logIn(user.id.toString())
        .then(() => console.log("[RC] Logged in user:", user.id))
        .catch((err) => console.warn("[RC] Login error:", err.message));
    }
    if (user?.id) {
      Sentry.setUser({ id: user.id.toString(), email: user.email });
    } else {
      Sentry.setUser(null);
    }
  }, [user?.id]);

  // Configure RC once on mount
  useEffect(() => {
    if (process.env.EXPO_PUBLIC_REVENUECAT_KEY) {
      Purchases.configure({
        apiKey: process.env.EXPO_PUBLIC_REVENUECAT_KEY,
      });
    }
  }, []);

  // Login/logout RC when auth state changes
  useEffect(() => {
    const wasLoggedIn = !!prevTokenRef.current;
    const isNowLoggedIn = !!token;
    prevTokenRef.current = token;

    if (isNowLoggedIn && !wasLoggedIn) {
      dispatch(fetchPremiumStatus());
    } else if (!isNowLoggedIn && wasLoggedIn) {
      // User logged out — reset RC
      Purchases.logOut()
        .then(() => console.log("[RC] Logged out"))
        .catch(() => {});
      dispatch(resetPremium());
    }
  }, [token, user?.id]);

  return null;
}

//EXPO DEV
// function PremiumInit() {
//   const dispatch = useDispatch();
//   const token = useSelector(selectToken);
//   const user = useSelector(selectUser);
//   const prevTokenRef = useRef(null);

//   useEffect(() => {
//     if (Constants.appOwnership === "expo") {
//       console.log("[RC] Expo Go — skipping RC configure");
//       return;
//     }
//     if (process.env.EXPO_PUBLIC_REVENUECAT_KEY) {
//       Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_KEY });
//     }
//   }, []);

//   useEffect(() => {
//     const wasLoggedIn = !!prevTokenRef.current;
//     const isNowLoggedIn = !!token;
//     prevTokenRef.current = token;

//     if (isNowLoggedIn && !wasLoggedIn) {
//       if (Purchases && user?.id) {
//         // ← guard
//         Purchases.logIn(user.id)
//           .then(() => console.log("[RC] Logged in user:", user.id))
//           .catch((err) => console.warn("[RC] Login error:", err.message));
//       }
//       dispatch(fetchPremiumStatus());
//     } else if (!isNowLoggedIn && wasLoggedIn) {
//       if (Purchases) {
//         // ← guard
//         Purchases.logOut()
//           .then(() => console.log("[RC] Logged out"))
//           .catch(() => {});
//       }
//       dispatch(resetPremium());
//     }
//   }, [token, user?.id]);

//   return null;
// }

// Inner app — has access to theme
function InnerApp() {
  const dispatch = useDispatch();
  const loading = useSelector(selectIsLoading);
  const token = useSelector(selectToken);
  const appState = useRef(AppState.currentState);
  const { isDark } = useTheme();

  const [fontsLoaded] = useFonts({
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    dispatch(initAuth());
  }, []);

  useEffect(() => {
    if (!loading && token) registerForPushNotifications();
  }, [loading, token]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      )
        clearBadgeCount();
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!loading && fontsLoaded) SplashScreen.hideAsync();
  }, [loading, fontsLoaded]);

  if (loading || !fontsLoaded) return null;

  return (
    <>
      {/* isDark = Night mode (parchment) → dark content on light bg */}
      <StatusBar style={isDark ? "dark" : "dark"} />
      {/* NetworkBanner intentionally removed */}
      <NavigationGuard />
      <PushNotificationHandler />
      <PremiumInit />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default Sentry.wrap(function RootLayout() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <InnerApp />
      </ThemeProvider>
    </Provider>
  );
});
