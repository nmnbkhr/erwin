# BAIW — Banking Analytics Intelligence Workbench

## What You're Building

A professional React web application called **BAIW** that integrates banking data model metadata, capability frameworks, maturity assessments, and Pakistan banking context into a single interactive consulting workbench.

**The Problem It Solves:** A banking consultant sits with a client and needs to answer: "Which data entities do we need to build customer profitability analytics?" or "What's our maturity gap in regulatory reporting?" or "Show me the roadmap from current state to target state." Today this requires flipping through 16 PowerPoint decks and multiple spreadsheets. BAIW puts it all in one searchable, navigable, interactive application.

## Data Sources

The app consumes pre-processed outputs from a banking data model analysis project (github.com/nmnbkhr/erwin). The repo contains:

### Source Data (to be converted to JSON for the app)

```
FROM fsdm_output/ (FSDM v16 Financial Services Data Model analysis):
  fsdm_entity_catalog.csv     — 3,917 entities (name, domain, description)
  fsdm_relationships.csv      — 5,636 parent→child relationships
  fsdm_data_dictionary.csv    — 15,364 attributes (entity, attr, datatype)
  fsdm_domain_map.json        — entity→domain classification (16 domains)
  fsdm_inheritance_tree.json  — 839 inheritance chains

FROM bvf_fsdm_output/ (BVF integration analysis):
  bvf_capability_summary.csv         — 112 sub-capabilities (theme, group, sub, dataReqCount)
  bvf_data_requirements.csv          — 113 data requirements with FSDM subject area mappings
  bvf_to_fsdm_entity_mapping.csv     — 360 BVF requirement → FSDM entity mappings
  capability_fsdm_dependencies.csv   — 5,218 capability→FSDM entity dependencies
  fsdm_entity_reuse_scores.csv       — 219 entities ranked by reuse (P1/P2/P3/P4 tiers)
  bvf_reuse_matrix.csv               — 112×112 capability similarity matrix
  data_lineage.json                  — 23 column-level data lineage entries
  profitability_star_schema_enhanced.sql — Star schema DDL (1 fact + 7 dims + 2 aggs)
  fsdm_gap_extensions.sql            — 21 new tables across 5 gap modules
  pakistan_banking_context.md         — Pakistan implementation context

FROM BACR Excel:
  793 maturity assessment questions across 9 categories
```

### IMPORTANT: Generate Realistic Sample Data

Since the repo CSV files may not be present at build time, you MUST generate realistic sample data that matches these EXACT numbers from the project. This sample data will be used for development and demo. When real CSV files are available, users run `prepare_data.py` to replace sample data with real data.

**Exact numbers to match:**

| Metric | Value |
|--------|-------|
| FSDM Entities | 3,917 |
| FSDM Attributes | 15,364 |
| FSDM Relationships | 5,636 |
| FSDM Domains | 16 |
| BVF Themes | 3 (Marketing & CX, Finance & PM, Product Management) |
| BVF Capability Groups | 12 |
| BVF Sub-Capabilities | 112 |
| BVF Data Requirements | 113 |
| BVF→FSDM Entity Mappings | 360 |
| Capability→FSDM Dependencies | 5,218 |
| Reuse-Scored Entities | 219 (53 P1-critical) |
| Star Schema Tables | 11 (1 fact + 7 dim + 2 agg + 1 geo) |
| Gap Extension Tables | 21 across 5 modules |
| BACR Questions | 793 across 9 categories |
| Data Lineage Entries | 23 |

**16 FSDM Domains with entity counts:**

