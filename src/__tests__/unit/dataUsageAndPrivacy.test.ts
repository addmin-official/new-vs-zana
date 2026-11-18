import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calculateLocalCacheMetrics,
  clearLocalCache,
  getPersonalizationSettings,
  savePersonalizationSettings,
  resetPersonalizationSettings,
  DEFAULT_PERSONALIZATION_SETTINGS,
} from "../../services/dataUsageService.ts";
import { curriculumSWRCache } from "../../store/curriculumCache.ts";

describe("Data Usage & Privacy Service", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("calculateLocalCacheMetrics", () => {
    it("returns formatted size and baseline metrics when cache is empty", () => {
      const metrics = calculateLocalCacheMetrics();
      expect(metrics.totalEstimatedKb).toBeGreaterThanOrEqual(0);
      expect(metrics.formattedSize).toMatch(/KB|MB/);
    });

    it("measures size of zana.cache entries in localStorage", () => {
      localStorage.setItem("zana.cache.mastery.student1.chem", JSON.stringify({ score: 95 }));
      localStorage.setItem("zana.cache.studyPlan.student1.w1", JSON.stringify({ plan: "chem" }));
      localStorage.setItem("unrelated_key", "ignore this");

      const metrics = calculateLocalCacheMetrics();
      expect(metrics.localStorageBytes).toBeGreaterThan(0);
    });
  });

  describe("clearLocalCache", () => {
    it("clears zana.cache and temporary items without deleting user profile or auth session", async () => {
      // Setup mock cached items
      localStorage.setItem("zana.cache.mastery.std1.chem", JSON.stringify({ data: "mastery" }));
      localStorage.setItem("zana.cache.studyPlan.std1.w1", JSON.stringify({ data: "plan" }));
      localStorage.setItem("zana_studypath_tasks_v2", JSON.stringify(["task1"]));
      localStorage.setItem("zana_leitner_cards", JSON.stringify([{ id: 1 }]));

      // Setup permanent user items that must NOT be deleted
      localStorage.setItem("zana.profile.v1", JSON.stringify({ name: "Karwan", grade: "12" }));
      localStorage.setItem("zana_auth_token", "jwt-token-123");
      localStorage.setItem("zana_user_role", "student");

      const spyClear = vi.spyOn(curriculumSWRCache, "clear");

      const result = await clearLocalCache({
        clearAiResponses: false,
        clearCurriculumCache: true,
      });

      expect(result.success).toBe(true);
      expect(spyClear).toHaveBeenCalled();

      // Check cache keys removed
      expect(localStorage.getItem("zana.cache.mastery.std1.chem")).toBeNull();
      expect(localStorage.getItem("zana.cache.studyPlan.std1.w1")).toBeNull();
      expect(localStorage.getItem("zana_studypath_tasks_v2")).toBeNull();
      expect(localStorage.getItem("zana_leitner_cards")).toBeNull();

      // Check permanent user identity preserved
      expect(localStorage.getItem("zana.profile.v1")).not.toBeNull();
      expect(localStorage.getItem("zana_auth_token")).toBe("jwt-token-123");
      expect(localStorage.getItem("zana_user_role")).toBe("student");
    });
  });

  describe("Personalization Data Management", () => {
    it("returns default personalization settings when no custom data is saved", () => {
      const settings = getPersonalizationSettings("student_test_1");
      expect(settings.tutorStyle).toBe(DEFAULT_PERSONALIZATION_SETTINGS.tutorStyle);
      expect(settings.learningPace).toBe("standard");
      expect(settings.difficultyLevel).toBe("adaptive");
      expect(settings.allowAdaptiveRecommendations).toBe(true);
      expect(settings.allowAiExplanationMemory).toBe(true);
    });

    it("saves and retrieves updated student personalization preferences", () => {
      savePersonalizationSettings(
        {
          tutorStyle: "comprehensive",
          learningPace: "intensive",
          difficultyLevel: "challenging",
          allowAdaptiveRecommendations: false,
          allowAiExplanationMemory: true,
        },
        "student_test_1"
      );

      const retrieved = getPersonalizationSettings("student_test_1");
      expect(retrieved.tutorStyle).toBe("comprehensive");
      expect(retrieved.learningPace).toBe("intensive");
      expect(retrieved.difficultyLevel).toBe("challenging");
      expect(retrieved.allowAdaptiveRecommendations).toBe(false);
      expect(retrieved.allowAiExplanationMemory).toBe(true);
      expect(retrieved.updatedAt).toBeDefined();
    });

    it("resets personalization settings and clears weak concept flags", () => {
      const studentId = "student_test_reset";
      savePersonalizationSettings(
        {
          tutorStyle: "balanced",
          learningPace: "gradual",
          difficultyLevel: "foundational",
          allowAdaptiveRecommendations: false,
          allowAiExplanationMemory: false,
        },
        studentId
      );

      localStorage.setItem(`zana_weak_concepts_${studentId}_chem`, JSON.stringify(["acids"]));

      const reset = resetPersonalizationSettings(studentId);

      expect(reset.tutorStyle).toBe("socratic");
      expect(reset.learningPace).toBe("standard");
      expect(reset.difficultyLevel).toBe("adaptive");
      expect(reset.allowAdaptiveRecommendations).toBe(true);
      expect(localStorage.getItem(`zana_weak_concepts_${studentId}_chem`)).toBeNull();
    });
  });
});
