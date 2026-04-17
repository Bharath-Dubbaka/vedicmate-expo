// components/ThemeToggle.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A compact animated sun/moon toggle for profile screen settings.
// Self-contained — just drop it anywhere.
// ─────────────────────────────────────────────────────────────────────────────
// Shows variant switcher when in Light mode

import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { rf, rs, rp } from "../constants/responsive";

export default function ThemeToggle({ style }) {
  const {
    isDark,
    toggleTheme,
    switchLightVariant,
    lightVariant,
    COLORS,
    FONTS,
    RADIUS,
  } = useTheme();
  const slideAnim = useRef(new Animated.Value(isDark ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isDark ? 0 : 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [isDark]);

  const knobTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26],
  });

  return (
    <View style={style}>
      {/* Main toggle row */}
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: rp(10),
        }}
        onPress={toggleTheme}
        activeOpacity={0.8}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: rs(12),
            flex: 1,
          }}
        >
          <Text style={{ fontSize: rf(22) }}>{isDark ? "🌙" : "☀️"}</Text>
          <View>
            <Text
              style={{
                fontFamily: FONTS.bodyMedium,
                fontSize: rf(14),
                color: COLORS.textPrimary,
              }}
            >
              {isDark ? "Night Mode" : "Light Mode"}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(11),
                color: COLORS.textSecondary,
              }}
            >
              Switch to {isDark ? "light" : "night"}
            </Text>
          </View>
        </View>
        {/* Track */}
        <View
          style={{
            width: rs(52),
            height: rs(28),
            borderRadius: rs(14),
            borderWidth: 1.5,
            borderColor: isDark ? COLORS.border : COLORS.gold + "60",
            backgroundColor: isDark ? COLORS.bgElevated : COLORS.gold + "25",
            justifyContent: "center",
          }}
        >
          <Animated.View
            style={{
              width: rs(22),
              height: rs(22),
              borderRadius: rs(11),
              backgroundColor: COLORS.gold,
              position: "absolute",
              alignItems: "center",
              justifyContent: "center",
              transform: [{ translateX: knobTranslate }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: rf(11) }}>{isDark ? "🌙" : "☀️"}</Text>
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Light variant switcher — only shows in Light mode */}
      {!isDark && (
        <View
          style={{ flexDirection: "row", gap: rs(8), paddingBottom: rp(8) }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(11),
              color: COLORS.textDim,
              alignSelf: "center",
              marginRight: rs(4),
            }}
          >
            Style:
          </Text>
          {[
            { key: "saffron", label: "🟡 Saffron" },
            { key: "pastel", label: "💜 Pastel" },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={{
                paddingHorizontal: rp(12),
                paddingVertical: rp(5),
                borderRadius: RADIUS.full,
                borderWidth: 1,
                borderColor:
                  lightVariant === opt.key ? COLORS.gold : COLORS.border,
                backgroundColor:
                  lightVariant === opt.key ? COLORS.gold + "20" : "transparent",
              }}
              onPress={() => switchLightVariant(opt.key)}
            >
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: rf(12),
                  color:
                    lightVariant === opt.key
                      ? COLORS.gold
                      : COLORS.textSecondary,
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
