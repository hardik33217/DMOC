import { Template } from "@decisionos/shared";

export const DECISION_TEMPLATES: Template[] = [
  {
    id: "career-choice",
    name: "Job Offer & Compensation Analysis",
    description: "Compare job offers across total compensation, equity upside, career trajectory, and downside risk",
    category: "career",
    icon: "briefcase",
    decision: {
      title: "Which job offer should I accept?",
      description: "Comprehensive evaluation of offers from established tech vs high-growth venture startup vs current employer",
      question: "Which career path provides the highest expected value and long-term trajectory?",
      alternatives: [
        { title: "Job Offer A - TechCorp", description: "Senior Staff Engineer with liquid public RSUs" },
        { title: "Job Offer B - StartupXYZ", description: "Founding Engineer with 0.75% equity grant" },
        { title: "Stay at Current Job", description: "Lead Engineer with promised promotion in next cycle" },
      ],
      criteria: [
        { name: "Total Compensation ($/yr)", weight: 30, direction: "maximize" },
        { name: "Career Growth Potential", weight: 25, direction: "maximize" },
        { name: "Work-Life Balance", weight: 20, direction: "maximize" },
        { name: "Culture & Team Caliber", weight: 15, direction: "maximize" },
        { name: "Commute & Flexibility", weight: 10, direction: "maximize" },
      ],
      outcomes: [
        // TechCorp
        { title: "Strong Performance & RSU Vest", probability: 0.70, monetaryPayoff: 210000, utilityScore: 88, riskLevel: "low", alternativeTitle: "Job Offer A - TechCorp" },
        { title: "Lateral Reorg & Freeze", probability: 0.20, monetaryPayoff: 165000, utilityScore: 65, riskLevel: "medium", alternativeTitle: "Job Offer A - TechCorp" },
        { title: "Department Downsizing", probability: 0.10, monetaryPayoff: -35000, utilityScore: 25, riskLevel: "high", alternativeTitle: "Job Offer A - TechCorp" },
        // StartupXYZ
        { title: "Unicorn Exit / Acquisition", probability: 0.25, monetaryPayoff: 650000, utilityScore: 98, riskLevel: "critical", alternativeTitle: "Job Offer B - StartupXYZ" },
        { title: "Steady Growth & Series C", probability: 0.45, monetaryPayoff: 180000, utilityScore: 78, riskLevel: "medium", alternativeTitle: "Job Offer B - StartupXYZ" },
        { title: "Startup Runaway Depletion", probability: 0.30, monetaryPayoff: -45000, utilityScore: 20, riskLevel: "high", alternativeTitle: "Job Offer B - StartupXYZ" },
        // Stay Current
        { title: "Promoted to Principal", probability: 0.45, monetaryPayoff: 155000, utilityScore: 74, riskLevel: "low", alternativeTitle: "Stay at Current Job" },
        { title: "Salary Plateau & Slow Growth", probability: 0.40, monetaryPayoff: 125000, utilityScore: 55, riskLevel: "low", alternativeTitle: "Stay at Current Job" },
        { title: "Project Cancellation", probability: 0.15, monetaryPayoff: -20000, utilityScore: 35, riskLevel: "medium", alternativeTitle: "Stay at Current Job" },
      ],
    },
  },
  {
    id: "cloud-migration",
    name: "Cloud & Infrastructure Modernization",
    description: "Evaluate multi-cloud architecture vs managed Kubernetes vs on-premise colocation",
    category: "business",
    icon: "building-2",
    decision: {
      title: "How should we modernize our infrastructure stack?",
      description: "Evaluating TCO, SLA availability, migration risk, and operational overhead",
      question: "Which infrastructure strategy minimizes operating costs while achieving 99.99% uptime?",
      alternatives: [
        { title: "AWS Multi-Region Serverless", description: "AWS Lambda, Aurora Global, ECS Fargate" },
        { title: "Google Cloud Managed GKE", description: "Google Kubernetes Engine with Cloud Spanner" },
        { title: "Hybrid Colocation Private Cloud", description: "Dedicated leased hardware with edge CDN" },
      ],
      criteria: [
        { name: "3-Year Total Cost of Ownership", weight: 30, direction: "minimize" },
        { name: "SLA Availability & Uptime (%)", weight: 25, direction: "maximize" },
        { name: "Migration & Engineering Effort (wks)", weight: 20, direction: "minimize" },
        { name: "Vendor Lock-In Risk", weight: 15, direction: "minimize" },
        { name: "Developer Velocity & Tooling", weight: 10, direction: "maximize" },
      ],
      outcomes: [
        // AWS
        { title: "Rapid Scale & Zero Ops Overhead", probability: 0.60, monetaryPayoff: 340000, utilityScore: 90, riskLevel: "low", alternativeTitle: "AWS Multi-Region Serverless" },
        { title: "Moderate Cloud Bill Spikes", probability: 0.30, monetaryPayoff: 140000, utilityScore: 70, riskLevel: "medium", alternativeTitle: "AWS Multi-Region Serverless" },
        { title: "Severe Egress Bill Overrun", probability: 0.10, monetaryPayoff: -90000, utilityScore: 30, riskLevel: "high", alternativeTitle: "AWS Multi-Region Serverless" },
        // GKE
        { title: "Optimal Container Portability", probability: 0.55, monetaryPayoff: 290000, utilityScore: 85, riskLevel: "low", alternativeTitle: "Google Cloud Managed GKE" },
        { title: "Standard Kubernetes Operations", probability: 0.35, monetaryPayoff: 175000, utilityScore: 75, riskLevel: "medium", alternativeTitle: "Google Cloud Managed GKE" },
        { title: "K8s Cluster Upgrade Breakage", probability: 0.10, monetaryPayoff: -60000, utilityScore: 40, riskLevel: "high", alternativeTitle: "Google Cloud Managed GKE" },
        // Hybrid Colocation
        { title: "Maximum Cost Efficiency at Scale", probability: 0.40, monetaryPayoff: 420000, utilityScore: 82, riskLevel: "medium", alternativeTitle: "Hybrid Colocation Private Cloud" },
        { title: "Hardware Maintenance Overhead", probability: 0.40, monetaryPayoff: 110000, utilityScore: 60, riskLevel: "medium", alternativeTitle: "Hybrid Colocation Private Cloud" },
        { title: "Hardware Failure Outage", probability: 0.20, monetaryPayoff: -130000, utilityScore: 20, riskLevel: "critical", alternativeTitle: "Hybrid Colocation Private Cloud" },
      ],
    },
  },
  {
    id: "financial-investment",
    name: "Capital Allocation & Investment Strategy",
    description: "Model expected monetary return, market drawdown, and volatility across portfolios",
    category: "finance",
    icon: "trending-up",
    decision: {
      title: "Where should we allocate our $250,000 corporate reserve?",
      description: "Maximizing risk-adjusted returns while safeguarding operational liquidity",
      question: "Which allocation delivers the best Sharpe ratio and monetary payoff under market volatility?",
      alternatives: [
        { title: "US Treasuries & High-Yield Cash", description: "4.3% guaranteed risk-free short-term notes" },
        { title: "Diversified Global Index (60/40)", description: "Vanguard Total World Stock + Aggregate Bond ETF" },
        { title: "High-Growth Tech Equity & AI Sector", description: "Targeted technology index and structured notes" },
      ],
      criteria: [
        { name: "Expected Annual Yield (%)", weight: 35, direction: "maximize" },
        { name: "Max Drawdown Risk (%)", weight: 30, direction: "minimize" },
        { name: "Capital Liquidity (Days to cash)", weight: 20, direction: "maximize" },
        { name: "Inflation Protection Alpha", weight: 15, direction: "maximize" },
      ],
      outcomes: [
        // US Treasuries
        { title: "Guaranteed Coupon Return", probability: 0.90, monetaryPayoff: 10750, utilityScore: 80, riskLevel: "low", alternativeTitle: "US Treasuries & High-Yield Cash" },
        { title: "High Inflation Drag", probability: 0.10, monetaryPayoff: 4200, utilityScore: 60, riskLevel: "low", alternativeTitle: "US Treasuries & High-Yield Cash" },
        // Diversified Global Index
        { title: "Bull Market Rally", probability: 0.50, monetaryPayoff: 38000, utilityScore: 92, riskLevel: "medium", alternativeTitle: "Diversified Global Index (60/40)" },
        { title: "Moderate Sideways Growth", probability: 0.35, monetaryPayoff: 16500, utilityScore: 76, riskLevel: "low", alternativeTitle: "Diversified Global Index (60/40)" },
        { title: "Global Correction / Bear Market", probability: 0.15, monetaryPayoff: -28000, utilityScore: 35, riskLevel: "high", alternativeTitle: "Diversified Global Index (60/40)" },
        // Tech Equity
        { title: "AI & Tech Supercycle", probability: 0.40, monetaryPayoff: 82000, utilityScore: 99, riskLevel: "critical", alternativeTitle: "High-Growth Tech Equity & AI Sector" },
        { title: "Choppy Volatility Baseline", probability: 0.35, monetaryPayoff: 21000, utilityScore: 72, riskLevel: "medium", alternativeTitle: "High-Growth Tech Equity & AI Sector" },
        { title: "Tech Sector Valuation Compression", probability: 0.25, monetaryPayoff: -65000, utilityScore: 22, riskLevel: "critical", alternativeTitle: "High-Growth Tech Equity & AI Sector" },
      ],
    },
  },
  {
    id: "business-strategy",
    name: "Strategic Market Expansion vs Product R&D",
    description: "Compare international expansion against doubling down on core enterprise product",
    category: "business",
    icon: "building-2",
    decision: {
      title: "Which strategic direction should we pursue this fiscal year?",
      description: "Balancing enterprise contract expansion against new market geographical entry",
      question: "Which initiative yields higher Enterprise Value (EV) and gross margin expansion?",
      alternatives: [
        { title: "European Market Expansion (EMEA)", description: "Establish localized sales and GDPR-compliant EU infrastructure" },
        { title: "Enterprise AI Workflow Product Line", description: "Ship automated decision workflows for Fortune 500 customers" },
        { title: "Strategic M&A Boutique Acquisition", description: "Acquire specialized boutique AI consultancy for instant ARR" },
      ],
      criteria: [
        { name: "Year-1 Net New ARR ($)", weight: 35, direction: "maximize" },
        { name: "Execution & Regulatory Complexity", weight: 25, direction: "minimize" },
        { name: "Gross Margin Impact (%)", weight: 20, direction: "maximize" },
        { name: "Payback Period (Months)", weight: 10, direction: "minimize" },
        { name: "Competitive Moat Extension", weight: 10, direction: "maximize" },
      ],
      outcomes: [
        // EMEA
        { title: "Major Enterprise EU Adoption", probability: 0.45, monetaryPayoff: 850000, utilityScore: 91, riskLevel: "medium", alternativeTitle: "European Market Expansion (EMEA)" },
        { title: "Moderate Regional Sales", probability: 0.40, monetaryPayoff: 320000, utilityScore: 74, riskLevel: "medium", alternativeTitle: "European Market Expansion (EMEA)" },
        { title: "Regulatory Delay & Overhead Loss", probability: 0.15, monetaryPayoff: -180000, utilityScore: 28, riskLevel: "high", alternativeTitle: "European Market Expansion (EMEA)" },
        // Enterprise AI
        { title: "Viral Enterprise AI Contract Wave", probability: 0.50, monetaryPayoff: 1250000, utilityScore: 97, riskLevel: "high", alternativeTitle: "Enterprise AI Workflow Product Line" },
        { title: "Steady Enterprise Tier Expansion", probability: 0.35, monetaryPayoff: 480000, utilityScore: 82, riskLevel: "low", alternativeTitle: "Enterprise AI Workflow Product Line" },
        { title: "Model Commoditization Flop", probability: 0.15, monetaryPayoff: -140000, utilityScore: 32, riskLevel: "high", alternativeTitle: "Enterprise AI Workflow Product Line" },
        // M&A
        { title: "Seamless Post-Merger Synergies", probability: 0.35, monetaryPayoff: 950000, utilityScore: 88, riskLevel: "high", alternativeTitle: "Strategic M&A Boutique Acquisition" },
        { title: "Culture Clash & Staff Turnover", probability: 0.45, monetaryPayoff: 210000, utilityScore: 58, riskLevel: "medium", alternativeTitle: "Strategic M&A Boutique Acquisition" },
        { title: "Failed Integration Write-Down", probability: 0.20, monetaryPayoff: -380000, utilityScore: 18, riskLevel: "critical", alternativeTitle: "Strategic M&A Boutique Acquisition" },
      ],
    },
  },
];