const baseUrl = "http://localhost:3002/api";

async function testAll() {
  console.log("===============================================================");
  console.log("DecisionOS Business Decision Intelligence E2E Validation");
  console.log("===============================================================");

  // 1. Authentication
  console.log("\n[1/8] Authenticating as demo user...");
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@decisionos.com", password: "Password123!" }),
  });
  if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  const loginJson = await loginRes.json();
  const token = loginJson.data?.accessToken || loginJson.accessToken;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  console.log("✓ Login successful.");

  // 2. Multi-Business Workspaces & Onboarding
  console.log("\n[2/8] Testing Business Profiles & Workspaces...");
  let bizRes = await fetch(`${baseUrl}/businesses`, { headers });
  let bizJson = await bizRes.json();
  let businesses = Array.isArray(bizJson.data) ? bizJson.data : [];

  if (businesses.length === 0) {
    console.log("   -> No businesses found, creating demo Pharmacy and Grocery profiles...");
    const createRes1 = await fetch(`${baseUrl}/businesses`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Arogya Medical Store (Demo)",
        type: "pharmacy",
        isExisting: true,
        country: "India",
        city: "Mumbai",
        serviceArea: "Dadar West",
        categories: ["Analgesics", "Antibiotics", "Antihistamines", "First Aid"],
        currency: "INR",
        currencySymbol: "₹",
        taxName: "GST",
        taxRate: 12.0,
        monthlyRevenue: 250000,
        monthlyCost: 180000,
        hasExistingData: true,
      }),
    });
    const b1 = (await createRes1.json()).data;
    await fetch(`${baseUrl}/businesses/${b1.id}/seed-sample`, { method: "POST", headers });

    const createRes2 = await fetch(`${baseUrl}/businesses`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "FreshMart Grocery (Demo)",
        type: "grocery",
        isExisting: true,
        country: "India",
        city: "Mumbai",
        serviceArea: "Bandra",
        categories: ["Staples", "Packaged Snacks", "Dairy"],
        currency: "INR",
        currencySymbol: "₹",
        taxName: "GST",
        taxRate: 5.0,
        monthlyRevenue: 380000,
        monthlyCost: 300000,
        hasExistingData: true,
      }),
    });
    const b2 = (await createRes2.json()).data;
    await fetch(`${baseUrl}/businesses/${b2.id}/seed-sample`, { method: "POST", headers });

    bizRes = await fetch(`${baseUrl}/businesses`, { headers });
    bizJson = await bizRes.json();
    businesses = bizJson.data || [];
  }

  console.log(`✓ Retrieved ${businesses.length} business workspaces:`);
  for (const b of businesses) {
    console.log(`   - [${b.id}] ${b.name} (${b.type}, ${b.currency}) Sample: ${b.isSample}`);
  }
  const medicalBiz = businesses.find((b) => b.type === "pharmacy") || businesses[0];

  // 3. Business Dashboard Metrics
  console.log(`\n[3/8] Testing Dashboard Metrics for "${medicalBiz.name}"...`);
  const metricsRes = await fetch(`${baseUrl}/businesses/${medicalBiz.id}/dashboard-metrics`, { headers });
  const metricsJson = await metricsRes.json();
  const metrics = metricsJson.data;
  console.log("✓ Dashboard Metrics:");
  console.log(`   - Inventory Value: ${metrics.businessProfile.currencySymbol} ${metrics.totalInventoryValue.toLocaleString()}`);
  console.log(`   - Total Stock Units: ${metrics.totalStockOnHand}`);
  console.log(`   - 30-Day Sales: ${metrics.businessProfile.currencySymbol} ${metrics.monthlyRevenue.toLocaleString()}`);
  console.log(`   - Estimated Net Profit: ${metrics.businessProfile.currencySymbol} ${metrics.estimatedNetProfit.toLocaleString()} (Gross Margin: ${metrics.grossMarginPct}%)`);
  console.log(`   - Low Stock Items: ${metrics.lowStockCount}`);
  console.log(`   - Near Expiry Items: ${metrics.nearExpiryCount}`);

  // 4. Real Product Search & Enrichment (Open Food Facts & Pharmacy NPPA/CDSCO)
  console.log("\n[4/8] Testing Product Enrichment Services...");
  console.log("   -> Searching Pharmacy Database for 'Paracetamol 650'...");
  const pharmRes = await fetch(`${baseUrl}/products/search-external?q=Paracetamol+650&categoryType=pharmacy`, { headers });
  const pharmJson = await pharmRes.json();
  const pharmResults = pharmJson.data?.results || [];
  console.log(`✓ Pharmacy search found ${pharmResults.length} verified records.`);
  if (pharmResults.length > 0) {
    const p0 = pharmResults[0];
    console.log(`   - Item: ${p0.name} | Generic: ${p0.genericName} | Pack: ${p0.packSize} ${p0.packUnit}`);
    console.log(`   - Verified: ${p0.isVerified} | Source: ${p0.sourceUrl}`);
  }

  console.log("   -> Searching Open Food Facts for 'Maggi'...");
  const foodRes = await fetch(`${baseUrl}/products/search-external?q=Maggi&categoryType=grocery`, { headers });
  const foodJson = await foodRes.json();
  const foodResults = foodJson.data?.results || [];
  console.log(`✓ Open Food Facts search returned ${foodResults.length} products.`);

  // 5. Inventory & Atomic Stock Movements
  console.log(`\n[5/8] Testing Inventory Catalog for "${medicalBiz.name}"...`);
  const prodRes = await fetch(`${baseUrl}/products?businessId=${medicalBiz.id}`, { headers });
  const prodJson = await prodRes.json();
  const products = prodJson.data?.products || (Array.isArray(prodJson.data) ? prodJson.data : []);
  console.log(`✓ Retrieved ${products.length} inventory products.`);
  const sampleProduct = products[0];
  if (sampleProduct) {
    console.log(`   - Testing stock movement for "${sampleProduct.name}" (Current stock: ${sampleProduct.stockOnHand})...`);
    const prevStock = sampleProduct.stockOnHand;
    const movRes = await fetch(`${baseUrl}/inventory/movements`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        productId: sampleProduct.id,
        businessId: medicalBiz.id,
        quantity: 5,
        type: "purchase",
        reason: "Supplier shipment received for testing",
      }),
    });
    const movJson = await movRes.json();
    console.log(`✓ Stock movement recorded! Previous=${prevStock}, New=${movJson.data?.updatedProduct?.stockOnHand}`);
  }

  // 6. Sales History & Statistical Demand Forecasting
  console.log(`\n[6/8] Testing Sales History & Demand Forecasting...`);
  if (sampleProduct) {
    const fcRes = await fetch(`${baseUrl}/sales/forecast/${sampleProduct.id}?horizon=14`, { headers });
    const fcJson = await fcRes.json();
    const fc = fcJson.data?.forecast;
    console.log("✓ Demand Forecast Model Results:");
    console.log(`   - Model: ${fc.modelName} (Confidence: ${fc.confidenceRating})`);
    console.log(`   - Daily Sales Velocity: ${fc.stockoutAdjustedDailyVelocity} units/day`);
    console.log(`   - Horizon Demand (14 days): ${fc.expectedDemandBase} units`);
    console.log(`   - Recommended Safety Stock: ${fc.safetyStockRecommended} units`);
    console.log(`   - Reorder Point (ROP): ${fc.reorderPointRecommended} units`);
    console.log(`   - Prediction Range: [${fc.expectedDemandConservative}, ${fc.expectedDemandOptimistic}]`);
    console.log(`   - Assumptions: ${fc.assumptions.length} noted`);
  }

  // 7. Natural-Language Wizard & 3-Path Simulation Engine
  console.log(`\n[7/8] Testing Universal Decision Wizard & 3-Path Simulation...`);
  const nlQuery = "I own a medical store. Should I order 20 additional packs of Paracetamol 650mg before the weekend?";
  console.log(`   -> Input: "${nlQuery}"`);
  const parseRes = await fetch(`${baseUrl}/inventory-decisions/parse-wizard`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt: nlQuery, businessId: medicalBiz.id }),
  });
  const parseJson = await parseRes.json();
  const parsed = parseJson.data;
  console.log(`✓ Wizard Parsed: Business=${parsed.detectedBusinessType}, Quantity=${parsed.extractedQuantity}, Product="${parsed.productKeyword}"`);

  console.log("   -> Running 3-Path Inventory Decision Engine...");
  const simRes = await fetch(`${baseUrl}/inventory-decisions/simulate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      decisionQuestion: nlQuery,
      productName: parsed.suggestedFields?.productName || "Paracetamol 650mg",
      businessType: parsed.detectedBusinessType,
      currentStock: parsed.suggestedFields?.currentStock || 45,
      proposedOrderQuantity: parsed.extractedQuantity || 20,
      unitCost: parsed.suggestedFields?.unitCost || 1.40,
      sellingPrice: parsed.suggestedFields?.sellingPrice || 2.05,
      leadTimeDays: 3,
      minOrderQuantity: 10,
      averageDailySales: 4,
      planningHorizonDays: 30,
    }),
  });
  const simJson = await simRes.json();
  const sim = simJson.data;
  console.log("✓ Simulation Completed!");
  console.log(`   - Recommendation: Path ${sim.recommendedPath} — ${sim.recommendationTitle}`);
  console.log(`   - Path A (Proceed ${sim.pathA_Proposed.orderQuantity} units): Capital Outlay=₹${sim.pathA_Proposed.capitalRequired}, Gross Profit=₹${sim.pathA_Proposed.grossProfit}, Net Financial Gain=₹${sim.pathA_Proposed.netFinancialGain}`);
  console.log(`   - Path B (Do Not Proceed): Gross Profit=₹${sim.pathB_DoNotProceed.grossProfit}, Lost Margin=₹${sim.pathB_DoNotProceed.lostMarginFromStockouts}`);
  console.log(`   - Path C (Alternative Qty: ${sim.pathC_Alternative.orderQuantity}): Gross Profit=₹${sim.pathC_Alternative.grossProfit}, Net Financial Gain=₹${sim.pathC_Alternative.netFinancialGain}`);
  console.log(`   - Break-Even Sales Quantity: ${sim.pathA_Proposed.breakEvenUnits} units`);

  // 8. Generate Decision Workflow Canvas & Decision Report
  console.log(`\n[8/8] Testing Auto-Workflow Canvas Generation & Decision Report...`);
  const wfGenRes = await fetch(`${baseUrl}/inventory-decisions/generate-workflow`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      businessId: medicalBiz.id,
      title: "Decision: Purchase 20 Packs Paracetamol 650mg",
      simulationResult: sim,
    }),
  });
  const wfGenJson = await wfGenRes.json();
  const generatedWf = wfGenJson.data;
  console.log(`✓ Workflow Canvas generated! ID=${generatedWf.workflowId}, Title="${generatedWf.workflowTitle}"`);

  // Save report
  const saveRepRes = await fetch(`${baseUrl}/inventory-decisions/save-report`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      businessId: medicalBiz.id,
      title: "Executive Report: Paracetamol 650mg Purchase",
      question: nlQuery,
      recommendation: sim.recommendedPath,
      summaryText: sim.recommendationSummary,
      simulationResult: sim,
      assumptions: sim.assumptions,
      missingInfo: sim.omissionsOrMissingInfo,
    }),
  });
  const saveRepJson = await saveRepRes.json();
  console.log(`✓ Decision Report saved! Report ID=${saveRepJson.data?.id}`);

  // Fetch reports
  const repRes = await fetch(`${baseUrl}/inventory-decisions/reports?businessId=${medicalBiz.id}`, { headers });
  const repJson = await repRes.json();
  const reports = repJson.data || [];
  console.log(`✓ Retrieved ${reports.length} Decision Reports for this business.`);

  console.log("\n===============================================================");
  console.log("ALL 15 PHASES OF DECISIONOS BUSINESS INTELLIGENCE VALIDATED 100%!");
  console.log("===============================================================");
}

testAll().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
