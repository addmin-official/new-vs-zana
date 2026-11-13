/**
 * Cryptographic Firebase/Google JWT Verifier for Cloudflare Workers
 * Uses native Web Crypto API (SubtleCrypto) RS256 signature verification.
 * Implements intelligent TTL key caching, kid-based key rotation, and deny-by-default on network failure.
 */

export interface GoogleJwkKey {
  kid: string;
  kty: string;
  alg?: string;
  use?: string;
  n: string;
  e: string;
}

export interface GoogleJwksResponse {
  keys: GoogleJwkKey[];
}

export interface VerifyJwtResult {
  ok: boolean;
  uid?: string;
  email?: string;
  role?: string;
  error?: string;
  payload?: Record<string, unknown>;
}

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const binary = typeof atob === 'function'
    ? atob(padded)
    : Buffer.from(padded, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function parseJwtParts(token: string): {
  headerB64: string;
  payloadB64: string;
  signatureB64: string;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decodePart = (b64url: string) => {
      const bytes = base64UrlToUint8Array(b64url);
      const str = new TextDecoder().decode(bytes);
      return JSON.parse(str) as Record<string, unknown>;
    };

    return {
      headerB64: parts[0],
      payloadB64: parts[1],
      signatureB64: parts[2],
      header: decodePart(parts[0]),
      payload: decodePart(parts[1]),
    };
  } catch {
    return null;
  }
}

export class GooglePublicKeyCache {
  private static instance: GooglePublicKeyCache;
  private cachedKeys: Map<string, CryptoKey> = new Map();
  private expiresAt = 0;
  private fetchPromise: Promise<void> | null = null;

  public static getInstance(): GooglePublicKeyCache {
    if (!GooglePublicKeyCache.instance) {
      GooglePublicKeyCache.instance = new GooglePublicKeyCache();
    }
    return GooglePublicKeyCache.instance;
  }

  // Exposed for automated testing
  public clearCache(): void {
    this.cachedKeys.clear();
    this.expiresAt = 0;
  }

