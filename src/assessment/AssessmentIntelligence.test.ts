import { test } from "node:test";
import assert from "node:assert";
import {
  QuestionBankProvider,
  AnswerGrader,
  PartialCreditEngine,
  DifficultySelector,
  QuizTerminationPolicy,
  InMemoryAssessmentRecordProvider,
  AssessmentService,
  AssessmentBlueprint,
  AssessmentType,
  QuestionType,
  AnswerSubmission,
  AssessmentStatus,
  QuestionAttempt,
  AssessmentIntelligence,
  CognitiveLevel,
  AssessmentQuestion
} from "./index.ts";
import { InMemoryLearningRecordProvider } from "../learning/providers/LearningRecordProvider.ts";
import { DifficultyLevel } from "../learning/domain/MasteryTypes.ts";

test("Assessment Intelligence - Question Bank and Answer Leak Prevention", () => {
  const provider = QuestionBankProvider.getInstance();
  
  // Verify curated questions exist
  const questions = provider.queryQuestions({ curriculumId: "curriculum-zana-default" });
  assert.ok(questions.length >= 4, "Should have seeded at least 4 math questions");

  // Verify answer strip helper prevents leakages
  const firstQ = questions[0];
  const publicQ = provider.toPublicQuestion(firstQ);

  // Correct answer definitions must not be present in public representation
  const pubRecord = publicQ as unknown as Record<string, unknown>;
  assert.strictEqual(pubRecord.correctAnswer, undefined, "Answer key must be stripped!");
  assert.strictEqual(pubRecord.explanationKu, undefined, "Explanation must be stripped!");
});

test("Assessment Intelligence - Authoritative Server Grading and Misconception Mapping", () => {
  const provider = QuestionBankProvider.getInstance();
  const q4 = provider.getQuestion("q_alg_l2_02"); // Solve 2x - 4 = 10, correct is 7
  assert.ok(q4, "Numeric equation question should exist");

  // Test Correct numeric submission
  const correctSub: AnswerSubmission = {
    questionId: q4.id,
    numericValue: 7,
    responseTimeMs: 3500
  };
  const correctAttempt = AnswerGrader.gradeSubmission(q4, correctSub);
  assert.strictEqual(correctAttempt.isCorrect, true);
  assert.strictEqual(correctAttempt.partialCreditScore, 1.0);
  assert.strictEqual(correctAttempt.misconceptionDetectedId, undefined);

  // Test Incorrect numeric submission triggering sign flip misconception (student answered 3)
  const signFlipSub: AnswerSubmission = {
    questionId: q4.id,
    numericValue: 3,
    responseTimeMs: 8000
  };
  const incorrectAttempt = AnswerGrader.gradeSubmission(q4, signFlipSub);
  assert.strictEqual(incorrectAttempt.isCorrect, false);
  assert.strictEqual(incorrectAttempt.partialCreditScore, 0.0);
  assert.strictEqual(incorrectAttempt.misconceptionDetectedId, "misc_sign_flip");
  assert.ok(incorrectAttempt.feedbackKu.includes("نیشانە") || incorrectAttempt.feedbackKu.includes("هێما"), "Remedial feedback must mention sign adjustments");
});

test("Assessment Intelligence - Partial Credit Math Engine", () => {
  const correctMCDef = {
    multipleOptionIds: ["opt1", "opt2", "opt3"]
  };

  // 1. Correct selection with positive partial points
  const subPartial: AnswerSubmission = {
    questionId: "test_q",
    selectedOptionIds: ["opt1", "opt2"], // missed opt3, but chose correct ones
    responseTimeMs: 2000
  };

  const resPartial = PartialCreditEngine.calculateCredit(
    QuestionType.MULTIPLE_CHOICE_MULTIPLE,
    correctMCDef,
    subPartial
  );
  // Score should be (2 correct - 0 incorrect) / 3 total correct = 0.667
  assert.ok(resPartial.score > 0.6 && resPartial.score < 0.7);

  // 2. Guessing all options (penalized incorrect)
  const subGuessAll: AnswerSubmission = {
    questionId: "test_q",
    selectedOptionIds: ["opt1", "opt2", "opt3", "opt_wrong"], // got all 3 correct but also chose 1 incorrect
    responseTimeMs: 2000
  };

  const resGuess = PartialCreditEngine.calculateCredit(
    QuestionType.MULTIPLE_CHOICE_MULTIPLE,
    correctMCDef,
    subGuessAll
  );
  // Score should be (3 correct - 1 incorrect) / 3 total = 2/3 = 0.667
  assert.ok(resGuess.score > 0.6 && resGuess.score < 0.7);
});

