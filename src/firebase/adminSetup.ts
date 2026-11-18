/**
 * ZANA Platform - Firestore System & Admin Initialization
 *
 * 1. Ensures system/health and system/featureFlags documents exist
 * 2. Migrates existing users missing 'role' or 'lastActive'
 * 3. Seeds/creates admin document in users/{adminUid}
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  Timestamp,
  writeBatch,
  Firestore,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { getFirestoreDb, getFirebaseAuth } from "../services/firebase.ts";
import { ADMIN_EMAIL } from "../auth/roles.ts";

export interface SystemHealthData {
  firebase: "ONLINE" | "DEGRADED" | "DOWN";
  gemini: "ONLINE" | "DEGRADED" | "DOWN";
  cloudflare: "ONLINE" | "DEGRADED" | "DOWN";
  offlineSync: "READY" | "SYNCING" | "ERROR";
  lastChecked: Timestamp | Date;
  version: string;
}

export interface FeatureFlagsData {
  aiTutor: boolean;
  offlineMode: boolean;
  realTimeSync: boolean;
  kurdishAudio: boolean;
  parentReports: boolean;
  voiceInput: boolean;
  [key: string]: boolean;
}

export const DEFAULT_SYSTEM_HEALTH: SystemHealthData = {
  firebase: "ONLINE",
  gemini: "ONLINE",
  cloudflare: "ONLINE",
  offlineSync: "READY",
  lastChecked: Timestamp.now(),
  version: "2.4.0",
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlagsData = {
  aiTutor: true,
  offlineMode: true,
  realTimeSync: true,
  kurdishAudio: true,
  parentReports: true,
  voiceInput: true,
};

/**
 * Ensures system/health and system/featureFlags documents exist in Firestore.
 */
export async function ensureSystemDocuments(dbOverride?: Firestore): Promise<{
  healthCreated: boolean;
  flagsCreated: boolean;
}> {
  const db = dbOverride || getFirestoreDb();
  if (!db) {
    return { healthCreated: false, flagsCreated: false };
  }

  let healthCreated = false;
  let flagsCreated = false;

  // 1. system/health
  try {
    const healthRef = doc(db, "system", "health");
    const healthSnap = await getDoc(healthRef);
    if (!healthSnap.exists()) {
      await setDoc(healthRef, {
        ...DEFAULT_SYSTEM_HEALTH,
        lastChecked: Timestamp.now(),
      });
      healthCreated = true;
    }
  } catch (err) {
    console.warn("Failed to ensure system/health document:", err);
  }

  // 2. system/featureFlags
  try {
    const flagsRef = doc(db, "system", "featureFlags");
    const flagsSnap = await getDoc(flagsRef);
    if (!flagsSnap.exists()) {
      await setDoc(flagsRef, DEFAULT_FEATURE_FLAGS);
      flagsCreated = true;
    }
  } catch (err) {
    console.warn("Failed to ensure system/featureFlags document:", err);
  }

  return { healthCreated, flagsCreated };
}

export interface MigrationResult {
  migratedCount: number;
  totalUsersChecked: number;
  errors: string[];
}

/**
 * Scans users collection and assigns default role: 'student' and lastActive if missing.
 */
