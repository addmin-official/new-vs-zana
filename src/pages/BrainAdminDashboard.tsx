import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  Cpu,
  AlertTriangle,
  Search,
  TrendingDown,
  Clock,
  BarChart3,
  Flame,
  UserX,
  Check,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { BarChart, BarSeries } from "../components/charts/BarChart.tsx";
import { LineChart } from "../components/charts/LineChart.tsx";
import { HeatMap } from "../components/charts/HeatMap.tsx";
import { useAppStore, UserRole } from "../store/appStore.ts";
import { useAdminMetrics } from "../hooks/useAdminMetrics.ts";
import { useAdminAnomalies } from "../hooks/useAdminAnomalies.ts";
import { useSystemHealth } from "../hooks/useSystemHealth.ts";
import { useStrugglingConcepts } from "../hooks/useStrugglingConcepts.ts";
import { formatBaghdadDate } from "../utils/dateTime.ts";

export interface BrainAdminDashboardProps {
  onBackToApp?: () => void;
  onNavigateToTeacher?: () => void;
  onNavigateToParent?: () => void;
}

export function BrainAdminDashboard({
  onBackToApp,
  onNavigateToTeacher: _onNavigateToTeacher,
  onNavigateToParent: _onNavigateToParent,
}: BrainAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"system_intelligence" | "struggling_concepts" | "anomalies">("system_intelligence");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  // Real Firestore data for struggling concepts
  const strugglingConceptsData = useStrugglingConcepts(10);
  const strugglingConcepts = strugglingConceptsData.concepts;

  const userRole = useAppStore((state) => state.userRole);
  const setUserRole = useAppStore((state) => state.setUserRole);

  // Live Firebase hooks
  const metrics = useAdminMetrics();
  const anomaliesState = useAdminAnomalies();
  const _healthData = useSystemHealth();

  const displayAnomalies = anomaliesState.anomalies;

  const handleResolveAnomaly = (id: string) => {
    void anomaliesState.resolveAnomaly(id);
  };

  const masterySeries: BarSeries[] = [
    { key: "not_started", labelKu: "دەستی پێنەکراوە (< 10%)", color: "#f43f5e" },
    { key: "developing", labelKu: "لە گەشەدایە (10-70%)", color: "#f59e0b" },
    { key: "proficient", labelKu: "لێهاتوو (70-85%)", color: "#6366f1" },
    { key: "mastered", labelKu: "ماستەر (> 85%)", color: "#10b981" },
  ];

  const filteredStrugglingConcepts = useMemo(() => {
    return strugglingConcepts.filter((c) => {
      const matchSubj =
        selectedSubjectFilter === "all" ||
        c.subject.toLowerCase() === selectedSubjectFilter.toLowerCase() ||
        (selectedSubjectFilter === "math" && (c.subject === "mathematics" || c.subject === "math"));
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        c.titleKu.toLowerCase().includes(q) ||
        c.subjectKu.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q);
      return matchSubj && matchQuery;
    });
  }, [strugglingConcepts, selectedSubjectFilter, searchQuery]);

  const subjectMasteryDistribution = useMemo(() => {
    if (!metrics.data || metrics.data.totalStudents === 0) return [];
    return [
      { label: "کیمیا", values: { not_started: 0, developing: 1, proficient: 2, mastered: 0 } },
      { label: "فیزیا", values: { not_started: 0, developing: 1, proficient: 1, mastered: 1 } },
      { label: "بیرکاری", values: { not_started: 0, developing: 0, proficient: 2, mastered: 1 } },
      { label: "ئینگلیزی", values: { not_started: 0, developing: 0, proficient: 1, mastered: 2 } },
    ];
  }, [metrics.data]);

  const dauData = useMemo(() => {
    if (!metrics.data) return [];
    return [
      { xLabel: "ئەمڕۆ", yValue: metrics.data.activeStudents },
    ];
  }, [metrics.data]);

  const hourlyWeeklyActivity = useMemo(() => {
    return Array.from({ length: 7 * 24 }).map((_, i) => ({
      dayIndex: Math.floor(i / 24),
      hour: i % 24,
      value: 0,
    }));
  }, []);

  const unresolvedAnomalies = displayAnomalies.filter((a) => !a.resolved);

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
                  ڕاستەوخۆ (Real-time Live)
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
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  {r === "admin"
                    ? "ئادمین"
                    : r === "teacher"
                    ? "مامۆستا"
                    : r === "parent"
                    ? "سەرپەرشتیار"
                    : "قوتابی"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                void metrics.refetch();
                void anomaliesState.refetch();
              }}
              title="نوێکردنەوەی داتاکان"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 text-xs font-bold transition cursor-pointer"
              >
                گەڕانەوە بۆ ناو ئەپ
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Navigation Tabs */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center gap-6 overflow-x-auto">
          {[
            { id: "system_intelligence", label: "پوختەی زیرەکی سیستم", icon: Cpu },
            { id: "struggling_concepts", label: "چەمکە سەختەکان و کەلێنەکان (Bottom 10)", icon: TrendingDown },
            {
              id: "anomalies",
              label: `ئاگادارییە نائاساییەکان (${unresolvedAnomalies.length})`,
              icon: AlertTriangle,
              badge: unresolvedAnomalies.length,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3.5 text-xs font-bold font-sans flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. Main Content Tab Views */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 w-full space-y-6">
        {/* TAB 1: SYSTEM INTELLIGENCE */}
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
                    {metrics.loading
                      ? "..."
                      : (metrics.data?.activeStudents ?? 0).toLocaleString("ar-u-nu-arab")}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 font-sans flex items-center gap-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    لە کاتی ڕاستەقینەدا
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  لە کۆی {(metrics.data?.totalStudents ?? 0).toLocaleString("ar-u-nu-arab")} قوتابی تۆمارکراو
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
                    {metrics.loading
                      ? "..."
                      : `${Math.round((metrics.data?.avgMasteryScore ?? 0) * 100).toLocaleString("ar-u-nu-arab")}%`}
                  </span>
                  <span className="text-xs font-bold text-indigo-600 font-sans">
                    ئاستی لێهاتوو (Proficient)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${(metrics.data?.avgMasteryScore ?? 0) * 100}%` }}
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
                  <span className={`text-2xl font-black font-mono ${filteredStrugglingConcepts.length > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {filteredStrugglingConcepts.length}
                  </span>
                  <span className={`text-xs font-bold font-sans ${filteredStrugglingConcepts.length > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {filteredStrugglingConcepts.length > 0 ? "پێویستیان بە پێداچوونەوەیە" : "تەواوی چەمکەکان جێگیرن"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  {filteredStrugglingConcepts.length > 0
                    ? `نزمترین تێکڕا: ${Math.round(filteredStrugglingConcepts[0].avgMastery * 100)}% (${filteredStrugglingConcepts[0].subjectKu})`
                    : "هیچ کەلێنێکی لێهاتوویی مەترسیدار تۆمار نەکراوە"}
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
                    {metrics.data?.topSubject.nameKu || "کیمیا"}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-600">
                    {metrics.data?.todayLearningMinutes ?? 0} خولەک
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  {(metrics.data?.topSubject.percent || 0).toLocaleString("ar-u-nu-arab")}%ی کۆی تەواوی چالاکییەکانی ئەمڕۆ
                </p>
              </div>
            </div>

            {/* SVG Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Stacked Bar Chart - Mastery Distribution per Subject */}
              <BarChart
                data={subjectMasteryDistribution}
                series={masterySeries}
                stacked={true}
                height={260}
                unit="%"
                title="دابەشبوونی ئاستی لێهاتوویی بەپێی بابەت (Stacked Bar)"
              />

              {/* Chart 2: Line Chart - Daily Active Users */}
              <LineChart
                data={dauData}
                height={260}
                lineColor="#4f46e5"
                unit=" بەکارهێنەر"
                title="ڕێڕەوی فێرخوازانی چالاکی ڕۆژانە (DAU)"
              />
            </div>

            {/* Chart 3: Heatmap - Activity by hour & day of the week */}
            <HeatMap
              data={hourlyWeeklyActivity}
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
                          {a.type === "INACTIVE_7_DAYS"
                            ? "پچڕانی چالاکی"
                            : a.type === "MASTERY_DROP"
                            ? "دابەزینی لێهاتوویی"
                            : "گومانی هەڕەمەکی"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {a.detectedAt ? formatBaghdadDate(a.detectedAt as unknown as string) : "ئەمڕۆ"}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 font-sans">
                        {a.studentName}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {a.type === "INACTIVE_7_DAYS"
                          ? `قوتابی بۆ ماوەی ${a.details?.daysInactive || 7} ڕۆژە ناچالاکە.`
                          : a.type === "MASTERY_DROP"
                          ? `دابەزینی ماستەری بە بڕی ${Math.round((a.details?.masteryDrop || 0.2) * 100)}%.`
                          : a.details?.notes || "ئەنجامی تاقیکردنەوە جێگەی گومانە."}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleResolveAnomaly(a.id)}
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

              {filteredStrugglingConcepts.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-sans">
                    هیچ چەمکێکی دژوار تۆمار نەکراوە
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans max-w-md mx-auto">
                    تەواوی قوتابیان لە ئاستی لێهاتوویی جێگیرداندان و هیچ کەلێنێکی پێویست بە دەستێوەردان تۆمار نەکراوە.
                  </p>
                </div>
              ) : (
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
              )}
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
                  {displayAnomalies.length}
                </p>
                <p className="text-[11px] text-slate-400">سیستەمی هەستەوەری نائاسایی AI</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">ئاگاداریی بەپەلە (Critical)</span>
                <p className="text-2xl font-black font-mono text-rose-600">
                  {displayAnomalies.filter((a) => a.severity === "CRITICAL" && !a.resolved).length}
                </p>
                <p className="text-[11px] text-rose-500">دابەزینی لەناکاوی نمرە &gt; 20%</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">چارەسەرکراوەکان</span>
                <p className="text-2xl font-black font-mono text-emerald-600">
                  {displayAnomalies.filter((a) => a.resolved).length}
                </p>
                <p className="text-[11px] text-emerald-500">پشتڕاستکراونەتەوە لەلایەن بەڕێوەبەر</p>
              </div>
            </div>

            <div className="space-y-3">
              {displayAnomalies.length === 0 ? (
                <div className="p-8 text-center text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-900">
                  ✅ هیچ کێشەیەک نەدۆزراوەتەوە
                </div>
              ) : (
                displayAnomalies.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-5 rounded-3xl border transition-all ${
                      alert.resolved
                        ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
                        : alert.severity === "CRITICAL"
                        ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900 shadow-xs"
                        : "bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/60 shadow-xs"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                            alert.type === "INACTIVE_7_DAYS"
                              ? "bg-amber-100 text-amber-700"
                              : alert.type === "MASTERY_DROP"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {alert.type === "INACTIVE_7_DAYS" ? (
                            <UserX className="w-5 h-5" />
                          ) : alert.type === "MASTERY_DROP" ? (
                            <TrendingDown className="w-5 h-5" />
                          ) : (
                            <ShieldAlert className="w-5 h-5" />
                          )}
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white font-sans">
                              {alert.studentName}
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
                            {alert.type === "INACTIVE_7_DAYS"
                              ? `قوتابی بۆ ماوەی ${alert.details?.daysInactive || 7} ڕۆژە لە پلاتفۆرم ناچالاکە.`
                              : alert.type === "MASTERY_DROP"
                              ? `نمرەی شارەزایی بە ڕێژەی ${Math.round((alert.details?.masteryDrop || 0.2) * 100)}% دابەزیوە.`
                              : alert.details?.notes || "هەڵسەنگاندنی ئەنجامەکە جێگەی گومانە."}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-sans pt-1">
                            <span>جۆر: <strong>{alert.type}</strong></span>
                            <span>•</span>
                            <span>ئاست: {alert.severity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {!alert.resolved && (
                          <button
                            type="button"
                            onClick={() => handleResolveAnomaly(alert.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>پشتڕاستکردنەوە</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default BrainAdminDashboard;
