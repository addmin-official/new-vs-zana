import React, { useState, useEffect } from "react";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  BookOpen,
  Zap,
  Target,
  RefreshCw,
  Trophy,
  Brain,
  FileCheck,
  AlertCircle,
  ExternalLink,
  Moon,
} from "lucide-react";
import {
  NotificationItem,
  NotificationType,
  formatKurdishRelativeTime,
  isCurrentlyQuietHours,
} from "../../domain/notification.ts";
import { notificationService } from "../../services/notificationService.ts";

export interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAction?: (url: string) => void;
  unreadCount?: number;
  onUnreadCountChange?: (count: number) => void;
}

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; bg: string; text: string; label: string }
> = {
  plan_reminder: {
    icon: BookOpen,
    bg: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800",
    text: "text-indigo-600 dark:text-indigo-400",
    label: "پلانی ڕۆژانە",
  },
  next_best_action: {
    icon: Zap,
    bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
    text: "text-amber-600 dark:text-amber-400",
    label: "هەنگاوی پێشنیارکراو",
  },
  deadline_approaching: {
    icon: Target,
    bg: "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800",
    text: "text-rose-600 dark:text-rose-400",
    label: "وادەی ئامانج",
  },
  task_recovery: {
    icon: RefreshCw,
    bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "هاوسەنگکردنەوە",
  },
  mastery_achievement: {
    icon: Trophy,
    bg: "bg-amber-100/70 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700",
    text: "text-amber-700 dark:text-amber-300",
    label: "دەستکەوتی لێهاتوویی",
  },
  weak_concept_review: {
    icon: Brain,
    bg: "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
    text: "text-blue-600 dark:text-blue-400",
    label: "پێداچوونەوەی چەمک",
  },
  assessment_recommendation: {
    icon: FileCheck,
    bg: "bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800",
    text: "text-teal-600 dark:text-teal-400",
    label: "تاقیکردنەوە",
  },
  system_action_required: {
    icon: AlertCircle,
    bg: "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800",
    text: "text-purple-600 dark:text-purple-400",
    label: "ئاگاداری سیستەم",
  },
};

export function NotificationCenter({
  isOpen,
  onClose,
  onNavigateToAction,
  unreadCount: _propUnreadCount,
  onUnreadCountChange,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [isQuietHours, setIsQuietHours] = useState(false);

  useEffect(() => {
    setIsQuietHours(isCurrentlyQuietHours());
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(false);
      setNotifications(res.notifications);
      if (onUnreadCountChange) {
        onUnreadCountChange(res.unreadCount);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Keyboard navigation: Escape closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleMarkOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt || Date.now() } : n))
    );
    const unread = notifications.filter((n) => n.id !== id && !n.readAt).length;
    if (onUnreadCountChange) onUnreadCountChange(unread);
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      const now = Date.now();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || now })));
      if (onUnreadCountChange) onUnreadCountChange(0);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleAction = (item: NotificationItem) => {
    if (!item.readAt) {
      notificationService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, readAt: Date.now() } : n))
      );
    }
    onClose();
    if (item.actionUrl && onNavigateToAction) {
      onNavigateToAction(item.actionUrl);
    }
  };

  if (!isOpen) return null;

  const filtered = filter === "unread" ? notifications.filter((n) => !n.readAt) : notifications;
  const currentUnreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end sm:p-4 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-200"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-center-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 h-full sm:h-[88vh] sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="notification-center-title"
                  className="font-sans font-black text-base text-slate-900 dark:text-white leading-tight"
                >
                  ئاگادارییەکان
                </h2>
                {currentUnreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-black text-[11px]">
                    {currentUnreadCount} نوێ
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                ڕێنمایی و هەنگاوە گرنگەکان بۆ گەیشتن بە ئامانج
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
            aria-label="داخستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quiet Hours Banner */}
        {isQuietHours && (
          <div className="px-4 py-2 bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold border-b border-indigo-100 dark:border-indigo-900/40 flex items-center gap-2 shrink-0">
            <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>کاتژمێری پشوو چالاکە 🌙 • ئاگادارییەکان بە ئارامی پاشەکەوت دەکرێن.</span>
          </div>
        )}

        {/* Action & Filter Bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === "all"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              هەمووی ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === "unread"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              نەخوێندراوە ({currentUnreadCount})
            </button>
          </div>

          {/* Mark all as read button */}
          {currentUnreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={markingAll}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>هەمووی بخوێنەوە</span>
            </button>
          )}
        </div>

        {/* Notification List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>خوێندنەوەی ئاگادارییەکان...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-100 dark:border-indigo-800/80">
                <Bell className="w-7 h-7 opacity-70" />
              </div>
              <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-200">
                هیچ ئاگادارییەکی {filter === "unread" ? "نەخوێندراوە" : "نوێ"} نییە ✨
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                بە ئارامی و دڵنیاییەوە بەردەوام بە لە خوێندنەکەت. زانا کاتێک ئاگادارت دەکاتەوە کە هەنگاوێکی گرنگ هەبێت.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const conf = TYPE_CONFIG[item.type] || TYPE_CONFIG.plan_reminder;
              const IconComp = conf.icon;
              const isUnread = !item.readAt;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all text-right relative ${
                    isUnread
                      ? "bg-white dark:bg-slate-800/90 border-indigo-200 dark:border-indigo-800/80 shadow-xs"
                      : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${conf.bg} ${conf.text}`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          {conf.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">
                            {formatKurdishRelativeTime(item.createdAt)}
                          </span>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                          )}
                        </div>
                      </div>

                      <h4 className="font-sans font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-1 leading-snug">
                        {item.title}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Action Bar */}
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        {item.actionLabel ? (
                          <button
                            type="button"
                            onClick={() => handleAction(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                          >
                            <span>{item.actionLabel}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <div />
                        )}

                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkOne(item.id, e)}
                            className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded cursor-pointer transition"
                            title="نیشانەکردن وەک خوێندراوە"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>خوێندراوە</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Panel Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center shrink-0">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            پلاتفۆرمی زانا هەمیشە کاتی پشوو و تەرکیزت دەپارێزێت.
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotificationCenter;
