/**
 * ZANA Platform - Optimized Firestore Data Models
 * Strict TypeScript schema definitions for optimized document and subcollection structures.
 */

// ============================================================================
// 1. User & Settings: users/{userId}
// ============================================================================

export interface UserProfileData {
  name: string;
  grade: "9" | "10" | "11" | "12" | string;
  stream: "scientific" | "literary" | "general" | string;
  school?: string;
  language?: "ku" | "ar" | "en" | string;
  email?: string;
  avatarUrl?: string;
}

export interface UserSettingsData {
  theme: "light" | "dark" | "system";
  notifications: boolean;
  language: "ku" | "ar" | "en" | string;
  soundEffects?: boolean;
}

export interface UserDocument {
  id?: string;
  profile: UserProfileData;
  settings: UserSettingsData;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// 2. Mastery: users/{userId}/mastery/{subjectId}
// ============================================================================

export interface MasteryRecord {
  conceptId: string;
  masteryScore: number; // 0.0 to 1.0
  status: "NOT_STARTED" | "INTRODUCED" | "DEVELOPING" | "PROFICIENT" | "MASTERED" | "NEEDS_REVIEW" | string;
  consecutiveCorrect: number;
  totalAttempts: number;
  lastAttemptedAt: string | null;
  // SM-2 Spaced repetition fields
  lastReviewedAt?: string | null;
  nextReviewDue?: string | null;
  stabilityFactor?: number; // SM-2 Ease Factor (default 2.5)
  intervalDays?: number;
  repetitionCount?: number;
  // Dynamic Difficulty Index (DDI)
  ddi?: number;
}

export interface SubjectMasteryDoc {
  subjectId: string;
  userId?: string;
  concepts: Record<string, MasteryRecord>;
  lastUpdated: string; // ISO 8601
  overallScore: number; // 0.0 to 1.0 or percentage
  studyStreak: number;
}

// ============================================================================
// 3. Sessions: users/{userId}/sessions/{sessionId}
// ============================================================================

export interface StudySessionDoc {
  id?: string;
  sessionId: string;
  userId: string;
  startTime: string; // ISO 8601
  endTime: string | null; // ISO 8601
  subject: string;
  conceptsCovered: string[];
  questionsAttempted: number;
  correctCount: number;
  timeSpent: number; // Duration in seconds
  abilityEstimate: number; // IRT theta (-3.0 to +3.0)
  createdAt?: string;
}

// ============================================================================
// 4. Study Plan: users/{userId}/studyPlan/{weekId}
// ============================================================================

export interface PlanDayItem {
  id: string;
  subject: string;
  concept: string;
  estimatedMinutes: number;
  type: "review" | "new" | "practice";
  completed?: boolean;
}

export interface StudyPlanDoc {
  weekId: string; // e.g. "2026-W46"
  userId?: string;
  days: {
    [dayOfWeek: string]: PlanDayItem[]; // '0' = Saturday / Sunday up to '6'
  };
  generated: string; // ISO timestamp
  completionRate: number; // 0.0 to 1.0
}

// ============================================================================
// 5. Curriculum: curriculum/{grade}/{subject}/concepts/{conceptId}
// ============================================================================

export interface CurriculumConceptDoc {
  conceptId: string;
  grade: string;
  subject: string;
  content: string;
  difficulty: "foundation" | "easy" | "standard" | "challenging" | "advanced" | "medium" | "hard" | string;
  prerequisites: string[];
  chunkIds: string[];
  bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | string;
  learningObjective: string;
  updatedAt?: string;
}

// ============================================================================
// 6. Assessments: assessments/{assessmentId}
// ============================================================================

export interface AssessmentQuestionItem {
  id: string;
  prompt: string;
  difficulty: string;
  options?: string[];
  correctAnswer?: string;
  cognitiveLevel?: string;
}

export interface AssessmentResponseItem {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  responseTimeMs?: number;
}

export interface AssessmentDoc {
  assessmentId: string;
  studentId: string;
  subjectId: string;
  questions: AssessmentQuestionItem[];
  responses: AssessmentResponseItem[];
  score: number; // 0 to 100
  reliability: "HIGH" | "MEDIUM" | "UNRELIABLE";
  irtProfile: {
    theta: number; // Ability estimate (-3 to +3)
    standardError: number; // Confidence interval
  };
  createdAt: string;
}
