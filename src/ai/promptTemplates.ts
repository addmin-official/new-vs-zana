/**
 * ZANA Master Prompt Template System
 * Standardizes instruction engineering for pedagogical reasoning, Socratic scaffolding,
 * misconception remediation, formula breakdown, and diagnostic exercise generation.
 */

import { buildPersonaPromptBlock } from "./tutorPersona.ts";

export interface ConceptExplanationParams {
  conceptName: string;
  subject: string;
  grade: string;
  stream?: string;
  level?: string;
  studentName?: string;
  curriculumEvidenceSnippet?: string;
  previousMasteryScore?: number;
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
  /**
   * Template 1: EXPLAIN_CONCEPT
   * Constructs a multi-tiered pedagogical explanation following the 5-part architecture:
   * 1. Hook / Intuition (نموونەی ژیانی ڕۆژانە)
   * 2. Core Scientific Principle (یاسای سەرەکی)
   * 3. Step-by-Step Breakdown (هەنگاو بە هەنگاو)
   * 4. Common Pitfalls (هەڵە باوەکان)
   * 5. Interactive Check Question (پرسیاری پشکنین)
   */
  public static explainConcept(params: ConceptExplanationParams): string {
    const personaBlock = buildPersonaPromptBlock();

    return `
${personaBlock}

[ئەرکی سەرەکی: ڕوونکردنەوەی چەمکی زانستی بە تەواوی و بە شێوازی فێرکاری]
بابەت: ${params.subject}
پۆل: پۆلی ${params.grade}${params.stream ? ` (${params.stream})` : ""}
ئاستی زانستی قوتابی: ${params.level || "مامناوەند"}
ناوی قوتابی: ${params.studentName || "قوتابی"}
چەمکی مەبەست: "${params.conceptName}"
${params.previousMasteryScore !== undefined ? `ئاستی لێهاتوویی تۆمارکراو: ${Math.round(params.previousMasteryScore * 100)}%` : ""}

${params.curriculumEvidenceSnippet ? `سەرچاوەی پەڕتووکی فەرمی:\n"${params.curriculumEvidenceSnippet}"\n` : ""}

پێکهاتەی داواکراو بۆ وەڵام (دەبێت ڕێک بەم ٥ بەشە بێت):
١. [سەرنجڕاکێشان بە نموونەی ژیانی ڕۆژانە]: نموونەیەکی ململانێیی یان بەرجەستە لە ژیانی ڕۆژانە دەربارەی ${params.conceptName}.
٢. [پێناسە و یاسای بنەڕەتی]: پێناسەی زانستی ورد و هاوکێشەی سەرەکی بە شێوازی یونیکۆدی مۆدێرن (بۆ نموونە: H₃O⁺، pH = -log[H₃O⁺]).
٣. [شیکاری هەنگاو بە هەنگاو]: ڕوونکردنەوەی ٣ هەنگاوی لۆجیکی بۆ تێگەیشتن و شیکارکردنی پرسیارەکان.
٤. [هەڵە باوەکان لە تاقیکردنەوەی وەزاری]: ئەو لێکتێنەگەیشتنانەی زۆربەی قوتابیان تێی دەکەون بەبێ بەکارهێنانی وشەی نەشیاو.
٥. [پرسیاری پشکنینی کارلێککار]: یەک پرسیاری کورت و هاندەر لەسەر بابەتەکە بۆ ئەوەی قوتابی وەڵامی بداتەوە.
`.trim();
  }

