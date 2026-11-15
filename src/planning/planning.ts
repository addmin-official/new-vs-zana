import { DifficultyLevel, MasteryStatus, StudentMasteryProfile } from "../learning/domain/MasteryTypes.ts";

// ============================================================================
// 1. KNOWLEDGE GRAPH TYPES & STATIC CURRICULUM DEFINITIONS
// ============================================================================

export interface KnowledgeNode {
  id: string;
  nameKu: string;
  subject: string;
  subjectNameKu: string;
  grade: string;
  prerequisites: string[]; // Concept IDs that must be mastered first (score >= 0.6)
  estimatedMinutes: number;
  unitNameKu: string;
  difficulty: DifficultyLevel;
  position: { x: number; y: number }; // Relative coordinates for SVG tree layout (0-100 scale)
}

export type NodeMasteryStatus = "LOCKED" | "UNLOCKED" | "MASTERED";

export interface EvaluatedKnowledgeNode extends KnowledgeNode {
  status: NodeMasteryStatus;
  masteryScore: number;
  blockedBy: string[]; // IDs of prerequisites that are currently < 0.6
}

/**
 * Subject-level knowledge graphs statically defined per subject and grade.
 * Models full curricular dependency networks for Kurdistan Grade 12.
 */
export const STATIC_KNOWLEDGE_GRAPHS: Record<string, KnowledgeNode[]> = {
  // Chemistry Grade 12
  "chemistry-12": [
    {
      id: "chem_g12_solutions",
      nameKu: "گیراوەکان و خەستی",
      subject: "chemistry",
      subjectNameKu: "کیمیا",
      grade: "12",
      prerequisites: [],
      estimatedMinutes: 30,
      unitNameKu: "بەشی یەکەم: گیراوە ئاوییەکان",
      difficulty: DifficultyLevel.FOUNDATION,
      position: { x: 20, y: 15 },
    },
    {
      id: "chem_g12_acids_bases",
      nameKu: "ترش و تفتەکان (تیۆرییەکان)",
      subject: "chemistry",
      subjectNameKu: "کیمیا",
      grade: "12",
      prerequisites: ["chem_g12_solutions"],
      estimatedMinutes: 35,
      unitNameKu: "بەشی یەکەم: گیراوە ئاوییەکان",
      difficulty: DifficultyLevel.STANDARD,
      position: { x: 50, y: 15 },
    },
    {
      id: "chem_g12_ph_scale",
      nameKu: "پێوەری pH و هایدرۆنیۆم",
      subject: "chemistry",
      subjectNameKu: "کیمیا",
      grade: "12",
      prerequisites: ["chem_g12_acids_bases"],
      estimatedMinutes: 40,
      unitNameKu: "بەشی یەکەم: گیراوە ئاوییەکان",
      difficulty: DifficultyLevel.STANDARD,
      position: { x: 80, y: 15 },
    },
    {
      id: "chem_g12_titration",
      nameKu: "تیتراسیۆن و خاڵی هاوتایی",
      subject: "chemistry",
      subjectNameKu: "کیمیا",
      grade: "12",
      prerequisites: ["chem_g12_ph_scale"],
      estimatedMinutes: 45,
      unitNameKu: "بەشی یەکەم: گیراوە ئاوییەکان",
      difficulty: DifficultyLevel.CHALLENGING,
      position: { x: 20, y: 50 },
    },
    {
      id: "chem_g12_equilibrium",
      nameKu: "هاوسەنگیی کیمیایی و لۆشاتلییە",
      subject: "chemistry",
      subjectNameKu: "کیمیا",
      grade: "12",
      prerequisites: ["chem_g12_solutions"],
      estimatedMinutes: 40,
      unitNameKu: "بەشی دووەم: هاوسەنگی",
      difficulty: DifficultyLevel.STANDARD,
      position: { x: 50, y: 50 },
    },
    {
      id: "chem_g12_redox",
      nameKu: "ئۆکسان و داڕزان",
      subject: "chemistry",
      subjectNameKu: "کیمیا",
      grade: "12",
      prerequisites: ["chem_g12_equilibrium"],
      estimatedMinutes: 40,
      unitNameKu: "بەشی سێیەم: کیمیای کارەبایی",
      difficulty: DifficultyLevel.CHALLENGING,
      position: { x: 80, y: 50 },
    },
    {
      id: "chem_g12_electrochem",
      nameKu: "خانە گالڤانییەکان و کارەبا",
      subject: "chemistry",
      subjectNameKu: "کیمیا",
      grade: "12",
      prerequisites: ["chem_g12_redox", "chem_g12_titration"],
      estimatedMinutes: 50,
      unitNameKu: "بەشی سێیەم: کیمیای کارەبایی",
      difficulty: DifficultyLevel.ADVANCED,
      position: { x: 50, y: 85 },
    },
  ],

  // Physics Grade 12
  "physics-12": [
    {
      id: "phys_g12_electric_force",
      nameKu: "یاسای کۆڵۆم و هێزی کارەبایی",
      subject: "physics",
      subjectNameKu: "فیزیا",
      grade: "12",
      prerequisites: [],
      estimatedMinutes: 30,
      unitNameKu: "بەشی یەکەم: کارەبا",
      difficulty: DifficultyLevel.FOUNDATION,
      position: { x: 25, y: 20 },
    },
    {
      id: "phys_g12_electric_field",
      nameKu: "بواری کارەبایی و هێڵەکان",
      subject: "physics",
      subjectNameKu: "فیزیا",
      grade: "12",
      prerequisites: ["phys_g12_electric_force"],
      estimatedMinutes: 35,
      unitNameKu: "بەشی یەکەم: کارەبا",
      difficulty: DifficultyLevel.STANDARD,
      position: { x: 75, y: 20 },
    },
    {
      id: "phys_g12_potential",
      nameKu: "توانستی کارەبایی و بارگەگر",
      subject: "physics",
      subjectNameKu: "فیزیا",
      grade: "12",
      prerequisites: ["phys_g12_electric_field"],
      estimatedMinutes: 40,
      unitNameKu: "بەشی دووەم: توانست",
      difficulty: DifficultyLevel.STANDARD,
      position: { x: 50, y: 50 },
    },
    {
      id: "phys_g12_circuits",
      nameKu: "بازنە کارەباییەکان و یاسای ئۆم",
      subject: "physics",
      subjectNameKu: "فیزیا",
      grade: "12",
      prerequisites: ["phys_g12_potential"],
      estimatedMinutes: 45,
      unitNameKu: "بەشی سێیەم: تەزووی بەردەوام",
      difficulty: DifficultyLevel.CHALLENGING,
      position: { x: 25, y: 80 },
    },
    {
      id: "phys_g12_magnetism",
      nameKu: "بواری موگناتیسی و هێزی لۆرێنتز",
      subject: "physics",
      subjectNameKu: "فیزیا",
      grade: "12",
      prerequisites: ["phys_g12_circuits"],
      estimatedMinutes: 50,
      unitNameKu: "بەشی چوارەم: کارۆموگناتیسی",
      difficulty: DifficultyLevel.ADVANCED,
      position: { x: 75, y: 80 },
    },
  ],

  // Mathematics Grade 12
  "math-12": [
    {
      id: "math_g12_functions",
      nameKu: "نەخشەکان و مەودا",
      subject: "math",
      subjectNameKu: "بیرکاری",
      grade: "12",
      prerequisites: [],
      estimatedMinutes: 30,
      unitNameKu: "بەشی یەکەم: نەخشەکان",
      difficulty: DifficultyLevel.FOUNDATION,
      position: { x: 30, y: 20 },
    },
    {
      id: "math_g12_limits",
      nameKu: "تەپۆڵۆجی و غایەتەکان",
      subject: "math",
      subjectNameKu: "بیرکاری",
      grade: "12",
      prerequisites: ["math_g12_functions"],
      estimatedMinutes: 35,
      unitNameKu: "بەشی یەکەم: غایەت و بەردەوامی",
      difficulty: DifficultyLevel.STANDARD,
      position: { x: 70, y: 20 },
    },
    {
      id: "math_g12_derivatives",
      nameKu: "یاساکانی داتاشراو",
      subject: "math",
      subjectNameKu: "بیرکاری",
      grade: "12",
      prerequisites: ["math_g12_limits"],
      estimatedMinutes: 45,
      unitNameKu: "بەشی دووەم: داتاشراو",
      difficulty: DifficultyLevel.CHALLENGING,
      position: { x: 50, y: 55 },
    },
    {
      id: "math_g12_integration",
      nameKu: "تەواوکاری و ڕووبەرەکان",
      subject: "math",
      subjectNameKu: "بیرکاری",
      grade: "12",
      prerequisites: ["math_g12_derivatives"],
      estimatedMinutes: 50,
      unitNameKu: "بەشی سێیەم: تەواوکاری",
      difficulty: DifficultyLevel.ADVANCED,
      position: { x: 50, y: 85 },
    },
  ],

  // Biology Grade 12
  "biology-12": [
    {
      id: "bio_g12_cells",
      nameKu: "خانە و ترشە ناوەکییەکان",
      subject: "biology",
      subjectNameKu: "زیندەوەرزانی",
      grade: "12",
      prerequisites: [],
      estimatedMinutes: 30,
      unitNameKu: "بەشی یەکەم: بۆماوەزانی مۆلیکولی",
      difficulty: DifficultyLevel.FOUNDATION,
      position: { x: 30, y: 20 },
    },
    {
      id: "bio_g12_dna_rna",
      nameKu: "دروستکردنی پڕۆتین لە DNA و RNA",
      subject: "biology",
      subjectNameKu: "زیندەوەرزانی",
      grade: "12",
      prerequisites: ["bio_g12_cells"],
      estimatedMinutes: 40,
      unitNameKu: "بەشی یەکەم: بۆماوەزانی مۆلیکولی",
      difficulty: DifficultyLevel.STANDARD,
      position: { x: 70, y: 20 },
    },
    {
      id: "bio_g12_genetics",
      nameKu: "یاساکانی مەندەل و نەخۆشییە بۆماوەییەکان",
      subject: "biology",
      subjectNameKu: "زیندەوەرزانی",
      grade: "12",
      prerequisites: ["bio_g12_dna_rna"],
      estimatedMinutes: 45,
      unitNameKu: "بەشی دووەم: بۆماوە",
      difficulty: DifficultyLevel.CHALLENGING,
      position: { x: 50, y: 65 },
    },
  ],
};

