import {
  NotificationItem,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  buildDeduplicationKey,
  isCurrentlyQuietHours,
  NotificationType,
} from "../domain/notification.ts";
import { fetchWithFallback, parseResponseJson } from "../lib/apiClient.ts";
import { getClientToken } from "./authService.ts";

const NOTIFICATIONS_CACHE_KEY = "zana_notifications_cache_v1";
const NOTIFICATIONS_PREFS_KEY = "zana_notification_prefs_v1";

export interface NotificationEvaluationContext {
  studentId: string;
  hasIncompleteTodayPlan?: boolean;
  nextBestActionReason?: string;
  nextBestActionUrl?: string;
  approachingGoalTitle?: string;
  missedTasksCount?: number;
  recentAchievement?: { conceptName: string; score: number };
  weakConcept?: { conceptId: string; conceptName: string };
  completedAssessment?: { score: number; subject: string };
  systemAlert?: { title: string; message: string; actionUrl: string };
  isOnboardingCompleted?: boolean;
  isInActiveQuiz?: boolean;
  isTypingInChat?: boolean;
}

export class NotificationService {
  private static instance: NotificationService;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Fetch all notifications for the current student
   */
  public async getNotifications(
    unreadOnly = false,
    tokenOverride?: string
  ): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    try {
      const token = tokenOverride || (await getClientToken());
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetchWithFallback(
        `/api/notifications${unreadOnly ? "?unreadOnly=true" : ""}`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await parseResponseJson<{
        ok: boolean;
        notifications: NotificationItem[];
        unreadCount: number;
      }>(res);

      if (data?.ok && Array.isArray(data.notifications)) {
        this.cacheLocalNotifications(data.notifications);
        return {
          notifications: data.notifications,
          unreadCount: typeof data.unreadCount === "number" ? data.unreadCount : data.notifications.filter(n => !n.readAt).length,
        };
      }
    } catch {
      // Offline fallback: load from localStorage
    }

    const cached = this.getLocalNotifications();
    const filtered = unreadOnly ? cached.filter((n) => !n.readAt) : cached;
    return {
      notifications: filtered,
      unreadCount: cached.filter((n) => !n.readAt).length,
    };
  }

  /**
   * Mark a single notification as read
   */
  public async markAsRead(id: string, tokenOverride?: string): Promise<boolean> {
    try {
      const token = tokenOverride || (await getClientToken());
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      await fetchWithFallback(`/api/notifications/${encodeURIComponent(id)}/read`, {
        method: "POST",
        headers,
      });
    } catch {
      // Update local storage regardless
    }

    const cached = this.getLocalNotifications();
    const updated = cached.map((n) =>
      n.id === id ? { ...n, readAt: n.readAt || Date.now() } : n
    );
    this.cacheLocalNotifications(updated);
    return true;
  }

  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(tokenOverride?: string): Promise<number> {
    try {
      const token = tokenOverride || (await getClientToken());
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      await fetchWithFallback("/api/notifications/read-all", {
        method: "POST",
        headers,
      });
    } catch {
      // Local fallback
    }

    const cached = this.getLocalNotifications();
    const now = Date.now();
    const count = cached.filter((n) => !n.readAt).length;
    const updated = cached.map((n) => ({ ...n, readAt: n.readAt || now }));
    this.cacheLocalNotifications(updated);
    return count;
  }

  /**
   * Retrieve student preferences
   */
  public async getPreferences(
    studentId: string,
    tokenOverride?: string
  ): Promise<NotificationPreferences> {
    try {
      const token = tokenOverride || (await getClientToken());
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetchWithFallback("/api/notifications/preferences", {
        method: "GET",
        headers,
      });

      const data = await parseResponseJson<{
        ok: boolean;
        preferences: NotificationPreferences;
      }>(res);

      if (data?.ok && data.preferences) {
        this.cacheLocalPreferences(data.preferences);
        return data.preferences;
      }
    } catch {
      // Fallback
    }

    return this.getLocalPreferences(studentId);
  }

