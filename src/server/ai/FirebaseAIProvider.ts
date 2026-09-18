import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { getAuth, signInAnonymously, signInWithCustomToken, type Auth } from "firebase/auth";

export interface FirebaseAIGenerateParams {
  model: string;
  contents: unknown;
  config?: unknown;
  env?: unknown;
  authToken?: string;
  apiKey?: string;
}

function resolveEnvVar(key: string, env?: unknown): string | undefined {
  if (env && typeof env === "object") {
    const val = (env as Record<string, unknown>)[key];
    if (typeof val === "string" && val.trim().length > 0) return val.trim();
  }
  if (typeof process !== "undefined" && process.env) {
    const val = process.env[key];
    if (typeof val === "string" && val.trim().length > 0) return val.trim();
  }
  return undefined;
}

export class FirebaseAIProvider {
  private static app: FirebaseApp | null = null;
  private static auth: Auth | null = null;

  private static getOrCreateApp(env?: unknown, providedApiKey?: string): { app: FirebaseApp; apiKey: string } {
    const isTest =
      typeof process !== "undefined" &&
      (process.env?.NODE_ENV === "test" || process.env?.ZANA_ENV === "test");

    const apiKey =
      (providedApiKey && typeof providedApiKey === "string" && providedApiKey.trim().length > 0
        ? providedApiKey.trim()
        : undefined) ||
      resolveEnvVar("VITE_FIREBASE_API_KEY", env) ||
      resolveEnvVar("FIREBASE_API_KEY", env) ||
      resolveEnvVar("GEMINI_API_KEY", env) ||
      (isTest ? "AIzaSyFakeKeyForTestEnvironmentOnly12345" : undefined);

    if (!apiKey) {
      throw new Error(
        "No Firebase API key available. Set VITE_FIREBASE_API_KEY as a Cloudflare Secret."
      );
    }

    const existingApps = getApps();
    if (existingApps.length > 0) {
      const existingApp = existingApps[0] || getApp();
      if (!this.auth) {
        this.auth = getAuth(existingApp);
      }
      return { app: existingApp, apiKey };
    }

    if (this.app) {
      if (!this.auth) {
        this.auth = getAuth(this.app);
      }
      return { app: this.app, apiKey };
    }

    const projectId =
      resolveEnvVar("VITE_FIREBASE_PROJECT_ID", env) ||
      resolveEnvVar("FIREBASE_PROJECT_ID", env) ||
      resolveEnvVar("PROJECT_ID", env) ||
      "gen-lang-client-0009572581";

    const authDomain =
      resolveEnvVar("VITE_FIREBASE_AUTH_DOMAIN", env) ||
      `${projectId}.firebaseapp.com`;

    const storageBucket =
      resolveEnvVar("VITE_FIREBASE_STORAGE_BUCKET", env) ||
      `${projectId}.firebasestorage.app`;

    const messagingSenderId =
      resolveEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID", env) ||
      "958839183835";

    const appId =
      resolveEnvVar("VITE_FIREBASE_APP_ID", env) ||
      "1:958839183835:web:80cec81bbb0227f7b82ffe";

    this.app = initializeApp({
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    });

    this.auth = getAuth(this.app);

    return { app: this.app, apiKey };
  }

