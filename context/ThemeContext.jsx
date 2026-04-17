// context/ThemeContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// THEME CONTEXT — Light / Dark mode
//
// Usage anywhere in the app:
//   import { useTheme } from '../context/ThemeContext';
//   const { COLORS, isDark, toggleTheme } = useTheme();
//
// The COLORS object returned always matches the current mode.
// When you call toggleTheme(), all components re-render with the new palette.
// ─────────────────────────────────────────────────────────────────────────────

//NEW
// ─────────────────────────────────────────────────────────────────────────────
// isDark = true  → NIGHT MODE  (warm parchment — the good one)
// isDark = false → LIGHT MODE  (new bright palette)
//
// lightVariant: 'saffron' | 'pastel' — user can switch between the two
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NIGHT_COLORS,
  LIGHT_SAFFRON,
  LIGHT_PASTEL,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  GANA_CONFIG,
  VERDICT_CONFIG,
} from "../constants/theme";

const THEME_KEY = "vedicfind_theme_v4";
const VARIANT_KEY = "vedicfind_light_variant";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true); // true = Night mode (parchment)
  const [lightVariant, setLightVariant] = useState("saffron"); // 'saffron' | 'pastel'

  // Load saved preference on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(VARIANT_KEY),
    ])
      .then(([themeVal, variantVal]) => {
        if (themeVal !== null) setIsDark(themeVal === "night");
        if (variantVal !== null) setLightVariant(variantVal);
      })
      .catch(() => {});
  }, []);

  const toggleTheme = useCallback(async () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? "night" : "light").catch(() => {});
      return next;
    });
  }, []);

  const switchLightVariant = useCallback(async (variant) => {
    setLightVariant(variant);
    AsyncStorage.setItem(VARIANT_KEY, variant).catch(() => {});
  }, []);

  const COLORS = isDark
    ? NIGHT_COLORS
    : lightVariant === "pastel"
    ? LIGHT_PASTEL
    : LIGHT_SAFFRON;

  const value = {
    isDark,
    lightVariant,
    toggleTheme,
    switchLightVariant,
    COLORS,
    FONTS,
    SPACING,
    RADIUS,
    SHADOWS: SHADOWS(COLORS),
    GANA_CONFIG: GANA_CONFIG(COLORS),
    VERDICT_CONFIG: VERDICT_CONFIG(COLORS),
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
