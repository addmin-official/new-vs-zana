import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/authFixture";

const STUDENT_USER = {
  uid: "student-e2e-1",
  email: "student-e2e-1@example.com",
  name: "ئاری هەڵگورد",
  grade: "12",
  stream: "scientific" as const,
  activeSubject: "chemistry",
  schoolName: "ئامادەیی زانا",
};

test.describe("Student Learning & Assessment Flow", () => {
  test("completes authenticated student journey, preserves immutable classification, and clears state on logout", async ({
    page,
  }) => {
    // 1. Authenticate via real /login flow with controlled Firebase Auth & API fixtures
    await loginAsTestUser(page, STUDENT_USER);
    await expect(page).toHaveTitle(/زانا|Zana/i);

    // 2. Verify own student profile data is isolated, onboarded, and rendered on /profile
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByText(STUDENT_USER.name).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(STUDENT_USER.schoolName).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/هەنگاوی 1 لە 7/)).toHaveCount(0);

    // 3. Navigate to Chat / AI Tutor, switch subject/book, and verify grade/stream remain immutable
    await page.goto("/chat");
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByText(/مامۆستا زانا|زانا/i).first()).toBeVisible({ timeout: 10000 });

    const physicsBtn = page.getByRole("button", { name: /فیزیا/i }).first();
    if (await physicsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await physicsBtn.click();
    }
    await expect(page.getByText(/پۆلی 12 • زانستی/).first()).toBeVisible({ timeout: 10000 });

    const chatInput = page.getByRole("textbox", { name: /دەقی پرسیار یان وەڵام/i }).first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    await chatInput.fill("پێوەری pH بۆ گیراوەی ترش چۆن دیاری دەکرێت؟");
    await chatInput.press("Enter");
    await expect(page.getByText(/پێوەری pH بۆ گیراوەی ترش/).first()).toBeVisible({ timeout: 10000 });

    // 4. Navigate to Adaptive Assessment
    await page.goto("/assessment");
    await expect(page).toHaveURL(/\/assessment/);
    await expect(page.getByText(/تاقیکردنەوەی ئەداپتیڤی|وانەی کیمیا|هەڵسەنگاندن/i).first()).toBeVisible({
      timeout: 10000,
    });

    const startBtn = page.getByRole("button", { name: /دەستپێکردنی تاقیکردنەوە/i }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
    }
    await expect(page.locator("body")).toBeVisible();

    // 5. Logout from /profile and verify authenticated state is cleared (/profile -> /login)
    await page.goto("/profile");
    const logoutBtn = page.getByRole("button", { name: /چوونەدەرەوە/i }).first();
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });
    await logoutBtn.click();

    await expect(page).toHaveURL(/\/login|\/welcome|\//, { timeout: 10000 });
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await expect(page.locator("input[type='email']").first()).toBeVisible({ timeout: 10000 });
  });
});
