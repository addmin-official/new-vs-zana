import {
  FeynmanConcept,
  MetacognitiveQuestion,
  LeitnerItem,
  DialecticDebateTopic,
  SomaQuestion
} from "./pedagogyTypes.ts";

// 1. Initial Feynman Concepts Catalog for Kurdistan Grades 9-12
export const INITIAL_FEYNMAN_CONCEPTS: FeynmanConcept[] = [
  {
    id: "feynman-chem12-henry",
    grade: "12",
    subject: "کیمیا",
    title: "یاسای هێنری و توانەوەی گاز لە شلەدا",
    prompt: "یاسای هێنری بە سادەیی بۆ هاوڕێیەکت ڕوون بکەرەوە کە هیچ لە کیمیا نازانێت؛ بۆچی کاتێک سەری قوتییەکی سۆدا دەکرێتەوە دەنگی 'پسسس' دێت و بڵقی گاز دەردەچێت؟",
    corePrinciples: ["پەستان", "توانەوەی گاز", "هاوسەنگی", "کاریگەری پلەی گەرمی"],
    jargonToAvoid: ["هاوسەنگی تێربوون", "پەستانی بەشی دیاریکراو", "سیستەمی هێرمێتیک"],
    expectedEverydayAnalogies: ["سۆدا", "بپسی", "بتڵی ئاو", "مەلەوانی قووڵایی دەریا"],
    sampleTeacherExplanation: "کاتێک بتڵی سۆداکە داخراوە، پەستانێکی زۆر هەیە کە گازەکە ناچار دەکات لەناو شلەکەدا بمێنێتەوە. کاتێک سەری دەکەیتەوە پەستانەکە دادەبەزێت و گازەکە چیتر ناتوانێت بمێنێتەوە و دێتە دەرەوە."
  },
  {
    id: "feynman-phys12-induction",
    grade: "12",
    subject: "فیزیا",
    title: "یاسای فارادای و هاندانی کارۆموگناتیسی",
    prompt: "چۆن دەتوانیت بە تەنها بە جووڵاندنی پارچەیەک ئاسنی موگناتیسی لەناو وایەرێکی پێچراودا تەزووی کارەبا دروست بکەیت؟ بۆ کەسێکی ڕوونی بکەرەوە کە پێی وایە کارەبا تەنها لە پاترییەوە دێت.",
    corePrinciples: ["موگناتیس", "تەزووی کارەبا", "جووڵە", "گۆڕانی هێڵی موگناتیسی"],
    jargonToAvoid: ["لێشاوی موگناتیسی (Flux)", "هێزی پاڵنەری کارەبایی هێنراو", "یاسای لێنز"],
    expectedEverydayAnalogies: ["دینەمۆی پاسکیل", "تورباینی بەنداو", "باوەشێنی با"],
    sampleTeacherExplanation: "هێڵی موگناتیسی وەک شەرواڵی با وایە، کاتێک موگناتیسەکە دەجووڵێنیت، ئەلەکترۆنەکانی ناو وایەرەکە هان دەدرێن بەرەو یەک ئاڕاستە ڕابکەن و کارەبا پەیدا ببێت."
  },
  {
    id: "feynman-bio11-photosynthesis",
    grade: "11",
    subject: "زیندەزانی",
    title: "ڕۆشنەپێکهاتن: دروستکردنی خۆراک لە تیشکەوە",
    prompt: "بۆ منداڵێکی ٨ ساڵان شی بکەرەوە کە چۆن گەڵایەکی سەوزی دار توانای هەیە لە هەوا، ئاو و تیشکی خۆرەوە شیرینی و ئۆکسجین دروست بکات؟",
    corePrinciples: ["ڕووناکی خۆر", "دوانەئۆکسیدی کاربۆن", "کلۆرۆفیل", "ئۆکسجین و گلوکۆز"],
    jargonToAvoid: ["سووڕی کالڤن", "سیستەمی ڕووناکی دووەم", "تیلاکۆید"],
    expectedEverydayAnalogies: ["چێشتخانەی ڕووەک", "نانەواخانەی خۆر", "مۆلیدەی سەوز"],
    sampleTeacherExplanation: "ڕووەک لە ڕێگەی گەڵا سەوزەکانی وەک چێشتخانەیەک کار دەکات؛ تیشکی خۆر بۆ گەرمکردن بەکاردێنێت، ئاوی ژێر زەوی و هەوای دەوروبەری تێکەڵ دەکات و شیرینییەکی خۆش بۆ خۆی دروست دەکات و هەوای پاک بۆ ئێمە دەردەدات."
  },
  {
    id: "feynman-math9-pythagoras",
    grade: "9",
    subject: "بیرکاری",
    title: "تیۆرمی پیتاگۆرس بە وێنە و ژیانی ڕۆژانە",
    prompt: "تیۆرمی پیتاگۆرس ($a^2 + b^2 = c^2$) ڕوون بکەرەوە؛ ئەگەر پەیژەیەک بە دیوارێکەوە بدەیت، چۆن دەزانیت چەند لە دیوارەکە دوورە؟",
    corePrinciples: ["سێگۆشەی وەستاو", "دووجا", "ژێ (hypotenuse)", "درێژایی لاکان"],
    jargonToAvoid: ["تێکڕای هاوسەنگکراوی نائەقلانی", "سەلماندنی ئیقلیدسی"],
    expectedEverydayAnalogies: ["پەیژە", "یاریگای تۆپێن", "دیواری خانووبەرە"],
    sampleTeacherExplanation: "ئەگەر سێگۆشەیەکمان هەبێت کە گۆشەیەکی ڕێک بێت، دووجای دوو لا کورتەکە کاتێک کۆدەکرێنەوە یەکسانە بە دووجای لا درێژەکە."
  }
];

