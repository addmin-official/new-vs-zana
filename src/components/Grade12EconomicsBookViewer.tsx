import React, { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bookmark,
  Layers,
  FileText,
  TrendingUp,
  DollarSign,
  Scale,
  Globe
} from "lucide-react";

interface Grade12EconomicsBookViewerProps {
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

interface EconomicsChapter {
  chapterIndex: number;
  title: string;
  subtitle: string;
  pages: string;
  iconColor: string;
  description: string;
  lessons: ChapterLesson[];
}

export const Grade12EconomicsBookViewer: React.FC<Grade12EconomicsBookViewerProps> = React.memo(({
  onSelectTopicForStudy,
  onNavigateToChat,
}) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>("econ-1-1");

  const CHAPTERS_METADATA: EconomicsChapter[] = [
    {
      chapterIndex: 1,
      title: "بەشی یەکەم: داهاتی نەتەوەیی و بارگۆڕانی ئابووری",
      subtitle: "National Income & Economic Fluctuation - داهاتی کەسی، داهاتی بەردەست، بەرهەمی نەتەوەیی، قۆناغەکانی بارگۆڕان",
      pages: "٤ - ٤١",
      iconColor: "text-emerald-400 bg-emerald-950/60 border-emerald-700/50",
      description: "لێکۆڵینەوەی داهاتی نەتەوەیی لە هەر کۆمەڵگەیەکدا گرنگترین ئاماژەیە بۆ چاڵاکییە ئابوورییەکان؛ شێوازەکانی پێوانەکردنی داهات (بەپێی پاداشتی بنەماکانی بەرهەمهێنان، بەپێی بەهای شەمەک و کارگوزاری تەواوەکان، و بەپێی خەرجکردنەوە)، هاوکێشەی داهاتی بەردەست، و قۆناغەکانی خولگەی ئابووری (بووژانەوە، هەڵکشان، سستی و داڕمان).",
      lessons: [
        {
          id: "econ-1-1",
          title: "چەمکی داهاتی نەتەوەیی و شێوازەکانی پێناسەکردنی",
          page: "٤ - ١٠",
          chapterNumber: 1,
          summary: "داهاتی نەتەوەیی بەپێی ٣ ڕێگای سەرەکی: ١. پاداشتی خاوەن بنەماکانی بەرهەمهێنان (مووچە + کرێ + سوو + قازانج)؛ ٢. بەپێی بەهای شەمەک و کارگوزارییە تەواوەکان لە ماوەی ساڵێکدا؛ ٣. لە ڕووی خەرجکردنەوە لەلایەن کەرتی تایبەت و گشتی.",
          keyFormulasAndRules: [
            "داهاتی نەتەوەیی = کرێ + موڵکانە + سوو + قازانج",
            "مووچە (Wages): پاداشتی هێزی کار لە پرۆسەی بەرهەمهێناندا",
            "موڵکانە (Rent): داهاتی خاوەن زەوی و باڵەخانە و کەرەستە سروشتییەکان",
            "سوو (Interest): پاداشتی خاوەن سەرمایە نەختینەییەکان",
            "قازانج (Profit): پاداشتی ڕێکخەر (Organiser) و بەڕێوەبەری پڕۆژە"
          ],
          keyTermsAndConcepts: [
            "داهاتی نەتەوەیی (National Income)",
            "بنەماکانی بەرهەمهێنان (Factors of Production)",
            "بەهای زیادکراو (Value Added)",
            "دووبارە هەژمارکردن (Double Counting)"
          ],
          ministerialPoints: [
            "جیاوازی نێوان داهاتی نەتەوەیی لەسەر بنەمای پاداشت و لەسەر بنەمای خەرجکردن",
            "چۆنیەتی دوورکەوتنەوە لە هەڵەی دووبارە هەژمارکردن بە بەکارهێنانی بەهای زیادکراو"
          ]
        },
        {
          id: "econ-1-2",
          title: "داهاتی کەسی، داهاتی ئامادە بۆ خەرج (بەردەست) و بەرهەمی نەتەوەیی",
          page: "١١ - ٢٢",
          chapterNumber: 1,
          summary: "شیکردنەوەی داهاتی کەسی (Personal Income) و داهاتی بەردەست (Disposable Income) کە دەمێنێتەوە پاش دانی باجە ڕاستەوخۆکان؛ دابەشبوونی داهاتی بەردەست بۆ بەکاربردن (Consumption) و پاشەکەوت (Saving).",
          keyFormulasAndRules: [
            "داهاتی کەسی = داهاتی نەتەوەیی - (قازانجی دابەشنەکراو + باجی کۆمپانیاکان + دەستەبەری کۆمەڵایەتی) + یارمەتییە گواستراوەکان",
            "داهاتی بەردەست (خۆڵاو) = داهاتی کەسی - باجی ڕاستەوخۆ لەسەر داهات",
            "داهاتی بەردەست = بەکاربردن (C) + پاشەکەوت (S)",
            "بەرهەمی نەتەوەیی خاو (GNP) = بەرهەمی ناوخۆیی (GDP) + داهاتی هاووڵاتیان لە دەرەوە - داهاتی بیانییەکان لە ناوخۆ"
          ],
          keyTermsAndConcepts: [
            "داهاتی کەسی (Personal Income)",
            "داهاتی ئامادە بۆ خەرج (Disposable Income)",
            "مەیلی کۆتایی بۆ بەکاربردن (MPC)",
            "مەیلی کۆتایی بۆ پاشەکەوت (MPS)"
          ],
          ministerialPoints: [
            "هاوکێشەی دۆزینەوەی داهاتی بەردەست و پەیوەندی بەکاربردن و پاشەکەوت لە پرسیارە ژمارەییەکاندا",
            "ڕۆڵی یارمەتییە گواستراوەکانی دەوڵەت (خوێندکاری، خانەنشینی، بێکاری) لە زیادکردنی داهاتی کەسیدا"
          ]
        },
        {
          id: "econ-1-3",
          title: "بارگۆڕانی ئابووری (خولگەکانی بازرگانی)",
          page: "٢٣ - ٤١",
          chapterNumber: 1,
          summary: "بارگۆڕانی ئابووری (Economic Fluctuations) بریتین لەو شەپۆلە گۆڕانکارییانەی بەسەر چالاکییە ئابوورییەکاندا دێن؛ ٤ قۆناغی سەرەکی خولگەکە: بووژانەوە (Recovery)، هەڵکشان یان گەشەکردن (Boom/Peak)، سستبوون یان پاشەکشە (Recession)، و داڕمان (Depression/Trough).",
          keyFormulasAndRules: [
            "خولگەی بازرگانی = ماوەی نێوان دوو لووتکە یان دوو قەعر لە چالاکیی ئابووریدا",
            "پێوەری هەڵاوسان (Inflation) بەرامبەر بێکاری لە قۆناغە جیاوازەکاندا",
            "تیۆرییەکانی هۆکاری سەرهەڵدانی خولگەی ئابووری (ناوخۆیی و دەرەکی)"
          ],
          keyTermsAndConcepts: [
            "بارگۆڕانی ئابووری (Economic Fluctuation)",
            "خولگەی بازرگانی (Business Cycle)",
            "هەڵکشانی ئابووری (Boom)",
            "داڕمانی ئابووری (Depression)",
            "سستی ئابووری (Recession)"
          ],
          ministerialPoints: [
            "تایبەتمەندییەکانی قۆناغی بووژانەوە بە بەراورد لەگەڵ قۆناغی سستبوون",
            "لێکەوتەکانی داڕمانی گەورەی ئابووری جیهانی (١٩٢٩) لەسەر هزری ئابووری نوێ"
          ]
        }
      ]
    },
    {
      chapterIndex: 2,
      title: "بەشی دووەم: بازرگانی (Trade)",
      subtitle: "بازرگانی ناوخۆیی، بازرگانی دەرەکی، سوودی ڕەها، سوودی بەراوردکاری، تەرازووی پارەدان",
      pages: "٤٢ - ٨٣",
      iconColor: "text-blue-400 bg-blue-950/60 border-blue-700/50",
      description: "پێناسەی بازرگانی وەک ئاڵوگۆڕی شەمەک و خزمەتگوزارییەکان؛ جیاوازییەکانی نێوان بازرگانی ناوخۆیی و بازرگانی نێودەوڵەتی؛ تیۆرییە کلاسیکییەکانی بازرگانی دەرەکی (ئادەم سمیس و دەیڤید ڕیکاردۆ)، ڕێگرە گومرگییەکان و پارێزگاری لە بەرهەمی ناوخۆ، و پێکهاتەی تەرازووی پارەدان (Balance of Payments).",
      lessons: [
        {
          id: "econ-2-1",
          title: "چەمکی بازرگانی و جیاوازی نێوان بازرگانی ناوخۆیی و دەرەکی",
          page: "٤٢ - ٥٢",
          chapterNumber: 2,
          summary: "بازرگانی بریتییە لە کڕین و فرۆشتنی شەمەک و کارگوزاری؛ جیاوازییە سەرەکییەکان: جیاوازی دراو و دراوی قورس، سنوورە سیاسی و گومرگییەکان، جووڵەی بنەماکانی بەرهەمهێنان (کار و سەرمایە لە ناوخۆدا ئاسانتر دەجووڵێن)، و جیاوازی یاسا و ڕێساکان.",
          keyFormulasAndRules: [
            "بازرگانی ناوخۆیی: لە سنووری یەک دەوڵەت و بە یەک دراوی نیشتمانی ئەنجام دەدرێت",
            "بازرگانی دەرەکی: لە نێوان دەوڵەتە جیاوازەکان و بە دراوی بیانی (دراوی سەخت) دەبێت",
            "هۆکاری سەرهەڵدان: نایەکسانی دابەشبوونی سەرچاوە سروشتییەکان و پسپۆڕی کار"
          ],
          keyTermsAndConcepts: [
            "بازرگانی ناوخۆیی (Domestic Trade)",
            "بازرگانی دەرەکی (International Trade)",
            "دراوی سەخت (Hard Currency)",
            "تەرازووی بازرگانی (Balance of Trade)"
          ],
          ministerialPoints: [
            "٤ خاڵی سەرەکی جیاوازی نێوان بازرگانی ناوخۆیی و دەرەکی",
            "ڕۆڵی تەکنەلۆژیا و گواستنەوە لە فراوانبوونی قەبارەی بازرگانی جیهانیدا"
          ]
        },
        {
          id: "econ-2-2",
          title: "تیۆرییەکانی بازرگانی نێودەوڵەتی (سوودی ڕەها و بەراوردکاری)",
          page: "٥٣ - ٦٨",
          chapterNumber: 2,
          summary: "شیکردنەوەی تیۆری سوودی ڕەها (Absolute Advantage) لەلایەن ئادەم سمیس (Adam Smith ١٧٧٦): هەر وڵاتێک پێویستە پسپۆڕ بێت لە بەرهەمهێنانی ئەو کاڵایەی تێچووی کەمترە؛ و تیۆری سوودی بەراوردکاری (Comparative Advantage) لەلایەن دەیڤید ڕیکاردۆ (David Ricardo ١٨١٧): تەنانەت ئەگەر وڵاتێک لە هەموو کاڵایەکدا باڵادەست بێت، دەکرێت سوود لە بازرگانی وەربگرێت بە پسپۆڕبوون لەو کاڵایەی کەمترین تێچووی دەرفەتی هەیە.",
          keyFormulasAndRules: [
            "سوودی ڕەها (Adam Smith): بەرهەمهێنانی شەمەکێک بە کەمترین کاتژمێری کار بەراورد بە دەوڵەتانی تر",
            "سوودی بەراوردکاری (David Ricardo): پێوانەکردنی تێچووی دەرفەت (Opportunity Cost) لە نێوان دوو کاڵادا",
            "بنەمای پسپۆڕیی نێودەوڵەتی و دابەشبوونی کاری جیهانی"
          ],
          keyTermsAndConcepts: [
            "سوودی ڕەها (Absolute Advantage)",
            "سوودی بەراوردکاری (Comparative Advantage)",
            "تێچووی دەرفەت (Opportunity Cost)",
            "پسپۆڕی کار (Division of Labor)"
          ],
          ministerialPoints: [
            "بەراوردکردنی تێڕوانینی ئادەم سمیس و دەیڤید ڕیکاردۆ لە پرسیارەکانی وزاری",
            "شیکردنەوەی خشتەی نموونەیی بەرهەمهێنانی دوو کاڵا لە دوو وڵاتدا"
          ]
        },
        {
          id: "econ-2-3",
          title: "تەرازووی بازرگانی و تەرازووی پارەدان (Balance of Payments)",
          page: "٦٩ - ٨٣",
          chapterNumber: 2,
          summary: "تەرازووی بازرگانی بەراوردی نێوان بەهای هەناردە و هاوردەی کاڵا دەبینێت؛ تەرازووی پارەدان تۆمارێکی تەواوی هەموو مامەڵە ئابووری و داراییەکانی وڵاتێکە لەگەڵ جیهانی دەرەوە؛ بەشەکانی: هەژماری جاری (Current Account)، هەژماری سەرمایە (Capital Account)، و پارێزراوە نێودەوڵەتییەکان.",
          keyFormulasAndRules: [
            "تەرازووی بازرگانی = بەهای هەناردەکراو (X) - بەهای هاوردەکراو (M)",
            "زیادە لە تەرازووی بازرگانی: هەناردە گەورەتر بێت لە هاوردە (X > M)",
            "کورتهێنان لە تەرازووی بازرگانی: هاوردە گەورەتر بێت لە هەناردە (M > X)",
            "هاوسەنگی تەرازووی پارەدان: دەبێت کۆی لایەنی قەرزدار و لایەنی خاوەن قەرز یەکسان بێت"
          ],
          keyTermsAndConcepts: [
            "تەرازووی پارەدان (Balance of Payments)",
            "هەژماری جاری (Current Account)",
            "سیاسەتی پارێزگاری گومرگی (Protectionism)",
            "پشکی هاوردە (Import Quota)"
          ],
          ministerialPoints: [
            "جیاوازی نێوان تەرازووی بازرگانی و تەرازووی پارەدان",
            "ڕێگاکانی چارەسەرکردنی کورتهێنان لە تەرازووی پارەدان (بەرزکردنەوەی هەناردە، گومرگ، دابەزاندنی بەهای دراو)"
          ]
        }
      ]
    },
    {
      chapterIndex: 3,
      title: "بەشی سێیەم: ڕامیارییە ئابوورییەکان (Economic Policies)",
      subtitle: "ئامانجەکانی ڕامیاری ئابووری، پەرەپێدان، بێکاری و هەڵاوسان، ڕامیاری دارایی و نەختینەیی",
      pages: "٨٤ - ٩٣",
      iconColor: "text-purple-400 bg-purple-950/60 border-purple-700/50",
      description: "ڕامیاری ئابووری (Economic Policy) کۆمەڵێک کار و ڕێوشوێنە کە دەوڵەت جێبەجێیان دەکات بۆ کاریگەری لەسەر ئاراستەی چالاکی ئابووری؛ ئامانجە سەرەکییەکان: گەیشتن بە گەشەی ئابووری بەردەوام، دابینکردنی هەلی کار و لەناوبردنی بێکاری، جێگیرکردنی ئاستی گشتی نرخەکان، و دادپەروەری لە دابەشکردنی داهاتدا.",
      lessons: [
        {
          id: "econ-3-1",
          title: "چەمک و ئامانجە سەرەکییەکانی ڕامیاری ئابووری",
          page: "٨٤ - ٨٨",
          chapterNumber: 3,
          summary: "پێناسەی ڕامیاری ئابووری و چوار ئامانجە بنەڕەتییەکەی دەوڵەت: ١. بەدیهێنانی گەشە و پەرەپێدانی ئابووری؛ ٢. بەدیهێنانی دامەزراندنی تەواو (Full Employment) و نەهێشتنی بێکاری؛ ٣. جێگیری نرخەکان و ڕێگریکردن لە هەڵاوسان؛ ٤. هاوسەنگی لە تەرازووی پارەداندا.",
          keyFormulasAndRules: [
            "دامەزراندنی تەواو: نەبوونی بێکاریی ناچاری لە کۆمەڵگەدا",
            "جێگیری نرخەکان: پاراستنی هێزی کڕینی دراوی نیشتمانی",
            "هاودژبوونی ئامانجەکان (Trade-off): کێشەی نێوان کەمکردنەوەی بێکاری و زیادبوونی هەڵاوسان (چەماوەی فیلیپس)"
          ],
          keyTermsAndConcepts: [
            "ڕامیاری ئابووری (Economic Policy)",
            "دامەزراندنی تەواو (Full Employment)",
            "جێگیری نرخەکان (Price Stability)",
            "چەماوەی فیلیپس (Phillips Curve)"
          ],
          ministerialPoints: [
            "چوار ئامانجە سەرەکییەکەی ڕامیاری ئابووری بە وردی",
            "چۆنیەتی کاریگەری جێگیری نرخەکان لەسەر بارودۆخی کەمدەرامەتان"
          ]
        },
        {
          id: "econ-3-2",
          title: "ئامرازەکانی ڕامیاری ئابووری: ڕامیاری دارایی بەرامبەر ڕامیاری نەختینەیی",
          page: "٨٩ - ٩٣",
          chapterNumber: 3,
          summary: "جیاکردنەوەی دوو باڵی سەرەکی دەستێوەردانی دەوڵەت: ڕامیاری دارایی (Fiscal Policy) کە لەلایەن وەزارەتی داراییەوە بەڕێوەدەچێت بە بەکارهێنانی باج و خەرجی؛ و ڕامیاری نەختینەیی (Monetary Policy) کە لەلایەن بانکی ناوەندییەوە بەڕێوەدەچێت بە بەکارهێنانی خستنەڕووی پارە، ڕێژەی سوود، و یەدەگی یاسایی.",
          keyFormulasAndRules: [
            "ڕامیاری دارایی فراوانکەر (Expansionary Fiscal Policy): کەمکردنەوەی باج + زیادکردنی خەرجی بۆ دەرچوون لە سستی",
            "ڕامیاری دارایی گرژکەر (Contractionary Fiscal Policy): زیادکردنی باج + کەمکردنەوەی خەرجی بۆ دابەزاندنی هەڵاوسان",
            "ئامرازەکانی بانکی ناوەندی: ڕێژەی سوودی بانکی (Interest Rate)، بازاڕی کراوە (Open Market Operations)، و ڕێژەی یەدەگی ناچاری"
          ],
          keyTermsAndConcepts: [
            "ڕامیاری دارایی (Fiscal Policy)",
            "ڕامیاری نەختینەیی (Monetary Policy)",
            "بانکی ناوەندی (Central Bank)",
            "خستنەڕووی پارە (Money Supply)"
          ],
          ministerialPoints: [
            "خشتەی بەراوردی نێوان ئامرازەکانی ڕامیاری دارایی و ڕامیاری نەختینەیی",
            "ڕێکارە ئابوورییە پێویستەکان لە کاتی ڕوودانی هەڵاوسانی بەرزدا"
          ]
        }
      ]
    },
    {
      chapterIndex: 4,
      title: "بەشی چوارەم: دواکەوتن و پەرەپێدانی ئابووری و پلاندانان",
      subtitle: "Underdevelopment, Development & Planning - خەسڵەتەکانی دواکەوتن، بازنەی بەتاڵی هەژاری، پلاندانان",
      pages: "٩٤ - ١٢٥",
      iconColor: "text-amber-400 bg-amber-950/60 border-amber-700/50",
      description: "هزری ئابووری هاوچەرخ پێناسەی جیاوازی بۆ دواکەوتوویی ئابووری کردووە (وەک میشێل تۆدارۆ و ڕاگنار نێرکس)؛ خەسڵەتە دیارەکانی وڵاتانی دواکەوتوو: نزمی داهاتی تاکی ساڵانە، کەمی کۆکردنەوەی سەرمایە، دووفاقی ئابووری (کەرتی نەریتی بەرامبەر هاوچەرخ)، پشت بەستن بە یەک سەرچاوەی خاو، و گرنگی پلاندانانی ئابووری لە زاڵبوون بەسەر دواکەوتندا.",
      lessons: [
        {
          id: "econ-4-1",
          title: "چەمکی دواکەوتوویی ئابووری و خەسڵەتەکانی",
          page: "٩٤ - ١٠٥",
          chapterNumber: 4,
          summary: "پێناسەی دواکەوتوویی بەپێی تۆدارۆ (M. P. Todaro): نزمبوونەوەی ئاستی ژیان هاوشان لەگەڵ هەژاری، نزمی سەرمایەی مرۆیی، خزمەتگوزاری تەندروستی لاواز، و کەمی بژاردەکانی ژیان؛ تایبەتمەندییە ئابووری و کۆمەڵایەتی و دیمۆگرافییەکانی وڵاتانی گەشەسەندوو بەرامبەر دواکەوتوو.",
          keyFormulasAndRules: [
            "داهاتی تاکی ڕاستەقینە = داهاتی نەتەوەیی دابەش بەسەر ژمارەی دانیشتووان",
            "بازنەی بەتاڵی هەژاری (Vicious Circle of Poverty): داهاتی کەم ← پاشەکەوتی کەم ← وەبەرهێنانی کەم ← بەرهەمداریی کەم ← داهاتی کەم",
            "دووفاقی ئابووری (Dualism): بوونی کەرتی نەریتی و سەرەتایی لە تەنیشت کەرتی مۆدێرن بەبێ کاریگەری ئەرێنی"
          ],
          keyTermsAndConcepts: [
            "دواکەوتوویی ئابووری (Underdevelopment)",
            "بازنەی بەتاڵی هەژاری (Vicious Circle)",
            "دووفاقی ئابووری (Economic Dualism)",
            "تەقینەوەی دانیشتووان (Population Explosion)"
          ],
          ministerialPoints: [
            "شیکردنەوەی تیۆری بازنەی بەتاڵی هەژاری ڕاگنار نێرکس",
            "خەسڵەتە ئابووری و کشتوکاڵییەکانی وڵاتانی دواکەوتوو"
          ]
        },
        {
          id: "econ-4-2",
          title: "پەرەپێدانی ئابووری و سەرچاوەکانی",
          page: "١٠٦ - ١١٥",
          chapterNumber: 4,
          summary: "جیاوازی نێوان گەشەی ئابووری (Economic Growth) کە بریتییە لە زیادبوونی ژمارەیی بەرهەم، و پەرەپێدانی ئابووری (Economic Development) کە گۆڕانکاری بنەڕەتی لە پێکهاتەی ئابووری و کۆمەڵایەتی دەگرێتەوە؛ پێداویستییەکانی پەرەپێدان: کەڵەکەبوونی سەرمایە، پێشکەوتنی تەکنەلۆژیا، بەرزکردنەوەی توانا و لێهاتوویی مرۆیی.",
          keyFormulasAndRules: [
            "گەشەی ئابووری: گۆڕانی چەندایەتی (زیادبوونی ڕێژەی GDP)",
            "پەرەپێدانی ئابووری: گۆڕانی چەندایەتی + چۆنایەتی لە پێکهاتەی ئابووری و دادپەروەری دابەشکردن",
            "سەرمایەی مرۆیی (Human Capital): خوێندن، تەندروستی، و ڕاهێنانی پیشەیی هێزی کار"
          ],
          keyTermsAndConcepts: [
            "گەشەی ئابووری (Economic Growth)",
            "پەرەپێدانی ئابووری (Economic Development)",
            "سەرمایەی مرۆیی (Human Capital)",
            "تەکنەلۆژیای گونجاو (Appropriate Technology)"
          ],
          ministerialPoints: [
            "جیاوازی وردی نێوان چەمکی گەشەی ئابووری و پەرەپێدانی ئابووری",
            "ڕۆڵی فێرکردن و تەندروستی لە بەرزکردنەوەی توانای بەرهەمهێناندا"
          ]
        },
        {
          id: "econ-4-3",
          title: "پلاندانانی ئابووری و جۆرەکانی پلانی گەشەپێدان",
          page: "١١٦ - ١٢٥",
          chapterNumber: 4,
          summary: "پلاندانانی ئابووری بریتییە لە کۆنترۆڵکردنی سەرچاوە ماددی و مرۆییەکان و ئاراستەکردنیان بەرەو بەدیهێنانی ئامانجە دیاریکراوەکان لە ماوەیەکی زەمەنی دیاریکراودا؛ جۆرەکانی پلان بەپێی ماوە: کورتخایەن (١ ساڵ)، مامناوەندخایەن (٣-٥ ساڵ)، درێژخایەن (١٠-٢٠ ساڵ)؛ و پلانی گشتگیر بەرامبەر کەرتی.",
          keyFormulasAndRules: [
            "قۆناغەکانی داڕشتنی پلان: کۆکردنەوەی زانیاری ← دیاریکردنی ئامانج ← کێشانی پلان ← جێبەجێکردن ← چاودێری و هەڵسەنگاندن",
            "پلانی دیموکراتی (هاندەرانە) بەرامبەر پلانی بەزۆرەملێ (ئیداری)"
          ],
          keyTermsAndConcepts: [
            "پلاندانانی ئابووری (Economic Planning)",
            "پلانی مامناوەندخایەن (Medium-term Plan)",
            "دەزگای پلاندانان (Planning Board)",
            "چاودێری و بەدواداچوون (Monitoring & Evaluation)"
          ],
          ministerialPoints: [
            "قۆناغەکانی ئامادەکردن و جێبەجێکردنی پلانی ئابووری لە تاقیکردنەوەی وزاری",
            "هۆکارەکانی شکستی هەندێک لە پلانە ئابوورییەکان لە وڵاتانی تازەپێگەیشتوودا"
          ]
        }
      ]
    },
    {
      chapterIndex: 5,
      title: "بەشی پێنجەم: دارایی گشتی (Public Finance)",
      subtitle: "خەرجییە گشتییەکان، داهاتە گشتییەکان، باج و ڕسومات، باجی ڕاستەوخۆ و ناڕاستەوخۆ، بودجەی گشتی",
      pages: "١٢٦ - ١٧٨",
      iconColor: "text-rose-400 bg-rose-950/60 border-rose-700/50",
      description: "زانستی دارایی گشتی لێکۆڵینەوە لە چالاکییەکانی حکوومەت دەکات لە دابینکردنی پارە بۆ خەرجییە هەمەجۆرەکان و دابینکردنی پێداویستییە گشتییەکان (Public Wants)؛ لێکۆڵینەوە لە خەرجییە گشتییەکان، داهاتەکان (داهاتی موڵکەکانی دەوڵەت، باج، ڕسوومات، قەرز)، و پرەنسیپەکانی بودجەی گشتی دەوڵەت (ساڵانەیی، گشتگیری، یەکێتی، هاوسەنگی).",
      lessons: [
        {
          id: "econ-5-1",
          title: "پێناسەی دارایی گشتی و پێداویستییە گشتی و تایبەتییەکان",
          page: "١٢٦ - ١٣٥",
          chapterNumber: 5,
          summary: "دارایی گشتی زانستی تاوتوێکردنی گۆڕانکارییەکانە سەبارەت بە باجەکان و سیاسەتی بودجەی دەوڵەت؛ جیاوازی پێداویستی گشتی (Public Wants) کە دەوڵەت دابینی دەکات (وەک ئاسایش، دادپەروەری، بەرگری، تەندروستی گشتی) لە پێداویستی تایبەتی (Private Wants)؛ و بنەمای دەرنەکردن و نەبوونی کێبڕکێ لە کاڵا گشتییەکاندا.",
          keyFormulasAndRules: [
            "کاڵای گشتی (Public Good): بێ کێبڕکێ لە بەکاربردن (Non-rivalry) + بێ بەربەست لە دەستپێڕاگەیشتن (Non-excludability)",
            "شکستی بازاڕ (Market Failure): ناتوانایی کەرتی تایبەت لە دابینکردنی پێداویستییە گشتییە بنەڕەتییەکان",
            "ئەرکەکانی دارایی گشتی: تەرخانکردن (Allocation)، دابەشکردنەوەی داهات (Distribution)، و جێگیرکردنی ئابووری (Stabilization)"
          ],
          keyTermsAndConcepts: [
            "دارایی گشتی (Public Finance)",
            "پێداویستییە گشتییەکان (Public Wants)",
            "کاڵای گشتی (Public Goods)",
            "شکستی بازاڕ (Market Failure)"
          ],
          ministerialPoints: [
            "پێناسەی زانستی دارایی گشتی و جیاوازی کاڵای گشتی و کاڵای تایبەتی",
            "سێ ئەرکە سەرەکییەکەی دارایی گشتی لە دەوڵەتی مۆدێرندا"
          ]
        },
        {
          id: "econ-5-2",
          title: "خەرجییە گشتییەکان و داهاتە گشتییەکانی دەوڵەت",
          page: "١٣٦ - ١٥٥",
          chapterNumber: 5,
          summary: "خەرجی گشتی بریتییە لەو بڕە پارەیەی کەسێکی مەعنەوی گشتی (حکوومەت) خەرجی دەکات بۆ بەدیهێنانی سوودی گشتی؛ پۆلێنکردنی خەرجییەکان (خەرجی ئاسایی و بەکاربەر بەرامبەر خەرجی وەبەرهێنان و سەرمایەیی)؛ و داهاتە گشتییەکان: داهاتی موڵکەکانی دەوڵەت (دۆمین - The Domain)، ڕسوومات (Fees)، باجەکان، و قەرزی گشتی (Public Borrowing).",
          keyFormulasAndRules: [
            "مەرجەکانی خەرجی گشتی: ١. بڕە پارەیەک بێت، ٢. لەلایەن دەستەیەکی گشتییەوە بێت، ٣. بە مەبەستی بەرژەوەندی گشتی بێت",
            "دۆمینی دەوڵەت: دۆمینی دارایی (پشکی کۆمپانیاکان)، پیشەسازی و بازرگانی، و دۆمینی عەقاری",
            "ڕسووم (Fees): بەرامبەر وەرگرتنی خزمەتگوزارییەکی دیاریکراوە (وەک ڕسوومی دادگا یان دەرهێنانی پاسپۆرت)"
          ],
          keyTermsAndConcepts: [
            "خەرجییە گشتییەکان (Public Expenditure)",
            "داهاتە گشتییەکان (Public Revenues)",
            "دۆمینی دەوڵەت (The Domain)",
            "ڕسوومات (Duties / Fees)",
            "قەرزی گشتی (Public Debt)"
          ],
          ministerialPoints: [
            "جیاوازی بنەڕەتی نێوان باج و ڕسووم (باج بەبێ بەرامبەری ڕاستەوخۆیە بەڵام ڕسووم بەرامبەر خزمەتە)",
            "هۆکارەکانی زیادبوونی خەرجییە گشتییەکان لە دەوڵەتە هاوچەرخەکاندا"
          ]
        },
        {
          id: "econ-5-3",
          title: "باج (Taxes) و بودجەی گشتی دەوڵەت (Public Budget)",
          page: "١٥٦ - ١٧٨",
          chapterNumber: 5,
          summary: "باج بڕە پارەیەکی ناچارییە کە دەوڵەت لەسەر هاووڵاتیان و کۆمپانیاکانی دەسەپێنێت بەبێ بەدەستهێنانی قازانجی ڕاستەوخۆ؛ جۆرەکانی باج: باجی ڕاستەوخۆ (لەسەر سەروەت و داهات) و باجی ناڕاستەوخۆ (لەسەر کڕین و فرۆشتن و گومرگ)؛ بنەماکانی باج لەلایەن ئادەم سمیس؛ و بودجەی گشتی دەوڵەت و پرەنسیپەکانی ساڵانەیی، گشتگیری، و یەکێتی.",
          keyFormulasAndRules: [
            "باجی ڕاستەوخۆ (Direct Tax): قورسایی باجەکە ڕاستەوخۆ لەسەر باجدەرە و ناتوانرێت بگوازرێتەوە (وەک باجی داهات)",
            "باجی ناڕاستەوخۆ (Indirect Tax): باجدەر دەتوانێت قورساییەکەی بگوازێتەوە بۆ بەکارهێنەری کۆتایی (وەک باجی فرۆشتن)",
            "چوار بنەماکەی باج (ئادەم سمیس): دادپەروەری، دڵنیایی، گونجاوی، و کەمی تێچووی کۆکردنەوە",
            "بودجەی گشتی: خەمڵاندنی پێشوەختەی داهات و خەرجی دەوڵەت بۆ ماوەی یەک ساڵ"
          ],
          keyTermsAndConcepts: [
            "باجی ڕاستەوخۆ (Direct Taxes)",
            "باجی ناڕاستەوخۆ (Indirect Taxes)",
            "خۆلادان لە باج (Tax Avoidance)",
            "ڕاکردن لە باج (Tax Evasion)",
            "بودجەی گشتی (Public Budget)",
            "کورتهێنانی بودجە (Budget Deficit)"
          ],
          ministerialPoints: [
            "جیاوازی نێوان خۆلادان لە باج (بەپێی یاسا) و ڕاکردن لە باج (نایاسایی)",
            "پرەنسیپەکانی بودجەی گشتی دەوڵەت و جیاوازی کورتهێنان و زیادەی بودجە"
          ]
        }
      ]
    },
    {
      chapterIndex: 6,
      title: "بەشی شەشەم: ڕێکخراوە ئابوورییە نێودەوڵەتییەکان",
      subtitle: "International Economic Organizations - IMF, World Bank, WTO, OPEC",
      pages: "١٧٩ - ٢٠٩",
      iconColor: "text-cyan-400 bg-cyan-950/60 border-cyan-700/50",
      description: "ڕێکخراوە ئابوورییە نێودەوڵەتییەکان چوارچێوەیەکن بۆ هاوکاری ئابووری نێوان دەوڵەتان بۆ چارەسەرکردنی گرفتە دارایی و بازرگانییەکان؛ لێکۆڵینەوە لە کۆنفڕانسی بریتۆن وودز (١٩٤٤)، سندوقی نەختی نێودەوڵەتی (IMF)، بانکی نێودەوڵەتی بۆ ئاوەدانکردنەوە و گەشەپێدان (World Bank)، ڕێکخراوی بازرگانی جیهانی (WTO)، و ڕێکخراوی وڵاتانی هەناردەکاری نەوت (ئۆپیک - OPEC).",
      lessons: [
        {
          id: "econ-6-1",
          title: "سندوقی نەختی نێودەوڵەتی (IMF) و بانکی نێودەوڵەتی (World Bank)",
          page: "١٧٩ - ١٩٢",
          chapterNumber: 6,
          summary: "سەرهەڵدانی سیستەمی دارایی نوێ لە کۆنفڕانسی بریتۆن وودز (١٩٤٤)؛ ئامانجەکانی سندوقی نەختی نێودەوڵەتی (IMF): سەقامگیری نرخی ئاڵوگۆڕی دراوەکان، یارمەتیدانی وڵاتان لە کورتهێنانی تەرازووی پارەدان بە پێدانی قەرز؛ و بانکی جیهانی (IBRD): دابینکردنی قەرزی درێژخایەن بۆ پڕۆژەکانی ژێرخان و ئاوەدانکردنەوە و کەمکردنەوەی هەژاری.",
          keyFormulasAndRules: [
            "ڕێککەوتننامەی بریتۆن وودز (Bretton Woods ١٩٤٤): بەستنەوەی دراوەکان بە دۆلار و زێڕەوە",
            "ئەرکی IMF: چارەسەری نەختینەیی کورتخایەن و تەرازووی پارەدان",
            "ئەرکی World Bank: پەرەپێدانی درێژخایەن، ژێرخان (ڕێگاوبان، بەنداو، قوتابخانە)"
          ],
          keyTermsAndConcepts: [
            "سندوقی نەختی نێودەوڵەتی (IMF)",
            "بانکی نێودەوڵەتی (World Bank / IBRD)",
            "مافی ڕاکێشانی تایبەت (SDRs)",
            "مەرجەکانی چاکسازی دارایی"
          ],
          ministerialPoints: [
            "جیاوازی ئەرک و ئامانجی نێوان سندوقی نەخت (IMF) و بانکی جیهانی (World Bank)",
            "ڕۆڵی قەرزەکانی IMF لە سیاسەتی ئابووری وڵاتانی قەرزداردا"
          ]
        },
        {
          id: "econ-6-2",
          title: "ڕێکخراوی بازرگانی جیهانی (WTO) و ئۆپیک (OPEC)",
          page: "١٩٣ - ٢٠٩",
          chapterNumber: 6,
          summary: "سەرهەڵدانی ڕێککەوتننامەی گشتی گومرگ و بازرگانی (GATT) و گۆڕانی بۆ ڕێکخراوی بازرگانی جیهانی (WTO ١٩٩٥) بە ئامانجی ئازادکردنی بازرگانی جیهانی؛ و دامەزراندنی ڕێکخراوی وڵاتانی هەناردەکاری نەوت (ئۆپیک OPEC ١٩٦٠ لە بەغدا) بۆ ڕێکخستنی بەرهەمهێنان و پاراستنی هاوسەنگی نرخی نەوتی خاو لە بازاڕەکانی جیهاندا.",
          keyFormulasAndRules: [
            "بنەماکانی WTO: دەوڵەتی هەرە لەپێشینە (Most Favoured Nation)، نەهێشتنی بەربەستی گومرگی، قەدەغەکردنی ساغکردنەوەی بەزۆر (Dumping)",
            "ئامانجەکانی ئۆپیک (OPEC): دیاریکردنی پشکی بەرهەمهێنان (Quotas)، پاراستنی نرخی دادپەروەرانەی نەوت بۆ وڵاتانی بەرهەمهێنەر و بەکاربەر"
          ],
          keyTermsAndConcepts: [
            "ڕێکخراوی بازرگانی جیهانی (WTO)",
            "ڕێککەوتننامەی گات (GATT)",
            "ڕێکخراوی ئۆپیک (OPEC)",
            "پشکی بەرهەمهێنان (Production Quota)"
          ],
          ministerialPoints: [
            "بەرواری دامەزراندنی ئۆپیک (١٩٦٠ بەغدا) و وڵاتانی دامەزرێنەر (عێراق، سعودیە، ئێران، کوێت، ڤەنزوێلا)",
            "بنەمای دەوڵەتی هەرە لەپێشینە (MFN) لە ڕێکخراوی بازرگانی جیهانیدا"
          ]
        }
      ]
    }
  ];

  const GLOSSARY_TERMS = [
    { ku: "داهاتی نەتەوەیی", ar: "الدخل القومي", en: "National Income" },
    { ku: "داهاتی کەسی", ar: "الدخل الشخصي", en: "Personal Income" },
    { ku: "داهاتی بەردەست (ئامادە بۆ خەرج)", ar: "الدخل القابل للتصرف", en: "Disposable Income" },
    { ku: "بەرهەمی نەتەوەیی خاو", ar: "الناتج القومي الإجمالي", en: "Gross National Product (GNP)" },
    { ku: "بەرهەمی ناوخۆیی خاو", ar: "الناتج المحلي الإجمالي", en: "Gross Domestic Product (GDP)" },
    { ku: "بارگۆڕانی ئابووری", ar: "التقلبات الاقتصادية", en: "Economic Fluctuations" },
    { ku: "خولگەی بازرگانی", ar: "الدورة التجارية", en: "Business Cycle" },
    { ku: "سوودی ڕەها", ar: "الميزة المطلقة", en: "Absolute Advantage" },
    { ku: "سوودی بەراوردکاری", ar: "الميزة النسبية", en: "Comparative Advantage" },
    { ku: "تەرازووی بازرگانی", ar: "الميزان التجاري", en: "Balance of Trade" },
    { ku: "تەرازووی پارەدان", ar: "ميزان المدفوعات", en: "Balance of Payments" },
    { ku: "ڕامیاری دارایی", ar: "السياسة المالية", en: "Fiscal Policy" },
    { ku: "ڕامیاری نەختینەیی", ar: "السياسة النقدية", en: "Monetary Policy" },
    { ku: "دواکەوتوویی ئابووری", ar: "التخلف الاقتصادي", en: "Underdevelopment" },
    { ku: "پەرەپێدانی ئابووری", ar: "التنمية الاقتصادية", en: "Economic Development" },
    { ku: "دارایی گشتی", ar: "المالية العامة", en: "Public Finance" },
    { ku: "خەرجییە گشتییەکان", ar: "النفقات العامة", en: "Public Expenditure" },
    { ku: "داهاتە گشتییەکان", ar: "الإيرادات العامة", en: "Public Revenues" },
    { ku: "باج و باجەکان", ar: "الضرائب", en: "Taxation / Taxes" },
    { ku: "ڕسووم و ڕسوومات", ar: "الرسوم", en: "Duties / Fees" },
    { ku: "بودجەی گشتی", ar: "الموازنة العامة", en: "Public Budget" },
    { ku: "سندوقی نەختی نێودەوڵەتی", ar: "صندوق النقد الدولي", en: "International Monetary Fund (IMF)" },
    { ku: "بانکی نێودەوڵەتی", ar: "البنك الدولي", en: "World Bank (IBRD)" },
    { ku: "ڕێکخراوی بازرگانی جیهانی", ar: "منظمة التجارة العالمية", en: "World Trade Organization (WTO)" },
    { ku: "ڕێکخراوی ئۆپیک", ar: "منظمة أوبك", en: "OPEC" }
  ];

  const currentChapter =
    CHAPTERS_METADATA.find((c) => c.chapterIndex === activeChapterIndex) ||
    CHAPTERS_METADATA[0];

  const filteredLessons = currentChapter.lessons.filter(
    (l) =>
      searchQuery.trim() === "" ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.keyTermsAndConcepts &&
        l.keyTermsAndConcepts.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase())
        )) ||
      (l.keyFormulasAndRules &&
        l.keyFormulasAndRules.some((f) =>
          f.toLowerCase().includes(searchQuery.toLowerCase())
        ))
  );

  return (
    <div className="w-full bg-[#081a2b] text-slate-100 rounded-3xl border border-cyan-900/60 p-4 sm:p-6 lg:p-8 space-y-6 shadow-2xl">
      {/* Header with Title and Book Metadata */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-950 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>مەنهەجی فەرمی پۆلی ١٢ی وێژەیی</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
              ٢١٢ لاپەڕە • ٦ بەشی سەرەکی
            </span>
          </div>

          <h2 className="font-sans font-black text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2.5">
            <span>ئابووری (پۆلی ١٢ی وێژەیی)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            مەنهەجی فەرمی وەزارەتی پەروەردە: داهاتی نەتەوەیی، بازرگانی نێودەوڵەتی، ڕامیارییە ئابوورییەکان، دواکەوتن و گەشەپێدان، دارایی گشتی، و ڕێکخراوە جیهانییەکان (IMF، بانکی جیهانی، WTO، OPEC).
          </p>
        </div>

        {/* Quick Launch CTA */}
        <div className="flex items-center gap-2.5">
          {onNavigateToChat && (
            <button
              type="button"
              onClick={onNavigateToChat}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>گفتوگۆ لەسەر ئابووری لەگەڵ مامۆستا زانا</span>
            </button>
          )}
        </div>
      </div>

      {/* Chapter Navigation Tabs (6 Chapters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
        {CHAPTERS_METADATA.map((ch) => {
          const isActive = ch.chapterIndex === activeChapterIndex;
          return (
            <button
              key={ch.chapterIndex}
              type="button"
              onClick={() => {
                setActiveChapterIndex(ch.chapterIndex);
                setSearchQuery("");
                setExpandedLessonId(ch.lessons[0]?.id || null);
              }}
              className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between min-h-[90px] cursor-pointer ${
                isActive
                  ? "bg-emerald-950/80 border-emerald-500/80 shadow-lg shadow-emerald-900/30 ring-1 ring-emerald-500"
                  : "bg-[#0b243b]/80 border-cyan-950/90 hover:bg-[#10304e] hover:border-cyan-800/60"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    isActive
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  بەشی {ch.chapterIndex}
                </span>
                <span className="text-[10px] font-mono text-cyan-400/90">
                  {ch.pages}
                </span>
              </div>
              <p
                className={`font-sans font-bold text-xs mt-2 line-clamp-2 ${
                  isActive ? "text-emerald-200" : "text-slate-200"
                }`}
              >
                {ch.title.replace(/^بەشی [^:]+:\s*/, "")}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Chapter Overview Card */}
      <div className="bg-[#0b243b] border border-cyan-900/50 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400">
                پەڕتووکی خوێندن • لاپەڕە {currentChapter.pages}
              </span>
            </div>
            <h3 className="font-sans font-black text-xl text-white">
              {currentChapter.title}
            </h3>
            <p className="text-xs font-mono text-cyan-300">
              {currentChapter.subtitle}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان لە بابەتەکان و هاوکێشەکان..."
              className="w-full bg-[#071927] border border-cyan-950 focus:border-emerald-500 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-cyan-950/80 pt-3">
          {currentChapter.description}
        </p>
      </div>

      {/* Lessons Accordion List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-sans font-bold text-sm text-cyan-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>بابەتە وردکراوەکان و پێڕستی خوێندن:</span>
          </h4>
          <span className="text-[11px] text-slate-400">
            {filteredLessons.length} کەرتی خوێندن لەم بەشەدا
          </span>
        </div>

        <div className="space-y-3">
          {filteredLessons.map((lesson) => {
            const isExpanded = expandedLessonId === lesson.id;
            return (
              <div
                key={lesson.id}
                className="bg-[#0b243b] border border-cyan-950 hover:border-cyan-800/80 rounded-2xl overflow-hidden transition-all shadow-sm"
              >
                {/* Header Row */}
                <button
                  type="button"
                  onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-right cursor-pointer hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0">
                      {lesson.chapterNumber}
                    </span>
                    <div>
                      <h5 className="font-sans font-bold text-sm text-white">
                        {lesson.title}
                      </h5>
                      <span className="text-[11px] font-mono text-cyan-400">
                        لاپەڕە {lesson.page}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onSelectTopicForStudy && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTopicForStudy(lesson.title, lesson.page, currentChapter.title);
                        }}
                        className="hidden sm:flex px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold items-center gap-1 transition-all"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>پرسیار لە زانا</span>
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 space-y-4 border-t border-cyan-950/80 bg-[#071927]/60">
                    {/* Summary */}
                    <div className="space-y-1.5 pt-2">
                      <h6 className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        <span>پوختەی ناوەڕۆکی فەرمی وانە:</span>
                      </h6>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {lesson.summary}
                      </p>
                    </div>

                    {/* Key Formulas & Rules */}
                    {lesson.keyFormulasAndRules && lesson.keyFormulasAndRules.length > 0 && (
                      <div className="space-y-1.5">
                        <h6 className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>یاسا و هاوکێشە ئابوورییە گرنگەکان:</span>
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {lesson.keyFormulasAndRules.map((formula, idx) => (
                            <div
                              key={idx}
                              className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-2.5 text-xs text-emerald-200 font-mono"
                            >
                              • {formula}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Terms & Concepts */}
                    {lesson.keyTermsAndConcepts && lesson.keyTermsAndConcepts.length > 0 && (
                      <div className="space-y-1.5">
                        <h6 className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-cyan-400" />
                          <span>زاراوە و چەمکە سەرەکییەکان:</span>
                        </h6>
                        <div className="flex flex-wrap gap-1.5">
                          {lesson.keyTermsAndConcepts.map((concept, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#0b243b] text-cyan-300 border border-cyan-800/50"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ministerial Points */}
                    {lesson.ministerialPoints && lesson.ministerialPoints.length > 0 && (
                      <div className="space-y-1.5 bg-amber-950/30 border border-amber-800/40 rounded-xl p-3">
                        <h6 className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                          <span>خاڵە جەختلێکراوەکانی تاقیکردنەوەی وزاری:</span>
                        </h6>
                        <ul className="space-y-1 text-xs text-amber-200/90">
                          {lesson.ministerialPoints.map((pt, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-400">•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-cyan-950">
                      {onSelectTopicForStudy && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTopicForStudy(lesson.title, lesson.page, currentChapter.title);
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>شیکار و خوێندنی ئەم کێشە ئابوورییە لە چات</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Glossary Section (فەرهەنگۆکی زاراوە ئابوورییەکان - لاپەڕە ٢١٠ - ٢١١) */}
      <div className="bg-[#0b243b] border border-cyan-950 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-cyan-950 pb-3">
          <div className="space-y-0.5">
            <h4 className="font-sans font-bold text-sm text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>فەرهەنگۆکی فەرمی زاراوە ئابوورییەکان (لاپەڕە ٢١٠ - ٢١١)</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              زاراوە سەرەکییەکان بە سێ زمانی کوردی، عەرەبی، و ئینگلیزی هاوتەریب لەگەڵ مەنهەجی وەزارەت.
            </p>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800/40">
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
                <span className="font-sans font-bold text-xs text-emerald-300">
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
