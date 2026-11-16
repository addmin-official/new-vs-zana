import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  openOfflineDatabase,
  closeOfflineDatabase,
  saveCurriculumConcept,
  getCurriculumConcept,
  getCurriculumBySubject,
  evictExpiredCurriculum,
  saveMasteryLocal,
  getMasteryLocal,
  enqueueSyncItem,
  getPendingSyncItems,
  removeSyncItem,
  saveQuestions,
  getQuestionsBySubject,
  getQuestionsByConcept,
  saveAiResponse,
  getCachedAiResponse,
  generateAiCacheKey,
  clearStore,
  countStore,
} from "../../offline/offlineStorage.ts";
import {
  enqueue,
  startSync,
  applyOptimisticMastery,
  registerSyncHandler,
  unregisterSyncHandler,
  subscribeSyncEvents,
  calculateBackoffMs,
  getFailedItems,
  SyncEvent,
} from "../../offline/syncQueue.ts";
import {
  getOfflineTutorResponse,
  preGenerateAndCacheConcept,
  OFFLINE_BANNER_NOTICE,
} from "../../offline/offlineAiTutor.ts";
import {
  downloadSubject,
  isAvailableOffline,
  deleteOfflineSubject,
  autoEvictIfNeeded,
  getStorageUsage,
} from "../../offline/offlineManager.ts";

/**
 * Robust In-Memory Mock IndexedDB for Unit Testing
 */
class MockIDBRequest {
  public result: any = null;
  public error: any = null;
  public onsuccess: ((e: any) => void) | null = null;
  public onerror: ((e: any) => void) | null = null;

  triggerSuccess(res: any) {
    this.result = res;
    if (this.onsuccess) {
      this.onsuccess({ target: this });
    }
  }

  triggerError(err: any) {
    this.error = err;
    if (this.onerror) {
      this.onerror({ target: this });
    }
  }
}

class MockIDBIndex {
  constructor(private store: MockIDBObjectStore, private fieldName: string) {}

  getAll(queryKey?: any): MockIDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      const records = Array.from(this.store.data.values()).filter((item: any) => {
        if (queryKey === undefined) return true;
        return String(item[this.fieldName]) === String(queryKey);
      });
      req.triggerSuccess(records);
    }, 0);
    return req;
  }

  get(queryKey: any): MockIDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      const found = Array.from(this.store.data.values()).find(
        (item: any) => String(item[this.fieldName]) === String(queryKey)
      );
      req.triggerSuccess(found || null);
    }, 0);
    return req;
  }
}

class MockIDBObjectStore {
  public data = new Map<string, any>();
  public indexes = new Map<string, MockIDBIndex>();
  private autoId = 1;

  constructor(public name: string, public options?: { keyPath?: string; autoIncrement?: boolean }) {}

  createIndex(indexName: string, keyPath: string, _opts?: any) {
    const idx = new MockIDBIndex(this, keyPath);
    this.indexes.set(indexName, idx);
    return idx;
  }

  index(indexName: string): MockIDBIndex {
    const idx = this.indexes.get(indexName);
    if (!idx) throw new Error(`Index ${indexName} not found on store ${this.name}`);
    return idx;
  }

  get(key: any): MockIDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      const val = this.data.get(String(key));
      req.triggerSuccess(val ? JSON.parse(JSON.stringify(val)) : null);
    }, 0);
    return req;
  }

  put(value: any): MockIDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      let key = this.options?.keyPath ? value[this.options.keyPath] : undefined;
      if (this.options?.autoIncrement && key === undefined) {
        key = this.autoId++;
        value.id = key;
      }
      this.data.set(String(key), JSON.parse(JSON.stringify(value)));
      req.triggerSuccess(key);
    }, 0);
    return req;
  }

  delete(key: any): MockIDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      this.data.delete(String(key));
      req.triggerSuccess(undefined);
    }, 0);
    return req;
  }

  getAll(): MockIDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      const items = Array.from(this.data.values()).map((v) => JSON.parse(JSON.stringify(v)));
      req.triggerSuccess(items);
    }, 0);
    return req;
  }

  clear(): MockIDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      this.data.clear();
      req.triggerSuccess(undefined);
    }, 0);
    return req;
  }

  count(): MockIDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      req.triggerSuccess(this.data.size);
    }, 0);
    return req;
  }
}

class MockIDBTransaction {
  public oncomplete: (() => void) | null = null;
  public onerror: ((err: any) => void) | null = null;

  constructor(private db: MockIDBDatabase, public storeNames: string[], public mode: string) {
    setTimeout(() => {
      if (this.oncomplete) this.oncomplete();
    }, 5);
  }

  objectStore(name: string): MockIDBObjectStore {
    const store = this.db.stores.get(name);
    if (!store) throw new Error(`ObjectStore ${name} does not exist`);
    return store;
  }
}

