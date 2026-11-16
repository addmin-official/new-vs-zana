/**
 * ZANA Platform - Offline Storage Layer (Raw IndexedDB with Promise API)
 * Database: "zana-offline" v1
 * Stores: curriculum, masteryCache, studyPlan, sessionQueue, questionBank, aiResponses
 */

export const OFFLINE_DB_NAME = "zana-offline";
export const OFFLINE_DB_VERSION = 1;

export const CURRICULUM_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const AI_RESPONSE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const MAX_AI_RESPONSES = 500;
export const MAX_SUBJECT_STORAGE_BYTES = 50 * 1024 * 1024; // 50MB per subject

export type SyncItemType =
  | "MASTERY_UPDATE"
  | "ASSESSMENT_COMPLETE"
  | "SESSION_END"
  | "PLAN_UPDATE";

export type SyncItemStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED";

export interface CachedCurriculumConcept {
  conceptId: string;
  subject: string;
  grade: string;
  content: string;
  chunks: string[];
  difficulty: string;
  cachedAt: number;
  expiresAt: number;
}

export interface CachedMasteryRecord {
  conceptId: string;
  userId?: string;
  score: number;
  tier: string;
  irtTheta: number;
  confidence: number;
  lastUpdated: number;
  pendingSync?: boolean;
}

export interface CachedStudyPlan {
  planId: string;
  userId?: string;
  items: unknown[];
  generatedAt: number;
  weekStart: string;
  currentDay: number;
}

export interface SyncQueueItem<T = unknown> {
  id?: number;
  type: SyncItemType;
  payload: T;
  timestamp: number;
  retryCount: number;
  status: SyncItemStatus;
  error?: string;
}

export interface CachedQuestionItem {
  questionId: string;
  subject: string;
  grade: string | number;
  conceptId: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  cachedAt: number;
}

export interface CachedAiResponse {
  cacheKey: string;
  conceptId: string;
  questionType: string;
  masteryTier: string;
  prompt: string;
  response: string;
  cachedAt: number;
  expiresAt: number;
}

export type StoreName =
  | "curriculum"
  | "masteryCache"
  | "studyPlan"
  | "sessionQueue"
  | "questionBank"
  | "aiResponses";

let dbInstance: IDBDatabase | null = null;

/**
 * Returns the IndexedDB factory (supports test environment and browser environment)
 */
function getIDBFactory(): IDBFactory | undefined {
  if (typeof window !== "undefined" && window.indexedDB) {
    return window.indexedDB;
  }
  if (typeof indexedDB !== "undefined") {
    return indexedDB;
  }
  return undefined;
}

class MemoryRequest<T = unknown> {
  result: T = null as T;
  error: Error | null = null;
  onsuccess: ((e: { target: MemoryRequest<T> }) => void) | null = null;
  onerror: ((e: { target: MemoryRequest<T> }) => void) | null = null;
  constructor(action: () => T) {
    setTimeout(() => {
      try {
        this.result = action();
        this.onsuccess?.({ target: this });
      } catch (err: unknown) {
        this.error = err instanceof Error ? err : new Error(String(err));
        this.onerror?.({ target: this });
      }
    }, 0);
  }
}

class MemoryStore {
  data = new Map<string, Record<string, unknown>>();
  autoId = 1;
  indexes = new Map<string, string>();
  constructor(public name: string, public keyPath?: string, public autoIncrement?: boolean) {}
  createIndex(name: string, keyPath: string) {
    this.indexes.set(name, keyPath);
  }
  index(name: string) {
    const keyPath = this.indexes.get(name) || name;
    return {
      getAll: (val?: unknown) => new MemoryRequest(() => {
        return Array.from(this.data.values()).filter((item) => val === undefined || String(item[keyPath]) === String(val));
      }),
      get: (val: unknown) => new MemoryRequest(() => {
        return Array.from(this.data.values()).find((item) => String(item[keyPath]) === String(val)) || null;
      }),
    };
  }
  get(key: unknown) {
    return new MemoryRequest(() => this.data.get(String(key)) || null);
  }
  put(value: Record<string, unknown>) {
    return new MemoryRequest(() => {
      let k = this.keyPath ? value[this.keyPath] : undefined;
      if (this.autoIncrement && k === undefined) {
        k = this.autoId++;
        value.id = k;
      }
      this.data.set(String(k), JSON.parse(JSON.stringify(value)));
      return k as IDBValidKey;
    });
  }
  delete(key: unknown) {
    return new MemoryRequest(() => {
      this.data.delete(String(key));
    });
  }
  getAll() {
    return new MemoryRequest(() => Array.from(this.data.values()).map((v) => JSON.parse(JSON.stringify(v))));
  }
  clear() {
    return new MemoryRequest(() => {
      this.data.clear();
    });
  }
  count() {
    return new MemoryRequest(() => this.data.size);
  }
}

