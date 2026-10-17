export interface InventoryDecisionInput {
  decisionQuestion: string;
  businessType: string;
  productName: string;
  category?: string;
  currentStock: number;
  proposedOrderQuantity: number;
  unitCost: number;
  packSize?: number;
  sellingPrice: number;
  taxRate?: number;
  leadTimeDays?: number;
  minOrderQuantity?: number;
  planningHorizonDays?: number; // default 30
  averageDailySales?: number;
  shelfLifeDays?: number;
  holdingCostRatePerMonth?: number; // default 0.02 (2%)
  fixedOrderFee?: number; // delivery or processing fee, default 0
  availableCash?: number;
  storageCapacityUnits?: number;
  alternativeQuantity?: number;
}

export interface PathOutcome {
  pathKey: "A" | "B" | "C";
  pathTitle: string;
  pathDescription: string;
  orderQuantity: number;
  capitalRequired: number;
  isAffordable: boolean;
  fitsCapacity: boolean;
  
  // Operational expectations
  availableStockTotal: number;
  expectedDemand: number;
  expectedUnitsSold: number;
  expectedEndingStock: number;
  
  // Financial outcomes
  expectedRevenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  holdingCost: number;
  spoilageLoss: number;
  fixedOrderFee: number;
  lostMarginFromStockouts: number;
  unmetDemandUnits: number;
  netFinancialGain: number; // Gross Profit - Holding - Spoilage - FixedFee - LostMargin
  
  // Risk metrics
  stockoutProbabilityPct: number;
  expirySpoilageUnits: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
  roiPct: number; // (netFinancialGain / capitalRequired) * 100
  
  // Scenarios
  scenarios: {
    bestCase: { demand: number; netGain: number; revenue: number; description: string };
    baseCase: { demand: number; netGain: number; revenue: number; description: string };
    worstCase: { demand: number; netGain: number; revenue: number; description: string };
  };
}

export interface InventoryDecisionAnalysisResult {
  decisionQuestion: string;
  productName: string;
  evaluatedAt: string;
  planningHorizonDays: number;
  
  pathA_Proposed: PathOutcome;
  pathB_DoNotProceed: PathOutcome;
  pathC_Alternative: PathOutcome;
  
  recommendedPath: "A" | "B" | "C";
  recommendationTitle: string;
  recommendationSummary: string;
  keyInsights: string[];
  
  sensitivity: {
    demandMinus25Pct: { netGainA: number; netGainB: number; netGainC: number };
    demandPlus25Pct: { netGainA: number; netGainB: number; netGainC: number };
    costPlus10Pct: { netGainA: number; netGainB: number; netGainC: number };
  };
  
  assumptions: string[];
  omissionsOrMissingInfo: string[];
}

