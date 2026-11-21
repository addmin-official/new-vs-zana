import React, { ReactNode, useState, useEffect } from "react";
import { WifiOff, Wifi, GraduationCap } from "lucide-react";
import { Header } from "./Header.tsx";
import { Sidebar, NavItemKey } from "./Sidebar.tsx";
import { BottomNav } from "./BottomNav.tsx";
import { Toast } from "./Toast.tsx";
import { useAppStore } from "../store/appStore.ts";
import { NotificationCenter } from "./NotificationCenter.tsx";
import { AchievementToast } from "./AchievementToast.tsx";
import { notificationEngine } from "../notifications/notificationEngine.ts";
import { getFirebaseAuth } from "../services/firebase.ts";
import { useTranslation } from "../hooks/useTranslation.ts";
import { SoundToggle } from "./SoundToggle.tsx";
import { ThemeToggle } from "./ThemeToggle.tsx";
import { TrialBanner } from "./trial/TrialBanner.tsx";

export interface AppShellProps {
  children: ReactNode;
  activeTab?: NavItemKey;
  onTabChange?: (tab: NavItemKey) => void;
  onPrefetch?: (tab: NavItemKey) => void;
  pageTitle?: string;
  className?: string;
  isPermanentUser?: boolean;
  userId?: string;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
  onLogout?: () => void;
}

