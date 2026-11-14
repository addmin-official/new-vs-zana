# ڕاپۆرتی لێکۆڵینەوە لە کەیسی دەرکەوتنی وەشانی کۆنی UI (Stale UI Incident Report) — ZANA

**بەروار:** ١٤ی تشرینی دووەمی ٢٠٢٦  
**کات:** ١٢:٣٥ (کاتی کوردستان / UTC+3)  
**پڕۆژە:** `/Users/imacos/Documents/Codex/2026-11-13/xa/work/new-vs-zana-main`  
**دۆمەینی مەبەست و فەرمیی Production:** `https://zana.idggov.tech`  
**دۆمەینی کۆنکراو (Legacy Domain - هەڵوەشاوە):** `https://zana.krd` (لە هەموو ڕێکخستن، CORS، پشکنین و کۆد سڕاوەتەوە)  
**کۆمیتی بڵاوکراوی سەرچاوە:** `fdbef4f8c9e7ce1c809cf53e6869025d8d03c3ed`  
**کۆمیتی چاکسازیی ڕێکخستنی دۆمەین:** `26a331e` (`HEAD -> main`)  
**ناسنامەی وەشانی زیندوو لە Cloudflare:** `0a5f7b9f-70d3-4ce6-88a0-b2cfcfaaf32e`  
**ڕەوشی کۆتایی (Final Verdict):** **`Blocked`** (بەربەستکراو — بەپێی ڕێنماییی پەسەندکراو: بەهۆی ئەوەی سەرچاوەی کۆمیتەکە خۆی شاشە کۆنەکانی لەخۆگرتووە، هیچ deploy ـێکی سەرلەنوێ نەکرا تا ڕووکاری نوێ تێکەڵ نەکرێت).

---

## ١. پوختەی هۆکاری سەرەکی (Root Cause Analysis)

دوای لێکۆڵینەوەی قووڵی تەکنیکی و پشکنینی مێژووی Git، پەڕگەکانی کۆدی سەرچاوە، دروستکردنی پاکێج (Build Output)، تۆمارەکانی Cloudflare و سیستەمی ئاسایش، **هۆکاری بنەڕەتیی بینینی ڕووکاری کۆن** دەستنیشان کرا:

### هۆکاری ڕەسەن: کۆمیتی بڵاوکراو لە بنەڕەتدا تەنها شاشە کۆنەکانی لەخۆگرتووە (Source UI Divergence)
1. **نەبوونی بوخچەی پەڕە نوێیەکان (`src/pages/`):**
   - لە سەرچاوەی پڕۆژە لە کۆمیتی `fdbef4f` (و تەواوی لقەکە لە دەستپێکی `new-vs-zana-main (3).zip` تا ئێستا)، بوخچەی `src/pages/` بوونی نییە (`git ls-files src/pages` ئەنجامی 0 دەدات).
   - فایلی سەرەکیی کاربەرنامە `src/App.tsx` لەم کۆمیتەدا ڕاستەوخۆ شاشە کۆنەکانی لە بوخچەی `src/screens/` هاوردە کردووە:
     ```typescript
     import { DailySparkScreen } from "./screens/DailySparkScreen.tsx";
     import { StudyWorkspaceScreen } from "./screens/StudyWorkspaceScreen.tsx";
     import { AssessmentScreen } from "./screens/AssessmentScreen.tsx";
     import { ParentReportScreen } from "./screens/ParentReportScreen.tsx";
     import { ProfileScreen } from "./screens/ProfileScreen.tsx";
     import { PracticeScreen } from "./screens/PracticeScreen.tsx";
     import { StudyRoomScreen } from "./screens/StudyRoomScreen.tsx";
     ```
