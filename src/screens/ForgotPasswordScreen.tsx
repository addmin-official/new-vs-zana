import { useState, FormEvent } from "react";
import { GraduationCap, Mail, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { resetPassword, getErrorMessage } from "../services/authService.ts";

interface ForgotPasswordScreenProps {
 onNavigateToLogin: () => void;
}

export function ForgotPasswordScreen({ onNavigateToLogin }: ForgotPasswordScreenProps) {
 const [email, setEmail] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [success, setSuccess] = useState(false);

 const handleSubmit = async (e: FormEvent) => {
 e.preventDefault();
 setError("");

 if (!email.trim()) {
 setError("تکایە سەرەتا ناونیشانی ئیمەیلەکەت بنووسە.");
 return;
 }

 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 if (!emailRegex.test(email.trim())) {
 setError("تکایە ئیمەیلێکی دروست بنووسە (وەک: student@gmail.com).");
 return;
 }

 setLoading(true);
 try {
 await resetPassword(email);
 setSuccess(true);
 } catch (err) {
 setError(getErrorMessage(err));
 } finally {
 setLoading(false);
 }
 };

 return (
 <div
 dir="rtl"
 className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-4 transition-colors font-sans selection:bg-blue-600 selection:text-white"
 >
 <div className="bg-white/90/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6">
 {/* Header / Logo */}
 <div className="flex flex-col items-center text-center space-y-2">
 <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-1">
 <GraduationCap className="w-9 h-9" />
 </div>
 <h1 className="text-2xl font-bold text-slate-900">
 وشەی نهێنیت لەبیر چووە؟
 </h1>
 <p className="text-xs sm:text-sm text-slate-500 max-w-xs">
 ئیمەیلەکەت بنووسە، لینکی فەرمی گەڕاندنەوەی وشەی نهێنیت بۆ دەنێرین
 </p>
 </div>

 {/* Error Alert */}
 {error && (
 <div
 role="alert"
 className="flex items-center gap-2.5 p-3.5 bg-red-50/40 border border-red-200 rounded-xl text-red-600 text-xs sm:text-sm animate-in fade-in duration-150"
 >
 <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
 <p className="font-medium leading-relaxed">{error}</p>
 </div>
 )}

 {/* Success Alert */}
 {success ? (
 <div className="space-y-5 animate-in fade-in duration-200">
 <div className="flex items-start gap-3 p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
 <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
 <div className="space-y-1">
 <p className="font-bold">لینکی گەڕاندنەوە نێردرا!</p>
 <p className="text-xs text-emerald-700/90 leading-relaxed">
 تکایە سندووقی نامەکانت (Inbox یان Spam) لە ئیمەیلی{" "}
 <span className="font-mono font-bold">{email}</span> بپشکنە بۆ نوێکردنەوەی وشەی نهێنی.
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={onNavigateToLogin}
 className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
 >
 <ArrowRight className="w-4 h-4" />
 <span>گەڕانەوە بۆ چوونەژوورەوە</span>
 </button>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="space-y-1.5 text-right">
 <label htmlFor="reset-email" className="block text-xs font-bold text-slate-700">
 ناونیشانی ئیمەیل
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
 <Mail className="w-4 h-4" />
 </div>
 <input
 id="reset-email"
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="student@example.com"
 autoComplete="email"
 disabled={loading}
 required
 dir="ltr"
 className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-900 text-sm text-left focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition disabled:opacity-60"
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:cursor-not-allowed"
 >
 {loading ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 <span>تکایە چاوەڕوان بە...</span>
 </>
 ) : (
 <span>ناردنی لینکی گەڕاندنەوە</span>
 )}
 </button>

 <div className="text-center pt-2">
 <button
 type="button"
 onClick={onNavigateToLogin}
 className="text-xs text-blue-600 hover:underline font-bold transition inline-flex items-center gap-1 cursor-pointer"
 >
 <ArrowRight className="w-3.5 h-3.5" />
 <span>گەڕانەوە بۆ پەڕەی چوونەژوورەوە</span>
 </button>
 </div>
 </form>
 )}
 </div>
 </div>
 );
}
