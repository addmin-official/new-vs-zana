import { describe, it, expect } from "vitest";
import { AssessmentIntelligence } from "../../assessment/AssessmentIntelligence.ts";
import {
  AssessmentQuestion,
  CognitiveLevel,
  QuestionType,
  QuestionSource,
} from "../../assessment/domain/AssessmentTypes.ts";
import { DifficultyLevel } from "../../learning/domain/MasteryTypes.ts";

describe("Comprehensive AssessmentIntelligence Unit Tests", () => {
  const sampleQuestion: AssessmentQuestion = {
    id: "q_sample_01",
    curriculumId: "curr_chem_12",
    source: QuestionSource.ZANA_ORIGINAL,
    difficulty: DifficultyLevel.STANDARD,
    type: QuestionType.MULTIPLE_CHOICE_SINGLE,
    promptKu: "بەهای pH بۆ گیراوەی ترش چۆن دیاری دەکرێت؟",
    options: [
      { id: "opt_0", textKu: "کەمتر لە ٧" },
      { id: "opt_1", textKu: "یەکسان بە ٧" },
      { id: "opt_2", textKu: "زیاتر لە ٧" },
      { id: "opt_3", textKu: "هیچکام" },
    ],
    explanationKu: "ترشەکان بەهای pH یان کەمترە لە ٧",
    estimatedDurationSeconds: 60,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    conceptId: "acid_base_ph",
    irt: {
      discrimination: 1.5,
      difficulty: 0.2,
      guessing: 0.25,
    },
  };

  it("1. deriveCognitiveLevel: correctly maps question difficulty to Bloom taxonomy levels", () => {
    expect(
      AssessmentIntelligence.deriveCognitiveLevel({
        ...sampleQuestion,
        difficulty: DifficultyLevel.FOUNDATION,
      })
    ).toBe(CognitiveLevel.RECALL);

    expect(
      AssessmentIntelligence.deriveCognitiveLevel({
        ...sampleQuestion,
        difficulty: DifficultyLevel.EASY,
      })
    ).toBe(CognitiveLevel.COMPREHENSION);

    expect(
      AssessmentIntelligence.deriveCognitiveLevel({
        ...sampleQuestion,
        difficulty: DifficultyLevel.STANDARD,
      })
    ).toBe(CognitiveLevel.APPLICATION);

    expect(
      AssessmentIntelligence.deriveCognitiveLevel({
        ...sampleQuestion,
        difficulty: DifficultyLevel.CHALLENGING,
      })
    ).toBe(CognitiveLevel.ANALYSIS);

    expect(
      AssessmentIntelligence.deriveCognitiveLevel({
        ...sampleQuestion,
        difficulty: DifficultyLevel.ADVANCED,
      })
    ).toBe(CognitiveLevel.EVALUATION);

    // Explicit cognitive level takes precedence
    expect(
      AssessmentIntelligence.deriveCognitiveLevel({
        ...sampleQuestion,
        cognitiveLevel: CognitiveLevel.SYNTHESIS,
      })
    ).toBe(CognitiveLevel.SYNTHESIS);
  });

  it("2. generateCognitiveProfile: aggregates mastery breakdown across Bloom levels with Kurdish guidance", () => {
    const attempts = [
      {
        question: {
          ...sampleQuestion,
          cognitiveLevel: CognitiveLevel.RECALL,
        },
        isCorrect: true,
      },
      {
        question: {
          ...sampleQuestion,
          cognitiveLevel: CognitiveLevel.APPLICATION,
        },
        isCorrect: false,
      },
      {
        question: {
          ...sampleQuestion,
          cognitiveLevel: CognitiveLevel.APPLICATION,
        },
        isCorrect: false,
      },
    ];

    const profile = AssessmentIntelligence.generateCognitiveProfile(attempts);
    expect(profile.levelBreakdown[CognitiveLevel.RECALL].percentage).toBe(100);
    expect(profile.levelBreakdown[CognitiveLevel.APPLICATION].percentage).toBe(0);
    expect(profile.strongLevels).toContain(CognitiveLevel.RECALL);
    expect(profile.weakLevels).toContain(CognitiveLevel.APPLICATION);
    expect(profile.recommendedFocus).toContain("هاوکێشە");
  });

  it("3. detectAntiGuessing: flags inverted difficulty accuracy anomaly", () => {
    const easyQ: AssessmentQuestion = {
      ...sampleQuestion,
      difficulty: DifficultyLevel.EASY,
      estimatedDurationSeconds: 40,
    };
    const hardQ: AssessmentQuestion = {
      ...sampleQuestion,
      difficulty: DifficultyLevel.CHALLENGING,
      estimatedDurationSeconds: 90,
    };

    // 2 easy wrong (0% acc), 2 hard correct (100% acc)
    const attempts = [
      { question: easyQ, submission: { questionId: easyQ.id, selectedOptionId: "opt_1", responseTimeMs: 30000, isDoubtful: false }, isCorrect: false },
      { question: easyQ, submission: { questionId: easyQ.id, selectedOptionId: "opt_2", responseTimeMs: 25000, isDoubtful: false }, isCorrect: false },
      { question: hardQ, submission: { questionId: hardQ.id, selectedOptionId: "opt_0", responseTimeMs: 40000, isDoubtful: false }, isCorrect: true },
      { question: hardQ, submission: { questionId: hardQ.id, selectedOptionId: "opt_0", responseTimeMs: 45000, isDoubtful: false }, isCorrect: true },
    ];

    const verdict = AssessmentIntelligence.detectAntiGuessing(attempts, 140, 150);
    expect(verdict.isSuspicious).toBe(true);
    expect(verdict.isUnreliable).toBe(true);
    expect(verdict.flags.invertedDifficultyAccuracy).toBe(true);
  });

  it("4. detectAntiGuessing: flags rapid guessing (< 3000ms on complex questions)", () => {
    const complexQ: AssessmentQuestion = {
      ...sampleQuestion,
      difficulty: DifficultyLevel.ADVANCED,
      estimatedDurationSeconds: 75,
    };

    const attempts = [
      { question: complexQ, submission: { questionId: complexQ.id, selectedOptionId: "opt_0", responseTimeMs: 1200, isDoubtful: false }, isCorrect: true },
      { question: complexQ, submission: { questionId: complexQ.id, selectedOptionId: "opt_0", responseTimeMs: 1400, isDoubtful: false }, isCorrect: true },
    ];

    const verdict = AssessmentIntelligence.detectAntiGuessing(attempts, 5, 150);
    expect(verdict.isSuspicious).toBe(true);
    expect(verdict.flags.rapidResponseTime).toBe(true);
  });

  it("5. detectAntiGuessing: confirms consistent effort when timing and responses are normal", () => {
    const attempts = [
      { question: sampleQuestion, submission: { questionId: sampleQuestion.id, selectedOptionId: "opt_0", responseTimeMs: 35000, isDoubtful: false }, isCorrect: true },
      { question: sampleQuestion, submission: { questionId: sampleQuestion.id, selectedOptionId: "opt_1", responseTimeMs: 40000, isDoubtful: false }, isCorrect: false },
    ];

    const verdict = AssessmentIntelligence.detectAntiGuessing(attempts, 75, 120);
    expect(verdict.isSuspicious).toBe(false);
    expect(verdict.isUnreliable).toBe(false);
  });

  it("5b. detectAntiGuessing: flags unrealistic score and speed (>=90% score in <20% time with 5+ questions)", () => {
    const attempts = Array.from({ length: 5 }, (_, i) => ({
      question: { ...sampleQuestion, id: `q_speed_${i}`, difficulty: DifficultyLevel.STANDARD, estimatedDurationSeconds: 60 },
      submission: { questionId: `q_speed_${i}`, selectedOptionId: "opt_0", responseTimeMs: 3500, isDoubtful: false },
      isCorrect: true,
    }));

    // totalDuration 15s out of 300s target (timeRatio = 0.05 < 0.20)
    const verdict = AssessmentIntelligence.detectAntiGuessing(attempts, 15, 300);
    expect(verdict.isSuspicious).toBe(true);
    expect(verdict.flags.unrealisticScoreSpeed).toBe(true);
  });

  it("5c. generateCognitiveProfile: produces tailored advice for analysis and evaluation weaknesses", () => {
    const attemptsAnalysis = [
      { question: { ...sampleQuestion, cognitiveLevel: CognitiveLevel.ANALYSIS }, isCorrect: false },
      { question: { ...sampleQuestion, cognitiveLevel: CognitiveLevel.ANALYSIS }, isCorrect: false },
      { question: { ...sampleQuestion, cognitiveLevel: CognitiveLevel.RECALL }, isCorrect: true },
    ];
    const profileAnalysis = AssessmentIntelligence.generateCognitiveProfile(attemptsAnalysis);
    expect(profileAnalysis.recommendedFocus).toContain("بەراوردکردن");

    const attemptsEvaluation = [
      { question: { ...sampleQuestion, cognitiveLevel: CognitiveLevel.EVALUATION }, isCorrect: false },
      { question: { ...sampleQuestion, cognitiveLevel: CognitiveLevel.EVALUATION }, isCorrect: false },
      { question: { ...sampleQuestion, cognitiveLevel: CognitiveLevel.RECALL }, isCorrect: true },
    ];
    const profileEvaluation = AssessmentIntelligence.generateCognitiveProfile(attemptsEvaluation);
    expect(profileEvaluation.recommendedFocus).toContain("بڕیاردانی زانستی");
  });

  it("6. generatePostAssessmentSummary: generates Kurdish study roadmap", () => {
    const q1: AssessmentQuestion = { ...sampleQuestion, conceptId: "c_acids", lessonId: "ترشەکان" };
    const q2: AssessmentQuestion = { ...sampleQuestion, conceptId: "c_bases", lessonId: "تفتەکان" };

    const attempts = [
      { question: q1, isCorrect: true },
      { question: q1, isCorrect: true },
      { question: q2, isCorrect: false },
    ];

    const summary = AssessmentIntelligence.generatePostAssessmentSummary(attempts);
    expect(summary.masteredConcepts).toContain("c_acids");
    expect(summary.reviewConcepts).toContain("c_bases");
    expect(summary.recommendedNextSessionPlanKu).toContain("پێداچوونەوە بە چەمکەکانی");
  });

  it("7. selectNextQuestionCAT: chooses item maximizing Fisher information and respects exposure", () => {
    const q1: AssessmentQuestion = {
      ...sampleQuestion,
      id: "q_01",
      irt: { discrimination: 1.0, difficulty: -2.0, guessing: 0.2 },
    };
    const q2: AssessmentQuestion = {
      ...sampleQuestion,
      id: "q_02",
      irt: { discrimination: 2.5, difficulty: 0.1, guessing: 0.2 }, // Higher info near theta=0.0
    };
    const q3: AssessmentQuestion = {
      ...sampleQuestion,
      id: "q_03",
      irt: { discrimination: 1.2, difficulty: 2.0, guessing: 0.2 },
    };

    const used = new Set<string>(["q_01"]);
    const nextQ = AssessmentIntelligence.selectNextQuestionCAT([q1, q2, q3], used, 0.0);
    expect(nextQ).toBeDefined();
    expect(nextQ?.id).toBe("q_02");
  });

  it("8. evaluateCATStoppingRules: correctly triggers stopping criteria", () => {
    // Bank exhausted
    const res1 = AssessmentIntelligence.evaluateCATStoppingRules(3, 0.45, true);
    expect(res1.shouldStop).toBe(true);
    expect(res1.code).toBe("BANK_EXHAUSTED");

    // Max 20 reached
    const res2 = AssessmentIntelligence.evaluateCATStoppingRules(20, 0.35, false);
    expect(res2.shouldStop).toBe(true);
    expect(res2.code).toBe("MAX_QUESTIONS_REACHED");

    // Confident SE < 0.3 after 5 questions
    const res3 = AssessmentIntelligence.evaluateCATStoppingRules(6, 0.25, false);
    expect(res3.shouldStop).toBe(true);
    expect(res3.code).toBe("CONFIDENT_ESTIMATE");

    // Continue
    const res4 = AssessmentIntelligence.evaluateCATStoppingRules(3, 0.40, false);
    expect(res4.shouldStop).toBe(false);
    expect(res4.code).toBe("CONTINUE");
  });
});
