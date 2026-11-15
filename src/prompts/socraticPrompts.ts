/**
 * Socratic Prompt Engineering System
 * Orchestrates multi-turn Socratic questioning, guiding prompts, and progressive scaffolding
 * for Kurdish high school students.
 */

import { PromptTemplates, SocraticHintParams } from "../ai/promptTemplates.ts";
import { ZANA_TUTOR_PERSONA, buildPersonaPromptBlock } from "../ai/tutorPersona.ts";

export interface SocraticTurnContext {
  problemText: string;
  studentAnswer?: string;
  conceptName?: string;
  subject?: string;
  grade?: string;
  hintLevel: 1 | 2 | 3 | 4;
  previousHints?: string[];
  conversationHistory?: Array<{ role: "student" | "tutor" | "zana"; text: string }>;
}

/**
 * Builds a prompt for Socratic tutoring progression.
 * Caps scaffolding at level 4 before providing the conceptual synthesis.
 */
export function buildSocraticPrompt(context: SocraticTurnContext): string {
  const hintParams: SocraticHintParams = {
    problemText: context.problemText,
    studentAnswer: context.studentAnswer,
    hintLevel: context.hintLevel,
    conceptName: context.conceptName,
    subject: context.subject,
    previousHints: context.previousHints
  };

  const basePrompt = PromptTemplates.socraticHint(hintParams);

  if (!context.conversationHistory || context.conversationHistory.length === 0) {
    return basePrompt;
  }

  const historyFormatted = context.conversationHistory
    .slice(-4)
    .map(turn => `${turn.role === "student" ? "قوتابی" : ZANA_TUTOR_PERSONA.name}: ${turn.text}`)
    .join("\n");

  return `
${basePrompt}

[مێژووی دوایین وتووێژەکان]:
${historyFormatted}
`.trim();
}

/**
 * Builds a guiding question prompt to redirect a student after an incomplete answer.
 */
export function buildGuidingQuestionPrompt(params: {
  conceptName: string;
  studentAnswer: string;
  subject: string;
}): string {
  const personaBlock = buildPersonaPromptBlock();

  return `
${personaBlock}

[ئەرکی داڕشتنی پرسیاری ڕێبەریکەر بە ڕێبازی سۆکراتی]
بابەت: ${params.subject}
چەمک: ${params.conceptName}
وەڵامی قوتابی: "${params.studentAnswer}"

ڕێنمایی بۆ مامۆستا:
١. هیچ بەشێکی وەڵامەکە بە ڕاستەوخۆ پێشکەش مەکە.
٢. دەستخۆشی لە هەوڵەکە بکە.
٣. یەک پرسیاری سادە بەڵام ئامانجدار بکە کە وام لێبکات بیر لە هەنگاوی ونبوو بکاتەوە.
٤. پرسیارەکە بە تەنها لە ١ تا ٢ دێڕ بێت بە زمانی کوردی سۆرانی.
`.trim();
}
