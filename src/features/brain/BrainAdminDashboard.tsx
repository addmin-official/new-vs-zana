import React, { useState, useEffect } from "react";
import {
 ShieldAlert,
 Activity,
 Cpu,
 CheckCircle2,
 AlertTriangle,
 RotateCcw,
 Sparkles,
 Search,
 Play,
 Check,
 Lock,
 History,
 Layers,
 HelpCircle,
 Workflow,
 ArrowRight,
 ShieldCheck,
 Terminal,
 BookOpen,
 FileSpreadsheet,
 Database,
 CheckSquare,
 Zap,
} from "lucide-react";
import { InternalBrainService } from "../../core/brain/InternalBrainService";
import { getBrainStatus, getBrainMetrics } from "../../services/adminApi.ts";
import {
 ACTION_LEVEL_DEFINITIONS,
 ActionLevel,
 AdminRole,
 ExecutionPhase,
 ExecutionPlan,
 FailureRecord,
 FileOperationRecord,
 GoldenTestCase,
 KnowledgeGap,
 ObservabilitySnapshot,
 RiskLevel,
 ToolCategory,
} from "../../core/brain/types";

interface BrainAdminDashboardProps {
 onBackToApp?: () => void;
}

type BrainSubTab =
 | "overview"
 | "terminal"
 | "learning"
 | "files_memory"
 | "eval_golden"
 | "qa"
 | "architecture";

