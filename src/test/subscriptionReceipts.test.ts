import test, { describe } from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.ts";

function createMockD1Database() {
  const store: {
    payment_receipts: Array<Record<string, unknown>>;
    subscriptions: Map<string, Record<string, unknown>>;
    notifications: Array<Record<string, unknown>>;
  } = {
    payment_receipts: [],
    subscriptions: new Map(),
    notifications: [],
  };

  return {
    prepare(sql: string) {
      let boundParams: unknown[] = [];
      return {
        bind(...params: unknown[]) {
          boundParams = params;
          return this;
        },
        async run() {
          if (sql.includes("INSERT INTO payment_receipts")) {
            const [
              id,
              user_id,
              student_name,
              student_email,
              student_phone,
              plan_id,
              amount,
              receipt_code,
              notes,
              submitted_at,
            ] = boundParams;
            store.payment_receipts.push({
              id,
              user_id,
              student_name,
              student_email,
              student_phone,
              plan_id,
              amount,
              receipt_code,
              status: "pending",
              notes,
              submitted_at,
            });
            return { success: true };
          }

          if (sql.includes("UPDATE payment_receipts SET status = 'approved'")) {
            const [reviewed_at, reviewed_by, id] = boundParams;
            const r = store.payment_receipts.find((item) => item.id === id);
            if (r) {
              r.status = "approved";
              r.reviewed_at = reviewed_at;
              r.reviewed_by = reviewed_by;
            }
            return { success: true };
          }

          if (sql.includes("UPDATE payment_receipts SET status = 'rejected'")) {
            const [notes, reviewed_at, reviewed_by, id] = boundParams;
            const r = store.payment_receipts.find((item) => item.id === id);
            if (r) {
              r.status = "rejected";
              r.notes = notes;
              r.reviewed_at = reviewed_at;
              r.reviewed_by = reviewed_by;
            }
            return { success: true };
          }

          if (sql.includes("INSERT INTO subscriptions")) {
            const [user_id, trial_started_at, trial_ends_at, plan_id, updated_at] = boundParams;
            store.subscriptions.set(String(user_id), {
              user_id,
              status: "active",
              trial_started_at,
              trial_ends_at,
              plan_id,
              updated_at,
            });
            return { success: true };
          }

          if (sql.includes("INSERT INTO notifications")) {
            const [id, student_id, type, title, message] = boundParams;
            store.notifications.push({ id, student_id, type, title, message, is_read: 0 });
            return { success: true };
          }

          return { success: true };
        },
        async first<T = Record<string, unknown>>() {
          if (sql.includes("FROM subscriptions")) {
            const [userId] = boundParams;
            return (store.subscriptions.get(String(userId)) as T) || null;
          }
          if (sql.includes("SELECT id, user_id, plan_id, status FROM payment_receipts WHERE id = ?")) {
            const [receiptId] = boundParams;
            const found = store.payment_receipts.find((item) => item.id === receiptId);
            return (found as T) || null;
          }
          return null;
        },
        async all<T = Record<string, unknown>>() {
          if (sql.includes("FROM payment_receipts") && sql.includes("WHERE user_id = ?")) {
            const [userId] = boundParams;
            const filtered = store.payment_receipts.filter((item) => item.user_id === userId);
            return { results: filtered as T[] };
          }
          if (sql.includes("FROM payment_receipts")) {
            return { results: store.payment_receipts as T[] };
          }
          return { results: [] as T[] };
        },
      };
    },
  };
}

describe("ZANA Subscription & FastPay Manual Activation System", () => {
  const secret = "test-admin-secret-456";
  const mockDb = createMockD1Database();
  const env = {
    DB: mockDb,
    ADMIN_TELEMETRY_SECRET: secret,
  };

  test("POST /api/subscription/submit-receipt - rejects missing userId", async () => {
    const req = new Request("https://example.com/api/subscription/submit-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptCode: "FP-123456" }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /userId/i);
  });

  test("POST /api/subscription/submit-receipt - rejects missing receiptCode", async () => {
    const req = new Request("https://example.com/api/subscription/submit-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "student-101", receiptCode: "" }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 400);
  });

  test("POST /api/subscription/submit-receipt - successfully submits FastPay receipt", async () => {
    const req = new Request("https://example.com/api/subscription/submit-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "student-101",
        studentName: "ئارام کاوە",
        studentEmail: "aram@example.com",
        studentPhone: "0750 123 4567",
        planId: "monthly",
        receiptCode: "FASTPAY-987654321",
      }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.ok, true);
    assert.ok(data.receiptId);
    assert.match(data.message, /بە سەرکەوتوویی تۆمارکرا/);
  });

  test("GET /api/subscription/my-receipts - returns submitted receipts for student", async () => {
    const req = new Request("https://example.com/api/subscription/my-receipts?userId=student-101", {
      method: "GET",
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.receipts.length, 1);
    assert.strictEqual(data.receipts[0].receipt_code, "FASTPAY-987654321");
    assert.strictEqual(data.receipts[0].status, "pending");
  });

  test("GET /api/admin/payment-receipts - rejects non-admin requests", async () => {
    const req = new Request("https://example.com/api/admin/payment-receipts", {
      method: "GET",
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 403);
  });

  test("GET /api/admin/payment-receipts - returns receipts to verified admin", async () => {
    const req = new Request("https://example.com/api/admin/payment-receipts", {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.receipts.length, 1);
  });

  test("POST /api/admin/payment-receipts/action - approves receipt and activates user in subscriptions", async () => {
    // Get receipt ID from earlier submission
    const listReq = new Request("https://example.com/api/admin/payment-receipts", {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    });
    const listRes = await worker.fetch(listReq, env as never);
    const listData = await listRes.json();
    const receiptId = listData.receipts[0].id;

    // Approve receipt
    const approveReq = new Request("https://example.com/api/admin/payment-receipts/action", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiptId,
        action: "approve",
      }),
    });

    const approveRes = await worker.fetch(approveReq, env as never);
    assert.strictEqual(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.ok, true);
    assert.match(approveData.message, /پەسەندکرا/);

    // Verify subscription status is now active
    const statusReq = new Request("https://example.com/api/subscription/status?userId=student-101", {
      method: "GET",
    });
    const statusRes = await worker.fetch(statusReq, env as never);
    assert.strictEqual(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.strictEqual(statusData.ok, true);
    assert.strictEqual(statusData.status, "active");
  });
});
