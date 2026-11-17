-- Cloudflare D1 Migration: 003_payment_receipts.sql
-- FastPay Receipt Submission & Manual Activation System for ZANA Platform

CREATE TABLE IF NOT EXISTS payment_receipts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  student_name TEXT,
  student_email TEXT,
  student_phone TEXT,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('monthly', 'yearly')),
  amount TEXT NOT NULL,
  receipt_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  submitted_at INTEGER NOT NULL,
  reviewed_at INTEGER,
  reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_receipts_user ON payment_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_status ON payment_receipts(status);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_submitted ON payment_receipts(submitted_at DESC);
