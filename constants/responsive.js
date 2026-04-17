// constants/responsive.js
// ─────────────────────────────────────────────────────────────────────────────
// Responsive scaling utilities — works across all Android screen sizes.
// Base design is 390pt wide (iPhone 14 / Pixel 7 equivalent).
//
// Usage:
//   import { rs, rf, rp } from '../../constants/responsive';
//   fontSize: rf(14)        ← responsive font
//   padding: rp(16)         ← responsive padding/spacing
//   width: rs(200)          ← responsive size
// ─────────────────────────────────────────────────────────────────────────────

import { Dimensions, PixelRatio, Platform } from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const BASE_WIDTH = 390; // design base width
const BASE_HEIGHT = 844; // design base height

// Scale factor based on screen width
const wScale = SCREEN_W / BASE_WIDTH;
const hScale = SCREEN_H / BASE_HEIGHT;

// Moderate scale — doesn't grow/shrink as aggressively as full scale
// factor: 0 = no scaling, 1 = full scaling. 0.5 is a good balance.
const moderateScale = (size, factor = 0.5) =>
  size + (size * wScale - size) * factor;

// rs — responsive size (for widths, heights, margins, padding)
export const rs = (size) => Math.round(moderateScale(size, 0.5));

// rf — responsive font (slightly less aggressive scaling)
export const rf = (size) => Math.round(moderateScale(size, 0.4));

// rp — responsive padding (same as rs but named for clarity)
export const rp = rs;

// Screen dimensions
export const SCREEN_WIDTH = SCREEN_W;
export const SCREEN_HEIGHT = SCREEN_H;

// Device type helpers
export const isSmallDevice = SCREEN_W < 360;
export const isMediumDevice = SCREEN_W >= 360 && SCREEN_W < 400;
export const isLargeDevice = SCREEN_W >= 400;

// Responsive SPACING — replaces fixed SPACING constants
export const RSPACING = {
  xs: rs(4),
  sm: rs(8),
  md: rs(16),
  lg: rs(24),
  xl: rs(32),
  xxl: rs(48),
};

// Responsive RADIUS
export const RRADIUS = {
  sm: rs(8),
  md: rs(14),
  lg: rs(20),
  xl: rs(28),
  full: 999,
};
