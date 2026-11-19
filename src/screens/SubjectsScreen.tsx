import React, { useState, useMemo } from "react";
import { StudentProfile, SubjectKey } from "../features/student/studentTypes.ts";
import {
  BookOpen,
  MessageSquare,
  FlaskConical,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  BookMarked,
  Lock,
  Clock,
  LayoutGrid,
} from "lucide-react";
import { SubjectCard } from "../components/SubjectCard.tsx";
import { Grade12ChemistryBookViewer } from "../components/Grade12ChemistryBookViewer.tsx";
import { Grade12PhysicsBookViewer } from "../components/Grade12PhysicsBookViewer.tsx";
import { Grade12MathBookViewer } from "../components/Grade12MathBookViewer.tsx";
import { Grade12KurdishBookViewer } from "../components/Grade12KurdishBookViewer.tsx";
import { Grade12ArabicBookViewer } from "../components/Grade12ArabicBookViewer.tsx";
import { Grade12SportsBookViewer } from "../components/Grade12SportsBookViewer.tsx";
import { Grade12HistoryBookViewer } from "../components/Grade12HistoryBookViewer.tsx";
import { Grade12EconomicsBookViewer } from "../components/Grade12EconomicsBookViewer.tsx";
import { Grade12GeographyBookViewer } from "../components/Grade12GeographyBookViewer.tsx";
import { Grade12LiteraryMathBookViewer } from "../components/Grade12LiteraryMathBookViewer.tsx";
import { Grade12EnglishBookViewer } from "../components/Grade12EnglishBookViewer.tsx";
import { CurriculumBackboneExplorer } from "../components/CurriculumBackboneExplorer.tsx";

interface SubjectsScreenProps {
  profile: StudentProfile;
  onSelectSubject: (subjectId: SubjectKey) => void;
  onNavigate: (tab: string) => void;
}

export interface TextbookCardItem {
  id: string;
  title: string;
  fullName: string;
  coverImage: string;
  subjectKey?: SubjectKey;
  stream: "scientific" | "literary" | "both";
  streamLabel: string;
  grade: "9" | "10" | "11" | "12";
  chaptersCount: number;
  description: string;
  hasInteractiveViewer?: boolean;
  colorTheme: string;
  outline?: { id: number | string; title: string; pages?: string; description?: string }[];
}

