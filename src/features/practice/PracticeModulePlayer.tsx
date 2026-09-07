import React, { useState } from "react";
import { PracticeModule, PracticeBadge } from "./practiceTypes.ts";
import { PracticeStorage } from "./practiceStorage.ts";
import { StepByStepSolver } from "./components/StepByStepSolver.tsx";
import { InteractiveDiagramViewer } from "./components/InteractiveDiagramViewer.tsx";
import { ScienceVirtualLab } from "./components/ScienceVirtualLab.tsx";
import { GamifiedQuizPlayer } from "./components/GamifiedQuizPlayer.tsx";
import { ArrowRight, Zap, Trophy, Calculator, Atom, Flame, Languages, CheckCircle2 } from "lucide-react";

interface PracticeModulePlayerProps {
  module: PracticeModule;
  onExit: () => void;
  onProgressUpdated: () => void;
}

export const PracticeModulePlayer: React.FC<PracticeModulePlayerProps> = ({
  module,
  onExit,
  onProgressUpdated
}) => {
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<PracticeBadge[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const getSubjectIcon = () => {
    switch (module.subject) {
      case "math":
        return <Calculator className="w-4 h-4 text-blue-600" />;
      case "physics":
        return <Flame className="w-4 h-4 text-amber-500" />;
      case "chemistry":
        return <Atom className="w-4 h-4 text-emerald-500" />;
      case "english":
        return <Languages className="w-4 h-4 text-indigo-500" />;
      default:
        return <Calculator className="w-4 h-4 text-slate-500" />;
    }
  };

  const getFormatLabel = () => {
    switch (module.moduleType) {
      case "step_solver":
        return "شیکارکەری هەنگاو بە هەنگاو";
      case "interactive_diagram":
        return "دیاگرامی کارلێککار";
      case "virtual_lab":
        return "تاقیگەی مەجازی";
      case "gamified_quiz":
        return "یاریی پرسیار و خاڵبەندی";
    }
  };

  const handleModuleFinished = (score: number, maxScore: number) => {
    const { newlyUnlockedBadges: badges } = PracticeStorage.recordModuleCompletion(
      module.id,
      module.xpReward,
      score,
      maxScore,
      module.badgeAwardId
    );

    setIsCompleted(true);
    setNewlyUnlockedBadges(badges);
    onProgressUpdated();
  };

  return (
    <div className="space-y-4 pb-12 flex-1 flex flex-col justify-start" dir="rtl">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>گەڕانەوە بۆ ڕاهێنانەکان</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            +{module.xpReward} XP
          </span>
        </div>
      </div>

      {/* Module Title Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
            {getSubjectIcon()}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {getFormatLabel()}
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              پۆلی {module.grade}
            </span>
          </div>
        </div>

        <h2 className="font-bold text-base text-slate-900 leading-snug">
          {module.titleKu}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {module.subtitleKu}
        </p>
      </div>

      {/* Newly Unlocked Badges Celebration Banner */}
      {isCompleted && newlyUnlockedBadges.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 animate-bounce">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>پیرۆزە! مەدالیای نوێت بەدەستهێنا:</span>
          </div>
          {newlyUnlockedBadges.map((b) => (
            <div key={b.id} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-amber-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">{b.titleKu}</p>
                <p className="text-[10px] text-slate-500">{b.descriptionKu}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Format Component */}
      {module.moduleType === "step_solver" && module.stepSolverData && (
        <StepByStepSolver data={module.stepSolverData} onComplete={handleModuleFinished} />
      )}

      {module.moduleType === "interactive_diagram" && module.diagramData && (
        <InteractiveDiagramViewer data={module.diagramData} onComplete={handleModuleFinished} />
      )}

      {module.moduleType === "virtual_lab" && module.virtualLabData && (
        <ScienceVirtualLab data={module.virtualLabData} onComplete={handleModuleFinished} />
      )}

      {module.moduleType === "gamified_quiz" && module.gamifiedQuizData && (
        <GamifiedQuizPlayer data={module.gamifiedQuizData} onComplete={handleModuleFinished} />
      )}
    </div>
  );
};
