import { z } from "zod";

export const UserRoleSchema = z.enum(["user", "admin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: UserRoleSchema.default("user"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  emailVerified: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type User = z.infer<typeof UserSchema>;

export const DecisionStatusSchema = z.enum(["draft", "active", "archived", "completed"]);
export type DecisionStatus = z.infer<typeof DecisionStatusSchema>;

export const DecisionCategorySchema = z.enum([
  "career",
  "education",
  "finance",
  "business",
  "personal",
  "project",
  "resource_allocation",
  "other",
]);
export type DecisionCategory = z.infer<typeof DecisionCategorySchema>;

export const DecisionSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).nullable().optional(),
  category: DecisionCategorySchema.default("other"),
  status: DecisionStatusSchema.default("draft"),
  question: z.string().min(1).max(1000),
  deadline: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Decision = z.infer<typeof DecisionSchema>;

export const AlternativeSchema = z.object({
  id: z.string().uuid(),
  decisionId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  order: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Alternative = z.infer<typeof AlternativeSchema>;

export const CriterionDirectionSchema = z.enum(["maximize", "minimize"]);
export type CriterionDirection = z.infer<typeof CriterionDirectionSchema>;

export const CriterionSchema = z.object({
  id: z.string().uuid(),
  decisionId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).nullable().optional(),
  weight: z.number().min(0).max(100),
  direction: CriterionDirectionSchema.default("maximize"),
  order: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Criterion = z.infer<typeof CriterionSchema>;

export const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const OutcomeSchema = z.object({
  id: z.string().uuid(),
  alternativeId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  probability: z.number().min(0).max(1),
  monetaryPayoff: z.number().nullable().optional(),
  utilityScore: z.number().min(0).max(100).nullable().optional(),
  riskLevel: RiskLevelSchema.default("low"),
  order: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Outcome = z.infer<typeof OutcomeSchema>;

export const ScenarioSchema = z.object({
  id: z.string().uuid(),
  decisionId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  isBaseline: z.boolean().default(false),
  parentScenarioId: z.string().uuid().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export const ScenarioInputSchema = z.object({
  id: z.string().uuid(),
  scenarioId: z.string().uuid(),
  entityType: z.enum(["alternative", "outcome", "criterion"]),
  entityId: z.string().uuid(),
  field: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ScenarioInput = z.infer<typeof ScenarioInputSchema>;

export const SimulationStatusSchema = z.enum(["pending", "running", "completed", "failed"]);
export type SimulationStatus = z.infer<typeof SimulationStatusSchema>;

export const SimulationRunSchema = z.object({
  id: z.string().uuid(),
  scenarioId: z.string().uuid(),
  algorithmVersion: z.string(),
  inputSnapshot: z.record(z.unknown()),
  status: SimulationStatusSchema.default("pending"),
  error: z.string().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
});
export type SimulationRun = z.infer<typeof SimulationRunSchema>;

export const SimulationResultSchema = z.object({
  id: z.string().uuid(),
  simulationRunId: z.string().uuid(),
  alternativeId: z.string().uuid(),
  weightedScore: z.number().optional(),
  expectedMonetaryValue: z.number().optional(),
  expectedUtility: z.number().optional(),
  bestCase: z.number().optional(),
  worstCase: z.number().optional(),
  riskMetrics: z.record(z.number()).optional(),
  sensitivityData: z.record(z.number()).optional(),
  rank: z.number().int().positive().optional(),
  details: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});
export type SimulationResult = z.infer<typeof SimulationResultSchema>;

export const DecisionShareSchema = z.object({
  id: z.string().uuid(),
  decisionId: z.string().uuid(),
  shareToken: z.string().min(32).max(64),
  recipientEmail: z.string().email().optional(),
  accessLevel: z.enum(["view", "comment", "edit"]).default("view"),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
  createdBy: z.string().uuid(),
});
export type DecisionShare = z.infer<typeof DecisionShareSchema>;

export const AuditActionSchema = z.enum([
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "share",
  "import",
  "export",
  "simulate",
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  actorId: z.string().uuid(),
  action: AuditActionSchema,
  entityType: z.string(),
  entityId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const ImportJobStatusSchema = z.enum(["pending", "processing", "completed", "failed", "cancelled"]);
export type ImportJobStatus = z.infer<typeof ImportJobStatusSchema>;

export const ImportJobSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  status: ImportJobStatusSchema.default("pending"),
  validationSummary: z.record(z.unknown()).optional(),
  errorReport: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});
export type ImportJob = z.infer<typeof ImportJobSchema>;

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    })
    .optional(),
  meta: z
    .object({
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().optional(),
      total: z.number().int().nonnegative().optional(),
    })
    .optional(),
});
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
  meta?: { page?: number; limit?: number; total?: number };
};

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
export type PaginationParams = z.infer<typeof PaginationSchema>;

export const DecisionFilterSchema = z.object({
  status: DecisionStatusSchema.optional(),
  category: DecisionCategorySchema.optional(),
  search: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  tags: z.array(z.string()).optional(),
});
export type DecisionFilter = z.infer<typeof DecisionFilterSchema>;

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const CreateDecisionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  category: DecisionCategorySchema.default("other"),
  question: z.string().min(1).max(1000),
  deadline: z.string().datetime().optional(),
});
export type CreateDecisionInput = z.infer<typeof CreateDecisionSchema>;

export const UpdateDecisionSchema = CreateDecisionSchema.partial().extend({
  status: DecisionStatusSchema.optional(),
});
export type UpdateDecisionInput = z.infer<typeof UpdateDecisionSchema>;

export const CreateAlternativeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  order: z.number().int().nonnegative().optional(),
});
export type CreateAlternativeInput = z.infer<typeof CreateAlternativeSchema>;

export const UpdateAlternativeSchema = CreateAlternativeSchema.partial();
export type UpdateAlternativeInput = z.infer<typeof UpdateAlternativeSchema>;

export const CreateCriterionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  weight: z.number().min(0).max(100),
  direction: CriterionDirectionSchema.default("maximize"),
  order: z.number().int().nonnegative().optional(),
});
export type CreateCriterionInput = z.infer<typeof CreateCriterionSchema>;

