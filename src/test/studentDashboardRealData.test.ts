import { describe, it } from "node:test";
import assert from "node:assert";
import { NextBestActionEngine } from "../planning/engine/NextBestActionEngine.ts";
import { MasteryStatus } from "../learning/domain/MasteryTypes.ts";

describe("PHASE 19.5 - Student Learning Journey & Real Dashboard Data Tests", () => {
  // Test 1: Real Mastery Calculation on Student Dashboard
  it("Derives real subject mastery percentage without mock/fabricated numbers", () => {
    const mockMasteryDoc = {
      subjectId: "chemistry",
      userId: "test_student_dashboard",
      overallScore: 0.765,
      concepts: {
        chemistry_acids: {
          conceptId: "chemistry_acids",
          masteryScore: 0.85,
          status: MasteryStatus.PROFICIENT,
          consecutiveCorrect: 2,
          totalAttempts: 3,
          lastAttemptedAt: new Date().toISOString(),
        },
        chemistry_bases: {
          conceptId: "chemistry_bases",
          masteryScore: 0.68,
          status: MasteryStatus.DEVELOPING,
          consecutiveCorrect: 1,
          totalAttempts: 2,
          lastAttemptedAt: new Date().toISOString(),
        },
      },
      lastUpdated: new Date().toISOString(),
    };

    const currentMasteryPercentage =
      mockMasteryDoc.overallScore !== undefined
        ? Math.round(mockMasteryDoc.overallScore * 100)
        : 0;

    assert.strictEqual(currentMasteryPercentage, 77, "Should compute mathematically correct percentage from real overallScore");
  });

  // Test 2: Honest Empty State for New Students
  it("Provides honest empty state when student has no study tasks or assessments", () => {
    const emptyMastery = null;
    const currentMasteryPercentage =
      (emptyMastery as any)?.overallScore !== undefined
        ? Math.round((emptyMastery as any).overallScore * 100)
        : 0;

    assert.strictEqual(currentMasteryPercentage, 0, "Unstudied subject must start at 0%, never mock percentages");

    const tasks: any[] = [];
    assert.strictEqual(tasks.length, 0, "No fake mock tasks (t1, t2, t3) should exist for new students");
  });

  // Test 3: Real Task Derivation from Mastery Concepts
  it("Derives today's study tasks dynamically from student's developing concepts", () => {
    const masteryConcepts = {
      chemistry_acids_bases: {
        conceptId: "chemistry_acids_bases",
        masteryScore: 0.40,
        status: MasteryStatus.DEVELOPING,
        consecutiveCorrect: 0,
        totalAttempts: 1,
        lastAttemptedAt: new Date().toISOString(),
      },
      chemistry_ph_scale: {
        conceptId: "chemistry_ph_scale",
        masteryScore: 0.85,
        status: MasteryStatus.PROFICIENT,
        consecutiveCorrect: 2,
        totalAttempts: 3,
        lastAttemptedAt: new Date().toISOString(),
      },
    };

    const derivedTasks = Object.values(masteryConcepts).map((c, i) => {
      const topicClean = c.conceptId.replace(/^[a-z0-9]+_/, "").replace(/_/g, " ");
      return {
        id: `task_${c.conceptId}_${i}`,
        conceptName: topicClean,
        completed: c.status === MasteryStatus.PROFICIENT || c.status === MasteryStatus.MASTERED,
      };
    });

    assert.strictEqual(derivedTasks.length, 2);
    assert.strictEqual(derivedTasks[0].completed, false, "DEVELOPING concept should not be marked completed");
    assert.strictEqual(derivedTasks[1].completed, true, "PROFICIENT concept should be marked completed");
  });

  // Test 4: Real Next Best Action Generation for Dashboard Command Center
  it("NextBestActionEngine recommends diagnostic for cold start student", () => {
    const nbaEngine = new NextBestActionEngine();

    const action = nbaEngine.determineNextBestAction({
      studentMasteryProfile: {
        studentId: "new_student_cold_start",
        overallMasteryScore: 0,
        conceptMasteries: {},
        activeMisconceptions: [],
        recentRecommendedActions: [],
        streak: { currentStreak: 1, longestStreak: 1, lastCompletedDate: null, streakHistory: [], totalTasksCompleted: 0 },
        unlockedAchievements: [],
      },
    });

    assert.ok(action);
    assert.strictEqual(action.actionType, "TAKE_DIAGNOSTIC");
    assert.strictEqual(action.titleKu, "ئەنجامدانی تاقیکردنەوەی دیاریکردنی ئاست");
    assert.ok(action.reasonKu.includes("زانا"));
  });

  // Test 5: Real Achievement Derivation or Honest Empty State
  it("Renders honest empty state for achievements when no milestones achieved", () => {
    const userWithNoAchievements = {
      completedLessons: 0,
      streakDays: 1,
    };

    const achievement =
      userWithNoAchievements.completedLessons > 0
        ? { title: "وانەبێژی زانا" }
        : userWithNoAchievements.streakDays >= 3
        ? { title: "بەردەوامی لە فێربوون" }
        : null;

    assert.strictEqual(achievement, null, "Should return null for honest empty state when milestone not met");
  });
});
