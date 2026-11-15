/**
 * ZANA Master Prompt Template System
 * Standardizes instruction engineering for pedagogical reasoning, Socratic scaffolding,
 * misconception remediation, formula breakdown, and diagnostic exercise generation.
 * Enforces strict JSON output schemas via Gemini responseMimeType and prompt contracts.
 */

import { buildPersonaPromptBlock } from "./tutorPersona.ts";
import { SafetyFilter } from "./safetyFilter.ts";

export const PROMPT_TEMPLATE_VERSION = "v1.0.0";

export interface ConceptExplanationParams {
  conceptName: string;
  subject: string;
  grade: string;
  stream?: string;
  level?: string;
  studentName?: string;
  masteryTier?: "NOT_STARTED" | "INTRODUCED" | "DEVELOPING" | "PROFICIENT" | "MASTERED" | string;
  curriculumEvidenceSnippet?: string;
  curriculumChunks?: string;
  activeMisconceptions?: string[];
  recentConcepts?: string[];
  irtTheta?: number;
  prerequisite?: string;
  requestType?: "ڕوونکردنەوە" | "نموونە" | "پرسیار" | "چارەسەرکردن" | string;
  previousMasteryScore?: number;
  version?: string;
}

export interface AssessAnswerParams {
  question: string;
  correctAnswer: string;
  bloomsLevel: "RECALL" | "COMPREHENSION" | "APPLICATION" | "ANALYSIS" | "EVALUATION" | string;
  studentAnswer: string;
  responseTimeSeconds?: number;
  version?: string;
}

export interface GenerateQuestionsParams {
  concept: string;
  grade: string;
  stream: string;
  bloomsLevel: "RECALL" | "COMPREHENSION" | "APPLICATION" | "ANALYSIS" | string;
  difficulty: number; // 0.0 - 1.0
  count: number;
  questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "TRUE_FALSE" | string;
  activeMisconceptions?: string[];
  version?: string;
}

export interface SocraticHintParams {
  problemText: string;
  studentAnswer?: string;
  hintLevel: 1 | 2 | 3 | 4;
  conceptName?: string;
  subject?: string;
  previousHints?: string[];
}

export interface PracticeQuestionParams {
  conceptId: string;
  conceptNameKu: string;
  subject: string;
  grade: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  cognitiveLevel?: "RECALL" | "COMPREHENSION" | "APPLICATION" | "ANALYSIS" | "EVALUATION";
  curriculumExcerpt?: string;
}

export interface MisconceptionRemediationParams {
  detectedMisconceptionNameKu: string;
  studentIncorrectResponse: string;
  conceptNameKu: string;
  subject: string;
  grade: string;
}

export interface FormulaExplanationParams {
  formulaSymbolic: string;
  formulaNameKu: string;
  subject: string;
  grade: string;
  contextUsageKu?: string;
}

export interface ExamSummaryParams {
  subject: string;
  conceptsCovered: string[];
  correctCount: number;
  totalQuestions: number;
  studentName?: string;
}

export class PromptTemplates {
  public static readonly VERSION = PROMPT_TEMPLATE_VERSION;

  /**
   * A/B testing version selector: determines template version for a session.
   * By default, 10% of requests receive "v2.0.0" when available.
   */
  public static selectTemplateVersion(templateName: string, studentId = ""): string {
    if (!studentId) return PROMPT_TEMPLATE_VERSION;
    let hash = 0;
    for (let i = 0; i < studentId.length; i++) {
      hash = (hash << 5) - hash + studentId.charCodeAt(i);
      hash |= 0;
    }
    const bucket = Math.abs(hash) % 100;
    return bucket < 10 ? "v2.0.0" : PROMPT_TEMPLATE_VERSION;
  }

