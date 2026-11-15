import React, { useState } from "react";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Layers,
  FileText
} from "lucide-react";

interface Grade12ArabicBookViewerProps {
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
  grammarRule?: string;
}

interface BookUnit {
  unitIndex: number;
  partNumber: 1 | 2;
  title: string;
  subtitle: string;
  pages: string;
  iconColor: string;
  description: string;
  lessons: ChapterLesson[];
}

export const Grade12ArabicBookViewer: React.FC<Grade12ArabicBookViewerProps> = React.memo(({
  onSelectTopicForStudy,
  onNavigateToChat,
}) => {
  const [activeUnitIndex, setActiveUnitIndex] = useState<number>(1);
  const [selectedPartFilter, setSelectedPartFilter] = useState<"all" | 1 | 2>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>("ar-1-1");

  const UNITS_METADATA: BookUnit[] = [
    // PART 1 (الجزء الأول)
    {
      unitIndex: 1,
      partNumber: 1,
      title: "الوحدة الأولى: الرومنسية في الأدب العربي",
      subtitle: "نشيد الحرية (شيلي)، المساء (إيليا أبو ماضي)، المفعول لأجله، الاستثناء",
      pages: "٧ - ٢٦ (بەشی ١)",
      iconColor: "text-emerald-400 bg-emerald-950/60 border-emerald-700/50",
      description: "تایبەتمەندییەکانی ڕێبازی ڕومانتیکی لە ئەدەبی عەرەبیدا؛ هەست و سۆز و سروشت؛ هاوکات لەگەڵ یاساکانی ڕێزمانی المفعول لأجله و الاستثناء بـ (إلا، غير، سوى).",
      lessons: [
        {
          id: "ar-1-1",
          title: "النص الأدبي: نشيد الحرية للشاعر بيرسي بيش شيلي",
          page: "٨ - ١٢",
          part: 1,
          summary: "سروودی ئازادی و چەمکی شۆڕشگێڕی لە ئەدەبی ڕومانتیکی جیهانی و وەرگێڕانی بۆ عەرەبی.",
          keyPoints: ["خەسڵەتە سەرەکییەکانی شیعری ڕۆمانسی", "وێنەی هونەری و ئازادی مرۆڤ", "وشەسازی و شیكاری دەق بۆ تاقیکردنەوەی وزاری"]
        },
        {
          id: "ar-1-2",
          title: "النص الأدبي: قصيدة (المساء) لإيليا أبو ماضي",
          page: "١٣ - ١٦",
          part: 1,
          summary: "شاکاری شیعری کۆچبەران (شعر المهجر) و تێڕوانینی فەلسەفی بۆ ژیان و سروشت لە کاتی ئاوابوونی خۆردا.",
          keyPoints: ["کۆمەڵەی ئەدەبی (الرابطة القلمية)", "دیالۆگی شاعیر لەگەڵ نەفسی خۆیدا", "شیکاری مۆسیقای شیعر و کێشە عەرووزییەکان"]
        },
        {
          id: "ar-1-3",
          title: "قواعد اللغة: المفعول لأجله",
          page: "١٧ - ٢٠",
          part: 1,
          summary: "ناسینەوەی المفعول لأجله (مصدراً قلبياً يُذكر لبيان سبب حدوث الفعل) و مەرجەکانی دانانی بە مەنسووبی.",
          keyPoints: ["مەرجەکانی مصدری دڵ (قلبي)", "هاوبەشی لە کات و بکەردا لەگەڵ کردار", "نموونەی ئیعراب لە دەقی قورئانی و شیعردا"],
          grammarRule: "المفعول لأجله: مصدر قلبي منصوب يُذكر لبيان علّة وقوع الفعل، نحو: (وقفتُ احتراماً للمعلّمِ)."
        },
        {
          id: "ar-1-4",
          title: "قواعد اللغة: أسلوب الاستثناء بـ (إلا، غير، سوى)",
          page: "٢١ - ٢٦",
          part: 1,
          summary: "جۆرەکانی ڕستەی ئیستسناء: التام المثبت، التام المنفي، والمفرّغ؛ ئیعرابی مستثنى و حوکمەکانی (غير و سوى).",
          keyPoints: ["المستثنى بـ (إلا) لە ڕستەی تەواو و کەمدا", "ئیعرابی (غير و سوى) و مضاف إليه ی پاش ئەوان", "ئیعرابی حەسب الموقّع لە الاستثناء المفرغدا"],
          grammarRule: "الاستثناء التام المثبت: يجب نصب المستثنى. الاستثناء المفرغ: يُعرب المستثنى حسب موقعه من الجملة بعد حذف النفي وإلا."
        }
      ]
    },
    {
      unitIndex: 2,
      partNumber: 1,
      title: "الوحدة الثانية: الواقعية في الأدب العربي",
      subtitle: "الأدب الواقعي، التمييز (الذات والنسبة)، أسلوب التعجب، التشبيه وأركانه",
      pages: "٢٧ - ٤٨ (بەشی ١)",
      iconColor: "text-cyan-400 bg-cyan-950/60 border-cyan-700/50",
      description: "ڕێبازی ڕیالیزم و نووسین لەسەر ژیانی ڕاستەقینەی کۆمەڵگە، بە یاساکانی تەمییز و تەعەجوب و تەشبیهی بەلاغی.",
      lessons: [
        {
          id: "ar-2-1",
          title: "النص الأدبي: الأدب الواقعي وخصائصه في المجتمع",
          page: "٢٨ - ٣٤",
          part: 1,
          summary: "چۆنیەتی ڕەنگدانەوەی کێشە کۆمەڵایەتی و ئابوورییەکان لە ئەدەبی هاوچەرخی عەرەبیدا.",
          keyPoints: ["جیاوازی ڕیالیزم و ڕۆمانسیزم", "شیکردنەوەی چیڕۆک و پەخشانی واقعیی", "پرسیارە گرنگەکانی وزاری"]
        },
        {
          id: "ar-2-2",
          title: "قواعد اللغة: التمييز (تمييز الذات والنسبة)",
          page: "٣٥ - ٤٠",
          part: 1,
          summary: "ناسینەوەی جۆرەکانی تەمییز: تمييز الملفوظ (المساحة، الوزن، الكيل، العدد) و تمييز الملحوظ (النسبة).",
          keyPoints: ["تمييز الذات دوای ژمارە و پێوەرەکان", "تمييز النسبة کاتێک گۆڕاوە لە بکەر یان بەرکار", "ئیعرابی تەمییز هەمیشە بە نەسب دەبێت"],
          grammarRule: "التمييز: اسم نكرة منصوب يُزيل الإبهام والغموض عن كلمة أو جملة قبله."
        },
        {
          id: "ar-2-3",
          title: "قواعد اللغة: أسلوب التعجب (القياسي والسماعي)",
          page: "٤١ - ٤٤",
          part: 1,
          summary: "دوو داڕشتەی پێوانەیی سەرەکی (مَا أَفْعَلَهُ و أَفْعِلْ بِهِ) و مەرجەکانی ئەو کردارەی ڕاستەوخۆ دەگۆڕدرێت.",
          keyPoints: ["داڕشتەی (ما أفعلَ + المفعول به)", "داڕشتەی (أفعِلْ بـ + الفاعل)", "شێوازی ناڕاستەوخۆ بە المصدر الصريح والمؤول"],
          grammarRule: "صيغتا التعجب القياسيتان: (ما أفعلَه!) نحو: ما أجملَ الطبيعةَ! و(أفْعِلْ به!) نحو: أجْمِلْ بالطبيعةِ!"
        },
        {
          id: "ar-2-4",
          title: "البلاغة: التشبيه وأركانه (المشبه والمشبه به والأداة ووجه الشبه)",
          page: "٤٥ - ٤٨",
          part: 1,
          summary: "پێکهاتە بنەڕەتییەکانی لێکچوواندنی بەلاغی و جۆرەکانی: المرسل، المؤكد، المجمل، والمفصّل، والتشبيه البليغ.",
          keyPoints: ["چوار ڕەگەزی بنەڕەتی تەشبیهـ", "التشبيه البليغ (لابردنی ئامراز و ڕووی لێکچوون)", "کاریگەری جوانی لە ڕستە و دەقەکاندا"]
        }
      ]
    },
    {
      unitIndex: 3,
      partNumber: 1,
      title: "الوحدة الثالثة: الأدب الأندلسي وشعر الموشحات",
      subtitle: "موشحة لسان الدين بن الخطيب، الحال وأنواعه، الاستعارة التصريحية والمكنية",
      pages: "٤٩ - ٧٤ (بەشی ١)",
      iconColor: "text-amber-400 bg-amber-950/60 border-amber-700/50",
      description: "گوڵبژێری ئەدەبی ئەندەلوس و داهێنانی موشەححات؛ یاساکانی حاڵ لە ڕستەدا و جیاکردنەوەی ئیستعارات لە ڕەوانبێژیدا.",
      lessons: [
        {
          id: "ar-3-1",
          title: "النص الأدبي: موشحة (جادك الغيث) للسان الدين بن الخطيب",
          page: "٥٠ - ٥٦",
          part: 1,
          summary: "ناساندنی شێوازی موشەح (الأقفال، الأبيات، الخرجة) و یادکردنەوەی سەردەمی زێڕینی غەرناتە و ئەندەلوس.",
          keyPoints: ["پێکهاتەی فۆڕمی موشەح", "هۆنراوەی جادك الغيث إذا الغيث هما", "شیکاری مۆسیقی و زمانیی"]
        },
        {
          id: "ar-3-2",
          title: "قواعد اللغة: الحال (المفردة والجملة وشبه الجملة)",
          page: "٥٧ - ٦٤",
          part: 1,
          summary: "ناسینی حاڵ (اسم نكرة مشتق منصوب يبين هيئة صاحب الحال وقت حدوث الفعل) و جۆرەکانی.",
          keyPoints: ["حاڵی تاک (مفردة)", "حاڵی ڕستەی ناوی یان کرداری بە (واو الحال)", "یاسای (الجمل بعد النكرات صفات وبعد المعارف أحوال)"],
          grammarRule: "الحال: وصف نكرة منصوب مبيّن لهيئة صاحب الحال المعرفة، والجمل بعد المعارف أحوال."
        },
        {
          id: "ar-3-3",
          title: "البلاغة والنقد: الاستعارة (التصريحية والمكنية)",
          page: "٦٥ - ٧٤",
          part: 1,
          summary: "خواستن لە ڕەوانبێژیدا وەک لێکچوواندنێک کە یەکێک لە دوو لایەنە بنەڕەتییەکەی (المشبه یان المشبه به) سڕابێتەوە.",
          keyPoints: ["الاستعارة التصريحية (دەربڕینی المشبه به ڕاستەوخۆ)", "الاستعارة المكنية (سڕینەوەی المشبه به و بەجێهێشتنی نیشانەیەک)", "تێگەیشتنی خێرا بۆ تاقیکردنەوەی وەزاری"]
        }
      ]
    },

    // PART 2 (الجزء الثاني)
    {
      unitIndex: 4,
      partNumber: 2,
      title: "الوحدة الرابعة: عصر صدر الإسلام والعصر الأموي",
      subtitle: "كعب بن زهير (بانت سعاد)، أسلوب المدح والذم (نِعْمَ وبئْسَ)، الكناية",
      pages: "٧ - ٢٠ (بەشی ٢)",
      iconColor: "text-blue-400 bg-blue-950/60 border-blue-700/50",
      description: "قۆناغی سەرەتای هاتنی ئیسلام و سەردەمی ئومەوی؛ قەسیدەی بەناوبانگی پۆزشخوازیی کەعب بن زوهەیر لە بەردەم پێغەمبەر (د.خ) و ڕێزمانی مەدح و زەم.",
      lessons: [
        {
          id: "ar-4-1",
          title: "النص الأدبي: مدح الرسول للمهاجرين والأنصار - كعب بن زهير",
          page: "٨ - ١٣",
          part: 2,
          summary: "شیکردنەوەی قەسیدەی البردة (بانت سعاد) و پیاهەڵدانی کۆچبەران و هاوەڵان بە شێوازێکی بێوێنە.",
          keyPoints: ["هۆکاری وتنی قەسیدەکە و پۆزش هێنانەوە", "دەستەواژەی (إنّ الرسولَ لسيفٌ يُستضاءُ به)", "بەها مرۆیی و ئایینییەکانی دەقەکە"]
        },
        {
          id: "ar-4-2",
          title: "قواعد اللغة: أسلوب المدح والذم (نِعْمَ، بِئْسَ، حبّذا، لا حبّذا)",
          page: "١٤ - ١٧",
          part: 2,
          summary: "ڕەگەزەکانی ڕستەی مەدح و زەم: الفعل، الفاعل، والمخصوص بالمدح أو الذم، و شێوازەکانی ئیعراب.",
          keyPoints: ["شێوەکانی فاعیلی نِعْمَ و بئْسَ (المعرف بأل، المضاف، الضمير المستتر المفسر بنكرة)", "حبّذا و لا حبّذا (ذا فاعل لە هەموو حاڵەتێکدا)", "ئیعرابی المخصوص وەک مبتدأ مؤخر"],
          grammarRule: "أركان أسلوب المدح والذم: فعل المدح/الذم + الفاعل + المخصوص بالمدح أو الذم."
        },
        {
          id: "ar-4-3",
          title: "البلاغة: الكناية وأنواعها (كناية عن صفة، موصوف، نسبة)",
          page: "١٨ - ٢٠",
          part: 2,
          summary: "دەربڕینی مانایەک بە ووشەیەک بەبێ ناوهێنانی ڕاستەوخۆ؛ بەهای کینایە لە دەوڵەمەندکردنی زمانی دەربڕیندا.",
          keyPoints: ["کینایە لە سیفەت (نحو: فلانٌ كثيرُ الرّمادِ دلالة على الكرم)", "کینایە لە مووسووف (نحو: لغة الضاد دلالة على اللغة العربية)", "کینایە لە نیسبەت و پەیوەندی"]
        }
      ]
    },
    {
      unitIndex: 5,
      partNumber: 2,
      title: "الوحدة الخامسة: العصور الأدبية - العصر العباسي",
      subtitle: "شعر الزهد لأبي العتاهية، أسلوب التوكيد (اللفظي والمعنوي)، الطباق والمقابلة",
      pages: "٢١ - ٣٠ (بەشی ٢)",
      iconColor: "text-purple-400 bg-purple-950/60 border-purple-700/50",
      description: "گەشەسەندنی ڕۆشنبیری و زانست لە بەغدا لە سەردەمی عەبباسیدا؛ شیعری زوهد و دڵپاکی ئەبولعەتاهیە؛ یاساکانی تۆکید و موحەسسەناتی بەدیعی.",
      lessons: [
        {
          id: "ar-5-1",
          title: "النص الأدبي: شعر الزهد والحكمة لأبي العتاهية",
          page: "٢٢ - ٢٤",
          part: 2,
          summary: "ئامۆژگاری و وەبیرهێنانەوەی کۆتایی تەمەن و پووچەڵیی دونیا لە شیعری زوهدی عەبباسیدا بە زمانێکی سادە و ڕوون.",
          keyPoints: ["پەیامی ئەدەبی زوهد لە بەرامبەر ڕابواردنی سەردەم", "تایبەتمەندی شیعری ئەبولعەتاهیە", "وشەسازی و شرۆڤەی ڕستەکان"]
        },
        {
          id: "ar-5-2",
          title: "قواعد اللغة: أسلوب التوكيد (اللفظي والمعنوي وبنوني التوكيد)",
          page: "٢٥ - ٢٨",
          part: 2,
          summary: "پتەوکردنی واتا لە زەینی بیسەردا: التوكيد اللفظي (دووبارەکردنەوەی وشە) و المعنوي (نفس، عين، كل، جميع، كلا، كلتا).",
          keyPoints: ["مەرجەکانی ئەلفازی تۆکیدی مەعنەوی (بەستنەوە بە زەمیر)", "حوکمی كلا و كلتا لەگەڵ ناو و جێناوەکان", "تۆکیدی کردار بە نونی سووک و قورس (نوني التوكيد)"],
          grammarRule: "التوكيد المعنوي يكون بألفاظ مخصوصة: (نفس، عين، كلّ، جميع، كلا، كلتا) بشرط اتصالها بضمير يعود على المؤكّد."
        },
        {
          id: "ar-5-3",
          title: "البلاغة: الطباق والمقابلة والجناس",
          page: "٢٩ - ٣٠",
          part: 2,
          summary: "جوانکارییە مۆسیقی و واتاییەکان لە ئەدەب: تیباق (ئیجاب و سەلەب)، موقابەلە (ڕووبەڕووبوونەوەی دوو واتا یان زیاتر)، و جیناس.",
          keyPoints: ["جیاوازی الطباق والمقابلة", "الجناس التام والناقص", "کاریگەری لە سەرنجڕاکێشانی خوێنەردا"]
        }
      ]
    },
    {
      unitIndex: 6,
      partNumber: 2,
      title: "الوحدة السادسة: الشعر العربي الحديث ونماذج مختارة",
      subtitle: "شعر التفعيلة (بدر شاكر السياب ونازك الملائكة)، أحكام العدد والمراجعة الوزارية",
      pages: "٣١ - ٣٨ (بەشی ٢)",
      iconColor: "text-rose-400 bg-rose-950/60 border-rose-700/50",
      description: "شۆڕشی نوێکاری لە شیعری ئازاد و کێشی تەفعیلە لە عێراق و جیهانی عەرەبی؛ یاساکانی گرنگی ژمارە (العدد) و ئامادەکاری کۆتایی وزاری.",
      lessons: [
        {
          id: "ar-6-1",
          title: "النص الأدبي: نشأة شعر التفعيلة والرواد (السياب ونازك)",
          page: "٣٢ - ٣٤",
          part: 2,
          summary: "شکاندنی شێوازی کلاسیكی دوو نیوەدێڕی و سەرهەڵدانی شیعری تەفعیلە لە بەسڕە و بەغدا (أنشودة المطر، الكوليرا).",
          keyPoints: ["تایبەتمەندییەکانی شیعری نوێ و تەفعیلە", "سیمبولی باران لە شیعری سیاب", "تێکەڵبوونی پەژارەی نیشتمانی لەگەڵ هونەردا"]
        },
        {
          id: "ar-6-2",
          title: "قواعد اللغة: أحكام العدد (تذكير وتأنيث، إعراب وتمييز)",
          page: "٣٥ - ٣٧",
          part: 2,
          summary: "یاساکانی ئاڵۆزی ژمارە لە زمانی عەرەبیدا: (١-٢) هاوتا، (٣-٩) پێچەوانە، (١١-١٩) لێکدراو، و ئەلفازی عوقوود (٢٠-٩٠).",
          keyPoints: ["یاسای پێچەوانەبوونی ژمارە (٣-٩) لەگەڵ ژمێردراو (المعدود)", "ژمارە (١١ و ١٢) بە هەردوو بەشەکەیان هاوتان", "تەمییزی ژمارە: تاک و کۆ، مەنسووب و مەجروور"],
          grammarRule: "الأعداد (3 - 9) تخالف المعدود تذكيراً وتأنيثاً، وتمييزها جمع مجرور بالإضافة."
        },
        {
          id: "ar-6-3",
          title: "المراجعة الوزارية الشاملة والنماذج الامتحانية",
          page: "٣٨",
          part: 2,
          summary: "کورتەی هەموو یاساکان و پرسیارە دووبارەبووەوەکانی تاقیکردنەوەی وزاری پۆلی ١٢ لەسەر هەردوو بەشەکە.",
          keyPoints: ["خشتەی پوختەی ئیعرابە باوەکان", "تێبینییە زێڕینەکانی نمرەی ١٠٠", "ڕێنمایی کاتی تاقیکردنەوە"]
        }
      ]
    }
  ];

  // Filter units according to Part 1 or Part 2
  const filteredUnits = UNITS_METADATA.filter((u) => {
    if (selectedPartFilter !== "all" && u.partNumber !== selectedPartFilter) {
      return false;
    }
    return true;
  });

  const activeUnit = UNITS_METADATA.find((u) => u.unitIndex === activeUnitIndex) || UNITS_METADATA[0];

  // Search logic across all lessons
  const searchResults = searchQuery.trim()
    ? UNITS_METADATA.flatMap((u) =>
        u.lessons
          .filter(
            (l) =>
              l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              l.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (l.grammarRule && l.grammarRule.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (l.keyPoints && l.keyPoints.some((kp) => kp.toLowerCase().includes(searchQuery.toLowerCase())))
          )
          .map((l) => ({ ...l, unitTitle: u.title, unitIndex: u.unitIndex, partNumber: u.partNumber }))
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
              پۆلی دوازدەهەم (بەشی وێژەیی و زانستی)
            </span>
          </div>
          <h2 className="font-sans font-black text-xl sm:text-2xl text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            <span>پەڕتووکی زمانی عەرەبی (بەشی ١ و ٢)</span>
          </h2>
          <p className="text-xs text-slate-300 font-sans">
            ٦ یەکەی فەرمی (١١٢ لاپەڕە): ئەدەب، ڕێزمان، دەقی شیعری، ڕەوانبێژی، و پێداچوونەوەی وزاری
          </p>
        </div>

        {/* Part Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#092238] p-1.5 rounded-2xl border border-cyan-900/60 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedPartFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedPartFilter === "all"
                ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            هەموو یەکەکان (٦ یەکە)
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPartFilter(1);
              setActiveUnitIndex(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedPartFilter === 1
                ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            بەشی یەکەم (٧٤ لاپەڕە)
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPartFilter(2);
              setActiveUnitIndex(4);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedPartFilter === 2
                ? "bg-blue-500 text-slate-950 shadow-md font-black"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            بەشی دووەم (٣٨ لاپەڕە)
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="گەڕان بۆ وانە، یاسای ڕێزمان (المفعول لأجله، التمييز، العدد...) یان دەقی ئەدەبی..."
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
            <span>{searchResults.length} وانە دۆزرایەوە لە پەڕتووکی عەرەبیدا:</span>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-[#092238] border border-cyan-950 rounded-2xl p-8 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-slate-300">هیچ وانەیەک نەدۆزرایەوە بۆ "{searchQuery}"</p>
              <p className="text-xs text-slate-400">وشەیەکی تر تاقی بکەرەوە وەک: التوكيد، الاستثناء، كعب، السياب</p>
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
                      بەشی {lesson.partNumber} • {lesson.unitTitle}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">لاپەڕە {lesson.page}</span>
                  </div>

                  <div>
                    <h4 className="font-sans font-bold text-sm text-white">{lesson.title}</h4>
                    <p className="font-sans text-xs text-slate-300 mt-1 line-clamp-2">{lesson.summary}</p>
                  </div>

                  {lesson.grammarRule && (
                    <div className="bg-[#061726] border border-cyan-950 p-2.5 rounded-xl text-[11px] text-cyan-200 font-mono">
                      {lesson.grammarRule}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-cyan-950">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTopicForStudy?.(lesson.title, lesson.page, lesson.unitTitle);
                      }}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>خوێندن و پرسیار لەگەڵ زانا</span>
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
        /* STANDARD 6-UNIT BROWSER */
        <div className="space-y-5">
          {/* Unit Selector Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredUnits.map((unit) => {
              const isActive = activeUnit.unitIndex === unit.unitIndex;
              return (
                <button
                  key={unit.unitIndex}
                  type="button"
                  onClick={() => setActiveUnitIndex(unit.unitIndex)}
                  className={`text-right p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    isActive
                      ? "bg-[#0b2944] border-cyan-500 shadow-lg shadow-cyan-500/10"
                      : "bg-[#081f33] border-cyan-950/80 hover:border-cyan-800 hover:bg-[#0a253e]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        unit.partNumber === 1
                          ? "bg-emerald-950/80 border-emerald-700/60 text-emerald-300"
                          : "bg-blue-950/80 border-blue-700/60 text-blue-300"
                      }`}
                    >
                      بەشی {unit.partNumber === 1 ? "یەکەم" : "دووەم"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">لاپەڕە {unit.pages}</span>
                  </div>

                  <div>
                    <h4 className="font-sans font-bold text-xs sm:text-sm text-white line-clamp-1">
                      {unit.title}
                    </h4>
                    <p className="font-sans text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {unit.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ACTIVE UNIT DISPLAY CARD */}
          <div className="bg-[#081f33] border border-cyan-900/60 rounded-3xl p-5 sm:p-6 space-y-6">
            {/* Unit Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-950 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono text-cyan-400">
                    بەشی {activeUnit.partNumber === 1 ? "یەکەم (الجزء الأول)" : "دووەم (الجزء الثاني)"} • لاپەڕە {activeUnit.pages}
                  </span>
                </div>
                <h3 className="font-sans font-black text-lg sm:text-xl text-white">
                  {activeUnit.title}
                </h3>
                <p className="text-xs text-slate-300 font-sans max-w-2xl leading-relaxed">
                  {activeUnit.description}
                </p>
              </div>

              {/* Start unit study with Zana */}
              <button
                type="button"
                onClick={() => {
                  onSelectTopicForStudy?.(activeUnit.title, activeUnit.pages, `بەشی ${activeUnit.partNumber}`);
                }}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>شیکردنەوەی ئەم یەکەیە لەگەڵ زانا</span>
              </button>
            </div>

            {/* Unit Lessons Accordion */}
            <div className="space-y-3">
              <h4 className="font-sans font-bold text-xs text-slate-400 flex items-center gap-1.5 uppercase">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>وانە و بابەتە فەرمییەکانی ئەم یەکەیە:</span>
              </h4>

              <div className="space-y-2.5">
                {activeUnit.lessons.map((lesson) => {
                  const isExpanded = expandedLessonId === lesson.id;
                  return (
                    <div
                      key={lesson.id}
                      className="bg-[#092238] border border-cyan-950 rounded-2xl overflow-hidden transition-all"
                    >
                      {/* Lesson Row Clickable Header */}
                      <button
                        type="button"
                        onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                        className="w-full text-right p-4 flex items-center justify-between gap-3 hover:bg-[#0c2a46] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400 shrink-0">
                            <FileText className="w-4 h-4" />
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

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="p-4 pt-1 border-t border-cyan-950 space-y-3 bg-[#061827]">
                          <p className="text-xs text-slate-300 font-sans leading-relaxed">
                            {lesson.summary}
                          </p>

                          {/* Grammar Rule Box if available */}
                          {lesson.grammarRule && (
                            <div className="bg-[#081f33] border-r-4 border-r-emerald-500 border border-cyan-950 p-3 rounded-xl space-y-1">
                              <span className="text-[10px] font-bold text-emerald-400 block uppercase">
                                یاسای سەرەکیی ڕێزمان (القاعدة النحوية):
                              </span>
                              <p className="text-xs text-emerald-100 font-mono leading-relaxed">
                                {lesson.grammarRule}
                              </p>
                            </div>
                          )}

                          {/* Key Points */}
                          {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-cyan-400 block">
                                خاڵە گرنگەکان بۆ تاقیکردنەوەی نیشتمانی (وزاری):
                              </span>
                              <ul className="space-y-1">
                                {lesson.keyPoints.map((pt, idx) => (
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
                                onSelectTopicForStudy?.(lesson.title, lesson.page, activeUnit.title);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-white" />
                              <span>پرسیارکردن لە زانا دەربارەی ئەم بابەتە</span>
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
