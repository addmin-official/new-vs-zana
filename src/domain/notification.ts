/**
 * ZANA Notification System Domain Models
 * Strictly typed, Sorani Kurdish focused, calm and student-first.
 */

export type NotificationType =
  | "plan_reminder"
  | "next_best_action"
  | "deadline_approaching"
  | "task_recovery"
  | "mastery_achievement"
  | "weak_concept_review"
  | "assessment_recommendation"
  | "system_action_required";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface NotificationItem {
  id: string;
  studentId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  createdAt: number;
  readAt?: number | null;
  priority: NotificationPriority;
  deduplicationKey: string;
  expiresAt?: number | null;
}

export interface NotificationPreferences {
  studentId: string;
  inAppEnabled: boolean;
  dailyReminderTime: string; // "HH:MM" e.g. "18:00"
  quietHoursStart: string;   // "HH:MM" e.g. "22:00"
  quietHoursEnd: string;     // "HH:MM" e.g. "07:00"
  planRemindersEnabled: boolean;
  nextBestActionEnabled: boolean;
  deadlinesEnabled: boolean;
  taskRecoveryEnabled: boolean;
  achievementsEnabled: boolean;
  weakConceptEnabled: boolean;
  assessmentEnabled: boolean;
  systemEnabled: boolean;
  updatedAt: number;
}

export const DEFAULT_NOTIFICATION_PREFERENCES = (studentId: string): NotificationPreferences => ({
  studentId,
  inAppEnabled: true,
  dailyReminderTime: "18:00",
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  planRemindersEnabled: true,
  nextBestActionEnabled: true,
  deadlinesEnabled: true,
  taskRecoveryEnabled: true,
  achievementsEnabled: true,
  weakConceptEnabled: true,
  assessmentEnabled: true,
  systemEnabled: true,
  updatedAt: Date.now(),
});

/**
 * Checks whether the current local time falls inside quiet hours.
 * Supports cross-midnight intervals (e.g. 22:00 to 07:00).
 */
export function isCurrentlyQuietHours(
  quietStart: string = "22:00",
  quietEnd: string = "07:00",
  now: Date = new Date()
): boolean {
  try {
    const [startH, startM] = quietStart.split(":").map(Number);
    const [endH, endM] = quietEnd.split(":").map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    if (startMinutes === endMinutes) {
      return false;
    }

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Crosses midnight, e.g. 22:00 -> 07:00
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  } catch {
    return false;
  }
}

/**
 * Formats a deduplication key ensuring no duplicate notification in the same cycle.
 */
export function buildDeduplicationKey(
  type: NotificationType,
  studentId: string,
  discriminator: string
): string {
  return `${type}:${studentId}:${discriminator}`.toLowerCase();
}

/**
 * Format relative Kurdish timestamp for display.
 */
export function formatKurdishRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diffSec = Math.floor((now - timestamp) / 1000);
  if (diffSec < 60) return "هەر ئێستا";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `پێش ${diffMin} خولەک`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `پێش ${diffHours} کاتژمێر`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "دوێنێ";
  if (diffDays < 7) return `پێش ${diffDays} ڕۆژ`;
  const date = new Date(timestamp);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}
