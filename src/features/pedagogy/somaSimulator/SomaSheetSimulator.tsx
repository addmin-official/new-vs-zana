import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Clock,
  Bookmark,
  Wind,
  RotateCcw,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import {
  SomaQuestion,
  SomaChoice,
  SomaExamAnalysis
} from './somaTypes';
import { BreathingOverlay } from './BreathingOverlay';

interface SomaSheetSimulatorProps {
  onClose?: () => void;
  initialQuestionCount?: number;
  initialMinutes?: number;
  embedded?: boolean;
}

export const SomaSheetSimulator: React.FC<SomaSheetSimulatorProps> = ({
  onClose,
  initialQuestionCount = 50,
  initialMinutes = 60,
  embedded = false
}) => {
  const [totalQuestions] = useState<number>(initialQuestionCount);
  const [bookletCode, setBookletCode] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [seatNumber, setSeatNumber] = useState<string>('124089');
  const [activeQuestion, setActiveQuestion] = useState<number>(1);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(
    initialMinutes * 60
  );
  const [isExamCompleted, setIsExamCompleted] = useState<boolean>(false);

  // Questions state
  const [questions, setQuestions] = useState<SomaQuestion[]>(() =>
    Array.from({ length: totalQuestions }, (_, i) => ({
      questionNumber: i + 1,
      selectedChoice: null,
      isFlaggedForReview: false,
      timeSpentSeconds: 0
    }))
  );

  // Panic / Freeze tracking on active question
  const [activeQuestionSeconds, setActiveQuestionSeconds] = useState<number>(0);
  const [freezeAlertShown, setFreezeAlertShown] = useState<boolean>(false);
  const [isBreathingModalOpen, setIsBreathingModalOpen] = useState<boolean>(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);

  // Global exam timer
  useEffect(() => {
    if (isExamCompleted) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsExamCompleted(true);
          setShowAnalysisModal(true);
          return 0;
        }
        return prev - 1;
      });

      // Increment active question time
      setActiveQuestionSeconds((sec) => {
        const next = sec + 1;
        // If > 180s (3 minutes) and hasn't alerted yet
        if (next >= 180 && !freezeAlertShown) {
          setFreezeAlertShown(true);
        }
        return next;
      });

      setQuestions((prev) =>
        prev.map((q) =>
          q.questionNumber === activeQuestion
            ? { ...q, timeSpentSeconds: q.timeSpentSeconds + 1 }
            : q
        )
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamCompleted, activeQuestion, freezeAlertShown]);

  // When changing active question, reset active question timer & alert
  const handleSelectQuestion = (qNum: number) => {
    setActiveQuestion(qNum);
    setActiveQuestionSeconds(0);
    setFreezeAlertShown(false);
  };

  const handleFillBubble = (choice: SomaChoice) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.questionNumber === activeQuestion
          ? {
              ...q,
              selectedChoice: q.selectedChoice === choice ? null : choice
            }
          : q
      )
    );
  };

  const handleToggleFlag = (qNum: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.questionNumber === qNum
          ? { ...q, isFlaggedForReview: !q.isFlaggedForReview }
          : q
      )
    );
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Compute analytics
  const computeAnalysis = (): SomaExamAnalysis => {
    const answered = questions.filter((q) => q.selectedChoice !== null).length;
    const flagged = questions.filter((q) => q.isFlaggedForReview).length;
    const blank = totalQuestions - answered;
    const totalTime = questions.reduce((acc, q) => acc + q.timeSpentSeconds, 0);
    const avgTime = Math.round(totalTime / totalQuestions);

    const slowest = [...questions]
      .sort((a, b) => b.timeSpentSeconds - a.timeSpentSeconds)
      .slice(0, 3)
      .map((q) => q.questionNumber);

    // Efficiency: penalty for questions > 150s, bonus for high completion
    const completionRatio = answered / totalQuestions;
    const timeRatio = Math.max(0, 1 - avgTime / 120);
    const timeEfficiencyScore = Math.min(
      100,
      Math.round(completionRatio * 60 + timeRatio * 40)
    );

    let pedagogicalAdvice = '';
    if (avgTime > 90) {
      pedagogicalAdvice =
        'تێکڕای کاتی هەر پرسیارێکت لە ٩٠ چرکە زیاتر بووە. پێشنیار دەکرێت لە تاقیکردنەوەی وەزاریدا ئەو پرسیارانەی پێویستیان بە بیرکردنەوەی زۆرە ڕاستەوخۆ نیشانە بکەیت و لە گەڕی دووەمدا بێیتەوە سەریان تا پرسیارە ئاسانەکان لەدەست نەدەیت.';
    } else if (flagged > 10) {
      pedagogicalAdvice =
        'ژمارەی پرسیارە نیشانەکراوەکانت زۆرە. ئەمە نیشانەی گومانە لە نێوان دوو بژاردەدا. پێداچوونەوە بە هاوکێشە و چەمکە سەرەکییەکان یارمەتیت دەدات بڕیاری خێراتر بدەیت.';
    } else {
      pedagogicalAdvice =
        'بەڕێوەبردنی کاتت زۆر نایاب بووە! دابەشکردنی خولەکەکان لەگەڵ شێوازی پرسیارەکانی سۆما گونجاوە.';
    }

    return {
      totalAnswered: answered,
      totalFlagged: flagged,
      totalBlank: blank,
      averageTimePerQuestionSeconds: avgTime,
      slowestQuestions: slowest,
      timeEfficiencyScore,
      pedagogicalAdvice
    };
  };

  const analysis = computeAnalysis();
  const currentQ = questions.find((q) => q.questionNumber === activeQuestion);

  return (
    <div
      dir="rtl"
      className={
        embedded
          ? "w-full flex flex-col space-y-4"
          : "bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans"
      }
    >
      {/* 4-7-8 Breathing Overlay */}
      <BreathingOverlay
        isOpen={isBreathingModalOpen}
        onClose={() => setIsBreathingModalOpen(false)}
      />

      {/* Top Header - Only in standalone modal mode */}
      {!embedded ? (
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                هاوشێوەکاری پەڕەی سۆمای وەزاری
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                  قۆناغی ٥
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ڕاهێنانی دەروونی لەسەر ڕەشکردنی سۆما و بەڕێوەبردنی کات
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBreathingModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold hover:bg-teal-100 transition cursor-pointer"
            >
              <Wind className="w-4 h-4 text-teal-500" />
              هەناسەدانی ٤-٧-٨
            </button>

            <button
              onClick={() => {
                setIsExamCompleted(true);
                setShowAnalysisModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
            >
              تەواوکردنی تاقیکردنەوە
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                داخستن
              </button>
            )}
          </div>
        </header>
      ) : (
        /* Embedded Action Controls Bar */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                هاوشێوەکاری پەڕەی سۆما ({totalQuestions} پرسیار)
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                ڕاهێنانی تاقیکردنەوەی وەزاری • بەکالۆریای کوردستان
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBreathingModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold hover:bg-teal-100 transition cursor-pointer"
            >
              <Wind className="w-4 h-4 text-teal-500" />
              هەناسەدانی ٤-٧-٨
            </button>

            <button
              onClick={() => {
                setIsExamCompleted(true);
                setShowAnalysisModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
            >
              تەواوکردنی تاقیکردنەوە
            </button>
          </div>
        </div>
      )}

      {/* Exam Status Bar */}
      <div className={`bg-slate-900 text-white px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs ${embedded ? 'rounded-2xl shadow-sm' : ''}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">کۆدی دەفتەر:</span>
            <div className="flex gap-1">
              {(['A', 'B', 'C', 'D'] as const).map((code) => (
                <button
                  key={code}
                  onClick={() => setBookletCode(code)}
                  className={`w-6 h-6 rounded-md font-black text-xs transition ${
                    bookletCode === code
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-slate-400">ژمارەی ئەزموونی:</span>
            <input
              type="text"
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
              className="w-20 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-center font-mono font-bold text-white text-xs"
            />
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${timeRemainingSeconds < 300 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
          <span className="text-slate-400">کاتی ماوە:</span>
          <span className="font-mono text-sm font-black tracking-wider text-amber-300">
            {formatTime(timeRemainingSeconds)}
          </span>
        </div>
      </div>

      {/* Freeze Warning Notification */}
      {freezeAlertShown && (
        <div className="bg-amber-500/15 border-b border-amber-300 dark:border-amber-900/60 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              ئاگاداری: زیاتر لە ٣ خولەکە لەسەر پرسیاری ({activeQuestion}) وەستاویت! لە وەزاریدا کات زێڕە. پێشنیار دەکرێت نیشانەی بکەیت و بڕۆیتە سەر پرسیاری دواتر.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsBreathingModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700"
            >
              هەناسەی ئارام
            </button>
            <button
              onClick={() => {
                handleToggleFlag(activeQuestion);
                if (activeQuestion < totalQuestions) {
                  handleSelectQuestion(activeQuestion + 1);
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700"
            >
              نیشانەکردن و تێپەڕین
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left interactive question filler, Right full 50-bubble sheet */}
      <div className={embedded ? "w-full grid grid-cols-1 lg:grid-cols-12 gap-6" : "flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6"}>
        {/* Active Question Panel (Mobile & Tablet Focus) */}
        <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">پرسیاری ژمارە</span>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  #{activeQuestion}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">
                  کاتی پرسیار: {formatTime(activeQuestionSeconds)}
                </span>
                <button
                  onClick={() => handleToggleFlag(activeQuestion)}
                  className={`p-2 rounded-xl border transition ${
                    currentQ?.isFlaggedForReview
                      ? 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-950 dark:border-amber-800'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                  }`}
                  title="نیشانەکردن بۆ پێداچوونەوە"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6">
              بژاردەی وەڵام لەسەر پەڕەی سۆما ڕەش بکەرەوە:
            </div>

            {/* Bubble Options */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'A (ئە)', val: 'A' },
                { label: 'B (ب)', val: 'B' },
                { label: 'C (ج)', val: 'C' },
                { label: 'D (د)', val: 'D' }
              ].map((opt) => {
                const isSelected = currentQ?.selectedChoice === opt.val;
                return (
                  <button
                    key={opt.val}
                    onClick={() => handleFillBubble(opt.val as SomaChoice)}
                    className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md dark:bg-indigo-600 dark:border-indigo-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-sm font-black">{opt.label}</span>
                    <div
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-white bg-slate-950 dark:bg-indigo-900'
                          : 'border-slate-400 bg-slate-50 dark:bg-slate-700'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-white animate-scale-in" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Nav Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                if (activeQuestion > 1) handleSelectQuestion(activeQuestion - 1);
              }}
              disabled={activeQuestion <= 1}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              پرسیاری پێشوو
            </button>

            <span className="text-xs font-bold text-slate-500">
              {activeQuestion} لە {totalQuestions}
            </span>

            <button
              onClick={() => {
                if (activeQuestion < totalQuestions)
                  handleSelectQuestion(activeQuestion + 1);
              }}
              disabled={activeQuestion >= totalQuestions}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1"
            >
              پرسیاری دواتر
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Replica of Official Soma Sheet Grid (50 Questions) */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                پەڕەی فەرمی سۆما (Soma Bubble Sheet)
              </span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                {analysis.totalAnswered} پڕکراوەتەوە • {analysis.totalBlank} بەتاڵ
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-indigo-500" />
                ڕەشکراو
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                نیشانەکراو
              </span>
            </div>
          </div>

          {/* Grid of bubbles: 2 columns on mobile, 4 columns on desktop */}
          <div className="flex-1 overflow-y-auto max-h-[500px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pr-1">
            {questions.map((q) => {
              const isActive = q.questionNumber === activeQuestion;
              return (
                <div
                  key={q.questionNumber}
                  onClick={() => handleSelectQuestion(q.questionNumber)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                      : q.isFlaggedForReview
                      ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-mono font-bold text-slate-500 w-5">
                      {q.questionNumber}
                    </span>
                    {q.isFlaggedForReview && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {(['A', 'B', 'C', 'D'] as const).map((ch) => {
                      const filled = q.selectedChoice === ch;
                      return (
                        <div
                          key={ch}
                          className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center border transition ${
                            filled
                              ? 'bg-slate-900 border-slate-900 text-white dark:bg-indigo-500 dark:border-indigo-500'
                              : 'border-slate-300 dark:border-slate-600 text-slate-400'
                          }`}
                        >
                          {filled ? ch : ''}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Post-Exam Time Budgeting & Stress Analytics Modal */}
      {showAnalysisModal && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  ڕاپۆرتی بەڕێوەبردنی کات و سترێس (Time-Budgeting)
                </h2>
              </div>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                داخستن
              </button>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-center border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block">پڕکراوەتەوە</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {analysis.totalAnswered} / {totalQuestions}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-center border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block">تێکڕای کاتی پرسیار</span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {analysis.averageTimePerQuestionSeconds}s
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-center border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block">پلەی کارامەیی کات</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {analysis.timeEfficiencyScore}%
                </span>
              </div>
            </div>

            {/* Slowest Questions */}
            {analysis.slowestQuestions.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200 dark:border-amber-900/50 text-xs">
                <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                  ئەو پرسیارانەی زۆرترین کاتیان بردووە:
                </span>
                <p className="text-slate-600 dark:text-slate-300">
                  پرسیارەکانی ({analysis.slowestQuestions.map((n) => `#${n}`).join('، ')}) زۆرترین خولەکیان بەفیڕۆ داوە. لە تاقیکردنەوەدا کاتێک بینیت پرسیارێک لە ٢ خولەک تێپەڕی دەستبەجێ نیشانەی بکە.
                </p>
              </div>
            )}

            {/* Pedagogical Advice */}
            <div className="space-y-1">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                ڕاسپاردەی پەروەردەیی بۆ ڕۆژی تاقیکردنەوە:
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {analysis.pedagogicalAdvice}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowAnalysisModal(false);
                  setIsExamCompleted(false);
                  setTimeRemainingSeconds(initialMinutes * 60);
                  setQuestions(
                    Array.from({ length: totalQuestions }, (_, i) => ({
                      questionNumber: i + 1,
                      selectedChoice: null,
                      isFlaggedForReview: false,
                      timeSpentSeconds: 0
                    }))
                  );
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                دووبارەکردنەوە
              </button>

              <button
                onClick={() => {
                  setShowAnalysisModal(false);
                  if (onClose) onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md transition"
              >
                تەواو و گەڕانەوە
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
