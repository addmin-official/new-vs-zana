import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AchievementToast } from "../../components/AchievementToast.tsx";
import { NotificationCenter } from "../../components/NotificationCenter.tsx";
import { StudentGamificationCard } from "../../components/StudentGamificationCard.tsx";
import { unlockAchievement } from "../../gamification/achievementEngine.ts";
import { notificationEngine } from "../../notifications/notificationEngine.ts";

vi.mock("../../services/firebase.ts", () => ({
  getFirestoreDb: vi.fn(() => null),
  getFirebaseApp: vi.fn(() => null),
  getFirebaseAuth: vi.fn(() => null),
}));

describe("ZANA Engagement UI Components", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("AchievementToast Component", () => {
    it("renders achievement toast when unlocked and shows XP reward", async () => {
      render(<AchievementToast />);

      // Trigger achievement unlock
      await unlockAchievement("test_ui_user_1", "FIRST_CONCEPT");

      // Toast should appear with Kurdish title and XP
      await waitFor(() => {
        expect(screen.getByText("🏆 دەستکەوتی نوێ!")).toBeInTheDocument();
        expect(screen.getByText("یەکەم بابەت فێربووی! 🌱")).toBeInTheDocument();
        expect(screen.getByText("+25 XP")).toBeInTheDocument();
      });
    });

    it("opens achievement detail modal when toast is clicked", async () => {
      render(<AchievementToast />);

      await unlockAchievement("test_ui_user_2", "FIRST_MASTERY");

      await waitFor(() => {
        expect(screen.getByText("یەکەم بابەتت تێگەیشتیت! ⭐")).toBeInTheDocument();
      });

      // Click the toast card
      const toastCard = screen.getByRole("status");
      fireEvent.click(toastCard);

      // Modal should open with supportive Kurdish copy
      await waitFor(() => {
        expect(screen.getByText("دەستکەوتی بەدەستهاتوو 🏆")).toBeInTheDocument();
        expect(screen.getByText("دەستخۆش، بەردەوامبە 👏")).toBeInTheDocument();
      });
    });
  });

  describe("NotificationCenter Component", () => {
    it("renders notification drawer, filter buttons and notification item", async () => {
      const userId = "test_ui_notif_1";
      await notificationEngine.addNotification(userId, {
        type: "study_reminder",
        title: "کاتی فێربوونە! کیمیا چاوەڕێتە 📚",
        message: "پێداچوونەوە بە بابەتی ترشەکان بکە",
        actionLabel: "دەستپێکردنی خوێندن",
        actionUrl: "/practice",
      });

      const handleClose = vi.fn();
      render(
        <NotificationCenter
          isOpen={true}
          onClose={handleClose}
          userId={userId}
        />
      );

      // Verify header and items
      expect(screen.getByText("ئاگادارییەکان")).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText("کاتی فێربوونە! کیمیا چاوەڕێتە 📚")).toBeInTheDocument();
        expect(screen.getByText("دەستپێکردنی خوێندن")).toBeInTheDocument();
      });

      // Close button
      const closeButton = screen.getByLabelText("داخستن");
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("supports marking all notifications as read", async () => {
      const userId = "test_ui_notif_2";
      await notificationEngine.addNotification(userId, {
        type: "streak_milestone",
        title: "٣ ڕۆژ بەردەوامیت! 🔥",
        message: "زنجیرەکەت بپارێزە",
      });

      render(
        <NotificationCenter
          isOpen={true}
          userId={userId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("٣ ڕۆژ بەردەوامیت! 🔥")).toBeInTheDocument();
      });

      // Mark all as read button
      const markAllBtn = screen.getByText("خوێندنەوەی هەمووی");
      fireEvent.click(markAllBtn);

      await waitFor(() => {
        expect(screen.getByText("نەخوێندراوەکان (0)")).toBeInTheDocument();
      });
    });
  });

  describe("StudentGamificationCard Component", () => {
    it("renders level badge, XP bar, fire emoji streak and freeze button", async () => {
      const userId = "test_ui_gamification_1";

      render(
        <StudentGamificationCard
          userId={userId}
          initialXp={750}
          initialStreak={8}
        />
      );

      // Initial state checks
      expect(screen.getByText("ئاستی 2")).toBeInTheDocument();
      expect(screen.getByText("بەڵێن")).toBeInTheDocument();
      expect(screen.getByText(/750 خاڵی ئەزموون/)).toBeInTheDocument();
      expect(screen.getByText(/8 ڕۆژ بەردەوامیت/)).toBeInTheDocument();

      // Freeze button
      const freezeBtn = screen.getByText("وەستاندنی زنجیرە (Freeze)");
      expect(freezeBtn).toBeInTheDocument();

      // Monthly calendar label
      expect(screen.getByText(/خشتەی چالاکی مانگانە/)).toBeInTheDocument();
    });
  });
});
