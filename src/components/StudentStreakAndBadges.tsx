import { useState, useMemo } from "react";
import {
  Flame,
  Calendar,
  Trophy,
  Award,
  Sparkles,
  FlaskConical,
  CheckCircle2,
  Calculator,
  Atom,
  Lock,
  Zap,
  ChevronDown,
  ChevronUp,
  Clock
} from "lucide-react";
import { ZanaCard } from "./ZanaCard.tsx";
import { ZanaButton } from "./ZanaButton.tsx";
import { AchievementBadge, BadgeTier } from "../learning/domain/MasteryTypes.ts";
import { getTodayDateString } from "../learning/engine/StreakAndBadgeEngine.ts";

interface StudentStreakAndBadgesProps {
  currentStreak: number;
  longestStreak: number;
  totalTasksCompleted: number;
  isCompletedToday: boolean;
  isAtRisk: boolean;
  streakHistory?: string[];
  badges: AchievementBadge[];
  onCompleteTask?: () => Promise<void> | void;
  isLoading?: boolean;
}

export function StudentStreakAndBadges({
  currentStreak,
  longestStreak,
  totalTasksCompleted,
  isCompletedToday,
  isAtRisk,
  streakHistory = [],
  badges = [],
  onCompleteTask,
  isLoading = false,
}: StudentStreakAndBadgesProps) {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Generate last 7 days for the mini streak calendar
  const past7Days = useMemo(() => {
    const days: { dateStr: string; dayNameKu: string; isCompleted: boolean; isToday: boolean }[] = [];
    const kuDays = ["یەکشەممە", "دووشەممە", "سێشەممە", "چوارشەممە", "پێنجشەممە", "هەینی", "شەممە"];
    const todayStr = getTodayDateString();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const dayNameKu = kuDays[d.getDay()];
      const isCompleted = streakHistory.includes(dateStr) || (dateStr === todayStr && isCompletedToday);

      days.push({
        dateStr,
        dayNameKu,
        isCompleted,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [streakHistory, isCompletedToday]);

  const filteredBadges = useMemo(() => {
    if (filter === "unlocked") {
      return badges.filter((b) => b.isUnlocked);
    }
    if (filter === "locked") {
      return badges.filter((b) => !b.isUnlocked);
    }
    return badges;
  }, [badges, filter]);

  const unlockedCount = useMemo(() => badges.filter((b) => b.isUnlocked).length, [badges]);

  const handleMarkTask = async () => {
    if (!onCompleteTask || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCompleteTask();
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBadgeIcon = (iconName: string, tier: BadgeTier, isUnlocked: boolean) => {
    const iconProps = { className: "w-6 h-6 shrink-0" };

    let iconElement;
    switch (iconName) {
      case "FlaskConical":
        iconElement = <FlaskConical {...iconProps} />;
        break;
      case "Trophy":
        iconElement = <Trophy {...iconProps} />;
        break;
      case "Sparkles":
        iconElement = <Sparkles {...iconProps} />;
        break;
      case "Flame":
        iconElement = <Flame {...iconProps} />;
        break;
      case "Zap":
        iconElement = <Zap {...iconProps} />;
        break;
      case "Calculator":
        iconElement = <Calculator {...iconProps} />;
        break;
      case "Atom":
        iconElement = <Atom {...iconProps} />;
        break;
      case "Award":
      default:
        iconElement = <Award {...iconProps} />;
        break;
    }

    if (!isUnlocked) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center relative border border-slate-200 dark:border-slate-700">
          {iconElement}
          <div className="absolute -bottom-1 -right-1 bg-slate-200 dark:bg-slate-700 rounded-full p-0.5 text-slate-500">
            <Lock className="w-3 h-3" />
          </div>
        </div>
      );
    }

    let tierColors = "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700";
    if (tier === "platinum") {
      tierColors = "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700";
    } else if (tier === "silver") {
      tierColors = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600";
    } else if (tier === "gold") {
      tierColors = "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700";
    }

    return (
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${tierColors}`}>
        {iconElement}
      </div>
    );
  };

  const getTierBadgeText = (tier: BadgeTier) => {
    switch (tier) {
      case "platinum":
        return "پلاتینیۆم";
      case "gold":
        return "زێڕین";
      case "silver":
        return "زیوین";
      case "bronze":
      default:
        return "برۆنز";
    }
  };

  return (
    <div className="space-y-6" style={{ direction: "rtl" }}>
      {/* 1. DAILY STREAK SECTION */}
      <ZanaCard className="border-amber-200/70 dark:border-amber-900/40 bg-linear-to-b from-amber-50/40 via-white to-white dark:from-slate-900 dark:to-slate-900">
        <div className="space-y-5 text-right">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${currentStreak > 0 ? "bg-amber-500 text-white shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-black text-sm text-slate-900 dark:text-slate-100">
                  بەردەوامیی فێربوونی ڕۆژانە (Daily Learning Streak)
                </h3>
                <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                  ڕێژەی ڕۆژە لەسەریەکەکان لە تەواوکردنی ئەرک و ڕاهێنانەکانی زانا
                </p>
              </div>
            </div>

            {isCompletedToday ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ئەرکی ئەمڕۆ تەواوکراوە
              </span>
            ) : isAtRisk ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <Clock className="w-3.5 h-3.5" />
                ئەمڕۆ چالاک بە!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                ئامادەی دەستپێکردن
              </span>
            )}
          </div>

          {/* Big Streak Numbers */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60 text-center">
              <span className="block font-sans text-[11px] font-bold text-slate-400 dark:text-slate-400 mb-0.5">
                بەردەوامیی ئێستا
              </span>
              <div className="flex items-center justify-center gap-1">
                <Flame className={`w-5 h-5 ${currentStreak > 0 ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                <span className="font-sans font-black text-2xl text-slate-900 dark:text-white">
                  {currentStreak}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">ڕۆژ لەسەریەک</span>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60 text-center">
              <span className="block font-sans text-[11px] font-bold text-slate-400 dark:text-slate-400 mb-0.5">
                بەرزترین بەردەوامی
              </span>
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-sans font-black text-2xl text-slate-900 dark:text-white">
                  {longestStreak}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">ڕۆژی تەواو</span>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60 text-center">
              <span className="block font-sans text-[11px] font-bold text-slate-400 dark:text-slate-400 mb-0.5">
                کۆی ئەرکەکان
              </span>
              <div className="flex items-center justify-center gap-1">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span className="font-sans font-black text-2xl text-slate-900 dark:text-white">
                  {totalTasksCompleted}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">ئەرکی تەواوکراو</span>
            </div>
          </div>

          {/* Mini 7-Day Visual Calendar */}
          <div className="bg-white dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="font-sans text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                چالاکیی حەوت ڕۆژی ڕابردوو
              </span>
              <span className="font-sans text-[10px] text-slate-400">
                {isCompletedToday ? "ئەمڕۆ چالاک بوویت" : "ئەرکی ئەمڕۆ ماوە"}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center pt-1">
              {past7Days.map((d) => (
                <div key={d.dateStr} className="flex flex-col items-center gap-1.5">
                  <span className={`text-[10px] font-bold ${d.isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                    {d.dayNameKu.slice(0, 3)}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      d.isCompleted
                        ? "bg-amber-500 text-white shadow-xs font-black text-xs"
                        : d.isToday
                        ? "border-2 border-dashed border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600"
                        : "bg-slate-100 dark:bg-slate-700/50 text-slate-300 dark:text-slate-600"
                    }`}
                  >
                    {d.isCompleted ? (
                      <Flame className="w-4 h-4 fill-white text-white" />
                    ) : (
                      <span className="text-[10px]">{d.dateStr.slice(-2)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complete Today Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              {isCompletedToday ? (
                <p className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  دەستخۆش! ئەمڕۆ بەردەوامییەکەت پارێزراوە. سبەی بگەڕێوە بۆ بەردەوامیدان.
                </p>
              ) : (
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  تەواوکردنی هەر ڕاهێنانێک یان ئەرکێکی فێربوون بەردەوامیی ڕۆژانەت دەپارێزێت.
                </p>
              )}
            </div>

            {onCompleteTask && (
              <ZanaButton
                onClick={handleMarkTask}
                variant={isCompletedToday ? "secondary" : "primary"}
                disabled={isSubmitting || isLoading}
                className="text-xs py-2 px-4 whitespace-nowrap mr-auto"
              >
                {isSubmitting ? "تۆمارکردن..." : isCompletedToday ? "تۆمارکردنی ئەرکێکی تر" : "ئەرکی ئەمڕۆ وەک تەواوکراو تۆمار بکە"}
              </ZanaButton>
            )}
          </div>

          {/* Toggle History details */}
          {streakHistory.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="font-sans text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1"
              >
                <span>مێژووی ڕۆژە چالاکەکان ({streakHistory.length} ڕۆژ)</span>
                {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showHistory && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  {streakHistory.map((hDate) => (
                    <span
                      key={hDate}
                      className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-[10px] font-mono text-slate-600 dark:text-slate-300"
                    >
                      {hDate}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ZanaCard>

      {/* 2. ACHIEVEMENT BADGES SYSTEM SECTION */}
      <ZanaCard className="border-indigo-150 dark:border-indigo-950 bg-slate-50/20 dark:bg-slate-900">
        <div className="space-y-4 text-right">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-black text-sm text-slate-900 dark:text-slate-100">
                  نیشانە و دەستکەوتەکانی فێربوون (Achievement Badges)
                </h3>
                <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                  پاداشتی دەستکەوتە زانستییەکان وەک 'شارەزای کیمیا' و 'پێشەنگی باڵا'
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {unlockedCount} لە {badges.length} بەدەستهاتووە
              </span>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
            >
              هەموو ({badges.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unlocked")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === "unlocked"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
            >
              بەدەستهێنراو ({unlockedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("locked")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === "locked"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
            >
              قوفڵکراو ({badges.length - unlockedCount})
            </button>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {filteredBadges.map((badge) => {
              const percent = Math.min(100, Math.round((badge.progress.current / badge.progress.target) * 100));

              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all text-right space-y-3 relative ${
                    badge.isUnlocked
                      ? "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:shadow-sm"
                      : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:border-slate-300 opacity-80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {renderBadgeIcon(badge.icon, badge.tier, badge.isUnlocked)}

                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-sans font-black text-xs text-slate-900 dark:text-white">
                          {badge.titleKu}
                        </h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          badge.isUnlocked
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                        }`}>
                          {badge.isUnlocked ? "بەدەستهێنراوە" : getTierBadgeText(badge.tier)}
                        </span>
                      </div>
                      <span className="font-sans text-[10px] text-slate-400 block font-medium">
                        {badge.titleEn}
                      </span>
                      <p className="font-sans text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 pt-1 leading-relaxed">
                        {badge.descriptionKu}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-sans text-slate-500 dark:text-slate-400">
                      <span>{badge.progress.labelKu || `${badge.progress.current} / ${badge.progress.target}`}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          badge.isUnlocked ? "bg-emerald-500" : "bg-indigo-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBadges.length === 0 && (
            <div className="text-center py-8 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="font-sans text-xs text-slate-400">هیچ نیشانەیەک لەم بەشەدا نییە.</p>
            </div>
          )}
        </div>
      </ZanaCard>

      {/* Detail Modal for Selected Badge */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-right shadow-xl"
            onClick={(e) => e.stopPropagation()}
            style={{ direction: "rtl" }}
          >
            <div className="flex items-center gap-3">
              {renderBadgeIcon(selectedBadge.icon, selectedBadge.tier, selectedBadge.isUnlocked)}
              <div className="space-y-0.5">
                <h3 className="font-sans font-black text-base text-slate-900 dark:text-white">
                  {selectedBadge.titleKu}
                </h3>
                <span className="font-sans text-xs text-indigo-600 dark:text-indigo-400 font-semibold block">
                  {selectedBadge.titleEn}
                </span>
              </div>
            </div>

            <div className="space-y-2 py-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>{selectedBadge.descriptionKu}</p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-1">
                <span className="font-bold block text-slate-700 dark:text-slate-200">ئاستی بەدەستهێنان:</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedBadge.progress.labelKu || `${selectedBadge.progress.current} لە ${selectedBadge.progress.target}`}
                </p>
                {selectedBadge.unlockedAt && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    بەدەستهات لە: {selectedBadge.unlockedAt.split("T")[0]}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <ZanaButton variant="secondary" onClick={() => setSelectedBadge(null)} className="text-xs px-4 py-2">
                داخستن
              </ZanaButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