export const GRADE_12_TEXTBOOKS: TextbookCardItem[] = [
  {
    id: "math",
    title: "بیرکاری",
    fullName: "زانست بۆ هەمووان - بیرکاری (پۆلی ١٢ی زانستی)",
    coverImage: "/books/math.png",
    subjectKey: "math",
    stream: "scientific",
    streamLabel: "زانستی",
    grade: "12",
    chaptersCount: 7,
    hasInteractiveViewer: true,
    colorTheme: "from-emerald-900/20 to-teal-950/40",
    description: "٧ بەشی فەرمی: وێنەی نەخشەکان، ئامانجەکان (Limits)، داتاشراو (Derivatives)، جێبەجێکردنی داتاشراوە، و تەواوکاری (Integration).",
    outline: [
      { id: 1, title: "بەشی ١: وێنە ڕوونکردنەوەییەکان و نموونە هێڵییەکان", pages: "٣ - ٣٨" },
      { id: 2, title: "بەشی ٢: ئامانجەکان (Limits) و نەخشە بەردەوامەکان", pages: "٣٩ - ٧٨" },
      { id: 3, title: "بەشی ٣: داتاشراو (Derivative) و ڕێساکانی جیاکاری", pages: "٧٩ - ١١٦" },
      { id: 4, title: "بەشی ٤: جێبەجێکردنی داتاشراو (تێکڕای گۆڕان و قۆقزی)", pages: "١١٧ - ١٥٨" },
      { id: 5, title: "بەشی ٥: تەواوکاریی نادیار و بنەماکانی هەژمارکردن", pages: "١٥٩ - ١٩٦" },
      { id: 6, title: "بەشی ٦: تەواوکاریی دیاریکراو و ڕووبەری بن چەماوە", pages: "١٩٧ - ٢٣٦" },
      { id: 7, title: "بەشی ٧: قەبارەی تەنە خولاوەکان و ئەندازەی بەرایی", pages: "٢٣٧ - ٢٧٦" },
    ],
  },
  {
    id: "physics",
    title: "فیزیا",
    fullName: "زانست بۆ هەمووان - فیزیا (پۆلی ١٢ی زانستی)",
    coverImage: "/books/physics.png",
    subjectKey: "physics",
    stream: "scientific",
    streamLabel: "زانستی",
    grade: "12",
    chaptersCount: 9,
    hasInteractiveViewer: true,
    colorTheme: "from-blue-900/20 to-cyan-950/40",
    description: "٩ بەشی فەرمی: جووڵەی خولاوە، کێشکردنی گەردوونی، تەوژمی هێز، کارۆڕاکێشان، یاسای لێنز، بازنەی تەزووی گۆڕاو و ئەتۆم.",
    outline: [
      { id: 1, title: "بەندی ١: جووڵەی خولاوە و یاسای کێشکردن", pages: "٧ - ٣٦" },
      { id: 2, title: "بەندی ٢: جووڵەی تەنە گەردوونییەکان و مانگە دەستکردەکان", pages: "٣٧ - ٦٢" },
      { id: 3, title: "بەندی ٣: تەوژمی هێز و هاوسەنگی تەنە ڕەقەکان", pages: "٦٣ - ٩٤" },
      { id: 4, title: "بەندی ٤: کارۆڕاکێشان و دۆزینەوەی فارادای", pages: "٩٥ - ١٢٦" },
      { id: 5, title: "بەندی ٥: یاسای لێنز و تەزووی خۆڕاکێشان", pages: "١٢٧ - ١٥٨" },
      { id: 6, title: "بەندی ٦: بازنەی تەزووی گۆڕاو (AC) و گۆڕەری کارەبایی", pages: "١٥٩ - ١٩٢" },
      { id: 7, title: "بەندی ٧: تیشکدانەوەی ئەلیکترۆموگناتیسی و کوانتۆم", pages: "١٩٣ - ٢٢٠" },
      { id: 8, title: "بەندی ٨: فیزیای ئەتۆمی و تیشکاوەری سروشتی", pages: "٢٢١ - ٢٥٢" },
      { id: 9, title: "بەندی ٩: فیزیای ناوکی و بەرگە تەنی سەرەتاییەکان", pages: "٢٥٣ - ٢84" },
    ],
  },
  {
    id: "chemistry",
    title: "کیمیا",
    fullName: "زانست بۆ هەمووان - کیمیا (مەنهەجی نوێی ٢٠٢٥)",
    coverImage: "/books/chemistry.png",
    subjectKey: "chemistry",
    stream: "scientific",
    streamLabel: "زانستی",
    grade: "12",
    chaptersCount: 10,
    hasInteractiveViewer: true,
    colorTheme: "from-purple-900/20 to-slate-950/40",
    description: "١٠ بەشی فەرمی نوێی کیمیا (٣١٦ لاپەڕە): ترش و تفت، پێوەری pH، هاوسەنگی کیمیایی، گەرمی، کارەبایی کیمیا، و کیمیای ئەندامی بۆ وزاری.",
    outline: [
      { id: 1, title: "بەندی ١: ئایۆنەکان لە ئاوەگیراوەکاندا و ڕەوشە کۆکارییەکان", pages: "٨ - ٣٦" },
      { id: 2, title: "بەندی ٢: ترشەکان و تفتەکان (تیۆرییەکانی ترش و تفت)", pages: "٣٧ - ٦٠" },
      { id: 3, title: "بەندی ٣: تیتراسیۆنی ترش و تفت و پێوەری pH", pages: "٦١ - ٩٠" },
      { id: 4, title: "بەندی ٤: هاوسەنگیی کیمیایی (یاسای لوشاتلییە و Keq)", pages: "٩١ - ١٢٤" },
      { id: 5, title: "بەندی ٥: هاوسەنگیی ترش و تفت (Ka، Kb، Kw و گیراوەی پارێزەر)", pages: "١٢٥ - ١٥٤" },
      { id: 6, title: "بەندی ٦: گەرمیی کیمیایی (ئەنساڵپی، یاسای هێس و ئەنترۆپی)", pages: "١٥٥ - ١٨٦" },
      { id: 7, title: "بەندی ٧: خێرایی کارلێکە کیمیاییەکان و پلەی کارلێک", pages: "١٨٧ - ٢٠٤" },
      { id: 8, title: "بەندی ٨: کارلێکەکانی ئۆکسان و داڕزان و کارەبایی کیمیا", pages: "٢٠٥ - ٢٢٥" },
      { id: 9, title: "بەندی ٩: کاربۆن و هایدرۆکاربۆنەکان (ئەلکان، ئەلکین، ئەلکاین)", pages: "٢٢٦ - ٢٦١" },
      { id: 10, title: "بەندی ١٠: ئاوێتە ئەندامییەکانی تر و پۆلێنکردنیان", pages: "٢٦٢ - ٢٩٧" },
    ],
  },
  {
    id: "biology",
    title: "زیندەزانی",
    fullName: "زانست بۆ هەمووان - زیندەزانی (پۆلی ١٢ی زانستی)",
    coverImage: "/books/biology.png",
    subjectKey: "biology",
    stream: "scientific",
    streamLabel: "زانستی",
    grade: "12",
    chaptersCount: 8,
    colorTheme: "from-rose-900/20 to-slate-950/40",
    description: "پێکهاتەی وردی خانە، بۆماوەزانی، کۆدی جیناتی، سیستەمی دەمار و هەستەکان، زاوزێ، گەشە و ژینگەزانی بۆ تاقیکردنەوەی وەزاری.",
    outline: [
      { id: 1, title: "بەندی ١: بۆماوەزانی و یاساکانی مێندڵ", pages: "٧ - ٣٨", description: "بۆماوەی مێندڵی، دووڕەگکردن، زاڵ و بەزیو، و نەخشەی جینی." },
      { id: 2, title: "بەندی ٢: ترشە ناوەکییەکان (DNA و RNA) و کۆپیبوون", pages: "٣٩ - ٧٤", description: "پێکهاتەی دووانی مارپێچی، بازدان، دروستکردنی پرۆتین." },
      { id: 3, title: "بەندی ٣: تەکنەلۆژیای جینات و ئەندازیاریی جیناتی", pages: "٧٥ - ١٠٨", description: "بڕینی ترشی ناوەکی بە ئەنزیم، چاندنی جینی لە بەکتریا." },
      { id: 4, title: "بەندی ٤: سیستەمی کۆئەندامی دەمار لە مرۆڤدا", pages: "١٠٩ - ١٤٦", description: "دەمارەخانە، پەیامی دەماری، مێشک و دڕکەپەتک." },
      { id: 5, title: "بەندی ٥: کۆئەندامی هەستەکان (بینین و بیستن)", pages: "١٤٧ - ١٧٨", description: "پێکهاتەی چاو، گوێ و وەرگرە کیمیایی و فیزیاییەکان." },
      { id: 6, title: "بەندی ٦: کۆئەندامی دەردانی هۆڕمۆنەکان (ڕژێنەکان)", pages: "١٧٩ - ٢١٢", description: "ڕژێنی ژێر مێشک، تایرۆید، پانکریاس و هاوسەنگی ناوەکی." },
      { id: 7, title: "بەندی ٧: زاوزێ و گەشەکردن لە مرۆڤدا", pages: "٢١٣ - ٢٥٤", description: "پیتاندن، دروستبوونی کۆرپەلە، و قۆناغەکانی گەشە." },
      { id: 8, title: "بەندی ٨: ژینگە و پەیوەندییە زیندەییەکان", pages: "٢٥٥ - ٢٩٢", description: "زنجیرەی خۆراک، ئیکۆسیستەم و پاراستنی جۆراوجۆری زیندەیی." },
    ],
  },
  {
    id: "english",
    title: "ئینگلیزی",
    fullName: "Sunrise 12 - Student's Book (کتێبی خوێندکار)",
    coverImage: "/books/english.png",
    subjectKey: "english",
    stream: "both",
    streamLabel: "وێژەیی و زانستی",
    grade: "12",
    chaptersCount: 9,
    hasInteractiveViewer: true,
    colorTheme: "from-amber-500/20 to-sky-950/40",
    description: "مەنهەجی فەرمی ئینگلیزی پۆلی ١٢ (Sunrise 12 - Student's Book): ٨ یونتی سەرەکی، ڕێزمانی پێشکەوتوو، خوێندنەوە، وشەسازی و فەرهەنگۆک، لەگەڵ ڕۆمانی ئەدەبی Treasure Island بۆ هەردوو بەشی زانستی و وێژەیی.",
    outline: [
      { id: "e12-u1", title: "Unit 1: To New York (Travel & Aviation)", pages: "4 - 11", description: "Giving instructions, Suggestions, Comparatives & Superlatives, Past vs Present Perfect." },
      { id: "e12-u2", title: "Unit 2: Getting Organized (Communication & Tasks)", pages: "12 - 19", description: "Prepositions of time, Contrast linkers, Future Continuous, Too & (not) enough." },
      { id: "e12-u3", title: "Unit 3: Saving the Past for the Future (World Heritage)", pages: "20 - 27", description: "Passive voice across tenses, Modals for deduction and certainty, Cause & effect." },
      { id: "e12-u4", title: "Unit 4: Revision 1 (Units 1-3 Review)", pages: "28 - 31", description: "Comprehensive revision of grammar, vocabulary and ministerial questions." },
      { id: "e12-u5", title: "Unit 5: Feeding Nine Billion (Food Security & Farming)", pages: "32 - 39", description: "Quantities, Conditionals (Zero, 1st, 2nd, 3rd), Regrets with If only & I wish." },
      { id: "e12-u6", title: "Unit 6: Into the Information Age (Tech & SchoolNet)", pages: "40 - 47", description: "Relative clauses (defining & non-defining, reduced), Wh-clauses, Expressing purpose." },
      { id: "e12-u7", title: "Unit 7: Working Together for a Better World (Global Aid)", pages: "48 - 55", description: "Participle clauses with prepositions, Verb patterns, Used to vs Be/Get used to, Reported speech." },
      { id: "e12-u8", title: "Unit 8: Revision 2 (Units 5-7 Review)", pages: "56 - 59", description: "Comprehensive revision of units 5-7, ministerial exam focus points." },
      { id: "e12-u9", title: "Literary Reader: Treasure Island (Episodes 1 to 9)", pages: "66 - 102", description: "Classic novel by Robert Louis Stevenson: Billy Bones, the Black Spot, Long John Silver, the Hispaniola, and Flint's treasure." },
    ],
  },
  {
    id: "english_activity",
    title: "ئینگلیزی - چاڵاکی",
    fullName: "Sunrise 12 - Activity Book (کتێبی چاڵاکی)",
    coverImage: "/books/english_activity.png",
    subjectKey: "english",
    stream: "both",
    streamLabel: "وێژەیی و زانستی",
    grade: "12",
    chaptersCount: 9,
    hasInteractiveViewer: true,
    colorTheme: "from-sky-500/20 to-indigo-950/40",
    description: "کتێبی فەرمی ڕاهێنان و چاڵاکییەکانی Sunrise 12 (٨١ لاپەڕە): ڕاهێنانی چڕی ڕێزمان، وشەسازی، نووسینی وتار، و پرسیارەکانی ڕۆمانی Treasure Island بۆ تاقیکردنەوەی وزاری.",
    outline: [
      { id: "ab12-u1", title: "Activity Unit 1: To New York", pages: "2 - 9", description: "Grammar & vocabulary exercises, reading comprehension, writing skills." },
      { id: "ab12-u2", title: "Activity Unit 2: Getting Organized", pages: "10 - 17", description: "Practice on future continuous, linkers, negative questions, and too/enough." },
      { id: "ab12-u3", title: "Activity Unit 3: Saving the Past for the Future", pages: "18 - 25", description: "Passive voice practice, modals of deduction, text analysis." },
      { id: "ab12-u4", title: "Activity Unit 4: Revision 1", pages: "26 - 31", description: "Self-assessment, ministerial exam tests and review." },
      { id: "ab12-u5", title: "Activity Unit 5: Feeding Nine Billion", pages: "32 - 39", description: "Conditionals practice, expressing regrets, vocabulary drills." },
      { id: "ab12-u6", title: "Activity Unit 6: Into the Information Age", pages: "40 - 47", description: "Relative clauses exercises, wh-clauses, formal email writing." },
      { id: "ab12-u7", title: "Activity Unit 7: Working Together for a Better World", pages: "48 - 55", description: "Participle clauses, reported speech conversion, argumentative writing." },
      { id: "ab12-u8", title: "Activity Unit 8: Revision 2", pages: "56 - 61", description: "Comprehensive test prep for units 5-7." },
      { id: "ab12-u9", title: "Activity: Treasure Island Study Guide", pages: "62 - 81", description: "Questions, character analysis, and plot reviews for all 9 episodes." },
    ],
  },
  {
    id: "kurdish",
    title: "زمان و ئەدەبی کوردی",
    fullName: "زمان و ئەدەبی کوردی - پۆلی دوازدەهەمی ئامادەیی",
    coverImage: "/books/kurdish.png",
    subjectKey: "kurdish",
    stream: "literary",
    streamLabel: "وێژەیی",
    grade: "12",
    chaptersCount: 4,
    hasInteractiveViewer: true,
    colorTheme: "from-amber-600/20 to-orange-950/40",
    description: "مەنهەجی فەرمی نوێی وەزارەتی پەروەردە (١٩٢ لاپەڕە): چوار بەشی سەرەکی - ڕێزمان، ئەدەبی هاوچەرخ و ڕەخنە، ڕەوانبێژی، و خوێندنەوەی دەقی ئەدەبی بۆ تاقیکردنەوەی وزاری.",
    outline: [
      { id: 1, title: "بەشی یەکەم: ڕێزمان (شێوازەکانی کار، چاوگی بوون، جێناوە لکاوەکان، هاوەڵناو و هاوەڵکار، ڕادە، دیارخەرەکان)", pages: "٧ - ٩٤", description: "شێوازی ڕاگەیاندن، دانانی، داخوازی، مەرجی، چاوگی بوون، ئەرکی (هـ)، ئەرکی جێناوە کەسییە لکاوەکان، هاوەڵناو و هاوەڵکار، ڕادە، و دیارخەرەکانی ناو." },
      { id: 2, title: "بەشی دووەم: ئەدەب و ڕەخنە (قۆناغەکانی شیعری نوێ ١٩٣٩-١٩٩١، ڕەخنەی ئەدەبی، وتار، چیرۆکی هونەری، ڕۆمان)", pages: "٩٥ - ١٥٠", description: "قۆناغەکانی ١٩٣٩-١٩٥٨، ١٩٥٨-١٩٧٠، ١٩٧٠-١٩٩١، تایبەتمەندی ڕوخسار و ناوەڕۆک، ڕەخنەی ئەدەبی کوردی و جیهانی، وتار، چیرۆکی هونەری و ڕۆمان." },
      { id: 3, title: "بەشی سێیەم: ڕەوانبێژی (ڕەگەزدۆزی، لێکچوواندن، خواستن، دژەیەک، جوانیی بایس، تێهەڵکێش)", pages: "١٥١ - ١٧٢", description: "ڕەگەزدۆزی (الجناس)، لێکچوواندن (التشبیه)، خواستن (الاستعارة)، دژەیەک (الطباق)، جوانیی بایس، و تێهەڵکێش (التضمین)." },
      { id: 4, title: "بەشی چوارەم: خوێندنەوە و شیکردنەوەی دەق (شێخ سەعیدی پیران، میر شەرەفخان، مەلا محەمەدی کۆیی، قەڵای دمدم)", pages: "١٧٣ - ١٨٣", description: "شیکردنەوەی دەقە مێژوویی و ئەدەبییەکان و فەرهەنگۆکی دەوڵەمەندی زمانی کوردی." },
    ],
  },
  {
    id: "arabic_1",
    title: "عەرەبی - بەشی ١",
    fullName: "اللغة العربية - الجزء الأول (پۆلی ١٢ی ئامادەیی)",
    coverImage: "/books/arabic_1.png",
    subjectKey: "arabic",
    stream: "both",
    streamLabel: "وێژەیی و زانستی",
    grade: "12",
    chaptersCount: 3,
    hasInteractiveViewer: true,
    colorTheme: "from-emerald-800/20 to-teal-950/40",
    description: "بەشی یەکەمی زمانی عەرەبی (٧٤ لاپەڕە): ٣ یەکەی سەرەکی - الرومنسية في الأدب (نشيد الحرية، المساء)، الواقعية في الأدب، الأدب الأندلسي وشعر الموشحات، لەگەڵ ڕێزمانی المفعول لأجله والاستثناء والتمييز والتعجب والحال.",
    outline: [
      { id: "ar1-u1", title: "الوحدة الأولى: الرومنسية في الأدب العربي", pages: "٧ - ٢٦", description: "النصوص: نشيد الحرية (شيلي) والمساء (إيليا أبو ماضي) | القواعد: المفعول لأجله، أسلوب الاستثناء | الإملاء: اتصال من وعن." },
      { id: "ar1-u2", title: "الوحدة الثانية: الواقعية في الأدب العربي", pages: "٢٧ - ٤٨", description: "النصوص: خصائص الأدب الواقعي | القواعد: التمييز (الذات والنسبة)، أسلوب التعجب (القياسي والسماعي) | البلاغة: التشبيه وأركانه." },
      { id: "ar1-u3", title: "الوحدة الثالثة: الأدب الأندلسي وشعر الموشحات", pages: "٤٩ - ٧٤", description: "النصوص: موشحة جادك الغيث (لسان الدين بن الخطيب) | القواعد: الحال (المفردة والجملة وشبه الجملة) | البلاغة: الاستعارة التصريحية والمكنية." },
    ],
  },
  {
    id: "arabic_2",
    title: "عەرەبی - بەشی ٢",
    fullName: "اللغة العربية - الجزء الثاني (پۆلی ١٢ی ئامادەیی)",
    coverImage: "/books/arabic_2.png",
    subjectKey: "arabic",
    stream: "both",
    streamLabel: "وێژەیی و زانستی",
    grade: "12",
    chaptersCount: 3,
    hasInteractiveViewer: true,
    colorTheme: "from-blue-800/20 to-cyan-950/40",
    description: "بەشی دووەمی زمانی عەرەبی (٣٨ لاپەڕە): ٣ یەکەی سەرەکی - عصر صدر الإسلام والأموي (كعب بن زهير)، العصر العباسي (أبو العتاهية)، الشعر العربي الحديث وتفعيلة، لەگەڵ ڕێزمانی المدح والذم والتوكيد وأحكام العدد.",
    outline: [
      { id: "ar2-u4", title: "الوحدة الرابعة: عصر صدر الإسلام والعصر الأموي", pages: "٧ - ٢٠", description: "النصوص: مدح الرسول للمهاجرين والأنصار (كعب بن زهير) | القواعد: أسلوب المدح والذم (نعم، بئس، حبذا) | البلاغة: الكناية بأنواعها." },
      { id: "ar2-u5", title: "الوحدة الخامسة: العصور الأدبية - العصر العباسي", pages: "٢١ - ٣٠", description: "النصوص: شعر الزهد (أبو العتاهية) | القواعد: أسلوب التوكيد (اللفظي والمعنوي وبنوني التوكيد) | البلاغة: الطباق والمقابلة والجناس." },
      { id: "ar2-u6", title: "الوحدة السادسة: الشعر العربي الحديث ونماذج مختارة", pages: "٣١ - ٣٨", description: "النصوص: شعر التفعيلة والرواد (السياب ونازك الملائكة) | القواعد: أحكام العدد (تذكير وتأنيث وإعراب وتمييز) | المراجعة الوزارية." },
    ],
  },
  {
    id: "sports",
    title: "وەرزش",
    fullName: "پڕۆگرامی پەروەردەی وەرزشی (پۆلی ١٢ی ئامادەیی)",
    coverImage: "/books/sports.png",
    subjectKey: "sports",
    stream: "both",
    streamLabel: "وێژەیی و گشتی",
    grade: "12",
    chaptersCount: 2,
    hasInteractiveViewer: true,
    colorTheme: "from-amber-600/20 to-emerald-950/40",
    description: "مەنهەجی فەرمی پەروەردەی وەرزشی (٨٠ لاپەڕە): یاساکانی تۆپی پێی فیفا (١٧ یاسای نێودەوڵەتی، هێڵەکان، ناوبژیوانی، ئۆفساید، سزا) و فوتساڵ (Futsal، یاساکانی هۆڵ، کاتی پچڕێندراو، و پرسیارەکانی وزاری).",
    outline: [
      { id: "pe-p1", title: "بەشی یەکەم: یاساکانی تۆپی پێ (یاسا نێودەوڵەتییەکانی فیفا)", pages: "٣ - ٤٠", description: "١٧ یاسای نێودەوڵەتی: گۆڕەپانی یاری، تۆپ، یاریزانان و کەلوپەل، ناوبژیوان و یاریدەدەران، کاتی یاری، ئۆفساید، سەرپێچی و لێدانی سزا." },
      { id: "pe-p2", title: "بەشی دووەم: فوتساڵ - تۆپی پێی بچووکراوە (Futsal)", pages: "٤١ - ٨٠", description: "سەرهەڵدانی فوتساڵ، پێوانەی هۆڵ، ٥ یاریزان، گۆڕانکارییە فڕیوەکان، کاتی ڕاستەقینە، سەرپێچییە کەڵەکەبووەکان، ناوبژیوانی و پرسیارە نموونەییەکان." },
    ],
  },
  {
    id: "history",
    title: "مێژوو",
    fullName: "مێژووی نوێ و هاوچەرخ (پۆلی ١٢ی وێژەیی)",
    coverImage: "/books/history.png",
    subjectKey: "history",
    stream: "literary",
    streamLabel: "وێژەیی",
    grade: "12",
    chaptersCount: 10,
    hasInteractiveViewer: true,
    colorTheme: "from-amber-700/20 to-stone-950/40",
    description: "مەنهەجی فەرمی مێژووی نوێ و هاوچەرخ (٢٦٤ لاپەڕە): ١٠ بەشی سەرەکی - ململانێی عوسمانی و ئێرانی، پەیماننامەکان، میرنشینە کوردییەکان، تەنزیمات، ڕۆژنامەگەری، جەنگی جیهانی یەکەم، ڕاپەڕین و شۆڕشەکانی کورد و عێراق، و بزووتنەوەی ئیستعماری لە وڵاتانی عەرەبی.",
    outline: [
      { id: "hist-ch1", title: "بەشی یەکەم: ململانێی عوسمانی - ئێرانی و کاریگەریی لەسەر کوردستان", pages: "٣ - ٢٢", description: "شەڕی چاڵدێران ١٥١٤، هۆکارەکان، ڕووداوەکان، مەلا ئیدریسی بەدلیسی و دەرئەنجامەکانی شەڕەکە لەسەر کوردستان." },
      { id: "hist-ch2", title: "بەشی دووەم: پەیمان و ڕێکەوتنەکانی عوسمانی - ئێرانی و پەیوەندییان بە گەلی کوردەوە", pages: "٢٣ - ٤٤", description: "پەیمانی ئەماسیە ١٥٥٥، قەسری شیرین ١٦٣٩، پەیمانی ئەرزەڕۆمی یەکەم ١٨٢٣ و دووەم ١٨٤٧، پرۆتۆکۆلی تاران و ئەستەنبوڵ." },
      { id: "hist-ch3", title: "بەشی سێیەم: ئیستعماری ئەوروپی و فراوانخوازی لە ڕۆژهەڵاتی ناوەڕاستدا", pages: "٤٥ - ٥٦", description: "هەڵمەتی ناپلیۆن بۆ سەر میسر و شام ١٧٩٨، ململانێی بەریتانیا و فەرەنسا و ڕووسیا لە ناوچەکەدا." },
      { id: "hist-ch4", title: "بەشی چوارەم: میرنشین و حکوومەتی کوردییەکان لە سەردەمی نوێدا", pages: "٥٧ - ٩٤", description: "میرنشینی ئەردەڵان، بابان (سلێمانی)، سۆران (میر محەمەد پاشای گەورەی ڕەواندز)، میرنشینی بۆتان (میر بەدرخان پاشا)." },
      { id: "hist-ch5", title: "بەشی پێنجەم: بزووتنەوەی چاکسازی عوسمانی (تەنزیمات)", pages: "٩٥ - ١٠٦", description: "مەرسوومی خەتی گوڵخانە ١٨٣٩، خەتی هومایۆن ١٨٥٦، ڕاگەیاندنی مەشرووتییەت و دەستووری عوسمانی ١٨٧٦." },
      { id: "hist-ch6", title: "بەشی شەشەم: ڕۆژنامەگەری کوردی و پارت و کۆمەڵە کوردییەکان", pages: "١٠٧ - ١٢٢", description: "دەرچوونی ڕۆژنامەی کوردستان ١٨٩٨ لە قاهیرە بە دەستی میقداد مەدحەت بەدرخان، کۆمەڵەی تەعالی و تەرەقی کورد، کۆمەڵەی هێڤی." },
      { id: "hist-ch7", title: "بەشی حەوتەم: کوردستان لە کات و دوای جەنگی جیهانی یەکەم", pages: "١٢٣ - ١٤٠", description: "پەیماننامەی نهێنی سایکس-پیکۆ ١٩١٦، پەیمانی سێڤر ١٩٢٠ و بەندەکانی ٦٢-٦٤، پەیمانی لۆزان ١٩٢٣ و دابەشکردنی کوردستان." },
      { id: "hist-ch8", title: "بەشی هەشتەم: ڕاپەڕین و شۆڕشەکانی کورد", pages: "١٤١ - ١٩٠", description: "شۆڕشی یەزدان شێر ١٨٥٥، شێخ عوبەیدوڵڵای نەهری ١٨٨٠، بزووتنەوەی شێخ مەحموودی حەفید، شۆڕشی شێخ سەعیدی پیران ١٩٢٥، ئاگری داغ ١٩٣٠، و بزووتنەوەی بارزان." },
      { id: "hist-ch9", title: "بەشی نۆیەم: ڕاپەڕین و شۆڕشەکانی عێراق و ڕۆڵی کورد", pages: "١٩١ - ٢٢٨", description: "شۆڕشی بیست ١٩٢٠، دامەزراندنی دەوڵەتی عێراق و مەلیک فەیسەڵ ١٩٢١، شۆڕشی ١٤ی تەممووزی ١٩٥٨ و بەشداریکردنی کورد." },
      { id: "hist-ch10", title: "بەشی دەیەم: بزووتنەوەی ئیستعماری نوێی ئەوروپی لە نیشتمانی عەرەب", pages: "٢٢٩ - ٢٦٤", description: "داگیرکردنی جەزائیر ١٨٣٠ و تونس و مەغریب، داگیرکردنی میسر لەلایەن بەریتانیاوە ١٨٨٢، و بەڵێننامەی بالفۆر ١٩١٧ لە فەلەستین." },
    ],
  },
  {
    id: "economy",
    title: "ئابووری",
    fullName: "ئابووری (پۆلی ١٢ی وێژەیی و بازرگانی)",
    coverImage: "/books/economics.png",
    subjectKey: "economy",
    stream: "literary",
    streamLabel: "وێژەیی",
    grade: "12",
    chaptersCount: 6,
    hasInteractiveViewer: true,
    colorTheme: "from-emerald-700/20 to-teal-950/40",
    description: "مەنهەجی فەرمی ئابووری (٢١٢ لاپەڕە): ٦ بەشی سەرەکی - داهاتی نەتەوەیی و بارگۆڕانی ئابووری، بازرگانی ناوخۆیی و دەرەکی، ڕامیارییە ئابوورییەکان، دواکەوتن و گەشەپێدان، دارایی گشتی و بودجەی دەوڵەت، و ڕێکخراوە ئابوورییە نێودەوڵەتییەکان (IMF، بانکی جیهانی، WTO، OPEC).",
    outline: [
      { id: "econ-ch1", title: "بەشی یەکەم: داهاتی نەتەوەیی و بارگۆڕانی ئابووری", pages: "٤ - ٤١", description: "داهاتی نەتەوەیی، پاداشتی بنەماکانی بەرهەمهێنان، داهاتی کەسی و بەردەست، و قۆناغەکانی خولگەی ئابووری." },
      { id: "econ-ch2", title: "بەشی دووەم: بازرگانی (ناوخۆیی و دەرەکی)", pages: "٤٢ - ٨٣", description: "پێناسەی بازرگانی، تیۆری سوودی ڕەهای ئادەم سمیس و سوودی بەراوردکاری دەیڤید ڕیکاردۆ، و تەرازووی پارەدان." },
      { id: "econ-ch3", title: "بەشی سێیەم: ڕامیارییە ئابوورییەکان", pages: "٨٤ - ٩٣", description: "ئامانجەکانی ڕامیاری ئابووری، ڕێگری لە بێکاری و هەڵاوسان، و ڕامیاری دارایی بەرامبەر نەختینەیی." },
      { id: "econ-ch4", title: "بەشی چوارەم: دواکەوتن و پەرەپێدانی ئابووری و پلاندانان", pages: "٩٤ - ١٢٥", description: "خەسڵەتەکانی دواکەوتوویی ئابووری (تۆدارۆ و نێرکس)، بازنەی بەتاڵی هەژاری، و قۆناغەکانی پلاندانان." },
      { id: "econ-ch5", title: "بەشی پێنجەم: دارایی گشتی", pages: "١٢٦ - ١٧٨", description: "خەرجییە گشتییەکان، داهاتی گشتی، باجی ڕاستەوخۆ و ناڕاستەوخۆ، ڕسوومات، و بودجەی گشتی دەوڵەت." },
      { id: "econ-ch6", title: "بەشی شەشەم: ڕێکخراوە ئابوورییە نێودەوڵەتییەکان", pages: "١٧٩ - ٢٠٩", description: "سندوقی نەختی نێودەوڵەتی (IMF)، بانکی جیهانی (World Bank)، ڕێکخراوی بازرگانی جیهانی (WTO)، و ئۆپیک (OPEC)." },
    ],
  },
  {
    id: "geography",
    title: "جوگرافیا",
    fullName: "جوگرافیای ئابووری (پۆلی ١٢ی وێژەیی)",
    coverImage: "/books/geography.png",
    subjectKey: "geography",
    stream: "literary",
    streamLabel: "وێژەیی",
    grade: "12",
    chaptersCount: 7,
    hasInteractiveViewer: true,
    colorTheme: "from-teal-800/20 to-emerald-950/40",
    description: "مەنهەجی فەرمی جوگرافیای ئابووری (٢٤٤ لاپەڕە): ٧ بەشی سەرەکی - چەمکی جوگرافیای ئابووری، کشتوکاڵ، سامانی ئاژەڵ، سەرچاوەکانی وزە (نەوت، گاز، خەڵووز)، کانزا و کانزاکاری، پیشەسازی و مەرجەکانی، و بازرگانی و گواستنەوە.",
    outline: [
      { id: "geog-ch1", title: "بەشی یەکەم: جوگرافیای ئابووری", pages: "٣ - ٣٣", description: "چەمک و پێناسەی جوگرافیای ئابووری، پەیوەندی بە زانستەکانی تر، قۆناغەکانی پەرەسەندنی چالاکی ئابووری، هۆکارە سروشتی و مرۆییەکان." },
      { id: "geog-ch2", title: "بەشی دووەم: کشتوکاڵ", pages: "٣٤ - ٨٠", description: "چەمکی کشتوکاڵ، خاسیەتە کۆمەڵایەتییەکان و خاوەندارێتی کێڵگە، دەغڵودان (گەنم، جۆ، برنج، گەنمەشامی)، بەروبوومی پیشەسازی و ڕووەکە ڕیشاڵییەکان." },
      { id: "geog-ch3", title: "بەشی سێیەم: سامانی ئاژەڵ", pages: "٨١ - ٩٩", description: "گرنگی ئابووری بەخێوکردنی ئاژەڵ، مەڕ و ماڵات، مانگا، لەوەڕگە سروشتییەکان، بەخێوکردنی پەلەوەر و سامانی ماسی." },
      { id: "geog-ch4", title: "بەشی چوارەم: سەرچاوەکانی وزە", pages: "١٠٠ - ١٣٩", description: "خەڵووزی بەردین، نەوت و کێڵگە نەوتییەکان و بۆرییەکان، گازی سروشتی، وزەی کارۆئاوی، و وزەی ئەتۆمی و نوێبووەوە." },
      { id: "geog-ch5", title: "بەشی پێنجەم: کانزا و کانزاکاری", pages: "١٤٠ - ١٧٤", description: "کانزا ئاسنینەکان (ئاسن، مەنگەنیز)، کانزا نائاسنینەکان (مس، ئەلەمنیۆم، قورقوشم، زینک)، و کانزا گرانبەهاکان (زێڕ و زیو)." },
      { id: "geog-ch6", title: "بەشی شەشەم: پیشەسازی", pages: "١٧٥ - ٢٢٤", description: "مەرجەکانی نیشتەجێبوونی پیشەسازی (ماددەی خاو، وزە، بازاڕ، دەستی کار، گواستنەوە)، ئاسن و پۆڵا، کیمیایی، پترۆکیمیایی، و ڕستن و چنین." },
      { id: "geog-ch7", title: "بەشی حەوتەم: بازرگانی و گواستنەوە", pages: "٢٢٥ - ٢٤٢", description: "گواستنەوەی وشکانی، ئاوی، ئاسمانی، کەناڵی سوێس و پەنەما، بازرگانی نێودەوڵەتی، و تەرازووی بازرگانی." },
    ],
  },
  {
    id: "math_lit",
    title: "بیرکاری",
    fullName: "بیرکاری بۆ هەمووان (پۆلی ١٢ی وێژەیی)",
    coverImage: "/books/math_lit.png",
    subjectKey: "math",
    stream: "literary",
    streamLabel: "وێژەیی",
    grade: "12",
    chaptersCount: 5,
    hasInteractiveViewer: true,
    colorTheme: "from-blue-700/20 to-indigo-950/40",
    description: "مەنهەجی فەرمی بیرکاری وێژەیی (١١١ لاپەڕە): ٥ بەشی سەرەکی - ئامار و ئەگەر، جەبر و پڕۆگرامسازی هێڵی، نەخشەکان، یەکبەدوایەکەکان، و جیاکاری و تەواوکاری لە کەرتی ئابووریدا.",
    outline: [
      { id: "ml-ch1", title: "بەشی یەکەم: ئامار و ئەگەر", pages: "١ - ٢٦", description: "هێڵکاری سندوق و سمێڵەکان (چوارەکەکان و بەها دورەپەرێزەکان)، ئەگەری مەرجدار و سەرجەم، و مۆدێلی هێڵی." },
      { id: "ml-ch2", title: "بەشی دووەم: جەبر", pages: "٢٧ - ٥٠", description: "شیکارکردنی سیستەمی هاوکێشەی هێڵی بە ٣ نەزانراو، پڕۆگرامسازی هێڵی، لێکدانی ماتریسەکان، و پێچەوانەی ماتریس." },
      { id: "ml-ch3", title: "بەشی سێیەم: نەخشەکان", pages: "٥١ - ٧٦", description: "نەخشە فرەجاکان، نەخشەکانی گۆڕان (ڕاستەوخۆ، پێچەوانە، هاوبەش)، نەخشە توانییەکان (گەشە و پووکانەوە)، و نەخشە لۆگاریتمییەکان." },
      { id: "ml-ch4", title: "بەشی چوارەم: یەکبەدوایەکەکان", pages: "٧٧ - ٩٠", description: "یەکبەدوایەکی ژمێرەیی (جیاوازی هاوبەش d و کۆکردنەوەی Sn)، و یەکبەدوایەکی ئەندازەیی (بنچینەی هاوبەش r و کۆی بێکۆتا)." },
      { id: "ml-ch5", title: "بەشی پێنجەم: جیاکاری و تەواوکاری لە ئابووریدا", pages: "٩١ - ١١١", description: "داتاشراو، تێچووی پەراوێزی MC، داهاتی پەراوێزی MR، قازانجی پەراوێزی MP، و بنەماکانی تەواوکاری لە ئابووریدا." },
    ],
  },
];

