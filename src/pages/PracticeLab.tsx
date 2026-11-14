import React, { useState, useMemo } from "react";
import {
  Search,
  Star,
  RotateCcw,
  ArrowLeft,
  Trophy,
  X,
  Flame,
  Calculator,
  ArrowLeftRight,
} from "lucide-react";
import { useSoundEffects } from "../hooks/useSoundEffects.ts";
import { useStudentProfile } from "../features/student/useStudentProfile.ts";
import { useAppStore } from "../store/appStore.ts";
import { PracticeStorage } from "../features/practice/practiceStorage.ts";
import {
  ConfidenceFeedbackEngine,
  ConfidenceFeedback,
} from "../features/feedback/ConfidenceFeedbackEngine.ts";
import { ConfidenceFeedbackCard } from "../components/ConfidenceFeedbackCard.tsx";
import { InteractiveExerciseRenderer } from "../features/practice/components/InteractiveExerciseRenderer.tsx";
import { SAMPLE_INTERACTIVE_EXERCISES } from "../data/curriculum/interactiveExercises.ts";
import { Sparkles, GraduationCap, Activity } from "lucide-react";
import { MetacognitivePostMortemModal } from "../features/pedagogy/metacognitive/MetacognitivePostMortemModal.tsx";
import { PedagogyHubModal, ActivePedagogyStudio } from "../features/pedagogy/PedagogyHubModal.tsx";

export interface ProblemItem {
  id: string;
  category:
    | "algebra"
    | "geometry"
    | "chemistry"
    | "biology"
    | "physics"
    | "english"
    | "math"
    | "kurdish"
    | "arabic"
    | "history"
    | "economy"
    | "geography"
    | "sports";
  grade: "9" | "10" | "11" | "12";
  format: "step_solver" | "interactive_diagram" | "virtual_lab" | "gamified_quiz";
  title: string;
  statement: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  steps: {
    instruction: string;
    expected: string;
    hint: string;
  }[];
  workedExample: string;
}

export const SUBJECT_PRACTICE_META: Record<string, { label: string; icon: string }> = {
  chemistry: { label: "کیمیا", icon: "⚗️" },
  physics: { label: "فیزیا", icon: "⚡" },
  math: { label: "بیرکاری", icon: "📐" },
  biology: { label: "زیندەزانی", icon: "🧬" },
  english: { label: "ئینگلیزی", icon: "📖" },
  kurdish: { label: "زمان و ئەدەبی کوردی", icon: "📚" },
  arabic: { label: "زمانی عەرەبی", icon: "📜" },
  sports: { label: "پەروەردەی وەرزشی", icon: "⚽" },
  history: { label: "مێژوو", icon: "🏛️" },
  economy: { label: "ئابووری", icon: "📊" },
  geography: { label: "جوگرافیا", icon: "🌍" },
};