export const UpdateCriterionSchema = CreateCriterionSchema.partial();
export type UpdateCriterionInput = z.infer<typeof UpdateCriterionSchema>;

export const CreateOutcomeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  probability: z.number().min(0).max(1),
  monetaryPayoff: z.number().nullable().optional(),
  utilityScore: z.number().min(0).max(100).nullable().optional(),
  riskLevel: RiskLevelSchema.default("low"),
  order: z.number().int().nonnegative().optional(),
});
export type CreateOutcomeInput = z.infer<typeof CreateOutcomeSchema>;

export const UpdateOutcomeSchema = CreateOutcomeSchema.partial();
export type UpdateOutcomeInput = z.infer<typeof UpdateOutcomeSchema>;

export const CreateScenarioSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  parentScenarioId: z.string().uuid().optional(),
});
export type CreateScenarioInput = z.infer<typeof CreateScenarioSchema>;

export const UpdateScenarioInputSchema = z.object({
  entityType: z.enum(["alternative", "outcome", "criterion"]),
  entityId: z.string().uuid(),
  field: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});
export type UpdateScenarioInput = z.infer<typeof UpdateScenarioInputSchema>;

export const RunSimulationSchema = z.object({
  scenarioId: z.string().uuid(),
  algorithm: z.enum(["weighted", "emv", "utility", "monte_carlo"]).default("weighted"),
  iterations: z.number().int().positive().max(100000).default(10000),
  seed: z.number().int().optional(),
});
export type RunSimulationInput = z.infer<typeof RunSimulationSchema>;