test("Assessment Intelligence - Adaptive Stepping and Early Stopping Pathways", () => {
  // Test starting difficulty
  const startDiff = DifficultySelector.selectInitialDifficulty(0.1);
  assert.strictEqual(startDiff, DifficultyLevel.EASY);

  // Test difficulty adaptation
  const stepUp = DifficultySelector.selectNextDifficulty(DifficultyLevel.STANDARD, true, 1);
  assert.strictEqual(stepUp, DifficultyLevel.CHALLENGING);

  const stepDown = DifficultySelector.selectNextDifficulty(DifficultyLevel.STANDARD, false, 1);
  assert.strictEqual(stepDown, DifficultyLevel.EASY);

  // Test early stopping policy triggers
  const mockAttempts: QuestionAttempt[] = [
    { id: "1", questionId: "q1_standard", isCorrect: true, maxScore: 1.0, partialCreditScore: 1.0, gradedAt: "2026-01-01T00:00:00Z", reasonCodes: [], feedbackKu: "تەواوە", submission: { questionId: "q1_standard", responseTimeMs: 1000 } },
    { id: "2", questionId: "q2_challenging", isCorrect: true, maxScore: 1.0, partialCreditScore: 1.0, gradedAt: "2026-01-01T00:00:00Z", reasonCodes: [], feedbackKu: "تەواوە", submission: { questionId: "q2_challenging", responseTimeMs: 1000 } },
    { id: "3", questionId: "q3_challenging", isCorrect: true, maxScore: 1.0, partialCreditScore: 1.0, gradedAt: "2026-01-01T00:00:00Z", reasonCodes: [], feedbackKu: "تەواوە", submission: { questionId: "q3_challenging", responseTimeMs: 1000 } },
    { id: "4", questionId: "q4_advanced", isCorrect: true, maxScore: 1.0, partialCreditScore: 1.0, gradedAt: "2026-01-01T00:00:00Z", reasonCodes: [], feedbackKu: "تەواوە", submission: { questionId: "q4_advanced", responseTimeMs: 1000 } },
    { id: "5", questionId: "q5_advanced", isCorrect: true, maxScore: 1.0, partialCreditScore: 1.0, gradedAt: "2026-01-01T00:00:00Z", reasonCodes: [], feedbackKu: "تەواوە", submission: { questionId: "q5_advanced", responseTimeMs: 1000 } }
  ];

  const termDecision = QuizTerminationPolicy.shouldTerminate(mockAttempts);
  assert.strictEqual(termDecision.terminate, true, "Should terminate early on high correct streak");
  assert.ok(termDecision.reasonKu.includes("ئاست"), "Reason must suggest mastery confidence");
});

