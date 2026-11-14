import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { AdminD1Repository } from "../core/brain/storage/AdminD1Repository.ts";
import { LocalDurableObjectCoordinator } from "../core/brain/durable/AdminCommandCoordinator.ts";
import { GooglePublicKeyCache, verifyFirebaseIdToken } from "../worker/jwtVerifier.ts";
import { ExecutionPlan, AdminUser, AuditLogEntry } from "../core/brain/types.ts";

function createSamplePlan(commandId: string, level = 5): ExecutionPlan {
  return {
    commandId,
    rawCommand: "سڕینەوەی داتای کۆنی سیستەم",
    intent: "clean_old_records",
    intentKu: "خاوێنکردنەوەی تۆمارە کۆنەکان",
    actionLevel: level as never,
    riskAssessment: {
      score: 85,
      level: "critical",
      actionLevel: level as never,
      reasons: ["Critical data mutation"],
      requiresApproval: true,
      requiresDualApproval: level === 5,
      canRollback: true,
      impactedServices: ["database"],
    },
    steps: [
      {
        stepNumber: 1,
        title: "Backup pre-state",
        titleKu: "هەڵگرتنی دۆخی پێشوو",
        toolId: "backup_tool",
        toolCategory: "restricted",
        actionLevel: 5,
        params: {},
        expectedOutcome: "Save snapshot",
        expectedOutcomeKu: "پاشەکەوتکردنی سناپشۆت",
        isExecuted: false,
        status: "pending",
      },
    ],
    simulationSummary: "Simulation verified",
    simulationSummaryKu: "سیمولەیشن پشتڕاستکرایەوە",
    requiresApproval: true,
    requiresDualApproval: level === 5,
    isApproved: false,
    currentPhase: "plan",
    rollbackAvailable: true,
    rollbackPlanSummary: "Restore previous data",
    rollbackPlanSummaryKu: "گەڕاندنەوەی داتای پێشوو",
  };
}

