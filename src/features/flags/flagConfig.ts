/**
 * ZANA Platform Feature Flags Configuration
 * Central definition for Phase 1 (active), Phase 2 (hidden/future), and Phase 3 features.
 */

export interface FeatureFlagMeta {
  key: string;
  defaultValue: boolean;
  description: string;
  rolloutPhase: number;
  adminOnly?: boolean;
}

export const FEATURE_FLAGS = {
  // Phase 2 features (hidden now)
  TEACHER_DASHBOARD: {
    key: "teacher_dashboard",
    defaultValue: false,
    description: "Teacher class management dashboard",
    rolloutPhase: 2,
  },
  PARENT_PORTAL: {
    key: "parent_portal",
    defaultValue: false,
    description: "Parent progress monitoring portal",
    rolloutPhase: 2,
  },
  ADMIN_DASHBOARD: {
    key: "admin_dashboard",
    defaultValue: false,
    description: "System administration dashboard",
    rolloutPhase: 2,
    adminOnly: true,
  },
  COLLABORATIVE_LAB: {
    key: "collaborative_lab",
    defaultValue: false,
    description: "Partner mode in Virtual Lab",
    rolloutPhase: 3,
  },
  // Phase 1 features (active now)
  VIRTUAL_LAB: {
    key: "virtual_lab",
    defaultValue: true,
    description: "Interactive virtual science simulations",
    rolloutPhase: 1,
  },
  STUDY_PLAN: {
    key: "study_plan",
    defaultValue: true,
    description: "Personalized 7-day adaptive study path",
    rolloutPhase: 1,
  },
  PRACTICE_LAB: {
    key: "practice_lab",
    defaultValue: true,
    description: "Gamified practice laboratory modules",
    rolloutPhase: 1,
  },
} as const;

export type FeatureFlagName = keyof typeof FEATURE_FLAGS;
export type FeatureFlagKey = (typeof FEATURE_FLAGS)[FeatureFlagName]["key"];

export const FLAG_KEY_TO_NAME_MAP: Record<string, FeatureFlagName> = Object.entries(FEATURE_FLAGS).reduce(
  (acc, [name, meta]) => {
    acc[meta.key] = name as FeatureFlagName;
    return acc;
  },
  {} as Record<string, FeatureFlagName>
);
