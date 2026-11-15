import { describe, it, expect } from "vitest";
import { AdaptiveLearningEngine } from "../../learning/engine/AdaptiveLearningEngine.ts";
import { MasteryStatus, DifficultyLevel, ConceptMasteryState } from "../../learning/domain/MasteryTypes.ts";

describe("5-Tier Mastery Status Assignment & Attempt Gating", () => {
  const SCORE_UNSTARTED = 0.05;
  const SCORE_INTRODUCED = 0.25;
  const SCORE_DEVELOPING = 0.50;
  const SCORE_PROFICIENT = 0.72;
  const SCORE_MASTERED = 0.92;

  const ATTEMPTS_ZERO = 0;
  const ATTEMPTS_ONE = 1;
  const ATTEMPTS_TWO = 2;
  const ATTEMPTS_THREE = 3;
  const ATTEMPTS_FOUR = 4;
  const ATTEMPTS_FIVE = 5;
  const ATTEMPTS_SEVEN = 7;

  it("1. Score < 0.10 always assigns NOT_STARTED regardless of attempts", () => {
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_UNSTARTED, ATTEMPTS_ZERO)).toBe(MasteryStatus.NOT_STARTED);
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_UNSTARTED, ATTEMPTS_THREE)).toBe(MasteryStatus.NOT_STARTED);
  });

  it("2. Score in [0.10, 0.35) with at least 1 attempt assigns INTRODUCED", () => {
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_INTRODUCED, ATTEMPTS_ONE)).toBe(MasteryStatus.INTRODUCED);
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_INTRODUCED, ATTEMPTS_THREE)).toBe(MasteryStatus.INTRODUCED);
  });

  it("3. Score in [0.35, 0.60) with < 3 attempts remains gated at INTRODUCED", () => {
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_DEVELOPING, ATTEMPTS_ONE)).toBe(MasteryStatus.INTRODUCED);
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_DEVELOPING, ATTEMPTS_TWO)).toBe(MasteryStatus.INTRODUCED);
  });

  it("4. Score in [0.35, 0.60) with >= 3 attempts qualifies for DEVELOPING", () => {
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_DEVELOPING, ATTEMPTS_THREE)).toBe(MasteryStatus.DEVELOPING);
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_DEVELOPING, ATTEMPTS_FOUR)).toBe(MasteryStatus.DEVELOPING);
  });

  it("5. Score in [0.60, 0.80) with < 3 attempts is gated down to INTRODUCED", () => {
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_PROFICIENT, ATTEMPTS_TWO)).toBe(MasteryStatus.INTRODUCED);
  });

  it("6. Score in [0.60, 0.80) with 3 to 4 attempts is gated down to DEVELOPING", () => {
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_PROFICIENT, ATTEMPTS_THREE)).toBe(MasteryStatus.DEVELOPING);
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_PROFICIENT, ATTEMPTS_FOUR)).toBe(MasteryStatus.DEVELOPING);
  });

  it("7. Score in [0.60, 0.80) with >= 5 attempts qualifies for PROFICIENT", () => {
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_PROFICIENT, ATTEMPTS_FIVE)).toBe(MasteryStatus.PROFICIENT);
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_PROFICIENT, 6)).toBe(MasteryStatus.PROFICIENT);
  });

  it("8. Score >= 0.80 with < 7 attempts is gated: PROFICIENT for 5-6 attempts, DEVELOPING for 3-4 attempts", () => {
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_MASTERED, ATTEMPTS_THREE)).toBe(MasteryStatus.DEVELOPING);
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_MASTERED, ATTEMPTS_FOUR)).toBe(MasteryStatus.DEVELOPING);
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_MASTERED, ATTEMPTS_FIVE)).toBe(MasteryStatus.PROFICIENT);
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_MASTERED, 6)).toBe(MasteryStatus.PROFICIENT);
  });

  it("9. Score >= 0.80 with >= 7 attempts qualifies fully for MASTERED", () => {
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_MASTERED, ATTEMPTS_SEVEN)).toBe(MasteryStatus.MASTERED);
    expect(AdaptiveLearningEngine.determineMasteryTier(SCORE_MASTERED, 12)).toBe(MasteryStatus.MASTERED);
  });

  it("10. Downward transition: marks status as NEEDS_REVIEW when score drops below 0.75 on an incorrect attempt", () => {
    const previousState: ConceptMasteryState = {
      conceptId: "equilibrium_laws",
      masteryScore: 0.78,
      status: MasteryStatus.PROFICIENT,
      totalAttempts: 6,
      consecutiveCorrect: 4,
      lastAttemptedAt: new Date().toISOString(),
      history: []
    };

    const newState = AdaptiveLearningEngine.calculateNewMastery(previousState, {
      isCorrect: false,
      responseTimeMs: 8000,
      difficulty: DifficultyLevel.STANDARD
    });

    expect(newState.masteryScore).toBeLessThan(0.75);
    expect(newState.status).toBe(MasteryStatus.NEEDS_REVIEW);
  });
});
