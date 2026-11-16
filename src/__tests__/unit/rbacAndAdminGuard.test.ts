import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  ROLES,
  ADMIN_EMAIL,
  getMyRole,
  isAdmin,
  isCachedAdmin,
  logAdminAction,
  logFailedAdminAccess,
} from "../../auth/roles.ts";
import { handleSetAdminOnCreate, handleSetAdminClaimManual } from "../../functions/setAdminClaim.ts";
import { User, IdTokenResult } from "firebase/auth";

vi.mock("../../services/firebase.ts", () => ({
  getFirestoreDb: vi.fn(() => null),
  getFirebaseAuth: vi.fn(() => null),
  isFirebaseConfigured: vi.fn(() => false),
}));

describe("Role-Based Access Control (RBAC) & Custom Claims", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Hardcoded Admin Authority & Constants", () => {
    it("enforces authoritative admin email addmin.official.idg@gmail.com", () => {
      expect(ADMIN_EMAIL).toBe("addmin.official.idg@gmail.com");
    });

    it("defines student and admin roles", () => {
      expect(ROLES.STUDENT).toBe("student");
      expect(ROLES.ADMIN).toBe("admin");
    });
  });

  describe("getMyRole & isAdmin Double Verification", () => {
    function createMockUser(email: string | null, claims: Record<string, unknown> = {}): User {
      return {
        uid: "test_uid_123",
        email,
        getIdTokenResult: vi.fn(async (forceRefresh?: boolean) => {
          return {
            claims,
            token: "mock_jwt_token",
            authTime: "now",
            issuedAtTime: "now",
            expirationTime: "later",
            signInProvider: "password",
            signInSecondFactor: null,
          } as unknown as IdTokenResult;
        }),
      } as unknown as User;
    }

    it("defaults to student if user is null or undefined", async () => {
      expect(await getMyRole(null)).toBe(ROLES.STUDENT);
      expect(await isAdmin(null)).toBe(false);
    });

    it("returns student if user has no email", async () => {
      const user = createMockUser(null, { role: "admin" });
      expect(await getMyRole(user)).toBe(ROLES.STUDENT);
      expect(await isAdmin(user)).toBe(false);
    });

    it("grants admin role when claim role is admin AND email matches authorized ADMIN_EMAIL", async () => {
      const adminUser = createMockUser("addmin.official.idg@gmail.com", { role: "admin" });
      const role = await getMyRole(adminUser);
      const isUserAdmin = await isAdmin(adminUser);

      expect(role).toBe(ROLES.ADMIN);
      expect(isUserAdmin).toBe(true);
    });

    it("supports case-insensitive email matching for authorized admin", async () => {
      const adminUser = createMockUser("ADDMIN.OFFICIAL.IDG@GMAIL.COM", { role: "admin" });
      const role = await getMyRole(adminUser);
      expect(role).toBe(ROLES.ADMIN);
      expect(await isAdmin(adminUser)).toBe(true);
    });

    it("supports boolean admin claim flag", async () => {
      const adminUser = createMockUser("addmin.official.idg@gmail.com", { admin: true });
      expect(await getMyRole(adminUser)).toBe(ROLES.ADMIN);
      expect(await isAdmin(adminUser)).toBe(true);
    });

    it("DENIES admin role if claim is admin but email is unauthorized (Double Verification Layer 1)", async () => {
      const imposterUser = createMockUser("hacker@malicious.com", { role: "admin" });
      const role = await getMyRole(imposterUser);
      const isUserAdmin = await isAdmin(imposterUser);

      expect(role).toBe(ROLES.STUDENT);
      expect(isUserAdmin).toBe(false);
    });

    it("DENIES admin role if email matches authorized admin but claims are missing (Double Verification Layer 2)", async () => {
      const freshUser = createMockUser("addmin.official.idg@gmail.com", { role: "student" });
      const role = await getMyRole(freshUser);
      const isUserAdmin = await isAdmin(freshUser);

      expect(role).toBe(ROLES.STUDENT);
      expect(isUserAdmin).toBe(false);
    });

    it("DENIES admin role if user has ordinary student credentials", async () => {
      const student = createMockUser("student@krd.edu", { role: "student" });
      expect(await getMyRole(student)).toBe(ROLES.STUDENT);
      expect(await isAdmin(student)).toBe(false);
    });

    it("passes forceRefresh boolean flag to getIdTokenResult", async () => {
      const adminUser = createMockUser("addmin.official.idg@gmail.com", { role: "admin" });
      await isAdmin(adminUser, true);
      expect(adminUser.getIdTokenResult).toHaveBeenCalledWith(true);
    });
  });

  describe("Cached Admin Helper", () => {
    it("returns false if nothing is in localStorage", () => {
      expect(isCachedAdmin()).toBe(false);
    });

    it("returns true if valid unexpired admin cache exists", () => {
      localStorage.setItem("zana_role_cache", ROLES.ADMIN);
      localStorage.setItem("zana_role_cache_time", Date.now().toString());

      expect(isCachedAdmin()).toBe(true);
    });

    it("returns false if cached role is not admin", () => {
      localStorage.setItem("zana_role_cache", ROLES.STUDENT);
      localStorage.setItem("zana_role_cache_time", Date.now().toString());

      expect(isCachedAdmin()).toBe(false);
    });

    it("returns false if admin cache has expired (> 1 hour)", () => {
      localStorage.setItem("zana_role_cache", ROLES.ADMIN);
      const pastTime = Date.now() - 2 * 60 * 60 * 1000;
      localStorage.setItem("zana_role_cache_time", pastTime.toString());

      expect(isCachedAdmin()).toBe(false);
    });
  });

  describe("Cloud Function Claims Logic (setAdminClaim)", () => {
    it("assigns admin claim on user creation when email matches ADMIN_EMAIL", async () => {
      const mockSetCustomUserClaims = vi.fn().mockResolvedValue(undefined);
      const mockAuth = {
        setCustomUserClaims: mockSetCustomUserClaims,
      };

      const result = await handleSetAdminOnCreate(
        { uid: "uid_admin_001", email: "addmin.official.idg@gmail.com" },
        mockAuth
      );

      expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid_admin_001", {
        role: "admin",
        admin: true,
      });
      expect(result.assignedRole).toBe("admin");
    });

    it("assigns student claim on user creation for normal students", async () => {
      const mockSetCustomUserClaims = vi.fn().mockResolvedValue(undefined);
      const mockAuth = {
        setCustomUserClaims: mockSetCustomUserClaims,
      };

      const result = await handleSetAdminOnCreate(
        { uid: "uid_student_001", email: "student@school.krd" },
        mockAuth
      );

      expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid_student_001", {
        role: "student",
      });
      expect(result.assignedRole).toBe("student");
    });

    it("handles manual admin claim assignment successfully", async () => {
      const mockSetCustomUserClaims = vi.fn().mockResolvedValue(undefined);
      const mockAuth = {
        getUserByEmail: vi.fn().mockResolvedValue({ uid: "admin_uid_777", email: "addmin.official.idg@gmail.com" }),
        setCustomUserClaims: mockSetCustomUserClaims,
      };

      const res = await handleSetAdminClaimManual(
        "addmin.official.idg@gmail.com",
        "addmin.official.idg@gmail.com",
        mockAuth
      );

      expect(res.success).toBe(true);
      expect(res.targetUid).toBe("admin_uid_777");
    });

    it("rejects manual assignment if requester is not authorized admin email", async () => {
      const mockAuth = {
        getUserByEmail: vi.fn(),
        setCustomUserClaims: vi.fn(),
      };

      await expect(
        handleSetAdminClaimManual("imposter@gmail.com", "other@gmail.com", mockAuth)
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("Audit & Security Logging", () => {
    it("handles logAdminAction gracefully without crashing when offline", async () => {
      await expect(logAdminAction("RESET_PASSWORD", "std_1", { test: true })).resolves.not.toThrow();
    });

    it("handles logFailedAdminAccess gracefully without throwing", async () => {
      await expect(logFailedAdminAccess("student@gmail.com", "/admin")).resolves.not.toThrow();
    });
  });
});
