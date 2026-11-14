# ڕاپۆرتی ڕاستکردنەوەی دۆمەینی فەرمی (Canonical Domain Correction Report) — ZANA

**بەروار:** ١٤ی تشرینی دووەمی ٢٠٢٦  
**کات:** ١٢:٢٥ (کاتی کوردستان / UTC+3)  
**پڕۆژە:** `/Users/imacos/Documents/Codex/2026-11-13/xa/work/new-vs-zana-main`  
**دۆمەینی فەرمیی نوێکراوە (Canonical Domain):** `https://zana.idggov.tech`  
**دۆمەینی پێشوو (Legacy Domain):** `https://zana.krd`  
**بڕیاری کۆتایی (Verdict):** **`Canonical domain corrected`** (دۆمەینی فەرمی بە سەرکەوتوویی ڕاستکرایەوە و پشکنرا)

---

## ١. پوختەی جێبەجێکردن (Executive Summary)

بەپێی بڕیاری نوێ، ناونیشانی فەرمیی پلاتفۆرمی ZANA بە تەواوەتی لەسەر هەموو ئاستەکانی ڕێکخستنی سێرڤەر، ڕێڕەوەکانی Worker، یاساکانی ڕێگەپێدانی سەرچاوە (CORS Allowlist)، دۆکیۆمێنتە فەرمییەکان، کەناڵی CI/CD، پشکنینەکانی ئاسایش و گرێبەستی تەلارسازی گوازرایەوە بۆ:

```text
https://zana.idggov.tech
```

دۆمەینی `https://zana.krd` چیتر دۆمەینی چالاکی پلاتفۆرم نییە؛ بە فەرمی وەک **Legacy Domain** لە دۆکیۆمێنتەکاندا پۆلێن کرا، و بە شێوەیەکی بنەڕەتی لە لیستی ڕێگەپێدراوی CORS سڕایەوە، تا هیچ داواکارییەکی دەرەکی بەو ناونیشانە ڕێگەی پێنەدرێت.

سەرجەم پشکنینە تەکنیکییەکان (`verify-finalization-contract`, `typecheck`, `lint`, `npm test`, `build`, `wrangler deploy --dry-run`) بە ڕێژەی 100% بە سەرکەوتوویی تێپەڕین بەبێ ئەنجامدانی Deploy ـێکی نوێی بەرهەمهێنان.

---

## ٢. لیستی پەڕگە دەستکاریکراوەکان (Changed Files)