  /**
   * Template 1: EXPLAIN_CONCEPT
   * Upgraded with JSON schema output, teaching rules, and prerequisite probing.
   */
  public static explainConcept(params: ConceptExplanationParams): string {
    const concept = SafetyFilter.sanitizeUserInput(params.conceptName);
    const grade = SafetyFilter.sanitizeUserInput(params.grade);
    const stream = params.stream ? SafetyFilter.sanitizeUserInput(params.stream) : "زانستی";
    const masteryTier = params.masteryTier || "DEVELOPING";
    const curriculumChunks = params.curriculumChunks || params.curriculumEvidenceSnippet || "مەنهەجی فەرمیی پۆلی دیاریکراو.";
    const activeMisconceptions = (params.activeMisconceptions || []).join("، ") || "هیچ هەڵەیەکی دیاریکراو نییە.";
    const recentConcepts = (params.recentConcepts || []).join("، ") || "دەستپێکی بەش.";
    const irtTheta = params.irtTheta !== undefined ? params.irtTheta.toFixed(2) : "0.00";
    const requestType = params.requestType || "ڕوونکردنەوە";
    const prerequisite = params.prerequisite || "چەمکە بنەڕەتییەکان";

    return `
[IDENTITY]
تۆ زانایت، مامۆستای زیرەکی پلاتفۆرمی ZANA.
خوێندکارەکە لە پۆلی ${grade}ەمە، شاخەی ${stream}.
ئاستی تێگەیشتنی ئێستا: ${masteryTier} لە بابەتی ${concept}.
وەشانی پرۆمپت: ${params.version || PROMPT_TEMPLATE_VERSION}

[CONTEXT]
مەنهەجی فەرمی:
${curriculumChunks}

[STUDENT STATE]
هەڵەی دیاریکراو: ${activeMisconceptions}
دواین بابەتی تێگەیشتوو: ${recentConcepts}
ئاستی توانا: θ = ${irtTheta}

[TASK]
بابەتی داواکراو: ${concept}
جۆری داواکاری: ${requestType}
(ڕوونکردنەوە | نموونە | پرسیار | چارەسەرکردن)

[TEACHING RULES]
- بە زمانی شیرینی کوردی سۆرانی وەڵامبدەرەوە.
${masteryTier === "NOT_STARTED" || masteryTier === "INTRODUCED" ? `- سەرەتا بپرسە "ئایا ${prerequisite} دەناسیت؟"\n` : ""}- ئەگەر هەڵەی دیاریکراو هەبوو: بەبێ ناوبردنی ئەو هەڵەیە و بەبێ گووتنی وشەی شکێنەر، ئاراستەی ڕاست بکەرەوە.
- هەرگیز زیاتر لە 150 وشە نەبێت بۆ ئەوەی خوێندکار ماندوو نەبێت.
- کۆتایی وەڵامەکە بە پرسیارێکی ڕێبەریکەر تەواو بکە.
- یونیکۆدی مۆدێرن بۆ هاوکێشەکان بەکاربهێنە (وەک H₃O⁺، x²).

[OUTPUT FORMAT — JSON ONLY]
پێویستە وەڵامەکەت تەنها و تەنها بە فۆرماتی JSON بێت بەپێی ئەم شێوازە:
{
  "responseType": "EXPLANATION",
  "content": "دەقی وەڵام بە کوردی سۆرانی",
  "followUpQuestions": ["پرسیاری ١؟", "پرسیاری ٢؟", "پرسیاری ٣؟"],
  "hintsUsed": 0,
  "conceptsReferenced": ["${concept}"],
  "encouragement": "دەستخۆشییەکی گەرم بە کوردی"
}
`.trim();
  }

