import React, { useState, useEffect, useCallback, useRef } from "react";
import { Star, X, Sparkles } from "lucide-react";
import {
  UnlockedAchievement,
  onAchievementUnlocked,
} from "../gamification/achievementEngine.ts";

export interface AchievementToastProps {
  onTapAchievement?: (achievement: UnlockedAchievement) => void;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
}

function generateConfetti(): ConfettiParticle[] {
  const colors = ["#F59E0B", "#10B981", "#6366F1", "#EC4899", "#3B82F6", "#8B5CF6"];
  return Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 200,
    y: -(Math.random() * 120 + 40),
    color: colors[i % colors.length],
    size: Math.random() * 6 + 4,
    delay: Math.random() * 0.2,
  }));
}

export function AchievementToast({ onTapAchievement }: AchievementToastProps = {}) {
  const [queue, setQueue] = useState<UnlockedAchievement[]>([]);
  const [current, setCurrent] = useState<UnlockedAchievement | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<UnlockedAchievement | null>(null);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const isTransitioningRef = useRef(false);

  // Subscribe to achievement unlock events
  useEffect(() => {
    const unsubscribe = onAchievementUnlocked((achievement) => {
      setQueue((prev) => [...prev, achievement]);
    });
    return unsubscribe;
  }, []);

  const dismissCurrent = useCallback(() => {
    setCurrent(null);
    setConfetti([]);
    isTransitioningRef.current = true;

    // 1.5 second gap before showing next toast in queue
    setTimeout(() => {
      isTransitioningRef.current = false;
      // Re-trigger queue check
      setQueue((prev) => [...prev]);
    }, 1500);
  }, []);

  // Process queue item with 1.5s gap between toasts
  useEffect(() => {
    if (current || queue.length === 0 || isTransitioningRef.current) return;

    const nextAchievement = queue[0];
    setQueue((prev) => prev.slice(1));
    setCurrent(nextAchievement);

    if (nextAchievement.hasConfetti || nextAchievement.category === "mastery") {
      setConfetti(generateConfetti());
    } else {
      setConfetti([]);
    }

    // Auto-dismiss after 4 seconds
    const dismissTimer = setTimeout(() => {
      dismissCurrent();
    }, 4000);

    return () => clearTimeout(dismissTimer);
  }, [queue, current, dismissCurrent]);

  const handleToastClick = () => {
    if (current) {
      if (onTapAchievement) {
        onTapAchievement(current);
      } else {
        setSelectedDetail(current);
      }
    }
  };

  return (
    <>
      {/* Toast Notification Container */}
      {current && (
        <div
          dir="rtl"
          className="fixed top-4 inset-x-3 max-w-sm mx-auto sm:top-auto sm:bottom-6 sm:right-6 sm:left-auto z-50 pointer-events-auto"
        >
          {/* Confetti Burst */}
          {confetti.length > 0 && (
            <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
              {confetti.map((p) => (
                <span
                  key={p.id}
                  className="absolute rounded-full animate-out fade-out"
                  style={{
                    backgroundColor: p.color,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    transform: `translate(${p.x}px, ${p.y}px)`,
                    transition: `transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ${p.delay}s, opacity 0.8s ease-out ${p.delay}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Achievement Card */}
          <div
            onClick={handleToastClick}
            role="status"
            aria-live="polite"
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-[1.5px] shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] animate-in slide-in-from-top-4 sm:slide-in-from-bottom-4 duration-300"
          >
            <div className="rounded-[15px] bg-white dark:bg-slate-900 p-4 transition-colors">
              <div className="flex items-start gap-3.5">
                {/* Achievement Badge Icon */}
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/80 text-2xl shadow-inner border border-amber-200 dark:border-amber-800">
                  <span className="select-none animate-bounce">{current.icon || "🏆"}</span>
                  <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white">
                    <Sparkles className="h-2.5 w-2.5" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-sans text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      🏆 دەستکەوتی نوێ!
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissCurrent();
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      aria-label="داخستن"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-sans text-sm font-black text-slate-900 dark:text-white leading-tight truncate mt-0.5">
                    {current.title}
                  </h4>

                  <div className="mt-1.5 flex items-center gap-1.5 font-sans text-xs font-black text-amber-600 dark:text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>+{current.xpReward} XP</span>
                  </div>
                </div>
              </div>

              {/* Progress dismiss bar */}
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full bg-amber-500 rounded-full animate-out slide-out-to-right duration-4000 ease-linear" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Detail Modal when tapped */}
      {selectedDetail && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setSelectedDetail(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-4xl shadow-inner border border-amber-200 dark:border-amber-800 mb-4">
              {selectedDetail.icon}
            </div>

            <span className="inline-block rounded-full bg-amber-100 dark:bg-amber-950/80 px-3 py-1 font-sans text-xs font-bold text-amber-700 dark:text-amber-300 mb-2">
              دەستکەوتی بەدەستهاتوو 🏆
            </span>

            <h3 className="font-sans text-lg font-black text-slate-900 dark:text-white mb-2">
              {selectedDetail.title}
            </h3>

            <p className="font-sans text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {selectedDetail.description}
            </p>

            <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 p-3 mb-6 border border-amber-200 dark:border-amber-900">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="font-sans text-base font-black text-amber-700 dark:text-amber-300">
                +{selectedDetail.xpReward} XP پاداشتی فێربوون
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDetail(null)}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 font-sans text-sm font-bold text-white shadow-md transition cursor-pointer"
            >
              دەستخۆش، بەردەوامبە 👏
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AchievementToast;
