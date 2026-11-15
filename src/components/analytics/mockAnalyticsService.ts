import {
  SystemIntelligenceMetrics,
  TeacherClassOverview,
  ParentPortalSummary,
  TeacherAssignment,
} from "./analyticsTypes.ts";

export const MOCK_SYSTEM_METRICS: SystemIntelligenceMetrics = {
  activeSessions15m: 142,
  averageMasteryScore: 0.74,
  totalStudentsMonitored: 1850,
  totalAssessmentsEvaluated: 4920,
  strugglingConcepts: [
    {
      conceptId: "chem_titration_buffer",
      titleKu: "گیراوەی بەفەر و هاوکێشەی هێندەرسۆن",
      subject: "chemistry",
      subjectKu: "کیمیا",
      grade: "12",
      avgMastery: 0.31,
      strugglingStudentsCount: 385,
    },
    {
      conceptId: "phys_electromagnetic_induction",
      titleKu: "یاسای فارادای و لێشاوی موگناتیسی",
      subject: "physics",
      subjectKu: "فیزیا",
      grade: "12",
      avgMastery: 0.34,
      strugglingStudentsCount: 342,
    },
    {
      conceptId: "math_integration_by_parts",
      titleKu: "تەواوکاری بە بەشکردن (Integration by Parts)",
      subject: "math",
      subjectKu: "بیرکاری",
      grade: "12",
      avgMastery: 0.37,
      strugglingStudentsCount: 310,
    },
    {
      conceptId: "chem_chemical_equilibrium_kp",
      titleKu: "نەگۆڕی هاوسەنگی پەستانە بەشییەکان (Kp)",
      subject: "chemistry",
      subjectKu: "کیمیا",
      grade: "12",
      avgMastery: 0.42,
      strugglingStudentsCount: 290,
    },
    {
      conceptId: "phys_centripetal_acceleration",
      titleKu: "تاودانی چەقەهێز و هێزی لێکخشاندنی ستوونی",
      subject: "physics",
      subjectKu: "فیزیا",
      grade: "12",
      avgMastery: 0.44,
      strugglingStudentsCount: 265,
    },
    {
      conceptId: "bio_protein_synthesis_translation",
      titleKu: "وەرگێڕانی کۆدۆنەکانی mRNA بۆ ترشە ئەمینییەکان",
      subject: "biology",
      subjectKu: "زیندەزانی",
      grade: "12",
      avgMastery: 0.46,
      strugglingStudentsCount: 240,
    },
    {
      conceptId: "math_logarithmic_differentiation",
      titleKu: "داتاشراوی نەخشە لۆگاریتمییە سروشتییەکان",
      subject: "math",
      subjectKu: "بیرکاری",
      grade: "12",
      avgMastery: 0.48,
      strugglingStudentsCount: 215,
    },
    {
      conceptId: "eng_passive_voice_perfect",
      titleKu: "Passive Voice in Present & Past Perfect",
      subject: "english",
      subjectKu: "ئینگلیزی",
      grade: "12",
      avgMastery: 0.51,
      strugglingStudentsCount: 198,
    },
    {
      conceptId: "chem_oxidation_states",
      titleKu: "دیاریکردنی ژمارەی ئۆکسان لە هایدرۆجین پەڕۆکساید",
      subject: "chemistry",
      subjectKu: "کیمیا",
      grade: "12",
      avgMastery: 0.53,
      strugglingStudentsCount: 175,
    },
    {
      conceptId: "phys_circuits_kirchhoff",
      titleKu: "یاسای دووەمی کیرشۆف بۆ گرێ و خولگەکان",
      subject: "physics",
      subjectKu: "فیزیا",
      grade: "12",
      avgMastery: 0.55,
      strugglingStudentsCount: 160,
    },
  ],
  activeSubjectsToday: [
    { subject: "chemistry", subjectKu: "کیمیا", activeSessions: 520, percentage: 38 },
    { subject: "math", subjectKu: "بیرکاری", activeSessions: 410, percentage: 30 },
    { subject: "physics", subjectKu: "فیزیا", activeSessions: 260, percentage: 19 },
    { subject: "english", subjectKu: "ئینگلیزی", activeSessions: 180, percentage: 13 },
  ],
  anomalies: [
    {
      id: "anom-1",
      type: "INACTIVITY_7D",
      severity: "warning",
      titleKu: "پچڕانی چالاکی بۆ زیاتر لە ٧ ڕۆژ",
      descriptionKu: "قوتابی هێمن کاروان بۆ ماوەی ٨ ڕۆژە هیچ چوونەژوورەوە و چالاکییەکی لە پلاتفۆرمدا تۆمار نەکردووە.",
      studentId: "std-104",
      studentName: "هێمن کاروان",
      timestamp: "پێش 2 کاتژمێر",
      resolved: false,
    },
    {
      id: "anom-2",
      type: "MASTERY_DROP_20",
      severity: "critical",
      titleKu: "دابەزینی لەناکاوی ئاستی لێهاتوویی > 20%",
      descriptionKu: "نمرەی لێهاتوویی سارا مەحموود لە بابەتی کیمیا لە 82% بۆ 58% دابەزی لە یەک دانیشتندا (-24%).",
      studentId: "std-108",
      studentName: "سارا مەحموود",
      subject: "کیمیا",
      dropAmount: 24,
      timestamp: "پێش 45 خولەک",
      resolved: false,
    },
    {
      id: "anom-3",
      type: "UNRELIABLE_ASSESSMENT",
      severity: "high",
      titleKu: "هەڵسەنگاندنی جێی گومان (Aberrant Response / Guessing)",
      descriptionKu: "سیستەمی دژە-خەمڵاندن ناسنامەی تاقیکردنەوەی ئارام جەزای وەک UNRELIABLE دەستنیشان کرد (وەڵامدانەوەی خێراتر لە ١.٥ چرکە بە شێوازی هەڕەمەکی).",
      studentId: "std-115",
      studentName: "ئارام جەزا",
      subject: "بیرکاری",
      timestamp: "پێش 20 خولەک",
      resolved: false,
    },
  ],
  dailyActiveUsers30d: [
    { xLabel: "١", yValue: 310 },
    { xLabel: "٣", yValue: 340 },
    { xLabel: "٥", yValue: 420 },
    { xLabel: "٨", yValue: 480 },
    { xLabel: "١١", yValue: 530 },
    { xLabel: "١٤", yValue: 620 },
    { xLabel: "١٧", yValue: 590 },
    { xLabel: "٢٠", yValue: 710 },
    { xLabel: "٢٣", yValue: 790 },
    { xLabel: "٢٦", yValue: 880 },
    { xLabel: "٢٨", yValue: 940 },
    { xLabel: "٣٠", yValue: 1040 },
  ],
  subjectMasteryDistribution: [
    {
      label: "کیمیا",
      values: { not_started: 10, developing: 25, proficient: 45, mastered: 20 },
    },
    {
      label: "فیزیا",
      values: { not_started: 15, developing: 30, proficient: 38, mastered: 17 },
    },
    {
      label: "بیرکاری",
      values: { not_started: 12, developing: 28, proficient: 42, mastered: 18 },
    },
    {
      label: "ئینگلیزی",
      values: { not_started: 8, developing: 20, proficient: 48, mastered: 24 },
    },
  ],
  hourlyWeeklyActivity: [
    // 7 days x 24 hours sample data
    ...Array.from({ length: 7 * 24 }).map((_, i) => {
      const dayIndex = Math.floor(i / 24);
      const hour = i % 24;
      // Peak study hours: 14:00 - 22:00
      let baseVal = 5;
      if (hour >= 15 && hour <= 21) {
        baseVal = 25 + Math.floor(Math.sin((hour - 15) * 0.5) * 20);
      } else if (hour >= 9 && hour <= 14) {
        baseVal = 14 + Math.floor(Math.random() * 8);
      } else if (hour < 6) {
        baseVal = 1;
      }
      return {
        dayIndex,
        hour,
        value: baseVal + (dayIndex === 5 ? 10 : 0), // Friday evening bump
      };
    }),
  ],
};

