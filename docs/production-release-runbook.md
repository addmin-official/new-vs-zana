# ZANA — Production Release & Migration Runbook

> **Overall Release Package Status:** `VERIFIED` (Local Release Candidate) / `NOT EXECUTED` (Remote Production Migration & Deploy)  
> **Updated:** 2026-11-25  
> **Target Worker:** `new-vs-zana` (`https://zana.idggov.tech`)  
> **Target D1 Database:** `new-vs-zana` (`b8929b42-eaae-42c4-a364-b601ab285be5`)

---

## 1. Release Summary

This release candidate enforces Firebase verified-email authentication (`Register.tsx`, `Login.tsx`, `authService.ts` verification link/reload recovery), blocks forged `body.email` / `body.studentEmail` / `phone_number` / synthetic `<uid>@zana.edu.krd` / `@student.krd` contamination across `subscriptions`, `payment_receipts`, admin student updates, and UI state, preserves returning students' `name`/`grade`/`stream` in `/api/trial/start`, fixes Worker `429` CORS/security headers propagation, eliminates cross-UID `localStorage` and Service Worker / HTTP response cache leakage (`vite.config.ts` Workbox rule + `Cache-Control: no-store` on private `/api/*` + `max-age=0` on `/sw.js`), removes unsupported phone registration/login UI tabs (SMS out of scope), enforces `school_name` onboarding without National ID, and isolates production D1 migrations in `migrations_production/`.

* **SMS / Phone Registration Policy (`OUT OF SCOPE — NOT A RELEASE BLOCKER`):** ZANA uses verified Email/Password and Google Sign-In only for this release. User-facing phone OTP tabs are removed from `Login.tsx` and `Register.tsx`; `/api/auth/phone/*` fails closed (`503 SMS_PROVIDER_NOT_CONFIGURED`); `FIREBASE_PHONE_AUTH_SETUP.md` is marked future/unsupported.

---

## 2. Release Commit Identification

* **Base / Parent Commit (`VERIFIED`):** `714cc559ab51d72d210bfd607361a9a3b9007280` (`release: finalize ZANA production candidate`)
* **Release Commit Subject (`main`):** `release: finalize ZANA production-ready candidate`
* **Release Commit SHA (`RELEASE_SHA`):** Resolve dynamically via `git rev-parse HEAD` after checkout and export as `GITHUB_SHA=$(git rev-parse HEAD)` before running `scripts/resolve-kv.js` (Git commit objects cannot embed their own resulting SHA hash inside their own committed tree without altering the hash).
* **Currently Deployed Live Worker Revision (`VERIFIED` read-only via `/api/health`):** `96ee76f`

---

## 3. Environment Configuration Checklist (`VERIFIED` Read-Only)

