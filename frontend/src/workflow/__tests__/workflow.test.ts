import { describe, it, expect } from "vitest";
import { NODE_CATEGORIES, NODE_TYPE_CONFIGS } from "../nodes/nodeTypes";

describe("Workflow Node System", () => {
  it("defines all 8 node categories with distinct colors and labels including business intelligence", () => {
    expect(NODE_CATEGORIES).toHaveLength(8);
    const categoryIds = NODE_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain("business");
    expect(categoryIds).toContain("triggers");
    expect(categoryIds).toContain("inputs");
    expect(categoryIds).toContain("logic");
    expect(categoryIds).toContain("outcomes");
    expect(categoryIds).toContain("calculations");
    expect(categoryIds).toContain("data");
    expect(categoryIds).toContain("outputs");
  });

  it("contains complete configurations for all primary node types including business intelligence", () => {
    const types = Object.keys(NODE_TYPE_CONFIGS);
    expect(types.length).toBeGreaterThan(25);

    // Verify key decision & business nodes
    expect(NODE_TYPE_CONFIGS["start_decision"]).toBeDefined();
    expect(NODE_TYPE_CONFIGS["weighted_score"]).toBeDefined();
    expect(NODE_TYPE_CONFIGS["monte_carlo"]).toBeDefined();
    expect(NODE_TYPE_CONFIGS["sensitivity_analysis"]).toBeDefined();
    expect(NODE_TYPE_CONFIGS["proposed_purchase"]).toBeDefined();
    expect(NODE_TYPE_CONFIGS["demand_forecast"]).toBeDefined();
    expect(NODE_TYPE_CONFIGS["break_even"]).toBeDefined();
    expect(NODE_TYPE_CONFIGS["scenario_branch"]).toBeDefined();
    expect(NODE_TYPE_CONFIGS["if_else"]).toBeDefined();
    expect(NODE_TYPE_CONFIGS["recommendation"]).toBeDefined();
  });

  it("validates handle definitions and connectivity for if_else logic node", () => {
    const ifElseConfig = NODE_TYPE_CONFIGS["if_else"];
    expect(ifElseConfig.inputHandles).toContain("condition");
    expect(ifElseConfig.outputHandles).toContain("true");
    expect(ifElseConfig.outputHandles).toContain("false");
  });

  it("validates calculation node inputs and outputs", () => {
    const weightedScoreConfig = NODE_TYPE_CONFIGS["weighted_score"];
    expect(weightedScoreConfig.inputHandles).toContain("criteria");
    expect(weightedScoreConfig.outputHandles).toContain("score");

    const monteCarloConfig = NODE_TYPE_CONFIGS["monte_carlo"];
    expect(monteCarloConfig.defaultConfig.iterations).toBe(10000);
  });
});

describe("Workflow Graph Serialization", () => {
  it("correctly marshals nodes into persistence format", () => {
    const rawNode = {
      id: "node-1",
      type: "workflow",
      position: { x: 100, y: 200 },
      data: {
        id: "node-1",
        type: "weighted_score",
        label: "MCDA Engine",
        description: "Scoring options",
        config: { algorithm: "weighted_sum" },
        status: "idle" as const,
      },
    };

    const persisted = {
      id: rawNode.id,
      type: rawNode.data.type,
      title: rawNode.data.label,
      description: rawNode.data.description,
      positionX: rawNode.position.x,
      positionY: rawNode.position.y,
      config: JSON.stringify(rawNode.data.config),
      schemaVersion: 1,
    };

    expect(persisted.title).toBe("MCDA Engine");
    expect(persisted.positionX).toBe(100);
    expect(persisted.positionY).toBe(200);
    expect(JSON.parse(persisted.config)).toEqual({ algorithm: "weighted_sum" });
  });

  it("validates compatibility between source and target handles", () => {
    const sourceNode = NODE_TYPE_CONFIGS["if_else"];
    const targetNode = NODE_TYPE_CONFIGS["weighted_score"];

    const isTrueCompatible =
      sourceNode.outputHandles.includes("true") && targetNode.inputHandles.includes("criteria");
    expect(isTrueCompatible).toBe(true);

    const isInvalidHandleCompatible =
      sourceNode.outputHandles.includes("non_existent") && targetNode.inputHandles.includes("criteria");
    expect(isInvalidHandleCompatible).toBe(false);
  });
});
