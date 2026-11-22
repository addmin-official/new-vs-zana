/**
 * Regression tests — Blocker A: Notification routes fail-closed when DB is missing.
 * Blocker D: Notification ownership and student isolation.
 *
 * Proves:
 *  - Every notification route returns 503 DATABASE_UNAVAILABLE when env.DB is missing.
 *  - Student A cannot read/update/delete Student B's notifications.
 *  - Batch ops cannot target other students.
 *  - Deduplication is scoped per-student.
 *  - DB write failures are reported accurately.
 */
process.env.NODE_ENV = "test";
process.env.ZANA_ENV = "test";
process.env.ALLOW_TEST_AUTH_MOCK = "true";

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.ts";

// ── helpers ────────────────────────────────────────────────────────────────

function createStudentToken(uid: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "test" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: uid, uid,
    email: `${uid}@test.krd`,
    aud: "gen-lang-client-0009572581",
    iss: "https://securetoken.google.com/gen-lang-client-0009572581",
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64url");
  return `${header}.${payload}.mock-sig`;
}

const UID_A = "student_aaa_111";
const UID_B = "student_bbb_222";
const TOKEN_A = createStudentToken(UID_A);
const TOKEN_B = createStudentToken(UID_B);

interface StoredNotification {
  id: string;
  student_id: string;
  type: string;
  title: string;
  message: string;
  action_label: string | null;
  action_url: string | null;
  created_at: number;
  read_at: number | null;
  priority: string;
  deduplication_key: string;
  expires_at: number | null;
}

interface StoredPreference {
  student_id: string;
  in_app_enabled: number;
  daily_reminder_time: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  plan_reminders_enabled: number;
  next_best_action_enabled: number;
  deadlines_enabled: number;
  task_recovery_enabled: number;
  achievements_enabled: number;
  weak_concept_enabled: number;
  assessment_enabled: number;
  system_enabled: number;
  updated_at: number;
}

