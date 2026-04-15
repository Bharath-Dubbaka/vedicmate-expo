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
import { useTheme } from "../context/ThemeContext";

const FREE_DAILY_LIMIT = 15;

export default function SwipeLimitBanner({ remaining, isPremium, onUpgrade }) {
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();

  if (isPremium) return null;
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
    ? "#FB923C"
    : COLORS.gold;

  return (
    <Animated.View
      style={[
        {
          marginHorizontal: SPACING.xl,
          marginBottom: SPACING.sm,
          backgroundColor: COLORS.bgCard,
          borderRadius: RADIUS.lg,
          borderWidth: 1,
          borderColor: isLimitReached ? COLORS.rose + "50" : COLORS.border,
          padding: SPACING.md,
          opacity: fadeAnim,
          transform: [{ translateX: shakeAnim }],
        },
        isLimitReached && { backgroundColor: COLORS.rose + "10" },
      ]}
    >
      {isLimitReached ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flex: 1,
            }}
          >
            <Text style={{ fontSize: 20 }}>🌟</Text>
            <View>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 13,
                  color: COLORS.textPrimary,
                  marginBottom: 1,
                }}
              >
                Daily limit reached
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 11,
                  color: COLORS.textSecondary,
                }}
              >
                Resets at midnight · Upgrade for unlimited
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.gold,
              borderRadius: RADIUS.md,
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.sm,
            }}
            onPress={onUpgrade}
            activeOpacity={0.85}
          >
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: 12,
                color: COLORS.bg,
              }}
            >
              Upgrade ✨
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.bodyMedium,
                fontSize: 12,
                color: isLow ? "#FB923C" : COLORS.textSecondary,
              }}
            >
              {remaining} swipe{remaining !== 1 ? "s" : ""} left today
            </Text>
            <TouchableOpacity onPress={onUpgrade}>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 11,
                  color: COLORS.gold,
                }}
              >
                Get unlimited →
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              height: 3,
              backgroundColor: COLORS.border,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 3,
                width: barWidth,
                backgroundColor: barColor,
                borderRadius: 2,
              }}
            />
          </View>
        </View>
      )}
    </Animated.View>
  );
}
