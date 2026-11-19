import React from "react";
import {
  Home,
  MessageCircle,
  BookOpen,
  FlaskConical,
  Compass,
  User,
  LogIn,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Brain,
  Target,
  Dumbbell,
  Users,
  FileBarChart2,
} from "lucide-react";
import { useAppStore } from "../store/appStore.ts";
import { useUiStore } from "../store/uiStore.ts";
import { useStudentProfile } from "../features/student/useStudentProfile.ts";
import { GRADE_LABELS } from "../features/student/studentDefaults.ts";
import { useTranslation } from "../hooks/useTranslation.ts";

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
  | "settings"
  | "admin";

export interface NavItem {
  key: NavItemKey;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  path: string;
}

export const NAV_ITEMS: { key: NavItemKey; label: string; path: string }[] = [
  { key: "home", label: "ماڵەوە", path: "/" },
  { key: "chat", label: "زانا", path: "/chat" },
  { key: "subjects", label: "بابەتەکان", path: "/subjects" },
  { key: "pedagogy", label: "تاقیگەی پێداگۆجی", path: "/pedagogy" },
  { key: "practice", label: "ڕاهێنان", path: "/practice" },
  { key: "labs", label: "تاقیگەی زانستی", path: "/labs" },
  { key: "assessment", label: "هەڵسەنگاندن", path: "/assessment" },
  { key: "plan", label: "پلان", path: "/plan" },
  { key: "rooms", label: "ژوورەکان", path: "/rooms" },
  { key: "report", label: "ڕاپۆرتی باوان", path: "/report" },
  { key: "profile", label: "پرۆفایل", path: "/profile" },
];

// Full ZANA student navigation exposing all core & pedagogical destinations
export const STUDENT_NAV_ITEMS: NavItem[] = [
  {
    key: "home",
    label: "چروسکەی ڕۆژانە",
    path: "/",
    icon: (active) => (
      <Home
        className={`w-5 h-5 shrink-0 transition-transform ${
          active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
        }`}
      />
    ),
  },
  {
    key: "chat",
    label: "مامۆستا زانا",
    path: "/chat",
    icon: (active) => (
      <MessageCircle
        className={`w-5 h-5 shrink-0 transition-transform ${
          active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
        }`}
      />
    ),
  },
  {
    key: "subjects",
    label: "بابەت و پەڕتووک",
    path: "/subjects",
    icon: (active) => (
      <BookOpen
        className={`w-5 h-5 shrink-0 transition-transform ${
          active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
        }`}
      />
    ),
  },
  {
    key: "pedagogy",
    label: "تاقیگەی پێداگۆجی (٥ پایە)",
    path: "/pedagogy",
    icon: (active) => (
      <Brain
        className={`w-5 h-5 shrink-0 transition-transform ${
          active ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"
        }`}
      />
    ),
  },
  {
    key: "practice",
    label: "تاقیگەی ڕاهێنان",
    path: "/practice",
    icon: (active) => (
      <Dumbbell
        className={`w-5 h-5 shrink-0 transition-transform ${
          active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
        }`}
      />
    ),
  },
  {
    key: "labs",
    label: "تاقیگەی زانستی",
    path: "/labs",
    icon: (active) => (
      <FlaskConical
        className={`w-5 h-5 shrink-0 transition-transform ${
          active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
        }`}
      />
    ),
  },
  {
    key: "assessment",
    label: "تاقیکردنەوەی ئەداپتیڤ",
    path: "/assessment",
    icon: (active) => (
      <Target
        className={`w-5 h-5 shrink-0 transition-transform ${
          active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
        }`}
      />
    ),
  },
  {
    key: "plan",
    label: "پلانی خوێندن",
    path: "/plan",
    icon: (active) => (
      <Compass
        className={`w-5 h-5 shrink-0 transition-transform ${
          active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
        }`}
      />
    ),
  },
  {
    key: "rooms",
    label: "ژوورەکانی خوێندن",
    path: "/rooms",
    icon: (active) => (
      <Users
        className={`w-5 h-5 shrink-0 transition-transform ${
          active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
        }`}
      />
    ),
  },
  {
    key: "report",
    label: "ڕاپۆرتی باوان",
    path: "/report",
    icon: (active) => (
      <FileBarChart2
        className={`w-5 h-5 shrink-0 transition-transform ${
          active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
        }`}
      />
    ),
  },
  {
    key: "profile",
    label: "پڕۆفایل و ڕێکخستن",
    path: "/profile",
    icon: (active) => (
      <User
        className={`w-5 h-5 shrink-0 transition-transform ${
          active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
        }`}
      />
    ),
  },
];

