/**
 * Types & contracts for the Internal Portal Brain Service (مێشکی زیرەکی ناوخۆی پۆرتاڵ).
 * Enforces permission gates (Level 0 to 5), risk scoring, audit trails, dual approvals,
 * failure learning loops, multi-layer memory, and golden evaluation tests.
 */

// --- 6. ئاستەکانی مۆڵەت و کردار (Action & Permission Levels: 0 to 5) ---
export type ActionLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface ActionLevelDefinition {
  level: ActionLevel;
  name: string;
  nameKu: string;
  capabilities: string;
  capabilitiesKu: string;
  approvalRequired: 'none' | 'risk_dependent' | 'admin_required' | 'dual_stage';
  approvalRequiredKu: string;
  rollbackMandatory: boolean;
}

export const ACTION_LEVEL_DEFINITIONS: Record<ActionLevel, ActionLevelDefinition> = {
  0: {
    level: 0,
    name: 'Informational & Read-Only',
    nameKu: 'وەڵامی زانیاری و خوێندنەوە',
    capabilities: 'Information queries, status inspection, telemetry reads',
    capabilitiesKu: 'وەڵامی زانیاری و خوێندنەوەی دۆخ و تەلەمەتری',
    approvalRequired: 'none',
    approvalRequiredKu: 'پێویست نییە',
    rollbackMandatory: false,
  },
  1: {
    level: 1,
    name: 'Reporting & Diagnostics',
    nameKu: 'ڕاپۆرت، کورتە و پشکنین',
    capabilities: 'Report generation, operational summary, system diagnostics',
    capabilitiesKu: 'report، summary، diagnostics',
    approvalRequired: 'none',
    approvalRequiredKu: 'پێویست نییە',
    rollbackMandatory: false,
  },
  2: {
    level: 2,
    name: 'Drafts & Tagging',
    nameKu: 'ئەرک، بلیت، ڕەشنووس و تاگکردن',
    capabilities: 'Task creation, ticket issuance, proposal drafting, metadata tagging',
    capabilitiesKu: 'task، ticket، draft، tagging',
    approvalRequired: 'none',
    approvalRequiredKu: 'لە زۆربەی حاڵەتدا پێویست نییە',
    rollbackMandatory: true,
  },
  3: {
    level: 3,
    name: 'Data Organization & Cache',
    nameKu: 'نوێکردنەوەی داتا، ڕێکخستنی فایل و کەش',
    capabilities: 'Data update, file organization, cache refresh, index rebuild',
    capabilitiesKu: 'نوێکردنەوەی data، file organization، cache refresh',
    approvalRequired: 'risk_dependent',
    approvalRequiredKu: 'پەسەندکردن بەپێی مەترسی',
    rollbackMandatory: true,
  },
  4: {
    level: 4,
    name: 'System & Production Mutation',
    nameKu: 'گۆڕانکاری سیستەم، دەسەڵات و بەرهەمهێنان',
    capabilities: 'System change, access boundary change, production action, service restart',
    capabilitiesKu: 'system change، access change، production action',
    approvalRequired: 'admin_required',
    approvalRequiredKu: 'پەسەندکردنی بەڕێوەبەر پێویستە',
    rollbackMandatory: true,
  },
  5: {
    level: 5,
    name: 'Critical / Security / Delete',
    nameKu: 'سڕینەوە، وەڵامی ئاسایش، کاری یاسایی/دارایی',
    capabilities: 'Persistent delete, security response, confidential export, financial/legal action',
    capabilitiesKu: 'delete، security response، financial/legal action',
    approvalRequired: 'dual_stage',
    approvalRequiredKu: 'دوو-قۆناغی approval + audit + rollback',
    rollbackMandatory: true,
  },
};

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskAssessment {
  score: number; // 0 - 100
  level: RiskLevel;
  actionLevel: ActionLevel;
  reasons: string[];
  requiresApproval: boolean;
  requiresDualApproval: boolean;
  canRollback: boolean;
  impactedServices: string[];
  affectedFiles?: string[];
}

export type AdminRole = 'super_admin' | 'system_admin' | 'operator' | 'auditor';

export interface AdminUser {
  id: string;
  name: string;
  role: AdminRole;
  email: string;
  permissions: string[];
}

export type ToolCategory = 
  | 'read_only'        // Level 0 & 1
  | 'draft'            // Level 1 & 2
  | 'safe_action'      // Level 2 & 3
  | 'controlled_action'// Level 3 & 4
  | 'restricted';      // Level 4 & 5

