import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  setCachedWithTTL,
  getCachedWithTTL,
  persistMasteryProfile,
  getPersistedMasteryProfile,
  persistStudyPlan,
  getPersistedStudyPlan,
  assertSessionDataNotPersisted,
  TTL_CONFIG,
} from "../store/persistenceCache.ts";
import { curriculumSWRCache } from "../store/curriculumCache.ts";
import { migrateLegacyStudentData } from "../firebase/migrations/migrateLegacyStudentData.ts";
import { FirestorePaths } from "../firebase/firestore.ts";
import { UserDocument, SubjectMasteryDoc, StudyPlanDoc, AssessmentDoc } from "../firebase/types.ts";

test("Firestore Architecture - 1. Document & Subcollection Paths Match Optimized Schema", () => {
  const userId = "user_abc_123";
  const subjectId = "chemistry";
  const sessionId = "sess_xyz_789";
  const weekId = "2026-W46";
  const conceptId = "acid-base-ph";
  const grade = "12";
  const assessmentId = "asm_555";

  assert.strictEqual(FirestorePaths.user(userId), "users/user_abc_123");
  assert.strictEqual(FirestorePaths.mastery(userId, subjectId), "users/user_abc_123/mastery/chemistry");
  assert.strictEqual(FirestorePaths.sessions(userId), "users/user_abc_123/sessions");
  assert.strictEqual(FirestorePaths.session(userId, sessionId), "users/user_abc_123/sessions/sess_xyz_789");
  assert.strictEqual(FirestorePaths.studyPlan(userId, weekId), "users/user_abc_123/studyPlan/2026-W46");
  assert.strictEqual(
    FirestorePaths.curriculumConcept(grade, subjectId, conceptId),
    "curriculum/12/chemistry/concepts/acid-base-ph"
  );
  assert.strictEqual(FirestorePaths.assessments(), "assessments");
  assert.strictEqual(FirestorePaths.assessment(assessmentId), "assessments/asm_555");
});

test("Firestore Architecture - 2. Security Rules Contract Validation", () => {
  assert.ok(fs.existsSync("firestore.rules"), "firestore.rules file must exist");
  const rules = fs.readFileSync("firestore.rules", "utf-8");

  // Verify paths exist
  assert.ok(rules.includes("match /users/{userId}"), "Must contain users/{userId} match");
  assert.ok(rules.includes("match /mastery/{subjectId}"), "Must contain mastery/{subjectId} subcollection match");
  assert.ok(rules.includes("match /sessions/{sessionId}"), "Must contain sessions/{sessionId} subcollection match");
  assert.ok(rules.includes("match /studyPlan/{weekId}"), "Must contain studyPlan/{weekId} subcollection match");
  assert.ok(rules.includes("match /curriculum/{document=**}"), "Must contain curriculum match");
  assert.ok(rules.includes("match /assessments/{assessmentId}"), "Must contain assessments/{assessmentId} match");

  // Verify access constraints
  assert.ok(rules.includes("allow read: if true;"), "Curriculum must be readable by all");
  assert.ok(rules.includes("allow write: if isAdmin();"), "Curriculum write must be admin only");
  assert.ok(rules.includes("allow delete: if false;"), "Assessment deletion must be forbidden");
  assert.ok(rules.includes("600"), "Rate limiting (100 writes/min constraint) must be defined in rules");
});

test("Firestore Architecture - 3. Composite Indexes Configuration", () => {
  assert.ok(fs.existsSync("firestore.indexes.json"), "firestore.indexes.json must exist");
  const indexesRaw = fs.readFileSync("firestore.indexes.json", "utf-8");
  const parsed = JSON.parse(indexesRaw) as { indexes: Array<{ collectionGroup: string; fields: Array<{ fieldPath: string; order: string }> }> };

  assert.ok(Array.isArray(parsed.indexes), "indexes array required");

  // 1. sessions: (userId ASC, startTime DESC)
  const sessionIndex = parsed.indexes.find(
    (idx) =>
      idx.collectionGroup === "sessions" &&
      idx.fields.some((f) => f.fieldPath === "userId" && f.order === "ASCENDING") &&
      idx.fields.some((f) => f.fieldPath === "startTime" && f.order === "DESCENDING")
  );
  assert.ok(sessionIndex, "Index for sessions (userId ASC, startTime DESC) must exist");

  // 2. mastery: (userId ASC, subjectId ASC, lastUpdated DESC)
  const masteryIndex = parsed.indexes.find(
    (idx) =>
      idx.collectionGroup === "mastery" &&
      idx.fields.some((f) => f.fieldPath === "userId" && f.order === "ASCENDING") &&
      idx.fields.some((f) => f.fieldPath === "subjectId" && f.order === "ASCENDING") &&
      idx.fields.some((f) => f.fieldPath === "lastUpdated" && f.order === "DESCENDING")
  );
  assert.ok(masteryIndex, "Index for mastery (userId ASC, subjectId ASC, lastUpdated DESC) must exist");

  // 3. assessments: (studentId ASC, subjectId ASC, createdAt DESC)
  const assessmentIndex = parsed.indexes.find(
    (idx) =>
      idx.collectionGroup === "assessments" &&
      idx.fields.some((f) => f.fieldPath === "studentId" && f.order === "ASCENDING") &&
      idx.fields.some((f) => f.fieldPath === "subjectId" && f.order === "ASCENDING") &&
      idx.fields.some((f) => f.fieldPath === "createdAt" && f.order === "DESCENDING")
  );
  assert.ok(assessmentIndex, "Index for assessments (studentId ASC, subjectId ASC, createdAt DESC) must exist");
});

