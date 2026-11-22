/**
 * Regression tests — Blocker E: Telemetry Secret Privilege Boundary.
 *
 * Proves:
 *  1. Telemetry secret succeeds ONLY on authorized telemetry endpoint.
 *  2. Telemetry secret fails on all /api/admin/* routes.
 *  3. Telemetry secret fails on unapproved /api/internal/* routes.
 *  4. Student credentials cannot access admin routes.
 *  5. Human admin credentials continue to work (guarded by existing test helpers).
 */
process.env.NODE_ENV = "test";
process.env.ZANA_ENV = "test";
process.env.ALLOW_TEST_AUTH_MOCK = "true";

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { verifyAdmin, verifyInternalTelemetry } from "../worker/adminGuard.ts";
import worker from "../worker/index.ts";

const SECRET = "test-telemetry-secret-abc123";

function tokenHeader(value: string) {
  return { "Authorization": `Bearer ${value}` };
}

function telemetrySecretEnv() {
  return {
    ADMIN_TELEMETRY_SECRET: SECRET,
    FIREBASE_PROJECT_ID: "gen-lang-client-0009572581",
    VITE_FIREBASE_PROJECT_ID: "gen-lang-client-0009572581",
    ALLOW_TEST_AUTH_MOCK: "true",
    ZANA_ENV: "test",
  };
}

// ── verifyAdmin MUST reject telemetry secret ────────────────────────────────

describe("Blocker E — verifyAdmin rejects telemetry secret", () => {
  test("verifyAdmin returns false for telemetry secret token", async () => {
    const r = new Request("https://example.com/api/admin/users", {
      headers: tokenHeader(SECRET),
    });
    const result = await verifyAdmin(r, telemetrySecretEnv());
    assert.strictEqual(result.ok, false, "verifyAdmin must REJECT telemetry secret — it is not a human admin credential");
  });
});

// ── verifyInternalTelemetry MUST accept secret on telemetry path ────────────

describe("Blocker E — verifyInternalTelemetry accepts secret on correct path", () => {
  test("verifyInternalTelemetry accepts secret for /api/internal/telemetry", async () => {
    const r = new Request("https://example.com/api/internal/telemetry", {
      headers: tokenHeader(SECRET),
    });
    const result = await verifyInternalTelemetry(r, telemetrySecretEnv());
    assert.strictEqual(result.ok, true, "telemetry secret must be accepted for internal telemetry endpoint");
  });

  test("verifyInternalTelemetry rejects wrong secret", async () => {
    const r = new Request("https://example.com/api/internal/telemetry", {
      headers: tokenHeader("WRONG_SECRET"),
    });
    const result = await verifyInternalTelemetry(r, telemetrySecretEnv());
    assert.strictEqual(result.ok, false);
  });
});

// ── Worker route-level guard: telemetry secret must be blocked on admin routes

function workerEnv() {
  return {
    GEMINI_API_KEY: "test-key",
    FIREBASE_PROJECT_ID: "gen-lang-client-0009572581",
    ALLOWED_ORIGINS: "https://localhost",
    ALLOW_TEST_AUTH_MOCK: "true",
    ZANA_ENV: "test",
    ADMIN_TELEMETRY_SECRET: SECRET,
    DB: undefined,
    LEARNING_RECORDS_KV: { get: () => Promise.resolve(null) },
  };
}

describe("Blocker E — Worker guard: telemetry secret denied on admin routes", () => {
  const adminPaths = [
    "/api/admin/brain/status",
    "/api/admin/users",
    "/api/admin/receipts",
    "/api/admin/subscriptions",
  ];

  for (const path of adminPaths) {
    test(`${path} with telemetry secret → 403`, async () => {
      const r = new Request(`https://zana.test${path}`, {
        method: "GET",
        headers: {
          ...tokenHeader(SECRET),
          "Origin": "https://localhost",
        },
      });
      const res = await worker.handleRequest(r, workerEnv() as never);
      assert.strictEqual(res.status, 403, `Telemetry secret must be rejected on admin route ${path}: got ${res.status}`);
    });
  }
});

describe("Blocker E — Worker guard: telemetry secret denied on unapproved /api/internal/* paths", () => {
  const unapprovedInternalPaths = [
    "/api/internal/users",
    "/api/internal/admin",
    "/api/internal/secrets",
    "/api/internal/unknown_route",
    "/api/internal/subscription",
  ];

  for (const path of unapprovedInternalPaths) {
    test(`${path} with telemetry secret → 403`, async () => {
      const r = new Request(`https://zana.test${path}`, {
        method: "GET",
        headers: {
          ...tokenHeader(SECRET),
          "Origin": "https://localhost",
        },
      });
      const res = await worker.handleRequest(r, workerEnv() as never);
      assert.strictEqual(res.status, 403, `Unapproved internal path ${path} must return 403: got ${res.status}`);
    });
  }
});

describe("Blocker E — Student credentials cannot access admin routes", () => {
  function studentToken(uid: string): string {
    const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "test" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      sub: uid, uid, email: `${uid}@student.krd`,
      aud: "gen-lang-client-0009572581",
      iss: "https://securetoken.google.com/gen-lang-client-0009572581",
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })).toString("base64url");
    return `${header}.${payload}.mock-sig`;
  }

  test("Student token rejected on /api/admin/brain/status", async () => {
    const r = new Request("https://zana.test/api/admin/brain/status", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${studentToken("non_admin_student")}`,
        "Origin": "https://localhost",
      },
    });
    const res = await worker.handleRequest(r, workerEnv() as never);
    assert.strictEqual(res.status, 403, `Student must not access admin routes: got ${res.status}`);
  });
});
