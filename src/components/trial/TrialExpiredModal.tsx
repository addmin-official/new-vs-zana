import React from "react";
import {
  Lock,
  Calendar,
  CreditCard,
  MessageCircle,
  X,
  FlaskConical,
  Sparkles,
  BookOpen,
  Users,
} from "lucide-react";
import { formatBaghdadDateTime } from "../../utils/countdownUtils.ts";
import { SUPPORT_CONFIG } from "../../config/supportConfig.ts";

export interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose?: () => void;
  trialEndsAt?: number | null;
  onSubscribeClick?: () => void;
}

export const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({
  isOpen,
  onClose,
  trialEndsAt,
  onSubscribeClick,
}) => {
  if (!isOpen) return null;

  const baghdadTime = trialEndsAt
    ? formatBaghdadDateTime(trialEndsAt)
    : "کاتی ڕابردوو";

  const handleOpenWhatsApp = () => {
    const rawNumber = SUPPORT_CONFIG.whatsappNumber.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      "سڵاو، دەمەوێت بەشداریکردنم لە پلاتفۆرمی زانا نوێ بکەمەوە."
    );
    window.open(`https://wa.me/${rawNumber}?text=${msg}`, "_blank");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-expired-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-right overflow-hidden space-y-6 animate-in zoom-in-95 duration-200">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close button if optional dismiss allowed */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute left-4 top-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            aria-label="داخستن"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header with Lock Icon */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-inner">
            <Lock className="w-8 h-8 text-rose-400 animate-pulse" />
          </div>
          <h2
            id="trial-expired-title"
            className="text-xl sm:text-2xl font-black text-white font-sans leading-snug"
          >
            ماوەی ٣ ڕۆژی تاقیکردنەوەی خۆڕایی کۆتایی پێهات 🔒
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
            ماوەی تاقیکردنەوەی سەرەتایی هەژمارەکەت تەواو بووە. بۆ بەردەوامبوون لە بەکارهێنانی تاقیگە پێشکەوتووەکان و ڕاهێنەری زیرەک، تکایە بەشداریکردنەکەت نوێ بکەرەوە.
          </p>
        </div>

        {/* Expiration date in Baghdad timezone */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-200 font-sans">
          <Calendar className="w-4 h-4 text-rose-400 shrink-0" />
          <span>بەرواری کۆتاییهاتن: <strong className="font-mono text-white">{baghdadTime}</strong></span>
        </div>

        {/* Locked features breakdown */}
        <div className="space-y-2">
          <span className="block text-xs font-bold text-slate-400">
            ئەو بەشانەی ئێستا قوفڵکراون تا نوێکردنەوەی بەشداریکردن:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300">
              <FlaskConical className="w-4 h-4 text-rose-400 shrink-0" />
              <span>تاقیگە و تاقیگەی پیتاگۆج</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300">
              <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
              <span>مامۆستای زیرەکی دەستکرد</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300">
              <BookOpen className="w-4 h-4 text-rose-400 shrink-0" />
              <span>ئەزموونە نیشتمانییەکان</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300">
              <Users className="w-4 h-4 text-rose-400 shrink-0" />
              <span>ژوورەکانی خوێندن و گروپ</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              onSubscribeClick?.();
              onClose?.();
            }}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-97 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>نوێکردنەوە و بەشداریکردن (FastPay)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 active:scale-97 text-emerald-400 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>پەیوەندی بە بەشی دارایی (واتسئەپ)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
