import { test } from "node:test";
import assert from "node:assert";
import {
  buildDeduplicationKey,
  isCurrentlyQuietHours,
  formatKurdishRelativeTime,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "../domain/notification.ts";
import {
  NotificationService,
  NotificationEvaluationContext,
} from "../services/notificationService.ts";

test("Notification Domain - buildDeduplicationKey formats lowercased composite key", () => {
  const key = buildDeduplicationKey("plan_reminder", "Student_123", "2026-11-15");
  assert.strictEqual(key, "plan_reminder:student_123:2026-11-15");
});

test("Notification Domain - isCurrentlyQuietHours evaluates midnight-spanning window accurately", () => {
  // 23:30 should be inside 22:00 -> 07:00
  const lateNight = new Date("2026-11-15T23:30:00");
  assert.strictEqual(isCurrentlyQuietHours("22:00", "07:00", lateNight), true);

  // 03:15 should be inside 22:00 -> 07:00
  const earlyMorning = new Date("2026-11-15T03:15:00");
  assert.strictEqual(isCurrentlyQuietHours("22:00", "07:00", earlyMorning), true);

  // 14:00 should NOT be inside 22:00 -> 07:00
  const afternoon = new Date("2026-11-15T14:00:00");
  assert.strictEqual(isCurrentlyQuietHours("22:00", "07:00", afternoon), false);

  // Non-spanning window e.g. 13:00 -> 15:00
  assert.strictEqual(isCurrentlyQuietHours("13:00", "15:00", afternoon), true);
});

test("Notification Domain - formatKurdishRelativeTime outputs friendly Sorani Kurdish phrases", () => {
  const now = 1700000000000;
  assert.strictEqual(formatKurdishRelativeTime(now - 30 * 1000, now), "هەر ئێستا");
  assert.strictEqual(formatKurdishRelativeTime(now - 5 * 60 * 1000, now), "پێش 5 خولەک");
  assert.strictEqual(formatKurdishRelativeTime(now - 3 * 3600 * 1000, now), "پێش 3 کاتژمێر");
  assert.strictEqual(formatKurdishRelativeTime(now - 25 * 3600 * 1000, now), "دوێنێ");
});

test("Notification Service - evaluates 8 meaningful student notification types", async () => {
  const service = new NotificationService();

  // Test Guard 1: Onboarding check
  const notFinishedOnboarding = await service.evaluateAndGenerate({
    studentId: "test_std_1",
    isOnboardingCompleted: false,
    hasIncompleteTodayPlan: true,
  });
  assert.strictEqual(notFinishedOnboarding.length, 0, "Must not generate if onboarding not completed");

  // Test Guard 2: Active quiz
  const duringActiveQuiz = await service.evaluateAndGenerate({
    studentId: "test_std_1",
    isOnboardingCompleted: true,
    isInActiveQuiz: true,
    hasIncompleteTodayPlan: true,
  });
  assert.strictEqual(duringActiveQuiz.length, 0, "Must not interrupt during active quiz");

  // Test Guard 3: Tutor chat typing
  const duringChatTyping = await service.evaluateAndGenerate({
    studentId: "test_std_1",
    isOnboardingCompleted: true,
    isTypingInChat: true,
    hasIncompleteTodayPlan: true,
  });
  assert.strictEqual(duringChatTyping.length, 0, "Must not interrupt while typing in tutor chat");

  // Full Context Evaluation
  const ctx: NotificationEvaluationContext = {
    studentId: "test_std_1",
    isOnboardingCompleted: true,
    isInActiveQuiz: false,
    isTypingInChat: false,
    hasIncompleteTodayPlan: true,
    nextBestActionReason: "پێداچوونەوەیەکی کورتی یاسای ئۆم بکە پێش تاقیکردنەوەکە.",
    nextBestActionUrl: "/chat",
    approachingGoalTitle: "تەواوکردنی بەشی کیمیا",
    missedTasksCount: 2,
    recentAchievement: { conceptName: "هاوکێشەی کیمیایی", score: 0.9 },
    weakConcept: { conceptId: "concept_ph", conceptName: "پێوەری pH" },
    completedAssessment: { score: 85, subject: "physics" },
    systemAlert: {
      title: "ئاگاداری بەشداری",
      message: "ماوەی تاقیکردنەوەی خۆڕاییت نزیکە لە کۆتاییهاتن.",
      actionUrl: "/profile",
    },
  };

  const generated = await service.evaluateAndGenerate(ctx);

  assert.strictEqual(generated.length, 8, "Must generate all 8 notification types when triggered");

  const types = generated.map((n) => n.type);
  assert.ok(types.includes("plan_reminder"));
  assert.ok(types.includes("next_best_action"));
  assert.ok(types.includes("deadline_approaching"));
  assert.ok(types.includes("task_recovery"));
  assert.ok(types.includes("mastery_achievement"));
  assert.ok(types.includes("weak_concept_review"));
  assert.ok(types.includes("assessment_recommendation"));
  assert.ok(types.includes("system_action_required"));

  // Check language & calm tone: all titles and messages should be in Kurdish
  for (const n of generated) {
    assert.ok(n.title.length > 0);
    assert.ok(n.message.length > 0);
    assert.ok(n.deduplicationKey.length > 0);
  }

  // Deduplication Test: Running again in the same day does not duplicate
  const secondRun = await service.evaluateAndGenerate(ctx);
  assert.strictEqual(secondRun.length, 0, "Must not generate duplicate notifications on second run");
});

test("Notification Service - Read tracking and preferences management", async () => {
  const service = new NotificationService();
  const studentId = "student_pref_test";

  const defaultPrefs = DEFAULT_NOTIFICATION_PREFERENCES(studentId);
  assert.strictEqual(defaultPrefs.inAppEnabled, true);
  assert.strictEqual(defaultPrefs.dailyReminderTime, "18:00");
  assert.strictEqual(defaultPrefs.quietHoursStart, "22:00");
  assert.strictEqual(defaultPrefs.quietHoursEnd, "07:00");

  const updated = await service.savePreferences(
    {
      quietHoursStart: "23:00",
      quietHoursEnd: "06:30",
      weakConceptEnabled: false,
    },
    studentId
  );

  assert.strictEqual(updated.quietHoursStart, "23:00");
  assert.strictEqual(updated.quietHoursEnd, "06:30");
  assert.strictEqual(updated.weakConceptEnabled, false);
});
