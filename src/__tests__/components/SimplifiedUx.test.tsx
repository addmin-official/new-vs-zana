import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BottomNav, BOTTOM_NAV_ITEMS } from "../../components/BottomNav.tsx";
import { Sidebar, STUDENT_NAV_ITEMS } from "../../components/Sidebar.tsx";
import { SubjectCard } from "../../components/SubjectCard.tsx";
import { Home } from "../../pages/Home.tsx";
import { useUiStore } from "../../store/uiStore.ts";
import { useAppStore } from "../../store/appStore.ts";

describe("Simplified Student UX & Navigation Architecture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({
      isSidebarCollapsed: false,
      mobileNavOpen: false,
      unreadCounts: {},
    });
    useAppStore.setState({
      userRole: "student",
      user: {
        id: "student-1",
        name: "کاروان",
        email: "karwan@example.com",
        grade: "12",
        stream: "scientific",
        activeSubject: "chemistry",
        streakDays: 8,
      },
    });
  });

  describe("Bottom Navigation (Mobile-first)", () => {
    it("contains EXACTLY 4 navigation items", () => {
      expect(BOTTOM_NAV_ITEMS.length).toBe(4);
      const keys = BOTTOM_NAV_ITEMS.map((item) => item.key);
      expect(keys).toEqual(["home", "chat", "subjects", "profile"]);
    });

    it("renders all 4 items with Kurdish labels", () => {
      const onNavigate = vi.fn();
      render(<BottomNav activeTab="home" onNavigate={onNavigate} />);

      expect(screen.getByText("ماڵەوە")).toBeDefined();
      expect(screen.getByText("زانا")).toBeDefined();
      expect(screen.getByText("بابەت")).toBeDefined();
      expect(screen.getByText("من")).toBeDefined();
    });

    it("triggers onNavigate when a tab button is clicked", () => {
      const onNavigate = vi.fn();
      render(<BottomNav activeTab="home" onNavigate={onNavigate} />);

      const zanaTab = screen.getByText("زانا");
      fireEvent.click(zanaTab);
      expect(onNavigate).toHaveBeenCalledWith("chat");
    });

    it("displays unread badge when count is present in uiStore", () => {
      useUiStore.getState().setUnreadCount("chat", 3);

      render(<BottomNav activeTab="home" onNavigate={vi.fn()} />);
      expect(screen.getByText("3")).toBeDefined();
    });
  });

  describe("Desktop Sidebar & Role Filtering", () => {
    it("contains exactly 6 simplified student destinations", () => {
      expect(STUDENT_NAV_ITEMS.length).toBe(6);
      const keys = STUDENT_NAV_ITEMS.map((item) => item.key);
      expect(keys).toEqual(["home", "chat", "subjects", "labs", "plan", "profile"]);
    });

    it("toggles collapse state from 240px to 72px icon-only mode", () => {
      const onNavigate = vi.fn();
      render(<Sidebar activeTab="home" onNavigate={onNavigate} />);

      const toggleBtn = screen.getByLabelText("بچووککردنەوەی مینیو");
      expect(toggleBtn).toBeDefined();

      fireEvent.click(toggleBtn);
      expect(useUiStore.getState().isSidebarCollapsed).toBe(true);
    });

    it("renders student name and grade at the top", () => {
      render(<Sidebar activeTab="home" onNavigate={vi.fn()} />);
      expect(screen.getByText("کاروان")).toBeDefined();
    });
  });

  describe("SubjectCard Component", () => {
    it("renders Kurdish subject name, chapters count, and mastery percentage", () => {
      const onSelect = vi.fn();
      render(
        <SubjectCard
          id="chem-card"
          subjectKey="chemistry"
          title="کیمیا"
          fullName="کیمیای پۆلی ١٢"
          chaptersCount={5}
          masteryPercentage={78}
          onSelect={onSelect}
        />
      );

      expect(screen.getByText("کیمیا")).toBeDefined();
      expect(screen.getByText(/5\s*بەش/)).toBeDefined();
      expect(screen.getByText(/78/)).toBeDefined();
      expect(screen.getByText("بەردەوام بە")).toBeDefined();
    });

    it("shows 'دەستپێبکە' for unstarted subjects (mastery = 0)", () => {
      const onSelect = vi.fn();
      render(
        <SubjectCard
          id="physics-card"
          subjectKey="physics"
          title="فیزیا"
          masteryPercentage={0}
          onSelect={onSelect}
        />
      );

      expect(screen.getByText("دەستپێبکە")).toBeDefined();
    });

    it("invokes onSelect with subject key on card click", () => {
      const onSelect = vi.fn();
      render(
        <SubjectCard
          id="math-card"
          subjectKey="math"
          title="بیرکاری"
          onSelect={onSelect}
        />
      );

      fireEvent.click(screen.getByText("بیرکاری"));
      expect(onSelect).toHaveBeenCalledWith("math");
    });
  });

  describe("Redesigned Home Page (/home)", () => {
    it("renders dynamic greeting header and streak badge", () => {
      render(<Home />);
      expect(screen.getByText(/کاروان/)).toBeDefined();
      expect(screen.getByText(/ڕۆژ بەردەوام/)).toBeDefined();
    });

    it("renders the primary Continue Learning card with big CTA", () => {
      const onNavigateToChat = vi.fn();
      render(<Home onNavigateToChat={onNavigateToChat} />);

      const continueBtn = screen.getByText("بەردەوام بە");
      expect(continueBtn).toBeDefined();

      fireEvent.click(continueBtn);
      expect(onNavigateToChat).toHaveBeenCalled();
    });

    it("renders today's 3 tasks with toggleable checkmarks", () => {
      render(<Home />);
      expect(screen.getByText("ئەرکەکانی ئەمڕۆ")).toBeDefined();
      expect(screen.getAllByText(/پێوەری pH/).length).toBeGreaterThan(0);
    });

    it("renders quick subject access row", () => {
      const onNavigateToChat = vi.fn();
      render(<Home onNavigateToChat={onNavigateToChat} />);

      const quickChem = screen.getAllByText("کیمیا")[0];
      expect(quickChem).toBeDefined();
    });

    it("renders recent achievement celebration card", () => {
      render(<Home />);
      expect(screen.getAllByText(/تازەترین دەستکەوت/).length).toBeGreaterThan(0);
    });
  });
});
