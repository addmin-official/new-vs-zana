/**
 * Session Recovery System for ZANA Platform
 * Persists and restores student study context across browser sessions and logins
 * Fully supports Grades 9, 10, 11, and 12 with authentic curriculum concepts
 */

export interface SessionRecoveryData {
  lastRoute: string;
  lastSubject?: string;
  lastGrade?: string;
  lastConcept?: string;
  lastConceptBySubject?: Record<string, string>;
  lastConceptBySubjectAndGrade?: Record<string, string>;
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
  sports: "پەروەردەی وەرزشی",
  islamicStudies: "پەروەردەی ئیسلامی",
  computerScience: "زانستی کۆمپیوتەر",
};

export const GRADE_NAMES_KU: Record<string, string> = {
  "9": "پۆلی ٩ی بنەڕەتی",
  "10": "پۆلی ١٠ی ئامادەیی",
  "11": "پۆلی ١١ی ئامادەیی",
  "12": "پۆلی ١٢ی ئامادەیی",
};

export function getGradeKurdishName(grade?: string | number): string {
  if (!grade) return "پۆلی ١٢ی ئامادەیی";
  const norm = String(grade).trim();
  return GRADE_NAMES_KU[norm] || `پۆلی ${norm}`;
}

/**
 * Authentic curriculum introductory concepts per grade and subject (KRG Ministry of Education)
 * Used as honest, grade- and subject-accurate defaults when a student hasn't studied a specific lesson yet.
 */
export const DEFAULT_CONCEPTS_BY_GRADE_AND_SUBJECT: Record<string, Record<string, string>> = {
  "9": {
    math: "هاوکێشە یەک پلەییەکان و نەخشە بنەڕەتییەکان",
    mathematics: "هاوکێشە یەک پلەییەکان و نەخشە بنەڕەتییەکان",
    chemistry: "بونیاتی ماددە و خشتەی خولی",
    science: "بونیاتی ماددە و خشتەی خولی",
    physics: "جووڵە، خێرایی و یاساکانی نیوتن",
    biology: "خانە، دابەشبوون و بۆماوەزانی",
    english: "Sunrise 9 — Welcoming the Future",
    arabic: "الجملة الاسمية والمبتدأ والخبر",
    kurdish: "کارامەیی و بەها کۆمەڵایەتییەکان",
  },
  "10": {
    physics: "جووڵە لەسەر ڕێڕەوی ڕاست و تاودان",
    biology: "ژینگە و کۆمەڵگە زیندەییەکان",
    math: "نەخشە دووجاکان و جەبر",
    mathematics: "نەخشە دووجاکان و جەبر",
    chemistry: "خشتەی خولیی توخمەکان",
    english: "Sunrise 10 — People, Identity & Daily Life",
    arabic: "قواعد النحو والأدب الإسلامي",
    kurdish: "ڕێزمانی کوردی (کار و جێناوەکان)",
  },
  "11": {
    math: "ژمارە ئاوێتەکان و نەخشە پلە دووەکان",
    mathematics: "ژمارە ئاوێتەکان و نەخشە پلە دووەکان",
    physics: "پێوانەکردن و بیردۆزی ئاڕاستەبڕەکان",
    chemistry: "کارلێکە کیمیاییەکان و حیساباتی کیمیایی",
    biology: "پێکهاتەی خانە و پەردەی خانەیی",
    english: "Sunrise 11 — The World Around Us",
    arabic: "أحكام العدد والمعدود والمشتقات",
    kurdish: "ڕێزمانی کوردی و ئەدەبی نوێ",
  },
  "12": {
    chemistry: "ئاوێتە ئایۆنییەکان و ڕەوشە کۆکارییەکان",
    physics: "تەزووی کارەبایی و یاسای ئۆم",
    mathematics: "سنوور و داتاشراو (Calculus)",
    math: "سنوور و داتاشراو (Calculus)",
    biology: "بۆماوەزانی مێندلی و یاساکانی بۆماوە",
    english: "Sunrise 12 — Grammar & Relative Clauses",
    kurdish: "ڕێزمانی کوردی و ئەدەب",
    arabic: "قواعد اللغة العربية والبلاغة",
    history: "ململانێی عوسمانی - ئێرانی",
    geography: "جوگرافیای سروشتی و مرۆیی",
    economy: "بنەماکانی ئابووری و بازاڕ",
    sports: "یاساکانی تۆپی پێی فیفا",
    islamicStudies: "پەروەردەی ئیسلامی و بیروباوەڕ",
    computerScience: "بنەماکانی پرۆگرامسازی و زانستی کۆمپیوتەر",
  },
};

