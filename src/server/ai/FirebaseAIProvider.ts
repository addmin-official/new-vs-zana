import { GoogleGenAI } from "@google/genai";

export interface FirebaseAIGenerateParams {
  model: string;
  contents: unknown;
  config?: unknown;
  env?: unknown;
  authToken?: string;
}

function resolveEnvVar(key: string, env?: unknown): string | undefined {
  if (env && typeof env === "object") {
    const val = (env as Record<string, unknown>)[key];
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim();
    }
  }
  if (typeof process !== "undefined" && process.env) {
    const val = process.env[key];
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim();
    }
  }
  return undefined;
}

function normalizeContents(input: unknown): unknown {
  if (typeof input === "string") {
    return [{ role: "user", parts: [{ text: input }] }];
  }
  if (Array.isArray(input)) {
    if (input.length === 0) {
      return [{ role: "user", parts: [{ text: "" }] }];
    }
    if (input.every((item) => typeof item === "string")) {
      return [{ role: "user", parts: (input as string[]).map((text) => ({ text })) }];
    }
    if (input.every((item) => item && typeof item === "object" && "role" in item && "parts" in item)) {
      return input;
    }
    return [{ role: "user", parts: input }];
  }
  if (input && typeof input === "object" && "contents" in input) {
    return (input as { contents: unknown }).contents;
  }
  return input;
}

function buildConfig(configInput?: unknown): Record<string, unknown> | undefined {
  if (!configInput || typeof configInput !== "object") {
    return undefined;
  }
  const raw = configInput as Record<string, unknown>;
  const config: Record<string, unknown> = {};

  if (
    typeof raw.systemInstruction === "string" ||
    (raw.systemInstruction && typeof raw.systemInstruction === "object")
  ) {
    config.systemInstruction = raw.systemInstruction;
  }

  if (typeof raw.temperature === "number") {
    config.temperature = raw.temperature;
  }
  if (typeof raw.maxOutputTokens === "number") {
    config.maxOutputTokens = raw.maxOutputTokens;
  }
  if (typeof raw.responseMimeType === "string") {
    config.responseMimeType = raw.responseMimeType;
  }
  if (raw.responseSchema) {
    config.responseSchema = raw.responseSchema;
  }

  return Object.keys(config).length > 0 ? config : undefined;
}

export class FirebaseAIProvider {
  private static aiClient: GoogleGenAI | null = null;
  private static cachedConfigKey: string | null = null;

  static async generate(params: FirebaseAIGenerateParams): Promise<{ text: string }> {
    const accountId = resolveEnvVar("CF_ACCOUNT_ID", params.env) || "9bbac6865a80cafb336c82029cc7bb49";
    const gatewayId = resolveEnvVar("CF_GATEWAY_ID", params.env) || "zana-gateway";
    const cfAigToken = resolveEnvVar("CF_AIG_TOKEN", params.env);
    const apiKey = resolveEnvVar("GEMINI_API_KEY", params.env);

    if (!cfAigToken) {
      throw new Error("CF_AIG_TOKEN is required for Cloudflare AI Gateway.");
    }
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required.");
    }

    const baseUrl = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/google-ai-studio`;
    const configKey = `${accountId}:${gatewayId}:${cfAigToken}:${apiKey}`;

    if (!this.aiClient || this.cachedConfigKey !== configKey) {
      this.aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          baseUrl,
          headers: {
            "cf-aig-authorization": `Bearer ${cfAigToken}`,
          },
        },
      });
      this.cachedConfigKey = configKey;
    }

    const contents = normalizeContents(params.contents);
    const config = buildConfig(params.config);

    const response = await this.aiClient.models.generateContent({
      model: params.model,
      contents: contents as Parameters<InstanceType<typeof GoogleGenAI>["models"]["generateContent"]>[0]["contents"],
      ...(config ? { config } : {}),
    });

    const text = response.text?.trim() || "";
    if (!text) {
      throw new Error("Invalid provider response: empty response text");
    }

    return { text };
  }
}
