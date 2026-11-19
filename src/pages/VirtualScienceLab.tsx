import React, { useState, useMemo, useEffect, Suspense, lazy } from "react";
import {
  FlaskConical,
  Atom,
  Zap,
  Dna,
  Lock,
  Users,
} from "lucide-react";
import { useAppStore } from "../store/appStore.ts";
import { useTranslation } from "../hooks/useTranslation.ts";
import {
  LabReportTemplate,
  PartnerSessionState,
  SimulationConfig,
} from "../components/labs/labTypes.ts";
import { LabGuidePanel } from "../components/labs/LabGuidePanel.tsx";
import { LabReportModal } from "../components/labs/LabReportModal.tsx";
import { PartnerModePanel } from "../components/labs/PartnerModePanel.tsx";
import {
  TITRATION_CONFIG,
  CIRCULAR_CONFIG,
  CIRCUIT_CONFIG,
} from "../components/labs/labConfigs.ts";

// Lazy load each subject simulation component separately for bundle isolation & performance
const TitrationSimulation = lazy(() =>
  import("../components/labs/TitrationSimulation.tsx").then((m) => ({ default: m.TitrationSimulation }))
);
const CircularMotionSimulation = lazy(() =>
  import("../components/labs/CircularMotionSimulation.tsx").then((m) => ({ default: m.CircularMotionSimulation }))
);
const CircuitSimulation = lazy(() =>
  import("../components/labs/CircuitSimulation.tsx").then((m) => ({ default: m.CircuitSimulation }))
);

export type LabType = "titration" | "mechanics" | "electrochemistry" | "microscopy";

// Loading Skeleton for smooth lab initialization
const LabLoadingSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs animate-pulse space-y-6" dir="rtl">
    <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
      <div className="space-y-2">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-48"></div>
        <div className="h-4 bg-slate-100 dark:bg-slate-800/70 rounded-lg w-72"></div>
      </div>
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-full w-28"></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 h-80 bg-slate-100 dark:bg-slate-800/60 rounded-2xl flex items-center justify-center">
        <span className="text-xs text-slate-400 font-bold">تاقیگە باردەکرێت...</span>
      </div>
      <div className="lg:col-span-7 space-y-4">
        <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
        <div className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
        <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
      </div>
    </div>
  </div>
);

