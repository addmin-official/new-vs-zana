import React, { useState } from "react";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Atom,
  FlaskConical,
  Layers,
  Bookmark
} from "lucide-react";
import { CurriculumIndexService } from "../curriculum/retrieval/CurriculumIndexService.ts";
import { CurriculumEvidence } from "../curriculum/retrieval/CurriculumEvidence.ts";

interface Grade12ChemistryBookViewerProps {
  onSelectTopicForStudy?: (topicTitle: string, pageRange: string, partName: string) => void;
  onNavigateToChat?: () => void;
}

export const Grade12ChemistryBookViewer: React.FC<Grade12ChemistryBookViewerProps> = React.memo(({
  onSelectTopicForStudy,
  onNavigateToChat,
}) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(1);
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
      subject: "chemistry",
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

  // Detailed breakdown of the 5 official parts
  // Detailed breakdown of the official 2025 curriculum (10 chapters + appendices, 316 pages)
  const PARTS_METADATA = [
    {
      partIndex: 1,
      partName: "کیمیا-١٢-مەنهەجی ٢٠٢٥ (بەشی ١)",
      pageStart: 8,
      pageEnd: 63,
      unitTitle: "بەشی یەکەم: ئایۆنەکان، ڕەوشە کۆکارییەکان و ترش و تفتەکان",
      summaryKu: "ئایۆنەکان لە ئاوەگیراوەکاندا، لێککەوتنی ئایۆنی، ڕەوشە کۆکارییەکان، و بیردۆزەکانی ترش و تفت.",
      chapters: [
        {
          num: 1,
          title: "بەندی ١: ئایۆنەکان لە ئاوەگیراوەکاندا و ڕەوشە کۆکارییەکان",
          pages: "٨ - ٣٦",
          lessons: [
            { id: "1-1", title: "کەرتی ١-١: ئاوێتەکان لەناو ئاوەگیراوەکاندا", pages: "٩ - ١٩", desc: "لێککەوتنی ئایۆنی، هاوکێشەی ئایۆنی پەتی، و ئایۆنی تەماشاکەر." },
            { id: "1-2", title: "کەرتی ٢-١: ڕەوشە کۆکارییەکانی گیراوەکان", pages: "٢٠ - ٣٦", desc: "نزمبوونەوەی پەستانی هەڵم، نزمبوونەوەی پلەی بەستن، بەرزبوونەوەی کوڵان و دەڵاندن." }
          ]
        },
        {
          num: 2,
          title: "بەندی ٢: ترش و تفتەکان",
          pages: "٣٧ - ٦٣",
          lessons: [
            { id: "2-1", title: "کەرتی ١-٢: ڕەوشەکانی ترش و تفتەکان", pages: "٣٨ - ٤٦", desc: "ناسرەوەکان، ترشە دووانی و ئۆکسجینییەکان و پێناسەی ئارینیۆس." },
            { id: "2-2", title: "کەرتی ٢-٢: بیردۆزەکانی ترش-تفت", pages: "٤٧ - ٥٤", desc: "تیۆری برۆنشتێد-لۆری، ترشی فرەپرۆتۆنی، و تیۆری لویس." },
            { id: "2-3", title: "کەرتی ٣-٢: کارلێکەکانی ترش و تفتەکان", pages: "٥٥ - ٦٣", desc: "جووتی هاوجوت، ماددەی ئەمفۆتێری، کارلێکی هاوتاکردن و ترشە باران." }
          ]
        }
      ]
    },
    {
      partIndex: 2,
      partName: "کیمیا-١٢-مەنهەجی ٢٠٢٥ (بەشی ٢)",
      pageStart: 64,
      pageEnd: 143,
      unitTitle: "بەشی دووەم: پێوانەکاری، وزەی کارلێکەکان و خێرایی کارلێک",
      summaryKu: "پێوانەکاری ترش-تفت و pH، کیمیای گەرمی و یاسای هێس، و بیردۆزی پێکدادان و خێرایی کارلێکەکان.",
      chapters: [
        {
          num: 3,
          title: "بەندی ٣: پێوانەکاری ترش-تفت و ڕێژەی هایدرۆجینی pH",
          pages: "٦٤ - ٩٣",
          lessons: [
            { id: "3-1", title: "کەرتی ١-٣: ئاوەگیراوەکان و چەمکی pH", pages: "٦٥ - ٧٨", desc: "خۆبەخۆ ئایۆنینی ئاو (Kw)، پێوەری pH و pOH، و پەیوەندی pH + pOH = 14." },
            { id: "3-2", title: "کەرتی ٢-٣: دیاریکردنی pH و پێوانەکاری (تیتراسیۆن)", pages: "٧٩ - ٩٣", desc: "ناسرەوەکانی ترش-تفت، خاڵی هاوتایی، خاڵی کۆتایی و سەنگاندن." }
          ]
        },
        {
          num: 4,
          title: "بەندی ٤: وزەی کارلێکەکان",
          pages: "٩٤ - ١١٩",
          lessons: [
            { id: "4-1", title: "کەرتی ١-٤: کیمیای گەرمی", pages: "٩٥ - ١٠٧", desc: "گەرمی جۆری، ئینتەلپی (ΔH)، یاسای هێس، و کارلێکی گەرمیدەر و گەرمیمژ." },
            { id: "4-2", title: "کەرتی ٢-٤: هێزە کارلێک هاندەرەکان", pages: "١٠٨ - ١١٩", desc: "ئینترۆپی (S)، وزەی سەربەستی گیبس (ΔG)، و مەرجەکانی خۆبەخۆیی کارلێک." }
          ]
        },
        {
          num: 5,
          title: "بەندی ٥: خێرایی کارلێکەکان",
          pages: "١٢٠ - ١٤٣",
          lessons: [
            { id: "5-1", title: "کەرتی ١-٥: کردەی کارلێک", pages: "١٢١ - ١٢٨", desc: "ڕێڕەوی کارلێک، بیردۆزی پێکدادان، وزەی چالاککردن (Ea)، و ئاڵۆزی چالاککراو." },
            { id: "5-2", title: "کەرتی ٢-٥: خێرایی کارلێککردنی کیمیایی", pages: "١٢٩ - ١٤٣", desc: "یاسای خێرایی، پلەی کارلێک، نەگۆڕی k، و هۆکارە کاریگەرەکان لەسەر خێرایی." }
          ]
        }
      ]
    },
    {
      partIndex: 3,
      partName: "کیمیا-١٢-مەنهەجی ٢٠٢٥ (بەشی ٣)",
      pageStart: 144,
      pageEnd: 201,
      unitTitle: "بەشی سێیەم: هاوسەنگی کیمیایی و کارلێکەکانی ئۆکسان و لێککردنەوە",
      summaryKu: "بنەمای لۆشاتێلیە، بافەر و Ksp، ژمارەی ئۆکسان و هاوسەنگکردنی ڕیدۆکس بە نیوەکارلێک.",
      chapters: [
        {
          num: 6,
          title: "بەندی ٦: هاوسەنگی کیمیایی",
          pages: "١٤٤ - ١٨١",
          lessons: [
            { id: "6-1", title: "کەرتی ١-٦: سروشتی هاوسەنگی کیمیایی", pages: "١٤٥ - ١٥٤", desc: "کارلێکی پێچەوانە، دەربڕینی نەگۆڕی هاوسەنگی K." },
            { id: "6-2", title: "کەرتی ٢-٦: لادانی هاوسەنگی", pages: "١٥٥ - ١٦٤", desc: "بنەمای لۆشاتێلیە (خەستی، پەستان، پلەی گەرمی) و کاریگەری ئایۆنی هاوبەش." },
            { id: "6-3", title: "کەرتی ٣-٦: هاوسەنگی لە گیراوەی ترش و تفت و خوێیەکاندا", pages: "١٦٥ - ١٧٣", desc: "نەگۆڕەکانی Ka و Kb، گیراوەی بافەر، و شیکردنەوەی ئاوی خوێیەکان." },
            { id: "6-4", title: "کەرتی ٤-٦: هاوسەنگی تواندنەوە", pages: "١٧٤ - ١٨١", desc: "نەگۆڕی بەرهەمی تواندنەوە Ksp، توانەوەێتی مۆڵاری، و پێشبینیکردنی نیشتوو." }
          ]
        },
        {
          num: 7,
          title: "بەندی ٧: کارلێکەکانی ئۆکسان و لێککردنەوە",
          pages: "١٨٢ - ٢٠١",
          lessons: [
            { id: "7-1", title: "کەرتی ١-٧: ئۆکسان و لێککردنەوە", pages: "١٨٣ - ١٨٩", desc: "ژمارەی ئۆکسان، گواستنەوەی ئەلیکترۆن و پێناسە بنەڕەتییەکان." },
            { id: "7-2", title: "کەرتی ٢-٧: هاوسەنگکردنی هاوکێشەکانی ڕیدۆکس", pages: "١٩٠ - ١٩٥", desc: "ڕێگای نیوەکارلێک لە ناوەندی ترش و ناوەندی تفتدا." },
            { id: "7-3", title: "کەرتی ٣-٧: هۆکارە ئۆکسێن و لێککەرەوەکان", pages: "١٩٦ - ٢٠١", desc: "هۆکاری ئۆکسێن، هۆکاری لێککەرەوە و کارلێکی ناگونجان." }
          ]
        }
      ]
    },
    {
      partIndex: 4,
      partName: "کیمیا-١٢-مەنهەجی ٢٠٢٥ (بەشی ٤)",
      pageStart: 202,
      pageEnd: 261,
      unitTitle: "بەشی چوارەم: کیمیای کارەبایی و کاربۆن و هایدرۆکاربۆنەکان",
      summaryKu: "خانەی ڤۆڵتایی و ئەلیکترۆلیتی، پێکهاتەی گەردیلەی کاربۆن، و ئەلکان، ئەلکین، ئەلکاین و بەنزین.",
      chapters: [
        {
          num: 8,
          title: "بەندی ٨: کیمیای کارەبایی",
          pages: "٢٠٢ - ٢٢٥",
          lessons: [
            { id: "8-1", title: "کەرتی ١-٨: گوزەرێک بۆ کیمیای کارەبایی", pages: "٢٠٣ - ٢٠٦", desc: "خانەی کارۆکیمیایی، ئەنۆد، کاسۆد و پردی خوێ." },
            { id: "8-2", title: "کەرتی ٢-٨: خانە ڤۆڵتاییەکان", pages: "٢٠٧ - ٢١٦", desc: "پۆتەنشیاڵی خانە E°cell، جەمسەری هایدرۆجینی پێوانەیی SHE، و داخوران." },
            { id: "8-3", title: "کەرتی ٣-٨: خانە ئەلیکترۆلیتییەکان", pages: "٢١٧ - ٢٢٥", desc: "شیکردنەوەی کارەبایی، داپۆشینی کارەبایی و بەرهەمهێنانی پیشەسازی." }
          ]
        },
        {
          num: 9,
          title: "بەندی ٩: کاربۆن و هایدرۆکاربۆنەکان",
          pages: "٢٢٦ - ٢٦١",
          lessons: [
            { id: "9-1", title: "کەرتی ١-٩: بوون و گرنگی کاربۆن", pages: "٢٢٧ - ٢٣٢", desc: "شێوە هاوتاکانی کاربۆن (ئەڵماس، گرافیت، فۆلیرین) و دووڕەگبوون." },
            { id: "9-2", title: "کەرتی ٢-٩: ئاوێتە ئەندامییەکان و ئایزۆمەرەکان", pages: "٢٣٣ - ٢٣٩", desc: "ئایزۆمەری پێکهاتەیی و ئەندازەیی cis و trans." },
            { id: "9-3", title: "کەرتی ٣-٩: هایدرۆکاربۆنە تێرەکان (ئەلکانەکان)", pages: "٢٤٠ - ٢٤٩", desc: "زنجیرەی ئەلکانەکان، ناونانی IUPAC، و کۆمەڵەی ئەلکیل." },
            { id: "9-4", title: "کەرتی ٤-٩: هایدرۆکاربۆنە ناتێرەکان", pages: "٢٥٠ - ٢٦١", desc: "ئەلکینەکان CnH2n، ئەلکاینەکان CnH2n-2، و هایدرۆکاربۆنە ئارۆماتییەکان." }
          ]
        }
      ]
    },
    {
      partIndex: 5,
      partName: "کیمیا-١٢-مەنهەجی ٢٠٢٥ (بەشی ٥)",
      pageStart: 262,
      pageEnd: 316,
      unitTitle: "بەشی پێنجەم: ئاوێتە ئەندامییەکانی تر و پاشکۆکان",
      summaryKu: "کۆمەڵە فرمانییەکان (کەحول، ئەلدەهاید، ترشی کاربۆکسیلی، ئەستەر)، کارلێکە ئەندامییەکان، پۆلیمەرەکان، و پاشکۆکان و خشتەی خولی.",
      chapters: [
        {
          num: 10,
          title: "بەندی ١٠: ئاوێتە ئەندامییەکانی تر",
          pages: "٢٦٢ - ٢٩٧",
          lessons: [
            { id: "10-1", title: "کەرتی ١-١٠: کۆمەڵە فرمانییەکان و پۆلەکان", pages: "٢٦٣ - ٢٧٢", desc: "کەحولەکان (R-OH)، هالیدی ئەلکیل (R-X)، و ئیفەرەکان (R-O-R')." },
            { id: "10-2", title: "کەرتی ٢-١٠: پۆلی تری ئاوێتە ئەندامییەکان", pages: "٢٧٣ - ٢٨٢", desc: "ئەلدەهایدەکان، کیتۆنەکان، ترشە کاربۆکسیلییەکان، ئەستەرەکان، و ئەمینەکان." },
            { id: "10-3", title: "کەرتی ٣-١٠: کارلێکە ئەندامییەکان و پۆلیمەرەکان", pages: "٢٨٣ - ٢٩٧", desc: "کارلێکی گۆڕینەوە، خستنەسەر، لێدەرکردن، خەستبوونەوە و پۆلیمەرەکان." }
          ]
        },
        {
          num: 11,
          title: "پاشکۆکان و خشتەی خولیی نوێی ٢٠٢٥",
          pages: "٢٩٨ - ٣١٦",
          lessons: [
            { id: "app-1", title: "پاشکۆی (أ): خشتەی نەگۆڕاوەکانی کیمیا", pages: "٢٩٨ - ٣٠٧", desc: "خشتەی گەرمیی سووتان، توانەوەی گاز، توانەوەی خوێیەکان و گەرمیی پێکهاتن ΔHf°." },
            { id: "pt-1", title: "فەرهەنگ و خشتەی خولیی توخمەکان بە کوردی", pages: "٣٠٨ - ٣١٦", desc: "پێڕستی زاراوەکان و ١١٨ توخمی کیمیایی بە کوردی و ئینگلیزی لە مەنهەجی نوێدا." }
          ]
        }
      ]
    }
  ];

  const activePart = PARTS_METADATA.find((p) => p.partIndex === activePartIndex) || PARTS_METADATA[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-6 text-right">
      {/* Textbook Banner */}
      <div className="bg-gradient-to-l from-blue-700 via-indigo-700 to-sky-600 text-white rounded-2xl p-5 relative overflow-hidden shadow-md">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium mb-2">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>پەڕتووکی فەرمیی کیمیای پۆلی ١٢ی کوردستان (مەنهەجی نوێی ٢٠٢٥)</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold font-sans">
              زانست بۆ هەمووان - کیمیا (مەنهەجی ٢٠٢٥)
            </h3>
            <p className="text-xs md:text-sm text-blue-100 mt-1">
              وەزارەتی پەروەردەی هەرێمی کوردستان • مەنهەجی نوێ • ١٠ بەندی سەرەکی (کۆی گشتی: ٣١٦ لاپەڕە)
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center self-start md:self-auto min-w-[140px]">
            <p className="text-2xl font-black">٣١٦</p>
            <p className="text-[11px] text-blue-100 font-medium">لاپەڕەی کتێبی نوێی ٢٠٢٥</p>
            <div className="mt-1 text-[10px] text-emerald-300 font-bold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>١٠ بەند بە تەواوی</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Textbook Search */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-end gap-1.5">
          <span>گەڕان بەدوای بابەت، هاوکێشە، یان چەمک لەناو تەواوی ٣٧١ لاپەڕەکە:</span>
          <Search className="w-4 h-4 text-blue-500" />
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="نموونە: مۆلاریتی، یاسای هێس، لۆشاتێلیە، Ksp، pH، پۆلیمەر، یاسای ئەنیشتاین..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right dark:text-white"
          />
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-300 absolute right-3.5 top-3 pointer-events-none" />
        </div>

        {/* Live Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-blue-50/50 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 rounded-2xl p-3 space-y-2 mt-2">
            <p className="text-xs font-bold text-blue-900 dark:text-blue-300">
              ئەنجامەکانی گەڕان لە پەڕتووکی فەرمی ({searchResults.length} بەڵگە دۆزرایەوە):
            </p>
            <div className="space-y-2">
              {searchResults.map((ev, i) => (
                <div
                  key={ev.evidenceId || i}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      لاپەڕە {ev.pageNumberStart} - {ev.pageNumberEnd} ({ev.sourcePdfPart || "کیمیا"})
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {ev.chapterTitleKurdish} • {ev.lessonTitleKurdish}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {ev.contentSnippet}
                  </p>
                  <div className="mt-2 flex items-center justify-start gap-2">
                    <button
                      onClick={() => handleStudyClick(
                        `${ev.chapterTitleKurdish} - ${ev.lessonTitleKurdish}`,
                        `لاپەڕە ${ev.pageNumberStart}`,
                        ev.sourcePdfPart || "Grade12_Chemistry_Kurdish.pdf"
                      )}
                      className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>لەم بابەتە لەگەڵ زانا بخوێنە</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5-Part Continuous Navigation Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
            کلیک لەسەر هەر بەشێک بکە بۆ بینینی بەند و کەرت و لاپەڕەکانی
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>٥ بەشە فەرمییەکەی پەڕتووک:</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PARTS_METADATA.map((p) => {
            const isActive = p.partIndex === activePartIndex;
            return (
              <button
                key={p.partIndex}
                onClick={() => setActivePartIndex(p.partIndex)}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]"
                    : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-300"
                  }`}>
                    بەشی {p.partIndex}
                  </span>
                  <BookOpen className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-300"}`} />
                </div>
                <p className={`font-bold text-xs leading-tight ${isActive ? "text-white" : "text-slate-900 dark:text-white dark:text-white"}`}>
                  ل. {p.pageStart} تا {p.pageEnd}
                </p>
                <p className={`text-[10px] mt-1 truncate ${isActive ? "text-blue-100" : "text-slate-500 dark:text-slate-300 dark:text-slate-400"}`}>
                  {p.partName.replace(".pdf", "")}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Part Overview & Chapters */}
      <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-4 space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              فایلی سەرچاوە: {activePart.partName} (لاپەڕە {activePart.pageStart} تا {activePart.pageEnd})
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {activePart.unitTitle}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {activePart.summaryKu}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-lg">
              {activePart.pageEnd - activePart.pageStart + 1} لاپەڕە
            </span>
          </div>
        </div>

        {/* Chapters inside this part */}
        <div className="space-y-3">
          {activePart.chapters.map((ch) => (
            <div
              key={ch.title}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  لاپەڕە {ch.pages}
                </span>
                <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  <span>{ch.title}</span>
                </h5>
              </div>

              {/* Lessons */}
              <div className="space-y-2 border-r-2 border-blue-500 pr-3 mr-1">
                {ch.lessons.map((les) => {
                  const isExpanded = expandedSectionId === les.id;
                  return (
                    <div
                      key={les.id}
                      className="border border-slate-100 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleStudyClick(les.title, les.pages, activePart.partName)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>خوێندن لەگەڵ زانا</span>
                        </button>
                        <button
                          onClick={() => setExpandedSectionId(isExpanded ? null : les.id)}
                          className="text-right flex items-center gap-1.5 cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {les.title}
                            </p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-300">
                              لاپەڕە {les.pages}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300" />
                          )}
                        </button>
                      </div>

                      {isExpanded && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 leading-relaxed">
                          {les.desc}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Formulas & Constants Quick Reference Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-[11px] text-blue-300 font-medium">پارێزراو لە پڕۆگرامی وەزاری</span>
          <h4 className="font-bold text-sm flex items-center gap-1.5 text-white">
            <Atom className="w-4 h-4 text-cyan-400" />
            <span>یاسا و فۆرمۆڵە سەرەکییەکانی کیمیای پۆلی ١٢</span>
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
            <p className="font-bold text-cyan-300">مۆلاریتی و مۆلالیتی</p>
            <p className="font-mono text-[11px] mt-1 text-white">M = n / V(L)</p>
            <p className="font-mono text-[11px] text-white">m = n / kg(solvent)</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
            <p className="font-bold text-cyan-300">ڕەوشە کۆکارییەکان</p>
            <p className="font-mono text-[11px] mt-1 text-white">ΔTf = Kf · m  (-1.86)</p>
            <p className="font-mono text-[11px] text-white">ΔTb = Kb · m  (0.51)</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
            <p className="font-bold text-cyan-300">پێوەری pH و Kw</p>
            <p className="font-mono text-[11px] mt-1 text-white">pH = -log[H3O+]</p>
            <p className="font-mono text-[11px] text-white">Kw = [H3O+][OH-] = 10^-14</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
            <p className="font-bold text-cyan-300">یاسای هێس و گیبس</p>
            <p className="font-mono text-[11px] mt-1 text-white">ΔH° = ΣΔHf°(p) - ΣΔHf°(r)</p>
            <p className="font-mono text-[11px] text-white">ΔG = ΔH - T·ΔS</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
            <p className="font-bold text-cyan-300">خێرایی و هاوسەنگی</p>
            <p className="font-mono text-[11px] mt-1 text-white">R = k[A]^m[B]^n</p>
            <p className="font-mono text-[11px] text-white">K = [C]^c[D]^d / [A]^a[B]^b</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
            <p className="font-bold text-cyan-300">کیمیای کارەبایی و ناوکی</p>
            <p className="font-mono text-[11px] mt-1 text-white">E°cell = E°c - E°a</p>
            <p className="font-mono text-[11px] text-white">E = Δm · c²  (E=mc²)</p>
          </div>
        </div>
      </div>
    </div>
  );
});
