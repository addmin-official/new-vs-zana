import { ChatMessage, AssessmentState, StudentProfile } from "./storage.ts";
import { parseResponseJson } from "../lib/apiClient.ts";

export interface ChatResponse {
  text: string;
  isEducational: boolean;
}

export interface AssessmentResponse {
  question: string;
  feedback: string;
  isCorrect: boolean;
  completed: boolean;
  finalLevel: string | null;
}

export interface ReportResponse {
  recommendation: string;
}

const getApiUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!baseUrl || !baseUrl.trim()) {
    return normalizedPath;
  }
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}${normalizedPath}`;
};

async function fetchWithFallback(path: string, init: RequestInit): Promise<Response> {
  const primaryUrl = getApiUrl(path);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (primaryUrl === normalizedPath) {
    return fetch(primaryUrl, init);
  }

  try {
    const response = await fetch(primaryUrl, init);
    if (!response.ok && (response.status === 404 || response.status === 502 || response.status === 503)) {
      try {
        return await fetch(normalizedPath, init);
      } catch {
        return response;
      }
    }
    return response;
  } catch (err) {
    // NetworkError / CORS error when attempting cross-origin fetch to remote worker
    console.warn(`Fetch to ${primaryUrl} failed (${err instanceof Error ? err.message : String(err)}), falling back to relative endpoint: ${normalizedPath}`);
    return fetch(normalizedPath, init);
  }
}

export const ZanaApiClient = {
  async sendChatMessage(
    message: string,
    history: ChatMessage[],
    profile: StudentProfile,
    academicContext?: { lessonTitle?: string; conceptTitle?: string; curriculumId?: string },
    token?: string
  ): Promise<ChatResponse> {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetchWithFallback("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ message, history, profile, academicContext }),
      });

      return await parseResponseJson<ChatResponse>(response);
    } catch (error: unknown) {
      console.error("API Error in sendChatMessage", error);
      throw new Error("ببورە، پەیوەندی بە خزمەتگوزارییەکە سەرکەوتوو نەبوو. تکایە دواتر هەوڵ بدەوە.");
    }
  },

  async getAssessmentNextQuestion(
    state: Omit<AssessmentState, "id">,
    profile: StudentProfile
  ): Promise<AssessmentResponse> {
    try {
      const response = await fetchWithFallback("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, profile }),
      });

      return await parseResponseJson<AssessmentResponse>(response);
    } catch (error: unknown) {
      console.error("API Error in getAssessmentNextQuestion", error);
      throw new Error("ببورە، پەیوەندی بە خزمەتگوزارییەکە سەرکەوتوو نەبوو. تکایە دواتر هەوڵ بدەوە.");
    }
  },

  async getParentReport(
    profile: StudentProfile,
    summaryStats: { totalSessions: number; weeklyQuestionCount: number }
  ): Promise<ReportResponse> {
    try {
      const response = await fetchWithFallback("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, summaryStats }),
      });

      return await parseResponseJson<ReportResponse>(response);
    } catch (error: unknown) {
      console.error("API Error in getParentReport", error);
      throw new Error("ببورە، پەیوەندی بە خزمەتگوزارییەکە سەرکەوتوو نەبوو. تکایە دواتر هەوڵ بدەوە.");
    }
  }
};
