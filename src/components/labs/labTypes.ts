export type SimulationState = "SETUP" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED";

export interface SimulationVariable {
  name: string;
  nameKu: string;
  unit: string;
  range: [number, number];
  default: number;
  step?: number;
}

export interface SimulationConfig {
  labId: string;
  subject: string;
  grade: string;
  titleKu: string;
  descriptionKu: string;
  objectiveKu: string;
  variables: SimulationVariable[];
  expectedOutcome: number;
  toleranceRange: number;
  maxAttempts: number;
  unitKu?: string;
  outcomeNameKu?: string;
  guideStepsKu: { titleKu: string; instructionKu: string }[];
}

export interface ExperimentLogEntry {
  id: string;
  timestamp: string;
  variable: string;
  variableNameKu: string;
  oldValue: number;
  newValue: number;
  unit: string;
  observedEffect: string;
}

export interface LabReportTemplate {
  reportId: string;
  labId: string;
  subject: string;
  grade: string;
  studentName: string;
  date: string;
  status: SimulationState;
  hypothesis: string;
  variables: { name: string; unit: string; initialValue: number; finalValue: number }[];
  observations: string[];
  logs: ExperimentLogEntry[];
  studentResult: number;
  expectedOutcome: number;
  toleranceRange: number;
  isOutcomeValid: boolean;
  conclusion: string;
}

export type PartnerRole = "controller" | "observer" | "reporter";

export interface PartnerSessionState {
  isPartnerMode: boolean;
  activeRole: PartnerRole;
  studentAName: string;
  studentBName: string;
  observerNotes: string[];
}
