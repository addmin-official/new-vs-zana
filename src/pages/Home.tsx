import React, { useState } from "react";
import {
  Flame,
  BookOpen,
  Award,
  Sparkles,
  ArrowLeft,
  Atom,
  Zap,
  Dna,
  Clock,
  CheckCircle2,
  Lock,
  GraduationCap,
  Swords,
  FileSpreadsheet,
  Brain,
  Activity,
} from "lucide-react";
import { useAppStore } from "../store/appStore.ts";
import { ku } from "../i18n/translations.ts";
import { Modal } from "../components/Modal.tsx";
import { useDailySpark } from "../features/dailySpark/useDailySpark.ts";
import { useStudentProfile } from "../features/student/useStudentProfile.ts";
import { useStudentMastery } from "../learning/hooks/useStudentMastery.ts";
import { StudentProfile } from "../features/student/studentTypes.ts";
import { MicroRetrievalFlashCard } from "../features/pedagogy/leitner/MicroRetrievalFlashCard.tsx";
import { PedagogyHubModal, ActivePedagogyStudio } from "../features/pedagogy/PedagogyHubModal.tsx";

export const SUBJECT_HOME_METADATA: Record<string, { label: string; icon: string }> = {
  chemistry: { label: "کیمیا", icon: "⚗️" },
  physics: { label: "فیزیا", icon: "⚡" },
  math: { label: "بیرکاری", icon: "📐" },
  biology: { label: "زیندەزانی", icon: "🧬" },
  english: { label: "ئینگلیزی", icon: "📖" },
  kurdish: { label: "زمان و ئەدەبی کوردی", icon: "📚" },
  arabic: { label: "زمانی عەرەبی", icon: "📜" },
  sports: { label: "پەروەردەی وەرزشی", icon: "⚽" },
  history: { label: "مێژوو", icon: "🏛️" },
  economy: { label: "ئابووری", icon: "📊" },
  geography: { label: "جوگرافیا", icon: "🌍" },
};

export interface HomeProps {
  profile?: StudentProfile;
  onNavigateToChat?: (subject?: string) => void;
  onNavigateToSubjects?: () => void;
  onNavigateToAssessment?: () => void;
  onNavigateToPractice?: () => void;
  onNavigateToPedagogy?: () => void;
}

