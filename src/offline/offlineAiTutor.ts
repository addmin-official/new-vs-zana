/**
 * ZANA Platform - Cached AI Tutor (Offline Mode)
 * Serves pre-cached Gemini responses or curriculum-grounded offline fallbacks
 * when the student is disconnected from the internet.
 */

import {
  getCachedAiResponse,
  saveAiResponse,
  getCurriculumConcept,
  getQuestionsByConcept,
} from "./offlineStorage.ts";

export interface OfflineTutorResult {
  response: string;
  source: "cached_ai" | "curriculum_fallback" | "question_bank";
  isOffline: boolean;
  conceptId: string;
  socraticDisabled: boolean;
  notice: string;
}

export const OFFLINE_BANNER_NOTICE = "📡 ئێستا بەبێ ئینتەرنێت کار دەکەیت — وەڵامەکە لە داتابەیسی ناوخۆیی زاناوە ئامادە کراوە.";

/**
 * Retrieves offline AI tutor response with graceful degradation:
 * 1. Checks IndexedDB `aiResponses` for a pre-generated cached response
 * 2. If missed, constructs a clean educational summary from cached curriculum chunks
 * 3. Disables multi-turn Socratic prompts (which require live LLM generation)
 */
export async function getOfflineTutorResponse(
  conceptId: string,
  questionType: string = "explanation",
  masteryTier: string = "DEVELOPING",
  userQuestion?: string
): Promise<OfflineTutorResult> {
  // 1. Check local IndexedDB AI cache
  const cached = await getCachedAiResponse(conceptId, questionType, masteryTier);
  if (cached) {
    return {
      response: cached.response,
      source: "cached_ai",
      isOffline: true,
      conceptId,
      socraticDisabled: true,
      notice: OFFLINE_BANNER_NOTICE,
    };
  }

  // 2. Check for relevant questions in questionBank
  if (questionType === "practice" || questionType === "quiz") {
    const questions = await getQuestionsByConcept(conceptId);
    if (questions && questions.length > 0) {
      const q = questions[0];
      const formattedQ = [
        `📝 **پرسیاری ڕاهێنان (دۆخی ئۆفلاین)**`,
        ``,
        q.questionText,
        ``,
        ...q.options.map((opt, idx) => `${idx + 1}. ${opt}`),
        ``,
        `💡 **شیکار و وەڵامی دروست:** ${q.correctAnswer}`,
        q.explanation ? `📖 ${q.explanation}` : "",
      ].filter(Boolean).join("\n");

      return {
        response: formattedQ,
        source: "question_bank",
        isOffline: true,
        conceptId,
        socraticDisabled: true,
        notice: OFFLINE_BANNER_NOTICE,
      };
    }
  }

  // 3. Fallback to cached curriculum concept chunks
  const curriculum = await getCurriculumConcept(conceptId);
  if (curriculum) {
    const fallbackResponse = [
      `📚 **ڕوونکردنەوەی فەرمی چەمک (${curriculum.conceptId})**`,
      ``,
      curriculum.content || (curriculum.chunks ? curriculum.chunks.join("\n\n") : ""),
      ``,
      `📌 *ئەم دەقە بە شێوەی ئۆفلاین لە پەڕتووکی فەرمی پۆلی ${curriculum.grade} پارێزراوە.*`,
    ].join("\n");

    return {
      response: fallbackResponse,
      source: "curriculum_fallback",
      isOffline: true,
      conceptId,
      socraticDisabled: true,
      notice: OFFLINE_BANNER_NOTICE,
    };
  }

  // 4. Default graceful fallback when concept is not yet cached offline
  const safeFallback = [
    `📡 **تۆ ئێستا لە دۆخی ئۆفلاینیت**`,
    ``,
    userQuestion ? `پرسیارەکەت دەربارەی: "${userQuestion}" لە یادگە تۆمار کرا.` : "",
    `بۆ دەستکەوتنی وەڵامی وردی مامۆستا زانا لەگەڵ ژیریی دەستکرد، تکایە کاتێک پەیوەندی بە ئینتەرنێتەوە دەکەیتەوە دووبارە پرسیار بکەرەوە، یان پێشوەختە ئەم بابەتە لە ڕێکخستنەکان داونلۆد بکە بۆ بەکارهێنانی ئۆفلاین.`,
  ].filter(Boolean).join("\n\n");

  return {
    response: safeFallback,
    source: "curriculum_fallback",
    isOffline: true,
    conceptId,
    socraticDisabled: true,
    notice: OFFLINE_BANNER_NOTICE,
  };
}

/**
 * Pre-generates and caches common Kurdish tutor responses for a given concept:
 * - Concept explanation ("ئەم بابەتە ڕوونم بکەرەوە")
 * - Top 3 practice questions
 * - Formula / Key rules explanation
 */
export async function preGenerateAndCacheConcept(
  conceptId: string,
  conceptTitleKu: string,
  conceptSummaryKu: string,
  formulaKu?: string
): Promise<void> {
  const explanation = [
    `# ${conceptTitleKu}`,
    ``,
    `سڵاو قوتابیی ئازیز! من مامۆستا زانام. با پێکەوە فێری چەمکی **${conceptTitleKu}** ببین.`,
    ``,
    `### پوختەی چەمک:`,
    conceptSummaryKu,
    ``,
    formulaKu ? `### یاسای سەرەکی:\n\`\`\`\n${formulaKu}\n\`\`\`\n` : "",
    `💡 **ڕێنمایی بۆ تاقیکردنەوە:** هەمیشە گرنگی بدە بە تێگەیشتن لە چەمکە سەرەکییەکان پێش ئەوەی تەنها یاساکان لەبەر بکەیت.`,
  ].filter(Boolean).join("\n");

  // Cache for explanations across common tiers
  await saveAiResponse(conceptId, "explanation", "NOVICE", "ئەم بابەتە ڕوونم بکەرەوە", explanation);
  await saveAiResponse(conceptId, "explanation", "DEVELOPING", "ئەم بابەتە ڕوونم بکەرەوە", explanation);
  await saveAiResponse(conceptId, "explanation", "PROFICIENT", "ئەم بابەتە ڕوونم بکەرەوە", explanation);

  // Cache formula explanation if present
  if (formulaKu) {
    const formulaResponse = [
      `### یاسا و هاوکێشەی سەرەکی بۆ ${conceptTitleKu}`,
      ``,
      `\`\`\`\n${formulaKu}\n\`\`\``,
      ``,
      `ئەم یاسایە ڕاستەوخۆ لە پڕۆگرامی فەرمیی وەزارەتی پەروەردەدا بۆ شیکارکردنی پرسیارەکان بەکاردێت. لە یەکەکان (یەکەی پێوانە) دڵنیا بە پێش هەژمارکردن.`,
    ].join("\n");
    await saveAiResponse(conceptId, "formula", "DEVELOPING", "یاساکانی ئەم بابەتە", formulaResponse);
  }
}