const PROBLEMS_DATA: ProblemItem[] = [
  // ─── 1. کیمیا (Chemistry) ──────────────────────────────────────────────────
  {
    id: "chem-1",
    category: "chemistry",
    grade: "12",
    format: "step_solver",
    title: "هاوسەنگی ئایۆنی و پێوەری pH",
    statement: "گیراوەیەکی ترشی هایدرۆکلۆریک (HCl) خەستییەکەی 0.05 Mە لە پلەی 25°C. بەهای pH بۆ گیراوەکە هەژمار بکە.",
    difficulty: "intermediate",
    steps: [
      {
        instruction: "هەنگاوی ١: ترشی HCl ترشێکی بەهێزە، کەواتە خەستی [H₃O⁺] چەندە؟",
        expected: "0.05",
        hint: "ترشی بەهێز بە تەواوی ئایۆن دەبێت، کەواتە [H₃O⁺] = [HCl] = 0.05 M.",
      },
      {
        instruction: "هەنگاوی ٢: بەهای pH بەپێی یاسای pH = -log(0.05) چەندە؟ (تا دوو خانەی دەیی بنووسە)",
        expected: "1.30",
        hint: "-log(0.05) یەکسانە بە 1.30.",
      },
    ],
    workedExample: "بۆ نموونە ئەگەر خەستی HCl = 0.01 M بووایە، ئەوا [H₃O⁺] = 0.01 M و pH = -log(0.01) = 2.0 دەبوو.",
  },
  {
    id: "chem-2",
    category: "chemistry",
    grade: "12",
    format: "interactive_diagram",
    title: "پێکهاتەی گەردیلەی کاربۆن و بەندەکان",
    statement: "ئەتۆمی کاربۆن لە ئاوێتە ئەندامییەکاندا چەند بەندی هاوبەش دروست دەکات بۆ گەیشتن بە باری جێگیر؟",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: ژمارەی ئەلیکترۆنەکانی هاوهێزی کاربۆن (C) چەندە؟",
        expected: "4",
        hint: "کاربۆن لە گرووپی ١٤یە و ٤ ئەلیکترۆنی هاوهێزی هەیە.",
      },
    ],
    workedExample: "لە گازی میتان (CH₄)، کاربۆن ٤ بەندی یەکتایی لەگەڵ ٤ هایدرۆجین دروست دەکات.",
  },

  // ─── 2. بیرکاری (Math) ─────────────────────────────────────────────────────
  {
    id: "math-1",
    category: "math",
    grade: "12",
    format: "step_solver",
    title: "داتاشراوی نەخشە توانییەکان",
    statement: "داتاشراوی نەخشەی f(x) = x² + 4x لە خاڵی x = 1 هەژمار بکە.",
    difficulty: "intermediate",
    steps: [
      {
        instruction: "هەنگاوی ١: هاوکێشەی داتاشراوی f'(x) چییە؟ (بنووسە 2x+4)",
        expected: "2x+4",
        hint: "d/dx(x²) = 2x و d/dx(4x) = 4.",
      },
      {
        instruction: "هەنگاوی ٢: لێژی لە خاڵی x = 1 دەبێتە چەند؟",
        expected: "6",
        hint: "f'(1) = 2(1) + 4 = 6.",
      },
    ],
    workedExample: "ئەگەر f(x) = 3x² بووایە، f'(x) = 6x دەبوو و لە x=1 دەبووە 6.",
  },
  {
    id: "math-2",
    category: "math",
    grade: "12",
    format: "step_solver",
    title: "شیکارکردنی هاوکێشەی دووجا بە دەستوور",
    statement: "ڕەگەکانی هاوکێشەی x² - 5x + 6 = 0 بدۆزەرەوە بە بەکارهێنانی دەستووری گشتی (جیاکەرەوە Δ).",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: بەهای جیاکەرەوە (Δ = b² - 4ac) بدۆزەرەوە کاتێک a=1, b=-5, c=6 بێت:",
        expected: "1",
        hint: "Δ = (-5)² - 4(1)(6) = 25 - 24 = 1.",
      },
      {
        instruction: "هەنگاوی ٢: ڕەگە بچووکەکە (x₁) بدۆزەرەوە بەپێی x = (-b - √Δ) / 2a:",
        expected: "2",
        hint: "x = (5 - 1) / 2 = 4 / 2 = 2.",
      },
    ],
    workedExample: "ئەگەر هاوکێشەکە x² - 4 = 0 بووایە، ئەوا (x-2)(x+2) = 0 و ڕەگەکان بریتی دەبوون لە +2 و -2.",
  },

  // ─── 3. فیزیا (Physics) ────────────────────────────────────────────────────
  {
    id: "phys-1",
    category: "physics",
    grade: "12",
    format: "virtual_lab",
    title: "یاسای دووەمی نیوتن و هێزی لێکخشاندن",
    statement: "تەنێک بارستاییەکەی 10 kg لەسەر ڕوویەکی ئاسۆیی بە تاودانی 2 m/s² دەڕوات لە ژێر کاریگەری هێزێکدا. بڕی هێزی ڕووناکەرەوە (F) بە نیوتن چەندە؟",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: یاسای F = m × a جێبەجێ بکە. بڕی هێزەکە بە نیوتن (N) چەند دەبێت؟",
        expected: "20",
        hint: "F = 10 kg × 2 m/s² = 20 N.",
      },
    ],
    workedExample: "ئەگەر بارستایی 5 kg و تاودان 3 m/s² بووایە، F = 5 × 3 = 15 N دەبوو.",
  },
  {
    id: "phys-2",
    category: "physics",
    grade: "12",
    format: "step_solver",
    title: "یاسای فارادای لە کارۆڕاکێشانی کارۆموگناتیسی",
    statement: "لێشاوی موگناتیسی بەناو پێچێکدا لە ماوەی 0.1 چرکەدا بە بڕی 0.5 Wb گۆڕاوە. بڕی هێزی بزوێنەری کارۆڕاکێشاو (emf) چەند ڤۆڵتە؟",
    difficulty: "intermediate",
    steps: [
      {
        instruction: "هەنگاوی ١: بەهای emf بەپێی ΔΦ/Δt هەژمار بکە بە ژمارە:",
        expected: "5",
        hint: "emf = 0.5 / 0.1 = 5 V.",
      },
    ],
    workedExample: "بەپێی یاسای فارادای: emf = -N (ΔΦ/Δt).",
  },

  // ─── 4. زیندەزانی (Biology) ────────────────────────────────────────────────
  {
    id: "bio-1",
    category: "biology",
    grade: "12",
    format: "step_solver",
    title: "قۆناغەکانی دروستبوونی پڕۆتین لە خانەدا",
    statement: "لە شریتی پەیامبەرە ترش (mRNA)، سیانەی نیترۆجینی کۆدۆنی دەستپێک بۆ دروستبوونی پڕۆتین چییە؟",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: سێ پیتی کۆدۆنی دەستپێک بە ئینگلیزی بنووسە:",
        expected: "AUG",
        hint: "کۆدۆنی میثیۆنین ناسراوە بە پیتی AUG.",
      },
    ],
    workedExample: "کۆدۆنی AUG هەمیشە وەک خاڵی دەستپێکی وەرگێڕان کار دەکات لە ڕایبۆسۆمدا.",
  },

  // ─── 5. ئینگلیزی (English) ────────────────────────────────────────────────
  {
    id: "eng-1",
    category: "english",
    grade: "12",
    format: "gamified_quiz",
    title: "Present Perfect & Past Participles",
    statement: "Complete the sentence with the correct verb form: 'She has _____ (visit) Erbil Citadel twice.'",
    difficulty: "beginner",
    steps: [
      {
        instruction: "Step 1: Write the past participle form of the regular verb 'visit':",
        expected: "visited",
        hint: "For regular verbs, add -ed to the base form.",
      },
    ],
    workedExample: "Example: play -> played, see -> seen, go -> gone.",
  },
  {
    id: "eng-2",
    category: "english",
    grade: "12",
    format: "step_solver",
    title: "Passive Voice in Sunrise 12",
    statement: "Rewrite in passive voice: 'The government built this bridge in 2010.' -> 'This bridge _____ in 2010.'",
    difficulty: "intermediate",
    steps: [
      {
        instruction: "Step 1: Complete with past simple passive auxiliary and verb (two words):",
        expected: "was built",
        hint: "Past simple passive: was/were + past participle (built).",
      },
    ],
    workedExample: "Example: 'Shakespeare wrote Hamlet' -> 'Hamlet was written by Shakespeare.'",
  },

  // ─── 6. کوردی (Kurdish) ───────────────────────────────────────────────────
  {
    id: "kurd-1",
    category: "kurdish",
    grade: "12",
    format: "step_solver",
    title: "ڕستەی تێپەڕ و بەرکار لە زمانی کوردیدا",
    statement: "لە ڕستەی (ئازاد وانەکەی خوێندەوە)، وشەی 'وانەکەی' چ ئەرکێکی ڕێزمانی دەبینێت؟",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: ئەرکی ڕێزمانی وشەکە بنووسە بە کوردی:",
        expected: "بەرکار",
        hint: "کەوتووەتە ژێر کاری خوێندنەوەی بکەر.",
      },
    ],
    workedExample: "لە ڕستەی 'قوتابی کتێبەکە دەخوێنێت'، کتێبەکە بەرکارە.",
  },

  // ─── 7. عەرەبی (Arabic) ───────────────────────────────────────────────────
  {
    id: "arab-1",
    category: "arabic",
    grade: "12",
    format: "step_solver",
    title: "إعراب الفاعل والمفعول به في المنهج الوزاري",
    statement: "في جملة (شَرِحَ المُعَلِّمُ الدَّرْسَ)، ما هو الموقع الإعرابي لكلمة (المُعَلِّمُ)؟",
    difficulty: "beginner",
    steps: [
      {
        instruction: "الخطوة ١: اكتب الموقع الإعرابي للكلمة في الفراغ:",
        expected: "فاعل",
        hint: "من قام بالفعل وشرح الدرس (مرفوع بالضمة).",
      },
    ],
    workedExample: "الفاعل هو الاسم المرفوع الذي يدل على من قام بالفعل.",
  },

  // ─── 8. مێژوو (History) ───────────────────────────────────────────────────
  {
    id: "hist-1",
    category: "history",
    grade: "12",
    format: "step_solver",
    title: "شۆڕشی مەزنی ئەیلوول و بەیاننامەی ١١ی ئازار",
    statement: "بەیاننامەی مێژوویی ١١ی ئازار کە حوکمی زاتی بە گەلی کوردستان بەخشی، لە چ ساڵێکدا ڕاگەیەندرا؟",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: تەنها ساڵەکە بە ژمارە بنووسە (وەک: 1970):",
        expected: "1970",
        hint: "لە ساڵی ١٩٧٠ بە دەستکەوتی مەزنی شۆڕش هاتە کایەوە.",
      },
    ],
    workedExample: "شۆڕشی ئەیلوول لە ١٩٦١ دەستیپێکرد و بەیاننامەی ئازار لە ١٩٧٠ واژوو کرا.",
  },

  // ─── 9. ئابووری (Economy) ─────────────────────────────────────────────────
  {
    id: "econ-1",
    category: "economy",
    grade: "12",
    format: "step_solver",
    title: "تەرازووی بازرگانی و داهاتی نەتەوەیی",
    statement: "ئەگەر هەناردەی وڵاتێک ١٠٠ ملیار دۆلار بێت و هاوردەکەی ٨٠ ملیار بێت، قەبارەی زیادەی تەرازووی بازرگانی چەند ملیار دۆلارە؟",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: ژمارەی جیاوازییەکە بە ژمارە بنووسە:",
        expected: "20",
        hint: "١٠٠ - ٨٠ = ٢٠ ملیار دۆلار.",
      },
    ],
    workedExample: "تەرازووی بازرگانی یەکسانە بە بەهای هەناردە لێدەرکراوی بەهای هاوردە.",
  },

  // ─── 10. جوگرافیا (Geography) ─────────────────────────────────────────────
  {
    id: "geog-1",
    category: "geography",
    grade: "12",
    format: "step_solver",
    title: "جوگرافیای پیشەسازی و کێڵگەی بابەگوڕگوڕ",
    statement: "کێڵگەی نەوتی بەناوبانگی بابەگوڕگوڕ کە لە ساڵی ١٩٢٧ دۆزرایەوە، دەکەوێتە کام پارێزگای دێرینی کوردستان و عێراق؟",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: ناوی پارێزگاکە بنووسە بە کوردی:",
        expected: "کەرکووک",
        hint: "شارە بەناوبانگەکەی نەوتی باکوورە.",
      },
    ],
    workedExample: "کێڵگەی بابەگوڕگوڕ لە کەرکووک یەکێک لە دێرینترین کێڵگە نەوتییەکانی ناوچەکەیە.",
  },

  // ─── 11. وەرزش (Sports) ───────────────────────────────────────────────────
  {
    id: "sport-1",
    category: "sports",
    grade: "12",
    format: "step_solver",
    title: "یاساکانی فەرمی فیفا و فوتساڵ",
    statement: "لە یاری تۆپی پێی ناو هۆڵ (فوتساڵ)، هەر تیمێک بە چەند یاریزان بە گۆڵپارێزەوە لە ناو یاریگادا یاری دەکات؟",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: ژمارەی یاریزانانی ناو یاریگا بە ژمارە بنووسە:",
        expected: "5",
        hint: "٤ یاریزانی ناو یاریگا و ١ گۆڵپارێز.",
      },
    ],
    workedExample: "بەپێی یاساکانی فەرمی فیفا، تیمی فوتساڵ لە ٥ یاریزان پێکدێت (٤ یاریزانی ناو یاریگا و ١ گۆڵپارێز).",
  },

  // ─── 12. پۆلی ١١ی زانستی (Grade 11 Scientific Problems) ─────────────────────
  {
    id: "g11-chem-1",
    category: "chemistry",
    grade: "11",
    format: "step_solver",
    title: "یاساکانی گازەکان - یاسای بۆیل",
    statement: "بڕێک گازی نموونەیی قەبارەکەی 4.0 L لە پەستانی 1.0 atm. ئەگەر پەستانەکە زیاد بکرێت بۆ 2.0 atm لە پلەی گەرمی نەگۆڕدا، قەبارەی نوێی گازەکە بە لیتر چەندە؟",
    difficulty: "intermediate",
    steps: [
      {
        instruction: "هەنگاوی ١: یاسای بۆیل بریتییە لە P₁V₁ = P₂V₂. بەهای (P₁ × V₁) چەندە؟",
        expected: "4",
        hint: "P₁ × V₁ = 1.0 × 4.0 = 4.0.",
      },
      {
        instruction: "هەنگاوی ٢: بەهای قەبارەی نوێ V₂ بە لیتر چەندە؟ (V₂ = 4.0 / 2.0)",
        expected: "2",
        hint: "V₂ = 4 / 2 = 2 L.",
      },
    ],
    workedExample: "بەپێی یاسای بۆیل پەستان و قەبارە پەیوەندی پێچەوانەیان هەیە لە پلەی گەرمی جێگیردا.",
  },
  {
    id: "g11-phys-1",
    category: "physics",
    grade: "11",
    format: "step_solver",
    title: "یاسای دووەمی نیوتن و تاودان",
    statement: "تەنێک بارستاییەکەی 5 kgە، هێزێکی پوختەی 20 N کاری لێ دەکات. تاودانی ئەم تەنە بە یەکەی m/s² هەژمار بکە.",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: بەپێی یاسای نیوتن F = m × a، کەواتە a = F / m. بەهای تاودانەکە بە ژمارە بنووسە:",
        expected: "4",
        hint: "20 دابەشی 5 یەکسانە بە 4 m/s².",
      },
    ],
    workedExample: "a = F / m = 20 N / 5 kg = 4 m/s².",
  },
  {
    id: "g11-math-1",
    category: "math",
    grade: "11",
    format: "step_solver",
    title: "ژمارە ئاوێتەکان و بەهای i",
    statement: "بەهای ئەنجامی i² (کە i بریتییە لە یەکەی خەیاڵی √(-1)) چەندە؟",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: بەپێی پێناسەی ژمارە ئاوێتەکان، بەهای i² بە ژمارە بنووسە:",
        expected: "-1",
        hint: "چوارگۆشەی بنچینەی خەیاڵی i یەکسانە بە -1.",
      },
    ],
    workedExample: "i = √(-1) کەواتە i² = -1.",
  },
  {
    id: "g11-bio-1",
    category: "biology",
    grade: "11",
    format: "step_solver",
    title: "ڕۆشنەپێکهاتن و سووڕی کاڵڤن",
    statement: "لە کام بەشی کلۆرۆپلاستدا کارلێکە سەربەخۆکانی ڕۆشنایی (سووڕی کاڵڤن) ئەنجام دەدرێن؟",
    difficulty: "intermediate",
    steps: [
      {
        instruction: "هەنگاوی ١: دەستەواژەی شوێنی کارلێکەکە بنووسە (سترۆما یان گرانا):",
        expected: "سترۆما",
        hint: "سووڕی کاڵڤن لە سترۆما (Stroma)ی کلۆرۆپلاستدا ئەنجام دەدرێت.",
      },
    ],
    workedExample: "ڕۆشنە کارلێکەکان لە تایلاکۆید (گرانا) و سووڕی کاڵڤن لە سترۆمادا ڕوودەدەن.",
  },
  {
    id: "g11-arab-1",
    category: "arabic",
    grade: "11",
    format: "step_solver",
    title: "قواعد اللغة العربية - أحكام العدد",
    statement: "الأعداد من (٣ إلى ٩) تخالف المعدود في التذكير والتأنيث. ما هو مؤنث العدد (خمسة)؟",
    difficulty: "beginner",
    steps: [
      {
        instruction: "الخطوة ١: اكتب مؤنث العدد (خمسة طلاب -> ..... طالبات):",
        expected: "خمس",
        hint: "مع المعدود المؤنث نحذف التاء المربوطة فتصبح (خمس).",
      },
    ],
    workedExample: "خمس طالبات (مذكر لفظاً مع مؤنث معنى).",
  },
  {
    id: "g11-eng-1",
    category: "english",
    grade: "11",
    format: "step_solver",
    title: "Sunrise 11 - Present Simple vs Continuous",
    statement: "Choose the correct auxiliary verb: Water (boil / boils) at 100 degrees Celsius.",
    difficulty: "beginner",
    steps: [
      {
        instruction: "Step 1: Type the correct verb form for general scientific fact:",
        expected: "boils",
        hint: "General scientific facts take Present Simple with singular -s.",
      },
    ],
    workedExample: "General scientific facts always take Present Simple (boils).",
  },

  // ─── 13. پۆلی ١٠ی زانستی (Grade 10 Scientific Problems) ─────────────────────
  {
    id: "g10-phys-1",
    category: "physics",
    grade: "10",
    format: "step_solver",
    title: "خێرایی تێکڕا و شوێنگۆڕکێ",
    statement: "ئۆتۆمبێلێک مەودای 120 مەتر بە ماوەی 6 چرکە دەبڕێت. تێکڕای خێراییەکەی بە یەکەی m/s بدۆزەوە.",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: یاسای خێرایی تێکڕا بریتییە لە v = d / t. بەهای خێراییەکە بە ژمارە بنووسە:",
        expected: "20",
        hint: "v = 120 / 6 = 20 m/s.",
      },
    ],
    workedExample: "تێکڕای خێرایی لە ڕێگەی دابەشکردنی گشت شوێنگۆڕکێ بەسەر کاتی پێویست دەدۆزرێتەوە (v = 120 / 6 = 20 m/s).",
  },
  {
    id: "g10-bio-1",
    category: "biology",
    grade: "10",
    format: "step_solver",
    title: "کیمیای ژیان و گەردی وزەی خانە",
    statement: "ئەو گەردە سەرەکییەی کە وزە لەناو خانەدا دەگوازێتەوە و پاشەکەوتی دەکات، چی پێ دەوترێت؟ (کورتکراوەکەی بە زمانی ئینگلیزی بە پیتی گەورە بنووسە):",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: کورتکراوەی 3 پیتی گەردەکە بنووسە:",
        expected: "ATP",
        hint: "Adenosine Triphosphate (ATP).",
      },
    ],
    workedExample: "گەردی ATP بە باوی سەرچاوەی دەستبەجێی وزەیە بۆ تەواوی چالاکییە بایۆلۆجییەکانی خانە.",
  },
  {
    id: "g10-eng-1",
    category: "english",
    grade: "10",
    format: "step_solver",
    title: "Sunrise 10 - Past Simple Irregular Verbs",
    statement: "What is the past simple form of the verb 'go'?",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: شێوازی ڕابردووی گوێزراوەی فرمانی go بنووسە:",
        expected: "went",
        hint: "go -> went -> gone.",
      },
    ],
    workedExample: "The past simple form of the irregular verb 'go' is 'went'.",
  },
  {
    id: "g9-math-1",
    category: "math",
    grade: "9",
    format: "step_solver",
    title: "بیرکاری پۆلی ٩ - هاوکێشەی هێڵی",
    statement: "ئەگەر 2x + 4 = 12 بێت، بەهای x بدۆزەرەوە.",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: 4 لە هەردوو لای هاوکێشەکە کەم بکەرەوە، 2x دەبێتە چەند؟",
        expected: "8",
        hint: "12 - 4 = 8",
      },
      {
        instruction: "هەنگاوی ٢: هەردوو لا دابەشی 2 بکە، بەهای کۆتایی x بنووسە:",
        expected: "4",
        hint: "8 / 2 = 4",
      },
    ],
    workedExample: "2x + 4 = 12 => 2x = 8 => x = 4.",
  },
  {
    id: "g9-sci-1",
    category: "chemistry",
    grade: "9",
    format: "step_solver",
    title: "زانستی پۆلی ٩ - بونیاتی گەردیلە",
    statement: "کام تەنۆلکە لە ناوکەی گەردیلەدایە و باری کارەبایی موجەبە؟ (پرۆتۆن، ئەلیکترۆن، یان نیوترۆن)",
    difficulty: "beginner",
    steps: [
      {
        instruction: "هەنگاوی ١: ناوی تەنۆلکەکە بە کوردی بنووسە:",
        expected: "پرۆتۆن",
        hint: "پرۆتۆن باری موجەبە (+)، ئەلیکترۆن سالبە (-)، نیوترۆن بێ بارە.",
      },
    ],
    workedExample: "پرۆتۆن تەنۆلکەی سەرەکی ناوکە و خاوەن باری کارەبایی موجەبە (+1).",
  },
  {
    id: "g9-eng-1",
    category: "english",
    grade: "9",
    format: "step_solver",
    title: "Sunrise 9 - Present Perfect Form",
    statement: "Complete the sentence: 'Have you ever (visit) Erbil Citadel?' with the correct past participle.",
    difficulty: "beginner",
    steps: [
      {
        instruction: "Step 1: Write the past participle form of 'visit':",
        expected: "visited",
        hint: "visit is a regular verb: visit -> visited -> visited.",
      },
    ],
    workedExample: "The correct past participle form is 'visited' ('Have you ever visited Erbil Citadel?').",
  },
];