```json
[
  {"name": "Party Management", "count": 622, "desc": "Customer, organization, individual, roles, relationships, KYC"},
  {"name": "Agreement & Account", "count": 506, "desc": "Deposit accounts, lending facilities, card agreements, terms"},
  {"name": "Classification & Reference", "count": 543, "desc": "Code tables, reference data, lookups, enumerations"},
  {"name": "Product Management", "count": 209, "desc": "Banking products, features, pricing, product lifecycle"},
  {"name": "Financial Instrument", "count": 187, "desc": "Securities, derivatives, government bonds, money market"},
  {"name": "Transaction", "count": 156, "desc": "Payments, transfers, settlements, reversals"},
  {"name": "Location & Geography", "count": 143, "desc": "Branches, ATMs, regions, countries, addresses"},
  {"name": "Market Data", "count": 128, "desc": "Interest rates, FX rates, indices, benchmarks"},
  {"name": "General Ledger", "count": 115, "desc": "GL accounts, journal entries, postings, balances"},
  {"name": "Risk Management", "count": 98, "desc": "Credit risk, market risk, operational risk, IFRS 9"},
  {"name": "Regulatory & Compliance", "count": 87, "desc": "Regulatory reports, KYC, AML, CTR/STR"},
  {"name": "Channel", "count": 76, "desc": "Branch, ATM, mobile banking, internet banking, agent"},
  {"name": "Event & Calendar", "count": 65, "desc": "Business events, calendar, holidays, milestones"},
  {"name": "Campaign & Marketing", "count": 42, "desc": "Campaigns, offers, target lists, responses"},
  {"name": "Document & Content", "count": 38, "desc": "Documents, reports, correspondence, templates"},
  {"name": "Other", "count": 902, "desc": "Cross-domain entities, utilities, metadata"}
]
```

**12 BVF Capability Groups (organized under 3 themes):**

```json
{
  "Marketing & Customer Experience": [
    {"group": "Customer Information & Insight Analytics", "subCount": 12, "desc": "Single customer view, segmentation, behavior analytics"},
    {"group": "Customer Lifecycle Management", "subCount": 10, "desc": "Acquisition, onboarding, growth, retention, win-back"},
    {"group": "Customer Interaction Management", "subCount": 9, "desc": "Campaign management, channel optimization, NBA/NBO"},
    {"group": "Marketing & CX Use Cases", "subCount": 11, "desc": "Cross-sell, upsell, churn prediction, CLV"}
  ],
  "Finance & Performance Management": [
    {"group": "Accounting Operations & Close", "subCount": 10, "desc": "GL, sub-ledger, reconciliation, close process"},
    {"group": "Enterprise Performance Management", "subCount": 8, "desc": "Profitability, ABC, RAROC, budgeting, KPIs"},
    {"group": "Treasury Insight & Management", "subCount": 5, "desc": "ALM, liquidity, cash flow, reserve portfolio"},
    {"group": "Financial Reporting", "subCount": 7, "desc": "Regulatory returns, management reports, dashboards"},
    {"group": "Finance Use Cases", "subCount": 12, "desc": "Applied finance analytics use cases"}
  ],
  "Product Management": [
    {"group": "Product Development", "subCount": 9, "desc": "New product research, prototyping, testing"},
    {"group": "Product Performance", "subCount": 10, "desc": "Product profitability, cross-channel, retention"},
    {"group": "Product Use Cases", "subCount": 9, "desc": "Card spend stimulation, pricing, new-to-lending"}
  ]
}
```

**9 BACR Categories:**
```
Business (Strategy, Summary, Priorities) — ~120 questions
Culture (Organization, Skills, Change) — ~80 questions
Governance (Data Governance, Metadata) — ~95 questions
Information (Data Quality, Integration) — ~110 questions
Applications (BI, Analytics, Visualization) — ~90 questions
Systems (Architecture, Infrastructure) — ~85 questions
Agility (Speed, Automation, Self-Service) — ~70 questions
Outcomes (Business Impact, ROI, Value) — ~75 questions
Overall Assessment — ~68 questions
```

