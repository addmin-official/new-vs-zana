import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrainAdminDashboard } from "../../pages/BrainAdminDashboard.tsx";
import { useAppStore } from "../../store/appStore.ts";

vi.mock("../../hooks/useAdminAnomalies.ts", () => {
  return {
    useAdminAnomalies: () => {
      const [anomalies, setAnomalies] = React.useState([
        {
          id: "anom_1",
          studentId: "s1",
          studentName: "سارا ئەحمەد",
          type: "INACTIVE_7_DAYS",
          severity: "HIGH",
          detectedAt: null,
          resolved: false,
          details: { daysInactive: 9 },
        },
      ]);
      return {
        anomalies,
        loading: false,
        error: null,
        resolveAnomaly: vi.fn(async (id: string) => {
          setAnomalies((prev) =>
            prev.map((a) => (a.id === id ? { ...a, resolved: true } : a))
          );
        }),
      };
    },
  };
});

describe("BrainAdminDashboard Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      userRole: "admin",
      user: {
        id: "admin_test",
        name: "بەڕێوەبەری سیستەم",
        email: "admin@zana.krd",
        grade: "12",
        stream: "scientific",
      },
    });
  });

  it("1. Renders Admin Intelligence Dashboard with active session metrics", () => {
    render(<BrainAdminDashboard />);

    expect(screen.getByText(/داشبۆردی بەڕێوەبەرایەتی زانا/i)).toBeInTheDocument();
    expect(screen.getByText(/دانیشتنە چالاکەکان/i)).toBeInTheDocument();
    expect(screen.getByText(/تێکڕای نمرەی لێهاتوویی/i)).toBeInTheDocument();
  });

  it("2. Displays real-time Anomaly Detection alerts in Kurdish", () => {
    render(<BrainAdminDashboard />);

    const anomalyTabBtn = screen.getByRole("button", { name: /ئاگادارییە نائاساییەکان/i });
    fireEvent.click(anomalyTabBtn);

    expect(screen.getByText(/کۆی ئاگادارییەکان/i)).toBeInTheDocument();
  });

  it("3. Displays Struggling Concepts table and subject filter", () => {
    render(<BrainAdminDashboard />);

    const strugglingTabBtn = screen.getByRole("button", { name: /چەمکە سەختەکان/i });
    fireEvent.click(strugglingTabBtn);

    expect(screen.getByText(/فلتەری بابەت/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/گەڕان لە ناوی چەمک/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "کیمیا" })).toBeInTheDocument();
  });

  it("4. Allows admin to mark an anomaly as resolved", () => {
    render(<BrainAdminDashboard />);

    const anomalyTabBtn = screen.getByRole("button", { name: /ئاگادارییە نائاساییەکان/i });
    fireEvent.click(anomalyTabBtn);

    const resolveButtons = screen.getAllByRole("button", { name: /پشتڕاستکردنەوە/i });
    expect(resolveButtons.length).toBeGreaterThan(0);

    fireEvent.click(resolveButtons[0]);
    expect(screen.getAllByText(/چارەسەرکراوە/i).length).toBeGreaterThan(0);
  });
});