export function AppShell({
  children,
  activeTab = "home",
  onTabChange,
  onPrefetch,
  pageTitle,
  className = "",
  isPermanentUser,
  userId: propUserId,
  onNavigateToLogin,
  onNavigateToRegister: _onNavigateToRegister,
  onLogout,
}: AppShellProps) {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const notifications = useAppStore((state) => state.notifications);
  const removeNotification = useAppStore((state) => state.removeNotification);

  const effectiveUserId =
    propUserId ||
    (typeof window !== "undefined" && typeof getFirebaseAuth === "function"
      ? getFirebaseAuth()?.currentUser?.uid
      : null) ||
    user?.id ||
    "default-guest";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);

  useEffect(() => {
    notificationEngine.initialize(effectiveUserId);
    void notificationEngine.getUnreadCount(effectiveUserId).then((count) => {
      setUnreadNotificationsCount(count);
    });

    const unsubscribe = notificationEngine.subscribe((list) => {
      const unread = list.filter((n) => !n.isRead).length;
      setUnreadNotificationsCount(unread);
    });

    return unsubscribe;
  }, [effectiveUserId]);

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

  // Keyboard accessibility: Escape key closes mobile menu drawer
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [mobileMenuOpen]);

  const handleNav = (tab: NavItemKey) => {
    setMobileMenuOpen(false);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900 font-sans overflow-hidden" dir="rtl">
      {/* Accessible Skiplink for Screen Readers and Keyboard Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-indigo-600 focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-3 focus:ring-indigo-300 text-xs font-bold transition-transform"
      >
        بازدان بۆ ناوەڕۆکی سەرەکی
      </a>

      {/* Screen Reader ARIA-Live Announcement for Connection Status */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {!isOnline
          ? "پەیوەندی ئینتەرنێت پچڕا. ئێستا لە دۆخی دەرھێڵیت."
          : showRestoredNotice
          ? "پەیوەندی ئینتەرنێت گەڕایەوە."
          : ""}
      </div>

      {/* Toast Notifications */}
      <Toast notifications={notifications} onDismiss={removeNotification} />
      <AchievementToast />

      {/* Ambient Offline Banner */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="shrink-0 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 border-b border-amber-600 shadow-xs z-50 pt-safe"
        >
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" aria-hidden="true" />
          <span>دۆخی دەرھێڵ (Offline) • دەتوانیت سوود لە پەڕتووک و کورتە یاساکان وەربگریت؛ تۆمارەکان لە ئامێرەکەت پارێزراون.</span>
        </div>
      )}

      {/* Online Restored Toast Banner */}
      {showRestoredNotice && (
        <div
          role="status"
          aria-live="polite"
          className="shrink-0 bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 border-b border-emerald-700 shadow-xs z-50 animate-in fade-in slide-in-from-top-1 pt-safe"
        >
          <Wifi className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>پەیوەندی ئینتەرنێت گەڕایەوە! پێشکەوتنەکانت نوێ دەکرێنەوە.</span>
        </div>
      )}

      {/* Top Header */}
      <div className="shrink-0">
        <Header
          title={pageTitle || "پلاتفۆرمی زانا"}
          user={user}
          activeSubject={user.activeSubject}
          isPermanentUser={isPermanentUser}
          onNavigateToSubjects={() => handleNav("subjects")}
          onNavigateToLogin={onNavigateToLogin}
          onLogout={onLogout}
          onOpenMobileNav={() => setMobileMenuOpen(!mobileMenuOpen)}
          onOpenNotifications={() => setIsNotificationCenterOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
        />
        <TrialBanner />
      </div>

      {/* In-App Notification Center Drawer/Modal */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        unreadCount={unreadNotificationsCount}
        onUnreadCountChange={setUnreadNotificationsCount}
        userId={effectiveUserId}
        onNavigateToAction={(url) => {
          setIsNotificationCenterOpen(false);
          if (url.startsWith("/plan")) handleNav("plan");
          else if (url.startsWith("/chat")) handleNav("chat");
          else if (url.startsWith("/practice")) handleNav("practice");
          else if (url.startsWith("/profile") || url.startsWith("/settings")) handleNav("profile");
          else if (url.startsWith("/assessment")) handleNav("assessment");
          else if (url.startsWith("/subjects")) handleNav("subjects");
          else if (url.startsWith("/report")) handleNav("report");
          else if (url.startsWith("/rooms")) handleNav("rooms");
          else handleNav("home");
        }}
      />

      {/* Mobile Drawer Overlay with Focus Trap & Escape Dismissal */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 lg:hidden backdrop-blur-xs flex justify-start overscroll-contain animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="مێنیوی سەرەکی"
            className="w-72 h-full bg-white dark:bg-slate-900 shadow-2xl p-4 flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-600/20 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-sans font-bold text-base text-slate-900 dark:text-white leading-tight">
                    {t("common.appName")}
                  </span>
                  <span className="font-sans text-[10px] text-indigo-600 dark:text-indigo-400 font-medium leading-tight">
                    هاوڕێی زیرەکی فێربوونی تۆ
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <SoundToggle className="!w-8 !h-8 !rounded-lg" />
                <ThemeToggle showMenu={false} className="!w-8 !h-8 !rounded-lg" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg min-touch flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 mr-1"
                  aria-label="داخستنی مێنۆ"
                >
                  ✕
                </button>
              </div>
            </div>
            <Sidebar
              activeTab={activeTab}
              onNavigate={handleNav}
              onPrefetch={onPrefetch}
              isPermanentUser={isPermanentUser}
              onNavigateToLogin={onNavigateToLogin}
              onLogout={onLogout}
              className="!flex !w-full !border-0 !p-0 !h-auto !shadow-none"
            />
          </div>
        </div>
      )}

      {/* Body Layout: Sidebar + Main Content */}
      <div className="flex-1 min-h-0 flex w-full overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onNavigate={handleNav}
          onPrefetch={onPrefetch}
          isPermanentUser={isPermanentUser}
          onNavigateToLogin={onNavigateToLogin}
          onLogout={onLogout}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 min-h-0 flex flex-col min-w-0 ${
            activeTab === "chat" ? "pb-0 overflow-hidden" : "md:pb-8 overflow-y-auto overscroll-y-contain"
          } focus:outline-none ${className}`}
          style={{
            WebkitOverflowScrolling: "touch",
            paddingBottom: activeTab === "chat" ? 0 : "calc(5.25rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {children}
        </main>
      </div>

      {/* Bottom Nav for Mobile - hidden in Chat to give 100% space to the tutor input and keyboard */}
      {activeTab !== "chat" && (
        <BottomNav activeTab={activeTab} onNavigate={handleNav} />
      )}
    </div>
  );
}

export default AppShell;
