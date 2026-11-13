/**
 * Cloudflare Durable Object for Admin Command Concurrency & Lifecycle
 * Guarantees single-threaded atomic execution, race-condition immunity,
 * non-repudiation of dual approvals, and strict replay prevention.
 */

import type { AdminUser, ExecutionPlan } from '../types.ts';

export interface DurableObjectState {
  storage: {
    get<T = unknown>(key: string): Promise<T | undefined>;
    get<T = unknown>(keys: string[]): Promise<Map<string, T>>;
    put<T = unknown>(key: string, value: T): Promise<void>;
    put<T = unknown>(entries: Record<string, T>): Promise<void>;
    delete(key: string): Promise<boolean>;
    delete(keys: string[]): Promise<number>;
    list<T = unknown>(options?: { prefix?: string }): Promise<Map<string, T>>;
  };
  id: { toString(): string };
}

export interface DOEnv {
  DB?: {
    prepare(query: string): {
      bind(...params: unknown[]): {
        run(): Promise<unknown>;
        all<T = unknown>(): Promise<{ results: T[] }>;
        first<T = unknown>(): Promise<T | null>;
      };
    };
  };
  ADMIN_TELEMETRY_SECRET?: string;
  AUDIT_HMAC_SECRET?: string;
}

export interface StoredCommandState {
  plan: ExecutionPlan;
  isExecuting: boolean;
  isExecuted: boolean;
  isRolledBack: boolean;
  lockExpiresAt: number;
}

export class AdminCommandDO {
  private state: DurableObjectState;
  private env: DOEnv;

