import React from "react";
import { BookOpen, ChevronLeft } from "lucide-react";
import { ChapterOutlineItem } from "../features/chat/ChatSidebar.tsx";

export interface ChapterSidebarProps {
  chapters: ChapterOutlineItem[];
  activeChapterId: number | null;
  onSelectChapter: (id: number) => void;
  className?: string;
  subjectTitle?: string;
}

export function ChapterSidebar({
  chapters,
  activeChapterId,
  onSelectChapter,
  className = "",
  subjectTitle,
}: ChapterSidebarProps) {
  return (
    <aside
      className={`w-full lg:w-[280px] bg-white border-l border-slate-200 flex flex-col h-full shrink-0 ${className}`}
      dir="rtl"
    >
      {/* Title */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-sans font-bold text-sm text-slate-900">
            {subjectTitle || "بەندەکانی خوێندن"}
          </h3>
          <p className="font-sans text-[11px] text-slate-400">
            پەڕتووکی خوێندنی فەرمی
          </p>
        </div>
        <span className="text-xs bg-indigo-50 text-indigo-700 font-sans font-bold px-2 py-0.5 rounded-full">
          {chapters.length} بەند
        </span>
      </div>

      {/* Chapter List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {chapters.map((chapter) => {
          const isActive = activeChapterId === chapter.id;
          return (
            <button
              key={chapter.id}
              onClick={() => onSelectChapter(chapter.id)}
              className={`w-full text-right p-3 rounded-xl flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BookOpen
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-white" : "text-blue-600"
                  }`}
                />
                <div className="truncate">
                  <p className="font-sans text-xs font-bold truncate">
                    بەندی {chapter.id}: {chapter.title}
                  </p>
                  {chapter.pages && (
                    <p
                      className={`text-[10px] mt-0.5 truncate font-sans ${
                        isActive ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      لاپەڕە {chapter.pages}
                    </p>
                  )}
                </div>
              </div>
              <ChevronLeft
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-white" : "text-slate-300"
                }`}
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default ChapterSidebar;
