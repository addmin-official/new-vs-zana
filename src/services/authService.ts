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

const LOCAL_AUTH_KEY = "zana_auth_user_v1";

const authListeners = new Set<(user: User | null) => void>();

function notifyAuthListeners(user: User | null) {
  authListeners.forEach((fn) => {
    try {
      fn(user);
    } catch (e) {
      console.warn("Auth listener error:", e);
    }
  });
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  authListeners.add(callback);
  return () => authListeners.delete(callback);
}

function getLocalAuthUser(): User | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      uid: parsed.uid || "local-user",
      email: parsed.email || null,
      displayName: parsed.displayName || "قوتابی",
      isAnonymous: Boolean(parsed.isAnonymous),
      getIdToken: async () => "mock-token",
    } as unknown as User;
  } catch {
    return null;
  }
}

function setLocalAuthUser(user: User | null): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    if (user) {
      window.localStorage.setItem(
        LOCAL_AUTH_KEY,
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          isAnonymous: user.isAnonymous,
        })
      );
    } else {
      window.localStorage.removeItem(LOCAL_AUTH_KEY);
    }
  } catch (e) {
    console.warn("Failed to set local auth user:", e);
  }
}

/**
 * Ensures a user is authenticated (guest/anonymous if not logged in).
 * Used for automatic guest onboarding when anonymous auth is favored.
 */
export async function ensureAuthenticated(): Promise<User> {
  const current = getCurrentUser();
  if (current) return current;

  const auth = getFirebaseAuth();
  if (!auth) {
    return loginAnonymously();
  }

  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (user) {
        setLocalAuthUser(user);
        notifyAuthListeners(user);
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          setLocalAuthUser(cred.user);
          notifyAuthListeners(cred.user);
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
    const mockUser = {
      uid: "usr_" + Math.random().toString(36).substring(2, 9),
      email: email.trim(),
      displayName: email.split("@")[0],
      isAnonymous: false,
      getIdToken: async () => "mock-token",
    } as unknown as User;
    setLocalAuthUser(mockUser);
    notifyAuthListeners(mockUser);
    return mockUser;
  }
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  setLocalAuthUser(cred.user);
  notifyAuthListeners(cred.user);
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
    const mockUser = {
      uid: "usr_" + Math.random().toString(36).substring(2, 9),
      email: email.trim(),
      displayName: displayName?.trim() || email.split("@")[0],
      isAnonymous: false,
      getIdToken: async () => "mock-token",
    } as unknown as User;
    setLocalAuthUser(mockUser);
    notifyAuthListeners(mockUser);
    return mockUser;
  }
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName && cred.user) {
    try {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    } catch (e) {
      console.warn("Failed to set user displayName:", e);
    }
  }
  setLocalAuthUser(cred.user);
  notifyAuthListeners(cred.user);
  return cred.user;
}

/**
 * Sign in with Google using popup
 */
export async function loginWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    const mockUser = {
      uid: "google_" + Math.random().toString(36).substring(2, 9),
      email: "student@gmail.com",
      displayName: "قوتابی گووگڵ",
      isAnonymous: false,
      getIdToken: async () => "mock-google-token",
    } as unknown as User;
    setLocalAuthUser(mockUser);
    notifyAuthListeners(mockUser);
    return mockUser;
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  setLocalAuthUser(cred.user);
  notifyAuthListeners(cred.user);
  return cred.user;
}

/**
 * Sign in anonymously as a student guest
 */
export async function loginAnonymously(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    const mockUser = {
      uid: "guest_" + Math.random().toString(36).substring(2, 9),
      email: null,
      displayName: "قوتابی میوان",
      isAnonymous: true,
      getIdToken: async () => "mock-guest-token",
    } as unknown as User;
    setLocalAuthUser(mockUser);
    notifyAuthListeners(mockUser);
    return mockUser;
  }
  const cred = await signInAnonymously(auth);
  setLocalAuthUser(cred.user);
  notifyAuthListeners(cred.user);
  return cred.user;
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) {
    // In local fallback, simulate reset success
    return;
  }
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out error:", e);
    }
  }
  setLocalAuthUser(null);
  notifyAuthListeners(null);
}

/**
 * Get the current user synchronously
 */
export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  if (auth?.currentUser) return auth.currentUser;
  return getLocalAuthUser();
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
