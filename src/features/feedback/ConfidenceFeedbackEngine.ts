/**
 * ZANA Confidence Builder Feedback Engine
 *
 * Designed to foster a growth mindset in students by:
 * 1. Affirming and explaining WHY correct answers are scientifically sound
 * 2. Treating errors with zero discouragement, diagnosing misconceptions, and providing step-by-step guidance
 * 3. Rewarding effort, reasoning steps, and offering targeted ministerial exam tips
 */

export interface ConfidenceFeedback {
  status: "correct" | "needs_guidance" | "partial";
  headlineKu: string;
  subHeadlineKu: string;
  scientificExplanationKu: string;
  reinforcementConceptKu?: string;
  misconceptionDiagnosisKu?: string;
  remediationStepsKu?: string[];
  ministerialTipKu?: string;
  examTrapAlertKu?: string;
  growthMindsetNoticeKu?: string;
  encouragementQuoteKu: string;
  confidenceScoreDelta: number; // +10 to +30 for correct, +5 to +10 for effort on retry
  confidenceLevel?: "building" | "rising" | "solid" | "mastery";
  relatedFormulaKu?: string;
  userAnswer?: string;
  expectedAnswer?: string;
}

export interface FeedbackEvaluationInput {
  isCorrect: boolean;
  userAnswer: string;
  expectedAnswer: string;
  subject: string;
  topic: string;
  stepTitle?: string;
  explanation?: string;
  commonMisconception?: string;
  hint?: string;
  attemptCount?: number;
  streak?: number;
  formula?: string;
  questionType?: "mcq" | "step" | "matching" | "ordering" | "true_false" | "short_answer" | "numeric";
}

const ENCOURAGING_CORRECT_QUOTES = [
  "ئافەرم! ئەمە دەریدەخات کە تێگەیشتنێکی قووڵت بۆ بابەتەکە هەیە.",
  "دەستخۆش! بە لۆژیکێکی زانستیی و هەنگاو بە هەنگاو گەیشتیتە وەڵام.",
  "سەرکەوتنێکی نایابە! بیرکردنەوەی شیکارییانەت زۆر بەرچاوە.",
  "هەنگاوێکی تر بەرەو نمرەی بەرزی تاقیکردنەوەی وەزاری چوویتە پێشەوە.",
  "نایابە! کاتێک یاساکان بە وردی جێبەجێ دەکەیت، ئەنجامەکان هەمیشە دەدرەوشێنەوە.",
  "شیکارێکی دروست و پوخت! نیشانەی ئامادەییەکی پۆڵایینە بۆ تاقیکردنەوە.",
];

const ENCOURAGING_RETRY_QUOTES = [
  "هەڵەکردن بەشێکی سەرەکییە لە فێربوونی ڕاستەقینە؛ با بزانین گرێکوێرەکە لە کوێیە 💡",
  "دەستپێکێکی باشت کردووە! بە ڕێکخستنی ئەم هەنگاوە دەگەیتە وەڵامی دروست.",
  "کۆڵمەدە؛ هەموو زانایەکی گەورە بە تاقیکردنەوە و شیکار فێر بووە.",
  "زۆر نزیکیت! با لەم گۆشەنیگایەوە سەیری هاوکێشەکە بکەین.",
  "مێشکت ئێستا لە حاڵەتی دروستکردنی پەیوەندییە دەمارییە نوێیەکانە، پێکەوە شیکاری دەکەین.",
  "هیچ زانستێک بێ تاقیکردنەوە تەواو نابێت؛ ئەم هەڵەیە کلیلی تێگەیشتنی تەواوە.",
];

const GROWTH_MINDSET_NOTICES = [
  "زانستی دەمار دەیسەلمێنێت کە کاتێک هەڵە دەکەیت و شیکاری هەنگاوەکانی دەکەیت، مێشکت زیاتر بەهێز دەبێت.",
  "نمرەی بەرز لە وەزاری لە بەردەوامی و تێگەیشتن لە هەڵە بچووکەکانەوە دروست دەبێت.",
  "هەموو پرسیارێکی سەخت دەرفەتێکە بۆ بنیاتنانی متمانەیەکی پۆڵایین.",
  "کۆڵنەدان لە شیکاری هەنگاو بە هەنگاو، سیفەتی هەموو قوتابییەکی یەکەمە.",
];

