/**
 * ZANA Animation System
 * Smooth, non-distracting motion designed for mobile efficiency and responsive interaction.
 */

export const animationDurations = {
  instant: "100ms", // immediate feedback (press state)
  fast: "150ms", // hover states
  normal: "200ms", // transitions, tabs
  slow: "300ms", // page transitions, modals
  slower: "500ms", // progress bars, reveals, achievements
} as const;

export const animationEasings = {
  out: "cubic-bezier(0, 0, 0.2, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
} as const;

export const pageTransitions = {
  routeChange: `fadeIn ${animationDurations.normal} ${animationEasings.out}`,
  modalOpen: `scaleIn ${animationDurations.fast} ${animationEasings.spring}, fadeIn ${animationDurations.fast} ease`,
  drawerOpen: `slideInUp 250ms ${animationEasings.out}`,
  toast: `slideInUp ${animationDurations.normal} ${animationEasings.spring}`,
} as const;

/**
 * Keyframe definitions for core ZANA animations
 */
export const keyframeDefinitions = {
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
  pulseSoft: {
    "0%, 100%": { opacity: "1" },
    "50%": { opacity: "0.6" },
  },
  "pulse-soft": {
    "0%, 100%": { opacity: "1" },
    "50%": { opacity: "0.6" },
  },
  confettiFall: {
    "0%": { transform: "translateY(-100%) rotate(0deg)", opacity: "1" },
    "100%": { transform: "translateY(100vh) rotate(360deg)", opacity: "0" },
  },
  "confetti-fall": {
    "0%": { transform: "translateY(-100%) rotate(0deg)", opacity: "1" },
    "100%": { transform: "translateY(100vh) rotate(360deg)", opacity: "0" },
  },
} as const;

export type AnimationDuration = keyof typeof animationDurations;
export type AnimationEasing = keyof typeof animationEasings;
export type PageTransition = keyof typeof pageTransitions;
export type KeyframeDefinition = keyof typeof keyframeDefinitions;
