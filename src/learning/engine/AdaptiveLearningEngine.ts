import {
  ConceptMasteryState,
  MasteryStatus,
  MisconceptionState,
  MisconceptionStatus,
  MisconceptionType,
  AdaptiveRecommendation,
  RecommendationType,
  ExerciseAttempt,
  StudentMasteryProfile,
  DifficultyLevel,
  ResponseSpeedFlag,
  MasteryCalculationResult
} from "../domain/MasteryTypes.ts";

export interface MasteryAttemptInput {
  isCorrect?: boolean;
  responseTimeMs?: number;
  difficulty: DifficultyLevel;
  hintUsed?: boolean;
  unreliableTiming?: boolean;
  isPassiveView?: boolean;
  isGuest?: boolean;
  isNonAuthoritative?: boolean;
}

/**
 * Senior-level Adaptive Learning Engine for the ZANA platform.
 *
 * Implements:
 * 1. Spaced Repetition (SuperMemo-2 algorithm + Ebbinghaus forgetting curve decay)
 * 2. Adaptive Dynamic Difficulty Index (DDI) calibration per student & across sessions
 * 3. 5-Tier Mastery System with attempt gating:
 *    - NOT_STARTED (0.0-0.10)
 *    - INTRODUCED (0.10-0.35, min 1-2 attempts)
 *    - DEVELOPING (0.35-0.60, min 3 attempts)
 *    - PROFICIENT (0.60-0.80, min 5 attempts)
 *    - MASTERED (0.80-1.00, min 7-10 attempts)
 * 4. Misconception Tracking with 3x failure pattern detection & resolution persistence
 * 5. Percentile-based response time intelligence (p50/p75/p95) & partial mastery scoring
 * 6. Pure, side-effect-free pedagogical decision functions
 */
export class AdaptiveLearningEngine {
  /**
   * Default benchmark response time percentiles (p50, p75, p95) in milliseconds.
   */
  public static readonly DEFAULT_TIME_PERCENTILES: Record<
    DifficultyLevel,
    { p50: number; p75: number; p95: number }
  > = {
    [DifficultyLevel.FOUNDATION]: { p50: 4000, p75: 8000, p95: 15000 },
    [DifficultyLevel.EASY]: { p50: 4000, p75: 8000, p95: 15000 },
    [DifficultyLevel.STANDARD]: { p50: 8000, p75: 16000, p95: 28000 },
    [DifficultyLevel.CHALLENGING]: { p50: 14000, p75: 25000, p95: 45000 },
    [DifficultyLevel.ADVANCED]: { p50: 20000, p75: 35000, p95: 60000 }
  };

