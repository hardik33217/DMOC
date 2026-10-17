/*
  Warnings:

  - Added the required column `decisionId` to the `Outcome` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Outcome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alternativeId" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
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
    CONSTRAINT "Outcome_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Outcome" ("alternativeId", "createdAt", "description", "id", "monetaryPayoff", "order", "probability", "riskLevel", "title", "updatedAt", "utilityScore") SELECT "alternativeId", "createdAt", "description", "id", "monetaryPayoff", "order", "probability", "riskLevel", "title", "updatedAt", "utilityScore" FROM "Outcome";
DROP TABLE "Outcome";
ALTER TABLE "new_Outcome" RENAME TO "Outcome";
CREATE INDEX "Outcome_alternativeId_idx" ON "Outcome"("alternativeId");
CREATE INDEX "Outcome_decisionId_idx" ON "Outcome"("decisionId");
CREATE INDEX "Outcome_alternativeId_order_idx" ON "Outcome"("alternativeId", "order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
