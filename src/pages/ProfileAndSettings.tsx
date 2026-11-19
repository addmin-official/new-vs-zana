import React, { useState } from "react";
import {
  Bell,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Save,
  Sun,
  Moon,
  Brain,
  AlertCircle,
  Sparkles,
  LogOut,
  LogIn,
  Lock,
  CreditCard,
  HardDrive,
  Trash2,
  RotateCcw,
  Sliders,
  Download,
  FileText,
  ShieldCheck,
  RefreshCw,
  Database,
} from "lucide-react";
import {
  calculateLocalCacheMetrics,
  clearLocalCache,
  getPersonalizationSettings,
  savePersonalizationSettings,
  resetPersonalizationSettings,
  exportStudentData,
  type CacheMetrics,
  type PersonalizationSettings,
  type TutorStyle,
  type LearningPace,
  type DifficultyLevel,
} from "../services/dataUsageService.ts";
import { useAppStore } from "../store/appStore.ts";
import { useSoundEffects } from "../hooks/useSoundEffects.ts";
import { Modal } from "../components/Modal.tsx";
import { SubscriptionModal } from "../components/SubscriptionModal.tsx";
import { getSubscriptionStatus, type StudentSubscriptionStatus } from "../services/subscriptionService.ts";
import { logoutUser, getCurrentUser, resetPassword } from "../services/authService.ts";
import { deleteStudentProfile } from "../features/student/studentStorage.ts";
import { StudentProfile } from "../features/student/studentTypes.ts";
import { useStudentProfile } from "../features/student/useStudentProfile.ts";
import { useStudentMastery } from "../learning/hooks/useStudentMastery.ts";
import { notificationService } from "../services/notificationService.ts";
import { NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from "../domain/notification.ts";
import { useTranslation } from "../hooks/useTranslation.ts";
import { DownloadManager } from "../components/DownloadManager.tsx";
import { StudentGamificationCard } from "../components/StudentGamificationCard.tsx";
import { UiUxSpecificationModal } from "../components/UiUxSpecificationModal.tsx";

export interface ProfileAndSettingsProps {
  profile?: StudentProfile;
  isPermanentUser?: boolean;
  onUpdateProfile?: (updates: Partial<StudentProfile>) => void;
  onNavigateToLogin?: () => void;
  onLogout?: () => void;
  onReRunOnboarding?: () => void;
}

export function ProfileAndSettings({
  profile: propProfile,
  isPermanentUser,
  onUpdateProfile,
  onNavigateToLogin,
  onLogout,
  onReRunOnboarding,
}: ProfileAndSettingsProps = {}) {
  const { profile: hookProfile, updateProfile: hookUpdateProfile } = useStudentProfile();
  const studentProfile = propProfile || hookProfile;
  const user = useAppStore((state) => state.user);
  const storeUpdateProfile = useAppStore((state) => state.updateProfile);
  const clearChatHistory = useAppStore((state) => state.clearChatHistory);
  const logout = useAppStore((state) => state.logout);
  const { soundEnabled, toggleSound, playSuccess } = useSoundEffects();
  const { t, locale, changeLanguage, useEasternNumerals, setUseEasternNumerals } = useTranslation();
  const { profile: masteryProfile } = useStudentMastery(studentProfile?.id || "default-guest");
  const userProgress = useAppStore((state) => state.userProgress);
  const authUser = getCurrentUser();

  const realEmail =
    authUser?.email ||
    user.email ||
    (authUser?.isAnonymous
      ? "هەژماری میوان (بێ ئیمەیڵ)"
      : studentProfile?.id
      ? `${studentProfile.id}@student.krd`
      : "تۆمارنەکراو");

  const realTotalXp = studentProfile?.totalScore ?? userProgress.totalScore ?? user.totalScore ?? 0;
  const realCompletedLessons =
    studentProfile?.completedLessons ?? userProgress.lessonsCompleted ?? user.completedLessons ?? 0;
  const realStudyMinutes = studentProfile?.todayStudyMinutes ?? (realCompletedLessons * 20);
  const realHours = (realStudyMinutes / 60).toFixed(1);

  const getMemberDate = () => {
    try {
      const rawDate = studentProfile?.createdAt || (authUser as unknown as { metadata?: { creationTime?: string } })?.metadata?.creationTime;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          return `${d.toLocaleDateString("ckb-IQ", { month: "long", year: "numeric" })}`;
        }
      }
    } catch {
      // fallback
    }
    return "ئەمساڵ";
  };
  const memberDate = getMemberDate();

  const playTone = (freq: number, durationMs: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.1;
      osc.start();
      setTimeout(() => {
        osc.stop();
        void ctx.close();
      }, durationMs);
    } catch {
      // AudioContext fallback
    }
  };

  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "account" | "privacy">("profile");

  // Form states
  const [name, setName] = useState(studentProfile?.name || user.name);
  const [grade, _setGrade] = useState(studentProfile?.grade || user.grade);
  const [stream, _setStream] = useState(studentProfile?.stream || user.stream);
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, boolean>>({
    chemistry: true,
    physics: true,
    math: true,
    biology: false,
    english: false,
  });

  // Preferences states
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(() =>
    DEFAULT_NOTIFICATION_PREFERENCES(studentProfile?.id || user.id)
  );
  const [isSavingNotifs, setIsSavingNotifs] = useState(false);

  React.useEffect(() => {
    const studentId = studentProfile?.id || user.id;
    if (studentId) {
      notificationService.getPreferences(studentId).then((p) => {
        setNotifPrefs(p);
      }).catch(() => {});
    }
  }, [studentProfile?.id, user.id]);

  const handleSaveNotifPrefs = async () => {
    setIsSavingNotifs(true);
    try {
      const studentId = studentProfile?.id || user.id;
      const saved = await notificationService.savePreferences(notifPrefs, studentId);
      setNotifPrefs(saved);
      setSaveToast("ڕێکخستنەکانی ئاگادارکردنەوە بە سەرکەوتوویی پاشەکەوت کران ✅");
      setTimeout(() => setSaveToast(null), 3500);
    } catch {
      setSaveToast("هەڵەیەک لە پاشەکەوتکردندا ڕوویدا");
      setTimeout(() => setSaveToast(null), 3500);
    } finally {
      setIsSavingNotifs(false);
    }
  };

  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  // Privacy toggles
  const [allowTeacher, setAllowTeacher] = useState(true);
  const [allowParent, setAllowParent] = useState(true);
  const [allowAnalytics, setAllowAnalytics] = useState(true);

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subStatus, setSubStatus] = useState<StudentSubscriptionStatus | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showUiSpecModal, setShowUiSpecModal] = useState(false);

  // Data Usage & Privacy state
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics>(() => calculateLocalCacheMetrics());
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [personalization, setPersonalization] = useState<PersonalizationSettings>(() =>
    getPersonalizationSettings(studentProfile?.id || user.id)
  );
  const [isSavingPersonalization, setIsSavingPersonalization] = useState(false);
  const [showResetPersonalizationModal, setShowResetPersonalizationModal] = useState(false);

  React.useEffect(() => {
    const studentId = studentProfile?.id || user.id;
    if (studentId) {
      getSubscriptionStatus(studentId).then(setSubStatus).catch(() => {});
    }
  }, [studentProfile?.id, user.id, showSubModal]);

  React.useEffect(() => {
    const studentId = studentProfile?.id || user.id;
    setPersonalization(getPersonalizationSettings(studentId));
    setCacheMetrics(calculateLocalCacheMetrics());
  }, [studentProfile?.id, user.id, activeTab]);

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      const result = await clearLocalCache({
        clearAiResponses: true,
        clearCurriculumCache: true,
        clearChatHistory: false,
      });
      setCacheMetrics(calculateLocalCacheMetrics());
      setShowClearCacheModal(false);
      playSuccess();
      setSaveToast(`کاشی لۆکاڵ بە سەرکەوتوویی سڕایەوە (${result.clearedKb} KB ئازاد کرا) ✅`);
      setTimeout(() => setSaveToast(null), 3500);
    } catch {
      setSaveToast("هەڵەیەک ڕوویدا لە کاتی سڕینەوەی کاش");
      setTimeout(() => setSaveToast(null), 3500);
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleSavePersonalization = () => {
    setIsSavingPersonalization(true);
    try {
      const studentId = studentProfile?.id || user.id;
      savePersonalizationSettings(personalization, studentId);
      playSuccess();
      setSaveToast("ڕێکخستنەکانی کەسیاندن بە سەرکەوتوویی پاشەکەوت کران ✅");
      setTimeout(() => {
        setIsSavingPersonalization(false);
        setSaveToast(null);
      }, 3000);
    } catch {
      setSaveToast("هەڵەیەک ڕوویدا لە پاشەکەوتکردنی کەسیاندندا");
      setIsSavingPersonalization(false);
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  const handleResetPersonalization = () => {
    const studentId = studentProfile?.id || user.id;
    const reset = resetPersonalizationSettings(studentId);
    setPersonalization(reset);
    setShowResetPersonalizationModal(false);
    playSuccess();
    setSaveToast("یادگەی کەسیاندن و پێشنیارەکان بە سەرکەوتوویی ڕێکخرانەوە 🔄");
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleExportData = () => {
    const studentId = studentProfile?.id || user.id;
    exportStudentData(studentId, studentProfile || user);
    playSuccess();
    setSaveToast("کۆپی داتاکانت ئامادەکرا و داگیرا 📥");
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleSaveProfile = () => {
    const updatedName = name.trim() || studentProfile?.name || user.name;
    const updates = {
      name: updatedName,
    };
    if (onUpdateProfile) {
      onUpdateProfile(updates);
    } else {
      hookUpdateProfile(updates);
    }
    storeUpdateProfile(updates);
    playSuccess();
    setSaveToast("زانیارییەکانی پرۆفایل بە سەرکەوتوویی پاشەکەوت کران.");
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleUserLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    deleteStudentProfile();
    logout();
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  const handleDeleteData = async () => {
    clearChatHistory();
    deleteStudentProfile();
    try {
      await logoutUser();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    logout();
    setShowDeleteModal(false);
    playSuccess();
    setSaveToast("تەواوی داتا و مێژووی خوێندنی تۆ بە سەرکەوتوویی سڕایەوە.");
    setTimeout(() => {
      if (onLogout) {
        onLogout();
      } else {
        window.location.reload();
      }
    }, 1200);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            پڕۆفایل و ڕێکخستنەکان (Profile & Settings) 👤
          </span>
          <h1 className="font-sans font-black text-2xl text-slate-900 mt-1">
            هەژماری قوتابی و ڕێکخستنی سیستەم
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-500">
            بەڕێوەبردنی زانیارییە کەسییەکان، دەنگ، دۆخی ئاگادارکردنەوە و تایبەتمەندییەکان
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented 4 Tabs */}
          <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            {[
              { id: "profile", label: "پرۆفایل" },
              { id: "preferences", label: "هەڵبژاردەکان" },
              { id: "account", label: "هەژمار" },
              { id: "privacy", label: "داتا و تایبەتمەندی" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* UI/UX Engineering Specification Button */}
          <button
            type="button"
            onClick={() => setShowUiSpecModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold font-sans transition-colors cursor-pointer"
            title="پیشاندانی نەخشەی تەواوی ستانداردەکان و UI/UX"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>نەخشەی UI/UX</span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-sans rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* TAB 1: PROFILE */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          {/* Avatar & Header */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 text-3xl font-black shrink-0 relative overflow-hidden group cursor-pointer">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name.charAt(0)}</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <Upload className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="font-sans font-bold text-lg text-slate-900">{name}</h2>
              <p className="text-xs text-slate-500 font-sans">
                پۆلی {grade} • لقی {stream === "scientific" ? "زانستی" : "وێژەیی"}
              </p>
              <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                قوتابی فەرمی هەرێمی کوردستان
              </span>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-sans">ناوی چوارینەی قوتابی:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 font-sans">پۆلی خوێندن:</label>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  جێگیرکراوە
                </span>
              </div>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 text-sm font-sans font-bold flex items-center justify-between">
                <span>{grade === "12" ? "پۆلی ١٢ی ئامادەیی" : `پۆلی ${grade}`}</span>
                <span className="text-xs text-slate-400 font-normal">ناتوانرێت بگۆڕدرێت</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 font-sans">لقی خوێندن:</label>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  جێگیرکراوە
                </span>
              </div>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 text-sm font-sans font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{stream === "scientific" ? "بەشی زانستی 🔬" : "بەشی وێژەیی 📚"}</span>
                  {stream === "literary" && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                      لە ماوەی داهاتوو کارا دەبێت بۆ قوتابیان ⏳
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-normal">ناتوانرێت بگۆڕدرێت</span>
              </div>
            </div>
          </div>

          {/* Locked Notice */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-right flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-800 font-sans leading-relaxed">
              <strong>ئاگاداری:</strong> پۆلی خوێندن و لقی خوێندن (زانستی / وێژەیی) تەنها یەکجار لە کاتی دەستپێکدا دیاری دەکرێن و بە فەرمی جێگیر دەکرێن بۆ ئەوەی پرۆگرام و تۆماری نمرەکانت بە دروستی بمێننەوە.
            </p>
          </div>

          {/* Subjects Interested Multi-select */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-800 font-sans">بابەتە سەرەکییەکان بۆ خوێندن:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "chemistry", label: "کیمیا" },
                { id: "physics", label: "فیزیا" },
                { id: "math", label: "بیرکاری" },
                { id: "biology", label: "زیندەوەرزانی" },
                { id: "english", label: "ئینگلیزی" },
              ].map((subj) => (
                <label
                  key={subj.id}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs font-sans"
                >
                  <input
                    type="checkbox"
                    checked={!!selectedSubjects[subj.id]}
                    onChange={(e) =>
                      setSelectedSubjects((prev) => ({ ...prev, [subj.id]: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{subj.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Connected Guardians */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="font-sans font-bold text-xs text-slate-800">بەستراوە بە سەرپەرشتیاران:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span>👨‍👩‍👦 سەرپەرشتیار (باوان)</span>
                <span className={`font-bold ${studentProfile?.authoritative ? "text-emerald-700" : "text-slate-600"}`}>
                  {studentProfile?.authoritative ? "بەستراوە ✅" : "خوێندنی سەربەخۆ"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span>👨‍🏫 مامۆستای پۆل</span>
                <span className={`font-bold ${studentProfile?.authoritative ? "text-indigo-700" : "text-slate-600"}`}>
                  {studentProfile?.authoritative ? "پۆلی فەرمی" : "فێرخوازی سەربەخۆ"}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription & FastPay Status Card */}
          <div className="pt-3 border-t border-slate-100">
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-4 text-right space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-sm text-slate-900">
                      دۆخی بەشداریکردن (ZANA Subscription)
                    </h3>
                    <span className="text-[11px] text-slate-500 font-sans block">
                      پشکنینی بەشداریکردن و فاستپەی
                    </span>
                  </div>
                </div>

                {subStatus?.status === "active" ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    کارا (Active) ✓
                  </span>
                ) : subStatus?.status === "expired" ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    بەسەرچوو (Expired) ✕
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                    تاقیکردنەوە ({subStatus?.days_remaining ?? 3} ڕۆژ ماوە)
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-blue-100">
                <p className="text-xs text-slate-600 font-sans leading-relaxed">
                  {subStatus?.status === "active"
                    ? `بەشداریکردنت تا ${new Date(subStatus.trial_ends_at).toLocaleDateString("en-GB")} کارایە.`
                    : "بۆ دەستگەیشتنی تەواو و بەردەوام، دەتوانیت لە ڕێگەی فاستپەی و واتسئەپ بەشداری بکەیت."}
                </p>

                <button
                  type="button"
                  onClick={() => setShowSubModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sans shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {subStatus?.status === "active" ? "نوێکردنەوە / گۆڕینی پلان" : "بەشداریکردن بە فاستپەی"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Gamification Progress: Level, XP Bar & Streak Calendar */}
          <StudentGamificationCard
            userId={studentProfile?.id || user.id}
            initialXp={realTotalXp}
            initialStreak={studentProfile?.streakDays ?? user.streakDays ?? 0}
          />

          {/* Mastery Profile Dashboard Card */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                <h3 className="font-sans font-bold text-sm text-slate-900">ئاستی لێهاتوویی لە چەمکەکاندا</h3>
              </div>
              <span className="font-sans text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                نمرەی گشتی: {Math.round((masteryProfile?.overallMasteryScore || 0) * 100)}%
              </span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pl-1">
              {(masteryProfile?.conceptMasteries && Object.keys(masteryProfile.conceptMasteries).length > 0
                ? Object.values(masteryProfile.conceptMasteries).map((cm) => ({
                    conceptId: cm.conceptId,
                    score: cm.masteryScore,
                    label:
                      cm.masteryScore >= 0.8
                        ? "باڵادەست و تێپەڕێنراو"
                        : cm.masteryScore >= 0.5
                        ? "لێهاتوو و بەتوانا"
                        : "پێویست بە پێداچوونەوە",
                    badgeClass:
                      cm.masteryScore >= 0.8
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : cm.masteryScore >= 0.5
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-red-50 text-red-700 border-red-200",
                    barClass:
                      cm.masteryScore >= 0.8 ? "bg-emerald-500" : cm.masteryScore >= 0.5 ? "bg-indigo-600" : "bg-red-500",
                  }))
                : [
                    { conceptId: "ترش و تفتەکان (تیۆری برۆنستد)", score: 0, label: "دەستپێنەکراو", badgeClass: "bg-slate-50 text-slate-600 border-slate-200", barClass: "bg-indigo-600" },
                    { conceptId: "هاوسەنگیی کیمیایی و نەگۆڕی هاوسەنگ", score: 0, label: "دەستپێنەکراو", badgeClass: "bg-slate-50 text-slate-600 border-slate-200", barClass: "bg-indigo-600" },
                    { conceptId: "پێوەری pH و دەرهێنانی خەستی", score: 0, label: "دەستپێنەکراو", badgeClass: "bg-slate-50 text-slate-600 border-slate-200", barClass: "bg-indigo-600" },
                  ]
              ).map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-right">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-xs text-slate-800">{item.conceptId}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.badgeClass}`}>{item.label}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${item.barClass}`} style={{ width: `${Math.max(item.score * 100, 2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Misconceptions Card */}
          <div className="p-4 bg-red-50/40 rounded-xl border border-red-200/80 space-y-3 text-right">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <h3 className="font-sans font-bold text-xs">هەڵە و لێکتێنەگەیشتنە دەستنیشانکراوەکان</h3>
            </div>
            <div className="space-y-2">
              {masteryProfile?.activeMisconceptions && masteryProfile.activeMisconceptions.length > 0 ? (
                masteryProfile.activeMisconceptions.map((m, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-red-100 flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-sans font-bold text-xs text-red-950">{m.nameKu}</p>
                      <span className="text-[10px] text-slate-500 font-sans mt-0.5 block">{m.count} جار لە تاقیکردنەوەکاندا دووبارە بووەتەوە</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-800 font-sans">
                  هیچ لێکتێنەگەیشتن یان هەڵەیەکی بەردەوام دەستنیشان نەکراوە. هەنگاوەکانت زۆر باشن! 🌟
                </div>
              )}
            </div>
          </div>


          <div className="flex justify-end pt-3">
            <button
              onClick={handleSaveProfile}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs px-6 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>پاشەکەوتکردنی گۆڕانکارییەکان</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PREFERENCES */}
      {activeTab === "preferences" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h2 className="font-sans font-bold text-base text-slate-900">هەڵبژاردە و ڕێکخستنەکانی سیستەم</h2>
            <p className="font-sans text-xs text-slate-500">کۆنتڕۆڵی دەنگ، شێوازی بینین و ئاگادارکردنەوەکان</p>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span>ناوەندی هەڵبژاردەی ئاگادارییەکان</span>
              </h3>
              <label className="flex items-center gap-2 text-xs font-bold font-sans cursor-pointer">
                <span className={notifPrefs.inAppEnabled ? "text-indigo-600" : "text-slate-400"}>
                  {notifPrefs.inAppEnabled ? "ئاگاداری کارایە" : "ئاگاداری ناچالاکە"}
                </span>
                <input
                  type="checkbox"
                  checked={notifPrefs.inAppEnabled}
                  onChange={(e) =>
                    setNotifPrefs((prev) => ({ ...prev, inAppEnabled: e.target.checked }))
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Quiet Hours & Timing */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-sans font-bold text-xs text-slate-800 block">
                کاتەکانی پشوو و بیرخستنەوە 🌙
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                لە کاتەکانی پشوودا، هیچ ئاگادارییەکی بێزارکەر دەرناکەوێت و تەنها لە ناوەندی ئاگادارییەکان لە هێمنیدا پاشەکەوت دەکرێن.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">دەستپێکی پشوو:</label>
                  <input
                    type="time"
                    value={notifPrefs.quietHoursStart}
                    onChange={(e) =>
                      setNotifPrefs((prev) => ({ ...prev, quietHoursStart: e.target.value }))
                    }
                    className="w-full p-2 bg-white rounded-xl border border-slate-200 text-xs font-mono text-center font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">کۆتایی پشوو:</label>
                  <input
                    type="time"
                    value={notifPrefs.quietHoursEnd}
                    onChange={(e) =>
                      setNotifPrefs((prev) => ({ ...prev, quietHoursEnd: e.target.value }))
                    }
                    className="w-full p-2 bg-white rounded-xl border border-slate-200 text-xs font-mono text-center font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">بیرخستنەوەی ڕۆژانە:</label>
                  <input
                    type="time"
                    value={notifPrefs.dailyReminderTime}
                    onChange={(e) =>
                      setNotifPrefs((prev) => ({ ...prev, dailyReminderTime: e.target.value }))
                    }
                    className="w-full p-2 bg-white rounded-xl border border-slate-200 text-xs font-mono text-center font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Category Toggles */}
            <div className="space-y-2">
              <span className="font-sans font-bold text-xs text-slate-800 block">
                جۆرەکانی ئاگادارکردنەوە:
              </span>

              {[
                {
                  key: "planRemindersEnabled",
                  label: "پلانی خوێندنی ڕۆژانە",
                  desc: "بیرخستنەوەی کورت بۆ دەستپێکردنی وانەکانی ئەمڕۆ",
                },
                {
                  key: "nextBestActionEnabled",
                  label: "هەنگاوی پێشنیارکراوی داهاتوو",
                  desc: "ڕێنمایی زیرەکی مامۆستا زانا بۆ هەنگاوی داهاتووت",
                },
                {
                  key: "deadlinesEnabled",
                  label: "نزیکبوونەوە لە وادەی دیاریکراو",
                  desc: "ئاگادارکردنەوە پێش گەیشتن بە وادەی کۆتایی تاقیکردنەوە یان ئامانج",
                },
                {
                  key: "taskRecoveryEnabled",
                  label: "هاوسەنگکردنەوەی وانە لەدەستچووەکان",
                  desc: "پێشنیاری ئارام بۆ قەرەبووکردنەوەی ئەو وانانەی بەجێماون",
                },
                {
                  key: "achievementsEnabled",
                  label: "دەستکەوت و بەرزبوونەوەی لێهاتوویی",
                  desc: "پەیامی هاندان کاتێک لە چەمکێکدا لێهاتوویی بەدەستدەهێنیت",
                },
                {
                  key: "weakConceptEnabled",
                  label: "پێداچوونەوەی چەمکە لاوازەکان",
                  desc: "ڕێنمایی بۆ بەهێزکردنی ئەو بابەتانەی تێگەیشتنیان تەواو نەبووە",
                },
                {
                  key: "assessmentEnabled",
                  label: "ئەنجامی تاقیکردنەوە و ڕێنمایی",
                  desc: "پێشنیاری هەنگاوی دواتر دوای تەواوکردنی تاقیکردنەوەکان",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 text-xs font-sans cursor-pointer transition"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{item.label}</span>
                    <span className="text-[11px] text-slate-500">{item.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(notifPrefs[item.key as keyof NotificationPreferences])}
                    onChange={(e) =>
                      setNotifPrefs((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </label>
              ))}
            </div>

            {/* Save Notification Preferences Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveNotifPrefs}
                disabled={isSavingNotifs}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingNotifs ? "پاشەکەوت دەکرێت..." : "پاشەکەوتکردنی هەڵبژاردەی ئاگادارییەکان"}</span>
              </button>
            </div>
          </div>

          {/* Display Mode */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="font-sans font-bold text-xs text-slate-800">ڕووکاری پلاتفۆرم:</h3>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <button
                type="button"
                onClick={() => setThemeMode("light")}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold font-sans cursor-pointer ${
                  themeMode === "light"
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>ڕووکاری ڕووناک</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeMode("dark")}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold font-sans cursor-pointer ${
                  themeMode === "dark"
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-600" />
                <span>ڕووکاری تاریک</span>
              </button>
            </div>
          </div>

          {/* Sound Feedback */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="font-sans font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-indigo-600" />
              <span>دەنگە فێرکارییەکان و کارلێکە دەنگییەکان</span>
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-sans">
              <div>
                <span className="font-bold text-slate-900 block">دەنگی وەڵامی دروست و باجەکان</span>
                <span className="text-[11px] text-slate-500">پاداشتی دەنگی لە کاتی سەرکەوتنی هەنگاوەکان</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  toggleSound();
                  if (!soundEnabled) playSuccess();
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                  soundEnabled
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {soundEnabled ? "کارایە 🔊" : "بێدەنگە 🔇"}
              </button>
            </div>

            {/* 3-Button Audio Sound Tester */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2 text-right">
              <span className="font-sans font-bold text-xs text-slate-800 block">تاقیکردنەوەی دەنگەکان (پێشبینین):</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => playTone(880, 150)}
                  className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>دەنگی سەرکەوتن</span>
                </button>

                <button
                  type="button"
                  onClick={() => playTone(220, 200)}
                  className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>دەنگی ڕێنمایی هەڵە</span>
                </button>

                <button
                  type="button"
                  onClick={() => playTone(660, 100)}
                  className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>دەنگی وەڵامی زانا</span>
                </button>
              </div>
            </div>
          </div>

          {/* Language & Numeral Preferences */}
          <div className="space-y-4 pt-3 border-t border-slate-100 text-xs font-sans">
            <div>
              <span className="font-bold text-slate-800 block mb-2">{t("settings.language")}:</span>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => changeLanguage("ckb")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold font-sans cursor-pointer transition ${
                    locale === "ckb"
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>☀️ {t("settings.kurdish")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => changeLanguage("ar")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold font-sans cursor-pointer transition ${
                    locale === "ar"
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>🌍 {t("settings.arabic")}</span>
                </button>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-2">{t("settings.numerals")}:</span>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setUseEasternNumerals(false)}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold font-sans cursor-pointer transition ${
                    !useEasternNumerals
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>123 • {t("settings.standardNumerals")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUseEasternNumerals(true)}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold font-sans cursor-pointer transition ${
                    useEasternNumerals
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>١٢٣ • {t("settings.easternNumerals")}</span>
                </button>
              </div>
            </div>

            {/* Offline Subjects & Storage Section */}
            <div className="pt-4 border-t border-slate-100">
              <DownloadManager />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACCOUNT */}
      {activeTab === "account" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h2 className="font-sans font-bold text-base text-slate-900">زانیارییەکانی هەژمار و ئامار</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-right">
              <span className="text-xs text-slate-400 font-sans block">کۆی کاتژمێرەکانی خوێندن</span>
              <span className="font-sans font-black text-2xl text-indigo-700">{realHours} کاتژمێر</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-right">
              <span className="text-xs text-slate-400 font-sans block">وانە تەواوکراوەکان</span>
              <span className="font-sans font-black text-2xl text-emerald-700">{realCompletedLessons} وانە</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-right">
              <span className="text-xs text-slate-400 font-sans block">کۆی خاڵەکانی لێهاتوویی</span>
              <span className="font-sans font-black text-2xl text-amber-600">{realTotalXp.toLocaleString()} خاڵی ئەزموون</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-sans">
              <div>
                <span className="font-bold text-slate-900 block">ئیمەیڵی تۆمارکراو:</span>
                <span className="text-slate-600 font-mono font-medium">{realEmail}</span>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer shadow-2xs"
              >
                گۆڕینی وشەی نهێنی
              </button>
            </div>

            {onReRunOnboarding && (
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs font-sans">
                <div>
                  <span className="font-bold text-indigo-950 block">ڕێکخستنەوەی فێربوون (Onboarding):</span>
                  <span className="text-slate-500">دەستپێکردنەوەی پڕۆسەی دیاریکردنی ئاست و ئامانجە سەرەتایییەکان</span>
                </div>
                <button
                  type="button"
                  onClick={onReRunOnboarding}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer shadow-xs"
                >
                  دووبارەکردنەوە
                </button>
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-sans">ئەندامە لە {memberDate}ەوە</span>
              {!isPermanentUser ? (
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full sm:w-auto text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>چوونەژوورەوە بە هەژمار (Login)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUserLogout}
                  className="w-full sm:w-auto text-xs font-bold text-red-600 hover:text-red-700 px-4 py-2 rounded-xl border border-red-200 hover:bg-red-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>چوونەدەرەوە لە هەژمار</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA USAGE & PRIVACY (بەکارهێنانی داتا و تایبەتمەندی) */}
      {activeTab === "privacy" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-8">
          {/* Section Header */}
          <div className="space-y-1 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Database className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-sans font-black text-lg text-slate-900">
                  بەکارهێنانی داتا و تایبەتمەندی (Data Usage & Privacy)
                </h2>
                <p className="font-sans text-xs text-slate-500">
                  بەڕێوەبردنی کاش و کۆگای ئامێرەکە، شێوازی کەسیاندنی زانا، و کۆنتڕۆڵی پاراستنی زانیارییەکان
                </p>
              </div>
            </div>
          </div>

          {/* CARD 1: LOCAL CACHE & STORAGE MANAGEMENT */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm text-slate-900">
                    کۆگای ناوخۆیی و کاشی ئامێرەکە (Local Cache Storage)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-sans">
                    داتا کاتییەکان کە لە وێبگەڕەکەت پاشەکەوت کراون بۆ خێراترکردنی وەڵامەکان
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-mono font-bold text-indigo-700 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs">
                  {cacheMetrics.formattedSize}
                </span>
                <button
                  type="button"
                  onClick={() => setCacheMetrics(calculateLocalCacheMetrics())}
                  title="نوێکردنەوەی ئاماری کاش"
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Cache Breakdown Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-sans">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
                <span className="text-slate-600">کاشی وانە و پرۆگرام (SWR)</span>
                <span className="font-bold text-emerald-600 font-mono text-[11px]">پاشەکەوتکراو</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
                <span className="text-slate-600">وەڵامەکانی زانا و ئۆفلاین</span>
                <span className="font-bold text-indigo-600 font-mono text-[11px]">ئامادەکراو</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
                <span className="text-slate-600">ڕەشنووسی تاقیکردنەوەکان</span>
                <span className="font-bold text-amber-600 font-mono text-[11px]">لۆکاڵ</span>
              </div>
            </div>

            {/* Clear Cache Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                💡 سڕینەوەی کاش تەنها زانیارییە کاتییەکان پاک دەکاتەوە و شوێن لە ئامێرەکەت ئازاد دەکات بەبێ ئەوەی کار لە نمرە یان هەژمارەکەت بکات.
              </p>
              <button
                type="button"
                onClick={() => setShowClearCacheModal(true)}
                disabled={isClearingCache}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-white border border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>سڕینەوەی کاشی ناوخۆیی (Clear Cache)</span>
              </button>
            </div>
          </div>

          {/* CARD 2: PERSONALIZATION DATA MANAGEMENT */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm text-slate-900">
                    بەڕێوەبردنی داتای کەسیاندن و شێوازی فێربوون (Personalization Data)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-sans">
                    ڕێکخستنی شێوازی قسەکردن و ڕوونکردنەوەکانی مامۆستا زانا بەپێی ئارەزووی خۆت
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 self-start sm:self-auto">
                کەسیاندنی زیرەک ✨
              </span>
            </div>

            {/* 1. Tutor Pedagogy Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 font-sans flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-600" />
                <span>شێوازی فێرکاریی مامۆستا زانا:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: "socratic" as TutorStyle,
                    title: "شێوازی سوقراتی",
                    desc: "هاندانی بیرکردنەوە بە پرسیاری زنجیرەیی 🧠",
                  },
                  {
                    id: "comprehensive" as TutorStyle,
                    title: "ڕوونکردنەوەی تەواو",
                    desc: "شیکردنەوەی بنەڕەتی بە نموونەی ڕوون 📖",
                  },
                  {
                    id: "balanced" as TutorStyle,
                    title: "هاوسەنگ و گفتوگۆیی",
                    desc: "تێکەڵەیەک لە گفتوگۆ، شیکار و ڕێنمایی ⚖️",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPersonalization((prev) => ({ ...prev, tutorStyle: item.id }))}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      personalization.tutorStyle === item.id
                        ? "bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-xs"
                        : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/80 text-slate-700"
                    }`}
                  >
                    <span className="font-sans font-bold text-xs text-slate-900 block">{item.title}</span>
                    <span className="font-sans text-[11px] text-slate-500 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Learning Pace */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-800 font-sans flex items-center gap-1.5">
                <span>خێرایی و قووڵیی پێشکەوتن:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: "standard" as LearningPace,
                    title: "ئاسایی (Standard)",
                    desc: "هاوتا لەگەڵ پلانی هەفتانەی پڕۆگرام",
                  },
                  {
                    id: "gradual" as LearningPace,
                    title: "هەنگاو بە هەنگاو (Gradual)",
                    desc: "شیکردنەوەی وردتر و کاتی زیاتر بۆ تێگەیشتن",
                  },
                  {
                    id: "intensive" as LearningPace,
                    title: "چڕ و خێرا (Intensive)",
                    desc: "سەرنج لەسەر پرسیارە گرنگ و وزارییەکان",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPersonalization((prev) => ({ ...prev, learningPace: item.id }))}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      personalization.learningPace === item.id
                        ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                        : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/80 text-slate-700"
                    }`}
                  >
                    <span className="font-sans font-bold text-xs text-slate-900 block">{item.title}</span>
                    <span className="font-sans text-[11px] text-slate-500 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Adaptive Difficulty Calibration */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-800 font-sans flex items-center gap-1.5">
                <span>ئاستی قورسی پرسیارە پێشنیارکراوەکان:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: "adaptive" as DifficultyLevel,
                    title: "خۆگونجێنەر (Adaptive) 🎯",
                    desc: "بەپێی مێژووی نمرە و ئاستی وەڵامەکانت دەگۆڕێت",
                  },
                  {
                    id: "foundational" as DifficultyLevel,
                    title: "پتەوکردنی بنەماکان (Foundational) 🟢",
                    desc: "پرسیارە ئاسان و ڕوونکەرەوە سەرەتایییەکان",
                  },
                  {
                    id: "challenging" as DifficultyLevel,
                    title: "ئاستبەرز و وزاری (Challenging) 🟣",
                    desc: "تەرکیز لەسەر تاقیکردنەوە ئاڵۆز و بەهێزەکان",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPersonalization((prev) => ({ ...prev, difficultyLevel: item.id }))}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      personalization.difficultyLevel === item.id
                        ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                        : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/80 text-slate-700"
                    }`}
                  >
                    <span className="font-sans font-bold text-xs text-slate-900 block">{item.title}</span>
                    <span className="font-sans text-[11px] text-slate-500 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Personalization Feature Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-sans cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">پێشنیارکردنی خودکاری وانەکان بەپێی چەمکە لاوازەکان</span>
                  <span className="text-[11px] text-slate-500">زانا تەرکیز دەخاتە سەر ئەو وانانەی تێیاندا هەڵەت کردووە</span>
                </div>
                <input
                  type="checkbox"
                  checked={personalization.allowAdaptiveRecommendations}
                  onChange={(e) =>
                    setPersonalization((prev) => ({
                      ...prev,
                      allowAdaptiveRecommendations: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-sans cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">هەڵگرتنی یادگەی فێربوون و ڕوونکردنەوەکان</span>
                  <span className="text-[11px] text-slate-500">یادکردنەوەی شێوازی تێگەیشتنت لە پرسیارەکانی داهاتوودا</span>
                </div>
                <input
                  type="checkbox"
                  checked={personalization.allowAiExplanationMemory}
                  onChange={(e) =>
                    setPersonalization((prev) => ({
                      ...prev,
                      allowAiExplanationMemory: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
              </label>
            </div>

            {/* Action Buttons for Personalization */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetPersonalizationModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>ڕێکخستنەوەی یادگەی کەسیاندن</span>
              </button>

              <button
                type="button"
                onClick={handleSavePersonalization}
                disabled={isSavingPersonalization}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>پاشەکەوتکردنی ڕێکخستنی کەسیاندن</span>
              </button>
            </div>
          </div>

          {/* CARD 3: EXPORT LEARNING DATA */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <span className="font-sans font-bold text-xs text-slate-900 block">
                  داگرتنی کۆپییەک لە داتاکانم (Export Learning Data)
                </span>
                <span className="font-sans text-[11px] text-slate-500">
                  دەتوانیت پوختەی وانە تەواوکراوەکان، نمرەکان، و ڕێکخستنەکانت بە فۆرماتی JSON دابگریت
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportData}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>داگرتنی داتا (Export)</span>
            </button>
          </div>

          {/* CARD 4: PRIVACY & SHARING CONTROLS */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-sans font-bold text-sm text-slate-900">
                کۆنتڕۆڵی بەشکردنی داتا و پاراستنی تایبەتمەندی (Privacy Controls)
              </h3>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-sans cursor-pointer">
              <span>ڕێگەپێدان بە مامۆستا بۆ بینینی نمرە و هەڵسەنگاندنەکان</span>
              <input
                type="checkbox"
                checked={allowTeacher}
                onChange={(e) => setAllowTeacher(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-sans cursor-pointer">
              <span>ڕێگەپێدان بە باوان بۆ داگرتنی ڕاپۆرتی مانگانە</span>
              <input
                type="checkbox"
                checked={allowParent}
                onChange={(e) => setAllowParent(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-sans cursor-pointer">
              <span>بەشداریکردنی داتای بێناونیشان بۆ باشترکردنی مۆدێلی زانا</span>
              <input
                type="checkbox"
                checked={allowAnalytics}
                onChange={(e) => setAllowAnalytics(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>

          {/* CARD 5: DANGER ZONE */}
          <div className="pt-2 border-t border-red-100 space-y-3">
            <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>ناوچەی هەستیار و سڕینەوەی گشتی (Danger Zone)</span>
            </div>

            <div className="p-4 bg-red-50/50 rounded-xl border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs text-red-900 block font-sans">سڕینەوەی گشتی سەرجەم داتا و مێژوو</span>
                <span className="text-[11px] text-red-700 font-sans">ئەم کردارە گەڕانەوەی نییە و مێژووی چات و نمرەکان دەسڕێتەوە</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
              >
                سڕینەوەی داتا
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="گۆڕینی وشەی نهێنی 🔐"
      >
        <div className="space-y-4 text-right">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 font-sans">وشەی نهێنی ئێستا:</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 font-sans">وشەی نهێنی نوێ:</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="text-xs px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              پەشیمانبوونەوە
            </button>
            <button
              onClick={async () => {
                setShowPasswordModal(false);
                if (realEmail && realEmail.includes("@") && !realEmail.includes("example.com")) {
                  try {
                    await resetPassword(realEmail);
                    setSaveToast(`لینکی نوێکردنەوەی وشەی نهێنی بۆ (${realEmail}) نێردرا 📧`);
                  } catch {
                    setSaveToast("داواکاری نوێکردنەوەی وشەی نهێنی تۆمار کرا.");
                  }
                } else {
                  setSaveToast("وشەی نهێنی بە سەرکەوتوویی نوێکرایەوە.");
                }
                setTimeout(() => setSaveToast(null), 3500);
              }}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              نوێکردنەوەی وشەی نهێنی
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete All Data Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="دڵنیایت لە سڕینەوەی گشتی داتاکانت؟ ⚠️"
      >
        <div className="space-y-4 text-right">
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            ئەم کردارە تەواوی ناسنامەی تۆ، مێژووی پرسیارەکان لەگەڵ زانا، و نمرەی تاقیکردنەوەکان بە شێوەیەکی نەگەڕاوە دەسڕێتەوە.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="text-xs px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              پەشیمانبوونەوە
            </button>
            <button
              onClick={handleDeleteData}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              بەڵێ، بە تەواوی ڕەشیبکەرەوە
            </button>
          </div>
        </div>
      </Modal>

      {/* Clear Cache Confirmation Modal */}
      <Modal
        isOpen={showClearCacheModal}
        onClose={() => setShowClearCacheModal(false)}
        title="سڕینەوەی کاشی ناوخۆیی (Clear Cache) 🧹"
      >
        <div className="space-y-4 text-right font-sans">
          <p className="text-xs text-slate-600 leading-relaxed">
            ئەم کردارە سەرجەم فایلە کاتییەکان، چەمکە پاشەکەوتکراوەکان و وەڵامە ئۆفلاینەکانی ناو ئەم ئامێرە پاک دەکاتەوە ({cacheMetrics.formattedSize}).
          </p>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800">
            ✅ نمرەکانت، باجەکان، و هەژمارەکەت پارێزراون و ناسڕدرێنەوە.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowClearCacheModal(false)}
              className="text-xs px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              پەشیمانبوونەوە
            </button>
            <button
              type="button"
              onClick={handleClearCache}
              disabled={isClearingCache}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isClearingCache ? "خاوێنکردنەوە..." : "بەڵێ، کاش بسڕەوە"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Personalization Confirmation Modal */}
      <Modal
        isOpen={showResetPersonalizationModal}
        onClose={() => setShowResetPersonalizationModal(false)}
        title="ڕێکخستنەوەی یادگەی کەسیاندن 🔄"
      >
        <div className="space-y-4 text-right font-sans">
          <p className="text-xs text-slate-600 leading-relaxed">
            ئەم کردارە شێوازی فێرکاری زانا و مێژووی چەمکە لاوازەکان دەگەڕێنێتەوە دۆخی سەرەتایی. لەمەودوا مامۆستا زانا سەرلەنوێ ئاست و شێوازی وەڵامەکانت هەڵدەسەنگێنێتەوە.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowResetPersonalizationModal(false)}
              className="text-xs px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              پەشیمانبوونەوە
            </button>
            <button
              type="button"
              onClick={handleResetPersonalization}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-xs"
            >
              ڕێکخستنەوەی کەسیاندن
            </button>
          </div>
        </div>
      </Modal>

      {/* Subscription & FastPay Modal */}
      <SubscriptionModal
        isOpen={showSubModal}
        onClose={() => setShowSubModal(false)}
        userId={(user as unknown as { uid?: string })?.uid || user?.id || studentProfile?.id || ""}
        userName={studentProfile?.name || user?.name || (user as unknown as { displayName?: string })?.displayName || ""}
        userEmail={user?.email || ""}
      />

      {/* UI/UX Specification Modal */}
      <UiUxSpecificationModal
        isOpen={showUiSpecModal}
        onClose={() => setShowUiSpecModal(false)}
      />
    </div>
  );
}

export default ProfileAndSettings;