test("Assessment Intelligence - Full End-to-End Orchestrated Integration", async () => {
  const recordProvider = new InMemoryAssessmentRecordProvider();
  const learningProvider = new InMemoryLearningRecordProvider();
  const service = new AssessmentService(recordProvider);

  const blueprint: AssessmentBlueprint = {
    id: "bp_test_mastery_algebra",
    type: AssessmentType.MASTERY_CHECK,
    curriculumId: "curriculum-zana-default",
    grade: "9",
    subjectId: "math",
    unitId: "foundations-of-algebra",
    totalQuestions: 5,
    targetDurationSeconds: 300,
    difficultyDistribution: {
      [DifficultyLevel.FOUNDATION]: 0.1,
      [DifficultyLevel.EASY]: 0.2,
      [DifficultyLevel.STANDARD]: 0.4,
      [DifficultyLevel.CHALLENGING]: 0.2,
      [DifficultyLevel.ADVANCED]: 0.1
    },
    questionTypeDistribution: {
      [QuestionType.MULTIPLE_CHOICE_SINGLE]: 0.8,
      [QuestionType.MULTIPLE_CHOICE_MULTIPLE]: 0.0,
      [QuestionType.TRUE_FALSE]: 0.2,
      [QuestionType.SHORT_ANSWER]: 0.0,
      [QuestionType.NUMERIC]: 0.0,
      [QuestionType.ORDERING]: 0.0,
      [QuestionType.MATCHING]: 0.0
    },
    learningObjectives: ["LOB1"],
    masteryObjectives: ["MOB1"],
    passingThresholdPercentage: 70,
    partialCreditPolicy: "strict",
    retryPolicy: { maxRetries: 3, cooldownSeconds: 0 },
    randomizationRules: { shuffleQuestions: false, shuffleOptions: false }
  };

  // 1. Start the adaptive assessment
  const studentId = "student_zana_01";
  const { attempt, firstQuestion } = await service.startAssessment(
    studentId,
    blueprint,
    "تاقیکردنەوەی لێهاتوویی جەبر",
    "تکایە بە وریاییەوە پرسیارەکان بخوێنەرەوە.",
    0.3 // initial mastery
  );

  assert.ok(attempt.id);
  assert.strictEqual(attempt.status, AssessmentStatus.IN_PROGRESS);
  assert.ok(firstQuestion);

  // 2. Authoritative Submit and check automatic Phase 15 student mastery updates
  const submission: AnswerSubmission = {
    questionId: firstQuestion.id,
    selectedOptionIds: ["opt_b"], // Submit opt_b (correct answer) for MCQ Single variables translation
    responseTimeMs: 4000
  };

  const stepResult = await service.submitAnswer(
    attempt.id,
    firstQuestion.id,
    submission,
    learningProvider,
    blueprint
  );

  assert.ok(stepResult.gradedAttempt);
  assert.strictEqual(stepResult.gradedAttempt.questionId, firstQuestion.id);

  // Inspect that StudentMasteryProfile was automatically updated in Phase 15 learning provider!
  const profile = await learningProvider.getStudentMasteryProfile(studentId);
  const activeConceptId = firstQuestion.conceptId || "unknown";
  const masteryState = profile.conceptMasteries[activeConceptId]; // first question concept
  assert.ok(masteryState, "Mastery state must be seeded under learning record provider");
  assert.strictEqual(masteryState.totalAttempts, 1);
  assert.ok(masteryState.masteryScore > 0, "Mastery score must be calculated");
});

test("Assessment Intelligence - IRT 3PL Model: Probability and Fisher Information", () => {
  // Test 1: Probability at theta == b is c + (1 - c) / 2
  const a = 1.5;
  const b = 0.0;
  const c = 0.20;
  const pAtB = AssessmentIntelligence.calculate3PLProbability(0.0, a, b, c);
  // Expected: 0.20 + 0.80 / 2 = 0.60
  assert.ok(Math.abs(pAtB - 0.60) < 0.01, `P(b) should be 0.60, got ${pAtB}`);

  // Test 2: Monotonicity
  const pLow = AssessmentIntelligence.calculate3PLProbability(-2.0, a, b, c);
  const pHigh = AssessmentIntelligence.calculate3PLProbability(2.0, a, b, c);
  assert.ok(pLow >= c, "pLow should be >= guessing rate c");
  assert.ok(pHigh > pAtB, "pHigh should exceed pAtB");
  assert.ok(pAtB > pLow, "pAtB should exceed pLow");

  // Test 3: Fisher Information calculation
  const infoAtB = AssessmentIntelligence.calculateItemInformation(0.0, a, b, c);
  const infoFar = AssessmentIntelligence.calculateItemInformation(3.0, a, b, c);
  assert.ok(infoAtB > 0, "Information at ability matching difficulty must be positive");
  assert.ok(infoAtB > infoFar, "Information should be significantly higher near difficulty than at extreme ability");
});

