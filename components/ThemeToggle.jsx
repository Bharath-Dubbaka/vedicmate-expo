// components/ThemeToggle.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A compact animated sun/moon toggle for profile screen settings.
// Self-contained — just drop it anywhere.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ style }) {
  const { isDark, toggleTheme, COLORS, FONTS, SPACING, RADIUS } = useTheme();
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

  const trackColor = isDark ? COLORS.bgElevated : COLORS.gold + '30';
  const knobColor = isDark ? COLORS.gold : COLORS.gold;

  return (
    <TouchableOpacity
      style={[styles.row, style]}
      onPress={toggleTheme}
      activeOpacity={0.8}
    >
      <View style={styles.labelWrap}>
        <Text style={styles.emoji}>{isDark ? '🌙' : '☀️'}</Text>
        <View>
          <Text style={[styles.label, { fontFamily: FONTS.bodyMedium, color: COLORS.textPrimary }]}>
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </Text>
          <Text style={[styles.sublabel, { fontFamily: FONTS.body, color: COLORS.textSecondary }]}>
            Tap to switch to {isDark ? 'light' : 'dark'}
          </Text>
        </View>
      </View>

      {/* Track */}
      <View style={[styles.track, { backgroundColor: isDark ? COLORS.bgElevated : COLORS.gold + '25', borderColor: isDark ? COLORS.border : COLORS.gold + '60' }]}>
        {/* Knob */}
        <Animated.View
          style={[
            styles.knob,
            {
              backgroundColor: COLORS.gold,
              transform: [{ translateX: knobTranslate }],
            },
          ]}
        >
          <Text style={styles.knobIcon}>{isDark ? '🌙' : '☀️'}</Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emoji: { fontSize: 22 },
  label: { fontSize: 14, marginBottom: 1 },
  sublabel: { fontSize: 11 },
  track: {
    width: 52,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    position: 'relative',
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  knobIcon: { fontSize: 11 },
});
