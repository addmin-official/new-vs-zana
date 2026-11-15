# ZANA Design System & RTL Guidelines (سیستەمی دیزاین)

## 1. Core Principles
1. **Kurdish Sorani First (`ckb`):** All user interface copy is exclusively in natural Kurdish Sorani.
2. **Strict RTL Layout:** The document element enforces `dir="rtl"`, aligning all reading axes from right to left.
3. **60-30-10 Color Budget:** High-clarity contrast optimized for prolonged studying sessions.
4. **WCAG 2.1 Level AA:** Minimum 4.5:1 text contrast ratio, visible keyboard focus indicators, and screen-reader readiness.

---

## 2. Color Palette & Distribution

### 60% Dominant Backgrounds
- **Base Canvas:** `#F8FAFC` (Slate-50)
- **Elevated Canvas:** `#FFFFFF` (Pure White)
- **Dark Mode Background:** `#090D16` (Slate-950)

### 30% Structural Elements
- **Cards & Surfaces:** `#FFFFFF` with `#E2E8F0` (Slate-200) borders
- **Body Text:** `#1E293B` (Slate-800)
- **Headings & High-Emphasis Text:** `#0F172A` (Slate-900)
- **Secondary & Muted Labels:** `#64748B` (Slate-500)
- **Interactive Hover Surfaces:** `#F1F5F9` (Slate-100)

### 10% Accent Tokens (Call-to-Action)
- **Primary Action (CTA):** `#4F46E5` (Indigo-600) / Hover: `#4338CA` (Indigo-700)
- **Success / Passed:** `#059669` (Emerald-600)
- **Streak & Energy:** `#D97706` (Amber-600)
- **Warning & Hints:** `#F59E0B` (Amber-500)
- **Error & Danger:** `#DC2626` (Red-600)

---

## 3. Typography Scale (Noto Kufi Arabic)

| Token | Size | Weight | Line Height | Application |
| :--- | :--- | :--- | :--- | :--- |
| **Display / H1** | 32px | Bold (700) | 1.2 | Screen headers & hero greetings |
| **H2** | 24px | Bold (700) | 1.3 | Section headers & card titles |
| **H3** | 20px | Semibold (600) | 1.4 | Module headings & dialog titles |
| **H4** | 18px | Semibold (600) | 1.4 | Subheaders & tab titles |
| **Body Regular** | 16px | Regular (400) | 1.5 | Primary reading text & chat dialogs |
| **Body Small** | 14px | Regular (400) | 1.5 | Metadata, problem steps, notes |
| **Label / Button**| 14px | Medium (500) | 1.4 | Buttons, input labels, badge tags |
| **Caption** | 12px | Regular (400) | 1.4 | Timestamps, micro-text, helper notes |

> **Number Scale:** `font-variant-numeric: tabular-nums lining-nums` ensures columns of figures align cleanly in equations, tables, and timers.

---

## 4. Spacing, Borders & Shadows

- **Padding / Gaps:** `p-4` (16px), `p-6` (24px), `p-8` (32px).
- **Border Radius:**
  - Cards & Containers: `rounded-2xl` (16px)
  - Buttons & Interactive Controls: `rounded-xl` (12px)
  - Inputs & Form Controls: `rounded-lg` (8px)
  - Badges & Pills: `rounded-full`
- **Elevation / Shadows:**
  - Cards: `shadow-sm`
  - Active / Floating Elements: `shadow-md`
  - Modals & Drawers: `shadow-2xl`

---

## 5. Responsive Breakpoints

- **Mobile (`<640px`):** Single column, 16px horizontal margins, 60px fixed bottom navigation (`BottomNav`), hidden sidebar. Minimum touch target 48x48px.
- **Tablet (`md: 768px`):** Two-column card grids, flexible top header.
- **Desktop (`lg: 1024px+`):** 280px fixed sticky right sidebar (`Sidebar`), 3-column dashboard grids, full breadcrumbs.
