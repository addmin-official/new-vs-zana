/**
 * ZANA Platform - Client Subscription & FastPay Receipt Service
 * خزمەتگوزاری بەشداریکردن، وەرگرتنی دۆخی هەژمار و تۆمارکردنی پسوولەی فاستپەی
 */

export interface StudentSubscriptionStatus {
  ok: boolean;
  status: "trial" | "active" | "expired";
  trial_started_at: number;
  trial_ends_at: number;
  plan_id: string | null;
  days_remaining: number;
}

export interface SubmitReceiptPayload {
  userId: string;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  planId: "monthly" | "yearly";
  receiptCode: string;
  notes?: string;
}

export interface MyReceiptRecord {
  id: string;
  user_id: string;
  student_name?: string;
  student_phone?: string;
  plan_id: "monthly" | "yearly";
  amount: string;
  receipt_code: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  submitted_at: number;
  reviewed_at?: number;
}

/**
 * Fetch live subscription status for a given student User ID from D1
 */
export async function getSubscriptionStatus(userId: string): Promise<StudentSubscriptionStatus> {
  if (!userId) {
    return {
      ok: false,
      status: "trial",
      trial_started_at: Date.now(),
      trial_ends_at: Date.now() + 3 * 86400000,
      plan_id: null,
      days_remaining: 3,
    };
  }

  try {
    const res = await fetch(`/api/subscription/status?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("[subscriptionService] getSubscriptionStatus error:", err);
    return {
      ok: false,
      status: "trial",
      trial_started_at: Date.now(),
      trial_ends_at: Date.now() + 3 * 86400000,
      plan_id: null,
      days_remaining: 3,
    };
  }
}

/**
 * Submit FastPay transaction receipt code for manual verification & activation
 */
export async function submitPaymentReceipt(
  payload: SubmitReceiptPayload
): Promise<{ ok: boolean; receiptId?: string; message: string }> {
  const res = await fetch("/api/subscription/submit-receipt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "هەڵەیەک لە تۆمارکردنی پسوولەدا ڕوویدا");
  }
  return data;
}

/**
 * Fetch student's submitted receipts to check live verification status
 */
export async function getMyReceipts(userId: string): Promise<{ ok: boolean; receipts: MyReceiptRecord[] }> {
  if (!userId) return { ok: true, receipts: [] };
  try {
    const res = await fetch(`/api/subscription/my-receipts?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[subscriptionService] getMyReceipts error:", err);
    return { ok: true, receipts: [] };
  }
}
