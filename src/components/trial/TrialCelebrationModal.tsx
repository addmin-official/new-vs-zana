import React, { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, Calendar, X, Rocket } from "lucide-react";
import { formatBaghdadDateTime } from "../../utils/countdownUtils.ts";

export interface TrialCelebrationModalProps {
  userId?: string;
  trialEndsAt?: number | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const TrialCelebrationModal: React.FC<TrialCelebrationModalProps> = ({
  userId,
  trialEndsAt,
  isOpen = false,
  onClose,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const storageKey = `zana_trial_celebrated_${userId}`;
    const alreadyCelebrated = localStorage.getItem(storageKey);

    if (isOpen && !alreadyCelebrated) {
      setVisible(true);
    }
  }, [userId, isOpen]);

  const handleDismiss = () => {
    if (userId) {
      localStorage.setItem(`zana_trial_celebrated_${userId}`, "true");
    }
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  const baghdadTime = trialEndsAt ? formatBaghdadDateTime(trialEndsAt) : "٣ ڕۆژی تر";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-celebration-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-right overflow-hidden space-y-6 animate-in zoom-in-95 duration-200">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute left-4 top-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          aria-label="داخستن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-inner">
            <Sparkles className="w-8 h-8 animate-bounce text-indigo-400" />
          </div>
          <h2
            id="trial-celebration-title"
            className="text-xl sm:text-2xl font-black text-white font-sans leading-snug"
          >
            پیرۆزە! ٣ ڕۆژ تاقیکردنەوەی خۆڕایی بۆت کارا کرا 🎁
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
            بەخێربێیت بۆ پلاتفۆرمی زانا. تەواوی تایبەتمەندییە نایابەکان بۆ ماوەی ٧٢ کاتژمێر بەبێ هیچ سنوورێک لەبەردەستتدان.
          </p>
        </div>

        {/* Unlocked Features Highlights */}
        <div className="p-4 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>هەموو تاقیگە زانستییەکان و تاقیگەی پیتاگۆج بە تەواوی کراوەن.</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>مامۆستای ژیری دەستکرد بۆ وەڵامدانەوەی شیکاری پرسیارەکانت.</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>تەواوی کتێبە مەنهەجییەکان و ئەزموونە نیشتمانییەکان.</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>پلانی ڕۆژانە و پێوانەی ئاستی فێربوون بە شێوازی زانستی.</span>
          </div>
        </div>

        {/* Expiration Note */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-[11px] sm:text-xs text-indigo-300 font-sans">
          <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>کۆتایی ماوەی خۆڕایی: <strong className="font-mono text-white">{baghdadTime}</strong></span>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-97 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
        >
          <Rocket className="w-4 h-4" />
          <span>دەستپێکردنی گەشتی فێربوون</span>
        </button>
      </div>
    </div>
  );
};
