import React, { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Calculator,
  Compass,
  Layers,
  Bookmark,
  TrendingUp,
  FunctionSquare,
  Infinity as InfinityIcon,
  PieChart,
} from "lucide-react";
import { CurriculumIndexService } from "../curriculum/retrieval/CurriculumIndexService.ts";
import { CurriculumEvidence } from "../curriculum/retrieval/CurriculumEvidence.ts";

interface Grade12MathBookViewerProps {
  onSelectTopicForStudy?: (topicTitle: string, pageRange: string, partName: string) => void;
  onNavigateToChat?: () => void;
}

export const Grade12MathBookViewer: React.FC<Grade12MathBookViewerProps> = React.memo(({
  onSelectTopicForStudy,
  onNavigateToChat,
}) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<CurriculumEvidence[]>([]);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  const indexService = CurriculumIndexService.getInstance();

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const results = indexService.search(q, {
      subject: "math",
      grade: "12",
      limit: 6,
    });
    setSearchResults(results);
  };

  const handleStudyClick = (title: string, pages: string, part: string) => {
    if (onSelectTopicForStudy) {
      onSelectTopicForStudy(title, pages, part);
    }
    if (onNavigateToChat) {
      onNavigateToChat();
    }
  };

  // 7 Official Chapters of Grade 12 Scientific Mathematics (240 Pages)
  const CHAPTERS_METADATA = [
    {
      num: 1,
      title: "بەشی ١: وێنە ڕوونکردنەوەییەکان و نموونە هێڵییەکان",
      englishTitle: "Graphs and Linear Models",
      pages: "١ - ٣٧",
      pageStart: 1,
      pageEnd: 37,
      icon: TrendingUp,
      summaryKu: "کێشانی وێنەی ڕوونکردنەوەیی هاوکێشەکان، لێژی هێڵی ڕاست، تێکڕای گۆڕان، هاوکێشەی هێڵە هاوتەریب و ئەستوونەکان، بواری پێناسە و مەودا، نەخشەی جووت و تاک، و گۆڕینە ئەندازەییەکان.",
      lessons: [
        {
          id: "m1-1",
          title: "کەرتی ١-١: وێنە ڕوونکردنەوەییەکان (Graphs)",
          pages: "٤ - ١١",
          desc: "کێشانی وێنەی ڕوونکردنەوەیی هاوکێشە جەبرییەکان بە خاڵبەندی، بڕینی تەوەری x و y، و سێ جۆری هاوسەنگی (تەوەری x، تەوەری y، و خاڵی بنەڕەت).",
          formula: "بڕینی x: y = 0 | بڕینی y: x = 0 | هاوسەنگ لەگەڵ بنەڕەت: (-x, -y)",
          keyPoints: ["خاڵبەندی", "بڕینی تەوەرەکان", "هاوسەنگی تەوەری", "خاڵی بنەڕەت"],
        },
        {
          id: "m1-2",
          title: "کەرتی ٢-١: نموونە هێڵییەکان و تێکڕای گۆڕانەکان",
          pages: "١٢ - ٢١",
          desc: "لێژی هێڵی ڕاست m = (y₂ - y₁) / (x₂ - x₁)، هاوکێشەی خاڵ-لێژ y - y₁ = m(x - x₁)، لێژ و بڕین y = mx + b، مەرجی هاوتەریبی m₁ = m₂، و مەرجی ئەستوونی m₁ · m₂ = -1.",
          formula: "m = (y₂ - y₁) / (x₂ - x₁) | y - y₁ = m(x - x₁) | m₁ · m₂ = -1",
          keyPoints: ["لێژی هێڵ", "تێکڕای گۆڕان", "هێڵی هاوتەریب", "هێڵی ئەستوون"],
        },
        {
          id: "m1-3",
          title: "کەرتی ٣-١: نەخشەکان و ڕوونکردنەوەکانیان",
          pages: "٢٢ - ٣٧",
          desc: "بواری پێناسە (Domain) و مەودا (Range)، تاقیکردنەوەی هێڵی ئەستوونی، نەخشەی جووت f(-x) = f(x)، نەخشەی تاک f(-x) = -f(x)، و گۆڕینە ئەندازەییەکان (ڕاگواستنی ئاسۆیی و ستوونی، دانەوە).",
          formula: "f(-x) = f(x) [جووت] | f(-x) = -f(x) [تاک] | f(x ± c) ± d",
          keyPoints: ["بواری پێناسە", "مەودا", "نەخشەی جووت", "نەخشەی تاک", "ڕاگواستن"],
        },
      ],
    },
    {
      num: 2,
      title: "بەشی ٢: ئامانجەکان (Limits)",
      englishTitle: "Limits and Continuity",
      pages: "٣٨ - ٧٧",
      pageStart: 38,
      pageEnd: 77,
      icon: InfinityIcon,
      summaryKu: "چەمکی ئامانج وەک سەرەتای زانستی کالکولس، دۆزینەوەی ئامانج بە خشتە و هێڵکاری، یاساکانی جەبری ئامانج، دۆخی نادیاری 0/0، نەخشە بەردەوامەکان، تیۆرمی بەهای ناوەند، و ئامانجە بێپایانەکان و لادانی ستوونی.",
      lessons: [
        {
          id: "m2-1",
          title: "کەرتی ١-٢: دەروازەیەک بۆ هەژمارکردنی جیاکاری و تەواوکاری",
          pages: "٤٠ - ٤٥",
          desc: "کێشەی هێڵی لێکەوتی چەماوە (Tangent Line Problem) بە بەکارهێنانی لێژی هێڵە بڕەرەکان، و کێشەی ڕووبەری بن چەماوە بە بەکارهێنانی لاکێشە باریکەکان.",
          formula: "m = lim_{Δx->0} [f(c + Δx) - f(c)] / Δx",
          keyPoints: ["هێڵی لێکەوت", "هێڵی بڕەر", "ڕووبەری بن چەماوە", "کالکولس"],
        },
        {
          id: "m2-2",
          title: "کەرتی ٢-٢: دۆزینەوەی ئامانجەکان بە ڕوونکردنەوەیی و ژمارەیی",
          pages: "٤٦ - ٥٣",
          desc: "پێناسەی ئامانج: lim_{x->c} f(x) = L کاتێک ئامانجی چەپ و ڕاست یەکسانن. هۆکارەکانی نەبوونی ئامانج: جیاوازی ئامانجی لای ڕاست و چەپ، بێپایانبوون، یان لەرینەوەی بێشومار.",
          formula: "lim_{x->c} f(x) = L <=> lim_{x->c⁻} f(x) = lim_{x->c⁺} f(x) = L",
          keyPoints: ["ئامانجی چەپ", "ئامانجی ڕاست", "نەبوونی ئامانج", "خشتەی بەهاکان"],
        },
        {
          id: "m2-3",
          title: "کەرتی ٣-٢: هەژمارکردنی ئامانجەکان بە شێوازی جەبری",
          pages: "٥٤ - ٦٣",
          desc: "یاساکانی ئامانج بۆ کۆکردنەوە، لێکدان، دابەشکردن و توان. چارەسەرکردنی دۆخی نادیاری 0/0 لە ڕێگەی شیکردنەوە بە هۆکارەکان یان لێکدان بە هاوتا (Conjugate). تیۆرمی گوشین (Squeeze Theorem).",
          formula: "lim [f(x) ± g(x)] = lim f ± lim g | شیکردنەوەی 0/0 بە هاوتا",
          keyPoints: ["دۆخی 0/0", "شیکردنەوە بە هۆکارەکان", "لێکدان بە هاوتا", "تیۆرمی گوشین"],
        },
        {
          id: "m2-4",
          title: "کەرتی ٤-٢: نەخشە بەردەوامەکان (Continuous Functions)",
          pages: "٦٤ - ٧١",
          desc: "مەرجەکانی بەردەوامی لە خاڵێکدا: 1) f(c) پێناسەکراو بێت، 2) lim_{x->c} f(x) هەبێت، 3) lim f(x) = f(c). بەردەوامی لەسەر ماوەی داخراو و تیۆرمی بەهای ناوەند (IVT).",
          formula: "f بەردەوامە لە c <=> lim_{x->c} f(x) = f(c)",
          keyPoints: ["مەرجەکانی بەردەوامی", "پچڕانی لادراو و نالادراو", "تیۆرمی بەهای ناوەند"],
        },
        {
          id: "m2-5",
          title: "کەرتی ٥-٢: ئامانجە بێپایانەکان و لادانی ستوونی",
          pages: "٧٢ - ٧٧",
          desc: "ئامانجی بێپایان کاتێک x لە ژمارەیەک نزیک دەبێتەوە و بەهای نەخشەکە بێسنوور گەورە یان بچووک دەبێتەوە. هێڵی x = c لادانی ستوونییە ئەگەر ئامانجی چەپ یان ڕاست یەکسان بێت بە ±∞.",
          formula: "lim_{x->c} f(x) = ±∞ <=> x = c لادانی ستوونییە",
          keyPoints: ["ئامانجی بێپایان", "لادانی ستوونی (Vertical Asymptote)", "سفری ژێرکەرت"],
        },
      ],
    },
    {
      num: 3,
      title: "بەشی ٣: داتاشراو (Derivative)",
      englishTitle: "Differentiation Rules and Applications",
      pages: "٧٨ - ١١٥",
      pageStart: 78,
      pageEnd: 115,
      icon: FunctionSquare,
      summaryKu: "پێناسەی داتاشراو بە ئامانج، هاوکێشەی هێڵی لێکەوت و ئەستوون، یاسای توان، یاسای لێکدان و دابەشکردن، داتاشراوی نەخشە سێگۆشەییەکان، داتاشراوی خۆبەخۆ، داتاشراوە بەرزەکان، و تێکڕای گۆڕانە پەیوەندیدارەکان.",
      lessons: [
        {
          id: "m3-1",
          title: "کەرتی ١-٣: داتاشراو و بابەتی لێکەوت",
          pages: "٨٠ - ٨٧",
          desc: "پێناسەی فەرمی داتاشراو f'(x) = lim_{Δx->0} [f(x+Δx) - f(x)] / Δx. هاوکێشەی هێڵی لێکەوت: y - y₁ = f'(x₁)(x - x₁). ئەگەر نەخشەیەک داتاشراوە بێت لە خاڵێکدا ئەوا بەردەوامە لەو خاڵەدا.",
          formula: "f'(x) = lim_{Δx->0} [f(x+Δx) - f(x)] / Δx | y - y₁ = f'(x₁)(x - x₁)",
          keyPoints: ["پێناسەی داتاشراو", "لێژی لێکەوت", "بەردەوامی و داتاشراوەبوون"],
        },
        {
          id: "m3-2",
          title: "کەرتی ٢-٣: ڕێساکانی داتاشراو (Differentiation Rules)",
          pages: "٨٨ - ٩٧",
          desc: "یاسای توان: d/dx [xⁿ] = n·xⁿ⁻¹. یاسای لێکدان: (u·v)' = u'v + uv'. یاسای دابەشکردن: (u/v)' = (u'v - uv') / v². داتاشراوی sin x = cos x و cos x = -sin x.",
          formula: "d/dx [xⁿ] = n·xⁿ⁻¹ | (uv)' = u'v + uv' | (u/v)' = (u'v - uv') / v²",
          keyPoints: ["یاسای توان", "یاسای لێکدان", "یاسای دابەشکردن", "داتاشراوی نەخشە سێگۆشەییەکان"],
        },
        {
          id: "m3-3",
          title: "کەرتی ٣-٣: داتاشراوی خۆبەخۆ و داتاشراوە بەرزەکان",
          pages: "٩٨ - ١٠٧",
          desc: "جیاکردنەوەی خۆبەخۆ بۆ دۆزینەوەی dy/dx لە هاوکێشە ناڕوونەکاندا بە جێبەجێکردنی یاسای زنجیرەیی لەسەر y. داتاشراوی دووەم d²y/dx² و پەیوەندی بە تاودان a(t) = s''(t).",
          formula: "d/dx [y²] = 2y(dy/dx) | a(t) = v'(t) = s''(t)",
          keyPoints: ["داتاشراوی خۆبەخۆ (Implicit)", "یاسای زنجیرەیی", "داتاشراوی دووەم", "تاودان"],
        },
        {
          id: "m3-4",
          title: "کەرتی ٤-٣: تێکڕای گۆڕانە پەیوەندیدارەکان (Related Rates)",
          pages: "١٠٨ - ١١٥",
          desc: "شیکارکردنی کێشە فیزیایی و ئەندازەییەکان بە بەکارهێنانی داتاشراو بەپێی کات (dt). هەنگاوەکانی چارەسەرکردنی پرسیارە وزارییەکانی پەیوەندیدار بە ئاو، پەیژە، و سێبەر.",
          formula: "dV/dt = 4πr²(dr/dt) | dx/dt و dy/dt لە تیۆرمی پیتاگۆرس",
          keyPoints: ["تێکڕای گۆڕان بەپێی کات", "یاسای زنجیرەیی لە کاتدا", "کێشە وزارییەکان"],
        },
      ],
    },
    {
      num: 4,
      title: "بەشی ٤: جێبەجێکردنەکانی داتاشراو",
      englishTitle: "Applications of Differentiation",
      pages: "١١٦ - ١٥٧",
      pageStart: 116,
      pageEnd: 157,
      icon: Calculator,
      summaryKu: "خاڵە ڕەخنەییەکان، تاقیکردنەوەی داتاشراوەی یەکەم بۆ ماوەکانی زیادبوون و کەمبوون، تاقیکردنەوەی داتاشراوەی دووەم بۆ قوپان و خاڵی وەرگەڕان، لادانی ئاسۆیی لە بێپایاندا، کێشانی نەخشەکان، و کێشەکانی باشترین بەها (Optimization).",
      lessons: [
        {
          id: "m4-1",
          title: "کەرتی ١-٤: تاقیکردنەوەی داتاشراوەی یەکەم (First Derivative Test)",
          pages: "١١٨ - ١٢٥",
          desc: "دۆزینەوەی خاڵە ڕەخنەییەکان (کاتێک f'(x) = 0 یان پێناسەنەکراو بێت). f'(x) > 0 زیادکەرە، f'(x) < 0 کەمکەرە. دەستنیشانکردنی بەهای هەرەبەرز و هەرەنزم لەسەر هێڵی ژمارەکان.",
          formula: "f'(c) = 0 => خاڵی ڕەخنەیی | گۆڕان لە + بۆ - => هەرەبەرز",
          keyPoints: ["خاڵی ڕەخنەیی", "ماوەکانی زیادبوون و کەمبوون", "بەهای هەرەبەرز و هەرەنزم"],
        },
        {
          id: "m4-2",
          title: "کەرتی ٢-٤: تاقیکردنەوەی داتاشراوەی دووەم و چەمانەوە",
          pages: "١٢٦ - ١٣٥",
          desc: "ئەگەر f''(x) > 0 بێت هێڵکارییەکە قۆقزە بەرەو سەرەوە (Concave Up). ئەگەر f''(x) < 0 بێت قۆقزە بەرەو خوارەوە. خاڵی وەرگەڕان (Inflection Point) ڕوودەدات کاتێک چەمانەوە ئاڕاستەی دەگۆڕێت.",
          formula: "f''(x) > 0 [قۆقز بەرەو سەرەوە] | f''(x) < 0 [بەرەو خوارەوە] | f''(c) = 0 [وەرگەڕان]",
          keyPoints: ["قوپان (Concavity)", "خاڵی وەرگەڕان", "تاقیکردنەوەی داتاشراوەی دووەم"],
        },
        {
          id: "m4-3",
          title: "کەرتی ٣-٤: ئامانجەکان لە بێپایاندا و لادانی ئاسۆیی",
          pages: "١٣٦ - ١٤٣",
          desc: "هەژمارکردنی lim_{x->±∞} f(x) بۆ نەخشە کەرتکراوەکان بە دابەشکردنی هەموو سنوورەکان بەسەر گەورەترین توان لە ژێرکەرت. هێڵی y = L لادانی ئاسۆییە (Horizontal Asymptote).",
          formula: "lim_{x->±∞} f(x) = L => y = L لادانی ئاسۆییە",
          keyPoints: ["ئامانج لە بێپایان", "لادانی ئاسۆیی", "پلەی سەرکەوت و ژێرکەوت"],
        },
        {
          id: "m4-4",
          title: "کەرتی ٤-٤: کێشانی ڕوونکردنەوەی نەخشەکان (Curve Sketching)",
          pages: "١٤٤ - ١٤٩",
          desc: "کۆکردنەوەی هەموو تایبەتمەندییەکانی نەخشە: بواری پێناسە، بڕینی تەوەرەکان، لادانی ستوونی و ئاسۆیی، ماوەکانی زیادبوون/کەمبوون، بەهاکانی کۆتایی، و خاڵی وەرگەڕان بۆ کێشانی نەخشە.",
          formula: "هەنگاوەکانی کێشانی وێنەی ڕوونکردنەوەیی گشتی",
          keyPoints: ["کێشانی چەماوە", "خشتەی گۆڕانەکان", "لادانەکان"],
        },
        {
          id: "m4-5",
          title: "کەرتی ٥-٤: کێشەکانی باشترین بەها (Optimization)",
          pages: "١٥٠ - ١٥٧",
          desc: "چارەسەرکردنی کێشە وزارییە کردارییەکان بۆ دۆزینەوەی گەورەترین ڕووبەر، گەورەترین قەبارە، یان کەمترین تێچوونی دروستکردن لە ڕێگەی هاوکێشەی سەرەکی و هاوکێشەی یارمەتیدەر.",
          formula: "نەخشەی ئامانج: f(x) => شیکاری f'(x) = 0",
          keyPoints: ["باشترین بەها", "گەورەترین ڕووبەر", "کەمترین تێچوون", "پشکنینی بەهاکان"],
        },
      ],
    },
    {
      num: 5,
      title: "بەشی ٥: تەواوکاری (Integration)",
      englishTitle: "Definite and Indefinite Integrals",
      pages: "١٥٨ - ١٨٥",
      pageStart: 158,
      pageEnd: 185,
      icon: Compass,
      summaryKu: "تەواوکاری بێسنوور وەک دژە داتاشراو، یاساکانی تەواوکاری، تەواوکاری سنووردار و تیۆرمی بنەڕەتی کالکولس، تەواوکاری بە شێوازی جێگرتنەوە (u-substitution)، و جێبەجێکردنەکانی تەواوکاری بۆ ڕووبەر و قەبارەی خولاو.",
      lessons: [
        {
          id: "m5-1",
          title: "کەرتی ١-٥: تەواوکاری بێسنوور (Indefinite Integral)",
          pages: "١٦٠ - ١٦٥",
          desc: "پێناسەی دژە داتاشراو. یاسای توان بۆ تەواوکاری: ∫ xⁿ dx = (xⁿ⁺¹)/(n + 1) + C بە مەرجێک n ≠ -1 بێت. نەگۆڕی تەواوکاری C و یاساکانی کۆکردنەوە و دەرکردن.",
          formula: "∫ xⁿ dx = (xⁿ⁺¹) / (n + 1) + C | ∫ k dx = kx + C",
          keyPoints: ["دژە داتاشراو", "نەگۆڕی تەواوکاری C", "یاسای توان"],
        },
        {
          id: "m5-2",
          title: "کەرتی ٢-٥: تەواوکاری سنووردار (Definite Integral)",
          pages: "١٦٦ - ١٧١",
          desc: "تیۆرمی بنەڕەتی کالکولس: ∫ₐᵇ f(x) dx = F(b) - F(a). خاسیەتەکانی تەواوکاری سنووردار: پێچەوانەکردنی سنوورەکان، دابەشکردنی ماوەکان، و بەستنەوەی بە ڕووبەری نێوان چەماوە و تەوەری x.",
          formula: "∫ₐᵇ f(x) dx = F(b) - F(a) | ∫ₐᵇ = -∫ᵦᵃ | ∫ₐᶜ = ∫ₐᵇ + ∫ᵦᶜ",
          keyPoints: ["تیۆرمی بنەڕەتی کالکولس (FTC)", "سنووری سەرەوە و خوارەوە", "ڕووبەری پاکی بن چەماوە"],
        },
        {
          id: "m5-3",
          title: "کەرتی ٣-٥: هەژمارکردنی تەواوکاری بە جێگرتنەوە",
          pages: "١٧٢ - ١٧٩",
          desc: "تەکنیکی u-substitution بۆ دۆزینەوەی تەواوکاری نەخشە لێکدراوەکان کاتێک بەشێکیان داتاشراوی بەشەکەی ترە. گۆڕینی سنوورەکانی تەواوکاری سنووردار بەپێی گۆڕاوی نوێی u.",
          formula: "∫ f(g(x)) · g'(x) dx = ∫ f(u) du | du = g'(x) dx",
          keyPoints: ["جێگرتنەوە (u-substitution)", "دیاریکردنی u و du", "گۆڕینی سنورەکان"],
        },
        {
          id: "m5-4",
          title: "کەرتی ٤-٥: جێبەجێکردنەکانی تەواوکاری (ڕووبەر و قەبارە)",
          pages: "١٨٠ - ١٨٥",
          desc: "ڕووبەری ناوچەی سنووردارکراوی نێوان دوو چەماوە: Area = ∫ₐᵇ [f(x) - g(x)] dx. قەبارەی تەنی خولاو لە دەوری تەوەرەکان بە ڕێگەی پەپکە Volume = π ∫ₐᵇ [R(x)]² dx.",
          formula: "Area = ∫ₐᵇ [سەرەوە - خوارەوە] dx | Volume = π ∫ₐᵇ [R(x)]² dx",
          keyPoints: ["ڕووبەری نێوان دوو چەماوە", "خاڵەکانی بڕین", "قەبارەی تەنی خولاو", "ڕێگەی پەپکە"],
        },
      ],
    },
    {
      num: 6,
      title: "بەشی ٦: بڕگە قووچەکییەکان (Conics)",
      englishTitle: "Conic Sections and Analytic Geometry",
      pages: "١٨٦ - ٢١٣",
      pageStart: 186,
      pageEnd: 213,
      icon: PieChart,
      summaryKu: "پێناسە ئەندازەیی و جەبرییەکانی بڕگەی هاوتا، بڕگەی ناتەواو، و بڕگەی زیاد. پۆلێنکردنی بڕگە قووچەکییەکان بە بەهای جیاوازی ناوەندی e و بەکارهێنانی جیاکەرەوەی B² - 4AC، و خولانەوەی تەوەرەکان بە گۆشەی θ.",
      lessons: [
        {
          id: "m6-1",
          title: "کەرتی ١-٦: بڕگە قووچەکییەکان و جۆرەکانیان",
          pages: "١٨٨ - ١٩٧",
          desc: "هاوکێشەی بڕگەی هاوتا (Parabola) بە چەقی (h, k) و تیشکۆ و دەرهێڵ. هاوکێشەی پێوانەیی بڕگەی ناتەواو (Ellipse) بە دوو تیشکۆ و تەوەرەی گەورە و بچووک. هاوکێشەی بڕگەی زیاد (Hyperbola) و دەرکەوتەکان (Asymptotes).",
          formula: "(x-h)² = 4p(y-k) | (x-h)²/a² + (y-k)²/b² = 1 | c² = a² - b²",
          keyPoints: ["بڕگەی هاوتا", "بڕگەی ناتەواو", "بڕگەی زیاد", "تیشکۆ و دەرهێڵ", "دەرکەوتە"],
        },
        {
          id: "m6-2",
          title: "کەرتی ٢-٦: پۆلێنکردنی بڕگە قووچەکییەکان",
          pages: "١٩٨ - ٢٠٥",
          desc: "پۆلێنکردن بەپێی جیاوازی ناوەندی: e = c/a. ئەگەر e = 1 بێت هاوتایە، 0 < e < 1 ناتەواوە، e > 1 زیادە. پۆلێنکردنی هاوکێشەی گشتی بە جیاکەرەوەی B² - 4AC.",
          formula: "e = c/a | B² - 4AC < 0 [ناتەواو] | B² - 4AC = 0 [هاوتا] | B² - 4AC > 0 [زیاد]",
          keyPoints: ["جیاوازی ناوەندی (e)", "جیاکەرەوەی گشتی", "پۆلێنکردنی بڕگەکان"],
        },
        {
          id: "m6-3",
          title: "کەرتی ٣-٦: هاوکێشە دووجایەکان بە دوو گۆڕاو و خولانەوە",
          pages: "٢٠٦ - ٢١٣",
          desc: "خولانەوەی تەوەرەکانی پۆوتان بە گۆشەی θ بۆ سڕینەوەی بڕگەی Bxy لە هاوکێشەی گشتی Ax² + Bxy + Cy² + Dx + Ey + F = 0 بە یاسای cot 2θ = (A - C) / B.",
          formula: "cot 2θ = (A - C) / B | x = x' cos θ - y' sin θ",
          keyPoints: ["خولانەوەی تەوەرەکان", "گۆشەی خولانەوە", "سڕینەوەی xy"],
        },
      ],
    },
    {
      num: 7,
      title: "بەشی ٧: ژمارە ئاوێتەکان و ئەندازە",
      englishTitle: "Complex Numbers and Geometry",
      pages: "٢١٤ - ٢٤٠",
      pageStart: 214,
      pageEnd: 240,
      icon: Layers,
      summaryKu: "یەکەی خەیاڵی i و توانەکانی، شێوەی جەبری a + bi، لێکدان و دابەشکردنی ژمارە ئاوێتەکان بە هاوتا، مۆدیول و شێوەی جەمسەری r(cos θ + i sin θ)، تیۆرمی دیمۆڤەر بۆ دۆزینەوەی توانەکان و ڕەگەکانی ژمارەی ئاوێتە، و ئەندازە لە تەختەی ئارگاند.",
      lessons: [
        {
          id: "m7-1",
          title: "کەرتی ١-٧: شێوە جیاوازەکانی ژمارەی ئاوێتە",
          pages: "٢١٦ - ٢٢٥",
          desc: "شێوەی جەبری z = a + bi، هاوتای ئاوێتە z̄ = a - bi، مۆدیول r = |z| = √(a² + b²)، گۆشەی سەرەکی θ = arctan(b/a)، و نووسینی شێوەی جەمسەری z = r(cos θ + i sin θ).",
          formula: "i² = -1 | z = a + bi | r = √(a² + b²) | z = r(cos θ + i sin θ)",
          keyPoints: ["یەکەی خەیاڵی i", "شێوەی جەبری", "هاوتا", "شێوەی جەمسەری (Polar)"],
        },
        {
          id: "m7-2",
          title: "کەرتی ٢-٧: ژمارە ئاوێتەکان و ئەندازە (تیۆرمی دیمۆڤەر)",
          pages: "٢٢٦ - ٢٤٠",
          desc: "تیۆرمی دیمۆڤەر: [r(cos θ + i sin θ)]ⁿ = rⁿ(cos nθ + i sin nθ). دۆزینەوەی n ڕەگی جیاوازی ژمارەی ئاوێتە و دابەشبوونیان بە شێوەی ئەندازەیی لەسەر بازنەیەک لە تەختەی ئارگاند.",
          formula: "[r(cos θ + i sin θ)]ⁿ = rⁿ(cos nθ + i sin nθ) | wₖ = ⁿ√r [cis((θ + 2kπ)/n)]",
          keyPoints: ["تیۆرمی دیمۆڤەر", "توانەکانی ژمارەی ئاوێتە", "ڕەگەکانی نۆیەم", "تەختەی ئارگاند"],
        },
      ],
    },
  ];

  const currentChapter =
    CHAPTERS_METADATA.find((ch) => ch.num === activeChapterIndex) || CHAPTERS_METADATA[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-7 shadow-xs space-y-6 text-right" dir="rtl">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-sans text-lg md:text-xl font-black text-slate-900 dark:text-white">
                پەڕتووکی فەرمیی بیرکاریی پۆلی ١٢ی زانستی
              </h2>
              <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                مەنهەجی ٢٤٠ لاپەڕەیی
              </span>
            </div>
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              وەزارەتی پەروەردەی حکومەتی هەرێمی کوردستان • چاپی فەرمی وەزاری (٧ بەش)
            </p>
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="گەڕان لە بابەت، یاسا و کەرتی بیرکاری..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          {searchQuery && (
            <button
              onClick={() => handleSearch("")}
              className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ─── Search Results Overlay ─────────────────────────────────────────── */}
      {searchQuery.trim().length > 0 && (
        <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              ئەنجامەکانی گەڕان بۆ «{searchQuery}» ({searchResults.length} کەرتی دۆزراوە)
            </span>
          </div>

          {searchResults.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
              هیچ ئەنجامێک لە پەڕتووکی بیرکاری نەدۆزرایەوە. وشەیەکی تر تاقی بکەرەوە (وەک: لێژ، ئامانج، داتاشراو، تەواوکاری، بڕگە، ئاوێتە).
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {searchResults.map((res, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-3 space-y-2 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-sans font-bold text-xs text-slate-900 dark:text-white">
                      {res.chapterTitleKurdish ? `${res.chapterTitleKurdish} • ${res.lessonTitleKurdish}` : res.lessonTitleKurdish}
                    </span>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 shrink-0 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                      ل {res.pageNumberStart} - {res.pageNumberEnd || res.pageNumberStart}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {res.contentSnippet}
                  </p>
                  <button
                    onClick={() =>
                      handleStudyClick(
                        `${res.chapterTitleKurdish} - ${res.lessonTitleKurdish}`,
                        `لاپەڕە ${res.pageNumberStart}`,
                        "بیرکارى_-_زانستى-پۆلی ١٢  .pdf"
                      )
                    }
                    className="w-full mt-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-1.5 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    خوێندن لە چات لەگەڵ مامۆستا زانا
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Chapter Selector Tabs (7 Chapters) ─────────────────────────────── */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
          هەڵبژاردنی بەندی مەنهەج (٧ بەشی سەرەکی):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {CHAPTERS_METADATA.map((ch) => {
            const Icon = ch.icon;
            const isActive = ch.num === activeChapterIndex;
            return (
              <button
                key={ch.num}
                onClick={() => setActiveChapterIndex(ch.num)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300"
                }`}
              >
                <Icon className={`w-5 h-5 mb-1.5 ${isActive ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`} />
                <span className="font-sans text-xs font-black leading-tight line-clamp-1">
                  بەشی {ch.num}
                </span>
                <span className={`text-[10px] mt-0.5 line-clamp-1 ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
                  ل {ch.pages}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Active Chapter Showcase ────────────────────────────────────────── */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700 pb-3">
          <div>
            <h3 className="font-sans text-base md:text-lg font-black text-slate-900 dark:text-white">
              {currentChapter.title}
            </h3>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
              {currentChapter.englishTitle} • پەڕەکانی کتێب: {currentChapter.pages}
            </span>
          </div>
          <button
            onClick={() =>
              handleStudyClick(
                currentChapter.title,
                `لاپەڕە ${currentChapter.pages}`,
                "پەڕتووکی بیرکاری"
              )
            }
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            شیکاری تەواوی ئەم بەشە لە چات
          </button>
        </div>

        <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {currentChapter.summaryKu}
        </p>

        {/* ─── Lessons List in Current Chapter ─────────────────────────────────── */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
            کەرت و وانەکانی ئەم بەندە ({currentChapter.lessons.length} وانەی ڕێپێدراو):
          </span>

          <div className="space-y-2.5">
            {currentChapter.lessons.map((lesson) => {
              const isExpanded = expandedSectionId === lesson.id;
              return (
                <div
                  key={lesson.id}
                  className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    onClick={() => setExpandedSectionId(isExpanded ? null : lesson.id)}
                    className="w-full p-4 flex items-center justify-between text-right cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                        <Bookmark className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-sans text-xs md:text-sm font-bold text-slate-900 dark:text-white block">
                          {lesson.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          لاپەڕەکانی کتێب: {lesson.pages}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hidden sm:inline">
                        {isExpanded ? "داخستن" : "وردەکاری و یاساکان"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/80 space-y-3">
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                        {lesson.desc}
                      </p>

                      {/* Formula Box */}
                      {lesson.formula && (
                        <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 rounded-xl p-3 space-y-1">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block uppercase">
                            یاسا و هاوکێشە سەرەکییەکان:
                          </span>
                          <div className="font-mono text-xs font-bold text-slate-900 dark:text-white dir-ltr text-left">
                            {lesson.formula}
                          </div>
                        </div>
                      )}

                      {/* Key Concepts Pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {lesson.keyPoints.map((kp, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            {kp}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() =>
                            handleStudyClick(
                              lesson.title,
                              `لاپەڕە ${lesson.pages}`,
                              currentChapter.title
                            )
                          }
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          پرسیارکردن لەسەر ئەم وانەیە لەگەڵ زانا
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
