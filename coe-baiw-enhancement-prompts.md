# Cash Optimization Engine (COE) — BAIW Enhancement Prompts
## 6 Separate Prompts for Claude Code Execution

**Context:** These prompts add a Cash Optimization Engine module to the existing BAIW (Banking Analytics Intelligence Workbench) application. The COE is based on a comprehensive framework for Pakistan commercial banking (UBL reference case) covering 10 use cases, game theory, revenue optimization, and a PKR 7.8–12.7B annual impact model.

**Execution Order:** Run prompts 1→2→3→4→5→6 sequentially in separate Claude Code sessions.

---

## PROMPT 1: COE Data Repository Generation

```
You are enhancing an existing React + TypeScript BAIW (Banking Analytics Intelligence Workbench) application by adding a Cash Optimization Engine (COE) module. This prompt generates the data files only.

## TASK
Create a Python script `scripts/generate_coe_data.py` that generates JSON data files in `src/data/coe/`. Run the script after creation.

## OUTPUT FILES (all in src/data/coe/)

### 1. useCases.json — Array of 10 use cases
Each use case object:
{
  id: "UC-01" through "UC-10",
  name: string,
  objective: string (2-3 sentences),
  problemStatement: string (3-4 sentences with PKR figures),
  optimizationTechnique: {
    name: string,
    description: string (3-4 sentences),
    algorithmType: "ML" | "Mathematical Programming" | "RL" | "Mechanism Design" | "Multi-Objective",
    keyModels: string[] // e.g. ["LSTM", "Stochastic Programming"]
  },
  gameTheory: {
    players: string, // e.g. "Branch Mgr vs Treasury"
    gameType: string, // e.g. "Principal-Agent"
    equilibrium: string, // e.g. "Nash (trust + guarantee)"
    mechanism: string // e.g. "Cash Efficiency Score KPI"
  },
  revenueImpact: {
    annualSavingMin: number, // in PKR millions
    annualSavingMax: number,
    mechanism: string,
    category: "Float Recovery" | "Cost Reduction" | "Operational Efficiency" | "Revenue Attribution"
  },
  inputs: string[], // data sources needed
  outputs: string[], // what it produces
  dependencies: string[], // other UC IDs it depends on
  phase: 1 | 2 | 3 | 4, // implementation phase
  color: string // tailwind color for theme
}

THE 10 USE CASES:
UC-01: Branch Vault Cash Forecasting & Right-Sizing
  - Technique: Stochastic Programming + LSTM Forecasting
  - Game: Branch Mgr vs Treasury (Principal-Agent, Nash equilibrium)
  - Impact: PKR 3,300–4,300M (vault idle cash reduction → repo/T-bill)
  - Phase 1, color: emerald

UC-02: ATM Cash Replenishment Optimization
  - Technique: Inventory Theory + Reinforcement Learning (DQN)
  - Game: Bank vs CIT Provider (Stackelberg Leader-Follower)
  - Impact: PKR 396–796M (cassette float reduction + CIT trip savings)
  - Phase 2, color: blue

UC-03: Inter-Branch Cash Netting & Routing
  - Technique: Network Flow (Min Cost Flow) + VCG Auction
  - Game: Surplus vs Deficit branches (Auction, dominant strategy truthful)
  - Impact: PKR 560–760M (CIT trip elimination + transit float)
  - Phase 2, color: violet

UC-04: CRR Float Engineering & Regulatory Arbitrage
  - Technique: Dynamic Programming + Chance-Constrained Programming
  - Game: Bank vs SBP (Repeated Game, tit-for-tat moderation)
  - Impact: PKR 800–1,200M (overnight repo on freed CRR capacity)
  - Phase 2, color: amber

UC-05: Nostro Account Balance Optimization
  - Technique: Multi-Currency Portfolio Optimization + Markov Decision Process
  - Game: Bank vs Correspondent (Nash Bargaining, fee-for-service)
  - Impact: PKR 500–1,000M (FX carry + repatriation)
  - Phase 2, color: cyan

UC-06: Vostro Account Liability Optimization
  - Technique: Liquidity-at-Risk (LaR) Framework
  - Game: Bank vs Foreign Banks (Cooperative Iterated, reciprocal stability)
  - Impact: PKR 75–250M (stable vostro → longer-tenor instruments)
  - Phase 3, color: teal

UC-07: Denomination Mix Optimization & SBP Penalty Avoidance
  - Technique: Constrained Multi-Objective Optimization (NSGA-II)
  - Game: Bank vs Nature/demand (Game Against Nature, minimax regret)
  - Impact: PKR 230–420M (penalty avoidance + sorting efficiency)
  - Phase 3, color: rose

UC-08: CIT Route Optimization & Dynamic Scheduling
  - Technique: VRPTW + Adaptive Large Neighbourhood Search (ALNS)
  - Game: CIT vehicles/fleet (Cooperative coalition, Shapley value)
  - Impact: PKR 300–600M (trip reduction + insurance savings)
  - Phase 2, color: orange

UC-09: Digital Channel Incentivization & Cash Demand Deflection
  - Technique: Mechanism Design + Multi-Armed Bandit
  - Game: Bank vs Customers (Mechanism Design, subgame perfect)
  - Impact: PKR 750–2,000M (cash-to-digital shift savings over 3yr)
  - Phase 3, color: pink

UC-10: Integrated Cash P&L Attribution & Branch Profitability
  - Technique: Activity-Based Costing + Transfer Pricing Engine
  - Game: Branches tournament (Tournament/Contest, effort equilibrium)
  - Impact: Measurement layer — ensures sustained PKR 7.8–12.7B target
  - Phase 4, color: indigo

### 2. revenueModel.json
{
  totalImpact: { min: 7800, max: 12700, unit: "PKR Millions" },
  floatRevenueTiers: [
    { tier: 1, name: "Overnight Repo", yield: 10.5, risk: "Lowest", liquidity: "T+0" },
    { tier: 2, name: "Short-Term T-Bills", yield: "11-12%", risk: "Low", liquidity: "Hours" },
    { tier: 3, name: "Lending Deployment", yield: "15-22%", risk: "Medium-High", liquidity: "Tenor-based" },
    { tier: 4, name: "FX Carry (Nostro)", yield: "4.5% USD / 10.5% PKR swap", risk: "FX Risk", liquidity: "T+1" }
  ],
  costReduction: [
    { category: "CIT Transportation", currentCostMin: 1500, currentCostMax: 2000, reductionPct: "25-35%", savingMin: 375, savingMax: 700 },
    { category: "Vault Insurance", currentCostMin: 600, currentCostMax: 800, reductionPct: "30%", savingMin: 180, savingMax: 240 },
    { category: "Cash Sorting/CPC", currentCostMin: 400, currentCostMax: 600, reductionPct: "20%", savingMin: 80, savingMax: 120 },
    { category: "SBP Penalties", currentCostMin: 80, currentCostMax: 150, reductionPct: "90%", savingMin: 72, savingMax: 135 },
    { category: "Security Personnel", currentCostMin: 800, currentCostMax: 1200, reductionPct: "10%", savingMin: 80, savingMax: 120 },
    { category: "Teller Overtime", currentCostMin: 200, currentCostMax: 300, reductionPct: "40%", savingMin: 80, savingMax: 120 }
  ],
  leverBreakdown: [
    { lever: "Vault Cash Reduction", savingMin: 4500, savingMax: 7000, mechanism: "Redeploy idle vault to repo/T-bills" },
    { lever: "ATM Cash Optimization", savingMin: 1500, savingMax: 2500, mechanism: "Reduce float-in-cassette by 30-40%" },
    { lever: "CIT Route Optimization", savingMin: 300, savingMax: 600, mechanism: "Fewer trips, dynamic routing" },
    { lever: "CRR Float Engineering", savingMin: 800, savingMax: 1200, mechanism: "Weekly averaging arbitrage" },
    { lever: "Nostro/Vostro Optimization", savingMin: 500, savingMax: 1000, mechanism: "Reduce idle FX balances abroad" },
    { lever: "Denomination Management", savingMin: 200, savingMax: 400, mechanism: "Reduce SBP penalty + sorting costs" }
  ]
}

### 3. systemArchitecture.json
{
  layers: [
    {
      name: "Data Layer",
      sources: [
        { name: "Core Banking (T24/Flexcube)", feeds: "Account balances, transactions, deposit base", frequency: "Real-time (CDC) + EOD" },
        { name: "ATM Switch (Euronet/TPS)", feeds: "ATM transactions, cassette levels, uptime", frequency: "Real-time (5-60 sec)" },
        { name: "Treasury/Dealing System", feeds: "Repo positions, T-bill holdings, FX deals", frequency: "Real-time + EOD" },
        { name: "SWIFT/Correspondent Banking", feeds: "Nostro/vostro positions, pending LCs", frequency: "Intraday MT940/950 + EOD" },
        { name: "CIT Management System", feeds: "Vehicle routes, trip logs, cash movement", frequency: "Real-time GPS + trip completion" },
        { name: "SBP Regulatory Feeds", feeds: "CRR position, policy rate, circulars", frequency: "Daily + event-driven" },
        { name: "Branch Vault System", feeds: "Vault balances, denomination breakdown", frequency: "EOD + intraday snapshots" },
        { name: "External: Weather/Events", feeds: "Islamic calendar, crop cycles, events", frequency: "Daily refresh" }
      ]
    },
    {
      name: "Analytics & Optimization Layer",
      components: ["LSTM Forecasters", "RL Agents (DQN)", "Stochastic Programming", "Network Flow Solver", "VRPTW (ALNS)", "VCG Auction Engine", "Multi-Armed Bandit", "NSGA-II Optimizer", "Chance-Constrained Programming", "ABC Costing Engine"]
    },
    {
      name: "Operations & Execution Layer",
      components: ["Branch Cash Dashboard", "ATM Management Console", "Treasury Cockpit", "CIT Dispatch System"]
    },
    {
      name: "Governance & Monitoring Layer",
      components: ["Cash Efficiency Scores", "CRR Compliance Monitor", "Forecast Accuracy Tracker", "Cash P&L Attribution"]
    }
  ],
  techStack: [
    { component: "Data Warehouse", tech: "Teradata / Snowflake", rationale: "Leverages existing DWH (FSDM)" },
    { component: "Streaming/CDC", tech: "Apache Kafka + Debezium", rationale: "Real-time vault and ATM feeds" },
    { component: "ML Framework", tech: "PyTorch + MLflow", rationale: "LSTM, RL agents, model versioning" },
    { component: "Optimization Solver", tech: "Gurobi / OR-Tools", rationale: "MIP, network flow, VRPTW" },
    { component: "Dashboards", tech: "React + TradingView Charts", rationale: "Real-time cash visualization" },
    { component: "API Layer", tech: "FastAPI (Python)", rationale: "Serve optimization results" },
    { component: "Orchestration", tech: "Apache Airflow", rationale: "Schedule model runs, pipelines" }
  ]
}

### 4. branchTypology.json — 5 branch types with cash profiles
Array of: { type, cashProfile, exampleLocations, optimizationFocus, avgDailyVolumePKR: {min, max}, vaultIdlePct }

Types: Cash-Surplus (bazaar/trade hubs), Cash-Deficit (salary/govt), Balanced (residential), Seasonal (agri-belt), Hub/CPC (regional aggregation)

### 5. regulatoryContext.json — SBP regulatory framework
{
  crr: { weeklyAverage: 6, dailyMinimum: 4, applicableTo: "Demand liabilities + time liabilities < 1yr", exempt: "Time liabilities > 1yr", penaltyRate: "SBP penalty rate on shortfall", interestEarning: false },
  currencyManagement: { cpcRequired: true, sortingRequirement: "Machine-authenticated, issuable/non-issuable", penalties: { min: 5000, max: 100000, currency: "PKR", per: "instance" }, cctvRequired: true },
  cdmMandate: { targetPct: 25, targetYear: 2028, requirement: "25% of branches with CDMs by CY2028", instantCredit: true },
  policyRate: 11,
  cashToGDPRatio: "12-14%"
}

### 6. implementationRoadmap.json — 4 phases with milestones
Array of phases with: phaseNumber, name, months (start-end), useCases (UC IDs), milestones (array of strings), keyDeliverables

### 7. gameTheoryMatrix.json — 10x5 matrix of game theory synthesis
Array of: { ucId, players, gameType, equilibrium, mechanism }

### 8. cashMetrics.json — UBL reference metrics for the dashboard
{
  branches: 1500, atms: 2000, deposits: "PKR 2.5T+",
  avgVaultIdleCash: 35, // PKR millions per branch
  targetVaultCash: 15,
  avgATMCassette: 4, // PKR millions
  targetATMCassette: 2.2,
  citTripsPerDay: 200,
  sbpPolicyRate: 11,
  annualImpactMin: 7800, annualImpactMax: 12700,
  roaImprovement: "2-4%"
}

### 9. index.json — Metadata
{ module: "COE", version: "1.0", generatedAt, useCaseCount: 10, ... }

## CRITICAL RULES
- Generate ALL data with realistic, detailed content matching the document
- Use proper PKR figures from the original specification
- All game theory details must be accurate per the 10 use cases
- Run the script and verify all JSON files are created
- Do NOT modify any existing BAIW or TAIW files
```

