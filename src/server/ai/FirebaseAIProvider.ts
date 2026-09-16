import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { getAuth, signInAnonymously, signInWithCustomToken, type Auth } from "firebase/auth";

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

  private static getOrCreateApp(env?: unknown): FirebaseApp {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      const existingApp = existingApps[0] || getApp();
      if (!this.auth) {
        this.auth = getAuth(existingApp);
      }
      return existingApp;
    }

    if (this.app) {
      if (!this.auth) {
        this.auth = getAuth(this.app);
      }
      return this.app;
    }

    const isTest =
      resolveEnvVar("NODE_ENV", env) === "test" ||
      resolveEnvVar("ZANA_ENV", env) === "test" ||
      (typeof process !== "undefined" &&
        (process.env?.NODE_ENV === "test" || process.env?.ZANA_ENV === "test"));

    let apiKey = resolveEnvVar("VITE_FIREBASE_API_KEY", env);
    if (apiKey === "AIzaSyFakeKeyForTestEnvironmentOnly12345" && !isTest) {
      apiKey = undefined;
    }
    if (!apiKey) {
      apiKey = resolveEnvVar("FIREBASE_API_KEY", env) || resolveEnvVar("GEMINI_API_KEY", env);
    }
    if (!apiKey) {
      if (isTest) {
        apiKey = "AIzaSyFakeKeyForTestEnvironmentOnly12345";
      } else {
        throw new Error("Missing Firebase API key: VITE_FIREBASE_API_KEY or GEMINI_API_KEY is required in production");
      }
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

    return this.app;
  }

  static async generate(params: FirebaseAIGenerateParams): Promise<{ text: string }> {
    const app = this.getOrCreateApp(params.env);

    if (this.auth) {
      if (params.authToken) {
        try {
          await signInWithCustomToken(this.auth, params.authToken);
        } catch (authError) {
          console.warn("[FirebaseAIProvider] Custom token auth failed:", authError);
        }
      } else if (!this.auth.currentUser) {
        try {
          await signInAnonymously(this.auth);
        } catch (authError) {
          console.warn("[FirebaseAIProvider] Anonymous auth failed:", authError);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await model.generateContent(requestPayload as any);
    const text = result.response.text();

    if (typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Invalid provider response: empty response text");
    }

    return { text: text.trim() };
  }
}
