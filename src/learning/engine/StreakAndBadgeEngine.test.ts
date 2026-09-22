import { test } from "node:test";
import assert from "node:assert";
import {
  calculateUpdatedStreak,
  getEffectiveStreak,
  evaluateAchievements,
  getTodayDateString,
} from "./StreakAndBadgeEngine.ts";
import {
  StudentMasteryProfile,
  MasteryStatus,
} from "../domain/MasteryTypes.ts";

test("StreakEngine - initial task completion establishes streak", () => {
  const result = calculateUpdatedStreak(null, "2026-09-20");
  assert.strictEqual(result.updatedStreak.currentStreak, 1);
  assert.strictEqual(result.updatedStreak.longestStreak, 1);
  assert.strictEqual(result.updatedStreak.lastCompletedDate, "2026-09-20");
  assert.strictEqual(result.updatedStreak.totalTasksCompleted, 1);
  assert.strictEqual(result.isNewDay, true);
  assert.strictEqual(result.streakIncremented, true);
});

test("StreakEngine - multiple completions on the same day do not double-increment streak", () => {
  const day1 = calculateUpdatedStreak(null, "2026-09-20").updatedStreak;
  const day1Again = calculateUpdatedStreak(day1, "2026-09-20");

  assert.strictEqual(day1Again.updatedStreak.currentStreak, 1);
  assert.strictEqual(day1Again.updatedStreak.longestStreak, 1);
  assert.strictEqual(day1Again.updatedStreak.totalTasksCompleted, 2);
  assert.strictEqual(day1Again.isNewDay, false);
  assert.strictEqual(day1Again.streakIncremented, false);
});

test("StreakEngine - consecutive day completion increments streak and updates longest", () => {
  const day1 = calculateUpdatedStreak(null, "2026-09-20").updatedStreak;
  const day2 = calculateUpdatedStreak(day1, "2026-09-21");

  assert.strictEqual(day2.updatedStreak.currentStreak, 2);
  assert.strictEqual(day2.updatedStreak.longestStreak, 2);
  assert.strictEqual(day2.updatedStreak.lastCompletedDate, "2026-09-21");
  assert.strictEqual(day2.isNewDay, true);
  assert.strictEqual(day2.streakIncremented, true);

  const day3 = calculateUpdatedStreak(day2.updatedStreak, "2026-09-22");
  assert.strictEqual(day3.updatedStreak.currentStreak, 3);
  assert.strictEqual(day3.updatedStreak.longestStreak, 3);
});

test("StreakEngine - broken streak resets to 1 but retains longest streak", () => {
  const streakAt3 = {
    currentStreak: 3,
    longestStreak: 5,
    lastCompletedDate: "2026-09-18",
    streakHistory: ["2026-09-18", "2026-09-17", "2026-09-16"],
    totalTasksCompleted: 10,
  };

  // Skip 3 days to 2026-09-21
  const result = calculateUpdatedStreak(streakAt3, "2026-09-21");
  assert.strictEqual(result.updatedStreak.currentStreak, 1);
  assert.strictEqual(result.updatedStreak.longestStreak, 5); // retained!
  assert.strictEqual(result.updatedStreak.lastCompletedDate, "2026-09-21");
  assert.strictEqual(result.isNewDay, true);
});

test("StreakEngine - getEffectiveStreak accurately detects completed today, at risk, and lapsed", () => {
  // Case 1: Completed today
  const today = getTodayDateString();
  const streakToday = {
    currentStreak: 4,
    longestStreak: 4,
    lastCompletedDate: today,
    streakHistory: [today],
    totalTasksCompleted: 4,
  };
  const effectiveToday = getEffectiveStreak(streakToday, today);
  assert.strictEqual(effectiveToday.isCompletedToday, true);
  assert.strictEqual(effectiveToday.activeStreak, 4);
  assert.strictEqual(effectiveToday.isAtRisk, false);

  // Case 2: Completed yesterday (at risk today)
  const effectiveYesterday = getEffectiveStreak(
    { ...streakToday, lastCompletedDate: "2026-09-20" },
    "2026-09-21"
  );
  assert.strictEqual(effectiveYesterday.isCompletedToday, false);
  assert.strictEqual(effectiveYesterday.isAtRisk, true);
  assert.strictEqual(effectiveYesterday.activeStreak, 4);

  // Case 3: Lapsed (>1 day)
  const effectiveLapsed = getEffectiveStreak(
    { ...streakToday, lastCompletedDate: "2026-09-15" },
    "2026-09-21"
  );
  assert.strictEqual(effectiveLapsed.isCompletedToday, false);
  assert.strictEqual(effectiveLapsed.isAtRisk, false);
  assert.strictEqual(effectiveLapsed.activeStreak, 0);
});

test("AchievementEngine - unlocks 'Mastered Chemistry' when chemistry concept is mastered", () => {
  const profile: StudentMasteryProfile = {
    studentId: "student_1",
    overallMasteryScore: 0.5,
    conceptMasteries: {
      "chem_acid_base": {
        conceptId: "chem_acid_base",
        masteryScore: 0.92,
        status: MasteryStatus.MASTERED,
        totalAttempts: 5,
        consecutiveCorrect: 4,
        history: [],
        lastAttemptedAt: "2026-09-21T10:00:00Z",
      },
    },
    activeMisconceptions: [],
    recentRecommendedActions: [],
    unlockedAchievements: [],
  };

  const { badges, newlyUnlockedIds } = evaluateAchievements(profile);
  const chemBadge = badges.find((b) => b.id === "mastered_chemistry");
  assert.ok(chemBadge);
  assert.strictEqual(chemBadge.isUnlocked, true);
  assert.ok(newlyUnlockedIds.includes("mastered_chemistry"));
});

test("AchievementEngine - unlocks 'Top Performer' for high overall score or 3 mastered concepts", () => {
  const profile: StudentMasteryProfile = {
    studentId: "student_top",
    overallMasteryScore: 0.85,
    conceptMasteries: {
      "math_algebra": {
        conceptId: "math_algebra",
        masteryScore: 0.85,
        status: MasteryStatus.MASTERED,
        totalAttempts: 3,
        consecutiveCorrect: 3,
        history: [],
        lastAttemptedAt: "2026-09-21T10:00:00Z",
      },
    },
    activeMisconceptions: [],
    recentRecommendedActions: [],
    unlockedAchievements: [],
  };

  const { badges, newlyUnlockedIds } = evaluateAchievements(profile);
  const topBadge = badges.find((b) => b.id === "top_performer");
  assert.ok(topBadge);
  assert.strictEqual(topBadge.isUnlocked, true);
  assert.ok(newlyUnlockedIds.includes("top_performer"));
});

test("AchievementEngine - unlocks '3-Day Streak' badge when streak hits 3", () => {
  const profile: StudentMasteryProfile = {
    studentId: "student_streak",
    overallMasteryScore: 0.3,
    conceptMasteries: {},
    activeMisconceptions: [],
    recentRecommendedActions: [],
    streak: {
      currentStreak: 3,
      longestStreak: 3,
      lastCompletedDate: "2026-09-21",
      streakHistory: ["2026-09-21", "2026-09-20", "2026-09-19"],
      totalTasksCompleted: 3,
    },
    unlockedAchievements: [],
  };

  const { badges, newlyUnlockedIds } = evaluateAchievements(profile);
  const streakBadge = badges.find((b) => b.id === "daily_streak_3");
  assert.ok(streakBadge);
  assert.strictEqual(streakBadge.isUnlocked, true);
  assert.ok(newlyUnlockedIds.includes("daily_streak_3"));
});
