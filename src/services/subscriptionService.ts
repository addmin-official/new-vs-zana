/**
 * ZANA Platform - Client Subscription & FastPay Receipt Service
 * خزمەتگوزاری بەشداریکردن، وەرگرتنی دۆخی هەژمار و تۆمارکردنی پسوولەی فاستپەی
 */

import { getFirebaseAuth } from "./firebase.ts";

export type SubscriptionUiState =
  | "trial_active"
  | "trial_expired"
  | "subscription_active"
  | "subscription_cancelled"
  | "expired"
  | "database_unavailable"
  | "auth_expired"
  | "network_error";

export interface StudentSubscriptionStatus {
  ok: boolean;
  status: "trial" | "active" | "expired" | "trial_active" | "trial_expired" | "subscription_active" | "unavailable";
  trial_started_at: number;
  trial_ends_at: number;
  plan_id: string | null;
  days_remaining: number;
  time_remaining_ms?: number;
  server_time?: number;
  trial_active?: boolean;
  subscription_active?: boolean;
  is_expired?: boolean;
  error?: string;
  code?: string;
  detail?: string;
  locked_features?: string[];
  errorCategory?: "trial_expired" | "subscription_inactive" | "database_unavailable" | "auth_expired" | "network_error";
}

export type SubscriptionStatusResponse = StudentSubscriptionStatus;

export interface OnboardStudentPayload {
  fullName?: string;
  name?: string;
  email?: string;
  schoolName: string;
  grade?: string;
  stream?: string;
}

export interface ServerStudentProfileResponse {
  ok: boolean;
  exists: boolean;
  onboardingCompleted: boolean;
  student?: {
    id: string;
    name: string;
    email: string;
    schoolName: string;
    grade: string;
    stream: string;
  } | null;
  subscription?: StudentSubscriptionStatus | null;
  error?: string;
  detail?: string;
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
 * Fetch live subscription status for a given student User ID from D1.
 * Strict: Fails closed on error and NEVER fabricates a fake trial!
 */
export async function getSubscriptionStatus(userId?: string): Promise<StudentSubscriptionStatus> {
  try {
    const headers = await getAuthHeaders();
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    const res = await fetch(`/api/subscription/status${query}`, { headers });

    if (res.status === 401) {
      return {
        ok: false,
        status: "unavailable",
        trial_started_at: 0,
        trial_ends_at: 0,
        plan_id: null,
        days_remaining: 0,
        is_expired: false,
        trial_active: false,
        subscription_active: false,
        code: "AUTH_EXPIRED",
        errorCategory: "auth_expired",
        error: "کاتی چوونەژوورەوەت بەسەرچووە. تکایە سەرلەنوێ بچۆ ژوورەوە.",
      };
    }

    if (res.status === 503) {
      const data = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
      return {
        ok: false,
        status: "unavailable",
        trial_started_at: 0,
        trial_ends_at: 0,
        plan_id: null,
        days_remaining: 0,
        is_expired: false,
        trial_active: false,
        subscription_active: false,
        code: "DATABASE_UNAVAILABLE",
        errorCategory: "database_unavailable",
        error: data.detail || data.error || "سێرڤەری داتابەیس لەم کاتەدا بەردەست نییە. تکایە کەمێکی تر هەوڵ بدەرەوە.",
      };
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      ok: true,
      ...data,
    };
  } catch (err: unknown) {
    console.warn("[subscriptionService] getSubscriptionStatus network/server error:", err);
    // Explicit error state — NEVER fabricate a fake trial!
    return {
      ok: false,
      status: "unavailable",
      trial_started_at: 0,
      trial_ends_at: 0,
      plan_id: null,
      days_remaining: 0,
      is_expired: false,
      trial_active: false,
      subscription_active: false,
      code: "NETWORK_ERROR",
      errorCategory: "network_error",
      error: "پەیوەندی لەگەڵ سێرڤەر نییە. تکایە هێڵی ئینتەرنێتەکەت بپشکنە.",
    };
  }
}

/**
 * Onboard student with Full Name, Email, and School Name.
 */
export async function onboardStudent(
  payload: OnboardStudentPayload
): Promise<{ ok: boolean; message?: string; error?: string; detail?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/student/onboard", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    message?: string;
    error?: string;
    detail?: string;
  };
  if (!res.ok) {
    return {
      ok: false,
      error: data.error || "ONBOARD_FAILED",
      detail: data.detail || "تۆمارکردنی زانیارییەکان سەرکەوتوو نەبوو.",
    };
  }
  return { ok: true, message: data.message };
}

/**
 * Fetch authoritative student profile from server D1 database.
 * Used on login and session startup to identify returning users and bypass onboarding.
 */
export async function fetchServerStudentProfile(): Promise<ServerStudentProfileResponse> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/student/profile", {
      method: "GET",
      headers,
    });
    if (!res.ok) {
      const errorData = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
      return {
        ok: false,
        exists: false,
        onboardingCompleted: false,
        error: errorData.error || "FETCH_PROFILE_FAILED",
        detail: errorData.detail,
      };
    }
    const data = (await res.json()) as ServerStudentProfileResponse;
    return data;
  } catch (err: unknown) {
    return {
      ok: false,
      exists: false,
      onboardingCompleted: false,
      error: "NETWORK_ERROR",
      detail: (err as Error)?.message || "Failed to fetch student profile from server",
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
