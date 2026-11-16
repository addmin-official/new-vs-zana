import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
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
        success: {
          400: "#34D399",
          500: "#10B981", // main
          600: "#059669",
        },
        warning: {
          400: "#FBBF24",
          500: "#F59E0B", // main
          600: "#D97706",
        },
        error: {
          400: "#FB7185",
          500: "#F43F5E", // main
          600: "#E11D48",
        },
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
        mastery: {
          notStarted: "#CBD5E1",
          introduced: "#93C5FD",
          developing: "#FCD34D",
          proficient: "#6EE7B7",
          mastered: "#A78BFA",
        },
      },
      fontFamily: {
        kurdish: ["'Noto Sans Arabic'", "'Noto Kufi Arabic'", "Vazirmatn", "'Segoe UI'", "system-ui", "sans-serif"],
        numeric: ["'Noto Sans Arabic'", "tabular-nums"],
        sans: ["'Noto Sans Arabic'", "'Noto Kufi Arabic'", "Vazirmatn", "'Segoe UI'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      fontSize: {
        // Kurdish-optimized Type Scale (~10% larger than Latin)
        xs: ["14px", { lineHeight: "1.6" }],
        sm: ["15px", { lineHeight: "1.7" }],
        base: ["17px", { lineHeight: "1.8" }],
        lg: ["19px", { lineHeight: "1.8" }],
        xl: ["22px", { lineHeight: "1.6" }],
        "2xl": ["26px", { lineHeight: "1.5" }],
        "3xl": ["32px", { lineHeight: "1.4" }],
        "4xl": ["40px", { lineHeight: "1.2" }],
        // Legacy keys preserved for backward compatibility
        "ckb-sm": ["0.95rem", { lineHeight: "1.8" }],
        "ckb-base": ["1.1rem", { lineHeight: "1.8" }],
        "ckb-lg": ["1.25rem", { lineHeight: "1.8" }],
      },
      spacing: {
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
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.05)",
      },
      transitionDuration: {
        instant: "100ms",
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
        slower: "500ms",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0, 0, 0.2, 1)",
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideInUp: {
          from: { transform: "translateY(16px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          from: { transform: "translateX(-16px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        scaleIn: {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-100%) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(360deg)", opacity: "0" },
        },
      },
      animation: {
        fadeIn: "fadeIn 200ms cubic-bezier(0, 0, 0.2, 1)",
        slideInUp: "slideInUp 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        slideInRight: "slideInRight 200ms cubic-bezier(0, 0, 0.2, 1)",
        scaleIn: "scaleIn 150ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        shimmer: "shimmer 2s infinite linear",
        "pulse-soft": "pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "confetti-fall": "confetti-fall 3s cubic-bezier(0, 0, 0.2, 1) forwards",
      },
      scale: {
        97: "0.97",
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities, addVariant }) {
      addVariant("rtl", '&[dir="rtl"], [dir="rtl"] &');
      addUtilities({
        ".text-ckb": {
          fontFamily: "'Noto Sans Arabic', 'Segoe UI', system-ui, sans-serif",
          direction: "rtl",
          lineHeight: "1.8",
          letterSpacing: "0.01em",
        },
        ".input-base": {
          width: "100%",
          minHeight: "48px",
          borderRadius: "10px",
          borderWidth: "1px",
          borderColor: "var(--border-default, #CBD5E1)",
          backgroundColor: "var(--bg-surface, #FFFFFF)",
          color: "var(--text-primary, #0F172A)",
          padding: "0.75rem 1rem",
          fontFamily: "'Noto Sans Arabic', 'Segoe UI', system-ui, sans-serif",
          fontSize: "16px",
          lineHeight: "1.6",
          outline: "none",
          touchAction: "manipulation",
        },
        ".card-base": {
          backgroundColor: "var(--bg-surface, #FFFFFF)",
          borderWidth: "1px",
          borderColor: "var(--border-subtle, #E2E8F0)",
          borderRadius: "16px",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
          color: "var(--text-primary, #0F172A)",
          transition: "all 200ms cubic-bezier(0, 0, 0.2, 1)",
        },
        ".focus-ring": {
          "&:focus-visible": {
            outline: "3px solid #6366F1 !important",
            outlineOffset: "2px !important",
          },
        },
        ".touch-target": {
          minWidth: "48px",
          minHeight: "48px",
        },
        ".safe-bottom": {
          paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        },
      });
    }),
  ],
};

export default config;
