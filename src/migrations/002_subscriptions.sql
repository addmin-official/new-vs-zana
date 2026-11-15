-- Cloudflare D1 Migration: 002_subscriptions.sql
-- 3-Day Free Trial Subscription System for ZANA Platform

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'expired')),
  trial_started_at INTEGER NOT NULL,
  trial_ends_at INTEGER NOT NULL,
  plan_id TEXT,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends_at ON subscriptions(trial_ends_at);