export const GRADE_9_TEXTBOOKS: TextbookCardItem[] = [
  {
    id: "g9_math",
    title: "بیرکاری",
    fullName: "زانست بۆ هەمووان - بیرکاری (پۆلی ٩ی بنەڕەتی)",
    coverImage: "/books/g9_math.png",
    subjectKey: "math",
    stream: "both",
    streamLabel: "بنەڕەتی (گشتی)",
    grade: "9",
    chaptersCount: 9,
    colorTheme: "from-blue-900/20 to-teal-950/40",
    description: "مەنهەجی فەرمی بیرکاری پۆلی ٩ی بنەڕەتی (٢٩٢ لاپەڕە): ٩ بەشی سەرەکی - ژمارە ڕاستەقینەکان و نەخشەکان، هاوکێشە و نایەکسانییە هێڵییەکان، لێژی و نەخشەی هێڵی، کۆمەڵە هاوکێشەکان، توانا و ڕەگەکان، فرەجاکان و هۆکارەکان، نەخشە و هاوکێشەی پلە دوو، ئەندازە و ڕووبەر، و ئامار و ئەگەر.",
    outline: [
      { id: 1, title: "بەشی ١: جەبر، نەخشەکان و ژمارە ڕاستەقینەکان", pages: "٧ - ٣٦", description: "کۆمەڵەی ژمارە ڕاستەقینەکان، ئۆپەراسیۆنە جەبرییەکان، پێناسەی نەخشە و دۆزینەوەی مەودا و بوار." },
      { id: 2, title: "بەشی ٢: شیکارکردنی هاوکێشە و نایەکسانییە هێڵییەکان", pages: "٣٧ - ٦٨", description: "هاوکێشەی یەک گۆڕاو، بەهای ڕووت، نایەکسانییە هێڵییەکان و هێڵکاری لەسەر هێڵی ژمارەکان." },
      { id: 3, title: "بەشی ٣: نەخشە هێڵییەکان و لێژی", pages: "٦٩ - ١٠٢", description: "دۆزینەوەی لێژی ڕاستەهێڵ، شێوازی لێژ-بڕگەیی، هاوکێشەی هێڵی لە ڕێگەی دوو خاڵەوە." },
      { id: 4, title: "بەشی ٤: کۆمەڵە هاوکێشە و نایەکسانییە هێڵییەکان", pages: "١٠٣ - ١٣٤", description: "شیکارکردنی سیستەمی دوو هاوکێشە بە ڕێگەی گرافیک، قەرەبووکردنەوە و سڕینەوە." },
      { id: 5, title: "بەشی ٥: توانا و نەخشە توانییەکان", pages: "١٣٥ - ١٦٦", description: "یاساکانی توانی ئەرێنی و نەرێنی، زانستی نوسین، نەخشەی گەشەکردن و داڕمانی توانی." },
      { id: 6, title: "بەشی ٦: فرەجاکان و شیکردنەوە بۆ هۆکارەکان", pages: "١٦٧ - ٢٠٢", description: "کۆکردنەوە و لێکدانی فرەجاکان، دەرهێنانی گەورەترین هۆکاری هاوبەش، و دووجای تەواو." },
      { id: 7, title: "بەشی ٧: نەخشە پلە دووەکان و هاوکێشەکانیان", pages: "٢٠٣ - ٢٣٦", description: "گرافی نەخشەی پلە دوو، بڕگە، دۆزینەوەی ڕەگەکان بە هۆکارەکان و یاسای گشتی." },
      { id: 8, title: "بەشی ٨: ئەندازە، ڕووبەر، و قەبارە", pages: "٢٣٧ - ٢٦٤", description: "تیۆرمی پیتاگۆرس، ڕووبەری شێوە لێکدراوەکان، قەبارە و ڕووبەری ڕووی قوچەک و گۆ." },
      { id: 9, title: "بەشی ٩: ئامار و ڕێژەی ئەگەر", pages: "٢٦٥ - ٢٩٢", description: "پێوەرەکانی چەقین (ناوەند، ناوەڕاست، باو)، هێڵکاری سندووقی، و ئەگەری سادە و لێکدراو." },
    ],
  },
  {
    id: "g9_science",
    title: "زانست",
    fullName: "زانست بۆ هەمووان (پۆلی ٩ی بنەڕەتی - فیزیا، کیمیا، زیندەزانی)",
    coverImage: "/books/g9_science.png",
    subjectKey: "chemistry",
    stream: "both",
    streamLabel: "بنەڕەتی (گشتی)",
    grade: "9",
    chaptersCount: 7,
    colorTheme: "from-teal-900/20 to-emerald-950/40",
    description: "مەنهەجی فەرمی زانستی گشتی پۆلی ٩ی بنەڕەتی (٣٤٠ لاپەڕە): ٧ یەکەی سەرەکی بەندکراو لە بوارەکانی فیزیا، کیمیا، و زیندەزانی - بونیاتی گەردیلە، خشتەی خولی، کارلێکە کیمیاییەکان، جووڵە و هێز، وزە و شەپۆل، خانە و بۆماوەزانی، و زانستی زەوی.",
    outline: [
      { id: 1, title: "یەکەی ١: بونیاتی ماددە و خشتەی خولی (کیمیا)", pages: "٧ - ٥٢", description: "پێکهاتەی گەردیلە (پرۆتۆن، ئەلیکترۆن، نیوترۆن)، ژمارەی ئەتۆمی، و ڕێکخستنی خشتەی خولی." },
      { id: 2, title: "یەکەی ٢: بەستەرە کیمیاییەکان و ترش و تفت (کیمیا)", pages: "٥٣ - ٩٨", description: "بەستەری ئایۆنی و هاوبەش، کارلێکە کیمیاییەکان، پێوەری pH، و ترش و تفتە باوەکان." },
      { id: 3, title: "یەکەی ٣: جووڵە، خێرایی و یاساکانی نیوتن (فیزیا)", pages: "٩٩ - ١٤٦", description: "خێرایی تێکڕا و تاودان، هێزی کێشکردن، بارنەگۆڕی، و یاساکانی سێیەمی نیوتن بۆ جووڵە." },
      { id: 4, title: "یەکەی ٤: کار، وزە و ئامێرە سادەکان (فیزیا)", pages: "١٤٧ - ١٩٢", description: "کاری میکانیکی، جۆرەکانی وزە، پاراستنی وزە، و سوودی میکانیکی ئامێرە سادەکان." },
      { id: 5, title: "یەکەی ٥: شەپۆلەکان، دەنگ و ڕووناکی (فیزیا)", pages: "١٩٣ - ٢٤٠", description: "تایبەتمەندی شەپۆلەکان، خێرایی دەنگ و زرنگانەوە، شکان و پەرچدانەوەی ڕووناکی لە ئاوێنە و هاوێنەدا." },
      { id: 6, title: "یەکەی ٦: خانە، دابەشبوون و بۆماوەزانی (زیندەزانی)", pages: "٢٤١ - ٢٩٠", description: "پێکهاتەی خانەی ڕووەکی و گیانەوەری، قۆناغەکانی میتۆسیس، بنەماکانی DNA و سیفەتی بۆماوەیی." },
      { id: 7, title: "یەکەی ٧: زەویناسی، کەشوهەوا و ژینگە (زانستی زەوی)", pages: "٢٩١ - ٣٤٠", description: "چینەکانی زەوی، پلێتە تەکتۆنییەکان، بوومەلەرزە و گڕکانەکان، و سووڕی ئاو لە سروشتدا." },
    ],
  },
  {
    id: "g9_english_activity",
    title: "ئینگلیزی (چالاکی)",
    fullName: "Sunrise 9 - Activity Book (کتێبی ڕاهێنان و چالاکی)",
    coverImage: "/books/g9_english_activity.png",
    subjectKey: "english",
    stream: "both",
    streamLabel: "بنەڕەتی (گشتی)",
    grade: "9",
    chaptersCount: 8,
    colorTheme: "from-sky-900/20 to-blue-950/40",
    description: "مەنهەجی فەرمی چالاکییەکانی ئینگلیزی پۆلی ٩ی بنەڕەتی (Sunrise 9 Activity Book): ٨ یەکەی پڕاکتیزەکردنی ڕێزمان، وشەسازی، وتارنووسین، خوێندنەوەی چیرۆک، و ڕاهێنانی ئەزموونی گشتی نیشتمانی.",
    outline: [
      { id: 1, title: "Unit 1: Welcoming the Future (Grammar & Skills)", pages: "4 - 13", description: "Present and Past habits, Used to, Personality descriptions, Paragraph composition." },
      { id: 2, title: "Unit 2: World Discoveries & History", pages: "14 - 23", description: "Past Continuous with Past Simple, Time prepositions, Writing narrative stories." },
      { id: 3, title: "Unit 3: Protecting the Natural World", pages: "24 - 33", description: "Zero and First Conditional, Wildlife and climate vocabulary, Formal suggestions." },
      { id: 4, title: "Unit 4: Revision 1 (Units 1-3 Review)", pages: "34 - 39", description: "Integrated grammar tests, vocabulary puzzles, reading comprehension strategies." },
      { id: 5, title: "Unit 5: Inventions, Media & Technology", pages: "40 - 49", description: "Passive Voice in Present and Past, Tech collocations, Opinion writing." },
      { id: 6, title: "Unit 6: Healthy Life & Sports Adventures", pages: "50 - 59", description: "Modal verbs of necessity and advice, Diet and lifestyle dialogues, Informal letters." },
      { id: 7, title: "Unit 7: Travel, Cities & Famous Landmarks", pages: "60 - 69", description: "Present Perfect with ever/never, Travel vocabulary, Writing travel brochures." },
      { id: 8, title: "Unit 8: Revision 2 (Units 5-7 Review & Exam Prep)", pages: "70 - 79", description: "Consolidated national exam practice, final revision tests, and vocabulary index." },
    ],
  },
  {
    id: "g9_arabic_1",
    title: "عەرەبی (بەشی ١)",
    fullName: "اللغة العربية للصف التاسع الأساسي - الجزء الأول",
    coverImage: "/books/g9_arabic_1.png",
    subjectKey: "arabic",
    stream: "both",
    streamLabel: "بنەڕەتی (گشتی)",
    grade: "9",
    chaptersCount: 4,
    colorTheme: "from-amber-900/20 to-orange-950/40",
    description: "مەنهەجی فەرمی زمانی عەرەبی پۆلی ٩ی بنەڕەتی (بەشی یەکەم - ١١٨ لاپەڕە): ٤ یەکەی سەرەکی - النصوص القرائية، القواعد النحوية (المبتدأ والخبر، كان وأخواتها، إن وأخواتها)، الإملاء، والتعبير.",
    outline: [
      { id: 1, title: "الوحدة الأولى: النصوص القرائية وقواعد الجملة الاسمية", pages: "٥ - ٣٤", description: "المبتدأ والخبر وأنواعهما، مطابقة الخبر للمبتدأ، ونصوص أدبية وتربوية مختارة." },
      { id: 2, title: "الوحدة الثانية: كان وأخواتها وتطبيقاتها الإعرابية", pages: "٣٥ - ٦٢", description: "الأفعال الناسخة (كان، أصبح، صار، ليس...)، عملها، وإعراب اسمها وخبرها." },
      { id: 3, title: "الوحدة الثالثة: إن وأخواتها والحروف الناسخة", pages: "٦٣ - ٩٠", description: "الحروف الناسخة (إنّ، أنّ، كأنّ، ليت، لعلّ)، معانيها، وإعراب الجملة معها." },
      { id: 4, title: "الوحدة الرابعة: الإملاء والتعبير الإنشائي", pages: "٩١ - ١١٨", description: "الهمزة المتوسطة والمتطرفة، علامات الترقيم، وکتابة موضوع تعبيري منظم." },
    ],
  },
  {
    id: "g9_arabic_2",
    title: "عەرەبی (بەشی ٢)",
    fullName: "اللغة العربية للصف التاسع الأساسي - الجزء الثاني",
    coverImage: "/books/g9_arabic_2.png",
    subjectKey: "arabic",
    stream: "both",
    streamLabel: "بنەڕەتی (گشتی)",
    grade: "9",
    chaptersCount: 4,
    colorTheme: "from-orange-900/20 to-amber-950/40",
    description: "مەنهەجی فەرمی زمانی عەرەبی پۆلی ٩ی بنەڕەتی (بەشی دووەم - ١١٠ لاپەڕە): ٤ یەکەی سەرەکی - الجملة الفعلية (الفاعل، المفعول به، المفعول المطلق)، نصوص العصر الحديث، وقواعد الكتابة الأدبية.",
    outline: [
      { id: 1, title: "الوحدة الأولى: الجملة الفعلية وأحكام الفاعل", pages: "٥ - ٣٠", description: "الفاعل الظاهر والمستتر، علامات رفع الفاعل، ونصوص قرائية من التراث العربي." },
      { id: 2, title: "الوحدة الثانية: المفاعيل - المفعول به والمفعول فيه", pages: "٣١ - ٥٨", description: "المفعول به وعلامات نصبه، ظرف الزمان وظرف المكان، وتطبيقات نحوية." },
      { id: 3, title: "الوحدة الثالثة: المفعول المطلق والحال", pages: "٥٩ - ٨٤", description: "المفعول المطلق لتوكيد الفعل أو بيان نوعه، إعراب الحال، وتمارين تطبيقية." },
      { id: 4, title: "الوحدة الرابعة: المراجعة العامة والامتحان الوزاري", pages: "٨٥ - ١١٠", description: "تدريبات نحوية شاملة على الجزأين الأول والثاني، ونماذج امتحانات وزارية محلولة." },
    ],
  },
  {
    id: "g9_social_values",
    title: "کارامەیی و بەهاکان",
    fullName: "پرۆگرامی کارامەیی و بەها کۆمەڵایەتییەکان (پۆلی ٩ی بنەڕەتی)",
    coverImage: "/books/g9_social_values.png",
    subjectKey: "kurdish",
    stream: "both",
    streamLabel: "بنەڕەتی (گشتی)",
    grade: "9",
    chaptersCount: 4,
    colorTheme: "from-purple-900/20 to-indigo-950/40",
    description: "مەنهەجی فەرمی کارامەیی و بەها کۆمەڵایەتییەکان (٩٢ لاپەڕە): ٤ بەشی سەرەکی - خۆناسین و بڕیاردان، پەیوەندییە مرۆییەکان و گفتوگۆ، بەها کۆمەڵایەتی و نیشتمانییەکان، و پاراستنی ژینگە و تەندروستی دەروونی.",
    outline: [
      { id: 1, title: "بەشی ١: خۆناسین و پەرەپێدانی کەسایەتی", pages: "٧ - ٢٨", description: "خاڵە بەهێز و لاوازەکانی خود، متمانەبەخۆبوون، بەڕێوەبردنی کات و دانانی ئامانجی ژیان." },
      { id: 2, title: "بەشی ٢: کارامەییەکانی پەیوەندی و چارەسەری کێشەکان", pages: "٢٩ - ٥٠", description: "هونەری گوێگرتن، دیالۆگی بنیاتنەر، کارکردنی بەکۆمەڵ و چارەسەری ئاشتییانەی ناکۆکییەکان." },
      { id: 3, title: "بەشی ٣: هاوڵاتیبوون، لێبوردەیی و بەها مرۆییەکان", pages: "٥١ - ٧٠", description: "ڕێزگرتن لە جیاوازییەکان، دادپەروەری کۆمەڵایەتی، بەرپرسیارێتی بەرامبەر کۆمەڵگە و نیشتمان." },
      { id: 4, title: "بەشی ٤: تەندروستی دەروونی و پاراستنی ژینگە", pages: "٧١ - ٩٢", description: "کۆنتڕۆڵکردنی سترێس و توڕەیی، بەکارهێنانی تەندروستی تەکنەلۆژیا، و پاراستنی سەرچاوەکانی ژینگە." },
    ],
  },
];

