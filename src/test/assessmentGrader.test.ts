import { test } from "node:test";
import assert from "node:assert";
import {
  evaluateObjectiveAnswer,
  gradeAndValidateAssessment,
  normalizeAnswerText,
} from "../server/ai/assessmentGrader.ts";

test("AssessmentGrader - objective multiple choice matching", () => {
  // Letters
  assert.strictEqual(evaluateObjectiveAnswer("A", "A"), true);
  assert.strictEqual(evaluateObjectiveAnswer("a", "A"), true);
  assert.strictEqual(evaluateObjectiveAnswer("ب", "B"), true);
  assert.strictEqual(evaluateObjectiveAnswer("ج", "C"), true);
  assert.strictEqual(evaluateObjectiveAnswer("د", "D"), true);

  // Exact phrase match
  assert.strictEqual(evaluateObjectiveAnswer("ئۆکسجین", "ئۆکسجین"), true);
  assert.strictEqual(evaluateObjectiveAnswer("نایترۆجین", "ئۆکسجین"), false);
});

test("AssessmentGrader - rejects empty or evasive answers regardless of LLM claim", () => {
  // Empty
  const res1 = gradeAndValidateAssessment("", true);
  assert.strictEqual(res1.isCorrect, false);
  assert.strictEqual(res1.rubric.overallScore, 0);

  // Confession of not knowing
  const res2 = gradeAndValidateAssessment("نازانم ئەمە چۆنە", true);
  assert.strictEqual(res2.isCorrect, false);
});

test("AssessmentGrader - structured rubric secondary validation", () => {
  // Low factual accuracy should fail even if LLM hallucinated isCorrect: true
  const resLowAccuracy = gradeAndValidateAssessment(
    "ترش ئەلکترۆن دەبەخشێت",
    true,
    {
      factualAccuracy: 0.3,
      conceptualRelevance: 0.8,
      completeness: 0.5,
    }
  );
  assert.strictEqual(resLowAccuracy.isCorrect, false);

  // High quality answer should pass
  const resHighQuality = gradeAndValidateAssessment(
    "ترش بەپێی تیۆری لۆری-برۆنشتێد بریتییە لە بەخشی پرۆتۆن",
    true,
    {
      factualAccuracy: 0.95,
      conceptualRelevance: 0.9,
      completeness: 0.9,
    }
  );
  assert.strictEqual(resHighQuality.isCorrect, true);
  assert.ok(resHighQuality.rubric.overallScore >= 0.8);
});
