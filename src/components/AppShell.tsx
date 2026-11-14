import React, { ReactNode, useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { Header } from "./Header.tsx";
import { Sidebar, NavItemKey } from "./Sidebar.tsx";
import { BottomNav } from "./BottomNav.tsx";
import { Toast } from "./Toast.tsx";
import { useAppStore } from "../store/appStore.ts";

export interface AppShellProps {
  children: ReactNode;
  activeTab?: NavItemKey;
  onTabChange?: (tab: NavItemKey) => void;
  pageTitle?: string;
  className?: string;
}

export function AppShell({
  children,
  activeTab = "home",
  onTabChange,
  pageTitle,
  className = "",
}: AppShellProps) {
  const user = useAppStore((state) => state.user);
  const notifications = useAppStore((state) => state.notifications);
  const removeNotification = useAppStore((state) => state.removeNotification);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredNotice(true);
      const timer = setTimeout(() => setShowRestoredNotice(false), 3500);
      return () => clearTimeout(timer);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredNotice(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleNav = (tab: NavItemKey) => {
    setMobileMenuOpen(false);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900 font-sans overflow-hidden" dir="rtl">
      {/* Toast Notifications */}
      <Toast notifications={notifications} onDismiss={removeNotification} />

      {/* Ambient Offline Banner */}
      {!isOnline && (
        <div className="shrink-0 bg-amber-500/90 text-slate-950 px-4 py-1.5 text-xs font-bold text-center flex items-center justify-center gap-2 border-b border-amber-600/40 shadow-xs z-50">
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>دۆخی دەرھێڵ (Offline) • دەتوانیت سوود لە پەڕتووک و کورتە یاساکان وەربگریت؛ تۆمارەکان لە ئامێرەکەت هەڵگیراون.</span>
        </div>
      )}

      {/* Online Restored Toast Banner */}
      {showRestoredNotice && (
        <div className="shrink-0 bg-emerald-600 text-white px-4 py-1.5 text-xs font-bold text-center flex items-center justify-center gap-2 border-b border-emerald-700 shadow-xs z-50 animate-in fade-in slide-in-from-top-1">
          <Wifi className="w-4 h-4 shrink-0" />
          <span>پەیوەندی ئینتەرنێت گەڕایەوە! پێشکەوتنەکانت نوێ دەکرێنەوە.</span>
        </div>
      )}

      {/* Top Header */}
      <div className="shrink-0">
        <Header
          title={pageTitle || "پلاتفۆرمی زانا"}
          user={user}
          activeSubject={user.activeSubject}
          onNavigateToSubjects={() => handleNav("subjects")}
          onOpenMobileNav={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden backdrop-blur-xs flex justify-start"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 h-full bg-white dark:bg-slate-900 shadow-2xl p-4 flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-2">
              <span className="font-sans font-bold text-base text-slate-900 dark:text-white">مینیوی سەرەکی</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <Sidebar activeTab={activeTab} onNavigate={handleNav} className="!flex !w-full !border-0 !p-0 !h-auto !shadow-none" />
          </div>
        </div>
      )}

      {/* Body Layout: Sidebar + Main Content */}
      <div className="flex-1 min-h-0 flex w-full overflow-hidden">
        <Sidebar activeTab={activeTab} onNavigate={handleNav} />

        <main
          className={`flex-1 min-h-0 flex flex-col min-w-0 pb-6 lg:pb-8 overflow-y-auto overscroll-y-contain ${className}`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </main>
      </div>

      {/* Bottom Nav for Mobile */}
      <BottomNav activeTab={activeTab} onNavigate={handleNav} />
    </div>
  );
}

export default AppShell;
