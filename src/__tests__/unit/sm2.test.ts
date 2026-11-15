import { describe, it, expect } from "vitest";
import { AdaptiveLearningEngine } from "../../learning/engine/AdaptiveLearningEngine.ts";
import { ConceptMasteryState, MasteryStatus } from "../../learning/domain/MasteryTypes.ts";

describe("Spaced Repetition (SuperMemo-2) & Forgetting Curve Engine", () => {
  const DEFAULT_STABILITY_FACTOR = 2.5;
  const MINIMUM_STABILITY_FACTOR = 1.3;
  const MAXIMUM_STABILITY_FACTOR = 3.2;
  const INITIAL_INTERVAL_DAYS = 1;
  const SECOND_INTERVAL_DAYS = 6;
  const QUALITY_PERFECT_RESPONSE = 5;
  const QUALITY_ACCEPTABLE_RESPONSE = 4;
  const QUALITY_STRUGGLING_RESPONSE = 3;
  const QUALITY_FAILED_RESPONSE = 1;
  const ANCHOR_DATE = new Date("2026-10-01T12:00:00Z");

  it("1. Baseline initialization with default stability factor (2.5) and 1 day interval on initial success", () => {
    const result = AdaptiveLearningEngine.calculateSM2Interval(
      true,
      0, // previous repetitions
      INITIAL_INTERVAL_DAYS,
      DEFAULT_STABILITY_FACTOR,
      QUALITY_ACCEPTABLE_RESPONSE,
      ANCHOR_DATE
    );

    expect(result.newRepetitionCount).toBe(1);
    expect(result.nextIntervalDays).toBe(INITIAL_INTERVAL_DAYS);
    expect(result.newStabilityFactor).toBe(DEFAULT_STABILITY_FACTOR);
    expect(new Date(result.nextReviewDue).getTime()).toBeGreaterThan(ANCHOR_DATE.getTime());
  });

  it("2. Perfect response quality (q=5) increases stability factor above default baseline", () => {
    const result = AdaptiveLearningEngine.calculateSM2Interval(
      true,
      1,
      INITIAL_INTERVAL_DAYS,
      DEFAULT_STABILITY_FACTOR,
      QUALITY_PERFECT_RESPONSE,
      ANCHOR_DATE
    );

    expect(result.newStabilityFactor).toBeGreaterThan(DEFAULT_STABILITY_FACTOR);
    expect(result.newStabilityFactor).toBe(2.6); // 2.5 + (0.1 - 0) = 2.6
  });

  it("3. Struggling correct response (q=3) decreases stability factor below baseline", () => {
    const result = AdaptiveLearningEngine.calculateSM2Interval(
      true,
      1,
      INITIAL_INTERVAL_DAYS,
      DEFAULT_STABILITY_FACTOR,
      QUALITY_STRUGGLING_RESPONSE,
      ANCHOR_DATE
    );

    expect(result.newStabilityFactor).toBeLessThan(DEFAULT_STABILITY_FACTOR);
    expect(result.newStabilityFactor).toBe(2.36); // 2.5 + (0.1 - 2 * 0.12) = 2.36
  });

  it("4. Failed review (isCorrect=false or q < 3) resets repetitions to 0 and interval to 1 day", () => {
    const priorRepetitions = 5;
    const priorIntervalDays = 21;

    const result = AdaptiveLearningEngine.calculateSM2Interval(
      false,
      priorRepetitions,
      priorIntervalDays,
      DEFAULT_STABILITY_FACTOR,
      QUALITY_FAILED_RESPONSE,
      ANCHOR_DATE
    );

    expect(result.newRepetitionCount).toBe(0);
    expect(result.nextIntervalDays).toBe(1);
  });

  it("5. Repetition progression step 1 yields exactly 1 day interval", () => {
    const result = AdaptiveLearningEngine.calculateSM2Interval(
      true,
      0,
      1,
      DEFAULT_STABILITY_FACTOR,
      QUALITY_ACCEPTABLE_RESPONSE,
      ANCHOR_DATE
    );

    expect(result.newRepetitionCount).toBe(1);
    expect(result.nextIntervalDays).toBe(1);
  });

  it("6. Repetition progression step 2 yields exactly 6 days interval", () => {
    const result = AdaptiveLearningEngine.calculateSM2Interval(
      true,
      1, // first successful repetition already completed
      1,
      DEFAULT_STABILITY_FACTOR,
      QUALITY_ACCEPTABLE_RESPONSE,
      ANCHOR_DATE
    );

    expect(result.newRepetitionCount).toBe(2);
    expect(result.nextIntervalDays).toBe(SECOND_INTERVAL_DAYS);
  });

  it("7. Repetition progression step 3+ multiplies previous interval by the stability factor", () => {
    const currentInterval = 6;
    const stability = 2.5;

    const result = AdaptiveLearningEngine.calculateSM2Interval(
      true,
      2, // 2 prior successful repetitions
      currentInterval,
      stability,
      QUALITY_ACCEPTABLE_RESPONSE,
      ANCHOR_DATE
    );

    expect(result.newRepetitionCount).toBe(3);
    const expectedInterval = Math.round(currentInterval * result.newStabilityFactor);
    expect(result.nextIntervalDays).toBe(expectedInterval);
  });

  it("8. Stability factor is bounded from below by minimum threshold of 1.3", () => {
    let currentStability = 1.35;
    // Repeated poor quality reviews
    for (let i = 0; i < 5; i++) {
      const res = AdaptiveLearningEngine.calculateSM2Interval(
        false,
        0,
        1,
        currentStability,
        0,
        ANCHOR_DATE
      );
      currentStability = res.newStabilityFactor;
    }

    expect(currentStability).toBe(MINIMUM_STABILITY_FACTOR);
  });

  it("9. Stability factor is bounded from above by maximum threshold of 3.2", () => {
    let currentStability = 3.15;
    // Repeated perfect quality reviews
    for (let i = 0; i < 5; i++) {
      const res = AdaptiveLearningEngine.calculateSM2Interval(
        true,
        3,
        10,
        currentStability,
        QUALITY_PERFECT_RESPONSE,
        ANCHOR_DATE
      );
      currentStability = res.newStabilityFactor;
    }

    expect(currentStability).toBe(MAXIMUM_STABILITY_FACTOR);
  });

  it("10. Ebbinghaus forgetting curve decay rate: 15% per day for score < 0.7 and 5% per day for score >= 0.7", () => {
    const initialLowScore = 0.60; // < 0.70 -> 15% decay per day
    const initialHighScore = 0.90; // >= 0.70 -> 5% decay per day
    const threeDaysLater = new Date(ANCHOR_DATE.getTime() + 3 * 24 * 60 * 60 * 1000);

    const lowState: ConceptMasteryState = {
      conceptId: "acid_bases",
      masteryScore: initialLowScore,
      status: MasteryStatus.DEVELOPING,
      totalAttempts: 4,
      consecutiveCorrect: 2,
      lastAttemptedAt: ANCHOR_DATE.toISOString(),
      lastReviewedAt: ANCHOR_DATE.toISOString(),
      history: []
    };

    const highState: ConceptMasteryState = {
      conceptId: "equilibrium",
      masteryScore: initialHighScore,
      status: MasteryStatus.MASTERED,
      totalAttempts: 8,
      consecutiveCorrect: 6,
      lastAttemptedAt: ANCHOR_DATE.toISOString(),
      lastReviewedAt: ANCHOR_DATE.toISOString(),
      history: []
    };

    const decayedLow = AdaptiveLearningEngine.applyForgettingCurve(lowState, threeDaysLater);
    const decayedHigh = AdaptiveLearningEngine.applyForgettingCurve(highState, threeDaysLater);

    // Expected low retention: (1 - 0.15)^3 = 0.85^3 ≈ 0.6141 -> 0.60 * 0.6141 ≈ 0.368
    const expectedLowDecay = Number((initialLowScore * Math.pow(1 - 0.15, 3)).toFixed(3));
    expect(decayedLow.masteryScore).toBe(expectedLowDecay);

    // Expected high retention: (1 - 0.05)^3 = 0.95^3 ≈ 0.8573 -> 0.90 * 0.8573 ≈ 0.772
    const expectedHighDecay = Number((initialHighScore * Math.pow(1 - 0.05, 3)).toFixed(3));
    expect(decayedHigh.masteryScore).toBe(expectedHighDecay);
  });
});
