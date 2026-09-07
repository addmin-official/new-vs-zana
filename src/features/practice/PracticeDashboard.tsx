import React, { useState } from "react";
import { PRACTICE_MODULES } from "./practiceData.ts";
import { PracticeModule, SubjectType, PracticeModuleType } from "./practiceTypes.ts";
import { PracticeStorage } from "./practiceStorage.ts";
import { BadgesShowcaseModal } from "./components/BadgesShowcaseModal.tsx";
import {
  Flame,
  Zap,
  Trophy,
  Calculator,
  Atom,
  Languages,
  CheckCircle2,
  Clock,
  FlaskConical,
  HelpCircle,
  Play
} from "lucide-react";

interface PracticeDashboardProps {
  studentGrade: string;
  onSelectModule: (module: PracticeModule) => void;
}

export const PracticeDashboard: React.FC<PracticeDashboardProps> = ({
  studentGrade,
  onSelectModule
}) => {
  const [selectedGrade, setSelectedGrade] = useState<string>(studentGrade || "all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);

  const progress = PracticeStorage.getProgress();

  // Filter modules
  const filteredModules = PRACTICE_MODULES.filter((m) => {
    if (selectedGrade !== "all" && m.grade !== selectedGrade) return false;
    if (selectedSubject !== "all" && m.subject !== selectedSubject) return false;
    if (selectedFormat !== "all" && m.moduleType !== selectedFormat) return false;
    return true;
  });

  const getSubjectIcon = (subject: SubjectType) => {
    switch (subject) {
      case "math":
        return <Calculator className="w-4 h-4 text-blue-600" />;
      case "physics":
        return <Flame className="w-4 h-4 text-amber-500" />;
      case "chemistry":
        return <Atom className="w-4 h-4 text-emerald-500" />;
      case "english":
        return <Languages className="w-4 h-4 text-indigo-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getFormatBadge = (type: PracticeModuleType) => {
    switch (type) {
      case "step_solver":
        return {
          label: "هەنگاو بە هەنگاو",
          className: "bg-blue-50 text-blue-700 border-blue-200/60"
        };
      case "interactive_diagram":
        return {
          label: "دیاگرامی کارلێککار",
          className: "bg-sky-50 text-sky-700 border-sky-200/60"
        };
      case "virtual_lab":
        return {
          label: "تاقیگەی مەجازی",
          className: "bg-amber-50 text-amber-700 border-amber-200/60"
        };
      case "gamified_quiz":
        return {
          label: "یاریی پرسیار و خاڵبەندی",
          className: "bg-purple-50 text-purple-700 border-purple-200/60"
        };
    }
  };

  const currentLevel = Math.floor(progress.totalXp / 150) + 1;
  const xpInCurrentLevel = progress.totalXp % 150;

  return (
    <div id="practice-dashboard" className="space-y-5 pb-12 flex-1 flex flex-col justify-start" dir="rtl">
      {/* Badges Modal */}
      <BadgesShowcaseModal
        unlockedBadgeIds={progress.unlockedBadgeIds}
        isOpen={isBadgesModalOpen}
        onClose={() => setIsBadgesModalOpen(false)}
      />

      {/* Gamification Status Card */}
      <div className="bg-gradient-to-l from-blue-700 to-indigo-800 text-white rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </span>
            <div>
              <span className="text-[10px] text-blue-200 font-medium block">ئاستی {currentLevel}</span>
              <h3 className="font-bold text-sm text-white">{progress.totalXp} XP خاڵی ئەزموون</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-white/15 border border-white/20 rounded-xl px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
              <span>{progress.currentStreak} ڕۆژ</span>
            </span>

            <button
              onClick={() => setIsBadgesModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Trophy className="w-4 h-4" />
              <span>مەدالیاکان ({progress.unlockedBadgeIds.length})</span>
            </button>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-blue-200">
            <span>بەردەوامی تا ئاستی {currentLevel + 1}</span>
            <span>{xpInCurrentLevel} / 150 XP</span>
          </div>
          <div className="w-full bg-black/25 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-300 h-full rounded-full transition-all duration-300"
              style={{ width: `${(xpInCurrentLevel / 150) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Header Description */}
      <div className="text-right">
        <h2 className="font-sans font-black text-xl text-slate-900">
          ڕاهێنانی کارلێککارانەی زانا
        </h2>
        <p className="font-sans text-xs text-slate-500 mt-1 leading-relaxed">
          ئەزموونی فێربوون لە ڕێگەی شیکارکەری هەنگاو بە هەنگاو، دیاگرامی بینراو، تاقیگەی مەجازی و یاریی پڕ لە ڕکابەری.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="space-y-2.5">
        {/* Grade Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium no-scrollbar">
          {[
            { id: "all", label: "هەموو پۆلەکان" },
            { id: "9", label: "پۆلی ٩" },
            { id: "10", label: "پۆلی ١٠" },
            { id: "11", label: "پۆلی ١١" },
            { id: "12", label: "پۆلی ١٢" }
          ].map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGrade(g.id)}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer text-xs ${
                selectedGrade === g.id
                  ? "bg-slate-900 text-white font-bold"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium no-scrollbar">
          {[
            { id: "all", label: "هەموو بابەتەکان" },
            { id: "math", label: "بیرکاری", icon: Calculator },
            { id: "physics", label: "فیزیا", icon: Flame },
            { id: "chemistry", label: "کیمیا", icon: Atom },
            { id: "english", label: "ئینگلیزی", icon: Languages }
          ].map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer text-xs flex items-center gap-1.5 ${
                  selectedSubject === s.id
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Format Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium no-scrollbar">
          {[
            { id: "all", label: "هەموو جۆرەکان" },
            { id: "step_solver", label: "شیکاری هەنگاو بە هەنگاو" },
            { id: "interactive_diagram", label: "دیاگرام" },
            { id: "virtual_lab", label: "تاقیگە" },
            { id: "gamified_quiz", label: "یاری پرسیار" }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFormat(f.id)}
              className={`px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer text-[11px] ${
                selectedFormat === f.id
                  ? "bg-slate-200 text-slate-900 font-bold"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modules Count Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{filteredModules.length} مۆدیوڵی ڕاهێنان دۆزرایەوە</span>
      </div>

      {/* Modules List Grid */}
      <div className="space-y-3">
        {filteredModules.map((module) => {
          const isCompleted = progress.completedModuleIds.includes(module.id);
          const formatBadge = getFormatBadge(module.moduleType);

          return (
            <div
              key={module.id}
              className={`bg-white border rounded-2xl p-4 transition-all duration-200 space-y-3 shadow-xs hover:border-blue-300 ${
                isCompleted ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200"
              }`}
            >
              {/* Card Header: Subject, Format, Grade */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {getSubjectIcon(module.subject)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${formatBadge.className}`}>
                      {formatBadge.label}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      پۆلی {module.grade}
                    </span>
                  </div>
                </div>

                {isCompleted && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    تەواوکراوە
                  </span>
                )}
              </div>

              {/* Title & Subtitle */}
              <div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {module.titleKu}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {module.subtitleKu}
                </p>
              </div>

              {/* Footer Details & Action Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {module.estimatedMinutes} خولەک
                  </span>
                  <span className="flex items-center gap-1 font-bold text-amber-600">
                    <Zap className="w-3.5 h-3.5 fill-amber-500" />
                    +{module.xpReward} XP
                  </span>
                </div>

                <button
                  onClick={() => onSelectModule(module)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>{isCompleted ? "دووبارەکردنەوە" : "دەستپێکردن"}</span>
                  <Play className="w-3 h-3 fill-white" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredModules.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
            <FlaskConical className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">هیچ ڕاهێنانێک بۆ ئەم فلتەرە نەدۆزرایەوە</h4>
            <p className="text-xs text-slate-400">تکایە هەڵبژاردنی پۆل یان بابەتەکە بگۆڕە بۆ بینینی مۆدیوڵەکانی تر.</p>
          </div>
        )}
      </div>
    </div>
  );
};
