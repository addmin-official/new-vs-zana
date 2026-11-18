/**
 * ZANA Platform - Data Usage & Privacy Service
 * Manages local cache calculation, safe cache clearing, and student personalization preferences.
 */

import { curriculumSWRCache } from "../store/curriculumCache.ts";
import { safeClearByPrefix } from "./storage.ts";
import { clearStore } from "../offline/offlineStorage.ts";

export interface CacheMetrics {
  localStorageBytes: number;
  localStorageKb: number;
  indexedDbItems: number;
  totalEstimatedKb: number;
  formattedSize: string;
}

export type TutorStyle = "socratic" | "comprehensive" | "balanced";
export type LearningPace = "standard" | "gradual" | "intensive";
export type DifficultyLevel = "adaptive" | "foundational" | "challenging";

export interface PersonalizationSettings {
  tutorStyle: TutorStyle;
  learningPace: LearningPace;
  difficultyLevel: DifficultyLevel;
  allowAdaptiveRecommendations: boolean;
  allowAiExplanationMemory: boolean;
  updatedAt?: string;
}

export const DEFAULT_PERSONALIZATION_SETTINGS: PersonalizationSettings = {
  tutorStyle: "socratic",
  learningPace: "standard",
  difficultyLevel: "adaptive",
  allowAdaptiveRecommendations: true,
  allowAiExplanationMemory: true,
};

const PERSONALIZATION_KEY_PREFIX = "zana_personalization_v1_";
const WEAK_CONCEPTS_KEY_PREFIX = "zana_weak_concepts_";

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Calculates current local cache size in localStorage and estimated offline storage
 */
export function calculateLocalCacheMetrics(): CacheMetrics {
  if (!hasLocalStorage()) {
    return {
      localStorageBytes: 0,
      localStorageKb: 0,
      indexedDbItems: 0,
      totalEstimatedKb: 0,
      formattedSize: "0 KB",
    };
  }

  let cacheBytes = 0;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (
        key &&
        (key.startsWith("zana.cache.") ||
          key.startsWith("zana:chat-messages:") ||
          key.startsWith("zana_studypath_") ||
          key.startsWith("zana_offline_") ||
          key.startsWith("zana_leitner_") ||
          key.startsWith("zana_metacognitive_") ||
          key.startsWith("zana_weak_concepts_"))
      ) {
        const val = window.localStorage.getItem(key) || "";
        cacheBytes += key.length * 2 + val.length * 2;
      }
    }
  } catch (err) {
    console.warn("Failed to calculate cache metrics:", err);
  }

  const localStorageKb = Math.round(cacheBytes / 1024);
  const totalEstimatedKb = Math.max(12, localStorageKb); // baseline estimate with memory cache

  let formatted = `${totalEstimatedKb} KB`;
  if (totalEstimatedKb >= 1024) {
    formatted = `${(totalEstimatedKb / 1024).toFixed(1)} MB`;
  }

  return {
    localStorageBytes: cacheBytes,
    localStorageKb,
    indexedDbItems: 0,
    totalEstimatedKb,
    formattedSize: formatted,
  };
}

/**
 * Safely clears local cache without touching user login or permanent profile
 */
