import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  getCountFromServer,
  onSnapshot,
  Timestamp,
  doc,
  getDoc,
  Unsubscribe,
} from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "../services/firebase.ts";
import { isAdmin } from "../auth/roles.ts";
import { useAppStore } from "../store/appStore.ts";

export interface AdminMetrics {
  activeStudents: number; // users active in last 15 min
  todayLearningMinutes: number; // sum of session durations today
  topSubject: { name: string; nameKu: string; percent: number };
  systemStatus: "healthy" | "degraded" | "down";
  totalStudents: number;
  newStudentsToday: number;
  assessmentsToday: number;
  avgMasteryScore: number; // 0.0–1.0
  lastUpdated: Date;
}

const SUBJECT_KU_NAMES: Record<string, string> = {
  mathematics: "بیرکاری",
  math: "بیرکاری",
  physics: "فیزیا",
  chemistry: "کیمیا",
  biology: "بایۆلۆژی",
  arabic: "عەرەبی",
  english: "ئینگلیزی",
  kurdish: "کوردی",
  history: "مێژوو",
  geography: "جوگرافیا",
  islamic: "ئیسلام",
  islam: "ئیسلام",
  islamic_studies: "ئیسلام",
  islamicStudies: "ئیسلام",
  computer: "کۆمپیوتەر",
  computer_science: "کۆمپیوتەر",
};

