import { test } from "node:test";
import assert from "node:assert";
import {
  PlanningValidation,
  PersonalLearningPlanEngine,
  NextBestActionEngine,
  StudyTaskPrioritizer,
  PersistentLearningPlanProvider,
  InMemoryLearningPlanProvider,
  StudyTaskStatus,
  StudyTaskType,
  LearningGoalType,
  GoalStatus,
  getSubjectKnowledgeGraph,
  topologicalSort,
  evaluateNodeStatus,
  generateIntelligentWeeklyPlan,
  calculateProgressForecast,
  calculateMomentumScore,
  evaluateMomentum
} from "./index.ts";
import { StudentMasteryProfile, MasteryStatus, DifficultyLevel } from "../learning/domain/MasteryTypes.ts";

test("1. PlanningValidation - empty input produces safe defaults", () => {
  const prefs = PlanningValidation.validatePreferences("student_1");
  assert.strictEqual(prefs.studentId, "student_1");
  assert.strictEqual(prefs.preferredStudyDays.length, 7);
  assert.strictEqual(prefs.preferredSessionLengthMinutes, 30);
  assert.strictEqual(prefs.maxTasksPerDay, 5);
});

test("1. PlanningValidation - clamps session length and tasks per day", () => {
  const prefs = PlanningValidation.validatePreferences("student_1", {
    preferredSessionLengthMinutes: 5,
    maxTasksPerDay: 25
  });
  assert.strictEqual(prefs.preferredSessionLengthMinutes, 10);
  assert.strictEqual(prefs.maxTasksPerDay, 15);
});

test("1. PlanningValidation - validates exam date", () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const futureStr = futureDate.toISOString().split("T")[0];

  const validPrefs = PlanningValidation.validatePreferences("student_1", { targetExamDate: futureStr });
  assert.strictEqual(validPrefs.targetExamDate, futureStr);

  assert.throws(() => {
    PlanningValidation.validatePreferences("student_1", { targetExamDate: "2020-01-01" });
  }, /تاریخی تاقیکردنەوە ناتوانێت لە ڕابردوودا بێت/);
});

