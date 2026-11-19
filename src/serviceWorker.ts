/**
 * ZANA Platform - PWA Service Worker Registration & Offline Management
 * Configures service worker lifecycle, background sync triggers, and cache revalidation.
 */

import { startSync } from "./offline/syncQueue.ts";

export interface ServiceWorkerState {
  isRegistered: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
}

type StateListener = (state: ServiceWorkerState) => void;

class ServiceWorkerManager {
  private state: ServiceWorkerState = {
    isRegistered: false,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    hasUpdate: false,
    registration: null,
  };

  private listeners = new Set<StateListener>();

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.updateOnlineStatus(true));
      window.addEventListener("offline", () => this.updateOnlineStatus(false));

      // Listen for background sync triggers or cache messages from service worker
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "BACKGROUND_SYNC_TRIGGERED" || event.data?.type === "SYNC_QUEUE") {
            void startSync();
          }
        });
      }
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.error("[SW Manager] Listener error:", err);
      }
    });
  }

  private updateOnlineStatus(isOnline: boolean): void {
    this.state = { ...this.state, isOnline };
    this.notify();

    if (isOnline) {
      // Trigger sync queue execution and background sync
      void startSync();
      void this.triggerOfflineSync();
    }
  }

  public async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return null;
    }

    const isDev = Boolean(
      typeof import.meta !== "undefined" &&
        (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV
    );
    const swUrl = isDev ? "/dev-sw.js?dev-sw" : "/sw.js";

    try {
      // Ensure the service worker script exists and is served as JavaScript (not SPA text/html fallback)
      const probe = await fetch(swUrl, { cache: "no-store" });
      const contentType = probe.headers.get("content-type") || "";
      if (!probe.ok || !/(?:javascript|ecmascript)/i.test(contentType)) {
        return null;
      }

      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: "/",
        ...(isDev ? { type: "module" as const } : {}),
      });

      this.state = {
        ...this.state,
        isRegistered: true,
        registration,
      };

      // Detect service worker updates
      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            this.state = { ...this.state, hasUpdate: true };
            this.notify();
          }
        });
      });

      this.notify();
      return registration;
    } catch (err) {
      console.warn("[SW Manager] ServiceWorker registration failed:", err);
      return null;
    }
  }

  /**
   * Triggers background sync for offline queued operations (e.g. mastery updates).
   */
  public async triggerOfflineSync(): Promise<void> {
    if (!this.state.registration || !("sync" in this.state.registration)) {
      return;
    }

    try {
      const syncReg = this.state.registration as ServiceWorkerRegistration & {
        sync: { register: (tag: string) => Promise<void> };
      };
      await Promise.allSettled([
        syncReg.sync.register("sync-mastery-updates"),
        syncReg.sync.register("sync-zana-queue"),
      ]);
    } catch (err) {
      console.warn("[SW Manager] Background sync registration skipped:", err);
    }
  }

  public skipWaiting(): void {
    if (this.state.registration?.waiting) {
      this.state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  }

  public getState(): ServiceWorkerState {
    return this.state;
  }
}

export const swManager = new ServiceWorkerManager();

export function registerServiceWorker(): void {
  if (typeof window !== "undefined") {
    window.addEventListener("load", () => {
      void swManager.register();
    });
  }
}
