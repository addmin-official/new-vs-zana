import React, { useState } from "react";
import { StepSolverPayload } from "../practiceTypes.ts";
import { CheckCircle2, XCircle, Lightbulb, ArrowLeft, RotateCcw, Award, Sparkles, BookOpen } from "lucide-react";

interface StepByStepSolverProps {
  data: StepSolverPayload;
  onComplete: (score: number, maxScore: number) => void;
}

export const StepByStepSolver: React.FC<StepByStepSolverProps> = ({ data, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctStepsCount, setCorrectStepsCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentStep = data.steps[currentStepIndex];
  const selectedOption = currentStep?.options.find((opt) => opt.id === selectedOptionId);

  const handleSelectOption = (optionId: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionId(optionId);
  };

  const handleSubmitStep = () => {
    if (!selectedOptionId || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    if (selectedOption?.isCorrect) {
      setCorrectStepsCount((prev) => prev + 1);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex + 1 < data.steps.length) {
      setCurrentStepIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
    } else {
      setIsFinished(true);
      const finalScore = selectedOption?.isCorrect ? correctStepsCount + 1 : correctStepsCount;
      onComplete(finalScore, data.steps.length);
    }
  };

  const handleRetryStep = () => {
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
  };

  if (isFinished) {
    const percentage = Math.round((correctStepsCount / data.steps.length) * 100);
    return (
      <div id="step-solver-finished" className="bg-white border border-slate-100 rounded-2xl p-6 text-center space-y-5 shadow-xs" dir="rtl">
        <div className="w-16 h-16 mx-auto bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-xs">
          <Award className="w-9 h-9" />
        </div>
        <div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            شیکارکردن بە سەرکەوتوویی تەواو بوو!
          </span>
          <h3 className="font-bold text-xl text-slate-900 mt-3">دەستخۆش! بە وردی گەیشتیتە وەڵامی دروست</h3>
          <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
            {data.conclusionKu}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-around max-w-sm mx-auto">
          <div>
            <p className="text-xs text-slate-400 font-medium">هەنگاوە دروستەکان</p>
            <p className="text-lg font-bold text-slate-800">{correctStepsCount} لە {data.steps.length}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <p className="text-xs text-slate-400 font-medium">ڕێژەی سەرکەوتن</p>
            <p className="text-lg font-bold text-emerald-600">{percentage}%</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="step-by-step-solver" className="space-y-4" dir="rtl">
      {/* Problem Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            پرسیاری بنەڕەتی
          </span>
          <span className="text-xs font-medium text-slate-400">
            هەنگاوی {currentStep.stepNumber} لە {data.steps.length}
          </span>
        </div>

        <p className="text-sm text-slate-800 font-medium leading-relaxed">
          {data.problemStatementKu}
        </p>

        {data.problemContextKu && (
          <div className="bg-slate-900 text-white rounded-xl p-3 text-center font-mono text-base font-bold tracking-wider" dir="ltr">
            {data.problemContextKu}
          </div>
        )}

        {data.formulaKu && (
          <div className="bg-amber-50 border border-amber-200/70 rounded-lg px-3 py-1.5 text-xs text-amber-900 font-medium flex items-center justify-between">
            <span>یاسای بەکارهاتوو:</span>
            <span className="font-mono" dir="ltr">{data.formulaKu}</span>
          </div>
        )}
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 py-1">
        {data.steps.map((s, idx) => (
          <div
            key={s.stepNumber}
            className={`h-2 rounded-full transition-all duration-200 ${
              idx === currentStepIndex
                ? "w-8 bg-blue-600"
                : idx < currentStepIndex
                ? "w-2 bg-emerald-500"
                : "w-2 bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Current Step Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        <div>
          <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            {currentStep.titleKu}
          </h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {currentStep.instructionKu}
          </p>
        </div>

        {currentStep.mathExpression && (
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 text-center font-mono text-sm font-bold text-blue-950" dir="ltr">
            {currentStep.mathExpression}
          </div>
        )}

        {/* Options */}
        <div className="space-y-2 pt-1">
          {currentStep.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            let optionStyle = "border-slate-200 bg-white hover:border-slate-300";

            if (isSelected) {
              optionStyle = "border-blue-500 bg-blue-50/40 text-blue-950 ring-1 ring-blue-400";
            }

            if (isAnswerSubmitted && isSelected) {
              optionStyle = opt.isCorrect
                ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-400"
                : "border-rose-400 bg-rose-50 text-rose-950 ring-1 ring-rose-300";
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                disabled={isAnswerSubmitted}
                className={`w-full text-right p-3 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${optionStyle}`}
              >
                <span className="leading-relaxed">{opt.labelKu}</span>
                <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                  {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Zana Hint Toggle */}
        <div className="pt-1">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>{showHint ? "شاردنەوەی ڕێنوێنی" : "پێویستت بە بیرۆکەی یارمەتیدەرە لە زانا؟"}</span>
          </button>

          {showHint && (
            <div className="mt-2 bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed animate-fade-in">
              💡 {currentStep.hintKu}
            </div>
          )}
        </div>

        {/* Feedback Display After Submit */}
        {isAnswerSubmitted && selectedOption && (
          <div
            className={`rounded-xl p-3.5 text-xs leading-relaxed space-y-2 animate-fade-in ${
              selectedOption.isCorrect
                ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                : "bg-rose-50 border border-rose-200 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {selectedOption.isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>وەڵامەکەت دروستە! فێربوونی هەنگاوەکە:</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>سەرنج بدە! با هەڵەکە ڕوون بکەینەوە:</span>
                </>
              )}
            </div>
            <p>{selectedOption.explanationKu}</p>

            {!selectedOption.isCorrect && currentStep.commonMisconception && (
              <div className="mt-2 pt-2 border-t border-rose-200/60 text-[11px] text-rose-800 space-y-1">
                <span className="font-bold">هەڵەی باو:</span> {currentStep.commonMisconception.textKu}
                <br />
                <span className="font-bold">ڕاستکردنەوەی زانا:</span> {currentStep.commonMisconception.correctionKu}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitStep}
              disabled={!selectedOptionId}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer ${
                selectedOptionId
                  ? "bg-blue-600 hover:bg-blue-700 shadow-xs"
                  : "bg-slate-300 cursor-not-allowed text-slate-500"
              }`}
            >
              پشکنینی هەنگاوەکە
            </button>
          ) : selectedOption?.isCorrect ? (
            <button
              onClick={handleNextStep}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>
                {currentStepIndex + 1 < data.steps.length ? "هەنگاوی داهاتوو" : "تەواوکردنی شیکار"}
              </span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleRetryStep}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>دووبارە تاقیکردنەوە</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
