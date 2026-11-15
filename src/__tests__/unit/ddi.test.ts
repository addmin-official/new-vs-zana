import { describe, it, expect } from "vitest";
import { AdaptiveLearningEngine } from "../../learning/engine/AdaptiveLearningEngine.ts";

describe("Dynamic Difficulty Index (DDI) & Multi-Session Calibration", () => {
  const DEFAULT_BASELINE_DDI = 0.50;
  const STANDARD_WINDOW_SIZE = 10;
  const DDI_HARDER_THRESHOLD = 0.85;
  const DDI_EASIER_THRESHOLD = 0.40;

  it("1. Empty or undefined history returns default neutral DDI baseline (0.50)", () => {
    const emptyResult = AdaptiveLearningEngine.calculateDDI([]);
    expect(emptyResult).toBe(DEFAULT_BASELINE_DDI);

    const undefinedResult = AdaptiveLearningEngine.calculateDDI(undefined as unknown as { isCorrect: boolean }[]);
    expect(undefinedResult).toBe(DEFAULT_BASELINE_DDI);
  });

  it("2. Running average calculates accuracy strictly over the latest N attempts (window size = 10)", () => {
    // 5 old incorrect attempts + 10 recent attempts (8 correct, 2 incorrect)
    const history = [
      { isCorrect: false },
      { isCorrect: false },
      { isCorrect: false },
      { isCorrect: false },
      { isCorrect: false },
      // Window of 10 begins here:
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: false },
      { isCorrect: false },
    ];

    const ddi = AdaptiveLearningEngine.calculateDDI(history, STANDARD_WINDOW_SIZE);
    expect(ddi).toBe(0.8); // 8 / 10 = 0.80
  });

  it("3. Boundary extremes evaluate accurately: 1.0 on all correct and 0.0 on all incorrect", () => {
    const perfectHistory = Array.from({ length: 10 }, () => ({ isCorrect: true }));
    const zeroHistory = Array.from({ length: 10 }, () => ({ isCorrect: false }));

    expect(AdaptiveLearningEngine.calculateDDI(perfectHistory)).toBe(1.0);
    expect(AdaptiveLearningEngine.calculateDDI(zeroHistory)).toBe(0.0);
  });

  it("4. Recommends 'HARDER' content when DDI > 0.85 for 3 consecutive sessions", () => {
    const highSessions = [0.70, 0.90, 0.88, 0.92]; // last 3 are > 0.85
    const calibration = AdaptiveLearningEngine.evaluateSessionDifficultyCalibration(highSessions);

    expect(calibration).toBe("HARDER");
  });

  it("5. Recommends 'EASIER' content when DDI < 0.40 for 2 consecutive sessions", () => {
    const strugglingSessions = [0.65, 0.35, 0.30]; // last 2 are < 0.40
    const calibration = AdaptiveLearningEngine.evaluateSessionDifficultyCalibration(strugglingSessions);

    expect(calibration).toBe("EASIER");
  });

  it("6. Recommends 'MAINTAIN' for stable, mixed, or insufficient session histories", () => {
    const balancedSessions = [0.60, 0.75, 0.70];
    expect(AdaptiveLearningEngine.evaluateSessionDifficultyCalibration(balancedSessions)).toBe("MAINTAIN");

    // Only 2 sessions above 0.85 (needs 3 consecutive for HARDER)
    const almostHighSessions = [0.90, 0.95];
    expect(AdaptiveLearningEngine.evaluateSessionDifficultyCalibration(almostHighSessions)).toBe("MAINTAIN");

    // Only 1 session below 0.40 (needs 2 consecutive for EASIER)
    const singleLowSession = [0.30];
    expect(AdaptiveLearningEngine.evaluateSessionDifficultyCalibration(singleLowSession)).toBe("MAINTAIN");
  });
});
