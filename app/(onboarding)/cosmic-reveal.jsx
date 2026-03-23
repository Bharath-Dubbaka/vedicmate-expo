// app/(onboarding)/cosmic-reveal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// COSMIC REVEAL — The "wow" screen that shows users their Nakshatra
//
// This is 100% live data from your API — no mocks.
// The Nakshatra was computed on the backend using the Meeus algorithm.
//
// About the calculation authenticity:
//   Your backend uses Lahiri Ayanamsa — the SAME standard used by:
//     - Drik Panchang (most popular Indian astrology site)
//     - Astrosage
//     - Government of India's published panchang
//   The Gana, Nadi, Yoni, Varna attributes are canonical Vedic lookup tables
//   that have been standardized for centuries — no variation across regions.
//   The main regional variation is which AYANAMSA is used (Lahiri vs Krishnamurti).
//   Lahiri (also called Chitrapaksha) is the most widely accepted.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Animated,
   Dimensions,
   ScrollView,
   ActivityIndicator,
   Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { updateUser, selectUser } from "../../store/slices/authSlice";
import { onboardingAPI, authAPI } from "../../services/api";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

const { width } = Dimensions.get("window");

// ── Gana display config ────────────────────────────────────────────────────────
const GANA_CONFIG = {
   Deva: {
      color: "#A78BFA",
      bg: "rgba(167, 139, 250, 0.15)",
      emoji: "✨",
      title: "Divine Soul",
      description:
         "You carry celestial grace. Naturally compassionate, spiritually inclined, and harmonious in relationships.",
   },
   Manushya: {
      color: "#60A5FA",
      bg: "rgba(96, 165, 250, 0.15)",
      emoji: "🤝",
      title: "Human Soul",
      description:
         "Balanced between heart and mind. Practical, warm, and deeply loyal to those you love.",
   },
   Rakshasa: {
      color: "#F87171",
      bg: "rgba(248, 113, 113, 0.15)",
      emoji: "🔥",
      title: "Fierce Soul",
      description:
         "Intense, passionate, and independent. Magnetic energy that challenges everyone around you to grow.",
   },
};

// ── Nadi descriptions ─────────────────────────────────────────────────────────
const NADI_INFO = {
   Vata: {
      emoji: "🌬️",
      element: "Air",
      desc: "Quick mind, creative, adaptable",
   },
   Pitta: { emoji: "🔥", element: "Fire", desc: "Passionate, focused, driven" },
   Kapha: { emoji: "🌊", element: "Water", desc: "Calm, nurturing, steadfast" },
};

// ── Koota breakdown display ───────────────────────────────────────────────────
const KOOTA_ORDER = [
   {
      key: "nadi",
      name: "Nadi",
      max: 8,
      emoji: "🌊",
      desc: "Health & genetics — most critical",
   },
   {
      key: "bhakoot",
      name: "Bhakoot",
      max: 7,
      emoji: "🌕",
      desc: "Emotional & financial compatibility",
   },
   {
      key: "gana",
      name: "Gana",
      max: 6,
      emoji: "✨",
      desc: "Temperament & personality",
   },
   {
      key: "grahaMaitri",
      name: "Graha Maitri",
      max: 5,
      emoji: "🪐",
      desc: "Mental & intellectual bond",
   },
   {
      key: "yoni",
      name: "Yoni",
      max: 4,
      emoji: "🐾",
      desc: "Physical compatibility",
   },
   {
      key: "tara",
      name: "Tara",
      max: 3,
      emoji: "⭐",
      desc: "Destiny & birth star harmony",
   },
   {
      key: "vashya",
      name: "Vashya",
      max: 2,
      emoji: "💫",
      desc: "Mutual attraction",
   },
   {
      key: "varna",
      name: "Varna",
      max: 1,
      emoji: "📿",
      desc: "Spiritual alignment",
   },
];

