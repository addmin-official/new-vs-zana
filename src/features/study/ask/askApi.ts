import { AskApiRequest, AskApiResponse } from "./askTypes.ts";
import { parseResponseJson, fetchWithFallback } from "../../../lib/apiClient.ts";

export async function askZana(request: AskApiRequest): Promise<AskApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout

  try {
    const response = await fetchWithFallback("/api/study/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await parseResponseJson<{ text: string; isEducational?: boolean }>(response);
    if (data && typeof data === "object" && typeof data.text === "string") {
      return {
        text: data.text,
        isEducational: typeof data.isEducational === "boolean" ? data.isEducational : true,
      };
    }

    throw new Error("INVALID_RESPONSE_FORMAT");
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof Error && (error.message.includes("VITE_API_BASE_URL") || error.message.includes("ببوورە"))) {
      return {
        text: error.message,
        isEducational: false,
      };
    }

    if (error instanceof Error && error.name === "AbortError") {
      return {
        text: "وەڵامدانەوە کەمێک درێژ بوو. تکایە جارێکی تر هەوڵ بدەرەوە.",
        isEducational: false,
      };
    }

    // Friendly Kurdish Sorani network error messages
    return {
      text: "پەیوەندی بە زانا نەکرا. تکایە دڵنیابە لە هێڵی ئینتەرنێت و دووبارە هەوڵ بدەرەوە.",
      isEducational: false,
    };
  }
}
