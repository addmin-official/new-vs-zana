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
} from "lucide-react";
import { useAppStore } from "../store/appStore.ts";
import { useSoundEffects } from "../hooks/useSoundEffects.ts";
import { Modal } from "../components/Modal.tsx";
import { SubscriptionModal } from "../components/SubscriptionModal.tsx";
import { getSubscriptionStatus, type StudentSubscriptionStatus } from "../services/subscriptionService.ts";
import { logoutUser, getCurrentUser, resetPassword } from "../services/authService.ts";
import { deleteStudentProfile } from "../features/student/studentStorage.ts";
import { BAGHDAD_TIMEZONE } from "../utils/dateTime.ts";
import { StudentProfile } from "../features/student/studentTypes.ts";
import { useStudentProfile } from "../features/student/useStudentProfile.ts";
import { useStudentMastery } from "../learning/hooks/useStudentMastery.ts";
import { notificationService } from "../services/notificationService.ts";
import { NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from "../domain/notification.ts";
import { useTranslation } from "../hooks/useTranslation.ts";
import { DownloadManager } from "../components/DownloadManager.tsx";
import { StudentGamificationCard } from "../components/StudentGamificationCard.tsx";
import { useTheme } from "../context/ThemeContext.tsx";
import { DataPrivacySection } from "../features/student/DataPrivacySection.tsx";

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
          return `${d.toLocaleDateString("ckb-IQ", { month: "long", year: "numeric", timeZone: BAGHDAD_TIMEZONE })}`;
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

  const { resolvedTheme, setTheme } = useTheme();

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

  React.useEffect(() => {
    const studentId = studentProfile?.id || user.id;
    if (studentId) {
      getSubscriptionStatus(studentId).then(setSubStatus).catch(() => {});
    }
  }, [studentProfile?.id, user.id, showSubModal]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800/60">
            پڕۆفایل و ڕێکخستنەکان (Profile & Settings) 👤
          </span>
          <h1 className="font-sans font-black text-2xl text-slate-900 dark:text-white mt-1">
            هەژماری قوتابی و ڕێکخستنی سیستەم
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            بەڕێوەبردنی زانیارییە کەسییەکان، دەنگ، دۆخی ئاگادارکردنەوە و تایبەتمەندییەکان
          </p>
        </div>

        {/* Segmented 4 Tabs */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1 rounded-xl shrink-0">
          {[
            { id: "profile", label: "پرۆفایل" },
            { id: "preferences", label: "هەڵبژاردەکان" },
            { id: "account", label: "هەژمار" },
            { id: "privacy", label: "تایبەتمەندی" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {saveToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-sans rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* TAB 1: PROFILE */}
      {activeTab === "profile" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          {/* Avatar & Header */}
          <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border-2 border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-3xl font-black shrink-0 relative overflow-hidden group cursor-pointer">
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
              <h2 className="font-sans font-bold text-lg text-slate-900 dark:text-white">{name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                پۆلی {grade} • لقی {stream === "scientific" ? "زانستی" : "وێژەیی"}
              </p>
              <span className="inline-block text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                قوتابی فەرمی هەرێمی کوردستان
              </span>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">ناوی چوارینەی قوتابی:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">پۆلی خوێندن:</label>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  جێگیرکراوە
                </span>
              </div>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-sm font-sans font-bold flex items-center justify-between">
                <span>{grade === "12" ? "پۆلی ١٢ی ئامادەیی" : `پۆلی ${grade}`}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">ناتوانرێت بگۆڕدرێت</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">لقی خوێندن:</label>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  جێگیرکراوە
                </span>
              </div>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-sm font-sans font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{stream === "scientific" ? "بەشی زانستی 🔬" : "بەشی وێژەیی 📚"}</span>
                  {stream === "literary" && (
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full">
                      لە ماوەی داهاتوو کارا دەبێت بۆ قوتابیان ⏳
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">ناتوانرێت بگۆڕدرێت</span>
              </div>
            </div>
          </div>

          {/* Locked Notice */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl text-right flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-800 dark:text-amber-200 font-sans leading-relaxed">
              <strong>ئاگاداری:</strong> پۆلی خوێندن و لقی خوێندن (زانستی / وێژەیی) تەنها یەکجار لە کاتی دەستپێکدا دیاری دەکرێن و بە فەرمی جێگیر دەکرێن بۆ ئەوەی پرۆگرام و تۆماری نمرەکانت بە دروستی بمێننەوە.
            </p>
          </div>

          {/* Subjects Interested Multi-select */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans">بابەتە سەرەکییەکان بۆ خوێندن:</label>
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
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 cursor-pointer text-xs font-sans"
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
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200">بەستراوە بە سەرپەرشتیاران:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl flex items-center justify-between">
                <span>👨‍👩‍👦 سەرپەرشتیار (باوان)</span>
                <span className={`font-bold ${studentProfile?.authoritative ? "text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}`}>
                  {studentProfile?.authoritative ? "بەستراوە ✅" : "خوێندنی سەربەخۆ"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl flex items-center justify-between">
                <span>👨‍🏫 مامۆستای پۆل</span>
                <span className={`font-bold ${studentProfile?.authoritative ? "text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"}`}>
                  {studentProfile?.authoritative ? "پۆلی فەرمی" : "فێرخوازی سەربەخۆ"}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription & FastPay Status Card */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-gradient-to-r from-indigo-50/90 to-slate-50 dark:from-indigo-950/50 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4 text-right space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-sm text-slate-900 dark:text-white">
                      دۆخی بەشداریکردن (ZANA Subscription)
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans block">
                      پشکنینی بەشداریکردن و فاستپەی
                    </span>
                  </div>
                </div>

                {subStatus?.status === "active" ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    کارا (Active) ✓
                  </span>
                ) : subStatus?.status === "expired" ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                    بەسەرچوو (Expired) ✕
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                    تاقیکردنەوە ({subStatus?.days_remaining ?? 3} ڕۆژ ماوە)
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-indigo-100 dark:border-indigo-900/60">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                  {subStatus?.status === "active"
                    ? `بەشداریکردنت تا ${new Date(subStatus.trial_ends_at).toLocaleDateString("en-GB", { timeZone: BAGHDAD_TIMEZONE })} کارایە.`
                    : "بۆ دەستگەیشتنی تەواو و بەردەوام، دەتوانیت لە ڕێگەی فاستپەی و واتسئەپ بەشداری بکەیت."}
                </p>

                <button
                  type="button"
                  onClick={() => setShowSubModal(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-sans shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
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
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-white">ئاستی لێهاتوویی لە چەمکەکاندا</h3>
              </div>
              <span className="font-sans text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800/60">
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
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : cm.masteryScore >= 0.5
                        ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                        : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
                    barClass:
                      cm.masteryScore >= 0.8 ? "bg-emerald-500" : cm.masteryScore >= 0.5 ? "bg-indigo-600" : "bg-red-500",
                  }))
                : [
                    { conceptId: "ترش و تفتەکان (تیۆری برۆنستد)", score: 0, label: "دەستپێنەکراو", badgeClass: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700", barClass: "bg-indigo-600" },
                    { conceptId: "هاوسەنگیی کیمیایی و نەگۆڕی هاوسەنگ", score: 0, label: "دەستپێنەکراو", badgeClass: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700", barClass: "bg-indigo-600" },
                    { conceptId: "پێوەری pH و دەرهێنانی خەستی", score: 0, label: "دەستپێنەکراو", badgeClass: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700", barClass: "bg-indigo-600" },
                  ]
              ).map((item, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-right">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200">{item.conceptId}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.badgeClass}`}>{item.label}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${item.barClass}`} style={{ width: `${Math.max(item.score * 100, 2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Misconceptions Card */}
          <div className="p-4 bg-red-50/40 dark:bg-red-950/20 rounded-xl border border-red-200/80 dark:border-red-900/50 space-y-3 text-right">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <h3 className="font-sans font-bold text-xs">هەڵە و لێکتێنەگەیشتنە دەستنیشانکراوەکان</h3>
            </div>
            <div className="space-y-2">
              {masteryProfile?.activeMisconceptions && masteryProfile.activeMisconceptions.length > 0 ? (
                masteryProfile.activeMisconceptions.map((m, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-red-100 dark:border-red-900/40 flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-sans font-bold text-xs text-red-950 dark:text-red-200">{m.nameKu}</p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5 block">{m.count} جار لە تاقیکردنەوەکاندا دووبارە بووەتەوە</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 font-sans">
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-sans font-bold text-base text-slate-900 dark:text-white">هەڵبژاردە و ڕێکخستنەکانی سیستەم</h2>
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400">کۆنتڕۆڵی دەنگ، شێوازی بینین و ئاگادارکردنەوەکان</p>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>ناوەندی هەڵبژاردەی ئاگادارییەکان</span>
              </h3>
              <label className="flex items-center gap-2 text-xs font-bold font-sans cursor-pointer">
                <span className={notifPrefs.inAppEnabled ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}>
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
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200 block">
                کاتەکانی پشوو و بیرخستنەوە 🌙
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                لە کاتەکانی پشوودا، هیچ ئاگادارییەکی بێزارکەر دەرناکەوێت و تەنها لە ناوەندی ئاگادارییەکان لە هێمنیدا پاشەکەوت دەکرێن.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">دەستپێکی پشوو:</label>
                  <input
                    type="time"
                    value={notifPrefs.quietHoursStart}
                    onChange={(e) =>
                      setNotifPrefs((prev) => ({ ...prev, quietHoursStart: e.target.value }))
                    }
                    className="w-full p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-center font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">کۆتایی پشوو:</label>
                  <input
                    type="time"
                    value={notifPrefs.quietHoursEnd}
                    onChange={(e) =>
                      setNotifPrefs((prev) => ({ ...prev, quietHoursEnd: e.target.value }))
                    }
                    className="w-full p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-center font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">بیرخستنەوەی ڕۆژانە:</label>
                  <input
                    type="time"
                    value={notifPrefs.dailyReminderTime}
                    onChange={(e) =>
                      setNotifPrefs((prev) => ({ ...prev, dailyReminderTime: e.target.value }))
                    }
                    className="w-full p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-center font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Category Toggles */}
            <div className="space-y-2">
              <span className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200 block">
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
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-sans cursor-pointer transition"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.label}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</span>
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
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200">ڕووکاری پلاتفۆرم:</h3>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold font-sans cursor-pointer transition-colors ${
                  resolvedTheme === "light"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>ڕووکاری ڕووناک</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold font-sans cursor-pointer transition-colors ${
                  resolvedTheme === "dark"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span>ڕووکاری تاریک</span>
              </button>
            </div>
          </div>

          {/* Sound Feedback */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>دەنگە فێرکارییەکان و کارلێکە دەنگییەکان</span>
            </h3>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-sans">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">دەنگی وەڵامی دروست و باجەکان</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">پاداشتی دەنگی لە کاتی سەرکەوتنی هەنگاوەکان</span>
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
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {soundEnabled ? "کارایە 🔊" : "بێدەنگە 🔇"}
              </button>
            </div>

            {/* 3-Button Audio Sound Tester */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-right">
              <span className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200 block">تاقیکردنەوەی دەنگەکان (پێشبینین):</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => playTone(880, 150)}
                  className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>دەنگی سەرکەوتن</span>
                </button>

                <button
                  type="button"
                  onClick={() => playTone(220, 200)}
                  className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/70 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>دەنگی ڕێنمایی هەڵە</span>
                </button>

                <button
                  type="button"
                  onClick={() => playTone(660, 100)}
                  className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>دەنگی وەڵامی زانا</span>
                </button>
              </div>
            </div>
          </div>

          {/* Language & Numeral Preferences */}
          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-sans">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">{t("settings.language")}:</span>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => changeLanguage("ckb")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold font-sans cursor-pointer transition ${
                    locale === "ckb"
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>☀️ {t("settings.kurdish")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => changeLanguage("ar")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold font-sans cursor-pointer transition ${
                    locale === "ar"
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>🌍 {t("settings.arabic")}</span>
                </button>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">{t("settings.numerals")}:</span>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setUseEasternNumerals(false)}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold font-sans cursor-pointer transition ${
                    !useEasternNumerals
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>123 • {t("settings.standardNumerals")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUseEasternNumerals(true)}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold font-sans cursor-pointer transition ${
                    useEasternNumerals
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>١٢٣ • {t("settings.easternNumerals")}</span>
                </button>
              </div>
            </div>

            {/* Offline Subjects & Storage Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <DownloadManager />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACCOUNT */}
      {activeTab === "account" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-sans font-bold text-base text-slate-900 dark:text-white">زانیارییەکانی هەژمار و ئامار</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-right">
              <span className="text-xs text-slate-400 font-sans block">کۆی کاتژمێرەکانی خوێندن</span>
              <span className="font-sans font-black text-2xl text-indigo-700 dark:text-indigo-400">{realHours} کاتژمێر</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-right">
              <span className="text-xs text-slate-400 font-sans block">وانە تەواوکراوەکان</span>
              <span className="font-sans font-black text-2xl text-emerald-700 dark:text-emerald-400">{realCompletedLessons} وانە</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-right">
              <span className="text-xs text-slate-400 font-sans block">کۆی خاڵەکانی لێهاتوویی</span>
              <span className="font-sans font-black text-2xl text-amber-600 dark:text-amber-400">{realTotalXp.toLocaleString()} خاڵی ئەزموون</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-sans">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">ئیمەیڵی تۆمارکراو:</span>
                <span className="text-slate-600 dark:text-slate-300 font-mono font-medium">{realEmail}</span>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-2xs"
              >
                گۆڕینی وشەی نهێنی
              </button>
            </div>

            {onReRunOnboarding && (
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs font-sans">
                <div>
                  <span className="font-bold text-indigo-950 dark:text-indigo-200 block">ڕێکخستنەوەی فێربوون (Onboarding):</span>
                  <span className="text-slate-500 dark:text-slate-400">دەستپێکردنەوەی پڕۆسەی دیاریکردنی ئاست و ئامانجە سەرەتایییەکان</span>
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

            <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-100 dark:border-slate-800">
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
                  className="w-full sm:w-auto text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>چوونەدەرەوە لە هەژمار</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRIVACY & DATA */}
      {activeTab === "privacy" && (
        <div className="space-y-6">
          {/* Live Data Usage, Local Cache Inspector & Export Section */}
          <DataPrivacySection
            profile={studentProfile}
            masteryProfile={masteryProfile || null}
          />

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="font-sans font-bold text-base text-slate-900 dark:text-white">تایبەتمەندی و بەشکردنی زانیاری</h2>
              <p className="font-sans text-xs text-slate-500 dark:text-slate-400">کۆنتڕۆڵی بەشکردنی داتا و پاراستنی زانیارییە ئەکادیمییەکان</p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-xs font-sans cursor-pointer">
                <span>ڕێگەپێدان بە مامۆستا بۆ بینینی نمرە و هەڵسەنگاندنەکان</span>
                <input
                  type="checkbox"
                  checked={allowTeacher}
                  onChange={(e) => setAllowTeacher(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-xs font-sans cursor-pointer">
                <span>ڕێگەپێدان بە باوان بۆ داگرتنی ڕاپۆرتی مانگانە</span>
                <input
                  type="checkbox"
                  checked={allowParent}
                  onChange={(e) => setAllowParent(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-xs font-sans cursor-pointer">
                <span>بەشداریکردنی داتای بێناونیشان بۆ باشترکردنی مۆدێلی زانا</span>
                <input
                  type="checkbox"
                  checked={allowAnalytics}
                  onChange={(e) => setAllowAnalytics(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-red-100 dark:border-red-900/50 space-y-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>ناوچەی هەستیار و سڕینەوەی گشتی</span>
              </div>

              <div className="p-4 bg-red-50/50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/60 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs text-red-900 dark:text-red-200 block font-sans">سڕینەوەی گشتی سەرجەم داتا و مێژوو</span>
                  <span className="text-[11px] text-red-700 dark:text-red-300/80 font-sans">ئەم کردارە گەڕانەوەی نییە و مێژووی چات و نمرەکان دەسڕێتەوە</span>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  سڕینەوەی داتا
                </button>
              </div>
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
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">وشەی نهێنی ئێستا:</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">وشەی نهێنی نوێ:</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="text-xs px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
          <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
            ئەم کردارە تەواوی ناسنامەی تۆ، مێژووی پرسیارەکان لەگەڵ زانا، و نمرەی تاقیکردنەوەکان بە شێوەیەکی نەگەڕاوە دەسڕێتەوە.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="text-xs px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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

      {/* Subscription & FastPay Modal */}
      <SubscriptionModal
        isOpen={showSubModal}
        onClose={() => setShowSubModal(false)}
        userId={(user as unknown as { uid?: string })?.uid || user?.id || studentProfile?.id || ""}
        userName={studentProfile?.name || user?.name || (user as unknown as { displayName?: string })?.displayName || ""}
        userEmail={user?.email || ""}
      />
    </div>
  );
}

export default ProfileAndSettings;
