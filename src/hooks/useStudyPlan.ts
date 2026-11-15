/**
 * Typed React hook for real-time student study plan data access.
 */

import { useState, useEffect, useCallback } from "react";
import { StudyPlanDoc, PlanDayItem } from "../firebase/types.ts";
import { listenToStudyPlan, getActiveDb, getStudyPlanDocRef } from "../firebase/firestore.ts";
import { setDoc } from "firebase/firestore";

export interface UseStudyPlanResult<T = StudyPlanDoc> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  markItemCompleted: (dayOfWeek: string, itemId: string, completed: boolean) => Promise<void>;
  updateDays: (days: Record<string, PlanDayItem[]>) => Promise<void>;
}

export function useStudyPlan<T = StudyPlanDoc>(
  userId?: string | null,
  weekId?: string | null
): UseStudyPlanResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(userId && weekId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !weekId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Targeted listener on users/{userId}/studyPlan/{weekId}
    const unsubscribe = listenToStudyPlan(
      userId,
      weekId,
      (docData) => {
        setData(docData as unknown as T);
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
  }, [userId, weekId]);

  const markItemCompleted = useCallback(
    async (dayOfWeek: string, itemId: string, completed: boolean) => {
      if (!userId || !weekId) return;

      // Optimistic local update
      setData((prev) => {
        if (!prev) return prev;
        const currentDoc = prev as unknown as StudyPlanDoc;
        const currentDays = currentDoc.days || {};
        const dayItems = currentDays[dayOfWeek] || [];
        const updatedItems = dayItems.map((item) =>
          item.id === itemId ? { ...item, completed } : item
        );

        let totalItems = 0;
        let completedItems = 0;
        const newDays = { ...currentDays, [dayOfWeek]: updatedItems };
        for (const list of Object.values(newDays)) {
          totalItems += list.length;
          completedItems += list.filter((i) => i.completed).length;
        }

        const completionRate = totalItems > 0 ? completedItems / totalItems : 0;
        const updated: StudyPlanDoc = {
          ...currentDoc,
          days: newDays,
          completionRate,
        };
        return updated as unknown as T;
      });

      try {
        const db = getActiveDb();
        if (db) {
          const docRef = getStudyPlanDocRef(db, userId, weekId);
          const currentPlan = data as unknown as StudyPlanDoc;
          if (currentPlan) {
            await setDoc(docRef, currentPlan, { merge: true });
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [userId, weekId, data]
  );

  const updateDays = useCallback(
    async (days: Record<string, PlanDayItem[]>) => {
      if (!userId || !weekId) return;
      try {
        const db = getActiveDb();
        if (db) {
          const docRef = getStudyPlanDocRef(db, userId, weekId);
          await setDoc(
            docRef,
            {
              weekId,
              userId,
              days,
              generated: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [userId, weekId]
  );

  return {
    data,
    loading,
    error,
    markItemCompleted,
    updateDays,
  };
}
