-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "question" TEXT NOT NULL,
    "deadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Decision_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alternative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "decisionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Alternative_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Criterion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "decisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" REAL NOT NULL DEFAULT 1,
    "direction" TEXT NOT NULL DEFAULT 'maximize',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Criterion_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Outcome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alternativeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "probability" REAL NOT NULL,
    "monetaryPayoff" REAL,
    "utilityScore" REAL,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Outcome_alternativeId_fkey" FOREIGN KEY ("alternativeId") REFERENCES "Alternative" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Outcome_alternativeId_fkey" FOREIGN KEY ("alternativeId") REFERENCES "Decision" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "decisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,
    "parentScenarioId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Scenario_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Scenario_parentScenarioId_fkey" FOREIGN KEY ("parentScenarioId") REFERENCES "Scenario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScenarioInput" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScenarioInput_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SimulationRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "inputSnapshot" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimulationRun_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SimulationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "simulationRunId" TEXT NOT NULL,
    "alternativeId" TEXT NOT NULL,
    "weightedScore" REAL,
    "expectedMonetaryValue" REAL,
    "expectedUtility" REAL,
    "bestCase" REAL,
    "worstCase" REAL,
    "riskMetrics" TEXT,
    "sensitivityData" TEXT,
    "rank" INTEGER,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimulationResult_simulationRunId_fkey" FOREIGN KEY ("simulationRunId") REFERENCES "SimulationRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SimulationResult_alternativeId_fkey" FOREIGN KEY ("alternativeId") REFERENCES "Alternative" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DecisionShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "decisionId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "accessLevel" TEXT NOT NULL DEFAULT 'view',
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "DecisionShare_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DecisionShare_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DecisionShare_recipientEmail_fkey" FOREIGN KEY ("recipientEmail") REFERENCES "User" ("email") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditEvent_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Decision" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "validationSummary" TEXT,
    "errorReport" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "ImportJob_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Decision_ownerId_idx" ON "Decision"("ownerId");

-- CreateIndex
CREATE INDEX "Decision_status_idx" ON "Decision"("status");

-- CreateIndex
CREATE INDEX "Decision_category_idx" ON "Decision"("category");

-- CreateIndex
CREATE INDEX "Decision_createdAt_idx" ON "Decision"("createdAt");

-- CreateIndex
CREATE INDEX "Alternative_decisionId_idx" ON "Alternative"("decisionId");

-- CreateIndex
CREATE INDEX "Alternative_decisionId_order_idx" ON "Alternative"("decisionId", "order");

-- CreateIndex
CREATE INDEX "Criterion_decisionId_idx" ON "Criterion"("decisionId");

-- CreateIndex
CREATE INDEX "Criterion_decisionId_order_idx" ON "Criterion"("decisionId", "order");

-- CreateIndex
CREATE INDEX "Outcome_alternativeId_idx" ON "Outcome"("alternativeId");

-- CreateIndex
CREATE INDEX "Outcome_alternativeId_order_idx" ON "Outcome"("alternativeId", "order");

-- CreateIndex
CREATE INDEX "Scenario_decisionId_idx" ON "Scenario"("decisionId");

-- CreateIndex
CREATE INDEX "Scenario_decisionId_isBaseline_idx" ON "Scenario"("decisionId", "isBaseline");

-- CreateIndex
CREATE INDEX "Scenario_parentScenarioId_idx" ON "Scenario"("parentScenarioId");

-- CreateIndex
CREATE INDEX "ScenarioInput_scenarioId_idx" ON "ScenarioInput"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioInput_scenarioId_entityType_entityId_field_key" ON "ScenarioInput"("scenarioId", "entityType", "entityId", "field");

-- CreateIndex
CREATE INDEX "SimulationRun_scenarioId_idx" ON "SimulationRun"("scenarioId");

-- CreateIndex
CREATE INDEX "SimulationRun_status_idx" ON "SimulationRun"("status");

-- CreateIndex
CREATE INDEX "SimulationRun_createdAt_idx" ON "SimulationRun"("createdAt");

-- CreateIndex
CREATE INDEX "SimulationResult_simulationRunId_idx" ON "SimulationResult"("simulationRunId");

-- CreateIndex
CREATE INDEX "SimulationResult_alternativeId_idx" ON "SimulationResult"("alternativeId");

-- CreateIndex
CREATE UNIQUE INDEX "SimulationResult_simulationRunId_alternativeId_key" ON "SimulationResult"("simulationRunId", "alternativeId");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionShare_shareToken_key" ON "DecisionShare"("shareToken");

-- CreateIndex
CREATE INDEX "DecisionShare_decisionId_idx" ON "DecisionShare"("decisionId");

-- CreateIndex
CREATE INDEX "DecisionShare_shareToken_idx" ON "DecisionShare"("shareToken");

-- CreateIndex
CREATE INDEX "DecisionShare_recipientEmail_idx" ON "DecisionShare"("recipientEmail");

-- CreateIndex
CREATE INDEX "DecisionShare_expiresAt_idx" ON "DecisionShare"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_idx" ON "AuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "AuditEvent_action_idx" ON "AuditEvent"("action");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "ImportJob_ownerId_idx" ON "ImportJob"("ownerId");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE INDEX "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");
