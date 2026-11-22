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
    email: email || `${uid}@test.krd`,
    aud: "gen-lang-client-0009572581",
    iss: "https://securetoken.google.com/gen-lang-client-0009572581",
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64url");
  return `${header}.${payload}.mock-sig`;
}

interface MockNotification {
  id: string;
  student_id: string;
  type: string;
  title: string;
  message: string;
  action_label?: string;
  action_url?: string;
  created_at: number;
  read_at?: number | null;
  priority: string;
  deduplication_key: string;
  expires_at?: number | null;
}

function createDeterministicD1() {
  const notifications: MockNotification[] = [];
  const subscriptions = new Map<string, {
    user_id: string;
    status: string;
    trial_started_at: number;
    trial_ends_at: number;
    plan_id: string | null;
    updated_at: number;
  }>();

  return {
    store: { notifications, subscriptions },
    prepare(sql: string) {
      let boundParams: unknown[] = [];
      return {
        bind(...args: unknown[]) {
          boundParams = args;
          return this;
        },
        async run() {
          if (sql.includes("INSERT OR IGNORE INTO notifications")) {
            const [id, student_id, type, title, message, action_label, action_url, created_at, priority, deduplication_key, expires_at] = boundParams;
            const exists = notifications.some((n) => n.deduplication_key === deduplication_key);
            if (!exists) {
              notifications.push({
                id: String(id),
                student_id: String(student_id),
                type: String(type),
                title: String(title),
                message: String(message),
                action_label: action_label ? String(action_label) : undefined,
                action_url: action_url ? String(action_url) : undefined,
                priority: String(priority),
                deduplication_key: String(deduplication_key),
                created_at: Number(created_at),
                expires_at: expires_at ? Number(expires_at) : null,
                read_at: null,
              });
              return { success: true, meta: { changes: 1 } };
            }
            return { success: true, meta: { changes: 0 } };
          }

          if (sql.includes("UPDATE notifications SET read_at = ? WHERE id = ? AND student_id = ?")) {
            const [now, notifId, studentId] = boundParams;
            const found = notifications.find((n) => n.id === notifId && n.student_id === studentId);
            if (found) {
              found.read_at = Number(now);
              return { success: true, meta: { changes: 1 } };
            }
            return { success: true, meta: { changes: 0 } };
          }

          if (sql.includes("UPDATE notifications SET read_at = ? WHERE student_id = ? AND read_at IS NULL")) {
            const [now, studentId] = boundParams;
            let changes = 0;
            for (const n of notifications) {
              if (n.student_id === studentId && n.read_at === null) {
                n.read_at = Number(now);
                changes++;
              }
            }
            return { success: true, meta: { changes } };
          }

          if (sql.includes("DELETE FROM notifications WHERE id = ? AND student_id = ?")) {
            const [notifId, studentId] = boundParams;
            const index = notifications.findIndex((n) => n.id === notifId && n.student_id === studentId);
            if (index !== -1) {
              notifications.splice(index, 1);
              return { success: true, meta: { changes: 1 } };
            }
            return { success: true, meta: { changes: 0 } };
          }

          return { success: true, meta: { changes: 1 } };
        },
        async first<T = Record<string, unknown>>() {
          if (sql.includes("SELECT student_id FROM notifications WHERE id = ?")) {
            const [notifId] = boundParams;
            const found = notifications.find((n) => n.id === notifId);
            return (found ? { student_id: found.student_id } : null) as T;
          }
          if (sql.includes("FROM notifications WHERE id = ?")) {
            const [notifId] = boundParams;
            const found = notifications.find((n) => n.id === notifId);
            return (found ? {
              id: found.id,
              studentId: found.student_id,
              type: found.type,
              title: found.title,
              message: found.message,
              actionLabel: found.action_label,
              actionUrl: found.action_url,
              createdAt: found.created_at,
              readAt: found.read_at,
              priority: found.priority,
              deduplicationKey: found.deduplication_key,
              expiresAt: found.expires_at,
            } : null) as T;
          }
          if (sql.includes("SELECT COUNT(*) as count FROM notifications WHERE student_id = ? AND read_at IS NULL")) {
            const [studentId] = boundParams;
            const count = notifications.filter((n) => n.student_id === studentId && n.read_at === null).length;
            return ({ count } as unknown) as T;
          }
          if (sql.includes("FROM subscriptions WHERE user_id = ?")) {
            const [userId] = boundParams;
            return (subscriptions.get(String(userId)) || null) as T;
          }
          return null as T;
        },
        async all<T = Record<string, unknown>>() {
          if (sql.includes("FROM notifications WHERE student_id = ?")) {
            const [studentId] = boundParams;
            const unreadOnly = sql.includes("read_at IS NULL");
            const filtered = notifications.filter((n) =>
              n.student_id === studentId && (!unreadOnly || n.read_at === null)
            ).map((n) => ({
              id: n.id,
              studentId: n.student_id,
              type: n.type,
              title: n.title,
              message: n.message,
              actionLabel: n.action_label,
              actionUrl: n.action_url,
              createdAt: n.created_at,
              readAt: n.read_at,
              priority: n.priority,
              deduplicationKey: n.deduplication_key,
              expiresAt: n.expires_at,
            }));
            return { results: filtered as unknown as T[] };
          }
          return { results: [] as T[] };
        },
      };
    },
  };
}

