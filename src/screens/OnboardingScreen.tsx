import { useState } from "react";
import { ZanaButton } from "../components/ZanaButton.tsx";
import {
  GRADE_LABELS,
  STREAM_LABELS,
  SUBJECT_LABELS,
  LEVEL_LABELS,
} from "../features/student/studentDefaults.ts";
import { StudentGrade, AcademicStream, SubjectKey, StudentLevel } from "../features/student/studentTypes.ts";
import {
  GraduationCap,
  Sparkles,
  User,
  School,
  BookOpen,
  Award,
  CheckCircle2,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  BookMarked,
} from "lucide-react";

export interface SubjectBookMockItem {
  id: string;
  title: string;
  category: "زانستی" | "وێژەیی" | "بنەڕەتی";
  image: string;
  subjectKey: SubjectKey;
  description: string;
}

export const SCIENTIFIC_SUBJECT_BOOKS: SubjectBookMockItem[] = [
  {
    id: "math",
    title: "بیرکاری",
    category: "زانستی",
    image: "/books/math.png",
    subjectKey: "math",
    description: "زانست بۆ هەمووان - بیرکاری پۆلی ١٢ (نەخشە، داتاشراو، تەواوکاری)",
  },
  {
    id: "physics",
    title: "فیزیا",
    category: "زانستی",
    image: "/books/physics.png",
    subjectKey: "physics",
    description: "زانست بۆ هەمووان - فیزیا پۆلی ١٢ (جووڵە، کارۆڕاکێشان، یاسای لێنز)",
  },
  {
    id: "chemistry",
    title: "کیمیا",
    category: "زانستی",
    image: "/books/chemistry.png",
    subjectKey: "chemistry",
    description: "زانست بۆ هەمووان - کیمیا پۆلی ١٢ (ترش و تفت، pH، کیمیای ئەندامی)",
  },
  {
    id: "biology",
    title: "زیندەزانی",
    category: "زانستی",
    image: "/books/biology.png",
    subjectKey: "biology",
    description: "زانست بۆ هەمووان - زیندەزانی پۆلی ١٢ (DNA، بۆماوەزانی، کۆئەندامەکان)",
  },
  {
    id: "english",
    title: "ئینگلیزی",
    category: "زانستی",
    image: "/books/english.png",
    subjectKey: "english",
    description: "Sunrise 12 - Student's Book (Grammar, Vocabulary & Reading)",
  },
];

export const GRADE_10_SCIENTIFIC_SUBJECT_BOOKS: SubjectBookMockItem[] = [
  {
    id: "g10_physics",
    title: "فیزیا",
    category: "زانستی",
    image: "/books/g10_physics.png",
    subjectKey: "physics",
    description: "زانست بۆ هەمووان - فیزیا پۆلی ١٠ (جووڵە، ئاڕاستەبڕەکان، یاساکانی نیوتن، کار و وزە)",
  },
  {
    id: "g10_biology",
    title: "زیندەزانی",
    category: "زانستی",
    image: "/books/g10_biology.png",
    subjectKey: "biology",
    description: "زانست بۆ هەمووان - زیندەزانی پۆلی ١٠ (ژینگەزانی، کیمیای ژیان، پەردەی خانە)",
  },
  {
    id: "g10_english",
    title: "ئینگلیزی",
    category: "زانستی",
    image: "/books/g10_english.png",
    subjectKey: "english",
    description: "Sunrise 10 - Student's & Activity Book (Grammar, Vocabulary & Reading)",
  },
];

