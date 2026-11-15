import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudyPathManager } from "../../pages/StudyPathManager.tsx";
import { useAppStore } from "../../store/appStore.ts";

describe("StudyPathManager Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      userRole: "student",
      user: {
        id: "std_plan_test",
        name: "دڵنیا ساڵح",
        email: "dilnya@zana.krd",
        grade: "12",
        stream: "scientific",
      },
      userProgress: {
        streak: 5,
        lessonsCompleted: 14,
        totalScore: 1200,
      },
    });
  });

  it("1. Renders Study Path Manager with header and navigation tabs in Kurdish", () => {
    render(<StudyPathManager />);

    expect(screen.getByText(/ڕێڕەو و کاتژمێری خوێندنی قوتابی/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ئەرکەکانی ئەمڕۆ/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /خشتەی ٧ ڕۆژە/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /نەخشەی مەعریفە/i })).toBeInTheDocument();
  });

  it("2. Switches to Knowledge Graph tab and displays concept dependency tree", () => {
    render(<StudyPathManager />);

    const graphTabBtn = screen.getByRole("button", { name: /نەخشەی مەعریفە/i });
    fireEvent.click(graphTabBtn);

    expect(screen.getByText(/نەخشەی مەعریفەی چەمکەکان/i)).toBeInTheDocument();
    expect(screen.getByText(/تۆڕی پێداویستییە سەرەتاییەکان/i)).toBeInTheDocument();
  });

  it("3. Switches to 7-Day Weekly Plan tab and renders plan details", () => {
    render(<StudyPathManager />);

    const weeklyTabBtn = screen.getByRole("button", { name: /خشتەی ٧ ڕۆژە/i });
    fireEvent.click(weeklyTabBtn);

    expect(screen.getByText(/کاتژمێرەکانی خوێندراو لەم هەفتەیەدا/i)).toBeInTheDocument();
    expect(screen.getByText(/ڕێژەی گەیشتن بە ئامانج/i)).toBeInTheDocument();
  });

  it("4. Switches to Progress Forecasting tab and renders momentum score", () => {
    render(<StudyPathManager />);

    const forecastTabBtn = screen.getByRole("button", { name: /پێشبینی و خێرایی/i });
    fireEvent.click(forecastTabBtn);

    expect(screen.getAllByText(/هاندان/i).length).toBeGreaterThan(0);
  });
});
