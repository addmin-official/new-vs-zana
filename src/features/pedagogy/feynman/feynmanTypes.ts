export interface FeynmanConceptPrompt {
  id: string;
  grade: "9" | "10" | "11" | "12";
  subject: "chemistry" | "physics" | "math" | "biology" | "english" | "kurdish" | "arabic" | "sports" | "history" | "economy" | "geography";
  titleKu: string;
  chapterKu: string;
  standardDefinitionKu: string;
  coreMechanismKu: string; // The "why" behind it
  commonJargonList: string[]; // Jargon words to detect if student is just memorizing
  analogyExamplesKu: string[]; // Plain real-world analogies
  guidingQuestionsFromProtege: string[];
}

export interface JargonDetectionResult {
  detectedJargon: string[];
  jargonRatio: number; // 0 to 1 (high means student is just using textbook keywords without explaining)
  clarityAssessmentKu: string;
}

export interface ConceptualClarityScore {
  scorePercent: number; // 0 - 100
  clarityLevelKu: "سەرەتایی و لەبەرکراو" | "مامناوەند بە ڕوونکردنەوەی بەشەکی" | "قووڵ و چەمکساز (ئاستی فاینمان)";
  logicalGapsIdentified: string[];
  strengthsKu: string[];
  nextQuestionFromProtégéKu: string;
}

export interface FeynmanDialogueMessage {
  id: string;
  sender: "student" | "protege";
  text: string;
  timestamp: number;
  critiqueBadge?: string;
}
