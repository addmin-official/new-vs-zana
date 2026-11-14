import { useState, useEffect } from "react";
import { getApiUrl } from "../lib/apiClient.ts";

export interface ServerHealthStatus {
  isOnline: boolean;
  status: "online" | "offline" | "checking";
  latencyMs: number | null;
  lastChecked: Date | null;
}

const FALLBACK_HEALTH_URL = "https://new-vs-zana.zana-platform.workers.dev/api/health";

export function useServerHealth(pollIntervalMs = 30000): ServerHealthStatus {
  const [health, setHealth] = useState<ServerHealthStatus>({
    isOnline: true,
    status: "online",
    latencyMs: 35,
    lastChecked: null,
  });

  useEffect(() => {
    let isMounted = true;

    const checkEndpoint = async (url: string, timeoutMs: number): Promise<{ ok: boolean; latency: number }> => {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Accept": "application/json",
          },
        });
        clearTimeout(timeoutId);
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
          if (data && (data.ok === true || data.status === "ok" || data.service)) {
            return { ok: true, latency: Date.now() - startTime };
          }
        }
        return { ok: false, latency: Date.now() - startTime };
      } catch {
        clearTimeout(timeoutId);
        return { ok: false, latency: Date.now() - startTime };
      }
    };

    const checkHealth = async () => {
      // 1. If browser is offline, set offline immediately
      if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.onLine === false) {
        if (isMounted) {
          setHealth({
            isOnline: false,
            status: "offline",
            latencyMs: null,
            lastChecked: new Date(),
          });
        }
        return;
      }

      // 2. Try primary relative / configured API endpoint
      const primaryUrl = getApiUrl("/api/health");
      let result = await checkEndpoint(primaryUrl, 5000);

      // 3. If primary failed or returned HTML, try fallback worker
      if (!result.ok && primaryUrl !== FALLBACK_HEALTH_URL) {
        result = await checkEndpoint(FALLBACK_HEALTH_URL, 6000);
      }

      if (isMounted) {
        setHealth({
          isOnline: result.ok,
          status: result.ok ? "online" : "offline",
          latencyMs: result.ok ? result.latency : null,
          lastChecked: new Date(),
        });
      }
    };

    // Immediate initial check
    void checkHealth();

    // Listen to online / offline events
    const handleOnline = () => void checkHealth();
    const handleOffline = () => {
      if (isMounted) {
        setHealth((prev) => ({ ...prev, isOnline: false, status: "offline" }));
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic check
    const interval = setInterval(checkHealth, pollIntervalMs);

    return () => {
      isMounted = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [pollIntervalMs]);

  return health;
}
