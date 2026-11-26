import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
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
  PhoneAuthProvider,
  linkWithCredential,
  signInWithCustomToken,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase.ts";
import { verifyFirebaseIdToken, VerifiedTokenClaims } from "../server/auth/tokenVerification.ts";
import { formatIraqiPhone, isIraqiPhoneValid, normalizeDigits } from "./phoneUtils.ts";

export { verifyFirebaseIdToken, type VerifiedTokenClaims, formatIraqiPhone, isIraqiPhoneValid, normalizeDigits };

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
  "auth/invalid-phone-number": "ژمارەی مۆبایل دروست نییە. فۆرماتی پێویست: +9647XXXXXXXX",
  "auth/code-expired": "کۆدی دڵنیایی کاتی تەواو بووە. تکایە لە سەرەتاوە هەوڵ بدەوە.",
  "auth/invalid-verification-code": "کۆدی دڵنیایی هەڵەیە. تکایە دووبارە بپشکنە.",
  "auth/missing-phone-number": "تکایە ژمارەی مۆبایلەکەت بنووسە.",
  "auth/missing-verification-code": "تکایە کۆدی دڵنیایی بنووسە.",
  "auth/missing-verification-id": "ناسنامەی دڵنیایی نەدۆزرایەوە. تکایە سەرلەنوێ کۆد داوا بکە.",
  "auth/quota-exceeded": "زۆر جار هەوڵی نێردنی کورتەنامە دراوە. دواتر تاقی بکەرەوە (پێویستی بە پلانی فایەربەیس هەیە).",
  "auth/captcha-check-failed": "پشکنینی دڵنیایی (reCAPTCHA) سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەوە.",
  "auth/invalid-app-credential": "ناسنامەی بەرنامە لە فایەربەیس نادروستە یان ڕێگەپێنەدراوە.",
  "auth/session-expired": "کاتی ئەم دانیشتنە بەسەرچووە. تکایە لە سەرەتاوە داوای کۆد بکەرەوە.",
  "auth/phone-number-already-exists": "ئەم ژمارە مۆبایلە پێشتر لەگەڵ هەژمارێکی تر تۆمار کراوە.",
  "auth/credential-already-in-use": "ئەم زانیارییە پێشتر لەگەڵ هەژمارێکی تر بەستراوەتەوە.",
  "auth/app-not-authorized": "ئەم دۆمەینە لە فایەربەیس مۆڵەتی ناردنی کورتەنامەی پێنەدراوە (Authorized Domains).",
  "auth/popup-closed-by-user": "پەنجەرەی چوونەژوورەوە لەلایەن تۆوە داخرایەوە.",
  "auth/popup-blocked": "پەنجەرەی پۆپ-ئەپ بەربەست کراوە. تکایە ڕێگە بە پەنجەرەکە بدە.",
  "auth/cancelled-popup-request": "داواکاری چوونەژوورەوە هەڵوەشێنرایەوە.",
  "auth/operation-not-allowed": "چوونەژوورەوە بەم شێوازە لە ئێستادا ناچالاکە (Sign-in Method لە فایەربەیس چالاک بکە).",
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

