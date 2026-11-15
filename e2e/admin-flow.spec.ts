import { test, expect } from "@playwright/test";

test.describe("Admin Intelligence & Anomaly Monitoring Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem("zana_guest_bypassed", "true");
      window.localStorage.setItem(
        "zana.profile.v1",
        JSON.stringify({
          id: "admin-e2e-1",
          name: "بەڕێوەبەری سیستم",
          grade: "12",
          stream: "scientific",
          activeSubject: "chemistry",
          level: "advanced",
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      );
    });
  });

  test("monitors system intelligence metrics, views anomaly alerts, and resolves alert", async ({
    page,
  }) => {
    // 1. Navigate to Admin Dashboard
    await page.goto("/admin");

    await expect(page.getByText(/داشبۆردی سەرپەرشتیاری زانا|Brain Admin/i).first()).toBeVisible({
      timeout: 10000,
    });

    // 2. Verify overview metrics
    await expect(page.getByText(/سێشنی چالاک/i).first()).toBeVisible();
    await expect(page.getByText(/تێکڕای نمرەی لێهاتوویی/i).first()).toBeVisible();

    // 3. Switch to Anomaly Alerts Tab
    const anomalyTabBtn = page.getByRole("button", { name: /ئاگاداری نائاساییەکان/i }).first();
    await expect(anomalyTabBtn).toBeVisible();
    await anomalyTabBtn.click();

    // Verify alert cards are displayed
    const resolveBtn = page.getByRole("button", { name: /چارەسەرکرا/i }).first();
    await expect(resolveBtn).toBeVisible();
    await resolveBtn.click();

    // 4. Switch to Struggling Concepts Tab
    const strugglingTabBtn = page.getByRole("button", { name: /چەمکە لاوازەکان/i }).first();
    await expect(strugglingTabBtn).toBeVisible();
    await strugglingTabBtn.click();

    await expect(page.getByText(/کۆی چەمکە دیاریکراوەکان/i).first()).toBeVisible();
  });
});
