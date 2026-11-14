import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Send,
  BookOpen,
  Sparkles,
  Layers,
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
} from "lucide-react";
import { ChapterSidebar } from "../components/ChapterSidebar.tsx";
import { ChatBubble } from "../components/ChatBubble.tsx";
import { Spinner } from "../components/Spinner.tsx";
import { Modal } from "../components/Modal.tsx";
import { SubscriptionModal } from "../components/SubscriptionModal.tsx";
import { useAppStore } from "../store/appStore.ts";
import { useSoundEffects } from "../hooks/useSoundEffects.ts";
import { ku } from "../i18n/translations.ts";
import { Grade12ChemistryBookViewer } from "../components/Grade12ChemistryBookViewer.tsx";
import { Grade12PhysicsBookViewer } from "../components/Grade12PhysicsBookViewer.tsx";
import { Grade12MathBookViewer } from "../components/Grade12MathBookViewer.tsx";
import { Grade12LiteraryMathBookViewer } from "../components/Grade12LiteraryMathBookViewer.tsx";
import { Grade12KurdishBookViewer } from "../components/Grade12KurdishBookViewer.tsx";
import { Grade12ArabicBookViewer } from "../components/Grade12ArabicBookViewer.tsx";
import { Grade12HistoryBookViewer } from "../components/Grade12HistoryBookViewer.tsx";
import { Grade12EconomicsBookViewer } from "../components/Grade12EconomicsBookViewer.tsx";
import { Grade12GeographyBookViewer } from "../components/Grade12GeographyBookViewer.tsx";
import { Grade12SportsBookViewer } from "../components/Grade12SportsBookViewer.tsx";
import { Grade12EnglishBookViewer } from "../components/Grade12EnglishBookViewer.tsx";
import { StudentProfile, SubjectKey } from "../features/student/studentTypes.ts";
import { getValidatedSubject } from "../features/student/studentDefaults.ts";
import { useServerHealth } from "../hooks/useServerHealth.ts";
import { useSpeechToText } from "../hooks/useSpeechToText.ts";
import { getChapterData } from "../data/curriculum/chapterDrills.ts";
import { VisionCapturePanel } from "../features/vision/VisionCapturePanel.tsx";

