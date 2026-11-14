import { CHEMISTRY_GRADE_12, CurriculumItem } from "./chemistry-grade12.ts";
import { PHYSICS_GRADE_12 } from "./physics-grade12.ts";
import { MATH_GRADE_12 } from "./math-grade12.ts";
import { ENGLISH_GRADE_12 } from "./english-grade12.ts";

export type { CurriculumItem };

export const ALL_REAL_CURRICULUM: CurriculumItem[] = [
  ...CHEMISTRY_GRADE_12,
  ...PHYSICS_GRADE_12,
  ...MATH_GRADE_12,
  ...ENGLISH_GRADE_12,
];

export function getCurriculumBySubject(subject: string, grade = 12): CurriculumItem[] {
  const norm = (subject || "").toLowerCase().trim();
  return ALL_REAL_CURRICULUM.filter(
    (item) => item.subject.toLowerCase() === norm && item.grade === Number(grade)
  );
}

export function getCurriculumLesson(lessonId: string): CurriculumItem | undefined {
  return ALL_REAL_CURRICULUM.find((item) => item.id === lessonId);
}
