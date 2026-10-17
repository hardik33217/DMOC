"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationComparisonSchema = exports.TemplateSchema = exports.DashboardStatsSchema = exports.DecisionWithRelationsSchema = exports.ChangePasswordSchema = exports.UpdateUserSettingsSchema = exports.ShareDecisionSchema = exports.RunSimulationSchema = exports.UpdateScenarioInputSchema = exports.CreateScenarioSchema = exports.UpdateOutcomeSchema = exports.CreateOutcomeSchema = exports.UpdateCriterionSchema = exports.CreateCriterionSchema = exports.UpdateAlternativeSchema = exports.CreateAlternativeSchema = exports.UpdateDecisionSchema = exports.CreateDecisionSchema = exports.ResetPasswordSchema = exports.ForgotPasswordSchema = exports.LoginSchema = exports.RegisterSchema = exports.DecisionFilterSchema = exports.PaginationSchema = exports.ApiResponseSchema = exports.ImportJobSchema = exports.ImportJobStatusSchema = exports.AuditEventSchema = exports.AuditActionSchema = exports.DecisionShareSchema = exports.SimulationResultSchema = exports.SimulationRunSchema = exports.SimulationStatusSchema = exports.ScenarioInputSchema = exports.ScenarioSchema = exports.OutcomeSchema = exports.RiskLevelSchema = exports.CriterionSchema = exports.CriterionDirectionSchema = exports.AlternativeSchema = exports.DecisionSchema = exports.DecisionCategorySchema = exports.DecisionStatusSchema = exports.UserSchema = exports.UserRoleSchema = void 0;
exports.createApiResponse = createApiResponse;
exports.createApiError = createApiError;
const zod_1 = require("zod");
exports.UserRoleSchema = zod_1.z.enum(["user", "admin"]);
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1).max(100),
    role: exports.UserRoleSchema.default("user"),
    theme: zod_1.z.enum(["light", "dark", "system"]).default("system"),
    emailVerified: zod_1.z.boolean().default(false),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.DecisionStatusSchema = zod_1.z.enum(["draft", "active", "archived", "completed"]);
exports.DecisionCategorySchema = zod_1.z.enum([
    "career",
    "education",
    "finance",
    "business",
    "personal",
    "project",
    "resource_allocation",
    "other",
]);
exports.DecisionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    ownerId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(5000).optional(),
    category: exports.DecisionCategorySchema.default("other"),
    status: exports.DecisionStatusSchema.default("draft"),
    question: zod_1.z.string().min(1).max(1000),
    deadline: zod_1.z.date().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.AlternativeSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    decisionId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000).optional(),
    order: zod_1.z.number().int().nonnegative(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.CriterionDirectionSchema = zod_1.z.enum(["maximize", "minimize"]);
exports.CriterionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    decisionId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(1000).optional(),
    weight: zod_1.z.number().min(0).max(100),
    direction: exports.CriterionDirectionSchema.default("maximize"),
    order: zod_1.z.number().int().nonnegative(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.RiskLevelSchema = zod_1.z.enum(["low", "medium", "high", "critical"]);
exports.OutcomeSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    alternativeId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000).optional(),
    probability: zod_1.z.number().min(0).max(1),
    monetaryPayoff: zod_1.z.number().optional(),
    utilityScore: zod_1.z.number().min(0).max(100).optional(),
    riskLevel: exports.RiskLevelSchema.default("low"),
    order: zod_1.z.number().int().nonnegative(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.ScenarioSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    decisionId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000).optional(),
    isBaseline: zod_1.z.boolean().default(false),
    parentScenarioId: zod_1.z.string().uuid().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.ScenarioInputSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    scenarioId: zod_1.z.string().uuid(),
    entityType: zod_1.z.enum(["alternative", "outcome", "criterion"]),
    entityId: zod_1.z.string().uuid(),
    field: zod_1.z.string(),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean()]),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.SimulationStatusSchema = zod_1.z.enum(["pending", "running", "completed", "failed"]);
