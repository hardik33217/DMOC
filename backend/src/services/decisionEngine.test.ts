import { describe, it, expect } from "vitest";
import {
  normalizeValue,
  calculateWeightedScores,
  generateExplanation,
  DecisionData,
} from "./decisionEngine";

describe("Decision Engine Service", () => {
  describe("normalizeValue", () => {
    it("normalizes maximize direction correctly", () => {
      expect(normalizeValue(50, 0, 100, "maximize")).toBe(0.5);
      expect(normalizeValue(100, 0, 100, "maximize")).toBe(1);
      expect(normalizeValue(0, 0, 100, "maximize")).toBe(0);
    });

    it("normalizes minimize direction correctly", () => {
      expect(normalizeValue(50, 0, 100, "minimize")).toBe(0.5);
      expect(normalizeValue(100, 0, 100, "minimize")).toBe(0);
      expect(normalizeValue(0, 0, 100, "minimize")).toBe(1);
    });

    it("handles equal min and max values safely", () => {
      expect(normalizeValue(50, 50, 50, "maximize")).toBe(1);
      expect(normalizeValue(50, 50, 50, "minimize")).toBe(0);
    });
  });

  describe("calculateWeightedScores", () => {
    const mockData: DecisionData = {
      alternatives: [
        {
          id: "alt-1",
          decisionId: "dec-1",
          title: "Offer A",
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          outcomes: [
            {
              id: "out-1",
              alternativeId: "alt-1",
              title: "High Bonus",
              probability: 0.6,
              monetaryPayoff: 100000,
              utilityScore: 80,
              riskLevel: "low",
              order: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: "out-2",
              alternativeId: "alt-1",
              title: "Standard Bonus",
              probability: 0.4,
              monetaryPayoff: 50000,
              utilityScore: 50,
              riskLevel: "low",
              order: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
        {
          id: "alt-2",
          decisionId: "dec-1",
          title: "Offer B",
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          outcomes: [
            {
              id: "out-3",
              alternativeId: "alt-2",
              title: "Guaranteed Base",
              probability: 1.0,
              monetaryPayoff: 70000,
              utilityScore: 70,
              riskLevel: "low",
              order: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ],
      criteria: [
        {
          id: "crit-1",
          decisionId: "dec-1",
          name: "Salary",
          weight: 60,
          direction: "maximize",
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "crit-2",
          decisionId: "dec-1",
          name: "Commute Time",
          weight: 40,
          direction: "minimize",
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    const criterionScores: Record<string, Record<string, number>> = {
      "crit-1": { "alt-1": 120000, "alt-2": 90000 },
      "crit-2": { "alt-1": 45, "alt-2": 15 },
    };

    it("calculates weighted scores and expected monetary value correctly", () => {
      const results = calculateWeightedScores(mockData, criterionScores);
      expect(results).toHaveLength(2);

      const alt1 = results.find((r) => r.alternativeId === "alt-1")!;
      const alt2 = results.find((r) => r.alternativeId === "alt-2")!;

      expect(alt1).toBeDefined();
      expect(alt2).toBeDefined();

      // Check EMV: Offer A = 0.6 * 100000 + 0.4 * 50000 = 80000
      expect(alt1.expectedMonetaryValue).toBe(80000);
      // Offer B = 1.0 * 70000 = 70000
      expect(alt2.expectedMonetaryValue).toBe(70000);

      // Check Expected Utility
      expect(alt1.expectedUtility).toBe(0.6 * 80 + 0.4 * 50);
      expect(alt2.expectedUtility).toBe(70);
    });

    it("generates markdown explanation with rankings", () => {
      const results = calculateWeightedScores(mockData, criterionScores);
      const explanation = generateExplanation(results, mockData);

      expect(explanation).toContain("**Recommendation: Offer A**");
      expect(explanation).toContain("Offer A");
      expect(explanation).toContain("Offer B");
      expect(explanation).toContain("Disclaimer");
    });
  });
});
