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

    await addDoc(collection(db, "errors"), {
      type: "CLIENT_ERROR",
      message: error.message || "Unknown client error",
      name: error.name || "Error",
      path: route || (typeof window !== "undefined" ? window.location.pathname : "/"),
      route: route || (typeof window !== "undefined" ? window.location.pathname : "/"),
      timestamp: serverTimestamp(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      componentStack: errorInfo?.componentStack?.slice(0, 1000) || null,
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
      return (
        <main
          className="min-h-[50vh] flex items-center justify-center p-4 sm:p-6"
          dir="rtl"
          role="alert"
          aria-live="assertive"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-xl space-y-5 animate-in fade-in duration-200">
            {/* Friendly Kurdish Error Header */}
            <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mx-auto text-rose-500 shadow-xs">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="font-sans font-black text-xl text-slate-900 dark:text-white">
                کێشەیەک ڕوویدا 😕
              </h1>
              <p className="font-sans text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                تکایە لاپەڕەکە دووبارە بار بکەرەوە، یاخود دەتوانیت بگەڕێیتەوە بۆ پەڕەی سەرەکی.
              </p>
            </div>

            {/* Action Buttons with 48px touch targets */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:flex-1 min-h-[48px] px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-97 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer focus-visible:ring-3 focus-visible:ring-indigo-400 touch-manipulation"
                aria-label="دووبارە هەوڵبدەرەوە و بارکردنەوەی بەشەکە"
              >
                <RotateCcw className="w-4 h-4" />
                <span>دووبارە هەوڵبدە</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:flex-1 min-h-[48px] px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-97 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:ring-3 focus-visible:ring-slate-400 touch-manipulation"
                aria-label="گەڕانەوە بۆ پەڕەی سەرەکی"
              >
                <Home className="w-4 h-4" />
                <span>بگەڕێوە ماڵەوە</span>
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
