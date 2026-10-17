import { describe, it, expect } from "vitest";
import { DemandForecastService } from "./demandForecastService.js";

describe("DemandForecastService", () => {
  it("calculates sales velocity and adjusts for stockout-suppressed days", () => {
    // 5 days of history: 4 days sold 10 units each, 1 day was stockout (0 units sold)
    const salesHistory = [
      { date: "2026-03-01", quantitySold: 10, unitPrice: 20 },
      { date: "2026-03-02", quantitySold: 10, unitPrice: 20 },
      { date: "2026-03-03", quantitySold: 0, unitPrice: 20, wasStockoutSuppressed: true },
      { date: "2026-03-04", quantitySold: 10, unitPrice: 20 },
      { date: "2026-03-05", quantitySold: 10, unitPrice: 20 },
    ];

    const result = DemandForecastService.calculateForecast({
      salesHistory,
      currentStock: 15,
      leadTimeDays: 3,
      planningHorizonDays: 30,
      targetServiceLevel: 0.95,
    });

    expect(result.dataPointsCount).toBe(5);
    expect(result.stockoutDaysCount).toBe(1);
    expect(result.effectiveOperatingDays).toBe(4);
    // Unadjusted is 40 / 5 = 8; stockout-adjusted is 40 / 4 = 10
    expect(result.unadjustedDailyVelocity).toBe(8);
    expect(result.stockoutAdjustedDailyVelocity).toBe(10);
    expect(result.expectedDemandBase).toBe(300); // 10 * 30 days
    expect(result.leadTimeDemand).toBe(30); // 10 * 3 days
    expect(result.reorderPointRecommended).toBeGreaterThanOrEqual(result.leadTimeDemand);
  });

  it("flags urgent reorder warning when current stock will deplete before lead time", () => {
    const salesHistory = [
      { date: "2026-03-01", quantitySold: 10, unitPrice: 20 },
      { date: "2026-03-02", quantitySold: 10, unitPrice: 20 },
      { date: "2026-03-03", quantitySold: 10, unitPrice: 20 },
    ];

    // Current stock is 5 units, daily sales is 10, lead time is 3 days
    const result = DemandForecastService.calculateForecast({
      salesHistory,
      currentStock: 5,
      leadTimeDays: 3,
      planningHorizonDays: 14,
    });

    expect(result.stockoutExpectedBeforeDelivery).toBe(true);
    expect(result.warnings.some((w) => w.includes("URGENT REORDER ALERT"))).toBe(true);
  });
});
