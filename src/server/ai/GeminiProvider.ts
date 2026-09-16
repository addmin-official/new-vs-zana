import { FirebaseAIProvider } from "./FirebaseAIProvider.ts";
import { AI_CONFIG, normalizeModel } from "../config/aiModels.ts";
import { classifyError } from "./AiErrors.ts";
import { GoogleGenAI } from "@google/genai";

export interface ProviderGenerateParams {
  apiKey?: string;
  model: string;
  contents: unknown;
  config?: unknown;
  pathname?: string;
  projectId?: string;
  env?: unknown;
}

export class GeminiProvider {
  static async generate(params: ProviderGenerateParams): Promise<{ text: string }> {
    const maxRetries = AI_CONFIG.retryPolicy.maxRetries;
    const timeoutMs = AI_CONFIG.timeoutMs;
    const normalizedModel = normalizeModel(params.model);

    let attempt = 0;
    let lastError: unknown = null;

    while (attempt <= maxRetries) {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      try {
        let firebaseErr: unknown = null;

        try {
          const generatePromise = FirebaseAIProvider.generate({
            model: normalizedModel,
            contents: params.contents,
            config: params.config,
            env: params.env,
          });

          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error("Request timeout"));
            }, timeoutMs);
          });

          const result = await Promise.race([generatePromise, timeoutPromise]);
          if (timeoutId !== null) clearTimeout(timeoutId);

          return result;
        } catch (fErr: unknown) {
          if (timeoutId !== null) clearTimeout(timeoutId);
          firebaseErr = fErr;
        }

        // If FirebaseAIProvider failed (e.g. firebasevertexai.googleapis.com not enabled),
        // seamlessly fall back to GoogleGenAI SDK using the provided GEMINI_API_KEY.
        const envKey =
          params.env && typeof params.env === "object"
            ? (params.env as Record<string, unknown>).GEMINI_API_KEY
            : undefined;

        let apiKey: string | undefined = undefined;
        if (typeof params.apiKey === "string") {
          apiKey = params.apiKey;
        } else if (typeof envKey === "string") {
          apiKey = envKey;
        } else if (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) {
          apiKey = process.env.GEMINI_API_KEY;
        }

        if (apiKey && apiKey.trim().length > 0) {
          const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
          const candidates: string[] = [];
          if (normalizedModel === "gemini-2.5-flash" || normalizedModel.includes("2.5") || normalizedModel.includes("1.5")) {
            candidates.push("gemini-flash-latest", "gemini-3.6-flash", "gemini-3.8-flash", normalizedModel);
          } else {
            candidates.push(normalizedModel, "gemini-flash-latest", "gemini-3.6-flash", "gemini-3.8-flash");
          }

          let lastGenAiErr: unknown = null;
          for (const candidateModel of candidates) {
            try {
              let genTimeoutId: ReturnType<typeof setTimeout> | null = null;
              const genPromise = ai.models.generateContent({
                model: candidateModel,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                contents: params.contents as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                config: params.config as any,
              });

              const timeoutPromise = new Promise<never>((_, reject) => {
                genTimeoutId = setTimeout(() => {
                  reject(new Error("Request timeout"));
                }, timeoutMs);
              });

              const genAiRes = await Promise.race([genPromise, timeoutPromise]);
              if (genTimeoutId !== null) clearTimeout(genTimeoutId);

              const text = genAiRes.text || "";
              if (text.trim().length > 0) {
                return { text: text.trim() };
              }
            } catch (gErr: unknown) {
              lastGenAiErr = gErr;
              const gMsg =
                gErr && typeof gErr === "object" && "message" in gErr ? String((gErr as Record<string, unknown>).message) : "";
              if (
                gMsg.includes("not found") ||
                gMsg.includes("no longer available") ||
                gMsg.includes("404") ||
                gMsg.includes("503") ||
                gMsg.includes("UNAVAILABLE")
              ) {
                continue;
              }
              break;
            }
          }

          if (lastGenAiErr) {
            throw lastGenAiErr;
          }
        }

        if (firebaseErr) {
          if (!apiKey || !apiKey.trim()) {
            throw new Error("GEMINI_API_KEY is missing");
          }
          throw firebaseErr;
        }

        throw new Error("GEMINI_API_KEY is missing");
      } catch (err: unknown) {
        if (timeoutId !== null) clearTimeout(timeoutId);
        lastError = err;
        const category = classifyError(err);

        let providerStatusCode = 500;
        if (err && typeof err === "object") {
          const errObj = err as Record<string, unknown>;
          if (typeof errObj.status === "number") providerStatusCode = errObj.status;
          else if (typeof errObj.code === "number") providerStatusCode = errObj.code;
          if (
            errObj.error &&
            typeof errObj.error === "object" &&
            typeof (errObj.error as Record<string, unknown>).code === "number"
          ) {
            providerStatusCode = (errObj.error as Record<string, unknown>).code as number;
          }
        }

        if (providerStatusCode === 401) {
          console.warn("[GeminiProvider] 401 UNAUTHENTICATED: Invalid API key.");
        } else if (providerStatusCode === 403) {
          console.warn("[GeminiProvider] 403 PERMISSION_DENIED: Access denied or insufficient permission.");
        } else if (providerStatusCode === 429) {
          console.warn("[GeminiProvider] 429 RATE_LIMITED: Rate limit or quota exceeded.");
        }

        const isRetryable =
          (AI_CONFIG.retryPolicy.retryableStatusCodes as readonly number[]).includes(providerStatusCode) ||
          category === "timeout" ||
          category === "quota_exceeded" ||
          category === "rate_limited" ||
          category === "provider_unavailable";

        console.error("[AI Diagnostic]", {
          pathname: params.pathname || "unknown",
          category,
          providerStatusCode,
          selectedModel: normalizedModel,
          hasApiKey: Boolean(params.apiKey),
          retryCount: attempt,
        });

        if (!isRetryable || attempt >= maxRetries) {
          throw err;
        }

        attempt++;
        const jitter = Math.random() * 100;
        const backoffMs = Math.min(
          AI_CONFIG.retryPolicy.baseBackoffMs * Math.pow(2, attempt - 1) + jitter,
          AI_CONFIG.retryPolicy.maxBackoffMs
        );
        await new Promise((res) => setTimeout(res, backoffMs));
      }
    }

    throw lastError;
  }
}
