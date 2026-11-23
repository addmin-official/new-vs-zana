export interface ChapterOutlineItem {
  id: number;
  title: string;
  pages: string;
  lessons?: { id: string; title: string; description?: string }[];
}

// ============================================================================
// GRADE 12 CANONICAL OUTLINES
// ============================================================================
export const FALLBACK_CHEMISTRY_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "ئایۆنەکان لە ئاوەگیراوەکاندا و ڕەوشە کۆکارییەکان", pages: "8-36" },
  { id: 2, title: "ترش و تفتەکان", pages: "37-63" },
  { id: 3, title: "پێوانەکاری ترش-تفت و ڕێژەی هایدرۆجینی (pH)", pages: "64-93" },
  { id: 4, title: "وزەی کارلێکەکان", pages: "94-119" },
  { id: 5, title: "خێرایی کارلێکەکان", pages: "120-143" },
  { id: 6, title: "هاوسەنگی کیمیایی", pages: "144-181" },
  { id: 7, title: "کارلێکەکانی ئۆکسان و لێککردنەوە", pages: "182-201" },
  { id: 8, title: "کیمیای کارەبایی", pages: "202-225" },
  { id: 9, title: "کاربۆن و هایدرۆکاربۆنەکان", pages: "226-261" },
  { id: 10, title: "ئاوێتە ئەندامییەکانی تر", pages: "262-297" },
];

export const FALLBACK_PHYSICS_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "بزووتنی خولاو و کێشکردن", pages: "8-35" },
  { id: 2, title: "بزووتنی لەرینەوەیی و شەپۆلەکان", pages: "36-65" },
  { id: 3, title: "ڕووناکی و ئاوێنە و هاوێنەکان", pages: "66-101" },
  { id: 4, title: "دەستێوەردان و لادانی ڕووناکی", pages: "102-131" },
  { id: 5, title: "هێزی کارەبایی و بوارەکان", pages: "132-155" },
  { id: 6, title: "وزەی کارەبایی و توانست", pages: "156-201" },
  { id: 7, title: "تەزووی کارەبایی و بەرگری", pages: "202-227" },
  { id: 8, title: "بازنەکانی تەزووی کارەبایی", pages: "228-253" },
  { id: 9, title: "موگناتیسی و هاندانی کارۆموگناتیسی", pages: "254-280" },
];

export const FALLBACK_MATH_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "وێنە ڕوونکردنەوەییەکان و نموونە هێڵییەکان", pages: "3-38" },
  { id: 2, title: "ئامانجەکان (Limits)", pages: "39-78" },
  { id: 3, title: "داتاشراو (Derivative)", pages: "79-116" },
  { id: 4, title: "جێبەجێکردنی داتاشراو (Applications of Differentiation)", pages: "117-158" },
  { id: 5, title: "تەواوکاری (Integration)", pages: "159-186" },
  { id: 6, title: "بڕگە قووچەکییەکان (Conic Sections)", pages: "187-214" },
  { id: 7, title: "ژمارە ئاوێتەکان و ئەندازە (Complex Numbers)", pages: "215-240" },
];

export const FALLBACK_ENGLISH_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "Unit 1: To New York", pages: "4-11" },
  { id: 2, title: "Unit 2: Getting Organized", pages: "12-19" },
  { id: 3, title: "Unit 3: Saving the Past for the Future", pages: "20-27" },
  { id: 4, title: "Unit 4: Revision 1 (Units 1-3)", pages: "28-31" },
  { id: 5, title: "Unit 5: Feeding Nine Billion", pages: "32-39" },
  { id: 6, title: "Unit 6: Into the Information Age", pages: "40-47" },
  { id: 7, title: "Unit 7: Working Together for a Better World", pages: "48-55" },
  { id: 8, title: "Unit 8: Revision 2 (Units 5-7)", pages: "56-59" },
  { id: 9, title: "Unit 9: Literary Reader - Treasure Island", pages: "66-102" },
];

export const FALLBACK_BIOLOGY_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "بۆماوەزانی و یاساکانی مێندڵ", pages: "7-38" },
  { id: 2, title: "ترشە ناوەکییەکان (DNA و RNA) و کۆپیبوون", pages: "39-74" },
  { id: 3, title: "تەکنەلۆژیای جینات و ئەندازیاریی جیناتی", pages: "75-108" },
  { id: 4, title: "سیستەمی کۆئەندامی دەمار لە مرۆڤدا", pages: "109-146" },
  { id: 5, title: "کۆئەندامی هەستەکان (بینین و بیستن)", pages: "147-178" },
  { id: 6, title: "کۆئەندامی دەردانی هۆڕمۆنەکان (ڕژێنەکان)", pages: "179-212" },
  { id: 7, title: "زاوزێ و گەشەکردن لە مرۆڤدا", pages: "213-254" },
  { id: 8, title: "ژینگە و پەیوەندییە زیندەییەکان", pages: "255-292" },
];

