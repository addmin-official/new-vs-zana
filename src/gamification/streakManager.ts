/**
 * ZANA Platform - Gamification: Student Streak Manager
 *
 * Designed with Kurdish education realities in mind:
 * - Real life happens: 1 grace day allowed per 7-day rolling window.
 * - Exam weeks / illness / travel: 1 streak freeze allowed per calendar month.
 * - Reset only happens after 2 consecutive missed days if grace/freeze cannot protect it.
 * - Non-aggressive in-app reminders (single daily reminder after 8 PM, opt-out enabled).
 */

import { getFirestoreDb } from "../services/firebase.ts";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface GraceDayRecord {
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface StudentStreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  activityDates: string[]; // List of YYYY-MM-DD (up to 90 days)
  frozenDates: string[]; // List of YYYY-MM-DD
  graceDaysUsed: GraceDayRecord[];
  lastFrozenMonth?: string; // YYYY-MM
  reminderSentDate?: string; // YYYY-MM-DD
  remindersEnabled: boolean;
  updatedAt: number;
}

export interface StreakRecordResult {
  previousStreak: number;
  currentStreak: number;
  longestStreak: number;
  isNewDay: boolean;
  graceApplied: boolean;
  milestoneReached?: number;
}

export interface DailyCalendarDay {
  day: number;
  date: string; // YYYY-MM-DD
  active: boolean;
  frozen: boolean;
  grace: boolean;
  isToday: boolean;
}

function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function getDaysDifference(olderDateStr: string, newerDateStr: string): number {
  if (!olderDateStr || !newerDateStr) return 0;
  const d1 = parseDateString(olderDateStr);
  const d2 = parseDateString(newerDateStr);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function getStorageKey(userId: string): string {
  return `zana_streak_${userId || "default-guest"}`;
}

export async function getStudentStreakData(userId: string): Promise<StudentStreakData> {
  const defaultData: StudentStreakData = {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: "",
    activityDates: [],
    frozenDates: [],
    graceDaysUsed: [],
    remindersEnabled: true,
    updatedAt: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(getStorageKey(userId));
      if (cached) {
        const parsed = JSON.parse(cached) as Partial<StudentStreakData>;
        return {
          userId,
          currentStreak: typeof parsed.currentStreak === "number" ? parsed.currentStreak : 0,
          longestStreak: typeof parsed.longestStreak === "number" ? parsed.longestStreak : 0,
          lastActiveDate: parsed.lastActiveDate || "",
          activityDates: Array.isArray(parsed.activityDates) ? parsed.activityDates : [],
          frozenDates: Array.isArray(parsed.frozenDates) ? parsed.frozenDates : [],
          graceDaysUsed: Array.isArray(parsed.graceDaysUsed) ? parsed.graceDaysUsed : [],
          lastFrozenMonth: parsed.lastFrozenMonth,
          reminderSentDate: parsed.reminderSentDate,
          remindersEnabled: parsed.remindersEnabled !== false,
          updatedAt: parsed.updatedAt || Date.now(),
        };
      }
    } catch {
      // LocalStorage read error fallback
    }
  }

  try {
    const db = getFirestoreDb();
    if (db && userId) {
      const docRef = doc(db, "users", userId, "gamification", "streak");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as Partial<StudentStreakData>;
        const result: StudentStreakData = {
          userId,
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          lastActiveDate: data.lastActiveDate || "",
          activityDates: Array.isArray(data.activityDates) ? data.activityDates : [],
          frozenDates: Array.isArray(data.frozenDates) ? data.frozenDates : [],
          graceDaysUsed: Array.isArray(data.graceDaysUsed) ? data.graceDaysUsed : [],
          lastFrozenMonth: data.lastFrozenMonth,
          reminderSentDate: data.reminderSentDate,
          remindersEnabled: data.remindersEnabled !== false,
          updatedAt: data.updatedAt || Date.now(),
        };
        saveLocalStreakData(userId, result);
        return result;
      }
    }
  } catch {
    // Return default on failure
  }

  return defaultData;
}

function saveLocalStreakData(userId: string, data: StudentStreakData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
  } catch {
    // Quota handled
  }
}