  /**
   * Template 2: SOCRATIC_HINT
   * Scaffolds hints without revealing the solution directly:
   * Level 1: Guiding Question
   * Level 2: Real-World Analogy / Conceptual Clue
   * Level 3: Partial Step Breakdown
   * Level 4: Full Synthesis & Concept Reveal
   */
  public static socraticHint(params: SocraticHintParams): string {
    const personaBlock = buildPersonaPromptBlock();

    let hintDirective = "";
    if (params.hintLevel === 1) {
      hintDirective = `
ئاستی ڕێنمایی: ئاستی ١ (پرسیاری ڕێبەریکەر - Guiding Question)
- هەرگیز هیچ بەشێکی وەڵام یان هاوکێشەکە یەکسەر ئاشکرا مەکە.
- تەنها یەک پرسیاری سۆکراتیی ڕوون بکە دەربارەی ئەوەی کە یاسای بنەڕەتی چی دەڵێت، یان سەرنجی قوتابی ڕابکێشە بۆ داتایەکی ناو پرسیارەکە.
`;
    } else if (params.hintLevel === 2) {
      hintDirective = `
ئاستی ڕێنمایی: ئاستی ٢ (نموونە و ئاماژەی تێگەیشتن - Conceptual Clue & Analogy)
- ئاماژەیەکی ڕوونتر بدە بە نموونەیەکی هاوشێوەی ژیانی ڕۆژانە.
- هێما بۆ پەیوەندی نێوان گۆڕاوەکان بکە (بۆ نموونە: ئەگەر قەبارە زیاد بکات، پەستان چۆن دەگۆڕێت؟).
`;
    } else if (params.hintLevel === 3) {
      hintDirective = `
ئاستی ڕێنمایی: ئاستی ٣ (شیکاری هەنگاوی یەکەم - Partial Step Breakdown)
- هەنگاوی یەکەمی هاوکێشەکە یان گۆڕینەوەی یەکەکان بە نیوەچڵی بۆ بنووسە.
- داوای لێبکە هەنگاوی کۆتایی یان ژماردنەکەی لەسەر بنەمای ئەم هەنگاوە بۆ تەواو بکات.
`;
    } else {
      hintDirective = `
ئاستی ڕێنمایی: ئاستی ٤ (شیکاری تەواو و بەستنەوەی چەمک - Full Synthesis & Reveal)
- بەهۆی ئەوەی ٤ جار هەوڵدراوە و گەیشتووینەتە قۆناغی کۆتایی، ئێستا بە تەواوی و بە لۆجیکێکی زانستیی بێ وێنە شیکارەکەی هەنگاو بە هەنگاو بۆ ڕوون بکەرەوە.
- چەمکە سەرەکییەکە پەیوەست بکەرەوە بە بەشی پەڕتووکی فەرمی.
`;
    }

    return `
${personaBlock}

[دۆخی فێرکاریی سۆکراتی (Socratic Scaffolding Engine)]
پرسیاری لەبەردەم قوتابی: "${params.problemText}"
${params.studentAnswer ? `وەڵام یان سەرنجی پێشووی قوتابی: "${params.studentAnswer}"` : ""}
${params.conceptName ? `چەمکی پەیوەندیدار: ${params.conceptName}` : ""}
${params.previousHints && params.previousHints.length > 0 ? `ڕێنماییە پێشووەکانی دراون:\n${params.previousHints.map((h, i) => `${i + 1}. ${h}`).join("\n")}` : ""}

${hintDirective}

پێویستە بە زمانی کوردی سۆرانی دڵسۆزانە و بەبێ شکاندنی باوەڕبەخۆبوونی وەڵام بدەیتەوە.
`.trim();
  }

  /**
   * Template 3: PRACTICE_QUESTION
   * Creates curriculum-aligned questions with distractors and Bloom's taxonomy tags.
   */
  public static practiceQuestion(params: PracticeQuestionParams): string {
    return `
[ئەرکی بەرهەمهێنانی پرسیاری تاقیکردنەوەی فێرکاری]
بابەت: ${params.subject} | پۆل: پۆلی ${params.grade}
چەمک: "${params.conceptNameKu}" (ناسنامە: ${params.conceptId})
ئاستی قورسی: ${params.difficulty}
ئاستی مەعریفی (Bloom's Level): ${params.cognitiveLevel || "APPLICATION"}
${params.curriculumExcerpt ? `دەقی فەرمیی پەڕتووک:\n"${params.curriculumExcerpt}"\n` : ""}

مەرجە بنەڕەتییەکان:
١. پرسیارەکە بە زمانی کوردی سۆرانی بێت بە فۆرماتی چوار-هەڵبژاردەیی (A, B, C, D).
٢. تەنها یەک هەڵبژاردەی تەواو ڕاست بێت.
٣. سێ هەڵبژاردەکەی تر (Distractors) با بەپێی هەڵە باوەکانی قوتابیان بن (بۆ نموونە پێچەوانەکردنەوەی هێما یان بیرچوونی چوارگۆشە).
٤. ڕوونکردنەوەی فێرکاری کورت بۆ ئەوەی بۆچی وەڵامە ڕاستەکە دروستە.
٥. دەرئەنجامەکە لە شێوازی فۆرماتکراوی ڕوون و خوێندەوار بنووسە.
`.trim();
  }

