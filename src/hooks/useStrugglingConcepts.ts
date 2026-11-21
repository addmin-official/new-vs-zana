import { useState, useEffect, useCallback } from "react";
import {
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { getFirestoreDb, getFirebaseAuth } from "../services/firebase.ts";
import { isAdmin } from "../auth/roles.ts";

export interface StrugglingConceptData {
  conceptId: string;
  titleKu: string;
  subject: string;
  subjectKu: string;
  grade: string;
  avgMastery: number; // 0.0–1.0 average across students
  strugglingStudentsCount: number; // students with mastery <= 0.4
  totalStudentsAttempted: number;
  lastUpdated: Date;
}

const SUBJECT_KU: Record<string, string> = {
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
  islamicStudies: "ئیسلام",
  computer: "کۆمپیوتەر",
  computer_science: "کۆمپیوتەر",
};

export function useStrugglingConcepts(topN = 10) {
  const [concepts, setConcepts] = useState<StrugglingConceptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetch = useCallback(async () => {
    const db = getFirestoreDb();
    const auth = getFirebaseAuth();
    if (!db || !auth) {
      setLoading(false);
      return;
    }

    const currentUser = auth.currentUser;
    if (!(await isAdmin(currentUser))) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Query all mastery sub-collections across all users
      // Filter: masteryScore <= 0.4 (struggling threshold)
      const q = query(
        collectionGroup(db, "mastery"),
        where("overallScore", "<=", 0.4),
        orderBy("overallScore", "asc"),
        limit(500) // process up to 500 struggling mastery records
      );

      const snap = await getDocs(q);

      // Aggregate by conceptId
      const conceptMap = new Map<
        string,
        {
          scores: number[];
          subject: string;
          grade: string;
          titleKu: string;
          lastUpdated: Date;
        }
      >();

      snap.docs.forEach((d) => {
        const data = d.data();
        // mastery doc path: users/{uid}/mastery/{subjectId}
        // concepts are stored as: data.concepts = { [conceptId]: { score, tier, ... } }
        const subjectId = d.id;
        const conceptsMap = data.concepts as
          | Record<string, { score?: number; tier?: string }>
          | undefined;

        if (!conceptsMap) {
          // Flat mastery doc (one doc = one subject's overall)
          const conceptId = `${subjectId}`;
          if (!conceptMap.has(conceptId)) {
            conceptMap.set(conceptId, {
              scores: [],
              subject: subjectId,
              grade: data.grade || "12",
              titleKu: SUBJECT_KU[subjectId] || subjectId,
              lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
            });
          }
          conceptMap.get(conceptId)!.scores.push(data.overallScore ?? 0);
          return;
        }

        // Per-concept mastery breakdown
        Object.entries(conceptsMap).forEach(([conceptId, conceptData]) => {
          const score = conceptData?.score ?? 0;
          if (score > 0.4) return; // only struggling

          const key = `${subjectId}::${conceptId}`;
          if (!conceptMap.has(key)) {
            conceptMap.set(key, {
              scores: [],
              subject: subjectId,
              grade: data.grade || "12",
              titleKu: conceptId, // will be overridden if curriculum has name
              lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
            });
          }
          conceptMap.get(key)!.scores.push(score);
        })
      });

      // Convert to sorted list
      const result: StrugglingConceptData[] = [];
      conceptMap.forEach((val, key) => {
        const [subjectId, conceptId = subjectId] = key.split("::");
        const avgMastery =
          val.scores.reduce((s, v) => s + v, 0) / val.scores.length;
        result.push({
          conceptId,
          titleKu: val.titleKu,
          subject: subjectId,
          subjectKu: SUBJECT_KU[subjectId] || subjectId,
          grade: val.grade,
          avgMastery,
          strugglingStudentsCount: val.scores.length,
          totalStudentsAttempted: val.scores.length,
          lastUpdated: val.lastUpdated,
        });
      });

      // Sort by most struggling (lowest avg mastery, most students)
      result.sort((a, b) => {
        const scoreSort = a.avgMastery - b.avgMastery;
        if (Math.abs(scoreSort) > 0.05) return scoreSort;
        return b.strugglingStudentsCount - a.strugglingStudentsCount;
      });

      setConcepts(result.slice(0, topN));
      setLastFetched(new Date());
      setError(null);
    } catch (err) {
      console.warn("[useStrugglingConcepts]", err);
      setError("کێشەیەک لە خوێندنەوەی زانیاری قوتابیانی لاواز ڕوویدا.");
      setConcepts([]);
    } finally {
      setLoading(false);
    }
  }, [topN]);

  useEffect(() => {
    void fetch();
    // Refresh every 5 minutes
    const interval = setInterval(fetch, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { concepts, loading, error, lastFetched, refetch: fetch };
}