  /**
   * Save student preferences
   */
  public async savePreferences(
    preferences: Partial<NotificationPreferences>,
    studentId: string,
    tokenOverride?: string
  ): Promise<NotificationPreferences> {
    const current = await this.getPreferences(studentId, tokenOverride);
    const updated: NotificationPreferences = {
      ...current,
      ...preferences,
      studentId,
      updatedAt: Date.now(),
    };

    try {
      const token = tokenOverride || (await getClientToken());
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetchWithFallback("/api/notifications/preferences", {
        method: "POST",
        headers,
        body: JSON.stringify(updated),
      });

      const data = await parseResponseJson<{
        ok: boolean;
        preferences: NotificationPreferences;
      }>(res);

      if (data?.ok && data.preferences) {
        this.cacheLocalPreferences(data.preferences);
        return data.preferences;
      }
    } catch {
      // Cache locally
    }

    this.cacheLocalPreferences(updated);
    return updated;
  }

  /**
   * Evaluates student state and generates appropriate in-app notifications.
   * Respects quiet hours, preferences, onboarding state, active quiz, and tutor chat guards.
   */
  public async evaluateAndGenerate(
    ctx: NotificationEvaluationContext,
    tokenOverride?: string
  ): Promise<NotificationItem[]> {
    // Guard 1: Onboarding check
    if (ctx.isOnboardingCompleted === false) {
      return [];
    }

    // Guard 2: Active quiz or typing in tutor chat
    if (ctx.isInActiveQuiz || ctx.isTypingInChat) {
      return [];
    }

    const prefs = await this.getPreferences(ctx.studentId, tokenOverride);
    if (!prefs.inAppEnabled) {
      return [];
    }

    const isQuiet = isCurrentlyQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd);
    const todayYMD = new Date().toISOString().slice(0, 10);
    const generated: NotificationItem[] = [];

    // Helper to push notification if category enabled
    const pushIfAllowed = (
      type: NotificationType,
      allowed: boolean,
      discriminator: string,
      title: string,
      message: string,
      actionLabel?: string,
      actionUrl?: string,
      priority: NotificationItem["priority"] = "normal"
    ) => {
      if (!allowed) return;
      const deduplicationKey = buildDeduplicationKey(type, ctx.studentId, discriminator);
      generated.push({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        studentId: ctx.studentId,
        type,
        title,
        message,
        actionLabel,
        actionUrl,
        createdAt: Date.now(),
        readAt: null,
        priority: isQuiet ? "low" : priority,
        deduplicationKey,
      });
    };

    // 1. Daily study-plan reminder
    if (ctx.hasIncompleteTodayPlan) {
      pushIfAllowed(
        "plan_reminder",
        prefs.planRemindersEnabled,
        todayYMD,
        "پلانی خوێندنی ئەمڕۆت چاوەڕێتە 📚",
        "چەند ئامانجێکی کورت ماون لە پلانی ئەمڕۆتدا. هەنگاوێک بنێ بۆ تەواوکردنیان بە ئارامی.",
        "پلانی ئەمڕۆ ببینە",
        "/plan",
        "normal"
      );
    }

    // 2. Next Best Action reminder
    if (ctx.nextBestActionReason) {
      pushIfAllowed(
        "next_best_action",
        prefs.nextBestActionEnabled,
        todayYMD,
        "هەنگاوی پێشنیارکراوی داهاتوو ⚡",
        ctx.nextBestActionReason,
        "دەست پێ بکە",
        ctx.nextBestActionUrl || "/chat",
        "normal"
      );
    }

    // 3. Upcoming goal or exam deadline
    if (ctx.approachingGoalTitle) {
      pushIfAllowed(
        "deadline_approaching",
        prefs.deadlinesEnabled,
        `${ctx.approachingGoalTitle}_${todayYMD}`,
        "نزیکبوونەوە لە وادەی دیاریکراو 🎯",
        `کاتی گەیشتن بە ئامانجی «${ctx.approachingGoalTitle}» نزیکە؛ هەنگاوەکانت بەردەوام بکە.`,
        "بینینی ئامانج",
        "/plan",
        "high"
      );
    }

    // 4. Missed-task recovery suggestion
    if (ctx.missedTasksCount && ctx.missedTasksCount > 0) {
      pushIfAllowed(
        "task_recovery",
        prefs.taskRecoveryEnabled,
        todayYMD,
        "دەرفەت بۆ گەڕانەوە سەر ڕێڕەو 🌿",
        "هیچ کێشە نییە ئەگەر هەندێک وانەت تەواو نەکردبێت؛ زانا یارمەتیت دەدات بۆ هاوسەنگکردنەوەی پلانەکەت.",
        "ڕێکخستنەوەی پلان",
        "/plan",
        "normal"
      );
    }

