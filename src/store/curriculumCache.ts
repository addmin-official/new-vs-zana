/**
 * ZANA Platform - Curriculum Stale-While-Revalidate (SWR) Cache
 * Implements SWR caching strategy for curriculum concept data:
 * 1. Returns stale cached data immediately if available.
 * 2. Asynchronously revalidates and refreshes data in the background.
 * 3. Notifies subscribers when fresh data becomes available.
 */

import { CurriculumConceptDoc } from "../firebase/types.ts";

export interface SWRResponse<T> {
  data: T | null;
  isStale: boolean;
  revalidating: boolean;
}

type Subscriber<T> = (data: T) => void;

class CurriculumSWRCache {
  private memoryCache = new Map<string, { data: unknown; timestamp: number }>();
  private inFlight = new Map<string, Promise<unknown>>();
  private subscribers = new Map<string, Set<Subscriber<unknown>>>();
  private defaultMaxAgeMs = 30 * 60 * 1000; // 30 minutes before considering stale

  private getCacheKey(grade: string, subject: string, conceptId: string): string {
    return `curriculum:${grade}:${subject}:${conceptId}`.toLowerCase();
  }

  /**
   * Subscribe to updates for a specific curriculum concept
   */
  public subscribe<T = CurriculumConceptDoc>(
    grade: string,
    subject: string,
    conceptId: string,
    callback: Subscriber<T>
  ): () => void {
    const key = this.getCacheKey(grade, subject, conceptId);
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    const set = this.subscribers.get(key)!;
    set.add(callback as Subscriber<unknown>);

    return () => {
      set.delete(callback as Subscriber<unknown>);
      if (set.size === 0) {
        this.subscribers.delete(key);
      }
    };
  }

  /**
   * Fetch curriculum concept using Stale-While-Revalidate pattern
   */
  public async getWithSWR<T = CurriculumConceptDoc>(
    grade: string,
    subject: string,
    conceptId: string,
    fetcher: () => Promise<T>
  ): Promise<SWRResponse<T>> {
    const key = this.getCacheKey(grade, subject, conceptId);
    const cached = this.memoryCache.get(key);
    const now = Date.now();

    // Check if we have valid or stale cached data
    if (cached) {
      const isStale = now - cached.timestamp > this.defaultMaxAgeMs;

      if (isStale) {
        // Trigger background revalidation if not already in flight
        this.revalidateInBackground(key, fetcher);
      }

      return {
        data: cached.data as T,
        isStale,
        revalidating: this.inFlight.has(key),
      };
    }

    // No cache: fetch directly
    const promise = this.executeFetch(key, fetcher);
    const freshData = await promise;

    return {
      data: freshData,
      isStale: false,
      revalidating: false,
    };
  }

  private revalidateInBackground<T>(key: string, fetcher: () => Promise<T>): void {
    if (this.inFlight.has(key)) return;

    this.executeFetch(key, fetcher).catch((err) => {
      console.warn(`[Curriculum SWR] Background revalidation failed for ${key}:`, err);
    });
  }

  private async executeFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const fetchPromise = (async () => {
      try {
        const fresh = await fetcher();
        this.memoryCache.set(key, { data: fresh, timestamp: Date.now() });

        // Notify active subscribers of fresh data
        const subs = this.subscribers.get(key);
        if (subs) {
          subs.forEach((cb) => {
            try {
              cb(fresh);
            } catch (e) {
              console.error("[Curriculum SWR] Error in subscriber callback:", e);
            }
          });
        }
        return fresh;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, fetchPromise as Promise<unknown>);
    return fetchPromise;
  }

  /**
   * Manually invalidate or seed cache
   */
  public setCached<T = CurriculumConceptDoc>(
    grade: string,
    subject: string,
    conceptId: string,
    data: T
  ): void {
    const key = this.getCacheKey(grade, subject, conceptId);
    this.memoryCache.set(key, { data, timestamp: Date.now() });
  }

  public clear(): void {
    this.memoryCache.clear();
    this.inFlight.clear();
    this.subscribers.clear();
  }
}

export const curriculumSWRCache = new CurriculumSWRCache();
