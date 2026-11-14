import { CurriculumSubject, CurriculumStream } from "../types.ts";

export const SUBJECT_LABELS: Record<CurriculumSubject, string> = {
  math: "بیرکاری",
  physics: "فیزیا",
  chemistry: "کیمیا",
  biology: "زیندەزانی",
  english: "ئینگلیزی",
  kurdish: "زمان و ئەدەبی کوردی",
  arabic: "زمانی عەرەبی",
  sports: "پەروەردەی وەرزشی",
  history: "مێژوو",
  economy: "ئابووری",
  geography: "جوگرافیا"
};

export const LITERARY_AVAILABLE_SUBJECTS: CurriculumSubject[] = ["math", "english"];
export const SCIENTIFIC_AVAILABLE_SUBJECTS: CurriculumSubject[] = ["math", "physics", "chemistry", "biology", "english", "arabic"];

export function getAvailableSubjectsForStream(stream?: CurriculumStream): CurriculumSubject[] {
  if (stream === "literary") {
    return ["math", "english"];
  }
  return ["math", "physics", "chemistry", "biology", "english", "arabic"];
}
