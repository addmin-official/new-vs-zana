import { expect, Page } from "@playwright/test";

export interface TestAuthUser {
  uid: string;
  email: string;
  name: string;
  grade: string;
  stream: "scientific" | "literary" | "general";
  activeSubject: string;
  schoolName?: string;
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function createMockFirebaseIdToken(user: TestAuthUser): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "e2e-test-key" }));
  const payload = toBase64Url(
    JSON.stringify({
      iss: "https://securetoken.google.com/zana-e2e-test",
      aud: "zana-e2e-test",
      auth_time: nowSec,
      user_id: user.uid,
      sub: user.uid,
      iat: nowSec,
      exp: nowSec + 3600,
      email: user.email,
      email_verified: true,
      name: user.name,
      firebase: {
        identities: { email: [user.email] },
        sign_in_provider: "password",
      },
    })
  );
  const signature = toBase64Url("e2e-mock-signature");
  return `${header}.${payload}.${signature}`;
}

export async function setupAuthenticatedTestRoutes(page: Page, user: TestAuthUser): Promise<string> {
  const mockIdToken = createMockFirebaseIdToken(user);
  const mockRefreshToken = `e2e-refresh-${user.uid}`;

  // Intercept Firebase Identity Toolkit endpoints for controlled test authentication
  await page.route("**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        kind: "identitytoolkit#VerifyPasswordResponse",
        localId: user.uid,
        email: user.email,
        displayName: user.name,
        idToken: mockIdToken,
        registered: true,
        refreshToken: mockRefreshToken,
        expiresIn: "3600",
      }),
    });
  });

  await page.route("**/identitytoolkit.googleapis.com/v1/accounts:lookup*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        kind: "identitytoolkit#GetAccountInfoResponse",
        users: [
          {
            localId: user.uid,
            email: user.email,
            emailVerified: true,
            displayName: user.name,
            validSince: "1700000000",
            lastLoginAt: String(Date.now()),
            createdAt: "1700000000000",
          },
        ],
      }),
    });
  });

  await page.route("**/securetoken.googleapis.com/v1/token*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: mockIdToken,
        expires_in: "3600",
        token_type: "Bearer",
        refresh_token: mockRefreshToken,
        id_token: mockIdToken,
        user_id: user.uid,
        project_id: "zana-e2e-test",
      }),
    });
  });

  // Require matching Bearer token on mocked student API routes so unauthenticated or cross-user calls fail closed
  await page.route("**/api/student/profile*", async (route) => {
    const authHeader = route.request().headers()["authorization"] || "";
    if (authHeader !== `Bearer ${mockIdToken}`) {
      await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false, error: "UNAUTHORIZED" }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        exists: true,
        onboardingCompleted: true,
        student: {
          id: user.uid,
          name: user.name,
          email: user.email,
          grade: user.grade,
          stream: user.stream,
          activeSubject: user.activeSubject,
          schoolName: user.schoolName || "ئامادەیی زانا",
        },
      }),
    });
  });

  await page.route("**/api/student/onboard*", async (route) => {
    const authHeader = route.request().headers()["authorization"] || "";
    if (authHeader !== `Bearer ${mockIdToken}`) {
      await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false, error: "UNAUTHORIZED" }) });
      return;
    }
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: "ACADEMIC_CLASSIFICATION_LOCKED",
        detail: "پۆل و لقی خوێندن دوای تۆمارکردن جێگیرکراون و ناتوانرێت بگۆڕدرێن.",
      }),
    });
  });

  await page.route("**/api/subscription/status*", async (route) => {
    const authHeader = route.request().headers()["authorization"] || "";
    if (authHeader !== `Bearer ${mockIdToken}`) {
      await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false, error: "UNAUTHORIZED" }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        status: "active",
        active: true,
        isBlocked: false,
        daysRemaining: 30,
        userId: user.uid,
      }),
    });
  });

  await page.route("**/api/notifications*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, notifications: [], unreadCount: 0, preferences: {} }),
    });
  });

  await page.route("**/api/chat*", async (route) => {
    const authHeader = route.request().headers()["authorization"] || "";
    if (!authHeader.startsWith("Bearer ")) {
      await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false, error: "UNAUTHORIZED" }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        reply: "پێوەری pH لە ٠ تا ١٤ دەپێورێت؛ گیراوەی ترش خاوەنی pH کەمترە لە ٧.",
        message: "پێوەری pH لە ٠ تا ١٤ دەپێورێت؛ گیراوەی ترش خاوەنی pH کەمترە لە ٧.",
      }),
    });
  });

  return mockIdToken;
}

export async function loginAsTestUser(page: Page, user: TestAuthUser): Promise<void> {
  await setupAuthenticatedTestRoutes(page, user);
  await page.goto("/login");

  const emailInput = page.locator("input[type='email']").first();
  const passwordInput = page.locator("input[type='password']").first();
  await expect(emailInput).toBeVisible({ timeout: 10000 });

  await emailInput.fill(user.email);
  await passwordInput.fill("TestPass!2026");
  await page.locator("button[type='submit']").first().click();

  await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
}