export const GRADE_9_SUBJECT_BOOKS: SubjectBookMockItem[] = [
  {
    id: "g9_math",
    title: "بیرکاری",
    category: "بنەڕەتی",
    image: "/books/g9_math.png",
    subjectKey: "math",
    description: "زانست بۆ هەمووان - بیرکاری پۆلی ٩ (پەیوەندی و نەخشەکان، ئەندازە، ئامار و ئەگەر)",
  },
  {
    id: "g9_science",
    title: "زانست",
    category: "بنەڕەتی",
    image: "/books/g9_science.png",
    subjectKey: "chemistry",
    description: "زانست بۆ هەمووان - زانستی پۆلی ٩ (کیمیا، فیزیا، زیندەزانی و زانستی زەوی)",
  },
  {
    id: "g9_english_activity",
    title: "ئینگلیزی (چالاکی)",
    category: "بنەڕەتی",
    image: "/books/g9_english_activity.png",
    subjectKey: "english",
    description: "Sunrise 9 - Activity Book (Reading, Grammar, Vocabulary & Writing)",
  },
  {
    id: "g9_arabic_1",
    title: "عەرەبی (بەشی ١)",
    category: "بنەڕەتی",
    image: "/books/g9_arabic_1.png",
    subjectKey: "arabic",
    description: "قواعد اللغة والنصوص الأدبية - زمانی عەرەبی پۆلی ٩ (بەشی یەکەم)",
  },
  {
    id: "g9_arabic_2",
    title: "عەرەبی (بەشی ٢)",
    category: "بنەڕەتی",
    image: "/books/g9_arabic_2.png",
    subjectKey: "arabic",
    description: "قواعد اللغة والنصوص الأدبية - زمانی عەرەبی پۆلی ٩ (بەشی دووەم)",
  },
  {
    id: "g9_social_values",
    title: "کارامەیی و بەهاکان",
    category: "بنەڕەتی",
    image: "/books/g9_social_values.png",
    subjectKey: "kurdish",
    description: "کارامەیی و بەها کۆمەڵایەتییەکان - پۆلی ٩ (پەیوەندی، بەرپرسیارێتی، هاووڵاتیبوون)",
  },
];

export const GRADE_11_SCIENTIFIC_SUBJECT_BOOKS: SubjectBookMockItem[] = [
  {
    id: "g11_math",
    title: "بیرکاری",
    category: "زانستی",
    image: "/books/g11_math.png",
    subjectKey: "math",
    description: "زانست بۆ هەمووان - بیرکاری پۆلی ١١ (ژمارە ئاوێتەکان، نەخشەکان، ئەندازەی شیکاری)",
  },
  {
    id: "g11_physics",
    title: "فیزیا",
    category: "زانستی",
    image: "/books/g11_physics.png",
    subjectKey: "physics",
    description: "زانست بۆ هەمووان - فیزیا پۆلی ١١ (پێوانەکردن، یاساکانی نیوتن، کار و وزە)",
  },
  {
    id: "g11_chemistry",
    title: "کیمیا",
    category: "زانستی",
    image: "/books/g11_chemistry.png",
    subjectKey: "chemistry",
    description: "زانست بۆ هەمووان - کیمیا پۆلی ١١ (کارلێکە کیمیاییەکان، گازەکان، گیراوەکان)",
  },
  {
    id: "g11_biology",
    title: "زیندەزانی",
    category: "زانستی",
    image: "/books/g11_biology.png",
    subjectKey: "biology",
    description: "زانست بۆ هەمووان - زیندەزانی پۆلی ١١ (پێکهاتەی خانە، ڕۆشنەپێکهاتن، میتۆسیس)",
  },
  {
    id: "g11_arabic",
    title: "عەرەبی",
    category: "زانستی",
    image: "/books/g11_arabic.png",
    subjectKey: "arabic",
    description: "قواعد اللغة والنصوص الأدبية - زمانی عەرەبی پۆلی ١١",
  },
  {
    id: "g11_english_activity",
    title: "ئینگلیزی (چالاکی)",
    category: "زانستی",
    image: "/books/g11_english_activity.png",
    subjectKey: "english",
    description: "Sunrise 11 - Activity Book (Grammar, Reading & Writing)",
  },
];