function setLocalAuthUser(_user: User | null): void {
  // Never persist auth identity in localStorage; clear any legacy cached user key.
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(LOCAL_AUTH_KEY);
  } catch {
    // ignore
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
 * Send Firebase email verification link to the current or specified user.
 */
export async function sendVerificationEmail(
  targetUser?: User | null
): Promise<{ ok: boolean; error?: string }> {
  const auth = getFirebaseAuth();
  const user = targetUser ?? auth?.currentUser ?? null;
  if (!user) {
    return { ok: false, error: "هیچ هەژمارێکی چالاک نەدۆزرایەوە." };
  }
  if (user.emailVerified) {
    return { ok: true };
  }
  try {
    await sendEmailVerification(user);
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

/**
 * Reload current Firebase user profile & force-refresh ID token to detect verified email.
 */
export async function reloadAndCheckEmailVerified(): Promise<{
  verified: boolean;
  user: User | null;
}> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser ?? null;
  if (!user) {
    return { verified: false, user: null };
  }
  if (typeof user.reload === "function") {
    await user.reload();
  }
  const refreshed = auth?.currentUser ?? user;
  if (typeof refreshed.getIdToken === "function") {
    await refreshed.getIdToken(true);
  }
  setLocalAuthUser(refreshed);
  notifyAuthListeners(refreshed);
  return {
    verified: Boolean(refreshed.emailVerified),
    user: refreshed,
  };
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

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("zana.profile.v1");
      localStorage.removeItem("zana_session_recovery_v1");
      localStorage.removeItem("zana_role_cache");
      localStorage.removeItem("zana_role_cache_time");
      localStorage.removeItem("zana_user_role");
      localStorage.removeItem("zana_app_store_v1");
      const keysToRemove = Object.keys(localStorage).filter(
        (k) =>
          k.startsWith("zana_mastery_") ||
          k.startsWith("zana_studypath_") ||
          k.startsWith("zana_notifications_") ||
          k.startsWith("zana_notification_prefs_") ||
          k.startsWith("zana_weak_concepts_") ||
          k.startsWith("zana_chat_messages_") ||
          k.startsWith("zana_session_resume_")
      );
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
}

/**
 * Get the current user synchronously from Firebase Auth only.
 */
export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  return auth?.currentUser ?? null;
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
 * Clear existing reCAPTCHA widget and container DOM
 */
export function clearRecaptcha(containerId?: string): void {
  try {
    const win = typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : null;
    const existing = win?.__zanaRecaptcha as { clear?: () => void } | undefined;
    if (existing && typeof existing.clear === "function") {
      try {
        existing.clear();
      } catch {
        /* ignore */
      }
    }
    if (win) {
      delete win.__zanaRecaptcha;
    }
    if (containerId && typeof document !== "undefined") {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = "";
      }
    }
  } catch (e) {
    console.warn("[Phone Auth] clearRecaptcha error:", e);
  }
}

/**
 * Setup invisible reCAPTCHA verifier.
 * containerId: ID of a div in the DOM (can be hidden)
 */
export function setupRecaptcha(containerId: string): RecaptchaVerifier | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  try {
    clearRecaptcha(containerId);

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        /* reCAPTCHA solved */
      },
      "expired-callback": () => {
        /* expired - clear to allow instant retry */
        clearRecaptcha(containerId);
      },
    });
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).__zanaRecaptcha = verifier;
    }
    return verifier;
  } catch (err) {
    console.warn("[Phone Auth] RecaptchaVerifier setup failed:", err);
    return null;
  }
}

let _cloudflareVerificationId: string | null = null;
let _pendingPhone: string | null = null;

/**
 * Send OTP via Cloudflare Worker D1 OTP engine.
 */
export async function sendCloudflarePhoneOtp(
  phoneNumber: string
): Promise<{ success: boolean; formattedPhone?: string; verificationId?: string; cooldownSeconds?: number; error?: string; status?: string }> {
  const formatted = formatIraqiPhone(phoneNumber);
  if (!isIraqiPhoneValid(formatted)) {
    return {
      success: false,
      error: FIREBASE_ERRORS_KU["auth/invalid-phone-number"] || "ژمارەی مۆبایل دروست نییە. فۆرماتی پێویست: 07501234567",
    };
  }

  try {
    const res = await fetch("/api/auth/phone/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: formatted }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      status?: string;
      error?: string;
      detail?: string;
      verificationId?: string;
      cooldownSeconds?: number;
    };

    if (res.ok && data.ok && data.verificationId) {
      _cloudflareVerificationId = data.verificationId;
      _pendingPhone = formatted;
      return {
        success: true,
        formattedPhone: formatted,
        verificationId: data.verificationId,
        cooldownSeconds: data.cooldownSeconds || 60,
      };
    }

    return {
      success: false,
      status: data.status,
      error: data.detail || data.error || "ناردنی کۆدی کورتەنامە سەرکەوتوو نەبوو.",
      cooldownSeconds: data.cooldownSeconds,
    };
  } catch {
    return {
      success: false,
      error: "کێشەی پەیوەندی لەگەڵ ڕاژەکار هەیە.",
    };
  }
}

