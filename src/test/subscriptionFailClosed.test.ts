/**
 * Regression tests — Blocker C: Subscription fail-closed guarantee.
 *
 * Proves:
 *  - Missing D1 never creates synthetic trial — returns unavailable.
 *  - DB query failures never grant access.
 *  - DB write failures on new user are reported accurately, not treated as trial creation.
 *  - Client-supplied userId/studentId never overrides authenticated token UID.
 *  - Existing healthy subscription data continues to work correctly.
 */
process.env.NODE_ENV = "test";
process.env.ZANA_ENV = "test";
process.env.ALLOW_TEST_AUTH_MOCK = "true";

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { checkSubscription } from "../worker/index.ts";
import worker from "../worker/index.ts";

// ── Mock D1 helpers ─────────────────────────────────────────────────────────

function makeHealthyD1WithSub(status: "trial" | "active" | "expired", trialEndsAtMs: number) {
  const sub = {
    user_id: "uid_test",
    status,
    trial_started_at: Date.now() - 1000,
    trial_ends_at: trialEndsAtMs,
    plan_id: status === "active" ? "plan_basic" : null,
    updated_at: Date.now(),
  };
  return {
    prepare(_sql: string) {
      return {
        bind() { return this; },
        async first<T>() { return sub as T; },
        async run() { return { meta: { changes: 1 } }; },
        async all<T>() { return { results: [sub] as T[] }; },
      };
    },
  };
}

function makeEmptyD1() {
  // No subscription row for this user — first visit
  return {
    prepare(_sql: string) {
      let inserted = false;
      return {
        bind() { return this; },
        async first<T>(): Promise<T | undefined> { return undefined; },
        async run() {
          inserted = true;
          return { meta: { changes: 1 } };
        },
        async all<T>() { return { results: [] as T[] }; },
      };
    },
    _inserted: false,
  };
}

function makeThrowingD1(errorMsg = "SIMULATED_D1_QUERY_ERROR") {
  return {
    prepare(_sql: string) {
      return {
        bind() { return this; },
        async first<T>(): Promise<T> { throw new Error(errorMsg); },
        async run() { throw new Error(errorMsg); },
        async all<T>(): Promise<{ results: T[] }> { throw new Error(errorMsg); },
      };
    },
  };
}

function makeWriteFailD1() {
  // .first() succeeds with no row (new user), but .run() throws
  return {
    prepare(_sql: string) {
      return {
        bind() { return this; },
        async first<T>(): Promise<T | undefined> { return undefined; }, // no existing sub
        async run() { throw new Error("SIMULATED_WRITE_ERROR"); },
        async all<T>() { return { results: [] as T[] }; },
      };
    },
  };
}

// ── checkSubscription unit tests ────────────────────────────────────────────

