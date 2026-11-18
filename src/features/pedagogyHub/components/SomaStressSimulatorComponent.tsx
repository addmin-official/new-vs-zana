import React, { useState, useEffect } from "react";
import { SomaQuestion } from "../pedagogyTypes.ts";
import { PedagogyEngine } from "../pedagogyEngine.ts";
import { ZanaButton } from "../../../components/ZanaButton.tsx";
import {
  Clock,
  HeartPulse
} from "lucide-react";

export const SomaStressSimulatorComponent: React.FC = () => {
  const questions = PedagogyEngine.getSomaQuestions();
  const [markedAnswers, setMarkedAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [activeQuestionNum, setActiveQuestionNum] = useState<number>(1);
  const [secondsLeft, setSecondsLeft] = useState<number>(180); // 3-minute rapid stress simulation
  const [isExamSubmitted, setIsExamSubmitted] = useState<boolean>(false);
  const [isBreathingModeActive, setIsBreathingModeActive] = useState<boolean>(false);
  const [breathingTimer, setBreathingTimer] = useState<number>(10);

  // Timer countdown
  useEffect(() => {
    if (isExamSubmitted || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsExamSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isExamSubmitted, secondsLeft]);

  // Breathing cooldown counter
  useEffect(() => {
    if (!isBreathingModeActive) return;
    const interval = setInterval(() => {
      setBreathingTimer((prev) => {
        if (prev <= 1) {
          setIsBreathingModeActive(false);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isBreathingModeActive]);

  const handleBubbleClick = (qNum: number, key: "A" | "B" | "C" | "D") => {
    if (isExamSubmitted) return;
    setMarkedAnswers((prev) => ({
      ...prev,
      [qNum]: key
    }));
  };

  const currentQ = questions.find((q: SomaQuestion) => q.number === activeQuestionNum) || questions[0];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q: SomaQuestion) => {
      if (markedAnswers[q.number] === q.correctKey) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100)
    };
  };

  const score = calculateScore();

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Soma Header & Timer */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-black">
            سۆما
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              هاوشێوەکاری تاقیکردنەوەی وەزاری (پەڕەی سۆما)
            </h4>
            <span className="text-[11px] text-slate-400">
              ئامادەکاری دەروونی و بەڕێوەبردنی کات بەبێ شڵەژان
            </span>
          </div>
        </div>

        {/* Live Timer & Stress Regulator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBreathingModeActive(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
          >
            <HeartPulse className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>هەست بە سترێس دەکەم (ئارامبوونەوە)</span>
          </button>

          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold ${
              secondsLeft < 60
                ? "bg-rose-600 text-white animate-pulse"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>کاتی ماوە: {formatTime(secondsLeft)}</span>
          </div>
        </div>
      </div>

      {/* Breathing 4-7-8 Overlay */}
      {isBreathingModeActive && (
        <div className="p-4 bg-indigo-900 text-white rounded-2xl border border-indigo-700 space-y-2 animate-fade-in text-center">
          <h5 className="font-bold text-sm">مەشقی خێرای ئارامکردنەوەی مێشک (Breathing Cooldown)</h5>
          <p className="text-xs text-indigo-200">
            هەناسەیەکی قووڵ هەڵمژە و لە دڵەوە بڵێ: هەموو پرسیارەکان دەزانم، تەنها کات دەبەخشم بە خۆم...
          </p>
          <div className="text-2xl font-black font-mono text-amber-300">{breathingTimer} چرکە</div>
        </div>
      )}

      {/* Main Grid: Question Book & Official Bubble Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Exam Question Paper */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 min-h-[360px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                <span className="text-xs font-bold text-slate-500">
                  پرسیاری {currentQ.number} لە {questions.length} • {currentQ.subject}
                </span>
                <span className="text-[11px] font-mono text-slate-400">فۆرمی وزاری (A)</span>
              </div>

              <p className="font-sans font-bold text-sm text-slate-900 dark:text-white leading-relaxed">
                {currentQ.questionText}
              </p>

              {/* Multiple choice options */}
              <div className="space-y-2 mt-4">
                {currentQ.options.map((opt: { key: "A" | "B" | "C" | "D"; text: string }) => (
                  <div
                    key={opt.key}
                    onClick={() => handleBubbleClick(currentQ.number, opt.key)}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                      markedAnswers[currentQ.number] === opt.key
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold"
                        : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>
                      ({opt.key}) {opt.text}
                    </span>
                    {markedAnswers[currentQ.number] === opt.key && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Question pagination */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={activeQuestionNum <= 1}
                onClick={() => setActiveQuestionNum((prev) => prev - 1)}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-30 cursor-pointer"
              >
                پرسیاری پێشوو
              </button>

              <span className="text-xs text-slate-400 font-mono">
                {activeQuestionNum} / {questions.length}
              </span>

              <button
                disabled={activeQuestionNum >= questions.length}
                onClick={() => setActiveQuestionNum((prev) => prev + 1)}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-30 cursor-pointer"
              >
                پرسیاری دواتر
              </button>
            </div>
          </div>
        </div>

        {/* Right: Kurdish Official SOMA Sheet (Bubble Card Simulation) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-amber-50/40 dark:bg-slate-900 p-5 rounded-2xl border-2 border-amber-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="text-center border-b border-amber-200/60 pb-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                وەزارەتی پەروەردە • تاقیکردنەوە گشتییەکان
              </span>
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100 mt-0.5">
                پەڕەی وەڵامدانەوەی سۆما (SOMA Sheet)
              </h5>
            </div>

            {/* Bubble Matrix */}
            <div className="space-y-3">
              {questions.map((q: SomaQuestion) => {
                const selected = markedAnswers[q.number];
                return (
                  <div
                    key={q.number}
                    className={`flex items-center justify-between p-2 rounded-lg transition ${
                      activeQuestionNum === q.number
                        ? "bg-amber-100/70 dark:bg-slate-800"
                        : "hover:bg-amber-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <button
                      onClick={() => setActiveQuestionNum(q.number)}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 w-8 text-right cursor-pointer"
                    >
                      .{q.number}
                    </button>

                    {/* Bubbles A, B, C, D */}
                    <div className="flex items-center gap-2">
                      {(["A", "B", "C", "D"] as const).map((letter) => {
                        const isFilled = selected === letter;
                        return (
                          <button
                            key={letter}
                            disabled={isExamSubmitted}
                            onClick={() => handleBubbleClick(q.number, letter)}
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold font-mono transition cursor-pointer ${
                              isFilled
                                ? "bg-slate-900 border-slate-900 text-white dark:bg-blue-600 dark:border-blue-500 shadow-xs"
                                : "border-slate-400 text-slate-600 hover:border-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit / Finish */}
            {!isExamSubmitted ? (
              <ZanaButton
                variant="primary"
                onClick={() => setIsExamSubmitted(true)}
                className="w-full text-xs font-bold justify-center mt-3"
              >
                کۆتاییهێنان و پێشکەشکردنی دەفتەری سۆما
              </ZanaButton>
            ) : (
              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-center animate-fade-in">
                <span className="text-xs font-bold text-slate-500">ئەنجامی تاقیکردنەوەی سۆما:</span>
                <div className="text-2xl font-black text-blue-600">
                  {score.correct} لە {score.total} ({score.percentage}%)
                </div>
                <p className="text-[11px] text-slate-500">
                  دەستخۆش بۆ هەوڵەکەت! گرنگترین خاڵ کۆنترۆڵکردنی کات و پڕکردنەوەی دروستی بازنەکانە لە هۆڵی
                  تاقیکردنەوەدا.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