  private static async fallbackDirectGemini(
    modelName: string,
    payload: unknown,
    config: Record<string, unknown>,
    apiKey: string
  ): Promise<string> {
    const candidateModels = [modelName, "gemini-3.6-flash", "gemini-flash-latest"];
    let lastErr: unknown = null;

    for (const m of candidateModels) {
      try {
        const cleanModel = m.replace(/^models\//, "");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const bodyPayload: Record<string, unknown> = {};
        if (payload && typeof payload === "object" && "contents" in (payload as Record<string, unknown>)) {
          bodyPayload.contents = (payload as Record<string, unknown>).contents;
        } else if (Array.isArray(payload)) {
          bodyPayload.contents = payload;
        } else {
          bodyPayload.contents = [{ role: "user", parts: [{ text: String(payload) }] }];
        }

        if (config.systemInstruction) {
          bodyPayload.systemInstruction =
            typeof config.systemInstruction === "string"
              ? { parts: [{ text: config.systemInstruction }] }
              : config.systemInstruction;
        }

        const genConfig: Record<string, unknown> = {};
        if (typeof config.temperature === "number") genConfig.temperature = config.temperature;
        if (typeof config.maxOutputTokens === "number") genConfig.maxOutputTokens = config.maxOutputTokens;
        if (typeof config.responseMimeType === "string") genConfig.responseMimeType = config.responseMimeType;
        if (config.responseSchema) genConfig.responseSchema = config.responseSchema;

        if (Object.keys(genConfig).length > 0) {
          bodyPayload.generationConfig = genConfig;
        }

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyPayload),
        });

        if (!res.ok) {
          const errText = await res.text();
          const err = new Error(`Direct Gemini API failed with HTTP ${res.status}: ${errText}`);
          (err as unknown as Record<string, unknown>).status = res.status;
          throw err;
        }

        const data = (await res.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{ text?: string }>;
            };
          }>;
        };

        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof replyText === "string" && replyText.trim().length > 0) {
          return replyText.trim();
        }
      } catch (err: unknown) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("404") || msg.includes("no longer available") || msg.includes("NOT_FOUND")) {
          continue;
        }
        throw err;
      }
    }

    throw lastErr || new Error("Direct Gemini fallback failed for all candidate models");
  }

  static async generate(params: FirebaseAIGenerateParams): Promise<{ text: string }> {
    const { app, apiKey } = this.getOrCreateApp(params.env, params.apiKey);

    if (this.auth) {
      if (params.authToken && params.authToken.split(".").length === 3) {
        try {
          await signInWithCustomToken(this.auth, params.authToken);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`[FirebaseAIProvider] Auth fallback failed: ${message}`);
        }
      }
      if (!this.auth.currentUser) {
        try {
          await signInAnonymously(this.auth);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`[FirebaseAIProvider] Auth fallback failed: ${message}`);
        }
      }
    }

    const ai = getAI(app, { backend: new GoogleAIBackend() });

    const cfg = (params.config && typeof params.config === "object" ? params.config : {}) as Record<string, unknown>;

    const modelOptions: {
      model: string;
      systemInstruction?: unknown;
      generationConfig?: Record<string, unknown>;
    } = {
      model: params.model,
    };

    if (cfg.systemInstruction) {
      modelOptions.systemInstruction = cfg.systemInstruction;
    }

    const generationConfig: Record<string, unknown> = {};
    if (typeof cfg.temperature === "number") generationConfig.temperature = cfg.temperature;
    if (typeof cfg.maxOutputTokens === "number") generationConfig.maxOutputTokens = cfg.maxOutputTokens;
    if (typeof cfg.responseMimeType === "string") generationConfig.responseMimeType = cfg.responseMimeType;
    if (cfg.responseSchema) generationConfig.responseSchema = cfg.responseSchema;

    if (Object.keys(generationConfig).length > 0) {
      modelOptions.generationConfig = generationConfig;
    }

    const model = getGenerativeModel(ai, modelOptions as Parameters<typeof getGenerativeModel>[1]);

    let requestPayload: unknown;
    if (typeof params.contents === "string") {
      requestPayload = { contents: [{ role: "user", parts: [{ text: params.contents }] }] };
    } else if (Array.isArray(params.contents)) {
      if (params.contents.length > 0 && typeof params.contents[0] === "string") {
        requestPayload = {
          contents: [{ role: "user", parts: (params.contents as string[]).map((t) => ({ text: t })) }],
        };
      } else if (
        params.contents.length > 0 &&
        typeof params.contents[0] === "object" &&
        params.contents[0] !== null &&
        "role" in params.contents[0]
      ) {
        requestPayload = { contents: params.contents };
      } else {
        // Array of parts (e.g. text + inlineData for vision)
        requestPayload = { contents: [{ role: "user", parts: params.contents }] };
      }
    } else if (
      params.contents &&
      typeof params.contents === "object" &&
      "contents" in (params.contents as Record<string, unknown>)
    ) {
      requestPayload = params.contents;
    } else {
      requestPayload = params.contents;
    }

    let text = "";
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await model.generateContent(requestPayload as any);
      text = result.response.text();
    } catch (firebaseErr: unknown) {
      const errMsg = firebaseErr instanceof Error ? firebaseErr.message : String(firebaseErr);
      console.warn(`[FirebaseAIProvider] Firebase AI call failed (${errMsg}), falling back to direct Gemini endpoint...`);
      text = await this.fallbackDirectGemini(params.model, requestPayload, cfg, apiKey);
    }

    if (typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Invalid provider response: empty response text");
    }

    return { text: text.trim() };
  }
}
