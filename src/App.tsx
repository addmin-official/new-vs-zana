import { useState, useEffect, lazy, Suspense } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { Sparkles } from "lucide-react";
import { AppShell } from "./components/AppShell.tsx";
import { LoadingScreen } from "./screens/LoadingScreen.tsx";
import { useStudentProfile } from "./features/student/useStudentProfile.ts";
import { SubjectKey, StudentProfile } from "./features/student/studentTypes.ts";
import { getStudentProfile } from "./features/student/studentStorage.ts";
import { getFirebaseAuth, isFirebaseConfigured } from "./services/firebase.ts";
import { getCurrentUser, logoutUser, subscribeToAuthChanges } from "./services/authService.ts";
import { useAppStore } from "./store/appStore.ts";
import { NavItemKey } from "./components/Sidebar.tsx";
import { DevQuickToolbar } from "./components/DevQuickToolbar.tsx";
import { usePerformanceMonitor } from "./hooks/usePerformanceMonitor.ts";
import { OfflineBanner } from "./components/pwa/OfflineBanner.tsx";
import { PwaInstallPrompt } from "./components/pwa/PwaInstallPrompt.tsx";
import { ErrorBoundary } from "./client/components/common/ErrorBoundary.tsx";
import {
  saveSessionPosition,
  getSessionRecovery,
  clearSessionRecovery,
  getSubjectKurdishName,
  triggerSessionRecoveryNotification,
  SessionRecoveryData,
} from "./auth/sessionRecovery.ts";
import { checkUserExists } from "./auth/userProfileService.ts";
import { FeatureFlagProvider } from "./features/flags/index.ts";
import type { PedagogyPillarTab } from "./screens/PedagogicalHubScreen.tsx";
import { lazyWithRetry } from "./utils/lazyWithRetry.ts";

// Lazy-loaded routes with automatic retry and reload on new version deployments
const Home = lazyWithRetry(() => import("./pages/Home.tsx").then((m) => ({ default: m.Home })));
const Chat = lazyWithRetry(() => import("./pages/Chat.tsx").then((m) => ({ default: m.Chat })));
const PracticeLab = lazyWithRetry(() => import("./pages/PracticeLab.tsx").then((m) => ({ default: m.PracticeLab })));
const VirtualScienceLab = lazyWithRetry(() => import("./pages/VirtualScienceLab.tsx").then((m) => ({ default: m.VirtualScienceLab })));
const AdaptiveAssessment = lazyWithRetry(() => import("./pages/AdaptiveAssessment.tsx").then((m) => ({ default: m.AdaptiveAssessment })));
const StudyPathManager = lazyWithRetry(() => import("./pages/StudyPathManager.tsx").then((m) => ({ default: m.StudyPathManager })));
const StudyRooms = lazyWithRetry(() => import("./pages/StudyRooms.tsx").then((m) => ({ default: m.StudyRooms })));
const ParentReport = lazyWithRetry(() => import("./pages/ParentReport.tsx").then((m) => ({ default: m.ParentReport })));
const ProfileAndSettings = lazyWithRetry(() => import("./pages/ProfileAndSettings.tsx").then((m) => ({ default: m.ProfileAndSettings })));
const SubjectsScreen = lazyWithRetry(() => import("./screens/SubjectsScreen.tsx").then((m) => ({ default: m.SubjectsScreen })));
const BrainAdminDashboard = lazyWithRetry(() => import("./features/brain/BrainAdminDashboard.tsx").then((m) => ({ default: m.BrainAdminDashboard })));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard.tsx").then((m) => ({ default: m.AdminDashboard })));
const AdminRoute = lazyWithRetry(() => import("./auth/adminGuard.ts").then((m) => ({ default: m.AdminRoute })));
const RegisterScreen = lazyWithRetry(() => import("./pages/Register.tsx").then((m) => ({ default: m.Register })));
const ForgotPasswordScreen = lazyWithRetry(() => import("./screens/ForgotPasswordScreen.tsx").then((m) => ({ default: m.ForgotPasswordScreen })));
const PedagogicalHubScreen = lazyWithRetry(() => import("./screens/PedagogicalHubScreen.tsx"));
const OnboardingScreen = lazyWithRetry(() => import("./screens/OnboardingScreen.tsx").then((m) => ({ default: m.OnboardingScreen })));
const LoginScreen = lazyWithRetry(() => import("./pages/Login.tsx").then((m) => ({ default: m.Login })));
const WelcomeScreen = lazyWithRetry(() => import("./screens/WelcomeScreen.tsx").then((m) => ({ default: m.WelcomeScreen })));

