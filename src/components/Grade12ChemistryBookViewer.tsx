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

export const Grade12ChemistryBookViewer: React.FC<Grade12ChemistryBookViewerProps> = ({
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
 const PARTS_METADATA = [
 {
 partIndex: 1,
 partName: "Grade12_Chemistry_Kurdish_Part01.pdf",
 pageStart: 1,
 pageEnd: 89,
 unitTitle: "بەشی یەکەم: گیراوەکان و ڕەفتاریان",
 summaryKu: "بەرگی فەرمی کتێب، پێڕست، گیراوەکان، ئایۆنەکان و ڕەوشە کۆکارییەکان، و بەشێکی ترش و تفتەکان.",
 chapters: [
 {
 num: 1,
 title: "بەندی ١: گیراوەکان",
 pages: "٨ - ٣٧",
 lessons: [
 { id: "1-1", title: "کەرتی ١-١: جۆرەکانی تێکەڵ", pages: "٩ - ١٤", desc: "گیراوەی چوونیەک، ملەکات (colloids و دیاردەی تیندال)، گیرساوە، و ئەلیکترۆلیت." },
 { id: "1-2", title: "کەرتی ٢-١: کردەی تواندنەوە", pages: "١٥ - ٢٥", desc: "توانەوەێتی، گیراوەی تێر، ناتێر، ژوورتێر، یاسای هێنری بۆ توانەوەی گاز و گەرمیی گیراوە." },
 { id: "1-3", title: "کەرتی ٣-١: خەستی گیراوەکان", pages: "٢٦ - ٣٧", desc: "مۆلاریتی (M = mol/L) و مۆلالیتی (m = mol/kg solvent) و شیکاری پرسیاری وەزاری." }
 ]
 },
 {
 num: 2,
 title: "بەندی ٢: ئایۆنەکان لە ئاوەگیراوەکاندا و ڕەوشە کۆکارییەکان",
 pages: "٣٨ - ٦٥",
 lessons: [
 { id: "2-1", title: "کەرتی ١-٢: ئاوێتەکان لە ناو ئاوە گیراوەکاندا", pages: "٣٩ - ٤٩", desc: "لێککەوتنی ئایۆنی، هاوکێشەی ئایۆنی پەتی، ئایۆنی تەماشاکەر و ئایۆنی هایدرۆنیۆم H3O+." },
 { id: "2-2", title: "کەرتی ٢-٢: ڕەوشە کۆکارییەکانی گیراوەکان", pages: "٥٠ - ٦٥", desc: "نزمبوونەوەی پەستانی هەڵم، نزمبوونەوەی پلەی بەستن (ΔTf = Kf·m)، بەرزبوونەوەی کوڵان (ΔTb = Kb·m)، و دەڵاندن." }
 ]
 },
 {
 num: 3,
 title: "بەندی ٣: ترش و تفتەکان (بەشی سەرەتا)",
 pages: "٦٦ - ٨٩",
 lessons: [
 { id: "3-1", title: "کەرتی ١-٣: ڕەوشەکانی ترش و تفتەکان", pages: "٦٧ - ٧٧", desc: "ترشە دووانی و ئۆکسجینییەکان، پێناسەی ئارینیۆس بۆ ترش و تفت لە ئاودا." },
 { id: "3-2", title: "کەرتی ٢-٣: بیردۆزەکانی ترش-تفت", pages: "٧٨ - ٨٢", desc: "برۆنستد-لۆری (بەخشەر و وەرگری پرۆتۆن)، ترشی فرەپرۆتۆنی، و بیردۆزی لویس (جووتە ئەلیکترۆن)." },
 { id: "3-3", title: "کەرتی ٣-٣: کارلێکەکانی ترش-تفت (سەرەتا)", pages: "٨٣ - ٨٩", desc: "جووتی هاوجوت، ماددەی ئەمفۆتێری (دووکارلێک)، کارلێکی هاوتاکردن و ترشە باران." }
 ]
 }
 ]
 },
 {
 partIndex: 2,
 partName: "Grade12_Chemistry_Kurdish_Part02.pdf",
 pageStart: 90,
 pageEnd: 183,
 unitTitle: "بەشی یەکەم و دەستپێکی بەشی دووەم: کارلێککردنە کیمیاییەکان",
 summaryKu: "کۆتایی ترش و تفت، سەنگاندن و pH، کیمیای گەرمی و یاسای هێس، خێرایی کارلێک، و دەستپێکی هاوسەنگی.",
 chapters: [
 {
 num: 3,
 title: "بەندی ٣: پێداچوونەوە و پرسیارەکان",
 pages: "٩٠ - ٩٣",
 lessons: [
 { id: "3-rev", title: "پێداچوونەوەی بەندی ٣", pages: "٩٠ - ٩٣", desc: "پوختەی بەند، زاراوەکان، پرسیاری هەڵبژاردن و ڕاهێنانەکانی کۆتایی بەند." }
 ]
 },
 {
 num: 4,
 title: "بەندی ٤: پێوانەکاری ترش-تفت و pH",
 pages: "٩٤ - ١٢٣",
 lessons: [
 { id: "4-1", title: "کەرتی ١-٤: ئاوە گیراوەکان و چەمکی هایدرۆجینە ڕەنووس", pages: "٩٥ - ١٠٦", desc: "خۆبەخۆ ئایۆنینی ئاو (Kw = 1.0×10^-14)، پێوەری pH و pOH، و پەیوەندی pH + pOH = 14." },
 { id: "4-2", title: "کەرتی ٢-٤: دیاریکردنی هایدرۆجینە ڕەنووس و سەنگاندنەکان", pages: "١٠٧ - ١٢٣", desc: "ناسرەوەکان، پێوانەکاری/تیتراسیۆن، خاڵی هاوتایی، خاڵی کۆتایی، و ئامێری pH پێو." }
 ]
 },
 {
 num: 5,
 title: "بەندی ٥: وزەی کارلێکەکان",
 pages: "١٢٦ - ١٥١",
 lessons: [
 { id: "5-1", title: "کەرتی ١-٥: کیمیای گەرمی", pages: "١٢٧ - ١٤١", desc: "گەرمی جۆری (cp)، ئینتەلپی (ΔH)، کارلێکی گەرمیدەر و گەرمیمژ، یاسای هێس، و گەرمیی پێکهاتن." },
 { id: "5-2", title: "کەرتی ٢-٥: هێزە کارلێک هاندەرەکان", pages: "١٤٢ - ١٥١", desc: "ئینترۆپی (S)، وزەی سەربەستی گیبس (ΔG = ΔH - TΔS)، و مەرجەکانی خۆبەخۆیی کارلێک." }
 ]
 },
 {
 num: 6,
 title: "بەندی ٦: خێرایی کارلێکەکان",
 pages: "١٥٢ - ١٧٥",
 lessons: [
 { id: "6-1", title: "کەرتی ١-٦: کردەی کارلێک", pages: "١٥٣ - ١٥٩", desc: "ڕێڕەوی کارلێک، بیردۆزی پێکدادان، وزەی چالاککردن (Ea)، و ئاڵۆزی چالاککراو." },
 { id: "6-2", title: "کەرتی ٢-٦: خێرایی کارلێککردنی کیمیایی", pages: "١٦٠ - ١٧٥", desc: "یاسای خێرایی (R = k[A]^m[B]^n)، پلەی کارلێک، نەگۆڕی k، و هاندەرەکان." }
 ]
 },
 {
 num: 7,
 title: "بەندی ٧: هاوسەنگی کیمیایی (دەستپێک)",
 pages: "١٧٦ - ١٨٣",
 lessons: [
 { id: "7-1", title: "کەرتی ١-٧: سروشتی هاوسەنگی کیمیایی", pages: "١٧٧ - ١٨٣", desc: "کارلێکی پێچەوانە، باری هاوسەنگی و دەربڕینی نەگۆڕی هاوسەنگی K." }
 ]
 }
 ]
 },
 {
 partIndex: 3,
 partName: "Grade12_Chemistry_Kurdish_Part03.pdf",
 pageStart: 184,
 pageEnd: 275,
 unitTitle: "تەواوکەری بەشی دووەم و دەستپێکی بەشی سێیەم: کیمیای ئەندامی",
 summaryKu: "لادانی هاوسەنگی بە لۆشاتێلیە، بافەر و Ksp، ئۆکسان و لێککردنەوە، کیمیای کارەبایی، و سەرەتای هایدرۆکاربۆنەکان.",
 chapters: [
 {
 num: 7,
 title: "بەندی ٧: بەردەوامی هاوسەنگی کیمیایی",
 pages: "١٨٤ - ٢١٣",
 lessons: [
 { id: "7-2", title: "کەرتی ٢-٧: لادانی هاوسەنگی", pages: "١٨٦ - ١٩٢", desc: "بنەمای لۆشاتێلیە (کاریگەری خەستی، پەستان، پلەی گەرمی) و کاریگەری ئایۆنی هاوبەش." },
 { id: "7-3", title: "کەرتی ٣-٧: هاوسەنگی لە گیراوەی ترش و تفت و خوێیەکاندا", pages: "١٩٣ - ٢٠٠", desc: "نەگۆڕەکانی Ka و Kb، گیراوەی ڕێکخەر (بافەر)، و شیکردنەوەی ئاوی خوێیەکان." },
 { id: "7-4", title: "کەرتی ٤-٧: هاوسەنگی تواندنەوە", pages: "٢٠١ - ٢١٣", desc: "نەگۆڕی بەرهەمی تواندنەوە Ksp، توانەوەێتی مۆڵاری، و پێشبینیکردنی نیشتوو." }
 ]
 },
 {
 num: 8,
 title: "بەندی ٨: کارلێکەکانی ئۆکسان و لێککردنەوە",
 pages: "٢١٤ - ٢٣٣",
 lessons: [
 { id: "8-1", title: "کەرتی ١-٨: ئۆکسان و لێککردنەوە", pages: "٢١٥ - ٢٢٠", desc: "پێناسە، گواستنەوەی ئەلیکترۆن، و ڕێساکانی دۆزینەوەی ژمارەی ئۆکسان." },
 { id: "8-2", title: "کەرتی ٢-٨: هاوسەنگکردنی هاوکێشەکانی ئۆکسان - لێککردنەوە", pages: "٢٢١ - ٢٢٥", desc: "ڕێگای نیوەکارلێک لە ناوەندی ترش و ناوەندی تفتدا." },
 { id: "8-3", title: "کەرتی ٣-٨: هۆکارە ئۆکسێن و هۆکارە لێککەرەوەکان", pages: "٢٢٦ - ٢٣٣", desc: "هۆکاری ئۆکسێن، هۆکاری لێککەرەوە، و کارلێکی ناگونجان (Disproportionation)." }
 ]
 },
 {
 num: 9,
 title: "بەندی ٩: کیمیای کارەبایی",
 pages: "٢٣٤ - ٢٥٥",
 lessons: [
 { id: "9-1", title: "کەرتی ١-٩: گوزەرێک بۆ کیمیای کارەبایی", pages: "٢٣٥ - ٢٣٧", desc: "خانەی کارۆکیمیایی، ئەنۆد، کاسۆد، پردی خوێ و گەیاندنی ئەلیکترۆنی." },
 { id: "9-2", title: "کەرتی ٢-٩: خانە ڤۆڵتاییەکان", pages: "٢٣٨ - ٢٤٦", desc: "خانەی دانیال، پۆتەنشیاڵی پێوانەیی E°cell، جەمسەری SHE، داخوران، و پاترییەکان." },
 { id: "9-3", title: "کەرتی ٣-٩: خانە ئەلیکترۆلیتییەکان", pages: "٢٤٧ - ٢٥٥", desc: "شیکردنەوەی کارەبایی ئاو، داپۆشینی کارەبایی، و بەرهەمهێنانی ئەلەمنیۆم (هۆڵ-هیرۆڵت)." }
 ]
 },
 {
 num: 10,
 title: "بەندی ١٠: کاربۆن و هایدرۆکاربۆنەکان (سەرەتا)",
 pages: "٢٥٨ - ٢٧٥",
 lessons: [
 { id: "10-1", title: "کەرتی ١-١٠: بوون و گرنگی کاربۆن", pages: "٢٥٩ - ٢٦٢", desc: "دووڕەگبوونی sp3, sp2, sp و شێوە هاوتاکانی کاربۆن (ئەڵماس، گرافیت، فۆلیرین)." },
 { id: "10-2", title: "کەرتی ٢-١٠: ئاوێتە ئەندامییەکان", pages: "٢٦٣ - ٢٦٧", desc: "بەستنەوەی زنجیرەیی، ئایزۆمەری پێکهاتەیی، و ئایزۆمەری ئەندازەیی cis و trans." },
 { id: "10-3", title: "کەرتی ٣-١٠: هایدرۆکاربۆنە تێرەکان (ئەلکانەکان)", pages: "٢٦٨ - ٢٧٥", desc: "شێوگی گشتی CnH2n+2، زنجیرەی ئەلکانەکان، ناونانی فەرمی IUPAC، و کۆمەڵەی ئەلکیل." }
 ]
 }
 ]
 },
 {
 partIndex: 4,
 partName: "Grade12_Chemistry_Kurdish_Part04.pdf",
 pageStart: 276,
 pageEnd: 367,
 unitTitle: "بەشی سێیەم: کیمیای ئەندامی و ناوکی و پاشکۆکان",
 summaryKu: "هایدرۆکاربۆنی ناتێر (ئەلکین، ئەلکاین، بەنزین)، کۆمەڵە فرمانییەکان، پۆلیمەرەکان، کیمیای ناوکی، پاشکۆی ئەگۆڕاوەکان و فەرهەنگ.",
 chapters: [
 {
 num: 10,
 title: "بەندی ١٠: هایدرۆکاربۆنە ناتێرەکان",
 pages: "٢٧٦ - ٢٩٣",
 lessons: [
 { id: "10-4", title: "کەرتی ٤-١٠: هایدرۆکاربۆنە ناتێرەکان", pages: "٢٧٩ - ٢٩٣", desc: "ئەلکینەکان CnH2n، ئەلکاینەکان CnH2n-2، هایدرۆکاربۆنە ئارۆماتییەکان (ئەڵقەی بەنزین C6H6)." }
 ]
 },
 {
 num: 11,
 title: "بەندی ١١: ئاوێتەی ئەندامی تر",
 pages: "٢٩٤ - ٣٢٩",
 lessons: [
 { id: "11-1", title: "کەرتی ١-١١: کۆمەڵە فرمانییەکان و پۆلەکان", pages: "٢٩٥ - ٣٠٣", desc: "کەحولەکان (R-OH)، هالیدی ئەلکیل (R-X)، و ئیفەرەکان (R-O-R')." },
 { id: "11-2", title: "کەرتی ٢-١١: پۆلی تری ئاوێتە ئەندامییەکان", pages: "٣٠٤ - ٣١٢", desc: "ئەلدەهایدەکان (R-CHO)، کیتۆنەکان (R-CO-R')، ترشە کاربۆکسیلییەکان، ئەستەرەکان، و ئەمینەکان." },
 { id: "11-3", title: "کەرتی ٣-١١: کارلێکە ئەندامییەکان", pages: "٣١٣ - ٣١٥", desc: "کارلێکی گۆڕینەوە، خستنەسەر، لێدەرکردن، و خەستبوونەوە (Condensation)." },
 { id: "11-4", title: "کەرتی ٤-١١: پۆلیمەرەکان", pages: "٣١٦ - ٣٢٩", desc: "مۆنۆمەر، پۆلیمەری خستنەسەر (پۆلی ئیسیڵین، PVC، تێفلۆن)، پۆلیمەری خەستبوونەوە (نایلۆن 6-6)، و لاستیك." }
 ]
 },
 {
 num: 12,
 title: "بەندی ١٢: کیمیای ناوکی",
 pages: "٣٣٠ - ٣٥٤",
 lessons: [
 { id: "12-1", title: "کەرتی ١-١٢: ناووک", pages: "٣٣١ - ٣٣٤", desc: "نیوکلیۆنەکان، کەمی بارستە (Δm)، وزەی بەستنەوەی ناووک (E = mc^2)، و ژمارە جادووییەکان." },
 { id: "12-2", title: "کەرتی ٢-١٢: تیشکە لێکەهەڵوەشان", pages: "٣٣٥ - ٣٤٢", desc: "تیشکی ئەلفا، بێتا، گاما، پۆزیترۆن، و یاسای نیوەتەمەن (Half-life)." },
 { id: "12-3", title: "کەرتی ٣-١٢: ناووکە تیشکدانەوە", pages: "٣٤٣ - ٣٤٦", desc: "توانای سمین، دیاریکردنی تەمەن بە کاربۆن-14، بەکارهێنانی پزیشکی و بژمێری گایگەر." },
 { id: "12-4", title: "کەرتی ٤-١٢: ناووکە کەرتبوون و ناووکە یەکگرتن", pages: "٣٤٧ - ٣٥٤", desc: "کەرتبوونی یۆرانیۆم-235، کارلێکی زنجیرەیی، بارستەی شڵۆق، کورەی ناوکی، و وزەی خۆر." }
 ]
 },
 {
 num: 13,
 title: "پاشکۆکان و فەرهەنگی زاراوەکان",
 pages: "٣٥٥ - ٣٦٧",
 lessons: [
 { id: "app-1", title: "پاشکۆی (أ): خشتەی نەگۆڕاوەکانی کیمیا", pages: "٣٥٥ - ٣٥٨", desc: "خشتەی گەرمیی سووتان، توانەوەی گاز، توانەوەی خوێیەکان و گەرمیی پێکهاتن ΔHf°." },
 { id: "gloss-1", title: "فەرهەنگی چەمک و زاراوەکان (ئەلف تا شین)", pages: "٣٥٩ - ٣٦٧", desc: "پێناسەی فەرمیی زاراوە کیمیاییەکان لەسەر بنەمای پەڕتووکی وەزاری." }
 ]
 }
 ]
 },
 {
 partIndex: 5,
 partName: "Grade12_Chemistry_Kurdish_Part05.pdf",
 pageStart: 368,
 pageEnd: 371,
 unitTitle: "کۆتایی فەرهەنگ و خشتەی خولیی توخمە کیمیاییەکان",
 summaryKu: "تەواوکەری زاراوەکان و خشتەی خولیی مۆدێرنی توخمەکان بە زمانی کوردی سۆرانی.",
 chapters: [
 {
 num: 13,
 title: "کۆتایی فەرهەنگی زاراوەکان",
 pages: "٣٦٨",
 lessons: [
 { id: "gloss-2", title: "زاراوەکانی پیتەکانی (ع تا ی)", pages: "٣٦٨", desc: "پێناسەی زاراوەکانی وەزەی چالاککردن، وزەی سەربەست، یاسای خێرایی، یاسای هێس، هێڵکاری و هتد." }
 ]
 },
 {
 num: 14,
 title: "خشتەی خولیی توخمەکان (Periodic Table)",
 pages: "٣٦٩ - ٣٧١",
 lessons: [
 { id: "pt-1", title: "خشتەی خولیی توخمەکان بە کوردی", pages: "٣٦٩ - ٣٧١", desc: "١١٨ توخمی کیمیایی بە ژمارەی گەردیلەیی، بارستەی گەردیلەیی، ناوی کوردی و ئینگلیزی و ڕیزبوونی ئەلیکترۆنی." }
 ]
 }
 ]
 }
 ];

 const activePart = PARTS_METADATA.find((p) => p.partIndex === activePartIndex) || PARTS_METADATA[0];

 return (
 <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-6 text-right">
 {/* Textbook Banner */}
 <div className="bg-gradient-to-l from-blue-700 via-indigo-700 to-sky-600 text-white rounded-2xl p-5 relative overflow-hidden shadow-md">
 <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium mb-2">
 <FlaskConical className="w-3.5 h-3.5" />
 <span>پەڕتووکی فەرمیی کیمیای پۆلی ١٢ی کوردستان (وەزاری)</span>
 </div>
 <h3 className="text-xl md:text-2xl font-bold font-sans">
 زانست بۆ هەمووان - کیمیا (کتێبی خوێندکار)
 </h3>
 <p className="text-xs md:text-sm text-blue-100 mt-1">
 وەزارەتی پەروەردە • چاپی شەشەم • یەک یەکەی پەڕتووک لە ٥ فایلی PDF (کۆی گشتی: ٣٧١ لاپەڕە)
 </p>
 </div>

 <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center self-start md:self-auto min-w-[140px]">
 <p className="text-2xl font-black">٣٧١</p>
 <p className="text-[11px] text-blue-100 font-medium">لاپەڕەی تەواوی کتێب</p>
 <div className="mt-1 text-[10px] text-emerald-300 font-bold flex items-center justify-center gap-1">
 <CheckCircle2 className="w-3 h-3" />
 <span>پڕۆسێسکراو بە OCR</span>
 </div>
 </div>
 </div>
 </div>

 {/* Real-time Textbook Search */}
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-700 flex items-center justify-end gap-1.5">
 <span>گەڕان بەدوای بابەت، هاوکێشە، یان چەمک لەناو تەواوی ٣٧١ لاپەڕەکە:</span>
 <Search className="w-4 h-4 text-blue-500" />
 </label>
 <div className="relative">
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => handleSearch(e.target.value)}
 placeholder="نموونە: مۆلاریتی، یاسای هێس، لۆشاتێلیە، Ksp، pH، پۆلیمەر، یاسای ئەنیشتاین..."
 className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
 />
 <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
 </div>

 {/* Live Search Results */}
 {searchResults.length > 0 && (
 <div className="bg-blue-50/50/80 border border-blue-200 rounded-2xl p-3 space-y-2 mt-2">
 <p className="text-xs font-bold text-blue-900">
 ئەنجامەکانی گەڕان لە پەڕتووکی فەرمی ({searchResults.length} بەڵگە دۆزرایەوە):
 </p>
 <div className="space-y-2">
 {searchResults.map((ev, i) => (
 <div
 key={ev.evidenceId || i}
 className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs"
 >
 <div className="flex items-center justify-between text-xs mb-1">
 <span className="font-bold text-blue-600">
 لاپەڕە {ev.pageNumberStart} - {ev.pageNumberEnd} ({ev.sourcePdfPart || "کیمیا"})
 </span>
 <span className="font-bold text-slate-800">
 {ev.chapterTitleKurdish} • {ev.lessonTitleKurdish}
 </span>
 </div>
 <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
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
 <span className="text-[11px] text-slate-500 font-medium">
 کلیک لەسەر هەر بەشێک بکە بۆ بینینی بەند و کەرت و لاپەڕەکانی
 </span>
 <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
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
 : "bg-slate-50/60 text-slate-700 border-slate-200 hover:bg-slate-100"
 }`}
 >
 <div className="flex items-center justify-between w-full mb-1">
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
 isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
 }`}>
 بەشی {p.partIndex}
 </span>
 <BookOpen className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
 </div>
 <p className={`font-bold text-xs leading-tight ${isActive ? "text-white" : "text-slate-900"}`}>
 ل. {p.pageStart} تا {p.pageEnd}
 </p>
 <p className={`text-[10px] mt-1 truncate ${isActive ? "text-blue-100" : "text-slate-500"}`}>
 {p.partName.replace(".pdf", "")}
 </p>
 </button>
 );
 })}
 </div>
 </div>

 {/* Active Part Overview & Chapters */}
 <div className="border border-slate-200 bg-slate-50/50/30 rounded-2xl p-4 space-y-4">
 <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <div>
 <span className="text-[11px] font-bold text-blue-600">
 فایلی سەرچاوە: {activePart.partName} (لاپەڕە {activePart.pageStart} تا {activePart.pageEnd})
 </span>
 <h4 className="text-base font-bold text-slate-900 mt-0.5">
 {activePart.unitTitle}
 </h4>
 <p className="text-xs text-slate-500 mt-1">
 {activePart.summaryKu}
 </p>
 </div>

 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100/40 text-blue-800 rounded-lg">
 {activePart.pageEnd - activePart.pageStart + 1} لاپەڕە
 </span>
 </div>
 </div>

 {/* Chapters inside this part */}
 <div className="space-y-3">
 {activePart.chapters.map((ch) => (
 <div
 key={ch.title}
 className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
 >
 <div className="flex items-center justify-between">
 <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
 لاپەڕە {ch.pages}
 </span>
 <h5 className="font-bold text-sm text-slate-900 flex items-center gap-2">
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
 className="border border-slate-100 rounded-lg p-2.5 bg-slate-50/40/40 hover:bg-slate-100/60 transition-colors"
 >
 <div className="flex items-center justify-between gap-2">
 <button
 onClick={() => handleStudyClick(les.title, les.pages, activePart.partName)}
 className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
 >
 <Sparkles className="w-3 h-3" />
 <span>خوێندن لەگەڵ زانا</span>
 </button>
 <button
 onClick={() => setExpandedSectionId(isExpanded ? null : les.id)}
 className="text-right flex items-center gap-1.5 cursor-pointer"
 >
 <div>
 <p className="text-xs font-bold text-slate-800">
 {les.title}
 </p>
 <span className="text-[10px] text-slate-400">
 لاپەڕە {les.pages}
 </span>
 </div>
 {isExpanded ? (
 <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
 ) : (
 <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
 )}
 </button>
 </div>

 {isExpanded && (
 <p className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-200/60/60 leading-relaxed">
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
 <p className="font-mono text-[11px] mt-1 text-white">ΔTf = Kf · m (-1.86)</p>
 <p className="font-mono text-[11px] text-white">ΔTb = Kb · m (0.51)</p>
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
 <p className="font-mono text-[11px] text-white">E = Δm · c² (E=mc²)</p>
 </div>
 </div>
 </div>
 </div>
 );
};
