/**
 * Regression tests — Blocker B: Production Environment Validation
 * validateProductionEnv must require DB, LEARNING_RECORDS_KV, GEMINI_API_KEY,
 * GEMINI_PRIMARY_MODEL, and ADMIN_TELEMETRY_SECRET, and throw clearly on each missing binding.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateProductionEnv } from "../server/config/envValidator.ts";

const validEnv = {
  GEMINI_API_KEY: "real-key-value",
  GEMINI_PRIMARY_MODEL: "gemini-2.0-flash",
  ADMIN_TELEMETRY_SECRET: "super-secret-value",
  DB: { prepare: () => ({}) }, // Cloudflare D1 binding mock
  LEARNING_RECORDS_KV: { get: () => Promise.resolve(null) }, // KV mock
};

describe("validateProductionEnv — Blocker B", () => {
  test("passes when all required bindings and secrets are present", () => {
    assert.doesNotThrow(() => validateProductionEnv(validEnv), "valid env must not throw");
  });

  test("throws when DB binding is missing", () => {
    const env = { ...validEnv, DB: undefined };
    assert.throws(
      () => validateProductionEnv(env),
      /DB.*missing|D1.*missing/i,
      "must throw with DB binding missing message"
    );
  });

  test("throws when DB binding is null", () => {
    const env = { ...validEnv, DB: null };
    assert.throws(
      () => validateProductionEnv(env),
      /DB.*missing|D1.*missing/i,
    );
  });

  test("throws when LEARNING_RECORDS_KV binding is missing", () => {
    const env = { ...validEnv, LEARNING_RECORDS_KV: undefined };
    assert.throws(
      () => validateProductionEnv(env),
      /LEARNING_RECORDS_KV.*missing/i
    );
  });

  test("throws when GEMINI_API_KEY is missing", () => {
    const env = { ...validEnv, GEMINI_API_KEY: "" };
    assert.throws(
      () => validateProductionEnv(env),
      /GEMINI_API_KEY/i
    );
  });

  test("throws when GEMINI_PRIMARY_MODEL is missing", () => {
    const env = { ...validEnv, GEMINI_PRIMARY_MODEL: "" };
    assert.throws(
      () => validateProductionEnv(env),
      /GEMINI_PRIMARY_MODEL/i
    );
  });

  test("throws when ADMIN_TELEMETRY_SECRET is missing", () => {
    const env = { ...validEnv, ADMIN_TELEMETRY_SECRET: undefined };
    assert.throws(
      () => validateProductionEnv(env),
      /ADMIN_TELEMETRY_SECRET/i
    );
  });

  test("error messages do NOT expose secret values", () => {
    const secretValue = "my-super-secret-leaked";
    const env = { ...validEnv, GEMINI_API_KEY: secretValue, GEMINI_PRIMARY_MODEL: "" };
    let errorMsg = "";
    try {
      validateProductionEnv(env);
    } catch (e: unknown) {
      errorMsg = (e as Error).message;
    }
    assert.ok(!errorMsg.includes(secretValue), "Error message must not expose secret values");
  });

  test("throws when multiple secrets are missing — lists all missing", () => {
    const env = { ...validEnv, GEMINI_API_KEY: "", ADMIN_TELEMETRY_SECRET: "" };
    let errorMsg = "";
    try {
      validateProductionEnv(env);
    } catch (e: unknown) {
      errorMsg = (e as Error).message;
    }
    assert.ok(errorMsg.includes("GEMINI_API_KEY") || errorMsg.includes("ADMIN_TELEMETRY_SECRET"), "must list missing keys");
  });
});
