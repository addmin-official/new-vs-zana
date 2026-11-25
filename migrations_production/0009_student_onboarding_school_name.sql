-- Cloudflare D1 Database Migration: 0009_student_onboarding_school_name.sql
-- ZANA Platform: Student Onboarding School Name (National ID columns intentionally excluded)

ALTER TABLE students ADD COLUMN school_name TEXT;
ALTER TABLE users ADD COLUMN school_name TEXT;