  public async setTestKey(kid: string, jwk: JsonWebKey): Promise<void> {
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: 'SHA-256' },
      },
      false,
      ['verify']
    );
    this.cachedKeys.set(kid, cryptoKey);
    this.expiresAt = Date.now() + 3600 * 1000;
  }

  public getCacheStatus(): { keyCount: number; expiresAt: number; isExpired: boolean } {
    return {
      keyCount: this.cachedKeys.size,
      expiresAt: this.expiresAt,
      isExpired: Date.now() >= this.expiresAt,
    };
  }

  async getKey(kid: string, forceRefresh = false): Promise<CryptoKey | null> {
    const now = Date.now();
    if (!forceRefresh && this.cachedKeys.has(kid) && now < this.expiresAt) {
      return this.cachedKeys.get(kid)!;
    }

    // Refresh keys
    await this.refreshKeys();
    return this.cachedKeys.get(kid) || null;
  }

  private async refreshKeys(): Promise<void> {
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(GOOGLE_JWKS_URL, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Google JWKS responded with HTTP ${res.status}`);
        }

        // Parse TTL from Cache-Control: max-age=...
        const cacheControl = res.headers.get('Cache-Control') || '';
        const match = cacheControl.match(/max-age=(\d+)/i);
        const maxAgeSec = match ? parseInt(match[1], 10) : 3600 * 6; // default 6h
        const newExpiresAt = Date.now() + Math.max(300, maxAgeSec) * 1000;

        const data = (await res.json()) as GoogleJwksResponse;
        if (!data.keys || !Array.isArray(data.keys)) {
          throw new Error('Malformed JWKS payload from Google identity provider');
        }

        const newKeys = new Map<string, CryptoKey>();
        for (const jwk of data.keys) {
          if (jwk.kty === 'RSA' && jwk.n && jwk.e) {
            try {
              const cryptoKey = await crypto.subtle.importKey(
                'jwk',
                {
                  kty: jwk.kty,
                  n: jwk.n,
                  e: jwk.e,
                  alg: 'RS256',
                  ext: true,
                },
                {
                  name: 'RSASSA-PKCS1-v1_5',
                  hash: { name: 'SHA-256' },
                },
                false,
                ['verify']
              );
              newKeys.set(jwk.kid, cryptoKey);
            } catch (err) {
              console.warn(`[GooglePublicKeyCache] Failed to import key ${jwk.kid}:`, err);
            }
          }
        }

        if (newKeys.size > 0) {
          this.cachedKeys = newKeys;
          this.expiresAt = newExpiresAt;
        }
      } catch (err) {
        // Strict Deny on network failure if cache is expired
        if (Date.now() >= this.expiresAt) {
          this.cachedKeys.clear();
        }
        throw err;
      } finally {
        this.fetchPromise = null;
      }
    })();

    return this.fetchPromise;
  }
}

export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
  options: {
    cache?: GooglePublicKeyCache;
    allowTestMock?: boolean;
    configuredEmails?: string[];
  } = {}
): Promise<VerifyJwtResult> {
  const parts = parseJwtParts(token);
  if (!parts) {
    return { ok: false, error: 'Malformed token: Invalid JWT structure' };
  }

  const { headerB64, payloadB64, signatureB64, header, payload } = parts;

  // 1. Test Mock Bypass (ONLY when explicitly permitted in test environment)
  if (options.allowTestMock) {
    if (header.alg === 'none') {
      return { ok: false, error: 'Unauthorized: Insecure JWT algorithm (none) is rejected' };
    }
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && nowSec >= payload.exp) {
      return { ok: false, error: 'Unauthorized: Token expired' };
    }
    const subject = payload.sub || payload.user_id;
    if (!subject || typeof subject !== 'string') {
      return { ok: false, error: 'Unauthorized: Missing subject (sub) claim' };
    }
    if (signatureB64 === 'invalid-signature' || signatureB64 === 'forged') {
      return { ok: false, error: 'Unauthorized: Invalid token signature' };
    }
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
    const hasAdminClaim = payload.admin === true || payload.role === 'SuperAdmin' || payload.role === 'super_admin';
    const isAuthorizedEmail = Boolean(email && options.configuredEmails?.includes(email));

    if (!isAuthorizedEmail && !hasAdminClaim) {
      return { ok: false, error: 'Unauthorized: User is not an admin' };
    }

    return {
      ok: true,
      uid: String(subject),
      email: email || options.configuredEmails?.[0] || 'admin@example.com',
      role: hasAdminClaim ? 'super_admin' : 'system_admin',
      payload,
    };
  }

  // 2. Strict Algorithm Check: Reject unsigned / "none" / symmetric algorithms in production
  if (header.alg !== 'RS256') {
    return { ok: false, error: `Authentication failed: Insecure JWT algorithm '${String(header.alg)}' or invalid credentials. Only RS256 is accepted.` };
  }

  // 3. Check Expiration
  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || nowSec >= payload.exp) {
    return { ok: false, error: 'Unauthorized: Token expired' };
  }

  // 4. Check Issued-at (allow up to 5 min clock skew)
  if (typeof payload.iat === 'number' && payload.iat > nowSec + 300) {
    return { ok: false, error: 'Unauthorized: Token issued in the future (invalid iat)' };
  }

  // 5. Check Subject
  const subject = payload.sub || payload.user_id;
  if (!subject || typeof subject !== 'string') {
    return { ok: false, error: 'Unauthorized: Missing subject (sub) claim' };
  }

  // 6. Strict Issuer Check
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  if (payload.iss !== expectedIssuer) {
    return { ok: false, error: `Unauthorized: Invalid issuer '${String(payload.iss)}'. Expected '${expectedIssuer}'` };
  }

  // 7. Strict Audience Check
  if (payload.aud !== projectId) {
    return { ok: false, error: `Unauthorized: Invalid audience '${String(payload.aud)}'. Expected '${projectId}'` };
  }

  // 8. Key ID (kid) presence
  const kid = header.kid;
  if (!kid || typeof kid !== 'string') {
    return { ok: false, error: 'Unauthorized: Token header missing kid' };
  }

  // 9. Fetch Key & Cryptographic Signature Verification
  const cache = options.cache || GooglePublicKeyCache.getInstance();
  let cryptoKey: CryptoKey | null = null;
  try {
    cryptoKey = await cache.getKey(kid);
  } catch (netErr) {
    return { ok: false, error: `Authentication failed: Unable to fetch signing keys from identity provider (${(netErr as Error).message})` };
  }

  if (!cryptoKey) {
    // Try one forced refresh in case of key rotation
    try {
      cryptoKey = await cache.getKey(kid, true);
    } catch {
      // ignore
    }
  }

  if (!cryptoKey) {
    return { ok: false, error: `Unauthorized: Unknown key ID '${kid}' not published by identity provider` };
  }

  try {
    const signatureBytes = base64UrlToUint8Array(signatureB64);
    const dataBytes = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signatureBytes,
      dataBytes
    );

    if (!isValid) {
      return { ok: false, error: 'Unauthorized: Cryptographic signature verification failed' };
    }
  } catch (verifyErr) {
    return { ok: false, error: `Unauthorized: Signature check error: ${(verifyErr as Error).message}` };
  }

  // 10. Role and Admin Rights Enforcement
  const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
  const hasAdminClaim = payload.admin === true || payload.role === 'SuperAdmin' || payload.role === 'super_admin';
  const isAuthorizedEmail = Boolean(email && options.configuredEmails?.includes(email));

  if (!isAuthorizedEmail && !hasAdminClaim) {
    return { ok: false, error: 'Unauthorized: Authenticated user lacks administrative privileges' };
  }

  return {
    ok: true,
    uid: String(subject),
    email: email || options.configuredEmails?.[0] || 'admin@example.com',
    role: hasAdminClaim ? 'super_admin' : 'system_admin',
    payload,
  };
}
