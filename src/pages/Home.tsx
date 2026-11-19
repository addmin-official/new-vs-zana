import { useState, useMemo } from "react";
import {
  Flame,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Trophy,
  Calendar,
  Clock,
  Compass,
  GraduationCap,
} from "lucide-react";
import { StudentProfile, SubjectKey } from "../features/student/studentTypes.ts";
import { useStudentProfile } from "../features/student/useStudentProfile.ts";
import { useAppStore } from "../store/appStore.ts";
import { getSessionRecovery, getSubjectKurdishName } from "../auth/sessionRecovery.ts";
import { getSubjectCustomIcon } from "../components/SubjectCard.tsx";
import { formatNumber } from "../i18n/i18n.ts";

export interface HomeProps {
  profile?: StudentProfile;
  onNavigateToChat?: (subject?: string) => void;
  onNavigateToSubjects?: () => void;
  onNavigateToPlan?: () => void;
  onNavigateToAssessment?: () => void;
  onNavigateToPractice?: () => void;
  onNavigateToPedagogy?: () => void;
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
  onNavigateToPedagogy,
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

  // Today's 3 tasks state
  const [tasks, setTasks] = useState<TodayTask[]>([
    {
      id: "t1",
      subjectKey: "chemistry",
      subjectName: "کیمیا",
      conceptName: "پێوەری pH و ترشێتی گیراوەکان",
      estimatedMinutes: 15,
      completed: true,
    },
    {
      id: "t2",
      subjectKey: "physics",
      subjectName: "فیزیا",
      conceptName: "یاسای دووەمی نیوتن و هێز",
      estimatedMinutes: 20,
      completed: true,
    },
    {
      id: "t3",
      subjectKey: "math",
      subjectName: "بیرکاری",
      conceptName: "شیکارکردنی سیستەمی هاوکێشەی هێڵی",
      estimatedMinutes: 20,
      completed: false,
    },
  ]);

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const totalTasksCount = tasks.length;
  const goalPercentage = Math.round((completedTasksCount / totalTasksCount) * 100);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  // Available subjects for quick access
  const quickSubjects: { key: SubjectKey; title: string; mastery: number }[] = [
    { key: "chemistry", title: "کیمیا", mastery: 78 },
    { key: "physics", title: "فیزیا", mastery: 64 },
    { key: "math", title: "بیرکاری", mastery: 82 },
    { key: "biology", title: "زیندەزانی", mastery: 55 },
    { key: "english", title: "ئینگلیزی", mastery: 90 },
    { key: "kurdish", title: "کوردی", mastery: 88 },
    { key: "arabic", title: "عەرەبی", mastery: 70 },
  ];

  // Most recent achievement
  const recentAchievement = {
    title: "شارەزای پێوەری pH",
    description: "تەواوکردنی ٥ پرسیاری تاقیکردنەوە بەبێ هەڵە",
    icon: "🏆",
    date: "ئەمڕۆ",
  };

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
                  <span className="font-bold font-mono">%{formatNumber(72)}</span>
                </div>
                <div
                  className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={72}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`ئاستی تێگەیشتن لە ${lastConceptName}`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-amber-300 to-emerald-400 rounded-full animate-progress-fill"
                    style={{ width: "72%" }}
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
      {/* SECTION: PEDAGOGICAL EXCELLENCE HUB (5 GOLDEN PILLARS)         */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {onNavigateToPedagogy && (
        <section aria-labelledby="pedagogy-hub-title" className="space-y-3">
          <div className="p-5 rounded-3xl bg-gradient-to-l from-indigo-900 via-slate-900 to-indigo-950 text-white border border-indigo-800/60 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 text-indigo-400" aria-hidden="true" />
              </div>
              <div className="space-y-1 text-right">
                <div className="flex items-center gap-2">
                  <h2 id="pedagogy-hub-title" className="font-sans font-black text-base text-white">
                    تاقیگەی نایابی پێداگۆجی (٥ پایەی زێڕینی فێربوون)
                  </h2>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/70 border border-amber-700/60 px-2 py-0.5 rounded-full">
                    پۆلی ٩ - ١٢
                  </span>
                </div>
                <p className="font-sans text-xs text-indigo-200/90 leading-relaxed max-w-xl">
                  ستۆدیۆی فاینمان، دەستنیشانی مێتاکۆگنیتیڤ، ماتریکسی لایتنەر، دیبەیتی سۆکراتی، و هاوشێوەکاری تاقیکردنەوەی وەزاری سۆما.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigateToPedagogy}
              className="w-full md:w-auto px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:scale-97 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-indigo-300 touch-manipulation"
              aria-label="کردنەوەی تاقیگەی نایابی پێداگۆجی"
            >
              <span>چوونە تاقیگەی پێداگۆجی</span>
              <ArrowLeft className="w-4 h-4 -rotate-180" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

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
