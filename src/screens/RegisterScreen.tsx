import React, { useState, FormEvent } from "react";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Award,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  School,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import {
  StudentGrade,
  AcademicStream,
  SubjectKey,
} from "../features/student/studentTypes.ts";
import {
  GRADE_LABELS,
  STREAM_LABELS,
  SUBJECT_LABELS,
} from "../features/student/studentDefaults.ts";
import {
  registerWithEmail,
  loginWithGoogle,
  getErrorMessage,
  startStudentTrial,
  getCurrentUser,
} from "../services/authService.ts";
import { User } from "firebase/auth";
import { getFirestoreDb } from "../services/firebase.ts";
import { doc, getDoc } from "firebase/firestore";
import {
  SubjectBookMockItem,
  SCIENTIFIC_SUBJECT_BOOKS,
  LITERARY_SUBJECT_BOOKS,
  GRADE_11_SCIENTIFIC_SUBJECT_BOOKS,
  GRADE_10_SCIENTIFIC_SUBJECT_BOOKS,
  GRADE_9_SUBJECT_BOOKS,
} from "./OnboardingScreen.tsx";

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess?: (profileData: {
    name: string;
    grade: StudentGrade;
    stream: AcademicStream;
    subject: SubjectKey;
    email?: string;
    userId?: string;
  }) => void;
}

