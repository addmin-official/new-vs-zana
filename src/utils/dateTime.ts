/**
 * Authoritative DateTime & Timezone Utilities for ZANA
 *
 * Ensures all user-facing dates and times are displayed in the Asia/Baghdad timezone
 * and that server/storage timestamps are strictly maintained in UTC ISO-8601.
 */

export const BAGHDAD_TIMEZONE = "Asia/Baghdad";

export type DateInput = Date | string | number | { toDate: () => Date } | null | undefined;

/**
 * Normalizes any date input (Date, ISO string, epoch millis, or Firestore Timestamp) to a JS Date.
 */
export function normalizeToDate(input: DateInput): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === "object" && "toDate" in input && typeof (input as { toDate: () => Date }).toDate === "function") {
    return (input as { toDate: () => Date }).toDate();
  }
  if (typeof input === "string" || typeof input === "number") {
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/**
 * Formats time in Asia/Baghdad timezone with Eastern Arabic numerals (ar-u-nu-arab) or Kurdish locale.
 */
export function formatBaghdadTime(
  input: DateInput,
  options?: Intl.DateTimeFormatOptions,
  locale = "ar-u-nu-arab"
): string {
  const date = normalizeToDate(input);
  if (!date) return "—";
  return date.toLocaleTimeString(locale, {
    timeZone: BAGHDAD_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

/**
 * Formats date in Asia/Baghdad timezone.
 */
export function formatBaghdadDate(
  input: DateInput,
  options?: Intl.DateTimeFormatOptions,
  locale = "ar-u-nu-arab"
): string {
  const date = normalizeToDate(input);
  if (!date) return "—";
  return date.toLocaleDateString(locale, {
    timeZone: BAGHDAD_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    ...options,
  });
}

/**
 * Formats date and time in Asia/Baghdad timezone.
 */
export function formatBaghdadDateTime(
  input: DateInput,
  options?: Intl.DateTimeFormatOptions,
  locale = "ar-u-nu-arab"
): string {
  const date = normalizeToDate(input);
  if (!date) return "—";
  return date.toLocaleString(locale, {
    timeZone: BAGHDAD_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

/**
 * Converts any timestamp or date to authoritative UTC ISO string.
 */
export function toAuthoritativeUTC(input?: DateInput): string {
  const date = normalizeToDate(input) || new Date();
  return date.toISOString();
}