class MemoryDatabase {
  stores = new Map<string, MemoryStore>();
  onversionchange: (() => void) | null = null;

  get objectStoreNames(): DOMStringList {
    const names = Array.from(this.stores.keys());
    return {
      contains: (n: string) => names.includes(n),
      length: names.length,
      item: (i: number) => names[i],
    } as unknown as DOMStringList;
  }

  createObjectStore(name: string, options?: { keyPath?: string; autoIncrement?: boolean }) {
    const s = new MemoryStore(name, options?.keyPath, options?.autoIncrement);
    this.stores.set(name, s);
    return s;
  }

  transaction(_storeNames: string | string[], _mode: IDBTransactionMode = "readonly"): IDBTransaction {
    return {
      objectStore: (n: string) => this.stores.get(n),
      oncomplete: null,
      onerror: null,
    } as unknown as IDBTransaction;
  }

  close() {}
}

const memoryFallbackDb = new MemoryDatabase();

// Pre-create the 6 stores on fallback DB
memoryFallbackDb.createObjectStore("curriculum", { keyPath: "conceptId" }).createIndex("by_subject", "subject");
memoryFallbackDb.createObjectStore("masteryCache", { keyPath: "conceptId" });
memoryFallbackDb.createObjectStore("studyPlan", { keyPath: "planId" });
memoryFallbackDb.createObjectStore("sessionQueue", { keyPath: "id", autoIncrement: true });
memoryFallbackDb.createObjectStore("questionBank", { keyPath: "questionId" }).createIndex("by_subject", "subject");
memoryFallbackDb.createObjectStore("aiResponses", { keyPath: "cacheKey" });

/**
 * Initializes and upgrades the "zana-offline" IndexedDB schema
 */
export function openOfflineDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  const idb = getIDBFactory();
  if (!idb) {
    // Graceful fallback to memory database
    return Promise.resolve(memoryFallbackDb as unknown as IDBDatabase);
  }

  return new Promise((resolve, reject) => {
    const request = idb.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error("Failed to open offline database"));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. curriculum store
      if (!db.objectStoreNames.contains("curriculum")) {
        const currStore = db.createObjectStore("curriculum", { keyPath: "conceptId" });
        currStore.createIndex("by_subject", "subject", { unique: false });
        currStore.createIndex("by_grade", "grade", { unique: false });
        currStore.createIndex("by_expiresAt", "expiresAt", { unique: false });
      }

      // 2. masteryCache store
      if (!db.objectStoreNames.contains("masteryCache")) {
        const masteryStore = db.createObjectStore("masteryCache", { keyPath: "conceptId" });
        masteryStore.createIndex("by_pendingSync", "pendingSync", { unique: false });
      }

      // 3. studyPlan store
      if (!db.objectStoreNames.contains("studyPlan")) {
        db.createObjectStore("studyPlan", { keyPath: "planId" });
      }

      // 4. sessionQueue store (auto-incrementing sync items)
      if (!db.objectStoreNames.contains("sessionQueue")) {
        const queueStore = db.createObjectStore("sessionQueue", {
          keyPath: "id",
          autoIncrement: true,
        });
        queueStore.createIndex("by_status", "status", { unique: false });
        queueStore.createIndex("by_timestamp", "timestamp", { unique: false });
      }

      // 5. questionBank store
      if (!db.objectStoreNames.contains("questionBank")) {
        const qStore = db.createObjectStore("questionBank", { keyPath: "questionId" });
        qStore.createIndex("by_subject", "subject", { unique: false });
        qStore.createIndex("by_grade", "grade", { unique: false });
        qStore.createIndex("by_conceptId", "conceptId", { unique: false });
      }

      // 6. aiResponses store
      if (!db.objectStoreNames.contains("aiResponses")) {
        const aiStore = db.createObjectStore("aiResponses", { keyPath: "cacheKey" });
        aiStore.createIndex("by_conceptId", "conceptId", { unique: false });
        aiStore.createIndex("by_expiresAt", "expiresAt", { unique: false });
      }
    };
  });
}