export const MOCK_TEACHER_CLASS: TeacherClassOverview = {
  className: "پۆلی ١٢ی زانستی - هۆڵی ئەلبیرۆنی",
  grade: "12",
  stream: "زانستی",
  totalStudents: 8,
  averageMastery: 0.71,
  concepts: [
    { id: "c_ph", titleKu: "پێوەری pH", subject: "کیمیا" },
    { id: "c_buffer", titleKu: "گیراوەی بەفەر", subject: "کیمیا" },
    { id: "c_faraday", titleKu: "یاسای فارادای", subject: "فیزیا" },
    { id: "c_centripetal", titleKu: "چەقەهێز", subject: "فیزیا" },
    { id: "c_derivative", titleKu: "داتاشراو", subject: "بیرکاری" },
    { id: "c_integration", titleKu: "تەواوکاری", subject: "بیرکاری" },
  ],
  students: [
    {
      studentId: "s-1",
      studentName: "دیاری بەختیار",
      email: "diyari@example.com",
      averageScore: 0.42,
      scores: { c_ph: 0.55, c_buffer: 0.28, c_faraday: 0.32, c_centripetal: 0.45, c_derivative: 0.60, c_integration: 0.30 },
      status: "struggling",
    },
    {
      studentId: "s-2",
      studentName: "سۆما عەلی",
      email: "soma@example.com",
      averageScore: 0.53,
      scores: { c_ph: 0.65, c_buffer: 0.34, c_faraday: 0.42, c_centripetal: 0.58, c_derivative: 0.72, c_integration: 0.45 },
      status: "struggling",
    },
    {
      studentId: "s-3",
      studentName: "ڕێبین جەمال",
      email: "rebin@example.com",
      averageScore: 0.66,
      scores: { c_ph: 0.78, c_buffer: 0.45, c_faraday: 0.68, c_centripetal: 0.74, c_derivative: 0.75, c_integration: 0.56 },
      status: "progressing",
    },
    {
      studentId: "s-4",
      studentName: "شەنگە کەمال",
      email: "shanga@example.com",
      averageScore: 0.76,
      scores: { c_ph: 0.88, c_buffer: 0.58, c_faraday: 0.75, c_centripetal: 0.82, c_derivative: 0.85, c_integration: 0.68 },
      status: "progressing",
    },
    {
      studentId: "s-5",
      studentName: "لاڤە ئاراس",
      email: "lava@example.com",
      averageScore: 0.81,
      scores: { c_ph: 0.92, c_buffer: 0.72, c_faraday: 0.82, c_centripetal: 0.85, c_derivative: 0.88, c_integration: 0.69 },
      status: "thriving",
    },
    {
      studentId: "s-6",
      studentName: "دڵشاد حسێن",
      email: "dilshad@example.com",
      averageScore: 0.85,
      scores: { c_ph: 0.95, c_buffer: 0.76, c_faraday: 0.88, c_centripetal: 0.90, c_derivative: 0.92, c_integration: 0.71 },
      status: "thriving",
    },
    {
      studentId: "s-7",
      studentName: "کاروان نەوزاد",
      email: "karwan@example.com",
      averageScore: 0.88,
      scores: { c_ph: 0.96, c_buffer: 0.80, c_faraday: 0.92, c_centripetal: 0.92, c_derivative: 0.95, c_integration: 0.75 },
      status: "thriving",
    },
    {
      studentId: "s-8",
      studentName: "بانە خەسرەو",
      email: "bana@example.com",
      averageScore: 0.92,
      scores: { c_ph: 0.98, c_buffer: 0.88, c_faraday: 0.94, c_centripetal: 0.95, c_derivative: 0.96, c_integration: 0.82 },
      status: "thriving",
    },
  ],
  conceptGaps: [
    {
      conceptId: "c_buffer",
      titleKu: "گیراوەی بەفەر",
      subject: "کیمیا",
      proficientPercentage: 25, // Only 2 out of 8 >= 0.70
      needsIntervention: true,
    },
    {
      conceptId: "c_integration",
      titleKu: "تەواوکاری بە بەشکردن",
      subject: "بیرکاری",
      proficientPercentage: 37, // Only 3 out of 8 >= 0.70
      needsIntervention: true,
    },
    {
      conceptId: "c_faraday",
      titleKu: "یاسای فارادای",
      subject: "فیزیا",
      proficientPercentage: 62,
      needsIntervention: false,
    },
  ],
};