export interface ToolDefinition {
  id: string;
  name: string;
  category: ToolCategory;
  actionLevel: ActionLevel;
  description: string;
  descriptionKu: string;
  minRoleRequired: AdminRole;
  isReversible: boolean;
  parametersSchema: Record<string, string>;
}

export type ServiceHealthStatus = 'healthy' | 'degraded' | 'down' | 'maintenance';

export interface ServiceHealth {
  id: string;
  name: string;
  nameKu: string;
  status: ServiceHealthStatus;
  uptime: number;
  latencyMs: number;
  errorRatePercent: number;
  failedJobsCount: number;
  lastChecked: string;
  details?: string;
}

export interface ObservabilitySnapshot {
  timestamp: string;
  overallHealth: ServiceHealthStatus;
  activeIncidentsCount: number;
  pendingApprovalsCount: number;
  services: ServiceHealth[];
  aiFailureRate: number;
  commandSuccessRate: number;
  rollbackSuccessRate: number;
  unusualBehaviorAlerts: number;
}

// --- 7. Failures Learning Loop Schema ---
export type FailureType = 
  | 'wrong_answer'
  | 'incomplete_action'
  | 'tool_failure'
  | 'data_mismatch'
  | 'permission_denied'
  | 'timeout_latency'
  | 'hallucination'
  | 'security_violation';

export interface FailureRecord {
  failure_id: string;
  time: string;
  command: string;
  failure_type: FailureType;
  impact: 'low' | 'medium' | 'high' | 'critical';
  root_cause: string;
  root_cause_ku?: string;
  corrective_action: string;
  corrective_action_ku?: string;
  preventive_action: string;
  preventive_action_ku?: string;
  new_test_created: boolean;
  knowledge_updated: boolean;
  owner: string;
  status: 'open' | 'fixed' | 'verified';
  stagedRolloutTested?: boolean;
}

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'investigating' | 'identified' | 'mitigating' | 'resolved' | 'learned';

export interface RootCauseAnalysis {
  cause: string;
  causeKu: string;
  contributingFactors: string[];
  contributingFactorsKu: string[];
  detectionDelaySeconds: number;
}

export interface CorrectiveAndPreventiveAction {
  correctiveAction: string;
  correctiveActionKu: string;
  preventiveAction: string;
  preventiveActionKu: string;
  autoExecutable: boolean;
  preventiveTestGenerated: boolean;
}

export interface IncidentRecord {
  id: string;
  title: string;
  titleKu: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedService: string;
  startedAt: string;
  resolvedAt?: string;
  rca?: RootCauseAnalysis;
  capa?: CorrectiveAndPreventiveAction;
  generatedTestId?: string;
}

export interface EvaluationTestCase {
  id: string;
  title: string;
  titleKu: string;
  originIncidentId: string;
  category: string;
  testFunctionDescription: string;
  status: 'passed' | 'failed' | 'pending';
  lastRunAt: string;
}

// --- 8. File & Data Operations ---
export type FileOperationType =
  | 'indexing'
  | 'duplicate_detection'
  | 'file_classification'
  | 'archive_suggestion'
  | 'metadata_extraction'
  | 'report_generation'
  | 'safe_rename'
  | 'delete'
  | 'overwrite'
  | 'move_critical'
  | 'permission_change'
  | 'export_confidential';

export interface FileOperationRecord {
  id: string;
  operation: FileOperationType;
  targetPath: string;
  isSensitive: boolean;
  timestamp: string;
  actor: string;
  approvalStatus: 'none_needed' | 'approved' | 'pending' | 'rejected';
  backupSnapshotId?: string;
  rollbackStatus?: 'available' | 'restored' | 'not_applicable';
  auditHash: string;
}

// --- 9. Knowledge Gaps ---
export interface KnowledgeGap {
  id: string;
  topic: string;
  topicKu: string;
  unresolvedQuery: string;
  confidenceScore: number; // 0 - 100
  detectedAt: string;
  resolutionStatus: 'unresolved' | 'investigating' | 'closed';
  proposedPatch?: string;
}

// --- 10. Memory Layers (5 Distinct Types) ---
export interface BaseMemoryItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  retentionDays: number;
  accessLevel: 'public' | 'operator' | 'admin' | 'confidential';
  reviewDate: string;
  confidentialRedacted: boolean;
}

export interface OperationalMemoryItem extends BaseMemoryItem {
  type: 'operational';
  scope: 'incident' | 'log' | 'command_outcome';
  summary: string;
  metrics: Record<string, number>;
}

export interface KnowledgeMemoryItem extends BaseMemoryItem {
  type: 'knowledge';
  category: 'SOP' | 'FAQ' | 'policy' | 'api_docs';
  title: string;
  titleKu: string;
  content: string;
}

