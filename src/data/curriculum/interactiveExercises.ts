import { AnyInteractiveExercise } from "../../features/practice/components/InteractiveExerciseRenderer.tsx";

export const SAMPLE_INTERACTIVE_EXERCISES: AnyInteractiveExercise[] = [
  // ─── 1. FILL IN THE BLANKS (کیمیا - پێوەری pH) ──────────────────────────────
  {
    type: "fill_in_blank",
    id: "fib-chem-ph",
    subject: "chemistry",
    topicKu: "پێوەری pH و ترشێتی گیراوەکان",
    instructionKu: "شوێنە بەتاڵەکان بە وشە و هاوکێشەی زانستی گونجاو پڕبکەرەوە تاوەکو ڕێسای pH تەواو بێت:",
    sentenceTemplateKu:
      "پێوەری pH بریتییە لە پێوانەکردنی خەستی ئایۆنی {1} لە گیراوەدا. کاتێک بەهای pH لە ٧ کەمتر بێت گیراوەکە {2} دەبێت، و لە کاتی زیادبوونی خەستی هایدرۆنیۆم بەهای pH {3} دەکات.",
    blanks: [
      {
        id: 1,
        expectedAnswer: "هایدرۆنیۆم",
        acceptedAnswers: ["هایدرۆجین", "H3O+", "H+"],
        hintKu: "ئەو ئایۆنەیە کە لە ئەنجامی بەخشینی پرۆتۆن بۆ گەردی ئاو دروست دەبێت.",
      },
      {
        id: 2,
        expectedAnswer: "ترش",
        acceptedAnswers: ["ترشەڵۆک", "ترشی"],
        hintKu: "پێچەوانەی تفتییە کاتێک pH لە خوار ٧ بێت.",
      },
      {
        id: 3,
        expectedAnswer: "کەم",
        acceptedAnswers: ["نزمبوونەوە", "نزم"],
        hintKu: "پەیوەندی نێوان [H₃O⁺] و pH پێچەوانەیە بەهۆی نیشانەی نەرێنی لۆگاریتم.",
      },
    ],
    wordBankKu: ["هایدرۆنیۆم", "ترش", "کەم", "تفت", "هایدرۆکسید", "زیاد", "بێلایەن"],
    explanationKu:
      "بەپێی هاوکێشەی pH = -log[H₃O⁺]، زیادبوونی هایدرۆنیۆم دەبێتە هۆی دابەزینی pH بۆ ژێر ٧ کە نیشانەی ترشێتی گیراوەکەیە.",
  },

  // ─── 2. MATCHING (بیرکاری - داتاشراوەکانی پۆلی ١٢) ────────────────────────────
  {
    type: "matching",
    id: "match-math-derivatives",
    subject: "math",
    topicKu: "داتاشراوی نەخشە سەرەکییەکان (Calculus)",
    instructionKu: "هەر نەخشەیەک لە ستوونی ڕاست بە داتاشراوە دروستەکەی لە ستوونی چەپ هاوتا بکە:",
    pairs: [
      { id: "p1", leftKu: "f(x) = sin(x)", rightKu: "f'(x) = cos(x)" },
      { id: "p2", leftKu: "f(x) = cos(x)", rightKu: "f'(x) = -sin(x)" },
      { id: "p3", leftKu: "f(x) = e^x", rightKu: "f'(x) = e^x" },
      { id: "p4", leftKu: "f(x) = ln(x)", rightKu: "f'(x) = 1/x" },
      { id: "p5", leftKu: "f(x) = tan(x)", rightKu: "f'(x) = sec²(x)" },
    ],
    explanationKu:
      "ئەمانە داتاشراوە بنەڕەتییەکانی پڕۆگرامی وەزارەتن: داتاشراوی sin دەبێتە cos، داتاشراوی cos دەبێتە نەرێنی sin، و داتاشراوی ln(x) یەکسانە بە 1/x.",
  },

  // ─── 3. ORDERING (کیمیا - هەنگاوەکانی تیتراسیۆن) ─────────────────────────────
  {
    type: "ordering",
    id: "order-chem-titration",
    subject: "chemistry",
    topicKu: "هەنگاوە زنجیرەییەکانی تیتراسیۆن (Titration)",
    instructionKu: "هەنگاوەکانی ئەنجامدانی کرداری تیتراسیۆنی ترش و تفت بەپێی ڕیزبەندی دروست ڕێکبخە:",
    initialItems: [
      {
        id: "step-1",
        textKu: "پێوانەکردنی قەبارەیەکی دیاریکراو لە ترش بە پایپێت و تێکردنی بۆ ناو کڵاوەی ئێرلمایەر.",
        correctIndex: 0,
      },
      {
        id: "step-2",
        textKu: "زیادکردنی چەند دڵۆپێک لە ناسێنەری شیاو (وەک فینۆڵفتالین) بۆ ناو ترشەکە.",
        correctIndex: 1,
      },
      {
        id: "step-3",
        textKu: "پڕکردنی بیۆرێت بە گیراوەی تفتی پێوانەیی (خەستی زانراو) تا نیشانەی سفر.",
        correctIndex: 2,
      },
      {
        id: "step-4",
        textKu: "دڵۆپاندنی هێواشی تفت بۆ سەر ترشەکە لەگەڵ بەردەوام شڵەقاندنی کڵاوەکە.",
        correctIndex: 3,
      },
      {
        id: "step-5",
        textKu: "وەستاندنی تیتراسیۆن لە کاتی گۆڕانی ڕەنگی ناسێنەرەکە (خاڵی کۆتایی) و خوێندنەوەی قەبارە.",
        correctIndex: 4,
      },
    ],
    explanationKu:
      "لە تیتراسیۆندا هەمیشە ترشەکە پێوانە دەکرێت، پاشان ناسێنەر تێدەکرێت، بیۆرێت پڕ دەکرێت، دڵۆپاندن دەستپێدەکات و لەگەڵ گۆڕانی ڕەنگ کۆتایی دێت.",
  },

  // ─── 4. CONCEPT MAP (کیمیا - پەیوەندی هاوسەنگی و ترش) ────────────────────────
  {
    type: "concept_map",
    id: "cmap-chem-equilibrium",
    subject: "chemistry",
    topicKu: "نەخشەسازی چەمکی هاوسەنگی و بەرهەمی ئایۆنی",
    instructionKu: "سەیری نەخشەی پەیوەندی نێوان چەمکەکانی ئاو و ترش بکە و وەڵامی پرسیارە لۆژیکییەکە بدەرەوە:",
    centralThemeKu: "خۆئایۆنینی ئاو و پێوەری pH",
    nodes: [
      {
        id: "node-kw",
        titleKu: "نەگۆڕی خۆئایۆنین (Kw)",
        roleKu: "center",
        descriptionKu: "لە پلەی 25°C هەمیشە Kw = [H₃O⁺][OH⁻] = 1.0 × 10⁻¹⁴.",
        connectedTo: ["node-ph", "node-poh"],
      },
      {
        id: "node-ph",
        titleKu: "پێوەری pH",
        roleKu: "law",
        descriptionKu: "pH = -log[H₃O⁺]، پێوەرێکە بۆ دەستنیشانکردنی ترشێتی.",
        connectedTo: ["node-kw", "node-neutral"],
      },
      {
        id: "node-poh",
        titleKu: "پێوەری pOH",
        roleKu: "law",
        descriptionKu: "pOH = -log[OH⁻]، بەهایەکی تەواوکەرە و هەمیشە pH + pOH = 14.",
        connectedTo: ["node-kw"],
      },
      {
        id: "node-neutral",
        titleKu: "خاڵی بێلایەن (Neutrality)",
        roleKu: "example",
        descriptionKu: "کاتێک [H₃O⁺] = [OH⁻] = 1.0 × 10⁻⁷ M دەبێت، pH = 7.0.",
        connectedTo: ["node-ph", "node-poh"],
      },
    ],
    challengeQuestionKu:
      "ئەگەر لە پلەی 25°C دا خەستی هایدرۆنیۆم [H₃O⁺] کەم بکاتەوە بۆ 10⁻¹⁰ M، بەپێی ئەم نەخشەی پەیوەندییە، بەهای pOH چەند دەبێت؟",
    challengeOptionsKu: ["4.0", "10.0", "7.0", "14.0"],
    correctOptionIndex: 0,
    explanationKu:
      "کاتێک [H₃O⁺] = 10⁻¹⁰ دەبێتە pH = 10. لەبەر ئەوەی هەمیشە pH + pOH = 14 یە، کەواتە pOH = 14 - 10 = 4.0 دەبێت.",
  },

  // ─── 5. TRUE / FALSE (فیزیا - کارۆموگناتیسی) ──────────────────────────────────
  {
    type: "true_false",
    id: "tf-phys-lenz",
    subject: "physics",
    topicKu: "یاسای لێنز و تەزووی هاندراو",
    instructionKu: "ڕاستی و هەڵەی ئەم لێدوانە زانستییە دیاری بکە:",
    statementKu: "ئاراستەی تەزووی هاندراو هەمیشە بە ئاراستەیەکە کە بەرپەرچی ئەو گۆڕانکارییە دەداتەوە لە لێشاوی موگناتیسی کە بووەتە هۆی دروستبوونی.",
    isTrue: true,
    hintKu: "یاسای لێنز لەسەر بنەمای پاراستنی وزە داڕێژراوە.",
    explanationKu: "ڕاستە. بەپێی یاسای لێنز، جەمسەری موگناتیسی دروستبوو لە ئەنجامی تەزووی هاندراو، بەرپەرچی هۆکاری دروستبوونەکەی دەداتەوە تا وزە بپارێزرێت.",
  },

  // ─── 6. NUMERICAL EXERCISE (کیمیا - پێوەری pH) ──────────────────────────────
  {
    type: "numerical",
    id: "num-chem-ph",
    subject: "chemistry",
    topicKu: "شیکاری ژمارەیی ترشێتی (pH Calculations)",
    instructionKu: "بەهای داواکراو هەژمار بکە و تەنها ژمارەی وەڵامەکە بنووسە:",
    problemKu: "گیراوەیەکی ترشی نایتریک (HNO₃) خەستییەکەی 0.02 Mە لە پلەی 25°C. بەهای pH بۆ ئەم گیراوەیە چەندە؟ (تا دوو خانەی دەیی)",
    expectedNumber: 1.70,
    tolerance: 0.05,
    unitKu: "pH",
    formulaKu: "pH = -log[H₃O⁺]",
    hintKu: "لەبەر ئەوەی HNO₃ ترشێکی بەهێزە، [H₃O⁺] = 0.02 M. پاشان لۆگاریتمی نەرێنی وەربگرە: -log(0.02).",
    explanationKu: "بەپێی یاسای pH = -log(0.02) = -(-1.6989) ≈ 1.70، لەبەر ئەوەی ترشی بەهێزە بە تەواوی هەڵدەوەشێت.",
  },

  // ─── 7. ORDERING / SEQUENCING (زیندەزانی - دروستبوونی پڕۆتین) ────────────────
  {
    type: "ordering",
    id: "order-bio-protein-synthesis",
    subject: "biology",
    topicKu: "قۆناغەکانی دروستبوونی پڕۆتین (Protein Synthesis)",
    instructionKu: "هەنگاوەکانی بەرهەمهێنانی پڕۆتین لە خانەی زیندوودا بەپێی ڕیزبەندی دروست ڕێکبخە (بە ڕاکێشان یان بە تیرەکان):",
    initialItems: [
      {
        id: "bio-step-1",
        textKu: "کۆپیکردنی زانیارییە بۆماوەییەکان لە زنجیرەی DNA بۆ سەر شریتی پەیامبەرە ترش (mRNA) لە ناو ناووکدا (Transcription).",
        correctIndex: 0,
      },
      {
        id: "bio-step-2",
        textKu: "دەرچوونی شریتی mRNA لە ڕێگەی کونیلەکانی پەردەی ناووک بەرەو سایتۆپلازم و گەیشتن بە ڕایبۆسۆم.",
        correctIndex: 1,
      },
      {
        id: "bio-step-3",
        textKu: "بەستنەوەی ژێر-یەکەکانی ڕایبۆسۆم بە شریتی mRNA لە کۆدۆنی دەستپێک (AUG).",
        correctIndex: 2,
      },
      {
        id: "bio-step-4",
        textKu: "هێنانی ترشە ئەمینییە تایبەتەکان لەلایەن گوێزەرەوە ترش (tRNA) بەپێی دژە-کۆدۆنە تەواوکەرەکان.",
        correctIndex: 3,
      },
      {
        id: "bio-step-5",
        textKu: "دروستبوونی بەندی پێپتایدی لە نێوان ترشە ئەمینییەکان و ئازادبوونی زنجیرەی پۆلیپێپتاید (پڕۆتینی تەواو).",
        correctIndex: 4,
      },
    ],
    explanationKu: "پڕۆسەی دروستبوونی پڕۆتین لە دوو قۆناغی سەرەکی پێکدێت: لەبەرگرتنەوە (Transcription) لە ناووک، و پاشان وەرگێڕان (Translation) لە ڕایبۆسۆم لە سایتۆپلازم.",
  },

  // ─── 8. MATCHING (ئینگلیزی پۆلی ١٢ - Sunrise 12 Phrasal Verbs) ──────────────
  {
    type: "matching",
    id: "match-eng-phrasal-verbs",
    subject: "english",
    topicKu: "Phrasal Verbs & Definitions (Sunrise 12)",
    instructionKu: "Match each academic phrasal verb on the right with its correct Kurdish meaning on the left:",
    pairs: [
      { id: "pv1", leftKu: "Carry out", rightKu: "ئەنجامدان یان جێبەجێکردنی تاقیکردنەوە و لێکۆڵینەوە" },
      { id: "pv2", leftKu: "Come up with", rightKu: "دۆزینەوە یان بیرکردنەوە لە بیرۆکەیەکی نوێ" },
      { id: "pv3", leftKu: "Break down", rightKu: "شیکردنەوە و دابەشبوون بۆ بەشە سەرەتاییەکان" },
      { id: "pv4", leftKu: "Rely on", rightKu: "پشتپێبەستن و متمانەکردن بە سەرچاوە" },
      { id: "pv5", leftKu: "Focus on", rightKu: "چڕکردنەوەی سەرنج و وردبوونەوە لە بابەتێک" },
    ],
    explanationKu: "ئەم دەستەواژە و کارە لێکدراوانە (Phrasal Verbs) بەشێکی سەرەکیین لە پڕۆگرامی ئینگلیزی پۆلی ١٢ (Sunrise 12) و بەردەوام لە تاقیکردنەوەکانی وەزارەتدا دووبارە دەبنەوە.",
  },

  // ─── 9. CONCEPT MAP (فیزیا - شەپۆلی کارۆموگناتیسی و فۆتۆن) ───────────────────
  {
    type: "concept_map",
    id: "cmap-phys-photon-energy",
    subject: "physics",
    topicKu: "نەخشەی چەمکی تیشکی کارۆموگناتیسی و وزەی فۆتۆن",
    instructionKu: "پەیوەندی نێوان خێرایی ڕووناکی، فرێکوێنسی و وزەی فۆتۆن تاوتوێ بکە و وەڵامی ئاڵنگارییەکە بدەرەوە:",
    centralThemeKu: "تایبەتمەندییە کوانتەمییەکانی تیشکی کارۆموگناتیسی",
    nodes: [
      {
        id: "node-c",
        titleKu: "خێرایی ڕووناکی (c)",
        roleKu: "center",
        descriptionKu: "نەگۆڕێکی جیهانییە لە بۆشاییدا: c = 3.0 × 10⁸ m/s.",
        connectedTo: ["node-freq", "node-wave"],
      },
      {
        id: "node-freq",
        titleKu: "فرێکوێنسی شەپۆل (f)",
        roleKu: "law",
        descriptionKu: "پەیوەندی بە درێژی شەپۆلەوە هەیە: f = c / λ.",
        connectedTo: ["node-c", "node-energy"],
      },
      {
        id: "node-wave",
        titleKu: "درێژی شەپۆل (λ)",
        roleKu: "example",
        descriptionKu: "مەودای نێوان دوو لووتکە؛ کورتترین درێژی شەپۆل تیشکی گامایە و درێژترینیان ڕادیۆیە.",
        connectedTo: ["node-c", "node-freq"],
      },
      {
        id: "node-energy",
        titleKu: "وزەی فۆتۆن (E = hf)",
        roleKu: "law",
        descriptionKu: "بەپێی تیۆری ماکس پلانک، وزەی فۆتۆن ڕاستەوانەیە لەگەڵ فرێکوێنسی (h نەگۆڕی پلانکە).",
        connectedTo: ["node-freq"],
      },
    ],
    challengeQuestionKu:
      "ئەگەر درێژی شەپۆلی تیشکێک بۆ نیوە کەم بێتەوە (λ ببێتە نیوە)، بەپێی پەیوەندی نێوان ئەم چەمکانە چی بەسەر وزەی فۆتۆنەکە (E)دا دێت؟",
    challengeOptionsKu: [
      "دوو هێندە زیاد دەکات (E دەبێتە ٢ هێندە چونکە فرێکوێنسی دوو هێندە دەبێت)",
      "بۆ نیوە کەم دەکات",
      "چوار هێندە زیاد دەکات",
      "بە نەگۆڕی دەمێنێتەوە چونکە خێرایی ڕووناکی نەگۆڕە",
    ],
    correctOptionIndex: 0,
    explanationKu:
      "بەپێی هاوکێشەی c = λf، کەمبوونی درێژی شەپۆل بۆ نیوە دەبێتە هۆی دوو هێندەبوونی فرێکوێنسی (f). لەبەر ئەوەی E = hf یە، وزەی فۆتۆنەکەش ڕاستەوخۆ دوو هێندە زیاد دەکات.",
  },

  // ─── 10. FILL IN THE BLANKS (کوردی - ڕێزمانی کوردی) ─────────────────────────
  {
    type: "fill_in_blank",
    id: "fib-kurd-grammar",
    subject: "kurdish",
    topicKu: "ڕێزمانی کوردی: ئەرکی ڕستەسازی",
    instructionKu: "شوێنە بەتاڵەکان بە چەمکی ڕێزمانی دروست پڕبکەرەوە:",
    sentenceTemplateKu:
      "لە ڕستەی تێپەڕدا، ئەو کەرستەیەی کە کارەکەی لەسەر ئەنجام دەدرێت پێی دەوترێت {1}، و جێناوی لکاوی کەسی سێیەمی تاک لە کاری ڕابردووی تێپەڕ بریتییە لە {2}.",
    blanks: [
      {
        id: 1,
        expectedAnswer: "بەرکار",
        acceptedAnswers: ["بەرکارە", "object"],
        hintKu: "کەوتووەتە ژێر کاریگەری بکەر.",
      },
      {
        id: 2,
        expectedAnswer: "ی",
        acceptedAnswers: ["-ی", "پیتى ی"],
        hintKu: "وەک لە وشەی: نووسی، خوێندیەوە.",
      },
    ],
    wordBankKu: ["بەرکار", "ی", "بکەر", "تەواوکەر", "مان", "تان", "یان"],
    explanationKu:
      "لە ڕستەی تێپەڕدا کار پێویستی بە بەرکارە و جێناوی لکاوی کەسی سێیەمی تاک بە پیتی 'ی' دەردەکەوێت.",
  },

  // ─── 11. MATCHING (عەرەبی - قواعد اللغة العربية) ────────────────────────────
  {
    type: "matching",
    id: "match-arab-grammar",
    subject: "arabic",
    topicKu: "قواعد اللغة العربية: إعراب الأسماء",
    instructionKu: "طابق كل موقع إعرابي بالعلامة الإعرابية الصحيحة له في المنهج الوزاري:",
    pairs: [
      { id: "a1", leftKu: "الفاعل المفرد", rightKu: "مرفوع بالضمة الظاهرة" },
      { id: "a2", leftKu: "المفعول به المفرد", rightKu: "منصوب بالفتحة الظاهرة" },
      { id: "a3", leftKu: "الاسم المجرور بحرف الجر", rightKu: "مجرور بالكسرة الظاهرة" },
      { id: "a4", leftKu: "المبتدأ والخبر المفردان", rightKu: "مرفوعان بالضمة الظاهرة" },
    ],
    explanationKu:
      "العلامات الإعرابية الأصلية للأسماء المفردة في اللغة العربية هي: الضمة في حالة الرفع، والفتحة في حالة النصب، والكسرة في حالة الجر.",
  },

  // ─── 12. ORDERING (مێژوو - شۆڕشی ئەیلوول) ──────────────────────────────────
  {
    type: "ordering",
    id: "order-hist-events",
    subject: "history",
    topicKu: "مێژووی هاوچەرخ: شۆڕشی ئەیلوول و بەیاننامەی ١١ی ئازار",
    instructionKu: "ڕووداوە مێژووییەکان بەپێی ڕیزبەندی کاتی دروست ڕێکبخە لە کۆنەوە بۆ نوێ:",
    initialItems: [
      {
        id: "h1",
        textKu: "هەڵگیرسانی شۆڕشی مەزنی ئەیلوول بە ڕابەرایەتی مەلا مستەفا بارزانی (١٩٦١)",
        correctIndex: 0,
      },
      {
        id: "h2",
        textKu: "ڕاگەیاندنی بەیاننامەی مێژوویی ١١ی ئازار بۆ حوکمی زاتی گەلی کوردستان (١٩٧٠)",
        correctIndex: 1,
      },
      {
        id: "h3",
        textKu: "ڕێککەوتننامەی شوومی جەزائیر لە دژی بزووتنەوەی ڕزگاریخوازی کورد (١٩٧٥)",
        correctIndex: 2,
      },
      {
        id: "h4",
        textKu: "هەڵگیرسانی شۆڕشی گوڵانی پێشکەوتنخواز بۆ بەردەوامی خەبات (١٩٧٦)",
        correctIndex: 3,
      },
    ],
    explanationKu:
      "شۆڕشی ئەیلوول لە ساڵی ١٩٦١ دەستیپێکرد، لە ١٩٧٠ گەیشتە دەستکەوتی بەیاننامەی ١١ی ئازار، لە ١٩٧٥ نسکۆ دروستبوو و پاشان لە ١٩٧٦ شۆڕشی گوڵان هەڵگیرسا.",
  },

  // ─── 13. MATCHING (ئابووری - چەمکە داراییەکان) ──────────────────────────────
  {
    type: "matching",
    id: "match-econ-concepts",
    subject: "economy",
    topicKu: "ئابووری پۆلی ١٢: چەمکە دارایی و بانکییەکان",
    instructionKu: "هەر چەمکێکی ئابووری بە پێناسە زانستییەکەی هاوتا بکە:",
    pairs: [
      { id: "e1", leftKu: "هەڵئاوسان (Inflation)", rightKu: "بەرزبوونەوەی بەردەوامی ئاستی گشتی نرخەکان" },
      { id: "e2", leftKu: "تەرازووی بازرگانی ئەرێنی", rightKu: "زیادبوونی بەهای هەناردە بەراورد بە هاوردە" },
      { id: "e3", leftKu: "بانکی ناوەندی", rightKu: "بەرپرسی دەرکردنی دراو و پاراستنی بەهای دراوی نیشتمانی" },
      { id: "e4", leftKu: "داهاتی نەتەوەیی", rightKu: "کۆی بەهای کاڵا و خزمەتگوزاری بەرهەمهاتوو لە ماوەی ساڵێکدا" },
    ],
    explanationKu:
      "هەڵئاوسان توانای کڕینی دراو دادەبەزێنێت و تەرازووی بازرگانی ئەرێنی ئابوورییەکی بەهێز و گەشەسەندوو نیشان دەدات.",
  },

  // ─── 14. CONCEPT MAP (جوگرافیا - نەوت و هەناردە) ────────────────────────────
  {
    type: "concept_map",
    id: "cmap-geog-resources",
    subject: "geography",
    topicKu: "جوگرافیای ئابووری: کەرتی نەوت و پیشەسازی پترۆکیمیایی",
    instructionKu: "سەیری نەخشەی پەیوەندی نێوان کێڵگە و هێڵەکانی گواستنەوەی نەوت بکە و وەڵامی پرسیارەکە بدەرەوە:",
    centralThemeKu: "پیشەسازی دەرهێنان و هەناردەی نەوت لە عێراق و کوردستان",
    nodes: [
      {
        id: "g-kirkuk",
        titleKu: "کێڵگەی بابەگوڕگوڕ",
        roleKu: "center",
        descriptionKu: "دێرینترین کێڵگەی نەوتی کەرکووک لە ساڵی ١٩٢٧.",
        connectedTo: ["g-pipeline", "g-refinery"],
      },
      {
        id: "g-pipeline",
        titleKu: "هێڵی بۆری جەیهان",
        roleKu: "application",
        descriptionKu: "ڕێگای هەناردەکردنی نەوت بەرەو دەریای ناوەڕاست لە تورکیا.",
        connectedTo: ["g-kirkuk"],
      },
      {
        id: "g-refinery",
        titleKu: "پاڵاوگەی ناوخۆیی (بێجی و کەڵەک)",
        roleKu: "law",
        descriptionKu: "شوێنی گۆڕینی نەوتی خاو بۆ بەرهەمی سووتەمەنی و گاز.",
        connectedTo: ["g-kirkuk"],
      },
    ],
    challengeQuestionKu:
      "هێڵی سەرەکی بۆری هەناردەکردنی نەوتی کەرکووک و هەرێم نەوت بۆ کام بەندەری سەر دەریای ناوەڕاست دەگوازێتەوە؟",
    challengeOptionsKu: [
      "بەندەری جەیهان لە تورکیا",
      "بەندەری بەسرە لە کەنداو",
      "بەندەری عەقەبە لە ئوردن",
      "بەندەری دووبەی",
    ],
    correctOptionIndex: 0,
    explanationKu:
      "بۆری نەوتی باکوور نەوتی کەرکووک و هەرێم دەگەیەنێتە بەندەری جەیهان لە تورکیا لەسەر دەریای ناوەڕاست بۆ هەناردەکردنی جیهانی.",
  },

  // ─── 15. TRUE / FALSE (وەرزش - یاساکانی تۆپی پێ) ───────────────────────────
  {
    type: "true_false",
    id: "tf-sport-rules",
    subject: "sports",
    topicKu: "یاساکانی فەرمی فیفا: ئۆفساید و گەرمکردنەوە",
    instructionKu: "ڕاستی یان هەڵەی ئەم یاسا وەرزشییە نێودەوڵەتییە دیاری بکە:",
    statementKu: "لە تۆپی پێدا لە کاتی هاویشتنی تۆپی دەست (Throw-in) و لێدانی کۆڕنەر، یاسای ئۆفساید بوونی نییە و ناگیرێت.",
    isTrue: true,
    hintKu: "یاسای ١١ی IFAB چەند وەستانێک دەستنیشان دەکات کە تێیدا ئۆفساید ناکەوێتەوە.",
    explanationKu: "ڕاستە؛ بەپێی یاسای ١١ی IFAB، ڕاستەوخۆ لە کاتی هاویشتنی تۆپی دەست، لێدانی گۆڵ و کۆڕنەر هیچ ئۆفسایدێک بوونی نییە.",
  },
];
