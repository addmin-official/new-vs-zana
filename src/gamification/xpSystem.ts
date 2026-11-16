/**
 * ZANA Platform - Gamification: Student XP & Level System
 *
 * Designed specifically for Kurdistan Grade 9–12 students.
 * Strictly non-manipulative:
 * - XP is cosmetic only — NEVER influences pedagogical or learning algorithms.
 * - Zero leaderboards / zero social comparison to avoid unhealthy stress.
 * - Motivation is tied purely to personal learning progress.
 */

import { getFirestoreDb } from "../services/firebase.ts";
import { doc, getDoc, setDoc } from "firebase/firestore";

export type XpSource =
  | "PRACTICE_SESSION" // Complete practice session: +10 XP
  | "CONCEPT_DEVELOPING" // Concept reaches DEVELOPING: +25 XP
  | "CONCEPT_PROFICIENT" // Concept reaches PROFICIENT: +50 XP
  | "CONCEPT_MASTERED" // Concept reaches MASTERED: +100 XP
  | "PERFECT_ASSESSMENT" // Perfect assessment: +75 XP
  | "DAILY_STUDY" // Daily study: +15 XP
  | "STREAK_7_DAYS" // 7-day streak bonus: +100 XP
  | "CUSTOM"; // Custom learning achievement

export const XP_VALUES: Record<XpSource, number> = {
  PRACTICE_SESSION: 10,
  CONCEPT_DEVELOPING: 25,
  CONCEPT_PROFICIENT: 50,
  CONCEPT_MASTERED: 100,
  PERFECT_ASSESSMENT: 75,
  DAILY_STUDY: 15,
  STREAK_7_DAYS: 100,
  CUSTOM: 0,
};

export interface XpHistoryEntry {
  id: string;
  source: XpSource;
  amount: number;
  reasonKurdish: string;
  timestamp: number;
}

export interface StudentXpData {
  userId: string;
  totalXp: number;
  level: number;
  levelTitle: string;
  history: XpHistoryEntry[];
  updatedAt: number;
}

export interface XpAwardResult {
  previousXp: number;
  newXp: number;
  awardedXp: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  levelTitle: string;
  reasonKurdish: string;
}

export type XpEventListener = (result: XpAwardResult) => void;

const xpListeners = new Set<XpEventListener>();

/**
 * Level names in Kurdish Sorani based on XP thresholds:
 * 0 - 499: خوێندکار (Student)
 * 500 - 999: بەڵێن (Promising)
 * 1000 - 1999: بارودۆخ (Steadfast / Progressing)
 * 2000 - 4999: شارەزا (Expert)
 * 5000+: مامۆستا (Master)
 */
export function getLevelTitle(xp: number): string {
  if (xp >= 5000) return "مامۆستا";
  if (xp >= 2000) return "شارەزا";
  if (xp >= 1000) return "بارودۆخ";
  if (xp >= 500) return "بەڵێن";
  return "خوێندکار";
}

/**
 * Calculates level number: Every 500 XP = new level.
 * Level 1: 0 - 499 XP
 * Level 2: 500 - 999 XP
 * Level 3: 1000 - 1499 XP, etc.
 */
export function getLevelNumber(xp: number): number {
  if (xp <= 0) return 1;
  return Math.floor(xp / 500) + 1;
}

/**
 * Returns progress details for current level XP bar.
 */
export function getXpProgressInLevel(xp: number): {
  currentLevel: number;
  levelTitle: string;
  currentLevelXp: number;
  nextLevelXp: number;
  xpInCurrentLevel: number;
  xpRequiredForLevel: number;
  progressPercent: number;
  xpRemaining: number;
} {
  const currentLevel = getLevelNumber(xp);
  const levelTitle = getLevelTitle(xp);
  const currentLevelFloor = (currentLevel - 1) * 500;
  const nextLevelCeil = currentLevel * 500;
  const xpInCurrentLevel = Math.max(0, xp - currentLevelFloor);
  const xpRequiredForLevel = 500;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpRequiredForLevel) * 100));
  const xpRemaining = Math.max(0, nextLevelCeil - xp);

  return {
    currentLevel,
    levelTitle,
    currentLevelXp: currentLevelFloor,
    nextLevelXp: nextLevelCeil,
    xpInCurrentLevel,
    xpRequiredForLevel,
    progressPercent,
    xpRemaining,
  };
}

/**
 * Default Kurdish descriptions for XP sources
 */
