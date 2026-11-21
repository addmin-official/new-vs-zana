import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Send,
  BookOpen,
  Sparkles,
  ChevronDown,
  Camera,
  HelpCircle,
  Award,
  Zap,
  FileText,
  Lightbulb,
  // New imports for added features
  MessageSquare,
  BookMarked,
  Brain,
  Check,
  CheckCircle2,
  ArrowLeft,
  Search,
  Copy,
  Mic,
  Square,
  RotateCcw,
  ArrowLeftRight,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ChapterSidebar } from "../components/ChapterSidebar.tsx";
import { ChatBubble } from "../components/ChatBubble.tsx";
import { Spinner } from "../components/Spinner.tsx";
import { Modal } from "../components/Modal.tsx";
import { SubscriptionModal } from "../components/SubscriptionModal.tsx";
import { useAppStore } from "../store/appStore.ts";
import { useSoundEffects } from "../hooks/useSoundEffects.ts";
import { useTranslation } from "../hooks/useTranslation.ts";
import { ku } from "../i18n/translations.ts";
import { getFirestoreDb } from "../services/firebase.ts";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useStudentMastery } from "../learning/hooks/useStudentMastery.ts";
import { DifficultyLevel } from "../learning/domain/MasteryTypes.ts";

interface DynamicBookViewerProps {
  subject: string;
  stream?: string;
  onSelectTopicForStudy: (title: string, pages: string) => void;
  onNavigateToChat: () => void;
}

const DynamicBookViewer: React.FC<DynamicBookViewerProps> = ({
  subject,
  stream,
  onSelectTopicForStudy,
  onNavigateToChat,
}) => {
  const ViewerComponent = useMemo(() => {
    return React.lazy(() => {
      switch (subject) {
        case "physics":
          return import("../components/Grade12PhysicsBookViewer.tsx").then((m) => ({
            default: m.Grade12PhysicsBookViewer,
          }));
        case "math":
        case "mathematics":
          if (stream === "literary") {
            return import("../components/Grade12LiteraryMathBookViewer.tsx").then((m) => ({
              default: m.Grade12LiteraryMathBookViewer,
            }));
          }
          return import("../components/Grade12MathBookViewer.tsx").then((m) => ({
            default: m.Grade12MathBookViewer,
          }));
        case "kurdish":
          return import("../components/Grade12KurdishBookViewer.tsx").then((m) => ({
            default: m.Grade12KurdishBookViewer,
          }));
        case "arabic":
          return import("../components/Grade12ArabicBookViewer.tsx").then((m) => ({
            default: m.Grade12ArabicBookViewer,
          }));
        case "history":
          return import("../components/Grade12HistoryBookViewer.tsx").then((m) => ({
            default: m.Grade12HistoryBookViewer,
          }));
        case "economy":
          return import("../components/Grade12EconomicsBookViewer.tsx").then((m) => ({
            default: m.Grade12EconomicsBookViewer,
          }));
        case "geography":
          return import("../components/Grade12GeographyBookViewer.tsx").then((m) => ({
            default: m.Grade12GeographyBookViewer,
          }));
        case "sports":
          return import("../components/Grade12SportsBookViewer.tsx").then((m) => ({
            default: m.Grade12SportsBookViewer,
          }));
        case "english":
          return import("../components/Grade12EnglishBookViewer.tsx").then((m) => ({
            default: m.Grade12EnglishBookViewer,
          }));
        case "chemistry":
        default:
          return import("../components/Grade12ChemistryBookViewer.tsx").then((m) => ({
            default: m.Grade12ChemistryBookViewer,
          }));
      }
    });
  }, [subject, stream]);

  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <Spinner size="lg" />
          <span className="font-sans text-xs text-slate-500 mt-3 font-bold">
            پەڕتووکی خوێندن باردەکرێت...
          </span>
        </div>
      }
    >
      <ViewerComponent
        onSelectTopicForStudy={onSelectTopicForStudy}
        onNavigateToChat={onNavigateToChat}
      />
    </React.Suspense>
  );
};
import { StudentProfile, SubjectKey } from "../features/student/studentTypes.ts";
import { getValidatedSubject } from "../features/student/studentDefaults.ts";
import { useServerHealth } from "../hooks/useServerHealth.ts";
import { useSpeechToText } from "../hooks/useSpeechToText.ts";
import { getChapterData } from "../data/curriculum/chapterDrills.ts";
import { VisionCapturePanel } from "../features/vision/VisionCapturePanel.tsx";

export type WorkspaceMode = "ask" | "socratic" | "explain" | "practice";

export interface ChatSessionMemory {
  conceptsDiscussed: string[];
  questionsAsked: string[];
  errorsMade: string[];
}

export const DEFAULT_SESSION_MEMORY: ChatSessionMemory = {
  conceptsDiscussed: [],
  questionsAsked: [],
  errorsMade: [],
};

// ─── Feature 1 state types ───────────────────────────────────────────────────
type ViewMode = "tutor" | "workspace";

// ─── Feature 2 state types ───────────────────────────────────────────────────
type ActiveAction = "explain" | "practice" | "ask" | "vision" | "summary" | "formula" | "book";

export const CHAT_SUBJECT_META: Record<string, { label: string; icon: string }> = {
  chemistry: { label: "کیمیا", icon: "⚗️" },
  physics: { label: "فیزیا", icon: "⚡" },
  math: { label: "بیرکاری", icon: "📐" },
  biology: { label: "زیندەزانی", icon: "🧬" },
  english: { label: "ئینگلیزی", icon: "📖" },
  kurdish: { label: "زمان و ئەدەبی کوردی", icon: "📚" },
  arabic: { label: "زمانی عەرەبی", icon: "📜" },
  sports: { label: "پەروەردەی وەرزشی", icon: "⚽" },
  history: { label: "مێژوو", icon: "🏛️" },
  economy: { label: "ئابووری", icon: "📊" },
  geography: { label: "جوگرافیا", icon: "🌍" },
};

export interface ChatProps {
  profile?: StudentProfile;
  onSelectSubject?: (subject: SubjectKey) => void;
  onNavigateToSubjects?: () => void;
}

