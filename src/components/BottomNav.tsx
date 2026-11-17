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
        className={`w-5 h-5 transition-transform duration-200 ${
          active
            ? "fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400 scale-105"
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
        className={`w-5 h-5 transition-transform duration-200 ${
          active
            ? "fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400 scale-105"
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
        className={`w-5 h-5 transition-transform duration-200 ${
          active
            ? "fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400 scale-105"
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
        className={`w-5 h-5 transition-transform duration-200 ${
          active
            ? "fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400 scale-105"
            : "text-slate-500 dark:text-slate-400 stroke-[1.8]"
        }`}
        aria-hidden="true"
      />
    ),
  },
];

/**
 * Intelligent hierarchical matching for active tab on mobile devices.
 * Ensures the bottom nav remains contextually highlighted when user enters sub-sections.
 */
function isTabActive(itemKey: NavItemKey, currentTab: NavItemKey): boolean {
  if (itemKey === currentTab) return true;
  if (itemKey === "home" && currentTab === "plan") return true;
  if (itemKey === "chat" && currentTab === "rooms") return true;
  if (
    itemKey === "subjects" &&
    (currentTab === "practice" ||
      currentTab === "labs" ||
      currentTab === "assessment" ||
      currentTab === "pedagogy")
  ) {
    return true;
  }
  if (
    itemKey === "profile" &&
    (currentTab === "settings" ||
      currentTab === "report" ||
      currentTab === "admin")
  ) {
    return true;
  }
  return false;
}

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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] select-none pb-safe transition-colors duration-200"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 6px)",
      }}
      dir="rtl"
      aria-label="مێنیوی سەرەکیی خوارەوە"
    >
      <div
        role="tablist"
        aria-label="بەشەکانی پلاتفۆرم"
        className="flex items-center justify-around h-[62px] px-2 max-w-md mx-auto"
      >
        {BOTTOM_NAV_ITEMS.map((item, idx) => {
          const isActive = isTabActive(item.key, activeTab);
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
              className="relative flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 cursor-pointer transition-all duration-150 active:scale-92 touch-manipulation focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-2xl group"
              aria-label={accessibleLabel}
            >
              {/* Subtle active top pill indicator */}
              {isActive && (
                <span
                  className="absolute top-0 w-8 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_1px_6px_rgba(99,102,241,0.5)] animate-in fade-in zoom-in duration-200"
                  aria-hidden="true"
                />
              )}

              {/* Icon Container with subtle active capsule */}
              <div
                className={`relative flex items-center justify-center px-3.5 py-1 rounded-xl transition-all duration-200 pointer-events-none ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/70"
                    : "group-hover:bg-slate-100 dark:group-hover:bg-slate-800/50"
                }`}
              >
                {item.icon(isActive)}

                {/* Notification Badge */}
                {badgeCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center leading-none ring-2 ring-white dark:ring-slate-900 shadow-xs animate-in zoom-in duration-200"
                    aria-hidden="true"
                  >
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </div>

              {/* Kurdish Label */}
              <span
                className={`font-sans text-[11px] leading-tight mt-0.5 transition-colors duration-150 ${
                  isActive
                    ? "font-black text-indigo-600 dark:text-indigo-400"
                    : "font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
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
