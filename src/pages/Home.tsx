import { useState, useMemo, useEffect } from "react";
import {
  Flame,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Trophy,
  Calendar,
  Clock,
  Compass,
  Brain,
  Activity,
  Swords,
  FileSpreadsheet,
  Dumbbell,
  FlaskConical,
  Target,
  Users,
  FileBarChart2,
} from "lucide-react";
import { StudentProfile, SubjectKey } from "../features/student/studentTypes.ts";
import { useStudentProfile } from "../features/student/useStudentProfile.ts";
import { useAppStore } from "../store/appStore.ts";
import { getSessionRecovery, getSubjectKurdishName } from "../auth/sessionRecovery.ts";
import { getSubjectCustomIcon } from "../components/SubjectCard.tsx";
import { formatNumber } from "../i18n/i18n.ts";
import type { PedagogyPillarTab } from "../screens/PedagogicalHubScreen.tsx";
import { useStudentMastery } from "../hooks/useStudentMastery.ts";
import { NextBestActionEngine } from "../planning/engine/NextBestActionEngine.ts";
import type { NextBestAction } from "../planning/domain/LearningPlanTypes.ts";
import { DifficultyLevel } from "../learning/domain/MasteryTypes.ts";

export interface HomeProps {
  profile?: StudentProfile;
  onNavigateToChat?: (subject?: string) => void;
  onNavigateToSubjects?: () => void;
  onNavigateToPlan?: () => void;
  onNavigateToAssessment?: () => void;
  onNavigateToPractice?: () => void;
  onNavigateToPedagogy?: (pillar?: PedagogyPillarTab) => void;
  onNavigateToLabs?: () => void;
  onNavigateToRooms?: () => void;
  onNavigateToReport?: () => void;
}

interface TodayTask {
  id: string;
  subjectKey: SubjectKey;
  subjectName: string;
  conceptName: string;
  estimatedMinutes: number;
  completed: boolean;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "بەیانی باش";
  if (hour >= 12 && hour < 17) return "ڕۆژ باش";
  return "شەو باش";
}