**Star Schema (Profitability Engine):**
```
FACT TABLE:
  FACT_CUSTOMER_PROFITABILITY — 35+ measures including:
    gross_interest_income, interest_expense, net_interest_income,
    ftp_adjustment, ftp_adjusted_nii, fee_commission_income,
    fx_income, other_income, total_income, direct_cost,
    abc_allocated_cost, operating_profit, ifrs9_ecl_provision,
    profit_before_tax, capital_charge_amount, economic_profit_eva,
    rwa_amount, raroc_pct

DIMENSIONS (7):
  DIM_CUSTOMER — cnic, segment, islamic_flag, onboarding_date, kyc_status
  DIM_PRODUCT — product_type, islamic_mode_cd, pricing_method, sbp_product_code
  DIM_BRANCH — sbp_branch_code, region, province, branch_type, is_islamic
  DIM_BUSINESS_SEGMENT — retail, corporate, commercial, sme, agriculture, islamic, treasury
  DIM_CHANNEL — branch, atm, mobile, internet, agent, raast, call_center
  DIM_TIME — pakistan_fiscal_year (jul-jun), islamic_calendar, quarter, month
  DIM_AGREEMENT — agreement_type, ifrs9_stage, sbp_classification, collateral_type

AGGREGATES (2):
  AGG_BRANCH_PROFITABILITY
  AGG_SEGMENT_PROFITABILITY

VIEWS (3):
  VW_CUSTOMER_PL — Customer-level P&L
  VW_PRODUCT_PL — Product-level P&L
  VW_ISLAMIC_VS_CONVENTIONAL — Islamic vs conventional comparison
```

**5 Gap Extension Modules:**
```
GAP 1: Activity Based Costing (6 tables) — COST_POOL, ACTIVITY, COST_DRIVER, COST_ALLOCATION_RULE, COST_ALLOCATION_RESULT, ACTIVITY_RATE
GAP 2: Customer Lifetime Value (3 tables) — CLV_MODEL, CUSTOMER_LIFETIME_VALUE, CLV_SCENARIO
GAP 3: Budgets & Forecasts (4 tables) — BUDGET, BUDGET_LINE_ITEM, FORECAST_VERSION, KPI_TARGET
GAP 4: Business Process Management (4 tables) — BUSINESS_PROCESS, PROCESS_STEP, PROCESS_INSTANCE, PROCESS_STEP_INSTANCE
GAP 5: Operational Metrics (4 tables) — OPERATIONAL_METRIC_TYPE, OPERATIONAL_METRIC_VALUE, CHANNEL_OPERATIONAL_METRIC, BRANCH_OPERATIONAL_METRIC
```

## Tech Stack

```
Framework:  React 18 + TypeScript
Build:      Vite
Styling:    Tailwind CSS (utility classes — NO custom CSS files)
Routing:    React Router v6
Charts:     Recharts (bar, donut/pie, radar, treemap)
Graph:      D3.js (force-directed network graph)
Icons:      Lucide React
State:      React Context + useReducer (for assessment persistence)
Storage:    localStorage (assessment progress, user preferences)
```

## Application Structure — 8 Modules

### Module 1: DASHBOARD (`/`)

Stats ribbon at top: 4 cards showing key numbers (3,917 entities | 112 capabilities | 793 questions | 16 domains).

Below — 2×2 grid:
- **Top-left:** Donut chart of entities by domain (top 8 + "Other"). Use Recharts PieChart.
- **Top-right:** Horizontal bar chart of capabilities by theme (3 bars, color-coded).
- **Bottom-left:** Pakistan Banking Metrics card — key facts (PKR 35T assets, 33 banks, 16K branches, 17.5% SBP rate, 47% CASA ratio, 7.5% NPL).
- **Bottom-right:** Top 10 Most Reused FSDM Entities bar chart (from reuse scores — Party, Individual, Organization_Unit, Agreement, Account etc. with reuse counts).

### Module 2: FSDM MODEL EXPLORER (`/model`)

Three-panel layout:
- **Left (280px):** Collapsible domain tree. 16 domains, each expandable to show entities (show first 50, "Load more" button). Entity count badges. Domain colored dot.
- **Center:** Selected entity detail card — name (large), domain badge, description, attribute count. Below: attributes table (name, datatype, nullable — virtual scroll if >50 rows). Below: relationships section (Parents and Children as clickable pills).
- **Right (260px):** "Used By Capabilities" panel — lists BVF capabilities that depend on this entity (from dependencies data). Shows reuse tier badge (P1=red, P2=orange, P3=yellow, P4=gray).

Search bar at top filters entities across all domains as you type (fuzzy match on entity name).

### Module 3: BVF CAPABILITY NAVIGATOR (`/capabilities`)

