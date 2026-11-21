import { test, expect } from "@playwright/test";

test.describe("Teacher Route Redirection Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem("zana_guest_bypassed", "true");
      window.localStorage.setItem(
        "zana.profile.v1",
        JSON.stringify({
          id: "student-e2e-1",
          name: "قوتابی تاقیکردنەوە",
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

  test("safely redirects obsolete teacher route to home per ZANA platform architecture", async ({
    page,
  }) => {
    // 1. Navigate to obsolete /teacher route
    await page.goto("/teacher");

    // 2. Platform policy permanently routes /teacher to /home
    await expect(page).toHaveURL(/\/home|\/$/);
    await expect(page.getByText(/زانا|Zana/i).first()).toBeVisible({ timeout: 10000 });
  });
});
