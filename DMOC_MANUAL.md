# DMOC: Comprehensive Platform Report & Complete Operating Manual
### Decision Marketing Operating System
**Enterprise Multi-Store Decision Modeling, Inventory Analytics & Visual Workflow Engine**

---

> **Document Version:** 3.0.0  
> **Official Designation:** Full System Architectural Report, Mathematical Foundations & User Operating Manual  
> **Platform Status:** Production Ready & Validated  
> **Target Audience:** Store Owners, Business Analysts, Enterprise Decision Makers, Solutions Architects, and Software Engineers  
> **Repository:** [https://github.com/hardik33217/DMOC.git](https://github.com/hardik33217/DMOC.git)

---

## Document Overview & Page Index (10-Page Equivalent Reference)

| Section | Topic | Primary Focus |
| :--- | :--- | :--- |
| **Page 1: Section 1** | Executive Summary & Core Mission | Problem statement, decision paralysis in retail, DMOC core mission |
| **Page 2: Section 2** | Theoretical Foundations & Decision Science | MCDA, EMV, Expected Utility, Monte Carlo 10,000 runs, Sensitivity Analysis |
| **Page 3: Section 3** | Financial & Inventory Mechanics | Gross vs Net margin, Safety Stock, Reorder Point, Working Capital & Break-even |
| **Page 4: Section 4** | System Architecture & Monorepo Design | Monorepo layout, high-level Mermaid flow, complete Technology Stack Matrix |
| **Page 5: Section 5** | Data Architecture & Schema Reference | Prisma ER diagram, Multi-store models, Workflow graphs, Sample data isolation |
| **Page 6: Section 6** | Natural Language Wizard & Real Data Ingestion | AI parsing, Open Food Facts API, NPPA/CDSCO rules, 3-Path analytical engine |
| **Page 7: Section 7** | Visual Node-Based Workflow Canvas | 26 nodes across 7 categories, DAG topological sort, cyclic check, if/else branch |
| **Page 8: Section 8** | Store Operations & Decision Suite | Inventory catalog, batch expiry, supplier ledger, 3D Decision Tree & 2D fallback |
| **Page 9: Section 9** | Comprehensive API Endpoint Reference | Auth, Businesses, Products, Suppliers, Sales, Decisions, Workflows, Reports |
| **Page 10: Section 10-12** | User Operating Manual, Security & Deployment | Step-by-step walkthrough, Docker setup, audit compliance, troubleshooting FAQ |

---

## 1. Executive Summary & Core Mission

### 1.1 The Problem: High-Stakes Decision Paralysis & Operational Blindspots
Across modern enterprise retail, pharmacy management, grocery commerce, and emerging direct-to-consumer businesses, decision-makers face three acute failure modes:

1. **Intuition-Driven Procurement Errors**: Store owners and inventory purchasers frequently reorder based on subjective hunches or recent stockouts rather than empirical sales velocity, lead-time variance, and holding costs. This results in either costly stockouts of high-margin items or severe cash lockup in dead inventory.
2. **Gross vs. Net Profit Confusion**: Traditional accounting software records gross margin on sales but fails to account for fixed operational overhead (store rent, electricity, cold storage, staff salaries, financing costs) during point-of-order decision evaluations. An order appearing profitable on paper frequently loses money when considering capital holding periods.
3. **Fragile and Disconnected Spreadsheets**: Decision-makers resort to static Excel sheets that lack real-time catalog integration, cannot simulate stochastic risk scenarios, fail to reflect regulatory constraints (such as DPCO price ceilings or expiry horizons), and cannot be shared securely across organizational roles.

### 1.2 The Mission of DMOC
**DMOC (Decision Marketing Operating System)** bridges the gap between decision science, inventory logistics, and marketing intelligence. Its primary objectives are:

- **Democratize Rigorous Decision Science**: Equip small store operators and multi-chain enterprises with the same advanced mathematical tools utilized by quantitative trading firms and corporate risk analysts (Multi-Criteria Decision Analysis, Expected Monetary Value, and 10,000-iteration Monte Carlo simulations).
- **Enrich Decisions with Verified Real-World Data**: Automatically cross-reference product queries with real-world databases—including **Open Food Facts** for FMCG groceries and **NPPA / CDSCO** regulatory registries for Indian pharmaceutical formulations.
- **Provide Visual Node-Based Decision Workflows**: Empower teams to model non-linear business decisions using an interactive drag-and-drop canvas with 26 modular nodes, reactive conditional execution, and real-time execution consoles.
- **Deliver Explainable Business Intelligence**: Eliminate black-box outputs by providing auditable reasoning chains, transparent financial spreadsheets, interactive 3D visualizations, and executive briefs.

```mermaid
graph TD
    A[Uncertain Business Inquiry] --> B[DMOC Natural Language Parser]
    B --> C[Verified Catalog & Regulatory Enrichment]
    C --> D[Historical Sales Velocity & Supplier Ledger]
    D --> E[Multi-Path Financial Simulation Engine]
    E --> F[Path A: Proposed Full Quantity]
    E --> G[Path B: Status Quo / Do Not Buy]
    E --> H[Path C: Risk-Calibrated Optimal Order]
    F & G & H --> I[Automated Visual Workflow Canvas]
    I --> J[Executive Decision Brief & Actionable PO]
```

---

## 2. Theoretical Foundations & Decision Science

DMOC is built upon established, peer-reviewed mathematical and statistical methodologies implemented in the core simulation engine ([decisionEngine.ts](file:///d:/fs%20project/backend/src/services/decisionEngine.ts)).

### 2.1 Multi-Criteria Decision Analysis (MCDA)
Multi-Criteria Decision Analysis evaluates competing alternatives across multiple orthogonal criteria, each assigned a relative priority weight $w_j$ such that:

$$\sum_{j=1}^m w_j = 100\% \quad (w_j > 0)$$

#### 1. Linear Normalization
Criteria can represent either **maximization** (e.g., net revenue, shelf velocity, supplier reliability) or **minimization** (e.g., wholesale cost, return rate, working capital risk). DMOC normalizes disparate units (currency amounts, days, ratings on 1–10 scales) into dimensionless utility values $r_{ij} \in [0, 1]$:

$$\text{For Maximization: } r_{ij} = \frac{x_{ij} - x_j^{\min}}{x_j^{\max} - x_j^{\min}}$$

$$\text{For Minimization: } r_{ij} = \frac{x_j^{\max} - x_{ij}}{x_j^{\max} - x_j^{\min}}$$

*Edge-case handling:* If $x_j^{\max} = x_j^{\min}$, DMOC assigns $r_{ij} = 1.0$ to prevent division-by-zero errors.

#### 2. Weighted Sum Model (WSM)
The composite aggregate performance score $S_i$ for each alternative $i$ is calculated as:

$$S_i = \sum_{j=1}^m w_j \cdot r_{ij}$$

The alternative with the highest aggregate score is designated as the mathematically dominant option.

---

### 2.2 Expected Monetary Value (EMV)
Under conditions of discrete uncertainty, each alternative $i$ produces a set of mutually exclusive potential outcomes $O_{ik}$, each associated with an empirical probability $P(O_{ik})$ and monetary payoff $X_{ik}$:

$$\text{EMV}_i = \sum_{k=1}^K P(O_{ik}) \cdot X_{ik} \quad \text{where } \sum_{k=1}^K P(O_{ik}) = 1.0$$

DMOC calculates the EMV spread across all alternatives to determine optimal risk-adjusted capital allocations.

---

### 2.3 Expected Utility Theory (von Neumann–Morgenstern)
In high-stakes retail environments, monetary value does not scale linearly with psychological satisfaction due to asymmetric downside risk aversion. For non-linear risk preferences, DMOC maps monetary payoffs or qualitative outcomes to utility values $U(O_{ik}) \in [0, 100]$:

$$\text{EU}_i = \sum_{k=1}^K P(O_{ik}) \cdot U(O_{ik})$$

---

### 2.4 Monte Carlo Stochastic Simulation
Real-world demand patterns, supplier delivery windows, and customer footfalls are stochastic rather than deterministic. DMOC executes up to **10,000 iterations** per scenario:

1. **Probability Distribution Sampling**: Draws samples across parameterized uniform, normal, or discrete distributions.
2. **Empirical Percentile Estimation**:
   - $P_{10}$ **(Pessimistic Downside)**: 90% confidence lower bound (stress-test scenario).
   - $P_{50}$ **(Median Expectation)**: Probabilistic midpoint representing expected baseline operations.
   - $P_{90}$ **(Optimistic Upside)**: High-demand ceiling under peak trading conditions.
3. **Statistical Moments**: Calculates mean return $\mu$, variance $\sigma^2$, and standard deviation $\sigma$.

---

### 2.5 Sensitivity Analysis & Tipping Points
DMOC systematically perturbs individual criterion weights $w_j$ from $0\%$ to $100\%$ while proportionately scaling other weights:

$$w_k' = w_k \cdot \frac{100\% - w_j'}{100\% - w_j} \quad \forall k \neq j$$

The engine detects **tipping points**—the exact numerical weight threshold where the leading business recommendation flips to a competing alternative.

---

## 3. Financial & Inventory Mechanics

Store decisions must distinguish between gross sales metrics and actual cash flow survival. DMOC executes the following core equations in every inventory and procurement decision:

### 3.1 Gross Profit vs. Net Profit Breakdown

$$\text{Gross Revenue} = \text{Units Sold} \times \text{Selling Price}$$

$$\text{Cost of Goods Sold (COGS)} = \text{Units Sold} \times \text{Purchase Price}$$

$$\text{Gross Profit} = \text{Gross Revenue} - \text{COGS}$$

$$\text{Gross Margin \%} = \left(\frac{\text{Gross Profit}}{\text{Gross Revenue}}\right) \times 100$$

To calculate **Net Profit**, DMOC apportions the business's real monthly operating expenses (store rent, electricity, logistics, staff wages, insurance) proportionally across operational working days and sales volume:

$$\text{Daily Operating Overhead} = \frac{\text{Monthly Operating Cost}}{30}$$

$$\text{Net Profit} = \text{Gross Profit} - \text{Allocated Overhead} - \text{Holding/Financing Costs}$$

$$\text{Net Margin \%} = \left(\frac{\text{Net Profit}}{\text{Gross Revenue}}\right) \times 100$$

> [!IMPORTANT]
> DMOC strictly distinguishes Gross Profit from Net Profit. Operating costs (rent, wages, and utilities) are never assumed to be zero.

---

### 3.2 Inventory Reorder Point (ROP) & Safety Stock

$$\text{Daily Sales Velocity } (V_d) = \frac{\sum_{t=1}^N \text{Units Sold in Day } t}{N}$$

$$\text{Lead Time Demand} = V_d \times \text{Supplier Lead Time (Days)}$$

$$\text{Safety Stock} = Z \times \sigma_{\text{lead}} \times \sqrt{\text{Lead Time}}$$

$$\text{Reorder Point (ROP)} = \text{Lead Time Demand} + \text{Safety Stock}$$

When stock on hand drops below ROP, DMOC triggers automated low-stock warnings and drafts procurement recommendations.

---

### 3.3 Working Capital Risk & Break-Even Quantity

$$\text{Capital Committed} = \text{Proposed Order Quantity} \times \text{Unit Wholesale Cost}$$

$$\text{Contribution Margin per Unit} = \text{Selling Price} - \text{Purchase Cost}$$

$$\text{Break-Even Units} = \left\lceil \frac{\text{Allocated Fixed Expense}}{\text{Contribution Margin per Unit}} \right\rceil$$

$$\text{Days of Inventory Remaining} = \frac{\text{Current Stock on Hand}}{V_d}$$

---

## 4. System Architecture & Monorepo Design

DMOC is architected as an enterprise TypeScript monorepo using npm workspaces, ensuring type safety from database query to UI rendering.

```
DMOC/
├── backend/                         # Node.js + Express + Prisma + SQLite/PostgreSQL
│   ├── prisma/
│   │   ├── schema.prisma           # Complete database schema (PostgreSQL target)
│   │   ├── schema.sqlite.prisma    # Embedded dev database schema
│   │   ├── migrations/             # Versioned SQL migration histories
│   │   └── seed.ts                 # Real-world retail & pharmacy seed records
│   ├── src/
│   │   ├── index.ts                # HTTP Server, Helmet, CORS, RateLimiter
│   │   ├── routes/                 # 18 modular REST controller files
│   │   ├── services/
│   │   │   ├── decisionEngine.ts            # Mathematical MCDA & EMV core
│   │   │   ├── inventoryDecisionEngine.ts   # 3-Path store procurement simulator
│   │   │   ├── productEnrichmentService.ts  # Open Food Facts & NPPA/CDSCO APIs
│   │   │   ├── demandForecastService.ts     # Velocity & seasonal trend forecaster
│   │   │   ├── workflowExecutor.ts          # 26-node DAG reactive workflow runtime
│   │   │   └── marketDataService.ts         # Economic indicators & inflation rates
│   │   └── middleware/             # Argon2 auth, JWT verification, audit trail
│   └── test/                       # Vitest integration & mathematical test suites
├── frontend/                        # React 18 + Vite + Tailwind CSS + @xyflow/react
│   ├── src/
│   │   ├── components/             # Reusable UI, Layout, WorkspaceSelector, 3D Tree
│   │   ├── context/                # AuthContext, BusinessContext, ThemeContext
│   │   ├── hooks/                  # useApi, useWorkflowStore (Zustand state engine)
│   │   ├── pages/                  # Dashboard, Wizard, Inventory, Workflows, Reports
│   │   ├── workflow/               # NodePalette, PropertiesPanel, ExecutionConsole
│   │   └── index.css               # Design system tokens, glassmorphism, responsive grid
│   └── package.json
└── shared/                          # @decisionos/shared monorepo library
    ├── src/
    │   └── index.ts                # Shared Zod validation schemas & TypeScript types
    └── package.json
```

---

### 4.1 Technology Stack Matrix

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + TypeScript | 18.3.1 | Component architecture with strict typing |
| **Build Tool** | Vite | 5.4.21 | Sub-second hot module reloading & optimized bundling |
| **Workflow Canvas** | `@xyflow/react` | 12.3.6 | Visual node graph, custom connection handles, smooth beziers |
| **3D Engine** | Three.js + React Three Fiber | 0.160.0 | Interactive 3D spatial decision trees with orbital camera |
| **State Management** | Zustand + Immer | 5.0.3 | Reactive canvas state, undo/redo stacks, persistent cache |
| **Styling & Design** | Tailwind CSS | 3.4.1 | Glassmorphism, custom typography (Outfit & Plus Jakarta Sans) |
| **Backend Runtime** | Node.js + Express | 20.x / 4.19 | REST API with async request pipelines |
| **Data Layer** | Prisma ORM | 5.10.2 | Auto-generated migrations, typed client, multi-engine support |
| **Embedded DB** | SQLite (`better-sqlite3`) | 3.x | Zero-config zero-latency local development environment |
| **Enterprise DB** | PostgreSQL | 15+ | High-concurrency relational cloud deployment target |
| **Authentication** | Argon2id + JWT | 0.40 / 9.0 | Memory-hard password hashing and dual-token rotation |
| **Spreadsheets** | `xlsx` (SheetJS) | 0.18.5 | Bidirectional Excel file parsing and binary report generation |

---

## 5. Data Architecture & Schema Reference

DMOC persists structured operational and analytical entities via Prisma. The schema supports multi-tenant workspace isolation, ensuring that sample demo data never pollutes actual transactions.

```mermaid
erDiagram
    User ||--o{ Business : owns
    Business ||--o{ Product : stocks
    Business ||--o{ Supplier : contracts
    Business ||--o{ StockMovement : audits
    Business ||--o{ SalesRecord : logs
    Business ||--o{ Decision : evaluates
    Business ||--o{ Workflow : automates
    Product ||--o{ StockMovement : tracks
    Product ||--o{ SalesRecord : records
    Decision ||--o{ Alternative : defines
    Decision ||--o{ Criterion : measures
    Decision ||--o{ Outcome : quantifies
    Decision ||--o{ Scenario : models
    Decision ||--o{ SimulationRun : archives
    Workflow ||--o{ WorkflowNode : places
    Workflow ||--o{ WorkflowEdge : wires
    Workflow ||--o{ WorkflowRun : executes
```

### 5.1 Primary Models

#### 1. `Business` (Store Profile & Workspace Context)
- `id`: UUID (Primary Key)
- `userId`: UUID (Owner reference)
- `name`: String (e.g., *"Arogya Medical Store"*, *"GreenValley Grocery"*)
- `type`: String (`retail`, `pharmacy`, `grocery`, `services`, `ecommerce`, `manufacturing`)
- `currency`: String (`INR`, `USD`, `EUR`, `GBP`)
- `monthlyRevenue`: Float (Baseline monthly turnover)
- `monthlyOperatingCost`: Float (Rent, wages, electricity, maintenance)
- `taxRate`: Float (Default GST / VAT percentage)
- `isSample`: Boolean (Flag separating demo workspaces from live records)

#### 2. `Product` (Catalog Item & Physical Inventory)
- `id`: UUID (Primary Key)
- `businessId`: UUID (Parent workspace)
- `name`: String (e.g., *"Crocin 650 Advance Tablet"*)
- `sku`: String (Stock keeping unit barcode)
- `category`: String (`Medicine`, `FMCG`, `Personal Care`, `Beverages`)
- `currentStock`: Integer (Units physically on shelf/warehouse)
- `minThreshold`: Integer (Reorder threshold)
- `purchasePrice`: Float (Wholesale cost from supplier)
- `sellingPrice`: Float (Retail price charged to customer)
- `shelfLifeDays`: Integer (Perishability horizon)
- `isPrescriptionRequired`: Boolean (Schedule H/H1 regulatory flag)
- `isPriceControlled`: Boolean (DPCO ceiling price flag)
- `regulatoryMaxPrice`: Float (Legal maximum retail price limit)

#### 3. `Decision` & `Workflow` (Analytical Models)
- Track structured alternatives, weighted criteria, discrete outcomes, Monte Carlo probability runs, visual nodes, edge wiring, and historical execution results with millisecond execution durations.

---

## 6. Natural Language Wizard & Real Data Ingestion

DMOC provides a natural language decision engine ([BusinessDecisionWizard.tsx](file:///d:/fs%20project/frontend/src/pages/wizard/BusinessDecisionWizard.tsx)) designed to parse intuitive questions submitted by store operators.

### 6.1 Natural Language Processing Pipeline
When a user asks:
> *"I own a medical store. Should I order 50 additional packs of Paracetamol 650mg before the weekend?"*

1. **Entity Extraction**:
   - `BusinessType`: `"pharmacy"`
   - `ProductName`: `"Paracetamol 650mg"`
   - `ProposedQuantity`: `50 units`
   - `TemporalHorizon`: `3 days (Weekend surge)`
2. **Catalog Auto-Match**: Checks the active workspace inventory. If found, retrieves current stock, current daily velocity, and supplier terms. If not found, triggers external enrichment.

---

### 6.2 External Data Integration Engine

```mermaid
sequenceDiagram
    participant User
    participant Wizard as DMOC Decision Wizard
    participant Catalog as Product Enrichment Service
    participant OFF as Open Food Facts API
    participant CDSCO as NPPA / CDSCO DPCO Database
    participant Engine as 3-Path Simulation Engine

    User->>Wizard: Submits plain English decision inquiry
    Wizard->>Catalog: Request verification for "Paracetamol 650mg"
    alt Is Pharmaceutical Item
        Catalog->>CDSCO: Query Schedule H ceiling & DPCO MRP caps
        CDSCO-->>Catalog: Ceiling price INR 2.30/tab, Schedule H = true
    else Is Packaged Grocery Item
        Catalog->>OFF: Query Barcode, Ingredients, NutriScore
        OFF-->>Catalog: Product verified, category FMCG
    end
    Catalog-->>Wizard: Return verified regulatory & pricing payload
    Wizard->>Engine: Run 3-Path financial & stockout simulation
    Engine-->>Wizard: Return Path A, Path B, and Path C models
    Wizard-->>User: Display interactive comparative report
```

1. **Open Food Facts Integration**:
   - Real-time querying across millions of FMCG products for barcode verification, brand validation, pack sizes, and categories.
   - Strictly respects rate-limiting headers and user-agent attribution.
2. **NPPA / CDSCO Regulatory Engine**:
   - Compares medicine prices against official National Pharmaceutical Pricing Authority (NPPA) ceiling caps.
   - Prevents store owners from configuring illegal selling prices exceeding statutory maximums.
   - Flags CDSCO Schedule H and H1 medicines requiring audited prescription logging.

---

### 6.3 The 3-Path Simulation Model

| Feature | Path A: Proposed Order | Path B: Status Quo (Do Nothing) | Path C: Calibrated Optimal |
| :--- | :--- | :--- | :--- |
| **Order Quantity** | User's requested amount (e.g., 50 units) | 0 units | Mathematically optimal (e.g., 28 units) |
| **Capital Committed** | Full wholesale cash expenditure | ₹0.00 cash outlay | Minimized capital outlay |
| **Stockout Risk** | Near 0% probability | High risk (stock exhausts before Monday) | Zero stockout probability |
| **Capital Risk** | Risk of unsold stock & holding cost | Zero inventory risk | Balanced holding vs demand |
| **Net Financial Gain** | ₹1,450 projected net margin | ₹0 (forfeited margin on lost sales) | ₹1,820 maximized risk-adjusted net |

---

## 7. The Visual Node-Based Decision Workflow Canvas

DMOC contains a reactive visual workflow builder powered by `@xyflow/react` and Zustand. Users can drag logic, math, and data blocks onto a canvas, wire handles, and trigger instant simulation runs.

```
+----------------------------------------------------------------------------------------------------+
| DMOC Decision Canvas | [Medical Restock Workflow] | [Validate] [Run Flow] [Save] [Export] [Theme]  |
+----------------------------------------------------------------------------------------------------+
|  NODE PALETTE   |                                                                  |  PROPERTIES   |
|  (26 Nodes)     |                        WORKFLOW CANVAS GRID                      |  PANEL        |
|                 |                                                                  |               |
|  [Triggers]     |     +-------------------+          +----------------------+      | Node Title:   |
|  - Manual Trig  |     | [>] Manual Trig   |          | [?] If / Else        |      | Stockout Test |
|  - Ingestion    |     | ID: trg-01        |--------->| Stock < MinThreshold |      |               |
|                 |     +-------------------+          +----------+-----------+      | Expression:   |
|  [Calculations] |                                      (true)   |   (false)        | stock < 15    |
|  - MCDA Score   |                                         |     |                  |               |
|  - Monte Carlo  |                                         v     v                  | Output Path:  |
|  - EMV Payoff   |                              +------------+ +------------+       | True -> Reord |
|                 |                              | [~] MCDA   | | [x] End    |       |               |
|  [Outputs]      |                              | Calibrate  | | No Action  |       | [Update Node] |
|  - Executive PO |                              +------------+ +------------+       |               |
+----------------------------------------------------------------------------------------------------+
|  EXECUTION DRAWER: [Run #8f2a1b9c] Status: COMPLETED | 4/4 Nodes Executed | Runtime: 14ms          |
+----------------------------------------------------------------------------------------------------+
```

### 7.1 Complete 26-Node Catalogue Across 7 Categories

#### Category 1: Triggers
1. `start_decision`: Execution entrypoint for automated pipelines.
2. `manual_trigger`: User-initiated button trigger directly inside the canvas.
3. `import_spreadsheet`: Ingests tabular data directly from `.xlsx` files.
4. `existing_decision`: Loads a historical decision model from the database.

#### Category 2: Decision Inputs
5. `decision_question`: Formal statement of the dilemma or inquiry.
6. `alternative`: Defines candidate mutually exclusive options.
7. `define_criteria`: Establishes qualitative or quantitative measurement parameters.
8. `set_criteria_weights`: Sliders assigning percentage priorities totaling 100%.
9. `define_constraints`: Hard boundaries (e.g., maximum budget cap, regulatory restrictions).
10. `set_assumptions`: Baseline boundary conditions (e.g., expected inflation rate).

#### Category 3: Logic & Control Flow
11. `if_else`: Conditional branching based on JavaScript-style expressions (`value > threshold`).
12. `compare_values`: Relational comparison (`==`, `!=`, `>`, `<`, `>=`, `<=`) between two inputs.
13. `threshold_check`: Triggers warning alerts when a variable crosses a danger limit.
14. `and_or_conditions`: Multi-gate logical evaluations (AND/OR).
15. `filter_alternatives`: Excludes candidate options failing hard constraints.
16. `merge_branches`: Converges parallel logic branches into a unified stream.

#### Category 4: Outcomes & Probabilities
17. `possible_outcome`: Attaches discrete outcomes to alternatives.
18. `probability`: Explicit decimal likelihood $[0, 1.0]$.
19. `cost`: Itemizes wholesale cost, transport fees, or holding costs.
20. `benefit`: Projects gross sales revenue or qualitative utility gain.
21. `risk_assessment`: Qualitative risk tiering (`low`, `medium`, `high`, `critical`).
22. `time_estimate`: Duration for supplier delivery or product shelf-life.
23. `custom_metric`: Custom user-defined KPI (e.g., Customer Loyalty Index).

#### Category 5: Mathematical Calculations
24. `weighted_score`: Executes Multi-Criteria Decision Analysis (MCDA).
25. `expected_monetary_value`: Calculates probability-weighted EMV payoffs.
26. `monte_carlo`: Executes 10,000 stochastic pseudo-random iterations.

---

## 8. Store Operations & Decision Suite

DMOC integrates daily operational tools with mathematical decision modeling:

### 8.1 Inventory & Catalog Management
- **Batch & Expiry Monitoring**: Automatic tracking for perishable items. Items expiring within 30 days are flagged with yellow warning badges; items expiring within 7 days trigger red emergency markdown alerts.
- **Stock Movement Ledger**: Complete audit logging of all stock receipts, customer sales, inventory write-offs, and transfers.

### 8.2 Supplier Management & Terms
- Tracks supplier catalogs, lead times (in days), payment terms (e.g., Net 30, COD), and minimum order quantities (MOQ).
- Automatically calculates whether an order qualifies for bulk supplier discount tiers.

### 8.3 The 3D Decision Tree & 2D Fallback
- **Three.js 3D Tree**: Visualizes decisions as hierarchical spatial structures with orbital camera controls, interactive node expansion, and color-coded risk paths.
- **2D Canvas Fallback**: Provides resilient SVG rendering for low-powered mobile devices or environments with disabled WebGL.

---

## 9. Comprehensive RESTful API Reference

All DMOC API endpoints return standardized JSON payloads adhering to:
`{ success: true, data: { ... } }` or `{ success: false, error: { code, message } }`.

### 9.1 Authentication & Workspace Endpoints
- `POST /api/auth/register`: Create user account (Argon2id password hashing).
- `POST /api/auth/login`: Authenticate and receive JWT access token and HTTP-only session cookie.
- `POST /api/auth/logout`: Revoke session and clear cookies.
- `GET /api/businesses`: List all businesses accessible by the authenticated user.
- `POST /api/businesses`: Create a new business workspace profile.
- `GET /api/businesses/:id/kpis`: Real-time calculation of revenue, profit, stockouts, and inventory value.

### 9.2 Products & Inventory Endpoints
- `GET /api/products`: Retrieve workspace catalog with search, category, and low-stock filters.
- `POST /api/products`: Add new product to catalog.
- `GET /api/products/search-enrichment`: Query Open Food Facts and NPPA regulatory registries.
- `POST /api/inventory/movements`: Record stock addition, adjustment, or write-off.

### 9.3 Decision & Simulation Endpoints
- `POST /api/inventory-decisions/evaluate`: Process natural language inquiry and return Path A/B/C simulation.
- `POST /api/simulations/run`: Execute 10,000-iteration Monte Carlo simulation.
- `GET /api/workflows`: List visual decision workflows.
- `POST /api/workflows/:id/run`: Execute DAG visual workflow and return node-by-node execution logs.
- `GET /api/import-export/template`: Download standard `dmoc-template.xlsx`.
- `GET /api/import-export/export-all`: Export full business database to encrypted Excel workbook.

---

## 10. End-to-End User Operating Manual

### Step 1: Account Creation & Onboarding
1. Navigate to the DMOC homepage and click **Get Started**.
2. Complete the 4-step Business Onboarding Wizard:
   - **Step 1: Business Identity**: Enter business name (e.g., *"Metro Pharmacy"*) and business type (`pharmacy`, `grocery`, `retail`).
   - **Step 2: Location & Currency**: Select local operating currency (`INR ₹`, `USD $`, `EUR €`) and standard tax percentage.
   - **Step 3: Financial Baseline**: Enter estimated monthly revenue and fixed overhead expenses (store rent, electricity, salaries).
   - **Step 4: Sample Data Option**: Choose whether to seed realistic sample inventory to explore platform features immediately.

### Step 2: Running a Restock Decision in Plain English
1. Click **Decision Wizard** in the primary navigation.
2. In the natural language prompt box, type your decision dilemma:
   > *"Should I order 40 units of Almond Milk before Friday?"*
3. Click **Analyze Business Decision**.
4. DMOC automatically extracts the product, verifies wholesale pricing, calculates shelf velocity, and renders the 3-Path comparative table.
5. Review the recommended order quantity in **Path C** to minimize capital lockup while preventing stockouts.
6. Click **Convert to Visual Workflow** to inspect the computational graph on the canvas.

### Step 3: Customizing and Executing Visual Workflows
1. In the **Workflow Canvas**, drag additional nodes from the left palette (e.g., `Risk Assessment` or `If/Else`).
2. Connect the output handle of the `Proposed Order` node to the input handle of the `Threshold Check` node.
3. Configure threshold conditions in the right-side **Properties Panel**.
4. Click **Run Flow** in the top navigation bar.
5. View step-by-step execution times and output payloads in the bottom **Execution Drawer**.

### Step 4: Generating Reports & Exporting Data
1. Navigate to the **Reports** page.
2. Select any evaluated decision to view the **DMOC Executive Brief**.
3. Click **Print / Save as PDF** to generate clean, page-formatted printable reports.
4. Click **Export Data** in Settings to download full Excel audits (`dmoc-export-*.xlsx`).

---

## 11. Security, Audit Logging & Compliance

- **Password Security**: Passwords are encrypted using Argon2id with recommended memory cost (65,536 KB), time cost (3 iterations), and parallelism (4 threads). Plaintext passwords are never logged or stored.
- **Session Protection**: Dual-token architecture using short-lived JWT access tokens (15 minutes) and cryptographically signed refresh tokens stored in secure, `SameSite=Lax`, `HttpOnly` cookies.
- **Immutable Audit Trail**: All business profile modifications, inventory write-offs, workflow executions, and data exports record user IDs, IP addresses, user agents, and timestamps in an append-only `AuditEvent` database table.
- **Data Sovereignty**: Users retain complete intellectual property and ownership over all uploaded catalogs and models. Data can be exported or permanently deleted at any time through account settings.

---

## 12. Deployment, Troubleshooting & FAQ

### 12.1 Quickstart Local Development

```bash
# 1. Clone repository
git clone https://github.com/hardik33217/DMOC.git
cd DMOC

# 2. Install dependencies across all workspaces
npm install

# 3. Setup environment configuration
cp backend/.env.example backend/.env

# 4. Generate Prisma Client & apply database migrations
npm --prefix backend run prisma:migrate:dev

# 5. Start unified development servers
npm run dev
```
Frontend runs at `http://localhost:5173`  
Backend API runs at `http://localhost:3002`

---

### 12.2 Docker Production Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://dmoc_admin:secret@postgres:5432/dmoc_db?schema=public
    depends_on:
      - postgres
  frontend:
    build: ./frontend
    ports:
      - "80:80"
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=dmoc_admin
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=dmoc_db
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

---

### 12.3 Frequently Asked Questions (FAQ)

**Q: Can I use DMOC without an internet connection?**  
A: Yes. When offline, DMOC relies on local database records and internal velocity algorithms. External catalog searches (Open Food Facts) will queue or use local fallback values.

**Q: Does DMOC sell or share my store sales numbers?**  
A: No. DMOC enforces strict tenant isolation. Your sales figures, wholesale costs, and margins are stored exclusively in your database workspace and are never shared or monetized.

**Q: How does DMOC prevent stockouts during demand spikes?**  
A: The demand forecasting service incorporates seasonal velocity multipliers, lead-time variance buffers, and safety stock calculations to dynamically adjust reorder points ahead of anticipated trading surges.

---

*© 2024–2026 DMOC (Decision Marketing Operating System). All rights reserved.*  
*Authored by the DMOC Core Engineering & Decision Science Team.*
