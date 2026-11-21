import React, { useState, useEffect, useMemo } from "react";
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Trophy,
  Flame,
  Calendar,
  BookOpen,
  RefreshCw,
  ChevronLeft,
  Inbox,
} from "lucide-react";
import {
  InAppNotification,
  InAppNotificationType,
  notificationEngine,
  formatKurdishTimestamp,
} from "../notifications/notificationEngine.ts";
import { useAppStore } from "../store/appStore.ts";
import { getFirebaseAuth } from "../services/firebase.ts";

export interface NotificationCenterProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateToAction?: (url: string) => void;
  unreadCount?: number;
  onUnreadCountChange?: (count: number) => void;
  userId?: string;
  showTriggerButton?: boolean;
  className?: string;
}

const TYPE_METADATA: Record<
  InAppNotificationType,
  { icon: React.ComponentType<{ className?: string }>; bg: string; text: string; label: string }
> = {
  achievement_unlocked: {
    icon: Trophy,
    bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
    text: "text-amber-600 dark:text-amber-400",
    label: "دەستکەوت",
  },
  streak_milestone: {
    icon: Flame,
    bg: "bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800",
    text: "text-orange-600 dark:text-orange-400",
    label: "زنجیرەی بەردەوامی",
  },
  weekly_summary: {
    icon: Calendar,
    bg: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800",
    text: "text-indigo-600 dark:text-indigo-400",
    label: "پوختەی هەفتە",
  },
  study_reminder: {
    icon: BookOpen,
    bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "بیرخستنەوەی خوێندن",
  },
  sync_complete: {
    icon: RefreshCw,
    bg: "bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800",
    text: "text-sky-600 dark:text-sky-400",
    label: "هاوکاتکردنەوەی ئۆفلاین",
  },
};

