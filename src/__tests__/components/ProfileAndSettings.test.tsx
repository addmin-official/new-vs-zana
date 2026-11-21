import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileAndSettings } from "../../pages/ProfileAndSettings.tsx";
import { ThemeProvider } from "../../context/ThemeContext.tsx";
import { useAppStore } from "../../store/appStore.ts";

const renderWithTheme = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

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

  it("renders tab navigation with 'تایبەتمەندی' (Data Usage & Privacy)", () => {
    renderWithTheme(<ProfileAndSettings />);
    const privacyTab = screen.getByRole("button", { name: "تایبەتمەندی" });
    expect(privacyTab).toBeDefined();
  });

  it("switches to Data Usage & Privacy tab and displays cache & privacy controls", async () => {
    renderWithTheme(<ProfileAndSettings />);
    const privacyTab = screen.getByRole("button", { name: "تایبەتمەندی" });
    fireEvent.click(privacyTab);

    // Verify main section header
    expect(screen.getByText(/بەکارهێنانی داتا و تایبەتمەندی \(Data Usage & Privacy\)/i)).toBeDefined();

    // Verify Summary Strip
    expect(screen.getByText("کۆی تۆمارەکان")).toBeDefined();
    expect(screen.getByText("قەبارەی ناوخۆیی")).toBeDefined();
    expect(screen.getByText("کاشی کاتی")).toBeDefined();

    // Verify action buttons
    expect(screen.getByText(/پاککردنەوەی کاش \(Clear Cache\)/i)).toBeDefined();
    expect(screen.getByText(/هەناردنی داتاکانم \(Export My Data\)/i)).toBeDefined();

    // Verify Sharing preferences
    expect(screen.getByText(/تایبەتمەندی و بەشکردنی زانیاری/i)).toBeDefined();
    expect(screen.getByText(/ڕێگەپێدان بە مامۆستا بۆ بینینی نمرە و هەڵسەنگاندنەکان/i)).toBeDefined();
    expect(screen.getByText(/ڕێگەپێدان بە باوان بۆ داگرتنی ڕاپۆرتی مانگانە/i)).toBeDefined();
  });

  it("shows confirmation and handles clear cache action", async () => {
    renderWithTheme(<ProfileAndSettings />);
    const privacyTab = screen.getByRole("button", { name: "تایبەتمەندی" });
    fireEvent.click(privacyTab);

    const clearCacheBtn = screen.getByText(/پاککردنەوەی کاش \(Clear Cache\)/i);
    fireEvent.click(clearCacheBtn);

    // Confirmation message and action appears
    expect(screen.getByText(/پاککردنەوەی کاش تەنها داتا کاتییەکان و کاشی وێبگەڕ دەسڕێتەوە/i)).toBeDefined();
    const confirmBtn = screen.getByText(/بەڵێ، کاش پاکبکەرەوە/i);
    expect(confirmBtn).toBeDefined();

    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(screen.getByText(/کاشی ناوخۆیی/i)).toBeDefined();
    });
  });

  it("allows toggling teacher and parent data sharing permissions", async () => {
    renderWithTheme(<ProfileAndSettings />);
    const privacyTab = screen.getByRole("button", { name: "تایبەتمەندی" });
    fireEvent.click(privacyTab);

    const teacherToggle = screen.getByLabelText(/ڕێگەپێدان بە مامۆستا بۆ بینینی نمرە و هەڵسەنگاندنەکان/i) as HTMLInputElement;
    expect(teacherToggle.checked).toBe(true);
    fireEvent.click(teacherToggle);
    expect(teacherToggle.checked).toBe(false);

    const parentToggle = screen.getByLabelText(/ڕێگەپێدان بە باوان بۆ داگرتنی ڕاپۆرتی مانگانە/i) as HTMLInputElement;
    expect(parentToggle.checked).toBe(true);
    fireEvent.click(parentToggle);
    expect(parentToggle.checked).toBe(false);
  });
});