export const FALLBACK_KURDISH_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "ڕێزمان (شێوازەکانی کار، چاوگی بوون، جێناوە لکاوەکان)", pages: "7-94" },
  { id: 2, title: "ئەدەب و ڕەخنە (قۆناغەکانی شیعری نوێ، ڕۆمان و چیرۆک)", pages: "95-150" },
  { id: 3, title: "ڕەوانبێژی (ڕەگەزدۆزی، لێکچوواندن، خواستن، دژەیەک)", pages: "151-172" },
  { id: 4, title: "خوێندنەوە و شیکردنەوەی دەقە ئەدەبییەکان", pages: "173-183" },
];

export const FALLBACK_ARABIC_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "الوحدة الأولى: الرومنسية في الأدب العربي وقواعد النحو", pages: "7-26" },
  { id: 2, title: "الوحدة الثانية: الواقعية في الأدب، التمييز والتعجب", pages: "27-48" },
  { id: 3, title: "الوحدة الثالثة: الأدب الأندلسي، الحال والاستعارة", pages: "49-74" },
  { id: 4, title: "الوحدة الرابعة: عصر صدر الإسلام والعصر الأموي والمدح والذم", pages: "7-20" },
  { id: 5, title: "الوحدة الخامسة: العصر العباسي وأسلوب التوكيد", pages: "21-30" },
  { id: 6, title: "الوحدة السادسة: الشعر العربي الحديث وأحكام العدد", pages: "31-38" },
];

// ============================================================================
// GRADE 9 CANONICAL OUTLINES
// ============================================================================
export const GRADE_9_MATH_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "جەبر، نەخشەکان و ژمارە ڕاستەقینەکان", pages: "7-36" },
  { id: 2, title: "شیکارکردنی هاوکێشە و نایەکسانییە هێڵییەکان", pages: "37-68" },
  { id: 3, title: "نەخشە هێڵییەکان و لێژی", pages: "69-102" },
  { id: 4, title: "کۆمەڵە هاوکێشە و نایەکسانییە هێڵییەکان", pages: "103-134" },
  { id: 5, title: "توانا و نەخشە توانییەکان", pages: "135-166" },
  { id: 6, title: "فرەجاکان و شیکردنەوە بۆ هۆکارەکان", pages: "167-202" },
  { id: 7, title: "نەخشە پلە دووەکان و هاوکێشەکانیان", pages: "203-236" },
  { id: 8, title: "ئەندازە، ڕووبەر، و قەبارە", pages: "237-264" },
  { id: 9, title: "ئامار و ڕێژەی ئەگەر", pages: "265-292" },
];

export const GRADE_9_SCIENCE_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "بونیاتی ماددە و خشتەی خولی (کیمیا)", pages: "7-52" },
  { id: 2, title: "بەستەرە کیمیاییەکان و ترش و تفت (کیمیا)", pages: "53-98" },
  { id: 3, title: "جووڵە، خێرایی و یاساکانی نیوتن (فیزیا)", pages: "99-146" },
  { id: 4, title: "کار، وزە و ئامێرە سادەکان (فیزیا)", pages: "147-192" },
  { id: 5, title: "شەپۆلەکان، دەنگ و ڕووناکی (فیزیا)", pages: "193-240" },
  { id: 6, title: "خانە، دابەشبوون و بۆماوەزانی (زیندەزانی)", pages: "241-290" },
  { id: 7, title: "زەویناسی، کەشوهەوا و ژینگە (زانستی زەوی)", pages: "291-340" },
];

export const GRADE_9_ENGLISH_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "Unit 1: Welcoming the Future", pages: "4-13" },
  { id: 2, title: "Unit 2: World Discoveries & History", pages: "14-23" },
  { id: 3, title: "Unit 3: Protecting the Natural World", pages: "24-33" },
  { id: 4, title: "Unit 4: Revision 1", pages: "34-39" },
  { id: 5, title: "Unit 5: Inventions, Media & Technology", pages: "40-49" },
  { id: 6, title: "Unit 6: Healthy Life & Sports Adventures", pages: "50-59" },
  { id: 7, title: "Unit 7: Travel, Cities & Famous Landmarks", pages: "60-69" },
  { id: 8, title: "Unit 8: Revision 2 & Exam Prep", pages: "70-79" },
];

