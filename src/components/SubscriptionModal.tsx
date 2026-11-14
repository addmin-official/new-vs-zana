import React, { useState } from "react";
import {
  Sparkles,
  X,
  Lock,
  ShieldCheck,
  Copy,
  Check,
  MessageCircle,
  CreditCard,
  Send,
} from "lucide-react";

import { SUPPORT_CONFIG } from "../config/supportConfig.ts";

export interface SubscriptionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  userId?: string;
  userName?: string;
  userEmail?: string;
  whatsappNumber?: string;
  fastPayNumber?: string;
  telegramUsername?: string;
  monthlyPrice?: string;
  yearlyPrice?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  userId = "",
  userName = "",
  userEmail = "",
  whatsappNumber = SUPPORT_CONFIG.whatsappNumber,
  fastPayNumber = SUPPORT_CONFIG.fastPayNumber,
  telegramUsername = SUPPORT_CONFIG.telegramUsername,
  monthlyPrice = SUPPORT_CONFIG.monthlyPrice,
  yearlyPrice = SUPPORT_CONFIG.yearlyPrice,
}) => {
  const [copiedFastPay, setCopiedFastPay] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

  if (!isOpen) return null;

  const handleCopyFastPay = () => {
    const rawNumber = fastPayNumber.replace(/\s+/g, "");
    void navigator.clipboard.writeText(rawNumber);
    setCopiedFastPay(true);
    setTimeout(() => setCopiedFastPay(false), 2500);
  };

  const handleCopyUserId = () => {
    if (!userId) return;
    void navigator.clipboard.writeText(userId);
    setCopiedUserId(true);
    setTimeout(() => setCopiedUserId(false), 2500);
  };

  const openWhatsApp = (plan: "monthly" | "yearly") => {
    const planName = plan === "monthly" ? "مانگانە" : "ساڵانە";
    const studentInfo = userName ? `\nناوی قوتابی: ${userName}` : "";
    const emailInfo = userEmail ? `\nئیمەیڵ: ${userEmail}` : "";
    const idInfo = userId ? `\nناسنامەی هەژمار (User ID): ${userId}` : "";
    const message = `سڵاو، دەمەوێت بەشداری لە پلاتفۆرمی زانا بکەم بە پلانی ${planName}.${studentInfo}${emailInfo}${idInfo}`;
    
    // Clean phone number: remove +, spaces, dashes
    const cleanPhone = whatsappNumber.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openTelegram = () => {
    const cleanTelegram = telegramUsername.replace(/^@/, "");
    window.open(`https://t.me/${cleanTelegram}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl text-right relative overflow-hidden my-auto">
        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
            aria-label="داخستن"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Decorative Top Accent */}
        <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto mb-4" />

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-2.5 mb-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h3 className="font-sans font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
            بەشداری زانا (ZANA Pro)
          </h3>
          <p className="font-sans text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm">
            تاقیکردنەوەی ٣ ڕۆژەکەت بەسەرچوو. بۆ بەردەوامبوون لە گفتوگۆ و شیکارکردنی تەواوی وانەکان، دەتوانیت بەشداری بکەیت.
          </p>
        </div>

        {/* FastPay & User ID Box */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 rounded-2xl p-4 mb-5 space-y-3">
          {/* Step 1: FastPay */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  ژمارەی فاستپەی (FastPay):
                </span>
                <span className="font-mono text-sm sm:text-base font-extrabold text-slate-800 dark:text-white dir-ltr text-right inline-block">
                  {fastPayNumber}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyFastPay}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                copiedFastPay
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
              }`}
            >
              {copiedFastPay ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFastPay ? "کۆپیکرا" : "لەبەرگرتنەوە"}</span>
            </button>
          </div>

          {/* User ID Reference */}
          {userId && (
            <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  ناسنامەی هەژمارەکەت:
                </span>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/50">
                  {userId.length > 14 ? `${userId.substring(0, 12)}...` : userId}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyUserId}
                className={`text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  copiedUserId ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {copiedUserId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUserId ? "کۆپیکرا" : "کۆپی ID"}</span>
              </button>
            </div>
          )}
        </div>

        {/* 3 Steps Flow */}
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-3.5 mb-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 font-mono">١</span>
            <span>بڕی پارەکە لە ڕێگەی فاستپەی بنێرە بۆ ژمارەکەی سەرەوە.</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 font-mono">٢</span>
            <span>لە واتسئەپ وێنەی پسوولەکە و ناسنامەی هەژمارەکەت (User ID) بنێرە.</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-mono">٣</span>
            <span>بە کەمتر لە ٥ خولەک هەژمارەکەت دەکرێتە Active و کارا دەبێت.</span>
          </div>
        </div>

        {/* Action Buttons: WhatsApp Monthly & Yearly */}
        <div className="space-y-3">
          {/* Monthly Button */}
          <button
            type="button"
            onClick={() => openWhatsApp("monthly")}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 fill-white text-emerald-600 shrink-0" />
              <span>پەیوەندی بە واتسئەپ (پلانی مانگانە)</span>
            </span>
            <span className="text-xs bg-emerald-700/90 px-2.5 py-1 rounded-lg text-emerald-100 font-bold">
              {monthlyPrice}
            </span>
          </button>

          {/* Yearly Button */}
          <button
            type="button"
            onClick={() => openWhatsApp("yearly")}
            className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-between cursor-pointer border border-blue-500"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-200 shrink-0" />
              <span>پەیوەندی بە واتسئەپ (پلانی ساڵانە) 🌟</span>
            </span>
            <span className="text-xs bg-blue-700/90 px-2.5 py-1 rounded-lg text-blue-100 font-bold">
              {yearlyPrice}
            </span>
          </button>

          {/* Telegram Alternative */}
          <button
            type="button"
            onClick={openTelegram}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-sky-500" />
            <span>پەیوەندی لە ڕێگەی تێلیگرام (Telegram Support)</span>
          </button>
        </div>

        {/* Safe & Secure note */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Lock className="w-3 h-3" />
          <span>پارێزراوە بە تەواوی و گەرەنتی کراوە لە زانا</span>
        </div>
      </div>
    </div>
  );
};
