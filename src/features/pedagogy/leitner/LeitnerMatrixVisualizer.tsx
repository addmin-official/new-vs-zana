import React, { useState, useEffect } from "react";
import { Layers } from "lucide-react";
import { LeitnerScheduleEngine, LEITNER_INTERVALS_DAYS } from "./LeitnerScheduleEngine.ts";
import { LeitnerBoxNumber, LeitnerFlashCard, LeitnerQueueSummary } from "./leitnerTypes.ts";

export interface LeitnerMatrixVisualizerProps {
  onClose?: () => void;
}

export function LeitnerMatrixVisualizer({ onClose }: LeitnerMatrixVisualizerProps) {
  const [cards, setCards] = useState<LeitnerFlashCard[]>([]);
  const [summary, setSummary] = useState<LeitnerQueueSummary | null>(null);
  const [activeBoxFilter, setActiveBoxFilter] = useState<LeitnerBoxNumber | "all">("all");

  useEffect(() => {
    setCards(LeitnerScheduleEngine.getCards());
    setSummary(LeitnerScheduleEngine.getSummary());
  }, []);

  if (!summary) return null;

  const filteredCards = activeBoxFilter === "all"
    ? cards
    : cards.filter((c) => c.box === activeBoxFilter);

  const BOX_CONFIG: { box: LeitnerBoxNumber; labelKu: string; colorClass: string; descKu: string }[] = [
    { box: 1, labelKu: "سندوقی ١ (١ ڕۆژ)", colorClass: "border-red-400 bg-red-50/50 dark:bg-red-950/20", descKu: "تازە خوێندراو یان هەڵەکراو" },
    { box: 2, labelKu: "سندوقی ٢ (٣ ڕۆژ)", colorClass: "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20", descKu: "لە قۆناغی وەبیرهێنانەوە" },
    { box: 3, labelKu: "سندوقی ٣ (٧ ڕۆژ)", colorClass: "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20", descKu: "جێگیربوونی هەفتانە" },
    { box: 4, labelKu: "سندوقی ٤ (١٦ ڕۆژ)", colorClass: "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20", descKu: "پێش بینینی تاقیکردنەوە" },
    { box: 5, labelKu: "سندوقی ٥ (٣٥ ڕۆژ)", colorClass: "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20", descKu: "جێگیر لە بیرگەی درێژخایەن" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-6 max-w-5xl mx-auto w-full" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>ماتریکسی لایتنەر (The Leitner Spaced-Repetition Matrix)</span>
          </div>
          <h2 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white mt-1">
            دابەشبوونی چەمکەکان بەسەر ٥ سندوقی بیرگەی درێژخایەندا
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            سیستەمی تێکشکاندنی هێڵی لەبیرچوونەوەی ئێبینگهاوس (Ebbinghaus Forgetting Curve) بۆ بەکالۆریای پۆلی ١٢
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-start sm:self-center px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            داخستن
          </button>
        )}
      </div>

      {/* 5-Box Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {BOX_CONFIG.map((b) => {
          const count = summary.boxCounts[b.box] || 0;
          const isSelected = activeBoxFilter === b.box;
          return (
            <button
              key={b.box}
              type="button"
              onClick={() => setActiveBoxFilter(isSelected ? "all" : b.box)}
              className={`p-4 rounded-2xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between ${b.colorClass} ${
                isSelected ? "ring-2 ring-indigo-600 shadow-sm" : "opacity-90 hover:opacity-100"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                  {b.labelKu}
                </span>
                <span className="font-sans font-black text-2xl text-slate-900 dark:text-white mt-1 block">
                  {count} کارت
                </span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-2 font-medium">
                {b.descKu}
              </p>
            </button>
          );
        })}
      </div>

      {/* Cards List in Selected Box */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>کارتەکانی ئەم سندوقە ({filteredCards.length}):</span>
          {activeBoxFilter !== "all" && (
            <button
              onClick={() => setActiveBoxFilter("all")}
              className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              پیشاندانی هەموو کارتەکان
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
          {filteredCards.map((card) => {
            const retention = LeitnerScheduleEngine.calculateRetention(card);
            return (
              <div key={card.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {card.topicKu}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      سندوقی {card.box} ({LEITNER_INTERVALS_DAYS[card.box]} ڕۆژ)
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    {card.questionKu}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    ئەگەری بیرماندنەوە:
                  </span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-lg text-xs ${
                    retention >= 80 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                    retention >= 60 ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                    "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  }`}>
                    {retention}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