export const GRADE_9_ARABIC_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "الوحدة الأولى: النصوص القرائية وقواعد الجملة الاسمية", pages: "5-34" },
  { id: 2, title: "الوحدة الثانية: كان وأخواتها وتطبيقاتها الإعرابية", pages: "35-62" },
  { id: 3, title: "الوحدة الثالثة: إنّ وأخواتها والحروف الناسخة", pages: "63-90" },
  { id: 4, title: "الوحدة الرابعة: الإملاء والتعبير الإنشائي", pages: "91-118" },
];

export const GRADE_9_KURDISH_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "بەشی ١: خۆناسین و پەرەپێدانی کەسایەتی", pages: "7-28" },
  { id: 2, title: "بەشی ٢: کارامەییەکانی پەیوەندی و چارەسەری کێشەکان", pages: "29-50" },
  { id: 3, title: "بەشی ٣: هاوڵاتیبوون، لێبوردەیی و بەها مرۆییەکان", pages: "51-70" },
  { id: 4, title: "بەشی ٤: تەندروستی دەروونی و پاراستنی ژینگە", pages: "71-92" },
];

// ============================================================================
// GRADE 10 CANONICAL OUTLINES
// ============================================================================
export const GRADE_10_PHYSICS_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "جووڵە لەسەر ڕێڕەوی ڕاست", pages: "7-42" },
  { id: 2, title: "ئاڕاستەبڕەکان و هێزەکان", pages: "43-80" },
  { id: 3, title: "یاساکانی نیوتن بۆ جووڵە", pages: "81-120" },
  { id: 4, title: "کار و وزە و توان", pages: "121-156" },
  { id: 5, title: "میکانیکی شلەکان و پەستان", pages: "157-190" },
  { id: 6, title: "گەرمی و پلەی گەرمی", pages: "191-222" },
];

export const GRADE_10_BIOLOGY_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "ژینگە و کۆمەڵگە زیندەییەکان", pages: "7-36" },
  { id: 2, title: "کیمیای ژیان و گەردە ئەندامییەکان", pages: "37-66" },
  { id: 3, title: "پەردەی خانە و گواستنەوەی ماددەکان", pages: "67-96" },
  { id: 4, title: "ڕۆشنەپێکهاتن و هەناسەدانی خانەیی", pages: "97-124" },
  { id: 5, title: "دابەشبوونی خانە و سووڕی خانەیی", pages: "125-154" },
  { id: 6, title: "بنەما سەرەتاییەکانی بۆماوەزانی", pages: "155-182" },
];

export const GRADE_10_MATH_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "نەخشە دووجاکان و هاوکێشەی پلە دوو", pages: "7-45" },
  { id: 2, title: "پۆلینۆمیاڵ و دابەشکردنی فرەجاکان", pages: "46-85" },
  { id: 3, title: "سێگۆشەزانی و ڕێژە سێگۆشەییەکان", pages: "86-125" },
  { id: 4, title: "ئەندازەی تەخت و بازنەکان", pages: "126-160" },
  { id: 5, title: "ئامار و لادانی پێوانەیی", pages: "161-190" },
  { id: 6, title: "ئەگەری سادە و لێکدراو", pages: "191-215" },
];

export const GRADE_10_CHEMISTRY_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "خشتەی خولیی توخمەکان و ڕێکخستنی ئەلیکترۆنی", pages: "7-40" },
  { id: 2, title: "بەستەری کیمیایی و شێوەی گەردەکان", pages: "41-75" },
  { id: 3, title: "کارلێکە کیمیاییەکان لە گیراوە ئاوییەکاندا", pages: "76-110" },
  { id: 4, title: "حیساباتی مۆڵ و یاساکانی گازەکان", pages: "111-145" },
  { id: 5, title: "هاوسەنگیی کارلێکە کیمیاییەکان", pages: "146-175" },
];

export const GRADE_10_ENGLISH_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "Unit 1: People, Identity & Daily Life", pages: "4-21" },
  { id: 2, title: "Unit 2: The Living Planet & Environment", pages: "22-39" },
  { id: 3, title: "Unit 3: Science, Discoveries & Modern Tech", pages: "40-57" },
  { id: 4, title: "Unit 4: Mass Media & Global Communication", pages: "58-75" },
  { id: 5, title: "Unit 5: Health, Fitness & Balanced Living", pages: "76-93" },
  { id: 6, title: "Unit 6: Culture, Heritage & Creative Arts", pages: "94-111" },
];

