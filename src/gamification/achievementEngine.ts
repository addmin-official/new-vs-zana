/**
 * ZANA Platform - Gamification: Achievement Engine
 *
 * Designed for Kurdish students Grade 9–12:
 * - Achievements unlock strictly once.
 * - Async non-blocking verification after session completions.
 * - Stored in Firestore users/{uid}/achievements + offline-first local cache.
 * - Automatically awards cosmetic XP and triggers celebration toasts.
 */

import { getFirestoreDb } from "../services/firebase.ts";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { awardXp } from "./xpSystem.ts";

export type AchievementCategory = "learning" | "mastery" | "streak" | "assessment" | "subject";

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  xpReward: number;
  icon: string;
  hasConfetti?: boolean;
  subjectKey?: string;
}

export interface UnlockedAchievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  xpReward: number;
  icon: string;
  hasConfetti: boolean;
  unlockedAt: number;
  shownToUser: boolean;
}

export const ACHIEVEMENTS: Record<string, AchievementDefinition> = {
  // LEARNING ACHIEVEMENTS
  FIRST_CONCEPT: {
    id: "FIRST_CONCEPT",
    title: "یەکەم بابەت فێربووی! 🌱",
    description: "یەکەم چەمک یا بابەتی وانەت لە پلاتفۆرم بەسەرکەوتوویی تەواو کرد",
    category: "learning",
    xpReward: 25,
    icon: "🌱",
  },
  FIRST_MASTERY: {
    id: "FIRST_MASTERY",
    title: "یەکەم بابەتت تێگەیشتیت! ⭐",
    description: "ئاستی ماستەری (تێگەیشتنی تەواو)ـت بۆ یەکەم بابەت بەدەستهێنا",
    category: "mastery",
    xpReward: 100,
    icon: "⭐",
    hasConfetti: true,
  },
  SUBJECT_COMPLETE: {
    id: "SUBJECT_COMPLETE",
    title: "تەواوی {subject} تێگەیشتیت! 🏆",
    description: "هەموو بابەتەکانی وانەیەکت لە مەنهەج بە تەواوی فێربوویت",
    category: "mastery",
    xpReward: 250,
    icon: "🏆",
    hasConfetti: true,
  },
  PERFECT_ASSESSMENT: {
    id: "PERFECT_ASSESSMENT",
    title: "نمرەی تەواو لە هەڵسەنگاندندا! 💯",
    description: "نمرەی تەواوت لە تاقیکردنەوە یا هەڵسەنگاندندا بەدەستهێنا",
    category: "assessment",
    xpReward: 75,
    icon: "💯",
  },
  COMEBACK: {
    id: "COMEBACK",
    title: "بەخێربیتەوە! دووبارە دەستت کردووە 👏",
    description: "دوای پشوو و دابڕان، گەڕایتەوە و درێژەت بە فێربوون دا",
    category: "learning",
    xpReward: 25,
    icon: "👏",
  },
  SPEED_LEARNER: {
    id: "SPEED_LEARNER",
    title: "٣ بابەت لە یەک ڕۆژدا 🚀",
    description: "لە یەک ڕۆژدا ٣ بابەتی جیاوازت بەسەرکەوتوویی خوێند و ڕاهێنانت پێکرد",
    category: "learning",
    xpReward: 50,
    icon: "🚀",
  },
  DEEP_THINKER: {
    id: "DEEP_THINKER",
    title: "٢٠ پرسیار لەیەک بابەتدا پرسیت 🧠",
    description: "قووڵ بوویتەوە لە تێگەیشتنی بابەتێک و بیست پرسیاری پەیوەندیدارت شیتاڵ کرد",
    category: "learning",
    xpReward: 50,
    icon: "🧠",
  },

  // STREAK ACHIEVEMENTS
  STREAK_3_DAYS: {
    id: "STREAK_3_DAYS",
    title: "٣ ڕۆژ بەردەوامیت! 🔥",
    description: "سێ ڕۆژ لەسەریەک کاتت تەرخان کرد بۆ فێربوون",
    category: "streak",
    xpReward: 30,
    icon: "🔥",
  },
  STREAK_7_DAYS: {
    id: "STREAK_7_DAYS",
    title: "هەفتەیەک بەردەوامیت! 🔥",
    description: "حەوت ڕۆژ لەسەریەک بەردەوامیت پاراست",
    category: "streak",
    xpReward: 100,
    icon: "🔥",
  },
  STREAK_14_DAYS: {
    id: "STREAK_14_DAYS",
    title: "دوو هەفتە بەردەوامیت! 🔥",
    description: "چواردە ڕۆژ لەسەریەک خوێندنت پشتگوێ نەخست",
    category: "streak",
    xpReward: 150,
    icon: "🔥",
  },
  STREAK_30_DAYS: {
    id: "STREAK_30_DAYS",
    title: "مانگێک بەردەوامیت! 🔥",
    description: "سی ڕۆژ بەردەوامی پۆڵایین لە فێربوون",
    category: "streak",
    xpReward: 300,
    icon: "🔥",
    hasConfetti: true,
  },
  STREAK_100_DAYS: {
    id: "STREAK_100_DAYS",
    title: "١٠٠ ڕۆژ بەردەوامیت! 👑",
    description: "سەد ڕۆژ لەسەریەک فێربوونی بەردەوام — تۆ پاڵەوانیت!",
    category: "streak",
    xpReward: 1000,
    icon: "👑",
    hasConfetti: true,
  },

  // SUBJECT-SPECIFIC ACHIEVEMENTS
  MATH_MASTER: {
    id: "MATH_MASTER",
    title: "مامۆستای بیرکاری 📐",
    description: "لە بابەتی بیرکاریدا ئاستێکی بڵند و ناوازەت بەدەستهێنا",
    category: "subject",
    xpReward: 150,
    icon: "📐",
    subjectKey: "math",
  },
  PHYSICS_PRO: {
    id: "PHYSICS_PRO",
    title: "شارەزای فیزیا ⚡",
    description: "تێگەیشتنی قووڵ لە یاساکانی فیزیا و شیکارکردنی پرسەکان",
    category: "subject",
    xpReward: 150,
    icon: "⚡",
    subjectKey: "physics",
  },
  CHEMISTRY_EXPERT: {
    id: "CHEMISTRY_EXPERT",
    title: "شارەزای کیمیا ⚗️",
    description: "زاڵبوون بەسەر هاوکێشە و چەمکە سەرەکییەکانی کیمیا",
    category: "subject",
    xpReward: 150,
    icon: "⚗️",
    subjectKey: "chemistry",
  },
  BIOLOGY_EXPERT: {
    id: "BIOLOGY_EXPERT",
    title: "شارەزای زیندەزانی 🧬",
    description: "تێگەیشتنی تەواو لە پێکهاتەی زیندەوەران و دیاردەکانی ژیان",
    category: "subject",
    xpReward: 150,
    icon: "🧬",
    subjectKey: "biology",
  },
  ENGLISH_PRO: {
    id: "ENGLISH_PRO",
    title: "شارەزای ئینگلیزی 📖",
    description: "شارەزایی لە ڕێزمان و دەربڕینی زمانی ئینگلیزی",
    category: "subject",
    xpReward: 150,
    icon: "📖",
    subjectKey: "english",
  },
  KURDISH_SCHOLAR: {
    id: "KURDISH_SCHOLAR",
    title: "زانای زمانی کوردی 📚",
    description: "شارەزایی بڵند لە ئەدەب و ڕێزمانی کوردی سۆرانی",
    category: "subject",
    xpReward: 150,
    icon: "📚",
    subjectKey: "kurdish",
  },
};

