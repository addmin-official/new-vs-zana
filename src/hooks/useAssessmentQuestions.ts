import { useState, useEffect } from "react";
import { AssessmentQuestionItem, REAL_ASSESSMENT_QUESTIONS, getQuestionsBySubject } from "../data/assessments/curriculum-questions.ts";

export function useAssessmentQuestions(subject: string, grade = 12) {
  const [questions, setQuestions] = useState<AssessmentQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/assessment/questions?subject=${encodeURIComponent(subject)}&grade=${grade}`);
        if (res.ok) {
          const json = (await res.json()) as { questions?: AssessmentQuestionItem[] };
          if (isMounted && Array.isArray(json.questions) && json.questions.length > 0) {
            setQuestions(json.questions);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to embedded real questions
      }

      if (isMounted) {
        const fallback = getQuestionsBySubject(subject, grade);
        setQuestions(fallback.length > 0 ? fallback : REAL_ASSESSMENT_QUESTIONS);
        setLoading(false);
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [subject, grade]);

  return { questions, loading, error };
}
