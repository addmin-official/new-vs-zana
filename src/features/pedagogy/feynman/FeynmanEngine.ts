import {
  FeynmanConceptPrompt,
  JargonDetectionResult,
  ConceptualClarityScore,
} from "./feynmanTypes.ts";

export const FEYNMAN_CONCEPTS_CATALOG: FeynmanConceptPrompt[] = [
  {
    id: "henry-law-chem12",
    grade: "12",
    subject: "chemistry",
    titleKu: "یاسای هێنری بۆ تواوەیی گازەکان",
    chapterKu: "بەندی ٥: گیراوەکان و هاوسەنگی",
    standardDefinitionKu: "تواوەیی گازێک لە شلەیەکدا ڕاستەوانە دەگۆڕێت لەگەڵ پەستانی بەشیی گازەکە لەسەر شلەکە لە پلەی گەرمیی دیاریکراودا.",
    coreMechanismKu: "کاتێک پەستان زیاد دەبێت، گەردیلەکانی گاز زیاتر لێکتر نزیک دەبنەوە و بەر ڕووی شلەکە دەکەون، بەوەش ژمارەی زیاتری گەردیلە دەکەونە ناو شلەکە.",
    commonJargonList: ["پەستانی بەشی", "ڕاستەوانە", "هاوسەنگی داینامیکی", "خەستی مۆلاری"],
    analogyExamplesKu: ["قوتووی کۆلا پێش کردنەوەی و دوای کردنەوەی", "کیسی چیپس لە ناو فڕۆکە"],
    guidingQuestionsFromProtege: [
      "ببورە مامۆستا، بۆچی کاتێک سەری قوتووی پێپسی دەکەینەوە، لەپڕ بڵقەکان دێنە سەرەوە؟ گازەکە لە کوێ بوو؟",
      "ئەگەر پلەی گەرمی زیاد بکەم لەبری پەستان، ئایا گازەکە زیاتر دەتوێتەوە یان کەمتر؟ بۆچی؟",
      "دەتوانیت پێم بڵێیت چی ڕوودەدات بە گەردیلەکان کاتێک پەستان دەکەینە سەریان؟"
    ]
  },
  {
    id: "le-chatelier-chem12",
    grade: "12",
    subject: "chemistry",
    titleKu: "بنەمای لۆ شاتلیێ لە هاوسەنگی کیمیایی",
    chapterKu: "بەندی ٦: هاوسەنگی کیمیایی",
    standardDefinitionKu: "ئەگەر بارودۆخی سیستەمێکی هاوسەنگ تێکبدرێت، سیستەمەکە بەرەو ئاراستەیەک دەڕوات کە کاریگەریی ئەو گۆڕانکارییە کەمبکاتەوە.",
    coreMechanismKu: "سیستەم وەک تەرازوویەک کار دەکات؛ ئەگەر لایەکی قورس بکەیت، بۆ ڕاگرتنی خۆی ماددەکان دەگوێزێتەوە بۆ لایەکەی تر تا هاوسەنگی دروست ببێتەوە.",
    commonJargonList: ["هاوسەنگی دینامیکی", "لاریی کارلێک", "نەگۆڕی هاوسەنگی Keq", "هەڵگەڕاوە"],
    analogyExamplesKu: ["تەرازووی کێشان", "ژوورێکی قەرەباڵغ کە خەڵک لە دەرگایەکەوە دەچنە ژوورێکی ئارام"],
    guidingQuestionsFromProtege: [
      "مامۆستا، ئەگەر گەرمی زیاد بکەم لە کارلێکێکی گەرمیبەخش، بۆچی کارلێکەکە بەرەو دواوە دەگەڕێتەوە؟",
      "ئایا نەگۆڕی هاوسەنگی (Keq) دەگۆڕێت ئەگەر پەستان زیاد بکەین؟ چۆن ئەوە ڕوون دەکەیتەوە؟"
    ]
  },
  {
    id: "newton-third-law-phys12",
    grade: "12",
    subject: "physics",
    titleKu: "یاسای سێیەمی نیوتن (کردار و پەرچەکردار)",
    chapterKu: "بەندی ١: هێز و جووڵە",
    standardDefinitionKu: "بۆ هەر کردارێک، پەرچەکردارێکی یەکسان لە بڕدا و پێچەوانە لە ئاڕاستەدا بوونی هەیە.",
    coreMechanismKu: "هێز بە تەنیا بوونی نییە، هەمیشە بە جووت لە نێوان دوو تەن دروست دەبێت کاتێک کارلێک دەکەن.",
    commonJargonList: ["ئاڕاستەبڕ", "هاوکێشەی یەکسان", "تەنە پەیوەستەکان", "بڕی بزووتن"],
    analogyExamplesKu: ["پەیداکردنی ڕۆیشتن بە پێ لەسەر زەوی", "فڕینی باڵۆن کاتێک دەمی بەردەدەیت", "تەقاندنی گوللە و گەڕانەوەی تفەنگ"],
    guidingQuestionsFromProtege: [
      "مامۆستا، ئەگەر کردار و پەرچەکردار یەکسان و پێچەوانەن، بۆچی یەکتر سفر ناکەنەوە و جووڵە دروست دەبێت؟",
      "کاتێک من لەسەر زەوی دەڕۆم، زەوی چۆن هێز لەسەر پێیەکانم دروست دەکات؟"
    ]
  },
  {
    id: "calculus-derivative-math12",
    grade: "12",
    subject: "math",
    titleKu: "چەمکی داتاشراو وەک ڕێژەی گۆڕانی ساتەوەختی",
    chapterKu: "بەندی ٣: جیاکاری و داتاشراوەکان",
    standardDefinitionKu: "داتاشراو بریتییە لە لێژیی هێڵی لێکەوت بۆ چەماوەی نەخشەیەک لە خاڵێکی دیاریکراودا.",
    coreMechanismKu: "بریتییە لە زانینی خێرایی گۆڕان لە یەک چرکەی زۆر ورددا بە نزیککردنەوەی ماوەی کاتەکە بۆ سفر.",
    commonJargonList: ["لێژیی چەماوە", "سنووری لێکەوت", "دەلتا ئێکس", "ساتەوەختی"],
    analogyExamplesKu: ["سپیدۆمیتەری ئۆتۆمبێل لە چرکەیەکی دیاریکراودا بەرامبەر تێکڕای خێرایی سەفەرێک"],
    guidingQuestionsFromProtege: [
      "جیاوازی چییە لە نێوان تێکڕای خێرایی و داتاشراوی خێرایی؟",
      "بۆچی ناتوانین تەنها دابەشی سفری بکەین بەبێ بەکارهێنانی سنوور (Limit)؟"
    ]
  }
];

