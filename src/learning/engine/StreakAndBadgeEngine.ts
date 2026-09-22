import {
  StudentMasteryProfile,
  StudentStreakData,
  AchievementBadge,
  BadgeTier,
  BadgeCategory,
  MasteryStatus,
} from "../domain/MasteryTypes.ts";

export function getTodayDateString(refDate?: Date): string {
  const d = refDate || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateToEpochDay(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / (24 * 60 * 60 * 1000));
}

/**
 * Calculates updated streak data when a student completes a learning task.
 */
export function calculateUpdatedStreak(
  currentStreakData?: StudentStreakData | null,
  taskDateStr?: string
): {
  updatedStreak: StudentStreakData;
  isNewDay: boolean;
  streakIncremented: boolean;
} {
  const taskDate = taskDateStr || getTodayDateString();

  if (!currentStreakData || !currentStreakData.lastCompletedDate) {
    const newStreak: StudentStreakData = {
      currentStreak: 1,
      longestStreak: 1,
      lastCompletedDate: taskDate,
      streakHistory: [taskDate],
      totalTasksCompleted: 1,
    };
    return {
      updatedStreak: newStreak,
      isNewDay: true,
      streakIncremented: true,
    };
  }

  const lastDate = currentStreakData.lastCompletedDate;
  const history = Array.isArray(currentStreakData.streakHistory)
    ? [...currentStreakData.streakHistory]
    : [lastDate];

  if (!history.includes(taskDate)) {
    history.unshift(taskDate);
  }

  // Deduplicate and keep up to 60 most recent days
  const uniqueHistory = Array.from(new Set(history))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 60);

  const totalTasksCompleted = (currentStreakData.totalTasksCompleted || 0) + 1;

  if (lastDate === taskDate) {
    // Already completed today: keep current streak count intact
    return {
      updatedStreak: {
        ...currentStreakData,
        streakHistory: uniqueHistory,
        totalTasksCompleted,
      },
      isNewDay: false,
      streakIncremented: false,
    };
  }

  const diffDays = dateToEpochDay(taskDate) - dateToEpochDay(lastDate);

  if (diffDays === 1) {
    // Exactly next day: increment streak
    const nextStreak = (currentStreakData.currentStreak || 0) + 1;
    const nextLongest = Math.max(currentStreakData.longestStreak || 0, nextStreak);
    return {
      updatedStreak: {
        currentStreak: nextStreak,
        longestStreak: nextLongest,
        lastCompletedDate: taskDate,
        streakHistory: uniqueHistory,
        totalTasksCompleted,
      },
      isNewDay: true,
      streakIncremented: true,
    };
  }

  if (diffDays > 1) {
    // Streak broken: reset to 1
    const nextLongest = Math.max(currentStreakData.longestStreak || 0, 1);
    return {
      updatedStreak: {
        currentStreak: 1,
        longestStreak: nextLongest,
        lastCompletedDate: taskDate,
        streakHistory: uniqueHistory,
        totalTasksCompleted,
      },
      isNewDay: true,
      streakIncremented: true,
    };
  }

  // Older date (diffDays <= 0, out of sequence task): record history, keep current streak
  return {
    updatedStreak: {
      ...currentStreakData,
      streakHistory: uniqueHistory,
      totalTasksCompleted,
    },
    isNewDay: false,
    streakIncremented: false,
  };
}

/**
 * Determines current effective streak status against today's date.
 */
export function getEffectiveStreak(
  streakData?: StudentStreakData | null,
  referenceDateStr?: string
): {
  activeStreak: number;
  longestStreak: number;
  isCompletedToday: boolean;
  isAtRisk: boolean;
  daysSinceLastActive: number;
} {
  if (!streakData || !streakData.lastCompletedDate) {
    return {
      activeStreak: 0,
      longestStreak: streakData?.longestStreak || 0,
      isCompletedToday: false,
      isAtRisk: false,
      daysSinceLastActive: -1,
    };
  }

  const todayStr = referenceDateStr || getTodayDateString();
  const diffDays = dateToEpochDay(todayStr) - dateToEpochDay(streakData.lastCompletedDate);

  if (diffDays === 0) {
    return {
      activeStreak: streakData.currentStreak || 1,
      longestStreak: Math.max(streakData.longestStreak || 0, streakData.currentStreak || 1),
      isCompletedToday: true,
      isAtRisk: false,
      daysSinceLastActive: 0,
    };
  }

  if (diffDays === 1) {
    // Active from yesterday, must complete today
    return {
      activeStreak: streakData.currentStreak || 0,
      longestStreak: streakData.longestStreak || 0,
      isCompletedToday: false,
      isAtRisk: true,
      daysSinceLastActive: 1,
    };
  }

  // More than 1 day elapsed: streak has lapsed
  return {
    activeStreak: 0,
    longestStreak: streakData.longestStreak || 0,
    isCompletedToday: false,
    isAtRisk: false,
    daysSinceLastActive: diffDays,
  };
}

