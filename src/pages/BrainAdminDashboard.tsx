import React, { useState } from "react";
import {
  ShieldAlert,
  Activity,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  Bell,
  TrendingDown,
  Clock,
  Layers,
  BarChart3,
  Flame,
  UserX,
  ExternalLink,
  ChevronDown,
  Check,
  X,
  Filter,
} from "lucide-react";
import { BarChart, BarSeries } from "../components/charts/BarChart.tsx";
import { LineChart } from "../components/charts/LineChart.tsx";
import { HeatMap } from "../components/charts/HeatMap.tsx";
import { ProgressRing } from "../components/charts/ProgressRing.tsx";
import {
  MOCK_SYSTEM_METRICS,
} from "../components/analytics/mockAnalyticsService.ts";
import { AnomalyAlert, StrugglingConcept } from "../components/analytics/analyticsTypes.ts";
import { useAppStore, UserRole } from "../store/appStore.ts";

export interface BrainAdminDashboardProps {
  onBackToApp?: () => void;
  onNavigateToTeacher?: () => void;
  onNavigateToParent?: () => void;
}

export function BrainAdminDashboard({
  onBackToApp,
  onNavigateToTeacher,
  onNavigateToParent,
}: BrainAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"system_intelligence" | "struggling_concepts" | "anomalies">("system_intelligence");
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>(MOCK_SYSTEM_METRICS.anomalies);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const userRole = useAppStore((state) => state.userRole);
  const setUserRole = useAppStore((state) => state.setUserRole);

  const resolveAnomaly = (id: string) => {
    setAnomalies((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a))
    );
  };

  const masterySeries: BarSeries[] = [
    { key: "not_started", labelKu: "دەستی پێنەکراوە (< 10%)", color: "#f43f5e" }, // rose-500
    { key: "developing", labelKu: "لە گەشەدایە (10-70%)", color: "#f59e0b" }, // amber-500
    { key: "proficient", labelKu: "لێهاتوو (70-85%)", color: "#6366f1" }, // indigo-500
    { key: "mastered", labelKu: "ماستەر (> 85%)", color: "#10b981" }, // emerald-500
  ];

  const filteredStrugglingConcepts = MOCK_SYSTEM_METRICS.strugglingConcepts.filter((c) => {
    const matchSubj = selectedSubjectFilter === "all" || c.subject === selectedSubjectFilter;
    const matchQuery =
      c.titleKu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subjectKu.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubj && matchQuery;
  });

  const unresolvedAnomalies = anomalies.filter((a) => !a.resolved);

  return (
    <div className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-950 flex flex-col h-full overflow-y-auto" dir="rtl">
      {/* 1. Header Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 shrink-0 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md">
              <Cpu className="w-6 h-6 animate-pulse text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-sans text-slate-900 dark:text-white">
                  داشبۆردی بەڕێوەبەرایەتی زانا (System Intelligence)
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  ڕاستەوخۆ (Real-time)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                چاودێری دەستبەجێی ژیریی مەنهەج، ئاستی لێهاتوویی، شیکاری کەلێنەکان و ئاگادارییە نائاساییەکان
              </p>
            </div>
          </div>

          {/* Quick Role Switcher & Back Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-sans">
              <span className="text-[10px] text-slate-400 font-bold px-1.5">ڕۆڵ:</span>
              {(["admin", "teacher", "parent", "student"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setUserRole(r)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    userRole === r
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {r === "admin"
                    ? "بەڕێوەبەر"
                    : r === "teacher"
                    ? "مامۆستا"
                    : r === "parent"
                    ? "سەرپەرشتیار"
                    : "قوتابی"}
                </button>
              ))}
            </div>

            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                گەڕانەوە بۆ بەرنامە
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("system_intelligence")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "system_intelligence"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>شیکاریی سیستم و چاودێری</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("struggling_concepts")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "struggling_concepts"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <span>چەمکە سەختەکان (Bottom 10)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("anomalies")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 relative ${
              activeTab === "anomalies"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>ئاگادارییە نائاساییەکان (Anomaly Alerts)</span>
            {unresolvedAnomalies.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unresolvedAnomalies.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: SYSTEM INTELLIGENCE LAYER */}
        {activeTab === "system_intelligence" && (
          <div className="space-y-6">
            {/* Real-time 4 Bento Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Active Sessions */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans">
                    دانیشتنە چالاکەکان (١٥ خولەکی ڕابردوو)
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {MOCK_SYSTEM_METRICS.activeSessions15m}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 font-sans flex items-center gap-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    لە کاتی ڕاستەقینەدا
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  لە کۆی {MOCK_SYSTEM_METRICS.totalStudentsMonitored} قوتابی تۆمارکراو
                </p>
              </div>

              {/* Card 2: Average Mastery Score */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans">
                    تێکڕای نمرەی لێهاتوویی سەرجەم قوتابییان
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {Math.round(MOCK_SYSTEM_METRICS.averageMasteryScore * 100)}%
                  </span>
                  <span className="text-xs font-bold text-indigo-600 font-sans">
                    ئاستی لێهاتوو (Proficient)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${MOCK_SYSTEM_METRICS.averageMasteryScore * 100}%` }}
                  />
                </div>
              </div>

              {/* Card 3: Struggling Concepts Count */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans">
                    چەمکە خاوەن کەلێنی لێهاتوویی
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-rose-600">
                    {MOCK_SYSTEM_METRICS.strugglingConcepts.length}
                  </span>
                  <span className="text-xs font-bold text-rose-600 font-sans">
                    پێویستیان بە پێداچوونەوەیە
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  نزمترین تێکڕا: {Math.round(MOCK_SYSTEM_METRICS.strugglingConcepts[0]?.avgMastery * 100)}% ({MOCK_SYSTEM_METRICS.strugglingConcepts[0]?.subjectKu})
                </p>
              </div>

              {/* Card 4: Most Active Subject Today */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans">
                    چالاکترین بابەتی ئەمڕۆ
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black font-sans text-slate-900 dark:text-white">
                    {MOCK_SYSTEM_METRICS.activeSubjectsToday[0]?.subjectKu}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-600">
                    {MOCK_SYSTEM_METRICS.activeSubjectsToday[0]?.activeSessions} دانیشتن
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  {MOCK_SYSTEM_METRICS.activeSubjectsToday[0]?.percentage}%ی کۆی تەواوی چالاکییەکانی ئەمڕۆ
                </p>
              </div>
            </div>

            {/* SVG Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Stacked Bar Chart - Mastery Distribution per Subject */}
              <BarChart
                data={MOCK_SYSTEM_METRICS.subjectMasteryDistribution}
                series={masterySeries}
                stacked={true}
                height={260}
                unit="%"
                title="دابەشبوونی ئاستی لێهاتوویی بەپێی بابەت (Stacked Bar)"
              />

              {/* Chart 2: Line Chart - Daily Active Users (Last 30 Days) */}
              <LineChart
                data={MOCK_SYSTEM_METRICS.dailyActiveUsers30d}
                height={260}
                lineColor="#4f46e5"
                unit=" بەکارهێنەر"
                title="ڕێڕەوی فێرخوازانی چالاکی ڕۆژانە (DAU - ٣٠ ڕۆژی ڕابردوو)"
              />
            </div>

            {/* Chart 3: Heatmap - Activity by hour & day of the week */}
            <HeatMap
              data={MOCK_SYSTEM_METRICS.hourlyWeeklyActivity}
              title="نەخشەی گەرمیی دابەشبوونی کاتەکانی خوێندن (Hour x Day of Week)"
            />

            {/* Anomaly Alerts Quick View */}
            {unresolvedAnomalies.length > 0 && (
              <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
                    <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200 font-sans">
                      سیستەمی دۆزینەوەی حاڵەتە نائاساییەکان ({unresolvedAnomalies.length} ئاگاداری چارەسەرنەکراو)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("anomalies")}
                    className="text-xs font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                  >
                    بینینی تەواوی ئاگادارییەکان
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {unresolvedAnomalies.map((a) => (
                    <div
                      key={a.id}
                      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/60 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          {a.type === "INACTIVITY_7D"
                            ? "پچڕانی چالاکی"
                            : a.type === "MASTERY_DROP_20"
                            ? "دابەزینی لێهاتوویی"
                            : "گومانی هەڕەمەکی"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{a.timestamp}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 font-sans">
                        {a.titleKu}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {a.descriptionKu}
                      </p>
                      <button
                        type="button"
                        onClick={() => resolveAnomaly(a.id)}
                        className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>پشتڕاستکردنەوە و چارەسەر</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MOST STRUGGLING CONCEPTS (BOTTOM 10) */}
        {activeTab === "struggling_concepts" && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 font-sans">فلتەری بابەت:</span>
                {["all", "chemistry", "physics", "math", "biology", "english"].map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubjectFilter(sub)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedSubjectFilter === sub
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {sub === "all"
                      ? "هەموو بابەتەکان"
                      : sub === "chemistry"
                      ? "کیمیا"
                      : sub === "physics"
                      ? "فیزیا"
                      : sub === "math"
                      ? "بیرکاری"
                      : sub === "biology"
                      ? "زیندەزانی"
                      : "ئینگلیزی"}
                  </button>
                ))}
              </div>

              <div className="relative sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="گەڕان لە ناوی چەمک..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Bottom 10 Struggling Concepts Table / Cards */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white font-sans">
                    ١٠ لاوازترین چەمک بەپێی تێکڕای لێهاتوویی (Bottom 10 Struggling Concepts)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                    ئەم چەمکانە زۆرترین ڕێژەی هەڵەی دووبارە و کەمترین نمرەی تێگەیشتنیان لەسەرە
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-full border border-rose-200">
                  {filteredStrugglingConcepts.length} چەمک دەستنیشانکراون
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStrugglingConcepts.map((concept, idx) => {
                  const masteryPercent = Math.round(concept.avgMastery * 100);
                  return (
                    <div
                      key={concept.conceptId}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-600 dark:text-slate-300 text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white font-sans">
                              {concept.titleKu}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
                              {concept.subjectKu} • پۆلی {concept.grade}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                            ژمارەی قوتابیانی خاوەن کێشە لەم چەمکە:{" "}
                            <span className="font-mono font-bold text-rose-600">
                              {concept.strugglingStudentsCount}
                            </span>{" "}
                            قوتابی
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar & Percent */}
                      <div className="flex items-center gap-4 sm:w-72 shrink-0">
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-[10px] font-mono font-bold">
                            <span className="text-slate-400">تێکڕای لێهاتوویی:</span>
                            <span className="text-rose-600">{masteryPercent}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full"
                              style={{ width: `${masteryPercent}%` }}
                            />
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          پێویستی بە وانەیە
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ANOMALY DETECTION ALERTS */}
        {activeTab === "anomalies" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">کۆی ئاگادارییەکان</span>
                <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {anomalies.length}
                </p>
                <p className="text-[11px] text-slate-400">سیستەمی هەستەوەری نائاسایی AI</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">ئاگاداریی بەپەلە (Critical)</span>
                <p className="text-2xl font-black font-mono text-rose-600">
                  {anomalies.filter((a) => a.severity === "critical" && !a.resolved).length}
                </p>
                <p className="text-[11px] text-rose-500">دابەزینی لەناکاوی نمرە &gt; 20%</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">چارەسەرکراوەکان</span>
                <p className="text-2xl font-black font-mono text-emerald-600">
                  {anomalies.filter((a) => a.resolved).length}
                </p>
                <p className="text-[11px] text-emerald-500">پشتڕاستکراونەتەوە لەلایەن بەڕێوەبەر</p>
              </div>
            </div>

            <div className="space-y-3">
              {anomalies.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    alert.resolved
                      ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
                      : alert.severity === "critical"
                      ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900 shadow-xs"
                      : "bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/60 shadow-xs"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          alert.type === "INACTIVITY_7D"
                            ? "bg-amber-100 text-amber-700"
                            : alert.type === "MASTERY_DROP_20"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {alert.type === "INACTIVITY_7D" ? (
                          <UserX className="w-5 h-5" />
                        ) : alert.type === "MASTERY_DROP_20" ? (
                          <TrendingDown className="w-5 h-5" />
                        ) : (
                          <ShieldAlert className="w-5 h-5" />
                        )}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white font-sans">
                            {alert.titleKu}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              alert.resolved
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {alert.resolved ? "چارەسەرکراوە ✅" : "چالاکە ⚠️"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                          {alert.descriptionKu}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-sans pt-1">
                          <span>ناوی قوتابی: <strong>{alert.studentName}</strong></span>
                          <span>•</span>
                          <span>کات: {alert.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {!alert.resolved && (
                        <button
                          type="button"
                          onClick={() => resolveAnomaly(alert.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>پشتڕاستکردنەوە</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default BrainAdminDashboard;
