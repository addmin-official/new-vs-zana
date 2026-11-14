import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { ToastItem } from "../store/appStore.ts";

export interface ToastProps {
  notifications: ToastItem[];
  onDismiss: (id: string) => void;
}

export function Toast({ notifications, onDismiss }: ToastProps) {
  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[notifications.length - 1];
    const duration = latest.duration || 4000;
    const timer = setTimeout(() => {
      onDismiss(latest.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      dir="rtl"
      aria-live="polite"
    >
      {notifications.map((item) => {
        let bgStyle = "bg-blue-50 border-blue-500 text-blue-900";
        let icon = <Info className="w-5 h-5 text-blue-600 shrink-0" />;

        if (item.type === "success") {
          bgStyle = "bg-emerald-50 border-emerald-500 text-emerald-900";
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
        } else if (item.type === "error") {
          bgStyle = "bg-red-50 border-red-500 text-red-900";
          icon = <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />;
        } else if (item.type === "warning") {
          bgStyle = "bg-amber-50 border-amber-500 text-amber-900";
          icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
        }

        return (
          <div
            key={item.id}
            role="alert"
            className={`pointer-events-auto border-r-4 rounded-xl p-4 shadow-md flex items-center justify-between gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${bgStyle}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {icon}
              <span className="font-sans text-sm font-medium leading-relaxed truncate">
                {item.message}
              </span>
            </div>
            <button
              onClick={() => onDismiss(item.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-black/5 cursor-pointer shrink-0"
              aria-label="داخستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default Toast;
