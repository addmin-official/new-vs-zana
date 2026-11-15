import React, { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Layers,
  Activity,
  Trophy
} from "lucide-react";

interface Grade12SportsBookViewerProps {
  onSelectTopicForStudy?: (topicTitle: string, pageRange: string, partName: string) => void;
  onNavigateToChat?: () => void;
}

interface ChapterLesson {
  id: string;
  title: string;
  page: string;
  summary: string;
  part: 1 | 2;
  keyPoints?: string[];
  officialRule?: string;
}

interface BookSection {
  partIndex: number;
  title: string;
  subtitle: string;
  pages: string;
  iconColor: string;
  description: string;
  lessons: ChapterLesson[];
}

export const Grade12SportsBookViewer: React.FC<Grade12SportsBookViewerProps> = React.memo(({
  onSelectTopicForStudy,
  onNavigateToChat,
}) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>("pe-1-1");

  const SECTIONS_METADATA: BookSection[] = [
    {
      partIndex: 1,
      title: "بەشی یەکەم: یاساکانی تۆپی پێ (یاسا نێودەوڵەتییەکانی فیفا)",
      subtitle: "١٧ یاسای نێودەوڵەتی: گۆڕەپان، تۆپ، یاریزانان، ناوبژیوانی، ئۆفساید، سزا و سەرپێچییەکان",
      pages: "٣ - ٤٠",
      iconColor: "text-emerald-400 bg-emerald-950/60 border-emerald-700/50",
      description: "بنەما و یاسا فەرمییەکانی یاری تۆپی پێ بەپێی فیفا (FIFA)؛ پێوانەی گۆڕەپان و تۆپ، دەسەڵاتەکانی ناوبژیوان، مەرجەکانی ئۆفساید، سەرپێچییەکان و جۆرەکانی لێدانی سەربەست و سزا.",
      lessons: [
        {
          id: "pe-1-1",
          title: "پێشەکی و مێژووی سەرهەڵدانی تۆپی پێ",
          page: "٣ - ٤",
          part: 1,
          summary: "مێژووی سەرهەڵدانی یارییەکە لە چین (٢٥٠٠ ساڵ پێش زایین)، یۆنان، میسر، ئینگلتەرا ١٨٦٣، و دامەزراندنی یەکێتی تۆپی پێی عێراق لە ١٩٤٨ و بڵاوبوونەوەی لە کوردستان.",
          keyPoints: [
            "مێژووی دروستبوونی یەکەم یاسای تۆمارکراو لە ساڵی ١٨٦٢ لەلایەن ئێدوارد ترینگ",
            "دامەزراندنی فیدراسیۆنی تۆپی پێی جیهانی (فیفا) لە پاریس لە ٢١ی ئایاری ١٩٠٤",
            "مێژووی هاتنی یاری تۆپی پێ بۆ کوردستان لە ڕێگای قوتابیانی کورد لە تورکیا لە ساڵانی ١٩١٢-١٩١٥"
          ]
        },
        {
          id: "pe-1-2",
          title: "یاسای ١ و ٢: گۆڕەپانی یاری و تۆپ (The Field of play & The Ball)",
          page: "٥ - ٨",
          part: 1,
          summary: "پێوانەی ستانداردی یاریگا (درێژی ٩٠-١٢٠م، پانی ٤٥-٩٠م)، هێڵی ناوەڕاست، ناوچەی سزا، خاڵی سزا (١١ مەتر)، پێوانەی دەروازە (٧.٣٢م × ٢.٤٤م) و تایبەتمەندی تۆپ.",
          keyPoints: [
            "پێوانەی تۆپی یاسایی: چێوەکەی ٦٨ تا ٧٠ سم، کێشی لە ٤١٠ تا ٤٥٠ گرام لە سەرەتای یاری",
            "پەستانی هەوای ناو تۆپ: ٠.٦ تا ١.١ پەستانی کەش لە ئاستی ڕووی دەریا",
            "هێڵەکانی ناوچەی سزا و بازنەی ناوەڕاست بە نیوەتیرەی ٩.١٥ مەتر"
          ],
          officialRule: "یاسای ١: دەبێت گۆڕەپانی یاری لاڕێکێشە بێت و درێژی هێڵی لێوار (Touchline) لە درێژی هێڵی گۆڵ زیاتر بێت."
        },
        {
          id: "pe-1-3",
          title: "یاسای ٣ و ٤: ژمارەی یاریزانان و کەلوپەل (The Players & Equipment)",
          page: "٩ - ١٢",
          part: 1,
          summary: "مەرجی ژمارەی یاریزانان (١١ یاریزان یەکێکیان گۆڵچییە، کەمترین ژمارە ٧ یاریزانە)، ژمارەی بەدەلەکان، و کەلوپەلی پێویست (درێس، شۆرت، گۆرەوی، پارێزەری قاچ).",
          keyPoints: [
            "پارێزەری قاچ (Shin guards) دەبێت بە تەواوی بە گۆرەوی داپۆشرابێت و پارێزگاری پێویست بکات",
            "ڕەنگی جلوبەرگی گۆڵچی دەبێت لە تەواوی یاریزانانی تر و ناوبژیوان جیاواز بێت",
            "ڕێساکانی بەدەلکردنی یاریزانان بە ڕەزامەندی ناوبژیوانی سەرەکی"
          ]
        },
        {
          id: "pe-1-4",
          title: "یاسای ٥ و ٦: ناوبژیوان و یاریدەدەرانی ناوبژیوان (The Referee & Assistants)",
          page: "١٣ - ١٦",
          part: 1,
          summary: "دەسەڵاتی بێسنووری ناوبژیوانی سەرەکی بۆ جێبەجێکردنی یاساکان، وەستاندنی یاری، سزادانی یاریزانان، و ئەرکی ناوبژیوانانی هێڵ لە ئاماژەکردنی ئۆفساید و دەرچوونی تۆپ.",
          keyPoints: [
            "بڕیارەکانی ناوبژیوان دەربارەی ڕاستییەکانی پەیوەست بە یاری کۆتایین",
            "دەسەڵاتی ناوبژیوان بۆ پشکنینی گۆڕەپان و پێدانی کارتی زەرد و سوور",
            "ئەرکی یاریدەدەری ناوبژیوان لە دەستنیشانکردنی لێدانی گۆشە، فڕێدان و ئۆفساید"
          ]
        },
        {
          id: "pe-1-5",
          title: "یاسای ٧ تا ١٠: کاتی یاری، تۆپ لەناو و دەرەوەی یاری، گۆڵ",
          page: "١٧ - ٢٠",
          part: 1,
          summary: "دوو تایمی ٤٥ خولەکی، کاتی بەفیڕۆچوو، کاتی پشوو (١٥ خولەک)، دۆخی تۆپ کاتێک بە تەواوی لە هێڵ دەردەچێت، و شێوازی هەژمارکردنی گۆڵی دروست.",
          keyPoints: [
            "تۆپ لە دەرەوەی یارییە تەنها کاتێک بە تەواوی بە سەر هێڵدا لەسەر زەوی یان بە هەوادا تێپەڕ دەبێت",
            "تۆپ لەناو یارییە کاتێک لە دارەکان یان ئاڵای گۆشە یان لە ناوبژیوان دەداتەوە",
            "تۆمارکردنی گۆڵ: کاتێک تەواوی تۆپەکە لە هێڵی گۆڵ دەپەڕێتەوە لە نێوان دوو ستوونەکەدا"
          ]
        },
        {
          id: "pe-1-6",
          title: "یاسای ١١: ئۆفساید (Offside) و حاڵەتە جیاوازەکانی",
          page: "٢١ - ٢٢",
          part: 1,
          summary: "ناساندنی هێڵی ئۆفساید کاتێک یاریزان لە هێڵی تۆپ و دووەم نزیکترین یاریزانی بەرگری لە هێڵی گۆڵ نزیکترە لە کاتی لێدانی تۆپەکە لەلایەن هاوتیمەکەیەوە.",
          keyPoints: [
            "هیچ ئۆفسایدێک نییە ئەگەر یاریزان ڕاستەوخۆ تۆپ لە فڕێدان (Throw-in)، لێدانی گۆشە یان لێدانی گۆڵ وەربگرێت",
            "مەرجی دەستێوەردان لە یاری (Interfering with play) بۆ هەژمارکردنی ئۆفساید",
            "سزای ئۆفساید: لێدانی سەربەستی ناڕاستەوخۆ بۆ تیپی بەرامبەر"
          ],
          officialRule: "ئۆفساید هەڵسوکەوت نییە، بەڵکو پێگەی یاریزانە؛ یاریزان سزا نادرێت تەنها لەبەر ئەوەی لە پێگەی ئۆفسایددایە، مەگەر بەشداری لە یارییەکەدا بکات."
        },
        {
          id: "pe-1-7",
          title: "یاسای ١٢: سەرپێچی و هەڵسوکەوتی نادروست (Fouls & Misconduct)",
          page: "٢٣ - ٢٥",
          part: 1,
          summary: "جیاوازی سەرپێچی دەستلێدان، پاڵنان، ڕاکێشان، و بەکارهێنانی توندوتیژی؛ مەرجەکانی بەکارهێنانی کارتی زەرد (ئاگادارکردنەوە) و کارتی سوور (دەرکردن).",
          keyPoints: [
            "٧ حاڵەتی کارتی زەرد (ڕەفتاری نایاسایی، ناڕەزایی، بەردەوام سەرپێچیکردن، دواخستنی دەستپێکردنەوە)",
            "٧ حاڵەتی کارتی سوور (یاری توندوتیژ، تفی لێکردن، بێبەشکردنی گۆڵی مسۆگەر بە دەست، قسەی ناشرین)",
            "لێدانی دەست (Handball) کاتێک بە ئەنقەست ئەنجام دەدرێت"
          ]
        },
        {
          id: "pe-1-8",
          title: "یاسای ١٣ تا ١٧: لێدانی سەربەست، سزا، فڕێدان، لێدانی گۆڵ و گۆشە",
          page: "٢٦ - ٤٠",
          part: 1,
          summary: "یاساکانی لێدانی سەربەستی ڕاستەوخۆ و ناڕاستەوخۆ، جێبەجێکردنی لێدانی سزا لە ١١ مەترەوە، مەرجەکانی فڕێدانی تۆپی یاسایی، و لێدانی گۆشە.",
          keyPoints: [
            "لە لێدانی سەربەستدا دەبێت یاریزانانی بەرامبەر لانیکەم ٩.١٥ مەتر لە تۆپەکە دووربن",
            "لە لێدانی سزادا گۆڵچی دەبێت لەسەر هێڵی گۆڵ بێت تا کاتی لێدانی تۆپەکە",
            "فڕێدانی تۆپ (Throw-in) دەبێت بە دوو دەست لە پشت سەرەوە بە هەردوو پێ لەسەر زەوی ئەنجام بدرێت"
          ]
        }
      ]
    },
    {
      partIndex: 2,
      title: "بەشی دووەم: فوتساڵ - تۆپی پێی بچووکراوە (Futsal)",
      subtitle: "مێژووی سەرهەڵدان، یاساکانی هۆڵ، گۆڕانکاری بێسنوور، کاتی ڕاستەقینە، سەرپێچی کەڵەکەبوو",
      pages: "٤١ - ٨٠",
      iconColor: "text-blue-400 bg-blue-950/60 border-blue-700/50",
      description: "مەنهەجی تایبەتی فوتساڵ لە پۆلی ١٢؛ پێوانەکانی هۆڵ و گۆڕەپان، ژمارەی یاریزانان (٥ یاریزان)، تایم ئاوت، ٤ چرکەی جێبەجێکردن، ناوبژیوانی هۆڵ و پرسیارە وزارییەکان.",
      lessons: [
        {
          id: "pe-2-1",
          title: "سەرهەڵدان و مێژووی یاری فوتساڵ",
          page: "٤١ - ٤٤",
          part: 2,
          summary: "سەرهەڵدانی یارییەکە لە ساڵی ١٩٣٠ لە شاری مۆنتیڤیدیۆی ئۆرگوای لەسەر دەستی مامۆستا خوان کارلۆس سێریانی بە ناوی (Fútbol de Salón).",
          keyPoints: [
            "پەرەسەندنی لە بەرازیل و یەکەم پاڵەوانێتی جیهانی لە ساڵی ١٩٨٢ لە ساۆ پاولۆ",
            "چوونە ژێر چەتری فیفا لە ساڵی ١٩٨٩ و گۆڕینی ناوەکەی بۆ Futsal",
            "جیاوازی سەرەکی فوتساڵ لەگەڵ تۆپی پێی ئاسایی"
          ]
        },
        {
          id: "pe-2-2",
          title: "یاریگای فوتساڵ و هێڵەکانی هۆڵ",
          page: "٤٥ - ٥٠",
          part: 2,
          summary: "پێوانەی گۆڕەپانی فوتساڵ (درێژی ٢٥-٤٢م، پانی ١٦-٢٥م)، ناوچەی دەستنیشانکراوی هونەری (Technical area)، گۆڵ (٣م پانی × ٢م بەرزی).",
          keyPoints: [
            "تایبەتمەندی تۆپی فوتساڵ: کەمتر هەڵبەزین و قەبارەی ژمارە ٤ (چێوەکەی ٦٢-٦٤ سم)",
            "کێشی تۆپی فوتساڵ: ٤٠٠ تا ٤٤٠ گرام",
            "بەرزی بنمیچی هۆڵ: لانیکەم دەبێت ٤ مەتر بێت"
          ]
        },
        {
          id: "pe-2-3",
          title: "ژمارەی یاریزانان و گۆڕانکارییە فڕیوەکان",
          page: "٥١ - ٥٦",
          part: 2,
          summary: "٥ یاریزان لەناو گۆڕەپان (یەکێکیان گۆڵچییە)، تا ٩ یاریزانی یەدەگ، و سیستەمی گۆڕانکاری کراوە بەبێ وەستاندنی کات لە ناوچەی دیاریکراو.",
          keyPoints: [
            "کەمترین ژمارەی یاریزان بۆ بەردەوامبوونی یاری ٣ یاریزانە",
            "گۆڕانکاری دەبێت لە ناوچەی تایبەتی گۆڕانکاری بە پانی ٥ مەتر ئەنجام بدرێت",
            "دەرکردنی یاریزان بە کارتی سوور: تیپەکە دوای ٢ خولەک یان پاش گۆڵ لێکران دەتوانێت یاریزانێکی تر بخاتە یاری"
          ]
        },
        {
          id: "pe-2-4",
          title: "کاتی یاری فوتساڵ و کاتی پچڕێندراو (Time-out)",
          page: "٥٧ - ٦٢",
          part: 2,
          summary: "دوو تایمی ٢٠ خولەکی بە کاتی ڕاستەقینە (Stop-clock)، واتە لە کاتی وەستانی تۆپ کاتەکە دەوەستێنرێت؛ یەک خولەک تایم ئاوت بۆ هەر تیمێک لە هەر تایمێکدا.",
          keyPoints: [
            "کاتی پشوو لە نێوان دوو تایمەکە نابێت لە ١٥ خولەک زیاتر بێت",
            "یاسای ٤ چرکە: گۆڵچی یان یاریزان ناتوانێت زیاتر لە ٤ چرکە تۆپ ڕابگرێت لە یاری پێکردنەوەدا",
            "کاتەکە لەلایەن ناوبژیوانی کاتگر (Timekeeper) بە شێوەی دیجیتاڵی بەڕێوەدەبرێت"
          ]
        },
        {
          id: "pe-2-5",
          title: "دەستەی ناوبژیوانی فوتساڵ (چوار ناوبژیوان)",
          page: "٦٣ - ٦٨",
          part: 2,
          summary: "ناوبژیوانی سەرەکی و ناوبژیوانی دووەم لەسەر دوو هێڵی لێوار بەرامبەر یەکتر؛ ناوبژیوانی سێیەم بۆ تۆمارکردن و ناوبژیوانی کاتگر (Timekeeper).",
          keyPoints: [
            "هەردوو ناوبژیوان دەسەڵاتی یەکسانیان هەیە لە بڕیاردان لەسەر سەرپێچییەکان",
            "ناوبژیوانی کاتگر بەرپرسە لە کاتی یاری و ئاگادارکردنەوەی ناوبژیوان لە کۆتایی ٢٠ خولەک",
            "تۆمارکردنی سەرپێچییە کەڵەکەبووەکان لەلایەن ناوبژیوانی سێیەمەوە"
          ]
        },
        {
          id: "pe-2-6",
          title: "سەرپێچییە کەڵەکەبووەکان (Accumulated Fouls) و لێدانی سزای ١٠ مەتری",
          page: "٦٩ - ٧٤",
          part: 2,
          summary: "یاسای سەرپێچییە کەڵەکەبووەکان: پاش ئەنجامدانی ٥ سەرپێچی ڕاستەوخۆ لە هەر تایمێکدا، بۆ سەرپێچی شەشەم و زیاتر لێدانی سزای ڕاستەوخۆ دەدرێت بەبێ دیواری بەرگری لە خاڵی سزای دووەم (١٠ مەتر).",
          keyPoints: [
            "خاڵی سزای یەکەم لە دووری ٦ مەتر، خاڵی سزای دووەم لە دووری ١٠ مەتر لە گۆڵ",
            "لە لێدانی سزای ١٠ مەتریدا، دیوار دروست ناکرێت و گۆڵچی دەتوانێت تا ٥ مەتر بێتە پێشەوە",
            "سەرپێچییە کەڵەکەبووەکان لە نیوەی دووەمدا سفر دەکرێنەوە"
          ]
        },
        {
          id: "pe-2-7",
          title: "ڕێساکانی دەستپێکردنەوە لە فوتساڵ: لێدانی لا (Kick-in) و گۆشە",
          page: "٧٥ - ٧٧",
          part: 2,
          summary: "لە فوتساڵدا فڕێدانی تۆپ بە دەست نییە، بەڵکو لێدانی لا (Kick-in) بە پێ ئەنجام دەدرێت؛ مەرجی ٤ چرکە و دووری ٥ مەتر بۆ بەرگریکاران.",
          keyPoints: [
            "تۆپ دەبێت لەسەر هێڵی لا جێگیر بێت پێش لێدان",
            "گۆڵ ڕاستەوخۆ لە لێدانی لاوە (Kick-in) هەژمار ناکرێت",
            "لێدانی گۆڵچی دەبێت بە دەست فڕێ بدرێت نەک بە پێ (Goal Clearance)"
          ]
        },
        {
          id: "pe-2-8",
          title: "پرسیار و وەڵامی نموونەیی تاقیکردنەوەی وزاری",
          page: "٧٨ - ٨٠",
          part: 2,
          summary: "پێداچوونەوەی تەواوی یاساکان بە پێی شێوازی پرسیار و وەڵامی تاقیکردنەوەی فەرمی وەزارەتی پەروەردە (پۆلی ١٢).",
          keyPoints: [
            "خشتەی بەراوردی تۆپی پێی ئاسایی و فوتساڵ لە ڕووی کات، یاریزانان و هێڵەکان",
            "پرسیارە دووبارەبووەوەکانی ناوبژیوانی و کارتی زەرد و سوور",
            "خاڵە یەکلاکەرەوەکانی سەرکەوتن لە تاقیکردنەوەی نیشتمانیدا"
          ]
        }
      ]
    }
  ];

  const activeSection = SECTIONS_METADATA.find((s) => s.partIndex === activePartIndex) || SECTIONS_METADATA[0];

  // Search logic across all lessons
  const searchResults = searchQuery.trim()
    ? SECTIONS_METADATA.flatMap((s) =>
        s.lessons
          .filter(
            (l) =>
              l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              l.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (l.officialRule && l.officialRule.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (l.keyPoints && l.keyPoints.some((kp) => kp.toLowerCase().includes(searchQuery.toLowerCase())))
          )
          .map((l) => ({ ...l, sectionTitle: s.title, partIndex: s.partIndex }))
      )
    : [];

  return (
    <div className="bg-[#071927] border border-cyan-950/80 rounded-3xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-2xl relative overflow-hidden" dir="rtl">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-900/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              مەنهەجی فەرمی وەزارەتی پەروەردە
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              پۆلی دوازدەهەمی ئامادەیی (وێژەیی و گشتی)
            </span>
          </div>
          <h2 className="font-sans font-black text-xl sm:text-2xl text-white flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>پەڕتووکی پڕۆگرامی پەروەردەی وەرزشی</span>
          </h2>
          <p className="text-xs text-slate-300 font-sans">
            ٨٠ لاپەڕەی فەرمی: یاساکانی تۆپی پێی فیفا، فوتساڵ، ناوبژیوانی، و پرسیار و وەڵامی تاقیکردنەوە
          </p>
        </div>

        {/* Part Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-[#092238] p-1.5 rounded-2xl border border-cyan-900/60 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActivePartIndex(1);
              setExpandedLessonId("pe-1-1");
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePartIndex === 1
                ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            بەشی یەکەم: یاساکانی تۆپی پێ
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePartIndex(2);
              setExpandedLessonId("pe-2-1");
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePartIndex === 2
                ? "bg-blue-500 text-slate-950 shadow-md font-black"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            بەشی دووەم: فوتساڵ (Futsal)
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="گەڕان بۆ یاسا، ئۆفساید، سزا، هێڵی یاریگا، کاتی پچڕێندراو، کارتی زەرد و سوور..."
          className="w-full bg-[#081f33] border border-cyan-900/80 rounded-2xl py-3 pr-11 pl-4 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
        />
        <Search className="w-5 h-5 text-cyan-400 absolute right-3.5 top-3.5" />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute left-3.5 top-3 text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded-md bg-white/5"
          >
            پاککردنەوە
          </button>
        )}
      </div>

      {/* SEARCH RESULTS VIEW */}
      {searchQuery.trim() ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>{searchResults.length} وانە دۆزرایەوە لە پەڕتووکی وەرزشدا:</span>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-[#092238] border border-cyan-950 rounded-2xl p-8 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-slate-300">هیچ بابەتێک نەدۆزرایەوە بۆ "{searchQuery}"</p>
              <p className="text-xs text-slate-400">وشەیەکی تر تاقی بکەرەوە وەک: ئۆفساید، فوتساڵ، سزا، کات، کارتی سوور</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-[#092238] border border-cyan-900/70 hover:border-cyan-500/60 rounded-2xl p-4 space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-300">
                      بەشی {lesson.partIndex}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">لاپەڕە {lesson.page}</span>
                  </div>

                  <div>
                    <h4 className="font-sans font-bold text-sm text-white">{lesson.title}</h4>
                    <p className="font-sans text-xs text-slate-300 mt-1 line-clamp-2">{lesson.summary}</p>
                  </div>

                  {lesson.officialRule && (
                    <div className="bg-[#061726] border border-cyan-950 p-2.5 rounded-xl text-[11px] text-cyan-200">
                      {lesson.officialRule}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-cyan-950">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTopicForStudy?.(lesson.title, lesson.page, lesson.sectionTitle);
                      }}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>خوێندن لەگەڵ مامۆستا زانا</span>
                    </button>
                    {onNavigateToChat && (
                      <button
                        type="button"
                        onClick={onNavigateToChat}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        گفتوگۆ
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* STANDARD 2-PART BROWSER */
        <div className="space-y-6">
          {/* Active Section Info Card */}
          <div className="bg-[#081f33] border border-cyan-900/60 rounded-3xl p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-950 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono text-cyan-400">
                    لاپەڕە {activeSection.pages} • {activeSection.lessons.length} وانەی فەرمی
                  </span>
                </div>
                <h3 className="font-sans font-black text-lg sm:text-xl text-white">
                  {activeSection.title}
                </h3>
                <p className="text-xs text-slate-300 font-sans max-w-2xl leading-relaxed">
                  {activeSection.description}
                </p>
              </div>

              {/* Start unit study with Zana */}
              <button
                type="button"
                onClick={() => {
                  onSelectTopicForStudy?.(activeSection.title, activeSection.pages, `بەشی ${activeSection.partIndex}`);
                }}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>شیکردنەوەی ئەم بەشە لەگەڵ زانا</span>
              </button>
            </div>

            {/* Lessons Accordion List */}
            <div className="space-y-3">
              <h4 className="font-sans font-bold text-xs text-slate-400 flex items-center gap-1.5 uppercase">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>وانە و یاساکانی ئەم بەشە:</span>
              </h4>

              <div className="space-y-2.5">
                {activeSection.lessons.map((lesson) => {
                  const isExpanded = expandedLessonId === lesson.id;
                  return (
                    <div
                      key={lesson.id}
                      className="bg-[#092238] border border-cyan-950 rounded-2xl overflow-hidden transition-all"
                    >
                      {/* Clickable Header */}
                      <button
                        type="button"
                        onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                        className="w-full text-right p-4 flex items-center justify-between gap-3 hover:bg-[#0c2a46] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400 shrink-0">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-sans font-bold text-sm text-white">
                              {lesson.title}
                            </p>
                            <p className="font-sans text-xs text-slate-400 line-clamp-1">
                              {lesson.summary}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/40">
                            لاپەڕە {lesson.page}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="p-4 pt-1 border-t border-cyan-950 space-y-3 bg-[#061827]">
                          <p className="text-xs text-slate-300 font-sans leading-relaxed">
                            {lesson.summary}
                          </p>

                          {/* Official Rule Box */}
                          {lesson.officialRule && (
                            <div className="bg-[#081f33] border-r-4 border-r-cyan-500 border border-cyan-950 p-3 rounded-xl space-y-1">
                              <span className="text-[10px] font-bold text-cyan-400 block uppercase">
                                دەقی یاسای فەرمی (Official Law):
                              </span>
                              <p className="text-xs text-cyan-100 font-sans leading-relaxed">
                                {lesson.officialRule}
                              </p>
                            </div>
                          )}

                          {/* Key Points */}
                          {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-emerald-400 block">
                                خاڵە یاسایی و وەرزشییە سەرەکییەکان:
                              </span>
                              <ul className="space-y-1">
                                {lesson.keyPoints.map((pt, idx) => (
                                  <li
                                    key={idx}
                                    className="text-xs text-slate-300 flex items-start gap-2"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                    <span>{pt}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="pt-2 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectTopicForStudy?.(lesson.title, lesson.page, activeSection.title);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-white" />
                              <span>پرسیارکردن لە زانا دەربارەی ئەم یاسایە</span>
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
      )}
    </div>
  );
});
