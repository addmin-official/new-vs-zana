import React, { useState, useEffect } from "react";
import { Brain, Sparkles, Plus } from "lucide-react";
import { MetacognitiveDiagnosisEngine } from "./MetacognitiveDiagnosisEngine.ts";
import { ErrorDnaProfile } from "./metacognitiveTypes.ts";
import { MetacognitivePostMortemModal } from "./MetacognitivePostMortemModal.tsx";

export function ErrorDnaChart() {
  const [profile, setProfile] = useState<ErrorDnaProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setProfile(MetacognitiveDiagnosisEngine.getProfile());
  }, []);

  if (!profile) return null;

  const total = Math.max(profile.totalReflections, 1);
  const carelessPct = Math.round((profile.carelessCount / total) * 100);
  const conceptualPct = Math.round((profile.conceptualCount / total) * 100);
  const calculationPct = Math.round((profile.calculationCount / total) * 100);
  const timePanicPct = Math.round((profile.timePanicCount / total) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              پڕۆفایلی دەروونی هەڵەکان (Error DNA Radar)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              شیکاریی مێتاکۆگنیتیڤی هۆکاری هەڵەکردن لەسەر بنەمای {profile.totalReflections} وەستانی هۆشیاری
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {profile.dominantErrorType && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
              هۆکاری سەرەکی: {profile.dominantErrorPercent}%
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>دەستنیشانکردنی هەڵە</span>
          </button>
        </div>
      </div>

      {/* 4 Error Types Horizontal Bar Chart */}
      <div className="space-y-3">
        {/* 1. Careless */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">⚡ پەلەکردن و خوێندنەوەی ناتەواو</span>
            <span className="font-mono text-slate-500">{carelessPct}% ({profile.carelessCount})</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${carelessPct}%` }}
            />
          </div>
        </div>

        {/* 2. Conceptual Deficit */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">🧩 تێنەگەیشتن لە چەمک و یاسا</span>
            <span className="font-mono text-slate-500">{conceptualPct}% ({profile.conceptualCount})</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${conceptualPct}%` }}
            />
          </div>
        </div>

        {/* 3. Calculation Slip */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">🧮 هەڵەی ژمێریاری و ماتماتیکی</span>
            <span className="font-mono text-slate-500">{calculationPct}% ({profile.calculationCount})</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${calculationPct}%` }}
            />
          </div>
        </div>

        {/* 4. Time Panic */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">⏳ دڵەڕاوکێ و فشاری کات</span>
            <span className="font-mono text-slate-500">{timePanicPct}% ({profile.timePanicCount})</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${timePanicPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metacognitive Insight Box */}
      <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
        <span className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          شیکاریی پەروەردەیی زانا بۆ هەڵەکانت:
        </span>
        <p className="leading-relaxed text-[11px]">{profile.metaAdviceSummaryKu}</p>
      </div>

      {/* Interactive 4-Quadrant Error Diagnosis Modal */}
      <MetacognitivePostMortemModal
        isOpen={isModalOpen}
        problemId={"prob-" + Date.now()}
        problemTitle={"شیکارکردنی پرسیاری هەڵە"}
        subject={"کیمیا / فیزیا / بیرکاری"}
        onComplete={() => {
          setIsModalOpen(false);
          setProfile(MetacognitiveDiagnosisEngine.getProfile());
        }}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
