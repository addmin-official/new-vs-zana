import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getLevelTitle,
  getLevelNumber,
  getXpProgressInLevel,
  awardXp,
  getStudentXpData,
  onXpAwarded,
  XP_VALUES,
} from "../../gamification/xpSystem.ts";
import {
  recordDailyActivity,
  getStudentStreakData,
  freezeStreak,
  formatKurdishStreak,
  getMonthlyActivityCalendar,
  checkDailyStreakReminder,
} from "../../gamification/streakManager.ts";
import {
  ACHIEVEMENTS,
  unlockAchievement,
  getUserAchievements,
  checkSessionAchievements,
} from "../../gamification/achievementEngine.ts";
import {
  isEligibleForPushPrompt,
  isQuietHoursActive,
  getPushPreferences,
  updatePushPreferences,
  PUSH_MESSAGES,
} from "../../notifications/pushNotifications.ts";
import {
  notificationEngine,
  formatKurdishTimestamp,
} from "../../notifications/notificationEngine.ts";

vi.mock("../../services/firebase.ts", () => ({
  getFirestoreDb: vi.fn(() => null),
  getFirebaseApp: vi.fn(() => null),
}));

describe("ZANA Student Engagement & Motivation System", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // PART 1: XP & LEVEL SYSTEM
  // ==========================================================================
  describe("XP System (xpSystem.ts)", () => {
    it("defines strictly educational non-manipulative XP source values", () => {
      expect(XP_VALUES.PRACTICE_SESSION).toBe(10);
      expect(XP_VALUES.CONCEPT_DEVELOPING).toBe(25);
      expect(XP_VALUES.CONCEPT_PROFICIENT).toBe(50);
      expect(XP_VALUES.CONCEPT_MASTERED).toBe(100);
      expect(XP_VALUES.PERFECT_ASSESSMENT).toBe(75);
      expect(XP_VALUES.DAILY_STUDY).toBe(15);
      expect(XP_VALUES.STREAK_7_DAYS).toBe(100);
    });

    it("maps XP to Kurdish level titles accurately across all thresholds", () => {
      // 0 - 499: خوێندکار (Student)
      expect(getLevelTitle(0)).toBe("خوێندکار");
      expect(getLevelTitle(450)).toBe("خوێندکار");

      // 500 - 999: بەڵێن (Promising)
      expect(getLevelTitle(500)).toBe("بەڵێن");
      expect(getLevelTitle(850)).toBe("بەڵێن");

      // 1000 - 1999: بارودۆخ (Steadfast / Progressing)
      expect(getLevelTitle(1000)).toBe("بارودۆخ");
      expect(getLevelTitle(1800)).toBe("بارودۆخ");

      // 2000 - 4999: شارەزا (Expert)
      expect(getLevelTitle(2000)).toBe("شارەزا");
      expect(getLevelTitle(3500)).toBe("شارەزا");

      // 5000+: مامۆستا (Master)
      expect(getLevelTitle(5000)).toBe("مامۆستا");
      expect(getLevelTitle(12000)).toBe("مامۆستا");
    });

    it("calculates level numbers every 500 XP", () => {
      expect(getLevelNumber(0)).toBe(1);
      expect(getLevelNumber(250)).toBe(1);
      expect(getLevelNumber(500)).toBe(2);
      expect(getLevelNumber(999)).toBe(2);
      expect(getLevelNumber(1000)).toBe(3);
      expect(getLevelNumber(5000)).toBe(11);
    });

    it("computes level progress bar percentages and remaining XP", () => {
      // At 250 XP in Level 1 (0 to 500): 50%
      const p1 = getXpProgressInLevel(250);
      expect(p1.currentLevel).toBe(1);
      expect(p1.progressPercent).toBe(50);
      expect(p1.xpRemaining).toBe(250);

      // At 650 XP in Level 2 (500 to 1000): 150 / 500 = 30%
      const p2 = getXpProgressInLevel(650);
      expect(p2.currentLevel).toBe(2);
      expect(p2.xpInCurrentLevel).toBe(150);
      expect(p2.progressPercent).toBe(30);
      expect(p2.xpRemaining).toBe(350);
    });

    it("awards XP, updates local storage, and triggers event listeners", async () => {
      const userId = "test_student_xp_1";
      const listenerSpy = vi.fn();
      const unsub = onXpAwarded(listenerSpy);

      const result = await awardXp(userId, "PRACTICE_SESSION");
      expect(result.previousXp).toBe(0);
      expect(result.newXp).toBe(10);
      expect(result.awardedXp).toBe(10);
      expect(result.leveledUp).toBe(false);

      expect(listenerSpy).toHaveBeenCalledTimes(1);
      expect(listenerSpy).toHaveBeenCalledWith(expect.objectContaining({ newXp: 10 }));

      // Award enough XP to trigger level up
      const levelUpResult = await awardXp(userId, "CUSTOM", 500);
      expect(levelUpResult.newXp).toBe(510);
      expect(levelUpResult.previousLevel).toBe(1);
      expect(levelUpResult.newLevel).toBe(2);
      expect(levelUpResult.leveledUp).toBe(true);
      expect(levelUpResult.levelTitle).toBe("بەڵێن");

      const stored = await getStudentXpData(userId);
      expect(stored.totalXp).toBe(510);
      expect(stored.level).toBe(2);

      unsub();
    });
  });

  // ==========================================================================
  // PART 2: STREAK MANAGER
  // ==========================================================================
  describe("Streak Manager (streakManager.ts)", () => {
    it("increments daily streak for consecutive days", async () => {
      const userId = "test_student_streak_1";

      // Day 1
      const day1 = await recordDailyActivity(userId, "2026-11-10");
      expect(day1.currentStreak).toBe(1);
      expect(day1.isNewDay).toBe(true);

      // Same day activity should be idempotent
      const day1Repeat = await recordDailyActivity(userId, "2026-11-10");
      expect(day1Repeat.currentStreak).toBe(1);
      expect(day1Repeat.isNewDay).toBe(false);

      // Day 2 (consecutive)
      const day2 = await recordDailyActivity(userId, "2026-11-11");
      expect(day2.currentStreak).toBe(2);
      expect(day2.isNewDay).toBe(true);
    });

    it("protects streak using 1 grace day per 7-day window", async () => {
      const userId = "test_student_grace_1";

      // Studied on Nov 10
      await recordDailyActivity(userId, "2026-11-10");

      // Skipped Nov 11 (1 day gap), studied on Nov 12
      const day3 = await recordDailyActivity(userId, "2026-11-12");
      expect(day3.graceApplied).toBe(true);
      expect(day3.currentStreak).toBe(2); // Preserved and incremented!

      // Try skipping another day within 7 days (studied Nov 12, skipped Nov 13, studied Nov 14)
      const day5 = await recordDailyActivity(userId, "2026-11-14");
      // Grace already used in last 7 days -> resets to 1
      expect(day5.graceApplied).toBe(false);
      expect(day5.currentStreak).toBe(1);
    });

    it("resets streak to 1 after 2 consecutive missed days", async () => {
      const userId = "test_student_reset_1";

      await recordDailyActivity(userId, "2026-11-01");
      await recordDailyActivity(userId, "2026-11-02");
      await recordDailyActivity(userId, "2026-11-03");

      const before = await getStudentStreakData(userId);
      expect(before.currentStreak).toBe(3);

      // Skipped Nov 4 and Nov 5 (2 consecutive days missed), studied on Nov 6
      const afterBreak = await recordDailyActivity(userId, "2026-11-06");
      expect(afterBreak.currentStreak).toBe(1);
      expect(afterBreak.longestStreak).toBe(3); // Longest streak record preserved
    });

    it("allows student to freeze streak once per calendar month", async () => {
      const userId = "test_student_freeze_1";

      // Studied on Nov 10
      await recordDailyActivity(userId, "2026-11-10");

      // Freeze on Nov 11
      const freeze1 = await freezeStreak(userId, "2026-11-11");
      expect(freeze1.success).toBe(true);

      // Attempting second freeze in same month is blocked
      const freeze2 = await freezeStreak(userId, "2026-11-15");
      expect(freeze2.success).toBe(false);
      expect(freeze2.message).toContain("لە یەک مانگدا تەنها یەک جار");

      // Study on Nov 12 should continue streak thanks to freeze protection on Nov 11
      const dayAfterFreeze = await recordDailyActivity(userId, "2026-11-12");
      expect(dayAfterFreeze.currentStreak).toBe(2);
    });

    it("formats Kurdish streak counter with fire emoji", () => {
      expect(formatKurdishStreak(12, true)).toBe("🔥 ١٢");
      expect(formatKurdishStreak(5, false)).toBe("🔥 5");
    });

    it("generates monthly activity calendar grid with active/frozen days", async () => {
      const userId = "test_student_cal_1";
      await recordDailyActivity(userId, "2026-11-05");
      await recordDailyActivity(userId, "2026-11-06");

      const cal = await getMonthlyActivityCalendar(userId, 2026, 11);
      expect(cal.length).toBe(30);

      const day5 = cal.find((d) => d.day === 5);
      const day6 = cal.find((d) => d.day === 6);
      const day7 = cal.find((d) => d.day === 7);

      expect(day5?.active).toBe(true);
      expect(day6?.active).toBe(true);
      expect(day7?.active).toBe(false);
    });

    it("checks 8 PM daily streak reminder non-aggressively", async () => {
      const userId = "test_student_reminder_1";

      // Before 8 PM (17:00 / 5 PM) -> no reminder
      const afternoon = await checkDailyStreakReminder(userId, 17);
      expect(afternoon.shouldRemind).toBe(false);

      // At or after 8 PM (20:00 / 8 PM) when not studied -> triggers reminder
      const evening = await checkDailyStreakReminder(userId, 20);
      expect(evening.shouldRemind).toBe(true);
      expect(evening.message).toBe("🌙 ئەمڕۆت هێشتا فێرنەبووە");

      // Same day second check should not repeat (single reminder per day rule)
      const eveningAgain = await checkDailyStreakReminder(userId, 21);
      expect(eveningAgain.shouldRemind).toBe(false);
    });
  });

  // ==========================================================================
  // PART 3: ACHIEVEMENT ENGINE
  // ==========================================================================
  describe("Achievement Engine (achievementEngine.ts)", () => {
    it("defines required learning, streak and subject-specific achievements", () => {
      expect(ACHIEVEMENTS.FIRST_CONCEPT).toBeDefined();
      expect(ACHIEVEMENTS.FIRST_MASTERY).toBeDefined();
      expect(ACHIEVEMENTS.SUBJECT_COMPLETE).toBeDefined();
      expect(ACHIEVEMENTS.PERFECT_ASSESSMENT).toBeDefined();
      expect(ACHIEVEMENTS.COMEBACK).toBeDefined();
      expect(ACHIEVEMENTS.SPEED_LEARNER).toBeDefined();
      expect(ACHIEVEMENTS.DEEP_THINKER).toBeDefined();

      expect(ACHIEVEMENTS.STREAK_3_DAYS).toBeDefined();
      expect(ACHIEVEMENTS.STREAK_7_DAYS).toBeDefined();
      expect(ACHIEVEMENTS.STREAK_14_DAYS).toBeDefined();
      expect(ACHIEVEMENTS.STREAK_30_DAYS).toBeDefined();
      expect(ACHIEVEMENTS.STREAK_100_DAYS).toBeDefined();

      expect(ACHIEVEMENTS.MATH_MASTER).toBeDefined();
      expect(ACHIEVEMENTS.PHYSICS_PRO).toBeDefined();
      expect(ACHIEVEMENTS.CHEMISTRY_EXPERT).toBeDefined();
      expect(ACHIEVEMENTS.BIOLOGY_EXPERT).toBeDefined();
      expect(ACHIEVEMENTS.ENGLISH_PRO).toBeDefined();
      expect(ACHIEVEMENTS.KURDISH_SCHOLAR).toBeDefined();
    });

    it("enforces achievements unlock strictly once and awards XP", async () => {
      const userId = "test_student_ach_1";

      const firstUnlock = await unlockAchievement(userId, "FIRST_CONCEPT");
      expect(firstUnlock).not.toBeNull();
      expect(firstUnlock?.id).toBe("FIRST_CONCEPT");
      expect(firstUnlock?.title).toContain("یەکەم بابەت فێربووی");

      // Check XP was awarded
      const xpData = await getStudentXpData(userId);
      expect(xpData.totalXp).toBe(ACHIEVEMENTS.FIRST_CONCEPT.xpReward);

      // Attempting duplicate unlock returns null
      const duplicateUnlock = await unlockAchievement(userId, "FIRST_CONCEPT");
      expect(duplicateUnlock).toBeNull();

      const userAchievements = await getUserAchievements(userId);
      expect(Object.keys(userAchievements).length).toBe(1);
    });

    it("evaluates session completion context asynchronously without blocking", async () => {
      const userId = "test_student_session_eval_1";

      const unlocked = await checkSessionAchievements({
        userId,
        isFirstConcept: true,
        isFirstMastery: true,
        isPerfectAssessment: true,
        conceptsCompletedToday: 3, // SPEED_LEARNER
        questionsAnsweredInSession: 22, // DEEP_THINKER
        streakDays: 7, // STREAK_3_DAYS + STREAK_7_DAYS
        subject: "chemistry",
        masteredConceptsInSubject: 5, // CHEMISTRY_EXPERT
      });

      const unlockedIds = unlocked.map((a) => a.id);
      expect(unlockedIds).toContain("FIRST_CONCEPT");
      expect(unlockedIds).toContain("FIRST_MASTERY");
      expect(unlockedIds).toContain("PERFECT_ASSESSMENT");
      expect(unlockedIds).toContain("SPEED_LEARNER");
      expect(unlockedIds).toContain("DEEP_THINKER");
      expect(unlockedIds).toContain("STREAK_7_DAYS");
      expect(unlockedIds).toContain("CHEMISTRY_EXPERT");
    });
  });

  // ==========================================================================
  // PART 4: PUSH NOTIFICATIONS
  // ==========================================================================
  describe("Push Notifications (pushNotifications.ts)", () => {
    it("requires 3 days of usage before allowing permission prompts", () => {
      const now = Date.now();
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
      const threeDaysAgo = now - 3.1 * 24 * 60 * 60 * 1000;
      const fiveDaysAgo = now - 5 * 24 * 60 * 60 * 1000;

      expect(isEligibleForPushPrompt(now)).toBe(false);
      expect(isEligibleForPushPrompt(twoDaysAgo)).toBe(false);
      expect(isEligibleForPushPrompt(threeDaysAgo)).toBe(true);
      expect(isEligibleForPushPrompt(fiveDaysAgo)).toBe(true);
    });

    it("evaluates quiet hours accurately (10 PM to 7 AM)", () => {
      // 11:30 PM (23:30) is inside quiet hours
      const lateNight = new Date("2026-11-16T23:30:00");
      expect(isQuietHoursActive("22:00", "07:00", lateNight)).toBe(true);

      // 4:00 AM is inside quiet hours
      const earlyMorning = new Date("2026-11-16T04:00:00");
      expect(isQuietHoursActive("22:00", "07:00", earlyMorning)).toBe(true);

      // 2:00 PM is NOT inside quiet hours
      const afternoon = new Date("2026-11-16T14:00:00");
      expect(isQuietHoursActive("22:00", "07:00", afternoon)).toBe(false);
    });

    it("formats student-first Kurdish notification messages", () => {
      expect(PUSH_MESSAGES.STUDY_REMINDER("کیمیا")).toContain("کاتی فێربوونە! کیمیا چاوەڕێتە 📚");
      expect(PUSH_MESSAGES.STREAK_WARNING(5)).toBe("🔥 ئاگر 5 ڕۆژەکەت نەمرێت!");
      expect(PUSH_MESSAGES.WEEKLY_SUMMARY(8)).toBe("هەفتەی تەواو بوو — 8 بابەتت فێربوویت! 🌟");
    });

    it("manages granular opt-in notification preferences", async () => {
      const userId = "test_student_push_prefs_1";
      const initial = await getPushPreferences(userId);
      expect(initial.studyReminderTime).toBe("19:00");
      expect(initial.streakWarningEnabled).toBe(true);

      const updated = await updatePushPreferences(userId, {
        studyReminderTime: "20:30",
        streakWarningEnabled: false,
      });

      expect(updated.studyReminderTime).toBe("20:30");
      expect(updated.streakWarningEnabled).toBe(false);
    });
  });

  // ==========================================================================
  // PART 5: NOTIFICATION ENGINE & IN-APP CENTER
  // ==========================================================================
  describe("Notification Engine (notificationEngine.ts)", () => {
    it("adds in-app notifications and formats Kurdish timestamps", async () => {
      const userId = "test_student_inapp_1";

      const notif = await notificationEngine.addNotification(userId, {
        type: "streak_milestone",
        title: "زنجیرەی بەردەوامی! 🔥",
        message: "٣ ڕۆژە لەسەریەک فێردەبیت",
      });

      expect(notif).not.toBeNull();
      expect(notif?.isRead).toBe(false);

      const list = await notificationEngine.getNotifications(userId);
      expect(list.length).toBe(1);

      const unread = await notificationEngine.getUnreadCount(userId);
      expect(unread).toBe(1);

      // Mark single read
      await notificationEngine.markAsRead(userId, notif!.id);
      const unreadAfter = await notificationEngine.getUnreadCount(userId);
      expect(unreadAfter).toBe(0);

      // Timestamp formatting
      const now = Date.now();
      expect(formatKurdishTimestamp(now, now, false)).toBe("هەر ئێستا");
      expect(formatKurdishTimestamp(now - 15 * 60 * 1000, now, false)).toBe("15 خولەک پێش");
      expect(formatKurdishTimestamp(now - 3 * 3600 * 1000, now, false)).toBe("3 کاتژمێر پێش");
    });

    it("clears all notifications and caps storage at 50 items", async () => {
      const userId = "test_student_inapp_cap_1";

      // Add 55 items
      for (let i = 1; i <= 55; i++) {
        await notificationEngine.addNotification(userId, {
          type: "study_reminder",
          title: `بیرخستنەوەی ${i}`,
          message: `پەیامی ${i}`,
        });
      }

      const list = await notificationEngine.getNotifications(userId);
      expect(list.length).toBeLessThanOrEqual(50);

      // Clear all
      await notificationEngine.clearAll(userId);
      const afterClear = await notificationEngine.getNotifications(userId);
      expect(afterClear.length).toBe(0);
    });
  });
});
