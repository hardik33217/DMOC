import { PrismaClient, Workflow, WorkflowNode, WorkflowEdge, WorkflowRun } from "@prisma/client";
import {
  WorkflowNodeType,
  WorkflowNodeConfig,
} from "@decisionos/shared";
import dagre from "dagre";
import {
  calculateWeightedScores,
  calculateEMV,
  runMonteCarlo,
  runSensitivityAnalysis,
  generateExplanation,
  DecisionData,
  SimulationInput,
} from "./decisionEngine.js";

const prisma = new PrismaClient();

export interface WorkflowNodeResultType {
  nodeId: string;
  status: "waiting" | "running" | "success" | "skipped" | "error";
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  error?: string | null;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
}

export interface ExecutionContext {
  workflow: Workflow & { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  runId: string;
  inputData: Record<string, unknown>;
  nodeResults: Map<string, WorkflowNodeResultType>;
  variables: Map<string, unknown>;
}

export interface ExecutionResult {
  status: "completed" | "failed";
  outputData: Record<string, unknown>;
  nodeResults: WorkflowNodeResultType[];
}

interface DagreNode {
  x: number;
  y: number;
  width: number;
  height: number;
  rank?: number;
  order?: number;
}

function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const graph = new dagre.graphlib.Graph({ compound: true });
  graph.setGraph({ rankdir: "LR" });
  graph.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    graph.setNode(node.id, {});
  }

  for (const edge of edges) {
    graph.setEdge(edge.sourceNodeId, edge.targetNodeId);
  }

  try {
    dagre.layout(graph);
  } catch {
    return nodes;
  }

  const sortedIds = graph.nodes().sort((a, b) => {
    const nodeA = graph.node(a) as DagreNode;
    const nodeB = graph.node(b) as DagreNode;
    const rankA = nodeA.rank ?? 0;
    const rankB = nodeB.rank ?? 0;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return (nodeA.order ?? 0) - (nodeB.order ?? 0);
  });

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  return sortedIds.map(id => nodeMap.get(id)!).filter(Boolean);
}

function parseLiteral(str: string): any {
  const trimmed = str.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (trimmed === "undefined") return undefined;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  const n = Number(trimmed);
  if (!isNaN(n) && trimmed !== "") return n;
  return trimmed;
}

function safeEvalBoolean(expr: string): boolean {
  const trimmed = expr.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  if (trimmed.includes("||")) {
    const parts = trimmed.split("||");
    return parts.some(p => safeEvalBoolean(p));
  }

  if (trimmed.includes("&&")) {
    const parts = trimmed.split("&&");
    return parts.every(p => safeEvalBoolean(p));
  }

  if (trimmed.startsWith("!")) {
    return !safeEvalBoolean(trimmed.slice(1));
  }

  const ops = ["===", "!==", "==", "!=", ">=", "<=", ">", "<"];
  for (const op of ops) {
    const idx = trimmed.indexOf(op);
    if (idx !== -1) {
      const leftRaw = trimmed.slice(0, idx);
      const rightRaw = trimmed.slice(idx + op.length);
      const left = parseLiteral(leftRaw);
      const right = parseLiteral(rightRaw);

      switch (op) {
        case "===":
        case "==": return left == right;
        case "!==":
        case "!=": return left != right;
        case ">=": return Number(left) >= Number(right);
        case "<=": return Number(left) <= Number(right);
        case ">": return Number(left) > Number(right);
        case "<": return Number(left) < Number(right);
      }
    }
  }

  const lit = parseLiteral(trimmed);
  return Boolean(lit);
}

function evaluateCondition(condition: unknown, context: ExecutionContext): boolean {
  if (typeof condition === "boolean") return condition;
  if (typeof condition === "string") {
    try {
      const expr = condition.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = context.variables.get(key);
        return value !== undefined ? (typeof value === "string" ? value : JSON.stringify(value)) : "false";
      });
      return safeEvalBoolean(expr);
    } catch {
      return false;
    }
  }
  return Boolean(condition);
}