// 2. Initial Metacognitive Questions with High-Yield Traps
export const INITIAL_METACOGNITIVE_QUESTIONS: MetacognitiveQuestion[] = [
  {
    id: "meta-chem12-trap1",
    grade: "12",
    subject: "کیمیا",
    topic: "ترش و تفت - پۆلی ١٢ وەزاری",
    questionKurdish: "کام لەمانەی خوارەوە بە ترشی لاواز دادەنرێت جگە لە:",
    options: [
      { key: "A", text: "ترشی هایدرۆکلۆریک (HCl)", isCorrect: true, trapType: "CARELESS_MISREADING" },
      { key: "B", text: "ترشی ئەسیتیک (CH3COOH)", isCorrect: false },
      { key: "C", text: "ترشی کاربۆنیک (H2CO3)", isCorrect: false },
      { key: "D", text: "ترشی هایدرۆفلووریک (HF)", isCorrect: false }
    ],
    trapExplanation: "زۆربەی خوێندکاران بەهۆی پەلەکردن سەرنجی وشەی (جگە لە) نادەن، بۆیە دەچن ترشێکی لاواز هەڵدەبژێرن لە کاتێکدا داواکارییەکە دۆزینەوەی ترشە بەهێزەکەیە کە HCl ە!",
    correctExplanation: "HCl ترشێکی زۆر بەهێزە و بە تەواوی لە ئاودا هەڵدەوەشێت، لە کاتێکدا ئەوانی تر ترشی لاوازن. وشەی 'جگە لە' ئاڕاستەی پرسیارەکە پێچەوانە دەکاتەوە."
  },
  {
    id: "meta-phys12-trap2",
    grade: "12",
    subject: "فیزیا",
    topic: "تەزووی گۆڕاو و خولگەی کارەبایی",
    questionKurdish: "ئەگەر بەرگری خولگەیەکی کارەبایی ٢ هێندە زیاد بکات و ڤۆڵتیە نەگۆڕ بێت، تەزووی کارەبا چی لێدێت؟",
    options: [
      { key: "A", text: "دەبێتە نیوە (١/٢ دەهێندرێتەوە)", isCorrect: true },
      { key: "B", text: "٢ هێندە زیاد دەکات", isCorrect: false, trapType: "CONCEPTUAL_DEFICIT" },
      { key: "C", text: "٤ هێندە زیاد دەکات", isCorrect: false, trapType: "CALCULATION_SLIP" },
      { key: "D", text: "ناگۆڕێت", isCorrect: false, trapType: "TIME_PRESSURE_PANIC" }
    ],
    trapExplanation: "پەیوەندی نێوان تەزوو (I) و بەرگری (R) پێچەوانەیە ($I = V/R$). هەڵەی باو ئەوەیە کە وا بیر دەکرێتەوە زیادبوون لە بەرگریدا دەبێتە هۆی زیادبوونی تەزوو.",
    correctExplanation: "بەپێی یاسای ئۆم، بەرگری بەربەستە لەبەردەم ڕۆیشتنی تەزوو، کاتێک بەرگری دوو هێندە دەبێت تەزوو دەبێت بە نیوە."
  },
  {
    id: "meta-math12-trap3",
    grade: "12",
    subject: "بیرکاری",
    topic: "تەواوکاری و داتاشراو",
    questionKurdish: "داتاشراوی نەگۆڕی $\\pi$ بەرامبەر بە $x$ یەکسانە بە چی؟",
    options: [
      { key: "A", text: "0 (سفر)", isCorrect: true },
      { key: "B", text: "1", isCorrect: false, trapType: "CARELESS_MISREADING" },
      { key: "C", text: "3.14", isCorrect: false, trapType: "CONCEPTUAL_DEFICIT" },
      { key: "D", text: "\\pi", isCorrect: false, trapType: "TIME_PRESSURE_PANIC" }
    ],
    trapExplanation: "هەندێک خوێندکار پیتاکەی $\\pi$ وەک گۆڕەک (x) مامەڵە لەگەڵ دەکەن یان نرخەکەی دادەنێن، لە کاتێکدا داتاشراوی هەر ژمارەیەکی نەگۆڕ دەبێتە سفر.",
    correctExplanation: "ژمارەی بای ($\\pi$) نەگۆڕە و هیچ گۆڕانێکی تێدا نییە، داتاشراوی هەر نرخێکی نەگۆڕ هەمیشە سفرە."
  }
];

