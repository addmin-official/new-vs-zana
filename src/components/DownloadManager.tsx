/**
 * ZANA Platform - Download Manager Component
 * Allows students to manage offline subjects, download bundles (curriculum, 100+ questions, AI responses),
 * track download progress, inspect storage metrics, and free up space.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Download,
  Trash2,
  HardDrive,
  CheckCircle2,
  Loader2,
  BookOpen,
  Calculator,
  Flame,
  Atom,
  Languages,
} from "lucide-react";
import {
  downloadSubject,
  deleteOfflineSubject,
  getOfflineSubjectDetails,
  getStorageUsage,
  requestPersistentStorage,
  OfflineSubjectSummary,
  StorageUsageReport,
} from "../offline/offlineManager.ts";
import { useStudentProfile } from "../features/student/useStudentProfile.ts";

export interface DownloadManagerProps {
  className?: string;
}

export const DownloadManager: React.FC<DownloadManagerProps> = ({ className = "" }) => {
  const { profile } = useStudentProfile();
  const currentGrade = profile?.grade || "12";

  const [subjects, setSubjects] = useState<OfflineSubjectSummary[]>([]);
  const [storageUsage, setStorageUsage] = useState<StorageUsageReport | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ percent: number; message: string }>({
    percent: 0,
    message: "",
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const list = await getOfflineSubjectDetails();
    setSubjects(list);
    const usage = await getStorageUsage();
    setStorageUsage(usage);
  }, []);

  useEffect(() => {
    void loadData();
    // Request persistent storage on mount
    void requestPersistentStorage();
  }, [loadData]);

  const handleDownload = async (subjectId: string) => {
    if (downloadingId) return;

    setDownloadingId(subjectId);
    setDownloadProgress({ percent: 5, message: "دەستپێکردنی ئامادەکاری..." });

    try {
      await downloadSubject(subjectId, currentGrade, (percent, message) => {
        setDownloadProgress({ percent, message });
      });

      setStatusMessage(`✅ داونلۆدی پڕۆگرامی ئۆفلاین بە سەرکەوتوویی تەواو بوو.`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error("Failed to download subject:", err);
      setStatusMessage("❌ کێشەیەک ڕوویدا لە کاتی داونلۆدکردندا.");
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setDownloadingId(null);
      setDownloadProgress({ percent: 0, message: "" });
      await loadData();
    }
  };

  const handleDelete = async (subjectId: string) => {
    try {
      await deleteOfflineSubject(subjectId);
      setStatusMessage("سڕینەوەی بابەت لە یادگە ئەنجامدرا.");
      setTimeout(() => setStatusMessage(null), 3000);
      await loadData();
    } catch (err) {
      console.error("Failed to delete subject:", err);
    }
  };

  const getSubjectIcon = (id: string) => {
    switch (id) {
      case "math":
        return <Calculator className="w-5 h-5 text-indigo-500" />;
      case "physics":
        return <Flame className="w-5 h-5 text-amber-500" />;
      case "chemistry":
        return <Atom className="w-5 h-5 text-emerald-500" />;
      case "english":
        return <Languages className="w-5 h-5 text-sky-500" />;
      default:
        return <BookOpen className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header & Storage Quota Banner */}
      <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                بەکارهێنانی ئۆفلاین و داونلۆدی پڕۆگرام
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                بابەتەکان داونلۆد بکە بۆ ئەوەی بەبێ بوونی ئینتەرنێت بخوێنیت و پرسیار شیکار بکەیت.
              </p>
            </div>
          </div>
        </div>

        {/* Storage Bar */}
        {storageUsage && (
          <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                یادگەی بەکارهاتوو: {storageUsage.usedMb} مێگابایت
              </span>
              <span className="text-slate-400">
                بەردەست: ~{storageUsage.availableMb} MB ({storageUsage.percent}٪ تێپەڕیوە)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  storageUsage.percent > 80 ? "bg-amber-500" : "bg-indigo-600"
                }`}
                style={{ width: `${Math.max(4, storageUsage.percent)}%` }}
              />
            </div>
            {storageUsage.isLowSpace && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                ⚠️ شوێنی یادگەی ئامێرەکەت کەمە. پێشنیار دەکەین بابەتە ناپێویستەکان بسڕیتەوە.
              </p>
            )}
          </div>
        )}

        {statusMessage && (
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold animate-in fade-in">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Subjects Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            لیستی بابەتەکانی پۆلی {currentGrade}
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {subjects.map((sub) => {
            const isDownloading = downloadingId === sub.subjectId;
            const isRecommended = true; // Current grade is recommended

            return (
              <div
                key={sub.subjectId}
                className={`p-4 rounded-2xl border transition-all duration-150 ${
                  sub.isDownloaded
                    ? "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60 shadow-xs"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getSubjectIcon(sub.subjectId)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {sub.subjectName}
                        </h4>
                        {isRecommended && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            پێشنیارکراو
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">
                        قەبارەی ئامادەکراو: ~{sub.estimatedSizeMb} MB
                      </span>
                    </div>
                  </div>

                  {sub.isDownloaded && !isDownloading && (
                    <span className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {/* Progress bar if downloading */}
                {isDownloading && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {downloadProgress.message}
                      </span>
                      <span>{downloadProgress.percent}٪</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-200"
                        style={{ width: `${downloadProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Bottom details & action button */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    {sub.isDownloaded ? (
                      <span>
                        {sub.conceptCount} وانە • {sub.questionCount} پرسیار
                      </span>
                    ) : (
                      <span>پڕۆگرام + ١٠٠ پرسیار + وەڵامی زانا</span>
                    )}
                  </div>

                  <div>
                    {sub.isDownloaded ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(sub.subjectId)}
                        disabled={isDownloading}
                        className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                        title="سڕینەوە بۆ کەمکردنەوەی یادگە"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>سڕینەوە</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDownload(sub.subjectId)}
                        disabled={Boolean(downloadingId)}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>داونلۆد بۆ ئۆفلاین</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DownloadManager;
