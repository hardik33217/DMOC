import { Prisma } from "@prisma/client";
import {
  Alternative,
  Criterion,
  Outcome,
  CriterionDirection,
  RiskLevel,
  SimulationResult,
} from "@decisionos/shared";

export interface DecisionData {
  alternatives: (Alternative & { outcomes: Outcome[] })[];
  criteria: Criterion[];
}

export interface ScoredAlternative {
  alternativeId: string;
  alternativeTitle: string;
  weightedScore: number;
  expectedMonetaryValue: number | null;
  expectedUtility: number | null;
  bestCase: number | null;
  worstCase: number | null;
  riskMetrics: Record<string, number>;
  details: {
    criteriaScores: Record<string, number>;
    criterionDetails: Record<string, { rawValue: number; normalizedValue: number; weight: number; direction: CriterionDirection }>;
    outcomeDetails: Array<{
      outcomeId: string;
      title: string;
      probability: number;
      monetaryPayoff: number | null;
      utilityScore: number | null;
      riskLevel: RiskLevel;
      contribution: number;
    }>;
  };
}

export interface SimulationInput {
  alternatives: Array<{
    id: string;
    title: string;
    outcomes: Array<{
      id: string;
      title: string;
      probability: number;
      monetaryPayoff: number | null;
      utilityScore: number | null;
      riskLevel: RiskLevel;
    }>;
  }>;
  criteria: Array<{
    id: string;
    name: string;
    weight: number;
    direction: CriterionDirection;
  }>;
  criterionScores: Record<string, Record<string, number>>;
}

export interface SensitivityResult {
  parameter: string;
  parameterType: "criterion_weight" | "outcome_probability" | "outcome_payoff" | "utility_score";
  baselineValue: number;
  thresholdValue: number;
  affectedAlternatives: string[];
  description: string;
}

export function normalizeValue(value: number, min: number, max: number, direction: CriterionDirection): number {
  if (max === min) return direction === "maximize" ? 1 : 0;
  const normalized = (value - min) / (max - min);
  return direction === "maximize" ? normalized : 1 - normalized;
}

export function calculateWeightedScores(data: DecisionData, criterionScores: Record<string, Record<string, number>>): ScoredAlternative[] {
  const { alternatives, criteria } = data;

  const criterionWeights = criteria.reduce((acc, c) => {
    acc[c.id] = c.weight / 100;
    return acc;
  }, {} as Record<string, number>);

  const totalWeight = Object.values(criterionWeights).reduce((sum, w) => sum + w, 0);
  const normalizedWeights = totalWeight > 0
    ? Object.fromEntries(Object.entries(criterionWeights).map(([k, v]) => [k, v / totalWeight]))
    : {};

  return alternatives.map(alt => {
    const criteriaScores: Record<string, number> = {};
    const criterionDetails: Record<string, { rawValue: number; normalizedValue: number; weight: number; direction: CriterionDirection }> = {};

    let weightedScore = 0;

    for (const criterion of criteria) {
      const rawValue = criterionScores[criterion.id]?.[alt.id] ?? 0;
      const allValues = alternatives.map(a => criterionScores[criterion.id]?.[a.id] ?? 0);
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);

      const normalizedValue = normalizeValue(rawValue, min, max, criterion.direction);
      const weight = normalizedWeights[criterion.id] ?? 0;

      criteriaScores[criterion.id] = normalizedValue;
      criterionDetails[criterion.id] = {
        rawValue,
        normalizedValue,
        weight,
        direction: criterion.direction,
      };

      weightedScore += normalizedValue * weight;
    }

    const outcomes = alt.outcomes;
    let expectedMonetaryValue: number | null = null;
    let expectedUtility: number | null = null;
    let bestCase: number | null = null;
    let worstCase: number | null = null;

    const validOutcomes = outcomes.filter(o => o.probability > 0);
    const totalProbability = validOutcomes.reduce((sum, o) => sum + o.probability, 0);

    if (validOutcomes.length > 0) {
      const normalizedOutcomes = validOutcomes.map(o => ({
        ...o,
        probability: totalProbability > 0 ? o.probability / totalProbability : 1 / validOutcomes.length,
      }));

      const monetaryOutcomes = normalizedOutcomes.filter(o => o.monetaryPayoff !== null);
      if (monetaryOutcomes.length > 0) {
        expectedMonetaryValue = monetaryOutcomes.reduce((sum, o) => sum + (o.monetaryPayoff ?? 0) * o.probability, 0);
        bestCase = Math.max(...monetaryOutcomes.map(o => o.monetaryPayoff ?? 0));
        worstCase = Math.min(...monetaryOutcomes.map(o => o.monetaryPayoff ?? 0));
      }

      const utilityOutcomes = normalizedOutcomes.filter(o => o.utilityScore !== null);
      if (utilityOutcomes.length > 0) {
        expectedUtility = utilityOutcomes.reduce((sum, o) => sum + (o.utilityScore ?? 0) * o.probability, 0);
      }
    }

    const riskLevels = outcomes.map(o => o.riskLevel);
    const riskMetrics = {
      highRiskCount: riskLevels.filter(r => r === "high" || r === "critical").length,
      mediumRiskCount: riskLevels.filter(r => r === "medium").length,
      lowRiskCount: riskLevels.filter(r => r === "low").length,
      avgRiskScore: riskLevels.reduce((sum, r) => sum + riskScore(r), 0) / (riskLevels.length || 1),
    };

    const outcomeDetails = outcomes.map(o => ({
      outcomeId: o.id,
      title: o.title,
      probability: o.probability,
      monetaryPayoff: o.monetaryPayoff ?? null,
      utilityScore: o.utilityScore ?? null,
      riskLevel: o.riskLevel,
      contribution: (o.monetaryPayoff ?? 0) * o.probability,
    }));

    return {
      alternativeId: alt.id,
      alternativeTitle: alt.title,
      weightedScore,
      expectedMonetaryValue,
      expectedUtility,
      bestCase,
      worstCase,
      riskMetrics,
      details: {
        criteriaScores,
        criterionDetails,
        outcomeDetails,
      },
    };
  }).sort((a, b) => b.weightedScore - a.weightedScore);
}