| پەڕگە | شوێنی گۆڕانکاری | پوختەی گۆڕانکاری |
| :--- | :--- | :--- |
| **`wrangler.jsonc`** | دێڕی ٥٨ (`vars.ALLOWED_ORIGINS`) | دانانی `https://zana.idggov.tech` وەک سەرچاوەی ڕێگەپێدراوی سەرەکی، و لادانی `zana.krd`. |
| **`src/worker/index.ts`** | دێڕی ٢٢٥-٢٣١ (`isOriginAllowed`) | لادانی `https://zana.krd` لە کۆدی ڕەق و زیادکردنی `https://zana.idggov.tech`. ئێستا `zana.krd` ڕەت دەکرێتەوە. |
| **`scripts/verify-finalization-contract.js`** | دێڕی ٤١ (`requireMatch`) | گۆڕینی گرێبەستی فەرمی بۆ ناچارکردنی بوونی `https://zana.idggov.tech` لە کۆنفێگی Wrangler. |
| **`scripts/smoke-test.js`** | دێڕی ٤ (`FRONTEND_ORIGIN`) | نوێکردنەوەی ئۆریجینی تاقیکردنەوەی دووکەڵ بۆ `https://zana.idggov.tech`. |
| **`health-headers.txt`** | دێڕی ٥ (`access-control-allow-origin`) | گۆڕینی وەڵامی نموونەیی تەندروستی بۆ `https://zana.idggov.tech`. |
| **`docs/production-finalization.md`** | دێڕی ١٧ | دیاریکردنی `https://zana.idggov.tech` وەک فەرمی، و `https://zana.krd` وەک legacy domain. |
| **`docs/ai-change-governance.md`** | دێڕی ١٦ | نوێکردنەوەی ڕێسای پاراستنی پلاتفۆرم بۆ ئاماژەدان بە `https://zana.idggov.tech`. |
| **`.github/pull_request_template.md`** | دێڕی ١٢ | نوێکردنەوەی مەرجی پشکنینی PR بۆ دڵنیابوون لە پاراستنی `https://zana.idggov.tech`. |
| **`.github/workflows/ci.yml`** | دێڕەکانی ٤٣٦، ٤٤١، ٥٧٨، ٥٨٣، ٧٣٠ | گۆڕینی سەرچاوەی تاقیکردنەوەکانی قۆناغی ٤، ٥ و ٨ لە CI بۆ `https://zana.idggov.tech`. |
| **`src/curriculum/grounding.test.ts`** | دێڕەکانی ٢٠٨، ٢٣٠، ٣١٩، ٣٣٩ | نوێکردنەوەی تاقیکردنەوەکانی گرێدانی مەنهەج بۆ بەکارهێنانی `https://zana.idggov.tech`. |
| **`src/worker/worker.test.ts`** | ٢٠+ شوێن لە تاقیکردنەوەکان | نوێکردنەوەی هەموو تاقیکردنەوەکانی CORS و زیادکردنی پشکنینی نەرێنی بۆ ڕەتکردنەوەی دەستبەجێی `https://zana.krd` و `https://malicious-attacker.com`. |
| **`src/server/auth/firebase.ts`** | دێڕی ١٩ | نوێکردنەوەی دۆمەینی ئیمەیڵی نموونەیی بۆ `dev@zana.idggov.tech`. |
| **`src/test/durableAndPersistence.test.ts`** | دێڕەکانی ٢٢٢، ٢٣٨، ٢٥٢ | نوێکردنەوەی ئیمەیڵەکانی تاقیکردنەوە بۆ `@zana.idggov.tech`. |
| **`src/test/internalBrainService.test.ts`** | دێڕەکانی ٥٨، ٧١ | نوێکردنەوەی ئیمەیڵەکانی مۆڵەتی دووانە بۆ `@zana.idggov.tech`. |

---

## ٣. دۆخی `zana.idggov.tech` لە ژینگەی Cloudflare

لە ڕێگەی ئامرازەکانی پشکنینی فەرمیی تۆڕ و API ـی Cloudflare دڵنیایی لەم خاڵانە وەرگیرا:

1. **بەستنەوەی Worker (Worker Custom Domain Binding):**
   - ناوی ڕاژە: `new-vs-zana`
   - ژینگە: `production`
   - دۆمەینی ڕێکخراو: `zana.idggov.tech`
   - ناسنامەی بەستنەوە: `4a3e1bdc8d8860d59ec8c35ebf86de67b3d505de`
   - ناسنامەی ناوچە (Zone ID): `925e3600f2fdc478114f3c9fb986ead2` (`idggov.tech`)
   - دۆخ: **Active و Enabled**.

2. **دۆخی DNS:**
   - فەرمان: `dig zana.idggov.tech +short`
   - ئەنجام: `104.21.4.116` و `172.67.132.9`
   - ڕاژەکاری ناونیشانەکان راستەوخۆ دەچنەوە سەر ڕاژەکارە جیهانییەکانی Cloudflare Edge.

3. **دۆخی سێرتیفیکەیت (SSL/TLS):**
   - بەکارهێنانی TLSv1.3 لەگەڵ چەسپاندنی HTTPS.
   - بڕوانامەی پارێزراوی فەرمی (Google Trust Services - WE1) بۆ `CN=idggov.tech`.
   - هیچ هەڵەیەکی بڕوانامە یان بەسەرچوونی ئاسایش بوونی نییە.

4. **سیستەمی پاراستنی چوونەژوورەوە (Cloudflare Access Zero Trust):**
   - دۆمەینی `zana.idggov.tech` و هاوشانەکەی `new-vs-zana.zana-platform.workers.dev` هەردووکیان لە ژێر پارێزگاریی دەروازەی Zero Trust دان (`wispy-scene-edb1.cloudflareaccess.com`)، و بەکارهێنەران لە ڕێگەی هەژماری Google ڕێگەپێدانیان پێدەدرێت.

