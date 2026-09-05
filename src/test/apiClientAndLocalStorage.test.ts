import test from "node:test";
import assert from "node:assert/strict";

// Mock the global window and localStorage before importing studentStorage
const mockLocalStorage: Record<string, string> = {};

Object.defineProperty(global, "window", {
  value: {
    localStorage: {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
      removeItem: (key: string) => { delete mockLocalStorage[key]; },
      clear: () => { for (const k in mockLocalStorage) delete mockLocalStorage[k]; },
      length: 0,
      key: () => null,
    }
  },
  writable: true,
  configurable: true
});

// Use dynamic imports to ensure the mocks are in place when studentStorage evaluates its module-level `isBrowser` constant
const { parseResponseJson } = await import("../lib/apiClient.ts");
const { getStudentProfile, saveStudentProfile } = await import("../features/student/studentStorage.ts");

test("API Client - parseResponseJson with success JSON response", async () => {
  const response = new Response(JSON.stringify({ success: true, message: "بژیو" }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });

  const data = await parseResponseJson<{ success: boolean; message: string }>(response);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.message, "بژیو");
});

test("API Client - parseResponseJson with non-JSON HTML response", async () => {
  const response = new Response("<!DOCTYPE html><html><body>Error</body></html>", {
    status: 200,
    headers: { "content-type": "text/html" }
  });

  await assert.rejects(
    async () => {
      await parseResponseJson(response);
    },
    (err: any) => {
      assert.match(err.message, /Expected JSON but received/);
      return true;
    }
  );
});

test("API Client - parseResponseJson with HTTP non-2xx response", async () => {
  const response = new Response(JSON.stringify({ error: "شیاو نییە" }), {
    status: 400,
    headers: { "content-type": "application/json" }
  });

  await assert.rejects(
    async () => {
      await parseResponseJson(response);
    },
    (err: any) => {
      assert.match(err.message, /شیاو نییە/);
      return true;
    }
  );
});

test("API Client - parseResponseJson with invalid JSON body", async () => {
  const response = new Response("{ invalid-json }", {
    status: 200,
    headers: { "content-type": "application/json" }
  });

  await assert.rejects(
    async () => {
      await parseResponseJson(response);
    },
    (err: any) => {
      assert.match(err.message, /Server returned invalid JSON/);
      return true;
    }
  );
});

test("Storage Layer - Profile save and load success", () => {
  // Clear mock storage
  for (const k in mockLocalStorage) delete mockLocalStorage[k];

  const profile = {
    id: "test-student-id-123",
    name: "ئاراس",
    grade: "12",
    stream: "scientific",
    activeSubject: "math",
    level: "intermediate",
    onboardingCompleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authoritative: false,
    source: "guest-local"
  } as any;

  saveStudentProfile(profile);

  const loaded = getStudentProfile();
  assert.ok(loaded);
  assert.strictEqual(loaded.id, "test-student-id-123");
  assert.strictEqual(loaded.name, "ئاراس");
  assert.strictEqual(loaded.grade, "12");
  assert.strictEqual(loaded.stream, "scientific");
  assert.strictEqual(loaded.activeSubject, "math");
});

test("Storage Layer - Profile loading handles corrupted localStorage gracefully", () => {
  // Set invalid JSON in localStorage
  mockLocalStorage["zana.profile.v1"] = "{ corrupted-data: ... }";

  const loaded = getStudentProfile();
  // Should return null and not crash
  assert.strictEqual(loaded, null);
});

test("Storage Layer - Profile loading handles missing/partial required fields gracefully", () => {
  // Set JSON with missing name/grade/subject
  mockLocalStorage["zana.profile.v1"] = JSON.stringify({
    id: "partial-id",
    // name is missing
    grade: "12",
    activeSubject: "math"
  });

  const loaded = getStudentProfile();
  // Should return null instead of crashing or returning incomplete profile
  assert.strictEqual(loaded, null);
});
