/**
 * Pedagogical Excellence Core Engine (تاقیگەی نایابی پێداگۆجی)
 * Unifies the 5 pedagogical pillars for Kurdistan Curriculum (Grades 9-12):
 * 1. Feynman Studio Engine (Conceptual clarity metric & protégé feedback)
 * 2. Metacognitive Error Diagnostics (4-Quadrant error categorization & DNA)
 * 3. Spaced-Repetition Leitner Matrix (Ebbinghaus decay curve: R = e^(-t/S))
 * 4. Socratic Dialectic Arena (Curriculum Misconception Bank & Socratic evaluator)
 * 5. Soma Hall Simulator (Time budgeting, freeze detector & 4-7-8 stress inoculation)
 */

import { FeynmanEngine, FEYNMAN_CONCEPTS_CATALOG } from '../pedagogy/feynman/FeynmanEngine.ts';
import { MetacognitiveDiagnosisEngine } from '../pedagogy/metacognitive/MetacognitiveDiagnosisEngine.ts';
import { LeitnerScheduleEngine } from '../pedagogy/leitner/LeitnerScheduleEngine.ts';
import { DialecticArenaEngine, CURRICULUM_MISCONCEPTIONS } from '../pedagogy/dialectic/DialecticArenaEngine.ts';
import { CognitiveErrorCategory } from '../pedagogy/metacognitive/metacognitiveTypes.ts';
import { LeitnerFlashCard } from '../pedagogy/leitner/leitnerTypes.ts';

import {
  FeynmanConcept,
  FeynmanEvaluation,
  MetacognitiveQuestion,
  MetacognitiveLog,
  MetacognitiveErrorReason,
  LeitnerItem,
  DialecticDebateTopic,
  DialecticDebateMessage,
  SomaQuestion
} from './pedagogyTypes.ts';

import {
  INITIAL_FEYNMAN_CONCEPTS,
  INITIAL_METACOGNITIVE_QUESTIONS,
  INITIAL_LEITNER_ITEMS,
  INITIAL_DEBATE_TOPICS,
  INITIAL_SOMA_QUESTIONS
} from './pedagogyData.ts';

export class PedagogyExcellenceEngine {
  // 1. Feynman Clarity Metric
  public static calculateFeynmanScore(text: string, conceptId?: string) {
    const prompt = FEYNMAN_CONCEPTS_CATALOG.find((c) => c.id === conceptId) || FEYNMAN_CONCEPTS_CATALOG[0];
    return FeynmanEngine.evaluateClarity(text, prompt, 2);
  }

  // 2. Metacognitive Error Categorization
  public static recordCognitiveError(
    problemId: string,
    problemTitle: string,
    subject: string,
    category: CognitiveErrorCategory,
    notes?: string
  ) {
    return MetacognitiveDiagnosisEngine.recordReflection({
      problemId,
      problemTitle,
      subject,
      category,
      userSelfNoteKu: notes,
    });
  }

  public static getErrorDna() {
    return MetacognitiveDiagnosisEngine.getProfile();
  }

  // 3. Leitner Memory Decay & Retention Probability
  public static calculateRetentionProbability(card: LeitnerFlashCard): number {
    return LeitnerScheduleEngine.calculateRetention(card);
  }

  public static getLeitnerCards() {
    return LeitnerScheduleEngine.getCards();
  }

  public static getDueCards(limit = 3) {
    return LeitnerScheduleEngine.getDueCards(limit);
  }

  public static processCardAnswer(cardId: string, isCorrect: boolean) {
    return LeitnerScheduleEngine.answerCard(cardId, isCorrect);
  }

  // 4. Dialectic Misconceptions & Socratic Evaluator
  public static getCurriculumMisconceptions() {
    return CURRICULUM_MISCONCEPTIONS;
  }

  public static evaluateDebateArgument(misconceptionId: string, argumentText: string) {
    const misconception = DialecticArenaEngine.getMisconceptionById(misconceptionId);
    if (!misconception) {
      throw new Error(`Misconception not found: ${misconceptionId}`);
    }
    const evalResult = DialecticArenaEngine.evaluateStudentArgument(misconception, argumentText);
    const rebuttal = DialecticArenaEngine.generateAdvocateRebuttal(misconception, evalResult);
    return {
      evalResult,
      rebuttal,
      misconception
    };
  }

