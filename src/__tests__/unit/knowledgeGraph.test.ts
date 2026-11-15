import { describe, it, expect } from "vitest";
import {
  topologicalSort,
  evaluateNodeStatus,
  detectKnowledgeGraphCycles,
  evaluateMomentum,
  calculateProgressForecast,
  KnowledgeNode,
} from "../../planning/planning.ts";
import { DifficultyLevel, StudentMasteryProfile, MasteryStatus } from "../../learning/domain/MasteryTypes.ts";

describe("Knowledge Graph Topological Sort & Prerequisite Evaluation", () => {
  const MASTERY_UNLOCK_THRESHOLD = 0.60;
  const ESTIMATED_MINUTES_DEFAULT = 30;

  const createNode = (id: string, nameKu: string, prerequisites: string[] = []): KnowledgeNode => ({
    id,
    nameKu,
    subject: "chemistry",
    subjectNameKu: "کیمیا",
    grade: "12",
    prerequisites,
    estimatedMinutes: ESTIMATED_MINUTES_DEFAULT,
    unitNameKu: "بەشی یەکەم",
    difficulty: DifficultyLevel.STANDARD,
    position: { x: 50, y: 50 },
  });

  it("1. Linear chain of prerequisites (A -> B -> C) sorts strictly into [A, B, C]", () => {
    const nodeA = createNode("node_A", "چەمکی ئەلف", []);
    const nodeB = createNode("node_B", "چەمکی بێ", ["node_A"]);
    const nodeC = createNode("node_C", "چەمکی جیم", ["node_B"]);

    // Pass shuffled order to test sorting
    const result = topologicalSort([nodeC, nodeA, nodeB]);
    const ids = result.map((n) => n.id);

    expect(ids).toEqual(["node_A", "node_B", "node_C"]);
  });

  it("2. Diamond dependency graph (A -> B, A -> C, {B, C} -> D) places root first and convergence last", () => {
    const nodeA = createNode("node_root", "بنچینەیی", []);
    const nodeB = createNode("node_branch_left", "لق ١", ["node_root"]);
    const nodeC = createNode("node_branch_right", "لق ٢", ["node_root"]);
    const nodeD = createNode("node_converge", "کۆتایی", ["node_branch_left", "node_branch_right"]);

    const sorted = topologicalSort([nodeD, nodeC, nodeB, nodeA]);
    const ids = sorted.map((n) => n.id);

    expect(ids[0]).toBe("node_root");
    expect(ids[ids.length - 1]).toBe("node_converge");
    expect(ids.indexOf("node_branch_left")).toBeGreaterThan(ids.indexOf("node_root"));
    expect(ids.indexOf("node_branch_right")).toBeGreaterThan(ids.indexOf("node_root"));
    expect(ids.indexOf("node_converge")).toBeGreaterThan(ids.indexOf("node_branch_left"));
    expect(ids.indexOf("node_converge")).toBeGreaterThan(ids.indexOf("node_branch_right"));
  });

  it("3. Disjoint independent subjects / components are ordered with zero prerequisite inversion", () => {
    const chemA = createNode("chem_1", "کیمیای سەرەتایی", []);
    const chemB = createNode("chem_2", "کیمیای ناوەندی", ["chem_1"]);
    const physA = createNode("phys_1", "فیزیای سەرەتایی", []);
    const physB = createNode("phys_2", "فیزیای ناوەندی", ["phys_1"]);

    const sorted = topologicalSort([chemB, physB, chemA, physA]);
    const ids = sorted.map((n) => n.id);

    expect(ids.indexOf("chem_1")).toBeLessThan(ids.indexOf("chem_2"));
    expect(ids.indexOf("phys_1")).toBeLessThan(ids.indexOf("phys_2"));
  });

  it("4. Prerequisite locking: locks downstream concept if prerequisite mastery score is below 0.60 threshold", () => {
    const prereqNode = createNode("prereq_concept", "چەمکی پێشینە", []);
    const dependentNode = createNode("dependent_concept", "چەمکی پاشکۆ", ["prereq_concept"]);
    const nodesMap = new Map<string, KnowledgeNode>([
      ["prereq_concept", prereqNode],
      ["dependent_concept", dependentNode],
    ]);

    // Scenario A: Prerequisite score is 0.45 (< 0.60) -> dependent is LOCKED
    const lowProfile: StudentMasteryProfile = {
      studentId: "std_01",
      overallMasteryScore: 0.45,
      activeMisconceptions: [],
      recentRecommendedActions: [],
      conceptMasteries: {
        prereq_concept: {
          conceptId: "prereq_concept",
          masteryScore: 0.45,
          status: MasteryStatus.DEVELOPING,
          totalAttempts: 3,
          consecutiveCorrect: 1,
          lastAttemptedAt: new Date().toISOString(),
          history: [],
        },
      },
    };

    const evalLocked = evaluateNodeStatus(dependentNode, lowProfile, nodesMap);
    expect(evalLocked.status).toBe("LOCKED");
    expect(evalLocked.blockedBy).toContain("چەمکی پێشینە");

    // Scenario B: Prerequisite score is 0.75 (>= 0.60) -> dependent is UNLOCKED
    const highProfile: StudentMasteryProfile = {
      ...lowProfile,
      conceptMasteries: {
        prereq_concept: {
          ...lowProfile.conceptMasteries["prereq_concept"],
          masteryScore: 0.75,
          status: MasteryStatus.PROFICIENT,
        },
      },
    };

    const evalUnlocked = evaluateNodeStatus(dependentNode, highProfile, nodesMap);
    expect(evalUnlocked.status).toBe("UNLOCKED");
    expect(evalUnlocked.blockedBy).toHaveLength(0);
  });

  it("5. Cycle detection: flags circular dependencies without hanging into an infinite recursion", () => {
    const cycleA = createNode("node_cycle_A", "خولی ئەلف", ["node_cycle_C"]);
    const cycleB = createNode("node_cycle_B", "خولی بێ", ["node_cycle_A"]);
    const cycleC = createNode("node_cycle_C", "خولی جیم", ["node_cycle_B"]);

    const cycleReport = detectKnowledgeGraphCycles([cycleA, cycleB, cycleC]);
    expect(cycleReport.hasCycle).toBe(true);
    expect(cycleReport.cycleNodes.length).toBeGreaterThan(0);

    // Topological sort on cyclical graph completes gracefully without crashing
    const safeSort = topologicalSort([cycleA, cycleB, cycleC]);
    expect(safeSort.length).toBe(3);
  });

  it("6. evaluateMomentum: classifies high, steady, and rebuilding study momentum", () => {
    const high = evaluateMomentum(85);
    expect(high.trend).toBe("RISING");
    expect(high.recommendedDifficulty).toBe(DifficultyLevel.CHALLENGING);
    expect(high.badgeLevelKu).toContain("بڵێسەدار");

    const steady = evaluateMomentum(55);
    expect(steady.trend).toBe("STABLE");
    expect(steady.recommendedDifficulty).toBe(DifficultyLevel.STANDARD);
    expect(steady.badgeLevelKu).toContain("هاوسەنگ");

    const rebuilding = evaluateMomentum(25);
    expect(rebuilding.trend).toBe("FALLING");
    expect(rebuilding.recommendedDifficulty).toBe(DifficultyLevel.EASY);
    expect(rebuilding.badgeLevelKu).toContain("هاندانە");
  });

  it("7. calculateProgressForecast: computes completion weeks and Kurdish readiness status", () => {
    const profile: StudentMasteryProfile = {
      studentId: "std_forecast",
      overallMasteryScore: 0.72,
      activeMisconceptions: [],
      recentRecommendedActions: [],
      conceptMasteries: {
        chem_acids_bases: {
          conceptId: "chem_acids_bases",
          masteryScore: 0.85,
          status: MasteryStatus.MASTERED,
          totalAttempts: 8,
          consecutiveCorrect: 6,
          lastAttemptedAt: new Date().toISOString(),
          history: [],
        },
      },
    };

    const forecast = calculateProgressForecast({
      masteryProfile: profile,
      weeklyStudyHours: 18,
    });

    expect(forecast.subjects.length).toBeGreaterThan(0);
    expect(forecast.overallCompletionDate).toBeDefined();
    expect(forecast.recommendedFocusSubjectKu).toBeDefined();
  });
});
