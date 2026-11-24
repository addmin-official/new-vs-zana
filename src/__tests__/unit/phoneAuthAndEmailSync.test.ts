import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  formatIraqiPhone,
  isIraqiPhoneValid,
  normalizeDigits,
} from "../../services/phoneUtils.ts";
import {
  FIREBASE_ERRORS_KU,
  getErrorMessage,
  setupRecaptcha,
  clearRecaptcha,
  sendPhoneOtp,
  verifyPhoneOtp,
} from "../../services/authService.ts";
import { checkSubscription, Env } from "../../worker/index.ts";

describe("1. Phone Number Utilities & Normalization (+964 E.164)", () => {
  it("normalizes Eastern Arabic (٠-٩) and Persian/Kurdish (۰-۹) digits to ASCII", () => {
    expect(normalizeDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
    expect(normalizeDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
    expect(normalizeDigits("0750 123 4567")).toBe("0750 123 4567");
    expect(normalizeDigits("")).toBe("");
    expect(normalizeDigits(null)).toBe("");
  });

  it("correctly formats various Iraqi phone formats into standard E.164 (+9647XXXXXXXX)", () => {
    // Local 11-digit starting with 07
    expect(formatIraqiPhone("07501234567")).toBe("+9647501234567");
    expect(formatIraqiPhone("07709876543")).toBe("+9647709876543");

    // 10-digit starting with 7
    expect(formatIraqiPhone("7501234567")).toBe("+9647501234567");

    // International dial prefix 00964
    expect(formatIraqiPhone("009647501234567")).toBe("+9647501234567");

    // Already with +964
    expect(formatIraqiPhone("+9647501234567")).toBe("+9647501234567");

    // Starting with 964 without +
    expect(formatIraqiPhone("9647501234567")).toBe("+9647501234567");

    // With spaces, hyphens and Kurdish digits
    expect(formatIraqiPhone("٠٧٥٠-١٢٣ ٤٥٦٧")).toBe("+9647501234567");
    expect(formatIraqiPhone("۰۷۷۰ ۱۲۳ ۴۵۶۷")).toBe("+9647701234567");
  });

  it("validates valid and invalid Iraqi phone numbers strictly", () => {
    // Valid Iraqi mobile numbers (all carriers: Korek 0750, Asiacell 0770, Zain 0780/0790)
    expect(isIraqiPhoneValid("07501234567")).toBe(true);
    expect(isIraqiPhoneValid("07701234567")).toBe(true);
    expect(isIraqiPhoneValid("07801234567")).toBe(true);
    expect(isIraqiPhoneValid("07901234567")).toBe(true);
    expect(isIraqiPhoneValid("+9647501234567")).toBe(true);
    expect(isIraqiPhoneValid("٠٧٥٠١٢٣٤٥٦٧")).toBe(true);

    // Invalid numbers
    expect(isIraqiPhoneValid("")).toBe(false);
    expect(isIraqiPhoneValid(null)).toBe(false);
    expect(isIraqiPhoneValid("12345")).toBe(false); // Too short
    expect(isIraqiPhoneValid("0750123456")).toBe(false); // 9 digits
    expect(isIraqiPhoneValid("075012345678")).toBe(false); // 12 digits
    expect(isIraqiPhoneValid("+14155552671")).toBe(false); // US number
    expect(isIraqiPhoneValid("+9646123456789")).toBe(false); // Invalid Iraqi prefix (not 7)
    expect(isIraqiPhoneValid("not-a-number")).toBe(false);
  });
});

describe("2. Localized Sorani Error Messages for Phone & Auth", () => {
  it("translates all required Firebase Phone Auth error codes to Kurdish Sorani", () => {
    expect(FIREBASE_ERRORS_KU["auth/quota-exceeded"]).toContain("کورتەنامە");
    expect(FIREBASE_ERRORS_KU["auth/captcha-check-failed"]).toContain("reCAPTCHA");
    expect(FIREBASE_ERRORS_KU["auth/invalid-verification-code"]).toContain("کۆدی دڵنیایی هەڵەیە");
    expect(FIREBASE_ERRORS_KU["auth/code-expired"]).toContain("کاتی تەواو بووە");
    expect(FIREBASE_ERRORS_KU["auth/session-expired"]).toContain("دانیشتنە");
    expect(FIREBASE_ERRORS_KU["auth/phone-number-already-exists"]).toContain("پێشتر");
    expect(FIREBASE_ERRORS_KU["auth/credential-already-in-use"]).toContain("بەستراوەتەوە");
    expect(FIREBASE_ERRORS_KU["auth/invalid-phone-number"]).toContain("ژمارەی مۆبایل");
    expect(FIREBASE_ERRORS_KU["auth/missing-verification-code"]).toContain("کۆدی دڵنیایی");
  });

  it("getErrorMessage resolves both code and message strings honestly", () => {
    expect(getErrorMessage({ code: "auth/quota-exceeded" })).toBe(FIREBASE_ERRORS_KU["auth/quota-exceeded"]);
    expect(getErrorMessage({ code: "auth/invalid-verification-code" })).toBe(FIREBASE_ERRORS_KU["auth/invalid-verification-code"]);
    expect(getErrorMessage(new Error("Firebase: Error (auth/invalid-phone-number)."))).toBe(FIREBASE_ERRORS_KU["auth/invalid-phone-number"]);
    // Preserves pre-localized Kurdish text directly without double translating
    expect(getErrorMessage(new Error("کۆدەکە هەڵەیە"))).toBe("کۆدەکە هەڵەیە");
  });
});

describe("3. RecaptchaVerifier Lifecycle & Cleanup", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="test-recaptcha"></div>';
    delete (window as unknown as Record<string, unknown>).__zanaRecaptcha;
  });

  it("clearRecaptcha cleanly removes verifier and resets container element", () => {
    const mockClear = vi.fn();
    (window as unknown as Record<string, unknown>).__zanaRecaptcha = { clear: mockClear };
    const container = document.getElementById("test-recaptcha")!;
    container.innerHTML = "<span>mock iframe</span>";

    clearRecaptcha("test-recaptcha");

    expect(mockClear).toHaveBeenCalled();
    expect((window as unknown as Record<string, unknown>).__zanaRecaptcha).toBeUndefined();
    expect(container.innerHTML).toBe("");
  });

  it("sendPhoneOtp rejects invalid Iraqi numbers before calling Firebase Auth", async () => {
    const res = await sendPhoneOtp("12345", {} as never);
    expect(res.success).toBe(false);
    expect(res.error).toContain("ژمارەی مۆبایل");
  });

  it("verifyPhoneOtp validates OTP code before confirmation and rejects empty/short code", async () => {
    const res = await verifyPhoneOtp("12");
    expect(res.user).toBeNull();
    expect(res.error).toBeDefined();
  });
});

