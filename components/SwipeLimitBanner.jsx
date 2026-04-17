// components/SwipeLimitBanner.jsx
// ─────────────────────────────────────────────────────────────────────────────
// HOOK FIX: All hooks (useRef, useEffect) are now called unconditionally
// at the top level — no more conditional hook calls which caused the
// "React has detected a change in order of Hooks" error.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { rf, rs, rp } from "../constants/responsive";

const FREE_DAILY_LIMIT = 15;

export default function SwipeLimitBanner({ remaining, isPremium, onUpgrade }) {
  const { COLORS, FONTS, RADIUS } = useTheme();

  // ── ALL hooks called unconditionally at top level ─────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Only animate if we should be visible
    if (
      isPremium ||
      remaining === null ||
      remaining === undefined ||
      remaining > 10
    )
      return;

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
  }, [remaining, isPremium]);
  // ─────────────────────────────────────────────────────────────────────────

  // Early returns AFTER all hooks
  if (isPremium) return null;
  if (remaining === null || remaining === undefined) return null;
  if (remaining > 10) return null;

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
      style={{
        marginHorizontal: rs(20),
        marginBottom: rs(8),
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: isLimitReached ? COLORS.rose + "50" : COLORS.border,
        padding: rp(12),
        opacity: fadeAnim,
        transform: [{ translateX: shakeAnim }],
        // Ensure it stays above other content
        zIndex: 10,
        ...(isLimitReached && { backgroundColor: COLORS.rose + "10" }),
      }}
    >
      {isLimitReached ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: rs(8),
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: rs(8),
              flex: 1,
            }}
          >
            <Text style={{ fontSize: rf(18) }}>🌟</Text>
            <View>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: rf(13),
                  color: COLORS.textPrimary,
                  marginBottom: 1,
                }}
              >
                Daily limit reached
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(11),
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
              paddingHorizontal: rp(12),
              paddingVertical: rp(6),
            }}
            onPress={onUpgrade}
            activeOpacity={0.85}
          >
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: rf(12),
                color: COLORS.isDarkMode ? "#fff" : COLORS.bg,
              }}
            >
              Upgrade ✨
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: rs(6) }}>
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
                fontSize: rf(12),
                color: isLow ? "#FB923C" : COLORS.textSecondary,
              }}
            >
              {remaining} swipe{remaining !== 1 ? "s" : ""} left today
            </Text>
            <TouchableOpacity onPress={onUpgrade}>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: rf(11),
                  color: COLORS.gold,
                }}
              >
                Get unlimited →
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              height: rs(3),
              backgroundColor: COLORS.border,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: rs(3),
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
