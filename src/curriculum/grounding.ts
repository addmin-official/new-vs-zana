import { CurriculumEvidence } from "./retrieval/CurriculumEvidence.ts";

export type StudentPedagogicalLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "سەرەتا"
  | "مامناوەند"
  | "پێشکەوتوو";

export interface StructuredGroundingOptions {
  concept: string;
  grade: string;
  prerequisites?: string[];
  curriculumContext: CurriculumEvidence[] | string[];
  studentLevel: StudentPedagogicalLevel;
  misconceptions?: string[];
  subject?: string;
  stream?: string;
  additionalNotes?: string;
}

export interface GroundingVerdict {
  groundingStatus: "GROUNDED" | "UNGROUNDED";
  confidenceScore: number; // 0.0 to 1.0
  promptBlock: string;
  usedEvidenceCount: number;
  activeMisconceptionsHandled: string[];
  missingPrerequisites: string[];
}

/**
 * Normalizes student pedagogical level to standardized Kurdish and English forms.
 */
export function normalizeStudentLevel(level: StudentPedagogicalLevel): {
  en: "beginner" | "intermediate" | "advanced";
  ku: "سەرەتا" | "مامناوەند" | "پێشکەوتوو";
} {
  switch (level) {
    case "beginner":
    case "سەرەتا":
      return { en: "beginner", ku: "سەرەتا" };
    case "intermediate":
    case "مامناوەند":
      return { en: "intermediate", ku: "مامناوەند" };
    case "advanced":
    case "پێشکەوتوو":
      return { en: "advanced", ku: "پێشکەوتوو" };
    default:
      return { en: "intermediate", ku: "مامناوەند" };
  }
}

/**
 * Calculates a rigorous grounding confidence score (0.0 to 1.0).
 */
