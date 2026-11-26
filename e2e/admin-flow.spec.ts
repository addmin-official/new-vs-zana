import { test, expect } from "@playwright/test";

test.describe("Admin Route & Server Authorization Enforcement", () => {
  test("unauthenticated or forged storage flags cannot access /admin and API rejects unauthorized requests", async ({
    page,
    request,
  }) => {
    // Even if client storage is tampered with legacy bypass keys, /admin must redirect to /login
    await page.addInitScript(() => {
      window.sessionStorage.setItem("zana_guest_bypassed", "true");
      window.sessionStorage.setItem("zana_admin_bypassed", "true");
      window.localStorage.setItem(
        "zana.profile.v1",
        JSON.stringify({
          id: "admin-spoof-1",
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

    await page.goto("/admin");

    await expect(page.locator("input[type='email'], input[placeholder*='ئیمەیڵ']").first()).toBeVisible({
      timeout: 10000,
    });
    expect(new URL(page.url()).pathname).toBe("/login");

    // Server-side admin API must reject unauthenticated requests
    const apiRes = await request.get("/api/admin/subscriptions");
    expect([401, 403]).toContain(apiRes.status());
  });
});
