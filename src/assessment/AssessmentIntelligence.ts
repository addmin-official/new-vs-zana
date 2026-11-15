import {
  AssessmentQuestion,
  CognitiveLevel,
  IRTParameters,
  CognitiveProfile,
  AntiGuessingVerdict,
  AssessmentFeedbackSummary,
  AnswerSubmission,
} from "./domain/AssessmentTypes.ts";
import { DifficultyLevel } from "../learning/domain/MasteryTypes.ts";

/**
 * Senior Psychometrics & Adaptive Testing Engine (Patch 19.4 / Senior Upgrade)
 *
 * Implements:
 * 1. Item Response Theory (IRT) - 3-Parameter Logistic (3PL) Model:
 *    - Probability: P(θ) = c + (1 - c) / (1 + e^(-a*(θ - b)))
 *    - Maximum Likelihood Estimation (MLE) / MAP for student ability θ (-3.0 to +3.0)
 *    - Fisher Information I(θ) and Standard Error SE(θ)
 * 2. Computerized Adaptive Testing (CAT) Engine:
 *    - Maximum Fisher Information question selection
 *    - Tripartite stopping rules: SE < 0.3, max 20 questions, or bank exhaustion
 *    - Exposure control: strict <= 30% administration ceiling
 * 3. Diagnostic Assessment with Bloom's Taxonomy:
 *    - Cognitive levels: RECALL, COMPREHENSION, APPLICATION, ANALYSIS, SYNTHESIS, EVALUATION
 *    - Cognitive profile generation with strengths, weaknesses, and recommended focus
 * 4. Anti-Guessing Detection:
 *    - Inverted difficulty accuracy detection
 *    - Rapid response time on complex items (< 3s for > 60s items)
 *    - Score > 0.9 in < 20% expected time -> marks session as UNRELIABLE
 * 5. Pedagogical Feedback Generation:
 *    - Immediate per-question remediation
 *    - 3-point post-assessment Kurdish study roadmap
 */
export class AssessmentIntelligence {
  public static readonly THETA_MIN = -3.0;
  public static readonly THETA_MAX = 3.0;
  public static readonly CAT_MAX_QUESTIONS = 20;
  public static readonly CAT_TARGET_SE = 0.30;
  public static readonly EXPOSURE_RATE_CEILING = 0.30;

  // =========================================================================
  // 1. ITEM RESPONSE THEORY (IRT) - 3PL MODEL
  // =========================================================================

  /**
   * Calculates the probability of a correct response according to the 3PL IRT model:
   * P(θ) = c + (1 - c) / (1 + e^(-a * (θ - b)))
   *
   * @param theta Student ability estimate (-3.0 to +3.0)
   * @param a Discrimination parameter (slope, > 0)
   * @param b Difficulty parameter (-3.0 to +3.0)
   * @param c Pseudo-guessing parameter (0.0 to 1.0)
   * @returns Probability of a correct response between c and 1.0
   */
  public static calculate3PLProbability(
    theta: number,
    a: number,
    b: number,
    c: number
  ): number {
    const safeTheta = Math.max(this.THETA_MIN, Math.min(this.THETA_MAX, theta));
    const safeA = Math.max(0.1, a);
    const safeB = Math.max(this.THETA_MIN, Math.min(this.THETA_MAX, b));
    const safeC = Math.max(0.0, Math.min(0.9, c));

    // Exponent: -a * (theta - b), clamped to avoid numerical overflow/underflow
    const exponent = Math.max(-20, Math.min(20, -safeA * (safeTheta - safeB)));
    const logistic = 1.0 / (1.0 + Math.exp(exponent));

    const prob = safeC + (1.0 - safeC) * logistic;
    return Number(Math.max(safeC, Math.min(1.0, prob)).toFixed(4));
  }

  /**
   * Calculates Fisher Information of an item at ability level θ:
   * I(θ) = a² * (P(θ) - c)² / (1 - c)² * (1 - P(θ)) / P(θ)
   */
  public static calculateItemInformation(
    theta: number,
    a: number,
    b: number,
    c: number
  ): number {
    const P = this.calculate3PLProbability(theta, a, b, c);
    const safeC = Math.max(0.0, Math.min(0.9, c));
    const safeA = Math.max(0.1, a);

    if (P <= safeC || P >= 1.0) {
      return 0.0;
    }

    const numerator = Math.pow(safeA, 2) * Math.pow(P - safeC, 2) * (1.0 - P);
    const denominator = Math.pow(1.0 - safeC, 2) * P;

    if (denominator <= 0) return 0.0;

    const info = numerator / denominator;
    return Number(Math.max(0.0, info).toFixed(4));
  }