test("Assessment Intelligence - IRT 3PL Model: Ability Estimation (MLE / MAP)", () => {
  // 1. Consistent correct responses on difficult items -> theta should rise
  const highAbilityResponses = [
    { isCorrect: true, a: 1.2, b: 0.0, c: 0.25 },
    { isCorrect: true, a: 1.5, b: 1.0, c: 0.25 },
    { isCorrect: true, a: 1.8, b: 1.5, c: 0.25 }
  ];
  const highEstimate = AssessmentIntelligence.estimateThetaMLE(highAbilityResponses, 0.0);
  assert.ok(highEstimate.theta > 0.8, `Theta should rise above 0.8 on correct hard items, got ${highEstimate.theta}`);
  assert.ok(highEstimate.standardError < 1.0, "Standard error should decrease below initial prior");

  // 2. Consistent incorrect responses on easy items -> theta should drop
  const lowAbilityResponses = [
    { isCorrect: false, a: 1.2, b: -1.0, c: 0.25 },
    { isCorrect: false, a: 1.5, b: 0.0, c: 0.25 },
    { isCorrect: false, a: 1.0, b: -1.5, c: 0.25 }
  ];
  const lowEstimate = AssessmentIntelligence.estimateThetaMLE(lowAbilityResponses, 0.0);
  assert.ok(lowEstimate.theta < -0.8, `Theta should drop below -0.8 on incorrect easy items, got ${lowEstimate.theta}`);
});

test("Assessment Intelligence - CAT Engine: Question Selection and Exposure Control", () => {
  const qEasy: AssessmentQuestion = {
    id: "cat_q_easy",
    source: "ZANA_ORIGINAL" as any,
    curriculumId: "curr_1",
    difficulty: DifficultyLevel.EASY,
    type: QuestionType.MULTIPLE_CHOICE_SINGLE,
    promptKu: "پرسیاری ئاسان",
    explanationKu: "ڕوونکردنەوە",
    estimatedDurationSeconds: 45,
    version: 1,
    createdAt: "",
    updatedAt: "",
    irt: { discrimination: 1.2, difficulty: -1.5, guessing: 0.25 }
  };

  const qHard: AssessmentQuestion = {
    id: "cat_q_hard",
    source: "ZANA_ORIGINAL" as any,
    curriculumId: "curr_1",
    difficulty: DifficultyLevel.ADVANCED,
    type: QuestionType.MULTIPLE_CHOICE_SINGLE,
    promptKu: "پرسیاری ئاڵۆز",
    explanationKu: "ڕوونکردنەوە",
    estimatedDurationSeconds: 75,
    version: 1,
    createdAt: "",
    updatedAt: "",
    irt: { discrimination: 1.6, difficulty: 1.8, guessing: 0.25 }
  };

  const pool = [qEasy, qHard];
  const used = new Set<string>();

  // A high ability student (theta = 1.7) should be given qHard
  const chosenHigh = AssessmentIntelligence.selectNextQuestionCAT(pool, used, 1.7);
  assert.strictEqual(chosenHigh?.id, "cat_q_hard", "CAT should select maximum information question for theta = 1.7");

  // A low ability student (theta = -1.5) should be given qEasy
  const chosenLow = AssessmentIntelligence.selectNextQuestionCAT(pool, used, -1.5);
  assert.strictEqual(chosenLow?.id, "cat_q_easy", "CAT should select maximum information question for theta = -1.5");

  // Exposure control ceiling test: if qHard was over-exposed (> 30% out of 20 administrations)
  const exposureCounts = { cat_q_hard: 10, cat_q_easy: 2 }; // qHard is at 50% exposure
  const chosenWithControl = AssessmentIntelligence.selectNextQuestionCAT(pool, used, 1.7, exposureCounts, 20);
  assert.strictEqual(chosenWithControl?.id, "cat_q_easy", "Over-exposed question must be skipped by exposure control");
});