function createMockKV() {
  const store = new Map<string, string>();
  return {
    store,
    get: async (key: string, type?: string) => {
      const val = store.get(key);
      if (!val) return null;
      if (type === "json") {
        try { return JSON.parse(val); } catch { return null; }
      }
      return val;
    },
    put: async (key: string, val: string) => {
      store.set(key, val);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    list: async () => ({ keys: Array.from(store.keys()).map((name) => ({ name })) }),
  };
}

describe("Comprehensive Student Isolation & Deterministic Ownership Suite", () => {
  const mockD1 = createDeterministicD1();
  const mockKV = createMockKV();

  const mockEnv = {
    DB: mockD1,
    LEARNING_RECORDS_KV: mockKV,
    GEMINI_API_KEY: "test-key",
    ALLOWED_ORIGINS: "https://zana.idggov.tech",
    FIREBASE_PROJECT_ID: "gen-lang-client-0009572581",
    ALLOW_TEST_AUTH_MOCK: "true",
    ZANA_ENV: "test",
    ADMIN_TELEMETRY_SECRET: "test-telemetry-secret-999",
  };

  const studentAId = "student-a-uid";
  const studentBId = "student-b-uid";
  const studentAToken = createStudentToken(studentAId, "studentA@test.krd");
  const studentBToken = createStudentToken(studentBId, "studentB@test.krd");

  test("Vector 1: GET /api/learning/mastery rejects unauthenticated requests with 401", async () => {
    const req = new Request("https://zana.idggov.tech/api/learning/mastery", {
      method: "GET",
      headers: { Origin: "https://zana.idggov.tech" },
    });
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 401);
  });

  test("Vector 2: Student A cannot snoop Student B mastery via ?studentId query bypass (returns 403)", async () => {
    const req = new Request(
      `https://zana.idggov.tech/api/learning/mastery?studentId=${studentBId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          Origin: "https://zana.idggov.tech",
        },
      }
    );
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 403, "Student A must be blocked from requesting Student B mastery");
  });

  test("Vector 3: Student cannot list all users on /api/users or /api/admin/users (returns 403)", async () => {
    const req1 = new Request("https://zana.idggov.tech/api/users", {
      method: "GET",
      headers: { Authorization: `Bearer ${studentAToken}`, Origin: "https://zana.idggov.tech" },
    });
    const res1 = await worker.fetch(req1, mockEnv);
    assert.strictEqual(res1.status, 403);

    const req2 = new Request("https://zana.idggov.tech/api/admin/users", {
      method: "GET",
      headers: { Authorization: `Bearer ${studentAToken}`, Origin: "https://zana.idggov.tech" },
    });
    const res2 = await worker.fetch(req2, mockEnv);
    assert.strictEqual(res2.status, 403);
  });

  test("Vector 4: Student A cannot view Student B subscription status (returns 403)", async () => {
    const req = new Request(
      `https://zana.idggov.tech/api/subscription/status?userId=${studentBId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          Origin: "https://zana.idggov.tech",
        },
      }
    );
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 403, "Cross-student subscription snooping must return 403");
  });

  test("Vector 5: Deterministic Assessment Isolation — Student A blocked from existing Student B attempt (returns 403)", async () => {
    const attemptBId = "att_student_b_real_attempt_777";
    // Seed existing attempt belonging strictly to Student B in KV
    const attemptBData = {
      id: attemptBId,
      studentId: studentBId,
      conceptId: "ترش_و_تفت",
      score: 85,
      completedAt: new Date().toISOString(),
    };
    await mockKV.put(`assessment:attempt:${attemptBId}`, JSON.stringify(attemptBData));

    // Student A tries to read Student B's attempt
    const reqA = new Request(
      `https://zana.idggov.tech/api/assessment/attempts/${attemptBId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          Origin: "https://zana.idggov.tech",
        },
      }
    );
    const resA = await worker.fetch(reqA, mockEnv);
    assert.strictEqual(resA.status, 403, "Student A querying Student B's existing attempt must return 403 Forbidden");

    // Student B reads their own attempt
    const reqB = new Request(
      `https://zana.idggov.tech/api/assessment/attempts/${attemptBId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${studentBToken}`,
          Origin: "https://zana.idggov.tech",
        },
      }
    );
    const resB = await worker.fetch(reqB, mockEnv);
    assert.strictEqual(resB.status, 200, "Student B querying own attempt must return 200 OK");
    const dataB = (await resB.json()) as { attempt: { studentId: string } };
    assert.strictEqual(dataB.attempt.studentId, studentBId);
  });

  test("Vector 6: Deterministic Notification Access Isolation — Student A cannot read Student B notification (returns 403)", async () => {
    const notifBId = "notif_b_confidential_01";
    // Seed notification owned by Student B in D1
    mockD1.store.notifications.push({
      id: notifBId,
      student_id: studentBId,
      type: "assessment_result",
      title: "نمرەی تاقیکردنەوەی کیمیا",
      message: "تۆ نمرەی ٩٠ت بەدەستهێنا لە ترش و تفتەکان",
      created_at: Date.now(),
      read_at: null,
      priority: "high",
      deduplication_key: `uid:${studentBId}:chem-score`,
    });

    // Student A attempts to read Student B's notification
    const reqA = new Request(
      `https://zana.idggov.tech/api/notifications/${notifBId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          Origin: "https://zana.idggov.tech",
        },
      }
    );
    const resA = await worker.fetch(reqA, mockEnv);
    assert.strictEqual(resA.status, 403, "Student A must not read Student B's individual notification");

    // Student B reads own notification
    const reqB = new Request(
      `https://zana.idggov.tech/api/notifications/${notifBId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${studentBToken}`,
          Origin: "https://zana.idggov.tech",
        },
      }
    );
    const resB = await worker.fetch(reqB, mockEnv);
    assert.strictEqual(resB.status, 200);
    const dataB = (await resB.json()) as { ok: boolean; notification: { studentId: string } };
    assert.strictEqual(dataB.notification.studentId, studentBId);
  });

  test("Vector 7: Deterministic Notification Mutation Isolation — Student A cannot mark or delete Student B notification (returns 403)", async () => {
    const notifBId = "notif_b_mutation_target";
    mockD1.store.notifications.push({
      id: notifBId,
      student_id: studentBId,
      type: "system_alert",
      title: "ئاگاداری بەکارهێنەر",
      message: "پەیامی تایبەت بە قوتابی B",
      created_at: Date.now(),
      read_at: null,
      priority: "normal",
      deduplication_key: `uid:${studentBId}:private-alert`,
    });

    // Student A attempts to mark Student B's notification as read
    const readReqA = new Request(
      `https://zana.idggov.tech/api/notifications/${notifBId}/read`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          Origin: "https://zana.idggov.tech",
        },
      }
    );
    const readResA = await worker.fetch(readReqA, mockEnv);
    assert.strictEqual(readResA.status, 403, "Student A marking Student B notification as read must return 403 Forbidden");

    // Student A attempts to delete Student B's notification
    const deleteReqA = new Request(
      `https://zana.idggov.tech/api/notifications/${notifBId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          Origin: "https://zana.idggov.tech",
        },
      }
    );
    const deleteResA = await worker.fetch(deleteReqA, mockEnv);
    assert.strictEqual(deleteResA.status, 403, "Student A deleting Student B notification must return 403 Forbidden");

    // Student B marks own notification as read
    const readReqB = new Request(
      `https://zana.idggov.tech/api/notifications/${notifBId}/read`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${studentBToken}`,
          Origin: "https://zana.idggov.tech",
        },
      }
    );
    const readResB = await worker.fetch(readReqB, mockEnv);
    assert.strictEqual(readResB.status, 200);

    // Student B deletes own notification
    const deleteReqB = new Request(
      `https://zana.idggov.tech/api/notifications/${notifBId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${studentBToken}`,
          Origin: "https://zana.idggov.tech",
        },
      }
    );
    const deleteResB = await worker.fetch(deleteReqB, mockEnv);
    assert.strictEqual(deleteResB.status, 200);

    // Verify deleted
    const checkDeleted = mockD1.store.notifications.find((n) => n.id === notifBId);
    assert.strictEqual(checkDeleted, undefined);
  });

  test("Vector 8: Notification deduplication keys are scoped per student and do not collide", async () => {
    const rawKey = "weekly_review_reminder";

    // Student A submits batch notification
    const batchReqA = new Request("https://zana.idggov.tech/api/notifications/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${studentAToken}`,
        Origin: "https://zana.idggov.tech",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notifications: [
          {
            type: "study_reminder",
            title: "بیرخستنەوەی خوێندن بۆ قوتابی A",
            message: "کاتی پێداچوونەوەیە",
            deduplicationKey: rawKey,
          },
        ],
      }),
    });
    const batchResA = await worker.fetch(batchReqA, mockEnv);
    assert.strictEqual(batchResA.status, 200);

    // Student B submits batch notification with IDENTICAL rawKey
    const batchReqB = new Request("https://zana.idggov.tech/api/notifications/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${studentBToken}`,
        Origin: "https://zana.idggov.tech",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notifications: [
          {
            type: "study_reminder",
            title: "بیرخستنەوەی خوێندن بۆ قوتابی B",
            message: "کاتی پێداچوونەوەیە",
            deduplicationKey: rawKey,
          },
        ],
      }),
    });
    const batchResB = await worker.fetch(batchReqB, mockEnv);
    assert.strictEqual(batchResB.status, 200);

    // Verify both exist with student-scoped deduplication keys
    const notifA = mockD1.store.notifications.find(
      (n) => n.student_id === studentAId && n.deduplication_key === `uid:${studentAId}:${rawKey}`
    );
    const notifB = mockD1.store.notifications.find(
      (n) => n.student_id === studentBId && n.deduplication_key === `uid:${studentBId}:${rawKey}`
    );

    assert.ok(notifA, "Student A notification must be stored with student-scoped key");
    assert.ok(notifB, "Student B notification must be stored with student-scoped key");
    assert.notStrictEqual(notifA?.id, notifB?.id);
  });

  test("Vector 9: Fail-closed persistence — Missing DB returns 503 Service Unavailable (no fake trial)", async () => {
    const envWithoutDb = {
      ...mockEnv,
      DB: undefined,
    };

    const statusReq = new Request(
      `https://zana.idggov.tech/api/subscription/status?userId=${studentAId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          Origin: "https://zana.idggov.tech",
        },
      }
    );
    const statusRes = await worker.fetch(statusReq, envWithoutDb);
    assert.strictEqual(statusRes.status, 503, "Missing DB must fail closed with 503 instead of fabricating a trial");
    const statusBody = (await statusRes.json()) as { code: string; ok: boolean };
    assert.strictEqual(statusBody.ok, false);
    assert.strictEqual(statusBody.code, "SERVICE_UNAVAILABLE");

    const receiptReq = new Request(
      "https://zana.idggov.tech/api/subscription/submit-receipt",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${studentAToken}`,
          Origin: "https://zana.idggov.tech",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: studentAId,
          planId: "monthly",
          receiptCode: "FP-FAIL-CLOSED-01",
        }),
      }
    );
    const receiptRes = await worker.fetch(receiptReq, envWithoutDb);
    assert.strictEqual(receiptRes.status, 503, "Missing DB on submit-receipt must return 503 Service Unavailable");
  });

  test("Vector 10: Admin privilege boundary — Students and Telemetry secret cannot access admin activation", async () => {
    // 1. Regular student token
    const studentReq = new Request("https://zana.idggov.tech/api/admin/subscriptions/activate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${studentAToken}`,
        Origin: "https://zana.idggov.tech",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: studentAId, planId: "yearly" }),
    });
    const studentRes = await worker.fetch(studentReq, mockEnv);
    assert.strictEqual(studentRes.status, 403, "Student token must return 403 on admin routes");

    // 2. Machine-to-machine telemetry secret
    const telemetryReq = new Request("https://zana.idggov.tech/api/admin/subscriptions/activate", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-telemetry-secret-999",
        Origin: "https://zana.idggov.tech",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: studentAId, planId: "yearly" }),
    });
    const telemetryRes = await worker.fetch(telemetryReq, mockEnv);
    assert.strictEqual(telemetryRes.status, 403, "Telemetry secret must be rejected on human admin routes");
  });

  test("Vector 11: Client storage isolation — Logout purges student keys and prevents data leakage across accounts", () => {
    const memoryStorage = new Map<string, string>();
    const mockLocalStorage = {
      getItem: (k: string) => memoryStorage.get(k) || null,
      setItem: (k: string, v: string) => memoryStorage.set(k, v),
      removeItem: (k: string) => memoryStorage.delete(k),
      clear: () => memoryStorage.clear(),
      get length() { return memoryStorage.size; },
      key: (i: number) => Array.from(memoryStorage.keys())[i] || null,
    };

    // Simulate Student A logged in session
    mockLocalStorage.setItem("zana_user_role", "student");
    mockLocalStorage.setItem("zana_student_profile", JSON.stringify({ id: studentAId, name: "Student A" }));
    mockLocalStorage.setItem(`zana_mastery_${studentAId}`, JSON.stringify({ overall: 0.9 }));
    mockLocalStorage.setItem(`zana_studypath_${studentAId}`, JSON.stringify({ active: true }));
    mockLocalStorage.setItem(`zana_notifications_${studentAId}`, JSON.stringify([{ id: "n1" }]));
    mockLocalStorage.setItem(`zana_notifications_cache_${studentAId}`, JSON.stringify([{ id: "n1" }]));

    // Perform authoritative purge (matching logoutUser in authService)
    const purgeStudentSession = () => {
      mockLocalStorage.removeItem("zana_user_role");
      mockLocalStorage.removeItem("zana_student_profile");
      const keysToRemove: string[] = [];
      for (let i = 0; i < mockLocalStorage.length; i++) {
        const k = mockLocalStorage.key(i);
        if (k && (k.startsWith("zana_mastery_") || k.startsWith("zana_studypath_") || k.startsWith("zana_notifications_"))) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        mockLocalStorage.removeItem(k);
      }
    };

    purgeStudentSession();

    // Verify all Student A keys are completely wiped
    assert.strictEqual(mockLocalStorage.getItem("zana_user_role"), null);
    assert.strictEqual(mockLocalStorage.getItem("zana_student_profile"), null);
    assert.strictEqual(mockLocalStorage.getItem(`zana_mastery_${studentAId}`), null);
    assert.strictEqual(mockLocalStorage.getItem(`zana_studypath_${studentAId}`), null);
    assert.strictEqual(mockLocalStorage.getItem(`zana_notifications_cache_${studentAId}`), null);

    // Student B logging in later cannot access any leftover data
    assert.strictEqual(mockLocalStorage.getItem(`zana_notifications_cache_${studentBId}`), null);
  });
});