  /**
   * Calculates a new concept mastery state based on the previous state and an exercise attempt or learning action.
   * Employs progressive difficulty-weighted scoring, consecutive multipliers, SM-2 scheduling,
   * percentile response time classification, and stable mastery protection.
   *
   * @param previous Previous ConceptMasteryState or null for unstarted concepts
   * @param attempt Student attempt input containing correctness, timing, and difficulty
   * @returns Updated ConceptMasteryState
   */
  public static calculateNewMastery(
    previous: ConceptMasteryState | null,
    attempt: MasteryAttemptInput
  ): ConceptMasteryState {
    const conceptId = previous?.conceptId || "unknown";

    // Non-authoritative / guest attempts must NEVER update official mastery
    if (attempt.isGuest || attempt.isNonAuthoritative) {
      return (
        previous || {
          conceptId,
          masteryScore: 0.0,
          status: MasteryStatus.NOT_STARTED,
          lastAttemptedAt: new Date().toISOString(),
          totalAttempts: 0,
          consecutiveCorrect: 0,
          history: []
        }
      );
    }

    // Apply forgetting curve decay if significant time elapsed since last review/attempt
    const basePrevious = previous ? this.applyForgettingCurve(previous) : null;
    const history = basePrevious?.history ? [...basePrevious.history] : [];

    const isCorrect = attempt.isCorrect ?? false;
    const responseTimeMs = attempt.responseTimeMs ?? 5000;
    const difficulty = attempt.difficulty;

    // Append to history if it's not a purely passive view, limit history length to 50
    if (!attempt.isPassiveView) {
      history.push({
        isCorrect,
        timestamp: new Date().toISOString(),
        responseTimeMs,
        difficulty
      });
      if (history.length > 50) {
        history.shift();
      }
    }

    const totalAttempts = (basePrevious?.totalAttempts || 0) + (attempt.isPassiveView ? 0 : 1);
    let consecutiveCorrect = basePrevious?.consecutiveCorrect || 0;

    if (!attempt.isPassiveView) {
      if (isCorrect) {
        consecutiveCorrect += 1;
      } else {
        consecutiveCorrect = 0;
      }
    }

    const prevScore = basePrevious?.masteryScore !== undefined ? basePrevious.masteryScore : 0.0;
    let newScore = prevScore;
    let explanationCode = "INITIAL_STATE";

    // 1. Response Time Intelligence & Percentiles
    const difficultyTimes = history
      .filter((h) => h.difficulty === difficulty)
      .map((h) => h.responseTimeMs);
    const percentiles = this.calculateResponseTimePercentiles(difficultyTimes, difficulty);
    const speedFlag = this.classifyResponseSpeed(responseTimeMs, isCorrect, percentiles);

    // 2. Dynamic Difficulty Index (DDI) over recent history (last 10 attempts)
    const ddi = this.calculateDDI(history, 10);

    if (attempt.isPassiveView) {
      // Passive lesson viewing has very low weight and a low ceiling
      const passiveGain = 0.02;
      newScore = Math.min(0.15, Number((prevScore + passiveGain).toFixed(3)));
      explanationCode = "PASSIVE_VIEW_GAIN";
    } else if (isCorrect) {
      // Centralized evidence weights based on difficulty level
      let difficultyWeight = 1.0;
      switch (difficulty) {
        case DifficultyLevel.FOUNDATION:
          difficultyWeight = 0.8;
          break;
        case DifficultyLevel.EASY:
          difficultyWeight = 1.0;
          break;
        case DifficultyLevel.STANDARD:
          difficultyWeight = 1.5;
          break;
        case DifficultyLevel.CHALLENGING:
          difficultyWeight = 2.0;
          break;
        case DifficultyLevel.ADVANCED:
          difficultyWeight = 2.5;
          break;
      }

      // Speed intelligence rule: Slow correct answers signal partial mastery
      if (speedFlag === "SLOW_CORRECT" || speedFlag === "VERY_SLOW_CORRECT") {
        const slowGain = 0.03;
        newScore = Math.min(1.0, Number((prevScore + slowGain).toFixed(3)));
        explanationCode = "CORRECT_ATTEMPT_SLOW_PARTIAL";
      } else {
        // Normal or Fast response speed
        let speedMultiplier = 1.0;
        const timingIsReliable =
          !attempt.unreliableTiming && responseTimeMs > 500 && responseTimeMs < 45000;

        if (timingIsReliable) {
          if (speedFlag === "FAST_CORRECT") {
            speedMultiplier = 1.1; // 10% bonus for fast correct response
          } else if (responseTimeMs < 10000) {
            speedMultiplier = 1.05; // 5% bonus for reasonable speed
          }
        }

        // Streak-based progressive weight (up to 20% bonus)
        const streakBonus = Math.min(consecutiveCorrect, 4) * 0.05;
        const totalStreakMultiplier = 1.0 + streakBonus;

        // Hint usage reduces evidence strength
        const hintPenaltyMultiplier = attempt.hintUsed ? 0.5 : 1.0;

        const baseGain =
          0.1 * difficultyWeight * speedMultiplier * totalStreakMultiplier * hintPenaltyMultiplier;
        newScore = Math.min(1.0, Number((prevScore + baseGain).toFixed(3)));

        explanationCode = attempt.hintUsed
          ? "CORRECT_ATTEMPT_WITH_HINT"
          : speedFlag === "FAST_CORRECT"
          ? "CORRECT_ATTEMPT_FAST"
          : "CORRECT_ATTEMPT_STANDARD";
      }

      // Safety Constraint: one single correct answer cannot produce MASTERED
      if (totalAttempts <= 1 && newScore >= 0.85) {
        newScore = 0.25; // limit to INTRODUCED
        explanationCode = "CORRECT_ATTEMPT_SINGLE_ANSWER_LIMIT";
      }
    } else {
      // INCORRECT ANSWER: stable mastery protection
      let difficultyWeight = 1.0;
      switch (difficulty) {
        case DifficultyLevel.FOUNDATION:
          difficultyWeight = 0.8;
          break;
        case DifficultyLevel.EASY:
          difficultyWeight = 1.0;
          break;
        case DifficultyLevel.STANDARD:
          difficultyWeight = 1.5;
          break;
        case DifficultyLevel.CHALLENGING:
          difficultyWeight = 2.0;
          break;
        case DifficultyLevel.ADVANCED:
          difficultyWeight = 2.5;
          break;
      }

      const baseDecay = 0.12 / difficultyWeight;

      if (prevScore >= 0.85) {
        // Safe guard stable mastery: decay is halved
        newScore = Math.max(0.65, Number((prevScore - baseDecay * 0.5).toFixed(3)));
        explanationCode = "INCORRECT_ATTEMPT_STABLE_GUARD";
      } else {
        newScore = Math.max(0.0, Number((prevScore - baseDecay).toFixed(3)));
        explanationCode = "INCORRECT_ATTEMPT_DECAY";
      }
    }

    // 3. 5-Tier Mastery Status Determination
    let status = this.determineMasteryTier(newScore, totalAttempts);

    // If previously Mastered or Proficient but dropped below 0.75, flag for review
    if (
      !isCorrect &&
      !attempt.isPassiveView &&
      basePrevious &&
      (basePrevious.status === MasteryStatus.MASTERED ||
        basePrevious.status === MasteryStatus.PROFICIENT) &&
      newScore < 0.75
    ) {
      status = MasteryStatus.NEEDS_REVIEW;
    }

    // 4. Spaced Repetition (SM-2) Interval Calculation
    const sm2Quality = this.getSM2Quality(isCorrect, speedFlag, attempt.hintUsed);
    const sm2 = this.calculateSM2Interval(
      isCorrect,
      basePrevious?.repetitionCount || 0,
      basePrevious?.intervalDays || 1,
      basePrevious?.stabilityFactor || 2.5,
      sm2Quality
    );

    return {
      conceptId,
      masteryScore: newScore,
      status,
      consecutiveCorrect,
      totalAttempts,
      lastAttemptedAt: new Date().toISOString(),
      history,
      lastChangeExplanation: explanationCode,
      lastReviewedAt: new Date().toISOString(),
      nextReviewDue: sm2.nextReviewDue,
      stabilityFactor: sm2.newStabilityFactor,
      intervalDays: sm2.nextIntervalDays,
      repetitionCount: sm2.newRepetitionCount,
      ddi,
      responseTimePercentiles: percentiles,
      speedFlag
    };
  }

