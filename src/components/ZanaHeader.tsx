import { GraduationCap, Award, Cpu } from "lucide-react";
import { StudentProfile } from "../services/storage.ts";
import { LEVEL_LABELS } from "../features/student/studentDefaults.ts";
import { StudentLevel } from "../features/student/studentTypes.ts";
import { ThemeToggle } from "./ThemeToggle.tsx";
import { SoundToggle } from "./SoundToggle.tsx";
import { useIsAdmin } from "../hooks/useIsAdmin.ts";

interface ZanaHeaderProps {
  profile: StudentProfile;
  onOpenBrain?: () => void;
  isBrainActive?: boolean;
}

export function ZanaHeader({ profile, onOpenBrain, isBrainActive }: ZanaHeaderProps) {
  const { isAdmin } = useIsAdmin();

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 shadow-xs transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight">
              زانا
            </h1>
            <p className="font-sans text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              هاوڕێی زیرەکی فێربوونی تۆ
            </p>
          </div>
        </div>

        {/* Right side: Brain Button (Admin Only), Sound Toggle, Theme Toggle & Student Mini Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isAdmin && onOpenBrain && (
            <button
              type="button"
              onClick={onOpenBrain}
              title="مێشکی ناوخۆی پۆرتاڵ (Internal Brain Service)"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                isBrainActive
                  ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span className="text-[11px] font-bold">مێشک</span>
            </button>
          )}

          <SoundToggle />
          <ThemeToggle showMenu={true} />

          {profile.onboardingCompleted && (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 rounded-lg px-2.5 py-1">
              <Award className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-right">
                <p className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
                  {profile.name}
                </p>
                <p className="font-sans text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  پۆلی {profile.grade} • {LEVEL_LABELS[profile.level as StudentLevel] || profile.level}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

