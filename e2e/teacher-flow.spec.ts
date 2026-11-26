import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/authFixture";

const TEACHER_IDENTITY = {
  uid: "teacher-e2e-1",
  email: "teacher-e2e-1@example.com",
  name: "مامۆستای تاقیکردنەوە",
  grade: "12",
  stream: "scientific" as const,
  activeSubject: "chemistry",
};

test.describe("Teacher Route Redirection Flow", () => {
  test("authenticated isolated teacher identity redirects /teacher to /home, cannot access /admin, and loses access on logout", async ({
    page,
  }) => {
    // 1. Authenticate using an isolated teacher test identity (distinct from student-e2e-1)
    await loginAsTestUser(page, TEACHER_IDENTITY);

    // 2. Navigate to obsolete /teacher route -> permanently routes to /home
    await page.goto("/teacher");
    await expect(page).toHaveURL(/\/home$/, { timeout: 10000 });
    await expect(page.getByText(TEACHER_IDENTITY.name).first()).toBeVisible({ timeout: 10000 });

    // 3. Non-admin test identity must not gain access to /admin dashboard
    await page.goto("/admin");
    await expect(page.getByText(/Brain Admin|بەڕێوەبردنی داتابەیس/i)).toHaveCount(0);

    // 4. Logout clears authenticated state and removes access to protected routes
    await page.goto("/profile");
    const logoutBtn = page.getByRole("button", { name: /چوونەدەرەوە/i }).first();
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });
    await logoutBtn.click();

    await expect(page).toHaveURL(/\/login|\/welcome|\//, { timeout: 10000 });
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
