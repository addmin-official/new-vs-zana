export interface ChapterOutlineItem {
  id: number;
  title: string;
  pages: string;
  lessons?: { id: string; title: string; description?: string }[];
}

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

export function getChapterOutlineForSubject(subject: string): ChapterOutlineItem[] {
  const norm = (subject || "chemistry").toLowerCase().trim();
  if (norm === "physics") return FALLBACK_PHYSICS_CHAPTERS;
  if (norm === "math" || norm === "mathematics") return FALLBACK_MATH_CHAPTERS;
  if (norm === "english") return FALLBACK_ENGLISH_CHAPTERS;
  return FALLBACK_CHEMISTRY_CHAPTERS;
}