export function VirtualScienceLab() {
  const { t, formatNumber } = useTranslation();
  const user = useAppStore((state) => state.user);
  const rawSubj = (user.activeSubject || "chemistry").toLowerCase();
  const studentGrade = user.grade || "12";
  const studentStream = user.stream || "scientific";
  const streamLabel = studentStream === "scientific" ? "بەشی زانستی" : "بەشی وێژەیی";

  // Determine available labs based on active subject
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSubj]);

  // Report Modal State
  const [activeReport, setActiveReport] = useState<LabReportTemplate | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Collaborative Partner Mode State
  const [partnerSession, setPartnerSession] = useState<PartnerSessionState>({
    isPartnerMode: false,
    activeRole: "controller",
    studentAName: user.name || "قوتابی A",
    studentBName: "هاوپۆل B",
    observerNotes: [],
  });

  const handleUpdatePartnerSession = (updated: Partial<PartnerSessionState>) => {
    setPartnerSession((prev) => ({ ...prev, ...updated }));
  };

  const handleAddObserverNote = (note: string) => {
    setPartnerSession((prev) => ({
      ...prev,
      observerNotes: [note, ...prev.observerNotes],
    }));
  };

  const handleOpenGeneratedReport = (report: LabReportTemplate) => {
    setActiveReport(report);
    setIsReportOpen(true);
  };

  // Get active simulation configuration for the guide panel
  const activeSimConfig: SimulationConfig | null = useMemo(() => {
    if (activeLab === "titration") return TITRATION_CONFIG;
    if (activeLab === "mechanics") return CIRCULAR_CONFIG;
    if (activeLab === "electrochemistry") return CIRCUIT_CONFIG;
    return null;
  }, [activeLab]);

  // Determine if controller inputs should be disabled when in observer mode
  const isControllerDisabled =
    partnerSession.isPartnerMode && partnerSession.activeRole === "observer";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full font-sans" dir="rtl">
      {/* 1. Header & Subject Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/60">
              {t("labs.title")} 🧪⚡
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full">
              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>پۆلی {formatNumber(Number(studentGrade))} • {streamLabel} (جێگیرکراوە)</span>
            </span>
          </div>

          <h1 className="font-sans font-black text-2xl text-slate-900 dark:text-white mt-2">
            {activeLab === "titration" && `${t("labs.titration")} • کیمیا`}
            {activeLab === "mechanics" && `${t("labs.mechanics")} • فیزیا`}
            {activeLab === "electrochemistry" && `${t("labs.circuits")} (Ohm's Law) • فیزیا`}
            {activeLab === "microscopy" && `${t("labs.microscopy")} • زیندەزانی`}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            سیستەمی تاقیگەی فەرمی وەزارەت بۆ پۆلی {formatNumber(Number(studentGrade))}ی {streamLabel} تایبەت بە بابەتی {rawSubj === "chemistry" ? "کیمیا" : rawSubj === "physics" ? "فیزیا" : rawSubj === "biology" ? "زیندەزانی" : rawSubj}.
          </p>
        </div>

        {/* Action Controls & Partner Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Partner Mode Toggle Button */}
          <button
            type="button"
            onClick={() =>
              setPartnerSession((prev) => ({
                ...prev,
                isPartnerMode: !prev.isPartnerMode,
              }))
            }
            className={`px-3 py-2 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              partnerSession.isPartnerMode
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200 dark:ring-indigo-900"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
            }`}
            aria-label="چالاککردنی دۆخی فێرکاری هاوبەش"
          >
            <Users className="w-4 h-4" />
            <span>{partnerSession.isPartnerMode ? `${t("labs.partnerMode")}: چالاکە` : t("labs.partnerMode")}</span>
          </button>

          {/* Lab Switcher Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1 rounded-xl">
            {availableLabs.map((lab) => (
              <button
                key={lab.id}
                onClick={() => setActiveLab(lab.id as LabType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeLab === lab.id
                    ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {lab.icon}
                <span>{lab.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Step-by-Step Lab Guide Panel */}
      {activeSimConfig && (
        <LabGuidePanel
          titleKu={activeSimConfig.titleKu}
          objectiveKu={activeSimConfig.objectiveKu}
          steps={activeSimConfig.guideStepsKu}
        />
      )}

      {/* 3. Collaborative Partner Mode Panel (Rendered when toggled) */}
      {partnerSession.isPartnerMode && (
        <PartnerModePanel
          session={partnerSession}
          onUpdateSession={handleUpdatePartnerSession}
          onAddObserverNote={handleAddObserverNote}
        />
      )}

      {/* 4. Active Interactive Simulation Stage */}
      <Suspense fallback={<LabLoadingSkeleton />}>
        {activeLab === "titration" && (
          <TitrationSimulation
            onGenerateReport={handleOpenGeneratedReport}
            isControllerDisabled={isControllerDisabled}
          />
        )}

        {activeLab === "mechanics" && (
          <CircularMotionSimulation
            onGenerateReport={handleOpenGeneratedReport}
            isControllerDisabled={isControllerDisabled}
          />
        )}

        {activeLab === "electrochemistry" && (
          <CircuitSimulation
            onGenerateReport={handleOpenGeneratedReport}
            isControllerDisabled={isControllerDisabled}
          />
        )}

        {activeLab === "microscopy" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-2xs">
              <Dna className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">مایکرۆسکۆپی ئەلکترۆنی خانەزانی</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              چاودێریکردنی وردی کلۆرۆپلاست و خانەی ڕووەکی بە بەکارهێنانی قەبارەپێوانی ئەلکترۆنی بەپێی بەشی زیندەزانی پۆلی ١٢.
            </p>
          </div>
        )}
      </Suspense>

      {/* 5. Post-Experiment Lab Report Modal */}
      <LabReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={activeReport}
      />
    </div>
  );
}

export default VirtualScienceLab;