function ScreenLoadingFallback() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[50vh] p-8 gap-4"
      role="status"
      aria-label="چاوەڕوان بە... بارکردنی پەڕە"
    >
      <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <span className="text-sm font-medium text-slate-500">چاوەڕوان بە... بارکردنی زانیارییەکان</span>
    </div>
  );
}

const PATH_TO_TAB: Record<string, NavItemKey> = {
  "/": "home",
  "/home": "home",
  "/chat": "chat",
  "/subjects": "subjects",
  "/practice": "practice",
  "/pedagogy": "pedagogy",
  "/labs": "labs",
  "/assessment": "assessment",
  "/plan": "plan",
  "/rooms": "rooms",
  "/admin": "admin",
  "/admin/students": "admin",
  "/admin/content": "admin",
  "/admin/system": "admin",
  "/admin/flags": "admin",
  "/profile": "profile",
  "/settings": "settings",
};

const TAB_TO_PATH: Record<NavItemKey, string> = {
  home: "/",
  chat: "/chat",
  subjects: "/subjects",
  practice: "/practice",
  pedagogy: "/pedagogy",
  labs: "/labs",
  assessment: "/assessment",
  plan: "/plan",
  rooms: "/rooms",
  report: "/profile",
  admin: "/admin",
  profile: "/profile",
  settings: "/settings",
};

function resolveTabFromPath(pathname: string): NavItemKey {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  // DELETE these routes entirely from platform: /teacher, /teacher/*, /parent, /parent/*, /manager
  if (
    normalized === "/teacher" ||
    normalized.startsWith("/teacher/") ||
    normalized === "/parent" ||
    normalized.startsWith("/parent/") ||
    normalized === "/manager" ||
    normalized.startsWith("/manager/")
  ) {
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/home");
    }
    return "home";
  }

  if (PATH_TO_TAB[normalized]) return PATH_TO_TAB[normalized];
  // Deep-linking: Match subpath prefix, e.g. /subjects/chemistry -> subjects
  for (const [routePath, tabKey] of Object.entries(PATH_TO_TAB)) {
    if (routePath !== "/" && (normalized === routePath || normalized.startsWith(`${routePath}/`))) {
      return tabKey;
    }
  }
  return "home";
}

// Prefetch route chunks on link/nav hover for instant transition
const routePrefetchMap: Partial<Record<NavItemKey, () => Promise<unknown>>> = {
  home: () => import("./pages/Home.tsx"),
  chat: () => import("./pages/Chat.tsx"),
  subjects: () => import("./screens/SubjectsScreen.tsx"),
  practice: () => import("./pages/PracticeLab.tsx"),
  pedagogy: () => import("./screens/PedagogicalHubScreen.tsx"),
  labs: () => import("./pages/VirtualScienceLab.tsx"),
  assessment: () => import("./pages/AdaptiveAssessment.tsx"),
  plan: () => import("./pages/StudyPathManager.tsx"),
  rooms: () => import("./pages/StudyRooms.tsx"),
  report: () => import("./pages/ParentReport.tsx"),
  admin: () => import("./pages/AdminDashboard.tsx"),
  profile: () => import("./pages/ProfileAndSettings.tsx"),
  settings: () => import("./pages/ProfileAndSettings.tsx"),
};

function prefetchTab(tab: NavItemKey): void {
  const loader = routePrefetchMap[tab];
  if (loader) {
    void loader();
  }
}