// 3. Initial Leitner Items (Distributed in Boxes 1 to 5)
export const INITIAL_LEITNER_ITEMS: LeitnerItem[] = [
  {
    id: "leitner-item-1",
    grade: "12",
    subject: "کیمیا",
    conceptTitle: "یاسای پاراستنی بارستە لە هاوکێشەی کیمیاییدا",
    box: 1,
    lastReviewedDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    nextReviewDate: new Date().toISOString(),
    questionPrompt: "لە کارلێکی کیمیاییدا، کۆی بارستەی کەرەستە کارلێککردووەکان چۆن بەراورد دەکرێت لەگەڵ کۆی بارستەی بەرهەمەکان؟",
    correctAnswer: "بە تەواوی یەکسانن (بارستە لەناو ناچێت و لە هیچەوە دروست نابێت).",
    retrievalSuccessCount: 0
  },
  {
    id: "leitner-item-2",
    grade: "12",
    subject: "فیزیا",
    conceptTitle: "یاسای کۆڵۆم و هێزی کارەبایی",
    box: 2,
    lastReviewedDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    nextReviewDate: new Date().toISOString(),
    questionPrompt: "ئەگەر دووری نێوان دوو بارگەی کارەبایی دوو هێندە بکرێت، هێزی کارەبایی نێوانیان چەند دەبێت؟",
    correctAnswer: "دەبێتە یەک لەسەر چوار (١/٤)ی هێزە بنەڕەتییەکە چونکە دووری دووجایە لە مەخافەتدا.",
    retrievalSuccessCount: 1
  },
  {
    id: "leitner-item-3",
    grade: "12",
    subject: "زیندەزانی",
    conceptTitle: "پێکهاتەی ترشی ناوەکی DNA",
    box: 3,
    lastReviewedDate: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    nextReviewDate: new Date().toISOString(),
    questionPrompt: "لە زنجیرەی دووانەی DNA دا، بازەی ئەدینین (A) هەمیشە لەگەڵ کام بازە جووت دەبێت و بە چەند بەندی هایدرۆجینی؟",
    correctAnswer: "لەگەڵ تایمین (T) بە ٢ بەندی هایدرۆجینی.",
    retrievalSuccessCount: 3
  },
  {
    id: "leitner-item-4",
    grade: "11",
    subject: "بیرکاری",
    conceptTitle: "یاسای ساین و کۆساین لە سێگۆشەدا",
    box: 4,
    lastReviewedDate: new Date(Date.now() - 16 * 24 * 3600 * 1000).toISOString(),
    nextReviewDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    questionPrompt: "لە چ جۆرە سێگۆشەیەکدا دەتوانین یاسای ساین ($a/\\sin A = b/\\sin B$) بەکاربهێنین؟",
    correctAnswer: "لە هەموو جۆرە سێگۆشەیەکدا (وەستاو، تیژگۆشە، یان کڕگۆشە).",
    retrievalSuccessCount: 4
  },
  {
    id: "leitner-item-5",
    grade: "10",
    subject: "کیمیا",
    conceptTitle: "خشتەی خولی و ژمارەی ئەتۆمی",
    box: 5,
    lastReviewedDate: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(),
    nextReviewDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
    questionPrompt: "ژمارەی ئەتۆمی توخمێک نیشاندەری ژمارەی کام تەنۆلکەیە لە ناوکدا؟",
    correctAnswer: "ژمارەی پرۆتۆنەکان لە ناوکدا.",
    retrievalSuccessCount: 6
  }
];

