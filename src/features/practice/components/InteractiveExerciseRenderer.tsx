import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  RotateCcw,
  MoveUp,
  MoveDown,
  Layers,
  Network,
  ListOrdered,
  FileEdit,
  Check,
  CheckCircle,
  XCircle,
  Calculator,
  GripVertical,
} from "lucide-react";
import { useSoundEffects } from "../../../hooks/useSoundEffects.ts";
import { ConfidenceFeedbackCard } from "../../../components/ConfidenceFeedbackCard.tsx";
import {
  ConfidenceFeedbackEngine,
  ConfidenceFeedback
} from "../../feedback/ConfidenceFeedbackEngine.ts";

// ─── 1. FILL IN THE BLANKS TYPES ──────────────────────────────────────────────
export interface FillInBlankExercise {
  type: "fill_in_blank";
  id: string;
  subject?: string;
  topicKu: string;
  instructionKu: string;
  // Template with tokens like "{1}", "{2}"
  sentenceTemplateKu: string;
  blanks: {
    id: number;
    expectedAnswer: string;
    acceptedAnswers?: string[];
    hintKu: string;
  }[];
  wordBankKu: string[]; // Options to pick from
  explanationKu: string;
}

// ─── 2. MATCHING EXERCISE TYPES ───────────────────────────────────────────────
export interface MatchingPair {
  id: string;
  leftKu: string;
  rightKu: string;
}

export interface MatchingExercise {
  type: "matching";
  id: string;
  subject?: string;
  topicKu: string;
  instructionKu: string;
  pairs: MatchingPair[];
  explanationKu: string;
}

// ─── 3. ORDERING EXERCISE TYPES ───────────────────────────────────────────────
export interface OrderingExercise {
  type: "ordering";
  id: string;
  subject?: string;
  topicKu: string;
  instructionKu: string;
  initialItems: { id: string; textKu: string; correctIndex: number }[];
  explanationKu: string;
}

// ─── 4. CONCEPT MAPPING TYPES ─────────────────────────────────────────────────
export interface ConceptNode {
  id: string;
  titleKu: string;
  roleKu: "center" | "law" | "example" | "application";
  descriptionKu: string;
  connectedTo: string[];
}

export interface ConceptMapExercise {
  type: "concept_map";
  id: string;
  subject?: string;
  topicKu: string;
  instructionKu: string;
  centralThemeKu: string;
  nodes: ConceptNode[];
  challengeQuestionKu: string;
  challengeOptionsKu: string[];
  correctOptionIndex: number;
  explanationKu: string;
}

// ─── 5. TRUE / FALSE EXERCISE TYPES ───────────────────────────────────────────
export interface TrueFalseExercise {
  type: "true_false";
  id: string;
  subject?: string;
  topicKu: string;
  instructionKu: string;
  statementKu: string;
  isTrue: boolean;
  explanationKu: string;
  hintKu?: string;
}

// ─── 6. NUMERICAL EXERCISE TYPES ──────────────────────────────────────────────
export interface NumericalExercise {
  type: "numerical";
  id: string;
  subject?: string;
  topicKu: string;
  instructionKu: string;
  problemKu: string;
  expectedNumber: number;
  tolerance?: number;
  unitKu?: string;
  formulaKu?: string;
  explanationKu: string;
  hintKu?: string;
}

export type ExerciseType =
  | "fill_in_blank"
  | "matching"
  | "ordering"
  | "concept_map"
  | "true_false"
  | "numerical";

export type AnyInteractiveExercise =
  | FillInBlankExercise
  | MatchingExercise
  | OrderingExercise
  | ConceptMapExercise
  | TrueFalseExercise
  | NumericalExercise;

export interface InteractiveExerciseRendererProps {
  exercise: AnyInteractiveExercise;
  onComplete?: (isSuccess: boolean) => void;
  className?: string;
}

