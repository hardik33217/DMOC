import { describe, it, expect } from "vitest";
import {
  DecisionSchema,
  AlternativeSchema,
  OutcomeSchema,
  CriterionSchema,
  DashboardStatsSchema,
  createApiResponse,
  createApiError,
} from "./index.js";

describe("Shared Schemas & Utilities", () => {
  it("validates valid DecisionSchema payload", () => {
    const valid = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      ownerId: "123e4567-e89b-12d3-a456-426614174001",
      title: "Evaluate Job Offer",
      question: "Should I accept the new position at Company X?",
      category: "career",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const parsed = DecisionSchema.parse(valid);
    expect(parsed.title).toBe("Evaluate Job Offer");
    expect(parsed.status).toBe("active");
  });

  it("fails on invalid DecisionSchema without question", () => {
    const invalid = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      ownerId: "123e4567-e89b-12d3-a456-426614174001",
      title: "Evaluate Job Offer",
      // missing question
    };

    expect(() => DecisionSchema.parse(invalid)).toThrow();
  });

  it("validates OutcomeSchema with probabilities and risk levels", () => {
    const outcome = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      alternativeId: "123e4567-e89b-12d3-a456-426614174001",
      title: "Promoted within 1 year",
      probability: 0.65,
      monetaryPayoff: 25000,
      utilityScore: 85,
      riskLevel: "medium",
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const parsed = OutcomeSchema.parse(outcome);
    expect(parsed.probability).toBe(0.65);
    expect(parsed.monetaryPayoff).toBe(25000);
  });

  it("validates CriterionSchema with maximize/minimize direction", () => {
    const criterion = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      decisionId: "123e4567-e89b-12d3-a456-426614174001",
      name: "Commute Time",
      weight: 40,
      direction: "minimize",
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const parsed = CriterionSchema.parse(criterion);
    expect(parsed.direction).toBe("minimize");
  });

  it("creates standard API responses and errors", () => {
    const success = createApiResponse({ result: 42 });
    expect(success.success).toBe(true);
    expect(success.data).toEqual({ result: 42 });

    const error = createApiError("UNAUTHORIZED", "Token missing");
    expect(error.success).toBe(false);
    expect(error.error?.code).toBe("UNAUTHORIZED");
  });
});
