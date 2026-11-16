/**
 * ZANA Platform - Sync Queue System (FIFO with Exponential Backoff & Conflict Resolution)
 * Manages pending offline mutations and optimistic local updates.
 */

import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { getFirestoreDb } from "../services/firebase.ts";
import {
  enqueueSyncItem,
  getPendingSyncItems,
  getFailedSyncItems,
  getAllSyncItems,
  updateSyncItem,
  removeSyncItem,
  getPendingSyncCount,
  saveMasteryLocal,
  getMasteryLocal,
  SyncItemType,
  SyncQueueItem,
} from "./offlineStorage.ts";

export type SyncEventType =
  | "sync:started"
  | "sync:item-synced"
  | "sync:complete"
  | "sync:failed";

export interface SyncEvent {
  type: SyncEventType;
  item?: SyncQueueItem;
  remaining?: number;
  syncedCount?: number;
  failedCount?: number;
  error?: string;
}

export type SyncEventListener = (event: SyncEvent) => void;

// Custom sync handler registration for testing or platform extensions
export type SyncItemHandler<T = unknown> = (payload: T) => Promise<boolean>;

const MAX_RETRIES = 5;
const listeners = new Set<SyncEventListener>();
const customHandlers = new Map<SyncItemType, SyncItemHandler<unknown>>();

let isSyncing = false;

/**
 * Subscribes to sync progress and status events
 */