test("Assessment Intelligence - CAT Stopping Rules", () => {
  // Rule 1: Confident SE stop (SE < 0.3 after >= 5 questions)
  const ruleConfident = AssessmentIntelligence.evaluateCATStoppingRules(6, 0.25, false);
  assert.strictEqual(ruleConfident.shouldStop, true);
  assert.strictEqual(ruleConfident.code, "CONFIDENT_ESTIMATE");

  // Rule 2: Max 20 questions reached
  const ruleMax = AssessmentIntelligence.evaluateCATStoppingRules(20, 0.45, false);
  assert.strictEqual(ruleMax.shouldStop, true);
  assert.strictEqual(ruleMax.code, "MAX_QUESTIONS_REACHED");

  // Rule 3: Question bank exhausted
  const ruleBankExhausted = AssessmentIntelligence.evaluateCATStoppingRules(4, 0.55, true);
  assert.strictEqual(ruleBankExhausted.shouldStop, true);
  assert.strictEqual(ruleBankExhausted.code, "BANK_EXHAUSTED");

  // Continue when not met
  const ruleContinue = AssessmentIntelligence.evaluateCATStoppingRules(4, 0.38, false);
  assert.strictEqual(ruleContinue.shouldStop, false);
});

test("Assessment Intelligence - Diagnostic Assessment & Bloom's Taxonomy Profiling", () => {
  const provider = QuestionBankProvider.getInstance();
  const qAlg = provider.getQuestion("q_alg_l1_01")!;
  const qEq = provider.getQuestion("q_alg_l2_01")!;

  const cognitiveAttempts = [
    { question: { ...qAlg, cognitiveLevel: CognitiveLevel.RECALL }, isCorrect: true },
    { question: { ...qAlg, cognitiveLevel: CognitiveLevel.RECALL }, isCorrect: true },
    { question: { ...qEq, cognitiveLevel: CognitiveLevel.ANALYSIS }, isCorrect: false },
    { question: { ...qEq, cognitiveLevel: CognitiveLevel.ANALYSIS }, isCorrect: false }
  ];

  const profile = AssessmentIntelligence.generateCognitiveProfile(cognitiveAttempts);
  assert.ok(profile.strongLevels.includes(CognitiveLevel.RECALL), "RECALL should be detected as strong (100%)");
  assert.ok(profile.weakLevels.includes(CognitiveLevel.ANALYSIS), "ANALYSIS should be detected as weak (0%)");
  assert.ok(profile.recommendedFocus.length > 0, "Recommended focus string must be generated in Kurdish");
  assert.ok(profile.recommendedFocus.includes("شیکردنەوەی") || profile.recommendedFocus.includes("هۆکار"), "Focus should target weak Bloom level");
});

test("Assessment Intelligence - Anti-Guessing Detection Flags Unreliable Sessions", () => {
  const provider = QuestionBankProvider.getInstance();
  const qEasy = provider.getQuestion("q_alg_l1_01")!;
  const qHard = provider.getQuestion("q_alg_l2_02")!;

  // Scenario 1: Inverted Difficulty (0% on easy, 100% on hard)
  const invertedAttempts = [
    { question: { ...qEasy, difficulty: DifficultyLevel.EASY }, submission: { questionId: qEasy.id, responseTimeMs: 15000 }, isCorrect: false },
    { question: { ...qEasy, difficulty: DifficultyLevel.EASY }, submission: { questionId: qEasy.id, responseTimeMs: 15000 }, isCorrect: false },
    { question: { ...qHard, difficulty: DifficultyLevel.ADVANCED }, submission: { questionId: qHard.id, responseTimeMs: 25000 }, isCorrect: true },
    { question: { ...qHard, difficulty: DifficultyLevel.ADVANCED }, submission: { questionId: qHard.id, responseTimeMs: 25000 }, isCorrect: true }
  ];

  const verdictInverted = AssessmentIntelligence.detectAntiGuessing(invertedAttempts, 80, 180);
  assert.strictEqual(verdictInverted.isUnreliable, true, "Inverted accuracy must be flagged as unreliable");
  assert.strictEqual(verdictInverted.flags.invertedDifficultyAccuracy, true);

  // Scenario 2: Rapid Clicking (< 3s on >= 60s questions)
  const rapidAttempts = [
    { question: { ...qHard, estimatedDurationSeconds: 90 }, submission: { questionId: qHard.id, responseTimeMs: 1200 }, isCorrect: true },
    { question: { ...qHard, estimatedDurationSeconds: 90 }, submission: { questionId: qHard.id, responseTimeMs: 1500 }, isCorrect: true }
  ];
  const verdictRapid = AssessmentIntelligence.detectAntiGuessing(rapidAttempts, 3, 180);
  assert.strictEqual(verdictRapid.isUnreliable, true, "Rapid response clicking must be flagged as unreliable");
  assert.strictEqual(verdictRapid.flags.rapidResponseTime, true);
});

