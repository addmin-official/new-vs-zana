import React, { useState } from 'react';
import {
  Swords,
  ShieldCheck,
  AlertTriangle,
  Send,
  Award,
  RefreshCw,
  ChevronRight,
  Flame
} from 'lucide-react';
import {
  CURRICULUM_MISCONCEPTIONS,
  DialecticArenaEngine
} from './DialecticArenaEngine';
import { MisconceptionItem, DebateTurn, DialecticEvaluation } from './dialecticTypes';

interface DebateArenaViewProps {
  onClose?: () => void;
  defaultMisconceptionId?: string;
  embedded?: boolean;
}

export const DebateArenaView: React.FC<DebateArenaViewProps> = ({
  onClose,
  defaultMisconceptionId,
  embedded = false
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    defaultMisconceptionId || CURRICULUM_MISCONCEPTIONS[0].id
  );
  const [argumentInput, setArgumentInput] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const misconception =
    DialecticArenaEngine.getMisconceptionById(selectedId) ||
    CURRICULUM_MISCONCEPTIONS[0];

  const [turns, setTurns] = useState<DebateTurn[]>([
    {
      id: 'advocate_init',
      speaker: 'advocate',
      text: misconception.devilsAdvocateArgument,
      timestamp: Date.now()
    }
  ]);

  const [lastEvaluation, setLastEvaluation] = useState<DialecticEvaluation | null>(null);

  const handleSelectMisconception = (item: MisconceptionItem) => {
    setSelectedId(item.id);
    setArgumentInput('');
    setLastEvaluation(null);
    setTurns([
      {
        id: `advocate_${Date.now()}`,
        speaker: 'advocate',
        text: item.devilsAdvocateArgument,
        timestamp: Date.now()
      }
    ]);
  };

  const handleSendArgument = () => {
    if (!argumentInput.trim() || isEvaluating) return;

    const studentText = argumentInput.trim();
    const studentTurn: DebateTurn = {
      id: `student_${Date.now()}`,
      speaker: 'student',
      text: studentText,
      timestamp: Date.now()
    };

    const newTurns = [...turns, studentTurn];
    setTurns(newTurns);
    setArgumentInput('');
    setIsEvaluating(true);

    setTimeout(() => {
      const evaluation = DialecticArenaEngine.evaluateStudentArgument(
        misconception,
        studentText
      );
      setLastEvaluation(evaluation);

      const rebuttalText = DialecticArenaEngine.generateAdvocateRebuttal(
        misconception,
        evaluation
      );
      const advocateTurn: DebateTurn = {
        id: `advocate_${Date.now()}`,
        speaker: 'advocate',
        text: rebuttalText,
        timestamp: Date.now(),
        evaluation
      };

      setTurns([...newTurns, advocateTurn]);
      setIsEvaluating(false);
    }, 700);
  };

  return (
    <div
      dir="rtl"
      className={
        embedded
          ? "w-full flex flex-col space-y-4"
          : "bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans"
      }
    >
      {/* Top Header - Only in standalone modal mode */}
      {!embedded && (
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                مەیدانی دیبەیت و بەڵگاندنی سۆکراتی
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  قۆناغی ٤
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                بەرەنگاربوونەوەی تێگەیشتنە هەڵەکان بە بەڵگەی زانستی پۆڵایین
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              داخستن
            </button>
          )}
        </header>
      )}

      {/* Main Grid */}
      <div className={embedded ? "w-full grid grid-cols-1 lg:grid-cols-12 gap-6" : "flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6"}>
        {/* Left/Sidebar: Misconceptions List */}
        <section className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              تێگەیشتنە هەڵە باوەکانی مەنهەج ({CURRICULUM_MISCONCEPTIONS.length})
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">پۆلی ٩-١٢</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {CURRICULUM_MISCONCEPTIONS.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectMisconception(item)}
                  className={`w-full text-right p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-sm text-amber-950 dark:text-amber-100 ring-1 ring-amber-500/40'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.subjectKurdish} • پۆلی {item.grade}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        مەیدانی چالاک
                        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold leading-relaxed">{item.title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    "{item.fallacyStatement}"
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Center & Right: Active Debate Arena */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          {/* Arena Banner */}
          <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-indigo-500/15 border border-amber-200/60 dark:border-amber-900/40 rounded-3xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-extrabold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                تێگەیشتنی هەڵەی مەنهەجی:
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                سەرچاوە: {misconception.curriculumReference}
              </span>
            </div>
            <p className="text-sm sm:text-base font-black text-rose-700 dark:text-rose-400 leading-relaxed">
              "{misconception.fallacyStatement}"
            </p>
          </div>

          {/* Dialogue Transcript */}
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 min-h-[320px] max-h-[460px] overflow-y-auto space-y-4">
            {turns.map((turn) => {
              const isAdvocate = turn.speaker === 'advocate';
              return (
                <div
                  key={turn.id}
                  className={`flex flex-col ${
                    isAdvocate ? 'items-start' : 'items-end'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                      {isAdvocate ? 'دژبەری زانستی (Devil\'s Advocate)' : 'تۆ (بەرگریکاری ڕاستی)'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(turn.timestamp).toLocaleTimeString('ar-IQ', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isAdvocate
                        ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-slate-800 dark:text-slate-200 rounded-tr-none'
                        : 'bg-indigo-600 text-white rounded-tl-none font-medium'
                    }`}
                  >
                    {turn.text}
                  </div>
                </div>
              );
            })}

            {isEvaluating && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 animate-pulse p-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                دژبەری زانستی خەریکی لێکدانەوەی بەڵگە و یاساکانی وتەکەتە...
              </div>
            )}
          </div>

          {/* Evaluation Scorecard if available */}
          {lastEvaluation && (
            <div className="bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-black">ئەنجامی شیکاری بەڵگاندنەکەت:</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black ${
                    lastEvaluation.verdict === 'CONVINCING'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : lastEvaluation.verdict === 'PARTIALLY_CONVINCING'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {lastEvaluation.verdict === 'CONVINCING'
                    ? 'سەرکەوت لە بەڵگاندنی زانستی ✓'
                    : lastEvaluation.verdict === 'PARTIALLY_CONVINCING'
                    ? 'بەڵگاندنی مامناوەند - پێویستی بە تیشکی زیاترە'
                    : 'بەڵگە ناتەواوە - هێشتا نەبەزێنراوە'}
                </span>
              </div>

              {/* 3 Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 block">بەڵگەی زانستی</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {lastEvaluation.scientificValidityScore}%
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 block">دوور لە هەڵەی لۆژیکی</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {lastEvaluation.fallacyFreeScore}%
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 block">ڕەوانبێژی و سەلماندن</span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                    {lastEvaluation.rhetoricalClarityScore}%
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {lastEvaluation.counterFeedback}
              </p>
            </div>
          )}

          {/* Argument Submission Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                بەڵگاندنی زانستی خۆت بنووسە (هۆکار، یاسا، وشەی زانستی بهێنەوە):
              </span>
              <span className="text-[10px] text-slate-400">
                وشە پێشنیارکراوەکان: {misconception.curriculumEvidenceKeywords.slice(0, 4).join(' • ')}
              </span>
            </label>

            <div className="flex gap-2">
              <textarea
                value={argumentInput}
                onChange={(e) => setArgumentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendArgument();
                  }
                }}
                rows={2}
                placeholder="بۆ نموونە: ئەم قسەیە هەڵەیە، چونکە بەپێی یاسای... کاتێک..."
                className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-slate-900 dark:text-white"
              />
              <button
                onClick={handleSendArgument}
                disabled={!argumentInput.trim() || isEvaluating}
                className="px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">ناردنی بەڵگە</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