export interface SessionAchievementContext {
  userId: string;
  subject?: string;
  subjectNameKurdish?: string;
  conceptsCompletedToday?: number;
  totalConceptsCompleted?: number;
  totalConceptsInSubject?: number;
  masteredConceptsInSubject?: number;
  isFirstConcept?: boolean;
  isFirstMastery?: boolean;
  isPerfectAssessment?: boolean;
  questionsAnsweredInSession?: number;
  streakDays?: number;
  daysSinceLastSession?: number;
  subjectMasteryCount?: Record<string, number>;
}

export type AchievementUnlockListener = (unlocked: UnlockedAchievement) => void;
const achievementListeners = new Set<AchievementUnlockListener>();

function getStorageKey(userId: string): string {
  return `zana_achievements_${userId || "default-guest"}`;
}

export async function getUserAchievements(userId: string): Promise<Record<string, UnlockedAchievement>> {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(getStorageKey(userId));
      if (cached) {
        return JSON.parse(cached) as Record<string, UnlockedAchievement>;
      }
    } catch {
      // Local cache error fallback
    }
  }

  const result: Record<string, UnlockedAchievement> = {};

  try {
    const db = getFirestoreDb();
    if (db && userId) {
      const colRef = collection(db, "users", userId, "achievements");
      const snap = await getDocs(colRef);
      snap.forEach((docSnap) => {
        const data = docSnap.data() as UnlockedAchievement;
        if (data && data.id) {
          result[data.id] = data;
        }
      });
      saveLocalAchievements(userId, result);
    }
  } catch {
    // Non-blocking
  }

  return result;
}

function saveLocalAchievements(userId: string, achievements: Record<string, UnlockedAchievement>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(achievements));
  } catch {
    // Quota handled
  }
}

/**
 * Unlocks an achievement if not already unlocked.
 * Awards XP and notifies listeners asynchronously.
 */
