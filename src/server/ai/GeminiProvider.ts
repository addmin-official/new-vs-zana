import { FirebaseAIProvider } from "./FirebaseAIProvider.ts";
import { AI_CONFIG, normalizeModel } from "../config/aiModels.ts";
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
    const maxRetries = AI_CONFIG.retryPolicy.maxRetries;
    const timeoutMs = AI_CONFIG.timeoutMs;
    const normalizedModel = normalizeModel(params.model);

    let attempt = 0;
    let lastError: unknown = null;

    while (attempt <= maxRetries) {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

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