function riskScore(level: RiskLevel): number {
  switch (level) {
    case "critical": return 4;
    case "high": return 3;
    case "medium": return 2;
    case "low": return 1;
  }
}

export function calculateEMV(alternatives: (Alternative & { outcomes: Outcome[] })[]): ScoredAlternative[] {
  return alternatives.map(alt => {
    const outcomes = alt.outcomes.filter(o => o.probability > 0);
    const totalProb = outcomes.reduce((sum, o) => sum + o.probability, 0);
    const normalized = outcomes.map(o => ({ ...o, probability: totalProb > 0 ? o.probability / totalProb : 1 / outcomes.length }));

    const monetaryOutcomes = normalized.filter(o => o.monetaryPayoff !== null);
    const expectedMonetaryValue = monetaryOutcomes.length > 0
      ? monetaryOutcomes.reduce((sum, o) => sum + (o.monetaryPayoff ?? 0) * o.probability, 0)
      : null;

    const bestCase = monetaryOutcomes.length > 0 ? Math.max(...monetaryOutcomes.map(o => o.monetaryPayoff ?? 0)) : null;
    const worstCase = monetaryOutcomes.length > 0 ? Math.min(...monetaryOutcomes.map(o => o.monetaryPayoff ?? 0)) : null;

    return {
      alternativeId: alt.id,
      alternativeTitle: alt.title,
      weightedScore: 0,
      expectedMonetaryValue,
      expectedUtility: null,
      bestCase,
      worstCase,
      riskMetrics: {},
      details: { criteriaScores: {}, criterionDetails: {}, outcomeDetails: [] },
    };
  });
}

