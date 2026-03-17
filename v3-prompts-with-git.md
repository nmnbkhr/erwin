# Analytics Intelligence Suite — v3.0.0 Build Prompts
## 4 Prompts with Git (Existing Repo on `master`, current tag: `v2.0.0`)

**Starting point:** Commit `a5f8da9`, tag `v2.0.0` on `origin/master`
**Target:** Tag `v3.0.0` after all 4 prompts complete

---

## PROMPT 1 OF 4: COE as BAIW Use Case Page

```
You are enhancing the existing BAIW (Banking Analytics Intelligence Workbench) React + TypeScript application by adding a Cash Optimization Engine page.

CRITICAL ARCHITECTURE RULE: COE is NOT a separate module. It is a USE CASE page within BAIW that demonstrates how BVF capabilities and FSDM entities map to a real-world cash optimization problem worth PKR 7.8–12.7 Billion annually.

## EXISTING APP CONTEXT
- BAIW lives in src/components/ with routes at /, /model, /capabilities, /graph, /maturity, /analytics, /roadmap, /pakistan
- TAIW lives in src/taiw/ with routes at /taiw/*
- Suite landing page exists showing both BAIW and TAIW cards
- BAIW uses purple/blue gradient theme, Tailwind CSS, lucide-react icons, recharts
- BVF has 112 capabilities across 6 themes in the existing data files
- FSDM has 3,917 entities across 16 domains in the existing data files
- App.tsx has routes for both BAIW and TAIW modules

## TASK

### 1. Create src/data/coe.json — COE data file (single file, NOT a separate folder)

This JSON contains all 10 cash optimization use cases. EVERY use case MUST include:
- bvfCapabilities[] — which existing BVF capabilities it requires (use real BVF IDs from the existing capabilities data)
- fsdmEntities[] — which FSDM entities/subject areas it needs (use real entity names from existing FSDM data)

Structure:
```json
{
  "meta": {
    "title": "Cash Optimization Engine",
    "subtitle": "A Game-Theoretic & Predictive Analytics Framework for Pakistan Commercial Banking",
    "referenceCase": "UBL (1,500+ Branches, 2,000+ ATMs, PKR 2.5T+ Deposits)",
    "totalImpact": { "min": 7800, "max": 12700, "unit": "PKR Millions/Year" },
    "sbpPolicyRate": 11,
    "cashToGDPRatio": "12-14%"
  },
  "useCases": [
    {
      "id": "UC-01",
      "name": "Branch Vault Cash Forecasting & Right-Sizing",
      "objective": "Predict each branch's daily cash demand with 95%+ accuracy and set optimal vault opening balances that eliminate both excess idle cash and stock-out risk.",
      "problemStatement": "Branch managers currently set vault cash levels based on experience and conservatism. A branch disbursing PKR 15M/day might hold PKR 50M in the vault. Across 1,500 branches, this over-provisioning locks up PKR 80–120 billion in non-productive cash. At 11% SBP policy rate, this represents PKR 8.8–13.2 billion in annualized opportunity cost.",
      "optimizationTechnique": {
        "name": "Stochastic Programming + LSTM Forecasting",
        "description": "Two-layer approach: (1) LSTM neural network trained on 3–5 years of daily branch transaction data with features including day-of-week, salary cycles, Islamic calendar, crop cycles, and macro signals outputs a probability distribution of daily cash demand. (2) Two-stage stochastic program where Stage 1 decides vault opening balance and Stage 2 recourses after observing actual demand.",
        "algorithmType": "ML + Mathematical Programming",
        "keyModels": ["LSTM Neural Network", "Two-Stage Stochastic Program", "Sample Average Approximation"]
      },
      "gameTheory": {
        "players": "Branch Manager vs Treasury",
        "gameType": "Principal-Agent",
        "equilibrium": "Nash (trust + guarantee)",
        "mechanism": "Cash Efficiency Score (CES) KPI in branch manager performance scorecard",
        "explanation": "Branch managers hoard cash to avoid stock-outs. Treasury wants to minimize idle cash system-wide. Solution: scoring mechanism rewarding proximity to model-recommended vault level, plus Treasury guarantees emergency CIT within 4 hours."
      },
      "impact": { "min": 3300, "max": 4300, "mechanism": "Reduce average vault idle cash from PKR 35M to PKR 15M per branch → release PKR 30B aggregate → repo/T-bill at 11%", "category": "Float Recovery" },
      "phase": 1,
      "phaseMonths": "1-6",
      "bvfCapabilities": [
        { "id": "BVF-047", "name": "Demand Forecasting Analytics", "theme": "Operations & Efficiency" },
        { "id": "BVF-052", "name": "Branch Performance Analytics", "theme": "Operations & Efficiency" },
        { "id": "BVF-089", "name": "Cash & Liquidity Position Management", "theme": "Financial Performance" },
        { "id": "BVF-034", "name": "Predictive Modeling Infrastructure", "theme": "Analytics & Technology" }
      ],
      "fsdmEntities": [
        { "entity": "ARRANGEMENT_BALANCE", "domain": "Agreement", "usage": "Daily vault cash position tracking per branch" },
        { "entity": "MONETARY_TRANSACTION", "domain": "Transaction", "usage": "Historical deposit/withdrawal patterns for LSTM training" },
        { "entity": "INVOLVED_PARTY", "domain": "Party", "usage": "Branch master data — type, region, capacity" },
        { "entity": "LOCATION", "domain": "Location", "usage": "Branch geographic attributes for clustering" },
        { "entity": "CALENDAR_PERIOD", "domain": "Calendar", "usage": "Islamic calendar events, salary cycles, crop seasons" }
      ],
      "inputs": ["Core Banking EOD balances", "3-5 years daily transaction history", "Branch master data", "Islamic calendar", "Crop cycle calendar", "Weather data"],
      "outputs": ["7-day cash demand forecast with confidence intervals", "Optimal vault opening balance", "Cash Efficiency Score per branch", "Emergency CIT trigger alerts"]
    }
  ],
  "revenueLevers": [
    { "lever": "Vault Cash Reduction", "min": 4500, "max": 7000, "mechanism": "Redeploy idle vault to repo/T-bills" },
    { "lever": "ATM Cash Optimization", "min": 1500, "max": 2500, "mechanism": "Reduce float-in-cassette by 30–40%" },
    { "lever": "CIT Route Optimization", "min": 300, "max": 600, "mechanism": "Fewer trips, dynamic routing" },
    { "lever": "CRR Float Engineering", "min": 800, "max": 1200, "mechanism": "Weekly averaging arbitrage" },
    { "lever": "Nostro/Vostro Optimization", "min": 500, "max": 1000, "mechanism": "Reduce idle FX balances abroad" },
    { "lever": "Denomination Management", "min": 200, "max": 400, "mechanism": "Reduce SBP penalty + sorting costs" }
  ],
  "gameTheoryMatrix": [
    { "uc": "UC-01", "players": "Branch Mgr vs Treasury", "gameType": "Principal-Agent", "equilibrium": "Nash (trust + guarantee)", "mechanism": "Cash Efficiency Score KPI" },
    { "uc": "UC-02", "players": "Bank vs CIT Provider", "gameType": "Stackelberg Leader-Follower", "equilibrium": "Stackelberg Equilibrium", "mechanism": "Shared savings contract" },
    { "uc": "UC-03", "players": "Surplus vs Deficit Branches", "gameType": "Auction (VCG)", "equilibrium": "Dominant Strategy Truthful", "mechanism": "Internal cash market" },
    { "uc": "UC-04", "players": "Bank vs SBP", "gameType": "Repeated Game", "equilibrium": "Tit-for-Tat Moderation", "mechanism": "Conservative CRR band usage" },
    { "uc": "UC-05", "players": "Bank vs Correspondent", "gameType": "Nash Bargaining", "equilibrium": "Fee-for-Service Tradeoff", "mechanism": "Explicit fee model" },
    { "uc": "UC-06", "players": "Bank vs Foreign Banks", "gameType": "Cooperative Iterated", "equilibrium": "Reciprocal Stability", "mechanism": "Preferential rate exchange" },
    { "uc": "UC-07", "players": "Bank vs Nature (demand)", "gameType": "Game Against Nature", "equilibrium": "Minimax Regret", "mechanism": "Robust denomination plan" },
    { "uc": "UC-08", "players": "CIT Fleet Vehicles", "gameType": "Cooperative Coalition", "equilibrium": "Core/Shapley Value", "mechanism": "Shapley value cost sharing" },
    { "uc": "UC-09", "players": "Bank vs Customers", "gameType": "Mechanism Design", "equilibrium": "Subgame Perfect", "mechanism": "Multi-armed bandit incentives" },
    { "uc": "UC-10", "players": "Branches (tournament)", "gameType": "Tournament/Contest", "equilibrium": "Effort Equilibrium", "mechanism": "Transfer pricing + ranking" }
  ],
  "implementationPhases": [
    { "phase": 1, "name": "Foundation", "months": "1–6", "useCases": ["UC-01"], "description": "Deploy data integration, build LSTM forecasting, establish Cash Efficiency Score baseline. Pilot 50 branches in Karachi/Lahore." },
    { "phase": 2, "name": "Optimization", "months": "7–12", "useCases": ["UC-02","UC-03","UC-04","UC-05","UC-08"], "description": "Scale ATM RL agent, inter-branch netting, CRR float engineering, nostro optimization, CIT route optimization." },
    { "phase": 3, "name": "Scale & Refine", "months": "13–18", "useCases": ["UC-06","UC-07","UC-09"], "description": "Extend to all 1,500+ branches and 2,000+ ATMs. Launch denomination optimization, digital incentivization, vostro optimization." },
    { "phase": 4, "name": "Attribution & Continuous Improvement", "months": "19–24", "useCases": ["UC-10"], "description": "Full ABC costing, transfer pricing, ALCO reporting. Model retraining cycles." }
  ]
}
```

GENERATE ALL 10 USE CASES (UC-01 through UC-10) with complete data. Here are the remaining 9:

UC-02: ATM Cash Replenishment Optimization
  - Technique: Inventory Theory (s,S Policy) + Reinforcement Learning (DQN)
  - Game: Bank vs CIT Provider (Stackelberg), Impact: PKR 396–796M
  - BVF: Channel Analytics, Self-Service Optimization, Predictive Maintenance
  - FSDM: DEVICE, SERVICE_CHANNEL, MONETARY_TRANSACTION, ARRANGEMENT

UC-03: Inter-Branch Cash Netting & Routing
  - Technique: Network Flow (Min Cost) + VCG Auction
  - Game: Surplus vs Deficit branches, Impact: PKR 560–760M
  - BVF: Network Optimization, Liquidity Management, Internal Transfer Pricing
  - FSDM: INVOLVED_PARTY, LOCATION, INTERNAL_ARRANGEMENT, MONETARY_TRANSACTION

UC-04: CRR Float Engineering & Regulatory Arbitrage
  - Technique: Dynamic Programming + Chance-Constrained Programming
  - Game: Bank vs SBP (Repeated Game), Impact: PKR 800–1,200M
  - BVF: Regulatory Compliance Analytics, Treasury Management, Reserve Optimization
  - FSDM: REGULATORY_REQUIREMENT, ARRANGEMENT_BALANCE, FINANCIAL_MARKET_POSITION

UC-05: Nostro Account Balance Optimization
  - Technique: Multi-Currency Portfolio Optimization + MDP
  - Game: Bank vs Correspondent (Nash Bargaining), Impact: PKR 500–1,000M
  - BVF: Correspondent Banking Analytics, FX Risk Analytics, Portfolio Optimization
  - FSDM: ARRANGEMENT (nostro type), INVOLVED_PARTY, FINANCIAL_MARKET_POSITION, TRADE_FINANCE_ARRANGEMENT

UC-06: Vostro Account Liability Optimization
  - Technique: Liquidity-at-Risk (LaR) Framework
  - Game: Bank vs Foreign Banks (Cooperative), Impact: PKR 75–250M
  - BVF: Liability Management, Funding Optimization, Liquidity Risk Analytics
  - FSDM: ARRANGEMENT (vostro type), INVOLVED_PARTY, FINANCIAL_MARKET_POSITION

UC-07: Denomination Mix Optimization & SBP Penalty Avoidance
  - Technique: NSGA-II Multi-Objective Optimization
  - Game: Bank vs Nature (Minimax Regret), Impact: PKR 230–420M
  - BVF: Cash Handling Analytics, Regulatory Penalty Management, Supply Chain Analytics
  - FSDM: MONETARY_TRANSACTION, PRODUCT, REGULATORY_REQUIREMENT

UC-08: CIT Route Optimization & Dynamic Scheduling
  - Technique: VRPTW + ALNS Metaheuristic
  - Game: Fleet Coalition (Shapley Value), Impact: PKR 300–600M
  - BVF: Logistics Analytics, Route Optimization, Vendor Performance Management
  - FSDM: LOCATION, INVOLVED_PARTY (CIT provider), SERVICE_ARRANGEMENT

UC-09: Digital Channel Incentivization & Cash Demand Deflection
  - Technique: Mechanism Design + Multi-Armed Bandit (Thompson Sampling)
  - Game: Bank vs Customers (Subgame Perfect), Impact: PKR 750–2,000M
  - BVF: Customer Segmentation, Campaign Optimization, Channel Migration, Behavioral Analytics
  - FSDM: INVOLVED_PARTY, SERVICE_CHANNEL, CAMPAIGN, MONETARY_TRANSACTION, PRODUCT_USAGE

UC-10: Integrated Cash P&L Attribution & Branch Profitability
  - Technique: Activity-Based Costing + Transfer Pricing Engine
  - Game: Branch Tournament (Effort Equilibrium), Impact: Measurement layer for PKR 7.8–12.7B
  - BVF: Activity-Based Costing, Branch Profitability, Transfer Pricing, Management Reporting
  - FSDM: FINANCIAL_STATEMENT_LINE, COST_CENTER, INVOLVED_PARTY, ARRANGEMENT, MONETARY_TRANSACTION

### 2. Create src/components/CashOptimizationEngine.tsx — Route: /cash-optimization

This is Page 9 of BAIW. It uses BAIW's existing Layout and purple/blue theme with amber/gold accent for COE elements.

Add "Cash Optimization" as the 9th nav item in BAIW's navigation (after Pakistan Reference) using lucide-react Banknote icon.

Page Layout:

**Section A: Hero Banner** (amber/gold gradient accent within purple/blue chrome)
- "Cash Optimization Engine — BVF Use Case Study"
- Subtitle: "How 30+ BVF capabilities and 45+ FSDM entities power PKR 7.8–12.7B in annual value for a UBL-scale bank"
- 5 stat cards: 10 Use Cases | 30+ BVF Capabilities Activated | 45+ FSDM Entities Required | PKR 7.8–12.7B Annual Impact | 4-Phase / 24-Month Roadmap

**Section B: Use Case Cards Grid** (2×5 or responsive)
Each card:
- UC-XX amber badge, use case name, phase tag (Phase 1/2/3/4)
- 1-line objective text
- Algorithm badges: ML, RL, Math Programming, Mechanism Design, etc.
- Game theory type in small italic
- Impact: "PKR X–Y M/yr" in green
- Footer: "BVF: N capabilities | FSDM: N entities" in muted text
- Click → expands Section C below

**Section C: Use Case Detail Panel** (appears below clicked card)
When a UC card is clicked, expand a detail panel showing:

LEFT COLUMN (60%):
- Full problem statement (with PKR figures in bold amber)
- Optimization technique card with algorithm description
- Game theory card: players → game type → equilibrium → mechanism → plain English explanation
- Revenue impact bar (horizontal, min-max range with fill)
- Phase: "Phase X (Months Y–Z)"

RIGHT COLUMN (40%):
- **"BVF Capabilities Required"** header
  - List of capability chips (purple badges)
  - Each chip is CLICKABLE → navigates to /capabilities with that capability highlighted
  - Shows capability name + theme

- **"FSDM Entities Required"** header
  - List of entity chips (blue badges)
  - Each chip is CLICKABLE → navigates to /model with that entity's domain selected
  - Shows entity name + domain + usage description

- **Data Inputs** list (with source icons)
- **Outputs** list (with output icons)

THIS IS THE KEY VALUE: Customer clicks UC-01 → sees it needs "Demand Forecasting Analytics" capability → clicks → sees that capability in BVF → sees which FSDM entities it needs → understands the complete chain: Business Problem → Capability → Data → Implementation.

**Section D: Revenue Waterfall** (recharts)
6 lever bars showing min/max contribution to PKR 7.8–12.7B total.

**Section E: Game Theory Strategy Matrix**
10-row table: UC | Players | Game Type | Equilibrium | Mechanism
Color-coded by game type category. Sortable columns.

**Section F: Implementation Roadmap**
Horizontal timeline (months 1–24) divided into 4 phases.
UC dots positioned in their phase. Phase descriptions below.
Color: Phase 1 green, Phase 2 blue, Phase 3 purple, Phase 4 amber.

### 3. Update App.tsx
Add route inside BAIW routes: `<Route path="cash-optimization" element={<CashOptimizationEngine />} />`

### 4. Update BAIW Dashboard (existing dashboard component)
Add a 9th quick-nav card: "Cash Optimization" with Banknote icon, amber accent.
Shows: "10 Use Cases • PKR 7.8–12.7B Impact"
Links to /cash-optimization

### 5. Update BAIW Navigation
Add "Cash Optimization" as the 9th item in the sidebar/top nav.
Icon: Banknote from lucide-react. Amber/gold accent color.

## CRITICAL RULES
- COE is a PAGE within BAIW — NOT a separate module, NOT a separate route prefix
- COE data is ONE file: src/data/coe.json — NOT a src/data/coe/ folder
- Uses BAIW's existing Layout, navigation, and theme (purple/blue with amber accent)
- Every use case MUST have bvfCapabilities[] and fsdmEntities[] arrays populated
- BVF capability chips MUST navigate to /capabilities when clicked
- FSDM entity chips MUST navigate to /model when clicked
- ZERO modifications to TAIW files (src/taiw/*)
- Do NOT create a module switcher for COE — it's already inside BAIW's nav

## GIT — After everything works:

git checkout -b feature/coe-use-case
git add -A
git commit -m "feat(baiw): add Cash Optimization Engine as Page 9 — BVF/FSDM mapped use case

- Added src/data/coe.json: 10 use cases with BVF capability + FSDM entity mappings
- Created CashOptimizationEngine.tsx: UC cards, detail panels with clickable BVF/FSDM links
- Revenue waterfall (PKR 7.8–12.7B), game theory matrix, 4-phase implementation roadmap
- Each UC links back to BVF capabilities (/capabilities) and FSDM entities (/model)
- Added /cash-optimization route, nav item, dashboard card
- Zero TAIW modifications"
git push -u origin feature/coe-use-case
git checkout master
git merge feature/coe-use-case
git push origin master
```