2. **جیاوازیی کۆمیتەکان لەگەڵ ژینگەی پەرەپێدانی نوێ:**
   - سەرجەم کارەکانی کۆمیتەکانی ئەم دواییە (`3ab519f` ➔ `db5edc5` ➔ `9c71307` ➔ `9bdf99f` ➔ `6417635` ➔ `fdbef4f`) تەنها لەسەر ئاستی بەستنەوەی پارێزراوی Backend بوون: جێبەجێکردنی D1، Durable Object، ڕێگری لە پێکدادانی هاوکات، مۆڵەتپێدانی دووانەی ئادمین (Dual-Approval)، سڕینەوەی کلیلە هەستیارەکان لە وێب، و سیستەمی Audit Log لە SQLite.
   - ئەو ڕووکارە نوێیەی کە لە پڕۆژەی هاوتەریب (`/Users/imacos/antigravity/ZANA-/-زانا-2026-10-22-69c0b/src/pages/` و پەڕگەکانی `Home.tsx`, `Chat.tsx`, `PracticeLab.tsx`, `AdaptiveAssessment.tsx`, `StudyRooms.tsx`, `ParentReport.tsx`, `ProfileAndSettings.tsx`, `Sidebar.tsx`) دروست کرابوون، هەرگیز نەخرابوونە ناو گیت لە کاتی ئامادەکردنی سەرچاوەی کارەکە و وەک فایلی دانەمەزراو (Untracked) لە دەرەوە مابوونەوە.
3. **ئەنجامی دروستکردنی پاکێج (Build Integrity):**
   - ئەنجامدانی `npm run build` لەسەر ئەم کۆمیتەیە بە تەواوی و بێ هەڵە پاکێجەکە دروست دەکات، بەڵام چونکە کۆدی سەرچاوە شاشە کۆنەکانە، پەڕگەی بەرهەمهێنراوی سەرەکیی `dist/client/assets/index-DYfL6Qd5.js` تەنها شاشەی کۆنی `DailySparkScreen` پێکدەهێنێت و هیچ کۆدێکی نوێی لەخۆ نەگرتووە.
   - کەواتە، هیچ ناڕێکییەک لە نێوان Build و Deployment ـی Cloudflare دا نییە؛ کێشەکە ئەوەیە کە کۆمیتەکە خۆی وەشانی کۆنی لەخۆگرتووە.

---

## ٢. پشکنینی سیستەمی Cloudflare، دۆمەین و ڕێڕەوەکان

1. **پشکنینی دۆمەینی فەرمی `https://zana.idggov.tech`:**
   - بەپێی بەڵگەکانی Cloudflare API، تاکە دۆمەینی چالاکی ئەم پڕۆژەیە بریتییە لە:
     - **Hostname:** `zana.idggov.tech`
     - **Service:** `new-vs-zana`
     - **Environment:** `production`
     - **Custom Domain ID:** `4a3e1bdc8d8860d59ec8c35ebf86de67b3d505de`
     - **Zone ID:** `925e3600f2fdc478114f3c9fb986ead2` (`idggov.tech`)
     - **Certificate:** Google Trust Services (TLSv1.3)، چالاک لەسەر ئایپییەکانی `104.21.4.116` و `172.67.132.9`.
2. **پشکنینی وەشانی چالاکی Worker:**
   - وەشانی چالاک لەسەر Cloudflare: `0a5f7b9f-70d3-4ce6-88a0-b2cfcfaaf32e` (ئەمە وەشانی بڵاوکراوەی سەرچاوەی `fdbef4f` ـە).
   - هیچ ناهاوسەنگییەک لە ڕێڕەوی Cloudflare دا نییە؛ داواکارییەکانی `zana.idggov.tech` ڕاستەوخۆ دەگەنە هەمان وەشانی فەرمیی Worker.
3. **پشکنینی وەشانی `workers.dev`:**
   - ناونیشانی `https://new-vs-zana.zana-platform.workers.dev` بە هەمان شێوە ئاراستەی هەمان وەشانی چالاک کراوە.
