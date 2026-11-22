import { verifyFirebaseIdToken, type VerifyJwtResult } from "./jwtVerifier.ts";

export interface AdminVerifyResult {
  ok: boolean;
  uid?: string;
  email?: string;
  role?: string;
  error?: string;
}

export const ADMIN_EMAILS = ["addmin.official.idg@gmail.com"];

export async function verifyAdmin(
  request: Request,
  env: {
    VITE_FIREBASE_API_KEY?: string;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
    ADMIN_TELEMETRY_SECRET?: string;
    ADMIN_EMAIL?: string;
    ADMIN_EMAILS?: string;
    ALLOW_TEST_AUTH_MOCK?: string;
    ZANA_ENV?: string;
    JWT_SECRET?: string;
    [key: string]: unknown;
  }
): Promise<AdminVerifyResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { ok: false, error: "Empty Bearer token" };
  }

  // Resolve authorized admin emails list
  const configuredEmails = [
    ...ADMIN_EMAILS,
    ...(typeof env.ADMIN_EMAIL === "string" ? [env.ADMIN_EMAIL] : []),
    ...(typeof env.ADMIN_EMAILS === "string" ? env.ADMIN_EMAILS.split(",").map((e) => e.trim()) : []),
  ].map((e) => e.toLowerCase());

  // 1. Cryptographic Firebase ID Token Verification (Human Admin Only)
  // Note: Machine-to-machine telemetry secret is strictly handled via verifyInternalTelemetry()
  // and is NEVER accepted for general administrative routes or data access.

  const projectId = String(
    env.FIREBASE_PROJECT_ID ||
    env.VITE_FIREBASE_PROJECT_ID ||
    (typeof process !== "undefined" ? (process.env?.FIREBASE_PROJECT_ID || process.env?.VITE_FIREBASE_PROJECT_ID) : undefined) ||
    "gen-lang-client-0009572581"
  );

  // Check test auth mode permission: strictly restricted to test environments only
  const zanaEnv = (env.ZANA_ENV ?? (typeof process !== "undefined" ? (process.env?.ZANA_ENV || process.env?.NODE_ENV) : undefined)) as string | undefined;
  const isTestEnvironment = zanaEnv === "test";
  const testMockFlag = env.ALLOW_TEST_AUTH_MOCK ?? (typeof process !== "undefined" ? process.env?.ALLOW_TEST_AUTH_MOCK : undefined);
  const allowTestMock = testMockFlag === "true" && isTestEnvironment;

  // 2. Cryptographic Verification via Web Crypto API (Cached RS256 JWKS)
  const jwkResult: VerifyJwtResult = await verifyFirebaseIdToken(token, projectId, {
    allowTestMock,
    configuredEmails,
  });

  if (jwkResult.ok) {
    return {
      ok: true,
      uid: jwkResult.uid,
      email: jwkResult.email,
      role: jwkResult.role,
    };
  }

  // If in test environment with test credentials, return the rejection
  if (allowTestMock) {
    return { ok: false, error: jwkResult.error || "Unauthorized in test mode" };
  }

  // 3. Fallback: Online Lookup via Google Identity Toolkit (if API key present)
  const apiKey = (env.VITE_FIREBASE_API_KEY || (typeof process !== "undefined" ? process.env?.VITE_FIREBASE_API_KEY : undefined)) as string | undefined;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        }
      );

      if (!res.ok) {
        return { ok: false, error: `Authentication failed: Google Identity Toolkit returned ${res.status}` };
      }

      const data = (await res.json()) as {
        users?: Array<{
          localId: string;
          email?: string;
          customAttributes?: string;
        }>;
      };
      const user = data.users?.[0];
      if (!user) {
        return { ok: false, error: "User not found" };
      }

      const userEmail = (user.email || "").toLowerCase();
      let hasAdminClaim = false;
      let userRole = "system_admin";
      if (user.customAttributes) {
        try {
          const parsedClaims = JSON.parse(user.customAttributes) as Record<string, unknown>;
          if (parsedClaims.admin === true || parsedClaims.role === "SuperAdmin" || parsedClaims.role === "super_admin") {
            hasAdminClaim = true;
            userRole = (parsedClaims.role as string) || "super_admin";
          }
        } catch {
          // ignore
        }
      }

      const isAuthorizedEmail = Boolean(userEmail && configuredEmails.includes(userEmail));
      if (!isAuthorizedEmail && !hasAdminClaim) {
        return { ok: false, error: "User is not an admin" };
      }

      return {
        ok: true,
        uid: user.localId,
        email: user.email || configuredEmails[0],
        role: userRole,
      };
    } catch {
      return { ok: false, error: "Authentication failed: unable to verify credentials with identity provider" };
    }
  }

  // 4. Default Deny
  return { ok: false, error: jwkResult.error || "Unauthorized: Verification service unavailable (deny-by-default)" };
}

/**
 * Dedicated machine-to-machine & internal telemetry verification.
 * Strictly permitted ONLY for internal telemetry endpoints (e.g. /api/internal/telemetry).
 * Cannot be used to access human administrative routes (e.g. /api/admin/*, student lists, subscription management).
 */
export async function verifyInternalTelemetry(
  request: Request,
  env: {
    ADMIN_TELEMETRY_SECRET?: string;
    [key: string]: unknown;
  }
): Promise<{ ok: boolean; error?: string }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { ok: false, error: "Empty Bearer token" };
  }

  // 1. Explicit Machine-to-Machine Secret (Only valid for internal telemetry)
  if (env.ADMIN_TELEMETRY_SECRET && token === env.ADMIN_TELEMETRY_SECRET) {
    return { ok: true };
  }

  // 2. Also allow verified human admin credentials
  const humanAdminCheck = await verifyAdmin(request, env as never);
  if (humanAdminCheck.ok) {
    return { ok: true };
  }

  return { ok: false, error: "Unauthorized: Invalid telemetry secret or admin token" };
}
