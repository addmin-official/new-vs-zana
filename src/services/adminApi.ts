import { getFirebaseAuth } from "./firebase.ts";

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const auth = getFirebaseAuth();
  if (auth && typeof auth.authStateReady === "function" && !auth.currentUser) {
    try {
      await auth.authStateReady();
    } catch {
      // ignore
    }
  }
  const user = auth?.currentUser;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (user) {
    try {
      const token = await user.getIdToken();
      headers.set("Authorization", `Bearer ${token}`);
    } catch (err) {
      console.warn("[adminApi] Failed to retrieve Firebase ID token:", err);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 403) {
    let detail = "دەستگەیشتن ڕەتکرایەوە. تەنها ئادمین دەتوانێت دەستی پێی بگات.";
    try {
      const clone = res.clone();
      const data = (await clone.json()) as { detail?: string; error?: string };
      if (data && (data.detail || data.error)) {
        detail = data.detail || data.error || detail;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(detail);
  }

  return res;
}

export async function getBrainStatus() {
  const res = await adminFetch("/api/admin/brain/status");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getBrainMetrics() {
  const res = await adminFetch("/api/admin/brain/metrics");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getInternalTelemetry() {
  const res = await adminFetch("/api/internal/telemetry");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function planAdminCommand(command: string) {
  const res = await adminFetch("/api/admin/brain/command/plan", {
    method: "POST",
    body: JSON.stringify({ command }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function approveAdminCommand(plan: unknown, isSecondarySignOff = false) {
  const res = await adminFetch("/api/admin/brain/command/approve", {
    method: "POST",
    body: JSON.stringify({ plan, isSecondarySignOff }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error((errorData as { error?: string })?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function executeAdminCommand(plan: unknown) {
  const res = await adminFetch("/api/admin/brain/command/execute", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function rollbackAdminCommand(commandId: string) {
  const res = await adminFetch("/api/admin/brain/command/rollback", {
    method: "POST",
    body: JSON.stringify({ commandId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function runAdminGoldenTest(testId?: string) {
  const res = await adminFetch("/api/admin/brain/golden-tests/run", {
    method: "POST",
    body: JSON.stringify({ testId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getAdminAuditLog() {
  const res = await adminFetch("/api/admin/brain/audit");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface SubscriptionRecord {
  user_id: string;
  status: "trial" | "active" | "expired";
  trial_started_at: number;
  trial_ends_at: number;
  plan_id: string | null;
  updated_at: number;
  user_name?: string | null;
  user_email?: string | null;
}

export async function getAdminSubscriptions(): Promise<{ ok: boolean; subscriptions: SubscriptionRecord[] }> {
  const res = await adminFetch("/api/admin/subscriptions");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function activateUserSubscription(
  userId: string,
  planId: "monthly" | "yearly" = "monthly"
): Promise<{ ok: boolean; message: string }> {
  const res = await adminFetch("/api/admin/subscriptions/activate", {
    method: "POST",
    body: JSON.stringify({ userId, planId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function resetUserTrial(
  userId: string
): Promise<{ ok: boolean; message: string }> {
  const res = await adminFetch("/api/admin/subscriptions/reset-trial", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface PaymentReceiptRecord {
  id: string;
  user_id: string;
  student_name?: string | null;
  student_email?: string | null;
  student_phone?: string | null;
  plan_id: "monthly" | "yearly";
  amount: string;
  receipt_code: string;
  status: "pending" | "approved" | "rejected";
  notes?: string | null;
  submitted_at: number;
  reviewed_at?: number | null;
  reviewed_by?: string | null;
  resolved_name?: string | null;
  resolved_email?: string | null;
}

export async function getAdminPaymentReceipts(
  status?: "pending" | "approved" | "rejected" | "all"
): Promise<{ ok: boolean; receipts: PaymentReceiptRecord[] }> {
  const query = status && status !== "all" ? `?status=${status}` : "";
  const res = await adminFetch(`/api/admin/payment-receipts${query}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function reviewPaymentReceipt(
  receiptId: string,
  action: "approve" | "reject",
  rejectionReason?: string
): Promise<{ ok: boolean; message: string }> {
  const res = await adminFetch("/api/admin/payment-receipts/action", {
    method: "POST",
    body: JSON.stringify({ receiptId, action, rejectionReason }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
    throw new Error(data.detail || data.error || `HTTP ${res.status}`);
  }
  return res.json();
}


