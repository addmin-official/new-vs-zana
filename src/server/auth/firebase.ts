import { verifyFirebaseIdToken, VerifiedTokenClaims } from './tokenVerification.ts';

export async function verifyAuthToken(
  token: string,
  env?: { FIREBASE_PROJECT_ID?: string; NODE_ENV?: string; ZANA_ENV?: string; ALLOW_TEST_AUTH_MOCK?: string; [key: string]: unknown }
): Promise<VerifiedTokenClaims | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const projectId = env?.FIREBASE_PROJECT_ID || (typeof process !== 'undefined' ? process.env?.FIREBASE_PROJECT_ID : undefined);
  const isProduction =
    env?.NODE_ENV === 'production' ||
    env?.ZANA_ENV === 'production' ||
    (typeof process !== 'undefined' &&
      (process.env?.NODE_ENV === 'production' || process.env?.ZANA_ENV === 'production'));
  const allowTestMock =
    !isProduction &&
    (env?.ZANA_ENV === 'test' ||
      env?.NODE_ENV === 'test' ||
      (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.ZANA_ENV === 'test'))) &&
    (env?.ALLOW_TEST_AUTH_MOCK === 'true' ||
      (typeof process !== 'undefined' && process.env?.ALLOW_TEST_AUTH_MOCK === 'true'));

  if (allowTestMock && !token.includes('.')) {
    const now = Math.floor(Date.now() / 1000);
    return {
      uid: token.slice(0, 32),
      aud: projectId || 'gen-lang-client-0009572581',
      iss: `https://securetoken.google.com/${projectId || 'gen-lang-client-0009572581'}`,
      iat: now,
      exp: now + 3600,
    };
  }

  try {
    const claims = await verifyFirebaseIdToken(token, projectId, { isProduction, allowTestMock });
    return claims;
  } catch (error) {
    console.error('[verifyAuthToken] Token verification failed:', error);
    return null;
  }
}
