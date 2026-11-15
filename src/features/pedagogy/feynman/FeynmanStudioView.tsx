import React, { useState } from "react";
import {
  BookOpen,
  Award,
  Send,
  Lightbulb,
  AlertTriangle,
  UserCheck,
  GraduationCap,
  Mic,
  MicOff,
} from "lucide-react";
import {
  FeynmanDialogueMessage,
  ConceptualClarityScore
} from "./feynmanTypes.ts";
import { FEYNMAN_CONCEPTS_CATALOG, FeynmanEngine } from "./FeynmanEngine.ts";
import { useSoundEffects } from "../../../hooks/useSoundEffects.ts";
import { useSpeechToText } from "../../../hooks/useSpeechToText.ts";

export interface FeynmanStudioViewProps {
  onAwardXp?: (amount: number) => void;
  onClose?: () => void;
  embedded?: boolean;
}

export function FeynmanStudioView({ onAwardXp, onClose, embedded = false }: FeynmanStudioViewProps) {
  const { playSuccess } = useSoundEffects();
  const [selectedConceptIndex, setSelectedConceptIndex] = useState(0);
  const currentConcept = FEYNMAN_CONCEPTS_CATALOG[selectedConceptIndex] || FEYNMAN_CONCEPTS_CATALOG[0];

  const [notes, setNotes] = useState("");
  const [inputExplanation, setInputExplanation] = useState("");
  const [dialogue, setDialogue] = useState<FeynmanDialogueMessage[]>([
    {
      id: "initial-msg",
      sender: "protege",
      text: `سڵاو مامۆستا! دەمەوێت لەسەر «${currentConcept.titleKu}» فێرببم. دەتوانیت بە سادەیی و بە وشەی خۆت پێم بڵێیت ئەم یاسایە چییە و لەبەرچی کار دەکات؟`,
      timestamp: Date.now(),
    },
  ]);

  const [clarityResult, setClarityResult] = useState<ConceptualClarityScore | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    isListening,
    startListening,
    stopListening,
    isSupported: isSpeechSupported,
    error: speechError,
  } = useSpeechToText({
    onResult: (text) => {
      setInputExplanation(text);
    },
  });

  const handleSelectConcept = (index: number) => {
    setSelectedConceptIndex(index);
    const concept = FEYNMAN_CONCEPTS_CATALOG[index];
    setDialogue([
      {
        id: `concept-intro-${index}`,
        sender: "protege",
        text: `سڵاو مامۆستا! دەمەوێت لەسەر «${concept.titleKu}» فێرببم. دەتوانیت بە سادەیی و بە وشەی خۆت پێم بڵێیت ئەم یاسایە چییە و لەبەرچی کار دەکات؟`,
        timestamp: Date.now(),
      },
    ]);
    setClarityResult(null);
    setInputExplanation("");
  };

  const handleSendExplanation = () => {
    if (!inputExplanation.trim() || isSubmitting) return;

    const studentText = inputExplanation.trim();
    setInputExplanation("");

    const studentMsg: FeynmanDialogueMessage = {
      id: "stud-" + Date.now(),
      sender: "student",
      text: studentText,
      timestamp: Date.now(),
    };

    setDialogue((prev) => [...prev, studentMsg]);
    setIsSubmitting(true);

    setTimeout(() => {
      const evaluation = FeynmanEngine.evaluateClarity(
        studentText,
        currentConcept,
        dialogue.length
      );

      setClarityResult(evaluation);

      const protegeReply: FeynmanDialogueMessage = {
        id: "prot-" + Date.now(),
        sender: "protege",
        text: `زۆر سوپاس مامۆستا! تێگەیشتم، بەڵام: ${evaluation.nextQuestionFromProtégéKu}`,
        timestamp: Date.now(),
        critiqueBadge: evaluation.clarityLevelKu,
      };

      setDialogue((prev) => [...prev, protegeReply]);
      setIsSubmitting(false);

      if (evaluation.scorePercent >= 75) {
        playSuccess();
        if (onAwardXp) onAwardXp(20);
      }
    }, 700);
  };

  return (
    <div
      className={
        embedded
          ? "w-full flex flex-col space-y-6"
          : "flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full"
      }
      dir="rtl"
    >
      {/* Header - Only in standalone modal mode */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>ستۆدیۆی فاینمان (The Feynman Studio) • فێربە بە فێرکردن</span>
            </div>
            <h1 className="font-sans font-black text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">
              ڕۆڵی مامۆستا ببینە و زانستی پێ بڵێ
            </h1>
            <p className="font-sans text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              چەمکە ئاڵۆزەکانی پۆلی ١٢ بە زمانی سادە بۆ فێرخوازێکی تازەکار ڕوونبکەرەوە تا قووڵیی تێگەیشتنت دەربکەوێت
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="self-start sm:self-center px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              گەڕانەوە
            </button>
          )}
        </div>
      )}

      {/* Concept Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-bold text-slate-400 shrink-0">بابەتەکان:</span>
        {FEYNMAN_CONCEPTS_CATALOG.map((concept, idx) => (
          <button
            key={concept.id}
            onClick={() => handleSelectConcept(idx)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedConceptIndex === idx
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{concept.titleKu}</span>
          </button>
        ))}
      </div>

      {/* Split Stage: Right Whiteboard & Notes, Left Protégé Interactive Dialogue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Right Column: Whiteboard & Conceptual Reference (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Concept Reference Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                {currentConcept.chapterKu}
              </span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                پۆلی {currentConcept.grade}
              </span>
            </div>

            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {currentConcept.titleKu}
            </h3>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <span className="font-bold text-[10px] text-slate-400 block">پێناسەی فەرمیی پەڕتووک:</span>
              <p className="leading-relaxed">{currentConcept.standardDefinitionKu}</p>
            </div>

            {/* Analogy Suggestions */}
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>نموونە و چواندنی بەرجەستە (هاوکاری بۆ ڕوونکردنەوە):</span>
              </div>
              <ul className="list-disc list-inside text-amber-900 dark:text-amber-200 space-y-1">
                {currentConcept.analogyExamplesKu.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Student Scratchpad / Whiteboard */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex-1 flex flex-col space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              تەختەی ڕەشنووس و تێبینی مامۆستا 📝
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="بیرۆکەکانت لێرە ڕێکبخە پێش ئەوەی بە وەڵام بۆ فێرخوازەکەی بنێریت..."
              className="w-full flex-1 min-h-[120px] p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
            />
          </div>
        </div>

        {/* Left Column: Interactive Dialogue with Protégé (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Protégé Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  فێرخوازی تازەکار (Zana Protégé)
                </span>
                <span className="text-[10px] text-slate-400 block">
                  خولیای تێگەیشتنی قووڵ بە زمانی سادە
                </span>
              </div>
            </div>

            {clarityResult && (
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900">
                <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                  نمرەی فاینمان: {clarityResult.scorePercent}%
                </span>
              </div>
            )}
          </div>

          {/* Dialogue Messages Stream */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 min-h-[300px] max-h-[460px]">
            {dialogue.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "student" ? "items-start" : "items-end"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === "student"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {msg.critiqueBadge && (
                  <span className="mt-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                    ئاستی وەڵام: {msg.critiqueBadge}
                  </span>
                )}
              </div>
            ))}

            {isSubmitting && (
              <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
                <span>فێرخوازەکە بیردەکاتەوە لە ڕوونکردنەوەکەت...</span>
              </div>
            )}
          </div>

          {/* Clarity & Gap Feedback Bar (if evaluated) */}
          {clarityResult && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  شیکاریی فاینمان: {clarityResult.clarityLevelKu}
                </span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {clarityResult.scorePercent}% ڕوونی چەمک
                </span>
              </div>

              {clarityResult.logicalGapsIdentified.length > 0 && (
                <div className="text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>کەلێنی مەنتقی: {clarityResult.logicalGapsIdentified[0]}</span>
                </div>
              )}
            </div>
          )}

          {/* Voice status indicator */}
          {isListening && (
            <div className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 border-t border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>مایکرۆفۆن چالاکە: بە دەنگ یاساکە ڕوونبکەرەوە، زانا ڕاستەوخۆ دەیکاتە دەق...</span>
              </span>
              <button
                type="button"
                onClick={stopListening}
                className="text-[11px] underline text-rose-800 dark:text-rose-200 font-normal cursor-pointer"
              >
                تەواوکردن
              </button>
            </div>
          )}

          {speechError && (
            <div className="px-3 py-1 bg-amber-50 text-amber-800 text-[11px] border-t border-amber-200">
              {speechError}
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
            <textarea
              rows={2}
              value={inputExplanation}
              onChange={(e) => setInputExplanation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (isListening) stopListening();
                  handleSendExplanation();
                }
              }}
              placeholder="بە زمانی سادەی خۆت یاساکەی بۆ ڕوونبکەرەوە (وەک ئەوەی بۆ کەسێکی نائاشنا قسە بکەیت)..."
              className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans"
            />

            {/* Voice Input Button */}
            {isSpeechSupported && (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                title={isListening ? "ڕاگرتنی تۆمارکردنی دەنگ" : "شیکردنەوە بە دەنگ (Voice Recording)"}
                className={`h-11 w-11 shrink-0 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                  isListening
                    ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 shadow-md animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={() => {
                if (isListening) stopListening();
                handleSendExplanation();
              }}
              disabled={!inputExplanation.trim() || isSubmitting}
              className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>فێرکردن</span>
              <Send className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
