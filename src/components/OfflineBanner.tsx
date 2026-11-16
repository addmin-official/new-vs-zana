/**
 * ZANA Platform - Offline Banner & Persistent Offline Indicator
 * Displays informative, non-intrusive transition notices and a persistent network badge.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  WifiOff,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  X,
  BookOpen,
} from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus.ts";
import { getOfflineSubjects, getStorageUsage, StorageUsageReport } from "../offline/offlineManager.ts";
import { subscribeSyncEvents, startSync } from "../offline/syncQueue.ts";

export const OfflineBanner: React.FC = React.memo(function OfflineBanner() {
  const { isOnline, pendingSync, lastOnlineAt } = useOnlineStatus();
  const [offlineSubjects, setOfflineSubjects] = useState<string[]>([]);
  const [bannerState, setBannerState] = useState<"hidden" | "offline_alert" | "restored_alert">("hidden");
  const [syncedCountNotice, setSyncedCountNotice] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [storageInfo, setStorageInfo] = useState<StorageUsageReport | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);

  const prevOnlineRef = useRef(isOnline);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor network transitions
  useEffect(() => {
    const prev = prevOnlineRef.current;

    if (prev && !isOnline) {
      // ONLINE -> OFFLINE
      void getOfflineSubjects().then(setOfflineSubjects);
      setBannerState("offline_alert");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setBannerState("hidden");
      }, 4000); // 4 seconds auto-dismiss
    } else if (!prev && isOnline) {
      // OFFLINE -> ONLINE
      setBannerState("restored_alert");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setBannerState("hidden");
      }, 3000); // 3 seconds auto-dismiss
    }

    prevOnlineRef.current = isOnline;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOnline]);

  // Listen to sync events for count notice
  useEffect(() => {
    return subscribeSyncEvents((evt) => {
      if (evt.type === "sync:complete" && evt.syncedCount && evt.syncedCount > 0) {
        setSyncedCountNotice(evt.syncedCount);
      }
    });
  }, []);

  const openStatusModal = async () => {
    const subs = await getOfflineSubjects();
    setOfflineSubjects(subs);
    const usage = await getStorageUsage();
    setStorageInfo(usage);
    setIsModalOpen(true);
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await startSync();
    setIsManualSyncing(false);
  };

  const formatLastOnline = (ts: number | null): string => {
    if (!ts) return "نەزانراو";
    const diffMin = Math.round((Date.now() - ts) / 60000);
    if (diffMin < 1) return "کەمێک لەمەوبەر";
    if (diffMin < 60) return `پێش ${diffMin} خولەک`;
    return new Date(ts).toLocaleTimeString("ckb");
  };

  return (
    <>
      {/* 1. Transition Banner (Amber on disconnect / Emerald on reconnect) */}
      {bannerState === "offline_alert" && (
        <div
          className="w-full bg-amber-500 text-slate-950 text-xs font-bold py-2 px-4 shadow-md flex items-center justify-between z-50 animate-in slide-in-from-top-full duration-200"
          dir="rtl"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
            <span>
              📡 ئینتەرنێت نییە — دەتوانیت بەردەوام بیت
              {offlineSubjects.length > 0 && (
                <span className="font-medium mr-1.5 opacity-90">
                  ({offlineSubjects.length} بابەت ئۆفلاین بەردەستە)
                </span>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBannerState("hidden")}
            className="text-slate-950/70 hover:text-slate-950 text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {bannerState === "restored_alert" && (
        <div
          className="w-full bg-emerald-600 text-white text-xs font-bold py-2 px-4 shadow-md flex items-center justify-between z-50 animate-in slide-in-from-top-full duration-200"
          dir="rtl"
          role="status"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>
              ✅ دووبارە پەیوەندی کرا — هاوکێشانەوە...
              {syncedCountNotice > 0 && ` (${syncedCountNotice} گۆڕانکاری هاوکێشانەوە کرا)`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBannerState("hidden")}
            className="text-white/80 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Persistent Offline Indicator Badge (Fixed subtle pill in corner) */}
      <button
        type="button"
        onClick={openStatusModal}
        className={`fixed top-3 left-3 z-40 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs backdrop-blur-md transition-all cursor-pointer border ${
          isOnline
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
            : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
        }`}
        title={isOnline ? "پەیوەندی ئۆنلاینە (بۆ زانیاری کلیک بکە)" : "دۆخی ئۆفلاین (بۆ زانیاری کلیک بکە)"}
        aria-label="دۆخی پەیوەندی"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
          }`}
        />
        <span>{isOnline ? "ئۆنلاین" : "ئۆفلاین"}</span>
        {pendingSync > 0 && (
          <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] flex items-center justify-center font-black">
            {pendingSync}
          </span>
        )}
      </button>

      {/* 3. Storage & Offline Details Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          dir="rtl"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-xl text-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                <span>دۆخی ئۆفلاین و یادگە</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Connection Status Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">پەیوەندی تۆڕ:</span>
                <span className={`font-bold ${isOnline ? "text-emerald-600" : "text-amber-500"}`}>
                  {isOnline ? "پەیوەستە (Online)" : "پچڕاوە (Offline)"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">دواین پەیوەندی:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatLastOnline(lastOnlineAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">گۆڕانکاریی چاوەڕوانکراو:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {pendingSync} بڕگە
                </span>
              </div>
            </div>

            {/* Storage Quota Meter */}
            {storageInfo && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>بەکارهێنانی یادگە:</span>
                  <span>{storageInfo.usedMb} مێگابایت ({storageInfo.percent}٪)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      storageInfo.percent > 80 ? "bg-amber-500" : "bg-indigo-600"
                    }`}
                    style={{ width: `${Math.max(5, storageInfo.percent)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>بەردەست: ~{storageInfo.availableMb} MB</span>
                  {storageInfo.isLowSpace && (
                    <span className="text-amber-500 font-bold">⚠️ شوێنی کەم ماوە</span>
                  )}
                </div>
              </div>
            )}

            {/* Offline Subjects List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                بابەتە ئامادەکراوەکانی ئۆفلاین:
              </span>
              {offlineSubjects.length === 0 ? (
                <div className="text-xs text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center">
                  هیچ بابەتێک بۆ ئۆفلاین دانەبەزێنراوە.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {offlineSubjects.map((subId) => (
                    <span
                      key={subId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 text-xs font-bold"
                    >
                      <BookOpen className="w-3 h-3 text-indigo-500" />
                      {subId}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isManualSyncing || !isOnline || pendingSync === 0}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? "animate-spin" : ""}`} />
                <span>هاوکێشانەوەی دەستی (Sync Now)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default OfflineBanner;