  /**
   * Template 2: ASSESS_ANSWER
   * Formative assessment grader evaluating student reasoning with redirection hints.
   */
  public static assessAnswer(params: AssessAnswerParams): string {
    const question = SafetyFilter.sanitizeUserInput(params.question);
    const correctAnswer = SafetyFilter.sanitizeUserInput(params.correctAnswer);
    const studentAnswer = SafetyFilter.sanitizeUserInput(params.studentAnswer);
    const responseTime = params.responseTimeSeconds !== undefined ? `${params.responseTimeSeconds} چرکە` : "دیارینەکراو";

    return `
[IDENTITY]
تۆ هەڵسەنگێنەری فێرکاریی زانایت.
وەشانی پرۆمپت: ${params.version || PROMPT_TEMPLATE_VERSION}

[QUESTION]
پرسیار: ${question}
وەڵامی دروست: ${correctAnswer}
ئاستی کەرتی بلووم: ${params.bloomsLevel}

[STUDENT ANSWER]
وەڵامی خوێندکار: ${studentAnswer}
کاتی وەڵامدان: ${responseTime}

[TASK]
١. ئایا وەڵامەکە دروستە؟ (true/false)
٢. ئەگەر شاش بوو، چی تێگەیشتنی شاشی هەیە بەبێ وشەی بریندارکەر؟
٣. چ خاڵێکی ئەرێنی لە بیرکردنەوەکەیدا هەیە؟
٤. بچووکترین ئاراستەکردنەوە بۆ ڕاستکردنەوەی هەنگاوەکە چییە؟

[OUTPUT FORMAT — JSON ONLY]
{
  "isCorrect": boolean,
  "partialCredit": 0.0,
  "misconceptionDetected": "string|null",
  "misconceptionType": "conceptual|procedural|factual|null",
  "positiveElement": "دەستخۆشی لە خاڵی باشی وەڵامەکە",
  "redirectionHint": "ئاراستەکردنەوە بە پرسیارێک",
  "bloomsAchieved": "${params.bloomsLevel}"
}
`.trim();
  }

  /**
   * Template 3: GENERATE_QUESTIONS
   * Professional item generator producing curriculum-grounded items targeting misconceptions.
   */
  public static generateQuestions(params: GenerateQuestionsParams): string {
    const concept = SafetyFilter.sanitizeUserInput(params.concept);
    const misconceptions = (params.activeMisconceptions || []).join("، ") || "هەڵە باوەکانی تاقیکردنەوەی وەزاری";

    return `
[IDENTITY]
تۆ دروستکەری پرسیاری پیشەیی زانایت.
وەشانی پرۆمپت: ${params.version || PROMPT_TEMPLATE_VERSION}

[PARAMETERS]
بابەت: ${concept}
پۆل: ${params.grade} — شاخە: ${params.stream}
ئاستی ئارزیاکردن: ${params.bloomsLevel}
ئاستی سەختی: ${params.difficulty.toFixed(2)} (0.0–1.0)
ژمارەی پرسیار: ${params.count}
جۆری پرسیار: ${params.questionType}
هەڵەی دیاریکراو: ${misconceptions}

[RULES]
- هەر پرسیارێک تاکەکەسانە و جیاواز بێت لە پرسیارەکانی تر.
- وەبەرگیری: ${misconceptions} بکە ئامانجی بژاردە نادروستەکان.
- بژاردەی شاش: هەڵە باوەکانی قوتابیان بێت، نەک بژاردەی بێمانا و هەڕەمەکی.
- بە زمانی فەرمی کوردی سۆرانی.

[OUTPUT FORMAT — JSON ONLY]
{
  "questions": [
    {
      "id": "uuid-1",
      "text": "دەقی پرسیار",
      "type": "${params.questionType}",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A) ...",
      "explanation": "شیکاری فێرکاری",
      "bloomsLevel": "${params.bloomsLevel}",
      "difficulty": ${params.difficulty},
      "targetMisconception": null,
      "estimatedTimeSeconds": 60
    }
  ]
}
`.trim();
  }