// 4. Initial Dialectic Debate Topics
export const INITIAL_DEBATE_TOPICS: DialecticDebateTopic[] = [
  {
    id: "debate-gravity-mass",
    grade: "10",
    subject: "فیزیا",
    misconceptionClaim: "تەنە قورسەکان هەمیشە زۆر خێراتر لە تەنە سووکەکان دەکەونە خوارەوە بۆ سەر زەوی چونکە کێشیان زیاتر ڕایاندەکێشێت!",
    context: "تۆ لە دیبەیتی زانستیدایت بەرامبەر بە وتەیەکی باو لەبارەی کەوتنی ئازاد. دەبێت بە یاسای گالیلۆ و نیوتن سەلماندنی هەڵەکە بکەیت.",
    scientificTruth: "لە بارودۆخی کەوتنی ئازاد (بەبێ بەرگری هەوا)، هەموو تەنەکان بە هەمان تاودانی کێشکردن (g = 9.8 m/s²) دەکەونە خوارەوە بێ گوێدانە بارستاییەکەیان.",
    curriculumReference: "فیزیا پۆلی ١٠ - بەشی کەوتنی ئازادی تەنەکان",
    hints: [
      "باسی بوونی بەرگری هەوا و ئەزموونی گالیلۆ لە تاوەری پیزا بکە.",
      "هاوکێشەی $F = m \\cdot a$ و $F = m \\cdot g$ بەراورد بکە."
    ]
  },
  {
    id: "debate-photosynthesis-dark",
    grade: "11",
    subject: "زیندەزانی",
    misconceptionClaim: "کرداری ڕۆشنەپێکهاتن بە هیچ شێوەیەک ناتوانێت لە تاریکیدا بەردەوام بێت و بە نەبوونی تیشکی ڕاستەوخۆ دەستبەجێ دەوەستێت!",
    context: "مشتومڕ لەسەر قۆناغەکانی ڕۆشنەپێکهاتن. تەنها ڕووناکی سەرچاوەیە؟ کارلێکە بێ ڕووناکییەکان چۆن ڕوودەدەن؟",
    scientificTruth: "ڕۆشنەپێکهاتن دوو قۆناغی سەرەکییە: کارلێکی ڕووناکی کە پێویستی بە تیشکە، و کارلێکی تاریکی (سووڕی کالڤن) کە پێویستی بە ڕووناکی نییە و بە بەرهەمەکانی قۆناغی یەکەم (ATP و NADPH) ئەنجام دەدرێت تەنانەت لە تاریکیدا.",
    curriculumReference: "زیندەزانی پۆلی ١١ - میتابۆلیزم و ڕۆشنەپێکهاتن",
    hints: [
      "باسی سووڕی کالڤن بکە کە لە سترۆمای کلۆرۆپلاستدا ڕوودەدات.",
      "ڕوونی بکەرەوە کە ATP و NADPH وزەی هەڵگیراون بۆ قۆناغی بێ تیشک."
    ]
  },
  {
    id: "debate-chemical-temperature",
    grade: "12",
    subject: "کیمیا",
    misconceptionClaim: "بەرزکردنەوەی پلەی گەرمی لە هەموو کارلێکە کیمیاییەکاندا بێ جیاوازی بڕی بەرهەمەکان زیاد دەکات!",
    context: "یاسای لۆشاتلییە و گۆڕانی هاوسەنگی. ئایا هەمیشە گەرمی زیادکردن بە سوودی بەرهەمە؟",
    scientificTruth: "لە کارلێکە گەرمی دەردەرەکاندا (Exothermic reactions)، بەرزکردنەوەی پلەی گەرمی دەبێتە هۆی لادانی هاوسەنگی بەرەو لای کارلێککەرەکان و بڕی بەرهەم کەمدەکاتەوە.",
    curriculumReference: "کیمیا پۆلی ١٢ - بەشی هاوسەنگی کیمیایی و یاسای لۆشاتلییە",
    hints: [
      "جیاوازی بکە لە نێوان خێرایی کارلێک و شوێنی هاوسەنگی.",
      "یاسای لۆشاتلییە بەکاربهێنە بۆ کارلێکی گەرمی دەر."
    ]
  }
];

