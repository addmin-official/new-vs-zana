import { SimulationConfig } from "./labTypes.ts";

export const TITRATION_CONFIG: SimulationConfig = {
  labId: "titration-ph",
  subject: "chemistry",
  grade: "12",
  titleKu: "تاقیکردنەوەی پێوانەکاری ترش و تفت (تیتراسیۆن) و پێوەری pH",
  descriptionKu: "سیمولەیشنی کارلێکی بێلایەنکردنی ترشی بەهێزی هایدرۆکلۆریک (HCl) لەگەڵ تفتی بەهێزی سۆدیۆم هایدرۆکساید (NaOH) بە هەستەوەری فینۆڵفیشالین.",
  objectiveKu: "دۆزینەوەی خاڵی هاوتایی (Equivalence Point) کە تێیدا بڕی ترش و تفت یەکسان دەبن و pH دەگاتە 7.0.",
  variables: [
    { name: "volumeAdded", nameKu: "قەبارەی تفتی زیادکراو (V_b)", unit: "mL", range: [0, 50], default: 0, step: 0.5 },
    { name: "baseConcentration", nameKu: "خەستی تفتی NaOH", unit: "M", range: [0.05, 0.5], default: 0.1, step: 0.05 },
    { name: "acidConcentration", nameKu: "خەستی ترشی HCl", unit: "M", range: [0.05, 0.5], default: 0.1, step: 0.05 },
  ],
  expectedOutcome: 7.0, // Equivalence pH
  toleranceRange: 0.4,
  maxAttempts: 3,
  unitKu: "pH",
  outcomeNameKu: "پێوەری ترشێتی (pH)",
  guideStepsKu: [
    { titleKu: "هەنگاوی ١: ئامادەکردنی تاقیگە", instructionKu: "بڕی ترش (25 mL) لەناو گلاسدا ئامادەیە. دڵنیابە لە خەستی ترش و تفت لە لیستی گۆڕاوەکاندا." },
    { titleKu: "هەنگاوی ٢: دەستپێکردنی تیتراسیۆن", instructionKu: "دوگمەی 'دەستپێکردن' یان 'دڵۆپاندن' دابگرە تا تفت دەست بە چۆڕان بکات." },
    { titleKu: "هەنگاوی ٣: چاودێریکردنی ڕەنگ و گۆڕانی pH", instructionKu: "بە چڕی چاودێری ڕەنگی هەستەوەر بکە. کاتێک ڕەنگ گۆڕا بۆ پەمەیی کاڵ، لە خاڵی بێلایەنی نزیک بوویتەوە." },
    { titleKu: "هەنگاوی ٤: پشکنین و دەرئەنجام", instructionKu: "دوگمەی 'پشکنین و سەلماندن' دابگرە بۆ هەڵسەنگاندنی ئاستی هاوتایی و دروستکردنی ڕاپۆرتی زانستی." },
  ],
};

