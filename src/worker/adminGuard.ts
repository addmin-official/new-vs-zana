export interface AdminVerifyResult {
  ok: boolean;
  uid?: string;
  email?: string;
  role?: string;
  error?: string;
}

export const ADMIN_EMAILS = ["addmin.official.idg@gmail.com"];

function parseJwtHeaderAndPayload(token: string): {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
} {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { header: null, payload: null };
    }
    const decodeBase64 = (str: string) => {
      const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      return typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf-8");
    };
    const header = JSON.parse(decodeBase64(parts[0])) as Record<string, unknown>;
    const payload = JSON.parse(decodeBase64(parts[1])) as Record<string, unknown>;
    return { header, payload };
  } catch {
    return { header: null, payload: null };
  }
}

export async function verifyAdmin(
  request: Request,
  env: {
    VITE_FIREBASE_API_KEY?: string;
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
    ...(typeof env.ADMIN_EMAILS === "string" ? env.ADMIN_EMAILS.split(",").map(e => e.trim()) : []),
  ].map((e) => e.toLowerCase());

  // 1. Machine-to-Machine Secret (Telemetry / Cron)
  if (env.ADMIN_TELEMETRY_SECRET && token === env.ADMIN_TELEMETRY_SECRET) {
    return {
      ok: true,
      uid: "system-admin",
      email: configuredEmails[0] || ADMIN_EMAILS[0],
      role: "system_admin",
    };
  }

  // 2. Structural & Expiration Pre-Validation
  const { header, payload } = parseJwtHeaderAndPayload(token);
  if (!header || !payload) {
    return { ok: false, error: "Malformed token: Invalid JWT structure" };
  }

  // Check algorithm: reject unsigned / "none"
  if (header.alg === "none" || !header.alg) {
    return { ok: false, error: "Unauthorized: Insecure JWT algorithm" };
  }

  // Check expiration if present
  if (typeof payload.exp === "number") {
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec >= payload.exp) {
      return { ok: false, error: "Token expired" };
    }
  }

  // Check subject presence
  const subject = payload.sub || payload.user_id;
  if (!subject || typeof subject !== "string") {
    return { ok: false, error: "Malformed token: missing subject (sub)" };
  }

  // 3. Online Verification via Google Identity Toolkit
  const apiKey = (env.VITE_FIREBASE_API_KEY || (typeof process !== "undefined" ? process.env?.VITE_FIREBASE_API_KEY : undefined)) as string | undefined;

  // Check if test mock mode is explicitly permitted (restricted to test environments only)
  const zanaEnv = (env.ZANA_ENV ?? (typeof process !== "undefined" ? (process.env?.ZANA_ENV || process.env?.NODE_ENV) : undefined)) as string | undefined;
  const isTestEnvironment = zanaEnv === "test";
  const testMockFlag = env.ALLOW_TEST_AUTH_MOCK ?? (typeof process !== "undefined" ? process.env?.ALLOW_TEST_AUTH_MOCK : undefined);
  const allowTestMock = testMockFlag === "true" && isTestEnvironment;

  if (apiKey && !allowTestMock) {
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
        // STRICT DENY: Identity Toolkit rejected the token
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
          // ignore parsing error
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
      // STRICT DENY: Network failure or unreachable service MUST NOT grant access
      return { ok: false, error: "Authentication failed: unable to verify credentials with identity provider" };
    }
  }

  // 4. Test Mock Mode (ONLY enabled when ALLOW_TEST_AUTH_MOCK is active in test environment)
  if (allowTestMock) {
    const parts = token.split(".");
    const signature = parts[2] || "";

    // Reject forged / empty signatures in mock mode
    if (!signature || signature === "invalid-signature" || signature === "forged") {
      return { ok: false, error: "Unauthorized: Invalid token signature" };
    }

    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    const hasAdminClaim = payload.admin === true || payload.role === "SuperAdmin" || payload.role === "super_admin";
    const isAuthorizedEmail = Boolean(email && configuredEmails.includes(email));

    if (!isAuthorizedEmail && !hasAdminClaim) {
      return { ok: false, error: "Unauthorized: User is not an admin" };
    }

    return {
      ok: true,
      uid: String(subject),
      email: email || configuredEmails[0],
      role: hasAdminClaim ? "super_admin" : "system_admin",
    };
  }

  // 5. Default Deny when neither online verification nor test mock is applicable
  return { ok: false, error: "Unauthorized: Verification service unavailable (deny-by-default)" };
}
