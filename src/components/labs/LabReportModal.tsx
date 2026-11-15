import React, { useState } from "react";
import {
  FileText,
  Download,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
} from "lucide-react";
import { LabReportTemplate } from "./labTypes.ts";

export interface LabReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LabReportTemplate | null;
}

export const LabReportModal: React.FC<LabReportModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(report, null, 2);
    void navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lab-report-${report.labId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-report-title"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 id="lab-report-title" className="text-base font-black text-slate-900">
                ڕاپۆرتی کۆتایی تاقیکردنەوە (Lab Report)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                ناسنامەی ڕاپۆرت: {report.reportId} • بەروار: {report.date}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
            aria-label="داخستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              report.isOutcomeValid
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : "bg-amber-50/70 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {report.isOutcomeValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <span className="font-bold text-xs block">
                  {report.isOutcomeValid
                    ? "تاقیکردنەوە بە سەرکەوتوویی تەواو بوو و ئەنجام سەلمێندرا"
                    : "ئەنجامی تاقیکردنەوە لە چوارچێوەی ڕێپێدراو (Tolerance) دوورە"}
                </span>
                <span className="text-[11px] opacity-80">
                  ئەنجامی بەدەستهاتوو: {report.studentResult} (چاودێریکراو: {report.expectedOutcome} ± {report.toleranceRange})
                </span>
              </div>
            </div>

            <span className="text-[10px] uppercase font-mono font-black px-2.5 py-1 rounded-full bg-white border shadow-2xs">
              {report.status}
            </span>
          </div>

          {/* Section 1: Hypothesis (گریمانە) */}
          <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-indigo-700 uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>١. گریمانەی زانستی (Hypothesis):</span>
            </span>
            <p className="text-slate-800 leading-relaxed font-sans">{report.hypothesis}</p>
          </div>

          {/* Section 2: Variables (گۆڕاوەکان) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-900 uppercase block">
              ٢. خشتەی گۆڕاوەکانی تاقیکردنەوە (Variables):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {report.variables.map((v, i) => (
                <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5">
                  <span className="text-slate-500 text-[10px] block font-bold">{v.name}</span>
                  <div className="flex items-center justify-between text-slate-900 font-bold">
                    <span>دەستپێک: {v.initialValue} {v.unit}</span>
                    <span className="text-indigo-600">کۆتایی: {v.finalValue} {v.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Observations & Log (تێبینی و تۆماری گۆڕانکارییەکان) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-900 uppercase block">
              ٣. سەرنج و تێبینییە چاودێریکراوەکان ({report.logs.length} کرداری تۆمارکراو):
            </span>
            {report.logs.length > 0 ? (
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {report.logs.map((log) => (
                  <div key={log.id} className="p-2.5 text-[11px] flex items-center justify-between gap-2">
                    <span className="text-slate-400 font-mono text-[10px] shrink-0">{log.timestamp}</span>
                    <span className="font-bold text-slate-800 truncate">
                      {log.variableNameKu}: {log.oldValue} ➔ {log.newValue} {log.unit}
                    </span>
                    <span className="text-indigo-600 font-medium shrink-0">{log.observedEffect}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic text-[11px]">هیچ گۆڕانکارییەکی تایبەت تۆمار نەکراوە.</p>
            )}
          </div>

          {/* Section 4: Conclusion (دەرەنجام و ڕاسپاردە) */}
          <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-indigo-700 uppercase block">
              ٤. دەرەنجامی زانستی (Conclusion):
            </span>
            <p className="text-slate-800 leading-relaxed font-sans">{report.conclusion}</p>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? "کۆپیکرا!" : "کۆپیکردنی JSON"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>داگرتنی ڕاپۆرت (.json)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold cursor-pointer"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
};
