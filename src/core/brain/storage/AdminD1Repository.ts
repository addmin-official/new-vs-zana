/**
 * D1 Persistence Repository for ZANA Admin Backend
 * Provides durable, typed SQL operations for Cloudflare D1 with local fallback.
 */

import type { AdminPreferenceMemory, AuditLogEntry, ExecutionPlan } from '../types.ts';

export interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement;
  run<T = unknown>(): Promise<{ success: boolean; error?: string; results?: T[]; meta?: { changes?: number; [k: string]: unknown } }>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  first<T = unknown>(colName?: string): Promise<T | null>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatement;
  batch?(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

export interface RollbackSnapshotRecord {
  commandId: string;
  targetPath: string;
  previousData: Record<string, unknown>;
  createdAt?: string;
  restoredAt?: string;
}

export interface AuditCheckpointRecord {
  checkpointId: string;
  latestAuditId: string;
  entryCount: number;
  headHash: string;
  signatureOrHmac: string;
  createdAt?: string;
}

export class AdminD1Repository {
  private db?: D1DatabaseLike;
  // In-memory fallback if D1 database binding is absent in local dev/tests
  private memoryCommands: Map<string, ExecutionPlan> = new Map();
  private memoryAuditLog: AuditLogEntry[] = [];
  private memorySnapshots: Map<string, RollbackSnapshotRecord> = new Map();
  private memoryPreferences: Map<string, AdminPreferenceMemory> = new Map();
  private memoryCheckpoints: AuditCheckpointRecord[] = [];

  constructor(db?: D1DatabaseLike) {
    this.db = db;
  }

  hasD1(): boolean {
    return Boolean(this.db);
  }

  async saveCommand(plan: ExecutionPlan): Promise<void> {
    this.memoryCommands.set(plan.commandId, JSON.parse(JSON.stringify(plan)) as ExecutionPlan);
    if (!this.db) return;

    await this.db.prepare(
      `INSERT OR REPLACE INTO admin_commands (
        command_id, raw_command, intent, intent_ku, action_level, risk_score, risk_level,
        requires_approval, requires_dual_approval, is_approved, approved_by, approval_timestamp,
        current_phase, simulation_summary, simulation_summary_ku, result_report, result_report_ku,
        rollback_available, rollback_plan_summary, rollback_plan_summary_ku, rollback_triggered,
        rollback_success, affected_files, steps_json, dual_approval_state, is_executed, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now'))`
    ).bind(
      plan.commandId,
      plan.rawCommand,
      plan.intent,
      plan.intentKu,
      plan.actionLevel,
      plan.riskAssessment.score,
      plan.riskAssessment.level,
      plan.requiresApproval ? 1 : 0,
      plan.requiresDualApproval ? 1 : 0,
      plan.isApproved ? 1 : 0,
      plan.approvedBy || null,
      plan.approvalTimestamp || null,
      plan.currentPhase,
      plan.simulationSummary || null,
      plan.simulationSummaryKu || null,
      plan.resultReport || null,
      plan.resultReportKu || null,
      plan.rollbackAvailable ? 1 : 0,
      plan.rollbackPlanSummary || null,
      plan.rollbackPlanSummaryKu || null,
      plan.rollbackTriggered ? 1 : 0,
      plan.rollbackSuccess ? 1 : 0,
      plan.affectedFiles ? JSON.stringify(plan.affectedFiles) : null,
      JSON.stringify(plan.steps || []),
      plan.dualApproval ? JSON.stringify(plan.dualApproval) : null,
      plan.isExecuted ? 1 : 0
    ).run();
  }

  async getCommand(commandId: string): Promise<ExecutionPlan | null> {
    if (this.db) {
      const row = await this.db.prepare(
        `SELECT * FROM admin_commands WHERE command_id = ?`
      ).bind(commandId).first<Record<string, unknown>>();

      if (row) {
        return {
          commandId: String(row.command_id),
          rawCommand: String(row.raw_command),
          intent: String(row.intent),
          intentKu: String(row.intent_ku),
          actionLevel: Number(row.action_level) as never,
          riskAssessment: {
            score: Number(row.risk_score),
            level: String(row.risk_level) as never,
            actionLevel: Number(row.action_level) as never,
            reasons: [],
            requiresApproval: Boolean(row.requires_approval),
            requiresDualApproval: Boolean(row.requires_dual_approval),
            canRollback: true,
            impactedServices: [],
          },
          steps: row.steps_json ? JSON.parse(String(row.steps_json)) : [],
          simulationSummary: String(row.simulation_summary || ''),
          simulationSummaryKu: String(row.simulation_summary_ku || ''),
          requiresApproval: Boolean(row.requires_approval),
          requiresDualApproval: Boolean(row.requires_dual_approval),
          dualApproval: row.dual_approval_state ? JSON.parse(String(row.dual_approval_state)) : undefined,
          isApproved: Boolean(row.is_approved),
          approvedBy: row.approved_by ? String(row.approved_by) : undefined,
          approvalTimestamp: row.approval_timestamp ? String(row.approval_timestamp) : undefined,
          currentPhase: String(row.current_phase) as never,
          resultReport: row.result_report ? String(row.result_report) : undefined,
          resultReportKu: row.result_report_ku ? String(row.result_report_ku) : undefined,
          rollbackAvailable: Boolean(row.rollback_available),
          rollbackPlanSummary: String(row.rollback_plan_summary || ''),
          rollbackPlanSummaryKu: String(row.rollback_plan_summary_ku || ''),
          rollbackTriggered: Boolean(row.rollback_triggered),
          rollbackSuccess: Boolean(row.rollback_success),
          affectedFiles: row.affected_files ? JSON.parse(String(row.affected_files)) : undefined,
          isExecuted: Boolean(row.is_executed),
        };
      }
    }
    return this.memoryCommands.get(commandId) || null;
  }

  async appendAuditEvent(entry: AuditLogEntry): Promise<void> {
    // Unshift to memory mirror
    this.memoryAuditLog.unshift(JSON.parse(JSON.stringify(entry)) as AuditLogEntry);
    if (!this.db) return;

    await this.db.prepare(
      `INSERT INTO audit_log (
        id, timestamp, actor_id, actor_name, actor_role, command_id, command_text,
        action_level, tool_category, risk_score, risk_level, approved_by, dual_approved_by,
        execution_status, verification_passed, rollback_eligible, previous_hash, tamper_proof_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      entry.id,
      entry.timestamp,
      entry.actor.id,
      entry.actor.name,
      entry.actor.role,
      entry.commandId,
      entry.commandText,
      entry.actionLevel,
      entry.toolCategory,
      entry.riskScore,
      entry.riskLevel,
      entry.approvedBy || null,
      entry.dualApprovedBy || null,
      entry.executionStatus,
      entry.verificationPassed ? 1 : 0,
      entry.rollbackEligible ? 1 : 0,
      entry.previousHash,
      entry.tamperProofHash
    ).run();
  }

  async getAuditLog(limit = 100): Promise<AuditLogEntry[]> {
    if (this.db) {
      const { results } = await this.db.prepare(
        `SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?`
      ).bind(limit).all<Record<string, unknown>>();

      if (results && results.length > 0) {
        return results.map((r) => ({
          id: String(r.id),
          timestamp: String(r.timestamp),
          actor: {
            id: String(r.actor_id),
            name: String(r.actor_name),
            role: String(r.actor_role) as never,
          },
          commandId: String(r.command_id),
          commandText: String(r.command_text),
          actionLevel: Number(r.action_level) as never,
          toolCategory: String(r.tool_category) as never,
          riskScore: Number(r.risk_score),
          riskLevel: String(r.risk_level) as never,
          approvedBy: r.approved_by ? String(r.approved_by) : undefined,
          dualApprovedBy: r.dual_approved_by ? String(r.dual_approved_by) : undefined,
          executionStatus: String(r.execution_status) as never,
          verificationPassed: Boolean(r.verification_passed),
          rollbackEligible: Boolean(r.rollback_eligible),
          previousHash: String(r.previous_hash),
          tamperProofHash: String(r.tamper_proof_hash),
        }));
      }
    }
    return this.memoryAuditLog.slice(0, limit);
  }

  async saveSnapshot(commandId: string, targetPath: string, previousData: Record<string, unknown>): Promise<void> {
    const record: RollbackSnapshotRecord = {
      commandId,
      targetPath,
      previousData,
      createdAt: new Date().toISOString(),
    };
    this.memorySnapshots.set(commandId, record);
    if (!this.db) return;

    await this.db.prepare(
      `INSERT OR REPLACE INTO rollback_snapshots (command_id, target_path, previous_data, created_at)
       VALUES (?, ?, ?, ?)`
    ).bind(commandId, targetPath, JSON.stringify(previousData), record.createdAt).run();
  }

  async getSnapshot(commandId: string): Promise<RollbackSnapshotRecord | null> {
    if (this.db) {
      const row = await this.db.prepare(
        `SELECT * FROM rollback_snapshots WHERE command_id = ?`
      ).bind(commandId).first<Record<string, unknown>>();

      if (row) {
        return {
          commandId: String(row.command_id),
          targetPath: String(row.target_path),
          previousData: JSON.parse(String(row.previous_data)),
          createdAt: String(row.created_at || ''),
          restoredAt: row.restored_at ? String(row.restored_at) : undefined,
        };
      }
    }
    return this.memorySnapshots.get(commandId) || null;
  }

  async getPreferences(adminId?: string): Promise<AdminPreferenceMemory[]> {
    if (this.db) {
      const query = adminId
        ? `SELECT * FROM admin_preferences WHERE admin_id = ?`
        : `SELECT * FROM admin_preferences`;
      const stmt = adminId ? this.db.prepare(query).bind(adminId) : this.db.prepare(query);
      const { results } = await stmt.all<Record<string, unknown>>();
      if (results && results.length > 0) {
        return results.map((r) => ({
          id: `pref_${r.admin_id}`,
          type: 'preference' as const,
          adminId: String(r.admin_id),
          notificationFrequency: String(r.notification_frequency) as never,
          riskToleranceThreshold: Number(r.risk_tolerance_threshold),
          reportingStyle: String(r.reporting_style) as never,
          languagePreference: String(r.language_preference) as never,
          createdAt: String(r.created_at || new Date().toISOString()),
          updatedAt: String(r.updated_at || new Date().toISOString()),
          owner: String(r.admin_id),
          retentionDays: 180,
          accessLevel: 'admin' as const,
          reviewDate: '2027-01-01',
          confidentialRedacted: false,
        }));
      }
    }

    if (adminId) {
      const p = this.memoryPreferences.get(adminId);
      return p ? [p] : [];
    }
    return Array.from(this.memoryPreferences.values());
  }

  async upsertPreferences(
    prefOrAdminId: (Partial<AdminPreferenceMemory> & { adminId?: string }) | string,
    maybePrefs?: Partial<AdminPreferenceMemory>
  ): Promise<AdminPreferenceMemory> {
    const adminId = typeof prefOrAdminId === 'string' ? prefOrAdminId : prefOrAdminId.adminId || 'default_admin';
    const pref = typeof prefOrAdminId === 'object' ? prefOrAdminId : maybePrefs || {};
    const existing = (await this.getPreferences(adminId))[0];
    const updated: AdminPreferenceMemory = {
      id: `pref_${adminId}`,
      type: 'preference',
      adminId,
      notificationFrequency: pref.notificationFrequency ?? existing?.notificationFrequency ?? 'realtime',
      riskToleranceThreshold: pref.riskToleranceThreshold ?? existing?.riskToleranceThreshold ?? 50,
      reportingStyle: pref.reportingStyle ?? existing?.reportingStyle ?? 'detailed',
      languagePreference: pref.languagePreference ?? existing?.languagePreference ?? 'bilingual',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: adminId,
      retentionDays: 180,
      accessLevel: 'admin',
      reviewDate: '2027-01-01',
      confidentialRedacted: false,
    };

    this.memoryPreferences.set(adminId, updated);
    if (this.db) {
      await this.db.prepare(
        `INSERT INTO admin_preferences (admin_id, notification_frequency, risk_tolerance_threshold, reporting_style, language_preference, updated_at)
         VALUES (?, ?, ?, ?, ?, DATETIME('now'))
         ON CONFLICT(admin_id) DO UPDATE SET
           notification_frequency = excluded.notification_frequency,
           risk_tolerance_threshold = excluded.risk_tolerance_threshold,
           reporting_style = excluded.reporting_style,
           language_preference = excluded.language_preference,
           updated_at = DATETIME('now')`
      ).bind(
        updated.adminId,
        updated.notificationFrequency,
        updated.riskToleranceThreshold,
        updated.reportingStyle,
        updated.languagePreference
      ).run();
    }

    return updated;
  }

  async saveCheckpoint(cp: AuditCheckpointRecord): Promise<void> {
    this.memoryCheckpoints.unshift(cp);
    if (!this.db) return;

    await this.db.prepare(
      `INSERT OR REPLACE INTO audit_checkpoints (checkpoint_id, latest_audit_id, entry_count, head_hash, signature_or_hmac, created_at)
       VALUES (?, ?, ?, ?, ?, DATETIME('now'))`
    ).bind(cp.checkpointId, cp.latestAuditId, cp.entryCount, cp.headHash, cp.signatureOrHmac).run();
  }

  async getLatestCheckpoint(): Promise<AuditCheckpointRecord | null> {
    if (this.db) {
      const row = await this.db.prepare(
        `SELECT * FROM audit_checkpoints ORDER BY created_at DESC LIMIT 1`
      ).first<Record<string, unknown>>();
      if (row) {
        return {
          checkpointId: String(row.checkpoint_id),
          latestAuditId: String(row.latest_audit_id),
          entryCount: Number(row.entry_count),
          headHash: String(row.head_hash),
          signatureOrHmac: String(row.signature_or_hmac),
          createdAt: String(row.created_at),
        };
      }
    }
    return this.memoryCheckpoints[0] || null;
  }
}
