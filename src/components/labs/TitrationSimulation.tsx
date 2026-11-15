import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Droplets,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  SimulationState,
  ExperimentLogEntry,
  LabReportTemplate,
} from "./labTypes.ts";
import { TITRATION_CONFIG } from "./labConfigs.ts";

export interface TitrationSimulationProps {
  onGenerateReport: (report: LabReportTemplate) => void;
  isControllerDisabled?: boolean;
}

export { TITRATION_CONFIG };

export const TitrationSimulation: React.FC<TitrationSimulationProps> = ({
  onGenerateReport,
  isControllerDisabled = false,
}) => {
  // State Machine
  const [simState, setSimState] = useState<SimulationState>("SETUP");
  const [attempts, setAttempts] = useState(0);

  // Variables
  const [volumeAdded, setVolumeAdded] = useState(0);
  const [baseConcentration, setBaseConcentration] = useState(0.1);
  const acidConcentration = 0.1;

  // Animation & Dripping
  const [isDripping, setIsDripping] = useState(false);
  const [logs, setLogs] = useState<ExperimentLogEntry[]>([]);

  // Throttle ref for 60fps
  const lastSliderTimeRef = useRef<number>(0);

  // Log variable modification
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

  // Real-time pH calculation
  const currentPh = useMemo(() => {
    const vAcid = 25; // mL
    const cAcid = acidConcentration;
    const cBase = baseConcentration;
    const vBase = volumeAdded;

    const molAcid = (vAcid * cAcid) / 1000;
    const molBase = (vBase * cBase) / 1000;
    const totalVolumeL = (vAcid + vBase) / 1000;

    const equivalenceVol = (vAcid * cAcid) / cBase;
    const delta = vBase - equivalenceVol;

    if (Math.abs(delta) < 0.15) {
      return 7.0;
    } else if (vBase < equivalenceVol) {
      const excessH = (molAcid - molBase) / totalVolumeL;
      const ph = -Math.log10(Math.max(excessH, 1e-7));
      return Math.min(Math.max(ph, 1.0), 6.5);
    } else {
      const excessOH = (molBase - molAcid) / totalVolumeL;
      const pOH = -Math.log10(Math.max(excessOH, 1e-7));
      const ph = 14.0 - pOH;
      return Math.min(Math.max(ph, 7.5), 13.5);
    }
  }, [volumeAdded, baseConcentration, acidConcentration]);

  // Indicator color
  const indicatorColor = useMemo(() => {
    if (currentPh < 7.0) {
      return "bg-rose-100/70 border-rose-300";
    } else if (currentPh >= 7.0 && currentPh < 8.2) {
      return "bg-pink-200/80 border-pink-400";
    } else if (currentPh >= 8.2 && currentPh < 10) {
      return "bg-pink-400/80 border-pink-500 animate-pulse";
    } else {
      return "bg-fuchsia-600/80 border-fuchsia-700";
    }
  }, [currentPh]);

  // Keyboard navigation: Space key toggles Run/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (simState === "RUNNING") {
          setSimState("PAUSED");
        } else if (simState === "SETUP" || simState === "PAUSED") {
          setSimState("RUNNING");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [simState]);

  // Auto-dripping when state is RUNNING
  useEffect(() => {
    if (simState !== "RUNNING") return;
    const interval = setInterval(() => {
      setVolumeAdded((prev) => {
        if (prev >= 50) {
          setSimState("COMPLETED");
          return 50;
        }
        const next = +(prev + 0.5).toFixed(1);
        return next;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [simState]);

  // Throttled slider handler (max 60fps)
  const handleVolumeSlider = (val: number) => {
    const now = performance.now();
    if (now - lastSliderTimeRef.current < 16) return;
    lastSliderTimeRef.current = now;

    const old = volumeAdded;
    setVolumeAdded(val);
    if (simState === "SETUP") setSimState("RUNNING");
    recordLog("volumeAdded", "قەبارەی تفت", old, val, "mL", `pH بوو بە ${currentPh.toFixed(2)}`);
  };

  const handleAddDrop = () => {
    if (volumeAdded >= 50 || isControllerDisabled) return;
    setIsDripping(true);
    setTimeout(() => {
      const old = volumeAdded;
      const next = Math.min(50, +(old + 0.5).toFixed(1));
      setVolumeAdded(next);
      setIsDripping(false);
      if (simState === "SETUP") setSimState("RUNNING");
      recordLog("volumeAdded", "دڵۆپاندنی تفت", old, next, "mL", `گۆڕانی ڕەنگ و بەهای pH`);
    }, 120);
  };

  const handleReset = () => {
    setVolumeAdded(0);
    setSimState("SETUP");
    recordLog("reset", "دوبارەکردنەوەی تاقیگە", volumeAdded, 0, "mL", "گەڕانەوە بۆ خاڵی سەرەتا");
  };

  // Validate student result vs expected outcome
  const handleValidateResult = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    const isMatch = Math.abs(currentPh - TITRATION_CONFIG.expectedOutcome) <= TITRATION_CONFIG.toleranceRange;
    if (isMatch) {
      setSimState("COMPLETED");
    } else if (nextAttempts >= TITRATION_CONFIG.maxAttempts) {
      setSimState("FAILED");
    } else {
      setSimState("PAUSED");
    }

    // Prepare full auto-generated lab report
    const report: LabReportTemplate = {
      reportId: "REP-TITR-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      labId: TITRATION_CONFIG.labId,
      subject: TITRATION_CONFIG.subject,
      grade: TITRATION_CONFIG.grade,
      studentName: "قوتابی",
      date: new Date().toLocaleDateString("ku-IQ"),
      status: isMatch ? "COMPLETED" : nextAttempts >= TITRATION_CONFIG.maxAttempts ? "FAILED" : "PAUSED",
      hypothesis: "کاتێک تفتی بەهێز NaOH زیاد دەکرێت بۆ ترشی HCl بە بوونی فینۆڵفیشالین، لە خاڵی هاوتایی pH یەکسان دەبێت بە 7.0 و ڕەنگی گیراوەکە لە بێڕەنگەوە دەگۆڕێت بۆ پەمەیی کاڵ.",
      variables: [
        { name: "قەبارەی تفتی NaOH", unit: "mL", initialValue: 0, finalValue: volumeAdded },
        { name: "خەستی تفتی NaOH", unit: "M", initialValue: baseConcentration, finalValue: baseConcentration },
        { name: "خەستی ترشی HCl", unit: "M", initialValue: acidConcentration, finalValue: acidConcentration },
      ],
      observations: [
        `قەبارەی پێویست بۆ هاوتایی: ${volumeAdded} mL`,
        `بەهای pH کۆتایی: ${currentPh.toFixed(2)}`,
        `ڕەنگی هەستەوەر: ${currentPh >= 8.2 ? "پەمەیی تۆخ" : currentPh >= 7.0 ? "پەمەیی کاڵ" : "بێڕەنگ/ڕوون"}`,
      ],
      logs,
      studentResult: +currentPh.toFixed(2),
      expectedOutcome: TITRATION_CONFIG.expectedOutcome,
      toleranceRange: TITRATION_CONFIG.toleranceRange,
      isOutcomeValid: isMatch,
      conclusion: isMatch
        ? `تاقیکردنەوەکە سەلماندی کە لە خاڵی هاوتاییدا بڕی مۆڵەکانی H⁺ و OH⁻ یەکسان بوون و pH گەیشتە ${currentPh.toFixed(2)} بەپێی مەنهەجی کیمیای پۆلی ١٢.`
        : `بەهای بەدەستهاتوو (${currentPh.toFixed(2)}) لە خاڵی بێلایەنی دوورە. پێویستە قەبارەی تفت بە وریاییەوە دڵۆپ دڵۆپ کۆنتڕۆڵ بکرێت.`,
    };

    onGenerateReport(report);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 font-sans" dir="rtl">
      {/* State Machine Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {TITRATION_CONFIG.titleKu}
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                simState === "RUNNING"
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse"
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
          <p className="text-xs text-slate-500 mt-0.5">{TITRATION_CONFIG.descriptionKu}</p>
        </div>

        {/* Space key hint badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
          <kbd className="bg-white px-1.5 py-0.5 rounded border text-slate-700 font-bold shadow-2xs">Space</kbd>
          <span>دەستپێکردن / ڕاگرتن</span>
        </div>
      </div>

      {/* Main Interactive Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Burette & Beaker Animation Stage (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100/60 rounded-2xl border border-slate-200/80 p-5 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden">
          {/* Burette Stand & Tube */}
          <div className="w-16 h-48 border-2 border-slate-400/80 rounded-t-lg relative bg-white/70 shadow-inner flex flex-col justify-end">
            {/* Graduations */}
            <div className="absolute inset-y-2 left-1 flex flex-col justify-between text-[8px] font-mono text-slate-400 select-none">
              <span>0</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
              <span>40</span>
              <span>50</span>
            </div>

            {/* Liquid inside burette (NaOH) */}
            <div
              className="w-full bg-indigo-300/60 transition-all duration-300 border-t border-indigo-400"
              style={{ height: `${Math.max(0, 100 - (volumeAdded / 50) * 100)}%` }}
            />

            {/* Burette Tip & Stopcock */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3 h-5 bg-slate-400 rounded-b-sm">
              {/* Animated drop */}
              {isDripping && (
                <div className="w-2 h-2.5 bg-indigo-400 rounded-full absolute -bottom-3 left-1/2 -translate-x-1/2 animate-bounce" />
              )}
            </div>
          </div>

          {/* Air Gap */}
          <div className="h-8" />

          {/* Erlenmeyer Flask */}
          <div className="w-36 h-32 relative flex items-end justify-center">
            {/* Flask Body SVG */}
            <svg viewBox="0 0 100 90" className="w-full h-full drop-shadow-md">
              <path
                d="M40 0 L60 0 L60 25 L92 80 A8 8 0 0 1 85 90 L15 90 A8 8 0 0 1 8 80 L40 25 Z"
                fill="rgba(255, 255, 255, 0.85)"
                stroke="#64748b"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Liquid Level inside flask */}
              <path
                d="M22 86 L78 86 L68 55 L32 55 Z"
                className={`transition-all duration-500 ${indicatorColor}`}
              />
            </svg>
            <span className="absolute bottom-3 text-[10px] font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded-md shadow-2xs">
              HCl (25 mL) + NaOH ({volumeAdded} mL)
            </span>
          </div>

          {/* pH Indicator Display Badge */}
          <div className="mt-4 flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-bold">پێوەری pH:</span>
            <span
              className={`text-xl font-mono font-black ${
                currentPh < 6.8 ? "text-rose-600" : currentPh <= 7.2 ? "text-emerald-600" : "text-fuchsia-600"
              }`}
            >
              {currentPh.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Variables Sliders & Real-Time Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Controls Card */}
          <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>دەستکاریکردنی گۆڕاوەکان (Variables Sliders):</span>
            </h4>

            {/* Slider 1: Volume Added */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>قەبارەی تفتی زیادکراو (V_b):</span>
                <span className="font-mono text-indigo-600">{volumeAdded} mL</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={volumeAdded}
                disabled={isControllerDisabled}
                onChange={(e) => handleVolumeSlider(parseFloat(e.target.value))}
                aria-label="قەبارەی تفتی سۆدیۆم هایدرۆکساید بە میلیلیتر"
                aria-valuenow={volumeAdded}
                aria-valuemin={0}
                aria-valuemax={50}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 mL</span>
                <span>خاڵی هاوتایی (25 mL)</span>
                <span>50 mL</span>
              </div>
            </div>

            {/* Slider 2: Base Concentration */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>خەستی تفتی NaOH:</span>
                <span className="font-mono text-indigo-600">{baseConcentration} M</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={baseConcentration}
                disabled={isControllerDisabled || simState === "RUNNING"}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const old = baseConcentration;
                  setBaseConcentration(val);
                  recordLog("baseConcentration", "خەستی تفت", old, val, "M", "گۆڕینی خەستی تفت");
                }}
                aria-label="خەستی تفتی سۆدیۆم هایدرۆکساید بە مۆلار"
                aria-valuenow={baseConcentration}
                aria-valuemin={0.05}
                aria-valuemax={0.5}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Action Buttons Row */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAddDrop}
                disabled={volumeAdded >= 50 || isControllerDisabled}
                className="flex-1 min-w-[120px] py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Droplets className="w-4 h-4" />
                <span>دڵۆپاندن (+0.5 mL)</span>
              </button>

              <button
                type="button"
                onClick={() => setSimState(simState === "RUNNING" ? "PAUSED" : "RUNNING")}
                disabled={isControllerDisabled}
                className={`py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                  simState === "RUNNING"
                    ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {simState === "RUNNING" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{simState === "RUNNING" ? "ڕاگرتن" : "لێدان"}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isControllerDisabled}
                className="p-2.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition cursor-pointer"
                title="دووبارەکردنەوەی تاقیکردنەوە"
                aria-label="دووبارەکردنەوە"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Validation & Report Generator CTA Card */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                سەلماندنی ئەنجام (Result Validation):
              </span>
              <p className="text-[11px] text-slate-500">
                بەهای ئێستا: {currentPh.toFixed(2)} (ئەنجامی چاوەڕوانکراو: {TITRATION_CONFIG.expectedOutcome} ± {TITRATION_CONFIG.toleranceRange})
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
