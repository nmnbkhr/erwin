# Corrected Suite Architecture & Report Generation Prompts

---

## PART 1: The Corrected Architecture

### What Was Wrong Before

```
WRONG (what we had):
├── BAIW (standalone)     → FSDM
├── TAIW (standalone)     → WCO DM
└── COE  (standalone)     → No data model ← PROBLEM
```

### What's Actually Right

```
CORRECT:
├── BAIW (Banking Analytics Intelligence Workbench) → FSDM v13
│   ├── 8 existing pages (Dashboard, Model, Capabilities, Graph, etc.)
│   ├── BVF: 112 capabilities across 6 themes
│   ├── COE is a USE CASE of BAIW ← lives INSIDE BAIW
│   │   └── 10 Cash Use Cases mapped to:
│   │       ├── BVF Capabilities (which ones does cash optimization need?)
│   │       └── FSDM Entities (which data entities power the optimization?)
│   └── Report Generation (PDF/PPTX/Excel outputs)
│
└── TAIW (Trade Analytics Intelligence Workbench) → WCO DM v4.2
    ├── 8 existing pages (Dashboard, Model, Capabilities, Graph, etc.)
    ├── TCF: 96 capabilities across 6 themes
    └── Report Generation (PDF/PPTX/Excel outputs)
```

### COE ↔ BVF Capability Mapping

The 10 cash use cases map directly to existing BVF capabilities. COE is the PROOF that the BVF framework works — it shows a real business problem (cash optimization) and traces it back to which capabilities and which FSDM entities are needed.

| COE Use Case | BVF Capabilities Required | BVF Theme |
|-------------|--------------------------|-----------|
| **UC-01: Vault Forecasting** | Demand Forecasting, Branch Performance Analytics, Cash Position Management | Operations & Efficiency |
| **UC-02: ATM Optimization** | Channel Analytics, Inventory Optimization, Predictive Maintenance | Operations & Efficiency |
| **UC-03: Inter-Branch Netting** | Network Optimization, Transfer Pricing, Liquidity Management | Operations & Efficiency |
| **UC-04: CRR Float Engineering** | Regulatory Compliance Analytics, Treasury Analytics, Reserve Management | Risk & Compliance |
| **UC-05: Nostro Optimization** | Correspondent Banking Analytics, FX Risk Analytics, Portfolio Optimization | Risk & Compliance |
| **UC-06: Vostro Optimization** | Liability Management, Liquidity Risk Analytics, Funding Optimization | Risk & Compliance |
| **UC-07: Denomination Mix** | Cash Handling Analytics, Regulatory Penalty Analytics, Supply Chain Optimization | Operations & Efficiency |
| **UC-08: CIT Routing** | Logistics Analytics, Route Optimization, Vendor Performance | Operations & Efficiency |
| **UC-09: Digital Incentives** | Customer Segmentation, Channel Migration, Campaign Optimization, Behavioral Analytics | Customer Intelligence |
| **UC-10: Cash P&L** | Activity-Based Costing, Branch Profitability, Transfer Pricing, Management Reporting | Financial Performance |

### COE ↔ FSDM Entity Mapping

Every COE use case traces back to specific FSDM entities/subject areas:

