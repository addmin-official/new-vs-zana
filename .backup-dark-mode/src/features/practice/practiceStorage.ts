import { PracticeBadge, PracticeProgressState } from "./practiceTypes.ts";

const STORAGE_KEY = "zana_practice_progress_v1";

export const AVAILABLE_BADGES: PracticeBadge[] = [
  {
    id: "badge_math_solver",
    titleKu: "مامۆستای هاوکێشەکان",
    descriptionKu: "تەواوکردنی یەکەم شیکارکردنی هەنگاو بە هەنگاوی جەبر بە سەرکەوتوویی",
    iconName: "Calculator",
    category: "math"
  },
  {
    id: "badge_circuit_master",
    titleKu: "ئەندازیاری خولە کارەباییەکان",
    descriptionKu: "تەواوکردنی تاقیگەی یاسای ئۆم و تاقیکردنەوەی بەرگری و تەزوو",
    iconName: "Zap",
    category: "lab"
  },
  {
    id: "badge_chem_titration",
    titleKu: "زانای کارلێک و تفتێتی",
    descriptionKu: "شیکاری خاڵی هاوتایی لە تاقیگەی تایتڕەیشن بە سەرکەوتوویی",
    iconName: "FlaskConical",
    category: "science"
  },
  {
    id: "badge_bohr_atom",
    titleKu: "پشکنەری ئەتۆم",
    descriptionKu: "ڕێکخستنی بارگەی ئەلیکترۆن لەسەر بەرگەکانی گەردیلە",
    iconName: "Atom",
    category: "science"
  },
  {
    id: "badge_newton_force",
    titleKu: "تێگەیشتووی یاساکانی نیوتن",
    descriptionKu: "بەستنەوەی تاودان و بارستایی بە شێوەیەکی کرداری لە تاقیگەی فیزیا",
    iconName: "Gauge",
    category: "lab"
  },
  {
    id: "badge_quiz_champion",
    titleKu: "پاڵەوانی وەڵامە خێراکان",
    descriptionKu: "بەدەستهێنانی زنجیرەی وەڵامی دروست لە یاری پرسیارەکاندا",
    iconName: "Trophy",
    category: "streak"
  },
  {
    id: "badge_step_virtuoso",
    titleKu: "شیکارکەری وردبین",
    descriptionKu: "تەواوکردنی تەواوی هەنگاوەکان بێ هەڵە لە شیکاری بیرکاریدا",
    iconName: "CheckCircle2",
    category: "solver"
  }
];

export const INITIAL_PRACTICE_STATE: PracticeProgressState = {
  totalXp: 120,
  completedModuleIds: [],
  moduleScores: {},
  unlockedBadgeIds: ["badge_math_solver"],
  currentStreak: 2,
  lastPracticeDate: new Date().toISOString().split("T")[0]
};

export class PracticeStorage {
  static getProgress(): PracticeProgressState {
    if (typeof localStorage === "undefined") return INITIAL_PRACTICE_STATE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return INITIAL_PRACTICE_STATE;
      const parsed = JSON.parse(stored) as PracticeProgressState;
      return {
        ...INITIAL_PRACTICE_STATE,
        ...parsed,
        moduleScores: parsed.moduleScores || {},
        completedModuleIds: parsed.completedModuleIds || [],
        unlockedBadgeIds: parsed.unlockedBadgeIds || ["badge_math_solver"]
      };
    } catch {
      return INITIAL_PRACTICE_STATE;
    }
  }

  static saveProgress(state: PracticeProgressState): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("Could not save practice progress to localStorage:", err);
    }
  }

  static recordModuleCompletion(
    moduleId: string,
    earnedXp: number,
    score: number,
    maxScore: number,
    badgeAwardId?: string
  ): { newlyUnlockedBadges: PracticeBadge[]; updatedState: PracticeProgressState } {
    const current = this.getProgress();
    const today = new Date().toISOString().split("T")[0];

    // Calculate streak
    let newStreak = current.currentStreak;
    if (current.lastPracticeDate !== today) {
      newStreak += 1;
    }

    const completedIds = Array.from(new Set([...current.completedModuleIds, moduleId]));
    const newlyUnlockedBadges: PracticeBadge[] = [];

    const unlockedBadgeIds = new Set(current.unlockedBadgeIds);

    // Award direct badge if specified and not yet possessed
    if (badgeAwardId && !unlockedBadgeIds.has(badgeAwardId)) {
      unlockedBadgeIds.add(badgeAwardId);
      const found = AVAILABLE_BADGES.find((b) => b.id === badgeAwardId);
      if (found) newlyUnlockedBadges.push(found);
    }

    // Check automatic milestone badges
    if (completedIds.length >= 3 && !unlockedBadgeIds.has("badge_step_virtuoso")) {
      unlockedBadgeIds.add("badge_step_virtuoso");
      const found = AVAILABLE_BADGES.find((b) => b.id === badge_step_virtuoso_id);
      if (found) newlyUnlockedBadges.push(found);
    }

    const updatedState: PracticeProgressState = {
      ...current,
      totalXp: current.totalXp + earnedXp,
      completedModuleIds: completedIds,
      currentStreak: newStreak,
      lastPracticeDate: today,
      unlockedBadgeIds: Array.from(unlockedBadgeIds),
      moduleScores: {
        ...current.moduleScores,
        [moduleId]: {
          score,
          maxScore,
          completedAt: new Date().toISOString()
        }
      }
    };

    this.saveProgress(updatedState);
    return { newlyUnlockedBadges, updatedState };
  }
}

const badge_step_virtuoso_id = "badge_step_virtuoso";
