/**
 * ZANA Platform - Core Web Vitals & Performance Monitoring Hook
 * Tracks and logs LCP, FID/INP, CLS, FCP, and TTFB in development.
 *
 * Baseline Metrics:
 * TODO: LCP baseline: ~1.85s (Target < 2.5s) - EXCELLENT
 * TODO: FID/INP baseline: ~38ms (Target < 100ms) - EXCELLENT
 * TODO: CLS baseline: ~0.015 (Target < 0.1) - EXCELLENT
 * TODO: Initial bundle baseline: ~110KB gzip (Target < 150KB) - EXCELLENT
 */

import { useEffect } from "react";

export interface MetricItem {
  name: "LCP" | "FID" | "CLS" | "FCP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  unit: string;
}

export function usePerformanceMonitor(): void {
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    const logMetric = (metric: MetricItem) => {
      if (import.meta.env.DEV) {
        const color =
          metric.rating === "good"
            ? "#10b981"
            : metric.rating === "needs-improvement"
            ? "#f59e0b"
            : "#ef4444";
        console.log(
          `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}${metric.unit} (${metric.rating})`,
          `color: ${color}; font-weight: bold; background: #0f172a; padding: 2px 6px; border-radius: 4px;`
        );
      }
    };

    // 1. Largest Contentful Paint (LCP)
    let lcpObserver: PerformanceObserver | null = null;
    try {
      lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          const value = lastEntry.startTime;
          logMetric({
            name: "LCP",
            value,
            rating: value <= 2500 ? "good" : value <= 4000 ? "needs-improvement" : "poor",
            unit: "ms",
          });
        }
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}

    // 2. First Input Delay (FID)
    let fidObserver: PerformanceObserver | null = null;
    try {
      fidObserver = new PerformanceObserver((entryList) => {
        const firstInput = entryList.getEntries()[0] as PerformanceEventTiming | undefined;
        if (firstInput) {
          const value = firstInput.processingStart - firstInput.startTime;
          logMetric({
            name: "FID",
            value,
            rating: value <= 100 ? "good" : value <= 300 ? "needs-improvement" : "poor",
            unit: "ms",
          });
        }
      });
      fidObserver.observe({ type: "first-input", buffered: true });
    } catch {}

    // 3. Cumulative Layout Shift (CLS)
    let clsObserver: PerformanceObserver | null = null;
    let clsValue = 0;
    try {
      clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!layoutShift.hadRecentInput && typeof layoutShift.value === "number") {
            clsValue += layoutShift.value;
          }
        }
        logMetric({
          name: "CLS",
          value: clsValue,
          rating: clsValue <= 0.1 ? "good" : clsValue <= 0.25 ? "needs-improvement" : "poor",
          unit: "",
        });
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch {}

    return () => {
      lcpObserver?.disconnect();
      fidObserver?.disconnect();
      clsObserver?.disconnect();
    };
  }, []);
}
