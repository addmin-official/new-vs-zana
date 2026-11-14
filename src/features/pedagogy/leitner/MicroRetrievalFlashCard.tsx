import React, { useState, useEffect } from "react";
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  Layers
} from "lucide-react";
import { LeitnerFlashCard } from "./leitnerTypes.ts";
import { LeitnerScheduleEngine, LEITNER_INTERVALS_DAYS } from "./LeitnerScheduleEngine.ts";
import { useSoundEffects } from "../../../hooks/useSoundEffects.ts";

export interface MicroRetrievalFlashCardProps {
  onAwardXp?: (amount: number) => void;
  onOpenMatrix?: () => void;
}

export function MicroRetrievalFlashCard({ onAwardXp, onOpenMatrix }: MicroRetrievalFlashCardProps) {
  const { playSuccess, playError } = useSoundEffects();
  const [dueCards, setDueCards] = useState<LeitnerFlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [__completedCount, setCompletedCount] = useState(0);

  const loadDueCards = () => {
    const cards = LeitnerScheduleEngine.getDueCards(3);
    setDueCards(cards);
    setCurrentIndex(0);
    setSelectedOption(null);
    setFeedback(null);
  };

  useEffect(() => {
    loadDueCards();
  }, []);

  if (dueCards.length === 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-50/70 via-white to-slate-50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-950 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/40 p-5 sm:p-6 shadow-xs flex items-center justify-between gap-4" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 block">
              بیرگەی درێژخایەنت پارێزراوە! 🎉
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              سەرجەم کارتەکانی لایتنەری ئەمڕۆت پێداچووەتەوە؛ هیچ بابەتێک لە مەترسی لەبیرچوونەوەدا نییە.
            </p>
          </div>
        </div>

        {onOpenMatrix && (
          <button
            onClick={onOpenMatrix}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer shrink-0 transition-colors"
          >
            ماتریکسی لایتنەر
          </button>
        )}
      </div>
    );
  }

  const currentCard = dueCards[currentIndex];
  if (!currentCard) return null;

  const currentRetention = LeitnerScheduleEngine.calculateRetention(currentCard);

  const handleSelectAnswer = (option: string) => {
    if (selectedOption !== null) return; // Prevent double answer
    setSelectedOption(option);

    const isCorrect = option === currentCard.correctAnswer;
    const updated = LeitnerScheduleEngine.answerCard(currentCard.id, isCorrect);

    if (isCorrect) {
      playSuccess();
      if (onAwardXp) onAwardXp(15);
      setFeedback({
        isCorrect: true,
        message: `ئافەرم! کارتەکە بەرزکرایەوە بۆ سندوقی ${updated?.box} (دووبارەبوونەوە دوای ${LEITNER_INTERVALS_DAYS[updated?.box || 1]} ڕۆژ).`
      });
    } else {
      playError();
      setFeedback({
        isCorrect: false,
        message: `وەڵامی دروست: «${currentCard.correctAnswer}». کارتەکە گەڕایەوە سندوقی ١ بۆ وەبیرهێنانەوەی زوو.`
      });
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setFeedback(null);
    setCompletedCount((prev) => prev + 1);

    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      loadDueCards();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-100 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4 relative overflow-hidden" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                وەبیرهێنانەوەی ٣ خولەکی (Micro-Retrieval Flash)
              </span>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                سندوقی {currentCard.box}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentCard.topicKu} • ئەگەری بیرماندنەوە پێش پرسیارەکە: {currentRetention}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">
            {currentIndex + 1} لە {dueCards.length}
          </span>
          {onOpenMatrix && (
            <button
              onClick={onOpenMatrix}
              className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer text-xs font-bold flex items-center gap-1"
              title="بینینی تەواوی سندوقەکان"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ماتریکس</span>
            </button>
          )}
        </div>
      </div>

      {/* Question Statement */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
        {currentCard.questionKu}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {(currentCard.optionsKu || []).map((opt, i) => {
          let btnStyle = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300";

          if (selectedOption !== null) {
            if (opt === currentCard.correctAnswer) {
              btnStyle = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold";
            } else if (opt === selectedOption) {
              btnStyle = "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-300";
            } else {
              btnStyle = "opacity-40 border-slate-200 dark:border-slate-800 text-slate-400";
            }
          }

          return (
            <button
              key={i}
              type="button"
              disabled={selectedOption !== null}
              onClick={() => handleSelectAnswer(opt)}
              className={`p-3 rounded-xl border text-xs text-right transition-all cursor-pointer ${btnStyle}`}
            >
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Bar */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs space-y-1 animate-in fade-in ${
            feedback.isCorrect
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              {feedback.isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
              {feedback.message}
            </span>

            <button
              onClick={handleNext}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
            >
              کارتەی دواتر
            </button>
          </div>
          <p className="text-[11px] opacity-90 pt-1 border-t border-black/5 dark:border-white/5">
            ڕوونکردنەوەی زانستی: {currentCard.explanationKu}
          </p>
        </div>
      )}
    </div>
  );
}
