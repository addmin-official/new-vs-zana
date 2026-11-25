-- Cloudflare D1 Migration: 0006_users_and_curriculum_pages.sql
-- Establishes single source of truth for users and authentic curriculum pages

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  grade TEXT DEFAULT '12',
  stream TEXT DEFAULT 'scientific',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Populate users from existing authentic students table
INSERT OR REPLACE INTO users (id, email, name, role, grade, stream, created_at, last_active)
SELECT 
  id,
  COALESCE(email, id || '@zana.edu.krd') as email,
  COALESCE(name, 'قوتابی زانا') as name,
  'student' as role,
  COALESCE(grade, '12') as grade,
  'scientific' as stream,
  COALESCE(created_at, CURRENT_TIMESTAMP) as created_at,
  COALESCE(created_at, CURRENT_TIMESTAMP) as last_active
FROM students;

-- 2. Curriculum Pages table (authentic textbook pages extracted from curriculum)
CREATE TABLE IF NOT EXISTS curriculum_pages (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  chapter_title TEXT NOT NULL,
  lesson_title TEXT,
  extracted_text TEXT NOT NULL,
  source_pdf TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_curriculum_pages_subject_grade ON curriculum_pages(subject, grade);
CREATE INDEX IF NOT EXISTS idx_curriculum_pages_page ON curriculum_pages(subject, page_number);

-- Populate curriculum_pages from authentic textbook lessons in curriculum table
INSERT OR REPLACE INTO curriculum_pages (id, subject, grade, page_number, chapter_title, lesson_title, extracted_text, source_pdf, created_at)
SELECT 
  'cp-' || id as id,
  subject,
  CAST(grade AS TEXT) as grade,
  COALESCE(page_start, 1) as page_number,
  chapter_title_ku as chapter_title,
  lesson_title_ku as lesson_title,
  content_text as extracted_text,
  COALESCE(book_edition, subject || '_grade_' || grade || '.pdf') as source_pdf,
  created_at
FROM curriculum;