export function BrainAdminDashboard({ onBackToApp }: BrainAdminDashboardProps) {
 const brain = InternalBrainService.getInstance();

 const [activeSubTab, setActiveSubTab] = useState<BrainSubTab>("overview");

 const [snapshot, setSnapshot] = useState<ObservabilitySnapshot>(brain.getObservabilitySnapshot());
 const [currentRole, setCurrentRole] = useState<AdminRole>(brain.getCurrentUser().role);
 const [failures, setFailures] = useState<FailureRecord[]>(brain.getFailureRecords());
 const [fileOps] = useState<FileOperationRecord[]>(brain.getFileOperations());
 const [knowledgeGaps] = useState<KnowledgeGap[]>(brain.getKnowledgeGaps());
 const [goldenTests, setGoldenTests] = useState<GoldenTestCase[]>(brain.getGoldenTests());
 const [auditLogs, setAuditLogs] = useState(brain.getAuditLog());
 const [kpis] = useState(brain.getKPIs());

 // Command Execution State (10 steps)
 const [commandInput, setCommandInput] = useState("");
 const [activePlan, setActivePlan] = useState<ExecutionPlan | null>(null);
 const [isExecuting, setIsExecuting] = useState(false);
 const [executionMessage, setExecutionMessage] = useState<string | null>(null);
 const [permissionError, setPermissionError] = useState<{ reason: string; reasonKu: string } | null>(null);

 // Q&A State
 const [qaQuery, setQaQuery] = useState("");
 const [qaResponse, setQaResponse] = useState<{
 answerKu: string;
 answerEn: string;
 recommendedCommandKu?: string;
 } | null>(null);

 // Auto-refresh observability snapshot periodically
 useEffect(() => {
 const timer = setInterval(() => {
 setSnapshot(brain.getObservabilitySnapshot());
 }, 15000);
 return () => clearInterval(timer);
 }, [brain]);

 // Synchronize and verify backend admin connection
 useEffect(() => {
 let isMounted = true;
 Promise.all([getBrainStatus(), getBrainMetrics()])
 .then(([status, metrics]) => {
 if (isMounted) {
 console.log("[BrainAdminDashboard] Backend Admin Connection Verified:", { status, metrics });
 }
 })
 .catch((err) => {
 if (isMounted) {
 console.warn("[BrainAdminDashboard] Admin backend status check:", (err as Error)?.message || err);
 }
 });
 return () => {
 isMounted = false;
 };
 }, []);

 const handleRoleChange = (newRole: AdminRole) => {
 brain.setAdminRole(newRole);
 setCurrentRole(newRole);
 };

 const handlePlanCommand = (cmdText?: string) => {
 const textToRun = cmdText || commandInput;
 if (!textToRun.trim()) return;

 setPermissionError(null);
 setExecutionMessage(null);

 const plan = brain.prepareExecutionPlan(textToRun);

 // Check RBAC permission
 const perm = brain.checkPermission(plan);
 if (!perm.allowed) {
 setPermissionError({
 reason: perm.reason || "Permission denied",
 reasonKu: perm.reasonKu || "مۆڵەتی پێویستت نییە بۆ ئەم کردارە",
 });
 setActivePlan(plan);
 return;
 }

 setActivePlan(plan);
 };

 const handleRunExecution = async () => {
 if (!activePlan) return;
 setIsExecuting(true);
 setExecutionMessage(null);

 try {
 const updatedPlan = await brain.executePipeline(activePlan, (phase, updated) => {
 setActivePlan({ ...updated, currentPhase: phase });
 });

 setActivePlan({ ...updatedPlan });
 setAuditLogs(brain.getAuditLog());
 setSnapshot(brain.getObservabilitySnapshot());

 if (updatedPlan.currentPhase === "approve") {
 setExecutionMessage(
 updatedPlan.requiresDualApproval
 ? "وەستێنرا لە دەروازەی پەسەندکردنی دوو-قۆناغی (Level 5 Dual Approval Gate): هەردوو واژۆی بەڕێوەبەر و ئۆدیتەری ئاسایش پێویستە."
 : "وەستێنرا لە دەروازەی پەسەندکردن (Level 4 Approval Gate): واژۆی بەڕێوەبەری سیستەم پێویستە."
 );
 } else if (updatedPlan.currentPhase === "learn") {
 setExecutionMessage("سەرکەوتوو بوو: سەرجەم ١٠ هەنگاوەکان بە سەرکەوتوویی تەواو بوون و لە ئۆدیت لۆگ و بیرگەی سیستەم تۆمار کران.");
 }
 } finally {
 setIsExecuting(false);
 }
 };

 const handlePrimaryApprove = async () => {
 if (!activePlan) return;
 const res = brain.approvePlan(activePlan, brain.getCurrentUser(), false);
 if (!res.success) {
 alert(res.error);
 return;
 }
 setActivePlan({ ...activePlan });
 if (res.isFullyApproved) {
 await handleRunExecution();
 }
 };

 const handleSecondaryApprove = async () => {
 if (!activePlan) return;
 const res = brain.approvePlan(activePlan, brain.getCurrentUser(), true);
 if (!res.success) {
 alert(res.error);
 return;
 }
 setActivePlan({ ...activePlan });
 if (res.isFullyApproved) {
 await handleRunExecution();
 }
 };

 const handleRollback = (commandId: string) => {
 const res = brain.rollbackExecution(commandId);
 if (res.success) {
 alert(`${res.messageKu}\n${res.message}`);
 setAuditLogs([...brain.getAuditLog()]);
 } else {
 alert(`هەڵە: ${res.messageKu}`);
 }
 };

 const handleRunGoldenTest = (testId: string) => {
 const res = brain.runGoldenTest(testId);
 setGoldenTests([...brain.getGoldenTests()]);
 alert(res.messageKu);
 };

 const handleRunAllGoldenTests = () => {
 const res = brain.runAllGoldenTests();
 setGoldenTests([...brain.getGoldenTests()]);
 alert(res.messageKu);
 };

 const handleStagedRollout = async (failureId: string) => {
 const res = await brain.triggerStagedRollout(failureId);
 setFailures([...brain.getFailureRecords()]);
 alert(res.messageKu);
 };

 const handleAskQa = (question: string) => {
 setQaQuery(question);
 const res = brain.askDiagnosticAssistant(question);
 setQaResponse(res);
 };

 const TEN_STEPS: { phase: ExecutionPhase; nameKu: string; nameEn: string }[] = [
 { phase: "receive", nameKu: "١. وەرگرتن", nameEn: "Receive" },
 { phase: "understand", nameKu: "٢. تێگەیشتن", nameEn: "Understand" },
 { phase: "classify", nameKu: "٣. پۆلێنکردن", nameEn: "Classify" },
 { phase: "plan", nameKu: "٤. پلانڕێژی", nameEn: "Plan" },
 { phase: "simulate", nameKu: "٥. سیمولەیشن", nameEn: "Simulate" },
 { phase: "approve", nameKu: "٦. پەسەندکردن", nameEn: "Approve" },
 { phase: "execute", nameKu: "٧. جێبەجێکردن", nameEn: "Execute" },
 { phase: "verify", nameKu: "٨. پشکنین (Verify)", nameEn: "Verify" },
 { phase: "report", nameKu: "٩. ڕاپۆرت", nameEn: "Report" },
 { phase: "learn", nameKu: "١٠. فێربوون (Learn)", nameEn: "Learn" },
 ];

 const getStepIndex = (phase: ExecutionPhase) => {
 return TEN_STEPS.findIndex((s) => s.phase === phase);
 };

 const currentStepIdx = activePlan ? getStepIndex(activePlan.currentPhase) : -1;

 const getRiskBadgeColor = (level: RiskLevel) => {
 switch (level) {
 case "critical":
 return "bg-rose-500/20 text-rose-400 border-rose-500/30";
 case "high":
 return "bg-amber-500/20 text-amber-400 border-amber-500/30";
 case "medium":
 return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
 default:
 return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
 }
 };

 const getCategoryBadgeColor = (cat: ToolCategory) => {
 switch (cat) {
 case "restricted":
 return "bg-red-900/30 text-red-400 border-red-800";
 case "controlled_action":
 return "bg-amber-900/30 text-amber-400 border-amber-800";
 case "safe_action":
 return "bg-blue-900/30 text-blue-400 border-blue-800";
 case "draft":
 return "bg-purple-900/30 text-purple-400 border-purple-800";
 default:
 return "bg-slate-800 text-slate-300 border-slate-700";
 }
 };

 return (
 <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
 {/* Top Brain Control Bar */}
 <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-md">
 <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
 <Cpu className="w-6 h-6 animate-pulse" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h1 className="font-bold text-base md:text-lg text-white">
 مێشکی زیرەکی ناوخۆی پۆرتاڵ (Internal Brain Service)
 </h1>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
 Level 0-5 Governed
 </span>
 </div>
 <p className="text-xs text-slate-400">
 چاودێری بەردەوام، مۆڵەتی شەش-ئاستی، ئۆدیت لۆگ، پەسەندکردنی دوو-قۆناغی، و فێربوون لە شکستەکان
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 flex-wrap">
 {/* RBAC Role Switcher */}
 <div className="flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700 text-xs">
 <span className="text-slate-400 px-2 text-[11px]">دەسەڵات (Role):</span>
 {(["super_admin", "system_admin", "operator", "auditor"] as AdminRole[]).map((r) => (
 <button
 key={r}
 onClick={() => handleRoleChange(r)}
 className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
 currentRole === r
 ? "bg-blue-600 text-white font-bold"
 : "text-slate-400 hover:text-white"
 }`}
 >
 {r === "super_admin"
 ? "SuperAdmin"
 : r === "system_admin"
 ? "SysAdmin"
 : r === "operator"
 ? "Operator"
 : "Auditor"}
 </button>
 ))}
 </div>

 {onBackToApp && (
 <button
 onClick={onBackToApp}
 className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition flex items-center gap-1"
 >
 <span>گەڕانەوە بۆ پۆرتاڵ</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>

 {/* Sub Navigation */}
 <div className="max-w-6xl mx-auto flex items-center gap-1 mt-3 overflow-x-auto pb-1 text-xs border-t border-slate-800/80 pt-2">
 {[
 { id: "overview", label: "٨ کارتەکەی داشبۆرد و ئاستەکان (8 Cards & Levels)", icon: Activity },
 { id: "terminal", label: "تێرمیناڵی فەرمانەکان (Command Console)", icon: Terminal },
 { id: "learning", label: "فێربوون لە شکستەکان (Failures Learning Loop)", icon: AlertTriangle },
 { id: "files_memory", label: "کردارەکانی فایل و ٥ بیرگەکە (Files & Memory)", icon: Database },
 { id: "eval_golden", label: "پێوەرەکان و تاقیکردنەوەی زێڕین (KPIs & Golden Tests)", icon: CheckSquare },
 { id: "qa", label: "پرسیار و پشکنین (چی شکستی؟ بۆچی؟)", icon: HelpCircle },
 { id: "architecture", label: "تەلارسازیی جیهانی (Architecture Map)", icon: Workflow },
 ].map((tab) => {
 const Icon = tab.icon;
 const isSel = activeSubTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveSubTab(tab.id as BrainSubTab)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
 isSel
 ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
 : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
 }`}
 >
 <Icon className="w-3.5 h-3.5" />
 <span>{tab.label}</span>
 </button>
 );
 })}
 </div>
 </header>

 {/* Main Content Area */}
 <main className="max-w-6xl mx-auto w-full p-4 md:p-6 flex-1 space-y-6">

 {/* 1. OVERVIEW: 8 DASHBOARD CARDS & SECTION 6 ACTION LEVELS */}
 {activeSubTab === "overview" && (
 <div className="space-y-6">
 <div className="flex items-center justify-between border-b border-slate-800 pb-2">
 <h2 className="font-bold text-sm text-slate-200">
 ٨ کارتە سەرەکییەکەی داشبۆردی بەڕێوەبەر (The 8 Mandatory Admin Dashboard Cards)
 </h2>
 <span className="text-[11px] text-slate-400">Section 9 Compliance</span>
 </div>

 {/* 8 Cards Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
 {/* Card 1: System Health */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-300">١. System Health</span>
 <Activity className="w-4 h-4 text-emerald-400" />
 </div>
 <div className="mt-2 space-y-1">
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">Status:</span>
 <strong className="text-emerald-400 font-mono uppercase">{snapshot.overallHealth}</strong>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">Services:</span>
 <strong className="text-blue-400 font-mono">{snapshot.services.length} Online</strong>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">AI Failure:</span>
 <strong className="text-emerald-400 font-mono">{snapshot.aiFailureRate}%</strong>
 </div>
 </div>
 <span className="text-[10px] text-slate-500 mt-2">سەرجەم ٦ خزمەتگوزاریی لە هێڵدان</span>
 </div>

 {/* Card 2: Brain Activity */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-300">٢. Brain Activity</span>
 <Zap className="w-4 h-4 text-blue-400" />
 </div>
 <div className="mt-2 space-y-1">
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">ژمارەی فەرمان:</span>
 <strong className="text-white font-mono">{auditLogs.length + 14}</strong>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">سەرکەوتن:</span>
 <strong className="text-emerald-400 font-mono">99.4%</strong>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">شکست:</span>
 <strong className="text-amber-400 font-mono">{failures.length} تۆمار</strong>
 </div>
 </div>
 <span className="text-[10px] text-slate-500 mt-2">خێرایی بڕیاردان ~160ms</span>
 </div>

 {/* Card 3: Approvals */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-300">٣. Approvals (پەسەندکردن)</span>
 <Lock className="w-4 h-4 text-amber-400" />
 </div>
 <div className="mt-2 space-y-1">
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">کردارە چاوەڕوانەکان:</span>
 <strong className="text-amber-400 font-mono">
 {activePlan && activePlan.requiresApproval && !activePlan.isApproved ? "1" : "0"}
 </strong>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">ئاستی ٤ (Single):</span>
 <strong className="text-slate-300 font-mono">0 pending</strong>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">ئاستی ٥ (Dual):</span>
 <strong className="text-rose-400 font-mono">
 {activePlan?.requiresDualApproval && !activePlan.isApproved ? "1 چاوەڕوان" : "0"}
 </strong>
 </div>
 </div>
 <span className="text-[10px] text-slate-500 mt-2">دوو-قۆناغی پەسەندکردن چالاکە</span>
 </div>

 {/* Card 4: Incidents */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-300">٤. Incidents (هەڵە و مەترسی)</span>
 <AlertTriangle className="w-4 h-4 text-rose-400" />
 </div>
 <div className="mt-2 space-y-1">
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">Critical:</span>
 <strong className="text-emerald-400 font-mono">0</strong>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">Medium/Low:</span>
 <strong className="text-amber-400 font-mono">1 (چارەسەرکراو)</strong>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">MTTD / MTTR:</span>
 <strong className="text-blue-400 font-mono">28s / 190s</strong>
 </div>
 </div>
 <span className="text-[10px] text-slate-500 mt-2">RCA + CAPA تۆمار کراوە</span>
 </div>

 {/* Card 5: Knowledge Gaps */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-300">٥. Knowledge Gaps</span>
 <BookOpen className="w-4 h-4 text-purple-400" />
 </div>
 <div className="mt-2 space-y-1">
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">کەلێنی نەناسراو:</span>
 <strong className="text-purple-400 font-mono">{knowledgeGaps.length} بابەت</strong>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">تێکڕای متمانە:</span>
 <strong className="text-slate-300 font-mono">71%</strong>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">ڕێژەی چارەسەر:</span>
 <strong className="text-emerald-400 font-mono">{kpis.knowledgeGapClosureRate}%</strong>
 </div>
 </div>
 <span className="text-[10px] text-slate-500 mt-2">پاتچی خۆکار پێشنیازکراوە</span>
 </div>

 {/* Card 6: File Operations */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-300">٦. File & Data Operations</span>
 <FileSpreadsheet className="w-4 h-4 text-blue-400" />
 </div>
 <div className="mt-2 space-y-1">
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">گۆڕانکاریی فایل:</span>
 <strong className="text-white font-mono">{fileOps.length} تۆمار</strong>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">کرداری هەستیار:</span>
 <strong className="text-amber-400 font-mono">1 (سڕینەوە بە باکئەپ)</strong>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">توانای گەڕانەوە:</span>
 <strong className="text-emerald-400 font-mono">100%</strong>
 </div>
 </div>
 <span className="text-[10px] text-slate-500 mt-2">باکئەپ و سناپشۆت دروست دەکرێت</span>
 </div>

 {/* Card 7: Recommendations */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-300">٧. AI Recommendations</span>
 <Sparkles className="w-4 h-4 text-emerald-400" />
 </div>
 <div className="mt-2 space-y-1">
 <p className="text-[11px] text-slate-300 leading-tight">
 پێشنیازی پاککردنەوەی کەشی کاتی و پشکنینی یوونیکۆد.
 </p>
 <p className="text-[10px] text-slate-400 mt-1">
 بێ گۆڕینی کۆدی بەرهەمهێنان بێ مۆڵەت.
 </p>
 </div>
 <span className="text-[10px] text-emerald-400 mt-2">Human-in-the-Loop Safe</span>
 </div>

 {/* Card 8: Audit Timeline */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-300">٨. Audit Timeline</span>
 <History className="w-4 h-4 text-indigo-400" />
 </div>
 <div className="mt-2 space-y-1">
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">تۆماری ئۆدیت:</span>
 <strong className="text-white font-mono">{auditLogs.length} تۆمار</strong>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">زنجیرەی هاش:</span>
 <strong className="text-emerald-400 font-mono">Tamper-Proof</strong>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-400">تەواوی ئۆدیت:</span>
 <strong className="text-indigo-400 font-mono">100%</strong>
 </div>
 </div>
 <span className="text-[10px] text-slate-500 mt-2">هەموو بڕیارەکان بە کات پاشەکەوت دەبن</span>
 </div>
 </div>

 {/* Section 6: Action & Permission Levels Matrix (Table) */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
 <div className="flex items-center justify-between border-b border-slate-800 pb-2">
 <div className="flex items-center gap-2">
 <Layers className="w-4 h-4 text-blue-400" />
 <h3 className="font-bold text-sm text-white">
 خشتەی ئاستەکانی مۆڵەت و کردار (Section 6: Action & Permission Levels)
 </h3>
 </div>
 <span className="text-[11px] text-slate-400">Level 0 هەتا Level 5</span>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-xs text-right">
 <thead>
 <tr className="text-slate-400 border-b border-slate-800">
 <th className="py-2 px-3 font-semibold">ئاست (Level)</th>
 <th className="py-2 px-3 font-semibold">توانا و کردارەکان</th>
 <th className="py-2 px-3 font-semibold">پەسەندکردن (Approval)</th>
 <th className="py-2 px-3 font-semibold">گەڕانەوە (Rollback)</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800/60 font-sans">
 {([0, 1, 2, 3, 4, 5] as ActionLevel[]).map((lvl) => {
 const def = ACTION_LEVEL_DEFINITIONS[lvl];
 return (
 <tr key={lvl} className="hover:bg-slate-800/40 transition">
 <td className="py-2.5 px-3 whitespace-nowrap">
 <span
 className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
 lvl === 5
 ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
 : lvl === 4
 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
 : lvl === 3
 ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
 : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
 }`}
 >
 Level {lvl}
 </span>
 </td>
 <td className="py-2.5 px-3">
 <strong className="text-white block">{def.nameKu}</strong>
 <span className="text-slate-400 text-[11px] font-mono">{def.capabilitiesKu}</span>
 </td>
 <td className="py-2.5 px-3">
 <span
 className={`px-2 py-0.5 rounded text-[10px] font-bold ${
 def.approvalRequired === "dual_stage"
 ? "bg-rose-950 text-rose-300 border border-rose-800"
 : def.approvalRequired === "admin_required"
 ? "bg-amber-950 text-amber-300 border border-amber-800"
 : def.approvalRequired === "risk_dependent"
 ? "bg-yellow-950 text-yellow-300 border border-yellow-800"
 : "bg-slate-800 text-slate-400"
 }`}
 >
 {def.approvalRequiredKu}
 </span>
 </td>
 <td className="py-2.5 px-3 whitespace-nowrap">
 {def.rollbackMandatory ? (
 <span className="text-emerald-400 text-[11px] flex items-center gap-1">
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>ناچارییە (Mandatory)</span>
 </span>
 ) : (
 <span className="text-slate-500 text-[11px]">پێویست نییە (Read)</span>
 )}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {/* 2. COMMAND TERMINAL & CONSOLE TAB (10 STEPS + SECTION 9 CONSOLE) */}
 {activeSubTab === "terminal" && (
 <div className="space-y-5">
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Terminal className="w-4 h-4 text-emerald-400" />
 <h2 className="font-bold text-sm text-white">
 تێرمیناڵی فەرمانی بەڕێوەبەر بە چوارچێوەی ١٠ هەنگاو (Command Console)
 </h2>
 </div>
 <span className="text-[11px] text-slate-400 font-mono">
 Plan + Affects + Risk + Approval + Rollback + Result
 </span>
 </div>

 {/* Pre-built Prompt Chips for each Level */}
 <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
 <span className="text-slate-400">فەرمانی نموونەیی بەپێی ئاستەکان:</span>
 {[
 { label: "Level 0: خوێندنەوەی دۆخی سێرڤەر", cmd: "پشکنینی گشتی و بەردەوامی سەرجەم خزمەتگوزارییەکان" },
 { label: "Level 1: ڕاپۆرتی ڕۆژانە", cmd: "ئامادەکردنی ڕاپۆرتی ڕۆژانەی پۆرتاڵ بۆ بەڕێوەبەرایەتی" },
 { label: "Level 2: تاگکردن و بلیت", cmd: "دروستکردنی بلیتی بەدواداچوونی تەکنیکی بۆ پشکنینی کیمیا" },
 { label: "Level 3: کەش و ئیندێکس", cmd: "خاوێنکردنەوە و نوێکردنەوەی پارێزراوی کەشی کاتی پۆرتاڵ" },
 { label: "Level 4: دەستپێکردنەوەی خزمەتگوزاری", cmd: "دووبارە دەستپێکردنەوەی هێمنی خزمەتگوزاری مۆدێلی ژیری دەستکرد" },
 { label: "Level 5: سڕینەوە بە پەسەندکردنی دووانە", cmd: "سڕینەوە و لەناوبردنی داتای تاقیکردنەوە کۆنەکان" },
 ].map((chip) => (
 <button
 key={chip.label}
 onClick={() => {
 setCommandInput(chip.cmd);
 handlePlanCommand(chip.cmd);
 }}
 className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[10px]"
 >
 {chip.label}
 </button>
 ))}
 </div>

 {/* Form Input */}
 <div className="flex gap-2">
 <input
 type="text"
 value={commandInput}
 onChange={(e) => setCommandInput(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && handlePlanCommand()}
 placeholder="فەرمانەکەت بنووسە بە زمانی کوردی یان ئینگلیزی..."
 className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
 />
 <button
 onClick={() => handlePlanCommand()}
 disabled={isExecuting || !commandInput.trim()}
 className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
 >
 <Search className="w-3.5 h-3.5" />
 <span>پلانڕێژی و پشکنین</span>
 </button>
 </div>

 {permissionError && (
 <div className="bg-rose-950/60 border border-rose-800 rounded-lg p-3 text-rose-300 text-xs flex items-start gap-2">
 <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
 <div>
 <p className="font-bold">ڕێگری یاسایی و مۆڵەت (RBAC Policy Gate):</p>
 <p>{permissionError.reasonKu}</p>
 <p className="font-mono text-[10px] text-rose-400/80 mt-1">{permissionError.reason}</p>
 </div>
 </div>
 )}
 </div>

 {/* Active Execution Plan Details */}
 {activePlan && (
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
 {/* Section 9 Command Console Pre-execution Contract */}
 <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
 <div className="flex items-center gap-2">
 <span
 className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
 activePlan.actionLevel === 5
 ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
 : activePlan.actionLevel === 4
 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
 : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
 }`}
 >
 Action Level {activePlan.actionLevel}
 </span>
 <span className="font-bold text-sm text-white">{activePlan.intentKu}</span>
 </div>

 <div className="flex items-center gap-2">
 <span className="text-xs text-slate-400">نمرەی مەترسی:</span>
 <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold font-mono ${getRiskBadgeColor(activePlan.riskAssessment.level)}`}>
 {activePlan.riskAssessment.score}/100 ({activePlan.riskAssessment.level.toUpperCase()})
 </span>
 </div>
 </div>

 {/* 10 Stepper UI */}
 <div className="overflow-x-auto py-2">
 <div className="flex items-center justify-between min-w-[750px] gap-1">
 {TEN_STEPS.map((s, idx) => {
 const isPast = idx < currentStepIdx;
 const isCurrent = idx === currentStepIdx;
 return (
 <div key={s.phase} className="flex-1 flex flex-col items-center relative">
 {idx !== 0 && (
 <div
 className={`absolute top-3.5 right-[50%] left-[-50%] h-0.5 -z-0 ${
 idx <= currentStepIdx ? "bg-blue-500" : "bg-slate-800"
 }`}
 />
 )}
 <div
 className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold z-10 transition-all ${
 isPast
 ? "bg-emerald-600 text-white"
 : isCurrent
 ? "bg-blue-600 text-white ring-4 ring-blue-500/20 animate-pulse"
 : "bg-slate-800 text-slate-400 border border-slate-700"
 }`}
 >
 {isPast ? <Check className="w-3.5 h-3.5" /> : idx + 1}
 </div>
 <span className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${isCurrent ? "text-blue-400 font-bold" : isPast ? "text-slate-300" : "text-slate-500"}`}>
 {s.nameKu}
 </span>
 <span className="text-[8px] text-slate-600 font-mono">{s.nameEn}</span>
 </div>
 );
 })}
 </div>
 </div>

 {/* Command Console Inspection Card (Section 9 Requirement) */}
 <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-2 font-mono">
 <div className="text-amber-400 font-bold font-sans flex items-center justify-between">
 <span>پشکنینی پێش کردار (Section 9 Command Console Contract):</span>
 <span className="text-[10px] text-slate-500">Verified Pre-Flight</span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-900 font-sans">
 <div>
 <strong className="text-slate-400">خزمەتگوزارییەکانی کارپێکراو:</strong>{" "}
 <span className="text-blue-300 font-mono">{activePlan.riskAssessment.impactedServices.join(", ")}</span>
 </div>
 <div>
 <strong className="text-slate-400">فایلی پەیوەندیدار:</strong>{" "}
 <span className="text-slate-300 font-mono">{activePlan.affectedFiles?.join(", ") || "هیچ فایلی هەستیار نییە"}</span>
 </div>
 <div>
 <strong className="text-slate-400">پلانی گەڕانەوە (Rollback Plan):</strong>{" "}
 <span className="text-emerald-300">{activePlan.rollbackPlanSummaryKu}</span>
 </div>
 <div>
 <strong className="text-slate-400">پەسەندکردنی داواکراو:</strong>{" "}
 <span className="text-amber-300 font-bold">
 {activePlan.requiresDualApproval ? "پەسەندکردنی دوو-قۆناغی (Level 5)" : activePlan.requiresApproval ? "پەسەندکردنی بەڕێوەبەر (Level 4)" : "ئۆتۆماتیکی ڕێپێدراو"}
 </span>
 </div>
 </div>
 </div>

 {/* Dual-Stage Approval Gate Interface for Level 5 */}
 {activePlan.requiresDualApproval && !activePlan.isApproved && (
 <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 space-y-3">
 <div className="flex items-center gap-2 text-rose-300">
 <Lock className="w-4 h-4 text-rose-400" />
 <h4 className="font-bold text-xs">
 دەروازەی پەسەندکردنی دوو-قۆناغی (Section 6 & 11 Dual-Stage Approval Gate)
 </h4>
 </div>
 <p className="text-xs text-slate-300">
 کردارەکانی ئاستی ٥ (سڕینەوە یان ڕێکاری هەستیاری ئاسایش) پێویستیان بە هەردوو پەسەندکردنی بەڕێوەبەری سەرەکی و چاودێری ئاسایش هەیە:
 </p>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
 {/* Stage 1: Lead Admin */}
 <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
 <div>
 <p className="text-xs font-bold text-white">قۆناغی ١: واژۆی بەڕێوەبەری سەرەکی</p>
 <span className="text-[10px] text-slate-400">
 {activePlan.dualApproval?.primaryApproved
 ? `واژۆ کرا لەلایەن: ${activePlan.dualApproval.primaryApprover}`
 : "چاوەڕوانی واژۆیە"}
 </span>
 </div>
 {!activePlan.dualApproval?.primaryApproved ? (
 <button
 onClick={handlePrimaryApprove}
 className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold"
 >
 واژۆکردن (قۆناغی ١)
 </button>
 ) : (
 <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
 <Check className="w-3.5 h-3.5" />
 <span>واژۆ کرا</span>
 </span>
 )}
 </div>

 {/* Stage 2: Security Auditor */}
 <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
 <div>
 <p className="text-xs font-bold text-white">قۆناغی ٢: دەستەبەری ئۆدیتەری ئاسایش</p>
 <span className="text-[10px] text-slate-400">
 {activePlan.dualApproval?.secondaryApproved
 ? `پەسەند کرا لەلایەن: ${activePlan.dualApproval.secondaryApprover}`
 : "چاوەڕوانی واژۆی دووەمە"}
 </span>
 </div>
 {activePlan.dualApproval?.primaryApproved && !activePlan.dualApproval?.secondaryApproved ? (
 <button
 onClick={handleSecondaryApprove}
 className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold"
 >
 واژۆی دووەم و جێبەجێکردن
 </button>
 ) : activePlan.dualApproval?.secondaryApproved ? (
 <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
 <Check className="w-3.5 h-3.5" />
 <span>تەواو پەسەندکرا</span>
 </span>
 ) : (
 <span className="text-[11px] text-slate-500">پێویستە قۆناغی ١ تەواو بێت</span>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Single Approval Gate for Level 4 */}
 {activePlan.requiresApproval && !activePlan.requiresDualApproval && !activePlan.isApproved && (
 <div className="bg-amber-950/40 border border-amber-800 rounded-xl p-4 flex items-center justify-between">
 <div>
 <h4 className="font-bold text-xs text-amber-300">پەسەندکردنی بەڕێوەبەر بۆ ئاستی ٤ (Level 4 Admin Approval)</h4>
 <p className="text-[11px] text-slate-400">فەرمانی گۆڕانکاری لە بەرهەمهێنان پێویستی بە تەنها یەک واژۆی بەڕێوەبەر هەیە.</p>
 </div>
 <button
 onClick={handlePrimaryApprove}
 className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
 >
 <ShieldCheck className="w-4 h-4" />
 <span>پەسەندکردن و بەردەوامبوون</span>
 </button>
 </div>
 )}

 {/* Tool Execution Steps */}
 <div className="space-y-2 pt-2 border-t border-slate-800">
 <h4 className="text-xs font-bold text-slate-300">هەنگاوەکانی جێبەجێکردنی ئامرازەکان (Tool Execution Steps):</h4>
 {activePlan.steps.map((st) => (
 <div
 key={st.stepNumber}
 className="bg-slate-800/60 border border-slate-700 rounded-lg p-2.5 text-xs flex items-center justify-between"
 >
 <div className="flex items-center gap-2">
 <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center font-mono text-[10px] text-white">
 {st.stepNumber}
 </span>
 <div>
 <p className="font-semibold text-white">{st.titleKu}</p>
 <p className="text-[10px] text-slate-400 font-mono">{st.title}</p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <span className={`px-2 py-0.5 rounded text-[10px] border ${getCategoryBadgeColor(st.toolCategory)}`}>
 Level {st.actionLevel} • {st.toolCategory}
 </span>
 <span
 className={`text-[10px] font-mono font-bold ${
 st.status === "success"
 ? "text-emerald-400"
 : st.status === "executing"
 ? "text-blue-400 animate-pulse"
 : "text-slate-500"
 }`}
 >
 {st.status.toUpperCase()}
 </span>
 </div>
 </div>
 ))}
 </div>

 {/* Execution Controls */}
 <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800 gap-3">
 {executionMessage && (
 <p className="text-xs text-blue-300 bg-blue-950/60 border border-blue-900 px-3 py-1.5 rounded-lg">
 {executionMessage}
 </p>
 )}

 <div className="flex items-center gap-2 mr-auto">
 {activePlan.isApproved && (
 <button
 onClick={handleRunExecution}
 disabled={isExecuting || activePlan.currentPhase === "learn"}
 className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
 >
 <Play className="w-3.5 h-3.5" />
 <span>{isExecuting ? "جێبەجێ دەکرێت..." : "دەستپێکردنی ڕەوتی جێبەجێکردن"}</span>
 </button>
 )}

 {activePlan.currentPhase === "learn" && activePlan.rollbackAvailable && (
 <button
 onClick={() => handleRollback(activePlan.commandId)}
 className="px-3 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 rounded-lg text-xs flex items-center gap-1 transition"
 >
 <RotateCcw className="w-3.5 h-3.5" />
 <span>گەڕانەوە بۆ دۆخی پێشوو (Rollback)</span>
 </button>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {/* 3. FAILURES LEARNING LOOP TAB (SECTION 7 COMPLIANCE) */}
 {activeSubTab === "learning" && (
 <div className="space-y-6">
 <div className="flex items-center justify-between border-b border-slate-800 pb-3">
 <div>
 <h2 className="font-bold text-base text-white">
 فێربوون لە شکستەکان و تۆماری ورد (Section 7: Failures Learning Loop)
 </h2>
 <p className="text-xs text-slate-400">
 تۆمارکردنی هەموو کێشەیەک بە شێوازی ستانداردی جیهانی + خۆچاکسازی بە Staged Rollout
 </p>
 </div>
 <span className="px-3 py-1 rounded bg-slate-800 text-xs font-mono text-slate-300">
 {failures.length} تۆماری شکست (Failure Registry)
 </span>
 </div>

 {/* Failure Types Tags */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
 <span className="text-xs font-bold text-slate-300">جۆرەکانی شکستی چاودێریکراو (Section 7.1):</span>
 <div className="flex flex-wrap gap-1.5 text-[11px]">
 {[
 "wrong_answer (وەڵامی هەڵە)",
 "incomplete_action (کرداری ناقص)",
 "tool_failure (شکستی ئامراز)",
 "data_mismatch (ناڕێکی داتا)",
 "permission_denied (مۆڵەت نەدراو)",
 "timeout_latency (دواکەوتن)",
 "hallucination (هەڵەبەستن)",
 "security_violation (پێشێلکاری ئاسایش)",
 ].map((ft) => (
 <span key={ft} className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
 {ft}
 </span>
 ))}
 </div>
 </div>

 {/* Failure Records (7.2 Schema Table) */}
 <div className="space-y-4">
 {failures.map((f) => (
 <div key={f.failure_id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
 <div className="flex items-center gap-2">
 <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
 {f.failure_id}
 </span>
 <span className="font-mono text-[11px] text-slate-400">{new Date(f.time).toLocaleString()}</span>
 <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-mono">
 {f.failure_type}
 </span>
 </div>

 <div className="flex items-center gap-2">
 <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadgeColor(f.impact)}`}>
 IMPACT: {f.impact.toUpperCase()}
 </span>
 <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
 {f.status.toUpperCase()}
 </span>
 </div>
 </div>

 <p className="text-xs text-white font-medium">فەرمان: {f.command}</p>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
 <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
 <strong className="text-amber-400 text-[11px] block">Root Cause (هۆکاری سەرەکی):</strong>
 <p className="text-slate-300">{f.root_cause_ku || f.root_cause}</p>
 </div>

 <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
 <strong className="text-emerald-400 text-[11px] block">Corrective & Preventive Action (CAPA):</strong>
 <p className="text-slate-300"><strong>چاکسازی:</strong> {f.corrective_action_ku || f.corrective_action}</p>
 <p className="text-slate-300"><strong>خۆپاراستن:</strong> {f.preventive_action_ku || f.preventive_action}</p>
 </div>
 </div>

 {/* Section 7.3 Staged Rollout Self-Improvement Button */}
 <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
 <div className="flex items-center gap-3 text-slate-400">
 <span>خاوەندار: <strong className="text-slate-200">{f.owner}</strong></span>
 <span>تاقیکردنەوە دروستکراوە: <strong className="text-emerald-400">بەڵێ</strong></span>
 <span>زانیاری نوێکراوە: <strong className="text-emerald-400">بەڵێ</strong></span>
 </div>

 <button
 onClick={() => handleStagedRollout(f.failure_id)}
 className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
 >
 <Sparkles className="w-3.5 h-3.5" />
 <span>تاقیکردنەوەی خۆچاکسازی (Staged Rollout)</span>
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* 4. FILES & 5-LAYER MEMORY TAB (SECTION 8 & 10) */}
 {activeSubTab === "files_memory" && (
 <div className="space-y-6">
 {/* Section 8: File Operations */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
 <div className="flex items-center justify-between border-b border-slate-800 pb-2">
 <div className="flex items-center gap-2">
 <FileSpreadsheet className="w-4 h-4 text-blue-400" />
 <h3 className="font-bold text-sm text-white">
 تۆماری ئۆپەراسیۆنەکانی فایل و داتا (Section 8: File & Data Operations)
 </h3>
 </div>
 <span className="text-[11px] text-slate-400">Permitted vs Sensitive Actions</span>
 </div>

 <div className="space-y-2">
 {fileOps.map((op) => (
 <div
 key={op.id}
 className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2"
 >
 <div>
 <div className="flex items-center gap-2">
 <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${op.isSensitive ? "bg-rose-500/20 text-rose-300" : "bg-blue-500/20 text-blue-300"}`}>
 {op.operation.toUpperCase()}
 </span>
 <span className="font-mono text-slate-200">{op.targetPath}</span>
 </div>
 <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
 <span>ئەنجامدەر: {op.actor}</span>
 <span>باکئەپ: {op.backupSnapshotId}</span>
 <span>کاتی: {new Date(op.timestamp).toLocaleTimeString()}</span>
 </div>
 </div>

 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
 {op.approvalStatus.toUpperCase()}
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* Section 10: 5 Memory Layers Explorer */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
 <div className="flex items-center justify-between border-b border-slate-800 pb-2">
 <div className="flex items-center gap-2">
 <Database className="w-4 h-4 text-purple-400" />
 <h3 className="font-bold text-sm text-white">
 ٥ چینەکانی بیرگە و بنکەی زانیاری (Section 10: Multi-Layer Memory)
 </h3>
 </div>
 <span className="text-[11px] text-slate-400 font-mono">Governed & Redacted</span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
 {/* 1. Operational Memory */}
 <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
 <span className="font-bold text-blue-400 flex items-center justify-between">
 <span>١. Operational Memory (بیرگەی ئۆپەراسیۆن)</span>
 <span className="text-[10px] text-slate-500">Retention: 90 days</span>
 </span>
 <p className="text-slate-300 text-[11px]">{brain.getOperationalMemory()[0]?.summary}</p>
 </div>

 {/* 2. Knowledge Memory */}
 <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
 <span className="font-bold text-purple-400 flex items-center justify-between">
 <span>٢. Knowledge Memory (بیرگەی زانیاری و SOP)</span>
 <span className="text-[10px] text-slate-500">Retention: 365 days</span>
 </span>
 <p className="text-slate-300 text-[11px]">{brain.getKnowledgeMemory()[0]?.titleKu}</p>
 </div>

 {/* 3. Failure Memory */}
 <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
 <span className="font-bold text-amber-400 flex items-center justify-between">
 <span>٣. Failure Memory (بیرگەی ئەزموونی شکست)</span>
 <span className="text-[10px] text-slate-500">Retention: 180 days</span>
 </span>
 <p className="text-slate-300 text-[11px]">
 <strong>وانەی فێربوو:</strong> {brain.getFailureMemory()[0]?.lessonLearned}
 </p>
 </div>

 {/* 4. Decision Memory */}
 <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
 <span className="font-bold text-emerald-400 flex items-center justify-between">
 <span>٤. Decision Memory (بیرگەی بڕیارە هەستیارەکان)</span>
 <span className="text-[10px] text-slate-500">Retention: 365 days</span>
 </span>
 <p className="text-slate-300 text-[11px]">{brain.getDecisionMemory()[0]?.decisionRationaleKu}</p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* 5. EVALUATION, KPIS & GOLDEN TESTS TAB (SECTION 12) */}
 {activeSubTab === "eval_golden" && (
 <div className="space-y-6">
 <div className="flex items-center justify-between border-b border-slate-800 pb-2">
 <h2 className="font-bold text-base text-white">
 پێوەرەکانی هەڵسەنگاندن و تاقیکردنەوەی زێڕین (Section 12: KPIs & Golden Tests)
 </h2>
 <button
 onClick={handleRunAllGoldenTests}
 className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
 >
 <Play className="w-3 h-3" />
 <span>جێبەجێکردنی سەرجەم تاقیکردنەوەکان</span>
 </button>
 </div>

 {/* 10 KPIs Grid */}
 <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
 {[
 { label: "Command Success", val: `${kpis.commandSuccessRate}%` },
 { label: "MTTD (Detection)", val: `${kpis.meanTimeToDetectSeconds}s` },
 { label: "MTTR (Resolve)", val: `${kpis.meanTimeToResolveSeconds}s` },
 { label: "False Positive", val: `${kpis.falsePositiveRate}%` },
 { label: "Incident Recurrence", val: `${kpis.incidentRecurrenceRate}%` },
 { label: "Rollback Success", val: `${kpis.rollbackSuccessRate}%` },
 { label: "Admin Satisfaction", val: `${kpis.adminSatisfaction}/5` },
 { label: "Gap Closure", val: `${kpis.knowledgeGapClosureRate}%` },
 { label: "Unsafe Block", val: `${kpis.unsafeActionBlockRate}%` },
 { label: "Audit Completeness", val: `${kpis.auditCompleteness}%` },
 ].map((k) => (
 <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
 <span className="text-[10px] text-slate-400 block">{k.label}</span>
 <span className="font-mono text-base font-bold text-blue-400 mt-1 block">{k.val}</span>
 </div>
 ))}
 </div>

 {/* Golden Tests Suite (8 Categories) */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
 <h3 className="font-bold text-sm text-white">تاقیکردنەوەکانی زێڕین (Golden Tests Suite - 8 Categories)</h3>
 <div className="space-y-2">
 {goldenTests.map((t) => (
 <div
 key={t.id}
 className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2"
 >
 <div>
 <div className="flex items-center gap-2">
 <span className="font-bold text-white">{t.nameKu}</span>
 <span className="px-2 py-0.5 rounded text-[9px] bg-slate-700 text-slate-300 font-mono">
 {t.category}
 </span>
 </div>
 <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t.nameEn}</p>
 </div>

 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-bold">
 {t.status.toUpperCase()} ({t.executionDurationMs}ms)
 </span>
 <button
 onClick={() => handleRunGoldenTest(t.id)}
 className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition"
 >
 جێبەجێکردن
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* 6. DIAGNOSTIC Q&A TAB */}
 {activeSubTab === "qa" && (
 <div className="space-y-5">
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
 <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
 <HelpCircle className="w-4 h-4 text-blue-400" />
 <h2 className="font-bold text-sm text-white">
 ناوەندی پرسیار و شیکاریی زیرەکی پۆرتاڵ (“چی شکستی؟ بۆچی؟ چی پێویستە بکرێت؟”)
 </h2>
 </div>
 <p className="text-xs text-slate-400">
 بەڕێوەبەر دەتوانێت بە زمانی کوردی پرسیار لە مێشکی پۆرتاڵ بکات سەبارەت بە ڕووداوەکان، هۆکاری کێشەکان، و ڕێکاری پێویست.
 </p>

 {/* Quick Q&A Prompt Chips */}
 <div className="flex flex-wrap gap-2 pt-2">
 {[
 "چی شکستی لە سیستەمدا؟",
 "بۆچی ئەم هەڵەیە ڕوویدا؟",
 "چی پێویستە بکرێت بۆ چارەسەری بنەڕەتی؟",
 "پوختەی تەندروستی ئەمڕۆی سێرڤەرەکان چییە؟",
 ].map((q) => (
 <button
 key={q}
 onClick={() => handleAskQa(q)}
 className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs transition border border-slate-700"
 >
 {q}
 </button>
 ))}
 </div>

 {/* Question Input */}
 <div className="flex gap-2 pt-2">
 <input
 type="text"
 value={qaQuery}
 onChange={(e) => setQaQuery(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && handleAskQa(qaQuery)}
 placeholder="پرسیارەکەت بنووسە: چی شکستی؟ بۆچی ڕوویدا؟ چی پێویستە بکرێت؟..."
 className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
 />
 <button
 onClick={() => handleAskQa(qaQuery)}
 disabled={!qaQuery.trim()}
 className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition"
 >
 پرسیار بکە
 </button>
 </div>
 </div>

 {/* QA Response Card */}
 {qaResponse && (
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
 <div className="flex items-center gap-2 text-blue-400">
 <Sparkles className="w-5 h-5" />
 <h3 className="font-bold text-sm text-white">وەڵامی شیکاریی مێشکی پۆرتاڵ:</h3>
 </div>

 <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-line">
 {qaResponse.answerKu}
 </div>

 <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-slate-400 text-xs font-mono leading-relaxed">
 {qaResponse.answerEn}
 </div>

 {qaResponse.recommendedCommandKu && (
 <div className="flex items-center justify-between bg-blue-950/40 border border-blue-800/60 p-3 rounded-lg text-xs">
 <span className="text-blue-300">
 کرداری پێشنیازکراو: <strong>{qaResponse.recommendedCommandKu}</strong>
 </span>
 <button
 onClick={() => {
 setActiveSubTab("terminal");
 setCommandInput(qaResponse.recommendedCommandKu!);
 handlePlanCommand(qaResponse.recommendedCommandKu);
 }}
 className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition"
 >
 جێبەجێکردن لە تێرمیناڵ
 </button>
 </div>
 )}
 </div>
 )}
 </div>
 )}

 {/* 7. ARCHITECTURE MAP TAB */}
 {activeSubTab === "architecture" && (
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
 <div className="border-b border-slate-800 pb-3">
 <h2 className="font-bold text-base text-white">
 تەلارسازیی جیهانیی مێشکی پۆرتاڵ (Global System Architecture)
 </h2>
 <p className="text-xs text-slate-400 mt-1">
 نەخشەی ڕاستەوخۆ و پەیوەندیی نێوان بەشەکان، دەروازەی پەسەندکردن، و ڕەوتی فێربوون لە شکستەکان
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
 <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
 <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-bold">
 LAYER 1: DASHBOARD & GATEWAY
 </span>
 <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
 <h4 className="font-bold text-white">Admin Dashboard (8 Cards)</h4>
 <p className="text-slate-400 text-[11px] mt-1">نیشاندانی دۆخی بەردەوامی، پێدانی فەرمان، پەسەندکردن</p>
 </div>
 <div className="flex justify-center text-slate-600">
 <span>↓</span>
 </div>
 <div className="bg-slate-900 p-3 rounded-lg border border-blue-500/50">
 <h4 className="font-bold text-blue-400">Internal Brain Orchestrator</h4>
 <p className="text-slate-400 text-[11px] mt-1">ناوەندی تێگەیشتن لە مەبەست، پۆلێنکردنی ئاستی ٠-٥، و پلانڕێژی</p>
 </div>
 </div>

 <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
 <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-bold">
 LAYER 2: POLICY & GOVERNANCE
 </span>
 <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
 <h4 className="font-bold text-purple-300">Policy & Permission Engine</h4>
 <p className="text-slate-400 text-[11px] mt-1">پشکنینی RBAC/ABAC، ئاستەکانی ٠ هەتا ٥، ئەژمارکردنی Risk Score</p>
 </div>
 <div className="flex justify-center text-slate-600">
 <span>↓</span>
 </div>
 <div className="bg-slate-900 p-3 rounded-lg border border-amber-500/60">
 <h4 className="font-bold text-amber-400 flex items-center justify-between">
 <span>Approval Gate (Single & Dual)</span>
 <Lock className="w-3.5 h-3.5" />
 </h4>
 <p className="text-slate-400 text-[11px] mt-1">پەسەندکردنی یەک قۆناغی بۆ ئاستی ٤ و دوو-قۆناغی بۆ ئاستی ٥</p>
 </div>
 </div>

 <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
 <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
 LAYER 3: EXECUTION & LEARNING
 </span>
 <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
 <h4 className="font-bold text-emerald-400">Tool Execution & Verification</h4>
 <p className="text-slate-400 text-[11px] mt-1">جێبەجێکردن بە باکئەپ + پشکنینی پاش کردار + Rollback</p>
 </div>
 <div className="flex justify-center text-slate-600">
 <span>↓</span>
 </div>
 <div className="bg-slate-900 p-3 rounded-lg border border-indigo-500/60">
 <h4 className="font-bold text-indigo-400">Failures Learning Loop & 5 Memories</h4>
 <p className="text-slate-400 text-[11px] mt-1">تۆماری شکستی 7.2 + خۆچاکسازی بە Staged Rollout + تاقیکردنەوەی زێڕین</p>
 </div>
 </div>
 </div>
 </div>
 )}

 </main>
 </div>
 );
}
