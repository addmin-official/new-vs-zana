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
  UserCheck,
  BookOpen,
  MessageSquare,
  HardDrive,
  Download,
  Eraser,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Terminal,
} from "lucide-react";

export interface VerifiedStudentPrivacyContext {
  name?: string;
  email?: string;
  schoolName?: string;
  grade?: string;
  stream?: string;
  isServerVerified?: boolean;
  syncError?: string | null;
}

interface DataPrivacySectionProps {
  profile: StudentProfile;
  masteryProfile: StudentMasteryProfile | null;
  verifiedContext?: VerifiedStudentPrivacyContext;
  canViewDeveloperDiagnostics?: boolean;
}

const STREAM_LABELS_KU: Record<string, string> = {
  scientific: "زانستی",
  literary: "وێژەیی",
  general: "گشتی",
};

const SUBJECT_LABELS_KU: Record<string, string> = {
  chemistry: "کیمیا",
  physics: "فیزیا",
  math: "بیرکاری",
  biology: "زیندەزانی",
  kurdish: "زمانی کوردی",
  arabic: "زمانی عەرەبی",
  english: "زمانی ئینگلیزی",
  islamic: "پەروەردەی ئیسلامی",
  science: "زانست",
};

export function DataPrivacySection({
  profile,
  masteryProfile,
  verifiedContext,
  canViewDeveloperDiagnostics = false,
}: DataPrivacySectionProps) {
  const [inventory, setInventory] = useState<DataInventorySnapshot>(() =>
    inspectUserDataInventory()
  );
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [confirmClearCache, setConfirmClearCache] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "info";
    text: string;
  } | null>(null);

  const refreshInventory = useCallback(() => {
    setInventory(inspectUserDataInventory());
  }, []);

  const resolvedName = (verifiedContext?.name || profile.name || "").trim();
  const resolvedEmail = (verifiedContext?.email || profile.email || "").trim();
  const resolvedSchool = (verifiedContext?.schoolName || profile.school || "").trim();
  const resolvedGrade = (verifiedContext?.grade || profile.grade || "").trim();
  const resolvedStream = (verifiedContext?.stream || profile.stream || "").trim();

  const streamLabel = STREAM_LABELS_KU[resolvedStream] || resolvedStream;
  const classificationText =
    resolvedGrade && streamLabel
      ? `پۆلی ${resolvedGrade} • ${streamLabel}`
      : resolvedGrade
      ? `پۆلی ${resolvedGrade}`
      : "دیاری نەکراوە";

  const activeSubjectText = profile.activeSubject
    ? SUBJECT_LABELS_KU[profile.activeSubject.toLowerCase()] || profile.activeSubject
    : "دیاری نەکراوە";

  const conceptCount = masteryProfile ? Object.keys(masteryProfile.conceptMasteries || {}).length : 0;
  const completedLessonsCount =
    typeof profile.completedLessons === "number" && profile.completedLessons > 0
      ? profile.completedLessons
      : null;

  const pedagogyCat = inventory.categories.find((c) => c.id === "pedagogy_chat");
  const cacheCat = inventory.categories.find((c) => c.id === "local_cache");

  const hasVerifiedServer = Boolean(verifiedContext?.isServerVerified ?? profile.authoritative);
  const syncStatusLabel = verifiedContext?.syncError
    ? "کێشە لە هاوکاتکردندا هەیە"
    : hasVerifiedServer
    ? "هاوکاتکراو لەگەڵ هەژمار"
    : "پێویستی بە دڵنیاکردنەوە هەیە";

  const storedDataSummary =
    inventory.totalBytes > 0
      ? formatBytesKu(inventory.totalBytes)
      : "داتای ئامێر بەردەست نییە";

  const cacheSizeSummary =
    inventory.cacheKeysCount > 0 && inventory.cacheBytes > 0
      ? formatBytesKu(inventory.cacheBytes)
      : "هیچ داتایەکی کاتی نییە";

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const result = await clearLocalCacheData();
      refreshInventory();
      setConfirmClearCache(false);

      if (result.clearedKeys === 0 && result.browserCachesCleared === 0) {
        setStatusMessage({
          type: "info",
          text: "کاشی کاتیی ئەم ئامێرە لە ئێستادا بەتاڵە. زانیاری پڕۆفایل و پێشکەوتنی خوێندنت پارێزراون.",
        });
      } else {
        setStatusMessage({
          type: "success",
          text: "کاشی کاتیی ئامێرەکەت بە سەرکەوتوویی پاککرایەوە. زانیارییە پاشەکەوتکراوەکانی هەژمارەکەت وەک خۆیان پارێزراون.",
        });
      }
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportData = () => {
    const { sizeBytes } = downloadUserDataAsJson(profile, masteryProfile);
    setStatusMessage({
      type: "success",
      text: `داتای بەردەستی ئەم ئامێرە بە فۆرماتی JSON داگیرا (${formatBytesKu(sizeBytes)}). تۆمارەکانی سەر سێرڤەر لەم فایلەدا نین.`,
    });
  };

  const studentCategories = [
    {
      id: "profile_prefs",
      title: "ناسنامە و پڕۆفایل",
      subtitle: "ناو، ئیمەیڵ، قوتابخانە",
      icon: UserCheck,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      details: [
        { label: "ناوی تەواو", value: resolvedName || "دیاری نەکراوە" },
        { label: "ئیمەیڵ", value: resolvedEmail || "دیاری نەکراوە" },
        { label: "قوتابخانە", value: resolvedSchool || "دیاری نەکراوە" },
        {
          label: "شوێنی هەڵگرتن",
          value: hasVerifiedServer
            ? "پارێزراوە لە هەژمارەکەتدا و بە پاککردنەوەی کاش ناسڕێتەوە"
            : "زانیارییەکانی پڕۆفایلی ئەم ئامێرە",
        },
      ],
    },
    {
      id: "study_progress",
      title: "پێشکەوتنی خوێندن",
      subtitle: "پۆل، بەش، پێشکەوتن و وانەکان",
      icon: BookOpen,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      details: [
        { label: "پۆل و لقی تۆمارکراو", value: classificationText },
        { label: "وانەی چالاک", value: activeSubjectText },
        {
          label: "ئاست و پێشکەوتنی وانەکان",
          value:
            conceptCount > 0
              ? `${conceptCount} چەمکی هەڵسەنگێندراو`
              : completedLessonsCount !== null
              ? `${completedLessonsCount} وانەی تەواوکراو`
              : "هێشتا تۆماری پێشکەوتن بەردەست نییە",
        },
      ],
    },
    {
      id: "pedagogy_chat",
      title: "چات و یارمەتیی زیرەکی دەستکرد",
      subtitle: "مێژووی گفتوگۆ و بەکارهێنان",
      icon: MessageSquare,
      iconColor: "text-violet-600 dark:text-violet-400",
      details: [
        {
          label: "تۆماری ناوخۆیی لەسەر ئەم ئامێرە",
          value:
            pedagogyCat && pedagogyCat.itemCount > 0
              ? `لەم ئامێرەدا تۆمارە ناوخۆییەکان هەن (${formatBytesKu(pedagogyCat.totalBytes)})`
              : "لە ئێستادا هیچ تۆمارێکی ناوخۆیی چات لەم ئامێرەدا نییە",
        },
        {
          label: "سنووری زانیاری",
          value: "ژمارەی کۆی گفتوگۆکانی سەر سێرڤەر لێرەدا هەژمار نەکراوە",
        },
      ],
    },
    {
      id: "local_cache",
      title: "کاش و داتای کاتی",
      subtitle: "زانیاریی کاتیی هەڵگیراو لەسەر ئامێرەکەت",
      icon: HardDrive,
      iconColor: "text-amber-600 dark:text-amber-400",
      isCache: true,
      details: [
        { label: "قەبارەی کاشی کاتی", value: cacheSizeSummary },
        {
          label: "کاریگەری پاککردنەوە",
          value:
            "پاککردنەوە تەنها فایلە کاتییەکانی ئەم ئامێرە دەسڕێتەوە و زانیاری هەژمارەکەت دەستکاری ناکات",
        },
      ],
    },
  ];

  return (
    <ZanaCard className="border-slate-200 dark:border-slate-800">
      <div className="space-y-5 text-right" dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  پاراستنی داتا و تایبەتمەندی
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-sans font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  پارێزراو
                </span>
              </div>
              <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-1">
                بزانە زانا چ زانیارییەکت هەڵدەگرێت و چۆن کۆنترۆڵی دەکەیت.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshInventory}
            title="نوێکردنەوەی زانیارییەکان"
            aria-label="نوێکردنەوەی زانیارییەکان"
            className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5">
          <div>
            <span className="block font-sans text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              زانیارییە هەڵگیراوەکان
            </span>
            <span className="font-sans font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5 block">
              {storedDataSummary}
            </span>
          </div>
          <div>
            <span className="block font-sans text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              دۆخی هاوکاتکردن
            </span>
            <span className="font-sans font-bold text-sm text-emerald-700 dark:text-emerald-400 mt-0.5 block">
              {syncStatusLabel}
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
                : "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Student-Friendly Data Categories */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-sans font-bold text-slate-700 dark:text-slate-300">
            <span>جۆرەکانی زانیاری</span>
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
              وشەی نهێنی و زانیارییە هەستیارەکان هەرگیز هەڵناگیرێن
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/40 overflow-hidden">
            {studentCategories.map((cat) => {
              const Icon = cat.icon;
              const isExpanded = expandedCategory === cat.id;
              return (
                <div key={cat.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1">
                      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cat.iconColor}`} />
                      <div className="space-y-0.5">
                        <span className="block font-sans font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {cat.title}
                        </span>
                        <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {cat.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {cat.isCache && (
                        <button
                          type="button"
                          onClick={() => setConfirmClearCache(true)}
                          className="text-[11px] font-sans font-semibold text-amber-700 dark:text-amber-400 hover:underline px-2 min-h-[36px] cursor-pointer"
                        >
                          پاککردنەوە
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                        aria-expanded={isExpanded}
                        className="text-[11px] font-sans font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 min-h-[36px] px-2 cursor-pointer"
                      >
                        <span>{isExpanded ? "شاردنەوە" : "وردەکاری"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2 pr-6">
                      {cat.details.map((row) => (
                        <div
                          key={row.label}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 text-xs font-sans"
                        >
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {row.label}:
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-semibold">
                            {row.value}
                          </span>
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
              پاککردنەوەی کاش تەنها داتا کاتییەکان و کاشی وێبگەڕ لەسەر ئەم ئامێرە دەسڕێتەوە؛ ناسنامەی قوتابی، پۆل، و زانیارییە پاشەکەوتکراوەکانت لەسەر هەژمارەکەت بە پارێزراوی دەمێننەوە.
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

        {/* Controls Section */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs font-sans font-bold text-slate-700 dark:text-slate-300">
            <span>کۆنترۆڵی داتاکانت</span>
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
              بەڕێوەبردن
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ZanaButton
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setConfirmClearCache(true)}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Eraser className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>پاککردنەوەی کاش</span>
            </ZanaButton>

            <ZanaButton
              type="button"
              variant="secondary"
              fullWidth
              onClick={handleExportData}
              className="flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>داگرتنی داتای بەردەست</span>
            </ZanaButton>
          </div>

          <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5">
            داگرتنی داتای بەردەست تەنها زانیارییەکانی پڕۆفایل، پێشکەوتن، و تۆمارە ناهەستیارەکانی سەر ئەم ئامێرە دەگرێتەوە؛ تۆمارەکانی سەر سێرڤەر (وەک بەشداریکردن و پسووڵەی پارەدان) لەم فایلەدا نین.
          </p>
        </div>

        {/* Authorized Developer/Admin Diagnostics Tier Only */}
        {canViewDeveloperDiagnostics && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => setShowDiagnostics((v) => !v)}
              className="text-[11px] font-mono text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 cursor-pointer"
              dir="ltr"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showDiagnostics ? "Hide Developer Diagnostics" : "Developer Diagnostics"}</span>
            </button>

            {showDiagnostics && (
              <div
                className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-2"
                dir="ltr"
              >
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1">
                  <span>Storage Inventory ({inventory.totalKeys} keys • Read-Only Local Inspection)</span>
                  <span>
                    Cache: {cacheCat?.itemCount ?? 0} ({formatBytesKu(inventory.cacheBytes)})
                  </span>
                </div>
                {inventory.categories.map((cat) =>
                  cat.keys.map((entry) => (
                    <div key={entry.key} className="flex items-center justify-between gap-2">
                      <span className="truncate">{entry.key}</span>
                      <span className="text-slate-400 shrink-0">
                        {cat.id} • {formatBytesKu(entry.bytes)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ZanaCard>
  );
}
