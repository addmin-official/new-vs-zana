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

  test("Worker Layer - GET /api/admin/brain/status rejects unauthorized requests with 403 Forbidden", async () => {
    const env = {
      GEMINI_API_KEY: "fake-key",
      ZANA_ENV: "development",
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
      ZANA_ENV: "development",
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
    assert.strictEqual(data.status, "HEALTHY");
  });

  test("Worker Layer - GET /api/admin/brain/metrics returns 200 for authenticated admin", async () => {
    const env = {
      GEMINI_API_KEY: "fake-key",
      ZANA_ENV: "development",
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
    assert.strictEqual(data.brainActivity, 15);
  });
});
