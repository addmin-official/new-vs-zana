import { useState, useEffect, useRef, useCallback } from "react";
import {
  StudyRoomData,
  RoomParticipant,
  RoomCheer,
  FocusStatus,
} from "../server/rooms/StudyRoomTypes.ts";
import {
  fetchStudyRoom,
  joinStudyRoom,
  leaveStudyRoom,
  sendStudyHeartbeat,
  sendStudyCheer,
} from "../services/studyRoomApi.ts";
import { StudentProfile } from "../services/storage.ts";

export interface UseStudyRoomReturn {
  room: StudyRoomData | null;
  isLoading: boolean;
  error: string | null;
  focusMinutes: number;
  focusSeconds: number;
  isTimerRunning: boolean;
  status: FocusStatus;
  currentConcept: string;
  goal: string;
  recentCheers: RoomCheer[];
  incomingCheer: RoomCheer | null;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setStatus: (status: FocusStatus) => void;
  setCurrentConcept: (concept: string) => void;
  setGoal: (goal: string) => void;
  cheerClassmate: (classmate: RoomParticipant, message?: string, emoji?: string) => Promise<boolean>;
  refreshRoom: () => Promise<void>;
  dismissIncomingCheer: () => void;
}

export function useStudyRoom(roomId: string | null, profile: StudentProfile): UseStudyRoomReturn {
  const [room, setRoom] = useState<StudyRoomData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Focus Timer state (counts up or tracks duration)
  const [focusSeconds, setFocusSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [status, setStatusState] = useState<FocusStatus>("deep_focus");
  const [currentConcept, setCurrentConceptState] = useState<string>("");
  const [goal, setGoalState] = useState<string>("");
  const [incomingCheer, setIncomingCheer] = useState<RoomCheer | null>(null);

  const studentIdRef = useRef<string>(profile.id || `student_${profile.name || "anon"}`);
  const lastCheerIdRef = useRef<string | null>(null);

  // Initialize and join room
  useEffect(() => {
    let isMounted = true;

    if (!roomId) {
      return () => {
        isMounted = false;
      };
    }

    const studentId = studentIdRef.current;
    const initialConcept = currentConcept || "";

    const join = async () => {
      try {
        const roomData = await joinStudyRoom(roomId, {
          id: studentId,
          name: profile.name || "قوتابی",
          grade: profile.grade || "12",
          currentConcept: initialConcept,
          status: "deep_focus",
        });
        if (!isMounted) return;
        setRoom(roomData);
        if (!currentConcept && roomData.featuredConcept) {
          setCurrentConceptState(roomData.featuredConcept);
        }
        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to join study room:", err);
        setError("نەتوانرا پەیوەندی بە ژووری خوێندنەوە بکرێت.");
        setIsLoading(false);
      }
    };

    void join();

    return () => {
      isMounted = false;
      leaveStudyRoom(roomId, studentId).catch(() => {});
    };
  }, [roomId, profile.name, profile.grade, currentConcept]);

  // Focus timer tick (increments every second when running)
  useEffect(() => {
    if (!isTimerRunning) return;

    const timer = setInterval(() => {
      setFocusSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const focusMinutes = Math.floor(focusSeconds / 60);

  // Heartbeat & Room Poll interval (every 15 seconds)
  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(async () => {
      try {
        const studentId = studentIdRef.current;
        const updated = await sendStudyHeartbeat(roomId, {
          studentId,
          currentConcept,
          focusMinutes: Math.floor(focusSeconds / 60),
          status,
          goal,
        });

        setRoom(updated);

        // Check for new cheers sent to me or the room
        if (updated.cheers.length > 0) {
          const latest = updated.cheers[updated.cheers.length - 1];
          if (latest.id !== lastCheerIdRef.current) {
            lastCheerIdRef.current = latest.id;
            if (latest.toId === studentId || latest.fromId !== studentId) {
              setIncomingCheer(latest);
            }
          }
        }
      } catch (err) {
        console.warn("Study room heartbeat warning:", err);
      }
    }, 15_000);

    return () => clearInterval(interval);
  }, [roomId, currentConcept, focusSeconds, status, goal]);

  const startTimer = useCallback(() => setIsTimerRunning(true), []);
  const pauseTimer = useCallback(() => setIsTimerRunning(false), []);
  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setFocusSeconds(0);
  }, []);

  const setStatus = useCallback((newStatus: FocusStatus) => {
    setStatusState(newStatus);
    if (roomId) {
      sendStudyHeartbeat(roomId, {
        studentId: studentIdRef.current,
        status: newStatus,
      }).catch(() => {});
    }
  }, [roomId]);

  const setCurrentConcept = useCallback((concept: string) => {
    setCurrentConceptState(concept);
    if (roomId) {
      sendStudyHeartbeat(roomId, {
        studentId: studentIdRef.current,
        currentConcept: concept,
      }).catch(() => {});
    }
  }, [roomId]);

  const setGoal = useCallback((newGoal: string) => {
    setGoalState(newGoal);
    if (roomId) {
      sendStudyHeartbeat(roomId, {
        studentId: studentIdRef.current,
        goal: newGoal,
      }).catch(() => {});
    }
  }, [roomId]);

  const cheerClassmate = useCallback(
    async (classmate: RoomParticipant, message = "دەستخۆش! بەردەوام بە لەسەر سەرکەوتن ✨", emoji = "👏") => {
      if (!roomId) return false;
      try {
        const cheer = await sendStudyCheer(roomId, {
          fromId: studentIdRef.current,
          fromName: profile.name || "هاوپۆل",
          toId: classmate.id,
          toName: classmate.name,
          message,
          emoji,
        });
        setRoom((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            cheers: [...prev.cheers, cheer],
          };
        });
        return true;
      } catch (e) {
        console.error("Failed to cheer classmate:", e);
        return false;
      }
    },
    [roomId, profile.name]
  );

  const refreshRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const fresh = await fetchStudyRoom(roomId);
      setRoom(fresh);
    } catch (e) {
      console.warn("Failed to refresh room:", e);
    }
  }, [roomId]);

  const dismissIncomingCheer = useCallback(() => {
    setIncomingCheer(null);
  }, []);

  return {
    room,
    isLoading,
    error,
    focusMinutes,
    focusSeconds,
    isTimerRunning,
    status,
    currentConcept,
    goal,
    recentCheers: room?.cheers || [],
    incomingCheer,
    startTimer,
    pauseTimer,
    resetTimer,
    setStatus,
    setCurrentConcept,
    setGoal,
    cheerClassmate,
    refreshRoom,
    dismissIncomingCheer,
  };
}
