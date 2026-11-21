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
  RecaptchaVerifier,
  ApplicationVerifier,
  ConfirmationResult,
  signInWithPhoneNumber as firebaseSignInWithPhoneNumber,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase.ts";
import { verifyFirebaseIdToken, VerifiedTokenClaims } from "../server/auth/tokenVerification.ts";

export { verifyFirebaseIdToken, type VerifiedTokenClaims };

export const FIREBASE_ERRORS_KU: Record<string, string> = {
  "auth/user-not-found": "ئەم ئیمەیڵە تۆمار نەکراوە.",
  "auth/wrong-password": "وشەی نهێنی هەڵەیە.",
  "auth/network-request-failed": "کێشەی ئینتەرنێت هەیە.",
  "auth/invalid-credential": "ئیمەیل یان وشەی نهێنی هەڵەیە.",
  "auth/invalid-email": "ئیمەیڵەکە دروست نییە.",
  "auth/user-disabled": "ئەم هەژمارە ناچالاک کراوە.",
  "auth/email-already-in-use": "ئەم ئیمەیڵە پێشتر تۆمار کراوە.",
  "auth/weak-password": "وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت.",
  "auth/too-many-requests": "هەوڵی زۆر دراوە. تکایە کەمێکی تر تاقی بکەرەوە.",
  "auth/invalid-phone-number": "ژمارەی مۆبایل دروست نییە. فۆرماتی پێویستی: +9647XXXXXXXX",
  "auth/code-expired": "کۆدی دڵنیایی کاتی تەواو بووە. دووبارە هەوڵ بدە.",
  "auth/invalid-verification-code": "کۆدی دڵنیایی هەڵەیە. تکایە دووبارە بپشکنە.",
  "auth/missing-phone-number": "تکایە ژمارەی مۆبایلەکەت بنووسە.",
  "auth/quota-exceeded": "زۆر جار هەوڵی نێردنی کۆد دراوە. دواتر تاقی بکەرەوە.",
  "auth/popup-closed-by-user": "پەنجەرەی چوونەژوورەوە لەلایەن تۆوە داخرایەوە.",
  "auth/popup-blocked": "پەنجەرەی پۆپ-ئەپ بەربەست کراوە. تکایە ڕێگە بە پەنجەرەکە بدە.",
  "auth/cancelled-popup-request": "داواکاری چوونەژوورەوە هەڵوەشێنرایەوە.",
  "auth/operation-not-allowed": "چوونەژوورەوە بەم شێوازە لە ئێستادا ناچالاکە.",
  "auth/admin-restricted-operation": "ئەم کردەیە پێویستی بە مۆڵەتی باڵاترە.",
  "auth/invalid-api-key": "کلیل (API Key)ی فایەربەیس دیاری نەکراوە یان نادروستە.",
  "auth/api-key-not-valid": "کلیل (API Key)ی فایەربەیس دیاری نەکراوە یان نادروستە.",
  "auth/unauthorized-domain": "ئەم دۆمەینە لە کۆنسۆڵی فایەربەیس مۆڵەتی پێنەدراوە (Unauthorized Domain).",
  "auth/internal-error": "هەڵەی ناوخۆیی لە خزمەتگوزاری فایەربەیس ڕوویدا.",
  "auth/requires-recent-login": "تکایە سەرلەنوێ بچۆ ژوورەوە بۆ جێبەجێکردنی ئەم داواکارییە.",
};

