import React from "react";
import { ArrowLeft } from "lucide-react";
import { SubjectKey } from "../features/student/studentTypes.ts";
import { formatNumber } from "../i18n/i18n.ts";
import { SubjectIcon, getSubjectVisualTheme } from "./SubjectIcon.tsx";

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

export function getSubjectCustomIcon(subjectKey: string, sizeOrClassName: number | string = 28) {
  if (typeof sizeOrClassName === "string" && !/^\d+$/.test(sizeOrClassName)) {
    return <SubjectIcon subject={subjectKey} size={28} className={sizeOrClassName} />;
  }
  const sizeNum = typeof sizeOrClassName === "string" ? parseInt(sizeOrClassName, 10) : sizeOrClassName;
  return <SubjectIcon subject={subjectKey} size={sizeNum || 28} />;
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
  const theme = getSubjectVisualTheme(subjectKey);

  const cardLabel = `وانەی ${title}${chaptersCount ? `، ${formatNumber(chaptersCount)} بەش` : ""}، ئاستی زاڵبوون %${clampedProgress}`;

  return (
    <div
      onClick={() => onSelect(subjectKey as SubjectKey)}
      role="button"
      tabIndex={0}
      aria-label={cardLabel}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(subjectKey as SubjectKey);
        }
      }}
      className={`card-interactive group relative flex flex-col justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 focus-visible:ring-3 focus-visible:ring-indigo-500 rounded-3xl shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer select-none text-right min-h-[220px] touch-manipulation ${className}`}
      dir="rtl"
    >
      <div>
        {/* Header Icon in Soft Colored Circle + Chapter Count */}
        <div className="flex items-center justify-between mb-4">
          <div className={`w-14 h-14 rounded-full ${theme.bgLight} border ${theme.borderLight} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200 pointer-events-none`}>
            <SubjectIcon subject={subjectKey} size={40} />
          </div>

          {chaptersCount !== undefined && chaptersCount > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {formatNumber(chaptersCount)} بەش
            </span>
          )}
        </div>

        {/* Large Kurdish Subject Title */}
        <h3 className="font-sans font-black text-xl text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-150 leading-tight">
          {title}
        </h3>

        {fullName && fullName !== title && (
          <p className="font-sans text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-1">
            {fullName}
          </p>
        )}
      </div>

      {/* Mastery Progress Bar & Primary CTA */}
      <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-300">ئاستی زاڵبوون</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono text-xs">
              %{formatNumber(clampedProgress)}
            </span>
          </div>

          <div
            className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={clampedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`ئاستی بەرەوپێشچوون لە ${title}`}
          >
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full animate-progress-fill transition-all duration-300"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
        </div>

        {/* Single Primary Action Button with 48px touch target */}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(subjectKey as SubjectKey);
          }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 cursor-pointer min-h-[48px] touch-manipulation"
          aria-label={`${isStarted ? "بەردەوام بە لە" : "دەستپێبکە بە"} ${title}`}
        >
          <span>{isStarted ? "بەردەوام بە" : "دەستپێبکە"}</span>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default SubjectCard;