/**
 * Normalizes subject-grade lookup key.
 */
export function getGraphKey(subject: string, grade = "12"): string {
  const normSub = subject.toLowerCase().replace(/^(subject-|g12-)/, "");
  const normGrade = grade.replace(/\D/g, "") || "12";
  return `${normSub}-${normGrade}`;
}

/**
 * Retrieves the static knowledge graph for a given subject and grade.
 */
export function getSubjectKnowledgeGraph(subject: string, grade = "12"): KnowledgeNode[] {
  const key = getGraphKey(subject, grade);
  if (STATIC_KNOWLEDGE_GRAPHS[key]) {
    return STATIC_KNOWLEDGE_GRAPHS[key];
  }
  // Fallback to chemistry-12 if subject graph not found
  return STATIC_KNOWLEDGE_GRAPHS["chemistry-12"];
}

/**
 * Performs cycle-safe topological sort (Kahn's Algorithm) to generate the optimal learning order.
 * Guarantees all prerequisites are ordered before dependent concepts.
 */
export function topologicalSort(nodes: KnowledgeNode[]): KnowledgeNode[] {
  const nodeMap = new Map<string, KnowledgeNode>();
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  }

  // Build graph within the provided nodes set
  for (const node of nodes) {
    for (const prereqId of node.prerequisites) {
      if (nodeMap.has(prereqId)) {
        adjList.get(prereqId)!.push(node.id);
        inDegree.set(node.id, (inDegree.get(node.id) || 0) + 1);
      }
    }
  }

  // Queue of nodes with 0 in-degree (no prerequisites)
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const sorted: KnowledgeNode[] = [];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    sorted.push(nodeMap.get(currentId)!);

    for (const neighborId of adjList.get(currentId) || []) {
      const newDeg = (inDegree.get(neighborId) || 1) - 1;
      inDegree.set(neighborId, newDeg);
      if (newDeg === 0) {
        queue.push(neighborId);
      }
    }
  }

  // Cycle recovery: if graph had cycles, append remaining unvisited nodes
  if (sorted.length < nodes.length) {
    for (const node of nodes) {
      if (!sorted.some((s) => s.id === node.id)) {
        sorted.push(node);
      }
    }
  }

  return sorted;
}

