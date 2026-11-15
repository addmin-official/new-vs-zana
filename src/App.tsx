import { useState, useEffect, lazy, Suspense } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { AppShell } from "./components/AppShell.tsx";
import { LoadingScreen } from "./screens/LoadingScreen.tsx";
import { useStudentProfile } from "./features/student/useStudentProfile.ts";
import { SubjectKey } from "./features/student/studentTypes.ts";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { getFirebaseAuth, isFirebaseConfigured } from "./services/firebase.ts";
import { getCurrentUser, logoutUser, subscribeToAuthChanges } from "./services/authService.ts";
import { deleteStudentProfile } from "./features/student/studentStorage.ts";
import { useAppStore } from "./store/appStore.ts";
import { NavItemKey } from "./components/Sidebar.tsx";
import { DevQuickToolbar } from "./components/DevQuickToolbar.tsx";

// Lazy-loaded routes for code-splitting and performance (LCP/FCP < 2s)
const Home = lazy(() => import("./pages/Home.tsx").then((m) => ({ default: m.Home })));
const Chat = lazy(() => import("./pages/Chat.tsx").then((m) => ({ default: m.Chat })));
const PracticeLab = lazy(() => import("./pages/PracticeLab.tsx").then((m) => ({ default: m.PracticeLab })));
const VirtualScienceLab = lazy(() => import("./pages/VirtualScienceLab.tsx").then((m) => ({ default: m.VirtualScienceLab })));
const AdaptiveAssessment = lazy(() => import("./pages/AdaptiveAssessment.tsx").then((m) => ({ default: m.AdaptiveAssessment })));
const StudyPathManager = lazy(() => import("./pages/StudyPathManager.tsx").then((m) => ({ default: m.StudyPathManager })));
const StudyRooms = lazy(() => import("./pages/StudyRooms.tsx").then((m) => ({ default: m.StudyRooms })));
const ParentReport = lazy(() => import("./pages/ParentReport.tsx").then((m) => ({ default: m.ParentReport })));
const ProfileAndSettings = lazy(() => import("./pages/ProfileAndSettings.tsx").then((m) => ({ default: m.ProfileAndSettings })));
const SubjectsScreen = lazy(() => import("./screens/SubjectsScreen.tsx").then((m) => ({ default: m.SubjectsScreen })));
const BrainAdminDashboard = lazy(() => import("./features/brain/BrainAdminDashboard.tsx").then((m) => ({ default: m.BrainAdminDashboard })));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard.tsx").then((m) => ({ default: m.TeacherDashboard })));
const ParentPortal = lazy(() => import("./pages/ParentPortal.tsx").then((m) => ({ default: m.ParentPortal })));
const SystemAdminDashboard = lazy(() => import("./pages/BrainAdminDashboard.tsx").then((m) => ({ default: m.BrainAdminDashboard })));
const AdminRoute = lazy(() => import("./routes/AdminRoute.tsx").then((m) => ({ default: m.AdminRoute })));
const RegisterScreen = lazy(() => import("./screens/RegisterScreen.tsx").then((m) => ({ default: m.RegisterScreen })));
const ForgotPasswordScreen = lazy(() => import("./screens/ForgotPasswordScreen.tsx").then((m) => ({ default: m.ForgotPasswordScreen })));
const PedagogicalHubScreen = lazy(() => import("./screens/PedagogicalHubScreen.tsx"));
const OnboardingScreen = lazy(() => import("./screens/OnboardingScreen.tsx").then((m) => ({ default: m.OnboardingScreen })));
const LoginScreen = lazy(() => import("./screens/LoginScreen.tsx").then((m) => ({ default: m.LoginScreen })));
const WelcomeScreen = lazy(() => import("./screens/WelcomeScreen.tsx").then((m) => ({ default: m.WelcomeScreen })));

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
  "/report": "report",
  "/teacher": "teacher",
  "/parent": "parent",
  "/admin": "admin",
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
  report: "/report",
  teacher: "/teacher",
  parent: "/parent",
  admin: "/admin",
  profile: "/profile",
  settings: "/settings",
};

function resolveTabFromPath(pathname: string): NavItemKey {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (PATH_TO_TAB[normalized]) return PATH_TO_TAB[normalized];
  // Deep-linking: Match subpath prefix, e.g. /subjects/chemistry -> subjects
  for (const [routePath, tabKey] of Object.entries(PATH_TO_TAB)) {
    if (routePath !== "/" && (normalized === routePath || normalized.startsWith(`${routePath}/`))) {
      return tabKey;
    }
  }
  return "home";
}

