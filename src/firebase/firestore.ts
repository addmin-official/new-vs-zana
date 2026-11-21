/**
 * ZANA Platform - Firestore Data Layer
 * Firebase v9 modular SDK data access layer with optimized schemas and offline persistence.
 */

import {
  Firestore,
  doc,
  collection,
  DocumentReference,
  CollectionReference,
  getDoc,
  setDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  DocumentSnapshot,
  QuerySnapshot,
} from "firebase/firestore";
import { getFirestoreDb } from "../services/firebase.ts";
import {
  UserDocument,
  SubjectMasteryDoc,
  StudySessionDoc,
  StudyPlanDoc,
  CurriculumConceptDoc,
  AssessmentDoc,
  MasteryRecord,
} from "./types.ts";

let persistenceInitialized = false;

/**
 * Offline persistence is configured at Firestore initialization time via
 * FirestoreSettings.localCache (persistentLocalCache + persistentMultipleTabManager)
 * in src/services/firebase.ts. Kept for backwards compatibility.
 */
export async function initializeFirestorePersistence(_db: Firestore): Promise<void> {
  if (persistenceInitialized) return;
  persistenceInitialized = true;
}

/**
 * Get active Firestore instance with persistence configured.
 */
export function getActiveDb(): Firestore | null {
  const db = getFirestoreDb();
  if (db && !persistenceInitialized) {
    persistenceInitialized = true;
  }
  return db;
}

// ============================================================================
// Typed Document & Collection References
// ============================================================================

export const FirestorePaths = {
  user: (userId: string) => `users/${userId}`,
  mastery: (userId: string, subjectId: string) => `users/${userId}/mastery/${subjectId}`,
  sessions: (userId: string) => `users/${userId}/sessions`,
  session: (userId: string, sessionId: string) => `users/${userId}/sessions/${sessionId}`,
  studyPlan: (userId: string, weekId: string) => `users/${userId}/studyPlan/${weekId}`,
  curriculumConcept: (grade: string, subject: string, conceptId: string) =>
    `curriculum/${grade}/${subject}/concepts/${conceptId}`,
  assessments: () => "assessments",
  assessment: (assessmentId: string) => `assessments/${assessmentId}`,
  notifications: (userId: string) => `users/${userId}/notifications`,
  notification: (userId: string, notificationId: string) => `users/${userId}/notifications/${notificationId}`,
};

export function getUserDocRef(db: Firestore, userId: string): DocumentReference<UserDocument> {
  return doc(db, "users", userId) as DocumentReference<UserDocument>;
}

export function getMasteryDocRef(
  db: Firestore,
  userId: string,
  subjectId: string
): DocumentReference<SubjectMasteryDoc> {
  return doc(db, "users", userId, "mastery", subjectId) as DocumentReference<SubjectMasteryDoc>;
}

export function getSessionsCollectionRef(
  db: Firestore,
  userId: string
): CollectionReference<StudySessionDoc> {
  return collection(db, "users", userId, "sessions") as CollectionReference<StudySessionDoc>;
}

export function getStudyPlanDocRef(
  db: Firestore,
  userId: string,
  weekId: string
): DocumentReference<StudyPlanDoc> {
  return doc(db, "users", userId, "studyPlan", weekId) as DocumentReference<StudyPlanDoc>;
}

export function getCurriculumConceptDocRef(
  db: Firestore,
  grade: string,
  subject: string,
  conceptId: string
): DocumentReference<CurriculumConceptDoc> {
  return doc(db, "curriculum", grade, subject, "concepts", conceptId) as DocumentReference<CurriculumConceptDoc>;
}

export function getAssessmentsCollectionRef(
  db: Firestore
): CollectionReference<AssessmentDoc> {
  return collection(db, "assessments") as CollectionReference<AssessmentDoc>;
}

export function getAssessmentDocRef(
  db: Firestore,
  assessmentId: string
): DocumentReference<AssessmentDoc> {
  return doc(db, "assessments", assessmentId) as DocumentReference<AssessmentDoc>;
}

// ============================================================================
// Real-Time Listener Helpers (with auto-cleanup and targeted filters)
// ============================================================================

/**
 * Targeted listener for student subject mastery.
 * Always targets a specific subject document under the user's mastery subcollection.
 */