  /**
   * Template 4: SOCRATIC_HINT
   */
  public static socraticHint(params: SocraticHintParams): string {
    const personaBlock = buildPersonaPromptBlock();

    let hintDirective = "";
    if (params.hintLevel === 1) {
      hintDirective = `
ئاستی ڕێنمایی: ئاستی ١ (پرسیاری ڕێبەریکەر - Guiding Question)
- هەرگیز هیچ بەشێکی وەڵام یان هاوکێشەکە یەکسەر ئاشکرا مەکە.
- تەنها یەک پرسیاری سۆکراتیی ڕوون بکە دەربارەی ئەوەی کە یاسای بنەڕەتی چی دەڵێت.
`;
    } else if (params.hintLevel === 2) {
      hintDirective = `
ئاستی ڕێنمایی: ئاستی ٢ (نموونە و ئاماژەی تێگەیشتن - Conceptual Clue & Analogy)
- ئاماژەیەکی ڕوونتر بدە بە نموونەیەکی هاوشێوەی ژیانی ڕۆژانە.
`;
    } else if (params.hintLevel === 3) {
      hintDirective = `
ئاستی ڕێنمایی: ئاستی ٣ (شیکاری هەنگاوی یەکەم - Partial Step Breakdown)
- هەنگاوی یەکەمی هاوکێشەکە بە نیوەچڵی بۆ بنووسە.
`;
    } else {
      hintDirective = `
ئاستی ڕێنمایی: ئاستی ٤ (شیکاری تەواو و بەستنەوەی چەمک - Full Synthesis & Reveal)
- بە تەواوی و بە لۆجیکێکی زانستی شیکارەکەی هەنگاو بە هەنگاو بۆ ڕوون بکەرەوە.
`;
    }

    return `
${personaBlock}

[دۆخی فێرکاریی سۆکراتی (Socratic Scaffolding Engine)]
پرسیاری لەبەردەم قوتابی: "${SafetyFilter.sanitizeUserInput(params.problemText)}"
${params.studentAnswer ? `وەڵام یان سەرنجی پێشووی قوتابی: "${SafetyFilter.sanitizeUserInput(params.studentAnswer)}"` : ""}
${params.conceptName ? `چەمکی پەیوەندیدار: ${SafetyFilter.sanitizeUserInput(params.conceptName)}` : ""}
${params.previousHints && params.previousHints.length > 0 ? `ڕێنماییە پێشووەکانی دراون:\n${params.previousHints.map((h, i) => `${i + 1}. ${h}`).join("\n")}` : ""}

${hintDirective}

پێویستە بە زمانی کوردی سۆرانی دڵسۆزانە و بەبێ شکاندنی باوەڕبەخۆبوونی وەڵام بدەیتەوە.
`.trim();
  }

  /**
   * Template 5: PRACTICE_QUESTION
   */
  public static practiceQuestion(params: PracticeQuestionParams): string {
    return `
[ئەرکی بەرهەمهێنانی پرسیاری تاقیکردنەوەی فێرکاری]
بابەت: ${params.subject} | پۆل: پۆلی ${params.grade}
چەمک: "${SafetyFilter.sanitizeUserInput(params.conceptNameKu)}" (ناسنامە: ${params.conceptId})
ئاستی قورسی: ${params.difficulty}
ئاستی مەعریفی (Bloom's Level): ${params.cognitiveLevel || "APPLICATION"}
${params.curriculumExcerpt ? `دەقی فەرمیی پەڕتووک:\n"${params.curriculumExcerpt}"\n` : ""}

مەرجە بنەڕەتییەکان:
١. پرسیارەکە بە زمانی کوردی سۆرانی بێت بە فۆرماتی چوار-هەڵبژاردەیی (A, B, C, D).
٢. تەنها یەک هەڵبژاردەی تەواو ڕاست بێت.
٣. سێ هەڵبژاردەکەی تر (Distractors) با بەپێی هەڵە باوەکانی قوتابیان بن.
٤. ڕوونکردنەوەی فێرکاری کورت بۆ ئەوەی بۆچی وەڵامە ڕاستەکە دروستە.
`.trim();
  }

