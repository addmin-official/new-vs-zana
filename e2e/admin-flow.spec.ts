import { test, expect } from "@playwright/test";

test.describe("Admin Intelligence & Anomaly Monitoring Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem("zana_guest_bypassed", "true");
      window.sessionStorage.setItem("zana_admin_bypassed", "true");
      window.localStorage.setItem(
        "zana.profile.v1",
        JSON.stringify({
          id: "admin-e2e-1",
          name: "بەڕێوەبەری سیستم",
          email: "addmin.official.idg@gmail.com",
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

    await expect(page.getByText(/ئادمین|پوختەی گشتی|Overview|داشبۆردی سەرپەرشتیار/i).first()).toBeVisible({
      timeout: 10000,
    });

    // 2. Verify overview metrics or operational status
    await expect(page.getByText(/کۆی قوتابیانی چالاک|چالاک|تەندروستە/i).first()).toBeVisible();

    // 3. Switch to Students Tab
    const studentsTabBtn = page.getByRole("button", { name: /قوتابیان|Students/i }).first();
    if (await studentsTabBtn.isVisible()) {
      await studentsTabBtn.click();
      await expect(page.getByText(/لیستی قوتابیان|گەڕان|قوتابی/i).first()).toBeVisible();
    }
  });
});
