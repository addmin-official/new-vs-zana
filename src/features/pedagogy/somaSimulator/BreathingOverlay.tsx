import React, { useState, useEffect } from 'react';
import { Wind, Heart, X } from 'lucide-react';

interface BreathingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

type BreathPhase = 'INHALE' | 'HOLD' | 'EXHALE';

export const BreathingOverlay: React.FC<BreathingOverlayProps> = ({ isOpen, onClose }) => {
  const [phase, setPhase] = useState<BreathPhase>('INHALE');
  const [secondsLeft, setSecondsLeft] = useState<number>(4);
  const [cycleCount, setCycleCount] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (phase === 'INHALE') {
            setPhase('HOLD');
            return 7;
          } else if (phase === 'HOLD') {
            setPhase('EXHALE');
            return 8;
          } else {
            setPhase('INHALE');
            setCycleCount((c) => c + 1);
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, phase]);

  if (!isOpen) return null;

  const phaseConfig = {
    INHALE: {
      text: 'هەڵمژین بە هێمنی (Inhale)',
      desc: 'هەناسەیەکی قووڵ لە لووتتەوە هەڵمژە',
      scale: 'scale-125',
      color: 'from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-500/30'
    },
    HOLD: {
      text: 'ڕاگرتنی هەناسە (Hold)',
      desc: 'هەناسەکەت بە ئارامی ڕابگرە و پشوو بە مێشکت بدە',
      scale: 'scale-110',
      color: 'from-indigo-400 to-purple-500',
      shadow: 'shadow-indigo-500/30'
    },
    EXHALE: {
      text: 'دانەوەی هەناسە (Exhale)',
      desc: 'لە دەمتەوە بە هێواشی تەواوی هەواکە بدەرەوە',
      scale: 'scale-90',
      color: 'from-amber-400 to-rose-500',
      shadow: 'shadow-amber-500/30'
    }
  };

  const current = phaseConfig[phase];

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center relative shadow-2xl flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Wind className="w-5 h-5 text-indigo-500" />
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            ڕاهێنانی هەناسەدانی ٤-٧-٨
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          کەمکردنەوەی لێدانی دڵ و نەهێشتنی دڵەڕاوکێی تاقیکردنەوەی وەزاری
        </p>

        {/* Breathing Orb */}
        <div className="relative my-6 flex items-center justify-center w-48 h-48">
          <div
            className={`w-36 h-36 rounded-full bg-gradient-to-br ${current.color} shadow-2xl ${current.shadow} flex flex-col items-center justify-center text-white transition-all duration-1000 ease-in-out ${current.scale}`}
          >
            <Heart className="w-6 h-6 animate-pulse mb-1 text-white/90" />
            <span className="text-3xl font-black">{secondsLeft}</span>
            <span className="text-[10px] font-bold text-white/80">چرکە</span>
          </div>
        </div>

        {/* Instruction */}
        <div className="space-y-1 my-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {current.text}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {current.desc}
          </p>
        </div>

        <div className="flex items-center justify-between w-full mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>خولگەی تەواوکراو: {cycleCount}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition"
          >
            گەڕانەوە بۆ تاقیکردنەوە
          </button>
        </div>
      </div>
    </div>
  );
};