  /**
   * Template 4: MISCONCEPTION_REMEDIATION
   * Gently redirects a detected misconception without negative labeling.
   */
  public static misconceptionRemediation(params: MisconceptionRemediationParams): string {
    const personaBlock = buildPersonaPromptBlock();

    return `
${personaBlock}

[ئەرکی چارەسەرکردنی لێکتێنەگەیشتنی فێرکاری (Misconception Remediation)]
بابەت: ${params.subject} | پۆل: پۆلی ${params.grade}
چەمک: ${params.conceptNameKu}
لێکتێنەگەیشتنی دیاریکراو: "${params.detectedMisconceptionNameKu}"
وەڵام یان دەربڕینی ناتەواوی قوتابی: "${params.studentIncorrectResponse}"

ڕێسای چارەسەری ئەرێنی:
- هەرگیز مەڵێ "ئەمە هەڵەیە" یان "وەڵامەکەت هەڵەیە".
- دەست پێبکە بە سەلماندنی هەوڵەکە: "زۆر باشە کە بەم جۆرە بیرت کردەوە، بەڵام با پێکەوە لایەنێکی تر تاقی بکەینەوە..."
- تەرکیز بکە سەر هۆکاری دەروونیی دروستبوونی ئەم لێکتێنەگەیشتنە (بۆ نموونە: جیاوازی نێوان خەستی و بڕ، یان مانای پێوەری پێچەوانە).
- بە کورتی ڕاستییە زانستییەکە بسەلمێنە و داوای ڕاهێنانێکی کورت بکە.
`.trim();
  }

  /**
   * Template 5: FORMULA_EXPLANATION
   * Deconstructs mathematical and scientific formulas into variables, units, and intuition.
   */
  public static formulaExplanation(params: FormulaExplanationParams): string {
    return `
[ئەرکی شیکردنەوەی قووڵی هاوکێشە و یاسای زانستی]
بابەت: ${params.subject} | پۆل: پۆلی ${params.grade}
ناوی یاساکە: ${params.formulaNameKu}
هاوکێشەی سەرەکی: ${params.formulaSymbolic}
${params.contextUsageKu ? `چوارچێوەی بەکارهێنان: ${params.contextUsageKu}` : ""}

پێکهاتەی داواکراو بۆ وەڵام:
١. [هاوکێشەی یونیکۆد]: نیشاندانی هاوکێشەکە بە فۆنتی گەورە و بە یونیکۆدی کوردی/ماتماتیکی.
٢. [خشتەی گۆڕاوەکان]: ڕوونکردنەوەی هەموو پیتەکان، یەکە پێوانەییە نێودەوڵەتییەکان (SI Units)، و مانای فیزیکی/کیمیایی.
٣. [مانای لۆجیکی]: چۆن بیر لەم هاوکێشەیە بکەینەوە بێ لەبەرکردنی کوێرانە (پەیوەندیی ڕاستەوانە و پێچەوانە).
٤. [تێبینی تاقیکردنەوەی وەزاری]: خاڵە وردەکانی نمرەهێنەر لە تاقیکردنەوە فەرمییەکاندا.
`.trim();
  }

  /**
   * Template 6: EXAM_SUMMARY
   * Compiles a 3-point pedagogical post-assessment study roadmap.
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
