-- Cloudflare D1 Migration: 0004_students_email.sql
-- Ensure email column on students table for student registration and admin dashboard

ALTER TABLE students ADD COLUMN email TEXT;
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
