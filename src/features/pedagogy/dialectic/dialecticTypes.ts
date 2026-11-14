export interface MisconceptionItem {
  id: string;
  title: string;
  subject: 'chemistry' | 'physics' | 'math' | 'biology';
  subjectKurdish: string;
  grade: '9' | '10' | '11' | '12';
  fallacyStatement: string; // The flawed belief to dismantle
  devilsAdvocateArgument: string; // How the opponent argues for the misconception
  scientificTruth: string; // Ground truth in the curriculum
  curriculumEvidenceKeywords: string[]; // Keywords expected in student defense
  commonFallacies: string[]; // Potential traps
  curriculumReference: string; // E.g., 'کیمیای پۆلی ١٢ - بەشی پێنجەم'
}

export interface DialecticEvaluation {
  scientificValidityScore: number; // 0 - 100
  fallacyFreeScore: number; // 0 - 100
  rhetoricalClarityScore: number; // 0 - 100
  overallScore: number; // 0 - 100
  detectedKeywords: string[];
  verdict: 'CONVINCING' | 'PARTIALLY_CONVINCING' | 'UNCONVINCING';
  counterFeedback: string;
  curriculumReference: string;
}

export interface DebateTurn {
  id: string;
  speaker: 'advocate' | 'student';
  text: string;
  timestamp: number;
  evaluation?: DialecticEvaluation;
}

export interface DebateSessionState {
  misconceptionId: string;
  turns: DebateTurn[];
  isCompleted: boolean;
  finalScore?: number;
  verdict?: 'WON' | 'IN_PROGRESS' | 'NEEDS_REVISION';
}
