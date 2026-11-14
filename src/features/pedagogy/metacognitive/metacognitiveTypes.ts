export type CognitiveErrorCategory =
  | "CARELESS_MISREADING"
  | "CONCEPTUAL_DEFICIT"
  | "CALCULATION_SLIP"
  | "TIME_PANIC";

export interface CognitiveErrorOption {
  key: CognitiveErrorCategory;
  titleKu: string;
  descriptionKu: string;
  emoji: string;
  pedagogicalAdviceKu: string;
}

export interface MetacognitiveReflectionRecord {
  id: string;
  timestamp: number;
  problemId: string;
  problemTitle: string;
  subject: string;
  category: CognitiveErrorCategory;
  userSelfNoteKu?: string;
}

export interface ErrorDnaProfile {
  totalReflections: number;
  carelessCount: number;
  conceptualCount: number;
  calculationCount: number;
  timePanicCount: number;
  dominantErrorType: CognitiveErrorCategory | null;
  dominantErrorPercent: number;
  metaAdviceSummaryKu: string;
}