export const CIRCULAR_CONFIG: SimulationConfig = {
  labId: "physics-centripetal",
  subject: "physics",
  grade: "12",
  titleKu: "سیمولەیشنی بزووتنی خولاو و تاودانی چەقەهێز",
  descriptionKu: "تاقیکردنەوەی جووڵەی تەنێک بە خێرایی جێگیر لەسەر ڕێڕەوی بازنەیی و چاودێریکردنی ڤێکتەرەکانی خێرایی (v) و تاودانی چەقەهێز (a_c).",
  objectiveKu: "دۆزینەوەی تاودانی چەقەهێز کاتێک نیوەتیرە r = 2.0 m و خێرایی v = 6.0 m/s بێت بەپێی یاسای a_c = v² / r (ئەنجام: 18.0 m/s²).",
  variables: [
    { name: "orbitRadius", nameKu: "نیوەتیرەی خولانەوە (r)", unit: "m", range: [1.0, 10.0], default: 2.0, step: 0.5 },
    { name: "tangentialSpeed", nameKu: "خێرایی لێکەوت (v)", unit: "m/s", range: [1.0, 20.0], default: 6.0, step: 0.5 },
    { name: "bodyMass", nameKu: "بارستەی تەن (m)", unit: "kg", range: [0.5, 5.0], default: 1.5, step: 0.5 },
  ],
  expectedOutcome: 18.0, // Expected centripetal acceleration ac = v^2 / r = 36 / 2 = 18 m/s^2
  toleranceRange: 1.0,
  maxAttempts: 3,
  unitKu: "m/s²",
  outcomeNameKu: "تاودانی چەقەهێز (a_c)",
  guideStepsKu: [
    { titleKu: "هەنگاوی ١: دەستنیشانکردنی نیوەتیرە و خێرایی", instructionKu: "نیوەتیرە بخەرە سەر 2.0 m و خێرایی لێکەوت بخەرە سەر 6.0 m/s لە خشتەی کۆنتڕۆڵدا." },
    { titleKu: "هەنگاوی ٢: لێدان و خولانەوە", instructionKu: "دوگمەی 'لێدان' دابگرە تا جووڵەی خولاو دەست پێ بکات." },
    { titleKu: "هەنگاوی ٣: شیکاری ڤێکتەرەکان", instructionKu: "سەیری ئاڕاستەی ڤێکتەری خێرایی لێکەوت (شین) و تاودانی چەقەهێز (سوور) بکە کە بەردەوام ڕووەو چەقە." },
    { titleKu: "هەنگاوی ٤: سەلماندنی تاودان", instructionKu: "دوگمەی 'پشکنین و سەلماندن' دابگرە بۆ پشکنینی هاوکێشەی a_c = v² / r." },
  ],
};

export const CIRCUIT_CONFIG: SimulationConfig = {
  labId: "physics-circuits",
  subject: "physics",
  grade: "12",
  titleKu: "یاسای ئۆم و سوڕی کارەبایی",
  descriptionKu: "تاقیکردنەوەی پەیوەندی نێوان جیاوازی پۆتانسێل (V)، بەرگری کارەبایی (R)، و تەزووی کارەبا (I) بەپێی یاسای I = V / R.",
  objectiveKu: "دۆزینەوەی تەزووی کارەبا کاتێک ڤۆڵتیە V = 12.0 V و بەرگری R = 24.0 Ω بێت (ئەنجامی چاوەڕوانکراو: 0.50 A).",
  variables: [
    { name: "voltage", nameKu: "جیاوازی پۆتانسێل (V)", unit: "V", range: [1, 24], default: 12, step: 1 },
    { name: "resistance", nameKu: "بەرگری کارەبایی (R)", unit: "Ω", range: [2, 60], default: 24, step: 1 },
  ],
  expectedOutcome: 0.50, // I = V / R = 12 / 24 = 0.50 A
  toleranceRange: 0.05,
  maxAttempts: 3,
  unitKu: "A",
  outcomeNameKu: "تەزووی کارەبا (I)",
  guideStepsKu: [
    { titleKu: "هەنگاوی ١: دەستنیشانکردنی ڤۆڵتیە و بەرگری", instructionKu: "ڤۆڵتیە بخەرە سەر 12 V و بەرگری بخەرە سەر 24 Ω لە خشتەی گۆڕاوەکاندا." },
    { titleKu: "هەنگاوی ٢: داخستنی کلیل (Switch)", instructionKu: "کلیلی سووڕەکە دابخە بۆ ئەوەی کارەبا بە نێو بازنەکەدا بڕوات و گڵۆپەکە هەڵبکات." },
    { titleKu: "هەنگاوی ٣: چاودێری ئامپیرمەتر و توانای کارەبا", instructionKu: "سەیری ئامپیرمەتر (تەزوو) و ڤۆڵتمەتر بکە و یاسای P = V · I بپشکنە." },
    { titleKu: "هەنگاوی ٤: سەلماندنی تەزووی کارەبا", instructionKu: "دوگمەی 'پشکنین و سەلماندن' دابگرە بۆ بەراوردکردنی ئەنجام بە یاسای ئۆم." },
  ],
};
