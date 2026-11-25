-- Cloudflare D1 Migration: 0005_notifications.sql
-- Authoritative relational storage for in-app notifications and student preferences

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_label TEXT,
  action_url TEXT,
  created_at INTEGER NOT NULL,
  read_at INTEGER,
  priority TEXT NOT NULL DEFAULT 'normal',
  deduplication_key TEXT UNIQUE NOT NULL,
  expires_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(student_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_dedup ON notifications(deduplication_key);

CREATE TABLE IF NOT EXISTS notification_preferences (
  student_id TEXT PRIMARY KEY,
  in_app_enabled INTEGER NOT NULL DEFAULT 1,
  daily_reminder_time TEXT NOT NULL DEFAULT '18:00',
  quiet_hours_start TEXT NOT NULL DEFAULT '22:00',
  quiet_hours_end TEXT NOT NULL DEFAULT '07:00',
  plan_reminders_enabled INTEGER NOT NULL DEFAULT 1,
  next_best_action_enabled INTEGER NOT NULL DEFAULT 1,
  deadlines_enabled INTEGER NOT NULL DEFAULT 1,
  task_recovery_enabled INTEGER NOT NULL DEFAULT 1,
  achievements_enabled INTEGER NOT NULL DEFAULT 1,
  weak_concept_enabled INTEGER NOT NULL DEFAULT 1,
  assessment_enabled INTEGER NOT NULL DEFAULT 1,
  system_enabled INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);
