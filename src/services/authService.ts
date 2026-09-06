import firebaseConfig from "./firebaseConfig.ts";
import { getFirebaseAuth } from "./firebase.ts";
import {
  verifyFirebaseIdToken as verifyToken,
  type VerifiedTokenClaims,
} from "../server/auth/tokenVerification.ts";

export type { VerifiedTokenClaims };

export class AuthService {
  /**
   * Retrieves a real Firebase ID Token from the current non-anonymous user.
   * Never stores tokens in localStorage or persistent custom caches.
   */
  public static async getClientToken(_studentId?: string, forceRefresh: boolean = false): Promise<string | null> {
    const auth = getFirebaseAuth();
    if (!auth || !auth.currentUser || auth.currentUser.isAnonymous) {
      return null;
    }
    try {
      return await auth.currentUser.getIdToken(forceRefresh);
    } catch (e) {
      console.warn("Failed to retrieve Firebase ID token:", e);
      return null;
    }
  }

  /**
   * Cryptographically validates a Firebase ID token using Google's public JWKs and Web Crypto API.
   */
  public static async verifyFirebaseIdToken(
    idToken: string | null,
    overrideProjectId?: string
  ): Promise<VerifiedTokenClaims> {
    return verifyToken(idToken, overrideProjectId || firebaseConfig.projectId);
  }
}

