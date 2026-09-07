import React, { useState } from "react";
import { VirtualLabPayload } from "../practiceTypes.ts";
import { Award, FlaskConical, CheckCircle2, Lightbulb, ArrowLeft, RotateCcw, Play, Pause } from "lucide-react";

interface ScienceVirtualLabProps {
  data: VirtualLabPayload;
  onComplete: (score: number, maxScore: number) => void;
}

export const ScienceVirtualLab: React.FC<ScienceVirtualLabProps> = ({ data, onComplete }) => {
  const [controls, setControls] = useState<Record<string, number>>(data.defaultControls);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctTasksCount, setCorrectTasksCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSimRunning, setIsSimRunning] = useState(true);

  const currentTask = data.tasks[currentTaskIndex];
  const selectedOption = currentTask?.options.find((opt) => opt.id === selectedOptionId);

  const handleControlChange = (key: string, val: number) => {
    setControls((prev) => ({ ...prev, [key]: val }));
  };

  const handleSelectOption = (optId: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionId(optId);
  };

  const handleSubmitTask = () => {
    if (!selectedOptionId || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    if (selectedOption?.isCorrect) {
      setCorrectTasksCount((prev) => prev + 1);
    }
  };

  const handleNextTask = () => {
    if (currentTaskIndex + 1 < data.tasks.length) {
      setCurrentTaskIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
    } else {
      setIsFinished(true);
      const finalScore = selectedOption?.isCorrect ? correctTasksCount + 1 : correctTasksCount;
      onComplete(finalScore, data.tasks.length);
    }
  };

  // --- 1. RENDER OHM'S LAW ELECTRIC CIRCUIT LAB ---
  const renderOhmsLawLab = () => {
    const voltage = controls["voltage"] ?? 12;
    const resistance = controls["resistance"] ?? 4;
    const current = parseFloat((voltage / resistance).toFixed(2));
    const power = parseFloat((voltage * current).toFixed(1));

    // Glow intensity: scaled between 0.2 and 1.0 based on power
    const glowIntensity = Math.min(1, Math.max(0.1, power / 120));
    const bulbColor = `rgba(251, 191, 36, ${glowIntensity})`;

    return (
      <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-4">
        {/* Lab Toolbar */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <span className="text-[11px] font-bold text-sky-400">خولگەی کارەبایی ڕاستەوخۆ</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSimRunning(!isSimRunning)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
            >
              {isSimRunning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
              <span>{isSimRunning ? "وەستاندن" : "دەستپێکردن"}</span>
            </button>
            <button
              onClick={() => setControls(data.defaultControls)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ڕێکخستنەوە</span>
            </button>
          </div>
        </div>

        {/* Visual Circuit Diagram Canvas */}
        <div className="relative w-full h-56 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-center p-2 select-none overflow-hidden">
          <svg width="320" height="200" className="overflow-visible">
            {/* Main Circuit Loop Rectangle */}
            <rect
              x="40"
              y="30"
              width="240"
              height="140"
              fill="none"
              stroke="#475569"
              strokeWidth="4"
              rx="12"
            />

            {/* Battery on Left Wire */}
            <rect x="34" y="80" width="12" height="40" fill="#0F172A" />
            <line x1="30" y1="88" x2="50" y2="88" stroke="#38BDF8" strokeWidth="4" />
            <line x1="35" y1="102" x2="45" y2="102" stroke="#94A3B8" strokeWidth="2.5" />
            <text x="18" y="100" fill="#38BDF8" fontSize="10" fontWeight="bold">+{voltage}V</text>

            {/* Resistor on Top Wire */}
            <rect x="120" y="24" width="70" height="14" fill="#1E293B" rx="3" stroke="#F59E0B" strokeWidth="1.5" />
            <text x="155" y="35" fill="#FDE68A" fontSize="9" fontWeight="bold" textAnchor="middle">
              {resistance} Ω
            </text>

            {/* Light Bulb on Bottom Wire */}
            <g transform="translate(145, 150)">
              {/* Outer Glow */}
              <circle cx="15" cy="15" r={22 * glowIntensity + 10} fill={bulbColor} opacity="0.4" filter="blur(6px)" />
              {/* Glass Dome */}
              <circle cx="15" cy="15" r="16" fill={bulbColor} stroke="#F59E0B" strokeWidth="1.5" />
              {/* Filament wire */}
              <path d="M 10 20 Q 15 8 20 20" stroke="#B45309" strokeWidth="1.5" fill="none" />
              {/* Metal Base */}
              <rect x="11" y="28" width="8" height="6" fill="#64748B" rx="1" />
            </g>

            {/* Animated Electron Charges Flow */}
            {isSimRunning && current > 0 && (
              <>
                <circle cx="80" cy="30" r="3" fill="#38BDF8">
                  <animate attributeName="cx" values="40;120" dur={`${Math.max(0.4, 3 / current)}s`} repeatCount="indefinite" />
                </circle>
                <circle cx="280" cy="90" r="3" fill="#38BDF8">
                  <animate attributeName="cy" values="30;170" dur={`${Math.max(0.4, 3 / current)}s`} repeatCount="indefinite" />
                </circle>
                <circle cx="200" cy="170" r="3" fill="#38BDF8">
                  <animate attributeName="cx" values="280;40" dur={`${Math.max(0.4, 3 / current)}s`} repeatCount="indefinite" />
                </circle>
              </>
            )}
          </svg>

          {/* Overload Warning */}
          {current > 12 && (
            <div className="absolute top-2 right-2 bg-rose-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse">
              ⚠️ تەزووی بەرز (ئاگاداری گەرمبوون)
            </div>
          )}
        </div>

        {/* Digital Instruments Readings */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-800/90 border border-slate-700 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block">پێوەری تەزوو (Ammeter)</span>
            <span className="text-base font-bold font-mono text-sky-400">{current} A</span>
          </div>
          <div className="bg-slate-800/90 border border-slate-700 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block">پێوەری ڤۆڵتیە (Voltmeter)</span>
            <span className="text-base font-bold font-mono text-amber-400">{voltage} V</span>
          </div>
          <div className="bg-slate-800/90 border border-slate-700 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block">توانای بەکارهاتوو (Power)</span>
            <span className="text-base font-bold font-mono text-emerald-400">{power} W</span>
          </div>
        </div>

        {/* Lab Controls */}
        <div className="space-y-3 pt-1">
          <div className="bg-slate-800/60 border border-slate-700/80 p-2.5 rounded-xl space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>ڤۆڵتیەی سەرچاوە (V):</span>
              <span className="font-mono text-amber-400 font-bold">{voltage} V</span>
            </div>
            <input
              type="range"
              min={2}
              max={24}
              step={1}
              value={voltage}
              onChange={(e) => handleControlChange("voltage", parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 p-2.5 rounded-xl space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>بەرگریی خول (R):</span>
              <span className="font-mono text-sky-400 font-bold">{resistance} Ω</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={resistance}
              onChange={(e) => handleControlChange("resistance", parseFloat(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>
        </div>
      </div>
    );
  };

  // --- 2. RENDER ACID-BASE TITRATION LAB ---
  const renderTitrationLab = () => {
    const baseAdded = controls["baseAddedMl"] ?? 0;
    const initialAcidMl = 25;
    const mAcid = 0.1;
    const mBase = 0.1;

    // Calculate pH curve mathematically
    let ph = 1.0;
    const totalVol = initialAcidMl + baseAdded;
    const molesAcidInitial = (initialAcidMl * mAcid) / 1000;
    const molesBaseAdded = (baseAdded * mBase) / 1000;

    if (molesBaseAdded < molesAcidInitial) {
      const remainingMolesAcid = molesAcidInitial - molesBaseAdded;
      const concH = remainingMolesAcid / (totalVol / 1000);
      ph = Math.max(1.0, parseFloat((-Math.log10(concH)).toFixed(2)));
    } else if (Math.abs(molesBaseAdded - molesAcidInitial) < 0.00001) {
      ph = 7.0; // Equivalence point
    } else {
      const excessMolesBase = molesBaseAdded - molesAcidInitial;
      const concOH = excessMolesBase / (totalVol / 1000);
      const pOH = -Math.log10(concOH);
      ph = Math.min(13.0, parseFloat((14 - pOH).toFixed(2)));
    }

    // Phenolphthalein color indicator
    let liquidColor = "rgba(224, 242, 254, 0.4)"; // Clear water-like
    if (ph >= 7.0 && ph <= 8.2) {
      liquidColor = "rgba(251, 207, 232, 0.6)"; // Faint pale pink
    } else if (ph > 8.2) {
      liquidColor = "rgba(244, 63, 94, 0.85)"; // Vibrant magenta pink
    }

    return (
      <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-4">
        {/* Titration Bench Canvas */}
        <div className="relative w-full h-56 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-center p-2 select-none overflow-hidden">
          <svg width="300" height="200" className="overflow-visible">
            {/* Burette Stand */}
            <line x1="80" y1="10" x2="80" y2="185" stroke="#475569" strokeWidth="5" />
            <rect x="50" y="180" width="70" height="10" fill="#334155" rx="2" />
            <line x1="80" y1="50" x2="135" y2="50" stroke="#64748B" strokeWidth="3" />

            {/* Burette Glass Tube (containing NaOH) */}
            <rect x="135" y="15" width="16" height="100" fill="rgba(255,255,255,0.15)" stroke="#94A3B8" strokeWidth="1.5" rx="2" />
            {/* NaOH liquid level inside burette */}
            <rect
              x="136"
              y={16 + (baseAdded / 50) * 80}
              width="14"
              height={Math.max(2, 98 - (baseAdded / 50) * 80)}
              fill="rgba(56, 189, 248, 0.35)"
            />
            {/* Burette Tip & Stopcock */}
            <polygon points="135,115 151,115 144,128 142,128" fill="#94A3B8" />
            <circle cx="143" cy="120" r="3" fill="#F59E0B" />

            {/* Falling Drops Animation */}
            {baseAdded > 0 && baseAdded < 50 && (
              <circle cx="143" cy="138" r="2.5" fill="#38BDF8">
                <animate attributeName="cy" values="128;155" dur="0.6s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Conical Flask with Analyte & Indicator */}
            <path
              d="M 132 145 L 154 145 L 175 185 L 111 185 Z"
              fill={liquidColor}
              stroke="#CBD5E1"
              strokeWidth="2"
            />
            {/* Flask Neck */}
            <rect x="135" y="135" width="16" height="12" fill="none" stroke="#CBD5E1" strokeWidth="1.5" />
          </svg>

          {/* pH Indicator Badge */}
          <div className="absolute top-2 right-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block">پێوەری pH</span>
            <span className={`text-base font-bold font-mono ${ph < 7 ? "text-sky-400" : ph === 7 ? "text-emerald-400" : "text-rose-400"}`}>
              pH {ph.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Dynamic Chemical Status */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-800 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">قەبارەی NaOH ی تێکراو</span>
            <span className="font-bold font-mono text-sky-400">{baseAdded.toFixed(1)} mL</span>
          </div>
          <div className="bg-slate-800 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">ڕەنگی فینۆڵفثالین</span>
            <span className={`font-bold ${ph >= 7 ? "text-rose-400" : "text-slate-300"}`}>
              {ph < 7 ? "بێ ڕەنگ" : ph <= 8.2 ? "پەمەیی کاڵ" : "پەمەیی تۆخ"}
            </span>
          </div>
          <div className="bg-slate-800 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">دۆخی کارلێک</span>
            <span className="font-bold text-amber-400">
              {ph < 7 ? "ترش زاڵە" : ph === 7 ? "خاڵی هاوتایی" : "قەوا زاڵە"}
            </span>
          </div>
        </div>

        {/* Burette Dispenser Slider */}
        <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span>کۆنترۆڵی بۆڕی تایتڕەیشن (زیادکردنی NaOH):</span>
            <span className="font-mono text-sky-400 font-bold">{baseAdded.toFixed(1)} / 50 mL</span>
          </div>
          <input
            type="range"
            min={0}
            max={40}
            step={0.5}
            value={baseAdded}
            onChange={(e) => handleControlChange("baseAddedMl", parseFloat(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono" dir="ltr">
            <span>0 mL</span>
            <span className="text-emerald-400 font-bold">25 mL (Equivalence)</span>
            <span>40 mL</span>
          </div>
        </div>
      </div>
    );
  };

  // --- 3. RENDER NEWTON'S 2ND LAW LAB ---
  const renderNewtonLab = () => {
    const appliedForce = controls["appliedForce"] ?? 20;
    const mass = controls["mass"] ?? 5;
    const acceleration = parseFloat((appliedForce / mass).toFixed(2));

    return (
      <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-4">
        {/* Track Canvas */}
        <div className="relative w-full h-48 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-center p-2 select-none overflow-hidden">
          <svg width="300" height="160">
            {/* Ground / Track */}
            <line x1="20" y1="120" x2="280" y2="120" stroke="#64748B" strokeWidth="4" />

            {/* Cart Box */}
            <g transform="translate(110, 75)">
              <rect x="0" y="0" width="70" height="35" fill="#2563EB" rx="4" stroke="#60A5FA" strokeWidth="1.5" />
              <text x="35" y="22" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle">
                {mass} kg
              </text>
              {/* Wheels */}
              <circle cx="15" cy="40" r="6" fill="#0F172A" stroke="#94A3B8" strokeWidth="2" />
              <circle cx="55" cy="40" r="6" fill="#0F172A" stroke="#94A3B8" strokeWidth="2" />
            </g>

            {/* Force Vector Arrow */}
            <g transform="translate(180, 92)">
              <line x1="5" y1="0" x2={Math.min(75, 10 + appliedForce * 0.7)} y2="0" stroke="#F59E0B" strokeWidth="3.5" markerEnd="url(#arrow)" />
              <polygon
                points={`${Math.min(85, 15 + appliedForce * 0.7)},0 ${Math.min(75, 5 + appliedForce * 0.7)},-5 ${Math.min(75, 5 + appliedForce * 0.7)},5`}
                fill="#F59E0B"
              />
              <text x="15" y="-8" fill="#FDE68A" fontSize="10" fontWeight="bold">F = {appliedForce} N</text>
            </g>
          </svg>
        </div>

        {/* Meters */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-800 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">هێزی کارتێکەر (F)</span>
            <span className="font-bold font-mono text-amber-400">{appliedForce} N</span>
          </div>
          <div className="bg-slate-800 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">بارستایی (m)</span>
            <span className="font-bold font-mono text-sky-400">{mass} kg</span>
          </div>
          <div className="bg-slate-800 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">تاودان (a = F/m)</span>
            <span className="font-bold font-mono text-emerald-400">{acceleration} m/s²</span>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-2 pt-1">
          <div className="bg-slate-800/60 border border-slate-700 p-2.5 rounded-xl space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>هێزی پاڵنان (F):</span>
              <span className="font-mono text-amber-400 font-bold">{appliedForce} N</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={appliedForce}
              onChange={(e) => handleControlChange("appliedForce", parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          <div className="bg-slate-800/60 border border-slate-700 p-2.5 rounded-xl space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>بارستایی تەنەکە (m):</span>
              <span className="font-mono text-sky-400 font-bold">{mass} kg</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={mass}
              onChange={(e) => handleControlChange("mass", parseFloat(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>
        </div>
      </div>
    );
  };

  if (isFinished) {
    const percentage = Math.round((correctTasksCount / data.tasks.length) * 100);
    return (
      <div id="virtual-lab-finished" className="bg-white border border-slate-100 rounded-2xl p-6 text-center space-y-5 shadow-xs" dir="rtl">
        <div className="w-16 h-16 mx-auto bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-xs">
          <Award className="w-9 h-9" />
        </div>
        <div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            تاقیگەی زانستی تەواو بوو!
          </span>
          <h3 className="font-bold text-xl text-slate-900 mt-3">ناوازەیە! توێژینەوەی تاقیگەییت بە سەرکەوتوویی جێبەجێ کرد</h3>
          <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
            تێگەیشتنی کرداری و ئەزموونکردنی تیۆرییەکان لە ڕێگەی تاقیگەی مەجازییەوە بنەمای سەرەکیی سەرکەوتنە لە پۆلەکانی ٩ تا ١٢.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-around max-w-sm mx-auto">
          <div>
            <p className="text-xs text-slate-400 font-medium">پرسیارە دروستەکان</p>
            <p className="text-lg font-bold text-slate-800">{correctTasksCount} لە {data.tasks.length}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <p className="text-xs text-slate-400 font-medium">ڕێژەی ئەزموون</p>
            <p className="text-lg font-bold text-amber-600">{percentage}%</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="science-virtual-lab" className="space-y-4" dir="rtl">
      {/* Objective & Theory */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1">
            <FlaskConical className="w-3.5 h-3.5" />
            تاقیگەی مەجازی
          </span>
          <span className="text-xs font-medium text-slate-400">
            ئەرکی {currentTaskIndex + 1} لە {data.tasks.length}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {data.objectiveKu}
        </p>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[11px] text-slate-500 leading-relaxed">
          <span className="font-bold text-slate-700">بنەمای زانستی:</span> {data.theoryKu}
        </div>
      </div>

      {/* Render Specific Simulation */}
      {data.labKind === "ohms_law_circuit" && renderOhmsLawLab()}
      {data.labKind === "acid_base_titration" && renderTitrationLab()}
      {data.labKind === "newton_second_law" && renderNewtonLab()}

      {/* Active Lab Inquiry Task Card */}
      {currentTask && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div>
            <span className="text-xs font-bold text-blue-600">{currentTask.titleKu}</span>
            <p className="text-xs text-slate-600 mt-1">{currentTask.instructionKu}</p>
            <h4 className="font-bold text-slate-900 text-sm mt-2">{currentTask.inquiryQuestionKu}</h4>
          </div>

          {/* Options */}
          <div className="space-y-2 pt-1">
            {currentTask.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              let optClass = "border-slate-200 bg-white hover:border-slate-300";

              if (isSelected) {
                optClass = "border-blue-500 bg-blue-50/40 text-blue-950 ring-1 ring-blue-400";
              }

              if (isAnswerSubmitted && isSelected) {
                optClass = opt.isCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-400"
                  : "border-rose-400 bg-rose-50 text-rose-950 ring-1 ring-rose-300";
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={isAnswerSubmitted}
                  className={`w-full text-right p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-between gap-3 ${optClass}`}
                >
                  <span className="leading-relaxed">{opt.textKu}</span>
                  <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                    {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Hint */}
          <div className="pt-1">
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>{showHint ? "شاردنەوەی ڕێنوێنی" : "ڕێنوێنی تاقیگە"}</span>
            </button>

            {showHint && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 leading-relaxed animate-fade-in">
                💡 {currentTask.hintKu}
              </div>
            )}
          </div>

          {/* Feedback */}
          {isAnswerSubmitted && selectedOption && (
            <div
              className={`rounded-xl p-3.5 text-xs leading-relaxed space-y-1 animate-fade-in ${
                selectedOption.isCorrect
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {selectedOption.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>لێکدانەوەی تاقیگەییت دروستە!</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 text-rose-600" />
                    <span>تێبینی زانستی بۆ ئەم تاقیکردنەوەیە:</span>
                  </>
                )}
              </div>
              <p>{selectedOption.explanationKu}</p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmitTask}
                disabled={!selectedOptionId}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer ${
                  selectedOptionId
                    ? "bg-amber-600 hover:bg-amber-700 shadow-xs"
                    : "bg-slate-300 cursor-not-allowed text-slate-500"
                }`}
              >
                پشکنینی ئەنجامی تاقیگە
              </button>
            ) : (
              <button
                onClick={handleNextTask}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>
                  {currentTaskIndex + 1 < data.tasks.length ? "ئەرکی داهاتووی تاقیگە" : "تەواوکردنی تاقیگە"}
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
