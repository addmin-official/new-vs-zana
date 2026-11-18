import React, { useState } from "react";
import { LeitnerItem } from "../pedagogyTypes.ts";
import { PedagogyEngine } from "../pedagogyEngine.ts";
import { ZanaButton } from "../../../components/ZanaButton.tsx";
import {
  Layers,
  Calendar,
  Eye,
  Check,
  X
} from "lucide-react";

export const LeitnerMatrixComponent: React.FC = () => {
  const [items, setItems] = useState<LeitnerItem[]>(() => PedagogyEngine.getLeitnerItems());
  const [activeItem, setActiveItem] = useState<LeitnerItem | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleReviewAnswer = (correct: boolean) => {
    if (!activeItem) return;
    const updated = PedagogyEngine.processLeitnerReview(activeItem.id, correct);
    setItems(updated);
    setActiveItem(null);
    setShowAnswer(false);
  };

  const box1Items = items.filter((i) => i.box === 1);
  const box2Items = items.filter((i) => i.box === 2);
  const box3Items = items.filter((i) => i.box === 3);
  const box4Items = items.filter((i) => i.box === 4);
  const box5Items = items.filter((i) => i.box === 5);

  const boxes = [
    { number: 1, name: "سندووقی ١", interval: "١ ڕۆژ (ڕۆژانە)", count: box1Items.length, color: "border-rose-300 bg-rose-50/40 text-rose-800" },
    { number: 2, name: "سندووقی ٢", interval: "٣ ڕۆژ جارێک", count: box2Items.length, color: "border-amber-300 bg-amber-50/40 text-amber-800" },
    { number: 3, name: "سندووقی ٣", interval: "٧ ڕۆژ جارێک", count: box3Items.length, color: "border-blue-300 bg-blue-50/40 text-blue-800" },
    { number: 4, name: "سندووقی ٤", interval: "١٦ ڕۆژ جارێک", count: box4Items.length, color: "border-indigo-300 bg-indigo-50/40 text-indigo-800" },
    { number: 5, name: "سندووقی ٥", interval: "٣٥ ڕۆژ (هەمیشەیی)", count: box5Items.length, color: "border-emerald-300 bg-emerald-50/40 text-emerald-800" },
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Intro Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              سندووقی لایتنەر (Spaced Repetition) و تێکشکاندنی هێڵی لەبیرچوونەوە
            </h3>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md">
            تیۆریی ئێبینگهاوس
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          ئەگەر پرسیارێک بە دروستی وەڵام بدەیتەوە، دەچێتە سندووقی داهاتوو و ماوەی بینینەوەی درێژتر دەبێتەوە. ئەگەر هەڵەی
          بکەیت، دەگەڕێتەوە بۆ سندووقی ١ هەتا بە تەواوی لە بیرگەی درێژخایەندا جێگیر بێت.
        </p>
      </div>

      {/* 5 Leitner Boxes Visual Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {boxes.map((box) => (
          <div
            key={box.number}
            className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${box.color}`}
          >
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sm">{box.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/60 dark:bg-slate-800 rounded">
                  {box.count} کارت
                </span>
              </div>
              <p className="text-[10px] opacity-80">{box.interval}</p>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
              <span>ئاستی بیرگە</span>
              <span>{box.number * 20}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Review Active Card or Card List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Review Modal / Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              {activeItem ? "کارتی بەردەستی دووبارەکردنەوەی زیرەک" : "کارتێک بۆ پێداچوونەوە لە لیستەکە هەڵبژێرە"}
            </h4>

            {activeItem ? (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {activeItem.subject} • پۆلی {activeItem.grade}
                    </span>
                    <span className="font-bold text-blue-600">سندووقی {activeItem.box}</span>
                  </div>
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                    {activeItem.conceptTitle}
                  </h5>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-200 dark:border-slate-700">
                    {activeItem.questionPrompt}
                  </p>
                </div>

                {!showAnswer ? (
                  <ZanaButton
                    variant="primary"
                    onClick={() => setShowAnswer(true)}
                    className="text-xs font-bold w-full justify-center"
                  >
                    <Eye className="w-4 h-4 ml-1.5" />
                    <span>پیشاندانی وەڵامی دروست و هەڵسەنگاندن</span>
                  </ZanaButton>
                ) : (
                  <div className="space-y-3 animate-fade-in">
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
                      <span className="font-bold">وەڵامی دروستی پەڕتووک: </span>
                      {activeItem.correctAnswer}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => handleReviewAnswer(true)}
                        className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>بە تەواوی لە یادم بوو (+١ سندووق)</span>
                      </button>

                      <button
                        onClick={() => handleReviewAnswer(false)}
                        className="p-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>بیرم چوو بوو (گەڕانەوە بۆ سندووقی ١)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs">کلیک لەسەر یەکێک لە بابەتەکانی لای چەپ بکە بۆ پێداچوونەوەی ئەمڕۆ.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Items Catalog */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              هەموو چەمکەکان و سندووقەکانیان
            </span>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveItem(item);
                    setShowAnswer(false);
                  }}
                  className={`p-3 rounded-xl border text-right transition cursor-pointer flex items-center justify-between ${
                    activeItem?.id === item.id
                      ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/30"
                      : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div>
                    <h6 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {item.conceptTitle}
                    </h6>
                    <span className="text-[10px] text-slate-400">
                      {item.subject} • پۆلی {item.grade}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    سندووقی {item.box}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
