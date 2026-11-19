import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  Activity,
  Brain,
  Swords,
  FileSpreadsheet,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { FeynmanStudioView } from '../features/pedagogy/feynman/FeynmanStudioView';
import { ErrorDnaChart } from '../features/pedagogy/metacognitive/ErrorDnaChart';
import { LeitnerMatrixVisualizer } from '../features/pedagogy/leitner/LeitnerMatrixVisualizer';
import { MicroRetrievalFlashCard } from '../features/pedagogy/leitner/MicroRetrievalFlashCard';
import { DebateArenaView } from '../features/pedagogy/dialectic/DebateArenaView';
import { SomaSheetSimulator } from '../features/pedagogy/somaSimulator/SomaSheetSimulator';

export type PedagogyPillarTab =
  | 'feynman'
  | 'metacognitive'
  | 'leitner'
  | 'dialectic'
  | 'soma';

export interface PedagogicalHubScreenProps {
  initialTab?: PedagogyPillarTab;
  onNavigateToHome?: () => void;
  onNavigateToPractice?: () => void;
}

export const PedagogicalHubScreen: React.FC<PedagogicalHubScreenProps> = ({
  initialTab = 'feynman',
  onNavigateToHome,
  onNavigateToPractice
}) => {
  const [activeTab, setActiveTab] = useState<PedagogyPillarTab>(initialTab);
  const [selectedGrade, setSelectedGrade] = useState<'all' | '9' | '10' | '11' | '12'>('12');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const pillars = [
    {
      id: 'feynman' as const,
      name: 'ستۆدیۆی فاینمان',
      subtitle: 'فێربوون بە فێرکردن',
      icon: Sparkles,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
    },
    {
      id: 'metacognitive' as const,
      name: 'ڕاداری مێتاکۆگنیتیڤ',
      subtitle: 'DNAی هۆکاری هەڵەکان',
      icon: Activity,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
    },
    {
      id: 'leitner' as const,
      name: 'ماتریکسی لایتنەر',
      subtitle: 'تێکشکاندنی لەبیرچوونەوە',
      icon: Brain,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
    },
    {
      id: 'dialectic' as const,
      name: 'مەیدانی دیبەیت',
      subtitle: 'بەڵگاندنی سۆکراتی',
      icon: Swords,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
    },
    {
      id: 'soma' as const,
      name: 'هاوشێوەکاری سۆما',
      subtitle: 'کۆنترۆڵی سترێسی وەزاری',
      icon: FileSpreadsheet,
      color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800'
    }
  ];

  return (
    <div
      dir="rtl"
      className="w-full min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans"
    >
      {/* 1. Academic Professor Header Banner */}
      <section className="shrink-0 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 border-b border-indigo-800/40 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/20">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>تاقیگەی نایابی پێداگۆجی (Pedagogical Excellence Hub)</span>
              <span className="text-[10px] bg-indigo-700/60 text-indigo-200 px-1.5 py-0.5 rounded-md">
                پۆلی ٩ تا ١٢
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
              ٥ پایەی زانستی بۆ فێربوونی قووڵ و ئامادەکاری وەزاری
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              لە دیدگای پڕۆفیسۆرێکی پێداگۆجی و ئەندازیاریی فێربوون: لێرەدا چەمکە تیۆرییەکان دەگۆڕدرێن بۆ لێهاتوویی چەسپاو لە ڕێگەی فێرکردنی ساویلکە، دیبەیتی سۆکراتی، ماتریکسی لایتنەر و هاوشێوەکاری دەروونی وەزاری.
            </p>

            {/* Grade selector pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-[11px] text-slate-400 font-bold ml-1">پۆلی خوێندن:</span>
              {[
                { id: "all", label: "گشت پۆلەکان (٩-١٢)" },
                { id: "9", label: "پۆلی ٩" },
                { id: "10", label: "پۆلی ١٠" },
                { id: "11", label: "پۆلی ١١" },
                { id: "12", label: "پۆلی ١٢" },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGrade(g.id as typeof selectedGrade)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedGrade === g.id
                      ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                      : "bg-white/10 hover:bg-white/20 text-slate-200"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onNavigateToPractice && (
              <button
                onClick={onNavigateToPractice}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>تاقیگەی پرسیارەکان</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {onNavigateToHome && (
              <button
                onClick={onNavigateToHome}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>گەڕانەوە بۆ سەرەتا</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Top Academic Quick Stats */}
        <div className="max-w-7xl mx-auto mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">مۆدێلی زانستی</span>
            <span className="font-black text-amber-300 text-sm">Protégé & Ebbinghaus</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">مەودای دووبارەکردنەوە</span>
            <span className="font-black text-emerald-300 text-sm">١، ٣، ٧، ١٦، ٣٥ ڕۆژ</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">چارەسەری هەڵە</span>
            <span className="font-black text-rose-300 text-sm">٤ پۆلێنی مێتاکۆگنیتیڤ</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">هاوشێوەکاری وەزاری</span>
            <span className="font-black text-teal-300 text-sm">سۆما + هەناسەی ٤-٧-٨</span>
          </div>
        </div>
      </section>

      {/* 3. Fast 5-Tab Navigation Bar */}
      <nav
        aria-label="پایەکانی فێربوونی پێداگۆجی"
        className="sticky top-0 z-30 shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs px-4 sm:px-6 py-3 overflow-x-auto no-scrollbar"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          {pillars.map((p) => {
            const Icon = p.icon;
            const isActive = activeTab === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : ''}`} />
                <div className="text-right">
                  <span className="block leading-none">{p.name}</span>
                  <span className={`text-[9px] font-normal block mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {p.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 4. Active Pillar Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 pb-28">
        {activeTab === 'feynman' && (
          <div className="space-y-6">
            <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 flex items-center justify-between text-xs text-indigo-950 dark:text-indigo-200">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <strong>پایەی ١: ستۆدیۆی چەمکسازی فاینمان</strong> — زانستیانە بسەلمێنە کە لێی تێگەیشتوویت بە ڕوونکردنەوەی بە زمانی سادە بۆ زانا.
              </span>
            </div>
            <FeynmanStudioView embedded={true} />
          </div>
        )}

        {activeTab === 'metacognitive' && (
          <div className="space-y-6">
            <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-center justify-between text-xs text-rose-950 dark:text-rose-200">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <strong>پایەی ٢: ڕاداری مێتاکۆگنیتیڤ و DNAی هەڵەکان</strong> — جیاکردنەوەی هەڵەی پەلەکردن و نەخوێندنەوە لە کەموکوڕی تێگەیشتنی چەمک.
              </span>
            </div>
            <ErrorDnaChart />
          </div>
        )}

        {activeTab === 'leitner' && (
          <div className="space-y-6">
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-950 dark:text-emerald-200">
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <strong>پایەی ٣: ماتریکسی لایتنەری زیرەک</strong> — شیکردنەوەی خێرای ۳ خولەکی و ماتریکسی ٥ سندووقی بیرگەی درێژخایەن.
              </span>
            </div>
            {/* Daily flash card challenge embedded right inside */}
            <div className="max-w-xl mx-auto">
              <MicroRetrievalFlashCard />
            </div>
            <LeitnerMatrixVisualizer />
          </div>
        )}

        {activeTab === 'dialectic' && (
          <div className="space-y-6">
            <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-950 dark:text-amber-200">
              <span className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <strong>پایەی ٤: مەیدانی دیبەیتی سۆکراتی</strong> — ڕووبەڕووبوونەوەی بۆچوونە هەڵە باوەکانی پڕۆگرام بەرامبەر بەرەی دژبەری زانستی.
              </span>
            </div>
            <DebateArenaView embedded={true} />
          </div>
        )}

        {activeTab === 'soma' && (
          <div className="space-y-6">
            <div className="bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl p-4 flex items-center justify-between text-xs text-teal-950 dark:text-teal-200">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <strong>پایەی ٥: هاوشێوەکاری تاقیکردنەوەی سۆما</strong> — پەڕەی فەرمی ٥٠ پرسیاری سۆمای کوردستان، چاودێری کات و هەناسەدانی هۆشمەندانە.
              </span>
            </div>
            <SomaSheetSimulator embedded={true} />
          </div>
        )}
      </main>
    </div>
  );
};

export default PedagogicalHubScreen;
