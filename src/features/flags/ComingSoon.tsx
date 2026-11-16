import React from "react";
import { Sparkles, ArrowRight, Compass } from "lucide-react";

export interface ComingSoonProps {
  title?: string;
  subtitle?: string;
  featureName?: string;
  onNavigateHome?: () => void;
}

export function ComingSoon({
  title = "بەزووی دێت ✨",
  subtitle = "ئەم تایبەتمەندییە لە نوێکردنەوەی داهاتوودا دێت",
  featureName,
  onNavigateHome,
}: ComingSoonProps) {
  const handleHomeClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <div
      className="flex-1 flex items-center justify-center min-h-[60vh] p-4 sm:p-6 select-none"
      dir="rtl"
    >
      <div className="relative max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-10 text-center shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Branded Icon Badge */}
        <div className="relative z-10 w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600/20 to-amber-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-6 shadow-xs ring-1 ring-indigo-500/30">
          <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
        </div>

        {/* Feature Name Pill (if passed) */}
        {featureName && (
          <span className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold mb-3">
            {featureName}
          </span>
        )}

        {/* Headings */}
        <h2 className="font-sans font-black text-2xl sm:text-3xl text-slate-900 dark:text-white leading-tight">
          {title}
        </h2>
        <p className="font-sans text-sm text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
          {subtitle}
        </p>

        {/* Context badge */}
        <div className="mt-6 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center gap-2 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
          <Compass className="w-4 h-4 shrink-0 text-indigo-500" />
          <span>تیمەکەمان لەسەر تەواوکردنی ئەم بەشە کار دەکات.</span>
        </div>

        {/* Single Primary Action: Return to Home */}
        <div className="mt-8">
          <button
            type="button"
            onClick={handleHomeClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer active:scale-95 min-h-[48px]"
          >
            <ArrowRight className="w-4 h-4" />
            <span>گەڕانەوە بۆ پەڕەی سەرەتا</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComingSoon;
