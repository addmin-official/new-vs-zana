import { test, expect } from "@playwright/test";

test.describe("Teacher Dashboard & Report Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem("zana_guest_bypassed", "true");
      window.localStorage.setItem(
        "zana.profile.v1",
        JSON.stringify({
          id: "teacher-e2e-1",
          name: "مامۆستا دلێر کەریم",
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

  test("loads teacher dashboard, verifies class analytics, and exports class report JSON", async ({
    page,
  }) => {
    // 1. Navigate to Teacher Dashboard
    await page.goto("/teacher");

    // Verify main header
    await expect(page.getByText(/داشبۆردی مامۆستا|Teacher Dashboard/i).first()).toBeVisible({
      timeout: 10000,
    });

    // 2. Verify summary metric cards
    await expect(page.getByText(/تێکڕای لێهاتوویی پۆل/i).first()).toBeVisible();
    await expect(page.getByText(/قوتابیانی پێویست بە چاودێری/i).first()).toBeVisible();
    await expect(page.getByText(/کەلێنی چەمکەکان/i).first()).toBeVisible();

    // 3. Export class report JSON
    const downloadPromise = page.waitForEvent("download");
    const exportBtn = page.getByRole("button", { name: /داگرتنی ڕاپۆرتی پۆل/i }).first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/Zana_Class_Report.*\.json$/i);
  });
});
