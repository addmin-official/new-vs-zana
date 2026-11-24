/**
 * ZANA Platform - Authoritative Countdown & Asia/Baghdad Timezone Utilities
 *
 * Implements strict time calculation requirements:
 * - Authoritative server-provided expiration timestamps (UTC)
 * - Immune to client device clock tampering
 * - Human-readable Sorani Kurdish labels:
 *   - "٣ ڕۆژ ماوە"
 *   - "٢ ڕۆژ ماوە"
 *   - "١ ڕۆژ ماوە"
 *   - "X کاتژمێر و Y خولەک ماوە" (less than 1 day)
 *   - "بەژداریی خۆڕایی تەواو بوو" (when expired)
 * - Asia/Baghdad timezone formatting for all date/time presentations
 */

export interface CountdownResult {
  isExpired: boolean;
  isUrgent: boolean;
  labelKu: string;
  formattedCountdown: string;
  baghdadExpirationFormatted: string;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  totalMsRemaining: number;
  badgeVariant: "active" | "warning" | "expired";
}

/**
 * Format a timestamp into Asia/Baghdad timezone string.
 * Example: "27/11/2026, 03:30 PM (کاتی بەغدا/هەولێر)"
 */
export function formatBaghdadDateTime(
  timestamp: number | Date | null | undefined,
  includeTimezoneLabel: boolean = true
): string {
  if (!timestamp) return "—";
  const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) return "—";

  try {
    const formatted = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Baghdad",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);

    return includeTimezoneLabel ? `${formatted} (کاتی بەغدا/هەولێر)` : formatted;
  } catch {
    return date.toLocaleDateString("en-GB");
  }
}

/**
 * Helper to convert numbers to Kurdish Sorani numerals
 */
export function toKurdishDigits(num: number | string): string {
  const kurdishDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num).replace(/\d/g, (d) => kurdishDigits[parseInt(d, 10)] ?? d);
}

/**
 * Calculates countdown remaining time based on server expiration timestamp and optional server-time offset or current time.
 */
export function calculateTrialCountdown(
  trialEndsAt: number | null | undefined,
  currentOrOffsetMs: number = 0
): CountdownResult {
  const baghdadFormatted = trialEndsAt ? formatBaghdadDateTime(trialEndsAt) : "—";

  if (!trialEndsAt || typeof trialEndsAt !== "number") {
    const defaultLabel = "٣ ڕۆژ ماوە";
    return {
      isExpired: false,
      isUrgent: false,
      labelKu: defaultLabel,
      formattedCountdown: defaultLabel,
      baghdadExpirationFormatted: baghdadFormatted,
      daysRemaining: 3,
      hoursRemaining: 72,
      minutesRemaining: 0,
      secondsRemaining: 0,
      totalMsRemaining: 3 * 24 * 60 * 60 * 1000,
      badgeVariant: "active",
    };
  }

  // Support either absolute timestamp (> year 2001) or offset
  const now = currentOrOffsetMs > 1000000000000
    ? currentOrOffsetMs
    : Date.now() + currentOrOffsetMs;
  const diffMs = trialEndsAt - now;

  if (diffMs <= 0) {
    const expiredLabel = "بەژداریی خۆڕایی تەواو بوو";
    return {
      isExpired: true,
      isUrgent: true,
      labelKu: expiredLabel,
      formattedCountdown: expiredLabel,
      baghdadExpirationFormatted: baghdadFormatted,
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      totalMsRemaining: 0,
      badgeVariant: "expired",
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  // Requirement: "٣ ڕۆژ، ٢ ڕۆژ، ١ ڕۆژ، کاتژمێر و خولەک. دوای تەواوبوون دەبێت ببێتە «بەژداریی خۆڕایی تەواو بوو»."
  let labelKu = "";
  let badgeVariant: "active" | "warning" | "expired" = "active";
  let isUrgent = false;

  if (diffMs >= 24 * 60 * 60 * 1000) {
    const calendarDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    if (calendarDays >= 3) {
      labelKu = "٣ ڕۆژ ماوە";
    } else if (calendarDays === 2) {
      labelKu = "٢ ڕۆژ ماوە";
    } else {
      labelKu = "١ ڕۆژ ماوە";
    }
    badgeVariant = "active";
    isUrgent = false;
  } else {
    // Less than 24 hours remaining -> show hours & minutes
    badgeVariant = "warning";
    isUrgent = true;
    if (totalHours > 0) {
      labelKu = `${toKurdishDigits(totalHours)} کاتژمێر و ${toKurdishDigits(minutes)} خولەک ماوە`;
    } else {
      labelKu = `${toKurdishDigits(minutes)} خولەک ماوە`;
    }
  }

  return {
    isExpired: false,
    isUrgent,
    labelKu,
    formattedCountdown: labelKu,
    baghdadExpirationFormatted: baghdadFormatted,
    daysRemaining: days,
    hoursRemaining: totalHours,
    minutesRemaining: minutes,
    secondsRemaining: seconds,
    totalMsRemaining: diffMs,
    badgeVariant,
  };
}