export class InventoryDecisionEngine {
  static evaluateDecision(input: InventoryDecisionInput): InventoryDecisionAnalysisResult {
    const horizon = Math.max(1, input.planningHorizonDays || 30);
    const dailyVelocity = Math.max(0.1, input.averageDailySales || 2);
    const expectedDemand = Math.round(dailyVelocity * horizon);
    const currentStock = Math.max(0, input.currentStock || 0);
    const unitCost = Math.max(0.01, input.unitCost || 10);
    const sellingPrice = Math.max(unitCost, input.sellingPrice || unitCost * 1.3);
    const holdingRate = input.holdingCostRatePerMonth ?? 0.02; // 2% per month
    const fixedFee = Math.max(0, input.fixedOrderFee || 0);
    const shelfLife = input.shelfLifeDays;
    const moq = Math.max(1, input.minOrderQuantity || 1);
    const availableCash = input.availableCash ?? Infinity;
    const storageCapacity = input.storageCapacityUnits ?? Infinity;

    // Determine optimal alternative quantity (Path C)
    // Needs = Expected demand during horizon + buffer - current stock
    const needed = Math.max(0, expectedDemand + Math.ceil(dailyVelocity * (input.leadTimeDays || 3)) - currentStock);
    const roundedToMoq = Math.ceil(needed / moq) * moq;
    const pathCQty = input.alternativeQuantity !== undefined ? input.alternativeQuantity : roundedToMoq;

    const pathA = this.calculateSinglePath(
      "A",
      "Proceed with Proposed Order",
      `Order the proposed quantity of ${input.proposedOrderQuantity} units.`,
      input.proposedOrderQuantity,
      currentStock,
      expectedDemand,
      unitCost,
      sellingPrice,
      holdingRate,
      fixedFee,
      shelfLife,
      horizon,
      availableCash,
      storageCapacity
    );

    const pathB = this.calculateSinglePath(
      "B",
      "Do Not Order (Status Quo)",
      "Maintain current stock without committing additional working capital.",
      0,
      currentStock,
      expectedDemand,
      unitCost,
      sellingPrice,
      holdingRate,
      0, // no fixed order fee if not ordering
      shelfLife,
      horizon,
      availableCash,
      storageCapacity
    );

    const pathC = this.calculateSinglePath(
      "C",
      "Recommended Alternative Quantity",
      `Order ${pathCQty} units aligned with expected ${horizon}-day demand & supplier MOQ.`,
      pathCQty,
      currentStock,
      expectedDemand,
      unitCost,
      sellingPrice,
      holdingRate,
      fixedFee,
      shelfLife,
      horizon,
      availableCash,
      storageCapacity
    );

    // Pick best recommendation
    let recommendedPath: "A" | "B" | "C" = "A";
    let recommendationTitle = "";
    let recommendationSummary = "";

    if (!pathA.isAffordable) {
      recommendedPath = pathC.isAffordable ? "C" : "B";
      recommendationTitle = "Proposed order exceeds available cash buffer";
      recommendationSummary = `Ordering ${input.proposedOrderQuantity} units requires ₹${pathA.capitalRequired.toLocaleString()}, exceeding your working capital limit. Option ${recommendedPath} is recommended.`;
    } else if (pathA.spoilageLoss > pathA.grossProfit * 0.4) {
      recommendedPath = pathC.netFinancialGain > pathB.netFinancialGain ? "C" : "B";
      recommendationTitle = "High risk of product expiry/spoilage";
      recommendationSummary = `The proposed quantity of ${input.proposedOrderQuantity} units significantly exceeds the sales velocity before product shelf-life expires, risking ₹${pathA.spoilageLoss.toLocaleString()} in spoiled stock.`;
    } else if (pathC.netFinancialGain > pathA.netFinancialGain + 50 && pathC.orderQuantity !== pathA.orderQuantity) {
      recommendedPath = "C";
      recommendationTitle = `Alternative order of ${pathCQty} units maximizes net return`;
      recommendationSummary = `Ordering ${pathCQty} units provides ₹${(pathC.netFinancialGain - pathA.netFinancialGain).toFixed(0)} higher net profit while cutting surplus holding costs.`;
    } else if (pathA.netFinancialGain > pathB.netFinancialGain) {
      recommendedPath = "A";
      recommendationTitle = `Proceed with order of ${input.proposedOrderQuantity} units`;
      recommendationSummary = `The purchase generates ₹${pathA.netFinancialGain.toFixed(0)} net gain and reduces stockout risk by ${(pathB.stockoutProbabilityPct - pathA.stockoutProbabilityPct).toFixed(0)}%.`;
    } else {
      recommendedPath = "B";
      recommendationTitle = "Do not proceed with new purchase at this time";
      recommendationSummary = `Current inventory of ${currentStock} units is sufficient to meet projected demand. An additional purchase needlessly locks up working capital.`;
    }

    const keyInsights: string[] = [
      `Sales Velocity: ~${dailyVelocity.toFixed(1)} units/day (~${(dailyVelocity * 7).toFixed(1)} units/week).`,
      `Gross Margin: ${pathA.grossMarginPct.toFixed(1)}% (Selling ₹${sellingPrice.toFixed(2)} vs Cost ₹${unitCost.toFixed(2)}).`,
      `Break-even point: ${pathA.breakEvenUnits} units sold covers purchase costs and order fees.`,
    ];

    if (pathB.unmetDemandUnits > 0) {
      keyInsights.push(`Not ordering would cause a stockout of ~${pathB.unmetDemandUnits} units, losing ₹${pathB.lostMarginFromStockouts.toFixed(0)} in gross profit.`);
    }

    if (pathA.spoilageLoss > 0) {
      keyInsights.push(`Caution: Shelf life limits create potential spoilage exposure of ~${pathA.expirySpoilageUnits} units (₹${pathA.spoilageLoss.toFixed(0)}).`);
    }

    const assumptions: string[] = [
      `Customer demand assumed consistent with recent daily velocity (~${dailyVelocity} units/day).`,
      `Holding cost computed at ${(holdingRate * 100).toFixed(1)}% of inventory value per month.`,
      `Supplier delivers exactly quoted quantity at standard lead times.`,
    ];

    const omissionsOrMissingInfo: string[] = [];
    if (!input.shelfLifeDays) omissionsOrMissingInfo.push("Product shelf life / expiry date was not specified (assumed non-perishable).");
    if (!input.storageCapacityUnits) omissionsOrMissingInfo.push("Store shelf/storage volume constraint was not specified.");
    if (!input.availableCash) omissionsOrMissingInfo.push("Working capital cash limit was not provided.");

    // Sensitivity analysis
    const sensitivity = {
      demandMinus25Pct: {
        netGainA: this.computeSensitivityGain(pathA, expectedDemand * 0.75, unitCost, sellingPrice, holdingRate, fixedFee),
        netGainB: this.computeSensitivityGain(pathB, expectedDemand * 0.75, unitCost, sellingPrice, holdingRate, 0),
        netGainC: this.computeSensitivityGain(pathC, expectedDemand * 0.75, unitCost, sellingPrice, holdingRate, fixedFee),
      },
      demandPlus25Pct: {
        netGainA: this.computeSensitivityGain(pathA, expectedDemand * 1.25, unitCost, sellingPrice, holdingRate, fixedFee),
        netGainB: this.computeSensitivityGain(pathB, expectedDemand * 1.25, unitCost, sellingPrice, holdingRate, 0),
        netGainC: this.computeSensitivityGain(pathC, expectedDemand * 1.25, unitCost, sellingPrice, holdingRate, fixedFee),
      },
      costPlus10Pct: {
        netGainA: this.computeSensitivityGain(pathA, expectedDemand, unitCost * 1.1, sellingPrice, holdingRate, fixedFee),
        netGainB: this.computeSensitivityGain(pathB, expectedDemand, unitCost * 1.1, sellingPrice, holdingRate, 0),
        netGainC: this.computeSensitivityGain(pathC, expectedDemand, unitCost * 1.1, sellingPrice, holdingRate, fixedFee),
      },
    };

    return {
      decisionQuestion: input.decisionQuestion,
      productName: input.productName,
      evaluatedAt: new Date().toISOString(),
      planningHorizonDays: horizon,
      pathA_Proposed: pathA,
      pathB_DoNotProceed: pathB,
      pathC_Alternative: pathC,
      recommendedPath,
      recommendationTitle,
      recommendationSummary,
      keyInsights,
      sensitivity,
      assumptions,
      omissionsOrMissingInfo,
    };
  }