---

## PROMPT 2 OF 4: BAIW Report Generator

```
You are adding professional report generation to the BAIW application. After completing the maturity assessment, customers download a board-ready PDF report, gap analysis Excel, and roadmap presentation.

## EXISTING APP CONTEXT
- BAIW at src/components/, maturity assessment at /maturity route
- BACR has 8 categories with current/target scores (1-5 scale) stored in localStorage
- BVF: 112 capabilities, FSDM: 3,917 entities across 16 domains
- COE page already added (Prompt 1) with 10 use cases
- Repo on origin/master at commit after Prompt 1

## TASK

### 1. Install dependencies
Add to the project: jspdf, jspdf-autotable, file-saver
```bash
npm install jspdf jspdf-autotable file-saver
npm install -D @types/file-saver
```

### 2. Create src/data/benchmarks.json — Industry benchmark data
```json
{
  "pakistanBankingAverage": {
    "strategyVision": 2.1,
    "organizationSkills": 1.9,
    "dataGovernance": 1.7,
    "informationIntegration": 2.0,
    "analyticsTechnology": 1.8,
    "infrastructure": 2.3,
    "processAutomation": 1.6,
    "outcomesImpact": 1.5,
    "overall": 1.86
  },
  "regionalLeaders": {
    "strategyVision": 3.5,
    "organizationSkills": 3.2,
    "dataGovernance": 3.0,
    "informationIntegration": 3.4,
    "analyticsTechnology": 3.6,
    "infrastructure": 3.8,
    "processAutomation": 3.1,
    "outcomesImpact": 2.8,
    "overall": 3.18,
    "examples": "UAE National Bank, Maybank (MY), DBS (SG)"
  },
  "globalBest": {
    "strategyVision": 4.5,
    "organizationSkills": 4.2,
    "dataGovernance": 4.0,
    "informationIntegration": 4.3,
    "analyticsTechnology": 4.6,
    "infrastructure": 4.5,
    "processAutomation": 4.1,
    "outcomesImpact": 3.8,
    "overall": 4.13,
    "examples": "JPMorgan Chase, Goldman Sachs, ICBC"
  },
  "maturityLevelDescriptions": {
    "1": { "label": "Ad-Hoc", "description": "No formal analytics. Decisions based on intuition and spreadsheets." },
    "2": { "label": "Developing", "description": "Basic reporting exists. Some BI tools deployed. Siloed data." },
    "3": { "label": "Defined", "description": "Enterprise DWH in place. Standardized reporting. Some predictive models." },
    "4": { "label": "Managed", "description": "Advanced analytics embedded in operations. Real-time dashboards. ML models in production." },
    "5": { "label": "Optimizing", "description": "AI-driven decisions. Autonomous processes. Continuous learning systems." }
  }
}
```

### 3. Create src/utils/reportGenerator.ts

#### Function: generateMaturityPDF(assessmentData, bankName)

Generates an 18-page professional PDF:

Page 1: COVER PAGE
  - "[bankName] Analytics Maturity Assessment" in large font
  - Date, "Powered by Banking Analytics Intelligence Workbench (BAIW)"
  - "Prepared by Godaitec (godai.tech)" at bottom
  - Overall score shown as large number: "2.3 / 5.0"

Page 2: EXECUTIVE SUMMARY
  - Overall maturity: X.X / 5.0
  - Level label: "[Level Name] — [one-line description]"
  - 3 KEY FINDINGS (auto-generated from the 3 biggest category gaps):
    "1. Your Data Governance maturity (1.7) is significantly below regional leaders (3.0)"
    "2. Process Automation (1.6) represents the largest gap to close"
    "3. Infrastructure (2.3) is your strongest area but still below regional benchmark (3.8)"
  - 3 PRIORITY RECOMMENDATIONS (from top critical capability gaps):
    "1. Establish a Chief Data Officer role and data governance framework (closes 1.3-level gap)"
    "2. Deploy enterprise data warehouse using FSDM as reference architecture"
    "3. Build predictive analytics capability starting with customer churn and credit scoring"
  - Estimated total investment: "PKR [min]–[max] million over 3 years"

Page 3: MATURITY RADAR
  - Draw an 8-axis radar chart using jsPDF canvas
  - 3 overlaid lines: Current (solid blue), Target (dashed green), Pakistan Average (dotted gray)
  - Legend below chart
  - Category labels on each axis

Page 4: CATEGORY SCORECARD
  - 8-row table using jspdf-autotable:
    | Category | Current | Target | Gap | Level | vs Pakistan Avg |
  - Sorted by gap (largest first)
  - Color indicators: Red (<2), Amber (2-3), Green (>3)

Pages 5-12: CATEGORY DEEP DIVES (1 page per category)
  Each page:
  - Category name + score in header
  - Current level description (from maturityLevelDescriptions)
  - Target level description
  - "Key Strengths" — 2-3 bullets (areas scoring above category average)
  - "Key Gaps" — 2-3 bullets (areas scoring below category average)
  - "Top Capability Gaps in this Category" — list 3 capabilities from BVF that map to this category
  - "Recommended Actions" — 2-3 actionable recommendations

Page 13: CAPABILITY GAP MATRIX
  - Table of top 20 BVF capabilities with largest gaps:
    | # | Capability | Theme | Current Level | Required Level | Gap | Priority |
  - Priority auto-assigned: gap > 2 = Critical, 1.5-2 = High, 1-1.5 = Medium, <1 = Low
  - Top 5 rows highlighted in amber

Page 14: FSDM DATA READINESS
  - Table showing which FSDM domains are needed:
    | FSDM Domain | Entities Needed | Used By Capabilities | Implementation Priority |
  - Derived from the capability gaps → which FSDM entities they depend on
  - Shows the chain: Gap → Capability → FSDM Entity → Implementation

Page 15: ROADMAP SUMMARY
  - 3 boxes (Phase 1, 2, 3) with arrows between them
  - Each box: Phase name, month range, number of capabilities, PKR investment estimate
  - Phase 1: Quick Wins (Months 1-6, 5 capabilities, PKR 50-80M)
  - Phase 2: Core Build (Months 7-18, 15 capabilities, PKR 150-250M)
  - Phase 3: Advanced Analytics (Months 19-36, 20+ capabilities, PKR 100-200M)

Page 16: BENCHMARK COMPARISON
  - Horizontal bar chart per category (4 bars: You, Pakistan Avg, Regional, Global)
  - Summary: "You are X.X levels behind regional leaders. Closing this gap requires an estimated 18-24 months."

Page 17: NEXT STEPS
  - "1. Present this assessment to your Analytics Leadership Committee"
  - "2. Validate findings with department heads across IT, Risk, Operations, and Marketing"
  - "3. Prioritize Phase 1 Quick Win capabilities for immediate business impact"
  - "4. Engage Godaitec for a Deep Dive Workshop to build a detailed implementation plan"
  - Contact: Godaitec | godai.tech | info@godai.tech

Page 18: METHODOLOGY
  - "This assessment uses the Banking Value Framework (BVF) — 112 analytics capabilities across 6 themes"
  - "Data model readiness assessed against Teradata FSDM v13 (3,917 entities, 16 domains)"
  - "Maturity measured using BACR (Banking Analytics Capability Review) — 5-level scale"
  - Level definitions table (1-5)
  - Disclaimer: "Benchmark data based on industry research and consulting experience"

#### Function: generateGapCSV(assessmentData)
Generates a CSV file with:
- Row per BVF capability (112 rows)
- Columns: ID, Name, Theme, Group, Current Level, Required Level, Gap, Priority, FSDM Dependencies

#### Function: generateRoadmapMarkdown(assessmentData, bankName)
Generates a Markdown file formatted for easy PPTX conversion:
- 12 "slides" as markdown sections
- Title, Current State, Target State, The Gap, Phase 1/2/3, Data Foundation, Investment, ROI, Why Godaitec

### 4. Create src/components/ReportGenerator.tsx

Report generation UI panel that appears on the /maturity page.
Shows AFTER user has scored at least 1 category.

```
┌─────────────────────────────────────────────────────┐
│  📊 Generate Your Assessment Report                  │
│                                                      │
│  Organization: [____________________] (text input)   │
│                                                      │
│  Assessment: 5 of 8 categories scored                │
│  ████████████████████░░░░░  62%                      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 📄 PDF   │  │ 📊 CSV   │  │ 📑 Roadmap│          │
│  │ Maturity │  │ Capability│  │ Slides   │          │
│  │ Report   │  │ Gap      │  │ (Markdown)│          │
│  │ 18 pages │  │ Analysis │  │ 12 slides│          │
│  │[DOWNLOAD]│  │[DOWNLOAD]│  │[DOWNLOAD]│          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                      │
│  ⚠ Complete all 8 categories for the full report.    │
│  Partial assessments generate draft reports.          │
└─────────────────────────────────────────────────────┘
```

Integrate this component into the existing maturity assessment page — add it as a collapsible section at the bottom.

### 5. Wire everything
- Import ReportGenerator in the maturity page component
- Pass current assessment scores from localStorage/state to report functions
- Download triggers immediate browser file download (no new tab)

## CRITICAL RULES
- PDF must look PROFESSIONAL — proper fonts, spacing, colors, page numbers
- All content auto-generated from assessment data — no Lorem ipsum anywhere
- Organization name appears in header of every page
- Godaitec branding in footer
- Works with partial assessment (adds "DRAFT" watermark if <8 categories scored)
- Radar chart drawn using jsPDF graphics API (lines, fills) — not an image
- Tables use jspdf-autotable for clean formatting
- Zero modifications to TAIW (src/taiw/*)
- Zero modifications to COE page (src/components/CashOptimizationEngine.tsx)

## GIT — After everything works:

git checkout -b feature/baiw-reports
git add -A
git commit -m "feat(baiw): add PDF/CSV/Markdown report generation from maturity assessment

- Created src/utils/reportGenerator.ts: 18-page PDF, gap CSV, roadmap Markdown
- Created src/components/ReportGenerator.tsx: download panel on maturity page
- Added src/data/benchmarks.json: Pakistan avg, regional leaders, global best
- PDF includes: radar chart, category deep dives, capability gaps, FSDM readiness, roadmap, benchmarks
- Godaitec branding, organization name on every page
- Works with partial assessments (draft watermark)
- Zero TAIW modifications"
git push -u origin feature/baiw-reports
git checkout master
git merge feature/baiw-reports
git push origin master
```

