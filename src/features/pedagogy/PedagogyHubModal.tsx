import React, { useState } from 'react';
import {
  Sparkles,
  Swords,
  FileSpreadsheet,
  Brain,
  Activity,
  X,
  ChevronLeft,
  GraduationCap
} from 'lucide-react';
import { FeynmanStudioView } from './feynman/FeynmanStudioView';
import { DebateArenaView } from './dialectic/DebateArenaView';
import { SomaSheetSimulator } from './somaSimulator/SomaSheetSimulator';
import { LeitnerMatrixVisualizer } from './leitner/LeitnerMatrixVisualizer';
import { ErrorDnaChart } from './metacognitive/ErrorDnaChart';

export type ActivePedagogyStudio =
  | 'feynman'
  | 'dialectic'
  | 'soma'
  | 'leitner'
  | 'error_dna'
  | null;

interface PedagogyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStudio?: ActivePedagogyStudio;
}

export const PedagogyHubModal: React.FC<PedagogyHubModalProps> = ({
  isOpen,
  onClose,
  defaultStudio = null
}) => {
  const [activeStudio, setActiveStudio] = useState<ActivePedagogyStudio>(defaultStudio);

  if (!isOpen) return null;

  // Render individual full-screen studio views if selected
  if (activeStudio === 'feynman') {
    return <FeynmanStudioView onClose={() => setActiveStudio(null)} />;
  }
  if (activeStudio === 'dialectic') {
    return <DebateArenaView onClose={() => setActiveStudio(null)} />;
  }
  if (activeStudio === 'soma') {
    return <SomaSheetSimulator onClose={() => setActiveStudio(null)} />;
  }

  const studios = [
    {
      id: 'feynman' as const,
      title: 'ستۆدیۆی چەمکسازی فاینمان',
      subtitle: 'فێربوون بە فێرکردن (Protégé Effect)',
      description:
        'چەمکە قورسەکان بە زمانی سادە بۆ زانا ڕوون بکەرەوە. زانا ڕەوانبێژی، گرێدەری هۆکاری و پێوەری تێگەیشتنت دەپێوێت.',
      icon: Sparkles,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
      badge: 'قۆناغی ١'
    },
    {
      id: 'error_dna' as const,
      title: 'شیکەرەوەی مێتاکۆگنیتیڤی هەڵەکان',
      subtitle: 'دەستنیشانکردنی DNAی بیرکردنەوە و هۆکاری هەڵەکان',
      description:
        'جیاکردنەوەی هەڵەی پەلەکردن و نەخوێندنەوە لە هەڵەی نەزانینی چەمک بە ٤ پۆلێنی زانستی مێشک.',
      icon: Activity,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
      badge: 'قۆناغی ٢'
    },
    {
      id: 'leitner' as const,
      title: 'ماتریکسی لایتنەری زیرەک',
      subtitle: 'تێکشکاندنی هێڵی لەبیرچوونەوەی ئێبینگهاوس',
      description:
        'خشتەی ٥ سندووقی دووبارەکردنەوە (١، ٣، ٧، ١٦، ٣٥ ڕۆژ) بۆ بەستنەوەی چەمکەکان بە بیرگەی درێژخایەن.',
      icon: Brain,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
      badge: 'قۆناغی ٣'
    },
    {
      id: 'dialectic' as const,
      title: 'مەیدانی دیبەیت و بەڵگاندنی سۆکراتی',
      subtitle: 'بەرەنگاربوونەوەی تێگەیشتنە چەوتەکان',
      description:
        'زانا وەک دژبەری زانستی (Devil\'s Advocate) ڕووبەڕووت دەبێتەوە. بە بەڵگەی سەلمێنراوی مەنهەج دەبێت سەربکەویت.',
      icon: Swords,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
      badge: 'قۆناغی ٤'
    },
    {
      id: 'soma' as const,
      title: 'هاوشێوەکاری تاقیکردنەوەی سۆما',
      subtitle: 'کۆنترۆڵی سترێسی هۆڵی وەزاری و هەناسەدانی ٤-٧-٨',
      description:
        'پەڕەی فەرمی سۆما لەگەڵ دەستنیشانکەری گیربوون لەسەر پرسیار (زیاتر لە ٣ خولەک) و شیاری بەڕێوەبردنی کات.',
      icon: FileSpreadsheet,
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900',
      badge: 'قۆناغی ٥'
    }
  ];

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              ستۆدیۆ پێشکەوتووەکانی زانا (Advanced Pedagogical Hub)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ئامرازە نوێیەکانی فێربوونی قووڵ و ئامادەکاری پلە یەکی وەزاری
            </p>
          </div>
        </div>

        {/* Modal Content: Hub Grid or Inner Viewer */}
        {activeStudio === 'error_dna' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveStudio(null)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />
                گەڕانەوە بۆ پێڕستی ستۆدیۆکان
              </button>
            </div>
            <ErrorDnaChart />
          </div>
        ) : activeStudio === 'leitner' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveStudio(null)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />
                گەڕانەوە بۆ پێڕستی ستۆدیۆکان
              </button>
            </div>
            <LeitnerMatrixVisualizer />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studios.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveStudio(s.id)}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {s.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {s.title}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                      {s.subtitle}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {s.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <span>دەستپێکردنی ستۆدیۆ</span>
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