  /**
   * Calculates new mastery state and returns a comprehensive MasteryCalculationResult
   * including score delta, explanationCode, speedFlag, ddi, and adaptive recommendation.
   *
   * @param previous Previous ConceptMasteryState
   * @param attempt MasteryAttemptInput
   * @param profile Optional StudentMasteryProfile for holistic recommendation generation
   * @returns MasteryCalculationResult
   */
  public static calculateMasteryWithResult(
    previous: ConceptMasteryState | null,
    attempt: MasteryAttemptInput,
    profile?: StudentMasteryProfile
  ): MasteryCalculationResult {
    const prevScore = previous?.masteryScore || 0.0;
    const newState = this.calculateNewMastery(previous, attempt);
    const scoreChange = Number((newState.masteryScore - prevScore).toFixed(3));

    let recommendation: AdaptiveRecommendation | undefined;
    if (profile) {
      const updatedProfile: StudentMasteryProfile = {
        ...profile,
        conceptMasteries: {
          ...profile.conceptMasteries,
          [newState.conceptId]: newState
        }
      };
      recommendation = this.generateRecommendation(
        profile.studentId,
        newState.conceptId,
        newState.conceptId,
        updatedProfile
      );
    }

    return {
      newState,
      scoreChange,
      explanationCode: newState.lastChangeExplanation || "MASTERY_EVALUATED",
      speedFlag: newState.speedFlag,
      recommendation,
      ddi: newState.ddi,
      nextReviewDue: newState.nextReviewDue,
      stabilityFactor: newState.stabilityFactor
    };
  }

  /**
   * Applies the Ebbinghaus forgetting curve decay to a concept's mastery score over time.
   * Decay rate: 15% per day for scores below 0.7, 5% per day for scores above or equal to 0.7.
   *
   * @param state ConceptMasteryState to evaluate
   * @param asOf Reference time for evaluation (defaults to current date)
   * @returns ConceptMasteryState with decayed masteryScore and recalibrated status
   */
  public static applyForgettingCurve(
    state: ConceptMasteryState,
    asOf: Date | string = new Date()
  ): ConceptMasteryState {
    const referenceDate = typeof asOf === "string" ? new Date(asOf) : asOf;
    const lastDateStr = state.lastReviewedAt || state.lastAttemptedAt;
    if (!lastDateStr) return { ...state };

    const lastDate = new Date(lastDateStr);
    const msElapsed = referenceDate.getTime() - lastDate.getTime();
    if (msElapsed <= 0) return { ...state };

    const daysElapsed = msElapsed / (24 * 60 * 60 * 1000);
    // Apply decay only if at least 1 day has elapsed
    if (daysElapsed < 1) return { ...state };

    const decayRatePerDay = state.masteryScore < 0.7 ? 0.15 : 0.05;
    const retentionFactor = Math.pow(1 - decayRatePerDay, daysElapsed);
    const decayedScore = Number(
      Math.max(0.0, Math.min(1.0, state.masteryScore * retentionFactor)).toFixed(3)
    );

    let status = state.status;
    if (
      (state.status === MasteryStatus.MASTERED || state.status === MasteryStatus.PROFICIENT) &&
      decayedScore < 0.75
    ) {
      status = MasteryStatus.NEEDS_REVIEW;
    } else {
      status = this.determineMasteryTier(decayedScore, state.totalAttempts);
    }

    return {
      ...state,
      masteryScore: decayedScore,
      status,
      lastChangeExplanation: "FORGETTING_CURVE_DECAY"
    };
  }

  /**
   * Calculates the next review interval and stability factor using the SuperMemo-2 (SM-2) algorithm.
   *
   * @param isCorrect Whether the attempt was correct
   * @param currentRepetitions Previous count of consecutive successful repetitions
   * @param currentInterval Previous interval in days
   * @param currentStability Previous stability factor (EF, default 2.5, min 1.3)
   * @param quality Quality rating (0 to 5)
   * @param fromDate Reference anchor date for next review due
   * @returns Object containing interval in days, updated repetitions, updated stability factor, and ISO due date
   */
  public static calculateSM2Interval(
    isCorrect: boolean,
    currentRepetitions: number = 0,
    currentInterval: number = 1,
    currentStability: number = 2.5,
    quality: number = 4,
    fromDate: Date = new Date()
  ): {
    nextIntervalDays: number;
    newRepetitionCount: number;
    newStabilityFactor: number;
    nextReviewDue: string;
  } {
    const q = Math.max(0, Math.min(5, quality));
    // SM-2 formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    let newStability = currentStability + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    newStability = Number(Math.max(1.3, Math.min(3.2, newStability)).toFixed(3));

    let nextIntervalDays: number;
    let newRepetitionCount: number;

    if (!isCorrect || q < 3) {
      newRepetitionCount = 0;
      nextIntervalDays = 1;
    } else {
      newRepetitionCount = currentRepetitions + 1;
      if (newRepetitionCount === 1) {
        nextIntervalDays = 1;
      } else if (newRepetitionCount === 2) {
        nextIntervalDays = 6;
      } else {
        nextIntervalDays = Math.max(1, Math.round(currentInterval * newStability));
      }
    }

    const nextDueDate = new Date(fromDate.getTime() + nextIntervalDays * 24 * 60 * 60 * 1000);

    return {
      nextIntervalDays,
      newRepetitionCount,
      newStabilityFactor: newStability,
      nextReviewDue: nextDueDate.toISOString()
    };
  }