export const ShareDecisionSchema = z.object({
  accessLevel: z.enum(["view", "comment", "edit"]).default("view"),
  expiresAt: z.string().datetime().optional(),
  recipientEmail: z.string().email().optional(),
});
export type ShareDecisionInput = z.infer<typeof ShareDecisionSchema>;

export const UpdateUserSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  emailNotifications: z.boolean().optional(),
});
export type UpdateUserSettingsInput = z.infer<typeof UpdateUserSettingsSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const DecisionWithRelationsSchema = DecisionSchema.extend({
  alternatives: z.array(AlternativeSchema),
  criteria: z.array(CriterionSchema),
  outcomes: z.array(OutcomeSchema.extend({ alternative: AlternativeSchema })),
  scenarios: z.array(ScenarioSchema).optional(),
  owner: UserSchema.optional(),
});
export type DecisionWithRelations = z.infer<typeof DecisionWithRelationsSchema>;

export const DashboardStatsSchema = z.object({
  totalDecisions: z.number().int().nonnegative(),
  activeDecisions: z.number().int().nonnegative(),
  savedScenarios: z.number().int().nonnegative(),
  recentDecisions: z.array(
    DecisionSchema.pick({
      id: true,
      title: true,
      status: true,
      updatedAt: true,
      category: true,
      question: true,
    })
  ),
});
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: DecisionCategorySchema,
  icon: z.string(),
  decision: z.object({
    title: z.string(),
    description: z.string().optional(),
    question: z.string(),
    alternatives: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
      })
    ),
    criteria: z.array(
      z.object({
        name: z.string(),
        weight: z.number(),
        direction: CriterionDirectionSchema,
      })
    ),
    outcomes: z.array(
      z.object({
        alternativeTitle: z.string(),
        title: z.string(),
        probability: z.number(),
        monetaryPayoff: z.number().optional(),
        utilityScore: z.number().optional(),
        riskLevel: RiskLevelSchema,
      })
    ),
  }),
});
export type Template = z.infer<typeof TemplateSchema>;

export const SimulationComparisonSchema = z.object({
  baseline: SimulationRunSchema.extend({
    results: z.array(SimulationResultSchema),
  }),
  scenarios: z.array(
    SimulationRunSchema.extend({
      results: z.array(SimulationResultSchema),
      scenario: ScenarioSchema,
    })
  ),
});
export type SimulationComparison = z.infer<typeof SimulationComparisonSchema>;

export const WorkflowNodeTypeSchema = z.enum([
  "start_decision",
  "manual_trigger",
  "import_spreadsheet",
  "existing_decision",
  "decision_question",
  "alternative",
  "define_criteria",
  "set_criteria_weights",
  "define_constraints",
  "set_assumptions",
  "if_else",
  "compare_values",
  "threshold_check",
  "and_or_conditions",
  "filter_alternatives",
  "merge_branches",
  "possible_outcome",
  "probability",
  "cost",
  "benefit",
  "risk_assessment",
  "time_estimate",
  "custom_metric",
  "weighted_score",
  "expected_monetary_value",
  "expected_utility",
  "best_worst_case",
  "sensitivity_analysis",
  "scenario_comparison",
  "monte_carlo",
  "read_saved_decision",
  "read_spreadsheet_data",
  "transform_data",
  "validate_data",
  "save_results",
  "export_report",
  "recommendation",
  "results_table",
  "chart",
  "summary_report",
  "end",
]);
export type WorkflowNodeType = z.infer<typeof WorkflowNodeTypeSchema>;

export const WorkflowNodeConfigSchema = z.record(z.unknown());
export type WorkflowNodeConfig = z.infer<typeof WorkflowNodeConfigSchema>;