export function getErrorMessage(err: unknown): string {
  if (!err) return "هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدە";

  let code = "";
  if (typeof err === "object" && err !== null) {
    if ("code" in err && typeof (err as { code: unknown }).code === "string") {
      code = (err as { code: string }).code.trim();
    }
  }

  const rawMessage = (err as Error)?.message || String(err);

  // If the error message already has Kurdish/Arabic characters, preserve it directly
  if (/[\u0600-\u06FF]/.test(rawMessage)) {
    return rawMessage;
  }

  if (!code) {
    const match = rawMessage.match(/auth\/[a-z0-9-]+/i);
    if (match) {
      code = match[0].toLowerCase();
    }
  }

  // Exact mappings and fuzzy checks
  if (code === "auth/user-not-found" || rawMessage.includes("user-not-found")) {
    return "ئەم ئیمەیڵە تۆمار نەکراوە.";
  }
  if (code === "auth/wrong-password" || rawMessage.includes("wrong-password")) {
    return "وشەی نهێنی هەڵەیە.";
  }
  if (code === "auth/email-already-in-use" || rawMessage.includes("email-already-in-use")) {
    return "ئەم ئیمەیڵە پێشتر تۆمار کراوە.";
  }
  if (code === "auth/weak-password" || rawMessage.includes("weak-password")) {
    return "وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت.";
  }
  if (code === "auth/invalid-email" || rawMessage.includes("invalid-email")) {
    return "ئیمەیڵەکە دروست نییە.";
  }
  if (
    code === "auth/invalid-credential" ||
    rawMessage.includes("invalid-credential") ||
    rawMessage.includes("INVALID_LOGIN_CREDENTIALS")
  ) {
    return "ئیمەیل یان وشەی نهێنی هەڵەیە.";
  }
  if (
    code === "auth/network-request-failed" ||
    rawMessage.includes("network-request-failed") ||
    rawMessage.includes("Failed to fetch") ||
    rawMessage.includes("network error")
  ) {
    return "کێشەی ئینتەرنێت هەیە.";
  }
  if (code === "auth/unauthorized-domain" || rawMessage.includes("unauthorized-domain")) {
    return "ئەم دۆمەینە لە کۆنسۆڵی فایەربەیس مۆڵەتی پێنەدراوە (Unauthorized Domain).";
  }
  if (
    code === "auth/invalid-api-key" ||
    code === "auth/api-key-not-valid" ||
    rawMessage.toLowerCase().includes("api key") ||
    rawMessage.toLowerCase().includes("api-key")
  ) {
    return "کلیل (API Key)ی فایەربەیس دیاری نەکراوە یان نادروستە.";
  }
  if (code === "auth/popup-closed-by-user" || rawMessage.includes("popup-closed-by-user")) {
    return "پەنجەرەی چوونەژوورەوە لەلایەن تۆوە داخرایەوە.";
  }
  if (code === "auth/popup-blocked" || rawMessage.includes("popup-blocked")) {
    return "پەنجەرەی پۆپ-ئەپ بەربەست کراوە. تکایە ڕێگە بە پەنجەرەکە بدە.";
  }

  if (code && FIREBASE_ERRORS_KU[code]) {
    return FIREBASE_ERRORS_KU[code];
  }

  console.error("Unhandled auth error:", err);
  return "هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدە";
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
      getIdToken: async () => "",
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
    throw new Error("سێرڤەری Firebase پەیوەست نییە. تکایە دووبارە هەوڵ بدەرەوە.");
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
    throw new Error("سێرڤەری Firebase پەیوەست نییە. تکایە دووبارە هەوڵ بدەرەوە.");
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
 * Sign in with Google using standard Firebase Google popup
 */
export async function loginWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("سێرڤەری Firebase پەیوەست نییە. تکایە پەیوەندی ئینتەرنێتەکەت بپشکنە.");
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
    throw new Error("چوونەژوورەوەی میوان ناچالاک کراوە.");
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

/**
 * Start or refresh the student's 3-day trial in D1 database
 */
export async function startStudentTrial(
  userId: string,
  studentData?: { name?: string; email?: string; grade?: string; stream?: string }
): Promise<{ ok: boolean; trial_ends_at?: number }> {
  try {
    const user = getCurrentUser();
    let token = "";
    if (user && typeof user.getIdToken === "function") {
      try {
        token = await user.getIdToken();
      } catch {}
    }
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch("/api/trial/start", {
      method: "POST",
      headers,
      body: JSON.stringify({
        userId,
        name: studentData?.name,
        email: studentData?.email || user?.email,
        grade: studentData?.grade,
        stream: studentData?.stream,
      }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: true, trial_ends_at: (data as { trial_ends_at?: number })?.trial_ends_at };
    }
  } catch (err) {
    console.warn("startStudentTrial API failed gracefully:", err);
  }
  return { ok: true };
}

// ── Phone Authentication ──────────────────────────────────────

// Store verificationId globally (cleared after use)
let _confirmationResult: ConfirmationResult | null = null;

/**
 * Setup invisible reCAPTCHA verifier.
 * containerId: ID of a div in the DOM (can be hidden)
 */
export function setupRecaptcha(containerId: string): RecaptchaVerifier | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  try {
    // Clear any existing reCAPTCHA
    if ((window as unknown as Record<string, unknown>).recaptchaWidgetId !== undefined) {
      try {
        const existing = (window as unknown as Record<string, RecaptchaVerifier>).__zanaRecaptcha;
        if (existing) existing.clear();
      } catch {
        /* ignore */
      }
    }
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        /* reCAPTCHA solved */
      },
      "expired-callback": () => {
        /* expired */
      },
    });
    (window as unknown as Record<string, unknown>).__zanaRecaptcha = verifier;
    return verifier;
  } catch (err) {
    console.warn("[Phone Auth] RecaptchaVerifier setup failed:", err);
    return null;
  }
}

/**
 * Send OTP to phone number.
 * phoneNumber must be in E.164 format: +9647XXXXXXXX
 */
export async function sendPhoneOtp(
  phoneNumber: string,
  appVerifier: ApplicationVerifier
): Promise<{ success: boolean; error?: string }> {
  const auth = getFirebaseAuth();
  if (!auth) return { success: false, error: "Firebase Auth ئامادە نییە" };

  try {
    _confirmationResult = await firebaseSignInWithPhoneNumber(
      auth,
      phoneNumber,
      appVerifier
    );
    return { success: true };
  } catch (err) {
    _confirmationResult = null;
    const msg = getErrorMessage(err);
    return { success: false, error: msg };
  }
}

/**
 * Verify OTP code entered by user.
 * Returns the Firebase User on success.
 */
export async function verifyPhoneOtp(
  code: string
): Promise<{ user: User | null; error?: string }> {
  if (!_confirmationResult) {
    return { user: null, error: "تکایە سەرەتا ژمارەی مۆبایلەکەت بنێرە" };
  }
  try {
    const result = await _confirmationResult.confirm(code);
    _confirmationResult = null;
    return { user: result.user };
  } catch (err) {
    return { user: null, error: getErrorMessage(err) };
  }
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
  startStudentTrial,
  setupRecaptcha,
  sendPhoneOtp,
  verifyPhoneOtp,
};