export default function CosmicRevealScreen() {
   const dispatch = useDispatch();
   const router = useRouter();
   const user = useSelector(selectUser);

   const [profile, setProfile] = useState(null); // cosmic profile from API
   const [loading, setLoading] = useState(true);
   const [completing, setCompleting] = useState(false);

   // ── Animation refs ────────────────────────────────────────────────────────
   // Animated.Value = like a reactive variable that drives animations
   const orbitAnim = useRef(new Animated.Value(0)).current;
   const scaleAnim = useRef(new Animated.Value(0)).current;
   const fadeAnim = useRef(new Animated.Value(0)).current;
   const cardSlideAnim = useRef(new Animated.Value(60)).current;
   const shimmerAnim = useRef(new Animated.Value(0)).current;

   useEffect(() => {
      console.log("[COSMIC REVEAL] Component mounted, loading profile...");

      // Orbit ring spins continuously
      Animated.loop(
         Animated.timing(orbitAnim, {
            toValue: 1,
            duration: 10000,
            useNativeDriver: true,
         }),
      ).start();

      // Shimmer loop on nakshatra name
      Animated.loop(
         Animated.sequence([
            Animated.timing(shimmerAnim, {
               toValue: 1,
               duration: 1500,
               useNativeDriver: true,
            }),
            Animated.timing(shimmerAnim, {
               toValue: 0.6,
               duration: 1500,
               useNativeDriver: true,
            }),
         ]),
      ).start();

      loadCosmicProfile();
   }, []);

   // ── Fetch cosmic profile from API ─────────────────────────────────────────
   const loadCosmicProfile = async () => {
      try {
         console.log("[COSMIC REVEAL] Fetching cosmic profile from API...");
         const res = await onboardingAPI.getCosmicProfile();
         const cosmicProfile = res.data.cosmicProfile;

         console.log(
            `[COSMIC REVEAL] Got profile: ${cosmicProfile.nakshatra} | ${cosmicProfile.gana} | Nadi: ${cosmicProfile.nadi}`,
         );

         setProfile(cosmicProfile);
         setLoading(false);

         // Start reveal animation after a short delay (dramatic effect)
         setTimeout(() => {
            revealAnimation();
         }, 300);
      } catch (err) {
         console.error("[COSMIC REVEAL] Failed to load profile:", err.message);
         // If API fails, it means onboarding data wasn't saved — go back
         Alert.alert(
            "Calculation Error",
            "Unable to compute your Kundli. Please go back and re-enter your birth details.",
            [{ text: "Go Back", onPress: () => router.back() }],
         );
         setLoading(false);
      }
   };

   // ── Reveal animation sequence ─────────────────────────────────────────────
   const revealAnimation = () => {
      console.log("[COSMIC REVEAL] Starting reveal animation");
      Animated.parallel([
         // Spring = bouncy physics animation (like CSS spring easing)
         // friction = how quickly it settles (lower = more bouncy)
         // tension = stiffness (higher = faster)
         Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
         }),
         Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
         }),
         Animated.spring(cardSlideAnim, {
            toValue: 0,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
         }),
      ]).start(() => {
         console.log("[COSMIC REVEAL] Animation complete");
      });
   };

   // ── Complete onboarding ───────────────────────────────────────────────────
   // We need to explicitly push to photo-upload BEFORE onboarding is marked complete.

   const handleComplete = async () => {
      try {
         setCompleting(true);

         await onboardingAPI.complete();

         // ── Navigate to photo upload FIRST, before Redux knows onboarding is complete ──
         // If we dispatch updateUser(freshUser) first, NavigationGuard sees
         // onboardingComplete:true and immediately redirects to discover,
         // skipping the photo upload screen entirely.
         router.replace("/(onboarding)/photo-upload");

         // Then update Redux in the background — NavigationGuard won't fire again
         // because we're already on an onboarding route
         const { authAPI } = await import("../../services/api");
         const meRes = await authAPI.getMe();
         const freshUser = meRes.data.user;
         console.log(
            "[COSMIC REVEAL] Fresh user from /me — prefs:",
            JSON.stringify(freshUser.preferences),
         );

         await dispatch(updateUser(freshUser));
      } catch (err) {
         console.error(
            "[COSMIC REVEAL] Complete onboarding error:",
            err.message,
         );
         router.replace("/(onboarding)/photo-upload");
         await dispatch(updateUser({ onboardingComplete: true }));
      } finally {
         setCompleting(false);
      }
   };

   // ── Orbit rotation interpolation ──────────────────────────────────────────
   const orbitRotate = orbitAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
      // interpolate maps one range to another — like CSS transform: rotate
   });

   const nakshatraOpacity = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.7, 1],
   });

   if (loading) {
      return (
         <View style={[styles.container, styles.centered]}>
            <ActivityIndicator color={COLORS.gold} size="large" />
            <Text style={styles.loadingTitle}>Reading the stars...</Text>
            <Text style={styles.loadingSubtitle}>
               Computing your Nakshatra using Meeus algorithm + Lahiri ayanamsa
            </Text>
         </View>
      );
   }

   if (!profile) return null;

   const gc = GANA_CONFIG[profile.gana] || GANA_CONFIG.Manushya;
   const nadiInfo = NADI_INFO[profile.nadi] || {};

   return (
      <View style={styles.container}>
         <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
         >
            {/* ── Orbit Animation ─────────────────────────────────────────────── */}
            <View style={styles.orbitContainer}>
               {/* Rotating ring with dots */}
               <Animated.View
                  style={[
                     styles.orbitRing,
                     { transform: [{ rotate: orbitRotate }] },
                  ]}
               >
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                     <View
                        key={i}
                        style={[
                           styles.orbitDot,
                           {
                              transform: [
                                 { rotate: `${i * 45}deg` },
                                 { translateY: -65 },
                              ],
                           },
                        ]}
                     />
                  ))}
               </Animated.View>

               {/* Central orb */}
               <Animated.View
                  style={[
                     styles.centerOrb,
                     {
                        backgroundColor: gc.bg,
                        borderColor: gc.color,
                        transform: [{ scale: scaleAnim }],
                     },
                  ]}
               >
                  <Text style={{ fontSize: 44 }}>🔮</Text>
               </Animated.View>
            </View>

            {/* ── Nakshatra Reveal ─────────────────────────────────────────────── */}
            <Animated.View
               style={[styles.nakshatraSection, { opacity: fadeAnim }]}
            >
               <Text style={styles.revealLabel}>YOUR NAKSHATRA</Text>
               <Animated.Text
                  style={[styles.nakshatraName, { opacity: nakshatraOpacity }]}
               >
                  {profile.nakshatra}
               </Animated.Text>
               <Text style={styles.rashiText}>
                  {profile.rashi} Moon · Pada {profile.pada}
               </Text>

               {/* Gana badge */}
               <View
                  style={[
                     styles.ganaBadge,
                     { backgroundColor: gc.bg, borderColor: gc.color },
                  ]}
               >
                  <Text style={{ fontSize: 18 }}>{gc.emoji}</Text>
                  <Text style={[styles.ganaTitle, { color: gc.color }]}>
                     {gc.title}
                  </Text>
               </View>
            </Animated.View>

            {/* ── Main Info Card ────────────────────────────────────────────────── */}
            <Animated.View
               style={[
                  styles.infoCard,
                  {
                     borderColor: gc.color,
                     opacity: fadeAnim,
                     transform: [{ translateY: cardSlideAnim }],
                  },
               ]}
            >
               {/* Gana description */}
               <View style={[styles.ganaDescBox, { backgroundColor: gc.bg }]}>
                  <Text style={[styles.ganaDescText, { color: gc.color }]}>
                     {gc.description}
                  </Text>
               </View>

               {/* Stats grid */}
               <View style={styles.statsGrid}>
                  {[
                     {
                        emoji: "🐾",
                        label: "Yoni Animal",
                        value: profile.animal,
                     },
                     {
                        emoji: nadiInfo.emoji || "🌊",
                        label: "Nadi (Dosha type)",
                        value: `${profile.nadi} · ${nadiInfo.element || ""}`,
                     },
                     { emoji: "📿", label: "Varna", value: profile.varna },
                     {
                        emoji: "🪐",
                        label: "Ruling Planet",
                        value: profile.lordPlanet,
                     },
                  ].map((stat) => (
                     <View key={stat.label} style={styles.statBox}>
                        <Text style={styles.statEmoji}>{stat.emoji}</Text>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                     </View>
                  ))}
               </View>

               {/* Personality blurb */}
               <View style={styles.personalityBox}>
                  <Text style={styles.personalityLabel}>
                     ✦ YOUR COSMIC PERSONALITY
                  </Text>
                  <Text style={styles.personalityText}>
                     {profile.personality}
                  </Text>
               </View>

               {/* Nadi dosha explanation */}
               <View style={styles.infoBox}>
                  <Text style={styles.infoBoxEmoji}>💡</Text>
                  <View style={{ flex: 1 }}>
                     <Text style={styles.infoBoxTitle}>
                        About Nadi ({profile.nadi})
                     </Text>
                     <Text style={styles.infoBoxText}>
                        {nadiInfo.desc}. Nadi Koota carries 8 points — the
                        highest weight in Guna Milan. Partners with different
                        Nadis score full marks here. This ensures genetic
                        compatibility.
                     </Text>
                  </View>
               </View>
            </Animated.View>

            {/* ── Koota Weights Explanation ─────────────────────────────────────── */}
            <Animated.View style={[styles.kootaCard, { opacity: fadeAnim }]}>
               <Text style={styles.kootaTitle}>
                  HOW YOUR SCORE IS CALCULATED
               </Text>
               <Text style={styles.kootaSubtitle}>
                  Ashta Koota — 8 dimensions of cosmic compatibility (36 points
                  total)
               </Text>
               {KOOTA_ORDER.map((k) => (
                  <View key={k.key} style={styles.kootaRow}>
                     <Text style={styles.kootaEmoji}>{k.emoji}</Text>
                     <View style={{ flex: 1 }}>
                        <View style={styles.kootaRowTop}>
                           <Text style={styles.kootaName}>{k.name}</Text>
                           <Text style={styles.kootaMax}>{k.max} pts</Text>
                        </View>
                        <Text style={styles.kootaDesc}>{k.desc}</Text>
                        {/* Weight bar */}
                        <View style={styles.kootaBarTrack}>
                           <View
                              style={[
                                 styles.kootaBarFill,
                                 {
                                    width: `${(k.max / 8) * 100}%`,
                                    backgroundColor: COLORS.gold,
                                    opacity: 0.3 + (k.max / 8) * 0.7,
                                 },
                              ]}
                           />
                        </View>
                     </View>
                  </View>
               ))}
            </Animated.View>

            {/* ── CTA ───────────────────────────────────────────────────────────── */}
            <Animated.View style={[styles.ctaSection, { opacity: fadeAnim }]}>
               <TouchableOpacity
                  style={[styles.ctaBtn, completing && styles.ctaBtnDisabled]}
                  onPress={handleComplete}
                  disabled={completing}
               >
                  {completing ? (
                     <ActivityIndicator color={COLORS.bg} />
                  ) : (
                     <Text style={styles.ctaBtnText}>
                        Find My Cosmic Match 🔮
                     </Text>
                  )}
               </TouchableOpacity>
               <Text style={styles.ctaSubtext}>
                  Your Kundli is ready. The stars will guide you to your match.
               </Text>
            </Animated.View>

            <View style={{ height: 60 }} />
         </ScrollView>
      </View>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: COLORS.bg },
   centered: {
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: SPACING.xl,
   },
   scroll: {
      alignItems: "center",
      paddingTop: 60,
      paddingHorizontal: SPACING.xl,
   },
   loadingTitle: {
      fontFamily: FONTS.heading,
      fontSize: 20,
      color: COLORS.textPrimary,
      marginTop: SPACING.lg,
      textAlign: "center",
   },
   loadingSubtitle: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textSecondary,
      marginTop: SPACING.sm,
      textAlign: "center",
      lineHeight: 20,
   },
   orbitContainer: {
      width: 150,
      height: 150,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.xl,
   },
   orbitRing: {
      position: "absolute",
      width: 140,
      height: 140,
      alignItems: "center",
      justifyContent: "center",
   },
   orbitDot: {
      position: "absolute",
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: COLORS.gold,
      opacity: 0.7,
   },
   centerOrb: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
   },
   nakshatraSection: { alignItems: "center", marginBottom: SPACING.xl },
   revealLabel: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.gold,
      letterSpacing: 4,
      marginBottom: SPACING.sm,
   },
   nakshatraName: {
      fontFamily: FONTS.headingBold,
      fontSize: 36,
      color: COLORS.textPrimary,
      textAlign: "center",
      letterSpacing: 2,
   },
   rashiText: {
      fontFamily: FONTS.body,
      fontSize: 15,
      color: COLORS.textSecondary,
      marginTop: SPACING.xs,
      marginBottom: SPACING.md,
   },
   ganaBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.full,
      borderWidth: 1,
   },
   ganaTitle: {
      fontFamily: FONTS.bodyBold,
      fontSize: 16,
   },
   infoCard: {
      width: "100%",
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
   },
   ganaDescBox: {
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.lg,
   },
   ganaDescText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
      fontStyle: "italic",
   },
   statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: SPACING.lg,
   },
   statBox: {
      width: "50%",
      alignItems: "center",
      paddingVertical: SPACING.md,
   },
   statEmoji: { fontSize: 24, marginBottom: 4 },
   statValue: {
      fontFamily: FONTS.bodyBold,
      fontSize: 15,
      color: COLORS.textPrimary,
      textAlign: "center",
   },
   statLabel: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textSecondary,
      marginTop: 2,
      textAlign: "center",
   },
   personalityBox: {
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.md,
   },
   personalityLabel: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.gold,
      letterSpacing: 2,
      marginBottom: SPACING.sm,
      textAlign: "center",
   },
   personalityText: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textSecondary,
      lineHeight: 22,
      textAlign: "center",
      fontStyle: "italic",
   },
   infoBox: {
      flexDirection: "row",
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      gap: SPACING.sm,
   },
   infoBoxEmoji: { fontSize: 18 },
   infoBoxTitle: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 13,
      color: COLORS.textPrimary,
      marginBottom: 2,
   },
   infoBoxText: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
      lineHeight: 18,
   },
   kootaCard: {
      width: "100%",
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
   },
   kootaTitle: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.gold,
      letterSpacing: 3,
      marginBottom: SPACING.xs,
   },
   kootaSubtitle: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
      marginBottom: SPACING.lg,
      lineHeight: 18,
   },
   kootaRow: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginBottom: SPACING.md,
   },
   kootaEmoji: { fontSize: 18, width: 24, marginTop: 2 },
   kootaRowTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 2,
   },
   kootaName: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 13,
      color: COLORS.textPrimary,
   },
   kootaMax: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.gold,
   },
   kootaDesc: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textSecondary,
      marginBottom: SPACING.xs,
   },
   kootaBarTrack: {
      height: 4,
      backgroundColor: COLORS.border,
      borderRadius: 2,
      overflow: "hidden",
   },
   kootaBarFill: {
      height: 4,
      borderRadius: 2,
   },
   ctaSection: { width: "100%", alignItems: "center" },
   ctaBtn: {
      backgroundColor: COLORS.gold,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md + 4,
      paddingHorizontal: SPACING.xxl,
      alignItems: "center",
      elevation: 8,
      marginBottom: SPACING.md,
      width: "100%",
   },
   ctaBtnDisabled: { opacity: 0.6 },
   ctaBtnText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 17,
      color: COLORS.bg,
   },
   ctaSubtext: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textDim,
      textAlign: "center",
      fontStyle: "italic",
   },
});
