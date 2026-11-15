import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  SimulationState,
  ExperimentLogEntry,
  LabReportTemplate,
} from "./labTypes.ts";
import { CIRCULAR_CONFIG } from "./labConfigs.ts";

export interface CircularMotionSimulationProps {
  onGenerateReport: (report: LabReportTemplate) => void;
  isControllerDisabled?: boolean;
}

export { CIRCULAR_CONFIG };

export const CircularMotionSimulation: React.FC<CircularMotionSimulationProps> = ({
  onGenerateReport,
  isControllerDisabled = false,
}) => {
  // State Machine
  const [simState, setSimState] = useState<SimulationState>("SETUP");
  const [attempts, setAttempts] = useState(0);

  // Variables
  const [orbitRadius, setOrbitRadius] = useState(2.0);
  const [tangentialSpeed, setTangentialSpeed] = useState(6.0);
  const [bodyMass, setBodyMass] = useState(1.5);
  const [orbitAngle, setOrbitAngle] = useState(0);

  // Vectors toggles
  const [showVelocityVector, setShowVelocityVector] = useState(true);
  const [showAccelerationVector, setShowAccelerationVector] = useState(true);
  const [logs, setLogs] = useState<ExperimentLogEntry[]>([]);

  // Throttling ref
  const lastSliderTimeRef = useRef<number>(0);

  const angularSpeed = useMemo(() => tangentialSpeed / orbitRadius, [tangentialSpeed, orbitRadius]);
  const centripetalAcceleration = useMemo(() => (tangentialSpeed * tangentialSpeed) / orbitRadius, [tangentialSpeed, orbitRadius]);
  const centripetalForce = useMemo(() => bodyMass * centripetalAcceleration, [bodyMass, centripetalAcceleration]);

  // Animation frame loop with requestAnimationFrame
  useEffect(() => {
    if (simState !== "RUNNING") return;
    let animId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      setOrbitAngle((prev) => (prev + angularSpeed * dt) % (2 * Math.PI));
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [simState, angularSpeed]);

  // Space key toggles Run/Pause
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

  // Throttled sliders (max 60fps)
  const handleRadiusSlider = (val: number) => {
    const now = performance.now();
    if (now - lastSliderTimeRef.current < 16) return;
    lastSliderTimeRef.current = now;

    const old = orbitRadius;
    setOrbitRadius(val);
    recordLog("orbitRadius", "نیوەتیرە", old, val, "m", `تاودانی چەقەهێز گۆڕا بۆ ${((tangentialSpeed * tangentialSpeed) / val).toFixed(1)} m/s²`);
  };

  const handleSpeedSlider = (val: number) => {
    const now = performance.now();
    if (now - lastSliderTimeRef.current < 16) return;
    lastSliderTimeRef.current = now;

    const old = tangentialSpeed;
    setTangentialSpeed(val);
    recordLog("tangentialSpeed", "خێرایی لێکەوت", old, val, "m/s", `تاودانی چەقەهێز بوو بە ${((val * val) / orbitRadius).toFixed(1)} m/s²`);
  };

  const handleReset = () => {
    setOrbitRadius(2.0);
    setTangentialSpeed(6.0);
    setBodyMass(1.5);
    setSimState("SETUP");
    recordLog("reset", "دوبارەکردنەوەی تاقیکردنەوە", 0, 0, "", "گەڕانەوە بۆ بەها بنەڕەتییەکان");
  };

  const handleValidateResult = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    const isMatch = Math.abs(centripetalAcceleration - CIRCULAR_CONFIG.expectedOutcome) <= CIRCULAR_CONFIG.toleranceRange;
    if (isMatch) {
      setSimState("COMPLETED");
    } else if (nextAttempts >= CIRCULAR_CONFIG.maxAttempts) {
      setSimState("FAILED");
    } else {
      setSimState("PAUSED");
    }

    const report: LabReportTemplate = {
      reportId: "REP-CIRC-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      labId: CIRCULAR_CONFIG.labId,
      subject: CIRCULAR_CONFIG.subject,
      grade: CIRCULAR_CONFIG.grade,
      studentName: "قوتابی",
      date: new Date().toLocaleDateString("ku-IQ"),
      status: isMatch ? "COMPLETED" : nextAttempts >= CIRCULAR_CONFIG.maxAttempts ? "FAILED" : "PAUSED",
      hypothesis: "لە بزووتنی خولاو بە خێرایی جێگیر، تاودانی چەقەهێز ڕاستەوانە لەگەڵ دووجای خێرایی و پێچەوانە لەگەڵ نیوەتیرەی بازنەکە دەگۆڕێت (a_c = v² / r).",
      variables: [
        { name: "نیوەتیرەی خولانەوە (r)", unit: "m", initialValue: 2.0, finalValue: orbitRadius },
        { name: "خێرایی لێکەوت (v)", unit: "m/s", initialValue: 6.0, finalValue: tangentialSpeed },
        { name: "بارستەی تەن (m)", unit: "kg", initialValue: 1.5, finalValue: bodyMass },
      ],
      observations: [
        `نیوەتیرەی ئێستا: ${orbitRadius} m`,
        `خێرایی لێکەوت: ${tangentialSpeed} m/s`,
        `تاودانی چەقەهێز: ${centripetalAcceleration.toFixed(2)} m/s²`,
        `هێزی چەقەهێز: ${centripetalForce.toFixed(2)} N`,
      ],
      logs,
      studentResult: +centripetalAcceleration.toFixed(2),
      expectedOutcome: CIRCULAR_CONFIG.expectedOutcome,
      toleranceRange: CIRCULAR_CONFIG.toleranceRange,
      isOutcomeValid: isMatch,
      conclusion: isMatch
        ? `ئەنجامەکە سەلمێندرا کە a_c = (6.0)² / 2.0 = 18.0 m/s²، کە بە تەواوی لەگەڵ یاساکانی فیزیای پۆلی ١٢ یەکدەگرێتەوە.`
        : `بەهای بەدەستهاتوو (${centripetalAcceleration.toFixed(2)} m/s²) لە ئەنجامی چاوەڕوانکراو (18.0 m/s²) دوورە. تکایە بەهاکانی r و v ڕێکبخەرەوە.`,
    };

    onGenerateReport(report);
  };

  // SVG Coordinates for Circular Canvas
  const orbitSvgCx = 180;
  const orbitSvgCy = 180;
  const orbitScale = 22;
  const scaledR = Math.min(130, Math.max(35, orbitRadius * orbitScale));
  const particleX = orbitSvgCx + scaledR * Math.cos(orbitAngle);
  const particleY = orbitSvgCy + scaledR * Math.sin(orbitAngle);

  // Tangent velocity vector
  const velLen = Math.min(45, tangentialSpeed * 2.5);
  const velEndX = particleX - velLen * Math.sin(orbitAngle);
  const velEndY = particleY + velLen * Math.cos(orbitAngle);

  // Centripetal acceleration vector (towards center)
  const accLen = Math.min(50, Math.sqrt(centripetalAcceleration) * 6);
  const accEndX = particleX - accLen * Math.cos(orbitAngle);
  const accEndY = particleY - accLen * Math.sin(orbitAngle);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 font-sans" dir="rtl">
      {/* State Machine Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {CIRCULAR_CONFIG.titleKu}
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                simState === "RUNNING"
                  ? "bg-sky-50 text-sky-700 border-sky-200 animate-pulse"
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
          <p className="text-xs text-slate-500 mt-0.5">{CIRCULAR_CONFIG.descriptionKu}</p>
        </div>

        {/* Space key hint */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
          <kbd className="bg-white px-1.5 py-0.5 rounded border text-slate-700 font-bold shadow-2xs">Space</kbd>
          <span>دەستپێکردن / ڕاگرتن</span>
        </div>
      </div>

      {/* Main Interactive Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Physics Canvas Simulation Stage (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden shadow-inner">
          <svg viewBox="0 0 360 360" className="w-full max-w-[320px] h-auto drop-shadow-lg">
            {/* Circular Orbit Path */}
            <circle
              cx={orbitSvgCx}
              cy={orbitSvgCy}
              r={scaledR}
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Orbit Center */}
            <circle cx={orbitSvgCx} cy={orbitSvgCy} r="5" fill="#f59e0b" />
            <text x={orbitSvgCx + 8} y={orbitSvgCy - 8} fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
              چەق (Center)
            </text>

            {/* Radius Line */}
            <line
              x1={orbitSvgCx}
              y1={orbitSvgCy}
              x2={particleX}
              y2={particleY}
              stroke="#475569"
              strokeWidth="1.5"
            />

            {/* Velocity Vector (Tangential, Blue) */}
            {showVelocityVector && (
              <g>
                <line
                  x1={particleX}
                  y1={particleY}
                  x2={velEndX}
                  y2={velEndY}
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
                <circle cx={velEndX} cy={velEndY} r="3" fill="#38bdf8" />
              </g>
            )}

            {/* Centripetal Acceleration Vector (Towards Center, Red) */}
            {showAccelerationVector && (
              <g>
                <line
                  x1={particleX}
                  y1={particleY}
                  x2={accEndX}
                  y2={accEndY}
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                />
                <circle cx={accEndX} cy={accEndY} r="3" fill="#f43f5e" />
              </g>
            )}

            {/* Moving Particle */}
            <circle cx={particleX} cy={particleY} r="9" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
          </svg>

          {/* Real-Time Telemetry Bar */}
          <div className="w-full mt-3 grid grid-cols-2 gap-2 text-center text-xs font-mono">
            <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-sans">تاودانی چەقەهێز (a_c):</span>
              <span className="text-amber-400 font-bold text-sm">{centripetalAcceleration.toFixed(1)} m/s²</span>
            </div>
            <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-sans">هێزی چەقەهێز (F_c):</span>
              <span className="text-sky-400 font-bold text-sm">{centripetalForce.toFixed(1)} N</span>
            </div>
          </div>
        </div>

        {/* Variables Sliders & Real-Time Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>دەستکاریکردنی گۆڕاوەکانی جووڵە:</span>
            </h4>

            {/* Slider 1: Radius */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>نیوەتیرەی خولانەوە (r):</span>
                <span className="font-mono text-indigo-600">{orbitRadius} m</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={orbitRadius}
                disabled={isControllerDisabled}
                onChange={(e) => handleRadiusSlider(parseFloat(e.target.value))}
                aria-label="نیوەتیرەی خولانەوە بە مەتر"
                aria-valuenow={orbitRadius}
                aria-valuemin={1.0}
                aria-valuemax={10.0}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Slider 2: Speed */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>خێرایی لێکەوت (v):</span>
                <span className="font-mono text-indigo-600">{tangentialSpeed} m/s</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="20.0"
                step="0.5"
                value={tangentialSpeed}
                disabled={isControllerDisabled}
                onChange={(e) => handleSpeedSlider(parseFloat(e.target.value))}
                aria-label="خێرایی لێکەوت بە مەتر لە چرکەدا"
                aria-valuenow={tangentialSpeed}
                aria-valuemin={1.0}
                aria-valuemax={20.0}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Vector Toggles */}
            <div className="flex items-center gap-4 pt-1 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showVelocityVector}
                  onChange={(e) => setShowVelocityVector(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sky-600">ڤێکتەری خێرایی (v)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showAccelerationVector}
                  onChange={(e) => setShowAccelerationVector(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-rose-600">ڤێکتەری تاودان (a_c)</span>
              </label>
            </div>

            {/* Buttons Row */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSimState(simState === "RUNNING" ? "PAUSED" : "RUNNING")}
                disabled={isControllerDisabled}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                  simState === "RUNNING"
                    ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600 shadow-xs"
                }`}
              >
                {simState === "RUNNING" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{simState === "RUNNING" ? "ڕاگرتنی جووڵە" : "لێدانی جووڵە"}</span>
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
                سەلماندنی تاودانی چەقەهێز:
              </span>
              <p className="text-[11px] text-slate-500">
                بەهای ئێستا: {centripetalAcceleration.toFixed(1)} m/s² (چاوەڕوانکراو: {CIRCULAR_CONFIG.expectedOutcome} ± {CIRCULAR_CONFIG.toleranceRange})
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
