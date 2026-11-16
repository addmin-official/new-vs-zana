/**
 * ZANA Platform - Push Notification System (FCM)
 *
 * Designed with student-first respect:
 * - Never prompts on first launch (requests permission only after day 3 of usage).
 * - Explains WHY in Kurdish Sorani before asking for browser permission.
 * - Quiet hours (10PM – 7AM) strictly enforced.
 * - All push notifications are granularly opt-in.
 */

import { getFirebaseApp } from "../services/firebase.ts";
import { getFirestoreDb } from "../services/firebase.ts";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface PushNotificationPreferences {
  userId: string;
  enabled: boolean;
  fcmToken?: string | null;
  permissionRequested: boolean;
  permissionRequestedAt?: number;

  // Granular opt-in types
  studyReminderEnabled: boolean;
  studyReminderTime: string; // "HH:MM" e.g. "19:00" (default 7PM)

  streakWarningEnabled: boolean; // Not studied by 9PM, streak > 3 days

  weeklySummaryEnabled: boolean; // Sunday morning summary

  quietHoursStart: string; // "22:00" (10 PM)
  quietHoursEnd: string; // "07:00" (7 AM)

  updatedAt: number;
}

export const DEFAULT_PUSH_PREFERENCES = (userId: string): PushNotificationPreferences => ({
  userId,
  enabled: false,
  fcmToken: null,
  permissionRequested: false,
  studyReminderEnabled: true,
  studyReminderTime: "19:00",
  streakWarningEnabled: true,
  weeklySummaryEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  updatedAt: Date.now(),
});

function getStorageKey(userId: string): string {
  return `zana_push_prefs_${userId || "default-guest"}`;
}

/**
 * Checks whether user has used the app for at least 3 days.
 * Prevents aggressive onboarding push prompts.
 */
export function isEligibleForPushPrompt(userCreatedAt?: string | number | null): boolean {
  if (!userCreatedAt) return false;
  try {
    const createdMs = typeof userCreatedAt === "number" ? userCreatedAt : new Date(userCreatedAt).getTime();
    if (isNaN(createdMs)) return false;
    const diffDays = (Date.now() - createdMs) / (1000 * 60 * 60 * 24);
    return diffDays >= 3;
  } catch {
    return false;
  }
}

/**
 * Check if the browser currently supports Notification and ServiceWorker APIs.
 */
export async function isPushNotificationSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return false;

  try {
    const { isSupported } = await import("firebase/messaging");
    return await isSupported();
  } catch {
    return false;
  }
}

/**
 * Check if current time falls in quiet hours (10PM – 7AM).
 */
export function isQuietHoursActive(
  start: string = "22:00",
  end: string = "07:00",
  now: Date = new Date()
): boolean {
  try {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    if (startMinutes === endMinutes) return false;

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Crosses midnight (e.g. 22:00 -> 07:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  } catch {
    return false;
  }
}

/**
 * Retrieve push preferences for student with local-first cache
 */
export async function getPushPreferences(userId: string): Promise<PushNotificationPreferences> {
  const defaults = DEFAULT_PUSH_PREFERENCES(userId);

  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(getStorageKey(userId));
      if (cached) {
        return { ...defaults, ...(JSON.parse(cached) as Partial<PushNotificationPreferences>) };
      }
    } catch {
      // Fallback
    }
  }

  try {
    const db = getFirestoreDb();
    if (db && userId) {
      const docRef = doc(db, "users", userId, "settings", "pushNotifications");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as Partial<PushNotificationPreferences>;
        const result = { ...defaults, ...data };
        saveLocalPushPreferences(userId, result);
        return result;
      }
    }
  } catch {
    // Return defaults on offline
  }

  return defaults;
}

export function saveLocalPushPreferences(userId: string, prefs: PushNotificationPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(prefs));
  } catch {
    // Quota handled
  }
}

/**
 * Update and persist student's push notification settings
 */
export async function updatePushPreferences(
  userId: string,
  updates: Partial<PushNotificationPreferences>
): Promise<PushNotificationPreferences> {
  const current = await getPushPreferences(userId);
  const updated: PushNotificationPreferences = {
    ...current,
    ...updates,
    updatedAt: Date.now(),
  };

  saveLocalPushPreferences(userId, updated);

  try {
    const db = getFirestoreDb();
    if (db && userId) {
      const docRef = doc(db, "users", userId, "settings", "pushNotifications");
      setDoc(docRef, updated, { merge: true }).catch(() => {});
    }
  } catch {
    // Non-blocking
  }

  return updated;
}

/**
 * Request notification permission after explaining WHY in Kurdish Sorani.
 */
export async function requestFCMNotificationPermission(
  userId: string,
  vapidKey?: string
): Promise<{ granted: boolean; token?: string; error?: string }> {
  const supported = await isPushNotificationSupported();
  if (!supported) {
    return { granted: false, error: "ئەم وێبگەڕە پشتگیری ئاگاداریی پاڵنەر (Push Notifications) ناکات." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      await updatePushPreferences(userId, {
        permissionRequested: true,
        permissionRequestedAt: Date.now(),
        enabled: false,
      });
      return { granted: false, error: "مۆڵەتی ناردنی ئاگاداری ڕەتکرایەوە لە لایەن بەکارهێنەرەوە." };
    }

    const app = getFirebaseApp();
    if (!app) {
      return { granted: true };
    }

    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging(app);

    // Get registration token
    const token = await getToken(messaging, {
      vapidKey: vapidKey || (import.meta as unknown as { env?: { VITE_FIREBASE_VAPID_KEY?: string } })?.env?.VITE_FIREBASE_VAPID_KEY,
    });

    await updatePushPreferences(userId, {
      permissionRequested: true,
      permissionRequestedAt: Date.now(),
      enabled: true,
      fcmToken: token,
    });

    return { granted: true, token };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { granted: false, error: message };
  }
}

/**
 * Message templates in Kurdish Sorani for the 3 allowed push notification types:
 */
export const PUSH_MESSAGES = {
  STUDY_REMINDER: (subjectName?: string) =>
    `کاتی فێربوونە! ${subjectName || "وانەکەت"} چاوەڕێتە 📚`,
  STREAK_WARNING: (days: number) =>
    `🔥 ئاگر ${days} ڕۆژەکەت نەمرێت!`,
  WEEKLY_SUMMARY: (completedConceptsCount: number) =>
    `هەفتەی تەواو بوو — ${completedConceptsCount} بابەتت فێربوویت! 🌟`,
};
