import React, { useEffect, useState } from "react";
import { BookOpen, ChevronLeft, X, Layers } from "lucide-react";
import { LoadingDots } from "../../components/LoadingDots.tsx";

import {
  ChapterOutlineItem,
  FALLBACK_CHEMISTRY_CHAPTERS,
  FALLBACK_PHYSICS_CHAPTERS,
  FALLBACK_MATH_CHAPTERS,
  FALLBACK_ENGLISH_CHAPTERS,
  getChapterOutlineForSubject,
} from "../../curriculum/data/chapterOutlines.ts";

export {
  type ChapterOutlineItem,
  FALLBACK_CHEMISTRY_CHAPTERS,
  FALLBACK_PHYSICS_CHAPTERS,
  FALLBACK_MATH_CHAPTERS,
  FALLBACK_ENGLISH_CHAPTERS,
  getChapterOutlineForSubject,
};

export interface ChatSidebarProps {
  subject?: string;
  grade?: string;
  selectedChapterId?: number | null;
  onSelectChapter: (chapter: ChapterOutlineItem) => void;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function ChatSidebar({
  subject = "chemistry",
  grade = "12",
  selectedChapterId,
  onSelectChapter,
  isOpen = true,
  onClose,
  className = "",
}: ChatSidebarProps) {
  const [chapters, setChapters] = useState<ChapterOutlineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const defaultFallback =
    subject.toLowerCase() === "physics"
      ? FALLBACK_PHYSICS_CHAPTERS
      : subject.toLowerCase() === "math" || subject.toLowerCase() === "mathematics"
      ? FALLBACK_MATH_CHAPTERS
      : subject.toLowerCase() === "english"
      ? FALLBACK_ENGLISH_CHAPTERS
      : FALLBACK_CHEMISTRY_CHAPTERS;

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/curriculum/${encodeURIComponent(subject)}/${encodeURIComponent(grade)}/outline`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json() as Promise<ChapterOutlineItem[]>;
      })
      .then((data: ChapterOutlineItem[]) => {
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setChapters(data);
          } else {
            setChapters(defaultFallback);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("[ChatSidebar] Failed to load outline from API, using fallback:", err);
        if (isMounted) {
          setChapters(defaultFallback);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [subject, grade, defaultFallback]);

  if (!isOpen) {
    return null;
  }

  const chapterCountLabel =
    subject.toLowerCase() === "physics"
      ? "٩ بەندی فەرمیی پەڕتووکی خوێندن"
      : `${chapters.length > 0 ? chapters.length : 12} بەندی فەرمیی پەڕتووکی خوێندن`;

  return (
    <aside
      className={`bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full w-full md:w-80 shrink-0 z-30 transition-all ${className}`}
      dir="rtl"
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-100">
              بەندەکانی پڕۆگرام
            </h3>
            <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
              {chapterCountLabel}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="داخستن"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Chapters List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <LoadingDots />
            <span className="font-sans text-xs">بارکردنی بەندەکان...</span>
          </div>
        )}

        {!loading && chapters.length === 0 && (
          <div className="p-4 text-center text-slate-400 font-sans text-xs">
            هیچ بەندێک نەدۆزرایەوە.
          </div>
        )}

        {!loading &&
          chapters.map((chapter) => {
            const isSelected = selectedChapterId === chapter.id;
            return (
              <button
                key={chapter.id}
                onClick={() => onSelectChapter(chapter)}
                className={`w-full text-right p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-100 shadow-xs"
                    : "bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {chapter.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-sans font-bold text-xs truncate">
                      بەندی {chapter.id}: {chapter.title}
                    </p>
                    <ChevronLeft
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? "text-blue-600 rotate-90" : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  </div>
                  {chapter.pages && (
                    <p className="font-sans text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span>لاپەڕە {chapter.pages}</span>
                    </p>
                  )}
                </div>
              </button>
            );
          })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] text-slate-400 text-center font-sans">
        پۆلی {grade} • سەرچاوەی فەرمی وەزارەت
      </div>
    </aside>
  );
}
export default ChatSidebar;
