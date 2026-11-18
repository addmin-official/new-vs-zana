import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileAndSettings } from "../../pages/ProfileAndSettings.tsx";
import { useAppStore } from "../../store/appStore.ts";

vi.mock("../../services/firebase.ts", () => ({
  getFirestoreDb: vi.fn(() => ({})),
  getFirebaseAuth: vi.fn(() => null),
  isFirebaseConfigured: vi.fn(() => false),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false, data: () => null }),
  setDoc: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../hooks/useSoundEffects.ts", () => ({
  useSoundEffects: () => ({
    soundEnabled: true,
    toggleSound: vi.fn(),
    playSuccess: vi.fn(),
    playError: vi.fn(),
    playClick: vi.fn(),
  }),
}));

vi.mock("../../services/subscriptionService.ts", () => ({
  getSubscriptionStatus: vi.fn().mockResolvedValue({ status: "active", planId: "yearly" }),
  submitPaymentReceipt: vi.fn(),
  getMyReceipts: vi.fn().mockResolvedValue([]),
}));

describe("ProfileAndSettings - Data Usage & Privacy Section", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useAppStore.setState({
      userRole: "student",
      user: {
        id: "student-qa-1",
        name: "کاروان ئەحمەد",
        email: "karwan@example.com",
        grade: "12",
        stream: "scientific",
        activeSubject: "chemistry",
        streakDays: 5,
        completedLessons: 12,
        totalScore: 450,
      },
    });
  });

  it("renders tab navigation with 'داتا و تایبەتمەندی' (Data Usage & Privacy)", () => {
    render(<ProfileAndSettings />);
    const privacyTab = screen.getByRole("button", { name: "داتا و تایبەتمەندی" });
    expect(privacyTab).toBeDefined();
  });

  it("switches to Data Usage & Privacy tab and displays cache & personalization controls", async () => {
    render(<ProfileAndSettings />);
    const privacyTab = screen.getByRole("button", { name: "داتا و تایبەتمەندی" });
    fireEvent.click(privacyTab);

    // Verify main section header
    expect(screen.getByText(/بەکارهێنانی داتا و تایبەتمەندی \(Data Usage & Privacy\)/i)).toBeDefined();

    // Verify Local Cache card
    expect(screen.getByText(/کۆگای ناوخۆیی و کاشی ئامێرەکە \(Local Cache Storage\)/i)).toBeDefined();
    expect(screen.getByText(/سڕینەوەی کاشی ناوخۆیی \(Clear Cache\)/i)).toBeDefined();

    // Verify Personalization card
    expect(screen.getByText(/بەڕێوەبردنی داتای کەسیاندن و شێوازی فێربوون \(Personalization Data\)/i)).toBeDefined();
    expect(screen.getByText(/شێوازی سوقراتی/i)).toBeDefined();
    expect(screen.getByText(/ڕوونکردنەوەی تەواو/i)).toBeDefined();
    expect(screen.getByText(/پاشەکەوتکردنی ڕێکخستنی کەسیاندن/i)).toBeDefined();

    // Verify Export Data card
    expect(screen.getByText(/داگرتنی کۆپییەک لە داتاکانم \(Export Learning Data\)/i)).toBeDefined();
  });

  it("opens clear cache modal when clicking clear cache button", async () => {
    render(<ProfileAndSettings />);
    const privacyTab = screen.getByRole("button", { name: "داتا و تایبەتمەندی" });
    fireEvent.click(privacyTab);

    const clearCacheBtn = screen.getByText(/سڕینەوەی کاشی ناوخۆیی \(Clear Cache\)/i);
    fireEvent.click(clearCacheBtn);

    // Modal title appears
    expect(screen.getByText(/سڕینەوەی کاشی ناوخۆیی \(Clear Cache\) 🧹/i)).toBeDefined();
    expect(screen.getByText(/بەڵێ، کاش بسڕەوە/i)).toBeDefined();
  });

  it("allows selecting different tutor pedagogy styles and saves personalization", async () => {
    render(<ProfileAndSettings />);
    const privacyTab = screen.getByRole("button", { name: "داتا و تایبەتمەندی" });
    fireEvent.click(privacyTab);

    // Click Comprehensive style
    const comprehensiveBtn = screen.getByText(/ڕوونکردنەوەی تەواو/i);
    fireEvent.click(comprehensiveBtn);

    // Save personalization
    const saveBtn = screen.getByText(/پاشەکەوتکردنی ڕێکخستنی کەسیاندن/i);
    fireEvent.click(saveBtn);

    // Verify toast appears
    await waitFor(() => {
      expect(screen.getByText(/ڕێکخستنەکانی کەسیاندن بە سەرکەوتوویی پاشەکەوت کران/i)).toBeDefined();
    });
  });
});
