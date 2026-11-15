import { CurriculumEvidence } from "./CurriculumEvidence.ts";

/**
 * Deterministic 64-character hex hash function compatible with Node, Cloudflare Workers, and Browser.
 */
export function computeDeterministicHash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  let h3 = 0x9e3779b9;
  let h4 = 0x85ebca6b;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 1597334677) ^ Math.imul(h3 ^ (h3 >>> 15), 2654435761);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2654435761) ^ Math.imul(h4 ^ (h4 >>> 12), 2246822507);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 3266489909) ^ Math.imul(h1 ^ (h1 >>> 14), 1597334677);

  const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");
  const hex3 = (h3 >>> 0).toString(16).padStart(8, "0");
  const hex4 = (h4 >>> 0).toString(16).padStart(8, "0");
  const hex5 = (Math.imul(h1, 31) >>> 0).toString(16).padStart(8, "0");
  const hex6 = (Math.imul(h2, 37) >>> 0).toString(16).padStart(8, "0");
  const hex7 = (Math.imul(h3, 41) >>> 0).toString(16).padStart(8, "0");
  const hex8 = (Math.imul(h4, 43) >>> 0).toString(16).padStart(8, "0");

  return `${hex1}${hex2}${hex3}${hex4}${hex5}${hex6}${hex7}${hex8}`;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: number;
  lastAccessedAt: number;
  expiresAt: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
  evictions: number;
}

/**
 * High-performance In-Memory LRU Cache with TTL for Curriculum Retrieval.
 *
 * Implements:
 * 1. Max size of 500 entries with deterministic LRU eviction.
 * 2. SHA-256 derived cache keys: hash(subject + grade + stream + query).
 * 3. 30-minute default TTL (Time-To-Live).
 * 4. Transparent hit-rate tracking and diagnostic logging.
 */
export class RetrievalLRUCache {
  public static readonly DEFAULT_MAX_SIZE = 500;
  public static readonly DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

  private entries: Map<string, CacheEntry<CurriculumEvidence[]>> = new Map();
  private maxSize: number;
  private ttlMs: number;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  private static defaultInstance: RetrievalLRUCache | null = null;

  constructor(maxSize = RetrievalLRUCache.DEFAULT_MAX_SIZE, ttlMs = RetrievalLRUCache.DEFAULT_TTL_MS) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  public static getInstance(): RetrievalLRUCache {
    if (!RetrievalLRUCache.defaultInstance) {
      RetrievalLRUCache.defaultInstance = new RetrievalLRUCache();
    }
    return RetrievalLRUCache.defaultInstance;
  }

  /**
   * Generates a deterministic SHA-256 cache key from subject, grade, stream, and query.
   */
  public static computeKey(subject: string, grade: string, stream = "all", query = ""): string {
    const raw = `${subject.trim().toLowerCase()}:${grade.trim().toLowerCase()}:${stream.trim().toLowerCase()}:${query.trim().toLowerCase()}`;
    return computeDeterministicHash(raw);
  }

  /**
   * Retrieves cached evidence if present and not expired.
   */
  public get(key: string): CurriculumEvidence[] | null {
    const entry = this.entries.get(key);
    const now = Date.now();

    if (!entry) {
      this.misses++;
      this.logHitRate("MISS");
      return null;
    }

    if (now > entry.expiresAt) {
      this.entries.delete(key);
      this.misses++;
      this.logHitRate("EXPIRED_MISS");
      return null;
    }

    // Refresh access time and re-insert for LRU order
    entry.lastAccessedAt = now;
    this.entries.delete(key);
    this.entries.set(key, entry);

    this.hits++;
    this.logHitRate("HIT");
    return entry.value;
  }

  /**
   * Stores evidence in the cache, enforcing max size and LRU eviction.
   */
  public set(key: string, value: CurriculumEvidence[], customTtlMs?: number): void {
    const now = Date.now();
    const ttl = customTtlMs ?? this.ttlMs;

    if (this.entries.has(key)) {
      this.entries.delete(key);
    } else if (this.entries.size >= this.maxSize) {
      // Evict least recently used (first key in map iteration)
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey) {
        this.entries.delete(oldestKey);
        this.evictions++;
      }
    }

    this.entries.set(key, {
      key,
      value,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + ttl,
    });
  }

  public has(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return false;
    }
    return true;
  }

  public delete(key: string): boolean {
    return this.entries.delete(key);
  }

  public clear(): void {
    this.entries.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Returns complete cache performance metrics.
   */
  public getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? Number((this.hits / totalRequests).toFixed(4)) : 0;
    return {
      size: this.entries.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      totalRequests,
      hitRate,
      evictions: this.evictions,
    };
  }

  /**
   * Diagnostic hit-rate logger.
   */
  private logHitRate(event: "HIT" | "MISS" | "EXPIRED_MISS"): void {
    const totalRequests = this.hits + this.misses;
    // Log periodically or on debug inspection
    if (totalRequests > 0 && totalRequests % 25 === 0) {
      const stats = this.getStats();
      console.info(`[RetrievalCache] Event: ${event} | Hit Rate: ${(stats.hitRate * 100).toFixed(1)}% (${this.hits}/${totalRequests}) | Size: ${stats.size}/${this.maxSize}`);
    }
  }
}
