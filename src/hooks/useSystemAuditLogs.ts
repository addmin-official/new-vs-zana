import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "../services/firebase.ts";
import { isAdmin } from "../auth/roles.ts";

export interface SystemAuditLogItem {
  id: string;
  type: string;
  path: string;
  timestamp: string;
  status: "CRITICAL" | "WARNING" | "INFO";
  message?: string;
  componentStack?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

export function useSystemAuditLogs() {
  const [logs, setLogs] = useState<SystemAuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirestoreDb();
    const auth = getFirebaseAuth();

    if (!db || !auth) {
      setLogs([]);
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;

    const setupListener = async () => {
      const currentUser = auth.currentUser;
      const isUserAdmin = await isAdmin(currentUser);
      if (!isUserAdmin) {
        setError("ڕێگەت پێدراو نییە بۆ بینینی تۆماری هەڵەکانی سیستم.");
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "errors"), orderBy("timestamp", "desc"), limit(50));
        unsub = onSnapshot(
          q,
          (snapshot) => {
            const list: SystemAuditLogItem[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              let formattedTime = "ئەمڕۆ";

              if (data.timestamp) {
                if (data.timestamp instanceof Timestamp) {
                  formattedTime = data.timestamp.toDate().toLocaleTimeString("ar-u-nu-arab");
                } else if (typeof data.timestamp === "number") {
                  formattedTime = new Date(data.timestamp).toLocaleTimeString("ar-u-nu-arab");
                }
              }

              const typeStr = String(data.type || data.name || (data.message ? "CLIENT_ERROR" : "SYSTEM_EVENT"));
              const pathStr = String(data.path || data.route || data.endpoint || "/");
              const messageStr = data.message ? String(data.message) : undefined;

              let status: "CRITICAL" | "WARNING" | "INFO" = "INFO";
              if (
                typeStr.includes("UNAUTHORIZED") ||
                typeStr.includes("SECURITY") ||
                typeStr.includes("FAIL") ||
                typeStr.includes("Error") ||
                typeStr.includes("ERROR")
              ) {
                status = "CRITICAL";
              } else if (
                typeStr.includes("TIMEOUT") ||
                typeStr.includes("FALLBACK") ||
                typeStr.includes("WARN")
              ) {
                status = "WARNING";
              }

              return {
                id: docSnap.id,
                type: typeStr,
                path: pathStr,
                timestamp: formattedTime,
                status,
                message: messageStr,
                componentStack: typeof data.componentStack === "string" ? data.componentStack : undefined,
                userAgent: typeof data.userAgent === "string" ? data.userAgent : undefined,
                details: data,
              };
            });

            setLogs(list);
            setLoading(false);
          },
          (err) => {
            console.warn("[useSystemAuditLogs] Snapshot error:", err);
            setLogs([]);
            setLoading(false);
          }
        );
      } catch (err) {
        console.warn("[useSystemAuditLogs] Query setup failed:", err);
        setLogs([]);
        setLoading(false);
      }
    };

    void setupListener();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const refetch = useCallback(async () => {
    // live onSnapshot handles updates automatically
  }, []);

  return {
    logs,
    loading,
    error,
    refetch,
  };
}