// 5. Initial Soma Sheet Simulation Questions (Grade 12 Official Style)
export const INITIAL_SOMA_QUESTIONS: SomaQuestion[] = [
  {
    number: 1,
    questionText: "پەستانی تەواوی تێکەڵەیەک لە گازەکان یەکسانە بە سەرجەمی پەستانە بەشییەکانی هەر گازێک، ئەمە دەقی کام یاسایە؟",
    options: [
      { key: "A", text: "یاسای دالتۆن" },
      { key: "B", text: "یاسای چارلز" },
      { key: "C", text: "یاسای بۆیل" },
      { key: "D", text: "یاسای گەی لووساک" }
    ],
    correctKey: "A",
    subject: "کیمیا",
    difficulty: "normal"
  },
  {
    number: 2,
    questionText: "یەکەی پێوانەکردنی توانای گەیەنەر (Capacitance) لە سیستەمی نێودەوڵەتیدا (SI) بریتییە لە:",
    options: [
      { key: "A", text: "ئۆم (Ω)" },
      { key: "B", text: "فاراد (F)" },
      { key: "C", text: "تێسلا (T)" },
      { key: "D", text: "هێنری (H)" }
    ],
    correctKey: "B",
    subject: "فیزیا",
    difficulty: "normal"
  },
  {
    number: 3,
    questionText: "ئەگەر $f(x) = x^3 - 3x + 5$ بێت، خاڵە وەرگەڕاوەکان لە کوێدا ڕوودەدەن؟",
    options: [
      { key: "A", text: "لە $x = 0$" },
      { key: "B", text: "لە $x = 1$" },
      { key: "C", text: "لە $x = -1$" },
      { key: "D", text: "خاڵی وەرگەڕانی نییە" }
    ],
    correctKey: "A",
    subject: "بیرکاری",
    difficulty: "trick"
  },
  {
    number: 4,
    questionText: "کام ئەندامۆچکە لە خانەدا بەرپرسیارە لە دروستکردن و کۆکردنەوەی ماددەی وزەبەخشی ATP؟",
    options: [
      { key: "A", text: "مایتۆکۆندریا" },
      { key: "B", text: "تەنۆلکەی گۆڵجی" },
      { key: "C", text: "ڕایبۆسۆم" },
      { key: "D", text: "تۆڕی ئەندۆپلازمی" }
    ],
    correctKey: "A",
    subject: "زیندەزانی",
    difficulty: "normal"
  },
  {
    number: 5,
    questionText: "لە کارلێکی گەرمی-مژدا (Endothermic)، گۆڕانی گەرمی کارلێک (ΔH) هەمیشە چۆنە؟",
    options: [
      { key: "A", text: "سالبە (ΔH < 0)" },
      { key: "B", text: "موجەبە (ΔH > 0)" },
      { key: "C", text: "یەکسانە بە سفر" },
      { key: "D", text: "ناتوانرێت دیاری بکرێت" }
    ],
    correctKey: "B",
    subject: "کیمیا",
    difficulty: "normal"
  }
];
