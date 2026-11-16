import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "../services/firebase.ts";
import { isAdmin, logAdminAction, ADMIN_EMAIL } from "../auth/roles.ts";

export type AnomalyType =
  | "INACTIVE_7_DAYS"
  | "MASTERY_DROP"
  | "UNRELIABLE_ASSESSMENT";

export type AnomalySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AnomalyDocument {
  id: string;
  studentId: string;
  studentName: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  detectedAt: Timestamp | null;
  resolved: boolean;
  resolvedAt?: Timestamp | null;
  resolvedBy?: string;
  details: {
    daysInactive?: number;
    masteryDrop?: number;
    assessmentId?: string;
    notes?: string;
    [key: string]: unknown;
  };
}

export function useAdminAnomalies() {
  const [anomalies, setAnomalies] = useState<AnomalyDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirestoreDb();
    const auth = getFirebaseAuth();

    if (!db || !auth) {
      setAnomalies([]);
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;

    const setupListener = async () => {
      const currentUser = auth.currentUser;
      const isUserAdmin = await isAdmin(currentUser);
      if (!isUserAdmin) {
        setError("ڕێگەت پێدراو نییە: بینینی کێشە و هەڵاوێرییەکان تەنها بۆ بەڕێوەبەرە.");
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "anomalies"),
          where("resolved", "==", false),
          orderBy("detectedAt", "desc"),
          limit(50)
        );

        unsub = onSnapshot(
          q,
          (snapshot) => {
            const list: AnomalyDocument[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                studentId: data.studentId || "",
                studentName: data.studentName || "قوتابی",
                type: data.type || "INACTIVE_7_DAYS",
                severity: data.severity || "MEDIUM",
                detectedAt: data.detectedAt || null,
                resolved: Boolean(data.resolved),
                resolvedAt: data.resolvedAt || null,
                resolvedBy: data.resolvedBy || undefined,
                details: data.details || {},
              };
            });

            setAnomalies(list);
            setLoading(false);
            setError(null);
          },
          (err) => {
            console.warn("[useAdminAnomalies] onSnapshot error:", err);
            setError("کێشەیەک لە خوێندنەوەی هەڵاوێرییەکان ڕوویدا.");
            setLoading(false);
          }
        );
      } catch (err) {
        console.warn("[useAdminAnomalies] setup error:", err);
        setLoading(false);
      }
    };

    void setupListener();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const resolveAnomaly = useCallback(async (id: string) => {
    const db = getFirestoreDb();
    const auth = getFirebaseAuth();
    if (!db) return;

    const adminEmail = auth?.currentUser?.email || ADMIN_EMAIL;

    // 1. Optimistic removal from UI list
    setAnomalies((prev) => prev.filter((a) => a.id !== id));

    // 2. Persist update to Firestore
    try {
      const docRef = doc(db, "anomalies", id);
      await updateDoc(docRef, {
        resolved: true,
        resolvedAt: serverTimestamp(),
        resolvedBy: adminEmail,
      });

      // 3. Log audit action
      await logAdminAction("ANOMALY_RESOLVED", undefined, { anomalyId: id });
    } catch (err) {
      console.error("[useAdminAnomalies] Failed to resolve anomaly:", err);
      // Let snapshot revert if failed
    }
  }, []);

  const refetch = useCallback(async () => {
    // onSnapshot listener handles live stream; refetch re-triggers check
    const db = getFirestoreDb();
    if (!db) return;
    try {
      const q = query(
        collection(db, "anomalies"),
        where("resolved", "==", false),
        orderBy("detectedAt", "desc"),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const list: AnomalyDocument[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          studentId: data.studentId || "",
          studentName: data.studentName || "قوتابی",
          type: data.type || "INACTIVE_7_DAYS",
          severity: data.severity || "MEDIUM",
          detectedAt: data.detectedAt || null,
          resolved: Boolean(data.resolved),
          resolvedAt: data.resolvedAt || null,
          resolvedBy: data.resolvedBy || undefined,
          details: data.details || {},
        };
      });
      setAnomalies(list);
    } catch {
      // Ignored
    }
  }, []);

  return {
    anomalies,
    loading,
    error,
    resolveAnomaly,
    refetch,
  };
}
