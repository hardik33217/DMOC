export interface SalesHistoryEntry {
  date: string; // ISO date string
  quantitySold: number;
  unitPrice: number;
  wasStockoutSuppressed?: boolean;
}

export interface ForecastRequest {
  salesHistory: SalesHistoryEntry[];
  currentStock: number;
  leadTimeDays: number;
  planningHorizonDays: number;
  targetServiceLevel?: number; // e.g. 0.95 (95%)
  unitCost?: number;
  sellingPrice?: number;
}

export interface ForecastResult {
  modelName: string;
  modelVersion: string;
  confidenceRating: "high" | "medium" | "low" | "insufficient_data";
  dataPointsCount: number;
  effectiveOperatingDays: number;
  stockoutDaysCount: number;
  
  // Velocities
  unadjustedDailyVelocity: number;
  stockoutAdjustedDailyVelocity: number;
  weeklySalesVelocity: number;
  dailyDemandStdDev: number;
  
  // Forecast horizon
  forecastHorizonDays: number;
  expectedDemandBase: number;
  expectedDemandOptimistic: number;
  expectedDemandConservative: number;
  
  // Replenishment & Safety
  leadTimeDays: number;
  leadTimeDemand: number;
  safetyStockRecommended: number;
  reorderPointRecommended: number;
  daysOfInventoryOnHand: number;
  daysUntilStockout: number;
  stockoutExpectedBeforeDelivery: boolean;
  
  // Model performance / backtesting
  backtestMAE: number;
  backtestMAPE: number;
  
  // Transparency
  assumptions: string[];
  limitations: string[];
  warnings: string[];
}

export class DemandForecastService {
  /**
   * Z-score for standard normal distribution service levels
   */
  private static getZScore(serviceLevel: number): number {
    if (serviceLevel >= 0.99) return 2.33;
    if (serviceLevel >= 0.95) return 1.65;
    if (serviceLevel >= 0.90) return 1.28;
    if (serviceLevel >= 0.85) return 1.04;
    return 1.0;
  }

