import { test } from "node:test";
import assert from "node:assert";
import { AdaptiveLearningEngine } from "./AdaptiveLearningEngine.ts";
import { MasteryStatus, DifficultyLevel, MisconceptionStatus } from "../domain/MasteryTypes.ts";

test("AdaptiveLearningEngine - Mastery Score Calculations", () => {
  // Test baseline mastery calculation
  const initMastery = AdaptiveLearningEngine.calculateNewMastery(null, {
    isCorrect: true,
    responseTimeMs: 3000,
    difficulty: DifficultyLevel.STANDARD // medium difficulty
  });

  assert.strictEqual(initMastery.totalAttempts, 1);
  assert.strictEqual(initMastery.consecutiveCorrect, 1);
  assert.ok(initMastery.masteryScore > 0);
  assert.strictEqual(initMastery.status, MasteryStatus.INTRODUCED);

  // Test decay on wrong answer
  const wrongMastery = AdaptiveLearningEngine.calculateNewMastery(initMastery, {
    isCorrect: false,
    responseTimeMs: 12000,
    difficulty: DifficultyLevel.STANDARD
  });

  assert.strictEqual(wrongMastery.totalAttempts, 2);
  assert.strictEqual(wrongMastery.consecutiveCorrect, 0);
  assert.ok(wrongMastery.masteryScore < initMastery.masteryScore);
});

test("AdaptiveLearningEngine - Misconception Detection", () => {
  const mockAttempt = {
    id: "att_1",
    studentId: "stud_1",
    conceptId: "hawkisha",
    isCorrect: false,
    responseTimeMs: 5000,
    difficulty: DifficultyLevel.EASY,
    questionText: "شیکاری هاوکێشە بکە: x + 5 = 10",
    studentResponse: "x = -5",
    timestamp: new Date().toISOString()
  };

  const detected = AdaptiveLearningEngine.detectMisconception(mockAttempt, []);
  assert.ok(detected !== null);
  assert.strictEqual(detected.misconceptionId, "misc_sign_flip");
  assert.strictEqual(detected.count, 1);
});

test("AdaptiveLearningEngine - Difficulty Adaptation Logic", () => {
  const easyHistory = [{ isCorrect: false }, { isCorrect: false }];
  const easyDiff = AdaptiveLearningEngine.adaptDifficulty("concept_1", easyHistory);
  assert.strictEqual(easyDiff, DifficultyLevel.FOUNDATION); // should suggest FOUNDATION on complete failures

  const hardHistory = [{ isCorrect: true }, { isCorrect: true }, { isCorrect: true }];
  const hardDiff = AdaptiveLearningEngine.adaptDifficulty("concept_1", hardHistory);
  assert.strictEqual(hardDiff, DifficultyLevel.CHALLENGING); // should suggest CHALLENGING on consecutive successes
});

test("AdaptiveLearningEngine - Prerequisite Cycle Detection", () => {
  const prereqGraph = {
    "A": ["B"],
    "B": ["C"],
    "C": ["A"] // cycle
  };

  const hasCycle = AdaptiveLearningEngine.hasPrerequisiteCycle(prereqGraph, "A");
  assert.strictEqual(hasCycle, true);

  const cleanGraph = {
    "A": ["B"],
    "B": ["C"],
    "C": []
  };
  const hasNoCycle = AdaptiveLearningEngine.hasPrerequisiteCycle(cleanGraph, "A");
  assert.strictEqual(hasNoCycle, false);
});

test("AdaptiveLearningEngine - Spaced Repetition (SM-2) Algorithm", () => {
  const baseDate = new Date("2026-11-15T12:00:00Z");

  // First successful repetition (quality 5)
  const rep1 = AdaptiveLearningEngine.calculateSM2Interval(true, 0, 1, 2.5, 5, baseDate);
  assert.strictEqual(rep1.newRepetitionCount, 1);
  assert.strictEqual(rep1.nextIntervalDays, 1);
  assert.ok(rep1.newStabilityFactor > 2.5);

  // Second successful repetition
  const rep2 = AdaptiveLearningEngine.calculateSM2Interval(true, rep1.newRepetitionCount, rep1.nextIntervalDays, rep1.newStabilityFactor, 5, baseDate);
  assert.strictEqual(rep2.newRepetitionCount, 2);
  assert.strictEqual(rep2.nextIntervalDays, 6);

  // Third successful repetition: interval = round(6 * stabilityFactor)
  const rep3 = AdaptiveLearningEngine.calculateSM2Interval(true, rep2.newRepetitionCount, rep2.nextIntervalDays, rep2.newStabilityFactor, 5, baseDate);
  assert.strictEqual(rep3.newRepetitionCount, 3);
  assert.ok(rep3.nextIntervalDays >= 15);

  // Failed repetition (quality 2 or incorrect): resets repetitionCount and interval to 1
  const failRep = AdaptiveLearningEngine.calculateSM2Interval(false, 3, 15, 2.6, 2, baseDate);
  assert.strictEqual(failRep.newRepetitionCount, 0);
  assert.strictEqual(failRep.nextIntervalDays, 1);
  assert.ok(failRep.newStabilityFactor < 2.6);
});

