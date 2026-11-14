// Production Schema Validation for ZANA Platform

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationErrorItem[];
}

export interface StudentInput {
  id?: string;
  name: string;
  grade: number;
  stream: "scientific" | "literary";
  email: string;
  password_hash?: string;
  avatar_url?: string;
  streak_days?: number;
  total_xp?: number;
  level?: "beginner" | "intermediate" | "advanced";
}

export function validateStudent(input: unknown): ValidationResult<StudentInput> {
  const errors: ValidationErrorItem[] = [];
  if (!input || typeof input !== "object") {
    return { success: false, errors: [{ field: "root", message: "تەنەکە نادروستە" }] };
  }

  const s = input as Partial<StudentInput>;

  if (!s.name || typeof s.name !== "string" || s.name.trim().length < 2) {
    errors.push({ field: "name", message: "ناوی قوتابی دەبێت لانیکەم لە دوو پیت پێکبێت." });
  }

  const validGrades = [9, 10, 11, 12];
  if (typeof s.grade !== "number" || !validGrades.includes(s.grade)) {
    errors.push({ field: "grade", message: "پۆلی خوێندن دەبێت ٩، ١٠، ١١، یان ١٢ بێت." });
  }

  if (s.stream !== "scientific" && s.stream !== "literary") {
    errors.push({ field: "stream", message: "بەشی خوێندن دەبێت زانستی یان وێژەیی بێت." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!s.email || typeof s.email !== "string" || !emailRegex.test(s.email)) {
    errors.push({ field: "email", message: "ئیمەیڵێکی دروست تۆمار بکە." });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name: s.name!.trim(),
      grade: s.grade!,
      stream: s.stream!,
      email: s.email!.toLowerCase().trim(),
      avatar_url: s.avatar_url,
      streak_days: s.streak_days ?? 0,
      total_xp: s.total_xp ?? 0,
      level: s.level ?? "beginner",
    },
  };
}

export interface CurriculumInput {
  id: string;
  subject: string;
  grade: number;
  chapter_number: number;
  chapter_title_ku: string;
  chapter_title_ar?: string;
  lesson_number: number;
  lesson_title_ku: string;
  content_text: string;
  page_start?: number;
  page_end?: number;
  book_edition?: string;
  learning_objectives: string[];
}

export function validateCurriculum(input: unknown): ValidationResult<CurriculumInput> {
  const errors: ValidationErrorItem[] = [];
  if (!input || typeof input !== "object") {
    return { success: false, errors: [{ field: "root", message: "داتای پەڕتووک نادروستە" }] };
  }

  const c = input as Partial<CurriculumInput>;

  if (!c.id || typeof c.id !== "string") {
    errors.push({ field: "id", message: "ناسنامەی وانە پێویستە." });
  }
  if (!c.subject || typeof c.subject !== "string") {
    errors.push({ field: "subject", message: "ناوی بابەت پێویستە." });
  }
  if (!c.chapter_title_ku || typeof c.chapter_title_ku !== "string") {
    errors.push({ field: "chapter_title_ku", message: "ناونیشانی بەش بە کوردی پێویستە." });
  }
  if (!c.lesson_title_ku || typeof c.lesson_title_ku !== "string") {
    errors.push({ field: "lesson_title_ku", message: "ناونیشانی وانە بە کوردی پێویستە." });
  }
  if (!c.content_text || typeof c.content_text !== "string" || c.content_text.length < 10) {
    errors.push({ field: "content_text", message: "ناوەڕۆکی وانەکە زۆر کورتە یان نییە." });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: c as CurriculumInput };
}

export interface AssessmentQuestionInput {
  id: string;
  subject: string;
  grade: number;
  chapter_id: string;
  question_text_ku: string;
  question_type: string;
  difficulty: string;
  options: string[];
  correct_answer: string;
  explanation_ku: string;
  points?: number;
}

export function validateAssessmentQuestion(input: unknown): ValidationResult<AssessmentQuestionInput> {
  const errors: ValidationErrorItem[] = [];
  if (!input || typeof input !== "object") {
    return { success: false, errors: [{ field: "root", message: "داتای پرسیار نادروستە" }] };
  }

  const q = input as Partial<AssessmentQuestionInput>;

  if (!q.id || typeof q.id !== "string") {
    errors.push({ field: "id", message: "ناسنامەی پرسیار پێویستە." });
  }
  if (!q.question_text_ku || typeof q.question_text_ku !== "string") {
    errors.push({ field: "question_text_ku", message: "دەقی پرسیار بە کوردی پێویستە." });
  }
  if (!Array.isArray(q.options) || q.options.length < 2) {
    errors.push({ field: "options", message: "هەڵبژاردنەکان دەبێت لانیکەم دوو بژاردە بن." });
  }
  if (!q.correct_answer || typeof q.correct_answer !== "string") {
    errors.push({ field: "correct_answer", message: "وەڵامی ڕاست پێویستە." });
  }
  if (q.options && q.correct_answer && !q.options.includes(q.correct_answer)) {
    errors.push({ field: "correct_answer", message: "وەڵامی ڕاست دەبێت لە ناو بژاردەکاندا هەبێت." });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: q as AssessmentQuestionInput };
}
