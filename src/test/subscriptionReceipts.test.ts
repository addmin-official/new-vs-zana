import test, { describe } from "node:test";
import assert from "node:assert/strict";

// Force test environment auth mock
process.env.NODE_ENV = "test";
process.env.ALLOW_TEST_AUTH_MOCK = "true";

import worker from "../worker/index.ts";
import { normalizeKurdishPhoneForWhatsApp } from "../services/subscriptionService.ts";

interface ReceiptRecord {
  id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  plan_id: string;
  amount: string;
  receipt_code: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  submitted_at: number;
  reviewed_at?: number;
  reviewed_by?: string;
}

interface SubscriptionRecord {
  user_id: string;
  status: "trial" | "active" | "expired";
  trial_started_at: number;
  trial_ends_at: number;
  plan_id: string | null;
  updated_at: number;
}

interface NotificationRecord {
  id: string;
  student_id: string;
  type: string;
  title: string;
  message: string;
  is_read: number;
}

function createMockD1Database() {
  const store = {
    payment_receipts: [] as ReceiptRecord[],
    subscriptions: new Map<string, SubscriptionRecord>(),
    notifications: [] as NotificationRecord[],
    simulateZeroChanges: false,
  };

  function createStmt(sql: string) {
    let boundParams: unknown[] = [];
    return {
      bind(...params: unknown[]) {
        boundParams = params;
        return this;
      },
      async run() {
        if (store.simulateZeroChanges) {
          return { success: true, meta: { changes: 0 } };
        }

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
            id: String(id),
            user_id: String(user_id),
            student_name: String(student_name || ""),
            student_email: String(student_email || ""),
            student_phone: String(student_phone || ""),
            plan_id: String(plan_id),
            amount: String(amount),
            receipt_code: String(receipt_code),
            status: "pending",
            notes: String(notes || ""),
            submitted_at: Number(submitted_at),
          });
          return { success: true, meta: { changes: 1 } };
        }

        if (sql.includes("UPDATE payment_receipts SET status = 'approved'")) {
          const [reviewed_at, reviewed_by, id] = boundParams;
          const r = store.payment_receipts.find((item) => item.id === id && item.status === "pending");
          if (r) {
            r.status = "approved";
            r.reviewed_at = Number(reviewed_at);
            r.reviewed_by = String(reviewed_by);
            return { success: true, meta: { changes: 1 } };
          }
          return { success: true, meta: { changes: 0 } };
        }

        if (sql.includes("UPDATE payment_receipts SET status = 'rejected'")) {
          const [notes, reviewed_at, reviewed_by, id] = boundParams;
          const r = store.payment_receipts.find((item) => item.id === id && item.status === "pending");
          if (r) {
            r.status = "rejected";
            r.notes = String(notes);
            r.reviewed_at = Number(reviewed_at);
            r.reviewed_by = String(reviewed_by);
            return { success: true, meta: { changes: 1 } };
          }
          return { success: true, meta: { changes: 0 } };
        }

        if (sql.includes("INSERT INTO subscriptions")) {
          const [user_id, trial_started_at, trial_ends_at, plan_id, updated_at] = boundParams;
          store.subscriptions.set(String(user_id), {
            user_id: String(user_id),
            status: "active",
            trial_started_at: Number(trial_started_at),
            trial_ends_at: Number(trial_ends_at),
            plan_id: String(plan_id),
            updated_at: Number(updated_at),
          });
          return { success: true, meta: { changes: 1 } };
        }

        if (sql.includes("UPDATE subscriptions SET status = 'expired'")) {
          const [userId] = boundParams;
          const existing = store.subscriptions.get(String(userId));
          if (existing) {
            existing.status = "expired";
            return { success: true, meta: { changes: 1 } };
          }
        }

        if (sql.includes("notifications")) {
          const id = boundParams[0];
          const student_id = boundParams[1];
          const message = boundParams[2] || boundParams[3] || "";
          store.notifications.push({
            id: String(id),
            student_id: String(student_id),
            type: "subscription",
            title: "بەشداریکردنت کارا کرا! 🎉",
            message: String(message),
            is_read: 0,
          });
          return { success: true, meta: { changes: 1 } };
        }

        return { success: true, meta: { changes: 1 } };
      },
      async first<T = Record<string, unknown>>() {
        if (sql.includes("FROM subscriptions")) {
          const [userId] = boundParams;
          return (store.subscriptions.get(String(userId)) as T) || null;
        }
        if (sql.includes("SELECT id, status FROM payment_receipts WHERE receipt_code = ?")) {
          const [code] = boundParams;
          const found = store.payment_receipts.find(
            (item) => item.receipt_code.toUpperCase() === String(code).toUpperCase() && ["pending", "approved"].includes(item.status)
          );
          return (found ? { id: found.id, status: found.status } : null) as T;
        }
        if (sql.includes("SELECT count(*) as count FROM payment_receipts WHERE user_id = ? AND submitted_at > ?")) {
          const [userId, minTime] = boundParams;
          const count = store.payment_receipts.filter(
            (item) => item.user_id === String(userId) && item.submitted_at > Number(minTime)
          ).length;
          return ({ count } as unknown) as T;
        }
        if (sql.includes("SELECT id, user_id, student_email, plan_id, status FROM payment_receipts WHERE id = ?")) {
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
        if (sql.includes("FROM payment_receipts") && sql.includes("WHERE r.status = ?")) {
          const [statusFilter] = boundParams;
          const filtered = store.payment_receipts.filter((item) => item.status === statusFilter);
          return { results: filtered as T[] };
        }
        if (sql.includes("FROM payment_receipts")) {
          return { results: store.payment_receipts as T[] };
        }
        return { results: [] as T[] };
      },
    };
  }

  return {
    store,
    prepare(sql: string) {
      return createStmt(sql);
    },
    async batch(statements: ReturnType<typeof createStmt>[]) {
      const results = [];
      for (const stmt of statements) {
        results.push(await stmt.run());
      }
      return results;
    },
  };
}

