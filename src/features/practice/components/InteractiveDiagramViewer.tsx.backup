import React, { useState } from "react";
import { InteractiveDiagramPayload } from "../practiceTypes.ts";
import { Award, CheckCircle2, Lightbulb, Sparkles, HelpCircle, ArrowLeft } from "lucide-react";

interface InteractiveDiagramViewerProps {
  data: InteractiveDiagramPayload;
  onComplete: (score: number, maxScore: number) => void;
}

const ELEMENT_NAMES: Record<number, { sym: string; nameKu: string }> = {
  1: { sym: "H", nameKu: "هایدرۆجین" },
  2: { sym: "He", nameKu: "هیلیۆم" },
  3: { sym: "Li", nameKu: "لیتیۆم" },
  4: { sym: "Be", nameKu: "بێریلیۆم" },
  5: { sym: "B", nameKu: "بۆرۆن" },
  6: { sym: "C", nameKu: "کاربۆن" },
  7: { sym: "N", nameKu: "نایترۆجین" },
  8: { sym: "O", nameKu: "ئۆکسجین" },
  9: { sym: "F", nameKu: "فلۆرین" },
  10: { sym: "Ne", nameKu: "نێۆن" },
  11: { sym: "Na", nameKu: "سۆدیۆم" },
  12: { sym: "Mg", nameKu: "مەگنیسیۆم" },
  13: { sym: "Al", nameKu: "ئەلەمنیۆم" },
  14: { sym: "Si", nameKu: "سیلیکۆن" },
  15: { sym: "P", nameKu: "فۆسفۆر" },
  16: { sym: "S", nameKu: "گۆگرد" },
  17: { sym: "Cl", nameKu: "کلۆرین" },
  18: { sym: "Ar", nameKu: "ئارگۆن" }
};