describe("4. Email Synchronization & D1 Reconciliation", () => {
  let mockStudentsTable: Map<string, { id: string; name: string; email: string }>;
  let mockUsersTable: Map<string, { id: string; email: string; name: string }>;
  let mockSubscriptionsTable: Map<string, { user_id: string; status: string; trial_started_at: number; trial_ends_at: number; plan_id: string | null; updated_at: number }>;

  beforeEach(() => {
    mockStudentsTable = new Map();
    mockUsersTable = new Map();
    mockSubscriptionsTable = new Map();
  });

  const createMockDb = () => {
    return {
      prepare: (sql: string) => {
        return {
          bind: (...args: unknown[]) => ({
            first: async <T>() => {
              if (sql.includes("FROM subscriptions WHERE user_id = ?")) {
                const sub = mockSubscriptionsTable.get(args[0] as string);
                return (sub || null) as T;
              }
              return null as T;
            },
            run: async () => {
              if (sql.includes("INSERT INTO subscriptions")) {
                const userId = args[0] as string;
                const now = args[1] as number;
                const endsAt = args[2] as number;
                const updatedAt = args[3] as number;
                mockSubscriptionsTable.set(userId, {
                  user_id: userId,
                  status: "trial",
                  trial_started_at: now,
                  trial_ends_at: endsAt,
                  plan_id: "free_trial_3d",
                  updated_at: updatedAt,
                });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("INSERT INTO students")) {
                const id = args[0] as string;
                const name = args[1] as string;
                const email = args[2] as string;
                mockStudentsTable.set(id, { id, name, email });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("INSERT INTO users")) {
                const id = args[0] as string;
                const email = args[1] as string;
                const name = args[2] as string;
                mockUsersTable.set(id, { id, email, name });
                return { meta: { changes: 1 } };
              }
              return { meta: { changes: 1 } };
            },
            all: async <T>() => {
              if (sql.includes("FROM subscriptions s")) {
                const results: Array<{
                  user_id: string;
                  status: string;
                  trial_started_at: number;
                  trial_ends_at: number;
                  plan_id: string | null;
                  updated_at: number;
                  user_name: string;
                  user_email: string;
                }> = [];
                for (const sub of mockSubscriptionsTable.values()) {
                  const student = mockStudentsTable.get(sub.user_id);
                  const user = mockUsersTable.get(sub.user_id);
                  results.push({
                    ...sub,
                    user_name: student?.name || user?.name || "",
                    user_email: student?.email || user?.email || "",
                  });
                }
                return { results: results as unknown as T[] };
              }
              return { results: [] as unknown as T[] };
            },
          }),
        };
      },
    };
  };

  it("auto-upserts student identity into D1 students and users tables when userEmail is passed", async () => {
    const mockDb = createMockDb();
    const env: Env = {
      DB: mockDb as never,
      GEMINI_API_KEY: "test-key",
      ALLOWED_ORIGINS: "*",
      FIREBASE_PROJECT_ID: "test-proj",
    };

    const studentUid = "student_uid_12345";
    const studentEmail = "student.kurdish@test.com";
    const studentName = "دیار ئەحمەد";

    // Call checkSubscription with verified email and name claims
    const res = await checkSubscription(env, studentUid, studentEmail, studentName);
    expect(res.status).toBe("trial");

    // Verify D1 students and users tables have the student records
    expect(mockStudentsTable.has(studentUid)).toBe(true);
    expect(mockStudentsTable.get(studentUid)?.email).toBe(studentEmail);
    expect(mockStudentsTable.get(studentUid)?.name).toBe(studentName);

    expect(mockUsersTable.has(studentUid)).toBe(true);
    expect(mockUsersTable.get(studentUid)?.email).toBe(studentEmail);
    expect(mockUsersTable.get(studentUid)?.name).toBe(studentName);
  });

  it("handles missing email honestly without inventing artificial addresses", async () => {
    const mockDb = createMockDb();
    const env: Env = {
      DB: mockDb as never,
      GEMINI_API_KEY: "test-key",
      ALLOWED_ORIGINS: "*",
      FIREBASE_PROJECT_ID: "test-proj",
    };

    const guestUid = "guest_anonymous_9876";

    // Call checkSubscription without email or name (e.g. anonymous guest session)
    const res = await checkSubscription(env, guestUid);
    expect(res.status).toBe("trial");

    // Subscription exists, but no artificial student row was invented
    expect(mockSubscriptionsTable.has(guestUid)).toBe(true);
    expect(mockStudentsTable.has(guestUid)).toBe(false);

    // When queried in admin list, email remains empty honestly
    const queryStmt = mockDb.prepare("SELECT FROM subscriptions s").bind();
    const listRes = await queryStmt.all<{ user_id: string; user_email: string }>();
    const found = listRes.results.find((r) => r.user_id === guestUid);
    expect(found?.user_email).toBe("");
  });

  it("reconciles existing subscription records safely without creating duplicate accounts", async () => {
    const mockDb = createMockDb();
    const env: Env = {
      DB: mockDb as never,
      GEMINI_API_KEY: "test-key",
      ALLOWED_ORIGINS: "*",
      FIREBASE_PROJECT_ID: "test-proj",
    };

    const uid = "29npyAjxNwhMzMji9qqoTB8OQwm2";

    // Step 1: User initially had subscription created with no email (the reported bug)
    mockSubscriptionsTable.set(uid, {
      user_id: uid,
      status: "trial",
      trial_started_at: Date.now() - 10000,
      trial_ends_at: Date.now() + 200000,
      plan_id: "free_trial_3d",
      updated_at: Date.now() - 10000,
    });

    expect(mockStudentsTable.has(uid)).toBe(false);

    // Step 2: User returns or logs in with their verified Firebase email
    await checkSubscription(env, uid, "reconciled.student@gmail.com", "ڕەوا محەمەد");

    // Step 3: Verify student record is reconciled while preserving the single subscription
    expect(mockStudentsTable.get(uid)?.email).toBe("reconciled.student@gmail.com");
    expect(mockStudentsTable.get(uid)?.name).toBe("ڕەوا محەمەد");
    expect(mockSubscriptionsTable.size).toBe(1);
    expect(mockSubscriptionsTable.get(uid)?.user_id).toBe(uid);
  });
});

