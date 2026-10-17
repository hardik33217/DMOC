import { PrismaClient, DecisionStatus, DecisionCategory, CriterionDirection, RiskLevel } from "@prisma/client";
import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await hashPassword("Password123!");

  const user = await prisma.user.upsert({
    where: { email: "demo@decisionos.com" },
    update: {},
    create: {
      email: "demo@decisionos.com",
      passwordHash,
      name: "Demo User",
      role: "user",
      theme: "system",
      emailVerified: true,
    },
  });

  console.log("Created demo user:", user.email);

  const decision = await prisma.decision.create({
    data: {
      ownerId: user.id,
      title: "Which job offer should I accept?",
      description: "Comparing two job offers and current position",
      category: "career",
      status: "active",
      question: "Which job offer best aligns with my career goals and personal priorities?",
      deadline: new Date("2024-12-31"),
    },
  });

  const [alt1, alt2, alt3] = await Promise.all([
    prisma.alternative.create({ data: { decisionId: decision.id, title: "Job Offer A - TechCorp", description: "Senior Developer at TechCorp", order: 0 } }),
    prisma.alternative.create({ data: { decisionId: decision.id, title: "Job Offer B - StartupXYZ", description: "Lead Developer at StartupXYZ", order: 1 } }),
    prisma.alternative.create({ data: { decisionId: decision.id, title: "Stay at Current Job", description: "Remain at CurrentCompany", order: 2 } }),
  ]);

  const [crit1, crit2, crit3, crit4, crit5] = await Promise.all([
    prisma.criterion.create({ data: { decisionId: decision.id, name: "Total Compensation", description: "Salary + bonus + equity", weight: 30, direction: "maximize", order: 0 } }),
    prisma.criterion.create({ data: { decisionId: decision.id, name: "Career Growth", description: "Learning opportunities and promotion path", weight: 25, direction: "maximize", order: 1 } }),
    prisma.criterion.create({ data: { decisionId: decision.id, name: "Work-Life Balance", description: "Hours, flexibility, remote work", weight: 20, direction: "maximize", order: 2 } }),
    prisma.criterion.create({ data: { decisionId: decision.id, name: "Company Culture", description: "Values, team dynamics, mission alignment", weight: 15, direction: "maximize", order: 3 } }),
    prisma.criterion.create({ data: { decisionId: decision.id, name: "Commute/Location", description: "Travel time and location preference", weight: 10, direction: "maximize", order: 4 } }),
  ]);

  await Promise.all([
    prisma.outcome.create({ data: { alternativeId: alt1.id, decisionId: decision.id, title: "Promotion in 2 years", description: "Clear path to Staff Engineer", probability: 0.7, monetaryPayoff: 180000, utilityScore: 85, riskLevel: "low", order: 0 } }),
    prisma.outcome.create({ data: { alternativeId: alt1.id, decisionId: decision.id, title: "Layoff risk", description: "Company restructuring possible", probability: 0.1, monetaryPayoff: -50000, utilityScore: 20, riskLevel: "high", order: 1 } }),
    prisma.outcome.create({ data: { alternativeId: alt1.id, decisionId: decision.id, title: "Steady growth", description: "Normal career progression", probability: 0.2, monetaryPayoff: 150000, utilityScore: 70, riskLevel: "low", order: 2 } }),

    prisma.outcome.create({ data: { alternativeId: alt2.id, decisionId: decision.id, title: "Startup succeeds", description: "IPO or acquisition in 3-5 years", probability: 0.2, monetaryPayoff: 500000, utilityScore: 95, riskLevel: "critical", order: 0 } }),
    prisma.outcome.create({ data: { alternativeId: alt2.id, decisionId: decision.id, title: "Startup fails", description: "Company shuts down", probability: 0.4, monetaryPayoff: -30000, utilityScore: 30, riskLevel: "high", order: 1 } }),
    prisma.outcome.create({ data: { alternativeId: alt2.id, decisionId: decision.id, title: "Moderate success", description: "Series B, steady growth", probability: 0.4, monetaryPayoff: 200000, utilityScore: 80, riskLevel: "medium", order: 2 } }),

    prisma.outcome.create({ data: { alternativeId: alt3.id, decisionId: decision.id, title: "Promotion", description: "Promoted to Senior", probability: 0.5, monetaryPayoff: 140000, utilityScore: 75, riskLevel: "low", order: 0 } }),
    prisma.outcome.create({ data: { alternativeId: alt3.id, decisionId: decision.id, title: "Stagnation", description: "No growth for 2+ years", probability: 0.3, monetaryPayoff: 120000, utilityScore: 50, riskLevel: "medium", order: 1 } }),
    prisma.outcome.create({ data: { alternativeId: alt3.id, decisionId: decision.id, title: "Layoff", description: "Department restructuring", probability: 0.2, monetaryPayoff: -40000, utilityScore: 25, riskLevel: "high", order: 2 } }),
  ]);

  const baselineScenario = await prisma.scenario.create({
    data: { decisionId: decision.id, name: "Baseline", description: "Original assumptions", isBaseline: true },
  });

  const scenario2 = await prisma.scenario.create({
    data: { decisionId: decision.id, name: "Optimistic", description: "Best case assumptions", isBaseline: false, parentScenarioId: baselineScenario.id },
  });

  await prisma.scenarioInput.createMany({
    data: [
      { scenarioId: scenario2.id, entityType: "outcome", entityId: (await prisma.outcome.findFirst({ where: { alternativeId: alt1.id, title: "Promotion in 2 years" } }))!.id, field: "probability", value: "0.8" },
      { scenarioId: scenario2.id, entityType: "outcome", entityId: (await prisma.outcome.findFirst({ where: { alternativeId: alt2.id, title: "Startup succeeds" } }))!.id, field: "probability", value: "0.3" },
    ],
  });

  console.log("Created demo decision with alternatives, criteria, outcomes, and scenarios");

  const decision2 = await prisma.decision.create({
    data: {
      ownerId: user.id,
      title: "Should I pursue a Master's degree?",
      description: "Evaluating graduate school vs certification vs self-study",
      category: "education",
      status: "draft",
      question: "Which educational path will provide the best return on investment for my career goals?",
    },
  });

  const [alt21, alt22, alt23] = await Promise.all([
    prisma.alternative.create({ data: { decisionId: decision2.id, title: "Master's Degree (Full-time)", order: 0 } }),
    prisma.alternative.create({ data: { decisionId: decision2.id, title: "Professional Certification", order: 1 } }),
    prisma.alternative.create({ data: { decisionId: decision2.id, title: "Self-Directed Learning", order: 2 } }),
  ]);

  await Promise.all([
    prisma.criterion.create({ data: { decisionId: decision2.id, name: "Total Cost", weight: 25, direction: "minimize", order: 0 } }),
    prisma.criterion.create({ data: { decisionId: decision2.id, name: "Time to Complete", weight: 20, direction: "minimize", order: 1 } }),
    prisma.criterion.create({ data: { decisionId: decision2.id, name: "Career Impact", weight: 30, direction: "maximize", order: 2 } }),
    prisma.criterion.create({ data: { decisionId: decision2.id, name: "Flexibility", weight: 15, direction: "maximize", order: 3 } }),
    prisma.criterion.create({ data: { decisionId: decision2.id, name: "Networking", weight: 10, direction: "maximize", order: 4 } }),
  ]);

  await prisma.scenario.create({ data: { decisionId: decision2.id, name: "Baseline", isBaseline: true } });

  // Seed Decision Workflow Templates
  const template1 = await prisma.workflow.create({
    data: {
      ownerId: user.id,
      title: "Job Offer Multi-Criteria Decision",
      description: "Compare multiple job offers using weighted multi-criteria decision scoring and sensitivity analysis",
      isTemplate: true,
      status: "active",
      version: 1,
    },
  });

  const t1_n1 = await prisma.workflowNode.create({
    data: {
      workflowId: template1.id,
      type: "start_decision",
      title: "Start Decision",
      description: "Initial trigger for evaluating job offers",
      positionX: 50,
      positionY: 180,
      config: JSON.stringify({ triggerType: "manual" }),
    },
  });

  const t1_n2 = await prisma.workflowNode.create({
    data: {
      workflowId: template1.id,
      type: "alternative",
      title: "Define Job Offers",
      description: "3 employment alternatives with distinct growth and culture profiles",
      positionX: 300,
      positionY: 80,
      config: JSON.stringify({
        alternatives: [
          { title: "Senior Engineer at TechCorp", description: "$165k base, high stability, standard growth" },
          { title: "Lead Architect at StartupXYZ", description: "$150k base + 1% equity, rapid trajectory" },
          { title: "Stay at Current Firm", description: "$135k base, comfort, steady balance" },
        ],
      }),
    },
  });

  const t1_n3 = await prisma.workflowNode.create({
    data: {
      workflowId: template1.id,
      type: "define_criteria",
      title: "Decision Criteria",
      description: "Priority weights: Compensation, Career Growth, Work-Life Balance",
      positionX: 300,
      positionY: 280,
      config: JSON.stringify({
        criteria: [
          { name: "Total Compensation", weight: 35, direction: "maximize" },
          { name: "Career Growth", weight: 30, direction: "maximize" },
          { name: "Work-Life Balance", weight: 20, direction: "maximize" },
          { name: "Culture Fit", weight: 15, direction: "maximize" },
        ],
      }),
    },
  });

  const t1_n4 = await prisma.workflowNode.create({
    data: {
      workflowId: template1.id,
      type: "weighted_score",
      title: "Weighted Scoring Engine",
      description: "Normalized MCDA scoring across weighted dimensions",
      positionX: 580,
      positionY: 180,
      config: JSON.stringify({ algorithm: "normalized_weighted_sum" }),
    },
  });

  const t1_n5 = await prisma.workflowNode.create({
    data: {
      workflowId: template1.id,
      type: "sensitivity_analysis",
      title: "Sensitivity Analysis",
      description: "Detect parameter thresholds that alter the top recommendation",
      positionX: 840,
      positionY: 180,
      config: JSON.stringify({ deltaStep: 0.05 }),
    },
  });

  const t1_n6 = await prisma.workflowNode.create({
    data: {
      workflowId: template1.id,
      type: "recommendation",
      title: "Final Recommendation",
      description: "Comprehensive ranked decision output with confidence score",
      positionX: 1100,
      positionY: 180,
      config: JSON.stringify({ format: "detailed_breakdown" }),
    },
  });

  await prisma.workflowEdge.createMany({
    data: [
      { workflowId: template1.id, sourceNodeId: t1_n1.id, targetNodeId: t1_n2.id, sourceHandle: "output", targetHandle: "input" },
      { workflowId: template1.id, sourceNodeId: t1_n1.id, targetNodeId: t1_n3.id, sourceHandle: "output", targetHandle: "input" },
      { workflowId: template1.id, sourceNodeId: t1_n2.id, targetNodeId: t1_n4.id, sourceHandle: "output", targetHandle: "input" },
      { workflowId: template1.id, sourceNodeId: t1_n3.id, targetNodeId: t1_n4.id, sourceHandle: "output", targetHandle: "input" },
      { workflowId: template1.id, sourceNodeId: t1_n4.id, targetNodeId: t1_n5.id, sourceHandle: "output", targetHandle: "input" },
      { workflowId: template1.id, sourceNodeId: t1_n5.id, targetNodeId: t1_n6.id, sourceHandle: "output", targetHandle: "input" },
    ],
  });

  // Template 2: Monte Carlo Risk Simulation
  const template2 = await prisma.workflow.create({
    data: {
      ownerId: user.id,
      title: "Monte Carlo Risk & ROI Simulation",
      description: "Stochastic 10,000-run simulation evaluating variance, tail risk, and outcome distributions",
      isTemplate: true,
      status: "active",
      version: 1,
    },
  });

  const t2_n1 = await prisma.workflowNode.create({
    data: {
      workflowId: template2.id,
      type: "start_decision",
      title: "Launch Simulation",
      positionX: 50,
      positionY: 180,
      config: JSON.stringify({}),
    },
  });

  const t2_n2 = await prisma.workflowNode.create({
    data: {
      workflowId: template2.id,
      type: "alternative",
      title: "Strategic Options",
      description: "Aggressive vs Defensive capital strategy",
      positionX: 300,
      positionY: 100,
      config: JSON.stringify({
        alternatives: [
          { title: "Aggressive Expansion", description: "Heavy marketing + sales hiring" },
          { title: "Lean Efficiency", description: "Focus on unit economics and retention" },
        ],
      }),
    },
  });

  const t2_n3 = await prisma.workflowNode.create({
    data: {
      workflowId: template2.id,
      type: "possible_outcome",
      title: "Market Scenarios",
      description: "Bull market (70% prob, $250k) vs Bear market (30% prob, -$40k)",
      positionX: 300,
      positionY: 270,
      config: JSON.stringify({ probability: 0.7, monetaryPayoff: 250000, riskLevel: "medium" }),
    },
  });

  const t2_n4 = await prisma.workflowNode.create({
    data: {
      workflowId: template2.id,
      type: "monte_carlo",
      title: "Monte Carlo Simulator",
      description: "10,000 randomized iterations with P5-P95 percentiles",
      positionX: 580,
      positionY: 180,
      config: JSON.stringify({ iterations: 10000 }),
    },
  });

  const t2_n5 = await prisma.workflowNode.create({
    data: {
      workflowId: template2.id,
      type: "recommendation",
      title: "Risk-Adjusted Decision",
      description: "Winning alternative by expected value and variance bounds",
      positionX: 860,
      positionY: 180,
      config: JSON.stringify({}),
    },
  });

  await prisma.workflowEdge.createMany({
    data: [
      { workflowId: template2.id, sourceNodeId: t2_n1.id, targetNodeId: t2_n2.id, sourceHandle: "output", targetHandle: "input" },
      { workflowId: template2.id, sourceNodeId: t2_n1.id, targetNodeId: t2_n3.id, sourceHandle: "output", targetHandle: "input" },
      { workflowId: template2.id, sourceNodeId: t2_n2.id, targetNodeId: t2_n4.id, sourceHandle: "output", targetHandle: "input" },
      { workflowId: template2.id, sourceNodeId: t2_n3.id, targetNodeId: t2_n4.id, sourceHandle: "output", targetHandle: "input" },
      { workflowId: template2.id, sourceNodeId: t2_n4.id, targetNodeId: t2_n5.id, sourceHandle: "output", targetHandle: "input" },
    ],
  });

  // Template 3: Business Strategy Choice
  const template3 = await prisma.workflow.create({
    data: {
      ownerId: user.id,
      title: "Product Launch & Expected Value",
      description: "Calculate expected monetary value (EMV) and worst-case downside for new product launch",
      isTemplate: true,
      status: "active",
      version: 1,
    },
  });

  const t3_n1 = await prisma.workflowNode.create({
    data: {
      workflowId: template3.id,
      type: "manual_trigger",
      title: "Product Committee Trigger",
      positionX: 50,
      positionY: 180,
      config: JSON.stringify({}),
    },
  });

  const t3_n2 = await prisma.workflowNode.create({
    data: {
      workflowId: template3.id,
      type: "alternative",
      title: "Launch Alternatives",
      positionX: 300,
      positionY: 180,
      config: JSON.stringify({
        alternatives: [
          { title: "SaaS Enterprise Tier", description: "High ACV, longer sales cycles" },
          { title: "Self-Serve PLG Model", description: "Low barrier, high velocity" },
        ],
      }),
    },
  });

  const t3_n3 = await prisma.workflowNode.create({
    data: {
      workflowId: template3.id,
      type: "expected_monetary_value",
      title: "Expected Monetary Value",
      positionX: 560,
      positionY: 180,
      config: JSON.stringify({}),
    },
  });

  const t3_n4 = await prisma.workflowNode.create({
    data: {
      workflowId: template3.id,
      type: "best_worst_case",
      title: "Downside / Upside Spread",
      positionX: 820,
      positionY: 180,
      config: JSON.stringify({}),
    },
  });

  const t3_n5 = await prisma.workflowNode.create({
    data: {
      workflowId: template3.id,
      type: "summary_report",
      title: "Executive Briefing",
      positionX: 1080,
      positionY: 180,
      config: JSON.stringify({ format: "executive" }),
    },
  });

  await prisma.workflowEdge.createMany({
    data: [
      { workflowId: template3.id, sourceNodeId: t3_n1.id, targetNodeId: t3_n2.id, sourceHandle: "output", targetHandle: "input" },
      { workflowId: template3.id, sourceNodeId: t3_n2.id, targetNodeId: t3_n3.id, sourceHandle: "output", targetHandle: "input" },
      { workflowId: template3.id, sourceNodeId: t3_n3.id, targetNodeId: t3_n4.id, sourceHandle: "output", targetHandle: "input" },
      { workflowId: template3.id, sourceNodeId: t3_n4.id, targetNodeId: t3_n5.id, sourceHandle: "output", targetHandle: "input" },
    ],
  });

  console.log("Seeded 3 visual workflow templates!");
  console.log("Seeding completed!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });