import { useState, useEffect, useCallback, Suspense } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { AppShell } from "./components/AppShell.tsx";
import { LoadingScreen } from "./screens/LoadingScreen.tsx";
import { useStudentProfile } from "./features/student/useStudentProfile.ts";
import { SubjectKey, StudentProfile, StudentGrade } from "./features/student/studentTypes.ts";
import { getStudentProfile, deleteStudentProfile } from "./features/student/studentStorage.ts";
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
  triggerSessionRecoveryNotification,
} from "./auth/sessionRecovery.ts";
import { checkUserExists } from "./auth/userProfileService.ts";
import { FeatureFlagProvider } from "./features/flags/index.ts";
import { ProtectedStudentRoute } from "./routes/ProtectedStudentRoute.tsx";
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

  // Authentication & Initialization State (Firebase Auth is the sole authority)
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [authLoading, setAuthLoading] = useState<boolean>(() => {
    // If explicitly on a public auth screen (/login, /register, /forgot-password, /welcome), render it immediately
    if (typeof window !== "undefined") {
      const p = window.location.pathname.replace(/\/+$/, "");
      if (p === "/login" || p === "/register" || p === "/forgot-password" || p === "/welcome") {
        return false;
      }
    }
    if (!isFirebaseConfigured()) return false;
    const auth = getFirebaseAuth();
    if (!auth) return false;
    return auth.currentUser === null;
  });
  const [loadingMessage, setLoadingMessage] = useState<string>("چاوەڕێبکە... پشکنینی ناسنامە");
  const [isExitingLoading, setIsExitingLoading] = useState<boolean>(false);
  const [activeProfile, setActiveProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  const [authTimedOut, setAuthTimedOut] = useState(false);

  const smoothFinishLoading = useCallback(() => {
    setIsExitingLoading(true);
    setTimeout(() => {
      setAuthLoading(false);
      setIsExitingLoading(false);
      setAuthTimedOut(false);
    }, 200);
  }, []);

  const redirectToLogin = useCallback(() => {
    setAuthScreen("login");
    setIsAuthExplicit(true);
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.history.replaceState(null, "", "/login");
    }
  }, []);
  const [authScreen, setAuthScreen] = useState<"welcome" | "login" | "register" | "forgot-password">(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname.replace(/\/+$/, "");
      if (p === "/register") return "register";
      if (p === "/forgot-password") return "forgot-password";
      if (p === "/login") return "login";
      if (p === "/welcome" || p === "") return "welcome";
      return "login";
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

  useEffect(() => {
    if (!authLoading && !isPermanentUser && !isAuthExplicit && typeof window !== "undefined") {
      const p = window.location.pathname.replace(/\/+$/, "") || "/";
      if (p !== "/" && p !== "/welcome") {
        setAuthScreen("login");
        setIsAuthExplicit(true);
        if (window.location.pathname !== "/login") {
          window.history.replaceState(null, "", "/login");
        }
      }
    }
  }, [authLoading, isPermanentUser, isAuthExplicit]);

  // Clear any legacy guest bypass flag so protected routes never bypass Firebase Auth
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("zana_guest_bypassed");
      } catch {
        // ignore
      }
    }
  }, []);

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

  // Timeout indicator if Firebase Auth initialization stalls (never unlocks protected routes)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (authLoading) {
      timer = setTimeout(() => {
        setAuthTimedOut(true);
      }, 6000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [authLoading]);

  // Auth State Listeners & Returning User Auto-Detection with Smooth Transition
  useEffect(() => {
    let isMounted = true;

    const unsubCustom = subscribeToAuthChanges((u) => {
      if (!isMounted) return;
      setCurrentUser(u);
      setAuthTimedOut(false);
      if (!u) {
        deleteStudentProfile();
        resetProfileOnly();
        setActiveProfile(null);
        useAppStore.getState().logout();
        smoothFinishLoading();
      }
    });

    const auth = getFirebaseAuth();
    let unsubFirebase = () => {};
    if (auth) {
      unsubFirebase = onAuthStateChanged(auth, async (u) => {
        if (!isMounted) return;
        setCurrentUser(u);
        setAuthTimedOut(false);

        if (!u || u.isAnonymous) {
          deleteStudentProfile();
          resetProfileOnly();
          setActiveProfile(null);
          useAppStore.getState().logout();
          setIsForcedOnboarding(false);
          smoothFinishLoading();
          return;
        }

        // Purge cached state if cached profile belongs to a different UID (account-switch isolation)
        const localProf = getStudentProfile();
        const storeUserId = useAppStore.getState().user.id;
        if (
          (localProf && localProf.id !== u.uid) ||
          (storeUserId && storeUserId !== "default-guest" && storeUserId !== u.uid)
        ) {
          deleteStudentProfile();
          resetProfileOnly();
          setActiveProfile(null);
          useAppStore.getState().logout();
        }

        // Returning user detection: load authoritative profile
        setLoadingMessage("چاوەڕێبکە... ئامادەکردنی پرۆفایل");
        try {
          const check = await checkUserExists(u.uid);
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
            void triggerSessionRecoveryNotification(u.uid, targetRec);
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
  }, [smoothFinishLoading, resetProfileOnly]);

  // Save session recovery position as student studies
  useEffect(() => {
    if (activeTab && activeTab !== "admin") {
      saveSessionPosition(activeTab, effectiveProfile?.activeSubject || useAppStore.getState().user.activeSubject);
    }
  }, [activeTab, effectiveProfile?.activeSubject]);

  // Trigger returning student recovery notification on initial load if session exists
  useEffect(() => {
    const rec = getSessionRecovery();
    if (rec) {
      const uid = currentUser?.uid || effectiveProfile?.id || "default-guest";
      void triggerSessionRecoveryNotification(uid, rec);
    }
  }, [currentUser?.uid, effectiveProfile?.id]);

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
    deleteStudentProfile();
    resetProfileOnly();
    setActiveProfile(null);
    useAppStore.getState().logout();
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("zana_guest_bypassed");
      window.history.pushState(null, "", "/login");
    }
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
        email: currentUser?.email || "",
        avatar: "",
        streakDays: curProgress.streak || 1,
        completedLessons: curProgress.lessonsCompleted || 0,
        totalScore: curProgress.totalScore || 0,
      },
    });
  };

  const handleSelectSubject = (subjectId: SubjectKey, browsingGrade?: StudentGrade) => {
    // Selecting a book or browsing grade never mutates permanent student grade/stream
    updateProfile({ activeSubject: subjectId });
    setActiveProfile((prev: StudentProfile | null) =>
      prev ? { ...prev, activeSubject: subjectId } : null
    );
    useAppStore.getState().setActiveSubject(subjectId, browsingGrade || effectiveProfile?.grade || "12");
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
          smoothFinishLoading();
        }}
      />
    );
  }

  // 2. Unauthenticated User Flows or Explicit Auth Route (/login, /register, /forgot-password)
  const showAuthFlow = isAuthExplicit || !isPermanentUser;
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
                setCurrentUser(getCurrentUser());
                setIsAuthExplicit(false);
                if (typeof window !== "undefined") {
                  window.history.replaceState(null, "", "/");
                }
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
              setCurrentUser(getCurrentUser());
              setIsAuthExplicit(false);
              if (typeof window !== "undefined") {
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
                const uid = getCurrentUser()?.uid || currentUser?.uid || effectiveProfile?.id || useAppStore.getState().user.id;
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
            onNavigateToPractice={(_topic) => setActiveTab("practice")}
            onNavigateToSubjects={() => setActiveTab("subjects")}
            onNavigateToChat={(subject, _topic) => {
              if (subject) handleSelectSubject(subject as SubjectKey);
              setActiveTab("chat");
            }}
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
          userId={currentUser?.uid || effectiveProfile?.id}
          onNavigateToLogin={() => navigateAuth("login")}
          onNavigateToRegister={() => navigateAuth("register")}
          onLogout={handleLogout}
        >
          <ErrorBoundary>
            <ProtectedStudentRoute
              authLoading={authLoading}
              isAuthenticated={isPermanentUser}
              loadingFallback={<ScreenLoadingFallback />}
              onUnauthenticated={redirectToLogin}
            >
              <Suspense fallback={<ScreenLoadingFallback />}>
                {renderScreen()}
              </Suspense>
            </ProtectedStudentRoute>
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