---

## PROMPT 2: COE Dashboard & Use Case Explorer

```
You are enhancing an existing React + TypeScript BAIW application by adding a Cash Optimization Engine (COE) module. The data files already exist in `src/data/coe/`. This prompt builds the main COE pages.

## EXISTING APP CONTEXT
- BAIW lives in `src/components/` with routes at `/`, `/model`, `/capabilities`, etc.
- TAIW lives in `src/taiw/` with routes at `/taiw/*`
- App.tsx has routes for both modules
- Tailwind CSS, lucide-react icons, recharts are available
- BAIW uses purple/blue theme, TAIW uses teal/cyan theme

## TASK
Create the COE module in `src/coe/` with an amber/orange gradient theme (`from-amber-600 to-orange-600`).

## FILES TO CREATE

### 1. src/coe/CoeLayout.tsx
- Top navigation bar with amber/orange gradient
- Logo: "COE" with subtitle "Cash Optimization Engine"
- 6 navigation links: Dashboard, Use Cases, Game Theory, Revenue Engine, Architecture, Roadmap
- Module switcher dropdown (BAIW ↔ TAIW ↔ COE) using react-router `useNavigate`
- Same dark theme (slate-900 background) as BAIW/TAIW

### 2. src/coe/components/CoeDashboard.tsx — Route: `/coe`
Hero section with amber/orange gradient showing:
- "Cash Optimization Engine" title with "Game-Theoretic & Predictive Analytics Framework for Pakistan Commercial Banking"
- 6 hero stat cards in a grid:
  * 10 Use Cases (from useCases.json length)
  * PKR 7.8–12.7B Annual Impact (from cashMetrics.json)
  * 1,500+ Branches optimized
  * 2,000+ ATMs optimized
  * 10 Game Theory Models
  * 4-Phase Roadmap (24 months)

Main content grid:
- **Impact Waterfall Chart** (recharts BarChart): 6 levers (Vault, ATM, CIT, CRR, Nostro, Denomination) showing min/max savings stacked
- **Use Case Phase Timeline**: Visual showing UC-01 through UC-10 plotted across 4 phases with colored dots per UC
- **Branch Typology Cards**: 5 cards (Surplus, Deficit, Balanced, Seasonal, Hub) with cash profiles from branchTypology.json
- **Quick Nav Grid**: 5 cards linking to other COE pages with live data counts
- **Float Revenue Tiers**: 4 horizontal bars showing Tier 1-4 with yield percentages
- **Pakistan Cash Landscape Stats**: Cash-to-GDP 12-14%, SBP rate 11%, CRR band 4-6%, CDM mandate 25% by 2028

### 3. src/coe/components/UseCaseExplorer.tsx — Route: `/coe/usecases`
Left panel: List of 10 use cases with UC-ID badges, name, phase tag, and impact range
- Colored left border per UC color
- Search box to filter by name/technique
- Filter chips: All | Phase 1 | Phase 2 | Phase 3 | Phase 4

Right panel (detail): When a UC is selected, show:
- UC-XX header with full name and colored badge
- **Objective** section
- **Problem Statement** with highlighted PKR figures
- **Optimization Technique** card: name, description, algorithm badges (ML, RL, Math Programming, etc.), key models listed
- **Game Theory** card: Players, Game Type, Equilibrium, Mechanism — styled as a mini-table with amber header
- **Revenue Impact** card: Min-Max range bar, mechanism description, category badge
- **Data I/O**: Inputs list (with source icons) and Outputs list
- **Dependencies**: Shows which other UCs this depends on with clickable links
- **Implementation Phase**: Phase badge with month range

Default selection: UC-01

### 4. Add routes to App.tsx
Add COE routes:
```tsx
<Route path="/coe" element={<CoeLayout />}>
  <Route index element={<CoeDashboard />} />
  <Route path="usecases" element={<UseCaseExplorer />} />
  {/* remaining routes added in later prompts */}