| COE Use Case | FSDM Subject Areas | Key FSDM Entities |
|-------------|-------------------|-------------------|
| **UC-01** | Transaction, Product, Party, Geography | ACCOUNT_BALANCE, MONETARY_TRANSACTION, BRANCH, VAULT_POSITION, CALENDAR_EVENT |
| **UC-02** | Transaction, Channel, Product | ATM_TRANSACTION, DEVICE, CASH_DISPENSE, DENOMINATION, SERVICE_CHANNEL |
| **UC-03** | Transaction, Party, Geography | BRANCH_TRANSFER, INTERNAL_ACCOUNT, CASH_IN_TRANSIT, ROUTE, DISTANCE_MATRIX |
| **UC-04** | Compliance, Financial Mgmt | REGULATORY_DEPOSIT, CRR_POSITION, RESERVE_REQUIREMENT, OVERNIGHT_PLACEMENT |
| **UC-05** | Agreement, Financial Mgmt, Party | NOSTRO_ACCOUNT, CORRESPONDENT_BANK, FX_POSITION, LC_OBLIGATION, SETTLEMENT |
| **UC-06** | Agreement, Financial Mgmt, Party | VOSTRO_ACCOUNT, CORRESPONDENT_BANK, DEPOSIT_PRODUCT, FUNDING_SOURCE |
| **UC-07** | Transaction, Product | DENOMINATION_INVENTORY, CURRENCY_SORT, SBP_PENALTY, CASH_PROCESS_CENTER |
| **UC-08** | Geography, Party, Transaction | CIT_VEHICLE, CIT_ROUTE, BRANCH_LOCATION, TIME_WINDOW, SERVICE_PROVIDER |
| **UC-09** | Campaign, Channel, Party | CUSTOMER_SEGMENT, DIGITAL_CHANNEL, INCENTIVE, CAMPAIGN_RESPONSE, TRANSACTION_CHANNEL |
| **UC-10** | Financial Mgmt, All | COST_POOL, ACTIVITY_COST, BRANCH_PNL, TRANSFER_PRICE, CASH_COST_ALLOCATION |

This mapping is what makes COE a legitimate BAIW use case — not a standalone app. The customer sees: "To build UC-01 (Vault Forecasting), you need BVF capabilities 47, 52, 89 and FSDM entities from Transaction and Product domains."

---

## PART 2: What To Build — 4 Prompts

### Prompt 1: COE As BAIW Use Case Page (Not Standalone Module)
### Prompt 2: BAIW Report Generator (PDF + PPTX + Excel)
### Prompt 3: TAIW Report Generator (PDF + PPTX + Excel)
### Prompt 4: Quick Assessment Mode (24 Questions)

---

## PROMPT 1: COE as a BAIW Use Case Page