  private static calculateSinglePath(
    pathKey: "A" | "B" | "C",
    pathTitle: string,
    pathDescription: string,
    orderQuantity: number,
    currentStock: number,
    expectedDemand: number,
    unitCost: number,
    sellingPrice: number,
    holdingRate: number,
    fixedFee: number,
    shelfLifeDays: number | undefined,
    planningHorizonDays: number,
    availableCash: number,
    storageCapacity: number
  ): PathOutcome {
    const capitalRequired = Math.round(orderQuantity * unitCost + fixedFee);
    const isAffordable = capitalRequired <= availableCash;
    const fitsCapacity = (currentStock + orderQuantity) <= storageCapacity;

    const availableStockTotal = currentStock + orderQuantity;
    const expectedUnitsSold = Math.min(availableStockTotal, expectedDemand);
    const expectedEndingStock = Math.max(0, availableStockTotal - expectedUnitsSold);

    // Revenue & COGS
    const expectedRevenue = Math.round(expectedUnitsSold * sellingPrice);
    const cogs = Math.round(expectedUnitsSold * unitCost);
    const grossProfit = Math.round(expectedRevenue - cogs);
    const grossMarginPct = expectedRevenue > 0 ? +((grossProfit / expectedRevenue) * 100).toFixed(1) : 0;

    // Holding cost: monthly rate scaled by horizon / 30
    const holdingCost = Math.round(expectedEndingStock * unitCost * holdingRate * (planningHorizonDays / 30));

    // Expiry / spoilage
    let expirySpoilageUnits = 0;
    let spoilageLoss = 0;
    if (shelfLifeDays && shelfLifeDays < planningHorizonDays) {
      // If shelf life expires during horizon, unsold stock might spoil
      expirySpoilageUnits = expectedEndingStock;
      spoilageLoss = Math.round(expirySpoilageUnits * unitCost);
    }

    // Stockout risk
    const unmetDemandUnits = Math.max(0, expectedDemand - availableStockTotal);
    const unitMargin = sellingPrice - unitCost;
    const lostMarginFromStockouts = Math.round(unmetDemandUnits * unitMargin);
    const stockoutProbabilityPct = availableStockTotal < expectedDemand
      ? 85
      : availableStockTotal < expectedDemand * 1.15
      ? 35
      : 5;

    // Net Financial Gain = Gross Profit - Holding Cost - Spoilage Loss - Fixed Order Fee - Lost Margin Opportunity
    const netFinancialGain = Math.round(grossProfit - holdingCost - spoilageLoss - fixedFee - lostMarginFromStockouts);

    // Break-even
    // Break-even units = capital outlay / unit margin
    const breakEvenUnits = unitMargin > 0 ? Math.ceil(capitalRequired / unitMargin) : 0;
    const breakEvenRevenue = Math.round(breakEvenUnits * sellingPrice);
    const roiPct = capitalRequired > 0 ? +((netFinancialGain / capitalRequired) * 100).toFixed(1) : 0;

    // Scenarios: Best (+25% demand), Base, Worst (-35% demand)
    const bestDemand = Math.round(expectedDemand * 1.25);
    const bestSold = Math.min(availableStockTotal, bestDemand);
    const bestRev = Math.round(bestSold * sellingPrice);
    const bestNet = Math.round((bestRev - bestSold * unitCost) - holdingCost * 0.5 - fixedFee);

    const worstDemand = Math.round(expectedDemand * 0.65);
    const worstSold = Math.min(availableStockTotal, worstDemand);
    const worstEnding = Math.max(0, availableStockTotal - worstSold);
    const worstRev = Math.round(worstSold * sellingPrice);
    const worstHolding = Math.round(worstEnding * unitCost * holdingRate * (planningHorizonDays / 30) * 1.5);
    const worstNet = Math.round((worstRev - worstSold * unitCost) - worstHolding - spoilageLoss - fixedFee);

    return {
      pathKey,
      pathTitle,
      pathDescription,
      orderQuantity,
      capitalRequired,
      isAffordable,
      fitsCapacity,
      availableStockTotal,
      expectedDemand,
      expectedUnitsSold,
      expectedEndingStock,
      expectedRevenue,
      cogs,
      grossProfit,
      grossMarginPct,
      holdingCost,
      spoilageLoss,
      fixedOrderFee: fixedFee,
      lostMarginFromStockouts,
      unmetDemandUnits,
      netFinancialGain,
      stockoutProbabilityPct,
      expirySpoilageUnits,
      breakEvenUnits,
      breakEvenRevenue,
      roiPct,
      scenarios: {
        bestCase: {
          demand: bestDemand,
          netGain: bestNet,
          revenue: bestRev,
          description: "Demand is 25% higher than expected; inventory moves swiftly.",
        },
        baseCase: {
          demand: expectedDemand,
          netGain: netFinancialGain,
          revenue: expectedRevenue,
          description: "Demand matches baseline forecast.",
        },
        worstCase: {
          demand: worstDemand,
          netGain: worstNet,
          revenue: worstRev,
          description: "Demand drops by 35%; unsold inventory incurs extra holding costs.",
        },
      },
    };
  }

  private static computeSensitivityGain(
    path: PathOutcome,
    demand: number,
    cost: number,
    price: number,
    holdingRate: number,
    fixedFee: number
  ): number {
    const totalAvail = path.availableStockTotal;
    const sold = Math.min(totalAvail, demand);
    const ending = Math.max(0, totalAvail - sold);
    const rev = sold * price;
    const cogs = sold * cost;
    const gross = rev - cogs;
    const holding = ending * cost * holdingRate;
    const unmet = Math.max(0, demand - totalAvail);
    const lost = unmet * (price - cost);
    return Math.round(gross - holding - fixedFee - lost);
  }
}
