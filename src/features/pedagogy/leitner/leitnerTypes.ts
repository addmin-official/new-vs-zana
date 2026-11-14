export type LeitnerBoxNumber = 1 | 2 | 3 | 4 | 5;

export interface LeitnerFlashCard {
  id: string;
  grade: "9" | "10" | "11" | "12";
  subject: "chemistry" | "physics" | "math" | "biology" | "english" | "kurdish" | "arabic" | "sports" | "history" | "economy" | "geography";
  topicKu: string;
  questionKu: string;
  optionsKu?: string[];
  correctAnswer: string;
  explanationKu: string;
  box: LeitnerBoxNumber;
  lastReviewedAt: number; // timestamp
  stabilityDays: number;
}

export interface LeitnerQueueSummary {
  dueCardsCount: number;
  boxCounts: Record<LeitnerBoxNumber, number>;
  averageRetentionRate: number; // 0 - 100%
  consolidatedLongTermCount: number;
}
