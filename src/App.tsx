import { useState } from "react";
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
import { useStudentProfile } from "./features/student/useStudentProfile.ts";
import { SubjectKey } from "./features/student/studentTypes.ts";
import { NavTab } from "./components/BottomNavigation.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";

export default function App() {
  const { profile, updateProfile, completeOnboarding, resetProfile, isOfflineFallback, authError } = useStudentProfile();
  
  // Manage active tab, plus optional "assessment" mode
  const [activeTab, setActiveTab] = useState<NavTab>("daily");
  const [isAssessmentMode, setIsAssessmentMode] = useState(false);

  const handleSelectSubject = (subjectId: SubjectKey) => {
    updateProfile({ activeSubject: subjectId });
  };

  const handleStartAssessment = () => {
    setIsAssessmentMode(true);
  };

  const handleFinishAssessment = () => {
    setIsAssessmentMode(false);
    setActiveTab("daily");
  };

  // If student has not gone through onboarding
  if (!profile.onboardingCompleted) {
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
          setIsAssessmentMode(false);
          setActiveTab(tab);
        }}
        isOfflineFallback={isOfflineFallback}
        authError={authError}
      >
        {renderScreen()}
      </AppShell>
    </ThemeProvider>
  );
}

