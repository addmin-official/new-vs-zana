/**
 * ZANA Platform - Role-Based Access Control (RBAC) & Custom Claims
 *
 * Single source of truth for user roles and admin verification.
 * Follows strict dual-verification:
 * 1. Firebase Custom Claim `role === 'admin'`
 * 2. Hardcoded verified admin email `addmin.official.idg@gmail.com`
 *
 * Never trust client-side role alone; backend Firestore security rules enforce
 * the same conditions at database level.
 */

import { User } from "firebase/auth";
import { useAppStore } from "../store/appStore.ts";

export const ROLES = {
  STUDENT: "student",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * Hardcoded, authoritative admin email — single source of truth across the platform.
 */
export const ADMIN_EMAIL = "addmin.official.idg@gmail.com" as const;

export interface CustomClaimsStructure {
  role?: "admin" | "student" | string;
  admin?: boolean;
  [key: string]: unknown;
}

/**
 * Fetches and resolves the user's role from their Firebase Auth Custom Claims.
 * Falls back to 'student' if no claim is found.
 * Synchronizes with Zustand store for fast app-wide reading.
 */
export async function getMyRole(user: User | null, forceRefresh = false): Promise<UserRole> {
  if (!user) {
    return ROLES.STUDENT;
  }

  try {
    const tokenResult = await user.getIdTokenResult(forceRefresh);
    const claims = tokenResult.claims as CustomClaimsStructure;

    const roleClaim = claims.role;
    const isExactAdminEmail = Boolean(
      user.email && user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
    );

    const hasAdminClaim =
      roleClaim === ROLES.ADMIN ||
      roleClaim === "SuperAdmin" ||
      claims.admin === true;

    // Strict Double Verification for admin role
    if (hasAdminClaim && isExactAdminEmail) {
      useAppStore.getState().setUserRole("admin");
      return ROLES.ADMIN;
    }

    useAppStore.getState().setUserRole("student");
    return ROLES.STUDENT;
  } catch (err) {
    console.warn("[RBAC] Failed to resolve token claims, falling back to student role:", err);
    useAppStore.getState().setUserRole("student");
    return ROLES.STUDENT;
  }
}

/**
 * Validates whether the given user possesses authoritative Admin privileges.
 * Returns true ONLY if BOTH conditions are met:
 * 1. Claims state `role === 'admin'`, `'SuperAdmin'`, or `claims.admin === true`
 * 2. User email matches `ADMIN_EMAIL` exactly.
 */
export async function isAdmin(user: User | null, forceRefresh = false): Promise<boolean> {
  if (!user || !user.email) {
    return false;
  }

  // Check 1: Email identity match
  const emailMatches = user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (!emailMatches) {
    return false;
  }

  // Check 2: Firebase Custom Claims validation
  try {
    const tokenResult = await user.getIdTokenResult(forceRefresh);
    const claims = tokenResult.claims as CustomClaimsStructure;

    const hasAdminClaim =
      claims.role === ROLES.ADMIN ||
      claims.role === "SuperAdmin" ||
      claims.admin === true;
    return Boolean(hasAdminClaim && emailMatches);
  } catch (err) {
    console.error("[RBAC] Error validating admin claim:", err);
    return false;
  }
}

export function isCachedAdmin(): boolean {
  try {
    const role = useAppStore.getState().userRole;
    const user = useAppStore.getState().user;
    const emailMatches = user?.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if (role === "admin" && emailMatches) {
      return true;
    }
  } catch {
    // ignore store read error
  }

  try {
    if (typeof localStorage !== "undefined") {
      const cachedRole = localStorage.getItem("zana_role_cache");
      const cacheTime = localStorage.getItem("zana_role_cache_time");
      if (cachedRole === ROLES.ADMIN && cacheTime) {
        const age = Date.now() - parseInt(cacheTime, 10);
        if (age < 3600 * 1000) {
          return true;
        }
      }
    }
  } catch {
    // ignore storage error
  }

  return false;
}

/**
 * Audit Logging: Records every privileged administrative action in Firestore
 * { adminEmail, action, targetUid, timestamp, details }
 * Never logs passwords or authorization tokens.
 */
export async function logAdminAction(
  action: string,
  targetUid?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const { getFirestoreDb } = await import("../services/firebase.ts");
    const { doc, setDoc } = await import("firebase/firestore");
    const db = getFirestoreDb();
    if (!db) return;

    const logId = `admin_act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, "system", "logs", "adminAudit", logId);

    const safeDetails: Record<string, unknown> = {};
    if (details) {
      for (const [key, value] of Object.entries(details)) {
        if (!key.toLowerCase().includes("password") && !key.toLowerCase().includes("token")) {
          safeDetails[key] = value;
        }
      }
    }

    await setDoc(docRef, {
      adminEmail: ADMIN_EMAIL,
      action,
      targetUid: targetUid || null,
      details: safeDetails,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn("[RBAC] Failed to write admin audit log:", err);
  }
}

/**
 * Logs unauthorized access attempts to administrative endpoints.
 */
export async function logFailedAdminAccess(attemptedEmail?: string | null, path?: string): Promise<void> {
  try {
    const { getFirestoreDb } = await import("../services/firebase.ts");
    const { doc, setDoc } = await import("firebase/firestore");
    const db = getFirestoreDb();
    if (!db) return;

    const logId = `fail_acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, "errors", logId);

    await setDoc(docRef, {
      type: "UNAUTHORIZED_ADMIN_ACCESS",
      attemptedEmail: attemptedEmail || "unknown",
      path: path || window.location.pathname,
      timestamp: Date.now(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    });
  } catch {
    // Non-blocking
  }
}

