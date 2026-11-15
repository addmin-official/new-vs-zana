import { describe, it, expect } from "vitest";
import { AdaptiveLearningEngine } from "../../learning/engine/AdaptiveLearningEngine.ts";
import {
  DifficultyLevel,
  MasteryStatus,
  ConceptMasteryState,
  MisconceptionState,
  MisconceptionStatus,
  ExerciseAttempt,
  StudentMasteryProfile,
} from "../../learning/domain/MasteryTypes.ts";

describe("AdaptiveLearningEngine Full Capabilities Tests", () => {
  const baseConcept: ConceptMasteryState = {
    conceptId: "c_titration",
    masteryScore: 0.5,
    status: MasteryStatus.DEVELOPING,
    consecutiveCorrect: 2,
    totalAttempts: 5,
    lastAttemptedAt: new Date().toISOString(),
    history: [
      { isCorrect: true, responseTimeMs: 6000, timestamp: new Date().toISOString(), difficulty: DifficultyLevel.STANDARD },
      { isCorrect: true, responseTimeMs: 7000, timestamp: new Date().toISOString(), difficulty: DifficultyLevel.STANDARD },
    ],
  };

  it("1. calculateNewMastery: updates mastery with score progression and consecutive count", () => {
    const updated = AdaptiveLearningEngine.calculateNewMastery(baseConcept, {
      difficulty: DifficultyLevel.CHALLENGING,
      isCorrect: true,
      responseTimeMs: 8000,
      hintUsed: false,
    });

    expect(updated.masteryScore).toBeGreaterThan(0.5);
    expect(updated.consecutiveCorrect).toBe(3);
    expect(updated.totalAttempts).toBe(6);
  });

  it("2. calculateMasteryWithResult: returns delta, promotion flags, and explanation code", () => {
    const res = AdaptiveLearningEngine.calculateMasteryWithResult(baseConcept, {
      difficulty: DifficultyLevel.CHALLENGING,
      isCorrect: true,
      responseTimeMs: 8000,
    });

    expect(res.scoreChange).toBeGreaterThan(0);
    expect(res.newState.masteryScore).toBe(Number((baseConcept.masteryScore + res.scoreChange).toFixed(3)));
    expect(res.explanationCode).toBeDefined();
  });

  it("3. classifyResponseSpeed: flags fast, normal, slow, and very slow responses", () => {
    const percentiles = { p50: 5000, p75: 10000, p95: 20000 };

    expect(AdaptiveLearningEngine.classifyResponseSpeed(3000, true, percentiles)).toBe("FAST_CORRECT");
    expect(AdaptiveLearningEngine.classifyResponseSpeed(7000, true, percentiles)).toBe("NORMAL_CORRECT");
    expect(AdaptiveLearningEngine.classifyResponseSpeed(12000, true, percentiles)).toBe("SLOW_CORRECT");
    expect(AdaptiveLearningEngine.classifyResponseSpeed(25000, true, percentiles)).toBe("VERY_SLOW_CORRECT");

    expect(AdaptiveLearningEngine.classifyResponseSpeed(3000, false, percentiles)).toBe("FAST_INCORRECT");
    expect(AdaptiveLearningEngine.classifyResponseSpeed(7000, false, percentiles)).toBe("NORMAL_INCORRECT");
    expect(AdaptiveLearningEngine.classifyResponseSpeed(12000, false, percentiles)).toBe("SLOW_INCORRECT");
  });

  it("4. detectMisconception & updateMisconceptions: detects Kurdish algebraic sign flip error", () => {
    const attempt: ExerciseAttempt = {
      id: "att_01",
      studentId: "u_01",
      conceptId: "c_algebra",
      isCorrect: false,
      studentResponse: "x = -5",
      questionText: "هاوکێشەی هێڵی ڕاست بدۆزەرەوە",
      difficulty: DifficultyLevel.STANDARD,
      responseTimeMs: 12000,
      timestamp: new Date().toISOString(),
    };

    const updated = AdaptiveLearningEngine.updateMisconceptions(
      [],
      attempt,
      0,
      [{ isCorrect: false }, { isCorrect: false }]
    );
    expect(updated.length).toBe(1);
    expect(updated[0].misconceptionId).toBe("misc_sign_flip");
    expect(updated[0].isActive).toBe(true);
    expect(updated[0].status).toBe(MisconceptionStatus.CONFIRMED);
  });

  it("5. updateMisconceptions: resolves misconception after 3 consecutive correct answers", () => {
    const activeList: MisconceptionState[] = [
      {
        conceptId: "c_algebra",
        misconceptionId: "misc_sign_flip",
        nameKu: "هەڵەی پێچەوانەکردنەوەی هێما",
        count: 2,
        status: MisconceptionStatus.ACTIVE_MISCONCEPTION,
        confidence: "high",
        evidenceAttempts: [],
        firstDetectedAt: new Date().toISOString(),
        lastDetectedAt: new Date().toISOString(),
        resolvedAt: null,
        interventionKu: "ڕێنمایی",
        isActive: true,
      },
    ];

    const correctAttempt: ExerciseAttempt = {
      id: "att_02",
      studentId: "u_01",
      conceptId: "c_algebra",
      isCorrect: true,
      difficulty: DifficultyLevel.STANDARD,
      responseTimeMs: 6000,
      studentResponse: "x = 5",
      questionText: "هاوکێشەی هێڵی ڕاست بدۆزەرەوە",
      timestamp: new Date().toISOString(),
    };

    const resolvedList = AdaptiveLearningEngine.updateMisconceptions(activeList, correctAttempt, 3, []);
    expect(resolvedList[0].status).toBe(MisconceptionStatus.RESOLVED);
    expect(resolvedList[0].isActive).toBe(false);
    expect(resolvedList[0].resolvedAt).toBeDefined();
  });

  it("6. adaptDifficulty: increases difficulty on consecutive wins and decreases on failures", () => {
    // 3 correct in a row -> CHALLENGING
    const highHistory = [
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: true },
    ];
    expect(AdaptiveLearningEngine.adaptDifficulty("c_math", highHistory, [])).toBe(DifficultyLevel.CHALLENGING);

    // With high session DDIs -> steps up to ADVANCED
    expect(AdaptiveLearningEngine.adaptDifficulty("c_math", highHistory, [0.86, 0.9, 0.88])).toBe(DifficultyLevel.ADVANCED);

    // 0 correct -> FOUNDATION
    const lowHistory = [
      { isCorrect: false },
      { isCorrect: false },
    ];
    expect(AdaptiveLearningEngine.adaptDifficulty("c_math", lowHistory, [])).toBe(DifficultyLevel.FOUNDATION);

    // 2 correct (STANDARD) with low session DDIs -> steps down to EASY
    const midHistory = [
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: false },
    ];
    expect(AdaptiveLearningEngine.adaptDifficulty("c_math", midHistory, [0.2, 0.25, 0.3])).toBe(DifficultyLevel.EASY);
  });

  it("6b. applyForgettingCurve & guest attempts: handles time decay and preserves state for guests", () => {
    // Guest attempt should NOT mutate mastery
    const guestRes = AdaptiveLearningEngine.calculateNewMastery(baseConcept, {
      difficulty: DifficultyLevel.CHALLENGING,
      isCorrect: true,
      isGuest: true,
    });
    expect(guestRes.masteryScore).toBe(baseConcept.masteryScore);

    // Passive viewing gain
    const passiveRes = AdaptiveLearningEngine.calculateNewMastery(
      { ...baseConcept, masteryScore: 0.1 },
      { difficulty: DifficultyLevel.FOUNDATION, isPassiveView: true }
    );
    expect(passiveRes.masteryScore).toBeGreaterThan(0.1);

    // Forgetting curve decay after 30 days
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 30);
    const decayed = AdaptiveLearningEngine.applyForgettingCurve({
      ...baseConcept,
      lastAttemptedAt: oldDate.toISOString(),
      masteryScore: 0.9,
    });
    expect(decayed.masteryScore).toBeLessThan(0.9);
  });

  it("7. hasPrerequisiteCycle: detects circular prerequisite chains and validates DAGs", () => {
    const cyclicMap = {
      A: ["B"],
      B: ["C"],
      C: ["A"],
    };
    expect(AdaptiveLearningEngine.hasPrerequisiteCycle(cyclicMap, "A")).toBe(true);

    const acyclicMap = {
      A: ["B"],
      B: ["C"],
      C: [],
    };
    expect(AdaptiveLearningEngine.hasPrerequisiteCycle(acyclicMap, "A")).toBe(false);
  });

  it("8. generateRecommendation: creates Kurdish pedagogical action items for all mastery states", () => {
    const baseProfile: StudentMasteryProfile = {
      studentId: "u_std_01",
      overallMasteryScore: 0.45,
      activeMisconceptions: [],
      recentRecommendedActions: [],
      conceptMasteries: {
        c_titration: { ...baseConcept, masteryScore: 0.3, status: MasteryStatus.DEVELOPING },
        c_prereq: { ...baseConcept, conceptId: "c_prereq", masteryScore: 0.35, status: MasteryStatus.DEVELOPING },
      },
    };

    // 1. Weak prerequisite (<0.5) with score < 0.6 -> PREREQUISITE_REVIEW
    const recPrereq = AdaptiveLearningEngine.generateRecommendation(
      "u_std_01",
      "c_titration",
      "هاوسەنگی ترش و تفت",
      baseProfile,
      ["c_prereq"]
    );
    expect(recPrereq.type).toBe("PREREQUISITE_REVIEW");
    expect(recPrereq.titleKu).toContain("پێداچوونەوە بە پێویستیی یەکەم");

    // 2. Active misconception -> REMEDIAL_EXPLANATION
    const miscProfile: StudentMasteryProfile = {
      ...baseProfile,
      activeMisconceptions: [
        {
          conceptId: "c_titration",
          misconceptionId: "misc_01",
          nameKu: "لێکتێنەگەیشتن لە پێوەری pH",
          count: 3,
          status: MisconceptionStatus.CONFIRMED,
          confidence: "high",
          evidenceAttempts: [],
          firstDetectedAt: new Date().toISOString(),
          lastDetectedAt: new Date().toISOString(),
          resolvedAt: null,
          interventionKu: "ڕێنمایی",
          isActive: true,
        },
      ],
    };
    const recMisc = AdaptiveLearningEngine.generateRecommendation(
      "u_std_01",
      "c_titration",
      "هاوسەنگی ترش و تفت",
      miscProfile,
      []
    );
    expect(recMisc.type).toBe("REMEDIAL_EXPLANATION");
    expect(recMisc.titleKu).toContain("ڕوونکردنەوەی چارەسەری");

    // 3. Spaced repetition needs review
    const reviewProfile: StudentMasteryProfile = {
      ...baseProfile,
      conceptMasteries: {
        c_titration: { ...baseConcept, status: MasteryStatus.NEEDS_REVIEW },
      },
    };
    const recReview = AdaptiveLearningEngine.generateRecommendation(
      "u_std_01",
      "c_titration",
      "هاوسەنگی ترش و تفت",
      reviewProfile,
      []
    );
    expect(recReview.type).toBe("PREREQUISITE_REVIEW");
    expect(recReview.titleKu).toContain("Spaced Repetition");

    // 4. Low score (< 0.4) -> REMEDIAL_EXPLANATION
    const recLow = AdaptiveLearningEngine.generateRecommendation(
      "u_std_01",
      "c_titration",
      "هاوسەنگی ترش و تفت",
      baseProfile,
      []
    );
    expect(recLow.type).toBe("REMEDIAL_EXPLANATION");
    expect(recLow.titleKu).toContain("خوێندنی وانەی ڕوونکردنەوەی");

    // 5. Ready to practice (0.4 <= score < 0.8) -> PRACTICE_DRILL
    const practiceProfile: StudentMasteryProfile = {
      ...baseProfile,
      conceptMasteries: {
        c_titration: { ...baseConcept, masteryScore: 0.65, status: MasteryStatus.PROFICIENT },
      },
    };
    const recPractice = AdaptiveLearningEngine.generateRecommendation(
      "u_std_01",
      "c_titration",
      "هاوسەنگی ترش و تفت",
      practiceProfile,
      []
    );
    expect(recPractice.type).toBe("PRACTICE_DRILL");
    expect(recPractice.titleKu).toContain("ڕاهێنانی چڕ");

    // 6. Mastered (score >= 0.8) -> ADVANCE_CONCEPT
    const masteredProfile: StudentMasteryProfile = {
      ...baseProfile,
      conceptMasteries: {
        c_titration: { ...baseConcept, masteryScore: 0.9, status: MasteryStatus.MASTERED },
      },
    };
    const recAdvance = AdaptiveLearningEngine.generateRecommendation(
      "u_std_01",
      "c_titration",
      "هاوسەنگی ترش و تفت",
      masteredProfile,
      []
    );
    expect(recAdvance.type).toBe("ADVANCE_CONCEPT");
    expect(recAdvance.titleKu).toContain("پێشڕەوی بۆ بابەتی داهاتوو");
  });

  it("9. calculateResponseTimePercentiles: returns baseline on small sample and calculates percentiles on large sample", () => {
    // Small sample (< 5 items)
    const baseline = AdaptiveLearningEngine.calculateResponseTimePercentiles([3000, 4000], DifficultyLevel.STANDARD);
    expect(baseline).toEqual(AdaptiveLearningEngine.DEFAULT_TIME_PERCENTILES[DifficultyLevel.STANDARD]);

    // Large sample (>= 5 items)
    const calculated = AdaptiveLearningEngine.calculateResponseTimePercentiles([1000, 2000, 3000, 4000, 5000, 6000]);
    expect(calculated.p50).toBeDefined();
    expect(calculated.p75).toBeDefined();
    expect(calculated.p95).toBeDefined();
    expect(calculated.p50).toBeLessThanOrEqual(calculated.p75);
    expect(calculated.p75).toBeLessThanOrEqual(calculated.p95);
  });
});