export function RegisterScreen({
  onNavigateToLogin,
  onRegisterSuccess,
}: RegisterScreenProps) {
  // Wizard steps: 1 = Account Credentials, 2 = Grade, 3 = Stream, 4 = Visual Book Selection, 5 = Summary & Confirm
  const [step, setStep] = useState<number>(1);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const [grade, setGrade] = useState<StudentGrade>("12");
  const [stream, setStream] = useState<AcademicStream>("scientific");
  const [subject, setSubject] = useState<SubjectKey>("math");
  const [selectedBookId, setSelectedBookId] = useState<string>("math");
  const [activeStreamTab, setActiveStreamTab] = useState<"scientific" | "literary">("scientific");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleRegister = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();

      // Check if user is already registered
      const db = getFirestoreDb();
      if (db && user?.uid) {
        try {
          const snap = await getDoc(doc(db, "students", user.uid));
          if (snap.exists() && snap.data()?.onboardingCompleted) {
            onNavigateToLogin();
            return;
          }
        } catch (e) {
          console.warn("Could not check Firestore profile during register:", e);
        }
      }

      if (user.displayName) setName(user.displayName);
      if (user.email) setEmail(user.email);
      setIsGoogleAccount(true);
      // Advance to step 2 for Grade selection
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGradeChange = (newGrade: StudentGrade) => {
    setGrade(newGrade);
    setError("");
    if (newGrade === "9") {
      setStream("general");
      setSelectedBookId("g9_math");
      setSubject("math");
    } else if (newGrade === "10") {
      setStream("scientific");
      setSelectedBookId("g10_physics");
      setSubject("physics");
    } else if (newGrade === "11") {
      setStream("scientific");
      setSelectedBookId("g11_math");
      setSubject("math");
    } else {
      setStream("scientific");
      setSelectedBookId("math");
      setSubject("math");
    }
  };

  const handleNext = () => {
    setError("");

    if (step === 1) {
      if (name.trim().length < 3) {
        setError("تکایە ناوێکی تەواو بنووسە (لانیکەم ٣ پیت بێت).");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError("تکایە ئیمەیلێکی دروست بنووسە (وەک: student@gmail.com).");
        return;
      }
      if (password.length < 8) {
        setError("وشەی نهێنی دەبێت لانیکەم ٨ پیت و هێما بێت.");
        return;
      }
      if (!/\d/.test(password)) {
        setError("وشەی نهێنی دەبێت لانیکەم یەک ژمارەی تێدابێت.");
        return;
      }
      if (password !== confirmPassword) {
        setError("دووپاتکردنەوەی وشەی نهێنی لەگەڵ وشەی نهێنی یەک ناگرێتەوە.");
        return;
      }
    }

    if (step === 3 && stream === "literary") {
      setError("بەشی وێژەیی لە ماوەی داهاتوو کارا دەبێت بۆ قوتابیان ⏳");
      return;
    }

    if (step === 4 && !selectedBookId) {
      setError("تکایە پەڕتووکی سەرەکی دەستپێک هەڵبژێرە.");
      return;
    }

    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleRegister = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    if (!acceptTerms) {
      setError("پێویستە مەرجەکانی بەکارهێنانی زانا پەسەند بکەیت بۆ تەواوکردنی خۆتۆمارکردن.");
      return;
    }

    setLoading(true);
    try {
      let registeredUser: User | null = null;
      if (!isGoogleAccount) {
        registeredUser = await registerWithEmail(email, password, name.trim());
      } else {
        registeredUser = getCurrentUser();
      }

      if (registeredUser?.uid) {
        try {
          await startStudentTrial(registeredUser.uid, {
            name: name.trim(),
            email: email.trim() || registeredUser.email || undefined,
            grade,
            stream,
          });
        } catch (trialErr) {
          console.warn("Trial start error (soft fallback):", trialErr);
        }
      }

      onRegisterSuccess?.({
        name: name.trim(),
        grade,
        stream,
        subject,
        email: email.trim() || registeredUser?.email || undefined,
        userId: registeredUser?.uid,
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setStep(1); // Return to first step to fix credentials if error
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = Math.round((step / 5) * 100);

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-[#071927] flex flex-col items-center py-4 sm:py-8 px-3 sm:px-6 font-sans selection:bg-blue-600 selection:text-white overflow-y-auto overflow-x-hidden transition-colors duration-300"
    >
      <div className="w-full max-w-xl mx-auto space-y-4 my-auto">
        {/* Top Header & Progress Bar */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-sans text-cyan-300 text-sm">قۆناغەکانی خۆتۆمارکردنی زانا</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-cyan-300 bg-[#0a2339] px-3 py-1 rounded-full border border-cyan-800/60 shadow-inner">
            <span>قۆناغی {step} لە ٥</span>
            <span className="text-[11px] text-slate-400">({progressPercentage}%)</span>
          </div>
        </div>

        {/* Dynamic Progress Indicator Bar */}
        <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden border border-slate-700/60">
          <div
            className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full transition-all duration-300 ease-out rounded-full shadow-lg shadow-cyan-500/20"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Navigation Back Pill */}
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-[#0a2339]/80 hover:bg-[#0a2339] px-3.5 py-1.5 rounded-xl border border-cyan-800/50 transition cursor-pointer w-fit"
          >
            <ChevronRight className="w-4 h-4 ml-0.5" />
            <span>گەڕانەوە بۆ قۆناغی پێشوو</span>
          </button>
        )}

        {/* Error Alert Display */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 p-4 bg-red-950/60 border border-red-800/80 rounded-2xl text-red-200 text-xs sm:text-sm animate-in fade-in duration-150 shadow-lg"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {/* Main Card Container */}
        <div className="bg-[#0b253c] border border-cyan-900/60 rounded-3xl p-5 sm:p-8 shadow-2xl text-slate-100 relative overflow-hidden backdrop-blur-md">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-700/10 rounded-full blur-[100px] pointer-events-none" />

          {/* STEP 1: Account Credentials */}
          {step === 1 && (
            <div className="space-y-5 text-right relative z-10">
              <div className="flex flex-col items-center text-center space-y-2 pb-2 border-b border-cyan-950/80">
                <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 mb-1">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-white font-sans tracking-tight">
                  دروستکردنی هەژماری نوێ
                </h2>
                <p className="text-xs text-slate-300">
                  ناوی تەواو، ئیمەیل و وشەی نهێنی خۆت دیاری بکە بۆ دەستپێکردن
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-[11px] font-bold mt-1">
                  <span>🎁</span>
                  <span>٣ ڕۆژی تاقیکردنەوەی خۆڕایی دەستبەجێ کارا دەبێت</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="reg-name" className="block text-xs font-bold text-cyan-200">
                    ناوی تەواو
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="نموونە: هێمن کاروان"
                      required
                      className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-700 bg-slate-900/80 text-white text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="reg-email" className="block text-xs font-bold text-cyan-200">
                    ئیمەیڵ
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="student@example.com"
                      autoComplete="email"
                      required
                      dir="ltr"
                      className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-700 bg-slate-900/80 text-white text-sm text-left focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
                    />
                  </div>
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="reg-password" className="block text-xs font-bold text-cyan-200">
                      وشەی نهێنی
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError("");
                        }}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        dir="ltr"
                        className="w-full pr-9 pl-9 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white text-sm text-left focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                        aria-label="شاردنەوە یان دەرخستن"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reg-confirm" className="block text-xs font-bold text-cyan-200">
                      دووپاتکردنەوەی وشەی نهێنی
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="reg-confirm"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (error) setError("");
                        }}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        dir="ltr"
                        className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white text-sm text-left focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <button
                type="button"
                onClick={handleNext}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>بەردەوام بە بۆ پۆلی خوێندن</span>
                <ChevronLeft className="w-4 h-4 ml-1" />
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-slate-700/80 w-full" />
                <span className="bg-[#0b253c] px-3 text-xs text-slate-400 font-medium absolute">
                  یان لە ڕێگەی
                </span>
              </div>

              {/* Google Sign-up Button */}
              <button
                type="button"
                onClick={handleGoogleRegister}
                disabled={googleLoading || loading}
                className="w-full py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800/80 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
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
                <span>خۆتۆمارکردن بە Google</span>
              </button>

              <div className="text-center pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  پێشتر هەژمارت دروستکردووە؟{" "}
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="text-cyan-400 hover:underline font-bold cursor-pointer"
                  >
                    چوونەژوورەوە
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Grade Selection */}
          {step === 2 && (
            <div className="space-y-5 text-right relative z-10">
              <div className="space-y-2 border-b border-cyan-950/80 pb-3">
                <div className="w-10 h-10 bg-blue-900/50 text-cyan-400 rounded-xl flex items-center justify-center mb-1 border border-cyan-800/40">
                  <School className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-black text-2xl text-white">لە کام پۆل دەخوێنیت؟</h3>
                <p className="font-sans text-xs text-slate-300">
                  پۆلەکەت هەڵبژێرە، تا تەواوی مەنهەج و وانەکان بە تەواوی بۆ تۆ ڕێکبخرێن.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(["9", "10", "11", "12"] as StudentGrade[]).map((val) => {
                  const isSelected = grade === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleGradeChange(val)}
                      className={`min-h-[56px] w-full px-5 rounded-2xl border font-sans text-base font-extrabold text-right transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-600/30 to-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20"
                          : "bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800/80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Award className={`w-5 h-5 ${isSelected ? "text-cyan-400" : "text-slate-500"}`} />
                        <span>{GRADE_LABELS[val]}</span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center text-slate-950 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>بەردەوام بە بۆ لقی خوێندن</span>
                <ChevronLeft className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}

          {/* STEP 3: Stream Selection */}
          {step === 3 && (
            <div className="space-y-5 text-right relative z-10">
              <div className="space-y-2 border-b border-cyan-950/80 pb-3">
                <div className="w-10 h-10 bg-blue-900/50 text-cyan-400 rounded-xl flex items-center justify-center mb-1 border border-cyan-800/40">
                  <BookMarked className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-black text-2xl text-white">ڕێڕەوی خوێندنت دیاری بکە</h3>
                <p className="font-sans text-xs text-slate-300">
                  {grade === "9"
                    ? "پۆلی ٩ی بنەڕەتی بە شێوەی گشتی ڕێکخراوە و هەموو بابەتەکان لەخۆ دەگرێت."
                    : "تکایە لقی خوێندنت دیاری بکە."}
                </p>
              </div>

              {grade !== "9" && (
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/50 text-cyan-300 text-xs flex items-center gap-2">
                  <span>📌</span>
                  <span>بۆ پۆلەکانی ١٠، ١١ و ١٢ ڕێڕەوی خوێندن دەبێتە زانستی یان وێژەیی.</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {grade === "9" ? (
                  <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-bold text-sm flex items-center justify-between">
                    <span>قۆناغی بنەڕەتی (گشتی)</span>
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setStream("scientific")}
                      className={`min-h-[56px] w-full px-5 rounded-2xl border font-sans text-base font-extrabold text-right transition-all flex items-center justify-between cursor-pointer ${
                        stream === "scientific"
                          ? "bg-gradient-to-r from-blue-600/30 to-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20"
                          : "bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800/80"
                      }`}
                    >
                      <span>بەشی زانستی (چالاک و بەردەستە ✨)</span>
                      {stream === "scientific" && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setError("بەشی وێژەیی لە ماوەی داهاتوو کارا دەبێت بۆ قوتابیان ⏳");
                      }}
                      className="min-h-[56px] w-full px-5 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 text-slate-400 text-right flex items-center justify-between cursor-not-allowed opacity-80"
                    >
                      <div className="flex items-center gap-2">
                        <span>بەشی وێژەیی</span>
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800">
                          لە ماوەی داهاتوو کارا دەبێت بۆ قوتابیان ⏳
                        </span>
                      </div>
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>بەردەوام بە بۆ هەڵبژاردنی کتێب</span>
                <ChevronLeft className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}

          {/* STEP 4: Visual Textbook Showcase (شێوازی مۆدێرنی بەشی هەڵبژاردنی کتێب) */}
          {step === 4 && (
            <div className="space-y-5 text-right relative z-10">
              {/* Header and Stream Tab Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-950/80 pb-3">
                <div className="space-y-1">
                  <div className="w-10 h-10 bg-blue-900/50 text-cyan-400 rounded-xl flex items-center justify-center mb-1 border border-cyan-800/40">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-sans font-black text-xl sm:text-2xl text-white">
                    لە کام کتێب دەست پێ بکەین؟
                  </h3>
                  <p className="font-sans text-xs text-slate-300">
                    پەڕتووکی دەستپێک هەڵبژێرە بەپێی مەنهەجی فەرمی (دواتر دەتوانیت بیگۆڕیت).
                  </p>
                </div>

                {grade !== "9" && (
                  <div className="flex items-center gap-1.5 bg-[#0a2339] p-1.5 rounded-2xl border border-cyan-900/60 self-start sm:self-auto shrink-0 shadow-inner">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStreamTab("scientific");
                        if (grade === "12") {
                          setSelectedBookId("math");
                          setSubject("math");
                        } else if (grade === "11") {
                          setSelectedBookId("g11_math");
                          setSubject("math");
                        } else if (grade === "10") {
                          setSelectedBookId("g10_physics");
                          setSubject("physics");
                        }
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeStreamTab === "scientific"
                          ? "bg-cyan-400 text-slate-950 font-black shadow-md shadow-cyan-400/20"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      بەشی زانستی
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStreamTab("literary");
                        if (grade === "12") {
                          setSelectedBookId("kurdish");
                          setSubject("kurdish");
                        }
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeStreamTab === "literary"
                          ? "bg-cyan-400 text-slate-950 font-black shadow-md shadow-cyan-400/20"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      بەشی وێژەیی
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic Book List Rendering based on Grade & Stream */}
              {(() => {
                const currentBooks: SubjectBookMockItem[] =
                  grade === "9"
                    ? GRADE_9_SUBJECT_BOOKS
                    : grade === "12"
                    ? activeStreamTab === "literary"
                      ? LITERARY_SUBJECT_BOOKS
                      : SCIENTIFIC_SUBJECT_BOOKS
                    : grade === "11" && activeStreamTab === "scientific"
                    ? GRADE_11_SCIENTIFIC_SUBJECT_BOOKS
                    : grade === "10" && activeStreamTab === "scientific"
                    ? GRADE_10_SCIENTIFIC_SUBJECT_BOOKS
                    : [];

                if (currentBooks.length === 0) {
                  return (
                    <div className="bg-[#0a2339]/60 border border-cyan-900/40 rounded-2xl p-8 text-center my-4">
                      <BookOpen className="w-10 h-10 text-cyan-400 mx-auto mb-2 opacity-60" />
                      <h4 className="font-bold text-white text-base">کتێبەکانی ئەم بەشە لە ماوەی داهاتوودا کارا دەبن</h4>
                      <p className="text-xs text-slate-400 mt-1">تکایە بەشی زانستی هەڵبژێرە.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
                    {currentBooks.map((book) => {
                      const isSelected = selectedBookId === book.id;
                      return (
                        <div
                          key={book.id}
                          onClick={() => {
                            setSelectedBookId(book.id);
                            setSubject(book.subjectKey);
                            setError("");
                          }}
                          className={`relative rounded-2xl p-2.5 flex flex-col justify-between border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-b from-[#0f3454] to-[#071927] border-cyan-400 ring-2 ring-cyan-400/30 shadow-xl shadow-cyan-500/20"
                              : "bg-[#091f33] border-cyan-950/80 hover:border-cyan-700/50 hover:bg-[#0c2842]"
                          }`}
                        >
                          <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-900 mb-2 relative shadow-md">
                            <img
                              src={book.image}
                              alt={book.title}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              loading="lazy"
                            />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-cyan-400 text-slate-950 rounded-full p-1 shadow-md">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-0.5 text-right">
                            <h4 className={`text-xs font-black truncate ${isSelected ? "text-cyan-300" : "text-white"}`}>
                              {book.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 line-clamp-1">
                              {book.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              <button
                type="button"
                disabled={!selectedBookId}
                onClick={handleNext}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>بەردەوام بە بۆ قۆناغی کۆتایی</span>
                <ChevronLeft className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}

          {/* STEP 5: Summary & Confirm Registration */}
          {step === 5 && (
            <div className="space-y-5 text-right relative z-10">
              <div className="flex flex-col items-center text-center space-y-2 border-b border-cyan-950/80 pb-3">
                <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mb-1">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="font-sans font-black text-2xl text-white">ئامادەی دەستپێکردنیت؟</h3>
                <p className="font-sans text-xs text-slate-300">
                  پوختەی زانیارییەکانت بپشکنە و هەژمارەکەت تەواو بکە لەگەڵ زانا.
                </p>
              </div>

              {/* Dossier Card */}
              <div className="bg-[#091f33] p-4 rounded-2xl border border-cyan-900/60 divide-y divide-slate-800 text-xs space-y-2.5">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400 font-bold">ناوی تەواوی قوتابی</span>
                  <span className="font-extrabold text-white text-sm">{name}</span>
                </div>
                <div className="flex justify-between items-center pt-2 py-1">
                  <span className="text-slate-400 font-bold">ئیمەیڵی هەژمار</span>
                  <span className="font-mono text-cyan-300 text-xs" dir="ltr">{email}</span>
                </div>
                <div className="flex justify-between items-center pt-2 py-1">
                  <span className="text-slate-400 font-bold">پۆلی خوێندن</span>
                  <span className="font-bold text-white">{GRADE_LABELS[grade]}</span>
                </div>
                <div className="flex justify-between items-center pt-2 py-1">
                  <span className="text-slate-400 font-bold">ڕێڕەوی خوێندن</span>
                  <span className="font-bold text-white">{STREAM_LABELS[stream] || "گشتی"}</span>
                </div>
                <div className="flex justify-between items-center pt-2 py-1">
                  <span className="text-slate-400 font-bold">بابەتی سەرەکی دەستپێک</span>
                  <span className="font-black text-cyan-300">{SUBJECT_LABELS[subject] || subject}</span>
                </div>
              </div>

              {/* Terms Acceptance */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-300 pt-1">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 text-cyan-500 rounded border-slate-700 bg-slate-900 focus:ring-cyan-400 mt-0.5 cursor-pointer"
                />
                <span className="leading-relaxed">
                  ڕازیم بە تەواوی مەرجەکانی بەکارهێنان و پاراستنی زانیارییەکانی پلاتفۆرمی زانا.
                </span>
              </label>

              {/* Final Submit Button */}
              <button
                type="button"
                disabled={loading || !acceptTerms}
                onClick={() => handleRegister()}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-black text-sm shadow-xl shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>تکایە چاوەڕوان بە... دروستکردنی هەژمار</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 ml-1" />
                    <span>تەواوکردنی خۆتۆمارکردن و دەستپێکردن</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegisterScreen;