---

## PROMPT 3 OF 4: TAIW Report Generator

```
You are adding report generation to the TAIW module. Same pattern as BAIW reports but for trade/customs analytics with WCO DM conformity assessment.

## EXISTING CONTEXT
- TAIW at src/taiw/, maturity at /taiw/maturity
- TCF: 96 capabilities, WCO DM: 727 elements, 14 domains
- BAIW reports already exist (Prompt 2)
- Uses teal/cyan theme

## TASK

### 1. Create src/data/taiw/benchmarks.json
Trade-specific benchmarks:
- Pakistan Customs average (low — WeBOC is outdated, no published MIP)
- Regional leaders: Singapore, Korea, Malaysia customs
- WCO recommended maturity targets

### 2. Create src/taiw/utils/tradeReportGenerator.ts

Same 3 functions adapted for trade:

generateTradeMaturityPDF: 18 pages with these TAIW-SPECIFIC differences:
- Page 14 becomes "WCO DM Conformity Assessment" instead of "FSDM Readiness":
  | WCO Domain | Elements | Mapped in WeBOC | Gap | Priority |
  Note: "Pakistan has NOT published a My Information Package (MIP) to WCO"
- Page 16 benchmarks compare against Singapore/Korea/Malaysia customs
- Page 17 includes WTO TFA compliance status
- All references use TCF (not BVF) and WCO DM (not FSDM)

generateTradeGapCSV: 96 rows (TCF capabilities)
generateTradeRoadmapMarkdown: Trade-specific slides including WCO conformity plan

### 3. Create src/taiw/components/TradeReportGenerator.tsx
Same UI as BAIW ReportGenerator but with "Organization" label and teal theme.
Integrated into /taiw/maturity page.

## CRITICAL RULES
- ALL references use TCF capabilities (not BVF) and WCO DM elements (not FSDM)
- WCO DM Conformity Assessment page is UNIQUE to TAIW
- Pakistan trade context: FBR, WeBOC, PSW, CPEC
- Benchmarks use customs-specific examples (SG, KR, MY — not banking examples)
- Zero modifications to BAIW (src/components/*)

## GIT — After everything works:

git checkout -b feature/taiw-reports
git add -A
git commit -m "feat(taiw): add PDF/CSV/Markdown report generation for trade maturity

- Created src/taiw/utils/tradeReportGenerator.ts with WCO DM conformity assessment
- Created src/taiw/components/TradeReportGenerator.tsx
- Added src/data/taiw/benchmarks.json: Pakistan customs, SG/KR/MY leaders
- PDF includes WCO DM conformity gap unique to TAIW
- Zero BAIW modifications"
git push -u origin feature/taiw-reports
git checkout master
git merge feature/taiw-reports
git push origin master
```