/**
 * Detects whether a knowledge graph contains cycles and returns circular nodes.
 */
export function detectKnowledgeGraphCycles(nodes: KnowledgeNode[]): { hasCycle: boolean; cycleNodes: string[] } {
  const nodeMap = new Map<string, KnowledgeNode>();
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  }

  for (const node of nodes) {
    for (const prereqId of node.prerequisites) {
      if (nodeMap.has(prereqId)) {
        adjList.get(prereqId)!.push(node.id);
        inDegree.set(node.id, (inDegree.get(node.id) || 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  let visitedCount = 0;
  while (queue.length > 0) {
    const curr = queue.shift()!;
    visitedCount++;
    for (const neighbor of adjList.get(curr) || []) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  const hasCycle = visitedCount < nodes.length;
  const cycleNodes = nodes.filter((n) => (inDegree.get(n.id) || 0) > 0).map((n) => n.id);
  return { hasCycle, cycleNodes };
}

/**
 * Evaluates node lock/mastery state against a student's mastery profile.
 * - MASTERED: masteryScore >= 0.8
 * - UNLOCKED: all prerequisites mastered (score >= 0.6)
 * - LOCKED: any prerequisite has masteryScore < 0.6
 */
export function evaluateNodeStatus(
  node: KnowledgeNode,
  masteryProfile: StudentMasteryProfile,
  allNodesMap: Map<string, KnowledgeNode>
): { status: NodeMasteryStatus; masteryScore: number; blockedBy: string[] } {
  const currentMastery = masteryProfile.conceptMasteries[node.id];
  const score = currentMastery ? currentMastery.masteryScore : 0.0;

  // Blocked concepts check: if any prerequisite < 0.6, lock this node
  const blockedBy: string[] = [];
  for (const prereqId of node.prerequisites) {
    const prereqMastery = masteryProfile.conceptMasteries[prereqId];
    const prereqScore = prereqMastery ? prereqMastery.masteryScore : 0.0;
    if (prereqScore < 0.6) {
      const prereqNode = allNodesMap.get(prereqId);
      blockedBy.push(prereqNode ? prereqNode.nameKu : prereqId);
    }
  }

  if (blockedBy.length > 0) {
    return { status: "LOCKED", masteryScore: score, blockedBy };
  }

  if (score >= 0.8 || (currentMastery && currentMastery.status === MasteryStatus.MASTERED)) {
    return { status: "MASTERED", masteryScore: score, blockedBy: [] };
  }

  return { status: "UNLOCKED", masteryScore: score, blockedBy: [] };
}

/**
 * Returns full evaluated knowledge graph for UI rendering.
 */
export function getEvaluatedKnowledgeGraph(
  subject: string,
  grade: string,
  masteryProfile: StudentMasteryProfile
): EvaluatedKnowledgeNode[] {
  const rawNodes = getSubjectKnowledgeGraph(subject, grade);
  const nodesMap = new Map(rawNodes.map((n) => [n.id, n]));

  return rawNodes.map((node) => {
    const evaluated = evaluateNodeStatus(node, masteryProfile, nodesMap);
    return {
      ...node,
      status: evaluated.status,
      masteryScore: evaluated.masteryScore,
      blockedBy: evaluated.blockedBy,
    };
  });
}

// ============================================================================
// 2. INTELLIGENT WEEKLY PLAN GENERATOR
// ============================================================================

export interface WeeklyPlanItem {
  id: string;
  dayIndex: number; // 0 (Sat) through 6 (Fri)
  dayNameKu: string;
  subject: string;
  subjectNameKu: string;
  conceptId: string;
  concept: string; // Kurdish concept title
  estimatedMinutes: number;
  type: "review" | "new" | "practice";
  reasonKu: string;
  isCompleted?: boolean;
}

export interface WeeklyPlanDay {
  dayIndex: number;
  dayNameKu: string;
  totalMinutes: number;
  items: WeeklyPlanItem[];
}

export interface IntelligentWeeklyPlan {
  totalWeeklyMinutes: number;
  availableStudyHours: number;
  days: WeeklyPlanDay[];
  allItems: WeeklyPlanItem[];
  generatedAt: string;
}

export const KURDISH_WEEK_DAYS = [
  { dayIndex: 0, dayNameKu: "شەممە" },
  { dayIndex: 1, dayNameKu: "یەکشەممە" },
  { dayIndex: 2, dayNameKu: "دووشەممە" },
  { dayIndex: 3, dayNameKu: "سێشەممە" },
  { dayIndex: 4, dayNameKu: "چوارشەممە" },
  { dayIndex: 5, dayNameKu: "پێنجشەممە" },
  { dayIndex: 6, dayNameKu: "هەینی" },
];

/**
 * Intelligent 7-Day Plan Generator.
 *
 * Prioritization:
 * 1. Concepts due for review (Spaced Repetition SM-2)
 * 2. Next unlocked concepts in knowledge graph (topologically ordered)
 * 3. Weak concepts (DDI < 0.5 or score < 0.6)
 */
export function generateIntelligentWeeklyPlan(params: {
  studentProfile?: { studentId: string; grade?: string; activeSubject?: string };
  masteryProfile: StudentMasteryProfile;
  availableStudyHoursPerWeek: number;
}): IntelligentWeeklyPlan {
  const grade = params.studentProfile?.grade || "12";
  const activeSubject = params.studentProfile?.activeSubject || "chemistry";
  const totalTargetMinutes = Math.max(60, params.availableStudyHoursPerWeek * 60);

  // Pool of candidate tasks categorized by priority
  const reviewCandidates: WeeklyPlanItem[] = [];
  const nextUnlockedCandidates: WeeklyPlanItem[] = [];
  const weakCandidates: WeeklyPlanItem[] = [];

  const subjects = [activeSubject, "physics", "math", "biology"];
  const nowTime = new Date().toISOString();

  for (const subj of subjects) {
    const rawNodes = getSubjectKnowledgeGraph(subj, grade);
    const sortedNodes = topologicalSort(rawNodes);
    const nodesMap = new Map(rawNodes.map((n) => [n.id, n]));

    for (const node of sortedNodes) {
      const mastery = params.masteryProfile.conceptMasteries[node.id];
      const evaluated = evaluateNodeStatus(node, params.masteryProfile, nodesMap);

      // 1. Spaced Repetition Review Candidate:
      // When review is due by SM-2 schedule or explicitly flagged as NEEDS_REVIEW
      const isReviewDue =
        mastery &&
        (mastery.status === MasteryStatus.NEEDS_REVIEW ||
          (mastery.nextReviewDue && mastery.nextReviewDue <= nowTime));

      if (isReviewDue && evaluated.status !== "LOCKED") {
        reviewCandidates.push({
          id: `plan_rev_${node.id}`,
          dayIndex: 0,
          dayNameKu: "",
          subject: node.subject,
          subjectNameKu: node.subjectNameKu,
          conceptId: node.id,
          concept: node.nameKu,
          estimatedMinutes: 25,
          type: "review",
          reasonKu: "پێداچوونەوەی دووبارەی مەودادار (Spaced Repetition)",
        });
        continue;
      }

      // 2. Weak Concept Candidate (DDI < 0.5 or low accuracy under practice):
      const isWeak =
        mastery &&
        ((mastery.ddi !== undefined && mastery.ddi < 0.5) ||
          (mastery.masteryScore < 0.6 && mastery.totalAttempts >= 2));

      if (isWeak && evaluated.status !== "LOCKED") {
        weakCandidates.push({
          id: `plan_weak_${node.id}`,
          dayIndex: 0,
          dayNameKu: "",
          subject: node.subject,
          subjectNameKu: node.subjectNameKu,
          conceptId: node.id,
          concept: node.nameKu,
          estimatedMinutes: 30,
          type: "practice",
          reasonKu: "ڕاهێنانی خەست بۆ بەرزکردنەوەی ئاستی لاواز (DDI < 0.5)",
        });
        continue;
      }

      // 3. Next Unlocked Concept Candidate:
      if (evaluated.status === "UNLOCKED" && (!mastery || mastery.masteryScore < 0.6)) {
        nextUnlockedCandidates.push({
          id: `plan_new_${node.id}`,
          dayIndex: 0,
          dayNameKu: "",
          subject: node.subject,
          subjectNameKu: node.subjectNameKu,
          conceptId: node.id,
          concept: node.nameKu,
          estimatedMinutes: 35,
          type: "new",
          reasonKu: "چەمکی نوێی کراوە لەسەر نەخشەی مەعریفە",
        });
      }
    }
  }

  // Combine by priority pipeline: Review first -> Next Unlocked -> Weak Concepts
  const prioritizedQueue: WeeklyPlanItem[] = [
    ...reviewCandidates,
    ...nextUnlockedCandidates,
    ...weakCandidates,
  ];

  // Distribute items across the 7 days of the Kurdistan school week (Sat..Fri)
  const days: WeeklyPlanDay[] = KURDISH_WEEK_DAYS.map((d) => ({
    dayIndex: d.dayIndex,
    dayNameKu: d.dayNameKu,
    totalMinutes: 0,
    items: [],
  }));

  const allItems: WeeklyPlanItem[] = [];
  const dailyTargetMinutes = Math.round(totalTargetMinutes / 7);

  let currentDay = 0;
  for (const item of prioritizedQueue) {
    // If Friday (index 6, holiday), keep it lighter if possible
    const dayTarget = currentDay === 6 ? Math.round(dailyTargetMinutes * 0.5) : dailyTargetMinutes;

    if (days[currentDay].totalMinutes + item.estimatedMinutes > dayTarget * 1.5 && currentDay < 6) {
      currentDay++;
    }

    const assignedItem: WeeklyPlanItem = {
      ...item,
      dayIndex: days[currentDay].dayIndex,
      dayNameKu: days[currentDay].dayNameKu,
      isCompleted: false,
    };

    days[currentDay].items.push(assignedItem);
    days[currentDay].totalMinutes += assignedItem.estimatedMinutes;
    allItems.push(assignedItem);

    if (allItems.reduce((sum, it) => sum + it.estimatedMinutes, 0) >= totalTargetMinutes) {
      break;
    }

    currentDay = (currentDay + 1) % 7;
  }

  // Fallback: If student has completed everything or queue was short, add reinforcing items
  if (allItems.length === 0) {
    const fallbackNode = STATIC_KNOWLEDGE_GRAPHS["chemistry-12"][0];
    const fallbackItem: WeeklyPlanItem = {
      id: "plan_fallback_1",
      dayIndex: 0,
      dayNameKu: "شەممە",
      subject: fallbackNode.subject,
      subjectNameKu: fallbackNode.subjectNameKu,
      conceptId: fallbackNode.id,
      concept: fallbackNode.nameKu,
      estimatedMinutes: 30,
      type: "practice",
      reasonKu: "ڕاهێنانی خۆڕاگری و جێگیرکردنی زانیارییەکان",
    };
    days[0].items.push(fallbackItem);
    days[0].totalMinutes += 30;
    allItems.push(fallbackItem);
  }

  return {
    totalWeeklyMinutes: allItems.reduce((acc, it) => acc + it.estimatedMinutes, 0),
    availableStudyHours: params.availableStudyHoursPerWeek,
    days,
    allItems,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// 3. PROGRESS FORECASTING
// ============================================================================

export interface SubjectForecast {
  subject: string;
  subjectNameKu: string;
  totalConcepts: number;
  masteredConcepts: number;
  percentMastered: number;
  velocityPerWeek: number; // Concepts mastered per week
  weeksToReadiness: number; // All concepts >= PROFICIENT
  confidenceIntervalWeeks: { min: number; max: number };
  estimatedCompletionDate: string; // YYYY-MM-DD
  statusKu: string;
}

export interface ProgressForecastResult {
  overallPercentMastered: number;
  consistencyScore: number; // 0.0 to 1.0
  overallWeeksToReadiness: number;
  overallCompletionDate: string;
  confidenceIntervalWeeks: { min: number; max: number };
  subjects: SubjectForecast[];
  recommendedFocusSubjectKu: string;
}

/**
 * Calculates learning velocity and forecasts exam readiness date with a +/-15% confidence interval.
 */
export function calculateProgressForecast(params: {
  masteryProfile: StudentMasteryProfile;
  grade?: string;
  weeklyStudyHours?: number;
}): ProgressForecastResult {
  const grade = params.grade || "12";
  const subjects = ["chemistry", "physics", "math", "biology"];

  // Compute consistency score from streak data (0.0 to 1.0)
  const streak = params.masteryProfile.streak?.currentStreak || 0;
  const consistencyScore = Math.min(1.0, Math.max(0.4, Number((0.5 + streak * 0.05).toFixed(2))));

  // Calibrated velocity: concepts mastered per week (default 2.5 per 15 study hours)
  const studyHours = params.weeklyStudyHours || 20;
  const baseVelocity = Number(Math.max(1.0, (studyHours / 6.0)).toFixed(1));

  let totalCurriculumConcepts = 0;
  let totalMasteredConcepts = 0;
  let maxWeeksNeeded = 0;
  const subjectForecasts: SubjectForecast[] = [];

  for (const subj of subjects) {
    const nodes = getSubjectKnowledgeGraph(subj, grade);
    const totalCount = nodes.length;
    let masteredCount = 0;

    for (const node of nodes) {
      const mastery = params.masteryProfile.conceptMasteries[node.id];
      if (mastery && mastery.masteryScore >= 0.6) {
        masteredCount++;
      }
    }

    const remaining = Math.max(0, totalCount - masteredCount);
    const weeksNeeded = Number((remaining / baseVelocity).toFixed(1));
    if (weeksNeeded > maxWeeksNeeded) {
      maxWeeksNeeded = weeksNeeded;
    }

    // Confidence interval: +/- 15%
    const minWeeks = Number((weeksNeeded * 0.85).toFixed(1));
    const maxWeeks = Number((weeksNeeded * 1.15).toFixed(1));

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + Math.round(weeksNeeded * 7));
    const dateStr = completionDate.toISOString().split("T")[0];

    const pct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;
    const subjNameKu = nodes[0]?.subjectNameKu || subj;

    let statusKu = "لە ڕێڕەوی تەواوکردندایە";
    if (pct >= 90) statusKu = "ئامادەیی تەواو بۆ وەزاری (Ready)";
    else if (pct >= 50) statusKu = "پێشکەوتنی باش (In Progress)";
    else statusKu = "پێویستی بە چڕکردنەوەی هەوڵە (Focus Needed)";

    subjectForecasts.push({
      subject: subj,
      subjectNameKu: subjNameKu,
      totalConcepts: totalCount,
      masteredConcepts: masteredCount,
      percentMastered: pct,
      velocityPerWeek: baseVelocity,
      weeksToReadiness: weeksNeeded,
      confidenceIntervalWeeks: { min: minWeeks, max: maxWeeks },
      estimatedCompletionDate: dateStr,
      statusKu,
    });

    totalCurriculumConcepts += totalCount;
    totalMasteredConcepts += masteredCount;
  }

  const overallPercent = totalCurriculumConcepts > 0
    ? Math.round((totalMasteredConcepts / totalCurriculumConcepts) * 100)
    : 0;

  const overallDate = new Date();
  overallDate.setDate(overallDate.getDate() + Math.round(maxWeeksNeeded * 7));

  // Determine subject needing greatest focus
  const sortedByLowestMastery = [...subjectForecasts].sort((a, b) => a.percentMastered - b.percentMastered);
  const recommendedFocusSubjectKu = sortedByLowestMastery[0]?.subjectNameKu || "کیمیا";

  return {
    overallPercentMastered: overallPercent,
    consistencyScore,
    overallWeeksToReadiness: maxWeeksNeeded,
    overallCompletionDate: overallDate.toISOString().split("T")[0],
    confidenceIntervalWeeks: {
      min: Number((maxWeeksNeeded * 0.85).toFixed(1)),
      max: Number((maxWeeksNeeded * 1.15).toFixed(1)),
    },
    subjects: subjectForecasts,
    recommendedFocusSubjectKu,
  };
}

// ============================================================================
// 4. STREAK AND MOMENTUM SYSTEM
// ============================================================================

export interface MomentumScoreResult {
  momentumScore: number; // Clamped 0–100
  recommendedDifficulty: DifficultyLevel;
  difficultyRecommendationKu: string;
  badgeLevelKu: string;
  trend: "RISING" | "STABLE" | "FALLING";
}

/**
 * Calculates the dynamic student momentum score (0–100):
 * - +10 per day studied
 * - +5 per concept reaching PROFICIENT (>= 0.60)
 * - +15 per concept reaching MASTERED (>= 0.80)
 * - -20 per missed scheduled session
 * - -5 per day inactive
 */
export function calculateMomentumScore(params: {
  daysStudied: number;
  conceptsProficient: number;
  conceptsMastered: number;
  missedSessions: number;
  daysInactive: number;
  baselineMomentum?: number;
}): number {
  const baseline = params.baselineMomentum ?? 50;

  const rawScore =
    baseline +
    params.daysStudied * 10 +
    params.conceptsProficient * 5 +
    params.conceptsMastered * 15 -
    params.missedSessions * 20 -
    params.daysInactive * 5;

  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

/**
 * Evaluates student momentum and determines daily plan difficulty recommendation.
 */
export function evaluateMomentum(momentumScore: number): MomentumScoreResult {
  const safeScore = Math.max(0, Math.min(100, momentumScore));

  if (safeScore >= 75) {
    return {
      momentumScore: safeScore,
      recommendedDifficulty: DifficultyLevel.CHALLENGING,
      difficultyRecommendationKu: "وزەی بەرز و لەبار: ڕاسپاردە دەکرێت بە شیکارکردنی پرسیاری ئاستی ئاڵۆز و وەزاری.",
      badgeLevelKu: "وزەی بڵێسەدار 🔥 (High Momentum)",
      trend: "RISING",
    };
  }

  if (safeScore >= 40) {
    return {
      momentumScore: safeScore,
      recommendedDifficulty: DifficultyLevel.STANDARD,
      difficultyRecommendationKu: "ڕێڕەوی جێگیر: پاراستنی سەنگ بە وەڵامدانەوەی پرسیارە ستانداردەکان.",
      badgeLevelKu: "خوێندنی هاوسەنگ ⚡ (Steady Momentum)",
      trend: "STABLE",
    };
  }

  return {
    momentumScore: safeScore,
    recommendedDifficulty: DifficultyLevel.EASY,
    difficultyRecommendationKu: "گێڕانەوەی هاندان: ڕاسپاردە دەکرێت بە شیکارکردنی چەمک و پرسیاری سادە بۆ دروستکردنەوەی بڕوابەخۆبوون.",
    badgeLevelKu: "پێویستی بە هاندانە 🛡️ (Rebuilding Momentum)",
    trend: "FALLING",
  };
}