export const LITERARY_SUBJECT_BOOKS: SubjectBookMockItem[] = [
  {
    id: "kurdish",
    title: "زمان و ئەدەبی کوردی",
    category: "وێژەیی",
    image: "/books/kurdish.png",
    subjectKey: "kurdish",
    description: "مەنهەجی فەرمی پۆلی ١٢ی وێژەیی: ڕێزمان، ئەدەبی نوێ، ڕەوانبێژی، و خوێندنەوە.",
  },
  {
    id: "arabic_1",
    title: "عەرەبی (بەشی ١)",
    category: "وێژەیی",
    image: "/books/arabic_1.png",
    subjectKey: "arabic",
    description: "مەنهەجی فەرمی زمانی عەرەبی بەشی یەکەم: الرومنسية، الواقعية، الأدب الأندلسي وقواعد اللغة.",
  },
  {
    id: "arabic_2",
    title: "عەرەبی (بەشی ٢)",
    category: "وێژەیی",
    image: "/books/arabic_2.png",
    subjectKey: "arabic",
    description: "مەنهەجی فەرمی زمانی عەرەبی بەشی دووەم: صدر الإسلام، العصر العباسي، الشعر الحديث وقواعد اللغة.",
  },
  {
    id: "sports",
    title: "وەرزش",
    category: "وێژەیی",
    image: "/books/sports.png",
    subjectKey: "sports",
    description: "پڕۆگرامی پەروەردەی وەرزشی: یاساکانی تۆپی پێی فیفا، فوتساڵ، و ناوبژیوانی.",
  },
  {
    id: "history",
    title: "مێژوو",
    category: "وێژەیی",
    image: "/books/history.png",
    subjectKey: "history",
    description: "مەنهەجی فەرمی مێژووی نوێ و هاوچەرخ: ١٠ بەشی سەرەکی، پەیماننامەکان و شۆڕشەکانی کورد.",
  },
  {
    id: "economy",
    title: "ئابووری",
    category: "وێژەیی",
    image: "/books/economics.png",
    subjectKey: "economy",
    description: "مەنهەجی فەرمی ئابووری (٢١٢ لاپەڕە): داهاتی نەتەوەیی، بازرگانی، دارایی گشتی، و ڕێکخراوە نێودەوڵەتییەکان.",
  },
  {
    id: "geography",
    title: "جوگرافیا",
    category: "وێژەیی",
    image: "/books/geography.png",
    subjectKey: "geography",
    description: "مەنهەجی فەرمی جوگرافیای ئابووری: ٧ بەشی سەرەکی، کشتوکاڵ، سامانی ئاژەڵ، وزە، کانزاکان، پیشەسازی و بازرگانی.",
  },
  {
    id: "math_lit",
    title: "بیرکاری",
    category: "وێژەیی",
    image: "/books/math_lit.png",
    subjectKey: "math",
    description: "مەنهەجی فەرمی بیرکاری وێژەیی (١١١ لاپەڕە): ٥ بەشی سەرەکی، ئامار و ئەگەر، جەبر، نەخشەکان، یەکبەدوایەکەکان، و جێبەجێکردنی ئابووری.",
  },
  {
    id: "english",
    title: "ئینگلیزی",
    category: "وێژەیی",
    image: "/books/english.png",
    subjectKey: "english",
    description: "مەنهەجی فەرمی Sunrise 12: کتێبی خوێندکار، کتێبی چاڵاکی، و ڕۆمانی Treasure Island.",
  },
];

interface OnboardingScreenProps {
  onComplete: (name: string, grade: string, subject: string, level: string, stream?: string) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<StudentGrade>("12");
  const [stream, setStream] = useState<AcademicStream | "">("");
  const [subject, setSubject] = useState<SubjectKey>("math");
  const [selectedBookId, setSelectedBookId] = useState<string>("math");
  const [activeStreamTab, setActiveStreamTab] = useState<"scientific" | "literary">("scientific");
  const [level, setLevel] = useState<StudentLevel>("intermediate");
  const [error, setError] = useState("");

  const totalSteps = 7;

  // Handles updating grade and automatically adjusting default stream
  const handleSelectGrade = (selectedGrade: StudentGrade) => {
    setGrade(selectedGrade);
    if (selectedGrade === "9") {
      setStream("general");
    } else {
      setStream(""); // Force manual selection for 10, 11, 12
    }
  };

