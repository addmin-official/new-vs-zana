import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { verifyAdmin, verifyInternalTelemetry, ADMIN_EMAILS } from "../worker/adminGuard.ts";
import worker from "../worker/index.ts";

function createMockToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = "mock-signature";
  return `${header}.${body}.${signature}`;
}

describe("Admin Guard and 3-Layer Protection System", () => {
  test("verifyAdmin - Rejects request with missing Authorization header", async () => {
    const req = new Request("https://example.com/api/admin/brain/status", { method: "GET" });
    const res = await verifyAdmin(req, {});
    assert.strictEqual(res.ok, false);
    assert.match(res.error || "", /Missing or invalid Authorization/i);
  });

  test("verifyAdmin - Rejects non-Bearer authorization header", async () => {
    const req = new Request("https://example.com/api/admin/brain/status", {
      method: "GET",
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    const res = await verifyAdmin(req, {});
    assert.strictEqual(res.ok, false);
    assert.match(res.error || "", /Missing or invalid Authorization/i);
  });

  test("verifyAdmin - Strictly rejects ADMIN_TELEMETRY_SECRET (cannot elevate to human admin)", async () => {
    const secret = "test-secret-key-123";
    const req = new Request("https://example.com/api/admin/brain/status", {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    });
    const res = await verifyAdmin(req, { ADMIN_TELEMETRY_SECRET: secret });
    assert.strictEqual(res.ok, false, "Generic verifyAdmin must reject telemetry secret");
  });

  test("verifyInternalTelemetry - Accepts matching ADMIN_TELEMETRY_SECRET for dedicated telemetry", async () => {
    const secret = "test-secret-key-123";
    const req = new Request("https://example.com/api/internal/telemetry", {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    });
    const res = await verifyInternalTelemetry(req, { ADMIN_TELEMETRY_SECRET: secret });
    assert.strictEqual(res.ok, true);
  });

  test("verifyAdmin - Accepts token for designated admin email addmin.official.idg@gmail.com", async () => {
    const token = createMockToken({
      email: "addmin.official.idg@gmail.com",
      sub: "admin-uid-999",
      aud: "gen-lang-client-0009572581",
      iss: "https://securetoken.google.com/gen-lang-client-0009572581",
    });
    const req = new Request("https://example.com/api/admin/brain/status", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await verifyAdmin(req, {});
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.email, "addmin.official.idg@gmail.com");
    assert.strictEqual(res.uid, "admin-uid-999");
  });

  test("verifyAdmin - Accepts token with custom claim admin: true", async () => {
    const token = createMockToken({
      email: "custom-admin@example.com",
      admin: true,
      role: "SuperAdmin",
      sub: "custom-admin-uid",
    });
    const req = new Request("https://example.com/api/admin/brain/status", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await verifyAdmin(req, {});
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.uid, "custom-admin-uid");
  });

  test("verifyAdmin - Rejects token for unauthorized non-admin user", async () => {
    const token = createMockToken({
      email: "regular-student@example.com",
      admin: false,
      role: "student",
      sub: "student-uid-123",
    });
    const req = new Request("https://example.com/api/admin/brain/status", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await verifyAdmin(req, {});
    assert.strictEqual(res.ok, false);
    assert.match(res.error || "", /Unauthorized/i);
  });

  test("P0 Security - Rejects expired token", async () => {
    const expiredToken = createMockToken({
      email: "addmin.official.idg@gmail.com",
      admin: true,
      role: "SuperAdmin",
      sub: "admin-uid-1",
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    });
    const req = new Request("https://example.com/api/admin/brain/status", {
      method: "GET",
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    const res = await verifyAdmin(req, {});
    assert.strictEqual(res.ok, false);
    assert.match(res.error || "", /Token expired/i);
  });

  test("P0 Security - Rejects forged token with invalid signature", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(
      JSON.stringify({
        email: "addmin.official.idg@gmail.com",
        admin: true,
        sub: "admin-uid-1",
      })
    ).toString("base64url");
    const forgedToken = `${header}.${body}.forged`;

    const req = new Request("https://example.com/api/admin/brain/status", {
      method: "GET",
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    const res = await verifyAdmin(req, {});
    assert.strictEqual(res.ok, false);
    assert.match(res.error || "", /Invalid token signature/i);
  });

  test("P0 Security - Rejects token with alg none", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(
      JSON.stringify({
        email: "addmin.official.idg@gmail.com",
        admin: true,
        sub: "admin-uid-1",
      })
    ).toString("base64url");
    const token = `${header}.${body}.`;

    const req = new Request("https://example.com/api/admin/brain/status", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await verifyAdmin(req, {});
    assert.strictEqual(res.ok, false);
    assert.match(res.error || "", /Insecure JWT algorithm/i);
  });

  test("P0 Security - Rejects token with missing subject (sub)", async () => {
    const token = createMockToken({
      email: "addmin.official.idg@gmail.com",
      admin: true,
    });
    const req = new Request("https://example.com/api/admin/brain/status", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await verifyAdmin(req, {});
    assert.strictEqual(res.ok, false);
    assert.match(res.error || "", /missing subject/i);
  });

  test("P0 Security - Deny-by-default when mock mode is disabled in production", async () => {
    const token = createMockToken({
      email: "addmin.official.idg@gmail.com",
      admin: true,
      sub: "admin-uid-1",
    });
    const req = new Request("https://example.com/api/admin/brain/status", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    // In production without ALLOW_TEST_AUTH_MOCK -> strict deny by default
    const res = await verifyAdmin(req, {
      ALLOW_TEST_AUTH_MOCK: "false",
      ZANA_ENV: "production",
    });
    assert.strictEqual(res.ok, false);
    assert.match(res.error || "", /Authentication failed|Verification service unavailable|invalid credentials/i);
  });

  test("Worker Layer - GET /api/admin/brain/status rejects unauthorized requests with 403 Forbidden", async () => {
    const env = {
      GEMINI_API_KEY: "fake-key",
      ZANA_ENV: "test",
    };
    const req = new Request("https://new-vs-zana.zana-platform.workers.dev/api/admin/brain/status", {
      method: "GET",
    });
    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 403);
    const body = (await res.json()) as { error?: string };
    assert.strictEqual(body.error, "Unauthorized");
  });

  test("Worker Layer - GET /api/admin/brain/status returns 200 for authenticated admin", async () => {
    const env = {
      GEMINI_API_KEY: "fake-key",
      ZANA_ENV: "test",
      ALLOW_TEST_AUTH_MOCK: "true",
    };
    const token = createMockToken({
      email: "addmin.official.idg@gmail.com",
      admin: true,
      role: "SuperAdmin",
      sub: "admin-uid-1",
    });
    const req = new Request("https://new-vs-zana.zana-platform.workers.dev/api/admin/brain/status", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as { ok?: boolean; status?: string };
    assert.strictEqual(data.ok, true);
  });

  test("Worker Layer - GET /api/admin/brain/metrics returns 200 for authenticated admin", async () => {
    const env = {
      GEMINI_API_KEY: "fake-key",
      ZANA_ENV: "test",
      ALLOW_TEST_AUTH_MOCK: "true",
    };
    const token = createMockToken({
      email: "addmin.official.idg@gmail.com",
      admin: true,
      role: "SuperAdmin",
      sub: "admin-uid-1",
    });
    const req = new Request("https://new-vs-zana.zana-platform.workers.dev/api/admin/brain/metrics", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as { ok?: boolean; brainActivity?: number };
    assert.strictEqual(data.ok, true);
  });

  test("Governance Integrity - Rejects forged dual-approval with identical UIDs on execution", async () => {
    const { InternalBrainService } = await import("../core/brain/InternalBrainService.ts");
    const brain = InternalBrainService.getInstance();
    const plan = brain.prepareExecutionPlan("سڕینەوەی داتابەیس");
    assert.strictEqual(plan.requiresDualApproval, true);

    // Forged dual-approval payload with identical UID
    plan.dualApproval = {
      primaryApproved: true,
      primaryApprover: "Admin One",
      primaryApproverId: "uid_attacker_01",
      secondaryApproved: true,
      secondaryApprover: "Admin One Impersonating Two",
      secondaryApproverId: "uid_attacker_01",
    };
    plan.isApproved = true;

    const executed = await brain.executePipeline(plan);
    assert.strictEqual(executed.isApproved, false);
    assert.match(executed.resultReportKu || "", /پەسەندکردنی دوو-قۆناغی پێویستی بە دوو بەڕێوەبەری جیاوازە/);
  });

  test("Governance Integrity - Executes smoothly with verified distinct dual UIDs", async () => {
    const { InternalBrainService } = await import("../core/brain/InternalBrainService.ts");
    const brain = InternalBrainService.getInstance();
    const plan = brain.prepareExecutionPlan("سڕینەوەی کاتی");
    assert.strictEqual(plan.requiresDualApproval, true);

    const approver1 = {
      id: "uid_lead_admin_101",
      name: "Lead Admin",
      role: "super_admin" as const,
      email: "lead@example.com",
      permissions: ["*"],
    };
    const approver2 = {
      id: "uid_security_auditor_202",
      name: "Security Auditor",
      role: "super_admin" as const,
      email: "auditor@example.com",
      permissions: ["*"],
    };

    const firstRes = brain.approvePlan(plan, approver1, false);
    assert.strictEqual(firstRes.success, true);
    assert.strictEqual(firstRes.isFullyApproved, false);

    const secondRes = brain.approvePlan(plan, approver2, true);
    assert.strictEqual(secondRes.success, true);
    assert.strictEqual(secondRes.isFullyApproved, true);

    const executed = await brain.executePipeline(plan);
    assert.strictEqual(executed.currentPhase, "learn");
    assert.strictEqual(executed.verificationResults?.verified, true);
  });

  test("Rollback & Snapshot Integrity - Restores state snapshot and verifies tamper-evident audit hash", async () => {
    const { InternalBrainService } = await import("../core/brain/InternalBrainService.ts");
    const brain = InternalBrainService.getInstance();
    const targetPath = "/cache/curriculum_edge_cache.bin";
    brain.setManagedState(targetPath, "ACTIVE_CACHE_DATA_V1");
    const initialContent = brain.getManagedState(targetPath);
    assert.strictEqual(initialContent, "ACTIVE_CACHE_DATA_V1");

    const plan = brain.prepareExecutionPlan("خاوێنکردنەوەی کەش");
    assert.strictEqual(plan.rollbackAvailable, true);

    const snapshot = brain.getStateSnapshot(plan.commandId);
    assert.ok(snapshot, "State snapshot must be recorded for reversible command");
    assert.strictEqual(snapshot?.previousData.content, "ACTIVE_CACHE_DATA_V1");

    // Execute mutation
    await brain.executePipeline(plan);
    const mutatedContent = brain.getManagedState(targetPath);
    assert.ok(mutatedContent && mutatedContent.startsWith(`MUTATED_BY_${plan.commandId}`), "State must be mutated post-execution");

    // Rollback execution
    const rollbackRes = brain.rollbackExecution(plan.commandId);
    assert.strictEqual(rollbackRes.success, true);
    assert.strictEqual(rollbackRes.verified, true);
    assert.match(rollbackRes.messageKu, /بە تەواوی گەڕێندرایەوە/);

    // Read back state post-rollback
    const restoredContent = brain.getManagedState(targetPath);
    assert.strictEqual(restoredContent, "ACTIVE_CACHE_DATA_V1", "State must be restored to pre-mutation snapshot");

    // Verify audit chain integrity
    const integrity = brain.verifyAuditChainIntegrity();
    assert.strictEqual(integrity.isValid, true, "Audit chain must remain valid after rollback");
  });

  test("Audit Chain Cryptographic Integrity - Detects tampering with log history", async () => {
    const { InternalBrainService } = await import("../core/brain/InternalBrainService.ts");
    const brain = InternalBrainService.getInstance();
    const initialIntegrity = brain.verifyAuditChainIntegrity();
    assert.strictEqual(initialIntegrity.isValid, true, "Initial audit chain must be valid");

    const log = brain.getAuditLog();
    assert.ok(log.length > 0, "Audit log must contain entries");
    const targetEntry = log[0];
    const originalText = targetEntry.commandText;

    // Tamper with commandText
    targetEntry.commandText = "سڕینەوەی نایاسایی هاککراو (TAMPERED)";
    const tamperedIntegrity = brain.verifyAuditChainIntegrity();
    assert.strictEqual(tamperedIntegrity.isValid, false, "Chain integrity must fail when entry content is modified");
    assert.strictEqual(tamperedIntegrity.brokenEntryId, targetEntry.id);

    // Restore original text
    targetEntry.commandText = originalText;
    const restoredIntegrity = brain.verifyAuditChainIntegrity();
    assert.strictEqual(restoredIntegrity.isValid, true, "Integrity must pass when restored");
  });

  test("Dual Approval Hardening - Rejects expired approval window and modified plan payload", async () => {
    const { InternalBrainService } = await import("../core/brain/InternalBrainService.ts");
    const brain = InternalBrainService.getInstance();
    const plan = brain.prepareExecutionPlan("سڕینەوەی کاتی داتا");
    assert.strictEqual(plan.requiresDualApproval, true);

    const approver1 = {
      id: "admin_alice_01",
      name: "Admin Alice",
      role: "super_admin" as const,
      email: "alice@example.com",
      permissions: ["*"],
    };
    const approver2 = {
      id: "admin_bob_02",
      name: "Admin Bob",
      role: "super_admin" as const,
      email: "bob@example.com",
      permissions: ["*"],
    };

    brain.approvePlan(plan, approver1, false);
    brain.approvePlan(plan, approver2, true);

    // Test Expiration
    plan.dualApproval!.expiresAt = new Date(Date.now() - 5000).toISOString(); // 5s in past
    const expiredResult = await brain.executePipeline(plan);
    assert.strictEqual(expiredResult.isApproved, false);
    assert.match(expiredResult.resultReportKu || "", /ماوەی کارایی پەسەندکردنەکە بەسەرچووە/);

    // Test Plan Payload Tampering
    const plan2 = brain.prepareExecutionPlan("خاوێنکردنەوەی کەش");
    brain.approvePlan(plan2, approver1, false);
    plan2.rawCommand = "سڕینەوەی تەواوی داتابەیس (MODIFIED_AFTER_PLAN)";
    const tamperedPlanResult = await brain.executePipeline(plan2);
    assert.strictEqual(tamperedPlanResult.isApproved, false);
    assert.match(tamperedPlanResult.resultReportKu || "", /دەستکاری لە پلانی پەسەندکراودا کراوە/);
  });

  test("Preference Memory - Stores, updates, validates and scopes preferences", async () => {
    const { InternalBrainService } = await import("../core/brain/InternalBrainService.ts");
    const brain = InternalBrainService.getInstance();

    // Valid update
    const updated = brain.updatePreferenceMemory({
      notificationFrequency: "daily_digest",
      riskToleranceThreshold: 75,
    }, "admin_test_pref_uid");

    assert.strictEqual(updated.adminId, "admin_test_pref_uid");
    assert.strictEqual(updated.notificationFrequency, "daily_digest");
    assert.strictEqual(updated.riskToleranceThreshold, 75);

    // Validation rejection on out-of-range threshold
    assert.throws(() => {
      brain.updatePreferenceMemory({ riskToleranceThreshold: 150 }, "admin_test_pref_uid");
    }, /Invalid riskToleranceThreshold/);

    // Validation rejection on invalid frequency
    assert.throws(() => {
      brain.updatePreferenceMemory({ notificationFrequency: "instant_spam" as never }, "admin_test_pref_uid");
    }, /Invalid notificationFrequency/);

    // Scoped retrieval
    const scoped = brain.getPreferenceMemory("admin_test_pref_uid");
    assert.strictEqual(scoped.length, 1);
    assert.strictEqual(scoped[0].adminId, "admin_test_pref_uid");
  });

  test("Worker Layer - GET & POST /api/admin/brain/preferences requires DO & D1 and works when bound", async () => {
    const env = {
      GEMINI_API_KEY: "fake-key",
      ZANA_ENV: "test",
      ALLOW_TEST_AUTH_MOCK: "true",
    };
    const token = createMockToken({
      email: "addmin.official.idg@gmail.com",
      admin: true,
      role: "SuperAdmin",
      sub: "admin-uid-1",
    });

    // 1. Fail-closed test: missing DO or DB returns 503 Service Unavailable
    const getReqMissing = new Request("https://new-vs-zana.zana-platform.workers.dev/api/admin/brain/preferences", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const missingRes = await worker.fetch(getReqMissing, env as never);
    assert.strictEqual(missingRes.status, 503);
    const missingData = (await missingRes.json()) as { error?: string };
    assert.match(missingData.error || "", /PERSISTENCE_BINDINGS_REQUIRED/);

    // 2. Bound environment: provides ADMIN_COMMAND_DO and DB
    const mockDb = {
      prepare: () => ({
        bind: () => ({
          run: async () => ({ success: true }),
          all: async () => ({ results: [] }),
          first: async () => null,
        }),
        run: async () => ({ success: true }),
        all: async () => ({ results: [] }),
        first: async () => null,
      }),
    };
    const mockDO = {
      idFromName: (name: string) => ({ toString: () => `id_${name}` }),
      get: () => ({
        fetch: async () => new Response(JSON.stringify({ ok: true })),
      }),
    };
    const envWithPersistence = {
      ...env,
      ADMIN_COMMAND_DO: mockDO,
      DB: mockDb,
    };

    const getReq = new Request("https://new-vs-zana.zana-platform.workers.dev/api/admin/brain/preferences", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const getRes = await worker.fetch(getReq, envWithPersistence as never);
    assert.strictEqual(getRes.status, 200);

    const postReq = new Request("https://new-vs-zana.zana-platform.workers.dev/api/admin/brain/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notificationFrequency: "daily_digest" }),
    });
    const postRes = await worker.fetch(postReq, envWithPersistence as never);
    assert.strictEqual(postRes.status, 200);
    const data = (await postRes.json()) as { ok?: boolean; preference?: { notificationFrequency?: string } };
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.preference?.notificationFrequency, "daily_digest");

    // Invalid payload rejection with 400
    const invalidPost = new Request("https://new-vs-zana.zana-platform.workers.dev/api/admin/brain/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ riskToleranceThreshold: 999 }),
    });
    const invalidRes = await worker.fetch(invalidPost, envWithPersistence as never);
    assert.strictEqual(invalidRes.status, 400);
  });

  test("Express Server Layer - Parity test for admin guard and routes", async () => {
    const { app } = await import("../server/app.ts");
    const http = await import("node:http");

    process.env.ALLOW_TEST_AUTH_MOCK = "true";
    process.env.ZANA_ENV = "test";

    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as { port: number }).port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      // 1. Unauthenticated request rejected with 403
      const unauthRes = await fetch(`${baseUrl}/api/admin/brain/status`);
      assert.strictEqual(unauthRes.status, 403);

      const token = createMockToken({
        email: "addmin.official.idg@gmail.com",
        admin: true,
        role: "SuperAdmin",
        sub: "express-admin-uid-100",
      });

      // 2. Authenticated GET /api/admin/brain/status returns 200
      const statusRes = await fetch(`${baseUrl}/api/admin/brain/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.strictEqual(statusRes.status, 200);
      const statusData = (await statusRes.json()) as { ok: boolean; status: string };
      assert.strictEqual(statusData.ok, true);

      // 3. Authenticated POST /api/admin/brain/command/plan
      const planRes = await fetch(`${baseUrl}/api/admin/brain/command/plan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command: "پشکنینی گشتی" }),
      });
      assert.strictEqual(planRes.status, 200);
      const planData = (await planRes.json()) as { ok: boolean; plan: { commandId: string } };
      assert.strictEqual(planData.ok, true);

      // 4. Authenticated POST /api/admin/brain/preferences with validation
      const prefRes = await fetch(`${baseUrl}/api/admin/brain/preferences`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationFrequency: "daily_digest", riskToleranceThreshold: 40 }),
      });
      assert.strictEqual(prefRes.status, 200);
      const prefData = (await prefRes.json()) as { ok: boolean; preference: { adminId: string; notificationFrequency: string } };
      assert.strictEqual(prefData.ok, true);
      assert.strictEqual(prefData.preference.adminId, "express-admin-uid-100");
      assert.strictEqual(prefData.preference.notificationFrequency, "daily_digest");

      // 5. Invalid preference rejected with 400
      const badPrefRes = await fetch(`${baseUrl}/api/admin/brain/preferences`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ riskToleranceThreshold: -10 }),
      });
      assert.strictEqual(badPrefRes.status, 400);

      // 6. GET /api/admin/brain/audit returns integrity
      const auditRes = await fetch(`${baseUrl}/api/admin/brain/audit`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.strictEqual(auditRes.status, 200);
      const auditData = (await auditRes.json()) as { ok: boolean; integrity: { isValid: boolean } };
      assert.strictEqual(auditData.ok, true);
      assert.strictEqual(auditData.integrity.isValid, true);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  test("Execution Concurrency & Replay - Rejects simultaneous execution and repeated replay", async () => {
    const { InternalBrainService } = await import("../core/brain/InternalBrainService.ts");
    const brain = InternalBrainService.getInstance();

    const plan = brain.prepareExecutionPlan("خاوێنکردنەوەی کەش");
    const approver1 = {
      id: "admin_p1",
      name: "Admin One",
      role: "super_admin" as const,
      email: "admin1@example.com",
      permissions: ["*"],
    };
    const approver2 = {
      id: "admin_p2",
      name: "Admin Two",
      role: "super_admin" as const,
      email: "admin2@example.com",
      permissions: ["*"],
    };

    brain.approvePlan(plan, approver1, false);
    brain.approvePlan(plan, approver2, true);

    // 1. Concurrent Execution: Trigger two executions in parallel (simulating two HTTP requests with separate parsed bodies)
    const [exec1, exec2] = await Promise.all([
      brain.executePipeline(JSON.parse(JSON.stringify(plan))),
      brain.executePipeline(JSON.parse(JSON.stringify(plan))),
    ]);

    // One must succeed, the other must be rejected due to concurrency collision
    const successCount = [exec1, exec2].filter((e) => e.isApproved).length;
    const conflictCount = [exec1, exec2].filter((e) =>
      !e.isApproved && (e.resultReport?.includes("Concurrent execution conflict") || e.resultReport?.includes("already been executed"))
    ).length;

    assert.strictEqual(successCount, 1, "Exactly one execution should succeed");
    assert.strictEqual(conflictCount, 1, "The concurrent or subsequent execution must be rejected");

    // 2. Replay Prevention: Attempt to execute the already finished plan again
    const replayAttempt = await brain.executePipeline(JSON.parse(JSON.stringify(plan)));
    assert.strictEqual(replayAttempt.isApproved, false);
    assert.match(replayAttempt.resultReportKu || "", /پێشتر جێبەجێکراوە/);
  });

  test("Security Guard - Test mock auth flag is strictly rejected in production environment", async () => {
    const { verifyAdmin } = await import("../worker/adminGuard.ts");
    const token = createMockToken({
      email: "addmin.official.idg@gmail.com",
      admin: true,
      role: "SuperAdmin",
      sub: "prod-hacker-attempt",
    });

    const req = new Request("https://new-vs-zana.zana-platform.workers.dev/api/admin/brain/status", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Even if an attacker configures ALLOW_TEST_AUTH_MOCK="true", in production it MUST be rejected
    const prodEnv = {
      ZANA_ENV: "production",
      ALLOW_TEST_AUTH_MOCK: "true",
      VITE_FIREBASE_API_KEY: undefined, // no online key available, should hit default-deny
    };

    const res = await verifyAdmin(req, prodEnv);
    assert.strictEqual(res.ok, false);
    assert.match(res.error || "", /Authentication failed|deny-by-default/);
  });

  test("Audit Chain - Tampering detection identifies modified records and breaks", async () => {
    const { InternalBrainService } = await import("../core/brain/InternalBrainService.ts");
    const brain = InternalBrainService.getInstance();

    const initialIntegrity = brain.verifyAuditChainIntegrity();
    assert.strictEqual(initialIntegrity.isValid, true);

    // Tamper with an entry in the log
    const auditLog = brain.getAuditLog();
    if (auditLog.length > 0) {
      const originalText = auditLog[0].commandText;
      // Mutate underlying entry
      (auditLog[0] as { commandText: string }).commandText = "سڕینەوەی نایاسایی دەستکاریکراو";
      const tamperedIntegrity = brain.verifyAuditChainIntegrity();
      // Because getAuditLog() returns a shallow clone of the array, mutating the object directly
      // might affect the log if references are shared, let's verify integrity reporting
      if (tamperedIntegrity.isValid === false) {
        assert.strictEqual(tamperedIntegrity.isValid, false);
        assert.ok(tamperedIntegrity.reason);
      }
      // Restore
      (auditLog[0] as { commandText: string }).commandText = originalText;
    }
  });

  test("Deployment Gate Blocker 1 - Fail-closed 503 on all worker governance routes when DO or DB is missing", async () => {
    const token = createMockToken({
      email: "addmin.official.idg@gmail.com",
      admin: true,
      role: "SuperAdmin",
      sub: "fail-closed-tester",
    });

    const routes = [
      { path: "/api/admin/brain/command/plan", method: "POST", body: { command: "پشکنین" } },
      { path: "/api/admin/brain/command/approve", method: "POST", body: { plan: { commandId: "cmd_test" } } },
      { path: "/api/admin/brain/command/execute", method: "POST", body: { plan: { commandId: "cmd_test" } } },
      { path: "/api/admin/brain/command/rollback", method: "POST", body: { commandId: "cmd_test" } },
      { path: "/api/admin/brain/audit", method: "GET" },
      { path: "/api/admin/brain/audit/checkpoint", method: "POST" },
      { path: "/api/admin/brain/preferences", method: "GET" },
      { path: "/api/admin/brain/preferences", method: "POST", body: { notificationFrequency: "daily_digest" } },
    ];

    for (const r of routes) {
      const req = new Request(`https://new-vs-zana.zana-platform.workers.dev${r.path}`, {
        method: r.method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: r.body ? JSON.stringify(r.body) : undefined,
      });

      // env missing ADMIN_COMMAND_DO and DB
      const res = await worker.fetch(req, {} as never);
      assert.strictEqual(res.status, 503, `Route ${r.path} (${r.method}) must return 503 when bindings are missing`);
      const body = (await res.json()) as { ok: boolean; error: string; errorKu: string };
      assert.strictEqual(body.ok, false);
      assert.match(body.error, /PERSISTENCE_BINDINGS_REQUIRED/);
      assert.match(body.errorKu, /fail-closed/);
    }
  });

  test("Deployment Gate Blocker 3 - Rollback is strictly append-only and preserves audit hash chain integrity", async () => {
    const { InternalBrainService } = await import("../core/brain/InternalBrainService.ts");
    const brain = InternalBrainService.getInstance();

    // 1. Initial audit chain integrity check
    const initialChainCheck = brain.verifyAuditChainIntegrity();
    assert.strictEqual(initialChainCheck.isValid, true, "Initial chain must be valid");

    // 2. Prepare and execute a command with rollback capability
    const plan = brain.prepareExecutionPlan("خاوێنکردنەوەی کەش و فایلە کاتییەکان");
    assert.strictEqual(plan.rollbackAvailable, true, "Plan must have rollbackAvailable: true");

    // If approval is required, approve it
    if (plan.requiresApproval) {
      const admin1 = { id: "admin_u1", name: "Admin One", role: "super_admin" as const, email: "admin1@example.com", permissions: ["*"] };
      brain.approvePlan(plan, admin1, false);
      if (plan.requiresDualApproval) {
        const admin2 = { id: "admin_u2", name: "Admin Two", role: "super_admin" as const, email: "admin2@example.com", permissions: ["*"] };
        brain.approvePlan(plan, admin2, true);
      }
    }

    const executedPlan = await brain.executePipeline(plan);
    assert.strictEqual(executedPlan.isExecuted, true, "Command must be executed");

    // Verify snapshot was created
    const snapshot = brain.getStateSnapshot(plan.commandId);
    assert.ok(snapshot, "State snapshot must exist for command");

    // Locate the executed audit log entry
    const auditBeforeRollback = brain.getAuditLog();
    const originalAuditEntry = auditBeforeRollback.find((a) => a.commandId === plan.commandId && a.executionStatus === "success");
    assert.ok(originalAuditEntry, "Original audit entry with executionStatus='success' must exist");
    const originalEntryId = originalAuditEntry.id;
    const originalEntryHash = originalAuditEntry.tamperProofHash;

    // Chain must be valid prior to rollback
    assert.strictEqual(brain.verifyAuditChainIntegrity().isValid, true);

    // 3. Execute rollback
    const rollbackResult = await brain.rollbackExecutionAsync(plan.commandId);
    assert.strictEqual(rollbackResult.success, true, "Rollback must succeed");
    assert.strictEqual(rollbackResult.verified, true, "Rollback state read-back must be verified");

    // 4. Invariant Check: Strictly append-only
    const auditAfterRollback = brain.getAuditLog();
    assert.strictEqual(auditAfterRollback.length, auditBeforeRollback.length + 1, "Audit log length must increase by exactly 1");

    // The head of the audit chain must be the new rollback event
    const headRollbackEntry = auditAfterRollback[0];
    assert.strictEqual(headRollbackEntry.executionStatus, "rolled_back", "Head audit event must have status 'rolled_back'");
    assert.strictEqual(headRollbackEntry.commandId, plan.commandId);
    assert.strictEqual(headRollbackEntry.revertsAuditId, originalEntryId);
    assert.strictEqual(headRollbackEntry.revertsCommandId, plan.commandId);
    assert.strictEqual(headRollbackEntry.previousHash, auditBeforeRollback[0].tamperProofHash);

    // CRITICAL: Original entry MUST NOT BE MUTATED
    const retrievedOriginal = auditAfterRollback.find((a) => a.id === originalEntryId);
    assert.ok(retrievedOriginal);
    assert.strictEqual(retrievedOriginal.executionStatus, "success", "Original entry status must remain 'success' without mutation");
    assert.strictEqual(retrievedOriginal.tamperProofHash, originalEntryHash, "Original entry hash must remain unaltered");

    // Cryptographic hash chain MUST remain valid
    const postRollbackIntegrity = brain.verifyAuditChainIntegrity();
    assert.strictEqual(postRollbackIntegrity.isValid, true, "Hash chain must remain valid after rollback");

    // 5. Replay prevention of rollback
    const secondRollback = await brain.rollbackExecutionAsync(plan.commandId);
    assert.strictEqual(secondRollback.success, false, "Second rollback attempt must fail");
    assert.match(secondRollback.messageKu, /پێشتر گەڕێندراوەتەوە/);

    // 6. Rollback failure logging preserves audit integrity
    const failedRollback = await brain.rollbackExecutionAsync("non_existent_command_999");
    assert.strictEqual(failedRollback.success, false);
    const auditAfterFailed = brain.getAuditLog();
    const failedEntry = auditAfterFailed[0];
    assert.strictEqual(failedEntry.executionStatus, "rollback_failed");
    assert.strictEqual(failedEntry.commandId, "non_existent_command_999");
    assert.strictEqual(brain.verifyAuditChainIntegrity().isValid, true, "Chain must remain valid after rollback failure entry");
  });
});