test("2. PersonalLearningPlanEngine - generates structured plan", () => {
  const engine = new PersonalLearningPlanEngine();
  const prefs = PlanningValidation.validatePreferences("student_1");
  const goal = {
    id: "goal_1",
    studentId: "student_1",
    type: LearningGoalType.IMPROVE_SUBJECT,
    titleKu: "بیرکاری",
    targetSubjectId: "subject-math-g9",
    weeklyTargetMinutes: 180,
    successCriteria: { metric: "mastery_score" as const, targetValue: 0.8 },
    status: GoalStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const profile: StudentMasteryProfile = {
    studentId: "student_1",
    overallMasteryScore: 0,
    conceptMasteries: {},
    activeMisconceptions: [],
    recentRecommendedActions: []
  };

  const plan = engine.generatePlan({
    studentId: "student_1",
    preferences: prefs,
    goal,
    masteryProfile: profile
  });

  assert.strictEqual(plan.studentId, "student_1");
  assert.strictEqual(plan.weeklyPlans.length, 1);
  assert.strictEqual(plan.weeklyPlans[0].dailyPlans.length, 7);
  assert.strictEqual(plan.authoritative, true);
});

test("3. NextBestActionEngine - cold start & rest recommendations", () => {
  const engine = new NextBestActionEngine();
  const action1 = engine.determineNextBestAction({});
  assert.strictEqual(action1.actionType, "TAKE_DIAGNOSTIC");

  const action2 = engine.determineNextBestAction({
    completedMinutesToday: 60,
    maxMinutesToday: 60
  });
  assert.strictEqual(action2.actionType, "REST_AND_RESUME");
});

test("4. StudyTaskPrioritizer - prerequisite score calculation", () => {
  const res = StudyTaskPrioritizer.calculatePriority(StudyTaskType.PREREQUISITE, {
    isPrerequisiteForTarget: true
  });
  assert.ok(res.score >= 40);
  assert.strictEqual(res.reason.code, "PREREQUISITE_MISSING");
});

test("5. Task State Machine - transitions", () => {
  // Disallow PLANNED -> IN_PROGRESS directly
  assert.strictEqual(PlanningValidation.validateTaskTransition(StudyTaskStatus.PLANNED, StudyTaskStatus.IN_PROGRESS), false);
  // Normal flow: PLANNED -> AVAILABLE -> IN_PROGRESS -> COMPLETED
  assert.strictEqual(PlanningValidation.validateTaskTransition(StudyTaskStatus.PLANNED, StudyTaskStatus.AVAILABLE), true);
  assert.strictEqual(PlanningValidation.validateTaskTransition(StudyTaskStatus.AVAILABLE, StudyTaskStatus.IN_PROGRESS), true);
  assert.strictEqual(PlanningValidation.validateTaskTransition(StudyTaskStatus.IN_PROGRESS, StudyTaskStatus.COMPLETED), true);
  // Terminal COMPLETED cannot transition
  assert.strictEqual(PlanningValidation.validateTaskTransition(StudyTaskStatus.COMPLETED, StudyTaskStatus.IN_PROGRESS), false);
  // Duplicate completion is idempotent
  assert.strictEqual(PlanningValidation.validateTaskTransition(StudyTaskStatus.COMPLETED, StudyTaskStatus.COMPLETED), true);
  // Alternative transitions
  assert.strictEqual(PlanningValidation.validateTaskTransition(StudyTaskStatus.PLANNED, StudyTaskStatus.CANCELLED), true);
  assert.strictEqual(PlanningValidation.validateTaskTransition(StudyTaskStatus.AVAILABLE, StudyTaskStatus.SKIPPED), true);
  assert.strictEqual(PlanningValidation.validateTaskTransition(StudyTaskStatus.AVAILABLE, StudyTaskStatus.MISSED), true);
  assert.strictEqual(PlanningValidation.validateTaskTransition(StudyTaskStatus.IN_PROGRESS, StudyTaskStatus.SKIPPED), true);
  assert.strictEqual(PlanningValidation.validateTaskTransition(StudyTaskStatus.IN_PROGRESS, StudyTaskStatus.MISSED), true);
  assert.strictEqual(PlanningValidation.validateTaskTransition(StudyTaskStatus.SKIPPED, StudyTaskStatus.RESCHEDULED), true);
  assert.strictEqual(PlanningValidation.validateTaskTransition(StudyTaskStatus.MISSED, StudyTaskStatus.RESCHEDULED), true);
  assert.strictEqual(PlanningValidation.validateTaskTransition(StudyTaskStatus.RESCHEDULED, StudyTaskStatus.AVAILABLE), true);
});

test("6. LearningPlanProvider (InMemory)", async () => {
  const provider = new InMemoryLearningPlanProvider();
  const prefs = PlanningValidation.validatePreferences("student_test");
  await provider.savePreferences(prefs);

  const fetched = await provider.getPreferences("student_test");
  assert.notStrictEqual(fetched, null);
  assert.strictEqual(fetched?.studentId, "student_test");
});

test("7. PersistentLearningPlanProvider - production fail-closed without KV", () => {
  assert.throws(() => {
    new PersistentLearningPlanProvider(undefined, "production");
  }, /Cloudflare KV binding/);
});

test("8. Knowledge Graph - Topological sort and prerequisite dependency order", () => {
  const chemNodes = getSubjectKnowledgeGraph("chemistry", "12");
  assert.ok(chemNodes.length >= 5, "Chemistry graph should have at least 5 concepts");

  const sorted = topologicalSort(chemNodes);
  assert.strictEqual(sorted.length, chemNodes.length);

  // In sorted order, any prerequisite of node X must appear before X
  const seenIds = new Set<string>();
  for (const node of sorted) {
    for (const prereqId of node.prerequisites) {
      if (chemNodes.some(n => n.id === prereqId)) {
        assert.ok(
          seenIds.has(prereqId),
          `Prerequisite ${prereqId} must precede dependent node ${node.id} in topological order`
        );
      }
    }
    seenIds.add(node.id);
  }
});

test("8. Knowledge Graph - Blocked concepts when prerequisite mastery < 0.6", () => {
  const chemNodes = getSubjectKnowledgeGraph("chemistry", "12");
  const nodesMap = new Map(chemNodes.map(n => [n.id, n]));

  // Given: acids & bases has prerequisite solutions
  const acidsNode = chemNodes.find(n => n.id === "chem_g12_acids_bases")!;

  // Case A: Student has NOT mastered solutions (< 0.6)
  const weakProfile: StudentMasteryProfile = {
    studentId: "student_weak",
    overallMasteryScore: 0.3,
    conceptMasteries: {
      chem_g12_solutions: {
        conceptId: "chem_g12_solutions",
        masteryScore: 0.45, // < 0.6
        status: MasteryStatus.DEVELOPING,
        consecutiveCorrect: 1,
        totalAttempts: 3,
        lastAttemptedAt: null,
        history: []
      }
    },
    activeMisconceptions: [],
    recentRecommendedActions: []
  };

  const statusBlocked = evaluateNodeStatus(acidsNode, weakProfile, nodesMap);
  assert.strictEqual(statusBlocked.status, "LOCKED", "Downstream concept must be LOCKED if prerequisite < 0.6");
  assert.ok(statusBlocked.blockedBy.length > 0);

  // Case B: Student has mastered solutions (>= 0.6)
  const proficientProfile: StudentMasteryProfile = {
    studentId: "student_proficient",
    overallMasteryScore: 0.7,
    conceptMasteries: {
      chem_g12_solutions: {
        conceptId: "chem_g12_solutions",
        masteryScore: 0.75, // >= 0.6
        status: MasteryStatus.PROFICIENT,
        consecutiveCorrect: 4,
        totalAttempts: 5,
        lastAttemptedAt: null,
        history: []
      }
    },
    activeMisconceptions: [],
    recentRecommendedActions: []
  };

  const statusUnlocked = evaluateNodeStatus(acidsNode, proficientProfile, nodesMap);
  assert.strictEqual(statusUnlocked.status, "UNLOCKED", "Concept must be UNLOCKED when prerequisite >= 0.6");
});

test("9. Intelligent Weekly Plan Generator - Review prioritization, next unlocked, weak concepts", () => {
  const profile: StudentMasteryProfile = {
    studentId: "student_plan_test",
    overallMasteryScore: 0.5,
    conceptMasteries: {
      // Review item: marked as NEEDS_REVIEW or decaying
      chem_g12_solutions: {
        conceptId: "chem_g12_solutions",
        masteryScore: 0.7,
        status: MasteryStatus.NEEDS_REVIEW,
        consecutiveCorrect: 2,
        totalAttempts: 4,
        lastAttemptedAt: null,
        history: []
      },
      // Weak item: DDI < 0.5
      chem_g12_acids_bases: {
        conceptId: "chem_g12_acids_bases",
        masteryScore: 0.4,
        status: MasteryStatus.DEVELOPING,
        consecutiveCorrect: 0,
        totalAttempts: 5,
        ddi: 0.35, // DDI < 0.5
        lastAttemptedAt: null,
        history: []
      }
    },
    activeMisconceptions: [],
    recentRecommendedActions: []
  };

  const weeklyPlan = generateIntelligentWeeklyPlan({
    studentProfile: { studentId: "student_plan_test", grade: "12", activeSubject: "chemistry" },
    masteryProfile: profile,
    availableStudyHoursPerWeek: 14 // 2 hours/day
  });

  assert.strictEqual(weeklyPlan.days.length, 7, "Plan must cover all 7 days of the week");
  assert.ok(weeklyPlan.allItems.length >= 3, "Plan must generate items");

  // Check review item is prioritized first
  const reviewItems = weeklyPlan.allItems.filter(it => it.type === "review");
  assert.ok(reviewItems.length >= 1, "Must contain spaced review items");
  assert.strictEqual(reviewItems[0].conceptId, "chem_g12_solutions");

  // Check weak concept item is included
  const practiceItems = weeklyPlan.allItems.filter(it => it.type === "practice");
  assert.ok(practiceItems.some(it => it.conceptId === "chem_g12_acids_bases"));

  // Check next unlocked items are included
  const newItems = weeklyPlan.allItems.filter(it => it.type === "new");
  assert.ok(newItems.length >= 1, "Must contain next unlocked concepts");
});

test("10. Progress Forecasting - Velocity and +/-15% confidence interval for exam readiness", () => {
  const profile: StudentMasteryProfile = {
    studentId: "student_forecast_test",
    overallMasteryScore: 0.65,
    conceptMasteries: {
      chem_g12_solutions: { conceptId: "chem_g12_solutions", masteryScore: 0.85, status: MasteryStatus.MASTERED, consecutiveCorrect: 5, totalAttempts: 6, lastAttemptedAt: null, history: [] },
      chem_g12_acids_bases: { conceptId: "chem_g12_acids_bases", masteryScore: 0.75, status: MasteryStatus.PROFICIENT, consecutiveCorrect: 3, totalAttempts: 4, lastAttemptedAt: null, history: [] }
    },
    activeMisconceptions: [],
    recentRecommendedActions: [],
    streak: { currentStreak: 5, longestStreak: 10, lastCompletedDate: "2026-11-14", streakHistory: [], totalTasksCompleted: 20 }
  };

  const forecast = calculateProgressForecast({
    masteryProfile: profile,
    grade: "12",
    weeklyStudyHours: 20
  });

  assert.ok(forecast.subjects.length >= 4, "Must forecast all major subjects");
  assert.ok(forecast.overallWeeksToReadiness > 0, "Weeks to readiness must be calculated");
  
  // Verify +/- 15% confidence interval
  const estWeeks = forecast.overallWeeksToReadiness;
  assert.ok(forecast.confidenceIntervalWeeks.min <= estWeeks);
  assert.ok(forecast.confidenceIntervalWeeks.max >= estWeeks);
  assert.ok(Math.abs(forecast.confidenceIntervalWeeks.min - estWeeks * 0.85) < 0.2);
  assert.ok(Math.abs(forecast.confidenceIntervalWeeks.max - estWeeks * 1.15) < 0.2);

  // Verify completion date format YYYY-MM-DD
  assert.match(forecast.overallCompletionDate, /^\d{4}-\d{2}-\d{2}$/);
});

test("11. Streak and Momentum System - Score calculation and difficulty recommendation", () => {
  // Test momentum score calculation
  // baseline: 50 + (2 days * 10) + (1 prof * 5) + (1 mast * 15) - (1 missed * 20) - (0 inactive * 5)
  // = 50 + 20 + 5 + 15 - 20 = 70
  const score70 = calculateMomentumScore({
    daysStudied: 2,
    conceptsProficient: 1,
    conceptsMastered: 1,
    missedSessions: 1,
    daysInactive: 0,
    baselineMomentum: 50
  });
  assert.strictEqual(score70, 70);

  // Test clamp boundaries
  const clampedMax = calculateMomentumScore({
    daysStudied: 10,
    conceptsProficient: 10,
    conceptsMastered: 10,
    missedSessions: 0,
    daysInactive: 0,
    baselineMomentum: 50
  });
  assert.strictEqual(clampedMax, 100);

  const clampedMin = calculateMomentumScore({
    daysStudied: 0,
    conceptsProficient: 0,
    conceptsMastered: 0,
    missedSessions: 10,
    daysInactive: 10,
    baselineMomentum: 20
  });
  assert.strictEqual(clampedMin, 0);

  // Test momentum difficulty adaptation:
  // Score >= 75 -> CHALLENGING
  const evalHigh = evaluateMomentum(85);
  assert.strictEqual(evalHigh.recommendedDifficulty, DifficultyLevel.CHALLENGING);
  assert.strictEqual(evalHigh.trend, "RISING");

  // Score 40-74 -> STANDARD
  const evalMid = evaluateMomentum(55);
  assert.strictEqual(evalMid.recommendedDifficulty, DifficultyLevel.STANDARD);
  assert.strictEqual(evalMid.trend, "STABLE");

  // Score < 40 -> EASY
  const evalLow = evaluateMomentum(25);
  assert.strictEqual(evalLow.recommendedDifficulty, DifficultyLevel.EASY);
  assert.strictEqual(evalLow.trend, "FALLING");
});