// ============================================================================
// GRADE 11 CANONICAL OUTLINES
// ============================================================================
export const GRADE_11_MATH_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "ژمارە ئاوێتەکان و نەخشە پلە دووەکان", pages: "7-54" },
  { id: 2, title: "نەخشە فرەجاکان و نەخشە ڕێژەییەکان", pages: "55-102" },
  { id: 3, title: "ڕێژە و هاوکێشە سێگۆشەییەکان", pages: "103-158" },
  { id: 4, title: "نەخشە توانییەکان و لۆگاریتمەکان", pages: "159-210" },
  { id: 5, title: "یەکبەدوایەکەکان و زنجیرەکان", pages: "211-262" },
  { id: 6, title: "ڕێژەی ئەگەری و شیکاری پێکهاتەیی", pages: "263-314" },
  { id: 7, title: "ئەندازەی شیکاری و بڕگە قوچەکییەکان", pages: "315-368" },
  { id: 8, title: "ئامار و لادانی پێوانەیی", pages: "369-418" },
];

export const GRADE_11_PHYSICS_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "پێوانەکردن و بیردۆزی ئاڕاستەبڕەکان", pages: "7-34" },
  { id: 2, title: "جووڵە لە یەک ڕەهەنددا", pages: "35-64" },
  { id: 3, title: "جووڵە لە دوو ڕەهەنددا و فڕێدراوەکان", pages: "65-96" },
  { id: 4, title: "هێز و یاساکانی جووڵەی نیوتن", pages: "97-128" },
  { id: 5, title: "کار، توانا و وزە", pages: "129-160" },
  { id: 6, title: "تەوژمی هێڵی و بەیەکدادان", pages: "161-192" },
  { id: 7, title: "جووڵەی خولاوەیی و هێزی چەقڕاکێش", pages: "193-224" },
  { id: 8, title: "میکانیکی شلەکان و پەستان", pages: "225-256" },
  { id: 9, title: "گەرمی و پلەی گەرمی", pages: "257-286" },
  { id: 10, title: "لەرزین، شەپۆلەکان و دەنگ", pages: "287-316" },
];

export const GRADE_11_CHEMISTRY_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "کارلێکە کیمیاییەکان و هاوکێشە کیمیاییەکان", pages: "7-36" },
  { id: 2, title: "حیساباتی کیمیایی (Stoichiometry)", pages: "37-56" },
  { id: 3, title: "دۆخەکانی ماددە و هێزە نێوان گەردییەکان", pages: "57-88" },
  { id: 4, title: "یاساکانی گازەکان", pages: "89-116" },
  { id: 5, title: "گیراوەکان و خەستی", pages: "117-144" },
  { id: 6, title: "ئایۆنەکان لە ئاوەگیراوەکاندا", pages: "145-174" },
  { id: 7, title: "ترشەکان و تفتەکان و تیتراسیۆن", pages: "175-212" },
];

export const GRADE_11_BIOLOGY_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "پێکهاتەی خانە و پەردەی خانەیی", pages: "7-32" },
  { id: 2, title: "ڕۆشنەپێکهاتن و وزەی ڕۆشنایی", pages: "33-58" },
  { id: 3, title: "هەناسەدانی خانەیی و دەرهێنانی وزە", pages: "59-84" },
  { id: 4, title: "دابەشبوونی خانە - میتۆسیس و مایۆسیس", pages: "85-112" },
  { id: 5, title: "بەکتریا و ڤایرۆسەکان", pages: "113-138" },
  { id: 6, title: "جیهانی ڕووەکەکان و پێکهاتەیان", pages: "139-164" },
  { id: 7, title: "جۆراوجۆری زیندەیی و کۆئەندامەکان", pages: "165-190" },
];

export const GRADE_11_ENGLISH_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "Unit 1: The World Around Us", pages: "4-13" },
  { id: 2, title: "Unit 2: Looking Back", pages: "14-23" },
  { id: 3, title: "Unit 3: Breakthroughs & Technology", pages: "24-33" },
  { id: 4, title: "Unit 4: Revision 1", pages: "34-39" },
  { id: 5, title: "Unit 5: Culture & Traditions", pages: "40-49" },
  { id: 6, title: "Unit 6: Future of Work & Energy", pages: "50-59" },
  { id: 7, title: "Unit 7: Health & Lifestyle", pages: "60-69" },
  { id: 8, title: "Unit 8: Revision 2", pages: "70-75" },
];