export const GRADE_10_TEXTBOOKS: TextbookCardItem[] = [
  {
    id: "g10_physics",
    title: "فیزیا",
    fullName: "زانست بۆ هەمووان - فیزیا (پۆلی ١٠ی زانستی)",
    coverImage: "/books/g10_physics.png",
    subjectKey: "physics",
    stream: "scientific",
    streamLabel: "زانستی",
    grade: "10",
    chaptersCount: 6,
    colorTheme: "from-blue-900/20 to-cyan-950/40",
    description: "مەنهەجی فەرمی فیزیای پۆلی ١٠ی زانستی (٢٢٢ لاپەڕە): ٦ بەندی سەرەکی - جووڵە لەسەر ڕێڕەوی ڕاست، ئاڕاستەبڕەکان و هێز، یاساکانی جووڵەی نیوتن، کار و وزە و توان، میکانیکی شلەکان، و گەرمی.",
    outline: [
      { id: 1, title: "بەندی ١: جووڵە لەسەر ڕێڕەوی ڕاست", pages: "٧ - ٤٢", description: "شوێنگۆڕکێ و ماوە، خێرایی تێکڕا و خێرایی کاتی، تاودانی نەگۆڕ، و کەوتنی سەربەست لەژێر کێشکردندا." },
      { id: 2, title: "بەندی ٢: ئاڕاستەبڕەکان و هێزەکان", pages: "٤٣ - ٨٠", description: "بڕە ئاڕاستەدارەکان و نەئاڕاستەدارەکان، کۆکردنەوە و لێدەرکردنی ئاڕاستەبڕەکان بە گرافیک و سێگۆشەزانی." },
      { id: 3, title: "بەندی ٣: یاساکانی نیوتن بۆ جووڵە", pages: "٨١ - ١٢٠", description: "یاسای یەکەم (بارنەگۆڕی)، یاسای دووەم (F=ma)، یاسای سێیەم (کردار و پەرچەکردار)، و هێزی لێکخشان." },
      { id: 4, title: "بەندی ٤: کار و وزە و توان", pages: "١٢١ - ١٥٦", description: "کاری میکانیکی، وزەی جووڵە، وزەی شاراوەی کێشکردن، یاسای پاراستنی وزە، و تێکڕای توان." },
      { id: 5, title: "بەندی ٥: میکانیکی شلەکان و پەستان", pages: "١٥٧ - ١٩٠", description: "چڕی، پەستانی هایدرۆلیکی، یاسای پاسکاڵ، و بنەمای ئەرخەمیدس بۆ هێزی سەرئاوکەوتن." },
      { id: 6, title: "بەندی ٦: گەرمی و پلەی گەرمی", pages: "١٩١ - ٢٢٢", description: "هاوسەنگی گەرمی، پێوەرەکانی سلیزی و کێلڤن، گەرمیی دیاریکراو، و گۆڕانی دۆخی ماددەکان." },
    ],
  },
  {
    id: "g10_biology",
    title: "زیندەزانی",
    fullName: "زانست بۆ هەمووان - زیندەزانی (پۆلی ١٠ی زانستی)",
    coverImage: "/books/g10_biology.png",
    subjectKey: "biology",
    stream: "scientific",
    streamLabel: "زانستی",
    grade: "10",
    chaptersCount: 6,
    colorTheme: "from-emerald-900/20 to-teal-950/40",
    description: "مەنهەجی فەرمی زیندەزانی پۆلی ١٠ی زانستی (١٨٢ لاپەڕە): ٦ بەندی سەرەکی - ژینگە و جۆراوجۆری زیندەیی، کیمیای ژیان، پەردەی خانە و گواستنەوە، ڕۆشنەپێکهاتن و هەناسە، دابەشبوونی خانە، و بنەماکانی بۆماوەزانی.",
    outline: [
      { id: 1, title: "بەندی ١: ژینگە و کۆمەڵگە زیندەییەکان", pages: "٧ - ٣٦", description: "پێکهاتەکانی کۆئەندامی ژینگە، زنجیرە و تۆڕی خۆراک، هەرەمی وزە، و سووڕی ماددەکان لە سروشتدا." },
      { id: 2, title: "بەندی ٢: کیمیای ژیان و گەردە ئەندامییەکان", pages: "٣٧ - ٦٦", description: "گرنگی ئاو، کاربۆهیدراتەکان، چەورییەکان، پڕۆتینەکان و ئەنزیمەکان، و ترشە ناوەکییەکان (DNA و RNA)." },
      { id: 3, title: "بەندی ٣: پەردەی خانە و گواستنەوەی ماددەکان", pages: "٦٧ - ٩٦", description: "پێکهاتەی فۆسفۆلیپید، بڵاوبوونەوەی سادە و ئاسانکراو، ئۆسمۆز، و گواستنەوەی چالاک بە گەردی ATP." },
      { id: 4, title: "بەندی ٤: ڕۆشنەپێکهاتن و هەناسەدانی خانەیی", pages: "٩٧ - ١٢٤", description: "ڕۆڵ و پێکهاتەی کلۆرۆپلاست، کارلێکەکانی ڕووناکی و تاریکی، گلایکۆلایسس و دەرهێنانی وزە." },
      { id: 5, title: "بەندی ٥: دابەشبوونی خانە و سووڕی خانەیی", pages: "١٢٥ - ١٥٤", description: "قۆناغەکانی میتۆسیس بۆ گەشەکردن و چاکبوونەوە، دابەشبوونی کەمکەرە (مایۆسیس) بۆ دروستبوونی تۆو و هێلکە." },
      { id: 6, title: "بەندی ٦: بنەما سەرەتاییەکانی بۆماوەزانی", pages: "١٥٥ - ١٨٢", description: "تاقیکردنەوەکانی مەندەل لەسەر پۆکە، سیفەتی زاڵ و بەزیو، چوارگۆشەی پۆنێت، و ئەگەری بۆماوەیی." },
    ],
  },
  {
    id: "g10_english",
    title: "ئینگلیزی",
    fullName: "Sunrise 10 - Student's & Activity Book (پۆلی ١٠)",
    coverImage: "/books/g10_english.png",
    subjectKey: "english",
    stream: "both",
    streamLabel: "زانستی و گشتی",
    grade: "10",
    chaptersCount: 6,
    colorTheme: "from-sky-900/20 to-indigo-950/40",
    description: "مەنهەجی فەرمی زمانی ئینگلیزی پۆلی ١٠ (Sunrise 10): ٦ یەکەی سەرەکی - ڕێزمانی کاتەکان، دەنگی دیار و نادیار، ڕستەی مەرجی، وتاری گێڕانەوە، وشەسازی ژینگە و تەندروستی، و خوێندنەوەی دەق.",
    outline: [
      { id: 1, title: "Unit 1: People, Identity & Daily Life", pages: "4 - 21", description: "Present Simple vs Continuous, Past Simple, Personality adjectives, Writing personal profiles." },
      { id: 2, title: "Unit 2: The Living Planet & Environment", pages: "22 - 39", description: "Present & Past Passive forms, Ecology vocabulary, Climate change, Writing an informative article." },
      { id: 3, title: "Unit 3: Science, Discoveries & Modern Tech", pages: "40 - 57", description: "Defining Relative Clauses, Zero & First Conditionals, Inventions, Expressing opinions in essays." },
      { id: 4, title: "Unit 4: Mass Media & Global Communication", pages: "58 - 75", description: "Reported statements and questions, Media collocations, Conducting interviews and writing news reports." },
      { id: 5, title: "Unit 5: Health, Fitness & Balanced Living", pages: "76 - 93", description: "Modal verbs of obligation (must, should, have to), Healthy nutrition, Giving formal advice." },
      { id: 6, title: "Unit 6: Culture, Heritage & Creative Arts", pages: "94 - 111", description: "Literature excerpts, Second Conditional, Descriptive vocabulary, End of year exam practice." },
    ],
  },
];

