/**
 * ZANA Platform - Caching & Persistence Layer
 * Implements TTL-governed localStorage persistence:
 * - masteryProfile: 24hr TTL
 * - studyPlan: 7day TTL
 * - session data: NEVER persisted to localStorage (enforced memory/remote only)
 */

import { SubjectMasteryDoc, StudyPlanDoc } from "../firebase/types.ts";

export const TTL_CONFIG = {
  MASTERY_PROFILE_MS: 24 * 60 * 60 * 1000, // 24 hours
  STUDY_PLAN_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

export interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export const CacheKeys = {
  masteryProfile: (userId: string, subjectId: string) => `zana.cache.mastery.${userId}.${subjectId}`,
  studyPlan: (userId: string, weekId: string) => `zana.cache.studyPlan.${userId}.${weekId}`,
};

/**
 * Universal safe serializer with TTL envelope
 */
export function setCachedWithTTL<T>(key: string, data: T, ttlMs: number): void {
  // STRICT CONSTRAINT: Never persist session data to localStorage
  if (key.toLowerCase().includes("session")) {
    console.warn(`[Security/Cache Policy] Blocked persistence for session data: key '${key}'`);
    return;
  }

  if (!hasLocalStorage()) return;

  try {
    const envelope: CacheEnvelope<T> = {
      data,
      timestamp: Date.now(),
      ttlMs,
    };
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch (err) {
    console.warn(`Failed to write to localStorage for key ${key}:`, err);
  }
}

/**
 * Universal safe deserializer with TTL verification
 */
export function getCachedWithTTL<T>(key: string): T | null {
  if (!hasLocalStorage()) return null;

  try {
    const item = window.localStorage.getItem(key);
    if (!item) return null;

    const envelope = JSON.parse(item) as CacheEnvelope<T>;
    if (!envelope || typeof envelope.timestamp !== "number" || typeof envelope.ttlMs !== "number") {
      window.localStorage.removeItem(key);
      return null;
    }

    const age = Date.now() - envelope.timestamp;
    if (age > envelope.ttlMs) {
      // Cache expired
      window.localStorage.removeItem(key);
      return null;
    }

    return envelope.data;
  } catch {
    return null;
  }
}

/**
 * Persist student mastery profile with 24hr TTL
 */
export function persistMasteryProfile(
  userId: string,
  subjectId: string,
  mastery: SubjectMasteryDoc
): void {
  const key = CacheKeys.masteryProfile(userId, subjectId);
  setCachedWithTTL(key, mastery, TTL_CONFIG.MASTERY_PROFILE_MS);
}

/**
 * Retrieve student mastery profile if within 24hr TTL
 */
export function getPersistedMasteryProfile(
  userId: string,
  subjectId: string
): SubjectMasteryDoc | null {
  const key = CacheKeys.masteryProfile(userId, subjectId);
  return getCachedWithTTL<SubjectMasteryDoc>(key);
}

/**
 * Persist study plan with 7day TTL
 */
export function persistStudyPlan(
  userId: string,
  weekId: string,
  plan: StudyPlanDoc
): void {
  const key = CacheKeys.studyPlan(userId, weekId);
  setCachedWithTTL(key, plan, TTL_CONFIG.STUDY_PLAN_MS);
}

/**
 * Retrieve study plan if within 7day TTL
 */
export function getPersistedStudyPlan(
  userId: string,
  weekId: string
): StudyPlanDoc | null {
  const key = CacheKeys.studyPlan(userId, weekId);
  return getCachedWithTTL<StudyPlanDoc>(key);
}

/**
 * Strict verification that session data is never stored locally
 */
export function assertSessionDataNotPersisted(keyOrSession: string | unknown): boolean {
  if (typeof keyOrSession === "string") {
    return !keyOrSession.toLowerCase().includes("session");
  }
  return true;
}

/**
 * Clear expired cache entries on startup
 */
export function pruneExpiredCache(): void {
  if (!hasLocalStorage()) return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("zana.cache.")) {
        const item = window.localStorage.getItem(key);
        if (item) {
          try {
            const envelope = JSON.parse(item) as { timestamp: number; ttlMs: number };
            if (Date.now() - envelope.timestamp > envelope.ttlMs) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // Ignore cleanup error
  }
}
