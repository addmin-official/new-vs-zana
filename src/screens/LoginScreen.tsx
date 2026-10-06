import { useState, FormEvent } from "react";
import {
 GraduationCap,
 Mail,
 Lock,
 Eye,
 EyeOff,
 Loader2,
 AlertCircle,
 User as UserIcon,
} from "lucide-react";
import {
 loginWithEmail,
 loginWithGoogle,
 loginAnonymously,
 getErrorMessage,
} from "../services/authService.ts";

interface LoginScreenProps {
 onNavigateToRegister: () => void;
 onNavigateToForgotPassword: () => void;
 onLoginSuccess?: () => void;
}

export function LoginScreen({
 onNavigateToRegister,
 onNavigateToForgotPassword,
 onLoginSuccess,
}: LoginScreenProps) {
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [rememberMe, setRememberMe] = useState(true);
 const [loading, setLoading] = useState(false);
 const [googleLoading, setGoogleLoading] = useState(false);
 const [guestLoading, setGuestLoading] = useState(false);
 const [error, setError] = useState("");

 const handleEmailLogin = async (e: FormEvent) => {
 e.preventDefault();
 setError("");

 if (!email.trim() || !password) {
 setError("تکایە هەردوو ئیمەیل و وشەی نهێنی بنووسە.");
 return;
 }

 setLoading(true);
 try {
 await loginWithEmail(email, password);
 onLoginSuccess?.();
 } catch (err) {
 setError(getErrorMessage(err));
 } finally {
 setLoading(false);
 }
 };

 const handleGoogleLogin = async () => {
 setError("");
 setGoogleLoading(true);
 try {
 await loginWithGoogle();
 onLoginSuccess?.();
 } catch (err) {
 setError(getErrorMessage(err));
 } finally {
 setGoogleLoading(false);
 }
 };

 const handleGuestLogin = async () => {
 setError("");
 setGuestLoading(true);
 try {
 await loginAnonymously();
 onLoginSuccess?.();
 } catch (err) {
 setError(getErrorMessage(err));
 } finally {
 setGuestLoading(false);
 }
 };

 const anyLoading = loading || googleLoading || guestLoading;

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
 <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans tracking-tight">
 بەخێربێیت بۆ زانا
 </h1>
 <p className="text-xs sm:text-sm text-blue-600 font-medium">
 هاوڕێی زیرەکی فێربوونی تۆ
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

 {/* Email & Password Form */}
 <form onSubmit={handleEmailLogin} className="space-y-4">
 {/* Email input */}
 <div className="space-y-1.5 text-right">
 <label
 htmlFor="login-email"
 className="block text-xs font-bold text-slate-700"
 >
 ئیمەیل
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
 <Mail className="w-4 h-4" />
 </div>
 <input
 id="login-email"
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="example@gmail.com"
 autoComplete="email"
 disabled={anyLoading}
 required
 dir="ltr"
 className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-900 text-sm text-left focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition disabled:opacity-60"
 />
 </div>
 </div>

 {/* Password input */}
 <div className="space-y-1.5 text-right">
 <label
 htmlFor="login-password"
 className="block text-xs font-bold text-slate-700"
 >
 وشەی نهێنی
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
 <Lock className="w-4 h-4" />
 </div>
 <input
 id="login-password"
 type={showPassword ? "text" : "password"}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="••••••••"
 autoComplete="current-password"
 disabled={anyLoading}
 required
 dir="ltr"
 className="w-full pr-10 pl-11 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-900 text-sm text-left focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition disabled:opacity-60"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition"
 aria-label={showPassword ? "شاردنەوەی وشەی نهێنی" : "نیشاندانی وشەی نهێنی"}
 >
 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>

 {/* Remember me & Forgot Password */}
 <div className="flex items-center justify-between text-xs pt-0.5">
 <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
 <input
 type="checkbox"
 checked={rememberMe}
 onChange={(e) => setRememberMe(e.target.checked)}
 className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
 />
 <span>لەبیرمەکە</span>
 </label>

 <button
 type="button"
 onClick={onNavigateToForgotPassword}
 className="text-blue-600 hover:underline font-medium cursor-pointer transition"
 >
 وشەی نهێنیت لەبیر چووە؟
 </button>
 </div>

 {/* Submit button */}
 <button
 type="submit"
 disabled={anyLoading}
 className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:cursor-not-allowed"
 >
 {loading ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 <span>تکایە چاوەڕوان بە...</span>
 </>
 ) : (
 <span>چوونەژوورەوە</span>
 )}
 </button>
 </form>

 {/* Divider */}
 <div className="relative flex items-center justify-center">
 <div className="border-t border-slate-200 w-full" />
 <span className="bg-white px-3 text-xs text-slate-400 font-medium absolute">
 یان
 </span>
 </div>

 {/* Alternative Login Options */}
 <div className="space-y-2.5">
 {/* Google Sign In */}
 <button
 type="button"
 onClick={handleGoogleLogin}
 disabled={anyLoading}
 className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
 >
 {googleLoading ? (
 <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
 ) : (
 <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
 <path
 fill="#4285F4"
 d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
 />
 <path
 fill="#34A853"
 d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
 />
 <path
 fill="#FBBC05"
 d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
 />
 <path
 fill="#EA4335"
 d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
 />
 </svg>
 )}
 <span>بەردەوامبوون بە Google</span>
 </button>

 {/* Guest / Anonymous Sign In */}
 <button
 type="button"
 onClick={handleGuestLogin}
 disabled={anyLoading}
 className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
 >
 {guestLoading ? (
 <Loader2 className="w-3.5 h-3.5 animate-spin" />
 ) : (
 <UserIcon className="w-3.5 h-3.5 text-slate-500" />
 )}
 <span>چوونەژوورەوە وەک میوان (بێ هەژمار)</span>
 </button>
 </div>

 {/* Footer */}
 <div className="text-center pt-2 border-t border-slate-100">
 <p className="text-xs text-slate-500">
 هەژمارت نییە؟{" "}
 <button
 type="button"
 onClick={onNavigateToRegister}
 className="text-blue-600 hover:underline font-bold cursor-pointer transition mr-1"
 >
 خۆتۆمارکردن
 </button>
 </p>
 </div>
 </div>
 </div>
 );
}