export const InteractiveExerciseRenderer: React.FC<InteractiveExerciseRendererProps> = ({
  exercise,
  onComplete,
  className = "",
}) => {
  const { playSuccess, playError, playInteraction } = useSoundEffects();
  const [feedback, setFeedback] = useState<ConfidenceFeedback | null>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // STATE: Fill in the Blanks
  // ───────────────────────────────────────────────────────────────────────────
  const [blankInputs, setBlankInputs] = useState<Record<number, string>>({});

  // ───────────────────────────────────────────────────────────────────────────
  // STATE: Matching
  // ───────────────────────────────────────────────────────────────────────────
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({}); // leftId -> rightId

  // ───────────────────────────────────────────────────────────────────────────
  // STATE: Ordering
  // ───────────────────────────────────────────────────────────────────────────
  const [orderedItems, setOrderedItems] = useState(() => {
    if (exercise.type === "ordering") {
      return [...exercise.initialItems].sort(() => Math.random() - 0.5);
    }
    return [];
  });
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // STATE: Concept Map
  // ───────────────────────────────────────────────────────────────────────────
  const [activeConceptNodeId, setActiveConceptNodeId] = useState<string | null>(() => {
    if (exercise.type === "concept_map") {
      return exercise.nodes[0]?.id || null;
    }
    return null;
  });
  const [selectedMapOption, setSelectedMapOption] = useState<number | null>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // STATE: True / False
  // ───────────────────────────────────────────────────────────────────────────
  const [selectedTrueFalse, setSelectedTrueFalse] = useState<boolean | null>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // STATE: Numerical
  // ───────────────────────────────────────────────────────────────────────────
  const [numericalInput, setNumericalInput] = useState<string>("");

  // Reset exercise state
  const handleReset = () => {
    setFeedback(null);
    setBlankInputs({});
    setSelectedLeft(null);
    setMatches({});
    if (exercise.type === "ordering") {
      setOrderedItems([...exercise.initialItems].sort(() => Math.random() - 0.5));
    }
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
    setSelectedMapOption(null);
    setSelectedTrueFalse(null);
    setNumericalInput("");
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 1. EVALUATION: Fill in the Blank
  // ───────────────────────────────────────────────────────────────────────────
  const evaluateFillInBlank = (fib: FillInBlankExercise) => {
    let allCorrect = true;
    let wrongBlankHint = "";

    for (const b of fib.blanks) {
      const userVal = (blankInputs[b.id] || "").trim().toLowerCase();
      const expected = b.expectedAnswer.trim().toLowerCase();
      const accepted = (b.acceptedAnswers || []).map((a) => a.trim().toLowerCase());

      if (userVal !== expected && !accepted.includes(userVal)) {
        allCorrect = false;
        wrongBlankHint = b.hintKu;
        break;
      }
    }

    const confFeedback = ConfidenceFeedbackEngine.generateFeedback({
      isCorrect: allCorrect,
      userAnswer: Object.values(blankInputs).join(", "),
      expectedAnswer: fib.blanks.map((b) => b.expectedAnswer).join(", "),
      subject: "زانست",
      topic: fib.topicKu,
      explanation: fib.explanationKu,
      hint: wrongBlankHint,
    });

    setFeedback(confFeedback);
    if (allCorrect) {
      playSuccess();
      onComplete?.(true);
    } else {
      playError();
      onComplete?.(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 2. EVALUATION: Matching
  // ───────────────────────────────────────────────────────────────────────────
  const evaluateMatching = (matchEx: MatchingExercise) => {
    let allCorrect = true;
    for (const pair of matchEx.pairs) {
      if (matches[pair.id] !== pair.id) {
        allCorrect = false;
        break;
      }
    }

    const confFeedback = ConfidenceFeedbackEngine.generateFeedback({
      isCorrect: allCorrect,
      userAnswer: `${Object.keys(matches).length} هاوتاکراو`,
      expectedAnswer: `${matchEx.pairs.length} هاوتاکراوی تەواو`,
      subject: "زانست",
      topic: matchEx.topicKu,
      explanation: matchEx.explanationKu,
      hint: "سەیری پێناسە و نموونەی سەرەکی هەر زاراوەیەک بکە لە ستوونی دەستە چەپدا.",
    });

    setFeedback(confFeedback);
    if (allCorrect) {
      playSuccess();
      onComplete?.(true);
    } else {
      playError();
      onComplete?.(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 3. EVALUATION: Ordering
  // ───────────────────────────────────────────────────────────────────────────
  const evaluateOrdering = (ordEx: OrderingExercise) => {
    const isSequential = orderedItems.every(
      (item, index) => item.correctIndex === index
    );

    const confFeedback = ConfidenceFeedbackEngine.generateFeedback({
      isCorrect: isSequential,
      userAnswer: "ڕیزبەندی دەستکاریکراو",
      expectedAnswer: "ڕیزبەندی لۆژیکی و زانستی هەنگاوەکان",
      subject: "زانست",
      topic: ordEx.topicKu,
      explanation: ordEx.explanationKu,
      hint: "لە هەنگاوی یەکەمەوە دەستپێبکە کە دەبێتە هۆی دەستپێکردنی کارلێک یان پرۆسەکە.",
    });

    setFeedback(confFeedback);
    if (isSequential) {
      playSuccess();
      onComplete?.(true);
    } else {
      playError();
      onComplete?.(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 4. EVALUATION: Concept Map
  // ───────────────────────────────────────────────────────────────────────────
  const evaluateConceptMap = (cmEx: ConceptMapExercise) => {
    const isCorrect = selectedMapOption === cmEx.correctOptionIndex;

    const confFeedback = ConfidenceFeedbackEngine.generateFeedback({
      isCorrect,
      userAnswer: selectedMapOption !== null ? cmEx.challengeOptionsKu[selectedMapOption] : "",
      expectedAnswer: cmEx.challengeOptionsKu[cmEx.correctOptionIndex],
      subject: "زانست",
      topic: cmEx.topicKu,
      explanation: cmEx.explanationKu,
      hint: "پەیوەندی نێوان چەمکە سەرەکییەکە و لقە پەیوەندیدارەکان بە وردی شیبکەرەوە.",
    });

    setFeedback(confFeedback);
    if (isCorrect) {
      playSuccess();
      onComplete?.(true);
    } else {
      playError();
      onComplete?.(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 5. EVALUATION: True / False
  // ───────────────────────────────────────────────────────────────────────────
  const evaluateTrueFalse = (tfEx: TrueFalseExercise) => {
    if (selectedTrueFalse === null) return;
    const isCorrect = selectedTrueFalse === tfEx.isTrue;

    const confFeedback = ConfidenceFeedbackEngine.generateFeedback({
      isCorrect,
      userAnswer: selectedTrueFalse ? "ڕاستە" : "هەڵەیە",
      expectedAnswer: tfEx.isTrue ? "ڕاستە" : "هەڵەیە",
      subject: "زانست",
      topic: tfEx.topicKu,
      explanation: tfEx.explanationKu,
      hint: tfEx.hintKu || "سەرنجی مەرج و یاسا بنەڕەتییەکانی ئەم چەمکە بدە.",
    });

    setFeedback(confFeedback);
    if (isCorrect) {
      playSuccess();
      onComplete?.(true);
    } else {
      playError();
      onComplete?.(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 6. EVALUATION: Numerical
  // ───────────────────────────────────────────────────────────────────────────
  const evaluateNumerical = (numEx: NumericalExercise) => {
    const val = parseFloat(numericalInput.trim());
    if (isNaN(val)) return;

    const tol = numEx.tolerance ?? 0.05;
    const isCorrect = Math.abs(val - numEx.expectedNumber) <= tol;

    const confFeedback = ConfidenceFeedbackEngine.generateFeedback({
      isCorrect,
      userAnswer: `${numericalInput} ${numEx.unitKu || ""}`.trim(),
      expectedAnswer: `${numEx.expectedNumber} ${numEx.unitKu || ""}`.trim(),
      subject: "زانست",
      topic: numEx.topicKu,
      explanation: numEx.explanationKu,
      hint: numEx.hintKu || `یاسای بەکارهاتوو: ${numEx.formulaKu || "هاوکێشەی سەرەکی"}`,
    });

    setFeedback(confFeedback);
    if (isCorrect) {
      playSuccess();
      onComplete?.(true);
    } else {
      playError();
      onComplete?.(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Exercise Badge & Title */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            {exercise.type === "fill_in_blank" && <FileEdit className="w-5 h-5 text-indigo-600" />}
            {exercise.type === "matching" && <Network className="w-5 h-5 text-purple-600" />}
            {exercise.type === "ordering" && <ListOrdered className="w-5 h-5 text-amber-500" />}
            {exercise.type === "concept_map" && <Layers className="w-5 h-5 text-emerald-600" />}
            {exercise.type === "true_false" && <CheckCircle className="w-5 h-5 text-blue-600" />}
            {exercise.type === "numerical" && <Calculator className="w-5 h-5 text-teal-600" />}
            <span className="text-xs font-bold text-slate-500 font-sans">
              {exercise.type === "fill_in_blank"
                ? "ڕاهێنانی پڕکردنەوەی شوێنە بەتاڵەکان"
                : exercise.type === "matching"
                ? "ڕاهێنانی هاوتاکردنی دوو ستوون"
                : exercise.type === "ordering"
                ? "ڕاهێنانی ڕیزبەندی لۆژیکی هەنگاوەکان"
                : exercise.type === "concept_map"
                ? "ڕاهێنانی نەخشەسازی چەمکەکان"
                : exercise.type === "true_false"
                ? "ڕاهێنانی ڕاست یان هەڵە"
                : "ڕاهێنانی شیکاری ژمارەیی"}
            </span>
          </div>

          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {exercise.topicKu}
          </span>
        </div>

        <p className="font-sans font-bold text-sm sm:text-base text-slate-900 leading-snug">
          {exercise.instructionKu}
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          MODE 1: FILL IN THE BLANKS
          ───────────────────────────────────────────────────────────────────── */}
      {exercise.type === "fill_in_blank" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {/* Sentence with Blanks */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-sm sm:text-base leading-loose font-sans text-slate-800">
            {exercise.sentenceTemplateKu.split(/(\{\d+\})/).map((part, pIdx) => {
              const match = part.match(/\{(\d+)\}/);
              if (match) {
                const blankId = parseInt(match[1]);
                const curVal = blankInputs[blankId] || "";
                return (
                  <span key={pIdx} className="inline-block mx-1">
                    <input
                      type="text"
                      value={curVal}
                      onChange={(e) =>
                        setBlankInputs((prev) => ({ ...prev, [blankId]: e.target.value }))
                      }
                      placeholder={`[شوێنی بەتاڵی ${blankId}]`}
                      className={`px-3 py-1.5 text-center font-bold text-xs sm:text-sm rounded-lg border transition-all ${
                        curVal
                          ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-100"
                          : "bg-white border-slate-300 text-slate-700"
                      }`}
                    />
                  </span>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </div>

          {/* Word Bank Chips */}
          {exercise.wordBankKu.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 font-sans block">
                کۆگای وشەکان (کلیک بکە بۆ هەڵبژاردن):
              </span>
              <div className="flex flex-wrap gap-2">
                {exercise.wordBankKu.map((word, wIdx) => (
                  <button
                    key={wIdx}
                    type="button"
                    onClick={() => {
                      playInteraction();
                      // Find first empty blank
                      const firstEmpty = exercise.blanks.find((b) => !blankInputs[b.id]);
                      if (firstEmpty) {
                        setBlankInputs((prev) => ({ ...prev, [firstEmpty.id]: word }));
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => evaluateFillInBlank(exercise)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>پشکنینی وەڵامەکان</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          MODE 2: MATCHING (TWO COLUMNS)
          ───────────────────────────────────────────────────────────────────── */}
      {exercise.type === "matching" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column A (Left items) */}
            <div className="space-y-2.5">
              <span className="font-bold text-xs text-indigo-700 font-sans block">
                ستوونی (١): زاراوە و چەمکەکان
              </span>
              {exercise.pairs.map((p) => {
                const isSelected = selectedLeft === p.id;
                const isMatched = Boolean(matches[p.id]);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      playInteraction();
                      setSelectedLeft(p.id);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-right font-sans text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : isMatched
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                    }`}
                  >
                    <span>{p.leftKu}</span>
                    {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>

            {/* Column B (Right items, shuffled) */}
            <div className="space-y-2.5">
              <span className="font-bold text-xs text-purple-700 font-sans block">
                ستوونی (٢): پێناسە و تایبەتمەندییەکان
              </span>
              {exercise.pairs.map((p) => {
                const matchedWithLeft = Object.keys(matches).find((k) => matches[k] === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (!selectedLeft) return;
                      playInteraction();
                      setMatches((prev) => ({ ...prev, [selectedLeft]: p.id }));
                      setSelectedLeft(null);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-right font-sans text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${
                      matchedWithLeft
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                        : selectedLeft
                        ? "bg-purple-50/60 hover:bg-purple-100/60 border-purple-200 text-slate-800"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>{p.rightKu}</span>
                    {matchedWithLeft && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>پێچەوانەکردنەوەی هاوتاکردن</span>
            </button>

            <button
              type="button"
              onClick={() => evaluateMatching(exercise)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>پشکنینی هاوتاکردن</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          MODE 3: ORDERING & SEQUENCING (DRAG / MOVE UP-DOWN)
          ───────────────────────────────────────────────────────────────────── */}
      {exercise.type === "ordering" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 font-sans pb-1 border-b border-slate-100">
            <span>دەتوانیت بە ڕاکێشان و دانان (Drag & Drop) یان دوگمەکانی سەرەوە و خوارەوە هەنگاوەکان ڕێکبخەیت:</span>
            <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">ڕاکێشان بەردەستە ↕</span>
          </div>

          <div className="space-y-3">
            {orderedItems.map((item, idx) => {
              const isBeingDragged = draggedItemIndex === idx;
              const isDragTarget = dragOverItemIndex === idx && !isBeingDragged;

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedItemIndex(idx);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", idx.toString());
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverItemIndex !== idx) {
                      setDragOverItemIndex(idx);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverItemIndex === idx) {
                      setDragOverItemIndex(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverItemIndex(null);
                    if (draggedItemIndex === null || draggedItemIndex === idx) {
                      setDraggedItemIndex(null);
                      return;
                    }
                    playInteraction();
                    const next = [...orderedItems];
                    const [removed] = next.splice(draggedItemIndex, 1);
                    next.splice(idx, 0, removed);
                    setOrderedItems(next);
                    setDraggedItemIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedItemIndex(null);
                    setDragOverItemIndex(null);
                  }}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs sm:text-sm font-sans cursor-grab active:cursor-grabbing ${
                    isBeingDragged
                      ? "opacity-40 border-indigo-400 bg-indigo-50/50 scale-[0.98]"
                      : isDragTarget
                      ? "border-2 border-indigo-500 bg-indigo-50/70 shadow-sm"
                      : "border-slate-200 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 hover:text-slate-600 shrink-0 cursor-grab" title="ڕایبکێشە بۆ گۆڕینی شوێن">
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800">{item.textKu}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        playInteraction();
                        const next = [...orderedItems];
                        const temp = next[idx];
                        next[idx] = next[idx - 1];
                        next[idx - 1] = temp;
                        setOrderedItems(next);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="بەرەو سەرەوە"
                    >
                      <MoveUp className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === orderedItems.length - 1}
                      onClick={() => {
                        playInteraction();
                        const next = [...orderedItems];
                        const temp = next[idx];
                        next[idx] = next[idx + 1];
                        next[idx + 1] = temp;
                        setOrderedItems(next);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="بەرەو خوارەوە"
                    >
                      <MoveDown className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => evaluateOrdering(exercise)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>پشکنینی ڕیزبەندی</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          MODE 4: CONCEPT MAPPING
          ───────────────────────────────────────────────────────────────────── */}
      {exercise.type === "concept_map" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {/* Interactive Network Visualizer */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
                تەوەرەی سەرەکی چەمک
              </span>
              <h3 className="font-sans font-black text-xl text-slate-900">
                {exercise.centralThemeKu}
              </h3>
            </div>

            {/* Node Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {exercise.nodes.map((node) => {
                const isActive = activeConceptNodeId === node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => {
                      playInteraction();
                      setActiveConceptNodeId(node.id);
                    }}
                    className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer font-sans space-y-1 ${
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200"
                        : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    <span className="text-[10px] font-bold block uppercase opacity-80">
                      {node.roleKu === "law"
                        ? "یاسای بنەڕەتی"
                        : node.roleKu === "example"
                        ? "نموونەی کرداری"
                        : "جێبەجێکردن"}
                    </span>
                    <span className="font-bold text-xs sm:text-sm block">{node.titleKu}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Node Detail Card */}
            {activeConceptNodeId && (
              <div className="p-4 bg-white rounded-xl border border-indigo-100 space-y-1 text-xs font-sans text-slate-700 animate-in fade-in">
                <span className="font-bold text-indigo-700 block">
                  شیکاری پەیوەندی لە نەخشەدا:
                </span>
                <p className="leading-relaxed">
                  {exercise.nodes.find((n) => n.id === activeConceptNodeId)?.descriptionKu}
                </p>
              </div>
            )}
          </div>

          {/* Inquiry Question from Concept Map */}
          <div className="space-y-3 pt-2">
            <h4 className="font-sans font-bold text-sm text-slate-900">
              {exercise.challengeQuestionKu}
            </h4>

            <div className="space-y-2">
              {exercise.challengeOptionsKu.map((opt, oIdx) => {
                const isSelected = selectedMapOption === oIdx;
                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => {
                      playInteraction();
                      setSelectedMapOption(oIdx);
                    }}
                    className={`w-full p-3 rounded-xl border text-right font-sans text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-600 text-indigo-900 font-bold"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>{opt}</span>
                    <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={selectedMapOption === null}
              onClick={() => evaluateConceptMap(exercise)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>پشکنینی وەڵام</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          MODE 5: TRUE / FALSE
          ───────────────────────────────────────────────────────────────────── */}
      {exercise.type === "true_false" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-500">دەقی ڕستە یان یاسا:</span>
            <p className="text-base font-bold text-slate-900 leading-relaxed font-sans">
              {exercise.statementKu}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedTrueFalse(true)}
              className={`p-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer ${
                selectedTrueFalse === true
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
              }`}
            >
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>ڕاستە (True)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTrueFalse(false)}
              className={`p-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer ${
                selectedTrueFalse === false
                  ? "border-rose-600 bg-rose-50 text-rose-800 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
              }`}
            >
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>هەڵەیە (False)</span>
            </button>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={selectedTrueFalse === null}
              onClick={() => evaluateTrueFalse(exercise)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>پشکنینی وەڵام</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          MODE 6: NUMERICAL EXERCISE
          ───────────────────────────────────────────────────────────────────── */}
      {exercise.type === "numerical" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-500">پرسیاری ژمارەیی:</span>
            <p className="text-base font-bold text-slate-900 leading-relaxed font-sans">
              {exercise.problemKu}
            </p>
            {exercise.formulaKu && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-mono font-bold">
                یاسای ڕێنمایی: {exercise.formulaKu}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              وەڵامی ژمارەیی بنووسە:
            </label>
            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="number"
                step="any"
                value={numericalInput}
                onChange={(e) => setNumericalInput(e.target.value)}
                placeholder="وەک: 1.30"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") evaluateNumerical(exercise);
                }}
              />
              {exercise.unitKu && (
                <span className="px-3 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold font-mono">
                  {exercise.unitKu}
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={!numericalInput.trim()}
              onClick={() => evaluateNumerical(exercise)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>پشکنینی وەڵام</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          CONFIDENCE BUILDER FEEDBACK DISPLAY
          ───────────────────────────────────────────────────────────────────── */}
      {feedback && (
        <ConfidenceFeedbackCard
          feedback={feedback}
          onRetry={handleReset}
          onNext={() => {
            handleReset();
          }}
        />
      )}
    </div>
  );
};