test("Assessment Intelligence - Post-Assessment 3-Point Kurdish Feedback & Finish Flow", async () => {
  const recordProvider = new InMemoryAssessmentRecordProvider();
  const learningProvider = new InMemoryLearningRecordProvider();
  const service = new AssessmentService(recordProvider);

  const blueprint: AssessmentBlueprint = {
    id: "bp_test_feedback_3point",
    type: AssessmentType.DIAGNOSTIC,
    curriculumId: "curriculum-zana-default",
    grade: "9",
    subjectId: "math",
    unitId: "foundations-of-algebra",
    totalQuestions: 2,
    targetDurationSeconds: 120,
    difficultyDistribution: {
      [DifficultyLevel.FOUNDATION]: 0.0,
      [DifficultyLevel.EASY]: 0.5,
      [DifficultyLevel.STANDARD]: 0.5,
      [DifficultyLevel.CHALLENGING]: 0.0,
      [DifficultyLevel.ADVANCED]: 0.0
    },
    questionTypeDistribution: {
      [QuestionType.MULTIPLE_CHOICE_SINGLE]: 1.0,
      [QuestionType.MULTIPLE_CHOICE_MULTIPLE]: 0.0,
      [QuestionType.TRUE_FALSE]: 0.0,
      [QuestionType.SHORT_ANSWER]: 0.0,
      [QuestionType.NUMERIC]: 0.0,
      [QuestionType.ORDERING]: 0.0,
      [QuestionType.MATCHING]: 0.0
    },
    learningObjectives: ["LOB1"],
    masteryObjectives: ["MOB1"],
    passingThresholdPercentage: 60,
    partialCreditPolicy: "strict",
    retryPolicy: { maxRetries: 3, cooldownSeconds: 0 },
    randomizationRules: { shuffleQuestions: false, shuffleOptions: false }
  };

  const studentId = "student_feedback_test";
  const { attempt, firstQuestion } = await service.startAssessment(
    studentId,
    blueprint,
    "تاقیکردنەوەی دەستنیشانکردنی ئاست",
    "تکایە وەڵام بدەرەوە",
    0.2
  );

  // Submit answer for Q1
  await service.submitAnswer(
    attempt.id,
    firstQuestion!.id,
    { questionId: firstQuestion!.id, selectedOptionIds: ["opt_b"], responseTimeMs: 5000 },
    learningProvider,
    blueprint
  );

  // Finalize assessment
  const result = await service.finishAssessment(attempt.id, learningProvider, blueprint);

  // Verify enriched IRT & CAT results
  assert.ok(result.irtTheta !== undefined, "irtTheta must be populated");
  assert.ok(result.irtStandardError !== undefined, "irtStandardError must be populated");
  assert.ok(result.cognitiveProfile, "cognitiveProfile must be populated");
  assert.ok(result.antiGuessingVerdict, "antiGuessingVerdict must be populated");
  assert.strictEqual(result.antiGuessingVerdict.isUnreliable, false);

  // Verify 3-point summary
  assert.ok(result.feedbackSummary, "feedbackSummary must be generated");
  assert.ok(Array.isArray(result.feedbackSummary.masteredConcepts));
  assert.ok(Array.isArray(result.feedbackSummary.reviewConcepts));
  assert.ok(result.feedbackSummary.recommendedNextSessionPlanKu.includes("١."), "Roadmap must contain numbered action items");
});