  /**
   * Maps qualitative DifficultyLevel to default IRT parameters if not explicitly provided.
   */
  public static getEffectiveIRTParameters(question: AssessmentQuestion): IRTParameters {
    if (question.irt) {
      return question.irt;
    }

    let b = 0.0;
    switch (question.difficulty) {
      case DifficultyLevel.FOUNDATION:
        b = -2.0;
        break;
      case DifficultyLevel.EASY:
        b = -1.0;
        break;
      case DifficultyLevel.STANDARD:
        b = 0.0;
        break;
      case DifficultyLevel.CHALLENGING:
        b = 1.2;
        break;
      case DifficultyLevel.ADVANCED:
        b = 2.2;
        break;
    }

    // Default discrimination
    const a = 1.0;

    // Guessing based on question type
    let c = 0.0;
    if (question.options && question.options.length > 0) {
      c = Number((1.0 / question.options.length).toFixed(2));
    }

    return { discrimination: a, difficulty: b, guessing: c };
  }

  /**
   * Updates student ability estimate θ using Maximum Likelihood / MAP Estimation.
   *
   * @param responses Array of responses with correctness and IRT parameters
   * @param currentTheta Initial guess for θ (defaults to 0.0)
   * @returns Updated { theta, standardError }
   */
  public static estimateThetaMLE(
    responses: Array<{ isCorrect: boolean; a: number; b: number; c: number }>,
    currentTheta = 0.0
  ): { theta: number; standardError: number } {
    if (!responses || responses.length === 0) {
      return { theta: 0.0, standardError: 1.0 };
    }

    let theta = Math.max(this.THETA_MIN, Math.min(this.THETA_MAX, currentTheta));

    // Newton-Raphson iteration with standard normal prior N(0, 1) for numerical stability
    const maxIterations = 10;
    const tolerance = 0.001;

    for (let iter = 0; iter < maxIterations; iter++) {
      let scoreFunction = 0.0;
      let totalInfo = 0.0;

      for (const resp of responses) {
        const u = resp.isCorrect ? 1.0 : 0.0;
        const P = this.calculate3PLProbability(theta, resp.a, resp.b, resp.c);
        const safeC = Math.max(0.0, Math.min(0.9, resp.c));

        if (P > safeC && P < 1.0) {
          const factor = (P - safeC) / (1.0 - safeC);
          // Score function contribution
          scoreFunction += resp.a * factor * ((u - P) / P);
          // Information contribution
          const info = this.calculateItemInformation(theta, resp.a, resp.b, resp.c);
          totalInfo += info;
        }
      }

      // Bayesian MAP regularization with prior N(0, 1):
      // Log-posterior derivative = S(θ) - θ
      // Second derivative = -I(θ) - 1
      const priorWeight = 1.0;
      const gradient = scoreFunction - priorWeight * theta;
      const curvature = totalInfo + priorWeight;

      if (curvature <= 0.0001) break;

      const delta = gradient / curvature;
      theta = Math.max(this.THETA_MIN, Math.min(this.THETA_MAX, theta + delta));

      if (Math.abs(delta) < tolerance) {
        break;
      }
    }

    // Compute final test information and standard error
    let testInfo = 0.0;
    for (const resp of responses) {
      testInfo += this.calculateItemInformation(theta, resp.a, resp.b, resp.c);
    }

    // Standard Error SE = 1 / sqrt(I(θ) + prior)
    const se = 1.0 / Math.sqrt(Math.max(0.01, testInfo + 1.0));

    return {
      theta: Number(theta.toFixed(3)),
      standardError: Number(se.toFixed(3)),
    };
  }

  // =========================================================================
  // 2. COMPUTERIZED ADAPTIVE TESTING (CAT)
  // =========================================================================

