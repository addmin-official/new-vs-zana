/**
 * Typed React hook for real-time study sessions history with targeted queries and pagination limit.
 */

import { useState, useEffect, useCallback } from "react";
import { StudySessionDoc } from "../firebase/types.ts";
import { listenToRecentSessions, recordStudySession } from "../firebase/firestore.ts";

export interface UseSessionHistoryResult<T = StudySessionDoc> {
  sessions: T[];
  loading: boolean;
  error: Error | null;
  addSession: (session: Omit<StudySessionDoc, "id" | "userId">) => Promise<string>;
}

export function useSessionHistory<T = StudySessionDoc>(
  userId?: string | null,
  limitCount = 20
): UseSessionHistoryResult<T> {
  const [sessions, setSessions] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(userId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Filtered by userId on users/{userId}/sessions, ordered by startTime desc
    const unsubscribe = listenToRecentSessions(
      userId,
      limitCount,
      (docs) => {
        setSessions(docs as unknown as T[]);
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
  }, [userId, limitCount]);

  const addSession = useCallback(
    async (session: Omit<StudySessionDoc, "id" | "userId">): Promise<string> => {
      if (!userId) throw new Error("userId is required to record study session");
      return recordStudySession(userId, session);
    },
    [userId]
  );

  return {
    sessions,
    loading,
    error,
    addSession,
  };
}