describe("Production Admin State & Persistence Test Suite", () => {
  describe("1. D1 SQLite Migration & Append-Only Trigger Guarantees", () => {
    const db = new DatabaseSync(":memory:");
    const migrationSql = readFileSync("migrations/0002_admin_persistence.sql", "utf8");
    db.exec(migrationSql);

    test("All required tables are created by migration 0002", () => {
      const tables = [
        "admin_commands",
        "command_approvals",
        "command_execution_events",
        "audit_log",
        "admin_preferences",
        "rollback_snapshots",
        "audit_checkpoints",
      ];
      for (const table of tables) {
        const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?");
        const row = stmt.get(table);
        assert.ok(row, `Table ${table} must exist in database schema`);
      }
    });

    test("Append-only trigger strictly rejects any UPDATE on audit_log", () => {
      const insertStmt = db.prepare(`
        INSERT INTO audit_log (
          id, timestamp, actor_id, actor_name, actor_role, command_id, command_text,
          action_level, tool_category, risk_score, risk_level, execution_status,
          verification_passed, rollback_eligible, previous_hash, tamper_proof_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run(
        "audit-imm-1",
        "2026-11-13T20:00:00Z",
        "admin-1",
        "Security Lead",
        "super_admin",
        "cmd-imm-1",
        "Initial sensitive command",
        5,
        "system",
        90,
        "critical",
        "success",
        1,
        0,
        "GENESIS_HASH",
        "hash-initial-1"
      );

      assert.throws(
        () => {
          db.exec("UPDATE audit_log SET command_text = 'TAMPERED_RECORD' WHERE id = 'audit-imm-1'");
        },
        /AUDIT_LOG_IMMUTABLE.*Updates are strictly prohibited/
      );
    });

    test("Append-only trigger strictly rejects any DELETE on audit_log", () => {
      assert.throws(
        () => {
          db.exec("DELETE FROM audit_log WHERE id = 'audit-imm-1'");
        },
        /AUDIT_LOG_IMMUTABLE.*Deletions are strictly prohibited/
      );
    });
  });

  describe("2. Admin D1 Repository Operations", () => {
    const repo = new AdminD1Repository();

    test("Saves and retrieves ExecutionPlan", async () => {
      const plan = createSamplePlan("cmd-repo-1", 4);
      await repo.saveCommand(plan);
      const retrieved = await repo.getCommand("cmd-repo-1");

      assert.ok(retrieved);
      assert.strictEqual(retrieved?.commandId, "cmd-repo-1");
      assert.strictEqual(retrieved?.actionLevel, 4);
      assert.strictEqual(retrieved?.steps.length, 1);
      assert.strictEqual(retrieved?.riskAssessment.level, "critical");
    });

    test("Appends and retrieves hash-chained audit log", async () => {
      const log1: AuditLogEntry = {
        id: "audit-chain-1",
        timestamp: "2026-11-13T20:10:00Z",
        actor: {
          id: "lead-1",
          name: "Lead",
          role: "super_admin",
        },
        commandId: "cmd-repo-1",
        commandText: "Execute pipeline",
        actionLevel: 4,
        toolCategory: "controlled_action",
        riskScore: 60,
        riskLevel: "medium",
        executionStatus: "success",
        verificationPassed: true,
        rollbackEligible: false,
        previousHash: "GENESIS_ROOT",
        tamperProofHash: "hash-node-1",
      };
      await repo.appendAuditEvent(log1);

      const logs = await repo.getAuditLog();
      assert.ok(logs.some((l) => l.id === "audit-chain-1"));
    });

    test("Creates and stores cryptographic audit checkpoint", async () => {
      await repo.saveCheckpoint({
        checkpointId: "cp-test-001",
        latestAuditId: "audit-chain-1",
        entryCount: 5,
        headHash: "head-hash-abc",
        signatureOrHmac: "hmac-sha256-signature-xyz",
      });

      const latest = await repo.getLatestCheckpoint();
      assert.ok(latest);
      assert.strictEqual(latest?.checkpointId, "cp-test-001");
      assert.strictEqual(latest?.signatureOrHmac, "hmac-sha256-signature-xyz");
    });

    test("Saves and retrieves Admin Preferences Memory", async () => {
      await repo.upsertPreferences("admin-user-preferences-1", {
        notificationFrequency: "daily_digest",
        riskToleranceThreshold: 70,
        reportingStyle: "detailed",
        languagePreference: "ku",
      });

      const prefsList = await repo.getPreferences("admin-user-preferences-1");
      assert.ok(prefsList.length > 0);
      const prefs = prefsList[0];
      assert.strictEqual(prefs.notificationFrequency, "daily_digest");
      assert.strictEqual(prefs.riskToleranceThreshold, 70);
      assert.strictEqual(prefs.reportingStyle, "detailed");
      assert.strictEqual(prefs.languagePreference, "ku");
    });

    test("Saves and retrieves Rollback Snapshots", async () => {
      await repo.saveSnapshot("cmd-snap-1", "/var/data/state.json", { version: 1, active: true });

      const restored = await repo.getSnapshot("cmd-snap-1");
      assert.ok(restored);
      assert.strictEqual(restored?.targetPath, "/var/data/state.json");
      assert.deepStrictEqual(restored?.previousData, { version: 1, active: true });
    });
  });

  describe("3. Durable Object Coordinator & Dual Approval State Machine", () => {
    const coordinator = new LocalDurableObjectCoordinator();
    const plan = createSamplePlan("do-cmd-1", 5);

    test("Prepares and creates transactional state machine for command", async () => {
      const res = await coordinator.createPlan(plan);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.plan.commandId, "do-cmd-1");
      assert.strictEqual(res.plan.currentPhase, "plan");
    });

    test("Level 5 primary approval records first approver signature", async () => {
      const approver1: AdminUser = {
        id: "uid-approver-lead",
        name: "Admin Lead",
        role: "super_admin",
        email: "lead@zana.idggov.tech",
        permissions: ["*"],
      };

      const res = await coordinator.approvePlan(plan.commandId, approver1, false);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.isFullyApproved, false);
      assert.strictEqual(res.plan?.dualApproval?.primaryApproved, true);
      assert.strictEqual(res.plan?.dualApproval?.primaryApproverId, "uid-approver-lead");
    });

    test("Enforces Distinct Approvers: Rejects secondary approval from same UID", async () => {
      const sameApprover: AdminUser = {
        id: "uid-approver-lead", // Same UID as primary approver
        name: "Admin Lead Impersonator",
        role: "super_admin",
        email: "lead@zana.idggov.tech",
        permissions: ["*"],
      };

      const res = await coordinator.approvePlan(plan.commandId, sameApprover, true);
      assert.strictEqual(res.success, false);
      assert.match(res.error || "", /DUAL_APPROVAL_VIOLATION.*different administrator UID/i);
    });

    test("Secondary approval from distinct authorized auditor fully approves plan", async () => {
      const auditor: AdminUser = {
        id: "uid-approver-auditor-2",
        name: "Auditor SecOps",
        role: "auditor",
        email: "auditor@zana.idggov.tech",
        permissions: ["*"],
      };

      const res = await coordinator.approvePlan(plan.commandId, auditor, true);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.isFullyApproved, true);
      assert.strictEqual(res.plan?.dualApproval?.secondaryApproved, true);
      assert.strictEqual(res.plan?.isApproved, true);
    });

    test("Acquires atomic execution lock and prevents concurrent double execution", async () => {
      const lock1 = await coordinator.acquireExecutionLock(plan.commandId, plan.rawCommand);
      assert.strictEqual(lock1.success, true);

      // Concurrent request to execute same command must be rejected with 409
      const lock2 = await coordinator.acquireExecutionLock(plan.commandId, plan.rawCommand);
      assert.strictEqual(lock2.success, false);
      assert.match(lock2.error || "", /CONCURRENT_EXECUTION_CONFLICT/i);
    });

    test("Marks execution finished and rejects replay attacks", async () => {
      const executedPlan = { ...plan, isApproved: true, currentPhase: "learn" as const };
      await coordinator.finishExecution(plan.commandId, executedPlan);

      // Subsequent execution attempt must be rejected because it is already executed
      const replayLock = await coordinator.acquireExecutionLock(plan.commandId, plan.rawCommand);
      assert.strictEqual(replayLock.success, false);
      assert.match(replayLock.error || "", /ALREADY_EXECUTED/i);
    });

    test("Rollback transitions status and clears execution lock", async () => {
      const rb = await coordinator.rollback(plan.commandId);
      assert.strictEqual(rb.success, true);
      assert.strictEqual(rb.plan?.currentPhase, "learn");
      assert.strictEqual(rb.plan?.rollbackTriggered, true);
    });
  });

  describe("4. Web Crypto RS256 JWT Verification & JWKS Cache", () => {
    let keyPair: CryptoKeyPair;
    let publicKeyJwk: JsonWebKey;
    const keyId = "test-jwks-key-2026";
    const projectId = "gen-lang-client-0009572581";

    test("Generates cryptographic RSASSA-PKCS1-v1_5 RSA keypair for Web Crypto tests", async () => {
      keyPair = await crypto.subtle.generateKey(
        {
          name: "RSASSA-PKCS1-v1_5",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["sign", "verify"]
      );

      publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
      (publicKeyJwk as JsonWebKey & { kid?: string }).kid = keyId;
      publicKeyJwk.alg = "RS256";
      publicKeyJwk.use = "sig";

      assert.ok(publicKeyJwk.n);
      assert.ok(publicKeyJwk.e);

      // Pre-seed cache with test public key
      const cache = GooglePublicKeyCache.getInstance();
      await cache.setTestKey(keyId, publicKeyJwk);
    });

    async function createSignedToken(header: Record<string, unknown>, payload: Record<string, unknown>): Promise<string> {
      const encHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
      const encPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
      const dataToSign = new TextEncoder().encode(`${encHeader}.${encPayload}`);

      const signatureBytes = await crypto.subtle.sign(
        { name: "RSASSA-PKCS1-v1_5" },
        keyPair.privateKey,
        dataToSign
      );
      const encSignature = Buffer.from(signatureBytes).toString("base64url");
      return `${encHeader}.${encPayload}.${encSignature}`;
    }

    test("Successfully verifies valid RS256 token and caches JWKS", async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = await createSignedToken(
        { alg: "RS256", typ: "JWT", kid: keyId },
        {
          iss: `https://securetoken.google.com/${projectId}`,
          aud: projectId,
          sub: "verified-admin-uid-101",
          email: "addmin.official.idg@gmail.com",
          iat: now - 30,
          exp: now + 3600,
        }
      );

      const verification = await verifyFirebaseIdToken(token, projectId, {
        configuredEmails: ["addmin.official.idg@gmail.com"],
      });

      assert.strictEqual(verification.ok, true);
      assert.strictEqual(verification.email, "addmin.official.idg@gmail.com");
      assert.strictEqual(verification.uid, "verified-admin-uid-101");
      assert.strictEqual(verification.role, "system_admin");
    });

    test("Rejects token with expired timestamp (exp in the past)", async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = await createSignedToken(
        { alg: "RS256", typ: "JWT", kid: keyId },
        {
          iss: `https://securetoken.google.com/${projectId}`,
          aud: projectId,
          sub: "expired-admin",
          email: "addmin.official.idg@gmail.com",
          iat: now - 4000,
          exp: now - 100, // Expired 100s ago
        }
      );

      const verification = await verifyFirebaseIdToken(token, projectId, {
        configuredEmails: ["addmin.official.idg@gmail.com"],
      });

      assert.strictEqual(verification.ok, false);
      assert.match(verification.error || "", /Token.*expired/i);
    });

    test("Rejects token with invalid issuer", async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = await createSignedToken(
        { alg: "RS256", typ: "JWT", kid: keyId },
        {
          iss: "https://malicious-issuer.example.com",
          aud: projectId,
          sub: "untrusted-issuer-admin",
          email: "addmin.official.idg@gmail.com",
          iat: now,
          exp: now + 3600,
        }
      );

      const verification = await verifyFirebaseIdToken(token, projectId, {
        configuredEmails: ["addmin.official.idg@gmail.com"],
      });

      assert.strictEqual(verification.ok, false);
      assert.match(verification.error || "", /Invalid issuer/i);
    });

    test("Rejects token with invalid audience", async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = await createSignedToken(
        { alg: "RS256", typ: "JWT", kid: keyId },
        {
          iss: `https://securetoken.google.com/${projectId}`,
          aud: "wrong-project-audience-999",
          sub: "wrong-audience-admin",
          email: "addmin.official.idg@gmail.com",
          iat: now,
          exp: now + 3600,
        }
      );

      const verification = await verifyFirebaseIdToken(token, projectId, {
        configuredEmails: ["addmin.official.idg@gmail.com"],
      });

      assert.strictEqual(verification.ok, false);
      assert.match(verification.error || "", /Invalid audience/i);
    });

    test("Rejects token with tampered cryptographic signature", async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = await createSignedToken(
        { alg: "RS256", typ: "JWT", kid: keyId },
        {
          iss: `https://securetoken.google.com/${projectId}`,
          aud: projectId,
          sub: "tampered-admin",
          email: "addmin.official.idg@gmail.com",
          iat: now,
          exp: now + 3600,
        }
      );

      // Tamper signature by changing last 4 characters
      const parts = token.split(".");
      parts[2] = parts[2].substring(0, parts[2].length - 4) + "AAAA";
      const tamperedToken = parts.join(".");

      const verification = await verifyFirebaseIdToken(tamperedToken, projectId, {
        configuredEmails: ["addmin.official.idg@gmail.com"],
      });

      assert.strictEqual(verification.ok, false);
      assert.match(verification.error || "", /Cryptographic signature verification failed/i);
    });

    test("Rejects non-admin user email without custom claims (deny-by-default)", async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = await createSignedToken(
        { alg: "RS256", typ: "JWT", kid: keyId },
        {
          iss: `https://securetoken.google.com/${projectId}`,
          aud: projectId,
          sub: "regular-student-user-456",
          email: "student@example.com", // Not an admin email
          iat: now,
          exp: now + 3600,
        }
      );

      const verification = await verifyFirebaseIdToken(token, projectId, {
        configuredEmails: ["addmin.official.idg@gmail.com"],
      });

      assert.strictEqual(verification.ok, false);
      assert.match(verification.error || "", /Authenticated user lacks administrative privileges/i);
    });
  });
});
