import { ChatMessage, AssessmentState, StudentProfile } from "./storage.ts";
import { parseResponseJson, fetchWithFallback } from "../lib/apiClient.ts";

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
      const msg =
        error instanceof Error &&
        error.message &&
        !error.message.startsWith("Request failed with HTTP") &&
        !error.message.startsWith("Expected JSON")
          ? error.message
          : "ببورە، پەیوەندی بە خزمەتگوزارییەکە سەرکەوتوو نەبوو. تکایە دواتر هەوڵ بدەوە.";
      throw new Error(msg);
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
      const msg =
        error instanceof Error &&
        error.message &&
        !error.message.startsWith("Request failed with HTTP") &&
        !error.message.startsWith("Expected JSON")
          ? error.message
          : "ببورە، پەیوەندی بە خزمەتگوزارییەکە سەرکەوتوو نەبوو. تکایە دواتر هەوڵ بدەوە.";
      throw new Error(msg);
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
      const msg =
        error instanceof Error &&
        error.message &&
        !error.message.startsWith("Request failed with HTTP") &&
        !error.message.startsWith("Expected JSON")
          ? error.message
          : "ببورە، پەیوەندی بە خزمەتگوزارییەکە سەرکەوتوو نەبوو. تکایە دواتر هەوڵ بدەوە.";
      throw new Error(msg);
    }
  }
};
