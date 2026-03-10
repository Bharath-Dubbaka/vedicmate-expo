// app/(auth)/index.jsx
import { useEffect, useRef } from "react";
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Animated,
   Dimensions,
   Alert,
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

const STARS = Array.from({ length: 40 }, (_, i) => ({
   id: i,
   top: Math.random() * height,
   left: Math.random() * width,
   size: Math.random() * 2.5 + 0.5,
   opacity: Math.random() * 0.6 + 0.2,
}));

export default function AuthScreen() {
   const { setAuth } = useAuthStore();

   const fadeAnim = useRef(new Animated.Value(0)).current;
   const slideAnim = useRef(new Animated.Value(40)).current;
   const glowAnim = useRef(new Animated.Value(0)).current;
   const pulseAnim = useRef(new Animated.Value(1)).current;

   useEffect(() => {
      Animated.parallel([
         Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
         Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true, delay: 200 }),
      ]).start();

      Animated.loop(
         Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
         ]),
      ).start();

      Animated.loop(
         Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.03, duration: 1500, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
         ]),
      ).start();
   }, []);

   // DEV BYPASS — skips Google OAuth entirely
   const handleDevLogin = async () => {
      const mockUser = {
         id: "dev_user_001",
         name: "Bharath Dev",
         email: "bharath.dubbaka39@gmail.com",
         avatar: null,
         onboardingComplete: false,
      };
      const mockToken = "dev_token_bypass_123";
      await setAuth(mockToken, mockUser);
   };

   const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

   return (
      <View style={styles.container}>
         {STARS.map((star) => (
            <View
               key={star.id}
               style={[styles.star, {
                  top: star.top, left: star.left,
                  width: star.size, height: star.size,
                  opacity: star.opacity,
               }]}
            />
         ))}

         <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

         <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.logoRing}>
               <Text style={styles.logoEmoji}>🔮</Text>
            </View>

            <Text style={styles.appName}>COSMIC MATCH</Text>
            <Text style={styles.tagline}>Vedic compatibility, redefined</Text>

            <View style={styles.divider}>
               <View style={styles.dividerLine} />
               <Text style={styles.dividerText}>✦</Text>
               <View style={styles.dividerLine} />
            </View>

            <View style={styles.pills}>
               {["🐾 Yoni Match", "✨ Guna Milan", "🔯 36 Point Score"].map((pill) => (
                  <View key={pill} style={styles.pill}>
                     <Text style={styles.pillText}>{pill}</Text>
                  </View>
               ))}
            </View>

            {/* DEV BYPASS BUTTON */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }], width: "100%" }}>
               <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={handleDevLogin}
                  activeOpacity={0.85}
               >
                  <Text style={styles.googleIcon}>🚀</Text>
                  <Text style={styles.googleBtnText}>Continue (Dev Mode)</Text>
               </TouchableOpacity>
            </Animated.View>

            {/* REAL GOOGLE BTN — commented out until OAuth is fixed */}
            {/* <TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()} disabled={!request}>
               <Text style={styles.googleIcon}>G</Text>
               <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity> */}

            <Text style={styles.disclaimer}>
               Dev bypass active — Google OAuth setup pending
            </Text>
         </Animated.View>

         <Text style={styles.bottomText}>नक्षत्र • राशि • गण</Text>
      </View>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: SPACING.xl },
   star: { position: "absolute", borderRadius: 99, backgroundColor: "#FFFFFF" },
   glow: { position: "absolute", width: 320, height: 320, borderRadius: 160, backgroundColor: COLORS.gold, top: height * 0.25, alignSelf: "center" },
   content: { width: "100%", alignItems: "center", zIndex: 2 },
   logoRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 1.5, borderColor: COLORS.gold, alignItems: "center", justifyContent: "center", marginBottom: SPACING.lg, backgroundColor: COLORS.bgElevated },
   logoEmoji: { fontSize: 44 },
   appName: { fontFamily: FONTS.headingBold, fontSize: 28, color: COLORS.gold, letterSpacing: 6, marginBottom: SPACING.sm },
   tagline: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.textSecondary, letterSpacing: 1.5, marginBottom: SPACING.xl },
   divider: { flexDirection: "row", alignItems: "center", width: "60%", marginBottom: SPACING.xl },
   dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
   dividerText: { color: COLORS.goldDim, marginHorizontal: SPACING.sm, fontSize: 12 },
   pills: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: SPACING.sm, marginBottom: SPACING.xxl },
   pill: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, backgroundColor: COLORS.bgCard },
   pillText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.textSecondary, letterSpacing: 0.5 },
   googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.gold, borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 2, width: "100%", gap: SPACING.sm, elevation: 10 },
   googleIcon: { fontSize: 20 },
   googleBtnText: { fontFamily: FONTS.bodyBold, fontSize: 16, color: COLORS.bg, letterSpacing: 0.5 },
   disclaimer: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.textDim, marginTop: SPACING.md, textAlign: "center" },
   bottomText: { position: "absolute", bottom: SPACING.xl, fontFamily: FONTS.body, fontSize: 12, color: COLORS.textDim, letterSpacing: 3 },
});