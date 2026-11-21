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

      const q = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("createdAt", ">=", sevenDaysAgo),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      unsub = onSnapshot(
        q,
        (snap) => {
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
          const list: NewStudentAlert[] = snap.docs.map((d) => {
            const data = d.data();
            const createdTs =
              data.createdAt instanceof Timestamp
                ? data.createdAt.toMillis()
                : typeof data.createdAt === "number"
                ? data.createdAt
                : Date.now();
            return {
              id: d.id,
              name: data.name || data.displayName || "قوتابی نوێ",
              email: data.email || "",
              grade: data.grade || "—",
              stream: data.stream || "—",
              registeredAt: data.createdAt || Timestamp.now(),
              isNew: createdTs > oneDayAgo,
              isAcknowledged: Boolean(data.adminAcknowledged),
            };
          });
          setAlerts(list);
          setUnacknowledgedCount(list.filter((a) => !a.isAcknowledged).length);
          setLoading(false);
        },
        (err) => {
          console.warn("[useNewStudentAlerts]", err);
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
