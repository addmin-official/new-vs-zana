import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  Bell,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  ExternalLink,
  X,
  Flame,
  Brain,
  Calendar,
  TrendingUp,
  ArrowRight,
  Target,
  ShieldAlert,
  BarChart3,
  GitBranch,
} from "lucide-react";
import { useAppStore } from "../store/appStore.ts";
import { useTranslation } from "../hooks/useTranslation.ts";
import {
  getEvaluatedKnowledgeGraph,
  generateIntelligentWeeklyPlan,
  calculateProgressForecast,
  calculateMomentumScore,
  evaluateMomentum,
  EvaluatedKnowledgeNode,
  IntelligentWeeklyPlan,
  ProgressForecastResult,
} from "../planning/planning.ts";
import { StudentMasteryProfile, MasteryStatus } from "../learning/domain/MasteryTypes.ts";

export interface StudyTaskItem {
  id: string;
  time: string;
  duration: string;
  durationMinutes: number;
  title: string;
  subject: string;
  status: "completed" | "in_progress" | "pending";
  progress: number;
  targetScreen?: "chat" | "practice" | "labs" | "assessment";
}

export interface StudyPathManagerProps {
  onNavigateToChat?: (subject?: string) => void;
  onNavigateToPractice?: () => void;
  onNavigateToLabs?: () => void;
  onNavigateToAssessment?: () => void;
}

const DEFAULT_TASKS: StudyTaskItem[] = [
  {
    id: "t1",
    time: "09:00",
    duration: "١٥ خولەک",
    durationMinutes: 15,
    title: "پێداچوونەوەی هاوسەنگی کیمیایی و pH",
    subject: "chemistry",
    status: "completed",
    progress: 100,
    targetScreen: "chat",
  },
  {
    id: "t2",
    time: "11:00",
    duration: "٢٠ خولەک",
    durationMinutes: 20,
    title: "شیکارکردنی کێشەکانی تیتراسیۆن لە تاقیگە",
    subject: "chemistry",
    status: "in_progress",
    progress: 45,
    targetScreen: "labs",
  },
  {
    id: "t3",
    time: "14:00",
    duration: "٥ خولەک",
    durationMinutes: 5,
    title: "تاقیکردنەوەی خێرا لەسەر ترش و تفت",
    subject: "chemistry",
    status: "pending",
    progress: 0,
    targetScreen: "assessment",
  },
];

const KURDISH_DAYS = [
  { key: "sat", name: "شەممە" },
  { key: "sun", name: "یەکشەممە" },
  { key: "mon", name: "دووشەممە" },
  { key: "tue", name: "سێشەممە" },
  { key: "wed", name: "چوارشەممە" },
  { key: "thu", name: "پێنجشەممە" },
  { key: "fri", name: "هەینی" },
];