---

## PROMPT 4 OF 4: Quick Assessment Mode + v3.0.0 Release

```
You are adding a Quick Assessment mode to both BAIW and TAIW. 24 questions, 10 minutes, generates a 3-page lead-gen PDF. Also finalize and tag the release.

## EXISTING CONTEXT
- BAIW maturity at /maturity, TAIW maturity at /taiw/maturity
- Report generators exist on both (Prompts 2-3)
- Full BACR: 793 questions, full TACR: 640+ questions

## TASK

### 1. Create src/data/quickAssessment.json (BAIW)
24 questions — 3 per BACR category. CTO-answerable. Each question has 5 level descriptions.

Pick HIGH-SIGNAL questions a CTO can answer in 30 seconds:
- Strategy: "Does your bank have a Board-approved analytics strategy?"
- Organization: "Do you have a dedicated analytics team with defined roles?"
- Data Governance: "Is there a Chief Data Officer or equivalent role?"
- Information: "Do you have an enterprise data warehouse?"
- Analytics: "Are predictive models used in any business decisions?"
- Infrastructure: "Is your analytics infrastructure cloud-enabled?"
- Process: "Are any business processes automated using analytics?"
- Outcomes: "Can you measure the revenue impact of analytics initiatives?"

Each question: id, questionText, levelDescriptions (1-5 with plain English per level)

### 2. Create src/data/taiw/quickAssessment.json (TAIW)
24 trade-specific questions:
- Strategy: "Does your customs administration have a digital transformation strategy?"
- Organization: "Is there a dedicated data analytics unit within customs?"
- Data Governance: "Has your country published a WCO DM My Information Package (MIP)?"
- etc.

### 3. Update BAIW Maturity page — Add mode selector at top:

```
┌───────────┐  ┌───────────┐  ┌───────────┐
│ ⚡ QUICK   │  │ 📋 STANDARD│  │ 🔬 DEEP   │
│ 24 Qs     │  │ 80 Qs      │  │ Workshop  │
│ 10 min    │  │ 45 min     │  │ Half day  │
│ Free      │  │ Full Report│  │ Contact Us│
│ [START]   │  │ [START]    │  │ [CONTACT] │
└───────────┘  └───────────┘  └───────────┘
```

- QUICK: Single-page flow, 24 questions with 1-5 sliders, level descriptions on hover
- STANDARD: Current full assessment (existing behavior)
- DEEP: Shows CTA → "Contact Godaitec for a facilitated deep-dive workshop"

### 4. Quick Assessment PDF (3 pages)
After completing 24 questions, auto-generate and offer download:

Page 1: Cover + Radar
  "[Organization Name] — Quick Analytics Maturity Scan"
  8-axis radar: your scores vs Pakistan average
  Overall: X.X / 5.0 — "[Level Name]"

Page 2: Strengths & Gaps
  "Your Top 3 Strengths:" (highest scoring categories, green)
  "Your Top 3 Gaps:" (lowest scoring categories, red)
  Key finding sentence auto-generated

Page 3: Next Steps
  "This Quick Scan identified [N] areas for improvement."
  "For a detailed roadmap with specific capability recommendations and PKR investment estimates:"
  "→ Take the Standard Assessment (45 minutes) for a comprehensive 18-page report"
  "→ Contact Godaitec for a Deep Dive Workshop"
  Contact: godai.tech | info@godai.tech

### 5. Add same mode selector to TAIW maturity page (/taiw/maturity)
Same 3 modes, trade-specific quick questions, teal theme.

### 6. Update Suite Landing Page
Add a banner or callout:
"NEW: Take a free 10-minute Quick Maturity Scan — Banking or Trade"
With two buttons: "Banking Quick Scan →" (/maturity) | "Trade Quick Scan →" (/taiw/maturity)

## CRITICAL RULES
- Quick mode: MAXIMUM 10 minutes — 24 simple slider questions
- Questions answerable by a CTO/Director (not a data engineer)
- Level descriptions appear on hover/click, not cluttering the UI
- Quick PDF generates in <3 seconds (no complex charts — simple radar only)
- "Standard" and "Deep" options always visible as upsell
- Quick assessment data feeds into the same report generator (partial mode)
- Works identically on both BAIW and TAIW (different questions, same UX)

## GIT — Final commit + v3.0.0 tag:

git checkout -b feature/quick-assessment
git add -A
git commit -m "feat(suite): add Quick Assessment mode — 24 questions, 10 min, lead-gen PDF

- BAIW: 24 quick questions in src/data/quickAssessment.json
- TAIW: 24 quick questions in src/data/taiw/quickAssessment.json
- Mode selector (Quick/Standard/Deep) on both maturity pages
- 3-page Quick PDF: radar + strengths/gaps + next steps CTA
- Suite landing updated with Quick Scan callout
- Lead generation funnel: Free scan → Full report → Workshop"
git push -u origin feature/quick-assessment
git checkout master
git merge feature/quick-assessment

# Tag v3.0.0 release
git tag -a v3.0.0 -m "v3.0.0 — Analytics Intelligence Suite with deliverables

BAIW (Banking Analytics Intelligence Workbench):
  - 9 pages (8 original + Cash Optimization Engine use case)
  - COE: 10 use cases mapped to BVF capabilities + FSDM entities
  - Report Generator: 18-page PDF, CSV gap analysis, Markdown roadmap
  - Quick Assessment: 24 questions, 10 min, 3-page lead-gen PDF
  - Benchmarks: Pakistan avg, regional leaders, global best

TAIW (Trade Analytics Intelligence Workbench):
  - 8 pages with WCO DM v4.2 + TCF capabilities
  - Report Generator: 18-page PDF with WCO DM conformity assessment
  - Quick Assessment: 24 trade-specific questions

Suite Total:
  - 17 interactive pages
  - 208 capabilities (112 BVF + 96 TCF)
  - 4,644 data model elements
  - 3 downloadable report types per module
  - 10 cash optimization use cases mapped to data model
  - Customer deliverables: board-ready PDF, gap analysis, roadmap"

git push origin v3.0.0
git push origin master
```

---

## Execution Checklist

```
□ Prompt 1: COE Use Case Page      → git push → verify /cash-optimization works
□ Prompt 2: BAIW Report Generator  → git push → verify PDF downloads from /maturity
□ Prompt 3: TAIW Report Generator  → git push → verify PDF downloads from /taiw/maturity
□ Prompt 4: Quick Assessment       → git push → tag v3.0.0 → verify quick scan flow

Final verify:
□ Suite landing shows BAIW + TAIW + Quick Scan callout
□ BAIW /cash-optimization: UC chips link to /capabilities and /model
□ BAIW /maturity: Quick/Standard/Deep modes + PDF download
□ TAIW /taiw/maturity: Quick/Standard/Deep modes + PDF download
□ git log --oneline shows 4 feature merges
□ git tag shows v2.0.0 and v3.0.0
```