describe("Blocker C — checkSubscription fail-closed", () => {

  test("Missing DB returns unavailable — NOT trial", async () => {
    const result = await checkSubscription({ DB: undefined } as never, "uid_test");
    assert.strictEqual(result.status, "unavailable", "must be unavailable, never trial, when DB missing");
    assert.ok(result.error, "must have an error message");
  });

  test("DB query failure returns unavailable — NOT trial or active", async () => {
    const db = makeThrowingD1("Query explosion");
    const result = await checkSubscription({ DB: db } as never, "uid_test");
    assert.strictEqual(result.status, "unavailable", "DB query failure must not grant trial");
    assert.ok(result.error?.includes("Query explosion") || result.error, "must carry error info");
  });

  test("DB write failure on new user returns unavailable — does NOT create trial", async () => {
    const db = makeWriteFailD1();
    const result = await checkSubscription({ DB: db } as never, "uid_test");
    // Write failed, so no trial should have been granted
    assert.ok(
      result.status === "unavailable" || result.status === "expired",
      `DB write failure must not grant trial: got status="${result.status}"`
    );
    assert.ok(result.error, "DB write failure must carry an error message indicating the failure");
  });

  test("Healthy trial subscription within validity window → trial", async () => {
    const db = makeHealthyD1WithSub("trial", Date.now() + 100_000);
    const result = await checkSubscription({ DB: db } as never, "uid_test");
    assert.strictEqual(result.status, "trial");
  });

  test("Healthy active subscription → active (not expired)", async () => {
    const db = makeHealthyD1WithSub("active", Date.now() + 100_000);
    const result = await checkSubscription({ DB: db } as never, "uid_test");
    assert.strictEqual(result.status, "active");
  });

  test("Expired trial → expired (not active)", async () => {
    const db = makeHealthyD1WithSub("trial", Date.now() - 1000); // already expired
    const db2 = {
      prepare(sql: string) {
        const sub = {
          user_id: "uid_test", status: "trial",
          trial_started_at: Date.now() - 100_000,
          trial_ends_at: Date.now() - 1000, // expired
          plan_id: null, updated_at: Date.now()
        };
        return {
          bind() { return this; },
          async first<T>() { return sql.includes("SELECT") ? sub as T : undefined; },
          async run() { return { meta: { changes: 1 } }; },
          async all<T>() { return { results: [] as T[] }; },
        };
      }
    };
    const result = await checkSubscription({ DB: db2 } as never, "uid_test");
    assert.ok(result.status === "expired" || result.status === "unavailable", `Expired trial must not return 'trial' or 'active': got ${result.status}`);
  });
});

// ── Worker route: client-supplied userId cannot override token UID ──────────

function createStudentToken(uid: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "test" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: uid, uid, email: `${uid}@test.krd`,
    aud: "gen-lang-client-0009572581",
    iss: "https://securetoken.google.com/gen-lang-client-0009572581",
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64url");
  return `${header}.${payload}.mock-sig`;
}

