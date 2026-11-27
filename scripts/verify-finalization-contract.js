import { existsSync, readFileSync } from 'node:fs';

const failures = [];

function read(path) {
  if (!existsSync(path)) {
    failures.push(`Required file is missing: ${path}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

function requireMatch(value, pattern, message) {
  if (!pattern.test(value)) failures.push(message);
}

function forbidMatch(value, pattern, message) {
  if (pattern.test(value)) failures.push(message);
}

const pkgText = read('package.json');
const wrangler = read('wrangler.jsonc');
const workflowPath = existsSync('.github/workflows/ci.yml') ? '.github/workflows/ci.yml' : '.github/workflows/ci.yml.disabled';
const workflow = read(workflowPath);
const models = read('src/server/config/aiModels.ts');
const worker = read('src/worker/index.ts');
const workerTests = read('src/worker/worker.test.ts');
const provider = read('src/server/ai/GeminiProvider.ts');
const smoke = read('scripts/smoke-test.js');

let pkg = {};
try {
  pkg = JSON.parse(pkgText);
} catch {
  failures.push('package.json is not valid JSON.');
}

// Production architecture contract.
requireMatch(wrangler, /"name"\s*:\s*"(?:new-vs-zana|zana-api-worker)"/, 'Cloudflare Worker name must be new-vs-zana or zana-api-worker.');
requireMatch(wrangler, /"main"\s*:\s*"src\/worker\/index\.ts"/, 'Cloudflare Worker entrypoint must remain src/worker/index.ts.');
requireMatch(wrangler, /"directory"\s*:\s*"\.\/dist\/client"/, 'Static Assets must remain bound to ./dist/client.');
requireMatch(wrangler, /https:\/\/www\.zana-ai\.tech/, 'Canonical frontend origin https://www.zana-ai.tech is missing from Wrangler configuration.');
requireMatch(wrangler, /https:\/\/zana\.idggov\.tech/, 'Legacy supported origin https://zana.idggov.tech is missing from Wrangler configuration.');
const allowedOrigins = (wrangler.match(/"ALLOWED_ORIGINS"\s*:\s*"([^"]+)"/) || [])[1] || '';
forbidMatch(allowedOrigins, /localhost|127\.0\.0\.1|\.web\.app|firebaseapp\.com/i, 'Production Wrangler configuration contains localhost, emulator, or Firebase Hosting routing.');
forbidMatch(wrangler, /"vars"[\s\S]*?"VITE_FIREBASE_API_KEY"/, 'VITE_FIREBASE_API_KEY must not be defined in wrangler.jsonc vars; it must be a Cloudflare Secret.');

// Canonical Gemini contract.
requireMatch(models, /primaryModel\s*:\s*"gemini-3\.6-flash"/, 'Primary Gemini model must be gemini-3.6-flash.');
requireMatch(models, /visionModel\s*:\s*"gemini-3\.6-flash"/, 'Vision Gemini model must be gemini-3.6-flash.');
requireMatch(provider, /FirebaseAIProvider/, 'GeminiProvider must use FirebaseAIProvider.');
forbidMatch(provider, /@google\/genai/, 'GeminiProvider must not import @google/genai.');
requireMatch(worker, /GEMINI_API_KEY\s*:\s*string/, 'Worker GEMINI_API_KEY binding contract is missing.');
requireMatch(worker, /PROVIDER_PREFLIGHT_TOKEN\??\s*:\s*string/, 'Worker provider preflight token binding contract is missing.');

// Deployment separation and mandatory quality gates.
const scripts = pkg.scripts || {};
for (const [name, command] of Object.entries(scripts)) {
  if (typeof command === 'string' && /firebase\s+deploy|hosting:|functions:/i.test(command)) {
    failures.push(`Forbidden Firebase Hosting/Functions deployment command in npm script ${name}.`);
  }
}
requireMatch(workflow, /npm run lint/, 'CI lint gate is missing.');
requireMatch(workflow, /npm run typecheck/, 'CI TypeScript gate is missing.');
requireMatch(workflow, /npm test/, 'CI test gate is missing.');
requireMatch(workflow, /npm run test:smoke/, 'Production smoke-test gate is missing.');
requireMatch(workflow, /Verify Production Exposure Security/, 'Production security exposure gate is missing.');
requireMatch(workflow, /Generate Release Tag & Metadata/, 'Release metadata gate is missing.');
requireMatch(workflow, /workflow_dispatch:/, 'Manual workflow_dispatch trigger is required for controlled deployment.');
requireMatch(workflow, /confirm_deploy\s*==\s*'DEPLOY'/, 'Production deployment must require explicit DEPLOY confirmation.');
requireMatch(workflow, /needs:\s*\[validate,\s*build,\s*wrangler-dry-run,\s*security-checks\]/, 'Production deploy job must depend on validate, build, dry-run, and security checks.');
requireMatch(workflow, /wrangler-dry-run:[\s\S]{0,250}?workflow_dispatch[\s\S]{0,160}?confirm_deploy\s*==\s*'DEPLOY'/, 'wrangler-dry-run must also run on gated workflow_dispatch deployments.');
requireMatch(workflow, /verify-worker:[\s\S]{0,200}?workflow_dispatch[\s\S]{0,160}?confirm_deploy\s*==\s*'DEPLOY'/, 'verify-worker must be gated on workflow_dispatch + DEPLOY.');
requireMatch(workflow, /smoke-tests:[\s\S]{0,200}?workflow_dispatch[\s\S]{0,160}?confirm_deploy\s*==\s*'DEPLOY'/, 'smoke-tests must be gated on workflow_dispatch + DEPLOY.');
requireMatch(workflow, /wrangler deploy --config wrangler\.production\.json/, 'Production deployment must use Wrangler and wrangler.production.json.');
forbidMatch(workflow, /wrangler\s+d1\s+migrations\s+apply\b[\s\S]*--remote/i, 'Code-only Worker deployment workflow must NOT execute remote D1 database migrations.');
forbidMatch(workflow, /wrangler\s+secret\s+put/i, 'Code-only Worker deployment workflow must NOT mutate Worker secrets.');
requireMatch(wrangler, /"binding"\s*:\s*"DB"/, 'D1 database binding DB is missing from wrangler.jsonc.');
requireMatch(wrangler, /"name"\s*:\s*"ADMIN_COMMAND_DO"/, 'Durable Object binding ADMIN_COMMAND_DO is missing from wrangler.jsonc.');
forbidMatch(workflow, /firebase\s+deploy|hosting:|functions:/i, 'CI contains a forbidden Firebase Hosting or Functions deployment.');

// Migration files & triggers contract.
const mig01 = read('migrations/0001_initial_schema.sql');
const mig02 = read('migrations/0002_admin_persistence.sql');
requireMatch(mig01, /CREATE TABLE IF NOT EXISTS students/, 'Migration 0001 must create students table.');
requireMatch(mig02, /CREATE TABLE IF NOT EXISTS admin_commands/, 'Migration 0002 must create admin_commands table.');
requireMatch(mig02, /CREATE TABLE IF NOT EXISTS audit_log/, 'Migration 0002 must create audit_log table.');
requireMatch(mig02, /trg_prevent_audit_log_update/, 'Migration 0002 must enforce append-only trigger trg_prevent_audit_log_update.');
requireMatch(mig02, /trg_prevent_audit_log_delete/, 'Migration 0002 must enforce append-only trigger trg_prevent_audit_log_delete.');

// Health route must stay HTTP 200; unauthenticated AI routes must enforce HTTP 401 Unauthorized.
requireMatch(smoke, /runSmokeAndCorsTest\("GET \/api\/health",\s*"\/api\/health",\s*\{[\s\S]{0,120}?\},\s*200\)/, 'Smoke test for GET /api/health must require HTTP 200.');

const protectedAiRoutes = [
  '/api/chat',
  '/api/assessment',
  '/api/report',
  '/api/study/ask',
  '/api/study/vision',
];
for (const route of protectedAiRoutes) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  requireMatch(smoke, new RegExp(`path:\\s*"${escaped}"`), `Smoke test entry for protected route ${route} is missing.`);
}
requireMatch(smoke, /runSmokeAndCorsTest\(ep\.name,\s*ep\.path,\s*\{[\s\S]{0,120}?\},\s*401\)/, 'Unauthenticated protected AI smoke tests must require HTTP 401.');
requireMatch(smoke, /errData\.error !== 'Unauthorized'/, 'Protected AI smoke tests must verify JSON Unauthorized rejection rather than arbitrary 401 errors.');

// Authenticated validation and auth contracts must remain covered in Worker source & tests.
requireMatch(worker, /status:\s*413/, 'Worker oversized vision payload (HTTP 413) guard is missing.');
requireMatch(worker, /status:\s*415/, 'Worker unsupported media signature (HTTP 415) guard is missing.');
requireMatch(workerTests, /missing payload on \/api\/chat returns 400/i, 'Authenticated 400 validation test on /api/chat is missing.');
requireMatch(workerTests, /Strict 401 Unauthorized on student AI routes/, 'Worker 401 Unauthorized regression test on student AI routes is missing.');

// Correct CORS and anti-5xx contracts must not be weakened.
requireMatch(smoke, /https:\/\/unauthorized\.example/, 'Unauthorized CORS-origin regression check is missing.');
forbidMatch(smoke, /expectedStatus\s*===?\s*500|\[\s*200\s*,\s*500\s*\]/, 'Smoke tests were weakened to accept HTTP 500.');

if (failures.length > 0) {
  console.error('\nZANA finalization contract FAILED:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ZANA finalization contract passed.');
console.log('Protected: Cloudflare architecture, Firebase separation, Gemini model/provider, CORS, AI route status contracts, security gates, and release gates.');
