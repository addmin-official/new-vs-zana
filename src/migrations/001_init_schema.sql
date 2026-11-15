-- Cloudflare D1 Database Schema for ZANA Platform
-- Production Migration: 001_init_schema.sql

-- 1. Parents Table
CREATE TABLE IF NOT EXISTS parents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  student_id TEXT,
  language_preference TEXT DEFAULT 'ku',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  school_name TEXT NOT NULL,
  subjects_taught TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade INTEGER NOT NULL, -- 9, 10, 11, 12
  stream TEXT NOT NULL, -- 'scientific' or 'literary'
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  streak_days INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  parent_id TEXT REFERENCES parents(id),
  teacher_id TEXT REFERENCES teachers(id)
);

-- 4. Curriculum Table (KRG Ministry Data)
CREATE TABLE IF NOT EXISTS curriculum (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL, -- chemistry, physics, math, biology, english
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
  learning_objectives TEXT, -- JSON array of objectives
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Assessment Questions Table
CREATE TABLE IF NOT EXISTS assessment_questions (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  grade INTEGER NOT NULL,
  chapter_id TEXT REFERENCES curriculum(id),
  question_text_ku TEXT NOT NULL,
  question_type TEXT NOT NULL, -- mcq, true_false, numeric, matching, ordering, fill_blank
  difficulty TEXT NOT NULL, -- easy, medium, hard, expert
  options TEXT, -- JSON array for MCQ
  correct_answer TEXT NOT NULL,
  explanation_ku TEXT NOT NULL,
  explanation_ar TEXT,
  image_url TEXT,
  points INTEGER DEFAULT 10,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Virtual Lab Experiments Table
CREATE TABLE IF NOT EXISTS virtual_lab_experiments (
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
);

-- 7. Student Progress Table
CREATE TABLE IF NOT EXISTS student_progress (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  lesson_id TEXT NOT NULL REFERENCES curriculum(id),
  completed BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER DEFAULT 0,
  mastery_score REAL DEFAULT 0.0,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, lesson_id)
);

-- 8. Assessment Results Table
CREATE TABLE IF NOT EXISTS assessment_results (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  question_id TEXT NOT NULL REFERENCES assessment_questions(id),
  student_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  score_earned INTEGER DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  subject TEXT NOT NULL,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  message_text TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance & Indexing
CREATE INDEX IF NOT EXISTS idx_curriculum_subject_grade ON curriculum(subject, grade);
CREATE INDEX IF NOT EXISTS idx_curriculum_chapter ON curriculum(subject, grade, chapter_number);
CREATE INDEX IF NOT EXISTS idx_questions_subject_grade ON assessment_questions(subject, grade);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON assessment_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_student ON assessment_results(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