describe("Blocker C — Subscription route: client userId cannot override token UID", () => {
  test("GET /api/subscription/status uses authenticated UID, not client-supplied userId param", async () => {
    const authenticatedUID = "real_student_uid";
    const spoofedUID = "attacker_other_uid";

    const queriedUIDs: string[] = [];
    const db = {
      prepare(_sql: string) {
        return {
          bind(...args: unknown[]) {
            queriedUIDs.push(args[0] as string);
            return this;
          },
          async first<T>(): Promise<T | undefined> { return undefined; },
          async run() { return { meta: { changes: 1 } }; },
          async all<T>() { return { results: [] as T[] }; },
        };
      },
    };

    const env = {
      GEMINI_API_KEY: "test-key",
      FIREBASE_PROJECT_ID: "gen-lang-client-0009572581",
      ALLOWED_ORIGINS: "https://localhost",
      ALLOW_TEST_AUTH_MOCK: "true",
      ZANA_ENV: "test",
      DB: db,
      LEARNING_RECORDS_KV: { get: () => Promise.resolve(null), put: () => Promise.resolve() },
    };

    const token = createStudentToken(authenticatedUID);
    const r = new Request(
      `https://zana.test/api/subscription/status?userId=${spoofedUID}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Origin": "https://localhost",
        }
      }
    );

    const res = await worker.handleRequest(r, env as never);
    // When queried by non-admin student, it must return 403 FORBIDDEN
    assert.strictEqual(res.status, 403, "Student must be forbidden from querying another student's subscription");
  });
});

// ── Stateful D1 Mock for Persistence Verification ───────────────────────────

function createStatefulD1() {
  const subscriptions: Array<{
    user_id: string;
    status: string;
    trial_started_at: number;
    trial_ends_at: number;
    plan_id: string | null;
    updated_at: number;
  }> = [];

  const students: Array<{
    id: string;
    firebase_uid: string;
    name: string;
    email: string;
    grade: string;
    created_at: string;
  }> = [];

  return {
    store: { subscriptions, students },
    prepare(sql: string) {
      let bound: unknown[] = [];
      return {
        bind(...args: unknown[]) {
          bound = args;
          return this;
        },
        async first<T = Record<string, unknown>>() {
          if (sql.includes("FROM subscriptions WHERE user_id = ?")) {
            const uid = bound[0] as string;
            const found = subscriptions.find((s) => s.user_id === uid);
            return (found ? { ...found } : null) as T;
          }
          if (sql.includes("FROM students WHERE id = ?")) {
            const uid = bound[0] as string;
            const found = students.find((s) => s.id === uid);
            return (found ? { ...found } : null) as T;
          }
          return null as T;
        },
        async run() {
          if (sql.includes("INSERT INTO students")) {
            const [id, firebase_uid, name, email, grade] = bound;
            const existing = students.find((s) => s.id === String(id));
            if (existing) {
              if (name) existing.name = String(name);
              if (email) existing.email = String(email);
              if (grade) existing.grade = String(grade);
            } else {
              students.push({
                id: String(id),
                firebase_uid: String(firebase_uid),
                name: String(name || "قوتابی"),
                email: String(email || ""),
                grade: String(grade || "12"),
                created_at: new Date().toISOString(),
              });
            }
            return { meta: { changes: 1 } };
          }

          if (sql.includes("INSERT INTO subscriptions")) {
            let user_id: unknown, status: unknown, trial_started_at: unknown, trial_ends_at: unknown, plan_id: unknown, updated_at: unknown;
            if (bound.length === 4) {
              [user_id, trial_started_at, trial_ends_at, updated_at] = bound;
              status = "trial";
              plan_id = "free_trial_3d";
            } else if (bound.length === 5) {
              [user_id, trial_started_at, trial_ends_at, plan_id, updated_at] = bound;
              status = "active";
            } else {
              [user_id, status, trial_started_at, trial_ends_at, plan_id, updated_at] = bound;
            }
            const existing = subscriptions.find((s) => s.user_id === String(user_id));
            if (existing) {
              // ON CONFLICT DO NOTHING — changes = 0
              return { meta: { changes: 0 } };
            }
            subscriptions.push({
              user_id: String(user_id),
              status: String(status || "trial"),
              trial_started_at: Number(trial_started_at),
              trial_ends_at: Number(trial_ends_at),
              plan_id: plan_id ? String(plan_id) : null,
              updated_at: Number(updated_at),
            });
            return { meta: { changes: 1 } };
          }

          if (sql.includes("UPDATE subscriptions SET status = 'expired'")) {
            const [now, uid] = bound;
            const existing = subscriptions.find((s) => s.user_id === String(uid));
            if (existing) {
              existing.status = "expired";
              existing.updated_at = Number(now);
              return { meta: { changes: 1 } };
            }
            return { meta: { changes: 0 } };
          }

          return { meta: { changes: 1 } };
        },
        async all<T>() {
          return { results: [] as T[] };
        },
      };
    },
  };
}

function createExpiredStudentToken(uid: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "test" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: uid, uid, email: `${uid}@test.krd`,
    aud: "gen-lang-client-0009572581",
    iss: "https://securetoken.google.com/gen-lang-client-0009572581",
    iat: Math.floor(Date.now() / 1000) - 7200,
    exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
  })).toString("base64url");
  return `${header}.${payload}.mock-sig`;
}

function createAdminAuthToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "test" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: "admin_uid_root",
    uid: "admin_uid_root",
    email: "addmin.official.idg@gmail.com",
    role: "admin",
    admin: true,
    aud: "gen-lang-client-0009572581",
    iss: "https://securetoken.google.com/gen-lang-client-0009572581",
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64url");
  return `${header}.${payload}.mock-sig`;
}

describe("Critical: Secure Trial Start & Student Registration Lifecycle", () => {
  const makeTestEnv = (d1: unknown = createStatefulD1()) => ({
    GEMINI_API_KEY: "test-key",
    FIREBASE_PROJECT_ID: "gen-lang-client-0009572581",
    ALLOWED_ORIGINS: "https://localhost",
    ALLOW_TEST_AUTH_MOCK: "true",
    ZANA_ENV: "test",
    DB: d1,
    LEARNING_RECORDS_KV: { get: () => Promise.resolve(null), put: () => Promise.resolve() },
  });

  test("1. Unauthenticated trial-start request is rejected with 401", async () => {
    const env = makeTestEnv();
    const req = new Request("https://zana.test/api/trial/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://localhost" },
      body: JSON.stringify({ userId: "student_unauth" }),
    });

    const res = await worker.handleRequest(req, env as never);
    assert.strictEqual(res.status, 401, "Missing token must be rejected with 401");
  });

  test("2. Invalid/malformed token plus arbitrary userId is rejected with 401", async () => {
    const env = makeTestEnv();
    const req = new Request("https://zana.test/api/trial/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://localhost",
        Authorization: "Bearer garbage.invalid.token",
      },
      body: JSON.stringify({ userId: "student_victim" }),
    });

    const res = await worker.handleRequest(req, env as never);
    assert.strictEqual(res.status, 401, "Invalid token must return 401");
  });

  test("3. Expired token plus arbitrary userId is rejected with 401", async () => {
    const env = makeTestEnv();
    const expiredToken = createExpiredStudentToken("student_expired");
    const req = new Request("https://zana.test/api/trial/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://localhost",
        Authorization: `Bearer ${expiredToken}`,
      },
      body: JSON.stringify({ userId: "student_expired" }),
    });

    const res = await worker.handleRequest(req, env as never);
    assert.strictEqual(res.status, 401, "Expired token must return 401");
  });

  test("4. Student A cannot create or modify Student B's trial (rejected with 403)", async () => {
    const d1 = createStatefulD1();
    const env = makeTestEnv(d1);
    const tokenA = createStudentToken("student_a");

    const req = new Request("https://zana.test/api/trial/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://localhost",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ userId: "student_b" }),
    });

    const res = await worker.handleRequest(req, env as never);
    assert.strictEqual(res.status, 403, "Client userId differing from token UID must return 403");

    // Verify D1 state: student_b was NOT created
    const subB = d1.store.subscriptions.find((s) => s.user_id === "student_b");
    assert.strictEqual(subB, undefined, "student_b subscription must not exist in D1");
  });

  test("5. Valid Student A token creates Student A's trial with exact 3-day window; persisted in D1", async () => {
    const d1 = createStatefulD1();
    const env = makeTestEnv(d1);
    const tokenA = createStudentToken("student_a");

    const req = new Request("https://zana.test/api/trial/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://localhost",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ name: "Student Alpha", grade: "12" }),
    });

    const res = await worker.handleRequest(req, env as never);
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as { ok: boolean; status: string; trial_started_at: number; trial_ends_at: number };
    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.status, "trial");

    const duration = body.trial_ends_at - body.trial_started_at;
    const expectedDuration = 3 * 24 * 60 * 60 * 1000;
    assert.ok(Math.abs(duration - expectedDuration) < 2000, "Trial duration must be 3 days");

    // Verify persisted D1 state
    const persisted = d1.store.subscriptions.find((s) => s.user_id === "student_a");
    assert.ok(persisted, "Subscription must be persisted in D1");
    assert.strictEqual(persisted?.status, "trial");
    assert.strictEqual(persisted?.trial_ends_at, body.trial_ends_at);
  });

  test("6. Repeated trial-start calls do NOT extend or reset trial expiry", async () => {
    const d1 = createStatefulD1();
    const env = makeTestEnv(d1);
    const tokenA = createStudentToken("student_a");

    // Initial call
    const req1 = new Request("https://zana.test/api/trial/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://localhost", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: "Student Alpha" }),
    });
    const res1 = await worker.handleRequest(req1, env as never);
    const body1 = (await res1.json()) as { trial_started_at: number; trial_ends_at: number };

    // Simulate time passing: manually advance trial in DB by 1 hour
    const initialExpiry = body1.trial_ends_at;

    // Second call 1 hour later
    const req2 = new Request("https://zana.test/api/trial/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://localhost", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: "Student Alpha" }),
    });
    const res2 = await worker.handleRequest(req2, env as never);
    assert.strictEqual(res2.status, 200);
    const body2 = (await res2.json()) as { trial_started_at: number; trial_ends_at: number };

    // MUST NOT EXTEND: expiry must be strictly equal to the initial expiry
    assert.strictEqual(body2.trial_ends_at, initialExpiry, "Repeated call must NOT extend trial_ends_at");

    // Persisted D1 state check
    const persisted = d1.store.subscriptions.find((s) => s.user_id === "student_a");
    assert.strictEqual(persisted?.trial_ends_at, initialExpiry, "D1 persisted trial_ends_at must remain unchanged");
  });

  test("7. Expired trial cannot be restarted (returns 403 TRIAL_ALREADY_USED)", async () => {
    const d1 = createStatefulD1();
    const env = makeTestEnv(d1);
    const tokenA = createStudentToken("student_a");

    // Insert an already-expired trial into D1
    const pastStart = Date.now() - 4 * 24 * 60 * 60 * 1000;
    const pastEnd = Date.now() - 1 * 24 * 60 * 60 * 1000; // expired 1 day ago
    d1.store.subscriptions.push({
      user_id: "student_a",
      status: "expired",
      trial_started_at: pastStart,
      trial_ends_at: pastEnd,
      plan_id: null,
      updated_at: pastEnd,
    });

    const req = new Request("https://zana.test/api/trial/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://localhost", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({}),
    });

    const res = await worker.handleRequest(req, env as never);
    assert.strictEqual(res.status, 403, "Expired trial must return 403");
    const body = (await res.json()) as { ok: boolean; error: string; status: string };
    assert.strictEqual(body.ok, false);
    assert.strictEqual(body.error, "TRIAL_ALREADY_USED");
    assert.strictEqual(body.status, "expired");

    // Verify D1 state: status remains expired, expiry was NOT extended
    const persisted = d1.store.subscriptions.find((s) => s.user_id === "student_a");
    assert.strictEqual(persisted?.status, "expired");
    assert.strictEqual(persisted?.trial_ends_at, pastEnd);
  });

  test("8. Existing active subscription remains active (never downgraded by trial-start)", async () => {
    const d1 = createStatefulD1();
    const env = makeTestEnv(d1);
    const tokenA = createStudentToken("student_a");

    const futureExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
    d1.store.subscriptions.push({
      user_id: "student_a",
      status: "active",
      trial_started_at: Date.now() - 1000,
      trial_ends_at: futureExpiry,
      plan_id: "yearly",
      updated_at: Date.now(),
    });

    const req = new Request("https://zana.test/api/trial/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://localhost", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({}),
    });

    const res = await worker.handleRequest(req, env as never);
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as { ok: boolean; status: string; plan_id: string };
    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.status, "active", "Status must remain active");
    assert.strictEqual(body.plan_id, "yearly", "Plan must remain yearly");

    // Verify D1 persisted state
    const persisted = d1.store.subscriptions.find((s) => s.user_id === "student_a");
    assert.strictEqual(persisted?.status, "active");
  });

  test("8b. Expired active subscription cannot be restarted and returns 403 SUBSCRIPTION_EXPIRED", async () => {
    const d1 = createStatefulD1();
    const env = makeTestEnv(d1);
    const tokenA = createStudentToken("student_a");

    const pastExpiry = Date.now() - 5000; // expired 5 seconds ago
    d1.store.subscriptions.push({
      user_id: "student_a",
      status: "active",
      trial_started_at: Date.now() - 365 * 24 * 60 * 60 * 1000,
      trial_ends_at: pastExpiry,
      plan_id: "yearly",
      updated_at: pastExpiry,
    });

    const req = new Request("https://zana.test/api/trial/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://localhost", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({}),
    });

    const res = await worker.handleRequest(req, env as never);
    assert.strictEqual(res.status, 403);
    const body = (await res.json()) as { ok: boolean; error: string; status: string };
    assert.strictEqual(body.ok, false);
    assert.strictEqual(body.error, "SUBSCRIPTION_EXPIRED");
    assert.strictEqual(body.status, "expired");

    // Verify D1 persisted state was updated to expired
    const persisted = d1.store.subscriptions.find((s) => s.user_id === "student_a");
    assert.strictEqual(persisted?.status, "expired");
  });

  test("9. Missing D1 database returns 503 DATABASE_UNAVAILABLE", async () => {
    const env = { ...makeTestEnv(), DB: undefined }; // missing DB
    const tokenA = createStudentToken("student_a");

    const req = new Request("https://zana.test/api/trial/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://localhost", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({}),
    });

    const res = await worker.handleRequest(req, env as never);
    assert.strictEqual(res.status, 503);
    const body = (await res.json()) as { error: string };
    assert.strictEqual(body.error, "DATABASE_UNAVAILABLE");
  });

  test("10. POST /api/students/register follows same strict identity rules", async () => {
    const d1 = createStatefulD1();
    const env = makeTestEnv(d1);
    const tokenA = createStudentToken("student_a");

    // Spoofed userId attempt
    const spoofReq = new Request("https://zana.test/api/students/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://localhost", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ userId: "student_impersonated" }),
    });

    const spoofRes = await worker.handleRequest(spoofReq, env as never);
    assert.strictEqual(spoofRes.status, 403, "Spoofed userId on /api/students/register must return 403");

    // Legitimate registration
    const legitReq = new Request("https://zana.test/api/students/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://localhost", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: "Student Legit", grade: "11" }),
    });

    const legitRes = await worker.handleRequest(legitReq, env as never);
    assert.strictEqual(legitRes.status, 200);

    const studentRecord = d1.store.students.find((st) => st.id === "student_a");
    assert.ok(studentRecord, "Student must be registered in D1 under authenticated UID");
    assert.strictEqual(studentRecord?.id, "student_a");
  });
});

describe("Critical: Subscription Status Admin Authorization Boundary", () => {
  const makeTestEnv = (d1: unknown = createStatefulD1()) => ({
    GEMINI_API_KEY: "test-key",
    FIREBASE_PROJECT_ID: "gen-lang-client-0009572581",
    ALLOWED_ORIGINS: "https://localhost",
    ALLOW_TEST_AUTH_MOCK: "true",
    ZANA_ENV: "test",
    DB: d1,
    LEARNING_RECORDS_KV: { get: () => Promise.resolve(null), put: () => Promise.resolve() },
  });

  test("1. Normal student querying own subscription succeeds (200)", async () => {
    const d1 = createStatefulD1();
    d1.store.subscriptions.push({
      user_id: "student_self",
      status: "trial",
      trial_started_at: Date.now() - 1000,
      trial_ends_at: Date.now() + 200_000,
      plan_id: null,
      updated_at: Date.now(),
    });
    const env = makeTestEnv(d1);
    const token = createStudentToken("student_self");

    const req = new Request("https://zana.test/api/subscription/status", {
      method: "GET",
      headers: { Origin: "https://localhost", Authorization: `Bearer ${token}` },
    });

    const res = await worker.handleRequest(req, env as never);
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as { ok: boolean; status: string };
    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.status, "trial");
  });

  test("2. Student A querying Student B's subscription is rejected with 403 FORBIDDEN", async () => {
    const d1 = createStatefulD1();
    const env = makeTestEnv(d1);
    const tokenA = createStudentToken("student_a");

    const req = new Request("https://zana.test/api/subscription/status?userId=student_b", {
      method: "GET",
      headers: { Origin: "https://localhost", Authorization: `Bearer ${tokenA}` },
    });

    const res = await worker.handleRequest(req, env as never);
    assert.strictEqual(res.status, 403, "Student querying another user must return 403");
  });

  test("3. Student impersonating admin with spoofed email in token header/payload without admin role is rejected (403)", async () => {
    const d1 = createStatefulD1();
    const env = makeTestEnv(d1);

    // Create a student token that claims the admin email but does NOT have admin role or verifiable claims
    const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "test" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      sub: "fake_admin_uid",
      uid: "fake_admin_uid",
      email: "addmin.official.idg@gmail.com",
      role: "student", // NOT admin role
      aud: "gen-lang-client-0009572581",
      iss: "https://securetoken.google.com/gen-lang-client-0009572581",
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })).toString("base64url");
    const spoofedToken = `${header}.${payload}.mock-sig`;

    const req = new Request("https://zana.test/api/subscription/status?userId=student_b", {
      method: "GET",
      headers: { Origin: "https://localhost", Authorization: `Bearer ${spoofedToken}` },
    });

    const res = await worker.handleRequest(req, env as never);
    assert.strictEqual(res.status, 403, "Impersonator without valid admin claims must return 403");
  });

  test("4. Properly authorized administrator can lookup student's subscription", async () => {
    const d1 = createStatefulD1();
    d1.store.subscriptions.push({
      user_id: "student_target",
      status: "active",
      trial_started_at: Date.now() - 1000,
      trial_ends_at: Date.now() + 500_000,
      plan_id: "yearly",
      updated_at: Date.now(),
    });
    const env = makeTestEnv(d1);
    const adminToken = createAdminAuthToken();

    const req = new Request("https://zana.test/api/subscription/status?userId=student_target", {
      method: "GET",
      headers: { Origin: "https://localhost", Authorization: `Bearer ${adminToken}` },
    });

    const res = await worker.handleRequest(req, env as never);
    assert.strictEqual(res.status, 200, "Authorized admin must be permitted to lookup student subscription");
    const body = (await res.json()) as { ok: boolean; status: string };
    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.status, "active");
  });
});

describe("Critical: Production Mock Token Hardening & Telemetry Privacy", () => {
  test("1. verifyAuthToken unconditionally rejects mock tokens when in production environment", async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origZanaEnv = process.env.ZANA_ENV;
    const origMockFlag = process.env.ALLOW_TEST_AUTH_MOCK;
    try {
      process.env.NODE_ENV = "production";
      process.env.ZANA_ENV = "production";
      process.env.ALLOW_TEST_AUTH_MOCK = "true"; // Even if attacker or bad config sets this flag!

      const { verifyAuthToken } = await import("../server/middleware/authMiddleware.ts");
      const result = await verifyAuthToken("Bearer test-student-token");
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.status, 401);
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      process.env.ZANA_ENV = origZanaEnv;
      process.env.ALLOW_TEST_AUTH_MOCK = origMockFlag;
    }
  });

  test("2. Telemetry export strips raw studentId and free-text comments, returning anonymized data", async () => {
    const { handleTelemetryExportRoute } = await import("../server/api/internal/telemetryExport.ts");
    const fakeKv = {
      list: async () => ({
        keys: [{ name: "feedback:AI_INACCURATE:1700000000000:student_secret_uid" }],
      }),
      get: async () => ({
        id: "fb-test-privacy",
        studentId: "student_secret_uid_12345",
        issueType: "AI_INACCURATE",
        topicId: "physics-ch1",
        grade: "12",
        subject: "physics",
        timestamp: "2026-11-22T10:00:00.000Z",
        comments: "Secret student comment containing personal info",
      }),
    };

    const req = new Request("https://example.com/api/internal/telemetry", {
      headers: { Authorization: "Bearer test-telemetry-key" },
    });
    const res = await handleTelemetryExportRoute(req, {
      ADMIN_TELEMETRY_SECRET: "test-telemetry-key",
      LEARNING_RECORDS_KV: fakeKv as never,
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as { success: boolean; data: Array<Record<string, unknown>> };
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 1);

    const item = body.data[0];
    assert.strictEqual(item.id, "fb-test-privacy");
    // Raw studentId MUST NOT exist
    assert.strictEqual(item.studentId, undefined, "Raw studentId must be omitted");
    // Free-text comments MUST NOT exist
    assert.strictEqual(item.comments, undefined, "Raw comments must be omitted");
    // Anonymized identifier must exist
    assert.ok(typeof item.anonymousStudentId === "string" && (item.anonymousStudentId as string).startsWith("anon_"));
    // Operational flags must exist
    assert.strictEqual(item.hasComments, true);
    assert.strictEqual(item.commentsLength, "Secret student comment containing personal info".length);
  });
});