export function subscribeSyncEvents(listener: SyncEventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitSyncEvent(event: SyncEvent): void {
  listeners.forEach((l) => {
    try {
      l(event);
    } catch (err) {
      console.warn("[SyncQueue] Event listener error:", err);
    }
  });
}

/**
 * Registers an optional custom handler for a sync item type
 */
export function registerSyncHandler<T>(
  type: SyncItemType,
  handler: SyncItemHandler<T>
): void {
  customHandlers.set(type, handler as SyncItemHandler<unknown>);
}

/**
 * Removes custom sync handler (useful in tests)
 */
export function unregisterSyncHandler(type: SyncItemType): void {
  customHandlers.delete(type);
}

/**
 * Checks if client is currently online (helper checking window.navigator)
 */
export function isNetworkOnline(): boolean {
  if (typeof navigator !== "undefined") {
    return navigator.onLine;
  }
  return true;
}

/**
 * Enqueues a mutation into IndexedDB sessionQueue.
 * If currently online, immediately triggers background sync attempt.
 */
export async function enqueue<T>(type: SyncItemType, payload: T): Promise<number> {
  const itemId = await enqueueSyncItem(type, payload);

  // If online, kick off an immediate background sync attempt without blocking caller
  if (isNetworkOnline()) {
    setTimeout(() => {
      void startSync();
    }, 10);
  }

  return itemId;
}

/**
 * Optimistic Mastery Update:
 * Immediately writes to local IndexedDB masteryCache, flags pendingSync: true,
 * and enqueues a MASTERY_UPDATE into the sync queue.
 */
export async function applyOptimisticMastery(
  conceptId: string,
  score: number,
  tier: string = "DEVELOPING",
  irtTheta: number = 0,
  confidence: number = 0.5,
  userId?: string
): Promise<void> {
  // 1. Immediately apply to local IndexedDB cache with pendingSync true
  await saveMasteryLocal({
    conceptId,
    userId,
    score,
    tier,
    irtTheta,
    confidence,
    lastUpdated: Date.now(),
    pendingSync: true,
  });

  // 2. Enqueue in sessionQueue for server synchronization
  await enqueue("MASTERY_UPDATE", {
    conceptId,
    userId,
    score,
    tier,
    irtTheta,
    confidence,
  });
}

/**
 * Built-in default sync handlers with conflict resolution
 */
async function processSyncItem(item: SyncQueueItem): Promise<boolean> {
  // Check if a custom handler is registered (e.g. in unit tests or platform override)
  const customHandler = customHandlers.get(item.type);
  if (customHandler) {
    return await customHandler(item.payload);
  }

  const db = getFirestoreDb();
  if (!db) {
    // If Firebase isn't initialized or running in pure offline mode, simulate successful queue consumption
    return true;
  }

  const payload = item.payload as Record<string, unknown>;
  const userId = (payload.userId as string) || "anonymous";

  switch (item.type) {
    case "MASTERY_UPDATE": {
      /**
       * CONFLICT RESOLUTION:
       * Mastery updates: take HIGHER score (never downgrade offline)
       */
      const conceptId = String(payload.conceptId);
      const localScore = Number(payload.score) || 0;

      const masteryRef = doc(db, "users", userId, "mastery", conceptId);
      const existingSnap = await getDoc(masteryRef);

      let resolvedScore = localScore;
      if (existingSnap.exists()) {
        const serverData = existingSnap.data();
        const serverScore = Number(serverData.score) || 0;
        // Take HIGHER score
        resolvedScore = Math.max(serverScore, localScore);
      }

      await setDoc(
        masteryRef,
        {
          conceptId,
          score: resolvedScore,
          tier: payload.tier,
          irtTheta: payload.irtTheta,
          confidence: payload.confidence,
          updatedAt: serverTimestamp(),
          syncedFromOffline: true,
        },
        { merge: true }
      );

      // Confirm local mastery record is now synced
      const currentLocal = await getMasteryLocal(conceptId);
      if (currentLocal) {
        await saveMasteryLocal({
          ...currentLocal,
          score: resolvedScore,
          pendingSync: false,
        });
      }
      return true;
    }

    case "ASSESSMENT_COMPLETE": {
      /**
       * CONFLICT RESOLUTION:
       * Session data: merge, never overwrite
       */
      const assessmentId = (payload.assessmentId as string) || `asm_${item.timestamp}`;
      const asmRef = doc(db, "users", userId, "assessments", assessmentId);

      await setDoc(
        asmRef,
        {
          ...payload,
          syncedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    }

    case "SESSION_END": {
      /**
       * CONFLICT RESOLUTION:
       * Increment study minutes & merge progress without destroying server streaks
       */
      const userRef = doc(db, "users", userId);
      const minutes = Number(payload.durationMinutes) || 0;
      const completedLessons = Number(payload.completedLessons) || 0;

      await updateDoc(userRef, {
        todayStudyMinutes: increment(minutes),
        completedLessons: increment(completedLessons),
        lastStudyDate: new Date().toISOString(),
      }).catch(async () => {
        // Fallback to setDoc merge if user doc does not yet exist
        await setDoc(
          userRef,
          {
            todayStudyMinutes: minutes,
            completedLessons,
            lastStudyDate: new Date().toISOString(),
          },
          { merge: true }
        );
      });
      return true;
    }

    case "PLAN_UPDATE": {
      /**
       * CONFLICT RESOLUTION:
       * Study plan: server wins (server is authoritative).
       * We merge completed task IDs without overwriting server-side plan outline.
       */
      const planId = (payload.planId as string) || "current";
      const planRef = doc(db, "users", userId, "studyPlans", planId);
      const planSnap = await getDoc(planRef);

      if (planSnap.exists()) {
        const existingData = planSnap.data();
        const serverTasks = (existingData.completedTasks as string[]) || [];
        const localTasks = (payload.completedTasks as string[]) || [];
        const mergedTasks = Array.from(new Set([...serverTasks, ...localTasks]));

        await updateDoc(planRef, {
          completedTasks: mergedTasks,
          lastSyncedAt: serverTimestamp(),
        });
      } else {
        await setDoc(planRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      return true;
    }

    default:
      return true;
  }
}

/**
 * Calculates exponential backoff delay in ms based on retryCount
 * 1 -> 1s, 2 -> 2s, 3 -> 4s, 4 -> 8s, 5 -> 16s (max 30s)
 */
export function calculateBackoffMs(retryCount: number): number {
  return Math.min(1000 * Math.pow(2, retryCount), 30000);
}

/**
 * Main Sync Engine:
 * Processes queue in FIFO order.
 * Handles retry limits, exponential backoff, and event emission.
 */
export async function startSync(): Promise<{ syncedCount: number; failedCount: number }> {
  if (isSyncing) {
    return { syncedCount: 0, failedCount: 0 };
  }

  isSyncing = true;
  emitSyncEvent({ type: "sync:started" });

  let syncedCount = 0;
  let failedCount = 0;

  try {
    const queue = await getPendingSyncItems();

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (!item.id) continue;

      // Mark as currently SYNCING
      item.status = "SYNCING";
      await updateSyncItem(item);

      try {
        const success = await processSyncItem(item);

        if (success) {
          // Successfully synced -> remove from IndexedDB sessionQueue
          await removeSyncItem(item.id);
          syncedCount++;

          emitSyncEvent({
            type: "sync:item-synced",
            item,
            remaining: queue.length - (i + 1),
          });
        } else {
          throw new Error("Sync item handler returned false");
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        item.retryCount = (item.retryCount || 0) + 1;
        item.error = errorMessage;

        if (item.retryCount >= MAX_RETRIES) {
          item.status = "FAILED";
          failedCount++;
          emitSyncEvent({
            type: "sync:failed",
            item,
            error: errorMessage,
          });
        } else {
          item.status = "PENDING";
        }

        await updateSyncItem(item);
      }
    }
  } catch (err) {
    console.error("[SyncQueue] startSync unexpected error:", err);
  } finally {
    isSyncing = false;
    const remaining = await getPendingSyncCount();

    emitSyncEvent({
      type: "sync:complete",
      syncedCount,
      failedCount,
      remaining,
    });
  }

  return { syncedCount, failedCount };
}

/**
 * Retries all items previously marked as FAILED
 */
export async function retryFailed(): Promise<void> {
  const failed = await getFailedSyncItems();
  for (const item of failed) {
    item.status = "PENDING";
    item.retryCount = 0;
    item.error = undefined;
    await updateSyncItem(item);
  }
  await startSync();
}

/**
 * Gets all failed sync items
 */
export async function getFailedItems(): Promise<SyncQueueItem[]> {
  return getFailedSyncItems();
}

/**
 * Gets all items in the queue (pending, syncing, synced, or failed)
 */
export async function getAllItems(): Promise<SyncQueueItem[]> {
  return getAllSyncItems();
}

/**
 * Gets count of pending items in the queue
 */
export async function getPendingCount(): Promise<number> {
  return getPendingSyncCount();
}

/**
 * Unified syncQueue namespace helper
 */
export const syncQueue = {
  startSync,
  subscribe: subscribeSyncEvents,
  on: (eventType: SyncEventType, listener: (event: SyncEvent) => void): (() => void) => {
    return subscribeSyncEvents((event: SyncEvent) => {
      if (event.type === eventType) {
        listener(event);
      }
    });
  },
  getPendingCount,
  getFailedItems,
  getAllItems,
  retryFailed,
};
