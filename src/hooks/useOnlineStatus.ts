/**
 * ZANA Platform - Online Status Hook
 * Provides dual-layer network detection: browser events + active heartbeat ping verification.
 * Also subscribes to syncQueue pending item count.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { subscribeSyncEvents, getPendingCount, startSync } from "../offline/syncQueue.ts";

export interface OnlineStatus {
  isOnline: boolean;
  lastOnlineAt: number | null;
  pendingSync: number;
  isChecking: boolean;
  verifyConnection: () => Promise<boolean>;
}

const LAST_ONLINE_KEY = "zana_last_online_timestamp";

function getInitialLastOnline(): number | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(LAST_ONLINE_KEY);
    return raw ? Number(raw) : Date.now();
  } catch {
    return null;
  }
}

function setStoredLastOnline(ts: number): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(LAST_ONLINE_KEY, String(ts));
    } catch {
      // ignore
    }
  }
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });

  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(getInitialLastOnline);
  const [pendingSync, setPendingSync] = useState<number>(0);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const isMountedRef = useRef(true);

  // Active heartbeat verification: navigator.onLine can lie (captive portal / disconnected router)
  const verifyConnection = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return true;

    // If browser already reports false, don't bother pinging
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      if (isMountedRef.current) setIsOnline(false);
      return false;
    }

    setIsChecking(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      // Ping local root or favicon with cache-busting timestamp
      const response = await fetch(`/favicon.ico?_ping=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const online = response.ok || response.status < 500;

      if (isMountedRef.current) {
        setIsOnline(online);
        if (online) {
          const now = Date.now();
          setLastOnlineAt(now);
          setStoredLastOnline(now);
        }
      }
      return online;
    } catch {
      clearTimeout(timeoutId);
      // In offline / network failure, mark false
      if (isMountedRef.current) {
        setIsOnline(false);
      }
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  }, []);

  // Sync queue subscription & count initialization
  useEffect(() => {
    isMountedRef.current = true;

    // Read initial pending count
    void getPendingCount().then((count) => {
      if (isMountedRef.current) setPendingSync(count);
    });

    // Subscribe to sync queue events
    const unsubSync = subscribeSyncEvents(() => {
      void getPendingCount().then((count) => {
        if (isMountedRef.current) setPendingSync(count);
      });
    });

    return () => {
      isMountedRef.current = false;
      unsubSync();
    };
  }, []);

  // Listen to browser online/offline events & periodic 30s heartbeat
  useEffect(() => {
    const handleBrowserOnline = () => {
      void verifyConnection().then((online) => {
        if (online) {
          // Connection restored -> trigger queue sync
          void startSync();
        }
      });
    };

    const handleBrowserOffline = () => {
      setIsOnline(false);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleBrowserOnline);
      window.addEventListener("offline", handleBrowserOffline);
    }

    // 30s periodic heartbeat when reported online
    const intervalId = setInterval(() => {
      if (isOnline) {
        void verifyConnection();
      }
    }, 30000);

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleBrowserOnline);
        window.removeEventListener("offline", handleBrowserOffline);
      }
      clearInterval(intervalId);
    };
  }, [isOnline, verifyConnection]);

  return {
    isOnline,
    lastOnlineAt,
    pendingSync,
    isChecking,
    verifyConnection,
  };
}

export default useOnlineStatus;
