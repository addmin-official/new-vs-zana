/**
 * Admin Command Coordinator (ناوه‌ندی هه‌ماهه‌نگیی فه‌رمانه‌کانی ئادمین)
 * Decouples Worker & Express from in-memory singleton.
 * Uses Cloudflare Durable Objects in production Worker;
 * and a persistent D1 / SQLite transactional adapter in local & test environments.
 */

import type { AdminUser, ExecutionPlan } from '../types.ts';
import { AdminCommandDO, type DOEnv, type DurableObjectState } from './AdminCommandDO.ts';

export interface IAdminCommandCoordinator {
  createPlan(plan: ExecutionPlan): Promise<{ success: boolean; plan: ExecutionPlan; error?: string }>;
  approvePlan(
    commandId: string,
    approver: AdminUser,
    isSecondarySignOff: boolean
  ): Promise<{ success: boolean; isFullyApproved: boolean; plan?: ExecutionPlan; error?: string; errorKu?: string }>;
  acquireExecutionLock(
    commandId: string,
    rawCommand: string,
    plan?: ExecutionPlan
  ): Promise<{ success: boolean; plan?: ExecutionPlan; error?: string; errorKu?: string }>;
  finishExecution(commandId: string, plan: ExecutionPlan): Promise<void>;
  unlockExecution(commandId: string): Promise<void>;
  rollback(commandId: string): Promise<{ success: boolean; plan?: ExecutionPlan; error?: string }>;
  getCommandState(commandId: string): Promise<ExecutionPlan | null>;
}

export interface DurableObjectNamespaceLike {
  idFromName(name: string): { toString(): string };
  get(id: { toString(): string }): {
    fetch(request: Request | string, init?: RequestInit): Promise<Response>;
  };
}

/**
 * Production Coordinator using Cloudflare Durable Objects
 */
export class CloudflareDurableObjectCoordinator implements IAdminCommandCoordinator {
  private doNamespace: DurableObjectNamespaceLike;

  constructor(doNamespace: DurableObjectNamespaceLike) {
    this.doNamespace = doNamespace;
  }

  private getStub(commandId: string) {
    const id = this.doNamespace.idFromName(commandId);
    return this.doNamespace.get(id);
  }

  async createPlan(plan: ExecutionPlan): Promise<{ success: boolean; plan: ExecutionPlan; error?: string }> {
    const stub = this.getStub(plan.commandId);
    const res = await stub.fetch('http://do/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = (await res.json()) as { ok: boolean; plan?: ExecutionPlan; error?: string };
    return { success: data.ok, plan: data.plan || plan, error: data.error };
  }

  async approvePlan(
    commandId: string,
    approver: AdminUser,
    isSecondarySignOff: boolean
  ): Promise<{ success: boolean; isFullyApproved: boolean; plan?: ExecutionPlan; error?: string; errorKu?: string }> {
    const stub = this.getStub(commandId);
    const res = await stub.fetch('http://do/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver, isSecondarySignOff }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      isFullyApproved?: boolean;
      plan?: ExecutionPlan;
      error?: string;
      errorKu?: string;
    };
    return {
      success: data.ok,
      isFullyApproved: Boolean(data.isFullyApproved),
      plan: data.plan,
      error: data.error,
      errorKu: data.errorKu,
    };
  }

  async acquireExecutionLock(
    commandId: string,
    rawCommand: string,
    plan?: ExecutionPlan
  ): Promise<{ success: boolean; plan?: ExecutionPlan; error?: string; errorKu?: string }> {
    const stub = this.getStub(commandId);
    const res = await stub.fetch('http://do/lock-execution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawCommand, plan }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      plan?: ExecutionPlan;
      error?: string;
      errorKu?: string;
    };
    return {
      success: data.ok,
      plan: data.plan,
      error: data.error,
      errorKu: data.errorKu,
    };
  }

  async finishExecution(commandId: string, plan: ExecutionPlan): Promise<void> {
    const stub = this.getStub(commandId);
    await stub.fetch('http://do/finish-execution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
  }

  async unlockExecution(commandId: string): Promise<void> {
    const stub = this.getStub(commandId);
    await stub.fetch('http://do/unlock-execution', { method: 'POST' });
  }

  async rollback(commandId: string): Promise<{ success: boolean; plan?: ExecutionPlan; error?: string }> {
    const stub = this.getStub(commandId);
    const res = await stub.fetch('http://do/rollback', { method: 'POST' });
    const data = (await res.json()) as { ok: boolean; plan?: ExecutionPlan; error?: string };
    return { success: data.ok, plan: data.plan, error: data.error };
  }

  async getCommandState(commandId: string): Promise<ExecutionPlan | null> {
    const stub = this.getStub(commandId);
    const res = await stub.fetch('http://do/state', { method: 'GET' });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok: boolean; plan?: ExecutionPlan };
    return data.plan || null;
  }
}

/**
 * In-Memory & Persistent SQLite Local Coordinator (for tests and local development)
 * Uses the exact same AdminCommandDO state machine logic to guarantee complete behavioral parity.
 */
export class LocalDurableObjectCoordinator implements IAdminCommandCoordinator {
  private instances: Map<string, AdminCommandDO> = new Map();
  private env: DOEnv;

