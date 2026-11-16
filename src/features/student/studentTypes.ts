export type StudentGrade = "9" | "10" | "11" | "12";

export type AcademicStream = "scientific" | "literary" | "general";

export type SubjectKey = "math" | "physics" | "chemistry" | "english" | "biology" | "kurdish" | "arabic" | "sports" | "history" | "economy" | "geography";

export type StudentLevel = "beginner" | "intermediate" | "advanced";

export interface StudentProfile {
  id: string;
  name: string;
  grade: StudentGrade;
  stream: AcademicStream;
  activeSubject: SubjectKey;
  level: StudentLevel;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  authoritative: boolean;
  source: "guest-local" | "server-authoritative";
  isStale?: boolean;
  school?: string;
  email?: string | null;
  preferredLanguage?: string;
  xp?: number;
  streakDays?: number;
  lastActiveDate?: string;
  masteryBySubject?: Record<string, unknown>;
  // Progress & Gamification fields (synced with Firestore)
  totalScore?: number;
  streak?: number;
  todayStudyMinutes?: number;
  completedLessons?: number;
  completionPercentage?: number;
  unlockedBadgeIds?: string[];
  completedModuleIds?: string[];
  lastStudyDate?: string;
}

export interface StudentProgressData {
  totalScore: number;
  streak: number;
  todayStudyMinutes: number;
  completedLessons: number;
  completionPercentage: number;
  unlockedBadgeIds?: string[];
  completedModuleIds?: string[];
  lastStudyDate?: string;
  updatedAt?: string;
}

export interface StudentProfileDraft {
  name: string;
  grade: StudentGrade;
  stream: AcademicStream;
  activeSubject: SubjectKey;
  level: StudentLevel;
  school?: string;
  email?: string | null;
}

export interface VerifiedIdentity {
  verifiedUid: string;
  isAnonymous: false;
  email?: string | null;
}

