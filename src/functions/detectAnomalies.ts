/**
 * ZANA Platform - Anomaly Detection Scheduled Job / Cloud Function
 *
 * Runs periodically (e.g. every 6 hours via Cloud Scheduler / Firebase Function)
 * to detect at-risk students:
 * 1. INACTIVE_7_DAYS: Users inactive for 7+ days
 * 2. MASTERY_DROP: Students whose mastery score dropped by >20%
 * 3. UNRELIABLE_ASSESSMENT: Assessments flagged as UNRELIABLE within the last 24-48 hours
 */

import * as adminNamespace from "firebase-admin";

export type AnomalyType = "INACTIVE_7_DAYS" | "MASTERY_DROP" | "UNRELIABLE_ASSESSMENT";
export type AnomalySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AnomalyDetails {
  daysInactive?: number;
  masteryDrop?: number;
  assessmentId?: string;
  previousMastery?: number;
  currentMastery?: number;
  notes?: string;
}

export interface AnomalyDocument {
  id: string;
  studentId: string;
  studentName: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  detectedAt: { toDate?: () => Date } | Date | unknown;
  resolved: boolean;
  resolvedAt?: { toDate?: () => Date } | Date | null | unknown;
  resolvedBy?: string | null;
  details: AnomalyDetails;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFirestoreInstance(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = (adminNamespace as any).default || adminNamespace;
    if (admin && admin.apps && !admin.apps.length && typeof admin.initializeApp === "function") {
      admin.initializeApp();
    }
    return typeof admin?.firestore === "function" ? admin.firestore() : null;
  } catch {
    return null;
  }
}

export interface DetectionResult {
  inactiveAnomaliesCreated: number;
  masteryDropAnomaliesCreated: number;
  unreliableAnomaliesCreated: number;
  totalCreated: number;
  errors: string[];
}

