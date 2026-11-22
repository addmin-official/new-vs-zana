import { useSyncExternalStore } from "react";
import {
  FALLBACK_CHEMISTRY_CHAPTERS,
  FALLBACK_PHYSICS_CHAPTERS,
  FALLBACK_MATH_CHAPTERS,
  FALLBACK_ENGLISH_CHAPTERS,
  ChapterOutlineItem,
} from "../features/chat/ChatSidebar.tsx";
import { syncStudentProgressToFirestore } from "../features/student/studentStorage.ts";
import { fetchWithFallback } from "../lib/apiClient.ts";
import { ZanaStorage, ChatMessage } from "../services/storage.ts";
import { getClientToken } from "../services/authService.ts";
export type { ChatMessage };

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  grade: string;
  stream: "scientific" | "literary" | "general";
  activeSubject?: string;
  streakDays?: number;
  completedLessons?: number;
  totalScore?: number;
}

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

export type UserRole = "student" | "teacher" | "parent" | "admin";

export interface AppState {
  user: UserProfile;
  userRole: UserRole;
  chapters: ChapterOutlineItem[];
  activeChapter: number | null;
  chatMessages: ChatMessage[];
  isLoading: boolean;
  isTrialExpired: boolean;
  notifications: ToastItem[];
  userProgress: {
    streak: number;
    lessonsCompleted: number;
    totalScore: number;
  };

  // Actions
  setUser: (user: UserProfile) => void;
  setUserRole: (role: UserRole) => void;
  fetchChapters: (subjectOverride?: string) => Promise<void>;
  setActiveSubject: (subject: string) => void;
  setActiveChapter: (id: number | null) => void;
  addChatMessage: (message: ChatMessage) => void;
  sendChatMessage: (content: string, chapterId?: number) => Promise<void>;
  setIsTrialExpired: (expired: boolean) => void;
  addNotification: (type: ToastItem["type"], message: string) => void;
  removeNotification: (id: string) => void;
  fetchUserProgress: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => void;
  updateUserProgress: (progress: Partial<{ streak: number; lessonsCompleted: number; totalScore: number }>) => void;
  addProgressScore: (points: number, lessonIncrement?: number) => void;
  clearChatHistory: () => void;
  logout: () => void;
}

const DEFAULT_USER: UserProfile = {
  id: "default-guest",
  name: "قوتابی",
  email: "",
  avatar: "",
  grade: "12",
  stream: "scientific",
  streakDays: 1,
  completedLessons: 0,
  totalScore: 0,
};

export function getLessonChatKey(subject: string, chapterId: number | string | null): string {
  const normSubj = (subject || "chemistry").toLowerCase().trim();
  const ch = chapterId || 1;
  return `${normSubj}_ch${ch}`;
}

export function loadLessonChatMessages(
  subject: string,
  chapterId: number | string | null,
  chapterTitle?: string
): ChatMessage[] {
  const key = getLessonChatKey(subject, chapterId);
  const stored = ZanaStorage.getChatMessages(key);
  if (stored && stored.length > 0) {
    return stored;
  }
  const ch = chapterId || 1;
  const title = chapterTitle || `بەندی ${ch}`;
  const initialWelcome: ChatMessage[] = [
    {
      id: `welcome-${key}`,
      sender: "zana",
      content: `سڵاو! من **مامۆستا زانا**م، هاوڕێی زیرەکی تۆ بۆ فێربوونی وانەکان بە شێوازی سوقراتی و پرسیارکردن.\nبەخێربێیت بۆ وانەی **«${title}»**. چ پرسیارێک یان ڕوونکردنەوەیەکت لەسەر ئەم بەندە هەیە تا پێکەوە شیکاری بکەین؟`,
      timestamp: new Date().toLocaleTimeString("ku-IQ", { hour: "2-digit", minute: "2-digit" }),
      chapterId: ch,
    },
  ];
  ZanaStorage.saveChatMessages(key, initialWelcome);
  return initialWelcome;
}

function loadStoredState(): Partial<AppState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("zana_app_store_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.user?.name === "ئامەد کاروان" && parsed.user?.email === "amed.karwan@example.com") {
        delete parsed.user;
      }
      if (parsed.userProgress?.totalScore === 1250 && parsed.userProgress?.lessonsCompleted === 24) {
        delete parsed.userProgress;
      }
      return parsed;
    }
  } catch {
    // fallback
  }
  return {};
}

function saveStoredState(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      "zana_app_store_v1",
      JSON.stringify({
        user: state.user,
        activeChapter: state.activeChapter,
        userProgress: state.userProgress,
      })
    );
  } catch {
    // ignore
  }
}

