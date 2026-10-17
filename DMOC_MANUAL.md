# DMOC: Comprehensive Platform Report & Complete User Manual

> **Document Version:** 2.0.0  
> **Classification:** Full System Architecture, Theoretical Foundations & User Operating Manual  
> **System Status:** Active & Validated  
> **Target Audience:** Decision Makers, Systems Architects, Business Analysts, and Developers

---

## Table of Contents

1. [Executive Summary & Core Mission](#1-executive-summary--core-mission)
2. [Theoretical Foundations & Decision Science](#2-theoretical-foundations--decision-science)
3. [System Architecture & Technology Stack](#3-system-architecture--technology-stack)
4. [Data Architecture & Schema Reference](#4-data-architecture--schema-reference)
5. [The Visual Node-Based Decision Workflow Builder](#5-the-visual-node-based-decision-workflow-builder)
6. [Complete Node Catalogue (26 Nodes Across 7 Categories)](#6-complete-node-catalogue)
7. [The Classic Decision Suite & 3D Decision Tree](#7-the-classic-decision-suite--3d-decision-tree)
8. [API Architecture & Endpoint Reference](#8-api-architecture--endpoint-reference)
9. [End-to-End User Operating Manual (Step-by-Step)](#9-end-to-end-user-operating-manual)
10. [Pre-Built Workflow Templates & Real-World Use Cases](#10-pre-built-workflow-templates--real-world-use-cases)
11. [Installation, Environment Setup & Deployment](#11-installation-environment-setup--deployment)
12. [Security, Audit Logging & Compliance](#12-security-audit-logging--compliance)
13. [Troubleshooting & FAQ](#13-troubleshooting--faq)

---

## 1. Executive Summary & Core Mission

### 1.1 The Problem: High-Stakes Decision Paralysis & Heuristic Bias
Modern decision-making in personal careers, enterprise resource allocation, corporate strategy, and venture investments is plagued by three fundamental flaws:
1. **Cognitive Biases**: Recency bias, sunk cost fallacy, and anchoring distort subjective evaluations.
2. **Analysis Paralysis**: When faced with multi-dimensional criteria (e.g., compensation, culture, career growth, location) or probabilistic uncertainty (market downturns, IPO probabilities), decision-makers struggle to synthesize conflicting trade-offs.
3. **Black-Box Spreadsheets**: Traditional decision matrices in Excel are brittle, static, lack explainability, and cannot simulate stochastic risks over time.

### 1.2 The Mission of DecisionOS
**DecisionOS** is an intelligent decision modeling and workflow simulation operating system. Its core purpose is to:
- **Democratize Decision Science**: Translate sophisticated mathematical decision frameworks (MCDA, Expected Monetary Value, Expected Utility Theory, Monte Carlo simulation, Sensitivity Analysis) into an intuitive, visual medium.
- **Provide Visual Node-Based Programming**: Empower users to build reactive decision graphs inspired by n8n, Node-RED, and professional computational flow engines.
- **Deliver Explainable Intelligence**: Transform abstract numbers into auditable reasoning chains, interactive 3D visualizations, and executive briefings.

---

## 2. Theoretical Foundations & Decision Science

DecisionOS is built upon verified mathematical and statistical methodologies implemented in `backend/src/services/decisionEngine.ts`.

### 2.1 Multi-Criteria Decision Analysis (MCDA)
Multi-Criteria Decision Analysis evaluates competing alternatives across multiple orthogonal criteria, each assigned a relative priority weight $w_j$ such that $\sum_{j=1}^m w_j = 100\%$.

#### 1. Linear Normalization
Criteria can be either **maximization** (e.g., revenue, career growth) or **minimization** (e.g., commute time, operational risk, cost). DecisionOS normalizes disparate units (dollars, hours, 1-10 ratings) into dimensionless utility values $r_{ij} \in [0, 1]$:

$$\text{For Maximization: } r_{ij} = \frac{x_{ij} - x_j^{\min}}{x_j^{\max} - x_j^{\min}}$$

$$\text{For Minimization: } r_{ij} = \frac{x_j^{\max} - x_{ij}}{x_j^{\max} - x_j^{\min}}$$

#### 2. Weighted Sum Scoring (WSM)
The global aggregate score $S_i$ for each alternative $i$ is calculated as:

$$S_i = \sum_{j=1}^m w_j \cdot r_{ij}$$

The alternative with the highest aggregate score is designated as the dominant option.

### 2.2 Expected Monetary Value (EMV)
Under conditions of risk with discrete states of nature, each alternative $i$ produces a set of mutually exclusive outcomes $O_{ik}$, each with probability $P(O_{ik})$ and monetary payoff $X_{ik}$:

$$\text{EMV}_i = \sum_{k=1}^K P(O_{ik}) \cdot X_{ik} \quad \text{where } \sum_{k=1}^K P(O_{ik}) = 1.0$$

DecisionOS calculates the EMV spread across alternatives to establish optimal risk-adjusted financial payoffs.

### 2.3 Expected Utility Theory (von Neumann–Morgenstern)
Monetary value is not linear with psychological satisfaction due to risk aversion. For non-linear risk tolerances, DecisionOS maps monetary payoffs or ratings to utility scores $U(O_{ik}) \in [0, 100]$:

$$\text{EU}_i = \sum_{k=1}^K P(O_{ik}) \cdot U(O_{ik})$$

### 2.4 Monte Carlo Stochastic Simulation
Real-world variables are rarely point estimates. DecisionOS implements a pseudo-random Monte Carlo engine generating up to **10,000 iterations** per alternative:
- Samples probability distributions for outcomes.
- Calculates empirical percentiles: $P_{10}$ (pessimistic downside), $P_{50}$ (median expectation), and $P_{90}$ (optimistic upside).
- Computes mean expected return $\mu$, variance $\sigma^2$, and standard deviation $\sigma$.

### 2.5 Sensitivity Analysis & Critical Thresholds
DecisionOS systematically perturbs individual criterion weights $w_j$ from $0\%$ to $100\%$ while proportionately scaling other weights. It identifies **tipping points**—the exact weight threshold where the leading recommendation switches to another alternative.

---

## 3. System Architecture & Technology Stack

DecisionOS employs a high-performance TypeScript monorepo architecture with clean separation of concerns.

```
decisionos/
├── backend/                 # Node.js + Express + Prisma + SQLite/PostgreSQL
│   ├── prisma/             # Schema, migrations & comprehensive seed templates
│   ├── src/
│   │   ├── index.ts        # Express entrypoint, CORS, Helmet, RateLimiter
│   │   ├── middleware/     # Auth (JWT + Cookies), Audit logging, Error handling
│   │   ├── routes/         # Workflows, Decisions, Scenarios, Simulations, Auth
│   │   ├── services/       # decisionEngine.ts & workflowExecutor.ts
│   │   └── utils/          # Password hashing (Argon2), Zod validation schemas
├── frontend/                # React 18 + Vite + Tailwind CSS + @xyflow/react
│   ├── src/
│   │   ├── components/     # DecisionTree3D (Three.js), Navbar, Modals, UI Library
│   │   ├── hooks/          # useWorkflowStore.ts (Zustand state & persistence)
│   │   ├── pages/          # WorkflowEditorPage, WorkflowsPage, DashboardPage
│   │   ├── workflow/       # Canvas, CustomNodes, CustomEdge, NodePalette, PropertiesPanel
│   │   └── App.tsx         # React Router v6 tree with ProtectedRoutes
└── shared/                  # @decisionos/shared monorepo library
    ├── src/
    │   └── index.ts        # Shared Zod validation schemas, TypeScript interfaces
```

---

## 4. Complete Node Catalogue (26 Nodes Across 7 Categories)

### Category 1: Triggers
- `start_decision`: Entrypoint for scheduled or pipeline decisions.
- `manual_trigger`: Manual trigger button initiated by user in canvas.
- `import_spreadsheet`: Imports decision criteria and matrices directly from Excel files.
- `existing_decision`: Loads a saved decision model from the classic database.

### Category 2: Decision Inputs
- `decision_question`: Defines the primary strategic decision question.
- `alternative`: Defines candidate options under consideration.
- `define_criteria`: Specifies evaluation criteria and optimization direction (`maximize` vs `minimize`).
- `set_criteria_weights`: Assigns relative importance weights (summing to 100%).
- `define_constraints`: Specifies hard constraints (e.g. maximum budget, non-negotiable thresholds).
- `set_assumptions`: Documents baseline scenario assumptions.

### Category 3: Logic & Control Flow
- `if_else`: Conditional branching based on evaluated conditions (`>`, `<`, `==`, `!=`).
- `compare_values`: Evaluates equality or magnitude between two upstream variables.
- `threshold_check`: Triggers warning or branch if a metric crosses a threshold.
- `and_or_conditions`: Combines multiple boolean logic gates.
- `filter_alternatives`: Excludes alternatives that fail mandatory constraint filters.
- `merge_branches`: Re-converges split branching pathways into a unified pipeline.

### Category 4: Outcomes & Probabilities
- `possible_outcome`: Attaches discrete outcome states to decision alternatives.
- `probability`: Quantifies the likelihood of an outcome state $[0, 1]$.
- `cost`: Models financial investment or downside cost.
- `benefit`: Models financial upside, revenue, or non-monetary value.
- `risk_assessment`: Evaluates risk severity (Low, Medium, High, Critical).
- `time_estimate`: Quantifies execution time or delivery timeframe.
- `custom_metric`: Captures bespoke business indicators (NPS, ESG, Carbon footprint).

### Category 5: Calculations
- `weighted_score`: Calculates multi-criteria weighted scoring (MCDA).
- `expected_monetary_value`: Computes probability-weighted monetary payoffs (EMV).
- `expected_utility`: Evaluates expected utility under psychological risk curves.
- `best_worst_case`: Identifies best-case upside, worst-case downside, and spread.
- `sensitivity_analysis`: Discovers tipping points where weights flip the recommendation.
- `scenario_comparison`: Side-by-side comparison across multiple scenarios.
- `monte_carlo`: Runs 10,000 stochastic simulation runs with percentile distributions.

### Category 6: Data & Persistence
- `read_saved_decision`: Reads decision data from the database.
- `read_spreadsheet_data`: Ingests tabular rows and columns from spreadsheets.
- `transform_data`: Modifies, maps, and reshapes data payloads between nodes.
- `validate_data`: Validates completeness and formats of decision models.
- `save_results`: Automatically saves simulation outputs to the database.
- `export_report`: Formats results into exportable Excel or JSON reports.

### Category 7: Outputs & Visualizations
- `recommendation`: Synthesizes calculations into a clear winner recommendation.
- `results_table`: Formats multi-attribute comparison tables.
- `chart`: Generates visual bar, radar, or line comparison charts.
- `summary_report`: Generates executive summaries with calculation explanations.
- `end`: Marks the termination point of the decision workflow.

---

## 5. End-to-End Operating Manual

### 5.1 Signing In
1. Navigate to `http://localhost:5173`.
2. Sign in with the demo account:
   - **Email:** `demo@decisionos.com`
   - **Password:** `Password123!`

### 5.2 Creating & Using Workflows
1. Click **Workflows** in the sidebar.
2. Select one of the pre-built templates or click **New Workflow**:
   - *Job Offer Multi-Criteria Decision*
   - *Monte Carlo Risk & ROI Simulation*
   - *Product Launch & Expected Value*
3. **Canvas Controls**:
   - Drag nodes from the left palette onto the grid.
   - Connect handles from left to right.
   - Click any node to open the **Properties Panel** on the right.
   - Use <kbd>Ctrl+S</kbd> to save, <kbd>Ctrl+Z</kbd> to undo, <kbd>Ctrl+Y</kbd> to redo.
4. **Execution**:
   - Click **Run** in the toolbar.
   - The **Execution Log Drawer** will slide up from the bottom showing sequential node completion, execution duration, and full input/output snapshots.

---

## 6. Pre-Built Decision Templates

1. **Job Offer Multi-Criteria Decision**:
   - Entry point: `Start Decision` $\to$ `Define Criteria` $\to$ `Set Criteria Weights` $\to$ `Weighted Score (MCDA)` $\to$ `Sensitivity Analysis` $\to$ `Recommendation`.
2. **Monte Carlo Risk & ROI Simulation**:
   - Entry point: `Manual Trigger` $\to$ `Probability Distributions` $\to$ `Monte Carlo Simulation (10,000 runs)` $\to$ `Results Table` $\to$ `Executive Summary`.
3. **Product Launch & Expected Value**:
   - Entry point: `Manual Trigger` $\to$ `Launch Alternatives` $\to$ `Expected Monetary Value (EMV)` $\to$ `Downside/Upside Spread` $\to$ `Executive Briefing`.

---

## 7. Installation & Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Build shared library
cd shared && npm run build && cd ..

# 3. Setup database and seed templates
cd backend
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
cd ..

# 4. Start development servers
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3002` (or 3001 depending on your `.env`)

---

## 8. Business Decision Intelligence (Retail, Pharmacy, Grocery, Quick-Commerce & Startups)

DecisionOS 2.5 introduces a comprehensive business decision intelligence suite explicitly tailored for physical retail stores, pharmacies, grocery shops, quick-commerce operators, startups, and business students.

### 8.1 Business Onboarding & Multi-Workspace Architecture
- **Onboarding Wizard**: Prompts store owners for business type, operational status (existing vs. planned), geographic location, product categories, local currency/taxes, and operating overheads.
- **Learning vs. Enterprise Modes**: Students and early entrepreneurs can activate learning mode for explanatory guidance, while enterprises can leverage multi-location workspace controls.
- **Strict Separation of Sample Workspaces**: Demonstration businesses (*Arogya Medical Store*, *FreshMart Grocery*) are stored with `isSample: true` and clearly labeled with banner notices so simulated benchmark transactions never mix with real financial records.

### 8.2 Real Product Search & Provenance
- **Open Food Facts API**: Live barcode and brand search for grocery items with attribution and license compliance.
- **NPPA DPCO & CDSCO Drug Database**: Official pricing ceiling guidelines and Schedule H/H1 prescription compliance for licensed Indian pharmacies.
- **Non-Medical Disclaimer**: DecisionOS evaluates lawful business inventory purchasing and storage decisions only. It does not provide medical treatment advice.
- **Field-Level Verification Badges**: Confirms exact barcode matches vs. fuzzy matches, displaying provider provenance and source URLs.

### 8.3 Product & Inventory Management
- **Pack Size Conversions**: Accurately computes unit purchase prices from pack purchase prices (e.g., strips of 15 tablets, cartons of 24 snacks) without double-counting margins.
- **Atomic Stock Movements**: Restock, sale, adjustment, and spoilage/waste movements logged inside ACID transactions.
- **Supplier Directory & Quotes**: Records vendor lead times, minimum order quantities (MOQ), and preferred vendor pricing.

### 8.4 Statistical Demand Forecasting
- **Stockout-Suppressed Sales Velocity**: Automatically detects zero-sales days caused by stockouts and normalizes daily velocity over effective in-stock days.
- **Safety Stock & Reorder Points (ROP)**: Computes buffer stock using normal distribution inverse cumulative functions based on target service levels (e.g., 95%).
- **Prediction Intervals**: Projects conservative, base-case, and optimistic horizon demand with explicit confidence ratings and transparent assumptions.

### 8.5 3-Path Inventory Simulation Engine
Every purchasing question is simulated across three actionable paths:
1. **Path A (Proceed with Proposed Order)**: Evaluates working capital outlay, expected sales revenue, gross margin, holding costs, and perishable spoilage exposure.
2. **Path B (Do Not Proceed)**: Evaluates status-quo sales, stockout risk, and lost contribution margin.
3. **Path C (Recommended Alternative Strategy)**: Optimizes order quantity based on lead-time demand, safety stock, and EOQ to maximize net financial return.
- **Break-Even Analysis**: Calculates exact units required to recover capital outlay.
- **Sensitivity Testing**: Evaluates resilience against -25% demand drops, +25% demand surges, and +10% cost hikes.

### 8.6 Business Decision Node Catalogue (17 Nodes)
Added to the visual workflow canvas under the **Business** category:
1. `business_profile`: Declares business type, currency, and tax rate.
2. `product_lookup`: Links catalog item or searches external registry.
3. `source_verification`: Validates official source provenance and pricing ceilings.
4. `inventory_snapshot`: Ingests stock on hand, reorder thresholds, and batch expiry.
5. `sales_history`: Fetches recent sales transactions.
6. `supplier_quote`: Incorporates supplier lead time, MOQ, and terms.
7. `proposed_purchase`: Defines proposed purchase quantity and capital outlay.
8. `demand_forecast`: Evaluates sales velocity, lead-time demand, and safety stock.
9. `stockout_risk`: Quantifies lost revenue from stockout exposure.
10. `expiry_risk`: Computes financial loss on perishable items past shelf life.
11. `cost_margin`: Calculates COGS, gross profit, and gross margin percentage.
12. `cash_flow`: Tracks working capital outlay and cash tied up in stock.
13. `scenario_branch`: Branches into Path A, Path B, and Path C.
14. `best_base_worst`: Computes three-point scenario distribution.
15. `break_even`: Calculates break-even sales units and revenue.
16. `compare_quantities`: Compares financial outcomes across order quantities.
17. `report_output`: Produces store owner executive briefing and audit summary.

### 8.7 Plain-Language Store Owner Decision Reports
- Formatted specifically for store owners without technical or financial backgrounds.
- Summarizes the decision question, recommended path, financial trade-offs, cash required, risk factors, and next steps.
- Supports printable layouts, PDF generation, and Excel exports.

---
*DecisionOS — Know the risk. Understand the opportunity. Decide with evidence.*
