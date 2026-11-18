import React, { useState } from "react";
import { MetacognitiveErrorReason } from "../pedagogyTypes.ts";
import { PedagogyEngine } from "../pedagogyEngine.ts";
import { ZanaButton } from "../../../components/ZanaButton.tsx";
import {
  Brain,
  CheckCircle2,
  XCircle,
  BarChart3
} from "lucide-react";

export const MetacognitiveDiagnosticsComponent: React.FC = () => {
  const questions = PedagogyEngine.getMetacognitiveQuestions();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [diagnosedReason, setDiagnosedReason] = useState<MetacognitiveErrorReason | null>(null);
  const [reflectionText, setReflectionText] = useState("");
  const [logs, setLogs] = useState(() => PedagogyEngine.getMetacognitiveLogs());

  const currentQ = questions[currentIdx];
  const isCorrect = selectedKey !== null && currentQ.options.find((o: { key: string; isCorrect: boolean }) => o.key === selectedKey)?.isCorrect;

  const handleSubmitAnswer = () => {
    if (!selectedKey) return;
    setIsAnswerSubmitted(true);
  };

  const handleSaveDiagnosis = () => {
    if (!selectedKey) return;
    const nowIso = new Date().toISOString();

    const newLog = {
      id: "meta-" + nowIso,
      questionId: currentQ.id,
      selectedOption: selectedKey,
      isCorrect: !!isCorrect,
      diagnosedReason: diagnosedReason || undefined,
      studentReflection: reflectionText || undefined,
      timestamp: new Date().toISOString()
    };

    PedagogyEngine.saveMetacognitiveLog(newLog);
    setLogs(PedagogyEngine.getMetacognitiveLogs());

    // Next question
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedKey(null);
      setIsAnswerSubmitted(false);
      setDiagnosedReason(null);
      setReflectionText("");
    }
  };

  const radarSummary = PedagogyEngine.getMetacognitiveRadarSummary(logs);
  const totalDiagnosed = (Object.values(radarSummary) as number[]).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Banner: Metacognition Mindset */}
      <div className="bg-gradient-to-l from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">مێتاکۆگنیشن (هۆشیاریی بیرکردنەوە) لە تاقیکردنەوەکاندا</h3>
          </div>
          <p className="text-xs text-indigo-200 leading-relaxed max-w-xl">
            بەپێی زانستی پەروەردە، ٦٠٪ی نمرە ونبووەکانی پۆلی ١٢ لەبەر نەزانینی بابەتەکە نییە، بەڵکو لەبەر تەڵە و
            پەلەکردنە. لێرە فێر دەبیت کێشەی دەروونی خۆت دەستنیشان بکەیت.
          </p>
        </div>

        {/* Mini stats */}
        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 shrink-0 text-center">
          <span className="text-[10px] text-indigo-200 block">کۆی هەڵە دەستنیشانکراوەکان</span>
          <span className="text-lg font-black">{totalDiagnosed}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Question & Trap Stage */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-500">
                پرسیاری {currentIdx + 1} لە {questions.length} • {currentQ.subject} ({currentQ.topic})
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-md font-bold">
                تەڵەی پۆلی ١٢
              </span>
            </div>

            <p className="font-sans font-bold text-base text-slate-900 dark:text-white leading-relaxed">
              {currentQ.questionKurdish}
            </p>

            {/* Options */}
            <div className="space-y-2 pt-2">
              {currentQ.options.map((opt: { key: string; text: string; isCorrect: boolean }) => {
                const isSelected = selectedKey === opt.key;
                let optStyle = "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800";

                if (isAnswerSubmitted) {
                  if (opt.isCorrect) {
                    optStyle = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200";
                  } else if (isSelected && !opt.isCorrect) {
                    optStyle = "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200";
                  }
                } else if (isSelected) {
                  optStyle = "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200";
                }

                return (
                  <button
                    key={opt.key}
                    disabled={isAnswerSubmitted}
                    onClick={() => setSelectedKey(opt.key)}
                    className={`w-full p-3.5 rounded-xl border text-right transition flex items-center justify-between cursor-pointer ${optStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {opt.key}
                      </span>
                      <span className="text-sm font-medium">{opt.text}</span>
                    </div>

                    {isAnswerSubmitted && opt.isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isAnswerSubmitted && isSelected && !opt.isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Submit Question */}
            {!isAnswerSubmitted ? (
              <ZanaButton
                variant="primary"
                onClick={handleSubmitAnswer}
                disabled={!selectedKey}
                className="mt-3 text-xs font-bold"
              >
                پشکنینی وەڵام
              </ZanaButton>
            ) : null}

            {/* Metacognitive Post-Mortem Diagnosis Modal / Drawer */}
            {isAnswerSubmitted && (
              <div className="mt-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-bold text-xs">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  <span>وەستانی مێتاکۆگنیتیڤ (Exam Post-Mortem):</span>
                </div>

                {isCorrect ? (
                  <div className="text-xs text-emerald-800 dark:text-emerald-300">
                    <p className="font-bold">دەستخۆش! بە سەرکەوتوویی لە تەڵەکە دەربازت بوو.</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{currentQ.correctExplanation}</p>
                  </div>
                ) : (
                  <div className="text-xs space-y-2">
                    <p className="text-rose-700 dark:text-rose-300 font-bold">
                      ئەمە ئەو تەڵەیە بوو کە زۆربەی خوێندکاران تێی دەکەون:
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">{currentQ.trapExplanation}</p>

                    <p className="font-bold text-slate-800 dark:text-slate-200 pt-2">
                      پێش ئەوەی تێپەڕیت، هۆکاری سەرەکی هەڵەکەت چی بوو لە ڕاستیدا؟
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => setDiagnosedReason("CARELESS_MISREADING")}
                        className={`p-2.5 rounded-lg border text-right text-xs transition cursor-pointer ${
                          diagnosedReason === "CARELESS_MISREADING"
                            ? "border-blue-600 bg-blue-100 text-blue-900 font-bold"
                            : "border-slate-200 bg-white dark:bg-slate-800"
                        }`}
                      >
                        ⚡ پەلەکردن و نەخوێندنەوەی وشەی وەک (جگە لە)
                      </button>

                      <button
                        onClick={() => setDiagnosedReason("CONCEPTUAL_DEFICIT")}
                        className={`p-2.5 rounded-lg border text-right text-xs transition cursor-pointer ${
                          diagnosedReason === "CONCEPTUAL_DEFICIT"
                            ? "border-blue-600 bg-blue-100 text-blue-900 font-bold"
                            : "border-slate-200 bg-white dark:bg-slate-800"
                        }`}
                      >
                        🧩 تێنەگەیشتن لە چەمک و یاساکە
                      </button>

                      <button
                        onClick={() => setDiagnosedReason("CALCULATION_SLIP")}
                        className={`p-2.5 rounded-lg border text-right text-xs transition cursor-pointer ${
                          diagnosedReason === "CALCULATION_SLIP"
                            ? "border-blue-600 bg-blue-100 text-blue-900 font-bold"
                            : "border-slate-200 bg-white dark:bg-slate-800"
                        }`}
                      >
                        🔢 هەڵە لە ژمێریاری و هەنگاوی ماتماتیک
                      </button>

                      <button
                        onClick={() => setDiagnosedReason("TIME_PRESSURE_PANIC")}
                        className={`p-2.5 rounded-lg border text-right text-xs transition cursor-pointer ${
                          diagnosedReason === "TIME_PRESSURE_PANIC"
                            ? "border-blue-600 bg-blue-100 text-blue-900 font-bold"
                            : "border-slate-200 bg-white dark:bg-slate-800"
                        }`}
                      >
                        ⏳ دڵەڕاوکێ و کەمبوونەوەی کات
                      </button>
                    </div>

                    <input
                      type="text"
                      value={reflectionText}
                      onChange={(e) => setReflectionText(e.target.value)}
                      placeholder="تێبینییەکی کورت بۆ خۆت (ئارەزوومەندانە)..."
                      className="w-full mt-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <ZanaButton variant="secondary" onClick={handleSaveDiagnosis} className="text-xs font-bold">
                    تۆمارکردن و چوونم بۆ پرسیاری داهاتوو
                  </ZanaButton>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Metacognitive Error Radar Analysis */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>شیکاری دەروونی هەڵەکانی تۆ</span>
              </span>
              <span className="text-[11px] text-slate-400">Error DNA</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                  <span>پەلەکردن لە خوێندنەوە (Careless):</span>
                  <span className="font-bold">{radarSummary.CARELESS_MISREADING} جار</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, radarSummary.CARELESS_MISREADING * 25)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                  <span>کێشەی تێگەیشتنی یاسا (Concept):</span>
                  <span className="font-bold">{radarSummary.CONCEPTUAL_DEFICIT} جار</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, radarSummary.CONCEPTUAL_DEFICIT * 25)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                  <span>هەڵەی هەنگاو و ژمێریاری (Math):</span>
                  <span className="font-bold">{radarSummary.CALCULATION_SLIP} جار</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${Math.min(100, radarSummary.CALCULATION_SLIP * 25)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                  <span>فشاری کات و دڵەڕاوکێ (Panic):</span>
                  <span className="font-bold">{radarSummary.TIME_PRESSURE_PANIC} جار</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${Math.min(100, radarSummary.TIME_PRESSURE_PANIC * 25)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              💡 <span className="font-bold text-slate-700 dark:text-slate-300">ڕێنمایی پڕۆفیسۆر:</span> زانینی
              ئەوەی بۆچی هەڵە دەکەیت نیوەی سەرکەوتنە لە تاقیکردنەوەی وەزاریدا.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