export function Chat({ profile, onSelectSubject, onNavigateToSubjects }: ChatProps = {}) {
  const { t: _t, formatNumber: _formatNumber } = useTranslation();
  const chapters = useAppStore((state) => state.chapters);
  const activeChapterId = useAppStore((state) => state.activeChapter);
  const setActiveChapter = useAppStore((state) => state.setActiveChapter);
  const chatMessages = useAppStore((state) => state.chatMessages);
  const sendChatMessage = useAppStore((state) => state.sendChatMessage);
  const isLoading = useAppStore((state) => state.isLoading);
  const fetchChapters = useAppStore((state) => state.fetchChapters);
  const setActiveSubject = useAppStore((state) => state.setActiveSubject);
  const user = useAppStore((state) => state.user);
  const clearChatHistory = useAppStore((state) => state.clearChatHistory);
  const isStoreTrialExpired = useAppStore((state) => state.isTrialExpired);
  const setIsStoreTrialExpired = useAppStore((state) => state.setIsTrialExpired);
  const { playSuccess, playError } = useSoundEffects();

  const [isTrialExpired, setIsTrialExpired] = useState(isStoreTrialExpired);

  useEffect(() => {
    if (isStoreTrialExpired) {
      setIsTrialExpired(true);
    }
  }, [isStoreTrialExpired]);

  const [currentMode, setCurrentMode] = useState<WorkspaceMode>("ask");
  const [inputContent, setInputContent] = useState("");
  const [mobileChapterDrawer, setMobileChapterDrawer] = useState(false);
  const [isChapterSidebarOpen, setIsChapterSidebarOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // ─── Feature 1: Dual View Switcher ────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("tutor");

  // ─── Feature 2: Workspace Action Tabs ─────────────────────────────────────
  const [activeAction, setActiveAction] = useState<ActiveAction>("explain");
  const [formulaSubject, setFormulaSubject] = useState<"all" | "chemistry" | "physics" | "math">("all");
  const [formulaSearch, setFormulaSearch] = useState("");
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);

  // Camera Question Solver state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [_cameraImagePreview, setCameraImagePreview] = useState<string | null>(null);
  const [recognizedQuestion, setRecognizedQuestion] = useState("");
  const [_isOcrProcessing, setIsOcrProcessing] = useState(false);

  // Practice Mode interactive drill state
  const [practiceStepIndex, setPracticeStepIndex] = useState(0);
  const [stepAnswerInput, setStepAnswerInput] = useState("");
  const [stepFeedback, setStepFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const serverHealth = useServerHealth(30000);

  // Progressive Hint Layer state
  const [hintLevel, setHintLevel] = useState(0);

  // Voice-to-Text Speech Recognition
  const [speechErrorToast, setSpeechErrorToast] = useState<string | null>(null);
  const {
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: _isSpeechSupported,
    error: _speechError,
  } = useSpeechToText({
    onResult: (text, isFinal) => {
      if (isFinal && text) {
        setInputContent((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${text.trim()}` : text.trim();
        });
        resetTranscript();
      }
    },
    onError: (err) => {
      setSpeechErrorToast(err);
      setTimeout(() => setSpeechErrorToast(null), 5000);
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSendTimeRef = useRef<number>(0);

  const handleChatScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    // User is near bottom if within 140px of the bottom
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 140;
  };

  const scrollToBottom = useCallback((smooth = true) => {
    if (!chatScrollContainerRef.current) return;
    const container = chatScrollContainerRef.current;
    if (typeof container.scrollTo === "function") {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // ─── Socratic Mode State ──────────────────────────────────────────────────
  const [socraticChainCount, setSocraticChainCount] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);

  // ─── Student Mastery & Diagnostic Insights ────────────────────────────────
  const studentId = user?.id || profile?.id || "guest_student";
  const { profile: masteryProfile, recordAttempt } = useStudentMastery(studentId);

  // Detect Mastery Gaps from Student Profile
  const masteryGaps = useMemo(() => {
    if (!masteryProfile?.conceptMasteries) return [];
    return Object.values(masteryProfile.conceptMasteries)
      .filter((c) => c.status === "NEEDS_REVIEW" || c.status === "DEVELOPING" || c.masteryScore < 0.6)
      .map((c) => c.conceptId);
  }, [masteryProfile]);

  // ─── Session Memory (Concepts Discussed, Questions Asked, Errors Made) ────
  const [sessionMemory, setSessionMemory] = useState<ChatSessionMemory>(() => {
    try {
      const stored = sessionStorage.getItem("zana_chat_session_memory");
      if (stored) return JSON.parse(stored);
      const legacy = sessionStorage.getItem("zana_chat_session_concepts");
      if (legacy) return { ...DEFAULT_SESSION_MEMORY, conceptsDiscussed: JSON.parse(legacy) };
      return DEFAULT_SESSION_MEMORY;
    } catch {
      return DEFAULT_SESSION_MEMORY;
    }
  });

  const sessionConcepts = sessionMemory.conceptsDiscussed;

  const syncSessionToFirestore = async (mem: ChatSessionMemory) => {
    try {
      const db = getFirestoreDb();
      const studentUid = user?.id || profile?.id;
      if (db && studentUid) {
        await setDoc(
          doc(db, "students", studentUid, "sessions", "latest"),
          {
            conceptsDiscussed: mem.conceptsDiscussed,
            questionsAsked: mem.questionsAsked.slice(-10),
            errorsMade: mem.errorsMade.slice(-5),
            lastUpdated: new Date().toISOString(),
            activeSubject: currentSubject,
          },
          { merge: true }
        );
      }
    } catch {
      // Ignore offline/guest sync error
    }
  };

  const updateSessionMemory = (updater: (prev: ChatSessionMemory) => ChatSessionMemory) => {
    setSessionMemory((prev) => {
      const next = updater(prev);
      try {
        sessionStorage.setItem("zana_chat_session_memory", JSON.stringify(next));
        sessionStorage.setItem("zana_chat_session_concepts", JSON.stringify(next.conceptsDiscussed));
      } catch {}
      void syncSessionToFirestore(next);
      return next;
    });
  };

  // ─── Virtualization for Long Conversations (Last 30 messages) ─────────────
  const [showAllMessages, setShowAllMessages] = useState<boolean>(false);
  const displayedMessages = useMemo(() => {
    if (showAllMessages || chatMessages.length <= 30) return chatMessages;
    return chatMessages.slice(-30);
  }, [chatMessages, showAllMessages]);

  const latestAiMessageId = useMemo(() => {
    for (let i = chatMessages.length - 1; i >= 0; i--) {
      if (chatMessages[i].sender === "zana") return chatMessages[i].id;
    }
    return null;
  }, [chatMessages]);

  const [selectedSubject, setSelectedSubject] = useState<SubjectKey | null>(() => {
    return getValidatedSubject(user.activeSubject || profile?.activeSubject || "chemistry");
  });

  useEffect(() => {
    if (user.activeSubject) {
      setSelectedSubject(getValidatedSubject(user.activeSubject));
    } else if (profile?.activeSubject) {
      setSelectedSubject(getValidatedSubject(profile.activeSubject));
    }
  }, [user.activeSubject, profile?.activeSubject]);

  const currentSubject = (selectedSubject || user.activeSubject || profile?.activeSubject || "chemistry").toLowerCase();

  useEffect(() => {
    void fetchChapters(currentSubject);
  }, [currentSubject, fetchChapters]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(true);
    }
  }, [chatMessages, isLoading, currentMode, scrollToBottom]);

  // Handle mobile visualViewport resize & prevent window-level scroll displacement
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleViewportChange = () => {
      // Prevent entire browser window scroll displacement on mobile
      if (window.scrollY > 0) {
        window.scrollTo(0, 0);
      }
      if (isNearBottomRef.current && chatScrollContainerRef.current) {
        chatScrollContainerRef.current.scrollTo({
          top: chatScrollContainerRef.current.scrollHeight,
          behavior: "auto",
        });
      }
    };
    vv.addEventListener("resize", handleViewportChange);
    vv.addEventListener("scroll", handleViewportChange);
    return () => {
      vv.removeEventListener("resize", handleViewportChange);
      vv.removeEventListener("scroll", handleViewportChange);
    };
  }, []);

  const handleSwitchSubject = (subj: SubjectKey) => {
    setSelectedSubject(subj);
    setActiveSubject(subj);
    onSelectSubject?.(subj);
    void fetchChapters(subj);
  };

  const activeChapter = chapters.find((c) => c.id === activeChapterId) || chapters[0];

  // Track active chapter into session memory concepts
  useEffect(() => {
    if (activeChapter?.title && !sessionMemory.conceptsDiscussed.includes(activeChapter.title)) {
      updateSessionMemory((prev) => ({
        ...prev,
        conceptsDiscussed: [...prev.conceptsDiscussed, activeChapter.title],
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChapter?.title, sessionMemory.conceptsDiscussed]);

  const _isPhysics = currentSubject === "physics";
  const _isChemistry = currentSubject === "chemistry";
  const _isMath = currentSubject === "math" || currentSubject === "mathematics";

  const activeSubjectMeta = CHAT_SUBJECT_META[currentSubject] || { label: "کیمیا", icon: "⚗️" };
  const hasBook = true;
  const bookLabel = `پەڕتووکی ${activeSubjectMeta.label} 📖`;

  // ─── Smart Prompt Suggestions ─────────────────────────────────────────────
  // Dynamic generation based on: Current Concept + Student Level + Mastery Gaps
  const smartSuggestions = useMemo(() => {
    const chapterName = activeChapter?.title || "ئەم بەندە";
    const gradeLevel = user.grade || profile?.grade || "12";
    const weakTopic = masteryGaps.length > 0 ? masteryGaps[0] : null;

    if (currentSubject === "chemistry") {
      return [
        weakTopic
          ? `چۆن تێنەگەیشتن لە چەمکی «${weakTopic}» لە تاقیکردنەوەی وەزاریدا چارەسەر بکەم؟`
          : `چۆن پێوەری pH لە پرسیارەکانی وەزاریدا دەهێندرێتەوە؟`,
        `سەرەکیترین هەڵەی باوی قوتابیانی پۆلی ${gradeLevel} لە «${chapterName}» چییە؟`,
        `نموونەیەکی پراکتیکی لەسەر هاوکێشەی کاردانەوە شیبکەرەوە.`,
      ];
    } else if (currentSubject === "physics") {
      return [
        weakTopic
          ? `یاسا و کێشەی سەرەکی «${weakTopic}» بۆ من شیبکەرەوە.`
          : `یاسا سەرەکییەکانی «${chapterName}» لەگەڵ یەکەکانیان ڕوونبکەرەوە.`,
        `چۆن کێشەی تەوژم و ڤۆڵتیە لە تاقیکردنەوەی وەزاری پۆلی ${gradeLevel} شیبکەمەوە؟`,
        `نموونەیەکی شیکارکراوی هەنگاو بە هەنگاو بخەرەڕوو.`,
      ];
    } else if (currentSubject === "math" || currentSubject === "mathematics") {
      return [
        weakTopic
          ? `تەڵە و هەڵە باوەکانی تاقیکردنەوە لە «${weakTopic}» چین؟`
          : `هەنگاوەکانی دۆزینەوەی داتاشراو لە «${chapterName}» چین؟`,
        `چ ڕێگایەکی خێرا هەیە بۆ شیکارکردنی ئەم جۆرە هاوکێشانە لە پۆلی ${gradeLevel}؟`,
        `نموونەیەکی وەزاری لەگەڵ تەڵە بیرکارییەکان شیبکەرەوە.`,
      ];
    }
    return [
      weakTopic
        ? `پێداچوونەوەیەکی خێرا بە «${weakTopic}» بکەین؟`
        : `گرنگترین پێناسەکانی «${chapterName}» چین؟`,
      `پوختەی ئەم وانەیەی پۆلی ${gradeLevel} بە ٣ خاڵی سەرەکی دەستنیشان بکە.`,
      `چۆن خۆم بۆ تاقیکردنەوەی ئەم بەشە ئامادە بکەم؟`,
    ];
  }, [currentSubject, activeChapter?.title, masteryGaps, user.grade, profile?.grade]);

  // ─── Workspace action tabs config (Feature 2) ─────────────────────────────
  const workspaceActionTabs: { id: ActiveAction; label: string; icon: React.ElementType }[] = [
    { id: "explain", label: "ڕوونکردنەوە", icon: Sparkles },
    { id: "practice", label: "ڕاهێنان", icon: Award },
    { id: "ask", label: "پرسیار", icon: HelpCircle },
    { id: "vision", label: "وێنەی پرسیار", icon: Camera },
    { id: "summary", label: "پوختە", icon: FileText },
    { id: "formula", label: "یاساکان", icon: Brain },
    ...(hasBook
      ? [{ id: "book" as ActiveAction, label: bookLabel, icon: BookOpen }]
      : []),
  ];

  const handleSend = async (customPrompt?: string) => {
    if (isTrialExpired) {
      setIsTrialExpired(true);
      return;
    }
    const rawText = (customPrompt !== undefined ? customPrompt : inputContent).trim();
    if (!rawText || isLoading) return;

    // 300ms Debounce Check
    const now = Date.now();
    if (now - lastSendTimeRef.current < 300) return;
    lastSendTimeRef.current = now;

    if (customPrompt === undefined) {
      setInputContent("");
    }
    setHintLevel(0);

    // Track Question in Session Memory
    updateSessionMemory((prev) => ({
      ...prev,
      questionsAsked: [...prev.questionsAsked.slice(-9), rawText],
    }));

    // Context Injection: Last 3 session concepts & recent errors
    const lastConcepts = sessionMemory.conceptsDiscussed.slice(-3);
    const recentErrors = sessionMemory.errorsMade.slice(-2);
    let memoryContext = "";
    if (lastConcepts.length > 0) {
      memoryContext += `[چەمکەکانی ئەم دانیشتنە: ${lastConcepts.join("، ")}]\n`;
    }
    if (recentErrors.length > 0) {
      memoryContext += `[خاڵە لاوازە تاقیکراوەکان: ${recentErrors.join("، ")}]\n`;
    }

    let finalPrompt = rawText;
    if (currentMode === "socratic") {
      const nextStep = socraticChainCount + 1;
      if (nextStep <= 4) {
        finalPrompt = `${memoryContext}[شێوازی فێرکاری سوقراتی - هەنگاوی ${nextStep} لە ٤]: تکایە وەڵامی ڕاستەوخۆ مەدە. پرسیارێکی هاندەر یان سەرەداوی ڕێبەریکردن بپرسە بۆ ئەوەی قوتابی خۆی وەڵامەکە بدۆزێتەوە. پرسیاری قوتابی: "${rawText}"`;
        setSocraticChainCount(nextStep);
      } else {
        finalPrompt = `${memoryContext}[شێوازی فێرکاری سوقراتی - گەیشتن بە ئەنجام]: قوتابی ٤ پرسیاری سوقراتی تەواو کرد. ئێستا تەواوی چەمکەکە و وەڵامە دروستەکە بە فراوانی شیبکەرەوە و دەستخۆشی لێبکە. پرسیاری قوتابی: "${rawText}"`;
        setSocraticChainCount(0);
        // Award XP on successful completion of 4-step chain!
        const bonus = Math.max(5, 20 - hintsUsed * 3);
        useAppStore.getState().addProgressScore(bonus);
        playSuccess();
      }
    } else if (memoryContext) {
      finalPrompt = `${memoryContext}${rawText}`;
    }

    try {
      await void sendChatMessage(finalPrompt, activeChapter?.id);
    } catch (err: unknown) {
      if ((err as Error)?.message === "TRIAL_EXPIRED") {
        setIsTrialExpired(true);
        setIsStoreTrialExpired?.(true);
      }
    } finally {
      if (typeof window !== "undefined" && (window.innerWidth >= 768 || isInputFocused)) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 50);
      }
    }
  };

  const handleContinueLastSession = async () => {
    let loadedConcepts = sessionMemory.conceptsDiscussed;
    let lastConcept = loadedConcepts.length > 0 ? loadedConcepts[loadedConcepts.length - 1] : activeChapter?.title;

    // Pull from Firestore session if available
    try {
      const db = getFirestoreDb();
      const studentUid = user?.id || profile?.id;
      if (db && studentUid) {
        const snap = await getDoc(doc(db, "students", studentUid, "sessions", "latest"));
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.conceptsDiscussed) && data.conceptsDiscussed.length > 0) {
            loadedConcepts = data.conceptsDiscussed;
            lastConcept = loadedConcepts[loadedConcepts.length - 1];
            updateSessionMemory((prev) => ({
              ...prev,
              conceptsDiscussed: Array.from(new Set([...prev.conceptsDiscussed, ...data.conceptsDiscussed])),
            }));
          }
        }
      }
    } catch (err) {
      console.warn("Could not pull last session from Firestore, using local fallback", err);
    }

    const prompt = `مامۆستا زانا، دەمەوێت لەو شوێنەی کە لە دانیشتنی پێشوو لێی وەستابووین بەردەوام بم (${lastConcept || activeSubjectMeta.label}). کورتەیەکی خێرای ئەوەم پێبڵێ و بەردەوام بین.`;
    void handleSend(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleSelectChapter = (id: number) => {
    setActiveChapter(id);
    setMobileChapterDrawer(false);
    setPracticeStepIndex(0);
    setStepFeedback(null);
    setHintLevel(0);
  };

  // Camera OCR simulation handler
  const _handleSimulateCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCameraImagePreview(event.target?.result as string);
        setIsOcrProcessing(true);
        setTimeout(() => {
          setIsOcrProcessing(false);
          setRecognizedQuestion(
            `لە بەندی ${activeChapter?.id || 1}ی کیمیادا: خەستی ئایۆنی هایدرۆنیۆم [H₃O⁺] = 1.0 × 10⁻⁴ M لە پلەی 25°C، بەهای pH و pOH چەندە؟`
          );
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const _handleConfirmOcrQuestion = () => {
    if (recognizedQuestion.trim()) {
      setInputContent(recognizedQuestion);
      setShowCameraModal(false);
      setCameraImagePreview(null);
      setRecognizedQuestion("");
    }
  };

  // Dynamic Chapter Curriculum Content & Drill Steps
  const chapterData = useMemo(() => {
    return getChapterData(currentSubject, activeChapter?.id || 1, activeChapter?.title);
  }, [currentSubject, activeChapter?.id, activeChapter?.title]);

  const practiceSteps = chapterData.drillSteps;

  // Reset drill state when active chapter or subject changes
  useEffect(() => {
    setPracticeStepIndex(0);
    setStepAnswerInput("");
    setStepFeedback(null);
  }, [activeChapter?.id, currentSubject]);

  const handleCheckStepAnswer = () => {
    const currentStep = practiceSteps[practiceStepIndex];
    if (!currentStep) return;

    const cleaned = stepAnswerInput.trim().toLowerCase();
    const expected = currentStep.expectedAnswer.toLowerCase().trim();
    const isMatch =
      cleaned === expected ||
      (currentStep.acceptedAnswers && currentStep.acceptedAnswers.some((a) => a.toLowerCase().trim() === cleaned));

    if (isMatch) {
      playSuccess();
      const newStreak = streakCount + 1;
      setStreakCount(newStreak);
      const points = newStreak >= 3 ? 15 : 10;
      setEarnedXp((prev) => prev + points);
      useAppStore.getState().addProgressScore(points);
      setStepFeedback({
        isCorrect: true,
        message: `ئافەرم! وەڵامەکەت تەواوە. (+${points} XP ${newStreak >= 3 ? "🔥 بەرزکەرەوەی بەردەوامی" : ""})`,
      });
    } else {
      playError();
      setStreakCount(0);
      updateSessionMemory((prev) => ({
        ...prev,
        errorsMade: [...prev.errorsMade.slice(-4), currentStep.stepTitle || activeChapter?.title || "هەڵەی پرسیار"],
      }));
      setStepFeedback({
        isCorrect: false,
        message: `هەڵەیە، تکایە سەرنج بدە: ${currentStep.hint}`,
      });
    }
  };

  const handleNextStep = () => {
    setStepAnswerInput("");
    setStepFeedback(null);
    if (practiceStepIndex < practiceSteps.length - 1) {
      setPracticeStepIndex((prev) => prev + 1);
    } else {
      setPracticeStepIndex(0);
    }
  };

  // Progressive Hint levels for Socratic mode
  const progressiveHints = [
    "سەرەتا بیری لێبکەرەوە: ئایا پێناسەی سەرەکی ئەم چەمکە چییە لە پەڕتووکی مەنهەج؟",
    "تێبینی ٢: سەیری یاسا و هاوکێشە بنەڕەتییەکە بکە، چ گۆڕاوێک نەزانراوە و چیت پێدراوە؟",
    "شیکاری هەنگاو بە هەنگاو: بەهاکان جێگیر بکە لە یاسای پێوانەیی و هەنگاو بە هەنگاو ئەنجامەکە بدۆزەرەوە.",
  ];

  // ─── Feature 6: Quick Prompt chip send handler ────────────────────────────
  const handleQuickPrompt = async (text: string) => {
    if (isTrialExpired) {
      setIsTrialExpired(true);
      return;
    }
    if (isLoading) return;
    try {
      await void sendChatMessage(text, activeChapter?.id);
    } catch (err: unknown) {
      if ((err as Error)?.message === "TRIAL_EXPIRED") {
        setIsTrialExpired(true);
        setIsStoreTrialExpired?.(true);
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50" dir="rtl">
      {/* 1. Desktop Chapter Sidebar (Collapsible 280px) */}
      <div
        className={`hidden lg:block h-full transition-all duration-300 shrink-0 ${
          isChapterSidebarOpen && !isFocusMode ? "w-[280px]" : "w-0 overflow-hidden"
        }`}
      >
        <ChapterSidebar
          chapters={chapters}
          activeChapterId={activeChapterId}
          onSelectChapter={handleSelectChapter}
          className="h-full w-[280px]"
          subjectTitle={
            currentSubject === "physics"
              ? "فیزیای پۆلی ١٢"
              : currentSubject === "chemistry"
              ? "کیمیای پۆلی ١٢"
              : "بیرکاری پۆلی ١٢"
          }
        />
      </div>



      {/* 3. Mobile Chapter Drawer Overlay */}
      {mobileChapterDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end lg:hidden"
          onClick={() => setMobileChapterDrawer(false)}
        >
          <div
            className="w-full max-w-xs h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-sans font-bold text-base text-slate-900 dark:text-white">
                {ku.chat.chaptersTitle}
              </span>
              <button
                onClick={() => setMobileChapterDrawer(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <ChapterSidebar
              chapters={chapters}
              activeChapterId={activeChapterId}
              onSelectChapter={handleSelectChapter}
              className="border-0 shadow-none flex-1"
              subjectTitle={
                currentSubject === "physics"
                  ? "فیزیای پۆلی ١٢"
                  : currentSubject === "chemistry"
                  ? "کیمیای پۆلی ١٢"
                  : "بیرکاری پۆلی ١٢"
              }
            />
          </div>
        </div>
      )}

      {/* 4. Main Workspace Area */}
      <div
        className={`flex-1 flex flex-col h-full min-w-0 bg-slate-50 dark:bg-slate-950 relative ${
          isFocusMode ? "fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950" : ""
        }`}
      >
        {/* Lesson Header + Streamlined Controls Toolbar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs shrink-0">
          {/* Top Title Bar - Compact & Clean (~44px) */}
          <div className="px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800">
            {/* Right side in RTL (Sidebar toggle + Title + Subject selector) */}
            <div className="flex items-center gap-2 min-w-0">
              {/* Desktop Sidebar Toggle Button */}
              <button
                type="button"
                onClick={() => setIsChapterSidebarOpen((prev) => !prev)}
                className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer text-xs font-bold shrink-0"
                title={isChapterSidebarOpen ? "داخستنی بەندەکان بۆ فراوانکردنی تەرمینال" : "کردنەوەی لیستی بەندەکان"}
              >
                {isChapterSidebarOpen ? (
                  <>
                    <PanelLeftClose className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="hidden xl:inline text-[11px]">شاردنەوەی بەندەکان</span>
                  </>
                ) : (
                  <>
                    <PanelLeftOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="hidden xl:inline text-[11px]">پیشاندانی بەندەکان</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5 min-w-0">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <button
                  type="button"
                  onClick={() => setMobileChapterDrawer(true)}
                  className="flex items-center gap-1 text-right font-sans font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-xs hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer lg:cursor-default"
                  title="هەڵبژاردنی بەند"
                >
                  <span className="truncate">
                    {activeChapter
                      ? `بەندی ${activeChapter.id}: ${activeChapter.title}`
                      : currentSubject === "physics"
                      ? "فیزیای پۆلی ١٢"
                      : currentSubject === "chemistry"
                      ? "کیمیای پۆلی ١٢"
                      : "بیرکاری پۆلی ١٢"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 lg:hidden" />
                </button>
                {activeChapter?.pages && (
                  <span className="hidden sm:inline font-sans text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                    (لاپەڕە {activeChapter.pages})
                  </span>
                )}
              </div>

              {/* Quick Subject Switcher Pills */}
              <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => handleSwitchSubject("physics")}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    currentSubject === "physics"
                      ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  ⚡ فیزیا
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchSubject("chemistry")}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    currentSubject === "chemistry"
                      ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  ⚗️ کیمیا
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchSubject("math")}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    currentSubject === "math"
                      ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  📐 بیرکاری
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchSubject("english")}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    currentSubject === "english"
                      ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  📚 ئینگلیزی
                </button>
              </div>
            </div>

            {/* Left side in RTL (Focus Mode + Online Status + XP + Session tools) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Focus Mode / Full-Screen Terminal Toggle */}
              <button
                type="button"
                onClick={() => setIsFocusMode((prev) => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  isFocusMode
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 ring-2 ring-indigo-300 dark:ring-indigo-800"
                    : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/60"
                }`}
                title={isFocusMode ? "دەرچوون لە شاشەی تەواو" : "گەورەکردنی شاشە و تەرمینالی چات"}
                aria-label="شاشەی تەواو"
              >
                {isFocusMode ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>دەرچوون</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>شاشەی گەورە</span>
                  </>
                )}
              </button>

              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-bold border ${
                  serverHealth.isOnline
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                    : "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
                }`}
                title={serverHealth.isOnline ? `سێرڤەر کارایە (${serverHealth.latencyMs || "<50"}ms)` : "دەرھێڵ"}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    serverHealth.isOnline ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                <span className="hidden sm:inline">{serverHealth.isOnline ? "سەرهێڵ" : "دەرھێڵ"}</span>
              </div>

              {onNavigateToSubjects && (
                <button
                  type="button"
                  onClick={onNavigateToSubjects}
                  className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-950 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded-full transition shadow-2xs cursor-pointer"
                  title="گۆڕینی وانە بۆ وانەیەکی تر"
                >
                  <span>گۆڕینی وانە</span>
                  <ArrowLeftRight className="w-3 h-3" />
                </button>
              )}

              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 px-2 py-0.5 rounded-full hidden sm:inline">
                {earnedXp > 0 ? `+${earnedXp} XP` : "مامۆستا زانا"}
              </span>

              {/* Continue from last session button */}
              <button
                type="button"
                onClick={handleContinueLastSession}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full transition shadow-2xs cursor-pointer"
                title="بەردەوامبوون لە دانیشتنی پێشوو لەگەڵ زانا"
                aria-label="بەردەوامبوون لە دانیشتنی پێشوو"
              >
                <RotateCcw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">دانیشتنی پێشوو</span>
              </button>

              {/* Clear chat history for this specific lesson */}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`دڵنیایت لە پاککردنەوەی مێژووی گفتوگۆی «${activeChapter?.title || "ئەم وانەیە"}»؟`)) {
                    clearChatHistory();
                  }
                }}
                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="سڕینەوەی گفتوگۆی ئەم وانەیە"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Unified Compact Segmented Mode Tabs (Height ~38px) */}
          <div className="px-2 sm:px-4 py-1.5 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => {
                  setViewMode("tutor");
                  setCurrentMode("ask");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "tutor" && currentMode === "ask"
                    ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>پرسیارکردن</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode("tutor");
                  setCurrentMode("socratic");
                  setSocraticChainCount(0);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "tutor" && currentMode === "socratic"
                    ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs ring-1 ring-indigo-200 dark:ring-indigo-800"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>سوقراتی</span>
                <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1 py-0.2 rounded font-black">نوێ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode("tutor");
                  setCurrentMode("explain");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "tutor" && currentMode === "explain"
                    ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ڕوونکردنەوە</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode("tutor");
                  setCurrentMode("practice");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "tutor" && currentMode === "practice"
                    ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>ڕاهێنان</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("workspace")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "workspace"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>هاوکێشە و مێزی کار</span>
              </button>
            </div>

            {/* Mobile Subject Switcher */}
            <div className="flex md:hidden items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleSwitchSubject(currentSubject === "physics" ? "chemistry" : currentSubject === "chemistry" ? "math" : "physics")}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
              >
                {activeSubjectMeta.icon} {activeSubjectMeta.label}
              </button>
            </div>
          </div>

          {/* Socratic Mode Inline Tracker Bar (Only if socratic mode - sleek ~32px) */}
          {viewMode === "tutor" && currentMode === "socratic" && (
            <div className="bg-indigo-50/90 dark:bg-indigo-950/60 border-t border-indigo-200/70 dark:border-indigo-800/60 px-3 sm:px-5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400 shrink-0" />
                <span className="font-bold text-[11px] text-indigo-900 dark:text-indigo-200">
                  فێرکاری سوقراتی: مامۆستا بە ٤ پرسیاری هاندەر دەتگەیەنێتە وەڵام
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {/* 4-Step Chain Indicator */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                  <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-200 ml-1">
                    قۆناغ {socraticChainCount}/٤:
                  </span>
                  {[1, 2, 3, 4].map((step) => (
                    <span
                      key={step}
                      className={`w-2 h-2 rounded-full transition-all ${
                        step <= socraticChainCount
                          ? "bg-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-900 scale-110"
                          : "bg-indigo-200 dark:bg-indigo-900"
                      }`}
                      title={`هەنگاوی ${step} لە ٤`}
                    />
                  ))}
                </div>

                {/* Hints Used Counter */}
                <button
                  type="button"
                  onClick={() => {
                    const nextHintCount = hintsUsed + 1;
                    setHintsUsed(nextHintCount);
                    useAppStore.getState().addProgressScore(-2);
                    void recordAttempt?.({
                      conceptId: activeChapter?.title || currentSubject,
                      conceptTitleKu: activeChapter?.title || currentSubject,
                      isCorrect: true,
                      responseTimeMs: 6000,
                      difficulty: DifficultyLevel.STANDARD,
                      questionText: "Socratic Hint Request",
                      studentResponse: "داوای سەرەداو",
                      hintUsed: true,
                    });
                    void handleSend("مامۆستا زانا، تکایە سەرەداوێک یان ڕێنماییەکم بدەرێ بۆ دۆزینەوەی وەڵامەکە.");
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 font-bold text-[10px] transition cursor-pointer shadow-2xs"
                  title="داوای سەرەداو"
                  aria-label="داوای سەرەداو لە شێوازی سوقراتی"
                >
                  <Lightbulb className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>سەرەداو ({hintsUsed})</span>
                </button>

                {/* Quick Direct Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setCurrentMode("ask")}
                  className="text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-2xs"
                  title="گۆڕین بۆ پرسیارکردنی ئاسایی"
                >
                  وەڵامی ڕاستەوخۆ
                </button>
              </div>
            </div>
          )}

          {/* ─── Feature 5: Concept Visualizer Bar (workspace mode) ──────── */}
          {viewMode === "workspace" && (
            <div className="px-3 pb-3 pt-1">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {/* Completed concepts (emerald) */}
                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-full px-3 py-1.5 shrink-0">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-sans text-[10px] font-bold text-emerald-800 dark:text-emerald-300">ترش و تفتەکان</span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-full px-3 py-1.5 shrink-0">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-sans text-[10px] font-bold text-emerald-800 dark:text-emerald-300">پێوەری pH</span>
                </div>
                {/* Current concept (indigo) */}
                <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700 rounded-full px-3 py-1.5 shrink-0 ring-2 ring-indigo-100 dark:ring-indigo-900/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0"></span>
                  <span className="font-sans text-[10px] font-bold text-indigo-800 dark:text-indigo-200">ئۆکسان و داڕزان</span>
                </div>
                {/* Upcoming (slate) */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0"></span>
                  <span className="font-sans text-[10px] text-slate-400">هاوسەنگیی کیمیایی</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Mode Views */}
        <div
          ref={chatScrollContainerRef}
          onScroll={handleChatScroll}
          role="log"
          aria-live="polite"
          aria-label="پەیامەکانی مامۆستا زانا"
          className="flex-1 overflow-y-auto overscroll-y-contain px-3 sm:px-6 py-3 space-y-3 w-full"
          style={{ WebkitOverflowScrolling: "touch" }}
        >

          {/* ════════════════════════════════════════════════════════════════
              WORKSPACE MODE PANELS (Features 3 & 4 live here)
              ════════════════════════════════════════════════════════════════ */}
          {viewMode === "workspace" && (
            <div className="space-y-4">

              {/* ─── Feature 3: Interactive Formula Board ──────────────────────────── */}
              {activeAction === "formula" && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
                  {/* Header & Filter Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h4 className="font-sans font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>تەختەی هاوکێشە و یاسا زانستییەکان</span>
                      </h4>
                      <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
                        هاوکێشە سەرەکییەکانی پڕۆگرامی خوێندن بە پێناسەی گۆڕاوەکان و یەکەکان
                      </p>
                    </div>

                    {/* Subject Filter Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                      {[
                        { id: "all", label: "هەموو" },
                        { id: "chemistry", label: "کیمیا" },
                        { id: "physics", label: "فیزیا" },
                        { id: "math", label: "بیرکاری" },
                      ].map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setFormulaSubject(sub.id as "all" | "chemistry" | "physics" | "math")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition cursor-pointer ${
                            formulaSubject === sub.id
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={formulaSearch}
                      onChange={(e) => setFormulaSearch(e.target.value)}
                      placeholder="گەڕان بەدوای یاسا، چەمک یان گۆڕاوێکدا..."
                      className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-sans text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Formulas List */}
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pl-1">
                    {[
                      {
                        id: "chem-ph",
                        subject: "chemistry",
                        subjectLabel: "کیمیا",
                        title: "یاسای پێوەری ترشێتی (pH Scale)",
                        formula: "pH = -log[H₃O⁺]",
                        variables: [
                          { sym: "pH", name: "ترشێتی گیراوە", unit: "بێ یەکە" },
                          { sym: "H₃O⁺", name: "خەستی ئایۆنی هایدرۆنیۆم", unit: "mol/L" },
                        ],
                        note: "بەکاردێت بۆ دیاریکردنی ترشێتی گیراوە ئاوییەکان لە پلەی گەرمی ٢٥ پلەی سەدی.",
                      },
                      {
                        id: "chem-kw",
                        subject: "chemistry",
                        subjectLabel: "کیمیا",
                        title: "بەرهەمی ئایۆنی بۆ ئاو (Kw)",
                        formula: "Kw = [H₃O⁺][OH⁻] = 1.0 × 10⁻¹⁴",
                        variables: [
                          { sym: "Kw", name: "نەگۆڕی خۆبەخۆ ئایۆنبوونی ئاو", unit: "mol²/L²" },
                          { sym: "OH⁻", name: "خەستی ئایۆنی هایدرۆکسید", unit: "mol/L" },
                        ],
                        note: "لە هەموو گیراوەیەکی ئاویدا ئەنجامی لێکدانی خەستی H₃O⁺ و OH⁻ نەگۆڕە.",
                      },
                      {
                        id: "phys-newton",
                        subject: "physics",
                        subjectLabel: "فیزیا",
                        title: "یاسای دووەمی نیوتن (Newton's 2nd Law)",
                        formula: "F = m · a",
                        variables: [
                          { sym: "F", name: "کۆی هێزی کاریگەر", unit: "N (نیوتن)" },
                          { sym: "m", name: "بارستەی تەن", unit: "kg" },
                          { sym: "a", name: "تاودان", unit: "m/s²" },
                        ],
                        note: "هێز یەکسانە بە بارستە جارانی تاودانی دروستبوو.",
                      },
                      {
                        id: "phys-ke",
                        subject: "physics",
                        subjectLabel: "فیزیا",
                        title: "وزەی جووڵە (Kinetic Energy)",
                        formula: "KE = ½ · m · v²",
                        variables: [
                          { sym: "KE", name: "وزەی جووڵەی تەن", unit: "J (جوول)" },
                          { sym: "v", name: "خێرایی تەن", unit: "m/s" },
                        ],
                        note: "پەیوەندی ڕاستەوانەی هەیە لەگەڵ دووجای خێرایی تەنەکەدا.",
                      },
                      {
                        id: "math-quad",
                        subject: "math",
                        subjectLabel: "بیرکاری",
                        title: "دەستووری هاوکێشەی دووجا (Quadratic Formula)",
                        formula: "x = (-b ± √(b² - 4ac)) / (2a)",
                        variables: [
                          { sym: "Δ = b² - 4ac", name: "دیاریکەری هاوکێشە (Delta)", unit: "ئەگەر Δ>0 دوو ڕەگ" },
                          { sym: "a, b, c", name: "هاوکۆلکەکانی ax² + bx + c = 0", unit: "ژمارەیی" },
                        ],
                        note: "بۆ دۆزینەوەی شیکاری هاوکێشە دووجاییەکان لە بیرکاری پۆلی ١٢.",
                      },
                    ]
                      .filter((item) => {
                        if (formulaSubject !== "all" && item.subject !== formulaSubject) return false;
                        if (formulaSearch.trim()) {
                          const q = formulaSearch.toLowerCase();
                          return (
                            item.title.toLowerCase().includes(q) ||
                            item.formula.toLowerCase().includes(q) ||
                            item.note.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-xl p-4 space-y-3 text-right"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-sans font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                                {item.subjectLabel}
                              </span>
                              <span>{item.title}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  void navigator.clipboard?.writeText(item.formula);
                                  setCopiedFormulaId(item.id);
                                  setTimeout(() => setCopiedFormulaId(null), 2000);
                                }}
                                className="p-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition"
                                title="کۆپیکردنی هاوکێشە"
                              >
                                {copiedFormulaId === item.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setInputContent(`مامۆستا زانا، تکایە یاسای "${item.title}" (${item.formula}) بە وردی لەگەڵ نموونەیەکی پرسیاری وەزاری بۆم شیکار بکە.`);
                                  setViewMode("tutor");
                                }}
                                className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold font-sans flex items-center gap-1 border border-indigo-200 dark:border-indigo-800/60 cursor-pointer transition"
                              >
                                <span>شیکردنەوە لە چات</span>
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center">
                            <p className="font-mono text-base font-bold text-indigo-800 dark:text-indigo-300 tracking-wide dir-ltr">
                              {item.formula}
                            </p>
                          </div>

                          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg overflow-hidden text-xs">
                            {item.variables.map((v, vIdx) => (
                              <div
                                key={vIdx}
                                className="flex items-center justify-between px-3 py-1.5"
                              >
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 dir-ltr">{v.sym}</span>
                                <span className="font-sans text-slate-700 dark:text-slate-300">{v.name}</span>
                                <span className="font-sans text-[11px] text-slate-400 font-mono">{v.unit}</span>
                              </div>
                            ))}
                          </div>

                          <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-700 pt-2">
                            💡 {item.note}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ─── Feature 4: Summary Panel ──────────────────────────── */}
              {activeAction === "summary" && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-white">
                      پوختەی بەندی {activeChapter?.id}: {chapterData.chapterTitle}
                    </h3>
                    <span className="text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full font-bold">
                      لاپەڕە {chapterData.pages}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {chapterData.summary}
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">گرنگترین خاڵ و چەمکەکان:</span>
                    {chapterData.keyConcepts.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{item.title}: </span>
                          <span className="font-sans text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Official Curriculum Book Viewer Panel ─────────────────────── */}
              {activeAction === "book" && (
                <div className="space-y-4">
                  <DynamicBookViewer
                    subject={currentSubject}
                    stream={profile?.stream}
                    onSelectTopicForStudy={(title, pages) => {
                      setInputContent(`مامۆستا زانا، دەمەوێت لەسەر "${title}" (${pages}) بخوێنم و بە وردی لەگەڵ نموونەی پرسیاری وەزاری بۆم شیبکەیتەوە.`);
                      setViewMode("tutor");
                    }}
                    onNavigateToChat={() => setViewMode("tutor")}
                  />
                </div>
              )}

              {/* Workspace Action: Vision Question Solver */}
              {activeAction === "vision" && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-6 space-y-4">
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white">
                        چارەسەرکەری وێنەی پرسیار (Camera OCR Solver)
                      </h3>
                      <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
                        وێنەی پرسیارەکەت باربکە یان بیگرە؛ زانا هەنگاو بە هەنگاو شیکارت بۆ دەکات
                      </p>
                    </div>
                  </div>
                  <VisionCapturePanel
                    context={{
                      studentId: profile?.name || "student_1",
                      studentName: profile?.name || "قوتابی",
                      grade: profile?.grade || "12",
                      stream: "scientific",
                      subject: currentSubject,
                      level: "advanced",
                      lessonTitle: activeChapter?.title,
                      conceptTitle: activeChapter?.title,
                    }}
                  />
                </div>
              )}

              {/* Workspace Action: Explain (ڕوونکردنەوەی چەمکەکانی وانەکە) */}
              {activeAction === "explain" && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="font-bold text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full">
                      ڕوونکردنەوەی چەمک • بەندی {activeChapter?.id}
                    </span>
                    <span className="text-xs text-slate-400 font-sans">
                      لاپەڕە {chapterData.pages}
                    </span>
                  </div>
                  <h3 className="font-sans font-bold text-lg text-slate-900 dark:text-white">
                    {chapterData.chapterTitle}
                  </h3>
                  <p className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                    {chapterData.summary}
                  </p>
                  {chapterData.keyConcepts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">چەمکە سەرەکییەکان:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {chapterData.keyConcepts.map((c, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                            <span className="font-bold text-xs text-indigo-700 dark:text-indigo-300 block">{c.title}</span>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">{c.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {chapterData.solvedExample && (
                    <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                      <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-300">نموونەی شیکارکراوی وەزاری:</h4>
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{chapterData.solvedExample.question}</p>
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-1 leading-relaxed">
                        <span className="font-sans font-bold text-emerald-700 dark:text-emerald-400 block mb-1">هەنگاوەکانی شیکار:</span>
                        {chapterData.solvedExample.steps.map((st, sIdx) => (
                          <div key={sIdx} className="text-slate-600 dark:text-slate-300">{st}</div>
                        ))}
                        <div className="pt-1 font-bold text-emerald-800 dark:text-emerald-300 font-sans">ئەنجام: {chapterData.solvedExample.result}</div>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setInputContent(`مامۆستا زانا، دەمەوێت لەسەر «${chapterData.chapterTitle}» پرسیار بکەم و پێکەوە تاوتوێی بکەین.`);
                      setViewMode("tutor");
                    }}
                    className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-800/60 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>گفتوگۆ لەگەڵ مامۆستا زانا لەسەر ئەم چەمکە</span>
                  </button>
                </div>
              )}

              {/* Workspace Action: Practice (ڕاهێنانی کارلێککارانەی وانەکە) */}
              {activeAction === "practice" && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="font-bold text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full">
                      ڕاهێنانی وانە • {activeChapter?.title}
                    </span>
                    <span className="text-xs text-slate-400 font-sans">
                      هەنگاو {practiceStepIndex + 1} لە {practiceSteps.length || 1}
                    </span>
                  </div>
                  {practiceSteps.length > 0 && practiceSteps[practiceStepIndex] ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-800/60 space-y-2">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                          پرسیاری هەنگاوبەندی:
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                          {practiceSteps[practiceStepIndex].stepTitle}
                        </h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {practiceSteps[practiceStepIndex].question || practiceSteps[practiceStepIndex].problem}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={stepAnswerInput}
                          onChange={(e) => setStepAnswerInput(e.target.value)}
                          placeholder="وەڵام یان ژمارە لێرە بنووسە..."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCheckStepAnswer();
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleCheckStepAnswer}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                          >
                            پشکنینی وەڵام
                          </button>
                          {practiceSteps[practiceStepIndex].hint && (
                            <button
                              onClick={() => {
                                setStepFeedback({
                                  isCorrect: false,
                                  message: `💡 سەرەداو: ${practiceSteps[practiceStepIndex].hint}`,
                                });
                              }}
                              className="px-3 py-2 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-950 font-bold rounded-xl text-xs cursor-pointer"
                            >
                              سەرەداو
                            </button>
                          )}
                        </div>
                      </div>

                      {stepFeedback && (
                        <div
                          className={`p-3 rounded-xl text-xs font-bold ${
                            stepFeedback.isCorrect
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                              : "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                          }`}
                        >
                          {stepFeedback.message}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs">
                      هیچ ڕاهێنانێک بۆ ئەم بەشە تۆمار نەکراوە.
                    </div>
                  )}
                </div>
              )}

              {/* Workspace Action: Ask (ڕێبەری پرسیارکردنی سوقراتی) */}
              {activeAction === "ask" && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="font-bold text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full">
                      پرسیاری سوقراتی و وەزاری • بەندی {activeChapter?.id}
                    </span>
                  </div>
                  <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-white">
                    پرسیارە گرنگ و باوەکانی ئەم بەشە هەڵبژێرە:
                  </h3>
                  <div className="space-y-2">
                    {[
                      `چۆن یاسای سەرەکی لە «${activeChapter?.title || "ئەم وانەیە"}» جێبەجێ دەکرێت؟`,
                      `هەڵە باوەکانی تاقیکردنەوەی وەزاری لە بەندی ${activeChapter?.id || 1} چین؟`,
                      `نموونەیەکی پراکتیکی لەسەر ئەم وانەیە بۆم شیبکەرەوە هەنگاو بە هەنگاو.`,
                      `کورتەیەکی گشتگیر و خاڵ بە خاڵم لەسەر «${activeChapter?.title || "ئەم وانەیە"}» پێبدە.`,
                    ].map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => {
                          setInputContent(prompt);
                          setViewMode("tutor");
                        }}
                        className="w-full text-right p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center justify-between group cursor-pointer transition-all"
                      >
                        <span>{prompt}</span>
                        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 transition-transform group-hover:-translate-x-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TUTOR MODE PANELS (original 3-tab content)
              ════════════════════════════════════════════════════════════════ */}
          {viewMode === "tutor" && (
            <>
              {/* MODE 1 & 2: Socratic / Direct Ask (Chat) */}
              {(currentMode === "ask" || currentMode === "socratic") && (
                <div className="w-full max-w-5xl mx-auto space-y-3">
                  {/* Session Memory Context Banner */}
                  {sessionConcepts.length > 0 && (
                    <div className="bg-slate-100/70 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl px-3.5 py-1.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-sans">
                      <div className="flex items-center gap-1.5 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                        <span className="font-bold text-slate-700 dark:text-slate-200">تێڕوانینی دانیشتن:</span>
                        <span className="truncate">{sessionConcepts.slice(-3).join(" • ")}</span>
                      </div>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 px-2 py-0.5 rounded-full shrink-0 font-bold">
                        پاشەکەوتکراو
                      </span>
                    </div>
                  )}

                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Sparkles className="w-7 h-7" />
                      </div>
                      <p className="font-sans text-sm text-slate-600 dark:text-slate-300 max-w-sm leading-relaxed">
                        سڵاو! من مامۆستا زانام. پرسیارێکت لەسەر {activeChapter?.title || "ئەم بەندە"} بپرسە، یاخود شێوازی سوقراتی تاقی بکەرەوە تا پێکەوە شیبکەینەوە.
                      </p>
                    </div>
                  )}

                  {/* Message Virtualization: Show button to expand older messages */}
                  {chatMessages.length > 30 && !showAllMessages && (
                    <div className="flex justify-center my-1.5">
                      <button
                        type="button"
                        onClick={() => setShowAllMessages(true)}
                        className="text-xs font-sans font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-950 border border-indigo-200 dark:border-indigo-800/60 px-3.5 py-1 rounded-full transition shadow-2xs cursor-pointer flex items-center gap-1"
                        aria-label="بینینی پەیامە کۆنەکان"
                      >
                        <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                        <span>بینینی پەیامە کۆنەکان ({chatMessages.length - 30} پەیام)</span>
                      </button>
                    </div>
                  )}

                  {displayedMessages.map((msg) => (
                    <ChatBubble
                      key={msg.id}
                      message={msg}
                      isLatestAi={msg.id === latestAiMessageId}
                      suggestions={msg.id === latestAiMessageId ? smartSuggestions : []}
                      onSelectSuggestion={(sug) => {
                        void handleSend(sug);
                      }}
                      onOpenVirtualLab={() => {
                        window.location.href = "/labs";
                      }}
                      socraticStep={
                        currentMode === "socratic" && msg.sender === "zana"
                          ? Math.max(1, socraticChainCount)
                          : undefined
                      }
                    />
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-2.5 my-2 justify-start" dir="rtl">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-xs flex items-center gap-2">
                        <Spinner size="sm" />
                        <span className="font-sans text-xs text-slate-500 dark:text-slate-400 font-medium">
                          مامۆستا زانا بیر دەکاتەوە و وەڵامت دەداتەوە...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Socratic Progressive Hint Card */}
                  <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 rounded-xl p-3 my-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-200 font-sans">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        {hintLevel === 0
                          ? "ڕێنمایی دەوێت لە مامۆستا زانا بەبێ ئەوەی ڕاستەوخۆ وەڵامت پێبدات؟"
                          : progressiveHints[hintLevel - 1]}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (hintLevel < progressiveHints.length) {
                          setHintLevel((prev) => prev + 1);
                        } else {
                          setHintLevel(1);
                        }
                      }}
                      className="shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 cursor-pointer mr-2 shadow-2xs"
                    >
                      {hintLevel === 0 ? "تێبینی یەکەم" : hintLevel < progressiveHints.length ? `تێبینی ${hintLevel + 1}` : "دووبارە"}
                    </button>
                  </div>

                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* MODE 2: Rich Educational Explain */}
              {currentMode === "explain" && (
                <div className="space-y-4 max-w-3xl mx-auto py-2">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span className="font-bold text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full">
                        {currentSubject === "physics"
                          ? "فیزیای پۆلی ١٢"
                          : currentSubject === "chemistry"
                          ? "کیمیای پۆلی ١٢"
                          : currentSubject === "math"
                          ? "بیرکاریی پۆلی ١٢"
                          : "ئینگلیزیی پۆلی ١٢"} • بەندی {activeChapter?.id}
                      </span>
                      <span className="text-xs text-slate-400 font-sans italic">
                        مەنهەجی فەرمی (لاپەڕە {chapterData.pages})
                      </span>
                    </div>

                    <h3 className="font-sans font-bold text-lg text-slate-900 dark:text-white">
                      {chapterData.chapterTitle}
                    </h3>

                    <div className="space-y-4 font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      <p className="bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed">
                        {chapterData.summary}
                      </p>

                      {chapterData.keyConcepts.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">چەمک و زانیارییە سەرەکییەکان:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {chapterData.keyConcepts.map((concept, idx) => (
                              <div key={idx} className="p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1">
                                <span className="font-bold text-xs text-indigo-700 dark:text-indigo-300 block">{concept.title}</span>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">{concept.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {chapterData.formulas.length > 0 && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">یاسا و دەستوورە سەرەکییەکان:</h4>
                          <div className="space-y-2">
                            {chapterData.formulas.map((f, idx) => (
                              <div key={idx} className="space-y-1">
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{f.title}:</span>
                                <p className="font-mono text-left dir-ltr bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                                  {f.formula}
                                </p>
                                {f.note && <p className="text-[11px] text-slate-500 dark:text-slate-400">{f.note}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-slate-800 dark:text-slate-200 space-y-2">
                        <span className="font-bold text-emerald-900 dark:text-emerald-300 block text-sm">نموونەی شیکارکراوی پڕۆگرامی وەزارەت:</span>
                        <p className="font-bold text-slate-900 dark:text-white">{chapterData.solvedExample.question}</p>
                        <div className="space-y-1 pt-1 text-slate-700 dark:text-slate-300">
                          {chapterData.solvedExample.steps.map((st, idx) => (
                            <p key={idx}>{st}</p>
                          ))}
                        </div>
                        <p className="font-bold text-emerald-800 dark:text-emerald-300 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                          {chapterData.solvedExample.result}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setInputContent(`مامۆستا زانا، تکایە کورتەی بەندی ${activeChapter?.id} (${activeChapter?.title}) و گرنگترین خاڵەکانی تاقیکردنەوەی وەزاریم بۆ ڕوونبکەرەوە.`);
                          setCurrentMode("ask");
                        }}
                        className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>پرسیار لە مامۆستا زانا سەبارەت بەم وانەیە</span>
                      </button>

                      <button
                        onClick={() => setCurrentMode("practice")}
                        className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <span>چوونە سەر ڕاهێنان لەسەر ئەم وانەیە</span>
                        <Award className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 3: Step-by-Step Drill Practice */}
              {currentMode === "practice" && (
                <div className="space-y-4 max-w-2xl mx-auto py-2">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-xs text-slate-800 dark:text-white">
                          شیکارکەری هەنگاو بە هەنگاو (Drill)
                        </span>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
                        هەنگاوی {practiceStepIndex + 1} لە {practiceSteps.length}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 space-y-1">
                      <span className="font-bold text-slate-500 dark:text-slate-400">کێشەی سەرەکی:</span>
                      <p className="font-sans font-bold text-sm text-slate-900 dark:text-white">
                        {practiceSteps[practiceStepIndex]?.problem}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-sans font-bold text-sm text-indigo-900 dark:text-indigo-300">
                        {practiceSteps[practiceStepIndex]?.stepTitle}
                      </h4>
                      <p className="font-sans text-xs text-slate-700 dark:text-slate-300">
                        {practiceSteps[practiceStepIndex]?.question}
                      </p>

                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={stepAnswerInput}
                          onChange={(e) => setStepAnswerInput(e.target.value)}
                          placeholder="وەڵامی ژمارەیی یان تەواو بنووسە..."
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                        <button
                          onClick={handleCheckStepAnswer}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                        >
                          پشکنینی هەنگاو
                        </button>
                      </div>
                    </div>

                    {stepFeedback && (
                      <div
                        className={`p-3.5 rounded-xl border text-xs font-sans flex items-center justify-between ${
                          stepFeedback.isCorrect
                            ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300"
                            : "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300"
                        }`}
                      >
                        <span>{stepFeedback.message}</span>
                        {stepFeedback.isCorrect && (
                          <button
                            onClick={handleNextStep}
                            className="font-bold text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 cursor-pointer mr-2 shrink-0"
                          >
                            هەنگاوی دواتر ←
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── Feature 2: 7 Workspace Action Tabs (workspace mode) ───────── */}
          {viewMode === "workspace" && (
            <div className={`grid gap-2 ${workspaceActionTabs.length > 5 ? "grid-cols-4 sm:grid-cols-7" : "grid-cols-5"} pt-2`}>
              {workspaceActionTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeAction === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAction(tab.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer min-h-[48px] ${
                      isActive
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${isActive ? "scale-110" : ""} transition-transform shrink-0`} />
                    <span className="font-sans text-[9px] font-bold tracking-tight text-center leading-none mt-0.5 w-full truncate">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ─── Feature 7: Continue Learning CTA (workspace mode) ──────── */}
          {viewMode === "workspace" && (
            <button
              onClick={() => setViewMode("tutor")}
              className="w-full min-h-[50px] bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>هەنگاوی داهاتووی خوێندن</span>
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </button>
          )}
        </div>

        {/* 6. Sticky Chat Input Area (Shown in Ask and Socratic modes) */}
        {viewMode === "tutor" && (currentMode === "ask" || currentMode === "socratic") && (
          <div
            className="p-2 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xs shrink-0"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
            }}
          >
            <div className="max-w-5xl mx-auto w-full">
              {/* ─── Feature 6: Quick Prompt Chips (hidden while typing on mobile to save vertical space) ─── */}
              <div className={`items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar ${isInputFocused ? "hidden sm:flex" : "flex"}`}>
                <button
                  onClick={() => handleQuickPrompt(`مامۆستا زانا، ڕاهێنانی وانەی بەندی ${activeChapter?.id || 1}م بۆ بکە`)}
                  className="shrink-0 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 text-[11px] font-sans font-bold shadow-2xs transition-colors cursor-pointer text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 min-h-[36px]"
                >
                  <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>🏆 ڕاهێنانی وانە</span>
                </button>

                <button
                  onClick={() => handleQuickPrompt(`مامۆستا زانا، تکایە چەمکە سەرەکییەکانی بەندی ${activeChapter?.id || 1}م بۆ ڕوون بکەرەوە بە شێوازی سوقراتی`)}
                  className="shrink-0 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 text-[11px] font-sans font-medium shadow-2xs transition-colors cursor-pointer text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 min-h-[36px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>✨ شیکردنەوەی سوقراتی</span>
                </button>

                <button
                  onClick={() => handleQuickPrompt(`هەڵە تێگەیشتنە باوەکانی قوتابیان لەسەر بەندی ${activeChapter?.id || 1} چین؟`)}
                  className="shrink-0 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 text-[11px] font-sans font-medium shadow-2xs transition-colors cursor-pointer text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 min-h-[36px]"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>❓ هەڵە باوەکان</span>
                </button>

                <button
                  onClick={() => handleQuickPrompt(`یاسا و هاوکێشە سەرەکییەکانی پەیوەست بە بەندی ${activeChapter?.id || 1} چین؟`)}
                  className="shrink-0 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 text-[11px] font-sans font-medium shadow-2xs transition-colors cursor-pointer text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 min-h-[36px]"
                >
                  <Brain className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>🧠 هاوکێشە و یاساکان</span>
                </button>
              </div>

              {/* Live Voice Recording Status Badge */}
              {isListening && (
                <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 px-3.5 py-2 rounded-xl text-xs mb-2 shadow-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span className="font-bold shrink-0">گوێ دەگرێت... بە کوردی قسە بکە</span>
                    {interimTranscript && (
                      <span className="text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-900 border border-rose-100 dark:border-rose-800 px-2 py-0.5 rounded text-[11px] truncate max-w-[200px] sm:max-w-md">
                        «{interimTranscript}»
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={stopListening}
                    className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:text-rose-900 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-lg shadow-2xs cursor-pointer transition-colors"
                  >
                    <Square className="w-3 h-3 fill-current text-rose-600 dark:text-rose-400" />
                    <span>تەواوکردن</span>
                  </button>
                </div>
              )}

              {speechErrorToast && (
                <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 px-3.5 py-2 rounded-xl text-xs mb-2">
                  <span>{speechErrorToast}</span>
                  <button
                    type="button"
                    onClick={() => setSpeechErrorToast(null)}
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-800 font-bold px-1.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isListening) stopListening();
                  void handleSend();
                }}
                className="flex items-end gap-1.5 sm:gap-2 max-w-5xl mx-auto w-full"
              >
                {/* Camera Button */}
                <button
                  type="button"
                  onClick={() => setShowCameraModal(true)}
                  className="w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  title="وێنەگرتن یان بارکردنی پرسیار"
                  aria-label="وێنەی پرسیار"
                >
                  <Camera className="w-5 h-5" />
                </button>

                {/* Voice-to-Text Microphone Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) {
                      stopListening();
                    } else {
                      startListening();
                    }
                  }}
                  className={`w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                    isListening
                      ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 animate-pulse shadow-md shadow-rose-200"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                  title={isListening ? "ڕاگرتنی تۆمارکردنی دەنگ" : "تۆمارکردنی دەنگ (قسەکردن بە زمانی کوردی)"}
                  aria-label="تۆمارکردنی دەنگی پرسیار"
                >
                  {isListening ? (
                    <Square className="w-4 h-4 fill-current text-white" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      setIsInputFocused(true);
                      setTimeout(() => {
                        scrollToBottom(true);
                      }, 200);
                    }}
                    onBlur={() => {
                      setIsInputFocused(false);
                    }}
                    rows={1}
                    inputMode="text"
                    placeholder={
                      isTrialExpired
                        ? "تاقیکردنەوەی ٣ ڕۆژەکەت بەسەرچوو. تکایە بەشداری بکە..."
                        : isListening
                        ? "دەنگت تۆمار دەکرێت..."
                        : currentMode === "socratic"
                        ? "وەڵام یان تێڕوانینی خۆت بنووسە بۆ مامۆستا زانا (سوقراتی)..."
                        : "پرسیارت لەسەر ئەم بەندە بپرسە..."
                    }
                    className="w-full resize-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base sm:text-sm font-sans text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all min-h-[44px] sm:min-h-[48px] max-h-32 leading-relaxed touch-manipulation"
                    disabled={isLoading || isTrialExpired}
                    aria-label="دەقی پرسیار یان وەڵام"
                  />
                </div>

                <button
                  type="submit"
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={isLoading || isTrialExpired || (!inputContent.trim() && !isListening)}
                  className="w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center shrink-0 shadow-xs transition-colors cursor-pointer"
                  aria-label={ku.chat.send}
                >
                  {isLoading ? (
                    <Spinner size="sm" className="!border-white !border-t-transparent" />
                  ) : (
                    <Send className="w-5 h-5 -rotate-90 rtl:rotate-90" />
                  )}
                </button>

                {/* Accessible Live Region for Screen Readers */}
                <div className="sr-only" aria-live="polite" aria-busy={isLoading}>
                  {isLoading ? "مامۆستا زانا سەرقاڵی شیکردنەوە و ئامادەکردنی وەڵامە..." : ""}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* 7. Camera Question Solver Modal (Vision OCR & Step-by-Step AI Solver) */}
      <Modal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        title="شیکارکەری کامێرایی پرسیار (Camera AI Solver) 📷"
      >
        <div className="max-h-[82vh] overflow-y-auto pr-1">
          <VisionCapturePanel
            context={{
              studentId: profile?.name || "student_1",
              studentName: profile?.name || "قوتابی",
              grade: profile?.grade || "12",
              stream: "scientific",
              subject: currentSubject,
              level: "advanced",
              lessonTitle: activeChapter?.title,
              conceptTitle: activeChapter?.title,
            }}
          />
        </div>
      </Modal>

      {/* 8. Soft Paywall Subscription Modal */}
      <SubscriptionModal
        isOpen={isTrialExpired}
        onClose={() => setIsTrialExpired(false)}
        userId={(user as unknown as { uid?: string })?.uid || user?.id || profile?.id || ""}
        userName={user?.name || (user as unknown as { displayName?: string })?.displayName || profile?.name || ""}
        userEmail={user?.email || ""}
      />
    </div>
  );
}

export default Chat;
