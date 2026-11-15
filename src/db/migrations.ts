export interface D1ExecLike {
  exec(query: string): Promise<unknown>;
  prepare(query: string): {
    bind(...values: unknown[]): {
      all<T = unknown>(): Promise<{ results?: T[] }>;
      run(): Promise<unknown>;
    };
  };
}

export const INIT_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS parents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    student_id TEXT,
    language_preference TEXT DEFAULT 'ku',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    school_name TEXT NOT NULL,
    subjects_taught TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grade INTEGER NOT NULL,
    stream TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    streak_days INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    level TEXT DEFAULT 'beginner',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    parent_id TEXT REFERENCES parents(id),
    teacher_id TEXT REFERENCES teachers(id)
  )`,
  `CREATE TABLE IF NOT EXISTS curriculum (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    grade INTEGER NOT NULL,
    chapter_number INTEGER NOT NULL,
    chapter_title_ku TEXT NOT NULL,
    chapter_title_ar TEXT,
    lesson_number INTEGER NOT NULL,
    lesson_title_ku TEXT NOT NULL,
    content_text TEXT NOT NULL,
    page_start INTEGER,
    page_end INTEGER,
    book_edition TEXT,
    learning_objectives TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS assessment_questions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    grade INTEGER NOT NULL,
    chapter_id TEXT REFERENCES curriculum(id),
    question_text_ku TEXT NOT NULL,
    question_type TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    options TEXT,
    correct_answer TEXT NOT NULL,
    explanation_ku TEXT NOT NULL,
    explanation_ar TEXT,
    image_url TEXT,
    points INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS virtual_lab_experiments (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    grade INTEGER NOT NULL,
    title_ku TEXT NOT NULL,
    description_ku TEXT NOT NULL,
    simulation_type TEXT NOT NULL,
    parameters_config TEXT NOT NULL,
    safety_warnings_ku TEXT,
    real_world_application_ku TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS student_progress (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    time_spent_seconds INTEGER DEFAULT 0,
    mastery_score REAL DEFAULT 0.0,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, lesson_id)
  )`,
  `CREATE TABLE IF NOT EXISTS assessment_results (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    student_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    score_earned INTEGER DEFAULT 0,
    time_taken_seconds INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    message_text TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_curriculum_subject_grade ON curriculum(subject, grade)`,
  `CREATE INDEX IF NOT EXISTS idx_curriculum_chapter ON curriculum(subject, grade, chapter_number)`,
  `CREATE INDEX IF NOT EXISTS idx_questions_subject_grade ON assessment_questions(subject, grade)`,
  `CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON assessment_questions(difficulty)`,
  `CREATE INDEX IF NOT EXISTS idx_progress_student ON student_progress(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_assessment_results_student ON assessment_results(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id)`
];

export async function runMigrations(db: D1ExecLike): Promise<{ success: boolean; applied: number; errors: string[] }> {
  const errors: string[] = [];
  let applied = 0;

  for (const stmt of INIT_SCHEMA_STATEMENTS) {
    try {
      if (typeof db.exec === "function") {
        await db.exec(stmt);
      } else {
        await db.prepare(stmt).bind().run();
      }
      applied++;
    } catch (err: unknown) {
      errors.push(`Error executing: ${stmt.slice(0, 40)}... -> ${(err as Error).message}`);
    }
  }

  return {
    success: errors.length === 0,
    applied,
    errors
  };
}