  /**
   * Template 6: MISCONCEPTION_REMEDIATION
   */
  public static misconceptionRemediation(params: MisconceptionRemediationParams): string {
    const personaBlock = buildPersonaPromptBlock();

    return `
${personaBlock}

[ئەرکی چارەسەرکردنی لێکتێنەگەیشتنی فێرکاری (Misconception Remediation)]
بابەت: ${params.subject} | پۆل: پۆلی ${params.grade}
چەمک: ${SafetyFilter.sanitizeUserInput(params.conceptNameKu)}
لێکتێنەگەیشتنی دیاریکراو: "${SafetyFilter.sanitizeUserInput(params.detectedMisconceptionNameKu)}"
وەڵام یان دەربڕینی ناتەواوی قوتابی: "${SafetyFilter.sanitizeUserInput(params.studentIncorrectResponse)}"

ڕێسای چارەسەری ئەرێنی:
- هەرگیز مەڵێ "ئەمە هەڵەیە" یان "وەڵامەکەت هەڵەیە".
- دەست پێبکە بە سەلماندنی هەوڵەکە: "زۆر باشە کە بەم جۆرە بیرت کردەوە، بەڵام با پێکەوە لایەنێکی تر تاقی بکەینەوە..."
- بە کورتی ڕاستییە زانستییەکە بسەلمێنە و داوای ڕاهێنانێکی کورت بکە.
`.trim();
  }

  /**
   * Template 7: FORMULA_EXPLANATION
   */
  public static formulaExplanation(params: FormulaExplanationParams): string {
    return `
[ئەرکی شیکردنەوەی قووڵی هاوکێشە و یاسای زانستی]
بابەت: ${params.subject} | پۆل: پۆلی ${params.grade}
ناوی یاساکە: ${SafetyFilter.sanitizeUserInput(params.formulaNameKu)}
هاوکێشەی سەرەکی: ${SafetyFilter.sanitizeUserInput(params.formulaSymbolic)}
${params.contextUsageKu ? `چوارچێوەی بەکارهێنان: ${params.contextUsageKu}` : ""}

پێکهاتەی داواکراو بۆ وەڵام:
١. [هاوکێشەی یونیکۆد]: نیشاندانی هاوکێشەکە بە فۆنتی گەورە و بە یونیکۆدی کوردی/ماتماتیکی.
٢. [خشتەی گۆڕاوەکان]: ڕوونکردنەوەی هەموو پیتەکان، یەکە پێوانەییە نێودەوڵەتییەکان (SI Units).
٣. [تێبینی تاقیکردنەوەی وەزاری]: خاڵە وردەکانی نمرەهێنەر لە تاقیکردنەوە فەرمییەکاندا.
`.trim();
  }

  /**
   * Template 8: EXAM_SUMMARY
   */
  public static examSummary(params: ExamSummaryParams): string {
    const pct = params.totalQuestions > 0 ? Math.round((params.correctCount / params.totalQuestions) * 100) : 0;

    return `
[ئەرکی داڕشتنی ڕاپۆرتی کورت و ڕێڕەوی داهاتوو]
بابەت: ${params.subject}
قوتابی: ${params.studentName || "قوتابی"}
نمرە: ${params.correctCount} لە ${params.totalQuestions} (${pct}%)
چەمکە داپۆشراوەکان: ${params.conceptsCovered.join("، ")}

داواکراو:
١. [دەستخۆشی و خاڵی بەهێز]: شاباش بۆ ئەو چەمکانەی لێهاتوویی تەواوی تێدا نیشانداوە.
٢. [دەستنیشانکردنی تەرکیز]: یەک تا دوو چەمک کە پێویستیان بە کەمێک بەهێزکردنەوەیە.
٣. [ڕێڕەوی هەنگاوی داهاتوو (٣ خاڵ)]: پلانی ٣ هەنگاوی بۆ بەشی چاتی زیرەک و تاقیگەی ڕاهێنان.
`.trim();
  }
}
