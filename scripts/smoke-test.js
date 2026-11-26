import { readFileSync } from 'fs';

const API_BASE_URL = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL;
const FRONTEND_ORIGIN = process.env.ZANA_FRONTEND_ORIGIN || process.env.FRONTEND_ORIGIN || 'https://zana.idggov.tech';

if (!API_BASE_URL) {
  console.error("::error::ERROR: API_BASE_URL or VITE_API_BASE_URL must be specified as an environment variable.");
  process.exit(1);
}

console.log(`Running Production Smoke Tests against: ${API_BASE_URL}`);
console.log(`Using canonical frontend origin for tests: ${FRONTEND_ORIGIN}`);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, maxRetries = 2, delayMs = 2000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 && attempt < maxRetries) {
        console.log(`[Retry ${attempt + 1}/${maxRetries}] Got 429, retrying in ${delayMs}ms...`);
        await sleep(delayMs);
        continue;
      }
      return res;
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      await sleep(delayMs);
    }
  }
}

async function runSmokeAndCorsTest(name, path, options = {}, expectedStatus) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${path}`;
  console.log(`\n--- Test: ${name} (${options.method || 'GET'} ${path}) ---`);

  // Prepare body
  let bodyValue = options.body;

  // 1. Authorized Request
  const authHeaders = {
    'Origin': FRONTEND_ORIGIN,
    'X-CI-Test': 'true',
    ...(options.headers || {})
  };
  if (!(bodyValue instanceof FormData) && !authHeaders['Content-Type'] && options.method === 'POST') {
    authHeaders['Content-Type'] = 'application/json';
  }

  let ok = true;
  let responseText = "";
  let isCfAccess = false;

  try {
    const res = await fetchWithRetry(url, {
      ...options,
      redirect: 'manual',
      headers: authHeaders,
      body: bodyValue
    });

    responseText = await res.text();
    console.log(`[Authorized] Status: ${res.status}`);
    console.log(`[Authorized] Body Excerpt:`, responseText.slice(0, 200));

    // Verify HTTP Status (expectedStatus or Cloudflare Access 302/403 gate)
    const locationHeader = res.headers.get('location') || '';
    const authHeader = res.headers.get('www-authenticate') || '';
    isCfAccess = (res.status === 302 || res.status === 403) && (locationHeader + authHeader + responseText).toLowerCase().includes('cloudflare');

    if (res.status !== expectedStatus && !isCfAccess) {
      console.error(`::error::FAIL: ${name} (Authorized) status was ${res.status} (expected ${expectedStatus}). Response: ${responseText}`);
      ok = false;
    }

    // Verify CORS allowed origin
    const allowOrigin = res.headers.get('access-control-allow-origin');
    console.log(`[Authorized] CORS Header: ${allowOrigin}`);
    if (!allowOrigin && !isCfAccess) {
      console.error(`::error::FAIL: ${name} (Authorized) is missing Access-Control-Allow-Origin header.`);
      ok = false;
    } else if (allowOrigin === '*') {
      console.error(`::error::FAIL: ${name} (Authorized) returned wildcard CORS header.`);
      ok = false;
    } else if (allowOrigin && allowOrigin !== FRONTEND_ORIGIN && !isCfAccess) {
      console.error(`::error::FAIL: ${name} (Authorized) returned incorrect CORS header: ${allowOrigin} (expected ${FRONTEND_ORIGIN})`);
      ok = false;
    }
  } catch (err) {
    console.error(`::error::FAIL: ${name} (Authorized) request failed:`, err);
    ok = false;
  }

  // 2. Unauthorized Request (to verify it is not accepted as an allowed origin)
  const unauthHeaders = {
    'Origin': 'https://unauthorized.example',
    'X-CI-Test': 'true',
    ...(options.headers || {})
  };
  if (!(bodyValue instanceof FormData) && !unauthHeaders['Content-Type'] && options.method === 'POST') {
    unauthHeaders['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetchWithRetry(url, {
      ...options,
      redirect: 'manual',
      headers: unauthHeaders,
      body: bodyValue
    });

    const unauthAllowOrigin = res.headers.get('access-control-allow-origin');
    const unauthLoc = res.headers.get('location') || '';
    const unauthAuth = res.headers.get('www-authenticate') || '';
    const isUnauthCfAccess = (res.status === 302 || res.status === 403) && (unauthLoc + unauthAuth).toLowerCase().includes('cloudflare');

    console.log(`[Unauthorized] CORS Header: ${unauthAllowOrigin}`);
    if (unauthAllowOrigin === 'https://unauthorized.example' && !isUnauthCfAccess) {
      console.error(`::error::FAIL: ${name} (Unauthorized) accepted unauthorized origin https://unauthorized.example!`);
      ok = false;
    } else if (unauthAllowOrigin === '*') {
      console.error(`::error::FAIL: ${name} (Unauthorized) returned wildcard CORS header for unauthorized request.`);
      ok = false;
    } else {
      console.log(`[Unauthorized] CORS verification passed (unauthorized origin rejected or handled safely).`);
    }
  } catch (err) {
    console.error(`::error::FAIL: ${name} (Unauthorized) request failed:`, err);
    ok = false;
  }

  return { ok, body: responseText, isCfAccess };
}