export function runMonteCarlo(
  input: SimulationInput,
  iterations: number = 10000,
  seed?: number
): ScoredAlternative[] {
  const rng = seed !== undefined ? new SeededRandom(seed) : { next: Math.random };

  const alternativeResults = input.alternatives.map(alt => ({
    alternativeId: alt.id,
    alternativeTitle: alt.title,
    scores: [] as number[],
    emvs: [] as number[],
    utilities: [] as number[],
  }));

  for (let i = 0; i < iterations; i++) {
    for (const alt of input.alternatives) {
      let iterationScore = 0;
      let iterationEMV = 0;
      let iterationUtility = 0;

      for (const criterion of input.criteria) {
        const rawScore = input.criterionScores[criterion.id]?.[alt.id] ?? 50;
        const normalizedBase = Math.max(0, Math.min(1, rawScore > 1 ? rawScore / 100 : rawScore));
        const noise = (rng.next() - 0.5) * 0.15;
        const score = Math.max(0, Math.min(1, normalizedBase + noise));
        iterationScore += score * (criterion.weight / 100);
      }

      for (const outcome of alt.outcomes) {
        const probNoise = (rng.next() - 0.5) * 0.05;
        const prob = Math.max(0, Math.min(1, outcome.probability + probNoise));

        if (outcome.monetaryPayoff !== null) {
          const payoffNoise = outcome.monetaryPayoff * 0.1 * (rng.next() - 0.5);
          iterationEMV += (outcome.monetaryPayoff + payoffNoise) * prob;
        }

        if (outcome.utilityScore !== null) {
          const utilityNoise = outcome.utilityScore * 0.1 * (rng.next() - 0.5);
          iterationUtility += (outcome.utilityScore + utilityNoise) * prob;
        }
      }

      const result = alternativeResults.find(r => r.alternativeId === alt.id)!;
      result.scores.push(iterationScore);
      result.emvs.push(iterationEMV);
      result.utilities.push(iterationUtility);
    }
  }

  return alternativeResults.map(r => {
    const sortedScores = [...r.scores].sort((a, b) => a - b);
    const sortedEMVs = [...r.emvs].sort((a, b) => a - b);

    const getPercentile = (arr: number[], p: number): number | null => {
      if (arr.length === 0) return null;
      const idx = Math.floor(arr.length * p);
      return arr[Math.min(idx, arr.length - 1)] ?? null;
    };

    return {
      alternativeId: r.alternativeId,
      alternativeTitle: r.alternativeTitle,
      weightedScore: mean(r.scores),
      expectedMonetaryValue: r.emvs.length > 0 ? mean(r.emvs) : null,
      expectedUtility: r.utilities.length > 0 ? mean(r.utilities) : null,
      bestCase: getPercentile(sortedEMVs, 0.95),
      worstCase: getPercentile(sortedEMVs, 0.05),
      riskMetrics: {
        scoreStdDev: stdDev(r.scores),
        emvStdDev: stdDev(r.emvs),
        scoreP5: percentile(sortedScores, 5),
        scoreP95: percentile(sortedScores, 95),
      },
      details: { criteriaScores: {}, criterionDetails: {}, outcomeDetails: [] },
    };
  }).sort((a, b) => b.weightedScore - a.weightedScore);
}

function mean(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function stdDev(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, x) => sum + Math.pow(x - m, 2), 0) / arr.length);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.floor(sorted.length * p / 100);
  return sorted[Math.min(idx, sorted.length - 1)] ?? 0;
}

class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
  [Symbol.iterator]() { return this; }
  // Make the instance callable
  [Symbol.toPrimitive]() { return this.next.bind(this); }
}

export function rankAlternativesByAlgorithm(
  results: ScoredAlternative[],
  algorithm: "weighted" | "monte_carlo" | "emv" | "utility" = "weighted"
): ScoredAlternative[] {
  return [...results].sort((a, b) => {
    if (algorithm === "emv") {
      const emvA = a.expectedMonetaryValue !== null && a.expectedMonetaryValue !== undefined ? a.expectedMonetaryValue : -Infinity;
      const emvB = b.expectedMonetaryValue !== null && b.expectedMonetaryValue !== undefined ? b.expectedMonetaryValue : -Infinity;
      if (emvA !== emvB) return emvB - emvA;
    } else if (algorithm === "utility") {
      const uA = a.expectedUtility !== null && a.expectedUtility !== undefined ? a.expectedUtility : -Infinity;
      const uB = b.expectedUtility !== null && b.expectedUtility !== undefined ? b.expectedUtility : -Infinity;
      if (uA !== uB) return uB - uA;
    }
    return b.weightedScore - a.weightedScore;
  });
}

