import { describe, it, expect } from "vitest";
import { ResponseParser } from "../../ai/responseParser.ts";

describe("ResponseParser Educational Parsing & Math Normalization", () => {
  describe("detectPrimaryType", () => {
    it("detects STEP_BY_STEP response", () => {
      const text = `
هەنگاوی ١: شیکاری هاوکێشەکە بکە
هەنگاوی ٢: خەستییەکان دیاری بکە
هەنگاوی ٣: بەهای کۆتایی بدۆزەرەوە
      `;
      expect(ResponseParser.detectPrimaryType(text)).toBe("STEP_BY_STEP");
    });

    it("detects FORMULA response", () => {
      const text = `
یاسای پێوەری pH:
هاوکێشەی سەرەکی بریتییە لە:
pH = -log[H3O+]
خشتەی گۆڕاوەکان:
pH: ترشێتی
      `;
      expect(ResponseParser.detectPrimaryType(text)).toBe("FORMULA");
    });

    it("detects PRACTICE_QUESTION response", () => {
      const text = `
پرسیار: کام لەمانە ترشێکی بەهێزە؟
A) HCl
B) CH3COOH
C) NH3
D) H2O
وەڵامی دروست: A
      `;
      expect(ResponseParser.detectPrimaryType(text)).toBe("PRACTICE_QUESTION");
    });

    it("detects SOCRATIC_QUESTION response", () => {
      const text = `
دەستت خۆش بێت بۆ ئەم هەوڵە. ئێستا با بزانین: ئایا ئەگەر خەستی ئایۆنی هایدرۆنیۆم زیاد بکات، بەهای pH چی لێ دێت؟
      `;
      expect(ResponseParser.detectPrimaryType(text)).toBe("SOCRATIC_QUESTION");
    });

    it("detects DIAGRAM_DESCRIPTION response", () => {
      const text = `
تێبینی هێڵکاری و دیاگرام:
لەم تاقیگەیەدا سەیری هێڵکاری شلەکە بکە و ئاستی قەبارە لە بوریتی تاقیگە بخوێنەوە.
      `;
      expect(ResponseParser.detectPrimaryType(text)).toBe("DIAGRAM_DESCRIPTION");
    });
  });

  describe("parseSteps", () => {
    it("extracts ordered steps correctly", () => {
      const text = `
١. [دیاریکردنی داتا]: سەرەتا بارستەی ماددەکە دیاری بکە.
٢. [دانانی یاسا]: یاسای چڕی بنووسە: d = m / v.
٣. [ژماردنی کۆتایی]: ئەنجامەکە بە یەکەی g/cm³ دەربهێنە.
      `;
      const steps = ResponseParser.parseSteps(text);
      expect(steps.length).toBe(3);
      expect(steps[0].stepNumber).toBe(1);
      expect(steps[0].content).toContain("بارستەی ماددەکە");
      expect(steps[1].stepNumber).toBe(2);
      expect(steps[2].stepNumber).toBe(3);
    });
  });

  describe("parseFormulas", () => {
    it("extracts formula and variable mappings", () => {
      const text = `
هاوکێشەی سەرەکی:
pH = -log[H3O+]
گۆڕاوەکان:
- pH: پێوەری ترشێتی
- [H3O+]: خەستی ئایۆنی هایدرۆنیۆم بە mol/L
      `;
      const formulas = ResponseParser.parseFormulas(text);
      expect(formulas.length).toBeGreaterThanOrEqual(1);
      expect(formulas[0].formula).toContain("pH");
      expect(formulas[0].variables.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("cleanAndNormalizeMath", () => {
    it("converts chemical subscripts and superscripts to Unicode", () => {
      const raw = "لە گیراوەکەدا خەستی [H3O+] یەکسانە بە 10^-3";
      const cleaned = ResponseParser.cleanAndNormalizeMath(raw);
      expect(cleaned).toContain("[H₃O⁺]");
      expect(cleaned).toContain("10⁻³");
    });

    it("strips LaTeX delimiters for RTL display integrity", () => {
      const raw = "هاوکێشەکە بریتییە لە: $x^2 + 2x + 1 = 0$ لە تاقیکردنەوەدا";
      const cleaned = ResponseParser.cleanAndNormalizeMath(raw);
      expect(cleaned).not.toContain("$");
      expect(cleaned).toContain("x² + 2x + 1 = 0");
    });
  });

  describe("full parse orchestration", () => {
    it("returns comprehensive ParsedEducationalResponse", () => {
      const response = ResponseParser.parse(`
شیکاری هەنگاو بە هەنگاو بۆ هاوکێشەی pH:
١. هەنگاوی یەکەم: خەستی [H3O+] بدۆزەرەوە.
٢. هەنگاوی دووەم: یاساکە جێبەجێ بکە: pH = -log[H3O+].
نموونە: ئەگەر [H3O+] = 10^-2 بێت، ئەوا pH = 2 دەبێت.
      `);

      expect(response.primaryType).toBeDefined();
      expect(response.sanitizedText).toContain("[H₃O⁺]");
      expect(response.hasForbiddenPhrases).toBe(false);
      expect(response.steps.length).toBeGreaterThanOrEqual(2);
      expect(response.examples.length).toBeGreaterThanOrEqual(1);
    });
  });
});