  // 5. Soma Exam Simulator Calculations
  public static calculateSomaTimeEfficiency(
    totalAnswered: number,
    totalQuestions: number,
    averageTimeSeconds: number
  ): {
    score: number;
    advice: string;
    isCritical: boolean;
  } {
    const completionRate = totalAnswered / Math.max(1, totalQuestions);
    const timeRatio = Math.max(0, 1 - averageTimeSeconds / 120);
    const score = Math.min(100, Math.round(completionRate * 60 + timeRatio * 40));

    let advice = 'بەڕێوەبردنی کاتت زۆر نایابە و هاوتەریبە لەگەڵ پرسیارەکانی وەزاری.';
    let isCritical = false;

    if (averageTimeSeconds > 100) {
      advice = 'ئاگاداربە! خولەکی هەر پرسیارێک زۆرە. لە تاقیکردنەوەی وەزاریدا کات بەفیڕۆ مەدە و پرسیاری قورس نیشانە بکە.';
      isCritical = true;
    } else if (completionRate < 0.8) {
      advice = 'ڕێژەی وەڵامدانەوەت کەمە. پێویستە خێرایی و گەشبینی خۆت بەرز بکەیتەوە.';
      isCritical = true;
    }

    return { score, advice, isCritical };
  }
}

/**
 * PedagogyEngine provides standardized accessors and evaluation logic
 * for the interactive Pedagogical Hub components.
 */
export class PedagogyEngine {
  // 1. Feynman Studio
  public static getFeynmanConcepts(): FeynmanConcept[] {
    return INITIAL_FEYNMAN_CONCEPTS;
  }

  public static evaluateFeynmanExplanation(concept: FeynmanConcept, text: string): FeynmanEvaluation {
    const cleanText = text.toLowerCase();
    const jargonFound = (concept.jargonToAvoid || []).filter((j) =>
      text.includes(j) || cleanText.includes(j.toLowerCase())
    );
    const analogiesFound = (concept.expectedEverydayAnalogies || []).filter((a) =>
      text.includes(a) || cleanText.includes(a.toLowerCase())
    );
    const principlesCovered = (concept.corePrinciples || []).filter((p) =>
      text.includes(p) || cleanText.includes(p.toLowerCase())
    );
    const principlesMissing = (concept.corePrinciples || []).filter((p) => !principlesCovered.includes(p));

    let score = 50;
    if (jargonFound.length > 0) {
      score = Math.max(20, score - jargonFound.length * 20);
    }
    if (analogiesFound.length > 0) {
      score += analogiesFound.length * 15;
    }
    if (principlesCovered.length > 0) {
      score += principlesCovered.length * 10;
    }
    if (text.length > 30 && jargonFound.length === 0) {
      score = Math.max(score, 75);
    }
    score = Math.min(100, Math.max(10, score));

    let clarityLevel: "elementary" | "good" | "too_academic" | "confusing" = "good";
    if (jargonFound.length > 0) {
      clarityLevel = "too_academic";
    } else if (analogiesFound.length > 0 || score >= 80) {
      clarityLevel = "elementary";
    } else if (text.trim().length < 15) {
      clarityLevel = "confusing";
    }

    return {
      score,
      clarityLevel,
      jargonFound,
      principlesCovered,
      principlesMissing,
      aiStudentResponse:
        clarityLevel === "too_academic"
          ? `دەستخۆش! بەڵام هەندێک وشەی قورست بەکارهێناوە وەک (${jargonFound.join("، ")}) کە کەسێکی سەرەتایی تێیناگات.`
          : "زۆر سوپاس! بە ڕوونی و سادەیی تێمگەیاند و بە وێنەیەکی ڕۆژانە بیرۆکەکەت ڕوونکردەوە.",
      strengths:
        analogiesFound.length > 0
          ? ["بەکارهێنانی نموونەی ژیانی ڕۆژانە"]
          : ["هەوڵدان بۆ ڕوونکردنەوەی بیرۆکەی سەرەکی"],
      constructiveTip:
        jargonFound.length > 0
          ? "هەوڵبدە لە جیاتی زاراوەی ئەکادیمی، هاوشێوەی ژیانی ئاسایی بەکاربهێنیت."
          : "دەتوانیت نموونەی زیاتری ژیانی ڕاستەقینە زیاد بکەیت."
    };
  }

  // 2. Metacognitive Diagnostics
  private static inMemoryLogs: MetacognitiveLog[] = [];
  private static inMemoryLeitner: LeitnerItem[] | null = null;

  public static getMetacognitiveQuestions(): MetacognitiveQuestion[] {
    return INITIAL_METACOGNITIVE_QUESTIONS;
  }