```
You are enhancing the existing BAIW (Banking Analytics Intelligence Workbench) React + TypeScript application by adding a Cash Optimization Engine page. 

CRITICAL: COE is NOT a separate module. It is a USE CASE page within BAIW that demonstrates how BVF capabilities and FSDM entities map to a real-world optimization problem.

## CONTEXT
- BAIW exists in src/components/ with routes at /, /model, /capabilities, /graph, /maturity, /analytics, /roadmap, /pakistan
- BAIW uses purple/blue gradient theme
- BVF has 112 capabilities, FSDM has 3,917 entities across 16 domains
- Data lives in src/data/

## TASK

### 1. Create src/data/coe.json — COE data file (NOT a separate data folder)

Structure:
{
  "meta": {
    "title": "Cash Optimization Engine",
    "subtitle": "A Game-Theoretic & Predictive Analytics Framework",
    "referenceCase": "UBL (1,500+ Branches, 2,000+ ATMs, PKR 2.5T+ Deposits)",
    "totalImpact": { "min": 7800, "max": 12700, "unit": "PKR Millions/Year" },
    "sbpPolicyRate": 11
  },
  "useCases": [
    {
      "id": "UC-01",
      "name": "Branch Vault Cash Forecasting & Right-Sizing",
      "objective": "Predict each branch's daily cash demand with 95%+ accuracy and set optimal vault opening balances.",
      "problemStatement": "Branch managers hold PKR 50M in vaults when they disburse PKR 15M/day. Across 1,500 branches, this over-provisioning locks up billions at 11% opportunity cost.",
      "optimizationTechnique": "Stochastic Programming + LSTM Forecasting",
      "algorithmType": "ML + Mathematical Programming",
      "keyModels": ["LSTM Neural Network", "Two-Stage Stochastic Program", "Sample Average Approximation"],
      "gameTheory": {
        "players": "Branch Manager vs Treasury",
        "gameType": "Principal-Agent",
        "equilibrium": "Nash (trust + guarantee)",
        "mechanism": "Cash Efficiency Score KPI"
      },
      "impact": { "min": 3300, "max": 4300, "mechanism": "Vault idle cash → repo/T-bill placement" },
      "phase": 1,
      "bvfCapabilities": [
        { "id": "BVF-047", "name": "Demand Forecasting", "theme": "Operations & Efficiency" },
        { "id": "BVF-052", "name": "Branch Performance Analytics", "theme": "Operations & Efficiency" },
        { "id": "BVF-089", "name": "Cash Position Management", "theme": "Operations & Efficiency" }
      ],
      "fsdmEntities": [
        { "entity": "ACCOUNT_BALANCE", "domain": "Transaction", "usage": "Daily vault position tracking" },
        { "entity": "MONETARY_TRANSACTION", "domain": "Transaction", "usage": "Cash deposit/withdrawal history" },
        { "entity": "BRANCH", "domain": "Party", "usage": "Branch master data, type, capacity" },
        { "entity": "CALENDAR_EVENT", "domain": "Financial Management", "usage": "Eid, Ramadan, salary days, crop season" }
      ]
    }
    // ... UC-02 through UC-10 following same structure
    // EVERY UC must have bvfCapabilities[] and fsdmEntities[] populated
  ],
  "revenueLevers": [
    { "lever": "Vault Cash Reduction", "min": 4500, "max": 7000, "mechanism": "Redeploy idle vault to repo/T-bills" },
    { "lever": "ATM Cash Optimization", "min": 1500, "max": 2500, "mechanism": "Reduce float-in-cassette by 30-40%" },
    { "lever": "CIT Route Optimization", "min": 300, "max": 600, "mechanism": "Fewer trips, dynamic routing" },
    { "lever": "CRR Float Engineering", "min": 800, "max": 1200, "mechanism": "Weekly averaging arbitrage" },
    { "lever": "Nostro/Vostro Optimization", "min": 500, "max": 1000, "mechanism": "Reduce idle FX balances" },
    { "lever": "Denomination Management", "min": 200, "max": 400, "mechanism": "Reduce SBP penalty + sorting costs" }
  ],
  "gameTheoryMatrix": [
    // All 10 rows: ucId, players, gameType, equilibrium, mechanism
  ],
  "implementationPhases": [
    { "phase": 1, "name": "Foundation", "months": "1-6", "useCases": ["UC-01"], "description": "Deploy forecasting, establish baseline CES metrics" },
    { "phase": 2, "name": "Optimization", "months": "7-12", "useCases": ["UC-02","UC-03","UC-04","UC-05","UC-08"], "description": "Scale ATM, netting, CRR, nostro, CIT optimization" },
    { "phase": 3, "name": "Scale & Refine", "months": "13-18", "useCases": ["UC-06","UC-07","UC-09"], "description": "Vostro, denomination, digital incentivization" },
    { "phase": 4, "name": "Attribution", "months": "19-24", "useCases": ["UC-10"], "description": "P&L attribution, transfer pricing, ALCO reporting" }
  ]
}

Generate ALL 10 use cases with complete bvfCapabilities[] and fsdmEntities[] arrays.
Map at least 3 BVF capabilities and 3-5 FSDM entities per use case.
Use realistic BVF IDs (BVF-001 through BVF-112) and FSDM entity names from the existing BAIW data.

### 2. Create src/components/CashOptimizationEngine.tsx — NEW PAGE in BAIW

This is page 9 of BAIW (added to existing 8 pages). Route: /cash-optimization

Layout:
- Uses BAIW's existing Layout component and navigation
- Added as a new nav item: "Cash Optimization" with Banknote icon
- Amber/gold accent color WITHIN the purple/blue BAIW chrome (not a separate theme)

Page Structure:

**Section A: Hero Banner**
- "Cash Optimization Engine — Use Case Study" title
- "How BVF capabilities and FSDM entities power PKR 7.8–12.7B in annual value"
- 4 stat cards: 10 Use Cases | 30+ BVF Capabilities Used | 45+ FSDM Entities Mapped | PKR 7.8–12.7B Impact

**Section B: Use Case Cards (main content)**
- 2×5 grid of 10 UC cards, each showing:
  * UC-XX badge (amber), name, phase tag
  * 1-line objective
  * Optimization technique badge (ML, RL, Math, etc.)
  * Game theory type badge
  * Impact range: "PKR X–Y M/year"
  * "BVF: 3 capabilities | FSDM: 4 entities" count badges
  * Click to expand

**Section C: Use Case Detail (expanded view)**
When a UC card is clicked, it expands (or opens a right panel) showing:
- Full problem statement with highlighted PKR figures
- Optimization technique explanation (3-4 sentences)
- Game Theory card: players, game type, equilibrium, mechanism
- **BVF Capability Links** — each capability shown as a clickable chip that navigates to /capabilities with that capability selected
- **FSDM Entity Links** — each entity shown as a clickable chip that navigates to /model with that entity's domain selected
- Revenue impact bar showing min-max range
- Phase badge with month range

THIS IS THE KEY DIFFERENTIATOR: Every use case links BACK to BVF capabilities and FSDM entities.
The customer sees: "UC-01 needs these 3 capabilities → click to see them in the BVF framework → click to see which FSDM entities they require → now you know exactly what to build."

**Section D: Revenue Waterfall**
Recharts waterfall chart showing 6 levers contributing to PKR 7.8-12.7B.

**Section E: Game Theory Strategy Matrix**
10-row table: UC | Players | Game Type | Equilibrium | Mechanism

**Section F: Implementation Roadmap**
4-phase horizontal timeline with UC dots positioned in their phase.

### 3. Update App.tsx
Add route: <Route path="cash-optimization" element={<CashOptimizationEngine />} />
Add to navigation items in the Layout component.

### 4. Update Dashboard
Add a "Cash Optimization" quick-nav card on the main BAIW dashboard linking to /cash-optimization.
Use amber/gold accent to distinguish it from the 7 existing cards.

## CRITICAL RULES
- COE is a PAGE within BAIW, NOT a separate module
- COE data lives in src/data/coe.json, NOT in src/data/coe/ folder
- COE page uses BAIW's Layout, nav, and purple/blue theme with amber accent
- Every UC MUST link to BVF capabilities and FSDM entities
- Clicking a BVF capability chip navigates to /capabilities
- Clicking an FSDM entity chip navigates to /model
- Zero modifications to TAIW (src/taiw/)
- Do NOT create a separate module switcher for COE — it's already inside BAIW
```

