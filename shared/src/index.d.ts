import { z } from "zod";
export declare const UserRoleSchema: z.ZodEnum<["user", "admin"]>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["user", "admin"]>>;
    theme: z.ZodDefault<z.ZodEnum<["light", "dark", "system"]>>;
    emailVerified: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    name: string;
    role: "user" | "admin";
    theme: "light" | "dark" | "system";
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}, {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    role?: "user" | "admin" | undefined;
    theme?: "light" | "dark" | "system" | undefined;
    emailVerified?: boolean | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export declare const DecisionStatusSchema: z.ZodEnum<["draft", "active", "archived", "completed"]>;
export type DecisionStatus = z.infer<typeof DecisionStatusSchema>;
export declare const DecisionCategorySchema: z.ZodEnum<["career", "education", "finance", "business", "personal", "project", "resource_allocation", "other"]>;
export type DecisionCategory = z.infer<typeof DecisionCategorySchema>;
export declare const DecisionSchema: z.ZodObject<{
    id: z.ZodString;
    ownerId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodDefault<z.ZodEnum<["career", "education", "finance", "business", "personal", "project", "resource_allocation", "other"]>>;
    status: z.ZodDefault<z.ZodEnum<["draft", "active", "archived", "completed"]>>;
    question: z.ZodString;
    deadline: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "active" | "archived" | "completed";
    id: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    title: string;
    category: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other";
    question: string;
    description?: string | undefined;
    deadline?: Date | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    title: string;
    question: string;
    status?: "draft" | "active" | "archived" | "completed" | undefined;
    description?: string | undefined;
    category?: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other" | undefined;
    deadline?: Date | undefined;
}>;
export type Decision = z.infer<typeof DecisionSchema>;
export declare const AlternativeSchema: z.ZodObject<{
    id: z.ZodString;
    decisionId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    order: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    decisionId: string;
    order: number;
    description?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    decisionId: string;
    order: number;
    description?: string | undefined;
}>;
export type Alternative = z.infer<typeof AlternativeSchema>;
export declare const CriterionDirectionSchema: z.ZodEnum<["maximize", "minimize"]>;
export type CriterionDirection = z.infer<typeof CriterionDirectionSchema>;
export declare const CriterionSchema: z.ZodObject<{
    id: z.ZodString;
    decisionId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    weight: z.ZodNumber;
    direction: z.ZodDefault<z.ZodEnum<["maximize", "minimize"]>>;
    order: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    decisionId: string;
    order: number;
    weight: number;
    direction: "maximize" | "minimize";
    description?: string | undefined;
}, {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    decisionId: string;
    order: number;
    weight: number;
    description?: string | undefined;
    direction?: "maximize" | "minimize" | undefined;
}>;
export type Criterion = z.infer<typeof CriterionSchema>;
export declare const RiskLevelSchema: z.ZodEnum<["low", "medium", "high", "critical"]>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export declare const OutcomeSchema: z.ZodObject<{
    id: z.ZodString;
    alternativeId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    probability: z.ZodNumber;
    monetaryPayoff: z.ZodOptional<z.ZodNumber>;
    utilityScore: z.ZodOptional<z.ZodNumber>;
    riskLevel: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    order: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    order: number;
    alternativeId: string;
    probability: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    description?: string | undefined;
    monetaryPayoff?: number | undefined;
    utilityScore?: number | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    order: number;
    alternativeId: string;
    probability: number;
    description?: string | undefined;
    monetaryPayoff?: number | undefined;
    utilityScore?: number | undefined;
    riskLevel?: "low" | "medium" | "high" | "critical" | undefined;
}>;
export type Outcome = z.infer<typeof OutcomeSchema>;
export declare const ScenarioSchema: z.ZodObject<{
    id: z.ZodString;
    decisionId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    isBaseline: z.ZodDefault<z.ZodBoolean>;
    parentScenarioId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    decisionId: string;
    isBaseline: boolean;
    description?: string | undefined;
    parentScenarioId?: string | undefined;
}, {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    decisionId: string;
    description?: string | undefined;
    isBaseline?: boolean | undefined;
    parentScenarioId?: string | undefined;
}>;
export type Scenario = z.infer<typeof ScenarioSchema>;
export declare const ScenarioInputSchema: z.ZodObject<{
    id: z.ZodString;
    scenarioId: z.ZodString;
    entityType: z.ZodEnum<["alternative", "outcome", "criterion"]>;
    entityId: z.ZodString;
    field: z.ZodString;
    value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    value: string | number | boolean;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    scenarioId: string;
    entityType: "alternative" | "outcome" | "criterion";
    entityId: string;
    field: string;
}, {
    value: string | number | boolean;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    scenarioId: string;
    entityType: "alternative" | "outcome" | "criterion";
    entityId: string;
    field: string;
}>;
export type ScenarioInput = z.infer<typeof ScenarioInputSchema>;
export declare const SimulationStatusSchema: z.ZodEnum<["pending", "running", "completed", "failed"]>;
export type SimulationStatus = z.infer<typeof SimulationStatusSchema>;
export declare const SimulationRunSchema: z.ZodObject<{
    id: z.ZodString;
    scenarioId: z.ZodString;
    algorithmVersion: z.ZodString;
    inputSnapshot: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    status: z.ZodDefault<z.ZodEnum<["pending", "running", "completed", "failed"]>>;
    error: z.ZodOptional<z.ZodString>;
    startedAt: z.ZodOptional<z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "pending" | "running" | "failed";
    id: string;
    createdAt: Date;
    scenarioId: string;
    algorithmVersion: string;
    inputSnapshot: Record<string, unknown>;
    error?: string | undefined;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
}, {
    id: string;
    createdAt: Date;
    scenarioId: string;
    algorithmVersion: string;
    inputSnapshot: Record<string, unknown>;
    status?: "completed" | "pending" | "running" | "failed" | undefined;
    error?: string | undefined;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
}>;
export type SimulationRun = z.infer<typeof SimulationRunSchema>;
export declare const SimulationResultSchema: z.ZodObject<{
    id: z.ZodString;
    simulationRunId: z.ZodString;
    alternativeId: z.ZodString;
    weightedScore: z.ZodOptional<z.ZodNumber>;
    expectedMonetaryValue: z.ZodOptional<z.ZodNumber>;
    expectedUtility: z.ZodOptional<z.ZodNumber>;
    bestCase: z.ZodOptional<z.ZodNumber>;
    worstCase: z.ZodOptional<z.ZodNumber>;
    riskMetrics: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    sensitivityData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    rank: z.ZodOptional<z.ZodNumber>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    alternativeId: string;
    simulationRunId: string;
    weightedScore?: number | undefined;
    expectedMonetaryValue?: number | undefined;
    expectedUtility?: number | undefined;
    bestCase?: number | undefined;
    worstCase?: number | undefined;
    riskMetrics?: Record<string, number> | undefined;
    sensitivityData?: Record<string, number> | undefined;
    rank?: number | undefined;
    details?: Record<string, unknown> | undefined;
}, {
    id: string;
    createdAt: Date;
    alternativeId: string;
    simulationRunId: string;
    weightedScore?: number | undefined;
    expectedMonetaryValue?: number | undefined;
    expectedUtility?: number | undefined;
    bestCase?: number | undefined;
    worstCase?: number | undefined;
    riskMetrics?: Record<string, number> | undefined;
    sensitivityData?: Record<string, number> | undefined;
    rank?: number | undefined;
    details?: Record<string, unknown> | undefined;
}>;
export type SimulationResult = z.infer<typeof SimulationResultSchema>;
export declare const DecisionShareSchema: z.ZodObject<{
    id: z.ZodString;
    decisionId: z.ZodString;
    shareToken: z.ZodString;
    recipientEmail: z.ZodOptional<z.ZodString>;
    accessLevel: z.ZodDefault<z.ZodEnum<["view", "comment", "edit"]>>;
    expiresAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    createdBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    decisionId: string;
    shareToken: string;
    accessLevel: "view" | "comment" | "edit";
    createdBy: string;
    recipientEmail?: string | undefined;
    expiresAt?: Date | undefined;
}, {
    id: string;
    createdAt: Date;
    decisionId: string;
    shareToken: string;
    createdBy: string;
    recipientEmail?: string | undefined;
    accessLevel?: "view" | "comment" | "edit" | undefined;
    expiresAt?: Date | undefined;
}>;
export type DecisionShare = z.infer<typeof DecisionShareSchema>;
export declare const AuditActionSchema: z.ZodEnum<["create", "update", "delete", "login", "logout", "share", "import", "export", "simulate"]>;
export type AuditAction = z.infer<typeof AuditActionSchema>;
export declare const AuditEventSchema: z.ZodObject<{
    id: z.ZodString;
    actorId: z.ZodString;
    action: z.ZodEnum<["create", "update", "delete", "login", "logout", "share", "import", "export", "simulate"]>;
    entityType: z.ZodString;
    entityId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    ipAddress: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    entityType: string;
    actorId: string;
    action: "create" | "update" | "delete" | "login" | "logout" | "share" | "import" | "export" | "simulate";
    entityId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    entityType: string;
    actorId: string;
    action: "create" | "update" | "delete" | "login" | "logout" | "share" | "import" | "export" | "simulate";
    entityId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export declare const ImportJobStatusSchema: z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled"]>;
export type ImportJobStatus = z.infer<typeof ImportJobStatusSchema>;
export declare const ImportJobSchema: z.ZodObject<{
    id: z.ZodString;
    ownerId: z.ZodString;
    fileName: z.ZodString;
    fileSize: z.ZodNumber;
    status: z.ZodDefault<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled"]>>;
    validationSummary: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    errorReport: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    completedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "pending" | "failed" | "processing" | "cancelled";
    id: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    fileName: string;
    fileSize: number;
    completedAt?: Date | undefined;
    validationSummary?: Record<string, unknown> | undefined;
    errorReport?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    fileName: string;
    fileSize: number;
    status?: "completed" | "pending" | "failed" | "processing" | "cancelled" | undefined;
    completedAt?: Date | undefined;
    validationSummary?: Record<string, unknown> | undefined;
    errorReport?: string | undefined;
}>;
export type ImportJob = z.infer<typeof ImportJobSchema>;
export declare const ApiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    }, {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    }>>;
    meta: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodNumber>;
        limit: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page?: number | undefined;
        limit?: number | undefined;
        total?: number | undefined;
    }, {
        page?: number | undefined;
        limit?: number | undefined;
        total?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    } | undefined;
    data?: unknown;
    meta?: {
        page?: number | undefined;
        limit?: number | undefined;
        total?: number | undefined;
    } | undefined;
}, {
    success: boolean;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    } | undefined;
    data?: unknown;
    meta?: {
        page?: number | undefined;
        limit?: number | undefined;
        total?: number | undefined;
    } | undefined;
}>;
export type ApiResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
};
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type PaginationParams = z.infer<typeof PaginationSchema>;
export declare const DecisionFilterSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["draft", "active", "archived", "completed"]>>;
    category: z.ZodOptional<z.ZodEnum<["career", "education", "finance", "business", "personal", "project", "resource_allocation", "other"]>>;
    search: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodDate>;
    dateTo: z.ZodOptional<z.ZodDate>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status?: "draft" | "active" | "archived" | "completed" | undefined;
    category?: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other" | undefined;
    search?: string | undefined;
    dateFrom?: Date | undefined;
    dateTo?: Date | undefined;
    tags?: string[] | undefined;
}, {
    status?: "draft" | "active" | "archived" | "completed" | undefined;
    category?: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other" | undefined;
    search?: string | undefined;
    dateFrom?: Date | undefined;
    dateTo?: Date | undefined;
    tags?: string[] | undefined;
}>;
export type DecisionFilter = z.infer<typeof DecisionFilterSchema>;
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    password: string;
}, {
    email: string;
    name: string;
    password: string;
}>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    rememberMe: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    rememberMe?: boolean | undefined;
}, {
    email: string;
    password: string;
    rememberMe?: boolean | undefined;
}>;
export type LoginInput = z.infer<typeof LoginSchema>;
export declare const ForgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export declare const ResetPasswordSchema: z.ZodEffects<z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
    confirmPassword: string;
}, {
    password: string;
    token: string;
    confirmPassword: string;
}>, {
    password: string;
    token: string;
    confirmPassword: string;
}, {
    password: string;
    token: string;
    confirmPassword: string;
}>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export declare const CreateDecisionSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodDefault<z.ZodEnum<["career", "education", "finance", "business", "personal", "project", "resource_allocation", "other"]>>;
    question: z.ZodString;
    deadline: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    category: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other";
    question: string;
    description?: string | undefined;
    deadline?: string | undefined;
}, {
    title: string;
    question: string;
    description?: string | undefined;
    category?: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other" | undefined;
    deadline?: string | undefined;
}>;
export type CreateDecisionInput = z.infer<typeof CreateDecisionSchema>;
export declare const UpdateDecisionSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodDefault<z.ZodEnum<["career", "education", "finance", "business", "personal", "project", "resource_allocation", "other"]>>>;
    question: z.ZodOptional<z.ZodString>;
    deadline: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["draft", "active", "archived", "completed"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "draft" | "active" | "archived" | "completed" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    category?: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other" | undefined;
    question?: string | undefined;
    deadline?: string | undefined;
}, {
    status?: "draft" | "active" | "archived" | "completed" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    category?: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other" | undefined;
    question?: string | undefined;
    deadline?: string | undefined;
}>;
export type UpdateDecisionInput = z.infer<typeof UpdateDecisionSchema>;
export declare const CreateAlternativeSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description?: string | undefined;
    order?: number | undefined;
}, {
    title: string;
    description?: string | undefined;
    order?: number | undefined;
}>;
export type CreateAlternativeInput = z.infer<typeof CreateAlternativeSchema>;
export declare const UpdateAlternativeSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    order: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    order?: number | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    order?: number | undefined;
}>;
export type UpdateAlternativeInput = z.infer<typeof UpdateAlternativeSchema>;
export declare const CreateCriterionSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    weight: z.ZodNumber;
    direction: z.ZodDefault<z.ZodEnum<["maximize", "minimize"]>>;
    order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    weight: number;
    direction: "maximize" | "minimize";
    description?: string | undefined;
    order?: number | undefined;
}, {
    name: string;
    weight: number;
    description?: string | undefined;
    order?: number | undefined;
    direction?: "maximize" | "minimize" | undefined;
}>;
export type CreateCriterionInput = z.infer<typeof CreateCriterionSchema>;
export declare const UpdateCriterionSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    weight: z.ZodOptional<z.ZodNumber>;
    direction: z.ZodOptional<z.ZodDefault<z.ZodEnum<["maximize", "minimize"]>>>;
    order: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    order?: number | undefined;
    weight?: number | undefined;
    direction?: "maximize" | "minimize" | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    order?: number | undefined;
    weight?: number | undefined;
    direction?: "maximize" | "minimize" | undefined;
}>;
export type UpdateCriterionInput = z.infer<typeof UpdateCriterionSchema>;
export declare const CreateOutcomeSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    probability: z.ZodNumber;
    monetaryPayoff: z.ZodOptional<z.ZodNumber>;
    utilityScore: z.ZodOptional<z.ZodNumber>;
    riskLevel: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title: string;
    probability: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    description?: string | undefined;
    order?: number | undefined;
    monetaryPayoff?: number | undefined;
    utilityScore?: number | undefined;
}, {
    title: string;
    probability: number;
    description?: string | undefined;
    order?: number | undefined;
    monetaryPayoff?: number | undefined;
    utilityScore?: number | undefined;
    riskLevel?: "low" | "medium" | "high" | "critical" | undefined;
}>;
export type CreateOutcomeInput = z.infer<typeof CreateOutcomeSchema>;
export declare const UpdateOutcomeSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    probability: z.ZodOptional<z.ZodNumber>;
    monetaryPayoff: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    utilityScore: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    riskLevel: z.ZodOptional<z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>>;
    order: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    order?: number | undefined;
    probability?: number | undefined;
    monetaryPayoff?: number | undefined;
    utilityScore?: number | undefined;
    riskLevel?: "low" | "medium" | "high" | "critical" | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    order?: number | undefined;
    probability?: number | undefined;
    monetaryPayoff?: number | undefined;
    utilityScore?: number | undefined;
    riskLevel?: "low" | "medium" | "high" | "critical" | undefined;
}>;
export type UpdateOutcomeInput = z.infer<typeof UpdateOutcomeSchema>;
export declare const CreateScenarioSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    parentScenarioId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    parentScenarioId?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    parentScenarioId?: string | undefined;
}>;
export type CreateScenarioInput = z.infer<typeof CreateScenarioSchema>;
export declare const UpdateScenarioInputSchema: z.ZodObject<{
    entityType: z.ZodEnum<["alternative", "outcome", "criterion"]>;
    entityId: z.ZodString;
    field: z.ZodString;
    value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>;
}, "strip", z.ZodTypeAny, {
    value: string | number | boolean;
    entityType: "alternative" | "outcome" | "criterion";
    entityId: string;
    field: string;
}, {
    value: string | number | boolean;
    entityType: "alternative" | "outcome" | "criterion";
    entityId: string;
    field: string;
}>;
export type UpdateScenarioInput = z.infer<typeof UpdateScenarioInputSchema>;
export declare const RunSimulationSchema: z.ZodObject<{
    scenarioId: z.ZodString;
    algorithm: z.ZodDefault<z.ZodEnum<["weighted", "emv", "utility", "monte_carlo"]>>;
    iterations: z.ZodDefault<z.ZodNumber>;
    seed: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    scenarioId: string;
    algorithm: "weighted" | "emv" | "utility" | "monte_carlo";
    iterations: number;
    seed?: number | undefined;
}, {
    scenarioId: string;
    algorithm?: "weighted" | "emv" | "utility" | "monte_carlo" | undefined;
    iterations?: number | undefined;
    seed?: number | undefined;
}>;
export type RunSimulationInput = z.infer<typeof RunSimulationSchema>;
export declare const ShareDecisionSchema: z.ZodObject<{
    accessLevel: z.ZodDefault<z.ZodEnum<["view", "comment", "edit"]>>;
    expiresAt: z.ZodOptional<z.ZodString>;
    recipientEmail: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessLevel: "view" | "comment" | "edit";
    recipientEmail?: string | undefined;
    expiresAt?: string | undefined;
}, {
    recipientEmail?: string | undefined;
    accessLevel?: "view" | "comment" | "edit" | undefined;
    expiresAt?: string | undefined;
}>;
export type ShareDecisionInput = z.infer<typeof ShareDecisionSchema>;
export declare const UpdateUserSettingsSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    theme: z.ZodOptional<z.ZodEnum<["light", "dark", "system"]>>;
    emailNotifications: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    theme?: "light" | "dark" | "system" | undefined;
    emailNotifications?: boolean | undefined;
}, {
    name?: string | undefined;
    theme?: "light" | "dark" | "system" | undefined;
    emailNotifications?: boolean | undefined;
}>;
export type UpdateUserSettingsInput = z.infer<typeof UpdateUserSettingsSchema>;
export declare const ChangePasswordSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}>, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export declare const DecisionWithRelationsSchema: z.ZodObject<{
    id: z.ZodString;
    ownerId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodDefault<z.ZodEnum<["career", "education", "finance", "business", "personal", "project", "resource_allocation", "other"]>>;
    status: z.ZodDefault<z.ZodEnum<["draft", "active", "archived", "completed"]>>;
    question: z.ZodString;
    deadline: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
} & {
    alternatives: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        decisionId: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        order: z.ZodNumber;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        decisionId: string;
        order: number;
        description?: string | undefined;
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        decisionId: string;
        order: number;
        description?: string | undefined;
    }>, "many">;
    criteria: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        decisionId: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        weight: z.ZodNumber;
        direction: z.ZodDefault<z.ZodEnum<["maximize", "minimize"]>>;
        order: z.ZodNumber;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        decisionId: string;
        order: number;
        weight: number;
        direction: "maximize" | "minimize";
        description?: string | undefined;
    }, {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        decisionId: string;
        order: number;
        weight: number;
        description?: string | undefined;
        direction?: "maximize" | "minimize" | undefined;
    }>, "many">;
    outcomes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        alternativeId: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        probability: z.ZodNumber;
        monetaryPayoff: z.ZodOptional<z.ZodNumber>;
        utilityScore: z.ZodOptional<z.ZodNumber>;
        riskLevel: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>;
        order: z.ZodNumber;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    } & {
        alternative: z.ZodObject<{
            id: z.ZodString;
            decisionId: z.ZodString;
            title: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            order: z.ZodNumber;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
        }, "strip", z.ZodTypeAny, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            decisionId: string;
            order: number;
            description?: string | undefined;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            decisionId: string;
            order: number;
            description?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        order: number;
        alternativeId: string;
        probability: number;
        riskLevel: "low" | "medium" | "high" | "critical";
        alternative: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            decisionId: string;
            order: number;
            description?: string | undefined;
        };
        description?: string | undefined;
        monetaryPayoff?: number | undefined;
        utilityScore?: number | undefined;
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        order: number;
        alternativeId: string;
        probability: number;
        alternative: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            decisionId: string;
            order: number;
            description?: string | undefined;
        };
        description?: string | undefined;
        monetaryPayoff?: number | undefined;
        utilityScore?: number | undefined;
        riskLevel?: "low" | "medium" | "high" | "critical" | undefined;
    }>, "many">;
    scenarios: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        decisionId: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        isBaseline: z.ZodDefault<z.ZodBoolean>;
        parentScenarioId: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        decisionId: string;
        isBaseline: boolean;
        description?: string | undefined;
        parentScenarioId?: string | undefined;
    }, {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        decisionId: string;
        description?: string | undefined;
        isBaseline?: boolean | undefined;
        parentScenarioId?: string | undefined;
    }>, "many">>;
    owner: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodString;
        role: z.ZodDefault<z.ZodEnum<["user", "admin"]>>;
        theme: z.ZodDefault<z.ZodEnum<["light", "dark", "system"]>>;
        emailVerified: z.ZodDefault<z.ZodBoolean>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        id: string;
        email: string;
        name: string;
        role: "user" | "admin";
        theme: "light" | "dark" | "system";
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, {
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        role?: "user" | "admin" | undefined;
        theme?: "light" | "dark" | "system" | undefined;
        emailVerified?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "active" | "archived" | "completed";
    id: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    title: string;
    category: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other";
    question: string;
    alternatives: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        decisionId: string;
        order: number;
        description?: string | undefined;
    }[];
    criteria: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        decisionId: string;
        order: number;
        weight: number;
        direction: "maximize" | "minimize";
        description?: string | undefined;
    }[];
    outcomes: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        order: number;
        alternativeId: string;
        probability: number;
        riskLevel: "low" | "medium" | "high" | "critical";
        alternative: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            decisionId: string;
            order: number;
            description?: string | undefined;
        };
        description?: string | undefined;
        monetaryPayoff?: number | undefined;
        utilityScore?: number | undefined;
    }[];
    description?: string | undefined;
    deadline?: Date | undefined;
    scenarios?: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        decisionId: string;
        isBaseline: boolean;
        description?: string | undefined;
        parentScenarioId?: string | undefined;
    }[] | undefined;
    owner?: {
        id: string;
        email: string;
        name: string;
        role: "user" | "admin";
        theme: "light" | "dark" | "system";
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    title: string;
    question: string;
    alternatives: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        decisionId: string;
        order: number;
        description?: string | undefined;
    }[];
    criteria: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        decisionId: string;
        order: number;
        weight: number;
        description?: string | undefined;
        direction?: "maximize" | "minimize" | undefined;
    }[];
    outcomes: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        order: number;
        alternativeId: string;
        probability: number;
        alternative: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            decisionId: string;
            order: number;
            description?: string | undefined;
        };
        description?: string | undefined;
        monetaryPayoff?: number | undefined;
        utilityScore?: number | undefined;
        riskLevel?: "low" | "medium" | "high" | "critical" | undefined;
    }[];
    status?: "draft" | "active" | "archived" | "completed" | undefined;
    description?: string | undefined;
    category?: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other" | undefined;
    deadline?: Date | undefined;
    scenarios?: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        decisionId: string;
        description?: string | undefined;
        isBaseline?: boolean | undefined;
        parentScenarioId?: string | undefined;
    }[] | undefined;
    owner?: {
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        role?: "user" | "admin" | undefined;
        theme?: "light" | "dark" | "system" | undefined;
        emailVerified?: boolean | undefined;
    } | undefined;
}>;
export type DecisionWithRelations = z.infer<typeof DecisionWithRelationsSchema>;
export declare const DashboardStatsSchema: z.ZodObject<{
    totalDecisions: z.ZodNumber;
    activeDecisions: z.ZodNumber;
    savedScenarios: z.ZodNumber;
    recentDecisions: z.ZodArray<z.ZodObject<Pick<{
        id: z.ZodString;
        ownerId: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        category: z.ZodDefault<z.ZodEnum<["career", "education", "finance", "business", "personal", "project", "resource_allocation", "other"]>>;
        status: z.ZodDefault<z.ZodEnum<["draft", "active", "archived", "completed"]>>;
        question: z.ZodString;
        deadline: z.ZodOptional<z.ZodDate>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "status" | "id" | "updatedAt" | "title" | "category">, "strip", z.ZodTypeAny, {
        status: "draft" | "active" | "archived" | "completed";
        id: string;
        updatedAt: Date;
        title: string;
        category: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other";
    }, {
        id: string;
        updatedAt: Date;
        title: string;
        status?: "draft" | "active" | "archived" | "completed" | undefined;
        category?: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other" | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    totalDecisions: number;
    activeDecisions: number;
    savedScenarios: number;
    recentDecisions: {
        status: "draft" | "active" | "archived" | "completed";
        id: string;
        updatedAt: Date;
        title: string;
        category: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other";
    }[];
}, {
    totalDecisions: number;
    activeDecisions: number;
    savedScenarios: number;
    recentDecisions: {
        id: string;
        updatedAt: Date;
        title: string;
        status?: "draft" | "active" | "archived" | "completed" | undefined;
        category?: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other" | undefined;
    }[];
}>;
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export declare const TemplateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["career", "education", "finance", "business", "personal", "project", "resource_allocation", "other"]>;
    icon: z.ZodString;
    decision: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        question: z.ZodString;
        alternatives: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            description?: string | undefined;
        }, {
            title: string;
            description?: string | undefined;
        }>, "many">;
        criteria: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            weight: z.ZodNumber;
            direction: z.ZodEnum<["maximize", "minimize"]>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            weight: number;
            direction: "maximize" | "minimize";
        }, {
            name: string;
            weight: number;
            direction: "maximize" | "minimize";
        }>, "many">;
        outcomes: z.ZodArray<z.ZodObject<{
            alternativeTitle: z.ZodString;
            title: z.ZodString;
            probability: z.ZodNumber;
            monetaryPayoff: z.ZodOptional<z.ZodNumber>;
            utilityScore: z.ZodOptional<z.ZodNumber>;
            riskLevel: z.ZodEnum<["low", "medium", "high", "critical"]>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            probability: number;
            riskLevel: "low" | "medium" | "high" | "critical";
            alternativeTitle: string;
            monetaryPayoff?: number | undefined;
            utilityScore?: number | undefined;
        }, {
            title: string;
            probability: number;
            riskLevel: "low" | "medium" | "high" | "critical";
            alternativeTitle: string;
            monetaryPayoff?: number | undefined;
            utilityScore?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        title: string;
        question: string;
        alternatives: {
            title: string;
            description?: string | undefined;
        }[];
        criteria: {
            name: string;
            weight: number;
            direction: "maximize" | "minimize";
        }[];
        outcomes: {
            title: string;
            probability: number;
            riskLevel: "low" | "medium" | "high" | "critical";
            alternativeTitle: string;
            monetaryPayoff?: number | undefined;
            utilityScore?: number | undefined;
        }[];
        description?: string | undefined;
    }, {
        title: string;
        question: string;
        alternatives: {
            title: string;
            description?: string | undefined;
        }[];
        criteria: {
            name: string;
            weight: number;
            direction: "maximize" | "minimize";
        }[];
        outcomes: {
            title: string;
            probability: number;
            riskLevel: "low" | "medium" | "high" | "critical";
            alternativeTitle: string;
            monetaryPayoff?: number | undefined;
            utilityScore?: number | undefined;
        }[];
        description?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string;
    category: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other";
    icon: string;
    decision: {
        title: string;
        question: string;
        alternatives: {
            title: string;
            description?: string | undefined;
        }[];
        criteria: {
            name: string;
            weight: number;
            direction: "maximize" | "minimize";
        }[];
        outcomes: {
            title: string;
            probability: number;
            riskLevel: "low" | "medium" | "high" | "critical";
            alternativeTitle: string;
            monetaryPayoff?: number | undefined;
            utilityScore?: number | undefined;
        }[];
        description?: string | undefined;
    };
}, {
    id: string;
    name: string;
    description: string;
    category: "career" | "education" | "finance" | "business" | "personal" | "project" | "resource_allocation" | "other";
    icon: string;
    decision: {
        title: string;
        question: string;
        alternatives: {
            title: string;
            description?: string | undefined;
        }[];
        criteria: {
            name: string;
            weight: number;
            direction: "maximize" | "minimize";
        }[];
        outcomes: {
            title: string;
            probability: number;
            riskLevel: "low" | "medium" | "high" | "critical";
            alternativeTitle: string;
            monetaryPayoff?: number | undefined;
            utilityScore?: number | undefined;
        }[];
        description?: string | undefined;
    };
}>;
export type Template = z.infer<typeof TemplateSchema>;
export declare const SimulationComparisonSchema: z.ZodObject<{
    baseline: z.ZodObject<{
        id: z.ZodString;
        scenarioId: z.ZodString;
        algorithmVersion: z.ZodString;
        inputSnapshot: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        status: z.ZodDefault<z.ZodEnum<["pending", "running", "completed", "failed"]>>;
        error: z.ZodOptional<z.ZodString>;
        startedAt: z.ZodOptional<z.ZodDate>;
        completedAt: z.ZodOptional<z.ZodDate>;
        createdAt: z.ZodDate;
    } & {
        results: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            simulationRunId: z.ZodString;
            alternativeId: z.ZodString;
            weightedScore: z.ZodOptional<z.ZodNumber>;
            expectedMonetaryValue: z.ZodOptional<z.ZodNumber>;
            expectedUtility: z.ZodOptional<z.ZodNumber>;
            bestCase: z.ZodOptional<z.ZodNumber>;
            worstCase: z.ZodOptional<z.ZodNumber>;
            riskMetrics: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            sensitivityData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            rank: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            createdAt: z.ZodDate;
        }, "strip", z.ZodTypeAny, {
            id: string;
            createdAt: Date;
            alternativeId: string;
            simulationRunId: string;
            weightedScore?: number | undefined;
            expectedMonetaryValue?: number | undefined;
            expectedUtility?: number | undefined;
            bestCase?: number | undefined;
            worstCase?: number | undefined;
            riskMetrics?: Record<string, number> | undefined;
            sensitivityData?: Record<string, number> | undefined;
            rank?: number | undefined;
            details?: Record<string, unknown> | undefined;
        }, {
            id: string;
            createdAt: Date;
            alternativeId: string;
            simulationRunId: string;
            weightedScore?: number | undefined;
            expectedMonetaryValue?: number | undefined;
            expectedUtility?: number | undefined;
            bestCase?: number | undefined;
            worstCase?: number | undefined;
            riskMetrics?: Record<string, number> | undefined;
            sensitivityData?: Record<string, number> | undefined;
            rank?: number | undefined;
            details?: Record<string, unknown> | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "pending" | "running" | "failed";
        id: string;
        createdAt: Date;
        scenarioId: string;
        algorithmVersion: string;
        inputSnapshot: Record<string, unknown>;
        results: {
            id: string;
            createdAt: Date;
            alternativeId: string;
            simulationRunId: string;
            weightedScore?: number | undefined;
            expectedMonetaryValue?: number | undefined;
            expectedUtility?: number | undefined;
            bestCase?: number | undefined;
            worstCase?: number | undefined;
            riskMetrics?: Record<string, number> | undefined;
            sensitivityData?: Record<string, number> | undefined;
            rank?: number | undefined;
            details?: Record<string, unknown> | undefined;
        }[];
        error?: string | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }, {
        id: string;
        createdAt: Date;
        scenarioId: string;
        algorithmVersion: string;
        inputSnapshot: Record<string, unknown>;
        results: {
            id: string;
            createdAt: Date;
            alternativeId: string;
            simulationRunId: string;
            weightedScore?: number | undefined;
            expectedMonetaryValue?: number | undefined;
            expectedUtility?: number | undefined;
            bestCase?: number | undefined;
            worstCase?: number | undefined;
            riskMetrics?: Record<string, number> | undefined;
            sensitivityData?: Record<string, number> | undefined;
            rank?: number | undefined;
            details?: Record<string, unknown> | undefined;
        }[];
        status?: "completed" | "pending" | "running" | "failed" | undefined;
        error?: string | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }>;
    scenarios: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        scenarioId: z.ZodString;
        algorithmVersion: z.ZodString;
        inputSnapshot: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        status: z.ZodDefault<z.ZodEnum<["pending", "running", "completed", "failed"]>>;
        error: z.ZodOptional<z.ZodString>;
        startedAt: z.ZodOptional<z.ZodDate>;
        completedAt: z.ZodOptional<z.ZodDate>;
        createdAt: z.ZodDate;
    } & {
        results: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            simulationRunId: z.ZodString;
            alternativeId: z.ZodString;
            weightedScore: z.ZodOptional<z.ZodNumber>;
            expectedMonetaryValue: z.ZodOptional<z.ZodNumber>;
            expectedUtility: z.ZodOptional<z.ZodNumber>;
            bestCase: z.ZodOptional<z.ZodNumber>;
            worstCase: z.ZodOptional<z.ZodNumber>;
            riskMetrics: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            sensitivityData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
            rank: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            createdAt: z.ZodDate;
        }, "strip", z.ZodTypeAny, {
            id: string;
            createdAt: Date;
            alternativeId: string;
            simulationRunId: string;
            weightedScore?: number | undefined;
            expectedMonetaryValue?: number | undefined;
            expectedUtility?: number | undefined;
            bestCase?: number | undefined;
            worstCase?: number | undefined;
            riskMetrics?: Record<string, number> | undefined;
            sensitivityData?: Record<string, number> | undefined;
            rank?: number | undefined;
            details?: Record<string, unknown> | undefined;
        }, {
            id: string;
            createdAt: Date;
            alternativeId: string;
            simulationRunId: string;
            weightedScore?: number | undefined;
            expectedMonetaryValue?: number | undefined;
            expectedUtility?: number | undefined;
            bestCase?: number | undefined;
            worstCase?: number | undefined;
            riskMetrics?: Record<string, number> | undefined;
            sensitivityData?: Record<string, number> | undefined;
            rank?: number | undefined;
            details?: Record<string, unknown> | undefined;
        }>, "many">;
        scenario: z.ZodObject<{
            id: z.ZodString;
            decisionId: z.ZodString;
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            isBaseline: z.ZodDefault<z.ZodBoolean>;
            parentScenarioId: z.ZodOptional<z.ZodString>;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            decisionId: string;
            isBaseline: boolean;
            description?: string | undefined;
            parentScenarioId?: string | undefined;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            decisionId: string;
            description?: string | undefined;
            isBaseline?: boolean | undefined;
            parentScenarioId?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "pending" | "running" | "failed";
        id: string;
        createdAt: Date;
        scenarioId: string;
        algorithmVersion: string;
        inputSnapshot: Record<string, unknown>;
        results: {
            id: string;
            createdAt: Date;
            alternativeId: string;
            simulationRunId: string;
            weightedScore?: number | undefined;
            expectedMonetaryValue?: number | undefined;
            expectedUtility?: number | undefined;
            bestCase?: number | undefined;
            worstCase?: number | undefined;
            riskMetrics?: Record<string, number> | undefined;
            sensitivityData?: Record<string, number> | undefined;
            rank?: number | undefined;
            details?: Record<string, unknown> | undefined;
        }[];
        scenario: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            decisionId: string;
            isBaseline: boolean;
            description?: string | undefined;
            parentScenarioId?: string | undefined;
        };
        error?: string | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }, {
        id: string;
        createdAt: Date;
        scenarioId: string;
        algorithmVersion: string;
        inputSnapshot: Record<string, unknown>;
        results: {
            id: string;
            createdAt: Date;
            alternativeId: string;
            simulationRunId: string;
            weightedScore?: number | undefined;
            expectedMonetaryValue?: number | undefined;
            expectedUtility?: number | undefined;
            bestCase?: number | undefined;
            worstCase?: number | undefined;
            riskMetrics?: Record<string, number> | undefined;
            sensitivityData?: Record<string, number> | undefined;
            rank?: number | undefined;
            details?: Record<string, unknown> | undefined;
        }[];
        scenario: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            decisionId: string;
            description?: string | undefined;
            isBaseline?: boolean | undefined;
            parentScenarioId?: string | undefined;
        };
        status?: "completed" | "pending" | "running" | "failed" | undefined;
        error?: string | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    scenarios: {
        status: "completed" | "pending" | "running" | "failed";
        id: string;
        createdAt: Date;
        scenarioId: string;
        algorithmVersion: string;
        inputSnapshot: Record<string, unknown>;
        results: {
            id: string;
            createdAt: Date;
            alternativeId: string;
            simulationRunId: string;
            weightedScore?: number | undefined;
            expectedMonetaryValue?: number | undefined;
            expectedUtility?: number | undefined;
            bestCase?: number | undefined;
            worstCase?: number | undefined;
            riskMetrics?: Record<string, number> | undefined;
            sensitivityData?: Record<string, number> | undefined;
            rank?: number | undefined;
            details?: Record<string, unknown> | undefined;
        }[];
        scenario: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            decisionId: string;
            isBaseline: boolean;
            description?: string | undefined;
            parentScenarioId?: string | undefined;
        };
        error?: string | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }[];
    baseline: {
        status: "completed" | "pending" | "running" | "failed";
        id: string;
        createdAt: Date;
        scenarioId: string;
        algorithmVersion: string;
        inputSnapshot: Record<string, unknown>;
        results: {
            id: string;
            createdAt: Date;
            alternativeId: string;
            simulationRunId: string;
            weightedScore?: number | undefined;
            expectedMonetaryValue?: number | undefined;
            expectedUtility?: number | undefined;
            bestCase?: number | undefined;
            worstCase?: number | undefined;
            riskMetrics?: Record<string, number> | undefined;
            sensitivityData?: Record<string, number> | undefined;
            rank?: number | undefined;
            details?: Record<string, unknown> | undefined;
        }[];
        error?: string | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    };
}, {
    scenarios: {
        id: string;
        createdAt: Date;
        scenarioId: string;
        algorithmVersion: string;
        inputSnapshot: Record<string, unknown>;
        results: {
            id: string;
            createdAt: Date;
            alternativeId: string;
            simulationRunId: string;
            weightedScore?: number | undefined;
            expectedMonetaryValue?: number | undefined;
            expectedUtility?: number | undefined;
            bestCase?: number | undefined;
            worstCase?: number | undefined;
            riskMetrics?: Record<string, number> | undefined;
            sensitivityData?: Record<string, number> | undefined;
            rank?: number | undefined;
            details?: Record<string, unknown> | undefined;
        }[];
        scenario: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            decisionId: string;
            description?: string | undefined;
            isBaseline?: boolean | undefined;
            parentScenarioId?: string | undefined;
        };
        status?: "completed" | "pending" | "running" | "failed" | undefined;
        error?: string | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }[];
    baseline: {
        id: string;
        createdAt: Date;
        scenarioId: string;
        algorithmVersion: string;
        inputSnapshot: Record<string, unknown>;
        results: {
            id: string;
            createdAt: Date;
            alternativeId: string;
            simulationRunId: string;
            weightedScore?: number | undefined;
            expectedMonetaryValue?: number | undefined;
            expectedUtility?: number | undefined;
            bestCase?: number | undefined;
            worstCase?: number | undefined;
            riskMetrics?: Record<string, number> | undefined;
            sensitivityData?: Record<string, number> | undefined;
            rank?: number | undefined;
            details?: Record<string, unknown> | undefined;
        }[];
        status?: "completed" | "pending" | "running" | "failed" | undefined;
        error?: string | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    };
}>;
export type SimulationComparison = z.infer<typeof SimulationComparisonSchema>;
export declare function createApiResponse<T>(data: T, meta?: ApiResponse["meta"]): ApiResponse<T>;
export declare function createApiError(code: string, message: string, details?: Record<string, unknown>): ApiResponse<never>;
//# sourceMappingURL=index.d.ts.map