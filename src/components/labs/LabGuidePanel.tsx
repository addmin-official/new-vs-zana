import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, CheckCircle2, HelpCircle } from "lucide-react";

export interface LabGuidePanelProps {
  titleKu: string;
  objectiveKu: string;
  steps: { titleKu: string; instructionKu: string }[];
  currentStepIndex?: number;
}

export const LabGuidePanel: React.FC<LabGuidePanelProps> = ({
  titleKu,
  objectiveKu,
  steps,
  currentStepIndex = 0,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all font-sans" dir="rtl">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer border-b border-slate-100"
        aria-expanded={isOpen}
        aria-label="کردنەوە یان شاردنەوەی ڕێبەری تاقیگە"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-right">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              ڕێبەری هەنگاو بە هەنگاوی تاقیگە: {titleKu}
            </h4>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              ئامانج: {objectiveKu}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
            {steps.length} هەنگاو
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-4 sm:p-6 space-y-4 bg-white animate-in fade-in duration-200">
          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">ئامانجی زانستی تاقیکردنەوە:</span>
              <p className="text-indigo-800/90">{objectiveKu}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {steps.map((st, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    isCurrent
                      ? "bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-200 shadow-2xs"
                      : isCompleted
                      ? "bg-emerald-50/60 border-emerald-200"
                      : "bg-slate-50/60 border-slate-200/80"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <span
                      className={`text-xs font-bold block ${
                        isCurrent
                          ? "text-indigo-950 font-black"
                          : isCompleted
                          ? "text-emerald-900"
                          : "text-slate-800"
                      }`}
                    >
                      {st.titleKu}
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                      {st.instructionKu}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
