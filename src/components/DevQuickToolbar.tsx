import { useState } from "react";
import {
  Wrench,
  X,
  Compass,
  Sparkles,
  User,
  Volume2,
  RotateCcw,
  GraduationCap,
} from "lucide-react";
import { NavItemKey } from "./Sidebar.tsx";
import { useAppStore } from "../store/appStore.ts";
import { useSoundEffects } from "../hooks/useSoundEffects.ts";

export interface DevQuickToolbarProps {
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  onTriggerOnboarding: () => void;
  onLogout: () => void;
}

export function DevQuickToolbar({
  activeTab,
  onSelectTab,
  onTriggerOnboarding,
  onLogout,
}: DevQuickToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const { playSuccess, playError, playTutorResponse, playCompletion, playInteraction } = useSoundEffects();

  const screens: { key: NavItemKey; label: string; icon: string }[] = [
    { key: "home", label: "سەرەکی (Home)", icon: "🌟" },
    { key: "chat", label: "چات و وۆرکسپەیس (Chat)", icon: "💬" },
    { key: "subjects", label: "مەنهەج (Subjects)", icon: "📚" },
    { key: "practice", label: "ڕاهێنان (Practice)", icon: "🧪" },
    { key: "labs", label: "تاقیگەی زانستی (Labs)", icon: "🔬" },
    { key: "assessment", label: "تاقیکردنەوە (Assessment)", icon: "📝" },
    { key: "plan", label: "پلان (Study Path)", icon: "🧭" },
    { key: "rooms", label: "ژوورەکان (Rooms)", icon: "👥" },
    { key: "report", label: "باوان (Parent Report)", icon: "📊" },
    { key: "profile", label: "پڕۆفایل (Profile)", icon: "👤" },
  ];

  const applyStudentPreset = (preset: "g12_sci" | "g11_lit" | "g9_gen") => {
    if (preset === "g12_sci") {
      setUser({
        id: "student-g12-sci",
        name: "ئامەد کاروان (پۆلی ١٢ زانستی)",
        email: "amed.karwan@example.com",
        grade: "12",
        stream: "scientific",
        streakDays: 7,
        completedLessons: 24,
        totalScore: 1250,
      });
      playSuccess();
    } else if (preset === "g11_lit") {
      setUser({
        id: "student-g11-lit",
        name: "ڕۆژین جەمال (پۆلی ١١ وێژەیی)",
        email: "rozhin.jamal@example.com",
        grade: "11",
        stream: "literary",
        streakDays: 4,
        completedLessons: 12,
        totalScore: 780,
      });
      playSuccess();
    } else if (preset === "g9_gen") {
      setUser({
        id: "student-g9-gen",
        name: "سۆران ئازاد (پۆلی ٩ی بنەڕەتی)",
        email: "soran.azad@example.com",
        grade: "9",
        stream: "general",
        streakDays: 3,
        completedLessons: 8,
        totalScore: 450,
      });
      playSuccess();
    }
  };

  return (
    <>
      {/* Floating Toggle Pill (Always accessible at bottom-left corner) */}
      <div className="fixed bottom-5 left-5 z-40" dir="rtl">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 text-white px-3.5 py-2 rounded-full shadow-lg border border-slate-700 text-xs font-sans font-bold cursor-pointer transition-all hover:scale-105 active:scale-95"
          aria-label="کردنەوەی دۆخی پەرەپێدەر و تاقیگە"
        >
          <Wrench className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>تاقیگەی گەشەپێدەر</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        </button>
      </div>

      {/* Developer Modal / Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-6"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm text-slate-900">
                    تاقیگەی خێرای پەرەپێدەر
                  </h3>
                  <p className="font-sans text-[11px] text-slate-500">
                    ئاسانکاری تاقیکردنەوە و بازدانی خێرا لە نێوان سەرجەم بەشەکاندا
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition"
                aria-label="داخستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Fast Screen Navigation */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>بازدانی ڕاستەوخۆ بۆ پەڕەکان:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {screens.map((s) => {
                  const isActive = activeTab === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        onSelectTab(s.key);
                        playInteraction();
                        setIsOpen(false);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-sans font-medium text-right flex items-center gap-1.5 transition border cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80"
                      }`}
                    >
                      <span>{s.icon}</span>
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Onboarding Launcher */}
            <div className="space-y-2 p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-900 font-sans">
                    پڕۆسەی ناساندنی ٧ هەنگاوی قوتابی
                  </span>
                </div>
                <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-bold">
                  ٧ قۆناغ
                </span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed font-sans">
                دەتوانیت پڕۆسەی ناساندنی ٧ هەنگاوی قوتابی (ناو، پۆل، لق، بابەت، و ئاست) لە سەرەتاوە بە تەواوی تاقی بکەیتەوە:
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onTriggerOnboarding();
                }}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-sans transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>دەستپێکردنەوەی ٧ هەنگاوی ناساندن لە سەرەتاوە</span>
              </button>
            </div>

            {/* 3. Instant Student Persona Switcher */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <User className="w-4 h-4 text-indigo-600" />
                <span>گۆڕینی پڕۆفایلی نموونەیی قوتابیان:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyStudentPreset("g12_sci")}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 text-right space-y-1 transition cursor-pointer"
                >
                  <p className="text-xs font-bold text-slate-800">پۆلی ١٢ زانستی</p>
                  <p className="text-[10px] text-slate-500">ئامەد • کیمیا • نمرە: 72%</p>
                </button>
                <button
                  type="button"
                  onClick={() => applyStudentPreset("g11_lit")}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 text-right space-y-1 transition cursor-pointer"
                >
                  <p className="text-xs font-bold text-slate-800">پۆلی ١١ وێژەیی</p>
                  <p className="text-[10px] text-slate-500">ڕۆژین • مێژوو • نمرە: 48%</p>
                </button>
                <button
                  type="button"
                  onClick={() => applyStudentPreset("g9_gen")}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 text-right space-y-1 transition cursor-pointer"
                >
                  <p className="text-xs font-bold text-slate-800">پۆلی ٩ گشتی</p>
                  <p className="text-[10px] text-slate-500">سۆران • زانست • بنەڕەتی</p>
                </button>
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                قوتابی چالاک: <strong className="text-slate-800">{user.name}</strong> (پۆلی {user.grade} - {user.stream})
              </div>
            </div>

            {/* 4. Sound Effects Testing Sandbox */}
            <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>تاقیکردنەوەی خێرای دەنگەکانی سیستەم:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => playSuccess()}
                  className="py-1.5 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold transition cursor-pointer"
                >
                  سەرکەوتن ✨
                </button>
                <button
                  type="button"
                  onClick={() => playError()}
                  className="py-1.5 px-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[11px] font-bold transition cursor-pointer"
                >
                  هەڵە ⚠️
                </button>
                <button
                  type="button"
                  onClick={() => playTutorResponse()}
                  className="py-1.5 px-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg text-[11px] font-bold transition cursor-pointer"
                >
                  وەڵامی زانا 💬
                </button>
                <button
                  type="button"
                  onClick={() => playCompletion()}
                  className="py-1.5 px-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[11px] font-bold transition cursor-pointer"
                >
                  پۆمۆدۆرۆ 🔔
                </button>
              </div>
            </div>

            {/* 5. Footer Session Reset */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>وەشانی نوێی زانا v2.0 •</span>
                <a
                  href="https://zana.idggov.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="font-mono text-indigo-600 hover:underline inline-flex items-center gap-1"
                >
                  <code>zana.idggov.tech</code>
                </a>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                aria-label="چوونەدەرەوە و ڕیسێتکردنی دانیشتن"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>چوونەدەرەوە و ڕیسێت</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