/**
 * Verify OTP via Cloudflare Worker and sign in with Firebase Custom Token.
 */
export async function verifyCloudflarePhoneOtp(
  code: string,
  meta?: { name?: string; grade?: string | number; stream?: string }
): Promise<{ user: User | null; uid?: string; error?: string }> {
  if (!_cloudflareVerificationId) {
    return { user: null, error: "تکایە سەرەتا ژمارەی مۆبایلەکەت بنێرە بۆ وەرگرتنی کۆد." };
  }

  const cleanCode = normalizeDigits(code).trim();
  if (!cleanCode || cleanCode.length < 6) {
    return { user: null, error: "تکایە کۆدی دڵنیایی بە تەواوی بنووسە (٦ ژمارە)." };
  }

  try {
    const res = await fetch("/api/auth/phone/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verificationId: _cloudflareVerificationId,
        code: cleanCode,
        name: meta?.name,
        grade: meta?.grade,
        stream: meta?.stream,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      detail?: string;
      uid?: string;
      customToken?: string | null;
      phone?: string;
    };

    if (!res.ok || !data.ok) {
      return {
        user: null,
        error: data.detail || data.error || "کۆدی دڵنیایی هەڵەیە یان کاتی بەسەرچووە.",
      };
    }

    _cloudflareVerificationId = null;
    const auth = getFirebaseAuth();

    if (data.customToken && auth) {
      try {
        const cred = await signInWithCustomToken(auth, data.customToken);
        if (cred.user) {
          setLocalAuthUser(cred.user);
          notifyAuthListeners(cred.user);
          return { user: cred.user, uid: cred.user.uid };
        }
      } catch (customTokenErr) {
        console.warn("[verifyCloudflarePhoneOtp] signInWithCustomToken notice:", customTokenErr);
      }
    }

    if (data.uid) {
      const syntheticUser = {
        uid: data.uid,
        phoneNumber: data.phone || _pendingPhone,
        displayName: meta?.name || "قوتابی",
        email: null,
        emailVerified: false,
        isAnonymous: false,
        getIdToken: async () => `cf_token_${data.uid}`,
      } as unknown as User;

      setLocalAuthUser(syntheticUser);
      notifyAuthListeners(syntheticUser);
      return { user: syntheticUser, uid: data.uid };
    }

    return { user: null, error: "پشتڕاستکردنەوە سەرکەوتوو نەبوو." };
  } catch (err) {
    return {
      user: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Send OTP to phone number.
 * Formats raw input into international E.164 (+9647XXXXXXXX).
 * Uses Cloudflare D1 OTP engine with seamless Firebase fallback.
 */
export async function sendPhoneOtp(
  phoneNumber: string,
  appVerifier?: ApplicationVerifier
): Promise<{ success: boolean; formattedPhone?: string; error?: string; status?: string }> {
  const formatted = formatIraqiPhone(phoneNumber);
  if (!isIraqiPhoneValid(formatted)) {
    return {
      success: false,
      error: FIREBASE_ERRORS_KU["auth/invalid-phone-number"] || "ژمارەی مۆبایل دروست نییە. فۆرماتی پێویست: 07501234567",
    };
  }

  // 1. Primary: Cloudflare Worker OTP Engine (Zero Blaze, No Billing)
  const cfRes = await sendCloudflarePhoneOtp(formatted);
  if (cfRes.success) {
    return { success: true, formattedPhone: formatted };
  }

  // If SMS provider in Worker is currently disabled (pending telecom registration)
  if (cfRes.status === "disabled") {
    if (appVerifier) {
      const auth = getFirebaseAuth();
      if (auth) {
        try {
          _confirmationResult = await firebaseSignInWithPhoneNumber(auth, formatted, appVerifier);
          return { success: true, formattedPhone: formatted };
        } catch {
          _confirmationResult = null;
          clearRecaptcha();
        }
      }
    }
    return {
      success: false,
      status: "disabled",
      error: cfRes.error,
    };
  }

  // Secondary fallback: Firebase Phone Auth if appVerifier is available
  if (appVerifier) {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        _confirmationResult = await firebaseSignInWithPhoneNumber(auth, formatted, appVerifier);
        return { success: true, formattedPhone: formatted };
      } catch (err) {
        _confirmationResult = null;
        clearRecaptcha();
        return { success: false, error: getErrorMessage(err) };
      }
    }
  }

  return { success: false, error: cfRes.error };
}

/**
 * Verify OTP code entered by user.
 * Supports both Cloudflare Worker OTP and Firebase Phone Auth.
 * Returns the Firebase User on success.
 */
export async function verifyPhoneOtp(
  code: string,
  meta?: { name?: string; grade?: string | number; stream?: string }
): Promise<{ user: User | null; error?: string }> {
  const cleanCode = normalizeDigits(code).trim();
  if (!cleanCode || cleanCode.length < 6) {
    return { user: null, error: FIREBASE_ERRORS_KU["auth/missing-verification-code"] || "تکایە کۆدی دڵنیایی بنووسە." };
  }

  if (_cloudflareVerificationId) {
    return verifyCloudflarePhoneOtp(cleanCode, meta);
  }

  if (_confirmationResult) {
    try {
      const result = await _confirmationResult.confirm(cleanCode);
      _confirmationResult = null;
      if (result.user) {
        setLocalAuthUser(result.user);
        notifyAuthListeners(result.user);
      }
      return { user: result.user };
    } catch (err) {
      return { user: null, error: getErrorMessage(err) };
    }
  }

  return { user: null, error: "تکایە سەرەتا ژمارەی مۆبایلەکەت بنێرە بۆ وەرگرتنی کۆد." };
}

/**
 * Link phone credential to the currently authenticated student account.
 * Prevents account duplication when user has an existing email account.
 */
export async function linkPhoneToCurrentAccount(
  code: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) {
    return { success: false, error: "هیچ هەژمارێکی چالاک نەدۆزرایەوە بۆ بەستنەوە." };
  }
  if (!_confirmationResult) {
    return { success: false, error: "تکایە سەرەتا ژمارەی مۆبایلەکەت بنێرە." };
  }
  const cleanCode = normalizeDigits(code).trim();
  try {
    const cred = PhoneAuthProvider.credential(_confirmationResult.verificationId, cleanCode);
    const res = await linkWithCredential(auth.currentUser, cred);
    _confirmationResult = null;
    setLocalAuthUser(res.user);
    notifyAuthListeners(res.user);
    return { success: true, user: res.user };
  } catch (err) {
    return { success: false, error: getErrorMessage(err) };
  }
}

export const AuthService = {
  verifyFirebaseIdToken,
  getClientToken,
  ensureAuthenticated,
  loginWithEmail,
  registerWithEmail,
  sendVerificationEmail,
  reloadAndCheckEmailVerified,
  loginWithGoogle,
  loginAnonymously,
  resetPassword,
  logoutUser,
  getCurrentUser,
  getErrorMessage,
  FIREBASE_ERRORS_KU,
  startStudentTrial,
  setupRecaptcha,
  clearRecaptcha,
  sendPhoneOtp,
  verifyPhoneOtp,
  sendCloudflarePhoneOtp,
  verifyCloudflarePhoneOtp,
  linkPhoneToCurrentAccount,
  formatIraqiPhone,
  isIraqiPhoneValid,
  normalizeDigits,
};

