-- Migration 0002: Production Admin State, Approvals, Audit Chaining, and Preferences Persistence
-- Database: Cloudflare D1 (SQLite)

-- 1. Admin Execution Commands & Plans
CREATE TABLE IF NOT EXISTS admin_commands (
  command_id TEXT PRIMARY KEY,
  raw_command TEXT NOT NULL,
  intent TEXT NOT NULL,
  intent_ku TEXT NOT NULL,
  action_level INTEGER NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  requires_approval INTEGER NOT NULL DEFAULT 1,
  requires_dual_approval INTEGER NOT NULL DEFAULT 0,
  is_approved INTEGER NOT NULL DEFAULT 0,
  approved_by TEXT,
  approval_timestamp TEXT,
  current_phase TEXT NOT NULL DEFAULT 'plan',
  simulation_summary TEXT,
  simulation_summary_ku TEXT,
  result_report TEXT,
  result_report_ku TEXT,
  rollback_available INTEGER NOT NULL DEFAULT 0,
  rollback_plan_summary TEXT,
  rollback_plan_summary_ku TEXT,
  rollback_triggered INTEGER NOT NULL DEFAULT 0,
  rollback_success INTEGER NOT NULL DEFAULT 0,
  affected_files TEXT, -- JSON array of file paths
  steps_json TEXT NOT NULL, -- JSON array of PlanStep objects
  dual_approval_state TEXT, -- JSON object of DualApprovalState
  is_executed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_commands_phase ON admin_commands(current_phase);
CREATE INDEX IF NOT EXISTS idx_admin_commands_created ON admin_commands(created_at);

-- 2. Command Approvals Log (Enforcing Distinct Approvers)
CREATE TABLE IF NOT EXISTS command_approvals (
  id TEXT PRIMARY KEY,
  command_id TEXT NOT NULL REFERENCES admin_commands(command_id) ON DELETE RESTRICT,
  approver_uid TEXT NOT NULL,
  approver_name TEXT NOT NULL,
  approver_role TEXT NOT NULL,
  approval_stage TEXT NOT NULL, -- 'primary' | 'secondary'
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  UNIQUE(command_id, approval_stage)
);

CREATE INDEX IF NOT EXISTS idx_command_approvals_command ON command_approvals(command_id);
CREATE INDEX IF NOT EXISTS idx_command_approvals_uid ON command_approvals(approver_uid);

-- 3. Command Execution Lifecycle Events
CREATE TABLE IF NOT EXISTS command_execution_events (
  id TEXT PRIMARY KEY,
  command_id TEXT NOT NULL REFERENCES admin_commands(command_id) ON DELETE RESTRICT,
  phase TEXT NOT NULL,
  status TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_exec_events_command ON command_execution_events(command_id);

-- 4. Audit Log (Cryptographically Chained & Append-Only)
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  command_id TEXT NOT NULL,
  command_text TEXT NOT NULL,
  action_level INTEGER NOT NULL,
  tool_category TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  approved_by TEXT,
  dual_approved_by TEXT,
  execution_status TEXT NOT NULL,
  verification_passed INTEGER NOT NULL DEFAULT 1,
  rollback_eligible INTEGER NOT NULL DEFAULT 0,
  previous_hash TEXT NOT NULL,
  tamper_proof_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_command ON audit_log(command_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);

-- Enforce Strict Append-Only Invariants via SQLite Database Triggers
CREATE TRIGGER IF NOT EXISTS trg_prevent_audit_log_update
BEFORE UPDATE ON audit_log
BEGIN
  SELECT RAISE(FAIL, 'AUDIT_LOG_IMMUTABLE: Updates are strictly prohibited on the audit_log table.');
END;

CREATE TRIGGER IF NOT EXISTS trg_prevent_audit_log_delete
BEFORE DELETE ON audit_log
BEGIN
  SELECT RAISE(FAIL, 'AUDIT_LOG_IMMUTABLE: Deletions are strictly prohibited on the audit_log table.');
END;

-- 5. Admin Preferences Memory
CREATE TABLE IF NOT EXISTS admin_preferences (
  admin_id TEXT PRIMARY KEY,
  notification_frequency TEXT NOT NULL DEFAULT 'realtime',
  risk_tolerance_threshold INTEGER NOT NULL DEFAULT 50,
  reporting_style TEXT NOT NULL DEFAULT 'detailed',
  language_preference TEXT NOT NULL DEFAULT 'bilingual',
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 6. Rollback Pre-State Snapshots
CREATE TABLE IF NOT EXISTS rollback_snapshots (
  command_id TEXT PRIMARY KEY,
  target_path TEXT NOT NULL,
  previous_data TEXT NOT NULL, -- Serialized JSON of pre-execution state
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  restored_at TEXT
);

-- 7. Periodic Cryptographic Audit Checkpoints
CREATE TABLE IF NOT EXISTS audit_checkpoints (
  checkpoint_id TEXT PRIMARY KEY,
  latest_audit_id TEXT NOT NULL,
  entry_count INTEGER NOT NULL,
  head_hash TEXT NOT NULL,
  signature_or_hmac TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);
