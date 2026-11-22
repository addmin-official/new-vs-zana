import type { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from "express";
import { verifyFirebaseIdToken, type VerifiedTokenClaims } from "../auth/tokenVerification.ts";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  claims?: VerifiedTokenClaims;
}

export interface AuthResult {
  ok: boolean;
  status: number;
  user?: AuthenticatedUser;
  error?: string;
}

/**
 * Shared token verification core for both Cloudflare Workers and Express.
 * Strictly verifies the Bearer token against Firebase Auth JWKs.
 */
export async function verifyAuthToken(
  authHeader: string | null,
  projectId?: string
): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      ok: false,
      status: 401,
      error: "Authorization header with Bearer token is required.",
    };
  }

  const token = authHeader.substring(7).trim();
  if (!token || token === "null" || token === "undefined") {
    return {
      ok: false,
      status: 401,
      error: "Authorization token cannot be empty.",
    };
  }

  // Production Security Barrier:
  // In production (NODE_ENV === 'production' or ZANA_ENV === 'production'), mock tokens are UNCONDITIONALLY FORBIDDEN.
  // No mock token flag, environment override, or test payload can bypass cryptographic verification in production.
  const isProduction =
    typeof process !== "undefined" &&
    (process.env?.NODE_ENV === "production" || process.env?.ZANA_ENV === "production");

  const isExplicitTestMode =
    !isProduction &&
    typeof process !== "undefined" &&
    (process.env?.NODE_ENV === "test" || process.env?.ZANA_ENV === "test") &&
    process.env?.ALLOW_TEST_AUTH_MOCK === "true";

  if (isExplicitTestMode && !token.includes(".")) {
    return {
      ok: true,
      status: 200,
      user: {
        uid: token.slice(0, 32),
        email: `${token.slice(0, 16)}@test.zana.krd`,
      },
    };
  }

  try {
    const claims = await verifyFirebaseIdToken(token, projectId);
    return {
      ok: true,
      status: 200,
      user: {
        uid: claims.uid,
        email: claims.email,
        claims,
      },
    };
  } catch (err: unknown) {
    return {
      ok: false,
      status: 401,
      error: (err as Error)?.message || "Invalid or expired Firebase ID token.",
    };
  }
}

/**
 * Worker-compatible auth guard for student-scoped AI routes.
 * Returns { user } if valid, or a 401 Response if unauthenticated.
 */
export async function verifyAuthWorker(
  request: Request,
  env: { FIREBASE_PROJECT_ID?: string; [key: string]: unknown },
  responseHeaders?: Headers | Record<string, string>
): Promise<{ user: AuthenticatedUser } | Response> {
  const authHeader = request.headers.get("Authorization");
  const result = await verifyAuthToken(
    authHeader,
    (env.FIREBASE_PROJECT_ID as string) || "gen-lang-client-0009572581"
  );

  if (!result.ok || !result.user) {
    const headers = new Headers(responseHeaders);
    headers.set("Content-Type", "application/json");
    headers.set("WWW-Authenticate", 'Bearer realm="zana-ai", error="invalid_token"');

    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        detail: result.error || "پێویستە بچیتە ژوورەوە بۆ ئەنجامدانی ئەم داواکارییە.",
      }),
      {
        status: 401,
        headers,
      }
    );
  }

  return { user: result.user };
}

/**
 * Express middleware for student-scoped AI routes.
 */
export function verifyAuthExpress(projectId?: string) {
  return async (req: ExpressRequest, res: ExpressResponse, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization || null;
    const result = await verifyAuthToken(authHeader, projectId);

    if (!result.ok || !result.user) {
      res.status(401).json({
        error: "Unauthorized",
        detail: result.error || "پێویستە بچیتە ژوورەوە بۆ ئەنجامدانی ئەم داواکارییە.",
      });
      return;
    }

    (req as ExpressRequest & { user: AuthenticatedUser }).user = result.user;
    next();
  };
}