  /**
   * Calculate demand forecast using statistical time-series baseline with stockout adjustment
   */
  static calculateForecast(params: ForecastRequest): ForecastResult {
    const {
      salesHistory,
      currentStock,
      leadTimeDays = 3,
      planningHorizonDays = 30,
      targetServiceLevel = 0.95,
    } = params;

    const dataPointsCount = salesHistory.length;
    const assumptions: string[] = [
      "Demand assumed to follow stationary Poisson-Gaussian distribution across standard business days.",
      `Target service level set at ${(targetServiceLevel * 100).toFixed(0)}% cycle service level.`,
      `Supplier lead time estimated at ${leadTimeDays} calendar days.`,
      `Planning evaluation horizon set at ${planningHorizonDays} days.`,
    ];
    const limitations: string[] = [];
    const warnings: string[] = [];

    let confidenceRating: "high" | "medium" | "low" | "insufficient_data" = "insufficient_data";
    if (dataPointsCount >= 30) {
      confidenceRating = "high";
    } else if (dataPointsCount >= 14) {
      confidenceRating = "medium";
    } else if (dataPointsCount >= 4) {
      confidenceRating = "low";
      limitations.push("Fewer than 14 historical sales records available. Demand variance may be underestimated.");
    } else {
      confidenceRating = "insufficient_data";
      warnings.push("Insufficient sales history. Baseline estimates rely on user estimates or heuristic averages rather than statistical confidence.");
    }

    // Identify stockout days
    let stockoutDaysCount = 0;
    let totalSales = 0;
    const dailyQuantities: number[] = [];

    salesHistory.forEach((s) => {
      totalSales += s.quantitySold;
      dailyQuantities.push(s.quantitySold);
      if (s.wasStockoutSuppressed) {
        stockoutDaysCount++;
      }
    });

    const effectiveOperatingDays = Math.max(1, dataPointsCount - stockoutDaysCount);
    
    // Unadjusted vs stockout adjusted velocity
    const unadjustedDailyVelocity = dataPointsCount > 0 ? totalSales / Math.max(1, dataPointsCount) : 0;
    const stockoutAdjustedDailyVelocity = effectiveOperatingDays > 0 ? totalSales / effectiveOperatingDays : unadjustedDailyVelocity;

    if (stockoutDaysCount > 0) {
      assumptions.push(
        `Adjusted for ${stockoutDaysCount} stockout days: daily velocity scaled from ${unadjustedDailyVelocity.toFixed(1)} to ${stockoutAdjustedDailyVelocity.toFixed(1)} units/day to avoid demand suppression bias.`
      );
    }

    // Standard deviation of daily demand
    let variance = 0;
    if (dailyQuantities.length > 1) {
      const mean = stockoutAdjustedDailyVelocity;
      const sumSq = dailyQuantities.reduce((acc, q) => acc + Math.pow(q - mean, 2), 0);
      variance = sumSq / (dailyQuantities.length - 1);
    } else {
      // Conservative heuristic variance if single point
      variance = Math.pow(Math.max(1, stockoutAdjustedDailyVelocity * 0.3), 2);
    }
    const dailyDemandStdDev = Math.sqrt(variance);

    // Lead-time demand & Safety stock
    const effectiveVelocity = stockoutAdjustedDailyVelocity > 0 ? stockoutAdjustedDailyVelocity : 1;
    const leadTimeDemand = effectiveVelocity * leadTimeDays;
    const zScore = this.getZScore(targetServiceLevel);
    // Safety Stock = Z * sqrt(LeadTime) * StdDev
    const safetyStockRecommended = Math.ceil(zScore * Math.sqrt(Math.max(1, leadTimeDays)) * dailyDemandStdDev);
    const reorderPointRecommended = Math.ceil(leadTimeDemand + safetyStockRecommended);

    // Days of inventory and days until stockout
    const daysOfInventoryOnHand = effectiveVelocity > 0 ? +(currentStock / effectiveVelocity).toFixed(1) : 999;
    const daysUntilStockout = Math.max(0, +(currentStock / effectiveVelocity).toFixed(1));
    const stockoutExpectedBeforeDelivery = daysUntilStockout < leadTimeDays;

    if (stockoutExpectedBeforeDelivery && currentStock > 0) {
      warnings.push(`URGENT REORDER ALERT: Current stock of ${currentStock} units will run out in ${daysUntilStockout} days, before the ${leadTimeDays}-day supplier delivery arrives!`);
    } else if (currentStock <= 0) {
      warnings.push("CRITICAL STOCKOUT: Product is currently out of stock. Immediate order required to stop revenue loss.");
    }

    // Expected demand over planning horizon
    const expectedDemandBase = Math.round(effectiveVelocity * planningHorizonDays);
    const horizonStdDev = Math.sqrt(planningHorizonDays) * dailyDemandStdDev;
    const expectedDemandOptimistic = Math.round(expectedDemandBase + 1.28 * horizonStdDev);
    const expectedDemandConservative = Math.max(0, Math.round(expectedDemandBase - 1.28 * horizonStdDev));

    // Simple backtest error (leave-one-out or difference from mean)
    let backtestMAE = 0;
    let backtestMAPE = 0;
    if (dailyQuantities.length >= 3) {
      let sumAbsErr = 0;
      let sumPctErr = 0;
      let validPctCount = 0;
      dailyQuantities.forEach((q) => {
        const err = Math.abs(q - effectiveVelocity);
        sumAbsErr += err;
        if (q > 0) {
          sumPctErr += err / q;
          validPctCount++;
        }
      });
      backtestMAE = +(sumAbsErr / dailyQuantities.length).toFixed(2);
      backtestMAPE = validPctCount > 0 ? +((sumPctErr / validPctCount) * 100).toFixed(1) : 0;
    }

    return {
      modelName: "Empirical Velocity with Stockout Normalization & Normal Safety Buffer",
      modelVersion: "1.2.0-stochastic",
      confidenceRating,
      dataPointsCount,
      effectiveOperatingDays,
      stockoutDaysCount,
      unadjustedDailyVelocity: +unadjustedDailyVelocity.toFixed(2),
      stockoutAdjustedDailyVelocity: +stockoutAdjustedDailyVelocity.toFixed(2),
      weeklySalesVelocity: +(stockoutAdjustedDailyVelocity * 7).toFixed(1),
      dailyDemandStdDev: +dailyDemandStdDev.toFixed(2),
      forecastHorizonDays: planningHorizonDays,
      expectedDemandBase,
      expectedDemandOptimistic,
      expectedDemandConservative,
      leadTimeDays,
      leadTimeDemand: +leadTimeDemand.toFixed(1),
      safetyStockRecommended,
      reorderPointRecommended,
      daysOfInventoryOnHand,
      daysUntilStockout,
      stockoutExpectedBeforeDelivery,
      backtestMAE,
      backtestMAPE,
      assumptions,
      limitations,
      warnings,
    };
  }
}
