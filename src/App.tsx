import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
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
import { LoginScreen } from "./screens/LoginScreen.tsx";
import { RegisterScreen } from "./screens/RegisterScreen.tsx";
import { ForgotPasswordScreen } from "./screens/ForgotPasswordScreen.tsx";
import { LoadingScreen } from "./screens/LoadingScreen.tsx";
import { useStudentProfile } from "./features/student/useStudentProfile.ts";
import { SubjectKey } from "./features/student/studentTypes.ts";
import { NavTab } from "./components/BottomNavigation.tsx";
import { getFirebaseAuth, isFirebaseConfigured } from "./services/firebase.ts";
import { getCurrentUser } from "./services/authService.ts";

export default function App() {
 const { profile, updateProfile, completeOnboarding, resetProfile, isOfflineFallback, authError } = useStudentProfile();

 // Authentication State
 const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
 const [authLoading, setAuthLoading] = useState<boolean>(() => {
 if (!isFirebaseConfigured()) return false;
 const auth = getFirebaseAuth();
 if (!auth) return false;
 return auth.currentUser === null;
 });
 const [authScreen, setAuthScreen] = useState<"login" | "register" | "forgot-password">(() => {
 if (typeof window !== "undefined") {
 if (window.location.pathname === "/register") return "register";
 if (window.location.pathname === "/forgot-password") return "forgot-password";
 }
 return "login";
 });

 // Manage active tab, plus optional "assessment" and "brain" modes
 const [activeTab, setActiveTab] = useState<NavTab>("daily");
 const [isAssessmentMode, setIsAssessmentMode] = useState(false);
 const [isBrainActive, setIsBrainActive] = useState(() => {
 if (typeof window !== "undefined") {
 return window.location.pathname.startsWith("/admin/brain");
 }
 return false;
 });

 // Firebase Auth State Listener
 useEffect(() => {
 const auth = getFirebaseAuth();
 if (!auth) {
 return;
 }

 const unsub = onAuthStateChanged(auth, (u) => {
 setCurrentUser(u);
 setAuthLoading(false);
 });

 return () => unsub();
 }, []);

 // Listen to popstate for browser history navigation
 useEffect(() => {
 const handlePopState = () => {
 if (typeof window !== "undefined") {
 const path = window.location.pathname;
 setIsBrainActive(path.startsWith("/admin/brain"));
 if (path === "/register") setAuthScreen("register");
 else if (path === "/forgot-password") setAuthScreen("forgot-password");
 else if (path === "/login") setAuthScreen("login");
 }
 };
 window.addEventListener("popstate", handlePopState);
 return () => window.removeEventListener("popstate", handlePopState);
 }, []);

 // Clean URL when logged in from auth routes
 useEffect(() => {
 if (currentUser && typeof window !== "undefined") {
 const path = window.location.pathname;
 if (path === "/login" || path === "/register" || path === "/forgot-password") {
 window.history.replaceState(null, "", "/");
 }
 }
 }, [currentUser]);

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

 const navigateAuth = (screen: "login" | "register" | "forgot-password") => {
 setAuthScreen(screen);
 if (typeof window !== "undefined") {
 const path = screen === "login" ? "/" : `/${screen}`;
 window.history.pushState(null, "", path);
 }
 };

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

 // 1. Initial Authentication Loading State
 if (authLoading) {
 return (
 <LoadingScreen message="چاوەڕوان بە... بارکردنی پلاتفۆڕمی زانا" />
 );
 }

 // 2. Unauthenticated User Flows (Login, Register, Forgot Password)
 // If Firebase is configured and user is not signed in
 if (isFirebaseConfigured() && !currentUser) {
 if (authScreen === "register") {
 return (
 <RegisterScreen
 onNavigateToLogin={() => navigateAuth("login")}
 onRegisterSuccess={(regData) => {
 completeOnboarding(
 regData.name,
 regData.grade,
 regData.subject,
 "intermediate",
 regData.stream
 );
 }}
 />
 );
 }

 if (authScreen === "forgot-password") {
 return (
 <ForgotPasswordScreen
 onNavigateToLogin={() => navigateAuth("login")}
 />
 );
 }

 return (
 <LoginScreen
 onNavigateToRegister={() => navigateAuth("register")}
 onNavigateToForgotPassword={() => navigateAuth("forgot-password")}
 onLoginSuccess={() => {
 if (isBrainActive && typeof window !== "undefined") {
 window.history.replaceState(null, "", "/admin/brain");
 }
 }}
 />
 );
 }

 // 3. Admin Route Direct Access (if admin is authenticated)
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

 // 4. Authenticated Student Onboarding Flow
 if (!profile.onboardingCompleted) {
 return (
 <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 transition-colors">
 <OnboardingScreen onComplete={completeOnboarding} />
 </div>
 );
 }

 // 5. Main App Screens
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
 return <DailySparkScreen profile={profile} onNavigate={(tab) => setActiveTab(tab as NavTab)} onStartAssessment={handleStartAssessment} />;
 case "rooms":
 return <StudyRoomScreen profile={profile} />;
 case "practice":
 return <PracticeScreen profile={profile} />;
 case "plan":
 return <StudentStudyPathDashboard studentId={profile.id} onNavigateToTask={() => setActiveTab("practice")} />;
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
 );
}