</Route>
```

Update the suite landing page (if it exists at `/`) to include a COE card with amber/orange theme.

## CRITICAL RULES
- Zero modifications to existing BAIW components in `src/components/`
- Zero modifications to existing TAIW components in `src/taiw/`
- Only ADD routes to App.tsx — never remove or change existing ones
- Import all data from `src/data/coe/`
- Use amber-500/600 and orange-500/600 for COE theme consistently
- All PKR figures must use proper formatting: "PKR 7.8–12.7B" not "7800-12700M"
- Responsive design: works on desktop (1024px+) and tablet (768px+)
- Use lucide-react for all icons (Banknote, Building2, Truck, Shield, Globe, Cpu, BarChart3, Target, Users, Calculator, etc.)
```

---

## PROMPT 3: Game Theory Strategy Map & Visualization

```
You are continuing to enhance the BAIW app's COE module. The dashboard and use case explorer are already built. This prompt adds the Game Theory visualization page.

## EXISTING CONTEXT
- COE module lives in `src/coe/`
- Data in `src/data/coe/` (useCases.json, gameTheoryMatrix.json)
- CoeLayout.tsx already has nav links
- Amber/orange theme (`from-amber-600 to-orange-600`)

## TASK
Create the Game Theory Strategy Map page.

## FILE: src/coe/components/GameTheoryMap.tsx — Route: `/coe/gametheory`

### Section 1: Strategy Matrix (top)
A 10-row table/grid showing all use cases' game theory dimensions:
| UC | Players | Game Type | Equilibrium | Mechanism |
Each row colored by the UC's theme color.
Clicking a row expands it to show detailed explanation.

### Section 2: Interactive Strategy Network (middle)
A force-directed graph (using d3 or manual SVG) showing:
- **Player nodes**: Branch Manager, Treasury, CIT Provider, SBP, Correspondent Banks, Foreign Banks, Nature/Demand, Customers, Fleet/Vehicles, Branches
- **UC nodes**: UC-01 through UC-10 (smaller, colored by phase)
- **Edges**: Connect each UC to its two players
- Node size by impact (PKR savings)
- Click a UC node → highlight its players and show game details in a tooltip
- Click a Player node → highlight all UCs involving that player
- Hover shows the equilibrium concept

### Section 3: Game Type Classification (bottom-left)
Group the 10 UCs by game type category:
- **Strategic Games** (2-player): UC-01, UC-02, UC-04, UC-05
- **Auction/Market**: UC-03
- **Cooperative**: UC-06, UC-08
- **Against Nature**: UC-07
- **Mechanism Design**: UC-09
- **Tournament**: UC-10
Each category in a card with the UCs listed and total impact summed.

### Section 4: Equilibrium Concepts Glossary (bottom-right)
Cards explaining each equilibrium type used:
- Nash Equilibrium (UC-01, UC-05)
- Stackelberg Equilibrium (UC-02)
- Dominant Strategy (UC-03)
- Tit-for-Tat (UC-04)
- Cooperative/Reciprocal (UC-06)
- Minimax Regret (UC-07)
- Core/Shapley Value (UC-08)
- Subgame Perfect (UC-09)
- Effort Equilibrium (UC-10)
Each with a 1-2 sentence plain-English explanation and which UC uses it.

## ROUTE
Add to App.tsx: `<Route path="gametheory" element={<GameTheoryMap />} />`

## CRITICAL RULES
- The force-directed graph must be interactive (draggable nodes, hover tooltips)
- Use proper game theory terminology but include plain-English explanations
- Color-code everything by UC theme colors from useCases.json
- Show PKR impact figures on all relevant elements
- Zero modifications to Dashboard or UseCaseExplorer
```