---

## PROMPT 2: BAIW Report Generator

```
You are adding report generation to the existing BAIW React + TypeScript application. This creates downloadable PDF, PPTX, and Excel files from the maturity assessment data.

## CONTEXT
- BAIW exists at src/components/ with maturity assessment at /maturity
- The maturity assessment (BACR) has 8 categories with current/target scores (1-5 scale)
- BVF has 112 capabilities, FSDM has 3,917 entities across 16 domains
- Pakistan banking context data exists in the app

## TASK

### 1. Install dependencies
```bash
npm install jspdf jspdf-autotable file-saver
```

### 2. Create src/utils/reportGenerator.ts

This utility generates 3 types of reports from BAIW assessment data.

#### Input Shape (from maturity assessment state):
```typescript
interface AssessmentData {
  bankName: string;           // User enters their bank name
  assessmentDate: string;
  assessmentMode: "quick" | "standard" | "deep";
  categoryScores: {
    category: string;         // e.g. "Strategy & Vision"
    currentScore: number;     // 1-5
    targetScore: number;      // 1-5
    gap: number;              // target - current
    questionCount: number;
    answeredCount: number;
  }[];
  overallScore: number;       // weighted average
  overallTarget: number;
  capabilityGaps: {
    capabilityId: string;
    capabilityName: string;
    theme: string;
    currentLevel: number;
    requiredLevel: number;
    gap: number;
    fsdmDependencies: string[];  // FSDM entities needed
    priority: "Critical" | "High" | "Medium" | "Low";
  }[];
  roadmapPhases: {
    phase: number;
    name: string;
    capabilities: string[];   // capability IDs
    estimatedMonths: number;
    estimatedInvestmentPKR: { min: number; max: number };
  }[];
}
```

#### Report 1: generateMaturityPDF(data: AssessmentData)
Produces a professional PDF report (15-20 pages):

```
Page 1: COVER
  - "[bankName] Analytics Maturity Assessment"
  - Date, "Prepared by Godaitec (godai.tech)"
  - Assessment mode badge
  - BAIW logo