---

## ٤. دۆخی `zana.krd` وەک Legacy Domain

- **ڕەوشی دۆمەین لە دەرەوەی Cloudflare:**  
  دۆمەینی `zana.krd` لە ئێستادا ئاراستەی سێرڤەری ڕاگیرانی 101domain کراوە (`52.60.87.163` لەسەر `ns1.101domain.com`).
- **دۆخی CORS لە Worker:**  
  لە وەشانی نوێکراوەی کۆدی Worker دا، هەر داواکارییەک بە `Origin: https://zana.krd` بنێردرێت:
  - لەسەر ڕێڕەوی گشتی (`/api/health`): بەبێ هێدەری `Access-Control-Allow-Origin` دەگەڕێتەوە (ڕەتکراوە).
  - لەسەر ڕێڕەوە پارێزراوەکانی API (`/api/chat`, `/api/assessment` ...): دەستبەجێ بە کۆدی **`403 Forbidden`** و هەڵەی `"Disallowed Origin"` ڕەت دەکرێتەوە.
- **تێبینیی دۆکیۆمێنت:**  
  لە هەردوو پەڕگەی `production-finalization.md` و `ai-change-governance.md` ڕوونکراوەتەوە کە `zana.krd` ناونیشانی پێشووە و هیچ خزمەتگوزارییەکی بەرهەمهێنان لەسەری کار ناکات.

---

## ٥. ئەنجامی پشکنینە تەکنیکییەکان (Verification Results)

سەرجەم ٦ پشکنینە فەرمییەکە بە سەرکەوتوویی جێبەجێکران:

1. **گرێبەستی فەرمیی پڕۆژە (verify-finalization-contract):**
   ```text
   ZANA finalization contract passed.
   Protected: Cloudflare architecture, Firebase separation, Gemini model/provider, CORS, AI route status contracts, security gates, and release gates.
   Exit code: 0
   ```
2. **پشکنینی جۆری زمان (npm run typecheck):**
   ```text
   > tsc --noEmit
   Exit code: 0 (0 errors)
   ```
3. **پشکنینی ڕێساکانی کۆد (npm run lint):**
   ```text
   > eslint . --max-warnings=0
   Exit code: 0 (0 warnings, 0 errors)
   ```
4. **تاقیکردنەوە تەواوەکان (npm test):**
   ```text
   ℹ tests 203
   ℹ suites 12
   ℹ pass 203
   ℹ fail 0
   Exit code: 0
   ```
   - پەسەندکردنی دەقاودەقی `Origin: https://zana.idggov.tech` بە هێدەری دروست.
   - ڕەتکردنەوەی مسۆگەری `Origin: https://zana.krd` و `Origin: https://malicious-attacker.com` بە 403 / بێ CORS.
5. **دروستکردنی پاکێجی نوێ (npm run build):**
   ```text
   ✓ 2424 modules transformed.
   dist/client/index.html                           2.17 kB
   dist/client/assets/index-B9QsqNGE.css          105.66 kB
   dist/client/assets/index-DYfL6Qd5.js         1,203.00 kB
   Exit code: 0
   ```
6. **پشکنینی بڵاوکردنەوەی تاقیکاری (npx wrangler deploy --dry-run):**
   ```text
   ✨ Read 7 files from the assets directory ./dist/client
   Total Upload: 2982.47 KiB
   env.ALLOWED_ORIGINS: "https://zana.idggov.tech,https://new-vs-zana.zana-platform.workers.dev"
   --dry-run: exiting now.
   Exit code: 0
   ```

---

## ٦. بڕیاری کۆتایی (Final Verdict)

```text
================================================================================
               DECISION: CANONICAL DOMAIN CORRECTED
================================================================================
- Canonical Origin: https://zana.idggov.tech (active & verified)
- Legacy Domain: https://zana.krd (documented & rejected from CORS)
- Cloudflare Binding: Custom Domain active on service new-vs-zana
- Quality & Security Gates: All 6 checks passed (203/203 tests passing)
- Deployment Status: Dry-run passed; production deploy not executed (pending auth)
================================================================================
```
