import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BarChart, BarSeries, BarDataItem } from "../../components/charts/BarChart.tsx";
import { LineChart, LinePoint } from "../../components/charts/LineChart.tsx";

describe("SVG Chart Components (BarChart & LineChart)", () => {
  const mockBarSeries: BarSeries[] = [
    { key: "correct", labelKu: "دروست", color: "#10b981" },
    { key: "incorrect", labelKu: "هەڵە", color: "#ef4444" },
  ];

  const mockBarData: BarDataItem[] = [
    { label: "کیمیا", values: { correct: 80, incorrect: 20 } },
    { label: "فیزیا", values: { correct: 65, incorrect: 35 } },
    { label: "بیرکاری", values: { correct: 90, incorrect: 10 } },
  ];

  const mockLineData: LinePoint[] = [
    { xLabel: "١ تشرین", yValue: 120 },
    { xLabel: "٢ تشرین", yValue: 150 },
    { xLabel: "٣ تشرین", yValue: 190 },
  ];

  it("1. BarChart renders SVG element with bars and Kurdish labels", () => {
    const { container } = render(
      <BarChart
        data={mockBarData}
        series={mockBarSeries}
        title="دابەشبوونی نمرەکان بەپێی بابەت"
        stacked={true}
      />
    );

    expect(screen.getByText(/دابەشبوونی نمرەکان بەپێی بابەت/i)).toBeInTheDocument();
    expect(screen.getByText(/کیمیا/i)).toBeInTheDocument();
    expect(screen.getByText(/فیزیا/i)).toBeInTheDocument();
    expect(screen.getByText(/بیرکاری/i)).toBeInTheDocument();

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    const rects = container.querySelectorAll("rect");
    expect(rects.length).toBeGreaterThan(0);

    // Test hover on a bar segment
    fireEvent.mouseEnter(rects[0]);
    fireEvent.mouseLeave(rects[0]);
  });

  it("2. BarChart renders grouped (non-stacked) bars and handles hover interaction", () => {
    const { container } = render(
      <BarChart
        data={mockBarData}
        series={mockBarSeries}
        stacked={false}
        title="شیکاری بەراوردکاری"
      />
    );

    expect(screen.getByText(/شیکاری بەراوردکاری/i)).toBeInTheDocument();
    const rects = container.querySelectorAll("rect");
    expect(rects.length).toBeGreaterThan(0);

    // Hover non-stacked bar
    fireEvent.mouseEnter(rects[1]);
    fireEvent.mouseLeave(rects[1]);
  });

  it("3. BarChart handles empty data gracefully", () => {
    render(
      <BarChart
        data={[]}
        series={mockBarSeries}
        title="چارتێکی بەتاڵ"
      />
    );
    expect(screen.getByText(/چارتێکی بەتاڵ/i)).toBeInTheDocument();
  });

  it("4. LineChart renders SVG path lines and axis points with mock DAU data", () => {
    const { container } = render(
      <LineChart
        data={mockLineData}
        title="قوتابیانی چالاکی ڕۆژانە (DAU)"
      />
    );

    expect(screen.getByText(/قوتابیانی چالاکی ڕۆژانە/i)).toBeInTheDocument();
    expect(screen.getByText(/١ تشرین/i)).toBeInTheDocument();

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThan(0);

    const circles = container.querySelectorAll("circle");
    if (circles.length > 0) {
      fireEvent.mouseEnter(circles[0]);
      fireEvent.mouseLeave(circles[0]);
    }
  });

  it("5. LineChart handles empty data gracefully", () => {
    render(
      <LineChart
        data={[]}
        title="هێڵی بەتاڵ"
      />
    );
    expect(screen.getByText(/زانیاری بەردەست نییە/i)).toBeInTheDocument();
  });
});