Page 2: EXECUTIVE SUMMARY
  - Overall maturity score: X.X / 5.0 with visual meter
  - "Your bank operates at Level [X] — [level name]"
  - 3 key findings (auto-generated from biggest gaps)
  - 3 priority recommendations (from top critical capabilities)
  - "Estimated investment to reach target: PKR [X-Y] million"

Page 3: MATURITY RADAR
  - 8-axis radar chart (jspdf can draw SVG or canvas-rendered image)
  - Current scores (solid line) vs. Target (dashed) vs. Industry Benchmark (dotted)
  - Industry benchmark: Pakistan banking average (hardcoded at realistic values)
  - Legend explaining the 3 lines

Page 4: CATEGORY SCORECARD
  - 8 rows, each showing:
    Category | Current ████░░ 2.3 | Target ██████ 3.5 | Gap 1.2
  - Color coded: Red (<2), Amber (2-3), Green (>3)
  - Sorted by gap size (biggest gap first)

Pages 5-12: CATEGORY DEEP DIVES (1 page per category)
  Each page:
  - Category name and score
  - Maturity level description for current level
  - Key strengths (answered questions with high scores)
  - Key gaps (answered questions with low scores)
  - Top 3 capability gaps within this category
  - Recommended actions (2-3 bullets)

Page 13: CAPABILITY GAP MATRIX
  - Auto-table showing top 20 capability gaps:
    Capability | Theme | Current | Required | Gap | Priority | FSDM Dependencies
  - Sorted by priority (Critical first) then gap size
  - Color coded rows: Critical=red, High=orange, Medium=yellow

Page 14: FSDM DATA READINESS
  - Which FSDM domains are needed to close the top gaps
  - Domain | Entities Needed | Estimated Coverage | Gap
  - Shows the connection: "Your capability gaps require these data entities"

Page 15: ROADMAP SUMMARY
  - 3-phase visual (boxes with arrows)
  - Phase 1: Quick Wins (months, capabilities, PKR estimate)
  - Phase 2: Core Build
  - Phase 3: Advanced Analytics
  - Total investment range

Page 16: BENCHMARK COMPARISON
  - Your bank vs. Pakistan average vs. Regional leaders vs. Global best
  - Bar chart per category showing all 4 benchmarks
  - "You are X.X levels behind regional leaders"

Page 17: NEXT STEPS
  - "1. Review this assessment with your analytics leadership team"
  - "2. Prioritize Phase 1 capabilities for immediate impact"
  - "3. Engage Godaitec for a deep-dive workshop to build detailed implementation plan"
  - Contact info, website

Page 18: METHODOLOGY
  - Brief BVF, BACR, FSDM explanation
  - Maturity level definitions (1-5)
  - Disclaimer
```

#### Report 2: generateGapExcel(data: AssessmentData)
Produces an Excel/CSV file with:
- Sheet 1: Category Scores (8 rows with current, target, gap)
- Sheet 2: All Capability Gaps (112 rows with all capability details)
- Sheet 3: FSDM Entity Requirements (entities needed per capability gap)
- Sheet 4: Roadmap Detail (phases, capabilities, timeline, investment)

For simplicity, generate CSV format (since xlsx requires heavy libraries).
4 files zipped together, or 4 separate downloads.

#### Report 3: generateRoadmapPPTX(data: AssessmentData)
This is complex — for V1, generate a MARKDOWN file formatted for easy copy into PowerPoint:
```markdown
# [bankName] Analytics Transformation Roadmap

