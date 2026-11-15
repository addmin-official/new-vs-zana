/**
 * ZANA Response Parser & Multimodal Detector
 * Parses raw LLM text into semantic educational blocks, parses JSON schemas from Gemini,
 * and provides type guards for Tutor, Assessment, and QuestionBank payloads.
 */

import { detectForbiddenPhrases } from "./tutorPersona.ts";

export type EducationalResponseType =
  | "EXPLANATION"
  | "STEP_BY_STEP"
  | "FORMULA"
  | "DIAGRAM_DESCRIPTION"
  | "EXAMPLE"
  | "SOCRATIC_QUESTION"
  | "PRACTICE_QUESTION";

export interface StepItem {
  stepNumber: number;
  title: string;
  content: string;
}

export interface FormulaVariable {
  symbol: string;
  meaning: string;
  unit?: string;
}

export interface ParsedFormula {
  title?: string;
  formula: string;
  variables: FormulaVariable[];
  notes?: string;
}

export interface ParsedExample {
  title: string;
  content: string;
}

export interface ParsedPracticeQuestion {
  stem: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
}

export interface ParsedEducationalResponse {
  primaryType: EducationalResponseType;
  rawText: string;
  sanitizedText: string;
  hasForbiddenPhrases: boolean;
  steps: StepItem[];
  formulas: ParsedFormula[];
  examples: ParsedExample[];
  socraticQuestion: string | null;
  practiceQuestion: ParsedPracticeQuestion | null;
  curriculumReference?: {
    chapter?: string;
    lesson?: string;
    pageRange?: string;
  };
}

/**
 * Structured Schema Definitions for Gemini JSON responses
 */
export interface TutorResponse {
  responseType: "EXPLANATION" | "STEP_BY_STEP" | "FORMULA" | "EXAMPLE";
  content: string;
  followUpQuestions: string[];
  hintsUsed: number;
  conceptsReferenced: string[];
  encouragement: string | null;
}

export interface AssessmentResponse {
  isCorrect: boolean;
  partialCredit: number;
  misconceptionDetected: string | null;
  misconceptionType: "conceptual" | "procedural" | "factual" | null;
  positiveElement: string;
  redirectionHint: string;
  bloomsAchieved: "RECALL" | "COMPREHENSION" | "APPLICATION" | "ANALYSIS" | string;
}

export interface GeneratedQuestionItem {
  id: string;
  text: string;
  type: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "TRUE_FALSE" | string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
  bloomsLevel: string;
  difficulty: number;
  targetMisconception: string | null;
  estimatedTimeSeconds: number;
}

export interface QuestionBank {
  questions: GeneratedQuestionItem[];
}

const SUPERSCRIPT_MAP: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "-": "⁻",
  "+": "⁺",
  "n": "ⁿ",
};

