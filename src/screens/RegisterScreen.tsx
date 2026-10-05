import { useState, FormEvent } from "react";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  BookOpen,
  Award,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  StudentGrade,
  AcademicStream,
  SubjectKey,
} from "../features/student/studentTypes.ts";
import { registerWithEmail, getErrorMessage } from "../services/authService.ts";

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess?: (profileData: {
    name: string;
    grade: StudentGrade;
    stream: AcademicStream;
    subject: SubjectKey;
  }) => void;
}

export function RegisterScreen({
  onNavigateToLogin,
  onRegisterSuccess,
}: RegisterScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [grade, setGrade] = useState<StudentGrade>("12");
  const [stream, setStream] = useState<AcademicStream>("scientific");
  const [subject, setSubject] = useState<SubjectKey>("math");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGradeChange = (newGrade: StudentGrade) => {
    setGrade(newGrade);
    if (newGrade === "9") {
      setStream("general");
    } else if (stream === "general") {
      setStream("scientific");
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Name validation
    if (name.trim().length < 3) {
      setError("تکایە ناوێکی تەواو بنووسە (لانیکەم ٣ پیت بێت).");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("تکایە ئیمەیلێکی دروست بنووسە (وەک: student@gmail.com).");
      return;
    }

    // Password validation (>= 8 chars and at least 1 number)
    if (password.length < 8) {
      setError("وشەی نهێنی دەبێت لانیکەم ٨ پیت و هێما بێت.");
      return;
    }

    if (!/\d/.test(password)) {
      setError("وشەی نهێنی دەبێت لانیکەم یەک ژمارەی تێدابێت.");
      return;
    }

    // Passwords match
    if (password !== confirmPassword) {
      setError("دووپاتکردنەوەی وشەی نهێنی لەگەڵ وشەی نهێنی یەک ناگرێتەوە.");
      return;
    }

    // Terms accepted
    if (!acceptTerms) {
      setError("پێویستە مەرجەکانی بەکارهێنانی زانا پەسەند بکەیت بۆ بەردەوامبوون.");
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(email, password, name.trim());
      onRegisterSuccess?.({
        name: name.trim(),
        grade,
        stream,
        subject,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-4 transition-colors font-sans selection:bg-blue-600 selection:text-white my-6 sm:my-10"
    >
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-1.5">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-1">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
            خۆتۆمارکردن لە زانا
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            بەخێربێیت! با هەژماری نوێی فێربوونت دروست بکەین
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-xs sm:text-sm animate-in fade-in duration-150"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-3.5">
          {/* Full Name */}
          <div className="space-y-1 text-right">
            <label
              htmlFor="reg-name"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
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
                onChange={(e) => setName(e.target.value)}
                placeholder="ئاراس ئەحمەد"
                disabled={loading}
                required
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition disabled:opacity-60"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1 text-right">
            <label
              htmlFor="reg-email"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              ئیمەیل
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                autoComplete="email"
                disabled={loading}
                required
                dir="ltr"
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm text-left focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 text-right">
              <label
                htmlFor="reg-password"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                  dir="ltr"
                  className="w-full pr-9 pl-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs sm:text-sm text-left focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label={showPassword ? "شاردنەوەی وشەی نهێنی" : "نیشاندانی وشەی نهێنی"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label
                htmlFor="reg-confirm-password"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                دووپاتکردنەوە
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  id="reg-confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                  dir="ltr"
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs sm:text-sm text-left focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Academic Selection: Grade, Stream, Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Grade */}
            <div className="space-y-1 text-right">
              <label
                htmlFor="reg-grade"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                پۆلی خوێندن
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <select
                  id="reg-grade"
                  value={grade}
                  onChange={(e) => handleGradeChange(e.target.value as StudentGrade)}
                  disabled={loading}
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition cursor-pointer disabled:opacity-60"
                >
                  <option value="9">پۆلی ٩ (بنەڕەتی)</option>
                  <option value="10">پۆلی ١٠ (ئامادەیی)</option>
                  <option value="11">پۆلی ١١ (ئامادەیی)</option>
                  <option value="12">پۆلی ١٢ (ئامادەیی)</option>
                </select>
              </div>
            </div>

            {/* Stream */}
            <div className="space-y-1 text-right">
              <label
                htmlFor="reg-stream"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                بەش
              </label>
              <select
                id="reg-stream"
                value={stream}
                onChange={(e) => setStream(e.target.value as AcademicStream)}
                disabled={loading || grade === "9"}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition cursor-pointer disabled:opacity-60"
              >
                {grade === "9" ? (
                  <option value="general">گشتی (پۆلی ٩)</option>
                ) : (
                  <>
                    <option value="scientific">زانستی</option>
                    <option value="literary">وێژەیی</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Main Subject */}
          <div className="space-y-1 text-right">
            <label
              htmlFor="reg-subject"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              بابەتی سەرەکی دەستپێک
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <select
                id="reg-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectKey)}
                disabled={loading}
                className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition cursor-pointer disabled:opacity-60"
              >
                <option value="math">بیرکاری</option>
                <option value="physics">فیزیا</option>
                <option value="chemistry">کیمیا</option>
                <option value="english">ئینگلیزی</option>
              </select>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500"
              />
              <span className="leading-relaxed">
                مەرجەکانی بەکارهێنان و سیاسەتی پاراستنی زانیارییەکان لە زانا پەسەند دەکەم.
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>خۆتۆمارکردن...</span>
              </>
            ) : (
              <span>خۆتۆمارکردن و دەستپێکردن</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            پێشتر هەژمارت هەبووە؟{" "}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer transition mr-1"
            >
              بچۆ ژوورەوە
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