## Slide 1: Title
[bankName] Analytics Transformation Roadmap
Prepared by Godaitec | [date]

## Slide 2: Current State
Overall Maturity: X.X / 5.0
Key Gaps: [list top 3]

## Slide 3: Target State
...
```

The user copies into their own PPTX template. Phase 2 can add actual PPTX generation.

### 3. Create src/components/ReportGenerator.tsx — UI Component

Add a "Generate Report" panel to the maturity assessment page (/maturity).

It appears AFTER the user has completed at least one category of the assessment.

Layout:
```
┌─────────────────────────────────────────────┐
│  📊 Generate Your Assessment Report         │
│                                              │
│  Bank Name: [____________] (text input)      │
│                                              │
│  Assessment completed: 5/8 categories        │
│  ████████████████████░░░░  62% complete      │
│                                              │
│  Available Reports:                          │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 📄 PDF   │ │ 📊 Excel │ │ 📑 PPTX  │    │
│  │ Maturity │ │ Gap      │ │ Roadmap  │    │
│  │ Report   │ │ Analysis │ │ Slides   │    │
│  │ 18 pages │ │ 4 sheets │ │ 12 slides│    │
│  │[Download]│ │[Download]│ │[Download]│    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                              │
│  ⚠ Complete all 8 categories for full report │
│  Partial reports generated from available    │
│  data with "incomplete" watermarks.          │
└─────────────────────────────────────────────┘
```

### 4. Add benchmark data to src/data/benchmarks.json
```json
{
  "pakistanAverage": {
    "strategyVision": 2.1, "organizationSkills": 1.9,
    "dataGovernance": 1.7, "informationIntegration": 2.0,
    "analyticsTechnology": 1.8, "infrastructure": 2.3,
    "processAutomation": 1.6, "outcomesImpact": 1.5
  },
  "regionalLeaders": {
    "strategyVision": 3.5, "organizationSkills": 3.2,
    "dataGovernance": 3.0, "informationIntegration": 3.4,
    "analyticsTechnology": 3.6, "infrastructure": 3.8,
    "processAutomation": 3.1, "outcomesImpact": 2.8
  },
  "globalBest": {
    "strategyVision": 4.5, "organizationSkills": 4.2,
    "dataGovernance": 4.0, "informationIntegration": 4.3,
    "analyticsTechnology": 4.6, "infrastructure": 4.5,
    "processAutomation": 4.1, "outcomesImpact": 3.8
  }
}
```

## CRITICAL RULES
- PDF must be genuinely professional — no placeholder text, no "Lorem ipsum"
- All text auto-generated from assessment data — no manual editing needed
- Bank name appears on every page header
- Godaitec branding in footer of every page
- Radar chart and bar charts rendered via canvas then embedded in PDF
- Report works even with partial assessment (watermark: "Draft — Partial Assessment")
- Download triggers immediate file save, no new tab
- Zero modifications to TAIW
```

---

## PROMPT 3: TAIW Report Generator

```
You are adding report generation to the existing TAIW module in the BAIW application. Same pattern as BAIW reports but adapted for trade/customs analytics.

## CONTEXT
- TAIW exists at src/taiw/ with maturity assessment (TACR) at /taiw/maturity
- TCF has 96 capabilities, WCO DM has 727 elements across 14 domains
- Pakistan trade context: FBR, WeBOC, PSW, CPEC

## TASK

### 1. Create src/taiw/utils/tradeReportGenerator.ts

Same pattern as BAIW's reportGenerator.ts but with trade-specific content:

#### Trade Maturity PDF (18 pages):
```
Page 1: Cover — "[Organization] Trade Analytics Maturity Assessment"
Page 2: Executive Summary — overall TACR score, key findings
Page 3: Maturity Radar — 8 TACR categories
Page 4: Category Scorecard
Pages 5-12: Category Deep Dives
Page 13: Capability Gap Matrix (top 20 TCF gaps)
Page 14: WCO DM Conformity Assessment
  - Which WCO DM domains are implemented vs. missing
  - "Pakistan has NOT published a MIP (My Information Package)"
  - Gap table: WCO Domain | Elements Required | Currently Mapped in WeBOC | Gap
