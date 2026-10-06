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
