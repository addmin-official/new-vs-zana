import test from "node:test";
import assert from "node:assert/strict";
import { PRACTICE_MODULES } from "./practiceData.ts";
import { PracticeStorage, AVAILABLE_BADGES } from "./practiceStorage.ts";

test("Practice Modules - Data integrity and coverage", () => {
  assert.ok(PRACTICE_MODULES.length >= 10, "Should provide at least 10 core practice modules");

  const grades = new Set(PRACTICE_MODULES.map((m) => m.grade));
  assert.ok(grades.has("9"), "Must cover Grade 9");
  assert.ok(grades.has("10"), "Must cover Grade 10");
  assert.ok(grades.has("11"), "Must cover Grade 11");
  assert.ok(grades.has("12"), "Must cover Grade 12");

  const subjects = new Set(PRACTICE_MODULES.map((m) => m.subject));
  assert.ok(subjects.has("math"), "Must cover Math");
  assert.ok(subjects.has("physics"), "Must cover Physics");
  assert.ok(subjects.has("chemistry"), "Must cover Chemistry");
  assert.ok(subjects.has("english"), "Must cover English");

  // Verify each module structure
  PRACTICE_MODULES.forEach((m) => {
    assert.ok(m.id && m.id.length > 0, "Module must have an id");
    assert.ok(m.titleKu && m.titleKu.length > 0, "Module must have a Kurdish title");
    assert.ok(m.subtitleKu && m.subtitleKu.length > 0, "Module must have a Kurdish subtitle");
    assert.ok(m.xpReward > 0, "Module must have positive XP reward");

    if (m.moduleType === "step_solver") {
      assert.ok(m.stepSolverData, `Module ${m.id} must have stepSolverData`);
      assert.ok(m.stepSolverData.steps.length >= 2, `Module ${m.id} must have at least 2 steps`);
      m.stepSolverData.steps.forEach((step) => {
        assert.ok(step.options.length >= 2, `Step ${step.stepNumber} in ${m.id} must have at least 2 options`);
        assert.ok(step.options.some((o) => o.isCorrect), `Step ${step.stepNumber} must have at least 1 correct option`);
        assert.ok(step.hintKu.length > 0, `Step ${step.stepNumber} must have a Kurdish hint`);
      });
    }

    if (m.moduleType === "interactive_diagram") {
      assert.ok(m.diagramData, `Module ${m.id} must have diagramData`);
      assert.ok(m.diagramData.parameters.length >= 1, `Diagram ${m.id} must have parameters`);
      assert.ok(m.diagramData.challenges.length >= 1, `Diagram ${m.id} must have challenges`);
    }

    if (m.moduleType === "virtual_lab") {
      assert.ok(m.virtualLabData, `Module ${m.id} must have virtualLabData`);
      assert.ok(m.virtualLabData.tasks.length >= 1, `Lab ${m.id} must have inquiry tasks`);
      m.virtualLabData.tasks.forEach((task) => {
        assert.ok(task.options.some((o) => o.isCorrect), `Task ${task.id} in ${m.id} must have correct option`);
      });
    }

    if (m.moduleType === "gamified_quiz") {
      assert.ok(m.gamifiedQuizData, `Module ${m.id} must have gamifiedQuizData`);
      assert.ok(m.gamifiedQuizData.questions.length >= 3, `Quiz ${m.id} must have >= 3 questions`);
      assert.ok(m.gamifiedQuizData.timeLimitSeconds > 0, `Quiz ${m.id} must have time limit`);
    }
  });
});

test("Practice Storage - XP, completion and badges calculation", () => {
  // Mock localStorage for Node test runner
  const storageMap = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (key: string) => storageMap.get(key) || null,
    setItem: (key: string, val: string) => storageMap.set(key, val),
    removeItem: (key: string) => storageMap.delete(key),
    clear: () => storageMap.clear(),
    key: () => null,
    length: 0
  };

  const initial = PracticeStorage.getProgress();
  assert.ok(initial.totalXp >= 0);

  // Complete a module with a new badge
  const result = PracticeStorage.recordModuleCompletion("test_m1", 80, 4, 4, "badge_chem_titration");
  assert.equal(result.updatedState.totalXp, initial.totalXp + 80);
  assert.ok(result.newlyUnlockedBadges.some((b) => b.id === "badge_chem_titration"));

  const progressAfter = PracticeStorage.getProgress();
  assert.ok(progressAfter.completedModuleIds.includes("test_m1"));
  assert.ok(progressAfter.unlockedBadgeIds.includes("badge_chem_titration"));
  assert.equal(progressAfter.totalXp, initial.totalXp + 80);
});

test("Practice Badges - Registry integrity", () => {
  assert.ok(AVAILABLE_BADGES.length >= 6, "Must define at least 6 distinct badges");
  AVAILABLE_BADGES.forEach((badge) => {
    assert.ok(badge.id, "Badge must have an id");
    assert.ok(badge.titleKu, "Badge must have a Kurdish title");
    assert.ok(badge.descriptionKu, "Badge must have a Kurdish description");
  });
});
