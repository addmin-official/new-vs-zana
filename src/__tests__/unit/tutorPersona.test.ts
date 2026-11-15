import { describe, it, expect } from "vitest";
import {
  ZANA_TUTOR_PERSONA,
  getRandomEncouragement,
  detectForbiddenPhrases,
  buildPersonaPromptBlock,
} from "../../ai/tutorPersona.ts";
import { PromptTemplates } from "../../ai/promptTemplates.ts";

describe("ZANA Tutor Persona & Prompt Templates", () => {
  describe("ZANA_TUTOR_PERSONA specifications", () => {
    it("has the authentic Kurdish educational identity", () => {
      expect(ZANA_TUTOR_PERSONA.name).toBe("زانا");
      expect(ZANA_TUTOR_PERSONA.role).toContain("مامۆستای زیرەک");
      expect(ZANA_TUTOR_PERSONA.teachingStyle).toContain("سۆکراتیک");
      expect(ZANA_TUTOR_PERSONA.language).toContain("کوردی سۆرانی");
    });

    it("defines essential pedagogical tone rules and growth mindset directives", () => {
      expect(ZANA_TUTOR_PERSONA.toneRules.length).toBeGreaterThanOrEqual(5);
      expect(ZANA_TUTOR_PERSONA.growthMindsetDirectives.length).toBeGreaterThanOrEqual(3);
      expect(ZANA_TUTOR_PERSONA.encouragementBank.length).toBeGreaterThanOrEqual(5);
      expect(ZANA_TUTOR_PERSONA.forbiddenPhrases.length).toBeGreaterThanOrEqual(5);
    });

    it("returns a valid encouragement string from the bank", () => {
      const phrase = getRandomEncouragement();
      expect(typeof phrase).toBe("string");
      expect(phrase.length).toBeGreaterThan(0);
      expect(ZANA_TUTOR_PERSONA.encouragementBank).toContain(phrase);
    });
  });

  describe("detectForbiddenPhrases", () => {
    it("flags negative or giveaway phrases correctly", () => {
      const badResponse1 = "وەڵامەکە ئەمەیە... پێویستە ئەمە بکەیت";
      const check1 = detectForbiddenPhrases(badResponse1);
      expect(check1.hasForbidden).toBe(true);
      expect(check1.matchedPhrases).toContain("وەڵامەکە ئەمەیە...");

      const badResponse2 = "نەخێر، ئەمە هەڵەیە!";
      const check2 = detectForbiddenPhrases(badResponse2);
      expect(check2.hasForbidden).toBe(true);
      expect(check2.matchedPhrases).toContain("ئەمە هەڵەیە");

      const badResponse3 = "تۆ لەم بابەتە تێناگەیت هەرگیز";
      const check3 = detectForbiddenPhrases(badResponse3);
      expect(check3.hasForbidden).toBe(true);
    });

    it("passes pedagogical growth mindset responses", () => {
      const cleanResponse = "ئافەرم بۆ ئەم بیرکردنەوە جوانە! با هەنگاوی دواتر پێکەوە تاقی بکەینەوە.";
      const check = detectForbiddenPhrases(cleanResponse);
      expect(check.hasForbidden).toBe(false);
      expect(check.matchedPhrases).toEqual([]);
    });
  });

  describe("buildPersonaPromptBlock", () => {
    it("generates a prompt block with ZANA identity and tone rules", () => {
      const block = buildPersonaPromptBlock();
      expect(block).toContain("زانا");
      expect(block).toContain("تۆن و هەڵسوکەوت");
      expect(block).toContain("دەستەواژە قەدەغەکراوەکان");
    });
  });

  describe("PromptTemplates", () => {
    it("builds 5-stage concept explanation prompt", () => {
      const prompt = PromptTemplates.explainConcept({
        conceptName: "پێوەری pH",
        subject: "کیمیا",
        grade: "12",
        studentName: "سۆزان",
        curriculumEvidenceSnippet: "هاوکێشەی pH بریتییە لە لۆگاریتمی پێچەوانەی هایدرۆنیۆم",
      });

      expect(prompt).toContain("پێوەری pH");
      expect(prompt).toContain("[IDENTITY]");
      expect(prompt).toContain("[CONTEXT]");
      expect(prompt).toContain("[STUDENT STATE]");
      expect(prompt).toContain("[TEACHING RULES]");
      expect(prompt).toContain("[OUTPUT FORMAT — JSON ONLY]");
    });

    it("builds Socratic hint prompts for all 4 scaffolding tiers", () => {
      const p1 = PromptTemplates.socraticHint({
        problemText: "خەستی ئایۆنی هایدرۆنیۆم بدۆزەرەوە",
        hintLevel: 1,
      });
      expect(p1).toContain("ئاستی ١ (پرسیاری ڕێبەریکەر");

      const p2 = PromptTemplates.socraticHint({
        problemText: "خەستی ئایۆنی هایدرۆنیۆم بدۆزەرەوە",
        hintLevel: 2,
      });
      expect(p2).toContain("ئاستی ٢ (نموونە و ئاماژەی تێگەیشتن");

      const p3 = PromptTemplates.socraticHint({
        problemText: "خەستی ئایۆنی هایدرۆنیۆم بدۆزەرەوە",
        hintLevel: 3,
      });
      expect(p3).toContain("ئاستی ٣ (شیکاری هەنگاوی یەکەم");

      const p4 = PromptTemplates.socraticHint({
        problemText: "خەستی ئایۆنی هایدرۆنیۆم بدۆزەرەوە",
        hintLevel: 4,
      });
      expect(p4).toContain("ئاستی ٤ (شیکاری تەواو و بەستنەوەی چەمک");
    });

    it("builds practice questions with distractors and Bloom taxonomy", () => {
      const p = PromptTemplates.practiceQuestion({
        conceptId: "acid_base_01",
        conceptNameKu: "ترش و تفتەکان",
        subject: "کیمیا",
        grade: "12",
        difficulty: "intermediate",
        cognitiveLevel: "APPLICATION",
      });
      expect(p).toContain("ترش و تفتەکان");
      expect(p).toContain("APPLICATION");
      expect(p).toContain("چوار-هەڵبژاردەیی");
    });

    it("builds misconception remediation without negative feedback", () => {
      const p = PromptTemplates.misconceptionRemediation({
        conceptNameKu: "پێوەری pH",
        detectedMisconceptionNameKu: "تێکەڵکردنی خەستی و بڕ",
        studentIncorrectResponse: "پێموایە ئەگەر بڕ زیاد بێت ترشێتی کەم دەبێتەوە",
        subject: "کیمیا",
        grade: "12",
      });
      expect(p).toContain("لێکتێنەگەیشتنی دیاریکراو");
      expect(p).toContain("هەرگیز مەڵێ \"ئەمە هەڵەیە\"");
    });

    it("builds formula explanation with variables table", () => {
      const p = PromptTemplates.formulaExplanation({
        formulaSymbolic: "pH = -log[H₃O⁺]",
        formulaNameKu: "یاسای پێوەری pH",
        subject: "کیمیا",
        grade: "12",
      });
      expect(p).toContain("pH = -log[H₃O⁺]");
      expect(p).toContain("خشتەی گۆڕاوەکان");
    });

    it("builds exam summary with 3-point progression roadmap", () => {
      const p = PromptTemplates.examSummary({
        subject: "کیمیا",
        conceptsCovered: ["ترش و تفت", "هاوسەنگی"],
        correctCount: 8,
        totalQuestions: 10,
        studentName: "ئاراس",
      });
      expect(p).toContain("ئاراس");
      expect(p).toContain("8 لە 10 (80%)");
      expect(p).toContain("دەستنیشانکردنی تەرکیز");
      expect(p).toContain("ڕێڕەوی هەنگاوی داهاتوو");
    });
  });
});
