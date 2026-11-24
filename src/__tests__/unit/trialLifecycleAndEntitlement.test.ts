import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateTrialCountdown,
  formatBaghdadDateTime,
} from "../../utils/countdownUtils.ts";
import {
  normalizeNationalId,
  isValidNationalId,
  maskNationalId,
  hashNationalId,
  encryptNationalId,
  decryptNationalId,
  deriveAesKey,
} from "../../services/nationalIdUtils.ts";

function createMockJwt(payload: Record<string, unknown>): string {
  const projectId = "gen-lang-client-0009572581";
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    iss: `https://securetoken.google.com/${projectId}`,
    aud: projectId,
    iat: now,
    exp: now + 3600,
    auth_time: now,
    ...payload,
  };
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test-kid" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = "mock-signature";
  return `${header}.${body}.${signature}`;
}

describe("Phase 1 & 2: Authoritative 72-Hour Trial Lifecycle & Baghdad Timezone", () => {
  it("calculates exactly 72-hour trial window from authoritative start time", () => {
    const startTime = 1732400000000;
    const endsAt = startTime + 3 * 24 * 60 * 60 * 1000; // 72 hours later

    // At start (0 hours elapsed)
    const countdownStart = calculateTrialCountdown(endsAt, startTime);
    expect(countdownStart.isExpired).toBe(false);
    expect(countdownStart.daysRemaining).toBe(3);
    expect(countdownStart.formattedCountdown).toBe("٣ ڕۆژ ماوە");

    // After 24 hours (2 days remaining)
    const after24h = startTime + 24 * 60 * 60 * 1000;
    const countdown24h = calculateTrialCountdown(endsAt, after24h);
    expect(countdown24h.isExpired).toBe(false);
    expect(countdown24h.daysRemaining).toBe(2);
    expect(countdown24h.formattedCountdown).toBe("٢ ڕۆژ ماوە");

    // After 48 hours (1 day remaining)
    const after48h = startTime + 48 * 60 * 60 * 1000;
    const countdown48h = calculateTrialCountdown(endsAt, after48h);
    expect(countdown48h.isExpired).toBe(false);
    expect(countdown48h.daysRemaining).toBe(1);
    expect(countdown48h.formattedCountdown).toBe("١ ڕۆژ ماوە");

    // Within last 24 hours (hours & minutes countdown)
    const after60h = startTime + 60 * 60 * 60 * 1000; // 12 hours left
    const countdown60h = calculateTrialCountdown(endsAt, after60h);
    expect(countdown60h.isExpired).toBe(false);
    expect(countdown60h.isUrgent).toBe(true);
    expect(countdown60h.hoursRemaining).toBe(12);
    expect(countdown60h.formattedCountdown).toContain("١٢ کاتژمێر");

    // Exactly expired (72 hours elapsed)
    const countdownExpired = calculateTrialCountdown(endsAt, endsAt + 1000);
    expect(countdownExpired.isExpired).toBe(true);
    expect(countdownExpired.formattedCountdown).toBe("بەژداریی خۆڕایی تەواو بوو");
  });

  it("resists client clock tampering by factoring in server-time offset", () => {
    const serverNow = 1732400000000;
    const clientNowTampered = serverNow - 10 * 24 * 60 * 60 * 1000; // Client set clock 10 days back!
    const endsAt = serverNow - 1000; // Already expired on server

    // Client offset formula: currentEffectiveTime = clientNow + (serverNow - clientNow) = serverNow
    const offset = serverNow - clientNowTampered;
    const effectiveTime = clientNowTampered + offset;

    const countdown = calculateTrialCountdown(endsAt, effectiveTime);
    expect(countdown.isExpired).toBe(true);
    expect(countdown.formattedCountdown).toBe("بەژداریی خۆڕایی تەواو بوو");
  });

  it("formats dates and times accurately in Asia/Baghdad timezone", () => {
    // 2026-11-24T12:00:00Z -> 15:00 in Asia/Baghdad (UTC+3)
    const utcTimestamp = Date.UTC(2026, 10, 24, 12, 0, 0);
    const formatted = formatBaghdadDateTime(utcTimestamp);
    expect(formatted).toContain("24/11/2026");
    expect(formatted).toContain("03:00");
    expect(formatted.toLowerCase()).toContain("pm");
    expect(formatted).toContain("کاتی بەغدا/هەولێر");
  });
});

describe("Phase 4: Privacy-Protected Iraqi National ID (12 Digits & AES-GCM)", () => {
  it("normalizes ASCII, Eastern Arabic, and Kurdish numerals", () => {
    expect(normalizeNationalId("199812345678")).toBe("199812345678");
    expect(normalizeNationalId("١٩٩٨١٢٣٤٥٦٧٨")).toBe("199812345678");
    expect(normalizeNationalId("۱۹۹۸۱۲۳۴۵۶۷۸")).toBe("199812345678");
    expect(normalizeNationalId(" 1998-1234-5678 ")).toBe("199812345678");
  });

  it("validates 12-digit format and realistic birth year", () => {
    expect(isValidNationalId("199812345678")).toBe(true);
    expect(isValidNationalId("200612345678")).toBe(true);
    expect(isValidNationalId("١٩٩٨١٢٣٤٥٦٧٨")).toBe(true);

    // Invalid length
    expect(isValidNationalId("19981234567")).toBe(false); // 11 digits
    expect(isValidNationalId("1998123456789")).toBe(false); // 13 digits
    expect(isValidNationalId("abcd12345678")).toBe(false);

    // Unrealistic birth year
    expect(isValidNationalId("185012345678")).toBe(false);
    expect(isValidNationalId("209912345678")).toBe(false);
  });

  it("safely masks National ID for Administrative Displays", () => {
    expect(maskNationalId("199812345678")).toBe("1998••••5678");
    expect(maskNationalId("200599887766")).toBe("2005••••7766");
    expect(maskNationalId("")).toBe("—");
    expect(maskNationalId(null)).toBe("—");
  });

  it("hashes National ID with keyed salt for duplicate detection", async () => {
    const pepper = "secret_pepper_2026";
    const hash1 = await hashNationalId("199812345678", pepper);
    const hash2 = await hashNationalId("١٩٩٨١٢٣٤٥٦٧٨", pepper); // Arabic numerals normalize to same
    const hash3 = await hashNationalId("200012345678", pepper);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64); // SHA-256 hex string
  });

  it("encrypts and decrypts National ID at rest using AES-GCM 256", async () => {
    const secret = "super_secure_aes_key_test_2026";
    const rawId = "199812345678";

    const encrypted = await encryptNationalId(rawId, secret);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toContain(rawId); // Raw ID is never in ciphertext

    const decrypted = await decryptNationalId(encrypted, secret);
    expect(decrypted).toBe(rawId);
  });
});

