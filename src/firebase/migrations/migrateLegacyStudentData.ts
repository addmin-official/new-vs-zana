/**
 * ZANA Platform - Migration Script: Legacy Student Data -> Optimized Firestore Schema
 * Migrates flat documents in 'students/{studentId}' to:
 * - users/{userId} (profile & settings)
 * - users/{userId}/mastery/{subjectId}
 * - users/{userId}/studyPlan/{weekId}
 */

import {
  Firestore,
  collection,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import {
  UserDocument,
  SubjectMasteryDoc,
  MasteryRecord,
  StudyPlanDoc,
} from "../types.ts";

export interface MigrationStats {
  totalScanned: number;
  migratedUsers: number;
  migratedMasteryRecords: number;
  migratedPlans: number;
  errors: Array<{ studentId: string; error: string }>;
}

/**
 * Executes or simulates the migration from legacy `students` collection to the new schema.
 * @param db Active Firestore instance
 * @param dryRun If true, scans and validates without writing to Firestore
 */
export async function migrateLegacyStudentData(
  db: Firestore,
  options: { dryRun?: boolean; batchLimit?: number } = {}
): Promise<MigrationStats> {
  const { dryRun = false, batchLimit: _batchLimit = 200 } = options;
  const stats: MigrationStats = {
    totalScanned: 0,
    migratedUsers: 0,
    migratedMasteryRecords: 0,
    migratedPlans: 0,
    errors: [],
  };

  try {
    const studentsCol = collection(db, "students");
    const snapshot = await getDocs(studentsCol);
    stats.totalScanned = snapshot.size;

    console.log(`[Migration] Found ${snapshot.size} legacy student documents. DryRun=${dryRun}`);

    for (const docSnap of snapshot.docs) {
      const studentId = docSnap.id;
      const data = docSnap.data();

      try {
        // 1. Build optimized UserDocument
        const userDoc: UserDocument = {
          id: studentId,
          profile: {
            name: typeof data.name === "string" ? data.name : "قوتابی",
            grade: typeof data.grade === "string" ? data.grade : "12",
            stream: typeof data.stream === "string" ? data.stream : "scientific",
            school: typeof data.school === "string" ? data.school : "",
            language: typeof data.language === "string" ? data.language : "ku",
            email: typeof data.email === "string" ? data.email : "",
          },
          settings: {
            theme: data.theme === "dark" || data.theme === "light" ? data.theme : "system",
            notifications: typeof data.notifications === "boolean" ? data.notifications : true,
            language: typeof data.language === "string" ? data.language : "ku",
            soundEffects: typeof data.soundEffects === "boolean" ? data.soundEffects : true,
          },
          createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // 2. Build optimized SubjectMasteryDoc
        const activeSubject = (typeof data.activeSubject === "string" ? data.activeSubject : "chemistry").toLowerCase();
        const rawMastery = (data.mastery && typeof data.mastery === "object") ? data.mastery : {};
        const conceptsMap: Record<string, MasteryRecord> = {};

        for (const [cId, cVal] of Object.entries(rawMastery)) {
          if (cVal && typeof cVal === "object") {
            const val = cVal as Record<string, unknown>;
            conceptsMap[cId] = {
              conceptId: cId,
              masteryScore: typeof val.masteryScore === "number" ? val.masteryScore : (typeof val.score === "number" ? val.score : 0.5),
              status: typeof val.status === "string" ? val.status : "DEVELOPING",
              consecutiveCorrect: typeof val.consecutiveCorrect === "number" ? val.consecutiveCorrect : 0,
              totalAttempts: typeof val.totalAttempts === "number" ? val.totalAttempts : 1,
              lastAttemptedAt: typeof val.lastAttemptedAt === "string" ? val.lastAttemptedAt : null,
              stabilityFactor: typeof val.stabilityFactor === "number" ? val.stabilityFactor : 2.5,
              ddi: typeof val.ddi === "number" ? val.ddi : 0.5,
            };
          }
        }

        const masteryDoc: SubjectMasteryDoc = {
          subjectId: activeSubject,
          userId: studentId,
          concepts: conceptsMap,
          lastUpdated: new Date().toISOString(),
          overallScore: typeof data.totalScore === "number" ? data.totalScore : (typeof data.xp === "number" ? data.xp : 0),
          studyStreak: typeof data.streak === "number" ? data.streak : 1,
        };

        // 3. Build initial weekly StudyPlanDoc
        const now = new Date();
        const weekNum = Math.ceil(now.getDate() / 7);
        const weekId = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
        const studyPlanDoc: StudyPlanDoc = {
          weekId,
          userId: studentId,
          days: {
            "0": [{ id: "p1", subject: activeSubject, concept: "پێداچوونەوە", estimatedMinutes: 25, type: "review", completed: false }],
            "1": [{ id: "p2", subject: activeSubject, concept: "وانەی نوێ", estimatedMinutes: 30, type: "new", completed: false }],
            "2": [{ id: "p3", subject: activeSubject, concept: "ڕاهێنان", estimatedMinutes: 20, type: "practice", completed: false }],
            "3": [{ id: "p4", subject: activeSubject, concept: "پێداچوونەوەی دووەم", estimatedMinutes: 25, type: "review", completed: false }],
            "4": [{ id: "p5", subject: activeSubject, concept: "ڕاهێنانی کۆتایی", estimatedMinutes: 30, type: "practice", completed: false }],
            "5": [],
            "6": [],
          },
          generated: new Date().toISOString(),
          completionRate: 0,
        };

        if (!dryRun) {
          // Write to new schema paths
          const userRef = doc(db, "users", studentId);
          const masteryRef = doc(db, "users", studentId, "mastery", activeSubject);
          const planRef = doc(db, "users", studentId, "studyPlan", weekId);

          await setDoc(userRef, userDoc, { merge: true });
          await setDoc(masteryRef, masteryDoc, { merge: true });
          await setDoc(planRef, studyPlanDoc, { merge: true });
        }

        stats.migratedUsers++;
        stats.migratedMasteryRecords += Object.keys(conceptsMap).length;
        stats.migratedPlans++;
      } catch (err: unknown) {
        stats.errors.push({
          studentId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    console.log(`[Migration Complete] Users: ${stats.migratedUsers}, Concepts: ${stats.migratedMasteryRecords}, Errors: ${stats.errors.length}`);
    return stats;
  } catch (err: unknown) {
    console.error("[Migration Fatal Error]", err);
    throw err;
  }
}
