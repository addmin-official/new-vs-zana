export const AI_CONFIG = {
  apiBaseUrl: "https://generativelanguage.googleapis.com",
  primaryModel: "gemini-3.1-flash-lite",
  visionModel: "gemini-3.1-flash-lite",
  fallbackModels: ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"] as const,
  timeoutMs: 30000,
  retryPolicy: {
    maxRetries: 2,
    baseBackoffMs: 300,
    maxBackoffMs: 1000,
    retryableStatusCodes: [429, 500, 502, 503, 504],
  },
} as const;

export interface ModelNormalizationDiagnostic {
  overridePresent: boolean;
  invalidFormat: boolean;
  fallbackUsed: boolean;
  selectedModel: string;
}

export function normalizeModel(
  model?: string | null,
  fallbackModel: string = AI_CONFIG.primaryModel,
  outDiagnostic?: (diag: ModelNormalizationDiagnostic) => void
): string {
  if (!model || typeof model !== "string" || !model.trim()) {
    if (outDiagnostic) {
      outDiagnostic({
        overridePresent: false,
        invalidFormat: false,
        fallbackUsed: true,
        selectedModel: fallbackModel,
      });
    }
    return fallbackModel;
  }

  let cleaned = model.trim();

  // Strip surrounding quotes
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Strip repeated prefixes
  while (cleaned.startsWith("models/")) {
    cleaned = cleaned.substring(7).trim();
  }
  while (cleaned.startsWith("gemini/")) {
    cleaned = cleaned.substring(7).trim();
  }

  // Normalize deprecated or legacy model names to active Gemini models
  if (
    cleaned === "gemini-1.5-flash" ||
    cleaned === "gemini-1.5-flash-001" ||
    cleaned === "gemini-2.5-flash" ||
    cleaned === "gemini-2.0-flash" ||
    cleaned === "gemini-pro" ||
    cleaned === "gemini-1.5-pro" ||
    cleaned === "gemini-1.5-pro-001"
  ) {
    cleaned = AI_CONFIG.primaryModel;
  }

  // Check for invalid format (URL, slashes, spaces, path traversal, control chars)
  const isInvalid =
    !cleaned ||
    cleaned.includes("://") ||
    cleaned.includes("/") ||
    cleaned.includes("..") ||
    /\s/.test(cleaned) ||
    /[\x00-\x1F\x7F]/.test(cleaned) ||
    !/^[a-zA-Z0-9_.-]+$/.test(cleaned);

  if (isInvalid) {
    if (outDiagnostic) {
      outDiagnostic({
        overridePresent: true,
        invalidFormat: true,
        fallbackUsed: true,
        selectedModel: fallbackModel,
      });
    }
    throw new Error("Invalid model name override format");
  }

  if (outDiagnostic) {
    outDiagnostic({
      overridePresent: true,
      invalidFormat: false,
      fallbackUsed: false,
      selectedModel: cleaned,
    });
  }

  return cleaned;
}

export function resolvePrimaryModel(env?: { GEMINI_PRIMARY_MODEL?: string; AI_MODEL_PRIMARY?: string }): string {
  const envVal =
    env?.GEMINI_PRIMARY_MODEL ||
    env?.AI_MODEL_PRIMARY ||
    (typeof process !== "undefined" ? process.env?.GEMINI_PRIMARY_MODEL || process.env?.AI_MODEL_PRIMARY : undefined);
  return normalizeModel(envVal, AI_CONFIG.primaryModel);
}

export function resolveVisionModel(env?: { GEMINI_VISION_MODEL?: string; AI_MODEL_VISION?: string }): string {
  const envVal =
    env?.GEMINI_VISION_MODEL ||
    env?.AI_MODEL_VISION ||
    (typeof process !== "undefined" ? process.env?.GEMINI_VISION_MODEL || process.env?.AI_MODEL_VISION : undefined);
  return normalizeModel(envVal, AI_CONFIG.visionModel);
}

export function getPrimaryModel(env?: { GEMINI_PRIMARY_MODEL?: string; AI_MODEL_PRIMARY?: string }): string {
  return resolvePrimaryModel(env);
}

export function getVisionModel(env?: { GEMINI_VISION_MODEL?: string; AI_MODEL_VISION?: string }): string {
  return resolveVisionModel(env);
}

export const VERTEX_AI_CONFIG = {
  location: "us-central1",
  endpointTemplate: "https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/{MODEL_ID}:streamGenerateContent",
} as const;

export function getVertexAiEndpoint(projectId: string, modelId: string): string {
  const normalizedModel = normalizeModel(modelId);
  return `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${normalizedModel}:streamGenerateContent`;
}
