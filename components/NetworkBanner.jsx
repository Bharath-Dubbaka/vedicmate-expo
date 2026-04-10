// components/NetworkBanner.jsx
import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useNetworkStatus } from "../app/hooks/useNetworkStatus";
import { COLORS, FONTS, SPACING } from "../constants/theme";

export default function NetworkBanner() {
   const { isConnected, isChecking } = useNetworkStatus();
   const slideAnim = useRef(new Animated.Value(-60)).current;
   const wasConnected = useRef(true);

   useEffect(() => {
      if (isChecking) return;

      if (!isConnected) {
         wasConnected.current = false;
         Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
         }).start();
      } else {
         if (!wasConnected.current) {
            // Was offline, now back online — show briefly then hide
            wasConnected.current = true;
            Animated.sequence([
               Animated.spring(slideAnim, {
                  toValue: 0,
                  useNativeDriver: true,
                  friction: 8,
               }),
               Animated.delay(2000),
               Animated.spring(slideAnim, {
                  toValue: -60,
                  useNativeDriver: true,
                  friction: 8,
               }),
            ]).start();
         } else {
            Animated.spring(slideAnim, {
               toValue: -60,
               useNativeDriver: true,
               friction: 8,
            }).start();
         }
      }
   }, [isConnected, isChecking]);

   if (isChecking) return null;

   return (
      <Animated.View
         style={[
            styles.banner,
            { transform: [{ translateY: slideAnim }] },
            isConnected ? styles.bannerOnline : styles.bannerOffline,
         ]}
      >
         <Text style={styles.text}>
            {isConnected ? "✅ Back online" : "⚠️ No internet connection"}
         </Text>
      </Animated.View>
   );
}

const styles = StyleSheet.create({
   banner: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 999,
      paddingTop: 50,
      paddingBottom: SPACING.sm,
      alignItems: "center",
   },
   bannerOffline: {
      backgroundColor: "#E05C5C",
   },
   bannerOnline: {
      backgroundColor: "#4CAF50",
   },
   text: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 13,
      color: "#fff",
   },
});
