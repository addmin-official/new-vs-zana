import React, { useState, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";

export interface StudentConceptMastery {
  studentId: string;
  studentName: string;
  scores: Record<string, number>; // conceptId -> score (0.0 to 1.0)
  averageScore: number;
}

export interface MasteryGridProps {
  students: StudentConceptMastery[];
  concepts: { id: string; titleKu: string }[];
  className?: string;
  title?: string;
}

export const MasteryGrid = React.memo(function MasteryGrid({
  students,
  concepts,
  className = "",
  title = "خشتەی لێهاتوویی پۆل (Class Mastery Matrix)",
}: MasteryGridProps) {
  const [sortBy, setSortBy] = useState<"lowest" | "highest" | "name">("lowest");
  const [hoveredCell, setHoveredCell] = useState<{
    studentName: string;
    conceptTitle: string;
    score: number;
  } | null>(null);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      if (sortBy === "lowest") return a.averageScore - b.averageScore;
      if (sortBy === "highest") return b.averageScore - a.averageScore;
      return a.studentName.localeCompare(b.studentName);
    });
  }, [students, sortBy]);

  const getTierBadge = (score: number) => {
    if (score < 0.35) {
      return {
        bg: "bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800",
        label: "سەرەتایی / لاواز",
      };
    }
    if (score < 0.7) {
      return {
        bg: "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800",
        label: "لە گەشەدایە",
      };
    }
    if (score < 0.85) {
      return {
        bg: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",
        label: "لێهاتوو (Proficient)",
      };
    }
    return {
      bg: "bg-emerald-600 text-white border-emerald-600 font-bold",
      label: "ماستەر (Mastered)",
    };
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4 ${className}`}
      dir="rtl"
    >
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-sans">
            {title}
          </h4>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">
            چاودێری دەستبەجێی ئاستی لێهاتوویی {students.length} قوتابی لەسەر {concepts.length} چەمکی سەرەکی
          </p>
        </div>

        {/* Sort & Legend */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-sans">
            <span className="text-[10px] text-slate-400 font-bold px-1 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              ڕیزبەندی:
            </span>
            <button
              type="button"
              onClick={() => setSortBy("lowest")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sortBy === "lowest"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              کەمترین نمرە
            </button>
            <button
              type="button"
              onClick={() => setSortBy("highest")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sortBy === "highest"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              بەرزترین نمرە
            </button>
          </div>
        </div>
      </div>

      {/* Legend Indicator */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-sans">
        <span className="font-bold">ڕەنگەکان:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-rose-200 border border-rose-300" />
          <span>&lt; ٣٥٪ (لاواز)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-amber-200 border border-amber-300" />
          <span>٣٥-٧٠٪ (لە گەشەدا)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-emerald-200 border border-emerald-300" />
          <span>٧٠-٨٥٪ (لێهاتوو)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-emerald-600 border border-emerald-600" />
          <span>&gt; ٨٥٪ (ماستەر)</span>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
              <th className="p-3 sticky right-0 bg-slate-50 dark:bg-slate-800/80 z-10 w-44">
                ناوی قوتابی
              </th>
              <th className="p-3 text-center w-20">تێکڕا</th>
              {concepts.map((concept) => (
                <th key={concept.id} className="p-3 text-center min-w-[110px] truncate">
                  {concept.titleKu}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
            {sortedStudents.map((st: StudentConceptMastery) => (
              <tr
                key={st.studentId}
                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* Student Name */}
                <td className="p-3 font-bold text-slate-800 dark:text-slate-100 sticky right-0 bg-white dark:bg-slate-900 z-10 border-l border-slate-100 dark:border-slate-800">
                  {st.studentName}
                </td>

                {/* Average Score */}
                <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white border-l border-slate-100 dark:border-slate-800">
                  {Math.round(st.averageScore * 100)}%
                </td>

                {/* Concept Scores */}
                {concepts.map((concept) => {
                  const score = st.scores[concept.id] ?? 0;
                  const tier = getTierBadge(score);
                  return (
                    <td key={concept.id} className="p-2 text-center">
                      <div
                        className={`py-1.5 px-2 rounded-xl border text-[11px] font-mono font-bold transition-transform hover:scale-105 cursor-pointer ${tier.bg}`}
                        onMouseEnter={() =>
                          setHoveredCell({
                            studentName: st.studentName,
                            conceptTitle: concept.titleKu,
                            score,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {Math.round(score * 100)}%
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating Active Inspector Detail */}
      {hoveredCell && (
        <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs font-sans animate-in fade-in">
          <div>
            <span className="font-bold text-amber-300">{hoveredCell.studentName}</span>
            <span className="text-slate-400"> لە چەمکی </span>
            <span className="font-bold text-white">{hoveredCell.conceptTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">نمرەی لێهاتوویی:</span>
            <span className="font-mono font-black text-amber-300 text-sm">
              {Math.round(hoveredCell.score * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export default MasteryGrid;
