// constants/theme.js

// ─────────────────────────────────────────────────────────────────────────────
// DUAL THEME SYSTEM — Dark (original) + Light (new)
//
// IMPORTANT MIGRATION NOTE:
//   Old code imported: import { COLORS, FONTS, ... } from '../../constants/theme'
//   New code uses:     const { COLORS, FONTS, ... } = useTheme()
//
//   DARK_COLORS and LIGHT_COLORS are exported for ThemeContext only.
//   Screens should NEVER import DARK_COLORS/LIGHT_COLORS directly —
//   always use useTheme() so they react to changes.
//
//   FONTS, SPACING, RADIUS are theme-independent — same for both modes.
// ─────────────────────────────────────────────────────────────────────────────

// ── DARK PALETTE (original VedicFind palette) ─────────────────────────────────
export const DARK_COLORS = {
  // Backgrounds
  bg: "#0A0B14", // near-black with blue tint
  bgCard: "#12141F", // card background
  bgElevated: "#1A1D2E", // elevated surfaces
  border: "#252840", // subtle borders

  // Gold accent
  gold: "#F0C060", // primary accent — warm gold
  goldLight: "#F7DC8A", // lighter gold for text
  goldDim: "#8A6E30", // dimmed gold

  // Action colors
  rose: "#E8607A", // like — swipe right
  roseDim: "#7A2D3A",
  teal: "#4ECDC4", // pass — swipe left
  tealDim: "#1F5E5A",

  // Text
  textPrimary: "#F0EDE4", // warm white
  textSecondary: "#8B8FA8", // muted
  textDim: "#4A4D66", // very muted

  // Gana colors
  deva: "#A78BFA", // purple — divine
  manushya: "#60A5FA", // blue — human
  rakshasa: "#F87171", // red — fierce

  // Verdict colors
  excellent: "#FFD700",
  good: "#4ADE80",
  average: "#FB923C",
  challenging: "#F87171",

  // Mode indicator
  statusBar: "light",
  inputBg: "#1A1D2E",
  inputBorder: "#252840",
  modalBg: "rgba(0,0,0,0.7)",
  cardOverlay: "rgba(10,11,20,0.92)",
};

// ── LIGHT PALETTE — warm parchment + deep navy, sacred manuscript feel ────────
export const LIGHT_COLORS = {
  // Backgrounds — warm cream/parchment
  bg: "#F8F5EF", // warm parchment
  bgCard: "#FFFFFF", // pure white cards
  bgElevated: "#F0EBE1", // slightly warm elevated
  border: "#DDD5C8", // warm border

  // Gold accent — slightly deeper for light bg readability
  gold: "#B8860B", // dark goldenrod — readable on light
  goldLight: "#D4A017", // medium gold
  goldDim: "#C8A96E", // light gold dim

  // Action colors
  rose: "#C94060", // deeper rose for light bg
  roseDim: "#F5C0CC",
  teal: "#2A8C86", // deeper teal for contrast
  tealDim: "#A8D8D5",

  // Text
  textPrimary: "#1C1A2E", // deep navy — high contrast
  textSecondary: "#5C5878", // medium slate
  textDim: "#9B97B0", // light muted

  // Gana colors — deeper for light bg
  deva: "#6D4CC0", // deeper purple
  manushya: "#2563EB", // deeper blue
  rakshasa: "#DC2626", // deeper red

  // Verdict colors
  excellent: "#B8860B",
  good: "#16A34A",
  average: "#EA580C",
  challenging: "#DC2626",

  // Mode indicator
  statusBar: "dark",
  inputBg: "#F0EBE1",
  inputBorder: "#DDD5C8",
  modalBg: "rgba(28,26,46,0.6)",
  cardOverlay: "rgba(248,245,239,0.94)",
};

// ── SHARED CONSTANTS — theme-independent ─────────────────────────────────────

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

// SHADOWS is a function — takes COLORS so it can adapt to theme
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