export async function unlockAchievement(
  userId: string,
  achievementId: string,
  titleReplacement?: { subject?: string }
): Promise<UnlockedAchievement | null> {
  const def = ACHIEVEMENTS[achievementId];
  if (!def) return null;

  const current = await getUserAchievements(userId);
  if (current[achievementId]) {
    // Already unlocked previously — enforce strictly unlocked once
    return null;
  }

  let finalTitle = def.title;
  if (titleReplacement?.subject && finalTitle.includes("{subject}")) {
    finalTitle = finalTitle.replace("{subject}", titleReplacement.subject);
  }

  const unlocked: UnlockedAchievement = {
    id: def.id,
    title: finalTitle,
    description: def.description,
    category: def.category,
    xpReward: def.xpReward,
    icon: def.icon,
    hasConfetti: def.hasConfetti || def.category === "mastery",
    unlockedAt: Date.now(),
    shownToUser: false,
  };

  current[achievementId] = unlocked;
  saveLocalAchievements(userId, current);

  // Sync to Firestore in background
  try {
    const db = getFirestoreDb();
    if (db && userId) {
      const docRef = doc(db, "users", userId, "achievements", achievementId);
      setDoc(docRef, unlocked).catch(() => {});
    }
  } catch {
    // Handled
  }

  // Award XP via XP system
  awardXp(userId, "CUSTOM", def.xpReward, `دەستکەوتی: ${finalTitle}`).catch(() => {});

  // Notify listeners (Toast queue & notification engine)
  achievementListeners.forEach((listener) => {
    try {
      listener(unlocked);
    } catch {
      // Isolated
    }
  });

  return unlocked;
}

/**
 * Checks and triggers any unlocked achievements after a learning session ends.
 * Always executes asynchronously and never blocks UI threads.
 */
export async function checkSessionAchievements(
  context: SessionContextParams
): Promise<UnlockedAchievement[]> {
  const { userId } = context;
  if (!userId) return [];

  const newlyUnlocked: UnlockedAchievement[] = [];

  // Helper check
  const tryUnlock = async (id: string, replace?: { subject?: string }) => {
    const res = await unlockAchievement(userId, id, replace);
    if (res) newlyUnlocked.push(res);
  };

  try {
    // 1. FIRST_CONCEPT
    if (context.isFirstConcept || (context.totalConceptsCompleted && context.totalConceptsCompleted >= 1)) {
      await tryUnlock("FIRST_CONCEPT");
    }

    // 2. FIRST_MASTERY
    if (context.isFirstMastery) {
      await tryUnlock("FIRST_MASTERY");
    }

    // 3. PERFECT_ASSESSMENT
    if (context.isPerfectAssessment) {
      await tryUnlock("PERFECT_ASSESSMENT");
    }

    // 4. COMEBACK (studied after >= 7 days gap)
    if (context.daysSinceLastSession && context.daysSinceLastSession >= 7) {
      await tryUnlock("COMEBACK");
    }

    // 5. SPEED_LEARNER (3 concepts in 1 day)
    if (context.conceptsCompletedToday && context.conceptsCompletedToday >= 3) {
      await tryUnlock("SPEED_LEARNER");
    }

    // 6. DEEP_THINKER (20 questions answered in a single session/concept)
    if (context.questionsAnsweredInSession && context.questionsAnsweredInSession >= 20) {
      await tryUnlock("DEEP_THINKER");
    }

    // 7. STREAKS
    if (context.streakDays) {
      if (context.streakDays >= 3) await tryUnlock("STREAK_3_DAYS");
      if (context.streakDays >= 7) await tryUnlock("STREAK_7_DAYS");
      if (context.streakDays >= 14) await tryUnlock("STREAK_14_DAYS");
      if (context.streakDays >= 30) await tryUnlock("STREAK_30_DAYS");
      if (context.streakDays >= 100) await tryUnlock("STREAK_100_DAYS");
    }

    // 8. SUBJECT-SPECIFIC (e.g. 5+ mastered concepts in specific subject)
    const subj = context.subject?.toLowerCase() || "";
    const subjectMasteryCount = context.masteredConceptsInSubject || 0;

    if (subj.includes("math") && subjectMasteryCount >= 5) {
      await tryUnlock("MATH_MASTER");
    } else if (subj.includes("physic") && subjectMasteryCount >= 5) {
      await tryUnlock("PHYSICS_PRO");
    } else if (subj.includes("chem") && subjectMasteryCount >= 5) {
      await tryUnlock("CHEMISTRY_EXPERT");
    } else if (subj.includes("bio") && subjectMasteryCount >= 5) {
      await tryUnlock("BIOLOGY_EXPERT");
    } else if (subj.includes("eng") && subjectMasteryCount >= 5) {
      await tryUnlock("ENGLISH_PRO");
    } else if (subj.includes("kurd") && subjectMasteryCount >= 5) {
      await tryUnlock("KURDISH_SCHOLAR");
    }

    // 9. SUBJECT_COMPLETE
    if (
      context.totalConceptsInSubject &&
      context.masteredConceptsInSubject &&
      context.masteredConceptsInSubject >= context.totalConceptsInSubject &&
      context.totalConceptsInSubject > 0
    ) {
      await tryUnlock("SUBJECT_COMPLETE", {
        subject: context.subjectNameKurdish || context.subject || "وانە",
      });
    }
  } catch (err) {
    console.warn("Async achievement check warning:", err);
  }

  return newlyUnlocked;
}

export type SessionContextParams = SessionAchievementContext;

/**
 * Subscribe to new achievement unlock events
 */
export function onAchievementUnlocked(listener: AchievementUnlockListener): () => void {
  achievementListeners.add(listener);
  return () => {
    achievementListeners.delete(listener);
  };
}