  /**
   * Internal mapper for SM-2 quality (0-5) based on correctness, response speed, and hint usage.
   */
  private static getSM2Quality(
    isCorrect: boolean,
    speedFlag?: ResponseSpeedFlag,
    hintUsed?: boolean
  ): number {
    if (!isCorrect) {
      return speedFlag === "FAST_INCORRECT" ? 1 : 2;
    }
    if (hintUsed) {
      return 3;
    }
    if (speedFlag === "SLOW_CORRECT" || speedFlag === "VERY_SLOW_CORRECT") {
      return 3;
    }
    if (speedFlag === "FAST_CORRECT") {
      return 5;
    }
    return 4; // NORMAL_CORRECT
  }

  /**
   * Determines the 5-tier mastery status according to score brackets and minimum attempt gating:
   * - NOT_STARTED (0.0-0.10)
   * - INTRODUCED (0.10-0.35, min 1 attempt)
   * - DEVELOPING (0.35-0.60, min 3 attempts)
   * - PROFICIENT (0.60-0.80, min 5 attempts)
   * - MASTERED (0.80-1.00, min 7 attempts)
   *
   * @param score Mastery score between 0.0 and 1.0
   * @param totalAttempts Total attempts recorded for the concept
   * @returns Calibrated MasteryStatus
   */
  public static determineMasteryTier(score: number, totalAttempts: number): MasteryStatus {
    if (score < 0.1) {
      return MasteryStatus.NOT_STARTED;
    }
    if (score < 0.35) {
      return MasteryStatus.INTRODUCED;
    }
    if (score < 0.6) {
      return totalAttempts >= 3 ? MasteryStatus.DEVELOPING : MasteryStatus.INTRODUCED;
    }
    if (score < 0.8) {
      if (totalAttempts >= 5) return MasteryStatus.PROFICIENT;
      if (totalAttempts >= 3) return MasteryStatus.DEVELOPING;
      return MasteryStatus.INTRODUCED;
    }
    // score >= 0.80
    if (totalAttempts >= 7) return MasteryStatus.MASTERED;
    if (totalAttempts >= 5) return MasteryStatus.PROFICIENT;
    if (totalAttempts >= 3) return MasteryStatus.DEVELOPING;
    return MasteryStatus.INTRODUCED;
  }

  /**
   * Calculates the Dynamic Difficulty Index (DDI) as a running average of accuracy
   * over the last N attempts (default window: 10 attempts).
   *
   * @param history Array of past attempts with isCorrect status
   * @param windowSize Window size for running average (default: 10)
   * @returns Running accuracy between 0.0 and 1.0 (defaults to 0.5 when empty)
   */
  public static calculateDDI(
    history: { isCorrect: boolean }[],
    windowSize: number = 10
  ): number {
    if (!history || history.length === 0) return 0.5;
    const window = history.slice(-windowSize);
    const correct = window.filter((h) => h.isCorrect).length;
    return Number((correct / window.length).toFixed(3));
  }

  /**
   * Evaluates multi-session DDI history to recommend content difficulty adjustments:
   * - If DDI > 0.85 for 3 consecutive sessions -> recommend 'HARDER'
   * - If DDI < 0.40 for 2 consecutive sessions -> recommend 'EASIER'
   * - Otherwise -> 'MAINTAIN'
   *
   * @param sessionDDIs Array of session-level DDIs in chronological order
   * @returns 'HARDER' | 'EASIER' | 'MAINTAIN'
   */
  public static evaluateSessionDifficultyCalibration(
    sessionDDIs: number[] = []
  ): "HARDER" | "EASIER" | "MAINTAIN" {
    if (sessionDDIs.length >= 3) {
      const last3 = sessionDDIs.slice(-3);
      if (last3.every((d) => d > 0.85)) {
        return "HARDER";
      }
    }
    if (sessionDDIs.length >= 2) {
      const last2 = sessionDDIs.slice(-2);
      if (last2.every((d) => d < 0.4)) {
        return "EASIER";
      }
    }
    return "MAINTAIN";
  }

