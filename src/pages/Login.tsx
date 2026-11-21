import React, { useState, useId } from "react";
import {
  GraduationCap,
  Mail,
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  BookOpen,
  FlaskConical,
  Phone,
} from "lucide-react";
import {
  loginWithEmail,
  loginWithGoogle,
  getErrorMessage,
  setupRecaptcha,
  sendPhoneOtp,
  verifyPhoneOtp,
} from "../services/authService.ts";
import { checkUserExists } from "../auth/userProfileService.ts";
import { getMyRole, UserRole } from "../auth/roles.ts";

export interface LoginProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onLoginSuccess?: (isNewUser?: boolean, role?: UserRole) => void;
}

export function Login({
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onLoginSuccess,
}: LoginProps) {
  const emailInputId = useId();
  const passwordInputId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Phone auth state
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Format Iraqi phone: 07XX → +9647XX
  const formatIraqiPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('9647')) return `+${digits}`;
    if (digits.startsWith('07')) return `+964${digits.slice(1)}`;
    if (digits.startsWith('7') && digits.length === 10) return `+964${digits}`;
    return `+${digits}`;
  };

  const isPhoneValid = /^(\+9647|07|7)\d{9}$/.test(phone.replace(/\s/g, ''));

  // Email format validation (real-time)
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handlePostLogin = async (user: { uid: string; getIdToken: (forceRefresh?: boolean) => Promise<string> }) => {
    // Force refresh ID token to get latest claims from server
    try {
      await user.getIdToken(true);
    } catch {
      // Handled
    }

    const navigate = (path: string) => {
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    };

    const role = await getMyRole(user as unknown as import("firebase/auth").User);
    if (role === "admin") navigate("/admin");
    else navigate("/home");

    const check = await checkUserExists(user.uid);
    onLoginSuccess?.(!check.exists, role);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;

    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("تکایە ئیمەیڵەکەت بنووسە");
      return;
    }
    if (!isEmailValid) {
      setErrorMessage("تکایە ناونیشانی ئیمەیڵێکی دروست بنووسە");
      return;
    }
    if (!password) {
      setErrorMessage("تکایە وشەی نهێنی بنووسە");
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithEmail(trimmedEmail, password);
      await handlePostLogin(user);
    } catch (err: unknown) {
      const parsedMsg = getErrorMessage(err);
      setErrorMessage(parsedMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    if (loading || googleLoading) return;
    setErrorMessage(null);
    setGoogleLoading(true);

    try {
      const user = await loginWithGoogle();
      await handlePostLogin(user);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (phoneLoading || !isPhoneValid) return;
    setPhoneLoading(true);
    setErrorMessage(null);

    // Small delay to ensure DOM is ready before reCAPTCHA init
    await new Promise(resolve => setTimeout(resolve, 100));

    const verifier = setupRecaptcha('zana-recaptcha-container');
    if (!verifier) {
      setErrorMessage('کێشەیەک لە سیستەمی دڵنیایی ڕوویدا — پەڕەکە تازە بکەرەوە');
      setPhoneLoading(false);
      return;
    }

    const formatted = formatIraqiPhone(phone);
    const result = await sendPhoneOtp(formatted, verifier);

    if (result.success) {
      setOtpSent(true);
      // Start 60s resend cooldown
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      setErrorMessage(result.error || 'کێشەیەک ڕوویدا');
    }
    setPhoneLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (phoneLoading || otp.length < 6) return;
    setPhoneLoading(true);
    setErrorMessage(null);

    const result = await verifyPhoneOtp(otp);
    if (result.user) {
      await handlePostLogin(result.user);
    } else {
      setErrorMessage(result.error || 'کۆدی دڵنیایی هەڵەیە');
    }
    setPhoneLoading(false);
  };

  const isAnyLoading = loading || googleLoading || phoneLoading;

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden"
    >
      {/* Background Geometric Glow Gradients */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Main Glassmorphic Container (Split screen on desktop) */}
      <div className="w-full max-w-5xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px] z-10 transition-all duration-200">
        {/* LEFT 40%: ZANA Branding Panel (Desktop only or top on mobile) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-l border-slate-800 relative">
          <div className="space-y-6">
            {/* Logo & Platform Name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white font-sans tracking-tight">زانا</h1>
                <span className="text-[11px] font-bold text-indigo-400 block tracking-wide">
                  پلاتفۆرمی ژیری دەستکردی پەروەردەیی
                </span>
              </div>
            </div>

            {/* Tagline */}
            <div className="pt-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 leading-snug">
                فێربوونی زیرەک بۆ داهاتووی تۆ
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                هاوڕێی کەسیی زیرەکت بە پێوەری زانستی و مەنهەجی فەرمی هەرێمی کوردستان بۆ پۆلەکانی ٩ تا ١٢.
              </p>
            </div>

            {/* 3 Feature Highlights with Icons */}
            <div className="space-y-3.5 pt-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">ڕێبەری زیرەکی سۆکراتی</h3>
                  <p className="text-[11px] text-slate-400">ڕێنمایی هەنگاو بە هەنگاو بەبێ پێدانی وەڵامی ڕاستەوخۆ</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">مەنهەجی فەرمی وەزارەت</h3>
                  <p className="text-[11px] text-slate-400">تەواوی پەڕتووک و سەرچاوەکانی پۆلی ١٢ی زانستی و وێژەیی</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">تاقیگەی کارلێککار</h3>
                  <p className="text-[11px] text-slate-400">سیمولەیشنی کیمیا، فیزیا و تاقیکردنەوەی هەڵسەنگاندن</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 text-slate-500 text-[11px] hidden lg:block">
            © 2026 زانا • هەموو مافەکان پارێزراون
          </div>
        </div>

        {/* RIGHT 60%: Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="space-y-1 text-right">
              <h2 className="text-2xl font-black text-white">چوونەژوورەوە لە هەژمار</h2>
              <p className="text-xs text-slate-400">زانیارییەکانت بنووسە بۆ گەڕانەوە بۆ پۆل و وانەکانت</p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div
                id="login-error-msg"
                role="alert"
                aria-live="assertive"
                className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Auth method toggle */}
            <div className="flex bg-slate-800 rounded-xl p-1 mb-5">
              <button
                type="button"
                onClick={() => { setAuthMethod('email'); setErrorMessage(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  authMethod === 'email'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail size={15} />
                ئیمەیڵ
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('phone'); setErrorMessage(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  authMethod === 'phone'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone size={15} />
                مۆبایل
              </button>
            </div>

            {/* Invisible reCAPTCHA container */}
            <div id="zana-recaptcha-container" className="hidden" />

            {authMethod === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
                {/* Email Field */}
                <div className="space-y-1.5 text-right">
                  <label
                    htmlFor={emailInputId}
                    className="block text-xs font-bold text-slate-300"
                  >
                    ئیمەیڵ <span className="text-rose-400" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id={emailInputId}
                      type="email"
                      inputMode="email"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isAnyLoading}
                      placeholder="student@example.com"
                      autoComplete="email"
                      aria-required="true"
                      aria-invalid={Boolean(errorMessage)}
                      aria-describedby={errorMessage ? "login-error-msg" : undefined}
                      className="w-full bg-slate-800/80 border border-slate-700 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/30 text-white rounded-xl px-4 py-3 text-base sm:text-sm placeholder:text-slate-500 placeholder:text-left transition-all duration-200 disabled:opacity-50 pl-10 text-left font-mono touch-manipulation min-h-[48px]"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                      {isEmailValid && (
                        <Check className="w-4 h-4 text-emerald-400 animate-in zoom-in duration-150" aria-hidden="true" />
                      )}
                      <Mail className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5 text-right">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={passwordInputId}
                      className="text-xs font-bold text-slate-300"
                    >
                      وشەی نهێنی <span className="text-rose-400" aria-hidden="true">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={onNavigateToForgotPassword}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer py-1 px-2 focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg min-h-[36px] flex items-center"
                    >
                      وشەی نهێنیت لەیاد چوو؟
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id={passwordInputId}
                      type={showPassword ? "text" : "password"}
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isAnyLoading}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-required="true"
                      aria-invalid={Boolean(errorMessage)}
                      aria-describedby={errorMessage ? "login-error-msg" : undefined}
                      className="w-full bg-slate-800/80 border border-slate-700 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/30 text-white rounded-xl px-4 py-3 text-base sm:text-sm placeholder:text-slate-500 placeholder:text-left transition-all duration-200 disabled:opacity-50 pl-11 text-left font-mono touch-manipulation min-h-[48px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-400 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                      aria-label={showPassword ? "شاردنەوەی وشەی نهێنی" : "نیشاندانی وشەی نهێنی"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isAnyLoading}
                  className="w-full min-h-[48px] py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-97 text-white font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2 focus-visible:ring-3 focus-visible:ring-indigo-400 touch-manipulation"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>چاوەڕێبکە...</span>
                    </>
                  ) : (
                    <span>چوونەژوورەوە</span>
                  )}
                </button>
              </form>
            )}

            {authMethod === 'phone' && (
              <div className="space-y-4">
                {!otpSent ? (
                  <>
                    {/* Phone number input */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        ژمارەی مۆبایل
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          inputMode="numeric"
                          dir="ltr"
                          placeholder="07XXXXXXXXX"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-10 text-left text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        نموونە: 07501234567 یان +9647501234567
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={!isPhoneValid || phoneLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {phoneLoading
                        ? <><Loader2 size={16} className="animate-spin" /> ناردنی کۆد...</>
                        : 'ناردنی کۆدی دڵنیایی'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* OTP input */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        کۆدی دڵنیایی
                      </label>
                      <p className="text-xs text-emerald-400 mb-2">
                        ✓ کۆدەکە نێردرا بۆ {phone}
                      </p>
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        maxLength={6}
                        placeholder="------"
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center text-white text-2xl font-mono tracking-[0.5em] placeholder-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otp.length < 6 || phoneLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {phoneLoading
                        ? <><Loader2 size={16} className="animate-spin" /> تاقیکردنەوە...</>
                        : 'دڵنیاکردنەوە و چوونەژوورەوە'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(''); }}
                      disabled={resendCooldown > 0}
                      className="w-full text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {resendCooldown > 0
                        ? `دووبارە نێردن: ${resendCooldown} چرکە`
                        : 'ژمارەکە گۆڕ یان دووبارە بنێرە'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="relative flex items-center justify-center py-2" aria-hidden="true">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-xs text-slate-500 font-bold absolute">یان</span>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSubmit}
              disabled={isAnyLoading}
              className="w-full min-h-[48px] py-3 px-4 bg-slate-800/80 hover:bg-slate-800 active:scale-97 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-3 focus-visible:ring-indigo-400 touch-manipulation"
              aria-label="چوونەژوورەوە لەڕێگەی هەژماری گووگڵ"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>چاوەڕێبکە...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>چوونەژوورەوە بە هەژماری Google</span>
                </>
              )}
            </button>

            {/* Register Link */}
            <div className="text-center pt-3 border-t border-slate-800/80">
              <p className="text-xs text-slate-400">
                هێشتا ئەکاونتت نییە؟{" "}
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition cursor-pointer"
                >
                  تۆمار بکە
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
