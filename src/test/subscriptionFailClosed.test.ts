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

    await worker.handleRequest(r, env as never);

    // The DB must have been queried with the AUTHENTICATED UID, never the spoofed one
    const usedSpoofedUID = queriedUIDs.some(uid => uid === spoofedUID);
    assert.ok(!usedSpoofedUID, `Server must NOT query with client-supplied spoofed userId="${spoofedUID}". Queried: ${JSON.stringify(queriedUIDs)}`);
    if (queriedUIDs.length > 0) {
      assert.strictEqual(queriedUIDs[0], authenticatedUID, "Must query with authenticated UID from token");
    }
  });
});