export function runSensitivityAnalysis(
  data: DecisionData,
  criterionScores: Record<string, Record<string, number>>,
  baselineResults: ScoredAlternative[]
): SensitivityResult[] {
  const results: SensitivityResult[] = [];
  const baselineTop = baselineResults[0]?.alternativeId;

  if (!baselineTop) return results;

  for (const criterion of data.criteria) {
    const weight = criterion.weight;
    const threshold = findWeightThreshold(data, criterionScores, criterion.id, weight, baselineTop);
    if (threshold !== null) {
      results.push({
        parameter: criterion.name,
        parameterType: "criterion_weight",
        baselineValue: weight,
        thresholdValue: threshold,
        affectedAlternatives: [baselineTop],
        description: `Changing "${criterion.name}" weight from ${weight} to ${threshold.toFixed(1)} would change the top recommendation`,
      });
    }
  }

  for (const alt of data.alternatives) {
    for (const outcome of alt.outcomes) {
      if (outcome.probability > 0) {
        const probThreshold = findProbabilityThreshold(data, criterionScores, alt.id, outcome.id, outcome.probability, baselineTop);
        if (probThreshold !== null) {
          results.push({
            parameter: `${alt.title} → ${outcome.title} probability`,
            parameterType: "outcome_probability",
            baselineValue: outcome.probability,
            thresholdValue: probThreshold,
            affectedAlternatives: [alt.title],
            description: `Changing probability from ${outcome.probability.toFixed(2)} to ${probThreshold.toFixed(2)} would change the recommendation`,
          });
        }
      }

      if (typeof outcome.monetaryPayoff === "number") {
        const monetaryPayoff = outcome.monetaryPayoff;
        const payoffThreshold = findPayoffThreshold(data, criterionScores, alt.id, outcome.id, monetaryPayoff, baselineTop);
        if (payoffThreshold !== null) {
          results.push({
            parameter: `${alt.title} → ${outcome.title} payoff`,
            parameterType: "outcome_payoff",
            baselineValue: monetaryPayoff,
            thresholdValue: payoffThreshold,
            affectedAlternatives: [alt.title],
            description: `Changing payoff from ${monetaryPayoff} to ${payoffThreshold.toFixed(2)} would change the recommendation`,
          });
        }
      }
    }
  }

  return results;
}

function findWeightThreshold(
  data: DecisionData,
  criterionScores: Record<string, Record<string, number>>,
  criterionId: string,
  baselineWeight: number,
  baselineTopId: string
): number | null {
  const otherCriteria = data.criteria.filter(c => c.id !== criterionId);
  const otherWeightSum = otherCriteria.reduce((sum, c) => sum + c.weight, 0);

  for (let w = 0; w <= 100; w += 0.5) {
    const testCriteria = data.criteria.map(c => c.id === criterionId ? { ...c, weight: w } : c);
    const testData = { ...data, criteria: testCriteria };
    const results = calculateWeightedScores(testData, criterionScores);
    if (results[0]?.alternativeId !== baselineTopId) {
      return w;
    }
  }
  return null;
}

function findProbabilityThreshold(
  data: DecisionData,
  criterionScores: Record<string, Record<string, number>>,
  altId: string,
  outcomeId: string,
  baselineProb: number,
  baselineTopId: string
): number | null {
  const alt = data.alternatives.find(a => a.id === altId);
  if (!alt) return null;

  const outcome = alt.outcomes.find(o => o.id === outcomeId);
  if (!outcome) return null;

  const otherOutcomes = alt.outcomes.filter(o => o.id !== outcomeId);
  const otherProbSum = otherOutcomes.reduce((sum, o) => sum + o.probability, 0);

  for (let p = 0; p <= 1; p += 0.01) {
    const testOutcomes = alt.outcomes.map(o => {
      if (o.id === outcomeId) return { ...o, probability: p };
      const factor = otherProbSum > 0 ? (1 - p) / otherProbSum : 1 / otherOutcomes.length;
      return { ...o, probability: o.probability * factor };
    });

    const testData = {
      ...data,
      alternatives: data.alternatives.map(a => a.id === altId ? { ...a, outcomes: testOutcomes } : a),
    };
    const results = calculateWeightedScores(testData, criterionScores);
    if (results[0]?.alternativeId !== baselineTopId) {
      return p;
    }
  }
  return null;
}