export const WorkflowNodeSchema = z.object({
  id: z.string().uuid(),
  workflowId: z.string().uuid(),
  type: WorkflowNodeTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  positionX: z.number(),
  positionY: z.number(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  config: WorkflowNodeConfigSchema,
  schemaVersion: z.number().int().positive().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;

export const WorkflowEdgeSchema = z.object({
  id: z.string().uuid(),
  workflowId: z.string().uuid(),
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>;

export const WorkflowStatusSchema = z.enum(["draft", "active", "archived", "completed"]);
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

export const WorkflowSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).nullable().optional(),
  version: z.number().int().positive().default(1),
  status: WorkflowStatusSchema.default("draft"),
  isTemplate: z.boolean().default(false),
  templateId: z.string().uuid().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Workflow = z.infer<typeof WorkflowSchema>;

export const WorkflowWithDetailsSchema = WorkflowSchema.extend({
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
  owner: UserSchema.optional(),
});
export type WorkflowWithDetails = z.infer<typeof WorkflowWithDetailsSchema>;

export const WorkflowRunStatusSchema = z.enum(["pending", "running", "completed", "failed", "cancelled"]);
export type WorkflowRunStatus = z.infer<typeof WorkflowRunStatusSchema>;

export const WorkflowRunSchema = z.object({
  id: z.string().uuid(),
  workflowId: z.string().uuid(),
  status: WorkflowRunStatusSchema.default("pending"),
  error: z.string().nullable().optional(),
  startedAt: z.date().nullable().optional(),
  completedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  inputSnapshot: z.record(z.unknown()).nullable().optional(),
  outputSnapshot: z.record(z.unknown()).nullable().optional(),
});
export type WorkflowRun = z.infer<typeof WorkflowRunSchema>;

export const WorkflowNodeResultSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  nodeId: z.string().uuid(),
  status: z.enum(["waiting", "running", "success", "skipped", "error"]),
  inputData: z.record(z.unknown()).nullable().optional(),
  outputData: z.record(z.unknown()).nullable().optional(),
  error: z.string().nullable().optional(),
  startedAt: z.date().nullable().optional(),
  completedAt: z.date().nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
  createdAt: z.date(),
});
export type WorkflowNodeResult = z.infer<typeof WorkflowNodeResultSchema>;

export const WorkflowRunWithResultsSchema = WorkflowRunSchema.extend({
  nodeResults: z.array(WorkflowNodeResultSchema),
  workflow: WorkflowSchema.optional(),
});
export type WorkflowRunWithResults = z.infer<typeof WorkflowRunWithResultsSchema>;

export const CreateWorkflowSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  isTemplate: z.boolean().default(false),
  templateId: z.string().uuid().optional(),
});
export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>;

export const UpdateWorkflowSchema = CreateWorkflowSchema.partial().extend({
  status: WorkflowStatusSchema.optional(),
});
export type UpdateWorkflowInput = z.infer<typeof UpdateWorkflowSchema>;

export const CreateWorkflowNodeSchema = z.object({
  type: WorkflowNodeTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  positionX: z.number(),
  positionY: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  config: WorkflowNodeConfigSchema.default({}),
  schemaVersion: z.number().int().positive().default(1),
});
export type CreateWorkflowNodeInput = z.infer<typeof CreateWorkflowNodeSchema>;

export const UpdateWorkflowNodeSchema = CreateWorkflowNodeSchema.partial();
export type UpdateWorkflowNodeInput = z.infer<typeof UpdateWorkflowNodeSchema>;

export const CreateWorkflowEdgeSchema = z.object({
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  label: z.string().optional(),
});
export type CreateWorkflowEdgeInput = z.infer<typeof CreateWorkflowEdgeSchema>;

export const UpdateWorkflowEdgeSchema = CreateWorkflowEdgeSchema.partial();
export type UpdateWorkflowEdgeInput = z.infer<typeof UpdateWorkflowEdgeSchema>;

export const RunWorkflowSchema = z.object({
  inputData: z.record(z.unknown()).optional(),
});
export type RunWorkflowInput = z.infer<typeof RunWorkflowSchema>;

export function createApiResponse<T>(data: T, meta?: ApiResponse["meta"]): ApiResponse<T> {
  return { success: true, data, meta };
}

export function createApiError(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return { success: false, error: { code, message, details } };
}