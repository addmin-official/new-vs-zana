import { useState, useCallback } from "react";
import { ChapterOutlineItem, FALLBACK_CHEMISTRY_CHAPTERS } from "../features/chat/ChatSidebar.tsx";
import { UserProfile } from "../store/appStore.ts";

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getChapters = useCallback(async (subject = "chemistry", grade = "12"): Promise<ChapterOutlineItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/curriculum/${encodeURIComponent(subject)}/${encodeURIComponent(grade)}/outline`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setLoading(false);
      return Array.isArray(data) && data.length > 0 ? data : FALLBACK_CHEMISTRY_CHAPTERS;
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load chapters");
      setLoading(false);
      return FALLBACK_CHEMISTRY_CHAPTERS;
    }
  }, []);

  const getProfile = useCallback(async (): Promise<Partial<UserProfile> | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Partial<UserProfile>;
      setLoading(false);
      return data;
    } catch {
      setLoading(false);
      return null;
    }
  }, []);

  const sendChat = useCallback(async (message: string, context?: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, ...context }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLoading(false);
      return data;
    } catch (err: unknown) {
      setError((err as Error).message || "Chat request failed");
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    getChapters,
    getProfile,
    sendChat,
  };
}

export default useApi;