export interface PracticeLabProps {
  onNavigateToPedagogy?: () => void;
  onNavigateToSubjects?: () => void;
}

export function PracticeLab({
  onNavigateToPedagogy,
  onNavigateToSubjects,
}: PracticeLabProps = {}) {
  const { playSuccess, playError } = useSoundEffects();
  const { profile } = useStudentProfile();
  const user = useAppStore((state) => state.user);

  // Derive active subject metadata and pure problem scoping
  const rawSubj = (profile?.activeSubject || user?.activeSubject || "chemistry").toLowerCase();
  const activeSubjectMeta = SUBJECT_PRACTICE_META[rawSubj] || { label: "کیمیا", icon: "⚗️" };

  const [practiceTab, setPracticeTab] = useState<"standard_solver" | "interactive_types">("standard_solver");
  const [activeInteractiveIndex, setActiveInteractiveIndex] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userInputs, setUserInputs] = useState<Record<number, string>>({});
  const [confidenceFeedback, setConfidenceFeedback] = useState<ConfidenceFeedback | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [showPostMortem, setShowPostMortem] = useState(false);
  const [isPedagogyModalOpen, setIsPedagogyModalOpen] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState<ActivePedagogyStudio>(null);

  const openStudio = (studio: ActivePedagogyStudio) => {
    setSelectedStudio(studio);
    setIsPedagogyModalOpen(true);
  };

  const userProgress = useAppStore((state) => state.userProgress);
  const totalScore = userProgress.totalScore ?? 0;
  const currentLevelNum = Math.floor(totalScore / 100) + 1;
  const currentXpInLevel = totalScore % 100;
  const levelTargetXp = 100;
  const progressPercent = Math.min(100, Math.round((currentXpInLevel / levelTargetXp) * 100));

  const levelName =
    profile?.level === "advanced"
      ? "پێشکەوتوو و باڵا"
      : profile?.level === "beginner"
      ? "سەرەتایی"
      : "مامناوەند";

  const badgesList = [
    { id: 1, name: "یەکەمین گام", icon: "🥉", unlocked: totalScore >= 10 },
    { id: 2, name: "زانایی بیرکاری", icon: "🧮", unlocked: totalScore >= 50 },
    { id: 3, name: "کیمیادان", icon: "⚗️", unlocked: totalScore >= 100 },
    { id: 4, name: "ماستەر فیزیا", icon: "⚡", unlocked: totalScore >= 200 },
  ];

  // Subject-pure problem set: strictly matching the activeSubject
  const subjectScopedProblems = useMemo(() => {
    return PROBLEMS_DATA.filter((p) => {
      if (rawSubj === "math" || rawSubj === "mathematics") {
        return p.category === "math" || p.category === "algebra" || p.category === "geometry";
      }
      return p.category === rawSubj;
    });
  }, [rawSubj]);

  const availableProblems = subjectScopedProblems.length > 0 ? subjectScopedProblems : PROBLEMS_DATA;

  const filteredProblems = availableProblems.filter((p) => {
    const matchGrade = selectedGrade === "all" || p.grade === selectedGrade;
    const matchFormat = selectedFormat === "all" || p.format === selectedFormat;
    const matchSearch =
      p.title.includes(searchQuery) ||
      p.statement.includes(searchQuery);
    return matchGrade && matchFormat && matchSearch;
  });

  const currentProblem = filteredProblems[currentProblemIndex] || availableProblems[0] || PROBLEMS_DATA[0];

  // Subject-pure interactive exercises
  const filteredInteractiveExercises = useMemo(() => {
    const matched = SAMPLE_INTERACTIVE_EXERCISES.filter((ex) => {
      if (!ex.subject) return true;
      if (rawSubj === "math" || rawSubj === "mathematics") {
        return ex.subject === "math";
      }
      return ex.subject === rawSubj;
    });
    return matched.length > 0 ? matched : SAMPLE_INTERACTIVE_EXERCISES;
  }, [rawSubj]);

  const safeInteractiveIndex = Math.min(
    activeInteractiveIndex,
    Math.max(0, filteredInteractiveExercises.length - 1)
  );

  const handleCheckWork = () => {
    let allCorrect = true;
    currentProblem.steps.forEach((step, idx) => {
      const val = (userInputs[idx] || "").trim();
      if (val !== step.expected) {
        allCorrect = false;
      }
    });

    const generatedFeedback = ConfidenceFeedbackEngine.generateFeedback({
      isCorrect: allCorrect,
      userAnswer: Object.values(userInputs).join(", "),
      expectedAnswer: currentProblem.steps.map((s) => s.expected).join(", "),
      subject: currentProblem.category,
      topic: currentProblem.title,
      explanation: currentProblem.workedExample,
      hint: currentProblem.steps[0]?.hint,
    });

    setConfidenceFeedback(generatedFeedback);

    if (allCorrect) {
      playSuccess();
      useAppStore.getState().addProgressScore(15, 1);
      PracticeStorage.recordModuleCompletion(currentProblem.id, 10, 10, 15);
    } else {
      playError();
      setShowPostMortem(true);
    }
  };

  const handleReset = () => {
    setUserInputs({});
    setConfidenceFeedback(null);
    setShowHint(false);
    setShowExample(false);
  };

  const handleNextProblem = () => {
    handleReset();
    if (currentProblemIndex < filteredProblems.length - 1) {
      setCurrentProblemIndex((prev) => prev + 1);
    } else {
      setCurrentProblemIndex(0);
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "beginner":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">سەرەتایی</span>;
      case "intermediate":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">مامناوەند</span>;
      case "advanced":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">پێشکەوتوو</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50" dir="rtl">
      {/* 1. Sidebar Practice Library (280px Desktop) */}
      <aside className="w-full lg:w-[280px] bg-white border-l border-slate-200 flex flex-col h-auto lg:h-full shrink-0 shadow-2xs">
        {/* Search & Subject Badge */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{activeSubjectMeta.icon}</span>
              <span className="text-xs font-bold text-indigo-900 font-sans">{activeSubjectMeta.label}</span>
            </div>
            {onNavigateToSubjects && (
              <button
                type="button"
                onClick={onNavigateToSubjects}
                className="text-[10px] text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-100 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
              >
                <span>گۆڕین</span>
                <ArrowLeftRight className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`گەڕان لە بابەتەکانی ${activeSubjectMeta.label}...`}
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Problem List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredProblems.map((prob, idx) => (
            <div
              key={prob.id}
              onClick={() => {
                setCurrentProblemIndex(idx);
                handleReset();
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 text-right ${
                currentProblemIndex === idx
                  ? "bg-indigo-50/70 border-indigo-200 text-indigo-900 shadow-2xs"
                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-xs truncate max-w-[160px]">
                  {prob.title}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(prob.id);
                  }}
                  className="cursor-pointer"
                >
                  <Star
                    className={`w-4 h-4 ${
                      bookmarked[prob.id] ? "text-amber-500 fill-amber-500" : "text-slate-300"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                  {prob.category}
                </span>
                {getDifficultyBadge(prob.difficulty)}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Badges Modal */}
      {isBadgesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 relative border border-slate-100 shadow-xl" dir="rtl">
            <button
              onClick={() => setIsBadgesModalOpen(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-sans font-bold text-base text-slate-900">مەدالیاکانی بەدەستهێنان</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {badgesList.map((b) => (
                <div
                  key={b.id}
                  className={`p-3 rounded-xl border text-center space-y-1 ${
                    b.unlocked
                      ? "bg-amber-50/60 border-amber-200 text-slate-800"
                      : "bg-slate-50 border-slate-100 opacity-40 grayscale"
                  }`}
                >
                  <span className="text-3xl block">{b.icon}</span>
                  <span className="font-sans font-bold text-xs block">{b.name}</span>
                  <span className="text-[10px] text-slate-500">
                    {b.unlocked ? "کراوەتەوە ✅" : "داخراوە 🔒"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Practice Canvas */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between space-y-6">
        <div className="max-w-3xl w-full mx-auto space-y-6">
          {/* XP Gamification Card */}
          <div className="bg-gradient-to-l from-indigo-700 to-indigo-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs text-amber-300">
                  <Flame className="w-6 h-6 animate-pulse" />
                </span>
                <div>
                  <h3 className="font-sans font-bold text-sm">ئاستی فێرخواز: {levelName} (ئاستی {currentLevelNum})</h3>
                  <p className="text-xs text-indigo-200">{currentXpInLevel} / {levelTargetXp} خاڵ بۆ گەیشتن بە ئاستی {currentLevelNum + 1}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openStudio('error_dna')}
                  className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-white/20 transition-colors"
                >
                  <Activity className="w-3.5 h-3.5 text-rose-300" />
                  <span>DNAی هەڵەکان</span>
                </button>
                <button
                  onClick={() => {
                    if (onNavigateToPedagogy) onNavigateToPedagogy();
                    else openStudio(null);
                  }}
                  className="bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                  <span>ستۆدیۆکانی زانا</span>
                </button>
                <button
                  onClick={() => setIsBadgesModalOpen(true)}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  <span>مەدالیاکان ({badgesList.length})</span>
                </button>
              </div>
            </div>
            <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${Math.max(progressPercent, 4)}%` }} />
            </div>
          </div>

          {/* Active Subject Showcase Banner & Switcher */}
          <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-2xl flex items-center justify-center shrink-0">
                {activeSubjectMeta.icon}
              </span>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-bold text-slate-900 text-sm">
                    تاقیگەی ڕاهێنانی {activeSubjectMeta.label}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    مەنهەجی پۆلی ١٢
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                  پرسیار و ڕاهێنانەکان تەنها تایبەتن بە وانەی {activeSubjectMeta.label}
                </p>
              </div>
            </div>
            {onNavigateToSubjects && (
              <button
                type="button"
                onClick={onNavigateToSubjects}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-sans text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <span>گۆڕینی وانە</span>
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Practice Mode Switcher */}
          <div className="flex items-center justify-between gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setPracticeTab("standard_solver");
                handleReset();
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                practiceTab === "standard_solver"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>شیکارکەری هەنگاو بە هەنگاو</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPracticeTab("interactive_types");
                handleReset();
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                practiceTab === "interactive_types"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>ڕاهێنانی کارلێککارانە ({activeSubjectMeta.label})</span>
            </button>
          </div>

          {/* VIEW 1: INTERACTIVE ADVANCED EXERCISE TYPES */}
          {practiceTab === "interactive_types" && (
            <div className="space-y-6">
              {/* Exercise Selector Pills */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="text-xs font-bold text-slate-500 font-sans block">
                  جۆری ڕاهێنانی کارلێککارانەی {activeSubjectMeta.label} هەڵبژێرە:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {filteredInteractiveExercises.map((ex, exIdx) => {
                    const isSelected = safeInteractiveIndex === exIdx;
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => {
                          setActiveInteractiveIndex(exIdx);
                          handleReset();
                        }}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer font-sans space-y-1 ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80"
                        }`}
                      >
                        <span className="text-[10px] font-bold block opacity-80">
                          {ex.type === "fill_in_blank"
                            ? "پڕکردنەوەی بەتاڵ"
                            : ex.type === "matching"
                            ? "هاوتاکردنی دوو ستوون"
                            : ex.type === "ordering"
                            ? "ڕیزبەندی هەنگاوەکان"
                            : ex.type === "concept_map"
                            ? "نەخشەسازی چەمک"
                            : ex.type === "true_false"
                            ? "ڕاست یان هەڵە"
                            : "شیکاری ژمارەیی"}
                        </span>
                        <span className="font-bold text-xs block truncate">{ex.topicKu}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mounted Interactive Exercise Renderer */}
              <InteractiveExerciseRenderer
                exercise={filteredInteractiveExercises[safeInteractiveIndex]}
                onComplete={(success) => {
                  if (success) {
                    useAppStore.getState().addProgressScore(25, 1);
                  }
                }}
              />
            </div>
          )}

          {/* VIEW 2: STANDARD STEP-BY-STEP SOLVER */}
          {practiceTab === "standard_solver" && (
            <>
          {/* 3-Tier Filter System */}
          <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            {/* Row 1: Grade Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 shrink-0 ml-1">پۆل:</span>
              {[
                { id: "all", label: "هەموو پۆلەکان" },
                { id: "9", label: "پۆلی ٩" },
                { id: "10", label: "پۆلی ١٠" },
                { id: "11", label: "پۆلی ١١" },
                { id: "12", label: "پۆلی ١٢" },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setSelectedGrade(g.id);
                    setCurrentProblemIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs shrink-0 cursor-pointer transition-colors font-sans ${
                    selectedGrade === g.id
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Row 2: Subject Filter */}
            {/* Row 2: Active Subject Display */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 shrink-0 ml-1">بابەت:</span>
              <div className="px-3 py-1.5 rounded-xl text-xs shrink-0 flex items-center gap-1.5 font-sans bg-indigo-600 text-white font-bold shadow-2xs">
                <span>{activeSubjectMeta.icon}</span>
                <span>{activeSubjectMeta.label}</span>
              </div>
              {onNavigateToSubjects && (
                <button
                  type="button"
                  onClick={onNavigateToSubjects}
                  className="px-2.5 py-1 rounded-xl text-[11px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-sans font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                >
                  <span>گۆڕینی وانە</span>
                  <ArrowLeftRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Row 3: Format Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 shrink-0 ml-1">شێواز:</span>
              {[
                { id: "all", label: "هەموو جۆرەکان" },
                { id: "step_solver", label: "هەنگاو بە هەنگاو" },
                { id: "interactive_diagram", label: "دیاگرام" },
                { id: "virtual_lab", label: "تاقیگە" },
                { id: "gamified_quiz", label: "یاری پرسیار" },
                { id: "interactive_exercise", label: "ڕاهێنانی کارلێککاری (نوێ)" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    if (f.id === "interactive_exercise") {
                      setPracticeTab("interactive_types");
                      return;
                    }
                    setSelectedFormat(f.id);
                    setCurrentProblemIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs shrink-0 cursor-pointer transition-colors font-sans ${
                    selectedFormat === f.id
                      ? "bg-slate-200 text-slate-900 font-bold"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Module count indicator */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-sans px-1">
            <span>{filteredProblems.length} مۆدیوڵی ڕاهێنان بەردەستە</span>
          </div>

          {filteredProblems.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="font-sans font-bold text-base text-slate-800">
                هیچ پرسیارێک بەپێی ئەم فلتەرانە نەدۆزرایەوە
              </h3>
              <p className="font-sans text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                تکایە هەڵبژاردەی پۆل یان جۆری پرسیارەکە بگۆڕە یان فلتەرەکان پاکبکەرەوە بۆ بینینی هەموو ڕاهێنانەکان.
              </p>
              <button
                onClick={() => {
                  setSelectedGrade("all");
                  setSelectedFormat("all");
                  setSearchQuery("");
                }}
                className="mt-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>پاککردنەوەی فلتەرەکان</span>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              {/* Header Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    تاقیگەی ڕاهێنانی ئەکادیمی 📝
                  </span>
                  {getDifficultyBadge(currentProblem.difficulty)}
                </div>

                <h1 className="font-sans font-bold text-xl sm:text-2xl text-slate-900">
                  {currentProblem.title}
                </h1>

                <p className="font-sans text-sm sm:text-base text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  {currentProblem.statement}
                </p>
              </div>

              {/* Step-by-Step Solver Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="font-sans font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                  هەنگاوەکانی شیکارکردن
                </h2>

                <div className="space-y-4">
                  {currentProblem.steps.map((step, idx) => (
                    <div key={idx} className="space-y-2 p-3 bg-slate-50/60 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800 font-sans">
                        {step.instruction}
                      </label>
                      <input
                        type="text"
                        value={userInputs[idx] || ""}
                        onChange={(e) =>
                          setUserInputs((prev) => ({ ...prev, [idx]: e.target.value }))
                        }
                        placeholder="وەڵام بنووسە..."
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                      />
                      {showHint && (
                        <p className="text-[11px] text-amber-700 font-sans bg-amber-50 p-2 rounded-lg border border-amber-200">
                          💡 {step.hint}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Worked Example Reveal */}
                {showExample && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-sans space-y-1 animate-in fade-in">
                    <span className="font-bold">نموونەی شیکارکراوی هاوشێوە:</span>
                    <p>{currentProblem.workedExample}</p>
                  </div>
                )}

                {/* Confidence Builder Feedback */}
                {confidenceFeedback && (
                  <ConfidenceFeedbackCard
                    feedback={confidenceFeedback}
                    onRetry={handleReset}
                    onNext={handleNextProblem}
                  />
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>

        {/* Bottom Action Buttons (Only for standard solver) */}
        {practiceTab === "standard_solver" && (
          <div className="max-w-3xl w-full mx-auto pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                {showHint ? "شاردنەوەی ڕێنمایی" : "تێبینی و ڕێنمایی"}
              </button>
              <button
                onClick={() => setShowExample(!showExample)}
                className="text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                {showExample ? "شاردنەوەی نموونە" : "نموونەی شیکارکراو"}
              </button>
              <button
                onClick={handleReset}
                className="text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="نوێکردنەوەی هەنگاوەکان"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCheckWork}
                className="text-xs font-bold px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                پشکنینی شیکار (Check Work)
              </button>
              <button
                onClick={handleNextProblem}
                className="text-xs font-bold px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>پرسیاری دواتر</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Metacognitive Error Post-Mortem Dialogue Modal */}
      <MetacognitivePostMortemModal
        isOpen={showPostMortem}
        onClose={() => setShowPostMortem(false)}
        onComplete={() => setShowPostMortem(false)}
        problemId={currentProblem.id}
        problemTitle={currentProblem.title}
        subject={currentProblem.category}
      />

      {/* Pedagogical Hub Modal */}
      <PedagogyHubModal
        isOpen={isPedagogyModalOpen}
        onClose={() => setIsPedagogyModalOpen(false)}
        defaultStudio={selectedStudio}
      />
    </div>
  );
}

export default PracticeLab;