/**
 * Core anomaly detection engine. Can be executed by Cloud Function, CLI,
 * or scheduled worker.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runAnomalyDetection(dbOverride?: any): Promise<DetectionResult> {
  const db = dbOverride || getFirestoreInstance();
  const result: DetectionResult = {
    inactiveAnomaliesCreated: 0,
    masteryDropAnomaliesCreated: 0,
    unreliableAnomaliesCreated: 0,
    totalCreated: 0,
    errors: [],
  };

  if (!db) {
    result.errors.push("Firestore instance not available");
    return result;
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Timestamp = (adminNamespace as any).firestore?.Timestamp || {
    fromDate: (d: Date) => d,
    now: () => new Date(),
  };

  try {
    // -------------------------------------------------------------
    // Fetch currently active unresolved anomalies to prevent duplicates
    // -------------------------------------------------------------
    const existingAnomaliesSnapshot = await db
      .collection("anomalies")
      .where("resolved", "==", false)
      .get();

    const existingAnomalyKeys = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    existingAnomaliesSnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      existingAnomalyKeys.add(`${data.studentId}_${data.type}`);
    });

    // -------------------------------------------------------------
    // 1. INACTIVE_7_DAYS
    // Query users where role == 'student' and lastActive < 7 days ago
    // -------------------------------------------------------------
    try {
      const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);
      const inactiveQuerySnapshot = await db
        .collection("users")
        .where("role", "==", "student")
        .where("lastActive", "<", sevenDaysAgoTimestamp)
        .get();

      for (const userDoc of inactiveQuerySnapshot.docs) {
        const userData = userDoc.data();
        const studentId = userDoc.id;
        const key = `${studentId}_INACTIVE_7_DAYS`;

        if (!existingAnomalyKeys.has(key)) {
          const lastActiveDate = userData.lastActive?.toDate
            ? userData.lastActive.toDate()
            : new Date(userData.lastActive || 0);
          const daysInactive = Math.max(
            7,
            Math.floor((now.getTime() - lastActiveDate.getTime()) / (24 * 60 * 60 * 1000))
          );

          const severity: AnomalySeverity = daysInactive >= 14 ? "HIGH" : "MEDIUM";
          const anomalyRef = db.collection("anomalies").doc();

          await anomalyRef.set({
            studentId,
            studentName: userData.displayName || userData.name || "قوتابی بێ‌ناو",
            type: "INACTIVE_7_DAYS",
            severity,
            detectedAt: Timestamp.now(),
            resolved: false,
            resolvedAt: null,
            resolvedBy: null,
            details: {
              daysInactive,
            },
          });

          existingAnomalyKeys.add(key);
          result.inactiveAnomaliesCreated++;
          result.totalCreated++;
        }
      }
    } catch (err) {
      result.errors.push(`Inactive check failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // -------------------------------------------------------------
    // 2. MASTERY_DROP (> 20% drop)
    // Query students and inspect mastery documents
    // -------------------------------------------------------------
    try {
      const studentsSnapshot = await db
        .collection("users")
        .where("role", "==", "student")
        .limit(200)
        .get();

      for (const userDoc of studentsSnapshot.docs) {
        const studentId = userDoc.id;
        const userData = userDoc.data();
        const key = `${studentId}_MASTERY_DROP`;

        if (existingAnomalyKeys.has(key)) continue;

        // Check user's mastery document or score comparison
        let currentMastery = typeof userData.masteryScore === "number" ? userData.masteryScore : null;
        let previousMastery =
          typeof userData.previousMasteryScore === "number"
            ? userData.previousMasteryScore
            : null;

        if (currentMastery === null || previousMastery === null) {
          const masteryDoc = await db
            .collection("users")
            .doc(studentId)
            .collection("mastery")
            .doc("summary")
            .get();

          if (masteryDoc.exists) {
            const mData = masteryDoc.data();
            currentMastery = currentMastery ?? mData?.overallScore ?? null;
            previousMastery = previousMastery ?? mData?.previousScore ?? mData?.lastWeekScore ?? null;
          }
        }

        if (
          typeof currentMastery === "number" &&
          typeof previousMastery === "number" &&
          previousMastery > 0
        ) {
          const drop = previousMastery - currentMastery;
          if (drop >= 0.2) {
            const severity: AnomalySeverity = drop >= 0.35 ? "CRITICAL" : "HIGH";
            const anomalyRef = db.collection("anomalies").doc();

            await anomalyRef.set({
              studentId,
              studentName: userData.displayName || userData.name || "قوتابی بێ‌ناو",
              type: "MASTERY_DROP",
              severity,
              detectedAt: Timestamp.now(),
              resolved: false,
              resolvedAt: null,
              resolvedBy: null,
              details: {
                masteryDrop: Math.round(drop * 100) / 100,
                previousMastery: Math.round(previousMastery * 100) / 100,
                currentMastery: Math.round(currentMastery * 100) / 100,
              },
            });

            existingAnomalyKeys.add(key);
            result.masteryDropAnomaliesCreated++;
            result.totalCreated++;
          }
        }
      }
    } catch (err) {
      result.errors.push(`Mastery drop check failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // -------------------------------------------------------------
    // 3. UNRELIABLE_ASSESSMENT
    // Query assessments / sessions where reliability == 'UNRELIABLE'
    // -------------------------------------------------------------
    try {
      const oneDayAgoTimestamp = Timestamp.fromDate(oneDayAgo);
      let unreliableSnapshot;

      try {
        unreliableSnapshot = await db
          .collectionGroup("assessments")
          .where("reliability", "==", "UNRELIABLE")
          .where("detectedAt", ">=", oneDayAgoTimestamp)
          .limit(50)
          .get();
      } catch {
        // Fallback to top-level assessments collection if collectionGroup is empty
        unreliableSnapshot = await db
          .collection("assessments")
          .where("reliability", "==", "UNRELIABLE")
          .where("detectedAt", ">=", oneDayAgoTimestamp)
          .limit(50)
          .get();
      }

      for (const docSnap of unreliableSnapshot.docs) {
        const assessmentData = docSnap.data();
        const assessmentId = docSnap.id;
        const studentId = assessmentData.studentId || assessmentData.userId || docSnap.ref.parent.parent?.id;

        if (!studentId) continue;

        const key = `${studentId}_UNRELIABLE_${assessmentId}`;
        if (!existingAnomalyKeys.has(key)) {
          const anomalyRef = db.collection("anomalies").doc();
          await anomalyRef.set({
            studentId,
            studentName: assessmentData.studentName || assessmentData.userName || "قوتابی",
            type: "UNRELIABLE_ASSESSMENT",
            severity: "MEDIUM",
            detectedAt: Timestamp.now(),
            resolved: false,
            resolvedAt: null,
            resolvedBy: null,
            details: {
              assessmentId,
              notes: assessmentData.reason || "ئەنجامی تاقیکردنەوە بە جێگەی متمانە نییە نیشان دراوە",
            },
          });

          existingAnomalyKeys.add(key);
          result.unreliableAnomaliesCreated++;
          result.totalCreated++;
        }
      }
    } catch (err) {
      result.errors.push(`Unreliable assessment check failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  } catch (err) {
    result.errors.push(`Anomaly detection overall failure: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
}

/**
 * Scheduled Firebase Function export.
 * Runs every 6 hours.
 */
export const detectAnomaliesScheduled = {
  schedule: "every 6 hours",
  run: async () => {
    return runAnomalyDetection();
  },
};