function findPayoffThreshold(
  data: DecisionData,
  criterionScores: Record<string, Record<string, number>>,
  altId: string,
  outcomeId: string,
  baselinePayoff: number,
  baselineTopId: string
): number | null {
  const alt = data.alternatives.find(a => a.id === altId);
  if (!alt) return null;

  const outcome = alt.outcomes.find(o => o.id === outcomeId);
  if (!outcome) return null;

  const range = Math.abs(baselinePayoff) * 2 || 1000;
  const step = range / 100;

  for (let i = 0; i <= 100; i++) {
    const testPayoff = baselinePayoff - range + i * step;
    const testOutcomes = alt.outcomes.map(o => o.id === outcomeId ? { ...o, monetaryPayoff: testPayoff } : o);
    const testData = {
      ...data,
      alternatives: data.alternatives.map(a => a.id === altId ? { ...a, outcomes: testOutcomes } : a),
    };
    const results = calculateWeightedScores(testData, criterionScores);
    if (results[0]?.alternativeId !== baselineTopId) {
      return testPayoff;
    }
  }
  return null;
}

export function generateExplanation(results: ScoredAlternative[], data: DecisionData): string {
  const top = results[0];
  if (!top) return "No alternatives to evaluate.";

  const lines: string[] = [];
  lines.push(`**Recommendation: ${top.alternativeTitle}**`);
  lines.push("");
  lines.push(`**Weighted Score: ${top.weightedScore.toFixed(3)}** (higher is better)`);
  lines.push("");

  if (top.expectedMonetaryValue !== null) {
    lines.push(`**Expected Monetary Value: ${top.expectedMonetaryValue.toLocaleString()}**`);
    if (top.bestCase !== null && top.worstCase !== null) {
      lines.push(`Range: ${top.worstCase.toLocaleString()} (worst) to ${top.bestCase.toLocaleString()} (best)`);
    }
    lines.push("");
  }

  if (top.expectedUtility !== null) {
    lines.push(`**Expected Utility: ${top.expectedUtility.toFixed(1)}/100**`);
    lines.push("");
  }

  lines.push("**Criterion Breakdown:**");
  for (const [criterionId, details] of Object.entries(top.details.criterionDetails)) {
    const criterion = data.criteria.find(c => c.id === criterionId);
    if (criterion) {
      lines.push(`- ${criterion.name}: ${details.normalizedValue.toFixed(3)} (weight: ${details.weight.toFixed(3)}, raw: ${details.rawValue})`);
    }
  }
  lines.push("");

  lines.push("**Outcome Analysis:**");
  for (const altResult of results) {
    const alt = data.alternatives.find(a => a.id === altResult.alternativeId);
    if (!alt) continue;
    lines.push(`\n${alt.title}:`);
    for (const outcome of altResult.details.outcomeDetails) {
      const probPct = (outcome.probability * 100).toFixed(1);
      if (outcome.monetaryPayoff !== null) {
        lines.push(`  - ${outcome.title}: ${probPct}% chance, $${outcome.monetaryPayoff.toLocaleString()} (${outcome.riskLevel} risk)`);
      } else if (outcome.utilityScore !== null) {
        lines.push(`  - ${outcome.title}: ${probPct}% chance, utility ${outcome.utilityScore}/100 (${outcome.riskLevel} risk)`);
      } else {
        lines.push(`  - ${outcome.title}: ${probPct}% chance (${outcome.riskLevel} risk)`);
      }
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("*Disclaimer: Results are based on your assumptions and input data. They do not guarantee outcomes.*");
  lines.push("*Consider this analysis as decision support, not a substitute for professional advice.*");

  return lines.join("\n");
}

export function prepareSimulationInput(
  alternatives: (Alternative & { outcomes: Outcome[] })[],
  criteria: Criterion[],
  criterionScores: Record<string, Record<string, number>>
): SimulationInput {
  return {
    alternatives: alternatives.map(alt => ({
      id: alt.id,
      title: alt.title,
      outcomes: alt.outcomes.map(o => ({
        id: o.id,
        title: o.title,
        probability: o.probability,
        monetaryPayoff: o.monetaryPayoff ?? null,
        utilityScore: o.utilityScore ?? null,
        riskLevel: o.riskLevel,
      })),
    })),
    criteria: criteria.map(c => ({
      id: c.id,
      name: c.name,
      weight: c.weight,
      direction: c.direction,
    })),
    criterionScores,
  };
}