export interface SidebarProps {
  activeTab: NavItemKey;
  onNavigate: (tab: NavItemKey) => void;
  onPrefetch?: (tab: NavItemKey) => void;
  className?: string;
  isPermanentUser?: boolean;
  onNavigateToLogin?: () => void;
  onLogout?: () => void;
}

export const Sidebar = React.memo(function Sidebar({
  activeTab,
  onNavigate,
  onPrefetch,
  className = "",
  isPermanentUser,
  onNavigateToLogin,
  onLogout,
}: SidebarProps) {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const { profile } = useStudentProfile();

  const isCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  const studentName = profile?.name || user.name || "قوتابی";
  const gradeKey = (profile?.grade || user.grade || "12") as keyof typeof GRADE_LABELS;
  const gradeLabel = GRADE_LABELS[gradeKey] || `پۆلی ${gradeKey}`;

  // Student interface strictly renders only student learning items
  const itemsToRender = [...STUDENT_NAV_ITEMS];

  return (
    <aside
      className={`bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 hidden md:flex flex-col h-full shrink-0 shadow-2xs select-none transition-all duration-200 ${
        isCollapsed ? "w-[72px] p-2" : "w-[240px] p-4"
      } ${className}`}
      dir="rtl"
      aria-label="مینیوی پەڕە"
    >
      {/* Header: Toggle & Student Badge */}
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <div className="flex items-center justify-between gap-2">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shrink-0 ring-1 ring-indigo-500/30">
                {studentName.charAt(0) || "ق"}
              </div>
              <div className="min-w-0">
                <span className="font-sans font-bold text-sm text-slate-900 dark:text-white truncate block">
                  {studentName}
                </span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block truncate">
                  {gradeLabel}
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base ring-1 ring-indigo-500/30">
              {studentName.charAt(0) || "ق"}
            </div>
          )}

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "فراوانکردنی مینیو" : "بچووککردنەوەی مینیو"}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
        {itemsToRender.map((item) => {
          const isActive =
            activeTab === item.key ||
            (item.key === "profile" && activeTab === "settings");

          const label =
            item.key === "home"
              ? t("navigation.home")
              : item.key === "chat"
              ? t("navigation.chat")
              : item.key === "labs"
              ? t("navigation.lab")
              : item.key === "plan"
              ? t("navigation.plan")
              : item.key === "profile"
              ? t("navigation.profile")
              : item.label;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              onMouseEnter={() => onPrefetch?.(item.key)}
              title={isCollapsed ? label : undefined}
              className={`w-full flex items-center gap-3 rounded-2xl transition-all duration-150 cursor-pointer min-h-[48px] touch-manipulation ${
                isCollapsed ? "justify-center px-2 py-3" : "px-3.5 py-3 text-right"
              } ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold shadow-xs border-r-3 border-indigo-600"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium"
              }`}
            >
              <div className="shrink-0">{item.icon(isActive)}</div>
              {!isCollapsed && (
                <span className="font-sans text-xs leading-none truncate">{label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer: Auth Action & Branding */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {!isPermanentUser ? (
          <button
            type="button"
            onClick={onNavigateToLogin}
            title={isCollapsed ? "چوونەژوورەوە" : undefined}
            className={`w-full flex items-center gap-2 rounded-2xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer min-h-[44px] ${
              isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"
            }`}
          >
            <LogIn className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">چوونەژوورەوە</span>}
          </button>
        ) : (
          <button
            type="button"
            onClick={onLogout}
            title={isCollapsed ? t("navigation.logout") : undefined}
            className={`w-full flex items-center gap-2 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 transition cursor-pointer min-h-[44px] ${
              isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{t("navigation.logout")}</span>}
          </button>
        )}

        {!isCollapsed && (
          <div className="text-center pt-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-sans block">
              پلاتفۆرمی زانا 🎓
            </span>
          </div>
        )}
      </div>
    </aside>
  );
});

export default Sidebar;
