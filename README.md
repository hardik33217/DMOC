# DMOC — Decision Marketing Operating System

> **Tagline:** *"Know the risk. Understand the opportunity. Decide with evidence."*

DMOC (Decision Marketing Operating System) helps store owners, entrepreneurs, and business managers understand the potential financial and operational consequences of a business decision before committing money. 

The initial focus is small and medium-sized stores, grocery shops, pharmacies, convenience stores, and quick-commerce businesses, with built-in support for startups, students learning entrepreneurship, retailers, and larger enterprises.

---

## Key Capabilities (Phases 1 — 15)

### 1. Multi-Business Workspaces & Onboarding
- **Clean 4-Step Onboarding Wizard**: Answers the 9 core business questions (business type, planned vs. existing, location, business model, categories, currency/tax, monthly revenue/costs, existing data availability).
- **Multi-Business Support**: Switch between multiple store profiles or workspaces with a single click.
- **Learning & Enterprise Modes**: Dedicated learning mode for students and entrepreneurs, and enterprise controls for multi-location teams.
- **Strict Separation of Sample Data**: Realistic demo workspaces (e.g., *Arogya Medical Store*, *FreshMart Grocery*) are explicitly tagged with `isSample: true` and never pollute real user transactions.

### 2. Business Dashboard & Dynamic Workspace
- Real-time KPIs calculated from verified database state:
  - **Revenue & Gross Profit**: Filtered by active workspace currency and tax configurations.
  - **Estimated Net Profit**: With operating costs and fixed overhead clearly itemized.
  - **Inventory Value & Cash Tied Up**: Stock on hand evaluated against verified unit purchase costs.
  - **Stockout & Low Stock Alerts**: Immediate warning when inventory drops below computed reorder thresholds.
  - **Near-Expiry Inventory**: Automated tracking for perishable groceries and pharmaceutical batches expiring within 30 days.
  - **Decisions & Scenarios**: Live counters for decisions awaiting review, recent simulation runs, and reports.

### 3. Universal Natural-Language Decision Wizard
- Ask business questions in ordinary language:
  > *"I own a medical store. Should I order 20 additional packs of a particular pain-relief product before the weekend?"*
  > 
  > *"I own a grocery shop. Should I buy 50 extra packs of a popular snack before the weekend?"*
- **Intelligent Parsing**: Automatically extracts business context, product name, proposed quantity, and timeline.
- **Auto-Enrichment**: Matches products against real-world catalogs, fetches existing stock on hand, historical velocity, and preferred supplier terms.
- **3-Path Simulation**: Evaluates **Path A** (Proceed), **Path B** (Do Not Proceed), and **Path C** (Recommended Alternative Quantity).
- **One-Click Workflow Generation**: Automatically builds an editable visual decision workflow on the canvas.

### 4. Real Product Search & Verified Regulatory Data
- **Packaged Grocery & FMCG**: Integrated with **Open Food Facts API** for product barcodes, brands, categories, pack sizes, and ingredients, respecting rate limits and attribution.
- **Medicines & Pharmacy**: Integrated with official **NPPA (National Pharmaceutical Pricing Authority)** DPCO price ceilings and **CDSCO** Schedule H/H1 prescription rules.
- **Mandatory Medical Disclaimer**: Prominently notes that DecisionOS evaluates lawful business inventory purchasing decisions only and never provides medical treatment advice.
- **Field-Level Provenance**: Displays match confidence, data verification badges, source URLs, and retrieval timestamps. Unverified items display explicit warnings.

### 5. Product & Inventory Management
- **Catalog & Unit Conversions**: Full support for items sold individually or in multi-unit packs (e.g., strips of 15 tablets, cartons of 24 snacks) without double-counting margins.
- **Atomic Stock Movements**: Restock, sale, adjustment, and spoilage/waste movements recorded inside ACID transactions.
- **Supplier Directory & Quotes**: Track lead times, minimum order quantities (MOQ), payment terms, and preferred vendors.
- **Excel & CSV Import/Export**: Bulk import products and suppliers with preview, validation, and error reporting.

### 6. Sales History & Statistical Demand Forecasting
- **Empirical Sales Velocity**: Normalizes daily sales over effective operating days.
- **Stockout-Suppressed Demand Correction**: Flags zero-sales days caused by stockouts to prevent artificial depression of sales forecasts.
- **Replenishment Parameters**: Calculates lead-time demand, recommended safety stock, and Reorder Points (ROP) at specified service levels (e.g., 95%).
- **Forecast Uncertainty**: Generates conservative, base, and optimistic demand projections with transparent assumptions and model limitations.

### 7. 3-Path Business Decision Simulation Engine
- For every proposed purchase or expansion, calculates:
  - Working capital outlay and cash flow impact.
  - Expected sales and revenue over the planning horizon.
  - Holding costs and perishable expiry/spoilage risk.
  - Lost contribution margin from stockouts under the "do not proceed" path.
  - Break-even sales quantity.
  - Best-case, base-case, and worst-case scenario distributions.
  - Sensitivity to demand drops (-25%), demand surges (+25%), and wholesale cost increases (+10%).

### 8. Interactive Visual Decision Canvas (n8n / Node-RED Style)
- Visual drag-and-drop workflow builder (`@xyflow/react v12`) with 26+ decision nodes, custom bezier edges, and real-time execution engine.
- **17 Specialized Business Decision Nodes**:
  - `business_profile`, `product_lookup`, `source_verification`, `inventory_snapshot`, `sales_history`, `supplier_quote`, `proposed_purchase`, `demand_forecast`, `stockout_risk`, `expiry_risk`, `cost_margin`, `cash_flow`, `scenario_branch`, `best_base_worst`, `break_even`, `compare_quantities`, `report_output`.

