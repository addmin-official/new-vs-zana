import { StudentGrade, AcademicStream, SubjectKey, StudentLevel } from "./studentTypes.ts";

export const GRADE_LABELS: Record<StudentGrade, string> = {
  "9": "پۆلی ٩",
  "10": "پۆلی ١٠",
  "11": "پۆلی ١١",
  "12": "پۆلی ١٢"
};

export const STREAM_LABELS: Record<AcademicStream, string> = {
  scientific: "زانستی",
  literary: "وێژەیی",
  general: "گشتی"
};

export const SUBJECT_LABELS: Record<SubjectKey, string> = {
  math: "بیرکاری",
  physics: "فیزیا",
  chemistry: "کیمیا",
  english: "ئینگلیزی",
  biology: "زیندەزانی",
  kurdish: "زمان و ئەدەبی کوردی",
  arabic: "زمانی عەرەبی",
  sports: "پەروەردەی وەرزشی",
  history: "مێژوو",
  economy: "ئابووری",
  geography: "جوگرافیا"
};

export const LITERARY_AVAILABLE_SUBJECTS: SubjectKey[] = ["kurdish", "arabic", "sports", "history", "economy", "geography", "math"];
export const SCIENTIFIC_AVAILABLE_SUBJECTS: SubjectKey[] = ["math", "physics", "chemistry", "english", "biology"];

export function getAvailableSubjectsForStream(stream?: AcademicStream): SubjectKey[] {
  if (stream === "literary") {
    return ["kurdish", "arabic", "sports", "history", "economy", "geography", "math"];
  }
  return ["math", "physics", "chemistry", "english", "biology"];
}

export const LEVEL_LABELS: Record<StudentLevel, string> = {
  beginner: "سەرەتا",
  intermediate: "مامناوەند",
  advanced: "پێشکەوتوو"
};

// Conversions to maintain backward compatibility with old database strings
export const LEVEL_MAP_TO_EN: Record<string, StudentLevel> = {
  "سەرەتا": "beginner",
  "مامناوەند": "intermediate",
  "پێشکەوتوو": "advanced",
  "beginner": "beginner",
  "intermediate": "intermediate",
  "advanced": "advanced"
};

export const LEVEL_MAP_TO_KU: Record<StudentLevel, string> = {
  beginner: "سەرەتا",
  intermediate: "مامناوەند",
  advanced: "پێشکەوتوو"
};

// Validation helpers
export function isValidGrade(value: unknown): value is StudentGrade {
  return typeof value === "string" && ["9", "10", "11", "12"].includes(value);
}

export function isValidStream(value: unknown): value is AcademicStream {
  return typeof value === "string" && ["scientific", "literary", "general"].includes(value);
}

export function isValidSubject(value: unknown): value is SubjectKey {
  return typeof value === "string" && ["math", "physics", "chemistry", "english", "biology", "kurdish", "arabic", "sports", "history", "economy", "geography"].includes(value);
}

export function isValidLevel(value: unknown): value is StudentLevel {
  return typeof value === "string" && ["beginner", "intermediate", "advanced"].includes(value);
}

export function sanitizeStudentName(name: string | null | undefined): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (trimmed.length > 60) {
    return trimmed.substring(0, 60);
  }
  return trimmed;
}

export function getValidatedGrade(value: unknown): StudentGrade {
  return isValidGrade(value) ? value : "12";
}

export function getValidatedStream(value: unknown): AcademicStream {
  return isValidStream(value) ? value : "general";
}

export const SUBJECT_MAP_TO_EN: Record<string, SubjectKey> = {
  "بیرکاری": "math",
  "فیزیا": "physics",
  "کیمیا": "chemistry",
  "ئینگلیزی": "english",
  "زیندەزانی": "biology",
  "کوردی": "kurdish",
  "زمان و ئەدەبی کوردی": "kurdish",
  "عەرەبی": "arabic",
  "زمانی عەرەبی": "arabic",
  "وەرزش": "sports",
  "پەروەردەی وەرزشی": "sports",
  "sports": "sports",
  "pe": "sports",
  "مێژوو": "history",
  "history": "history",
  "ئابووری": "economy",
  "ئابوری": "economy",
  "economy": "economy",
  "economics": "economy",
  "جوگرافیا": "geography",
  "جوگرافیای ئابووری": "geography",
  "geography": "geography",
  "math": "math",
  "physics": "physics",
  "chemistry": "chemistry",
  "english": "english",
  "biology": "biology",
  "kurdish": "kurdish",
  "arabic": "arabic",
};

export function getValidatedSubject(value: unknown): SubjectKey {
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (SUBJECT_MAP_TO_EN[trimmed]) {
      return SUBJECT_MAP_TO_EN[trimmed];
    }
    if (trimmed.includes("کیمیا")) return "chemistry";
    if (trimmed.includes("فیزیا")) return "physics";
    if (trimmed.includes("بیرکاری")) return "math";
    if (trimmed.includes("ئینگلیزی")) return "english";
    if (trimmed.includes("زیندەزانی") || trimmed.includes("بایۆلۆجی")) return "biology";
    if (trimmed.includes("کوردی")) return "kurdish";
    if (trimmed.includes("عەرەبی") || trimmed.includes("عربی") || trimmed.includes("arabic")) return "arabic";
    if (trimmed.includes("وەرزش") || trimmed.includes("sports") || trimmed.includes("pe")) return "sports";
    if (trimmed.includes("مێژوو") || trimmed.includes("history")) return "history";
    if (trimmed.includes("ئابووری") || trimmed.includes("ئابوری") || trimmed.includes("economy") || trimmed.includes("economics")) return "economy";
    if (trimmed.includes("جوگرافیا") || trimmed.includes("geography")) return "geography";
  }
  return isValidSubject(value) ? value : "chemistry";
}

export function getValidatedLevel(value: unknown): StudentLevel {
  if (typeof value === "string") {
    const mapped = LEVEL_MAP_TO_EN[value];
    if (mapped) return mapped;
  }
  return isValidLevel(value) ? value : "beginner";
}
