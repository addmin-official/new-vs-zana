/**
 * Curriculum-Grounded Prompt Engineering System
 * Crafts strictly factual, ministry-aligned learning prompts with citations and excerpts.
 */

import { buildPersonaPromptBlock } from "../ai/tutorPersona.ts";
import { CurriculumEvidence } from "../curriculum/retrieval/CurriculumEvidence.ts";

export interface CurriculumPromptOptions {
  subject: string;
  grade: string;
  stream?: string;
  conceptName: string;
  evidence?: CurriculumEvidence[];
  textbookExcerpt?: string;
  inquiryType?: "explanation" | "formula" | "real_world" | "exam_prep";
}

/**
 * Builds a prompt grounded in the official Kurdistan curriculum textbook evidence.
 */
export function buildCurriculumGroundedPrompt(options: CurriculumPromptOptions): string {
  const personaBlock = buildPersonaPromptBlock();
  const evidenceSnippets = (options.evidence || [])
    .map((ev, i) => `سەرچاوەی ${i + 1} [لاپەڕە ${ev.pageNumberStart || ev.pageNumberEnd || "دیارینەکراو"}]: "${ev.contentSnippet}"`)
    .join("\n\n");

  const evidenceBlock = evidenceSnippets || (options.textbookExcerpt ? `دەقی پەڕتووک: "${options.textbookExcerpt}"` : "سەرچاوەی فەرمی ڕاستەوخۆ بەردەست نییە؛ پابەندبە بە سۆلابەسی فەرمیی پۆلی دیاریکراو.");

  let focusDirective = "";
  switch (options.inquiryType) {
    case "formula":
      focusDirective = "تەرکیزی تەواو بکەرە سەر هاوکێشە، یەکەکان، و پێناسەی گۆڕاوەکان بەپێی پەڕتووک.";
      break;
    case "real_world":
      focusDirective = "پەیوەندیی نێوان ئەم چەمکە و نموونەکانی ژیانی ڕۆژانەی کوردستان ڕوون بکەرەوە.";
      break;
    case "exam_prep":
      focusDirective = "تیشک بخەرە سەر پرسیارە باوەکانی تاقیکردنەوەی نیشتمانی (وەزاری) لەسەر ئەم چەمکە.";
      break;
    case "explanation":
    default:
      focusDirective = "ڕوونکردنەوەیەکی زانستیی هاوسەنگ بە زمانی کوردی سۆرانی بەپێی ئاستی پۆلەکە.";
      break;
  }

  return `
${personaBlock}

[ئەرکی ڕوونکردنەوەی فەرمیی بەستراو بە پرۆگرامی وەزارەتی پەروەردە]
بابەت: ${options.subject}
قۆناغ: پۆلی ${options.grade}${options.stream ? ` (${options.stream})` : ""}
چەمک: "${options.conceptName}"

[دەق و بەڵگەنامەی فەرمیی پەڕتووکی خوێندن]:
${evidenceBlock}

ڕێنمایی جێبەجێکردن:
١. تەنها و تەنها ئەو زانیارییانە پشتڕاست بکەرەوە کە هاوتەریبن لەگەڵ پرۆگرامی فەرمی.
٢. ${focusDirective}
٣. ئەگەر زاراوەی زانستی هەیە (وەک ئەلکترۆن، کاتالیست، ئەنتالپی)، ناوی کوردی و ئینگلیزییەکەی لە تەنیشتی دابنێ.
٤. هەمیشە وەڵامەکە بە شێوەیەکی خۆشەویست و هاندەر پێشکەش بکە.
`.trim();
}
