import React, { useState, useEffect } from "react";
import { GamifiedQuizPayload } from "../practiceTypes.ts";
import { Trophy, Zap, Timer, CheckCircle2, XCircle, Lightbulb, ArrowLeft, Flame } from "lucide-react";

interface GamifiedQuizPlayerProps {
  data: GamifiedQuizPayload;
  onComplete: (score: number, maxScore: number) => void;
}

export const GamifiedQuizPlayer: React.FC<GamifiedQuizPlayerProps> = ({ data, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(data.timeLimitSeconds);
  const [isFinished, setIsFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentQ = data.questions[currentQuestionIndex];
  const selectedOpt = currentQ?.options.find((o) => o.id === selectedOptionId);

  // Timer countdown
  useEffect(() => {
    if (isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          onComplete(score, data.questions.length * data.basePointsPerQuestion * 2);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, onComplete, score, data]);

  const handleSelectOption = (optId: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionId(optId);
  };

  const handleSubmit = () => {
    if (!selectedOptionId || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);

    if (selectedOpt?.isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      // Streak multiplier: 1x, 1.5x (streak>=2), 2x (streak>=4)
      const multiplier = newStreak >= 4 ? 2.0 : newStreak >= 2 ? 1.5 : 1.0;
      const pointsEarned = Math.round(data.basePointsPerQuestion * multiplier);
      setScore((prev) => prev + pointsEarned);
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < data.questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
    } else {
      setIsFinished(true);
      onComplete(score, data.questions.length * data.basePointsPerQuestion * 2);
    }
  };

  if (isFinished) {
    return (
      <div id="gamified-quiz-finished" className="bg-white border border-slate-100 rounded-2xl p-6 text-center space-y-5 shadow-xs" dir="rtl">
        <div className="w-16 h-16 mx-auto bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-xs">
          <Trophy className="w-9 h-9" />
        </div>
        <div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            یاری کۆتایی هات!
          </span>
          <h3 className="font-bold text-xl text-slate-900 mt-3">ئەنجامێکی سەرکەوتووانە لە تاقیکردنەوەی خێرادا</h3>
          <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
            کۆکردنەوەی خاڵ و وەڵامدانەوە لە کاتی دیاریکراودا وەڵامدانەوەی خێرا و متمانەت بەهێزتر دەکات.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <div>
            <p className="text-xs text-slate-400 font-medium">کۆی خاڵەکان</p>
            <p className="text-xl font-black text-amber-600 font-mono">+{score} XP</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">بەرزترین کۆمبۆ</p>
            <p className="text-xl font-black text-blue-600 font-mono">🔥 {maxStreak}x</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="gamified-quiz-player" className="space-y-4" dir="rtl">
      {/* Gamified Header: Points, Streak, Timer */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg font-mono flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              {score} XP
            </span>

            {streak >= 2 && (
              <span className="bg-rose-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg font-mono flex items-center gap-1 animate-pulse">
                <Flame className="w-3.5 h-3.5" />
                کۆمبۆ {streak}x
              </span>
            )}
          </div>

          {/* Timer Countdown */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
            <Timer className="w-4 h-4 text-sky-400" />
            <span className={timeLeft < 15 ? "text-rose-400 animate-pulse" : ""}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-400 h-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / data.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      {currentQ && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              {currentQ.categoryKu}
            </span>
            <span className="text-xs text-slate-400">
              پرسیاری {currentQuestionIndex + 1} لە {data.questions.length}
            </span>
          </div>

          <h3 className="font-bold text-slate-900 text-sm leading-relaxed" dir="ltr">
            {currentQ.questionKu}
          </h3>

          {currentQ.contextKu && (
            <p className="text-xs text-slate-500 italic">
              📌 {currentQ.contextKu}
            </p>
          )}

          {/* Options */}
          <div className="space-y-2 pt-1" dir="ltr">
            {currentQ.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              let optStyle = "border-slate-200 bg-white hover:border-slate-300";

              if (isSelected) {
                optStyle = "border-blue-500 bg-blue-50/40 text-blue-950 ring-1 ring-blue-400";
              }

              if (isAnswerSubmitted && isSelected) {
                optStyle = opt.isCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-400"
                  : "border-rose-400 bg-rose-50 text-rose-950 ring-1 ring-rose-300";
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={isAnswerSubmitted}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-between gap-2 ${optStyle}`}
                >
                  <span className="leading-relaxed">{opt.textKu}</span>
                  <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                    {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Hint */}
          <div className="pt-1 text-right">
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>{showHint ? "شاردنەوەی ڕێنوێنی" : "ڕێنوێنی بۆ ئەم پرسیارە"}</span>
            </button>

            {showHint && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 leading-relaxed text-right animate-fade-in">
                💡 {currentQ.hintKu}
              </div>
            )}
          </div>

          {/* Feedback */}
          {isAnswerSubmitted && selectedOpt && (
            <div
              className={`rounded-xl p-3.5 text-xs leading-relaxed space-y-1 animate-fade-in text-right ${
                selectedOpt.isCorrect
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {selectedOpt.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>پیرۆزە! وەڵامەکەت دروست بوو:</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>ڕوونکردنەوەی زانا بۆ ئەم هەڵەیە:</span>
                  </>
                )}
              </div>
              <p>{selectedOpt.explanationKu}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={!selectedOptionId}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer ${
                  selectedOptionId
                    ? "bg-blue-600 hover:bg-blue-700 shadow-xs"
                    : "bg-slate-300 cursor-not-allowed text-slate-500"
                }`}
              >
                تۆمارکردنی وەڵام
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>
                  {currentQuestionIndex + 1 < data.questions.length ? "پرسیاری داهاتوو" : "بینینی کۆی ئەنجام"}
                </span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