async function main() {
  let allPassed = true;

  try {
    // 1. GET /api/health
    const healthTest = await runSmokeAndCorsTest("GET /api/health", "/api/health", { method: "GET" }, 200);
    if (!healthTest.ok) {
      allPassed = false;
    } else if (!healthTest.isCfAccess) {
      try {
        const data = JSON.parse(healthTest.body);
        if (data.status !== 'ok' || data.service !== 'new-vs-zana') {
          console.error(`::error::FAIL: GET /api/health response body was invalid: ${healthTest.body}`);
          allPassed = false;
        }
      } catch (e) {
        console.error(`::error::FAIL: GET /api/health returned non-JSON response.`);
        allPassed = false;
      }
    } else {
      console.log(`[Authorized] GET /api/health endpoint shielded by Cloudflare Access Zero Trust.`);
    }
    await sleep(500);

    // Protected AI endpoints must reject unauthenticated requests with 401 Unauthorized (never 200 or 5xx)
    const protectedEndpoints = [
      {
        name: "POST /api/chat (Unauthenticated rejected)",
        path: "/api/chat",
        body: JSON.stringify({
          message: "سڵاو",
          history: [],
          profile: { name: "قوتابی", grade: "10", activeSubject: "math", level: "beginner" }
        })
      },
      {
        name: "POST /api/assessment (Unauthenticated rejected)",
        path: "/api/assessment",
        body: JSON.stringify({
          state: { currentQuestion: 1, questions: ["پێشەکی"], answers: ["سڵاو"] },
          profile: { name: "قوتابی", grade: "10", activeSubject: "math", level: "beginner" }
        })
      },
      {
        name: "POST /api/report (Unauthenticated rejected)",
        path: "/api/report",
        body: JSON.stringify({
          profile: { name: "قوتابی", grade: "10", activeSubject: "math", level: "beginner" },
          summaryStats: { totalSessions: 5, weeklyQuestionCount: 12 }
        })
      },
      {
        name: "POST /api/study/ask (Unauthenticated rejected)",
        path: "/api/study/ask",
        body: JSON.stringify({
          message: "سڵاو",
          history: [],
          context: { studentName: "قوتابی", grade: "10", subject: "math", level: "beginner" }
        })
      },
      {
        name: "POST /api/study/vision (Unauthenticated rejected)",
        path: "/api/study/vision",
        body: (() => {
          const validPng = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            'base64'
          );
          const fd = new FormData();
          fd.append('image', new Blob([validPng], { type: 'image/png' }), 'test.png');
          fd.append('mode', 'explain');
          return fd;
        })()
      }
    ];

    for (const ep of protectedEndpoints) {
      const res = await runSmokeAndCorsTest(ep.name, ep.path, { method: "POST", body: ep.body }, 401);
      if (!res.ok) {
        allPassed = false;
      } else if (!res.isCfAccess) {
        try {
          const errData = JSON.parse(res.body);
          if (errData.error !== 'Unauthorized') {
            console.error(`::error::FAIL: ${ep.name} returned 401 without expected Unauthorized error field.`);
            allPassed = false;
          }
        } catch {
          console.error(`::error::FAIL: ${ep.name} returned non-JSON 401 response.`);
          allPassed = false;
        }
      }
      await sleep(500);
    }

    if (!allPassed) {
      console.error("\n❌ Production smoke tests FAILED.");
      process.exit(1);
    } else {
      console.log("\n✅ All production smoke tests passed successfully!");
      process.exit(0);
    }
  } catch (err) {
    console.error("❌ Exception occurred during smoke tests:", err);
    process.exit(1);
  }
}

main();
