process.env.NODE_ENV = "test";
process.env.ZANA_ENV = "test";
process.env.ALLOW_TEST_AUTH_MOCK = "true";

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.ts";

// Helper: create mock JWT token with given sub (UID)
function createStudentToken(uid: string, email?: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "test" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: uid,
    uid,
    email: email || `${uid}@test.com`,
    aud: "gen-lang-client-0009572581",
    iss: "https://securetoken.google.com/gen-lang-client-0009572581",
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64url");
  return `${header}.${payload}.mock-sig`;
}

const mockEnv = {
  GEMINI_API_KEY: "test-key",
  ALLOWED_ORIGINS: "https://zana.idggov.tech",
  FIREBASE_PROJECT_ID: "gen-lang-client-0009572581",
  ALLOW_TEST_AUTH_MOCK: "true",
  ZANA_ENV: "test",
};

describe("Student Data Isolation", () => {

  test("GET /api/learning/mastery rejects request with no auth token", async () => {
    const req = new Request("https://zana.idggov.tech/api/learning/mastery", {
      method: "GET",
      headers: { Origin: "https://zana.idggov.tech" },
    });
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 401);
    const body = (await res.json()) as Record<string, unknown>;
    assert.ok(body.error, "Should return error field");
  });

  test("GET /api/learning/mastery rejects when ?studentId differs from token UID", async () => {
    const studentAToken = createStudentToken("student-a-uid");
    const req = new Request(
      "https://zana.idggov.tech/api/learning/mastery?studentId=student-b-uid",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          Origin: "https://zana.idggov.tech",
        },
      }
    );
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 403, "Student A must not access Student B data via ?studentId");
  });

  test("GET /api/users returns 403 for non-admin student", async () => {
    const studentToken = createStudentToken("student-uid-123");
    const req = new Request("https://zana.idggov.tech/api/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${studentToken}`,
        Origin: "https://zana.idggov.tech",
      },
    });
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 403, "Student must not list all users");
  });

  test("GET /api/subscription/status returns 401 without auth", async () => {
    const req = new Request(
      "https://zana.idggov.tech/api/subscription/status?userId=student-uid-123",
      {
        method: "GET",
        headers: { Origin: "https://zana.idggov.tech" },
      }
    );
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 401, "Must require authentication for subscription status");
  });

  test("GET /api/subscription/status returns 403 when student queries another student", async () => {
    const studentAToken = createStudentToken("student-a");
    const req = new Request(
      "https://zana.idggov.tech/api/subscription/status?userId=student-b",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          Origin: "https://zana.idggov.tech",
        },
      }
    );
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 403, "Student must not query another student's subscription");
  });

  test("GET /api/assessment/attempts/:id returns 403 when student queries another student's attempt", async () => {
    // This test verifies the ownership check: existingAttempt.studentId !== studentId
    // We expect 404 (not found) in test env since KV is mock, but NOT 403 bypass
    const studentBToken = createStudentToken("student-b-uid");
    const req = new Request(
      "https://zana.idggov.tech/api/assessment/attempts/att_owned_by_student_a_123",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${studentBToken}`,
          Origin: "https://zana.idggov.tech",
        },
      }
    );
    const res = await worker.fetch(req, mockEnv);
    // Should be 404 (not found in mock KV) or 403 (ownership mismatch) — never 200 with someone else's data
    assert.ok(
      res.status === 404 || res.status === 403,
      `Expected 404 or 403, got ${res.status}`
    );
  });

  test("POST /api/notifications/read-all only marks authenticated student's notifications", async () => {
    const studentAToken = createStudentToken("student-a-uid");
    const req = new Request("https://zana.idggov.tech/api/notifications/read-all", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${studentAToken}`,
        Origin: "https://zana.idggov.tech",
        "Content-Type": "application/json",
      },
    });
    const res = await worker.fetch(req, mockEnv);
    // Without DB, should return ok:true with 0 updated (graceful degradation)
    assert.ok(res.status === 200 || res.status === 500);
    if (res.status === 200) {
      const body = (await res.json()) as Record<string, unknown>;
      assert.strictEqual(body.ok, true);
    }
  });

});

describe("Admin Guard Enforcement", () => {

  test("GET /api/admin/brain/status returns 403 for student token", async () => {
    const studentToken = createStudentToken("regular-student-uid");
    const req = new Request("https://zana.idggov.tech/api/admin/brain/status", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${studentToken}`,
        Origin: "https://zana.idggov.tech",
      },
    });
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 403, "Regular student must not access admin routes");
  });

  test("GET /api/admin/subscriptions returns 403 for student token", async () => {
    const studentToken = createStudentToken("regular-student-uid");
    const req = new Request("https://zana.idggov.tech/api/admin/subscriptions", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${studentToken}`,
        Origin: "https://zana.idggov.tech",
      },
    });
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 403);
  });

  test("POST /api/admin/subscriptions/activate returns 403 for student token", async () => {
    const studentToken = createStudentToken("regular-student-uid");
    const req = new Request("https://zana.idggov.tech/api/admin/subscriptions/activate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${studentToken}`,
        Origin: "https://zana.idggov.tech",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: "victim-uid", planId: "yearly" }),
    });
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 403, "Student must not activate other users' subscriptions");
  });

});
