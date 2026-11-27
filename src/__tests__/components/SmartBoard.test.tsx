import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "../../context/ThemeContext.tsx";
import { ProfileAndSettings } from "../../pages/ProfileAndSettings.tsx";
import { ZanaSmartBoard } from "../../features/smartboard/ZanaSmartBoard.tsx";
import {
  SMART_BOARD_ENABLED_KEY,
  clampPositionToViewport,
  setSmartBoardEnabled,
  syncSmartBoardPreferenceFromStorage,
} from "../../features/smartboard/smartBoardPreference.ts";
import { SMART_BOARD_SESSION_KEY } from "../../features/smartboard/smartBoardStorage.ts";
import { i18n } from "../../i18n/i18n.ts";

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
    exists: false,
  }),
  submitPaymentReceipt: vi.fn(),
  getMyReceipts: vi.fn().mockResolvedValue([]),
}));

const renderWithTheme = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

function drawStroke(
  surface: HTMLElement,
  points: { x: number; y: number }[],
  pointerType: "mouse" | "touch" | "pen" = "mouse"
) {
  const first = points[0];
  fireEvent.pointerDown(surface, {
    clientX: first.x,
    clientY: first.y,
    pointerId: 1,
    pointerType,
    button: 0,
  });
  for (let i = 1; i < points.length; i++) {
    fireEvent.pointerMove(surface, {
      clientX: points[i].x,
      clientY: points[i].y,
      pointerId: 1,
      pointerType,
    });
  }
  const last = points[points.length - 1];
  fireEvent.pointerUp(surface, {
    clientX: last.x,
    clientY: last.y,
    pointerId: 1,
    pointerType,
  });
}

