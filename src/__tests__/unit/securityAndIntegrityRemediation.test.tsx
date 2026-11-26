import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ProtectedStudentRoute } from "../../routes/ProtectedStudentRoute.tsx";
import { getCurrentUser } from "../../services/authService.ts";
import { useAppStore } from "../../store/appStore.ts";
import { StudyRooms } from "../../pages/StudyRooms.tsx";
import * as studyRoomApi from "../../services/studyRoomApi.ts";

vi.mock("../../services/firebase.ts", () => ({
  getFirebaseAuth: vi.fn(() => null),
  getFirestoreDb: vi.fn(() => null),
  isFirebaseConfigured: vi.fn(() => false),
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

describe("ZANA Security & Data Integrity Remediation Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("ProtectedStudentRoute never renders private profile while auth is loading and redirects when unauthenticated", () => {
    const onUnauth = vi.fn();
    const { rerender } = render(
      <ProtectedStudentRoute
        authLoading={true}
        isAuthenticated={false}
        loadingFallback={<div>Loading Auth...</div>}
        onUnauthenticated={onUnauth}
      >
        <div>Private Profile</div>
      </ProtectedStudentRoute>
    );
    expect(screen.getByText("Loading Auth...")).toBeInTheDocument();
    expect(screen.queryByText("Private Profile")).toBeNull();
    expect(onUnauth).not.toHaveBeenCalled();

    rerender(
      <ProtectedStudentRoute
        authLoading={false}
        isAuthenticated={false}
        loadingFallback={<div>Loading Auth...</div>}
        onUnauthenticated={onUnauth}
      >
        <div>Private Profile</div>
      </ProtectedStudentRoute>
    );
    expect(screen.queryByText("Private Profile")).toBeNull();
    expect(onUnauth).toHaveBeenCalledTimes(1);

    rerender(
      <ProtectedStudentRoute
        authLoading={false}
        isAuthenticated={true}
        loadingFallback={<div>Loading Auth...</div>}
        onUnauthenticated={onUnauth}
      >
        <div>Private Profile</div>
      </ProtectedStudentRoute>
    );
    expect(screen.getByText("Private Profile")).toBeInTheDocument();
  });

  it("getCurrentUser ignores forged localStorage auth entries when Firebase Auth has no session", () => {
    localStorage.setItem(
      "zana_auth_user_v1",
      JSON.stringify({ uid: "spoofed_uid", email: "spoof@example.com", isAnonymous: false })
    );
    expect(getCurrentUser()).toBeNull();
  });

  it("appStore.setActiveSubject supports browsing another grade without mutating permanent user.grade", () => {
    useAppStore.setState({
      user: {
        id: "uid_12",
        name: "ئاری",
        email: "ari@example.com",
        grade: "12",
        stream: "scientific",
        activeSubject: "chemistry",
      },
    });
    useAppStore.getState().setActiveSubject("physics", "10");
    const updated = useAppStore.getState().user;
    expect(updated.activeSubject).toBe("physics");
    expect(updated.grade).toBe("12");
  });

  it("StudyRooms removes all fabricated rooms/peers and displays honest Kurdish empty & error/retry states", async () => {
    const fetchSpy = vi.spyOn(studyRoomApi, "fetchStudyRooms").mockResolvedValueOnce([]);
    render(<StudyRooms />);

    await waitFor(() => {
      expect(screen.getByText("لە ئێستادا هیچ ژوورێکی خوێندنی چالاک نییە.")).toBeInTheDocument();
    });

    expect(screen.queryByText(/محمد علی/)).toBeNull();
    expect(screen.queryByText(/فاتمة کاروان/)).toBeNull();
    expect(screen.queryByText(/حسن هەڵگورد/)).toBeNull();
    expect(screen.queryByText(/سارا ڕەحیم/)).toBeNull();
    expect(screen.queryByText(/گرووپی خوێندنی کیمیای پۆلی ١٢/)).toBeNull();

    // Verify error & retry state
    fetchSpy.mockRejectedValueOnce(new Error("Network error"));
    fireEvent.click(screen.getByRole("button", { name: /نوێکردنەوە/ }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /دووبارە هەوڵدانەوە/ })).toBeInTheDocument();
  });
});