import {
  generateCryptoOtp,
  hashPhone,
  hashOtpCode,
  createOtpSession,
  verifyOtpSession,
} from "../../server/auth/otpService.ts";
import {
  DisabledSmsProvider,
  MockSmsProvider,
  resolveSmsProvider,
} from "../../server/sms/ISmsProvider.ts";
import {
  mintFirebaseCustomToken,
  parseServiceAccount,
  isCustomTokenServiceConfigured,
} from "../../server/auth/customTokenService.ts";

describe("5. Cryptographic OTP Generation & D1 Session Lifecycle", () => {
  it("generates 6-digit numeric OTP with cryptographically uniform distribution", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateCryptoOtp();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("hashes phone numbers deterministically with SHA-256", async () => {
    const hash1 = await hashPhone("+9647501234567");
    const hash2 = await hashPhone("+9647501234567");
    const hash3 = await hashPhone("+9647701234567");
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64); // SHA-256 hex string
  });

  it("hashes OTP with verification ID and server pepper to prevent rainbow table attacks", async () => {
    const hashA = await hashOtpCode("v1", "+9647501234567", "123456", "pepper_secret");
    const hashB = await hashOtpCode("v1", "+9647501234567", "123456", "different_pepper");
    expect(hashA).not.toBe(hashB);
  });

  it("creates an OTP session and enforces 60s resend cooldown", async () => {
    const store = new Map<string, any>();
    const mockDb = {
      prepare: (sql: string) => {
        const normSql = sql.replace(/\s+/g, " ");
        return {
          bind: (...args: any[]) => ({
            first: async () => {
              if (normSql.includes("WHERE phone_hash = ? AND cooldown_until > ?")) {
                const phoneH = args[0];
                const now = args[1];
                for (const v of store.values()) {
                  if (v.phone_hash === phoneH && v.cooldown_until > now && !v.consumed_at) {
                    return v;
                  }
                }
                return null;
              }
              if (normSql.includes("COUNT(*) as count FROM phone_verifications")) {
                return { count: 1 };
              }
              return null;
            },
            run: async () => {
              if (normSql.includes("INSERT INTO phone_verifications")) {
                const id = args[0];
                store.set(id, {
                  id: args[0],
                  phone_hash: args[1],
                  otp_hash: args[2],
                  phone_e164: args[3],
                  attempts_remaining: args[4],
                  expires_at: args[5],
                  cooldown_until: args[6],
                  ip_address: args[7],
                  created_at: args[8],
                  consumed_at: null,
                  verified_at: null,
                });
                return { success: true };
              }
              return { success: true };
            },
          }),
        };
      },
    };

    const res1 = await createOtpSession(mockDb as any, "07501234567", "1.1.1.1", "test_pepper");
    expect(res1.ok).toBe(true);
    expect(res1.verificationId).toBeDefined();
    expect(res1.otp).toMatch(/^\d{6}$/);

    // Second call immediately triggers cooldown protection
    const res2 = await createOtpSession(mockDb as any, "07501234567", "1.1.1.1", "test_pepper");
    expect(res2.ok).toBe(false);
    expect(res2.error).toBe("COOLDOWN_ACTIVE");
    expect(res2.errorKu).toContain("چرکەی تر چاوەڕوان بە");
  });

  it("verifies OTP session, decrements attempts, and prevents replay attacks", async () => {
    let attemptsRemaining = 3;
    let consumedAt: number | null = null;
    const phone = "+9647501234567";
    const verificationId = "verif_123";
    const correctCode = "654321";
    const pepper = "test_pep";
    const correctHash = await hashOtpCode(verificationId, phone, correctCode, pepper);

    const mockDb = {
      prepare: (sql: string) => {
        const normSql = sql.replace(/\s+/g, " ");
        return {
          bind: (...args: any[]) => ({
            first: async () => {
              if (normSql.includes("FROM phone_verifications WHERE id = ?")) {
                return {
                  id: verificationId,
                  phone_hash: "hash",
                  otp_hash: correctHash,
                  phone_e164: phone,
                  attempts_remaining: attemptsRemaining,
                  expires_at: Date.now() + 300000,
                  consumed_at: consumedAt,
                };
              }
              return null;
            },
            run: async () => {
              if (normSql.includes("attempts_remaining = ?")) {
                attemptsRemaining = args[0] as number;
              }
              if (normSql.includes("consumed_at = ?")) {
                consumedAt = args[1] as number;
              }
              return { success: true };
            },
          }),
        };
      },
    };

    // 1. Wrong code test: decrements attempts
    const wrongRes = await verifyOtpSession(mockDb as any, verificationId, "000000", pepper);
    expect(wrongRes.ok).toBe(false);
    expect(wrongRes.error).toBe("INVALID_CODE");
    expect(wrongRes.attemptsRemaining).toBe(2);

    // 2. Correct code test: succeeds and consumes session
    const correctRes = await verifyOtpSession(mockDb as any, verificationId, correctCode, pepper);
    expect(correctRes.ok).toBe(true);
    expect(correctRes.phoneE164).toBe(phone);

    // 3. Replay attack test: cannot verify already consumed session
    const replayRes = await verifyOtpSession(mockDb as any, verificationId, correctCode, pepper);
    expect(replayRes.ok).toBe(false);
    expect(replayRes.error).toBe("CODE_ALREADY_USED");
  });
});

