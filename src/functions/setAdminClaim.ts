/**
 * ZANA Platform - Firebase Cloud Functions: Custom Claims RBAC Setup
 *
 * Automatically assigns:
 * - 'admin' role if user.email === ADMIN_EMAIL (addmin.official.idg@gmail.com)
 * - 'student' role for all other user registrations.
 *
 * Also provides callable function setAdminClaimManual for authoritative admin
 * claim assignment, guarded by strict email verification.
 */

import * as adminNamespace from "firebase-admin";

export const ADMIN_EMAIL = "addmin.official.idg@gmail.com";

export interface UserRecordLike {
  uid: string;
  email?: string | null;
}

export interface CallableContextLike {
  auth?: {
    uid: string;
    token: {
      email?: string;
      role?: string;
      [key: string]: unknown;
    };
  };
}

export interface AuthInstanceLike {
  setCustomUserClaims: (uid: string, claims: Record<string, unknown> | null) => Promise<void>;
  getUser?: (uid: string) => Promise<{ uid: string; email?: string | null }>;
  getUserByEmail?: (email: string) => Promise<{ uid: string; email?: string | null }>;
}

function getAdminAuth(): AuthInstanceLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = (adminNamespace as any).default || adminNamespace;
    if (admin && admin.apps && !admin.apps.length && typeof admin.initializeApp === "function") {
      admin.initializeApp();
    }
    return typeof admin?.auth === "function" ? admin.auth() : null;
  } catch {
    return null;
  }
}

/**
 * Triggered automatically upon every Firebase user creation.
 * Assigns admin claim if email matches ADMIN_EMAIL, otherwise assigns student claim.
 */
export async function handleSetAdminOnCreate(
  user: UserRecordLike,
  authOverride?: AuthInstanceLike
): Promise<{ uid: string; role: string; assignedRole: string }> {
  const auth = authOverride || getAdminAuth();
  const userEmail = user.email?.trim().toLowerCase();
  const isAdminUser = Boolean(userEmail && userEmail === ADMIN_EMAIL.toLowerCase());

  const role = isAdminUser ? "admin" : "student";
  const customClaims = {
    role,
    ...(isAdminUser ? { admin: true } : {}),
  };

  if (auth && typeof auth.setCustomUserClaims === "function") {
    await auth.setCustomUserClaims(user.uid, customClaims);
  }

  return {
    uid: user.uid,
    role,
    assignedRole: role,
  };
}

export const setAdminClaimOnCreate = handleSetAdminOnCreate;
export const onUserCreate = handleSetAdminOnCreate;

/**
 * Callable function for manual role assignment / revocation.
 * Security: Callable ONLY by the authenticated admin user (addmin.official.idg@gmail.com).
 */
export async function handleSetAdminClaimManual(
  targetOrData: string | { targetUid: string; makeAdmin: boolean },
  callerOrContext?: string | CallableContextLike,
  authOverride?: AuthInstanceLike
): Promise<{ success: boolean; targetUid: string; assignedRole: string }> {
  const auth = authOverride || getAdminAuth();

  let callerEmail: string | undefined;

  if (typeof targetOrData === "string") {
    // Direct invocation with target email/uid and caller email
    callerEmail = typeof callerOrContext === "string" ? callerOrContext : undefined;
  } else {
    // Standard Cloud Function callable structure
    const context = callerOrContext as CallableContextLike | undefined;
    if (!context?.auth) {
      throw new Error("UNAUTHENTICATED: Authentication is required to invoke this function.");
    }
    callerEmail = context.auth.token.email;
  }

  // Guard: Caller email must strictly be the authoritative ADMIN_EMAIL
  if (!callerEmail || callerEmail.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error("Unauthorized: Only the root platform administrator can assign claims.");
  }

  let targetUid = "";
  let makeAdmin = true;

  if (typeof targetOrData === "string") {
    const target = targetOrData.trim();
    if (auth?.getUserByEmail && target.includes("@")) {
      const user = await auth.getUserByEmail(target);
      targetUid = user?.uid || target;
    } else {
      targetUid = target;
    }
  } else {
    targetUid = targetOrData.targetUid;
    makeAdmin = targetOrData.makeAdmin;
  }

  if (!targetUid) {
    throw new Error("INVALID_ARGUMENT: Target user UID is required.");
  }

  const newRole = makeAdmin ? "admin" : "student";
  const claims = {
    role: newRole,
    ...(makeAdmin ? { admin: true } : {}),
  };

  if (auth && typeof auth.setCustomUserClaims === "function") {
    await auth.setCustomUserClaims(targetUid, claims);
  }

  return {
    success: true,
    targetUid,
    assignedRole: newRole,
  };
}
