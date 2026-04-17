// constants/theme.js
// ─────────────────────────────────────────────────────────────────────────────
// PALETTE SWAP:
//   NIGHT_COLORS  = what was previously LIGHT_COLORS (warm parchment) — kept exactly
//   LIGHT_COLORS  = brand new bright/vibrant palette (replaces old dark navy)
//
// Toggle shows:
//   ☀️  Light Mode  → LIGHT_COLORS  (new bright)
//   🌙  Night Mode  → NIGHT_COLORS  (old parchment — the good one)
//
// TWO light mode options for comparison — user can switch between:
//   LIGHT_PASTEL  → fresh pastel/mint vibe
//   LIGHT_SAFFRON → warm saffron/gold tones
// ─────────────────────────────────────────────────────────────────────────────

// ── NIGHT MODE — warm parchment (was previously LIGHT_COLORS, kept identical) ──
export const NIGHT_COLORS = {
  bg: "#F8F5EF",
  bgCard: "#FFFFFF",
  bgElevated: "#F0EBE1",
  border: "#DDD5C8",
  gold: "#B8860B",
  goldLight: "#D4A017",
  goldDim: "#C8A96E",
  rose: "#C94060",
  roseDim: "#F5C0CC",
  teal: "#2A8C86",
  tealDim: "#A8D8D5",
  textPrimary: "#1C1A2E",
  textSecondary: "#5C5878",
  textDim: "#9B97B0",
  deva: "#6D4CC0",
  manushya: "#2563EB",
  rakshasa: "#DC2626",
  excellent: "#B8860B",
  good: "#16A34A",
  average: "#EA580C",
  challenging: "#DC2626",
  statusBar: "dark",
  inputBg: "#F0EBE1",
  inputBorder: "#DDD5C8",
  modalBg: "rgba(28,26,46,0.6)",
  cardOverlay: "rgba(248,245,239,0.95)",
  isDarkMode: false,
};

// ── LIGHT MODE OPTION A — Pastel / Fresh / Vibrant ───────────────────────────
export const LIGHT_PASTEL = {
  bg: "#F0F4FF", // soft blue-white
  bgCard: "#FFFFFF",
  bgElevated: "#E8EEFF", // lavender tinted
  border: "#C8D4FF", // soft blue border

  gold: "#7C3AED", // vivid violet — replaces gold as primary accent
  goldLight: "#9D5FF5",
  goldDim: "#C4B5FD",

  rose: "#F43F5E", // vivid rose
  roseDim: "#FCA5A5",
  teal: "#06B6D4", // vivid cyan
  tealDim: "#A5F3FC",

  textPrimary: "#1E1B4B", // deep indigo
  textSecondary: "#4338CA", // medium indigo
  textDim: "#818CF8", // light indigo

  deva: "#7C3AED", // violet
  manushya: "#2563EB", // blue
  rakshasa: "#DC2626", // red

  excellent: "#7C3AED",
  good: "#059669",
  average: "#D97706",
  challenging: "#DC2626",

  statusBar: "dark",
  inputBg: "#E8EEFF",
  inputBorder: "#C8D4FF",
  modalBg: "rgba(30,27,75,0.6)",
  cardOverlay: "rgba(240,244,255,0.96)",
  isDarkMode: false,
};

// ── LIGHT MODE OPTION B — Saffron / Gold / Warm Vibrant ──────────────────────
export const LIGHT_SAFFRON = {
  bg: "#FFF8F0", // warm ivory
  bgCard: "#FFFFFF",
  bgElevated: "#FFF0DC", // light saffron tint
  border: "#FFD699", // warm gold border

  gold: "#D97706", // rich amber/saffron
  goldLight: "#F59E0B",
  goldDim: "#FCD34D",

  rose: "#E11D48", // vivid crimson
  roseDim: "#FDA4AF",
  teal: "#0D9488", // teal
  tealDim: "#99F6E4",

  textPrimary: "#431407", // deep burnt orange/brown
  textSecondary: "#92400E", // medium amber
  textDim: "#D97706", // gold dim

  deva: "#7C3AED",
  manushya: "#1D4ED8",
  rakshasa: "#DC2626",

  excellent: "#D97706",
  good: "#059669",
  average: "#EA580C",
  challenging: "#DC2626",

  statusBar: "dark",
  inputBg: "#FFF0DC",
  inputBorder: "#FFD699",
  modalBg: "rgba(67,20,7,0.6)",
  cardOverlay: "rgba(255,248,240,0.96)",
  isDarkMode: false,
};

// Default LIGHT_COLORS = Saffron (can be swapped to LIGHT_PASTEL)
export const LIGHT_COLORS = LIGHT_SAFFRON;

// ── BACKWARDS COMPAT ─────────────────────────────────────────────────────────
// Old DARK_COLORS = NIGHT_COLORS (parchment was the "light" before)
export const DARK_COLORS = NIGHT_COLORS;

// ── SHARED CONSTANTS ──────────────────────────────────────────────────────────
export const FONTS = {
  heading: "Cinzel_600SemiBold",
  headingBold: "Cinzel_700Bold",
  body: "Nunito_400Regular",
  bodyMedium: "Nunito_600SemiBold",
  bodyBold: "Nunito_700Bold",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const SHADOWS = (COLORS) => ({
  gold: {
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  },
});

export const GANA_CONFIG = (COLORS) => ({
  Deva: {
    color: COLORS.deva,
    emoji: "✨",
    title: "Divine Soul",
    bg: COLORS.deva + "20",
  },
  Manushya: {
    color: COLORS.manushya,
    emoji: "🤝",
    title: "Human Heart",
    bg: COLORS.manushya + "20",
  },
  Rakshasa: {
    color: COLORS.rakshasa,
    emoji: "🔥",
    title: "Fierce Spirit",
    bg: COLORS.rakshasa + "15",
  },
});

export const VERDICT_CONFIG = (COLORS) => ({
  "Excellent Match": { color: COLORS.excellent, emoji: "🌟", bar: 1.0 },
  "Good Match": { color: COLORS.good, emoji: "❤️", bar: 0.75 },
  "Average Match": { color: COLORS.average, emoji: "🤔", bar: 0.5 },
  "Challenging Match": { color: COLORS.challenging, emoji: "⚠️", bar: 0.3 },
});

// Deprecated — use useTheme()
export const COLORS = NIGHT_COLORS;
