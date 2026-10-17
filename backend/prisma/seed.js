"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const password_js_1 = require("../src/utils/password.js");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Seeding database...");
    const passwordHash = await (0, password_js_1.hashPassword)("Password123!");
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
        prisma.outcome.create({ data: { alternativeId: alt1.id, title: "Promotion in 2 years", description: "Clear path to Staff Engineer", probability: 0.7, monetaryPayoff: 180000, utilityScore: 85, riskLevel: "low", order: 0 } }),
        prisma.outcome.create({ data: { alternativeId: alt1.id, title: "Layoff risk", description: "Company restructuring possible", probability: 0.1, monetaryPayoff: -50000, utilityScore: 20, riskLevel: "high", order: 1 } }),
        prisma.outcome.create({ data: { alternativeId: alt1.id, title: "Steady growth", description: "Normal career progression", probability: 0.2, monetaryPayoff: 150000, utilityScore: 70, riskLevel: "low", order: 2 } }),
        prisma.outcome.create({ data: { alternativeId: alt2.id, title: "Startup succeeds", description: "IPO or acquisition in 3-5 years", probability: 0.2, monetaryPayoff: 500000, utilityScore: 95, riskLevel: "critical", order: 0 } }),
        prisma.outcome.create({ data: { alternativeId: alt2.id, title: "Startup fails", description: "Company shuts down", probability: 0.4, monetaryPayoff: -30000, utilityScore: 30, riskLevel: "high", order: 1 } }),
        prisma.outcome.create({ data: { alternativeId: alt2.id, title: "Moderate success", description: "Series B, steady growth", probability: 0.4, monetaryPayoff: 200000, utilityScore: 80, riskLevel: "medium", order: 2 } }),
        prisma.outcome.create({ data: { alternativeId: alt3.id, title: "Promotion", description: "Promoted to Senior", probability: 0.5, monetaryPayoff: 140000, utilityScore: 75, riskLevel: "low", order: 0 } }),
        prisma.outcome.create({ data: { alternativeId: alt3.id, title: "Stagnation", description: "No growth for 2+ years", probability: 0.3, monetaryPayoff: 120000, utilityScore: 50, riskLevel: "medium", order: 1 } }),
        prisma.outcome.create({ data: { alternativeId: alt3.id, title: "Layoff", description: "Department restructuring", probability: 0.2, monetaryPayoff: -40000, utilityScore: 25, riskLevel: "high", order: 2 } }),
    ]);
    const baselineScenario = await prisma.scenario.create({
        data: { decisionId: decision.id, name: "Baseline", description: "Original assumptions", isBaseline: true },
    });
    const scenario2 = await prisma.scenario.create({
        data: { decisionId: decision.id, name: "Optimistic", description: "Best case assumptions", isBaseline: false, parentScenarioId: baselineScenario.id },
    });
    await prisma.scenarioInput.createMany({
        data: [
            { scenarioId: scenario2.id, entityType: "outcome", entityId: (await prisma.outcome.findFirst({ where: { alternativeId: alt1.id, title: "Promotion in 2 years" } })).id, field: "probability", value: "0.8" },
            { scenarioId: scenario2.id, entityType: "outcome", entityId: (await prisma.outcome.findFirst({ where: { alternativeId: alt2.id, title: "Startup succeeds" } })).id, field: "probability", value: "0.3" },
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
    console.log("Created second demo decision");
    console.log("Seeding completed!");
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