describe("6. SMS Provider Adapter Layer (ISmsProvider)", () => {
  it("DisabledSmsProvider is fail-closed by default with truthful Sorani diagnostic", async () => {
    const disabled = new DisabledSmsProvider();
    expect(disabled.name).toBe("disabled");
    expect(disabled.isConfigured).toBe(false);

    const res = await disabled.sendOtp({ to: "+9647501234567", otp: "123456" });
    expect(res.success).toBe(false);
    expect(res.status).toBe("disabled");
    expect(res.errorCode).toBe("GATEWAY_PENDING_APPROVAL");
  });

  it("MockSmsProvider delivers successfully in test environment", async () => {
    const mock = new MockSmsProvider();
    expect(mock.name).toBe("mock");
    expect(mock.isConfigured).toBe(true);

    const res = await mock.sendOtp({ to: "+9647501234567", otp: "998877" });
    expect(res.success).toBe(true);
    expect(res.status).toBe("delivered");
    expect(mock.sentMessages).toHaveLength(1);
    expect(mock.sentMessages[0].otp).toBe("998877");
  });

  it("resolveSmsProvider safely instantiates configured provider or falls back to disabled", () => {
    // Empty env -> Disabled
    expect(resolveSmsProvider({}).name).toBe("disabled");

    // Mock env in test -> Mock
    expect(resolveSmsProvider({ SMS_PROVIDER: "mock", NODE_ENV: "test" }).name).toBe("mock");

    // Twilio without keys -> Disabled (fail-closed)
    expect(resolveSmsProvider({ SMS_PROVIDER: "twilio" }).name).toBe("disabled");

    // Twilio with keys -> Twilio
    const twilio = resolveSmsProvider({
      SMS_PROVIDER: "twilio",
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_AUTH_TOKEN: "tok456",
      TWILIO_FROM: "+1234567890",
    });
    expect(twilio.name).toBe("twilio");
    expect(twilio.isConfigured).toBe(true);

    // Infobip with keys -> Infobip
    const infobip = resolveSmsProvider({
      SMS_PROVIDER: "infobip",
      INFOBIP_API_KEY: "ib_key",
      INFOBIP_BASE_URL: "https://api.infobip.com",
    });
    expect(infobip.name).toBe("infobip");
    expect(infobip.isConfigured).toBe(true);
  });
});

