import { useState, useEffect } from "react";
import { AssessmentQuestionItem, getQuestionsBySubject } from "../data/assessments/curriculum-questions.ts";

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
        // Strictly return questions for the requested subject - never mix subjects
        setQuestions(fallback);
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
