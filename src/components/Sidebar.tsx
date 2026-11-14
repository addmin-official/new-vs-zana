import React from "react";
import {
  Sparkles,
  MessageCircle,
  BookOpen,
  FlaskConical,
  Atom,
  Target,
  Compass,
  Users,
  FileText,
  User,
  GraduationCap,
  LogIn,
  LogOut,
} from "lucide-react";

export type NavItemKey =
  | "home"
  | "chat"
  | "subjects"
  | "practice"
  | "pedagogy"
  | "labs"
  | "assessment"
  | "plan"
  | "rooms"
  | "report"
  | "profile"
  | "settings";

export interface NavItem {
  key: NavItemKey;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "چروسکەی ڕۆژانە", icon: <Sparkles className="w-5 h-5 shrink-0 text-amber-500" />, path: "/" },
  { key: "chat", label: "گفتوگۆ و خوێندن", icon: <MessageCircle className="w-5 h-5 shrink-0" />, path: "/chat" },
  { key: "subjects", label: "بابەتەکانی خوێندن", icon: <BookOpen className="w-5 h-5 shrink-0" />, path: "/subjects" },
  { key: "practice", label: "تاقیگەی ڕاهێنان", icon: <FlaskConical className="w-5 h-5 shrink-0" />, path: "/practice" },
  { key: "labs", label: "تاقیگەی مەجازی", icon: <Atom className="w-5 h-5 shrink-0 text-emerald-600" />, path: "/labs" },
  { key: "assessment", label: "هەڵسەنگاندن", icon: <Target className="w-5 h-5 shrink-0 text-rose-500" />, path: "/assessment" },
  { key: "plan", label: "پلانی فێربوون", icon: <Compass className="w-5 h-5 shrink-0 text-indigo-500" />, path: "/plan" },
  { key: "rooms", label: "ژوورەکانی خوێندن", icon: <Users className="w-5 h-5 shrink-0 text-blue-500" />, path: "/rooms" },
  { key: "report", label: "ڕاپۆرتی سەرپەرشتیار", icon: <FileText className="w-5 h-5 shrink-0 text-teal-600" />, path: "/report" },
  { key: "profile", label: "پڕۆفایل و ڕێکخستنەکان", icon: <User className="w-5 h-5 shrink-0" />, path: "/profile" },
];

export interface SidebarProps {
  activeTab: NavItemKey;
  onNavigate: (tab: NavItemKey) => void;
  className?: string;
  isPermanentUser?: boolean;
  onNavigateToLogin?: () => void;
  onLogout?: () => void;
}

export function Sidebar({
  activeTab,
  onNavigate,
  className = "",
  isPermanentUser,
  onNavigateToLogin,
  onLogout,
}: SidebarProps) {
  return (
    <aside
      className={`w-[280px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 hidden lg:flex flex-col h-full p-4 shrink-0 shadow-2xs overflow-y-auto ${className}`}
      dir="rtl"
    >
      {/* Featured Pedagogical Excellence Hub Button */}
      <div className="mb-3">
        <button
          onClick={() => onNavigate("pedagogy")}
          className={`w-full p-3 rounded-2xl border transition-all cursor-pointer text-right flex items-center justify-between ${
            activeTab === "pedagogy"
              ? "bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border-amber-500/60 text-amber-900 dark:text-amber-200 shadow-xs"
              : "bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black block leading-tight">تاقیگەی پێداگۆجی</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">٥ پایەی فێربوونی قووڵ</span>
            </div>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
            نوێ
          </span>
        </button>
      </div>

      <div className="space-y-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            activeTab === item.key ||
            (activeTab === "settings" && item.key === "profile");
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all cursor-pointer text-right ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold border-r-3 border-indigo-600 shadow-2xs"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
              }`}
            >
              <span className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}>
                {item.icon}
              </span>
              <span className="font-sans text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Auth Action Button */}
      <div className="pt-3 pb-1 border-t border-slate-100 dark:border-slate-800">
        {!isPermanentUser ? (
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer shadow-2xs"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span>چوونەژوورەوە بە هەژمار</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>چوونەدەرەوە لە هەژمار</span>
          </button>
        )}
      </div>

      {/* Footer Branding in Sidebar */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
        <p className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200">پلاتفۆرمی زانا 🎓</p>
        <p className="font-sans text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">پڕۆگرامی فەرمی پۆلەکانی ٩ تا ١٢</p>
      </div>
    </aside>
  );
}

export default Sidebar;

