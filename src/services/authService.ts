import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase.ts";
import { verifyFirebaseIdToken, VerifiedTokenClaims } from "../server/auth/tokenVerification.ts";

export { verifyFirebaseIdToken, type VerifiedTokenClaims };

export const FIREBASE_ERRORS_KU: Record<string, string> = {
  "auth/invalid-email": "ئیمەیلەکە دروست نییە",
  "auth/user-disabled": "ئەم هەژمارە ناچالاک کراوە",
  "auth/user-not-found": "هەژمار نەدۆزرایەوە. تکایە سەرەتا خۆت تۆمار بکە",
  "auth/wrong-password": "وشەی نهێنی هەڵەیە",
  "auth/invalid-credential": "ئیمەیل یان وشەی نهێنی هەڵەیە",
  "auth/email-already-in-use": "ئەم ئیمەیلە پێشتر لە زانا تۆمارکراوە",
  "auth/weak-password": "وشەی نهێنی لاوازە (پێویستە لانیکەم ٨ پیت و ژمارە بێت)",
  "auth/network-request-failed": "کێشەی تۆڕی ئینتەرنێت هەیە. تکایە دووبارە هەوڵ بدە",
  "auth/too-many-requests": "هەوڵی زۆر دراوە. تکایە کەمێکی تر تاقی بکەرەوە",
  "auth/popup-closed-by-user": "پەنجەرەی چوونەژوورەوە لەلایەن تۆوە داخرایەوە",
  "auth/popup-blocked": "پەنجەرەی پۆپ-ئەپ بەربەست کراوە. تکایە ڕێگە بە پەنجەرەکە بدە",
  "auth/cancelled-popup-request": "داواکاری چوونەژوورەوە هەڵوەشێنرایەوە",
  "auth/operation-not-allowed": "چوونەژوورەوە بەم شێوازە لە ئێستادا ناچالاکە",
  "auth/admin-restricted-operation": "ئەم کردەیە پێویستی بە مۆڵەتی باڵاترە",
};

export function getErrorMessage(err: unknown): string {
  if (!err) return "هەڵەیەکی نەناسراو ڕوویدا. تکایە دووبارە هەوڵ بدە";
  const code = (err && typeof err === "object" && "code" in err) ? String((err as { code: unknown }).code) : "";
  if (code && FIREBASE_ERRORS_KU[code]) {
    return FIREBASE_ERRORS_KU[code];
  }
  const msg = (err as Error)?.message || String(err);
  if (msg.includes("network") || msg.includes("Failed to fetch")) {
    return "کێشەی تۆڕی ئینتەرنێت هەیە. پەیوەندییەکەت بپشکنە";
  }
  return FIREBASE_ERRORS_KU[code] || "هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدە";
}

/**
 * Ensures a user is authenticated (guest/anonymous if not logged in).
 * Used for automatic guest onboarding when anonymous auth is favored.
 */
export async function ensureAuthenticated(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth دانەمەزراوە یان کارا نییە");
  }

  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (user) {
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}

/**
 * Login with email and password
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth دانەمەزراوە یان بەردەست نییە");
  }
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

/**
 * Register a new student or admin with email and password
 */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth دانەمەزراوە یان بەردەست نییە");
  }
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName && cred.user) {
    try {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    } catch (e) {
      console.warn("Failed to set user displayName:", e);
    }
  }
  return cred.user;
}

/**
 * Sign in with Google using popup
 */
export async function loginWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth دانەمەزراوە یان بەردەست نییە");
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

/**
 * Sign in anonymously as a student guest
 */
export async function loginAnonymously(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth دانەمەزراوە یان بەردەست نییە");
  }
  const cred = await signInAnonymously(auth);
  return cred.user;
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth دانەمەزراوە یان بەردەست نییە");
  }
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Get the current user synchronously
 */
export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  return auth?.currentUser || null;
}

/**
 * Get the ID token for the current user
 */
export async function getClientToken(_studentId?: string, forceRefresh?: boolean): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (auth?.currentUser) {
    try {
      return await auth.currentUser.getIdToken(Boolean(forceRefresh));
    } catch {
      return null;
    }
  }
  return null;
}

export const AuthService = {
  verifyFirebaseIdToken,
  getClientToken,
  ensureAuthenticated,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  loginAnonymously,
  resetPassword,
  logoutUser,
  getCurrentUser,
  getErrorMessage,
  FIREBASE_ERRORS_KU,
};