export type WorkspaceMode = "ask" | "explain" | "practice";

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isLoading, currentMode]);

  const handleSwitchSubject = (subj: SubjectKey) => {
    setSelectedSubject(subj);
    setActiveSubject(subj);
    onSelectSubject?.(subj);
    void fetchChapters(subj);
  };

  const activeChapter = chapters.find((c) => c.id === activeChapterId) || chapters[0];

  const _isPhysics = currentSubject === "physics";
  const _isChemistry = currentSubject === "chemistry";
  const _isMath = currentSubject === "math" || currentSubject === "mathematics";

  const activeSubjectMeta = CHAT_SUBJECT_META[currentSubject] || { label: "کیمیا", icon: "⚗️" };
  const hasBook = true;
  const bookLabel = `پەڕتووکی ${activeSubjectMeta.label} 📖`;

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

  const handleSend = async () => {
    if (isTrialExpired) {
      setIsTrialExpired(true);
      return;
    }
    if (!inputContent.trim() || isLoading) return;
    const text = inputContent.trim();
    setInputContent("");
    setHintLevel(0);
    try {
      await void sendChatMessage(text, activeChapter?.id);
    } catch (err: unknown) {
      if ((err as Error)?.message === "TRIAL_EXPIRED") {
        setIsTrialExpired(true);
        setIsStoreTrialExpired?.(true);
      }
    }
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
      {/* 1. Desktop Chapter Sidebar (280px) */}
      <div className="hidden lg:block h-full">
        <ChapterSidebar
          chapters={chapters}
          activeChapterId={activeChapterId}
          onSelectChapter={handleSelectChapter}
          className="h-full !w-[280px]"
          subjectTitle={
            currentSubject === "physics"
              ? "فیزیای پۆلی ١٢"
              : currentSubject === "chemistry"
              ? "کیمیای پۆلی ١٢"
              : "بیرکاری پۆلی ١٢"
          }
        />
      </div>

      {/* 2. Mobile Chapter Bar / Selector */}
      <div className="lg:hidden p-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
        <button
          onClick={() => setMobileChapterDrawer(true)}
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-right font-sans cursor-pointer max-w-[80%]"
        >
          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="truncate">
            <span className="font-bold text-xs text-slate-900 block truncate">
              {activeChapter ? `بەندی ${activeChapter.id}: ${activeChapter.title}` : "هەڵبژاردنی بەند"}
            </span>
            {activeChapter?.pages && (
              <span className="text-[10px] text-slate-500 block truncate">
                لاپەڕە {activeChapter.pages}
              </span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
        </button>

        <button
          onClick={() => setMobileChapterDrawer(true)}
          className="p-2 text-indigo-600 bg-indigo-50 rounded-xl border border-indigo-200 cursor-pointer text-xs font-sans font-bold flex items-center gap-1"
        >
          <Layers className="w-4 h-4" />
          <span>بەندەکان</span>
        </button>
      </div>

      {/* 3. Mobile Chapter Drawer Overlay */}
      {mobileChapterDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end lg:hidden"
          onClick={() => setMobileChapterDrawer(false)}
        >
          <div
            className="w-full max-w-xs h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-sans font-bold text-base text-slate-900">
                {ku.chat.chaptersTitle}
              </span>
              <button
                onClick={() => setMobileChapterDrawer(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
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
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 relative">
        {/* Lesson Header + Segmented Mode Control Tabs */}
        <div className="bg-white border-b border-slate-200 shadow-2xs">
          {/* Top Title Bar */}
          <div className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <h2 className="font-sans font-bold text-sm text-slate-900 truncate">
                  {activeChapter
                    ? `بەندی ${activeChapter.id}: ${activeChapter.title}`
                    : currentSubject === "physics"
                    ? "فیزیای پۆلی ١٢"
                    : currentSubject === "chemistry"
                    ? "کیمیای پۆلی ١٢"
                    : "بیرکاری پۆلی ١٢"}
                </h2>
                {activeChapter?.pages && (
                  <p className="font-sans text-[10px] text-slate-500">
                    لاپەڕە {activeChapter.pages} • پڕۆگرامی فەرمی وەزارەت
                  </p>
                )}
              </div>
            </div>

            {/* Quick Subject Switcher Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleSwitchSubject("physics")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentSubject === "physics"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                ⚡ فیزیا
              </button>
              <button
                type="button"
                onClick={() => handleSwitchSubject("chemistry")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentSubject === "chemistry"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                ⚗️ کیمیا
              </button>
              <button
                type="button"
                onClick={() => handleSwitchSubject("math")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentSubject === "math"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📐 بیرکاری
              </button>
              <button
                type="button"
                onClick={() => handleSwitchSubject("english")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentSubject === "english"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📚 ئینگلیزی
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-bold border ${
                  serverHealth.isOnline
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
                title={serverHealth.isOnline ? `سێرڤەر کارایە (دواین پشکنین: ${serverHealth.latencyMs || "<50"}ms)` : "پەیوەندی لەگەڵ سێرڤەر نییە"}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    serverHealth.isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  }`}
                />
                <span>
                  {serverHealth.isOnline ? "سەرهێڵ" : "دەرھێڵ"} • {activeSubjectMeta.label}
                </span>
              </div>

              {onNavigateToSubjects && (
                <button
                  type="button"
                  onClick={onNavigateToSubjects}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-full transition shadow-2xs cursor-pointer"
                  title="گۆڕینی وانە بۆ وانەیەکی تر"
                >
                  <span>گۆڕینی وانە</span>
                  <ArrowLeftRight className="w-3 h-3" />
                </button>
              )}

              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
                {earnedXp > 0 ? `+${earnedXp} XP` : "مامۆستا زانا"}
              </span>

              {/* Clear chat history for this specific lesson */}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`دڵنیایت لە پاککردنەوەی مێژووی گفتوگۆی «${activeChapter?.title || "ئەم وانەیە"}»؟`)) {
                    clearChatHistory();
                  }
                }}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="سڕینەوەی گفتوگۆی ئەم وانەیە"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ─── Feature 1: Dual View Switcher ─────────────────────────────── */}
          <div className="px-3 pt-3 pb-2">
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1">
              <button
                onClick={() => setViewMode("tutor")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-sans text-xs font-bold transition-all cursor-pointer min-h-[48px] ${
                  viewMode === "tutor"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>مامۆستا زانا (گفتوگۆی زیرەک)</span>
              </button>
              <button
                onClick={() => setViewMode("workspace")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-sans text-xs font-bold transition-all cursor-pointer min-h-[48px] ${
                  viewMode === "workspace"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <BookMarked className="w-4 h-4 shrink-0" />
                <span>مێزی وانە (سەرچاوەکان)</span>
              </button>
            </div>
          </div>

          {/* Segmented Mode Selector: Ask | Explain | Practice  (only in tutor mode) */}
          {viewMode === "tutor" && (
            <div className="grid grid-cols-3 text-center">
              <button
                onClick={() => setCurrentMode("ask")}
                className={`py-2.5 font-sans text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentMode === "ask"
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/30"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>پرسیارکردن</span>
              </button>

              <button
                onClick={() => setCurrentMode("explain")}
                className={`py-2.5 font-sans text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentMode === "explain"
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/30"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>ڕوونکردنەوەی چەمک</span>
              </button>

              <button
                onClick={() => setCurrentMode("practice")}
                className={`py-2.5 font-sans text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentMode === "practice"
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/30"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Award className="w-4 h-4" />
                <span>ڕاهێنانی کارلێککارانە</span>
              </button>
            </div>
          )}

          {/* ─── Feature 5: Concept Visualizer Bar (workspace mode) ──────── */}
          {viewMode === "workspace" && (
            <div className="px-3 pb-3 pt-1">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {/* Completed concepts (emerald) */}
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="font-sans text-[10px] font-bold text-emerald-800">ترش و تفتەکان</span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="font-sans text-[10px] font-bold text-emerald-800">پێوەری pH</span>
                </div>
                {/* Current concept (indigo, animated) */}
                <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-300 rounded-full px-3 py-1.5 shrink-0 ring-2 ring-indigo-100 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                  <span className="font-sans text-[10px] font-bold text-indigo-800">ئۆکسان و داڕزان</span>
                </div>
                {/* Upcoming (slate) */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                  <span className="font-sans text-[10px] text-slate-400">هاوسەنگیی کیمیایی</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Mode Views */}
        <div
          role="log"
          aria-live="polite"
          aria-label="پەیامەکانی مامۆستا زانا"
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3"
        >

          {/* ════════════════════════════════════════════════════════════════
              WORKSPACE MODE PANELS (Features 3 & 4 live here)
              ════════════════════════════════════════════════════════════════ */}
          {viewMode === "workspace" && (
            <div className="space-y-4">

              {/* ─── Feature 3: Interactive Formula Board ──────────────────────────── */}
              {activeAction === "formula" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                  {/* Header & Filter Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-sans font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-indigo-600" />
                        <span>تەختەی هاوکێشە و یاسا زانستییەکان</span>
                      </h4>
                      <p className="font-sans text-xs text-slate-500">
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
                              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
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
                      className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                          className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3 text-right"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-sans font-bold text-xs text-slate-800 flex items-center gap-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                                {item.subjectLabel}
                              </span>
                              <span>{item.title}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* Copy Formula Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  void navigator.clipboard?.writeText(item.formula);
                                  setCopiedFormulaId(item.id);
                                  setTimeout(() => setCopiedFormulaId(null), 2000);
                                }}
                                className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 cursor-pointer transition"
                                title="کۆپیکردنی هاوکێشە"
                              >
                                {copiedFormulaId === item.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Ask Tutor About Formula */}
                              <button
                                type="button"
                                onClick={() => {
                                  setInputContent(`مامۆستا زانا، تکایە یاسای "${item.title}" (${item.formula}) بە وردی لەگەڵ نموونەیەکی پرسیاری وەزاری بۆم شیکار بکە.`);
                                  setViewMode("tutor");
                                }}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold font-sans flex items-center gap-1 border border-indigo-200 cursor-pointer transition"
                              >
                                <span>شیکردنەوە لە چات</span>
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Code-style formula box */}
                          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                            <p className="font-mono text-base font-bold text-indigo-800 tracking-wide dir-ltr">
                              {item.formula}
                            </p>
                          </div>

                          {/* Variables Table */}
                          <div className="divide-y divide-slate-100 border border-slate-200 bg-white rounded-lg overflow-hidden text-xs">
                            {item.variables.map((v, vIdx) => (
                              <div
                                key={vIdx}
                                className="flex items-center justify-between px-3 py-1.5"
                              >
                                <span className="font-mono font-bold text-indigo-600 dir-ltr">{v.sym}</span>
                                <span className="font-sans text-slate-700">{v.name}</span>
                                <span className="font-sans text-[11px] text-slate-400 font-mono">{v.unit}</span>
                              </div>
                            ))}
                          </div>

                          <p className="font-sans text-[11px] text-slate-500 leading-relaxed border-t border-slate-200 pt-2">
                            💡 {item.note}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ─── Feature 4: Summary Panel ──────────────────────────── */}
              {activeAction === "summary" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-sans font-bold text-sm text-slate-800">
                      پوختەی بەندی {activeChapter?.id}: {chapterData.chapterTitle}
                    </h3>
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
                      لاپەڕە {chapterData.pages}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {chapterData.summary}
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <span className="text-xs font-bold text-slate-700 block">گرنگترین خاڵ و چەمکەکان:</span>
                    {chapterData.keyConcepts.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800">{item.title}: </span>
                          <span className="font-sans text-xs text-slate-600 leading-relaxed">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Official Curriculum Book Viewer Panel ─────────────────────── */}
              {activeAction === "book" && (
                <div className="space-y-4">
                  {currentSubject === "physics" ? (
                    <Grade12PhysicsBookViewer
                      onSelectTopicForStudy={(title, pages) => {
                        setInputContent(`مامۆستا زانا، دەمەوێت لەسەر "${title}" (${pages}) بخوێنم و بە وردی لەگەڵ نموونەی پرسیاری وەزاری بۆم شیبکەیتەوە.`);
                        setViewMode("tutor");
                      }}
                      onNavigateToChat={() => setViewMode("tutor")}
                    />
                  ) : currentSubject === "math" || currentSubject === "mathematics" ? (
                    profile?.stream === "literary" ? (
                      <Grade12LiteraryMathBookViewer
                        onSelectTopicForStudy={(title, pages) => {
                          setInputContent(`مامۆستا زانا، دەمەوێت لەسەر "${title}" (${pages}) بخوێنم و بە وردی لەگەڵ نموونەی پرسیاری وەزاری بۆم شیبکەیتەوە.`);
                          setViewMode("tutor");
                        }}
                        onNavigateToChat={() => setViewMode("tutor")}
                      />
                    ) : (
                      <Grade12MathBookViewer
                        onSelectTopicForStudy={(title, pages) => {
                          setInputContent(`مامۆستا زانا، دەمەوێت لەسەر "${title}" (${pages}) بخوێنم و بە وردی لەگەڵ نموونەی پرسیاری وەزاری بۆم شیبکەیتەوە.`);
                          setViewMode("tutor");
                        }}
                        onNavigateToChat={() => setViewMode("tutor")}
                      />
                    )
                  ) : currentSubject === "kurdish" ? (
                    <Grade12KurdishBookViewer
                      onSelectTopicForStudy={(title, pages) => {
                        setInputContent(`مامۆستا زانا، دەمەوێت لەسەر "${title}" (${pages}) بخوێنم و بە وردی لەگەڵ نموونەی پرسیاری وەزاری بۆم شیبکەیتەوە.`);
                        setViewMode("tutor");
                      }}
                      onNavigateToChat={() => setViewMode("tutor")}
                    />
                  ) : currentSubject === "arabic" ? (
                    <Grade12ArabicBookViewer
                      onSelectTopicForStudy={(title, pages) => {
                        setInputContent(`مامۆستا زانا، دەمەوێت لەسەر "${title}" (${pages}) بخوێنم و بە وردی لەگەڵ نموونەی پرسیاری وەزاری بۆم شیبکەیتەوە.`);
                        setViewMode("tutor");
                      }}
                      onNavigateToChat={() => setViewMode("tutor")}
                    />
                  ) : currentSubject === "history" ? (
                    <Grade12HistoryBookViewer
                      onSelectTopicForStudy={(title, pages) => {
                        setInputContent(`مامۆستا زانا، دەمەوێت لەسەر "${title}" (${pages}) بخوێنم و بە وردی لەگەڵ نموونەی پرسیاری وەزاری بۆم شیبکەیتەوە.`);
                        setViewMode("tutor");
                      }}
                      onNavigateToChat={() => setViewMode("tutor")}
                    />
                  ) : currentSubject === "economy" ? (
                    <Grade12EconomicsBookViewer
                      onSelectTopicForStudy={(title, pages) => {
                        setInputContent(`مامۆستا زانا، دەمەوێت لەسەر "${title}" (${pages}) بخوێنم و بە وردی لەگەڵ نموونەی پرسیاری وەزاری بۆم شیبکەیتەوە.`);
                        setViewMode("tutor");
                      }}
                      onNavigateToChat={() => setViewMode("tutor")}
                    />
                  ) : currentSubject === "geography" ? (
                    <Grade12GeographyBookViewer
                      onSelectTopicForStudy={(title, pages) => {
                        setInputContent(`مامۆستا زانا، دەمەوێت لەسەر "${title}" (${pages}) بخوێنم و بە وردی لەگەڵ نموونەی پرسیاری وەزاری بۆم شیبکەیتەوە.`);
                        setViewMode("tutor");
                      }}
                      onNavigateToChat={() => setViewMode("tutor")}
                    />
                  ) : currentSubject === "sports" ? (
                    <Grade12SportsBookViewer
                      onSelectTopicForStudy={(title, pages) => {
                        setInputContent(`مامۆستا زانا، دەمەوێت لەسەر "${title}" (${pages}) بخوێنم و بە وردی لەگەڵ نموونەی پرسیاری وەزاری بۆم شیبکەیتەوە.`);
                        setViewMode("tutor");
                      }}
                      onNavigateToChat={() => setViewMode("tutor")}
                    />
                  ) : currentSubject === "english" ? (
                    <Grade12EnglishBookViewer
                      onSelectTopicForStudy={(title, pages) => {
                        setInputContent(`مامۆستا زانا، دەمەوێت لەسەر "${title}" (${pages}) بخوێنم و بە وردی لەگەڵ نموونەی پرسیاری وەزاری بۆم شیبکەیتەوە.`);
                        setViewMode("tutor");
                      }}
                      onNavigateToChat={() => setViewMode("tutor")}
                    />
                  ) : (
                    <Grade12ChemistryBookViewer
                      onSelectTopicForStudy={(title, pages) => {
                        setInputContent(`مامۆستا زانا، دەمەوێت لەسەر "${title}" (${pages}) بخوێنم و بە وردی لەگەڵ نموونەی پرسیاری وەزاری بۆم شیبکەیتەوە.`);
                        setViewMode("tutor");
                      }}
                      onNavigateToChat={() => setViewMode("tutor")}
                    />
                  )}
                </div>
              )}

              {/* Workspace Action: Vision Question Solver */}
              {activeAction === "vision" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-sans font-bold text-base text-slate-900">
                        چارەسەرکەری وێنەی پرسیار (Camera OCR Solver)
                      </h3>
                      <p className="font-sans text-xs text-slate-500">
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
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-bold text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      ڕوونکردنەوەی چەمک • بەندی {activeChapter?.id}
                    </span>
                    <span className="text-xs text-slate-400 font-sans">
                      لاپەڕە {chapterData.pages}
                    </span>
                  </div>
                  <h3 className="font-sans font-bold text-lg text-slate-900">
                    {chapterData.chapterTitle}
                  </h3>
                  <p className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 text-sm leading-relaxed">
                    {chapterData.summary}
                  </p>
                  {chapterData.keyConcepts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-slate-900">چەمکە سەرەکییەکان:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {chapterData.keyConcepts.map((c, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-1">
                            <span className="font-bold text-xs text-indigo-700 block">{c.title}</span>
                            <p className="text-xs text-slate-600 leading-normal">{c.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {chapterData.solvedExample && (
                    <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                      <h4 className="font-bold text-xs text-emerald-900">نموونەی شیکارکراوی وەزاری:</h4>
                      <p className="font-bold text-xs text-slate-800">{chapterData.solvedExample.question}</p>
                      <div className="bg-white p-3 rounded-lg border border-emerald-100 text-xs text-slate-700 space-y-1 leading-relaxed">
                        <span className="font-sans font-bold text-emerald-700 block mb-1">هەنگاوەکانی شیکار:</span>
                        {chapterData.solvedExample.steps.map((st, sIdx) => (
                          <div key={sIdx} className="text-slate-600">{st}</div>
                        ))}
                        <div className="pt-1 font-bold text-emerald-800 font-sans">ئەنجام: {chapterData.solvedExample.result}</div>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setInputContent(`مامۆستا زانا، دەمەوێت لەسەر «${chapterData.chapterTitle}» پرسیار بکەم و پێکەوە تاوتوێی بکەین.`);
                      setViewMode("tutor");
                    }}
                    className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-indigo-200 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>گفتوگۆ لەگەڵ مامۆستا زانا لەسەر ئەم چەمکە</span>
                  </button>
                </div>
              )}

              {/* Workspace Action: Practice (ڕاهێنانی کارلێککارانەی وانەکە) */}
              {activeAction === "practice" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-bold text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      ڕاهێنانی وانە • {activeChapter?.title}
                    </span>
                    <span className="text-xs text-slate-400 font-sans">
                      هەنگاو {practiceStepIndex + 1} لە {practiceSteps.length || 1}
                    </span>
                  </div>
                  {practiceSteps.length > 0 && practiceSteps[practiceStepIndex] ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                          پرسیاری هەنگاوبەندی:
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {practiceSteps[practiceStepIndex].stepTitle}
                        </h4>
                        <p className="text-xs text-slate-700">
                          {practiceSteps[practiceStepIndex].question || practiceSteps[practiceStepIndex].problem}
                        </p>
                      </div>

                      {/* Input for practice */}
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={stepAnswerInput}
                          onChange={(e) => setStepAnswerInput(e.target.value)}
                          placeholder="وەڵام یان ژمارە لێرە بنووسە..."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
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
                              className="px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold rounded-xl text-xs cursor-pointer"
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
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {stepFeedback.message}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      هیچ ڕاهێنانێک بۆ ئەم بەشە تۆمار نەکراوە.
                    </div>
                  )}
                </div>
              )}

              {/* Workspace Action: Ask (ڕێبەری پرسیارکردنی سوقراتی) */}
              {activeAction === "ask" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-bold text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      پرسیاری سوقراتی و وەزاری • بەندی {activeChapter?.id}
                    </span>
                  </div>
                  <h3 className="font-sans font-bold text-sm text-slate-900">
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
                        className="w-full text-right p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 bg-slate-50 text-xs font-medium text-slate-800 flex items-center justify-between group cursor-pointer transition-all"
                      >
                        <span>{prompt}</span>
                        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 transition-transform group-hover:-translate-x-1" />
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
              {/* MODE 1: Socratic Ask (Chat) */}
              {currentMode === "ask" && (
                <>
                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-7 h-7" />
                      </div>
                      <p className="font-sans text-sm text-slate-600 max-w-sm leading-relaxed">
                        سڵاو! من مامۆستا زانام. پرسیارێکت لەسەر {activeChapter?.title || "ئەم بەندە"} بپرسە، یاخود وێنەی پرسیارەکەت بگرە تاوەکو پێکەوە شیبکەینەوە.
                      </p>
                    </div>
                  )}

                  {chatMessages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} />
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-2.5 my-2 justify-start" dir="rtl">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-xs flex items-center gap-2">
                        <Spinner size="sm" />
                        <span className="font-sans text-xs text-slate-500 font-medium">
                          مامۆستا زانا بیر دەکاتەوە و وەڵامت دەداتەوە...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Socratic Progressive Hint Card */}
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 my-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-indigo-900 font-sans">
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
                      className="shrink-0 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 cursor-pointer mr-2 shadow-2xs"
                    >
                      {hintLevel === 0 ? "تێبینی یەکەم" : hintLevel < progressiveHints.length ? `تێبینی ${hintLevel + 1}` : "دووبارە"}
                    </button>
                  </div>

                  <div ref={messagesEndRef} />
                </>
              )}

              {/* MODE 2: Rich Educational Explain */}
              {currentMode === "explain" && (
                <div className="space-y-4 max-w-3xl mx-auto py-2">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="font-bold text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
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

                    <h3 className="font-sans font-bold text-lg text-slate-900">
                      {chapterData.chapterTitle}
                    </h3>

                    <div className="space-y-4 font-sans text-sm text-slate-700 leading-relaxed">
                      {/* Chapter Overview Text */}
                      <p className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 text-slate-800 leading-relaxed">
                        {chapterData.summary}
                      </p>

                      {/* Key Concepts Grid */}
                      {chapterData.keyConcepts.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <h4 className="font-bold text-xs text-slate-900">چەمک و زانیارییە سەرەکییەکان:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {chapterData.keyConcepts.map((concept, idx) => (
                              <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                                <span className="font-bold text-xs text-indigo-700 block">{concept.title}</span>
                                <p className="text-xs text-slate-600 leading-normal">{concept.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Formulas / Rules Box */}
                      {chapterData.formulas.length > 0 && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                          <h4 className="font-bold text-xs text-slate-900">یاسا و دەستوورە سەرەکییەکان:</h4>
                          <div className="space-y-2">
                            {chapterData.formulas.map((f, idx) => (
                              <div key={idx} className="space-y-1">
                                <span className="text-[11px] font-bold text-slate-600">{f.title}:</span>
                                <p className="font-mono text-left dir-ltr bg-white p-2 rounded-lg border border-slate-200 text-indigo-700 font-bold text-sm">
                                  {f.formula}
                                </p>
                                {f.note && <p className="text-[11px] text-slate-500">{f.note}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Solved Ministerial Example */}
                      <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs text-slate-800 space-y-2">
                        <span className="font-bold text-emerald-900 block text-sm">نموونەی شیکارکراوی پڕۆگرامی وەزارەت:</span>
                        <p className="font-bold text-slate-900">{chapterData.solvedExample.question}</p>
                        <div className="space-y-1 pt-1 text-slate-700">
                          {chapterData.solvedExample.steps.map((st, idx) => (
                            <p key={idx}>{st}</p>
                          ))}
                        </div>
                        <p className="font-bold text-emerald-800 pt-1 border-t border-emerald-200/60">
                          {chapterData.solvedExample.result}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setInputContent(`مامۆستا زانا، تکایە کورتەی بەندی ${activeChapter?.id} (${activeChapter?.title}) و گرنگترین خاڵەکانی تاقیکردنەوەی وەزاریم بۆ ڕوونبکەرەوە.`);
                          setCurrentMode("ask");
                        }}
                        className="text-xs font-bold text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
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
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-xs text-slate-800">
                          شیکارکەری هەنگاو بە هەنگاو (Drill)
                        </span>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        هەنگاوی {practiceStepIndex + 1} لە {practiceSteps.length}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-1">
                      <span className="font-bold text-slate-500">کێشەی سەرەکی:</span>
                      <p className="font-sans font-bold text-sm text-slate-900">
                        {practiceSteps[practiceStepIndex]?.problem}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-sans font-bold text-sm text-indigo-900">
                        {practiceSteps[practiceStepIndex]?.stepTitle}
                      </h4>
                      <p className="font-sans text-xs text-slate-700">
                        {practiceSteps[practiceStepIndex]?.question}
                      </p>

                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={stepAnswerInput}
                          onChange={(e) => setStepAnswerInput(e.target.value)}
                          placeholder="وەڵامی ژمارەیی یان تەواو بنووسە..."
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-red-50 border-red-200 text-red-800"
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
                        : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
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

        {/* 6. Sticky Chat Input Area (Shown in Ask mode or when user wants to query) */}
        {viewMode === "tutor" && currentMode === "ask" && (
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shadow-2xs">
            {/* ─── Feature 6: Quick Prompt Chips ──────────────────────── */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
              <button
                onClick={() => handleQuickPrompt(`مامۆستا زانا، ڕاهێنانی وانەی بەندی ${activeChapter?.id || 1}م بۆ بکە`)}
                className="shrink-0 flex items-center gap-1 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-[11px] font-sans font-bold shadow-2xs transition-colors cursor-pointer text-indigo-700 hover:bg-indigo-50 min-h-[36px]"
              >
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                <span>🏆 ڕاهێنانی وانە</span>
              </button>

              <button
                onClick={() => handleQuickPrompt(`مامۆستا زانا، تکایە چەمکە سەرەکییەکانی بەندی ${activeChapter?.id || 1}م بۆ ڕوون بکەرەوە بە شێوازی سوقراتی`)}
                className="shrink-0 flex items-center gap-1 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-[11px] font-sans font-medium shadow-2xs transition-colors cursor-pointer text-amber-700 hover:bg-amber-50 min-h-[36px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>✨ شیکردنەوەی سوقراتی</span>
              </button>

              <button
                onClick={() => handleQuickPrompt(`هەڵە تێگەیشتنە باوەکانی قوتابیان لەسەر بەندی ${activeChapter?.id || 1} چین؟`)}
                className="shrink-0 flex items-center gap-1 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-[11px] font-sans font-medium shadow-2xs transition-colors cursor-pointer text-rose-700 hover:bg-rose-50 min-h-[36px]"
              >
                <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>❓ هەڵە باوەکان</span>
              </button>

              <button
                onClick={() => handleQuickPrompt(`یاسا و هاوکێشە سەرەکییەکانی پەیوەست بە بەندی ${activeChapter?.id || 1} چین؟`)}
                className="shrink-0 flex items-center gap-1 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-[11px] font-sans font-medium shadow-2xs transition-colors cursor-pointer text-indigo-700 hover:bg-indigo-50 min-h-[36px]"
              >
                <Brain className="w-3.5 h-3.5 text-indigo-500" />
                <span>🧠 هاوکێشە و یاساکان</span>
              </button>
            </div>

            {/* Live Voice Recording Status Badge */}
            {isListening && (
              <div className="flex items-center justify-between bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2 rounded-xl text-xs mb-2 shadow-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span className="font-bold shrink-0">گوێ دەگرێت... بە کوردی قسە بکە</span>
                  {interimTranscript && (
                    <span className="text-slate-700 bg-white/90 border border-rose-100 px-2 py-0.5 rounded text-[11px] truncate max-w-[200px] sm:max-w-md">
                      «{interimTranscript}»
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={stopListening}
                  className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-white border border-rose-200 px-2.5 py-1 rounded-lg shadow-2xs cursor-pointer transition-colors"
                >
                  <Square className="w-3 h-3 fill-current text-rose-600" />
                  <span>تەواوکردن</span>
                </button>
              </div>
            )}

            {speechErrorToast && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-2 rounded-xl text-xs mb-2">
                <span>{speechErrorToast}</span>
                <button
                  type="button"
                  onClick={() => setSpeechErrorToast(null)}
                  className="text-amber-600 hover:text-amber-800 font-bold px-1.5 cursor-pointer"
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
              className="flex items-end gap-2 max-w-4xl mx-auto"
            >
              {/* Camera Button */}
              <button
                type="button"
                onClick={() => setShowCameraModal(true)}
                className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 transition-colors cursor-pointer"
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
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                  isListening
                    ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 animate-pulse shadow-md shadow-rose-200"
                    : "bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border-slate-200"
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
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={
                    isTrialExpired
                      ? "تاقیکردنەوەی ٣ ڕۆژەکەت بەسەرچوو. تکایە بەشداری بکە..."
                      : isListening
                      ? "دەنگت تۆمار دەکرێت..."
                      : "پرسیارت لەسەر ئەم بەندە بپرسە (سوقراتی)..."
                  }
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-sans text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all max-h-32 leading-relaxed"
                  disabled={isLoading || isTrialExpired}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || isTrialExpired || (!inputContent.trim() && !isListening)}
                className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center shrink-0 shadow-xs transition-colors cursor-pointer"
                aria-label={ku.chat.send}
              >
                {isLoading ? (
                  <Spinner size="sm" className="!border-white !border-t-transparent" />
                ) : (
                  <Send className="w-5 h-5 -rotate-90 rtl:rotate-90" />
                )}
              </button>
            </form>
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
        userId={user?.id || profile?.id || ""}
        userName={user?.name || profile?.name || ""}
        userEmail={user?.email || ""}
      />
    </div>
  );
}

export default Chat;
