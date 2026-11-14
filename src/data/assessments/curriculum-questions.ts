export interface AssessmentQuestionItem {
  id: string;
  subject: string;
  grade: number;
  chapter_id: string;
  question_text_ku: string;
  question_type: "mcq" | "true_false" | "numeric" | "matching" | "ordering" | "fill_blank";
  difficulty: "easy" | "medium" | "hard" | "expert";
  options: string[];
  correct_answer: string;
  explanation_ku: string;
  explanation_ar?: string;
  image_url?: string;
  points: number;
}

export const REAL_ASSESSMENT_QUESTIONS: AssessmentQuestionItem[] = [
  // --- CHEMISTRY GRADE 12 ---
  {
    id: "q-chem-12-001",
    subject: "chemistry",
    grade: 12,
    chapter_id: "chem-12-ch3-l1",
    question_text_ku: "ئەگەر خەستی ئایۆنی هایدرۆنیۆم [H₃O⁺] لە گیراوەیەکدا 1.0 × 10⁻⁴ M بێت، بەهای pH ئەم گیراوەیە چەندە؟",
    question_type: "mcq",
    difficulty: "easy",
    options: ["2", "4", "10", "14"],
    correct_answer: "4",
    explanation_ku: "بەپێی یاسای پێوەری ترشێتی: pH = -log[H₃O⁺]. لێرەدا: pH = -log(1.0 × 10⁻⁴) = -(-4) = 4. چونكە pH < 7 گیراوەکە ترشە.",
    explanation_ar: "حسب القانون pH = -log[H3O+] = -log(10^-4) = 4 المحلول حمضي.",
    points: 10
  },
  {
    id: "q-chem-12-002",
    subject: "chemistry",
    grade: 12,
    chapter_id: "chem-12-ch3-l1",
    question_text_ku: "لە پلەی گەرمی 25°C، ئەگەر خەستی ئایۆنی هایدرۆکسید [OH⁻] یەکسان بێت بە 1.0 × 10⁻⁹ M، ئەوا خەستی [H₃O⁺] یەکسانە بە:",
    question_type: "mcq",
    difficulty: "medium",
    options: ["1.0 × 10⁻⁵ M", "1.0 × 10⁻¹⁴ M", "1.0 × 10⁻⁷ M", "1.0 × 10⁻⁹ M"],
    correct_answer: "1.0 × 10⁻⁵ M",
    explanation_ku: "لەبەر ئەوەی Kw = [H₃O⁺][OH⁻] = 1.0 × 10⁻¹⁴، کەواتە: [H₃O⁺] = Kw / [OH⁻] = (1.0 × 10⁻¹⁴) / (1.0 × 10⁻⁹) = 1.0 × 10⁻⁵ M.",
    explanation_ar: "Kw = [H3O+][OH-] = 10^-14 إذن [H3O+] = 10^-14 / 10^-9 = 10^-5 M.",
    points: 15
  },
  {
    id: "q-chem-12-003",
    subject: "chemistry",
    grade: 12,
    chapter_id: "chem-12-ch1-l2",
    question_text_ku: "بۆ ئامادەکردنی 2 لیتر گیراوەی 0.5 مۆلاری لە گلوکۆز (بارستەی مۆڵی = 180 g/mol)، چەند گرام گلوکۆز پێویستە؟",
    question_type: "mcq",
    difficulty: "medium",
    options: ["90 g", "180 g", "360 g", "45 g"],
    correct_answer: "180 g",
    explanation_ku: "ژمارەی مۆڵەکان n = M × V = 0.5 mol/L × 2 L = 1 mol. بارستە m = n × M_m = 1 mol × 180 g/mol = 180 g.",
    explanation_ar: "عدد المولات n = M * V = 0.5 * 2 = 1 مول. الكتلة = 1 * 180 = 180 غم.",
    points: 15
  },
  {
    id: "q-chem-12-004",
    subject: "chemistry",
    grade: 12,
    chapter_id: "chem-12-ch2-l2",
    question_text_ku: "بەپێی تیۆری برۆنشتێد-لۆری، تفتی هاوبەش (Conjugate Base) بۆ ترشی H₂SO₄ بریتییە لە:",
    question_type: "mcq",
    difficulty: "easy",
    options: ["HSO₄⁻", "SO₄²⁻", "H₃SO₄⁺", "H⁺"],
    correct_answer: "HSO₄⁻",
    explanation_ku: "تفتی هاوبەش دروست دەبێت کاتێک ترشێک یەک پرۆتۆن (H⁺) دەبەخشێت: H₂SO₄ -> H⁺ + HSO₄⁻.",
    explanation_ar: "القاعدة المرافقة تفقد بروتون واحد لتصبح HSO4-.",
    points: 10
  },

  // --- PHYSICS GRADE 12 ---
  {
    id: "q-phys-12-001",
    subject: "physics",
    grade: 12,
    chapter_id: "phys-12-ch1-l1",
    question_text_ku: "ئۆتۆمبێلێک بە خێرایی جێگیری 20 m/s لەسەر پێچێکی بازنەیی بە نیوەتیرەی 50 m دەسووڕێتەوە. تاودانی چەقەهێز (a_c) چەندە؟",
    question_type: "mcq",
    difficulty: "easy",
    options: ["8 m/s²", "10 m/s²", "4 m/s²", "2 m/s²"],
    correct_answer: "8 m/s²",
    explanation_ku: "یاسای تاودانی چەقەهێز بریتییە لە a_c = v² / r. دانانی ژمارەکان: a_c = (20)² / 50 = 400 / 50 = 8 m/s².",
    explanation_ar: "التسارع المركزي ac = v^2 / r = 400 / 50 = 8 م/ث².",
    points: 10
  },
  {
    id: "q-phys-12-002",
    subject: "physics",
    grade: 12,
    chapter_id: "phys-12-ch7-l1",
    question_text_ku: "ئەگەر لەسەر بەرگرییەکی 5 ئۆمی جیاوازی پۆتانسێلی 15 ڤۆڵت دابنرێت، بڕی تەزووی کارەبایی تێپەڕبوو بەناو بەرگرییەکەدا چەندە؟",
    question_type: "mcq",
    difficulty: "easy",
    options: ["3 A", "75 A", "0.33 A", "10 A"],
    correct_answer: "3 A",
    explanation_ku: "بەپێی یاسای ئۆم: V = I × R، کەواتە I = V / R = 15 V / 5 Ω = 3 A.",
    explanation_ar: "حسب قانون أوم: I = V / R = 15 / 5 = 3 أمبير.",
    points: 10
  },
  {
    id: "q-phys-12-003",
    subject: "physics",
    grade: 12,
    chapter_id: "phys-12-ch8-l1",
    question_text_ku: "دوو بەرگری R₁ = 6 Ω و R₂ = 3 Ω بە شێوەی هاوتەریب (Parallel) بەستراون، بەرگری هاوتا (Req) یەکسانە بە:",
    question_type: "mcq",
    difficulty: "medium",
    options: ["2 Ω", "9 Ω", "4.5 Ω", "18 Ω"],
    correct_answer: "2 Ω",
    explanation_ku: "لە بەستنی هاوتەریبدا: 1/Req = 1/R₁ + 1/R₂ = 1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2، کەواتە Req = 2 Ω (یان (6×3)/(6+3) = 18/9 = 2 Ω).",
    explanation_ar: "المقاومة المكافئة على التوازي: Req = (R1 * R2) / (R1 + R2) = (6 * 3) / (6 + 3) = 18 / 9 = 2 أوم.",
    points: 15
  },

  // --- MATH GRADE 12 (7 Chapters Authentic Assessment) ---
  {
    id: "q-math-12-001",
    subject: "math",
    grade: 12,
    chapter_id: "math-12-ch1-l2",
    question_text_ku: "لێژی هێڵی ڕاست کە بە دوو خاڵی (2, 5) و (4, 11)دا دەڕوات چەندە؟",
    question_type: "mcq",
    difficulty: "easy",
    options: ["2", "3", "4", "6"],
    correct_answer: "3",
    explanation_ku: "بەپێی یاسای لێژی هێڵی ڕاست: m = (y₂ - y₁) / (x₂ - x₁) = (11 - 5) / (4 - 2) = 6 / 2 = 3.",
    points: 10
  },
  {
    id: "q-math-12-002",
    subject: "math",
    grade: 12,
    chapter_id: "math-12-ch2-l3",
    question_text_ku: "بەهای ئامانجی lim_{x->3} (x² - 9) / (x - 3) یەکسانە بە:",
    question_type: "mcq",
    difficulty: "medium",
    options: ["0", "3", "6", "بێپایان (بوونی نییە)"],
    correct_answer: "6",
    explanation_ku: "دانانی ڕاستەوخۆ دەبێتە 0/0 (شێوەی دیارینەکراو). بە شیکردنەوەی دووجای جیاوازی: (x - 3)(x + 3) / (x - 3) = x + 3. ئینجا: lim_{x->3} (x + 3) = 3 + 3 = 6.",
    points: 15
  },
  {
    id: "q-math-12-003",
    subject: "math",
    grade: 12,
    chapter_id: "math-12-ch3-l2",
    question_text_ku: "داتاشراوی نەخشەی f(x) = 4x³ - 5x² + 7x - 9 بریتییە لە:",
    question_type: "mcq",
    difficulty: "easy",
    options: [
      "f'(x) = 12x² - 10x + 7",
      "f'(x) = 12x³ - 10x² + 7x",
      "f'(x) = 4x² - 5x + 7",
      "f'(x) = 12x² - 5x"
    ],
    correct_answer: "f'(x) = 12x² - 10x + 7",
    explanation_ku: "بە بەکارهێنانی یاسای داتاشراوی توانی d/dx(xⁿ) = n·xⁿ⁻¹: داتاشراوی 4x³ دەکاتە 12x²، داتاشراوی -5x² دەکاتە -10x، داتاشراوی 7x دەکاتە 7، و داتاشراوی نەگۆڕی -9 دەکاتە 0.",
    points: 10
  },
  {
    id: "q-math-12-004",
    subject: "math",
    grade: 12,
    chapter_id: "math-12-ch4-l1",
    question_text_ku: "خاڵە ڕەخنەییەکانی نەخشەی f(x) = x³ - 3x کێن لەسەر تەختەی پۆوتان؟",
    question_type: "mcq",
    difficulty: "hard",
    options: ["x = 1 و x = -1", "x = 0 و x = 3", "x = √3 و x = -√3", "x = 2 و x = -2"],
    correct_answer: "x = 1 و x = -1",
    explanation_ku: "خاڵی ڕەخنەیی کاتێکە f'(x) = 0. داتاشراوی یەکەم: f'(x) = 3x² - 3 = 0 => 3(x² - 1) = 0 => x = ±1.",
    points: 15
  },
  {
    id: "q-math-12-005",
    subject: "math",
    grade: 12,
    chapter_id: "math-12-ch5-l1",
    question_text_ku: "تەواوکاری نادیاری ∫(6x² + 4x) dx یەکسانە بە:",
    question_type: "mcq",
    difficulty: "medium",
    options: [
      "2x³ + 2x² + C",
      "3x³ + 2x² + C",
      "12x + 4 + C",
      "6x³ + 4x² + C"
    ],
    correct_answer: "2x³ + 2x² + C",
    explanation_ku: "∫ 6x² dx = 6(x³/3) = 2x³، و ∫ 4x dx = 4(x²/2) = 2x². کەواتە ئەنجامەکە بریتییە لە 2x³ + 2x² + C.",
    points: 15
  },
  {
    id: "q-math-12-006",
    subject: "math",
    grade: 12,
    chapter_id: "math-12-ch6-l1",
    question_text_ku: "هاوکێشەی بڕگەی هاوتا کە سەری لە خاڵی بنەڕەت (0,0) بێت و تیشکۆکەی لە (3, 0) بێت، کامەیە؟",
    question_type: "mcq",
    difficulty: "medium",
    options: ["y² = 12x", "x² = 12y", "y² = 6x", "y² = -12x"],
    correct_answer: "y² = 12x",
    explanation_ku: "چونکە تیشکۆ لەسەر تەوەری x ی ئەرێنییە بە دووری p = 3، هاوکێشە ستانداردەکە بریتییە لە y² = 4px => y² = 4(3)x = 12x.",
    points: 15
  },
  {
    id: "q-math-12-007",
    subject: "math",
    grade: 12,
    chapter_id: "math-12-ch7-l1",
    question_text_ku: "قەبارە (Modulus r) و گۆشەی ئاراستە (θ) بۆ ژمارەی ئاوێتەی z = 1 + i√3 کامانەن؟",
    question_type: "mcq",
    difficulty: "hard",
    options: [
      "r = 2, θ = π/3 (60°)",
      "r = 4, θ = π/6 (30°)",
      "r = 2, θ = π/4 (45°)",
      "r = 1, θ = π/3 (60°)"
    ],
    correct_answer: "r = 2, θ = π/3 (60°)",
    explanation_ku: "r = √(a² + b²) = √(1² + (√3)²) = √(1 + 3) = √4 = 2. tan(θ) = b/a = √3/1 = √3، چونکە لە چوارینەی یەکەمدایە θ = π/3 (یان 60 پلە).",
    points: 20
  },

  // --- ENGLISH GRADE 12 (Sunrise 12 Authentic Assessment) ---
  {
    id: "q-eng-12-001",
    subject: "english",
    grade: 12,
    chapter_id: "eng-12-u1-l1",
    question_text_ku: "Choose the correct phrase to complete the suggestion: \"_______ contact my cousin Stella while you are in New York?\"",
    question_type: "mcq",
    difficulty: "easy",
    options: ["Why not", "Why don't", "You should to", "Let's to"],
    correct_answer: "Why not",
    explanation_ku: "دەستەواژەی 'Why not' ڕاستەوخۆ چاوگی ڕووتی بەدوادا دێت بێ بکەر (Why not + infinitive without to). بۆیە 'Why not contact' ڕاستە.",
    points: 10
  },
  {
    id: "q-eng-12-002",
    subject: "english",
    grade: 12,
    chapter_id: "eng-12-u2-l2",
    question_text_ku: "At 10:30 tomorrow morning, Azad _______ his presentation to the world youth conference.",
    question_type: "mcq",
    difficulty: "medium",
    options: ["will be giving", "is giving", "gives", "gave"],
    correct_answer: "will be giving",
    explanation_ku: "کاتێک کاتێکی دیاریکراوی داهاتوو دەستنیشان دەکرێت (At 10:30 tomorrow morning)، کاتی Future Continuous (will be + V-ing) بەکاردێت بۆ کارێک کە لەو ساتەدا لە بەردەوامیدا دەبێت.",
    points: 15
  },
  {
    id: "q-eng-12-003",
    subject: "english",
    grade: 12,
    chapter_id: "eng-12-u3-l1",
    question_text_ku: "The ancient stone fortress _______ by skilled craftsmen more than two thousand years ago.",
    question_type: "mcq",
    difficulty: "easy",
    options: ["was built", "is built", "has built", "was building"],
    correct_answer: "was built",
    explanation_ku: "ڕستەکە نەناسراوە (Passive) لە کاتی ڕابردووی سادە (two thousand years ago)، بۆیە یاساکەی بریتییە لە: was/were + V3 (was built).",
    points: 10
  },
  {
    id: "q-eng-12-004",
    subject: "english",
    grade: 12,
    chapter_id: "eng-12-u5-l2",
    question_text_ku: "\"If farmers had used modern drip irrigation, they _______ so much precious water.\"",
    question_type: "mcq",
    difficulty: "hard",
    options: [
      "would not have wasted",
      "will not waste",
      "would not waste",
      "had not wasted"
    ],
    correct_answer: "would not have wasted",
    explanation_ku: "مەرجی سێیەم (Third Conditional): دەستپێکەکەی Past Perfect ـە (If + had + V3)، بۆیە وەڵامی مەرجەکەی دەبێتە: would have / would not have + V3.",
    points: 15
  },
  {
    id: "q-eng-12-005",
    subject: "english",
    grade: 12,
    chapter_id: "eng-12-u6-l1",
    question_text_ku: "Which of the following sentences contains a correct REDUCED relative clause?",
    question_type: "mcq",
    difficulty: "medium",
    options: [
      "A web designer is an expert we can ask to create the portal.",
      "A web designer is an expert who we can ask him.",
      "A printer is a machine that it produces paper copies.",
      "The expert which designed the network has arrived."
    ],
    correct_answer: "A web designer is an expert we can ask to create the portal.",
    explanation_ku: "لە کورتکراوەی ڕستەی پەیوەندیدا (Reduced relative clause)، کاتێک جێناوەکە بەرکار بێت (who / that) لادەبرێت و جێناوی دووبارەی بەرکاریش (him) دانانرێتەوە.",
    points: 15
  },
  {
    id: "q-eng-12-006",
    subject: "english",
    grade: 12,
    chapter_id: "eng-12-u7-l2",
    question_text_ku: "\"I didn't like working at night at first, but now I _______ to it.\"",
    question_type: "mcq",
    difficulty: "medium",
    options: ["am used", "used", "use", "was used"],
    correct_answer: "am used",
    explanation_ku: "بۆ دەربڕینی ڕاهاتن لەسەر دۆخێک لە کاتی ئێستادا، دەستەواژەی be used to + noun/pronoun بەکاردێت (I am used to it).",
    points: 15
  },
  {
    id: "q-eng-12-007",
    subject: "english",
    grade: 12,
    chapter_id: "eng-12-u9-l1",
    question_text_ku: "In Robert Louis Stevenson's novel \"Treasure Island\", why did Jim Hawkins hide in the apple barrel on the Hispaniola?",
    question_type: "mcq",
    difficulty: "medium",
    options: [
      "To get an apple, where he accidentally overheard Silver's mutiny plot.",
      "To escape from Blind Pew and Black Dog.",
      "To protect the treasure map from Captain Smollett.",
      "To spy on Ben Gunn who was hiding on board."
    ],
    correct_answer: "To get an apple, where he accidentally overheard Silver's mutiny plot.",
    explanation_ku: "جیم چووە ناو بەرمیلە سێوەکە بۆ هێنانی سێوێک چونکە برسی بوو، بەڵام لەوێ گوێی لە گفتوگۆی نهێنی لۆنگ جۆن سیلڤەر و پیلانی یاخیبوونەکەی چەتەکان بوو.",
    points: 20
  }
];

export function getQuestionsBySubject(subject: string, grade = 12): AssessmentQuestionItem[] {
  const norm = (subject || "").toLowerCase().trim();
  return REAL_ASSESSMENT_QUESTIONS.filter(
    (q) => q.subject.toLowerCase() === norm && q.grade === Number(grade)
  );
}