  /**
   * Calculates or estimates response time percentiles (p50, p75, p95) from attempt history.
   *
   * @param times Historical response times in milliseconds
   * @param difficulty Difficulty level used for baseline fallback
   * @returns Percentile object { p50, p75, p95 }
   */
  public static calculateResponseTimePercentiles(
    times: number[],
    difficulty: DifficultyLevel = DifficultyLevel.STANDARD
  ): { p50: number; p75: number; p95: number } {
    const baseline =
      this.DEFAULT_TIME_PERCENTILES[difficulty] ||
      this.DEFAULT_TIME_PERCENTILES[DifficultyLevel.STANDARD];
    if (!times || times.length < 5) {
      return baseline;
    }

    const sorted = [...times].sort((a, b) => a - b);
    const getPercentile = (p: number) => {
      const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
      return sorted[idx];
    };

    return {
      p50: getPercentile(50),
      p75: getPercentile(75),
      p95: getPercentile(95)
    };
  }

  /**
   * Classifies a student attempt's response speed based on percentile boundaries:
   * - FAST_CORRECT (<= p50)
   * - NORMAL_CORRECT (<= p75)
   * - SLOW_CORRECT (<= p95)
   * - VERY_SLOW_CORRECT (> p95)
   *
   * @param responseTimeMs Response time of the attempt in milliseconds
   * @param isCorrect Whether the attempt was correct
   * @param percentiles Target percentiles { p50, p75, p95 }
   * @returns ResponseSpeedFlag
   */
  public static classifyResponseSpeed(
    responseTimeMs: number,
    isCorrect: boolean,
    percentiles: { p50: number; p75: number; p95: number }
  ): ResponseSpeedFlag {
    if (isCorrect) {
      if (responseTimeMs <= percentiles.p50) return "FAST_CORRECT";
      if (responseTimeMs <= percentiles.p75) return "NORMAL_CORRECT";
      if (responseTimeMs <= percentiles.p95) return "SLOW_CORRECT";
      return "VERY_SLOW_CORRECT";
    } else {
      if (responseTimeMs <= percentiles.p50) return "FAST_INCORRECT";
      if (responseTimeMs <= percentiles.p75) return "NORMAL_INCORRECT";
      return "SLOW_INCORRECT";
    }
  }

