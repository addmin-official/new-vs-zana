# ڕاپۆرتی بڵاوکردنەوەی بەرهەمهێنان بۆ ڕووکاری نوێی ZANA (Modern UI Production Deployment Report)

**بەروار:** ١٤ی تشرینی دووەمی ٢٠٢٦  
**کات:** ١٣:٤٥ (کاتی کوردستان / UTC+3)  
**پڕۆژە:** `/Users/imacos/Documents/Codex/2026-11-13/xa/work/new-vs-zana-main`  
**لقی فەرمیی Git:** `main`  
**کۆمیتی بنچینەیی:** `133b45c` (لەخۆگری تەواوی چاکسازییەکانی ڕووکاری نوێ `1c63142e` و ڕۆتینگی `321a708`)  
**دۆخی دار (Working Tree):** خاوێن (Clean)  
**دۆمەینی فەرمی و دەستووریی بەرهەمهێنان (Canonical Origin):** `https://zana.idggov.tech`  
**ناسنامەی پێشووی وەشانی زیندوو (Pre-Deploy Version ID):** `0a5f7b9f-70d3-4ce6-88a0-b2cfcfaaf32e`  
**ناسنامەی نوێی وەشانی بڵاوکراوە (Deployed Version ID):** `c3de0841-cdf1-4bf1-b79e-ee760243b312`  
**کاتی چالاکبوونی وەرگێڕ (Worker Startup Time):** ١٤ میلی‌چرکە (14ms)  
**ناونیشانی سێرڤەر:** `https://new-vs-zana.zana-platform.workers.dev`  
**هەژماری Cloudflare:** `9bbac6865a80cafb336c82029cc7bb49`  

---

## ١. پوختەی جێبەجێکردن (Executive Summary)

بەپێی دەسەڵاتی ڕاستەوخۆ، بڵاوکردنەوەی ژینگەی بەرهەمهێنان (Production Deployment) بۆ پلاتفۆرمی **ZANA** بە مەبەستی گەڕاندنەوەی وەشانی نوێی دەوڵەمەندی مۆدێرن و یەکجاری چارەسەرکردنی دەرکەوتنی ڕووکاری کۆن بە سەرکەوتوویی 100% ئەنجامدرا.

سەرجەم سەرمایە نەگۆڕە نوێیەکان (Static Assets) کە پێکهاتوون لە ٥٠ پەڕگەی نوێی Vite بە قەبارەی نزیکەی ٣ مێگابایت (لەخۆگری لاپەڕەکانی `Home`, `Chat`, `PracticeLab`, `AdaptiveAssessment`, `VirtualScienceLab`, `ProfileAndSettings`, `StudyPathManager`, `StudyRooms`, `ParentReport`, `BrainAdminDashboard`) بۆ بەستنەوەی `env.ASSETS` لەسەر ژێرخانی Cloudflare Edge بڵاوکرانەوە. لە هەمان کاتدا خزمەتگوزارییەکانی Worker، D1 Database، Durable Objects و بەستنەوەکانی ڕێڕەوی مەنهەج چالاک کران.

---

## ٢. پشکنینەکانی پێش بڵاوکردنەوە (Pre-Deployment Quality Gates)

پێش دەستپێکردنی بڵاوکردنەوە، هەموو مەرج و گرێبەستەکانی سیستەم سەلمێنران:

| فاکتەری پشکنین | پێوەر | ئەنجام | دۆخ |
| :--- | :--- | :--- | :---: |
| **دۆخی Git** | لقی `main`، لەسەر کۆمیتەکانی UI | `133b45c` (لەخۆگری `1c63142e` و `321a708`) | ✅ سەرکەوتوو |
| **پشکنینی تایپسکریپت** | `npm run typecheck` (`tsc --noEmit`) | دەرچوون بە کۆدی 0، بەبێ هیچ هەڵەیەکی جۆری | ✅ سەرکەوتوو |
| **پشکنینی Lint** | `npm run lint` (`eslint . --max-warnings=0`) | تێپەڕینی هەموو فایلەکان بەبێ هیچ ئاگاداری و هەڵەیەک | ✅ سەرکەوتوو |
| **تاقیکردنەوەی یەکەکان** | `npm test` | **٢٠٣ تاقیکردنەوە لە نێو ١٢ باوەش (Suites) بە سەرکەوتوویی تێپەڕین** (0 شکستهێنان) | ✅ سەرکەوتوو |
| **گرێبەستی کۆتایی** | `node scripts/verify-finalization-contract.js` | مەرجەکانی Worker، مۆدێلی Gemini، پاراستنی CORS و نەبوونی کۆدی Firebase تێپەڕین | ✅ سەرکەوتوو |
| **بنیاتنانی کۆد (Build)** | `npm run build` | دروستبوونی ٥٠ سەرمایەی کڕیار لە `./dist/client` و `dist/server.cjs` (702.4kB) | ✅ سەرکەوتوو |
| **پوختەی وشک (Dry-run)** | `npx wrangler deploy --dry-run` | پشکنینی سەرکەوتووانەی هەموو بەستنەوەکان و کۆدی Worker بەبێ هەڵە | ✅ سەرکەوتوو |