export async function migrateUsersMissingRole(dbOverride?: Firestore): Promise<MigrationResult> {
  const db = dbOverride || getFirestoreDb();
  const result: MigrationResult = {
    migratedCount: 0,
    totalUsersChecked: 0,
    errors: [],
  };

  if (!db) {
    result.errors.push("Firestore instance not available");
    return result;
  }

  try {
    const usersCol = collection(db, "users");
    const usersSnap = await getDocs(usersCol);
    result.totalUsersChecked = usersSnap.size;

    const batch = writeBatch(db);
    let batchOperations = 0;

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      const updates: Record<string, unknown> = {};

      if (!data.role) {
        // If email matches ADMIN_EMAIL, set admin, otherwise student
        if (data.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          updates.role = "admin";
        } else {
          updates.role = "student";
        }
      }

      if (!data.lastActive) {
        updates.lastActive = Timestamp.now();
      }

      if (Object.keys(updates).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        batch.update(userDoc.ref, updates as Record<string, any>);
        batchOperations++;
        result.migratedCount++;

        // Firestore batches can hold up to 500 operations
        if (batchOperations >= 450) {
          await batch.commit();
          batchOperations = 0;
        }
      }
    }

    if (batchOperations > 0) {
      await batch.commit();
    }

    // Also scan 'students' collection and ensure corresponding user documents exist with role: 'student'
    try {
      const studentsCol = collection(db, "students");
      const studentsSnap = await getDocs(studentsCol);
      for (const sDoc of studentsSnap.docs) {
        const sData = sDoc.data();
        const userRef = doc(db, "users", sDoc.id);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          const nowIso = sData.createdAt || new Date().toISOString();
          await setDoc(
            userRef,
            {
              id: sDoc.id,
              uid: sDoc.id,
              role: "student",
              name: sData.name || "قوتابی",
              displayName: sData.name || "قوتابی",
              email: sData.email || "",
              grade: sData.grade || "12",
              stream: sData.stream || "scientific",
              school: sData.school || "",
              lastActive: sData.updatedAt || nowIso,
              createdAt: nowIso,
              updatedAt: sData.updatedAt || nowIso,
              profile: {
                name: sData.name || "قوتابی",
                grade: sData.grade || "12",
                stream: sData.stream || "scientific",
                school: sData.school || "",
                language: "ckb",
                email: sData.email || "",
              },
            },
            { merge: true }
          );
          result.migratedCount++;
        }
      }
    } catch {
      // Safe fallback
    }
  } catch (err) {
    result.errors.push(`Migration error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
}

/**
 * Creates or updates the admin document in users/{adminUid}.
 */
export async function createAdminDocument(
  adminUid?: string,
  adminEmail: string = ADMIN_EMAIL,
  dbOverride?: Firestore
): Promise<{ success: boolean; uid?: string; message: string }> {
  const db = dbOverride || getFirestoreDb();
  const auth = getFirebaseAuth();

  if (!db) {
    return { success: false, message: "Firestore is not available" };
  }

  const targetUid = adminUid || auth?.currentUser?.uid;
  if (!targetUid) {
    return { success: false, message: "No admin UID provided or user not authenticated" };
  }

  try {
    const adminDocRef = doc(db, "users", targetUid);
    const adminDocSnap = await getDoc(adminDocRef);

    if (!adminDocSnap.exists()) {
      await setDoc(adminDocRef, {
        uid: targetUid,
        email: adminEmail,
        displayName: "سەرپەرشتیاری زانا (Admin)",
        role: "admin",
        createdAt: Timestamp.now(),
        lastActive: Timestamp.now(),
        isSuperAdmin: true,
      });
      return { success: true, uid: targetUid, message: "Admin document created successfully" };
    } else {
      // Ensure role is admin
      const existingData = adminDocSnap.data();
      if (existingData.role !== "admin") {
        await updateDoc(adminDocRef, {
          role: "admin",
          lastActive: Timestamp.now(),
        });
      }
      return { success: true, uid: targetUid, message: "Admin document verified and updated" };
    }
  } catch (err) {
    return {
      success: false,
      message: `Failed to create/verify admin doc: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
  * Full master setup routine for admin dashboard initialization.
  */
export async function initializeAdminSystem() {
  const sysDocs = await ensureSystemDocuments();
  return {
    systemDocuments: sysDocs,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Bootstraps all required Firestore documents when admin logs in.
 * Runs once to ensure system/health, system/featureFlags, system/metrics exist,
 * backfills missing role fields on users, and detects inactive student anomalies.
 */
export async function bootstrapAdminFirestore(): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;

  const batch = writeBatch(db);

  // 1. CREATE system/health if missing
  const healthRef = doc(db, "system", "health");
  const healthSnap = await getDoc(healthRef);
  if (!healthSnap.exists()) {
    batch.set(healthRef, {
      firebase: "ONLINE",
      gemini: "ONLINE",
      cloudflare: "ONLINE",
      offlineSync: "READY",
      lastChecked: serverTimestamp(),
      version: "2.0.0",
      bootstrappedAt: serverTimestamp(),
      bootstrappedBy: ADMIN_EMAIL,
    });
  }

  // 2. CREATE system/featureFlags if missing
  const flagsRef = doc(db, "system", "featureFlags");
  const flagsSnap = await getDoc(flagsRef);
  if (!flagsSnap.exists()) {
    batch.set(flagsRef, {
      teacher_dashboard: false,
      parent_portal: false,
      admin_dashboard: true,
      collaborative_lab: false,
      virtual_lab: true,
      study_plan: true,
      practice_lab: true,
      updatedAt: serverTimestamp(),
      updatedBy: ADMIN_EMAIL,
    });
  }

  // 3. CREATE system/metrics placeholder if missing
  const metricsRef = doc(db, "system", "metrics");
  const metricsSnap = await getDoc(metricsRef);
  if (!metricsSnap.exists()) {
    batch.set(metricsRef, {
      totalStudents: 0,
      activeSessionsToday: 0,
      totalLearningMinutesToday: 0,
      lastUpdated: serverTimestamp(),
    });
  }

  await batch.commit();

  // 4. BACKFILL users missing "role" field
  // Query users collection, add role:'student' where missing
  const usersRef = collection(db, "users");
  const usersSnap = await getDocs(usersRef);

  const backfillBatch = writeBatch(db);
  let backfillCount = 0;

  usersSnap.forEach((userDoc) => {
    const data = userDoc.data();
    if (!data.role) {
      const isAdminUser = data.email === ADMIN_EMAIL;
      backfillBatch.update(userDoc.ref, {
        role: isAdminUser ? "admin" : "student",
        lastActive: data.lastActive || serverTimestamp(),
        grade: data.grade || "12",
        stream: data.stream || "scientific",
      });
      backfillCount++;
    }
  });

  if (backfillCount > 0) {
    await backfillBatch.commit();
    console.log(`[ZANA Admin] Backfilled ${backfillCount} users with role field`);
  }

  // 5. CREATE sample anomaly if anomalies collection empty
  const anomRef = collection(db, "anomalies");
  const anomSnap = await getDocs(query(anomRef, where("resolved", "==", false)));

  if (anomSnap.empty) {
    // Check for real inactive students first
    const inactiveQuery = query(
      collection(db, "users"),
      where("role", "==", "student"),
      where(
        "lastActive",
        "<=",
        Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      )
    );
    const inactiveSnap = await getDocs(inactiveQuery);

    const anomBatch = writeBatch(db);
    inactiveSnap.docs.slice(0, 5).forEach((userDoc) => {
      const data = userDoc.data();
      const newAnom = doc(collection(db, "anomalies"));
      anomBatch.set(newAnom, {
        studentId: userDoc.id,
        studentName: data.name || data.displayName || "قوتابی نەناسراو",
        type: "INACTIVE_7_DAYS",
        severity: "MEDIUM",
        detectedAt: serverTimestamp(),
        resolved: false,
        details: {
          daysInactive: 7,
          notes: "بە خۆکاری دۆزراوەتەوە لە کاتی ڕێکخستنی سیستەم",
        },
      });
    });
    await anomBatch.commit();
  }

  console.log("[ZANA Admin] Firestore bootstrap complete ✅");
}
