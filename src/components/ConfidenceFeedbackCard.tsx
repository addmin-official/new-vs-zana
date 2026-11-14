import React, { useState } from "react";
import {
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  AlertTriangle,
  Brain,
  Check,
  Flame
} from "lucide-react";
import { ConfidenceFeedback } from "../features/feedback/ConfidenceFeedbackEngine.ts";

export interface ConfidenceFeedbackCardProps {
  feedback: ConfidenceFeedback;
  onRetry?: () => void;
  onNext?: () => void;
  onAskTutor?: () => void;
  className?: string;
}

export const ConfidenceFeedbackCard: React.FC<ConfidenceFeedbackCardProps> = ({
  feedback,
  onRetry,
  onNext,
  onAskTutor,
  className = "",
}) => {
  const [showDetailedSteps, setShowDetailedSteps] = useState(true);
  const [showTrapDetails, setShowTrapDetails] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const isCorrect = feedback.status === "correct";

  const toggleStep = (stepIdx: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepIdx]: !prev[stepIdx]
    }));
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 p-5 sm:p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 ${
        isCorrect
          ? "bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-emerald-200/90 text-slate-800"
          : "bg-gradient-to-br from-amber-50/90 via-white to-indigo-50/30 border-amber-200 text-slate-800"
      } ${className}`}
      dir="rtl"
    >
      {/* 1. Header Banner */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 hover:scale-105 ${
              isCorrect ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
            }`}
          >
            {isCorrect ? (
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            ) : (
              <Lightbulb className="w-6 h-6 stroke-[2.2]" />
            )}
          </div>
          <div>
            <h3 className="font-sans font-black text-base sm:text-lg text-slate-900 leading-tight">
              {feedback.headlineKu}
            </h3>
            <p className="font-sans text-xs text-slate-500 mt-1">
              {feedback.subHeadlineKu}
            </p>
          </div>
        </div>

        {/* Confidence Score Pill */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-2xs ${
              isCorrect
                ? "bg-emerald-100/90 text-emerald-800 border border-emerald-200"
                : "bg-amber-100/90 text-amber-800 border border-amber-200"
            }`}
          >
            {isCorrect && feedback.confidenceLevel === "mastery" ? (
              <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>+{feedback.confidenceScoreDelta} متمانە</span>
          </div>
          {feedback.confidenceLevel && (
            <span className="text-[10px] font-bold text-slate-400">
              {feedback.confidenceLevel === "mastery"
                ? "ئاستی باڵا 🏆"
                : feedback.confidenceLevel === "solid"
                ? "ئاستی جێگیر ⭐️"
                : "بنیاتنانی متمانە 🚀"}
            </span>
          )}
        </div>
      </div>

      {/* 2. Growth Mindset Encouragement Quote */}
      <div
        className={`p-3.5 rounded-xl border text-xs font-sans italic flex items-center gap-2.5 transition-colors ${
          isCorrect
            ? "bg-emerald-100/35 border-emerald-200/50 text-emerald-900"
            : "bg-amber-100/35 border-amber-200/50 text-amber-950"
        }`}
      >
        <span className="text-base not-italic shrink-0">💬</span>
        <span className="leading-relaxed">«{feedback.encouragementQuoteKu}»</span>
      </div>

      {/* 3. Scientific Explanation / Concept Reinforcement */}
      <div className="space-y-2 bg-white/90 p-4 rounded-xl border border-slate-200/70 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{isCorrect ? "لۆژیک و بنەمای دروستیی وەڵامەکە:" : "شیکاریی بنەڕەتیی چەمکەکە:"}</span>
          </span>
          {feedback.reinforcementConceptKu && (
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              {feedback.reinforcementConceptKu}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans font-medium">
          {feedback.scientificExplanationKu}
        </p>

        {feedback.relatedFormulaKu && (
          <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono text-xs font-bold text-indigo-900" dir="ltr">
            {feedback.relatedFormulaKu}
          </div>
        )}
      </div>

      {/* 4. When Needs Guidance: Misconception & Remediation Steps */}
      {!isCorrect && (
        <div className="space-y-3 pt-1">
          {feedback.misconceptionDiagnosisKu && (
            <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200/90 text-xs font-sans space-y-1">
              <span className="font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>دەستنیشانکردنی هەڵە باوەکە:</span>
              </span>
              <p className="text-slate-700 leading-relaxed font-normal pt-0.5">
                {feedback.misconceptionDiagnosisKu}
              </p>
            </div>
          )}

          {feedback.remediationStepsKu && feedback.remediationStepsKu.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200/90 overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setShowDetailedSteps(!showDetailedSteps)}
                className="w-full p-3 bg-amber-50/60 hover:bg-amber-50 text-right flex items-center justify-between text-xs font-bold text-amber-950 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  <span>ڕێنوێنی هەنگاو بە هەنگاو بۆ چارەسەری دروست (کلیک لەسەر هەنگاوەکان بکە)</span>
                </div>
                {showDetailedSteps ? (
                  <ChevronUp className="w-4 h-4 text-amber-700" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-amber-700" />
                )}
              </button>

              {showDetailedSteps && (
                <div className="p-4 space-y-2.5 bg-white border-t border-amber-100">
                  {feedback.remediationStepsKu.map((step, sIdx) => {
                    const isChecked = !!checkedSteps[sIdx];
                    return (
                      <div
                        key={sIdx}
                        onClick={() => toggleStep(sIdx)}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 text-xs font-sans ${
                          isChecked
                            ? "bg-emerald-50/60 border-emerald-200 text-slate-500 line-through"
                            : "bg-slate-50/60 border-slate-200/70 text-slate-800 hover:bg-amber-50/50"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[11px] font-bold mt-0.5 transition-colors ${
                            isChecked
                              ? "bg-emerald-600 text-white"
                              : "bg-white border border-slate-300 text-slate-700"
                          }`}
                        >
                          {isChecked ? <Check className="w-3.5 h-3.5" /> : sIdx + 1}
                        </span>
                        <span className="leading-relaxed font-medium">{step}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Ministerial Exam Pro Tip & Trap Alert */}
      {(feedback.ministerialTipKu || feedback.examTrapAlertKu) && (
        <div className="space-y-2">
          {feedback.ministerialTipKu && (
            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100/90 text-[11px] font-sans text-indigo-950 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{feedback.ministerialTipKu}</p>
            </div>
          )}

          {feedback.examTrapAlertKu && (
            <div className="bg-amber-50/50 rounded-xl border border-amber-200/60 overflow-hidden text-[11px] font-sans">
              <button
                type="button"
                onClick={() => setShowTrapDetails(!showTrapDetails)}
                className="w-full px-3 py-2 text-right flex items-center justify-between font-bold text-amber-900 cursor-pointer hover:bg-amber-100/40"
              >
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>تەڵەی باوی تاقیکردنەوەی وەزاری لەم پرسیارەدا</span>
                </div>
                {showTrapDetails ? <ChevronUp className="w-3.5 h-3.5 text-amber-700" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-700" />}
              </button>
              {showTrapDetails && (
                <div className="p-3 border-t border-amber-200/50 text-slate-700 bg-white/80 leading-relaxed font-medium">
                  {feedback.examTrapAlertKu}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. Growth Mindset Reminder Notice */}
      {feedback.growthMindsetNoticeKu && (
        <div className="flex items-center gap-2 text-[10px] font-sans text-slate-400 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
          <Brain className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>{feedback.growthMindsetNoticeKu}</span>
        </div>
      )}

      {/* 7. Action Buttons */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {!isCorrect && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>دووبارە تاقی بکەرەوە (بێ مەترسی)</span>
            </button>
          )}

          {onAskTutor && (
            <button
              type="button"
              onClick={onAskTutor}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>گفتوگۆ لەگەڵ مامۆستا زانا</span>
            </button>
          )}
        </div>

        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer ${
              isCorrect
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
          >
            <span>هەنگاوی داهاتوو</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