### 9. Store-Owner Decision Reports & Exports
- Plain-language executive briefs designed for store owners without technical or financial backgrounds.
- Clearly states: Decision question, recommended action, financial trade-offs between Path A, B, and C, cash tied up, risk factors, and next steps.
- **PDF Print & Excel Exports**: Formatted for physical printouts and spreadsheet audit trails.

---

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons
- **Workflow Canvas**: `@xyflow/react` v12 with custom node renderers
- **Data Visualization**: Recharts + Three.js / React Three Fiber (3D Decision Trees)
- **State Management**: TanStack React Query + React Context (`BusinessContext`, `ThemeContext`, `AuthContext`)
- **Testing**: Vitest + React Testing Library (100% passing)

### Backend
- **Server**: Node.js + Express + TypeScript (`tsx watch`)
- **Database & ORM**: PostgreSQL / SQLite dev database with Prisma ORM
- **Security**: JWT authentication, Argon2 password hashing, business-level access control middleware
- **External Integrations**: Open Food Facts API, NPPA DPCO Pricing Guidelines, CDSCO Regulatory Drug Lists
- **Spreadsheet Processing**: SheetJS (`xlsx`) for import/export
- **Testing**: Vitest (100% passing across unit and integration test suites)

---

## Quick Start

### 1. Prerequisites
- Node.js 20+
- npm or pnpm
- Docker (optional, for PostgreSQL in production)

### 2. Install Dependencies
```bash
# Install root and workspace dependencies
npm install
```

### 3. Database Setup & Migrations
```bash
cd backend
# Push Prisma schema to database and generate client
npx prisma db push
npx prisma generate
```

### 4. Run Development Servers
```bash
# From workspace root — starts backend on port 3002 and frontend on port 5173
npm run dev
```

- Frontend App: `http://localhost:5173`
- Backend API: `http://localhost:3002/api`
- API Health Check: `http://localhost:3002/api/health`

### 5. Demo Credentials
Log in with the pre-seeded account:
- **Email:** `demo@decisionos.com`
- **Password:** `Password123!`

---

## Running Automated Test Suites

### Backend Unit & Integration Tests (13/13 passing)
```bash
npm test --workspace=backend
```
Covers:
- `productEnrichmentService.test.ts`: Open Food Facts, NPPA medicine ceilings, Schedule H prescription checks, and unverified data handling.
- `demandForecastService.test.ts`: Sales velocity, stockout normalization, safety stock, and ROP calculations.
- `inventoryDecisionEngine.test.ts`: 3-path simulation logic, holding costs, perishable risk, and break-even points.
- `decisionEngine.test.ts`: MCDA, weighted sum scoring, normalization, and Monte Carlo simulations.

### Frontend Unit & Component Tests (9/9 passing)
```bash
npm test --workspace=frontend
```

### End-to-End Business Decision Intelligence Test
```bash
node backend/test-all-business-intelligence.mjs
```
Validates the complete 15-phase pipeline: authentication, multi-business workspace creation, sample data seeding, dashboard metrics, Open Food Facts/NPPA enrichment, inventory catalog and movements, demand forecasting, natural-language wizard parsing, 3-path simulation, automated visual workflow graph generation, and decision report persistence.

---

## API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | Authenticate user & issue JWT |
| `/api/businesses` | GET, POST | List and create business workspaces |
| `/api/businesses/:id/dashboard-metrics` | GET | Calculate live KPIs (revenue, margins, stockouts, expiry) |
| `/api/businesses/:id/seed-sample` | POST | Seed realistic benchmark store data (`isSample: true`) |
| `/api/products` | GET, POST | Manage product catalog & unit/pack sizes |
| `/api/products/search-external` | GET | Search Open Food Facts & NPPA/CDSCO databases |
| `/api/inventory/movements` | GET, POST | Record atomic stock movements (`purchase`, `sale`, etc.) |
| `/api/sales` | GET, POST | Record sales transactions |
| `/api/sales/forecast/:productId` | GET | Run statistical demand forecast with stockout normalization |
| `/api/inventory-decisions/parse-wizard` | POST | Parse natural-language decision question |
| `/api/inventory-decisions/simulate` | POST | Run 3-path simulation (Path A, B, C) |
| `/api/inventory-decisions/generate-workflow` | POST | Generate editable visual node graph in canvas |
| `/api/inventory-decisions/save-report` | POST | Save decision report |
| `/api/inventory-decisions/reports` | GET | List decision reports for a business workspace |
| `/api/workflows` | GET, POST | Node-based visual decision workflow management |
| `/api/workflows/:id/runs/run` | POST | Execute visual workflow graph through execution engine |

---

## Regulatory and Provenance Principles
1. **Never Fabricate Data**: Real-world prices, regulatory lists, and supplier costs are clearly attributed to source providers or marked as unverified.
2. **Medical Disclaimers**: DecisionOS explicitly handles inventory and purchasing logistics. It does not provide medical treatment advice, nor does it assume interchangeability between similarly named pharmaceutical formulations.
3. **Transparent Assumptions**: Missing costs or parameters are explicitly surfaced to the user rather than silently assumed to be zero.