/**
 * Typed React hook for real-time student mastery data access with optimistic updates.
 */

import { useState, useEffect, useCallback } from "react";
import { SubjectMasteryDoc, MasteryRecord } from "../firebase/types.ts";
import {
  listenToStudentMastery,
  updateConceptMasteryRecord,
  saveSubjectMastery,
} from "../firebase/firestore.ts";

export interface UseStudentMasteryResult<T = SubjectMasteryDoc> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  updateConcept: (conceptId: string, partial: Partial<MasteryRecord>) => Promise<void>;
  updateMastery: (partial: Partial<SubjectMasteryDoc>) => Promise<void>;
  refresh: () => void;
}

export function useStudentMastery<T = SubjectMasteryDoc>(
  userId?: string | null,
  subjectId?: string | null
): UseStudentMasteryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(userId && subjectId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !subjectId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Targeted listener on users/{userId}/mastery/{subjectId}
    const unsubscribe = listenToStudentMastery(
      userId,
      subjectId,
      (docData) => {
        setData(docData as unknown as T);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    // Auto-cleanup listener on unmount or dependency change
    return () => {
      unsubscribe();
    };
  }, [userId, subjectId]);

  // Optimistic concept update
  const updateConcept = useCallback(
    async (conceptId: string, partial: Partial<MasteryRecord>) => {
      if (!userId || !subjectId) return;

      // Optimistic update of local state
      setData((prev) => {
        if (!prev) return prev;
        const currentDoc = prev as unknown as SubjectMasteryDoc;
        const existingConcepts = currentDoc.concepts || {};
        const existingConcept = existingConcepts[conceptId] || {
          conceptId,
          masteryScore: 0,
          status: "NOT_STARTED",
          consecutiveCorrect: 0,
          totalAttempts: 0,
          lastAttemptedAt: null,
        };

        const updated: SubjectMasteryDoc = {
          ...currentDoc,
          concepts: {
            ...existingConcepts,
            [conceptId]: {
              ...existingConcept,
              ...partial,
            },
          },
          lastUpdated: new Date().toISOString(),
        };
        return updated as unknown as T;
      });

      try {
        await updateConceptMasteryRecord(userId, subjectId, conceptId, partial);
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error(String(err)));
        // listener will revert on next snapshot if write failed
      }
    },
    [userId, subjectId]
  );

  const updateMastery = useCallback(
    async (partial: Partial<SubjectMasteryDoc>) => {
      if (!userId || !subjectId) return;
      try {
        await saveSubjectMastery(userId, subjectId, partial);
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [userId, subjectId]
  );

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  return {
    data,
    loading,
    error,
    updateConcept,
    updateMastery,
    refresh,
  };
}
