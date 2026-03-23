// components/SwipeLimitBanner.jsx
// ─────────────────────────────────────────────────────────────────────────────
// SPRINT 3 — Swipe limit banner for the Discover screen
//
// Shows remaining swipes for free users. At 0, shows the upgrade prompt.
// Premium users see nothing (returns null).
//
// HOW TO ADD TO discover.jsx:
//   1. Import at top:
//      import SwipeLimitBanner from "@components/SwipeLimitBanner";
//      import PaywallModal from "@components/PaywallModal";
//      import { usePremium } from "../../hooks/usePremium";
//
//   2. Inside DiscoverScreen(), add:
//      const { isPremium, swipesRemaining, swipesAllowed, decrementSwipe } = usePremium();
//      const [showPaywall, setShowPaywall] = useState(false);
//
//   3. In handleLike, wrap with swipe check:
//      const handleLike = useCallback(async (profile) => {
//         if (!swipesAllowed && !isPremium) {
//            setShowPaywall(true);
//            return;
//         }
//         decrementSwipe(); // optimistic UI update
//         dispatch(removeProfile(profile.user.id));
//         ... rest of existing code
//
//   4. In handlePass similarly:
//      const handlePass = useCallback((profile) => {
//         if (!swipesAllowed && !isPremium) {
//            setShowPaywall(true);
//            return;
//         }
//         decrementSwipe();
//         ... rest of existing code
//
//   5. Add banner just below the header View in the return:
//      <SwipeLimitBanner
//         remaining={swipesRemaining}
//         isPremium={isPremium}
//         onUpgrade={() => setShowPaywall(true)}
//      />
//
//   6. Add modal at the bottom of return (before closing View):
//      <PaywallModal
//         visible={showPaywall}
//         onClose={() => setShowPaywall(false)}
//         triggerReason="swipe_limit"
//      />
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from "react";
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Animated,
} from "react-native";
import { COLORS, FONTS, SPACING, RADIUS } from "../constants/theme";

const FREE_DAILY_LIMIT = 5;

export default function SwipeLimitBanner({ remaining, isPremium, onUpgrade }) {
   // Don't render anything for premium users
   if (isPremium) return null;
   // Don't render when there's plenty of swipes left
   if (remaining === null || remaining === undefined) return null;
   if (remaining > 10) return null;

   const fadeAnim = useRef(new Animated.Value(0)).current;
   const shakeAnim = useRef(new Animated.Value(0)).current;

   useEffect(() => {
      Animated.timing(fadeAnim, {
         toValue: 1,
         duration: 400,
         useNativeDriver: true,
      }).start();

      // Shake animation when limit hit
      if (remaining === 0) {
         Animated.sequence([
            Animated.timing(shakeAnim, {
               toValue: 6,
               duration: 60,
               useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
               toValue: -6,
               duration: 60,
               useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
               toValue: 4,
               duration: 60,
               useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
               toValue: -4,
               duration: 60,
               useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
               toValue: 0,
               duration: 60,
               useNativeDriver: true,
            }),
         ]).start();
      }
   }, [remaining]);

   const isLimitReached = remaining === 0;
   const isLow = remaining <= 3;

   const barWidth = `${Math.max(0, (remaining / FREE_DAILY_LIMIT) * 100)}%`;
   const barColor = isLimitReached
      ? COLORS.rose
      : isLow
        ? "#FB923C" // orange
        : COLORS.gold;

   return (
      <Animated.View
         style={[
            s.container,
            isLimitReached && s.containerLimit,
            {
               opacity: fadeAnim,
               transform: [{ translateX: shakeAnim }],
            },
         ]}
      >
         {isLimitReached ? (
            // ── Limit reached — full upgrade prompt ────────────────────────────
            <View style={s.limitReachedContent}>
               <View style={s.limitTextWrap}>
                  <Text style={s.limitEmoji}>🌟</Text>
                  <View>
                     <Text style={s.limitTitle}>Daily limit reached</Text>
                     <Text style={s.limitSub}>
                        Resets at midnight · Upgrade for unlimited swipes
                     </Text>
                  </View>
               </View>
               <TouchableOpacity
                  style={s.upgradeBtn}
                  onPress={onUpgrade}
                  activeOpacity={0.85}
               >
                  <Text style={s.upgradeBtnText}>Upgrade ✨</Text>
               </TouchableOpacity>
            </View>
         ) : (
            // ── Low swipes — compact warning bar ──────────────────────────────
            <View style={s.lowContent}>
               <View style={s.labelRow}>
                  <Text style={[s.label, isLow && s.labelLow]}>
                     {remaining} swipe{remaining !== 1 ? "s" : ""} left today
                  </Text>
                  <TouchableOpacity onPress={onUpgrade}>
                     <Text style={s.upgradeLink}>Get unlimited →</Text>
                  </TouchableOpacity>
               </View>
               <View style={s.barTrack}>
                  <View
                     style={[
                        s.barFill,
                        { width: barWidth, backgroundColor: barColor },
                     ]}
                  />
               </View>
            </View>
         )}
      </Animated.View>
   );
}

const s = StyleSheet.create({
   container: {
      marginHorizontal: SPACING.xl,
      marginBottom: SPACING.sm,
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: SPACING.md,
   },
   containerLimit: {
      borderColor: COLORS.rose + "50",
      backgroundColor: "rgba(232,96,122,0.06)",
   },

   // Limit reached
   limitReachedContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: SPACING.sm,
   },
   limitTextWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      flex: 1,
   },
   limitEmoji: { fontSize: 20 },
   limitTitle: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 13,
      color: COLORS.textPrimary,
      marginBottom: 1,
   },
   limitSub: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textSecondary,
   },
   upgradeBtn: {
      backgroundColor: COLORS.gold,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      flexShrink: 0,
   },
   upgradeBtnText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 12,
      color: COLORS.bg,
   },

   // Low swipes bar
   lowContent: { gap: 6 },
   labelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
   },
   label: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 12,
      color: COLORS.textSecondary,
   },
   labelLow: { color: "#FB923C" },
   upgradeLink: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 11,
      color: COLORS.gold,
   },
   barTrack: {
      height: 3,
      backgroundColor: COLORS.border,
      borderRadius: 2,
      overflow: "hidden",
   },
   barFill: { height: 3, borderRadius: 2 },
});
