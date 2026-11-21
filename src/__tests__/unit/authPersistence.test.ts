import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  saveSessionPosition,
  getSessionRecovery,
  clearSessionRecovery,
  getSubjectKurdishName,
  triggerSessionRecoveryNotification,
} from "../../auth/sessionRecovery.ts";
import { getErrorMessage, FIREBASE_ERRORS_KU } from "../../services/authService.ts";
import { checkUserExists } from "../../auth/userProfileService.ts";
import * as firestoreModule from "firebase/firestore";
import * as firebaseService from "../../services/firebase.ts";
import * as studentStorage from "../../features/student/studentStorage.ts";

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
  });
});