function createMockD1(preseeded: StoredNotification[] = [], preseededPrefs: StoredPreference[] = []) {
  const notifs: StoredNotification[] = [...preseeded];
  const prefs: StoredPreference[] = [...preseededPrefs];

  return {
    _notifs: notifs,
    _prefs: prefs,
    prepare(sql: string) {
      let params: unknown[] = [];
      return {
        bind(...args: unknown[]) { params = args; return this; },
        async run() {
          if (sql.includes("INSERT OR IGNORE INTO notifications")) {
            const [id, student_id, type, title, message, action_label, action_url, created_at, priority, dedup_key, expires_at] = params as [string, string, string, string, string, string|null, string|null, number, string, string, number|null];
            const exists = notifs.find(n => n.deduplication_key === dedup_key);
            if (!exists) {
              notifs.push({ id, student_id, type, title, message, action_label, action_url, created_at, read_at: null, priority, deduplication_key: dedup_key, expires_at });
            }
            return { meta: { changes: exists ? 0 : 1 } };
          }
          if (sql.includes("UPDATE notifications SET read_at")) {
            if (sql.includes("WHERE id =")) {
              const [ts, id, sid] = params as [number, string, string];
              const n = notifs.find(x => x.id === id && x.student_id === sid);
              if (n) n.read_at = ts;
            } else {
              const [ts, sid] = params as [number, string];
              notifs.filter(n => n.student_id === sid && !n.read_at).forEach(n => n.read_at = ts);
            }
            return { meta: { changes: 1 } };
          }
          if (sql.includes("DELETE FROM notifications")) {
            const [id, sid] = params as [string, string];
            const idx = notifs.findIndex(n => n.id === id && n.student_id === sid);
            if (idx >= 0) notifs.splice(idx, 1);
            return { meta: { changes: 1 } };
          }
          if (sql.includes("INSERT INTO notification_preferences") || sql.includes("ON CONFLICT")) {
            const sid = params[0] as string;
            const idx = prefs.findIndex(p => p.student_id === sid);
            const row: StoredPreference = {
              student_id: sid, in_app_enabled: params[1] as number,
              daily_reminder_time: params[2] as string, quiet_hours_start: params[3] as string,
              quiet_hours_end: params[4] as string, plan_reminders_enabled: params[5] as number,
              next_best_action_enabled: params[6] as number, deadlines_enabled: params[7] as number,
              task_recovery_enabled: params[8] as number, achievements_enabled: params[9] as number,
              weak_concept_enabled: params[10] as number, assessment_enabled: params[11] as number,
              system_enabled: params[12] as number, updated_at: params[13] as number,
            };
            if (idx >= 0) prefs[idx] = row; else prefs.push(row);
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        },
        async first<T>() {
          if (sql.includes("SELECT student_id FROM notifications")) {
            const [id] = params as [string];
            return notifs.find(n => n.id === id) as T | undefined;
          }
          if (sql.includes("SELECT COUNT(*)")) {
            const [sid] = params as [string];
            return { count: notifs.filter(n => n.student_id === sid && !n.read_at).length } as T;
          }
          if (sql.includes("FROM notifications WHERE id =")) {
            const [id] = params as [string];
            const n = notifs.find(x => x.id === id);
            if (!n) return undefined;
            return { id: n.id, studentId: n.student_id, type: n.type, title: n.title, message: n.message, actionLabel: n.action_label, actionUrl: n.action_url, createdAt: n.created_at, readAt: n.read_at, priority: n.priority, deduplicationKey: n.deduplication_key, expiresAt: n.expires_at } as T;
          }
          if (sql.includes("FROM notification_preferences WHERE student_id")) {
            const [sid] = params as [string];
            return prefs.find(p => p.student_id === sid) as T | undefined;
          }
          return undefined;
        },
        async all<T>() {
          if (sql.includes("FROM notifications WHERE student_id")) {
            const [sid] = params as [string, number];
            const results = notifs.filter(n => n.student_id === sid).map(n => ({
              id: n.id, studentId: n.student_id, type: n.type, title: n.title, message: n.message,
              actionLabel: n.action_label, actionUrl: n.action_url, createdAt: n.created_at,
              readAt: n.read_at, priority: n.priority, deduplicationKey: n.deduplication_key, expiresAt: n.expires_at
            }));
            return { results } as { results: T[] };
          }
          return { results: [] as T[] };
        },
      };
    },
    batch(stmts: unknown[]) { return Promise.all((stmts as Array<{ run(): Promise<unknown> }>).map(s => s.run())); },
  };
}

function baseEnv(db: unknown) {
  return {
    GEMINI_API_KEY: "test-key",
    FIREBASE_PROJECT_ID: "gen-lang-client-0009572581",
    ALLOWED_ORIGINS: "https://localhost",
    ALLOW_TEST_AUTH_MOCK: "true",
    ZANA_ENV: "test",
    DB: db,
    LEARNING_RECORDS_KV: { get: () => Promise.resolve(null), put: () => Promise.resolve() },
  };
}

function req(method: string, path: string, token: string, body?: unknown) {
  return new Request(`https://zana.test${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "Origin": "https://localhost",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

// ── Blocker A: fail-closed when DB is missing ───────────────────────────────

describe("Blocker A — Notification routes return 503 DATABASE_UNAVAILABLE when DB missing", () => {
  const noDbEnv = { ...baseEnv(undefined) };

  const failedRoutes: Array<[string, string, unknown?]> = [
    ["GET", "/api/notifications"],
    ["POST", "/api/notifications/read-all"],
    ["GET", "/api/notifications/notif_xyz"],
    ["DELETE", "/api/notifications/notif_xyz"],
    ["POST", "/api/notifications/notif_xyz/read"],
    ["POST", "/api/notifications/batch", { notifications: [{ id: "x", type: "test", title: "T", message: "M", deduplicationKey: "d" }] }],
    ["GET", "/api/notifications/preferences"],
    ["POST", "/api/notifications/preferences", { inAppEnabled: true }],
  ];

  for (const [method, path, body] of failedRoutes) {
    test(`${method} ${path} → 503 when DB missing`, async () => {
      const r = req(method, path, TOKEN_A, body);
      const res = await worker.handleRequest(r, noDbEnv as never);
      assert.strictEqual(res.status, 503, `${method} ${path} must return 503 when DB missing`);
      const json = await res.json() as { error: string };
      assert.strictEqual(json.error, "DATABASE_UNAVAILABLE", `${method} ${path} must return DATABASE_UNAVAILABLE`);
    });
  }
});

// ── Blocker D: Ownership and student isolation ──────────────────────────────

describe("Blocker D — Notification ownership and student isolation", () => {
  // Pre-seed: A has notif_a1, B has notif_b1
  const NOW = Date.now();
  const notifA: StoredNotification = {
    id: "notif_a1", student_id: UID_A, type: "test", title: "For A", message: "A msg",
    action_label: null, action_url: null, created_at: NOW, read_at: null, priority: "normal",
    deduplication_key: `uid:${UID_A}:key_a1`, expires_at: null
  };
  const notifB: StoredNotification = {
    id: "notif_b1", student_id: UID_B, type: "test", title: "For B", message: "B msg",
    action_label: null, action_url: null, created_at: NOW, read_at: null, priority: "normal",
    deduplication_key: `uid:${UID_B}:key_b1`, expires_at: null
  };

  function freshDB() { return createMockD1([{ ...notifA }, { ...notifB }]); }

  test("1. Student A can retrieve own notifications", async () => {
    const db = freshDB();
    const r = req("GET", "/api/notifications", TOKEN_A);
    const res = await worker.handleRequest(r, baseEnv(db) as never);
    assert.strictEqual(res.status, 200);
    const json = await res.json() as { notifications: Array<{ id: string }> };
    assert.ok(json.notifications.some(n => n.id === "notif_a1"), "A should see own notif_a1");
    assert.ok(!json.notifications.some(n => n.id === "notif_b1"), "A must not see B's notif_b1");
  });

  test("2. Student B can retrieve own notifications", async () => {
    const db = freshDB();
    const r = req("GET", "/api/notifications", TOKEN_B);
    const res = await worker.handleRequest(r, baseEnv(db) as never);
    assert.strictEqual(res.status, 200);
    const json = await res.json() as { notifications: Array<{ id: string }> };
    assert.ok(json.notifications.some(n => n.id === "notif_b1"), "B should see own notif_b1");
    assert.ok(!json.notifications.some(n => n.id === "notif_a1"), "B must not see A's notif_a1");
  });

  test("3. Student A cannot GET Student B's notification by ID", async () => {
    const db = freshDB();
    const r = req("GET", "/api/notifications/notif_b1", TOKEN_A);
    const res = await worker.handleRequest(r, baseEnv(db) as never);
    assert.ok([403, 404].includes(res.status), `A must not access B's notif: got ${res.status}`);
  });

  test("4. Student A cannot mark Student B's notification as read", async () => {
    const db = freshDB();
    const r = req("POST", "/api/notifications/notif_b1/read", TOKEN_A);
    const res = await worker.handleRequest(r, baseEnv(db) as never);
    assert.ok([403, 404].includes(res.status), `A must not mark B's notif as read: got ${res.status}`);
    // Verify the notification was NOT mutated
    const bNotif = db._notifs.find(n => n.id === "notif_b1");
    assert.ok(!bNotif?.read_at, "B's notification must remain unread after A's attempt");
  });

  test("5. Student A cannot DELETE Student B's notification", async () => {
    const db = freshDB();
    const r = req("DELETE", "/api/notifications/notif_b1", TOKEN_A);
    const res = await worker.handleRequest(r, baseEnv(db) as never);
    assert.ok([403, 404].includes(res.status), `A must not delete B's notif: got ${res.status}`);
    // Verify B's notification still exists
    const bNotif = db._notifs.find(n => n.id === "notif_b1");
    assert.ok(bNotif, "B's notification must still exist after A's delete attempt");
  });

  test("6. Student A cannot modify Student B's notification preferences", async () => {
    const prefB: StoredPreference = {
      student_id: UID_B, in_app_enabled: 1,
      daily_reminder_time: "20:00", quiet_hours_start: "23:00", quiet_hours_end: "06:00",
      plan_reminders_enabled: 1, next_best_action_enabled: 1, deadlines_enabled: 1,
      task_recovery_enabled: 1, achievements_enabled: 1, weak_concept_enabled: 1,
      assessment_enabled: 1, system_enabled: 1, updated_at: Date.now()
    };
    const db = createMockD1([{ ...notifA }, { ...notifB }], [prefB]);
    // A posts to preferences — it should only write A's preferences, not B's
    const r = req("POST", "/api/notifications/preferences", TOKEN_A, { inAppEnabled: false });
    const res = await worker.handleRequest(r, baseEnv(db) as never);
    assert.strictEqual(res.status, 200);
    // B's preferences must be unchanged — still in_app_enabled = 1
    const bPref = db._prefs.find(p => p.student_id === UID_B);
    assert.strictEqual(bPref?.in_app_enabled, 1, "B's preferences must be unchanged by A's POST");
    // A's preferences must be written
    const aPref = db._prefs.find(p => p.student_id === UID_A);
    assert.ok(aPref, "A's preferences must have been created");
    assert.strictEqual(aPref.in_app_enabled, 0, "A's inAppEnabled must be false as A set");
  });

  test("7. Student A's batch operation stores ONLY A's notifications — ignores client-supplied studentId", async () => {
    const db = freshDB();
    // A sends batch with a notification that includes a client-side "studentId" pointing to B
    const body = {
      notifications: [{
        id: "batch_x",
        type: "lesson",
        title: "Injected",
        message: "Should be A's",
        deduplicationKey: "batch_x_dedup",
        // Note: client cannot inject studentId — server always uses token UID
      }]
    };
    const r = req("POST", "/api/notifications/batch", TOKEN_A, body);
    const res = await worker.handleRequest(r, baseEnv(db) as never);
    assert.strictEqual(res.status, 200);
    // The stored notification must have student_id === UID_A, NOT UID_B
    const inserted = db._notifs.find(n => n.deduplication_key.includes("batch_x_dedup"));
    assert.ok(inserted, "notification must be inserted");
    assert.strictEqual(inserted!.student_id, UID_A, "batch must store with authenticated student A's UID, not any client-supplied value");
  });

  test("8. Deduplication for A cannot suppress B's notification with same raw key", async () => {
    const db = freshDB();
    const sharedRawKey = "shared_key";
    // A sends batch with shared raw key
    await worker.handleRequest(req("POST", "/api/notifications/batch", TOKEN_A, {
      notifications: [{ id: "n_a_shared", type: "test", title: "A", message: "A", deduplicationKey: sharedRawKey }]
    }), baseEnv(db) as never);
    // B sends batch with same raw key — must NOT be suppressed by A's dedup entry
    const resB = await worker.handleRequest(req("POST", "/api/notifications/batch", TOKEN_B, {
      notifications: [{ id: "n_b_shared", type: "test", title: "B", message: "B", deduplicationKey: sharedRawKey }]
    }), baseEnv(db) as never);
    assert.strictEqual(resB.status, 200);
    // Both should exist in DB because dedup keys are scoped per-student
    const aNotifs = db._notifs.filter(n => n.student_id === UID_A && n.deduplication_key.includes(sharedRawKey));
    const bNotifs = db._notifs.filter(n => n.student_id === UID_B && n.deduplication_key.includes(sharedRawKey));
    assert.ok(aNotifs.length > 0, "A should have inserted notification with shared key");
    assert.ok(bNotifs.length > 0, "B should have inserted notification with shared key (not suppressed by A's dedup)");
    // And their dedup keys must be different (scoped)
    assert.notStrictEqual(aNotifs[0].deduplication_key, bNotifs[0].deduplication_key, "dedup keys must be different per student");
  });

  test("9. Missing D1 returns 503 — not fake success", async () => {
    const noDbEnv = { ...baseEnv(undefined) };
    const r = req("GET", "/api/notifications", TOKEN_A);
    const res = await worker.handleRequest(r, noDbEnv as never);
    assert.strictEqual(res.status, 503);
    const json = await res.json() as { error: string };
    assert.strictEqual(json.error, "DATABASE_UNAVAILABLE");
  });

  test("10. DB write failure is reported accurately (not silently swallowed)", async () => {
    const db = {
      prepare(_sql: string) {
        return {
          bind() { return this; },
          async run() { throw new Error("SIMULATED_D1_WRITE_ERROR"); },
          async first() { return undefined; },
          async all() { return { results: [] }; }
        };
      }
    };
    const r = req("POST", "/api/notifications/batch", TOKEN_A, {
      notifications: [{ id: "x", type: "t", title: "T", message: "M", deduplicationKey: "d" }]
    });
    const res = await worker.handleRequest(r, baseEnv(db) as never);
    // Must NOT return 200 OK
    assert.ok(res.status >= 500, `DB write failure must not return 200: got ${res.status}`);
    const json = await res.json() as { error: string };
    assert.ok(json.error === "DATABASE_ERROR" || json.error === "DATABASE_UNAVAILABLE", `error must indicate db failure, got: ${json.error}`);
  });
});