export function getKurdishXpReason(source: XpSource, customReason?: string): string {
  if (customReason) return customReason;
  switch (source) {
    case "PRACTICE_SESSION":
      return "تەواوکردنی ڕاهێنان 📝";
    case "CONCEPT_DEVELOPING":
      return "گەیشتن بە ئاستی بەرەوپێشچوو 📈";
    case "CONCEPT_PROFICIENT":
      return "گەیشتن بە ئاستی لێهاتوو 🌟";
    case "CONCEPT_MASTERED":
      return "تێگەیشتنی تەواو لە بابەت (ماستەری) ⭐";
    case "PERFECT_ASSESSMENT":
      return "نمرەی تەواو لە هەڵسەنگاندندا 💯";
    case "DAILY_STUDY":
      return "خوێندنی ڕۆژانە 📚";
    case "STREAK_7_DAYS":
      return "پاداشتی هەفتەیەک بەردەوامی 🔥";
    case "CUSTOM":
    default:
      return "پاداشتی فێربوون ✨";
  }
}

/**
 * Storage key for localStorage cache
 */
function getStorageKey(userId: string): string {
  return `zana_xp_${userId || "default-guest"}`;
}

/**
 * Retrieve student XP data with local-first cache and Firestore sync.
 */
export async function getStudentXpData(userId: string): Promise<StudentXpData> {
  const defaultData: StudentXpData = {
    userId,
    totalXp: 0,
    level: 1,
    levelTitle: "خوێندکار",
    history: [],
    updatedAt: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(getStorageKey(userId));
      if (cached) {
        const parsed = JSON.parse(cached) as Partial<StudentXpData>;
        if (typeof parsed.totalXp === "number") {
          return {
            userId,
            totalXp: parsed.totalXp,
            level: getLevelNumber(parsed.totalXp),
            levelTitle: getLevelTitle(parsed.totalXp),
            history: Array.isArray(parsed.history) ? parsed.history : [],
            updatedAt: parsed.updatedAt || Date.now(),
          };
        }
      }
    } catch {
      // Fallback
    }
  }

  // Attempt Firestore read if online
  try {
    const db = getFirestoreDb();
    if (db && userId) {
      const docRef = doc(db, "users", userId, "gamification", "xp");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as Partial<StudentXpData>;
        const totalXp = typeof data.totalXp === "number" ? data.totalXp : 0;
        const result: StudentXpData = {
          userId,
          totalXp,
          level: getLevelNumber(totalXp),
          levelTitle: getLevelTitle(totalXp),
          history: Array.isArray(data.history) ? data.history : [],
          updatedAt: data.updatedAt || Date.now(),
        };
        saveLocalXpData(userId, result);
        return result;
      }
    }
  } catch {
    // Return default on network or permission failure
  }

  return defaultData;
}

function saveLocalXpData(userId: string, data: StudentXpData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Award XP to a student. Safe, optimistic, and local-first.
 */
export async function awardXp(
  userId: string,
  source: XpSource,
  customAmount?: number,
  customReason?: string
): Promise<XpAwardResult> {
  const currentData = await getStudentXpData(userId);
  const previousXp = currentData.totalXp;
  const previousLevel = currentData.level;

  const awardedXp =
    typeof customAmount === "number" && customAmount > 0
      ? customAmount
      : XP_VALUES[source] || 0;

  const newXp = previousXp + awardedXp;
  const newLevel = getLevelNumber(newXp);
  const levelTitle = getLevelTitle(newXp);
  const leveledUp = newLevel > previousLevel;
  const reasonKurdish = getKurdishXpReason(source, customReason);

  const newHistoryEntry: XpHistoryEntry = {
    id: `xp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    source,
    amount: awardedXp,
    reasonKurdish,
    timestamp: Date.now(),
  };

  const updatedData: StudentXpData = {
    userId,
    totalXp: newXp,
    level: newLevel,
    levelTitle,
    history: [newHistoryEntry, ...currentData.history].slice(0, 50),
    updatedAt: Date.now(),
  };

  // 1. Save locally
  saveLocalXpData(userId, updatedData);

  // 2. Sync to Firestore in background
  try {
    const db = getFirestoreDb();
    if (db && userId) {
      const docRef = doc(db, "users", userId, "gamification", "xp");
      setDoc(docRef, updatedData, { merge: true }).catch(() => {
        // Offline or permissions issue handled silently
      });
    }
  } catch {
    // Non-blocking
  }

  const result: XpAwardResult = {
    previousXp,
    newXp,
    awardedXp,
    previousLevel,
    newLevel,
    leveledUp,
    levelTitle,
    reasonKurdish,
  };

  // 3. Notify listeners
  xpListeners.forEach((listener) => {
    try {
      listener(result);
    } catch {
      // Listener failure isolated
    }
  });

  return result;
}

/**
 * Subscribe to XP awards (used by UI for notifications and level-up celebrations)
 */
export function onXpAwarded(listener: XpEventListener): () => void {
  xpListeners.add(listener);
  return () => {
    xpListeners.delete(listener);
  };
}

/**
 * Format numbers with Eastern Arabic / Kurdish digits if requested
 */
export function formatKurdishNumber(num: number, useEastern: boolean = false): string {
  if (!useEastern) return num.toLocaleString("en-US");
  const easternDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .replace(/[0-9]/g, (match) => easternDigits[parseInt(match, 10)] || match);
}