export const GRADE_11_TEXTBOOKS: TextbookCardItem[] = [
  {
    id: "g11_math",
    title: "بیرکاری",
    fullName: "زانست بۆ هەمووان - بیرکاری (پۆلی ١١ی زانستی)",
    coverImage: "/books/g11_math.png",
    subjectKey: "math",
    stream: "scientific",
    streamLabel: "زانستی",
    grade: "11",
    chaptersCount: 8,
    colorTheme: "from-emerald-900/20 to-teal-950/40",
    description: "مەنهەجی فەرمی بیرکاری پۆلی ١١ی زانستی (٤٢٠ لاپەڕە): ٨ بەشی سەرەکی - ژمارە ئاوێتەکان، نەخشە فرەجاکان و نەخشە ڕێژەییەکان، ڕێژە سێگۆشەییەکان، نەخشە توانی و لۆگاریتمییەکان، یەکبەدوایەکەکان، ئەگەر، بڕگە قوچەکییەکان، و ئامار.",
    outline: [
      { id: 1, title: "بەشی ١: ژمارە ئاوێتەکان و نەخشە پلە دووەکان", pages: "٧ - ٥٤", description: "پێناسەی یەکەی خەیاڵی i، کۆکردنەوە و لێکدانی ژمارە ئاوێتەکان، شیکارکردنی هاوکێشەی پلە دوو بە یاسای گشتی." },
      { id: 2, title: "بەشی ٢: نەخشە فرەجاکان و نەخشە ڕێژەییەکان", pages: "٥٥ - ١٠٢", description: "دابەشکردنی فرەجاکان، تیۆری ماوە و بەشکار، نەخشە ڕێژەییەکان و هێڵە لێککەوتووەکان." },
      { id: 3, title: "بەشی ٣: ڕێژە و هاوکێشە سێگۆشەییەکان", pages: "١٠٣ - ١٥٨", description: "بازنەی یەکە، نەخشەکانی ساین و کۆساین، هاوئاستە سێگۆشەییە بنچینەییەکان و یاسای ساینەکان." },
      { id: 4, title: "بەشی ٤: نەخشە توانییەکان و لۆگاریتمەکان", pages: "١٥٩ - ٢١٠", description: "گەشەکردن و داڕمانی توانی، بنەماکانی لۆگاریتم، هاوکێشە لۆگاریتمییەکان و شیکارکردنیان." },
      { id: 5, title: "بەشی ٥: یەکبەدوایەکەکان و زنجیرەکان", pages: "٢١١ - ٢٦٢", description: "یەکبەدوایەکەی ژمێرەیی و ئەندازەیی، کۆکردنەوەی زنجیرەی کۆتادار و ناکۆتا." },
      { id: 6, title: "بەشی ٦: ڕێژەی ئەگەری و شیکاری پێکهاتەیی", pages: "٢٦٣ - ٣١٤", description: "یاسای سەرەکی ژماردن، گۆڕین و تێکەڵکردن، ئەگەری مەرجدار و ڕووداوە سەربەخۆکان." },
      { id: 7, title: "بەشی ٧: ئەندازەی شیکاری و بڕگە قوچەکییەکان", pages: "٣١٥ - ٣٦٨", description: "بڕگەی هاوتا (Parabola)، بڕگەی ناتەواو (Ellipse)، و بڕگەی زیاد (Hyperbola)." },
      { id: 8, title: "بەشی ٨: ئامار و لادانی پێوانەیی", pages: "٣٦٩ - ٤١٨", description: "پێوەرەکانی چەقین و لادانی پێوانەیی، بڵاوبوونەوەی ئاسایی و پەیوەندی هێڵی." },
    ],
  },
  {
    id: "g11_physics",
    title: "فیزیا",
    fullName: "زانست بۆ هەمووان - فیزیا (پۆلی ١١ی زانستی)",
    coverImage: "/books/g11_physics.png",
    subjectKey: "physics",
    stream: "scientific",
    streamLabel: "زانستی",
    grade: "11",
    chaptersCount: 10,
    colorTheme: "from-blue-900/20 to-cyan-950/40",
    description: "مەنهەجی فەرمی فیزیای پۆلی ١١ی زانستی (٣١٦ لاپەڕە): ١٠ بەندی سەرەکی - پێوانەکردن، جووڵە لە یەک و دوو ڕەهەنددا، هێز و یاساکانی نیوتن، کار و وزە، تەوژمی هێڵی و بەیەکدادان، جووڵەی خولاوەیی، میکانیکی شلەکان، گەرمی، و شەپۆل.",
    outline: [
      { id: 1, title: "بەندی ١: پێوانەکردن و بیردۆزی ئاڕاستەبڕەکان", pages: "٧ - ٣٤", description: "سیستەمی نێودەوڵەتی یەکەکان SI، شیکردنەوەی ئاڕاستەبڕەکان بە ڕێگەی پێکهاتەکان." },
      { id: 2, title: "بەندی ٢: جووڵە لە یەک ڕەهەنددا", pages: "٣٥ - ٦٤", description: "تێکڕای خێرایی، خێرایی کاتی، تاودانی نەگۆڕ، و کەوتنی ئازاد لەژێر کاریگەری کێشکردندا." },
      { id: 3, title: "بەندی ٣: جووڵە لە دوو ڕەهەنددا و فڕێدراوەکان", pages: "٦٥ - ٩٦", description: "جووڵەی فڕێدراوەکان لەژێر گۆشەی دیاریکراو، مەودای ئاسۆیی و بەرزترین خاڵی فڕین." },
      { id: 4, title: "بەندی ٤: هێز و یاساکانی جووڵەی نیوتن", pages: "٩٧ - ١٢٨", description: "یاسای یەکەم و دووەم و سێیەمی نیوتن، هێزی لێکخشاندن (وەستاو و جووڵاو) و هاوسەنگی." },
      { id: 5, title: "بەندی ٥: کار، توانا و وزە", pages: "١٢٩ - ١٦٠", description: "پێناسەی کار بەپێی فیزیا، وزەی جووڵە و وزەی شاراوە، یاسای پاراستنی وزەی میکانیکی." },
      { id: 6, title: "بەندی ٦: تەوژمی هێڵی و بەیەکدادان", pages: "١٦١ - ١٩٢", description: "تەوژمی هێڵی (Linear Momentum)، هاندەر، یاسای پاراستنی تەوژم، و بەیەکدادانی تەواو لاستیکی و نالاستیکی." },
      { id: 7, title: "بەندی ٧: جووڵەی خولاوەیی و هێزی چەقڕاکێش", pages: "١٩٣ - ٢٢٤", description: "خێرایی گۆشەیی، تاودانی چەقڕاکێش، و هێزی ناوەندڕاکێش لە بازنەی ئاسۆیی و ستوونیدا." },
      { id: 8, title: "بەندی ٨: میکانیکی شلەکان و پەستان", pages: "٢٢٥ - ٢٥٦", description: "چڕی، پەستانی هایدرۆستاتیکی، بنەمای پاسکاڵ، هێزی سەرئاوکەوتن و بنەمای ئەرخەمیدس." },
      { id: 9, title: "بەندی ٩: گەرمی و پلەی گەرمی", pages: "٢٥٧ - ٢٨٦", description: "پێوەرەکانی پلەی گەرمی، گەرمی دیاریکراو، یاساکانی گەرمادیارینامە و گواستنەوەی گەرمی." },
      { id: 10, title: "بەندی ١٠: لەرزین، شەپۆلەکان و دەنگ", pages: "٢٨٧ - ٣١٦", description: "جووڵەی ئاوازی سادە، تایبەتمەندی شەپۆلە پان و درێژەکان، لەرەلەر، و خێرایی دەنگ." },
    ],
  },
  {
    id: "g11_chemistry",
    title: "کیمیا",
    fullName: "زانست بۆ هەمووان - کیمیا (پۆلی ١١ی زانستی - مەنهەجی نوێ)",
    coverImage: "/books/g11_chemistry.png",
    subjectKey: "chemistry",
    stream: "scientific",
    streamLabel: "زانستی",
    grade: "11",
    chaptersCount: 7,
    colorTheme: "from-purple-900/20 to-slate-950/40",
    description: "مەنهەجی نوێی کیمیای پۆلی ١١ی زانستی (٢١٦ لاپەڕە): ٧ بەندی سەرەکی - کارلێکە کیمیاییەکان، حیساباتی کیمیایی، دۆخەکانی ماددە، یاساکانی گازەکان، گیراوەکان، ئایۆنەکان لە ئاوەگیراوەکاندا، و ترشەکان و تفتەکان.",
    outline: [
      { id: 1, title: "بەندی ١: کارلێکە کیمیاییەکان و هاوکێشە کیمیاییەکان", pages: "٧ - ٣٦", description: "نیشانەکانی کارلێکی کیمیایی، نووسین و هاوسەنگکردنی هاوکێشەکان، پۆلێنکردنی جۆرەکانی کارلێک." },
      { id: 2, title: "بەندی ٢: حیساباتی کیمیایی (Stoichiometry)", pages: "٣٧ - ٥٦", description: "حیساباتی مۆڵ و بارستە لە هاوکێشەدا، ماددەی دیاریکەری کارلێک، و ڕێژەی لەسەدی بەرهەم." },
      { id: 3, title: "بەندی ٣: دۆخەکانی ماددە و هێزە نێوان گەردییەکان", pages: "٥٧ - ٨٨", description: "تیۆری جووڵەی گەردەکان، شلە و ڕەقەکان، هێزەکانی لەندەن و بەستەری هایدرۆجینی." },
      { id: 4, title: "بەندی ٤: یاساکانی گازەکان", pages: "٨٩ - ١١٦", description: "یاسای بۆیل، چارلز، گای لوساک، یاسای گشتی گازەکان، و هاوکێشەی گازی نموونەیی PV=nRT." },
      { id: 5, title: "بەندی ٥: گیراوەکان و خەستی", pages: "١١٧ - ١٤٤", description: "گیراوەی تێر و ناتێر، دەربڕینی خەستی بە مۆلاریتی و مۆلالیتی، و هۆکارەکانی کارکەر لەسەر توانەوە." },
      { id: 6, title: "بەندی ٦: ئایۆنەکان لە ئاوەگیراوەکاندا", pages: "١٤٥ - ١٧٤", description: "هاوکێشەی ئایۆنی تەواو و نێت، کارلێکەکانی نیشتن، و ڕەوشە کۆکارییەکانی گیراوەکان." },
      { id: 7, title: "بەندی ٧: ترشەکان و تفتەکان و تیتراسیۆن", pages: "١٧٥ - ٢١٢", description: "ڕەوشە گشتییەکانی ترش و تفت، تیۆری ئارێنیۆس و برۆنشتێد، و بنەماکانی تیتراسیۆن." },
    ],
  },
  {
    id: "g11_biology",
    title: "زیندەزانی",
    fullName: "زانست بۆ هەمووان - زیندەزانی (پۆلی ١١ی زانستی)",
    coverImage: "/books/g11_biology.png",
    subjectKey: "biology",
    stream: "scientific",
    streamLabel: "زانستی",
    grade: "11",
    chaptersCount: 7,
    colorTheme: "from-rose-900/20 to-slate-950/40",
    description: "مەنهەجی فەرمی زیندەزانی پۆلی ١١ی زانستی (١٩٠ لاپەڕە): ٧ بەندی سەرەکی - پێکهاتە و کاری خانە، ڕۆشنەپێکهاتن، هەناسەدانی خانەیی، دابەشبوونی خانە، بەکتریا و ڤایرۆسەکان، جیهانی ڕووەکەکان، و کۆئەندامەکانی لەش.",
    outline: [
      { id: 1, title: "بەندی ١: پێکهاتەی خانە و پەردەی خانەیی", pages: "٧ - ٣٢", description: "ئەندامۆچکەکانی خانە، پەردەی پلازمایی، گواستنەوەی ناچالاک و چالاک، و دەردانی خانەیی." },
      { id: 2, title: "بەندی ٢: ڕۆشنەپێکهاتن و وزەی ڕۆشنایی", pages: "٣٣ - ٥٨", description: "کلۆرۆپلاست، ڕۆشنە کارلێکەکان، گواستنەوەی ئەلیکترۆن، و کارلێکە تاریکەکان (سووڕی کاڵڤن)." },
      { id: 3, title: "بەندی ٣: هەناسەدانی خانەیی و دەرهێنانی وزە", pages: "٥٩ - ٨٤", description: "گلایکۆلایسس، سووڕی کرێبس، زنجیرەی گواستنەوەی ئەلیکترۆن، و دروستبوونی گەردی وزەبەخشی ATP." },
      { id: 4, title: "بەندی ٤: دابەشبوونی خانە - میتۆسیس و مایۆسیس", pages: "٨٥ - ١١٢", description: "سووڕی خانە، قۆناغەکانی دابەشبوونی میتۆسیس، دابەشبوونی کەمکەرە (مایۆسیس)، و ناتەواوییە کرۆمۆسۆمییەکان." },
      { id: 5, title: "بەندی ٥: بەکتریا و ڤایرۆسەکان", pages: "١١٣ - ١٣٨", description: "پێکهاتەی بەکتریا و سوود و زیانەکانی، ڤایرۆسەکان و شێوازی زۆربوونیان لە خانەی خانەخوێدا." },
      { id: 6, title: "بەندی ٦: جیهانی ڕووەکەکان و پێکهاتەیان", pages: "١٣٩ - ١٦٤", description: "شانەکانی ڕووەک، ڕەگ، قەد، گەڵا، و گواستنەوەی ئاو و خۆراک لە ڕێگەی نۆبەرە و دارینەوە." },
      { id: 7, title: "بەندی ٧: جۆراوجۆری زیندەیی و کۆئەندامەکان", pages: "١٦٥ - ١٩٠", description: "پۆلێنکردنی زیندەوەران، ئەندامەکانی هەرس، هەناسە و گواستنەوە لە جانەوەرە جیاوازەکاندا." },
    ],
  },
  {
    id: "g11_arabic",
    title: "زمانی عەرەبی",
    fullName: "قواعد اللغة والنصوص الأدبية (الصف الحادي عشر العلمي)",
    coverImage: "/books/g11_arabic.png",
    subjectKey: "arabic",
    stream: "both",
    streamLabel: "زانستی و گشتی",
    grade: "11",
    chaptersCount: 5,
    colorTheme: "from-teal-900/20 to-slate-950/40",
    description: "مەنهەجی فەرمی زمانی عەرەبی پۆلی ١١ (١٤٣ لاپەڕە): ٥ یەکەی سەرەکی - قواعد اللغة العربية، المشتقات، الممنوع من الصرف، أحكام العدد، الأدب العربي والنصوص، والبلاغة والتعبير.",
    outline: [
      { id: 1, title: "الوحدة الأولى: النصوص الأدبية، أحكام العدد والمعدود", pages: "٥ - ٣٢", description: "تذكير العدد وتأنيثه مع المعدود، إعراب الأعداد المفردة والمركبة وألفاظ العقود." },
      { id: 2, title: "الوحدة الثانية: أدب العصر العباسي، المشتقات وعملها", pages: "٣٣ - ٦٠", description: "اسم الفاعل، اسم المفعول، صيغ المبالغة وشروط عملها في الجملة العربية." },
      { id: 3, title: "الوحدة الثالثة: الأدب الحديث، الممنوع من الصرف", pages: "٦١ - ٨٨", description: "الأسماء الممنوعة من الصرف لعلة واحدة ولعلتين، علامات إعرابها واستعمالاتها." },
      { id: 4, title: "الوحدة الرابعة: البلاغة العربية وتطبيقاتها", pages: "٨٩ - ١١٦", description: "المحسنات البديعية: الطباق، الجناس، المقابلة، والسجع وأثرها في جمالية النص." },
      { id: 5, title: "الوحدة الخامسة: المراجعة الشاملة وتطبيقات الإعراب", pages: "١١٧ - ١٤٣", description: "تدريبات نحوية شاملة، نماذج إعرابية تطبيقية، والتعبير والإنشاء الأدبي." },
    ],
  },
  {
    id: "g11_english_activity",
    title: "ئینگلیزی (چالاکی)",
    fullName: "Sunrise 11 - Activity Book (کتێبی ڕاهێنان و چالاکی)",
    coverImage: "/books/g11_english_activity.png",
    subjectKey: "english",
    stream: "both",
    streamLabel: "زانستی و گشتی",
    grade: "11",
    chaptersCount: 8,
    colorTheme: "from-amber-600/20 to-sky-950/40",
    description: "مەنهەجی فەرمی ڕاهێنانەکانی ئینگلیزی پۆلی ١١ (Sunrise 11 Activity Book): ٨ یەکەی چالاکی گشتگیر، ڕێزمانی پێشکەوتوو، وشەسازی، وتارنووسین، و تەکنیکەکانی تاقیکردنەوە.",
    outline: [
      { id: 1, title: "Unit 1: The World Around Us (Grammar & Skills)", pages: "4 - 13", description: "Present Simple vs Continuous, State verbs, Environment vocabulary, Writing a descriptive paragraph." },
      { id: 2, title: "Unit 2: Looking Back (Past Forms & Narratives)", pages: "14 - 23", description: "Past Simple, Past Continuous & Past Perfect, Time connectors, Writing a personal biography." },
      { id: 3, title: "Unit 3: Breakthroughs & Technology (Modals & Logic)", pages: "24 - 33", description: "Modals of ability, obligation and deduction, Technology collocations, Opinion essay structure." },
      { id: 4, title: "Unit 4: Revision 1 (Units 1-3 Comprehensive Drills)", pages: "34 - 39", description: "Consolidation of units 1-3 grammar, vocabulary crosswords, listening and reading practice." },
      { id: 5, title: "Unit 5: Culture & Traditions (Passives & Relative Clauses)", pages: "40 - 49", description: "Passive voice in present and past, Defining and non-defining relative pronouns, Formal letters." },
      { id: 6, title: "Unit 6: Future of Work & Energy (Future Expressions)", pages: "50 - 59", description: "Will, Going to, Present Continuous for future, Career paths vocabulary, Formal report writing." },
      { id: 7, title: "Unit 7: Health & Lifestyle (Reported Speech & Gerunds)", pages: "60 - 69", description: "Direct and indirect speech, Verb patterns with gerunds and infinitives, Health advice writing." },
      { id: 8, title: "Unit 8: Revision 2 (Units 5-7 Comprehensive Drills)", pages: "70 - 75", description: "Comprehensive review of units 5-7, exam-style exercises, error correction, and vocabulary synthesis." },
    ],
  },
];

