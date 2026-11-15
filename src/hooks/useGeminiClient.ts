import { useState, useRef, useCallback } from "react";
import { SafetyFilter } from "../ai/safetyFilter.ts";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number; // in USD
}

export interface GeminiRequestOptions {
  endpoint?: string;
  body: Record<string, unknown>;
  onStreamChunk?: (chunk: string) => void;
  skipCache?: boolean;
}

interface CacheEntry {
  timestamp: number;
  data: unknown;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CONCURRENT_REQUESTS = 3;
const REQUEST_TIMEOUT_MS = 15000; // 15 seconds hard limit
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000];

// Global in-memory cache shared across hook instances
const clientCache = new Map<string, CacheEntry>();

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

export function useGeminiClient() {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
  });

  const activeRequestsRef = useRef<number>(0);
  const queueRef = useRef<Array<() => void>>([]);

  const acquireSlot = useCallback(async (): Promise<void> => {
    if (activeRequestsRef.current < MAX_CONCURRENT_REQUESTS) {
      activeRequestsRef.current += 1;
      return;
    }
    return new Promise<void>((resolve) => {
      queueRef.current.push(() => {
        activeRequestsRef.current += 1;
        resolve();
      });
    });
  }, []);

  const releaseSlot = useCallback(() => {
    activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1);
    const next = queueRef.current.shift();
    if (next) {
      next();
    }
  }, []);

  const executeRequest = useCallback(
    async <T = Record<string, unknown>>(options: GeminiRequestOptions): Promise<T> => {
      const endpoint = options.endpoint || "/api/chat";
      const payloadString = JSON.stringify(options.body);
      const cacheKey = `${endpoint}_${hashString(payloadString)}`;

      // 1. Cache Check (within 5-minute window)
      if (!options.skipCache) {
        const cached = clientCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          return cached.data as T;
        }
      }

      await acquireSlot();
      setIsStreaming(true);

      let lastError: Error | null = null;

      try {
        for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

          try {
            const res = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: payloadString,
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Exponential backoff on 429 or 503
            if ((res.status === 429 || res.status === 503) && attempt < RETRY_DELAYS_MS.length) {
              const delay = RETRY_DELAYS_MS[attempt];
              await new Promise((r) => setTimeout(r, delay));
              continue;
            }

            if (!res.ok) {
              throw new Error(`داواکارییەکە سەرکەوتوو نەبوو (${res.status})`);
            }

            // Streaming support
            let resultData: T;
            if (options.onStreamChunk && res.body && typeof res.body.getReader === "function") {
              const reader = res.body.getReader();
              const decoder = new TextDecoder("utf-8");
              let fullText = "";

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                options.onStreamChunk(chunk);
              }

              try {
                resultData = JSON.parse(fullText) as T;
              } catch {
                resultData = { text: fullText } as unknown as T;
              }
            } else {
              resultData = (await res.json()) as T;
            }

            // Estimate token usage & cost
            const promptChars = payloadString.length;
            const completionChars = JSON.stringify(resultData).length;
            const promptTokensEst = Math.ceil(promptChars / 4);
            const completionTokensEst = Math.ceil(completionChars / 4);
            const totalTokensEst = promptTokensEst + completionTokensEst;
            // Cost calculation: Flash rate ~$0.075 / 1M input, $0.30 / 1M output
            const costEst = (promptTokensEst * 0.075 + completionTokensEst * 0.3) / 1_000_000;

            setTokenUsage((prev) => ({
              promptTokens: prev.promptTokens + promptTokensEst,
              completionTokens: prev.completionTokens + completionTokensEst,
              totalTokens: prev.totalTokens + totalTokensEst,
              estimatedCost: prev.estimatedCost + costEst,
            }));

            // Validate Safety
            if (resultData && typeof resultData === "object" && "text" in resultData) {
              const textToCheck = String((resultData as { text: unknown }).text || "");
              const validation = SafetyFilter.validateResponse(textToCheck);
              if (!validation.isValid) {
                console.warn("[SafetyFilter Warning]", validation.reason);
              }
            }

            // Save to Cache
            clientCache.set(cacheKey, { timestamp: Date.now(), data: resultData });
            return resultData;
          } catch (err: unknown) {
            clearTimeout(timeoutId);
            const isAbort = (err as Error).name === "AbortError";
            if (isAbort) {
              lastError = new Error("کاتی وەڵامدانەوە بەسەرچوو (١٥ چرکە). تکایە دووبارە هەوڵبدەرەوە.");
            } else {
              lastError = err as Error;
            }

            if (attempt < RETRY_DELAYS_MS.length && !isAbort) {
              const delay = RETRY_DELAYS_MS[attempt];
              await new Promise((r) => setTimeout(r, delay));
              continue;
            }
            break;
          }
        }

        throw lastError || new Error("هەڵەی پەیوەندی بە ژیریی دەستکرد");
      } finally {
        setIsStreaming(false);
        releaseSlot();
      }
    },
    [acquireSlot, releaseSlot]
  );

  return {
    executeRequest,
    isStreaming,
    tokenUsage,
  };
}
