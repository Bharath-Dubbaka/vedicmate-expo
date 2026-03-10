// app/_layout.jsx
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "../store/authStore";
import { useFonts, Cinzel_600SemiBold, Cinzel_700Bold } from "@expo-google-fonts/cinzel";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from "@expo-google-fonts/nunito";

SplashScreen.preventAutoHideAsync();

function NavigationGuard() {
  const { user, token, loading } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";
    const inTabs = segments[0] === "(tabs)";

    if (!token) {
      // Not logged in → go to auth
      if (!inAuth) router.replace("/(auth)");
    } else if (!user?.onboardingComplete) {
      // Logged in but no onboarding → go to onboarding
      if (!inOnboarding) router.replace("/(onboarding)/birth-details");
    } else {
      // Fully set up → go to tabs
      if (!inTabs) router.replace("/(tabs)/discover");
    }
  }, [user, token, loading, segments]);

  return null;
}

export default function RootLayout() {
  const { init, loading } = useAuthStore();

  const [fontsLoaded] = useFonts({
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!loading && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loading, fontsLoaded]);

  if (loading || !fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <NavigationGuard />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}