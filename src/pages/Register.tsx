import React, { useState, useId } from "react";
import {
  GraduationCap,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  School,
  Sparkles,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  Lock,
  Phone,
} from "lucide-react";
import {
  registerWithEmail,
  loginWithGoogle,
  getErrorMessage,
  setupRecaptcha,
  sendPhoneOtp,
  verifyPhoneOtp,
} from "../services/authService.ts";
import { createUserDocumentIfMissing } from "../auth/userProfileService.ts";
import { initializeTrial } from "../auth/trialService.ts";
import { StudentGrade, AcademicStream } from "../features/student/studentTypes.ts";

export interface RegisterSuccessData {
  name: string;
  grade: string;
  stream?: string;
  subject: string;
  school?: string;
}

export interface RegisterProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess?: (data: RegisterSuccessData) => void;
}

export function Register({
  onNavigateToLogin,
  onRegisterSuccess,
}: RegisterProps) {
  const nameInputId = useId();
  const emailInputId = useId();
  const passInputId = useId();
  const confirmPassInputId = useId();
  const schoolInputId = useId();

  // Multi-step state: 1 = Account, 2 = Profile, 3 = Welcome Tour
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Account Creation fields
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [createdUid, setCreatedUid] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneStep1Loading, setPhoneStep1Loading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 2: Student Profile fields
  const [selectedGrade, setSelectedGrade] = useState<StudentGrade>("12");
  const [selectedStream, setSelectedStream] = useState<AcademicStream>("scientific");
  const [schoolName, setSchoolName] = useState("");

  // Step 3: Welcome Tour slide index (0, 1, 2)
  const [tourSlideIndex, setTourSlideIndex] = useState(0);

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPassLengthValid = password.length >= 6;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { label: "", percent: 0, color: "bg-slate-700" };
    let score = 0;
    if (password.length >= 6) score += 33;
    if (password.length >= 8 && /[0-9]/.test(password)) score += 34;
    if (/[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 33;

    if (score < 40) return { label: "سەرەتایی", percent: 33, color: "bg-rose-500" };
    if (score < 80) return { label: "مامناوەند", percent: 66, color: "bg-amber-500" };
    return { label: "بەهێز", percent: 100, color: "bg-emerald-500" };
  };

  const passStrength = getPasswordStrength();

  // Handle Step 1 Email Account Creation
  const handleAccountCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    // Block admin email from student registration
    if (trimmedEmail.toLowerCase() === 'addmin.official.idg@gmail.com') {
      setErrorMessage('ئەم ئیمەیڵە تۆمارکردنی قوتابی ڕێپێدراو نییە');
      return;
    }

    if (!trimmedName) {
      setErrorMessage("تکایە ناوی تەواوت بنووسە");
      return;
    }
    if (!trimmedEmail || !isEmailValid) {
      setErrorMessage("تکایە ناونیشانی ئیمەیڵێکی دروست بنووسە");
      return;
    }
    if (!isPassLengthValid) {
      setErrorMessage("وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("وشەی نهێنی و دووبارەکردنەوەی یەکناگرنەوە");
      return;
    }

    setLoading(true);
    try {
      const user = await registerWithEmail(trimmedEmail, password, trimmedName);
      setCreatedUid(user.uid);
      await initializeTrial(user.uid, trimmedEmail);
      setCurrentStep(2);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const formatIraqiPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('9647')) return `+${digits}`;
    if (digits.startsWith('07')) return `+964${digits.slice(1)}`;
    if (digits.startsWith('7') && digits.length === 10) return `+964${digits}`;
    return `+${digits}`;
  };

  const isPhoneValid = /^(\+9647|07|7)\d{9}$/.test(phone.replace(/\s/g, ''));

  const handlePhoneSendOtp = async () => {
    if (phoneStep1Loading || !isPhoneValid || !fullName.trim()) {
      if (!fullName.trim()) setErrorMessage('تکایە ناوت بنووسە');
      return;
    }
    setPhoneStep1Loading(true);
    setErrorMessage(null);
    const verifier = setupRecaptcha('zana-recaptcha-register');
    if (!verifier) {
      setErrorMessage('کێشەی دڵنیایی');
      setPhoneStep1Loading(false);
      return;
    }
    const result = await sendPhoneOtp(formatIraqiPhone(phone), verifier);
    if (result.success) {
      setOtpSent(true);
      setResendCooldown(60);
      const t = setInterval(() => setResendCooldown(p => {
        if (p <= 1) { clearInterval(t); return 0; }
        return p - 1;
      }), 1000);
    } else {
      setErrorMessage(result.error || 'کێشەیەک ڕوویدا');
    }
    setPhoneStep1Loading(false);
  };

  const handlePhoneVerifyAndProceed = async () => {
    if (phoneStep1Loading || otp.length < 6) return;
    setPhoneStep1Loading(true);
    setErrorMessage(null);
    const result = await verifyPhoneOtp(otp);
    if (result.user) {
      setCreatedUid(result.user.uid);
      // Initialize trial period immediately
      await initializeTrial(
        result.user.uid,
        result.user.phoneNumber || phone
      );
      setCurrentStep(2);
    } else {
      setErrorMessage(result.error || 'کۆدی دڵنیایی هەڵەیە');
    }
    setPhoneStep1Loading(false);
  };

  // Handle Step 1 Google Sign-Up
  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      setCreatedUid(user.uid);
      if (user.displayName) {
        setFullName(user.displayName);
      }
      if (user.email) {
        setEmail(user.email);
      }
      setCurrentStep(2);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Step 2 Profile Submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrade) {
      setErrorMessage("تکایە پۆلەکەت دیاریبکە");
      return;
    }
    setErrorMessage(null);
    setCurrentStep(3);
  };

  // Handle Step 3 Finalization & Dashboard Launch
  const handleFinalizeRegistration = async () => {
    setLoading(true);
    try {
      const targetUid = createdUid || "guest_" + Date.now();
      const streamVal = selectedGrade === "9" || selectedGrade === "10" ? "general" : selectedStream;

      await createUserDocumentIfMissing(targetUid, email || null, {
        name: fullName || "قوتابی",
        grade: selectedGrade,
        stream: streamVal,
        activeSubject: "chemistry",
        level: "intermediate",
        school: schoolName.trim(),
      });

      onRegisterSuccess?.({
        name: fullName || "قوتابی",
        grade: selectedGrade,
        stream: streamVal,
        subject: "chemistry",
        school: schoolName.trim(),
      });
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const tourSlides = [
    {
      title: "مامۆستای ژیری دەستکردی سوقراتی",
      desc: "زانا بە شێوازی پرسیارکردنی سوقراتی هانت دەدات بیربکەیتەوە و خۆت بگەی بە وەڵامە دروستەکان.",
      icon: Sparkles,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "مەنهەجی فەرمی و پەڕتووکەکانی پۆلی ١٢",
      desc: "تەواوی بەشەکان، پرسیارە وەزارییەکان و یاساکانی کیمیا، فیزیا، بیرکاری و زیندەوەرزانی لە دەستتدایە.",
      icon: BookOpen,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "تاقیگەی کارلێککار و خشتەی زیرەک",
      desc: "تاقیکردنەوە لە تاقیگەی پێوانەکاری کیمیا و فیزیا ئەنجام بدە و خشتەی پێداچوونەوەی ڕۆژانە ڕێکبخە.",
      icon: Brain,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 space-y-6 z-10">
        {/* Header & Step Indicator */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
            <GraduationCap className="w-4 h-4" />
            <span>خۆتۆمارکردن لە پلاتفۆرمی زانا</span>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === step
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-500/20"
                      : currentStep > step
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {currentStep > step ? <Check className="w-3.5 h-3.5" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-10 h-0.5 rounded-full transition-colors ${
                      currentStep > step ? "bg-emerald-600" : "bg-slate-800"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <span className="text-xs font-bold text-slate-400 block">
            هەنگاوی {currentStep} لە ٣:{" "}
            {currentStep === 1
              ? "دروستکردنی هەژمار"
              : currentStep === 2
              ? "دیاریکردنی پۆل و قۆناغ"
              : "بەخێربێیت بۆ زانا"}
          </span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            id="register-error-msg"
            role="alert"
            aria-live="assertive"
            className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200 text-right"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Account Creation */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Method toggle — same style as Login */}
            <div className="flex bg-slate-800 rounded-xl p-1 mb-4">
              <button
                type="button"
                onClick={() => { setAuthMethod('email'); setErrorMessage(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  authMethod === 'email' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail size={15} /> ئیمەیڵ
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('phone'); setErrorMessage(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  authMethod === 'phone' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone size={15} /> مۆبایل
              </button>
            </div>

            <div id="zana-recaptcha-register" className="hidden" />

            {authMethod === 'email' && (
              <form onSubmit={handleAccountCreate} className="space-y-4" noValidate>
            {/* Full Name */}
            <div className="space-y-1.5 text-right">
              <label htmlFor={nameInputId} className="block text-xs font-bold text-slate-300">
                ناوی تەواو <span className="text-rose-400" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id={nameInputId}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading || googleLoading}
                  placeholder="ناوی قوتابی"
                  autoComplete="name"
                  aria-required="true"
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={errorMessage ? "register-error-msg" : undefined}
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/30 text-white rounded-xl px-4 py-3 text-base sm:text-sm placeholder:text-slate-500 transition-all pl-10 min-h-[48px] touch-manipulation"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5 text-right">
              <label htmlFor={emailInputId} className="block text-xs font-bold text-slate-300">
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
                  disabled={loading || googleLoading}
                  placeholder="student@example.com"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={errorMessage ? "register-error-msg" : undefined}
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/30 text-white rounded-xl px-4 py-3 text-base sm:text-sm placeholder:text-slate-500 transition-all pl-10 text-left font-mono min-h-[48px] touch-manipulation"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                  {isEmailValid && <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />}
                  <Mail className="w-4 h-4 text-slate-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 text-right">
              <label htmlFor={passInputId} className="block text-xs font-bold text-slate-300">
                وشەی نهێنی (لانیکەم ٦ پیت) <span className="text-rose-400" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id={passInputId}
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || googleLoading}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={errorMessage ? "register-error-msg" : undefined}
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/30 text-white rounded-xl px-4 py-3 text-base sm:text-sm placeholder:text-slate-500 transition-all pl-11 text-left font-mono min-h-[48px] touch-manipulation"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-400 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation cursor-pointer"
                  aria-label={showPassword ? "شاردنەوەی وشەی نهێنی" : "نیشاندانی وشەی نهێنی"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>

              {/* Password Strength Bar */}
              {password.length > 0 && (
                <div className="space-y-1 pt-1" aria-live="polite">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passStrength.color} transition-all duration-300`}
                      style={{ width: `${passStrength.percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    ئاستی وشەی نهێنی: {passStrength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5 text-right">
              <label htmlFor={confirmPassInputId} className="block text-xs font-bold text-slate-300">
                دووبارەکردنەوەی وشەی نهێنی <span className="text-rose-400" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id={confirmPassInputId}
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || googleLoading}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={errorMessage ? "register-error-msg" : undefined}
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/30 text-white rounded-xl px-4 py-3 text-base sm:text-sm placeholder:text-slate-500 transition-all pl-10 text-left font-mono min-h-[48px] touch-manipulation"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {doPasswordsMatch && <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />}
                </div>
              </div>
            </div>

            {/* Next Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full min-h-[48px] py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-97 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer disabled:opacity-60 focus-visible:ring-3 focus-visible:ring-indigo-400 touch-manipulation"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>چاوەڕێبکە...</span>
                </>
              ) : (
                <>
                  <span>بەردەوام بە بەرەو قۆناغی دواتر</span>
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        )}

        {authMethod === 'phone' && (
          <div className="space-y-4">
            {/* Name field (always required) */}
            <div className="space-y-1.5 text-right">
              <label htmlFor={`${nameInputId}-phone`} className="block text-xs font-bold text-slate-300">
                ناوی تەواو <span className="text-rose-400" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id={`${nameInputId}-phone`}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={phoneStep1Loading}
                  placeholder="ناوی قوتابی"
                  autoComplete="name"
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/30 text-white rounded-xl px-4 py-3 text-base sm:text-sm placeholder:text-slate-500 transition-all pl-10 min-h-[48px] touch-manipulation"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              </div>
            </div>

            {!otpSent ? (
              <>
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold text-slate-300">
                    ژمارەی مۆبایل <span className="text-rose-400" aria-hidden="true">*</span>
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
                      disabled={phoneStep1Loading}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-10 text-left text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[48px]"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    نموونە: 07501234567 یان +9647501234567
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePhoneSendOtp}
                  disabled={!isPhoneValid || !fullName.trim() || phoneStep1Loading}
                  className="w-full min-h-[48px] py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer touch-manipulation"
                >
                  {phoneStep1Loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>ناردنی کۆد...</span>
                    </>
                  ) : (
                    <span>ناردنی کۆدی دڵنیایی</span>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold text-slate-300">
                    کۆدی دڵنیایی <span className="text-rose-400" aria-hidden="true">*</span>
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
                    disabled={phoneStep1Loading}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center text-white text-2xl font-mono tracking-[0.5em] placeholder-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[48px]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePhoneVerifyAndProceed}
                  disabled={otp.length < 6 || phoneStep1Loading}
                  className="w-full min-h-[48px] py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer touch-manipulation"
                >
                  {phoneStep1Loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>تاقیکردنەوە...</span>
                    </>
                  ) : (
                    <>
                      <span>دڵنیاکردنەوە و بەردەوام بە</span>
                      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(''); }}
                  disabled={resendCooldown > 0}
                  className="w-full text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50 py-2 cursor-pointer"
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

            {/* Google Sign-Up Single Step */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading || googleLoading}
              className="w-full min-h-[48px] py-3 px-4 bg-slate-800/80 hover:bg-slate-800 active:scale-97 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 focus-visible:ring-3 focus-visible:ring-indigo-400 touch-manipulation"
              aria-label="خۆتۆمارکردن لەڕێگەی هەژماری گووگڵ"
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
                  <span>تۆمارکردن لە ڕێگەی هەژماری Google</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-xs text-slate-400 hover:text-indigo-300 transition cursor-pointer"
              >
                پێشتر هەژمارت دروستکردووە؟ <span className="font-bold text-indigo-400">بچۆ ژوورەوە</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Student Profile (Grade, Stream, School) */}
        {currentStep === 2 && (
          <form onSubmit={handleProfileSubmit} className="space-y-5 text-right">
            {/* Grade Selector (Visual Cards) */}
            <div className="space-y-2">
              <label id="grade-group-label" className="block text-xs font-bold text-slate-300">
                پۆلەکەت دیاریبکە:
              </label>
              <div
                role="radiogroup"
                aria-labelledby="grade-group-label"
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
              >
                {[
                  { grade: "9" as StudentGrade, label: "پۆلی ٩", desc: "بنەڕەتی" },
                  { grade: "10" as StudentGrade, label: "پۆلی ١٠", desc: "ئامادەیی گشتی" },
                  { grade: "11" as StudentGrade, label: "پۆلی ١١", desc: "ئامادەیی" },
                  { grade: "12" as StudentGrade, label: "پۆلی ١٢", desc: "وەزاری (کۆتایی)" },
                ].map((item) => (
                  <button
                    key={item.grade}
                    type="button"
                    role="radio"
                    aria-checked={selectedGrade === item.grade}
                    onClick={() => setSelectedGrade(item.grade)}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer min-h-[56px] touch-manipulation focus-visible:ring-3 focus-visible:ring-indigo-400 ${
                      selectedGrade === item.grade
                        ? "bg-indigo-600/25 border-indigo-500 text-white ring-2 ring-indigo-500/30"
                        : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-sm font-black block">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stream Selector (Grade 11 & 12 only) */}
            {(selectedGrade === "11" || selectedGrade === "12") && (
              <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                <label id="stream-group-label" className="block text-xs font-bold text-slate-300">
                  شاخە و بەشەکەت:
                </label>
                <div
                  role="radiogroup"
                  aria-labelledby="stream-group-label"
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    { id: "scientific" as AcademicStream, label: "زانستی", icon: "⚗️", isLocked: false },
                    { id: "literary" as AcademicStream, label: "وێژەیی", icon: "📚", isLocked: true },
                    { id: "general" as AcademicStream, label: "گشتی", icon: "🌐", isLocked: true },
                  ].map((stream) => (
                    <button
                      key={stream.id}
                      type="button"
                      role="radio"
                      disabled={stream.isLocked}
                      aria-disabled={stream.isLocked}
                      aria-checked={selectedStream === stream.id}
                      onClick={() => {
                        if (!stream.isLocked) {
                          setSelectedStream(stream.id);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all min-h-[56px] touch-manipulation focus-visible:ring-3 focus-visible:ring-indigo-400 ${
                        stream.isLocked
                          ? "bg-slate-900/40 border-dashed border-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                          : selectedStream === stream.id
                          ? "bg-indigo-600/25 border-indigo-500 text-white ring-2 ring-indigo-500/30 cursor-pointer"
                          : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
                      }`}
                    >
                      <span className="text-xl block" aria-hidden="true">{stream.icon}</span>
                      <span className="text-xs font-bold flex items-center justify-center gap-1 mt-1">
                        <span>{stream.label}</span>
                        {stream.isLocked && <Lock className="w-3 h-3 text-amber-500/80" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* School Name (Optional) */}
            <div className="space-y-1.5 pt-2">
              <label htmlFor={schoolInputId} className="block text-xs font-bold text-slate-300">
                ناوی قوتابخانە (ئارەزوومەندانە)
              </label>
              <div className="relative">
                <input
                  id={schoolInputId}
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="وەک: ئامادەیی کوردستان"
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/30 text-white rounded-xl px-4 py-3 text-base sm:text-sm placeholder:text-slate-500 transition-all pl-10 min-h-[48px] touch-manipulation"
                />
                <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              </div>
            </div>

            {/* Back & Next Navigation Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="min-h-[48px] py-3 px-5 rounded-xl border border-slate-700 hover:bg-slate-800 active:scale-97 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer focus-visible:ring-3 focus-visible:ring-slate-400 touch-manipulation"
                aria-label="گەڕانەوە بۆ هەنگاوی یەکەم"
              >
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                <span>گەڕانەوە</span>
              </button>

              <button
                type="submit"
                className="flex-1 min-h-[48px] py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-97 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer focus-visible:ring-3 focus-visible:ring-indigo-400 touch-manipulation"
              >
                <span>بەردەوام بە</span>
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Welcome Screen & Feature Tour */}
        {currentStep === 3 && (
          <div className="space-y-6 text-center animate-in fade-in duration-200">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">
                بەخێربێیت بۆ زانا، {fullName || "قوتابی ئازیز"}! 🎉
              </h2>
              <p className="text-xs text-slate-400">
                هەژمارەکەت بە سەرکەوتوویی دروستکرا. گەشتەکەت بەرەو نمرەی بەرز لێرەوە دەستپێدەکات.
              </p>
            </div>

            {/* Swipeable / Tabbed 3-Slide Tour */}
            <div className="p-6 rounded-3xl bg-slate-850 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setTourSlideIndex((prev) => (prev > 0 ? prev - 1 : 2))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  aria-label="پێشوو"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1.5">
                  {tourSlides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTourSlideIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        tourSlideIndex === idx ? "w-6 bg-indigo-500" : "w-2 bg-slate-700"
                      }`}
                      aria-label={`سلاید ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setTourSlideIndex((prev) => (prev < 2 ? prev + 1 : 0))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  aria-label="دواتر"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Active Slide Display */}
              <div className="space-y-3 py-2 min-h-[140px] flex flex-col items-center justify-center">
                {(() => {
                  const slide = tourSlides[tourSlideIndex];
                  const SlideIcon = slide.icon;
                  return (
                    <>
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${slide.color}`}>
                        <SlideIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-100">{slide.title}</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">{slide.desc}</p>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Back button & Finalize Launch Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>گەڕانەوە</span>
              </button>

              <button
                type="button"
                onClick={handleFinalizeRegistration}
                disabled={loading}
                className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>تۆمار دەکرێت...</span>
                  </>
                ) : (
                  <>
                    <span>دەستپێبکە 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;
