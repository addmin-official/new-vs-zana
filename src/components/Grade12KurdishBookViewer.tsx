import React, { useState } from "react";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Layers,
  FileText,
  Feather
} from "lucide-react";

interface Grade12KurdishBookViewerProps {
  onSelectTopicForStudy?: (topicTitle: string, pageRange: string, partName: string) => void;
  onNavigateToChat?: () => void;
}

interface ChapterLesson {
  id: string;
  title: string;
  page: string;
  summary: string;
  keyPoints?: string[];
}

interface BookPart {
  partIndex: number;
  title: string;
  subtitle: string;
  pages: string;
  iconColor: string;
  description: string;
  lessons: ChapterLesson[];
}

export const Grade12KurdishBookViewer: React.FC<Grade12KurdishBookViewerProps> = React.memo(({
  onSelectTopicForStudy,
  onNavigateToChat,
}) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>("rez-1");

  const PARTS_METADATA: BookPart[] = [
    {
      partIndex: 1,
      title: "بەشی یەکەم: ڕێزمان",
      subtitle: "شێوازەکانی کار، چاوگی بوون، جێناوە لکاوەکان، هاوەڵناو و هاوەڵکار، دیارخەرەکان",
      pages: "٧ - ٩٤",
      iconColor: "text-amber-400 bg-amber-950/60 border-amber-700/50",
      description: "بنەما زانستی و هاوچەرخەکانی ڕێزمانی زمانی کوردی؛ ناسینەوەی شێوازەکانی کار، جێناوە کەسییە لکاوەکان و پێکهاتەی ڕستە لە تاقیکردنەوەی نیشتمانیدا.",
      lessons: [
        {
          id: "rez-1",
          title: "شێوازی ڕێژەی ڕاگەیاندن لە کاردا",
          page: "٨ - ١٢",
          summary: "ناسینەوەی ڕێژەکانی ڕابردوو و ڕانەبەردووی ڕاگەیاندن، شێوازی ئەرێ و نەرێ بە (نە) و (نا).",
          keyPoints: ["ڕێژەی ڕابردووی نزیک، دوور و بەردەوام", "نیشانەی (دە) بۆ ڕانەبەردوو", "یاسای نەرێکردنی کار بە (نە) و (نا)"]
        },
        {
          id: "rez-2",
          title: "شێوازی ڕێژەی دانانی لە کاردا",
          page: "١٣ - ١٨",
          summary: "پێکهاتەی کاری دانانی بە بەکارهێنانی پێشگری (بیـ/بـ) و دەربڕینی گومان، ئاوات و هیوا.",
          keyPoints: ["نیشانەی (بـ) لە کاری دانانیدا", "یاسای نەرێکردن بە (نە)", "جیاوازی لەگەڵ کاری ڕاگەیاندن"]
        },
        {
          id: "rez-3",
          title: "شێوازی ڕێژەی داخوازی لە کاردا",
          page: "١٩ - ٢٣",
          summary: "فەرمانپێکردن و داخوازی لە کەسی دووەمی تاک و کۆ، نەرێکردن بە (مە).",
          keyPoints: ["فۆرمی داخوازی ئەرێ (بڕۆ، بخوێنن)", "نەرێکردنی داخوازی بە (مە)", "پێوەندی لەگەڵ قەدی چاوگ"]
        },
        {
          id: "rez-4",
          title: "شێوازی مەرجی و ڕستەی ئاوێتەی مەرج",
          page: "٢٤ - ٢٨",
          summary: "پێکهاتەی ڕستەی مەرج (ئەگەر، با)، ڕستەی سەرەکی و پاشکۆ و نیشانەی مەرج.",
          keyPoints: ["ئامرازەکانی مەرج (ئەگەر، هەتا)", "ڕستەی مەرج و وەڵامی مەرج", "کاتەکانی کار لە ڕستەی مەرجیدا"]
        },
        {
          id: "rez-5",
          title: "کاری چاوگی (بوون)",
          page: "٢٩ - ٣٤",
          summary: "تایبەتمەندی و بەکارهێنانی کاری ناتەواوی چاوگی بوون لە کاتە جیاوازەکاندا.",
          keyPoints: ["فۆرمەکانی بوون (هەم، هەی، هەین)", "ئەرکی بوون وەک کاری یارمەتیدەر", "باری هەبوون و نەبوون"]
        },
        {
          id: "rez-6",
          title: "ئەرکی پیتی (هـ) لە ڕێزمانی کوردیدا",
          page: "٣٥ - ٣٨",
          summary: "ئەرکە جیاوازەکانی (هـ) لە کۆتایی وشە و وەک نیشانەی کەسی سێیەمی تاک.",
          keyPoints: ["(هـ)ی بزوێن و نەبزوێن", "(هـ) وەک تەواوکەری بەیارمەتیدەر", "جیاکردنەوە لە پیتی بنەڕەتی"]
        },
        {
          id: "rez-7",
          title: "ئەرکی جێناوە کەسییە لکاوەکان (بکەر، بەرکار، تەواوکەر)",
          page: "٣٩ - ٥٦",
          summary: "تێپەڕ و تێنەپەڕ؛ شوێنی جێناوی لکاو لە کاتی ڕابردوو و ڕانەبەردوو بەپێی ئەرکی ڕێزمانی.",
          keyPoints: ["کۆمەڵەی یەکەم (م، یت، ێت / ین، ن، ن)", "کۆمەڵەی دووەم (م، ت، ی / مان، تان، یان)", "دۆخی ئەرک گۆڕین لە نێوان ڕابردوو و ڕانەبەردوو"]
        },
        {
          id: "rez-8",
          title: "هاوەڵناو و هاوەڵکار لە ڕووی ڕۆنانەوە",
          page: "٥٧ - ٦٩",
          summary: "ڕۆنانی هاوەڵناو و هاوەڵکار: سادە، داڕێژراو و لێکدراو، و جۆرەکانی کات و شوێن و چۆنییەتی.",
          keyPoints: ["پێشگر و پاشگرە هاوەڵناوسازەکان", "هاوەڵکاری چۆنییەتی و کات", "جیاوازی نێوان هاوەڵناو و هاوەڵکار لە ڕستەدا"]
        },
        {
          id: "rez-9",
          title: "ڕادە و دیارخەرەکانی ناو لە زمانی کوردیدا",
          page: "٧٠ - ٩٤",
          summary: "دیارخەری ناو لە ڕێگەی (ناو، هاوەڵناو، جێناوی سەربەخۆ، جێناوی کەسی لکاو).",
          keyPoints: ["ئەرکی ناو وەک دیارخەری ناو (دیارخەری ناو بە ناو)", "هاوەڵناو وەک دیارخەری ناو", "جێناوی سەربەخۆ و لکاو بۆ دیارخستن"]
        }
      ]
    },
    {
      partIndex: 2,
      title: "بەشی دووەم: ئەدەب و ڕەخنە",
      subtitle: "قۆناغەکانی شیعری نوێ ١٩٣٩-١٩٩١، ڕەخنەی ئەدەبی، وتار، چیرۆکی هونەری، ڕۆمان",
      pages: "٩٥ - ١٥٠",
      iconColor: "text-rose-400 bg-rose-950/60 border-rose-700/50",
      description: "مێژووی سەرهەڵدانی ئەدەبی نوێخوازی کوردی؛ قۆناغەکانی شیعری بەرگری و گۆرانکارییە فکرییەکان، ڕەخنەی ئەدەبی و پەخشانی هونەری.",
      lessons: [
        {
          id: "adb-1",
          title: "قۆناغی یەکەمی شیعری نوێ (١٩٣٩ - ١٩٥٨)",
          page: "٩٦ - ١٠٣",
          summary: "سەرهەڵدانی ئەدەبی ڕیالیزم، ڕۆڵی بێکەس، گۆران، دڵدار و قۆناغی بزووتنەوەی ڕزگاریخوازی.",
          keyPoints: ["نوێکردنەوەی کێش و سەروا لەلایەن عەبدوڵڵا گۆران", "شیعری بەرەنگاری و نیشتمانی لە دەمی جەنگی دووەم", "ڕەنگدانەوەی کۆمەڵایەتی"]
        },
        {
          id: "adb-2",
          title: "قۆناغی دووەمی شیعری نوێ (١٩٥٨ - ١٩٧٠)",
          page: "١٠٤ - ١٠٦",
          summary: "گۆڕانکارییە سیاسی و کۆمەڵایەتییەکانی دوای شۆڕشی ١٤ی تەممووز و کرانەوەی فەزای شیعری.",
          keyPoints: ["پەرەسەندنی ڕۆژنامەگەری و چاپەمەنی کوردی", "ڕێبازی ڕیالیزمی ڕەخنەگرانە", "شاعیرانی ئەم قۆناغە"]
        },
        {
          id: "adb-3",
          title: "قۆناغی سێیەمی شیعری نوێ (١٩٧٠ - ١٩٩١)",
          page: "١٠٧ - ١١٧",
          summary: "بەیاننامەی ڕوانگە و بزووتنەوەی نوێخوازی (شێرکۆ بێکەس، لەتیف هەڵمەت، عەبدوڵڵا پەشێو).",
          keyPoints: ["گرووپی ڕوانگە (١٩٧٠) و شۆڕشی فۆرم و ناوەڕۆک", "شیعری وتاری و بەرگری لە قۆناغی شاخ", "شیعری قەسیدەی درێژ و ڕەنگدانەوەی مەرگەساتەکان"]
        },
        {
          id: "adb-4",
          title: "ڕەخنەی ئەدەبی (چەمک و مێژوو)",
          page: "١١٨ - ١٢٥",
          summary: "چەمکی ڕەخنە، مێژووی ڕەخنەی خۆرئاوایی و خۆرهەڵاتی، و ڕەخنەی کوردی دوای جەنگی یەکەمی جیهانی.",
          keyPoints: ["ڕەخنەی بابەتی و دەروونی و مێژوویی", "سەرەتای ڕەخنەی کوردی لە گۆڤار و ڕۆژنامەکان", "پێوەرەکانی ڕەخنەی هاوچەرخ"]
        },
        {
          id: "adb-5",
          title: "پەخشان و وتاری کوردی",
          page: "١٢٦ - ١٣٦",
          summary: "سەرهەڵدان و گەشەسەندنی وتار و پەخشانی هونەری لە قۆناغەکانی ١٩٣٩ تا ١٩٩١.",
          keyPoints: ["جۆرەکانی وتار (کۆمەڵایەتی، سیاسی، ئەدەبی)", "پێکهاتەی وتار: پێشەکی، ناوەڕۆک، دەرەنجام", "نووسەرە پێشەنگەکانی وتاری کوردی"]
        },
        {
          id: "adb-6",
          title: "چیرۆکی هونەری و ڕۆمان لە ئەدەبی کوردیدا",
          page: "١٣٧ - ١٥٠",
          summary: "قۆناغەکانی چیرۆکی هونەری کوردی، ڕەگەزەکانی چیرۆک، و سەرهەڵدانی یەکەمین ڕۆمانەکانی کوردی.",
          keyPoints: ["ڕەگەزەکانی چیرۆک (کەسایەتی، ڕووداو، کات، شوێن، گرێ، دیالۆگ)", "یەکەمین ڕۆمانە کوردییەکان (مەسەلەی ویژدان، پێشمەرگە، ژانی گەل)", "ڕۆمانی هاوچەرخ"]
        }
      ]
    },
    {
      partIndex: 3,
      title: "بەشی سێیەم: ڕەوانبێژی",
      subtitle: "ڕەگەزدۆزی، لێکچوواندن، خواستن، دژەیەک، جوانیی بایس، تێهەڵکێش",
      pages: "١٥١ - ١٧٢",
      iconColor: "text-cyan-400 bg-cyan-950/60 border-cyan-700/50",
      description: "هونەرەکانی ڕەوانبێژی کوردی (بەدیع و بەیان)؛ ناسینەوە و شیکارکردنی دەقە شیعرییەکان بۆ بەدەستهێنانی نمرەی تەواو لە وزاری.",
      lessons: [
        {
          id: "raw-1",
          title: "ڕەگەزدۆزی (الجناس) لە شیعری کوردیدا",
          page: "١٥٢ - ١٥٥",
          summary: "یەکچوونی دوو وشە لە دەنگ و وشەدا لەگەڵ جیاوازی لە مانادا (تەواو و ناتەواو).",
          keyPoints: ["ڕەگەزدۆزی تەواو (دوو وشەی تەواو هاوشێوە بە دوو مانای جیاواز)", "ڕەگەزدۆزی ناتەواو (جیاوازی لە یەک پیت یان بزۆک)", "نموونە لە شیعری نالی و مەحوی"]
        },
        {
          id: "raw-2",
          title: "لێکچوواندن (التشبیه) و ڕەگەزەکانی",
          page: "١٥٦ - ١٥٩",
          summary: "چوار ڕەگەزی لێکچوواندن: لێچوێنراو، پێچوێنراو، ئامرازی لێکچوواندن، و ڕووی لێکچوواندن.",
          keyPoints: ["لێکچوواندنی ڕوون و دەستنیشانکراو", "سڕینەوەی ئامراز یان ڕووی لێکچوواندن (لێکچوواندنی بەلیغ)", "کاریگەری لەسەر وێنەی شیعری"]
        },
        {
          id: "raw-3",
          title: "خواستن (الاستعارة) لە دەقی ئەدەبیدا",
          page: "١٦٠ - ١٦٢",
          summary: "لێکچوواندنێک کە یەکێک لە دوو لایەنە سەرەکییەکەی (لێچوێنراو یان پێچوێنراو) سڕدرابێتەوە.",
          keyPoints: ["خواستنی ڕاشکاو (التصريحیة)", "خواستنی بەناڕاستەوخۆ (المكنیة)", "جیاوازی ورد لە نێوان خواستن و لێکچوواندن"]
        },
        {
          id: "raw-4",
          title: "دژەیەک (الطباق) لە نێوان وشەکاندا",
          page: "١٦٣ - ١٦٥",
          summary: "هاتنی دوو وشەی دژبەریەک لە یەک دەقدا بۆ بەهێزکردنی واتا و بەرجەستەکردنی وێنە.",
          keyPoints: ["دژەیەکی ئەرێنی (ڕۆژ و شەو، ڕەش و سپی)", "دژەیەکی نەرێنی (دەزانێت و نازانێت)", "ڕۆڵی لە دروستکردنی کێشمەکێشی دەروونی"]
        },
        {
          id: "raw-5",
          title: "جوانیی بایس (حسن التعليل)",
          page: "١٦٦ - ١٦٧",
          summary: "هێنانی هۆکارێکی خەیاڵی و جوان بۆ ڕووداوێکی سروشتی بە مەبەستی بەرجەستەکردنی سۆز.",
          keyPoints: ["جیاوازی هۆکاری ڕاستەقینە و شاعیرانە", "پێوەندی لەگەڵ بارودۆخی شاعیر", "نموونەکانی شاعیرانی کلاسیک"]
        },
        {
          id: "raw-6",
          title: "تێهەڵکێش (التضمين) لە هونەری شیعردا",
          page: "١٦٨ - ١٧٢",
          summary: "هێنانی نیوەدێڕ یان دێڕێکی شاعیرێکی تر لەناو دەقی نوێدا بە پاراستنی مافی فکری و مەبەست.",
          keyPoints: ["مەرجەکانی تێهەڵکێشکردن", "گونجاندنی کێش و سەروا", "جیاوازی لەگەڵ دەستبەسەرداگرتن"]
        }
      ]
    },
    {
      partIndex: 4,
      title: "بەشی چوارەم: خوێندنەوە و شیکردنەوەی دەق",
      subtitle: "شێخ سەعیدی پیران، میر شەرەفخانی بەدلیسی، مەلا محەمەدی کۆیی، قەڵای دمدم",
      pages: "١٧٣ - ١٨٣",
      iconColor: "text-emerald-400 bg-emerald-950/60 border-emerald-700/50",
      description: "شیکردنەوەی چوار دەقی پڕمانای مێژوویی و ئەدەبی کوردی؛ ناسینی کەسایەتییە مەزنەکان و فەرهەنگۆکی دەوڵەمەندی زمانی کوردی.",
      lessons: [
        {
          id: "xwen-1",
          title: "شێخ سەعیدی پیران",
          page: "١٧٤ - ١٧٥",
          summary: "دەقی مێژوویی و شیکاری لەسەر شۆڕشی ١٩٢٥ی شێخ سەعیدی پیران و بەرخودانی نەتەوەیی.",
          keyPoints: ["ڕۆڵی سەرکردایەتی شێخ سەعید", "ڕەهەندە مێژوویی و ئەدەبییەکانی شۆڕش", "فەرهەنگۆک و واتای وشەکان"]
        },
        {
          id: "xwen-2",
          title: "میر شەرەفخانی بەدلیسی و شەرەفنامە",
          page: "١٧٦ - ١٧٧",
          summary: "خوێندنەوەی ژیان و بەرهەمی مێژوونووسی مەزنی کورد میر شەرەفخان، دانەری شەرەفنامە لە ١٥٩٧.",
          keyPoints: ["گرنگی شەرەفنامە وەک ناسنامەی مێژوویی کورد", "شێوازی نووسین و دۆکۆمێنتکردنی مێژوو", "واتای وشە ئاڵۆزەکان"]
        },
        {
          id: "xwen-3",
          title: "مەلا محەمەدی کۆیی (مەلای گەورە)",
          page: "١٧٨ - ١٨٧",
          summary: "دەقی ناساندنی مەلای گەورەی کۆیە؛ زانای چاکسازیخواز، داکۆکیکاری خوێندنی کچان و زانست.",
          keyPoints: ["بیروباوەڕی چاکسازیخوازی و ڕێبازی ڕۆشنگەری", "فەتوای فێربوونی ژنان و زانستی سەردەم", "کاریگەری لەسەر کۆمەڵگەی کوردی"]
        },
        {
          id: "xwen-4",
          title: "داستانی قەڵای دمدم و خانی لەپزێڕین",
          page: "١٨٨ - ١٩٢",
          summary: "شیکردنەوەی داستانی قەڵای دمدم (١٦٠٩ - ١٦١٠) وەک سیمبولی خۆڕاگری و پاراستنی سەربەخۆیی.",
          keyPoints: ["بەرگری خانی لەپزێڕین بەرامبەر شاعەباسی سەفەوی", "ڕەنگدانەوەی داستان لە فۆلکلۆر و شیعری کوردیدا", "پەیامی ئەدەبی و فەرهەنگی داستانەکە"]
        }
      ]
    }
  ];

  const currentPart = PARTS_METADATA.find((p) => p.partIndex === activePartIndex) || PARTS_METADATA[0];

  const filteredLessons = searchQuery.trim()
    ? PARTS_METADATA.flatMap((p) =>
        p.lessons
          .filter(
            (l) =>
              l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              l.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
              l.keyPoints?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map((l) => ({ ...l, partTitle: p.title }))
      )
    : [];

  return (
    <div className="bg-[#071927] border border-cyan-950/80 rounded-3xl p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 shadow-2xl relative overflow-hidden" dir="rtl">
      {/* Top Header Banner with Book Cover and Meta */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0a2339] via-[#0c2a44] to-[#071927] border border-cyan-900/40 p-5 sm:p-6 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-xl">
        {/* Book Cover Thumbnail with 3D look */}
        <div className="relative w-28 sm:w-36 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl shadow-cyan-950/60 shrink-0 border border-cyan-700/40 bg-slate-900 group">
          <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/60 to-transparent z-10 pointer-events-none" />
          <img
            src="/books/kurdish.png"
            alt="زمان و ئەدەبی کوردی - پۆلی ١٢"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Info Block */}
        <div className="flex-1 space-y-3 text-center md:text-right">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/20">
              مەنهەجی فەرمی وەزارەت
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0e4860] text-cyan-300 border border-cyan-700/50">
              پۆلی ١٢ • وێژەیی
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
              ١٩٢ لاپەڕە • ٤ بەش
            </span>
          </div>

          <h2 className="font-sans font-black text-2xl sm:text-3xl text-white">
            زمان و ئەدەبی کوردی (پۆلی ١٢ی ئامادەیی)
          </h2>

          <p className="font-sans text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            پەڕتووکی دەستنیشانکراوی فەرمی وەزارەتی پەروەردە بۆ قۆناغی دوازدەهەمی ئامادەیی. داڕێژراو بە چوار تەوەری زانستی (ڕێزمان، ئەدەب، ڕەوانبێژی، خوێندنەوە) بۆ ئامادەکاری تاقیکردنەوەی وزاری.
          </p>

          {/* Quick Search */}
          <div className="relative max-w-md pt-1">
            <Search className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان لە بابەتەکان (وەک: جێناوی لکاو، گۆران، ڕەگەزدۆزی)..."
              className="w-full bg-[#071726] border border-cyan-900/60 rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* SEARCH RESULTS VIEW */}
      {searchQuery.trim() ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-base text-cyan-300 flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>ئەنجامەکانی گەڕان بۆ "{searchQuery}" ({filteredLessons.length})</span>
            </h3>
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              پاککردنەوە
            </button>
          </div>

          {filteredLessons.length === 0 ? (
            <div className="text-center py-12 bg-[#081a2b] rounded-2xl border border-cyan-950 p-6 space-y-2">
              <p className="text-sm text-slate-300 font-bold">هیچ بابەتێک نەدۆزرایەوە</p>
              <p className="text-xs text-slate-500">تکایە دەستەواژەی تر تاقی بکەرەوە (وەک: کار، لێکچوواندن، دمدم).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLessons.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#081a2b] border border-cyan-900/50 hover:border-cyan-500/50 rounded-2xl p-4 space-y-2.5 transition-all shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
                      {(item as { partTitle?: string }).partTitle} • ل. {item.page}
                    </span>
                  </div>
                  <h4 className="font-sans font-bold text-sm text-white">{item.title}</h4>
                  <p className="font-sans text-xs text-slate-300 leading-relaxed">{item.summary}</p>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTopicForStudy?.(item.title, item.page, (item as { partTitle?: string }).partTitle || "");
                      onNavigateToChat?.();
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>خوێندن لەگەڵ زانا</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 4 MAIN PARTS TABS VIEW */
        <div className="space-y-6">
          {/* 4 Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {PARTS_METADATA.map((part) => {
              const isActive = part.partIndex === activePartIndex;
              return (
                <button
                  key={part.partIndex}
                  onClick={() => setActivePartIndex(part.partIndex)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    isActive
                      ? "bg-[#0b273f] border-cyan-500 text-white shadow-xl shadow-cyan-500/20 -translate-y-0.5"
                      : "bg-[#081a2b] border-cyan-950 text-slate-400 hover:border-cyan-800 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${part.iconColor}`}>
                      بەشی {part.partIndex}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">ل. {part.pages}</span>
                  </div>
                  <h4 className={`font-sans font-black text-xs sm:text-sm line-clamp-1 ${isActive ? "text-cyan-300" : "text-white"}`}>
                    {part.title.replace(`بەشی ${part.partIndex}: `, "")}
                  </h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                    {part.lessons.length} وانەی سەرەکی
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Part Overview Banner */}
          <div className="bg-[#081a2b] border border-cyan-900/40 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className="font-sans font-black text-lg text-white">
                {currentPart.title} ({currentPart.subtitle})
              </h3>
            </div>
            <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentPart.description}
            </p>
          </div>

          {/* Lessons List in Active Part */}
          <div className="space-y-3">
            <h4 className="font-sans font-bold text-sm text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>وانە و تەوەرەکانی {currentPart.title} ({currentPart.lessons.length} وانە)</span>
            </h4>

            <div className="space-y-2.5">
              {currentPart.lessons.map((lesson, idx) => {
                const isExpanded = expandedLessonId === lesson.id;

                return (
                  <div
                    key={lesson.id}
                    className="bg-[#081a2b] border border-cyan-950 hover:border-cyan-800/60 rounded-2xl overflow-hidden transition-all"
                  >
                    {/* Lesson Header Accordion Toggle */}
                    <div
                      onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#0b243b]/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-700/40 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <h5 className="font-sans font-bold text-sm text-white">
                            {lesson.title}
                          </h5>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {lesson.summary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-800/40 px-2.5 py-1 rounded-lg hidden sm:inline-block">
                          لاپەڕە {lesson.page}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content with Key Points & CTA */}
                    {isExpanded && (
                      <div className="border-t border-cyan-950/80 bg-[#061523]/80 p-4 sm:p-5 space-y-4">
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            <span>پوختەی ناوەڕۆکی ئەم وانەیە:</span>
                          </span>
                          <p className="font-sans text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#081f33] p-3 rounded-xl border border-cyan-900/30">
                            {lesson.summary}
                          </p>
                        </div>

                        {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                              <Feather className="w-3.5 h-3.5" />
                              <span>خاڵە سەرەکی و تاقیکردنەوەییەکان (وەزاری):</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {lesson.keyPoints.map((kp, kIdx) => (
                                <div
                                  key={kIdx}
                                  className="flex items-start gap-2 bg-[#092238] p-2.5 rounded-xl border border-cyan-950 text-xs text-slate-200"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{kp}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Direct Study with Zana Button */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-cyan-950">
                          <span className="text-xs text-slate-400">
                            پێوەری هەڵسەنگاندنی ئەم وانەیە هاوتەریبە لەگەڵ شێوازی پرسیاری وەزاری.
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTopicForStudy?.(lesson.title, lesson.page, currentPart.title);
                              onNavigateToChat?.();
                            }}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 active:scale-95"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>دەستپێکردنی گفتوگۆ و خوێندنی ئەم بابەتە</span>
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
      )}
    </div>
  );
});
