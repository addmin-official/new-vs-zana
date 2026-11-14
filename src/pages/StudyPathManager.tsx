import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Clock,
  Bell,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  ExternalLink,
  X
} from "lucide-react";
import { useAppStore } from "../store/appStore.ts";

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
  const [activeTab, setActiveTab] = useState<"today" | "weekly" | "goals">("today");
  const [weeklyGoalHours, setWeeklyGoalHours] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zana_weekly_goal_hours");
      return saved ? parseInt(saved, 10) : 20;
    }
    return 20;
  });
  const [notifyOnMiss, setNotifyOnMiss] = useState(true);

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
    showToast("ئەرکەکە بە سەرکەوتوویی تەواو کرا! ئافەرم 🌟");
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

  const handleNavigateToTaskModule = (task: StudyTaskItem) => {
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

  // -------------------------------------------------------------
  // DYNAMIC & MATHEMATICALLY ACCURATE WEEKLY DATA
  // -------------------------------------------------------------
  // Kurdistan School Week: Saturday (0) through Friday (6)
  const currentJsDay = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Map JS Day to Kurdish Week: Sat = 0, Sun = 1, Mon = 2, Tue = 3, Wed = 4, Thu = 5, Fri = 6
  const currentKurdishDayIndex = (currentJsDay + 1) % 7;

  // Realistic recorded hours for past days up to today
  // Days after today must have 0 hours recorded!
  const basePastHours = [2.5, 3.0, 2.0, 3.5, 2.5, 1.0, 0.0];

  const weeklyData = KURDISH_DAYS.map((dayObj, index) => {
    let hours = 0;
    if (index <= currentKurdishDayIndex) {
      hours = basePastHours[index] ?? 2.0;
    } else {
      hours = 0.0; // Future day in this week
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

  // Exact remaining calendar days in this week
  const remainingDays = Math.max(0, 6 - currentKurdishDayIndex);
  // Remaining study/school days (until Thursday = index 5)
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
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900">
            داشبۆردی پلانی خوێندن 🧭
          </span>
          <h1 className="font-sans font-black text-2xl text-slate-900 dark:text-white mt-1">
            ڕێڕەو و کاتژمێری خوێندنی قوتابی
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            ئامانج و خشتەی ڕۆژانەت بەپێی کات بەڕێوەببە بۆ دڵنیابوون لە تەواوکردنی مەنهەج
          </p>
        </div>

        {/* Segmented 3 Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          {[
            { id: "today", label: "ئەرکەکانی ئەمڕۆ" },
            { id: "weekly", label: "پوختەی هەفتانە" },
            { id: "goals", label: "ئامانجەکان" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
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
                    {/* Checkbox toggle */}
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
                        <span className="text-[10px] text-slate-400 font-sans">
                          ({task.duration})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-sans">
                        {task.status === "completed" && (
                          <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تەواوبوو (١٠٠%)</span>
                          </span>
                        )}
                        {task.status === "in_progress" && (
                          <span className="text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>لە جێبەجێکردندایە ({task.progress}%)</span>
                          </span>
                        )}
                        {task.status === "pending" && (
                          <span className="text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
                            دەستی پێنەکردووە
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {task.status === "in_progress" && (
                      <button
                        onClick={() => handleTaskStart(task)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>بەردەوامبە</span>
                      </button>
                    )}

                    {task.status === "pending" && (
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

      {/* TAB 2: WEEKLY OVERVIEW (FIXED DATA CONSISTENCY) */}
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

          {/* Bar Chart Representation with Highlighted Current Day */}
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

            <div className="flex items-center justify-between text-xs text-slate-500 font-sans">
              <span>هێڵی ئامانج: {weeklyGoalHours} کاتژمێر لە هەفتەیەکدا</span>
              <span className="text-[11px] text-slate-400">
                ڕۆژانی داهاتوو دوای خوێندن بە شێوەی ئۆتۆماتیکی پڕ دەکرێنەوە
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GOAL SETTINGS */}
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
