import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { validateBody, validateQuery, uuidParamSchema } from "../utils/validation.js";
import { createApiResponse, createApiError } from "@decisionos/shared";
import { AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as XLSX from "xlsx";
import crypto from "crypto";
import multer from "multer";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only .xlsx, .xls, and .csv files are allowed"));
    }
  },
});

const excelImportSchema = z.object({
  decisionId: z.string().uuid().optional(),
  createNew: z.preprocess((v) => v === "true" || v === true, z.boolean()).default(true),
  title: z.string().min(1).max(200).optional(),
});

/** Escape spreadsheet formula-leading characters to prevent injection */
function escapeFormulaCell(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const dangerousChars = ["=", "+", "-", "@", "\t", "\r"];
  if (dangerousChars.some((c) => value.startsWith(c))) {
    return `'${value}`;
  }
  return value;
}

function escapeRow(row: Record<string, unknown>): Record<string, unknown> {
  const escaped: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(row)) {
    escaped[key] = escapeFormulaCell(val);
  }
  return escaped;
}

router.get("/template", asyncHandler(async (_req: AuthRequest, res: Response) => {
  const wb = XLSX.utils.book_new();

  const decisionsSheet = XLSX.utils.json_to_sheet([{
    title: "Decision Title",
    description: "Description",
    category: "career",
    question: "What should I decide?",
    deadline: "2024-12-31",
  }]);
  decisionsSheet["!cols"] = [{ wch: 30 }, { wch: 50 }, { wch: 15 }, { wch: 50 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, decisionsSheet, "Decisions");

  const alternativesSheet = XLSX.utils.json_to_sheet([{
    decisionTitle: "Decision Title",
    title: "Alternative A",
    description: "Description of alternative",
    order: 0,
  }]);
  alternativesSheet["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 50 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, alternativesSheet, "Alternatives");

  const criteriaSheet = XLSX.utils.json_to_sheet([{
    decisionTitle: "Decision Title",
    name: "Cost",
    description: "Total cost of the alternative",
    weight: 30,
    direction: "minimize",
    order: 0,
  }]);
  criteriaSheet["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 50 }, { wch: 10 }, { wch: 12 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, criteriaSheet, "Criteria");

  const outcomesSheet = XLSX.utils.json_to_sheet([{
    decisionTitle: "Decision Title",
    alternativeTitle: "Alternative A",
    title: "Success",
    description: "Positive outcome",
    probability: 0.7,
    monetaryPayoff: 50000,
    utilityScore: 80,
    riskLevel: "low",
    order: 0,
  }]);
  outcomesSheet["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 20 }, { wch: 50 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, outcomesSheet, "Outcomes");

  const readmeData = [
    { Field: "Decisions Sheet", Description: "One row per decision. Category must be one of: career, education, finance, business, personal, project, resource_allocation, other" },
    { Field: "Alternatives Sheet", Description: "One row per alternative. Link to decision via decisionTitle column. Order determines display order." },
    { Field: "Criteria Sheet", Description: "One row per criterion. Weight 0-100 (will be normalized). Direction: maximize or minimize." },
    { Field: "Outcomes Sheet", Description: "One row per outcome. Link to alternative via alternativeTitle. Probability 0-1. Risk: low, medium, high, critical." },
    { Field: "", Description: "" },
    { Field: "Example: probability", Description: "0.7 means 70% chance. All probabilities for one alternative should sum to approximately 1." },
    { Field: "Example: monetaryPayoff", Description: "Expected dollar value. Use negative numbers for costs. Leave blank if not applicable." },
    { Field: "Example: utilityScore", Description: "A subjective 0-100 satisfaction score. Leave blank if not applicable." },
  ];
  const readmeSheet = XLSX.utils.json_to_sheet(readmeData);
  readmeSheet["!cols"] = [{ wch: 25 }, { wch: 100 }];
  XLSX.utils.book_append_sheet(wb, readmeSheet, "README");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=dmoc-template.xlsx");
  return res.send(buffer);
}));

interface ValidationError {
  sheet: string;
  row: number;
  field: string;
  message: string;
}

function validateImportData(
  decisionsData: Record<string, unknown>[],
  alternativesData: Record<string, unknown>[],
  criteriaData: Record<string, unknown>[],
  outcomesData: Record<string, unknown>[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const validCategories = ["career", "education", "finance", "business", "personal", "project", "resource_allocation", "other"];
  const validRiskLevels = ["low", "medium", "high", "critical"];
  const validDirections = ["maximize", "minimize"];

  for (const [i, row] of decisionsData.entries()) {
    if (!row.title) errors.push({ sheet: "Decisions", row: i + 2, field: "title", message: "Title is required" });
    if (!row.question) errors.push({ sheet: "Decisions", row: i + 2, field: "question", message: "Question is required" });
    if (row.category && !validCategories.includes(String(row.category))) {
      errors.push({ sheet: "Decisions", row: i + 2, field: "category", message: `Category must be one of: ${validCategories.join(", ")}` });
    }
  }

  const decisionTitles = new Set(decisionsData.map((d) => String(d.title)));

  for (const [i, row] of alternativesData.entries()) {
    if (!row.title) errors.push({ sheet: "Alternatives", row: i + 2, field: "title", message: "Title is required" });
    if (!row.decisionTitle) errors.push({ sheet: "Alternatives", row: i + 2, field: "decisionTitle", message: "Decision title is required" });
    if (row.decisionTitle && !decisionTitles.has(String(row.decisionTitle))) {
      errors.push({ sheet: "Alternatives", row: i + 2, field: "decisionTitle", message: `No matching decision found: "${row.decisionTitle}"` });
    }
  }

  for (const [i, row] of criteriaData.entries()) {
    if (!row.name) errors.push({ sheet: "Criteria", row: i + 2, field: "name", message: "Name is required" });
    if (!row.decisionTitle) errors.push({ sheet: "Criteria", row: i + 2, field: "decisionTitle", message: "Decision title is required" });
    if (typeof row.weight === "number" && (row.weight < 0 || row.weight > 100)) {
      errors.push({ sheet: "Criteria", row: i + 2, field: "weight", message: "Weight must be 0-100" });
    }
    if (row.direction && !validDirections.includes(String(row.direction))) {
      errors.push({ sheet: "Criteria", row: i + 2, field: "direction", message: "Direction must be maximize or minimize" });
    }
  }

  const altTitles = new Set(alternativesData.map((a) => String(a.title)));

  for (const [i, row] of outcomesData.entries()) {
    if (!row.title) errors.push({ sheet: "Outcomes", row: i + 2, field: "title", message: "Title is required" });
    if (!row.alternativeTitle) errors.push({ sheet: "Outcomes", row: i + 2, field: "alternativeTitle", message: "Alternative title is required" });
    if (row.alternativeTitle && !altTitles.has(String(row.alternativeTitle))) {
      errors.push({ sheet: "Outcomes", row: i + 2, field: "alternativeTitle", message: `No matching alternative found: "${row.alternativeTitle}"` });
    }
    if (typeof row.probability === "number" && (row.probability < 0 || row.probability > 1)) {
      errors.push({ sheet: "Outcomes", row: i + 2, field: "probability", message: "Probability must be between 0 and 1" });
    }
    if (row.riskLevel && !validRiskLevels.includes(String(row.riskLevel))) {
      errors.push({ sheet: "Outcomes", row: i + 2, field: "riskLevel", message: `Risk level must be one of: ${validRiskLevels.join(", ")}` });
    }
  }

  return errors;
}

router.post("/import/preview", upload.single("file"), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json(createApiError("VALIDATION_ERROR", "No file uploaded"));
  }

  const wb = XLSX.read(req.file.buffer, { type: "buffer" });
  const sheets = wb.SheetNames;

  const requiredSheets = ["Decisions", "Alternatives", "Criteria", "Outcomes"];
  const missingSheets = requiredSheets.filter((s) => !sheets.includes(s));
  if (missingSheets.length > 0) {
    return res.status(400).json(createApiError("VALIDATION_ERROR", `Missing required sheets: ${missingSheets.join(", ")}`));
  }

  const decisionsData = XLSX.utils.sheet_to_json(wb.Sheets["Decisions"]!) as Record<string, unknown>[];
  const alternativesData = XLSX.utils.sheet_to_json(wb.Sheets["Alternatives"]!) as Record<string, unknown>[];
  const criteriaData = XLSX.utils.sheet_to_json(wb.Sheets["Criteria"]!) as Record<string, unknown>[];
  const outcomesData = XLSX.utils.sheet_to_json(wb.Sheets["Outcomes"]!) as Record<string, unknown>[];

  const validationErrors = validateImportData(decisionsData, alternativesData, criteriaData, outcomesData);

  const preview = {
    decisions: decisionsData.slice(0, 10),
    alternatives: alternativesData.slice(0, 10),
    criteria: criteriaData.slice(0, 10),
    outcomes: outcomesData.slice(0, 10),
    rowCounts: {
      decisions: decisionsData.length,
      alternatives: alternativesData.length,
      criteria: criteriaData.length,
      outcomes: outcomesData.length,
    },
    validationErrors,
    isValid: validationErrors.length === 0,
  };

  return res.json(createApiResponse(preview));
}));

router.post("/import/confirm", upload.single("file"), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json(createApiError("VALIDATION_ERROR", "No file uploaded"));
  }

  const parsed = excelImportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(createApiError("VALIDATION_ERROR", "Invalid import parameters", {
      issues: parsed.error.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    }));
  }

  const { decisionId, createNew, title } = parsed.data;
  const userId = req.user!.id;

  const wb = XLSX.read(req.file.buffer, { type: "buffer" });

  const decisionsData = XLSX.utils.sheet_to_json(wb.Sheets["Decisions"]!) as Record<string, unknown>[];
  const alternativesData = XLSX.utils.sheet_to_json(wb.Sheets["Alternatives"]!) as Record<string, unknown>[];
  const criteriaData = XLSX.utils.sheet_to_json(wb.Sheets["Criteria"]!) as Record<string, unknown>[];
  const outcomesData = XLSX.utils.sheet_to_json(wb.Sheets["Outcomes"]!) as Record<string, unknown>[];

  // Re-validate before inserting
  const validationErrors = validateImportData(decisionsData, alternativesData, criteriaData, outcomesData);
  if (validationErrors.length > 0) {
    return res.status(400).json(createApiError("VALIDATION_ERROR", "Import data has validation errors", {
      errors: validationErrors,
    }));
  }

  const importJob = await prisma.importJob.create({
    data: { ownerId: userId, fileName: req.file.originalname, fileSize: req.file.size, status: "processing" },
  });

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      let targetDecisionId = decisionId;

      if (createNew || !decisionId) {
        const firstDecision = decisionsData[0];
        if (!firstDecision || !firstDecision.title || !firstDecision.question) {
          throw new Error("First decision row must have title and question");
        }

        const decision = await tx.decision.create({
          data: {
            ownerId: userId,
            title: String(firstDecision.title),
            description: firstDecision.description ? String(firstDecision.description) : null,
            category: (firstDecision.category as string) || "other",
            question: String(firstDecision.question),
            deadline: firstDecision.deadline ? new Date(String(firstDecision.deadline)) : null,
            status: "draft",
          },
        });
        targetDecisionId = decision.id;
      } else {
        const existing = await tx.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
        if (!existing) throw new Error("Decision not found or access denied");
      }

      const altMap = new Map<string, string>();
      for (const [index, row] of alternativesData.entries()) {
        if (!row.title || !row.decisionTitle) continue;
        const alt = await tx.alternative.create({
          data: {
            decisionId: targetDecisionId!,
            title: String(row.title),
            description: row.description ? String(row.description) : null,
            order: typeof row.order === "number" ? row.order : index,
          },
        });
        altMap.set(String(row.title), alt.id);
      }

      for (const row of criteriaData) {
        if (!row.name || !row.decisionTitle) continue;
        await tx.criterion.create({
          data: {
            decisionId: targetDecisionId!,
            name: String(row.name),
            description: row.description ? String(row.description) : null,
            weight: typeof row.weight === "number" ? Math.max(0, Math.min(100, row.weight)) : 1,
            direction: row.direction === "minimize" ? "minimize" : "maximize",
            order: typeof row.order === "number" ? row.order : 0,
          },
        });
      }

      for (const row of outcomesData) {
        if (!row.title || !row.alternativeTitle || !row.decisionTitle) continue;
        const altId = altMap.get(String(row.alternativeTitle));
        if (!altId) continue;

        await tx.outcome.create({
          data: {
            alternativeId: altId,
            title: String(row.title),
            description: row.description ? String(row.description) : null,
            probability: typeof row.probability === "number" ? Math.max(0, Math.min(1, row.probability)) : 0,
            monetaryPayoff: typeof row.monetaryPayoff === "number" ? row.monetaryPayoff : null,
            utilityScore: typeof row.utilityScore === "number" ? Math.max(0, Math.min(100, row.utilityScore)) : null,
            riskLevel: (row.riskLevel as string) || "low",
            order: typeof row.order === "number" ? row.order : 0,
          },
        });
      }

      // Create baseline scenario
      await tx.scenario.create({
        data: { decisionId: targetDecisionId!, name: "Baseline", isBaseline: true },
      });

      return targetDecisionId;
    });

    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        validationSummary: JSON.stringify({
          decisions: decisionsData.length,
          alternatives: alternativesData.length,
          criteria: criteriaData.length,
          outcomes: outcomesData.length,
        }),
      },
    });

    const decision = await prisma.decision.findUnique({
      where: { id: result! },
      include: { alternatives: { include: { outcomes: true } }, criteria: true },
    });

    return res.json(createApiResponse({ decision, importJobId: importJob.id }));
  } catch (error) {
    await prisma.importJob.update({
      where: { id: importJob.id },
      data: { status: "failed", errorReport: error instanceof Error ? error.message : "Unknown error", completedAt: new Date() },
    });
    throw error;
  }
}));

