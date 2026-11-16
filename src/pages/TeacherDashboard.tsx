import React, { useState } from "react";
import {
  GraduationCap,
  Users,
  AlertTriangle,
  Plus,
  Share2,
  Download,
  Sparkles,
  Copy,
  Check,
  Target,
} from "lucide-react";
import { MasteryGrid } from "../components/charts/MasteryGrid.tsx";
import { ProgressRing } from "../components/charts/ProgressRing.tsx";
import { TeacherAssignment, TeacherClassOverview } from "../components/analytics/analyticsTypes.ts";

export interface TeacherDashboardProps {
  onNavigateToSubjects?: () => void;
  onNavigateToPractice?: () => void;
  onBackToApp?: () => void;
}

const TEACHER_CLASS_DATA: TeacherClassOverview = {
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
      studentName: "ئارام هێرش",
      email: "aram@example.com",
      averageScore: 0.74,
      scores: { c_ph: 0.85, c_buffer: 0.60, c_faraday: 0.76, c_centripetal: 0.78, c_derivative: 0.80, c_integration: 0.65 },
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
      proficientPercentage: 25,
      needsIntervention: true,
    },
    {
      conceptId: "c_integration",
      titleKu: "تەواوکاری بە بەشکردن",
      subject: "بیرکاری",
      proficientPercentage: 37,
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

export function TeacherDashboard({
  onNavigateToSubjects: _onNavigateToSubjects,
  onNavigateToPractice: _onNavigateToPractice,
  onBackToApp,
}: TeacherDashboardProps) {
  const [classData] = useState(TEACHER_CLASS_DATA);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([
    {
      id: "asg-1",
      title: "ڕاهێنانی پێوەری pH و هاوسەنگی",
      subject: "کیمیا",
      concepts: ["c_ph", "c_buffer"],
      questionCount: 10,
      createdAt: "2026-11-14",
      dueDate: "2026-11-20",
      shareableLink: "https://zana.krd/assignment/chem-ph-101",
    },
    {
      id: "asg-2",
      title: "تاقیکردنەوەی خێرای داتاشراو",
      subject: "بیرکاری",
      concepts: ["c_derivative"],
      questionCount: 8,
      createdAt: "2026-11-15",
      dueDate: "2026-11-22",
      shareableLink: "https://zana.krd/assignment/math-der-202",
    },
  ]);

  // Assignment Creator Modal & Form State
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentSubject, setAssignmentSubject] = useState("کیمیا");
  const [selectedConcepts] = useState<string[]>(["c_buffer"]);
  const [questionCount, setQuestionCount] = useState(10);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Auto-sorted struggling students (lowest average mastery first)
  const strugglingStudents = [...classData.students].sort(
    (a, b) => a.averageScore - b.averageScore
  );

  // Concepts needing intervention (< 40% of class at proficient+)
  const gapConcepts = classData.conceptGaps.filter((c) => c.needsIntervention);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle.trim()) return;

    const newId = `asg-${Date.now()}`;
    const newAssignment: TeacherAssignment = {
      id: newId,
      title: assignmentTitle.trim(),
      subject: assignmentSubject,
      concepts: selectedConcepts,
      questionCount,
      createdAt: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      shareableLink: `https://zana.krd/assignment/${newId}`,
    };

    setAssignments([newAssignment, ...assignments]);
    setAssignmentTitle("");
    setIsCreatingAssignment(false);
  };

  const copyToClipboard = (link: string) => {
    if (navigator?.clipboard) {
      void navigator.clipboard.writeText(link);
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  const exportClassReportJson = () => {
    const reportData = {
      className: classData.className,
      grade: classData.grade,
      stream: classData.stream,
      exportDate: new Date().toISOString(),
      classAverageMastery: classData.averageMastery,
      totalStudents: classData.totalStudents,
      strugglingConceptsRequiringFocus: gapConcepts.map((g) => ({
        conceptId: g.conceptId,
        titleKu: g.titleKu,
        subject: g.subject,
        proficientPercentage: g.proficientPercentage,
      })),
      studentsPerformance: classData.students.map((st) => ({
        studentName: st.studentName,
        email: st.email,
        averageScore: st.averageScore,
        conceptMasteries: st.scores,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Zana_Class_Report_${classData.grade}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-950 flex flex-col h-full overflow-y-auto" dir="rtl">
      {/* 1. Header Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 shrink-0 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-sans text-slate-900 dark:text-white">
                  داشبۆردی مامۆستا (Teacher Dashboard)
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                  {classData.className}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                چاودێری ئاستی لێهاتوویی پۆل، کەلێنی چەمکەکان، دیاریکردنی ئەرک و داگرتنی ڕاپۆرت
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingAssignment(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>دروستکردنی ئەرکی نوێ</span>
            </button>

            <button
              type="button"
              onClick={exportClassReportJson}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>داگرتنی ڕاپۆرتی پۆل (JSON)</span>
            </button>

            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
              >
                گەڕانەوە
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Body */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <span className="text-xs font-bold text-slate-500 font-sans">تێکڕای لێهاتوویی پۆل</span>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                {Math.round(classData.averageMastery * 100)}%
              </span>
              <ProgressRing
                progress={classData.averageMastery * 100}
                size={54}
                strokeWidth={5}
                color="#6366f1"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              کۆی قوتابییانی پۆل: {classData.totalStudents} قوتابی
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <span className="text-xs font-bold text-slate-500 font-sans">قوتابیانی پێویست بە چاودێری</span>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black font-mono text-rose-600">
                {classData.students.filter((s) => s.averageScore < 0.6).length}
              </span>
              <span className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </span>
            </div>
            <p className="text-[11px] text-rose-500 font-sans">
              نمرەی خوار ٦٠٪ لە تێکڕای چەمکەکاندا
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <span className="text-xs font-bold text-slate-500 font-sans">کەلێنی چەمکەکان (Gap Concepts)</span>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black font-mono text-amber-600">
                {gapConcepts.length}
              </span>
              <span className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </span>
            </div>
            <p className="text-[11px] text-amber-600 font-sans">
              کەمتر لە ٤٠٪ی پۆل لە ئاستی لێهاتوودان
            </p>
          </div>
        </div>

        {/* Concept Gap Analysis & Weekly Focus Recommendation Widget */}
        <div className="bg-gradient-to-l from-indigo-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-base font-sans text-white">
                  ڕاسپاردەی ژیریی دەستکرد بۆ ئەم هەفتەیە (Weekly AI Focus)
                </h3>
                <p className="text-xs text-indigo-200 font-sans">
                  بەپێی شیکاریی پۆلەکەت، تەرکیز بخەرە سەر ئەم چەمکانەی کە لەخوار ئاستی لێهاتوویین:
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-300">
              ئامانجی هەفتانە
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {gapConcepts.map((gap) => (
              <div
                key={gap.conceptId}
                className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-4 rounded-2xl border border-white/10 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-amber-300 font-sans">
                    {gap.titleKu} ({gap.subject})
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/80 text-white font-bold">
                    {gap.proficientPercentage}% لێهاتوو
                  </span>
                </div>
                <p className="text-xs text-indigo-100 font-sans">
                  تەنها {gap.proficientPercentage}٪ی پۆلەکە ئەم چەمکەیان بە تەواوی شارەزایە. پێشنیار دەکرێت لە تاقیگە یان لە پۆلدا نموونەی زیاتریان بۆ شیکار بکرێت.
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 1. Class Overview: All students mastery per concept (Grid View) */}
        <MasteryGrid
          students={classData.students}
          concepts={classData.concepts}
          title="خشتەی شیکاریی لێهاتوویی سەرجەم قوتابییان (Class Mastery Grid)"
        />

        {/* 2 Columns: Struggling Students Widget + Assignments Creator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Widget 1: Struggling Students Auto-Sorted */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-sans">
                  قوتابیانی پێویست بە پاڵپشتی (Struggling Students)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 font-sans">
                بەپێی کەمترین تێکڕای نمرە
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {strugglingStudents.slice(0, 4).map((st, idx) => (
                <div
                  key={st.studentId}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/60 font-mono font-bold text-xs text-rose-700 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block font-sans">
                        {st.studentName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans">
                        لاوازترین چەمک: گیراوەی بەفەر ({Math.round(st.scores.c_buffer * 100)}%)
                      </span>
                    </div>
                  </div>

                  <div className="text-left font-mono font-bold text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg">
                    {Math.round(st.averageScore * 100)}% تێکڕا
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 2: Created Assignments & Share Links */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-sans">
                  ئەرکە چالاکەکانی پۆل ({assignments.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingAssignment(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 font-sans cursor-pointer"
              >
                + ئەرکی نوێ
              </button>
            </div>

            <div className="space-y-3">
              {assignments.map((asg) => (
                <div
                  key={asg.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white font-sans">
                      {asg.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
                      {asg.subject} • {asg.questionCount} پرسیار
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                    <span className="text-slate-400 font-sans">
                      وادەی کۆتایی: {asg.dueDate}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(asg.shareableLink)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      {copiedLink === asg.shareableLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">کۆپی کرا!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>کۆپیکردنی بەستەر</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Assignment Creator Modal */}
      {isCreatingAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl"
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white font-sans">
                دروستکردنی ئەرکی نوێ بۆ پۆل
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingAssignment(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ناونیشانی ئەرک:
                </label>
                <input
                  type="text"
                  required
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="وەک: ڕاهێنانی بەهێزکردنی ترش و تفت..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  بابەت:
                </label>
                <select
                  value={assignmentSubject}
                  onChange={(e) => setAssignmentSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="کیمیا">کیمیا</option>
                  <option value="فیزیا">فیزیا</option>
                  <option value="بیرکاری">بیرکاری</option>
                  <option value="زیندەزانی">زیندەزانی</option>
                  <option value="ئینگلیزی">ئینگلیزی</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ژمارەی پرسیارەکان:
                </label>
                <div className="flex items-center gap-2">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`flex-1 py-2 rounded-xl font-bold font-mono transition cursor-pointer ${
                        questionCount === num
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {num} پرسیار
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingAssignment(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  دروستکردن و بەرهەمهێنانی بەستەر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