export function listenToStudentMastery(
  userId: string,
  subjectId: string,
  onData: (data: SubjectMasteryDoc | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const db = getActiveDb();
  if (!db || !userId || !subjectId) {
    onData(null);
    return () => {};
  }

  const docRef = getMasteryDocRef(db, userId, subjectId);
  return onSnapshot(
    docRef,
    (snap: DocumentSnapshot) => {
      if (snap.exists()) {
        onData(snap.data() as SubjectMasteryDoc);
      } else {
        onData(null);
      }
    },
    (err) => {
      console.warn(`Firestore mastery listener error for ${userId}/${subjectId}:`, err);
      onError?.(err);
    }
  );
}

/**
 * Targeted listener for student study plan for a specific week.
 */
export function listenToStudyPlan(
  userId: string,
  weekId: string,
  onData: (data: StudyPlanDoc | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const db = getActiveDb();
  if (!db || !userId || !weekId) {
    onData(null);
    return () => {};
  }

  const docRef = getStudyPlanDocRef(db, userId, weekId);
  return onSnapshot(
    docRef,
    (snap: DocumentSnapshot) => {
      if (snap.exists()) {
        onData(snap.data() as StudyPlanDoc);
      } else {
        onData(null);
      }
    },
    (err) => {
      console.warn(`Firestore study plan listener error for ${userId}/${weekId}:`, err);
      onError?.(err);
    }
  );
}

/**
 * Targeted listener for user study sessions, ordered by startTime desc with limit.
 * Never listens across all users!
 */
export function listenToRecentSessions(
  userId: string,
  limitCount = 20,
  onData: (sessions: StudySessionDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const db = getActiveDb();
  if (!db || !userId) {
    onData([]);
    return () => {};
  }

  const colRef = getSessionsCollectionRef(db, userId);
  const q = query(colRef, orderBy("startTime", "desc"), limit(limitCount));

  return onSnapshot(
    q,
    (snap: QuerySnapshot) => {
      const results: StudySessionDoc[] = [];
      snap.forEach((docSnap) => {
        results.push({ id: docSnap.id, ...(docSnap.data() as StudySessionDoc) });
      });
      onData(results);
    },
    (err) => {
      console.warn(`Firestore sessions listener error for ${userId}:`, err);
      onError?.(err);
    }
  );
}

// ============================================================================
// Optimized Write Operations
// ============================================================================

/**
 * Save user profile and settings into users/{userId}
 */
export async function saveUserData(
  userId: string,
  data: Partial<UserDocument>
): Promise<void> {
  const db = getActiveDb();
  if (!db || !userId) return;

  const docRef = getUserDocRef(db, userId);
  await setDoc(
    docRef,
    {
      ...data,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Save or merge subject mastery document: users/{userId}/mastery/{subjectId}
 */
export async function saveSubjectMastery(
  userId: string,
  subjectId: string,
  data: Partial<SubjectMasteryDoc>
): Promise<void> {
  const db = getActiveDb();
  if (!db || !userId || !subjectId) return;

  const docRef = getMasteryDocRef(db, userId, subjectId);
  await setDoc(
    docRef,
    {
      ...data,
      subjectId,
      userId,
      lastUpdated: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Optimistically update a single concept inside subject mastery.
 */
export async function updateConceptMasteryRecord(
  userId: string,
  subjectId: string,
  conceptId: string,
  record: Partial<MasteryRecord>
): Promise<void> {
  const db = getActiveDb();
  if (!db || !userId || !subjectId || !conceptId) return;

  const docRef = getMasteryDocRef(db, userId, subjectId);
  const existing = await getDoc(docRef);
  const currentConcepts = existing.exists() ? existing.data()?.concepts || {} : {};
  const currentConcept = currentConcepts[conceptId] || {
    conceptId,
    masteryScore: 0,
    status: "NOT_STARTED",
    consecutiveCorrect: 0,
    totalAttempts: 0,
    lastAttemptedAt: null,
  };

  const updatedRecord = { ...currentConcept, ...record };

  await setDoc(
    docRef,
    {
      subjectId,
      userId,
      concepts: {
        ...currentConcepts,
        [conceptId]: updatedRecord,
      },
      lastUpdated: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Record a new study session in users/{userId}/sessions/{sessionId}
 */
export async function recordStudySession(
  userId: string,
  session: Omit<StudySessionDoc, "id" | "userId">
): Promise<string> {
  const db = getActiveDb();
  if (!db || !userId) throw new Error("Firestore not initialized");

  const sessionId = session.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, "users", userId, "sessions", sessionId);
  const payload: StudySessionDoc = {
    ...session,
    sessionId,
    userId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(docRef, payload);
  return sessionId;
}

/**
 * Save assessment record in assessments/{assessmentId}
 */
export async function saveAssessmentRecord(
  assessment: AssessmentDoc
): Promise<void> {
  const db = getActiveDb();
  if (!db) throw new Error("Firestore not initialized");

  const docRef = getAssessmentDocRef(db, assessment.assessmentId);
  await setDoc(docRef, assessment);
}