  /**
   * Selects the next question from the bank maximizing Fisher Information at student's current θ,
   * while respecting exposure control (<= 30%).
   */
  public static selectNextQuestionCAT(
    candidatePool: AssessmentQuestion[],
    usedQuestionIds: Set<string>,
    currentTheta: number,
    exposureCounts: Record<string, number> = {},
    totalAdministrations = 0
  ): AssessmentQuestion | null {
    const unadministered = candidatePool.filter((q) => !usedQuestionIds.has(q.id));
    if (unadministered.length === 0) return null;

    // Filter candidate items by exposure control if total administrations >= 10
    let eligibleItems = unadministered;
    if (totalAdministrations >= 10) {
      const underExposed = unadministered.filter((q) => {
        const count = exposureCounts[q.id] || 0;
        const rate = count / totalAdministrations;
        return rate <= this.EXPOSURE_RATE_CEILING;
      });
      if (underExposed.length > 0) {
        eligibleItems = underExposed;
      }
    }

    // Score eligible items by Fisher Information at current θ
    let bestQuestion: AssessmentQuestion | null = null;
    let maxInfo = -1;

    for (const q of eligibleItems) {
      const irt = this.getEffectiveIRTParameters(q);
      const info = this.calculateItemInformation(currentTheta, irt.discrimination, irt.difficulty, irt.guessing);
      if (info > maxInfo) {
        maxInfo = info;
        bestQuestion = q;
      }
    }

    return bestQuestion || eligibleItems[0];
  }

  /**
   * Evaluates the tripartite CAT stopping rules:
   * 1. Standard Error of θ < 0.3 (confident estimate)
   * 2. Maximum 20 questions reached
   * 3. Question bank exhausted
   */
  public static evaluateCATStoppingRules(
    administeredCount: number,
    currentStandardError: number,
    bankExhausted: boolean
  ): { shouldStop: boolean; reasonKu: string; reasonEn: string; code: string } {
    if (bankExhausted) {
      return {
        shouldStop: true,
        code: "BANK_EXHAUSTED",
        reasonKu: "کۆتایی هات چونکە هەموو پرسیارە گونجاوەکانی ناو کۆگای پرسیار تەواو بوون.",
        reasonEn: "Assessment finished: Question bank exhausted.",
      };
    }

    if (administeredCount >= this.CAT_MAX_QUESTIONS) {
      return {
        shouldStop: true,
        code: "MAX_QUESTIONS_REACHED",
        reasonKu: "گەیشتن بە زۆرترین ژمارەی پرسیاری دیاریکراو (٢٠ پرسیار).",
        reasonEn: "Assessment finished: Maximum questions reached (20 questions).",
      };
    }

    // Early stopping on confident ability estimate (min 5 questions required before SE stop)
    if (administeredCount >= 5 && currentStandardError < this.CAT_TARGET_SE) {
      return {
        shouldStop: true,
        code: "CONFIDENT_ESTIMATE",
        reasonKu: "جێگیربوونی ئاست: هەڵسەنگاندنەکە بە تەواوی ئاستی زانستی تۆی دەستنیشان کرد بە دڵنیایی بەرز.",
        reasonEn: "Assessment finished: Confident ability estimate achieved (SE < 0.3).",
      };
    }

    return {
      shouldStop: false,
      code: "CONTINUE",
      reasonKu: "",
      reasonEn: "",
    };
  }

  // =========================================================================
  // 3. DIAGNOSTIC ASSESSMENT & BLOOM'S TAXONOMY
  // =========================================================================

  /**
   * Infers Bloom's Taxonomy Cognitive Level for a question if not explicitly tagged.
   */
  public static deriveCognitiveLevel(question: AssessmentQuestion): CognitiveLevel {
    if (question.cognitiveLevel) {
      return question.cognitiveLevel;
    }

    switch (question.difficulty) {
      case DifficultyLevel.FOUNDATION:
        return CognitiveLevel.RECALL;
      case DifficultyLevel.EASY:
        return CognitiveLevel.COMPREHENSION;
      case DifficultyLevel.STANDARD:
        return CognitiveLevel.APPLICATION;
      case DifficultyLevel.CHALLENGING:
        return CognitiveLevel.ANALYSIS;
      case DifficultyLevel.ADVANCED:
        return CognitiveLevel.EVALUATION;
      default:
        return CognitiveLevel.COMPREHENSION;
    }
  }

