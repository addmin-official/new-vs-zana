import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  FIREBASE_ERRORS_KU,
  getErrorMessage,
  getCurrentUser,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  loginAnonymously,
  resetPassword,
  logoutUser,
  ensureAuthenticated,
} from "../services/authService.ts";

describe("ZANA Auth Service & Kurdish Error Mapping", () => {
  test("FIREBASE_ERRORS_KU contains correct Kurdish translations", () => {
    assert.strictEqual(FIREBASE_ERRORS_KU["auth/invalid-email"], "ئیمەیلەکە دروست نییە");
    assert.strictEqual(FIREBASE_ERRORS_KU["auth/user-not-found"], "هەژمار نەدۆزرایەوە. تکایە سەرەتا خۆت تۆمار بکە");
    assert.strictEqual(FIREBASE_ERRORS_KU["auth/wrong-password"], "وشەی نهێنی هەڵەیە");
    assert.strictEqual(FIREBASE_ERRORS_KU["auth/email-already-in-use"], "ئەم ئیمەیلە پێشتر لە زانا تۆمارکراوە");
    assert.strictEqual(FIREBASE_ERRORS_KU["auth/weak-password"], "وشەی نهێنی لاوازە (پێویستە لانیکەم ٨ پیت و ژمارە بێت)");
  });

  test("getErrorMessage maps error codes to Kurdish strings", () => {
    const errorObj = { code: "auth/invalid-credential" };
    assert.strictEqual(getErrorMessage(errorObj), "ئیمەیل یان وشەی نهێنی هەڵەیە");

    const userNotFound = { code: "auth/user-not-found" };
    assert.strictEqual(getErrorMessage(userNotFound), "هەژمار نەدۆزرایەوە. تکایە سەرەتا خۆت تۆمار بکە");
  });

  test("getErrorMessage handles network failure gracefully", () => {
    const networkErr = new Error("Failed to fetch");
    const msg = getErrorMessage(networkErr);
    assert.match(msg, /تۆڕی ئینتەرنێت/i);
  });

  test("getErrorMessage handles unknown errors with fallback", () => {
    const unknownErr = { code: "custom/random-error" };
    const msg = getErrorMessage(unknownErr);
    assert.strictEqual(msg, "هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدە");
  });

  test("authService functions are exported and callable", () => {
    assert.strictEqual(typeof loginWithEmail, "function");
    assert.strictEqual(typeof registerWithEmail, "function");
    assert.strictEqual(typeof loginWithGoogle, "function");
    assert.strictEqual(typeof loginAnonymously, "function");
    assert.strictEqual(typeof resetPassword, "function");
    assert.strictEqual(typeof logoutUser, "function");
    assert.strictEqual(typeof ensureAuthenticated, "function");
    assert.strictEqual(typeof getCurrentUser, "function");
  });
});