test("Caching Strategy - 4. TTL Persistence Rules for Mastery & Study Plan", () => {
  // Simulate mock window.localStorage in Node test environment
  const store = new Map<string, string>();
  (globalThis as unknown as { window: { localStorage: Storage } }).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, val: string) => store.set(key, val),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      key: (i: number) => Array.from(store.keys())[i] || null,
      length: store.size,
    } as unknown as Storage,
  };

  const userId = "student_99";
  const subjectId = "chemistry";
  const sampleMastery: SubjectMasteryDoc = {
    subjectId,
    userId,
    concepts: {
      "ph-scale": {
        conceptId: "ph-scale",
        masteryScore: 0.85,
        status: "PROFICIENT",
        consecutiveCorrect: 4,
        totalAttempts: 5,
        lastAttemptedAt: "2026-11-15T12:00:00.000Z",
      },
    },
    lastUpdated: "2026-11-15T12:00:00.000Z",
    overallScore: 85,
    studyStreak: 7,
  };

  // 1. Persist Mastery with 24hr TTL
  persistMasteryProfile(userId, subjectId, sampleMastery);
  const retrievedMastery = getPersistedMasteryProfile(userId, subjectId);
  assert.ok(retrievedMastery, "Persisted mastery must be retrievable");
  assert.strictEqual(retrievedMastery.overallScore, 85);
  assert.strictEqual(retrievedMastery.concepts["ph-scale"].masteryScore, 0.85);

  // 2. Persist Study Plan with 7day TTL
  const samplePlan: StudyPlanDoc = {
    weekId: "2026-W46",
    userId,
    days: {
      "0": [{ id: "task1", subject: "chemistry", concept: "ph-scale", estimatedMinutes: 20, type: "practice" }],
    },
    generated: "2026-11-15T12:00:00.000Z",
    completionRate: 0.5,
  };

  persistStudyPlan(userId, "2026-W46", samplePlan);
  const retrievedPlan = getPersistedStudyPlan(userId, "2026-W46");
  assert.ok(retrievedPlan, "Persisted study plan must be retrievable");
  assert.strictEqual(retrievedPlan.completionRate, 0.5);

  // 3. STRICT RULE: Session data must NEVER be persisted to localStorage
  const sessionKey = "zana.cache.session.stud_123";
  setCachedWithTTL(sessionKey, { sessionData: true }, 60000);
  assert.strictEqual(getCachedWithTTL(sessionKey), null, "Session data must be blocked from localStorage persistence");
  assert.strictEqual(assertSessionDataNotPersisted("session_123"), false);
  assert.strictEqual(assertSessionDataNotPersisted("mastery_profile"), true);
});

test("Caching Strategy - 5. Curriculum Stale-While-Revalidate (SWR) Pattern", async () => {
  curriculumSWRCache.clear();

  let fetchCount = 0;
  const mockFetcher = async () => {
    fetchCount++;
    return {
      conceptId: "acid-base-equilibrium",
      grade: "12",
      subject: "chemistry",
      content: "Acid Base Equilibrium content",
      difficulty: "standard",
      prerequisites: [],
      chunkIds: ["chk_1"],
      bloomsLevel: "UNDERSTAND",
      learningObjective: "Understand equilibrium expressions",
    };
  };

  // First fetch: cold cache -> fetches fresh data
  const res1 = await curriculumSWRCache.getWithSWR("12", "chemistry", "acid-base-equilibrium", mockFetcher);
  assert.strictEqual(fetchCount, 1);
  assert.strictEqual(res1.isStale, false);
  assert.strictEqual(res1.data?.conceptId, "acid-base-equilibrium");

  // Second fetch: warm cache -> returns cached data immediately without incrementing fetchCount
  const res2 = await curriculumSWRCache.getWithSWR("12", "chemistry", "acid-base-equilibrium", mockFetcher);
  assert.strictEqual(fetchCount, 1);
  assert.strictEqual(res2.isStale, false);
  assert.strictEqual(res2.data?.content, "Acid Base Equilibrium content");
});