Three-panel layout:
- **Left (300px):** BVF hierarchy tree — Theme (3) → Group (12) → Sub-Capability (112). Collapsible accordion. Color-coded by theme (blue=Marketing, amber=Finance, green=Product). Click sub-capability to load detail.
- **Center:** Capability detail card:
  - Breadcrumb: Theme > Group > Sub-Capability
  - Section: **Data Requirements** — numbered list (from capabilities data)
  - Section: **Required FSDM Entities** — chip/pill list with domain color, entity name (from dependencies). Clicking navigates to Module 2.
  - Section: **Pakistan Banking Context** — 4 subsections: Objectives, Data Sources, Expected Outcomes, Key Challenges (populated from enrichment data for key capabilities, placeholder for others)
  - Section: **Implementation** — Phase (1/2/3), estimated investment range (PKR), quick wins
- **Right (250px):** Related Capabilities — top 5 most similar (from reuse matrix, showing similarity %). Click navigates to that capability.

### Module 4: DEPENDENCY GRAPH (`/graph`)

Interactive force-directed network visualization using D3.js:
- **Nodes:** BVF Capability Groups (12, large circles colored by theme) + FSDM Domains (16, medium circles colored distinctly) 
- **Edges:** Lines connecting capability groups to domains they depend on. Thicker = more dependencies.
- Controls panel:
  - Filter by theme (checkboxes)
  - Show/hide labels
  - Highlight P1 entities toggle
  - Zoom +/-
- Hover node: tooltip showing name, type, connection count
- Click node: navigates to Module 2 (domain) or Module 3 (capability)

### Module 5: MATURITY ASSESSMENT (`/maturity`)

Two modes:
- **Assessment Mode:** Step-by-step wizard through 9 BACR categories. Per category: show 5-10 representative questions. Each question: statement text + Current State slider (1-5) + Desired State slider (1-5). Maturity labels: 1=Emerging, 2=Developing, 3=Practicing, 4=Innovating, 5=Leading. Progress bar at top. Save to localStorage between sessions.
- **Results Mode** (after completing assessment): 
  - Radar chart: 9 categories, current (blue line) vs. desired (green line) overlay
  - Gap analysis table: Category | Current Avg | Desired Avg | Gap | Priority (sorted by gap)
  - Heat map: 9×2 grid showing current and desired, color intensity = score
  - Overall maturity score (weighted average)
  - Export button (download as JSON)

### Module 6: PROFITABILITY ENGINE (`/profitability`)

Three tabs:
- **Star Schema tab:** Interactive ERD visualization (built with SVG/React):
  - FACT table at center (gold background)
  - 7 DIM tables around it (blue backgrounds)  
  - 2 AGG tables (green backgrounds)
  - FK relationship lines connecting them
  - Click any table → expands to show column list with datatypes
  - Columns that are Pakistan-specific highlighted (sbp_*, islamic_*, kibor_*, cnic_*)

- **P&L Builder tab:** Interactive 15-line profitability waterfall:
  ```
  1. Gross Interest Income        [Revenue — green]
  2. - Interest Expense            [Cost — red]
  3. = Net Interest Income (NII)   [Subtotal — bold]
  4. +/- FTP Adjustment            [Adjustment — amber]
  5. = FTP-Adjusted NII            [Subtotal — bold]
  6. + Fee & Commission Income     [Revenue — green]
  7. + FX & Trading Income         [Revenue — green]
  8. + Other Income                [Revenue — green]
  9. = Total Income                [Subtotal — bold blue]
  10. - Direct Operating Costs      [Cost — red]
  11. - ABC Allocated Costs         [Cost — red]
  12. = Operating Profit            [Subtotal — bold]
  13. - IFRS 9 ECL Provision        [Cost — red]
  14. = Profit Before Capital       [Subtotal — bold]
  15. - Capital Charge (RWA×CoE)    [Cost — red]
  16. = Economic Profit (EVA)       [Final — bold gold]
  ```
  Each line: click to expand → shows source FSDM entities, calculation formula, Pakistan notes.

- **Gap Extensions tab:** 5 cards (one per gap module):
  - Header: Module name + table count
  - Expand: table list with columns and descriptions
  - Shows connection to star schema (which fact/dim columns feed from gap tables)

