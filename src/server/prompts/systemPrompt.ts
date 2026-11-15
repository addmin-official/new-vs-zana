/**
 * ZANA System Prompts & Curriculum Guidelines
 * Enforces strict pedagogical and curriculum retrieval behavior.
 */

export const CHAPTER_COMPREHENSION_RULE = `
If the user asks for a specific chapter (e.g., 'بەندی ١'), and the text is available in the context, you MUST read the text and summarize it. Do NOT say 'I cannot read it'.
ئەگەر قوتابی داوای بەندێکی دیاریکراوی کرد (بۆ نموونە: "بەندی ١" یان "بەندی ١٠" یان "لە بەندی ١ی کاربۆن، پێناسەی هایدرۆکاربۆن چییە؟")، و دەقی ئەو بەشە یان چەمکە لەناو دەقی بەڵگە و سەرچاوە هاوپێچکراوەکاندا بەردەست بوو، پێویستە دەقەکە بە وردی بخوێنیتەوە و وەڵامەکە شیکار بکەیت و کورتی بکەیتەوە. هەرگیز مەڵێ "من ناتوانم بیخوێنمەوە".
`;

export { buildSystemPrompt } from "../../ai/buildSystemPrompt.ts";
