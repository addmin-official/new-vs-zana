# ZANA Platform - System Architecture & Engineering Specification

## 1. Overview & Mission
ZANA (زانا) is an advanced educational platform designed specifically for high school students (Grades 9–12) in the Kurdistan Region of Iraq. It integrates the official Ministry of Education curriculum with a Socratic AI Tutor, interactive virtual laboratories, vision-based question solving, adaptive testing, collaborative study rooms, and parental intelligence reporting.

The platform is built strictly for **Kurdish Sorani (`ckb`) with complete Right-to-Left (RTL)** layout support and WCAG 2.1 Level AA accessibility.

---

## 2. Technical Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 5.9+, Vite 6 |
| **Routing & Shell** | Tab-based SPA shell with browser history sync & dynamic URL mapping |
| **Styling & Design System** | Tailwind CSS v4, Noto Kufi Arabic, Tabular Numerals, 60-30-10 Color Budget |
| **Icons** | Lucide React |
| **State Management** | Zustand stores + React Context (Theme, Audio, Student Profile) |
| **Code Splitting** | `React.lazy()` + `Suspense` for all screens |
| **Edge Server / Backend** | Cloudflare Workers, Cloudflare D1 Database, Cloudflare KV, R2 Bucket |
| **AI Engine & Models** | Gemini 3.6 Flash (Primary), Gemini 3.5 Flash-Lite, Gemini 3.1 Flash-Lite (Fallbacks) |
| **Curriculum Grounding** | Vector RAG & Gemini File API with active chapter document chunks |

---

## 3. Component Hierarchy & Layout Shell

```
src/
├── main.tsx
├── App.tsx (Root Router, Auth listener, Lazy route loader)
├── components/
│   ├── AppShell.tsx (Sticky Header, 280px Desktop Sidebar, Mobile BottomNav)
│   ├── Header.tsx (60px, Logo, Page Title, Audio Toggle, Theme Toggle, Profile Avatar)
│   ├── Sidebar.tsx (280px, Desktop lg:only, 10 Nav items with active state)
│   ├── BottomNav.tsx (60px, Mobile md:hidden, 7 Quick-access tabs)
│   ├── ChatBubble.tsx (RTL Markdown chat bubble with academic grounding)
│   ├── Modal.tsx (Accessible dialog with focus trap & Esc support)
│   ├── SoundToggle.tsx (Audio feedback controller)
│   └── ThemeToggle.tsx (Light/Dark mode switcher)
├── pages/
│   ├── Home.tsx (Daily Spark, 7-day Streak, Concept of Day, Badges Showcase)
│   ├── Chat.tsx (3-mode workspace: Ask, Explain, Practice + OCR Vision Solver)
│   ├── PracticeLab.tsx (Topic drills, difficulty badges, step-by-step solver)
│   ├── VirtualScienceLab.tsx (Titration simulation, live SVG titration curve)
│   ├── AdaptiveAssessment.tsx (5-min countdown quiz, IRT level grading)
│   ├── StudyPathManager.tsx (Daily tasks, study hours bar chart, 20h goals)
│   ├── StudyRooms.tsx (Pomodoro timer, ambient sounds, live peer presence)
│   ├── ParentReport.tsx (Executive monthly report, subject bars, PDF export)
│   └── ProfileAndSettings.tsx (Profile, Preferences, Account, Privacy)
├── screens/
│   ├── SubjectsScreen.tsx (Grade 12 Book Viewer & chapter explorer)
│   ├── OnboardingScreen.tsx (Student stream, grade, and focus subject setup)
│   ├── LoginScreen.tsx & RegisterScreen.tsx
│   └── LoadingScreen.tsx
└── worker/
    └── index.ts (Cloudflare Worker API endpoints, Rate Limiting, AI Gateway)
```

---

## 4. State Architecture (Zustand & Context)

1. **Student Profile (`useStudentProfile`):**
   - Holds student ID, name, grade (9-12), academic stream (Scientific / Literary), active subject, and streak days.
   - Persisted across sessions via local storage and synced with backend storage.

2. **Workspace & Socratic Dialogue (`Chat.tsx`):**
   - Active mode: `ask` (پرسیار), `explain` (ڕوونکردنەوە), `practice` (ڕاهێنان).
   - Progressive hint layers (Levels 1, 2, 3) ensuring Socratic pedagogy before revealing solutions.
   - Vision modal state for OCR image uploading and mathematical equation extraction.

3. **Laboratory Simulation (`VirtualScienceLab.tsx`):**
   - Burette volume (0–50 mL), analyte pH calculation via titration equilibrium formula.
   - Real-time indicator color state mapping (Clear -> Pink -> Fuchsia).
   - Dynamic SVG coordinate rendering for equivalence curve trace.

---

## 5. Backend & AI Gateway Architecture

```
User Client (RTL React SPA)
       │
       ▼ (HTTPS / JSON Web Token)
Cloudflare Worker Edge Router (/api/*)
       │
       ├── Rate Limiting & Origin CORS Validation
       ├── Edge Caching (KV & D1 Database)
       │
       ▼
Curriculum Retriever & Context Grounding
       │ (Chapter text snippet + Grade 12 Kurdish Chemistry book)
       ▼
Google Gemini API / Cloudflare AI Gateway
       ├── Primary: gemini-3.6-flash
       └── Fallbacks: gemini-3.5-flash-lite, gemini-3.1-flash-lite
```

---

## 6. Performance & Security Safeguards

- **Strict Bundle Budget:** Initial index bundle < 80 kB gzipped via Route Lazy Loading (`React.lazy`).
- **Zero API Key Leakage:** All Gemini API keys and database credentials reside securely inside Cloudflare Worker secrets.
- **RTL Integrity:** Logical CSS spacing (`ms-*`, `me-*`, `ps-*`, `pe-*`), zero horizontal viewport overflow on 375px mobile screens.
- **Accessibility:** Meets WCAG 2.1 Level AA standards with high-contrast text, visible focus rings, and full keyboard navigation.