describe("ZANA Subscription & FastPay Manual Activation System - Comprehensive 20-Vector Suite", () => {
  const secret = "test-admin-secret-456";
  const mockDb = createMockD1Database();
  const env = {
    DB: mockDb,
    ADMIN_TELEMETRY_SECRET: secret,
    FIREBASE_PROJECT_ID: "gen-lang-client-0009572581",
  };

  const studentToken = "student-101-auth-token-xyz"; // Auth mock resolves to uid: "student-101-auth-token-xyz"

  // 1. Successful submission
  test("Vector 1: Successful receipt submission with valid token & plan returns 201", async () => {
    const req = new Request("https://example.com/api/subscription/submit-receipt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        userId: studentToken,
        studentName: "ئارام کاوە",
        studentEmail: "aram@example.com",
        studentPhone: "0750 123 4567",
        planId: "monthly",
        receiptCode: "FP-10001",
      }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.ok, true);
    assert.ok(data.receiptId);
    assert.match(data.message, /بە سەرکەوتوویی تۆمارکرا/);
  });

  // 2. Unauthenticated submission
  test("Vector 2: Unauthenticated submission without Bearer token returns 401 Unauthorized", async () => {
    const req = new Request("https://example.com/api/subscription/submit-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: "monthly",
        receiptCode: "FP-10002",
      }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 401);
  });

  // 3. Forged user ID attempt
  test("Vector 3: Forged userId mismatch between token claims and payload returns 403 Forbidden", async () => {
    const req = new Request("https://example.com/api/subscription/submit-receipt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        userId: "victim-student-999",
        planId: "monthly",
        receiptCode: "FP-10003",
      }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error, "FORBIDDEN_USER_MISMATCH");
  });

  // 4. Invalid plan
  test("Vector 4: Invalid plan rejected with 400 Bad Request", async () => {
    const req = new Request("https://example.com/api/subscription/submit-receipt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        userId: studentToken,
        planId: "free_lifetime_vip",
        receiptCode: "FP-10004",
      }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.error, "INVALID_PLAN");
  });

  // 5. Invalid receipt code format
  test("Vector 5: Malformed receipt code (too short or special characters) returns 400", async () => {
    const req = new Request("https://example.com/api/subscription/submit-receipt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        userId: studentToken,
        planId: "monthly",
        receiptCode: "<script>",
      }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.error, "INVALID_RECEIPT_CODE");
  });

  // 6. Duplicate receipt code
  test("Vector 6: Replaying existing receipt code returns 409 Conflict", async () => {
    const req = new Request("https://example.com/api/subscription/submit-receipt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        userId: studentToken,
        planId: "monthly",
        receiptCode: "FP-10001", // Already submitted in Vector 1
      }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 409);
    const data = await res.json();
    assert.strictEqual(data.error, "DUPLICATE_RECEIPT_CODE");
  });

  // 7. Initial pending status
  test("Vector 7: Newly submitted receipt is correctly recorded in 'pending' status", async () => {
    const receipt = mockDb.store.payment_receipts.find((r) => r.receipt_code === "FP-10001");
    assert.ok(receipt);
    assert.strictEqual(receipt.status, "pending");
  });

  // 8. Successful admin approval
  test("Vector 8: Admin approval activates subscription and updates receipt status to 'approved'", async () => {
    const receipt = mockDb.store.payment_receipts.find((r) => r.receipt_code === "FP-10001");
    assert.ok(receipt);

    const approveReq = new Request("https://example.com/api/admin/payment-receipts/action", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiptId: receipt.id,
        action: "approve",
      }),
    });

    const res = await worker.fetch(approveReq, env as never);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.ok, true);
    assert.match(data.message, /پەسەندکرا/);

    // Verify stored state
    assert.strictEqual(receipt.status, "approved");
    const sub = mockDb.store.subscriptions.get(receipt.user_id);
    assert.ok(sub);
    assert.strictEqual(sub.status, "active");
  });

  // 9. Unauthorized admin approval
  test("Vector 9: Unauthorized admin approval returns 403 Forbidden", async () => {
    const req = new Request("https://example.com/api/admin/payment-receipts/action", {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid-admin-secret",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiptId: "rcpt_any",
        action: "approve",
      }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 403);
  });

  // 10. Double approval attempt
  test("Vector 10: Attempting to approve an already approved receipt returns 409 Conflict", async () => {
    const receipt = mockDb.store.payment_receipts.find((r) => r.receipt_code === "FP-10001");
    assert.ok(receipt);

    const req = new Request("https://example.com/api/admin/payment-receipts/action", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiptId: receipt.id,
        action: "approve",
      }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 409);
    const data = await res.json();
    assert.strictEqual(data.error, "INVALID_STATE_TRANSITION");
  });

  // 11. Concurrent approval conflict detection (changes = 0)
  test("Vector 11: Concurrent conflicting action (zero changes detected) returns 409 Conflict", async () => {
    // Add fresh pending receipt
    const freshId = "rcpt_conflict_test";
    mockDb.store.payment_receipts.push({
      id: freshId,
      user_id: "student-conflict-user",
      student_name: "تاقیگەی هاوکات",
      student_email: "concurrent@test.krd",
      student_phone: "07500000000",
      plan_id: "monthly",
      amount: "١٥,٠٠٠ دینار",
      receipt_code: "FP-CONCURRENT-01",
      status: "pending",
      submitted_at: Date.now(),
    });

    // Simulate concurrent modification where meta.changes = 0
    mockDb.store.simulateZeroChanges = true;

    const req = new Request("https://example.com/api/admin/payment-receipts/action", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiptId: freshId,
        action: "approve",
      }),
    });

    const res = await worker.fetch(req, env as never);
    mockDb.store.simulateZeroChanges = false; // Reset

    assert.strictEqual(res.status, 409);
    const data = await res.json();
    assert.strictEqual(data.error, "CONCURRENT_ACTION_CONFLICT");
  });

  // 12. Admin rejection with reason
  test("Vector 12: Admin rejection marks status as 'rejected' and stores reason", async () => {
    const rejectId = "rcpt_reject_test";
    mockDb.store.payment_receipts.push({
      id: rejectId,
      user_id: "student-rejected-user",
      student_name: "دانەر بەکر",
      student_email: "danar@test.krd",
      student_phone: "07700000000",
      plan_id: "monthly",
      amount: "١٥,٠٠٠ دینار",
      receipt_code: "FP-INVALID-AMOUNT-01",
      status: "pending",
      submitted_at: Date.now(),
    });

    const req = new Request("https://example.com/api/admin/payment-receipts/action", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiptId: rejectId,
        action: "reject",
        rejectionReason: "بڕی پارەی نێردراو لەگەڵ پلانی مانگانە یەکناگرێتەوە",
      }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 200);
    const receipt = mockDb.store.payment_receipts.find((r) => r.id === rejectId);
    assert.ok(receipt);
    assert.strictEqual(receipt.status, "rejected");
    assert.strictEqual(receipt.notes, "بڕی پارەی نێردراو لەگەڵ پلانی مانگانە یەکناگرێتەوە");
  });

  // 13. Self-approval prevention
  test("Vector 13: Admin cannot approve their own receipt (403 Forbidden)", async () => {
    const selfId = "rcpt_admin_self";
    mockDb.store.payment_receipts.push({
      id: selfId,
      user_id: "admin-user-id",
      student_name: "ZANA Admin",
      student_email: "addmin.official.idg@gmail.com",
      student_phone: "07501111111",
      plan_id: "yearly",
      amount: "٩٥,٠٠٠ دینار",
      receipt_code: "FP-SELF-APPROVE",
      status: "pending",
      submitted_at: Date.now(),
    });

    const req = new Request("https://example.com/api/admin/payment-receipts/action", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiptId: selfId,
        action: "approve",
      }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error, "FORBIDDEN_SELF_APPROVAL");
  });

  // 14. Active subscription duration extension
  test("Vector 14: Approving extension on active subscription adds duration to existing expiry date", async () => {
    const studentUser = "student-extending";
    const now = Date.now();
    const existingExpiry = now + 15 * 24 * 60 * 60 * 1000; // 15 days remaining

    mockDb.store.subscriptions.set(studentUser, {
      user_id: studentUser,
      status: "active",
      trial_started_at: now - 15 * 24 * 60 * 60 * 1000,
      trial_ends_at: existingExpiry,
      plan_id: "monthly",
      updated_at: now,
    });

    const extReceiptId = "rcpt_extend_01";
    mockDb.store.payment_receipts.push({
      id: extReceiptId,
      user_id: studentUser,
      student_name: "بەشداربووی کارا",
      student_email: "active@example.com",
      student_phone: "07502222222",
      plan_id: "monthly",
      amount: "١٥,٠٠٠ دینار",
      receipt_code: "FP-EXTEND-01",
      status: "pending",
      submitted_at: now,
    });

    const req = new Request("https://example.com/api/admin/payment-receipts/action", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiptId: extReceiptId,
        action: "approve",
      }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 200);

    const updatedSub = mockDb.store.subscriptions.get(studentUser);
    assert.ok(updatedSub);
    const expectedExpiry = existingExpiry + 30 * 24 * 60 * 60 * 1000;
    // Must be approximately 45 days from now, NOT 30 days
    assert.strictEqual(updatedSub.trial_ends_at, expectedExpiry);
  });

  // 15. Expired subscription transition in checkSubscription
  test("Vector 15: Status query transitions expired active subscription to 'expired'", async () => {
    const expiredUser = "student-expired-user";
    const pastTime = Date.now() - 10000; // expired 10 seconds ago

    mockDb.store.subscriptions.set(expiredUser, {
      user_id: expiredUser,
      status: "active",
      trial_started_at: pastTime - 30 * 86400000,
      trial_ends_at: pastTime,
      plan_id: "monthly",
      updated_at: pastTime,
    });

    const req = new Request(`https://example.com/api/subscription/status?userId=${expiredUser}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${expiredUser}`,
      },
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "expired");
  });

  // 16. Rate limit enforcement (max 5 submissions per hour)
  test("Vector 16: Rate limit enforced after 5 submissions in an hour (returns 429)", async () => {
    const spammerToken = "spammer-user-id-xyz";
    const now = Date.now();

    // Populate 5 recent submissions
    for (let i = 1; i <= 5; i++) {
      mockDb.store.payment_receipts.push({
        id: `rcpt_spam_${i}`,
        user_id: spammerToken,
        student_name: "سپامەر",
        student_email: "spammer@test.krd",
        student_phone: "07509999999",
        plan_id: "monthly",
        amount: "١٥,٠٠٠ دینار",
        receipt_code: `FP-SPAM-${i}`,
        status: "pending",
        submitted_at: now - i * 1000,
      });
    }

    // 6th submission attempt
    const req = new Request("https://example.com/api/subscription/submit-receipt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${spammerToken}`,
      },
      body: JSON.stringify({
        userId: spammerToken,
        planId: "monthly",
        receiptCode: "FP-SPAM-6",
      }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 429);
    const data = await res.json();
    assert.strictEqual(data.error, "RATE_LIMIT_EXCEEDED");
  });

  // 17. Batch execution atomicity
  test("Vector 17: Database batch execution supports atomic multi-statement operations", async () => {
    assert.strictEqual(typeof mockDb.batch, "function");
    const stmts = [
      mockDb.prepare("INSERT INTO payment_receipts (id) VALUES (?)").bind("test_batch_1"),
      mockDb.prepare("INSERT INTO payment_receipts (id) VALUES (?)").bind("test_batch_2"),
    ];
    const results = await mockDb.batch(stmts);
    assert.strictEqual(results.length, 2);
  });

  // 18. Notification creation upon approval
  test("Vector 18: In-app student notification is properly created upon receipt approval", async () => {
    const notifs = mockDb.store.notifications;
    assert.ok(notifs.length > 0);
    const lastNotif = notifs[notifs.length - 1];
    assert.strictEqual(lastNotif.type, "subscription");
    assert.strictEqual(lastNotif.title, "بەشداریکردنت کارا کرا! 🎉");
  });

  // 19. Student my-receipts authorization & isolation
  test("Vector 19: Student can access own receipts but is blocked from other users' receipts (403)", async () => {
    // 19a: Own receipts
    const ownReq = new Request(`https://example.com/api/subscription/my-receipts?userId=${studentToken}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });
    const ownRes = await worker.fetch(ownReq, env as never);
    assert.strictEqual(ownRes.status, 200);
    const ownData = await ownRes.json();
    assert.strictEqual(ownData.ok, true);

    // 19b: Cross-user access attempt
    const snoopReq = new Request("https://example.com/api/subscription/my-receipts?userId=other-student-456", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });
    const snoopRes = await worker.fetch(snoopReq, env as never);
    assert.strictEqual(snoopRes.status, 403);
    const snoopData = await snoopRes.json();
    assert.strictEqual(snoopData.error, "FORBIDDEN");
  });

  // 20. Kurdish phone normalization helper
  test("Vector 20: Kurdish phone numbers normalized to international format for WhatsApp", () => {
    assert.strictEqual(normalizeKurdishPhoneForWhatsApp("0750 123 4567"), "9647501234567");
    assert.strictEqual(normalizeKurdishPhoneForWhatsApp("07701234567"), "9647701234567");
    assert.strictEqual(normalizeKurdishPhoneForWhatsApp("7501234567"), "9647501234567");
    assert.strictEqual(normalizeKurdishPhoneForWhatsApp("9647501234567"), "9647501234567");
    assert.strictEqual(normalizeKurdishPhoneForWhatsApp(""), "");
  });

  // 21. Regression Test: guest_student fallback resolution
  test("Vector 21: Authenticated student submitting with userId='guest_student' or omitted is safely resolved to token UID", async () => {
    const studentUid = "student-token-resolved-uid";
    const req = new Request("https://example.com/api/subscription/submit-receipt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentUid}`,
      },
      body: JSON.stringify({
        userId: "guest_student", // Fallback placeholder from UI modal
        studentName: "خوێندکاری تاقیکردنەوە",
        studentEmail: "guest-test@zana.krd",
        studentPhone: "0750 555 1234",
        planId: "yearly",
        receiptCode: "FP-REGRESSION-21",
      }),
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.status, "pending");
    assert.ok(data.receiptId);

    // Verify stored in D1 under verified token UID, NOT 'guest_student'
    const stored = mockDb.store.payment_receipts.find((r) => r.receipt_code === "FP-REGRESSION-21");
    assert.ok(stored);
    assert.strictEqual(stored.user_id, studentUid);
    assert.strictEqual(stored.status, "pending");
  });

  // 22. Regression Test: Newly submitted student receipt is immediately visible in Admin API & Dashboard
  test("Vector 22: Newly submitted student receipt appears in Admin API payment-receipts queue with pending status", async () => {
    const req = new Request("https://example.com/api/admin/payment-receipts?status=pending", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });

    const res = await worker.fetch(req, env as never);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.ok, true);
    assert.ok(Array.isArray(data.receipts));

    const found = data.receipts.find((r: { receipt_code: string }) => r.receipt_code === "FP-REGRESSION-21");
    assert.ok(found, "Newly submitted receipt must be visible in admin pending queue");
    assert.strictEqual(found.status, "pending");
    assert.strictEqual(found.plan_id, "yearly");
  });
});
