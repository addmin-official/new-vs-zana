/**
 * Typed React hook for real-time concept progress data access.
 */

import { useState, useEffect, useCallback } from "react";
import { MasteryRecord, SubjectMasteryDoc } from "../firebase/types.ts";
import { listenToStudentMastery, updateConceptMasteryRecord } from "../firebase/firestore.ts";

export interface UseConceptProgressResult<T = MasteryRecord> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  updateProgress: (partial: Partial<MasteryRecord>) => Promise<void>;
}

export function useConceptProgress<T = MasteryRecord>(
  userId?: string | null,
  subjectId?: string | null,
  conceptId?: string | null
): UseConceptProgressResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(userId && subjectId && conceptId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !subjectId || !conceptId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = listenToStudentMastery(
      userId,
      subjectId,
      (subjectDoc: SubjectMasteryDoc | null) => {
        if (subjectDoc && subjectDoc.concepts && subjectDoc.concepts[conceptId]) {
          setData(subjectDoc.concepts[conceptId] as unknown as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, subjectId, conceptId]);

  const updateProgress = useCallback(
    async (partial: Partial<MasteryRecord>) => {
      if (!userId || !subjectId || !conceptId) return;

      // Optimistic local update
      setData((prev) => {
        if (!prev) {
          return {
            conceptId,
            masteryScore: 0,
            status: "NOT_STARTED",
            consecutiveCorrect: 0,
            totalAttempts: 0,
            lastAttemptedAt: null,
            ...partial,
          } as unknown as T;
        }
        return {
          ...(prev as unknown as MasteryRecord),
          ...partial,
        } as unknown as T;
      });

      try {
        await updateConceptMasteryRecord(userId, subjectId, conceptId, partial);
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [userId, subjectId, conceptId]
  );

  return {
    data,
    loading,
    error,
    updateProgress,
  };
}
