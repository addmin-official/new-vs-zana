import {
  CognitiveErrorCategory,
  CognitiveErrorOption,
  MetacognitiveReflectionRecord,
  ErrorDnaProfile
} from "./metacognitiveTypes.ts";

export const COGNITIVE_ERROR_OPTIONS: CognitiveErrorOption[] = [
  {
    key: "CARELESS_MISREADING",
    titleKu: "پەلەکردن و خوێندنەوەی ناتەواو",
    descriptionKu: "پرسیارەکەم بە تەواوی نەخوێندەوە یان سەرنجم نەدا لە وشە نەرێنییەکان (وەک: جگە لە، دروست نییە، هەموو ئەمانە).",
    emoji: "⚡",
    pedagogicalAdviceKu: "فێڵێکی بەکالۆریایە: لە هەموو پرسیارێکدا وشەی (جگە لە) یان (کامەیان هەڵەیە) بە بازنەیەک دەستنیشان بکە پێش هەڵبژاردن."
  },
  {
    key: "CONCEPTUAL_DEFICIT",
    titleKu: "تێنەگەیشتنی قووڵ لە چەمک و یاساکە",
    descriptionKu: "مانای بنەڕەتی یاساکەم بە جوانی لە یاد نەبوو یان دوو بابەتی لێکچووم بە هەڵە تێکەڵ کرد.",
    emoji: "🧩",
    pedagogicalAdviceKu: "پێویستە ئەم چەمکە لە ستۆدیۆی فاینمان یان مێزی سەرچاوەکان لەگەڵ زانا بە سادەیی دووبارە بخوێنیتەوە."
  },
  {
    key: "CALCULATION_SLIP",
    titleKu: "هەڵەی ژمێریاری و هەنگاوی ماتماتیکی",
    descriptionKu: "یاساکەم زانی، بەڵام لە گۆڕینی یەکەکان یان هێمای نێگەتیڤ یان کرداری لێکدان و دابەشکردندا هەڵەم کرد.",
    emoji: "🧮",
    pedagogicalAdviceKu: "هەمیشە پێش ناردنی وەڵام، بەراوردی قەبارەی ژمارەکە لەگەڵ لۆژیکی سروشت بکە (بۆ نموونە: pH ناتوانێت -٢٠ بێت)."
  },
  {
    key: "TIME_PANIC",
    titleKu: "دڵەڕاوکێ و فشاری کات",
    descriptionKu: "لەبەر ئەوەی کاتەکە دەڕۆیشت یان لە پرسیاری پێشووتر گیری خواردبوو، بە دڵەڕاوکێوە وەڵامم هەڵبژارد.",
    emoji: "⏳",
    pedagogicalAdviceKu: "یاسای پەروەردەیی: هەر پرسیارێک زیاتر لە ٢ خولەکی برد، نیشانەی تێپەڕبوونی لێبدە و بڕۆ بۆ پرسیاری ئاسان."
  }
];

const STORAGE_KEY = "zana_metacognitive_reflections";

export class MetacognitiveDiagnosisEngine {
  static getReflections(): MetacognitiveReflectionRecord[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static recordReflection(record: Omit<MetacognitiveReflectionRecord, "id" | "timestamp">): MetacognitiveReflectionRecord {
    const fullRecord: MetacognitiveReflectionRecord = {
      ...record,
      id: "meta-" + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };

    const current = this.getReflections();
    const updated = [fullRecord, ...current].slice(0, 50); // Keep last 50
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    return fullRecord;
  }

  static getProfile(): ErrorDnaProfile {
    const records = this.getReflections();
    const total = records.length;

    let careless = 0;
    let conceptual = 0;
    let calculation = 0;
    let timePanic = 0;

    records.forEach((r) => {
      if (r.category === "CARELESS_MISREADING") careless++;
      else if (r.category === "CONCEPTUAL_DEFICIT") conceptual++;
      else if (r.category === "CALCULATION_SLIP") calculation++;
      else if (r.category === "TIME_PANIC") timePanic++;
    });

    if (total === 0) {
      return {
        totalReflections: 0,
        carelessCount: 0,
        conceptualCount: 0,
        calculationCount: 0,
        timePanicCount: 0,
        dominantErrorType: null,
        dominantErrorPercent: 0,
        metaAdviceSummaryKu: "هێشتا هیچ تێبینییەکی مێتاکۆگنیتیڤ تۆمار نەکراوە. دوای ڕاهێنانەکان لێرە شیکاری دەروونی هەڵەکانت دەبینیت."
      };
    }

    const counts: Record<CognitiveErrorCategory, number> = {
      CARELESS_MISREADING: careless,
      CONCEPTUAL_DEFICIT: conceptual,
      CALCULATION_SLIP: calculation,
      TIME_PANIC: timePanic,
    };

    let dominantType: CognitiveErrorCategory = "CARELESS_MISREADING";
    let maxCount = -1;

    (Object.keys(counts) as CognitiveErrorCategory[]).forEach((key) => {
      if (counts[key] > maxCount) {
        maxCount = counts[key];
        dominantType = key;
      }
    });

    const dominantPercent = Math.round((maxCount / total) * 100);

    let advice = "";
    if (dominantType === "CARELESS_MISREADING") {
      advice = `لە ${dominantPercent}٪ی کاتەکاندا کێشەی تۆ تێنەگەیشتن نییە لە ماددەکان، بەڵکو نەخوێندنەوەی وشە کلیدییەکانە لە دەقی پرسیارەکاندا! ئەگەر تەنها کاتی پرسیارەکان خاو بکەیتەوە، نمرەکەت بە شێوەیەکی بەرچاو بەرز دەبێتەوە.`;
    } else if (dominantType === "CONCEPTUAL_DEFICIT") {
      advice = `لە ${dominantPercent}٪ی کاتەکاندا هەڵەکان پەیوەستن بە چەمکی سەرەکی. باشترە کاتی خوێندنت لەسەر بنەماکانی وەک ستۆدیۆی فاینمان خەرج بکەیت لەبری لەبەرکردنی ڕووت.`;
    } else if (dominantType === "CALCULATION_SLIP") {
      advice = `لە ${dominantPercent}٪ی کاتەکاندا لە ژمێریاری و گۆڕینی یەکەکاندا هەڵەت کردووە. پێداچوونەوە بە هاوکێشە ژمارەییەکان بکە.`;
    } else {
      advice = `لە ${dominantPercent}٪ی کاتەکاندا فشاری کات کێشەی بۆ دروست کردوویت. بەکارهێنانی هاوشێوەکاری هۆڵی تاقیکردنەوە یارمەتیت دەدات بۆ ئارامبوونەوە.`;
    }

    return {
      totalReflections: total,
      carelessCount: careless,
      conceptualCount: conceptual,
      calculationCount: calculation,
      timePanicCount: timePanic,
      dominantErrorType: dominantType,
      dominantErrorPercent: dominantPercent,
      metaAdviceSummaryKu: advice,
    };
  }
}
