import assert from "node:assert";
import { test, beforeEach } from "node:test";
import { PedagogyEngine } from "../features/pedagogyHub/pedagogyEngine.ts";
import { INITIAL_FEYNMAN_CONCEPTS } from "../features/pedagogyHub/pedagogyData.ts";

beforeEach(() => {
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }
});

test("PedagogyEngine - evaluates Feynman explanations and detects technical jargon correctly", () => {
  const concept = INITIAL_FEYNMAN_CONCEPTS[0]; // Henry's law
  const jargonExplanation = "یاسای هێنری پەیوەندی بە هاوسەنگی تێربوون و پەستانی بەشی دیاریکراو هەیە.";
  const evalJargon = PedagogyEngine.evaluateFeynmanExplanation(concept, jargonExplanation);

  assert.ok(evalJargon.jargonFound.length > 0);
  assert.strictEqual(evalJargon.clarityLevel, "too_academic");

  // Everyday simple explanation
  const simpleExplanation = "وەک بتڵی سۆدا وایە، کاتێک دەیکەیتەوە پەستان لەسەر شلەکە نامێنێت و گازەکە بە بڵق دەردەچێت.";
  const evalSimple = PedagogyEngine.evaluateFeynmanExplanation(concept, simpleExplanation);
  assert.ok(evalSimple.score > 60);
  assert.strictEqual(evalSimple.jargonFound.length, 0);
});

test("PedagogyEngine - handles metacognitive logs and calculates radar summary", () => {
  PedagogyEngine.saveMetacognitiveLog({
    id: "log-1",
    questionId: "q1",
    selectedOption: "B",
    isCorrect: false,
    diagnosedReason: "CARELESS_MISREADING",
    timestamp: new Date().toISOString()
  });

  PedagogyEngine.saveMetacognitiveLog({
    id: "log-2",
    questionId: "q2",
    selectedOption: "C",
    isCorrect: false,
    diagnosedReason: "TIME_PRESSURE_PANIC",
    timestamp: new Date().toISOString()
  });

  const logs = PedagogyEngine.getMetacognitiveLogs();
  assert.ok(logs.length >= 2);

  const summary = PedagogyEngine.getMetacognitiveRadarSummary(logs);
  assert.ok(summary.CARELESS_MISREADING >= 1);
  assert.ok(summary.TIME_PRESSURE_PANIC >= 1);
  assert.strictEqual(summary.CONCEPTUAL_DEFICIT, 0);
});

test("PedagogyEngine - processes Leitner spaced review progression and reset on mistake", () => {
  const items = PedagogyEngine.getLeitnerItems();
  const testItem = items[0];
  const initialBox = testItem.box;

  // Successful review promotes box
  const afterSuccess = PedagogyEngine.processLeitnerReview(testItem.id, true);
  const updatedItem = afterSuccess.find((i: { id: string; box: number }) => i.id === testItem.id);
  assert.strictEqual(updatedItem?.box, Math.min(5, initialBox + 1));

  // Mistake resets directly back to Box 1
  const afterMistake = PedagogyEngine.processLeitnerReview(testItem.id, false);
  const resetItem = afterMistake.find((i: { id: string; box: number }) => i.id === testItem.id);
  assert.strictEqual(resetItem?.box, 1);
});

test("PedagogyEngine - evaluates Socratic dialectic debates with scientific validity criteria", () => {
  const topics = PedagogyEngine.getDebateTopics();
  const gravityTopic = topics[0];

  const weakArg = PedagogyEngine.evaluateDebateArgument(gravityTopic, "نەخێر ڕاست نییە", 1);
  assert.strictEqual(weakArg.sender, "ai_devil_advocate");
  assert.ok(weakArg.scientificScore !== undefined && weakArg.scientificScore < 60);

  const strongArg = PedagogyEngine.evaluateDebateArgument(
    gravityTopic,
    "گالیلۆ سەلماندی لە بۆشایی و بێ بەرگری هەوا، تاودانی کێشکردن یەکسانە و هەردووکیان بە یەکەوە دەکەونە خوارەوە.",
    1
  );
  assert.ok(strongArg.scientificScore !== undefined && strongArg.scientificScore >= 70);
});
