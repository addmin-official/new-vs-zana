import React from "react";
import { User, Menu, Cpu, Award, ArrowLeftRight, LogIn, LogOut, Bell, GraduationCap } from "lucide-react";
import { UserProfile } from "../store/appStore.ts";
import { SoundToggle } from "./SoundToggle.tsx";
import { ThemeToggle } from "./ThemeToggle.tsx";
import { useIsAdmin } from "../hooks/useIsAdmin.ts";

export const SUBJECT_HEADER_METADATA: Record<string, { label: string; icon: string }> = {
  chemistry: { label: "کیمیا", icon: "⚗️" },
  physics: { label: "فیزیا", icon: "⚡" },
  math: { label: "بیرکاری", icon: "📐" },
  biology: { label: "زیندەزانی", icon: "🧬" },
  english: { label: "ئینگلیزی", icon: "📖" },
  kurdish: { label: "زمان و ئەدەبی کوردی", icon: "📚" },
  arabic: { label: "زمانی عەرەبی", icon: "📜" },
  sports: { label: "پەروەردەی وەرزشی", icon: "⚽" },
  history: { label: "مێژوو", icon: "🏛️" },
  economy: { label: "ئابووری", icon: "📊" },
  geography: { label: "جوگرافیا", icon: "🌍" },
};

export interface HeaderProps {
  title?: string;
  user: UserProfile;
  activeSubject?: string;
  isPermanentUser?: boolean;
  onNavigateToSubjects?: () => void;
  onNavigateToLogin?: () => void;
  onLogout?: () => void;
  onOpenMobileNav?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  onOpenBrain?: () => void;
}

export function Header({
  title = "پلاتفۆرمی زانا",
  user,
  activeSubject,
  isPermanentUser,
  onNavigateToSubjects,
  onNavigateToLogin,
  onLogout,
  onOpenMobileNav,
  onOpenNotifications,
  unreadNotificationsCount,
  onOpenBrain,
}: HeaderProps) {
  const { isAdmin } = useIsAdmin();

  const handleOpenBrain = () => {
    if (onOpenBrain) {
      onOpenBrain();
    } else {
      window.history.pushState(null, "", "/admin/brain");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };
  const effSubj = (activeSubject || user.activeSubject || "chemistry").toLowerCase();
  const currentSubjectMeta = SUBJECT_HEADER_METADATA[effSubj] || {
    label: effSubj,
    icon: "📚",
  };

  return (
    <header
      className="min-h-[58px] sm:min-h-[60px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-2.5 sm:px-6 flex items-center justify-between shadow-2xs transition-colors duration-200"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
      dir="rtl"
    >
      {/* Original ZANA Logo & Brand */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {onOpenMobileNav && (
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:scale-95 transition"
            aria-label="کردنەوەی مینیو"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-600/20 shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
              زانا
            </span>
            <p className="hidden sm:block font-sans text-[11px] text-indigo-600 dark:text-indigo-400 font-medium leading-tight">
              هاوڕێی زیرەکی فێربوونی تۆ
            </p>
          </div>
        </div>
      </div>

      {/* Center: Page Title & Prominent Active Subject Pill */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-4 flex-1 min-w-0 px-1 sm:px-4">
        <h1 className="font-sans font-bold text-xs sm:text-base text-slate-800 dark:text-slate-100 truncate max-w-[85px] sm:max-w-xs">
          {title}
        </h1>

        {/* Prominent Active Subject & Change Button */}
        {onNavigateToSubjects && (
          <button
            type="button"
            onClick={onNavigateToSubjects}
            title="گۆڕینی وانە (کلیک بکە بۆ هەڵبژاردنی وانەی تر لە مەنهەج)"
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 transition-all shadow-2xs cursor-pointer group shrink-0 active:scale-95"
          >
            <span className="text-sm sm:text-base">{currentSubjectMeta.icon}</span>
            <div className="text-right hidden sm:block">
              <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold block leading-none">وانە:</span>
              <span className="text-xs font-black text-slate-900 dark:text-white leading-tight block">
                {currentSubjectMeta.label}
              </span>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white sm:hidden max-w-[65px] truncate">
              {currentSubjectMeta.label}
            </span>
            <span className="mr-0.5 sm:mr-1 px-1 sm:px-2 py-0.5 rounded-lg bg-indigo-600 group-hover:bg-indigo-700 text-white font-bold text-[10px] sm:text-[11px] flex items-center gap-1 transition shadow-xs">
              <span className="hidden sm:inline">گۆڕین</span>
              <ArrowLeftRight className="w-3 h-3" />
            </span>
          </button>
        )}
      </div>

      {/* User Actions: Admin Brain + Theme + Sound + Student Mini Badge + Avatar */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenBrain}
            title="مێشکی زیرەکی ناوخۆی پلاتفۆرم"
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 active:scale-95"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline text-[11px]">مێشک</span>
          </button>
        )}

        {/* Toggles: Desktop & Tablet visible; on mobile drawer */}
        <div className="hidden sm:flex items-center gap-1.5">
          <SoundToggle className="!w-9 !h-9 !rounded-lg" />
          <ThemeToggle showMenu={false} className="!w-9 !h-9 !rounded-lg" />
        </div>

        {/* Notifications Bell */}
        {onOpenNotifications && (
          <button
            type="button"
            onClick={onOpenNotifications}
            title="ئاگادارییەکان"
            aria-label="ئاگادارییەکان"
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
          >
            <Bell className="w-4 h-4" />
            {typeof unreadNotificationsCount === "number" && unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white font-sans font-black text-[10px] flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs animate-in zoom-in-75">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </button>
        )}

        {/* Student Mini Badge */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl px-2.5 py-1">
          <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-right">
            <p className="font-sans text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-none truncate max-w-[80px]">
              {user.name}
            </p>
            <p className="font-sans text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
              پۆلی {user.grade} • {user.stream === "scientific" ? "زانستی" : "وێژەیی (بەمنزیکانە ⏳)"}
            </p>
          </div>
        </div>

        {/* Auth Button or User Avatar */}
        {!isPermanentUser ? (
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
            title="چوونەژوورەوە بە هەژمار"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>چوونەژوورەوە</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 pr-1.5">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-indigo-600 dark:border-indigo-400"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-200 dark:border-indigo-800">
                <User className="w-4 h-4" />
              </div>
            )}
            <span className="font-sans text-xs font-bold text-slate-800 dark:text-slate-100 hidden md:inline truncate max-w-[100px]">
              {user.name}
            </span>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="چوونەدەرەوە لە هەژمار"
                className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;