### Module 7: ROADMAP BUILDER (`/roadmap`)

- **Capability Picker:** Multi-select checkboxes from 112 capabilities, organized by group. Pre-built templates:
  - "Quick Wins" (6 capabilities): Customer Profitability, Reconciliation, Close Process, Regulatory Reporting, KPI Factory, Liquidity
  - "Profitability Engine" (8 caps): Profitability, ABC, RAROC, FTP, Revenue Analytics, Loan Pricing, Performance Mgmt, Budget
  - "Regulatory Compliance" (6 caps): Regulatory Reporting, External Reporting, Exception Reporting, AML, KYC, Basel Reporting
  - "Digital Transformation" (7 caps): Omni-channel, Digital Onboarding, Card Spend, Mobile Analytics, Campaign Management, NBA/NBO, A/B Testing
  - "Full BVF" (all 112)

- **Generated Roadmap:** 3-phase Gantt-style timeline:
  - Phase 1 (0-6 months): Foundation capabilities
  - Phase 2 (6-18 months): Optimization capabilities
  - Phase 3 (18-36 months): Advanced analytics
  - Each phase: card showing capabilities, data requirements count, FSDM entities needed, estimated investment (PKR range)

- **Investment Summary:** Total PKR investment range, expected ROI metrics, data prerequisites

### Module 8: PAKISTAN BANKING REFERENCE (`/pakistan`)

Four sections (vertical scroll or tabs):

- **Regulatory Framework:**
  - SBP key rates table (policy rate, KIBOR tenors, minimum savings rate)
  - Basel III requirements (CAR 11.5%, LCR 100%, NSFR 100%)
  - IFRS 9 ECL framework (Stage 1/2/3, PD, LGD, EAD)
  - Tax rates (corporate 39%+10% super tax, WHT 15%/30%, Zakat 2.5%)

- **Industry Metrics:**
  - Banking sector card: 33 banks, 5 Islamic, PKR 35T assets, 16K branches, 16K ATMs
  - Key ratios: NIM ~3.5%, Cost-to-Income ~45%, NPL 7.5%, CASA 47%, ADR ~52%

- **Islamic Banking:**
  - 7 product modes table: Murabaha, Ijarah, Diminishing Musharaka, Musharaka, Wakalah, Salam, Istisna
  - Each: type, use case, FSDM entity mapping, P&L treatment

- **Payment Ecosystem:**
  - RAAST (real-time gross settlement), 1Link (ATM/POS switch), NIFT (cheques/clearing)
  - Fintechs: JazzCash (50M+ users), Easypaisa (40M+), SadaPay, NayaPay

## UI Design Specifications