export function getTodayDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function useAdminMetrics() {
  const storeUser = useAppStore((state) => state.user);
  const [data, setData] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const liveActiveCountRef = useRef<number>(0);

  const fetchNonRealtimeMetrics = useCallback(async () => {
    const db = getFirestoreDb();
    const auth = getFirebaseAuth();

    if (!db || !auth) {
      setData({
        activeStudents: 0,
        todayLearningMinutes: 0,
        topSubject: { name: "chemistry", nameKu: "کیمیا", percent: 0 },
        systemStatus: "healthy",
        totalStudents: 0,
        newStudentsToday: 0,
        assessmentsToday: 0,
        avgMasteryScore: 0,
        lastUpdated: new Date(),
      });
      setLoading(false);
      return;
    }

    const currentUser = auth.currentUser;
    const isUserAdmin = await isAdmin(currentUser);
    if (!isUserAdmin) {
      const authError = "ڕێگەت پێدراو نییە: ئەم زانیارییانە تەنها بۆ بەڕێوەبەرە (Admin only)";
      setError(authError);
      setLoading(false);
      return;
    }

    try {
      const todayDate = getTodayDateString();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTodayTimestamp = Timestamp.fromDate(startOfToday);

      // 1. Total Students: query collection('users') and collection('students')
      let totalStudents = 0;
      try {
        const studentsQuery = query(
          collection(db, "users"),
          where("role", "==", "student")
        );
        const countSnap = await getCountFromServer(studentsQuery);
        totalStudents = countSnap.data().count;
      } catch {
        // Fallback to docs count if aggregation index not ready
        try {
          const fallbackSnap = await getDocs(
            query(collection(db, "users"), where("role", "==", "student"))
          );
          totalStudents = fallbackSnap.size;
        } catch {
          totalStudents = 0;
        }
      }

      // Also include documents in 'students' collection
      try {
        const studentsColCount = await getCountFromServer(collection(db, "students"));
        totalStudents = Math.max(totalStudents, studentsColCount.data().count);
      } catch {
        try {
          const studentsColSnap = await getDocs(collection(db, "students"));
          totalStudents = Math.max(totalStudents, studentsColSnap.size);
        } catch {
          // Non-blocking
        }
      }

      // 2. New Students Today
      let newStudentsToday = 0;
      try {
        const newStudentsQuery = query(
          collection(db, "users"),
          where("role", "==", "student"),
          where("createdAt", ">=", startOfTodayTimestamp)
        );
        const newCountSnap = await getCountFromServer(newStudentsQuery);
        newStudentsToday = newCountSnap.data().count;
      } catch {
        // Safe fallback
        newStudentsToday = 0;
      }

      // 3. Today's Learning Minutes & Top Subject Today
      let todayLearningMinutes = 0;
      const subjectCounts: Record<string, number> = {};

      try {
        // Query sessions with date == today
        let sessionsSnap = await getDocs(
          query(collection(db, "sessions"), where("date", "==", todayDate))
        );

        if (sessionsSnap.empty) {
          try {
            sessionsSnap = await getDocs(
              query(collectionGroup(db, "sessions"), where("date", "==", todayDate))
            );
          } catch {
            // Collection group may require index
          }
        }

        sessionsSnap.forEach((docSnap) => {
          const s = docSnap.data();
          const duration =
            typeof s.durationMinutes === "number"
              ? s.durationMinutes
              : s.startTime && s.endTime
              ? Math.max(
                  1,
                  Math.round(
                    (s.endTime.toMillis() - s.startTime.toMillis()) / (60 * 1000)
                  )
                )
              : 0;
          todayLearningMinutes += duration;

          const subj = (s.subjectId || s.subject || "general").toLowerCase();
          subjectCounts[subj] = (subjectCounts[subj] || 0) + 1;
        });
      } catch {
        // Offline / empty fallback
      }

      // Fallback: read from system/metrics aggregate document
      if (todayLearningMinutes === 0) {
        try {
          const metricsDoc = await getDoc(doc(db, "system", "metrics"));
          if (metricsDoc.exists()) {
            todayLearningMinutes = metricsDoc.data().totalLearningMinutesToday || 0;
          }
        } catch {
          /* silent */
        }
      }

      // Write today's computed value back to system/metrics
      // so tomorrow's fallback has real data
      try {
        const { setDoc, serverTimestamp } = await import("firebase/firestore");
        const metricsRef = doc(db, "system", "metrics");
        setDoc(
          metricsRef,
          {
            totalLearningMinutesToday: todayLearningMinutes,
            lastUpdated: serverTimestamp(),
            computedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => {});
      } catch {
        /* non-blocking */
      }

      // Calculate Top Subject
      let topSubject = { name: "chemistry", nameKu: "کیمیا", percent: 0 };
      const totalSessionCount = Object.values(subjectCounts).reduce(
        (a, b) => a + b,
        0
      );
      if (totalSessionCount > 0) {
        let maxCount = -1;
        let topSubjKey = "chemistry";
        for (const [k, v] of Object.entries(subjectCounts)) {
          if (v > maxCount) {
            maxCount = v;
            topSubjKey = k;
          }
        }
        const pct = Math.round((maxCount / totalSessionCount) * 100);
        topSubject = {
          name: topSubjKey,
          nameKu: SUBJECT_KU_NAMES[topSubjKey] || topSubjKey,
          percent: pct,
        };
      }

      // 4. Assessments Today
      let assessmentsToday = 0;
      try {
        const assessQuery = query(
          collection(db, "assessments"),
          where("createdAt", ">=", startOfTodayTimestamp)
        );
        const assessCountSnap = await getCountFromServer(assessQuery);
        assessmentsToday = assessCountSnap.data().count;
      } catch {
        assessmentsToday = 0;
      }

      // 5. Average Mastery Score
      let avgMasteryScore = 0;
      try {
        let totalMastery = 0;
        let masteryCount = 0;

        // Try collectionGroup('mastery')
        try {
          const masterySnap = await getDocs(collectionGroup(db, "mastery"));
          masterySnap.forEach((mDoc) => {
            const mData = mDoc.data();
            const score =
              typeof mData.overallScore === "number"
                ? mData.overallScore
                : typeof mData.score === "number"
                ? mData.score
                : null;
            if (score !== null && !isNaN(score)) {
              totalMastery += Math.max(0, Math.min(1, score));
              masteryCount++;
            }
          });
        } catch {
          // Fallback to top-level users mastery field
          const usersWithMastery = await getDocs(
            query(collection(db, "users"), where("role", "==", "student"))
          );
          usersWithMastery.forEach((u) => {
            const uData = u.data();
            if (typeof uData.masteryScore === "number") {
              totalMastery += uData.masteryScore;
              masteryCount++;
            }
          });
        }

        avgMasteryScore =
          masteryCount > 0 ? Number((totalMastery / masteryCount).toFixed(2)) : 0.75;
      } catch {
        avgMasteryScore = 0.75;
      }

      // 6. System Status from document('system/health')
      let systemStatus: "healthy" | "degraded" | "down" = "healthy";
      try {
        const healthDoc = await getDoc(doc(db, "system", "health"));
        if (healthDoc.exists()) {
          const h = healthDoc.data();
          const statuses = [
            h.firebase,
            h.gemini,
            h.cloudflare,
            h.offlineSync === "ERROR" ? "DOWN" : h.offlineSync === "SYNCING" ? "DEGRADED" : "ONLINE",
          ];
          if (statuses.some((s) => s === "DOWN")) {
            systemStatus = "down";
          } else if (statuses.some((s) => s === "DEGRADED")) {
            systemStatus = "degraded";
          } else {
            systemStatus = "healthy";
          }
        }
      } catch {
        systemStatus = "healthy";
      }

      setData((prev) => ({
        activeStudents: prev?.activeStudents ?? liveActiveCountRef.current,
        todayLearningMinutes,
        topSubject,
        systemStatus,
        totalStudents,
        newStudentsToday,
        assessmentsToday,
        avgMasteryScore,
        lastUpdated: new Date(),
      }));
      setError(null);
    } catch (err) {
      console.error("[useAdminMetrics] Error fetching live metrics:", err);
      setError("کێشەیەک لە بارکردنی ئامارەکانی بەڕێوەبەرایەتی لە فایەربەیس ڕوویدا.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time Active Students Listener (last 15 minutes)
  useEffect(() => {
    const db = getFirestoreDb();
    const auth = getFirebaseAuth();

    if (!db || !auth) return;

    let unsub: Unsubscribe | undefined;

    const setupListener = async () => {
      const currentUser = auth.currentUser;
      const isUserAdmin = await isAdmin(currentUser);
      if (!isUserAdmin) return;

      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
      const fifteenMinAgoTimestamp = Timestamp.fromDate(fifteenMinAgo);

      try {
        const activeSessionsQuery = query(
          collection(db, "sessions"),
          where("endTime", "==", null),
          where("startTime", ">=", fifteenMinAgoTimestamp)
        );

        unsub = onSnapshot(
          activeSessionsQuery,
          (snapshot) => {
            const count = snapshot.size;
            liveActiveCountRef.current = count;
            setData((prev) => (prev ? { ...prev, activeStudents: count } : null));
          },
          (err) => {
            console.warn("[useAdminMetrics] onSnapshot active sessions warning:", err.message);
          }
        );
      } catch (err) {
        console.warn("[useAdminMetrics] Listener setup error:", err);
      }
    };

    void setupListener();

    return () => {
      if (unsub) unsub();
    };
  }, [storeUser]);

  // Initial fetch and 60-second polling interval
  useEffect(() => {
    void fetchNonRealtimeMetrics();

    const interval = setInterval(() => {
      void fetchNonRealtimeMetrics();
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchNonRealtimeMetrics]);

  return {
    data,
    loading,
    error,
    refetch: fetchNonRealtimeMetrics,
  };
}
