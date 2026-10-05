const detectTestEnv = (): boolean => {
  if (typeof process === "undefined" || !process.env) return false;
  if (process.env.NODE_ENV === "test" || process.env.ZANA_ENV === "test") return true;
  if (process.env.NODE_TEST_CONTEXT !== undefined) return true;
  if (process.argv && process.argv.some(arg => arg.includes("test") || arg.includes("tsx"))) return true;
  return false;
};

const isTest = detectTestEnv();

// Firebase configuration — injected at build time by Vite
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "",
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || "",
  recaptchaSiteKey: import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || "",
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