  /**
   * Detects recurring misconceptions and pattern failures (e.g. 3x consecutive failure on same concept).
   * Categorizes by misconceptionType ('conceptual' | 'procedural' | 'factual'),
   * flags as ACTIVE_MISCONCEPTION with timestamp, and persists until 3 consecutive correct answers.
   *
   * @param attempt The current exercise attempt
   * @param currentMisconceptions List of already known or tracked misconceptions
   * @param conceptHistory Optional recent attempt history on this concept
   * @param consecutiveCorrect Optional consecutive correct count on this concept
   * @returns Updated or newly detected MisconceptionState, or null if none detected/resolved
   */
  public static detectMisconception(
    attempt: ExerciseAttempt,
    currentMisconceptions: MisconceptionState[] = [],
    conceptHistory: { isCorrect: boolean }[] = [],
    consecutiveCorrect: number = 0
  ): MisconceptionState | null {
    // 1. Resolution Check: If student has 3 consecutive correct answers on this concept, resolve active misconception
    if (consecutiveCorrect >= 3) {
      const activeOnConcept = currentMisconceptions.find(
        (m) =>
          m.conceptId === attempt.conceptId &&
          (m.status !== MisconceptionStatus.RESOLVED || m.isActive)
      );
      if (activeOnConcept) {
        return {
          ...activeOnConcept,
          status: MisconceptionStatus.RESOLVED,
          isActive: false,
          resolvedAt: new Date().toISOString(),
          consecutiveCorrectSinceDetection: consecutiveCorrect
        };
      }
    }

    // 2. Textual trigger parsing (checking common Kurdish math/science mistakes)
    let detectedId: string | null = null;
    let nameKu = "";
    let interventionKu = "";
    let misconceptionType: MisconceptionType = "conceptual";

    const ans = (attempt.studentResponse || "").trim().toLowerCase();
    const qText = (attempt.questionText || "").trim().toLowerCase();

    // Check algebraic sign flip misconception (procedural)
    if (!attempt.isCorrect && (ans.includes("-") || ans.includes("+")) && qText.includes("هاوکێشە")) {
      detectedId = "misc_sign_flip";
      nameKu = "هەڵەی پێچەوانەکردنەوەی هێما لە گواستنەوەدا (Sign Flip)";
      interventionKu =
        "تێبینی دەکەین لەوانەیە پێویستت بە کەمێک پاڵپشتی بێت لە گواستنەوەی هێماکاندا. با پێکەوە فێری بین!";
      misconceptionType = "procedural";
    }
    // Check operation inverse misconception (procedural)
    else if (
      !attempt.isCorrect &&
      (ans.includes("/") || ans.includes("دابەش")) &&
      (qText.includes(" can ") || qText.includes("هاوکێشە") || qText.includes("لێکدان"))
    ) {
      detectedId = "misc_op_inverse";
      nameKu = "هەڵە تێکەڵکردنی کرداری لێکدان و دابەشکردنی پێچەوانە";
      interventionKu =
        "کرداری لێکدان و دابەشکردن زۆر گرنگن، وەرە با پێکەوە پێداچوونەوەیەکی خێرا بە شێوازی پێچەوانەکردنیان بکەین.";
      misconceptionType = "procedural";
    }
    // Check factual/definition misconception (factual)
    else if (
      !attempt.isCorrect &&
      (qText.includes("پێناسەی") || qText.includes("بەروار") || qText.includes("یەکە"))
    ) {
      if (attempt.misconceptionDetected) {
        detectedId = "misc_" + attempt.conceptId;
        nameKu = attempt.misconceptionDetected;
        interventionKu = "با کەمێک پێداچوونەوە بە پێناسە و یاسا سەرەکییەکانی ئەم بابەتەدا بکەین.";
        misconceptionType = "factual";
      }
    }

    // 3. Pattern detection: Check if student fails same concept 3x in a row
    const recentFailures = conceptHistory.slice(-3);
    const hasThreeConsecutiveFails =
      !attempt.isCorrect &&
      ((recentFailures.length >= 2 && recentFailures.every((h) => !h.isCorrect)) ||
        (!attempt.isCorrect &&
          currentMisconceptions.some(
            (m) => m.conceptId === attempt.conceptId && m.count >= 2
          )));

    // Fallback trigger if specified in the attempt directly or 3 consecutive fails
    if (!detectedId && !attempt.isCorrect) {
      if (attempt.misconceptionDetected) {
        detectedId = "misc_" + attempt.conceptId;
        nameKu = attempt.misconceptionDetected;
        interventionKu = "با کەمێک پێداچوونەوە بکەین بە یاساکانی ئەم بابەتە بۆ بەهێزکردنی تێگەیشتنت.";
        misconceptionType = "conceptual";
      } else if (hasThreeConsecutiveFails) {
        detectedId = "misc_consecutive_fail_" + attempt.conceptId;
        nameKu = `تێنەگەیشتنی چڕ لە چەمکی: ${attempt.conceptId} (٣ هەڵەی لەسەریەک)`;
        interventionKu =
          "تێبینی دەکرێت کێشەی سەرەکی لەم چەمکەدا هەیە بەهۆی ئەنجامدانی ٣ هەڵەی لەسەریەک. ڕێنمایی تایبەت پێشنیار دەکرێت.";
        misconceptionType = "conceptual";
      }
    }

    if (detectedId) {
      const existing = currentMisconceptions.find((m) => m.misconceptionId === detectedId);
      if (existing) {
        const newCount = existing.count + 1;
        let newStatus = MisconceptionStatus.SUSPECTED;
        let newConfidence: "low" | "medium" | "high" = "low";
        let isActive = false;

        if (newCount >= 3) {
          newStatus = MisconceptionStatus.CONFIRMED;
          newConfidence = "high";
          isActive = true;
        } else if (newCount === 2) {
          newStatus = MisconceptionStatus.SUSPECTED;
          newConfidence = "medium";
          isActive = true;
        } else if (hasThreeConsecutiveFails) {
          newStatus = MisconceptionStatus.CONFIRMED;
          newConfidence = "high";
          isActive = true;
        }

        return {
          ...existing,
          count: newCount,
          status: newStatus,
          confidence: newConfidence,
          misconceptionType: existing.misconceptionType || misconceptionType,
          isActive,
          activeFlag: isActive ? "ACTIVE_MISCONCEPTION" : undefined,
          flaggedAt: isActive ? (existing.flaggedAt || new Date().toISOString()) : undefined,
          lastDetectedAt: new Date().toISOString(),
          evidenceAttempts: [...existing.evidenceAttempts, attempt.id],
          resolvedAt: null,
          consecutiveCorrectSinceDetection: 0
        };
      } else {
        const isActive = hasThreeConsecutiveFails;
        return {
          conceptId: attempt.conceptId,
          misconceptionId: detectedId,
          nameKu,
          count: 1,
          status: isActive
            ? MisconceptionStatus.CONFIRMED
            : MisconceptionStatus.SUSPECTED,
          confidence: isActive ? "high" : "low",
          misconceptionType,
          isActive,
          activeFlag: isActive ? "ACTIVE_MISCONCEPTION" : undefined,
          flaggedAt: isActive ? new Date().toISOString() : undefined,
          evidenceAttempts: [attempt.id],
          firstDetectedAt: new Date().toISOString(),
          lastDetectedAt: new Date().toISOString(),
          resolvedAt: null,
          interventionKu,
          consecutiveCorrectSinceDetection: 0
        };
      }
    }

    return null;
  }

  /**
   * Updates an entire list of misconceptions after an attempt, resolving misconceptions
   * if 3 consecutive correct answers are met, or recording/updating detected ones.
   *
   * @param currentMisconceptions List of current misconceptions
   * @param attempt Recent attempt
   * @param consecutiveCorrect Consecutive correct answers on the concept
   * @param conceptHistory Concept history
   * @returns Updated array of MisconceptionState
   */
  public static updateMisconceptions(
    currentMisconceptions: MisconceptionState[],
    attempt: ExerciseAttempt,
    consecutiveCorrect: number,
    conceptHistory: { isCorrect: boolean }[] = []
  ): MisconceptionState[] {
    const detected = this.detectMisconception(
      attempt,
      currentMisconceptions,
      conceptHistory,
      consecutiveCorrect
    );
    if (!detected) return currentMisconceptions;

    const exists = currentMisconceptions.some(
      (m) => m.misconceptionId === detected.misconceptionId
    );
    if (exists) {
      return currentMisconceptions.map((m) =>
        m.misconceptionId === detected.misconceptionId ? detected : m
      );
    }
    return [...currentMisconceptions, detected];
  }

