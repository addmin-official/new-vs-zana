import { D1ExecLike, runMigrations } from "./migrations.ts";
import { ALL_REAL_CURRICULUM } from "../data/curriculum/index.ts";
import { REAL_ASSESSMENT_QUESTIONS } from "../data/assessments/curriculum-questions.ts";
import { REAL_VIRTUAL_LAB_EXPERIMENTS } from "../data/labs/virtual-lab-experiments.ts";

export interface SeedResult {
  success: boolean;
  curriculumInserted: number;
  questionsInserted: number;
  labsInserted: number;
  errors: string[];
}

export async function seedDatabase(db: D1ExecLike): Promise<SeedResult> {
  const result: SeedResult = {
    success: true,
    curriculumInserted: 0,
    questionsInserted: 0,
    labsInserted: 0,
    errors: [],
  };

  // 1. Ensure tables exist
  const migrationRes = await runMigrations(db);
  if (!migrationRes.success) {
    result.errors.push(...migrationRes.errors);
  }

  // 2. Seed Curriculum
  for (const item of ALL_REAL_CURRICULUM) {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO curriculum (
          id, subject, grade, chapter_number, chapter_title_ku, chapter_title_ar,
          lesson_number, lesson_title_ku, content_text, page_start, page_end,
          book_edition, learning_objectives
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      await stmt.bind(
        item.id,
        item.subject,
        item.grade,
        item.chapter_number,
        item.chapter_title_ku,
        item.chapter_title_ar || null,
        item.lesson_number,
        item.lesson_title_ku,
        item.content_text,
        item.page_start || null,
        item.page_end || null,
        item.book_edition || null,
        JSON.stringify(item.learning_objectives || [])
      ).run();
      result.curriculumInserted++;
    } catch (err: unknown) {
      result.errors.push(`Curriculum insert failed (${item.id}): ${(err as Error).message}`);
    }
  }

  // 3. Seed Assessment Questions
  for (const q of REAL_ASSESSMENT_QUESTIONS) {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO assessment_questions (
          id, subject, grade, chapter_id, question_text_ku, question_type,
          difficulty, options, correct_answer, explanation_ku, explanation_ar,
          image_url, points
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      await stmt.bind(
        q.id,
        q.subject,
        q.grade,
        q.chapter_id,
        q.question_text_ku,
        q.question_type,
        q.difficulty,
        JSON.stringify(q.options),
        q.correct_answer,
        q.explanation_ku,
        q.explanation_ar || null,
        q.image_url || null,
        q.points || 10
      ).run();
      result.questionsInserted++;
    } catch (err: unknown) {
      result.errors.push(`Question insert failed (${q.id}): ${(err as Error).message}`);
    }
  }

  // 4. Seed Virtual Lab Experiments
  for (const lab of REAL_VIRTUAL_LAB_EXPERIMENTS) {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO virtual_lab_experiments (
          id, subject, grade, title_ku, description_ku, simulation_type,
          parameters_config, safety_warnings_ku, real_world_application_ku
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      await stmt.bind(
        lab.id,
        lab.subject,
        lab.grade,
        lab.title_ku,
        lab.description_ku,
        lab.simulation_type,
        JSON.stringify(lab.parameters_config),
        lab.safety_warnings_ku,
        lab.real_world_application_ku
      ).run();
      result.labsInserted++;
    } catch (err: unknown) {
      result.errors.push(`Lab insert failed (${lab.id}): ${(err as Error).message}`);
    }
  }

  if (result.errors.length > 0) {
    result.success = false;
  }

  return result;
}