  constructor(env: DOEnv = {}) {
    this.env = env;
  }

  private getDOInstance(commandId: string): AdminCommandDO {
    let instance = this.instances.get(commandId);
    if (!instance) {
      const memoryStorage = new Map<string, unknown>();
      const inMemoryState: DurableObjectState = {
        storage: {
          get: async <T>(key: string) => memoryStorage.get(key) as T | undefined,
          getMany: async <T>(keys: string[]) => {
            const m = new Map<string, T>();
            for (const k of keys) {
              if (memoryStorage.has(k)) m.set(k, memoryStorage.get(k) as T);
            }
            return m;
          },
          put: async <T>(key: string, value: T) => {
            memoryStorage.set(key, value);
          },
          putMany: async <T>(entries: Record<string, T>) => {
            for (const [k, v] of Object.entries(entries)) memoryStorage.set(k, v);
          },
          delete: async (key: string) => memoryStorage.delete(key),
          deleteMany: async (keys: string[]) => {
            let count = 0;
            for (const k of keys) {
              if (memoryStorage.delete(k)) count++;
            }
            return count;
          },
          list: async <T>() => memoryStorage as Map<string, T>,
        } as never,
        id: { toString: () => commandId },
      };
      instance = new AdminCommandDO(inMemoryState, this.env);
      this.instances.set(commandId, instance);
    }
    return instance;
  }

  async createPlan(plan: ExecutionPlan): Promise<{ success: boolean; plan: ExecutionPlan; error?: string }> {
    const doInstance = this.getDOInstance(plan.commandId);
    const req = new Request('http://local-do/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const res = await doInstance.fetch(req);
    const data = (await res.json()) as { ok: boolean; plan?: ExecutionPlan; error?: string };
    return { success: data.ok, plan: data.plan || plan, error: data.error };
  }

  async approvePlan(
    commandId: string,
    approver: AdminUser,
    isSecondarySignOff: boolean
  ): Promise<{ success: boolean; isFullyApproved: boolean; plan?: ExecutionPlan; error?: string; errorKu?: string }> {
    const doInstance = this.getDOInstance(commandId);
    const req = new Request('http://local-do/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver, isSecondarySignOff }),
    });
    const res = await doInstance.fetch(req);
    const data = (await res.json()) as {
      ok: boolean;
      isFullyApproved?: boolean;
      plan?: ExecutionPlan;
      error?: string;
      errorKu?: string;
    };
    return {
      success: data.ok,
      isFullyApproved: Boolean(data.isFullyApproved),
      plan: data.plan,
      error: data.error,
      errorKu: data.errorKu,
    };
  }

  async acquireExecutionLock(
    commandId: string,
    rawCommand: string,
    plan?: ExecutionPlan
  ): Promise<{ success: boolean; plan?: ExecutionPlan; error?: string; errorKu?: string }> {
    const doInstance = this.getDOInstance(commandId);
    const req = new Request('http://local-do/lock-execution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawCommand, plan }),
    });
    const res = await doInstance.fetch(req);
    const data = (await res.json()) as {
      ok: boolean;
      plan?: ExecutionPlan;
      error?: string;
      errorKu?: string;
    };
    return {
      success: data.ok,
      plan: data.plan,
      error: data.error,
      errorKu: data.errorKu,
    };
  }

  async finishExecution(commandId: string, plan: ExecutionPlan): Promise<void> {
    const doInstance = this.getDOInstance(commandId);
    const req = new Request('http://local-do/finish-execution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    await doInstance.fetch(req);
  }

  async unlockExecution(commandId: string): Promise<void> {
    const doInstance = this.getDOInstance(commandId);
    const req = new Request('http://local-do/unlock-execution', { method: 'POST' });
    await doInstance.fetch(req);
  }

  async rollback(commandId: string): Promise<{ success: boolean; plan?: ExecutionPlan; error?: string }> {
    const doInstance = this.getDOInstance(commandId);
    const req = new Request('http://local-do/rollback', { method: 'POST' });
    const res = await doInstance.fetch(req);
    const data = (await res.json()) as { ok: boolean; plan?: ExecutionPlan; error?: string };
    return { success: data.ok, plan: data.plan, error: data.error };
  }

  async getCommandState(commandId: string): Promise<ExecutionPlan | null> {
    const doInstance = this.getDOInstance(commandId);
    const req = new Request('http://local-do/state', { method: 'GET' });
    const res = await doInstance.fetch(req);
    if (!res.ok) return null;
    const data = (await res.json()) as { ok: boolean; plan?: ExecutionPlan };
    return data.plan || null;
  }
}
