// Firebase configuration — compatible with both browser (Vite) and Node (tests)

// Safe access to import.meta.env (only available in Vite/browser)
const viteEnv: Record<string, string | undefined> =
  typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env as Record<string, string | undefined>)
    : {};

// Safe access to process.env (available in Node/tests)
const nodeEnv: Record<string, string | undefined> =
  typeof process !== "undefined" && process.env
    ? (process.env as Record<string, string | undefined>)
    : {};

const isTest =
  nodeEnv.NODE_ENV === "test" ||
  nodeEnv.ZANA_ENV === "test" ||
  nodeEnv.ALLOW_TEST_AUTH_MOCK === "true";

export const FALLBACK_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
  firestoreDatabaseId: "(default)",
  oAuthClientId: "",
  recaptchaSiteKey: "",
};

const isUsableEnvValue = (val: string | undefined): val is string => {
  if (!val || !val.trim()) return false;
  if (val.includes("YOUR_") || val.includes("placeholder") || val.includes("FakeKey")) return false;
  return true;
};

// Helper: read from Vite env first, then Node env, then canonical fallback
const readEnv = (
  key: string,
  fallbackKey?: keyof typeof FALLBACK_FIREBASE_CONFIG,
  aliasKeys: string[] = []
): string => {
  const candidates = [
    viteEnv[key],
    nodeEnv[key],
    ...aliasKeys.flatMap((alias) => [viteEnv[alias], nodeEnv[alias]]),
  ];
  for (const val of candidates) {
    if (isUsableEnvValue(val)) {
      return val.trim();
    }
  }
  const rawPrimary = viteEnv[key] || nodeEnv[key];
  if (isTest && !rawPrimary) {
    return "";
  }
  return fallbackKey ? FALLBACK_FIREBASE_CONFIG[fallbackKey] : "";
};

export const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY", "apiKey"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN", "authDomain"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID", "projectId"),
  storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET", "storageBucket"),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "messagingSenderId"),
  appId: readEnv("VITE_FIREBASE_APP_ID", "appId"),
  measurementId: readEnv("VITE_FIREBASE_MEASUREMENT_ID", "measurementId"),
  firestoreDatabaseId: readEnv("VITE_FIREBASE_DATABASE_ID", "firestoreDatabaseId"),
  oAuthClientId: readEnv("VITE_FIREBASE_OAUTH_CLIENT_ID", "oAuthClientId"),
  recaptchaSiteKey: readEnv("VITE_FIREBASE_RECAPTCHA_SITE_KEY", "recaptchaSiteKey", [
    "VITE_FIREBASE_recaptcha_Site_Key",
  ]),
};

export const isFirebaseConfigured = (
  cfg: Partial<typeof firebaseConfig> = firebaseConfig
): boolean => {
  const apiKey = cfg.apiKey;
  const projectId = cfg.projectId;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) return false;
  if (!projectId || typeof projectId !== "string" || !projectId.trim()) return false;
  if (apiKey.includes("FakeKey") || apiKey.includes("placeholder") || apiKey.includes("YOUR_")) return false;
  if (projectId.includes("placeholder") || projectId.includes("YOUR_")) return false;
  return true;
};

export default firebaseConfig;