import { SUBJECTS_DATA } from "../../../data/subjects.ts";

export interface ChapterOutlineItem {
  id: number;
  title: string;
  pages: string;
  lessons?: { id: string; title: string; description?: string }[];
}

export interface D1ChapterRow {
  chapter_number?: number | string;
  id?: number | string;
  title?: string;
  pages?: string;
}

export interface D1DatabaseLike {
  prepare(query: string): {
    bind(...values: unknown[]): {
      all<T = D1ChapterRow>(): Promise<{ results?: T[] }>;
      first<T = unknown>(colName?: string): Promise<T | null>;
      run<T = unknown>(): Promise<{ success: boolean; meta?: unknown; results?: T[] }>;
    };
  };
}

export interface R2BucketLike {
  get(key: string): Promise<{ text(): Promise<string> } | null>;
}

export interface OutlineEnv {
  DB?: D1DatabaseLike;
  ZANA_CURRICULUM_BUCKET?: R2BucketLike;
  [key: string]: unknown;
}

export const CANONICAL_GRADE_12_CHEMISTRY_OUTLINE: ChapterOutlineItem[] = [
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

export const CANONICAL_GRADE_12_PHYSICS_OUTLINE: ChapterOutlineItem[] = [
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

export const CANONICAL_GRADE_12_MATH_OUTLINE: ChapterOutlineItem[] = [
  { id: 1, title: "وێنە ڕوونکردنەوەییەکان و نموونە هێڵییەکان", pages: "3-38" },
  { id: 2, title: "ئامانجەکان (Limits)", pages: "39-78" },
  { id: 3, title: "داتاشراو (Derivative)", pages: "79-116" },
  { id: 4, title: "جێبەجێکردنی داتاشراو (Applications of Differentiation)", pages: "117-158" },
  { id: 5, title: "تەواوکاری (Integration)", pages: "159-186" },
  { id: 6, title: "بڕگە قووچەکییەکان (Conic Sections)", pages: "187-214" },
  { id: 7, title: "ژمارە ئاوێتەکان و ئەندازە (Complex Numbers)", pages: "215-240" },
];

export const CANONICAL_GRADE_12_ENGLISH_OUTLINE: ChapterOutlineItem[] = [
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

export async function getCurriculumOutline(
  subject: string,
  grade: string,
  env?: OutlineEnv
): Promise<ChapterOutlineItem[]> {
  const normSubject = (subject || "").trim().toLowerCase();
  const normGrade = (grade || "").trim();

  // 1. Try D1 Database query if available
  if (env?.DB) {
    try {
      const stmt = env.DB.prepare(
        "SELECT id, chapter_number, title, pages FROM curriculum_chapters WHERE LOWER(subject) = ? AND grade = ? ORDER BY chapter_number ASC"
      );
      const res = await stmt.bind(normSubject, normGrade).all<D1ChapterRow>();
      if (res && Array.isArray(res.results) && res.results.length > 0) {
        return res.results.map((row: D1ChapterRow, idx: number) => ({
          id: Number(row.chapter_number) || Number(row.id) || (idx + 1),
          title: String(row.title),
          pages: String(row.pages || ""),
        }));
      }

      // Also try querying the curriculum table with group by chapter_number
      const stmt2 = env.DB.prepare(
        "SELECT chapter_number, chapter_title_ku as title, (MIN(page_start) || '-' || MAX(page_end)) as pages FROM curriculum WHERE LOWER(subject) = ? AND grade = ? GROUP BY chapter_number, chapter_title_ku ORDER BY chapter_number ASC"
      );
      const res2 = await stmt2.bind(normSubject, normGrade).all<D1ChapterRow>();
      if (res2 && Array.isArray(res2.results) && res2.results.length > 0) {
        return res2.results.map((row: D1ChapterRow, idx: number) => ({
          id: Number(row.chapter_number) || (idx + 1),
          title: String(row.title),
          pages: String(row.pages || ""),
        }));
      }
    } catch {
      // D1 query failed or table not found; proceed to R2
    }
  }

  // 2. Try R2 Bucket if available
  if (env?.ZANA_CURRICULUM_BUCKET) {
    try {
      const r2Key = `outlines/${normSubject}_${normGrade}.json`;
      const obj = await env.ZANA_CURRICULUM_BUCKET.get(r2Key);
      if (obj) {
        const text = await obj.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // R2 read failed; proceed to canonical fallback
    }
  }

  // 3. Fallback to Canonical Curriculum Outline
  if (normSubject === "chemistry" && normGrade === "12") {
    return CANONICAL_GRADE_12_CHEMISTRY_OUTLINE;
  }
  if (normSubject === "physics" && normGrade === "12") {
    return CANONICAL_GRADE_12_PHYSICS_OUTLINE;
  }
  if ((normSubject === "math" || normSubject === "mathematics") && normGrade === "12") {
    return CANONICAL_GRADE_12_MATH_OUTLINE;
  }
  if (normSubject === "english" && normGrade === "12") {
    return CANONICAL_GRADE_12_ENGLISH_OUTLINE;
  }

  // Look up in SUBJECTS_DATA
  const subjectData = SUBJECTS_DATA.find((s) => s.id.toLowerCase() === normSubject);
  const gradeChapters = subjectData?.grades[normGrade];

  if (gradeChapters && Array.isArray(gradeChapters) && gradeChapters.length > 0) {
    return gradeChapters
      .filter((c) => !c.id.includes("appendix") && !c.id.endsWith("-c13"))
      .map((c, idx) => {
        // Extract title and pages if present in format: "بەندی ١: ناونیشان (لاپەڕە ٨ - ٣٧)"
        const cleanTitleMatch = c.title.match(/(?:بەندی|بەشی)\s*[\d٠-٩]+:\s*([^(]+)/);
        const title = cleanTitleMatch ? cleanTitleMatch[1].trim() : c.title.trim();
        const pagesMatch = c.title.match(/لاپەڕە\s*([٠-٩0-9\s-]+)/);
        const pages = pagesMatch ? pagesMatch[1].replace(/\s+/g, "").trim() : "";

        return {
          id: idx + 1,
          title,
          pages,
          lessons: c.lessons,
        };
      });
  }

  return [];
}

export async function handleCurriculumOutlineRoute(
  request: Request,
  subject: string,
  grade: string,
  env?: OutlineEnv
): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const outline = await getCurriculumOutline(subject, grade, env);
    return new Response(JSON.stringify(outline), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to retrieve curriculum outline", detail: String(err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
