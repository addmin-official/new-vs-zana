import React, { useState, useMemo, useEffect } from "react";
import {
  FlaskConical,
  Atom,
  RotateCcw,
  Droplets,
  BarChart3,
  CheckCircle2,
  Dna,
  Zap,
  Play,
  Pause,
  Compass,
  Sparkles,
  Lock,
} from "lucide-react";
import { useAppStore } from "../store/appStore.ts";

export type LabType = "titration" | "mechanics" | "electrochemistry" | "microscopy";

export function VirtualScienceLab() {
  const user = useAppStore((state) => state.user);
  const rawSubj = (user.activeSubject || "chemistry").toLowerCase();
  const studentGrade = user.grade || "12";
  const studentStream = user.stream || "scientific";
  const streamLabel = studentStream === "scientific" ? "بەشی زانستی" : "بەشی وێژەیی";

  // Determine allowed labs strictly scoped to the student's enrolled active subject
  const availableLabs = useMemo(() => {
    if (rawSubj === "physics") {
      return [
        { id: "mechanics", label: "بزووتنی خولاو (فیزیا)", icon: <Atom className="w-4 h-4 text-sky-500" /> },
        { id: "electrochemistry", label: "یاسای ئۆم و سوڕ (فیزیا)", icon: <Zap className="w-4 h-4 text-amber-500" /> },
      ];
    } else if (rawSubj === "biology") {
      return [
        { id: "microscopy", label: "مایکرۆسکۆپ (زیندەزانی)", icon: <Dna className="w-4 h-4 text-purple-500" /> },
      ];
    } else {
      // Chemistry and standard default
      return [
        { id: "titration", label: "تیتراسیۆن (کیمیا)", icon: <FlaskConical className="w-4 h-4 text-emerald-500" /> },
      ];
    }
  }, [rawSubj]);

  const [activeLab, setActiveLab] = useState<LabType>(() => {
    if (rawSubj === "physics") return "mechanics";
    if (rawSubj === "biology") return "microscopy";
    return "titration";
  });

  useEffect(() => {
    if (rawSubj === "physics") {
      if (activeLab !== "mechanics" && activeLab !== "electrochemistry") {
        setActiveLab("mechanics");
      }
    } else if (rawSubj === "biology") {
      setActiveLab("microscopy");
    } else {
      setActiveLab("titration");
    }
  }, [rawSubj]);

  // ───────────────────────────────────────────────────────────────────────────
  // 1. CHEMISTRY: Acid-Base Titration Lab (پێوەری pH و تیتراسیۆن)
  // ───────────────────────────────────────────────────────────────────────────
  const [volumeAdded, setVolumeAdded] = useState<number>(0);
  const [isDripping, setIsDripping] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const currentPh = useMemo(() => {
    const vAcid = 25; // mL
    const cAcid = 0.1; // M
    const cBase = 0.1; // M
    const vBase = volumeAdded; // mL

    const molAcid = (vAcid * cAcid) / 1000;
    const molBase = (vBase * cBase) / 1000;
    const totalVolumeL = (vAcid + vBase) / 1000;

    if (vBase < 24.9) {
      const excessH = (molAcid - molBase) / totalVolumeL;
      const ph = -Math.log10(Math.max(excessH, 1e-7));
      return Math.min(Math.max(ph, 1.0), 6.5);
    } else if (vBase >= 24.9 && vBase <= 25.1) {
      return 7.0;
    } else {
      const excessOH = (molBase - molAcid) / totalVolumeL;
      const pOH = -Math.log10(Math.max(excessOH, 1e-7));
      const ph = 14.0 - pOH;
      return Math.min(Math.max(ph, 7.5), 13.2);
    }
  }, [volumeAdded]);

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

  const handleAddDrop = () => {
    if (volumeAdded >= 50) return;
    setIsDripping(true);
    setTimeout(() => {
      setVolumeAdded((prev) => Math.min(50, +(prev + 0.5).toFixed(1)));
      setIsDripping(false);
    }, 150);
  };

  const handleResetTitration = () => {
    setVolumeAdded(0);
    setShowAnalysis(false);
  };

  const curvePoints = useMemo(() => {
    const pts: { v: number; ph: number }[] = [];
    for (let v = 0; v <= 50; v += 1) {
      const vAcid = 25;
      const cAcid = 0.1;
      const cBase = 0.1;
      const molAcid = (vAcid * cAcid) / 1000;
      const molBase = (v * cBase) / 1000;
      const totalVolumeL = (vAcid + v) / 1000;

      let ph = 1.0;
      if (v < 24.9) {
        const excessH = (molAcid - molBase) / totalVolumeL;
        ph = -Math.log10(Math.max(excessH, 1e-7));
      } else if (v >= 24.9 && v <= 25.1) {
        ph = 7.0;
      } else {
        const excessOH = (molBase - molAcid) / totalVolumeL;
        const pOH = -Math.log10(Math.max(excessOH, 1e-7));
        ph = 14.0 - pOH;
      }
      pts.push({ v, ph: Math.min(14, Math.max(1, ph)) });
    }
    return pts;
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // 2. PHYSICS: Circular Motion & Centripetal Acceleration (بزووتنی خولاو)
  // ───────────────────────────────────────────────────────────────────────────
  const [orbitRadius, setOrbitRadius] = useState<number>(2.0); // m
  const [tangentialSpeed, setTangentialSpeed] = useState<number>(6.0); // m/s
  const [bodyMass, setBodyMass] = useState<number>(1.5); // kg
  const [isOrbiting, setIsOrbiting] = useState<boolean>(true);
  const [showVelocityVector, setShowVelocityVector] = useState(true);
  const [showAccelerationVector, setShowAccelerationVector] = useState(true);
  const [_showForceVector, _setShowForceVector] = useState(true);
  const [orbitAngle, setOrbitAngle] = useState<number>(0);
  const [circularChallengeAnswer, setCircularChallengeAnswer] = useState<string | null>(null);

  // Derived Circular Physics:
  // ω = v / r
  // T = 2πr / v
  // ac = v² / r
  // Fc = m · ac
  const angularSpeed = useMemo(() => tangentialSpeed / orbitRadius, [tangentialSpeed, orbitRadius]);
  const orbitPeriod = useMemo(() => (2 * Math.PI * orbitRadius) / tangentialSpeed, [orbitRadius, tangentialSpeed]);
  const _orbitFrequency = useMemo(() => 1 / orbitPeriod, [orbitPeriod]);
  const centripetalAcceleration = useMemo(() => (tangentialSpeed * tangentialSpeed) / orbitRadius, [tangentialSpeed, orbitRadius]);
  const centripetalForce = useMemo(() => bodyMass * centripetalAcceleration, [bodyMass, centripetalAcceleration]);

  // Animation frame loop for smooth circular orbit
  useEffect(() => {
    if (!isOrbiting || activeLab !== "mechanics") return;
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
  }, [isOrbiting, angularSpeed, activeLab]);

  // SVG parameters for circular motion
  const orbitSvgCx = 180;
  const orbitSvgCy = 180;
  const orbitScale = 26; // pixels per meter
  const scaledR = Math.min(130, Math.max(30, orbitRadius * orbitScale));
  const particleX = orbitSvgCx + scaledR * Math.cos(orbitAngle);
  const particleY = orbitSvgCy + scaledR * Math.sin(orbitAngle);

  // Tangent velocity vector (perpendicular to radius, forward along direction of rotation)
  const velLen = Math.min(50, tangentialSpeed * 3);
  const velEndX = particleX - velLen * Math.sin(orbitAngle);
  const velEndY = particleY + velLen * Math.cos(orbitAngle);

  // Centripetal acceleration & force vectors (pointing towards center cx, cy)
  const accLen = Math.min(55, Math.sqrt(centripetalAcceleration) * 6);
  const accEndX = particleX - accLen * Math.cos(orbitAngle);
  const accEndY = particleY - accLen * Math.sin(orbitAngle);

  // ───────────────────────────────────────────────────────────────────────────
  // 3. PHYSICS: Electric Circuit & Ohm's Law (یاسای ئۆم و سوڕی کارەبایی)
  // ───────────────────────────────────────────────────────────────────────────
  const [voltage, setVoltage] = useState<number>(12.0); // V
  const [resistance, setResistance] = useState<number>(24.0); // Ω
  const [isSwitchClosed, setIsSwitchClosed] = useState<boolean>(true);
  const [circuitQuizAnswer, setCircuitQuizAnswer] = useState<string | null>(null);

  // Ohm's Law: I = V / R, P = V * I
  const circuitCurrent = useMemo(() => {
    if (!isSwitchClosed) return 0;
    return voltage / resistance;
  }, [isSwitchClosed, voltage, resistance]);

  const circuitPower = useMemo(() => {
    return circuitCurrent * voltage;
  }, [circuitCurrent, voltage]);

  // Bulb brightness opacity/glow (0 to 1)
  const bulbGlow = useMemo(() => {
    if (!isSwitchClosed) return 0;
    // Scale power 0 to 25W -> 0.1 to 1.0
    return Math.min(1, Math.max(0.15, circuitPower / 18));
  }, [isSwitchClosed, circuitPower]);

  // ───────────────────────────────────────────────────────────────────────────
  // 4. BIOLOGY: Microscopy Lab (مایکرۆسکۆپ)
  // ───────────────────────────────────────────────────────────────────────────
  const [specimen, setSpecimen] = useState<"plant" | "animal" | "chloroplast">("plant");
  const [magnification, setMagnification] = useState<number>(10);
  const [focusLevel, setFocusLevel] = useState<number>(90);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full" dir="rtl">
      {/* 1. Header & Locked Lab Selector Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              تاقیگەی زانستیی کارلێککارانە و ٣D 🧪⚡
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <Lock className="w-3 h-3 text-amber-600" />
              <span>پۆلی {studentGrade} • {streamLabel} (جێگیرکراوە)</span>
            </span>
          </div>
          <h1 className="font-sans font-black text-2xl text-slate-900 mt-2">
            {activeLab === "titration" && "هاوسەنگی ترش و تفت (تیتراسیۆن) • کیمیا"}
            {activeLab === "mechanics" && "سیمولەیشنی بزووتنی خولاو و تاودانی ناوەکی • فیزیا"}
            {activeLab === "electrochemistry" && "سوڕی کارەبایی و یاسای ئۆم (Ohm's Law) • فیزیا"}
            {activeLab === "microscopy" && "مایکرۆسکۆپی ئەلکترۆنی و پێکهاتەی خانە • زیندەزانی"}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-500 mt-1">
            سیستەمی تاقیگەی فەرمی پۆلی {studentGrade}ی {streamLabel} تایبەت بە بابەتی چەسپاوی {rawSubj === "chemistry" ? "کیمیا" : rawSubj === "physics" ? "فیزیا" : rawSubj === "biology" ? "زیندەزانی" : rawSubj}.
          </p>
        </div>

        {/* Lab Switcher Buttons (Strictly filtered for the active subject) */}
        <div className="flex flex-wrap items-center gap-2">
          {availableLabs.map((lab) => (
            <button
              key={lab.id}
              onClick={() => setActiveLab(lab.id as LabType)}
              className={`px-3 py-2 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeLab === lab.id
                  ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs"
              }`}
            >
              {lab.icon}
              <span>{lab.label}</span>
            </button>
          ))}
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>وانەی چەسپاو: {rawSubj === "chemistry" ? "کیمیا" : rawSubj === "physics" ? "فیزیا" : rawSubj === "biology" ? "زیندەزانی" : rawSubj}</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. PHYSICS LAB: Circular Motion (سیمولەیشنی بزووتنی خولاو)           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeLab === "mechanics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Main Visual & Interactive Canvas (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-6">
            {/* Live Metrics Header */}
            <div className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-100 text-right">
                <span className="text-[11px] text-sky-700 font-sans block">تاودانی ناوەکی (a_c)</span>
                <span className="font-sans font-black text-xl text-sky-900">
                  {centripetalAcceleration.toFixed(1)} <span className="text-xs text-sky-600 font-normal">m/s²</span>
                </span>
                <span className="text-[10px] text-sky-500 block font-mono">a_c = v²/r</span>
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-right">
                <span className="text-[11px] text-indigo-700 font-sans block">هێزی ناوەکی (F_c)</span>
                <span className="font-sans font-black text-xl text-indigo-900">
                  {centripetalForce.toFixed(1)} <span className="text-xs text-indigo-600 font-normal">N</span>
                </span>
                <span className="text-[10px] text-indigo-500 block font-mono">F_c = m·a_c</span>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-right">
                <span className="text-[11px] text-emerald-700 font-sans block">خولی خولانەوە (T)</span>
                <span className="font-sans font-black text-xl text-emerald-900">
                  {orbitPeriod.toFixed(2)} <span className="text-xs text-emerald-600 font-normal">s</span>
                </span>
                <span className="text-[10px] text-emerald-500 block font-mono">T = 2πr/v</span>
              </div>
            </div>

            {/* Orbit SVG Viewport */}
            <div className="h-80 sm:h-96 w-full flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-900 to-indigo-950 rounded-2xl border border-slate-800 p-4 overflow-hidden shadow-inner">
              {/* Starry Grid Background */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

              <svg viewBox="0 0 360 360" className="w-full h-full max-w-[340px] max-h-[340px] overflow-visible">
                <defs>
                  {/* Arrow markers for velocity (green) */}
                  <marker id="arrow-v" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                  </marker>
                  {/* Arrow marker for acceleration (cyan) */}
                  <marker id="arrow-a" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  {/* Arrow marker for force (amber/purple) */}
                  <marker id="arrow-f" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                  </marker>
                </defs>

                {/* Orbit track circle */}
                <circle
                  cx={orbitSvgCx}
                  cy={orbitSvgCy}
                  r={scaledR}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Center point (Hub / Sun / Anchor) */}
                <circle cx={orbitSvgCx} cy={orbitSvgCy} r="7" fill="#6366f1" className="shadow-lg" />
                <circle cx={orbitSvgCx} cy={orbitSvgCy} r="14" fill="#6366f1" opacity="0.3" className="animate-ping" />
                <text x={orbitSvgCx} y={orbitSvgCy + 22} textAnchor="middle" fill="#94a3b8" fontSize="10" className="font-sans">
                  چەقی خولانەوە
                </text>

                {/* Radius line from center to particle */}
                <line
                  x1={orbitSvgCx}
                  y1={orbitSvgCy}
                  x2={particleX}
                  y2={particleY}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />

                {/* Radius label */}
                <text
                  x={(orbitSvgCx + particleX) / 2}
                  y={(orbitSvgCy + particleY) / 2 - 6}
                  fill="#f8fafc"
                  fontSize="10"
                  textAnchor="middle"
                  className="font-mono font-bold"
                >
                  r = {orbitRadius.toFixed(1)}m
                </text>

                {/* Tangent Velocity Vector Arrow (Green) */}
                {showVelocityVector && (
                  <line
                    x1={particleX}
                    y1={particleY}
                    x2={velEndX}
                    y2={velEndY}
                    stroke="#10b981"
                    strokeWidth="3"
                    markerEnd="url(#arrow-v)"
                  />
                )}

                {/* Centripetal Acceleration Vector Arrow (Cyan, pointing to center) */}
                {showAccelerationVector && (
                  <line
                    x1={particleX}
                    y1={particleY}
                    x2={accEndX}
                    y2={accEndY}
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    markerEnd="url(#arrow-a)"
                  />
                )}

                {/* Rotating Body / Mass */}
                <circle
                  cx={particleX}
                  cy={particleY}
                  r={Math.min(16, 7 + bodyMass * 1.2)}
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="shadow-xl cursor-pointer"
                />
              </svg>

              {/* Legends inside the canvas */}
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl text-[11px] space-y-1.5 text-white">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-emerald-500 rounded-full" />
                  <span>خێراییی لێکەوتە (v_t)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-sky-400 rounded-full" />
                  <span>تاودانی ناوەکی (a_c)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span>تەنی خولاو (m = {bodyMass.toFixed(1)} kg)</span>
                </div>
              </div>

              {/* Play / Pause Overlay Button */}
              <button
                onClick={() => setIsOrbiting(!isOrbiting)}
                className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-slate-900 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-105"
              >
                {isOrbiting ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5 text-emerald-600 fill-current" />}
                <span>{isOrbiting ? "وەستاندنی کاتی" : "دەستپێکردنەوە"}</span>
              </button>
            </div>

            {/* Sliders & Physics Parameter Controls */}
            <div className="space-y-4 pt-2">
              {/* Radius Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-sans text-slate-700">
                  <span>نیوەتیرەی خولانەوە (Radius r):</span>
                  <span className="font-bold font-mono text-indigo-700">{orbitRadius.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="4.5"
                  step="0.1"
                  value={orbitRadius}
                  onChange={(e) => setOrbitRadius(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Tangential Speed Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-sans text-slate-700">
                  <span>خێراییی لێکەوتە (Tangential Velocity v):</span>
                  <span className="font-bold font-mono text-emerald-700">{tangentialSpeed.toFixed(1)} m/s</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="15.0"
                  step="0.5"
                  value={tangentialSpeed}
                  onChange={(e) => setTangentialSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Mass Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-sans text-slate-700">
                  <span>بارستەی تەنی خولاو (Mass m):</span>
                  <span className="font-bold font-mono text-rose-700">{bodyMass.toFixed(1)} kg</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.2"
                  value={bodyMass}
                  onChange={(e) => setBodyMass(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
              </div>

              {/* Vector Display Toggles */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={showVelocityVector}
                    onChange={(e) => setShowVelocityVector(e.target.checked)}
                    className="accent-emerald-600 rounded"
                  />
                  <span>نیشاندانی تیشکی خێرایی (v)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={showAccelerationVector}
                    onChange={(e) => setShowAccelerationVector(e.target.checked)}
                    className="accent-sky-600 rounded"
                  />
                  <span>نیشاندانی تاودانی ناوەکی (a_c)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Educational Analysis & Real-time Equations (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Core Physics Formulas Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-sans font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>یاسا و هاوکێشە بنەڕەتییەکانی بزووتنی خولاو</span>
                </h3>
              </div>

              <div className="space-y-2.5 text-xs font-sans text-slate-700">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold block">١. خێراییی گۆشەیی (Angular Velocity):</span>
                  <div className="font-mono font-bold text-indigo-800 text-sm mt-0.5" dir="ltr">
                    ω = v / r = {angularSpeed.toFixed(2)} rad/s
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold block">٢. تاودانی ناوەکی (Centripetal Accel):</span>
                  <div className="font-mono font-bold text-sky-800 text-sm mt-0.5" dir="ltr">
                    a_c = v² / r = ({tangentialSpeed.toFixed(1)})² / {orbitRadius.toFixed(1)} = {centripetalAcceleration.toFixed(1)} m/s²
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">ئاراستەکەی هەمیشە بەرەو چەقی خولانەوەیە.</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold block">٣. هێزی ناوەکی (Centripetal Force):</span>
                  <div className="font-mono font-bold text-rose-800 text-sm mt-0.5" dir="ltr">
                    F_c = m · a_c = {bodyMass.toFixed(1)} · {centripetalAcceleration.toFixed(1)} = {centripetalForce.toFixed(1)} N
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Kurdish Concept Challenge */}
            <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>پرسیاری هزر و تاقیکردنەوەی فەرمی (وزاری):</span>
              </div>

              <p className="text-xs text-slate-800 leading-relaxed font-sans">
                ئەگەر خێراییی لێکەوتە (<span dir="ltr" className="font-mono font-bold">v</span>) دوو هێندە زیاد بکات لە کاتێکدا نیوەتیرە (<span dir="ltr" className="font-mono font-bold">r</span>) و بارستە نەگۆڕ بمێننەوە، هێزی ناوەکی (<span dir="ltr" className="font-mono font-bold">F_c</span>) چەند دەبێت؟
              </p>

              <div className="space-y-2 pt-1">
                {[
                  { id: "A", text: "دوو هێندە زیاد دەکات", isCorrect: false },
                  { id: "B", text: "٤ هێندە زیاد دەکات (چونکە F_c هاوسەنگە لەگەڵ v²)", isCorrect: true },
                  { id: "C", text: "دەبێتە نیوە", isCorrect: false },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setCircularChallengeAnswer(opt.id)}
                    className={`w-full text-right p-2.5 rounded-xl text-xs font-sans font-bold transition-all border cursor-pointer ${
                      circularChallengeAnswer === opt.id
                        ? opt.isCorrect
                          ? "bg-emerald-100 border-emerald-400 text-emerald-900"
                          : "bg-rose-100 border-rose-400 text-rose-900"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span>{opt.text}</span>
                  </button>
                ))}
              </div>

              {circularChallengeAnswer === "B" && (
                <div className="bg-emerald-100/90 border border-emerald-300 p-2.5 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>ئافەرم! وەڵامەکەت تەواوە. لەبەر ئەوەی F_c = m·v²/r، هێزی ناوەکی پەیوەندیی ڕاستەوانەی هەیە لەگەڵ دووجای خێرایی.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. PHYSICS LAB: Electric Circuit & Ohm's Law (سوڕی کارەبا و یاسای ئۆم)*/}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeLab === "electrochemistry" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Circuit Visual & Live Apparatus (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-6">
            {/* Live Measurements Header (Voltmeter, Ammeter, Power) */}
            <div className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-right">
                <span className="text-[11px] text-amber-700 font-sans block">پێوەری ڤۆڵتیە (Voltmeter)</span>
                <span className="font-sans font-black text-xl text-amber-950">
                  {voltage.toFixed(1)} <span className="text-xs text-amber-700 font-normal">V</span>
                </span>
                <span className="text-[10px] text-amber-600 block mt-0.5">جیاوازی پۆتانسێل</span>
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-right">
                <span className="text-[11px] text-indigo-700 font-sans block">پێوەری تەزوو (Ammeter)</span>
                <span className="font-sans font-black text-xl text-indigo-950">
                  {circuitCurrent.toFixed(2)} <span className="text-xs text-indigo-700 font-normal">A</span>
                </span>
                <span className="text-[10px] text-indigo-600 block mt-0.5">
                  {isSwitchClosed ? `${(circuitCurrent * 1000).toFixed(0)} mA` : "سوڕ کراوەیە"}
                </span>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-right">
                <span className="text-[11px] text-emerald-700 font-sans block">توانای کارەبایی (Power)</span>
                <span className="font-sans font-black text-xl text-emerald-950">
                  {circuitPower.toFixed(1)} <span className="text-xs text-emerald-700 font-normal">W</span>
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">P = V · I</span>
              </div>
            </div>

            {/* Interactive Circuit Schematic SVG */}
            <div className="h-80 sm:h-96 w-full flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-4 overflow-hidden shadow-inner">
              <svg viewBox="0 0 400 280" className="w-full h-full max-w-[380px] max-h-[270px]">
                {/* Circuit Track Rectangle (Rounded copper wires) */}
                <rect
                  x="50"
                  y="40"
                  width="300"
                  height="200"
                  rx="16"
                  fill="none"
                  stroke={isSwitchClosed ? "#fbbf24" : "#475569"}
                  strokeWidth="5"
                  className="transition-colors duration-300"
                />

                {/* Flowing Electrons Animation Dots (Only when switch closed) */}
                {isSwitchClosed && (
                  <g className="animate-pulse">
                    {[
                      { cx: 120, cy: 40 },
                      { cx: 200, cy: 40 },
                      { cx: 280, cy: 40 },
                      { cx: 350, cy: 100 },
                      { cx: 350, cy: 180 },
                      { cx: 280, cy: 240 },
                      { cx: 200, cy: 240 },
                      { cx: 120, cy: 240 },
                      { cx: 50, cy: 180 },
                      { cx: 50, cy: 100 },
                    ].map((dot, idx) => (
                      <circle key={idx} cx={dot.cx} cy={dot.cy} r="4" fill="#38bdf8" />
                    ))}
                  </g>
                )}

                {/* Left Side: Battery / DC Power Supply */}
                <g transform="translate(50, 140)">
                  <rect x="-14" y="-22" width="28" height="44" rx="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="-10" y1="-8" x2="10" y2="-8" stroke="#ef4444" strokeWidth="3" />
                  <line x1="-5" y1="8" x2="5" y2="8" stroke="#38bdf8" strokeWidth="3" />
                  <text x="-20" y="-12" fill="#ef4444" fontSize="12" fontWeight="bold">+</text>
                  <text x="-20" y="16" fill="#38bdf8" fontSize="12" fontWeight="bold">-</text>
                  <text x="24" y="4" fill="#f8fafc" fontSize="10" fontWeight="bold" className="font-mono">
                    {voltage.toFixed(1)}V
                  </text>
                </g>

                {/* Top Side: Knife Switch */}
                <g transform="translate(200, 40)" className="cursor-pointer" onClick={() => setIsSwitchClosed(!isSwitchClosed)}>
                  <circle cx="-25" cy="0" r="5" fill="#f59e0b" />
                  <circle cx="25" cy="0" r="5" fill="#f59e0b" />
                  {/* Switch Arm */}
                  {isSwitchClosed ? (
                    <line x1="-25" y1="0" x2="25" y2="0" stroke="#f59e0b" strokeWidth="4" />
                  ) : (
                    <line x1="-25" y1="0" x2="15" y2="-22" stroke="#ef4444" strokeWidth="4" />
                  )}
                  <text x="0" y="-14" fill="#94a3b8" fontSize="10" textAnchor="middle" className="font-sans">
                    {isSwitchClosed ? "کلیل: داخراو" : "کلیل: کراوە (پچڕاو)"}
                  </text>
                </g>

                {/* Right Side: Resistor / Bulb (Load) */}
                <g transform="translate(350, 140)">
                  {/* Radial Bulb Glow Aura */}
                  {isSwitchClosed && (
                    <circle
                      cx="0"
                      cy="0"
                      r={30 * bulbGlow + 12}
                      fill="url(#bulbGlowGradient)"
                      opacity={bulbGlow}
                    />
                  )}
                  {/* Glass Bulb Dome */}
                  <circle
                    cx="0"
                    cy="0"
                    r="20"
                    fill={isSwitchClosed ? `rgba(253, 224, 71, ${0.4 + bulbGlow * 0.6})` : "#334155"}
                    stroke="#e2e8f0"
                    strokeWidth="2"
                  />
                  {/* Filament */}
                  <path
                    d="M -7 10 L -4 -2 L 0 5 L 4 -2 L 7 10"
                    fill="none"
                    stroke={isSwitchClosed ? "#f97316" : "#64748b"}
                    strokeWidth="2"
                  />
                  <text x="30" y="4" fill="#f8fafc" fontSize="10" fontWeight="bold" className="font-mono">
                    R = {resistance.toFixed(0)}Ω
                  </text>
                </g>

                {/* Bottom Side: Digital Ammeter Meter */}
                <g transform="translate(200, 240)">
                  <rect x="-35" y="-16" width="70" height="32" rx="6" fill="#0f172a" stroke="#6366f1" strokeWidth="2" />
                  <text x="0" y="4" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle" className="font-mono">
                    {circuitCurrent.toFixed(2)} A
                  </text>
                  <text x="0" y="24" fill="#94a3b8" fontSize="9" textAnchor="middle" className="font-sans">
                    پێوەری تەزوو
                  </text>
                </g>

                <defs>
                  <radialGradient id="bulbGlowGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>

              {/* Status pill inside visual */}
              <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-300">
                <span>تەزووی ئەلیکترۆن: {isSwitchClosed ? "ڕەوتەکە بەردەوامە ⚡" : "تەزوو سفڕە (کراوە)"}</span>
              </div>
            </div>

            {/* Circuit Sliders & Switch Toggle */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-sans text-slate-700">
                  <span>ڤۆڵتیەی سەرچاوە (Voltage V):</span>
                  <span className="font-bold font-mono text-amber-700">{voltage.toFixed(1)} V</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="24.0"
                  step="0.5"
                  value={voltage}
                  onChange={(e) => setVoltage(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-sans text-slate-700">
                  <span>بەرگریی بەکارهێنەر (Resistance R):</span>
                  <span className="font-bold font-mono text-indigo-700">{resistance.toFixed(0)} Ω</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="150"
                  step="5"
                  value={resistance}
                  onChange={(e) => setResistance(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setIsSwitchClosed(!isSwitchClosed)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                    isSwitchClosed
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>{isSwitchClosed ? "کردنەوەی سوڕ (پچڕاندن)" : "داخستنی سوڕ (بەستنەوە)"}</span>
                </button>

                <button
                  onClick={() => {
                    setVoltage(12);
                    setResistance(24);
                    setIsSwitchClosed(true);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>نوێکردنەوەی پێوەرەکان</span>
                </button>
              </div>
            </div>
          </div>

          {/* Educational Insights & Ohm's Law Quiz (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="font-sans font-bold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <span>یاسای ئۆم و ڕێژەی توانای کارەبایی</span>
              </h3>

              <div className="space-y-2.5 text-xs font-sans text-slate-700">
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-900 font-bold block">یاسای ئۆم (Ohm's Law):</span>
                  <div className="font-mono font-bold text-amber-950 text-sm mt-0.5" dir="ltr">
                    I = V / R = {voltage.toFixed(1)} / {resistance.toFixed(0)} = {circuitCurrent.toFixed(2)} A
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">تەزووی کارەبا هاوسەنگە بە شێوەی ڕاستەوانە لەگەڵ ڤۆڵتیە، و پێچەوانە لەگەڵ بەرگری.</span>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
                  <span className="text-[11px] text-indigo-900 font-bold block">توانای بەکارهاتوو (Power Dissipated):</span>
                  <div className="font-mono font-bold text-indigo-950 text-sm mt-0.5" dir="ltr">
                    P = V · I = I² · R = {circuitPower.toFixed(2)} Watt
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz Card */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>پرسیاری تێگەیشتنی کارەبا:</span>
              </div>

              <p className="text-xs text-slate-800 leading-relaxed font-sans">
                ئەگەر بەهای بەرگری (<span dir="ltr" className="font-mono font-bold">R</span>) دوو هێندە زیاد بکات لە کاتێکدا ڤۆڵتیەی بەتریەکە نەگۆڕ بێت، تەزووی کارەبا (<span dir="ltr" className="font-mono font-bold">I</span>) چی لێدێت؟
              </p>

              <div className="space-y-2 pt-1">
                {[
                  { id: "A", text: "دوو هێندە زیاد دەکات", isCorrect: false },
                  { id: "B", text: "دەبێتە نیوە (I = V / 2R)", isCorrect: true },
                  { id: "C", text: "هیچ گۆڕانکارییەکی بەسەردا نایەت", isCorrect: false },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setCircuitQuizAnswer(opt.id)}
                    className={`w-full text-right p-2.5 rounded-xl text-xs font-sans font-bold transition-all border cursor-pointer ${
                      circuitQuizAnswer === opt.id
                        ? opt.isCorrect
                          ? "bg-emerald-100 border-emerald-400 text-emerald-900"
                          : "bg-rose-100 border-rose-400 text-rose-900"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span>{opt.text}</span>
                  </button>
                ))}
              </div>

              {circuitQuizAnswer === "B" && (
                <div className="bg-emerald-100/90 border border-emerald-300 p-2.5 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>تەواوە! چونکە تەزووی کارەبا پێچەوانە هاوسەنگە لەگەڵ بەرگری.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. CHEMISTRY LAB: Acid-Base Titration (تیتراسیۆن)                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeLab === "titration" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Beaker & Apparatus Visual (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-right">
                <span className="text-[11px] text-slate-500 font-sans block">پێوەری ترشێتی (پێوەری pH)</span>
                <span className="font-sans font-black text-2xl text-indigo-700">
                  {currentPh.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {currentPh < 7.0 ? "گیراوەی ترش" : currentPh === 7.0 ? "هاوتا (بێ لایەن)" : "گیراوەی تفت"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-right">
                <span className="text-[11px] text-slate-500 font-sans block">قەبارەی زیادکراوی NaOH</span>
                <span className="font-sans font-black text-2xl text-slate-900">
                  {volumeAdded.toFixed(1)} <span className="text-xs text-slate-500 font-normal">mL</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  لە کۆی ٥٠ mL قەبارە
                </span>
              </div>
            </div>

            {/* Visual Glass Apparatus */}
            <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-50 to-indigo-50/20 rounded-2xl border border-slate-100 p-4">
              {/* Burette Tube (Top) */}
              <div className="w-8 h-28 bg-white/90 border-2 border-slate-400 rounded-t-sm flex flex-col items-center justify-end relative shadow-inner">
                <div
                  className="w-full bg-indigo-300/60 transition-all duration-300"
                  style={{ height: `${Math.max(10, ((50 - volumeAdded) / 50) * 100)}%` }}
                />
                <div className="w-3 h-4 bg-slate-600 rounded-b-xs" />
              </div>

              {/* Drip Droplet */}
              <div className="h-8 flex items-center justify-center">
                {isDripping && (
                  <div className="w-2.5 h-3 bg-indigo-500 rounded-full animate-bounce" />
                )}
              </div>

              {/* Erlenmeyer Flask / Beaker (Bottom) */}
              <div className="w-32 h-28 border-2 border-slate-400 rounded-b-3xl relative flex flex-col justify-end overflow-hidden shadow-sm bg-white/80">
                <div
                  className={`w-full transition-all duration-500 border-t ${indicatorColor}`}
                  style={{ height: `${Math.min(90, 40 + (volumeAdded / 50) * 50)}%` }}
                />
              </div>

              <div className="absolute bottom-2 right-4 text-xs font-sans text-slate-500 bg-white/90 px-2 py-1 rounded-lg border border-slate-200">
                <span>دەستنیشانکەر: فینۆڵفثالین</span>
              </div>
            </div>

            {/* Controls (Slider & Buttons) */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-sans text-slate-700">
                  <span>قەبارەی تفتی زیادکراو (NaOH 0.1 M):</span>
                  <span className="font-bold font-mono">{volumeAdded.toFixed(1)} mL</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="0.5"
                  value={volumeAdded}
                  onChange={(e) => setVolumeAdded(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0 mL</span>
                  <span className="text-indigo-600 font-bold">25 mL (خاڵی هاوتا)</span>
                  <span>50 mL</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleAddDrop}
                    disabled={volumeAdded >= 50}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Droplets className="w-4 h-4" />
                    <span>دڵۆپێک زیادبکە (0.5 mL)</span>
                  </button>

                  <button
                    onClick={handleResetTitration}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    title="نوێکردنەوەی تاقیگە"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>نوێکردنەوە</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>شیکاری ئەنجام و هاوکێشە</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Curve Plot & Chemical Analysis (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-sans font-bold text-xs text-slate-800">
                  هێڵکاری تیتراسیۆن (pH vs Volume)
                </h3>
                <span className="text-[10px] text-indigo-600 font-bold">
                  خاڵی هاوتا: 25 mL
                </span>
              </div>

              <div className="w-full h-44 bg-slate-50/80 rounded-xl border border-slate-200 p-2 relative">
                <svg viewBox="0 0 100 60" className="w-full h-full overflow-visible">
                  <line x1="10" y1="50" x2="95" y2="50" stroke="#cbd5e1" strokeWidth="0.5" />
                  <line x1="10" y1="10" x2="10" y2="50" stroke="#cbd5e1" strokeWidth="0.5" />
                  <line x1="10" y1="30" x2="95" y2="30" stroke="#94a3b8" strokeDasharray="1 1" strokeWidth="0.4" />

                  <polyline
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="1.5"
                    points={curvePoints
                      .map((p) => {
                        const x = 10 + (p.v / 50) * 85;
                        const y = 50 - (p.ph / 14) * 40;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />

                  <circle
                    cx={10 + (volumeAdded / 50) * 85}
                    cy={50 - (currentPh / 14) * 40}
                    r="2.5"
                    className="fill-rose-500 stroke-white stroke-1"
                  />
                </svg>

                <div className="flex justify-between text-[9px] text-slate-400 font-sans mt-1 px-2">
                  <span>0 mL</span>
                  <span>قەبارەی تفت (میلیلتر) ←</span>
                  <span>50 mL</span>
                </div>
              </div>
            </div>

            {showAnalysis ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ڕاپۆرتی تاقیگەی تیتراندن</span>
                </div>

                <div className="text-xs font-sans text-slate-700 space-y-2 leading-relaxed">
                  <p>
                    • <strong>هاوکێشەی کارلێک:</strong> HCl + NaOH → NaCl + H₂O
                  </p>
                  <p>
                    • <strong>خاڵی هاوتا لە تیتراندندا:</strong> لە کاتێکدایە کە ژمارەی مۆڵی ترش یەکسان دەبێت بە ژمارەی مۆڵی تفت (لە قەبارەی 25.0 mL).
                  </p>
                  <p>
                    • <strong>پێوەری pH لە خاڵی هاوتا:</strong> یەکسانە بە 7.0 چونکە خوێی دروستبوو (NaCl) بێلایەنە.
                  </p>
                  <p>
                    • <strong>گۆڕانی ڕەنگی فینۆڵفثالین:</strong> لە پلەی pH نزیکەی 8.2 ڕەنگی لە بێڕەنگەوە دەگۆڕێت بۆ پەمەیی.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-xs text-slate-600 font-sans space-y-2">
                <h4 className="font-bold text-slate-900">ڕێنمایی ئەنجامدانی تاقیگە:</h4>
                <p>
                  ١. سلایدەرەکە بجوڵێنە یان دوگمەی 'دڵۆپێک زیادبکە' دابگرە بۆ زیادکردنی NaOH.
                </p>
                <p>
                  ٢. چاودێری گۆڕانی ڕەنگی شلە ناو بیکەرەکە و بەهای pH Meter بکە کاتێک دەگەیتە دەوروبەری 25 mL.
                </p>
                <p>
                  ٣. پاشان کلیک لەسەر 'شیکاری ئەنجام و هاوکێشە' بکە بۆ بینینی هەڵسەنگاندنی فەرمی مەنهەج.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. BIOLOGY LAB: Microscopy (مایکرۆسکۆپ)                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeLab === "microscopy" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                هاوێنەی زیتکەرەوە: {magnification}x (کۆی گەورەکردن: {magnification * 10}x)
              </span>
              <span className="text-xs text-slate-500 font-sans">
                تیژکردنەوەی هاوێنە: {focusLevel}%
              </span>
            </div>

            {/* Circular Microscope Lens View */}
            <div className="h-80 sm:h-96 w-full flex items-center justify-center relative bg-slate-950 rounded-2xl p-4 overflow-hidden border border-slate-800">
              <div
                className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-slate-700 relative overflow-hidden bg-slate-900 flex items-center justify-center transition-all duration-300"
                style={{
                  filter: `blur(${Math.abs(100 - focusLevel) / 15}px)`,
                }}
              >
                {specimen === "plant" && (
                  <div className="w-full h-full bg-emerald-950/80 p-4 grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                      <div key={i} className="border-2 border-emerald-500/70 rounded-lg bg-emerald-800/30 flex items-center justify-center relative">
                        <div className="w-4 h-4 rounded-full bg-emerald-400/80 shadow-xs" />
                      </div>
                    ))}
                  </div>
                )}

                {specimen === "animal" && (
                  <div className="w-full h-full bg-rose-950/80 p-6 flex flex-wrap items-center justify-around">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-16 h-16 rounded-full border-2 border-pink-400 bg-pink-900/40 flex items-center justify-center shadow-md">
                        <div className="w-5 h-5 rounded-full bg-purple-400" />
                      </div>
                    ))}
                  </div>
                )}

                {specimen === "chloroplast" && (
                  <div className="w-full h-full bg-teal-950/90 flex items-center justify-center">
                    <div className="w-36 h-24 rounded-full border-3 border-emerald-400 bg-emerald-900/60 flex items-center justify-around px-3">
                      <div className="w-3 h-14 bg-emerald-300 rounded-full" />
                      <div className="w-3 h-14 bg-emerald-300 rounded-full" />
                      <div className="w-3 h-14 bg-emerald-300 rounded-full" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-sans text-slate-700">
                  <span>تیژکردنەوەی هاوێنە (Focus Adjustment):</span>
                  <span className="font-bold font-mono text-purple-700">{focusLevel}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="140"
                  value={focusLevel}
                  onChange={(e) => setFocusLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              {/* Magnification Objective Lenses */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-sans text-slate-700 font-bold">گەورەکردنی هاوێنە:</span>
                {[4, 10, 40, 100].map((mag) => (
                  <button
                    key={mag}
                    onClick={() => setMagnification(mag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono cursor-pointer transition-colors ${
                      magnification === mag
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {mag}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-sans font-bold text-xs text-slate-800">
                هەڵبژاردنی نموونەی پشکنین (Specimen)
              </h3>
              <div className="space-y-2">
                {[
                  { id: "plant", label: "خانەی ڕووەکی (پیاز)", desc: "دیواری خانە و ناوک ڕوون دەردەکەوێت" },
                  { id: "animal", label: "خانەی گیانلەبەری", desc: "پەردەی خانە و سایتۆپلازم و ناوک" },
                  { id: "chloroplast", label: "پلاستیدە سەوزەکان (Chloroplast)", desc: "ئەندامۆچکەی ڕۆشنپێکهاتن" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSpecimen(item.id as "plant" | "animal" | "chloroplast")}
                    className={`w-full text-right p-3 rounded-xl border text-xs font-sans transition-all cursor-pointer ${
                      specimen === item.id
                        ? "bg-purple-50 border-purple-300 text-purple-950 font-bold"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="block font-bold">{item.label}</span>
                    <span className="text-[11px] text-slate-400 font-normal">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VirtualScienceLab;
