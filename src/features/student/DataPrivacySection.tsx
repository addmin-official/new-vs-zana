import { useState, useCallback } from "react";
import { StudentProfile } from "../../services/storage.ts";
import { StudentMasteryProfile } from "../../learning/domain/MasteryTypes.ts";
import { ZanaCard } from "../../components/ZanaCard.tsx";
import { ZanaButton } from "../../components/ZanaButton.tsx";
import {
  inspectUserDataInventory,
  clearLocalCacheData,
  downloadUserDataAsJson,
  formatBytesKu,
  DataInventorySnapshot,
} from "../../services/dataPrivacyService.ts";
import {
  ShieldCheck,
  Database,
  Download,
  Eraser,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";

interface DataPrivacySectionProps {
  profile: StudentProfile;
  masteryProfile: StudentMasteryProfile | null;
}

export function DataPrivacySection({ profile, masteryProfile }: DataPrivacySectionProps) {
  const [inventory, setInventory] = useState<DataInventorySnapshot>(() =>
    inspectUserDataInventory()
  );
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [confirmClearCache, setConfirmClearCache] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "info";
    text: string;
  } | null>(null);

  const refreshInventory = useCallback(() => {
    setInventory(inspectUserDataInventory());
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const result = await clearLocalCacheData();
      refreshInventory();
      setConfirmClearCache(false);

      if (result.clearedKeys === 0 && result.browserCachesCleared === 0) {
        setStatusMessage({
          type: "info",
          text: "کاشی ناوخۆیی لە ئێستادا پاکە و هیچ داتایەکی کاتی نەدۆزرایەوە. زانیاری پڕۆفایل و پێشکەوتنەکانت پارێزراون.",
        });
      } else {
        setStatusMessage({
          type: "success",
          text: `کاشی ناوخۆیی بە سەرکەوتوویی پاککرایەوە (${result.clearedKeys} تۆمار، ${formatBytesKu(result.freedBytes)}). پڕۆفایل و پێشکەوتنی خوێندنت وەک خۆی مایەوە.`,
        });
      }
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportData = () => {
    const { fileName, sizeBytes } = downloadUserDataAsJson(profile, masteryProfile);
    setStatusMessage({
      type: "success",
      text: `داتاکانت بە سەرکەوتوویی هەناردە کران بۆ فایلی ${fileName} (${formatBytesKu(sizeBytes)}).`,
    });
  };

  return (
    <ZanaCard className="border-slate-200 dark:border-slate-800">
      <div className="space-y-4 text-right" dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 justify-start">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-100">
                بەکارهێنانی داتا و تایبەتمەندی (Data Usage &amp; Privacy)
              </h3>
              <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                شەفافییەتی تەواو لەسەر ئەو زانیارییانەی لەسەر ئامێرەکەت و هەژمارەکەت هەڵگیراون
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshInventory}
            title="نوێکردنەوەی لیستی داتا"
            aria-label="نوێکردنەوەی لیستی داتا"
            className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Strip (Zero-pill clean metrics) */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
          <div>
            <span className="block font-sans text-[10px] font-bold text-slate-500 dark:text-slate-400">
              کۆی تۆمارەکان
            </span>
            <span className="font-sans font-bold text-sm text-slate-900 dark:text-slate-100">
              {inventory.totalKeys} تۆمار
            </span>
          </div>
          <div>
            <span className="block font-sans text-[10px] font-bold text-slate-500 dark:text-slate-400">
              قەبارەی ناوخۆیی
            </span>
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
              {formatBytesKu(inventory.totalBytes)}
            </span>
          </div>
          <div>
            <span className="block font-sans text-[10px] font-bold text-slate-500 dark:text-slate-400">
              کاشی کاتی
            </span>
            <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-400">
              {inventory.cacheKeysCount} ({formatBytesKu(inventory.cacheBytes)})
            </span>
          </div>
        </div>

        {/* Status Feedback */}
        {statusMessage && (
          <div
            role="status"
            className={`p-3 rounded-xl border text-xs font-sans flex items-start gap-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Transparent Data Inventory List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-sans font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>وردەکاری داتا هەڵگیراوەکان</span>
            </span>
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
              بێ هەڵگرتنی وشەی نهێنی یان تۆکنی هەستیار
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/40 overflow-hidden">
            {inventory.categories.map((cat) => {
              const isExpanded = expandedCategory === cat.id;
              return (
                <div key={cat.id} className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans font-bold text-xs text-slate-900 dark:text-slate-100">
                          {cat.titleKu}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          {cat.subtitleEn}
                        </span>
                      </div>
                      <p className="font-sans text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {cat.descriptionKu}
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-[11px] font-sans text-slate-500 dark:text-slate-400">
                        <span>{cat.itemCount} تۆمار</span>
                        <span>•</span>
                        <span className="font-mono">{formatBytesKu(cat.totalBytes)}</span>
                        <span>•</span>
                        <span
                          className={
                            cat.isClearableAsCache
                              ? "text-amber-700 dark:text-amber-400 font-medium"
                              : "text-emerald-700 dark:text-emerald-400 font-medium"
                          }
                        >
                          {cat.retentionLabelKu}
                        </span>
                      </div>
                    </div>

                    {cat.keys.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                        className="text-[11px] font-sans font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0 min-h-[40px] px-2 cursor-pointer"
                      >
                        <span>{isExpanded ? "شاردنەوە" : "کلیلەکان"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {isExpanded && cat.keys.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      {cat.keys.map((entry) => (
                        <div
                          key={entry.key}
                          className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 py-0.5"
                        >
                          <span className="truncate max-w-[70%]" dir="ltr">
                            {entry.key}
                          </span>
                          <span>{formatBytesKu(entry.bytes)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inline Clear Cache Confirmation */}
        {confirmClearCache && (
          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 space-y-2.5">
            <p className="font-sans text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              پاککردنەوەی کاش تەنها داتا کاتییەکان و کاشی وێبگەڕ دەسڕێتەوە؛ ناسنامەی قوتابی، ڕێکخستنەکان، و پێشکەوتنی خوێندنت بە پارێزراوی دەمێننەوە.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmClearCache(false)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer min-h-[40px]"
              >
                پەشیمانبوونەوە
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={handleClearCache}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-sans font-bold cursor-pointer min-h-[40px] disabled:opacity-60"
              >
                {isClearing ? "پاکدەکرێتەوە..." : "بەڵێ، کاش پاکبکەرەوە"}
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <ZanaButton
            type="button"
            variant="outline"
            fullWidth
            onClick={() => setConfirmClearCache(true)}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Eraser className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>پاککردنەوەی کاش (Clear Cache)</span>
          </ZanaButton>

          <ZanaButton
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>هەناردنی داتاکانم (Export My Data)</span>
          </ZanaButton>
        </div>
      </div>
    </ZanaCard>
  );
}