---

## PROMPT 4: Revenue Engine & Branch Cash Simulator

```
You are continuing to enhance the BAIW app's COE module. This prompt adds the Revenue Engine page with an interactive calculator and branch simulator.

## EXISTING CONTEXT
- COE module in `src/coe/`, data in `src/data/coe/`
- revenueModel.json has float tiers, cost reduction, lever breakdown
- cashMetrics.json has UBL reference metrics
- branchTypology.json has 5 branch types

## TASK
Create the Revenue Engine page with interactive calculators.

## FILE: src/coe/components/RevenueEngine.tsx — Route: `/coe/revenue`

### Section 1: Impact Summary (hero)
Large animated counter showing "PKR 7.8B – 12.7B" annual impact.
Below: 6 lever cards showing each lever's contribution with a horizontal stacked bar showing min-max range.

### Section 2: Float Revenue Calculator (interactive)
User adjustable sliders:
- **Freed Cash Amount** (PKR billions): slider 0–50B, default 30B
- **Deployment Tier**: Radio buttons (Tier 1: Overnight Repo 10.5%, Tier 2: T-Bills 11.5%, Tier 3: Lending 18%, Tier 4: FX Carry 4.5% USD)
- **Holding Period**: slider 1–365 days

Output: Real-time calculation showing:
- Annual Revenue = Freed Cash × Yield Rate
- Daily Revenue = Annual / 365
- Displayed prominently with PKR formatting
- Comparison: "This equals X branch managers' annual salaries" or "This could fund X ATM installations"

### Section 3: Cost Reduction Waterfall (recharts)
Waterfall chart showing 6 cost categories:
- Current cost bar (red/amber)
- Reduction bar (green)
- Remaining cost bar (muted)
Total savings summed at the bottom.

### Section 4: Branch Cash Simulator
Interactive per-branch simulator:
- **Branch Type** dropdown: Surplus, Deficit, Balanced, Seasonal, Hub
- **Current Vault Cash** (PKR M): slider with default based on type
- **Recommended Vault Cash**: auto-calculated as optimal level
- **Daily Transaction Volume** (PKR M): slider
- **SBP Policy Rate** (%): slider default 11%

Output dashboard:
- Cash Efficiency Score (CES) = 1 – (Idle Cash / Vault Balance) — displayed as a gauge/meter
- Annual Opportunity Cost of current idle cash (PKR)
- Annual Savings if optimized (PKR)
- Recommended CIT frequency change
- "Freed for Repo" amount with daily revenue calculation

Show a before/after comparison:
- Left: Current state (vault level, idle %, cost)
- Right: Optimized state (lower vault, higher CES, revenue earned)

### Section 5: CRR Band Optimizer
7-day (Friday–Thursday) visual:
- For each day, show a bar between 4% minimum and ~8% ceiling
- User can drag the bar height for each day
- System validates: weekly average must be ≥ 6%, each day ≥ 4%
- Shows freed liquidity per day and total weekly repo income
- Color: green if compliant, red if violated
- Default: show the "naive" 6% flat vs. optimized zigzag

## ROUTE
Add: `<Route path="revenue" element={<RevenueEngine />} />`

## CRITICAL RULES
- All calculations must use real formulas (not fake numbers)
- Slider changes must update calculations in real-time (no submit buttons)
- PKR formatting with commas and proper abbreviations (M, B, T)
- CRR optimizer must enforce the 4% floor and 6% weekly average constraint
- Use recharts for all charts
- Show tooltips on all interactive elements explaining the concept
```

