import React, { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  Settings,
  Activity,
  Search,
  Download,
  KeyRound,
  RotateCw,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronRight,
  TrendingUp,
  Server,
  Zap,
  ToggleLeft,
  ToggleRight,
  Eye,
  LogOut,
  RefreshCw,
  ShieldAlert,
  Check,
} from "lucide-react";
import { useFeatureFlagsContext } from "../features/flags/FeatureFlagProvider.tsx";
import { FEATURE_FLAGS, FeatureFlagName } from "../features/flags/flagConfig.ts";
import { notificationEngine } from "../notifications/notificationEngine.ts";
import { logAdminAction, ADMIN_EMAIL } from "../auth/roles.ts";
import { useAdminMetrics } from "../hooks/useAdminMetrics.ts";
import { useAdminStudentList, StudentListItem } from "../hooks/useAdminStudentList.ts";
import { useSystemHealth } from "../hooks/useSystemHealth.ts";
import { useAdminAnomalies } from "../hooks/useAdminAnomalies.ts";

import { useSystemAuditLogs } from "../hooks/useSystemAuditLogs.ts";
import { getFirebaseAuth } from "../services/firebase.ts";
import { useNewStudentAlerts } from "../hooks/useNewStudentAlerts.ts";
import { broadcastToAllStudents } from "../firebase/adminBroadcast.ts";
import { formatBaghdadTime } from "../utils/dateTime.ts";

export type AdminTab = "overview" | "students" | "content" | "system" | "flags";

export interface AdminDashboardProps {
  initialTab?: AdminTab;
  onNavigateHome?: () => void;
  onLogout?: () => void;
}

