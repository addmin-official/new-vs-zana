import React, { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Layers,
  Landmark
} from "lucide-react";

interface Grade12HistoryBookViewerProps {
  onSelectTopicForStudy?: (topicTitle: string, pageRange: string, partName: string) => void;
  onNavigateToChat?: () => void;
}

interface ChapterLesson {
  id: string;
  title: string;
  page: string;
  summary: string;
  chapterNumber: number;
  datesAndTreaties?: string[];
  keyHistoricalEvents?: string[];
}

interface HistoryChapter {
  chapterIndex: number;
  title: string;
  subtitle: string;
  pages: string;
  iconColor: string;
  description: string;
  lessons: ChapterLesson[];
}

export const Grade12HistoryBookViewer: React.FC<Grade12HistoryBookViewerProps> = React.memo(({
  onSelectTopicForStudy,
  onNavigateToChat,
}) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>("hist-1-1");

  const CHAPTERS_METADATA: HistoryChapter[] = [
    {
      chapterIndex: 1,
      title: "بەشی یەکەم: ململانێی عوسمانی - ئێرانی و کاریگەریی لەسەر کوردستان",
      subtitle: "سەرهەڵدانی دەوڵەتی عوسمانی، سەفەوییەکان، شەڕی چاڵدێران ١٥١٤، دابەشبوونی کوردستان",
      pages: "٣ - ٢٢",
      iconColor: "text-amber-400 bg-amber-950/60 border-amber-700/50",
      description: "لێکۆڵینەوە لە ململانێی فراوانخوازیی نێوان ئیمپراتۆریەتی عوسمانی و دەوڵەتی سەفەوی ئێران لەسەر خاکی کوردستان؛ شەڕی یەکلاکەرەوەی چاڵدێران (١٥١٤) بە سەرکردایەتی سوڵتان سەلیمی یەکەم و شا ئیسماعیلی سەفەوی و ڕۆڵی دیپلۆماسی مەلا ئیدریسی بەدلیسی.",
      lessons: [
        {
          id: "hist-1-1",
          title: "سەرهەڵدانی دەوڵەتی عوسمانی و بەرەوپێشچوونی بەرەو ڕۆژهەڵات",
          page: "٣ - ٧",
          chapterNumber: 1,
          summary: "ڕەچەڵەکی هۆزە تورکەکان بە سەرۆکایەتی ئەرتوغرول و عوسمان (١٢٩٩)، ڕووخاندنی قوستەنتینیە (١٤٥٣) لەسەر دەستی سوڵتان محەمەد فاتیح، و گۆڕانی ئاراستەی فراوانخوازی بۆ ڕۆژهەڵات لە سەردەمی سوڵتان سەلیمی یەکەم.",
          datesAndTreaties: ["١٢٩٩ ز: دامەزراندنی میرنشینی عوسمانی", "١٤٥٣ ز: داگیرکردنی قوستەنتینیە", "١٥١٢-١٥٢٠ ز: حوکمڕانی سوڵتان سەلیمی یەکەم"],
          keyHistoricalEvents: [
            "هۆکاری ڕووکردنی عوسمانییەکان بۆ ڕۆژهەڵات و دەستبەسەرداگرتنی ڕێگاکانی بازرگانی",
            "کێشەی مەزهەبی نێوان سوننەی عوسمانی و شیعەی سەفەوی",
            "پێگەی ستراتیژیی خاکی کوردستان وەک گۆڕەپانی یەکلاکردنەوەی جەنگەکان"
          ]
        },
        {
          id: "hist-1-2",
          title: "دەوڵەتی سەفەوی و ململانێ لەگەڵ عوسمانییەکان",
          page: "٨ - ١٣",
          chapterNumber: 1,
          summary: "سەرهەڵدانی تەریقەتی سەفەوی لە ئەردەوێڵ لەسەر دەستی شێخ سەفییەددین و گۆڕانی بۆ دەسەڵاتی سیاسی لەلایەن شا ئیسماعیلی سەفەوی (١٥٠١) و پەلاماردانی میرنشینە کوردییەکان.",
          datesAndTreaties: ["١٥٠١ ز: ڕاگەیاندنی دەوڵەتی سەفەوی لە تەورێز", "١٥٠٨ ز: داگیرکردنی بەغدا لەلایەن شا ئیسماعیل"],
          keyHistoricalEvents: [
            "سیاسەتی توندڕەوی شا ئیسماعیل بەرامبەر میرە کوردە سوننەکان",
            "زیندانیکردنی میرە کوردەکان لە قەڵای قەهقەهە",
            "پەنابردنی میرە کوردەکان بۆ لای سوڵتانی عوسمانی"
          ]
        },
        {
          id: "hist-1-3",
          title: "شەڕی چاڵدێران (١٥١٤) و دابەشبوونی یەکەمی کوردستان",
          page: "١٤ - ٢٢",
          chapterNumber: 1,
          summary: "ڕوودانی شەڕی مەزنی چاڵدێران لە ٢٣ی ئابی ١٥١٤ لە باکووری ڕۆژئاوای تەورێز؛ شکستی سەفەوییەکان بەهۆی تۆپخانەی پێشکەوتووی عوسمانی؛ و پەیمانی مەلا ئیدریسی بەدلیسی لەگەڵ سوڵتان سەلیم بۆ دانپێدانانی میرنشینە کوردییەکان.",
          datesAndTreaties: ["٢٣ی ئابی ١٥١٤ ز: شەڕی چاڵدێران", "١٥١٥ ز: ڕێکەوتنی مەلا ئیدریسی بەدلیسی لەگەڵ عوسمانی"],
          keyHistoricalEvents: [
            "ئەنجامەکانی شەڕی چاڵدێران و داگیرکردنی تەورێز لەلایەن سوڵتان سەلیم",
            "دابەشبوونی نیشتمانی کوردستان بۆ یەکەمجار لە نێوان عوسمانی و ئێران",
            "سیستەمی هۆز و میرنشینە ئۆتۆنۆمەکانی کورد لە چوارچێوەی دەوڵەتی عوسمانیدا"
          ]
        }
      ]
    },
    {
      chapterIndex: 2,
      title: "بەشی دووەم: پەیمانەکان و ڕێکەوتنەکانی عوسمانی - ئێرانی",
      subtitle: "پەیمانی ئەماسیە ١٥٥٥، قەسری شیرین (زەهاو) ١٦٣٩، ئەرزەڕۆمی یەکەم و دووەم، پرۆتۆکۆلی تاران و ئەستەنبوڵ",
      pages: "٢٣ - ٤٤",
      iconColor: "text-blue-400 bg-blue-950/60 border-blue-700/50",
      description: "زنجیرە پەیماننامە دیپلۆماسی و سنوورییە نێودەوڵەتییەکان لە سەدەی شازدە تا بیستەم، کە چارەنووس و خاکی کوردستانیان بەبێ ڕەزامەندی کورد دابەش و جیاکردەوە.",
      lessons: [
        {
          id: "hist-2-1",
          title: "پەیمانی ئەماسیە (١٥٥٥) و پەیمانی قەسری شیرین (١٦٣٩)",
          page: "٢٣ - ٣٢",
          chapterNumber: 2,
          summary: "پەیمانی ئەماسیە (١٥٥٥) لە نێوان سوڵتان سولەیمان قانوونی و شا تەهماسب؛ و پەیمانی قەسری شیرین (١٧ی ئایاری ١٦٣٩) لە نێوان سوڵتان مورادی چوارەم و شا سەفی سەفەوی کە بووە بنەمای سنووری فەرمی هەتا سەدەی بیستەم.",
          datesAndTreaties: ["٢٩ی ئایاری ١٥٥٥ ز: پەیمانی ئەماسیە", "١٧ی ئایاری ١٦٣٩ ز: پەیمانی قەسری شیرین (زەهاو)"],
          keyHistoricalEvents: [
            "جێگیرکردنی سنووری نێوان عوسمانی و سەفەوی و دابەشکردنی فەرمی کوردستان",
            "کەوتنی بەشێکی گەورەی کوردستان لەژێر دەسەڵاتی ڕاستەوخۆی عوسمانی",
            "کاریگەری ڕێکەوتنی زەهاو لەسەر بەستنەوەی میرنشینەکانی بابان و ئەردەڵان بە بەرەی جەنگ"
          ]
        },
        {
          id: "hist-2-2",
          title: "پەیماننامەکانی ئەرزەڕۆمی یەکەم (١٨٢٣) و دووەم (١٨٤٧)",
          page: "٣٣ - ٤٠",
          chapterNumber: 2,
          summary: "ئەرزەڕۆمی یەکەم پاش شەڕەکانی سەردەمی فەتحعەلی شا؛ و ئەرزەڕۆمی دووەم (١٨٤٧) بە دەستێوەردان و ناوبژیوانی ڕاستەوخۆی بەریتانیا و ڕووسیای قەیسەری لەسەر دیاریکردنی سنووری محەممەرە و زەوی لەوەڕگەی هۆزە کۆچەرییە کوردەکان.",
          datesAndTreaties: ["١٨٢٣ ز: پەیمانی ئەرزەڕۆمی یەکەم", "٣١ی ئایاری ١٨٤٧ ز: پەیمانی ئەرزەڕۆمی دووەم"],
          keyHistoricalEvents: [
            "بەشداری لیژنەی چوارقۆڵی (عوسمانی، ئێران، بەریتانیا، ڕووسیا)",
            "بڕگەکانی تایبەت بە هاتوچۆی هۆزە کۆچەرییە کوردەکان بەسەر سنووردا",
            "لکاندنی ناوچەی محەممەرە (عەرەبستان/ئەحواز) و بەشێک لە خاکی زەهاو بە ئێران"
          ]
        },
        {
          id: "hist-2-3",
          title: "پرۆتۆکۆلی تاران (١٩١١) و پرۆتۆکۆلی ئەستەنبوڵ (١٩١٣)",
          page: "٤١ - ٤٤",
          chapterNumber: 2,
          summary: "کۆتا هەوڵەکانی دیاریکردنی خاڵە سنوورییەکان بە وردی بەر لە هەڵگیرسانی جەنگی جیهانی یەکەم و چەسپاندنی ستوونی سنووری بە درێژایی خاکی کوردستان.",
          datesAndTreaties: ["١٩١١ ز: پرۆتۆکۆلی تاران", "١٩١٣ ز: پرۆتۆکۆلی ئەستەنبوڵ"],
          keyHistoricalEvents: [
            "دیاریکردنی دۆڵی دەشتی وەزنێ و سنووری خانەقین و قەسر شیرین",
            "پشتگوێخستنی تەواوی مافی نەتەوایەتی گەلی کورد لە کێشانی هێڵەکاندا"
          ]
        }
      ]
    },
    {
      chapterIndex: 3,
      title: "بەشی سێیەم: ئیستعماری ئەوروپی و فراوانخوازی لە ڕۆژهەڵاتی ناوەڕاستدا",
      subtitle: "هەڵمەتی ناپلیۆن بۆ سەر میسر و شام ١٧٩٨، کێبڕکێی ئیمپریالیزمی بەریتانیا و فەرەنسا",
      pages: "٤٥ - ٥٦",
      iconColor: "text-rose-400 bg-rose-950/60 border-rose-700/50",
      description: "هاتنی زلهێزە مۆدێرنە ئەوروپییەکان بۆ سەر ناوچەی ڕۆژهەڵاتی ناوەڕاست؛ پەلاماری ناپلیۆن بۆ سەر میسر، دەرکەوتنی محەمەد عەلی پاشا، و کێبڕکێی داگیرکاری بەریتانیا بۆ پاراستنی ڕێگای هیندستان.",
      lessons: [
        {
          id: "hist-3-1",
          title: "هەڵمەتی ناپلیۆن بۆ سەر میسر (١٧٩٨) و دەرئەنجامەکانی",
          page: "٤٥ - ٥٠",
          chapterNumber: 3,
          summary: "پەلاماردانی میسر لەلایەن ناپلیۆن بۆناپارت بە ئامانجی پچڕاندنی هێڵی گەیاندنی بەریتانیا بە هیندستان؛ شەڕی ئەهرام، شکستی کەشتیگەلی فەرەنسی لە ئەبو قیر لەلایەن نێڵسۆن، و کشانەوە لە شام لە عەککا.",
          datesAndTreaties: ["١٧٩٨ ز: داگیرکردنی میسر لەلایەن ناپلیۆن", "١٨٠١ ز: کشانەوەی سوپای فەرەنسا لە میسر"],
          keyHistoricalEvents: [
            "خەبەربوونەوەی ڕۆژهەڵات و دەستپێکی پەیوەندی بە شارستانییەتی مۆدێرن",
            "شکستی ناپلیۆن لە بەردەم قەڵای عەککا بە سەرکردایەتی ئەحمەد پاشای جەزار",
            "سەرهەڵدانی سەردەمی نوێ لە میسر بە دەسەڵاتگرتنی محەمەد عەلی پاشا"
          ]
        },
        {
          id: "hist-3-2",
          title: "کێبڕکێی بەریتانیا، فەرەنسا و ڕووسیا لەسەر ئیمپراتۆریەتی عوسمانی",
          page: "٥١ - ٥٦",
          chapterNumber: 3,
          summary: "چەمکی 'مەسەلەی ڕۆژهەڵات' (Eastern Question) و هەوڵی دەوڵەتە زلهێزەکان بۆ دابەشکردنی میراتی 'پیاوە نەخۆشەکە' (دەوڵەتی عوسمانی) و پاراستنی بەرژەوەندییە ئابوورییەکان.",
          datesAndTreaties: ["١٨٣٣ ز: پەیمانی خونکار ئیسکەلەسی", "١٨٤١ ز: پەیمانی لەندەن دەربارەی گەرووەکان"],
          keyHistoricalEvents: [
            "ستراتیژی بەریتانیا لە هێشتنەوەی عوسمانی وەک بەربەست لە بەردەم ڕووسیا",
            "هەوڵەکانی ڕووسیا بۆ گەیشتن بە ئاوە گەرمەکانی کەنداو و دەریای ناوەڕاست"
          ]
        }
      ]
    },
    {
      chapterIndex: 4,
      title: "بەشی چوارەم: میرنشین و حکوومەتی کوردییەکان",
      subtitle: "ئەردەڵان، بابان (سلێمانی)، سۆران (میر محەمەد پاشا)، بۆتان (میر بەدرخان)، بادینان",
      pages: "٥٧ - ٩٤",
      iconColor: "text-purple-400 bg-purple-950/60 border-purple-700/50",
      description: "سەردەمی زێڕینی حوکمڕانی نیمچە سەربەخۆی میرنشینە مێژووییەکانی کوردستان؛ هێزی سەربازی، پیشەسازی چەکسازی، ئەدەب و شارستانییەت، و هۆکارەکانی لەناوچوونیان لە سەدەی نۆزدەهەم لەلایەن عوسمانییەکانەوە.",
      lessons: [
        {
          id: "hist-4-1",
          title: "میرنشینی ئەردەڵان و میرنشینی بابان",
          page: "٥٧ - ٦٨",
          chapterNumber: 4,
          summary: "مێژووی میرنشینی ئەردەڵان لە سنە و شەڕەکانی لەگەڵ قاجار؛ و میرنشینی مەزنی بابان، دروستکردنی شاری سلێمانی لە ساڵی ١٧٨٤ لەلایەن ئیبراهیم پاشای بابان، شەڕی دەربەند بازیان (١٨٠٥) بە سەرکردایەتی عەبدولڕەحمان پاشا، و ڕووخانی لە ساڵی ١٨٥١ لە سەردەمی ئەحمەد پاشای بابان.",
          datesAndTreaties: ["١٧٨٤ ز: دروستکردنی شاری سلێمانی", "١٨٠٥ ز: شەڕی دەربەندی بازیان", "١٨٥١ ز: ڕووخانی میرنشینی بابان", "١٨٦٧ ز: کۆتایی میرنشینی ئەردەڵان"],
          keyHistoricalEvents: [
            "بنیاتنانی شارستانییەت و بوژانەوەی زمانی ئەدەبی کوردی لە سلێمانی",
            "ڕۆڵی ئەحمەد پاشای بابان و مەحموود پاشای بابان لە ڕووبەڕووبوونەوەی والی بەغدا",
            "سیاسەتی مەڵبەندێتیی (ناوەندێتی) عوسمانی بۆ کۆتاییهێنان بە میرنشینەکان"
          ]
        },
        {
          id: "hist-4-2",
          title: "میرنشینی سۆران و شۆڕشی میر محەمەد (پاشای گەورە)",
          page: "٦٩ - ٨٠",
          chapterNumber: 4,
          summary: "سەرهەڵدانی میرنشینی سۆران لە ڕەواندز؛ دەسەڵاتی داهێنەرانەی میر محەمەد (١٨١٣-١٨٣٦)؛ لێدانی سکەی دراو، دروستکردنی کارگەی تۆپ و چەک لەلایەن وەستا ڕەجەب، فراوانکردنی سنووری میرنشینەکە لە زێی بچووک تا موسڵ و بۆتان، و فرتوفێڵی ڕەشید پاشای عوسمانی و فەتوای مەلا خەتی بۆ ڕووخاندنی میرنشینەکە لە ١٨٣٦.",
          datesAndTreaties: ["١٨١٣-١٨٣٦ ز: سەردەمی حوکمڕانی پاشای گەورە", "١٨٣٦ ز: کۆتایی میرنشینی سۆران بە پیلانی عوسمانی"],
          keyHistoricalEvents: [
            "دامەزراندنی کارگەی پێشکەوتووی چەک و ڕشتنی تۆپی ئاسن لە ڕەواندز",
            "ڕێکخستنی سوپایەکی تۆکمەی ٤٠ هەزار سەربازی بە جلوبەرگی سەربازی یەکپۆش",
            "کوشتنی ناپاکانەی میر محەمەد لە ڕێگای گەڕانەوە لە ئەستەنبوڵ"
          ]
        },
        {
          id: "hist-4-3",
          title: "میرنشینی بۆتان و بزووتنەوەی میر بەدرخان پاشا",
          page: "٨١ - ٩٤",
          chapterNumber: 4,
          summary: "مێژووی میرنشینی بۆتان لە جزیرەی ئیبن عومەر؛ چاکسازییە ئیداری و سەربازییەکانی میر بەدرخان پاشا (١٨٢١-١٨٤٧)؛ هاوپەیمانی لەگەڵ خان مەحموود و نوورەڵڵا بەگی هەکاری؛ دروستکردنی کارگەی بارووت لە جەزیرە؛ دەستێوەردانی میسیۆنەرە ڕۆژئاواییەکان لە مەسەلەی ئاشوورییەکان؛ خیانەتی یەزدان شێر و ڕووخانی میرنشینەکە لە ١٨٤٧.",
          datesAndTreaties: ["١٨٢١-١٨٤٧ ز: سەردەمی میر بەدرخان پاشا", "١٨٤٧ ز: ڕووخانی قەڵای ئەرۆخ و کۆتایی میرنشینی بۆتان"],
          keyHistoricalEvents: [
            "سەپاندنی دادپەروەری و ئاسایش بە شێوەیەک گەشتیارە ئەوروپییەکان سەرسام بوون",
            "پیلانی دەوڵەتانی ئەوروپا (بەریتانیا و فەرەنسا) لە دژی دەسەڵاتی میر بەدرخان",
            "دوورخستنەوەی میر بەدرخان و خانەوادەکەی بۆ دوورگەی کریت و دیمەشق"
          ]
        }
      ]
    },
    {
      chapterIndex: 5,
      title: "بەشی پێنجەم: بزووتنەوەی چاکسازی عوسمانی (تەنزیمات)",
      subtitle: "فەرمانی خەتی شەریف ١٨٣٩، خەتی هومایۆن ١٨٥٦، دەستووری مەشرووتییەت ١٨٧٦",
      pages: "٩٥ - ١٠٦",
      iconColor: "text-emerald-400 bg-emerald-950/60 border-emerald-700/50",
      description: "هەوڵەکانی نوێکردنەوەی ئیمپراتۆریەتی عوسمانی بۆ ڕێگریکردن لە هەرەس؛ قۆناغەکانی تەنزیمات، کاریگەرییەکانی لەسەر سڕینەوەی میرنشینە کوردییەکان و ڕەوشی وڵاتانی عەرەبی.",
      lessons: [
        {
          id: "hist-5-1",
          title: "فەرمانی خەتی شەریفی گوڵخانە (١٨٣٩) و خەتی هومایۆن (١٨٥٦)",
          page: "٩٥ - ١٠٠",
          chapterNumber: 5,
          summary: "دەرچوونی فەرمانی گوڵخانە لە سەردەمی سوڵتان عەبدولمەجید؛ بەڵێنی یەکسانی هاووڵاتیان، ڕێکخستنی باج و سەربازی، و چەسپاندنی ناوەندێتیی دەسەڵاتی تورکی عوسمانی لەسەر ویلایەتەکان.",
          datesAndTreaties: ["١٨٣٩ ز: خەتی شەریفی گوڵخانە", "١٨٥٦ ز: خەتی هومایۆن پاش شەڕی قرم"],
          keyHistoricalEvents: [
            "پشتگوێخستنی تایبەتمەندی نەتەوایەتی گەلانی ناوتورک (کورد و عەرەب)",
            "دروستکردنی والی سەربازی ڕاستەوخۆ لە ئەستەنبوڵەوە بۆ بەڕێوەبردنی کوردستان"
          ]
        },
        {
          id: "hist-5-2",
          title: "قۆناغی مەشرووتییەتی یەکەم (١٨٧٦) و دەسەڵاتی سوڵتان عەبدولحەمیدی دووەم",
          page: "١٠١ - ١٠٦",
          chapterNumber: 5,
          summary: "ڕاگەیاندنی یەکەم دەستووری عوسمانی لەسەر دەستی مەدحەت پاشا، هەڵوەشاندنەوەی پەرلەمان (مەجلیسی مەبعوسان) لەلایەن سوڵتان عەبدولحەمیدی دووەم (١٨٧٦-١٩٠٩)، دروستکردنی سوارەی حەمیدییە لە هۆزە کوردەکان.",
          datesAndTreaties: ["١٨٧٦ ز: ڕاگەیاندنی دەستووری مەشرووتییەت", "١٨٩١ ز: پێکهێنانی فەوجەکانی سوارەی حەمیدییە"],
          keyHistoricalEvents: [
            "ستراتیژی سوڵتان عەبدولحەمید لە بەکارهێنانی ئایین و پان-ئیسلامیزم",
            "ڕۆڵی سوارەی حەمیدییە لە دروستکردنی ناتەبایی نێوان پێکهاتەکانی ناوچەکە"
          ]
        }
      ]
    },
    {
      chapterIndex: 6,
      title: "بەشی شەشەم: ڕۆژنامەگەری کوردی و پارت و کۆمەڵە کوردییەکان",
      subtitle: "ڕۆژنامەی کوردستان ١٨٩٨، کۆمەڵەی تەعالی و تەرەقی کورد، کۆمەڵەی هێڤی",
      pages: "١٠٧ - ١٢٢",
      iconColor: "text-cyan-400 bg-cyan-950/60 border-cyan-700/50",
      description: "سەرهەڵدانی هۆشیاری نەتەوەیی مۆدێرنی کورد؛ چاپکردنی یەکەم ڕۆژنامەی کوردی لە قاهیرە، دامەزراندنی ڕێکخراو و کۆمەڵە سیاسی و خوێندکارییە کوردییەکان لە ئەستەنبوڵ و ئەوروپا.",
      lessons: [
        {
          id: "hist-6-1",
          title: "دەرچوونی یەکەمین ڕۆژنامەی کوردی (ڕۆژنامەی کوردستان ١٨٩٨)",
          page: "١٠٧ - ١١٤",
          chapterNumber: 6,
          summary: "دەرچوونی ژمارە (١)ی ڕۆژنامەی کوردستان لە ٢٢ی نیسانی ١٨٩٨ لە قاهیرەی میسر لەلایەن میقداد مەدحەت بەدرخان، گواستنەوەی بۆ ژنێڤ، لەندەن و فۆڵکستۆن لەلایەن عەبدولڕەحمان بەدرخان، ڕۆڵی لە بڵاوکردنەوەی زانست و بیروباوەڕی نەتەوەیی.",
          datesAndTreaties: ["٢٢ی نیسانی ١٨٩٨ ز: دەرچوونی یەکەم ڕۆژنامەی کوردی", "١٩٠٢ ز: کۆتایی دەرچوونی ڕۆژنامەی کوردستان (٣١ ژمارە)"],
          keyHistoricalEvents: [
            "دیاریکردنی ٢٢ی نیسان وەک ڕۆژی ڕۆژنامەگەریی کوردی",
            "بەرەنگاربوونەوەی ستەمی سوڵتان عەبدولحەمید و داواکردنی مافی خوێندن بە زمانی کوردی"
          ]
        },
        {
          id: "hist-6-2",
          title: "پارت و کۆمەڵە کوردییەکان (١٩٠٨ - ١٩١٤)",
          page: "١١٥ - ١٢٢",
          chapterNumber: 6,
          summary: "شۆڕشی گەنجانی تورک (١٩٠٨) و کرانەوەی دەرفەت بۆ کوردییەکان؛ دامەزراندنی کۆمەڵەی تەعاوون و تەرەقی کورد، کۆمەڵەی تەعالی کورد، کۆمەڵەی هێڤی خوێندکارانی کورد (١٩١٢)، و دەرچوونی گۆڤارەکانی ڕۆژی کورد و یەکبوون.",
          datesAndTreaties: ["١٩٠٨ ز: دامەزراندنی کۆمەڵەی تەعاوون و تەرەقی کورد", "١٩١٢ ز: دامەزراندنی کۆمەڵەی هێڤی خوێندکارانی کورد"],
          keyHistoricalEvents: [
            "ڕۆڵی ڕووناکبیرانی وەک ئەمین عالی بەدرخان، شێخ عەبدولقادری شەمزینی و قەدری جەمیل پاشا",
            "داواکاری مافی خودموختاری و خوێندنی کوردی لە پەرلەمانی عوسمانیدا"
          ]
        }
      ]
    },
    {
      chapterIndex: 7,
      title: "بەشی حەوتەم: کوردستان لە جەنگی جیهانی یەکەم و دوای جەنگ",
      subtitle: "ڕووداوەکانی جەنگ، پەیمانی نهێنی سایکس-پیکۆ ١٩١٦، پەیمانی سێڤر ١٩٢٠، پەیمانی لۆزان ١٩٢٣",
      pages: "١٢٣ - ١٤٠",
      iconColor: "text-red-400 bg-red-950/60 border-red-700/50",
      description: "ماڵوێرانییەکانی جەنگی جیهانی یەکەم لەسەر خاکی کوردستان؛ پیلانی نهێنی دابەشکردنی ڕۆژهەڵاتی ناوەڕاست (سایکس-پیکۆ)، بەڵێنەکانی پەیمانی سێڤر بۆ سەربەخۆیی کوردستان، و ناپاکی پەیمانی لۆزان بە هەڵوەشاندنەوەی تەواوی مافەکانی کورد.",
      lessons: [
        {
          id: "hist-7-1",
          title: "جەنگی جیهانی یەکەم و پەیمانی نهێنی سایکس-پیکۆ (١٩١٦)",
          page: "١٢٣ - ١٣٠",
          chapterNumber: 7,
          summary: "بەشداری عوسمانی لە بەرەی ئەڵمانیا لە ١٩١٤، کاولکاری و نەهامەتی لە کوردستان، ڕێکەوتننامەی نهێنی سایکس-پیکۆ لە ئایاری ١٩١٦ لە نێوان مارک سایکس و فرانسوا جۆرج پیکۆ بە ڕەزامەندی ڕووسیا بۆ دابەشکردنی ویلایەتەکانی عوسمانی و دابەشکردنی کوردستان بۆ ناوچەکانی فەرەنسا و بەریتانیا.",
          datesAndTreaties: ["١٦ی ئایاری ١٩١٦ ز: پەیمانی نهێنی سایکس-پیکۆ", "١٩١٧ ز: شۆڕشی ئۆکتۆبەر و ئاشکراکردنی پەیماننامە نهێنییەکان"],
          keyHistoricalEvents: [
            "دابەشکردنی خاکی ویلایەتی موسڵ، بەغدا و بەسرە لەژێر هەژموونی بەریتانیا",
            "کەوتنی باکووری کوردستان و شام لەژێر کاریگەری فەرەنسا"
          ]
        },
        {
          id: "hist-7-2",
          title: "پەیمانی سێڤر (١٩٢٠) و بەندەکانی ٦٢، ٦٣ و ٦٤",
          page: "١٣١ - ١٣٥",
          chapterNumber: 7,
          summary: "واژۆکردنی پەیمانی ئاشتی سێڤر لە ١٠ی ئابی ١٩٢٠ لە فەرەنسا لە نێوان دەوڵەتانی هاوپەیمان و نوێنەری عوسمانی؛ دانپێدانانی نێودەوڵەتی بە مافی کورد بۆ ئۆتۆنۆمی و سەربەخۆیی بە پێی بەندەکانی ٦٢، ٦٣، و ٦٤ لە ڕێگای کۆمەڵەی گەلان؛ ڕۆڵی شەریف پاشای خەندان لە کۆنگرەی ئاشتی پاریس.",
          datesAndTreaties: ["١٠ی ئابی ١٩٢٠ ز: واژۆکردنی پەیمانی سێڤر (Sevres)"],
          keyHistoricalEvents: [
            "بەندەکانی ٦٢-٦٤: مافی خودموختاری و دەرفەتی ڕاگەیاندنی دەوڵەتی سەربەخۆی کوردستان",
            "یەکەم بەڵگەنامەی نێودەوڵەتی کە مافی سەربەخۆیی بۆ گەلی کورد چەسپاندبێت"
          ]
        },
        {
          id: "hist-7-3",
          title: "پەیمانی لۆزان (١٩٢٣) و زەوتکردنی مافەکانی کورد",
          page: "١٣٦ - ١٤٠",
          chapterNumber: 7,
          summary: "سەرکەوتنی کەمالییەکان بە ڕابەرایەتی مستەفا کەمال ئەتاتورک؛ دانوستانەکانی لۆزان لە سویسرا لە تەممووزی ١٩٢٣؛ هەڵوەشاندنەوەی بڕگەکانی پەیمانی سێڤر و زەوتکردنی تەواوی مافە نەتەوایەتییەکانی گەلی کورد و دابەشکردنی نیشتمانی کوردستان بەسەر چوار دەوڵەتدا (تورکیا، عێراق، ئێران، سوریا).",
          datesAndTreaties: ["٢٤ی تەممووزی ١٩٢٣ ز: واژۆکردنی پەیمانی لۆزان (Lausanne)"],
          keyHistoricalEvents: [
            "فەرامۆشکردنی ناوی کورد لە تەواوی بڕگەکانی پەیماننامەی نوێدا",
            "چەسپاندنی سنووری مۆدێرنی دەوڵەتانی ناوچەکە بەبێ لەبەرچاوگرتنی ئیرادەی کورد"
          ]
        }
      ]
    },
    {
      chapterIndex: 8,
      title: "بەشی هەشتەم: شۆڕش و ڕاپەڕینەکانی گەلی کورد (١٨٥٠ - ١٩٤٥)",
      subtitle: "یەزدان شێر ١٨٥٥، شێخ عوبەیدوڵڵا ١٨٨٠، شێخ مەحموود، شێخ سەعید ١٩٢٥، ئاگری، بارزان",
      pages: "١٤١ - ١٩٠",
      iconColor: "text-emerald-400 bg-emerald-950/60 border-emerald-700/50",
      description: "مێژووی خەباتی چەکداری و شۆڕشگێڕیی گەلی کورد بۆ ڕزگاری و سەربەخۆیی؛ لە شۆڕشی شێخ عوبەیدوڵڵا و حکوومەتەکەی شێخ مەحموودی حەفیدەوە تا شۆڕشەکانی ئاگری داغ و بزووتنەوەی بارزان.",
      lessons: [
        {
          id: "hist-8-1",
          title: "ڕاپەڕینی یەزدان شێر (١٨٥٥) و شۆڕشی شێخ عوبەیدوڵڵای نەهری (١٨٨٠)",
          page: "١٤١ - ١٥٢",
          chapterNumber: 8,
          summary: "ڕاپەڕینی یەزدان شێر لە کاتی شەڕی قرم و کۆنترۆڵکردنی ناوچەیەکی فراوان؛ و شۆڕشی مەزنی شێخ عوبەیدوڵڵای نەهری (١٨٨٠) بە هاوکاری کۆمەڵەی (پێشکەوتنی کورد) بۆ دامەزراندنی دەوڵەتێکی یەکگرتووی سەربەخۆی کوردستان لە نێوان عوسمانی و ئێراندا.",
          datesAndTreaties: ["١٨٥٥ ز: ڕاپەڕینی یەزدان شێر", "١٨٨٠ ز: شۆڕشی شێخ عوبەیدوڵڵای نەهری"],
          keyHistoricalEvents: [
            "نامەی مێژوویی شێخ عوبەیدوڵڵا بۆ کونسوڵی بەریتانیا: 'گەلی کورد نەتەوەیەکی جیاوازە'",
            "هاوپەیمانی عوسمانی و ئێران بۆ لێدانی هێزەکانی شێخ عوبەیدوڵڵا و دوورخستنەوەی بۆ مەککە"
          ]
        },
        {
          id: "hist-8-2",
          title: "حکوومەتی کوردستان و شۆڕشەکانی شێخ مەحموودی حەفید (١٩١٩ - ١٩٣١)",
          page: "١٥٣ - ١٦٨",
          chapterNumber: 8,
          summary: "سەرهەڵدانی شێخ مەحموودی حەفید لە سلێمانی لە دوای جەنگی جیهانی یەکەم؛ ڕاگەیاندنی حکوومەتی کوردستان لە ١٩١٩؛ شەڕی دەربەند بازیان و بەدیلگیرانی شێخ مەحموود؛ گەڕانەوەی لە هیندستان لە ١٩٢٢ بە داوای بەریتانیا؛ ڕاگەیاندنی پادشایەتی کوردستان؛ شەڕی ئاوباریک و بەردەوامی خەبات تا ١٩٣١.",
          datesAndTreaties: ["١٩١٩ ز: یەکەم ڕاپەڕینی شێخ مەحموود و شەڕی بازیان", "١٩٢٢ ز: ڕاگەیاندنی حوکمداری و پادشایەتی لە سلێمانی", "١٩٣١ ز: شەڕی ئاوباریک"],
          keyHistoricalEvents: [
            "دەرکردنی یەکەمین پوولی پۆستە و چاپکردنی ڕۆژنامەی بانگی کوردستان و ڕۆژی کوردستان",
            "بۆردومانی شاری سلێمانی بە فڕۆکەی جەنگی بەریتانی (RAF)",
            "شێخ مەحموود وەک هێمای نەتەوەیی بەرەنگاربوونەوەی داگیرکاری بەریتانیا"
          ]
        },
        {
          id: "hist-8-3",
          title: "شۆڕشی شێخ سەعیدی پیران (١٩٢٥) و کۆماری ئاگری داغ (١٩٣٠)",
          page: "١٦٩ - ١٨٠",
          chapterNumber: 8,
          summary: "شۆڕشی شێخ سەعیدی پیران لە باکووری کوردستان لە ١٩٢٥ لە دژی دەسەڵاتی کەمالیستەکان و لەسێدارەدانی شێخ و هاوەڵانی لە ئامەد؛ دامەزراندنی کۆمەڵەی خۆیبۆن لە ١٩٢٧ لە بەحەمدوونی لوبنان؛ شۆڕشی ئاگری داغ بە سەرکردایەتی ئیحسان نوری پاشا و هاوپەیمانی تورکیا و ئێران بۆ دامرکاندنەوەی شۆڕشەکە.",
          datesAndTreaties: ["شوباتی ١٩٢٥ ز: هەڵگیرسانی شۆڕشی شێخ سەعیدی پیران", "١٩٢٧ ز: دامەزراندنی کۆمەڵەی خۆیبۆن (Xoybûn)", "١٩٣٠ ز: شۆڕشی چیای ئاگری داغ"],
          keyHistoricalEvents: [
            "یاسای بێدەنگکردن (تەقریری سوکون) و دادگاکانی ئیستقلال لە تورکیا",
            "ئاڵای سەربەخۆیی کوردستان لەسەر لوتکەی چیای ئاگری و دەرکردنی گۆڤاری ئاگری"
          ]
        },
        {
          id: "hist-8-4",
          title: "بزووتنەوەی بارزان (١٩٣١ - ١٩٤٥)",
          page: "١٨١ - ١٩٠",
          chapterNumber: 8,
          summary: "بزووتنەوەی بارزان بە ڕێبەرایەتی شێخ ئەحمەدی بارزان؛ ڕووبەڕووبوونەوە لەگەڵ هێزەکانی بەریتانیا و عێراق؛ دەرکەوتنی جەنەڕاڵ مەلا مستەفا بارزانی لە شۆڕشی ١٩٤٣-١٩٤٥ لە ناوچەی بارزان، و بەستنەوەی خەباتی باشوور بە مەیدانی ڕۆژهەڵاتی کوردستان و ئامادەکاری بۆ کۆماری مەهاباد.",
          datesAndTreaties: ["١٩٣١-١٩٣٢ ز: شۆڕشی یەکەمی بارزان", "١٩٤٣-١٩٤٥ ز: بزووتنەوەی چەکداری بە ڕێبەرایەتی مستەفا بارزانی"],
          keyHistoricalEvents: [
            "پەیامی دادپەروەری کۆمەڵایەتی و یەکسانی و پاراستنی ژینگە لە ڕێبازی بارزاندا",
            "کشانەوەی هێزەکانی بارزانی بەرەو ڕۆژهەڵاتی کوردستان و بەشداریکردن لە کۆماری کوردستان"
          ]
        }
      ]
    },
    {
      chapterIndex: 9,
      title: "بەشی نۆیەم: ڕاپەڕین و شۆڕشەکانی عێراق و ڕۆڵی کورد",
      subtitle: "شۆڕشی بیست ١٩٢٠، دانانی مەلیک فەیسەڵ ١٩٢١، شۆڕشی ١٤ی تەممووزی ١٩٥٨",
      pages: "١٩١ - ٢٢٨",
      iconColor: "text-indigo-400 bg-indigo-950/60 border-indigo-700/50",
      description: "مێژووی سەرهەڵدانی دەوڵەتی مۆدێرنی عێراق لەسەر بنەمای داگیرکاری بەریتانیا؛ شۆڕشی ١٩٢٠ و ڕۆڵی کورد لە تەلەعفەر و کفری و هەولێر، پاشایەتی هاشمی، و کودەتای ١٤ی تەممووزی ١٩٥٨ و دەستووری کاتی.",
      lessons: [
        {
          id: "hist-9-1",
          title: "شۆڕشی بیست (١٩٢٠) و بەشداریی گەلی کورد",
          page: "١٩١ - ٢٠٤",
          chapterNumber: 9,
          summary: "هۆکارەکانی بەرپابوونی شۆڕشی ١٩٢٠ لە دژی ئیستعماری بەریتانیا؛ بزووتنەوەی جەماوەری لە فوراتی ناوەڕاست و ڕاپەڕینی کورد لە تەلەعفەر، مووسڵ، کفری، ڕەواندز و کۆیە؛ شکستی هێزەکانی بەریتانیا لە چەندین بەرەدا.",
          datesAndTreaties: ["حوزەیرانی ١٩٢٠ ز: هەڵگیرسانی شۆڕشی بیست لە عێراق"],
          keyHistoricalEvents: [
            "هاوپەیمانی پێکهاتەکان بۆ دەرکردنی بەریتانیا لە عێراق",
            "ئەنجامەکانی شۆڕشەکە کە بەریتانیای ناچار کرد دەستبەرداری حوکمی ڕاستەوخۆ بێت"
          ]
        },
        {
          id: "hist-9-2",
          title: "دامەزراندنی دەوڵەتی عێراق و حوکمی پاشایەتی (١٩٢١ - ١٩٥٨)",
          page: "٢٠٥ - ٢١٨",
          chapterNumber: 9,
          summary: "کۆنگرەی قاهیرە (١٩٢١) لەسەر دەستی وینستۆن چەرچڵ؛ تاجی پاشایەتی بۆ مەلیک فەیسەڵی یەکەم؛ مەسەلەی ویلایەتی موسڵ و لکاندنی باشووری کوردستان بە دەوڵەتی نوێی عێراق بە پێی بڕیاری کۆمەڵەی گەلان لە ١٩٢٥؛ و پەیمانی ١٩٣٠ی عێراق و بەریتانیا.",
          datesAndTreaties: ["ئابی ١٩٢١ ز: تاگوزاری مەلیک فەیسەڵی یەکەم", "١٩٢٥ ز: بڕیاری لکاندنی ویلایەتی موسڵ بە عێراق", "٣٠ی حوزەیرانی ١٩٣٠ ز: پەیمانی عێراق - بەریتانیا"],
          keyHistoricalEvents: [
            "مەرجەکانی کۆمەڵەی گەلان بۆ پاراستنی مافی نەتەوەیی و ئیداریی کورد لە عێراق",
            "خۆپیشاندانی ٦ی ئەیلولی ١٩٣٠ (ڕۆژی ڕەش) لە بەردەرکی سەرای سلێمانی"
          ]
        },
        {
          id: "hist-9-3",
          title: "شۆڕشی ١٤ی تەممووزی ١٩٥٨ و گۆڕانی سیستەم بۆ کۆماری",
          page: "٢١٩ - ٢٢٨",
          chapterNumber: 9,
          summary: "ڕێکخراوی ئەفسەرانی ئازاد بە سەرکردایەتی عەبدولکەریم قاسم و عەبدولسەلام عارف؛ ڕووخانی ڕژێمی پاشایەتی هاشمی؛ ڕاگەیاندنی کۆماری عێراق؛ بڕگەی ٣ی دەستووری کاتی ١٩٥٨ ('کورد و عەرەب هاوبەشن لەم نیشتمانەدا')؛ گەڕانەوەی مەلا مستەفا بارزانی لە یەکێتی سۆڤیەت لە ئۆکتۆبەری ١٩٥٨.",
          datesAndTreaties: ["١٤ی تەممووزی ١٩٥٨ ز: شۆڕشی ١٤ی تەممووز", "ئۆکتۆبەری ١٩٥٨ ز: گەڕانەوەی مستەفا بارزانی بۆ بەغدا"],
          keyHistoricalEvents: [
            "دەستووری کاتی ١٩٥٨: دانپێدانانی فەرمی بە هاوبەشیی نەتەوەیی کورد لە عێراق",
            "دەرکردنی یاسای چاکسازی کشتوکاڵی و هەڵوەشاندنەوەی پەیمانی بەغدا"
          ]
        }
      ]
    },
    {
      chapterIndex: 10,
      title: "بەشی دەیەم: بزووتنەوەی ئیستعماری نوێی ئەوروپی لە نیشتمانی عەرەب",
      subtitle: "داگیرکردنی جەزائیر ١٨٣٠، تونس، مەغریب، داگیرکردنی میسر ١٨٨٢، مەسەلەی فەلەستین",
      pages: "٢٢٩ - ٢٦٤",
      iconColor: "text-orange-400 bg-orange-950/60 border-orange-700/50",
      description: "مێژووی داگیرکاری ئیمپریالیزمی فەرەنسی و بەریتانی لەسەر باکووری ئەفەریقا و جیهانی عەرەبی؛ لە داگیرکردنی جەزائیر و شۆڕشی عەبدولقادری جەزائیری تا کەوتنی میسر لە ١٨٨٢ و بەڵێننامەی بالفۆر ١٩١٧ بۆ خاکی فەلەستین.",
      lessons: [
        {
          id: "hist-10-1",
          title: "ئیستعماری فەرەنسی لە جەزائیر، تونس و مەغریب",
          page: "٢٢٩ - ٢٤٢",
          chapterNumber: 10,
          summary: "داگیرکردنی جەزائیر لە ساڵی ١٨٣٠ لەسەر بەهانەی 'ڕووداوی پانکە'؛ بەرەنگاربوونەوەی نەبەردانەی ئەمیر عەبدولقادری جەزائیری (١٨٣٢-١٨٤٧)؛ سەپاندنی پارێزگاری فەرەنسی بەسەر تونس لە ١٨٨١ (پەیمانی باردۆ)؛ و دابەشکردنی مەغریب لە نێوان فەرەنسا و ئیسپانیا لە ١٩١٢ پاش پەیمانی فاس.",
          datesAndTreaties: ["١٨٣٠ ز: داگیرکردنی جەزائیر لەلایەن فەرەنسا", "١٨٨١ ز: داگیرکردنی تونس (پەیمانی باردۆ)", "١٩١٢ ز: سەپاندنی پارێزگاری بەسەر مەغریب (پەیمانی فاس)"],
          keyHistoricalEvents: [
            "شۆڕشی ملیۆن و نیو شەهیدی جەزائیر لە پێناو ئازادی",
            "سیاسەتی بەفەرەنسیکردن (Francization) و زەوتکردنی زەویوزاری جووتیاران"
          ]
        },
        {
          id: "hist-10-2",
          title: "داگیرکردنی میسر و سوودان لەلایەن بەریتانیاوە (١٨٨٢)",
          page: "٢٤٣ - ٢٥٢",
          chapterNumber: 10,
          summary: "قەیرانی قەرزی دارایی و پشکەکانی نۆکەندی سوێس؛ شۆڕشی ئەحمەد عورابی لە دژی دەستێوەردانی بیانی؛ تۆپبارانکردنی ئەسکەندەریە لەلایەن بەریتانیا لە ١٨٨٢؛ شەڕی تەلی کەبیر و داگیرکردنی فەرمی میسر؛ و شۆڕشی مەهدی لە سوودان.",
          datesAndTreaties: ["١٨٦٩ ز: کردنەوەی نۆکەندی سوێس", "١٨٨٢ ز: شەڕی تەل کەبیر و داگیرکردنی میسر لەلایەن بەریتانیا"],
          keyHistoricalEvents: [
            "دەسەڵاتی لۆرد کرۆمەر لە میسر و کۆنترۆڵکردنی ئابووری پەمۆ",
            "ڕێکەوتنی حوکمی هاوبەشی بەریتانی-میسری لە سوودان لە ساڵی ١٨٩٩"
          ]
        },
        {
          id: "hist-10-3",
          title: "مەسەلەی فەلەستین و بەڵێننامەی بالفۆر (١٩١٧)",
          page: "٢٥٣ - ٢٦٤",
          chapterNumber: 10,
          summary: "سەرهەڵدانی بزووتنەوەی زایۆنیزم بە سەرۆکایەتی تیۆدۆر هێرتزل (کۆنگرەی بازل ١٨٩٧)؛ بەڵێننامەی بالفۆر لە ٢ی تشرینی دووەمی ١٩١٧ لەلایەن ئارسەر بالفۆری وەزیری دەرەوەی بەریتانیا؛ سەپاندنی ئینتیدابی بەریتانی بەسەر فەلەستین لە کۆنگرەی سان ڕیمۆ ١٩٢٠؛ شۆڕشەکانی گەلی فەلەستین (شۆڕشی قەسام ١٩٣٥ و شۆڕشی ١٩٣٦-١٩٣٩)؛ و پڕۆژەی دابەشکردنی لێژنەی پیڵ لە ١٩٣٧.",
          datesAndTreaties: ["١٨٩٧ ز: کۆنگرەی بازل بۆ زایۆنیزم", "٢ی تشرینی دووەمی ١٩١٧ ز: بەڵێننامەی بالفۆر (Balfour Declaration)", "١٩٣٧ ز: پڕۆژەی دابەشکردنی پیڵ"],
          keyHistoricalEvents: [
            "بەڵێننامەی بەریتانیا بۆ دروستکردنی نیشتمانی نەتەوەیی لە فەلەستین",
            "کۆچپێکردنی جوولەکە بە چاودێری ئینتیدابی بەریتانیا",
            "شۆڕشی گەورەی فەلەستین (١٩٣٦-١٩٣٩) و مانگرتنی سەرتاسەری ٦ مانگی"
          ]
        }
      ]
    }
  ];

  const activeChapter = CHAPTERS_METADATA.find((c) => c.chapterIndex === activeChapterIndex) || CHAPTERS_METADATA[0];

  // Search logic across all lessons
  const searchResults = searchQuery.trim()
    ? CHAPTERS_METADATA.flatMap((c) =>
        c.lessons
          .filter(
            (l) =>
              l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              l.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (l.datesAndTreaties && l.datesAndTreaties.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()))) ||
              (l.keyHistoricalEvents && l.keyHistoricalEvents.some((ke) => ke.toLowerCase().includes(searchQuery.toLowerCase())))
          )
          .map((l) => ({ ...l, chapterTitle: c.title, chapterIndex: c.chapterIndex }))
      )
    : [];

  return (
    <div className="bg-[#071927] border border-cyan-950/80 rounded-3xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-2xl relative overflow-hidden" dir="rtl">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-900/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              مەنهەجی فەرمی وەزارەتی پەروەردە
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              پۆلی دوازدەهەمی ئامادەیی (بەشی وێژەیی)
            </span>
          </div>
          <h2 className="font-sans font-black text-xl sm:text-2xl text-white flex items-center gap-2.5">
            <Landmark className="w-6 h-6 text-amber-400" />
            <span>پەڕتووکی مێژووی نوێ و هاوچەرخ</span>
          </h2>
          <p className="text-xs text-slate-300 font-sans">
            ١٠ بەشی فەرمی (٢٦٤ لاپەڕە): ململانێی ئیمپراتۆریەتەکان، پەیماننامەکان، میرنشین و شۆڕشەکانی کورد
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 bg-[#092238] px-3.5 py-2 rounded-2xl border border-cyan-900/60 shrink-0">
          <div className="text-center pl-3 border-l border-cyan-900/50">
            <span className="text-[10px] text-slate-400 block">ژمارەی بەشەکان</span>
            <span className="text-sm font-bold text-amber-400">١٠ بەش</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block">کۆی لاپەڕەکان</span>
            <span className="text-sm font-mono font-bold text-cyan-300">٢٦٤ لاپەڕە</span>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="گەڕان بۆ ڕووداو، بەروار، پەیماننامە (چاڵدێران، قەسری شیرین، سێڤر، لۆزان، شێخ مەحموود، بارزان...)"
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
            <span>{searchResults.length} وانە و تەوەری مێژوویی دۆزرایەوە:</span>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-[#092238] border border-cyan-950 rounded-2xl p-8 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-slate-300">هیچ بابەتێکی مێژوویی نەدۆزرایەوە بۆ "{searchQuery}"</p>
              <p className="text-xs text-slate-400">وشەیەکی تر تاقی بکەرەوە وەک: چاڵدێران، بابان، سێڤر، لۆزان، ١٩٢٠، ١٩٥٨</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-[#092238] border border-cyan-900/70 hover:border-cyan-500/60 rounded-2xl p-4 space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-800 text-amber-300">
                      {lesson.chapterTitle}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">لاپەڕە {lesson.page}</span>
                  </div>

                  <div>
                    <h4 className="font-sans font-bold text-sm text-white">{lesson.title}</h4>
                    <p className="font-sans text-xs text-slate-300 mt-1 line-clamp-2">{lesson.summary}</p>
                  </div>

                  {lesson.datesAndTreaties && lesson.datesAndTreaties.length > 0 && (
                    <div className="bg-[#061726] border border-cyan-950 p-2.5 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-cyan-400 block">بەروار و پەیماننامە سەرەکییەکان:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {lesson.datesAndTreaties.map((d, idx) => (
                          <span key={idx} className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/40">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-cyan-950">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTopicForStudy?.(lesson.title, lesson.page, lesson.chapterTitle);
                      }}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>خوێندن لەگەڵ زانا</span>
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
        /* STANDARD 10-CHAPTER BROWSER */
        <div className="space-y-6">
          {/* Chapter Selector Grid (10 Chapters) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {CHAPTERS_METADATA.map((ch) => {
              const isActive = activeChapter.chapterIndex === ch.chapterIndex;
              return (
                <button
                  key={ch.chapterIndex}
                  type="button"
                  onClick={() => {
                    setActiveChapterIndex(ch.chapterIndex);
                    setExpandedLessonId(ch.lessons[0]?.id || null);
                  }}
                  className={`text-right p-3 rounded-2xl border transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-[#0b2944] border-cyan-400 shadow-lg shadow-cyan-500/10"
                      : "bg-[#081f33] border-cyan-950/80 hover:border-cyan-800 hover:bg-[#0a253e]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9px] font-mono text-cyan-400">بەشی {ch.chapterIndex}</span>
                    <span className="text-[9px] font-mono text-slate-400">ل. {ch.pages}</span>
                  </div>
                  <h4 className="font-sans font-bold text-xs text-white line-clamp-2 leading-tight">
                    {ch.title.replace(/^بەشی [^:]+: /, "")}
                  </h4>
                </button>
              );
            })}
          </div>

          {/* ACTIVE CHAPTER DISPLAY CARD */}
          <div className="bg-[#081f33] border border-cyan-900/60 rounded-3xl p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-950 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-mono text-cyan-400">
                    لاپەڕە {activeChapter.pages} • {activeChapter.lessons.length} وانەی سەرەکی
                  </span>
                </div>
                <h3 className="font-sans font-black text-lg sm:text-xl text-white">
                  {activeChapter.title}
                </h3>
                <p className="text-xs text-slate-300 font-sans max-w-2xl leading-relaxed">
                  {activeChapter.description}
                </p>
              </div>

              {/* Start unit study with Zana */}
              <button
                type="button"
                onClick={() => {
                  onSelectTopicForStudy?.(activeChapter.title, activeChapter.pages, `بەشی ${activeChapter.chapterIndex}`);
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
                <span>وانە و تەوەڕەکانی ئەم بەشەی مێژوو:</span>
              </h4>

              <div className="space-y-2.5">
                {activeChapter.lessons.map((lesson) => {
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
                          <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400 shrink-0">
                            <Landmark className="w-4 h-4" />
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

                          {/* Important Dates & Treaties Box */}
                          {lesson.datesAndTreaties && lesson.datesAndTreaties.length > 0 && (
                            <div className="bg-[#081f33] border-r-4 border-r-amber-500 border border-cyan-950 p-3 rounded-xl space-y-1.5">
                              <span className="text-[10px] font-bold text-amber-400 block uppercase">
                                بەروار و پەیماننامە گرنگەکانی ئەم وانەیە بۆ تاقیکردنەوەی وزاری:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {lesson.datesAndTreaties.map((dateItem, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs font-mono bg-amber-950/80 text-amber-200 px-2.5 py-0.5 rounded-md border border-amber-800/40"
                                  >
                                    {dateItem}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Key Historical Points */}
                          {lesson.keyHistoricalEvents && lesson.keyHistoricalEvents.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-cyan-400 block">
                                خاڵ و ڕووداوە سەرەکییەکان:
                              </span>
                              <ul className="space-y-1">
                                {lesson.keyHistoricalEvents.map((pt, idx) => (
                                  <li
                                    key={idx}
                                    className="text-xs text-slate-300 flex items-start gap-2"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
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
                                onSelectTopicForStudy?.(lesson.title, lesson.page, activeChapter.title);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-white" />
                              <span>پرسیارکردن لە زانا دەربارەی ئەم بابەتەی مێژوو</span>
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