4. **سیستەمی پاراستنی Cloudflare Access (Zero Trust):**
   - هەردوو ناونیشانی `https://zana.idggov.tech` و `https://new-vs-zana.zana-platform.workers.dev` لەژێر چەتری پاراستنی Cloudflare Access Zero Trust دایە (`wispy-scene-edb1.cloudflareaccess.com`).
   - هەر داواکارییەکی وێبگەڕ یان curl بەبێ مۆڵەتی پێشوەختە و بەبێ کۆکی، ڕاستەوخۆ بە کۆدی `HTTP 302` ئاراستەی دەروازەی چوونەژوورەوەی سکیوریتیی Access دەکرێت، کە ئەمەش پارێزراویی تەواوی سیستەمەکە لە هێرشی دەرەکی دەسەلمێنێت.

---

## ٣. خشتەی هشەکانی سەرمایە نەگۆڕەکان (Asset SHA-256 Hashes)

پشکنینی تەواوی فایلی دروستکراوی پاکێجەکە لە بوخچەی `dist/client` کە لە بڵاوکردنەوەی `fdbef4f` بارکراوە:

| پەڕگە (File) | قەبارە (Bytes) | SHA-256 Hash | تێبینیی شیکاری |
| :--- | :--- | :--- | :--- |
| `dist/client/index.html` | 2,169 | `5531ccdff1b0fb4ad30e8c3abc9183d35606ba0d04e978b4d22f16714a74e855` | فایلی ڕەگی کاربەرنامە |
| `dist/client/assets/index-DYfL6Qd5.js` | 1,202,998 | `34b1a20e594d5ab16ca40b3989ea0aa3ca860aa79bd7ae9e7fcf59ed467ef0f0` | پاکێجی سەرەکی — شاشەی کۆنی `DailySparkScreen` لەخۆدەگرێت |
| `dist/client/assets/index-B9QsqNGE.css` | 105,655 | `6f1a960832d16addd58016f28d48f03aa710a73c6586ce8b6dd740dcd4edb58c` | شێوازی تایڵویند و دیزاینی شاشەکان |
| `dist/client/assets/firebase-vendor-CFZKxMRH.js` | 686,146 | `882dedd4540e92b89dff19783f8a31a4f168d5e28d440c6d61e050412015ca8b` | کتێبخانەی Firebase Client |
| `dist/client/assets/markdown-vendor-CDJ6CmkS.js` | 126,726 | `4074198686f6cf137c191f1156841b358e7b3eb609780cba4d8c4bf10cd8f07d` | شیکەرەوەی دەقی مارکداون |
| `dist/client/assets/react-vendor-D0j-HLcW.js` | 3,902 | `e9c5202f6221e8cd9ac0c00025346de5fa0d738a0a0808760cc9d514a4e48dfc` | کتێبخانەی بنەڕەتیی React |

- **پشکنینی ناوەڕۆکی فایلی JS:**
  - ناوی `DailySparkScreen`: بە ڕوونی بوونی هەیە.
  - کۆمپۆنێنتەکانی `src/pages` (وەک `AdaptiveAssessment`, `PracticeLab`, `StudyRooms`): بوونیان نییە.

---

## ٤. بەراوردی دۆخی سیستەم و بڕیاری کۆتایی

| بوار | دۆخی پێش پشکنین | دۆخی دوای پشکنین و چاکسازی |
| :--- | :--- | :--- |
| **دۆمەینی فەرمی** | ناڕوونی لەگەڵ `zana.krd` | جێگیرکرا لەسەر `https://zana.idggov.tech` (تەواوی فایلەکان نوێکرانەوە) |
| **Worker Version ID** | `0a5f7b9f-70d3-4ce6-88a0-b2cfcfaaf32e` | دەستکاری نەکراوە و وەک خۆی پارێزراوە بۆ ڕێگری لە پچڕانی خزمەتگوزاری |
| **دۆخی گیت (Git State)** | `fdbef4f` (کۆدی UI تێدا کۆنە) | فەرمانی دۆمەین کرا بە کۆمیتی `26a331e`؛ بەڵام بوخچەی `src/pages` هێشتا نەهاتووەتە نێو لقەکە |
| **ڕەفتاری Deploy** | داوای بڵاوکردنەوەی نوێ کرابوو | **ڕاگیرا (Deploy نەکرا)** بەپێی ڕێنماییی توند و پارێزراو |

