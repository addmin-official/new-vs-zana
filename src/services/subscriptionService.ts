/**
 * ZANA Platform - Client Subscription & FastPay Receipt Service
 * خزمەتگوزاری بەشداریکردن، وەرگرتنی دۆخی هەژمار و تۆمارکردنی پسوولەی فاستپەی
 */

import { getFirebaseAuth } from "./firebase.ts";

export interface StudentSubscriptionStatus {
  ok: boolean;
  status: "trial" | "active" | "expired";
  trial_started_at: number;
  trial_ends_at: number;
  plan_id: string | null;
  days_remaining: number;
}

export interface SubmitReceiptPayload {
  userId?: string;
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
 * Normalizes an Iraqi Kurdish phone number to the international format required by WhatsApp (9647XXXXXXXXX).
 */
export function normalizeKurdishPhoneForWhatsApp(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("07") && digits.length === 11) {
    return "964" + digits.substring(1);
  }
  if (digits.startsWith("7") && digits.length === 10) {
    return "964" + digits;
  }
  if (digits.startsWith("964")) {
    return digits;
  }
  return digits;
}

async function getAuthHeaders(extraHeaders: Record<string, string> = {}): Promise<Headers> {
  const headers = new Headers(extraHeaders);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      headers.set("Authorization", `Bearer ${token}`);
    } catch (err) {
      console.warn("[subscriptionService] Failed to retrieve token:", err);
    }
  }
  return headers;
}

/**
 * Fetch live subscription status for a given student User ID from D1
 */
export async function getSubscriptionStatus(userId?: string): Promise<StudentSubscriptionStatus> {
  try {
    const headers = await getAuthHeaders();
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    const res = await fetch(`/api/subscription/status${query}`, { headers });
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
): Promise<{ ok: boolean; receiptId?: string; status?: string; message: string }> {
  const headers = await getAuthHeaders();
  const auth = getFirebaseAuth();
  const currentUid = auth?.currentUser?.uid;
  const currentEmail = auth?.currentUser?.email;
  const currentName = auth?.currentUser?.displayName;

  const normalizedPayload: SubmitReceiptPayload = {
    ...payload,
    userId: currentUid || (payload.userId && payload.userId !== "guest_student" ? payload.userId : currentUid),
    studentEmail: payload.studentEmail || currentEmail || undefined,
    studentName: payload.studentName || currentName || undefined,
  };

  const res = await fetch("/api/subscription/submit-receipt", {
    method: "POST",
    headers,
    body: JSON.stringify(normalizedPayload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.error || "هەڵەیەک لە تۆمارکردنی پسوولەدا ڕوویدا");
  }
  return data;
}

/**
 * Fetch student's submitted receipts to check live verification status
 */
export async function getMyReceipts(userId?: string): Promise<{ ok: boolean; receipts: MyReceiptRecord[] }> {
  try {
    const headers = await getAuthHeaders();
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    const res = await fetch(`/api/subscription/my-receipts${query}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[subscriptionService] getMyReceipts error:", err);
    return { ok: true, receipts: [] };
  }
}