  /**
   * Compiles a diagnostic cognitive profile across Bloom's Taxonomy levels.
   */
  public static generateCognitiveProfile(
    attempts: Array<{ question: AssessmentQuestion; isCorrect: boolean }>
  ): CognitiveProfile {
    const allLevels = [
      CognitiveLevel.RECALL,
      CognitiveLevel.COMPREHENSION,
      CognitiveLevel.APPLICATION,
      CognitiveLevel.ANALYSIS,
      CognitiveLevel.SYNTHESIS,
      CognitiveLevel.EVALUATION,
    ];

    const breakdown: Record<CognitiveLevel, { correct: number; total: number; percentage: number }> = {
      [CognitiveLevel.RECALL]: { correct: 0, total: 0, percentage: 0 },
      [CognitiveLevel.COMPREHENSION]: { correct: 0, total: 0, percentage: 0 },
      [CognitiveLevel.APPLICATION]: { correct: 0, total: 0, percentage: 0 },
      [CognitiveLevel.ANALYSIS]: { correct: 0, total: 0, percentage: 0 },
      [CognitiveLevel.SYNTHESIS]: { correct: 0, total: 0, percentage: 0 },
      [CognitiveLevel.EVALUATION]: { correct: 0, total: 0, percentage: 0 },
    };

    for (const att of attempts) {
      const level = this.deriveCognitiveLevel(att.question);
      breakdown[level].total++;
      if (att.isCorrect) {
        breakdown[level].correct++;
      }
    }

    const strongLevels: CognitiveLevel[] = [];
    const weakLevels: CognitiveLevel[] = [];

    for (const lvl of allLevels) {
      const entry = breakdown[lvl];
      if (entry.total > 0) {
        entry.percentage = Math.round((entry.correct / entry.total) * 100);
        if (entry.percentage >= 70) {
          strongLevels.push(lvl);
        } else if (entry.percentage < 50) {
          weakLevels.push(lvl);
        }
      }
    }

    let recommendedFocus = "بەردەوام بە لە شیکارکردنی پرسیارە گشتگیرەکان.";
    if (weakLevels.includes(CognitiveLevel.RECALL)) {
      recommendedFocus = "پێداچوونەوە بە پێناسە بنەڕەتییەکان و چەمکە سەرەکییەکاندا بکە.";
    } else if (weakLevels.includes(CognitiveLevel.APPLICATION)) {
      recommendedFocus = "تەرکیز بکە سەر شیکارکردنی هاوکێشە و ڕاهێنانی کردارەکی.";
    } else if (weakLevels.includes(CognitiveLevel.ANALYSIS)) {
      recommendedFocus = "پێویستت بە بەراوردکردن و شیکردنەوەی وردی هۆکار و دەرئەنجامەکانە.";
    } else if (weakLevels.includes(CognitiveLevel.EVALUATION)) {
      recommendedFocus = "ڕاهێنان بکە لەسەر پرسیارە ئاڵۆزەکانی وەزاری کە پێویستیان بە بڕیاردانی زانستی هەیە.";
    }

    return {
      strongLevels,
      weakLevels,
      recommendedFocus,
      levelBreakdown: breakdown,
    };
  }

  // =========================================================================
  // 4. ANTI-GUESSING DETECTION
  // =========================================================================

