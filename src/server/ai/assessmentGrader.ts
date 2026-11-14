/**
 * ZANA Platform - Assessment Grader & Secondary Validation
 * Ensures rigorous educational evaluation with objective answer key matching
 * and structured rubric validation for free-response answers.
 */

export interface AssessmentRubric {
  factualAccuracy: number; // 0.0 - 1.0
  conceptualRelevance: number; // 0.0 - 1.0
  completeness: number; // 0.0 - 1.0
  overallScore: number; // 0.0 - 1.0
}

export interface EvaluationResult {
  isCorrect: boolean;
  rubric: AssessmentRubric;
  reason: string;
}

const NEGATIVE_CONFESSION_PATTERNS = [
  /نازانم/i,
  /هیچ/i,
  /پێم وانییە/i,
  /بیرم نییە/i,
  /تێنەگەیشتم/i,
  /وەڵام نازانم/i,
  /نازانم چۆن/i,
  / نازانم /i,
  /don't know/i,
  /idk/i,
];

/**
 * Normalizes Kurdish and Western Arabic text for objective matching
 */
export function normalizeAnswerText(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .toLowerCase()
    .replace(/[ـ]/g, "") // remove tatweel
    .replace(/[،,؛;]/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Checks for objective multiple choice answers (A, B, C, D or ئە, ب, ج, د)
 */
export function evaluateObjectiveAnswer(
  studentAnswer: string,
  expectedOption?: string
): boolean | null {
  if (!expectedOption) return null;

  const normalizedStudent = normalizeAnswerText(studentAnswer);
  const normalizedExpected = normalizeAnswerText(expectedOption);

  if (normalizedStudent === normalizedExpected) {
    return true;
  }

  // Check choice letters
  const choiceMap: Record<string, string[]> = {
    A: ["a", "ئە", "١", "1", "a)"],
    B: ["b", "ب", "٢", "2", "b)"],
    C: ["c", "ج", "٣", "3", "c)"],
    D: ["d", "د", "٤", "4", "d)"],
  };

  const expUpper = expectedOption.trim().toUpperCase();
  if (choiceMap[expUpper]) {
    const validVariants = choiceMap[expUpper];
    return validVariants.some(
      (v) =>
        normalizedStudent === v ||
        normalizedStudent.startsWith(`${v} `) ||
        normalizedStudent.startsWith(`${v}.`) ||
        normalizedStudent.startsWith(`${v}-`)
    );
  }

  // If expectedOption is a discrete objective term or short key (<= 3 words)
  if (normalizedExpected.split(" ").length <= 3 && normalizedStudent.split(" ").length <= 3) {
    return normalizedStudent === normalizedExpected;
  }

  return null;
}

/**
 * Performs secondary validation on LLM-evaluated student answer
 * Rejects hallucinations, empty/evasive responses, or inconsistent rubric scores.
 */
export function gradeAndValidateAssessment(
  studentAnswer: string,
  rawIsCorrect: boolean,
  rawRubric?: Partial<AssessmentRubric> | null,
  expectedAnswer?: string
): EvaluationResult {
  const trimmedAnswer = studentAnswer.trim();

  // 1. Objective answer check if expected answer key is provided
  if (expectedAnswer) {
    const objectiveMatch = evaluateObjectiveAnswer(trimmedAnswer, expectedAnswer);
    if (objectiveMatch !== null) {
      return {
        isCorrect: objectiveMatch,
        rubric: {
          factualAccuracy: objectiveMatch ? 1.0 : 0.0,
          conceptualRelevance: 1.0,
          completeness: 1.0,
          overallScore: objectiveMatch ? 1.0 : 0.0,
        },
        reason: objectiveMatch
          ? "وەڵامی قوتابی بە تەواوی لەگەڵ کلیلە فەرمییەکە یەکدەگرێتەوە."
          : "وەڵامی قوتابی جیاوازە لە کلیلە ڕاستەکە.",
      };
    }
  }

  // 2. Reject empty or evasive answers immediately
  if (!trimmedAnswer || trimmedAnswer.length < 2) {
    return {
      isCorrect: false,
      rubric: {
        factualAccuracy: 0,
        conceptualRelevance: 0,
        completeness: 0,
        overallScore: 0,
      },
      reason: "وەڵام نەدراوەتەوە یان زۆر کورتە.",
    };
  }

  // 3. Reject negative/admitted lack of knowledge responses
  const hasNegativeKeyword = NEGATIVE_CONFESSION_PATTERNS.some((pattern) =>
    pattern.test(trimmedAnswer)
  );
  if (hasNegativeKeyword && trimmedAnswer.length < 30) {
    return {
      isCorrect: false,
      rubric: {
        factualAccuracy: 0,
        conceptualRelevance: 0.1,
        completeness: 0,
        overallScore: 0,
      },
      reason: "قوتابی ئاماژەی داوە کە وەڵامەکە نازانێت.",
    };
  }

  // 4. Calculate structured rubric
  const accuracy = Math.max(0, Math.min(1, rawRubric?.factualAccuracy ?? (rawIsCorrect ? 0.85 : 0.3)));
  const relevance = Math.max(0, Math.min(1, rawRubric?.conceptualRelevance ?? (rawIsCorrect ? 0.85 : 0.4)));
  const completeness = Math.max(0, Math.min(1, rawRubric?.completeness ?? (rawIsCorrect ? 0.8 : 0.3)));

  // Weighted overall rubric score (Accuracy: 50%, Relevance: 30%, Completeness: 20%)
  const overallScore = Number((accuracy * 0.5 + relevance * 0.3 + completeness * 0.2).toFixed(2));

  // 5. Secondary Validation Rules:
  // - If overallScore is below threshold 0.65, must be false regardless of LLM claim
  // - If accuracy is below 0.60, must be false
  // - If overallScore >= 0.70 and accuracy >= 0.65, is accepted as correct
  let validatedIsCorrect = rawIsCorrect;

  if (overallScore < 0.65 || accuracy < 0.60) {
    validatedIsCorrect = false;
  } else if (overallScore >= 0.70 && accuracy >= 0.65) {
    validatedIsCorrect = true;
  }

  return {
    isCorrect: validatedIsCorrect,
    rubric: {
      factualAccuracy: accuracy,
      conceptualRelevance: relevance,
      completeness: completeness,
      overallScore,
    },
    reason: validatedIsCorrect
      ? "وەڵامەکە بەپێی ڕێسای زانستی پەسەندکراوە."
      : "وەڵامەکە کەموکوڕی زانستی تێدایە و نمرەی پێویستی بەدەست نەهێناوە.",
  };
}
