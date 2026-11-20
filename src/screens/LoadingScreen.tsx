import { GraduationCap, Loader2, RefreshCw, AlertCircle } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  isTimedOut?: boolean;
  onRetry?: () => void;
  isExiting?: boolean;
}

export function LoadingScreen({
  message = "چاوەڕێبکە...",
  isTimedOut = false,
  onRetry,
  isExiting = false,
}: LoadingScreenProps) {
  return (
    <div
      dir="rtl"
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden transition-all duration-300 ease-out ${
        isExiting ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Background Glow */}
      <div className="absolute top-1/3 -right-24 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -left-24 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full border border-slate-800 shadow-2xl flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-200 z-10">
        <div className="relative">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <GraduationCap className="w-9 h-9" />
          </div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white font-sans tracking-tight">
            زانا
          </h1>
          <p className="text-xs text-indigo-400 font-bold">
            هاوڕێی زیرەکی فێربوونی تۆ
          </p>
        </div>

        {isTimedOut ? (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2 text-right">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>کاتی چاوەڕوانی بەسەرچوو، تکایە پەیوەندی ئینتەرنێت بپشکنە.</span>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>دووبارە تاقی بکەرەوە</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-slate-300 pt-1">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            <span className="text-sm font-medium">{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoadingScreen;