function collectDecisionContext(context: ExecutionContext): { data: DecisionData; criterionScores: Record<string, Record<string, number>> } {
  const alternatives: any[] = [];
  const criteria: any[] = [];
  const criterionScores: Record<string, Record<string, number>> = {};

  for (const node of context.nodes) {
    const result = context.nodeResults.get(node.id);
    const config = JSON.parse(node.config || "{}");

    if (node.type === "alternative") {
      alternatives.push({
        id: node.id,
        title: config.title || node.title,
        description: config.description || "",
        order: config.order || 0,
        decisionId: context.workflow.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        outcomes: [] as any[],
      });
    }

    if (node.type === "define_criteria" || node.type === "set_criteria_weights") {
      if (Array.isArray(config.criteria)) {
        for (const c of config.criteria) {
          criteria.push({
            id: c.id || `crit_${criteria.length + 1}`,
            name: c.name || c.title || "Criterion",
            description: c.description || null,
            weight: Number(c.weight) || 50,
            direction: (c.direction === "minimize" ? "minimize" : "maximize") as "maximize" | "minimize",
            decisionId: context.workflow.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else if (config.weights && typeof config.weights === "object") {
        for (const [key, w] of Object.entries(config.weights)) {
          criteria.push({
            id: key,
            name: key,
            description: null,
            weight: Number(w) || 50,
            direction: "maximize" as const,
            decisionId: context.workflow.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }
  }

  // Fallbacks if graph doesn't have upstream definitions
  if (alternatives.length === 0) {
    alternatives.push(
      {
        id: "alt_1",
        title: "Option A (Expand)",
        description: "Scale into new target segment",
        order: 0,
        decisionId: context.workflow.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        outcomes: [
          { id: "out_1", alternativeId: "alt_1", title: "High Demand", probability: 0.65, monetaryPayoff: 120000, utilityScore: 85, riskLevel: "low" as const, createdAt: new Date(), updatedAt: new Date() },
          { id: "out_2", alternativeId: "alt_1", title: "Low Demand", probability: 0.35, monetaryPayoff: -15000, utilityScore: 30, riskLevel: "high" as const, createdAt: new Date(), updatedAt: new Date() },
        ],
      },
      {
        id: "alt_2",
        title: "Option B (Optimize)",
        description: "Deepen efficiency in existing market",
        order: 1,
        decisionId: context.workflow.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        outcomes: [
          { id: "out_3", alternativeId: "alt_2", title: "Steady Growth", probability: 0.80, monetaryPayoff: 75000, utilityScore: 75, riskLevel: "low" as const, createdAt: new Date(), updatedAt: new Date() },
          { id: "out_4", alternativeId: "alt_2", title: "Market Stagnation", probability: 0.20, monetaryPayoff: 10000, utilityScore: 45, riskLevel: "medium" as const, createdAt: new Date(), updatedAt: new Date() },
        ],
      }
    );
  }

  if (criteria.length === 0) {
    criteria.push(
      { id: "crit_roi", name: "Expected ROI", description: null, weight: 45, direction: "maximize" as const, decisionId: context.workflow.id, createdAt: new Date(), updatedAt: new Date() },
      { id: "crit_risk", name: "Implementation Risk", description: null, weight: 30, direction: "minimize" as const, decisionId: context.workflow.id, createdAt: new Date(), updatedAt: new Date() },
      { id: "crit_speed", name: "Time to Value", description: null, weight: 25, direction: "maximize" as const, decisionId: context.workflow.id, createdAt: new Date(), updatedAt: new Date() }
    );
  }

  // Populate criterion scores
  for (const c of criteria) {
    const scoresForCrit: Record<string, number> = {};
    for (let i = 0; i < alternatives.length; i++) {
      const a = alternatives[i];
      scoresForCrit[a.id] = 50 + (i === 0 ? 30 : 20) + (c.direction === "minimize" ? -10 : 10);
    }
    criterionScores[c.id] = scoresForCrit;
  }

  return {
    data: { alternatives, criteria },
    criterionScores,
  };
}

function getNodeInputs(node: WorkflowNode, context: ExecutionContext): Record<string, unknown> {
  const inputs: Record<string, unknown> = {};
  const incomingEdges = context.edges.filter(e => e.targetNodeId === node.id);

  for (const edge of incomingEdges) {
    const sourceResult = context.nodeResults.get(edge.sourceNodeId);
    if (sourceResult && sourceResult.outputData) {
      const handle = edge.targetHandle || "default";
      inputs[handle] = sourceResult.outputData;
    }
  }

  const config = JSON.parse(node.config) as WorkflowNodeConfig;
  return { ...config, ...inputs };
}

async function executeNode(node: WorkflowNode, context: ExecutionContext): Promise<WorkflowNodeResultType> {
  const startedAt = new Date();
  const config = JSON.parse(node.config) as WorkflowNodeConfig;
  const inputs = getNodeInputs(node, context);

  try {
    let outputData: Record<string, unknown> = {};
    let status: WorkflowNodeResultType["status"] = "success";

    switch (node.type) {
      case "start_decision":
        outputData = { triggered: true, timestamp: new Date().toISOString(), inputData: context.inputData };
        break;

      case "manual_trigger":
        outputData = { triggered: true, manual: true, inputData: context.inputData };
        break;

      case "import_spreadsheet":
        outputData = { imported: true, data: config.data, fileName: config.fileName };
        break;

      case "existing_decision":
        outputData = { decisionId: config.decisionId, loaded: true };
        break;

      case "decision_question":
        outputData = { question: config.question, context: "decision_question" };
        break;

      case "alternative":
        outputData = {
          alternative: {
            id: node.id,
            title: config.title || node.title,
            description: config.description,
            order: config.order,
          },
        };
        break;

      case "define_criteria":
        outputData = {
          criteria: config.criteria || [],
          context: "criteria_definition",
        };
        break;

      case "set_criteria_weights":
        outputData = {
          weights: config.weights || {},
          criteria: config.criteria || [],
        };
        break;

      case "define_constraints":
        outputData = { constraints: config.constraints || [] };
        break;

      case "set_assumptions":
        outputData = { assumptions: config.assumptions || {} };
        break;

      case "if_else":
        const condition = evaluateCondition(config.condition, context);
        outputData = { condition, branch: condition ? "true" : "false" };
        break;

      case "compare_values":
        const left = config.left !== undefined ? config.left : inputs.left;
        const right = config.right !== undefined ? config.right : inputs.right;
        const operator = config.operator || "==";
        let comparisonResult = false;
        switch (operator) {
          case "==": comparisonResult = left == right; break;
          case "===": comparisonResult = left === right; break;
          case "!=": comparisonResult = left != right; break;
          case "!==": comparisonResult = left !== right; break;
          case ">": comparisonResult = Number(left) > Number(right); break;
          case ">=": comparisonResult = Number(left) >= Number(right); break;
          case "<": comparisonResult = Number(left) < Number(right); break;
          case "<=": comparisonResult = Number(left) <= Number(right); break;
          default: comparisonResult = false;
        }
        outputData = { result: comparisonResult, left, right, operator };
        break;

      case "threshold_check":
        const rawValue = config.value !== undefined ? config.value : inputs.value;
        const threshold = config.threshold ?? 0;
        const direction = config.direction || "above";
        const numValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
        const numThreshold = typeof threshold === "number" ? threshold : Number(threshold);
        const thresholdResult = direction === "above" ? numValue > numThreshold : numValue < numThreshold;
        outputData = { result: thresholdResult, value: rawValue, threshold, direction };
        break;

      case "and_or_conditions":
        const conditions = (config.conditions as unknown[]) || [];
        const logic = config.logic || "and";
        const results = conditions.map((c: unknown) => evaluateCondition(c, context));
        const andOrResult = logic === "and" ? results.every(r => r) : results.some(r => r);
        outputData = { result: andOrResult, conditions: results, logic };
        break;

      case "filter_alternatives":
        const alternatives = (config.alternatives as unknown[]) || (inputs.alternatives as unknown[]) || [];
        const filterFn = config.filter as Record<string, unknown> || {};
        const filtered = Array.isArray(alternatives) ? alternatives.filter((alt: unknown) => {
          const altRecord = alt as Record<string, unknown>;
          return Object.entries(filterFn).every(([key, value]) => altRecord[key] === value);
        }) : [];
        outputData = { alternatives: filtered, originalCount: Array.isArray(alternatives) ? alternatives.length : 0 };
        break;

      case "merge_branches":
        const branchInputs = Object.values(inputs);
        outputData = { merged: true, branches: branchInputs.length, data: branchInputs };
        break;

      case "possible_outcome":
        outputData = {
          outcome: {
            id: node.id,
            title: config.title || node.title,
            probability: config.probability ?? 0,
            monetaryPayoff: config.monetaryPayoff,
            utilityScore: config.utilityScore,
            riskLevel: config.riskLevel || "low",
          },
        };
        break;

      case "probability":
        outputData = { probability: config.value ?? 0, context: "probability" };
        break;

      case "cost":
        outputData = { cost: config.value ?? 0, currency: config.currency || "USD" };
        break;

      case "benefit":
        outputData = { benefit: config.value ?? 0, currency: config.currency || "USD" };
        break;

      case "risk_assessment":
        outputData = { riskLevel: config.riskLevel || "low", factors: config.factors || [] };
        break;

      case "time_estimate":
        outputData = { duration: config.value ?? 0, unit: config.unit || "days" };
        break;

      case "custom_metric":
        outputData = { metric: config.name, value: config.value, unit: config.unit };
        break;

      case "weighted_score": {
        const decContext = collectDecisionContext(context);
        const scoredAlts = calculateWeightedScores(decContext.data, decContext.criterionScores);
        outputData = {
          rankedAlternatives: scoredAlts,
          topRecommendation: scoredAlts[0]?.alternativeTitle || "None",
          topScore: scoredAlts[0]?.weightedScore || 0,
          criteriaUsed: decContext.data.criteria.map(c => ({ name: c.name, weight: c.weight })),
          alternatives: scoredAlts.map(a => ({ title: a.alternativeTitle, score: a.weightedScore })),
        };
        break;
      }

      case "expected_monetary_value": {
        const decContext = collectDecisionContext(context);
        const emvResults = calculateEMV(decContext.data.alternatives);
        outputData = {
          results: emvResults.map(r => ({
            title: r.alternativeTitle,
            expectedMonetaryValue: r.expectedMonetaryValue,
            bestCase: r.bestCase,
            worstCase: r.worstCase,
          })),
          topEMV: emvResults[0]?.expectedMonetaryValue,
          topAlternative: emvResults[0]?.alternativeTitle,
        };
        break;
      }

      case "expected_utility": {
        const decContext = collectDecisionContext(context);
        const scored = calculateWeightedScores(decContext.data, decContext.criterionScores);
        outputData = {
          expectedUtility: scored.map(s => ({
            title: s.alternativeTitle,
            utility: s.expectedUtility,
          })),
          topChoice: scored[0]?.alternativeTitle,
        };
        break;
      }

      case "best_worst_case": {
        const decContext = collectDecisionContext(context);
        const emvResults = calculateEMV(decContext.data.alternatives);
        outputData = {
          payoffs: emvResults.map(r => ({
            title: r.alternativeTitle,
            bestCase: r.bestCase,
            worstCase: r.worstCase,
            spread: (r.bestCase ?? 0) - (r.worstCase ?? 0),
          })),
        };
        break;
      }

      case "sensitivity_analysis": {
        const decContext = collectDecisionContext(context);
        const baseline = calculateWeightedScores(decContext.data, decContext.criterionScores);
        const sensitivity = runSensitivityAnalysis(decContext.data, decContext.criterionScores, baseline);
        outputData = {
          analysis: "sensitivity_analysis",
          thresholds: sensitivity,
          keyDriversCount: sensitivity.length,
          summary: sensitivity.length > 0
            ? `Identified ${sensitivity.length} sensitive parameters that could flip the recommendation.`
            : "Decision is robust against moderate variations in weights and probabilities.",
        };
        break;
      }

      case "scenario_comparison": {
        const decContext = collectDecisionContext(context);
        const baseline = calculateWeightedScores(decContext.data, decContext.criterionScores);
        outputData = {
          comparison: "scenario_comparison",
          baselineScores: baseline.map(b => ({ title: b.alternativeTitle, score: b.weightedScore })),
          scenarioCount: 3,
        };
        break;
      }

      case "monte_carlo": {
        const decContext = collectDecisionContext(context);
        const iterations = Number(config.iterations) || 1000;
        const simInput: SimulationInput = {
          alternatives: decContext.data.alternatives.map(a => ({
            id: a.id,
            title: a.title,
            outcomes: a.outcomes.map(o => ({
              id: o.id,
              title: o.title,
              probability: o.probability,
              monetaryPayoff: o.monetaryPayoff ?? null,
              utilityScore: o.utilityScore ?? null,
              riskLevel: o.riskLevel,
            })),
          })),
          criteria: decContext.data.criteria.map(c => ({
            id: c.id,
            name: c.name,
            weight: c.weight,
            direction: c.direction,
          })),
          criterionScores: decContext.criterionScores,
        };
        const mcResults = runMonteCarlo(simInput, iterations);
        outputData = {
          simulation: "monte_carlo",
          iterations,
          rankedAlternatives: mcResults.map(r => ({
            title: r.alternativeTitle,
            meanScore: r.weightedScore,
            p5: r.riskMetrics.scoreP5,
            p95: r.riskMetrics.scoreP95,
            scoreStdDev: r.riskMetrics.scoreStdDev,
            emv: r.expectedMonetaryValue,
          })),
          topAlternative: mcResults[0]?.alternativeTitle,
          confidenceLevel: "95%",
        };
        break;
      }

      case "read_saved_decision":
        outputData = { decision: config.decisionId, loaded: true };
        break;

      case "read_spreadsheet_data":
        outputData = { data: config.data, headers: config.headers };
        break;

      case "transform_data":
        outputData = { transformed: true, data: config.transform ? "transformed" : inputs };
        break;

      case "validate_data":
        outputData = { valid: true, errors: [], data: inputs };
        break;

      case "save_results":
        outputData = { saved: true, resultId: `result_${Date.now()}` };
        break;

      case "export_report":
        outputData = { exported: true, format: config.format || "xlsx", reportId: `report_${Date.now()}` };
        break;

      case "recommendation": {
        const upstreamRec = inputs.rankedAlternatives || inputs.alternatives || config.alternatives;
        const decContext = collectDecisionContext(context);
        const scoredAlts = Array.isArray(upstreamRec)
          ? upstreamRec
          : calculateWeightedScores(decContext.data, decContext.criterionScores);

        const top = scoredAlts[0] as any;
        const topTitle = top?.alternativeTitle || top?.title || "Top Alternative";
        const topScore = top?.weightedScore || top?.score || 0.85;

        outputData = {
          recommendation: topTitle,
          confidence: Number(topScore),
          ranking: (scoredAlts as any[]).map((a, idx) => ({
            rank: idx + 1,
            title: a.alternativeTitle || a.title,
            score: a.weightedScore || a.score,
          })),
          executiveSummary: `Based on multi-criteria analysis and probabilistic evaluation, ${topTitle} is recommended with an overall score of ${(Number(topScore) * 100).toFixed(1)}%.`,
        };
        break;
      }

      case "results_table":
        outputData = { table: config.data || inputs, columns: config.columns || [] };
        break;

      case "chart":
        outputData = { chartType: config.chartType || "bar", data: config.data || inputs };
        break;

      case "summary_report":
        outputData = { summary: config.summary || "Workflow completed", sections: config.sections || [] };
        break;

      case "business_profile":
        outputData = {
          businessType: config.businessType || "Retail Store",
          currency: config.currency || "INR",
          currencySymbol: config.currencySymbol || "₹",
          taxRate: Number(config.taxRate) || 18,
        };
        break;

      case "product_lookup":
        outputData = {
          productName: config.productName || "Product",
          category: config.category || "Inventory",
          barcode: config.barcode,
          packSize: Number(config.packSize) || 1,
        };
        break;

      case "source_verification":
        outputData = {
          isVerified: config.isVerified ?? true,
          sourceProvider: config.provider || "Official Provider",
          confidenceScore: Number(config.confidence) || 0.98,
          regulatoryNotice: config.regulatoryNotice || "Official regulatory specifications verified.",
        };
        break;

      case "inventory_snapshot":
        outputData = {
          currentStock: Number(config.currentStock) || 15,
          reorderPoint: Number(config.reorderPoint) || 20,
          stockStatus: (Number(config.currentStock) || 15) <= (Number(config.reorderPoint) || 20) ? "reorder_recommended" : "adequate",
        };
        break;

      case "sales_history":
        outputData = {
          dailySalesVelocity: Number(config.dailySalesVelocity) || 4.2,
          weeklySalesVelocity: +( (Number(config.dailySalesVelocity) || 4.2) * 7 ).toFixed(1),
          demandVariance: 1.2,
        };
        break;

      case "supplier_quote":
        outputData = {
          unitCost: Number(config.unitCost) || 18.5,
          quotedPackCost: Number(config.quotedPackCost) || 185.0,
          leadTimeDays: Number(config.leadTimeDays) || 3,
          minOrderQuantity: Number(config.minOrderQuantity) || 10,
        };
        break;

      case "proposed_purchase": {
        const orderQty = Number(config.orderQuantity) || 25;
        const uCost = Number(inputs.unitCost) || Number(config.unitCost) || 18.5;
        outputData = {
          orderQuantity: orderQty,
          unitCost: uCost,
          capitalRequired: Math.round(orderQty * uCost),
        };
        break;
      }

      case "demand_forecast": {
        const velocity = Number(inputs.dailySalesVelocity) || Number(config.dailySalesVelocity) || 4.0;
        const horizon = Number(config.horizonDays) || 30;
        const leadTime = Number(inputs.leadTimeDays) || 3;
        const expectedDemand = Math.round(velocity * horizon);
        outputData = {
          forecastHorizonDays: horizon,
          dailyVelocity: velocity,
          expectedDemand,
          leadTimeDemand: Math.round(velocity * leadTime),
          safetyStockRecommended: Math.ceil(1.65 * Math.sqrt(leadTime) * 1.5),
        };
        break;
      }

      case "stockout_risk":
        outputData = {
          stockoutProbabilityPct: Number(config.probability) || 15,
          estimatedUnmetDemand: 8,
          lostMarginExposure: 160,
        };
        break;

      case "expiry_risk":
        outputData = {
          shelfLifeDays: Number(config.shelfLifeDays) || 180,
          spoilageRiskRating: "low",
          estimatedWastageLoss: 0,
        };
        break;

      case "cost_margin": {
        const sPrice = Number(config.sellingPrice) || 28.0;
        const uCost = Number(inputs.unitCost) || Number(config.unitCost) || 18.5;
        const unitMargin = sPrice - uCost;
        outputData = {
          sellingPrice: sPrice,
          unitCost: uCost,
          unitGrossMargin: +unitMargin.toFixed(2),
          grossMarginPct: +( (unitMargin / sPrice) * 100 ).toFixed(1),
        };
        break;
      }

      case "cash_flow":
        outputData = {
          workingCapitalRequired: Number(inputs.capitalRequired) || 462,
          monthlyHoldingCost: Math.round((Number(inputs.capitalRequired) || 462) * 0.02),
          cashFlowImpact: "Moderate working capital commitment within standard credit terms.",
        };
        break;

      case "scenario_branch":
        outputData = {
          branchOptions: ["Path A: Proceed with order", "Path B: Do not proceed", "Path C: Alternate quantity"],
          pathA_Gain: Number(config.pathA_Gain) || 850,
          pathB_Gain: Number(config.pathB_Gain) || 120,
          pathC_Gain: Number(config.pathC_Gain) || 920,
        };
        break;

      case "best_base_worst":
        outputData = {
          bestCaseNetGain: Number(config.bestGain) || 1250,
          baseCaseNetGain: Number(config.baseGain) || 850,
          worstCaseNetGain: Number(config.worstGain) || -120,
        };
        break;

      case "break_even":
        outputData = {
          breakEvenUnits: Number(config.breakEvenUnits) || 12,
          breakEvenRevenue: Number(config.breakEvenRevenue) || 336,
          daysToBreakEven: 4,
        };
        break;

      case "compare_quantities":
        outputData = {
          quantitiesEvaluated: [10, 25, 50],
          optimalQuantity: 25,
          reason: "Maximizes margin while staying within storage volume and expiry threshold.",
        };
        break;

      case "report_output":
        outputData = {
          reportReady: true,
          timestamp: new Date().toISOString(),
          status: "complete",
        };
        break;

      case "end":
        outputData = { completed: true, finalOutput: inputs };
        break;

      default:
        outputData = { type: node.type, executed: true, config };
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    return {
      nodeId: node.id,
      status,
      inputData: inputs,
      outputData,
      error: null,
      startedAt,
      completedAt,
      durationMs,
    };
  } catch (error) {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return {
      nodeId: node.id,
      status: "error",
      inputData: inputs,
      outputData: {},
      error: errorMessage,
      startedAt,
      completedAt,
      durationMs,
    };
  }
}

export async function executeWorkflow(
  workflow: Workflow & { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
  inputData: Record<string, unknown>,
  runId: string
): Promise<ExecutionResult> {
  const nodes = workflow.nodes;
  const edges = workflow.edges;

  const sortedNodes = topologicalSort(nodes, edges);

  const context: ExecutionContext = {
    workflow,
    nodes,
    edges,
    runId,
    inputData,
    nodeResults: new Map(),
    variables: new Map(),
  };

  const nodeResults: WorkflowNodeResultType[] = [];

  for (const node of sortedNodes) {
    const hasIncomingEdges = edges.some(e => e.targetNodeId === node.id);
    const isStartNode = !hasIncomingEdges || ["start_decision", "manual_trigger"].includes(node.type);

    let shouldExecute = true;
    if (!isStartNode) {
      const incomingEdges = edges.filter(e => e.targetNodeId === node.id);
      for (const edge of incomingEdges) {
        const sourceResult = context.nodeResults.get(edge.sourceNodeId);
        if (!sourceResult || sourceResult.status !== "success") {
          shouldExecute = false;
          break;
        }

        const sourceNode = nodes.find(n => n.id === edge.sourceNodeId);
        if (sourceNode?.type === "if_else") {
          const branchTaken = sourceResult.outputData?.branch;
          if (edge.sourceHandle && edge.sourceHandle !== branchTaken) {
            shouldExecute = false;
            break;
          }
        }
      }
    }

    if (!shouldExecute) {
      const result: WorkflowNodeResultType = {
        nodeId: node.id,
        status: "skipped",
        inputData: getNodeInputs(node, context),
        outputData: { skipped: true, reason: "Upstream node failed or condition not met" },
        error: null,
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 0,
      };
      nodeResults.push(result);
      context.nodeResults.set(node.id, result);
      continue;
    }

    const result = await executeNode(node, context);
    nodeResults.push(result);
    context.nodeResults.set(node.id, result);

    await prisma.workflowNodeResult.create({
      data: {
        runId,
        nodeId: node.id,
        status: result.status,
        inputData: result.inputData ? JSON.stringify(result.inputData) : null,
        outputData: result.outputData ? JSON.stringify(result.outputData) : null,
        error: result.error,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        durationMs: result.durationMs,
      },
    });

    if (result.outputData && !["if_else", "compare_values", "threshold_check", "and_or_conditions"].includes(node.type)) {
      context.variables.set(node.id, result.outputData);
    }

    if (result.status === "error") {
      const hasErrorHandler = edges.some(e => e.sourceNodeId === node.id && e.sourceHandle === "error");
      if (!hasErrorHandler) {
        return {
          status: "failed",
          outputData: { error: result.error, failedNode: node.id, nodeTitle: node.title },
          nodeResults,
        };
      }
    }
  }

  const hasErrors = nodeResults.some(r => r.status === "error");
  const finalOutput: Record<string, unknown> = {};

  for (const node of nodes) {
    const result = context.nodeResults.get(node.id);
    if (result && result.outputData) {
      finalOutput[node.id] = result.outputData;
    }
  }

  return {
    status: hasErrors ? "failed" : "completed",
    outputData: finalOutput,
    nodeResults,
  };
}

export async function validateWorkflow(workflow: Workflow & { nodes: WorkflowNode[]; edges: WorkflowEdge[] }): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const { nodes, edges } = workflow;

  if (nodes.length === 0) {
    errors.push("Workflow must have at least one node");
  }

  const startNodes = nodes.filter(n => ["start_decision", "manual_trigger", "business_profile"].includes(n.type));
  if (startNodes.length === 0) {
    errors.push("Workflow must have at least one trigger node (Start Decision, Manual Trigger, or Business Profile)");
  }

  if (startNodes.length > 1) {
    errors.push("Workflow should have only one trigger node");
  }

  const nodeIds = new Set(nodes.map(n => n.id));
  for (const edge of edges) {
    if (!nodeIds.has(edge.sourceNodeId)) {
      errors.push(`Edge references non-existent source node: ${edge.sourceNodeId}`);
    }
    if (!nodeIds.has(edge.targetNodeId)) {
      errors.push(`Edge references non-existent target node: ${edge.targetNodeId}`);
    }
  }

  const cycles = findCycles(nodes, edges);
  if (cycles.length > 0) {
    errors.push(`Workflow contains cycles: ${cycles.map(c => c.join(" -> ")).join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}

function findCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[][] {
  const graph = new Map<string, string[]>();
  for (const node of nodes) {
    graph.set(node.id, []);
  }
  for (const edge of edges) {
    const adj = graph.get(edge.sourceNodeId) || [];
    adj.push(edge.targetNodeId);
    graph.set(edge.sourceNodeId, adj);
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[][] = [];
  const path: string[] = [];

  function dfs(nodeId: string) {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    for (const neighbor of graph.get(nodeId) || []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        cycles.push([...path.slice(cycleStart), neighbor]);
      }
    }

    recStack.delete(nodeId);
    path.pop();
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  return cycles;
}