const stored = loadStoredState();
const initialSubj = stored.user?.activeSubject || "chemistry";
const initialCh = stored.activeChapter || 1;
const initialMsgs = loadLessonChatMessages(initialSubj, initialCh);

let currentState: AppState = {
  user: stored.user || DEFAULT_USER,
  userRole:
    (typeof window !== "undefined" &&
      (localStorage.getItem("zana_user_role") as UserRole)) ||
    "student",
  chapters: FALLBACK_CHEMISTRY_CHAPTERS,
  activeChapter: initialCh,
  chatMessages: initialMsgs,
  isLoading: false,
  isTrialExpired: false,
  notifications: [],
  userProgress: stored.userProgress || {
    streak: 1,
    lessonsCompleted: 0,
    totalScore: 0,
  },

  setUser: (user) => {
    setState({ user });
  },

  setUserRole: (role: UserRole) => {
    setState({ userRole: role });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("zana_user_role", role);
      } catch {}
    }
  },

  fetchChapters: async (subjectOverride?: string) => {
    setState({ isLoading: true });
    const targetSubject = (subjectOverride || currentState.user.activeSubject || "chemistry").toLowerCase();
    const fallback =
      targetSubject === "physics"
        ? FALLBACK_PHYSICS_CHAPTERS
        : targetSubject === "math" || targetSubject === "mathematics"
        ? FALLBACK_MATH_CHAPTERS
        : targetSubject === "english"
        ? FALLBACK_ENGLISH_CHAPTERS
        : FALLBACK_CHEMISTRY_CHAPTERS;

    try {
      const grade = currentState.user.grade || "12";
      const res = await fetchWithFallback(`/api/curriculum/${encodeURIComponent(targetSubject)}/${encodeURIComponent(grade)}/outline`, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const currentActive = currentState.activeChapter;
          const chapterExists = data.some((c: ChapterOutlineItem) => c.id === currentActive);
          const nextActiveId = chapterExists ? currentActive : (data[0]?.id || 1);
          const activeChObj = data.find((c: ChapterOutlineItem) => c.id === nextActiveId) || data[0];
          const newMsgs = loadLessonChatMessages(targetSubject, nextActiveId, activeChObj?.title);

          setState({
            chapters: data,
            activeChapter: nextActiveId,
            chatMessages: newMsgs,
            isLoading: false,
          });
          return;
        }
      }
    } catch {
      // fallback
    }
    const nextActiveId = fallback[0]?.id || 1;
    const newMsgs = loadLessonChatMessages(targetSubject, nextActiveId, fallback[0]?.title);
    setState({
      chapters: fallback,
      activeChapter: nextActiveId,
      chatMessages: newMsgs,
      isLoading: false,
    });
  },

  setActiveSubject: (subject: string) => {
    const norm = subject.toLowerCase();
    // Save current lesson chat before switching subject
    const curSubj = currentState.user.activeSubject || "chemistry";
    const curCh = currentState.activeChapter || 1;
    const prevKey = getLessonChatKey(curSubj, curCh);
    ZanaStorage.saveChatMessages(prevKey, currentState.chatMessages);

    // Load the selected subject's chapter 1 messages for true chat isolation
    const newMsgs = loadLessonChatMessages(norm, 1);

    setState({
      user: { ...currentState.user, activeSubject: norm },
      activeChapter: 1,
      chatMessages: newMsgs,
    });
    void currentState.fetchChapters(norm);
  },

  setActiveChapter: (id) => {
    if (id === null) return;
    // Save current lesson chat before switching chapter
    const curSubj = currentState.user.activeSubject || "chemistry";
    const curCh = currentState.activeChapter || 1;
    const prevKey = getLessonChatKey(curSubj, curCh);
    ZanaStorage.saveChatMessages(prevKey, currentState.chatMessages);

    // Load lesson-specific chat for newly selected chapter
    const targetChapter = currentState.chapters.find((c) => c.id === id);
    const newMsgs = loadLessonChatMessages(curSubj, id, targetChapter?.title);

    setState({ activeChapter: id, chatMessages: newMsgs });
  },

  addChatMessage: (msg) => {
    const newMsgs = [...currentState.chatMessages, msg];
    const curSubj = currentState.user.activeSubject || "chemistry";
    const curCh = currentState.activeChapter || 1;
    ZanaStorage.saveChatMessages(getLessonChatKey(curSubj, curCh), newMsgs);
    setState({ chatMessages: newMsgs });
  },

  sendChatMessage: async (content: string, chapterId?: number) => {
    if (!content.trim()) return;

    const activeCh = currentState.chapters.find((c) => c.id === (chapterId || currentState.activeChapter)) || currentState.chapters[0];
    const currentSubj = currentState.user.activeSubject || "chemistry";
    const currentKey = getLessonChatKey(currentSubj, activeCh.id);

    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      sender: "user",
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString("ku-IQ", { hour: "2-digit", minute: "2-digit" }),
      chapterId: activeCh.id,
    };

    const newMsgs = [...currentState.chatMessages, userMsg];
    setState({ chatMessages: newMsgs, isLoading: true });
    ZanaStorage.saveChatMessages(currentKey, newMsgs);

    try {
      let currentSubject = currentSubj;
      // Detect subject from content if not explicitly fixed
      if (/(?:فیزیا|فیزیک|خولاو|کێشکردن|لەرینەوە|شەپۆل|ئاوێنە|هاوێنە|دەستێوەردان|کۆڵۆم|کارەبایی|توانست|بەرگری|ئۆم|کیرشۆف|موگناتیسی|فارادای|لێنز)/i.test(content)) {
        currentSubject = "physics";
      } else if (/(?:بیرکاری|جیاکاری|تەواوکاری|داتاشراو|ئامانج|ڕادە|سنوور|بڕگەی هاوتا|قووچەکی|ژمارەی ئاوێتە|لێژبوونی)/i.test(content)) {
        currentSubject = "math";
      } else if (/(?:ئینگلیزی|sunrise|english|grammar|passive|relative clause|conditional|participle|treasure island|stevenson|silver)/i.test(content)) {
        currentSubject = "english";
      }

      const subjCode = currentSubject === "physics" ? "phys" : currentSubject === "math" ? "math" : currentSubject === "english" ? "eng" : "chem";
      const token = await getClientToken().catch(() => null);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetchWithFallback("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: content,
          profile: {
            name: currentState.user.name,
            grade: currentState.user.grade,
            activeSubject: currentSubject,
            stream: currentState.user.stream,
          },
          academicContext: {
            lessonTitle: `بەندی ${activeCh.id}: ${activeCh.title}`,
            conceptTitle: activeCh.title,
            curriculumId: `krd-${subjCode}-g${currentState.user.grade}-ch${activeCh.id}`,
          },
        }),
      });

      if (res.status === 403) {
        const errJson = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        if (errJson?.error === "TRIAL_EXPIRED") {
          setState({ isTrialExpired: true, isLoading: false });
          const trialMsg: ChatMessage = {
            id: "zana-trial-" + Date.now(),
            sender: "zana",
            content: "تاقیکردنەوەی ٣ ڕۆژەکەت بەسەرچوو. بۆ بەردەوامبوون لە فێربوون لەگەڵ زانا، تکایە بەشداری بکە.",
            timestamp: new Date().toLocaleTimeString("ku-IQ", { hour: "2-digit", minute: "2-digit" }),
            chapterId: activeCh.id,
          };
          const updatedMsgs = [...newMsgs, trialMsg];
          setState({ chatMessages: updatedMsgs, isLoading: false });
          ZanaStorage.saveChatMessages(currentKey, updatedMsgs);
          throw new Error("TRIAL_EXPIRED");
        }
      }

      if (res.ok) {
        const data = (await res.json()) as { text?: string; reply?: string };
        const zanaReply = data.text || data.reply || "زۆر باشە! با پێکەوە لێکۆڵینەوە لەم چەمکە بکەین.";
        const zanaMsg: ChatMessage = {
          id: "zana-" + Date.now(),
          sender: "zana",
          content: zanaReply,
          timestamp: new Date().toLocaleTimeString("ku-IQ", { hour: "2-digit", minute: "2-digit" }),
          chapterId: activeCh.id,
        };
        const updatedMsgs = [...newMsgs, zanaMsg];
        setState({ chatMessages: updatedMsgs, isLoading: false });
        ZanaStorage.saveChatMessages(currentKey, updatedMsgs);
      } else {
        const errBody = await res.text().catch(() => "");
        throw new Error(`HTTP error ${res.status}: ${errBody}`);
      }
    } catch (err: unknown) {
      if ((err as Error)?.message === "TRIAL_EXPIRED") {
        setState({ isTrialExpired: true, isLoading: false });
        throw err;
      }
      console.error("[sendChatMessage Network Error]", err);
      const fallbackMsg: ChatMessage = {
        id: "zana-err-" + Date.now(),
        sender: "zana",
        content: "ببوورە، کێشەیەک لە پەیوەندی بە سێرڤەری زانا ڕوویدا. تکایە دڵنیابەرەوە لە پەیوەندیی ئینتەرنێت و دووبارە پرسیارەکەت بنووسەرەوە.",
        timestamp: new Date().toLocaleTimeString("ku-IQ", { hour: "2-digit", minute: "2-digit" }),
        chapterId: activeCh.id,
      };
      const fallbackMsgs = [...newMsgs, fallbackMsg];
      setState({ chatMessages: fallbackMsgs, isLoading: false });
      ZanaStorage.saveChatMessages(currentKey, fallbackMsgs);
    }
  },

  setIsTrialExpired: (expired: boolean) => {
    setState({ isTrialExpired: expired });
  },

  addNotification: (type, message) => {
    const id = "toast-" + Date.now() + Math.random().toString(36).substring(2, 6);
    const item: ToastItem = { id, type, message, duration: 4000 };
    setState({ notifications: [...currentState.notifications, item] });
  },

  removeNotification: (id) => {
    setState({
      notifications: currentState.notifications.filter((n) => n.id !== id),
    });
  },

  fetchUserProgress: async () => {
    try {
      const res = await fetchWithFallback("/api/learning/mastery", { method: "GET" });
      if (res.ok) {
        const data = (await res.json()) as { streak?: number; completedLessons?: number; totalScore?: number } | null;
        if (data) {
          setState({
            userProgress: {
              streak: data.streak || currentState.userProgress.streak,
              lessonsCompleted: data.completedLessons || currentState.userProgress.lessonsCompleted,
              totalScore: data.totalScore || currentState.userProgress.totalScore,
            },
          });
        }
      }
    } catch {
      // ignore
    }
  },

  updateProfile: (data) => {
    const updated = { ...currentState.user, ...data };
    setState({ user: updated });
    currentState.addNotification("success", "زانیارییەکانی پرۆفایل نوێکرانەوە.");
  },

  updateUserProgress: (progress) => {
    const updatedProgress = {
      ...currentState.userProgress,
      ...progress,
    };
    setState({
      userProgress: updatedProgress,
      user: {
        ...currentState.user,
        streakDays: updatedProgress.streak,
        completedLessons: updatedProgress.lessonsCompleted,
        totalScore: updatedProgress.totalScore,
      },
    });
    void syncStudentProgressToFirestore({
      streak: updatedProgress.streak,
      completedLessons: updatedProgress.lessonsCompleted,
      totalScore: updatedProgress.totalScore,
    });
  },

  addProgressScore: (points, lessonIncrement = 0) => {
    const cur = currentState.userProgress;
    const newScore = (cur.totalScore || 0) + points;
    const newLessons = (cur.lessonsCompleted || 0) + lessonIncrement;
    const updatedProgress = {
      ...cur,
      totalScore: newScore,
      lessonsCompleted: newLessons,
    };
    setState({
      userProgress: updatedProgress,
      user: {
        ...currentState.user,
        totalScore: newScore,
        completedLessons: newLessons,
      },
    });
    void syncStudentProgressToFirestore({
      totalScore: newScore,
      completedLessons: newLessons,
    });
  },

  clearChatHistory: () => {
    const curSubj = currentState.user.activeSubject || "chemistry";
    const curCh = currentState.activeChapter || 1;
    const key = getLessonChatKey(curSubj, curCh);
    ZanaStorage.clearChatMessages(key);
    const targetChapter = currentState.chapters.find((c) => c.id === curCh);
    const freshMsgs = loadLessonChatMessages(curSubj, curCh, targetChapter?.title);
    setState({ chatMessages: freshMsgs });
    currentState.addNotification("info", "مێژووی گفتوگۆی ئەم وانەیە پاککرایەوە.");
  },

  logout: () => {
    const initialMsgs = loadLessonChatMessages("chemistry", 1);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("zana_user_role");
        localStorage.removeItem("zana_app_store_v1");
        const keysToRemove = Object.keys(localStorage).filter(
          (k) =>
            k.startsWith("zana_mastery_") ||
            k.startsWith("zana_studypath_") ||
            k.startsWith("zana_notifications_") ||
            k.startsWith("zana_weak_concepts_") ||
            k.startsWith("zana_chat_messages_") ||
            k.startsWith("zana_session_resume_")
        );
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {}
    }
    setState({
      chatMessages: initialMsgs,
      user: { ...DEFAULT_USER, name: "قوتابی میوان" },
      userRole: "student",
      userProgress: {
        streak: 1,
        lessonsCompleted: 0,
        totalScore: 0,
      },
    });
    currentState.addNotification("info", "لە سیستەم چوویتە دەرەوە.");
  },
};

const listeners = new Set<() => void>();

function setState(partial: Partial<AppState>) {
  currentState = { ...currentState, ...partial };
  saveStoredState(currentState);
  listeners.forEach((listener) => listener());
}

export function useAppStore<T>(selector?: (state: AppState) => T): T {
  const state = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => currentState,
    () => currentState
  );
  return selector ? selector(state) : (state as unknown as T);
}

useAppStore.getState = () => currentState;
useAppStore.setState = setState;

export default useAppStore;
