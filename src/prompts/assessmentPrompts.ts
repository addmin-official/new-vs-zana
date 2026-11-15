/**
 * Assessment & Diagnostic Prompt Engineering System
 * Generates formative checks, evaluates open-ended student reasoning, and suggests remedial paths.
 */

import { buildPersonaPromptBlock } from "../ai/tutorPersona.ts";

export interface DiagnosticAssessmentPromptOptions {
  subject: string;
  grade: string;
  concepts: string[];
  questionCount?: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

export interface AnswerEvaluationPromptOptions {
  subject: string;
  questionText: string;
  expectedConcept: string;
  studentAnswer: string;
}

/**
 * Builds a prompt to generate balanced diagnostic questions covering key concepts.
 */
export function buildDiagnosticAssessmentPrompt(options: DiagnosticAssessmentPromptOptions): string {
  const count = options.questionCount || 3;
  const conceptsList = options.concepts.map(c => `"${c}"`).join("، ");

  return `
[ئەرکی بەرهەمهێنانی تاقیکردنەوەی هەڵسەنگاندنی ئاست]
بابەت: ${options.subject}
پۆل: پۆلی ${options.grade}
ئاستی قورسی: ${options.difficulty || "intermediate"}
ژمارەی پرسیارە داواکراوەکان: ${count}
چەمکە داواکراوەکان: ${conceptsList}

داواکاری بۆ پرسیارەکان:
١. پرسیارەکان دەبێت فرە-هەڵبژاردەیی بن (A, B, C, D) بە زمانی کوردی سۆرانی.
٢. دەبێت بە تەواوی ئاستی تێگەیشتنی قوتابی لەم چەمکانە تاقی بکەنەوە.
٣. هەڵبژاردە نادروستەکان دەبێت هەڵەی زانستی باو بن نەک وەڵامی هەڕەمەکی بێ مانا.
٤. بە فۆرماتی ڕوون بنووسرێت کە وەڵامی دروست لە کۆتاییدا دیاری کرابێت بە ڕوونکردنەوەی فێرکاری.
`.trim();
}

/**
 * Builds a prompt for evaluating student open-ended responses with feedback and encouragement.
 */
export function buildAnswerEvaluationPrompt(options: AnswerEvaluationPromptOptions): string {
  const personaBlock = buildPersonaPromptBlock();

  return `
${personaBlock}

[ئەرکی هەڵسەنگاندنی وەڵامی کراوەی قوتابی]
بابەت: ${options.subject}
چەمکی سەرەکی: ${options.expectedConcept}
پرسیار: "${options.questionText}"
وەڵامی قوتابی: "${options.studentAnswer}"

ڕێنمایی بۆ هەڵسەنگاندن:
١. دیاری بکە ئایا وەڵامەکە بە تەواوی ڕاستە، نیوەچڵە، یان پێویستی بە چاکسازی هەیە.
٢. لە هەر حاڵەتێکدا دەستخۆشی لە هەوڵەکەی بکە بە ڕستەیەکی گەرم.
٣. ئەگەر هەڵەی تێدایە، ڕاستەوخۆ مەیگێڕەوە و مەڵێ "هەڵەیە"؛ بەڵکو هێمایەک بۆ بەشی ناتەواوەکە بکە و پرسیارێکی کورت بکە بۆ تێگەیشتنی باشتر.
٤. خاڵە بەهێزەکانی وەڵامەکەی دەستنیشان بکە.
`.trim();
}
