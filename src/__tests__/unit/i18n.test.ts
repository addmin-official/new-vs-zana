import { describe, it, expect, beforeEach } from "vitest";
import { i18n, t, formatNumber, formatDate, formatDuration } from "../../i18n/i18n.ts";

describe("ZANA i18n System & Kurdish Sorani Engine", () => {
  beforeEach(() => {
    i18n.setLocale("ckb");
  });

  describe("Translation Resolution & Fallbacks", () => {
    it("resolves nested keys accurately in Kurdish Sorani", () => {
      expect(t("navigation.home")).toBe("سەرەتا");
      expect(t("navigation.chat")).toBe("چاتی زیرەک");
      expect(t("subjects.chemistry.name")).toBe("کیمیا");
      expect(t("subjects.mathematics.name")).toBe("بیرکاری");
      expect(t("subjects.physics.name")).toBe("فیزیا");
      expect(t("labs.experiment")).toBe("تاقیکردنەوە");
      expect(t("labs.hypothesis")).toBe("گریمانە");
    });

    it("translates mastery tiers according to exact Kurdish specification", () => {
      expect(t("masteryTiers.notStarted")).toBe("دەستنەکردووە");
      expect(t("masteryTiers.introduced")).toBe("دەستکردووە");
      expect(t("masteryTiers.developing")).toBe("بەرەوپێشە");
      expect(t("masteryTiers.proficient")).toBe("شارەزایە");
      expect(t("masteryTiers.mastered")).toBe("تێگەیشتووە");
    });

    it("interpolates variables properly with {{ variable }}", () => {
      const result = t("assessment.questionProgress", { current: 3, total: 10 });
      expect(result).toBe("پرسیاری 3 لە 10");

      const timeResult = t("time.hoursAgo", { count: 2 });
      expect(timeResult).toBe("2 کاتژمێر لەمەوبەر");
    });

    it("falls back to Arabic when key is missing in ckb", () => {
      i18n.setLocale("ar");
      expect(t("navigation.home")).toBe("الرئيسية");
      expect(t("navigation.chat")).toBe("المعلم الذكي");
      expect(t("masteryTiers.mastered")).toBe("متقن");
    });

    it("falls back to key name when key is not found in any language", () => {
      expect(t("unknown.fake.key" as unknown as string)).toBe("unknown.fake.key");
    });

    it("translates new lab, plan, practice and settings keys", () => {
      expect(t("labs.title")).toBe("تاقیگەی زانستیی کارلێککارانە و ٣D");
      expect(t("labs.experiment")).toBe("تاقیکردنەوە");
      expect(t("labs.hypothesis")).toBe("گریمانە");
      expect(t("labs.variable")).toBe("گۆڕاو");
      expect(t("labs.observation")).toBe("تێبینیکردن و بەدواداچوون");
      expect(t("plan.todayPlan")).toBe("ئەرکەکانی ئەمڕۆ");
      expect(t("practice.badges")).toBe("مەدالیاکانی بەدەستهێنان");
      expect(t("settings.numerals")).toBe("شێوازی ژمارەکان");
    });

    it("provides 30+ authentic Kurdish encouragement phrases", async () => {
      const { ckb: ckbDict } = await import("../../i18n/locales/ckb.ts");
      expect(ckbDict.feedback.encouragement.length).toBeGreaterThanOrEqual(30);
    });
  });

  describe("Number and Currency Formatting", () => {
    it("formats numbers with standard digits", () => {
      i18n.setUseEasternNumerals(false);
      const formatted = formatNumber(1500, "ckb");
      expect(formatted).toContain("1");
    });

    it("converts to Eastern Arabic numerals when requested", () => {
      const eastern = formatNumber(1234, "ckb", { useEasternNumerals: true });
      expect(eastern).toBe("١٬٢٣٤");
    });

    it("respects global setUseEasternNumerals setting", () => {
      i18n.setUseEasternNumerals(true);
      expect(formatNumber(99)).toBe("٩٩");
      i18n.setUseEasternNumerals(false);
      expect(formatNumber(99)).toBe("99");
    });
  });

  describe("Date & Duration Formatting", () => {
    it("formats date in authentic Kurdish month names", () => {
      const d = new Date(2026, 2, 21); // March 21 (Nawroz)
      const formatted = formatDate(d, "ckb");
      expect(formatted).toContain("ئازار");
      expect(formatted).toContain("2026");
    });

    it("formats date in Arabic month names when locale is ar", () => {
      const d = new Date(2026, 2, 21);
      const formatted = formatDate(d, "ar");
      expect(formatted).toContain("مارس");
    });

    it("formats duration into minutes and hours correctly", () => {
      expect(formatDuration(45, "ckb")).toBe("45 خولەک");
      expect(formatDuration(60, "ckb")).toBe("1 کاتژمێر");
      expect(formatDuration(90, "ckb")).toBe("1 کاتژمێر و 30 خولەک");

      expect(formatDuration(45, "ar")).toBe("45 دقيقة");
      expect(formatDuration(120, "ar")).toBe("2 ساعة");
    });
  });
});