interface BadgeDefinition {
  id: string;
  titleKu: string;
  titleEn: string;
  descriptionKu: string;
  descriptionEn: string;
  icon: string;
  category: BadgeCategory;
  tier: BadgeTier;
  target: number;
  evaluator: (profile: StudentMasteryProfile) => {
    current: number;
    target: number;
    isEligible: boolean;
    labelKu: string;
  };
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "mastered_chemistry",
    titleKu: "شارەزای کیمیا",
    titleEn: "Mastered Chemistry",
    descriptionKu: "شارەزابوون لە چەمکێکی زانستی کیمیا و بەدەستهێنانی نمرەی بەرز لە تاقیکردنەوەکاندا",
    descriptionEn: "Master a Chemistry concept with 80%+ mastery or 3+ consecutive correct answers",
    icon: "FlaskConical",
    category: "subject",
    tier: "gold",
    target: 1,
    evaluator: (profile) => {
      let masteredChem = 0;
      let maxChemScore = 0;

      for (const [id, state] of Object.entries(profile.conceptMasteries || {})) {
        const isChem =
          id.toLowerCase().includes("chem") ||
          id.toLowerCase().includes("kimiya") ||
          id.toLowerCase().includes("acid") ||
          id.toLowerCase().includes("base") ||
          id.toLowerCase().includes("atom") ||
          id.toLowerCase().includes("mol");

        if (isChem) {
          maxChemScore = Math.max(maxChemScore, state.masteryScore || 0);
          if (
            state.status === MasteryStatus.MASTERED ||
            state.masteryScore >= 0.8 ||
            state.consecutiveCorrect >= 3
          ) {
            masteredChem++;
          }
        }
      }

      const isEligible = masteredChem >= 1;
      return {
        current: isEligible ? 1 : Math.round(maxChemScore * 100) / 100,
        target: 1,
        isEligible,
        labelKu: isEligible ? "١ چەمک شارەزا بووە" : `${Math.round(maxChemScore * 100)}% پێشکەوتن`,
      };
    },
  },
  {
    id: "top_performer",
    titleKu: "پێشەنگی باڵا",
    titleEn: "Top Performer",
    descriptionKu: "بەدەستهێنانی ئاستی باڵا بە تێکڕای لێهاتوویی سەروو ٨٠٪ یان زاڵبوون بەسەر ٣ چەمکدا",
    descriptionEn: "Achieve overall mastery of 80%+ or master 3 distinct curriculum concepts",
    icon: "Trophy",
    category: "mastery",
    tier: "platinum",
    target: 80,
    evaluator: (profile) => {
      const masteredCount = Object.values(profile.conceptMasteries || {}).filter(
        (c) => c.status === MasteryStatus.MASTERED || c.masteryScore >= 0.85
      ).length;

      const scorePercent = Math.round((profile.overallMasteryScore || 0) * 100);
      const isEligible = scorePercent >= 80 || masteredCount >= 3;

      return {
        current: Math.min(80, Math.max(scorePercent, masteredCount * 27)),
        target: 80,
        isEligible,
        labelKu: isEligible
          ? "ئاستی باڵا بەدەستهات"
          : `${scorePercent}٪ لێهاتوویی (یان ${masteredCount}/٣ چەمک)`,
      };
    },
  },
  {
    id: "curiosity_spark",
    titleKu: "چرۆی زانیاری",
    titleEn: "Curiosity Spark",
    descriptionKu: "تەواوکردنی یەکەم ئەرکی فێربوون و دەستپێکردنی کاروانی زانستی لەگەڵ زانا",
    descriptionEn: "Complete your first learning task or quiz attempt in ZANA",
    icon: "Sparkles",
    category: "milestone",
    tier: "bronze",
    target: 1,
    evaluator: (profile) => {
      const attempts = Object.values(profile.conceptMasteries || {}).reduce(
        (sum, c) => sum + (c.totalAttempts || 0),
        0
      );
      const tasksCompleted = profile.streak?.totalTasksCompleted || 0;
      const total = Math.max(attempts, tasksCompleted);
      const isEligible = total >= 1;

      return {
        current: Math.min(1, total),
        target: 1,
        isEligible,
        labelKu: isEligible ? "تەواوکراوە" : "٠/١ ئەرک",
      };
    },
  },
  {
    id: "daily_streak_3",
    titleKu: "زنجیرەی ٣ ڕۆژە",
    titleEn: "3-Day Streak",
    descriptionKu: "تەواوکردنی ئەرکی فێربوونی ڕۆژانە بۆ ٣ ڕۆژی بەردەوام بەبێ دابڕان",
    descriptionEn: "Complete daily learning tasks for 3 consecutive days",
    icon: "Flame",
    category: "streak",
    tier: "bronze",
    target: 3,
    evaluator: (profile) => {
      const streakVal = Math.max(
        profile.streak?.currentStreak || 0,
        profile.streak?.longestStreak || 0
      );
      const isEligible = streakVal >= 3;
      return {
        current: Math.min(3, streakVal),
        target: 3,
        isEligible,
        labelKu: isEligible ? "٣ ڕۆژ بەردەوام" : `${streakVal}/٣ ڕۆژ`,
      };
    },
  },
  {
    id: "daily_streak_7",
    titleKu: "پاڵەوانی هەفتانە",
    titleEn: "7-Day Streak",
    descriptionKu: "بەردەوامی لە خوێندن بۆ تەواوی هەفتەیەک (٧ ڕۆژی لەسەریەک)",
    descriptionEn: "Maintain a study streak for 7 consecutive days",
    icon: "Flame",
    category: "streak",
    tier: "silver",
    target: 7,
    evaluator: (profile) => {
      const streakVal = Math.max(
        profile.streak?.currentStreak || 0,
        profile.streak?.longestStreak || 0
      );
      const isEligible = streakVal >= 7;
      return {
        current: Math.min(7, streakVal),
        target: 7,
        isEligible,
        labelKu: isEligible ? "٧ ڕۆژ بەردەوام" : `${streakVal}/٧ ڕۆژ`,
      };
    },
  },
  {
    id: "mastered_mathematics",
    titleKu: "مامۆستای بیرکاری",
    titleEn: "Mastered Mathematics",
    descriptionKu: "شارەزابوونی تەواو لە هاوکێشە و چەمکە سەرەکییەکانی بیرکاری",
    descriptionEn: "Master a Mathematics concept with 80%+ score or 3+ consecutive correct",
    icon: "Calculator",
    category: "subject",
    tier: "gold",
    target: 1,
    evaluator: (profile) => {
      let masteredMath = 0;
      let maxMathScore = 0;

      for (const [id, state] of Object.entries(profile.conceptMasteries || {})) {
        const isMath =
          id.toLowerCase().includes("math") ||
          id.toLowerCase().includes("birkari") ||
          id.toLowerCase().includes("hawkisha") ||
          id.toLowerCase().includes("algebra") ||
          id.toLowerCase().includes("calc") ||
          id.toLowerCase().includes("integral");

        if (isMath) {
          maxMathScore = Math.max(maxMathScore, state.masteryScore || 0);
          if (
            state.status === MasteryStatus.MASTERED ||
            state.masteryScore >= 0.8 ||
            state.consecutiveCorrect >= 3
          ) {
            masteredMath++;
          }
        }
      }

      const isEligible = masteredMath >= 1;
      return {
        current: isEligible ? 1 : Math.round(maxMathScore * 100) / 100,
        target: 1,
        isEligible,
        labelKu: isEligible ? "١ چەمک شارەزا بووە" : `${Math.round(maxMathScore * 100)}% پێشکەوتن`,
      };
    },
  },
  {
    id: "physics_explorer",
    titleKu: "پشکنەری فیزیا",
    titleEn: "Physics Explorer",
    descriptionKu: "شیکارکردنی وردی یاساکانی فیزیا و گەیشتن بە ئاستی لێهاتوویی",
    descriptionEn: "Master a Physics concept with 80%+ score or 3+ consecutive correct",
    icon: "Zap",
    category: "subject",
    tier: "gold",
    target: 1,
    evaluator: (profile) => {
      let masteredPhysics = 0;
      let maxPhysicsScore = 0;

      for (const [id, state] of Object.entries(profile.conceptMasteries || {})) {
        const isPhysics =
          id.toLowerCase().includes("phys") ||
          id.toLowerCase().includes("fizia") ||
          id.toLowerCase().includes("force") ||
          id.toLowerCase().includes("energy") ||
          id.toLowerCase().includes("motion");

        if (isPhysics) {
          maxPhysicsScore = Math.max(maxPhysicsScore, state.masteryScore || 0);
          if (
            state.status === MasteryStatus.MASTERED ||
            state.masteryScore >= 0.8 ||
            state.consecutiveCorrect >= 3
          ) {
            masteredPhysics++;
          }
        }
      }

      const isEligible = masteredPhysics >= 1;
      return {
        current: isEligible ? 1 : Math.round(maxPhysicsScore * 100) / 100,
        target: 1,
        isEligible,
        labelKu: isEligible ? "١ چەمک شارەزا بووە" : `${Math.round(maxPhysicsScore * 100)}% پێشکەوتن`,
      };
    },
  },
  {
    id: "accuracy_master",
    titleKu: "وەڵامی ورد و بێ هەڵە",
    titleEn: "High Accuracy",
    descriptionKu: "وەڵامدانەوەی ٤ پرسیار لەسەریەک بە ڕاستی بێ هیچ هەڵەیەک",
    descriptionEn: "Answer 4 questions consecutively correct in any learning topic",
    icon: "Target",
    category: "mastery",
    tier: "silver",
    target: 4,
    evaluator: (profile) => {
      let maxConsecutive = 0;
      for (const state of Object.values(profile.conceptMasteries || {})) {
        if (state.consecutiveCorrect > maxConsecutive) {
          maxConsecutive = state.consecutiveCorrect;
        }
      }
      const isEligible = maxConsecutive >= 4;
      return {
        current: Math.min(4, maxConsecutive),
        target: 4,
        isEligible,
        labelKu: isEligible ? "٤/٤ وەڵامی ڕاست" : `${maxConsecutive}/٤ وەڵامی ڕاست`,
      };
    },
  },
];