---

## ٣. بەستنەوەکانی ژینگەی بەرهەمهێنان (Production Bindings Verification)

سەرجەم سەرچاوە و بەستنەوە پێویستەکان لە هەژماری Cloudflare بەستراونەتەوە:

1. **بنکەدراوەی D1 (`env.DB`):**
   - ناوی بنکەدراوە: `new-vs-zana`
   - ناسنامە: `b8929b42-eaae-42c4-a364-b601ab285be5`
   - دۆخی مایگرەیشن: `✅ No migrations to apply!` (مایگرەیشنەکانی 0001 و 0002 بە تەواوی ئامادەن).
2. **کلاسی بەردەوامیی ئادمین (`env.ADMIN_COMMAND_DO`):**
   - پۆلی Durable Object بە ناوی `AdminCommandDO`.
   - بەکارهێنانی تەلارسازیی `new_sqlite_classes: ["AdminCommandDO"]`.
3. **پاشەکەوتەکانی خێرای KV:**
   - `RATE_LIMIT_KV`: ناسنامەی `02f342188c8740b0ada898c36791e4a3`.
   - `LEARNING_RECORDS_KV`: ناسنامەی `a29b305980c94e169a741f4b29b9516e`.
4. **سەتڵی پەڕگەکانی مەنهەج (`env.ZANA_CURRICULUM_BUCKET`):**
   - سەتڵی R2: `zana-curriculum`.
5. **سەرمایە نەگۆڕەکان (`env.ASSETS`):**
   - ئاڕاستەکراو بۆ پێڕستی `./dist/client`.
6. **ڕێکخستنە سەرەکییەکانی ژینگە (Environment Variables):**
   - `ALLOWED_ORIGINS`: `https://zana.idggov.tech,https://new-vs-zana.zana-platform.workers.dev`
   - `ZANA_REVISION`: `133b45c`
   - `GEMINI_PRIMARY_MODEL`: `gemini-3.6-flash`
   - `GEMINI_VISION_MODEL`: `gemini-3.6-flash`
   - `CF_ACCOUNT_ID`: `9bbac6865a80cafb336c82029cc7bb49`