export interface AdminPreferenceMemory extends BaseMemoryItem {
  type: 'preference';
  adminId: string;
  notificationFrequency: 'realtime' | 'daily_digest';
  riskToleranceThreshold: number; // 0 - 100
  reportingStyle: 'concise' | 'detailed' | 'technical';
  languagePreference: 'ku' | 'en' | 'bilingual';
}

export interface FailureMemoryItem extends BaseMemoryItem {
  type: 'failure';
  failureId: string;
  rootCause: string;
  lessonLearned: string;
  preventiveRuleId: string;
}

export interface DecisionMemoryItem extends BaseMemoryItem {
  type: 'decision';
  commandId: string;
  decisionRationale: string;
  decisionRationaleKu: string;
  decidedBy: string;
  riskAtDecision: number;
}

export interface KnowledgeEntry {
  id: string;
  category: 'policy' | 'procedure' | 'troubleshooting' | 'curriculum';
  title: string;
  titleKu: string;
  summary: string;
  summaryKu: string;
  updatedAt: string;
  learnedFromIncidentId?: string;
}

// --- 12. Evaluation & KPIs & Golden Tests ---
export interface BrainKPIs {
  commandSuccessRate: number; // %
  meanTimeToDetectSeconds: number; // MTTD
  meanTimeToResolveSeconds: number; // MTTR
  falsePositiveRate: number; // %
  incidentRecurrenceRate: number; // %
  rollbackSuccessRate: number; // %
  adminSatisfaction: number; // 0 - 5
  knowledgeGapClosureRate: number; // %
  unsafeActionBlockRate: number; // %
  auditCompleteness: number; // %
}

export interface GoldenTestCase {
  id: string;
  category:
    | 'command_understanding'
    | 'tool_execution'
    | 'file_safety'
    | 'permission'
    | 'rollback'
    | 'adversarial_prompt'
    | 'multilingual'
    | 'incident_simulation';
  nameKu: string;
  nameEn: string;
  testFunction: string;
  lastRunAt: string;
  status: 'passed' | 'failed' | 'pending';
  executionDurationMs: number;
}

// --- 10-step Execution Framework Phases ---
export type ExecutionPhase = 
  | 'receive'
  | 'understand'
  | 'classify'
  | 'plan'
  | 'simulate'
  | 'approve'
  | 'execute'
  | 'verify'
  | 'report'
  | 'learn';

export interface PlanStep {
  stepNumber: number;
  title: string;
  titleKu: string;
  toolId: string;
  toolCategory: ToolCategory;
  actionLevel: ActionLevel;
  params: Record<string, unknown>;
  expectedOutcome: string;
  expectedOutcomeKu: string;
  isExecuted: boolean;
  status: 'pending' | 'executing' | 'success' | 'failed' | 'skipped';
  executionLog?: string;
}

export interface DualApprovalState {
  primaryApproved: boolean;
  primaryApprover?: string;
  primaryTimestamp?: string;
  secondaryApproved: boolean;
  secondaryApprover?: string;
  secondaryTimestamp?: string;
}

export interface ExecutionPlan {
  commandId: string;
  rawCommand: string;
  intent: string;
  intentKu: string;
  actionLevel: ActionLevel;
  riskAssessment: RiskAssessment;
  steps: PlanStep[];
  simulationSummary: string;
  simulationSummaryKu: string;
  requiresApproval: boolean;
  requiresDualApproval: boolean;
  dualApproval?: DualApprovalState;
  isApproved?: boolean;
  approvedBy?: string;
  approvalTimestamp?: string;
  currentPhase: ExecutionPhase;
  verificationResults?: {
    verified: boolean;
    checks: { name: string; passed: boolean; message: string }[];
  };
  rollbackAvailable: boolean;
  rollbackPlanSummary: string;
  rollbackPlanSummaryKu: string;
  rollbackTriggered?: boolean;
  rollbackSuccess?: boolean;
  resultReport?: string;
  resultReportKu?: string;
  learningsRecorded?: string[];
  affectedFiles?: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    role: AdminRole;
  };
  commandId: string;
  commandText: string;
  actionLevel: ActionLevel;
  toolCategory: ToolCategory;
  riskScore: number;
  riskLevel: RiskLevel;
  approvedBy?: string;
  dualApprovedBy?: string;
  executionStatus: 'success' | 'failure' | 'rolled_back' | 'rejected' | 'security_blocked';
  verificationPassed: boolean;
  rollbackEligible: boolean;
  tamperProofHash: string;
  previousHash: string;
}