export function Home({
  profile: propProfile,
  onNavigateToChat,
  onNavigateToSubjects,
  onNavigateToAssessment,
  onNavigateToPedagogy,
}: HomeProps) {
  const { profile: hookProfile } = useStudentProfile();
  const studentProfile = propProfile || hookProfile;
  const user = useAppStore((state) => state.user);
  const userProgress = useAppStore((state) => state.userProgress);

  const { snapshot } = useDailySpark();
  const { streakStatus, profile: masteryProfile } = useStudentMastery(studentProfile?.id || "default-guest");

  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [conceptExpanded, setConceptExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPedagogyModalOpen, setIsPedagogyModalOpen] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState<ActivePedagogyStudio>(null);

  const openStudio = (studio: ActivePedagogyStudio) => {
    setSelectedStudio(studio);
    setIsPedagogyModalOpen(true);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const studentName = studentProfile?.name || user.name || "قوتابی";
  const studentGrade = studentProfile?.grade || user.grade || "12";
  const studentLevel = studentProfile?.level || "intermediate";

  const levelLabel =
    studentLevel === "advanced"
      ? "ئاستی پێشکەوتوو و باڵا"
      : studentLevel === "beginner"
      ? "ئاستی سەرەتایی"
      : "ئاستی مامناوەند";

  // Real progress metrics from Firestore, daily spark, and app store
  const todayMinutes =
    snapshot?.progressSummary?.todayStudyMinutes ??
    (studentProfile?.todayStudyMinutes ?? 0);
  const streakDays =
    snapshot?.progressSummary?.currentStreakDays ??
    (userProgress.streak > 0 ? userProgress.streak : (studentProfile?.streak || streakStatus?.activeStreak || 1));
  const completionPercentage =
    snapshot?.progressSummary?.completionPercentage ??
    (masteryProfile?.overallMasteryScore
      ? Math.round(masteryProfile.overallMasteryScore * 100)
      : (studentProfile?.completionPercentage || 0));
  const totalScore = userProgress.totalScore || studentProfile?.totalScore || 0;
  const lessonsCompleted = userProgress.lessonsCompleted || studentProfile?.completedLessons || 0;

  const badges = [
    { id: "streak-3", name: "ئاگری فێربوون", desc: "٣ ڕۆژ خوێندنی بەردەوام", icon: "🔥", unlocked: streakDays >= 3 },
    { id: "first-lab", name: "زانای تاقیگە", desc: "ئەنجامدانی یەکەم تاقیکردنەوەی مەجازی", icon: "🧪", unlocked: lessonsCompleted >= 1 },
    { id: "quiz-ace", name: "پاڵەوانی پرسیار", desc: "وەڵامدانەوەی ١٠ پرسیار بە بێ هەڵە", icon: "⭐", unlocked: totalScore >= 100 },
    { id: "chem-master", name: "پسپۆڕی ترش و تفت", desc: "تەواوکردنی بەندی ترش و تفتەکان", icon: "⚗️", unlocked: completionPercentage >= 50 },
    { id: "math-solver", name: "شیکارکەری ئەندازە", desc: "شیکارکردنی ٢٠ هاوکێشەی جەبری", icon: "📐", unlocked: false },
  ];

  const activeSubjKey = (studentProfile?.activeSubject || user.activeSubject || "chemistry").toLowerCase();
  const activeSubjectMeta = SUBJECT_HOME_METADATA[activeSubjKey] || {
    label: activeSubjKey,
    icon: "📚",
  };

  const isLiterary = user.stream === "literary";
  const subjects = isLiterary
    ? [
        { id: "kurdish", title: "زمان و ئەدەبی کوردی", icon: <BookOpen className="w-5 h-5 text-indigo-600" />, progress: activeSubjKey === "kurdish" ? completionPercentage : 0, lastStudied: activeSubjKey === "kurdish" && todayMinutes > 0 ? `${todayMinutes} خولەک لەمەوبەر` : "تەواونەکراو" },
        { id: "history", title: "مێژووی پۆلی ١٢", icon: <BookOpen className="w-5 h-5 text-amber-600" />, progress: activeSubjKey === "history" ? completionPercentage : 0, lastStudied: "دەستپێنەکراو" },
        { id: "economy", title: "ئابووریی پۆلی ١٢", icon: <Brain className="w-5 h-5 text-emerald-600" />, progress: activeSubjKey === "economy" ? completionPercentage : 0, lastStudied: "دەستپێنەکراو" },
        { id: "geography", title: "جوگرافیای پۆلی ١٢", icon: <Sparkles className="w-5 h-5 text-cyan-600" />, progress: activeSubjKey === "geography" ? completionPercentage : 0, lastStudied: "دەستپێنەکراو" },
        { id: "math", title: "بیرکاری وێژەیی", icon: <Brain className="w-5 h-5 text-blue-600" />, progress: activeSubjKey === "math" ? completionPercentage : 0, lastStudied: "دەستپێنەکراو" },
        { id: "arabic", title: "زمانی عەرەبی", icon: <BookOpen className="w-5 h-5 text-rose-600" />, progress: activeSubjKey === "arabic" ? completionPercentage : 0, lastStudied: "دەستپێنەکراو" },
        { id: "english", title: "ئینگلیزی (Sunrise 12)", icon: <Sparkles className="w-5 h-5 text-purple-600" />, progress: activeSubjKey === "english" ? completionPercentage : 0, lastStudied: "دەستپێنەکراو" },
      ]
    : [
        { id: "math", title: `بیرکاری پۆلی ${studentGrade}`, icon: <Brain className="w-5 h-5 text-blue-600" />, progress: activeSubjKey === "math" ? completionPercentage : 0, lastStudied: "دەستپێنەکراو" },
        { id: "physics", title: `فیزیای پۆلی ${studentGrade}`, icon: <Zap className="w-5 h-5 text-amber-500" />, progress: activeSubjKey === "physics" ? completionPercentage : 0, lastStudied: "دەستپێنەکراو" },
        { id: "chemistry", title: `کیمیای پۆلی ${studentGrade}`, icon: <Atom className="w-5 h-5 text-indigo-600" />, progress: activeSubjKey === "chemistry" ? completionPercentage : 0, lastStudied: todayMinutes > 0 ? `${todayMinutes} خولەک لەمەوبەر` : "تەواونەکراو" },
        { id: "biology", title: `زیندەوەرزانی پۆلی ${studentGrade}`, icon: <Dna className="w-5 h-5 text-emerald-600" />, progress: activeSubjKey === "biology" ? completionPercentage : 0, lastStudied: "دەستپێنەکراو" },
        { id: "arabic", title: `زمانی عەرەبی پۆلی ${studentGrade}`, icon: <BookOpen className="w-5 h-5 text-rose-600" />, progress: activeSubjKey === "arabic" ? completionPercentage : 0, lastStudied: "دەستپێنەکراو" },
        { id: "english", title: `ئینگلیزی (Sunrise ${studentGrade})`, icon: <Sparkles className="w-5 h-5 text-purple-600" />, progress: activeSubjKey === "english" ? completionPercentage : 0, lastStudied: "دەستپێنەکراو" },
      ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full" dir="rtl">
      {/* Active Subject Showcase & Quick Switcher Card */}
      <section className="w-full p-4 sm:p-5 bg-gradient-to-r from-indigo-50/90 via-white to-indigo-50/60 rounded-2xl border-2 border-indigo-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-md shadow-indigo-500/20 shrink-0">
            {activeSubjectMeta.icon}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                وانەی ئێستا دیاریکراوە
              </span>
              <span className="text-[11px] text-slate-500 font-sans">
                پۆلی {studentGrade} • {user.stream === "scientific" ? "بەشی زانستی" : "بەشی وێژەیی (لە ماوەی داهاتوو کارا دەبێت ⏳)"}
              </span>
            </div>
            <h2 className="font-sans font-black text-lg text-slate-900">
              {activeSubjectMeta.label}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => onNavigateToChat?.(activeSubjKey)}
            className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>خوێندن لە چات</span>
            <ArrowLeft className="w-4 h-4" />
          </button>

          {onNavigateToSubjects && (
            <button
              onClick={onNavigateToSubjects}
              className="bg-white hover:bg-slate-50 text-indigo-700 font-sans font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-indigo-200 shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>گۆڕینی وانە</span>
              <span className="font-bold">⇄</span>
            </button>
          )}
        </div>
      </section>

      {/* 1. Welcome Greeting Banner */}
      <section className="w-full p-6 sm:p-8 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 rounded-2xl border border-indigo-100/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/50">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>چروسکەی ڕۆژانەی زانا</span>
          </div>
          <h1 className="font-sans font-black text-2xl sm:text-3xl text-slate-900 leading-tight">
            بەخێربێی {studentName}، ئامادەت بۆ فێربوون؟ 🌟
          </h1>
          <p className="font-sans text-sm sm:text-base text-slate-600 max-w-xl">
            ئەمڕۆ بەردەوام بە لەسەر گەشتەکەت بەرەو لێهاتوویی زانستی و بەدەستهێنانی نمرەی بەرز لە تاقیکردنەوە نیشتمانییەکاندا.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            onClick={() => onNavigateToAssessment?.()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-sm px-5 py-3 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>تاقیکردنەوەی خێرا (٥ پرسیار)</span>
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigateToChat?.(activeSubjKey)}
            className="bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 font-sans font-bold text-sm px-5 py-3 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>بەردەوام بە لە {activeSubjectMeta.label}</span>
          </button>
        </div>
      </section>

      {/* 2. Top Metric Cards: Streak + Daily Target + Total Score */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Streak Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 font-sans">ڕۆژەکانی بەردەوامی لە خوێندن</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans font-black text-3xl text-slate-900">{streakDays}</span>
              <span className="font-sans text-xs font-bold text-amber-600">ڕۆژ بەردەوام</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">هەنگاوت بەردەوام بکە! 🎯</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Lessons Completed Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 font-sans">{ku.home.lessonsTitle}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans font-black text-3xl text-slate-900">{lessonsCompleted}</span>
              <span className="font-sans text-xs font-bold text-indigo-600">وانە</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">پڕۆگرامی فەرمی پۆلی {studentGrade}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Total Score / XP Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 font-sans">{ku.home.scoreTitle}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans font-black text-3xl text-slate-900">{totalScore.toLocaleString()}</span>
              <span className="font-sans text-xs font-bold text-emerald-600">خاڵی ئەزموون</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">{levelLabel}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* 3. Bento-Grid: 3 compact daily stat cards */}
      <section className="grid grid-cols-3 gap-3">
        {/* Today Study Minutes */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-right flex flex-col justify-between">
          <div>
            <Clock className="w-4 h-4 text-indigo-600 mb-2" />
            <p className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">خوێندنی ئەمڕۆ</p>
          </div>
          <div className="mt-2">
            <span className="font-sans font-black text-xl text-slate-800">{todayMinutes}</span>
            <span className="font-sans text-[10px] text-slate-500 mr-1">خولەک</span>
          </div>
        </div>

        {/* Streak Days */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-right flex flex-col justify-between">
          <div>
            <Flame className="w-4 h-4 text-amber-500 mb-2" />
            <p className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">بەردەوامی</p>
          </div>
          <div className="mt-2">
            <span className="font-sans font-black text-xl text-slate-800">{streakDays}</span>
            <span className="font-sans text-[10px] text-slate-500 mr-1">ڕۆژ</span>
          </div>
        </div>

        {/* Completion % */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-right flex flex-col justify-between">
          <div>
            <BookOpen className="w-4 h-4 text-emerald-600 mb-2" />
            <p className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">کۆی گشتی</p>
          </div>
          <div className="mt-2">
            <span className="font-sans font-black text-xl text-slate-800">{completionPercentage}</span>
            <span className="font-sans text-[10px] text-slate-500 mr-1">%</span>
          </div>
        </div>
      </section>

      {/* 3.1 Spaced-Repetition Leitner Micro-Retrieval Card */}
      <section>
        <MicroRetrievalFlashCard />
      </section>

      {/* 3.2 Advanced Pedagogical Studios Quick Launcher */}
      <section className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/20">
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>ستۆدیۆ پێشکەوتووەکانی زانا (قۆناغەکانی ١ تا ٥)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black">
              ئامرازەکانی فێربوونی قووڵ و ئامادەکاری وەزاری
            </h2>
            <p className="text-xs text-slate-300">
              لە ستۆدیۆی فاینمانەوە تا مەیدانی سۆکراتی و هاوشێوەکاری تاقیکردنەوەی سۆما
            </p>
          </div>

          <button
            onClick={() => {
              if (onNavigateToPedagogy) onNavigateToPedagogy();
              else openStudio(null);
            }}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>بینینی تاقیگەی نایابی پێداگۆجی</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* 5 Studio Quick Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => openStudio('feynman')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-right flex flex-col justify-between transition cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/30 flex items-center justify-center text-indigo-300 mb-2">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-bold block">قۆناغی ١</span>
              <span className="text-xs font-black group-hover:text-indigo-300 transition">ستۆدیۆی فاینمان</span>
            </div>
          </button>

          <button
            onClick={() => openStudio('error_dna')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-right flex flex-col justify-between transition cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-500/30 flex items-center justify-center text-rose-300 mb-2">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-rose-400 font-bold block">قۆناغی ٢</span>
              <span className="text-xs font-black group-hover:text-rose-300 transition">DNAی هەڵەکان</span>
            </div>
          </button>

          <button
            onClick={() => openStudio('leitner')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-right flex flex-col justify-between transition cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300 mb-2">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold block">قۆناغی ٣</span>
              <span className="text-xs font-black group-hover:text-emerald-300 transition">ماتریکسی لایتنەر</span>
            </div>
          </button>

          <button
            onClick={() => openStudio('dialectic')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-right flex flex-col justify-between transition cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-300 mb-2">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-bold block">قۆناغی ٤</span>
              <span className="text-xs font-black group-hover:text-amber-300 transition">دیبەیتی سۆکراتی</span>
            </div>
          </button>

          <button
            onClick={() => openStudio('soma')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-right flex flex-col justify-between transition cursor-pointer group col-span-2 sm:col-span-1"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-500/30 flex items-center justify-center text-teal-300 mb-2">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-teal-400 font-bold block">قۆناغی ٥</span>
              <span className="text-xs font-black group-hover:text-teal-300 transition">تاقیکردنەوەی سۆما</span>
            </div>
          </button>
        </div>
      </section>

      {/* 4. Concept of the Day & AI Next Action Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Concept of the Day */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                چەمکی ڕۆژ 💡
              </span>
              <span className="text-xs text-slate-400 font-sans">کیمیای پۆلی ١٢ • لاپەڕە ٦٤</span>
            </div>
            <h3 className="font-sans font-bold text-lg text-slate-900">
              تیۆری برۆنستد-لۆری بۆ ترش و تفتەکان
            </h3>
            <p className="font-sans text-sm text-slate-600 leading-relaxed">
              بەپێی تیۆری برۆنستد-لۆری، ترش بریتییە لەو ماددەیەی پرۆتۆن (H⁺) دەبەخشێت، و تفت بریتییە لەو ماددەیەی پرۆتۆن وەردەگرێت. جووتە هاوجوت لە هەردوو لاوە دروست دەبێت.
            </p>

            {conceptExpanded && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1 animate-in fade-in">
                <p className="font-bold text-indigo-700">نموونەی فەرمی پڕۆگرامی خوێندن:</p>
                <p className="font-mono text-left dir-ltr">NH₃ + H₂O ⇌ NH₄⁺ + OH⁻</p>
                <p>لێرەدا ئاو وەک ترش ڕەفتار دەکات و OH⁻ تفتی هاوجووتیەتی.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => setConceptExpanded(!conceptExpanded)}
              className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              {conceptExpanded ? "کورتکردنەوە" : "زیاتر بخوێنەوە..."}
            </button>
            <button
              onClick={() => onNavigateToChat?.("chemistry")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              <span>پرسیارکردن لە زانا</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* AI Next Best Action Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-xs">
                ڕاسپاردەی زیرەکی زانا 🤖
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>ماوە: ١٥ خولەک</span>
              </span>
            </div>
            <h3 className="font-sans font-bold text-lg text-white">
              پێداچوونەوەی بەندی کیمیای کارەبایی و ئەلیکترۆکیمیا
            </h3>
            <p className="font-sans text-xs sm:text-sm text-slate-200 leading-relaxed">
              بەپێی دوایین شیکارییەکانت لە تاقیکردنەوەکانی پێشوو، چەند هەڵەیەکی باو لە یاسای نێرنست و ئۆکسان-داڕزاندا تێبینی کراوە. ئەم ڕاهێنانە ئاستت بەرز دەکاتەوە.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-sans">
              بەپێی هەڵسەنگاندنی زیرەکی گونجێنەر
            </span>
            <button
              onClick={() => onNavigateToChat?.("chemistry")}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span>دەستپێکردن</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Badges Carousel Section */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h2 className="font-sans font-bold text-lg text-slate-900">مەدالیاکانی دەستکەوت</h2>
          </div>
          <button
            onClick={() => setShowBadgesModal(true)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            بینینی سەرجەم مەدالیاکان ({badges.length})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all ${
                badge.unlocked
                  ? "bg-indigo-50/50 border-indigo-200 text-slate-800"
                  : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
              }`}
            >
              <div className="text-2xl relative">
                {badge.icon}
                {badge.unlocked ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 absolute -bottom-1 -right-1 bg-white rounded-full" />
                ) : (
                  <Lock className="w-3 h-3 text-slate-400 absolute -bottom-1 -right-1" />
                )}
              </div>
              <span className="font-sans font-bold text-xs mt-1 text-slate-900 truncate w-full">
                {badge.name}
              </span>
              <span className="text-[10px] text-slate-500 font-sans line-clamp-1">
                {badge.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Continue Learning Section (Official Curriculum Subjects) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-sans font-bold text-xl text-slate-900">
            {ku.home.continueSection}
          </h2>
          <span className="text-xs font-sans text-slate-500">
            پۆلی {user.grade} • پڕۆگرامی فەرمی هەرێم
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subjects.map((subj) => (
            <div
              key={subj.id}
              onClick={() => onNavigateToChat?.(subj.id)}
              className="bg-white shadow-xs hover:shadow-md transition-shadow rounded-2xl p-6 border border-slate-200 flex flex-col justify-between cursor-pointer space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      {subj.icon}
                    </div>
                    <h3 className="font-sans font-bold text-base text-slate-900">
                      {subj.title}
                    </h3>
                  </div>
                  <span className="text-xs font-sans font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {subj.progress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${subj.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-sans mt-2">
                  <span>{subj.progress}% {ku.home.completed}</span>
                  <span>{subj.lastStudied}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-indigo-600 text-sm font-sans font-bold">
                <span>دەستپێکردن بە خوێندن</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Secondary Recommendation Cards */}
      <section className="space-y-3 text-right">
        <h4 className="font-sans font-bold text-sm text-slate-800">ڕاسپاردەکانی تری خوێندن</h4>
        <div className="space-y-3">
          {snapshot?.secondaryCards && snapshot.secondaryCards.length > 0 ? (
            snapshot.secondaryCards.map((card) => (
              <div
                key={card.id}
                onClick={() => {
                  if (card.type === "start_assessment") onNavigateToAssessment?.();
                  else onNavigateToChat?.();
                }}
                className="flex justify-between items-center p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 cursor-pointer min-h-[48px] transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="font-sans text-sm font-bold text-slate-900">{card.title}</p>
                  <p className="font-sans text-xs text-slate-500">{card.description}</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-indigo-500 shrink-0" />
              </div>
            ))
          ) : (
            <>
              {/* Row 1 */}
              <div
                onClick={() => onNavigateToChat?.("chemistry")}
                className="flex justify-between items-center p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 cursor-pointer min-h-[48px] transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="font-sans text-sm font-bold text-slate-900">پێداچوونەوەی چەمکە سەرەکییەکان</p>
                  <p className="font-sans text-xs text-slate-500">یاسا و هاوکێشە زانستییەکان لەگەڵ مامۆستا زانا تاوتوێ بکە</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-indigo-500 shrink-0" />
              </div>

              {/* Row 2 */}
              <div
                onClick={() => onNavigateToAssessment?.()}
                className="flex justify-between items-center p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 cursor-pointer min-h-[48px] transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="font-sans text-sm font-bold text-slate-900">تاقیکردنەوەی خێرای ڕۆژانە</p>
                  <p className="font-sans text-xs text-slate-500">بە وەڵامدانەوەی ٥ پرسیار ئاستی زانستی و خاڵەکانت بەرز بکەرەوە</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-indigo-500 shrink-0" />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Quick Actions Card */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
        <h4 className="font-sans font-bold text-sm text-slate-800 text-right mb-2">کردارە خێراکان</h4>

        {/* Interactive Practice — with 'نوێ' badge */}
        <button
          onClick={() => onNavigateToChat?.()}
          className="w-full flex items-center justify-between p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/20 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all text-right cursor-pointer min-h-[48px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-sans text-sm font-bold text-slate-800">ڕاهێنانی کارلێککارانە</p>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">نوێ</span>
              </div>
              <p className="font-sans text-xs text-slate-500 mt-0.5">تاقیگەی مەجازی، شیکارکەری هەنگاو بە هەنگاو و دیاگرام</p>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-indigo-500 shrink-0" />
        </button>

        {/* Assessment */}
        <button
          onClick={() => onNavigateToAssessment?.()}
          className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all text-right cursor-pointer min-h-[48px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="font-sans text-sm font-bold text-slate-800">تاقیکردنەوەی ئاستی گشتی</p>
              <p className="font-sans text-xs text-slate-400 mt-0.5">ئاستی فێربوونی خۆت نوێ بکەرەوە بە چەند پرسیارێکی کورت</p>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {/* Rest Reminder */}
        <button
          onClick={() => showToast('با پشوویەکی کورت بدەین! زۆر ماندوو نەبیت 🌙')}
          className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all text-right cursor-pointer min-h-[48px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-lg">🌙</span>
            </div>
            <div>
              <p className="font-sans text-sm font-bold text-slate-800">پشوو و ئارامی 🌙</p>
              <p className="font-sans text-xs text-slate-400 mt-0.5">کەمێک پشوو بدە بۆ ئەوەی هێزی تازەت هەبێت</p>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </section>

      {/* Rest Reminder Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-4 right-4 bg-slate-900 text-white p-4 rounded-xl shadow-lg z-50 flex items-center justify-between">
          <p className="font-sans text-sm text-right">{toastMessage}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white mr-4 shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Badges Modal */}
      <Modal
        isOpen={showBadgesModal}
        onClose={() => setShowBadgesModal(false)}
        title="مێدالیا و دەستکەوتەکانی زانا 🏅"
      >
        <div className="space-y-4 text-right">
          <p className="text-xs text-slate-600 font-sans">
            بەردەوام بە لە خوێندن و شیکارکردنی پرسیارەکان بۆ کردنەوەی تەواوی مێدالیا و باجە ئەکادیمییەکان:
          </p>
          <div className="space-y-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-slate-900">{b.name}</h4>
                    <p className="text-xs text-slate-500 font-sans">{b.desc}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    b.unlocked
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {b.unlocked ? "دەستکەوتووە ✅" : "داخراوە 🔒"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Advanced Pedagogical Hub Modal */}
      <PedagogyHubModal
        isOpen={isPedagogyModalOpen}
        onClose={() => setIsPedagogyModalOpen(false)}
        defaultStudio={selectedStudio}
      />
    </div>
  );
}

export default Home;

