import { useState, useCallback, useRef } from "react";
import { ResponseParser, ParsedEducationalResponse, EducationalResponseType } from "../ai/responseParser.ts";
import { buildSocraticPrompt } from "../prompts/socraticPrompts.ts";
import { PromptTemplates } from "../ai/promptTemplates.ts";
import { getRandomEncouragement } from "../ai/tutorPersona.ts";

export type TutorWorkspaceMode = "socratic" | "explain" | "practice" | "ask";

export interface TutorMessage {
  id: string;
  sender: "student" | "zana";
  text: string;
  timestamp: number;
  parsed?: ParsedEducationalResponse;
  socraticLevel?: number;
  responseType?: EducationalResponseType;
}

export interface UseGeminiTutorOptions {
  subject?: string;
  grade?: string;
  stream?: string;
  studentName?: string;
  initialMode?: TutorWorkspaceMode;
}

export function useGeminiTutor(options: UseGeminiTutorOptions = {}) {
  const {
    subject = "کیمیا",
    grade = "12",
    stream = "زانستی",
    studentName = "قوتابی",
    initialMode = "socratic",
  } = options;

  const [mode, setMode] = useState<TutorWorkspaceMode>(initialMode);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState<1 | 2 | 3 | 4>(1);
  const [hintsUsed, setHintsUsed] = useState<number>(0);

  const activeProblemRef = useRef<string>("");
  const hintHistoryRef = useRef<string[]>([]);

  const sendMessage = useCallback(
    async (
      userText: string,
      contextOverride?: {
        conceptName?: string;
        problemText?: string;
        isExplicitHintRequest?: boolean;
      }
    ) => {
      const trimmed = userText.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      const studentMsgId = `student_${Date.now()}`;
      const newStudentMessage: TutorMessage = {
        id: studentMsgId,
        sender: "student",
        text: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, newStudentMessage]);
      setIsLoading(true);

      try {
        let currentLevel = hintLevel;
        if (contextOverride?.isExplicitHintRequest && mode === "socratic") {
          currentLevel = Math.min(4, hintLevel + 1) as 1 | 2 | 3 | 4;
          setHintLevel(currentLevel);
          setHintsUsed((prev) => prev + 1);
        }

        let promptForApi = trimmed;
        const problemToSolve = contextOverride?.problemText || activeProblemRef.current || trimmed;
        if (!activeProblemRef.current) {
          activeProblemRef.current = problemToSolve;
        }

        if (mode === "socratic") {
          promptForApi = buildSocraticPrompt({
            problemText: problemToSolve,
            studentAnswer: trimmed,
            hintLevel: currentLevel,
            conceptName: contextOverride?.conceptName,
            subject,
            grade,
            previousHints: hintHistoryRef.current,
            conversationHistory: messages.slice(-4).map((m) => ({
              role: m.sender,
              text: m.text,
            })),
          });
        } else if (mode === "explain" && contextOverride?.conceptName) {
          promptForApi = PromptTemplates.explainConcept({
            conceptName: contextOverride.conceptName,
            subject,
            grade,
            stream,
            studentName,
          });
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: promptForApi,
            subject,
            grade,
            mode: mode === "socratic" ? "chat" : mode,
            studentName,
          }),
        });

        if (!res.ok) {
          if (res.status === 429) {
            throw new Error("گەیشتیتە سنوری دیاریکراوی بەکارهێنان بۆ ئەم کاتژمێرە. تکایە دواتر هەوڵبدەرەوە.");
          }
          throw new Error(`داواکارییەکە سەرکەوتوو نەبوو (${res.status})`);
        }

        const data = await res.json();
        const responseText: string = data.text || "";

        // Parse educational response
        const parsed = ResponseParser.parse(responseText);

        if (mode === "socratic" && parsed.socraticQuestion) {
          hintHistoryRef.current.push(parsed.socraticQuestion);
        }

        const zanaMsgId = `zana_${Date.now()}`;
        const newZanaMessage: TutorMessage = {
          id: zanaMsgId,
          sender: "zana",
          text: parsed.sanitizedText || responseText,
          timestamp: Date.now(),
          parsed,
          socraticLevel: mode === "socratic" ? currentLevel : undefined,
          responseType: parsed.primaryType,
        };

        setMessages((prev) => [...prev, newZanaMessage]);
      } catch (err: unknown) {
        const fallbackMsg = (err as Error).message || "کێشەیەک لە پەیوەندی بە ڕاژەکاری ژیریی دەستکرد ڕوویدا.";
        setError(fallbackMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [grade, hintLevel, isLoading, messages, mode, stream, studentName, subject]
  );

  const requestNextHint = useCallback(
    async (conceptName?: string) => {
      if (hintLevel >= 4) {
        return;
      }
      const nextLevel = (hintLevel + 1) as 1 | 2 | 3 | 4;
      setHintLevel(nextLevel);
      setHintsUsed((prev) => prev + 1);

      await sendMessage("تکایە ڕێنمایی یان هێمایەکی زیاترم پێ بدە بۆ هەنگاوی دواتر.", {
        conceptName,
        isExplicitHintRequest: true,
      });
    },
    [hintLevel, sendMessage]
  );

  const resetSession = useCallback(() => {
    setMessages([]);
    setHintLevel(1);
    setHintsUsed(0);
    setError(null);
    activeProblemRef.current = "";
    hintHistoryRef.current = [];
  }, []);

  return {
    messages,
    mode,
    setMode,
    hintLevel,
    hintsUsed,
    isLoading,
    error,
    sendMessage,
    requestNextHint,
    resetSession,
    encouragement: getRandomEncouragement(),
  };
}
