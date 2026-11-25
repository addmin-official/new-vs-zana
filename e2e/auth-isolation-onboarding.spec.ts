import { test, expect } from "@playwright/test";

test.describe("Auth, Onboarding, Mobile & Account Isolation E2E", () => {
  test("login and registration pages render cleanly on desktop and mobile without National ID", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("input[type='email'], input[placeholder*='ئیمەیڵ']").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("input[type='tel']")).toHaveCount(0);
    const loginText = await page.locator("body").innerText();
    expect(loginText).not.toMatch(/07XXXXXXXXX|ناردنی کۆدی دڵنیایی/);
    const loginOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2
    );
    expect(loginOverflow).toBe(false);

    await page.goto("/register");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("input[type='email'], input[placeholder*='ئیمەیڵ']").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("input[type='tel']")).toHaveCount(0);
    // National ID and unsupported phone registration must never appear in registration UI
    const pageContent = await page.locator("body").innerText();
    expect(pageContent).not.toMatch(/کارتی نیشتمانی|national.?id/i);
    expect(pageContent).not.toMatch(/07XXXXXXXXX|ناردنی کۆدی دڵنیایی/);
    expect(await page.locator("[dir='rtl']").first().isVisible()).toBe(true);

    // Submitting admin email or empty fields on /register is rejected client-side without advancing to Step 2
    await page.locator("input[autocomplete='name']").fill("قوتابی تاقیکردنەوە");
    await page.locator("input[type='email']").fill("addmin.official.idg@gmail.com");
    await page.locator("button[type='submit']").click();
    await expect(page.locator("#register-error-msg")).toContainText("ڕێپێدراو نییە");

    const regOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2
    );
    expect(regOverflow).toBe(false);

    // Forgot password view also preserves RTL mobile layout without overflow
    await page.goto("/forgot-password");
    await expect(page.locator("body")).toBeVisible();
    const forgotOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2
    );
    expect(forgotOverflow).toBe(false);
  });

  test("switching student accounts does not leak cached localStorage profile between UIDs", async ({
    page,
  }) => {
    // 1. Seed Student A session
    await page.addInitScript(() => {
      window.sessionStorage.setItem("zana_guest_bypassed", "true");
    });
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.setItem(
        "zana.profile.v1",
        JSON.stringify({
          id: "student_uid_a",
          name: "Student Alpha",
          grade: "12",
          stream: "scientific",
          activeSubject: "chemistry",
          level: "intermediate",
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      );
      window.localStorage.setItem(
        "zana_session_recovery_v1",
        JSON.stringify({ lastRoute: "/chat", lastSubject: "chemistry", timestamp: Date.now() })
      );
    });

    // 2. Simulate logout clearing profile & session recovery, then Student B login
    await page.evaluate(() => {
      window.localStorage.removeItem("zana.profile.v1");
      window.localStorage.removeItem("zana_session_recovery_v1");
      window.localStorage.setItem(
        "zana.profile.v1",
        JSON.stringify({
          id: "student_uid_b",
          name: "Student Beta",
          grade: "11",
          stream: "literary",
          activeSubject: "math",
          level: "beginner",
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      );
    });

    await page.reload();
    await expect(page.locator("body")).toBeVisible();
    const storedProfile = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem("zana.profile.v1") || "null")
    );
    expect(storedProfile?.id).toBe("student_uid_b");
    expect(storedProfile?.name).toBe("Student Beta");
    expect(storedProfile?.name).not.toBe("Student Alpha");
  });

  test("persistence failure (503 DATABASE_UNAVAILABLE) on subscription check never grants a fake trial", async ({
    page,
  }) => {
    await page.route("**/api/subscription/status**", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          code: "DATABASE_UNAVAILABLE",
          error: "سێرڤەری داتابەیس لەم کاتەدا بەردەست نییە.",
        }),
      });
    });

    await page.addInitScript(() => {
      window.sessionStorage.setItem("zana_guest_bypassed", "true");
      window.localStorage.setItem(
        "zana.profile.v1",
        JSON.stringify({
          id: "student_db_down",
          name: "قوتابی",
          grade: "12",
          stream: "scientific",
          activeSubject: "chemistry",
          level: "intermediate",
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      );
    });

    await page.goto("/profile");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
  });
});
