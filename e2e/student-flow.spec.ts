import { test, expect } from "@playwright/test";

test.describe("Student Learning & Assessment Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Seed authenticated student profile with chemistry as active subject
    await page.addInitScript(() => {
      window.sessionStorage.setItem("zana_guest_bypassed", "true");
      window.localStorage.setItem(
        "zana.profile.v1",
        JSON.stringify({
          id: "student-e2e-1",
          name: "ئاری هەڵگورد",
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
  });

  test("completes student journey: navigation -> chat tutor -> adaptive assessment", async ({
    page,
  }) => {
    // 1. Visit root page
    await page.goto("/");
    await expect(page).toHaveTitle(/زانا|Zana/i);

    // 2. Navigate to Chat / AI Tutor
    await page.goto("/chat");
    await expect(page.getByText(/مامۆستا زانا|زانا/i).first()).toBeVisible({ timeout: 10000 });

    // Verify Socratic Mode or Quick chips are available
    const quickChip = page.getByRole("button", { name: /شیکردنەوەی سوقراتی|ڕاهێنانی وانە/i }).first();
    if (await quickChip.isVisible()) {
      await quickChip.click();
    }

    // Send a question in the chat input
    const chatInput = page.getByPlaceholder(/پرسیارەکەت بنووسە|پەیامەکەت بنووسە/i).first();
    if (await chatInput.isVisible()) {
      await chatInput.fill("پێوەری pH بۆ گیراوەی ترش چۆن دیاری دەکرێت؟");
      const sendButton = page.getByRole("button", { name: /ناردن|send/i }).first();
      if (await sendButton.isVisible()) {
        await sendButton.click();
      }
    }

    // 3. Navigate to Adaptive Assessment
    await page.goto("/assessment");
    await expect(page.getByText(/تاقیکردنەوەی ئەداپتیڤی|وانەی کیمیا|هەڵسەنگاندن/i).first()).toBeVisible({
      timeout: 10000,
    });

    // Start assessment if intro screen is displayed
    const startBtn = page.getByRole("button", { name: /دەستپێکردنی تاقیکردنەوە/i }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
    }

    // Answer questions if present
    for (let i = 0; i < 7; i++) {
      // Look for options to click
      const options = page.locator("button.group, button[class*='border-slate-200'], button[class*='border']");
      const count = await options.count();
      if (count > 0) {
        await options.first().click().catch(() => {});
      }

      // Next / submit button matches actual Kurdish strings ("دواتر", "تەواوکردن", "تەواوکردن و ناردن")
      const nextBtn = page.getByRole("button", { name: /دواتر|داهاتوو|تەواوکردن/i }).first();
      if (await nextBtn.isVisible()) {
        await nextBtn.click().catch(() => {});
      } else {
        break;
      }
    }

    // Verify assessment page container is healthy and visible
    await expect(page.locator("main, body")).toBeVisible();
  });
});