---

## PROMPT 5: System Architecture & Implementation Roadmap

```
You are continuing to enhance the BAIW app's COE module. This prompt adds the Architecture view and Roadmap page.

## EXISTING CONTEXT
- COE module in `src/coe/`, data in `src/data/coe/`
- systemArchitecture.json has 4 layers, data sources, tech stack
- implementationRoadmap.json has 4 phases with milestones

## TASK
Create two pages: Architecture and Roadmap.

## FILE 1: src/coe/components/SystemArchitecture.tsx — Route: `/coe/architecture`

### Section 1: 4-Layer Architecture Diagram
Visual layered diagram (SVG or styled divs) showing:
```
┌─────────────────────────────────────────┐
│     Governance & Monitoring Layer        │  ← Top (gold/amber)
│  CES Scores | CRR Monitor | P&L Reports │
├─────────────────────────────────────────┤
│     Operations & Execution Layer         │  ← (blue)
│  Branch Dashboard | ATM Console |        │
│  Treasury Cockpit | CIT Dispatch         │
├─────────────────────────────────────────┤
│     Analytics & Optimization Layer       │  ← (violet/purple)
│  LSTM | DQN | Stochastic Prog |          │
│  Network Flow | VRPTW | VCG Auction      │
├─────────────────────────────────────────┤
│     Data Layer                           │  ← (slate/gray)
│  Core Banking | ATM Switch | Treasury |  │
│  SWIFT | CIT | SBP | Vault | External   │
└─────────────────────────────────────────┘
```
Each layer is clickable — expands to show detailed components.
Data Layer shows 8 source cards with feed frequency badges (real-time, EOD, daily).
Analytics layer shows 10 algorithm badges matching the 10 use cases.

### Section 2: Data Flow Diagram
Horizontal flow showing data movement:
Source Systems → Kafka/CDC → Data Warehouse → Analytics Engine → Operations Dashboards → Governance Reports
Each node is clickable with details.

### Section 3: Technology Stack
Grid of 7 technology cards from techStack data:
Each card: icon, component name, technology, rationale
Styled with subtle amber borders.

### Section 4: UC-to-Layer Mapping
Matrix showing which UCs use which layers/components. 10 rows (UCs) × components columns. Filled cells with colored dots.

## FILE 2: src/coe/components/ImplementationRoadmap.tsx — Route: `/coe/roadmap`

### Section 1: Phase Overview Cards
4 large cards showing phases:
- Phase 1: Foundation (Months 1–6) — 🟢 green
- Phase 2: Optimization (Months 7–12) — 🔵 blue
- Phase 3: Scale & Refine (Months 13–18) — 🟣 purple
- Phase 4: Attribution & Continuous Improvement (Months 19–24) — 🟡 amber
Each card shows: UC IDs included, milestone count, key deliverables summary.

### Section 2: Gantt Chart
Horizontal timeline (months 1–24) with:
- 10 UC bars colored by their theme, positioned in their phase
- Phase boundaries marked with vertical lines
- Milestone diamonds on key dates
- Hover shows UC details
- Use recharts or custom SVG

### Section 3: UC Dependency Flow
DAG (directed acyclic graph) showing which UCs depend on others:
- UC-01 is foundation (no dependencies)
- UC-02 depends on UC-01 (vault data feeds ATM)
- UC-03 depends on UC-01 (netting needs vault positions)
- UC-04 independent (Treasury focused)
- UC-05, UC-06 independent (correspondent banking)
- UC-07 depends on UC-01 (denomination part of vault)
- UC-08 depends on UC-01, UC-02 (CIT serves both)
- UC-09 depends on UC-10 (needs attribution to measure)
- UC-10 depends on UC-01 through UC-09 (measures all)
Show as a left-to-right flow with arrows.

### Section 4: Investment Calculator
Sliders to estimate implementation cost:
- Team size (data engineers, ML engineers, domain experts)
- Infrastructure cost (compute cluster, licenses)
- Phase selection (which phases to implement)
Output: Total investment vs. projected annual savings, ROI calculation, payback period in months.

## ROUTES
Add: `<Route path="architecture" element={<SystemArchitecture />} />`
Add: `<Route path="roadmap" element={<ImplementationRoadmap />} />`

## CRITICAL RULES
- Architecture diagram must be visually layered (not just text)
- Gantt chart must show all 24 months with proper UC positioning
- Dependency DAG must be interactive (hover/click)
- Investment calculator must be real-time reactive
- All content from the JSON data files — no hardcoded text
```