### Layout
- **Sidebar** (left): 64px collapsed, 260px expanded. Dark background (#0F172A). Logo at top. 8 nav items with Lucide icons. Collapse/expand toggle at bottom. Active item: left border accent + lighter bg.
- **Header** (top, right of sidebar): 56px height. Global search bar (centered). App name "BAIW" left-aligned.
- **Content area** (right of sidebar, below header): Light background (#F8FAFC). 24px padding. Card-based layouts.

### Color System
```
Sidebar:      bg-slate-900 (#0F172A)
Header:       bg-white, border-bottom
Content bg:   bg-slate-50 (#F8FAFC)
Cards:        bg-white, shadow-sm, rounded-lg
Primary:      blue-600 (#2563EB)
Marketing:    blue-500 (#3B82F6)
Finance:      amber-500 (#F59E0B)
Product:      emerald-500 (#10B981)
Risk:         red-500 (#EF4444)
Security:     violet-500 (#8B5CF6)
Compliance:   indigo-500 (#6366F1)
Pakistan:     emerald-700 (#047857)
P1 tier:      red-500
P2 tier:      orange-500
P3 tier:      yellow-500
P4 tier:      gray-400
```

### Typography
System font stack. Base 14px. Headers: 24px (h1), 20px (h2), 16px (h3). Monospace for entity names, SQL, technical content.

### Responsive
Desktop-first (1280px+). Sidebar collapses to icons at <1024px. Content reflows to single column at <768px.

## Build Instructions

### Step 1: Generate Sample Data

Create a Python script `scripts/generate_sample_data.py` that produces all JSON files in `src/data/` with realistic banking data model content matching the exact counts above. The entities should have realistic FSDM names (Party, Individual, Organization_Unit, Agreement, Deposit_Account, Loan_Account, Credit_Card_Agreement, Transaction, Payment, GL_Account, etc.). Capabilities should have realistic BVF names. BACR questions should be realistic banking analytics maturity questions.

### Step 2: Scaffold React App

```
baiw/
├── scripts/
│   ├── generate_sample_data.py
│   └── prepare_data.py          # For converting real repo CSV→JSON (future)
├── src/
│   ├── data/                    # JSON data files (generated by Step 1)
│   ├── components/
│   │   ├── layout/              # Sidebar, Header, Layout
│   │   ├── dashboard/           # StatCard, DomainDonut, CapabilityBar, PakistanCard
│   │   ├── model/               # DomainTree, EntityCard, AttributeTable, SearchBar
│   │   ├── capabilities/        # BvfTree, CapabilityDetail, FsdmChips, PakistanContext
│   │   ├── graph/               # ForceGraph, GraphControls
│   │   ├── maturity/            # AssessmentWizard, QuestionCard, MaturitySlider, RadarChart, GapTable
│   │   ├── profitability/       # StarSchemaERD, PLBuilder, GapModules
│   │   ├── roadmap/             # CapabilityPicker, GanttChart, InvestmentSummary
│   │   └── pakistan/            # RegulatoryTable, IslamicModes, PaymentSystems
│   ├── pages/                   # 8 page components (one per module)
│   ├── hooks/                   # useEntities, useCapabilities, useAssessment, useSearch
│   ├── context/                 # AssessmentContext
│   ├── utils/                   # dataLoader, search, export
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

### Step 3: Build All 8 Modules

Build them in this order:
1. Layout (sidebar + header + routing) — skeleton for all pages
2. Data layer (JSON imports, hooks, search utilities)
3. Dashboard (Module 1) — gives immediate visual impact
4. Model Explorer (Module 2) — core FSDM navigation
5. Capability Navigator (Module 3) — core BVF navigation
6. Profitability Engine (Module 6) — high-value star schema + P&L
7. Dependency Graph (Module 4) — D3 visualization
8. Maturity Assessment (Module 5) — BACR wizard
9. Roadmap Builder (Module 7) — capability selection + timeline
10. Pakistan Reference (Module 8) — static reference content

### Step 4: Cross-Module Navigation

Ensure these cross-links work:
- Entity in Model Explorer → click "Used By" capability → navigates to Capability Navigator
- Capability in Navigator → click FSDM entity chip → navigates to Model Explorer
- Dashboard → click domain in donut → navigates to Model Explorer filtered by domain
- Dashboard → click capability bar → navigates to Capability Navigator filtered by theme
- Roadmap Builder → selected capabilities show their FSDM entity requirements
- Profitability Engine → click P&L line → shows FSDM source entities

## Quality Requirements

1. **No placeholder "TODO" pages** — every module has functional content
2. **Real banking terminology** throughout — not generic "item" or "category"
3. **Smooth transitions** between pages (React Router with scroll-to-top)
4. **Loading states** with skeleton screens for large data sets
5. **Search works globally** across entities and capabilities
6. **Assessment persists** in localStorage across browser sessions
7. **Consistent card-based design** — all content in white cards with subtle shadows
8. **Entity names are realistic FSDM names** — Party, Individual, Agreement, Deposit_Account, Loan_Account, GL_Entry, Risk_Assessment, etc.
9. **No broken/empty states** — every click leads to meaningful content

## Deliverables

1. `scripts/generate_sample_data.py` — generates all JSON data files
2. Complete React application in `baiw/` directory  
3. All 8 modules fully functional
4. `README.md` with setup instructions (`npm install && npm run dev`)
5. Data ready to swap with real repo data via `scripts/prepare_data.py`

Build the entire application now. Start with the data generation script, then the React app scaffold, then implement each module top-to-bottom.
