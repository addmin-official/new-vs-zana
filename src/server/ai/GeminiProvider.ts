import { GoogleGenAI } from "@google/genai";
import { AI_CONFIG, normalizeModel, getVertexAiEndpoint } from "../config/aiModels.ts";
import { classifyError } from "./AiErrors.ts";

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
  /**
   * Main entrypoint for generating content with Gemini models.
   * Supports:
   *  1. "AQ." keys (Google AI Studio format from June 2026 onwards) -> GoogleGenAI SDK with x-goog-api-key header
   *  2. "AIza" keys (classic Google API keys) -> Vertex AI if Project ID is available, otherwise GoogleGenAI SDK
   * Includes exponential backoff retries, Vertex AI fallback on 403/404, and timeout handling.
   */
  static async generate(params: ProviderGenerateParams): Promise<{ text: string }> {
    const effectiveKey = params.apiKey !== undefined ? params.apiKey.trim() : (process.env.GEMINI_API_KEY?.trim() || "");
    if (!effectiveKey) {
      throw new Error("کلیل (GEMINI_API_KEY) بۆ سیستەمی زیرەکی زانا بەردەست نییە لە ڕێکخستنەکاندا.");
    }

    const maxRetries = AI_CONFIG.retryPolicy.maxRetries;
    const timeoutMs = AI_CONFIG.timeoutMs;

    // Resolve Google Cloud / Firebase Project ID if available
    const envObj = (params.env || {}) as Record<string, unknown>;
    const rawProjectId =
      params.projectId ||
      (typeof envObj.FIREBASE_PROJECT_ID === "string" ? envObj.FIREBASE_PROJECT_ID : undefined) ||
      (typeof envObj.PROJECT_ID === "string" ? envObj.PROJECT_ID : undefined) ||
      (typeof process !== "undefined" ? process.env?.FIREBASE_PROJECT_ID || process.env?.PROJECT_ID : undefined);

    const hasRealProjectId = Boolean(rawProjectId && rawProjectId.trim().length > 0);

    // Routing Logic:
    // - "AQ." keys: Google AI Studio format -> use GoogleGenAI SDK with x-goog-api-key
    // - "AIza" keys: classic Google keys -> use Vertex AI if Project ID is present, else GoogleGenAI SDK
    // (Also support keys with "vertex" in name for test environments)
    const isAqKey = effectiveKey.startsWith("AQ.");
    const isLegacyKey = effectiveKey.startsWith("AIza");
    const isVertexTestingKey = effectiveKey.toLowerCase().includes("vertex");
    const shouldUseVertex = (isLegacyKey || isVertexTestingKey) && hasRealProjectId;

    // Determine normalized model
    const normalizedModel = normalizeModel(params.model);

    // Normalize contents for Gemini API: { role, parts: [{ text }] }
    let normalizedContents: unknown = params.contents;
    if (typeof normalizedContents === "string") {
      normalizedContents = [{ role: "user", parts: [{ text: normalizedContents }] }];
    } else if (Array.isArray(normalizedContents) && normalizedContents.length > 0 && typeof normalizedContents[0] === "string") {
      normalizedContents = [{ role: "user", parts: (normalizedContents as unknown as string[]).map((t) => ({ text: t })) }];
    }

    let attempt = 0;
    let lastError: unknown = null;

    while (attempt <= maxRetries) {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      try {
        let fetchPromise: Promise<{ text?: string } | { text: string }>;

        if (shouldUseVertex) {
          // --- Branch 1: Vertex AI (AIza keys with Project ID) ---
          const projectId = rawProjectId!;
          const endpoint = getVertexAiEndpoint(projectId, normalizedModel);
          const vertexUrl = `${endpoint}?key=${effectiveKey}`;

          const vertexHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            "x-goog-api-key": effectiveKey,
            "User-Agent": "aistudio-build",
          };

          const vertexBody: Record<string, unknown> = {
            contents: normalizedContents,
          };

          if (params.config && typeof params.config === "object") {
            const cfg = params.config as Record<string, unknown>;
            if (cfg.systemInstruction) {
              vertexBody.systemInstruction =
                typeof cfg.systemInstruction === "string"
                  ? { parts: [{ text: cfg.systemInstruction }] }
                  : cfg.systemInstruction;
            }
            const generationConfig: Record<string, unknown> = {};
            if (typeof cfg.temperature === "number") generationConfig.temperature = cfg.temperature;
            if (typeof cfg.maxOutputTokens === "number") generationConfig.maxOutputTokens = cfg.maxOutputTokens;
            if (typeof cfg.responseMimeType === "string") generationConfig.responseMimeType = cfg.responseMimeType;
            if (cfg.responseSchema) generationConfig.responseSchema = cfg.responseSchema;
            if (Object.keys(generationConfig).length > 0) {
              vertexBody.generationConfig = generationConfig;
            }
          }

          fetchPromise = (async () => {
            const vertexRes = await fetch(vertexUrl, {
              method: "POST",
              headers: vertexHeaders,
              body: JSON.stringify(vertexBody),
            });

            if (!vertexRes.ok) {
              const errBody = await vertexRes.text();
              let parsedErr: Record<string, unknown> | null = null;
              try {
                parsedErr = JSON.parse(errBody);
              } catch {}
              const msg =
                ((parsedErr?.error as Record<string, unknown>)?.message as string) ||
                `HTTP ${vertexRes.status} Vertex AI error: ${errBody}`;

              // Fallback from Vertex AI to GoogleGenAI if 403 (Permission Denied) or 404 (Not Found)
              if (vertexRes.status === 403 || vertexRes.status === 404) {
                console.warn(`[Vertex AI Fallback] HTTP ${vertexRes.status}: Falling back to GoogleGenAI SDK.`);
                const fallbackAi = new GoogleGenAI({
                  apiKey: effectiveKey,
                  httpOptions: {
                    headers: {
                      "x-goog-api-key": effectiveKey,
                      "User-Agent": "aistudio-build",
                    },
                  },
                });

                const fallbackRes = await fallbackAi.models.generateContent({
                  model: normalizedModel,
                  contents: normalizedContents as Parameters<typeof fallbackAi.models.generateContent>[0]["contents"],
                  config: params.config as Parameters<typeof fallbackAi.models.generateContent>[0]["config"],
                });

                return { text: fallbackRes.text || "" };
              }

              const errObj = new Error(msg) as Error & { status?: number; code?: number; error?: unknown };
              errObj.status = vertexRes.status;
              errObj.code = vertexRes.status;
              errObj.error = parsedErr?.error || { code: vertexRes.status, message: msg };
              throw errObj;
            }

            const data = await vertexRes.json();
            let aggregatedText = "";
            if (Array.isArray(data)) {
              for (const chunk of data) {
                const parts = chunk?.candidates?.[0]?.content?.parts || [];
                for (const part of parts) {
                  if (part?.text) aggregatedText += part.text;
                }
              }
            } else if ((data as Record<string, unknown>)?.candidates) {
              const parts = (data as { candidates?: { content?: { parts?: { text?: string }[] } }[] })?.candidates?.[0]?.content?.parts || [];
              for (const part of parts) {
                if (part?.text) aggregatedText += part.text;
              }
            }

            return { text: aggregatedText };
          })();
        } else {
          // --- Branch 2: GoogleGenAI SDK (AQ. keys & AIza keys without Project ID) ---
          const ai = new GoogleGenAI({
            apiKey: effectiveKey,
            httpOptions: {
              headers: {
                "x-goog-api-key": effectiveKey,
                "User-Agent": "aistudio-build",
              },
            },
          });

          fetchPromise = ai.models.generateContent({
            model: normalizedModel,
            contents: normalizedContents as Parameters<typeof ai.models.generateContent>[0]["contents"],
            config: params.config as Parameters<typeof ai.models.generateContent>[0]["config"],
          });
        }

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("Request timeout"));
          }, timeoutMs);
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);
        if (timeoutId !== null) clearTimeout(timeoutId);

        const text = response?.text;
        if (typeof text !== "string" || text.trim().length === 0) {
          throw new Error("Invalid provider response: empty response text");
        }

        return { text: text.trim() };
      } catch (err: unknown) {
        if (timeoutId !== null) clearTimeout(timeoutId);
        lastError = err;
        const category = classifyError(err);

        let providerStatusCode = 500;
        if (err && typeof err === "object") {
          const errObj = err as Record<string, unknown>;
          if (typeof errObj.status === "number") providerStatusCode = errObj.status;
          else if (typeof errObj.code === "number") providerStatusCode = errObj.code;
          if (errObj.error && typeof errObj.error === "object" && typeof (errObj.error as Record<string, unknown>).code === "number") {
            providerStatusCode = (errObj.error as Record<string, unknown>).code as number;
          }
        }

        // Map status codes for diagnostic logging and error handling
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
          isAqKey,
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
