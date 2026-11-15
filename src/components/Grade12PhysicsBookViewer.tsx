import React, { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Flame,
  Zap,
  Layers,
  Bookmark,
  Compass,
  Eye,
  Activity,
  Cpu,
} from "lucide-react";
import { CurriculumIndexService } from "../curriculum/retrieval/CurriculumIndexService.ts";
import { CurriculumEvidence } from "../curriculum/retrieval/CurriculumEvidence.ts";

interface Grade12PhysicsBookViewerProps {
  onSelectTopicForStudy?: (topicTitle: string, pageRange: string, partName: string) => void;
  onNavigateToChat?: () => void;
}

export const Grade12PhysicsBookViewer: React.FC<Grade12PhysicsBookViewerProps> = React.memo(({
  onSelectTopicForStudy,
  onNavigateToChat,
}) => {
  const [activeUnitIndex, setActiveUnitIndex] = useState<number>(1);
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
      subject: "physics",
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

  // 5 Thematic Sections covering the 9 Official Chapters
  const UNITS_METADATA = [
    {
      unitIndex: 1,
      unitTitle: "بەشی یەکەم: میکانیک و لەرینەوە",
      pageStart: 8,
      pageEnd: 65,
      icon: Activity,
      summaryKu: "بزووتنی خولاو، هێزی ناوەندەکی، یاسای کێشکردنی نیوتن، یاساکانی کێپلەر بۆ هەسارەکان، یاسای هۆک و شەپۆلەکان.",
      chapters: [
        {
          num: 1,
          title: "بەندی ١: بزووتنی خولاو و کێشکردن",
          pages: "٨ - ٣٥",
          lessons: [
            {
              id: "p1-1",
              title: "کەرتی ١-١: بزووتنی خولاو",
              pages: "٨ - ١٨",
              desc: "خێرایی تەماسەکی (vt = r·ω)، تاودانی ناوەندەکی (ac = vt²/r)، و هێزی ناوەندەکی (Fc = m·vt²/r). کاتێک هێزی ناوەندەکی نامێنێت، تەنەکە بە ئاڕاستەی هێڵی تەماسەکی لەسەر هێڵێکی ڕاست لادەدات.",
              formula: "ac = vt² / r = r · ω²  |  Fc = m · vt² / r",
              keyPoints: ["خێرایی تەماسەکی", "تاودانی ناوەندەکی", "هێزی ناوەندەکی", "خولاوێتی"],
            },
            {
              id: "p1-2",
              title: "کەرتی ٢-١: یاسای کێشکردنی گەردوونی نیوتن",
              pages: "١٩ - ٢٧",
              desc: "هەموو تەنێک لە گەردووندا تەنێکی تر ڕادەکێشێت بە هێزێک کە ڕاستەوانە دەگۆڕێت لەگەڵ لێکدانی بارستەکانیان و پێچەوانە لەگەڵ دووجای دووری نێوانیان. تاودانی کێشکردن (g = G·M/r²) و کێشی دیار لە کاتی کەوتنی ئازاد.",
              formula: "Fg = G · (m1 · m2) / r²  |  G = 6.673 × 10⁻¹¹ N·m²/kg²",
              keyPoints: ["نەگۆڕی کێشکردن G", "کێشی دیار", "بێ کێشی لە خولگەدا", "تاودانی کێشکردن"],
            },
            {
              id: "p1-3",
              title: "کەرتی ٣-١: بزووتنی لە بۆشاییدا و یاساکانی کێپلەر",
              pages: "٢٨ - ٣٥",
              desc: "یاساکانی یەکەم (خولگەی هێلکەیی)، دووەم (ڕووبەری یەکسان لە کاتی یەکساندا)، و سێیەمی کێپلەر (T² = [4π²/GM]·r³). هاوکێشەی خێرایی خولانەوەی مانگە دەستکردەکان.",
              formula: "T² = (4π² / (G · M)) · r³  |  v = √(G · M / r)",
              keyPoints: ["یاساکانی کێپلەر", "خولگەی هێلکەیی", "مانگی دەستکرد", "خولی خولانەوە T"],
            },
          ],
        },
        {
          num: 2,
          title: "بەندی ٢: بزووتنی لەرینەوەیی و شەپۆلەکان",
          pages: "٣٦ - ٦٥",
          lessons: [
            {
              id: "p2-1",
              title: "کەرتی ١-٢: یاسای هۆک و بزووتنی ڕێکی سادە",
              pages: "٣٦ - ٤٤",
              desc: "یاسای هۆک (F = -kx)، نەگۆڕی بەستەر k (N/m). بزووتنی ڕێکی سادە (SHM): لە خاڵی هاوسەنگیدا خێرایی ئەوپەڕە و تاودان سفرە؛ لە ئەوپەڕی لاداندا تاودان ئەوپەڕە و خێرایی سفرە.",
              formula: "Felastic = -k · x  |  PEelastic = ½ · k · x²",
              keyPoints: ["یاسای هۆک", "نەگۆڕی بەستەر k", "پانتایی لەرینەوە", "خاڵی هاوسەنگی"],
            },
            {
              id: "p2-2",
              title: "کەرتی ٢-٢: پێوانەکردنی بزووتنی ڕێکی سادە",
              pages: "٤٥ - ٥٢",
              desc: "پەیوەندی نێوان خول و لەرەلەر (f = 1/T). خولی پەندۆڵی سادە (T = 2π√(L/g)) کە تەنها بەندە بە درێژی پەندۆڵ و تاودانی کێشکردن. خولی سیستەمی بارستە-بەستەر (T = 2π√(m/k)).",
              formula: "T = 2π · √(L / g)  |  T = 2π · √(m / k)  |  f = 1 / T",
              keyPoints: ["خولی پەندۆڵی سادە", "لەرەلەر f", "سیستەمی بارستە-بەستەر"],
            },
            {
              id: "p2-3",
              title: "کەرتی ٣-٢: ڕەوشە بنەڕەتییەکانی شەپۆل",
              pages: "٥٣ - ٥٩",
              desc: "شەپۆلی میکانیکی و کارۆموگناتیسی. جیاوازی نێوان شەپۆلی تەنیشتی (لوتکە و بنک) و شەپۆلی درێژەکی (چڕبوونەوە و تەنکبوونەوە وەک شەپۆلی دەنگ). هاوکێشەی خێرایی شەپۆل: v = f·λ.",
              formula: "v = f · λ",
              keyPoints: ["درێژی شەپۆل λ", "شەپۆلی تەنیشتی", "شەپۆلی درێژەکی", "خێرایی شەپۆل"],
            },
            {
              id: "p2-4",
              title: "کەرتی ٤-٢: دەستێوەردان و وەستانی شەپۆلەکان",
              pages: "٦٠ - ٦٥",
              desc: "سەرخستنی شەپۆلەکان، دەستێوەردانی بنیاتنەر و ڕووخێنەر. شەپۆلی وەستاو (standing wave) کە لە گرێ (nodes - لادانی سفر) و دژەگرێ (antinodes - ئەوپەڕی لادان) پێکدێت.",
              formula: "L = n · (λ / 2) (بۆ وەستانی دووسەر جێگیر)",
              keyPoints: ["سەرخستنی شەپۆل", "دەستێوەردانی بنیاتنەر", "گرێ و دژەگرێ", "شەپۆلی وەستاو"],
            },
          ],
        },
      ],
    },
    {
      unitIndex: 2,
      unitTitle: "بەشی دووەم: ڕووناکی و شەپۆلە بینراوەکان",
      pageStart: 66,
      pageEnd: 131,
      icon: Eye,
      summaryKu: "ڕەوشەکانی ڕووناکی، ئاوێنەی تەخت و گۆیی، یاسای سنێڵ، هاوێنەکان، تاقیکردنەوەی دووکەلێنی یۆنگ، لادانی ڕووناکی و لێزەر.",
      chapters: [
        {
          num: 3,
          title: "بەندی ٣: ڕووناکی و ئاوێنە و هاوێنەکان",
          pages: "٦٦ - ١٠١",
          lessons: [
            {
              id: "p3-1",
              title: "کەرتی ١-٣: تایبەتمەندی ڕووناکی و ئاوێنەی تەخت",
              pages: "٦٦ - ٧٤",
              desc: "شەپۆلی کارۆموگناتیسی و خێرایی ڕووناکی (c = 3.00 × 10⁸ m/s). یاسای دانەوە (θ = θ'). لە ئاوێنەی تەختدا وێنە هەمیشە خەیاڵییە، ڕاستە و قەبارەکەی هاوتایە.",
              formula: "c = f · λ  |  θ = θ'",
              keyPoints: ["خێرایی ڕووناکی c", "یاسای دانەوە", "ئاوێنەی تەخت", "وێنەی خەیاڵی"],
            },
            {
              id: "p3-2",
              title: "کەرتی ٢-٣: ئاوێنە گۆییەکان (قوپاو و چەقاو)",
              pages: "٧٥ - ٨٥",
              desc: "هاوکێشەی ئاوێنەکان (1/p + 1/q = 1/f) و گەورەکردن (M = -q/p). ئاوێنەی قوپاو بۆ کۆکردنەوە و ئاوێنەی چەقاو بۆ وێنەی هەمیشە خەیاڵی و بچووککراوە.",
              formula: "1/p + 1/q = 1/f  |  M = -q / p  |  f = R / 2",
              keyPoints: ["ئاوێنەی قوپاو", "ئاوێنەی چەقاو", "دووری فۆکەس f", "گەورەکردن M"],
            },
            {
              id: "p3-3",
              title: "کەرتی ٣-٣: شکانی ڕووناکی و یاسای سنێڵ",
              pages: "٨٦ - ٩٣",
              desc: "ڕێژەی شکانی ماددە (n = c/v). یاسای سنێڵ (n1·sinθ1 = n2·sinθ2). گۆشەی قەتیسبوون (sinθc = n2/n1) و دانەوەی تەواوی ناوەکی لە فایبەری بیناییدا.",
              formula: "n = c / v  |  n1 · sinθ1 = n2 · sinθ2  |  sinθc = n2 / n1",
              keyPoints: ["یاسای سنێڵ", "ڕێژەی شکان n", "گۆشەی قەتیسبوون", "فایبەری بینایی"],
            },
            {
              id: "p3-4",
              title: "کەرتی ٤-٣: هاوێنە تەنکەکان و چارەسەری کێشەکانی بینین",
              pages: "٩٤ - ١٠١",
              desc: "هاوێنەی کۆکەرەوە (قۆقز - f ئەرێنی) و بڵاوکەرەوە (قوپاو - f نەرێنی). چارەسەرکردنی کورت‌بینی (بڵاوکەرەوە) و دووربینی (کۆکەرەوە).",
              formula: "1/p + 1/q = 1/f  |  M = -q / p",
              keyPoints: ["هاوێنەی کۆکەرەوە", "هاوێنەی بڵاوکەرەوە", "کورت‌بینی", "دووربینی"],
            },
          ],
        },
        {
          num: 4,
          title: "بەندی ٤: دەستێوەردان و لادانی ڕووناکی",
          pages: "١٠٢ - ١٣١",
          lessons: [
            {
              id: "p4-1",
              title: "کەرتی ١-٤: دەستێوەردان لە ڕووناکیدا (تاقیکردنەوەی یۆنگ)",
              pages: "١٠٢ - ١١٢",
              desc: "ڕووناکی هاوئاهەنگ (coherent) و یەکڕەنگ. تاقیکردنەوەی یۆنگ: پەڵەی ڕووناک (d·sinθ = m·λ) و پەڵەی تاریک (d·sinθ = [m+½]·λ).",
              formula: "d · sinθ = m · λ  |  y = (m · λ · L) / d",
              keyPoints: ["تاقیکردنەوەی یۆنگ", "ڕووناکی هاوئاهەنگ", "پەڵەی ڕووناک", "پەڵەی تاریک"],
            },
            {
              id: "p4-2",
              title: "کەرتی ٢-٤: لادانی ڕووناکی و تۆڕی لادان",
              pages: "١١٣ - ١٢٢",
              desc: "دیاردەی چەمانەوەی ڕووناکی لە لێواری بەربەستەکان. تۆڕی لادان (diffraction grating) بە هەزاران کەلێنی تەریب (d = 1/N).",
              formula: "d · sinθ = m · λ  |  d = 1 / N",
              keyPoints: ["لادانی ڕووناکی", "تۆڕی لادان", "شیبوونەوەی سپێکتڕەم"],
            },
            {
              id: "p4-3",
              title: "کەرتی ٣-٤: لێزەرەکان و بەکارهێنانەکانیان",
              pages: "١٢٣ - ١٣١",
              desc: "دەردانی هاندراو (stimulated emission)، تایبەتمەندییەکانی تیشکی لێزەر (هاوئاهەنگ، یەکڕەنگ، ئاراستەدار) و پێچەوانەبوونی دانیشتووان لە تەلەفۆتۆدا.",
              formula: "E = h · f  |  h = 6.626 × 10⁻³⁴ J·s",
              keyPoints: ["تیشکی لێزەر", "دەردانی هاندراو", "تیشکی هاوئاهەنگ", "پێچەوانەبوونی دانیشتووان"],
            },
          ],
        },
      ],
    },
    {
      unitIndex: 3,
      unitTitle: "بەشی سێیەم: کارەبا و توانست",
      pageStart: 132,
      pageEnd: 201,
      icon: Zap,
      summaryKu: "بارگەی کارەبایی، یاسای کۆڵۆم، بواری کارەبایی، جیاوازی پۆتەنشیال، توانست و چڕکەرەوەکان لە بەستنی سەر یەک و تەریبدا.",
      chapters: [
        {
          num: 5,
          title: "بەندی ٥: هێزی کارەبایی و بوارەکان",
          pages: "١٣٢ - ١٥٥",
          lessons: [
            {
              id: "p5-1",
              title: "کەرتی ١-٥: بارگەی کارەبایی و گەیەنەرەکان",
              pages: "١٣٢ - ١٣٩",
              desc: "پاراستنی بارگە و کوانتای بارگەی کارەبایی (q = N·e). جیاوازی بنەڕەتی نێوان گەیەنەر، نەگەیەنەر و بارگاویکردن بە هاندان.",
              formula: "q = N · e  |  e = 1.602 × 10⁻¹⁹ C",
              keyPoints: ["پاراستنی بارگە", "بارگەی بنەڕەتی e", "گەیەنەر", "بارگاویکردن بە هاندان"],
            },
            {
              id: "p5-2",
              title: "کەرتی ٢-٥: یاسای کۆڵۆم",
              pages: "١٤٠ - ١٤٧",
              desc: "هێزی کارەبایی نێوان دوو بارگەی خاڵی (Fe = kc·|q1·q2|/r²). ڕاکێشان یان پاڵپێوەنان بەپێی جۆری بارگەکان و سەرخستنی ئاڕاستەبڕی هێزەکان.",
              formula: "Fe = kc · (|q1 · q2|) / r²  |  kc = 8.99 × 10⁹ N·m²/C²",
              keyPoints: ["یاسای کۆڵۆم", "نەگۆڕی کۆڵۆم kc", "هێزی ڕاکێشان و پاڵپێوەنان"],
            },
            {
              id: "p5-3",
              title: "کەرتی ٣-٥: بواری کارەبایی",
              pages: "١٤٨ - ١٥٥",
              desc: "پێناسەی کایەی کارەبایی (E = Fe/q0 = kc·q/r²). هێڵەکانی کایەی کارەبایی و تایبەتمەندییەکانیان، کایەی یەکگرتوو و کایە لە ناوەوەی گەیەنەرێکی هاوسەنگدا کە یەکسانە بە صفر.",
              formula: "E = Fe / q0  |  E = kc · q / r² (N/C)",
              keyPoints: ["بواری کارەبایی E", "هێڵەکانی کایە", "کایەی یەکگرتوو", "گەیەنەری هاوسەنگ"],
            },
          ],
        },
        {
          num: 6,
          title: "بەندی ٦: وزەی کارەبایی و توانست",
          pages: "١٥٦ - ٢٠١",
          lessons: [
            {
              id: "p6-1",
              title: "کەرتی ١-٦: جیاوازی پۆتەنشیالی کارەبایی",
              pages: "١٥٦ - ١٦٩",
              desc: "وزەی مەڵاسی کارەبایی (ΔPEe = -q·E·d). پێناسەی جیاوازی پۆتەنشیال (ΔV = ΔPE/q = -E·d) بە یەکەی ڤۆڵت (V = J/C). پۆتەنشیال لە دەوری بارگەی خاڵی (V = kc·q/r).",
              formula: "ΔV = ΔPE / q  |  ΔV = -E · d  |  V = kc · q / r",
              keyPoints: ["جیاوازی پۆتەنشیال", "ڤۆڵت V", "وزەی مەڵاسی کارەبایی", "ڕووی یەکسان پۆتەنشیال"],
            },
            {
              id: "p6-2",
              title: "کەرتی ٢-٦: توانست و چڕکەرەوەکان",
              pages: "١٧٠ - ١٨٤",
              desc: "توانستی چڕکەرەوە (C = Q/ΔV) بە یەکەی فاراد (F). چڕکەرەوەی تەختە تەریبەکان (C = ε0·A/d) و کاریگەری ماددەی دی‌ئەلیکتریک لە زیادکردنی توانستدا (C = κ·C0).",
              formula: "C = Q / ΔV  |  C = ε0 · A / d  |  C = κ · ε0 · A / d",
              keyPoints: ["توانست C", "فاراد Farad", "چڕکەرەوە", "ماددەی دی‌ئەلیکتریک κ"],
            },
            {
              id: "p6-3",
              title: "کەرتی ٣-٦: بەستنی چڕکەرەوەکان و وزەی پاشەکەوتوو",
              pages: "١٨٥ - ٢٠١",
              desc: "بەستنی تەریب (Ceq = C1 + C2 + ...) بەرامبەر بەستنی سەر یەک (1/Ceq = 1/C1 + 1/C2 + ...). وزەی پاشەکەوتکراو لە کایەی کارەبایی چڕکەرەوەدا: PE = ½·C·(ΔV)².",
              formula: "PE = ½ · Q · ΔV = ½ · C · (ΔV)² = Q² / (2C)",
              keyPoints: ["چڕکەرەوەی سەر یەک", "چڕکەرەوەی تەریب", "توانستی هاوتا", "وزەی پاشەکەوتوو"],
            },
          ],
        },
      ],
    },
    {
      unitIndex: 4,
      unitTitle: "بەشی چوارەم: تەزوو، بەرگری و بازنە کارەباییەکان",
      pageStart: 202,
      pageEnd: 253,
      icon: Cpu,
      summaryKu: "تەزووی کارەبایی، خێرایی ڕاماڵین، یاسای ئۆم، بەرگری تایبەتی، توانای کارەبایی، بەستنی سەر یەک و تەریب، و یاساکانی کیرشۆف.",
      chapters: [
        {
          num: 7,
          title: "بەندی ٧: تەزووی کارەبایی و بەرگری",
          pages: "٢٠٢ - ٢٢٧",
          lessons: [
            {
              id: "p7-1",
              title: "کەرتی ١-٧: تەزووی کارەبایی و خێرایی ڕاماڵین",
              pages: "٢٠٢ - ٢١٠",
              desc: "تەزووی کارەبایی (I = ΔQ/Δt) بە یەکەی ئەمپێر (A = C/s). تەزووی ئاسایی لە جەمسەری ئەرێنی بۆ نەرێنی. خێرایی ڕاماڵینی ئەلیکترۆنەکان لە کاتی بوونی بواری کارەباییدا.",
              formula: "I = ΔQ / Δt  |  1 A = 1 C/s",
              keyPoints: ["تەزووی کارەبایی I", "ئەمپێر", "تەزووی ئاسایی", "خێرایی ڕاماڵین"],
            },
            {
              id: "p7-2",
              title: "کەرتی ٢-٧: یاسای ئۆم و بەرگری تایبەتی",
              pages: "٢١١ - ٢١٩",
              desc: "یاسای ئۆم (R = ΔV/I) بە یەکەی ئۆم (Ω). هۆکارەکانی بەرگری: درێژی تەل L، ڕووبەری بڕگە A، جۆری ماددە (بەرگری تایبەتی ρ)، و پلەی گەرمی: R = ρ·(L/A).",
              formula: "R = ΔV / I  |  R = ρ · L / A",
              keyPoints: ["یاسای ئۆم", "بەرگری R", "ئۆم Ω", "بەرگری تایبەتی ρ"],
            },
            {
              id: "p7-3",
              title: "کەرتی ٣-٧: توانای کارەبایی و گەرمی جوول",
              pages: "٢٢٠ - ٢٢٧",
              desc: "توانای کارەبایی (P = I·ΔV = I²R = [ΔV]²/R) بە یەکەی وات (W). بەفیڕۆچوونی وزە وەک گەرمی لە گەیەنەرەکاندا و حیسابکردنی وزە بە کیلۆوات-کاتژمێر (kWh).",
              formula: "P = I · ΔV = I² · R = (ΔV)² / R  |  E = P · t",
              keyPoints: ["توانای کارەبایی P", "وات Watt", "گەرمی جوول I²R", "کیلۆوات-کاتژمێر"],
            },
          ],
        },
        {
          num: 8,
          title: "بەندی ٨: بازنەکانی تەزووی کارەبایی",
          pages: "٢٢٨ - ٢٥٣",
          lessons: [
            {
              id: "p8-1",
              title: "کەرتی ١-٨: بەستنی سەر یەک لە بەرگرییەکاندا",
              pages: "٢٢٨ - ٢٣٦",
              desc: "تەزوو لە هەموو بەرگرییەکاندا یەکسانە (I = I1 = I2). پۆتەنشیال کۆدەکرێتەوە (ΔV = ΔV1 + ΔV2). بەرگری هاوتا (Req = R1 + R2 + ...) هەمیشە گەورەترە لە گەورەترین بەرگری بەشدار.",
              formula: "Req = R1 + R2 + R3 + ...  |  ΔV = ΔV1 + ΔV2 + ...",
              keyPoints: ["بەستنی سەر یەک", "بەرگری هاوتا Req", "تەزووی یەکسان"],
            },
            {
              id: "p8-2",
              title: "کەرتی ٢-٨: بەستنی تەریب لە بەرگرییەکاندا",
              pages: "٢٣٧ - ٢٤٤",
              desc: "پۆتەنشیال یەکسانە (ΔV = ΔV1 = ΔV2). تەزوو دابەش دەبێت (I = I1 + I2). بەرگری هاوتا: 1/Req = 1/R1 + 1/R2 + ... هەمیشە بچووکترە لە بچووکترین بەرگری. بەستنی ماڵان هەمیشە بە تەریبە.",
              formula: "1/Req = 1/R1 + 1/R2 + ...  |  Req = (R1 · R2) / (R1 + R2)",
              keyPoints: ["بەستنی تەریب", "بەرگری هاوتا لە تەریبدا", "بەستنی ماڵان"],
            },
            {
              id: "p8-3",
              title: "کەرتی ٣-٨: بازنە لێکدراوەکان و یاساکانی کیرشۆف",
              pages: "٢٤٥ - ٢٥٣",
              desc: "شیکارکردنی بازنە ئاڵۆزەکان. یاسای گرێکان (ΣIin = ΣIout - پاراستنی بارگە) و یاسای ئەڵقەکان (ΣΔV = 0 - پاراستنی وزە).",
              formula: "ΣIin = ΣIout  |  ΣΔV = 0",
              keyPoints: ["یاساکانی کیرشۆف", "یاسای گرێکان", "یاسای ئەڵقەکان", "پاراستنی وزە و بارگە"],
            },
          ],
        },
      ],
    },
    {
      unitIndex: 5,
      unitTitle: "بەشی پێنجەم: کارۆموگناتیسی و هاندانی کارەبایی",
      pageStart: 254,
      pageEnd: 306,
      icon: Compass,
      summaryKu: "بواری موگناتیسی، هێزی موگناتیسی لەسەر بارگە، یاسای فارادای بۆ هاندانی کارۆموگناتیسی، لێشاوی موگناتیسی، یاسای لێنز، مۆلیدە و ترانسفۆرمەر.",
      chapters: [
        {
          num: 9,
          title: "بەندی ٩: موگناتیسی و هاندانی کارۆموگناتیسی",
          pages: "٢٥٤ - ٢٨٠",
          lessons: [
            {
              id: "p9-1",
              title: "کەرتی ١-٩: بواری موگناتیسی و هێز لەسەر بارگە",
              pages: "٢٥٤ - ٢٦٣",
              desc: "جەمسەرەکانی موگناتیس (N و S). هێزی موگناتیسی لەسەر بارگەی جووڵاو: F = q·v·B·sinθ بە یەکەی تێسلا (T). دیاریکردنی ئاراستەی هێز بە یاسای دەستی ڕاست.",
              formula: "F = q · v · B · sinθ  |  F = I · L · B · sinθ",
              keyPoints: ["بواری موگناتیسی B", "تێسلا Tesla", "هێزی موگناتیسی", "یاسای دەستی ڕاست"],
            },
            {
              id: "p9-2",
              title: "کەرتی ٢-٩: هاندانی کارۆموگناتیسی و یاسای فارادای",
              pages: "٢٦٤ - ٢٧١",
              desc: "لێشاوی موگناتیسی (Φ = B·A·cosθ) بە یەکەی وێبەر (Wb). یاسای فارادای: هێزی دژەبزوێنەری هێنراو emf = -N·(ΔΦ/Δt). هۆکارەکانی پەیدابوونی تەزووی هێنراو لە گەیەنەردا.",
              formula: "Φ = B · A · cosθ  |  emf = -N · (ΔΦ / Δt)",
              keyPoints: ["لێشاوی موگناتیسی Φ", "وێبەر Weber", "یاسای فارادای", "هێزی دژەبزوێنەری هێنراو emf"],
            },
            {
              id: "p9-3",
              title: "کەرتی ٣-٩: یاسای لێنز، مۆلیدە و ترانسفۆرمەر",
              pages: "٢٧٢ - ٢٨٠",
              desc: "یاسای لێنز بۆ دیاریکردنی ئاراستەی تەزووی هێنراو (دژایەتی گۆڕانی لێشاو). مۆلیدەی کارەبایی و ترانسفۆرمەر (Vp/Vs = Np/Ns و Is/Ip = Np/Ns).",
              formula: "Vp / Vs = Np / Ns  |  Vp · Ip = Vs · Is",
              keyPoints: ["یاسای لێنز", "مۆلیدەی کارەبا", "ترانسفۆرمەری بەرزکەرەوە و نزمکەرەوە"],
            },
          ],
        },
      ],
    },
  ];

  const activeUnit = UNITS_METADATA.find((u) => u.unitIndex === activeUnitIndex) || UNITS_METADATA[0];

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Textbook Header Banner */}
      <div className="bg-gradient-to-l from-indigo-700 via-indigo-600 to-indigo-800 text-white rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                مەنهەجی فەرمی وەزارەت
              </span>
              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                پۆلی ١٢ی زانستی
              </span>
            </div>
            <h3 className="font-sans text-lg font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-300" />
              <span>پەڕتووکی فیزیا - زانست بۆ هەمووان (٩ بەند)</span>
            </h3>
            <p className="font-sans text-xs text-indigo-100 max-w-xl leading-relaxed">
              پەڕتووکی دەستکاری نەکراوی وەزارەتی پەروەردە (٣٠٦ لاپەڕەی تەواو). هەموو بەند و کەرتەکان، هاوکێشەکان و پێناسە یاساییەکان ئامادەکراون بۆ شیکاری و ڕاهێنان.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-center">
              <span className="block font-sans text-xs font-black text-amber-300">٣٠٦ لاپەڕە</span>
              <span className="text-[10px] text-indigo-100 font-medium">٩ بەندی فەرمی</span>
            </div>
          </div>
        </div>

        {/* Live Curriculum Search */}
        <div className="relative pt-1 z-10">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="گەڕان لەناو یاساکان و چەمکەکانی فیزیا (وەک: یاسای ئۆم، کۆڵۆم، فارادای، کەرتەکان)..."
              className="w-full bg-white/95 text-slate-900 placeholder:text-slate-400 rounded-2xl py-2.5 pr-10 pl-4 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
          </div>

          {/* Instant Search Results Dropdown */}
          {searchQuery.trim() && searchResults.length > 0 && (
            <div className="mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 space-y-2 max-h-72 overflow-y-auto">
              <span className="font-sans text-[10px] font-bold text-slate-400 px-2 block">
                {searchResults.length} ئەنجامی فەرمی لە پەڕتووکی فیزیا دۆزرایەوە:
              </span>
              {searchResults.map((ev, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-xs text-indigo-800">
                      {ev.chapterTitleKurdish} • {ev.lessonTitleKurdish}
                    </span>
                    <span className="font-sans text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                      لاپەڕە {ev.pageNumberStart}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-slate-600 line-clamp-2">
                    {ev.contentSnippet}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-sans text-[10px] text-slate-400">
                      {ev.keywords?.slice(0, 3).join(" • ") || "پەیوەندیدار"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleStudyClick(
                          `${ev.chapterTitleKurdish} - ${ev.lessonTitleKurdish}`,
                          `لاپەڕە ${ev.pageNumberStart}`,
                          "فیزیا_پۆلی_١٢.pdf"
                        )
                      }
                      className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>لەم بابەتە لەگەڵ زانا بخوێنە</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thematic Unit Switcher (5 Units) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            بەشێک هەڵبژێرە بۆ بینینی بەند و کەرت و هاوکێشەکانی:
          </span>
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>بەشە سەرەکییەکانی مەنهەج:</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {UNITS_METADATA.map((u) => {
            const isActive = u.unitIndex === activeUnitIndex;
            const UnitIcon = u.icon;
            return (
              <button
                key={u.unitIndex}
                type="button"
                onClick={() => setActiveUnitIndex(u.unitIndex)}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    بەشی {u.unitIndex}
                  </span>
                  <UnitIcon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                </div>
                <p className={`font-bold text-xs leading-tight ${isActive ? "text-white" : "text-slate-900"}`}>
                  ل. {u.pageStart} تا {u.pageEnd}
                </p>
                <p className={`text-[10px] mt-1 truncate ${isActive ? "text-indigo-100" : "text-slate-500"}`}>
                  {u.unitTitle.replace("بەشی یەکەم: ", "").replace("بەشی دووەم: ", "").replace("بەشی سێیەم: ", "").replace("بەشی چوارەم: ", "").replace("بەشی پێنجەم: ", "")}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Unit Overview & Chapters */}
      <div className="border border-slate-200 bg-white rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold text-indigo-600">
              لاپەڕە {activeUnit.pageStart} تا {activeUnit.pageEnd}
            </span>
            <h4 className="font-sans text-base font-bold text-slate-900 mt-0.5">
              {activeUnit.unitTitle}
            </h4>
            <p className="font-sans text-xs text-slate-500 mt-1">
              {activeUnit.summaryKu}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              {activeUnit.pageEnd - activeUnit.pageStart + 1} لاپەڕە
            </span>
          </div>
        </div>

        {/* Chapters inside this Unit */}
        <div className="space-y-4">
          {activeUnit.chapters.map((ch) => (
            <div
              key={ch.num}
              className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-700 font-bold bg-indigo-100/70 px-2.5 py-0.5 rounded-md">
                  لاپەڕە {ch.pages}
                </span>
                <h5 className="font-sans font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  <span>{ch.title}</span>
                </h5>
              </div>

              {/* Lessons / Sections inside this chapter */}
              <div className="space-y-2">
                {ch.lessons.map((les) => {
                  const isExpanded = expandedSectionId === les.id;
                  return (
                    <div
                      key={les.id}
                      className="bg-white border border-slate-200/80 rounded-xl overflow-hidden transition-all shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedSectionId(isExpanded ? null : les.id)}
                        className="w-full p-3.5 flex items-center justify-between text-right hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                          <div>
                            <span className="font-sans font-bold text-xs text-slate-800 block">
                              {les.title}
                            </span>
                            <span className="font-sans text-[10px] text-slate-400">
                              لاپەڕە {les.pages}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-indigo-600 hover:underline">
                            {isExpanded ? "داخستن" : "پوختە و هاوکێشە"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
                          <p className="font-sans text-xs text-slate-600 leading-relaxed">
                            {les.desc}
                          </p>

                          {/* Key Formula Box */}
                          {les.formula && (
                            <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-1">
                              <span className="font-sans text-[10px] font-bold text-indigo-600 block">
                                هاوکێشە و یاسای سەرەکی:
                              </span>
                              <p className="font-mono text-xs font-bold text-slate-800" dir="ltr">
                                {les.formula}
                              </p>
                            </div>
                          )}

                          {/* Key Points Badges */}
                          {les.keyPoints && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {les.keyPoints.map((kp, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5 text-indigo-600" />
                                  <span>{kp}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                handleStudyClick(
                                  `${ch.title} - ${les.title}`,
                                  `لاپەڕە ${les.pages}`,
                                  "فیزیا-پۆلی ١٢ زانستی.pdf"
                                )
                              }
                              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>دەستپێکردنی گفتوگۆ و شیکاری لەگەڵ زانا</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
