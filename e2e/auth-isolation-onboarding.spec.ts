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

  test("unauthenticated reload purges stale localStorage profile and /profile redirects to /login", async ({
    page,
    request,
  }) => {
    // Seed stale Student A profile in localStorage without an authenticated Firebase session
    await page.addInitScript(() => {
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

    await page.goto("/profile");

    // Must redirect to /login and never display Student Alpha's cached profile
    await expect(page.locator("input[type='email'], input[placeholder*='ئیمەیڵ']").first()).toBeVisible({
      timeout: 10000,
    });
    expect(new URL(page.url()).pathname).toBe("/login");
    await expect(page.getByText("Student Alpha")).toHaveCount(0);

    // Stale profile in localStorage must be cleared when unauthenticated
    await expect
      .poll(async () => page.evaluate(() => window.localStorage.getItem("zana.profile.v1")))
      .toBeNull();

    // Direct API call without a verified token must be rejected
    const profileRes = await request.get("/api/student/profile");
    expect(profileRes.status()).toBe(401);
  });

  test("unauthenticated /profile visit redirects to /login even if subscription check fails", async ({
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

    await page.goto("/profile");
    await expect(page.locator("input[type='email'], input[placeholder*='ئیمەیڵ']").first()).toBeVisible({
      timeout: 10000,
    });
    expect(new URL(page.url()).pathname).toBe("/login");
  });
});
