import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  saveSessionPosition,
  getSessionRecovery,
  clearSessionRecovery,
  getSubjectKurdishName,
  getDefaultConceptForSubject,
  triggerSessionRecoveryNotification,
} from "../../auth/sessionRecovery.ts";
import { getErrorMessage, FIREBASE_ERRORS_KU } from "../../services/authService.ts";
import { checkUserExists } from "../../auth/userProfileService.ts";
import * as firestoreModule from "firebase/firestore";
import * as firebaseService from "../../services/firebase.ts";
import * as studentStorage from "../../features/student/studentStorage.ts";

vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  return {
    ...actual,
    sendEmailVerification: vi.fn(async () => {}),
  };
});

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock("../../services/firebase.ts", () => ({
  getFirestoreDb: vi.fn(() => ({})),
  getFirebaseAuth: vi.fn(() => null),
  isFirebaseConfigured: vi.fn(() => true),
}));

describe("ZANA Auth & Session Persistence System", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Session Recovery Service", () => {
    it("saves and retrieves session position with subject and concept", () => {
      saveSessionPosition("/chat", "chemistry", "pH-scale");

      const session = getSessionRecovery();
      expect(session).not.toBeNull();
      expect(session?.lastRoute).toBe("/chat");
      expect(session?.lastSubject).toBe("chemistry");
      expect(session?.lastConcept).toBe("pH-scale");
      expect(typeof session?.timestamp).toBe("number");
    });

    it("normalizes route without leading slash", () => {
      saveSessionPosition("plan", "mathematics");

      const session = getSessionRecovery();
      expect(session?.lastRoute).toBe("/plan");
      expect(session?.lastSubject).toBe("mathematics");
    });

    it("ignores auth-related routes like /login, /register, /forgot-password, /welcome", () => {
      saveSessionPosition("/practice", "physics");
      saveSessionPosition("/login");
      saveSessionPosition("/register");
      saveSessionPosition("/welcome");

      const session = getSessionRecovery();
      expect(session?.lastRoute).toBe("/practice");
      expect(session?.lastSubject).toBe("physics");
    });

    it("clears session recovery position completely", () => {
      saveSessionPosition("/rooms", "biology");
      expect(getSessionRecovery()).not.toBeNull();

      clearSessionRecovery();
      expect(getSessionRecovery()).toBeNull();
    });

    it("maps subject keys to authentic Kurdish Sorani labels", () => {
      expect(getSubjectKurdishName("chemistry")).toBe("کیمیا");
      expect(getSubjectKurdishName("physics")).toBe("فیزیا");
      expect(getSubjectKurdishName("mathematics")).toBe("بیرکاری");
      expect(getSubjectKurdishName("biology")).toBe("زیندەوەرزانی");
      expect(getSubjectKurdishName("arabic")).toBe("زمانی عەرەبی");
      expect(getSubjectKurdishName("english")).toBe("ئینگلیزی");
      expect(getSubjectKurdishName("kurdish")).toBe("زمانی کوردی");
      expect(getSubjectKurdishName("")).toBe("وانەکان");
      expect(getSubjectKurdishName("unknownSubject")).toBe("unknownSubject");
    });

    it("provides authentic subject-specific default concepts for curriculum subjects", () => {
      expect(getDefaultConceptForSubject("physics")).toBe("تەزووی کارەبایی و یاسای ئۆم");
      expect(getDefaultConceptForSubject("math")).toBe("سنوور و داتاشراو (Calculus)");
      expect(getDefaultConceptForSubject("mathematics")).toBe("سنوور و داتاشراو (Calculus)");
      expect(getDefaultConceptForSubject("biology")).toBe("بۆماوەزانی مێندلی و یاساکانی بۆماوە");
      expect(getDefaultConceptForSubject("chemistry")).toBe("ئاوێتە ئایۆنییەکان و ڕەوشە کۆکارییەکان");
      expect(getDefaultConceptForSubject("english")).toBe("Sunrise 12 — Grammar & Relative Clauses");
    });

    it("isolates concepts per subject so switching subject does not leak chemistry pH concept to physics or math", () => {
      // 1. Student was studying chemistry pH
      saveSessionPosition("/chat", "chemistry", "ترش و تفتەکان و پێوەری pH");
      let session = getSessionRecovery();
      expect(session?.lastSubject).toBe("chemistry");
      expect(session?.lastConcept).toBe("ترش و تفتەکان و پێوەری pH");

      // 2. Student switches to physics without specifying a concept yet
      saveSessionPosition("/home", "physics");
      session = getSessionRecovery();
      expect(session?.lastSubject).toBe("physics");
      // Must NOT leak chemistry pH to physics! Must use physics default concept:
      expect(session?.lastConcept).toBe("تەزووی کارەبایی و یاسای ئۆم");
      expect(session?.lastConcept).not.toContain("ترش");

      // 3. Student switches to math
      saveSessionPosition("/home", "math");
      session = getSessionRecovery();
      expect(session?.lastSubject).toBe("math");
      expect(session?.lastConcept).toBe("سنوور و داتاشراو (Calculus)");

      // 4. Student switches to biology
      saveSessionPosition("/home", "biology");
      session = getSessionRecovery();
      expect(session?.lastSubject).toBe("biology");
      expect(session?.lastConcept).toBe("بۆماوەزانی مێندلی و یاساکانی بۆماوە");

      // 5. If student switches back to chemistry, chemistry's saved concept is preserved!
      saveSessionPosition("/home", "chemistry");
      session = getSessionRecovery();
      expect(session?.lastSubject).toBe("chemistry");
      expect(session?.lastConcept).toBe("ترش و تفتەکان و پێوەری pH");
    });

    it("sanitizes legacy leaked chemistry concepts in existing localStorage sessions", () => {
      // Simulate an old session in localStorage that had leaked pH to physics
      const legacyCorrupted = {
        lastRoute: "/home",
        lastSubject: "physics",
        lastConcept: "ترش و تفتەکان و پێوەری pH",
        timestamp: Date.now(),
      };
      localStorage.setItem("zana_session_recovery_v1", JSON.stringify(legacyCorrupted));

      const session = getSessionRecovery();
      expect(session?.lastSubject).toBe("physics");
      expect(session?.lastConcept).toBe("تەزووی کارەبایی و یاسای ئۆم");
      expect(session?.lastConcept).not.toContain("ترش");
    });

    it("triggers welcome back returning notification with last subject", async () => {
      saveSessionPosition("/practice", "chemistry", "electrochemistry");
      await triggerSessionRecoveryNotification("student_test_123");

      const { notificationEngine } = await import("../../notifications/notificationEngine.ts");
      const list = await notificationEngine.getNotifications("student_test_123");
      const welcomeNotif = list.find((n) => n.title.includes("بەخێربێیتەوە"));

      expect(welcomeNotif).toBeDefined();
      expect(welcomeNotif?.title).toBe("بەخێربێیتەوە! دواجار لە کیمیا بوویت");
      expect(welcomeNotif?.message).toBe("دەتوانیت ڕاستەوخۆ لەو وانەیەی کە لێی وەستابوویت بەردەوام بیت.");
      expect(welcomeNotif?.actionUrl).toBe("/practice");
    });
  });

  describe("Kurdish Sorani Error Mapping (getErrorMessage)", () => {
    it("maps known Firebase error codes to Kurdish messages", () => {
      expect(getErrorMessage({ code: "auth/user-not-found" })).toBe("ئەم ئیمەیڵە تۆمار نەکراوە.");
      expect(getErrorMessage({ code: "auth/wrong-password" })).toBe("وشەی نهێنی هەڵەیە.");
      expect(getErrorMessage({ code: "auth/email-already-in-use" })).toBe("ئەم ئیمەیڵە پێشتر تۆمار کراوە.");
      expect(getErrorMessage({ code: "auth/weak-password" })).toBe("وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت.");
      expect(getErrorMessage({ code: "auth/invalid-email" })).toBe("ئیمەیڵەکە دروست نییە.");
      expect(getErrorMessage({ code: "auth/invalid-credential" })).toBe("ئیمەیل یان وشەی نهێنی هەڵەیە.");
      expect(getErrorMessage({ code: "auth/network-request-failed" })).toBe("کێشەی ئینتەرنێت هەیە.");
    });

    it("maps raw error strings containing error codes", () => {
      expect(getErrorMessage(new Error("Firebase: Error (auth/user-not-found)."))).toBe("ئەم ئیمەیڵە تۆمار نەکراوە.");
      expect(getErrorMessage("auth/invalid-credential")).toBe("ئیمەیل یان وشەی نهێنی هەڵەیە.");
    });

    it("preserves already localized Kurdish/Arabic text", () => {
      const kurdishMsg = "تکایە ئیمەیڵەکەت بنووسە";
      expect(getErrorMessage(new Error(kurdishMsg))).toBe(kurdishMsg);
    });

    it("provides fallback for unhandled or null errors", () => {
      expect(getErrorMessage(null)).toBe("هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدە");
      expect(getErrorMessage({ code: "auth/some-weird-code" })).toBe("هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدە");
    });

    it("exposes all required FIREBASE_ERRORS_KU definitions", () => {
      expect(FIREBASE_ERRORS_KU["auth/user-disabled"]).toBeDefined();
      expect(FIREBASE_ERRORS_KU["auth/too-many-requests"]).toBeDefined();
      expect(FIREBASE_ERRORS_KU["auth/internal-error"]).toBeDefined();
    });
  });

  describe("Returning vs New User Detection (checkUserExists)", () => {
    it("detects existing user from Firestore users/{uid} collection", async () => {
      vi.mocked(firebaseService.getFirestoreDb).mockReturnValue({} as unknown as firestoreModule.Firestore);

      vi.mocked(firestoreModule.getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          profile: {
            name: "ئاراس کەرکووکی",
            grade: "12",
            stream: "scientific",
            school: "ئامادەیی کوردستان",
            email: "aras@example.com",
          },
        }),
      } as unknown as firestoreModule.DocumentSnapshot);

      const result = await checkUserExists("student_123");

      expect(result.exists).toBe(true);
      expect(result.isNewUser).toBe(false);
      expect(result.profile).not.toBeNull();
      expect(result.profile?.name).toBe("ئاراس کەرکووکی");
      expect(result.profile?.grade).toBe("12");
      expect(result.profile?.onboardingCompleted).toBe(true);
    });

    it("detects existing user from legacy students/{uid} collection and bridges to users/{uid}", async () => {
      vi.mocked(firebaseService.getFirestoreDb).mockReturnValue({} as unknown as firestoreModule.Firestore);

      // First getDoc for users/{uid} returns false
      // Second getDoc for students/{uid} returns true
      vi.mocked(firestoreModule.getDoc)
        .mockResolvedValueOnce({
          exists: () => false,
          data: () => undefined,
        } as unknown as firestoreModule.DocumentSnapshot)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            name: "سارا ئەحمەد",
            grade: "11",
            stream: "literary",
            school: "ئامادەیی نیشتمان",
            email: "sara@example.com",
          }),
        } as unknown as firestoreModule.DocumentSnapshot);

      vi.mocked(firestoreModule.setDoc).mockResolvedValue(undefined as never);

      const result = await checkUserExists("legacy_student_456");

      expect(result.exists).toBe(true);
      expect(result.isNewUser).toBe(false);
      expect(result.profile?.name).toBe("سارا ئەحمەد");
      expect(firestoreModule.setDoc).toHaveBeenCalled();
    });

    it("returns isNewUser: true when neither Firestore nor local profile exist", async () => {
      vi.mocked(firebaseService.getFirestoreDb).mockReturnValue({} as unknown as firestoreModule.Firestore);

      vi.mocked(firestoreModule.getDoc).mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      } as unknown as firestoreModule.DocumentSnapshot);

      vi.spyOn(studentStorage, "getStudentProfile").mockReturnValue(null);

      const result = await checkUserExists("brand_new_user_789");

      expect(result.exists).toBe(false);
      expect(result.isNewUser).toBe(true);
      expect(result.profile).toBeNull();
    });

    it("detects local storage profile when offline / Firestore unavailable", async () => {
      vi.mocked(firebaseService.getFirestoreDb).mockReturnValue(null);

      vi.spyOn(studentStorage, "getStudentProfile").mockReturnValue({
        id: "offline_user_999",
        name: "دیلان کاروان",
        grade: "12",
        stream: "scientific",
        activeSubject: "chemistry",
        onboardingCompleted: true,
        createdAt: "2026-11-15T00:00:00.000Z",
        updatedAt: "2026-11-15T00:00:00.000Z",
        authoritative: false,
        source: "guest-local",
        masteryBySubject: {},
        xp: 150,
        level: "intermediate",
        streakDays: 5,
        lastActiveDate: "2026-11-15",
        preferredLanguage: "ckb",
      });

      const result = await checkUserExists("offline_user_999");

      expect(result.exists).toBe(true);
      expect(result.isNewUser).toBe(false);
      expect(result.profile?.name).toBe("دیلان کاروان");
    });

    it("never leaks cached localStorage profile from a previous UID on account switch", async () => {
      vi.mocked(firebaseService.getFirestoreDb).mockReturnValue(null);

      vi.spyOn(studentStorage, "getStudentProfile").mockReturnValue({
        id: "student_a_uid",
        name: "Student A",
        grade: "12",
        stream: "scientific",
        activeSubject: "chemistry",
        onboardingCompleted: true,
        createdAt: "2026-11-15T00:00:00.000Z",
        updatedAt: "2026-11-15T00:00:00.000Z",
        authoritative: false,
        source: "guest-local",
        masteryBySubject: {},
        xp: 150,
        level: "intermediate",
        streakDays: 5,
        lastActiveDate: "2026-11-15",
        preferredLanguage: "ckb",
      });
      const deleteSpy = vi.spyOn(studentStorage, "deleteStudentProfile").mockImplementation(() => {});

      const result = await checkUserExists("student_b_uid");

      expect(result.exists).toBe(false);
      expect(result.isNewUser).toBe(true);
      expect(result.profile).toBeNull();
      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Verified Email Flow & Cache Boundaries", () => {
    it("sendVerificationEmail and reloadAndCheckEmailVerified reflect Firebase emailVerified transitions", async () => {
      const fbAuth = await import("firebase/auth");
      const mockUser = {
        uid: "uid_unverified_1",
        email: "new.student@example.com",
        emailVerified: false,
        getIdToken: vi.fn(async () => "refreshed-token"),
        reload: vi.fn(async () => {
          mockUser.emailVerified = true;
        }),
      };

      vi.mocked(firebaseService.getFirebaseAuth).mockReturnValue({
        currentUser: mockUser,
      } as unknown as ReturnType<typeof firebaseService.getFirebaseAuth>);

      const authSvc = await import("../../services/authService.ts");
      const sendRes = await authSvc.sendVerificationEmail(mockUser as never);
      expect(sendRes.ok).toBe(true);

      const checkRes = await authSvc.reloadAndCheckEmailVerified();
      expect(mockUser.reload).toHaveBeenCalledTimes(1);
      expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
      expect(checkRes.verified).toBe(true);
      expect(fbAuth).toBeDefined();
    });

    it("Workbox PWA API cache never caches private student/subscription endpoints and auth UI hides unsupported phone tabs", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const viteCfg = fs.readFileSync(path.resolve(process.cwd(), "vite.config.ts"), "utf8");
      const cacheRuleMatch = viteCfg.match(
        /urlPattern:\s*(\/\^https\?:\\\/\\\/\.\*\\\/api\\\/[^\r\n,]+),\s*\n\s*handler:\s*'NetworkFirst'[\s\S]*?cacheName:\s*'api-responses-cache'/
      );
      expect(cacheRuleMatch).not.toBeNull();
      const patternBody = cacheRuleMatch![1];
      const regex = new RegExp(patternBody.slice(1, patternBody.lastIndexOf("/")), patternBody.slice(patternBody.lastIndexOf("/") + 1));

      expect(regex.test("https://zana.idggov.tech/api/curriculum/pages")).toBe(true);
      expect(regex.test("https://zana.idggov.tech/api/health")).toBe(true);
      expect(regex.test("https://zana.idggov.tech/api/subscription/status")).toBe(false);
      expect(regex.test("https://zana.idggov.tech/api/student/profile")).toBe(false);
      expect(regex.test("https://zana.idggov.tech/api/student/onboard")).toBe(false);
      expect(regex.test("https://zana.idggov.tech/api/trial/start")).toBe(false);

      const loginSrc = fs.readFileSync(path.resolve(process.cwd(), "src/pages/Login.tsx"), "utf8");
      const registerSrc = fs.readFileSync(path.resolve(process.cwd(), "src/pages/Register.tsx"), "utf8");
      expect(loginSrc).not.toMatch(/setAuthMethod\(['"]phone['"]\)/);
      expect(registerSrc).not.toMatch(/setAuthMethod\(['"]phone['"]\)/);
    });
  });
});