router.get("/export/:decisionId", asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({
    where: { id: decisionId, ownerId: userId },
    include: {
      alternatives: { include: { outcomes: true }, orderBy: { order: "asc" } },
      criteria: { orderBy: { order: "asc" } },
      scenarios: { include: { inputs: true, simulationRuns: { include: { results: true }, orderBy: { createdAt: "desc" }, take: 1 } } },
    },
  });

  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const wb = XLSX.utils.book_new();

  const decisionsSheet = XLSX.utils.json_to_sheet([escapeRow({
    title: decision.title,
    description: decision.description || "",
    category: decision.category,
    question: decision.question,
    status: decision.status,
    deadline: decision.deadline?.toISOString().split("T")[0] || "",
    createdAt: decision.createdAt.toISOString(),
  })]);
  decisionsSheet["!cols"] = [{ wch: 30 }, { wch: 50 }, { wch: 15 }, { wch: 50 }, { wch: 12 }, { wch: 15 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, decisionsSheet, "Decisions");

  const alternativesSheet = XLSX.utils.json_to_sheet(decision.alternatives.map((alt: any, i: number) => escapeRow({
    decisionTitle: decision.title,
    title: alt.title,
    description: alt.description || "",
    order: i,
  })));
  alternativesSheet["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 50 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, alternativesSheet, "Alternatives");

  const criteriaSheet = XLSX.utils.json_to_sheet(decision.criteria.map((c: any, i: number) => escapeRow({
    decisionTitle: decision.title,
    name: c.name,
    description: c.description || "",
    weight: c.weight,
    direction: c.direction,
    order: i,
  })));
  criteriaSheet["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 50 }, { wch: 10 }, { wch: 12 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, criteriaSheet, "Criteria");

  const outcomesExport = decision.alternatives.flatMap((alt: any) =>
    alt.outcomes.map((o: any, i: number) => escapeRow({
      decisionTitle: decision.title,
      alternativeTitle: alt.title,
      title: o.title,
      description: o.description || "",
      probability: o.probability,
      monetaryPayoff: o.monetaryPayoff ?? "",
      utilityScore: o.utilityScore ?? "",
      riskLevel: o.riskLevel,
      order: i,
    }))
  );
  const outcomesSheet = XLSX.utils.json_to_sheet(outcomesExport);
  outcomesSheet["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 20 }, { wch: 50 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, outcomesSheet, "Outcomes");

  // Add results sheet if simulation results exist
  const allResults = decision.scenarios.flatMap((s: any) =>
    s.simulationRuns.flatMap((run: any) =>
      run.results.map((r: any) => ({
        scenario: s.name,
        alternativeId: r.alternativeId,
        weightedScore: r.weightedScore,
        expectedMonetaryValue: r.expectedMonetaryValue,
        expectedUtility: r.expectedUtility,
        bestCase: r.bestCase,
        worstCase: r.worstCase,
        rank: r.rank,
      }))
    )
  );
  if (allResults.length > 0) {
    const resultsSheet = XLSX.utils.json_to_sheet(allResults);
    XLSX.utils.book_append_sheet(wb, resultsSheet, "Results");
  }

  const safeTitle = decision.title.replace(/[^a-z0-9 ]/gi, "_").substring(0, 50);
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.xlsx"`);
  return res.send(buffer);
}));

export { router as importExportRouter };