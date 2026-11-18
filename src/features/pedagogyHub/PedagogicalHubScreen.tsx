import React, { useState } from "react";
import { PedagogicalPillarKey } from "./pedagogyTypes.ts";
import { FeynmanStudioComponent } from "./components/FeynmanStudioComponent.tsx";
import { MetacognitiveDiagnosticsComponent } from "./components/MetacognitiveDiagnosticsComponent.tsx";
import { LeitnerMatrixComponent } from "./components/LeitnerMatrixComponent.tsx";
import { DialecticDebateComponent } from "./components/DialecticDebateComponent.tsx";
import { SomaStressSimulatorComponent } from "./components/SomaStressSimulatorComponent.tsx";
import {
  GraduationCap,
  Sparkles,
  Brain,
  Layers,
  Swords,
  FileSpreadsheet,
  ArrowRight
} from "lucide-react";

interface PedagogicalHubScreenProps {
  onBack?: () => void;
  initialPillar?: PedagogicalPillarKey;
}

export const PedagogicalHubScreen: React.FC<PedagogicalHubScreenProps> = ({
  onBack,
  initialPillar = "feynman"
}) => {
  const [activePillar, setActivePillar] = useState<PedagogicalPillarKey>(initialPillar);

  const pillars = [
    {
      key: "feynman" as PedagogicalPillarKey,
      title: "١. ستۆدیۆی فاینمان",
      subtitle: "فێربە بە فێرکردن",
      icon: Sparkles,
      color: "text-amber-500",
      activeBg: "bg-amber-500 text-white"
    },
    {
      key: "metacognitive" as PedagogicalPillarKey,
      title: "٢. مێتاکۆگنیشن",
      subtitle: "شیکاری هۆکاری هەڵە",
      icon: Brain,
      color: "text-indigo-500",
      activeBg: "bg-indigo-600 text-white"
    },
    {
      key: "leitner" as PedagogicalPillarKey,
      title: "٣. ماتریکسی لایتنەر",
      subtitle: "تێکشکاندنی لەبیرچوونەوە",
      icon: Layers,
      color: "text-emerald-500",
      activeBg: "bg-emerald-600 text-white"
    },
    {
      key: "debate" as PedagogicalPillarKey,
      title: "٤. دیبەیتی سۆکراتی",
      subtitle: "سەلماندنی ڕاستی بە بەڵگە",
      icon: Swords,
      color: "text-rose-500",
      activeBg: "bg-rose-600 text-white"
    },
    {
      key: "soma" as PedagogicalPillarKey,
      title: "٥. سۆما و کۆنترۆڵی سترێس",
      subtitle: "تاقیکردنەوەی وەزاری پۆلی ١٢",
      icon: FileSpreadsheet,
      color: "text-blue-500",
      activeBg: "bg-blue-600 text-white"
    }
  ];

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-start pb-12" dir="rtl">
      {/* Top Academic Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer text-slate-300"
                title="گەڕانەوە"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="font-sans font-black text-lg text-white">
              تاقیگەی نایابی پێداگۆجی (پۆلی ٩ تا ١٢)
            </h2>
          </div>
          <p className="font-sans text-xs text-blue-200/90 leading-relaxed max-w-2xl">
            ٥ تایبەتمەندییە پەروەردەییە داهێنەرەکە بۆ تێپەڕاندنی لەبەرکردنی ڕووت، زاڵبوون بەسەر بیرکردنەوە، و
            ئامادەکاری تاقیکردنەوە نیشتمانییەکان لەسەر بنەمای زانستی پێداگۆجی.
          </p>
        </div>

        <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800 px-3 py-1 rounded-full shrink-0">
          پێشنیاری پڕۆفیسۆری پەروەردە
        </span>
      </div>

      {/* 5 Pillars Quick Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {pillars.map((p) => {
          const Icon = p.icon;
          const isActive = activePillar === p.key;

          return (
            <button
              key={p.key}
              onClick={() => setActivePillar(p.key)}
              className={`p-3 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between min-h-[68px] ${
                isActive
                  ? `${p.activeBg} border-transparent shadow-sm`
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold text-xs">{p.title}</span>
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : p.color}`} />
              </div>
              <span className={`text-[10px] leading-tight ${isActive ? "text-white/80" : "text-slate-400"}`}>
                {p.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Pillar Area */}
      <div className="animate-fade-in">
        {activePillar === "feynman" && <FeynmanStudioComponent />}
        {activePillar === "metacognitive" && <MetacognitiveDiagnosticsComponent />}
        {activePillar === "leitner" && <LeitnerMatrixComponent />}
        {activePillar === "debate" && <DialecticDebateComponent />}
        {activePillar === "soma" && <SomaStressSimulatorComponent />}
      </div>
    </div>
  );
};