export function StudyPathManager({
  onNavigateToChat,
  onNavigateToPractice,
  onNavigateToLabs,
  onNavigateToAssessment,
}: StudyPathManagerProps = {}) {
  const { t, formatNumber: _formatNumber } = useTranslation();
  const [activeTab, setActiveTab] = useState<"today" | "weekly" | "graph" | "forecast" | "goals">("today");
  const [weeklyGoalHours, setWeeklyGoalHours] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zana_weekly_goal_hours");
      return saved ? parseInt(saved, 10) : 20;
    }
    return 20;
  });
  const [notifyOnMiss, setNotifyOnMiss] = useState(true);

  // Subject selection for Knowledge Graph
  const [selectedGraphSubject, setSelectedGraphSubject] = useState<string>("chemistry");
  const [selectedGraphNode, setSelectedGraphNode] = useState<EvaluatedKnowledgeNode | null>(null);

  // App store
  const user = useAppStore((state) => state.user);
  const userProgress = useAppStore((state) => state.userProgress);

  // Build baseline mastery profile from local storage / progress
  const masteryProfile: StudentMasteryProfile = useMemo(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`zana_mastery_profile_${user?.id || "guest"}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      studentId: user?.id || "student_guest",
      overallMasteryScore: 0.65,
      conceptMasteries: {
        chem_g12_solutions: {
          conceptId: "chem_g12_solutions",
          masteryScore: 0.85,
          status: MasteryStatus.MASTERED,
          consecutiveCorrect: 5,
          totalAttempts: 6,
          lastAttemptedAt: null,
          history: [],
        },
        chem_g12_acids_bases: {
          conceptId: "chem_g12_acids_bases",
          masteryScore: 0.75,
          status: MasteryStatus.PROFICIENT,
          consecutiveCorrect: 3,
          totalAttempts: 4,
          lastAttemptedAt: null,
          history: [],
        },
        chem_g12_ph_scale: {
          conceptId: "chem_g12_ph_scale",
          masteryScore: 0.45,
          status: MasteryStatus.DEVELOPING,
          consecutiveCorrect: 1,
          totalAttempts: 4,
          ddi: 0.4,
          lastAttemptedAt: null,
          history: [],
        },
        phys_g12_electric_force: {
          conceptId: "phys_g12_electric_force",
          masteryScore: 0.8,
          status: MasteryStatus.MASTERED,
          consecutiveCorrect: 4,
          totalAttempts: 5,
          lastAttemptedAt: null,
          history: [],
        },
        math_g12_functions: {
          conceptId: "math_g12_functions",
          masteryScore: 0.7,
          status: MasteryStatus.PROFICIENT,
          consecutiveCorrect: 3,
          totalAttempts: 4,
          lastAttemptedAt: null,
          history: [],
        },
      },
      activeMisconceptions: [],
      recentRecommendedActions: [],
      streak: {
        currentStreak: userProgress.streak || 3,
        longestStreak: Math.max(userProgress.streak || 3, 7),
        lastCompletedDate: new Date().toISOString().split("T")[0],
        streakHistory: [],
        totalTasksCompleted: userProgress.lessonsCompleted || 12,
      },
    };
  }, [user?.id, userProgress.streak, userProgress.lessonsCompleted]);

  // Evaluated Knowledge Graph nodes
  const graphNodes = useMemo(() => {
    return getEvaluatedKnowledgeGraph(selectedGraphSubject, user?.grade || "12", masteryProfile);
  }, [selectedGraphSubject, user?.grade, masteryProfile]);

  // Auto-select first node if none selected
  useEffect(() => {
    if (graphNodes.length > 0 && !selectedGraphNode) {
      setSelectedGraphNode(graphNodes[0]);
    }
  }, [graphNodes, selectedGraphNode]);

  // Intelligent Weekly Plan Generator
  const [weeklyPlan, setWeeklyPlan] = useState<IntelligentWeeklyPlan>(() => {
    return generateIntelligentWeeklyPlan({
      studentProfile: {
        studentId: user?.id || "guest",
        grade: user?.grade || "12",
        activeSubject: selectedGraphSubject,
      },
      masteryProfile,
      availableStudyHoursPerWeek: weeklyGoalHours,
    });
  });

  // Re-generate weekly plan when goal hours change
  useEffect(() => {
    setWeeklyPlan(
      generateIntelligentWeeklyPlan({
        studentProfile: {
          studentId: user?.id || "guest",
          grade: user?.grade || "12",
          activeSubject: selectedGraphSubject,
        },
        masteryProfile,
        availableStudyHoursPerWeek: weeklyGoalHours,
      })
    );
  }, [weeklyGoalHours, selectedGraphSubject, masteryProfile, user?.id, user?.grade]);

  // Progress Forecasting Engine
  const forecastResult: ProgressForecastResult = useMemo(() => {
    return calculateProgressForecast({
      masteryProfile,
      grade: user?.grade || "12",
      weeklyStudyHours: weeklyGoalHours,
    });
  }, [masteryProfile, user?.grade, weeklyGoalHours]);

  // Streak & Momentum Score System
  const momentumScore = useMemo(() => {
    const daysStudied = userProgress.streak || 3;
    const proficientCount = Object.values(masteryProfile.conceptMasteries).filter(
      (m) => m.masteryScore >= 0.6 && m.masteryScore < 0.8
    ).length;
    const masteredCount = Object.values(masteryProfile.conceptMasteries).filter(
      (m) => m.masteryScore >= 0.8
    ).length;

    return calculateMomentumScore({
      daysStudied,
      conceptsProficient: proficientCount,
      conceptsMastered: masteredCount,
      missedSessions: 0,
      daysInactive: 0,
      baselineMomentum: 50,
    });
  }, [userProgress.streak, masteryProfile]);

  const momentumInfo = useMemo(() => evaluateMomentum(momentumScore), [momentumScore]);

  // Load / Save Tasks
  const [todayTasks, setTodayTasks] = useState<StudyTaskItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("zana_studypath_tasks_v2");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_TASKS;
  });

  const saveTasks = (newTasks: StudyTaskItem[]) => {
    setTodayTasks(newTasks);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("zana_studypath_tasks_v2", JSON.stringify(newTasks));
      } catch {}
    }
  };

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modals state
  const [activeTimerTask, setActiveTimerTask] = useState<StudyTaskItem | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState<boolean>(false);

  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("16:00");
  const [newTaskDuration, setNewTaskDuration] = useState("20");
  const [newTaskSubject, setNewTaskSubject] = useState("chemistry");

  const handleTaskComplete = useCallback((taskId: string) => {
    setTodayTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId ? { ...t, status: "completed" as const, progress: 100 } : t
      );
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("zana_studypath_tasks_v2", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
    showToast("ئەرکەکە بە سەرکەوتوویی تەواو کرا! ئافەرم 🌟 (+٢٠ خاڵ)");
    useAppStore.getState().addProgressScore(20, 1);
    setActiveTimerTask(null);
  }, []);

  // Timer effect
  useEffect(() => {
    if (!activeTimerTask || !isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          handleTaskComplete(activeTimerTask.id);
          showToast(`ئافەرم! کاتی خوێندنی "${activeTimerTask.title}" تەواو بوو 🎉`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimerTask, isTimerRunning, handleTaskComplete]);

  // Task Actions
  const handleToggleTaskStatus = (taskId: string) => {
    const updated = todayTasks.map((t) => {
      if (t.id === taskId) {
        const nextStatus = t.status === "completed" ? "pending" : "completed";
        return {
          ...t,
          status: nextStatus as StudyTaskItem["status"],
          progress: nextStatus === "completed" ? 100 : 0,
        };
      }
      return t;
    });
    saveTasks(updated);
    const toggled = updated.find((t) => t.id === taskId);
    if (toggled?.status === "completed") {
      showToast("ئەرکەکە وەک تەواوکراو دیاریکرا ✅ (+١٥ خاڵ)");
      useAppStore.getState().addProgressScore(15, 1);
    }
  };

  const handleTaskStart = (task: StudyTaskItem) => {
    const updated = todayTasks.map((t) =>
      t.id === task.id ? { ...t, status: "in_progress" as const, progress: Math.max(t.progress, 25) } : t
    );
    saveTasks(updated);
    setActiveTimerTask(task);
    setTimerSecondsLeft(task.durationMinutes * 60);
    setIsTimerRunning(true);
  };

  const handleTaskReset = (taskId: string) => {
    const updated = todayTasks.map((t) =>
      t.id === taskId ? { ...t, status: "pending" as const, progress: 0 } : t
    );
    saveTasks(updated);
    showToast("ئەرکەکە بۆ دۆخی سەرەتایی گەڕێنرایەوە");
  };

  const handleTaskDelete = (taskId: string) => {
    const updated = todayTasks.filter((t) => t.id !== taskId);
    saveTasks(updated);
    showToast("ئەرکەکە سڕدرایەوە");
  };

  const handleNavigateToTaskModule = (task: StudyTaskItem | { subject: string; targetScreen?: string }) => {
    if (task.targetScreen === "chat" && onNavigateToChat) {
      onNavigateToChat(task.subject);
    } else if (task.targetScreen === "labs" && onNavigateToLabs) {
      onNavigateToLabs();
    } else if (task.targetScreen === "practice" && onNavigateToPractice) {
      onNavigateToPractice();
    } else if (task.targetScreen === "assessment" && onNavigateToAssessment) {
      onNavigateToAssessment();
    } else if (onNavigateToChat) {
      onNavigateToChat(task.subject);
    }
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: StudyTaskItem = {
      id: "custom-" + Date.now(),
      title: newTaskTitle.trim(),
      time: newTaskTime,
      duration: `${newTaskDuration} خولەک`,
      durationMinutes: parseInt(newTaskDuration, 10) || 15,
      subject: newTaskSubject,
      status: "pending",
      progress: 0,
      targetScreen: newTaskSubject === "chemistry" ? "chat" : "practice",
    };

    saveTasks([...todayTasks, newTask]);
    setNewTaskTitle("");
    setIsAddTaskModalOpen(false);
    showToast("ئەرکی نوێ بە سەرکەوتوویی زیاد کرا 🎯");
  };

  // Toggle weekly plan item completion
  const handleToggleWeeklyItem = (itemId: string) => {
    setWeeklyPlan((prev) => {
      const updatedDays = prev.days.map((d) => ({
        ...d,
        items: d.items.map((it) => (it.id === itemId ? { ...it, isCompleted: !it.isCompleted } : it)),
      }));
      const updatedAll = prev.allItems.map((it) =>
        it.id === itemId ? { ...it, isCompleted: !it.isCompleted } : it
      );
      showToast("دۆخی ئەرکی هەفتانە نوێکرایەوە 🌟");
      return { ...prev, days: updatedDays, allItems: updatedAll };
    });
  };

  // Kurdistan School Week: Saturday (0) through Friday (6)
  const currentJsDay = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const currentKurdishDayIndex = (currentJsDay + 1) % 7;
  const basePastHours = [2.5, 3.0, 2.0, 3.5, 2.5, 1.0, 0.0];

  const weeklyData = KURDISH_DAYS.map((dayObj, index) => {
    let hours = 0;
    if (index <= currentKurdishDayIndex) {
      hours = basePastHours[index] ?? 2.0;
    } else {
      hours = 0.0;
    }
    return {
      day: dayObj.name,
      hours,
      isToday: index === currentKurdishDayIndex,
      isFuture: index > currentKurdishDayIndex,
    };
  });

  const totalStudied = parseFloat(
    weeklyData.reduce((acc, d) => acc + d.hours, 0).toFixed(1)
  );

  const progressPercent = Math.min(
    100,
    Math.round((totalStudied / weeklyGoalHours) * 100)
  );

  const remainingDays = Math.max(0, 6 - currentKurdishDayIndex);
  const remainingSchoolDays = Math.max(0, 5 - currentKurdishDayIndex);
  const maxHourValue = Math.max(...weeklyData.map((d) => d.hours), 4);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full font-sans" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl z-50 flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-bottom-3 border border-slate-700">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white mr-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900">
              داشبۆردی پلانی خوێندن 🧭
            </span>
            {/* Momentum Pill */}
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                momentumInfo.momentumScore >= 75
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900"
                  : momentumInfo.momentumScore >= 40
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900"
                  : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>هاندان: {momentumScore}٪</span>
            </span>
          </div>

          <h1 className="font-sans font-black text-2xl text-slate-900 dark:text-white mt-1">
            ڕێڕەو و کاتژمێری خوێندنی قوتابی
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            نەخشەی مەعریفەی خۆگونجێنەر، پلانی ٧ ڕۆژەی زیرەک و پێشبینی کاتی تەواوکردنی مەنهەج
          </p>
        </div>

        {/* Segmented 5 Navigation Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: "today", label: t("plan.todayPlan"), icon: Clock },
            { id: "weekly", label: t("plan.weeklyPlan"), icon: Calendar },
            { id: "graph", label: t("plan.knowledgeGraph"), icon: GitBranch },
            { id: "forecast", label: "پێشبینی و خێرایی", icon: TrendingUp },
            { id: "goals", label: "ئامانجەکان", icon: Target },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-2 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: TODAY'S TASKS */}
      {activeTab === "today" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans font-bold text-base text-slate-900 dark:text-white">
              ئەرکە خشتەبۆکراوەکانی ئەمڕۆ
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                {todayTasks.length} ئەرک • کۆی کات:{" "}
                {todayTasks.reduce((acc, t) => acc + t.durationMinutes, 0)} خولەک
              </span>
              <button
                onClick={() => setIsAddTaskModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ئەرکی نوێ</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {todayTasks.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                هیچ ئەرکێک بۆ ئەمڕۆ نەماوە! دەتوانیت ئەرکی نوێ زیاد بکەیت.
              </div>
            ) : (
              todayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    task.status === "completed"
                      ? "border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10"
                      : task.status === "in_progress"
                      ? "border-indigo-300 dark:border-indigo-800 ring-1 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleTaskStatus(task.id)}
                      className={`p-1.5 rounded-xl border mt-0.5 transition cursor-pointer ${
                        task.status === "completed"
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-300 dark:border-slate-600 hover:border-indigo-500 text-transparent"
                      }`}
                      title={task.status === "completed" ? "دیاریکردن وەک ناتەواو" : "دیاریکردن وەک تەواوکراو"}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0 font-mono text-xs font-bold">
                      {task.time}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-sans font-bold text-sm ${
                            task.status === "completed"
                              ? "line-through text-slate-400 dark:text-slate-500"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {task.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {task.subject === "chemistry"
                            ? "کیمیا"
                            : task.subject === "physics"
                            ? "فیزیا"
                            : task.subject === "math"
                            ? "بیرکاری"
                            : "وانەی گشتی"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{task.duration}</span>
                        </span>
                        {task.progress > 0 && task.status !== "completed" && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                            بڕدراو: {task.progress}٪
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {task.status !== "completed" && (
                      <button
                        onClick={() => handleTaskStart(task)}
                        className="bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>دەستپێکردن</span>
                      </button>
                    )}

                    {task.status === "completed" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleNavigateToTaskModule(task)}
                          className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-bold text-xs px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition cursor-pointer flex items-center gap-1"
                          title="کردنەوەی بابەت لە زانا"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>پێداچوونەوە</span>
                        </button>
                        <button
                          onClick={() => handleTaskReset(task.id)}
                          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="دووبارەکردنەوە"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => handleTaskDelete(task.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                      title="سڕینەوەی ئەم ئەرکە"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INTELLIGENT WEEKLY CALENDAR & PLAN */}
      {activeTab === "weekly" && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-sans block">
                کاتژمێرەکانی خوێندراو لەم هەفتەیەدا
              </span>
              <span className="font-sans font-black text-2xl text-indigo-700 dark:text-indigo-400">
                {totalStudied} کاتژمێر
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                لە کۆی ئامانجی {weeklyGoalHours} کاتژمێر
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-sans block">
                ڕێژەی گەیشتن بە ئامانج
              </span>
              <span className="font-sans font-black text-2xl text-emerald-600 dark:text-emerald-400">
                {progressPercent}%
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {progressPercent >= 70 ? "زۆر باشە! بەردەوام بە" : "هەوڵبدە بگەی بە ئامانجەکەت"}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-sans block">
                ڕۆژانی ماوەی هەفتە
              </span>
              <span className="font-sans font-black text-2xl text-slate-900 dark:text-white">
                {remainingDays} ڕۆژ
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {remainingSchoolDays > 0
                  ? `${remainingSchoolDays} ڕۆژی خوێندن ماوە تا پشووی هەینی`
                  : "ئەمڕۆ کۆتا ڕۆژی هەفتەی فێرکارییە"}
              </span>
            </div>
          </div>

          {/* 7-Day Intelligent Weekly Calendar View */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>خشتەی ٧ ڕۆژەی زیرەکی فێربوون (Intelligent 7-Day Plan)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  ڕێکخستنی ئۆتۆماتیکی: پێداچوونەوەی مەودادار ➔ چەمکە نوێیە کراوەکان ➔ خاڵە لاوازەکان
                </p>
              </div>
              <span className="text-xs font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900">
                کۆی پلان: {weeklyPlan.totalWeeklyMinutes} خولەک
              </span>
            </div>

            {/* Calendar Grid: 7 Day Columns */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 pt-2">
              {weeklyPlan.days.map((day) => {
                const isToday = day.dayIndex === currentKurdishDayIndex;
                return (
                  <div
                    key={day.dayIndex}
                    className={`rounded-2xl p-3 border flex flex-col justify-between transition-all ${
                      isToday
                        ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-400 dark:border-indigo-700 ring-2 ring-indigo-500/20 shadow-sm"
                        : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div>
                      {/* Day Header */}
                      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700 pb-2 mb-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {day.dayNameKu}
                        </span>
                        {isToday && (
                          <span className="text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-md">
                            ئەمڕۆ
                          </span>
                        )}
                      </div>

                      {/* Day Items */}
                      <div className="space-y-2">
                        {day.items.length === 0 ? (
                          <div className="py-6 text-center text-[10px] text-slate-400">
                            پشووی کورت 🌙
                          </div>
                        ) : (
                          day.items.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleToggleWeeklyItem(item.id)}
                              className={`p-2 rounded-xl border text-right transition cursor-pointer select-none ${
                                item.isCompleted
                                  ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 opacity-70"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                    item.type === "review"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                      : item.type === "new"
                                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  }`}
                                >
                                  {item.type === "review"
                                    ? "پێداچوونەوە"
                                    : item.type === "new"
                                    ? "چەمکی نوێ"
                                    : "ڕاهێنان"}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400">
                                  {item.estimatedMinutes}خ
                                </span>
                              </div>
                              <p
                                className={`text-[11px] font-bold leading-tight ${
                                  item.isCompleted
                                    ? "line-through text-slate-400 dark:text-slate-500"
                                    : "text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                {item.concept}
                              </p>
                              <span className="text-[9px] text-slate-400 block mt-1">
                                {item.subjectNameKu}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-700 text-[10px] text-slate-500 font-mono text-center">
                      کۆ: {day.totalMinutes} خولەک
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bar Chart Representation */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-white">
                دابەشبوونی کاتژمێرەکانی خوێندن بەسەر ڕۆژەکاندا
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                کۆی تۆمارکراو: {totalStudied} کاتژمێر
              </span>
            </div>

            <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
              {weeklyData.map((d, idx) => {
                const barHeightPercent = Math.max(
                  d.hours > 0 ? (d.hours / maxHourValue) * 100 : 4,
                  d.hours > 0 ? 12 : 4
                );

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span
                      className={`text-[10px] font-mono ${
                        d.isToday
                          ? "font-black text-indigo-600 dark:text-indigo-400"
                          : d.isFuture
                          ? "text-slate-300 dark:text-slate-600"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {d.isFuture ? "—" : `${d.hours} ک`}
                    </span>

                    <div
                      className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                        d.isToday
                          ? "bg-indigo-600 dark:bg-indigo-500 shadow-md ring-2 ring-indigo-400/40"
                          : d.isFuture
                          ? "bg-slate-200 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700"
                          : "bg-indigo-500/80 hover:bg-indigo-600"
                      }`}
                      style={{ height: `${barHeightPercent}%` }}
                    />

                    <span
                      className={`text-xs font-sans font-medium truncate w-full text-center flex flex-col items-center ${
                        d.isToday
                          ? "font-black text-indigo-700 dark:text-indigo-300"
                          : d.isFuture
                          ? "text-slate-400 dark:text-slate-600"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>{d.day}</span>
                      {d.isToday && (
                        <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1 rounded-sm leading-tight mt-0.5">
                          ئەمڕۆ
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VISUAL KNOWLEDGE GRAPH (SVG TREE) */}
      {activeTab === "graph" && (
        <div className="space-y-6">
          {/* Subject Switcher & Legend */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-sans font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-600" />
                <span>نەخشەی مەعریفەی چەمکەکان (Knowledge Graph)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تۆڕی پێداویستییە سەرەتاییەکان (Prerequisites): پێویستە نمرەی چەمک لە خوار ٦٠٪ نەبێت تا چەمکی دواتر بکرێتەوە
              </p>
            </div>

            {/* Subject Selector Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: "chemistry", label: "کیمیا" },
                { id: "physics", label: "فیزیا" },
                { id: "math", label: "بیرکاری" },
                { id: "biology", label: "زیندەوەرزانی" },
              ].map((subj) => (
                <button
                  key={subj.id}
                  onClick={() => {
                    setSelectedGraphSubject(subj.id);
                    setSelectedGraphNode(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedGraphSubject === subj.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {subj.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visual SVG Knowledge Graph Area */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            {/* Legend Bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-sans pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 font-bold">ڕێبەری ڕەنگەکان:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-600" />
                <span className="text-slate-700 dark:text-slate-300">ماستەرکراو (Mastered ≥ ٨٠٪)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 border border-indigo-700" />
                <span className="text-slate-700 dark:text-slate-300">کراوە بۆ خوێندن (Unlocked)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-300 dark:bg-slate-700 border border-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">داخراو بەهۆی پێداویستی (Locked &lt; ٦٠٪)</span>
              </div>
            </div>

            {/* SVG Tree Diagram */}
            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 800 450" className="w-full min-w-[700px] h-[380px] select-none">
                <defs>
                  <marker
                    id="arrowhead-unlocked"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
                  </marker>
                  <marker
                    id="arrowhead-locked"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                  </marker>
                </defs>

                {/* SVG Connecting Edges (Prerequisites -> Concept) */}
                {graphNodes.map((targetNode) =>
                  targetNode.prerequisites.map((prereqId) => {
                    const sourceNode = graphNodes.find((n) => n.id === prereqId);
                    if (!sourceNode) return null;

                    // Convert 0-100 relative positions to 800x450 canvas
                    const sx = (sourceNode.position.x / 100) * 700 + 50;
                    const sy = (sourceNode.position.y / 100) * 350 + 40;
                    const tx = (targetNode.position.x / 100) * 700 + 50;
                    const ty = (targetNode.position.y / 100) * 350 + 40;

                    const isTargetLocked = targetNode.status === "LOCKED";
                    const isSourceMastered = sourceNode.status === "MASTERED";

                    return (
                      <path
                        key={`${sourceNode.id}->${targetNode.id}`}
                        d={`M ${sx} ${sy} C ${sx} ${(sy + ty) / 2}, ${tx} ${(sy + ty) / 2}, ${tx} ${ty}`}
                        fill="none"
                        stroke={isTargetLocked ? "#cbd5e1" : isSourceMastered ? "#10b981" : "#6366f1"}
                        strokeWidth={isTargetLocked ? 1.5 : 2.5}
                        strokeDasharray={isTargetLocked ? "4 4" : undefined}
                        markerEnd={isTargetLocked ? "url(#arrowhead-locked)" : "url(#arrowhead-unlocked)"}
                        className="transition-colors duration-300"
                      />
                    );
                  })
                )}

                {/* SVG Concept Nodes */}
                {graphNodes.map((node) => {
                  const cx = (node.position.x / 100) * 700 + 50;
                  const cy = (node.position.y / 100) * 350 + 40;
                  const isSelected = selectedGraphNode?.id === node.id;

                  const isMastered = node.status === "MASTERED";
                  const isLocked = node.status === "LOCKED";

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedGraphNode(node)}
                      className="cursor-pointer transition-transform duration-200"
                      transform={`translate(${cx}, ${cy})`}
                    >
                      {/* Outer pulse if selected */}
                      {isSelected && (
                        <circle
                          r="32"
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                          className="animate-spin"
                          style={{ animationDuration: "12s" }}
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r="24"
                        fill={isMastered ? "#10b981" : isLocked ? "#94a3b8" : "#4f46e5"}
                        stroke={isSelected ? "#1e1b4b" : "#ffffff"}
                        strokeWidth="3"
                        className="shadow-md hover:scale-110 transition-transform"
                      />

                      {/* Status Icon Indicator */}
                      <text
                        textAnchor="middle"
                        dy="6"
                        fill="#ffffff"
                        fontSize="14"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {isMastered ? "✓" : isLocked ? "🔒" : "✦"}
                      </text>

                      {/* Node Kurdish Label */}
                      <text
                        textAnchor="middle"
                        dy="42"
                        fill={isSelected ? "#4338ca" : "#334155"}
                        fontSize="11"
                        fontWeight="bold"
                        className="pointer-events-none drop-shadow-xs"
                      >
                        {node.nameKu}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Node Details Card */}
            {selectedGraphNode && (
              <div
                className={`p-4 rounded-2xl border mt-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  selectedGraphNode.status === "MASTERED"
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                    : selectedGraphNode.status === "LOCKED"
                    ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                    : "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        selectedGraphNode.status === "MASTERED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : selectedGraphNode.status === "LOCKED"
                          ? "bg-slate-200 text-slate-700 border-slate-300"
                          : "bg-indigo-100 text-indigo-800 border-indigo-300"
                      }`}
                    >
                      {selectedGraphNode.status === "MASTERED"
                        ? "ماستەرکراو ✓ (Mastered)"
                        : selectedGraphNode.status === "LOCKED"
                        ? "داخراوە 🔒 (Prerequisites Locked)"
                        : "کراوەیە ✦ (Ready to Learn)"}
                    </span>
                    <span className="text-xs text-slate-500 font-sans">
                      {selectedGraphNode.unitNameKu}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {selectedGraphNode.nameKu}
                  </h3>

                  {selectedGraphNode.blockedBy.length > 0 && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>داخراوە بەهۆی کەمی نمرەی: {selectedGraphNode.blockedBy.join("، ")} (&lt; ٦٠٪)</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onNavigateToChat) onNavigateToChat(selectedGraphNode.subject);
                    }}
                    disabled={selectedGraphNode.status === "LOCKED"}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition ${
                      selectedGraphNode.status === "LOCKED"
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                    }`}
                  >
                    <Brain className="w-4 h-4" />
                    <span>خوێندن لەگەڵ مامۆستا زانا</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onNavigateToPractice) onNavigateToPractice();
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    ڕاهێنان
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PROGRESS FORECASTING & MOMENTUM */}
      {activeTab === "forecast" && (
        <div className="space-y-6">
          {/* Momentum Gauge Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Circular Gauge */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      momentumScore >= 75
                        ? "text-amber-500"
                        : momentumScore >= 40
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }
                    strokeDasharray={`${momentumScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-mono text-xl font-black text-slate-900 dark:text-white">
                    {momentumScore}٪
                  </span>
                  <span className="text-[8px] text-slate-400">هاندان</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                    سیستەمی وزە و بەردەوامی (Momentum Engine)
                  </span>
                </div>
                <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white">
                  {momentumInfo.badgeLevelKu}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  {momentumInfo.difficultyRecommendationKu}
                </p>
              </div>
            </div>

            {/* Momentum Rules Breakdown */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 shrink-0">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                هاوکێشەی خاڵەکانی هاندان:
              </span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-600 font-bold">+١٠/ڕۆژ خوێندن</span>
                <span className="text-indigo-600 font-bold">+٥/چەمکی شایستە</span>
                <span className="text-amber-600 font-bold">+١٥/چەمکی ماستەر</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-rose-600 font-bold">-٢٠/کۆبوونەوەی لەدەستچوو</span>
                <span className="text-slate-500 font-bold">-٥/ڕۆژی ناچالاکی</span>
              </div>
            </div>
          </div>

          {/* SVG Progress Forecast Bar Chart by Subject */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>پێشبینی کاتی ئامادەیی بۆ وەزاری (Progress Forecasting ±15%)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  خەمڵاندنی ماوە بەپێی خێرایی فێربوونی هەنووکەیی (Learning Velocity) لە هەفتەیەکدا
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900">
                  تەواوکاری گشتی: {forecastResult.overallWeeksToReadiness} هەفتە (±١٥٪)
                </span>
              </div>
            </div>

            {/* SVG Horizontal Bar Chart */}
            <div className="space-y-4 pt-2">
              {forecastResult.subjects.map((subj) => (
                <div key={subj.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>{subj.subjectNameKu}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({subj.masteredConcepts} لە {subj.totalConcepts} چەمک)
                      </span>
                    </span>

                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      ئامادەیی: {subj.weeksToReadiness} هەفتە ({subj.confidenceIntervalWeeks.min} –{" "}
                      {subj.confidenceIntervalWeeks.max} هەفتە)
                    </span>
                  </div>

                  {/* SVG Bar */}
                  <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-l from-indigo-500 to-indigo-700 rounded-full transition-all duration-500"
                      style={{ width: `${subj.percentMastered}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                    <span>دۆخ: {subj.statusKu}</span>
                    <span>بەرواری پێشبینیکراو: {subj.estimatedCompletionDate}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Summary Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
              <span className="text-slate-600 dark:text-slate-400">
                ڕاسپاردەی خێرایی زانا: تەرکیزی زیاتر بخەرە سەر وانەی{" "}
                <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {forecastResult.recommendedFocusSubjectKu}
                </strong>{" "}
                بۆ کەمکردنەوەی جیاوازی هەفتەکان.
              </span>
              <button
                onClick={() => setActiveTab("weekly")}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 self-end sm:self-center cursor-pointer"
              >
                <span>بینینی پلانی ٧ ڕۆژە</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GOAL SETTINGS */}
      {activeTab === "goals" && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 max-w-xl mx-auto">
          <div className="space-y-1">
            <h2 className="font-sans font-bold text-lg text-slate-900 dark:text-white">
              ڕێکخستنی ئامانجی هەفتانەی خوێندن
            </h2>
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
              دیاریبکە دەتەوێت لەم هەفتەیەدا چەند کاتژمێر تەرخان بکەیت بۆ خوێندنی وانەکان:
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">
              هەڵبژاردنی ئامانجی خێرا:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 20, 25].map((hrs) => (
                <button
                  key={hrs}
                  onClick={() => {
                    setWeeklyGoalHours(hrs);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("zana_weekly_goal_hours", hrs.toString());
                    }
                  }}
                  className={`py-2 rounded-xl text-xs font-sans font-bold border transition-all cursor-pointer ${
                    weeklyGoalHours === hrs
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {hrs} کاتژمێر
                </button>
              ))}
            </div>
          </div>

          {/* Notification Alert Toggle */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="font-sans font-bold text-xs text-slate-900 dark:text-white">
                  ئاگادارکردنەوەی ڕۆژانە
                </p>
                <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                  ئاگادارم بکەرەوە کاتێک نزیکبوومەوە لە کاتی خوێندن
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifyOnMiss}
              onChange={(e) => setNotifyOnMiss(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.setItem("zana_weekly_goal_hours", weeklyGoalHours.toString());
              }
              showToast("ئامانجەکان بە سەرکەوتوویی پاشەکەوت کران ✅");
              setActiveTab("today");
            }}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            پاشەکەوتکردنی ئامانجەکان
          </button>
        </div>
      )}

      {/* MODAL 1: FOCUS SESSION TIMER FOR ACTIVE TASK */}
      {activeTimerTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center space-y-6">
            <button
              onClick={() => setActiveTimerTask(null)}
              className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full">
                کاتی خوێندنی چڕ (Focus Session)
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                {activeTimerTask.title}
              </h3>
            </div>

            {/* Big Countdown Timer */}
            <div className="my-6">
              <div className="w-40 h-40 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/60 border-4 border-indigo-600 flex flex-col items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-1" />
                <span className="font-mono text-3xl font-black text-slate-900 dark:text-white">
                  {Math.floor(timerSecondsLeft / 60)
                    .toString()
                    .padStart(2, "0")}
                  :{(timerSecondsLeft % 60).toString().padStart(2, "0")}
                </span>
                <span className="text-[10px] text-slate-400">خولەک : چرکە</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleNavigateToTaskModule(activeTimerTask)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>کردنەوەی بابەت لە ناو زانا (چات / تاقیگە)</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {isTimerRunning ? "ڕاگرتنی کاتی" : "بەردەوامبوون"}
                </button>

                <button
                  onClick={() => handleTaskComplete(activeTimerTask.id)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  تەواوم کرد ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW STUDY TASK */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-right space-y-5">
            <button
              onClick={() => setIsAddTaskModalOpen(false)}
              className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 dark:text-white">
              زیادکردنی ئەرکی نوێ بۆ ئەمڕۆ
            </h3>

            <form onSubmit={handleAddNewTask} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">ناوی ئەرکەکە:</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="بۆ نموونە: شیکارکردنی ١٠ پرسیاری فیزیای کارەبا"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">کاتی دەستپێکردن:</label>
                  <input
                    type="time"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">ماوە (خولەک):</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">وانە پەیوەندیدارەکە:</label>
                <select
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="chemistry">کیمیای پۆلی ١٢</option>
                  <option value="physics">فیزیای پۆلی ١٢</option>
                  <option value="math">بیرکاری پۆلی ١٢</option>
                  <option value="biology">زیندەوەرزانی پۆلی ١٢</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-md cursor-pointer"
              >
                زیادکردنی ئەرک
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudyPathManager;
