/**
 * ZANA Platform - Phone Number & Digit Normalization Utilities
 * Handles Iraqi mobile numbers (+964) and Kurdish/Arabic numeral normalization.
 */

/**
 * Normalizes Eastern Arabic (٠-٩) and Persian/Kurdish (۰-۹) digits to standard ASCII (0-9).
 */
export function normalizeDigits(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}

/**
 * Formats an Iraqi phone number into standard international E.164 format (+9647XXXXXXXX).
 * Supported inputs:
 *  - "07501234567"      -> "+9647501234567"
 *  - "7501234567"       -> "+9647501234567"
 *  - "9647501234567"    -> "+9647501234567"
 *  - "+9647501234567"   -> "+9647501234567"
 *  - "009647501234567"  -> "+9647501234567"
 *  - Includes handling of spaces, hyphens, and Eastern Arabic/Kurdish digits.
 */
export function formatIraqiPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  let digits = normalizeDigits(raw).replace(/\D/g, "");

  // Strip international dial prefix '00964' -> '964'
  if (digits.startsWith("00964")) {
    digits = digits.slice(2);
  }

  // If already starting with 9647...
  if (digits.startsWith("9647")) {
    return `+${digits}`;
  }

  // Local Iraqi format 07... (11 digits: 07XXXXXXXXX)
  if (digits.startsWith("07") && digits.length === 11) {
    return `+964${digits.slice(1)}`;
  }

  // 10-digit format starting with 7... (7XXXXXXXXX)
  if (digits.startsWith("7") && digits.length === 10) {
    return `+964${digits}`;
  }

  // If already starts with 964...
  if (digits.startsWith("964")) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

/**
 * Validates whether a phone number is a valid Iraqi mobile number in E.164 format.
 * Iraqi mobile numbers start with +9647 followed by 9 digits (total 13 digits: 964 + 7XXXXXXXX).
 */
export function isIraqiPhoneValid(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const formatted = formatIraqiPhone(phone);
  return /^\+9647\d{9}$/.test(formatted);
}