test("AdaptiveLearningEngine - Forgetting Curve Decay", () => {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  // Test decay for score < 0.7 (15% per day)
  const lowerScoreState = {
    conceptId: "acid_base",
    masteryScore: 0.5,
    status: MasteryStatus.DEVELOPING,
    totalAttempts: 5,
    consecutiveCorrect: 2,
    lastAttemptedAt: twoDaysAgo,
    lastReviewedAt: twoDaysAgo,
    history: []
  };
  const decayedLow = AdaptiveLearningEngine.applyForgettingCurve(lowerScoreState);
  // Expected: 0.5 * (1 - 0.15)^2 = 0.5 * 0.7225 = 0.361
  assert.strictEqual(decayedLow.masteryScore, 0.361);
  assert.strictEqual(decayedLow.lastChangeExplanation, "FORGETTING_CURVE_DECAY");

  // Test decay for score >= 0.7 (5% per day)
  const highScoreState = {
    conceptId: "kinetics",
    masteryScore: 0.8,
    status: MasteryStatus.MASTERED,
    totalAttempts: 10,
    consecutiveCorrect: 5,
    lastAttemptedAt: twoDaysAgo,
    lastReviewedAt: twoDaysAgo,
    history: []
  };
  const decayedHigh = AdaptiveLearningEngine.applyForgettingCurve(highScoreState);
  // Expected: 0.8 * (1 - 0.05)^2 = 0.8 * 0.9025 = 0.722
  assert.strictEqual(decayedHigh.masteryScore, 0.722);
  // Dropped below 0.75 from MASTERED -> status should become NEEDS_REVIEW
  assert.strictEqual(decayedHigh.status, MasteryStatus.NEEDS_REVIEW);

  // 0 days elapsed -> no decay
  const freshState = {
    conceptId: "kinetics",
    masteryScore: 0.8,
    status: MasteryStatus.MASTERED,
    totalAttempts: 10,
    consecutiveCorrect: 5,
    lastAttemptedAt: new Date().toISOString(),
    history: []
  };
  const noDecay = AdaptiveLearningEngine.applyForgettingCurve(freshState);
  assert.strictEqual(noDecay.masteryScore, 0.8);
});

test("AdaptiveLearningEngine - 5-Tier Mastery & Attempt Gating", () => {
  // Score < 0.10 -> NOT_STARTED
  assert.strictEqual(AdaptiveLearningEngine.determineMasteryTier(0.05, 10), MasteryStatus.NOT_STARTED);

  // Score 0.10-0.35 -> INTRODUCED
  assert.strictEqual(AdaptiveLearningEngine.determineMasteryTier(0.25, 1), MasteryStatus.INTRODUCED);

  // Score 0.35-0.60: requires min 3 attempts to reach DEVELOPING
  assert.strictEqual(AdaptiveLearningEngine.determineMasteryTier(0.50, 2), MasteryStatus.INTRODUCED); // gated
  assert.strictEqual(AdaptiveLearningEngine.determineMasteryTier(0.50, 3), MasteryStatus.DEVELOPING);

  // Score 0.60-0.80: requires min 5 attempts to reach PROFICIENT
  assert.strictEqual(AdaptiveLearningEngine.determineMasteryTier(0.70, 4), MasteryStatus.DEVELOPING); // gated
  assert.strictEqual(AdaptiveLearningEngine.determineMasteryTier(0.70, 5), MasteryStatus.PROFICIENT);

  // Score >= 0.80: requires min 7 attempts to reach MASTERED
  assert.strictEqual(AdaptiveLearningEngine.determineMasteryTier(0.90, 6), MasteryStatus.PROFICIENT); // gated
  assert.strictEqual(AdaptiveLearningEngine.determineMasteryTier(0.90, 7), MasteryStatus.MASTERED);
});

test("AdaptiveLearningEngine - Dynamic Difficulty Index (DDI) & Multi-session Calibration", () => {
  // DDI calculation over last 10 attempts
  const history = [
    { isCorrect: true }, { isCorrect: true }, { isCorrect: false },
    { isCorrect: true }, { isCorrect: true }, { isCorrect: true },
    { isCorrect: true }, { isCorrect: true }, { isCorrect: false },
    { isCorrect: true }
  ];
  const ddi = AdaptiveLearningEngine.calculateDDI(history, 10);
  assert.strictEqual(ddi, 0.8);

  // Calibration: 3 consecutive sessions > 0.85 -> HARDER
  const harderRec = AdaptiveLearningEngine.evaluateSessionDifficultyCalibration([0.9, 0.88, 0.92]);
  assert.strictEqual(harderRec, "HARDER");

  // Calibration: 2 consecutive sessions < 0.40 -> EASIER
  const easierRec = AdaptiveLearningEngine.evaluateSessionDifficultyCalibration([0.35, 0.38]);
  assert.strictEqual(easierRec, "EASIER");

  // Calibration: normal performance -> MAINTAIN
  const maintainRec = AdaptiveLearningEngine.evaluateSessionDifficultyCalibration([0.65, 0.72, 0.80]);
  assert.strictEqual(maintainRec, "MAINTAIN");
});

