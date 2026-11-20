import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export interface ErrorBoundaryProps {
  children?: ReactNode;
  route?: string;
  fallbackPath?: string;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  const msg = error.message || String(error);
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    error.name === "ChunkLoadError"
  );
}

/**
 * Log error safely to Firestore `errors` collection in production, or console in development.
 * Never leaks sensitive data or student personal tokens.
 */
async function logAppError(error: Error, errorInfo?: ErrorInfo, route?: string) {
  if (import.meta.env.DEV) {
    console.error("[ZANA ErrorBoundary Dev]", error, errorInfo?.componentStack);
    return;
  }

  try {
    const { getFirestoreDb } = await import("../services/firebase.ts");
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
    const db = getFirestoreDb();
    if (!db) return;

    const isChunk = isChunkLoadError(error);

    await addDoc(collection(db, "errors"), {
      type: isChunk ? "VERSION_MISMATCH" : "CLIENT_ERROR",
      message: error.message || "Unknown client error",
      name: error.name || "Error",
      path: route || (typeof window !== "undefined" ? window.location.pathname : "/"),
      route: route || (typeof window !== "undefined" ? window.location.pathname : "/"),
      timestamp: serverTimestamp(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      componentStack: errorInfo?.componentStack?.slice(0, 1000) || null,
      severity: isChunk ? "INFO" : "ERROR",
    });
  } catch (err) {
    console.warn("Failed to log error to Firestore telemetry:", err);
  }
}

/**
 * Global and Route-level Error Boundary for ZANA platform.
 * Conforms to WCAG 2.1 AA and friendly student UX.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isChunkLoadError(error) && typeof window !== "undefined") {
      const key = "zana_chunk_retry_timestamp";
      const lastRetry = parseInt(sessionStorage.getItem(key) || "0", 10);
      if (Date.now() - lastRetry > 10000) {
        sessionStorage.setItem(key, String(Date.now()));
        console.warn("[ZANA ErrorBoundary] Stale dynamic import chunk detected after deployment. Auto-reloading page...", error.message);
        window.location.reload();
        return;
      }
    }
    void logAppError(error, errorInfo, this.props.route);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      const fallback = this.props.fallbackPath || "/home";
      window.history.pushState(null, "", fallback);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  public override render() {
    if (this.state.hasError) {
      const isVersionMismatch = isChunkLoadError(this.state.error);

      return (
        <main
          className="min-h-[50vh] flex items-center justify-center p-4 sm:p-6"
          dir="rtl"
          role="alert"
          aria-live="assertive"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-xl space-y-5 animate-in fade-in duration-200">
            {/* Kurdish Error / Version Update Header */}
            <div className={`w-16 h-16 rounded-3xl ${isVersionMismatch ? "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 text-indigo-500" : "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-500"} flex items-center justify-center mx-auto shadow-xs`}>
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="font-sans font-black text-xl text-slate-900 dark:text-white">
                {isVersionMismatch ? "وەشانێکی نوێی زانا بڵاوکرایەوە! 🚀" : "کێشەیەک ڕوویدا 😕"}
              </h1>
              <p className="font-sans text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isVersionMismatch
                  ? "پەڕگەکانی سیستەم نوێکراونەتەوە. تکایە لاپەڕەکە نوێ (Refresh) بکەرەوە بۆ ئەوەی دواین گۆڕانکارییەکانت بەردەست بێت."
                  : "تکایە لاپەڕەکە دووبارە بار بکەرەوە، یاخود دەتوانیت بگەڕێیتەوە بۆ پەڕەی سەرەکی."}
              </p>
            </div>

            {/* Action Buttons with 48px touch targets */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:flex-1 min-h-[48px] px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-97 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer focus-visible:ring-3 focus-visible:ring-indigo-400 touch-manipulation"
                aria-label={isVersionMismatch ? "نوێکردنەوەی وەشان" : "دووبارە هەوڵبدەرەوە و بارکردنەوەی بەشەکە"}
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isVersionMismatch ? "نوێکردنەوەی وەشان" : "دووبارە هەوڵبدە"}</span>
              </button>

              {!isVersionMismatch && (
                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="w-full sm:flex-1 min-h-[48px] px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-97 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:ring-3 focus-visible:ring-slate-400 touch-manipulation"
                  aria-label="گەڕانەوە بۆ پەڕەی سەرەکی"
                >
                  <Home className="w-4 h-4" />
                  <span>بگەڕێوە ماڵەوە</span>
                </button>
              )}
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
