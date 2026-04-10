// app/_layout.jsx
//
// Root layout. Handles fonts, auth session restore, push notifications,
// and RevenueCat initialization — but only after login is confirmed.

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
import Purchases from "react-native-purchases";
import NetworkBanner from "../components/NetworkBanner";

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
      // photo-upload is a post-onboarding step, allowed even when
      // onboardingComplete is true
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

   // Handle notification tap → navigate
   const handleNotificationData = (data) => {
      if (!data || !token) return;

      console.log("[PUSH HANDLER] Handling notification tap:", data);

      // data.type set by backend when sending push
      if (data.type === "match" && data.matchId) {
         // New match → go to matches tab
         router.push("/(tabs)/matches");
      } else if (data.type === "message" && data.matchId) {
         // New message → go directly to chat
         router.push(`/(tabs)/chat/${data.matchId}`);
      } else if (data.type === "liked") {
         // Someone liked you → go to swipe history
         router.push("/(tabs)/matches");
      }
   };

   useEffect(() => {
      if (!token) return;

      // Check if app was opened by tapping a notification (cold start)
      getInitialNotification().then((data) => {
         if (data && Object.keys(data).length > 0) {
            console.log("[PUSH HANDLER] Cold start notification:", data);
            // Small delay to let navigation settle after auth
            setTimeout(() => handleNotificationData(data), 1000);
         }
      });

      // Foreground notification: show an in-app Alert
      // (system banner won't show when app is open on some OS versions)
      const unsubForeground = subscribeToForegroundNotifications(
         ({ title, body, data }) => {
            Alert.alert(title || "VedicMate", body || "", [
               { text: "Dismiss", style: "cancel" },
               { text: "View", onPress: () => handleNotificationData(data) },
            ]);
         },
      );

      // Background/killed tap handler
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
function PremiumInit() {
   const dispatch = useDispatch();
   const token = useSelector(selectToken);
   const user = useSelector(selectUser);
   const prevTokenRef = useRef(null);

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
         // User just logged in — identify them in RC
         if (user?.id) {
            Purchases.logIn(user.id)
               .then(() => console.log("[RC] Logged in user:", user.id))
               .catch((err) => console.warn("[RC] Login error:", err.message));
         }
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

// Core app setup: fonts, auth restore, push registration, badge clearing
function InnerApp() {
   const dispatch = useDispatch();
   const loading = useSelector(selectIsLoading);
   const token = useSelector(selectToken);
   const appState = useRef(AppState.currentState);

   const [fontsLoaded] = useFonts({
      Cinzel_600SemiBold,
      Cinzel_700Bold,
      Nunito_400Regular,
      Nunito_600SemiBold,
      Nunito_700Bold,
   });

   // Restore session from AsyncStorage on app launch
   useEffect(() => {
      console.log("[ROOT LAYOUT] App mounted — initializing auth...");
      dispatch(initAuth());
   }, []);

   // Register for push notifications after auth is confirmed
   useEffect(() => {
      if (!loading && token) {
         console.log("[ROOT LAYOUT] Auth ready — registering for push...");
         registerForPushNotifications();
      }
   }, [loading, token]);

   // Clear notification badge count when app comes to foreground
   useEffect(() => {
      const sub = AppState.addEventListener("change", (nextState) => {
         if (
            appState.current.match(/inactive|background/) &&
            nextState === "active"
         ) {
            clearBadgeCount();
         }
         appState.current = nextState;
      });
      return () => sub.remove();
   }, []);

   // Hide splash screen once fonts and auth check are both complete
   useEffect(() => {
      if (!loading && fontsLoaded) {
         console.log("[ROOT LAYOUT] Ready — hiding splash screen");
         SplashScreen.hideAsync();
      }
   }, [loading, fontsLoaded]);

   if (loading || !fontsLoaded) return null;

   return (
      <>
         <StatusBar style="light" />
         <NetworkBanner />
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
export default function RootLayout() {
   return (
      <Provider store={store}>
         <InnerApp />
      </Provider>
   );
}
