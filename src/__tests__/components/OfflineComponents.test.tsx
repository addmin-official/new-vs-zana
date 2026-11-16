import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OfflineBanner } from "../../components/OfflineBanner.tsx";
import { DownloadManager } from "../../components/DownloadManager.tsx";
import { useOnlineStatus } from "../../hooks/useOnlineStatus.ts";
import { renderHook, act } from "@testing-library/react";

describe("Offline UI Components & Hooks", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("useOnlineStatus Hook", () => {
    it("reports initial online status correctly", () => {
      const { result } = renderHook(() => useOnlineStatus());
      expect(typeof result.current.isOnline).toBe("boolean");
      expect(typeof result.current.pendingSync).toBe("number");
      expect(typeof result.current.verifyConnection).toBe("function");
    });

    it("verifies connection with active heartbeat ping", async () => {
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as any);

      const { result } = renderHook(() => useOnlineStatus());

      let status = false;
      await act(async () => {
        status = await result.current.verifyConnection();
      });

      expect(status).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });

    it("marks offline if heartbeat ping fails", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

      const { result } = renderHook(() => useOnlineStatus());

      let status = true;
      await act(async () => {
        status = await result.current.verifyConnection();
      });

      expect(status).toBe(false);
      expect(result.current.isOnline).toBe(false);
    });
  });

  describe("OfflineBanner Component", () => {
    it("renders persistent indicator badge", () => {
      render(<OfflineBanner />);
      const badge = screen.getByLabelText("دۆخی پەیوەندی");
      expect(badge).toBeInTheDocument();
    });

    it("opens storage & offline details modal on badge click", async () => {
      render(<OfflineBanner />);
      const badge = screen.getByLabelText("دۆخی پەیوەندی");
      fireEvent.click(badge);

      await waitFor(() => {
        expect(screen.getByText("دۆخی ئۆفلاین و یادگە")).toBeInTheDocument();
        expect(screen.getByText("پەیوەندی تۆڕ:")).toBeInTheDocument();
        expect(screen.getByText("گۆڕانکاریی چاوەڕوانکراو:")).toBeInTheDocument();
      });
    });
  });

  describe("DownloadManager Component", () => {
    it("renders offline management dashboard with subject cards", async () => {
      render(<DownloadManager />);

      expect(
        screen.getByText("بەکارهێنانی ئۆفلاین و داونلۆدی پڕۆگرام")
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("بیرکاری")).toBeInTheDocument();
        expect(screen.getByText("کیمیا")).toBeInTheDocument();
      });
    });
  });
});