Page 15: Roadmap Summary
Page 16: Benchmark Comparison
  - Your organization vs. Pakistan Customs average
  - vs. Regional leaders (Singapore, Korea, Malaysia)
  - vs. WCO recommended maturity
Page 17: Next Steps + WTO TFA compliance status
Page 18: Methodology (TCF, TACR, WCO DM explanation)
```

#### Trade benchmarks (src/data/taiw/benchmarks.json):
```json
{
  "pakistanCustomsAverage": {
    "strategyVision": 1.8, "organizationSkills": 1.5,
    "dataGovernance": 1.3, "informationIntegration": 1.6,
    "analyticsTechnology": 1.4, "infrastructure": 2.0,
    "processAutomation": 1.5, "outcomesImpact": 1.2
  },
  "regionalLeaders": {
    "strategyVision": 4.0, "organizationSkills": 3.8,
    "dataGovernance": 3.5, "informationIntegration": 3.9,
    "analyticsTechnology": 4.2, "infrastructure": 4.0,
    "processAutomation": 3.7, "outcomesImpact": 3.5
  }
}
```

### 2. Add ReportGenerator UI to TAIW maturity page
Same 3-report panel (PDF, Excel, PPTX) adapted for trade context.
Organization name input instead of bank name.

## CRITICAL RULES
- TAIW reports reference WCO DM (not FSDM)
- TAIW reports reference TCF capabilities (not BVF)
- All Pakistan trade context: FBR, WeBOC, PSW, CPEC, SROs
- WCO DM conformity page is unique to TAIW (BAIW doesn't have this)
- Zero modifications to BAIW
```

---

## PROMPT 4: Quick Assessment Mode (24 Questions)

```
You are adding a Quick Assessment mode to both BAIW and TAIW maturity assessments. Nobody answers 793 questions. The quick mode has 24 questions (3 per category) and takes 10 minutes.

## CONTEXT
- BAIW maturity at /maturity has 8 categories with full BACR (793 questions)
- TAIW maturity at /taiw/maturity has 8 categories with full TACR (640+ questions)
- Report generators already exist (from previous prompts)

## TASK

### 1. Create Quick Assessment data

#### BAIW Quick Questions (src/data/quickAssessment.json):
24 questions — 3 per category. Each question is a HIGH-SIGNAL question that best represents the category.

Example format:
```json
{
  "categories": [
    {
      "category": "Strategy & Vision",
      "questions": [
        {
          "id": "QA-SV-01",
          "question": "Does your bank have a formal analytics strategy document approved by the Board?",
          "levelDescriptions": {
            "1": "No analytics strategy exists",
            "2": "Informal analytics initiatives exist but no documented strategy",
            "3": "Written strategy exists but not fully adopted across departments",
            "4": "Board-approved strategy with KPIs, actively tracked quarterly",
            "5": "Analytics strategy integrated into overall business strategy with real-time tracking"
          }
        },
        // 2 more questions for this category
      ]
    },
    // 7 more categories, 3 questions each
  ]
}
```

Pick questions that a CTO can answer in 30 seconds — not technical deep-dives.
Questions should be: "Do you have X?", "How mature is Y?", "To what extent is Z?"

#### TAIW Quick Questions (src/data/taiw/quickAssessment.json):
Same structure, 24 questions tailored to trade/customs.

### 2. Update Maturity Assessment pages

Add a mode selector at the TOP of both maturity pages:

```
┌─────────────────────────────────────────────────────┐
│  Choose Assessment Mode:                             │
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │ ⚡ QUICK   │  │ 📋 STANDARD│  │ 🔬 DEEP    │    │
│  │ 24 Qs      │  │ 80 Qs      │  │ 200+ Qs    │    │
│  │ 10 minutes │  │ 45 minutes │  │ Half day   │    │
│  │ High-level │  │ Full report│  │ + RFP doc  │    │
│  │ FREE       │  │ $2-5K      │  │ $15-30K    │    │
│  │ [START]    │  │ [START]    │  │ [CONTACT]  │    │
│  └────────────┘  └────────────┘  └────────────┘    │
│                                                      │
│  Quick = self-service. Standard = full maturity      │
│  report with actionable roadmap. Deep = facilitated  │
│  workshop with comprehensive analysis.               │
└─────────────────────────────────────────────────────┘
```

- QUICK: Shows 24 questions in a clean single-page flow. Each question is a 1-5 slider with level descriptions shown on hover. Submit → generates a 2-3 page PDF summary.
- STANDARD: Current full assessment (show first 10 questions per category = 80 total)
- DEEP: Shows a "Contact Godaitec" CTA — this mode requires facilitation

### 3. Quick Report (2-3 page PDF)

After completing the Quick Assessment:
```
Page 1: Cover + Radar Chart
  "[Bank Name] Quick Analytics Scan"
  8-axis radar with current scores + Pakistan benchmark
  Overall score: X.X / 5.0

