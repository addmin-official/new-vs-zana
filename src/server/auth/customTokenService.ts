/**
 * ZANA Platform - Native Web Crypto Firebase Custom Token Minting Service
 *
 * Implements standard RS256 JWT signing for Firebase Custom Authentication
 * using standard Web Crypto API (SubtleCrypto) without Node.js firebase-admin.
 *
 * This allows Cloudflare Workers to mint legitimate Firebase Custom Tokens
 * on the free Spark plan without enabling Google Cloud Billing or Firebase Blaze!
 */

export interface FirebaseServiceAccount {
  client_email: string;
  private_key: string;
  project_id?: string;
  [key: string]: unknown;
}

export interface MintTokenOptions {
  serviceAccountJson?: string | FirebaseServiceAccount;
  uid: string;
  claims?: Record<string, unknown>;
  expiresInSeconds?: number; // Defaults to 3600 (1 hour max per Firebase specs)
}

export interface MintTokenResult {
  ok: boolean;
  customToken?: string;
  error?: string;
  errorKu?: string;
}

/**
 * Base64URL encoding helper for strings
 */
function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Base64URL encoding helper for ArrayBuffer
 */
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Parse PEM encoded PKCS#8 RSA private key to binary ArrayBuffer.
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const clean = pem
    .replace(/-----BEGIN[ A-Z0-9_-]+-----/g, "")
    .replace(/-----END[ A-Z0-9_-]+-----/g, "")
    .replace(/\s+/g, "");

  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Safely parse Service Account credentials from JSON or base64 JSON string.
 */
export function parseServiceAccount(
  input?: string | FirebaseServiceAccount
): FirebaseServiceAccount | null {
  if (!input) return null;

  if (typeof input === "object" && input !== null) {
    if (input.client_email && input.private_key) {
      return input;
    }
    return null;
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;

    try {
      // 1. Direct JSON parse
      const parsed = JSON.parse(trimmed) as FirebaseServiceAccount;
      if (parsed.client_email && parsed.private_key) {
        return parsed;
      }
    } catch {
      // 2. Base64 encoded JSON
      try {
        const decoded = atob(trimmed);
        const parsed = JSON.parse(decoded) as FirebaseServiceAccount;
        if (parsed.client_email && parsed.private_key) {
          return parsed;
        }
      } catch {
        return null;
      }
    }
  }

  return null;
}

/**
 * Checks if custom token minting is configured with a valid service account.
 */
export function isCustomTokenServiceConfigured(
  serviceAccountInput?: string | FirebaseServiceAccount
): boolean {
  return Boolean(parseServiceAccount(serviceAccountInput));
}

/**
 * Mint a Firebase Custom Token (RS256 JWT) signed with the Google Service Account private key.
 *
 * Conforms to Google Identity Toolkit specification:
 * - iss: client_email
 * - sub: client_email
 * - aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit"
 * - iat: current unix timestamp (sec)
 * - exp: iat + 3600 (sec)
 * - uid: target user's UID
 * - claims: optional custom claims dictionary
 */
export async function mintFirebaseCustomToken(
  options: MintTokenOptions
): Promise<MintTokenResult> {
  const { serviceAccountJson, uid, claims, expiresInSeconds = 3600 } = options;

  if (!uid || typeof uid !== "string" || uid.length < 1 || uid.length > 128) {
    return {
      ok: false,
      error: "INVALID_UID",
      errorKu: "ناسنامەی بەکارهێنەر (UID) دروست نییە.",
    };
  }

  const serviceAccount = parseServiceAccount(serviceAccountJson);
  if (!serviceAccount) {
    return {
      ok: false,
      error: "SERVICE_ACCOUNT_NOT_CONFIGURED",
      errorKu: "کلیلی ڕێگەپێدانی فایربەیس (Service Account) لە ڕاژەکار ئامادە نەکراوە.",
    };
  }

  const { client_email, private_key } = serviceAccount;
  if (!client_email || !private_key) {
    return {
      ok: false,
      error: "INVALID_SERVICE_ACCOUNT_CREDENTIALS",
      errorKu: "زانیارییەکانی کلیلی ڕێگەپێدانی فایربەیس ناتەواون.",
    };
  }

  try {
    // 1. Import Private Key via Web Crypto
    const derBuffer = pemToArrayBuffer(private_key);
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      derBuffer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-256" },
      },
      false,
      ["sign"]
    );

    // 2. Build JWT Header & Payload
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: "RS256",
      typ: "JWT",
    };

    const payload: Record<string, unknown> = {
      iss: client_email,
      sub: client_email,
      aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
      iat: now,
      exp: now + Math.min(Math.max(expiresInSeconds, 60), 3600),
      uid: uid.trim(),
    };

    if (claims && typeof claims === "object" && Object.keys(claims).length > 0) {
      payload.claims = claims;
    }

    // 3. Encode & Sign
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const dataToSign = new TextEncoder().encode(signingInput);
    const signatureBuffer = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      dataToSign
    );

    const encodedSignature = bufferToBase64Url(signatureBuffer);
    const customToken = `${signingInput}.${encodedSignature}`;

    return {
      ok: true,
      customToken,
    };
  } catch (err) {
    console.error("[mintFirebaseCustomToken] Signing error:", err);
    return {
      ok: false,
      error: "TOKEN_SIGNING_FAILED",
      errorKu: "واژۆکردنی تۆکنی چوونەژوورەوە سەرکەوتوو نەبوو.",
    };
  }
}