---

## PROMPT 6: Integration, Suite Navigation, Polish & Audit

```
You are finalizing the COE module in the BAIW app. All 6 COE pages are built. This prompt handles integration, navigation, and polish.

## EXISTING CONTEXT
- BAIW: `src/components/` with routes at `/*`
- TAIW: `src/taiw/` with routes at `/taiw/*`
- COE: `src/coe/` with routes at `/coe/*`
- Suite landing page may exist at `/` showing BAIW and TAIW cards
- Each module has its own Cmd+K palette or command search

## TASKS

### 1. Suite Landing Page Update
Update the suite landing page (likely `src/components/SuiteLanding.tsx` or equivalent) to include a third card for COE:
- Title: "Cash Optimization Engine"
- Subtitle: "Game-Theoretic & Predictive Analytics for Cash Management"
- Theme: amber/orange gradient
- Stats: "10 Use Cases • PKR 7.8–12.7B Impact • 4-Phase Roadmap"
- Icon: Banknote from lucide-react
- Link: `/coe`
- Position: Third card in the grid

### 2. Module Switcher Polish
Ensure the module switcher dropdown in ALL three layouts (BAIW, TAIW, COE) shows all 3 modules with correct colors:
- BAIW: purple/blue — "Banking Analytics"
- TAIW: teal/cyan — "Trade Analytics"
- COE: amber/orange — "Cash Optimization"
Clicking navigates to the module's dashboard.

### 3. COE Command Palette (Cmd+K)
Add a `CoeCommandPalette.tsx` that searches across COE data:
- Use cases (by name, technique, game type)
- Revenue levers
- Branch types
- Technology stack
- Roadmap phases
Triggered by Cmd+K when on `/coe/*` routes.
Must NOT interfere with BAIW or TAIW command palettes.

### 4. Cross-Module Navigation
Add contextual links from BAIW pages to COE:
- On BAIW's Analytics Engine page (if it mentions profitability/ABC costing), add a subtle link: "See also: Cash P&L Attribution (COE)" → `/coe/usecases` with UC-10 selected
- On BAIW's Pakistan Reference page (if it mentions SBP/CRR), add a link: "See also: CRR Float Engineering (COE)" → `/coe/usecases` with UC-04 selected
These are ONE-LINE additions — do not restructure existing BAIW pages.

### 5. localStorage Isolation
Verify all COE localStorage keys use `coe_` prefix:
- `coe_selectedUC`
- `coe_revenueSliders`
- `coe_roadmapPhases`
- `coe_crrSimulator`

### 6. Export Functionality
Add export buttons on key COE pages:
- Use Case Explorer: "Export UC Details" → JSON download
- Revenue Engine: "Export Revenue Model" → CSV with calculations
- Roadmap: "Export Roadmap" → JSON with phases and milestones

### 7. Mobile Responsiveness Check
Verify all COE pages work at:
- Desktop: 1280px+ (full grid layouts)
- Tablet: 768px-1279px (2-column collapse)
- Mobile: <768px (single column stack)
Fix any overflow or broken layouts.

### 8. Audit Checklist
Verify the following work correctly:
- [ ] All 6 COE routes load without blank pages
- [ ] All data imports resolve (no undefined/null crashes)
- [ ] Suite landing shows all 3 modules
- [ ] Module switcher works from any module
- [ ] Cmd+K scopes correctly per module
- [ ] No TypeScript errors
- [ ] All lucide-react icons are imported
- [ ] Revenue calculator formulas produce correct results
- [ ] CRR optimizer enforces constraints properly
- [ ] Charts render with proper data
- [ ] All PKR figures formatted consistently

## CRITICAL RULES
- Minimize changes to existing BAIW/TAIW files — only add cross-links and update suite landing
- COE must feel like a natural third module in the suite
- The amber/orange theme must be consistent across all COE pages
- Test by navigating: / → COE card → /coe → all 6 pages → back to suite landing
- Fix any import errors or blank pages before finishing
```

---

## Execution Summary

| Prompt | Creates | Time Est. | Key Output |
|--------|---------|-----------|------------|
| 1 | Data Repository | 10-15 min | 9 JSON files in `src/data/coe/` |
| 2 | Dashboard + Use Case Explorer | 25-35 min | 3 components + routes |
| 3 | Game Theory Strategy Map | 20-30 min | 1 component with force-directed graph |
| 4 | Revenue Engine + Simulators | 25-35 min | 1 component with 5 interactive sections |
| 5 | Architecture + Roadmap | 20-30 min | 2 components with diagrams |
| 6 | Integration + Polish | 15-20 min | Suite landing, Cmd+K, cross-links, audit |
| **TOTAL** | | **~2-3 hours** | **6 interactive pages, 9 data files** |

### Post-Build Metrics

| Metric | BAIW | TAIW | COE | Suite Total |
|--------|------|------|-----|-------------|
| Interactive Pages | 8 | 8 | 6 | 22 |
| Data Elements | 3,917 | 727 | 10 UCs + 60+ components | ~4,700+ |
| Capabilities/UCs | 112 | 96 | 10 | 218 |
| Charts/Visualizations | ~15 | ~15 | ~12 | ~42 |