export class ConfidenceFeedbackEngine {
  /**
   * Evaluates a response and returns confidence-building feedback
   */
  public static generateFeedback(input: FeedbackEvaluationInput): ConfidenceFeedback {
    const attempts = input.attemptCount || 1;
    const streak = input.streak || 0;
    const randomCorrectQuote = ENCOURAGING_CORRECT_QUOTES[Math.floor(Math.random() * ENCOURAGING_CORRECT_QUOTES.length)];
    const randomRetryQuote = ENCOURAGING_RETRY_QUOTES[Math.floor(Math.random() * ENCOURAGING_RETRY_QUOTES.length)];
    const randomMindsetNotice = GROWTH_MINDSET_NOTICES[Math.floor(Math.random() * GROWTH_MINDSET_NOTICES.length)];

    // Clean answers for display comparison
    const cleanUser = (input.userAnswer || "").trim();
    const cleanExpected = (input.expectedAnswer || "").trim();

    if (input.isCorrect) {
      let confidenceLevel: "rising" | "solid" | "mastery" = "rising";
      let baseDelta = 20;

      if (streak >= 3) {
        confidenceLevel = "mastery";
        baseDelta = 30;
      } else if (attempts === 1) {
        confidenceLevel = "solid";
        baseDelta = 25;
      } else {
        baseDelta = 15;
      }

      const headline = streak >= 3
        ? `ئاگرینە! زنجیرەی سەرکەوتنت بەردەوامە (${streak} وەڵامی دروست) 🔥`
        : attempts === 1
        ? "پیرۆزە! وەڵامەکەت بە تەواوی دروست و زانستییە 🌟"
        : "ئافەرم! لە هەوڵی دووەمدا بە سەرکەوتوویی شیکارت کرد 👏";

      return {
        status: "correct",
        headlineKu: headline,
        subHeadlineKu: `تێگەیشتنێکی بەهێز لەسەر بنەمای یاساکانی ${input.topic || input.subject}`,
        scientificExplanationKu: input.explanation || `وەڵامی «${cleanExpected || cleanUser}» تەواو لەگەڵ یاسا و بنەماکانی ${input.topic || input.subject} دەگونجێت و هەموو مەرجە زانستییەکانی تێدایە.`,
        reinforcementConceptKu: `چەمکی بەهێزکراو: بنەما سەرەکییەکانی ${input.topic || input.subject}`,
        ministerialTipKu: `سەرنجی تاقیکردنەوەی وەزاری: لە تاقیکردنەوەکانی پۆلی ١٢دا، نووسینی یەکەکان و پاراستنی هاوسەنگیی لایەنەکان خاڵی یەکلاکەرەوەن بۆ دەستەبەرکردنی نمرەی تەواو لەم بەشەدا.`,
        examTrapAlertKu: `تەڵەی باوی وەزاری: هەندێکجار پرسیاری هاوشێوە بە گۆڕینی یەک نیشانە (+ / -) یان گۆڕینی ئاراستەی هاوکێشە دادەنرێت؛ وریا بە هەمیشە وەک ئێستا بە وردی بیخوێنیتەوە.`,
        growthMindsetNoticeKu: randomMindsetNotice,
        encouragementQuoteKu: randomCorrectQuote,
        confidenceScoreDelta: baseDelta,
        confidenceLevel,
        relatedFormulaKu: input.formula,
        userAnswer: cleanUser,
        expectedAnswer: cleanExpected,
      };
    }

    // When answer needs guidance (Growth-Mindset Error Diagnosis):
    let diagnosis = input.commonMisconception;
    if (!diagnosis) {
      if (!cleanUser) {
        diagnosis = "وەڵامەکە بە بەتاڵی جێهێڵدراوە. گرنگە لە کاتی تاقیکردنەوەدا ڕانەوەستیت و بە بیرهێنانەوەی یاسا سەرەکییەکان دەست بە شیکار بکەیت.";
      } else if (cleanUser.toLowerCase() === cleanExpected.toLowerCase()) {
        diagnosis = `وەڵامەکەت زۆر نزیک بوو، بەڵام جیاوازییەکی بچووک لە یەکە یان شێوازی دەربڕینەکەدا هەیە.`;
      } else {
        diagnosis = `وەڵامی تۆ «${cleanUser}» بوو، لە کاتێکدا وەڵامی چاوەڕوانکراو «${cleanExpected}» بوو. لەم جۆرە پرسیارانەدا زۆرجار هەڵە لە هاوسەنگکردن یان جیاکردنەوەی دراوەکان لە داواکراوەکاندا ڕوودەدات.`;
      }
    }

    const remediation: string[] = [];
    if (input.hint) {
      remediation.push(`سەرەداوی یارمەتیدەر: ${input.hint}`);
    }
    remediation.push(`هەنگاوی ١: دراوەکان (Given) و داواکراوەکان (Required) بە هێمنی لە چەپ یان ڕاست دەستنیشان بکە.`);
    remediation.push(`هەنگاوی ٢: یاسای بنەڕەتیی ${input.topic || input.subject} بەبێ گۆڕانکاری بنووسە.`);
    remediation.push(`هەنگاوی ٣: ژمارەکان لە جێگەی خۆیان دابنێ و لێدەرکردن یان دابەشکردنەکە ئەنجام بدە تاوەکو بگەیتە «${cleanExpected}».`);

    return {
      status: "needs_guidance",
      headlineKu: "نزیک بوویتەوە! با پێکەوە هەنگاوەکانی ڕوون بکەینەوە 💡",
      subHeadlineKu: "ڕێڕەوی ڕوونکردنەوە و چاککردنی هەنگاو بە هەنگاو (بێ کەمکردنەوەی خاڵ)",
      scientificExplanationKu: input.explanation || `بۆ بەدەستهێنانی وەڵامی دروست لە بابەتی ${input.topic || input.subject}، پێویستە ڕەچاوی هەنگاوە بنەڕەتییەکان و لۆژیکی یاساکە بکەین.`,
      misconceptionDiagnosisKu: diagnosis,
      remediationStepsKu: remediation,
      ministerialTipKu: `ڕێنمایی زانا: لە تاقیکردنەوەی وەزارەتدا کاتێک ڕووبەڕووی ئەم پرسیارە دەبیتەوە، پێش وەڵامدانەوە سەرەتا یەکەکان هاوتا بکە تاوەکو تووشی هەڵەی ژمارەیی نەبیت.`,
      examTrapAlertKu: `ئاگاداری: تەڵەی ئەم پرسیارە پەیوەستە بە لێکتێنەگەیشتن لە نێوان چەمکە سەرەکییەکان. بە وردبوونەوە لە یاساکە لەم تەڵەیە ڕزگارت دەبێت.`,
      growthMindsetNoticeKu: randomMindsetNotice,
      encouragementQuoteKu: randomRetryQuote,
      confidenceScoreDelta: 8, // Reward for the courage to attempt!
      confidenceLevel: "building",
      relatedFormulaKu: input.formula,
      userAnswer: cleanUser,
      expectedAnswer: cleanExpected,
    };
  }
}
