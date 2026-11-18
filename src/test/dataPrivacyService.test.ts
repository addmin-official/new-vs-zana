import assert from "node:assert";
import { test } from "node:test";
import {
  inspectUserDataInventory,
  clearLocalCacheData,
  buildUserExportPayload,
} from "../services/dataPrivacyService.ts";
import { StudentProfile } from "../services/storage.ts";

function createMockStorage(initial: Record<string, string> = {}): Storage {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

const sampleProfile: StudentProfile = {
  id: "stud_test_1",
  name: "ئاری",
  grade: "12",
  stream: "scientific",
  activeSubject: "chemistry",
  level: "intermediate",
  onboardingCompleted: true,
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-18T10:00:00.000Z",
  authoritative: false,
  source: "guest-local",
};

test("inspectUserDataInventory categorizes profile, progress, pedagogy, and cache keys while excluding secrets", () => {
  const storage = createMockStorage({
    "zana.profile.v1": JSON.stringify(sampleProfile),
    "zana_theme": "dark",
    "zana:progress-state": JSON.stringify({ totalSessions: 4 }),
    "zana_practice_progress_v1": JSON.stringify({ totalXp: 240 }),
    "zana:chat-messages:chemistry": JSON.stringify([{ id: "1", content: "سڵاو" }]),
    "zana_role_cache": "student",
    "zana_notifications_cache": "[]",
    "zana_auth_token": "secret-should-be-excluded",
  });

  const inventory = inspectUserDataInventory(storage);

  assert.strictEqual(inventory.totalKeys, 7);
  assert.strictEqual(inventory.cacheKeysCount, 2);

  const profileCat = inventory.categories.find((c) => c.id === "profile_prefs");
  const progressCat = inventory.categories.find((c) => c.id === "study_progress");
  const pedagogyCat = inventory.categories.find((c) => c.id === "pedagogy_chat");
  const cacheCat = inventory.categories.find((c) => c.id === "local_cache");

  assert.strictEqual(profileCat?.itemCount, 2);
  assert.strictEqual(progressCat?.itemCount, 2);
  assert.strictEqual(pedagogyCat?.itemCount, 1);
  assert.strictEqual(cacheCat?.itemCount, 2);
});

test("clearLocalCacheData clears only temporary cache keys and preserves profile and study progress", async () => {
  const storage = createMockStorage({
    "zana.profile.v1": JSON.stringify(sampleProfile),
    "zana_theme": "light",
    "zana:progress-state": JSON.stringify({ totalSessions: 5 }),
    "zana_role_cache": "student",
    "zana_offline_meta": JSON.stringify({ lastSync: 123 }),
  });

  const result = await clearLocalCacheData(storage);

  assert.strictEqual(result.clearedKeys, 2);
  assert.ok(result.freedBytes > 0);
  assert.strictEqual(storage.getItem("zana_role_cache"), null);
  assert.strictEqual(storage.getItem("zana_offline_meta"), null);
  assert.ok(storage.getItem("zana.profile.v1") !== null);
  assert.strictEqual(storage.getItem("zana_theme"), "light");
  assert.ok(storage.getItem("zana:progress-state") !== null);
});

test("buildUserExportPayload outputs structured transparency payload without sensitive tokens", () => {
  const storage = createMockStorage({
    "zana.profile.v1": JSON.stringify(sampleProfile),
    "zana:progress-state": JSON.stringify({ totalSessions: 2 }),
    "zana_jwt_secret_token": "do-not-export",
  });

  const payload = buildUserExportPayload(sampleProfile, null, storage);

  assert.strictEqual(payload.studentProfile.name, "ئاری");
  assert.strictEqual(payload.inventorySummary.totalKeys, 2);
  assert.ok("zana.profile.v1" in payload.localRecords);
  assert.ok("zana:progress-state" in payload.localRecords);
  assert.ok(!("zana_jwt_secret_token" in payload.localRecords));
});
