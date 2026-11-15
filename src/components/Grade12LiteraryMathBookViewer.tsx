import React, { useState } from "react";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Bookmark,
  Calculator,
  Sigma
} from "lucide-react";

interface Grade12LiteraryMathBookViewerProps {
  onSelectTopicForStudy?: (topicTitle: string, pageRange: string, partName: string) => void;
  onNavigateToChat?: () => void;
}

interface ChapterLesson {
  id: string;
  title: string;
  page: string;
  summary: string;
  chapterNumber: number;
  keyFormulasAndRules?: string[];
  keyTermsAndConcepts?: string[];
  ministerialPoints?: string[];
}

interface LiteraryMathChapter {
  chapterIndex: number;
  title: string;
  subtitle: string;
  pages: string;
  iconColor: string;
  description: string;
  lessons: ChapterLesson[];
}

export const Grade12LiteraryMathBookViewer: React.FC<Grade12LiteraryMathBookViewerProps> = React.memo(({
  onSelectTopicForStudy,
  onNavigateToChat,
}) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>("math-lit-1-1");

  const CHAPTERS_METADATA: LiteraryMathChapter[] = [
    {
      chapterIndex: 1,
      title: "بەشی یەکەم: ئامار و ئەگەر",
      subtitle: "Statistics and Probability - هێڵکاری سندوقی، ئەگەری مەرجدار و سەرجەم، و مۆدێلی هێڵی",
      pages: "١ - ٢٦",
      iconColor: "text-blue-400 bg-blue-950/60 border-blue-700/50",
      description: "لێکۆڵینەوە لە کورتکردنەوە و شیکارکردنی داتاکان بە بەکارهێنانی هێڵکاری سندوق و سمێڵەکان (پێنج ژمارەی سەرەکی: بچووکترین، چوارەکی یەکەم Q1، ناوەڕاستە Q2، چوارەکی سێیەم Q3، و گەورەترین بەها)؛ دۆزینەوەی بەها دورەپەرێزەکان (Outliers)؛ ئەگەری مەرجدار P(A|B) و ئەگەری سەرجەم؛ و مۆدێلی هێڵی بۆ پێشبینیکردنی پەیوەندی نێوان دوو گۆڕەک.",
      lessons: [
        {
          id: "math-lit-1-1",
          title: "هێڵکاری سندوق و سمێڵەکان (Box-and-Whisker Plot)",
          page: "٦ - ١٣",
          chapterNumber: 1,
          summary: "پێنج ژمارەی سەرەکی بۆ کێشانی هێڵکاری سندوقی: بچووکترین بەها، چوارەکی یەکەم (Q1)، ناوەڕاستە (Median/Q2)، چوارەکی سێیەم (Q3)، و گەورەترین بەها. مەودای نێوان چوارەکەکان (IQR) بریتییە لە جیاوازی نێوان Q3 و Q1. بەهای دوورەپەرێز هەر بەهایەکە لە (Q1 - 1.5 * IQR) بچووکتر بێت یان لە (Q3 + 1.5 * IQR) گەورەتر بێت.",
          keyFormulasAndRules: [
            "مەودای چوارەکی: IQR = Q3 - Q1",
            "سنووری خوارەوە بۆ دوورەپەرێزەکان: سنووری خوارەوە = Q1 - 1.5(IQR)",
            "سنووری سەرەوە بۆ دوورەپەرێزەکان: سنووری سەرەوە = Q3 + 1.5(IQR)",
            "ڕێژەی داتا: لەنێوان Q1 و Q3 ڕێک ٥٠٪ی داتاکان جێگیر دەبن؛ لەنێوان هەر بەشێک لە چوار بەشەکە ٢٥٪ی داتاکان هەن"
          ],
          keyTermsAndConcepts: [
            "هێڵکاری سندوق و سمێڵەکان (Box-and-Whisker Plot)",
            "چوارەکی یەکەم و سێیەم (Q1 & Q3)",
            "ناوەڕاستە (Median)",
            "مەودای چوارەکی (Interquartile Range - IQR)",
            "بەهای دوورەپەرێز (Outlier)"
          ],
          ministerialPoints: [
            "چۆنیەتی دۆزینەوەی بەهای دوورەپەرێز بە یاسای ١.٥ بەرامبەر IQR لە تاقیکردنەوەی وزاری",
            "کێشانی سندوقەکە و دیاریکردنی درێژی سمێڵەکان بەبێ بەستنەوەیان بە بەها دوورەپەرێزەکانەوە"
          ]
        },
        {
          id: "math-lit-1-2",
          title: "ئەگەری مەرجدار و ئەگەری سەرجەم (Conditional & Total Probabilities)",
          page: "١٤ - ٢٠",
          chapterNumber: 1,
          summary: "ئەگەری مەرجدار P(A|B) بریتییە لە ئەگەری ڕوودانی ڕووداوی A بە مەرجێک ڕووداوی B ڕوویدابێت. یاسای لێکدانی ئەگەرەکان P(A ∩ B) = P(B) * P(A|B). ئەگەری سەرجەم لە ڕێگەی درەختی ئەگەرەوە هەژمار دەکرێت بۆ دۆزینەوەی ئەگەری ڕووداوێکی گشتی لە چەندین بارودۆخی جیاوازدا.",
          keyFormulasAndRules: [
            "ئەگەری مەرجدار: P(A|B) = P(A ∩ B) / P(B) کاتێک P(B) > 0",
            "یاسای لێکدان: P(A ∩ B) = P(B) · P(A|B) = P(A) · P(B|A)",
            "ڕووداوە سەربەخۆکان: ئەگەر A و B سەربەخۆ بن، ئەوا P(A|B) = P(A) و P(A ∩ B) = P(A) · P(B)",
            "ئەگەری سەرجەم (Total Probability): P(A) = P(B1)·P(A|B1) + P(B2)·P(A|B2) + ..."
          ],
          keyTermsAndConcepts: [
            "ئەگەری مەرجدار (Conditional Probability)",
            "درەختی ئەگەر (Probability Tree)",
            "ڕووداوە سەربەخۆکان (Independent Events)",
            "ئەگەری سەرجەم (Law of Total Probability)"
          ],
          ministerialPoints: [
            "جیاکردنەوەی ڕووداوی مەرجدار لە ڕووداوی ئاسایی بە وشەی 'بە مەرجێک' یان 'ئەگەر بزانین'",
            "کێشانی درەختی ئەگەر بۆ پرسیارەکانی تاقیکردنەوەی وزاری کە دوو قۆناغ لەخۆدەگرن"
          ]
        },
        {
          id: "math-lit-1-3",
          title: "مۆدێلی هێڵی (Linear Model)",
          page: "٢١ - ٢٦",
          chapterNumber: 1,
          summary: "دۆزینەوەی هاوکێشەی ڕاستەهێڵی گونجاوترین بۆ داتاکان لە هێڵکاری پەرتەوازەییدا (Scatter Plot). هاوکێشەی هێڵی y = mx + b؛ لێژی هێڵەکە m و بڕگەی بڕاو لەسەر تەوەری دووەم b بەکاردێن بۆ پێشبینیکردنی بەهاکان (Interpolation & Extrapolation).",
          keyFormulasAndRules: [
            "هاوکێشەی ڕاستەهێڵ: y = mx + b",
            "لێژی ڕاستەهێڵ: m = (y2 - y1) / (x2 - x1)",
            "هاوکێشە بەپێی خاڵ و لێژایی: y - y1 = m(x - x1)",
            "تێبینی مۆدێل: پێشبینیکردن لەناو مەودای داتاکان جێی متمانەترە وەک لە پێشبینیکردن لە دەرەوەی مەوداکە"
          ],
          keyTermsAndConcepts: [
            "هێڵکاری پەرتەوازەیی (Scatter Plot)",
            "ڕاستەهێڵی گونجاوترین (Line of Best Fit)",
            "هاوپەیوەندی ئەرێنی و نەرێنی (Positive & Negative Correlation)",
            "پێشبینیکردن (Prediction)"
          ],
          ministerialPoints: [
            "دۆزینەوەی لێژایی و هاوکێشەی ڕاستەهێڵ لە ڕێگەی دوو خاڵی سەرەکی لەسەر نەخشەکە",
            "لێکدانەوەی واتای لێژایی لە کێشە ژیانی و ئابوورییەکاندا (وەک تێکڕای گۆڕان)"
          ]
        }
      ]
    },
    {
      chapterIndex: 2,
      title: "بەشی دووەم: جەبر",
      subtitle: "Algebra - سیستەمی هاوکێشە، پڕۆگرامسازی هێڵی و ماتریسەکان",
      pages: "٢٧ - ٥٠",
      iconColor: "text-emerald-400 bg-emerald-950/60 border-emerald-700/50",
      description: "لێکۆڵینەوە لە جەبری هێڵی و جێبەجێکردنەکانی: شیکارکردنی سیستەمی ٣ هاوکێشەی هێڵی لە ٣ نەزانراودا بە شێوازی سڕینەوە و قەرەبووکردنەوە؛ پڕۆگرامسازی هێڵی (Linear Programming) بۆ دیاریکردنی زۆرترین قازانج یان کەمترین تێچوون لەژێر چەند سنووردارکردنێکدا؛ لێکدانی ماتریسەکان و مەرجی ڕیزبەندی؛ و دۆزینەوەی پێچەوانەی ماتریس (Inverse Matrix).",
      lessons: [
        {
          id: "math-lit-2-1",
          title: "شیکارکردنی سیستەمی هاوکێشەی هێڵی بە ٣ نەزانراو",
          page: "٢٨ - ٣٤",
          chapterNumber: 2,
          summary: "شیکارکردنی سیستەمی ٣ هاوکێشە بە گۆڕەکەکانی (x, y, z) لە ڕێگەی هەڵبژاردنی جووت هاوکێشە بۆ سڕینەوەی یەکێک لە نەزانراوەکان، پاشان گۆڕینی بۆ سیستەمی ٢ هاوکێشە بە ٢ نەزانراو، و دۆزینەوەی وەڵامی سیانەی ڕێکخراو (x, y, z).",
          keyFormulasAndRules: [
            "فۆرمی گشتی هاوکێشەی هێڵی بە ٣ نەزانراو: Ax + By + Cz = D",
            "هەنگاوەکانی شیکار: ١. سڕینەوەی هەمان گۆڕەک لە دوو جووت هاوکێشەی جیاوازدا",
            "٢. پێکهێنانی سیستەمێکی نوێی ٢ هاوکێشە بە ٢ گۆڕەک",
            "٣. دۆزینەوەی بەهای دوو گۆڕەکەکە و قەرەبووکردنەوەیان لە یەکێک لە هاوکێشە بنەڕەتییەکان بۆ دۆزینەوەی گۆڕەکی سێیەم"
          ],
          keyTermsAndConcepts: [
            "سیستەمی هاوکێشەی هێڵی (System of Linear Equations)",
            "سیانەی ڕێکخراو (Ordered Triple)",
            "شێوازی سڕینەوە (Elimination Method)",
            "هاوئاستی هاوکێشەکان (Consistent & Inconsistent Systems)"
          ],
          ministerialPoints: [
            "وریاکەرەوە: دڵنیابوونەوە لە ئەنجامی کۆتایی بە تاقیکردنەوەی (x, y, z) لە هەرسێ هاوکێشەکەدا",
            "دۆزینەوەی حاڵەتەکانی بێ چارەسەر (کاتێک 0 = ژمارەیەکی ناسیفر دەردەچێت) یان بێکۆتا چارەسەر (کاتێک 0 = 0)"
          ]
        },
        {
          id: "math-lit-2-2",
          title: "پڕۆگرامسازی هێڵی (Linear Programming)",
          page: "٣٥ - ٤٠",
          chapterNumber: 2,
          summary: "پڕۆگرامسازی هێڵی میتۆدێکی ماتماتیکییە بۆ گەیشتن بە باشترین ئەنجام (زۆرترین قازانج یان کەمترین تێچوون) لە مۆدێلێکی ماتماتیکیدا کە سنووردارکردنەکانی بە شێوەی نایەکسانی هێڵی بن. دۆزینەوەی ناوچەی شیاوی چارەسەر و تاقیکردنەوەی خاڵەکانی سەرکۆن (Vertices) لە نەخشەی ئامانجدا (Objective Function).",
          keyFormulasAndRules: [
            "نەخشەی ئامانج: P = ax + by (یان تێچوو C = ax + by)",
            "سنووردارکردنەکان: کۆمەڵێک نایەکسانی هێڵی لەگەڵ مەرجی نا-نەرێنی x ≥ 0 و y ≥ 0",
            "تیۆرمی سەرکۆنەکان: بەهای هەرە گەورە و هەرە بچووکی نەخشەی ئامانج تەنها لە یەکێک لە خاڵەکانی سەرکۆنی ناوچەی شیاودا ڕوودەدات"
          ],
          keyTermsAndConcepts: [
            "پڕۆگرامسازی هێڵی (Linear Programming)",
            "نەخشەی ئامانج (Objective Function)",
            "ناوچەی شیاو (Feasible Region)",
            "خاڵەکانی سەرکۆن (Vertex / Corner Points)"
          ],
          ministerialPoints: [
            "کێشانی دروستی ناوچەی شیاو و دۆزینەوەی هاوئاهەنگی خاڵەکانی سەرکۆن بە شیکاری هاوکێشەکان",
            "تاقیکردنەوەی هەموو خاڵە سەرکۆنەکان لە نەخشەی ئامانجدا بۆ دەرهێنانی گەورەترین قازانج"
          ]
        },
        {
          id: "math-lit-2-3",
          title: "لێکدانی ماتریسەکان (Multiplying Matrices)",
          page: "٤١ - ٤٦",
          chapterNumber: 2,
          summary: "پێناسەی ماتریس، ڕیزبەندی (ڕەهەند m × n)، و مەرجی لێکدانی دوو ماتریس: ژمارەی ستوونەکانی ماتریسی یەکەم دەبێت یەکسان بێت بە ژمارەی دێڕەکانی ماتریسی دووەم. لە ئەنجامدا ماتریسێکی نوێ پێکدێت. لێکدانی ماتریسەکان ئاڵوگۆڕپێکراو نییە (A × B ≠ B × A بەگشتی).",
          keyFormulasAndRules: [
            "مەرجی لێکدان: ئەگەر A قەبارەی m × k بێت و B قەبارەی k × n بێت، ئەوا C = A × B قەبارەی m × n دەبێت",
            "یاسای دانەکان: هەر دانەیەک c_ij بریتییە لە لێکدانی دێڕی i لە ماتریسی یەکەم لەگەڵ ستوونی j لە ماتریسی دووەم",
            "تایبەتمەندی: لێکدانی ماتریسەکان بەگشتی ئاڵوگۆڕپێکراو نییە: AB ≠ BA",
            "ماتریسی یەکە (Identity Matrix I): A · I = I · A = A"
          ],
          keyTermsAndConcepts: [
            "ماتریس (Matrix)",
            "ڕەهەندی ماتریس (Dimensions / Order)",
            "لێکدانی ماتریس (Matrix Multiplication)",
            "ماتریسی یەکە (Identity Matrix)"
          ],
          ministerialPoints: [
            "پشکنینی مەرجی لێکدان پێش ئەنجامدانی پرۆسەکە (ژمارەی ستوونی یەکەم = ژمارەی دێڕی دووەم)",
            "پرسیارەکانی تاقیکردنەوەی وزاری سەبارەت بە دۆزینەوەی ڕەهەندی ماتریسی بەرهەمهاتوو"
          ]
        },
        {
          id: "math-lit-2-4",
          title: "پێچەوانەی ماتریس (Inverse of a Matrix)",
          page: "٤٧ - ٥٠",
          chapterNumber: 2,
          summary: "ماتریسی پێچەوانەی A^(-1) کاتێک هەیە کە دیاریکەری ماتریسەکە det(A) ≠ 0 بێت. ئەگەر A = [[a, b], [c, d]] بێت، ئەوا det(A) = ad - bc، و A^(-1) = (1/det(A)) * [[d, -b], [-c, a]]. سوود لە پێچەوانەی ماتریس وەردەگیرێت بۆ شیکارکردنی هاوکێشە ماتریسییەکان AX = B بەم شێوەیە X = A^(-1)B.",
          keyFormulasAndRules: [
            "دیاریکەری ماتریسی ٢×٢: |A| = ad - bc",
            "مەرجی بوونی پێچەوانە: det(A) ≠ 0 (ئەگەر det(A) = 0 بێت ماتریسەکە پێچەوانەی نییە و پێی دەوترێت ماتریسی تاک / Singular)",
            "یاسای پێچەوانە: A^(-1) = (1 / (ad - bc)) · [[d, -b], [-c, a]]",
            "شیکاری هاوکێشەی ماتریسی: AX = B  ==>  X = A^(-1) · B"
          ],
          keyTermsAndConcepts: [
            "دیاریکەری ماتریس (Determinant)",
            "ماتریسی پێچەوانە (Inverse Matrix)",
            "ماتریسی تاک (Singular Matrix)",
            "هاوکێشەی ماتریسی (Matrix Equation)"
          ],
          ministerialPoints: [
            "گۆڕینی شوێنی دێڕی سەرەکی (a و d دەبنە d و a) و پێچەوانەکردنی نیشانەی تیرەی لاوەکی (-b و -c)",
            "بەکاربردنی پێچەوانەی ماتریس بۆ شیکارکردنی سیستەمی دوو هاوکێشەی هێڵی"
          ]
        }
      ]
    },
    {
      chapterIndex: 3,
      title: "بەشی سێیەم: نەخشەکان",
      subtitle: "Functions - نەخشە فرەجاکان، گۆڕان، نەخشە توانییەکان و لۆگاریتم",
      pages: "٥١ - ٧٦",
      iconColor: "text-purple-400 bg-purple-950/60 border-purple-700/50",
      description: "لێکۆڵینەوە لە جۆرە جیاوازەکانی نەخشەکان: نەخشە فرەجاکان و دەرهێنانی سیفرەکانیان؛ نەخشەکانی گۆڕان (گۆڕانی ڕاستەوخۆ، پێچەوانە، هاوبەش و تێکەڵاو)؛ نەخشە توانییەکان f(x) = b^x و نەخشەی بنچینەی سروشتی e؛ مۆدێلەکانی گەشەکردن و پووکانەوەی توانی لە دیاردە دارایی و ئابوورییەکاندا؛ و نەخشە لۆگاریتمییەکان وەک پێچەوانەی نەخشە توانییەکان لەگەڵ لۆگاریتمی سروشتی ln.",
      lessons: [
        {
          id: "math-lit-3-1",
          title: "نەخشە فرەجاکان (Polynomial Functions)",
          page: "٥٢ - ٥٨",
          chapterNumber: 3,
          summary: "نەخشە فرەجاکان بەپێی پلەکەیان (هێڵی پلە یەک، دووجا پلە دوو، سێجا پلە سێ)؛ دۆزینەوەی مەودا و بواری نەخشە فرەجاکان (بواری هەموو نەخشەیەکی فرەجا ژمارە ڕاستەقینەکانە R)؛ دۆزینەوەی سیفرەکانی نەخشە لە ڕێگەی شیکارکردنی هاوکێشەی f(x) = 0؛ و شیکردنەوەی ڕەفتاری کۆتایی نەخشەکە.",
          keyFormulasAndRules: [
            "فۆرمی گشتی: f(x) = a_n x^n + a_(n-1) x^(n-1) + ... + a_1 x + a_0",
            "بواری هەموو نەخشەیەکی فرەجا: بواری = R (تەواوی ژمارە ڕاستەقینەکان)",
            "سیفرەکانی نەخشە: ئەو بەهایانەی x کە وادەکەن f(x) = 0 بێت (خاڵەکانی بڕینی تەوەری x)",
            "نەخشەی دووجا f(x) = ax^2 + bx + c: لووتکەی نەخشە x = -b / (2a)"
          ],
          keyTermsAndConcepts: [
            "نەخشەی فرەجا (Polynomial Function)",
            "پلەی نەخشە (Degree of Polynomial)",
            "سیفرەکانی نەخشە (Zeros / Roots)",
            "لووتکەی نەخشەی دووجا (Vertex)"
          ],
          ministerialPoints: [
            "دۆزینەوەی هاوئاهەنگی لووتکەی نەخشەی دووجا x = -b/(2a) و دۆزینەوەی بەهای هەرە گەورە یان بچووک",
            "شیکارکردنی نەخشە سێجاکان لە ڕێگەی دەرهێنانی هۆکاری هاوبەش"
          ]
        },
        {
          id: "math-lit-3-2",
          title: "نەخشەکانی گۆڕان (Variation Functions)",
          page: "٥٩ - ٦٥",
          chapterNumber: 3,
          summary: "گۆڕانی ڕاستەوخۆ (Direct Variation): y بە ڕاستەوخۆ دەگۆڕێت لەگەڵ x کاتێک y = kx. گۆڕانی پێچەوانە (Inverse Variation): y بە پێچەوانە دەگۆڕێت لەگەڵ x کاتێک y = k/x. گۆڕانی هاوبەش (Joint Variation): گۆڕانی گۆڕەکێک لەگەڵ دوو گۆڕەک یان زیاتر بە لێکدان z = kxy.",
          keyFormulasAndRules: [
            "گۆڕانی ڕاستەوخۆ: y = kx  یان  y1 / x1 = y2 / x2  (نەگۆڕی گۆڕان k = y/x)",
            "گۆڕانی پێچەوانە: y = k / x  یان  x1 · y1 = x2 · y2  (نەگۆڕی گۆڕان k = xy)",
            "گۆڕانی هاوبەش: z = kxy  یان  z1 / (x1 · y1) = z2 / (x2 · y2)",
            "گۆڕانی تێکەڵاو: y = kx / z (ڕاستەوخۆ لەگەڵ x و پێچەوانە لەگەڵ z)"
          ],
          keyTermsAndConcepts: [
            "گۆڕانی ڕاستەوخۆ (Direct Variation)",
            "گۆڕانی پێچەوانە (Inverse Variation)",
            "گۆڕانی هاوبەش (Joint Variation)",
            "نەگۆڕی گۆڕان (Constant of Variation k)"
          ],
          ministerialPoints: [
            "دۆزینەوەی بەهای نەگۆڕی k پێش وەڵامدانەوەی بەشەکانی تری پرسیارەکە",
            "پرسیارە وشەییەکان و جیاکردنەوەی گۆڕانی ڕاستەوخۆ لە گۆڕانی پێچەوانە"
          ]
        },
        {
          id: "math-lit-3-3",
          title: "نەخشە توانییەکان، گەشەکردن و پووکانەوە (Exponential Functions)",
          page: "٦٦ - ٧٠",
          chapterNumber: 3,
          summary: "نەخشە توانی f(x) = ab^x کاتێک b > 0 و b ≠ 1. ئەگەر b > 1 بێت نەخشەکە گەشەکردنی توانییە؛ ئەگەر 0 < b < 1 بێت نەخشەکە پووکانەوەی توانییە. بنچینەی سروشتی e ≈ 2.71828. مۆدێلی گەشەکردنی دانیشتووان یان سەرمایەی کەڵەکەبوو A = P(1 + r/n)^(nt) و سووی بەردەوام A = P·e^(rt).",
          keyFormulasAndRules: [
            "نەخشەی توانی گشتی: f(x) = ab^x  (b > 1 گەشە، 0 < b < 1 پووکانەوە)",
            "هاوکێشەی گەشەکردنی توانی: y = a(1 + r)^t",
            "هاوکێشەی پووکانەوەی توانی: y = a(1 - r)^t",
            "سووی لێکدراوی کەڵەکەبوو: A = P(1 + r/n)^(nt)",
            "سووی بەردەوام (Continuous Compounding): A = P · e^(rt)"
          ],
          keyTermsAndConcepts: [
            "نەخشەی توانی (Exponential Function)",
            "بنچینەی سروشتی (Natural Base e)",
            "گەشەکردنی توانی (Exponential Growth)",
            "پووکانەوەی توانی (Exponential Decay)",
            "سووی لێکدراو (Compound Interest)"
          ],
          ministerialPoints: [
            "جیاوازی نێوان ڕێژەی گەشەکردن r و هۆکاری گەشەکردن (1 + r)",
            "هەژمارکردنی سەرمایە لە کێشە ئابوورییەکان بە یاسای A = Pe^(rt)"
          ]
        },
        {
          id: "math-lit-3-4",
          title: "نەخشە لۆگاریتمییەکان (Logarithmic Functions)",
          page: "٧١ - ٧٦",
          chapterNumber: 3,
          summary: "نەخشەی لۆگاریتمی پێچەوانەی نەخشەی توانییە: y = log_b(x) هاوتایە لەگەڵ b^y = x. یاساکانی لۆگاریتم: لۆگاریتمی لێکدان دەبێتە کۆکردنەوە، دابەشکردن دەبێتە لێدەرکردن، و توان دێتە پێشەوە. لۆگاریتمی سروشتی ln(x) بریتییە لە لۆگاریتم بە بنچینەی e.",
          keyFormulasAndRules: [
            "پەیوەندی بنەڕەتی: log_b(x) = y  <===>  b^y = x",
            "یاسای لێکدان: log_b(xy) = log_b(x) + log_b(y)",
            "یاسای دابەشکردن: log_b(x / y) = log_b(x) - log_b(y)",
            "یاسای توان: log_b(x^k) = k · log_b(x)",
            "یاسای گۆڕینی بنچینە: log_b(x) = log_c(x) / log_c(b)",
            "لۆگاریتمی سروشتی: ln(x) = log_e(x) کاتێک ln(e) = 1 و ln(1) = 0"
          ],
          keyTermsAndConcepts: [
            "لۆگاریتم (Logarithm)",
            "لۆگاریتمی ئاسایی (Common Logarithm - log)",
            "لۆگاریتمی سروشتی (Natural Logarithm - ln)",
            "هاوکێشەی لۆگاریتمی (Logarithmic Equation)"
          ],
          ministerialPoints: [
            "بەکاربردنی یاساکانی لۆگاریتم بۆ کورتکردنەوەی بڕە ئاڵۆزەکان",
            "شیکارکردنی هاوکێشە توانییەکان بە وەرگرتنی ln یان log بۆ هەردوو لا"
          ]
        }
      ]
    },
    {
      chapterIndex: 4,
      title: "بەشی چوارەم: یەکبەدوایەکەکان",
      subtitle: "Sequences - یەکبەدوایەکی ژمێرەیی و ئەندازەیی و کۆی بڕەکان",
      pages: "٧٧ - ٩٠",
      iconColor: "text-amber-400 bg-amber-950/60 border-amber-700/50",
      description: "لێکۆڵینەوە لە پێکهاتەی یەکبەدوایەکە ژمارەییەکان: یەکبەدوایەکی ژمێرەیی (جیاوازی هاوبەش d، یاسای بڕی گشتی an، کۆی بڕەکانی یەکبەدوایەکی ژمێرەیی Sn)؛ یەکبەدوایەکی ئەندازەیی (بنچینەی هاوبەش r، یاسای بڕی گشتی an، کۆی زنجیرەی ئەندازەیی سنووردار و بێسنوور)؛ و بەکاربردنی یەکبەدوایەکەکان لە پاشەکەوت و قیستی مانگانە و گەشەی ئابووریدا.",
      lessons: [
        {
          id: "math-lit-4-1",
          title: "یەکبەدوایەکی ژمێرەیی (Arithmetic Sequences)",
          page: "٧٨ - ٨٣",
          chapterNumber: 4,
          summary: "لە یەکبەدوایەکی ژمێرەییدا جیاوازی نێوان هەر دوو بڕی یەکبەدوایەک بەهایەکی نەگۆڕە پێی دەوترێت جیاوازی هاوبەش (d = a_(n) - a_(n-1)). یاسای بڕی n-هەم: a_n = a_1 + (n - 1)d. کۆی n بڕی یەکەم: S_n = (n/2) * (a_1 + a_n) یان S_n = (n/2) * [2a_1 + (n - 1)d].",
          keyFormulasAndRules: [
            "جیاوازی هاوبەش: d = a_(k+1) - a_k",
            "بڕی n-هەم: a_n = a_1 + (n - 1)d",
            "کۆی n بڕی یەکەم: S_n = (n / 2) · (a_1 + a_n)",
            "فۆرمی دووەمی کۆ: S_n = (n / 2) · [2a_1 + (n - 1)d]",
            "ناوەڕاستەی ژمێرەیی نێوان دوو ژمارەی a و b: (a + b) / 2"
          ],
          keyTermsAndConcepts: [
            "یەکبەدوایەکی ژمێرەیی (Arithmetic Sequence)",
            "جیاوازی هاوبەش (Common Difference d)",
            "بڕی یەکەم (First Term a1)",
            "کۆی زنجیرەی ژمێرەیی (Arithmetic Series Sn)"
          ],
          ministerialPoints: [
            "دۆزینەوەی ژمارەی بڕەکان (n) لە زنجیرەیەکدا کە بڕی یەکەم و کۆتایی دیارە",
            "دانانی چەندین ناوەڕاستەی ژمێرەیی لە نێوان دوو ژمارەدا"
          ]
        },
        {
          id: "math-lit-4-2",
          title: "یەکبەدوایەکی ئەندازەیی (Geometric Sequences)",
          page: "٨٤ - ٩٠",
          chapterNumber: 4,
          summary: "لە یەکبەدوایەکی ئەندازەییدا ڕێژەی نێوان هەر دوو بڕی یەکبەدوایەک بەهایەکی نەگۆڕە پێی دەوترێت بنچینەی هاوبەش (r = a_(n) / a_(n-1)). یاسای بڕی n-هەم: a_n = a_1 · r^(n - 1). کۆی n بڕی یەکەم: S_n = a_1(1 - r^n) / (1 - r) کاتێک r ≠ 1. کۆی زنجیرەی ئەندازەیی بێکۆتا کاتێک |r| < 1 بێت یەکسانە بە S_∞ = a_1 / (1 - r).",
          keyFormulasAndRules: [
            "بنچینەی هاوبەش: r = a_(k+1) / a_k",
            "بڕی n-هەم: a_n = a_1 · r^(n - 1)",
            "کۆی زنجیرەی ئەندازەیی سنووردار: S_n = a_1 · (1 - r^n) / (1 - r)  (r ≠ 1)",
            "کۆی زنجیرەی بێکۆتا (|r| < 1): S_∞ = a_1 / (1 - r)",
            "ناوەڕاستەی ئەندازەیی نێوان دوو ژمارەی پۆزەتیڤ a و b: √(a · b)"
          ],
          keyTermsAndConcepts: [
            "یەکبەدوایەکی ئەندازەیی (Geometric Sequence)",
            "بنچینەی هاوبەش (Common Ratio r)",
            "زنجیرەی ئەندازەیی لێکچوو (Convergent Series)",
            "کۆی بێکۆتا (Infinite Sum S∞)"
          ],
          ministerialPoints: [
            "مەرجی بوونی کۆی بێکۆتا: تەنها کاتێک |r| < 1 بێت (واتە -1 < r < 1)",
            "بەراوردی نێوان گەشەی ژمێرەیی (هێڵی) و گەشەی ئەندازەیی (توانی و خێرا)"
          ]
        }
      ]
    },
    {
      chapterIndex: 5,
      title: "بەشی پێنجەم: جیاکاری و تەواوکاری لە ئابووریدا",
      subtitle: "Differentiation & Integration in Economics - تێچووی پەراوێزی، داهاتی پەراوێزی، زۆرترین قازانج",
      pages: "٩١ - ١١١",
      iconColor: "text-rose-400 bg-rose-950/60 border-rose-700/50",
      description: "لێکۆڵینەوە لە کۆڵەکەکانی جیاکاری و تەواوکاری و جێبەجێکردنیان لە شیکاری ئابووریدا: یاساکانی داتاشراو بۆ نەخشە فرەجاکان؛ دۆزینەوەی نەخشەی تێچووی پەراوێزی MC = C'(x) لە نەخشەی تێچووی کۆوە؛ نەخشەی داهاتی پەراوێزی MR = R'(x) و قازانجی پەراوێزی MP = P'(x)؛ مەرجەکانی بەدەستهێنانی زۆرترین قازانج کاتێک MR = MC؛ بنەماکانی تەواوکاریی نادیار و دۆزینەوەی نەخشەی تێچوو و داهات لە ڕێگەی تەواوکارییەوە بە زانینی تێچووی نەگۆڕ FC.",
      lessons: [
        {
          id: "math-lit-5-1",
          title: "جێبەجێکردنی داتاشراو لە کەرتی ئابووریدا (Applications to Economics)",
          page: "٩٢ - ١٠٠",
          chapterNumber: 5,
          summary: "لە ئابووریدا، داتاشراو تێکڕای گۆڕانی پەراوێزی (Marginal) دەنوێنێت. نەخشەی تێچووی کۆ C(x) بریتییە لە کۆی تێچووی بەرهەمهێنانی x یەکە. تێچووی پەراوێزی MC = C'(x) بریتییە لە تێچووی بەرهەمهێنانی یەک یەکەی زیادە. نەخشەی داهات R(x) = p · x کاتێک p نرخی یەکەیە. داهاتی پەراوێزی MR = R'(x). نەخشەی قازانج P(x) = R(x) - C(x). زۆرترین قازانج لەو ئاستەی بەرهەمهێناندا دەبێت کە تیایدا MR = MC.",
          keyFormulasAndRules: [
            "یاسای داتاشراوی توان: d/dx(x^n) = n · x^(n-1)",
            "نەخشەی داهات: R(x) = p · x  (نرخ × چەندێتی)",
            "نەخشەی قازانج: P(x) = R(x) - C(x)  (داهات - تێچوو)",
            "تێچووی پەراوێزی (Marginal Cost): MC = C'(x)",
            "داهاتی پەراوێزی (Marginal Revenue): MR = R'(x)",
            "قازانجی پەراوێزی (Marginal Profit): MP = P'(x) = MR - MC",
            "تێچووی تێکڕا (Average Cost): AC = C(x) / x",
            "مەرجی زۆرترین قازانج: MR = MC  یان  P'(x) = 0  و  P''(x) < 0"
          ],
          keyTermsAndConcepts: [
            "تێچووی پەراوێزی (Marginal Cost MC)",
            "داهاتی پەراوێزی (Marginal Revenue MR)",
            "قازانجی پەراوێزی (Marginal Profit MP)",
            "تێچووی تێکڕا (Average Cost AC)",
            "زۆرترین قازانج (Profit Maximization)"
          ],
          ministerialPoints: [
            "دۆزینەوەی ژمارەی یەکە بەرهەمهاتووەکان x کە زۆرترین قازانج دەبەخشێت (پرسیاری حەتمی وزاری)",
            "جیاوازی نێوان تێچووی تێکڕا AC = C(x)/x و تێچووی پەراوێزی MC = C'(x)"
          ]
        },
        {
          id: "math-lit-5-2",
          title: "تەواوکاری و جێبەجێکردنەکانی لە ئابووریدا (Integration in Economics)",
          page: "١٠١ - ١١١",
          chapterNumber: 5,
          summary: "تەواوکاری پرۆسەی پێچەوانەی داتاشراوە (پێشینە داتاشراو). یاسای بنەڕەتی: ∫ x^n dx = (x^(n+1))/(n+1) + C. لە ئابووریدا، بە تەواوکاریکردنی تێچووی پەراوێزی MC دەگەینەوە بە نەخشەی تێچووی کۆ C(x) = ∫ MC dx + C_0، کە تێیدا C_0 یەکسانە بە تێچووی نەگۆڕ (Fixed Costs FC کاتێک x = 0). بە هەمان شێوە داهاتی کۆ R(x) بە تەواوکاریکردنی MR بەدەست دێت.",
          keyFormulasAndRules: [
            "یاسای تەواوکاری توانی: ∫ x^n dx = (x^(n+1)) / (n + 1) + c  (n ≠ -1)",
            "تەواوکاری نەگۆڕ: ∫ k dx = kx + c",
            "نەخشەی تێچووی کۆ: C(x) = ∫ MC dx = ∫ C'(x) dx + FC",
            "تێچووی نەگۆڕ (Fixed Cost): FC = C(0) (تێچووی بەرهەمهێنان کاتێک هیچ یەکەیەک دروست نەکراوە)",
            "نەخشەی داهات: R(x) = ∫ MR dx = ∫ R'(x) dx  کاتێک R(0) = 0"
          ],
          keyTermsAndConcepts: [
            "تەواوکاریی نادیار (Indefinite Integral)",
            "نەگۆڕی تەواوکاری (Constant of Integration c)",
            "تێچووی نەگۆڕ (Fixed Cost FC)",
            "تێچووی گۆڕاو (Variable Cost VC)"
          ],
          ministerialPoints: [
            "دۆزینەوەی نەگۆڕی تەواوکاری c بە بەکارهێنانی تێچووی نەگۆڕ FC کە لە دەقی پرسیارەکەدا دەدرێت",
            "دۆزینەوەی نەخشەی قازانج لە ڕێگەی تەواوکاریکردنی هەردوو MC و MR پێکەوە"
          ]
        }
      ]
    }
  ];

  // Official Mathematical Glossary for Grade 12 Literary (فەرهەنگۆکی زاراوە بیرکارییەکان)
  const GLOSSARY_TERMS = [
    { ku: "هێڵکاری سندوق و سمێڵەکان", en: "Box-and-Whisker Plot", ar: "مخطط الصندوق وطرفيه" },
    { ku: "چوارەکی یەکەم و سێیەم", en: "First & Third Quartiles (Q1, Q3)", ar: "الربيع الأول والثالث" },
    { ku: "مەودای چوارەکی", en: "Interquartile Range (IQR)", ar: "المدى الربيعي" },
    { ku: "بەهای دوورەپەرێز", en: "Outlier", ar: "القيمة المتطرفة" },
    { ku: "ئەگەری مەرجدار", en: "Conditional Probability", ar: "الاحتمال المشروط" },
    { ku: "ئەگەری سەرجەم", en: "Total Probability", ar: "الاحتمال الكلي" },
    { ku: "مۆدێلی هێڵی", en: "Linear Model", ar: "النموذج الخطي" },
    { ku: "ڕاستەهێڵی گونجاوترین", en: "Line of Best Fit", ar: "خط أفضل تمثيل" },
    { ku: "پڕۆگرامسازی هێڵی", en: "Linear Programming", ar: "البرمجة الخطية" },
    { ku: "نەخشەی ئامانج", en: "Objective Function", ar: "دالة الهدف" },
    { ku: "ناوچەی شیاوی چارەسەر", en: "Feasible Region", ar: "منطقة الحل الممكن" },
    { ku: "خاڵەکانی سەرکۆن", en: "Vertex / Corner Points", ar: "نقاط الرؤوس" },
    { ku: "ماتریس و ڕەهەند", en: "Matrix & Dimensions", ar: "المصفوفة والرتبة" },
    { ku: "لێکدانی ماتریسەکان", en: "Matrix Multiplication", ar: "ضرب المصفوفات" },
    { ku: "دیاریکەری ماتریس", en: "Determinant", ar: "المحدد" },
    { ku: "پێچەوانەی ماتریس", en: "Inverse Matrix", ar: "المصفوفة العكسية / النظير الضربي" },
    { ku: "نەخشەی فرەجا", en: "Polynomial Function", ar: "دالة كثيرة الحدود" },
    { ku: "گۆڕانی ڕاستەوخۆ", en: "Direct Variation", ar: "التغير الطردي" },
    { ku: "گۆڕانی پێچەوانە", en: "Inverse Variation", ar: "التغير العكسي" },
    { ku: "گۆڕانی هاوبەش", en: "Joint Variation", ar: "التغير المشترك" },
    { ku: "نەخشەی توانی", en: "Exponential Function", ar: "الدالة الأسية" },
    { ku: "گەشەکردنی توانی", en: "Exponential Growth", ar: "النمو الأسي" },
    { ku: "پووکانەوەی توانی", en: "Exponential Decay", ar: "الاضمحلال الأسي" },
    { ku: "لۆگاریتمی سروشتی", en: "Natural Logarithm (ln)", ar: "اللوغاريتم الطبيعي" },
    { ku: "یەکبەدوایەکی ژمێرەیی", en: "Arithmetic Sequence", ar: "المتتابعة الحسابية" },
    { ku: "جیاوازی هاوبەش", en: "Common Difference (d)", ar: "أساس المتتابعة الحسابية" },
    { ku: "یەکبەدوایەکی ئەندازەیی", en: "Geometric Sequence", ar: "المتتابعة الهندسية" },
    { ku: "بنچینەی هاوبەش", en: "Common Ratio (r)", ar: "أساس المتتابعة الهندسية" },
    { ku: "تێچووی پەراوێزی", en: "Marginal Cost (MC)", ar: "التكلفة الحدية" },
    { ku: "داهاتی پەراوێزی", en: "Marginal Revenue (MR)", ar: "الإيراد الحدي" },
    { ku: "قازانجی پەراوێزی", en: "Marginal Profit (MP)", ar: "الربح الحدي" },
    { ku: "تەواوکاریی نادیار", en: "Indefinite Integral", ar: "التكامل غير المحدد" },
    { ku: "تێچووی نەگۆڕ", en: "Fixed Cost (FC)", ar: "التكلفة الثابتة" }
  ];

  const currentChapter = CHAPTERS_METADATA.find(
    (c) => c.chapterIndex === activeChapterIndex
  ) || CHAPTERS_METADATA[0];

  const filteredLessons = currentChapter.lessons.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.title.toLowerCase().includes(q) ||
      l.summary.toLowerCase().includes(q) ||
      l.keyTermsAndConcepts?.some((t) => t.toLowerCase().includes(q)) ||
      l.keyFormulasAndRules?.some((f) => f.toLowerCase().includes(q)) ||
      l.ministerialPoints?.some((m) => m.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner with Subject Title & Metadata */}
      <div className="bg-gradient-to-r from-blue-900/60 via-[#0a233b] to-indigo-950/60 border border-blue-800/40 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full">
                وەزارەتی پەروەردە - پۆلی ١٢ی وێژەیی
              </span>
              <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
                مەنهەجی فەرمی ١١١ لاپەڕە
              </span>
              <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full">
                ٥ بەشی فەرمی
              </span>
            </div>
            <h2 className="font-sans font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight flex items-center gap-3">
              <Calculator className="w-8 h-8 text-blue-400 shrink-0" />
              <span>بیرکاری (پۆلی ١٢ی وێژەیی)</span>
            </h2>
            <p className="font-sans text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              تەواوی ٥ بەشی فەرمی مەنهەجی بیرکاری پۆلی ١٢ی وێژەیی: ئامار و ئەگەر (هێڵکاری سندوقی، ئەگەری مەرجدار و سەرجەم)، جەبر (پڕۆگرامسازی هێڵی، ماتریسەکان)، نەخشەکان، یەکبەدوایەکەکان، و جیاکاری و تەواوکاری لە ئابووریدا لەگەڵ مامۆستا زانا.
            </p>
          </div>

          {/* Quick Stats Block */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-[#071927]/80 border border-blue-800/40 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-mono text-blue-400 block mb-0.5">بەشەکانی مەنهەج</span>
              <span className="text-xl font-mono font-black text-white">٥ بەش</span>
            </div>
            <div className="bg-[#071927]/80 border border-blue-800/40 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-mono text-blue-400 block mb-0.5">کۆی لاپەڕەکان</span>
              <span className="text-xl font-mono font-black text-white">١١١ لاپەڕە</span>
            </div>
            <div className="bg-[#071927]/80 border border-blue-800/40 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono text-emerald-400 block mb-0.5">وانەکانی ناوەڕۆک</span>
              <span className="text-xl font-mono font-black text-emerald-300">١٣ دەرس</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Selection Tabs (Horizontal Scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-blue-800/50">
        {CHAPTERS_METADATA.map((ch) => {
          const isActive = ch.chapterIndex === activeChapterIndex;
          return (
            <button
              key={ch.chapterIndex}
              onClick={() => {
                setActiveChapterIndex(ch.chapterIndex);
                setExpandedLessonId(ch.lessons[0]?.id || null);
              }}
              className={`px-4 py-3 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2.5 border ${
                isActive
                  ? "bg-blue-600 text-white border-blue-400 shadow-lg font-black"
                  : "bg-[#092238] text-slate-300 border-cyan-950 hover:bg-[#0c2e4a] hover:text-white"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-black ${
                  isActive ? "bg-white text-blue-700" : "bg-blue-950/80 text-blue-400 border border-blue-800/50"
                }`}
              >
                {ch.chapterIndex}
              </span>
              <div className="text-right">
                <span className="block leading-tight">{ch.title.split(":")[0]}</span>
                <span className="text-[10px] opacity-80 block truncate max-w-[140px]">
                  {ch.title.split(":")[1] || ch.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Chapter Overview Card */}
      <div className="bg-[#081f33] border border-cyan-950 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-950 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-blue-400 bg-blue-950/70 border border-blue-800/50 px-2.5 py-0.5 rounded-md font-bold">
                لاپەڕە {currentChapter.pages}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {currentChapter.lessons.length} وانەی فەرمی لەم بەشەدا
              </span>
            </div>
            <h3 className="font-sans font-black text-xl text-white">
              {currentChapter.title}
            </h3>
            <p className="text-xs font-mono text-blue-400/90">{currentChapter.subtitle}</p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان لە وانە و یاساکانی ئەم بەشە..."
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-[#061524] border border-cyan-950 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#061726] p-4 rounded-xl border border-cyan-950/80">
          {currentChapter.description}
        </p>
      </div>

      {/* Lessons Accordion List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-sans font-bold text-sm text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>وانە و تەوەری بەشەکە</span>
          </h4>
          <span className="text-xs font-mono text-slate-400">
            {filteredLessons.length} لە {currentChapter.lessons.length} وانە
          </span>
        </div>

        <div className="space-y-3">
          {filteredLessons.map((lesson) => {
            const isExpanded = expandedLessonId === lesson.id;
            return (
              <div
                key={lesson.id}
                className="bg-[#092238] border border-cyan-950 rounded-2xl overflow-hidden transition-all duration-200 hover:border-cyan-800/60"
              >
                {/* Header Row */}
                <button
                  type="button"
                  onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-right cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-blue-950/80 border border-blue-800/50 text-blue-400 font-mono text-xs font-black flex items-center justify-center shrink-0">
                      {lesson.page.split("-")[0].trim()}
                    </span>
                    <div className="min-w-0">
                      <h5 className="font-sans font-bold text-sm sm:text-base text-white truncate">
                        {lesson.title}
                      </h5>
                      <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                        لاپەڕە {lesson.page}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectTopicForStudy) {
                          onSelectTopicForStudy(
                            lesson.title,
                            lesson.page,
                            currentChapter.title
                          );
                        } else if (onNavigateToChat) {
                          onNavigateToChat();
                        }
                      }}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>خوێندن لەگەڵ زانا</span>
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 space-y-4 border-t border-cyan-950/80 bg-[#071927]/60">
                    {/* Summary */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                        پوختەی مەنهەجی وەزارەت:
                      </span>
                      <p className="font-sans text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#05131f] p-3.5 rounded-xl border border-cyan-950">
                        {lesson.summary}
                      </p>
                    </div>

                    {/* Key Formulas & Rules */}
                    {lesson.keyFormulasAndRules && lesson.keyFormulasAndRules.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                          <Sigma className="w-3.5 h-3.5" />
                          <span>یاسا و هاوکێشە سەرەکییەکان:</span>
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {lesson.keyFormulasAndRules.map((rule, idx) => (
                            <div
                              key={idx}
                              className="font-mono text-xs text-emerald-200 bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-xl flex items-start gap-2"
                              dir="ltr"
                            >
                              <span className="text-emerald-400 font-bold shrink-0">•</span>
                              <span className="text-right w-full font-bold">{rule}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Terms */}
                    {lesson.keyTermsAndConcepts && lesson.keyTermsAndConcepts.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block flex items-center gap-1.5">
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>زاراوە و چەمکە سەرەکییەکان:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {lesson.keyTermsAndConcepts.map((term, idx) => (
                            <span
                              key={idx}
                              className="text-xs font-mono bg-cyan-950/50 text-cyan-300 border border-cyan-800/40 px-2.5 py-1 rounded-lg"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ministerial Points */}
                    {lesson.ministerialPoints && lesson.ministerialPoints.length > 0 && (
                      <div className="space-y-2 bg-amber-950/30 border border-amber-800/40 p-3.5 rounded-xl">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>خاڵە گرنگەکانی تاقیکردنەوەی وزاری:</span>
                        </span>
                        <ul className="space-y-1.5 pr-2">
                          {lesson.ministerialPoints.map((pt, idx) => (
                            <li
                              key={idx}
                              className="text-xs font-sans text-amber-200/90 list-disc list-inside leading-relaxed"
                            >
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mobile Action Button */}
                    <div className="pt-2 sm:hidden">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectTopicForStudy) {
                            onSelectTopicForStudy(
                              lesson.title,
                              lesson.page,
                              currentChapter.title
                            );
                          } else if (onNavigateToChat) {
                            onNavigateToChat();
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>شیکارکردنی پرسیار و ڕاهێنان لەگەڵ مامۆستا زانا</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Glossary Section (فەرهەنگۆکی زاراوە بیرکارییەکان) */}
      <div className="bg-[#0b243b] border border-cyan-950 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-cyan-950 pb-3">
          <div className="space-y-0.5">
            <h4 className="font-sans font-bold text-sm text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-400" />
              <span>فەرهەنگۆکی فەرمی زاراوە بیرکارییەکان (پۆلی ١٢ی وێژەیی)</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              زاراوە سەرەکییەکان بە سێ زمانی کوردی، ئینگلیزی، و عەرەبی هاوتەریب لەگەڵ مەنهەجی وەزارەت.
            </p>
          </div>
          <span className="text-[10px] font-mono text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-800/40">
            {GLOSSARY_TERMS.length} زاراوە
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
          {GLOSSARY_TERMS.map((term, idx) => (
            <div
              key={idx}
              className="bg-[#071927] border border-cyan-950/80 p-2.5 rounded-xl space-y-1 hover:border-cyan-800/60 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-xs text-blue-300">
                  {term.ku}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {term.ar}
                </span>
              </div>
              <p className="text-[11px] font-mono text-cyan-400/90 truncate">
                {term.en}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