export default function App() {
  const { profile, updateProfile, completeOnboarding, resetProfileOnly } = useStudentProfile();
  usePerformanceMonitor();

  // Authentication & Initialization State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [authLoading, setAuthLoading] = useState<boolean>(() => {
    if (!isFirebaseConfigured()) return false;
    const auth = getFirebaseAuth();
    if (!auth) return false;
    return auth.currentUser === null;
  });
  const [loadingMessage, setLoadingMessage] = useState<string>("چاوەڕێبکە... پشکنینی ناسنامە");
  const [isExitingLoading, setIsExitingLoading] = useState<boolean>(false);
  const [activeProfile, setActiveProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [sessionRecoveryNotice, setSessionRecoveryNotice] = useState<SessionRecoveryData | null>(
    () => getSessionRecovery()
  );
  const [authScreen, setAuthScreen] = useState<"welcome" | "login" | "register" | "forgot-password">(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname.replace(/\/+$/, "");
      if (p === "/register") return "register";
      if (p === "/forgot-password") return "forgot-password";
      if (p === "/login") return "login";
      if (p === "/welcome") return "welcome";
    }
    return "welcome";
  });
  const [isAuthExplicit, setIsAuthExplicit] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname.replace(/\/+$/, "");
      return p === "/login" || p === "/register" || p === "/forgot-password" || p === "/welcome";
    }
    return false;
  });

  // Effective student profile (prioritizes directly verified profile to prevent flicker)
  const effectiveProfile = activeProfile || profile;

  // Genuinely authenticated permanent user (Email or Google account)
  const isPermanentUser = Boolean(currentUser && !currentUser.isAnonymous && currentUser.email);

  // Check if student has explicitly bypassed login in this browser session as guest
  const [isGuestBypassed, setIsGuestBypassed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("zana_guest_bypassed") === "true";
    }
    return false;
  });

  // Manage active tab, plus optional "brain" mode
  const [activeTab, setActiveTabState] = useState<NavItemKey>(() => {
    if (typeof window !== "undefined") {
      return resolveTabFromPath(window.location.pathname);
    }
    return "home";
  });
  const [pedagogyPillar, setPedagogyPillar] = useState<PedagogyPillarTab>("feynman");
  const [isForcedOnboarding, setIsForcedOnboarding] = useState(false);
  const [isBrainActive, setIsBrainActive] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname.startsWith("/admin/brain");
    }
    return false;
  });

  const setActiveTab = (tab: NavItemKey) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      setIsBrainActive(false);
      const targetPath = TAB_TO_PATH[tab] || "/";
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, "", targetPath);
      }
    }
  };

  // 10s Auth loading timeout guard
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (authLoading) {
      timer = setTimeout(() => {
        setAuthTimedOut(true);
      }, 10000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [authLoading]);

  // Auth State Listeners & Returning User Auto-Detection with Smooth Transition
  useEffect(() => {
    let isMounted = true;

    const smoothFinishLoading = () => {
      if (!isMounted) return;
      setIsExitingLoading(true);
      setTimeout(() => {
        if (!isMounted) return;
        setAuthLoading(false);
        setIsExitingLoading(false);
      }, 250);
    };

    const unsubCustom = subscribeToAuthChanges((u) => {
      if (!isMounted) return;
      setCurrentUser(u);
      setAuthTimedOut(false);
      if (!u) {
        smoothFinishLoading();
      }
    });

    const auth = getFirebaseAuth();
    let unsubFirebase = () => {};
    if (auth) {
      unsubFirebase = onAuthStateChanged(auth, async (u) => {
        if (!isMounted) return;
        const effectiveUser = u || getCurrentUser();
        setCurrentUser(effectiveUser);
        setAuthTimedOut(false);

        // Returning user detection: load Firestore profile without forcing re-registration
        if (effectiveUser && !effectiveUser.isAnonymous) {
          setLoadingMessage("چاوەڕێبکە... ئامادەکردنی پرۆفایل");
          try {
            const check = await checkUserExists(effectiveUser.uid);
            if (!isMounted) return;
            if (check.exists && check.profile) {
              setActiveProfile(check.profile);
              setIsForcedOnboarding(false);
              const rec = getSessionRecovery();
              const targetRec = rec || {
                lastRoute: "/home",
                lastSubject: check.profile.activeSubject || "chemistry",
                timestamp: Date.now(),
              };
              setSessionRecoveryNotice(targetRec);
              void triggerSessionRecoveryNotification(effectiveUser.uid, targetRec);
              if (rec && typeof window !== "undefined") {
                const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
                if (currentPath === "/" || currentPath === "/home") {
                  setActiveTabState(resolveTabFromPath(rec.lastRoute));
                }
              }
            } else if (check.isNewUser) {
              setIsForcedOnboarding(true);
            }
          } catch (e) {
            console.warn("Returning user profile check failed:", e);
          }
        }
        smoothFinishLoading();
      });
    } else {
      smoothFinishLoading();
    }

    return () => {
      isMounted = false;
      unsubCustom();
      unsubFirebase();
    };
  }, []);

  // Save session recovery position as student studies
  useEffect(() => {
    if (activeTab && activeTab !== "admin") {
      saveSessionPosition(activeTab, effectiveProfile?.activeSubject || useAppStore.getState().user.activeSubject);
    }
  }, [activeTab, effectiveProfile?.activeSubject]);

  // Listen to popstate for browser history navigation
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const path = window.location.pathname.replace(/\/+$/, "") || "/";
        setIsBrainActive(path.startsWith("/admin/brain"));
        if (path === "/register") {
          setAuthScreen("register");
          setIsAuthExplicit(true);
        } else if (path === "/forgot-password") {
          setAuthScreen("forgot-password");
          setIsAuthExplicit(true);
        } else if (path === "/login") {
          setAuthScreen("login");
          setIsAuthExplicit(true);
        } else if (path === "/welcome") {
          setAuthScreen("welcome");
          setIsAuthExplicit(true);
        } else {
          setIsAuthExplicit(false);
          const resolvedTab = resolveTabFromPath(path);
          setActiveTabState(resolvedTab);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Synchronize authenticated student profile with global app store
  useEffect(() => {
    if (effectiveProfile && effectiveProfile.onboardingCompleted) {
      const curUser = useAppStore.getState().user;
      if (
        curUser.id !== effectiveProfile.id ||
        curUser.name !== effectiveProfile.name ||
        curUser.grade !== effectiveProfile.grade ||
        curUser.stream !== effectiveProfile.stream ||
        curUser.activeSubject !== effectiveProfile.activeSubject
      ) {
        useAppStore.setState({
          user: {
            ...curUser,
            id: effectiveProfile.id,
            name: effectiveProfile.name,
            grade: effectiveProfile.grade,
            stream: effectiveProfile.stream as "scientific" | "literary" | "general",
            activeSubject: effectiveProfile.activeSubject,
            email: currentUser?.email || curUser.email || "",
          },
        });
        if (effectiveProfile.activeSubject) {
          void useAppStore.getState().fetchChapters(effectiveProfile.activeSubject);
        }
      }
    }
  }, [effectiveProfile, currentUser]);

  // Admin secret keyboard shortcut (Ctrl + Shift + B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "B" || e.key === "b")) {
        e.preventDefault();
        setIsBrainActive((prev) => {
          const next = !prev;
          if (next) {
            window.history.pushState(null, "", "/admin/brain");
          } else {
            window.history.pushState(null, "", "/");
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigateAuth = (screen: "welcome" | "login" | "register" | "forgot-password") => {
    setAuthScreen(screen);
    setIsAuthExplicit(true);
    if (typeof window !== "undefined") {
      const targetUrl = screen === "welcome" ? "/" : `/${screen}`;
      window.history.pushState(null, "", targetUrl);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    // Note: Do NOT delete the persistent student profile from disk on logout!
    // This allows returning users to log back in without having to re-register.
    resetProfileOnly();
    setActiveProfile(null);
    useAppStore.getState().logout();
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("zana_guest_bypassed");
      window.history.pushState(null, "", "/login");
    }
    setIsGuestBypassed(false);
    setAuthScreen("login");
    setIsAuthExplicit(true);
    setActiveTabState("home");
  };

  const handleOnboardingComplete = (
    name: string,
    grade: string,
    subject: string,
    level: string,
    stream?: string
  ) => {
    const newProf = completeOnboarding(name, grade, subject, level, stream);
    setActiveProfile(newProf);
    setIsForcedOnboarding(false);
    const curProgress = useAppStore.getState().userProgress;
    useAppStore.setState({
      user: {
        id: newProf.id,
        name: newProf.name,
        grade: newProf.grade,
        stream: newProf.stream,
        email: currentUser?.email || "student@zana.krd",
        avatar: "",
        streakDays: curProgress.streak || 1,
        completedLessons: curProgress.lessonsCompleted || 0,
        totalScore: curProgress.totalScore || 0,
      },
    });
  };

  const handleSelectSubject = (subjectId: SubjectKey) => {
    updateProfile({ activeSubject: subjectId });
    setActiveProfile((prev: StudentProfile | null) => (prev ? { ...prev, activeSubject: subjectId } : null));
    useAppStore.getState().setActiveSubject(subjectId);
  };

  const _handleStartAssessment = () => {
    setIsBrainActive(false);
    setActiveTab("assessment");
  };

  const handleFinishAssessment = () => {
    setActiveTab("home");
  };

  // 1. Initial Authentication & Profile Initialization Loading State
  if (authLoading) {
    return (
      <LoadingScreen
        message={loadingMessage}
        isTimedOut={authTimedOut}
        isExiting={isExitingLoading}
        onRetry={() => {
          setAuthTimedOut(false);
          setAuthLoading(true);
          setLoadingMessage("چاوەڕێبکە... پشکنینی ناسنامە");
          const auth = getFirebaseAuth();
          if (auth) {
            setCurrentUser(auth.currentUser);
          }
          setTimeout(() => {
            setAuthLoading(false);
          }, 300);
        }}
      />
    );
  }

  // 2. Unauthenticated User Flows or Explicit Auth Route (/login, /register, /forgot-password)
  const showAuthFlow = isAuthExplicit || (!isPermanentUser && !isGuestBypassed);
  if (showAuthFlow) {
    if (authScreen === "welcome") {
      return (
        <ErrorBoundary>
          <Suspense fallback={<ScreenLoadingFallback />}>
            <WelcomeScreen
              onGetStarted={() => navigateAuth("register")}
              onNavigateToLogin={() => navigateAuth("login")}
            />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (authScreen === "register") {
      return (
        <ErrorBoundary>
          <Suspense fallback={<ScreenLoadingFallback />}>
            <RegisterScreen
              onNavigateToLogin={() => navigateAuth("login")}
              onRegisterSuccess={(regData) => {
                setIsAuthExplicit(false);
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("zana_guest_bypassed", "true");
                  window.history.replaceState(null, "", "/");
                }
                setIsGuestBypassed(true);
                setIsForcedOnboarding(false);
                handleOnboardingComplete(
                  regData.name,
                  regData.grade,
                  regData.subject,
                  "intermediate",
                  regData.stream
                );
                setActiveTabState("home");
              }}
            />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (authScreen === "forgot-password") {
      return (
        <ErrorBoundary>
          <Suspense fallback={<ScreenLoadingFallback />}>
            <ForgotPasswordScreen
              onNavigateToLogin={() => navigateAuth("login")}
            />
          </Suspense>
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary>
        <Suspense fallback={<ScreenLoadingFallback />}>
          <LoginScreen
            onNavigateToRegister={() => navigateAuth("register")}
            onNavigateToForgotPassword={() => navigateAuth("forgot-password")}
            onLoginSuccess={(isNewUser) => {
              setIsAuthExplicit(false);
              setIsGuestBypassed(true);
              if (typeof window !== "undefined") {
                sessionStorage.setItem("zana_guest_bypassed", "true");
                const target = isBrainActive ? "/admin/brain" : "/";
                window.history.replaceState(null, "", target);
              }
              if (!isNewUser) {
                setIsForcedOnboarding(false);
                const rec = getSessionRecovery();
                const targetRec = rec || {
                  lastRoute: "/home",
                  lastSubject: effectiveProfile?.activeSubject || "chemistry",
                  timestamp: Date.now(),
                };
                setSessionRecoveryNotice(targetRec);
                const uid = currentUser?.uid || effectiveProfile?.id || useAppStore.getState().user.id;
                if (uid) {
                  void triggerSessionRecoveryNotification(uid, targetRec);
                }
                if (rec) {
                  setActiveTabState(resolveTabFromPath(rec.lastRoute));
                } else {
                  setActiveTabState("home");
                }
              } else {
                setIsForcedOnboarding(true);
              }
            }}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 3. Admin Route Direct Access (if admin is authenticated)
  if (isBrainActive) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<ScreenLoadingFallback />}>
          <AdminRoute>
            <BrainAdminDashboard
              onBackToApp={() => {
                if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
                  window.history.pushState(null, "", "/");
                }
                setIsBrainActive(false);
              }}
            />
          </AdminRoute>
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 4. Authenticated Student Onboarding Flow
  if (!effectiveProfile.onboardingCompleted || isForcedOnboarding) {
    return (
      <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-4 sm:py-8 px-2 sm:px-4 overflow-y-auto overflow-x-hidden transition-colors duration-300">
        <ErrorBoundary>
          <Suspense fallback={<ScreenLoadingFallback />}>
            <OnboardingScreen
              onComplete={(...args) => {
                handleOnboardingComplete(...args);
                setIsForcedOnboarding(false);
              }}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  }

  // 5. Main App Screens (9 Screens specification)
  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return (
          <Home
            profile={effectiveProfile}
            onNavigateToChat={(subject) => {
              if (subject) handleSelectSubject(subject as SubjectKey);
              setActiveTab("chat");
            }}
            onNavigateToSubjects={() => setActiveTab("subjects")}
            onNavigateToPlan={() => setActiveTab("plan")}
            onNavigateToAssessment={() => setActiveTab("assessment")}
            onNavigateToPractice={() => setActiveTab("practice")}
            onNavigateToPedagogy={(pillar) => {
              if (pillar) setPedagogyPillar(pillar);
              setActiveTab("pedagogy");
            }}
            onNavigateToLabs={() => setActiveTab("labs")}
            onNavigateToRooms={() => setActiveTab("rooms")}
            onNavigateToReport={() => setActiveTab("report")}
          />
        );
      case "chat":
        return (
          <Chat
            profile={effectiveProfile}
            onSelectSubject={handleSelectSubject}
            onNavigateToSubjects={() => setActiveTab("subjects")}
          />
        );
      case "subjects":
        return (
          <SubjectsScreen
            profile={effectiveProfile}
            onSelectSubject={handleSelectSubject}
            onNavigate={(tab) => {
              if (tab === "chat") setActiveTab("chat");
              else if (tab === "practice") setActiveTab("practice");
              else setActiveTab("home");
            }}
          />
        );
      case "practice":
        return (
          <PracticeLab
            onNavigateToPedagogy={() => setActiveTab("pedagogy")}
            onNavigateToSubjects={() => setActiveTab("subjects")}
          />
        );
      case "pedagogy":
        return (
          <Suspense fallback={<ScreenLoadingFallback />}>
            <PedagogicalHubScreen
              initialTab={pedagogyPillar}
              onNavigateToHome={() => setActiveTab("home")}
              onNavigateToPractice={() => setActiveTab("practice")}
            />
          </Suspense>
        );
      case "labs":
        return <VirtualScienceLab />;
      case "assessment":
        return (
          <AdaptiveAssessment
            onFinish={handleFinishAssessment}
            onNavigateToPractice={() => setActiveTab("practice")}
            onNavigateToSubjects={() => setActiveTab("subjects")}
          />
        );
      case "plan":
        return (
          <StudyPathManager
            onNavigateToChat={(subject) => {
              if (subject) handleSelectSubject(subject as SubjectKey);
              setActiveTab("chat");
            }}
            onNavigateToPractice={() => setActiveTab("practice")}
            onNavigateToLabs={() => setActiveTab("labs")}
            onNavigateToAssessment={() => setActiveTab("assessment")}
          />
        );
      case "rooms":
        return <StudyRooms />;
      case "report":
        return <ParentReport profile={effectiveProfile} />;
      case "admin":
        return (
          <AdminRoute fallbackRedirect="/home">
            <AdminDashboard
              onNavigateHome={() => setActiveTab("home")}
              onLogout={handleLogout}
            />
          </AdminRoute>
        );
      case "profile":
      case "settings":
        return (
          <ProfileAndSettings
            profile={effectiveProfile}
            isPermanentUser={isPermanentUser}
            onUpdateProfile={updateProfile}
            onNavigateToLogin={() => navigateAuth("login")}
            onLogout={handleLogout}
            onReRunOnboarding={() => setIsForcedOnboarding(true)}
          />
        );
      default:
        return (
          <Home
            profile={effectiveProfile}
            onNavigateToChat={(subject) => {
              if (subject) handleSelectSubject(subject as SubjectKey);
              setActiveTab("chat");
            }}
            onNavigateToSubjects={() => setActiveTab("subjects")}
            onNavigateToPlan={() => setActiveTab("plan")}
            onNavigateToAssessment={() => setActiveTab("assessment")}
            onNavigateToPractice={() => setActiveTab("practice")}
            onNavigateToPedagogy={(pillar) => {
              if (pillar) setPedagogyPillar(pillar);
              setActiveTab("pedagogy");
            }}
            onNavigateToLabs={() => setActiveTab("labs")}
            onNavigateToRooms={() => setActiveTab("rooms")}
            onNavigateToReport={() => setActiveTab("report")}
          />
        );
    }
  };

  const pageTitleMap: Record<NavItemKey, string> = {
    home: "چروسکەی ڕۆژانە 🌟",
    chat: "ژینگەی خوێندنی سۆکراتی (Workspace)",
    subjects: "مەنهەجی خوێندن (Subjects)",
    practice: "تاقیگەی ڕاهێنان (Practice Lab)",
    pedagogy: "تاقیگەی نایابی پێداگۆجی 🎓",
    labs: "تاقیگەی زانستیی مەجازی (Virtual Science Lab)",
    assessment: "تاقیکردنەوەی ئەداپتیڤ (Assessment)",
    plan: "پلانی خوێندن (Study Path)",
    rooms: "ژووری خوێندنی بەکۆمەڵ (Study Rooms)",
    report: "ڕاپۆرتی هوشیاری باوان (Parent Report)",
    admin: "بەڕێوەبەرایەتی سیستم (Admin Console)",
    profile: "پڕۆفایل و ڕێکخستنەکان 👤",
    settings: "ڕێکخستنەکان",
  };

  const pageTitle = pageTitleMap[activeTab] || "پلاتفۆرمی زانا 🎓";

  return (
    <FeatureFlagProvider userId={currentUser?.uid}>
      <OfflineBanner />
      <div className="animate-in fade-in duration-300 ease-out">
        <AppShell
          activeTab={activeTab}
          onTabChange={(tab) => {
            setIsBrainActive(false);
            setActiveTab(tab);
          }}
          onPrefetch={prefetchTab}
          pageTitle={pageTitle}
          isPermanentUser={isPermanentUser}
          onNavigateToLogin={() => navigateAuth("login")}
          onNavigateToRegister={() => navigateAuth("register")}
          onLogout={handleLogout}
        >
          <ErrorBoundary>
            {sessionRecoveryNotice && (
              <div className="mb-4 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-500/30 text-slate-900 dark:text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      بەخێربێیتەوە! دواجار لە {getSubjectKurdishName(sessionRecoveryNotice.lastSubject)} بوویت
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      دەتوانیت ڕاستەوخۆ لەو وانەیەی کە لێی وەستابوویت بەردەوام بیت.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const target = resolveTabFromPath(sessionRecoveryNotice.lastRoute);
                      setActiveTab(target);
                      clearSessionRecovery();
                      setSessionRecoveryNotice(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    بەردەوام بە
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearSessionRecovery();
                      setSessionRecoveryNotice(null);
                    }}
                    className="px-2.5 py-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            <Suspense fallback={<ScreenLoadingFallback />}>
              {renderScreen()}
            </Suspense>
          </ErrorBoundary>
        </AppShell>
      </div>
      <PwaInstallPrompt />
      {import.meta.env.DEV && (
        <DevQuickToolbar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setIsBrainActive(false);
            setActiveTab(tab);
          }}
          onTriggerOnboarding={() => setIsForcedOnboarding(true)}
          onLogout={handleLogout}
        />
      )}
    </FeatureFlagProvider>
  );
}

