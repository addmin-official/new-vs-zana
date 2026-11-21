/**
 * ZANA Platform - In-App Notification Engine
 *
 * Coordinates notifications for:
 * 1. Achievement unlocked
 * 2. Streak milestone
 * 3. Weekly summary
 * 4. Study reminder (if app is open)
 * 5. Sync complete (if offline data was synced)
 *
 * Features:
 * - Kurdish relative time: "٣ کاتژمێر پێش", "هەر ئێستا", "دوێنێ"
 * - Mark all as read & clear all
 * - Max 50 notifications stored per student
 * - Automatic integration with syncQueue and achievementEngine
 */

import { getFirestoreDb } from "../services/firebase.ts";
import { doc, setDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import { onAchievementUnlocked } from "../gamification/achievementEngine.ts";
import { isQuietHoursActive } from "./pushNotifications.ts";
import { syncQueue, SyncEvent } from "../offline/syncQueue.ts";

export type InAppNotificationType =
  | "achievement_unlocked"
  | "streak_milestone"
  | "weekly_summary"
  | "study_reminder"
  | "sync_complete";

export interface InAppNotification {
  id: string;
  userId: string;
  type: InAppNotificationType;
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  readAt?: number | null;
  isRead: boolean;
}

export type NotificationChangeListener = (notifications: InAppNotification[]) => void;

function getStorageKey(userId: string): string {
  return `zana_inapp_notifications_${userId || "default-guest"}`;
}

export class NotificationEngine {
  private static instance: NotificationEngine;
  private listeners: Set<NotificationChangeListener> = new Set();
  private initializedUser: string | null = null;
  private unsubscribeAchievement?: () => void;
  private unsubscribeSyncQueue?: () => void;

  public static getInstance(): NotificationEngine {
    if (!NotificationEngine.instance) {
      NotificationEngine.instance = new NotificationEngine();
    }
    return NotificationEngine.instance;
  }

  /**
   * Initialize subscriptions for automatic notifications (Achievements + SyncQueue)
   */
  public initialize(userId: string): void {
    if (this.initializedUser === userId) return;
    this.initializedUser = userId;

    if (this.unsubscribeAchievement) this.unsubscribeAchievement();
    if (this.unsubscribeSyncQueue) this.unsubscribeSyncQueue();

    // 1. Listen for unlocked achievements
    this.unsubscribeAchievement = onAchievementUnlocked((achievement) => {
      this.addNotification(userId, {
        type: "achievement_unlocked",
        title: "دەستکەوتی نوێ! 🏆",
        message: `${achievement.title} — +${achievement.xpReward} XP بەدەستهات`,
        icon: achievement.icon || "🏆",
        actionUrl: "/profile",
        actionLabel: "بینینی دەستکەوتەکان",
        metadata: { achievementId: achievement.id, xpReward: achievement.xpReward },
      }).catch(() => {});
    });

    // 2. Listen for offline sync completions
    try {
      this.unsubscribeSyncQueue = syncQueue.on("sync:complete", (data: SyncEvent) => {
        const syncedCount = data.syncedCount || 0;
        if (syncedCount > 0) {
          this.addNotification(userId, {
            type: "sync_complete",
            title: "هاوکاتکردنەوەی داتاکان 🔄",
            message: `پێشکەوتن و چالاکییەکانت بەسەرکەوتوویی لەگەڵ سێرڤەر هاوکات کرانەوە (${syncedCount} بڕگە).`,
            icon: "🔄",
            actionUrl: "/progress",
            actionLabel: "بینینی پێشکەوتن",
            metadata: { syncedCount },
          }).catch(() => {});
        }
      });
    } catch {
      // SyncQueue integration safe
    }

    // Schedule trial reminders
    this.scheduleTrialReminders(userId).catch(() => {});
  }

  /**
   * Schedule trial expiry reminders.
   * Called from initialize() after userId is set.
   */
  private async scheduleTrialReminders(userId: string): Promise<void> {
    const { getTrialInfo } = await import('../auth/trialService.ts');
    const { getFirebaseAuth } = await import('../services/firebase.ts');

    const auth = getFirebaseAuth();
    const email = auth?.currentUser?.email || undefined;
    const trial = await getTrialInfo(userId, email);

    if (trial.status !== 'trial_active') return;

    // Show "1 day remaining" reminder
    if (trial.daysRemaining === 1 && trial.hoursRemaining > 0) {
      await this.addNotification(userId, {
        type: 'study_reminder',
        title: '⏰ ئەمڕۆ کۆتا ڕۆژی تاقیکردنەوەیە!',
        message: `کاتی تاقیکردنەوەی خۆڕایت ئەمڕۆ کۆتادەبێت. `
          + `${trial.hoursRemaining} کاتژمێرت ماوە. ئەمڕۆ بەردەوام بیخوێنە!`,
        icon: '⏰',
        actionUrl: '/home',
        actionLabel: 'بەردەوام بە',
        force: true,
      });
    }

    // Show "last 2 hours" reminder
    if (trial.daysRemaining === 0 && trial.hoursRemaining <= 2 && trial.hoursRemaining > 0) {
      await this.addNotification(userId, {
        type: 'study_reminder',
        title: '🔔 کەمتر لە ٢ کاتژمێر ماوە!',
        message: 'کاتی تاقیکردنەوەت نزیکی کۆتاییە. '
          + 'دوای ئەوە ژمارەی پرسیارەکانت سنووردار دەبێت.',
        icon: '🔔',
        actionUrl: '/subscription',
        actionLabel: 'بەشداربوون',
        force: true,
      });
    }
  }

  /**
   * Fetch in-app notifications with local-first cache
   */
  public async getNotifications(userId: string, filterUnread = false): Promise<InAppNotification[]> {
    const effectiveId = userId || "default-guest";
    let list: InAppNotification[] = [];

    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(getStorageKey(effectiveId));
        if (cached) {
          list = JSON.parse(cached) as InAppNotification[];
        }

        // Also merge guest notifications if authenticated so pre-login notifications are never missed
        if (effectiveId !== "default-guest") {
          const guestCached = localStorage.getItem(getStorageKey("default-guest"));
          if (guestCached) {
            const guestList = JSON.parse(guestCached) as InAppNotification[];
            const existingIds = new Set(list.map((n) => n.id));
            const existingTitles = new Set(list.map((n) => n.title));
            for (const item of guestList) {
              if (!existingIds.has(item.id) && !existingTitles.has(item.title)) {
                list.push({ ...item, userId: effectiveId });
              }
            }
          }
        }

        // Also merge system broadcast notifications if any
        const broadcastCached = localStorage.getItem(getStorageKey("all_broadcast"));
        if (broadcastCached) {
          const broadcastList = JSON.parse(broadcastCached) as InAppNotification[];
          const existingIds = new Set(list.map((n) => n.id));
          const existingTitles = new Set(list.map((n) => n.title));
          for (const item of broadcastList) {
            if (!existingIds.has(item.id) && !existingTitles.has(item.title)) {
              list.push({ ...item, userId: effectiveId });
            }
          }
        }
      } catch {
        // Fallback
      }
    }

    if (list.length === 0) {
      try {
        const db = getFirestoreDb();
        if (db && effectiveId && effectiveId !== "default-guest") {
          const colRef = collection(db, "users", effectiveId, "notifications");
          const snap = await getDocs(colRef);
          snap.forEach((d) => {
            const item = d.data() as InAppNotification;
            if (item && item.id) {
              list.push(item);
            }
          });
          list.sort((a, b) => b.createdAt - a.createdAt);
          this.saveLocal(effectiveId, list);
        }
      } catch {
        // Fallback
      }
    }

    list.sort((a, b) => b.createdAt - a.createdAt);

    if (filterUnread) {
      return list.filter((n) => !n.isRead);
    }

    return list;
  }

  /**
   * Count unread notifications
   */
  public async getUnreadCount(userId: string): Promise<number> {
    const list = await this.getNotifications(userId);
    return list.filter((n) => !n.isRead).length;
  }

  /**
   * Create and deliver a new in-app notification
   */
  public async addNotification(
    userId: string,
    params: {
      type: InAppNotificationType;
      title: string;
      message: string;
      icon?: string;
      actionUrl?: string;
      actionLabel?: string;
      metadata?: Record<string, unknown>;
      force?: boolean;
    }
  ): Promise<InAppNotification | null> {
    const effectiveId = userId || "default-guest";

    // If quiet hours and it's a study reminder, skip (unless in test or forced)
    if (
      params.type === "study_reminder" &&
      !params.force &&
      process.env.NODE_ENV !== "test" &&
      isQuietHoursActive()
    ) {
      return null;
    }

    const currentList = await this.getNotifications(effectiveId);

    const newNotification: InAppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: effectiveId,
      type: params.type,
      title: params.title,
      message: params.message,
      icon: params.icon,
      actionUrl: params.actionUrl,
      actionLabel: params.actionLabel,
      metadata: params.metadata,
      createdAt: Date.now(),
      isRead: false,
    };

    // Deduplicate identical notifications created in the last 10 minutes
    const isDuplicate = currentList.some(
      (n) =>
        n.type === params.type &&
        n.title === params.title &&
        Date.now() - n.createdAt < 10 * 60 * 1000
    );
    if (isDuplicate) return null;

    // Prepend and cap at 50 items
    const updatedList = [newNotification, ...currentList].slice(0, 50);
    this.saveLocal(effectiveId, updatedList);

    // If specific userId, mirror to default-guest cache so notification is available across all views
    if (effectiveId !== "default-guest" && typeof window !== "undefined") {
      try {
        const guestCached = localStorage.getItem(getStorageKey("default-guest"));
        const guestList: InAppNotification[] = guestCached ? JSON.parse(guestCached) : [];
        if (!guestList.some((n) => n.id === newNotification.id || n.title === newNotification.title)) {
          const updatedGuest = [newNotification, ...guestList].slice(0, 50);
          this.saveLocal("default-guest", updatedGuest);
        }
      } catch {
        // Non-blocking
      }
    }

    // Save to Firestore in background
    try {
      const db = getFirestoreDb();
      if (db && effectiveId && effectiveId !== "default-guest") {
        const docRef = doc(db, "users", effectiveId, "notifications", newNotification.id);
        setDoc(docRef, newNotification).catch(() => {});
      }
    } catch {
      // Non-blocking
    }

    this.notifyListeners(updatedList);
    return newNotification;
  }

  /**
   * Mark a single notification as read
   */
  public async markAsRead(userId: string, notificationId: string): Promise<void> {
    const effectiveId = userId || "default-guest";
    const currentList = await this.getNotifications(effectiveId);
    const updatedList = currentList.map((n) =>
      n.id === notificationId ? { ...n, isRead: true, readAt: Date.now() } : n
    );

    this.saveLocal(effectiveId, updatedList);
    if (effectiveId !== "default-guest") {
      try {
        const guestCached = localStorage.getItem(getStorageKey("default-guest"));
        if (guestCached) {
          const guestList = JSON.parse(guestCached) as InAppNotification[];
          const updatedGuest = guestList.map((n) =>
            n.id === notificationId ? { ...n, isRead: true, readAt: Date.now() } : n
          );
          this.saveLocal("default-guest", updatedGuest);
        }
      } catch {
        // Non-blocking
      }
    }

    try {
      const db = getFirestoreDb();
      if (db && effectiveId && effectiveId !== "default-guest") {
        const docRef = doc(db, "users", effectiveId, "notifications", notificationId);
        setDoc(docRef, { isRead: true, readAt: Date.now() }, { merge: true }).catch(() => {});
      }
    } catch {
      // Handled
    }

    this.notifyListeners(updatedList);
  }

  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(userId: string): Promise<void> {
    const effectiveId = userId || "default-guest";
    const currentList = await this.getNotifications(effectiveId);
    const now = Date.now();
    const updatedList = currentList.map((n) => ({ ...n, isRead: true, readAt: n.readAt || now }));

    this.saveLocal(effectiveId, updatedList);
    if (effectiveId !== "default-guest") {
      try {
        const guestCached = localStorage.getItem(getStorageKey("default-guest"));
        if (guestCached) {
          const guestList = JSON.parse(guestCached) as InAppNotification[];
          const updatedGuest = guestList.map((n) => ({ ...n, isRead: true, readAt: n.readAt || now }));
          this.saveLocal("default-guest", updatedGuest);
        }
      } catch {
        // Non-blocking
      }
    }

    try {
      const db = getFirestoreDb();
      if (db && effectiveId && effectiveId !== "default-guest") {
        const batch = writeBatch(db);
        updatedList.forEach((item) => {
          const docRef = doc(db, "users", effectiveId, "notifications", item.id);
          batch.update(docRef, { isRead: true, readAt: now });
        });
        batch.commit().catch(() => {});
      }
    } catch {
      // Handled
    }

    this.notifyListeners(updatedList);
  }

  /**
   * Clear all notifications
   */
  public async clearAll(userId: string): Promise<void> {
    const effectiveId = userId || "default-guest";
    const emptyList: InAppNotification[] = [];
    this.saveLocal(effectiveId, emptyList);
    if (effectiveId !== "default-guest") {
      this.saveLocal("default-guest", emptyList);
    }

    try {
      const db = getFirestoreDb();
      if (db && effectiveId && effectiveId !== "default-guest") {
        const colRef = collection(db, "users", effectiveId, "notifications");
        const snap = await getDocs(colRef);
        const batch = writeBatch(db);
        snap.forEach((d) => batch.delete(d.ref));
        batch.commit().catch(() => {});
      }
    } catch {
      // Handled
    }

    this.notifyListeners(emptyList);
  }

  /**
   * Subscribe to notification changes
   */
  public subscribe(listener: NotificationChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(list: InAppNotification[]): void {
    this.listeners.forEach((listener) => {
      try {
        listener(list);
      } catch {
        // Handled
      }
    });
  }

  private saveLocal(userId: string, list: InAppNotification[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(list));
    } catch {
      // Quota handled
    }
  }
}

export const notificationEngine = NotificationEngine.getInstance();

/**
 * Format relative Kurdish timestamp matching Sorani style:
 * Example: "٣ کاتژمێر پێش", "هەر ئێستا", "دوێنێ", "پێش ٥ ڕۆژ"
 */
export function formatKurdishTimestamp(
  timestamp: number,
  now: number = Date.now(),
  useEasternDigits = true
): string {
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  const toDigits = (val: number | string) => {
    if (!useEasternDigits) return String(val);
    const eastern = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return String(val).replace(/[0-9]/g, (d) => eastern[parseInt(d, 10)] || d);
  };

  if (diffSec < 60) return "هەر ئێستا";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${toDigits(diffMin)} خولەک پێش`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${toDigits(diffHours)} کاتژمێر پێش`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "دوێنێ";
  if (diffDays < 7) return `پێش ${toDigits(diffDays)} ڕۆژ`;

  const d = new Date(timestamp);
  return `${toDigits(d.getFullYear())}/${toDigits(d.getMonth() + 1)}/${toDigits(d.getDate())}`;
}
