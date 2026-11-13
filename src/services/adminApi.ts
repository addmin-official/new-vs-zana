import { getFirebaseAuth } from "./firebase.ts";

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const auth = getFirebaseAuth();
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
    throw new Error("دەستگەیشتن ڕەتکرایەوە. تەنها ئادمین دەتوانێت دەستی پێی بگات.");
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

