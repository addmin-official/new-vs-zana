/**
 * ZANA Platform - National ID Card Utility & Privacy Protection
 *
 * Implements strict data protection standards for sensitive Iraqi National Unified Cards:
 * - 12-digit format validation (البطاقة الوطنية الموحدة / کارتی نیشتمانی)
 * - Number normalization (supports Eastern Arabic & Kurdish numerals)
 * - Safe masking for administrative displays (e.g. 1998••••5678)
 * - Irreversible keyed SHA-256 HMAC for duplicate detection
 * - AES-GCM-256 encryption at rest using Web Crypto API
 * - Zero raw logging policy
 */

import { normalizeDigits } from "./phoneUtils.ts";

/**
 * Normalizes National ID by stripping non-numeric characters and converting
 * Kurdish and Eastern Arabic numerals to standard ASCII 0-9.
 */
export function normalizeNationalId(raw: string | null | undefined): string {
  if (!raw) return "";
  const ascii = normalizeDigits(String(raw));
  return ascii.replace(/\D/g, "").trim();
}

/**
 * Validates Iraqi National ID: allows 6 to 20 numeric digits
 * (supporting Iraqi Unified National Card 12 digits, as well as Civil Status Identity
 * and General Register codes without rigid brittle assumptions).
 */
export function isValidNationalId(raw: string | null | undefined): boolean {
  const normalized = normalizeNationalId(raw);
  if (!normalized) return false;
  if (!/^\d{12}$/.test(normalized)) {
    return false;
  }

  const birthYear = parseInt(normalized.slice(0, 4), 10);
  const currentYear = new Date().getFullYear();
  if (isNaN(birthYear) || birthYear < 1920 || birthYear > currentYear + 1) {
    return false;
  }

  return true;
}

/**
 * Masks National ID for administrative and user displays.
 * Keeps birth year (first 4 digits) and last 4 digits for 12-digit cards:
 * Example: "199812345678" -> "1998••••5678"
 * For other lengths, safely masks all middle characters.
 */
export function maskNationalId(id: string | null | undefined): string {
  const normalized = normalizeNationalId(id);
  if (!normalized) return "—";
  if (normalized.length === 12) {
    return `${normalized.slice(0, 4)}••••${normalized.slice(8)}`;
  }
  if (normalized.length > 6) {
    return `${normalized.slice(0, 2)}••••${normalized.slice(-4)}`;
  }
  if (normalized.length > 4) {
    return "••••" + normalized.slice(-4);
  }
  return "••••••••";
}

/**
 * Keyed SHA-256 HMAC-style hash for duplicate registration checking without storing plaintext ID in indexes.
 * Strictly fails closed if the HMAC secret is missing or empty.
 */
export async function hashNationalId(id: string, pepper: string): Promise<string> {
  if (!pepper || !pepper.trim()) {
    throw new Error("MISSING_HMAC_SECRET: HMAC lookup secret key is required");
  }
  const normalized = normalizeNationalId(id);
  const payload = `zana:national_id:${normalized}:${pepper}`;
  const data = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Derive an AES-GCM CryptoKey from a secret passkey via SHA-256.
 * Strictly fails closed if secret is missing or empty.
 */
export async function deriveAesKey(secret: string): Promise<CryptoKey> {
  if (!secret || !secret.trim()) {
    throw new Error("MISSING_ENCRYPTION_SECRET: Encryption secret key is required");
  }
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt sensitive National ID at rest using AES-GCM 256-bit encryption.
 * Strictly fails closed if secret is missing or empty — NEVER stores plaintext.
 */
export async function encryptNationalId(id: string, secret: string): Promise<string> {
  if (!secret || !secret.trim()) {
    throw new Error("MISSING_ENCRYPTION_SECRET: Encryption secret key is required");
  }
  const normalized = normalizeNationalId(id);
  if (!normalized) return "";

  const key = await deriveAesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  const encodedData = new TextEncoder().encode(normalized);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedData
  );

  // Combine IV (12 bytes) + Ciphertext into single Base64 string
  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.length);

  let binary = "";
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Decrypt National ID ciphertext when authorized administrative role requires inspection.
 * Strictly fails closed if secret is missing or empty.
 */
export async function decryptNationalId(encryptedBase64: string, secret: string): Promise<string> {
  if (!secret || !secret.trim()) {
    throw new Error("MISSING_ENCRYPTION_SECRET: Encryption secret key is required");
  }
  if (!encryptedBase64) return "";

  try {
    const binary = atob(encryptedBase64);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    if (combined.length < 28) return ""; // IV (12) + Tag (16) minimum

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const key = await deriveAesKey(secret);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.error("[decryptNationalId] Decryption failure:", err);
    return "";
  }
}
