import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  FEATURE_FLAGS,
  FLAG_KEY_TO_NAME_MAP,
  FeatureFlagName,
} from "../../features/flags/flagConfig.ts";
import {
  resolveFeatureFlag,
  getDevUrlFlagOverrides,
  getDevLocalStorageFlagOverrides,
} from "../../features/flags/featureFlags.ts";
import {
  FeatureFlagProvider,
  FeatureFlagRoute,
  useFeatureFlagsContext,
} from "../../features/flags/FeatureFlagProvider.tsx";
import { useFeatureFlag } from "../../features/flags/useFeatureFlag.ts";
import { ComingSoon } from "../../features/flags/ComingSoon.tsx";

describe("ZANA Feature Flags System", () => {
  const originalLocation = window.location;
  const originalLocalStorage = window.localStorage;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Reset window.location
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
    // Reset window.localStorage
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
  });

  describe("1. Flag Definitions & Defaults (flagConfig.ts)", () => {
    it("defines Phase 2 and Phase 3 flags as disabled by default", () => {
      expect(FEATURE_FLAGS.TEACHER_DASHBOARD.defaultValue).toBe(false);
      expect(FEATURE_FLAGS.TEACHER_DASHBOARD.rolloutPhase).toBe(2);

      expect(FEATURE_FLAGS.PARENT_PORTAL.defaultValue).toBe(false);
      expect(FEATURE_FLAGS.PARENT_PORTAL.rolloutPhase).toBe(2);

      expect(FEATURE_FLAGS.ADMIN_DASHBOARD.defaultValue).toBe(false);
      expect(FEATURE_FLAGS.ADMIN_DASHBOARD.rolloutPhase).toBe(2);
      expect(FEATURE_FLAGS.ADMIN_DASHBOARD.adminOnly).toBe(true);

      expect(FEATURE_FLAGS.COLLABORATIVE_LAB.defaultValue).toBe(false);
      expect(FEATURE_FLAGS.COLLABORATIVE_LAB.rolloutPhase).toBe(3);
    });

    it("defines Phase 1 core learning flags as enabled by default", () => {
      expect(FEATURE_FLAGS.VIRTUAL_LAB.defaultValue).toBe(true);
      expect(FEATURE_FLAGS.VIRTUAL_LAB.rolloutPhase).toBe(1);

      expect(FEATURE_FLAGS.STUDY_PLAN.defaultValue).toBe(true);
      expect(FEATURE_FLAGS.STUDY_PLAN.rolloutPhase).toBe(1);

      expect(FEATURE_FLAGS.PRACTICE_LAB.defaultValue).toBe(true);
      expect(FEATURE_FLAGS.PRACTICE_LAB.rolloutPhase).toBe(1);
    });

    it("correctly maps feature flag keys back to flag names", () => {
      expect(FLAG_KEY_TO_NAME_MAP["teacher_dashboard"]).toBe("TEACHER_DASHBOARD");
      expect(FLAG_KEY_TO_NAME_MAP["parent_portal"]).toBe("PARENT_PORTAL");
      expect(FLAG_KEY_TO_NAME_MAP["admin_dashboard"]).toBe("ADMIN_DASHBOARD");
      expect(FLAG_KEY_TO_NAME_MAP["virtual_lab"]).toBe("VIRTUAL_LAB");
    });
  });

  describe("2. Resolution Engine Priority (featureFlags.ts)", () => {
    it("falls back to Tier 4 default config when no overrides are set", () => {
      expect(resolveFeatureFlag("TEACHER_DASHBOARD")).toBe(false);
      expect(resolveFeatureFlag("PARENT_PORTAL")).toBe(false);
      expect(resolveFeatureFlag("ADMIN_DASHBOARD")).toBe(false);
      expect(resolveFeatureFlag("VIRTUAL_LAB")).toBe(true);
      expect(resolveFeatureFlag("STUDY_PLAN")).toBe(true);
    });

    it("evaluates Tier 1 (Firestore override) with highest priority", () => {
      // Overriding a disabled Phase 2 flag to true
      const result1 = resolveFeatureFlag("TEACHER_DASHBOARD", {
        firestoreOverrides: {
          teacher_dashboard: true,
        },
      });
      expect(result1).toBe(true);

      // Overriding an active Phase 1 flag to false via Firestore
      const result2 = resolveFeatureFlag("VIRTUAL_LAB", {
        firestoreOverrides: {
          virtual_lab: false,
        },
      });
      expect(result2).toBe(false);
    });

    it("respects user-specific overrides from Firestore document", () => {
      const context = {
        userId: "student_456",
        firestoreOverrides: {
          teacher_dashboard: false,
          "user:student_456:teacher_dashboard": true,
        },
      };

      const result = resolveFeatureFlag("TEACHER_DASHBOARD", context);
      expect(result).toBe(true);
    });

    it("evaluates Tier 2 URL search param overrides in dev mode (?flags=...)", () => {
      // Mock window.location
      const mockLocation = new URL("http://localhost:3000/?flags=teacher_dashboard,parent_portal");
      Object.defineProperty(window, "location", {
        configurable: true,
        value: mockLocation,
      });

      const overrides = getDevUrlFlagOverrides();
      expect(overrides["teacher_dashboard"]).toBe(true);
      expect(overrides["parent_portal"]).toBe(true);

      expect(resolveFeatureFlag("TEACHER_DASHBOARD")).toBe(true);
      expect(resolveFeatureFlag("PARENT_PORTAL")).toBe(true);
    });

    it("evaluates Tier 2 URL search param with negation (?flags=!virtual_lab)", () => {
      const mockLocation = new URL("http://localhost:3000/?flags=!virtual_lab");
      Object.defineProperty(window, "location", {
        configurable: true,
        value: mockLocation,
      });

      expect(resolveFeatureFlag("VIRTUAL_LAB")).toBe(false);
    });

    it("evaluates Tier 2 explicit flag parameter (?flag:teacher_dashboard=true)", () => {
      const mockLocation = new URL("http://localhost:3000/?flag:teacher_dashboard=true");
      Object.defineProperty(window, "location", {
        configurable: true,
        value: mockLocation,
      });

      expect(resolveFeatureFlag("TEACHER_DASHBOARD")).toBe(true);
    });

    it("evaluates Tier 3 localStorage overrides in dev mode", () => {
      const mockLocation = new URL("http://localhost:3000/");
      Object.defineProperty(window, "location", {
        configurable: true,
        value: mockLocation,
      });

      const store: Record<string, string> = {
        zana_feature_flags_override: JSON.stringify({
          teacher_dashboard: true,
          virtual_lab: false,
        }),
      };

      const mockStorage = {
        getItem: (k: string) => store[k] || null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => {},
        key: () => null,
        length: 1,
      };

      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: mockStorage,
      });

      const localOverrides = getDevLocalStorageFlagOverrides();
      expect(localOverrides["teacher_dashboard"]).toBe(true);
      expect(localOverrides["virtual_lab"]).toBe(false);

      expect(resolveFeatureFlag("TEACHER_DASHBOARD")).toBe(true);
      expect(resolveFeatureFlag("VIRTUAL_LAB")).toBe(false);
    });

    it("strict priority: Firestore > URL > localStorage > Default", () => {
      // Set localStorage: teacher_dashboard = false
      const store: Record<string, string> = {
        zana_feature_flags_override: JSON.stringify({ teacher_dashboard: false }),
      };
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: {
          getItem: (k: string) => store[k] || null,
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
          key: () => null,
          length: 1,
        },
      });

      // Set URL: teacher_dashboard = true
      const mockLocation = new URL("http://localhost:3000/?flags=teacher_dashboard");
      Object.defineProperty(window, "location", {
        configurable: true,
        value: mockLocation,
      });

      // URL should beat localStorage
      expect(resolveFeatureFlag("TEACHER_DASHBOARD")).toBe(true);

      // Firestore should beat URL
      const firestoreBeatsUrl = resolveFeatureFlag("TEACHER_DASHBOARD", {
        firestoreOverrides: { teacher_dashboard: false },
      });
      expect(firestoreBeatsUrl).toBe(false);
    });
  });

  describe("3. React Provider & Hook (FeatureFlagProvider, useFeatureFlag)", () => {
    function FlagDisplay({ flag }: { flag: FeatureFlagName }) {
      const enabled = useFeatureFlag(flag);
      return <div data-testid="flag-status">{enabled ? "ACTIVE" : "DISABLED"}</div>;
    }

    it("provides correct flag status via useFeatureFlag hook with initial overrides", () => {
      render(
        <FeatureFlagProvider initialOverrides={{ teacher_dashboard: true }}>
          <FlagDisplay flag="TEACHER_DASHBOARD" />
        </FeatureFlagProvider>
      );

      expect(screen.getByTestId("flag-status").textContent).toBe("ACTIVE");
    });

    it("evaluates Phase 2 feature as DISABLED when default applies", () => {
      render(
        <FeatureFlagProvider>
          <FlagDisplay flag="TEACHER_DASHBOARD" />
        </FeatureFlagProvider>
      );

      expect(screen.getByTestId("flag-status").textContent).toBe("DISABLED");
    });

    it("safely falls back to default resolution if context is missing", () => {
      function IndependentConsumer() {
        const { isEnabled } = useFeatureFlagsContext();
        return <div>{isEnabled("VIRTUAL_LAB") ? "YES" : "NO"}</div>;
      }

      render(<IndependentConsumer />);
      expect(screen.getByText("YES")).toBeInTheDocument();
    });
  });

  describe("4. FeatureFlagRoute & ComingSoon Page", () => {
    it("renders children when the feature flag is enabled", () => {
      render(
        <FeatureFlagProvider initialOverrides={{ teacher_dashboard: true }}>
          <FeatureFlagRoute flag="TEACHER_DASHBOARD">
            <div data-testid="protected-content">ناوەڕۆکی داشبۆردی مامۆستا</div>
          </FeatureFlagRoute>
        </FeatureFlagProvider>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      expect(screen.getByText("ناوەڕۆکی داشبۆردی مامۆستا")).toBeInTheDocument();
      expect(screen.queryByText("بەزووی دێت ✨")).not.toBeInTheDocument();
    });

    it("renders Kurdish ComingSoon component when the feature flag is disabled", () => {
      render(
        <FeatureFlagProvider initialOverrides={{ teacher_dashboard: false }}>
          <FeatureFlagRoute flag="TEACHER_DASHBOARD">
            <div data-testid="protected-content">ناوەڕۆکی داشبۆردی مامۆستا</div>
          </FeatureFlagRoute>
        </FeatureFlagProvider>
      );

      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByText("بەزووی دێت ✨")).toBeInTheDocument();
      expect(screen.getByText("ئەم تایبەتمەندییە لە نوێکردنەوەی داهاتوودا دێت")).toBeInTheDocument();
      expect(screen.getByText("گەڕانەوە بۆ پەڕەی سەرەتا")).toBeInTheDocument();
    });

    it("calls onNavigateHome when return button is clicked on ComingSoon", () => {
      const onNavigateHome = vi.fn();

      render(
        <ComingSoon
          title="بەزووی دێت ✨"
          subtitle="داشبۆردی بەڕێوەبەر بەم زووانە کارا دەبێت"
          onNavigateHome={onNavigateHome}
        />
      );

      const homeBtn = screen.getByRole("button", { name: /گەڕانەوە بۆ پەڕەی سەرەتا/i });
      fireEvent.click(homeBtn);

      expect(onNavigateHome).toHaveBeenCalledTimes(1);
    });

    it("renders custom fallback if provided and flag is disabled", () => {
      render(
        <FeatureFlagProvider initialOverrides={{ teacher_dashboard: false }}>
          <FeatureFlagRoute
            flag="TEACHER_DASHBOARD"
            fallback={<div data-testid="custom-fallback">دەروازە داخراوە</div>}
          >
            <div>ناوەڕۆک</div>
          </FeatureFlagRoute>
        </FeatureFlagProvider>
      );

      expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
      expect(screen.queryByText("ناوەڕۆک")).not.toBeInTheDocument();
    });
  });
});