Page 2: Strengths & Gaps
  Top 3 strongest categories (green badges)
  Top 3 weakest categories (red badges)
  "Key Finding: Your bank is strongest in Infrastructure but weakest in Data Governance"

Page 3: Next Steps
  "This Quick Scan identified [N] potential improvement areas."
  "For a detailed roadmap with specific capability recommendations and investment estimates, consider our Standard Assessment."
  "Contact: Godaitec (godai.tech) | info@godai.tech"
  QR code to godai.tech
```

This is the LEAD GENERATION tool. Free assessment → 2-page report → "Want more? Contact us."

## CRITICAL RULES
- Quick mode takes MAXIMUM 10 minutes — 24 questions with simple sliders
- Questions must be answerable by a CTO/Director (not a data engineer)
- Level descriptions visible on hover, not cluttering the interface
- Quick PDF generates in under 3 seconds
- Quick report includes benchmark comparison (Pakistan average)
- "Standard Assessment" and "Deep Dive" buttons always visible as upsell
- Works on both BAIW and TAIW identically (different questions, same UX)
```

---

## EXECUTION ORDER

| # | Prompt | What It Does | Impact |
|---|--------|-------------|--------|
| 1 | COE inside BAIW | Adds cash optimization as page 9 of BAIW, mapped to BVF + FSDM | Shows how the framework solves real problems |
| 2 | BAIW Reports | PDF + Excel + PPTX generation from maturity assessment | Customer gets board-ready deliverables |
| 3 | TAIW Reports | Same for trade/customs with WCO DM conformity | Trade customer gets deliverables |
| 4 | Quick Assessment | 24-question mode for both BAIW and TAIW | Lead generation — free self-service assessment |

Run 1→2→3→4. After this, the suite transforms from "impressive demo" to "revenue-generating product."

---

## After These 4 Prompts, the Customer Journey Is:

```
BAIW:
  Visit → Quick Scan (10 min, free) → 2-page PDF with radar →
  "Want full report?" → Standard Assessment (45 min) →
  18-page PDF + Gap Excel + Roadmap → "Want implementation?" →
  Contact Godaitec → Deep Dive Workshop ($15-30K)

  BONUS: Cash Optimization page shows REAL value — 
  "Here's PKR 7.8-12.7B your bank is leaving on the table, 
   and here are the exact BVF capabilities and FSDM entities 
   you need to capture it."

TAIW:
  Visit → Quick Scan → 2-page PDF with trade radar →
  "Want WCO conformity assessment?" → Standard Assessment →
  18-page PDF with WCO DM gaps + Modernization Roadmap →
  Contact Godaitec
```

The customer understands because they GET SOMETHING:
- A PDF with their bank's name on the cover
- A radar chart showing where they stand
- A number: "PKR 7.8B opportunity you're missing"
- A roadmap: "Here's how to get there in 24 months"
