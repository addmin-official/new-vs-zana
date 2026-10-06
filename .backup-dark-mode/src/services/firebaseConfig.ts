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

// Helper: read from Vite env first, then Node env, then empty string
const readEnv = (key: string): string =>
  viteEnv[key] || nodeEnv[key] || "";

export const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: readEnv("VITE_FIREBASE_APP_ID"),
  measurementId: readEnv("VITE_FIREBASE_MEASUREMENT_ID"),
  firestoreDatabaseId: readEnv("VITE_FIREBASE_DATABASE_ID"),
  oAuthClientId: readEnv("VITE_FIREBASE_OAUTH_CLIENT_ID"),
  recaptchaSiteKey: readEnv("VITE_FIREBASE_RECAPTCHA_SITE_KEY"),
};

export const isFirebaseConfigured = (
  cfg: Partial<typeof firebaseConfig> = firebaseConfig
): boolean => {
  const apiKey = cfg.apiKey;
  const projectId = cfg.projectId;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) return false;
  if (!projectId || typeof projectId !== "string" || !projectId.trim()) return false;
  if (apiKey.includes("FakeKey") || apiKey.includes("placeholder")) return false;
  return true;
};

export default firebaseConfig;