import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileAndSettings } from "../../pages/ProfileAndSettings.tsx";
import { DataPrivacySection } from "../../features/student/DataPrivacySection.tsx";
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
  fetchServerStudentProfile: vi.fn().mockResolvedValue({
    ok: true,
    exists: true,
    onboardingCompleted: true,
    student: {
      id: "student-qa-1",
      name: "کاروان ئەحمەد",
      email: "karwan@example.com",
      schoolName: "ئامادەیی کوردستان",
      grade: "12",
      stream: "scientific",
    },
  }),
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

  it("displays student-friendly privacy dashboard and hides internal storage keys from students even if store role is tampered", async () => {
    localStorage.setItem("zana_last_online_timestamp", "1795683237097");
    localStorage.setItem("zana_session_recovery_v1", JSON.stringify({ step: 1 }));
    localStorage.setItem("zana.profile.v1", JSON.stringify({ id: "student-qa-1", name: "کاروان ئەحمەد" }));
    // Client-side Zustand userRole tampering must NOT expose Developer Diagnostics
    useAppStore.setState({ userRole: "admin" });

    const { container } = renderWithTheme(<ProfileAndSettings />);
    fireEvent.click(screen.getByRole("button", { name: "تایبەتمەندی" }));

    // Preserve Sorani RTL layout
    expect(container.querySelector("[dir='rtl']")).not.toBeNull();

    // Student-friendly header, status, summary, and categories
    expect(screen.getByText("پاراستنی داتا و تایبەتمەندی")).toBeInTheDocument();
    expect(screen.getByText("پارێزراو")).toBeInTheDocument();
    expect(screen.getByText("زانیارییە هەڵگیراوەکان")).toBeInTheDocument();
    expect(screen.getByText("دۆخی هاوکاتکردن")).toBeInTheDocument();
    expect(screen.getByText("جۆرەکانی زانیاری")).toBeInTheDocument();
    expect(screen.getByText("ناسنامە و پڕۆفایل")).toBeInTheDocument();
    expect(screen.getByText("پێشکەوتنی خوێندن")).toBeInTheDocument();
    expect(screen.getByText("چات و یارمەتیی زیرەکی دەستکرد")).toBeInTheDocument();
    expect(screen.getByText("کاش و داتای کاتی")).toBeInTheDocument();

    // Student controls & available-data export semantics
    expect(screen.getByText("کۆنترۆڵی داتاکانت")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "پاککردنەوەی کاش" })).toBeInTheDocument();
    const exportBtn = screen.getByRole("button", { name: "داگرتنی داتای بەردەست" });
    expect(exportBtn).toBeInTheDocument();
    expect(
      screen.getByText(/تۆمارەکانی سەر سێرڤەر \(وەک بەشداریکردن و پسووڵەی پارەدان\) لەم فایلەدا نین/)
    ).toBeInTheDocument();

    // Test export action feedback explicitly excludes server-side records
    const createObjectUrlOrig = URL.createObjectURL;
    const revokeObjectUrlOrig = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:zana-test-export");
    URL.revokeObjectURL = vi.fn();
    try {
      fireEvent.click(exportBtn);
      expect(screen.getByRole("status")).toHaveTextContent(/تۆمارەکانی سەر سێرڤەر لەم فایلەدا نین/);
    } finally {
      URL.createObjectURL = createObjectUrlOrig;
      URL.revokeObjectURL = revokeObjectUrlOrig;
    }

    // Internal storage keys, technical jargon, and National ID references must NEVER be shown in Student View
    expect(screen.queryByText(/zana_last_online_timestamp/)).toBeNull();
    expect(screen.queryByText(/zana_session_recovery_v1/)).toBeNull();
    expect(screen.queryByText(/zana\.profile\.v1/)).toBeNull();
    expect(screen.queryByText(/Developer Diagnostics/)).toBeNull();
    expect(screen.queryByText(/localStorage|sessionStorage|Firebase|Cloudflare|Worker|D1/i)).toBeNull();
    expect(screen.queryByText(/کارتی نیشتمانی|national.?id/i)).toBeNull();

    // Expand 'ناسنامە و پڕۆفایل' details to confirm verified student identity values
    const detailButtons = screen.getAllByRole("button", { name: "وردەکاری" });
    fireEvent.click(detailButtons[0]);
    await waitFor(() => {
      expect(screen.getAllByText("کاروان ئەحمەد").length).toBeGreaterThan(0);
      expect(screen.getByText("karwan@example.com")).toBeInTheDocument();
      expect(screen.getByText("ئامادەیی کوردستان")).toBeInTheDocument();
    });

    // Expand 'پێشکەوتنی خوێندن' details to confirm registered classification
    let nextDetailButtons = screen.getAllByRole("button", { name: "وردەکاری" });
    fireEvent.click(nextDetailButtons[0]);
    await waitFor(() => {
      expect(screen.getAllByText(/پۆلی 12 • زانستی/).length).toBeGreaterThan(0);
    });

    // Expand 'چات و یارمەتیی زیرەکی دەستکرد' (row index 2 -> button index 1 while row index 1 is expanded)
    nextDetailButtons = screen.getAllByRole("button", { name: "وردەکاری" });
    fireEvent.click(nextDetailButtons[1]);
    expect(
      screen.getByText(/ژمارەی کۆی گفتوگۆکانی سەر سێرڤەر لێرەدا هەژمار نەکراوە/)
    ).toBeInTheDocument();
  });

  it("shows confirmation, preserves auth and protected student data, and issues zero server requests when clearing cache", async () => {
    localStorage.setItem("zana_last_online_timestamp", "1795683237097");
    localStorage.setItem("zana.profile.v1", JSON.stringify({ id: "student-qa-1", name: "کاروان ئەحمەد" }));
    localStorage.setItem("zana:progress-state", JSON.stringify({ completedLessons: 12 }));
    localStorage.setItem("firebase:authUser:default", JSON.stringify({ uid: "student-qa-1" }));

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    renderWithTheme(<ProfileAndSettings />);
    fireEvent.click(screen.getByRole("button", { name: "تایبەتمەندی" }));

    fireEvent.click(screen.getByRole("button", { name: "پاککردنەوەی کاش" }));

    expect(
      screen.getByText(/پاککردنەوەی کاش تەنها داتا کاتییەکان و کاشی وێبگەڕ لەسەر ئەم ئامێرە دەسڕێتەوە/)
    ).toBeInTheDocument();

    fetchSpy.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "بەڵێ، کاش پاکبکەرەوە" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/کاشی کاتیی ئامێرەکەت بە سەرکەوتوویی پاککرایەوە/);
    });

    // Only temporary cache key is removed; profile, progress, and auth keys remain intact with zero server mutations
    expect(localStorage.getItem("zana_last_online_timestamp")).toBeNull();
    expect(localStorage.getItem("zana.profile.v1")).not.toBeNull();
    expect(localStorage.getItem("zana:progress-state")).not.toBeNull();
    expect(localStorage.getItem("firebase:authUser:default")).not.toBeNull();
    const serverMutations = fetchSpy.mock.calls.filter(([url, init]) => {
      const method = (init?.method || "GET").toUpperCase();
      return method !== "GET" || !String(url).includes("/api/notifications/preferences");
    });
    expect(serverMutations).toHaveLength(0);
    fetchSpy.mockRestore();
  });

  it("exposes Developer Diagnostics only when authorized admin/developer flag is explicitly enabled", () => {
    localStorage.setItem("zana_last_online_timestamp", "1795683237097");

    renderWithTheme(
      <DataPrivacySection
        profile={{
          id: "admin-1",
          name: "بەڕێوەبەر",
          grade: "12",
          stream: "scientific",
          activeSubject: "chemistry",
          level: "advanced",
          onboardingCompleted: true,
          createdAt: "2026-11-01T00:00:00.000Z",
          updatedAt: "2026-11-01T00:00:00.000Z",
          authoritative: true,
          source: "server-authoritative",
        }}
        masteryProfile={null}
        canViewDeveloperDiagnostics={true}
      />
    );

    const diagBtn = screen.getByRole("button", { name: /Developer Diagnostics/i });
    expect(diagBtn).toBeInTheDocument();
    fireEvent.click(diagBtn);
    expect(screen.getByText("zana_last_online_timestamp")).toBeInTheDocument();
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

  it("displays authoritative schoolName from server profile and never renders hardcoded chemistry mastery topics", async () => {
    renderWithTheme(
      <ProfileAndSettings
        profile={{
          id: "student-qa-1",
          name: "کاروان ئەحمەد",
          grade: "12",
          stream: "scientific",
          activeSubject: "chemistry",
          level: "intermediate",
          onboardingCompleted: true,
          createdAt: "2026-11-01T00:00:00.000Z",
          updatedAt: "2026-11-01T00:00:00.000Z",
          authoritative: true,
          source: "server-authoritative",
        }}
      />
    );
    await waitFor(() => {
      expect(screen.getByText("ئامادەیی کوردستان")).toBeInTheDocument();
    });
    expect(screen.queryByText(/ترش و تفتەکان \(تیۆری برۆنستد\)/)).toBeNull();
    expect(screen.getByText(/هێشتا هیچ چەمکێک هەڵنەسەنگێندراوە/)).toBeInTheDocument();
  });
});