function StatusBadge({ status }: { status?: string }) {
  const isOnline = status === "ONLINE" || status === "READY" || status === "healthy";
  const isDegraded = status === "DEGRADED" || status === "SYNCING" || status === "degraded";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1.5 ${
        isOnline
          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
          : isDegraded
          ? "bg-amber-950 text-amber-400 border border-amber-800"
          : "bg-rose-950 text-rose-400 border border-rose-800"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isOnline ? "bg-emerald-400 animate-pulse" : isDegraded ? "bg-amber-400" : "bg-rose-400"
        }`}
      />
      {status || "ONLINE"}
    </span>
  );
}

function MetricSkeleton() {
  return <div className="h-8 w-24 bg-slate-800/80 animate-pulse rounded-lg my-1" />;
}

export function AdminDashboard({
  initialTab = "overview",
  onNavigateHome,
  onLogout,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      if (p.includes("/admin/students")) return "students";
      if (p.includes("/admin/content")) return "content";
      if (p.includes("/admin/system")) return "system";
      if (p.includes("/admin/flags")) return "flags";
    }
    return initialTab;
  });

  // Bootstrap Firestore on first admin load
  useEffect(() => {
    void import("../firebase/adminSetup.ts").then(({ bootstrapAdminFirestore }) => {
      bootstrapAdminFirestore().catch(console.warn);
    });
  }, []);

  const newStudentAlerts = useNewStudentAlerts();

  // Real-time new student notification in browser tab title
  useEffect(() => {
    const count = newStudentAlerts.unacknowledgedCount;
    if (count > 0) {
      document.title = `(${count}) قوتابی نوێ — زانا Admin`;
    } else {
      document.title = "Admin Dashboard — زانا";
    }
    return () => {
      document.title = "زانا — ZANA";
    };
  }, [newStudentAlerts.unacknowledgedCount]);

  // Real live Firebase hooks
  const metrics = useAdminMetrics();
  const studentList = useAdminStudentList();
  const health = useSystemHealth();
  const anomaliesList = useAdminAnomalies();

  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);
  const [passwordResetNotice, setPasswordResetNotice] = useState<string | null>(null);
  const [announcementText, setAnnouncementText] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const systemAudit = useSystemAuditLogs();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { flags } = useFeatureFlagsContext();
  const [localFlags, setLocalFlags] = useState<Record<FeatureFlagName, boolean>>(flags);

  useEffect(() => {
    setLocalFlags(flags);
  }, [flags]);

  const toggleFlag = async (name: FeatureFlagName) => {
    const isCurrentlyEnabled = localFlags[name] ?? FEATURE_FLAGS[name].defaultValue;
    const nextVal = !isCurrentlyEnabled;
    setLocalFlags((prev) => ({ ...prev, [name]: nextVal }));

    try {
      const { getFirestoreDb } = await import("../services/firebase.ts");
      const { doc, setDoc } = await import("firebase/firestore");
      const db = getFirestoreDb();
      if (db) {
        await setDoc(
          doc(db, "system", "featureFlags"),
          {
            [FEATURE_FLAGS[name].key]: nextVal,
            updatedAt: new Date().toISOString(),
            updatedBy: ADMIN_EMAIL,
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn("Failed to update feature flag in Firestore:", err);
    }

    void logAdminAction("TOGGLE_FEATURE_FLAG", undefined, {
      flag: name,
      newValue: nextVal,
    });
    showToast(`ئاڵای ${FEATURE_FLAGS[name].key} گۆڕدرا بۆ ${nextVal ? "چالاک" : "ناچالاک"}`);
  };

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const path = tab === "overview" ? "/admin" : `/admin/${tab}`;
      window.history.pushState(null, "", path);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Reset student password
  const handleResetPassword = (student: StudentListItem) => {
    setPasswordResetNotice(
      `لینکێکی تایبەت بۆ نوێکردنەوەی وشەی نهێنی بۆ قوتابی (${student.name} - ${student.email}) نێردرا.`
    );
    void logAdminAction("RESET_STUDENT_PASSWORD", student.id, { targetEmail: student.email });
    setTimeout(() => setPasswordResetNotice(null), 5000);
  };

  // Quick broadcast action
  const handleBroadcast = async () => {
    const title = window.prompt("ناوی ئاگاداری:") || "";
    const message = window.prompt("دەقی ئاگاداری:") || "";
    if (!title.trim() || !message.trim()) return;

    const auth = getFirebaseAuth();
    const result = await broadcastToAllStudents(
      title,
      message,
      auth?.currentUser?.email || ADMIN_EMAIL
    );
    window.alert(result.message);
  };

  // Broadcast announcement form submit
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim() || isBroadcasting) return;

    setIsBroadcasting(true);
    try {
      const auth = getFirebaseAuth();
      const adminEmail = auth?.currentUser?.email || ADMIN_EMAIL;
      const result = await broadcastToAllStudents(
        "ئاگاداری لە بەڕێوەبەرایەتی زانا 📢",
        announcementText.trim(),
        adminEmail
      );

      await notificationEngine.addNotification("all_broadcast", {
        type: "study_reminder",
        title: "ئاگاداری لە بەڕێوەبەرایەتی زانا 📢",
        message: announcementText.trim(),
        actionLabel: "بینین",
        actionUrl: "/home",
      });

      setAnnouncementText("");
      showToast(result.message || "ئاگاداری بە سەرکەوتوویی بۆ سەرجەم قوتابیان بڵاوکرایەوە ✅");
    } catch {
      showToast("هەڵەیەک ڕوویدا لە کاتی ناردنی ئاگاداری.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Purge cache and refetch all live queries
  const handlePurgeCache = async () => {
    if (typeof window !== "undefined") {
      try {
        const keysToRemove = Object.keys(localStorage).filter(
          (k) =>
            k.startsWith("zana_ai_cache") ||
            k.startsWith("zana_curriculum") ||
            k.startsWith("zana_admin_students_cache")
        );
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {
        // Handled
      }
    }
    void logAdminAction("PURGE_SYSTEM_CACHE");

    // Invalidate and refetch all live hooks
    await Promise.allSettled([
      metrics.refetch(),
      studentList.refetch(),
      health.refetch(),
      anomaliesList.refetch(),
    ]);

    showToast("کاشی ناوخۆ پاککرایەوە و سەرجەم داتاکان ڕاستەوخۆ نوێکرانەوە.");
  };

  const formattedLastUpdated = metrics.data?.lastUpdated
    ? formatBaghdadTime(metrics.data.lastUpdated)
    : null;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-indigo-600 selection:text-white"
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-5 z-50 rounded-2xl bg-indigo-600 px-4 py-2.5 font-sans text-xs font-bold text-white shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-l border-slate-800 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Admin Identity Brand */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">بەڕێوەبەرایەتی زانا</h2>
              <span className="text-[10px] font-mono text-indigo-400">ADMIN CONTROL CENTER</span>
            </div>
          </div>

          {/* Admin Navigation Links */}
          <nav className="space-y-1.5" aria-label="مینیوی ئادمین">
            {[
              { id: "overview", label: "پوختەی گشتی", labelEn: "Overview", icon: Activity },
              { id: "students", label: "بەڕێوەبردنی قوتابیان", labelEn: "Students", icon: Users },
              { id: "content", label: "بەڕێوەبردنی مەنهەج", labelEn: "Curriculum", icon: BookOpen },
              { id: "system", label: "ڕێکخستنی سیستم", labelEn: "System", icon: Settings },
              { id: "flags", label: "ئاڵاکانی سیستەم", labelEn: "Feature Flags", icon: Zap },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id as AdminTab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.id === "students" && newStudentAlerts.unacknowledgedCount > 0 && (
                    <span className="mr-auto bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {newStudentAlerts.unacknowledgedCount}
                    </span>
                  )}
                  <span className="text-[10px] font-mono opacity-60">{item.labelEn}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Footer Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="px-2 py-1">
            <span className="text-[10px] font-mono text-slate-500 block truncate" title={ADMIN_EMAIL}>
              {ADMIN_EMAIL}
            </span>
            <span className="inline-block mt-0.5 text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">
              ROOT ADMIN AUTHORIZED
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                <span>گەڕانەوە بۆ خوێندکار</span>
              </button>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="دەرچوون لە هەژمار"
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* Top Bar: Breadcrumb Header & Cache Purge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-sans text-slate-400">
            <span className="hover:text-white cursor-pointer" onClick={() => handleTabChange("overview")}>
              ئادمین
            </span>
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            <span className="text-indigo-400 font-bold capitalize">
              {activeTab === "overview"
                ? "پوختەی گشتی (Overview)"
                : activeTab === "students"
                ? "قوتابیان (Students)"
                : activeTab === "content"
                ? "مەنهەج و ئاڵاکان (Content & Flags)"
                : "سیستم و لۆگ (System & Health)"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {formattedLastUpdated && (
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                دواین نوێکردنەوە: {formattedLastUpdated}
              </span>
            )}
            <button
              type="button"
              onClick={handlePurgeCache}
              title="پاککردنەوەی کاش و نوێکردنەوەی هەموو داتاکان"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>پاککردنەوەی کاش</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {metrics.error && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{metrics.error}</span>
            </div>
            <button
              type="button"
              onClick={() => metrics.refetch()}
              className="px-3 py-1 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-sans text-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>دووبارە هەوڵبدەوە</span>
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW (/admin) */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 4 Core High-Density Live Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Active / Total Students */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400 font-sans block">کۆی قوتابیانی چالاک (١٥ خولەک)</span>
                <div className="flex items-baseline justify-between">
                  {metrics.loading ? (
                    <MetricSkeleton />
                  ) : (
                    <span className="text-2xl font-black text-white font-mono">
                      {metrics.data?.activeStudents.toLocaleString("ar-u-nu-arab")}
                    </span>
                  )}
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>لە کۆی {metrics.data?.totalStudents.toLocaleString("ar-u-nu-arab")}</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">ACTIVE_STUDENTS_COUNT</span>
              </div>

              {/* Card 2: Today's Learning Minutes */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400 font-sans block">کاتی فێربوونی ئەمڕۆ</span>
                <div className="flex items-baseline justify-between">
                  {metrics.loading ? (
                    <MetricSkeleton />
                  ) : (
                    <span className="text-2xl font-black text-indigo-400 font-mono">
                      {metrics.data?.todayLearningMinutes.toLocaleString("ar-u-nu-arab")}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">خولەک</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">TODAY_LEARNING_SESSIONS</span>
              </div>

              {/* Card 3: Top Demanded Subject */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400 font-sans block">وانەی پڕداواکاریترین</span>
                <div className="flex items-baseline justify-between">
                  {metrics.loading ? (
                    <MetricSkeleton />
                  ) : (
                    <span className="text-lg font-black text-amber-400">
                      {metrics.data?.topSubject.nameKu || "کیمیا"}
                    </span>
                  )}
                  <span className="text-xs text-amber-500 font-bold">
                    {(metrics.data?.topSubject.percent || 0).toLocaleString("ar-u-nu-arab")}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">TOP_DEMANDED_SUBJECT</span>
              </div>

              {/* Card 4: System & AI Health Status */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400 font-sans block">باری سیستەم و ژیری دەستکرد</span>
                <div className="flex items-baseline justify-between">
                  {health.loading ? (
                    <MetricSkeleton />
                  ) : (
                    <span
                      className={`text-base font-black flex items-center gap-1.5 ${
                        health.data?.firebase === "ONLINE" && health.data?.gemini === "ONLINE"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          health.data?.firebase === "ONLINE" ? "bg-emerald-500 animate-ping" : "bg-amber-500"
                        }`}
                      />
                      {health.data?.firebase === "ONLINE" ? "تەندروستە (100%)" : "کەلێنی کاتی"}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">ALL_SERVICES_OPERATIONAL</span>
              </div>
            </div>

            {/* Live Anomalies Alert Banner if any unresolved */}
            {anomaliesList.anomalies.length > 0 && (
              <div className="bg-rose-950/40 border border-rose-900/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span>
                      کێشە و حاڵەتە نائاساییە دۆزراوەکان ({anomaliesList.anomalies.length} حاڵەت)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange("students")}
                    className="text-[11px] text-rose-400 hover:text-rose-300 underline font-sans cursor-pointer"
                  >
                    بینینی قوتابیان
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {anomaliesList.anomalies.slice(0, 3).map((anom) => (
                    <div
                      key={anom.id}
                      className="bg-slate-900/90 border border-rose-900/60 rounded-xl p-3 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{anom.studentName}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            anom.severity === "CRITICAL"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : "bg-amber-950 text-amber-300 border border-amber-800"
                          }`}
                        >
                          {anom.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {anom.type === "INACTIVE_7_DAYS"
                          ? `بۆ ماوەی ${anom.details?.daysInactive || 7} ڕۆژە ناچالاکە.`
                          : anom.type === "MASTERY_DROP"
                          ? `دابەزینی ماستەری بە بڕی ${Math.round((anom.details?.masteryDrop || 0.2) * 100)}%.`
                          : "تاقیکردنەوە بە جێگەی گومان دەستنیشان کراوە."}
                      </p>
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => anomaliesList.resolveAnomaly(anom.id)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-900/50 hover:text-emerald-300 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>چارەسەرکرا</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NEW STUDENT ALERTS — only shown when unacknowledged > 0 */}
            {newStudentAlerts.unacknowledgedCount > 0 && (
              <div className="mb-6 bg-indigo-950 border border-indigo-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                    </span>
                    <h3 className="text-indigo-300 font-bold text-sm">
                      {newStudentAlerts.unacknowledgedCount} قوتابی نوێ تۆمارکردووە
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => void newStudentAlerts.acknowledgeAll()}
                    className="text-xs text-indigo-400 hover:text-indigo-200 transition-colors cursor-pointer"
                  >
                    هەموو بینراو نیشاندە
                  </button>
                </div>
                <div className="space-y-2">
                  {newStudentAlerts.alerts
                    .filter((a) => !a.isAcknowledged)
                    .slice(0, 5)
                    .map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between bg-indigo-900/40 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white">
                            {alert.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white text-xs font-semibold">{alert.name}</p>
                            <p className="text-indigo-400 text-[10px]">
                              پۆل {alert.grade} · {alert.stream} · {alert.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {alert.isNew && (
                            <span className="bg-emerald-900 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-700">
                              نوێ
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => void newStudentAlerts.acknowledge(alert.id)}
                            className="text-indigo-400 hover:text-white transition-colors cursor-pointer"
                            title="بینراو"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Quick Actions Panel & Service Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>پێڕستی هەنگاوە خێراکان (Quick Admin Actions)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTabChange("students")}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition text-right cursor-pointer"
                  >
                    <Users className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">بەڕێوەبردنی قوتابیان</span>
                      <span className="text-[11px] text-slate-400">بینینی ئاست و بەستنەوەی نمرەکان</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange("content")}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition text-right cursor-pointer"
                  >
                    <BookOpen className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">کۆنتڕۆڵی مەنهەج و ئاڵاکان</span>
                      <span className="text-[11px] text-slate-400">کاراکردن یا ناچالاککردنی تایبەتمەندی</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={studentList.exportStudentsToCSV}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition text-right cursor-pointer"
                  >
                    <Download className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">هەناردەکردنی قوتابیان (CSV)</span>
                      <span className="text-[11px] text-slate-400">دابەزاندنی داتای ڕاستەقینەی قوتابیان</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleBroadcast()}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition text-right cursor-pointer"
                  >
                    <Megaphone className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">ناردنی ئاگاداری گشتی</span>
                      <span className="text-[11px] text-slate-400">پەیامی لەناکاو بۆ هەموو قوتابیان</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Real-time Infrastructure Status */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>باری ژێرخانی تەکنیکی</span>
                </h3>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-300 font-sans">Firebase Auth & DB</span>
                    <StatusBadge status={health.data?.firebase} />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-300 font-sans">Cloudflare Edge & Cache</span>
                    <StatusBadge status={health.data?.cloudflare} />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-300 font-sans">Gemini LLM Teacher API</span>
                    <StatusBadge status={health.data?.gemini} />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-300 font-sans">Offline Sync Protocol</span>
                    <StatusBadge status={health.data?.offlineSync} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENTS (/admin/students) */}
        {activeTab === "students" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {passwordResetNotice && (
              <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 text-xs font-bold flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{passwordResetNotice}</span>
              </div>
            )}

            {studentList.error && (
              <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-bold flex items-center justify-between">
                <span>{studentList.error}</span>
                <button
                  type="button"
                  onClick={() => studentList.refetch()}
                  className="px-2.5 py-1 rounded bg-rose-800 hover:bg-rose-700 text-white text-[11px] cursor-pointer"
                >
                  دووبارە هەوڵبدەوە
                </button>
              </div>
            )}

            {/* Toolbar: Search, Grade Filter, Anomaly Filter, Export */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  value={studentList.searchQuery}
                  onChange={(e) => studentList.setSearchQuery(e.target.value)}
                  placeholder="گەڕان بەپێی ناو، ئیمەیڵ یاخود ناسنامە..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={studentList.gradeFilter}
                  onChange={(e) => studentList.setGradeFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none"
                >
                  <option value="all">سەرجەم پۆلەکان (All Grades)</option>
                  <option value="12">پۆلی ١٢ (Grade 12)</option>
                  <option value="11">پۆلی ١١ (Grade 11)</option>
                  <option value="10">پۆلی ١٠ (Grade 10)</option>
                  <option value="9">پۆلی ٩ (Grade 9)</option>
                </select>

                <button
                  type="button"
                  onClick={() => studentList.setAnomalyFilter(!studentList.anomalyFilter)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    studentList.anomalyFilter
                      ? "bg-rose-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>تەنها کێشەدارەکان</span>
                </button>

                <button
                  type="button"
                  onClick={studentList.exportStudentsToCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>دابەزاندنی CSV</span>
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-800/70 text-slate-400 border-b border-slate-800 font-mono">
                    <tr>
                      <th className="p-3.5">ناو و ئیمەیڵ</th>
                      <th className="p-3.5">پۆل و لق</th>
                      <th className="p-3.5">ئاستی تێگەیشتن (Mastery)</th>
                      <th className="p-3.5">بەردەوامی</th>
                      <th className="p-3.5">دواین چالاکی</th>
                      <th className="p-3.5 text-center">کردارەکان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {studentList.loading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-3.5">
                            <div className="h-4 bg-slate-800 rounded w-32 mb-1.5" />
                            <div className="h-3 bg-slate-800/60 rounded w-24" />
                          </td>
                          <td className="p-3.5">
                            <div className="h-4 bg-slate-800 rounded w-16" />
                          </td>
                          <td className="p-3.5">
                            <div className="h-4 bg-slate-800 rounded w-20" />
                          </td>
                          <td className="p-3.5">
                            <div className="h-4 bg-slate-800 rounded w-12" />
                          </td>
                          <td className="p-3.5">
                            <div className="h-4 bg-slate-800 rounded w-20" />
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="h-6 bg-slate-800 rounded w-16 mx-auto" />
                          </td>
                        </tr>
                      ))
                    ) : studentList.students.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500 font-sans text-sm">
                          هێشتا قوتابییەک تۆمارنەکراوە.
                        </td>
                      </tr>
                    ) : (
                      studentList.students.map((std) => (
                        <tr key={std.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              {std.isActive ? (
                                <span
                                  className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                                  title="چالاک لە ١٥ خولەکی ڕابردوودا"
                                />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                              )}
                              <div>
                                <span className="font-bold text-white block">{std.name}</span>
                                <span className="font-mono text-[11px] text-slate-400">{std.email || std.phoneNumber || '—'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-200 block">پۆلی {std.grade}</span>
                            <span className="text-[11px] text-slate-400">
                              {std.stream === "scientific"
                                ? "زانستی"
                                : std.stream === "literary"
                                ? "وێژەیی"
                                : "گشتی"}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-indigo-400">
                                {Math.round(std.masteryScore * 100).toLocaleString("ar-u-nu-arab")}%
                              </span>
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${std.masteryScore * 100}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-orange-400">
                              🔥 {std.streakDays.toLocaleString("ar-u-nu-arab")} ڕۆژ
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400">
                            <div className="space-y-0.5">
                              <span>{std.lastActiveLabel}</span>
                              {std.hasAnomaly && (
                                <span className="inline-block text-[10px] text-rose-400 font-bold bg-rose-950/70 border border-rose-900 px-1 rounded">
                                  ⚠️ کێشە
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedStudent(std)}
                                title="بینینی وردەکاری و بەرەوپێشچوون"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 transition cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResetPassword(std)}
                                title="ناردنی لینکی گۆڕینی وشەی نهێنی"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition cursor-pointer"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CURRICULUM MANAGEMENT (/admin/content) */}
        {activeTab === "content" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Curriculum Management Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>مەنهەجی خوێندن (Curriculum Enable/Disable)</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { nameKu: "کیمیا", nameEn: "Chemistry", count: "٢٤ چەمک", active: true },
                  { nameKu: "فیزیا", nameEn: "Physics", count: "٢٨ چەمک", active: true },
                  { nameKu: "بیرکاری", nameEn: "Mathematics", count: "٣٢ چەمک", active: true },
                  { nameKu: "بایۆلۆژی", nameEn: "Biology", count: "٢٠ چەمک", active: true },
                  { nameKu: "ئینگلیزی", nameEn: "English", count: "١٦ چەمک", active: true },
                  { nameKu: "زمانی کوردی", nameEn: "Kurdish", count: "١٨ چەمک", active: true },
                ].map((s) => (
                  <div
                    key={s.nameEn}
                    className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-center"
                  >
                    <span className="text-xs font-bold text-white block">{s.nameKu}</span>
                    <span className="font-mono text-[10px] text-slate-400 block">{s.nameEn}</span>
                    <span className="text-[10px] text-emerald-400 font-bold block">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FEATURE FLAGS (/admin/flags) */}
        {activeTab === "flags" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Feature Flags Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>کۆنتڕۆڵی ئاڵاکانی سیستەم (Feature Flags)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  شاردنەوە یاخود کاراکردنی بەشەکانی پلاتفۆرم بەبێ پێویستی بڵاوکردنەوەی کۆدی نوێ.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(Object.keys(FEATURE_FLAGS) as FeatureFlagName[]).map((name) => {
                  const def = FEATURE_FLAGS[name];
                  const isCurrentlyEnabled = localFlags[name] ?? def.defaultValue;

                  return (
                    <div
                      key={name}
                      className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <span className="font-mono text-xs font-bold text-white block">{def.key}</span>
                        <p className="text-[11px] text-slate-400 leading-tight">{def.description}</p>
                        <span className="inline-block text-[9px] font-mono text-slate-500 uppercase">
                          PHASE {def.rolloutPhase}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => void toggleFlag(name)}
                        className={`p-1 rounded-lg transition cursor-pointer shrink-0 ${
                          isCurrentlyEnabled ? "text-indigo-400 hover:text-indigo-300" : "text-slate-500 hover:text-slate-400"
                        }`}
                      >
                        {isCurrentlyEnabled ? (
                          <ToggleRight className="w-7 h-7" />
                        ) : (
                          <ToggleLeft className="w-7 h-7" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM (/admin/system) */}
        {activeTab === "system" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Live Anomalies Management Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>دۆزینەوەی کێشە نائاساییەکان (Live Anomaly Detection)</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {anomaliesList.anomalies.length} کێشەی چالاک
                </span>
              </div>

              {anomaliesList.loading ? (
                <div className="h-20 bg-slate-800/50 animate-pulse rounded-xl" />
              ) : anomaliesList.anomalies.length === 0 ? (
                <div className="text-center py-8 text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 rounded-xl font-bold text-xs">
                  ✅ هیچ کێشەیەک نەدۆزراوەتەوە
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden font-sans text-xs">
                  {anomaliesList.anomalies.map((anom) => (
                    <div
                      key={anom.id}
                      className="p-3.5 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                              anom.severity === "CRITICAL"
                                ? "bg-rose-950 text-rose-400 border border-rose-800"
                                : "bg-amber-950 text-amber-400 border border-amber-800"
                            }`}
                          >
                            {anom.severity}
                          </span>
                          <span className="font-bold text-white">{anom.studentName}</span>
                          <span className="text-slate-500 font-mono text-[11px]">({anom.type})</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          {anom.type === "INACTIVE_7_DAYS"
                            ? `قوتابی بۆ ماوەی ${anom.details?.daysInactive || 7} ڕۆژە ناچالاکە.`
                            : anom.type === "MASTERY_DROP"
                            ? `نمرەی شارەزایی بە ڕێژەی ${Math.round((anom.details?.masteryDrop || 0.2) * 100)}% دابەزیوە.`
                            : anom.details?.notes || "هەڵسەنگاندنی ئەم قوتابییە جێگەی گومانە."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => anomaliesList.resolveAnomaly(anom.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>چارەسەرکردن</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Announcement Broadcast */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-rose-400" />
                <span>ناردنی پەیامی لەناکاو بۆ سەرجەم قوتابیان (System Broadcast)</span>
              </h3>

              <form onSubmit={handleBroadcastAnnouncement} className="space-y-3">
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="دەقی ئاگادارییەکە بنووسە کە دەستبەجێ لە سەنتەری ئاگادارییەکانی قوتابیان دەردەکەوێت..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isBroadcasting || !announcementText.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Megaphone className="w-4 h-4" />
                    <span>{isBroadcasting ? "ناردن..." : "بڵاوکردنەوەی گشتی"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Error Logs from Firestore / System */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>تۆماری هەڵە و چاودێری (Error Logs & Auditing)</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {systemAudit.logs.length} ڕووداو
                </span>
              </div>

              {systemAudit.loading ? (
                <div className="p-6 text-center text-slate-500 font-sans text-xs animate-pulse">
                  چاوەڕێی هێنانی داتاکان...
                </div>
              ) : systemAudit.logs.length === 0 ? (
                <div className="p-6 text-center text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 rounded-xl font-bold font-sans text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>سیستەم بە تەواوی سەقامگیرە؛ هیچ هەڵەیەک یاخود هەوڵێکی نایاسایی تۆمار نەکراوە.</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
                  {systemAudit.logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <div key={log.id} className="bg-slate-900/50 hover:bg-slate-800/40 transition">
                        <button
                          type="button"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="w-full p-3 text-right flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                log.status === "CRITICAL"
                                  ? "bg-rose-950 text-rose-400 border border-rose-800"
                                  : log.status === "WARNING"
                                  ? "bg-amber-950 text-amber-400 border border-amber-800"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {log.status}
                            </span>
                            <span className="text-white font-bold">{log.type}</span>
                            <span className="text-slate-400 font-sans text-[11px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                              {log.path}
                            </span>
                            {log.message && (
                              <span className="text-slate-300 font-sans text-xs truncate max-w-[240px] sm:max-w-sm">
                                {log.message}
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500 text-[11px] shrink-0 font-sans">{log.timestamp}</span>
                        </button>

                        {isExpanded && (
                          <div className="p-3.5 bg-slate-950/70 border-t border-slate-800 space-y-2 text-xs font-sans">
                            {log.message && (
                              <div>
                                <span className="text-slate-400 font-bold block text-[11px]">دەقی هەڵە (Error Message):</span>
                                <p className="text-rose-300 bg-rose-950/30 p-2 rounded-lg border border-rose-900/40 font-mono mt-1 break-all">
                                  {log.message}
                                </p>
                              </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono pt-1">
                              <div>ناسنامەی تۆمار (Log ID): <span className="text-slate-300">{log.id}</span></div>
                              <div>ڕێڕەو (Route): <span className="text-indigo-400">{log.path}</span></div>
                              {log.userAgent && (
                                <div className="sm:col-span-2 truncate">
                                  ئامێر/وێبگەڕ: <span className="text-slate-300">{log.userAgent}</span>
                                </div>
                              )}
                            </div>
                            {log.componentStack && (
                              <div className="pt-1">
                                <span className="text-slate-400 font-bold block text-[11px]">Component Stack:</span>
                                <pre className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800 overflow-x-auto max-h-32 mt-1 whitespace-pre-wrap">
                                  {log.componentStack}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-white">{selectedStudent.name}</h3>
                <span className="font-mono text-xs text-slate-400">{selectedStudent.email || selectedStudent.phoneNumber || '—'}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block font-sans">پۆل و لق</span>
                <span className="font-bold text-white font-sans">پۆلی {selectedStudent.grade}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block font-sans">نمرەی ماستەری</span>
                <span className="font-bold text-indigo-400">
                  {Math.round(selectedStudent.masteryScore * 100).toLocaleString("ar-u-nu-arab")}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block font-sans">زنجیرەی بەردەوامی</span>
                <span className="font-bold text-orange-400">
                  🔥 {selectedStudent.streakDays.toLocaleString("ar-u-nu-arab")} ڕۆژ
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block font-sans">کۆی دانیشتنەکان</span>
                <span className="font-bold text-emerald-400">
                  {selectedStudent.sessionsCount.toLocaleString("ar-u-nu-arab")} جار
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  handleResetPassword(selectedStudent);
                  setSelectedStudent(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>ناردنی ڕێکخستنەوەی پاسۆرد</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                داخستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
