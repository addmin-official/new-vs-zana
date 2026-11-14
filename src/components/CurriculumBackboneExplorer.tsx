import React, { useState } from "react";
import {
  BookOpen,
  Sparkles,
  Layers,
  Clock,
  ChevronDown,
  ChevronUp,
  Atom,
  Calculator,
  Zap,
  Dna,
  Languages,
  CheckCircle2,
  ArrowLeft,
  Landmark,
  Globe,
  TrendingUp,
} from "lucide-react";
import {
  CURRICULUM_BACKBONE,
  GradeCurriculumBackbone,
  CurriculumModuleSubject,
  CurriculumChapter,
} from "../curriculum/modules/CurriculumBackboneRegistry.ts";

export interface CurriculumBackboneExplorerProps {
  initialGrade?: "9" | "10" | "11" | "12";
  onSelectChapterForStudy?: (subject: string, chapter: CurriculumChapter) => void;
  className?: string;
}

export const CurriculumBackboneExplorer: React.FC<CurriculumBackboneExplorerProps> = ({
  initialGrade = "12",
  onSelectChapterForStudy,
  className = "",
}) => {
  const [selectedGrade, setSelectedGrade] = useState<"9" | "10" | "11" | "12">(initialGrade);
  const [streamFilter, setStreamFilter] = useState<"all" | "scientific" | "literary">("all");
  const currentBackbone: GradeCurriculumBackbone =
    CURRICULUM_BACKBONE[selectedGrade] || CURRICULUM_BACKBONE["12"];

  const filteredSubjects = currentBackbone.subjects.filter((s) => {
    if (streamFilter === "all") return true;
    if (s.stream === "both" || !s.stream) return true;
    return s.stream === streamFilter;
  });

  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string>(
    filteredSubjects[0]?.subjectKey || currentBackbone.subjects[0]?.subjectKey || "chemistry"
  );
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  const activeSubject: CurriculumModuleSubject =
    filteredSubjects.find((s) => s.subjectKey === selectedSubjectKey) ||
    filteredSubjects[0] ||
    currentBackbone.subjects[0];

  const getSubjectIcon = (key: string) => {
    switch (key) {
      case "chemistry":
        return <Atom className="w-5 h-5 text-indigo-600" />;
      case "math":
        return <Calculator className="w-5 h-5 text-blue-600" />;
      case "physics":
        return <Zap className="w-5 h-5 text-amber-500" />;
      case "biology":
        return <Dna className="w-5 h-5 text-emerald-600" />;
      case "english":
        return <Languages className="w-5 h-5 text-purple-600" />;
      case "history":
        return <Landmark className="w-5 h-5 text-amber-700" />;
      case "geography":
        return <Globe className="w-5 h-5 text-emerald-700" />;
      case "economy":
        return <TrendingUp className="w-5 h-5 text-blue-700" />;
      case "kurdish":
        return <BookOpen className="w-5 h-5 text-rose-600" />;
      case "arabic":
        return <Languages className="w-5 h-5 text-teal-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Grade Selector Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="font-sans font-black text-base text-slate-900">
              بڕبڕەی پشتی مەنهەجی فەرمی (پۆلەکانی ٩ تا ١٢)
            </h2>
          </div>
          <span className="text-xs text-indigo-700 bg-indigo-50 font-bold px-3 py-1 rounded-full border border-indigo-100">
            {currentBackbone.stageKu}
          </span>
        </div>

        {/* Grades Pill Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["12", "11", "10", "9"] as const).map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => {
                setSelectedGrade(grade);
                const nextBackbone = CURRICULUM_BACKBONE[grade];
                if (nextBackbone && nextBackbone.subjects[0]) {
                  setSelectedSubjectKey(nextBackbone.subjects[0].subjectKey);
                }
                setExpandedChapterId(null);
              }}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-sans ${
                selectedGrade === grade
                  ? "bg-indigo-600 text-white font-black shadow-xs border-indigo-600"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 font-bold"
              }`}
            >
              <span className="block text-sm">
                {grade === "12"
                  ? "پۆلی ١٢ (وەزاری)"
                  : grade === "11"
                  ? "پۆلی ١١"
                  : grade === "10"
                  ? "پۆلی ١٠"
                  : "پۆلی ٩ (وەزاری)"}
              </span>
            </button>
          ))}
        </div>

        {/* Stream Filter (for Grade 12) */}
        {selectedGrade === "12" && (
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setStreamFilter("all");
                setExpandedChapterId(null);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                streamFilter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              هەموو بابەتەکان
            </button>
            <button
              type="button"
              onClick={() => {
                setStreamFilter("scientific");
                setSelectedSubjectKey("chemistry");
                setExpandedChapterId(null);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                streamFilter === "scientific"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              بەشی زانستی
            </button>
            <button
              type="button"
              onClick={() => {
                setStreamFilter("literary");
                setSelectedSubjectKey("history");
                setExpandedChapterId(null);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                streamFilter === "literary"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              بەشی وێژەیی
            </button>
          </div>
        )}
      </div>

      {/* Subject Pills Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filteredSubjects.map((subj) => {
          const isSelected = subj.subjectKey === selectedSubjectKey;
          return (
            <button
              key={subj.subjectKey}
              type="button"
              onClick={() => {
                setSelectedSubjectKey(subj.subjectKey);
                setExpandedChapterId(null);
              }}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer font-sans ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              {getSubjectIcon(subj.subjectKey)}
              <span>{subj.titleKu}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {subj.totalChapters} بەش
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Subject Overview Header */}
      {activeSubject && (
        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 p-5 rounded-2xl border border-indigo-100 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-black text-lg text-slate-900 flex items-center gap-2">
              {getSubjectIcon(activeSubject.subjectKey)}
              <span>{activeSubject.titleKu}</span>
            </h3>
            <span className="text-xs font-bold text-slate-500 font-sans">
              کۆی بەندەکان: {activeSubject.chapters.length} بەندی پەسەندکراو
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
            {activeSubject.overviewKu}
          </p>
        </div>
      )}

      {/* Chapters Accordion List */}
      <div className="space-y-3">
        {activeSubject?.chapters.map((ch) => {
          const isExpanded = expandedChapterId === ch.id;
          return (
            <div
              key={ch.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? "border-indigo-300 shadow-md ring-1 ring-indigo-200"
                  : "border-slate-200 hover:border-slate-300 shadow-2xs"
              }`}
            >
              {/* Accordion Trigger */}
              <div
                onClick={() => setExpandedChapterId(isExpanded ? null : ch.id)}
                className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-mono font-bold flex items-center justify-center shrink-0 text-sm">
                    {ch.chapterNumber}
                  </span>
                  <div>
                    <h4 className="font-sans font-bold text-sm sm:text-base text-slate-900">
                      {ch.titleKu}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-sans mt-0.5">
                      <span>{ch.pageRangeKu}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {ch.estimatedHours} کاتژمێر
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      ch.ministerialExamWeight === "high"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {ch.ministerialExamWeight === "high"
                      ? "گرنگی زۆر لە وەزاری ⭐"
                      : "گرنگی مامناوەند"}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Accordion Expanded Content */}
              {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/50 space-y-4 font-sans text-xs sm:text-sm">
                  <p className="text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80">
                    {ch.descriptionKu}
                  </p>

                  {/* Key Concepts Grid */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-900 text-xs block">
                      چەمک و تیۆرمە سەرەکییەکان:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ch.keyConceptsKu.map((concept, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2 text-xs text-slate-800"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{concept}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Practical Skills */}
                  {ch.practicalSkillsKu.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-bold text-indigo-900 text-xs block">
                        کارامەییە پراکتیکی و شیکارییەکان:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pr-1">
                        {ch.practicalSkillsKu.map((skill, sIdx) => (
                          <li key={sIdx}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action CTA */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onSelectChapterForStudy?.(activeSubject.subjectKey, ch)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>دەستپێکردنی خوێندن و شیکار لەگەڵ زانا</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