exports.SimulationRunSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    scenarioId: zod_1.z.string().uuid(),
    algorithmVersion: zod_1.z.string(),
    inputSnapshot: zod_1.z.record(zod_1.z.unknown()),
    status: exports.SimulationStatusSchema.default("pending"),
    error: zod_1.z.string().optional(),
    startedAt: zod_1.z.date().optional(),
    completedAt: zod_1.z.date().optional(),
    createdAt: zod_1.z.date(),
});
exports.SimulationResultSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    simulationRunId: zod_1.z.string().uuid(),
    alternativeId: zod_1.z.string().uuid(),
    weightedScore: zod_1.z.number().optional(),
    expectedMonetaryValue: zod_1.z.number().optional(),
    expectedUtility: zod_1.z.number().optional(),
    bestCase: zod_1.z.number().optional(),
    worstCase: zod_1.z.number().optional(),
    riskMetrics: zod_1.z.record(zod_1.z.number()).optional(),
    sensitivityData: zod_1.z.record(zod_1.z.number()).optional(),
    rank: zod_1.z.number().int().positive().optional(),
    details: zod_1.z.record(zod_1.z.unknown()).optional(),
    createdAt: zod_1.z.date(),
});
exports.DecisionShareSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    decisionId: zod_1.z.string().uuid(),
    shareToken: zod_1.z.string().min(32).max(64),
    recipientEmail: zod_1.z.string().email().optional(),
    accessLevel: zod_1.z.enum(["view", "comment", "edit"]).default("view"),
    expiresAt: zod_1.z.date().optional(),
    createdAt: zod_1.z.date(),
    createdBy: zod_1.z.string().uuid(),
});
exports.AuditActionSchema = zod_1.z.enum([
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
exports.AuditEventSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    actorId: zod_1.z.string().uuid(),
    action: exports.AuditActionSchema,
    entityType: zod_1.z.string(),
    entityId: zod_1.z.string().uuid().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    ipAddress: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
});
exports.ImportJobStatusSchema = zod_1.z.enum(["pending", "processing", "completed", "failed", "cancelled"]);
exports.ImportJobSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    ownerId: zod_1.z.string().uuid(),
    fileName: zod_1.z.string(),
    fileSize: zod_1.z.number().int().positive(),
    status: exports.ImportJobStatusSchema.default("pending"),
    validationSummary: zod_1.z.record(zod_1.z.unknown()).optional(),
    errorReport: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    completedAt: zod_1.z.date().optional(),
});
exports.ApiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.unknown().optional(),
    error: zod_1.z
        .object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.record(zod_1.z.unknown()).optional(),
    })
        .optional(),
    meta: zod_1.z
        .object({
        page: zod_1.z.number().int().positive().optional(),
        limit: zod_1.z.number().int().positive().optional(),
        total: zod_1.z.number().int().nonnegative().optional(),
    })
        .optional(),
});
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional(),
});
exports.DecisionFilterSchema = zod_1.z.object({
    status: exports.DecisionStatusSchema.optional(),
    category: exports.DecisionCategorySchema.optional(),
    search: zod_1.z.string().optional(),
    dateFrom: zod_1.z.date().optional(),
    dateTo: zod_1.z.date().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(128),
    name: zod_1.z.string().min(1).max(100),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
    rememberMe: zod_1.z.boolean().optional(),
});
exports.ForgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.ResetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    password: zod_1.z.string().min(8).max(128),
    confirmPassword: zod_1.z.string().min(8).max(128),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.CreateDecisionSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(5000).optional(),
    category: exports.DecisionCategorySchema.default("other"),
    question: zod_1.z.string().min(1).max(1000),
    deadline: zod_1.z.string().datetime().optional(),
});
exports.UpdateDecisionSchema = exports.CreateDecisionSchema.partial().extend({
    status: exports.DecisionStatusSchema.optional(),
});
exports.CreateAlternativeSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000).optional(),
    order: zod_1.z.number().int().nonnegative().optional(),
});
exports.UpdateAlternativeSchema = exports.CreateAlternativeSchema.partial();
exports.CreateCriterionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(1000).optional(),
    weight: zod_1.z.number().min(0).max(100),
    direction: exports.CriterionDirectionSchema.default("maximize"),
    order: zod_1.z.number().int().nonnegative().optional(),
});
exports.UpdateCriterionSchema = exports.CreateCriterionSchema.partial();
exports.CreateOutcomeSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000).optional(),
    probability: zod_1.z.number().min(0).max(1),
    monetaryPayoff: zod_1.z.number().optional(),
    utilityScore: zod_1.z.number().min(0).max(100).optional(),
    riskLevel: exports.RiskLevelSchema.default("low"),
    order: zod_1.z.number().int().nonnegative().optional(),
});
exports.UpdateOutcomeSchema = exports.CreateOutcomeSchema.partial();
exports.CreateScenarioSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000).optional(),
    parentScenarioId: zod_1.z.string().uuid().optional(),
});
exports.UpdateScenarioInputSchema = zod_1.z.object({
    entityType: zod_1.z.enum(["alternative", "outcome", "criterion"]),
    entityId: zod_1.z.string().uuid(),
    field: zod_1.z.string(),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean()]),
});
exports.RunSimulationSchema = zod_1.z.object({
    scenarioId: zod_1.z.string().uuid(),
    algorithm: zod_1.z.enum(["weighted", "emv", "utility", "monte_carlo"]).default("weighted"),
    iterations: zod_1.z.number().int().positive().max(100000).default(10000),
    seed: zod_1.z.number().int().optional(),
});
exports.ShareDecisionSchema = zod_1.z.object({
    accessLevel: zod_1.z.enum(["view", "comment", "edit"]).default("view"),
    expiresAt: zod_1.z.string().datetime().optional(),
    recipientEmail: zod_1.z.string().email().optional(),
});
exports.UpdateUserSettingsSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    theme: zod_1.z.enum(["light", "dark", "system"]).optional(),
    emailNotifications: zod_1.z.boolean().optional(),
});
exports.ChangePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8).max(128),
    confirmPassword: zod_1.z.string().min(8).max(128),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.DecisionWithRelationsSchema = exports.DecisionSchema.extend({
    alternatives: zod_1.z.array(exports.AlternativeSchema),
    criteria: zod_1.z.array(exports.CriterionSchema),
    outcomes: zod_1.z.array(exports.OutcomeSchema.extend({ alternative: exports.AlternativeSchema })),
    scenarios: zod_1.z.array(exports.ScenarioSchema).optional(),
    owner: exports.UserSchema.optional(),
});
exports.DashboardStatsSchema = zod_1.z.object({
    totalDecisions: zod_1.z.number().int().nonnegative(),
    activeDecisions: zod_1.z.number().int().nonnegative(),
    savedScenarios: zod_1.z.number().int().nonnegative(),
    recentDecisions: zod_1.z.array(exports.DecisionSchema.pick({
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        category: true,
    })),
});
exports.TemplateSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    category: exports.DecisionCategorySchema,
    icon: zod_1.z.string(),
    decision: zod_1.z.object({
        title: zod_1.z.string(),
        description: zod_1.z.string().optional(),
        question: zod_1.z.string(),
        alternatives: zod_1.z.array(zod_1.z.object({
            title: zod_1.z.string(),
            description: zod_1.z.string().optional(),
        })),
        criteria: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            weight: zod_1.z.number(),
            direction: exports.CriterionDirectionSchema,
        })),
        outcomes: zod_1.z.array(zod_1.z.object({
            alternativeTitle: zod_1.z.string(),
            title: zod_1.z.string(),
            probability: zod_1.z.number(),
            monetaryPayoff: zod_1.z.number().optional(),
            utilityScore: zod_1.z.number().optional(),
            riskLevel: exports.RiskLevelSchema,
        })),
    }),
});
exports.SimulationComparisonSchema = zod_1.z.object({
    baseline: exports.SimulationRunSchema.extend({
        results: zod_1.z.array(exports.SimulationResultSchema),
    }),
    scenarios: zod_1.z.array(exports.SimulationRunSchema.extend({
        results: zod_1.z.array(exports.SimulationResultSchema),
        scenario: exports.ScenarioSchema,
    })),
});
function createApiResponse(data, meta) {
    return { success: true, data, meta };
}
function createApiError(code, message, details) {
    return { success: false, error: { code, message, details } };
}
