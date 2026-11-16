/**
 * Feature Flag Evaluation Engine
 * Implements strict resolution priority:
 * 1. Firestore override (system/featureFlags)
 * 2. URL parameter (?flags=... in dev)
 * 3. localStorage override (dev only)
 * 4. Default value from flagConfig
 */

import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { getFirestoreDb } from "../../services/firebase.ts";
import {
  FEATURE_FLAGS,
  FeatureFlagName,
  FeatureFlagKey,
  FLAG_KEY_TO_NAME_MAP,
} from "./flagConfig.ts";

export interface FlagResolutionContext {
  userId?: string | null;
  isAdmin?: boolean;
  firestoreOverrides?: Record<string, boolean>;
}

const LOCAL_STORAGE_FLAG_KEY = "zana_feature_flags_override";

/**
 * Parses URL search parameters for flag overrides (dev only)
 * Format: ?flags=teacher_dashboard,parent_portal or ?flag:teacher_dashboard=true
 */
export function getDevUrlFlagOverrides(): Record<string, boolean> {
  if (typeof window === "undefined" || !window.location) return {};
  const isDev = import.meta.env.DEV || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (!isDev) return {};

  const params = new URLSearchParams(window.location.search);
  const overrides: Record<string, boolean> = {};

  // Case 1: comma-separated list ?flags=teacher_dashboard,admin_dashboard
  const flagsList = params.get("flags");
  if (flagsList) {
    flagsList.split(",").forEach((item) => {
      const trimmed = item.trim();
      if (trimmed.startsWith("!")) {
        overrides[trimmed.slice(1)] = false;
      } else if (trimmed) {
        overrides[trimmed] = true;
      }
    });
  }

  // Case 2: explicit ?flag:teacher_dashboard=true
  params.forEach((value, key) => {
    if (key.startsWith("flag:")) {
      const flagName = key.replace("flag:", "").trim();
      overrides[flagName] = value === "true" || value === "1";
    }
  });

  return overrides;
}

/**
 * Parses localStorage flag overrides (dev only)
 */
export function getDevLocalStorageFlagOverrides(): Record<string, boolean> {
  if (typeof window === "undefined" || !window.localStorage) return {};
  const isDev = import.meta.env.DEV || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (!isDev) return {};

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_FLAG_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

/**
 * Resolves a single feature flag according to the 4-tier priority
 */
export function resolveFeatureFlag(
  flagName: FeatureFlagName,
  context?: FlagResolutionContext
): boolean {
  const meta = FEATURE_FLAGS[flagName];
  if (!meta) return false;

  const flagKey: FeatureFlagKey = meta.key;

  // Tier 1: Firestore override (global or user-specific)
  if (context?.firestoreOverrides) {
    // User-specific override inside firestoreOverrides if passed
    if (context.userId && context.firestoreOverrides[`user:${context.userId}:${flagKey}`] !== undefined) {
      return Boolean(context.firestoreOverrides[`user:${context.userId}:${flagKey}`]);
    }
    if (context.firestoreOverrides[flagKey] !== undefined) {
      return Boolean(context.firestoreOverrides[flagKey]);
    }
    if (context.firestoreOverrides[flagName] !== undefined) {
      return Boolean(context.firestoreOverrides[flagName]);
    }
  }

  // Tier 2: URL param override (dev only)
  const urlOverrides = getDevUrlFlagOverrides();
  if (urlOverrides[flagKey] !== undefined) {
    return urlOverrides[flagKey];
  }
  if (urlOverrides[flagName] !== undefined) {
    return urlOverrides[flagName];
  }

  // Tier 3: localStorage override (dev only)
  const localOverrides = getDevLocalStorageFlagOverrides();
  if (localOverrides[flagKey] !== undefined) {
    return localOverrides[flagKey];
  }
  if (localOverrides[flagName] !== undefined) {
    return localOverrides[flagName];
  }

  // Tier 4: Default value from configuration
  return meta.defaultValue;
}

/**
 * Subscribes to the single Firestore system/featureFlags document
 */
export function subscribeToFirestoreFeatureFlags(
  onUpdate: (flags: Record<string, boolean>) => void,
  userId?: string | null
): () => void {
  const db = getFirestoreDb();
  if (!db) {
    onUpdate({});
    return () => {};
  }

  try {
    const flagDocRef = doc(db, "system", "featureFlags");

    // Real-time listener for live updates from admin console
    const unsubscribe = onSnapshot(
      flagDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate({});
          return;
        }

        const data = snapshot.data();
        const extracted: Record<string, boolean> = {};

        // 1. Global flags map if document has `flags: { ... }` or root fields
        const rawFlags = (data.flags as Record<string, unknown>) || data;
        Object.entries(rawFlags).forEach(([k, val]) => {
          if (typeof val === "boolean") {
            extracted[k] = val;
            const mappedName = FLAG_KEY_TO_NAME_MAP[k];
            if (mappedName) {
              extracted[mappedName] = val;
            }
          }
        });

        // 2. User-specific overrides if document has `userOverrides: { [uid]: { ... } }`
        if (userId && data.userOverrides && typeof data.userOverrides === "object") {
          const userSpecific = (data.userOverrides as Record<string, Record<string, boolean>>)[userId];
          if (userSpecific && typeof userSpecific === "object") {
            Object.entries(userSpecific).forEach(([k, val]) => {
              if (typeof val === "boolean") {
                extracted[k] = val;
                extracted[`user:${userId}:${k}`] = val;
              }
            });
          }
        }

        onUpdate(extracted);
      },
      (err) => {
        console.warn("Firestore system/featureFlags subscription warning (using local defaults):", err);
        onUpdate({});
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Failed to set up Firestore featureFlags listener:", err);
    onUpdate({});
    return () => {};
  }
}

/**
 * Fetch feature flags document once
 */
export async function fetchFirestoreFeatureFlags(): Promise<Record<string, boolean>> {
  const db = getFirestoreDb();
  if (!db) return {};

  try {
    const flagDocRef = doc(db, "system", "featureFlags");
    const snapshot = await getDoc(flagDocRef);
    if (!snapshot.exists()) return {};

    const data = snapshot.data();
    const extracted: Record<string, boolean> = {};
    const rawFlags = (data.flags as Record<string, unknown>) || data;

    Object.entries(rawFlags).forEach(([k, val]) => {
      if (typeof val === "boolean") {
        extracted[k] = val;
      }
    });

    return extracted;
  } catch (err) {
    console.warn("fetchFirestoreFeatureFlags error:", err);
    return {};
  }
}
