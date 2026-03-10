// constants/theme.js
export const COLORS = {
  // Deep cosmic navy + warm gold — feels sacred and modern
  bg:           "#0A0B14",   // near-black with blue tint
  bgCard:       "#12141F",   // card background
  bgElevated:   "#1A1D2E",   // elevated surfaces
  border:       "#252840",   // subtle borders

  gold:         "#F0C060",   // primary accent — warm gold
  goldLight:    "#F7DC8A",   // lighter gold for text
  goldDim:      "#8A6E30",   // dimmed gold

  rose:         "#E8607A",   // like — swipe right
  roseDim:      "#7A2D3A",

  teal:         "#4ECDC4",   // pass — swipe left
  tealDim:      "#1F5E5A",

  textPrimary:  "#F0EDE4",   // warm white
  textSecondary:"#8B8FA8",   // muted
  textDim:      "#4A4D66",   // very muted

  // Gana colors
  deva:         "#A78BFA",   // purple — divine
  manushya:     "#60A5FA",   // blue — human
  rakshasa:     "#F87171",   // red — fierce

  // Verdict colors
  excellent:    "#FFD700",
  good:         "#4ADE80",
  average:      "#FB923C",
  challenging:  "#F87171",
};

export const FONTS = {
  // Cinzel for headings — ancient, celestial
  // Nunito for body — warm, readable
  heading:      "Cinzel_600SemiBold",
  headingBold:  "Cinzel_700Bold",
  body:         "Nunito_400Regular",
  bodyMedium:   "Nunito_600SemiBold",
  bodyBold:     "Nunito_700Bold",
};

export const SPACING = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const RADIUS = {
  sm: 8, md: 14, lg: 20, xl: 28, full: 999,
};

export const SHADOWS = {
  gold: {
    shadowColor:  COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity:0.25,
    shadowRadius: 12,
    elevation:    8,
  },
  card: {
    shadowColor:  "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity:0.4,
    shadowRadius: 20,
    elevation:    12,
  },
};

export const GANA_CONFIG = {
  Deva:     { color: COLORS.deva,     emoji: "✨", title: "Divine Soul",   bg: "#1E1A3A" },
  Manushya: { color: COLORS.manushya, emoji: "🤝", title: "Human Heart",  bg: "#0F1E3A" },
  Rakshasa: { color: COLORS.rakshasa, emoji: "🔥", title: "Fierce Spirit", bg: "#2A0F0F" },
};

export const VERDICT_CONFIG = {
  "Excellent Match":   { color: COLORS.excellent,   emoji: "🌟", bar: 1.0 },
  "Good Match":        { color: COLORS.good,         emoji: "❤️",  bar: 0.75 },
  "Average Match":     { color: COLORS.average,      emoji: "🤔", bar: 0.5 },
  "Challenging Match": { color: COLORS.challenging,  emoji: "⚠️",  bar: 0.3 },
};