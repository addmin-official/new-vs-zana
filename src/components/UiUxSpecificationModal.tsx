import { useState } from "react";
import {
  X,
  Layers,
  Sparkles,
  BookOpen,
  MessageSquare,
  FlaskConical,
  GraduationCap,
  Users,
  CalendarCheck,
  FileText,
  User,
  Cpu,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  Palette,
  MousePointerClick
} from "lucide-react";

interface ScreenSpec {
  id: string;
  titleKu: string;
  category: string;
  icon: typeof Sparkles;
  purposeKu: string;
  visibleElements: string[];
  buttons: {
    nameKu: string;
    actionKu: string;
    visualStateKu: string;
    invisibleLogicKu: string;
  }[];
  invisibleLogic: string[];
}

const UI_UX_SPECIFICATIONS: ScreenSpec[] = [
  {
    id: "app-shell",
    titleKu: "شێڵی سەرەکی و هێڵی ناڤیگەیشن (AppShell & Nav)",
    category: "پەیکەری سەرەکی",
    icon: Layers,
    purposeKu: "دابینکردنی پەیکەربەندییەکی یەکگرتووی RTL بۆ تەواوی پلاتفۆڕم لەگەڵ پشکنینی کەوتنە دەرەوەی هێڵ و کۆنتڕۆڵی ڕووکار.",
    visibleElements: [
      "لۆگۆی فەرمیی زانا لەگەڵ کڵاوی زانکۆ (GraduationCap) بە ڕەنگی شینی ئەکادیمی",
      "ناوی زانا بە کێشی ئەستوور (Bold 700) لەگەڵ دروشمی 'هاوڕێی زیرەکی فێربوونی تۆ'",
      "دوگمەی دۆخی تاریک/ڕووناک (ThemeToggle) بە ئایکۆنی خۆر و مانگ",
      "دوگمەی کۆنتڕۆڵی دەنگ (SoundToggle) بۆ چالاک/ناچالاککردنی فیدباکی دەنگی",
      "کارتەی کورتەی ناوی قوتابی، پۆل، و ئاستی فێربوون (لە سکرینە گەورەکاندا)",
      "شریتی ئاگاداریی هێڵ (Offline Banner) لە کاتی پچڕانی ئینتەرنێت",
      "شریتی خوارەوەی مۆبایل (BottomNavigation) بە ٧ بەشی سەرەکی و هێڵی شینی ئاماژەدەری تەبی چالاک"
    ],
    buttons: [
      {
        nameKu: "تەبەکانی خوارەوە (Tab Items)",
        actionKu: "گۆڕینی ڕاستەوخۆی پەڕە و نوێکردنەوەی ناڤیگەیشن",
        visualStateKu: "ئاسایی: تێکستی خۆڵەمێشی؛ چالاک: ئایکۆن و تێکستی شینی نیشتمانی لەگەڵ هێڵی ژێرەوە",
        invisibleLogicKu: "ئاگادارکردنەوەی دەنگ و نوێکردنەوەی مێژووی براوسەر (State & Popstate sync)"
      },
      {
        nameKu: "دوگمەی دۆخی شەو/ڕۆژ (ThemeToggle)",
        actionKu: "گۆڕینی دۆخی ڕەنگەکان لە نێوان ڕووناک، تاریک، و هاوتەریبی سیستەم",
        visualStateKu: "ئەنیمەیشنی خولانەوە و گۆڕانی ئایکۆنی مانگ بۆ خۆر لە ژێر ۲۰۰ میلیچرکەدا",
        invisibleLogicKu: "پاشەکەوتکردن لە localStorage و دەستکاریکردنی پۆلی `dark` لەسەر تاگی <html>"
      },
      {
        nameKu: "دوگمەی دەنگ (SoundToggle)",
        actionKu: "بێدەنگکردن یان چالاککردنی دەنگە فێرکارییەکان",
        visualStateKu: "سەوز لە کاتی کارابوون، خۆڵەمێشی لە کاتی بێدەنگی",
        invisibleLogicKu: "ڕاگرتن یان بەگەڕخستنی Web Audio API synthesizers بە بێ داگرتنی فایلی دەرەکی"
      },
      {
        nameKu: "دوگمەی نهێنی مێشک (Admin Brain / Ctrl+Shift+B)",
        actionKu: "چوونە ناو مێشکی بەڕێوەبەرایەتی تایبەت بە ئەندازیاران",
        visualStateKu: "تەنها بۆ ئەدمین پیشان دەدرێت بە ئایکۆنی پرۆسێسەر (Cpu)",
        invisibleLogicKu: "پشکنینی تۆکنی ئەدمین لە Worker API و پاراستنی کەسایەتی بە سیستمە ڕێساییەکان"
      }
    ],
    invisibleLogic: [
      "چاودێریکردنی ئینتەرنێت لە ڕێگەی `navigator.onLine` و ئاگاداری بە بێ بلۆککردنی شاشە",
      "پەیڕەوکردنی ڕێسای بەرزی کەمتر لە ١٥٪ی ڕووبەری مۆبایل بۆ بەشە جێگیرەکان (Sticky Cap)",
      "ڕێگریکردن لە پەڕینەوەی شاشە لە کاتی گۆڕینی دۆخەکان (Zero Layout Shift)"
    ]
  },
  {
    id: "daily-spark",
    titleKu: "چروسکەی ڕۆژانە (Daily Spark Screen)",
    category: "پەڕەی سەرەکی",
    icon: Sparkles,
    purposeKu: "دەستپێکردنەوەی ڕۆژانەی پڕ لە وزە بە چەمکێکی نوێی مەنهەج، پاداشتی بەردەوامی، و باشترین هەنگاوی فێربوون.",
    visibleElements: [
      "پێشوازیی کوردی بە زمانی فەرمیی سۆرانی بەپێی کاتی ڕۆژ (بەیانیت باش / ڕۆژت باش)",
      "کارتەی پاداشتی زنجیرەی ڕۆژانە (Streak Card) بە ئاگر و مێدالیاکان",
      "کارتەی چەمکی ڕۆژ (Concept of the Day) بە وێنەی زانستی و دەقی سەرنجڕاکێش",
      "کارتەی هەنگاوی داهاتوو (Next Best Action) بە پێشنیاری ژیری دەستکرد"
    ],
    buttons: [
      {
        nameKu: "دەستپێکردنی تاقیکردنەوەی خێرا (Start Assessment CTA)",
        actionKu: "کردنەوەی دەسبەجێی تاقیکردنەوەی تایبەت بە چەمکی ڕۆژ",
        visualStateKu: "دوگمەی سەرەکیی گەورە بە پاشبنەمای شین و سێبەری نەرم، کاریگەری دەستلێدان (Active Scale 0.98)",
        invisibleLogicKu: "ئامادەکردنی پرسیاری ئەداپتیڤ لە کەشی دەرهێنراوی مەنهەج و نوێکردنەوەی دۆخی پۆل"
      },
      {
        nameKu: "خوێندنەوەی درێژەی چەمک (Explain Topic)",
        actionKu: "گوێستنەوەی خوێندکار بۆ ژینگەی وانە لە دۆخی Explain",
        visualStateKu: "دوگمەی دەقی خۆڵەمێشی لەگەڵ تیر بەرەو چەپ (RTL Arrow)",
        invisibleLogicKu: "ئاگادارکردنەوەی ڕەوتی `ExplainModeEngine` بە ناسنامەی چەمکی دەستنیشانکراو"
      },
      {
        nameKu: "دیتنی مێدالیا و دەستکەوتەکان (Badges Showcase)",
        actionKu: "کردنەوەی مۆداڵی پێشانگای مێدالیا بەدەستهاتووەکان",
        visualStateKu: "کارتەی کڕتەپێکراو لەگەڵ ئەنیمەیشنی گەورەبوونی کەم (Hover Elevation)",
        invisibleLogicKu: "خوێندنەوە لە پێڕستی دەستکەوتەکانی ناو لۆکاڵ ستۆریج یان داتابەیس"
      }
    ],
    invisibleLogic: [
      "نوێکردنەوەی خۆکاری چەمک بەپێی سەعاتی ٠٠:٠٠ بە پەیڕەوکردنی کاتژمێری ناوخۆیی کوردستان",
      "پشکنینی دۆخی مەترسیی شکان (At Risk) بۆ زنجیرەی خوێندن تا خوێندکار هان بدرێت بەردەوام بێت"
    ]
  },
  {
    id: "subjects-curriculum",
    titleKu: "بابەتەکان و پەڕتووکی وەزارەت (Subjects & Curriculum Viewer)",
    category: "مەنهەج و زانست",
    icon: BookOpen,
    purposeKu: "گەڕان و خوێندنەوەی بەند بە بەندی پەڕتووکەکانی وەزارەتی پەروەردە (وەک کیمیای پۆلی ١٢) لەگەڵ پشتڕاستکردنەوەی زانستی.",
    visibleElements: [
      "فلتەری پۆلەکان (١٠، ١١، ١٢) بە شێوازی سەگمێنتد کۆنتڕۆڵی مۆدێرن",
      "کارتی بابەتەکان (کیمیا، فیزیا، بیرکاری، زیندەزانی، زمان) بە ئایکۆنی ئەکادیمی",
      "پێڕستی بەندەکان و تەوەری وانەکان بە ژمارەی فەرمیی پەڕتووک",
      "بینەری فەرمیی پەڕتووکی کیمیای پۆلی ١٢ (Grade12ChemistryBookViewer)"
    ],
    buttons: [
      {
        nameKu: "هەڵبژاردنی بابەت (Subject Selector Card)",
        actionKu: "دەستنیشانکردنی بابەتی چالاکی خوێندکار",
        visualStateKu: "کارتەی سپی لەگەڵ چوارچێوەی شین لە کاتی دیاریکردندا",
        invisibleLogicKu: "گۆڕینی `activeSubject` لە پرۆفایلی خوێندکار و هاوکاتکردنی تەواوی ژینگەکان"
      },
      {
        nameKu: "کردنەوەی بەند (Open Chapter)",
        actionKu: "کردنەوەی ناوەڕۆکی بەندەکە بۆ خوێندنەوە یان پرسیارکردن لەسەری",
        visualStateKu: "دوگمەی سادە بە تێکستی دیار و نیشانەی تیر",
        invisibleLogicKu: "بارکردنی دەقی مەنهەج لە `CurriculumRegistry` بۆ کورتکردنەوەی کاتی چاوەڕوانی"
      },
      {
        nameKu: "تێپەڕین بۆ وانەخوێندنی ئەم بابەتە (Launch Study Workspace)",
        actionKu: "کردنەوەی ژینگەی وانە تایبەت بەو بابەتەی هەڵبژێردراوە",
        visualStateKu: "دوگمەی شینی تۆخ بە تێکستی سپی (Primary)",
        invisibleLogicKu: "گەیاندنی پەیامی ڕەوتی گەڕانەوەی لاپەڕە بە پارامێتەرەکانی وانەکە"
      }
    ],
    invisibleLogic: [
      "سیستەمی `CurriculumResolver` بۆ دۆزینەوەی خێرای پەڕەکان بێ تێپەڕبوون لە سنووری مەنهەج",
      "فلتەرکردنی زمانەوانی لە کاتی هەڵبژاردنی لقی زانستی یان وێژەیی"
    ]
  },
  {
    id: "study-workspace",
    titleKu: "ژینگەی وانەخوێندنی زیرەک (Study Workspace & Vision Solver)",
    category: "فێربوونی ژیریی دەستکرد",
    icon: MessageSquare,
    purposeKu: "مێشکی دیالۆگی سۆکراتی، دەرهێنانی پرسیار بە کامێرا، ڕوونکردنەوەی چەمکەکان و ڕێنماییکردنی بیرکردنەوەی خوێندکار.",
    visibleElements: [
      "سەگمێنتد کۆنتڕۆڵی سێ دۆخەکە: پرسیارکردن (Ask)، ڕوونکردنەوە (Explain)، ڕاهێنان (Practice)",
      "شاشەی گفتوگۆ بە ڕیزبەندی کاتی، بەڵگەی لاپەڕەی پەڕتووک لەگەڵ دەقە زانستییەکان",
      "بۆکسی پرسیارە پێشنیازکراوەکان (Suggested Questions)",
      "پێشبینینی وێنەی کامێرا (Vision Capture Panel) بۆ هاوکێشە و پرسیارەکان",
      "بۆکسی نووسینی فراوان بە هێمای مایک و کامێرا و ناردن"
    ],
    buttons: [
      {
        nameKu: "گۆڕینی دۆخی فێربوون (Ask/Explain/Practice Tabs)",
        actionKu: "گۆڕینی دەستبەجێی ڕەفتاری وەڵامدانەوەی مامۆستای زیرەک",
        visualStateKu: "دوگمەی سەگمێنتد لە ناو چوارچێوەی خۆڵەمێشی هێمن، دۆخی چالاک بە پاشبنەمای سپی",
        invisibleLogicKu: "گۆڕینی فۆرماتی داواکاری بۆ ڕێساکانی تەنسیقی سۆکراتی لە سێرڤەردا"
      },
      {
        nameKu: "گرتنی وێنەی پرسیار (Camera / Upload Button)",
        actionKu: "چالاککردنی کامێرا یان هەڵبژاردنی وێنە لە مۆبایل/کۆمپیوتەر",
        visualStateKu: "ئایکۆنی کامێرا بە ڕەنگی خۆڵەمێشی، دەبێتە شین لە کاتی هەبوونی وێنە",
        invisibleLogicKu: "پشکنینی قەبارەی وێنە، بەرهەمهێنانی مۆری پارێزراو (Image Signature) و بەستن بە داواکاری"
      },
      {
        nameKu: "ناردنی پرسیار (Send Message Button)",
        actionKu: "ناردنی دەق یان وێنە بۆ شیکارکردنی هەنگاو بە هەنگاو",
        visualStateKu: "ئایکۆنی تیر؛ ناچالاک (Disabled) دەبێت لە کاتی بەتاڵیدا یان لە کاتی چاوەڕوانی وەڵام",
        invisibleLogicKu: "بانگکردنی API ی سێرڤەری `/api/chat` بە مۆدێلی پارێزراوی سێرڤەر و لێدانی دەنگی وەڵام"
      },
      {
        nameKu: "کڕتە لەسەر پرسیارە پێشنیارکراوەکان (Quick Suggestion Pills)",
        actionKu: "نووسینی خێرای پرسیار لە ناو بۆکس و ناردنی",
        visualStateKu: "دوگمەی سادەی دەورەگیراو بە هێڵی تەنک",
        invisibleLogicKu: "کەمکردنەوەی ماندووبوونی تایپکردن بۆ خوێندکار لە مۆبایلدا"
      }
    ],
    invisibleLogic: [
      "پەیڕەوکردنی دەستووری زمانی سۆرانی (Sorani Constitution) بە پاراستنی ڕێنووسی فەرمی",
      "ڕێگریکردن لە پێدانی وەڵامی ڕاستەوخۆ (Anti-Cheating Socratic Guidance)",
      "تۆمارکردنی لاوازی و لێکتێنەگەیشتنەکان لە ژێرخانی پڕۆفایلی فێربوونی خوێندکاردا"
    ]
  },
  {
    id: "practice-lab",
    titleKu: "تاقیگەی زانستی و شیکارکەر (Practice & Science Lab)",
    category: "ڕاهێنانی کارلێککار",
    icon: FlaskConical,
    purposeKu: "ژینگەی تاقیگەی مەجازیی ترش و تفت، شیکاری هەنگاو بە هەنگاوی هاوکێشەکان و پێشبڕکێی یاریزانی خاڵبەندی.",
    visibleElements: [
      "تاقیگەی ترش و تفت (Acid-Base Titration) بە ڕەنگی پێوەر و بۆریی دڵۆپێنەر",
      "هێڵکاریی زیندووی گۆڕانی pH بەپێی قەبارەی زیادکراو",
      "شیکارکەری هەنگاو بە هەنگاوی بیرکاری و فیزیا",
      "دیاگرامی ئەتۆم و ماددە زانستییەکان"
    ],
    buttons: [
      {
        nameKu: "سلایدەری قەبارەی تفت/ترش (Titration Volume Slider)",
        actionKu: "کۆنتڕۆڵکردنی بڕی ماددە لە تاقیگەدا",
        visualStateKu: "سلایدەری ڕوون بە ژمارەی نووسراو (نموونە: 12.5 mL)",
        invisibleLogicKu: "ژماردنی بیرکارییانەی خەستی و هەژمارکردنی ڕەنگی پێوەر لە چرکەساتدا"
      },
      {
        nameKu: "دوگمەی دەستپێکردنەوەی تاقیگە (Reset Lab Simulation)",
        actionKu: "پاککردنەوەی قاپەکان و گەڕاندنەوە بۆ دۆخی سەرەتایی",
        visualStateKu: "دوگمەی سنووردار بە هێڵی باریک لەگەڵ ئایکۆنی دووبارەکردنەوە",
        invisibleLogicKu: "پاککردنەوەی دۆخی کارلێک و هێڵکارییەکان بە بێ ڕیفرێشکردنی پەڕە"
      },
      {
        nameKu: "دوگمەی پشکنینی هەنگاوی شیکارکردن (Check Step)",
        actionKu: "هەڵسەنگاندنی وەڵامی خوێندکار لە هەنگاوی ئێستادا",
        visualStateKu: "سەوز لە کاتی سەرکەوتن، پرتەقاڵی لە کاتی پێویستی بە سەرنجدان",
        invisibleLogicKu: "پشکنینی گونجاوی لەگەڵ یاساکانی هاوکێشە لە ناو مۆدیولی شیکارکەردا"
      }
    ],
    invisibleLogic: [
      "ڕێساکانی هاوسەنگی کیمیایی بەپێی کتێبی پۆلی ١٢ بە هاوکێشەی ڕاستەقینە",
      "لێدانی دەنگی فیدباک لە ڕێگەی `useSoundEffects` بۆ هاندانی سۆزداریی فێربوون"
    ]
  },
  {
    id: "adaptive-assessment",
    titleKu: "تاقیکردنەوەی ئەداپتیڤ و زیرەک (Adaptive Assessment Engine)",
    category: "هەڵسەنگاندنی پارێزراو",
    icon: GraduationCap,
    purposeKu: "پێوانەکردنی ئاستی فەرمیی خوێندکار بە پرسیاری گونجاو لەگەڵ توانای خۆی بە پێوانەی پارێزراوی سێرڤەر.",
    visibleElements: [
      "شریتی پێشکەوتنی پرسیارەکان بە ڕێژەی تەواوبوو",
      "کاتژمێری فەرمیی پاشەکشێ (Countdown Timer)",
      "دەقی پرسیار بە شێوازەکانی فرەهەڵبژاردن، ڕاست/هەڵە، ژمارەیی، و گەیاندن",
      "کارتی وەڵامەکان بە ڕووبەری دەستلێدانی گەورە (زیاتر لە ٤٨ پێکسڵ)"
    ],
    buttons: [
      {
        nameKu: "بژاردەی وەڵام (Answer Option Card)",
        actionKu: "دیاریکردنی وەڵامی دڵخواز",
        visualStateKu: "هێڵی شین لە کاتی دەستنیشانکردن بە بێ نیشاندانی ڕاستی/هەڵەیی تا نەنێردرێت",
        invisibleLogicKu: "تۆمارکردنی هەڵبژاردن لە دۆخی کاتی (Local State)"
      },
      {
        nameKu: "ناردن و هەڵسەنگاندن (Submit Question Button)",
        actionKu: "ناردنی وەڵام بۆ سێرڤەری Cloudflare بۆ نمرەکردنی فەرمی",
        visualStateKu: "دوگمەی پڕ بە ڕەنگی شین؛ نیشاندانی خاڵەکانی بارکردن (Loading Dots)",
        invisibleLogicKu: "ناردن بۆ `/api/assessment/evaluate`، دەرکردنی نمرە لە سێرڤەر بە بێ دزەکردنی کلیل"
      },
      {
        nameKu: "پرسیاری دواتر (Next Question Button)",
        actionKu: "پەڕینەوە بۆ پرسیاری ئاستی داهاتوو",
        visualStateKu: "دوگمەی چالاک دوای بینینی ڕوونکردنەوەی فیدباک",
        invisibleLogicKu: "کەڵەکەبوونی نمرەی توانستی سێرڤەر و هەڵبژاردنی سەختی پرسیاری داهاتوو"
      }
    ],
    invisibleLogic: [
      "ڕێگریکردن لە دزینی وەڵامەکان لە ڕێگەی شاردنەوەی تەواوی کۆدەکان لە سێرڤەردا",
      "ئەگەر خوێندکار میوان بێت یان ئۆفلاین بێت، نمرەکەی بە `authoritative: false` تۆمار دەکرێت"
    ]
  },
  {
    id: "study-rooms",
    titleKu: "ژووری خوێندنی بەکۆمەڵ (Study Rooms & Pomodoro)",
    category: "ژینگەی سەرنجدان",
    icon: Users,
    purposeKu: "دروستکردنی ژینگەیەکی خوێندنی ئارام لەگەڵ کاتژمێری پۆمۆدۆرۆ، دەنگە سروشتییەکان و بینینی هاوپۆلەکان.",
    visibleElements: [
      "کاتژمێری گەورەی پۆمۆدۆرۆ (٢٥ خولەک تەرکیز / ٥ خولەک پشوو)",
      "کۆنتڕۆڵکەری دەنگە ئارامبەخشەکان (باران، باخچە، کتێبخانە)",
      "ژمارەی خوێندکارانی چالاک لە ژوورەکەدا"
    ],
    buttons: [
      {
        nameKu: "دەستپێکردن/وەستاندنی کاتژمێر (Play/Pause Pomodoro)",
        actionKu: "دەستپێکردن یان ڕاگرتنی کاتی خوێندن",
        visualStateKu: "دوگمەی بازنەیی گەورە بە ڕەنگی سەوز یان سووری هێمن",
        invisibleLogicKu: "تۆمارکردنی خولەکەکانی خوێندن بۆ هەژمارکردنی لە تابلۆی دەستکەوتەکانی ڕۆژ"
      },
      {
        nameKu: "هەڵبژاردنی دەنگی ژینگە (Ambient Sound Selector)",
        actionKu: "لێدانی دەنگی نەرم بۆ زیادکردنی تەرکیز",
        visualStateKu: "کارتی بچووک بە ئایکۆنی کەشوهەوا، دەبێتە تۆخ لە کاتی کارابووندا",
        invisibleLogicKu: "بەرهەمهێنانی ڕیتمی دەنگی سروشتی بە دەرچەی دەنگی براوسەر"
      }
    ],
    invisibleLogic: [
      "ئاگاداری تەواوبوونی کاتی خوێندن لە ڕێگەی دەنگی زەنگۆڵەی هێمن",
      "هاوکاتکردنی دانیشتن لەگەڵ ڕێڕەوی ڕۆژانەی پلاتفۆڕم"
    ]
  },
  {
    id: "study-path",
    titleKu: "ڕێڕەوی خوێندن و پلانەکان (Student Study Path)",
    category: "بەڕێوەبردنی کات",
    icon: CalendarCheck,
    purposeKu: "دابەشکردنی مەنهەج بۆ ئەرکی بچووک و بەڕێوەبردنی کاتژمێری هەفتانەی خوێندکار بەپێی ئاستی تێگەیشتنی.",
    visibleElements: [
      "تەبەکانی: پلانی ئەمڕۆ (Today)، پلانی هەفتانە (Weekly)، ئامانجەکان (Goals)",
      "لیستی ئەرکە ڕیزکراوەکان بە پێشینەی بەرز و ئاسایی",
      "کارتەی پێشکەوتنی هەفتانە بەرەو بەدەستهێنانی ئامانج"
    ],
    buttons: [
      {
        nameKu: "دەستپێکردنی ئەرکی پلان (Launch Task)",
        actionKu: "کردنەوەی ڕاستەوخۆی ئەو ڕاهێنانە یان لاپەڕەیەی دیاریکراوە",
        visualStateKu: "دوگمەی شینی بچووک لە تەنیشت ناوی ئەرکەکە",
        invisibleLogicKu: "ڕێنماییکردنی ئۆتۆماتیکی بەرەو مۆدیولی مەبەست بە داتای پێشوەختە"
      },
      {
        nameKu: "دەستکاریکردنی ئامانجی هەفتانە (Edit Goal Hours)",
        actionKu: "دیاریکردنی چەند کاتژمێر لە هەفتەیەکدا دەخوێنیت",
        visualStateKu: "بۆکسی نمرەی بەرزبوونەوە/نزمبوونەوە (+ / -)",
        invisibleLogicKu: "دووبارە هاوسەنگکردنەوەی خشتەی هەفتانە لە لۆژیکی `PlanRebalancer`دا"
      }
    ],
    invisibleLogic: [
      "دۆزینەوەی پێشینەکان بەپێی لاوازی لە تاقیکردنەوەکاندا",
      "پێشبینیکردنی کاتی تەواوکردنی مەنهەج پێش تاقیکردنەوەی وزاری"
    ]
  },
  {
    id: "parent-report",
    titleKu: "ڕاپۆرتی بەخێوکەر (Parent Intelligence Report)",
    category: "پەیوەندی خێزان",
    icon: FileText,
    purposeKu: "ئاگادارکردنەوەی شەفافی دایک و باوکان لە ئاستی منداڵەکەیان بە شێوازێکی دڵنیاکەرەوە و هاندەرانە بە زمانی کوردی.",
    visibleElements: [
      "پوختەی هەفتانە بۆ دایک و باوک بە ڕستەی ڕوون و هاوڕێیانە",
      "خشتەی لێهاتوویی بەپێی بابەتەکان (کیمیا، فیزیا، بیرکاری)",
      "خاڵە بەهێزەکان و ئەو بەشانەی پێویستیان بە پێداچوونەوەیە",
      "ڕێنمایی بۆ دایک و باوک بۆ چۆنیەتی دروستکردنی کەشی گونجاو لە ماڵەوە"
    ],
    buttons: [
      {
        nameKu: "چاپکردن یان دەرکردنی PDF (Print / Export)",
        actionKu: "دەرکردنی ڕاپۆرتەکە بە لاپەڕەیەکی ڕێکخراو بۆ چاپ",
        visualStateKu: "دوگمەی ئایکۆنی چاپکەر بە دیزاینی فەرمی",
        invisibleLogicKu: "بانگکردنی فرمانی چاپی سیستەم بە ستایلی تایبەتی Print CSS"
      }
    ],
    invisibleLogic: [
      "وەرگێڕانی داتای ئاڵۆزی ئەلگۆریتمەکان بۆ دەقی سادە و گونجاو بۆ خێزان",
      "شاردنەوەی کۆدە تەکنیکییەکان و نیشاندانی تەنها ئاست و دەستکەوتەکان"
    ]
  },
  {
    id: "profile-settings",
    titleKu: "پڕۆفایل و ڕێکخستنەکان (Profile & Settings)",
    category: "ڕێکخستنی هەژمار",
    icon: User,
    purposeKu: "دەستکاریکردنی زانیارییەکانی خوێندکار، کۆنتڕۆڵی ڕووکار، هەڵبژاردنی دۆخی دەنگ و بەڕێوەبردنی چوونەدەرەوە.",
    visibleElements: [
      "فۆڕمی ناوی قوتابی، پۆل، بەش، و ئاستی سەرەتایی",
      "تابلۆی لێهاتوویی گشتی (Mastery Score) و لیستەی تێگەیشتنە هەڵەکان",
      "دەستنیشانکردنی دۆخی ڕەنگ (ڕووناک، تاریک، سیستەم)",
      "کۆنتڕۆڵکردنی دەنگەکان لەگەڵ دوگمەی تاقیکردنەوەی دەنگ",
      "بەشی دەرچوون لە هەژمار و ناوچەی مەترسیداری سڕینەوە"
    ],
    buttons: [
      {
        nameKu: "پاشەکەوتکردنی زانیارییەکان (Save Profile)",
        actionKu: "تۆمارکردنی گۆڕانکارییەکانی ناوی قوتابی و پۆل",
        visualStateKu: "دوگمەی سەوزی شیاو؛ پیشاندانی پەیامی سەرکەوتن بۆ ماوەی ٣ چرکە",
        invisibleLogicKu: "نوێکردنەوە لە ستۆریج و ناردن بۆ داتابەیسی سێرڤەر ئەگەر ئۆنلاین بێت"
      },
      {
        nameKu: "تاقیکردنەوەی دەنگەکان (Test Audio Feedback)",
        actionKu: "لێدانی دەنگی سەرکەوتن، دەنگی هەڵە، یان وەڵامی زانا",
        visualStateKu: "سێ دوگمەی ڕەنگاوڕەنگی بچووک بە دەستلێدانی خێرا",
        invisibleLogicKu: "دڵنیابوونەوە لەوەی ئامێری بەکارهێنەر ڕێگە بە دەنگ دەدات"
      },
      {
        nameKu: "چوونەدەرەوە لە هەژمار (Logout Button)",
        actionKu: "دەرچوون و گەڕانەوە بۆ پەڕەی چوونەژوورەوە",
        visualStateKu: "دوگمەی چوارچێوەدار بە ئایکۆنی دەرچوون",
        invisibleLogicKu: "سڕینەوەی تۆکنەکانی دانیشتن و گەڕانەوەی ئارام بۆ پەڕەی سەرەتا"
      },
      {
        nameKu: "سڕینەوەی گشتی سەرجەم زانیارییەکان (Hard Reset)",
        actionKu: "سڕینەوەی تەواوی پێشکەوتنەکان و نمرەکان",
        visualStateKu: "دوگمەی سووری مەترسیدار لەگەڵ مۆداڵی دڵنیابوونەوە",
        invisibleLogicKu: "سڕینەوەی کلیلەکانی پلاتفۆڕم لە هەموو شوێنێکدا بە شێوازێکی هەمیشەیی"
      }
    ],
    invisibleLogic: [
      "دڵنیابوون لەوەی هیچ گۆڕانکارییەکی نادیار بە هەڵە زانیارییەکان ناسڕێتەوە بێ ئاگاداری"
    ]
  },
  {
    id: "brain-admin",
    titleKu: "مێشکی ئەندازیاری و بەڕێوەبەرایەتی (Brain Admin Dashboard)",
    category: "ئەندازیاری و ژیری",
    icon: Cpu,
    purposeKu: "ژینگەی بەڕێوەبەرایەتیی ئەندازیاران بۆ پشکنینی دەستوورەکان، تۆڕی مەنهەج، و تەندروستی سێرڤەری لێوار (Edge API).",
    visibleElements: [
      "نیشاندەری دەستوورە چالاکەکان (Sorani, UX, AI, Pedagogy Constitutions)",
      "شیکاری گراف و تۆڕی مەنهەج (Curriculum Graph Nodes)",
      "دۆخی تەندروستی سێرڤەر، کاتی وەڵامدانەوە و ژمارەی مۆدێلەکانی ژیریی دەستکرد"
    ],
    buttons: [
      {
        nameKu: "گەڕانەوە بۆ بەرنامە (Back to App)",
        actionKu: "داخستنی تابلۆی ئەدمین و گەڕانەوە بۆ شاشەی ئاسایی خوێندکار",
        visualStateKu: "دوگمەی سەرەوە بە ئایکۆنی گەڕانەوە",
        invisibleLogicKu: "گۆڕینی دۆخی `isBrainActive` و ڕێکخستنەوەی ناڤیگەیشنی براوسەر"
      }
    ],
    invisibleLogic: [
      "پاراستنی نهێنی و سنووردارکردنی دەسەڵات تەنها بۆ ئەوانەی ئیمەیڵی فەرمیان هەیە"
    ]
  }
];

