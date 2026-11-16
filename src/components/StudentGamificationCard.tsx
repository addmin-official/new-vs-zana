import React, { useState, useEffect } from "react";
import {
  Flame,
  Star,
  Snowflake,
  Trophy,
} from "lucide-react";
import {
  getStudentXpData,
  getXpProgressInLevel,
  StudentXpData,
} from "../gamification/xpSystem.ts";
import {
  getStudentStreakData,
  getMonthlyActivityCalendar,
  freezeStreak,
  formatKurdishStreak,
  DailyCalendarDay,
  StudentStreakData,
} from "../gamification/streakManager.ts";
import {
  getUserAchievements,
  UnlockedAchievement,
  ACHIEVEMENTS,
} from "../gamification/achievementEngine.ts";

export interface StudentGamificationCardProps {
  userId: string;
  initialXp?: number;
  initialStreak?: number;
  className?: string;
}

export function StudentGamificationCard({
  userId,
  initialXp,
  initialStreak,
  className = "",
}: StudentGamificationCardProps) {
  const [xpData, setXpData] = useState<StudentXpData | null>(null);
  const [streakData, setStreakData] = useState<StudentStreakData | null>(null);
  const [calendarDays, setCalendarDays] = useState<DailyCalendarDay[]>([]);
  const [achievements, setAchievements] = useState<Record<string, UnlockedAchievement>>({});
  const [isFreezing, setIsFreezing] = useState(false);
  const [freezeMessage, setFreezeMessage] = useState<string | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [xp, streak, monthlyCal, userAch] = await Promise.all([
          getStudentXpData(userId),
          getStudentStreakData(userId),
          getMonthlyActivityCalendar(userId, currentYear, currentMonth),
          getUserAchievements(userId),
        ]);

        if (isMounted) {
          setXpData(xp);
          setStreakData(streak);
          setCalendarDays(monthlyCal);
          setAchievements(userAch);
        }
      } catch {
        // Fallback
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [userId, currentYear, currentMonth]);

  const effectiveXp = xpData?.totalXp ?? initialXp ?? 0;
  const xpProgress = getXpProgressInLevel(effectiveXp);

  const effectiveStreak = streakData?.currentStreak ?? initialStreak ?? 0;
  const longestStreak = streakData?.longestStreak ?? Math.max(effectiveStreak, initialStreak ?? 0);

  const handleFreeze = async () => {
    setIsFreezing(true);
    try {
      const res = await freezeStreak(userId);
      setFreezeMessage(res.message);
      if (res.success && res.data) {
        setStreakData(res.data);
      }
    } catch {
      setFreezeMessage("هەڵەیەک ڕوویدا لە کاتی پاراستنی زنجیرەدا.");
    } finally {
      setIsFreezing(false);
      setTimeout(() => setFreezeMessage(null), 4000);
    }
  };

  const unlockedCount = Object.keys(achievements).length;
  const totalCount = Object.keys(ACHIEVEMENTS).length;

  return (
    <div
      dir="rtl"
      className={`space-y-4 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-amber-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/40 p-5 sm:p-6 border border-indigo-100 dark:border-indigo-900/60 shadow-sm ${className}`}
    >
      {/* Top Banner: Level Title & Fire Streak Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-100/80 dark:border-slate-800 pb-4">
        {/* Level & XP Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white font-sans font-black text-xl shadow-md shadow-indigo-600/20">
            <span>{xpProgress.currentLevel}</span>
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-xs">
              <Star className="h-3 w-3 fill-current" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-black text-indigo-600 dark:text-indigo-400">
                ئاستی {xpProgress.currentLevel}
              </span>
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 px-2.5 py-0.5 font-sans text-xs font-bold text-indigo-700 dark:text-indigo-300">
                {xpProgress.levelTitle}
              </span>
            </div>
            <h3 className="font-sans text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {effectiveXp.toLocaleString()} خاڵی ئەزموون (XP)
            </h3>
          </div>
        </div>

        {/* Streak Counter with Fire Emoji */}
        <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800/80 rounded-2xl px-4 py-2.5 border border-orange-200 dark:border-orange-900/60 shadow-xs">
          <span className="text-2xl animate-pulse select-none">🔥</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-base font-black text-orange-600 dark:text-orange-400">
                {formatKurdishStreak(effectiveStreak, false).replace("🔥", "").trim()} ڕۆژ بەردەوامیت
              </span>
            </div>
            <span className="font-sans text-[11px] text-slate-500 dark:text-slate-400 block">
              بەرزترین تۆمار: {longestStreak} ڕۆژ
            </span>
          </div>
        </div>
      </div>

      {/* Level XP Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between font-sans text-xs font-bold">
          <span className="text-slate-600 dark:text-slate-300">
            بەرەو ئاستی داهاتوو ({xpProgress.currentLevel + 1}):
          </span>
          <span className="text-indigo-600 dark:text-indigo-400">
            {xpProgress.xpInCurrentLevel} / {xpProgress.xpRequiredForLevel} XP ({xpProgress.progressPercent}%)
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-l from-indigo-500 to-indigo-600 transition-all duration-500 shadow-xs"
            style={{ width: `${Math.max(xpProgress.progressPercent, 4)}%` }}
          />
        </div>
      </div>

      {/* Streak Calendar View (Green dots for active days) */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/60 p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <h4 className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200">
              خشتەی چالاکی مانگانە (مانگی {currentMonth})
            </h4>
          </div>

          {/* Freeze Streak Action */}
          <button
            type="button"
            onClick={handleFreeze}
            disabled={isFreezing}
            className="flex items-center gap-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 px-2.5 py-1 font-sans text-[11px] font-bold text-sky-700 dark:text-sky-300 transition cursor-pointer"
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>وەستاندنی زنجیرە (Freeze)</span>
          </button>
        </div>

        {freezeMessage && (
          <div className="rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 p-2 text-center font-sans text-xs text-sky-800 dark:text-sky-200 animate-in fade-in">
            {freezeMessage}
          </div>
        )}

        {/* Days Grid */}
        <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 pt-1">
          {calendarDays.map((d) => {
            let dotClass = "bg-slate-100 dark:bg-slate-800 text-slate-400";
            let title = `${d.date}: پشوو`;

            if (d.active) {
              dotClass = "bg-emerald-500 text-white shadow-xs";
              title = `${d.date}: خوێندراوە ✅`;
            } else if (d.frozen) {
              dotClass = "bg-sky-400 text-white shadow-xs";
              title = `${d.date}: پارێزراو بە Freeze ❄️`;
            } else if (d.grace) {
              dotClass = "bg-amber-400 text-slate-900";
              title = `${d.date}: پارێزراو بە Grace Day 🛡️`;
            }

            return (
              <div
                key={d.date}
                title={title}
                className={`flex flex-col items-center justify-center rounded-lg p-1.5 font-sans text-[11px] font-bold transition ${dotClass} ${
                  d.isToday ? "ring-2 ring-indigo-500 ring-offset-1" : ""
                }`}
              >
                <span>{d.day}</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 font-sans text-[10px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> چالاک (فێربوویت)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-400" /> پارێزراو (Freeze)
            </span>
          </div>
          <span>١ ڕۆژی لێبوردن بۆ هەر ٧ ڕۆژێک 🛡️</span>
        </div>
      </div>

      {/* Unlocked Achievements Preview */}
      <div className="flex items-center justify-between rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 p-3.5 border border-amber-200/80 dark:border-amber-900/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-sans text-xs font-black text-amber-900 dark:text-amber-200">
              دەستکەوتە فەرمییەکان
            </h4>
            <p className="font-sans text-[11px] text-amber-700 dark:text-amber-300">
              {unlockedCount} لە {totalCount} دەستکەوت کراونەتەوە
            </p>
          </div>
        </div>

        <div className="flex items-center -space-x-1 space-x-reverse overflow-hidden">
          {Object.values(achievements)
            .slice(0, 4)
            .map((ach) => (
              <span
                key={ach.id}
                title={ach.title}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-sm shadow-xs"
              >
                {ach.icon || "🏆"}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

export default StudentGamificationCard;