export function SubjectsScreen({ profile, onSelectSubject, onNavigate }: SubjectsScreenProps) {
  // Grade and Stream are strictly locked to the student profile
  const studentGrade = (profile.grade as "9" | "10" | "11" | "12") || "12";
  const studentStream = profile.stream || "scientific";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookForModal, setSelectedBookForModal] = useState<TextbookCardItem | null>(null);
  const [activeViewerBook, setActiveViewerBook] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"cards" | "showcase" | "curriculum_backbone">("cards");

  // Filter textbooks strictly according to the student's locked grade and stream
  const displayedBooks = useMemo(() => {
    let list = studentGrade === "9"
      ? GRADE_9_TEXTBOOKS
      : studentGrade === "10"
      ? GRADE_10_TEXTBOOKS
      : studentGrade === "11"
      ? GRADE_11_TEXTBOOKS
      : GRADE_12_TEXTBOOKS;

    // Filter strictly by scientific stream (Literary stream is locked across UI)
    if (studentGrade !== "9") {
      list = list.filter((b) => b.stream === "scientific" || b.stream === "both");
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.fullName.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q)
      );
    }

    return list;
  }, [studentGrade, searchQuery]);

  const handleOpenBook = (book: TextbookCardItem) => {
    setSelectedBookForModal(book);
  };

  const handleStartStudy = (book: TextbookCardItem) => {
    if (book.subjectKey) {
      onSelectSubject(book.subjectKey);
    }
    setSelectedBookForModal(null);
    onNavigate("chat");
  };

  const handleOpenViewer = (book: TextbookCardItem) => {
    if (
      book.id === "chemistry" ||
      book.id === "physics" ||
      book.id === "math" ||
      book.id === "kurdish" ||
      book.id === "arabic_1" ||
      book.id === "arabic_2" ||
      book.id === "arabic" ||
      book.id === "sports" ||
      book.id === "pe" ||
      book.id === "history" ||
      book.id === "economy" ||
      book.id === "economics" ||
      book.id === "geography" ||
      book.id === "math_lit" ||
      book.id === "english" ||
      book.id === "english_activity"
    ) {
      setActiveViewerBook(book.id);
      setSelectedBookForModal(null);
    } else {
      // Modal itself contains outline
    }
  };

  return (
    <div
      className="min-h-screen bg-[#071927] text-slate-100 flex-1 flex flex-col justify-start w-full relative overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950"
      dir="rtl"
    >
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-blue-700/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Container */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full relative z-10">
        {/* Top Header & Breadcrumb Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-950/80 pb-5">
          <div>
            {/* Breadcrumb matching xwendn.krd / کتێبەکانی پۆلی 12 */}
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1.5">
              <span>مەنهەجی فەرمی کوردستان</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-300 font-bold">کتێبەکانی پۆلی {studentGrade}</span>
            </div>
            <h1 className="font-sans font-black text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2.5">
              <span>کتێب و مەنهەجی خوێندن</span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                ٢٠٢٥ - ٢٠٢٦
              </span>
            </h1>
            <p className="font-sans text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              تەواوی پەڕتووک و سەرچاوە فەرمییەکانی خوێندن بۆ هەموو بابەتەکان بە شێوازی کارلێککارانە و زیرەک.
            </p>
          </div>

          {/* View Mode Switcher Pills */}
          <div className="flex items-center gap-2 bg-[#092238] p-1.5 rounded-2xl border border-cyan-900/40 self-start md:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => {
                setActiveView("cards");
                setActiveViewerBook(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeView === "cards" && !activeViewerBook
                  ? "bg-[#2dd4bf] text-slate-950 shadow-md font-black"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>کارتەکانی وانە</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView("showcase");
                setActiveViewerBook(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeView === "showcase" && !activeViewerBook
                  ? "bg-[#2dd4bf] text-slate-950 shadow-md font-black"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>پەڕتووکەکان</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView("curriculum_backbone");
                setActiveViewerBook(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeView === "curriculum_backbone"
                  ? "bg-[#2dd4bf] text-slate-950 shadow-md font-black"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>بڕبڕەی پشتی مەنهەج (٩-١٢)</span>
            </button>
          </div>
        </div>

        {/* VIEW 0: SIMPLIFIED SUBJECT CARD GRID (2 COLS MOBILE, 3 TABLET, 4 DESKTOP) */}
        {activeView === "cards" && !activeViewerBook && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {displayedBooks.map((book) => (
                <SubjectCard
                  key={book.id}
                  id={book.id}
                  subjectKey={book.subjectKey || "chemistry"}
                  title={book.title}
                  fullName={book.fullName}
                  grade={book.grade}
                  streamLabel={book.streamLabel}
                  chaptersCount={book.chaptersCount}
                  masteryPercentage={profile.activeSubject === book.subjectKey ? 75 : 40}
                  onSelect={(subj) => {
                    onSelectSubject(subj);
                    onNavigate("chat");
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* VIEW 1: CURRICULUM BACKBONE EXPLORER */}
        {activeView === "curriculum_backbone" && (
          <div className="bg-[#081a2b] border border-cyan-950 rounded-3xl p-4 sm:p-6 shadow-2xl">
            <CurriculumBackboneExplorer
              initialGrade={profile.grade || "12"}
              onSelectChapterForStudy={(subjKey, _ch) => {
                onSelectSubject(subjKey as SubjectKey);
                onNavigate("chat");
              }}
            />
          </div>
        )}

        {/* VIEW 2: DEDICATED BOOK VIEWER (CHEMISTRY / PHYSICS / MATH) */}
        {activeViewerBook && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#081a2b] p-4 rounded-2xl border border-cyan-900/50">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="font-sans font-bold text-base text-white">
                  تەماشاکردنی پەڕتووکی فەرمی:{" "}
                  {activeViewerBook === "chemistry"
                    ? "کیمیای پۆلی ١٢"
                    : activeViewerBook === "physics"
                    ? "فیزیای پۆلی ١٢"
                    : activeViewerBook === "math"
                    ? "بیرکاری پۆلی ١٢"
                    : activeViewerBook === "kurdish"
                    ? "زمان و ئەدەبی کوردی پۆلی ١٢"
                    : activeViewerBook === "sports" || activeViewerBook === "pe"
                    ? "پەروەردەی وەرزشی پۆلی ١٢"
                    : activeViewerBook === "history"
                    ? "مێژووی پۆلی ١٢"
                    : activeViewerBook === "economy" || activeViewerBook === "economics"
                    ? "ئابووریی پۆلی ١٢"
                    : activeViewerBook === "geography"
                    ? "جوگرافیای پۆلی ١٢"
                    : activeViewerBook === "math_lit"
                    ? "بیرکاری پۆلی ١٢ (وێژەیی)"
                    : activeViewerBook === "english"
                    ? "ئینگلیزی پۆلی ١٢ (Student's Book)"
                    : activeViewerBook === "english_activity"
                    ? "ئینگلیزی پۆلی ١٢ (Activity Book)"
                    : "زمانی عەرەبی پۆلی ١٢"}
                </h3>
              </div>
              <button
                onClick={() => setActiveViewerBook(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <X className="w-4 h-4" />
                <span>گەڕانەوە بۆ ڕەفەی کتێبەکان</span>
              </button>
            </div>

            {activeViewerBook === "chemistry" && (
              <Grade12ChemistryBookViewer
                onSelectTopicForStudy={(_title, _pages, _part) => {
                  onSelectSubject("chemistry");
                  onNavigate("chat");
                }}
                onNavigateToChat={() => onNavigate("chat")}
              />
            )}

            {activeViewerBook === "physics" && (
              <Grade12PhysicsBookViewer
                onSelectTopicForStudy={(_title, _pages, _part) => {
                  onSelectSubject("physics");
                  onNavigate("chat");
                }}
                onNavigateToChat={() => onNavigate("chat")}
              />
            )}

            {activeViewerBook === "math" && (
              <Grade12MathBookViewer
                onSelectTopicForStudy={(_title, _pages, _part) => {
                  onSelectSubject("math");
                  onNavigate("chat");
                }}
                onNavigateToChat={() => onNavigate("chat")}
              />
            )}

            {activeViewerBook === "kurdish" && (
              <Grade12KurdishBookViewer
                onSelectTopicForStudy={(_title, _pages, _part) => {
                  onSelectSubject("kurdish");
                  onNavigate("chat");
                }}
                onNavigateToChat={() => onNavigate("chat")}
              />
            )}

            {(activeViewerBook === "arabic_1" || activeViewerBook === "arabic_2" || activeViewerBook === "arabic") && (
              <Grade12ArabicBookViewer
                onSelectTopicForStudy={(_title, _pages, _part) => {
                  onSelectSubject("arabic");
                  onNavigate("chat");
                }}
                onNavigateToChat={() => onNavigate("chat")}
              />
            )}

            {(activeViewerBook === "sports" || activeViewerBook === "pe") && (
              <Grade12SportsBookViewer
                onSelectTopicForStudy={(_title, _pages, _part) => {
                  onSelectSubject("sports");
                  onNavigate("chat");
                }}
                onNavigateToChat={() => onNavigate("chat")}
              />
            )}

            {activeViewerBook === "history" && (
              <Grade12HistoryBookViewer
                onSelectTopicForStudy={(_title, _pages, _part) => {
                  onSelectSubject("history");
                  onNavigate("chat");
                }}
                onNavigateToChat={() => onNavigate("chat")}
              />
            )}

            {(activeViewerBook === "economy" || activeViewerBook === "economics") && (
              <Grade12EconomicsBookViewer
                onSelectTopicForStudy={(_title, _pages, _part) => {
                  onSelectSubject("economy");
                  onNavigate("chat");
                }}
                onNavigateToChat={() => onNavigate("chat")}
              />
            )}

            {activeViewerBook === "geography" && (
              <Grade12GeographyBookViewer
                onSelectTopicForStudy={(_title, _pages, _part) => {
                  onSelectSubject("geography");
                  onNavigate("chat");
                }}
                onNavigateToChat={() => onNavigate("chat")}
              />
            )}

            {activeViewerBook === "math_lit" && (
              <Grade12LiteraryMathBookViewer
                onSelectTopicForStudy={(_title, _pages, _part) => {
                  onSelectSubject("math");
                  onNavigate("chat");
                }}
                onNavigateToChat={() => onNavigate("chat")}
              />
            )}

            {activeViewerBook === "english" && (
              <Grade12EnglishBookViewer
                initialBookType="student"
                onSelectTopicForStudy={(_title, _pages, _part) => {
                  onSelectSubject("english");
                  onNavigate("chat");
                }}
                onNavigateToChat={() => onNavigate("chat")}
              />
            )}

            {activeViewerBook === "english_activity" && (
              <Grade12EnglishBookViewer
                initialBookType="activity"
                onSelectTopicForStudy={(_title, _pages, _part) => {
                  onSelectSubject("english");
                  onNavigate("chat");
                }}
                onNavigateToChat={() => onNavigate("chat")}
              />
            )}
          </div>
        )}

        {/* VIEW 3: OFFICIAL 10-BOOK SHOWCASE GRID (MATCHING USER SCREENSHOT) */}
        {activeView === "showcase" && !activeViewerBook && (
          <div className="space-y-6">
            {/* Control Bar: Locked Grade & Stream Status with Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#081a2b]/90 border border-cyan-900/40 p-3 sm:p-4 rounded-2xl shadow-lg backdrop-blur-md">
              {/* Locked Grade & Stream Badges */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                <span className="px-3 py-1.5 rounded-xl bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-bold text-xs flex items-center gap-1.5 shrink-0">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>پۆلی {studentGrade === "12" ? "١٢ی ئامادەیی" : studentGrade === "11" ? "١١ی ئامادەیی" : studentGrade === "10" ? "١٠ی ئامادەیی" : studentGrade === "9" ? "٩ی بنەڕەتی" : studentGrade}</span>
                </span>

                {studentGrade === "9" ? (
                  <span className="px-3 py-1.5 rounded-xl bg-teal-950 border border-teal-700/60 text-teal-300 font-bold text-xs flex items-center gap-1.5 shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                    <span>قۆناغی بنەڕەتی (گشتی)</span>
                  </span>
                ) : studentStream === "literary" ? (
                  <span className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-600/60 text-amber-300 font-bold text-xs flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>بەشی وێژەیی (لە ماوەی داهاتوو کارا دەبێت بۆ قوتابیان ⏳)</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-bold text-xs flex items-center gap-1.5 shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>بەشی زانستی</span>
                  </span>
                )}

                <span className="text-[11px] text-slate-400 font-medium hidden md:inline shrink-0 pr-1">
                  تەنها پەڕتووکەکانی ئەم بەشە پیشان دەدرێن
                </span>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="گەڕان لە ناوی کتێبەکان..."
                  className="w-full bg-[#0b243b] border border-cyan-900/50 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 10-Book Grid (Exactly 5 columns on desktop matching user's image) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {displayedBooks.map((book) => {
                const isActiveSubject = profile.activeSubject === book.subjectKey;

                return (
                  <div
                    key={book.id}
                    onClick={() => handleOpenBook(book)}
                    className="relative group rounded-2xl overflow-hidden bg-[#081f33] border border-cyan-950 hover:border-cyan-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-1.5 flex flex-col cursor-pointer"
                  >
                    {/* Active Ribbon if currently selected subject */}
                    {isActiveSubject && (
                      <div className="absolute top-2 right-2 z-30 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-slate-950" />
                        <span>خوێندنی چالاک</span>
                      </div>
                    )}

                    {/* Coming Soon Badge for Literary Books */}
                    {book.stream === "literary" && (
                      <div className="absolute top-2 left-2 z-30 bg-amber-500/90 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                        <span>لە ماوەی داهاتوو کارا دەبێت ⏳</span>
                      </div>
                    )}

                    {/* Book Cover Container with 3:4 Aspect Ratio */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
                      {/* Realistic 3D Book Spine Left Shadow */}
                      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/50 via-black/20 to-transparent z-10 pointer-events-none" />
                      {/* Glossy top-right reflection */}
                      <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-white/10 to-transparent z-10 pointer-events-none" />

                      {/* Cover Image */}
                      <picture className="w-full h-full block">
                        <source srcSet={book.coverImage.replace(/\.png$/i, ".webp")} type="image/webp" />
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            // Fallback to elegant SVG vector cover if image not yet loaded
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </picture>

                      {/* Fallback Graphic (rendered behind img) */}
                      <div
                        className={`w-full h-full absolute inset-0 bg-gradient-to-br ${book.colorTheme} p-4 flex flex-col justify-between text-right`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-cyan-300 uppercase">پۆلی {book.grade}</span>
                          <BookOpen className="w-5 h-5 text-cyan-400/80" />
                        </div>
                        <div>
                          <h4 className="font-sans font-black text-lg text-white leading-tight">
                            {book.title}
                          </h4>
                          <p className="text-[10px] text-slate-300 mt-1 line-clamp-2">
                            {book.fullName}
                          </p>
                        </div>
                        <div className="text-[9px] text-slate-400 border-t border-white/10 pt-1">
                          وەزارەتی پەروەردە
                        </div>
                      </div>

                      {/* HOVER OVERLAY: Vibrant Cyan Button "کردنەوە" (Matches screenshot perfectly) */}
                      <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBook(book);
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#2dd4bf] hover:bg-[#14b8a6] text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-teal-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <span>کردنەوە</span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Dark Metadata Bar (Matching image layout: Stream badge on left, Title on right) */}
                    <div className="bg-[#081a2b] border-t border-cyan-900/30 px-3 py-2.5 flex items-center justify-between z-10 mt-auto">
                      {/* Left: Stream pill badge */}
                      {book.stream === "literary" ? (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <span>وێژەیی</span>
                          <span className="text-[8px] bg-amber-500/30 px-1 py-0.5 rounded text-amber-200">بەمنزیکانە ⏳</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0e4860] text-cyan-300 border border-cyan-700/40">
                          {book.streamLabel}
                        </span>
                      )}

                      {/* Right: Subject title */}
                      <span className="font-sans font-bold text-xs sm:text-sm text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {book.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {displayedBooks.length === 0 && (
              <div className="text-center py-16 bg-[#081a2b] rounded-3xl border border-cyan-950 p-8 space-y-4 max-w-lg mx-auto my-6">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400 mx-auto shadow-inner">
                  <BookOpen className="w-8 h-8 opacity-75" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-sans font-bold text-lg text-white">
                    هیچ کتێبێک بەم مەرجانە نەدۆزرایەوە
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-slate-400 leading-relaxed">
                    تکایە دەستەواژەی گەڕانەکەت بگۆڕە یان ناوی کتێبێکی تر بنووسە.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  پاککردنەوەی گەڕان
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAIL & ACTION MODAL WHEN A BOOK IS OPENED */}
      {selectedBookForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="bg-[#092238] border border-cyan-800/60 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative text-right text-slate-100"
            style={{ direction: "rtl" }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedBookForModal(null)}
              className="absolute top-4 left-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Book Header Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b border-cyan-900/50 pb-6">
              {/* 3D Cover Thumbnail */}
              <div className="w-28 sm:w-32 aspect-[3/4] rounded-xl overflow-hidden shrink-0 shadow-2xl border border-cyan-500/30 bg-slate-900 relative">
                <picture className="w-full h-full block">
                  <source srcSet={selectedBookForModal.coverImage.replace(/\.png$/i, ".webp")} type="image/webp" />
                  <img
                    src={selectedBookForModal.coverImage}
                    alt={selectedBookForModal.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </picture>
              </div>

              {/* Book Metadata */}
              <div className="space-y-2 text-center sm:text-right flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#0e4860] text-cyan-300 border border-cyan-700/50">
                    {selectedBookForModal.streamLabel}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    پۆلی {selectedBookForModal.grade}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {selectedBookForModal.chaptersCount} بەند / بەش
                  </span>
                </div>

                <h2 className="font-sans font-black text-xl sm:text-2xl text-white">
                  {selectedBookForModal.fullName}
                </h2>

                <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {selectedBookForModal.description}
                </p>
              </div>
            </div>

            {/* PRIMARY ACTIONS OR COMING SOON BANNER */}
            {selectedBookForModal.stream === "literary" ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border border-amber-500/30 text-center space-y-2.5">
                <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-sm sm:text-base">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>بەشی وێژەیی لە ماوەی داهاتوو کارا دەبێت بۆ قوتابیان ⏳</span>
                </div>
                <p className="font-sans text-xs sm:text-sm text-amber-200/80 leading-relaxed max-w-lg mx-auto">
                  تەواوی پرۆگرام، کتێب و شیکارە زیرەکەکانی ئەم وانەیە بە شێوازێکی پڕۆفشناڵ لە قۆناغی ئامادەکاریدان و لە ماوەی داهاتوودا بۆ قوتابیان بەردەست دەخرێن.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedBookForModal(null)}
                    className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-md"
                  >
                    داخستن
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleStartStudy(selectedBookForModal)}
                  className="py-3 px-4 rounded-xl bg-[#2dd4bf] hover:bg-[#14b8a6] text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-teal-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>خوێندن لە چات</span>
                </button>

                {selectedBookForModal.hasInteractiveViewer ? (
                  <button
                    type="button"
                    onClick={() => handleOpenViewer(selectedBookForModal)}
                    className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <BookMarked className="w-4 h-4" />
                    <span>پەڕتووکی کارلێککارانە</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartStudy(selectedBookForModal)}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>پرسیارکردن لە زانا</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (selectedBookForModal.subjectKey) {
                      onSelectSubject(selectedBookForModal.subjectKey);
                    }
                    setSelectedBookForModal(null);
                    onNavigate("practice");
                  }}
                  className="py-3 px-4 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FlaskConical className="w-4 h-4 text-cyan-400" />
                  <span>ڕاهێنانی کارلێککارانە</span>
                </button>
              </div>
            )}

            {/* CHAPTER OUTLINE PREVIEW */}
            {selectedBookForModal.outline && selectedBookForModal.outline.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-sans font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>پێڕستی بەشە فەرمییەکانی کتێب:</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    مەنهەجی ٢٠٢٥ی هەرێمی کوردستان
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedBookForModal.outline.map((ch, idx) => (
                    <div
                      key={ch.id || idx}
                      className="bg-[#0b243b] hover:bg-[#10304e] border border-cyan-950 p-3 rounded-xl flex items-center justify-between text-right transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="font-sans font-bold text-xs sm:text-sm text-white">
                          {ch.title}
                        </p>
                        {ch.description && (
                          <p className="font-sans text-[11px] text-slate-400">
                            {ch.description}
                          </p>
                        )}
                      </div>
                      {ch.pages && (
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800/40 shrink-0 mr-3">
                          لاپەڕە {ch.pages}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
