import React from "react";
import { Clock, ShieldAlert, Sparkles, Lock } from "lucide-react";
import { useTrialCountdown } from "../../hooks/useTrialCountdown.ts";

export interface TrialCountdownPillProps {
  trialEndsAt?: number | null;
  serverTime?: number | null;
  status?: "trial" | "active" | "expired" | string;
  onClick?: () => void;
  className?: string;
}

export const TrialCountdownPill: React.FC<TrialCountdownPillProps> = ({
  trialEndsAt,
  serverTime,
  status = "trial",
  onClick,
  className = "",
}) => {
  const {
    formattedCountdown,
    isExpired,
    isUrgent,
    baghdadExpirationFormatted,
  } = useTrialCountdown(trialEndsAt, serverTime);

  // If user has a permanent or active subscription
  if (status === "active" && !isExpired) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`بەشداریکردنی کارا — کۆتایی: ${baghdadExpirationFormatted}`}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-sans text-xs font-bold transition shadow-2xs cursor-pointer ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>بەشداریکردنی کارا</span>
      </button>
    );
  }

  // If trial or subscription is expired
  if (isExpired || status === "expired") {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`ماوەی تاقیکردنەوە کۆتایی هاتووە (${baghdadExpirationFormatted}) — کلیک بکە بۆ نوێکردنەوە`}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-sans text-xs font-bold transition shadow-2xs animate-pulse cursor-pointer ${className}`}
      >
        <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>بەسەرچووە 🔒</span>
      </button>
    );
  }

  // Ongoing 3-day trial
  return (
    <button
      type="button"
      onClick={onClick}
      title={`تاقیکردنەوەی خۆڕایی زانا — کۆتایی دێت لە: ${baghdadExpirationFormatted}`}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition shadow-2xs cursor-pointer ${
        isUrgent
          ? "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 animate-pulse"
          : "bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300"
      } ${className}`}
    >
      {isUrgent ? (
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
      )}
      <span className="font-mono text-xs font-bold" dir="rtl">
        {formattedCountdown}
      </span>
    </button>
  );
};
