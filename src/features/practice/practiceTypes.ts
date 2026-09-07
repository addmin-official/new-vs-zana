export type PracticeModuleType = "step_solver" | "interactive_diagram" | "virtual_lab" | "gamified_quiz";

export type SubjectType = "math" | "physics" | "chemistry" | "english" | "biology";

export type GradeLevel = "9" | "10" | "11" | "12";

export type Difficulty = "beginner" | "intermediate" | "advanced";

// --- Step-by-Step Problem Solver ---
export interface StepOption {
  id: string;
  labelKu: string;
  isCorrect: boolean;
  explanationKu: string;
}

export interface ProblemStep {
  stepNumber: number;
  titleKu: string;
  instructionKu: string;
  mathExpression?: string;
  options: StepOption[];
  hintKu: string;
  commonMisconception?: {
    textKu: string;
    correctionKu: string;
  };
}

export interface StepSolverPayload {
  problemStatementKu: string;
  problemContextKu?: string;
  formulaKu?: string;
  steps: ProblemStep[];
  conclusionKu: string;
}

// --- Interactive Diagram ---
export type DiagramKind = "coordinate_plane" | "bohr_atom" | "circuit_diagram";

export interface DiagramParameter {
  id: string;
  nameKu: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unitKu?: string;
}

export interface DiagramChallenge {
  id: string;
  questionKu: string;
  targetCriteriaKu: string;
  hintKu: string;
  successExplanationKu: string;
  checkSolved: (values: Record<string, number>) => boolean;
}

export interface InteractiveDiagramPayload {
  diagramKind: DiagramKind;
  instructionKu: string;
  parameters: DiagramParameter[];
  challenges: DiagramChallenge[];
}

// --- Virtual Lab / Simulation ---
export type LabKind = "ohms_law_circuit" | "acid_base_titration" | "newton_second_law";

export interface LabInquiryTask {
  id: string;
  titleKu: string;
  instructionKu: string;
  inquiryQuestionKu: string;
  options: {
    id: string;
    textKu: string;
    isCorrect: boolean;
    explanationKu: string;
  }[];
  hintKu: string;
  requiredStateCheck?: {
    descriptionKu: string;
    checkFn: (state: Record<string, number>) => boolean;
  };
}

export interface VirtualLabPayload {
  labKind: LabKind;
  objectiveKu: string;
  theoryKu: string;
  defaultControls: Record<string, number>;
  tasks: LabInquiryTask[];
}

// --- Gamified Quiz ---
export interface GamifiedQuestion {
  id: string;
  questionKu: string;
  contextKu?: string;
  options: {
    id: string;
    textKu: string;
    isCorrect: boolean;
    explanationKu: string;
  }[];
  hintKu: string;
  categoryKu: string;
}

export interface GamifiedQuizPayload {
  timeLimitSeconds: number;
  basePointsPerQuestion: number;
  questions: GamifiedQuestion[];
}

// --- Achievement Badges ---
export interface PracticeBadge {
  id: string;
  titleKu: string;
  descriptionKu: string;
  iconName: string;
  category: "math" | "science" | "streak" | "solver" | "lab";
  unlockedAt?: string;
}

// --- General Practice Module Definition ---
export interface PracticeModule {
  id: string;
  titleKu: string;
  subtitleKu: string;
  subject: SubjectType;
  grade: GradeLevel;
  moduleType: PracticeModuleType;
  difficulty: Difficulty;
  estimatedMinutes: number;
  xpReward: number;
  badgeAwardId?: string;
  stepSolverData?: StepSolverPayload;
  diagramData?: InteractiveDiagramPayload;
  virtualLabData?: VirtualLabPayload;
  gamifiedQuizData?: GamifiedQuizPayload;
}

// --- Practice Progress Persistence ---
export interface PracticeProgressState {
  totalXp: number;
  completedModuleIds: string[];
  moduleScores: Record<string, { score: number; maxScore: number; completedAt: string }>;
  unlockedBadgeIds: string[];
  currentStreak: number;
  lastPracticeDate?: string;
}
