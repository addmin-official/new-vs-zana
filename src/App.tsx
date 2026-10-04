import { useState, useEffect } from "react";
import { AppShell } from "./components/AppShell.tsx";
import { OnboardingScreen } from "./screens/OnboardingScreen.tsx";
import { DailySparkScreen } from "./screens/DailySparkScreen.tsx";
import { SubjectsScreen } from "./screens/SubjectsScreen.tsx";
import { StudyWorkspaceScreen } from "./screens/StudyWorkspaceScreen.tsx";
import { AssessmentScreen } from "./screens/AssessmentScreen.tsx";
import { ParentReportScreen } from "./screens/ParentReportScreen.tsx";
import { ProfileScreen } from "./screens/ProfileScreen.tsx";
import { PracticeScreen } from "./screens/PracticeScreen.tsx";
import { StudyRoomScreen } from "./screens/StudyRoomScreen.tsx";
import { StudentStudyPathDashboard } from "./features/student/planning/StudentStudyPathDashboard.tsx";
import { BrainAdminDashboard } from "./features/brain/BrainAdminDashboard.tsx";
import { AdminRoute } from "./routes/AdminRoute.tsx";
import { useStudentProfile } from "./features/student/useStudentProfile.ts";
import { SubjectKey } from "./features/student/studentTypes.ts";
import { NavTab } from "./components/BottomNavigation.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";

export default function App() {
  const { profile, updateProfile, completeOnboarding, resetProfile, isOfflineFallback, authError } = useStudentProfile();
  
  // Manage active tab, plus optional "assessment" and "brain" modes
  const [activeTab, setActiveTab] = useState<NavTab>("daily");
  const [isAssessmentMode, setIsAssessmentMode] = useState(false);
  const [isBrainActive, setIsBrainActive] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname.startsWith("/admin/brain");
    }
    return false;
  });

  // Listen to popstate for secret /admin/brain browser history navigation
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        setIsBrainActive(window.location.pathname.startsWith("/admin/brain"));
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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

  const handleSelectSubject = (subjectId: SubjectKey) => {
    updateProfile({ activeSubject: subjectId });
  };

  const handleStartAssessment = () => {
    setIsBrainActive(false);
    setIsAssessmentMode(true);
  };

  const handleFinishAssessment = () => {
    setIsAssessmentMode(false);
    setActiveTab("daily");
  };

  // If student has not gone through onboarding and not navigating to admin route
  if (!profile.onboardingCompleted && !isBrainActive) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center px-4 transition-colors">
          <OnboardingScreen onComplete={completeOnboarding} />
        </div>
      </ThemeProvider>
    );
  }

  // Render proper view screen
  const renderScreen = () => {
    if (isBrainActive) {
      return (
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
      );
    }

    if (isAssessmentMode) {
      return (
        <AssessmentScreen
          profile={profile}
          onProfileUpdate={updateProfile}
          onNavigate={(tab) => {
            handleFinishAssessment();
            if (tab !== "daily") {
              setActiveTab(tab as NavTab);
            }
          }}
        />
      );
    }

    switch (activeTab) {
      case "daily":
        return (
          <DailySparkScreen
            profile={profile}
            onNavigate={(tab) => {
              setIsAssessmentMode(false);
              setActiveTab(tab as NavTab);
            }}
            onStartAssessment={handleStartAssessment}
          />
        );
      case "practice":
        return (
          <PracticeScreen
            profile={profile}
            onNavigate={(tab) => {
              setIsAssessmentMode(false);
              setActiveTab(tab as NavTab);
            }}
          />
        );
      case "rooms":
        return (
          <StudyRoomScreen
            profile={profile}
            onNavigateToPractice={(subjKey) => {
              if (subjKey) {
                updateProfile({ activeSubject: subjKey as SubjectKey });
              }
              setIsAssessmentMode(false);
              setActiveTab("practice");
            }}
            onNavigateToChat={() => {
              setIsAssessmentMode(false);
              setActiveTab("chat");
            }}
          />
        );
      case "plan":
        return (
          <StudentStudyPathDashboard
            studentId={profile.id || "student_demo"}
          />
        );
      case "subjects":
        return (
          <SubjectsScreen
            profile={profile}
            onSelectSubject={handleSelectSubject}
            onNavigate={(tab) => {
              setIsAssessmentMode(false);
              setActiveTab(tab as NavTab);
            }}
          />
        );
      case "chat":
        return <StudyWorkspaceScreen profile={profile} onNavigate={(tab) => setActiveTab(tab as NavTab)} />;
      case "report":
        return <ParentReportScreen profile={profile} />;
      case "profile":
        return (
          <ProfileScreen
            profile={profile}
            onUpdateProfile={updateProfile}
            onResetAll={resetProfile}
          />
        );
      default:
        return <DailySparkScreen profile={profile} onNavigate={(tab) => setActiveTab(tab as NavTab)} onStartAssessment={handleStartAssessment} />;
    }
  };

  return (
    <ThemeProvider>
      <AppShell
        profile={profile}
        activeTab={isAssessmentMode ? ("daily" as NavTab) : activeTab} // Keep highlight appropriate
        onTabChange={(tab) => {
          setIsBrainActive(false);
          setIsAssessmentMode(false);
          setActiveTab(tab);
        }}
        isOfflineFallback={isOfflineFallback}
        authError={authError}
        onOpenBrain={() => {
          setIsBrainActive((prev) => {
            const next = !prev;
            if (next) {
              window.history.pushState(null, "", "/admin/brain");
            } else {
              window.history.pushState(null, "", "/");
            }
            return next;
          });
        }}
        isBrainActive={isBrainActive}
      >
        {renderScreen()}
      </AppShell>
    </ThemeProvider>
  );
}

