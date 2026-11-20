import React, { lazy, ComponentType } from "react";

/**
 * Enhanced lazy import with automatic retry and graceful page reload
 * when a new application deployment causes stale chunk 404s.
 * 
 * Prevents "Failed to fetch dynamically imported module" errors when users
 * navigate routes after a new version of ZANA has been deployed.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const key = "zana_chunk_retry_timestamp";
    try {
      return await factory();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || String(err);
      const isChunkLoadError =
        /Failed to fetch dynamically imported module/i.test(msg) ||
        /error loading dynamically imported module/i.test(msg) ||
        /Importing a module script failed/i.test(msg) ||
        (err as Error)?.name === "ChunkLoadError";

      if (isChunkLoadError && typeof window !== "undefined") {
        const lastRetry = parseInt(sessionStorage.getItem(key) || "0", 10);
        // Only auto-reload if at least 10 seconds elapsed since the last reload
        if (Date.now() - lastRetry > 10000) {
          sessionStorage.setItem(key, String(Date.now()));
          console.warn(
            "[ZANA] Stale chunk detected after deployment. Auto-reloading to fetch newest version...",
            msg
          );
          window.location.reload();
          // Return an unresolved promise to prevent React from throwing before reload takes effect
          return new Promise<{ default: T }>(() => {});
        }
      }

      throw err;
    }
  });
}