| Setting / Binding | Expected Production Value | Verification Status |
|---|---|---|
| Worker `name` | `new-vs-zana` | `VERIFIED` ([wrangler.jsonc](file:///Users/imacos/Documents/Codex/2026-11-13/xa/work/new-vs-zana-main/wrangler.jsonc)) |
| Custom Domain | `zana.idggov.tech` (`custom_domain: true`) | `VERIFIED` |
| Production `migrations_dir` | `./migrations_production` (injected into `wrangler.production.json` by `scripts/resolve-kv.js`) | `VERIFIED` |
| D1 Binding `DB` | `new-vs-zana` (`b8929b42-eaae-42c4-a364-b601ab285be5`) | `VERIFIED` |
| Durable Object | `ADMIN_COMMAND_DO` -> `AdminCommandDO` (tag `v1`) | `VERIFIED` |
| KV Namespaces | `RATE_LIMIT_KV` (`02f34218...`), `LEARNING_RECORDS_KV` (`a29b3059...`) | `VERIFIED` |
| R2 Bucket | `ZANA_CURRICULUM_BUCKET` -> `zana-curriculum` | `VERIFIED` |
| Static Assets | `./dist/client` (`binding: ASSETS`, `not_found_handling: single-page-application`) | `VERIFIED` |
| Firebase Project | `gen-lang-client-0009572581` (`gen-lang-client-0009572581.firebaseapp.com`) | `VERIFIED` |
| `ALLOWED_ORIGINS` | `https://zana.idggov.tech,https://new-vs-zana.zana-platform.workers.dev` | `VERIFIED` |
| Dev Auth Bypass | `ALLOW_TEST_AUTH_MOCK` / `ZANA_ENV=test` absent; `verifyAuthToken` / `verifyFirebaseIdToken` unconditionally block mock tokens in production | `VERIFIED` |
| Runtime Secrets (`wrangler secret list`) | 11 secret names configured (`ADMIN_TELEMETRY_SECRET`, `CF_AIG_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `GEMINI_API_KEY`, `JWT_SECRET`, `PROVIDER_PREFLIGHT_TOKEN`, `VITE_API_BASE_URL`, `VITE_FIREBASE_API_KEY`, `ZANA_CURRICULUM_DOCUMENT_IDS`, `ZANA_CURRICULUM_DOCUMENT_URI`) | `VERIFIED` (names only; values never printed) |
| SMS Provider (`SMS_PROVIDER`) | Absent by design; UI phone registration/login removed; `/api/auth/phone/send-otp` returns `503 SMS_PROVIDER_NOT_CONFIGURED` | `VERIFIED` (Out of Scope / Future) |
| Optional Phone Custom Token Keys | `FIREBASE_SERVICE_ACCOUNT_KEY` / `AUDIT_HMAC_SECRET` absent (not required while SMS is out of scope) | `VERIFIED` (Out of Scope / Future) |

---

## 4. Production Preflight Results (`EXECUTED` / `VERIFIED` Read-Only Live Inspection, 2026-11-25)

* **`GET https://zana.idggov.tech/api/health` (`EXECUTED` / `VERIFIED`):** `HTTP/2 200`, `{"ok":true,"status":"ok","service":"new-vs-zana","revision":"96ee76f"}`, security headers & HSTS present.
* **Live Remote `d1_migrations` (`EXECUTED` / `VERIFIED` read-only):** 6 entries (`0001_initial_schema.sql`, `0002_admin_persistence.sql`, `0002_real_world_schema.sql`, `0003_subscriptions.sql`, `0004_students_email.sql`, `0005_notifications.sql`).
* **Live Row Counts (`VERIFIED`):** `students = 3`, `users = 3`, `subscriptions = 11`, `curriculum = 71`, `curriculum_pages = 71`, `payment_receipts = 2`.
* **Live Schema Flags (`VERIFIED`):** `nid_objects = 0`, `phone_verifications_tbl = 0`, `students_phone_col = 0`, `users_phone_col = 0`, `students_school_col = 0`, `users_school_col = 0`, `subs_email_col = 0`.
* **Admin Role (`VERIFIED`):** `uNZzgQaPDjTO8IYBncGVZekGQxN2` -> `role = 'admin'`; `J3J0WM7hKBSpvuCJLUJAldo4I652` -> `student`; `JBj1YF1VqCUj6MpBI4yqo2CMzfr2` -> `student`.
* **Subscriptions (`VERIFIED`):** 11 rows (3 linked to `students`/`users`, 8 historical orphaned subscriptions preserved intact).
* **Payment Receipts (`VERIFIED`):** 2 rows (`rcpt_1795027392822_ckn5c` pending `monthly`, `rcpt_1795179085508_cpjfh` rejected `yearly`).

### 4.1 Production Data Preservation Requirements (Mandatory Invariants)

Production migrations (`0008`–`0010` via `migrations_production/`) and Worker deployment **must preserve all existing production records intact**:
* **All existing users & admin roles:** `users` remains 3 rows; `uNZzgQaPDjTO8IYBncGVZekGQxN2` strictly retains `role = 'admin'` (`0006` is never re-executed).
* **All student accounts & trial timestamps:** All existing `students` rows, `subscriptions.trial_started_at`, `subscriptions.trial_ends_at`, `subscriptions.status`, and `subscriptions.plan_id` remain unmodified.
* **All 8 orphaned subscriptions:** Never deleted, merged, reassigned, or assigned synthetic email identities (`email` remains `NULL` for all 8 orphans and for `J3J0WM7hKBSpvuCJLUJAldo4I652`).
* **All payment receipts & curriculum:** `payment_receipts` (`2` rows), `curriculum` (`71` rows), `curriculum_pages` (`71` rows), and historical `migrations/` remain unmodified.
* **No National ID:** Zero `national_id_*` columns, indexes, or collection UI exist in `migrations_production/` or the production app.

---

## 5. Fresh Backup Procedure (Stage B — `NOT EXECUTED` for Release Deployment)

> Note: Existing read-only pre-release backups (`backup_20261124_234842.sql` and `backup_remote_20261125_000443.sql`) are preserved untouched and ignored by `.gitignore`. Capture a fresh external backup below immediately before running Stage C/D.

```bash
# NOT EXECUTED — Run immediately before Stage C/D
BACKUP_TS=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/zana-prod-backups"
BACKUP_FILE="$BACKUP_DIR/zana_prod_pre_release_${BACKUP_TS}.sql"
mkdir -p "$BACKUP_DIR"

# 1. Export remote production D1
npx wrangler d1 export new-vs-zana --remote --output "$BACKUP_FILE"

# 2. Record file size and SHA-256 checksum
ls -lh "$BACKUP_FILE"
shasum -a 256 "$BACKUP_FILE" > "${BACKUP_FILE}.sha256"
cat "${BACKUP_FILE}.sha256"

# 3. Verify backup readability in an isolated temporary SQLite database
TMP_RESTORE_DB="/tmp/zana_restore_verify_${BACKUP_TS}.db"
rm -f "$TMP_RESTORE_DB"
sqlite3 "$TMP_RESTORE_DB" ".read $BACKUP_FILE"
sqlite3 "$TMP_RESTORE_DB" "
  SELECT 'students=' || COUNT(*) FROM students;
  SELECT 'users=' || COUNT(*) FROM users;
  SELECT 'subscriptions=' || COUNT(*) FROM subscriptions;
  SELECT 'curriculum_pages=' || COUNT(*) FROM curriculum_pages;
  SELECT 'payment_receipts=' || COUNT(*) FROM payment_receipts;
  SELECT id, role FROM users ORDER BY id;
"
rm -f "$TMP_RESTORE_DB"
```

---

## 6. Before/After Verification Queries (`VERIFIED` Against Isolated Restored Temp D1 / `NOT EXECUTED` on Remote)

Run **before** reconciliation (`pre_snapshot.txt`) and **immediately after** migration (`post_snapshot.txt`), then compare:

```sql
-- Record parity snapshot (save to pre_snapshot.txt before, post_snapshot.txt after)
SELECT 'students_cnt=' || COUNT(*) FROM students;
SELECT 'users_cnt=' || COUNT(*) FROM users;
SELECT 'subscriptions_cnt=' || COUNT(*) FROM subscriptions;
SELECT 'curriculum_pages_cnt=' || COUNT(*) FROM curriculum_pages;
SELECT 'payment_receipts_cnt=' || COUNT(*) FROM payment_receipts;

SELECT id, firebase_uid, COALESCE(name,'<NULL>'), COALESCE(grade,'<NULL>'), LOWER(COALESCE(email,'<NULL>')), created_at
FROM students ORDER BY id;

SELECT id, LOWER(COALESCE(email,'<NULL>')), name, role, COALESCE(grade,'<NULL>'), COALESCE(stream,'<NULL>'), created_at, last_active
FROM users ORDER BY id;

SELECT user_id, status, trial_started_at, trial_ends_at, COALESCE(plan_id,'<NULL>'), updated_at
FROM subscriptions ORDER BY user_id;

SELECT id, user_id, plan_id, receipt_code, status, submitted_at, COALESCE(reviewed_at,'<NULL>')
FROM payment_receipts ORDER BY id;

-- Post-migration invariants (MUST satisfy exact values)
SELECT 'd1_migrations_cnt=' || COUNT(*) FROM d1_migrations;        -- expect 11
SELECT id, name FROM d1_migrations ORDER BY id;                     -- expect 0001..0010 (0009_student_onboarding_school_name.sql)
SELECT 'nid_objects=' || COUNT(*) FROM sqlite_master WHERE sql LIKE '%national_id%'; -- expect 0
SELECT 'students_school=' || COUNT(*) FROM pragma_table_info('students') WHERE name='school_name'; -- expect 1
SELECT 'users_school=' || COUNT(*) FROM pragma_table_info('users') WHERE name='school_name';       -- expect 1
SELECT 'students_phone=' || COUNT(*) FROM pragma_table_info('students') WHERE name='phone';        -- expect 1
SELECT 'users_phone=' || COUNT(*) FROM pragma_table_info('users') WHERE name='phone';              -- expect 1
SELECT 'phone_verifications_tbl=' || COUNT(*) FROM sqlite_master WHERE type='table' AND name='phone_verifications'; -- expect 1
SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%unique_email' ORDER BY name; -- expect 3 indexes
SELECT user_id, COALESCE(email,'<NULL>') AS sub_email FROM subscriptions ORDER BY user_id;
-- Expect J3J0WM7hKBSpvuCJLUJAldo4I652 -> <NULL>, all 8 orphans -> <NULL>,
-- JBj1YF1VqCUj6MpBI4yqo2CMzfr2 -> tmark7842@gmail.com, uNZzgQaPDjTO8IYBncGVZekGQxN2 -> addmin.official.idg@gmail.com
```

---

## 7. Migration Reconciliation Plan & Commands (`NOT EXECUTED` on Production / `BLOCKED` Until Authorized)

### Why `0006` and `0007` Require Controlled Reconciliation (Never Re-Executed)
* `0006_users_and_curriculum_pages.sql` executes `INSERT OR REPLACE INTO users ... 'student' as role ... FROM students`. Re-running it would **demote admin `uNZzgQaPDjTO8IYBncGVZekGQxN2` back to `'student'`** and overwrite `last_active`.
* Equivalence checks on the live schema and backup proved `users` (3/3), `curriculum_pages` (71/71, 0 field mismatches), `payment_receipts` (2/2), and all `0006`/`0007` indexes are already present in production (`VERIFIED`).
* `0009_student_onboarding_national_id.sql` was **never** executed in production and **must never** be recorded in `d1_migrations` or executed remotely.

### Stage C — Preflight Equivalence Verification (`NOT EXECUTED` for Deployment Cutover)

```bash
npx wrangler d1 execute new-vs-zana --remote --command "
  SELECT id, name FROM d1_migrations ORDER BY id;
  SELECT COUNT(*) AS nid_objects FROM sqlite_master WHERE sql LIKE '%national_id%';
  SELECT (SELECT COUNT(*) FROM curriculum) AS curr_cnt, (SELECT COUNT(*) FROM curriculum_pages) AS cp_cnt;
  SELECT id, role FROM users ORDER BY id;
  SELECT COUNT(*) AS receipt_cnt FROM payment_receipts;
"
```
**STOP GATE:** Proceed to reconciliation **only** if `d1_migrations` ends at `0005_notifications.sql`, `nid_objects = 0`, `curr_cnt = cp_cnt = 71`, `uNZzgQaPDjTO8IYBncGVZekGQxN2` has `role = 'admin'`, and `payment_receipts` schema/rows match.

### Stage C.2 — Controlled One-Time History Reconciliation SQL (`NOT EXECUTED` / `BLOCKED`)

```bash
# NOT EXECUTED — DO NOT RUN WITHOUT EXPLICIT PRODUCTION AUTHORIZATION
npx wrangler d1 execute DB --remote --config wrangler.production.json --command "
  INSERT INTO d1_migrations (name) VALUES
    ('0006_users_and_curriculum_pages.sql'),
    ('0007_payment_receipts.sql');
"
```

### Stage D — Production Migration Execution (`NOT EXECUTED` / `BLOCKED`)

```bash
# 1. Generate wrangler.production.json (sets migrations_dir: './migrations_production' and ZANA_REVISION)
export GITHUB_SHA=$(git rev-parse HEAD)
node scripts/resolve-kv.js
jq '.d1_databases[0].migrations_dir, .vars.ZANA_REVISION' wrangler.production.json

# 2. Preview pending migrations (MUST list ONLY 0008, 0009_student_onboarding_school_name.sql, 0010)
npx wrangler d1 migrations list DB --remote --config wrangler.production.json

# 3. Apply pending migrations (NOT EXECUTED)
npx wrangler d1 migrations apply DB --remote --config wrangler.production.json
```

---

## 8. Deployment Sequence (Stages A–G)

* **Stage A — Release Verification & Local Commit (`EXECUTED` & `VERIFIED` locally; push/merge `NOT EXECUTED`):** Confirm local commit `release: finalize ZANA production-ready candidate` on `main` (`git rev-parse HEAD`), verify clean working tree (`backup*.sql` ignored), confirm `typecheck`, `lint`, `test:unit`, `npm test`, `build:client`, `wrangler deploy --dry-run`, isolated D1 tests, `git diff --check`, and Playwright E2E pass.
* **Stage B — Production Backup (`NOT EXECUTED`):** Execute Section 5 backup & restore verification.
* **Stage C — Migration Preflight & Controlled Reconciliation (`NOT EXECUTED` / `BLOCKED`):** Run Stage C read-only check; if 100% confirmed, execute Stage C.2 reconciliation SQL.
* **Stage D — Production Migration (`NOT EXECUTED` / `BLOCKED`):** Generate `wrangler.production.json`, verify `migrations list` shows only `0008`, `0009_student_onboarding_school_name.sql`, `0010`, then run `wrangler d1 migrations apply DB --remote --config wrangler.production.json`.
* **Stage E — Migration Verification (`NOT EXECUTED`):** Run Section 6 post-migration SQL and compare against `pre_snapshot.txt`.
* **Stage F — Worker Deployment (`NOT EXECUTED` / `BLOCKED`):**
  ```bash
  # NOT EXECUTED — DO NOT RUN WITHOUT EXPLICIT PRODUCTION AUTHORIZATION
  npm run build:client
  node scripts/check-secrets.js
  npx wrangler deploy --config wrangler.production.json
  ```
* **Stage G — Live Smoke Tests (`NOT VERIFIED` pre-deploy / `NOT EXECUTED` post-deploy):**
  ```bash
  # 1. Automated production smoke + CORS suite
  API_BASE_URL=https://zana.idggov.tech npm run test:smoke

  # 2. Verify live revision matches released commit short SHA
  curl -sS https://zana.idggov.tech/api/health

  # 3. Verify unauthenticated fail-closed auth gates (expect HTTP 401) + Cache-Control: no-store
  curl -sS -D - -o /dev/null https://zana.idggov.tech/api/student/profile
  curl -sS -D - -o /dev/null https://zana.idggov.tech/api/subscription/status

  # 4. Verify /sw.js serves with Cache-Control: public, max-age=0, must-revalidate
  curl -sS -D - -o /dev/null https://zana.idggov.tech/sw.js

  # 5. Verify unauthorized admin access is rejected (expect HTTP 403)
  curl -sS -o /dev/null -w "%{http_code}\n" https://zana.idggov.tech/api/admin/subscriptions

  # 6. Verify phone OTP remains fail-closed while SMS is out of scope (expect HTTP 503)
  curl -sS -X POST -H "Origin: https://zana.idggov.tech" -H "Content-Type: application/json" \
    -d '{"phone":"07501234567"}' https://zana.idggov.tech/api/auth/phone/send-otp

  # 7. Authenticated verification with dedicated test student & admin accounts (email verification flow + onboarding without overwriting real records)
  ```

---

## 9. Rollback and Incident Response

> **Critical Rule:** Worker code rollback (`wrangler rollback`) **does not** reverse D1 schema or data changes. Any production incident requires halting further rollout immediately, preserving logs/snapshots, and never automatically overwriting live data.

1. **Worker Code Rollback:**
   - Run `npx wrangler rollback --config wrangler.production.json` (or redeploy previous known-good commit `96ee76f`).
   - Verify `GET https://zana.idggov.tech/api/health` returns the rolled-back `revision`.
2. **D1 Migration Failure:**
   - Wrangler executes each migration atomically and rolls back a failed migration file, leaving prior migrations intact. Inspect `d1_migrations` and `sqlite_master` (`--remote` read-only) before taking any recovery action.
3. **Data Integrity Failure (Admin role, ownership, or timestamps altered):**
   - Stop Worker rollout / disable writes immediately; capture current remote export for forensics; restore using Cloudflare D1 Time Travel (`npx wrangler d1 time-travel info new-vs-zana` -> `restore` to pre-migration bookmark) or the verified Stage B backup SQL.
   - **Warning:** Point-in-time / backup restoration **overwrites writes made after the backup timestamp**.
4. **Authentication Regression (legitimate users locked out or unverified emails accepted):**
   - Roll back Worker deployment immediately via `npx wrangler rollback --config wrangler.production.json`; preserve failed request correlation IDs from Cloudflare Observability logs.
5. **Student Account Isolation Failure (cross-UID data or cache exposure):**
   - Roll back Worker deployment immediately; audit `students`, `users`, and `subscriptions` rows created after deployment timestamp against pre-migration backup; invalidate/clear client caches by bumping deployment assets (`dist/client` revision).

---

## 10. Outstanding Blockers & Scope Notes

1. **Authorized Controlled Reconciliation of `0006`/`0007` (`BLOCKED` until authorized):** Production `d1_migrations` stops at `0005`; `0006` and `0007` must be reconciled into `d1_migrations` before Wrangler applies `0008`–`0010`.
2. **Production Backup, Migration & Worker Deploy (`NOT EXECUTED` / `BLOCKED` until authorized):** All remote D1 and Cloudflare Worker operations remain unexecuted pending explicit production release authorization.
3. **Live Post-Deploy Smoke & Firebase/D1 E2E Verification (`NOT VERIFIED` pre-deploy):** Local Playwright E2E verifies client UI, phone-tab removal, mobile viewports, account-switching `localStorage` isolation, and mocked `503` handling, while real Firebase email verification/JWT + Worker D1 persistence are verified locally via real-SQLite Vitest/Node integration suites and await Stage G live verification post-deploy.
4. **SMS / Phone Auth (`OUT OF SCOPE — NOT A BLOCKER`):** Intentionally excluded at this stage; user-facing phone tabs removed cleanly while backend `/api/auth/phone/*` remains fail-closed (`503`).

---

## 11. Final Authorization Checklist

- [x] Local release commit `release: finalize ZANA production-ready candidate` verified cleanly on `main` (parent `714cc559ab51d72d210bfd607361a9a3b9007280`; resolve `RELEASE_SHA=$(git rev-parse HEAD)`).
- [ ] Operator captures and verifies fresh pre-migration production backup + SHA-256 checksum (Stage B).
- [ ] Operator executes Stage C read-only check and confirms `d1_migrations` ends at `0005`, `nid_objects = 0`, `admin` preserved.
- [ ] Operator explicitly authorizes Stage C.2 reconciliation (`0006`, `0007`) and Stage D migration (`0008`, `0009_student_onboarding_school_name.sql`, `0010`).
- [ ] Operator verifies Stage E post-migration SQL invariants against immediate pre-migration snapshot.
- [ ] Operator explicitly authorizes Stage F `wrangler deploy --config wrangler.production.json`.
- [ ] Operator executes Stage G live smoke tests and signs off release closure.