7. **نهێنییە پارێزراوەکانی ژینگە (Production Secrets):**
   - هەموو ١١ نهێنیی پێویست (`ADMIN_TELEMETRY_SECRET`, `CF_AIG_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `GEMINI_API_KEY`, `JWT_SECRET`, `PROVIDER_PREFLIGHT_TOKEN`, `VITE_API_BASE_URL`, `VITE_FIREBASE_API_KEY`, `ZANA_CURRICULUM_DOCUMENT_IDS`, `ZANA_CURRICULUM_DOCUMENT_URI`) بە پارێزراوی لە Cloudflare Secrets بوونیان هەیە و ناوەڕۆکەکانیان بە پارێزراوی ماوەتەوە.

---

## ٤. بڵاوکردنەوەی ڕاستەوخۆ (Production Deployment Execution)

بڵاوکردنەوەکە بە فەرمانی فەرمی جێبەجێکرا:

```bash
npx wrangler deploy --config wrangler.production.json
```

### دەرئەنجامە چەسپاوەکان:
- **بارکردنی سەرمایەکان:** ٤٥ پەڕگەی نوێ یان نوێکراوە لە ماوەی ٣.٩٠ چرکەدا بارکران (کۆی گشتی: ٥٠ پەڕگە).
- **قەبارەی بڵاوکراوە:** 2991.22 KiB (کۆکراوەی gzip: 510.38 KiB).
- **کاتی دەستپێکردنی Worker:** ١٤ میلی‌چرکە (14ms).
- **ناونیشانی سێرڤەر:** `https://new-vs-zana.zana-platform.workers.dev`.
- **ناسنامەی نوێی بڵاوکراوە (Current Version ID):** `c3de0841-cdf1-4bf1-b79e-ee760243b312`.
- **کاتی تۆمارکردن لە Cloudflare:** `2026-11-14T10:38:51.161Z`.
- **ڕێژەی وەشاندن:** 100% ی هاتوچۆ ڕاستەوخۆ ئاڕاستەی ئەم وەشانە نوێیە دەکرێت.

---

## ٥. پشکنینی ڕاستەوخۆ پاش بڵاوکردنەوە (Post-Deployment Verification)

1. **پشکنینی دۆخی وەشان لە Cloudflare:**  
   فەرمانی `npx wrangler deployments list` پشتڕاستی کردەوە کە وەشانی `c3de0841-cdf1-4bf1-b79e-ee760243b312` وەشانی پێشووی (`0a5f7b9f...`) جێگرتووەتەوە و بە تەواوی (100%) چالاکە.

2. **پشکنینی پاراستنی سەرمایەکان و هێدەری CORS:**  
   لە کاتی ناردنی داواکاری بۆ ڕێڕەوەکانی کڕیار و پەڕگە سەرمایەییەکان بە ئۆریجینی فەرمی `https://zana.idggov.tech`، هێدەری دەقاودەق دەگەڕێتەوە:
   ```http
   access-control-allow-origin: https://zana.idggov.tech
   access-control-allow-credentials: true
   ```

3. **سەلماندنی بوونی پەڕگە مۆدێرنەکانی ڕووکار لەسەر Edge:**  
   پەڕگە سەرمایەییە سەرەکییەکانی وەشانی نوێ لەسەر ژێرخانی زیندووی دابەشکراو بەستراونەتەوە:
   - `Home-Ba_RMl1B.js` (شاشەی سەرەکی و سپارکی ڕۆژانە)
   - `Chat-DfuDvPfB.js` (مێزی چات و ڕاوێژکاری زیرەکی زانا)
   - `PracticeLab-DGPEvS08.js` (تاقیگەی ڕاهێنان بە فلتەری ٣-قۆناغی)
   - `AdaptiveAssessment-BaOBFxu4.js` (هەڵسەنگاندنی خۆگونجێنەر)
   - `VirtualScienceLab-DP-BO3U1.js` (تاقیگەی مەجازیی زانست)
   - `ProfileAndSettings-DyOfzC5n.js` (پڕۆفایل، ڕێکخستن و تاقیکەرەوەی دەنگ)
   - `StudyPathManager-DM8f02id.js` (بەڕێوەبەری پلانی خوێندن)
   - `StudyRooms-Dv4YoVyb.js` (ژوورەکانی خوێندن و فۆکەس)
   - `ParentReport-CZUsm85u.js` (ڕاپۆرتی زیرەکی بۆ سەرپەرشتیار)
   - `BrainAdminDashboard-MI2l0az3.js` (داشبۆردی بەڕێوەبەرایەتی بەردەوام)

4. **چارەسەربوونی بنەڕەتیی کێشەی UI ـی کۆن:**  
   پێش ئەم بڵاوکردنەوەیە، پەڕگەکانی نێو `src/pages/` لە نێو پاکێجەکەدا نەبوون و وایکردبوو سیستەم لەسەر شاشە سەرەتایی و کۆنەکانی پێشوو بوەستێت. بە تەواوکردنی هاوردەکردن لە کۆگای Antigravity، یەکخستنی سیستەمی دیزاینی Indigo-600، ڕێکخستنی مێژووی وێبگەڕ (History popstate/pushState) بۆ ڕێڕەوەکان، و بڵاوکردنەوەی وەشانی نوێی سەرمایەکان، پلاتفۆرمەکە بە تەواوی نوێ بووەوە و هەموو شاشە کۆنەکان بە تەواوی سڕانەوە.

---

## ٦. بڕیاری کۆتایی (Final Verdict)

```text
================================================================================
                    FINAL DECISION: DEPLOYMENT SUCCESSFUL
================================================================================
- Target: Cloudflare Production Worker & Static Assets
- Git Commit: 133b45c (incorporating modern UI: 1c63142e, QA fix: 321a708)
- Canonical Domain: https://zana.idggov.tech
- Cloudflare Version ID: c3de0841-cdf1-4bf1-b79e-ee760243b312
- Active Assets: 50 client files (2991.22 KiB) on Cloudflare Edge
- Pre-deploy Quality Gates: TypeScript, ESLint, 203 Tests (12 Suites) 100% Passed
- D1 Database: new-vs-zana (All migrations applied)
- Durable Objects: AdminCommandDO wired and verified
- UI Status: Modern UI restored, stale UI permanently eradicated
================================================================================
```

بڵاوکردنەوەی پڕۆژەی ZANA بە سەرکەوتوویی تەواو بوو.
