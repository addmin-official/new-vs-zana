export interface StrugglingConcept {
  conceptId: string;
  titleKu: string;
  subject: string;
  subjectKu: string;
  grade: string;
  avgMastery: number; // 0.0 to 1.0
  strugglingStudentsCount: number;
}

export interface ActiveSubjectMetric {
  subject: string;
  subjectKu: string;
  activeSessions: number;
  percentage: number;
}

export type AnomalyType =
  | "INACTIVITY_7D"
  | "MASTERY_DROP_20"
  | "UNRELIABLE_ASSESSMENT";

export interface AnomalyAlert {
  id: string;
  type: AnomalyType;
  severity: "high" | "critical" | "warning";
  titleKu: string;
  descriptionKu: string;
  studentId: string;
  studentName: string;
  timestamp: string;
  subject?: string;
  dropAmount?: number;
  resolved: boolean;
}

export interface SystemIntelligenceMetrics {
  activeSessions15m: number;
  averageMasteryScore: number;
  totalStudentsMonitored: number;
  totalAssessmentsEvaluated: number;
  strugglingConcepts: StrugglingConcept[];
  activeSubjectsToday: ActiveSubjectMetric[];
  anomalies: AnomalyAlert[];
  dailyActiveUsers30d: { xLabel: string; yValue: number }[];
  subjectMasteryDistribution: {
    label: string;
    values: Record<string, number>;
  }[];
  hourlyWeeklyActivity: {
    dayIndex: number;
    hour: number;
    value: number;
  }[];
}

export interface TeacherAssignment {
  id: string;
  title: string;
  subject: string;
  concepts: string[];
  questionCount: number;
  createdAt: string;
  dueDate: string;
  shareableLink: string;
}

export interface TeacherClassOverview {
  className: string;
  grade: string;
  stream: string;
  totalStudents: number;
  averageMastery: number;
  concepts: { id: string; titleKu: string; subject: string }[];
  students: {
    studentId: string;
    studentName: string;
    email: string;
    averageScore: number;
    scores: Record<string, number>;
    status: "thriving" | "progressing" | "struggling";
  }[];
  conceptGaps: {
    conceptId: string;
    titleKu: string;
    subject: string;
    proficientPercentage: number;
    needsIntervention: boolean;
  }[];
}

export interface ParentPortalSummary {
  childName: string;
  grade: string;
  stream: string;
  weeklyDaysStudied: number;
  weeklyMinutesSpent: number;
  streakDays: number;
  lastActive: string;
  subjectsProgress: {
    subject: string;
    subjectKu: string;
    icon: string;
    progressPercentage: number;
    color: string;
  }[];
  masteredThisWeek: {
    id: string;
    titleKu: string;
    subjectKu: string;
    date: string;
  }[];
  currentlyWorkingOn: {
    id: string;
    titleKu: string;
    subjectKu: string;
    progress: number;
  }[];
}
