import React, { useEffect, useState } from "react";
import { Clock, Lock, X, CreditCard } from "lucide-react";
import { getSubscriptionStatus, type SubscriptionStatusResponse } from "../../services/subscriptionService.ts";
import { useTrialCountdown } from "../../hooks/useTrialCountdown.ts";
import { useAppStore } from "../../store/appStore.ts";

export interface TrialBannerProps {
  onOpenSubscription?: () => void;
}

export function TrialBanner({ onOpenSubscription }: TrialBannerProps) {
  const user = useAppStore((s) => s.user);
  const [subStatus, setSubStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const uid = user?.id || (user as unknown as { uid?: string })?.uid;
    if (!uid || uid === "default-guest") return;
    void getSubscriptionStatus(uid)
      .then(setSubStatus)
      .catch(() => {});
  }, [user]);

  const {
    formattedCountdown,
    isExpired,
    isUrgent,
    baghdadExpirationFormatted,
  } = useTrialCountdown(subStatus?.trial_ends_at, subStatus?.server_time);

  if (!subStatus || dismissed || subStatus.status === "unavailable") return null;
  if (subStatus.status === "active" && !isExpired) return null;

  // Show banner only when genuinely expired or within urgent window (e.g. 1 day left)
  const shouldShow = isExpired || subStatus.status === "expired" || isUrgent || subStatus.days_remaining <= 1;
  if (!shouldShow) return null;

  const expiredEffective = isExpired || subStatus.status === "expired";

  return (
    <div
      role="alert"
      className={`relative flex items-center justify-between gap-3 px-4 py-2.5 text-xs sm:text-sm font-sans transition-all ${
        expiredEffective
          ? "bg-rose-950/90 border-b border-rose-800 text-rose-200"
          : "bg-amber-950/90 border-b border-amber-800 text-amber-200"
      }`}
      dir="rtl"
    >
      <div className="flex items-center gap-2 min-w-0">
        {expiredEffective ? (
          <Lock className="w-4 h-4 text-rose-400 shrink-0" />
        ) : (
          <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        )}
        <span className="truncate">
          {expiredEffective
            ? `ماوەی تاقیکردنەوەی خۆڕایی (٣ ڕۆژ) کۆتایی پێهات (${baghdadExpirationFormatted}). تاقیگەکان قوفڵ کراون.`
            : `ئاگاداری: تەنها ${formattedCountdown} لە تاقیکردنەوەی خۆڕایی ماوەتەوە (${baghdadExpirationFormatted}).`}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onOpenSubscription && (
          <button
            type="button"
            onClick={onOpenSubscription}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>نوێکردنەوە</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-current opacity-60 hover:opacity-100 p-1 rounded-md transition cursor-pointer"
          aria-label="داخستن"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