    // 5. Mastery improvement or achievement
    if (ctx.recentAchievement) {
      pushIfAllowed(
        "mastery_achievement",
        prefs.achievementsEnabled,
        `${ctx.recentAchievement.conceptName}_${Math.round(ctx.recentAchievement.score * 100)}`,
        "پیرۆزە! بەدەستهێنانی لێهاتوویی نوێ 🏆",
        `ئاستی تێگەیشتنت لە بابەتی «${ctx.recentAchievement.conceptName}» گەیشتە ${Math.round(ctx.recentAchievement.score * 100)}%. بەردەوام بە!`,
        "پڕۆفایلی لێهاتوویی",
        "/profile",
        "normal"
      );
    }

    // 6. Weak-concept review reminder
    if (ctx.weakConcept) {
      pushIfAllowed(
        "weak_concept_review",
        prefs.weakConceptEnabled,
        `${ctx.weakConcept.conceptId}_${todayYMD}`,
        "پێداچوونەوەیەکی کورتی چەمک 💡",
        `دەتوانیت چەند پرسیارێکی کورت لەگەڵ مامۆستا زانا بکەیت دەربارەی «${ctx.weakConcept.conceptName}» بۆ بەهێزکردنی تێگەیشتنت.`,
        "پێداچوونەوە بکە",
        "/chat",
        "normal"
      );
    }

    // 7. Assessment completion and recommended next step
    if (ctx.completedAssessment) {
      pushIfAllowed(
        "assessment_recommendation",
        prefs.assessmentEnabled,
        todayYMD,
        "ئەنجامی تاقیکردنەوە و ڕێنمایی 📝",
        `تاقیکردنەوەکەت تەواو کرد؛ هەنگاوی دواتر لە تاقیگەی ڕاهێنان دەست پێ بکە.`,
        "بچۆ بۆ ڕاهێنان",
        "/practice",
        "normal"
      );
    }

    // 8. System message only when action is required
    if (ctx.systemAlert) {
      pushIfAllowed(
        "system_action_required",
        prefs.systemEnabled,
        ctx.systemAlert.title,
        ctx.systemAlert.title,
        ctx.systemAlert.message,
        "چاکسازی بکە",
        ctx.systemAlert.actionUrl,
        "urgent"
      );
    }

    if (generated.length === 0) {
      return [];
    }

    // Send newly evaluated notifications to backend or store in cache
    const token = tokenOverride || (await getClientToken());
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      await fetchWithFallback("/api/notifications/batch", {
        method: "POST",
        headers,
        body: JSON.stringify({ notifications: generated }),
      });
    } catch {
      // Local merge fallback
    }

    // Local merge preserving unique deduplication keys
    const cached = this.getLocalNotifications();
    const existingKeys = new Set(cached.map((n) => n.deduplicationKey));
    const toAdd = generated.filter((n) => !existingKeys.has(n.deduplicationKey));

    if (toAdd.length > 0) {
      const merged = [...toAdd, ...cached].slice(0, 50);
      this.cacheLocalNotifications(merged);
    }

    return toAdd;
  }

  // In-memory store fallback when localStorage is unavailable (Node.js test / SSR)
  private memoryNotifications: NotificationItem[] = [];
  private memoryPreferences: Map<string, NotificationPreferences> = new Map();

  // --- Local Storage Helpers ---

  private getLocalNotifications(): NotificationItem[] {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(NOTIFICATIONS_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {}
    return this.memoryNotifications;
  }

  private cacheLocalNotifications(items: NotificationItem[]): void {
    this.memoryNotifications = items;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify(items));
      }
    } catch {}
  }

  private getLocalPreferences(studentId: string): NotificationPreferences {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(`${NOTIFICATIONS_PREFS_KEY}_${studentId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") return parsed;
        }
      }
    } catch {}
    return this.memoryPreferences.get(studentId) || DEFAULT_NOTIFICATION_PREFERENCES(studentId);
  }

  private cacheLocalPreferences(prefs: NotificationPreferences): void {
    this.memoryPreferences.set(prefs.studentId, prefs);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(`${NOTIFICATIONS_PREFS_KEY}_${prefs.studentId}`, JSON.stringify(prefs));
      }
    } catch {}
  }
}

export const notificationService = NotificationService.getInstance();
