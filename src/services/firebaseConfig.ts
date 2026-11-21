// Firebase configuration — compatible with both browser (Vite) and Node (tests)

// Known expired or deprecated legacy keys to automatically reject
export const EXPIRED_LEGACY_KEYS = new Set<string>([
  "AIzaSyD_u4I9xPn6dFoSnDTe9pyNMQwltDEpjN0",
  "AIzaSyCE9MMzIC_o6dPDsrfYUlbZ8EMWAV6rdDI",
  "AIzaSyCGoc-gg1lQfsJziEUFyR6M48hXaUMKRkY",
]);

// Helper to sanitize and validate values
const isUsableEnvValue = (val: unknown): val is string => {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (trimmed.includes("YOUR_") || trimmed.includes("placeholder") || trimmed.includes("FakeKey")) return false;
  if (EXPIRED_LEGACY_KEYS.has(trimmed)) return false;
  return true;
};

const readConfigValue = (viteVal: unknown, nodeKey: string, fallback: string = ""): string => {
  if (isUsableEnvValue(viteVal)) {
    return viteVal.trim();
  }
  if (typeof process !== "undefined" && process.env) {
    const nodeVal = process.env[nodeKey];
    if (isUsableEnvValue(nodeVal)) {
      return nodeVal.trim();
    }
  }
  return fallback;
};

export const FALLBACK_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDHR1wy42EGBH37K6w6yAUC9OEO6hX8ons",
  authDomain: "gen-lang-client-0009572581.firebaseapp.com",
  projectId: "gen-lang-client-0009572581",
  storageBucket: "gen-lang-client-0009572581.firebasestorage.app",
  messagingSenderId: "958839183835",
  appId: "1:958839183835:web:80cec81bbb0227f7b82ffe",
  measurementId: "G-RG8T98ZHBB",
  firestoreDatabaseId: "(default)",
  oAuthClientId: "958839183835-3bc7tgfegi6ohldn6imvj7l9goombl6d.apps.googleusercontent.com",
  recaptchaSiteKey: "AIzaSyDpcEo0LJdjOg_ATmnFdrwVMKAX_MSOLVE",
};

export const firebaseConfig = {
  apiKey: readConfigValue(
    typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_API_KEY : undefined,
    "VITE_FIREBASE_API_KEY",
    FALLBACK_FIREBASE_CONFIG.apiKey
  ),
  authDomain: readConfigValue(
    typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : undefined,
    "VITE_FIREBASE_AUTH_DOMAIN",
    FALLBACK_FIREBASE_CONFIG.authDomain
  ),
  projectId: readConfigValue(
    typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_PROJECT_ID : undefined,
    "VITE_FIREBASE_PROJECT_ID",
    FALLBACK_FIREBASE_CONFIG.projectId
  ),
  storageBucket: readConfigValue(
    typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET : undefined,
    "VITE_FIREBASE_STORAGE_BUCKET",
    FALLBACK_FIREBASE_CONFIG.storageBucket
  ),
  messagingSenderId: readConfigValue(
    typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID : undefined,
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    FALLBACK_FIREBASE_CONFIG.messagingSenderId
  ),
  appId: readConfigValue(
    typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_APP_ID : undefined,
    "VITE_FIREBASE_APP_ID",
    FALLBACK_FIREBASE_CONFIG.appId
  ),
  measurementId: readConfigValue(
    typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_MEASUREMENT_ID : undefined,
    "VITE_FIREBASE_MEASUREMENT_ID",
    FALLBACK_FIREBASE_CONFIG.measurementId
  ),
  firestoreDatabaseId:
    readConfigValue(
      typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_DATABASE_ID : undefined,
      "VITE_FIREBASE_DATABASE_ID",
      FALLBACK_FIREBASE_CONFIG.firestoreDatabaseId
    ) || "(default)",
  oAuthClientId: readConfigValue(
    typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID : undefined,
    "VITE_FIREBASE_OAUTH_CLIENT_ID",
    FALLBACK_FIREBASE_CONFIG.oAuthClientId
  ),
  recaptchaSiteKey: readConfigValue(
    typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY : undefined,
    "VITE_FIREBASE_RECAPTCHA_SITE_KEY",
    FALLBACK_FIREBASE_CONFIG.recaptchaSiteKey
  ),
};

export const isFirebaseConfigured = (
  cfg: Partial<typeof firebaseConfig> = firebaseConfig
): boolean => {
  const apiKey = cfg.apiKey;
  const projectId = cfg.projectId;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) return false;
  if (!projectId || typeof projectId !== "string" || !projectId.trim()) return false;
  if (apiKey.includes("FakeKey") || apiKey.includes("placeholder") || apiKey.includes("YOUR_")) return false;
  if (EXPIRED_LEGACY_KEYS.has(apiKey.trim())) return false;
  if (projectId.includes("placeholder") || projectId.includes("YOUR_")) return false;
  return true;
};

export default firebaseConfig;