  /**
   * Analyzes student response patterns to detect guessing, rapid clicking, and suspicious anomalies.
   *
   * Triggers:
   * 1. Inverted difficulty accuracy (e.g. accuracy on hard > accuracy on easy)
   * 2. Response time < 3s on complex questions (> 60s expected)
   * 3. Overall score > 0.90 but total time < 20% of expected total time
   */
  public static detectAntiGuessing(
    attempts: Array<{ question: AssessmentQuestion; submission: AnswerSubmission; isCorrect: boolean }>,
    totalDurationSeconds: number,
    targetDurationSeconds: number
  ): AntiGuessingVerdict {
    const reasons: string[] = [];

    let easyCorrect = 0;
    let easyTotal = 0;
    let hardCorrect = 0;
    let hardTotal = 0;
    let rapidResponseCount = 0;

    for (const att of attempts) {
      const diff = att.question.difficulty;
      const isEasy = diff === DifficultyLevel.FOUNDATION || diff === DifficultyLevel.EASY;
      const isHard =
        diff === DifficultyLevel.STANDARD ||
        diff === DifficultyLevel.CHALLENGING ||
        diff === DifficultyLevel.ADVANCED;

      if (isEasy) {
        easyTotal++;
        if (att.isCorrect) easyCorrect++;
      } else if (isHard) {
        hardTotal++;
        if (att.isCorrect) hardCorrect++;
      }

      // Check rapid response time (< 3000 ms on questions expected > 60s)
      const expectedTime = att.question.estimatedDurationSeconds || 60;
      if (expectedTime >= 60 && att.submission.responseTimeMs < 3000 && att.isCorrect) {
        rapidResponseCount++;
      }
    }

    // Flag 1: Inverted difficulty accuracy
    let invertedDifficultyAccuracy = false;
    if (easyTotal >= 2 && hardTotal >= 2) {
      const easyAcc = easyCorrect / easyTotal;
      const hardAcc = hardCorrect / hardTotal;
      if (easyAcc < 0.40 && hardAcc > 0.70) {
        invertedDifficultyAccuracy = true;
        reasons.push("پێچەوانەبوونی ئاستی ڕاستی: نمرە لە پرسیارە قورسەکاندا بەرزترە لە پرسیارە ئاسانەکان بە شێوەیەکی نالۆجیکی.");
      }
    }

    // Flag 2: Rapid response time
    const rapidResponseTime = rapidResponseCount >= 2;
    if (rapidResponseTime) {
      reasons.push("وەڵامدانەوەی زۆر خێرا لە پرسیارە قورسەکاندا (کەمتر لە ٣ چرکە).");
    }

    // Flag 3: Unrealistic speed and high score
    const totalCorrect = attempts.filter((a) => a.isCorrect).length;
    const scoreRatio = attempts.length > 0 ? totalCorrect / attempts.length : 0;
    const timeRatio = targetDurationSeconds > 0 ? totalDurationSeconds / targetDurationSeconds : 1;
    const unrealisticScoreSpeed = scoreRatio >= 0.90 && timeRatio < 0.20 && attempts.length >= 5;

    if (unrealisticScoreSpeed) {
      reasons.push("تەواوکردنی زۆربەی پرسیارەکان بە نمرەی تەواو لە کەمتر لە ٢٠٪ی کاتی پێویست.");
    }

    const isSuspicious = invertedDifficultyAccuracy || rapidResponseTime || unrealisticScoreSpeed;

    return {
      isSuspicious,
      isUnreliable: isSuspicious,
      reasons,
      flags: {
        invertedDifficultyAccuracy,
        rapidResponseTime,
        unrealisticScoreSpeed,
      },
    };
  }

  // =========================================================================
  // 5. FEEDBACK GENERATION
  // =========================================================================

  /**
   * Generates a 3-point pedagogical summary following assessment completion.
   */
  public static generatePostAssessmentSummary(
    attempts: Array<{ question: AssessmentQuestion; isCorrect: boolean }>
  ): AssessmentFeedbackSummary {
    const conceptStats: Record<string, { correct: number; total: number; titleKu: string }> = {};

    for (const att of attempts) {
      const cid = att.question.conceptId || att.question.lessonId || "general_concept";
      if (!conceptStats[cid]) {
        conceptStats[cid] = {
          correct: 0,
          total: 0,
          titleKu: att.question.lessonId || att.question.promptKu.substring(0, 30),
        };
      }
      conceptStats[cid].total++;
      if (att.isCorrect) {
        conceptStats[cid].correct++;
      }
    }

    const masteredConcepts: string[] = [];
    const reviewConcepts: string[] = [];

    for (const [cid, stat] of Object.entries(conceptStats)) {
      const ratio = stat.correct / stat.total;
      if (ratio >= 0.75) {
        masteredConcepts.push(cid);
      } else {
        reviewConcepts.push(cid);
      }
    }

    let recommendedNextSessionPlanKu = "١. بەردەوام بە لە خوێندنی وانە نوێیەکان بەپێی پلانی ڕۆژانە.";
    if (reviewConcepts.length > 0) {
      recommendedNextSessionPlanKu = `١. پێداچوونەوە بە چەمکەکانی (${reviewConcepts.slice(0, 3).join("، ")}) بکە.\n٢. لە بەشی چاتی زیرەک ڕوونکردنەوەی فێرکاری وەربگرە.\n٣. لە تاقیگەی ڕاهێنان ٣ پرسیاری نوێ لەسەر ئەو خاڵانە شیکار بکە.`;
    }

    return {
      masteredConcepts,
      reviewConcepts,
      recommendedNextSessionPlanKu,
    };
  }
}
