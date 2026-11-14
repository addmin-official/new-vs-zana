import React, { useState } from "react";
import { Brain, ArrowLeft, Check, Sparkles } from "lucide-react";
import {
  CognitiveErrorCategory
} from "./metacognitiveTypes.ts";
import {
  COGNITIVE_ERROR_OPTIONS,
  MetacognitiveDiagnosisEngine
} from "./MetacognitiveDiagnosisEngine.ts";

export interface MetacognitivePostMortemModalProps {
  isOpen: boolean;
  problemId: string;
  problemTitle: string;
  subject: string;
  onComplete: () => void;
  onClose?: () => void;
}

export function MetacognitivePostMortemModal({
  isOpen,
  problemId,
  problemTitle,
  subject,
  onComplete,
}: MetacognitivePostMortemModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<CognitiveErrorCategory>("CARELESS_MISREADING");
  const [selfNote, setSelfNote] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const activeOption = COGNITIVE_ERROR_OPTIONS.find((o) => o.key === selectedCategory)!;

  const handleConfirm = () => {
    MetacognitiveDiagnosisEngine.recordReflection({
      problemId,
      problemTitle,
      subject,
      category: selectedCategory,
      userSelfNoteKu: selfNote.trim() || undefined,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onComplete();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              وەستانێکی هۆشیاری (Metacognitive Check)
            </span>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
              پێش ئەوەی وەڵامەکە ببینی: هۆکاری ئەم هەڵەیە چی بوو؟
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ناسینی هۆکاری هەڵەکەت ٧٠٪ی ڕێگای سەرکەوتنە لە تاقیکردنەوە نیشتمانییەکاندا
            </p>
          </div>
        </div>

        {/* 4 Cognitive Error Selection Cards */}
        <div className="space-y-2.5">
          {COGNITIVE_ERROR_OPTIONS.map((opt) => {
            const isSelected = selectedCategory === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSelectedCategory(opt.key)}
                className={`w-full text-right p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? "bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-500 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <span className="text-xl shrink-0 mt-0.5">{opt.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {opt.titleKu}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    {opt.descriptionKu}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Pedagogical Advice Box */}
        <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
          <span className="font-bold block flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            ڕێنمایی مێتاکۆگنیتیڤی زانا:
          </span>
          <p className="leading-relaxed text-[11px]">{activeOption.pedagogicalAdviceKu}</p>
        </div>

        {/* Optional Self-reflection text */}
        <div>
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
            تێبینیی هۆشیاری خۆت (ئارەزوومەندانە):
          </label>
          <input
            type="text"
            value={selfNote}
            onChange={(e) => setSelfNote(e.target.value)}
            placeholder="وەک: سەرنجم نەدا وشەی (جگە لە)ی تێدابوو..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-sans"
          />
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSaved}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" />
              <span>تۆمارکرا! دەستپێکردنەوەی شیکار...</span>
            </>
          ) : (
            <>
              <span>تۆمارکردنی هۆشیاری و بینینی شیکار</span>
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
