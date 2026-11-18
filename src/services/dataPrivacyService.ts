import { StudentProfile } from "./storage.ts";
import { StudentMasteryProfile } from "../learning/domain/MasteryTypes.ts";

export type DataCategoryId = "profile_prefs" | "study_progress" | "pedagogy_chat" | "local_cache";

export interface StoredKeyEntry {
  key: string;
  bytes: number;
  category: DataCategoryId;
  isCache: boolean;
}

export interface DataCategorySummary {
  id: DataCategoryId;
  titleKu: string;
  subtitleEn: string;
  descriptionKu: string;
  retentionLabelKu: string;
  isClearableAsCache: boolean;
  itemCount: number;
  totalBytes: number;
  keys: StoredKeyEntry[];
}

export interface DataInventorySnapshot {
  totalKeys: number;
  totalBytes: number;
  cacheKeysCount: number;
  cacheBytes: number;
  categories: DataCategorySummary[];
}

const SENSITIVE_KEY_PATTERN = /(token|secret|password|credential|jwt|apikey|api_key|firebase:authuser)/i;

const CACHE_KEY_PREFIXES = [
  "zana_role_cache",
  "zana_notifications_cache",
  "zana_offline_",
  "zana_cache_",
  "zana:cache:",
  "zana_last_online",
  "zana_ask_suggestions",
  "zana_session_recovery",
];

const STUDY_PROGRESS_PREFIXES = [
  "zana:progress-state",
  "zana:assessment-state",
  "zana_practice_progress",
  "zana_mastery_profile",
  "zana_studypath_",
  "zana_weekly_goal",
  "zana_xp_",
  "zana_streak_",
  "zana_achievements_",
  "zana_leitner_",
  "zana_assessment_",
  "zana_learning_",
];

const PEDAGOGY_CHAT_PREFIXES = [
  "zana:chat-messages:",
  "zana_feynman_",
  "zana_metacognitive_",
  "zana_debate_",
  "zana_soma_",
  "zana_ask_history",
  "zana_domain_events",
  "zana_session_",
];

function classifyStorageKey(key: string): { category: DataCategoryId; isCache: boolean } {
  const lower = key.toLowerCase();

  if (CACHE_KEY_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return { category: "local_cache", isCache: true };
  }
  if (STUDY_PROGRESS_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return { category: "study_progress", isCache: false };
  }
  if (PEDAGOGY_CHAT_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return { category: "pedagogy_chat", isCache: false };
  }
  if (
    lower === "zana.profile.v1" ||
    lower.startsWith("zana_theme") ||
    lower.startsWith("zana_sound") ||
    lower.startsWith("zana_locale") ||
    lower.startsWith("zana_use_eastern") ||
    lower.startsWith("zana_user_role") ||
    lower.startsWith("zana_notif_prefs") ||
    lower.startsWith("zana_") ||
    lower.startsWith("zana:") ||
    lower.startsWith("zana.")
  ) {
    // Distinguish general preference vs unknown temporary cache key
    if (lower.includes("cache") || lower.includes("temp")) {
      return { category: "local_cache", isCache: true };
    }
    return { category: "profile_prefs", isCache: false };
  }

  return { category: "local_cache", isCache: true };
}

function isZanaRelatedKey(key: string): boolean {
  const lower = key.toLowerCase();
  return lower.startsWith("zana") || lower.includes("studypath") || lower.includes("mastery");
}

function getStringByteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  return value.length * 2;
}

