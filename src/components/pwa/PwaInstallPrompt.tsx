/**
 * ZANA Platform - PWA Install Prompt Component (Kurdish)
 * Displays a non-intrusive install prompt banner when the browser triggers beforeinstallprompt.
 */

import React, { useState, useEffect } from "react";
import { Download, X, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export const PwaInstallPrompt: React.FC = React.memo(function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user dismissed previously
      if (typeof window !== "undefined") {
        const dismissed = sessionStorage.getItem("zana_pwa_dismissed");
        if (dismissed !== "true") {
          setIsVisible(true);
        }
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsVisible(false);
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      console.log("[PWA] User accepted install");
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("zana_pwa_dismissed", "true");
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl border border-indigo-500/30 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300"
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-white">داگرتنی بەرنامەی زانا</h4>
          <p className="text-[11px] text-slate-300">
            بۆ بەکارهێنانی خێراتر و خوێندنی ئۆفلاین دایبەزێنە
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstall}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>دابەزاندن</span>
        </button>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          aria-label="داخستن"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