export const InteractiveDiagramViewer: React.FC<InteractiveDiagramViewerProps> = ({ data, onComplete }) => {
  const initialParams: Record<string, number> = {};
  data.parameters.forEach((p) => {
    initialParams[p.id] = p.defaultValue;
  });

  const [paramValues, setParamValues] = useState<Record<string, number>>(initialParams);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [solvedChallenges, setSolvedChallenges] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ isSuccess: boolean; textKu: string } | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const currentChallenge = data.challenges[currentChallengeIndex];

  const handleSliderChange = (paramId: string, val: number) => {
    setParamValues((prev) => ({
      ...prev,
      [paramId]: val
    }));
    setFeedback(null);
  };

  const handleCheckChallenge = () => {
    if (!currentChallenge) return;
    const isSolved = currentChallenge.checkSolved(paramValues);
    if (isSolved) {
      setSolvedChallenges((prev) => ({ ...prev, [currentChallenge.id]: true }));
      setFeedback({
        isSuccess: true,
        textKu: currentChallenge.successExplanationKu
      });
    } else {
      setFeedback({
        isSuccess: false,
        textKu: "هێشتا نەگەیشتوویتە بەهای داواکراو. سەیرێکی ڕێنوێنییەکە بکە و دووبارە سلایدەرەکە ڕێکبخەرەوە."
      });
    }
  };

  const handleNextChallenge = () => {
    setFeedback(null);
    setShowHint(false);
    if (currentChallengeIndex + 1 < data.challenges.length) {
      setCurrentChallengeIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      const solvedCount = Object.values(solvedChallenges).filter(Boolean).length;
      onComplete(solvedCount, data.challenges.length);
    }
  };

  // Render Coordinate Plane
  const renderCoordinatePlane = () => {
    const slope = paramValues["slope"] ?? 1;
    const yIntercept = paramValues["yIntercept"] ?? 0;

    // SVG coordinates: Center (150, 150), scale = 20px per unit
    const centerX = 150;
    const centerY = 150;
    const scale = 20;

    // Calculate line endpoints at x = -6 and x = 6
    const x1 = -6;
    const y1 = slope * x1 + yIntercept;
    const x2 = 6;
    const y2 = slope * x2 + yIntercept;

    const svgX1 = centerX + x1 * scale;
    const svgY1 = centerY - y1 * scale;
    const svgX2 = centerX + x2 * scale;
    const svgY2 = centerY - y2 * scale;

    const yInterceptSvgY = centerY - yIntercept * scale;

    return (
      <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-2xl text-white">
        <svg width="300" height="300" className="overflow-hidden select-none">
          {/* Grid lines */}
          {[-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].map((i) => (
            <React.Fragment key={i}>
              <line
                x1={centerX + i * scale}
                y1={0}
                x2={centerX + i * scale}
                y2={300}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <line
                x1={0}
                y1={centerY - i * scale}
                x2={300}
                y2={centerY - i * scale}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            </React.Fragment>
          ))}

          {/* Axes */}
          <line x1={0} y1={centerY} x2={300} y2={centerY} stroke="#94A3B8" strokeWidth="2" />
          <line x1={centerX} y1={0} x2={centerX} y2={300} stroke="#94A3B8" strokeWidth="2" />

          {/* Axis Labels */}
          <text x="285" y={centerY - 6} fill="#94A3B8" fontSize="12" fontWeight="bold">x</text>
          <text x={centerX + 6} y="15" fill="#94A3B8" fontSize="12" fontWeight="bold">y</text>

          {/* Origin dot */}
          <circle cx={centerX} cy={centerY} r="3" fill="#64748B" />

          {/* Dynamic Function Line */}
          <line
            x1={svgX1}
            y1={svgY1}
            x2={svgX2}
            y2={svgY2}
            stroke="#38BDF8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Y-intercept point */}
          <circle cx={centerX} cy={yInterceptSvgY} r="5" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>

        {/* Dynamic Formula Display */}
        <div className="mt-3 bg-slate-800/90 border border-slate-700 px-4 py-2 rounded-xl text-center font-mono text-sm text-sky-300">
          y = {slope !== 0 ? `${slope}x` : ""} {yIntercept > 0 ? `+ ${yIntercept}` : yIntercept < 0 ? `- ${Math.abs(yIntercept)}` : slope === 0 ? "0" : ""}
        </div>
      </div>
    );
  };

  // Render Bohr Atom Model
  const renderBohrAtom = () => {
    const z = paramValues["atomicNumber"] ?? 6;
    const element = ELEMENT_NAMES[z] || { sym: `Z=${z}`, nameKu: "توخم" };

    // Electron distribution into K, L, M
    const kElectrons = Math.min(z, 2);
    const lElectrons = Math.max(0, Math.min(z - 2, 8));
    const mElectrons = Math.max(0, Math.min(z - 10, 8));
    const valenceCount = mElectrons > 0 ? mElectrons : lElectrons > 0 ? lElectrons : kElectrons;

    const centerX = 150;
    const centerY = 140;

    const getShellCoords = (radius: number, count: number) => {
      const coords = [];
      for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;
        coords.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        });
      }
      return coords;
    };

    const kCoords = getShellCoords(40, kElectrons);
    const lCoords = getShellCoords(75, lElectrons);
    const mCoords = getShellCoords(110, mElectrons);

    return (
      <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-2xl text-white">
        <svg width="300" height="280" className="select-none">
          {/* Orbits */}
          <circle cx={centerX} cy={centerY} r="40" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="3,3" />
          {z > 2 && (
            <circle cx={centerX} cy={centerY} r="75" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="3,3" />
          )}
          {z > 10 && (
            <circle cx={centerX} cy={centerY} r="110" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="3,3" />
          )}

          {/* Nucleus */}
          <circle cx={centerX} cy={centerY} r="22" fill="#E11D48" />
          <text x={centerX} y={centerY - 2} fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle">
            {z} P⁺
          </text>
          <text x={centerX} y={centerY + 10} fill="#FECDD3" fontSize="9" textAnchor="middle">
            {z} N⁰
          </text>

          {/* K Shell Electrons */}
          {kCoords.map((c, idx) => (
            <circle key={`k-${idx}`} cx={c.x} cy={c.y} r="5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
          ))}

          {/* L Shell Electrons */}
          {lCoords.map((c, idx) => (
            <circle key={`l-${idx}`} cx={c.x} cy={c.y} r="5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
          ))}

          {/* M Shell Electrons */}
          {mCoords.map((c, idx) => (
            <circle key={`m-${idx}`} cx={c.x} cy={c.y} r="5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
          ))}
        </svg>

        {/* Atom Metadata Box */}
        <div className="w-full grid grid-cols-3 gap-2 mt-2 text-center text-xs">
          <div className="bg-slate-800 p-2 rounded-xl">
            <span className="text-slate-400 block text-[10px]">توخم</span>
            <span className="font-bold text-sky-400">{element.nameKu} ({element.sym})</span>
          </div>
          <div className="bg-slate-800 p-2 rounded-xl">
            <span className="text-slate-400 block text-[10px]">بەرگەکان (K, L, M)</span>
            <span className="font-bold font-mono text-amber-400">{kElectrons}{lElectrons > 0 ? `, ${lElectrons}` : ""}{mElectrons > 0 ? `, ${mElectrons}` : ""}</span>
          </div>
          <div className="bg-slate-800 p-2 rounded-xl">
            <span className="text-slate-400 block text-[10px]">ئەلیکترۆنی ڤالانس</span>
            <span className="font-bold text-emerald-400">{valenceCount} e⁻</span>
          </div>
        </div>
      </div>
    );
  };

  if (isFinished) {
    return (
      <div id="diagram-viewer-finished" className="bg-white border border-slate-100 rounded-2xl p-6 text-center space-y-5 shadow-xs" dir="rtl">
        <div className="w-16 h-16 mx-auto bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center shadow-xs">
          <Award className="w-9 h-9" />
        </div>
        <div>
          <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
            پشکنینی دیاگرام بە سەرکەوتوویی تەواو بوو!
          </span>
          <h3 className="font-bold text-xl text-slate-900 mt-3">ناوازەیە! بە تەواوی لە پێکهاتەی دیاگرامەکە تێگەیشتیت</h3>
          <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
            توانای پەیوەستکردنی ژمارەکان بە هێڵکاری و پێکهاتەی فیزیکی و کیمیایی هێمای تێگەیشتنی قووڵی زانستییە.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="interactive-diagram-viewer" className="space-y-4" dir="rtl">
      {/* Visual Canvas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            دیاگرامی کارلێککار
          </span>
          <span className="text-xs font-medium text-slate-400">
            تەحەددای {currentChallengeIndex + 1} لە {data.challenges.length}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {data.instructionKu}
        </p>

        {/* Render Specific Diagram */}
        {data.diagramKind === "coordinate_plane" && renderCoordinatePlane()}
        {data.diagramKind === "bohr_atom" && renderBohrAtom()}

        {/* Interactive Sliders */}
        <div className="space-y-3 pt-2">
          {data.parameters.map((p) => {
            const val = paramValues[p.id] ?? p.defaultValue;
            return (
              <div key={p.id} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>{p.nameKu}:</span>
                  <span className="font-mono text-blue-600 font-bold" dir="ltr">
                    {val} {p.unitKu || ""}
                  </span>
                </div>
                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={val}
                  onChange={(e) => handleSliderChange(p.id, parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono" dir="ltr">
                  <span>{p.min}</span>
                  <span>{p.max}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Challenge Card */}
      {currentChallenge && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                ئەرکی بەردەست:
              </h4>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {currentChallenge.questionKu}
              </p>
            </div>
          </div>

          {/* Hint */}
          <div className="pt-1">
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>{showHint ? "شاردنەوەی ڕێنوێنی" : "ڕێنوێنیی زانا"}</span>
            </button>

            {showHint && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 leading-relaxed animate-fade-in">
                💡 {currentChallenge.hintKu}
              </div>
            )}
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`rounded-xl p-3 text-xs leading-relaxed animate-fade-in flex items-start gap-2 ${
                feedback.isSuccess
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border border-rose-200 text-rose-900"
              }`}
            >
              {feedback.isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Lightbulb className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <p>{feedback.textKu}</p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            {!feedback?.isSuccess ? (
              <button
                onClick={handleCheckChallenge}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors cursor-pointer shadow-xs"
              >
                پشکنینی هاوسەنگیی دیاگرام
              </button>
            ) : (
              <button
                onClick={handleNextChallenge}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>
                  {currentChallengeIndex + 1 < data.challenges.length
                    ? "تەحەددای داهاتوو"
                    : "تەواوکردنی ئەم دیاگرامە"}
                </span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
