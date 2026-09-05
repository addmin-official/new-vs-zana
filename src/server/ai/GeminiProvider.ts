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
  static async generate(params: ProviderGenerateParams): Promise<{ text: string }> {
    const effectiveKey = params.apiKey !== undefined ? params.apiKey.trim() : (process.env.GEMINI_API_KEY?.trim() || "");
    if (!effectiveKey) {
      throw new Error("کلیل (GEMINI_API_KEY) بۆ سیستەمی زیرەکی زانا بەردەست نییە لە ڕێکخستنەکاندا.");
    }

    const maxRetries = AI_CONFIG.retryPolicy.maxRetries;
    const timeoutMs = AI_CONFIG.timeoutMs;

    let attempt = 0;
    let lastError: unknown = null;

    while (attempt <= maxRetries) {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      try {
        let fetchPromise: Promise<{ text?: string } | { text: string }>;

        const envObj = (params.env || {}) as Record<string, unknown>;
        const rawProjectId =
          params.projectId ||
          (typeof envObj.FIREBASE_PROJECT_ID === "string" ? envObj.FIREBASE_PROJECT_ID : undefined) ||
          (typeof envObj.PROJECT_ID === "string" ? envObj.PROJECT_ID : undefined) ||
          (typeof process !== "undefined" ? process.env?.FIREBASE_PROJECT_ID || process.env?.PROJECT_ID : undefined);

        const hasRealProjectId = Boolean(rawProjectId && rawProjectId.trim().length > 0);
        const shouldUseVertex = effectiveKey.startsWith("AQ.") && hasRealProjectId;

        if (shouldUseVertex) {
          const projectId = rawProjectId!;
          const normalizedModel = normalizeModel(params.model);
          const endpoint = getVertexAiEndpoint(projectId, normalizedModel);
          const vertexUrl = `${endpoint}?key=${effectiveKey}`;

          const vertexHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            "x-goog-api-key": effectiveKey,
            "User-Agent": "aistudio-build",
          };

          const body: Record<string, unknown> = {
            contents: params.contents,
          };

          if (params.config && typeof params.config === "object") {
            const cfg = params.config as Record<string, unknown>;
            if (cfg.systemInstruction) {
              body.systemInstruction =
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
              body.generationConfig = generationConfig;
            }
          }

          fetchPromise = (async () => {
            const vertexRes = await fetch(vertexUrl, {
              method: "POST",
              headers: vertexHeaders,
              body: JSON.stringify(body),
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

              // If Vertex AI returns permission denied (e.g. disabled API) or model not found, fallback to GoogleGenAI
              if (vertexRes.status === 403 || vertexRes.status === 404) {
                console.warn(`[Vertex AI Fallback] HTTP ${vertexRes.status}: Falling back to GoogleGenAI.`);
                const fallbackAi = new GoogleGenAI({
                  apiKey: effectiveKey,
                  httpOptions: {
                    headers: {
                      "User-Agent": "aistudio-build",
                    },
                  },
                });

                const fallbackRes = await fallbackAi.models.generateContent({
                  model: normalizeModel(params.model),
                  contents: params.contents as Parameters<typeof fallbackAi.models.generateContent>[0]["contents"],
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
          const ai = new GoogleGenAI({
            apiKey: effectiveKey,
            httpOptions: {
              headers: {
                "User-Agent": "aistudio-build",
              },
            },
          });

          fetchPromise = ai.models.generateContent({
            model: normalizeModel(params.model),
            contents: params.contents as Parameters<typeof ai.models.generateContent>[0]["contents"],
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
          selectedModel: params.model,
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
