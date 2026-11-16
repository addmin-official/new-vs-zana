export interface RateLimitKVStore {
  get: (key: string, type?: string) => Promise<string | Record<string, unknown> | null>;
  put: (key: string, val: string, options?: { expirationTtl?: number }) => Promise<void>;
}

export interface RateLimitEnvLike {
  RATE_LIMIT_KV?: RateLimitKVStore;
  LEARNING_RECORDS_KV?: RateLimitKVStore;
  [key: string]: unknown;
}

// In-memory atomic promise chain to prevent race conditions during concurrent requests in edge isolates
const activeKeyLocks = new Map<string, Promise<void>>();

async function withAtomicKeyLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const currentLock = activeKeyLocks.get(key) || Promise.resolve();
  let release: () => void;
  const newLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  activeKeyLocks.set(key, currentLock.then(() => newLock));

  try {
    await currentLock;
    return await task();
  } finally {
    release!();
    if (activeKeyLocks.get(key) === newLock) {
      activeKeyLocks.delete(key);
    }
  }
}

export async function enforceAiRateLimit(
  env: RateLimitEnvLike | Record<string, unknown> | undefined,
  studentId: string
): Promise<void> {
  const windowSeconds = 3600; // 1 Hour
  const maxRequests = 50; // Pilot limit per student per hour

  const key = `ratelimit:${studentId}`;

  // Prioritize RATE_LIMIT_KV, fallback to LEARNING_RECORDS_KV for backward compatibility
  const envLike = env as RateLimitEnvLike | undefined;
  const kv = envLike?.RATE_LIMIT_KV || envLike?.LEARNING_RECORDS_KV;
  if (!kv) {
    return;
  }

  // Atomically serialize read-increment-write to prevent race conditions
  return withAtomicKeyLock(key, async () => {
    const currentUsageData = await kv.get(key);
    const count = typeof currentUsageData === "string" ? parseInt(currentUsageData, 10) : 0;

    if (count >= maxRequests) {
      console.warn(`[Rate Limit Exceeded] Student: ${studentId}`);
      throw new Error("RATE_LIMIT_EXCEEDED");
    }

    await kv.put(key, (count + 1).toString(), { expirationTtl: windowSeconds });
  });
}
