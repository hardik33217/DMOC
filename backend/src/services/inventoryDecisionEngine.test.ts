import { describe, it, expect } from "vitest";
import { InventoryDecisionEngine, InventoryDecisionInput } from "./inventoryDecisionEngine.js";

describe("InventoryDecisionEngine", () => {
  it("evaluates 3 distinct comparison paths (A: Proceed, B: Do Not Proceed, C: Alternative)", () => {
    const input: InventoryDecisionInput = {
      decisionQuestion: "Should I order 50 packs of snack before weekend?",
      businessType: "grocery",
      productName: "Potato Chips 50g",
      currentStock: 10,
      proposedOrderQuantity: 50,
      unitCost: 15,
      sellingPrice: 20,
      leadTimeDays: 2,
      minOrderQuantity: 10,
      planningHorizonDays: 14,
      averageDailySales: 4, // 14 days * 4 = 56 expected demand
      holdingCostRatePerMonth: 0.02,
    };

    const result = InventoryDecisionEngine.evaluateDecision(input);

    expect(result.pathA_Proposed).toBeDefined();
    expect(result.pathB_DoNotProceed).toBeDefined();
    expect(result.pathC_Alternative).toBeDefined();

    // Path A: order 50 units @ 15 = 750 capital required
    expect(result.pathA_Proposed.orderQuantity).toBe(50);
    expect(result.pathA_Proposed.capitalRequired).toBe(750);
    expect(result.pathA_Proposed.availableStockTotal).toBe(60); // 10 + 50
    expect(result.pathA_Proposed.expectedUnitsSold).toBe(56); // min(60, 56)

    // Path B: order 0 units @ 15 = 0 capital required, but suffers stockout
    expect(result.pathB_DoNotProceed.orderQuantity).toBe(0);
    expect(result.pathB_DoNotProceed.capitalRequired).toBe(0);
    expect(result.pathB_DoNotProceed.expectedUnitsSold).toBe(10);
    expect(result.pathB_DoNotProceed.unmetDemandUnits).toBe(46); // 56 - 10
    expect(result.pathB_DoNotProceed.lostMarginFromStockouts).toBe(46 * 5); // 46 units * (20 - 15) = 230

    // Path A gross profit: 56 units * 5 = 280
    expect(result.pathA_Proposed.grossProfit).toBe(280);
    expect(result.pathA_Proposed.netFinancialGain).toBeGreaterThan(result.pathB_DoNotProceed.netFinancialGain);

    // Scenarios check
    expect(result.pathA_Proposed.scenarios.bestCase).toBeDefined();
    expect(result.pathA_Proposed.scenarios.baseCase).toBeDefined();
    expect(result.pathA_Proposed.scenarios.worstCase).toBeDefined();

    // Recommendation
    expect(["A", "C"]).toContain(result.recommendedPath);
  });

  it("identifies expiry and spoilage risk when shelf life is shorter than planning horizon", () => {
    const input: InventoryDecisionInput = {
      decisionQuestion: "Should I purchase 100 cartons of fresh milk?",
      businessType: "grocery",
      productName: "Fresh Milk 1L",
      currentStock: 5,
      proposedOrderQuantity: 100,
      unitCost: 40,
      sellingPrice: 50,
      planningHorizonDays: 30,
      shelfLifeDays: 5, // very short perishable shelf life
      averageDailySales: 2, // will only sell 2 * 5 = 10 units before spoiling!
    };

    const result = InventoryDecisionEngine.evaluateDecision(input);
    expect(result.pathA_Proposed.spoilageLoss).toBeGreaterThan(0);
    expect(result.keyInsights.some((k) => k.includes("spoilage exposure"))).toBe(true);
  });
});
