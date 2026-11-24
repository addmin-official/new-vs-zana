-- Cloudflare D1 Database Migration: 0009_student_onboarding_national_id.sql
-- ZANA Platform: Student Onboarding, School Name & National ID Privacy Protection

-- 1. Extend students table with school_name and protected national ID fields
ALTER TABLE students ADD COLUMN school_name TEXT;
ALTER TABLE students ADD COLUMN national_id_masked TEXT;
ALTER TABLE students ADD COLUMN national_id_hash TEXT;
ALTER TABLE students ADD COLUMN national_id_encrypted TEXT;

-- 2. Extend users table for unified query access
ALTER TABLE users ADD COLUMN school_name TEXT;
ALTER TABLE users ADD COLUMN national_id_masked TEXT;
ALTER TABLE users ADD COLUMN national_id_hash TEXT;

-- 3. Create indexes for efficient duplicate checking without exposing plaintext ID
CREATE INDEX IF NOT EXISTS idx_students_national_id_hash ON students(national_id_hash);
CREATE INDEX IF NOT EXISTS idx_users_national_id_hash ON users(national_id_hash);
