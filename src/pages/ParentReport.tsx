import React, { useState } from "react";
import {
  Download,
  Mail,
  Printer,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  RefreshCw,
  Share2,
  Copy,
  Check,
  X,
  Send,
  MessageCircle
} from "lucide-react";
import { StudentProfile } from "../features/student/studentTypes.ts";
import { useStudentProfile } from "../features/student/useStudentProfile.ts";
import { useAppStore } from "../store/appStore.ts";

export interface ParentReportProps {
  profile?: StudentProfile;
}

export function ParentReport({ profile: propProfile }: ParentReportProps = {}) {
  const { profile: hookProfile } = useStudentProfile();
  const currentProfile = propProfile || hookProfile;
  const user = useAppStore((state) => state.user);

  const studentName = currentProfile?.name || user.name || "قوتابی";
  const studentGrade = currentProfile?.grade || user.grade || "12";
  const streamLabel = (currentProfile?.stream || user.stream) === "scientific" ? "زانستی" : "وێژەیی (لە ماوەی داهاتوو کارا دەبێت ⏳)";
  const activeSubjectLabel = currentProfile?.activeSubject === "chemistry" ? "کیمیا" : currentProfile?.activeSubject === "physics" ? "فیزیا" : "کیمیا و فیزیا";

  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportId] = useState(() => "ZN-2026-" + Math.random().toString(36).substring(2, 8).toUpperCase());

  const getShareText = () => {
    return (
      `سڵاو،\n\n` +
      `ئەمە کورتەی ڕاپۆرتی پێشکەوتنی قوتابی (${studentName})یە لە پلاتفۆرمی زانا بۆ پۆلی ${studentGrade}ی ${streamLabel}:\n` +
      `• بابەتی تەرکیز: ${activeSubjectLabel}\n` +
      `• نمرەی تێکڕا: 82% (ئاستی باڵا)\n` +
      `• کاتژمێرەکانی خوێندن: ١٨.٥ کاتژمێر\n` +
      `• بەردەوامی: ١٢ ڕۆژ لەسەریەک\n` +
      `• ناسنامەی فەرمی: ${reportId}\n\n` +
      `دەتوانن تەواوی شیکارییە ئەکادیمییەکە لە پلاتفۆرمی زانا ببینن.`
    );
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      setDownloadNotice("دەقی ڕاپۆرتەکە کۆپی کرا! ئێستا دەتوانیت لە هەر جێگەیەک پەیستی بکەیت.");
      setTimeout(() => {
        setCopied(false);
        setDownloadNotice(null);
      }, 4000);
    } catch {
      setDownloadNotice("هەڵەیەک ڕوویدا لە کۆپیکردن. تکایە دەقەکە دەستنیشان بکە و کۆپی بکە.");
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    setIsShareModalOpen(false);
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://t.me/share/url?url=https://zana.idggov.tech&text=${text}`, "_blank");
    setIsShareModalOpen(false);
  };

  const handleSendEmail = () => {
    // Copy text first to prevent data loss if Mail client fails (e.g. iCloud quota full)
    void handleCopyText();
    const subject = encodeURIComponent(`ڕاپۆرتی هوشیاری باوان - قوتابی ${studentName}`);
    const body = encodeURIComponent(getShareText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setIsShareModalOpen(false);
  };

  const handleDownloadPdf = () => {
    setDownloadNotice("ڕاپۆرتی فەرمی ئامادە کرا؛ ئێستا دەتوانیت وەک PDF پاشەکەوتی بکەیت.");
    setTimeout(() => {
      window.print();
      setDownloadNotice(null);
    }, 600);
  };

  const handlePrint = () => {
    window.print();
  };

  const subjects = [
    { name: "کیمیا (Chemistry)", score: 70, note: "پێویستی بە کارکردنە لەسەر کیمیای ئەندامی" },
    { name: "فیزیا (Physics)", score: 80, note: "ئاستێکی زۆر باش و بەهێز لە میکانیک" },
    { name: "بیرکاری (Mathematics)", score: 60, note: "تەرکیزی زیاتر لەسەر جیاکاری و تەواوکاری" },
    { name: "زیندەوەرزانی (Biology)", score: 90, note: "نایاب و بێ کەموکوڕی" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full" dir="rtl">
      {/* Header - Optimized for responsive split-screen and mobile */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1.5 flex-1 min-w-0">
          <span className="inline-block text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
            ڕاپۆرتی هوشیاری باوان (Parent Intelligence) 📊
          </span>
          <h1 className="font-sans font-black text-xl sm:text-2xl text-slate-900 dark:text-slate-100 leading-snug">
            ڕاپۆرتی مانگانەی پێشکەوتن و خاڵە لاوازەکان
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            شیکاری وردی ژیریی دەستکردی زانا بۆ هاوکاریکردنی خێزان لە چاودێری ئاستی ئەکادیمی
          </p>
        </div>

        {/* Action Export Buttons + Report ID Badge */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Internal Report ID Badge */}
          <div className="flex items-center gap-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 px-3.5 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 block uppercase font-mono leading-none">ناسنامەی ناوخۆ</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono leading-tight">{reportId}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setIsRefreshing(true);
              setTimeout(() => {
                setIsRefreshing(false);
                setDownloadNotice("ڕاپۆرتەکە بە سەرکەوتوویی نوێکرایەوە.");
                setTimeout(() => setDownloadNotice(null), 3000);
              }, 1000);
            }}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-sans font-bold text-xs px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            title="نوێکردنەوەی داتا"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span>نوێکردنەوە</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>داگرتنی ڕاپۆرت (PDF)</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-sans font-bold text-xs px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>ناردن و هاوبەشکردن</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-sans font-bold text-xs px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            title="چاپکردنی ڕاستەوخۆ"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>چاپکردن</span>
          </button>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-sans rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Share & Export Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 text-right border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Share2 className="w-5 h-5" />
                <h3 className="font-sans font-bold text-base text-slate-900 dark:text-slate-100">
                  هاوبەشکردنی ڕاپۆرتی پێشکەوتن
                </h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              کورتەی ڕاپۆرتەکە بە شێوازێکی جوان داڕێژراوە تا ڕاستەوخۆ بۆ مامۆستا یان خێزان بنێردرێت:
            </p>

            {/* Formatted Text Preview */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-sans space-y-1.5 max-h-40 overflow-y-auto">
              <p className="font-bold text-slate-900 dark:text-slate-100">ڕاپۆرتی هوشیاری باوان - قوتابی {studentName}</p>
              <p className="text-[11px] text-slate-500">پۆلی {studentGrade}ی {streamLabel} • بابەتی تەرکیز: {activeSubjectLabel}</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">تێکڕای بەدەستهاتوو: 82% • کاتژمێری خوێندن: ١٨.٥ کاتژمێر</p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">ناسنامەی ڕاپۆرت: {reportId}</p>
            </div>

            {/* Sharing Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {/* WhatsApp Button */}
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs transition cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>ناردن بە واتسئەپ (WhatsApp)</span>
              </button>

              {/* Telegram Button */}
              <button
                onClick={handleShareTelegram}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-sans font-bold text-xs transition cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>ناردن بە تێلێگرام (Telegram)</span>
              </button>

              {/* Copy to Clipboard */}
              <button
                onClick={handleCopyText}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-sans font-bold text-xs transition cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "کۆپی کرا!" : "کۆپیکردنی دەق"}</span>
              </button>

              {/* Email Client */}
              <button
                onClick={handleSendEmail}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-sans font-bold text-xs transition cursor-pointer border border-slate-200 dark:border-slate-700"
                title="ناردن بە بەرنامەی ئیمەیڵ"
              >
                <Mail className="w-4 h-4" />
                <span>کردنەوە لە ئیمەیڵ (Mail)</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-1 font-sans">
              تێبینی: کاتێک دەقی ڕاپۆرتەکە کۆپی دەکەیت، دەتوانیت لە هەر ئەپێکدا بە ئاسانی پەیستی بکەیت.
            </p>
          </div>
        </div>
      )}

      {/* Main Printable Sheet */}
      <div id="parent-report-print-sheet" className="bg-white border border-slate-200/80 shadow-xs rounded-3xl p-6 sm:p-8 space-y-6 text-slate-800 relative overflow-hidden">
        {/* Decorative blur backgrounds */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50/40 rounded-full blur-3xl pointer-events-none" />

        {/* 4-Field Student Dossier Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <div className="space-y-1 border-l border-slate-200/60 pl-2">
            <span className="font-sans text-[10px] text-slate-400 font-bold block">ناوی قوتابی</span>
            <span className="font-sans text-sm font-extrabold text-slate-900">{studentName}</span>
          </div>
          <div className="space-y-1 border-l border-slate-200/60 pl-2">
            <span className="font-sans text-[10px] text-slate-400 font-bold block">پۆل و قۆناغ</span>
            <span className="font-sans text-sm font-extrabold text-slate-900">پۆلی {studentGrade} - {streamLabel}</span>
          </div>
          <div className="space-y-1 border-l border-slate-200/60 pl-2">
            <span className="font-sans text-[10px] text-slate-400 font-bold block">بابەتی تەرکیز</span>
            <span className="font-sans text-sm font-extrabold text-indigo-700">{activeSubjectLabel}</span>
          </div>
          <div className="space-y-1">
            <span className="font-sans text-[10px] text-slate-400 font-bold block">ماوەی ڕاپۆرت</span>
            <span className="font-sans text-sm font-extrabold text-slate-900">ئۆکتۆبەر ٢٠٢٦</span>
          </div>
        </div>

        {/* 1. Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="font-sans font-bold text-base text-slate-900">
              پوختەی ڕاپۆرتی مانگی فێرکاری
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-sans">
            قوتابی: {studentName} • پۆلی {studentGrade}ی {streamLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-right">
            <span className="text-xs text-slate-500 font-sans block">کاتژمێرەکانی خوێندن</span>
            <span className="font-sans font-black text-xl text-indigo-700">١٨.٥ / ٢٠ کاتژمێر</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">٩٣٪ ئامانجی هەفتانە</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-right">
            <span className="text-xs text-slate-500 font-sans block">نمرەی تێکڕا</span>
            <span className="font-sans font-black text-xl text-slate-900">82%</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">↑ 5% بەرزبوونەوە</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-right">
            <span className="text-xs text-slate-500 font-sans block">بەردەوامی خوێندن</span>
            <span className="font-sans font-black text-xl text-amber-600">12 ڕۆژ</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">بەبێ پچڕان</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-right">
            <span className="text-xs text-slate-500 font-sans block">ئاستی فەرمی</span>
            <span className="font-sans font-black text-base text-emerald-700 mt-1 block">پێشکەوتوو (باڵا)</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">لە پێشەنگی پۆلی ١٢</span>
          </div>
        </div>
      </div>

      {/* 2. By-Subject Performance */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="font-sans font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
          ئاستی لێهاتوویی بەپێی بابەتەکان
        </h2>

        <div className="space-y-4">
          {subjects.map((subj, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="font-bold text-slate-900">{subj.name}</span>
                <span className="font-bold text-indigo-700">{subj.score}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    subj.score >= 80 ? "bg-emerald-600" : subj.score >= 70 ? "bg-indigo-600" : "bg-amber-500"
                  }`}
                  style={{ width: `${subj.score}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 font-sans">{subj.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Key Weaknesses & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weaknesses Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-sans font-bold text-sm text-slate-900">
              خاڵە لاوازە دەستنیشانکراوەکان (کەموکوڕییەکان)
            </h3>
          </div>

          <div className="space-y-2 text-xs font-sans text-slate-700 leading-relaxed">
            <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-1">
              <p className="font-bold text-rose-900">• کیمیای ئەندامی</p>
              <p className="text-slate-600">٤ وەڵامی دروست لە کۆی ٨ پرسیاری پێوانەیی.</p>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-1">
              <p className="font-bold text-amber-900">• جیاکاری و تەواوکاری</p>
              <p className="text-slate-600">٢ وەڵامی دروست لە کۆی ٥ پرسیاری سنوور و تەواوکاری.</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-900">• شیکاری کێشەی کیمیای کارەبایی</p>
              <p className="text-slate-600">پێویستە کاتی زیاتر لەسەر نیوە کارلێکی ئۆکسان و داڕزان تەرخان بکرێت.</p>
            </div>
          </div>
        </div>

        {/* AI Recommendations for Parents */}
        <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 rounded-2xl border border-indigo-100 p-6 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-700">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-sans font-bold text-sm text-slate-900">
                ڕاسپاردەی مامۆستا زانا بۆ دایک و باوکان
              </h3>
            </div>

            <div className="text-xs font-sans text-slate-700 leading-relaxed space-y-2 pt-1">
              <p className="bg-white p-3 rounded-xl border border-indigo-100">
                "قوتابی ئاستێکی فێربوونی زۆر باشی هەیە، بەڵام لە بەشی کیمیای ئەندامیدا پێویستی بە پێداچوونەوەی ڕاهێنانی زیاتر هەیە. پێشنیار دەکرێت ڕۆژانە ٢٠ خولەک لە بەشی ڕاهێنان پرسیار شیبکاتەوە."
              </p>
              <p className="bg-white p-3 rounded-xl border border-indigo-100">
                "بۆ ئەوەی متمانەی بەخۆی بەرزبێتەوە، دەتوانن لە کۆتایی هەفتەدا تاقیکردنەوەی خێرای پێنج پرسیاری لەگەڵدا تاقی بکەنەوە و گوێ لە شیکارەکەی بگرن."
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-indigo-100 text-[11px] text-slate-500 font-sans">
            دروستکراوە لە ڕێکەوتی ٢٣ی ئۆکتۆبەری ٢٠٢٦ لە ڕێگەی پلاتفۆرمی زانا
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default ParentReport;
