/**
 * ZANA Typography System
 * Kurdish-optimized typography scale:
 * Kurdish Sorani glyphs require ~10% larger sizing and taller line heights (1.6-1.8)
 * for optimal readability, especially for Grade 9-12 students on mobile devices.
 */

export const fontFamilies = {
  kurdish: "'Noto Sans Arabic', 'Segoe UI', system-ui, sans-serif",
  numeric: "'Noto Sans Arabic', tabular-nums",
  mono: "'JetBrains Mono', monospace",
} as const;

export interface TypeScaleSpec {
  fontSize: string;
  lineHeight: string;
}

export const typeScale: Record<
  "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl",
  TypeScaleSpec
> = {
  xs: { fontSize: "14px", lineHeight: "1.6" },
  sm: { fontSize: "15px", lineHeight: "1.7" },
  base: { fontSize: "17px", lineHeight: "1.8" }, // default body
  lg: { fontSize: "19px", lineHeight: "1.8" },
  xl: { fontSize: "22px", lineHeight: "1.6" },
  "2xl": { fontSize: "26px", lineHeight: "1.5" },
  "3xl": { fontSize: "32px", lineHeight: "1.4" },
  "4xl": { fontSize: "40px", lineHeight: "1.2" },
} as const;

export const fontWeights = {
  regular: 400, // body text
  medium: 500, // labels, captions
  semibold: 600, // headings, buttons
  bold: 700, // display, hero text
} as const;

export const letterSpacing = {
  tight: "-0.01em", // headings
  normal: "0.01em", // Kurdish body
  wide: "0.02em", // labels, caps
} as const;

export type FontSizeKey = keyof typeof typeScale;
export type FontWeightKey = keyof typeof fontWeights;
export type LetterSpacingKey = keyof typeof letterSpacing;