export async function clearLocalCache(options?: {
  clearAiResponses?: boolean;
  clearCurriculumCache?: boolean;
  clearChatHistory?: boolean;
}): Promise<{ success: boolean; clearedKb: number }> {
  const beforeMetrics = calculateLocalCacheMetrics();

  // 1. Invalidate SWR memory cache
  try {
    curriculumSWRCache.clear();
  } catch {
    // SWR memory cache fallback
  }

  if (hasLocalStorage()) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key) continue;

        // Targeted cache eviction:
        if (key.startsWith("zana.cache.")) {
          keysToRemove.push(key);
        } else if (key.startsWith("zana_studypath_")) {
          keysToRemove.push(key);
        } else if (key.startsWith("zana_leitner_")) {
          keysToRemove.push(key);
        } else if (key.startsWith("zana_metacognitive_")) {
          keysToRemove.push(key);
        } else if (options?.clearChatHistory && key.startsWith("zana:chat-messages:")) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch (err) {
      console.warn("Failed to clear local storage cache keys:", err);
    }
  }

  // 2. Clear IndexedDB temporary AI responses if requested or by default
  if (options?.clearAiResponses !== false) {
    try {
      await clearStore("aiResponses");
    } catch {
      // IndexedDB might not be initialized or available
    }
  }

  // 3. Clear browser CacheStorage for API/temporary caches if supported
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cacheNames = await window.caches.keys();
      for (const name of cacheNames) {
        if (name.includes("api") || name.includes("runtime") || name.includes("curriculum")) {
          await window.caches.delete(name);
        }
      }
    } catch {
      // Ignore cache storage error
    }
  }

  return {
    success: true,
    clearedKb: beforeMetrics.totalEstimatedKb,
  };
}

/**
 * Gets student's personalization preferences
 */
export function getPersonalizationSettings(userId?: string): PersonalizationSettings {
  if (!hasLocalStorage()) {
    return { ...DEFAULT_PERSONALIZATION_SETTINGS };
  }

  const key = `${PERSONALIZATION_KEY_PREFIX}${userId || "guest"}`;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { ...DEFAULT_PERSONALIZATION_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<PersonalizationSettings>;
    return {
      tutorStyle: parsed.tutorStyle || DEFAULT_PERSONALIZATION_SETTINGS.tutorStyle,
      learningPace: parsed.learningPace || DEFAULT_PERSONALIZATION_SETTINGS.learningPace,
      difficultyLevel: parsed.difficultyLevel || DEFAULT_PERSONALIZATION_SETTINGS.difficultyLevel,
      allowAdaptiveRecommendations: parsed.allowAdaptiveRecommendations ?? DEFAULT_PERSONALIZATION_SETTINGS.allowAdaptiveRecommendations,
      allowAiExplanationMemory: parsed.allowAiExplanationMemory ?? DEFAULT_PERSONALIZATION_SETTINGS.allowAiExplanationMemory,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return { ...DEFAULT_PERSONALIZATION_SETTINGS };
  }
}

/**
 * Saves student's personalization preferences
 */
export function savePersonalizationSettings(
  settings: PersonalizationSettings,
  userId?: string
): void {
  if (!hasLocalStorage()) return;

  const key = `${PERSONALIZATION_KEY_PREFIX}${userId || "guest"}`;
  try {
    const toSave: PersonalizationSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(key, JSON.stringify(toSave));
  } catch (err) {
    console.error("Failed to save personalization settings:", err);
  }
}

/**
 * Resets student's personalization settings and weak concept flags to default
 */
export function resetPersonalizationSettings(userId?: string): PersonalizationSettings {
  if (hasLocalStorage()) {
    const id = userId || "guest";
    try {
      window.localStorage.removeItem(`${PERSONALIZATION_KEY_PREFIX}${id}`);
      safeClearByPrefix(`${WEAK_CONCEPTS_KEY_PREFIX}${id}`);
    } catch (err) {
      console.warn("Failed to reset personalization storage:", err);
    }
  }
  return { ...DEFAULT_PERSONALIZATION_SETTINGS, updatedAt: new Date().toISOString() };
}

/**
 * Exports all student learning data as a formatted downloadable JSON file
 */
export function exportStudentData(userId: string, profile: unknown): void {
  if (typeof window === "undefined") return;

  const exportPayload = {
    exportDate: new Date().toISOString(),
    studentId: userId,
    profile,
    personalization: getPersonalizationSettings(userId),
    cacheSummary: calculateLocalCacheMetrics(),
    platform: "ZANA Educational Platform - Kurdistan",
    version: "2.0.0",
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `zana-learning-data-${userId || "student"}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