  const handleNext = () => {
    if (step === 2) {
      if (!name.trim()) {
        setError("تکایە سەرەتا ناوی خۆت بنووسە بۆ ئەوەی بتوانین دەست پێ بکەین.");
        return;
      }
      if (name.trim().length < 2) {
        setError("تکایە ناوێکی ڕاستەقینە بنووسە (لانیکەم ٢ پیت).");
        return;
      }
      setError("");
    }
    
    // Automatically skip step 4 if Grade 9 is selected
    if (step === 3 && grade === "9") {
      setStream("general");
      setActiveStreamTab("scientific");
      setSelectedBookId("g9_math");
      setSubject("math");
      setStep(5);
      return;
    }

    if (step === 4) {
      if (grade !== "9" && stream !== "scientific") {
        if (stream === "literary") {
          setError("بەشی وێژەیی لە ماوەی داهاتوو کارا دەبێت بۆ قوتابیان ⏳ تکایە بەشی زانستی هەڵبژێرە.");
        } else {
          setError("تکایە ڕێڕەوی خوێندنت دیاری بکە.");
        }
        return;
      }
      const st = "scientific";
      setActiveStreamTab(st);
      if (grade === "10") {
        setSelectedBookId("g10_physics");
        setSubject("physics");
      } else if (grade === "11") {
        setSelectedBookId("g11_math");
        setSubject("math");
      } else {
        setSelectedBookId("math");
        setSubject("math");
      }
      setError("");
    }

    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setError("");
    // Automatically skip step 4 on back navigation if Grade 9 is selected
    if (step === 5 && grade === "9") {
      setStep(3);
      return;
    }
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("تکایە ناوەکەت بنووسە.");
      setStep(2);
      return;
    }
    const finalStream = grade === "9" ? "general" : stream;
    onComplete(name.trim(), grade, subject, level, finalStream || "scientific");
  };

  const progressPercentage = (step / totalSteps) * 100;

  // Main UI screens for each step
  return (
    <div className={`w-full ${step === 5 ? "max-w-6xl" : "max-w-md"} mx-auto py-4 sm:py-8 px-3 sm:px-4 flex flex-col my-auto select-none transition-all duration-300`} dir="rtl">
      {/* Top Progress & Back Button */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className={`font-sans text-xs font-bold px-2.5 py-1 rounded-full ${
            step === 5 ? "bg-cyan-950 text-cyan-300 border border-cyan-800/50" : "text-blue-600 bg-blue-50"
          }`}>
            هەنگاوی {step} لە {totalSteps}
          </span>
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className={`flex items-center gap-1 ${
                step === 5 ? "text-slate-300 hover:text-white" : "text-slate-500 hover:text-slate-800"
              } text-sm font-sans font-medium transition-colors cursor-pointer min-h-[40px] px-2 rounded-lg`}
            >
              <ChevronRight className="w-4 h-4" />
              <span>گەڕانەوە</span>
            </button>
          )}
        </div>
        <div className={`w-full ${step === 5 ? "bg-slate-800" : "bg-slate-100"} h-1.5 rounded-full overflow-hidden`}>
          <div
            className="bg-blue-600 h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Form/Card Content */}
      <div className="w-full">
        <div className={`w-full rounded-3xl overflow-hidden transition-all duration-300 relative ${
          step === 5
            ? "bg-[#071927] border border-cyan-950/80 shadow-2xl p-4 sm:p-8 text-white"
            : "bg-white border border-slate-100/80 shadow-lg p-6 sm:p-8 text-slate-800"
        }`}>
          {step === 5 && (
            <>
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-700/10 rounded-full blur-[120px] pointer-events-none" />
            </>
          )}
          {/* Step 1: Welcome Screen */}
          {step === 1 && (
            <div className="space-y-6 text-right">
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-blue-200">
                  <GraduationCap className="w-12 h-12" />
                </div>
                <h2 className="font-sans font-extrabold text-2xl text-slate-900 leading-tight">
                  بەخێربێیت بۆ زانا 🎓
                </h2>
                <p className="font-sans text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  هاوڕێی زیرەکی فێربوونی تۆ؛ بە کوردییەکی ڕوون، هەنگاو بە هەنگاو یارمەتیت دەدات تا باشتر تێبگەیت، زیاتر ڕاهێنان بکەیت و بە متمانەوە پێش بکەویت.
                </p>
              </div>

              <div className="space-y-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <div className="flex gap-3 items-start text-right">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-slate-800">فێربوونی هەنگاو بە هەنگاو</h4>
                    <p className="font-sans text-xs text-slate-500 mt-0.5 leading-relaxed">زانا وانەکان بە زمانی سادە، نموونەی کارپێکراو و ڕاهێنانی کورت ڕوون دەکاتەوە.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start text-right">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-slate-800">هەڵسەنگاندنی ئاست</h4>
                    <p className="font-sans text-xs text-slate-500 mt-0.5 leading-relaxed">لە سەرەتادا ئاستت دەناسێت، پاشان ڕێگای فێربوونت بەپێی تواناکانت ڕێکدەخات.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start text-right">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-slate-800">پێشکەوتنی ڕۆژانە</h4>
                    <p className="font-sans text-xs text-slate-500 mt-0.5 leading-relaxed">هەر ڕۆژ ئەرکێکی بچووک و گونجاوت پێدەدات، تا بەردەوام بمێنیت و هەست بە پێشکەوتن بکەیت.</p>
                  </div>
                </div>
              </div>

              <ZanaButton variant="primary" fullWidth onClick={handleNext} className="mt-2 h-12">
                <span>دەست پێ بکەین</span>
                <ChevronLeft className="w-5 h-5 mr-2" />
              </ZanaButton>
            </div>
          )}

          {/* Step 2: Student Name */}
          {step === 2 && (
            <div className="space-y-6 text-right">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-xl text-slate-800">ناوت چییە؟</h3>
                <p className="font-sans text-sm text-slate-500">
                  ناوت بنووسە تا زانا بتوانێت بە شێوەیەکی نزیکتر و تایبەتتر یارمەتیت بدات.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) setError("");
                  }}
                  placeholder="نموونە: سۆران، ئارام، ڕۆژین"
                  className="w-full font-sans text-base min-h-[50px] px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-right"
                  autoFocus
                />
                {error && (
                  <p className="font-sans text-xs text-red-500 mt-1 font-medium">
                    ⚠️ {error}
                  </p>
                )}
              </div>

              <ZanaButton variant="primary" fullWidth onClick={handleNext} className="h-12 mt-4">
                <span>بەردەوام بە</span>
                <ChevronLeft className="w-5 h-5 mr-2" />
              </ZanaButton>
            </div>
          )}

          {/* Step 3: Grade Selection */}
          {step === 3 && (
            <div className="space-y-6 text-right">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2">
                  <School className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-xl text-slate-800">لە کام پۆل دەخوێنیت؟</h3>
                <p className="font-sans text-sm text-slate-500">
                  پۆلەکەت هەڵبژێرە، بۆ ئەوەی وانە و ڕاهێنانەکان گونجاو بن.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(Object.keys(GRADE_LABELS) as StudentGrade[]).map((val) => {
                  const isSelected = grade === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelectGrade(val)}
                      className={`min-h-[52px] w-full px-4 rounded-xl border font-sans text-base font-semibold text-right transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-500 text-blue-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{GRADE_LABELS[val]}</span>
                      {isSelected && <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white"><span className="text-[10px]">✓</span></div>}
                    </button>
                  );
                })}
              </div>

              <ZanaButton variant="primary" fullWidth onClick={handleNext} className="h-12 mt-4">
                <span>بەردەوام بە</span>
                <ChevronLeft className="w-5 h-5 mr-2" />
              </ZanaButton>
            </div>
          )}

          {/* Step 4: Academic Stream */}
          {step === 4 && (
            <div className="space-y-6 text-right">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2">
                  <BookMarked className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-xl text-slate-800">ڕێڕەوی خوێندنت چییە؟</h3>
                <p className="font-sans text-sm text-slate-500 font-medium">
                  {grade === "9"
                    ? "پۆلی ٩ بە شێوەی گشتی ڕێکدەخرێت."
                    : "تکایە ڕێڕەوی خوێندنت دیاری بکە."}
                </p>
              </div>

              {/* Special warning style for 10, 11, and 12 */}
              {(grade === "10" || grade === "11" || grade === "12") && (
                <div className="bg-amber-50 border border-amber-100 text-amber-800 px-3.5 py-2.5 rounded-xl font-sans text-xs">
                  📌 <strong>ئاگاداری:</strong> بۆ ئەم پۆلە ڕێڕەوی <strong>گشتی</strong> بوونی نییە، تکایە ڕێڕەوەکەت بە دروستی هەڵبژێرە.
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {/* Dynamically filter stream list */}
                {(Object.keys(STREAM_LABELS) as AcademicStream[])
                  .filter((val) => {
                    if (grade === "10" || grade === "11" || grade === "12") {
                      return val === "scientific" || val === "literary";
                    }
                    return val === "general";
                  })
                  .map((val) => {
                    const isSelected = stream === val;
                    const isLiterary = val === "literary";
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={isLiterary}
                        onClick={() => {
                          if (isLiterary) {
                            setError("بەشی وێژەیی لە ماوەی داهاتوو کارا دەبێت بۆ قوتابیان ⏳");
                            return;
                          }
                          setStream(val);
                          setError("");
                        }}
                        className={`min-h-[56px] w-full px-4 rounded-xl border font-sans text-base font-semibold text-right transition-all flex items-center justify-between ${
                          isLiterary
                            ? "bg-slate-50/90 border-dashed border-slate-300 text-slate-400 cursor-not-allowed opacity-85"
                            : isSelected
                            ? "bg-blue-50/70 border-blue-500 text-blue-700 shadow-sm cursor-pointer"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span>{STREAM_LABELS[val]}</span>
                          {isLiterary && (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-xs">
                              <span>لە ماوەی داهاتوو کارا دەبێت بۆ قوتابیان</span>
                              <span>⏳</span>
                            </span>
                          )}
                        </div>
                        {isSelected && !isLiterary && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white">
                            <span className="text-[10px]">✓</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>

              {error && (
                <p className="font-sans text-xs text-red-500 mt-1 font-medium">
                  ⚠️ {error}
                </p>
              )}

              <ZanaButton variant="primary" fullWidth onClick={handleNext} className="h-12 mt-4">
                <span>بەردەوام بە</span>
                <ChevronLeft className="w-5 h-5 mr-2" />
              </ZanaButton>
            </div>
          )}

          {/* Step 5: Subject Selection (Visual Textbook Showcase) */}
          {step === 5 && (
            <div className="space-y-6 text-right relative z-10">
              {/* Header with Title and Stream Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-950/80 pb-4">
                <div className="space-y-1">
                  <div className="w-10 h-10 bg-[#0a2339] text-cyan-400 border border-cyan-800/40 rounded-xl flex items-center justify-center mb-2 shadow-inner">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-sans font-black text-2xl text-white">لە کام بابەت دەست پێ بکەین؟</h3>
                  <p className="font-sans text-xs sm:text-sm text-slate-400 font-medium">
                    پەڕتووکی دەستپێک هەڵبژێرە بەپێی مەنهەجی فەرمی. دواتر هەرکاتێک بتەوێت دەتوانیت بیگۆڕیت.
                  </p>
                </div>

                {/* Stream Switcher Pills or Grade 9 Badge */}
                {grade === "9" ? (
                  <div className="flex items-center gap-2 bg-[#0a2339] px-4 py-2 rounded-2xl border border-cyan-800/50 text-cyan-300 font-bold text-xs shadow-inner">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>قۆناغی بنەڕەتی (گشتی)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-[#0a2339] p-1.5 rounded-2xl border border-cyan-900/50 self-start sm:self-auto shrink-0 shadow-inner">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStreamTab("scientific");
                        setStream("scientific");
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#2dd4bf] text-slate-950 shadow-md shadow-teal-500/20 cursor-default flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>بەشی زانستی</span>
                    </button>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-disabled="true"
                      onClick={() => {
                        setError("بەشی وێژەیی لە ئێستادا قوفڵکراوە و لە ماوەی داهاتوودا بۆ قوتابیان کارا دەبێت 🔒");
                      }}
                      title="بەشی وێژەیی قوفڵکراوە (لە ماوەی داهاتوو کارا دەبێت ⏳)"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-900/70 border border-slate-800 cursor-not-allowed opacity-75 flex items-center gap-1.5 select-none hover:border-amber-500/40 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>بەشی وێژەیی (قوفڵکراوە 🔒)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Book Grid or Empty State */}
              {(() => {
                const isGrade12 = grade === "12";
                const isGrade11 = grade === "11";
                const isGrade10 = grade === "10";
                const isGrade9 = grade === "9";
                const currentList = isGrade9
                  ? GRADE_9_SUBJECT_BOOKS
                  : isGrade12
                  ? SCIENTIFIC_SUBJECT_BOOKS
                  : isGrade11
                  ? GRADE_11_SCIENTIFIC_SUBJECT_BOOKS
                  : isGrade10
                  ? GRADE_10_SCIENTIFIC_SUBJECT_BOOKS
                  : [];

                if (currentList.length === 0) {
                  return (
                    <div className="bg-[#0a2339]/60 border border-cyan-900/40 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 my-6">
                      <div className="w-16 h-16 rounded-2xl bg-cyan-950/90 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shadow-inner">
                        <BookOpen className="w-8 h-8 opacity-75" />
                      </div>
                      <div className="space-y-2 max-w-md">
                        <h4 className="font-sans font-bold text-lg sm:text-xl text-white">
                          کتێبی فەرمی ئەم بەشە هێشتا بەردەست نییە
                        </h4>
                        <p className="font-sans text-xs sm:text-sm text-slate-400 leading-relaxed">
                          لە ئێستادا مەنهەجی فەرمی پۆلی ١٢، پۆلی ١١، پۆلی ١٠ و پۆلی ٩ دانراون. بەشەکانی تر لە نوێکردنەوەکانی داهاتوودا زیاد دەکرێن.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setGrade("12");
                          setStream(activeStreamTab);
                          if (activeStreamTab === "literary") {
                            setSelectedBookId("kurdish");
                            setSubject("kurdish");
                          } else {
                            setSelectedBookId("math");
                            setSubject("math");
                          }
                        }}
                        className="mt-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                      >
                        گۆڕین بۆ پۆلی ١٢
                      </button>
                    </div>
                  );
                }

                const activeBook = currentList.find((b) => b.id === selectedBookId) || currentList[0];

                return (
                  <>
                    {/* Responsive Grid matching user's reference: 2-col on mobile, 3-4 col on desktop */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                      {currentList.map((book) => {
                        const isSelected = selectedBookId === book.id;

                        return (
                          <div
                            key={book.id}
                            onClick={() => {
                              setSelectedBookId(book.id);
                              setSubject(book.subjectKey);
                            }}
                            className={`relative group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col select-none ${
                              isSelected
                                ? "ring-2 ring-blue-500 border-2 border-blue-500 shadow-xl shadow-blue-500/25 -translate-y-1.5 bg-[#081f33]"
                                : "border border-cyan-950/80 bg-[#081a2b] hover:border-cyan-500/50 hover:shadow-lg hover:-translate-y-1 opacity-90 hover:opacity-100"
                            }`}
                          >
                            {/* Selection State: Checkmark icon in top corner */}
                            {isSelected && (
                              <div className="absolute top-2.5 right-2.5 z-30 bg-blue-600 text-white rounded-full p-1.5 shadow-lg flex items-center justify-center">
                                <Check className="w-4 h-4 text-white stroke-[3]" />
                              </div>
                            )}

                            {/* Book Cover Image (Portrait aspect-[3/4], object-cover) */}
                            <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
                              {/* 3D Spine Shadow on left */}
                              <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/50 via-black/20 to-transparent z-10 pointer-events-none" />
                              {/* Top gloss highlight */}
                              <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-white/15 to-transparent z-10 pointer-events-none" />

                              <img
                                src={book.image}
                                alt={book.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />

                              {/* Fallback Graphic */}
                              <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-slate-950 p-4 flex flex-col justify-between text-right -z-10">
                                <span className="text-xs text-cyan-400 font-bold">پۆلی {grade}</span>
                                <span className="text-white font-black text-lg">{book.title}</span>
                                <span className="text-[10px] text-slate-400">وەزارەتی پەروەردە</span>
                              </div>

                              {/* Hover/Active State: Cyan "کردنەوە" button overlay */}
                              <div
                                className={`absolute inset-x-3 bottom-3 transition-all duration-300 z-20 ${
                                  isSelected
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                }`}
                              >
                                <div className="w-full py-2.5 px-4 rounded-xl bg-[#2dd4bf] hover:bg-[#14b8a6] text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-teal-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                                  <span>{isSelected ? "هەڵبژێردراوە ✓" : "کردنەوە"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Info Bar: Flexbox justify-between items-center */}
                            <div className="bg-[#0a2339]/95 border-t border-cyan-900/40 px-3.5 py-3 flex justify-between items-center z-10 mt-auto">
                              {/* Left: Pill/badge with category name (e.g. "زانستی" / "وێژەیی") */}
                              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#0e4860] text-cyan-300 border border-cyan-700/50">
                                {book.category}
                              </span>

                              {/* Right: Main subject title in bold white text */}
                              <span className="font-sans font-bold text-sm sm:text-base text-white">
                                {book.title}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Selected Subject Summary Banner */}
                    {activeBook && (
                      <div className="bg-[#0a2339]/80 border border-cyan-900/50 p-4 rounded-2xl flex items-center justify-between text-right">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700/50 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <p className="font-sans font-black text-sm text-white">
                              کتێبی دەستپێک: {activeBook.title} ({activeBook.category})
                            </p>
                            <p className="font-sans text-xs text-slate-400 mt-0.5">
                              {activeBook.description}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-cyan-300 bg-cyan-950 px-3 py-1 rounded-full border border-cyan-700/50 shrink-0 hidden sm:inline-block">
                          پۆلی {grade} • {activeStreamTab === "literary" ? "وێژەیی" : "زانستی"}
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Next Button (بەردەوام بە) - Sticky on mobile so it is always accessible and visible */}
              <div className="sticky bottom-2 z-30 pt-3 pb-1 bg-gradient-to-t from-[#071927] via-[#071927]/95 to-transparent sm:static sm:bg-none sm:p-0">
                <button
                  type="button"
                  disabled={!selectedBookId}
                  onClick={handleNext}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                >
                  <span>بەردەوام بە</span>
                  <ChevronLeft className="w-5 h-5 mr-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Level Selection */}
          {step === 6 && (
            <div className="space-y-6 text-right">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-xl text-slate-800">ئێستا خۆت چۆن دەبینیت؟</h3>
                <p className="font-sans text-sm text-slate-500 font-medium">
                  ئەمە تەنها بۆ ئەوەیە زانا ڕوونکردنەوەکان بەپێی ئاستی تۆ ڕێکبخات.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(Object.keys(LEVEL_LABELS) as StudentLevel[]).map((val) => {
                  const isSelected = level === val;
                  let desc = "";
                  if (val === "beginner") desc = "پێویستم بە کات و ڕوونکردنەوەی بنەڕەتی زیاتر هەیە.";
                  if (val === "intermediate") desc = "تێگەیشتنم مامناوەندە، تەنها دەمەوێت لێهاتووتر بم.";
                  if (val === "advanced") desc = "ئاستم بەرزە و ئامادەم بۆ شیکاری پرسیاری وەزاری سەخت.";

                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setLevel(val)}
                      className={`p-4 w-full rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-500 text-blue-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-sans font-extrabold text-base text-slate-800">{LEVEL_LABELS[val]}</span>
                        {isSelected && <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white"><span className="text-[10px]">✓</span></div>}
                      </div>
                      <span className="font-sans text-xs text-slate-500">{desc}</span>
                    </button>
                  );
                })}
              </div>

              <ZanaButton variant="primary" fullWidth onClick={handleNext} className="h-12 mt-4">
                <span>بەردەوام بە</span>
                <ChevronLeft className="w-5 h-5 mr-2" />
              </ZanaButton>
            </div>
          )}

          {/* Step 7: Confirmation Summary */}
          {step === 7 && (
            <div className="space-y-6 text-right">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-xl text-slate-800">ئامادەی دەستپێکردنیت؟</h3>
                <p className="font-sans text-sm text-slate-500 font-medium">
                  زانا ئێستا پڕۆفایلی فێربوونت ئامادە دەکات و ڕێگایەکی گونجاو بۆ پێشکەوتنت پێشنیار دەکات.
                </p>
              </div>

              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 divide-y divide-slate-100 text-right space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="font-sans text-xs text-slate-500">ناوی تەواو</span>
                  <span className="font-sans text-sm font-extrabold text-slate-800">{name}</span>
                </div>
                <div className="flex justify-between items-center pt-3 py-1">
                  <span className="font-sans text-xs text-slate-500">پۆلی خوێندن</span>
                  <span className="font-sans text-sm font-extrabold text-slate-800">{GRADE_LABELS[grade]}</span>
                </div>
                <div className="flex justify-between items-center pt-3 py-1">
                  <span className="font-sans text-xs text-slate-500">ڕێڕەوی خوێندن</span>
                  <span className="font-sans text-sm font-extrabold text-slate-800">{stream ? STREAM_LABELS[stream as AcademicStream] : "گشتی"}</span>
                </div>
                <div className="flex justify-between items-center pt-3 py-1">
                  <span className="font-sans text-xs text-slate-500">بابەتی خوێندنی دەستپێک</span>
                  <span className="font-sans text-sm font-extrabold text-slate-800">{SUBJECT_LABELS[subject]}</span>
                </div>
                <div className="flex justify-between items-center pt-3 py-1">
                  <span className="font-sans text-xs text-slate-500">ئاستی سەرەتایی</span>
                  <span className="font-sans text-sm font-extrabold text-slate-800">{LEVEL_LABELS[level]}</span>
                </div>
              </div>

              <div className="bg-blue-50 text-blue-800 p-3.5 rounded-xl font-sans text-xs text-right leading-relaxed border border-blue-100">
                ✨ <strong>ئامادەی؟</strong> زانا بەپێی ئەم زانیارییانە پڕۆگرامێکی تایبەتت بۆ ئامادە دەکات بۆ ئەوەی باشترین ئەنجام لەم وەرزەدا بەدەست بهێنیت.
              </div>

              <ZanaButton variant="success" fullWidth onClick={handleSubmit} className="h-12 mt-4">
                <span>ئامادەم، دەست پێ بکەین</span>
                <ChevronLeft className="w-5 h-5 mr-2" />
              </ZanaButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
