export type SomaChoice = 'A' | 'B' | 'C' | 'D' | null;

export interface SomaQuestion {
  questionNumber: number;
  selectedChoice: SomaChoice;
  isFlaggedForReview: boolean;
  timeSpentSeconds: number;
}

export interface SomaExamSession {
  examTitle: string;
  subject: string;
  totalQuestions: number;
  bookletCode: 'A' | 'B' | 'C' | 'D';
  seatNumber: string;
  durationMinutes: number;
  timeRemainingSeconds: number;
  isCompleted: boolean;
  questions: SomaQuestion[];
}

export interface SomaExamAnalysis {
  totalAnswered: number;
  totalFlagged: number;
  totalBlank: number;
  averageTimePerQuestionSeconds: number;
  slowestQuestions: number[];
  timeEfficiencyScore: number; // 0 - 100
  pedagogicalAdvice: string;
}