class MockIDBDatabase {
  public stores = new Map<string, MockIDBObjectStore>();
  public onversionchange: (() => void) | null = null;

  get objectStoreNames(): any {
    const names = Array.from(this.stores.keys());
    return {
      contains: (n: string) => names.includes(n),
      length: names.length,
      item: (i: number) => names[i],
    };
  }

  createObjectStore(name: string, options?: any): MockIDBObjectStore {
    const store = new MockIDBObjectStore(name, options);
    this.stores.set(name, store);
    return store;
  }

  transaction(storeNames: string | string[], mode: string = "readonly"): MockIDBTransaction {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    return new MockIDBTransaction(this, names, mode);
  }

  close() {}
}

class MockIDBFactory {
  public db = new MockIDBDatabase();

  open(name: string, version: number): MockIDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      // Trigger upgradeneeded
      const upgradeEvent = { target: req };
      (req as any).result = this.db;
      if ((req as any).onupgradeneeded) {
        (req as any).onupgradeneeded(upgradeEvent);
      }
      req.triggerSuccess(this.db);
    }, 0);
    return req;
  }
}

describe("ZANA Offline Subsystem", () => {
  let mockFactory: MockIDBFactory;

  beforeEach(() => {
    mockFactory = new MockIDBFactory();
    // Inject mock into window.indexedDB
    (window as any).indexedDB = mockFactory;
    closeOfflineDatabase();
  });

  afterEach(() => {
    closeOfflineDatabase();
    vi.restoreAllMocks();
  });

  describe("1. Offline Storage Layer (offlineStorage.ts)", () => {
    it("initializes 6 object stores on schema creation", async () => {
      const db = await openOfflineDatabase();
      expect(db.objectStoreNames.contains("curriculum")).toBe(true);
      expect(db.objectStoreNames.contains("masteryCache")).toBe(true);
      expect(db.objectStoreNames.contains("studyPlan")).toBe(true);
      expect(db.objectStoreNames.contains("sessionQueue")).toBe(true);
      expect(db.objectStoreNames.contains("questionBank")).toBe(true);
      expect(db.objectStoreNames.contains("aiResponses")).toBe(true);
    });

    it("saves and retrieves curriculum concept within 7-day TTL", async () => {
      await saveCurriculumConcept({
        conceptId: "chem-12-ph",
        subject: "chemistry",
        grade: "12",
        content: "یاسای پێوەری ترشێتی pH = -log[H3O+]",
        chunks: ["pH = -log[H3O+]", "ترشێتی گیراوە"],
        difficulty: "medium",
      });

      const retrieved = await getCurriculumConcept("chem-12-ph");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.conceptId).toBe("chem-12-ph");
      expect(retrieved?.chunks.length).toBe(2);
      expect(retrieved?.expiresAt).toBeGreaterThan(Date.now());
    });

    it("evicts expired curriculum concepts past TTL", async () => {
      // Insert item with expired timestamp
      const db = await openOfflineDatabase();
      const tx = db.transaction("curriculum", "readwrite");
      const store = tx.objectStore("curriculum");
      store.put({
        conceptId: "expired-concept",
        subject: "physics",
        grade: "10",
        content: "کۆن",
        chunks: [],
        difficulty: "easy",
        cachedAt: Date.now() - 100000,
        expiresAt: Date.now() - 1000, // Expired
      });

      const countEvicted = await evictExpiredCurriculum();
      expect(countEvicted).toBe(1);

      const after = await getCurriculumConcept("expired-concept");
      expect(after).toBeNull();
    });

    it("saves and retrieves student mastery record with pendingSync status", async () => {
      await saveMasteryLocal({
        conceptId: "math-12-integrals",
        score: 0.88,
        tier: "PROFICIENT",
        irtTheta: 1.25,
        confidence: 0.9,
        lastUpdated: Date.now(),
        pendingSync: true,
      });

      const mastery = await getMasteryLocal("math-12-integrals");
      expect(mastery?.score).toBe(0.88);
      expect(mastery?.tier).toBe("PROFICIENT");
      expect(mastery?.pendingSync).toBe(true);
    });

    it("saves questions in bulk and filters by subject and concept", async () => {
      await saveQuestions([
        {
          questionId: "q1",
          subject: "chemistry",
          grade: "12",
          conceptId: "chem-12-ph",
          questionText: "پێوەری pH بۆ ئاوی پاک چەندە؟",
          options: ["5", "7", "9", "14"],
          correctAnswer: "7",
          explanation: "ئاوی پاک بێلایەنە",
          difficulty: "easy",
          cachedAt: Date.now(),
        },
        {
          questionId: "q2",
          subject: "chemistry",
          grade: "12",
          conceptId: "chem-12-titration",
          questionText: "تێکردن چییە؟",
          options: ["A", "B"],
          correctAnswer: "A",
          explanation: "پڕۆسەی دیاریکردنی خەستی",
          difficulty: "medium",
          cachedAt: Date.now(),
        },
      ]);

      const chemQuestions = await getQuestionsBySubject("chemistry", "12");
      expect(chemQuestions.length).toBe(2);

      const phQuestions = await getQuestionsByConcept("chem-12-ph");
      expect(phQuestions.length).toBe(1);
      expect(phQuestions[0].correctAnswer).toBe("7");
    });

    it("saves AI responses and verifies cache key format", async () => {
      const key = generateAiCacheKey("chem-12-ph", "explanation", "DEVELOPING");
      expect(key).toBe("chem-12-ph::explanation::developing");

      await saveAiResponse(
        "chem-12-ph",
        "explanation",
        "DEVELOPING",
        "پرسیار لەسەر pH",
        "وەڵامی شیکراوە"
      );

      const cached = await getCachedAiResponse("chem-12-ph", "explanation", "DEVELOPING");
      expect(cached).not.toBeNull();
      expect(cached?.response).toBe("وەڵامی شیکراوە");
    });
  });

  describe("2. Sync Queue System & Conflict Resolution (syncQueue.ts)", () => {
    it("calculates exponential backoff delay correctly", () => {
      expect(calculateBackoffMs(0)).toBe(1000); // 1s
      expect(calculateBackoffMs(1)).toBe(2000); // 2s
      expect(calculateBackoffMs(2)).toBe(4000); // 4s
      expect(calculateBackoffMs(3)).toBe(8000); // 8s
      expect(calculateBackoffMs(4)).toBe(16000); // 16s
      expect(calculateBackoffMs(5)).toBe(30000); // capped at 30s
    });

    it("enqueues mutations into sessionQueue and processes them in FIFO order", async () => {
      const events: SyncEvent[] = [];
      const unsub = subscribeSyncEvents((e) => events.push(e));

      // Register mock success handlers
      registerSyncHandler("MASTERY_UPDATE", async () => true);
      registerSyncHandler("SESSION_END", async () => true);

      await enqueueSyncItem("MASTERY_UPDATE", { conceptId: "c1", score: 0.75 });
      await enqueueSyncItem("SESSION_END", { durationMinutes: 25 });

      const pendingBefore = await getPendingSyncItems();
      expect(pendingBefore.length).toBe(2);

      const syncResult = await startSync();
      expect(syncResult.syncedCount).toBe(2);
      expect(syncResult.failedCount).toBe(0);

      const pendingAfter = await getPendingSyncItems();
      expect(pendingAfter.length).toBe(0);

      unsub();
      unregisterSyncHandler("MASTERY_UPDATE");
      unregisterSyncHandler("SESSION_END");
    });

    it("handles sync retry count increments and marks FAILED after 5 retries", async () => {
      registerSyncHandler("ASSESSMENT_COMPLETE", async () => {
        throw new Error("Network timeout 504");
      });

      const itemId = await enqueueSyncItem("ASSESSMENT_COMPLETE", { assessmentId: "asm1" });

      // Run sync 5 times to exceed max retries
      for (let i = 0; i < 5; i++) {
        await startSync();
      }

      const failedItems = await getFailedItems();
      const failed = failedItems.find((i) => i.id === itemId);

      expect(failed?.status).toBe("FAILED");
      expect(failed?.retryCount).toBe(5);
      expect(failed?.error).toContain("Network timeout 504");

      unregisterSyncHandler("ASSESSMENT_COMPLETE");
    });

    it("optimistic mastery update writes immediately to local IndexedDB and enqueues sync", async () => {
      await applyOptimisticMastery("c-geometry", 0.95, "MASTERED", 1.8, 0.95, "user123");

      // Verify local storage was immediately updated
      const local = await getMasteryLocal("c-geometry");
      expect(local?.score).toBe(0.95);
      expect(local?.tier).toBe("MASTERED");
      expect(local?.pendingSync).toBe(true);

      // Verify mutation was queued
      const queue = await getPendingSyncItems();
      const queuedItem = queue.find((i) => i.type === "MASTERY_UPDATE");
      expect(queuedItem).toBeDefined();
      expect((queuedItem?.payload as any).score).toBe(0.95);
    });
  });

  describe("3. Cached AI Tutor Offline Fallbacks (offlineAiTutor.ts)", () => {
    it("returns pre-generated cached AI response when cache hits", async () => {
      await saveAiResponse(
        "concept-acid",
        "explanation",
        "DEVELOPING",
        "ترش چییە؟",
        "ترش بریتییە لە پێکهاتەیەک کە ئایۆنی هایدرۆجین دەبەخشێت."
      );

      const result = await getOfflineTutorResponse("concept-acid", "explanation", "DEVELOPING");

      expect(result.source).toBe("cached_ai");
      expect(result.isOffline).toBe(true);
      expect(result.socraticDisabled).toBe(true);
      expect(result.response).toContain("ترش بریتییە لە پێکهاتەیەک");
      expect(result.notice).toBe(OFFLINE_BANNER_NOTICE);
    });

    it("falls back to curriculum concept content when AI response misses", async () => {
      await saveCurriculumConcept({
        conceptId: "physics-optics",
        subject: "physics",
        grade: "12",
        content: "یاسای شکانەوەی ڕووناکی و هاوێنەکان",
        chunks: ["یاسای سنێل: n1 sin θ1 = n2 sin θ2"],
        difficulty: "hard",
      });

      const result = await getOfflineTutorResponse("physics-optics", "explanation", "NOVICE");

      expect(result.source).toBe("curriculum_fallback");
      expect(result.isOffline).toBe(true);
      expect(result.response).toContain("یاسای شکانەوەی ڕووناکی");
      expect(result.notice).toBe(OFFLINE_BANNER_NOTICE);
    });

    it("pre-generates and caches explanation and formulas across tiers", async () => {
      await preGenerateAndCacheConcept(
        "chem-ph",
        "پێوەری pH",
        "پێوەرێکە بۆ دەستنیشانکردنی ڕادەی ترشێتی گیراوە",
        "pH = -log[H3O+]"
      );

      const explanation = await getCachedAiResponse("chem-ph", "explanation", "DEVELOPING");
      expect(explanation).not.toBeNull();
      expect(explanation?.response).toContain("پێوەری pH");

      const formula = await getCachedAiResponse("chem-ph", "formula", "DEVELOPING");
      expect(formula).not.toBeNull();
      expect(formula?.response).toContain("pH = -log[H3O+]");
    });
  });

  describe("4. Offline Subject Manager (offlineManager.ts)", () => {
    it("downloads complete subject package with >= 100 questions", async () => {
      const progressSteps: number[] = [];

      await downloadSubject("chemistry", "12", (percent) => {
        progressSteps.push(percent);
      });

      expect(progressSteps.length).toBeGreaterThan(0);
      expect(progressSteps[progressSteps.length - 1]).toBe(100);

      // Verify availability
      const isAvailable = await isAvailableOffline("chemistry");
      expect(isAvailable).toBe(true);

      // Verify question bank has at least 100 questions
      const questions = await getQuestionsBySubject("chemistry");
      expect(questions.length).toBeGreaterThanOrEqual(100);

      // Verify curriculum concepts cached
      const concepts = await getCurriculumBySubject("chemistry");
      expect(concepts.length).toBeGreaterThan(0);
    });

    it("deletes offline subject and removes its cached items", async () => {
      await downloadSubject("math", "12");
      expect(await isAvailableOffline("math")).toBe(true);

      await deleteOfflineSubject("math");

      const concepts = await getCurriculumBySubject("math");
      expect(concepts.length).toBe(0);

      const questions = await getQuestionsBySubject("math");
      expect(questions.length).toBe(0);
    });

    it("protects current grade subjects during storage auto-eviction", async () => {
      // Mock storage usage to > 80% full
      Object.defineProperty(navigator, "storage", {
        configurable: true,
        value: {
          estimate: vi.fn().mockResolvedValue({
            usage: 450 * 1024 * 1024,
            quota: 500 * 1024 * 1024, // 90% full
          }),
          persist: vi.fn().mockResolvedValue(true),
        },
      });

      // Grade 12 is current student grade, Grade 9 is past
      await downloadSubject("chemistry", "12");
      await downloadSubject("physics", "9");

      // Current grade is 12
      const evictedSubject = await autoEvictIfNeeded("12");

      // Should evict the grade 9 subject ("physics"), NOT grade 12 ("chemistry")
      expect(evictedSubject).toBe("physics");
      expect(await isAvailableOffline("chemistry")).toBe(true);
    });

    it("checks storage metrics and emits low space alert if available < 100MB", async () => {
      Object.defineProperty(navigator, "storage", {
        configurable: true,
        value: {
          estimate: vi.fn().mockResolvedValue({
            usage: 460 * 1024 * 1024,
            quota: 500 * 1024 * 1024, // available = 40MB (< 100MB)
          }),
          persist: vi.fn().mockResolvedValue(true),
        },
      });

      const usage = await getStorageUsage();
      expect(usage.isLowSpace).toBe(true);
      expect(usage.percent).toBe(92);
      expect(usage.availableMb).toBe(40);
    });
  });
});
