/**
 * Session Recovery System for ZANA Platform
 * Persists and restores student study context across browser sessions and logins
 */

export interface SessionRecoveryData {
  lastRoute: string;
  lastSubject?: string;
  lastConcept?: string;
  lastConceptBySubject?: Record<string, string>;
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

/**
 * Authentic curriculum introductory concepts per subject (KRG Ministry of Education)
 * Used as honest, subject-accurate defaults when a student hasn't studied a specific lesson yet.
 */
export const DEFAULT_SUBJECT_CONCEPTS_KU: Record<string, string> = {
  chemistry: "ئاوێتە ئایۆنییەکان و ڕەوشە کۆکارییەکان",
  physics: "تەزووی کارەبایی و یاسای ئۆم",
  mathematics: "سنوور و داتاشراو (Calculus)",
  math: "سنوور و داتاشراو (Calculus)",
  biology: "بۆماوەزانی مێندلی و یاساکانی بۆماوە",
  english: "Sunrise 12 — Grammar & Relative Clauses",
  kurdish: "ڕێزمانی کوردی و ئەدەب",
  arabic: "قواعد اللغة العربية والبلاغة",
  history: "مێژووی هاوچەرخی کوردستان و جیهان",
  geography: "جوگرافیای سروشتی و مرۆیی",
  economy: "بنەماکانی ئابووری و بازاڕ",
  islamicStudies: "پەروەردەی ئیسلامی و بیروباوەڕ",
  computerScience: "بنەماکانی پرۆگرامسازی و زانستی کۆمپیوتەر",
};

export function getDefaultConceptForSubject(subjectKey?: string): string {
  if (!subjectKey) return "وانەی سەرەتایی";
  const norm = subjectKey.toLowerCase().trim();
  return DEFAULT_SUBJECT_CONCEPTS_KU[norm] || "وانەی سەرەتایی";
}

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

    const currentSubject = (subject || existing?.lastSubject || "chemistry").toLowerCase().trim();
    const lastConceptBySubject: Record<string, string> = {
      ...(existing?.lastConceptBySubject || {}),
    };

    let effectiveConcept: string;
    if (concept) {
      effectiveConcept = concept;
      lastConceptBySubject[currentSubject] = concept;
    } else if (lastConceptBySubject[currentSubject]) {
      effectiveConcept = lastConceptBySubject[currentSubject];
    } else if (existing?.lastSubject === currentSubject && existing?.lastConcept) {
      // Validate that the existing concept belongs to this subject and not leaked from chemistry
      if (currentSubject !== "chemistry" && (existing.lastConcept.includes("ترش") || existing.lastConcept.includes("pH"))) {
        effectiveConcept = getDefaultConceptForSubject(currentSubject);
      } else {
        effectiveConcept = existing.lastConcept;
      }
      lastConceptBySubject[currentSubject] = effectiveConcept;
    } else {
      effectiveConcept = getDefaultConceptForSubject(currentSubject);
      lastConceptBySubject[currentSubject] = effectiveConcept;
    }

    const payload: SessionRecoveryData = {
      lastRoute: cleanRoute,
      lastSubject: currentSubject,
      lastConcept: effectiveConcept,
      lastConceptBySubject,
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
      const subject = parsed.lastSubject ? parsed.lastSubject.toLowerCase().trim() : undefined;
      let concept = parsed.lastConcept;
      // Sanitize legacy leaked chemistry concepts for non-chemistry subjects
      if (subject && subject !== "chemistry" && concept && (concept.includes("ترش") || concept.includes("pH"))) {
        concept = parsed.lastConceptBySubject?.[subject] || getDefaultConceptForSubject(subject);
      }
      return {
        ...parsed,
        lastSubject: subject,
        lastConcept: concept,
      };
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
  const effectiveUserId = userId || "default-guest";
  const rec = recovery || getSessionRecovery();
  const subjectKey = rec?.lastSubject || "chemistry";
  const subjectName = getSubjectKurdishName(subjectKey);
  const actionRoute = rec?.lastRoute || "/home";

  try {
    const { notificationEngine } = await import("../notifications/notificationEngine.ts");
    await notificationEngine.addNotification(effectiveUserId, {
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