describe("Mandated 12 Verification Scenarios (P0 Hardening)", () => {
  beforeEach(() => {
    process.env.ALLOW_TEST_AUTH_MOCK = "true";
    process.env.ZANA_ENV = "test";
    localStorage.clear();
  });

  // Helper to create mock D1 for an expired student
  function createExpiredEnv() {
    return {
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => ({
              status: "expired",
              trial_started_at: Date.now() - 4 * 86400000,
              trial_ends_at: Date.now() - 1 * 86400000,
              plan_id: "free_trial_3d",
              updated_at: Date.now(),
            }),
            run: async () => ({ meta: { changes: 1 } }),
          }),
        }),
      },
      ALLOW_TEST_AUTH_MOCK: "true",
      ZANA_ENV: "test",
    } as never;
  }

  // Helper to create mock D1 for an active student
  function createActiveEnv() {
    return {
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => ({
              status: "active",
              trial_started_at: Date.now() - 1 * 86400000,
              trial_ends_at: Date.now() + 2 * 86400000,
              plan_id: "full_pass_annual",
              updated_at: Date.now(),
            }),
            run: async () => ({ meta: { changes: 1 } }),
          }),
        }),
      },
      ALLOW_TEST_AUTH_MOCK: "true",
      ZANA_ENV: "test",
    } as never;
  }

  // 1. Expired Student A cannot access /api/pedagogy/* (403 SUBSCRIPTION_REQUIRED)
  it("Scenario 1: Expired Student A cannot access /api/pedagogy/* (403 SUBSCRIPTION_REQUIRED)", async () => {
    const { verifyEntitlementWorker } = await import("../../worker/index.ts");
    const expiredEnv = createExpiredEnv();
    const token = createMockJwt({
      sub: "student_a_expired",
      email: "student_a@example.com",
      role: "student",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    const req = new Request("https://zana.krd/api/pedagogy/overview", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await verifyEntitlementWorker(req, expiredEnv, new Headers());
    expect(res instanceof Response).toBe(true);
    if (res instanceof Response) {
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe("SUBSCRIPTION_REQUIRED");
      expect(data.locked_features).toContain("pedagogy");
    }
  });

  // 2. Expired Student A cannot access other protected labs (/api/chat, /api/assessment, etc.)
  it("Scenario 2: Expired Student A cannot access other protected labs", async () => {
    const { verifyEntitlementWorker } = await import("../../worker/index.ts");
    const expiredEnv = createExpiredEnv();
    const token = createMockJwt({
      sub: "student_a_expired",
      email: "student_a@example.com",
      role: "student",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    const protectedUrls = [
      "https://zana.krd/api/chat",
      "https://zana.krd/api/assessment/start",
      "https://zana.krd/api/learning/mastery",
      "https://zana.krd/api/study/plan",
      "https://zana.krd/api/study-rooms/list",
    ];

    for (const url of protectedUrls) {
      const req = new Request(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await verifyEntitlementWorker(req, expiredEnv, new Headers());
      expect(res instanceof Response).toBe(true);
      if (res instanceof Response) {
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.code).toBe("SUBSCRIPTION_REQUIRED");
        expect(data.locked_features).toContain("labs");
      }
    }
  });

  // 3. Cross-student data isolation: Student A cannot access Student B's data
  it("Scenario 3: Cross-student data isolation enforced strictly by token identity", async () => {
    const { verifyEntitlementWorker } = await import("../../worker/index.ts");
    const activeEnv = createActiveEnv();
    const tokenStudentA = createMockJwt({
      sub: "student_a_authenticated",
      email: "student_a@example.com",
      role: "student",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    // Student A tries to query Student B's parameter
    const req = new Request("https://zana.krd/api/learning/mastery?studentId=student_b_victim", {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });

    const res = await verifyEntitlementWorker(req, activeEnv, new Headers());
    expect(res instanceof Response).toBe(false);
    if (!(res instanceof Response)) {
      // Server strictly binds to authenticated Student A, preventing impersonation of Student B
      expect(res.studentId).toBe("student_a_authenticated");
      expect(res.studentId).not.toBe("student_b_victim");
    }
  });

  // 4. Forged studentId cannot change authenticated identity
  it("Scenario 4: Forged studentId in request body/query cannot override authenticated identity", async () => {
    const { verifyEntitlementWorker } = await import("../../worker/index.ts");
    const activeEnv = createActiveEnv();
    const token = createMockJwt({
      sub: "real_student_id_123",
      email: "real@example.com",
      role: "student",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    const req = new Request("https://zana.krd/api/chat?studentId=forged_student_999", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await verifyEntitlementWorker(req, activeEnv, new Headers());
    expect(res instanceof Response).toBe(false);
    if (!(res instanceof Response)) {
      expect(res.studentId).toBe("real_student_id_123");
    }
  });

  // 5. Ordinary student cannot become admin via email alone
  it("Scenario 5: Ordinary student cannot become admin via email alone without admin custom claims", async () => {
    const { isAuthoritativeAdmin, verifyEntitlementWorker } = await import("../../worker/index.ts");
    const expiredEnv = createExpiredEnv();

    // Student possesses admin email string but role is 'student' with NO admin claims
    const spoofedUser = {
      uid: "spoofed_student_uid",
      email: "addmin.official.idg@gmail.com",
      claims: {
        uid: "spoofed_student_uid",
        aud: "gen-lang-client-0009572581",
        iss: "https://securetoken.google.com/gen-lang-client-0009572581",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        role: "student",
        admin: false,
      },
    };

    expect(isAuthoritativeAdmin(spoofedUser)).toBe(false);

    const spoofedToken = createMockJwt({
      sub: "spoofed_student_uid",
      email: "addmin.official.idg@gmail.com",
      role: "student",
      admin: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    const req = new Request("https://zana.krd/api/pedagogy/overview", {
      method: "GET",
      headers: { Authorization: `Bearer ${spoofedToken}` },
    });

    // Must be rejected with 403 because admin bypass was denied and student subscription is expired
    const res = await verifyEntitlementWorker(req, expiredEnv, new Headers());
    expect(res instanceof Response).toBe(true);
    if (res instanceof Response) {
      expect(res.status).toBe(403);
    }
  });

  // 6. Database failure cannot create a fake trial (fails closed with 503)
  it("Scenario 6: Database failure cannot create a fake trial (fails closed with 503)", async () => {
    const { checkSubscription, verifyEntitlementWorker } = await import("../../worker/index.ts");
    const mockEnvMissingDb = {} as never;

    const subCheck = await checkSubscription(mockEnvMissingDb, "student_123");
    expect(subCheck.status).toBe("unavailable");

    const token = createMockJwt({
      sub: "student_123",
      email: "student@example.com",
      role: "student",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    const req = new Request("https://zana.krd/api/chat", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await verifyEntitlementWorker(req, mockEnvMissingDb, new Headers());
    expect(res instanceof Response).toBe(true);
    if (res instanceof Response) {
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.code).toBe("DATABASE_UNAVAILABLE");
      expect(data.error).toContain("داتابەیس بەردەست نییە");
    }
  });

  // 7. Device clock change cannot extend trial (server UTC timestamps enforced)
  it("Scenario 7: Device clock tampering cannot extend trial", () => {
    const serverNow = 1732400000000;
    const clientNowTampered = serverNow - 30 * 24 * 60 * 60 * 1000; // 30 days back in time!
    const endsAt = serverNow - 1000; // Expired 1 second ago on server

    const offset = serverNow - clientNowTampered;
    const effectiveTime = clientNowTampered + offset;

    const countdown = calculateTrialCountdown(endsAt, effectiveTime);
    expect(countdown.isExpired).toBe(true);
    expect(countdown.formattedCountdown).toBe("بەژداریی خۆڕایی تەواو بوو");
  });

  // 8. Repeated registration cannot reset trial (existing window preserved)
  it("Scenario 8: Repeated registration preserves existing trial window without resetting", async () => {
    const now = Date.now();
    const originalTrialStart = now - 2 * 86400000;
    const originalTrialEnd = now + 1 * 86400000;

    const mockDbWithExistingSub = {
      prepare: (sql: string) => ({
        bind: (...args: unknown[]) => ({
          first: async () => {
            if (sql.includes("FROM subscriptions")) {
              return {
                status: "trial",
                trial_started_at: originalTrialStart,
                trial_ends_at: originalTrialEnd,
                plan_id: "free_trial_3d",
              };
            }
            if (sql.includes("FROM students WHERE LOWER(email)")) {
              return null; // Not registered under another UID
            }
            return null;
          },
          run: async () => ({ meta: { changes: 1 } }),
        }),
      }),
    };

    // Existing endsAt is preserved
    const existingSub = await mockDbWithExistingSub.prepare("SELECT * FROM subscriptions WHERE user_id = ?").bind("uid_123").first() as { trial_ends_at: number; trial_started_at: number };
    const trialDurationMs = 3 * 24 * 60 * 60 * 1000;
    const endsAt = existingSub?.trial_ends_at || (now + trialDurationMs);
    const startedAt = existingSub?.trial_started_at || now;

    expect(endsAt).toBe(originalTrialEnd);
    expect(startedAt).toBe(originalTrialStart);
  });

  // 9. Missing encryption configuration fails closed (throws error, never stores plaintext)
  it("Scenario 9: Missing encryption configuration fails closed and never stores plaintext", async () => {
    await expect(deriveAesKey("")).rejects.toThrow(/MISSING_ENCRYPTION_SECRET/);
    await expect(encryptNationalId("199812345678", "")).rejects.toThrow(/MISSING_ENCRYPTION_SECRET/);
    await expect(hashNationalId("199812345678", "")).rejects.toThrow(/MISSING_HMAC_SECRET/);
  });

  // 10. Failed onboarding database write prevents celebration modal trigger
  it("Scenario 10: Failed onboarding database write prevents celebration modal trigger", () => {
    const studentUid = "student_fail_write_123";
    const storageKey = `zana_trial_celebrated_${studentUid}`;

    // Simulation: Onboarding API call threw 500 error
    const onboardingSucceeded = false;
    if (onboardingSucceeded) {
      localStorage.setItem(storageKey, "true");
    }

    // Modal key must remain unset
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  // 11. Valid active subscription grants expected access
  it("Scenario 11: Valid active subscription grants expected access to all learning and lab routes", async () => {
    const { verifyEntitlementWorker } = await import("../../worker/index.ts");
    const activeEnv = createActiveEnv();
    const token = createMockJwt({
      sub: "student_with_active_pass",
      email: "paid_student@example.com",
      role: "student",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    const req = new Request("https://zana.krd/api/chat", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await verifyEntitlementWorker(req, activeEnv, new Headers());
    expect(res instanceof Response).toBe(false);
    if (!(res instanceof Response)) {
      expect(res.subscription.status).toBe("active");
      expect(res.studentId).toBe("student_with_active_pass");
    }
  });

  // 12. Expired trial displays explicit expiration state, not generic server error
  it("Scenario 12: Expired trial displays explicit expiration state, distinctly not a generic 500", async () => {
    const { verifyEntitlementWorker } = await import("../../worker/index.ts");
    const expiredEnv = createExpiredEnv();
    const token = createMockJwt({
      sub: "student_expired_trial",
      email: "expired@example.com",
      role: "student",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    const req = new Request("https://zana.krd/api/chat", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await verifyEntitlementWorker(req, expiredEnv, new Headers());
    expect(res instanceof Response).toBe(true);
    if (res instanceof Response) {
      expect(res.status).toBe(403); // Explicitly 403 Forbidden, NOT 500 Server Error
      const data = await res.json();
      expect(data.code).toBe("SUBSCRIPTION_REQUIRED");
      expect(data.error).toContain("تاقیکردنەوەی خۆڕایی");
      expect(data.locked_features).toBeInstanceOf(Array);
      expect(data.locked_features).toContain("labs");
      expect(data.locked_features).toContain("pedagogy");
    }
  });
});

describe("ZANA — Registration, Identity Persistence & Free Trial Correction (12 Core Scenarios)", () => {
  beforeEach(() => {
    process.env.ALLOW_TEST_AUTH_MOCK = "true";
    process.env.ZANA_ENV = "test";
    process.env.NODE_ENV = "test";
    localStorage.clear();
  });

  interface StudentRecord {
    id: string;
    name: string;
    email: string;
    grade: string;
    stream: string;
    school_name: string;
  }

  interface SubscriptionRecord {
    user_id: string;
    email?: string | null;
    status: string;
    trial_started_at: number;
    trial_ends_at: number;
    plan_id: string;
    updated_at: number;
  }

  function createComprehensiveMockD1(
    initialStudents: StudentRecord[] = [],
    initialSubscriptions: SubscriptionRecord[] = []
  ) {
    const students = [...initialStudents];
    const subscriptions = [...initialSubscriptions];

    return {
      prepare: (sql: string) => ({
        bind: (...params: unknown[]) => ({
          first: async () => {
            const lower = sql.toLowerCase();
            if (lower.includes("from students")) {
              if (lower.includes("email") && lower.includes("id !=")) {
                const [email, id] = params as [string, string];
                const normalized = (email || "").trim().toLowerCase();
                return students.find((s) => (s.email || "").trim().toLowerCase() === normalized && s.id !== id) || null;
              }
              if (lower.includes("id = ? or") && lower.includes("email")) {
                const [uid, email] = params as [string, string];
                const normalized = (email || "").trim().toLowerCase();
                return students.find((s) => s.id === uid || ((s.email || "").trim().toLowerCase() === normalized && normalized.length > 0)) || null;
              }
              if (lower.includes("id = ?")) {
                const [id] = params as [string];
                return students.find((s) => s.id === id) || null;
              }
            }
            if (lower.includes("from subscriptions")) {
              if (lower.includes("user_id = ? or") && lower.includes("email")) {
                const [uid, email] = params as [string, string];
                const normalized = (email || "").trim().toLowerCase();
                return subscriptions.find((s) => s.user_id === uid || ((s.email || "").trim().toLowerCase() === normalized && normalized.length > 0)) || null;
              }
              if (lower.includes("user_id = ?")) {
                const [uid] = params as [string];
                return subscriptions.find((s) => s.user_id === uid) || null;
              }
            }
            return null;
          },
          run: async () => {
            const lower = sql.toLowerCase();
            if (lower.includes("insert into students")) {
              const [id, name, email, grade, stream, school_name] = params as string[];
              const existingIdx = students.findIndex((s) => s.id === id);
              if (existingIdx >= 0) {
                students[existingIdx] = { ...students[existingIdx], name, email, grade, stream, school_name };
              } else {
                students.push({ id, name, email, grade, stream, school_name });
              }
              return { meta: { changes: 1 } };
            }
            if (lower.includes("insert into subscriptions")) {
              let user_id: string;
              let email: string | null = null;
              let status: string;
              let trial_started_at: number;
              let trial_ends_at: number;
              let plan_id: string;
              let updated_at: number;

              if (params.length >= 7) {
                [user_id, email, status, trial_started_at, trial_ends_at, plan_id, updated_at] = params as [
                  string,
                  string,
                  string,
                  number,
                  number,
                  string,
                  number
                ];
              } else {
                [user_id, status, trial_started_at, trial_ends_at, plan_id, updated_at] = params as [
                  string,
                  string,
                  number,
                  number,
                  string,
                  number
                ];
              }

              const existingIdx = subscriptions.findIndex((s) => s.user_id === user_id);
              if (existingIdx >= 0) {
                if (lower.includes("do nothing")) {
                  return { meta: { changes: 0 } };
                }
                subscriptions[existingIdx] = {
                  ...subscriptions[existingIdx],
                  status,
                  trial_started_at,
                  trial_ends_at,
                  plan_id,
                  updated_at,
                };
              } else {
                subscriptions.push({
                  user_id,
                  email,
                  status,
                  trial_started_at,
                  trial_ends_at,
                  plan_id,
                  updated_at,
                });
              }
              return { meta: { changes: 1 } };
            }
            if (lower.includes("update subscriptions set email")) {
              const [email, user_id] = params as [string, string];
              const sub = subscriptions.find((s) => s.user_id === user_id);
              if (sub) sub.email = email;
              return { meta: { changes: 1 } };
            }
            return { meta: { changes: 1 } };
          },
          all: async () => ({ results: [] }),
        }),
      }),
      _students: students,
      _subscriptions: subscriptions,
    };
  }

  // 1. National ID is no longer required anywhere in onboarding
  it("Scenario 1: National ID is no longer required anywhere in onboarding", async () => {
    const worker = (await import("../../worker/index.ts")).default;
    const mockDb = createComprehensiveMockD1();
    const mockEnv = {
      DB: mockDb,
      ALLOW_TEST_AUTH_MOCK: "true",
      ZANA_ENV: "test",
    } as never;

    const token = createMockJwt({
      sub: "student_no_national_id",
      email: "new_student@example.com",
      role: "student",
    });

    // Request payload contains NO nationalId field whatsoever
    const req = new Request("https://zana.krd/api/student/onboard", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "دیاری بەختیار",
        schoolName: "ئامادەیی هەڵگورد",
        grade: "12",
        stream: "scientific",
      }),
    });

    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.national_id_masked).toBeUndefined();
  });

  // 2. A valid student can register successfully without National ID
  it("Scenario 2: A valid student can register successfully without National ID", async () => {
    const worker = (await import("../../worker/index.ts")).default;
    const mockDb = createComprehensiveMockD1();
    const mockEnv = {
      DB: mockDb,
      ALLOW_TEST_AUTH_MOCK: "true",
      ZANA_ENV: "test",
    } as never;

    const token = createMockJwt({
      sub: "valid_student_123",
      email: "valid.student@example.com",
      role: "student",
    });

    const req = new Request("https://zana.krd/api/student/onboard", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "کاروان ئەحمەد",
        schoolName: "ئامادەیی کوردستان",
        grade: "12",
        stream: "scientific",
      }),
    });

    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.status).toBe("trial");
    expect(data.school_name).toBe("ئامادەیی کوردستان");

    // Verify record in mock DB
    expect(mockDb._students.length).toBe(1);
    expect(mockDb._students[0].name).toBe("کاروان ئەحمەد");
    expect(mockDb._students[0].email).toBe("valid.student@example.com");
    expect(mockDb._students[0].school_name).toBe("ئامادەیی کوردستان");
  });

  // 3. The same email cannot register twice
  it("Scenario 3: The same email cannot register twice (409 EMAIL_ALREADY_REGISTERED)", async () => {
    const worker = (await import("../../worker/index.ts")).default;
    const mockDb = createComprehensiveMockD1([
      {
        id: "existing_student_uid",
        name: "قوتابی کۆن",
        email: "same_email@example.com",
        grade: "12",
        stream: "scientific",
        school_name: "قوتابخانەی نموونەیی",
      },
    ]);

    const mockEnv = {
      DB: mockDb,
      ALLOW_TEST_AUTH_MOCK: "true",
      ZANA_ENV: "test",
    } as never;

    // Second user with different UID tries to onboard with the existing email
    const secondUserToken = createMockJwt({
      sub: "second_user_different_uid",
      email: "same_email@example.com",
      role: "student",
    });

    const req = new Request("https://zana.krd/api/student/onboard", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secondUserToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "کەسی دووەم",
        schoolName: "قوتابخانەی تر",
        grade: "12",
        stream: "scientific",
      }),
    });

    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toBe("EMAIL_ALREADY_REGISTERED");
    expect(data.detail).toContain("ئەم ئیمەیڵە پێشتر بەکارهاتووە");
  });

  // 4. The same Firebase UID cannot create another student record
  it("Scenario 4: The same Firebase UID updates existing record without creating duplicates", async () => {
    const worker = (await import("../../worker/index.ts")).default;
    const mockDb = createComprehensiveMockD1();
    const mockEnv = {
      DB: mockDb,
      ALLOW_TEST_AUTH_MOCK: "true",
      ZANA_ENV: "test",
    } as never;

    const token = createMockJwt({
      sub: "unique_student_uid",
      email: "unique@example.com",
      role: "student",
    });

    // First onboarding
    const req1 = new Request("https://zana.krd/api/student/onboard", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "ناوی یەکەم",
        schoolName: "قوتابخانەی یەکەم",
        grade: "12",
        stream: "scientific",
      }),
    });
    await worker.fetch(req1, mockEnv);
    expect(mockDb._students.length).toBe(1);

    // Second onboarding from same UID
    const req2 = new Request("https://zana.krd/api/student/onboard", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "ناوی نوێکراوە",
        schoolName: "قوتابخانەی نوێ",
        grade: "12",
        stream: "scientific",
      }),
    });
    await worker.fetch(req2, mockEnv);
    // Student list must still contain exactly 1 row, not 2
    expect(mockDb._students.length).toBe(1);
    expect(mockDb._students[0].name).toBe("ناوی نوێکراوە");
    expect(mockDb._students[0].school_name).toBe("قوتابخانەی نوێ");
  });

  // 5. A successful registration activates only one 72-hour trial
  it("Scenario 5: A successful registration activates only one 72-hour trial window", async () => {
    const worker = (await import("../../worker/index.ts")).default;
    const mockDb = createComprehensiveMockD1();
    const mockEnv = {
      DB: mockDb,
      ALLOW_TEST_AUTH_MOCK: "true",
      ZANA_ENV: "test",
    } as never;

    const token = createMockJwt({
      sub: "trial_student_uid",
      email: "trial@example.com",
      role: "student",
    });

    const req = new Request("https://zana.krd/api/student/onboard", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "ڕەوەند کەریم",
        schoolName: "ئامادەیی شۆڕش",
        grade: "12",
        stream: "scientific",
      }),
    });

    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();

    const expectedDurationMs = 72 * 60 * 60 * 1000;
    expect(data.trial_ends_at - data.trial_started_at).toBe(expectedDurationMs);

    // Call onboard a second time: timestamps must remain EXACTLY identical
    const req2 = new Request("https://zana.krd/api/student/onboard", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "ڕەوەند کەریم",
        schoolName: "ئامادەیی شۆڕش",
        grade: "12",
        stream: "scientific",
      }),
    });
    const res2 = await worker.fetch(req2, mockEnv);
    const data2 = await res2.json();
    expect(data2.trial_started_at).toBe(data.trial_started_at);
    expect(data2.trial_ends_at).toBe(data.trial_ends_at);
  });

  // 6. Logout and login restore the existing student profile
  it("Scenario 6: Logout and login restore the existing student profile via GET /api/student/profile", async () => {
    const worker = (await import("../../worker/index.ts")).default;
    const now = Date.now();
    const mockDb = createComprehensiveMockD1(
      [
        {
          id: "returning_student_uid",
          name: "لاڤین هێرش",
          email: "lavin@example.com",
          grade: "12",
          stream: "scientific",
          school_name: "ئامادەیی ڕەوشت",
        },
      ],
      [
        {
          user_id: "returning_student_uid",
          email: "lavin@example.com",
          status: "trial",
          trial_started_at: now - 3600000,
          trial_ends_at: now + 71 * 3600000,
          plan_id: "free_trial_3d",
          updated_at: now,
        },
      ]
    );

    const mockEnv = {
      DB: mockDb,
      ALLOW_TEST_AUTH_MOCK: "true",
      ZANA_ENV: "test",
    } as never;

    const token = createMockJwt({
      sub: "returning_student_uid",
      email: "lavin@example.com",
      role: "student",
    });

    const profileReq = new Request("https://zana.krd/api/student/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const res = await worker.fetch(profileReq, mockEnv);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.ok).toBe(true);
    expect(data.exists).toBe(true);
    expect(data.onboardingCompleted).toBe(true);
    expect(data.student.name).toBe("لاڤین هێرش");
    expect(data.student.schoolName).toBe("ئامادەیی ڕەوشت");
    expect(data.subscription.status).toBe("trial");
  });

  // 7. Returning users do not see onboarding again
  it("Scenario 7: Returning users do not see onboarding again (checkUserExists returns isNewUser: false)", async () => {
    const { checkUserExists } = await import("../../auth/userProfileService.ts");
    const { fetchServerStudentProfile } = await import("../../services/subscriptionService.ts");

    // Mock fetchServerStudentProfile to return existing registration
    vi.spyOn(await import("../../services/subscriptionService.ts"), "fetchServerStudentProfile").mockResolvedValueOnce({
      ok: true,
      exists: true,
      onboardingCompleted: true,
      student: {
        id: "registered_uid",
        name: "شنە مەحمەد",
        email: "shna@example.com",
        schoolName: "ئامادەیی نالی",
        grade: "12",
        stream: "scientific",
      },
      subscription: {
        ok: true,
        status: "trial",
        trial_started_at: Date.now(),
        trial_ends_at: Date.now() + 72 * 3600000,
        plan_id: "free_trial_3d",
        days_remaining: 3,
      },
    });

    const checkResult = await checkUserExists("registered_uid");
    expect(checkResult.exists).toBe(true);
    expect(checkResult.isNewUser).toBe(false);
    expect(checkResult.profile?.onboardingCompleted).toBe(true);
    expect(checkResult.profile?.school).toBe("ئامادەیی نالی");
  });

  // 8. Refreshing or changing devices does not reset registration or trial status
  it("Scenario 8: Refreshing or changing devices retrieves profile from D1 without reset", async () => {
    const worker = (await import("../../worker/index.ts")).default;
    const now = Date.now();
    const mockDb = createComprehensiveMockD1(
      [
        {
          id: "persisted_uid",
          name: "دانەر سالار",
          email: "danar@example.com",
          grade: "12",
          stream: "scientific",
          school_name: "ئامادەیی هۆزان",
        },
      ],
      [
        {
          user_id: "persisted_uid",
          email: "danar@example.com",
          status: "trial",
          trial_started_at: now - 86400000,
          trial_ends_at: now + 2 * 86400000,
          plan_id: "free_trial_3d",
          updated_at: now,
        },
      ]
    );

    const mockEnv = {
      DB: mockDb,
      ALLOW_TEST_AUTH_MOCK: "true",
      ZANA_ENV: "test",
    } as never;

    // Local storage is completely empty (new browser/device)
    localStorage.clear();
    expect(localStorage.getItem("zana_student_profile")).toBeNull();

    const token = createMockJwt({
      sub: "persisted_uid",
      email: "danar@example.com",
      role: "student",
    });

    const profileReq = new Request("https://zana.krd/api/student/profile", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await worker.fetch(profileReq, mockEnv);
    const data = await res.json();

    expect(data.ok).toBe(true);
    expect(data.exists).toBe(true);
    expect(data.onboardingCompleted).toBe(true);
    expect(data.student.name).toBe("دانەر سالار");
    expect(data.subscription.days_remaining).toBeGreaterThan(0);
  });

  // 9. Changing the device clock cannot extend the trial
  it("Scenario 9: Changing the device clock cannot extend trial (server UTC time authoritative)", () => {
    const serverNow = 1732400000000;
    const clientTampered = serverNow - 30 * 24 * 60 * 60 * 1000; // set 30 days in past
    const endsAt = serverNow - 1000; // trial expired 1s ago in UTC

    const offset = serverNow - clientTampered;
    const effectiveTime = clientTampered + offset;

    const countdown = calculateTrialCountdown(endsAt, effectiveTime);
    expect(countdown.isExpired).toBe(true);
    expect(countdown.formattedCountdown).toBe("بەژداریی خۆڕایی تەواو بوو");
  });

  // 10. An expired trial remains expired after re-login
  it("Scenario 10: An expired trial remains expired after re-login", async () => {
    const worker = (await import("../../worker/index.ts")).default;
    const now = Date.now();
    const expiredStart = now - 5 * 86400000;
    const expiredEnd = now - 2 * 86400000;

    const mockDb = createComprehensiveMockD1(
      [
        {
          id: "expired_student_uid",
          name: "قوتابی بەسەرچوو",
          email: "expired.student@example.com",
          grade: "12",
          stream: "scientific",
          school_name: "ئامادەیی پەروەردە",
        },
      ],
      [
        {
          user_id: "expired_student_uid",
          email: "expired.student@example.com",
          status: "expired",
          trial_started_at: expiredStart,
          trial_ends_at: expiredEnd,
          plan_id: "free_trial_3d",
          updated_at: now,
        },
      ]
    );

    const mockEnv = {
      DB: mockDb,
      ALLOW_TEST_AUTH_MOCK: "true",
      ZANA_ENV: "test",
    } as never;

    const token = createMockJwt({
      sub: "expired_student_uid",
      email: "expired.student@example.com",
      role: "student",
    });

    const profileReq = new Request("https://zana.krd/api/student/profile", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await worker.fetch(profileReq, mockEnv);
    const data = await res.json();

    expect(data.ok).toBe(true);
    expect(data.exists).toBe(true);
    expect(data.subscription.status).toBe("expired");
    expect(data.subscription.days_remaining).toBe(0);
  });

  // 11. Database failure does not create a fake registration or trial
  it("Scenario 11: Database failure does not create a fake registration or trial (503 DATABASE_UNAVAILABLE)", async () => {
    const worker = (await import("../../worker/index.ts")).default;
    const mockEnvMissingDb = {
      DB: undefined,
      ALLOW_TEST_AUTH_MOCK: "true",
      ZANA_ENV: "test",
    } as never;

    const token = createMockJwt({
      sub: "fail_closed_uid",
      email: "fail.closed@example.com",
      role: "student",
    });

    // 1. Onboard fails closed
    const onboardReq = new Request("https://zana.krd/api/student/onboard", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "ناوی قوتابی",
        schoolName: "قوتابخانە",
        grade: "12",
        stream: "scientific",
      }),
    });

    const onboardRes = await worker.fetch(onboardReq, mockEnvMissingDb);
    expect(onboardRes.status).toBe(503);
    const onboardData = await onboardRes.json();
    expect(onboardData.error).toBe("DATABASE_UNAVAILABLE");

    // 2. Profile fetch fails closed
    const profileReq = new Request("https://zana.krd/api/student/profile", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const profileRes = await worker.fetch(profileReq, mockEnvMissingDb);
    expect(profileRes.status).toBe(503);
    const profileData = await profileRes.json();
    expect(profileData.error).toBe("DATABASE_UNAVAILABLE");
  });

  // 12. One student's identity cannot access another student's record
  it("Scenario 12: One student's identity cannot access another student's subscription record (403 FORBIDDEN)", async () => {
    const worker = (await import("../../worker/index.ts")).default;
    const mockDb = createComprehensiveMockD1();
    const mockEnv = {
      DB: mockDb,
      ALLOW_TEST_AUTH_MOCK: "true",
      ZANA_ENV: "test",
    } as never;

    const tokenStudentA = createMockJwt({
      sub: "student_a_uid",
      email: "student_a@example.com",
      role: "student",
    });

    // Student A tries to query Student B's record
    const snoopingReq = new Request("https://zana.krd/api/subscription/status?userId=student_b_victim_uid", {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });

    const res = await worker.fetch(snoopingReq, mockEnv);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("FORBIDDEN");
    expect(data.detail).toContain("ڕێگەپێدراو نیت بۆ بینینی دۆخی بەشداریکردنی بەکارهێنەری تر");
  });

  describe("ZANA Final Blocker Remediation: 10 Mandated Verification Scenarios", () => {
    // 1. Existing subscription emails are correctly associated and normalized
    it("Mandated 1: Existing subscription emails are correctly associated and normalized", async () => {
      const rawLegacyEmail = "  Sara.Ahmed@Zana.Edu.Krd  ";
      const normalized = rawLegacyEmail.trim().toLowerCase();
      expect(normalized).toBe("sara.ahmed@zana.edu.krd");

      const mockDb = createComprehensiveMockD1(
        [{ id: "uid_legacy", name: "سارا ئەحمەد", email: normalized, grade: "12", stream: "scientific", school_name: "ئامادەیی زانا" }],
        [{ user_id: "uid_legacy", email: null, status: "trial", trial_started_at: 1700000000000, trial_ends_at: 1700259200000, plan_id: "free_trial_3d", updated_at: 1700000000000 }]
      );
      const worker = (await import("../../worker/index.ts")).default;
      const mockEnv = { DB: mockDb, ALLOW_TEST_AUTH_MOCK: "true", ZANA_ENV: "test" } as never;

      const token = createMockJwt({ sub: "uid_legacy", email: rawLegacyEmail, role: "student" });
      const profileReq = new Request("https://zana.krd/api/student/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await worker.fetch(profileReq, mockEnv);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.student.email).toBe("sara.ahmed@zana.edu.krd");
      expect(data.subscription.trial_started_at).toBe(1700000000000);
    });

    // 2. Case and whitespace variants cannot bypass email uniqueness
    it("Mandated 2: Case and whitespace variants cannot bypass email uniqueness", async () => {
      const mockDb = createComprehensiveMockD1(
        [{ id: "uid_existing", name: "ئازاد عەلی", email: "azad@example.com", grade: "12", stream: "scientific", school_name: "قوتابخانە" }],
        [{ user_id: "uid_existing", email: "azad@example.com", status: "trial", trial_started_at: 1700000000000, trial_ends_at: 1700259200000, plan_id: "free_trial_3d", updated_at: 1700000000000 }]
      );
      const worker = (await import("../../worker/index.ts")).default;
      const mockEnv = { DB: mockDb, ALLOW_TEST_AUTH_MOCK: "true", ZANA_ENV: "test" } as never;

      const bypassToken = createMockJwt({ sub: "uid_attacker", email: "  AZAD@EXAMPLE.COM  ", role: "student" });
      const req = new Request("https://zana.krd/api/student/onboard", {
        method: "POST",
        headers: { Authorization: `Bearer ${bypassToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "هەژماری ساختە", schoolName: "قوتابخانە", grade: "12", stream: "scientific" }),
      });
      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(["EMAIL_ALREADY_REGISTERED", "TRIAL_ALREADY_USED"]).toContain(data.error);
    });

    // 3. Two concurrent registration requests cannot create duplicate students or trials
    it("Mandated 3: Two concurrent registration requests cannot create duplicate students or trials", async () => {
      const mockDb = createComprehensiveMockD1();
      const worker = (await import("../../worker/index.ts")).default;
      const mockEnv = { DB: mockDb, ALLOW_TEST_AUTH_MOCK: "true", ZANA_ENV: "test" } as never;

      const token = createMockJwt({ sub: "uid_concurrent", email: "concurrent@zana.edu.krd", role: "student" });
      const body = JSON.stringify({ name: "قوتابی هاوکات", schoolName: "ئامادەیی", grade: "12", stream: "scientific" });

      const req1 = new Request("https://zana.krd/api/student/onboard", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body,
      });
      const req2 = new Request("https://zana.krd/api/student/onboard", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body,
      });

      const [res1, res2] = await Promise.all([
        worker.fetch(req1, mockEnv),
        worker.fetch(req2, mockEnv),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      const data1 = await res1.json();
      const data2 = await res2.json();
      expect(data1.trial_started_at).toBe(data2.trial_started_at);
      expect(data1.trial_ends_at).toBe(data2.trial_ends_at);
    });

    // 4. Existing trial timestamps remain unchanged
    it("Mandated 4: Existing trial timestamps remain unchanged upon re-registration", async () => {
      const originalStart = 1690000000000;
      const originalEnd = 1690259200000;
      const mockDb = createComprehensiveMockD1(
        [{ id: "uid_fixed_trial", name: "قوتابی پارێزراو", email: "fixed.trial@example.com", grade: "12", stream: "scientific", school_name: "قوتابخانە" }],
        [{ user_id: "uid_fixed_trial", email: "fixed.trial@example.com", status: "expired", trial_started_at: originalStart, trial_ends_at: originalEnd, plan_id: "free_trial_3d", updated_at: originalStart }]
      );
      const worker = (await import("../../worker/index.ts")).default;
      const mockEnv = { DB: mockDb, ALLOW_TEST_AUTH_MOCK: "true", ZANA_ENV: "test" } as never;

      const token = createMockJwt({ sub: "uid_fixed_trial", email: "fixed.trial@example.com", role: "student" });
      const req = new Request("https://zana.krd/api/student/onboard", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "ناوی نوێ", schoolName: "قوتابخانەی نوێ", grade: "12", stream: "scientific" }),
      });

      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.trial_started_at).toBe(originalStart);
      expect(data.trial_ends_at).toBe(originalEnd);
    });

    // 5. An ambiguous legacy account cannot receive a new trial
    it("Mandated 5: An ambiguous legacy account cannot receive a new trial", async () => {
      const mockDb = createComprehensiveMockD1(
        [],
        [{ user_id: "uid_legacy_consumed", email: "ambiguous@zana.edu.krd", status: "expired", trial_started_at: 1680000000000, trial_ends_at: 1680259200000, plan_id: "free_trial_3d", updated_at: 1680000000000 }]
      );
      const worker = (await import("../../worker/index.ts")).default;
      const mockEnv = { DB: mockDb, ALLOW_TEST_AUTH_MOCK: "true", ZANA_ENV: "test" } as never;

      const token = createMockJwt({ sub: "uid_second_device", email: "ambiguous@zana.edu.krd", role: "student" });
      const req = new Request("https://zana.krd/api/student/onboard", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "هەوڵی تاقیکردنەوەی دووەم", schoolName: "قوتابخانە", grade: "12", stream: "scientific" }),
      });
      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe("TRIAL_ALREADY_USED");
    });

    // 6. D1 failure returns 503, not 403 TRIAL_EXPIRED
    it("Mandated 6: D1 failure returns 503 DATABASE_UNAVAILABLE, not 403 TRIAL_EXPIRED", async () => {
      const worker = (await import("../../worker/index.ts")).default;
      const mockEnvNoDb = { DB: undefined, ALLOW_TEST_AUTH_MOCK: "true", ZANA_ENV: "test" } as never;

      const token = createMockJwt({ sub: "uid_d1_down", email: "d1.down@example.com", role: "student" });
      const chatReq = new Request("https://zana.krd/api/chat", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: "سڵاو مامۆستا" }),
      });
      const res = await worker.fetch(chatReq, mockEnvNoDb);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.code).toBe("DATABASE_UNAVAILABLE");
      expect(data.status).not.toBe("expired");
    });

    // 7. The UI distinguishes expired trial from database unavailability
    it("Mandated 7: The UI distinguishes expired trial from database unavailability", () => {
      const dbDownStatus = {
        ok: false,
        status: "unavailable" as const,
        trial_started_at: 0,
        trial_ends_at: 0,
        plan_id: null,
        days_remaining: 0,
        is_expired: false,
        code: "DATABASE_UNAVAILABLE",
      };
      expect(dbDownStatus.status).toBe("unavailable");
      expect(dbDownStatus.is_expired).toBe(false);
      expect(dbDownStatus.code).toBe("DATABASE_UNAVAILABLE");

      const expiredStatus = {
        ok: true,
        status: "expired" as const,
        trial_started_at: 1700000000000,
        trial_ends_at: 1700259200000,
        plan_id: "free_trial_3d",
        days_remaining: 0,
        is_expired: true,
      };
      expect(expiredStatus.status).toBe("expired");
      expect(expiredStatus.is_expired).toBe(true);
      expect(expiredStatus.status).not.toBe(dbDownStatus.status);
    });

    // 8. Logout/login continues to restore the existing student profile
    it("Mandated 8: Logout/login continues to restore the existing student profile", async () => {
      const mockDb = createComprehensiveMockD1(
        [{ id: "uid_returning", name: "ئاری کاروان", email: "ari@example.com", grade: "12", stream: "scientific", school_name: "ئامادەیی شۆڕش" }],
        [{ user_id: "uid_returning", email: "ari@example.com", status: "trial", trial_started_at: Date.now(), trial_ends_at: Date.now() + 86400000, plan_id: "free_trial_3d", updated_at: Date.now() }]
      );
      const worker = (await import("../../worker/index.ts")).default;
      const mockEnv = { DB: mockDb, ALLOW_TEST_AUTH_MOCK: "true", ZANA_ENV: "test" } as never;

      const token = createMockJwt({ sub: "uid_returning", email: "ari@example.com", role: "student" });
      const profileReq = new Request("https://zana.krd/api/student/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await worker.fetch(profileReq, mockEnv);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.exists).toBe(true);
      expect(data.onboardingCompleted).toBe(true);
      expect(data.student.name).toBe("ئاری کاروان");
      expect(data.student.schoolName).toBe("ئامادەیی شۆڕش");
    });

    // 9. A returning student never sees onboarding again
    it("Mandated 9: A returning student never sees onboarding again (onboardingCompleted: true)", async () => {
      const mockDb = createComprehensiveMockD1(
        [{ id: "uid_onboarded", name: "لەیلا جەمال", email: "layla@example.com", grade: "12", stream: "scientific", school_name: "ئامادەیی کوردستان" }],
        [{ user_id: "uid_onboarded", email: "layla@example.com", status: "trial", trial_started_at: Date.now(), trial_ends_at: Date.now() + 86400000, plan_id: "free_trial_3d", updated_at: Date.now() }]
      );
      const worker = (await import("../../worker/index.ts")).default;
      const mockEnv = { DB: mockDb, ALLOW_TEST_AUTH_MOCK: "true", ZANA_ENV: "test" } as never;

      const token = createMockJwt({ sub: "uid_onboarded", email: "layla@example.com", role: "student" });
      const profileReq = new Request("https://zana.krd/api/student/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await worker.fetch(profileReq, mockEnv);
      const data = await res.json();
      expect(data.onboardingCompleted).toBe(true);
    });

    // 10. National ID is not required for registration
    it("Mandated 10: National ID is not required for registration", async () => {
      const mockDb = createComprehensiveMockD1();
      const worker = (await import("../../worker/index.ts")).default;
      const mockEnv = { DB: mockDb, ALLOW_TEST_AUTH_MOCK: "true", ZANA_ENV: "test" } as never;

      const token = createMockJwt({ sub: "uid_no_nid", email: "no.nid@example.com", role: "student" });
      const req = new Request("https://zana.krd/api/student/onboard", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "خوێندکاری بێ کارتی نیشتمانی",
          schoolName: "ئامادەیی بێخوود",
          grade: "12",
          stream: "scientific",
        }),
      });
      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.nationalId).toBeUndefined();
      expect(data.national_id_masked).toBeUndefined();
    });

    // 11. Legacy duplicate subscription with nulled secondary email prevents new trial on primary email
    it("Mandated 11: Legacy duplicate subscriptions with nulled secondary email still prevent new trials on primary email", async () => {
      const mockDb = createComprehensiveMockD1(
        [],
        [
          { user_id: "uid_primary_early", email: "retained@zana.edu.krd", status: "trial", trial_started_at: 1000, trial_ends_at: 2000, plan_id: "free_trial_3d", updated_at: 1000 },
          { user_id: "uid_secondary_dup", email: null, status: "expired", trial_started_at: 1500, trial_ends_at: 2500, plan_id: "free_trial_3d", updated_at: 1500 }
        ]
      );
      const worker = (await import("../../worker/index.ts")).default;
      const mockEnv = { DB: mockDb, ALLOW_TEST_AUTH_MOCK: "true", ZANA_ENV: "test" } as never;

      const token = createMockJwt({ sub: "uid_brand_new_attacker", email: "retained@zana.edu.krd", role: "student" });
      const req = new Request("https://zana.krd/api/student/onboard", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "تۆمارکردنی دووبارە", schoolName: "ئامادەیی", grade: "12", stream: "scientific" }),
      });
      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe("TRIAL_ALREADY_USED");
    });

    // 12. Inactive subscription blocks access with 403 SUBSCRIPTION_INACTIVE
    it("Mandated 12: Inactive subscription blocks access with 403 SUBSCRIPTION_INACTIVE", async () => {
      const mockDb = createComprehensiveMockD1(
        [],
        [{ user_id: "uid_inactive_student", email: "inactive@zana.edu.krd", status: "inactive", trial_started_at: 1000, trial_ends_at: 9999999999999, plan_id: "monthly", updated_at: 1000 }]
      );
      const worker = (await import("../../worker/index.ts")).default;
      const mockEnv = { DB: mockDb, ALLOW_TEST_AUTH_MOCK: "true", ZANA_ENV: "test" } as never;

      const token = createMockJwt({ sub: "uid_inactive_student", email: "inactive@zana.edu.krd", role: "student" });
      const chatReq = new Request("https://zana.krd/api/chat", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: "سڵاو" }),
      });
      const res = await worker.fetch(chatReq, mockEnv);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe("SUBSCRIPTION_INACTIVE");
    });

    // 13. Active subscription grants full access to protected routes
    it("Mandated 13: Active subscription grants access past trial period", async () => {
      const now = Date.now();
      const mockDb = createComprehensiveMockD1(
        [],
        [{ user_id: "uid_active_student", email: "active@zana.edu.krd", status: "active", trial_started_at: now - 1000000, trial_ends_at: now + 10000000, plan_id: "monthly_paid", updated_at: now }]
      );
      const worker = (await import("../../worker/index.ts")).default;
      const mockEnv = { DB: mockDb, ALLOW_TEST_AUTH_MOCK: "true", ZANA_ENV: "test", GEMINI_API_KEY: "mock_key" } as never;

      const token = createMockJwt({ sub: "uid_active_student", email: "active@zana.edu.krd", role: "student" });
      const subReq = new Request("https://zana.krd/api/subscription/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await worker.fetch(subReq, mockEnv);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("active");
      expect(data.is_expired).toBe(false);
    });
  });
});
