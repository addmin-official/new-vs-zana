import React from "react";
import {
  FlaskConical,
  Atom,
  Calculator,
  Dna,
  BookOpen,
  Languages,
  Scroll,
  Landmark,
  Globe2,
  TrendingUp,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { SubjectKey } from "../features/student/studentTypes.ts";
import { formatNumber } from "../i18n/i18n.ts";

export interface SubjectCardProps {
  id: string;
  subjectKey: SubjectKey | string;
  title: string;
  fullName?: string;
  grade?: string;
  streamLabel?: string;
  chaptersCount?: number;
  masteryPercentage?: number; // 0 to 100
  onSelect: (subjectKey: SubjectKey) => void;
  className?: string;
}

export function getSubjectCustomIcon(subjectKey: string, className = "w-7 h-7") {
  const norm = subjectKey.toLowerCase();
  switch (norm) {
    case "chemistry":
      return <FlaskConical className={`${className} text-teal-600 dark:text-teal-400`} />;
    case "physics":
      return <Atom className={`${className} text-indigo-600 dark:text-indigo-400`} />;
    case "math":
    case "mathematics":
      return <Calculator className={`${className} text-blue-600 dark:text-blue-400`} />;
    case "biology":
      return <Dna className={`${className} text-emerald-600 dark:text-emerald-400`} />;
    case "english":
      return <Languages className={`${className} text-amber-600 dark:text-amber-400`} />;
    case "kurdish":
      return <BookOpen className={`${className} text-orange-600 dark:text-orange-400`} />;
    case "arabic":
      return <Scroll className={`${className} text-emerald-700 dark:text-emerald-400`} />;
    case "history":
      return <Landmark className={`${className} text-rose-600 dark:text-rose-400`} />;
    case "geography":
      return <Globe2 className={`${className} text-cyan-600 dark:text-cyan-400`} />;
    case "economy":
      return <TrendingUp className={`${className} text-violet-600 dark:text-violet-400`} />;
    case "sports":
      return <Activity className={`${className} text-sky-600 dark:text-sky-400`} />;
    default:
      return <BookOpen className={`${className} text-indigo-600 dark:text-indigo-400`} />;
  }
}

export function SubjectCard({
  subjectKey,
  title,
  fullName,
  chaptersCount,
  masteryPercentage = 0,
  onSelect,
  className = "",
}: SubjectCardProps) {
  const isStarted = masteryPercentage > 0;
  const clampedProgress = Math.min(100, Math.max(0, Math.round(masteryPercentage)));

  return (
    <div
      onClick={() => onSelect(subjectKey as SubjectKey)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(subjectKey as SubjectKey);
        }
      }}
      className={`card-interactive group relative flex flex-col justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-3xl shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer select-none text-right min-h-[220px] ${className}`}
      dir="rtl"
    >
      <div>
        {/* Header Icon + Chapter Count */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
            {getSubjectCustomIcon(subjectKey, "w-7 h-7")}
          </div>

          {chaptersCount !== undefined && chaptersCount > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {formatNumber(chaptersCount)} بەش
            </span>
          )}
        </div>

        {/* Large Kurdish Subject Title */}
        <h3 className="font-sans font-black text-xl text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-150 leading-tight">
          {title}
        </h3>

        {fullName && fullName !== title && (
          <p className="font-sans text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
            {fullName}
          </p>
        )}
      </div>

      {/* Mastery Progress Bar & Primary CTA */}
      <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400">ئاستی زاڵبوون</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono text-xs">
              %{clampedProgress}
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full animate-progress-fill transition-all duration-300"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
        </div>

        {/* Single Primary Action Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(subjectKey as SubjectKey);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 cursor-pointer min-h-[44px]"
        >
          <span>{isStarted ? "بەردەوام بە" : "دەستپێبکە"}</span>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
        </button>
      </div>
    </div>
  );
}

export default SubjectCard;