export class ResponseParser {
  /**
   * Sanitizes a response string by stripping extraneous markdown code blocks, backticks, and extra whitespace.
   */
  public static sanitizeResponse(raw: string): string {
    if (!raw) return "";
    return raw
      .replace(/^```(?:json|markdown)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // remove zero-width spaces
      .trim();
  }

  /**
   * Type Guard: Validates TutorResponse
   */
  public static isTutorResponse(obj: unknown): obj is TutorResponse {
    if (!obj || typeof obj !== "object") return false;
    const r = obj as Record<string, unknown>;
    return (
      typeof r.content === "string" &&
      Array.isArray(r.followUpQuestions) &&
      typeof r.hintsUsed === "number" &&
      Array.isArray(r.conceptsReferenced) &&
      (typeof r.encouragement === "string" || r.encouragement === null)
    );
  }

  /**
   * Type Guard: Validates AssessmentResponse
   */
  public static isAssessmentResponse(obj: unknown): obj is AssessmentResponse {
    if (!obj || typeof obj !== "object") return false;
    const a = obj as Record<string, unknown>;
    return (
      typeof a.isCorrect === "boolean" &&
      typeof a.partialCredit === "number" &&
      (typeof a.misconceptionDetected === "string" || a.misconceptionDetected === null) &&
      typeof a.positiveElement === "string" &&
      typeof a.redirectionHint === "string" &&
      typeof a.bloomsAchieved === "string"
    );
  }

  /**
   * Type Guard: Validates QuestionBank
   */
  public static isQuestionBank(obj: unknown): obj is QuestionBank {
    if (!obj || typeof obj !== "object") return false;
    const qb = obj as Record<string, unknown>;
    if (!Array.isArray(qb.questions)) return false;
    return qb.questions.every(
      (q) =>
        q &&
        typeof q === "object" &&
        typeof q.id === "string" &&
        typeof q.text === "string" &&
        typeof q.correctAnswer === "string"
    );
  }

  /**
   * Safely parses JSON response from Gemini with fallback to plain text content.
   */
  public static parseJsonSafe<T>(
    rawText: string,
    validator?: (obj: unknown) => obj is T
  ): { data: T | null; fallbackText: string; isJson: boolean } {
    const sanitized = this.sanitizeResponse(rawText);

    try {
      const parsed = JSON.parse(sanitized);
      if (validator) {
        if (validator(parsed)) {
          return { data: parsed, fallbackText: "", isJson: true };
        } else {
          this.logDevWarning("JSON structure failed validator contract", parsed);
        }
      } else {
        return { data: parsed as T, fallbackText: "", isJson: true };
      }
    } catch {
      // Fallback: extract content as plain text if JSON parse fails
      this.logDevWarning("Failed to parse Gemini output as JSON, falling back to plain text", rawText);
    }

    return {
      data: null,
      fallbackText: this.cleanAndNormalizeMath(sanitized),
      isJson: false,
    };
  }

  private static logDevWarning(message: string, context?: unknown) {
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
      console.warn(`[ResponseParser Dev Warning] ${message}`, context);
    }
  }

  /**
   * Primary educational parsing entry point: parses raw response text into structured blocks.
   */
  public static parse(rawText: string): ParsedEducationalResponse {
    const text = rawText || "";
    const sanitized = this.cleanAndNormalizeMath(text);
    const forbiddenCheck = detectForbiddenPhrases(text);

    const primaryType = this.detectPrimaryType(text);
    const steps = this.parseSteps(text);
    const formulas = this.parseFormulas(text);
    const examples = this.parseExamples(text);
    const socraticQuestion = this.parseSocraticQuestion(text);
    const practiceQuestion = this.parsePracticeQuestion(text);
    const curriculumReference = this.extractCurriculumReferences(text);

    return {
      primaryType,
      rawText: text,
      sanitizedText: sanitized,
      hasForbiddenPhrases: forbiddenCheck.hasForbidden,
      steps,
      formulas,
      examples,
      socraticQuestion,
      practiceQuestion,
      curriculumReference,
    };
  }

  /**
   * Detects the primary educational response archetype.
   */
  public static detectPrimaryType(text: string): EducationalResponseType {
    const t = text.toLowerCase();
    const trimmed = text.trim();

    // 1. Practice question detection (options A, B, C, D or ئەلف، بێ، جیم، دال)
    if (
      (t.includes("a)") || t.includes("a.") || t.includes("أ)") || t.includes("١.")) &&
      (t.includes("b)") || t.includes("b.") || t.includes("ب)") || t.includes("٢.")) &&
      (t.includes("c)") || t.includes("c.") || t.includes("ج)") || t.includes("٣."))
    ) {
      return "PRACTICE_QUESTION";
    }

    // 2. Formula detection
    if (
      t.includes("هاوکێشەی") ||
      t.includes("یاسای") ||
      t.includes("خشتەی گۆڕاوەکان") ||
      t.includes("ph = -log") ||
      t.includes("f = m") ||
      t.includes("e = mc")
    ) {
      if (t.includes("خشتەی گۆڕاوەکان") || t.includes("گۆڕاوەکان:") || t.includes("یەکە:")) {
        return "FORMULA";
      }
    }

    // 3. Diagram description / Virtual Science Lab link
    if (
      t.includes("دیاریکردنی هێڵکاری") ||
      t.includes("وێنەی ڕوونکردنەوە") ||
      t.includes("دیاگرام") ||
      t.includes("تاقیگەی زانستی") ||
      t.includes("virtual science lab") ||
      t.includes("هێڵکاری")
    ) {
      return "DIAGRAM_DESCRIPTION";
    }

    // 4. Step by step breakdown
    const hasStep1 = /هەنگاو(?:ی)?\s*(?:یەکەم|[١1])|step\s*1/i.test(t) || t.includes("١.");
    const hasStep2 = /هەنگاو(?:ی)?\s*(?:دووەم|[٢2])|step\s*2/i.test(t) || t.includes("٢.");
    const hasStep3 = /هەنگاو(?:ی)?\s*(?:سێیەم|[٣3])|step\s*3/i.test(t) || t.includes("٣.");
    if (hasStep1 && (hasStep2 || hasStep3)) {
      return "STEP_BY_STEP";
    }

    // 5. Socratic guiding question focus
    if (
      trimmed.endsWith("؟") ||
      trimmed.endsWith("?") ||
      t.includes("چۆن بیر لەوە دەکەیتەوە") ||
      t.includes("دەتوانیت پێم بڵێیت") ||
      t.includes("پێت وایە چی ڕوودەدات") ||
      (t.includes("ئایا") && (t.includes("؟") || t.includes("?")))
    ) {
      const paragraphs = trimmed.split("\n\n").filter((p) => p.trim().length > 0);
      if (paragraphs.length <= 2 && (trimmed.includes("؟") || trimmed.includes("?"))) {
        return "SOCRATIC_QUESTION";
      }
    }

    // 6. Example focus
    if (
      t.includes("نموونەی بەرجەستە") ||
      t.includes("نموونەی ژیانی ڕۆژانە") ||
      t.includes("بۆ نموونە:")
    ) {
      const exampleCount = (t.match(/نموونە/g) || []).length;
      if (exampleCount >= 2) {
        return "EXAMPLE";
      }
    }

    return "EXPLANATION";
  }

  /**
   * Extracts numbered steps from markdown or plain text.
   */
  public static parseSteps(text: string): StepItem[] {
    const steps: StepItem[] = [];
    const lines = text.split("\n");

    let currentStep: Partial<StepItem> | null = null;
    let stepCounter = 1;

    const stepRegex = /^(?:[١-٩1-9][\.\-\)]|هەنگاو(?:ی)?\s+(?:یەکەم|دووەم|سێیەم|چوارەم|پێنجەم|[١-٩1-9])|Step\s+[0-9]+:?)\s*(.*)/i;

    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(stepRegex);

      if (match) {
        if (currentStep && currentStep.title) {
          steps.push({
            stepNumber: currentStep.stepNumber || stepCounter++,
            title: currentStep.title,
            content: (currentStep.content || "").trim(),
          });
        }

        const rawMatch = match[1] || `هەنگاوی ${stepCounter}`;
        let title = rawMatch.trim();
        let inlineContent = "";

        if (title.includes("]:")) {
          const parts = title.split("]:");
          title = parts[0].replace(/^\[/, "").trim();
          inlineContent = parts.slice(1).join("]:").trim();
        } else if (title.includes(":")) {
          const parts = title.split(":");
          title = parts[0].trim();
          inlineContent = parts.slice(1).join(":").trim();
        }

        currentStep = {
          stepNumber: stepCounter++,
          title,
          content: inlineContent,
        };
      } else if (currentStep) {
        currentStep.content = (currentStep.content ? currentStep.content + "\n" : "") + trimmed;
      }
    }

    if (currentStep && currentStep.title) {
      steps.push({
        stepNumber: currentStep.stepNumber || stepCounter,
        title: currentStep.title,
        content: (currentStep.content || "").trim(),
      });
    }

    return steps;
  }

  /**
   * Extracts formulas and variable tables.
   */
  public static parseFormulas(text: string): ParsedFormula[] {
    const formulas: ParsedFormula[] = [];
    const formulaLines = text.split("\n").filter((l) => l.includes("=") || l.includes("≈"));

    for (const fLine of formulaLines) {
      const trimmed = fLine.trim().replace(/^[-*•]\s*/, "");
      if (trimmed.length > 3 && trimmed.length < 80 && !trimmed.startsWith("http")) {
        const variables: FormulaVariable[] = [];
        const varMatches = text.match(/[-*•]?\s*(\[?[a-zA-Z0-9\u0600-\u06FF⁺⁻\+\-]+\]?)\s*[=:]\s*([^,\n]+)/g);

        if (varMatches) {
          for (const vm of varMatches.slice(0, 8)) {
            const cleanVm = vm.replace(/^[-*•]\s*/, "");
            const parts = cleanVm.split(/[=:]/);
            if (parts.length >= 2) {
              const symbol = parts[0].trim();
              const meaning = parts.slice(1).join(":").trim();
              if (symbol.length > 0 && meaning.length > 0 && !symbol.includes("هاوکێشەی")) {
                variables.push({ symbol, meaning });
              }
            }
          }
        }

        formulas.push({
          formula: trimmed,
          variables,
        });
      }
    }

    return formulas;
  }

  /**
   * Extracts examples embedded in pedagogical responses.
   */
  public static parseExamples(text: string): ParsedExample[] {
    const examples: ParsedExample[] = [];
    const lines = text.split("\n");

    let currentExample: Partial<ParsedExample> | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes("نموونە:") || trimmed.includes("بۆ نموونە:")) {
        if (currentExample && currentExample.content) {
          examples.push({
            title: currentExample.title || "نموونە",
            content: currentExample.content.trim(),
          });
        }
        currentExample = {
          title: "نموونەی فێرکاری",
          content: trimmed.replace(/.*(?:نموونە:|بۆ نموونە:)/, "").trim(),
        };
      } else if (currentExample) {
        currentExample.content = (currentExample.content ? currentExample.content + " " : "") + trimmed;
      }
    }

    if (currentExample && currentExample.content) {
      examples.push({
        title: currentExample.title || "نموونە",
        content: currentExample.content.trim(),
      });
    }

    return examples;
  }

  /**
   * Extracts the primary Socratic question to guide the student.
   */
  public static parseSocraticQuestion(text: string): string | null {
    const paragraphs = text.split("\n\n").map((p) => p.trim()).filter(Boolean);
    if (paragraphs.length === 0) return null;

    const last = paragraphs[paragraphs.length - 1];
    if (last.includes("؟") || last.includes("?")) {
      return last;
    }

    if (paragraphs.length > 1) {
      const prev = paragraphs[paragraphs.length - 2];
      if (prev.includes("؟") || prev.includes("?")) {
        return prev;
      }
    }

    return null;
  }

  /**
   * Extracts practice question options and prompt.
   */
  public static parsePracticeQuestion(text: string): ParsedPracticeQuestion | null {
    const optionMatches = text.match(/(?:[A-Da-dأ-د][\.\-\)]\s*|[١-٤][\.\-\)]\s*)([^\n]+)/g);
    if (!optionMatches || optionMatches.length < 3) return null;

    const options = optionMatches.map((opt) => opt.replace(/^[A-Da-dأ-د١-٤][\.\-\)]\s*/, "").trim());
    const stem = text.split(/(?:[A-Da-dأ-د][\.\-\)]|[١-٤][\.\-\)])/)[0].trim();

    return {
      stem,
      options,
    };
  }

  /**
   * Extracts curriculum provenance citations if present.
   */
  public static extractCurriculumReferences(text: string): {
    chapter?: string;
    lesson?: string;
    pageRange?: string;
  } | undefined {
    const chapterMatch = text.match(/بەندی\s+([٠-٩0-9]+|[^\n،]+)/);
    const lessonMatch = text.match(/وانەی\s+([٠-٩0-9]+|[^\n،]+)/);
    const pageMatch = text.match(/لاپەڕە(?:ی|\s+)*([٠-٩0-9]+(?:\s*تا\s*[٠-٩0-9]+)?)/);

    if (chapterMatch || lessonMatch || pageMatch) {
      return {
        chapter: chapterMatch ? chapterMatch[1].trim() : undefined,
        lesson: lessonMatch ? lessonMatch[1].trim() : undefined,
        pageRange: pageMatch ? pageMatch[1].trim() : undefined,
      };
    }

    return undefined;
  }

  /**
   * Converts raw LaTeX or chemical notation into clean Unicode math expressions.
   */
  public static cleanAndNormalizeMath(text: string): string {
    let result = text
      .replace(/\[?H3O\+?\]?/g, "[H₃O⁺]")
      .replace(/\[?OH\-?\]?/g, "[OH⁻]")
      .replace(/H2SO4/g, "H₂SO₄")
      .replace(/HCl/g, "HCl")
      .replace(/CO2/g, "CO₂")
      .replace(/H2O/g, "H₂O")
      .replace(/\\\[([\s\S]*?)\\\]/g, "$1")
      .replace(/\\\(([\s\S]*?)\\\)/g, "$1")
      .replace(/\$([^\$]+)\$/g, "$1")
      .replace(/\\cdot/g, "·")
      .replace(/\\times/g, "×")
      .replace(/\\approx/g, "≈")
      .replace(/\\le(q)?/g, "≤")
      .replace(/\\ge(q)?/g, "≥");

    result = result.replace(/\^(-?\d+|[n])/g, (_, exp) =>
      exp
        .split("")
        .map((c: string) => SUPERSCRIPT_MAP[c] || c)
        .join("")
    );

    return result;
  }
}
