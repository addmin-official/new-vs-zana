import { describe, it, expect } from "vitest";
import { AssessmentIntelligence } from "../../assessment/AssessmentIntelligence.ts";

describe("Item Response Theory (IRT) - 3PL Model & CAT Psychometrics", () => {
  const DISCRIMINATION_STANDARD = 1.0;
  const DIFFICULTY_STANDARD = 0.0;
  const GUESSING_FOUR_CHOICE = 0.25; // 1 out of 4 options
  const ABILITY_MIN = -3.0;
  const ABILITY_MAX = 3.0;

  it("1. Probability at θ = b equals midpoint c + (1 - c)/2", () => {
    // When ability equals difficulty (θ = b), exponent is 0, logistic = 0.5
    // P(θ) = c + (1 - c) * 0.5 = 0.25 + 0.75 * 0.5 = 0.625
    const prob = AssessmentIntelligence.calculate3PLProbability(
      DIFFICULTY_STANDARD,
      DISCRIMINATION_STANDARD,
      DIFFICULTY_STANDARD,
      GUESSING_FOUR_CHOICE
    );

    const expectedMidpoint = Number((GUESSING_FOUR_CHOICE + (1.0 - GUESSING_FOUR_CHOICE) * 0.5).toFixed(4));
    expect(prob).toBe(expectedMidpoint);
  });

  it("2. Probability approaches pseudo-guessing parameter c as θ approaches minimum (-3.0) on difficult items", () => {
    const highDifficulty = 2.5;
    const highDiscrimination = 1.5;

    const prob = AssessmentIntelligence.calculate3PLProbability(
      ABILITY_MIN,
      highDiscrimination,
      highDifficulty,
      GUESSING_FOUR_CHOICE
    );

    // Should be extremely close to the guessing asymptote (0.25)
    expect(prob).toBeGreaterThanOrEqual(GUESSING_FOUR_CHOICE);
    expect(prob).toBeLessThan(GUESSING_FOUR_CHOICE + 0.02);
  });

  it("3. Probability approaches 1.0 as θ approaches maximum (+3.0) on easy items", () => {
    const lowDifficulty = -2.5;
    const highDiscrimination = 1.5;

    const prob = AssessmentIntelligence.calculate3PLProbability(
      ABILITY_MAX,
      highDiscrimination,
      lowDifficulty,
      GUESSING_FOUR_CHOICE
    );

    expect(prob).toBeGreaterThan(0.99);
    expect(prob).toBeLessThanOrEqual(1.0);
  });

  it("4. Monotonicity: higher ability θ strictly produces higher or equal probability of correct response", () => {
    const thetaValues = [-2.0, -1.0, 0.0, 1.0, 2.0];
    const probabilities = thetaValues.map((theta) =>
      AssessmentIntelligence.calculate3PLProbability(
        theta,
        DISCRIMINATION_STANDARD,
        DIFFICULTY_STANDARD,
        GUESSING_FOUR_CHOICE
      )
    );

    for (let i = 0; i < probabilities.length - 1; i++) {
      expect(probabilities[i + 1]).toBeGreaterThan(probabilities[i]);
    }
  });

  it("5. Discrimination parameter (a) governs the slope of the item characteristic curve around θ = b", () => {
    const delta = 0.5;
    const lowDiscrimination = 0.5;
    const highDiscrimination = 2.5;

    const probLow = AssessmentIntelligence.calculate3PLProbability(
      DIFFICULTY_STANDARD + delta,
      lowDiscrimination,
      DIFFICULTY_STANDARD,
      GUESSING_FOUR_CHOICE
    );
    const probHigh = AssessmentIntelligence.calculate3PLProbability(
      DIFFICULTY_STANDARD + delta,
      highDiscrimination,
      DIFFICULTY_STANDARD,
      GUESSING_FOUR_CHOICE
    );

    // Higher discrimination should produce a steeper response curve above b
    expect(probHigh).toBeGreaterThan(probLow);
  });

  it("6. Fisher Information I(θ) reaches its maximum near item difficulty (θ ≈ b) and decays at extreme ability", () => {
    const infoAtPeak = AssessmentIntelligence.calculateItemInformation(
      DIFFICULTY_STANDARD,
      DISCRIMINATION_STANDARD,
      DIFFICULTY_STANDARD,
      GUESSING_FOUR_CHOICE
    );
    const infoAtLowExtreme = AssessmentIntelligence.calculateItemInformation(
      ABILITY_MIN,
      DISCRIMINATION_STANDARD,
      DIFFICULTY_STANDARD,
      GUESSING_FOUR_CHOICE
    );
    const infoAtHighExtreme = AssessmentIntelligence.calculateItemInformation(
      ABILITY_MAX,
      DISCRIMINATION_STANDARD,
      DIFFICULTY_STANDARD,
      GUESSING_FOUR_CHOICE
    );

    expect(infoAtPeak).toBeGreaterThan(infoAtLowExtreme);
    expect(infoAtPeak).toBeGreaterThan(infoAtHighExtreme);
    expect(infoAtLowExtreme).toBeLessThan(0.05);
  });

  it("7. Ability estimate θ updates positively after consecutive correct responses using MLE update", () => {
    const initialTheta = 0.0;
    const resp1 = [{ isCorrect: true, a: 1.2, b: 0.0, c: 0.25 }];
    const resp2 = [
      { isCorrect: true, a: 1.2, b: 0.0, c: 0.25 },
      { isCorrect: true, a: 1.4, b: 0.5, c: 0.25 }
    ];

    const estimate1 = AssessmentIntelligence.estimateThetaMLE(resp1, initialTheta);
    expect(estimate1.theta).toBeGreaterThan(initialTheta);

    const estimate2 = AssessmentIntelligence.estimateThetaMLE(resp2, estimate1.theta);
    expect(estimate2.theta).toBeGreaterThan(estimate1.theta);
    expect(estimate2.standardError).toBeLessThan(estimate1.standardError);
  });

  it("8. Tripartite CAT stopping rule terminates when SE < 0.30 or maximum questions (20) reached", () => {
    // Case A: Confident estimate when Standard Error < 0.30 (and min 5 questions administered)
    const stoppingConfident = AssessmentIntelligence.evaluateCATStoppingRules(
      8, // 8 questions administered (>= 5)
      0.25, // standard error < 0.30 target
      false // bank not exhausted
    );
    expect(stoppingConfident.shouldStop).toBe(true);
    expect(stoppingConfident.code).toBe("CONFIDENT_ESTIMATE");

    // Case B: Ceiling reached at max 20 questions even if SE >= 0.30
    const stoppingMaxQuestions = AssessmentIntelligence.evaluateCATStoppingRules(
      20, // 20 questions reached
      0.35, // SE not confident
      false
    );
    expect(stoppingMaxQuestions.shouldStop).toBe(true);
    expect(stoppingMaxQuestions.code).toBe("MAX_QUESTIONS_REACHED");

    // Case C: Continue testing when SE >= 0.30 and questions < 20
    const continueTesting = AssessmentIntelligence.evaluateCATStoppingRules(
      5,
      0.45,
      false
    );
    expect(continueTesting.shouldStop).toBe(false);
  });
});
