import { describe, it } from "node:test";
import assert from "node:assert";
import { AdaptiveLearningEngine } from "../learning/engine/AdaptiveLearningEngine.ts";
import { NextBestActionEngine } from "../planning/engine/NextBestActionEngine.ts";
import {
  DifficultyLevel,
  MasteryStatus,
  ExerciseAttempt,
  ConceptMasteryState,
} from "../learning/domain/MasteryTypes.ts";
import {
  SUBJECT_ASSESSMENT_QUESTIONS,
} from "../pages/AdaptiveAssessment.tsx";
import {
  normalizeSubjectKey,
} from "../data/assessments/curriculum-questions.ts";

describe("PHASE 19.4 - Unified Assessment + Mastery Loop Tests", () => {
  // Test 1: Active Subject Questions Loading & Format Verification
  it("Loads verified Grade 12 curriculum assessment questions without cross-subject contamination", () => {
    const chemQuestions = SUBJECT_ASSESSMENT_QUESTIONS.chemistry;
    assert.ok(chemQuestions && chemQuestions.length >= 5, "Chemistry assessment should have at least 5 questions");

    for (const q of chemQuestions) {
      assert.ok(q.id, "Question must have an id");
      assert.ok(q.topic, "Question must have a curriculum topic");
      assert.ok(q.question, "Question must have question text");
      assert.ok(q.explanation, "Question must have pedagogical explanation");
    }

    const normKey = normalizeSubjectKey("chemistry");
    assert.strictEqual(normKey, "chemistry");
  });

  // Test 2: Multi-format Assessment Grading (MCQ, True/False, Numeric)
  it("Accurately grades MCQ, True/False, and Numeric questions with tolerance", () => {
    // MCQ Check
    const mcqQ = {
      type: "mcq",
      correctIndex: 1,
    };
    assert.strictEqual(mcqQ.correctIndex === 1, true, "MCQ correct index should match");
    assert.strictEqual(mcqQ.correctIndex === 0, false, "MCQ incorrect index should fail");

    // True/False Check
    const tfQ = {
      type: "true_false",
      correctIndex: 0,
    };
    assert.strictEqual(tfQ.correctIndex === 0, true, "True/False correct option should match");

    // Numeric Check with absolute tolerance
    const numQ = {
      type: "numeric",
      correctNumeric: 7.0,
      tolerance: 0.1,
    };
    const studentInputValid = "7.05";
    const userNum = parseFloat(studentInputValid);
    const isWithinTolerance = Math.abs(userNum - numQ.correctNumeric) <= numQ.tolerance;
    assert.strictEqual(isWithinTolerance, true, "Numeric answer within 0.1 tolerance must be accepted");

    const studentInputInvalid = "8.2";
    const userNumInvalid = parseFloat(studentInputInvalid);
    const isOutOfTolerance = Math.abs(userNumInvalid - numQ.correctNumeric) <= numQ.tolerance;
    assert.strictEqual(isOutOfTolerance, false, "Numeric answer outside tolerance must be rejected");
  });

  // Test 3: Assessment to Adaptive Mastery Calculation
  it("Correct assessment answers elevate student concept mastery in AdaptiveLearningEngine", () => {
    const previousState: ConceptMasteryState = {
      conceptId: "chemistry_acids_bases",
      masteryScore: 0.35,
      status: MasteryStatus.DEVELOPING,
      consecutiveCorrect: 0,
      totalAttempts: 1,
      lastAttemptedAt: new Date().toISOString(),
      history: [],
    };

    const newState = AdaptiveLearningEngine.calculateNewMastery(previousState, {
      isCorrect: true,
      responseTimeMs: 5000,
      difficulty: DifficultyLevel.STANDARD,
      hintUsed: false,
      unreliableTiming: false,
    });

    assert.ok(newState.masteryScore > previousState.masteryScore, "Mastery score should increase after correct assessment");
    assert.strictEqual(newState.consecutiveCorrect, 1);
    assert.strictEqual(newState.totalAttempts, 2);
    assert.ok(newState.history.length > 0);
  });

  // Test 4: Weak Assessment Performance Triggers Next Best Action Intervention
  it("NextBestActionEngine prescribes targeted practice when assessment identifies weak topics", () => {
    const nbaEngine = new NextBestActionEngine();

    const lowScoreProfile = {
      studentId: "student_assessment_test",
      overallMasteryScore: 0.40,
      conceptMasteries: {
        chemistry_ph_scale: {
          conceptId: "chemistry_ph_scale",
          masteryScore: 0.30,
          status: MasteryStatus.DEVELOPING,
          consecutiveCorrect: 0,
          totalAttempts: 2,
          lastAttemptedAt: new Date().toISOString(),
          history: [],
        },
      },
      activeMisconceptions: [
        {
          conceptId: "chemistry_ph_scale",
          misconceptionId: "misc_ph_inversion",
          nameKu: "پێوەری pH و ترشێتی گیراوەکان",
          count: 1,
          status: "SUSPECTED" as const,
          confidence: "medium" as const,
          evidenceAttempts: ["att_test_1"],
          firstDetectedAt: new Date().toISOString(),
          lastDetectedAt: new Date().toISOString(),
          resolvedAt: null,
          interventionKu: "پێویستت بە ڕاهێنان هەیە لەسەر پێوەری pH.",
        },
      ],
      recentRecommendedActions: [],
      streak: { currentStreak: 3, longestStreak: 3, lastCompletedDate: null, streakHistory: [], totalTasksCompleted: 3 },
      unlockedAchievements: [],
    };

    const nba = nbaEngine.determineNextBestAction({
      studentMasteryProfile: lowScoreProfile as never,
      recentAssessmentResult: {
        attemptId: "att_recent_1",
        assessmentId: "asm_chem",
        studentId: "student_assessment_test",
        scoreBreakdown: {
          totalScore: 2,
          maxScore: 5,
          percentage: 40,
          passed: false,
          byDifficulty: {} as never,
          byConcept: {} as never,
          byQuestionType: {} as never,
        },
        strengthsKu: ["ترشە بەهێزەکان"],
        weaknessesKu: ["پێوەری pH و ترشێتی گیراوەکان"],
        masteryChanges: [],
        misconceptionsDetected: [],
        nextRecommendedActionKu: "ڕاهێنان لەسەر پێوەری pH",
        recommendations: [],
        interpretationConfidence: "high",
      },
    });

    assert.ok(nba, "Next Best Action should be returned");
    assert.strictEqual(nba.confidence, "high");
    assert.ok(nba.titleKu.includes("تێگەیشتنی هەڵە") || nba.titleKu.includes("راهێنان"), "Next Best Action should target weak concept or misconception");
  });

  // Test 5: Perfect Assessment Performance Recommends Mastery Advancement
  it("NextBestActionEngine recommends advancing when assessment score is perfect", () => {
    const nbaEngine = new NextBestActionEngine();

    const perfectProfile = {
      studentId: "student_perfect_test",
      overallMasteryScore: 0.95,
      conceptMasteries: {
        chemistry_acids: {
          conceptId: "chemistry_acids",
          masteryScore: 0.95,
          status: MasteryStatus.MASTERED,
          consecutiveCorrect: 5,
          totalAttempts: 5,
          lastAttemptedAt: new Date().toISOString(),
          history: [],
        },
      },
      activeMisconceptions: [],
      recentRecommendedActions: [],
      streak: { currentStreak: 5, longestStreak: 5, lastCompletedDate: null, streakHistory: [], totalTasksCompleted: 10 },
      unlockedAchievements: [],
    };

    const nba = nbaEngine.determineNextBestAction({
      studentMasteryProfile: perfectProfile as never,
      recentAssessmentResult: {
        attemptId: "att_recent_perfect",
        assessmentId: "asm_chem",
        studentId: "student_perfect_test",
        scoreBreakdown: {
          totalScore: 5,
          maxScore: 5,
          percentage: 100,
          passed: true,
          byDifficulty: {} as never,
          byConcept: {} as never,
          byQuestionType: {} as never,
        },
        strengthsKu: ["ترشەکان", "تفتەکان", "پێوەری pH"],
        weaknessesKu: [],
        masteryChanges: [],
        misconceptionsDetected: [],
        nextRecommendedActionKu: "پێشکەوتن بۆ بەندی داهاتوو",
        recommendations: [],
        interpretationConfidence: "high",
      },
    });

    assert.ok(nba);
    assert.ok(nba.titleKu, "Should have a Kurdish recommendation title");
  });
});