export function formatBytesKu(bytes: number): string {
  if (bytes <= 0) return "٠ بایت";
  if (bytes < 1024) return `${bytes} بایت`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function inspectUserDataInventory(storage?: Storage | null): DataInventorySnapshot {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== "undefined" && typeof window.localStorage !== "undefined"
      ? window.localStorage
      : null;

  const categoryMap: Record<DataCategoryId, DataCategorySummary> = {
    profile_prefs: {
      id: "profile_prefs",
      titleKu: "ناسنامە و هەڵبژاردە کەسییەکان",
      subtitleEn: "Profile & Personalization",
      descriptionKu: "ناوی قوتابی، پۆل، لق، بابەت، ڕووکاری شەو/ڕۆژ و ڕێکخستنی دەنگ.",
      retentionLabelKu: "پارێزراو لە کاتی پاککردنەوەی کاش",
      isClearableAsCache: false,
      itemCount: 0,
      totalBytes: 0,
      keys: [],
    },
    study_progress: {
      id: "study_progress",
      titleKu: "پێشکەوتنی خوێندن و لێهاتوویی",
      subtitleEn: "Study Progress & Mastery",
      descriptionKu: "نمرەی هەڵسەنگاندنەکان، خاڵە لاوازەکان، پلانی خوێندن، و مەدالیاکان.",
      retentionLabelKu: "پارێزراو (پێشکەوتنی فێربوون)",
      isClearableAsCache: false,
      itemCount: 0,
      totalBytes: 0,
      keys: [],
    },
    pedagogy_chat: {
      id: "pedagogy_chat",
      titleKu: "مێژووی گفتوگۆ و مۆدیوولە پەروەردەییەکان",
      subtitleEn: "Tutor Chats & Pedagogy History",
      descriptionKu: "گفتوگۆکانی مامۆستا زانا، ڕاهێنانی فاینمان، مێتاکۆگنیشن و دیبەیت.",
      retentionLabelKu: "پارێزراو (تۆماری فێربوون)",
      isClearableAsCache: false,
      itemCount: 0,
      totalBytes: 0,
      keys: [],
    },
    local_cache: {
      id: "local_cache",
      titleKu: "کاشی ناوخۆیی و داتای کاتی",
      subtitleEn: "Local Cache & Temporary Data",
      descriptionKu: "پاشەکەوتی کاتی ڕۆڵ، ئاگادارکردنەوەکان، زانیاری پێشنیارکراو و کاشی وێبگەڕ.",
      retentionLabelKu: "کاتی (دەتوانرێت پاکبکرێتەوە)",
      isClearableAsCache: true,
      itemCount: 0,
      totalBytes: 0,
      keys: [],
    },
  };

  let totalKeys = 0;
  let totalBytes = 0;
  let cacheKeysCount = 0;
  let cacheBytes = 0;

  if (targetStorage) {
    for (let i = 0; i < targetStorage.length; i++) {
      const key = targetStorage.key(i);
      if (!key || !isZanaRelatedKey(key)) continue;
      if (SENSITIVE_KEY_PATTERN.test(key)) continue;

      const value = targetStorage.getItem(key) || "";
      const bytes = getStringByteLength(key) + getStringByteLength(value);
      const { category, isCache } = classifyStorageKey(key);

      const entry: StoredKeyEntry = { key, bytes, category, isCache };
      const bucket = categoryMap[category];
      bucket.keys.push(entry);
      bucket.itemCount += 1;
      bucket.totalBytes += bytes;

      totalKeys += 1;
      totalBytes += bytes;
      if (isCache) {
        cacheKeysCount += 1;
        cacheBytes += bytes;
      }
    }
  }

  return {
    totalKeys,
    totalBytes,
    cacheKeysCount,
    cacheBytes,
    categories: [
      categoryMap.profile_prefs,
      categoryMap.study_progress,
      categoryMap.pedagogy_chat,
      categoryMap.local_cache,
    ],
  };
}

export async function clearLocalCacheData(
  storage?: Storage | null
): Promise<{ clearedKeys: number; freedBytes: number; browserCachesCleared: number }> {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== "undefined" && typeof window.localStorage !== "undefined"
      ? window.localStorage
      : null;

  let clearedKeys = 0;
  let freedBytes = 0;
  let browserCachesCleared = 0;

  if (targetStorage) {
    const keysToDelete: { key: string; bytes: number }[] = [];
    for (let i = 0; i < targetStorage.length; i++) {
      const key = targetStorage.key(i);
      if (!key || !isZanaRelatedKey(key)) continue;
      if (SENSITIVE_KEY_PATTERN.test(key)) continue;

      const { isCache } = classifyStorageKey(key);
      if (isCache) {
        const value = targetStorage.getItem(key) || "";
        keysToDelete.push({
          key,
          bytes: getStringByteLength(key) + getStringByteLength(value),
        });
      }
    }

    for (const item of keysToDelete) {
      try {
        targetStorage.removeItem(item.key);
        clearedKeys += 1;
        freedBytes += item.bytes;
      } catch {
        // Ignore storage error for individual key
      }
    }
  }

  if (typeof window !== "undefined" && "caches" in window && window.caches) {
    try {
      const cacheNames = await window.caches.keys();
      for (const cacheName of cacheNames) {
        const deleted = await window.caches.delete(cacheName);
        if (deleted) browserCachesCleared += 1;
      }
    } catch {
      // CacheStorage may not be available in all contexts
    }
  }

  return { clearedKeys, freedBytes, browserCachesCleared };
}

export interface ExportedUserDataPayload {
  exportedAt: string;
  platform: string;
  transparencyNotice: string;
  studentProfile: Omit<StudentProfile, "authoritative" | "source"> & {
    authoritative?: boolean;
    source?: string;
  };
  masteryProfile: StudentMasteryProfile | null;
  inventorySummary: {
    totalKeys: number;
    totalBytes: number;
    categories: {
      id: DataCategoryId;
      titleKu: string;
      itemCount: number;
      totalBytes: number;
    }[];
  };
  localRecords: Record<string, unknown>;
}

export function buildUserExportPayload(
  profile: StudentProfile,
  masteryProfile: StudentMasteryProfile | null,
  storage?: Storage | null
): ExportedUserDataPayload {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== "undefined" && typeof window.localStorage !== "undefined"
      ? window.localStorage
      : null;

  const inventory = inspectUserDataInventory(targetStorage);
  const localRecords: Record<string, unknown> = {};

  if (targetStorage) {
    for (let i = 0; i < targetStorage.length; i++) {
      const key = targetStorage.key(i);
      if (!key || !isZanaRelatedKey(key)) continue;
      if (SENSITIVE_KEY_PATTERN.test(key)) continue;

      const raw = targetStorage.getItem(key);
      if (raw !== null) {
        try {
          localRecords[key] = JSON.parse(raw);
        } catch {
          localRecords[key] = raw;
        }
      }
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    platform: "ZaNa Academy (ZANA)",
    transparencyNotice:
      "This export includes your local student profile, preferences, study progress, and learning records stored in your browser. Sensitive authentication tokens are excluded.",
    studentProfile: { ...profile },
    masteryProfile: masteryProfile || null,
    inventorySummary: {
      totalKeys: inventory.totalKeys,
      totalBytes: inventory.totalBytes,
      categories: inventory.categories.map((c) => ({
        id: c.id,
        titleKu: c.titleKu,
        itemCount: c.itemCount,
        totalBytes: c.totalBytes,
      })),
    },
    localRecords,
  };
}

export function downloadUserDataAsJson(
  profile: StudentProfile,
  masteryProfile: StudentMasteryProfile | null
): { fileName: string; sizeBytes: number } {
  const payload = buildUserExportPayload(profile, masteryProfile);
  const jsonString = JSON.stringify(payload, null, 2);
  const sizeBytes = getStringByteLength(jsonString);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileName = `zana-my-data-${dateStamp}.json`;

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { fileName, sizeBytes };
}
