// app/_layout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// SPRINT 2 UPDATE:
//   - Push notification registration after auth init
//   - Foreground notification listener (in-app toast via Alert)
//   - Notification tap handler → navigate to correct screen
//   - Badge clear on app foreground
// ─────────────────────────────────────────────────────────────────────────────

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

SplashScreen.preventAutoHideAsync();

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION GUARD — same logic as Sprint 1, unchanged
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// PUSH NOTIFICATION HANDLER — listens for taps and routes appropriately
// ─────────────────────────────────────────────────────────────────────────────
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
         router.push("/(tabs)/swipe-history");
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
               {
                  text: "View",
                  onPress: () => handleNotificationData(data),
               },
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

// ─────────────────────────────────────────────────────────────────────────────
// INNER APP — inside Provider; handles fonts, auth init, push registration
// ─────────────────────────────────────────────────────────────────────────────
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

   // On app mount: restore session from AsyncStorage
   useEffect(() => {
      console.log("[ROOT LAYOUT] App mounted — initializing auth...");
      dispatch(initAuth());
   }, []);

   // Once auth is confirmed AND user is logged in → register for push
   useEffect(() => {
      if (!loading && token) {
         console.log("[ROOT LAYOUT] Auth ready — registering for push...");
         registerForPushNotifications();
      }
   }, [loading, token]);

   // Clear badge count when app comes to foreground
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

   // Hide splash once fonts + auth are ready
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
         <NavigationGuard />
         <PushNotificationHandler />
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