interface UiUxSpecificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UiUxSpecificationModal({ isOpen, onClose }: UiUxSpecificationModalProps) {
  const [selectedScreenId, setSelectedScreenId] = useState<string>("app-shell");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"screens" | "tokens" | "summary">("screens");

  if (!isOpen) return null;

  const currentScreen = UI_UX_SPECIFICATIONS.find((s) => s.id === selectedScreenId) || UI_UX_SPECIFICATIONS[0];

  const filteredScreens = UI_UX_SPECIFICATIONS.filter((s) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesScreen = s.titleKu.toLowerCase().includes(query) || s.purposeKu.toLowerCase().includes(query);
    const matchesButton = s.buttons.some(
      (b) => b.nameKu.toLowerCase().includes(query) || b.actionKu.toLowerCase().includes(query)
    );
    return matchesScreen || matchesButton;
  });

  const handleCopyReport = () => {
    const reportText = `# ڕاپۆرتی گشتگیری سیستەمی UI/UX ی زانا (ZANA)
بەروار: ${new Date().toLocaleDateString("ku-IQ")}
ئامادەکراوە بۆ خوێندکاران و مامۆستایانی هەرێمی کوردستان

${UI_UX_SPECIFICATIONS.map(
  (s) => `
## ${s.titleKu}
- ئامانج: ${s.purposeKu}
- بەشە دیارەکان:
${s.visibleElements.map((v) => `  * ${v}`).join("\n")}
- دوگمەکان و کارلێکەکان:
${s.buttons.map((b) => `  * ${b.nameKu}: ${b.actionKu} (دۆخی بینین: ${b.visualStateKu} | لۆژیکی نادیار: ${b.invisibleLogicKu})`).join("\n")}
- لۆژیک و دۆخە نادیارەکان:
${s.invisibleLogic.map((inv) => `  * ${inv}`).join("\n")}
`
).join("\n----------------------------------------\n")}
`;

    void navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        dir="rtl"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-right"
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-tight">
                ڕاپۆرت و نەخشەی تەواوی خاسیەت و دیزاینی UI/UX
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                وردەکاری تەواوی هەموو ڕووکار، دوگمە، خاسیەتە دیار و نادیارەکان بە زمانی کوردی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="px-3 py-1.5 text-xs font-sans font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="کۆپیکردنی دەقی ڕاپۆرتەکە"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">کۆپی کرا!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>کۆپیکردنی ڕاپۆرت</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              title="داخستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("screens")}
              className={`px-3 py-1.5 text-xs font-sans font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "screens"
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              ڕووکار و دوگمەکان ({UI_UX_SPECIFICATIONS.length})
            </button>
            <button
              onClick={() => setActiveTab("tokens")}
              className={`px-3 py-1.5 text-xs font-sans font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "tokens"
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              سیستەمی ڕەنگ و دیزاین (Design System)
            </button>
            <button
              onClick={() => setActiveTab("summary")}
              className={`px-3 py-1.5 text-xs font-sans font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "summary"
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              پوختەی ئەندازیاری
            </button>
          </div>

          {activeTab === "screens" && (
            <div className="relative max-w-xs w-full hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="گەڕان لە دوگمە یان بەشێک..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "screens" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Left/Sidebar Screen List */}
              <div className="md:col-span-4 space-y-1 max-h-[500px] overflow-y-auto pr-1">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block mb-2 px-1">
                  پێڕستی ڕووکارەکانی سیستەم:
                </span>
                {filteredScreens.map((screen) => {
                  const Icon = screen.icon;
                  const isSelected = screen.id === currentScreen.id;
                  return (
                    <button
                      key={screen.id}
                      onClick={() => setSelectedScreenId(screen.id)}
                      className={`w-full text-right p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer border ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 shadow-xs"
                          : "bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-bold text-xs truncate leading-tight">
                          {screen.titleKu}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-1 block">
                          {screen.buttons.length} دوگمە و کارلێک
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Details Panel */}
              <div className="md:col-span-8 space-y-5 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {/* Title and Purpose */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full font-bold">
                      {currentScreen.category}
                    </span>
                    <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {currentScreen.titleKu}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    {currentScreen.purposeKu}
                  </p>
                </div>

                {/* Visible Elements */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>خاسیەت و پێکهاتە دیارەکان (Visible UI Elements):</span>
                  </div>
                  <ul className="space-y-1.5 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentScreen.visibleElements.map((el, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>{el}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Buttons and Actions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <MousePointerClick className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>دوگمەکان، کارلێک و دۆخە بینراوەکان (Buttons & Triggers):</span>
                  </div>
                  <div className="space-y-2">
                    {currentScreen.buttons.map((btn, i) => (
                      <div
                        key={i}
                        className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {btn.nameKu}
                          </span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-mono">
                            Action
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <strong>کردار:</strong> {btn.actionKu}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          <strong>دۆخی ڕووکار (Visual State):</strong> {btn.visualStateKu}
                        </p>
                        <div className="text-[11px] bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 font-sans">
                          <strong>لۆژیکی نادیار و پەیوەندی بە سیستەم:</strong> {btn.invisibleLogicKu}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invisible Engine and State */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <EyeOff className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>لۆژیک و دۆخە نادیارەکان (Invisible Logic & Architecture):</span>
                  </div>
                  <ul className="space-y-1.5 bg-purple-50/40 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/40 text-xs text-purple-950 dark:text-purple-200 leading-relaxed">
                    {currentScreen.invisibleLogic.map((inv, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                        <span>{inv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tokens" && (
            <div className="space-y-6">
              <div className="bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                سیستەمی ڕەنگی پلاتفۆڕمی زانا پەیڕەوی ڕێسای زێڕینی <strong>60-30-10</strong> دەکات بۆ پاراستنی هێمنی، سەرنجڕاکێشی و توانستی خوێندنەوە بۆ چاو:
              </div>

              {/* 60-30-10 Color System */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">٦٠٪ پانتایی بنەڕەتی</span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">Canvas</span>
                  </div>
                  <div className="h-10 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[11px] font-mono">
                    #F8FAFC / #020617
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    پاشبنەمای هێمن کە ماندووبوونی چاو کەم دەکاتەوە لە کاتی خوێندنی درێژخایەندا.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">٣٠٪ ڕووبەری پێکهاتەیی</span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">Structural</span>
                  </div>
                  <div className="h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[11px] font-mono">
                    #FFFFFF / #0F172A
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    کارتەکان، هێڵە باریکەکان بە بەکارهێنانی بۆشایی سپی لەبری کارتی لەناو کارتدا.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">١٠٪ ئاماژە و کردار</span>
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">Accents</span>
                  </div>
                  <div className="h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[11px] font-mono">
                    #4F46E5 / #059669
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    تەرخانکراو بە تەواوی بۆ دوگمە سەرەکییەکان (CTAs) و خاڵەکانی سەرکەوتن.
                  </p>
                </div>
              </div>

              {/* Typography & Spacing Rules */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-sans font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-600" />
                  <span>یاساکانی تایپۆگرافی و ڕووکاری کوردی (RTL Constitution)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <strong>ئاڕاستەی ڕاست بۆ چەپ (RTL Flow):</strong> تەواوی دەق و ڕیزبەندییەکان لە ڕاستەوە دەست پێدەکەن لەگەڵ هەموو دوگمە و ئایکۆنەکان.
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <strong>ڕووبەری کڕتەی دەستلێدان (Touch Targets):</strong> هەموو دوگمەیەک لانیکەم ٤٤ پێکسڵ بەرزە بۆ ئەوەی لە مۆبایل بە ئاسانی دەستی لێ بدرێت.
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <strong>ژمارە ئەندازیارییەکان (Tabular Nums):</strong> کاتژمێرەکان و نمرەکان پەیڕەوی ژمارەی ستاندارد دەکەن بۆ نەجووڵانی هێڵەکان.
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <strong>خاوێنی بێ حەپ (Zero-Pill Discipline):</strong> دەستبەرداربوون لە حەپە ڕەنگاوڕەنگەکان و بەکارهێنانی تێکستی خاوێن لەگەڵ نیشانەی خاڵ (`·`).
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "summary" && (
            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">
                پوختەی تەلارسازیی ئەزموونی بەکارهێنەر لە زانا
              </h3>
              <p>
                پلاتفۆڕمی زانا لەسەر بنەمای پێشکەوتووترین پێوەرەکانی سەردەم داڕێژراوە تا خوێندکاری کورد ژینگەیەکی فێرکاریی بەدەست بگات کە لەگەڵ گەورەترین سیستەمەکانی جیهاندا هاوتا بێت.
              </p>
              <div className="space-y-2 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <strong className="text-blue-600 dark:text-blue-400 block mb-1">١. متمانە و سەرچاوەی فەرمی (Curriculum Grounding):</strong>
                  هەموو پرسیار، ڕوونکردنەوە و تاقیکردنەوەیەک لە چوارچێوەی کتێبەکانی وەزارەتی پەروەردەی هەرێمی کوردستان دەمێنێتەوە و هیچ زانیارییەکی دەرەکی تێکەڵ ناکرێت.
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <strong className="text-emerald-600 dark:text-emerald-400 block mb-1">٢. پاراستنی پرسیارەکان لە سێرڤەر (Zero Answer Leak):</strong>
                  کلیلی وەڵامەکان لە سێرڤەری پارێزراودا دەمێننەوە، قوتابی تەنها پرسیارەکە دەبینێت و هەڵسەنگاندنەکە لە ڕێگەی سێرڤەری خێرای لێوارەوە ئەنجام دەدرێت.
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <strong className="text-purple-600 dark:text-purple-400 block mb-1">٣. نەرمی لەسەر مۆبایل و کۆمپیوتەر (Responsive Ergonomics):</strong>
                  لە مۆبایل شریتی ناڤیگەیشنی خوارەوە و لە کۆمپیوتەر شریتی سەرەوەی مۆدێرن بەکار دەهێنرێت بە بێ دروستبوونی شێواوی لە ڕووکارەکاندا.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
          <span>پلاتفۆڕمی فێرکاریی زانا • وەزارەتی پەروەردە</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
}