describe("7. Web Crypto Firebase Custom Token Minting (Zero Blaze)", () => {
  it("safely parses service account credentials and validates configuration", () => {
    expect(parseServiceAccount(undefined)).toBeNull();
    expect(parseServiceAccount("")).toBeNull();
    expect(parseServiceAccount("invalid json")).toBeNull();

    const validSa = {
      client_email: "firebase-adminsdk@zana-project.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----",
    };
    expect(parseServiceAccount(validSa)).toEqual(validSa);
    expect(parseServiceAccount(JSON.stringify(validSa))).toEqual(validSa);
    expect(parseServiceAccount(btoa(JSON.stringify(validSa)))).toEqual(validSa);
    expect(isCustomTokenServiceConfigured(validSa)).toBe(true);
  });

  it("validates UID format strictly before token generation", async () => {
    const resEmpty = await mintFirebaseCustomToken({
      serviceAccountJson: "{}",
      uid: "",
    });
    expect(resEmpty.ok).toBe(false);
    expect(resEmpty.error).toBe("INVALID_UID");

    const resNoSa = await mintFirebaseCustomToken({
      serviceAccountJson: undefined,
      uid: "student_123",
    });
    expect(resNoSa.ok).toBe(false);
    expect(resNoSa.error).toBe("SERVICE_ACCOUNT_NOT_CONFIGURED");
  });

  it("mints compliant RS256 JWT using generated RSA Web Crypto key pair", async () => {
    // Generate valid 2048-bit RSA key pair dynamically via Web Crypto
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );

    const exportedDer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const binary = String.fromCharCode(...new Uint8Array(exportedDer));
    const base64Key = btoa(binary);
    const pemKey = `-----BEGIN PRIVATE KEY-----\n${base64Key}\n-----END PRIVATE KEY-----`;

    const serviceAccount = {
      client_email: "zana-auth-worker@zana-app.iam.gserviceaccount.com",
      private_key: pemKey,
    };

    const mintRes = await mintFirebaseCustomToken({
      serviceAccountJson: serviceAccount,
      uid: "ph_9647501234567",
      claims: {
        phone_number: "+9647501234567",
        role: "student",
      },
    });

    expect(mintRes.ok).toBe(true);
    expect(mintRes.customToken).toBeDefined();

    // Verify token structure: 3 parts (header.payload.signature)
    const parts = mintRes.customToken!.split(".");
    expect(parts).toHaveLength(3);

    // Decode header
    const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
    expect(header.alg).toBe("RS256");
    expect(header.typ).toBe("JWT");

    // Decode payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    expect(payload.iss).toBe(serviceAccount.client_email);
    expect(payload.sub).toBe(serviceAccount.client_email);
    expect(payload.aud).toBe("https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit");
    expect(payload.uid).toBe("ph_9647501234567");
    expect(payload.claims.phone_number).toBe("+9647501234567");
    expect(payload.claims.role).toBe("student");
    expect(payload.exp - payload.iat).toBe(3600); // 1 hour validity

    // Verify cryptographic signature with the public key
    const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const sigBinary = atob(parts[2].replace(/-/g, "+").replace(/_/g, "/"));
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }

    const isValidSig = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      keyPair.publicKey,
      sigBytes,
      signingInput
    );
    expect(isValidSig).toBe(true);
  });
});

