/**
 * Session Recovery System for ZANA Platform
 * Persists and restores student study context across browser sessions and logins
 */

export interface SessionRecoveryData {
  lastRoute: string;
  lastSubject?: string;
  lastConcept?: string;
  timestamp: number;
}

const SESSION_RECOVERY_KEY = "zana_session_recovery_v1";

export const SUBJECT_NAMES_KU: Record<string, string> = {
  chemistry: "کیمیا",
  physics: "فیزیا",
  mathematics: "بیرکاری",
  math: "بیرکاری",
  biology: "زیندەوەرزانی",
  arabic: "زمانی عەرەبی",
  english: "ئینگلیزی",
  kurdish: "زمانی کوردی",
  history: "مێژوو",
  geography: "جوگرافیا",
  economy: "ئابووری",
  islamicStudies: "پەروەردەی ئیسلامی",
  computerScience: "زانستی کۆمپیوتەر",
};

export function saveSessionPosition(
  route: string,
  subject?: string,
  concept?: string
): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const existing = getSessionRecovery();
    const cleanRoute = route.startsWith("/") ? route : `/${route}`;
    // Don't record login/register/auth paths as last study positions
    if (
      cleanRoute === "/login" ||
      cleanRoute === "/register" ||
      cleanRoute === "/forgot-password" ||
      cleanRoute === "/welcome"
    ) {
      return;
    }

    const payload: SessionRecoveryData = {
      lastRoute: cleanRoute,
      lastSubject: subject || existing?.lastSubject || "chemistry",
      lastConcept: concept || existing?.lastConcept,
      timestamp: Date.now(),
    };

    window.localStorage.setItem(SESSION_RECOVERY_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Could not save session recovery position:", err);
  }
}

export function getSessionRecovery(): SessionRecoveryData | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_RECOVERY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionRecoveryData;
    if (parsed && typeof parsed.lastRoute === "string") {
      return parsed;
    }
  } catch {
    // ignore parse error
  }
  return null;
}

export function clearSessionRecovery(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(SESSION_RECOVERY_KEY);
  } catch {
    // ignore
  }
}

export function getSubjectKurdishName(subjectKey?: string): string {
  if (!subjectKey) return "وانەکان";
  const norm = subjectKey.toLowerCase().trim();
  return SUBJECT_NAMES_KU[norm] || subjectKey;
}

/**
 * Dispatches an in-app notification & toast welcoming the returning student back
 * to their last studied subject and route.
 */
export async function triggerSessionRecoveryNotification(
  userId: string,
  recovery?: SessionRecoveryData | null
): Promise<void> {
  if (!userId) return;
  const rec = recovery || getSessionRecovery();
  const subjectKey = rec?.lastSubject || "chemistry";
  const subjectName = getSubjectKurdishName(subjectKey);
  const actionRoute = rec?.lastRoute || "/home";

  try {
    const { notificationEngine } = await import("../notifications/notificationEngine.ts");
    await notificationEngine.addNotification(userId, {
      type: "study_reminder",
      title: `بەخێربێیتەوە! دواجار لە ${subjectName} بوویت`,
      message: "دەتوانیت ڕاستەوخۆ لەو وانەیەی کە لێی وەستابوویت بەردەوام بیت.",
      icon: "✨",
      actionUrl: actionRoute,
      actionLabel: "بەردەوام بە",
      force: true,
    });
  } catch (err) {
    console.warn("Could not dispatch session recovery notification:", err);
  }

  try {
    const { useAppStore } = await import("../store/appStore.ts");
    const currentToasts = useAppStore.getState().notifications;
    const hasWelcomeToast = currentToasts.some((n) => n.message.includes("بەخێربێیتەوە"));
    if (!hasWelcomeToast) {
      useAppStore.getState().addNotification(
        "info",
        `بەخێربێیتەوە! دواجار لە ${subjectName} بوویت. دەتوانیت ڕاستەوخۆ لەو وانەیەی کە لێی وەستابوویت بەردەوام بیت.`
      );
    }
  } catch {
    // Non-blocking
  }
}