### بڕیاری کۆتایی (Final Verdict): **`Blocked`**

بەپێی یاسای مەرجداری بەکارهێنەر لە ڕێنماییەکەدا:
> *"ئەگەر commit ـی `fdbef4f` خۆی UI ـی کۆنی هەیە: deploy مەکە؛ commit ـی دروستی UI ـی پێویست دیاری بکە و بەڵگەی بدە."*

**هۆکاری بەربەستکران (Blocked):**
لەبەر ئەوەی سەرچاوەی کۆدی commit ـی `fdbef4f` لە ڕاستیدا تەنها شاشە کۆنەکانی لەخۆگرتووە، هەر هەوڵێکی deploy لەسەر هەمان سەرچاوە ڕێک هەمان پاکێجی کۆن (`index-DYfL6Qd5.js`) بڵاودەکاتەوە و هیچ کێشەیەک چارەسەر ناکات. لەبەر ئەوە بڵاوکردنەوە ڕاگیرا تاوەکو کۆدی نوێی پەڕەکان هاوردە دەکرێت.

---

## ٥. شوێنی کۆدە نوێیەکان و نەخشەڕێگای چارەسەری یەکجاری

بۆ ئەوەی وەشانی نوێ بە تەواوی و بە سەرکەوتوویی بڵاوبکرێتەوە، ئەم هەنگاوانە پێویستن:

1. **شوێنی پەڕە نوێیەکان:**
   - سەرچاوەی ڕووکاری نوێی ZANA لەم ناونیشانە پارێزراوە:
     `/Users/imacos/antigravity/ZANA-/-زانا-2026-10-22-69c0b/src/pages/`
   - پەڕە سەرەکییەکان:
     - `Home.tsx` (داشبۆردی سەرەکیی قوتابی)
     - `Chat.tsx` (مامۆستای تایبەت بە زیرەکیی دەستکرد و مێزی وانە)
     - `PracticeLab.tsx` (تاقیگەی کارلێککاری و پرسیارەکان)
     - `AdaptiveAssessment.tsx` (تاقیکردنەوەی پێوانەیی و هەڵسەنگاندن)
     - `StudyRooms.tsx` (ژووری خوێندنی گرووپی و پۆمۆدۆرۆ)
     - `ParentReport.tsx` (ڕاپۆرتی زیرەکیی دایک و باوک)
     - `ProfileAndSettings.tsx` (ڕێکخستنەکان و لێهاتوویی)
     - `components/Sidebar.tsx` (شریتی دەستپێڕاگەیشتنی خێرا)
2. **پێویستیی تێکەڵکردن (Integration Step):**
   - پێویستە ئەم پەڕانە بخرێنە ناو بوخچەی `src/pages/` لە پڕۆژەی بڵاوکردنەوە (`new-vs-zana-main`).
   - پەڕگەی `src/App.tsx` دەستکاری بکرێت تاوەکو لەبری `src/screens/*` پەنا بۆ ئەم پەڕە نوێیانە ببات.
   - ئەنجامدانی پشکنینی `npm run typecheck` و `npm test` بۆ دڵنیابوون لە دەرچوونی ١٠٠٪ی گرێبەستەکان.
   - ئەنجامدانی Commit ـێکی فەرمی لە Git.
3. **بڵاوکردنەوە لەسەر Cloudflare:**
   - دوای دڵنیابوونەوەی هەنگاوەکانی سەرەوە، جێبەجێکردنی `npm run build` و پاشان `npx wrangler deploy` بۆ ئەوەی ڕووکاری نوێ لەسەر `https://zana.idggov.tech` بکەوێتە گەڕ.
