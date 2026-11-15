import React from "react";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Brain,
} from "lucide-react";

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onNavigateToLogin: () => void;
}

export function WelcomeScreen({
  onGetStarted,
  onNavigateToLogin,
}: WelcomeScreenProps) {
  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden"
    >
      {/* Top Navbar */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                زانا
              </span>
              <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-bold -mt-1">
                پلاتفۆرمی زیرەکی فێربوون
              </span>
            </div>
          </div>

          {/* Right Action: Login Link */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              چوونەژوورەوە
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition cursor-pointer"
            >
              <span>دەستپێکردن</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-16 flex flex-col items-center text-center space-y-8 sm:space-y-12">
        {/* Trial Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold shadow-sm animate-pulse">
          <span className="text-base">🎁</span>
          <span>٣ ڕۆژی تاقیکردنەوەی خۆڕایی بۆ هەموو قوتابییەکی نوێ</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">بێ پێویستی بە کارت</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-4 sm:space-y-6 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            هاوڕێی زیرەکی تۆ بۆ بەدەستهێنانی{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-600 to-indigo-600">
              نمرەی بەرزی پۆلی ١٢
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto">
            فێربوونی بەردەوام بە شێوازی سوقراتی، شیکارکردنی پرسیارە وەزارییەکان بە پێوەری زانستی، و پلانێکی تایبەت بۆ بەهێزکردنی خاڵە لاوازەکانت بە زیرەکی دەستکرد.
          </p>
        </div>

        {/* CTA Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md justify-center">
          <button
            type="button"
            onClick={onGetStarted}
            className="w-full sm:w-auto flex-1 h-13 sm:h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-base sm:text-lg font-bold flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-blue-200" />
            <span>دەستپێکردن (خۆڕایی)</span>
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="w-full sm:w-auto h-13 sm:h-14 px-6 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm sm:text-base font-bold flex items-center justify-center transition cursor-pointer"
          >
            هەژمارت هەیە؟ بچۆ ژوورەوە
          </button>
        </div>

        {/* Quick Highlights Grid (4 Bento Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full text-right pt-4 sm:pt-8">
          {/* Card 1: Socratic Tutor */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              مامۆستا زانای زیرەک
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تەنها وەڵامت پێ نادات، بەڵکو بە پرسیاری هۆشیارانە فێرت دەکات تا چەمکەکان بە تەواوی لە مێشکتدا بچەسپێن.
            </p>
          </div>

          {/* Card 2: Ministerial Exams */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              پرسیارەکانی وەزارەت
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              بانکی دەوڵەمەندی پرسیارە وزارییەکان لە ساڵی ٢٠١٥ تا ٢٠٢٤ بە شیکاری هەنگاو بە هەنگاو.
            </p>
          </div>

          {/* Card 3: Adaptive Assessment */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              تاقیکردنەوەی لەخۆگر
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ئاستی پرسیارەکان بەپێی وەڵامەکانت دەگۆڕێت تا لاوازییەکانت دیاری بکات و ڕاستیان بکاتەوە.
            </p>
          </div>

          {/* Card 4: Study Plan */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              پلانی تایبەت بە خۆت
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              خشتەی خوێندنی ڕۆژانە و هەفتانە بەپێی کاتەکانت بۆ ئەوەی بە ئارامی هەموو وانەکان تەواو بکەیت.
            </p>
          </div>
        </div>

        {/* Trust & Guarantee Banner */}
        <div className="w-full bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-blue-600/10 border border-blue-200/60 dark:border-blue-900/40 rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-around gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-bold">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>پارێزراو بە ستانداردی بەرز</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>تاقیکردنەوەی دەستبەجێ بەبێ مەرج</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <span>گونجاو لەسەر مۆبایل و کۆمپیوتەر</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <p>© 2026 زانا (ZANA Platform) — هەموو مافەکان پارێزراون بۆ قوتابیانی کوردستان.</p>
      </footer>
    </div>
  );
}
