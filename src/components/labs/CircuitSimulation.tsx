import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  RotateCcw,
  Zap,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  SimulationState,
  ExperimentLogEntry,
  LabReportTemplate,
} from "./labTypes.ts";
import { CIRCUIT_CONFIG } from "./labConfigs.ts";

export interface CircuitSimulationProps {
  onGenerateReport: (report: LabReportTemplate) => void;
  isControllerDisabled?: boolean;
}

export { CIRCUIT_CONFIG };

export const CircuitSimulation: React.FC<CircuitSimulationProps> = ({
  onGenerateReport,
  isControllerDisabled = false,
}) => {
  const [simState, setSimState] = useState<SimulationState>("SETUP");
  const [attempts, setAttempts] = useState(0);

  const [voltage, setVoltage] = useState(12.0);
  const [resistance, setResistance] = useState(24.0);
  const [isSwitchClosed, setIsSwitchClosed] = useState(true);
  const [logs, setLogs] = useState<ExperimentLogEntry[]>([]);

  const lastSliderTimeRef = useRef<number>(0);

  const circuitCurrent = useMemo(() => {
    if (!isSwitchClosed) return 0;
    return voltage / resistance;
  }, [isSwitchClosed, voltage, resistance]);

  const circuitPower = useMemo(() => {
    return circuitCurrent * voltage;
  }, [circuitCurrent, voltage]);

  const bulbGlow = useMemo(() => {
    if (!isSwitchClosed) return 0;
    return Math.min(1, Math.max(0.15, circuitPower / 16));
  }, [isSwitchClosed, circuitPower]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        setIsSwitchClosed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const recordLog = (
    variable: string,
    variableNameKu: string,
    oldValue: number,
    newValue: number,
    unit: string,
    observedEffect: string
  ) => {
    const entry: ExperimentLogEntry = {
      id: "log_" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString("ku-IQ", { hour12: false }),
      variable,
      variableNameKu,
      oldValue,
      newValue,
      unit,
      observedEffect,
    };
    setLogs((prev) => [entry, ...prev.slice(0, 19)]);
  };

  const handleVoltageSlider = (val: number) => {
    const now = performance.now();
    if (now - lastSliderTimeRef.current < 16) return;
    lastSliderTimeRef.current = now;

    const old = voltage;
    setVoltage(val);
    recordLog("voltage", "ڤۆڵتیە", old, val, "V", `تەزوو گۆڕا بۆ ${(val / resistance).toFixed(2)} A`);
  };

  const handleResistanceSlider = (val: number) => {
    const now = performance.now();
    if (now - lastSliderTimeRef.current < 16) return;
    lastSliderTimeRef.current = now;

    const old = resistance;
    setResistance(val);
    recordLog("resistance", "بەرگری", old, val, "Ω", `تەزوو بوو بە ${(voltage / val).toFixed(2)} A`);
  };

  const handleReset = () => {
    setVoltage(12.0);
    setResistance(24.0);
    setIsSwitchClosed(true);
    setSimState("SETUP");
    recordLog("reset", "دوبارەکردنەوەی سووڕ", 0, 0, "", "گەڕانەوە بۆ 12V و 24Ω");
  };

  const handleValidateResult = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    const isMatch = Math.abs(circuitCurrent - CIRCUIT_CONFIG.expectedOutcome) <= CIRCUIT_CONFIG.toleranceRange;
    if (isMatch) {
      setSimState("COMPLETED");
    } else if (nextAttempts >= CIRCUIT_CONFIG.maxAttempts) {
      setSimState("FAILED");
    } else {
      setSimState("PAUSED");
    }

    const report: LabReportTemplate = {
      reportId: "REP-CIRC-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      labId: CIRCUIT_CONFIG.labId,
      subject: CIRCUIT_CONFIG.subject,
      grade: CIRCUIT_CONFIG.grade,
      studentName: "قوتابی",
      date: new Date().toLocaleDateString("ku-IQ"),
      status: isMatch ? "COMPLETED" : nextAttempts >= CIRCUIT_CONFIG.maxAttempts ? "FAILED" : "PAUSED",
      hypothesis: "بەپێی یاسای ئۆم، تەزووی کارەبا ڕاستەوانە لەگەڵ جیاوازی پۆتانسێل و پێچەوانە لەگەڵ بەرگری دەگۆڕێت (I = V / R).",
      variables: [
        { name: "جیاوازی پۆتانسێل (V)", unit: "V", initialValue: 12.0, finalValue: voltage },
        { name: "بەرگری کارەبایی (R)", unit: "Ω", initialValue: 24.0, finalValue: resistance },
      ],
      observations: [
        `دۆخی کلیل: ${isSwitchClosed ? "داخراو (بەستراو)" : "کراوە (پچڕاو)"}`,
        `تەزووی پێوراو لە ئامپیرمەتر: ${circuitCurrent.toFixed(2)} A`,
        `توانای کارەبایی بەکاربراو: ${circuitPower.toFixed(2)} W`,
        `ڕادەی گەشانەوەی گڵۆپ: ${(bulbGlow * 100).toFixed(0)}%`,
      ],
      logs,
      studentResult: +circuitCurrent.toFixed(2),
      expectedOutcome: CIRCUIT_CONFIG.expectedOutcome,
      toleranceRange: CIRCUIT_CONFIG.toleranceRange,
      isOutcomeValid: isMatch,
      conclusion: isMatch
        ? `ئەنجامەکە سەلمێندرا کە I = 12.0 V / 24.0 Ω = 0.50 A، و هاوکێشەی یاسای ئۆم بە تەواوی ڕاست بوو.`
        : `تەزووی بەدەستهاتوو (${circuitCurrent.toFixed(2)} A) لە ئەنجامی مەبەست (0.50 A) دوورە. تکایە بەهاکانی ڤۆڵتیە یان بەرگری چاک بکە.`,
    };

    onGenerateReport(report);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {CIRCUIT_CONFIG.titleKu}
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                simState === "RUNNING"
                  ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                  : simState === "COMPLETED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : simState === "FAILED"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              دۆخ: {simState}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{CIRCUIT_CONFIG.descriptionKu}</p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
          <kbd className="bg-white px-1.5 py-0.5 rounded border text-slate-700 font-bold shadow-2xs">Space</kbd>
          <span>داخستن / کردنەوەی کلیل</span>
        </div>
      </div>

      {/* Main Interactive Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Circuit Visualizer Stage (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-5 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden shadow-inner">
          {/* Circuit Canvas SVG */}
          <svg viewBox="0 0 340 280" className="w-full max-w-[300px] h-auto drop-shadow-md">
            {/* Battery Source (Top) */}
            <rect x="130" y="20" width="80" height="25" rx="5" fill="#334155" stroke="#64748b" strokeWidth="2" />
            <text x="170" y="37" fill="#f8fafc" fontSize="11" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
              {voltage} V ⚡
            </text>

            {/* Circuit Wire Loop */}
            <path
              d="M130 32 L40 32 L40 220 L130 220 M210 32 L300 32 L300 220 L210 220"
              fill="none"
              stroke={isSwitchClosed ? "#fbbf24" : "#475569"}
              strokeWidth="3.5"
              strokeDasharray={isSwitchClosed ? "6 3" : "none"}
            />

            {/* Switch (Left wire gap) */}
            <circle cx="40" cy="115" r="4" fill="#94a3b8" />
            <circle cx="40" cy="145" r="4" fill="#94a3b8" />
            <line
              x1="40"
              y1="115"
              x2={isSwitchClosed ? 40 : 25}
              y2={isSwitchClosed ? 145 : 135}
              stroke="#e2e8f0"
              strokeWidth="3"
            />
            <text x="52" y="133" fill="#cbd5e1" fontSize="9" fontFamily="sans-serif">
              {isSwitchClosed ? "کلیل داخراوە" : "کلیل کراوەیە"}
            </text>

            {/* Resistor Component (Right wire gap) */}
            <rect x="285" y="105" width="30" height="50" rx="4" fill="#1e293b" stroke="#0ea5e9" strokeWidth="2" />
            <text x="300" y="135" fill="#38bdf8" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
              {resistance}Ω
            </text>

            {/* Light Bulb Component (Bottom) */}
            <g transform="translate(145, 195)">
              <circle
                cx="25"
                cy="25"
                r="22"
                fill={isSwitchClosed ? `rgba(251, 191, 36, ${bulbGlow})` : "#334155"}
                stroke="#f59e0b"
                strokeWidth="2"
              />
              <path d="M18 25 Q25 15 32 25" stroke="#d97706" strokeWidth="2" fill="none" />
              <rect x="19" y="38" width="12" height="8" fill="#64748b" rx="1" />
            </g>
          </svg>

          {/* Real-time Meters Badge */}
          <div className="w-full mt-4 grid grid-cols-2 gap-2 text-center text-xs font-mono">
            <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-sans">تەزووی کارەبا (I):</span>
              <span className="text-amber-400 font-bold text-base">{circuitCurrent.toFixed(2)} A</span>
            </div>
            <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-sans">توانای کارەبایی (P):</span>
              <span className="text-sky-400 font-bold text-base">{circuitPower.toFixed(1)} W</span>
            </div>
          </div>
        </div>

        {/* Variables Sliders & Real-Time Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>دەستکاریکردنی گۆڕاوەکانی بازنەی کارەبا:</span>
            </h4>

            {/* Slider 1: Voltage */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>جیاوازی پۆتانسێل (V):</span>
                <span className="font-mono text-indigo-600">{voltage} V</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={voltage}
                disabled={isControllerDisabled}
                onChange={(e) => handleVoltageSlider(parseFloat(e.target.value))}
                aria-label="جیاوازی پۆتانسێل بە ڤۆڵت"
                aria-valuenow={voltage}
                aria-valuemin={1}
                aria-valuemax={24}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Slider 2: Resistance */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>بەرگری ڕێکخراو (R):</span>
                <span className="font-mono text-indigo-600">{resistance} Ω</span>
              </div>
              <input
                type="range"
                min="2"
                max="60"
                step="1"
                value={resistance}
                disabled={isControllerDisabled}
                onChange={(e) => handleResistanceSlider(parseFloat(e.target.value))}
                aria-label="بەرگری بە ئۆم"
                aria-valuenow={resistance}
                aria-valuemin={2}
                aria-valuemax={60}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Switch Toggle Button */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsSwitchClosed((prev) => !prev)}
                disabled={isControllerDisabled}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                  isSwitchClosed
                    ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>{isSwitchClosed ? "کلیل کراوەیە (تەزوو دەڕوات)" : "کلیل پچڕاوە (تەزوو 0)"}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isControllerDisabled}
                className="p-2.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition cursor-pointer"
                title="دووبارەکردنەوە"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Validation & Report Generator Card */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                سەلماندنی تەزووی کارەبا بە یاسای ئۆم:
              </span>
              <p className="text-[11px] text-slate-500">
                بەهای ئێستا: {circuitCurrent.toFixed(2)} A (چاوەڕوانکراو: {CIRCUIT_CONFIG.expectedOutcome} ± {CIRCUIT_CONFIG.toleranceRange})
              </p>
            </div>

            <button
              type="button"
              onClick={handleValidateResult}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>پشکنین و دروستکردنی ڕاپۆرت</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