export class FeynmanEngine {
  /**
   * Scans the student's explanation for excessive textbook jargon without context.
   */
  static analyzeJargon(text: string, prompt: FeynmanConceptPrompt): JargonDetectionResult {
    const cleanText = text.toLowerCase();
    const detectedJargon: string[] = [];

    prompt.commonJargonList.forEach((jargon) => {
      if (cleanText.includes(jargon.toLowerCase())) {
        detectedJargon.push(jargon);
      }
    });

    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = Math.max(words.length, 1);
    const jargonRatio = Math.min(detectedJargon.length / Math.max(prompt.commonJargonList.length, 1), 1.0);

    let clarityAssessmentKu = "";
    if (detectedJargon.length >= 3 && wordCount < 25) {
      clarityAssessmentKu = "تۆ زۆربەی وشە فەرمییەکانی پەڕتووکت دووبارە کردەوە، بەڵام بێ ڕوونکردنەوەی ئەوەی کە ئەو وشانە لە ناواخندا مانایان چییە.";
    } else if (detectedJargon.length > 0 && wordCount >= 25) {
      clarityAssessmentKu = "هاوسەنگییەکی باش: وشە زانستییەکانت لەگەڵ ڕوونکردنەوەی فکریی خۆت بەکارهێناوە.";
    } else {
      clarityAssessmentKu = "نایابە! چەمکەکەت بە وشەی زۆر سادەی خۆت دەربڕیوە بەبێ ئەوەی پەنا بۆ لەبەرکردنی فەرمی ببەیت.";
    }

    return {
      detectedJargon,
      jargonRatio,
      clarityAssessmentKu,
    };
  }