/**
 * Closes the active database connection (useful in test teardown)
 */
export function closeOfflineDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Generic Promise wrapper for reading a single record
 */
export async function getFromStore<T>(storeName: StoreName, key: IDBValidKey): Promise<T | null> {
  const db = await openOfflineDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve((req.result as T) ?? null);
      };
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generic Promise wrapper for writing/updating a record
 */
export async function putInStore<T>(storeName: StoreName, value: T): Promise<IDBValidKey> {
  const db = await openOfflineDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.put(value);

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generic Promise wrapper for deleting a single record
 */
export async function deleteFromStore(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openOfflineDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generic Promise wrapper for retrieving all items in a store
 */
export async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const db = await openOfflineDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generic Promise wrapper for querying items by an index
 */
export async function getByIndex<T>(
  storeName: StoreName,
  indexName: string,
  key: IDBValidKey
): Promise<T[]> {
  const db = await openOfflineDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(key);

      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Clears an entire object store
 */
export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await openOfflineDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Counts records in an object store
 */
export async function countStore(storeName: StoreName): Promise<number> {
  const db = await openOfflineDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.count();

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

/* =========================================================================
   STORE-SPECIFIC APIS
   ========================================================================= */

// --- 1. CURRICULUM STORE ---
export async function saveCurriculumConcept(
  concept: Omit<CachedCurriculumConcept, "cachedAt" | "expiresAt">
): Promise<void> {
  const now = Date.now();
  const record: CachedCurriculumConcept = {
    ...concept,
    cachedAt: now,
    expiresAt: now + CURRICULUM_TTL_MS,
  };
  await putInStore("curriculum", record);
}

export async function getCurriculumConcept(conceptId: string): Promise<CachedCurriculumConcept | null> {
  const record = await getFromStore<CachedCurriculumConcept>("curriculum", conceptId);
  if (!record) return null;

  // Verify TTL (7 days)
  if (record.expiresAt && Date.now() > record.expiresAt) {
    await deleteFromStore("curriculum", conceptId);
    return null;
  }
  return record;
}

export async function getCurriculumBySubject(subject: string): Promise<CachedCurriculumConcept[]> {
  const items = await getByIndex<CachedCurriculumConcept>("curriculum", "by_subject", subject);
  const now = Date.now();
  const validItems: CachedCurriculumConcept[] = [];

  for (const item of items) {
    if (item.expiresAt && now > item.expiresAt) {
      await deleteFromStore("curriculum", item.conceptId);
    } else {
      validItems.push(item);
    }
  }
  return validItems;
}

export async function evictExpiredCurriculum(): Promise<number> {
  const all = await getAllFromStore<CachedCurriculumConcept>("curriculum");
  const now = Date.now();
  let evicted = 0;
  for (const item of all) {
    if (item.expiresAt && now > item.expiresAt) {
      await deleteFromStore("curriculum", item.conceptId);
      evicted++;
    }
  }
  return evicted;
}

// --- 2. MASTERY CACHE STORE ---
export async function saveMasteryLocal(record: CachedMasteryRecord): Promise<void> {
  await putInStore("masteryCache", {
    ...record,
    lastUpdated: Date.now(),
  });
}

export async function getMasteryLocal(conceptId: string): Promise<CachedMasteryRecord | null> {
  return getFromStore<CachedMasteryRecord>("masteryCache", conceptId);
}

export async function getAllMasteryLocal(): Promise<CachedMasteryRecord[]> {
  return getAllFromStore<CachedMasteryRecord>("masteryCache");
}

// --- 3. STUDY PLAN STORE ---
export async function saveStudyPlanLocal(plan: CachedStudyPlan): Promise<void> {
  await putInStore("studyPlan", plan);
}

export async function getStudyPlanLocal(planId: string = "current"): Promise<CachedStudyPlan | null> {
  return getFromStore<CachedStudyPlan>("studyPlan", planId);
}

// --- 4. SESSION QUEUE STORE ---
export async function enqueueSyncItem<T>(
  type: SyncItemType,
  payload: T
): Promise<number> {
  const item: SyncQueueItem<T> = {
    type,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
    status: "PENDING",
  };
  const key = await putInStore("sessionQueue", item);
  return Number(key);
}

export async function getAllSyncItems(): Promise<SyncQueueItem[]> {
  const all = await getAllFromStore<SyncQueueItem>("sessionQueue");
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const all = await getAllFromStore<SyncQueueItem>("sessionQueue");
  return all
    .filter((item) => item.status === "PENDING" || item.status === "SYNCING")
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function getFailedSyncItems(): Promise<SyncQueueItem[]> {
  const all = await getAllFromStore<SyncQueueItem>("sessionQueue");
  return all
    .filter((item) => item.status === "FAILED")
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function updateSyncItem(item: SyncQueueItem): Promise<void> {
  await putInStore("sessionQueue", item);
}

export async function removeSyncItem(id: number): Promise<void> {
  await deleteFromStore("sessionQueue", id);
}

export async function getPendingSyncCount(): Promise<number> {
  const pending = await getPendingSyncItems();
  return pending.length;
}

// --- 5. QUESTION BANK STORE ---
export async function saveQuestions(questions: CachedQuestionItem[]): Promise<void> {
  const db = await openOfflineDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction("questionBank", "readwrite");
      const store = tx.objectStore("questionBank");

      questions.forEach((q) => {
        store.put(q);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function getQuestionsBySubject(
  subject: string,
  grade?: string | number
): Promise<CachedQuestionItem[]> {
  const items = await getByIndex<CachedQuestionItem>("questionBank", "by_subject", subject);
  if (grade !== undefined) {
    return items.filter((q) => String(q.grade) === String(grade));
  }
  return items;
}

export async function getQuestionsByConcept(conceptId: string): Promise<CachedQuestionItem[]> {
  return getByIndex<CachedQuestionItem>("questionBank", "by_conceptId", conceptId);
}

// --- 6. AI RESPONSES STORE ---
export function generateAiCacheKey(
  conceptId: string,
  questionType: string,
  masteryTier: string
): string {
  return `${conceptId}::${questionType}::${masteryTier}`.toLowerCase().replace(/\s+/g, "_");
}

export async function saveAiResponse(
  conceptId: string,
  questionType: string,
  masteryTier: string,
  prompt: string,
  response: string
): Promise<void> {
  const cacheKey = generateAiCacheKey(conceptId, questionType, masteryTier);
  const now = Date.now();

  const record: CachedAiResponse = {
    cacheKey,
    conceptId,
    questionType,
    masteryTier,
    prompt,
    response,
    cachedAt: now,
    expiresAt: now + AI_RESPONSE_TTL_MS,
  };

  await putInStore("aiResponses", record);

  // Evict if cache exceeds MAX_AI_RESPONSES (LRU / oldest eviction)
  const count = await countStore("aiResponses");
  if (count > MAX_AI_RESPONSES) {
    const all = await getAllFromStore<CachedAiResponse>("aiResponses");
    all.sort((a, b) => a.cachedAt - b.cachedAt);
    const toRemove = all.slice(0, count - MAX_AI_RESPONSES);
    for (const item of toRemove) {
      await deleteFromStore("aiResponses", item.cacheKey);
    }
  }
}

export async function getCachedAiResponse(
  conceptId: string,
  questionType: string,
  masteryTier: string
): Promise<CachedAiResponse | null> {
  const cacheKey = generateAiCacheKey(conceptId, questionType, masteryTier);
  const record = await getFromStore<CachedAiResponse>("aiResponses", cacheKey);
  if (!record) return null;

  if (record.expiresAt && Date.now() > record.expiresAt) {
    await deleteFromStore("aiResponses", cacheKey);
    return null;
  }
  return record;
}