export const GRADE_11_ARABIC_CHAPTERS: ChapterOutlineItem[] = [
  { id: 1, title: "الوحدة الأولى: النصوص الأدبية، أحكام العدد والمعدود", pages: "5-32" },
  { id: 2, title: "الوحدة الثانية: أدب العصر العباسي، المشتقات وعملها", pages: "33-60" },
  { id: 3, title: "الوحدة الثالثة: الأدب الحديث، الممنوع من الصرف", pages: "61-88" },
  { id: 4, title: "الوحدة الرابعة: البلاغة العربية وتطبيقاتها", pages: "89-116" },
  { id: 5, title: "الوحدة الخامسة: المراجعة الشاملة وتطبيقات الإعراب", pages: "117-143" },
];

// ============================================================================
// DYNAMIC GRADE & SUBJECT RESOLVER
// ============================================================================
export function getChapterOutlineForSubject(
  subject: string,
  grade: string | number = "12"
): ChapterOutlineItem[] {
  const normSubj = (subject || "chemistry").toLowerCase().trim();
  const normGrade = String(grade || "12").trim();

  // --- GRADE 9 ---
  if (normGrade === "9") {
    if (normSubj === "math" || normSubj === "mathematics") return GRADE_9_MATH_CHAPTERS;
    if (normSubj === "chemistry" || normSubj === "science") return GRADE_9_SCIENCE_CHAPTERS;
    if (normSubj === "physics") return GRADE_9_SCIENCE_CHAPTERS.slice(2, 5);
    if (normSubj === "biology") return GRADE_9_SCIENCE_CHAPTERS.slice(5, 7);
    if (normSubj === "english") return GRADE_9_ENGLISH_CHAPTERS;
    if (normSubj === "arabic") return GRADE_9_ARABIC_CHAPTERS;
    if (normSubj === "kurdish") return GRADE_9_KURDISH_CHAPTERS;
    return GRADE_9_SCIENCE_CHAPTERS;
  }

  // --- GRADE 10 ---
  if (normGrade === "10") {
    if (normSubj === "physics") return GRADE_10_PHYSICS_CHAPTERS;
    if (normSubj === "biology") return GRADE_10_BIOLOGY_CHAPTERS;
    if (normSubj === "math" || normSubj === "mathematics") return GRADE_10_MATH_CHAPTERS;
    if (normSubj === "chemistry") return GRADE_10_CHEMISTRY_CHAPTERS;
    if (normSubj === "english") return GRADE_10_ENGLISH_CHAPTERS;
    if (normSubj === "arabic") return GRADE_9_ARABIC_CHAPTERS;
    if (normSubj === "kurdish") return FALLBACK_KURDISH_CHAPTERS;
    return GRADE_10_PHYSICS_CHAPTERS;
  }

  // --- GRADE 11 ---
  if (normGrade === "11") {
    if (normSubj === "math" || normSubj === "mathematics") return GRADE_11_MATH_CHAPTERS;
    if (normSubj === "physics") return GRADE_11_PHYSICS_CHAPTERS;
    if (normSubj === "chemistry") return GRADE_11_CHEMISTRY_CHAPTERS;
    if (normSubj === "biology") return GRADE_11_BIOLOGY_CHAPTERS;
    if (normSubj === "english") return GRADE_11_ENGLISH_CHAPTERS;
    if (normSubj === "arabic") return GRADE_11_ARABIC_CHAPTERS;
    if (normSubj === "kurdish") return FALLBACK_KURDISH_CHAPTERS;
    return GRADE_11_MATH_CHAPTERS;
  }

  // --- GRADE 12 (DEFAULT) ---
  if (normSubj === "physics") return FALLBACK_PHYSICS_CHAPTERS;
  if (normSubj === "math" || normSubj === "mathematics") return FALLBACK_MATH_CHAPTERS;
  if (normSubj === "english") return FALLBACK_ENGLISH_CHAPTERS;
  if (normSubj === "biology") return FALLBACK_BIOLOGY_CHAPTERS;
  if (normSubj === "kurdish") return FALLBACK_KURDISH_CHAPTERS;
  if (normSubj === "arabic") return FALLBACK_ARABIC_CHAPTERS;
  return FALLBACK_CHEMISTRY_CHAPTERS;
}
