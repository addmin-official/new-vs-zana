import React, { useState } from "react";
import {
  Heart,
  Flame,
  Clock,
  Calendar,
  CheckCircle2,
  BookOpen,
  Bell,
  TrendingUp,
} from "lucide-react";
import { ParentPortalSummary } from "../components/analytics/analyticsTypes.ts";
import { StudentProfile } from "../features/student/studentTypes.ts";

export interface ParentPortalProps {
  profile?: StudentProfile;
  onBackToApp?: () => void;
}

const PARENT_PORTAL_DATA: ParentPortalSummary = {
  childName: "ئاراس ئەحمەد",
  grade: "12",
  stream: "زانستی",
  weeklyDaysStudied: 5,
  weeklyMinutesSpent: 275,
  streakDays: 7,
  lastActive: "ئەمڕۆ کاتژمێر 16:30",
  subjectsProgress: [
    {
      subject: "chemistry",
      subjectKu: "کیمیا",
      icon: "⚗️",
      progressPercentage: 82,
      color: "bg-indigo-600",
    },
    {
      subject: "physics",
      subjectKu: "فیزیا",
      icon: "⚡",
      progressPercentage: 74,
      color: "bg-amber-500",
    },
    {
      subject: "math",
      subjectKu: "بیرکاری",
      icon: "📐",
      progressPercentage: 68,
      color: "bg-emerald-500",
    },
    {
      subject: "english",
      subjectKu: "ئینگلیزی",
      icon: "📖",
      progressPercentage: 88,
      color: "bg-purple-600",
    },
  ],
  masteredThisWeek: [
    {
      id: "m-1",
      titleKu: "هاوسەنگی ئایۆنی و پێوەری pH",
      subjectKu: "کیمیا",
      date: "دووشەممە",
    },
    {
      id: "m-2",
      titleKu: "یاسای دووەمی نیوتن لە تاقیگە",
      subjectKu: "فیزیا",
      date: "چوارشەممە",
    },
    {
      id: "m-3",
      titleKu: "ڕستەی نادیار (Passive Voice)",
      subjectKu: "ئینگلیزی",
      date: "پێنجشەممە",
    },
  ],
  currentlyWorkingOn: [
    {
      id: "w-1",
      titleKu: "گیراوەی بەفەر و کاریگەری ئایۆنی هاوبەش",
      subjectKu: "کیمیا",
      progress: 45,
    },
    {
      id: "w-2",
      titleKu: "داتاشراوی نەخشە توانییەکان",
      subjectKu: "بیرکاری",
      progress: 60,
    },
  ],
};