describe("ZANA Smart Board Feature", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    syncSmartBoardPreferenceFromStorage();
    i18n.setLocale("ckb");
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hides Smart Board launcher when disabled and reveals it immediately when enabled from Settings", () => {
    renderWithTheme(
      <>
        <ProfileAndSettings />
        <ZanaSmartBoard />
      </>
    );

    // Disabled by default
    expect(screen.queryByTestId("smartboard-launcher")).toBeNull();

    // Navigate to Preferences tab and toggle Smart Board ON
    fireEvent.click(screen.getByRole("button", { name: "هەڵبژاردەکان" }));
    expect(screen.getAllByText("ئامرازەکانی تەختەی زیرەک").length).toBeGreaterThan(0);

    const toggle = screen.getByTestId("smartboard-settings-toggle");
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(localStorage.getItem(SMART_BOARD_ENABLED_KEY)).toBe("true");
    expect(screen.getByTestId("smartboard-launcher")).toBeInTheDocument();

    // Disable again cleanly removes launcher and annotation overlay
    fireEvent.click(toggle);
    expect(localStorage.getItem(SMART_BOARD_ENABLED_KEY)).toBe("false");
    expect(screen.queryByTestId("smartboard-launcher")).toBeNull();
  });

  it("supports pen, highlighter, line, shapes, eraser, undo/redo, and clear-all confirmation", () => {
    setSmartBoardEnabled(true);
    renderWithTheme(<ZanaSmartBoard />);

    const launcher = screen.getByTestId("smartboard-launcher");
    fireEvent.pointerDown(launcher, { clientX: 50, clientY: 50, pointerId: 1, button: 0 });
    fireEvent.pointerUp(launcher, { clientX: 50, clientY: 50, pointerId: 1 });

    const toolbar = screen.getByTestId("smartboard-toolbar");
    const surface = screen.getByTestId("smartboard-annotation-surface");
    expect(toolbar).toBeInTheDocument();
    expect(surface).toHaveStyle({ touchAction: "none" });

    // 1. Draw with Pen (touch input)
    drawStroke(
      surface,
      [
        { x: 20, y: 20 },
        { x: 60, y: 50 },
        { x: 100, y: 80 },
      ],
      "touch"
    );
    expect(surface.querySelectorAll("[data-annotation-id]")).toHaveLength(1);

    // 2. Switch to Highlighter (pen stylus input)
    fireEvent.click(screen.getByRole("button", { name: "هایلایتەر" }));
    drawStroke(
      surface,
      [
        { x: 120, y: 120 },
        { x: 220, y: 120 },
      ],
      "pen"
    );
    const itemsAfterHighlight = surface.querySelectorAll("[data-annotation-id]");
    expect(itemsAfterHighlight).toHaveLength(2);
    expect(itemsAfterHighlight[1]).toHaveAttribute("stroke-opacity", "0.38");

    // 3. Draw Line
    fireEvent.click(screen.getByRole("button", { name: "هێڵی ڕاست" }));
    drawStroke(surface, [
      { x: 10, y: 200 },
      { x: 200, y: 200 },
    ]);
    expect(surface.querySelectorAll("line[data-annotation-id]")).toHaveLength(1);

    // 4. Draw Shapes (Rectangle, Circle, Arrow)
    fireEvent.click(screen.getByRole("button", { name: "شێوەکان" }));
    fireEvent.click(screen.getByRole("button", { name: "چوارگۆشە" }));
    drawStroke(surface, [
      { x: 50, y: 250 },
      { x: 150, y: 320 },
    ]);
    expect(surface.querySelectorAll("rect[data-annotation-id]")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "شێوەکان" }));
    fireEvent.click(screen.getByRole("button", { name: "بازنە" }));
    drawStroke(surface, [
      { x: 250, y: 250 },
      { x: 330, y: 330 },
    ]);
    expect(surface.querySelectorAll("ellipse[data-annotation-id]")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "شێوەکان" }));
    fireEvent.click(screen.getByRole("button", { name: "تیر" }));
    drawStroke(surface, [
      { x: 350, y: 350 },
      { x: 420, y: 390 },
    ]);
    expect(surface.querySelectorAll("g[data-annotation-id]")).toHaveLength(1);
    expect(surface.querySelectorAll("[data-annotation-id]")).toHaveLength(6);

    // Verify sessionStorage persisted bounded session history
    expect(sessionStorage.getItem(SMART_BOARD_SESSION_KEY)).not.toBeNull();

    // 5. Undo & Redo
    fireEvent.click(screen.getByRole("button", { name: "گەڕانەوە" }));
    expect(surface.querySelectorAll("[data-annotation-id]")).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "دووبارەکردنەوە" }));
    expect(surface.querySelectorAll("[data-annotation-id]")).toHaveLength(6);

    // 6. Eraser hits the straight line around (100, 200) and removes only that item
    fireEvent.click(screen.getByRole("button", { name: "سڕەرەوە" }));
    drawStroke(surface, [{ x: 100, y: 200 }]);
    expect(surface.querySelectorAll("[data-annotation-id]")).toHaveLength(5);
    expect(surface.querySelectorAll("line[data-annotation-id]")).toHaveLength(0);

    // 7. Clear All requires confirmation before wiping annotations
    fireEvent.click(screen.getByRole("button", { name: "سڕینەوەی هەمووی" }));
    expect(screen.getByTestId("smartboard-clear-confirm")).toBeInTheDocument();
    expect(surface.querySelectorAll("[data-annotation-id]")).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "بەڵێ، بیسڕەوە" }));
    expect(surface.querySelectorAll("[data-annotation-id]")).toHaveLength(0);
    expect(sessionStorage.getItem(SMART_BOARD_SESSION_KEY)).toBeNull();
  });

  it("supports Focus Pointer, Presentation Mode, passthrough browse mode, and Escape exits", () => {
    setSmartBoardEnabled(true);
    renderWithTheme(
      <div>
        <input aria-label="search-box" />
        <ZanaSmartBoard />
      </div>
    );

    // Keyboard open from launcher
    fireEvent.click(screen.getByTestId("smartboard-launcher"));
    const surface = screen.getByTestId("smartboard-annotation-surface");

    // Focus Pointer shows spotlight while moving, without creating persistent stroke items
    fireEvent.click(screen.getByRole("button", { name: "ئاماژەدەری تەرکیز" }));
    fireEvent.pointerMove(surface, { clientX: 240, clientY: 160, pointerId: 2 });
    expect(screen.getByTestId("smartboard-focus-pointer")).toBeInTheDocument();
    expect(surface.querySelectorAll("[data-annotation-id]")).toHaveLength(0);

    // Presentation Mode adds focus backdrop
    fireEvent.click(screen.getByRole("button", { name: "دۆخی پێشکەشکردن" }));
    expect(screen.getByTestId("smartboard-presentation-backdrop")).toBeInTheDocument();

    // First Escape returns to Browse/passthrough mode (pointer-events-none)
    fireEvent.keyDown(window, { key: "Escape" });
    expect(surface).toHaveClass("pointer-events-none");
    expect(surface).toHaveStyle({ touchAction: "auto" });

    // Keystrokes inside an <input> are never intercepted by Smart Board shortcuts
    const input = screen.getByLabelText("search-box");
    input.focus();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByTestId("smartboard-toolbar")).toBeInTheDocument();

    // Second Escape outside input closes toolbar cleanly back to launcher
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("smartboard-toolbar")).toBeNull();
    expect(screen.getByTestId("smartboard-launcher")).toBeInTheDocument();
  });

  it("exports local PNG snapshot without external network calls and renders Arabic RTL localization", async () => {
    i18n.setLocale("ar");
    setSmartBoardEnabled(true);

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const mockCtx = {
      scale: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      strokeRect: vi.fn(),
      ellipse: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      lineCap: "round",
      lineJoin: "round",
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(mockCtx);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,AAA");
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    renderWithTheme(<ZanaSmartBoard />);

    const launcher = screen.getByTestId("smartboard-launcher");
    expect(launcher).toHaveTextContent("السبورة الذكية");
    fireEvent.click(launcher);

    const toolbar = screen.getByTestId("smartboard-toolbar");
    expect(toolbar).toHaveAttribute("dir", "rtl");

    const surface = screen.getByTestId("smartboard-annotation-surface");
    drawStroke(surface, [
      { x: 10, y: 10 },
      { x: 40, y: 40 },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "تصدير لقطة" }));
    const statusEl = await screen.findByRole("status");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(statusEl).toHaveTextContent("تم تنزيل صورة السبورة بنجاح");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("clamps floating launcher and toolbar positions strictly inside narrow mobile viewports", () => {
    const mobileClamped = clampPositionToViewport(
      { x: 9999, y: -500 },
      { width: 168, height: 46 },
      { width: 375, height: 667 },
      12
    );
    expect(mobileClamped.x).toBe(375 - 168 - 12);
    expect(mobileClamped.y).toBe(12);

    const negativeXClamped = clampPositionToViewport(
      { x: -120, y: 999 },
      { width: 320, height: 112 },
      { width: 375, height: 667 },
      12
    );
    expect(negativeXClamped.x).toBe(12);
    expect(negativeXClamped.y).toBe(667 - 112 - 12);
  });
});
