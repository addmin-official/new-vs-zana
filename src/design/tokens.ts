/**
 * ZANA Design Tokens
 * Philosophy: "Calm Intelligence" — smart but not intimidating, modern but not distracting.
 * Target: Grade 9–12 students in Kurdistan on mid-range mobile devices.
 */

export const colors = {
  // Primary Palette — Indigo (Learning, Trust)
  primary: {
    50: "#EEF2FF",
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#6366F1", // main brand
    600: "#4F46E5", // hover state
    700: "#4338CA", // active state
    800: "#3730A3",
    900: "#312E81",
  },

  // Success Palette — Emerald (Mastery, Correct)
  success: {
    400: "#34D399",
    500: "#10B981", // main
    600: "#059669",
  },

  // Warning Palette — Amber (Streak, Attention)
  warning: {
    400: "#FBBF24",
    500: "#F59E0B", // main
    600: "#D97706",
  },

  // Error Palette — Rose (Wrong answer, Error)
  error: {
    400: "#FB7185",
    500: "#F43F5E", // main
    600: "#E11D48",
  },

  // Neutral Palette — Slate
  neutral: {
    0: "#FFFFFF",
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
    950: "#020617",
  },

  // Mastery Tier Colors (Educational Gamification)
  mastery: {
    notStarted: "#CBD5E1", // neutral-300
    introduced: "#93C5FD", // blue-300
    developing: "#FCD34D", // amber-300
    proficient: "#6EE7B7", // emerald-300
    mastered: "#A78BFA", // violet-400
  },
} as const;

export const semanticTokens = {
  light: {
    bgBase: "var(--color-neutral-50)",
    bgSurface: "var(--color-neutral-0)",
    bgElevated: "var(--color-neutral-0)",
    bgSunken: "var(--color-neutral-100)",
    borderSubtle: "var(--color-neutral-200)",
    borderDefault: "var(--color-neutral-300)",
    textPrimary: "var(--color-neutral-900)",
    textSecondary: "var(--color-neutral-600)",
    textDisabled: "var(--color-neutral-400)",
    textInverse: "var(--color-neutral-0)",
  },
  dark: {
    bgBase: "var(--color-neutral-950)",
    bgSurface: "var(--color-neutral-900)",
    bgElevated: "var(--color-neutral-800)",
    bgSunken: "#010409",
    borderSubtle: "var(--color-neutral-800)",
    borderDefault: "var(--color-neutral-700)",
    textPrimary: "var(--color-neutral-50)",
    textSecondary: "var(--color-neutral-400)",
    textDisabled: "var(--color-neutral-600)",
    textInverse: "var(--color-neutral-900)",
  },
} as const;

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
} as const;

export const borderRadius = {
  sm: "6px", // inputs, small buttons
  md: "10px", // cards, panels
  lg: "16px", // modals, large cards
  xl: "24px", // bottom sheet, feature cards
  full: "9999px", // pills, avatars, toggles
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.05)",
} as const;

export type ColorPrimary = keyof typeof colors.primary;
export type ColorNeutral = keyof typeof colors.neutral;
export type ColorSuccess = keyof typeof colors.success;
export type ColorWarning = keyof typeof colors.warning;
export type ColorError = keyof typeof colors.error;
export type MasteryTier = keyof typeof colors.mastery;
export type SpacingScale = keyof typeof spacing;
export type BorderRadiusScale = keyof typeof borderRadius;
