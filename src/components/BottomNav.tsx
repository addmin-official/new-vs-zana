import React from "react";
import { Home, MessageCircle, BookOpen, User } from "lucide-react";
import { NavItemKey } from "./Sidebar.tsx";
import { useUiStore } from "../store/uiStore.ts";

export interface BottomNavProps {
  activeTab: NavItemKey;
  onNavigate: (tab: NavItemKey) => void;
}

interface BottomNavItem {
  key: NavItemKey;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  badgeKey?: string;
}

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  {
    key: "home",
    label: "ماڵەوە",
    icon: (active) => (
      <Home
        className={`w-6 h-6 transition-all duration-200 ${
          active
            ? "fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400 scale-110 animate-bounce-subtle"
            : "text-slate-500 dark:text-slate-400 stroke-[1.8]"
        }`}
      />
    ),
  },
  {
    key: "chat",
    label: "زانا",
    badgeKey: "chat",
    icon: (active) => (
      <MessageCircle
        className={`w-6 h-6 transition-all duration-200 ${
          active
            ? "fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400 scale-110 animate-bounce-subtle"
            : "text-slate-500 dark:text-slate-400 stroke-[1.8]"
        }`}
      />
    ),
  },
  {
    key: "subjects",
    label: "بابەت",
    icon: (active) => (
      <BookOpen
        className={`w-6 h-6 transition-all duration-200 ${
          active
            ? "fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400 scale-110 animate-bounce-subtle"
            : "text-slate-500 dark:text-slate-400 stroke-[1.8]"
        }`}
      />
    ),
  },
  {
    key: "profile",
    label: "من",
    badgeKey: "profile",
    icon: (active) => (
      <User
        className={`w-6 h-6 transition-all duration-200 ${
          active
            ? "fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400 scale-110 animate-bounce-subtle"
            : "text-slate-500 dark:text-slate-400 stroke-[1.8]"
        }`}
      />
    ),
  },
];

export function BottomNav({ activeTab, onNavigate }: BottomNavProps) {
  const unreadCounts = useUiStore((state) => state.unreadCounts);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] select-none"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      dir="rtl"
      aria-label="مینیوی سەرەکی"
    >
      <div className="flex items-center justify-around h-16 px-3">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive =
            activeTab === item.key ||
            (item.key === "profile" && activeTab === "settings");
          const badgeCount = item.badgeKey ? unreadCounts[item.badgeKey] || 0 : 0;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className="relative flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] py-1 cursor-pointer transition-transform duration-100 active:scale-95 touch-manipulation"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative flex items-center justify-center">
                {item.icon(isActive)}
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center leading-none ring-2 ring-white dark:ring-slate-900 animate-in zoom-in duration-200">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </div>
              <span
                className={`font-sans text-[11px] leading-tight mt-1 transition-colors duration-150 ${
                  isActive
                    ? "font-extrabold text-indigo-600 dark:text-indigo-400"
                    : "font-medium text-slate-500 dark:text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
