/**
 * Pedagogical Excellence Core Engine (تاقیگەی نایابی پێداگۆجی)
 * Unifies the 5 pedagogical pillars for Kurdistan Curriculum (Grades 9-12):
 * 1. Feynman Studio Engine (Conceptual clarity metric & protégé feedback)
 * 2. Metacognitive Error Diagnostics (4-Quadrant error categorization & DNA)
 * 3. Spaced-Repetition Leitner Matrix (Ebbinghaus decay curve: R = e^(-t/S))
 * 4. Socratic Dialectic Arena (Curriculum Misconception Bank & Socratic evaluator)
 * 5. Soma Hall Simulator (Time budgeting, freeze detector & 4-7-8 stress inoculation)
 */

import { FeynmanEngine, FEYNMAN_CONCEPTS_CATALOG } from '../pedagogy/feynman/FeynmanEngine';
import { MetacognitiveDiagnosisEngine } from '../pedagogy/metacognitive/MetacognitiveDiagnosisEngine';
import { LeitnerScheduleEngine } from '../pedagogy/leitner/LeitnerScheduleEngine';
import { DialecticArenaEngine, CURRICULUM_MISCONCEPTIONS } from '../pedagogy/dialectic/DialecticArenaEngine';
import { CognitiveErrorCategory } from '../pedagogy/metacognitive/metacognitiveTypes';
import { LeitnerFlashCard } from '../pedagogy/leitner/leitnerTypes';

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
