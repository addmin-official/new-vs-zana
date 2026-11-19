import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Lock,
  Copy,
  Check,
  MessageCircle,
  CreditCard,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  FileText,
  BadgeCheck,
} from "lucide-react";

import { SUPPORT_CONFIG } from "../config/supportConfig.ts";
import { getFirebaseAuth } from "../services/firebase.ts";
import {
  submitPaymentReceipt,
  getMyReceipts,
  type MyReceiptRecord,
} from "../services/subscriptionService.ts";

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
  const auth = getFirebaseAuth();
  const currentAuthUser = auth?.currentUser;
  const effectiveUserId = (userId && userId !== "guest_student") ? userId : (currentAuthUser?.uid || "");
  const effectiveUserName = userName || currentAuthUser?.displayName || "";
  const effectiveUserEmail = userEmail || currentAuthUser?.email || "";

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [receiptCode, setReceiptCode] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [copiedFastPay, setCopiedFastPay] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [myReceipts, setMyReceipts] = useState<MyReceiptRecord[]>([]);

  // Load existing receipts when opened
  useEffect(() => {
    const targetId = effectiveUserId || userId;
    if (isOpen && targetId) {
      getMyReceipts(targetId)
        .then((data) => {
          if (data && data.receipts) setMyReceipts(data.receipts);
        })
        .catch(() => {});
    }
  }, [isOpen, effectiveUserId, userId]);

  if (!isOpen) return null;

  const handleCopyFastPay = () => {
    const rawNumber = fastPayNumber.replace(/\s+/g, "");
    void navigator.clipboard.writeText(rawNumber);
    setCopiedFastPay(true);
    setTimeout(() => setCopiedFastPay(false), 2500);
  };

  const handleCopyUserId = () => {
    const targetId = effectiveUserId || userId;
    if (!targetId) return;
    void navigator.clipboard.writeText(targetId);
    setCopiedUserId(true);
    setTimeout(() => setCopiedUserId(false), 2500);
  };

  const openWhatsApp = () => {
    const planName = selectedPlan === "monthly" ? "مانگانە" : "ساڵانە";
    const studentInfo = effectiveUserName ? `\nناوی قوتابی: ${effectiveUserName}` : "";
    const emailInfo = effectiveUserEmail ? `\nئیمەیڵ: ${effectiveUserEmail}` : "";
    const idInfo = (effectiveUserId || userId) ? `\nناسنامەی هەژمار (User ID): ${effectiveUserId || userId}` : "";
    const phoneInfo = studentPhone ? `\nژمارەی پەیوەندی: ${studentPhone}` : "";
    const codeInfo = receiptCode ? `\nکۆدی پسوولەی فاستپەی: ${receiptCode}` : "";
    const message = `سڵاو تیمی زانا، دەمەوێت بەشداری لە زانا پرۆ بکەم بە پلانی ${planName}.${studentInfo}${emailInfo}${idInfo}${phoneInfo}${codeInfo}\n\n(وێنەی پسوولەی فاستپەیش لێرە هاوپێچ دەکەم)`;

    const cleanPhone = whatsappNumber.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openTelegram = () => {
    const cleanTelegram = telegramUsername.replace(/^@/, "");
    window.open(`https://t.me/${cleanTelegram}`, "_blank", "noopener,noreferrer");
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptCode.trim()) {
      setSubmitError("تکایە ژمارەی پسوولە یان کۆدی مامەڵەی فاستپەی بنووسە.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await submitPaymentReceipt({
        userId: effectiveUserId || undefined,
        studentName: effectiveUserName || undefined,
        studentEmail: effectiveUserEmail || undefined,
        studentPhone: studentPhone.trim() || undefined,
        planId: selectedPlan,
        receiptCode: receiptCode.trim(),
      });

      setSubmitSuccess(res.message || "پسوولەکەت بە سەرکەوتوویی تۆمارکرا.");
      setReceiptCode("");

      // Refresh receipts list
      const targetId = effectiveUserId || userId;
      if (targetId) {
        const updated = await getMyReceipts(targetId);
        if (updated && updated.receipts) {
          setMyReceipts(updated.receipts);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "هەڵەیەک لە ناردنی پسوولەدا ڕوویدا";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl text-right relative overflow-hidden my-auto max-h-[92vh] flex flex-col">
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

        {/* Scrollable Container */}
        <div className="overflow-y-auto pr-0.5 pl-0.5 space-y-4">
          {/* Decorative Top Accent */}
          <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto" />

          {/* Header Icon & Title */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="font-sans font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
              بەشداری زانا (ZANA Pro)
            </h3>
            <p className="font-sans text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm">
              دەستگەیشتنی بێسنوور بە ژیری دەستکردی زانا، تاقیگەی پرسیارە وزارییەکان و شیکاری هەموو وانەکان.
            </p>
          </div>

          {/* Plan Selector Cards (Monthly vs Yearly) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Monthly Card */}
            <button
              type="button"
              onClick={() => setSelectedPlan("monthly")}
              className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative ${
                selectedPlan === "monthly"
                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  پلانی مانگانە
                </span>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedPlan === "monthly" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-400"
                }`}>
                  {selectedPlan === "monthly" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                {monthlyPrice}
              </div>
              <span className="text-[10px] text-slate-500 block">٣٠ ڕۆژ دەستگەیشتن</span>
            </button>

            {/* Yearly Card (Featured) */}
            <button
              type="button"
              onClick={() => setSelectedPlan("yearly")}
              className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden ${
                selectedPlan === "yearly"
                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="absolute top-0 left-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg">
                باشترین نرخ ⭐
              </div>
              <div className="flex items-center justify-between mb-1 mt-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  پلانی ساڵانە
                </span>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedPlan === "yearly" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-400"
                }`}>
                  {selectedPlan === "yearly" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                {yearlyPrice}
              </div>
              <span className="text-[10px] text-slate-500 block">١ ساڵی تەواوی خوێندن</span>
            </button>
          </div>

          {/* FastPay & User ID Box */}
          <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 space-y-3">
            {/* Step 1: FastPay */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    ژمارەی فاستپەی (FastPay) بۆ ناردن:
                  </span>
                  <span className="font-mono text-sm sm:text-base font-extrabold text-slate-900 dark:text-white dir-ltr text-right inline-block">
                    {fastPayNumber}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyFastPay}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  copiedFastPay
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                }`}
              >
                {copiedFastPay ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFastPay ? "کۆپیکرا" : "کۆپیکردن"}</span>
              </button>
            </div>

            {/* User ID Reference */}
            {userId && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5">
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
                  className={`text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    copiedUserId ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {copiedUserId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUserId ? "کۆپیکرا" : "کۆپی ID"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Form: Code & Receipt Submission (کۆد و پسوولەی فاستپەی) */}
          <form onSubmit={handleSubmitReceipt} className="bg-slate-50 dark:bg-slate-800/40 border border-blue-100 dark:border-blue-950/60 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                تۆمارکردنی کۆدی پسوولەی فاستپەی (ژمارەی پسوولە)
              </h4>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  کۆدی مامەڵە لە فاستپەی (Transaction ID / ژمارەی پسوولە):
                </label>
                <input
                  type="text"
                  required
                  value={receiptCode}
                  onChange={(e) => setReceiptCode(e.target.value)}
                  placeholder="نموونە: 984729103 یان کۆدی ناو وێنەی فاستپەی..."
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  ژمارەی مۆبایلەکەت (ئارەزوومەندانە - بۆ پەیوەندی واتسئەپ):
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="tel"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="0750 000 0000"
                    className="w-full h-10 pr-9 pl-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 text-right"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {submitError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{submitSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !receiptCode.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>تۆمار دەکرێت...</span>
              ) : (
                <>
                  <BadgeCheck className="w-4 h-4" />
                  <span>تۆمارکردنی پسوولە و داواکردنی ئەکتیڤکردن</span>
                </>
              )}
            </button>
          </form>

          {/* Pending or Previous Receipts Status Banner */}
          {myReceipts.length > 0 && (
            <div className="bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                دواین پسوولە تۆمارکراوەکانت:
              </span>
              <div className="space-y-1.5">
                {myReceipts.slice(0, 2).map((rcpt) => (
                  <div
                    key={rcpt.id}
                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-800 dark:text-white font-bold">
                        {rcpt.receipt_code}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({rcpt.plan_id === "yearly" ? "ساڵانە" : "مانگانە"})
                      </span>
                    </div>

                    <div>
                      {rcpt.status === "pending" && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          <span>چاوەڕوانی پەسەندکردن</span>
                        </span>
                      )}
                      {rcpt.status === "approved" && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>پەسەندکراوە (Active)</span>
                        </span>
                      )}
                      {rcpt.status === "rejected" && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                          <AlertCircle className="w-3 h-3" />
                          <span>ڕەتکرایەوە</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons: WhatsApp Direct Verification */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={openWhatsApp}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 fill-white text-emerald-600 shrink-0" />
                <span>ناردنی پسوولە لە واتسئەپ (WhatsApp)</span>
              </span>
              <span className="text-[11px] bg-emerald-700/90 px-2.5 py-1 rounded-lg text-emerald-100 font-bold">
                دەستبەجێ
              </span>
            </button>

            {/* Telegram Alternative */}
            <button
              type="button"
              onClick={openTelegram}
              className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-sky-500" />
              <span>پەیوەندی لە تێلیگرام (Telegram Support)</span>
            </button>
          </div>

          {/* Safe & Secure note */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="w-3 h-3" />
            <span>پارێزراوە بە تەواوی لە پلاتفۆرمی فەرمی زانا (ZANA)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
