-- Cloudflare D1 Migration: 0008_phone_auth_and_verifications.sql
-- Supports production-grade phone OTP verification and student phone number mapping

-- 1. Ensure phone column exists on students and users tables
ALTER TABLE students ADD COLUMN phone TEXT;
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);

ALTER TABLE users ADD COLUMN phone TEXT;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 2. Phone OTP Transaction Table
CREATE TABLE IF NOT EXISTS phone_verifications (
  id TEXT PRIMARY KEY,
  phone_hash TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  attempts_remaining INTEGER NOT NULL DEFAULT 3,
  expires_at INTEGER NOT NULL,
  cooldown_until INTEGER NOT NULL,
  verified_at INTEGER,
  consumed_at INTEGER,
  ip_address TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone_hash ON phone_verifications(phone_hash);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone_e164 ON phone_verifications(phone_e164);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires_at ON phone_verifications(expires_at);
