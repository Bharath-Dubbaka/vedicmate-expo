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

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_COLORS, LIGHT_COLORS, FONTS, SPACING, RADIUS, SHADOWS, GANA_CONFIG, VERDICT_CONFIG } from '../constants/theme';

const THEME_KEY = 'vedicfind_theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true); // default dark

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then(val => {
        if (val !== null) setIsDark(val === 'dark');
      })
      .catch(() => {});
  }, []);

  const toggleTheme = useCallback(async () => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light').catch(() => {});
      return next;
    });
  }, []);

  const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;

  const value = {
    isDark,
    toggleTheme,
    COLORS,
    FONTS,
    SPACING,
    RADIUS,
    SHADOWS: SHADOWS(COLORS),
    GANA_CONFIG: GANA_CONFIG(COLORS),
    VERDICT_CONFIG: VERDICT_CONFIG(COLORS),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
