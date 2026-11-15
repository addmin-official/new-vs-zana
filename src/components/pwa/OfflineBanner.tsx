/**
 * ZANA Platform - Offline Indicator Banner (Kurdish)
 * Displays a subtle non-blocking status banner when the internet connection is lost.
 */

import React, { useState, useEffect } from "react";
import { WifiOff, CheckCircle2 } from "lucide-react";
import { swManager } from "../../serviceWorker.ts";

export const OfflineBanner: React.FC = React.memo(function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);

  useEffect(() => {
    const unsubscribe = swManager.subscribe((state) => {
      setIsOnline((prev) => {
        if (!prev && state.isOnline) {
          // Connection just restored
          setShowRestoredNotice(true);
          setTimeout(() => setShowRestoredNotice(false), 3000);
        }
        return state.isOnline;
      });
    });

    return () => unsubscribe();
  }, []);

  if (isOnline && !showRestoredNotice) return null;

  if (showRestoredNotice) {
    return (
      <div
        className="w-full bg-emerald-600 text-white text-xs font-bold py-1 px-4 text-center flex items-center justify-center gap-1.5 transition-all duration-300"
        dir="rtl"
        role="status"
      >
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>پەیوەندی ئینتەرنێت گەڕایەوە. داتاکان هاوکات دەکرێنەوە.</span>
      </div>
    );
  }

  return (
    <div
      className="w-full bg-amber-500 text-slate-950 text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-sm transition-all duration-300"
      dir="rtl"
      role="alert"
    >
      <WifiOff className="w-4 h-4 shrink-0 text-slate-900" />
      <span>پەیوەندی ئینتەرنێت پچڕاوە. دۆخی ئۆفلاین کارایە و بەرەوپێشچوونەکانت پارێزراون.</span>
    </div>
  );
});