  /**
   * Evaluates the logical depth and conceptual clarity of the student's explanation.
   */
  static evaluateClarity(
    explanation: string,
    prompt: FeynmanConceptPrompt,
    dialogueHistoryLength: number
  ): ConceptualClarityScore {
    const text = explanation.trim();
    const words = text.split(/\s+/).filter(Boolean);
    const jargonAnalysis = this.analyzeJargon(text, prompt);

    const logicalGaps: string[] = [];
    const strengths: string[] = [];

    // Check for causal connectors: چونکە، لەبەرئەوەی، کاتێک، دەبێتە هۆی، بۆیە
    const hasCausalConnectors = /چونکە|لەبەرئەوەی|کاتێک|دەبێتە هۆی|بۆیە|لە ئەنجامدا/.test(text);
    if (!hasCausalConnectors) {
      logicalGaps.push("پەیوەندی هۆکار و دەرئەنجام ڕوون نییە؛ باسی ئەوەت نەکردووە بۆچی ئەم گۆڕانکارییە دەبێتە هۆی ئەم دەرئەنجامە.");
    } else {
      strengths.push("بەکارهێنانی بەستەری هۆکار و دەرئەنجام (چونکە / دەبێتە هۆی).");
    }

    // Check for analogies or real-world example
    const hasAnalogy = /وەک|نموونە|وەکو|شێوەی|هاوشێوەی/.test(text);
    if (hasAnalogy) {
      strengths.push("هێنانەوەی نموونە یان چواندنێکی بەرجەستە بۆ سادەکردنەوەی بیرۆکەکە.");
    } else {
      logicalGaps.push("هیچ نموونەیەکی بەرجەستەی ژیانی ڕۆژانەت بۆ کەسی بەرامبەر نەهێناوەتەوە.");
    }

    // Check length and depth
    if (words.length < 15) {
      logicalGaps.push("ڕوونکردنەوەکەت زۆر کورتە و بۆشایی زۆری تێدایە بۆ فێرخوازێکی ساویلکە.");
    } else if (words.length >= 30) {
      strengths.push("ڕوونکردنەوەیەکی تێر و تەسەل بە درێژەی پێویست.");
    }

    // Base score calculation
    let baseScore = 40;
    if (words.length >= 20) baseScore += 20;
    if (words.length >= 40) baseScore += 10;
    if (hasCausalConnectors) baseScore += 15;
    if (hasAnalogy) baseScore += 15;

    // Deduct if pure memorized jargon dump
    if (jargonAnalysis.detectedJargon.length >= 3 && words.length < 25) {
      baseScore = Math.max(35, baseScore - 20);
    }

    const finalScore = Math.min(Math.max(baseScore, 20), 100);

    let clarityLevelKu: ConceptualClarityScore["clarityLevelKu"] = "سەرەتایی و لەبەرکراو";
    if (finalScore >= 80) {
      clarityLevelKu = "قووڵ و چەمکساز (ئاستی فاینمان)";
    } else if (finalScore >= 55) {
      clarityLevelKu = "مامناوەند بە ڕوونکردنەوەی بەشەکی";
    }

    // Pick next naive question from protégé
    const qIndex = dialogueHistoryLength % prompt.guidingQuestionsFromProtege.length;
    const nextQuestion = prompt.guidingQuestionsFromProtege[qIndex] || prompt.guidingQuestionsFromProtege[0];

    return {
      scorePercent: finalScore,
      clarityLevelKu,
      logicalGapsIdentified: logicalGaps,
      strengthsKu: strengths,
      nextQuestionFromProtégéKu: nextQuestion,
    };
  }
}