/**
 * Evaluates all achievement badges against the student's mastery profile.
 * Returns the list of badge objects along with newly unlocked badge IDs.
 */
export function evaluateAchievements(profile: StudentMasteryProfile): {
  badges: AchievementBadge[];
  newlyUnlockedIds: string[];
} {
  const previouslyUnlocked = new Set(profile.unlockedAchievements || []);
  const newlyUnlockedIds: string[] = [];

  const badges: AchievementBadge[] = BADGE_DEFINITIONS.map((def) => {
    const evalResult = def.evaluator(profile);
    const wasAlreadyUnlocked = previouslyUnlocked.has(def.id);
    const isNowUnlocked = wasAlreadyUnlocked || evalResult.isEligible;

    if (!wasAlreadyUnlocked && isNowUnlocked) {
      newlyUnlockedIds.push(def.id);
    }

    return {
      id: def.id,
      titleKu: def.titleKu,
      titleEn: def.titleEn,
      descriptionKu: def.descriptionKu,
      descriptionEn: def.descriptionEn,
      icon: def.icon,
      category: def.category,
      tier: def.tier,
      isUnlocked: isNowUnlocked,
      unlockedAt: isNowUnlocked ? (wasAlreadyUnlocked ? "بەردەست" : new Date().toISOString()) : null,
      progress: {
        current: evalResult.current,
        target: evalResult.target,
        labelKu: evalResult.labelKu,
      },
    };
  });

  return {
    badges,
    newlyUnlockedIds,
  };
}