test("AdaptiveLearningEngine - Misconception Pattern Tracking & Persistence", () => {
  // Test 3x consecutive failure pattern triggers ACTIVE_MISCONCEPTION
  const mockAttempt = {
    id: "att_fail_3",
    studentId: "stud_1",
    conceptId: "thermodynamics",
    isCorrect: false,
    responseTimeMs: 8000,
    difficulty: DifficultyLevel.STANDARD,
    questionText: "پێناسەی وزەی گەرمی",
    studentResponse: "وەڵامی هەڵە",
    timestamp: new Date().toISOString()
  };

  const conceptHistory = [
    { isCorrect: false },
    { isCorrect: false }
  ];

  const detected = AdaptiveLearningEngine.detectMisconception(mockAttempt, [], conceptHistory, 0);
  assert.ok(detected !== null);
  assert.strictEqual(detected.isActive, true);
  assert.strictEqual(detected.activeFlag, "ACTIVE_MISCONCEPTION");
  assert.strictEqual(detected.misconceptionType, "conceptual");
  assert.ok(detected.flaggedAt !== undefined);

  // Test procedural misconception detection
  const proceduralAttempt = {
    id: "att_proc_1",
    studentId: "stud_1",
    conceptId: "algebra",
    isCorrect: false,
    responseTimeMs: 6000,
    difficulty: DifficultyLevel.STANDARD,
    questionText: "شیکاری هاوکێشە بکە: 2x = 8",
    studentResponse: "x = 8 - 2",
    timestamp: new Date().toISOString()
  };
  const procDetected = AdaptiveLearningEngine.detectMisconception(proceduralAttempt, []);
  assert.ok(procDetected !== null);
  assert.strictEqual(procDetected.misconceptionType, "procedural");

  // Test resolution: 3 consecutive correct answers resolves the active misconception
  const resolved = AdaptiveLearningEngine.detectMisconception(
    { ...mockAttempt, isCorrect: true },
    [detected],
    [{ isCorrect: true }, { isCorrect: true }, { isCorrect: true }],
    3
  );
  assert.ok(resolved !== null);
  assert.strictEqual(resolved.status, MisconceptionStatus.RESOLVED);
  assert.strictEqual(resolved.isActive, false);
  assert.ok(resolved.resolvedAt !== null);
});

test("AdaptiveLearningEngine - Response Time Intelligence & Partial Mastery", () => {
  // Percentile calculation
  const times = [2000, 3000, 4000, 5000, 6000, 8000, 10000, 12000, 15000, 20000];
  const percentiles = AdaptiveLearningEngine.calculateResponseTimePercentiles(times, DifficultyLevel.STANDARD);
  assert.strictEqual(percentiles.p50, 8000);
  assert.strictEqual(percentiles.p75, 12000);
  assert.strictEqual(percentiles.p95, 20000);

  // Speed classification
  assert.strictEqual(AdaptiveLearningEngine.classifyResponseSpeed(3000, true, percentiles), "FAST_CORRECT");
  assert.strictEqual(AdaptiveLearningEngine.classifyResponseSpeed(10000, true, percentiles), "NORMAL_CORRECT");
  assert.strictEqual(AdaptiveLearningEngine.classifyResponseSpeed(16000, true, percentiles), "SLOW_CORRECT");
  assert.strictEqual(AdaptiveLearningEngine.classifyResponseSpeed(25000, true, percentiles), "VERY_SLOW_CORRECT");

  // Slow correct gives partial gain (+0.03) and specific explanationCode
  const previousState = {
    conceptId: "acid_base",
    masteryScore: 0.40,
    status: MasteryStatus.DEVELOPING,
    totalAttempts: 3,
    consecutiveCorrect: 1,
    lastAttemptedAt: new Date().toISOString(),
    history: []
  };

  const slowAttempt = {
    isCorrect: true,
    responseTimeMs: 35000, // Very slow for standard
    difficulty: DifficultyLevel.STANDARD
  };

  const result = AdaptiveLearningEngine.calculateMasteryWithResult(previousState, slowAttempt);
  assert.strictEqual(result.explanationCode, "CORRECT_ATTEMPT_SLOW_PARTIAL");
  assert.strictEqual(result.scoreChange, 0.03);
  assert.strictEqual(result.newState.masteryScore, 0.43);
  assert.ok(result.nextReviewDue !== undefined);
  assert.ok(result.stabilityFactor !== undefined);
});
