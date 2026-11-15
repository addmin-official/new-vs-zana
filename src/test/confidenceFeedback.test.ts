import { describe, it } from "node:test";
import assert from "node:assert";
import { ConfidenceFeedbackEngine } from "../features/feedback/ConfidenceFeedbackEngine.ts";

describe("Confidence Builder Feedback Engine", () => {
  it("generates affirming, growth-mindset feedback for correct answers", () => {
    const feedback = ConfidenceFeedbackEngine.generateFeedback({
      isCorrect: true,
      userAnswer: "pH = 3",
      expectedAnswer: "pH = 3",
      subject: "کیمیا",
      topic: "پێوەری pH",
      explanation: "چونکە خەستی ئایۆنی هایدرۆنیۆم ١٠ بەرامبەرە.",
      attemptCount: 1,
    });

    assert.strictEqual(feedback.status, "correct");
    assert.strictEqual(feedback.confidenceLevel, "solid");
    assert.ok(feedback.confidenceScoreDelta >= 20);
    assert.ok(feedback.headlineKu.includes("پیرۆزە") || feedback.headlineKu.includes("دروست"));
    assert.ok(feedback.scientificExplanationKu.length > 10);
    assert.ok(feedback.ministerialTipKu?.includes("وەزاری") || feedback.ministerialTipKu?.includes("تاقیکردنەوە"));
    assert.ok(feedback.encouragementQuoteKu.length > 5);
  });

  it("rewards consecutive streaks with mastery level and bonus delta", () => {
    const feedback = ConfidenceFeedbackEngine.generateFeedback({
      isCorrect: true,
      userAnswer: "F = ma",
      expectedAnswer: "F = ma",
      subject: "فیزیا",
      topic: "یاسای دووەمی نیوتن",
      streak: 4,
    });

    assert.strictEqual(feedback.status, "correct");
    assert.strictEqual(feedback.confidenceLevel, "mastery");
    assert.strictEqual(feedback.confidenceScoreDelta, 30);
    assert.ok(feedback.headlineKu.includes("🔥") || feedback.headlineKu.includes("ئاگرینە"));
  });

  it("generates step-by-step guidance and misconception diagnosis for incorrect attempts without penalizing confidence", () => {
    const feedback = ConfidenceFeedbackEngine.generateFeedback({
      isCorrect: false,
      userAnswer: "pH = 11",
      expectedAnswer: "pH = 3",
      subject: "کیمیا",
      topic: "ترشە بەهێزەکان",
      commonMisconception: "تێکەڵکردنی خەستی OH- لەگەڵ H3O+",
      hint: "سەرەتا یاسای pH = -log[H3O+] بنووسە",
      attemptCount: 1,
    });

    assert.strictEqual(feedback.status, "needs_guidance");
    assert.strictEqual(feedback.confidenceLevel, "building");
    assert.ok(feedback.confidenceScoreDelta > 0, "Effort should always be rewarded with confidence points");
    assert.ok(feedback.headlineKu.includes("نزیک بوویتەوە") || feedback.headlineKu.includes("فێری"));
    assert.ok(feedback.misconceptionDiagnosisKu?.includes("تێکەڵکردنی خەستی OH-"));
    assert.ok(Array.isArray(feedback.remediationStepsKu));
    assert.ok((feedback.remediationStepsKu?.length || 0) >= 3);
    assert.ok(feedback.examTrapAlertKu?.length && feedback.examTrapAlertKu.length > 5);
  });

  it("handles blank answers with constructive encouragement instead of harsh rejection", () => {
    const feedback = ConfidenceFeedbackEngine.generateFeedback({
      isCorrect: false,
      userAnswer: "",
      expectedAnswer: "x = 5",
      subject: "بیرکاری",
      topic: "هاوکێشەی دووجا",
    });

    assert.strictEqual(feedback.status, "needs_guidance");
    assert.ok(feedback.misconceptionDiagnosisKu?.includes("بەتاڵی") || feedback.misconceptionDiagnosisKu?.includes("ڕانەوەستیت"));
    assert.ok((feedback.remediationStepsKu?.length || 0) >= 2);
  });
});