export const MOCK_PARENT_DATA: ParentPortalSummary = {
  childName: "ئاراس ئەحمەد",
  grade: "12",
  stream: "زانستی",
  weeklyDaysStudied: 5,
  weeklyMinutesSpent: 275,
  streakDays: 7,
  lastActive: "ئەمڕۆ کاتژمێر 16:30",
  subjectsProgress: [
    {
      subject: "chemistry",
      subjectKu: "کیمیا",
      icon: "⚗️",
      progressPercentage: 82,
      color: "bg-indigo-600",
    },
    {
      subject: "physics",
      subjectKu: "فیزیا",
      icon: "⚡",
      progressPercentage: 74,
      color: "bg-amber-500",
    },
    {
      subject: "math",
      subjectKu: "بیرکاری",
      icon: "📐",
      progressPercentage: 68,
      color: "bg-emerald-500",
    },
    {
      subject: "english",
      subjectKu: "ئینگلیزی",
      icon: "📖",
      progressPercentage: 88,
      color: "bg-purple-600",
    },
  ],
  masteredThisWeek: [
    {
      id: "m-1",
      titleKu: "هاوسەنگی ئایۆنی و پێوەری pH",
      subjectKu: "کیمیا",
      date: "دووشەممە",
    },
    {
      id: "m-2",
      titleKu: "یاسای دووەمی نیوتن لە تاقیگە",
      subjectKu: "فیزیا",
      date: "چوارشەممە",
    },
    {
      id: "m-3",
      titleKu: "ڕستەی نادیار (Passive Voice)",
      subjectKu: "ئینگلیزی",
      date: "پێنجشەممە",
    },
  ],
  currentlyWorkingOn: [
    {
      id: "w-1",
      titleKu: "گیراوەی بەفەر و کاریگەری ئایۆنی هاوبەش",
      subjectKu: "کیمیا",
      progress: 45,
    },
    {
      id: "w-2",
      titleKu: "داتاشراوی نەخشە توانییەکان",
      subjectKu: "بیرکاری",
      progress: 60,
    },
  ],
};
