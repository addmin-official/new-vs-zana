import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { verifyAdmin, ADMIN_EMAILS } from "../worker/adminGuard.ts";
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

  test("verifyAdmin - Accepts matching ADMIN_TELEMETRY_SECRET", async () => {
    const secret = "test-secret-key-123";
    const req = new Request("https://example.com/api/internal/telemetry", {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    });
    const res = await verifyAdmin(req, { ADMIN_TELEMETRY_SECRET: secret });
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.email, ADMIN_EMAILS[0]);
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
    const plan = brain.prepareExecutionPlan("خاوێنکردنەوەی کەش");
    assert.strictEqual(plan.rollbackAvailable, true);

    const snapshot = brain.getStateSnapshot(plan.commandId);
    assert.ok(snapshot, "State snapshot must be recorded for reversible command");

    await brain.executePipeline(plan);
    const rollbackRes = brain.rollbackExecution(plan.commandId);
    assert.strictEqual(rollbackRes.success, true);
    assert.strictEqual(rollbackRes.verified, true);
    assert.match(rollbackRes.messageKu, /بە تەواوی گەڕێندرایەوە/);
  });

  test("Preference Memory - Stores and updates admin preference configuration", async () => {
    const { InternalBrainService } = await import("../core/brain/InternalBrainService.ts");
    const brain = InternalBrainService.getInstance();
    const updated = brain.updatePreferenceMemory({
      notificationFrequency: "hourly",
      riskToleranceThreshold: 75,
    }, "admin_test_pref_uid");

    assert.strictEqual(updated.adminId, "admin_test_pref_uid");
    assert.strictEqual(updated.notificationFrequency, "hourly");
    assert.strictEqual(updated.riskToleranceThreshold, 75);

    const allPrefs = brain.getPreferenceMemory();
    assert.ok(allPrefs.some((p) => p.adminId === "admin_test_pref_uid"));
  });

  test("Worker Layer - GET & POST /api/admin/brain/preferences works for authenticated admin", async () => {
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

    const getReq = new Request("https://new-vs-zana.zana-platform.workers.dev/api/admin/brain/preferences", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const getRes = await worker.fetch(getReq, env as never);
    assert.strictEqual(getRes.status, 200);

    const postReq = new Request("https://new-vs-zana.zana-platform.workers.dev/api/admin/brain/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notificationFrequency: "digest" }),
    });
    const postRes = await worker.fetch(postReq, env as never);
    assert.strictEqual(postRes.status, 200);
    const data = (await postRes.json()) as { ok?: boolean; preference?: { notificationFrequency?: string } };
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.preference?.notificationFrequency, "digest");
  });
});
