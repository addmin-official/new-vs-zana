import { useState, useEffect, useCallback } from "react";
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "../services/firebase.ts";
import { isAdmin, logAdminAction } from "../auth/roles.ts";

export type ServiceStatus = "ONLINE" | "DEGRADED" | "DOWN";
export type SyncStatus = "READY" | "SYNCING" | "ERROR";

export interface SystemHealthData {
  firebase: ServiceStatus;
  gemini: ServiceStatus;
  cloudflare: ServiceStatus;
  offlineSync: SyncStatus;
  lastChecked: Timestamp | null;
  version: string;
}

export const DEFAULT_SYSTEM_HEALTH: SystemHealthData = {
  firebase: "ONLINE",
  gemini: "ONLINE",
  cloudflare: "ONLINE",
  offlineSync: "READY",
  lastChecked: null,
  version: "2.0.0",
};

export function useSystemHealth() {
  const [data, setData] = useState<SystemHealthData>(DEFAULT_SYSTEM_HEALTH);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirestoreDb();
    const auth = getFirebaseAuth();

    if (!db || !auth) {
      setData(DEFAULT_SYSTEM_HEALTH);
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;

    const setupListener = async () => {
      const currentUser = auth.currentUser;
      const isUserAdmin = await isAdmin(currentUser);
      if (!isUserAdmin) {
        setError("ڕێگەت پێدراو نییە: بینینی بارودۆخی سیستەم تەنها بۆ بەڕێوەبەرە.");
        setLoading(false);
        return;
      }

      const healthDocRef = doc(db, "system", "health");

      unsub = onSnapshot(
        healthDocRef,
        async (docSnap) => {
          if (docSnap.exists()) {
            const h = docSnap.data() as Partial<SystemHealthData>;
            setData({
              firebase: h.firebase || "ONLINE",
              gemini: h.gemini || "ONLINE",
              cloudflare: h.cloudflare || "ONLINE",
              offlineSync: h.offlineSync || "READY",
              lastChecked: h.lastChecked || null,
              version: h.version || "2.0.0",
            });
            setError(null);
          } else {
            // Auto-create document with default ONLINE fields
            try {
              const initialData = {
                ...DEFAULT_SYSTEM_HEALTH,
                lastChecked: serverTimestamp(),
              };
              await setDoc(healthDocRef, initialData);
              setData(initialData as unknown as SystemHealthData);
            } catch (createErr) {
              console.warn("[useSystemHealth] Error auto-creating system health doc:", createErr);
            }
          }
          setLoading(false);
        },
        (err) => {
          console.warn("[useSystemHealth] onSnapshot error:", err);
          setError("کێشەیەک لە خوێندنەوەی بارودۆخی سیستەم ڕوویدا.");
          setLoading(false);
        }
      );
    };

    void setupListener();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const updateSystemHealth = useCallback(
    async (service: keyof SystemHealthData, status: string) => {
      const db = getFirestoreDb();
      if (!db) return;

      const healthDocRef = doc(db, "system", "health");
      const updates = {
        [service]: status,
        lastChecked: serverTimestamp(),
      };

      try {
        await setDoc(healthDocRef, updates, { merge: true });
        await logAdminAction("SYSTEM_HEALTH_UPDATE", undefined, { service, status });
      } catch (err) {
        console.error("[useSystemHealth] updateSystemHealth error:", err);
        throw err;
      }
    },
    []
  );

  const refetch = useCallback(async () => {
    const db = getFirestoreDb();
    if (!db) return;
    try {
      const snap = await getDoc(doc(db, "system", "health"));
      if (snap.exists()) {
        setData(snap.data() as SystemHealthData);
      }
    } catch {
      // Handled
    }
  }, []);

  return {
    data,
    loading,
    error,
    updateSystemHealth,
    refetch,
  };
}