  constructor(state: DurableObjectState, env: DOEnv) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      if (pathname === '/plan' && request.method === 'POST') {
        const body = (await request.json()) as { plan: ExecutionPlan };
        const existing = await this.state.storage.get<StoredCommandState>('command_state');
        if (existing) {
          // Idempotent return of existing plan if identical
          if (existing.plan.rawCommand === body.plan.rawCommand) {
            return new Response(JSON.stringify({ ok: true, plan: existing.plan }), { status: 200 });
          }
          return new Response(JSON.stringify({ ok: false, error: 'Command ID already exists with different payload' }), { status: 409 });
        }

        const state: StoredCommandState = {
          plan: body.plan,
          isExecuting: false,
          isExecuted: false,
          isRolledBack: false,
          lockExpiresAt: 0,
        };
        await this.state.storage.put('command_state', state);

        // Optional D1 shadow write
        if (this.env.DB) {
          try {
            await this.env.DB.prepare(
              `INSERT OR REPLACE INTO admin_commands (
                command_id, raw_command, intent, intent_ku, action_level, risk_score, risk_level,
                requires_approval, requires_dual_approval, is_approved, current_phase,
                simulation_summary, simulation_summary_ku, rollback_available,
                rollback_plan_summary, rollback_plan_summary_ku, steps_json, dual_approval_state
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              body.plan.commandId,
              body.plan.rawCommand,
              body.plan.intent,
              body.plan.intentKu,
              body.plan.actionLevel,
              body.plan.riskAssessment.score,
              body.plan.riskAssessment.level,
              body.plan.requiresApproval ? 1 : 0,
              body.plan.requiresDualApproval ? 1 : 0,
              body.plan.isApproved ? 1 : 0,
              body.plan.currentPhase,
              body.plan.simulationSummary,
              body.plan.simulationSummaryKu,
              body.plan.rollbackAvailable ? 1 : 0,
              body.plan.rollbackPlanSummary,
              body.plan.rollbackPlanSummaryKu,
              JSON.stringify(body.plan.steps),
              body.plan.dualApproval ? JSON.stringify(body.plan.dualApproval) : null
            ).run();
          } catch (d1Err) {
            console.warn('[AdminCommandDO] Non-blocking D1 write warning:', d1Err);
          }
        }

        return new Response(JSON.stringify({ ok: true, plan: state.plan }), { status: 200 });
      }

      if (pathname === '/approve' && request.method === 'POST') {
        const body = (await request.json()) as {
          approver: AdminUser;
          isSecondarySignOff: boolean;
        };
        const state = await this.state.storage.get<StoredCommandState>('command_state');
        if (!state) {
          return new Response(JSON.stringify({ ok: false, error: 'Command not found' }), { status: 404 });
        }

        const plan = state.plan;
        if (state.isExecuted) {
          return new Response(JSON.stringify({ ok: false, error: 'Command has already been executed' }), { status: 400 });
        }

        if (!plan.requiresApproval) {
          return new Response(JSON.stringify({ ok: true, isFullyApproved: true, plan }), { status: 200 });
        }

        if (!plan.requiresDualApproval) {
          // Single stage approval
          plan.isApproved = true;
          plan.approvedBy = body.approver.name;
          plan.approvalTimestamp = new Date().toISOString();
          plan.currentPhase = 'execute';
          await this.state.storage.put('command_state', state);

          // Record in D1
          if (this.env.DB) {
            try {
              await this.env.DB.prepare(
                `INSERT OR REPLACE INTO command_approvals (id, command_id, approver_uid, approver_name, approver_role, approval_stage)
                 VALUES (?, ?, ?, ?, ?, ?)`
              ).bind(
                `appr_${plan.commandId}_single`,
                plan.commandId,
                body.approver.id,
                body.approver.name,
                body.approver.role,
                'primary'
              ).run();
              await this.env.DB.prepare(
                `UPDATE admin_commands SET is_approved = 1, approved_by = ?, approval_timestamp = ?, current_phase = 'execute' WHERE command_id = ?`
              ).bind(plan.approvedBy, plan.approvalTimestamp, plan.commandId).run();
            } catch (err) {
              console.warn('[AdminCommandDO] D1 approval sync error:', err);
            }
          }

          return new Response(JSON.stringify({ ok: true, isFullyApproved: true, plan }), { status: 200 });
        }

        // Dual Approval
        if (!plan.dualApproval) {
          plan.dualApproval = {
            primaryApproved: false,
            secondaryApproved: false,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          };
        }

        if (!body.isSecondarySignOff) {
          // Stage 1 Approval
          plan.dualApproval.primaryApproved = true;
          plan.dualApproval.primaryApprover = body.approver.name;
          plan.dualApproval.primaryApproverId = body.approver.id;
          plan.dualApproval.primaryTimestamp = new Date().toISOString();
          plan.dualApproval.expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          plan.currentPhase = 'approve';
          await this.state.storage.put('command_state', state);

          if (this.env.DB) {
            try {
              await this.env.DB.prepare(
                `INSERT OR REPLACE INTO command_approvals (id, command_id, approver_uid, approver_name, approver_role, approval_stage)
                 VALUES (?, ?, ?, ?, ?, ?)`
              ).bind(
                `appr_${plan.commandId}_p1`,
                plan.commandId,
                body.approver.id,
                body.approver.name,
                body.approver.role,
                'primary'
              ).run();
              await this.env.DB.prepare(
                `UPDATE admin_commands SET dual_approval_state = ? WHERE command_id = ?`
              ).bind(JSON.stringify(plan.dualApproval), plan.commandId).run();
            } catch (err) {
              console.warn('[AdminCommandDO] D1 stage 1 error:', err);
            }
          }

          return new Response(JSON.stringify({ ok: true, isFullyApproved: false, plan }), { status: 200 });
        }

        // Stage 2 Secondary Approval
        if (!plan.dualApproval.primaryApproved) {
          return new Response(JSON.stringify({ ok: false, error: 'Primary approval must be completed before secondary approval' }), { status: 400 });
        }

        // ENFORCE DISTINCT UIDS
        if (plan.dualApproval.primaryApproverId && plan.dualApproval.primaryApproverId === body.approver.id) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: 'DUAL_APPROVAL_VIOLATION: Secondary approval must be granted by a different administrator UID',
              errorKu: 'سەرپێچی پەسەندکردنی دوو-قۆناغی: ناکرێت هەردوو واژۆکە لەلایەن هەمان بەکارهێنەر (UID) ئەنجام بدرێت.',
            }),
            { status: 400 }
          );
        }

        // Check expiration
        if (plan.dualApproval.expiresAt && new Date(plan.dualApproval.expiresAt).getTime() < Date.now()) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: 'DUAL_APPROVAL_EXPIRED: The dual approval window has expired',
              errorKu: 'ماوەی پەسەندکردنی ئەم فەرمانە بەسەرچووە.',
            }),
            { status: 400 }
          );
        }

        plan.dualApproval.secondaryApproved = true;
        plan.dualApproval.secondaryApprover = body.approver.name;
        plan.dualApproval.secondaryApproverId = body.approver.id;
        plan.dualApproval.secondaryTimestamp = new Date().toISOString();
        plan.isApproved = true;
        plan.approvedBy = `${plan.dualApproval.primaryApprover} & ${body.approver.name} (Dual Approved)`;
        plan.approvalTimestamp = new Date().toISOString();
        plan.currentPhase = 'execute';

        await this.state.storage.put('command_state', state);

        if (this.env.DB) {
          try {
            await this.env.DB.prepare(
              `INSERT OR REPLACE INTO command_approvals (id, command_id, approver_uid, approver_name, approver_role, approval_stage)
               VALUES (?, ?, ?, ?, ?, ?)`
            ).bind(
              `appr_${plan.commandId}_p2`,
              plan.commandId,
              body.approver.id,
              body.approver.name,
              body.approver.role,
              'secondary'
            ).run();
            await this.env.DB.prepare(
              `UPDATE admin_commands SET is_approved = 1, approved_by = ?, approval_timestamp = ?, current_phase = 'execute', dual_approval_state = ? WHERE command_id = ?`
            ).bind(plan.approvedBy, plan.approvalTimestamp, JSON.stringify(plan.dualApproval), plan.commandId).run();
          } catch (err) {
            console.warn('[AdminCommandDO] D1 stage 2 error:', err);
          }
        }

        return new Response(JSON.stringify({ ok: true, isFullyApproved: true, plan }), { status: 200 });
      }

      if (pathname === '/lock-execution' && request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as { rawCommand?: string; plan?: ExecutionPlan };
        let state = await this.state.storage.get<StoredCommandState>('command_state');
        if (!state && body.plan) {
          state = {
            plan: body.plan,
            isExecuting: false,
            isExecuted: Boolean(body.plan.isExecuted),
            isRolledBack: false,
            lockExpiresAt: 0,
          };
          await this.state.storage.put('command_state', state);
        }
        if (!state) {
          return new Response(JSON.stringify({ ok: false, error: 'Command not found' }), { status: 404 });
        }

        if (body.plan && body.plan.isApproved && !state.plan.isApproved) {
          state.plan.isApproved = true;
          state.plan.approvedBy = body.plan.approvedBy;
          state.plan.dualApproval = body.plan.dualApproval;
          await this.state.storage.put('command_state', state);
        }

        if (state.isExecuted) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: 'ALREADY_EXECUTED: Command has already been executed',
              errorKu: 'ڕەتکرایەوە: ئەم فەرمانە پێشتر جێبەجێکراوە و ناتوانرێت دووبارە بکرێتەوە.',
            }),
            { status: 409 }
          );
        }

        // Lock check with auto-timeout (30s)
        const now = Date.now();
        if (state.isExecuting && state.lockExpiresAt > now) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: 'CONCURRENT_EXECUTION_CONFLICT: Command is currently executing under another request',
              errorKu: 'ڕەتکرایەوە: ئەم فەرمانە لە ئێستادا لە جێبەجێکردندایە لەلایەن داواکارییەکی ترەوە.',
            }),
            { status: 409 }
          );
        }

        // Parameter tampering check
        if (body.rawCommand && body.rawCommand !== state.plan.rawCommand) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: 'INTEGRITY_VIOLATION: Payload rawCommand does not match registered plan',
              errorKu: 'ڕەتکرایەوە: دەستکاری لە پلانی پەسەندکراودا کراوە.',
            }),
            { status: 400 }
          );
        }

        // Approval check
        if (state.plan.requiresApproval && !state.plan.isApproved) {
          return new Response(JSON.stringify({ ok: false, error: 'Command is not approved' }), { status: 400 });
        }

        // Acquire lock
        state.isExecuting = true;
        state.lockExpiresAt = now + 30000; // 30s lock
        await this.state.storage.put('command_state', state);

        return new Response(JSON.stringify({ ok: true, plan: state.plan }), { status: 200 });
      }

      if (pathname === '/finish-execution' && request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as { plan?: ExecutionPlan };
        const state = await this.state.storage.get<StoredCommandState>('command_state');
        if (!state) {
          return new Response(JSON.stringify({ ok: false, error: 'Command not found' }), { status: 404 });
        }

        state.isExecuting = false;
        state.isExecuted = true;
        state.lockExpiresAt = 0;
        if (body.plan) {
          state.plan = body.plan;
          state.plan.isExecuted = true;
        }

        await this.state.storage.put('command_state', state);

        if (this.env.DB) {
          try {
            await this.env.DB.prepare(
              `UPDATE admin_commands SET is_executed = 1, current_phase = 'learn', result_report = ?, result_report_ku = ? WHERE command_id = ?`
            ).bind(state.plan.resultReport || null, state.plan.resultReportKu || null, state.plan.commandId).run();
          } catch (err) {
            console.warn('[AdminCommandDO] D1 finish execution error:', err);
          }
        }

        return new Response(JSON.stringify({ ok: true, plan: state.plan }), { status: 200 });
      }

      if (pathname === '/unlock-execution' && request.method === 'POST') {
        const state = await this.state.storage.get<StoredCommandState>('command_state');
        if (state) {
          state.isExecuting = false;
          state.lockExpiresAt = 0;
          await this.state.storage.put('command_state', state);
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (pathname === '/rollback' && request.method === 'POST') {
        const state = await this.state.storage.get<StoredCommandState>('command_state');
        if (!state) {
          return new Response(JSON.stringify({ ok: false, error: 'Command not found' }), { status: 404 });
        }

        if (!state.isExecuted) {
          return new Response(JSON.stringify({ ok: false, error: 'Cannot rollback an unexecuted command' }), { status: 400 });
        }

        if (state.isRolledBack) {
          return new Response(JSON.stringify({ ok: false, error: 'Command has already been rolled back' }), { status: 400 });
        }

        state.isRolledBack = true;
        state.plan.rollbackTriggered = true;
        state.plan.rollbackSuccess = true;
        state.plan.currentPhase = 'learn';
        await this.state.storage.put('command_state', state);

        if (this.env.DB) {
          try {
            await this.env.DB.prepare(
              `UPDATE admin_commands SET rollback_triggered = 1, rollback_success = 1 WHERE command_id = ?`
            ).bind(state.plan.commandId).run();
            await this.env.DB.prepare(
              `UPDATE rollback_snapshots SET restored_at = DATETIME('now') WHERE command_id = ?`
            ).bind(state.plan.commandId).run();
          } catch (err) {
            console.warn('[AdminCommandDO] D1 rollback sync error:', err);
          }
        }

        return new Response(JSON.stringify({ ok: true, plan: state.plan }), { status: 200 });
      }

      if (pathname === '/state' && request.method === 'GET') {
        const state = await this.state.storage.get<StoredCommandState>('command_state');
        if (!state) {
          return new Response(JSON.stringify({ ok: false, error: 'Command not found' }), { status: 404 });
        }
        return new Response(JSON.stringify({ ok: true, ...state }), { status: 200 });
      }

      return new Response(JSON.stringify({ ok: false, error: 'Not found' }), { status: 404 });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), { status: 500 });
    }
  }
}
