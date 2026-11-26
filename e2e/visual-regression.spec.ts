import { test, expect } from "@playwright/test";

test.describe("RTL Layout & Visual Presentation Tests", () => {
  test("verifies RTL layout orientation and Kurdish content across public routes and /profile guard", async ({
    page,
  }) => {
    // 1. Public Welcome / Landing Page RTL Check
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("[dir='rtl']").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/زانا/i).first()).toBeVisible();

    // 2. Login Page RTL Check
    await page.goto("/login");
    await expect(page.locator("input[type='email'], input[placeholder*='ئیمەیڵ']").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("[dir='rtl']").first()).toBeVisible();

    // 3. Register Page RTL Check
    await page.goto("/register");
    await expect(page.locator("input[autocomplete='name']").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("[dir='rtl']").first()).toBeVisible();

    // 4. Forgot Password Page RTL Check
    await page.goto("/forgot-password");
    await expect(page.locator("[dir='rtl']").first()).toBeVisible({ timeout: 10000 });

    // 5. Protected /profile Page redirects unauthenticated visitor to /login
    await page.goto("/profile");
    await expect(page.locator("input[type='email'], input[placeholder*='ئیمەیڵ']").first()).toBeVisible({
      timeout: 10000,
    });
    expect(new URL(page.url()).pathname).toBe("/login");
  });
});
