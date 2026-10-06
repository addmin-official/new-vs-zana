import { FirebaseAIProvider } from "./FirebaseAIProvider.ts";
import { AI_CONFIG, normalizeModel } from "../config/aiModels.ts";
import { classifyError, SafeErrorCategory } from "./AiErrors.ts";

export interface ProviderGenerateParams {
  apiKey?: string;
  model: string;
  contents: unknown;
  config?: unknown;
  pathname?: string;
  projectId?: string;
  env?: unknown;
}

// Track temporary exhaustion per model (e.g. 429 quota exhaustion)
const exhaustedModelsUntil = new Map<string, number>();

function extractStatusCode(err: unknown): number {
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

  if (providerStatusCode === 500 && typeof (err as Error)?.message === "string") {
    try {
      const parsed = JSON.parse((err as Error).message);
      if (parsed?.error?.code) {
        providerStatusCode = Number(parsed.error.code);
      }
    } catch {
      const msg = (err as Error).message;
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        providerStatusCode = 429;
      } else if (msg.includes("404")) {
        providerStatusCode = 404;
      }
    }
  }

  return providerStatusCode;
}

function parseRetryDelayMs(err: unknown): number {
  if (err && typeof err === "object") {
    const msg = typeof (err as Error).message === "string" ? (err as Error).message : "";
    const match = msg.match(/retry in ([0-9.]+)s/i);
    if (match?.[1]) {
      const sec = parseFloat(match[1]);
      if (!isNaN(sec) && sec > 0) {
        return Math.min(Math.ceil(sec * 1000) + 1000, 120_000);
      }
    }
  }
  return 60_000;
}

function isFatalNonRetryable(category: SafeErrorCategory): boolean {
  return (
    category === "missing_credentials" ||
    category === "invalid_credentials" ||
    category === "permission_denied" ||
    category === "validation" ||
    category === "upload_too_large" ||
    category === "unsupported_file"
  );
}

function isModelFallbackEligible(category: SafeErrorCategory, statusCode: number): boolean {
  return (
    category === "quota_exceeded" ||
    category === "rate_limited" ||
    category === "model_not_found" ||
    statusCode === 429 ||
    statusCode === 404
  );
}

export class GeminiProvider {
  static async generate(params: ProviderGenerateParams): Promise<{ text: string }> {
    const maxRetries = AI_CONFIG.retryPolicy.maxRetries;
    const timeoutMs = AI_CONFIG.timeoutMs;
    const initialModel = normalizeModel(params.model);

    const now = Date.now();
    const candidateList = [
      initialModel,
      ...AI_CONFIG.fallbackModels.map((m) => normalizeModel(m)),
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    // If initialModel is marked exhausted and other non-exhausted models exist, prioritize non-exhausted
    const candidateModels = candidateList.slice().sort((a, b) => {
      const aExhausted = (exhaustedModelsUntil.get(a) ?? 0) > now;
      const bExhausted = (exhaustedModelsUntil.get(b) ?? 0) > now;
      if (aExhausted && !bExhausted) return 1;
      if (!aExhausted && bExhausted) return -1;
      return 0;
    });

    let lastError: unknown = null;

    for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
      const currentModel = candidateModels[mIdx];
      const hasMoreModels = mIdx < candidateModels.length - 1;
      let attempt = 0;

      while (attempt <= maxRetries) {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        try {
          const generatePromise = FirebaseAIProvider.generate({
            model: currentModel,
            contents: params.contents,
            config: params.config,
            env: params.env,
            authToken: params.apiKey,
          });

          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error("Request timeout"));
            }, timeoutMs);
          });

          const result = await Promise.race([generatePromise, timeoutPromise]);
          if (timeoutId !== null) clearTimeout(timeoutId);

          // Clear any exhaustion mark upon success
          exhaustedModelsUntil.delete(currentModel);

          return result;
        } catch (err: unknown) {
          if (timeoutId !== null) clearTimeout(timeoutId);
          lastError = err;
          const category = classifyError(err);
          const providerStatusCode = extractStatusCode(err);

          if (providerStatusCode === 401) {
            console.warn("[GeminiProvider] 401 UNAUTHENTICATED: Invalid API key.");
          } else if (providerStatusCode === 403) {
            console.warn("[GeminiProvider] 403 PERMISSION_DENIED: Access denied.");
          } else if (providerStatusCode === 429) {
            console.warn("[GeminiProvider] 429 RATE_LIMITED: Rate limit or quota exceeded.");
          }

          console.error("[AI Diagnostic]", {
            pathname: params.pathname || "unknown",
            category,
            providerStatusCode,
            selectedModel: currentModel,
            hasApiKey: Boolean(params.apiKey),
            retryCount: attempt,
          });

          if (isFatalNonRetryable(category)) {
            throw err;
          }

          // If rate limited or quota exceeded, mark model exhausted and immediately try fallback model
          if (isModelFallbackEligible(category, providerStatusCode)) {
            const delay = parseRetryDelayMs(err);
            exhaustedModelsUntil.set(currentModel, Date.now() + delay);
            if (hasMoreModels) {
              console.warn(
                `[GeminiProvider] Model ${currentModel} hit rate limit / quota (${category}). Falling back to next candidate model.`
              );
              break; // Break retry loop to try next model immediately
            }
          }

          const isRetryable =
            (AI_CONFIG.retryPolicy.retryableStatusCodes as readonly number[]).includes(providerStatusCode) ||
            category === "timeout" ||
            category === "quota_exceeded" ||
            category === "rate_limited" ||
            category === "provider_unavailable";

          if (!isRetryable || attempt >= maxRetries) {
            if (hasMoreModels) {
              break; // Fallback to next model
            }
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
    }

    throw lastError;
  }
}
