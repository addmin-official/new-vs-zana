import { useState, useEffect } from "react";
import { ALL_REAL_CURRICULUM, CurriculumItem, getCurriculumBySubject } from "../data/curriculum/index.ts";

export function useCurriculumData(subject: string, grade = 12) {
  const [data, setData] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/curriculum/${encodeURIComponent(subject)}/${grade}/lessons`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && Array.isArray(json) && json.length > 0) {
            setData(json);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to embedded real data
      }

      if (isMounted) {
        const fallback = getCurriculumBySubject(subject, grade);
        setData(fallback.length > 0 ? fallback : ALL_REAL_CURRICULUM);
        setLoading(false);
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [subject, grade]);

  return { data, loading, error };
}
