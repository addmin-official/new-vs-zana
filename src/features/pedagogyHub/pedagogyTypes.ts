/**
 * Pedagogical Hub Types
 * Dedicated domain definitions for the 5 innovative pedagogical pillars:
 * 1. Feynman Studio (Explain-to-Learn / Protégé Effect)
 * 2. Metacognitive Error Diagnostics (Exam Post-Mortem & Error Categorization)
 * 3. Spaced-Repetition Leitner Matrix (Ebbinghaus Forgetting Curve Destruction)
 * 4. Socratic Dialectic Arena (Debating misconceptions with evidence)
 * 5. Baccalaureate Soma Stress Simulator (Official SOMI sheet simulator & panic regulator)
 */

export type PedagogicalPillarKey =
  | "feynman"
  | "metacognitive"
  | "leitner"
  | "debate"
  | "soma";

// 1. Feynman Studio Types
export interface FeynmanConcept {
  id: string;
  grade: "9" | "10" | "11" | "12";
  subject: string;
  title: string;
  prompt: string;
  corePrinciples: string[];
  jargonToAvoid: string[];
  expectedEverydayAnalogies: string[];
  sampleTeacherExplanation: string;
}

export interface FeynmanEvaluation {
  score: number; // 0 to 100
  clarityLevel: "elementary" | "good" | "too_academic" | "confusing";
  jargonFound: string[];
  principlesCovered: string[];
  principlesMissing: string[];
  aiStudentResponse: string;
  strengths: string[];
  constructiveTip: string;
}

// 2. Metacognitive Error Types
export type MetacognitiveErrorReason =
  | "CARELESS_MISREADING" // پەلەکردن و نەخوێندنەوەی وشەی کلیدی وەک (جگە لە)
  | "CONCEPTUAL_DEFICIT" // تێنەگەیشتن لە بناغەی یاساکە
  | "CALCULATION_SLIP" // هەڵە لە هەنگاوی بیرکاری یان گۆڕینی یەکە
  | "TIME_PRESSURE_PANIC"; // دڵەڕاوکێی کات و بڕیاردانی پەلە

export interface MetacognitiveQuestion {
  id: string;
  grade: "9" | "10" | "11" | "12";
  subject: string;
  topic: string;
  questionKurdish: string;
  options: { key: string; text: string; isCorrect: boolean; trapType?: MetacognitiveErrorReason }[];
  trapExplanation: string;
  correctExplanation: string;
}

export interface MetacognitiveLog {
  id: string;
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
  diagnosedReason?: MetacognitiveErrorReason;
  studentReflection?: string;
  timestamp: string;
}

// 3. Leitner Matrix Types
export interface LeitnerItem {
  id: string;
  grade: "9" | "10" | "11" | "12";
  subject: string;
  conceptTitle: string;
  box: 1 | 2 | 3 | 4 | 5; // Box 1 = 1 day, Box 2 = 3 days, Box 3 = 7 days, Box 4 = 16 days, Box 5 = 35 days (Permanent)
  lastReviewedDate: string;
  nextReviewDate: string;
  questionPrompt: string;
  correctAnswer: string;
  retrievalSuccessCount: number;
}

// 4. Dialectic Debate Types
export interface DialecticDebateTopic {
  id: string;
  grade: "9" | "10" | "11" | "12";
  subject: string;
  misconceptionClaim: string; // The false popular myth promoted by AI "Devil's Advocate"
  context: string;
  scientificTruth: string;
  curriculumReference: string;
  hints: string[];
}

export interface DialecticDebateMessage {
  id: string;
  sender: "student" | "ai_devil_advocate";
  text: string;
  timestamp: string;
  scientificScore?: number; // 0 to 100
  feedback?: string;
}

// 5. Soma Stress Simulator Types
export interface SomaQuestion {
  number: number;
  questionText: string;
  options: { key: "A" | "B" | "C" | "D"; text: string }[];
  correctKey: "A" | "B" | "C" | "D";
  subject: string;
  difficulty: "normal" | "hard" | "trick";
}

export interface SomaExamSession {
  examTitle: string;
  grade: "12";
  totalDurationSeconds: number;
  timeRemainingSeconds: number;
  markedAnswers: Record<number, "A" | "B" | "C" | "D">;
  flaggedForReview: number[];
  panicTriggersCount: number;
  isSubmitted: boolean;
}