export function calculateGroundingConfidence(options: {
  chunks: (CurriculumEvidence | string)[];
  concept?: string;
  query?: string;
}): number {
  const { chunks, concept = "", query = "" } = options;

  if (!chunks || chunks.length === 0) {
    return 0.0;
  }

  // If evidence objects with scores exist
  const evidenceObjects = chunks.filter((c): c is CurriculumEvidence => typeof c !== "string");
  if (evidenceObjects.length > 0) {
    const scores = evidenceObjects.map((e) => e.score || 0.5);
    const maxScore = Math.max(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    // Weighted combination of top score and depth of retrieval
    const confidence = 0.7 * maxScore + 0.3 * avgScore;
    return Number(Math.max(0.0, Math.min(1.0, confidence)).toFixed(3));
  }

  // String excerpts fallback
  const stringChunks = chunks.filter((c): c is string => typeof c === "string");
  const totalLength = stringChunks.reduce((acc, str) => acc + str.trim().length, 0);

  if (totalLength < 40) {
    return 0.2;
  }

  const target = (concept || query).trim().toLowerCase();
  let matchBonus = 0.5;
  if (target.length > 0) {
    const hasConceptMatch = stringChunks.some((s) => s.toLowerCase().includes(target));
    if (hasConceptMatch) matchBonus = 0.85;
  }

  return Number(Math.min(1.0, matchBonus).toFixed(3));
}

/**
 * Builds the structured grounding prompt template required by the AI Tutor:
 *
 * [CONCEPT]: name
 * [GRADE]: level
 * [PREREQUISITES]: what student should already know
 * [CURRICULUM_CONTEXT]: retrieved chunks
 * [STUDENT_LEVEL]: beginner/intermediate/advanced
 * [MISCONCEPTIONS]: active misconceptions if any
 */
export function buildStructuredGroundingPrompt(options: StructuredGroundingOptions): string {
  const {
    concept,
    grade,
    prerequisites = [],
    curriculumContext,
    studentLevel,
    misconceptions = [],
    subject = "کیمیا",
    stream,
  } = options;

  const levelInfo = normalizeStudentLevel(studentLevel);

  // Format prerequisites
  const prereqText =
    prerequisites.length > 0
      ? prerequisites.join("، ")
      : "هیچ پێداویستییەکی پێشوەختەی سەرەکی دیاری نەکراوە.";

  // Format curriculum context chunks
  let contextBlock = "";
  if (!curriculumContext || curriculumContext.length === 0) {
    contextBlock = "هیچ بەڵگە و دەقێکی فەرمی نەدۆزرایەوە (UNGROUNDED).";
  } else {
    contextBlock = curriculumContext
      .map((item, idx) => {
        if (typeof item === "string") {
          return `بەڵگەی ${idx + 1}:\n${item}`;
        }
        return `بەڵگەی ${idx + 1} (${item.evidenceId}):
- بەش/بەند: ${item.chapterTitleKurdish || "نادیار"}
- کەرتی خوێندن: ${item.lessonTitleKurdish || "نادیار"}
- لاپەڕەکان: لاپەڕە ${item.pageNumberStart} تا ${item.pageNumberEnd}
- دەقی پەسەندکراو: "${item.contentSnippet}"
- سەرچاوە: ${item.provenance.publisher || "وەزارەتی پەروەردە"} (${item.provenance.publishedYear || "2015"})`;
      })
      .join("\n\n");
  }

  // Format misconceptions
  const miscText =
    misconceptions.length > 0
      ? misconceptions.map((m, i) => `${i + 1}. ${m}`).join("\n")
      : "هیچ لێکتێنەگەیشتنێکی دەستنیشانکراو بوونی نییە.";

  return `
[CONCEPT]: ${concept}
[GRADE]: پۆلی ${grade}${stream ? ` (${stream})` : ""} - ${subject}
[PREREQUISITES]: ${prereqText}
[CURRICULUM_CONTEXT]:
${contextBlock}
[STUDENT_LEVEL]: ${levelInfo.en} (${levelInfo.ku})
[MISCONCEPTIONS]:
${miscText}

ڕێساکانی بنەڕەتی و پابەندبوون:
١. تەنها لە چوارچێوەی دەقی [CURRICULUM_CONTEXT] وەڵام بدەرەوە و هیچ زانیارییەکی دەرەکی تێکەڵ مەکە.
٢. ڕەچاوی [STUDENT_LEVEL] بکە: لەگەڵ ئاستی ${levelInfo.ku} بە ڕوونکردنەوەی گونجاو و هەنگاو بە هەنگاو بدوێ.
٣. ئەگەر [MISCONCEPTIONS] تۆمار کراوە، پێویستە بە شێوازی سوقراتی و پرسیارکردنی ئاراستەکراو تێگەیشتنی قوتابی ڕاست بکەیتەوە بێ ئەوەی هەستی شەرمەزاری پێ ببەخشیت.
٤. ئەگەر [PREREQUISITES] بوونی هەیە، دڵنیابەوە لەوەی قوتابی بنەما سەرەتاییەکانی ئەو پێداویستییانەی لەبیرە.
`.trim();
}

/**
 * Senior Grounding Engine connecting curriculum retrieval directly to pedagogical AI responses.
 */
export class CurriculumGroundingEngine {
  /**
   * Evaluates retrieval context and builds a complete GroundingVerdict.
   */
  public static evaluateGrounding(options: StructuredGroundingOptions): GroundingVerdict {
    const confidenceScore = calculateGroundingConfidence({
      chunks: options.curriculumContext,
      concept: options.concept,
    });

    const isGrounded =
      confidenceScore >= 0.4 &&
      options.curriculumContext.length > 0 &&
      options.curriculumContext.some((c) =>
        typeof c === "string" ? c.trim().length > 30 : c.contentSnippet.trim().length > 30
      );

    const promptBlock = buildStructuredGroundingPrompt(options);

    return {
      groundingStatus: isGrounded ? "GROUNDED" : "UNGROUNDED",
      confidenceScore,
      promptBlock,
      usedEvidenceCount: options.curriculumContext.length,
      activeMisconceptionsHandled: options.misconceptions || [],
      missingPrerequisites: options.prerequisites || [],
    };
  }
}