  public static getMetacognitiveLogs(): MetacognitiveLog[] {
    if (typeof localStorage === "undefined") {
      return [...PedagogyEngine.inMemoryLogs];
    }
    try {
      const data = localStorage.getItem("zana_pedagogy_metacognitive_logs");
      return data ? JSON.parse(data) : [];
    } catch {
      return [...PedagogyEngine.inMemoryLogs];
    }
  }

  public static saveMetacognitiveLog(log: MetacognitiveLog): void {
    if (typeof localStorage === "undefined") {
      PedagogyEngine.inMemoryLogs.push(log);
      return;
    }
    try {
      const logs = PedagogyEngine.getMetacognitiveLogs();
      logs.push(log);
      localStorage.setItem("zana_pedagogy_metacognitive_logs", JSON.stringify(logs));
    } catch {
      PedagogyEngine.inMemoryLogs.push(log);
    }
  }

  public static getMetacognitiveRadarSummary(logs: MetacognitiveLog[]): Record<MetacognitiveErrorReason, number> {
    const summary: Record<MetacognitiveErrorReason, number> = {
      CARELESS_MISREADING: 0,
      CONCEPTUAL_DEFICIT: 0,
      CALCULATION_SLIP: 0,
      TIME_PRESSURE_PANIC: 0,
    };
    for (const log of logs) {
      if (log.diagnosedReason && summary[log.diagnosedReason] !== undefined) {
        summary[log.diagnosedReason]++;
      }
    }
    return summary;
  }

  // 3. Spaced-Repetition Leitner Matrix
  public static getLeitnerItems(): LeitnerItem[] {
    if (typeof localStorage !== "undefined") {
      try {
        const stored = localStorage.getItem("zana_pedagogy_leitner_items");
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {}
    }
    if (PedagogyEngine.inMemoryLeitner) {
      return [...PedagogyEngine.inMemoryLeitner];
    }
    return INITIAL_LEITNER_ITEMS;
  }

  public static processLeitnerReview(itemId: string, isCorrect: boolean): LeitnerItem[] {
    const items = PedagogyEngine.getLeitnerItems();
    const updated = items.map((item) => {
      if (item.id === itemId) {
        const nextBox = isCorrect ? Math.min(5, item.box + 1) : 1;
        return {
          ...item,
          box: nextBox as 1 | 2 | 3 | 4 | 5,
          retrievalSuccessCount: isCorrect ? item.retrievalSuccessCount + 1 : item.retrievalSuccessCount,
          lastReviewedDate: new Date().toISOString(),
        };
      }
      return item;
    });
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("zana_pedagogy_leitner_items", JSON.stringify(updated));
      } catch {}
    }
    PedagogyEngine.inMemoryLeitner = [...updated];
    return updated;
  }

  // 4. Socratic Dialectic Arena
  public static getDebateTopics(): DialecticDebateTopic[] {
    return INITIAL_DEBATE_TOPICS;
  }

  public static evaluateDebateArgument(
    topic: DialecticDebateTopic,
    argumentText: string,
    round: number = 1
  ): DialecticDebateMessage {
    const cleanArg = argumentText.trim();
    const isSubstantive = cleanArg.length > 25;
    const mentionsKeyLaw = /گالیلۆ|نیوتن|تاودان|بەرگری|کێشکردن|کالڤن|هاوسەنگی|لۆشاتلییە/i.test(cleanArg);

    let score = 40;
    if (isSubstantive) score += 20;
    if (mentionsKeyLaw) score += 25;
    score = Math.min(95, Math.max(30, score));

    const nowTime = new Date().toLocaleTimeString("ku");
    return {
      id: `ai-rebuttal-${Date.now()}-${round}`,
      sender: "ai_devil_advocate",
      text:
        score >= 70
          ? `بەڵگەیەکی بەهێزە! بەڵام ئایا چۆن دەتوانیت لە ڕووی ئەزموونییەوە ئەم یاسایە لە ژینگەی واقیعی بێ بۆشاییدا بسەلمێنیت؟`
          : `ئەم وەڵامە پێویستی بە بەڵگەی زانستی و هاوکێشەی دروستە. ئایا دەتوانیت سەرچاوە یان ناوی یاسایەکی فیزیایی/کیمیایی بهێنیتەوە؟`,
      timestamp: nowTime,
      scientificScore: score,
      feedback: score >= 70 ? "بەڵگەی زانستی گونجاوە" : "پێویستە پشت بە یاسای پەڕتووک ببەستیت"
    };
  }

  // 5. Soma Stress Simulator
  public static getSomaQuestions(): SomaQuestion[] {
    return INITIAL_SOMA_QUESTIONS;
  }
}