export default function App() {
  const { profile, updateProfile, completeOnboarding, resetProfileOnly } = useStudentProfile();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [authLoading, setAuthLoading] = useState<boolean>(() => {
    if (!isFirebaseConfigured()) return false;
    const auth = getFirebaseAuth();
    if (!auth) return false;
    return auth.currentUser === null;
  });
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

  // Auth State Listeners
  useEffect(() => {
    const unsubCustom = subscribeToAuthChanges((u) => {
      setCurrentUser(u);
      setAuthLoading(false);
    });

    const auth = getFirebaseAuth();
    let unsubFirebase = () => {};
    if (auth) {
      unsubFirebase = onAuthStateChanged(auth, (u) => {
        setCurrentUser(u || getCurrentUser());
        setAuthLoading(false);
      });
    }

    return () => {
      unsubCustom();
      unsubFirebase();
    };
  }, []);

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
    if (profile && profile.onboardingCompleted) {
      const curUser = useAppStore.getState().user;
      if (
        curUser.id !== profile.id ||
        curUser.name !== profile.name ||
        curUser.grade !== profile.grade ||
        curUser.stream !== profile.stream ||
        curUser.activeSubject !== profile.activeSubject
      ) {
        useAppStore.setState({
          user: {
            ...curUser,
            id: profile.id,
            name: profile.name,
            grade: profile.grade,
            stream: profile.stream as "scientific" | "literary" | "general",
            activeSubject: profile.activeSubject,
            email: currentUser?.email || curUser.email || "",
          },
        });
        if (profile.activeSubject) {
          void useAppStore.getState().fetchChapters(profile.activeSubject);
        }
      }
    }
  }, [profile, currentUser]);

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
    useAppStore.getState().logout();
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("zana_guest_bypassed");
      window.history.pushState(null, "", "/login");
    }
    setIsGuestBypassed(false);
    setAuthScreen("login");
    setIsAuthExplicit(true);
    setActiveTab("home");
  };

  const handleOnboardingComplete = (
    name: string,
    grade: string,
    subject: string,
    level: string,
    stream?: string
  ) => {
    const newProf = completeOnboarding(name, grade, subject, level, stream);
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
    useAppStore.getState().setActiveSubject(subjectId);
  };

  const _handleStartAssessment = () => {
    setIsBrainActive(false);
    setActiveTab("assessment");
  };

  const handleFinishAssessment = () => {
    setActiveTab("home");
  };

  // 1. Initial Authentication Loading State
  if (authLoading) {
    return (
      <ThemeProvider>
        <LoadingScreen message="چاوەڕوان بە... بارکردنی پلاتفۆڕمی زانا" />
      </ThemeProvider>
    );
  }

  // 2. Unauthenticated User Flows or Explicit Auth Route (/login, /register, /forgot-password)
  const showAuthFlow = isAuthExplicit || (!isPermanentUser && !isGuestBypassed);
  if (showAuthFlow) {
    if (authScreen === "welcome") {
      return (
        <ThemeProvider>
          <Suspense fallback={<ScreenLoadingFallback />}>
            <WelcomeScreen
              onGetStarted={() => navigateAuth("register")}
              onNavigateToLogin={() => navigateAuth("login")}
            />
          </Suspense>
        </ThemeProvider>
      );
    }

    if (authScreen === "register") {
      return (
        <ThemeProvider>
          <Suspense fallback={<ScreenLoadingFallback />}>
            <RegisterScreen
              onNavigateToLogin={() => navigateAuth("login")}
              onRegisterSuccess={(regData) => {
                setIsAuthExplicit(false);
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("zana_guest_bypassed", "true");
                  window.history.replaceState(null, "", "/chat");
                }
                setIsGuestBypassed(true);
                handleOnboardingComplete(
                  regData.name,
                  regData.grade,
                  regData.subject,
                  "intermediate",
                  regData.stream
                );
                setActiveTab("chat");
              }}
            />
          </Suspense>
        </ThemeProvider>
      );
    }

    if (authScreen === "forgot-password") {
      return (
        <ThemeProvider>
          <Suspense fallback={<ScreenLoadingFallback />}>
            <ForgotPasswordScreen
              onNavigateToLogin={() => navigateAuth("login")}
            />
          </Suspense>
        </ThemeProvider>
      );
    }

    return (
      <ThemeProvider>
        <Suspense fallback={<ScreenLoadingFallback />}>
          <LoginScreen
            onNavigateToRegister={() => navigateAuth("register")}
            onNavigateToForgotPassword={() => navigateAuth("forgot-password")}
            onLoginSuccess={() => {
              setIsAuthExplicit(false);
              if (typeof window !== "undefined") {
                sessionStorage.setItem("zana_guest_bypassed", "true");
                const target = isBrainActive ? "/admin/brain" : "/";
                window.history.replaceState(null, "", target);
              }
              setIsGuestBypassed(true);
            }}
          />
        </Suspense>
      </ThemeProvider>
    );
  }

  // 3. Admin Route Direct Access (if admin is authenticated)
  if (isBrainActive) {
    return (
      <ThemeProvider>
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
      </ThemeProvider>
    );
  }

  // 4. Authenticated Student Onboarding Flow
  if (!profile.onboardingCompleted || isForcedOnboarding) {
    return (
      <ThemeProvider>
        <div className="min-h-screen w-full bg-[#071927] flex flex-col items-center py-4 sm:py-8 px-2 sm:px-4 overflow-y-auto overflow-x-hidden transition-colors duration-300">
          <Suspense fallback={<ScreenLoadingFallback />}>
            <OnboardingScreen
              onComplete={(...args) => {
                handleOnboardingComplete(...args);
                setIsForcedOnboarding(false);
              }}
            />
          </Suspense>
        </div>
      </ThemeProvider>
    );
  }

  // 5. Main App Screens (9 Screens specification)
  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return (
          <Home
            profile={profile}
            onNavigateToChat={(subject) => {
              if (subject) handleSelectSubject(subject as SubjectKey);
              setActiveTab("chat");
            }}
            onNavigateToSubjects={() => setActiveTab("subjects")}
            onNavigateToAssessment={() => setActiveTab("assessment")}
            onNavigateToPractice={() => setActiveTab("practice")}
            onNavigateToPedagogy={() => setActiveTab("pedagogy")}
          />
        );
      case "chat":
        return (
          <Chat
            profile={profile}
            onSelectSubject={handleSelectSubject}
            onNavigateToSubjects={() => setActiveTab("subjects")}
          />
        );
      case "subjects":
        return (
          <SubjectsScreen
            profile={profile}
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
        return <ParentReport profile={profile} />;
      case "teacher":
        return (
          <TeacherDashboard
            onNavigateToSubjects={() => setActiveTab("subjects")}
            onNavigateToPractice={() => setActiveTab("practice")}
            onBackToApp={() => setActiveTab("home")}
          />
        );
      case "parent":
        return (
          <ParentPortal
            profile={profile}
            onBackToApp={() => setActiveTab("home")}
          />
        );
      case "admin":
        return (
          <SystemAdminDashboard
            onBackToApp={() => setActiveTab("home")}
            onNavigateToTeacher={() => setActiveTab("teacher")}
            onNavigateToParent={() => setActiveTab("parent")}
          />
        );
      case "profile":
      case "settings":
        return (
          <ProfileAndSettings
            profile={profile}
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
            profile={profile}
            onNavigateToChat={(subject) => {
              if (subject) handleSelectSubject(subject as SubjectKey);
              setActiveTab("chat");
            }}
            onNavigateToSubjects={() => setActiveTab("subjects")}
            onNavigateToAssessment={() => setActiveTab("assessment")}
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
    teacher: "داشبۆردی مامۆستا (Teacher Portal)",
    parent: "دەروازەی سەرپەرشتیار (Parent Portal)",
    admin: "بەڕێوەبەرایەتی سیستم (System Intelligence)",
    profile: "پڕۆفایل و ڕێکخستنەکان 👤",
    settings: "ڕێکخستنەکان",
  };

  const pageTitle = pageTitleMap[activeTab] || "پلاتفۆرمی زانا 🎓";

  return (
    <ThemeProvider>
      <AppShell
        activeTab={activeTab}
        onTabChange={(tab) => {
          setIsBrainActive(false);
          setActiveTab(tab);
        }}
        pageTitle={pageTitle}
        isPermanentUser={isPermanentUser}
        onNavigateToLogin={() => navigateAuth("login")}
        onNavigateToRegister={() => navigateAuth("register")}
        onLogout={handleLogout}
      >
        <Suspense fallback={<ScreenLoadingFallback />}>
          {renderScreen()}
        </Suspense>
      </AppShell>
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
    </ThemeProvider>
  );
}