// GANA_CONFIG is a function — takes COLORS to adapt
export const GANA_CONFIG = (COLORS) => ({
  Deva: {
    color: COLORS.deva,
    emoji: "✨",
    title: "Divine Soul",
    bg: COLORS.isDark ? "rgba(167,139,250,0.15)" : "rgba(109,76,192,0.10)",
  },
  Manushya: {
    color: COLORS.manushya,
    emoji: "🤝",
    title: "Human Heart",
    bg: COLORS.isDark ? "rgba(96,165,250,0.15)" : "rgba(37,99,235,0.10)",
  },
  Rakshasa: {
    color: COLORS.rakshasa,
    emoji: "🔥",
    title: "Fierce Spirit",
    bg: COLORS.isDark ? "rgba(248,113,113,0.15)" : "rgba(220,38,38,0.08)",
  },
});

// VERDICT_CONFIG is a function — takes COLORS
export const VERDICT_CONFIG = (COLORS) => ({
  "Excellent Match": { color: COLORS.excellent, emoji: "🌟", bar: 1.0 },
  "Good Match": { color: COLORS.good, emoji: "❤️", bar: 0.75 },
  "Average Match": { color: COLORS.average, emoji: "🤔", bar: 0.5 },
  "Challenging Match": { color: COLORS.challenging, emoji: "⚠️", bar: 0.3 },
});

// ── BACKWARDS COMPATIBILITY ───────────────────────────────────────────────────
// These are exported so old imports don't immediately break during migration.
// Screens should migrate to useTheme() — these will be removed in Build 4.
// @deprecated — use useTheme() instead
export const COLORS = DARK_COLORS;

// export const COLORS = {
//   // Deep cosmic navy + warm gold — feels sacred and modern
//   bg:           "#0A0B14",   // near-black with blue tint
//   bgCard:       "#12141F",   // card background
//   bgElevated:   "#1A1D2E",   // elevated surfaces
//   border:       "#252840",   // subtle borders

//   gold:         "#F0C060",   // primary accent — warm gold
//   goldLight:    "#F7DC8A",   // lighter gold for text
//   goldDim:      "#8A6E30",   // dimmed gold

//   rose:         "#E8607A",   // like — swipe right
//   roseDim:      "#7A2D3A",

//   teal:         "#4ECDC4",   // pass — swipe left
//   tealDim:      "#1F5E5A",

//   textPrimary:  "#F0EDE4",   // warm white
//   textSecondary:"#8B8FA8",   // muted
//   textDim:      "#4A4D66",   // very muted

//   // Gana colors
//   deva:         "#A78BFA",   // purple — divine
//   manushya:     "#60A5FA",   // blue — human
//   rakshasa:     "#F87171",   // red — fierce

//   // Verdict colors
//   excellent:    "#FFD700",
//   good:         "#4ADE80",
//   average:      "#FB923C",
//   challenging:  "#F87171",
// };

// export const FONTS = {
//   // Cinzel for headings — ancient, celestial
//   // Nunito for body — warm, readable
//   heading:      "Cinzel_600SemiBold",
//   headingBold:  "Cinzel_700Bold",
//   body:         "Nunito_400Regular",
//   bodyMedium:   "Nunito_600SemiBold",
//   bodyBold:     "Nunito_700Bold",
// };

// export const SPACING = {
//   xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
// };

// export const RADIUS = {
//   sm: 8, md: 14, lg: 20, xl: 28, full: 999,
// };

// export const SHADOWS = {
//   gold: {
//     shadowColor:  COLORS.gold,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity:0.25,
//     shadowRadius: 12,
//     elevation:    8,
//   },
//   card: {
//     shadowColor:  "#000",
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity:0.4,
//     shadowRadius: 20,
//     elevation:    12,
//   },
// };

// export const GANA_CONFIG = {
//   Deva:     { color: COLORS.deva,     emoji: "✨", title: "Divine Soul",   bg: "#1E1A3A" },
//   Manushya: { color: COLORS.manushya, emoji: "🤝", title: "Human Heart",  bg: "#0F1E3A" },
//   Rakshasa: { color: COLORS.rakshasa, emoji: "🔥", title: "Fierce Spirit", bg: "#2A0F0F" },
// };

// export const VERDICT_CONFIG = {
//   "Excellent Match":   { color: COLORS.excellent,   emoji: "🌟", bar: 1.0 },
//   "Good Match":        { color: COLORS.good,         emoji: "❤️",  bar: 0.75 },
//   "Average Match":     { color: COLORS.average,      emoji: "🤔", bar: 0.5 },
//   "Challenging Match": { color: COLORS.challenging,  emoji: "⚠️",  bar: 0.3 },
// };