/**
 * Authentic curriculum introductory concepts per subject (Fallback for Grade 12)
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
  sports: "یاساکانی تۆپی پێی فیفا",
  islamicStudies: "پەروەردەی ئیسلامی و بیروباوەڕ",
  computerScience: "بنەماکانی پرۆگرامسازی و زانستی کۆمپیوتەر",
};

export function getDefaultConceptForSubject(subjectKey?: string, grade: string | number = "12"): string {
  if (!subjectKey) return "وانەی سەرەتایی";
  const normSubj = subjectKey.toLowerCase().trim();
  const normGrade = String(grade || "12").trim();
  const gradeConcepts = DEFAULT_CONCEPTS_BY_GRADE_AND_SUBJECT[normGrade];
  if (gradeConcepts && gradeConcepts[normSubj]) {
    return gradeConcepts[normSubj];
  }
  return DEFAULT_SUBJECT_CONCEPTS_KU[normSubj] || "وانەی سەرەتایی";
}

export function saveSessionPosition(
  route: string,
  subject?: string,
  concept?: string,
  grade?: string | number
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
    const currentGrade = String(grade || existing?.lastGrade || "12").trim();
    const lastConceptBySubject: Record<string, string> = {
      ...(existing?.lastConceptBySubject || {}),
    };
    const lastConceptBySubjectAndGrade: Record<string, string> = {
      ...(existing?.lastConceptBySubjectAndGrade || {}),
    };

    const gradeSubjKey = `${currentSubject}_${currentGrade}`;
    let effectiveConcept: string;

    if (concept) {
      effectiveConcept = concept;
      lastConceptBySubject[currentSubject] = concept;
      lastConceptBySubjectAndGrade[gradeSubjKey] = concept;
    } else if (lastConceptBySubjectAndGrade[gradeSubjKey]) {
      effectiveConcept = lastConceptBySubjectAndGrade[gradeSubjKey];
    } else if (lastConceptBySubject[currentSubject]) {
      // Validate that the existing concept belongs to this subject and not leaked from chemistry
      if (currentSubject !== "chemistry" && (lastConceptBySubject[currentSubject].includes("ترش") || lastConceptBySubject[currentSubject].includes("pH"))) {
        effectiveConcept = getDefaultConceptForSubject(currentSubject, currentGrade);
      } else {
        effectiveConcept = lastConceptBySubject[currentSubject];
      }
      lastConceptBySubjectAndGrade[gradeSubjKey] = effectiveConcept;
    } else if (existing?.lastSubject === currentSubject && existing?.lastConcept) {
      if (currentSubject !== "chemistry" && (existing.lastConcept.includes("ترش") || existing.lastConcept.includes("pH"))) {
        effectiveConcept = getDefaultConceptForSubject(currentSubject, currentGrade);
      } else {
        effectiveConcept = existing.lastConcept;
      }
      lastConceptBySubject[currentSubject] = effectiveConcept;
      lastConceptBySubjectAndGrade[gradeSubjKey] = effectiveConcept;
    } else {
      effectiveConcept = getDefaultConceptForSubject(currentSubject, currentGrade);
      lastConceptBySubject[currentSubject] = effectiveConcept;
      lastConceptBySubjectAndGrade[gradeSubjKey] = effectiveConcept;
    }

    const payload: SessionRecoveryData = {
      lastRoute: cleanRoute,
      lastSubject: currentSubject,
      lastGrade: currentGrade,
      lastConcept: effectiveConcept,
      lastConceptBySubject,
      lastConceptBySubjectAndGrade,
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
      const grade = parsed.lastGrade ? String(parsed.lastGrade).trim() : "12";
      let concept = parsed.lastConcept;
      // Sanitize legacy leaked chemistry concepts for non-chemistry subjects
      if (subject && subject !== "chemistry" && concept && (concept.includes("ترش") || concept.includes("pH"))) {
        const gradeKey = `${subject}_${grade}`;
        concept =
          parsed.lastConceptBySubjectAndGrade?.[gradeKey] ||
          parsed.lastConceptBySubject?.[subject] ||
          getDefaultConceptForSubject(subject, grade);
      }
      return {
        ...parsed,
        lastSubject: subject,
        lastGrade: grade,
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
 * to their last studied subject, grade and route.
 */
export async function triggerSessionRecoveryNotification(
  userId: string,
  recovery?: SessionRecoveryData | null
): Promise<void> {
  const effectiveUserId = userId || "default-guest";
  const rec = recovery || getSessionRecovery();
  const subjectKey = rec?.lastSubject || "chemistry";
  const grade = rec?.lastGrade || "12";
  const subjectName = getSubjectKurdishName(subjectKey);
  const gradeName = getGradeKurdishName(grade);
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
        `بەخێربێیتەوە! دواجار لە ${subjectName} (${gradeName}) بوویت. دەتوانیت ڕاستەوخۆ لەو وانەیەی کە لێی وەستابوویت بەردەوام بیت.`
      );
    }
  } catch {
    // Non-blocking
  }
}