/**
 * Check if a grace day was used within the rolling 7 days.
 */
function isGraceUsedInRolling7Days(graceDaysUsed: GraceDayRecord[], currentDateStr: string): boolean {
  const currentDate = parseDateString(currentDateStr);
  const sevenDaysAgoMs = currentDate.getTime() - 7 * 24 * 60 * 60 * 1000;

  return graceDaysUsed.some((g) => {
    const gDate = parseDateString(g.date);
    return gDate.getTime() >= sevenDaysAgoMs;
  });
}

/**
 * Records daily study activity (at least 1 concept practiced).
 * Implements grace period and freeze checks before resetting.
 */
export async function recordDailyActivity(
  userId: string,
  targetDateStr?: string
): Promise<StreakRecordResult> {
  const today = targetDateStr || getTodayDateString();
  const data = await getStudentStreakData(userId);

  const previousStreak = data.currentStreak;
  let currentStreak = data.currentStreak;
  let graceApplied = false;

  // Already recorded for today
  if (data.lastActiveDate === today) {
    return {
      previousStreak,
      currentStreak,
      longestStreak: data.longestStreak,
      isNewDay: false,
      graceApplied: false,
    };
  }

  if (!data.lastActiveDate) {
    // First active day ever
    currentStreak = 1;
  } else {
    const dayDiff = getDaysDifference(data.lastActiveDate, today);

    if (dayDiff === 1) {
      // Consecutive day — simple increment
      currentStreak += 1;
    } else if (dayDiff === 2) {
      // Missed 1 day. Check if that day was frozen or grace period is available.
      const yesterdayDate = new Date(parseDateString(today).getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = getTodayDateString(yesterdayDate);

      const wasFrozen = data.frozenDates.includes(yesterdayStr);
      const graceAlreadyUsed = isGraceUsedInRolling7Days(data.graceDaysUsed, today);

      if (wasFrozen) {
        // Protected by freeze
        currentStreak += 1;
      } else if (!graceAlreadyUsed) {
        // Protected by 1 grace day per 7-day window!
        graceApplied = true;
        currentStreak += 1;
        data.graceDaysUsed = [
          ...data.graceDaysUsed,
          { date: yesterdayStr, timestamp: Date.now() },
        ].slice(-10);
      } else {
        // Grace already used in last 7 days -> resets to 1
        currentStreak = 1;
      }
    } else {
      // Missed 2 or more consecutive days -> reset streak to 1
      currentStreak = 1;
    }
  }

  const longestStreak = Math.max(data.longestStreak, currentStreak);
  const updatedActivityDates = Array.from(new Set([...data.activityDates, today])).slice(-90);

  // Check milestones (3, 7, 14, 30, 100)
  let milestoneReached: number | undefined;
  if ([3, 7, 14, 30, 100].includes(currentStreak) && currentStreak > previousStreak) {
    milestoneReached = currentStreak;
  }

  const updatedData: StudentStreakData = {
    ...data,
    currentStreak,
    longestStreak,
    lastActiveDate: today,
    activityDates: updatedActivityDates,
    updatedAt: Date.now(),
  };

  saveLocalStreakData(userId, updatedData);

  // Async sync to Firestore
  try {
    const db = getFirestoreDb();
    if (db && userId) {
      const docRef = doc(db, "users", userId, "gamification", "streak");
      setDoc(docRef, updatedData, { merge: true }).catch(() => {});
    }
  } catch {
    // Ignore offline errors
  }

  return {
    previousStreak,
    currentStreak,
    longestStreak,
    isNewDay: true,
    graceApplied,
    milestoneReached,
  };
}

/**
 * Freeze streak for student once per calendar month.
 */
export async function freezeStreak(
  userId: string,
  targetDateStr?: string
): Promise<{ success: boolean; message: string; data?: StudentStreakData }> {
  const today = targetDateStr || getTodayDateString();
  const currentMonth = today.substring(0, 7); // YYYY-MM
  const data = await getStudentStreakData(userId);

  if (data.lastFrozenMonth === currentMonth) {
    return {
      success: false,
      message: "لە یەک مانگدا تەنها یەک جار دەتوانیت زنجیرەکەت بوەستێنیت (Freeze).",
    };
  }

  const updatedFrozenDates = Array.from(new Set([...data.frozenDates, today]));
  const updatedData: StudentStreakData = {
    ...data,
    frozenDates: updatedFrozenDates,
    lastFrozenMonth: currentMonth,
    updatedAt: Date.now(),
  };

  saveLocalStreakData(userId, updatedData);

  try {
    const db = getFirestoreDb();
    if (db && userId) {
      const docRef = doc(db, "users", userId, "gamification", "streak");
      setDoc(docRef, updatedData, { merge: true }).catch(() => {});
    }
  } catch {
    // Handled
  }

  return {
    success: true,
    message: "زنجیرەی ئەمڕۆت بەسەرکەوتوویی پارێزرا (Streak Freeze) ❄️",
    data: updatedData,
  };
}

/**
 * Formats streak with Fire emoji and Kurdish/Eastern or Western digits.
 * Example: 🔥 ١٢
 */
export function formatKurdishStreak(count: number, useEastern: boolean = true): string {
  const easternDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const formattedCount = useEastern
    ? count.toString().replace(/[0-9]/g, (d) => easternDigits[parseInt(d, 10)] || d)
    : count.toString();
  return `🔥 ${formattedCount}`;
}

/**
 * Generates calendar data for a given year & month (1-indexed month: 1=Jan, 12=Dec).
 */
export async function getMonthlyActivityCalendar(
  userId: string,
  year: number,
  month: number
): Promise<DailyCalendarDay[]> {
  const data = await getStudentStreakData(userId);
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = getTodayDateString();

  const activeSet = new Set(data.activityDates);
  const frozenSet = new Set(data.frozenDates);
  const graceSet = new Set(data.graceDaysUsed.map((g) => g.date));

  const result: DailyCalendarDay[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    result.push({
      day,
      date: dateStr,
      active: activeSet.has(dateStr),
      frozen: frozenSet.has(dateStr),
      grace: graceSet.has(dateStr),
      isToday: dateStr === todayStr,
    });
  }

  return result;
}

/**
 * Check if an in-app streak reminder should be sent.
 * Criteria:
 * - Current local hour >= 20:00 (8 PM)
 * - Student hasn't studied today yet
 * - Reminder hasn't already been sent today
 * - Student has reminders enabled
 */
export async function checkDailyStreakReminder(
  userId: string,
  currentHourOverride?: number
): Promise<{ shouldRemind: boolean; message?: string }> {
  const data = await getStudentStreakData(userId);
  if (!data.remindersEnabled) return { shouldRemind: false };

  const now = new Date();
  const currentHour = typeof currentHourOverride === "number" ? currentHourOverride : now.getHours();
  const today = getTodayDateString(now);

  if (currentHour < 20) {
    return { shouldRemind: false };
  }

  // Already active today
  if (data.lastActiveDate === today) {
    return { shouldRemind: false };
  }

  // Already reminded today
  if (data.reminderSentDate === today) {
    return { shouldRemind: false };
  }

  // Mark reminder sent for today to prevent repeated alerts
  data.reminderSentDate = today;
  saveLocalStreakData(userId, data);

  return {
    shouldRemind: true,
    message: "🌙 ئەمڕۆت هێشتا فێرنەبووە",
  };
}

/**
 * Toggle student's preference for in-app streak reminders
 */
export async function setStreakRemindersEnabled(
  userId: string,
  enabled: boolean
): Promise<StudentStreakData> {
  const data = await getStudentStreakData(userId);
  const updatedData: StudentStreakData = {
    ...data,
    remindersEnabled: enabled,
    updatedAt: Date.now(),
  };
  saveLocalStreakData(userId, updatedData);

  try {
    const db = getFirestoreDb();
    if (db && userId) {
      const docRef = doc(db, "users", userId, "gamification", "streak");
      setDoc(docRef, updatedData, { merge: true }).catch(() => {});
    }
  } catch {
    // Handled
  }

  return updatedData;
}
