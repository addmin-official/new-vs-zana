import React, { useRef } from "react";
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
        aria-hidden="true"
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
        aria-hidden="true"
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
        aria-hidden="true"
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
        aria-hidden="true"
      />
    ),
  },
];

export function BottomNav({ activeTab, onNavigate }: BottomNavProps) {
  const unreadCounts = useUiStore((state) => state.unreadCounts);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Keyboard arrow navigation across bottom tabs (RTL friendly)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex;
    if (e.key === "ArrowLeft") {
      // In RTL, ArrowLeft moves forward to next tab
      nextIndex = (currentIndex + 1) % BOTTOM_NAV_ITEMS.length;
    } else if (e.key === "ArrowRight") {
      // In RTL, ArrowRight moves backward to previous tab
      nextIndex = (currentIndex - 1 + BOTTOM_NAV_ITEMS.length) % BOTTOM_NAV_ITEMS.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = BOTTOM_NAV_ITEMS.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextItem = BOTTOM_NAV_ITEMS[nextIndex];
    onNavigate(nextItem.key);
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] select-none pb-safe"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      dir="rtl"
      aria-label="مێنیوی سەرەکیی خوارەوە"
    >
      <div
        role="tablist"
        aria-label="بەشەکانی پلاتفۆرم"
        className="flex items-center justify-around h-16 px-2"
      >
        {BOTTOM_NAV_ITEMS.map((item, idx) => {
          const isActive =
            activeTab === item.key ||
            (item.key === "profile" && activeTab === "settings");
          const badgeCount = item.badgeKey ? unreadCounts[item.badgeKey] || 0 : 0;
          const accessibleLabel = badgeCount > 0 ? `${item.label} (${badgeCount} ئاگاداری نوێ)` : item.label;

          return (
            <button
              key={item.key}
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onNavigate(item.key)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="relative flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] py-1 cursor-pointer transition-transform duration-100 active:scale-95 touch-manipulation focus-visible:ring-3 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-2xl"
              aria-label={accessibleLabel}
            >
              <div className="relative flex items-center justify-center pointer-events-none">
                {item.icon(isActive)}
                {badgeCount > 0 && (
                  <span
                    className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center leading-none ring-2 ring-white dark:ring-slate-900 animate-in zoom-in duration-200"
                    aria-hidden="true"
                  >
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </div>
              <span
                className={`font-sans text-[11px] leading-tight mt-1 transition-colors duration-150 ${
                  isActive
                    ? "font-extrabold text-indigo-600 dark:text-indigo-400"
                    : "font-medium text-slate-600 dark:text-slate-300"
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