  /**
   * Determines adaptation difficulty for the next exercise (FOUNDATION, EASY, STANDARD, CHALLENGING, ADVANCED),
   * combining recent 4-attempt local accuracy with multi-session DDI calibration.
   *
   * @param conceptId Concept identifier
   * @param history Attempt history
   * @param sessionDDIs Multi-session DDI history
   * @returns DifficultyLevel
   */
  public static adaptDifficulty(
    conceptId: string,
    history: { isCorrect: boolean }[],
    sessionDDIs: number[] = []
  ): DifficultyLevel {
    if (!history || history.length === 0) return DifficultyLevel.EASY;

    const recent = history.slice(-4);
    const correctCount = recent.filter((h) => h.isCorrect).length;

    let baseDifficulty: DifficultyLevel;
    if (correctCount === recent.length && recent.length >= 3) {
      baseDifficulty = DifficultyLevel.CHALLENGING;
    } else if (correctCount >= 2) {
      baseDifficulty = DifficultyLevel.STANDARD;
    } else if (correctCount === 1) {
      baseDifficulty = DifficultyLevel.EASY;
    } else {
      baseDifficulty = DifficultyLevel.FOUNDATION;
    }

    const sessionAdjustment = this.evaluateSessionDifficultyCalibration(sessionDDIs);
    if (sessionAdjustment === "HARDER") {
      if (baseDifficulty === DifficultyLevel.FOUNDATION) return DifficultyLevel.EASY;
      if (baseDifficulty === DifficultyLevel.EASY) return DifficultyLevel.STANDARD;
      if (baseDifficulty === DifficultyLevel.STANDARD) return DifficultyLevel.CHALLENGING;
      return DifficultyLevel.ADVANCED;
    } else if (sessionAdjustment === "EASIER") {
      if (baseDifficulty === DifficultyLevel.CHALLENGING) return DifficultyLevel.STANDARD;
      if (baseDifficulty === DifficultyLevel.STANDARD) return DifficultyLevel.EASY;
      return DifficultyLevel.FOUNDATION;
    }

    return baseDifficulty;
  }

  /**
   * Performs prerequisite dependency cycle detection using Depth-First Search (DFS).
   * Returns true if a cycle exists (e.g. A requires B, and B requires A).
   *
   * @param prereqMap Map of concept IDs to their prerequisite array
   * @param startId Starting concept ID
   * @returns boolean
   */
  public static hasPrerequisiteCycle(
    prereqMap: Record<string, string[]>,
    startId: string
  ): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    function dfs(node: string): boolean {
      if (recStack.has(node)) return true; // cycle detected
      if (visited.has(node)) return false;

      visited.add(node);
      recStack.add(node);

      const neighbors = prereqMap[node] || [];
      for (const neighbor of neighbors) {
        if (dfs(neighbor)) return true;
      }

      recStack.delete(node);
      return false;
    }

