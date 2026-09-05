import { useState, useCallback, useMemo, useEffect } from "react";
import { StudentProfile } from "../../student/studentTypes.ts";
import { CurriculumIntelligenceSnapshot } from "../../../curriculum/types.ts";
import { SessionSnapshot } from "../../../session/types.ts";
import { PracticeSnapshot, PracticeAttempt } from "./practiceTypes.ts";
import { DomainEventBus } from "../../../domain/DomainEventBus.ts";
import { DomainEventFactory } from "../../../domain/DomainEventFactory.ts";
import { fetchPracticeSnapshot, submitPracticeAnswer } from "../../../client/api/studyService.ts";

export interface UsePracticeModeProps {
  studentProfile: StudentProfile;
  curriculumSnapshot: CurriculumIntelligenceSnapshot;
  sessionSnapshot: SessionSnapshot;
}

export function usePracticeMode({
  studentProfile,
  curriculumSnapshot,
  sessionSnapshot
}: UsePracticeModeProps) {
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<PracticeSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const conceptId = sessionSnapshot.currentSession?.currentNodeId || "12_sci_math_con1";

  // Reset attempts when active concept changes
  const [prevConceptId, setPrevConceptId] = useState(conceptId);
  if (conceptId !== prevConceptId) {
    setPrevConceptId(conceptId);
    setAttempts([]);
    setError(null);
    setSnapshot(null);
  }

  const availableNodes = curriculumSnapshot.resolution.availableNodes;
  const currentNode = availableNodes.find(n => n.id === conceptId);
  const conceptTitle = currentNode?.title || "چەمکی خوێندن";
  const lessonNode = currentNode ? availableNodes.find(n => n.id === currentNode.parentId) : null;
  const lessonTitle = lessonNode?.title;

  // Load snapshot from server
  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const snap = await fetchPracticeSnapshot(
          Number(studentProfile.grade),
          studentProfile.activeSubject,
          conceptId,
          conceptTitle,
          lessonTitle,
          studentProfile.stream
        );
        if (active) {
          setSnapshot(snap);
          if (snap.attempts) {
            setAttempts(snap.attempts);
          }
        }
      } catch (err) {
        if (active) {
          setError("کێشەیەک لە هێنانی پرسیارەکاندا دروست بوو.");
          console.error(err);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    void load();
    return () => { active = false; };
  }, [conceptId, studentProfile.grade, studentProfile.activeSubject, studentProfile.stream, conceptTitle, lessonTitle]);

  // Submit Answer function
  const submitAnswer = useCallback(async (questionId: string, answer: string) => {
    if (!snapshot) return;

    const question = snapshot.questions.find(q => q.id === questionId);
    if (!question) {
      setError("پرسیارەکە نەدۆزرایەوە.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 1. Evaluate answer using server-side endpoint
      const evaluation = await submitPracticeAnswer(
        conceptId,
        questionId,
        answer,
        question.prompt,
        question.correctAnswer || "",
        question.difficultyLabel,
        5000
      );

      // 2. Add attempt to state
      const newAttempt: PracticeAttempt = {
        questionId,
        studentAnswer: answer,
        isCorrect: evaluation.isCorrect,
        submittedAt: new Date().toISOString()
      };

      const updatedAttempts = [...attempts.filter(a => a.questionId !== questionId), newAttempt];
      setAttempts(updatedAttempts);

      // 3. Update snapshot state locally
      setSnapshot(prev => {
        if (!prev) return null;
        const newAttempts = [...prev.attempts.filter(a => a.questionId !== questionId), newAttempt];
        const correctCount = prev.questions.filter(q => {
          if (q.id === questionId) return evaluation.isCorrect;
          return newAttempts.find(a => a.questionId === q.id)?.isCorrect;
        }).length;
        const totalCount = prev.questions.length;
        const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
        let feedbackMessage = prev.feedbackMessage;
        if (newAttempts.length === totalCount) {
          if (score >= 70) {
            feedbackMessage = `ناوازەیە! توانیت بە سەرکەوتوویی سەرجەم پرسیارەکانی ئەم بەشە تەواو بکەیت بە نمرەی نایابی %${Math.round(score)}.`;
          } else {
            feedbackMessage = `هەوڵێکی باش بوو! تۆ %${Math.round(score)}ی پرسیارەکانت بە دروستی وەڵام دایەوە. دەتوانیت دووبارە تاقی بکەیتەوە بۆ نمرەی باڵاتر.`;
          }
        } else {
          feedbackMessage = `زۆر باشە! لە ئێستادا ${newAttempts.length} پرسیارت وەڵام داوە لە کۆی ${totalCount} پرسیار. بەردەوام بە!`;
        }

        // Add evaluation feedback to question explanation or save it in snapshot
        const updatedQuestions = prev.questions.map(q => {
          if (q.id === questionId) {
            return {
              ...q,
              explanation: evaluation.feedback,
            };
          }
          return q;
        });

        return {
          ...prev,
          questions: updatedQuestions,
          attempts: newAttempts,
          completionPercentage: Math.round((newAttempts.length / totalCount) * 100),
          feedbackMessage,
        };
      });

      // 4. Dispatch Domain Event ANSWER_SUBMITTED
      try {
        const eventBus = DomainEventBus.getInstance();
        const subEvent = DomainEventFactory.createEvent(
          "ANSWER_SUBMITTED",
          studentProfile.id,
          "student-portal",
          {
            questionId,
            studentAnswer: answer,
            conceptId: conceptId
          },
          {
            nodeId: conceptId,
            sessionId: sessionSnapshot.currentSession?.id,
            subject: studentProfile.activeSubject,
            grade: studentProfile.grade,
            stream: studentProfile.stream
          }
        );
        void eventBus.publish(subEvent);
      } catch (evtErr) {
        console.warn("Domain events could not publish ANSWER_SUBMITTED:", evtErr);
      }

      // 5. Dispatch Domain Event ANSWER_EVALUATED
      try {
        const eventBus = DomainEventBus.getInstance();
        const evalEvent = DomainEventFactory.createEvent(
          "ANSWER_EVALUATED",
          studentProfile.id,
          "ai-tutor",
          {
            questionId,
            isCorrect: evaluation.isCorrect,
            score: evaluation.isCorrect ? 100 : 0,
            feedbackKu: evaluation.feedback
          },
          {
            nodeId: conceptId,
            sessionId: sessionSnapshot.currentSession?.id,
            subject: studentProfile.activeSubject,
            grade: studentProfile.grade,
            stream: studentProfile.stream
          }
        );
        void eventBus.publish(evalEvent);
      } catch (evtErr) {
        console.warn("Domain events could not publish ANSWER_EVALUATED:", evtErr);
      }

      // 6. Check if all questions are completed and evaluate for CONCEPT_COMPLETED
      const allQuestions = snapshot.questions;
      const allAttemptsMap = new Map(updatedAttempts.map(a => [a.questionId, a]));
      const completedAll = allQuestions.every(q => allAttemptsMap.has(q.id));

      if (completedAll) {
        const correctCount = allQuestions.filter(q => allAttemptsMap.get(q.id)?.isCorrect).length;
        const totalCount = allQuestions.length;
        const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

        if (score >= 70) {
          try {
            const eventBus = DomainEventBus.getInstance();
            const conceptCompEvent = DomainEventFactory.createEvent(
              "CONCEPT_COMPLETED",
              studentProfile.id,
              "ai-tutor",
              {
                conceptId: conceptId,
                sessionId: sessionSnapshot.currentSession?.id
              },
              {
                nodeId: conceptId,
                sessionId: sessionSnapshot.currentSession?.id,
                subject: studentProfile.activeSubject,
                grade: studentProfile.grade,
                stream: studentProfile.stream
              }
            );
            void eventBus.publish(conceptCompEvent);
          } catch (evtErr) {
            console.warn("Domain events could not publish CONCEPT_COMPLETED:", evtErr);
          }
        }
      }
    } catch (err: unknown) {
      console.error("Error during answer submission:", err);
      setError("کێشەیەک لە پێشکەشکردنی وەڵامدا دروست بوو.");
    } finally {
      setIsLoading(false);
    }
  }, [snapshot, attempts, studentProfile, conceptId, sessionSnapshot.currentSession]);

  // Reset practice state
  const resetPractice = useCallback(() => {
    setAttempts([]);
    setError(null);
  }, []);

  // Determine if all questions have been answered and overall score is >= 70%
  const isCompleted = useMemo(() => {
    if (!snapshot || snapshot.questions.length === 0) return false;
    const answeredCount = attempts.length;
    const totalCount = snapshot.questions.length;
    if (answeredCount < totalCount) return false;

    const correctCount = attempts.filter(a => a.isCorrect).length;
    const score = (correctCount / totalCount) * 100;
    return score >= 70;
  }, [snapshot, attempts]);

  return {
    snapshot,
    submitAnswer,
    resetPractice,
    isCompleted,
    isLoading,
    error
  };
}