export function ParentPortal({ profile, onBackToApp }: ParentPortalProps) {
  const [data] = useState(PARENT_PORTAL_DATA);

  // Notification Preferences (UI only, no backend)
  const [emailSummaryEnabled, setEmailSummaryEnabled] = useState(true);
  const [inactivityAlertEnabled, setInactivityAlertEnabled] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const handleToggleEmail = () => {
    setEmailSummaryEnabled((prev) => !prev);
    showSavedToast();
  };

  const handleToggleInactivity = () => {
    setInactivityAlertEnabled((prev) => !prev);
    showSavedToast();
  };

  const showSavedToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const studentName = profile?.name || data.childName;
  const gradeLabel = `پۆلی ${profile?.grade || data.grade}ی ${
    profile?.stream === "scientific" ? "زانستی" : "ئامادەیی"
  }`;

  return (
    <div className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-950 flex flex-col h-full overflow-y-auto" dir="rtl">
      {/* 1. Header Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 shrink-0 shadow-2xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-sans text-slate-900 dark:text-white">
                  دەروازەی سەرپەرشتیار و دایک و باوک (Parent Portal)
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  ڕاپۆرتی فەرمی
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                چاودێری پێشکەوتنی <strong>{studentName}</strong> • {gradeLabel}
              </p>
            </div>
          </div>

          {onBackToApp && (
            <button
              type="button"
              onClick={onBackToApp}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer self-start sm:self-auto"
            >
              گەڕانەوە بۆ بەرنامە
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Saved Toast Alert */}
        {savedToast && (
          <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold font-sans flex items-center justify-center gap-2 shadow-md animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>ڕێکخستنەکانی ئاگادارکردنەوە نوێکرانەوە!</span>
          </div>
        )}

        {/* Clean Weekly Activity Summary & Streak Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Study Days this week */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 font-sans">
                ڕۆژانی خوێندنی ئەم هەفتەیە
              </span>
              <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-indigo-600">
                {data.weeklyDaysStudied}
              </span>
              <span className="text-xs font-bold text-slate-500 font-sans">
                لە کۆی ٧ ڕۆژ
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 font-sans font-bold">
              بەردەوامییەکی زۆر باش و ڕێکوپێک 👏
            </p>
          </div>

          {/* Card 2: Time Spent Studying */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 font-sans">
                کۆی کاتی تەرخانکراو
              </span>
              <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                {Math.floor(data.weeklyMinutesSpent / 60)}
              </span>
              <span className="text-xs font-bold text-slate-500 font-sans">
                کاتژمێر و {data.weeklyMinutesSpent % 60} خولەک
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              دواین چالاکی: {data.lastActive}
            </p>
          </div>

          {/* Card 3: Streak Display */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 font-sans">
                زنجیرەی بەردەوامی (Streak)
              </span>
              <span className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-500 flex items-center justify-center">
                <Flame className="w-5 h-5 animate-pulse" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-rose-500">
                {data.streakDays}
              </span>
              <span className="text-xs font-bold text-rose-600 font-sans">
                ڕۆژی لەسەریەک 🔥
              </span>
            </div>
            <p className="text-[11px] text-rose-600 font-sans font-bold">
              ڕۆژانە بەبێ پچڕان لە زانادا دەخوێنێت
            </p>
          </div>
        </div>

        {/* Progress by Subject: Simple, non-technical progress bars */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white font-sans">
                ئاستی پێشکەوتنی گشتی بەپێی بابەتەکانی مەنهەج
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400 font-sans">
              بەپێی تاقیکردنەوە و ڕاهێنانەکان
            </span>
          </div>

          <div className="space-y-4">
            {data.subjectsProgress.map((sub) => (
              <div key={sub.subject} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{sub.icon}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      وانەی {sub.subjectKu}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {sub.progressPercentage}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${sub.color} rounded-full transition-all duration-500`}
                    style={{ width: `${sub.progressPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2 Cards: Mastered this week & Currently working on */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section: Mastered this week */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-3xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm font-sans">
                ئەم هەفتەیە منداڵەکەت لەم چەمکانەدا لێهاتوو بوو:
              </h3>
            </div>

            <div className="space-y-2.5">
              {data.masteredThisWeek.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 font-sans">
                      {item.titleKu}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full shrink-0">
                    {item.subjectKu} • {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Currently working on */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm font-sans">
                لەم چەمکانەدا بەردەوامە لە فێربوون و ڕاهێنان:
              </h3>
            </div>

            <div className="space-y-2.5">
              {data.currentlyWorkingOn.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-amber-100 dark:border-amber-900/40 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 font-sans">
                      {item.titleKu}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full shrink-0">
                      {item.subjectKu}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>ئاستی ڕاهێنان:</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notification Preferences (UI only, no backend) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white font-sans">
              ڕێکخستنی ئاگادارکردنەوەکانی سەرپەرشتیار (Notification Preferences)
            </h3>
          </div>

          <div className="space-y-3">
            {/* Toggle 1: Weekly email summary */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 block font-sans">
                  ناردنی پوختەی هەفتانە بە ئیمێڵ (Weekly Email Summary)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                  هەموو ڕۆژێکی هەینی ڕاپۆرتێکی تەواوی کاتی خوێندن، نمرەکان و بەرەوپێشچوونی منداڵەکەت بۆ بنێردرێت.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleEmail}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out shrink-0 ${
                  emailSummaryEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
                aria-label="گۆڕینی ناردنی ئیمێڵ"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    emailSummaryEnabled ? "-translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Inactivity alert */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 block font-sans">
                  ئاگاداری لە کاتی پچڕانی خوێندن زیاتر لە ٣ ڕۆژ (Inactivity Alert)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                  ئەگەر قوتابی بۆ ماوەی ٣ ڕۆژ نەچێتە ژوورەوە بۆ زانا، ئاگادارییەکی خێرات پێدەگات.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleInactivity}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out shrink-0 ${
                  inactivityAlertEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
                aria-label="گۆڕینی ئاگاداری پچڕان"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    inactivityAlertEnabled ? "-translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ParentPortal;