    return dfs(startId);
  }

  /**
   * Generates highly personalized adaptive learning recommendations in Kurdish with pedagogical reasoning.
   *
   * @param studentId Student ID
   * @param conceptId Target concept ID
   * @param conceptTitleKu Concept title in Kurdish
   * @param profile Complete StudentMasteryProfile
   * @param prerequisites Prerequisite concept IDs
   * @returns AdaptiveRecommendation
   */
  public static generateRecommendation(
    studentId: string,
    conceptId: string,
    conceptTitleKu: string,
    profile: StudentMasteryProfile,
    prerequisites: string[] = []
  ): AdaptiveRecommendation {
    const masteryState = profile.conceptMasteries[conceptId];
    const score = masteryState?.masteryScore || 0.0;
    const status = masteryState?.status || MasteryStatus.NOT_STARTED;

    let type: RecommendationType = "PRACTICE_DRILL";
    let priority: "high" | "medium" | "low" = "medium";
    let titleKu = "";
    let explanationKu = "";
    let reasoningKu = "";

    // 1. Inspect Prerequisite Mastery first if prerequisites exist
    let weakPrereqId: string | null = null;
    for (const prereqId of prerequisites) {
      const pState = profile.conceptMasteries[prereqId];
      if (!pState || pState.masteryScore < 0.5) {
        weakPrereqId = prereqId;
        break;
      }
    }

    if (weakPrereqId && score < 0.6) {
      type = "PREREQUISITE_REVIEW";
      priority = "high";
      titleKu = `پێداچوونەوە بە پێویستیی یەکەم: فێربوونی چەمکی بنەڕەتی`;
      explanationKu = `سەرەتا پێویستە پێداچوونەوە بە چەمکی بنەڕەتیی "${weakPrereqId}" بکەیت پێش ئەوەی بەردەوام بیت لەسەر "${conceptTitleKu}"، چونکە تێگەیشتن لەم بابەتە نوێیە پێویستی بە جێگیربوونی زانیارییە بنەڕەتییەکەیە.`;
      reasoningKu = `قوتابی لە چەمکی داهاتوودا تووشی کێشە بووە چونکە چەمکی بنچینەیی پێشینەی بە تەواوی جێگیر نەکردووە. پێشنیار کراوە بگەڕێتەوە بۆ بەهێزکردنی بابەتە بنەڕەتییەکە.`;
    }
    // 2. Active Misconception Remedial Explanation
    else if (
      profile.activeMisconceptions.some(
        (m) =>
          m.conceptId === conceptId &&
          (m.status === MisconceptionStatus.ACTIVE_MISCONCEPTION ||
            m.status === MisconceptionStatus.CONFIRMED ||
            m.isActive) &&
          m.resolvedAt === null
      )
    ) {
      const activeMisc = profile.activeMisconceptions.find(
        (m) => m.conceptId === conceptId && m.resolvedAt === null
      )!;
      type = "REMEDIAL_EXPLANATION";
      priority = "high";
      titleKu = `ڕوونکردنەوەی چارەسەری بۆ: ${activeMisc.nameKu}`;
      explanationKu = `تێبینی دەکەین کە لە کاتی کارکردن لەسەر "${conceptTitleKu}" کێشەیەک هەیە دەربارەی: "${activeMisc.nameKu}". وەرە با پێکەوە ئەم ڕوونکردنەوە تایبەتە بخوێنینەوە بۆ چارەسەرکردنی ئەم لێکتێنەگەیشتنە.`;
      reasoningKu = `سیستەمی ناسینەوەی تێنەگەیشتنەکان (Misconception Engine) پێشنیاری جووڵەی چارەسەری تایبەت دەکات بۆ بنبڕکردنی هەڵەی دووبارەبووەوە.`;
    }
    // 3. Spaced Repetition or Needs Review
    else if (status === MasteryStatus.NEEDS_REVIEW) {
      type = "PREREQUISITE_REVIEW";
      priority = "high";
      titleKu = `پێداچوونەوەی کاتی (Spaced Repetition): ${conceptTitleKu}`;
      explanationKu = `پێشتر ئەم بابەتەت بە تەواوی خوێندبوو، بەڵام بۆ ئەوەی لە بیرت نەچێتەوە، کاتی ئەوە هاتووە پێداچوونەوەیەکی خێرا و ڕاهێنانێکی نوێی لەسەر بکەیتەوە.`;
      reasoningKu = `سیستەمی دووبارەکردنەوەی کاتی مێژوویی (Spaced Repetition) دەستنیشانی کردووە کە کاتی بیرهێنانەوەیە بۆ پاراستنی هەمیشەیی بابەتەکە لە مێشکدا.`;
    }
    // 4. Low score: Remedial Explanation
    else if (score < 0.4) {
      type = "REMEDIAL_EXPLANATION";
      priority = "medium";
      titleKu = `خوێندنی وانەی ڕوونکردنەوەی: ${conceptTitleKu}`;
      explanationKu = `پێشنیار دەکەین بابەتەکە لەسەرەتایەوە بە شێوازێکی نوێ و سادە بخوێنیتەوە. زانا ڕوونکردنەوەی ورد و ئاسان پێشکەش دەکات.`;
      reasoningKu = `ئاستی تێگەیشتنی قوتابی لە خوار ٤٠٪ دایە، پێویستە پێش ڕاهێنانی چڕ سەرەتا بنچینە تیۆرییەکە بە تەواوی فێربێت.`;
    }
    // 5. Ready to practice
    else if (score >= 0.4 && score < 0.8) {
      type = "PRACTICE_DRILL";
      priority = "medium";
      titleKu = `ڕاهێنانی چڕ لەسەر چەمکی: ${conceptTitleKu}`;
      explanationKu = `ئێستا متمانەت باشتر بووە! با کەمێک پرسیاری ئاست بەرزتر و فرە-هەڵبژاردن شیکار بکەین بۆ ئەوەی بگەیت بە متمانە و سەرکەوتنی تەواو.`;
      reasoningKu = `قوتابی لە ئاستی Developing/Proficient دایە، پێویستی بە پراکتیزەکردنی بەردەوامە بۆ جێگیرکردنی ئاستی و گەیشتن بە لێهاتوویی تەواو (Mastery).`;
    }
    // 6. Mastered: Advance!
    else {
      type = "ADVANCE_CONCEPT";
      priority = "low";
      titleKu = `پێشڕەوی بۆ بابەتی داهاتوو دوای تەواوکردنی: ${conceptTitleKu}`;
      explanationKu = `پیرۆزە! تۆ متمانە و لێهاتوویی نایابت بەدەستهێنا لەسەر ئەم چەمکە. ئێستا کاتی ئەوەیە بچین بەرەو خوێندنی وانە یان چەمکە نوێیەکانی داهاتوو.`;
      reasoningKu = `قوتابی نمرەی لێهاتوویی سەروو ٨٠٪ی بەدەستهێناوە و متمانەی تەواوە. سیستمەکە پێشنیاری جووڵەی دەکات بۆ بابەتی داهاتوو تا لە خاڵی خۆیدا چەق نەبەستێت.`;
    }

    return {
      id: "rec_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
      studentId,
      conceptId,
      type,
      titleKu,
      explanationKu,
      priority,
      status: "ACTIVE",
      generatedAt: new Date().toISOString(),
      reasoningKu
    };
  }
}
