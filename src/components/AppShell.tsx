import { ReactNode } from "react";
import { ZanaHeader } from "./ZanaHeader.tsx";
import { BottomNavigation, NavTab } from "./BottomNavigation.tsx";
import { StudentProfile } from "../services/storage.ts";
import { WifiOff } from "lucide-react";

interface AppShellProps {
  children: ReactNode;
  profile: StudentProfile;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isOfflineFallback?: boolean;
  authError?: string | null;
}

export function AppShell({ children, profile, activeTab, onTabChange, isOfflineFallback, authError }: AppShellProps) {
  const showNav = profile.onboardingCompleted;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors">
      {/* Top Header */}
      <ZanaHeader profile={profile} />

      {/* Offline Fallback Banner */}
      {isOfflineFallback && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-100 dark:border-amber-900 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs font-sans flex items-center gap-2 max-w-md mx-auto w-full mt-2 rounded-lg shadow-xs">
          <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-right" dir="rtl">
              دۆخی دەرەوەی هێڵی سنووردار چالاكە
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 text-right" dir="rtl">
              هێڵ یان ناسنامەی ناوخۆیی سنووردارە. داتاکان لەسەر سێرڤەر پاشەکەوت ناکرێن.
            </p>
            {authError && (
              <p className="text-[9px] text-amber-700/80 dark:text-amber-400/80 mt-1 font-mono text-left break-all">
                Detail: {authError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className={`flex-1 w-full ${activeTab === "practice" || activeTab === "rooms" ? "max-w-xl" : "max-w-md"} mx-auto px-4 pt-4 ${showNav ? "pb-24" : "pb-6"} flex flex-col`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showNav && (
        <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
      )}
    </div>
  );
}
