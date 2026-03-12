// app/_layout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ROOT LAYOUT — The top-level component of the entire app
//
// React.js vs React Native:
//   - React.js: index.js wraps <App /> with <Provider store={store}>
//   - React Native (Expo Router): _layout.jsx IS the root — wrap it here
//
// Expo Router uses FILE-BASED ROUTING (like Next.js):
//   - app/_layout.jsx     → root layout (this file) — wraps everything
//   - app/(auth)/         → group, maps to "auth" screen group
//   - app/(tabs)/         → group, maps to bottom tabs
//   - Parentheses = "route groups" — they don't appear in the URL/path
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
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

// Prevent splash screen from auto-hiding until fonts + auth are ready
SplashScreen.preventAutoHideAsync();

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION GUARD
// Watches auth state and redirects to the right screen
//
// React.js vs React Native:
//   - React.js: you'd use React Router's <Navigate /> or useNavigate()
//   - Expo Router: use router.replace() — same concept, different API
//   - router.replace() = replace current route (no back button) — like window.location.replace
//   - router.push() = add to stack (back button available) — like window.location.href
// ─────────────────────────────────────────────────────────────────────────────
function NavigationGuard() {
   const router = useRouter();
   const segments = useSegments(); // current route segments, e.g. ["(tabs)", "discover"]

   // useSelector = read from Redux store (same API as React.js!)
   const token = useSelector(selectToken);
   const loading = useSelector(selectIsLoading);
   const onboardingComplete = useSelector(selectOnboardingComplete);

   useEffect(() => {
      // Don't redirect while we're still loading from AsyncStorage
      if (loading) {
         console.log("[NAV GUARD] Still loading auth state, waiting...");
         return;
      }

      const inAuth = segments[0] === "(auth)";
      const inOnboarding = segments[0] === "(onboarding)";
      const inTabs = segments[0] === "(tabs)";

      console.log(
         `[NAV GUARD] token=${!!token}, onboarding=${onboardingComplete}, segment=${segments[0]}`,
      );

      if (!token) {
         // Not logged in → auth screens
         if (!inAuth) {
            console.log("[NAV GUARD] No token → redirecting to auth");
            router.replace("/(auth)");
         }
      } else if (!onboardingComplete) {
         // Logged in but hasn't completed onboarding → birth details
         if (!inOnboarding) {
            console.log(
               "[NAV GUARD] Onboarding incomplete → redirecting to birth-details",
            );
            router.replace("/(onboarding)/birth-details");
         }
      } else {
         // Fully set up → main app
         if (!inTabs) {
            console.log("[NAV GUARD] All good → redirecting to discover tab");
            router.replace("/(tabs)/discover");
         }
      }
   }, [token, loading, onboardingComplete, segments]);

   return null; // renders nothing — pure logic component
}

// ─────────────────────────────────────────────────────────────────────────────
// INNER APP — rendered inside Redux Provider
// We split this out because hooks (useDispatch, useSelector) must be inside Provider
// ─────────────────────────────────────────────────────────────────────────────
function InnerApp() {
   const dispatch = useDispatch();
   const loading = useSelector(selectIsLoading);

   // Load custom fonts
   // React.js: you'd use @font-face in CSS
   // React Native: fonts must be loaded via expo-font before use
   const [fontsLoaded] = useFonts({
      Cinzel_600SemiBold,
      Cinzel_700Bold,
      Nunito_400Regular,
      Nunito_600SemiBold,
      Nunito_700Bold,
   });

   // On app mount: check AsyncStorage for saved session
   useEffect(() => {
      console.log("[ROOT LAYOUT] App mounted — initializing auth...");
      dispatch(initAuth());
   }, []);

   // Hide splash screen once fonts AND auth are ready
   useEffect(() => {
      if (!loading && fontsLoaded) {
         console.log("[ROOT LAYOUT] Ready — hiding splash screen");
         SplashScreen.hideAsync();
      }
   }, [loading, fontsLoaded]);

   // Keep splash visible while loading
   if (loading || !fontsLoaded) {
      return null;
   }

   return (
      <>
         <StatusBar style="light" />
         <NavigationGuard />
         {/*
        Stack = a navigation stack (like a browser history stack)
        React.js: Back button = browser back
        React Native: Back button = Android hardware back / iOS swipe left
        
        screenOptions.animation="fade" = cross-fade between screens (no slide)
        headerShown: false = we build our own headers
      */}
         <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
         </Stack>
      </>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT — wrap everything with Redux Provider
// ─────────────────────────────────────────────────────────────────────────────
export default function RootLayout() {
   return (
      // Provider makes the Redux store available to ALL child components
      // Same as React.js — <Provider store={store}><App /></Provider>
      <Provider store={store}>
         <InnerApp />
      </Provider>
   );
}