export function NotificationCenter({
  isOpen: controlledIsOpen,
  onClose,
  onNavigateToAction,
  unreadCount: _controlledUnreadCount,
  onUnreadCountChange,
  userId: propUserId,
  showTriggerButton = false,
  className = "",
}: NotificationCenterProps) {
  const storeUser = useAppStore((state) => state.user);
  const authUser = typeof window !== "undefined" ? getFirebaseAuth()?.currentUser : null;
  const activeUserId =
    propUserId ||
    authUser?.uid ||
    (storeUser as unknown as { uid?: string })?.uid ||
    storeUser?.id ||
    "default-guest";

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isDrawerOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [pageSize, setPageSize] = useState(15);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Sync unreadCount with parent if controlled
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  // Initialize engine and subscribe
  useEffect(() => {
    notificationEngine.initialize(activeUserId);

    void notificationEngine.getNotifications(activeUserId).then((list) => {
      setNotifications(list);
    });

    const unsubscribe = notificationEngine.subscribe((updatedList) => {
      setNotifications(updatedList);
    });

    return unsubscribe;
  }, [activeUserId]);

  // Refresh notifications whenever drawer is opened
  useEffect(() => {
    if (isDrawerOpen) {
      void notificationEngine.getNotifications(activeUserId).then((list) => {
        setNotifications(list);
      });
    }
  }, [isDrawerOpen, activeUserId]);

  const displayedNotifications = useMemo(() => {
    let list = notifications;
    if (filter === "unread") {
      list = list.filter((n) => !n.isRead);
    }
    return list.slice(0, pageSize);
  }, [notifications, filter, pageSize]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await notificationEngine.markAsRead(activeUserId, id);
  };

  const handleMarkAllAsRead = async () => {
    await notificationEngine.markAllAsRead(activeUserId);
  };

  const handleClearAll = async () => {
    await notificationEngine.clearAll(activeUserId);
  };

  const handleNotificationClick = (item: InAppNotification) => {
    if (!item.isRead) {
      void handleMarkAsRead(item.id);
    }
    if (item.actionUrl) {
      if (onNavigateToAction) {
        onNavigateToAction(item.actionUrl);
      } else {
        window.location.hash = item.actionUrl;
      }
      handleClose();
    }
  };

  return (
    <>
      {/* Optional Trigger Button with Bell Icon & Unread Badge */}
      {showTriggerButton && (
        <button
          type="button"
          onClick={() => setInternalIsOpen(true)}
          title="ئاگادارییەکان"
          aria-label="ئاگادارییەکان"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-rose-500 px-1 font-sans text-[10px] font-black text-white border-2 border-white dark:border-slate-900 shadow-xs animate-in zoom-in-75">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Drawer / Modal Container */}
      {isDrawerOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`flex h-full w-full max-w-md flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200 ${className}`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans text-base font-black text-slate-900 dark:text-white leading-tight">
                    ئاگادارییەکان
                  </h3>
                  <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                    {unreadCount > 0
                      ? `${unreadCount} ئاگاداریی نەخوێندراوەت هەیە`
                      : "هیچ ئاگادارییەکی نوێ نییە"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="داخستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Filter & Global Actions */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-5 py-2.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`rounded-lg px-2.5 py-1 font-sans text-xs font-bold transition cursor-pointer ${
                    filter === "all"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  هەمووی ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("unread")}
                  className={`rounded-lg px-2.5 py-1 font-sans text-xs font-bold transition cursor-pointer ${
                    filter === "unread"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  نەخوێندراوەکان ({unreadCount})
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    title="هەمووی وەک خوێندراوە دیاریبکە"
                    className="flex items-center gap-1 rounded-lg px-2 py-1 font-sans text-[11px] font-bold text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">خوێندنەوەی هەمووی</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    title="سڕینەوەی هەمووی"
                    className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
              {displayedNotifications.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-slate-500">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <Inbox className="w-7 h-7" />
                  </div>
                  <p className="font-sans text-sm font-bold text-slate-700 dark:text-slate-300">
                    {filter === "unread" ? "هیچ ئاگادارییەکی نەخوێندراوە نییە" : "هیچ ئاگادارییەک نییە"}
                  </p>
                  <p className="mt-1 font-sans text-xs text-slate-400 dark:text-slate-500 max-w-xs">
                    کاتێک دەستکەوتێک بەدەستدەهێنیت یان داتاکانت هاوکات دەبنەوە، لێرەدا دەردەکەون.
                  </p>
                </div>
              ) : (
                displayedNotifications.map((item) => {
                  const meta = TYPE_METADATA[item.type] || TYPE_METADATA.study_reminder;
                  const Icon = meta.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`group relative flex items-start gap-3 rounded-2xl p-3.5 transition cursor-pointer ${
                        item.isRead
                          ? "hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-80 hover:opacity-100"
                          : "bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40"
                      }`}
                    >
                      {/* Type Icon */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-xs ${meta.bg} ${meta.text}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`rounded-md px-1.5 py-0.5 font-sans text-[10px] font-black tracking-wide ${meta.text}`}
                          >
                            {meta.label}
                          </span>
                          <span className="font-sans text-[11px] text-slate-400 dark:text-slate-500">
                            {formatKurdishTimestamp(item.createdAt)}
                          </span>
                        </div>

                        <h4 className="mt-1 font-sans text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {item.title}
                        </h4>

                        <p className="mt-1 font-sans text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {item.message}
                        </p>

                        {/* Action link if available */}
                        {item.actionLabel && (
                          <div className="mt-2.5 flex items-center gap-1 font-sans text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                            <span>{item.actionLabel}</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Unread dot */}
                      {!item.isRead && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-xs" />
                      )}
                    </div>
                  );
                })
              )}

              {/* Load More Pagination */}
              {notifications.length > pageSize && (
                <div className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => setPageSize((prev) => Math.min(50, prev + 15))}
                    className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-2.5 font-sans text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  >
                    نیشاندانی زیاتر (تا ٥٠ ئاگاداری)
                  </button>
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-5 py-3 text-center">
              <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                پلاتفۆرمی زانا • ئاگادارییەکان لە خزمەت فێربوونی تۆدایە 🌟
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NotificationCenter;