export function Home({
  profile: propProfile,
  onNavigateToChat,
  onNavigateToSubjects,
  onNavigateToPlan,
  onNavigateToAssessment,
  onNavigateToPractice,
  onNavigateToPedagogy,
  onNavigateToLabs,
  onNavigateToRooms,
  onNavigateToReport,
}: HomeProps) {
  const { profile: hookProfile } = useStudentProfile();
  const studentProfile = propProfile || hookProfile;
  const user = useAppStore((state) => state.user);

  const studentName = studentProfile?.name || user.name || "قوتابی";
  const streak = studentProfile?.streakDays ?? user.streakDays ?? 7;
  const isHighStreak = streak >= 7;

  // Last studied subject & concept from session recovery
  const sessionRecovery = useMemo(() => getSessionRecovery(), []);
  const activeSubjectKey =
    sessionRecovery?.lastSubject ||
    studentProfile?.activeSubject ||
    user.activeSubject ||
    "chemistry";
  const lastConceptName =
    sessionRecovery?.lastConcept || "ترش و تفتەکان و پێوەری pH";
  const lastSubjectTitle = getSubjectKurdishName(activeSubjectKey);

  // Real student mastery from server / Firestore
  const { data: masteryData } = useStudentMastery(user.id, activeSubjectKey);
  const currentMasteryPercentage =
    masteryData?.overallScore !== undefined
      ? Math.round(masteryData.overallScore * 100)
      : 0;

  // Real Next Best Action calculation
  const [nba, setNba] = useState<NextBestAction | null>(null);

  useEffect(() => {
    const rawConcepts = masteryData?.concepts || {};
    const conceptMasteries: Record<string, {
      conceptId: string;
      masteryScore: number;
      status: "NOT_STARTED" | "INTRODUCED" | "DEVELOPING" | "PROFICIENT" | "MASTERED" | "NEEDS_REVIEW";
      consecutiveCorrect: number;
      totalAttempts: number;
      lastAttemptedAt: string | null;
      history: { isCorrect: boolean; timestamp: string; responseTimeMs: number; difficulty: DifficultyLevel }[];
    }> = {};

    for (const [id, m] of Object.entries(rawConcepts)) {
      conceptMasteries[id] = {
        conceptId: m.conceptId,
        masteryScore: m.masteryScore,
        status: m.status as never,
        consecutiveCorrect: m.consecutiveCorrect,
        totalAttempts: m.totalAttempts,
        lastAttemptedAt: m.lastAttemptedAt,
        history: [],
      };
    }

    const engine = new NextBestActionEngine();
    const action = engine.determineNextBestAction({
      studentMasteryProfile: {
        studentId: user.id || "guest",
        overallMasteryScore: masteryData?.overallScore ?? 0,
        conceptMasteries: conceptMasteries as never,
        activeMisconceptions: [],
        recentRecommendedActions: [],
        streak: {
          currentStreak: streak,
          longestStreak: streak,
          lastCompletedDate: null,
          streakHistory: [],
          totalTasksCompleted: 0,
        },
        unlockedAchievements: [],
      },
    });
    setNba(action);
  }, [user.id, masteryData, streak]);

  // Real Today tasks state (derived from real mastery or honest empty state)
  const [tasks, setTasks] = useState<TodayTask[]>([]);

  useEffect(() => {
    if (masteryData?.concepts && Object.keys(masteryData.concepts).length > 0) {
      const realTasks: TodayTask[] = Object.values(masteryData.concepts)
        .slice(0, 3)
        .map((c, i) => {
          const topicClean = c.conceptId.replace(/^[a-z0-9]+_/, "").replace(/_/g, " ");
          return {
            id: `task_${c.conceptId}_${i}`,
            subjectKey: activeSubjectKey as SubjectKey,
            subjectName: lastSubjectTitle,
            conceptName: topicClean || lastConceptName,
            estimatedMinutes: 15,
            completed: c.status === "PROFICIENT" || c.status === "MASTERED",
          };
        });
      setTasks(realTasks);
    } else {
      setTasks([]);
    }
  }, [masteryData, activeSubjectKey, lastSubjectTitle, lastConceptName]);

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const totalTasksCount = tasks.length;
  const goalPercentage =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  // Real subject access with actual mastery percentages
  const quickSubjects: { key: SubjectKey; title: string; mastery: number }[] = useMemo(() => {
    const base = [
      { key: "chemistry" as SubjectKey, title: "کیمیا" },
      { key: "physics" as SubjectKey, title: "فیزیا" },
      { key: "math" as SubjectKey, title: "بیرکاری" },
      { key: "biology" as SubjectKey, title: "زیندەزانی" },
      { key: "english" as SubjectKey, title: "ئینگلیزی" },
      { key: "kurdish" as SubjectKey, title: "کوردی" },
      { key: "arabic" as SubjectKey, title: "عەرەبی" },
    ];
    return base.map((s) => {
      let score = 0;
      if (s.key === activeSubjectKey && masteryData?.overallScore !== undefined) {
        score = Math.round(masteryData.overallScore * 100);
      }
      return { ...s, mastery: score };
    });
  }, [activeSubjectKey, masteryData]);

  // Real recent achievement or honest empty state
  const recentAchievement = useMemo(() => {
    if (user.completedLessons && user.completedLessons > 0) {
      return {
        title: "وانەبێژی زانا",
        description: `تەواوکردنی ${user.completedLessons} وانەی فەرمی مەنهەج`,
        icon: "🎓",
        date: "ئەم هەفتەیە",
      };
    }
    if (streak >= 3) {
      return {
        title: "بەردەوامی لە فێربوون",
        description: `${streak} ڕۆژ بەردەوامیت لە خوێندن`,
        icon: "🔥",
        date: "ئەمڕۆ",
      };
    }
    return null;
  }, [user.completedLessons, streak]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 select-none" dir="rtl">
      {/* ═════════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — GREETING HEADER & TODAY'S GOAL                   */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans font-black text-xl sm:text-2xl text-slate-900 dark:text-white leading-tight">
              {getTimeGreeting()}، {studentName}! 👋
            </h1>
          </div>
          <p className="font-sans text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            با ئەمڕۆ هەنگاوێکی تر بەرەو نایابی بنێین لە وانەکانت.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Streak Badge with pulse animation if >= 7 days */}
          <div
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-black transition-all ${
              isHighStreak
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 animate-pulse shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>🔥 {formatNumber(streak)} ڕۆژ بەردەوام</span>
          </div>

          {/* Today's Goal Progress Circular Ring */}
          <div
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60"
            role="progressbar"
            aria-valuenow={goalPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`ئامانجی ئەمڕۆ: %${goalPercentage} تەواوکراوە`}
          >
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className="stroke-indigo-100 dark:stroke-indigo-950"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className="stroke-indigo-600 dark:stroke-indigo-400 transition-all duration-500"
                  strokeWidth="3.5"
                  strokeDasharray={88}
                  strokeDashoffset={88 - (goalPercentage / 100) * 88}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[10px] font-black text-indigo-700 dark:text-indigo-300 font-mono" aria-hidden="true">
                %{formatNumber(goalPercentage)}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[11px] font-bold text-indigo-950 dark:text-indigo-200 leading-tight">
                ئامانجی ئەمڕۆ
              </span>
              <span className="block text-[10px] text-indigo-800 dark:text-indigo-300 font-medium">
                {formatNumber(completedTasksCount)} لە {formatNumber(totalTasksCount)} بابەت تەواو کرا
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* SECTION 1B — NEXT BEST ACTION (ADAPTIVE ENGINE RECOMMENDATION) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {nba && (
        <section aria-labelledby="nba-title">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                  هەنگاوی داهاتووی پێشنیارکراو (Next Best Action)
                </span>
              </div>
              <h3 id="nba-title" className="font-sans font-bold text-base text-slate-900 dark:text-white mt-1">
                {nba.titleKu}
              </h3>
              <p className="font-sans text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {nba.reasonKu}
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onNavigateToAssessment && nba.actionType === "TAKE_DIAGNOSTIC" && (
                <button
                  type="button"
                  onClick={onNavigateToAssessment}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>تاقیکردنەوە ئەنجام بدە</span>
                </button>
              )}
              {onNavigateToPractice && (nba.actionType === "PRACTICE_EASY" || nba.actionType === "REVIEW_MISCONCEPTION") && (
                <button
                  type="button"
                  onClick={onNavigateToPractice}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>دەستپێکردنی ڕاهێنان</span>
                </button>
              )}
              {onNavigateToChat && nba.actionType !== "TAKE_DIAGNOSTIC" && (
                <button
                  type="button"
                  onClick={() => onNavigateToChat(activeSubjectKey)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>وانە لەگەڵ زانا</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* SECTION 2 — CONTINUE LEARNING (THE ONE PRIMARY ACTION)        */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="continue-learning-title">
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white shadow-xl shadow-indigo-600/20 card-interactive">
          {/* Decorative ambient blurred highlights */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-indigo-100 text-xs font-bold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                <span>دواین وانەی خوێندراو</span>
              </div>

              <div>
                <h2
                  id="continue-learning-title"
                  className="font-sans font-black text-2xl sm:text-3xl text-white tracking-tight"
                >
                  {lastSubjectTitle}: {lastConceptName}
                </h2>
                <p className="font-sans text-xs sm:text-sm text-indigo-100 mt-1.5 leading-relaxed">
                  ڕاستەوخۆ دەست پێبکەرەوە لەو شوێنەی کە لێی وەستابوویت لەگەڵ مامۆستا زانا.
                </p>
              </div>

              {/* Concept Mastery Progress */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-indigo-200">
                  <span>ئاستی تێگەیشتن لە چەمک</span>
                  <span className="font-bold font-mono">%{formatNumber(currentMasteryPercentage)}</span>
                </div>
                <div
                  className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={currentMasteryPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`ئاستی تێگەیشتن لە ${lastConceptName}`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-amber-300 to-emerald-400 rounded-full animate-progress-fill"
                    style={{ width: `${currentMasteryPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* THE SINGLE PRIMARY CTA BUTTON FOR THE PAGE (52px tap target) */}
            <button
              type="button"
              onClick={() => onNavigateToChat?.(activeSubjectKey)}
              aria-label={`بەردەوام بە لە خوێندنی ${lastSubjectTitle}، چەمکی ${lastConceptName}`}
              className="w-full md:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-97 text-indigo-900 font-black text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 shrink-0 cursor-pointer min-h-[52px] focus-visible:ring-3 focus-visible:ring-white touch-manipulation"
            >
              <span>بەردەوام بە</span>
              <ArrowLeft className="w-5 h-5 -rotate-180" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* SECTION 3 — TODAY'S PLAN (MAX 3 CARDS WITH EMPTY STATE)       */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="today-plan-title" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <h2 id="today-plan-title" className="font-sans font-black text-lg text-slate-900 dark:text-white">
              ئەرکەکانی ئەمڕۆ
            </h2>
          </div>
          {onNavigateToPlan && (
            <button
              type="button"
              onClick={onNavigateToPlan}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer min-h-[36px] py-1 px-2 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg flex items-center"
              aria-label="بینینی پلانی خوێندنی تەواوی هەفتە"
            >
              پلانی تەواو ببینە ←
            </button>
          )}
        </div>

        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                role="checkbox"
                aria-checked={task.completed}
                aria-label={`ئەرکی ${task.subjectName}، ${task.conceptName}، ${task.estimatedMinutes} خولەک، ${task.completed ? "تەواوکراوە" : "تەواونەکراوە"}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleTask(task.id);
                  }
                }}
                className={`card-interactive p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[128px] focus-visible:ring-3 focus-visible:ring-indigo-500 touch-manipulation ${
                  task.completed
                    ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/70"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600"
                }`}
              >
                <div className="flex items-start justify-between gap-2 pointer-events-none">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {getSubjectCustomIcon(task.subjectKey, "w-5 h-5")}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      task.completed
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "border-2 border-slate-400 dark:border-slate-600"
                    }`}
                  >
                    {task.completed && <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
                  </div>
                </div>

                <div className="mt-2 pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                    {task.subjectName}
                  </span>
                  <h3
                    className={`font-sans font-bold text-xs mt-0.5 line-clamp-2 ${
                      task.completed
                        ? "text-slate-500 dark:text-slate-400 line-through"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {task.conceptName}
                  </h3>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-2 pointer-events-none">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{formatNumber(task.estimatedMinutes)} خولەک</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state for Study Plan */
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto" aria-hidden="true">
              <Compass className="w-6 h-6" />
            </div>
            <p className="font-sans font-bold text-sm text-slate-800 dark:text-slate-200">
              هێشتا پلانت نییە — با دروستی بکەین! ✨
            </p>
            {onNavigateToPlan && (
              <button
                type="button"
                onClick={onNavigateToPlan}
                className="px-5 py-3 min-h-[48px] rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-97 text-white font-bold text-xs shadow-xs cursor-pointer focus-visible:ring-3 focus-visible:ring-indigo-400 touch-manipulation"
                aria-label="دروستکردنی پلانی خوێندنی نوێ"
              >
                پلان دروست بکە
              </button>
            )}
          </div>
        )}
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* SECTION 4 — QUICK SUBJECT ACCESS (HORIZONTAL SCROLL)          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="quick-subjects-title" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="quick-subjects-title" className="font-sans font-black text-lg text-slate-900 dark:text-white">
            وانەکانی خوێندن
          </h2>
          {onNavigateToSubjects && (
            <button
              type="button"
              onClick={onNavigateToSubjects}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer min-h-[36px] py-1 px-2 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg flex items-center"
              aria-label="بینینی هەموو وانەکانی مەنهەج"
            >
              هەموو وانەکان ببینە ←
            </button>
          )}
        </div>

        <div
          role="region"
          aria-label="لیستی ئاسانی وانەکان بۆ گفتوگۆی ڕاستەوخۆ"
          tabIndex={0}
          className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
        >
          {quickSubjects.map((subj) => (
            <button
              key={subj.key}
              type="button"
              onClick={() => onNavigateToChat?.(subj.key)}
              aria-label={`وانەی ${subj.title}، ئاستی زاڵبوون %${subj.mastery}`}
              className="card-interactive shrink-0 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all text-right flex flex-col justify-between w-36 h-36 cursor-pointer touch-manipulation focus-visible:ring-3 focus-visible:ring-indigo-500"
            >
              <div className="flex items-center justify-between pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                  {getSubjectCustomIcon(subj.key, "w-5 h-5")}
                </div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  %{formatNumber(subj.mastery)}
                </span>
              </div>

              <div className="pointer-events-none">
                <span className="font-sans font-black text-sm text-slate-900 dark:text-white block">
                  {subj.title}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">گفتوگۆ لەگەڵ زانا</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* SECTION 4B — PEDAGOGICAL EXCELLENCE HUB (5 PILLARS)           */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {onNavigateToPedagogy && (
        <section aria-labelledby="pedagogy-hub-title" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 id="pedagogy-hub-title" className="font-sans font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>تاقیگەی نایابی پێداگۆجی (٥ پایەی فێربوون)</span>
              </h2>
              <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                فێربوونی قووڵ و ئامادەکاری وەزاری بە ڕێبازە زانستییەکان بۆ پۆلەکانی ٩ تا ١٢
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToPedagogy()}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer min-h-[36px] py-1 px-2 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg flex items-center shrink-0"
            >
              کردنەوەی تاقیگە ←
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {
                id: "feynman" as PedagogyPillarTab,
                title: "ستۆدیۆی فاینمان",
                desc: "فێربوون بە فێرکردنی زانا بە سادەیی",
                icon: Sparkles,
                iconBg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400",
                borderHover: "hover:border-indigo-400 dark:hover:border-indigo-500",
              },
              {
                id: "metacognitive" as PedagogyPillarTab,
                title: "ڕاداری هەڵەکان",
                desc: "شیکاریی مێتاکۆگنیتیڤی DNAی هەڵە",
                icon: Activity,
                iconBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400",
                borderHover: "hover:border-rose-400 dark:hover:border-rose-500",
              },
              {
                id: "leitner" as PedagogyPillarTab,
                title: "ماتریکسی لایتنەر",
                desc: "بیرگەی درێژخایەن (١ تا ٣٥ ڕۆژ)",
                icon: Brain,
                iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
                borderHover: "hover:border-emerald-400 dark:hover:border-emerald-500",
              },
              {
                id: "dialectic" as PedagogyPillarTab,
                title: "مەیدانی دیبەیت",
                desc: "بەڵگاندنی سۆکراتی و هەڵوەشاندنەوەی هەڵە",
                icon: Swords,
                iconBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
                borderHover: "hover:border-amber-400 dark:hover:border-amber-500",
              },
              {
                id: "soma" as PedagogyPillarTab,
                title: "هاوشێوەکاری سۆما",
                desc: "پەڕەی سۆمای وەزاری + هەناسەی ٤-٧-٨",
                icon: FileSpreadsheet,
                iconBg: "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400",
                borderHover: "hover:border-teal-400 dark:hover:border-teal-500",
              },
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => onNavigateToPedagogy(pillar.id)}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${pillar.borderHover} hover:shadow-md transition-all text-right flex flex-col justify-between gap-3 cursor-pointer touch-manipulation focus-visible:ring-3 focus-visible:ring-indigo-500`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pillar.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {pillar.title}
                    </h3>
                    <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* SECTION 4C — CORE STUDY TOOLS & ROOMS                         */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="study-tools-title" className="space-y-3">
        <h2 id="study-tools-title" className="font-sans font-black text-lg text-slate-900 dark:text-white">
          تاقیگە و ئامرازە فێرکارییەکان
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {onNavigateToPractice && (
            <button
              type="button"
              onClick={onNavigateToPractice}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm transition-all text-right flex items-start gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <span className="font-sans font-bold text-xs text-slate-900 dark:text-white block">
                  تاقیگەی ڕاهێنان
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  پرسیاری وەزاری و مەشق
                </span>
              </div>
            </button>
          )}

          {onNavigateToLabs && (
            <button
              type="button"
              onClick={onNavigateToLabs}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-sm transition-all text-right flex items-start gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <span className="font-sans font-bold text-xs text-slate-900 dark:text-white block">
                  تاقیگەی زانستی
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  سیمولەیشنی کیمیا و فیزیا
                </span>
              </div>
            </button>
          )}

          {onNavigateToAssessment && (
            <button
              type="button"
              onClick={onNavigateToAssessment}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-sm transition-all text-right flex items-start gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className="font-sans font-bold text-xs text-slate-900 dark:text-white block">
                  تاقیکردنەوەی ئەداپتیڤ
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  پێوانەکردنی ئاستی لێهاتوویی
                </span>
              </div>
            </button>
          )}

          {onNavigateToRooms && (
            <button
              type="button"
              onClick={onNavigateToRooms}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm transition-all text-right flex items-start gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="font-sans font-bold text-xs text-slate-900 dark:text-white block">
                  ژوورەکانی خوێندن
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  پۆمۆدۆرۆ و دەنگی تەرکیز
                </span>
              </div>
            </button>
          )}

          {onNavigateToReport && (
            <button
              type="button"
              onClick={onNavigateToReport}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-sm transition-all text-right flex items-start gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileBarChart2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-sans font-bold text-xs text-slate-900 dark:text-white block">
                  ڕاپۆرتی باوان
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  پوختەی پێشکەوتنی هەفتانە
                </span>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* SECTION 5 — RECENT ACHIEVEMENT (SINGLE CARD)                  */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="achievement-title" className="space-y-2">
        <h2 id="achievement-title" className="font-sans font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          تازەترین دەستکەوت
        </h2>

        {recentAchievement ? (
          <div
            className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border border-amber-200/90 dark:border-amber-800/50 flex items-center justify-between gap-4 shadow-xs animate-confetti-pop"
            role="status"
            aria-label={`تازەترین دەستکەوت: ${recentAchievement.title}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0" aria-hidden="true">
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-sans font-black text-sm text-slate-900 dark:text-white">
                  تازەترین دەستکەوت: {recentAchievement.title}
                </h3>
                <p className="font-sans text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {recentAchievement.description}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">
              {recentAchievement.date}
            </span>
          </div>
        ) : (
          /* Empty state for Achievements */
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            دەستکەوتەکانت لێرە دەردەکەون
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
