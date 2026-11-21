import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirestoreDb, getFirebaseAuth } from "../services/firebase.ts";
import { isAdmin } from "../auth/roles.ts";

export interface NewStudentAlert {
  id: string;
  name: string;
  email: string;
  grade: string;
  stream: string;
  registeredAt: Timestamp;
  isNew: boolean; // true if registered in last 24h
  isAcknowledged: boolean;
}

export function useNewStudentAlerts() {
  const [alerts, setAlerts] = useState<NewStudentAlert[]>([]);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestoreDb();
    const auth = getFirebaseAuth();
    if (!db || !auth) {
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;

    const setup = async () => {
      const currentUser = auth.currentUser;
      if (!(await isAdmin(currentUser))) {
        setLoading(false);
        return;
      }

      // Listen to users registered in last 7 days, ordered by createdAt
      const sevenDaysAgo = Timestamp.fromDate(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      // PRIMARY: students with Timestamp createdAt in last 7 days
      const q = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("createdAt", ">=", sevenDaysAgo),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      // FALLBACK: get all students, sort client-side by lastActive
      // Used when createdAt is string or missing
      const qFallback = query(
        collection(db, "users"),
        where("role", "==", "student"),
        orderBy("lastActive", "desc"),
        limit(30)
      );

      unsub = onSnapshot(
        q,
        (snap) => {
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
          const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

          const toAlert = (
            d: import("firebase/firestore").QueryDocumentSnapshot
          ): NewStudentAlert | null => {
            const data = d.data();

            // Parse createdAt — handle both Timestamp and ISO string
            let createdMs: number;
            if (data.createdAt instanceof Timestamp) {
              createdMs = data.createdAt.toMillis();
            } else if (typeof data.createdAt === "string") {
              createdMs = new Date(data.createdAt).getTime() || 0;
            } else if (typeof data.createdAt === "number") {
              createdMs = data.createdAt;
            } else if (data.registeredAt instanceof Timestamp) {
              createdMs = data.registeredAt.toMillis();
            } else {
              // No createdAt — use lastActive as proxy
              if (data.lastActive instanceof Timestamp) {
                createdMs = data.lastActive.toMillis();
              } else {
                createdMs = 0;
              }
            }

            // Only include students from last 7 days
            if (createdMs > 0 && createdMs < sevenDaysAgoMs) return null;

            return {
              id: d.id,
              name: data.name || data.displayName || data.profile?.name || "قوتابی نوێ",
              email: data.email || data.profile?.email || data.phoneNumber || "",
              grade: data.grade || data.profile?.grade || "—",
              stream: data.stream || data.profile?.stream || "—",
              registeredAt:
                data.createdAt instanceof Timestamp
                  ? data.createdAt
                  : Timestamp.fromMillis(createdMs || Date.now()),
              isNew: createdMs > oneDayAgo,
              isAcknowledged: Boolean(data.adminAcknowledged),
            };
          };

          const list: NewStudentAlert[] = snap.docs
            .map(toAlert)
            .filter((a): a is NewStudentAlert => a !== null);

          setAlerts(list);
          setUnacknowledgedCount(list.filter((a) => !a.isAcknowledged).length);
          setLoading(false);
        },
        async (err) => {
          // If composite index missing — fall back to simpler query
          console.warn("[useNewStudentAlerts] primary query failed, using fallback:", err.message);

          try {
            const { getDocs } = await import("firebase/firestore");
            const fallSnap = await getDocs(qFallback);
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

            const list: NewStudentAlert[] = fallSnap.docs
              .map((d) => {
                const data = d.data();
                return {
                  id: d.id,
                  name: data.name || data.profile?.name || "قوتابی نوێ",
                  email: data.email || data.profile?.email || "",
                  grade: data.grade || data.profile?.grade || "—",
                  stream: data.stream || data.profile?.stream || "—",
                  registeredAt: Timestamp.now(),
                  isNew:
                    data.lastActive instanceof Timestamp
                      ? data.lastActive.toMillis() > oneDayAgo
                      : false,
                  isAcknowledged: Boolean(data.adminAcknowledged),
                };
              })
              .slice(0, 10);

            setAlerts(list);
            setUnacknowledgedCount(list.filter((a) => !a.isAcknowledged).length);
          } catch (fallErr) {
            console.warn("[useNewStudentAlerts] fallback also failed:", fallErr);
            setAlerts([]);
            setUnacknowledgedCount(0);
          }
          setLoading(false);
        }
      );
    };

    void setup();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Mark a student alert as acknowledged (admin saw it)
  const acknowledge = useCallback(async (studentId: string) => {
    const db = getFirestoreDb();
    if (!db) return;
    try {
      await updateDoc(doc(db, "users", studentId), {
        adminAcknowledged: true,
        adminAcknowledgedAt: serverTimestamp(),
      });
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === studentId ? { ...a, isAcknowledged: true } : a
        )
      );
      setUnacknowledgedCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn("[useNewStudentAlerts] acknowledge failed:", err);
    }
  }, []);

  const acknowledgeAll = useCallback(async () => {
    const unack = alerts.filter((a) => !a.isAcknowledged);
    await Promise.allSettled(unack.map((a) => acknowledge(a.id)));
  }, [alerts, acknowledge]);

  return { alerts, unacknowledgedCount, loading, acknowledge, acknowledgeAll };
}
