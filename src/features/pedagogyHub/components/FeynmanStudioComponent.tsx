import React, { useState } from "react";
import { FeynmanConcept, FeynmanEvaluation } from "../pedagogyTypes.ts";
import { PedagogyEngine } from "../pedagogyEngine.ts";
import { ZanaButton } from "../../../components/ZanaButton.tsx";
import {
  Send,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  RefreshCw
} from "lucide-react";

export const FeynmanStudioComponent: React.FC = () => {
  const concepts = PedagogyEngine.getFeynmanConcepts();
  const [selectedConcept, setSelectedConcept] = useState<FeynmanConcept>(concepts[0]);
  const [explanationText, setExplanationText] = useState("");
  const [evaluation, setEvaluation] = useState<FeynmanEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showSample, setShowSample] = useState(false);

  const handleEvaluate = () => {
    if (!explanationText.trim()) return;
    setIsEvaluating(true);
    setTimeout(() => {
      const result = PedagogyEngine.evaluateFeynmanExplanation(selectedConcept, explanationText);
      setEvaluation(result);
      setIsEvaluating(false);
    }, 600);
  };

  const handleReset = () => {
    setExplanationText("");
    setEvaluation(null);
    setShowSample(false);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Concept Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          چەمکی زانستی بۆ تاقیکردنەوە هەڵبژێرە (پۆلی ٩ تا ١٢):
        </label>
        <div className="flex flex-wrap gap-2">
          {concepts.map((c: FeynmanConcept) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedConcept(c);
                handleReset();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedConcept.id === c.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              پۆلی {c.grade} • {c.subject}: {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Two-Zone Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Top: Explanation Stage */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
                ڕۆڵی تۆ: مامۆستای سەرەکی 👨‍🏫
              </span>
              <span className="text-xs text-slate-400">فەلسەفەی فاینمان</span>
            </div>

            <h3 className="font-sans font-black text-lg text-slate-900 dark:text-white leading-snug">
              {selectedConcept.title}
            </h3>

            <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 p-3.5 rounded-xl text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
              <span className="font-bold">داواکاری: </span>
              {selectedConcept.prompt}
            </div>

            {/* Input area */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>ڕوونکردنەوەکەت بە زمانی زۆر سادە و بێ زاراوەی گران بنووسە:</span>
                <span className="font-mono">{explanationText.length} پیت</span>
              </div>
              <textarea
                value={explanationText}
                onChange={(e) => setExplanationText(e.target.value)}
                rows={5}
                placeholder="بۆ نموونە: بیر لەوە بکەرەوە بتڵێکی سۆدا لەناو سەلاجەدایە..."
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <ZanaButton
                  variant="primary"
                  onClick={handleEvaluate}
                  disabled={!explanationText.trim() || isEvaluating}
                  className="px-5 py-2 text-xs font-bold"
                >
                  {isEvaluating ? (
                    <RefreshCw className="w-4 h-4 animate-spin ml-1" />
                  ) : (
                    <Send className="w-4 h-4 ml-1" />
                  )}
                  <span>ڕادەستکردن بۆ فێرخواز (زانا)</span>
                </ZanaButton>

                {explanationText && (
                  <button
                    onClick={handleReset}
                    className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    سڕینەوە
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowSample(!showSample)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>نموونەی پێداگۆجی</span>
              </button>
            </div>

            {showSample && (
              <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-bold text-blue-700 dark:text-blue-400">نموونەی شیکار بە سادەیی: </span>
                {selectedConcept.sampleTeacherExplanation}
              </div>
            )}
          </div>
        </div>

        {/* Right/Bottom: Evaluation & Protégé Response */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>شیکاری تێگەیشتنی خوێندکار (Protégé)</span>
              </span>
              {evaluation && (
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                    evaluation.score >= 80
                      ? "bg-emerald-100 text-emerald-700"
                      : evaluation.score >= 50
                      ? "bg-blue-100 text-blue-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {evaluation.score} / ١٠٠
                </span>
              )}
            </div>

            {!evaluation ? (
              <div className="py-12 text-center space-y-2 text-slate-400">
                <HelpCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-medium">
                  کاتێک ڕوونکردنەوەکەت دەنوسیت، زانا لێرە وەک فێرخوازێک وەڵامت دەداتەوە و پشکنین بۆ زاراوە و
                  قووڵیی تێگەیشتنت دەکات.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in text-xs">
                {/* Dialogue response from Protégé */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="font-bold text-blue-600 dark:text-blue-400">وەڵامی فێرخواز (زانا):</span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                    "{evaluation.aiStudentResponse}"
                  </p>
                </div>

                {/* Principles coverage */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">چەمکە داپۆشراوەکان:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {evaluation.principlesCovered.map((p, idx) => (
                      <span
                        key={idx}
                        className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        {p}
                      </span>
                    ))}
                    {evaluation.principlesMissing.map((p, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-[11px]"
                      >
                        لەبیرچوو: {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Jargon warning */}
                {evaluation.jargonFound.length > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">ئاگاداری وشەی لەبەرکراو (Jargon): </span>
                      تۆ ئەم وشانەت بەکارهێنا کە دەبێت بە سادەیی بوترێن: {evaluation.jargonFound.join("، ")}
                    </div>
                  </div>
                )}

                {/* Pedagogical Tip */}
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">ئامۆژگاری پرۆفیسۆر: </span>
                    {evaluation.constructiveTip}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
