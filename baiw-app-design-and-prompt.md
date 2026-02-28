# BANKING ANALYTICS INTELLIGENCE WORKBENCH (BAIW)

## Application Design Document & Claude Code Prompt

---

## 1. CONCEPT

**BAIW** is a professional-grade React web application that integrates ALL artifacts from the `nmnbkhr/erwin` repository — FSDM data model (3,917 entities), BVF capability framework (112 sub-capabilities), BACR maturity assessment (793 questions), profitability star schema, gap extensions, Pakistan banking context, and 16 enriched domain prompts — into a single interactive platform for bank data strategy consulting.

**Primary Users:** Banking data architects, CFOs, CIOs, management consultants, Teradata/FSDM implementation teams.

**Use Case:** A consultant sits with a Pakistan bank client, opens BAIW, and can:
1. Show what data entities the bank needs to build capability X
2. Assess current maturity vs. target across all 112 capabilities
3. Design a phased roadmap with estimated investment
4. Explore the profitability engine star schema
5. Identify data gaps and generate extension DDL
6. Reference Pakistan-specific SBP/KIBOR/Islamic context

---

## 2. DATA ARCHITECTURE

All data comes from pre-parsed repo outputs — NO backend needed. Data is embedded as JSON/CSV modules in the React app, loaded at build time.

### Data Sources from `nmnbkhr/erwin` repo:

```
INPUT DATA FILES (copy from repo to app's /src/data/):

FROM fsdm_output/:
  fsdm_entity_catalog.csv        → entities.json       (3,917 entities)
  fsdm_relationships.csv         → relationships.json   (5,636 relationships)
  fsdm_data_dictionary.csv       → attributes.json      (15,364 attributes — LARGE, lazy-load)
  fsdm_domain_map.json           → domains.json         (entity→domain mapping)
  fsdm_inheritance_tree.json     → inheritance.json      (839 chains)
  fsdm_domain_classification.csv → domainClassification.json

FROM bvf_fsdm_output/:
  bvf_capability_summary.csv     → capabilities.json    (112 sub-capabilities)
  bvf_data_requirements.csv      → dataRequirements.json (113 data requirements)
  bvf_to_fsdm_entity_mapping.csv → bvfFsdmMapping.json  (360 BVF→FSDM mappings)
  capability_fsdm_dependencies.csv → dependencies.json   (5,218 dependencies)
  fsdm_entity_reuse_scores.csv   → reuseScores.json     (219 entities ranked)
  bvf_reuse_matrix.csv           → reuseMatrix.json     (112×112 — load on demand)
  data_lineage.json              → lineage.json         (23 lineage entries)
  profitability_star_schema_enhanced.sql → starSchema.json (parsed DDL→JSON)
  fsdm_gap_extensions.sql        → gapExtensions.json   (parsed DDL→JSON)
  bvf_fsdm_integration_report.json → integrationReport.json
  pakistan_banking_context.md     → pakistanContext.json  (parsed MD→JSON)

FROM BACR Excel:
  BACR_-_INTERVIEW_MASTER.xlsm   → bacrQuestions.json   (793 questions, 9 categories)

ENRICHMENT (from our 16 prompt outputs):
  Extract Pakistan context per capability → pakistanEnrichment.json
  Extract FSDM entity mappings per capability → capabilityFsdmNotes.json
  Extract implementation roadmaps → roadmaps.json
  Extract industry benchmarks → benchmarks.json
```

### Pre-processing Script

A Python script (`prepare_data.py`) runs ONCE to convert all CSV/JSON/XLSM/SQL into optimized JSON modules for the React app:

```python
# prepare_data.py — converts repo outputs to app-ready JSON
# Run: python prepare_data.py --repo-path /path/to/erwin --output-path ./src/data/
#
# Steps:
# 1. Parse fsdm_entity_catalog.csv → entities.json (id, name, domain, description)
# 2. Parse fsdm_relationships.csv → relationships.json (parent, child, type)
# 3. Parse bvf_capability_summary.csv → capabilities.json (theme, group, sub, dataReqCount)
# 4. Parse bvf_to_fsdm_entity_mapping.csv → mappings.json (requirement, entity, domain)
# 5. Parse capability_fsdm_dependencies.csv → dependencies.json (grouped by capability)
# 6. Parse fsdm_entity_reuse_scores.csv → reuseScores.json (entity, score, tier)
# 7. Parse BACR Excel "All Questions" → bacrQuestions.json
# 8. Parse star schema SQL → starSchema.json (tables, columns, types, PKs, FKs)
# 9. Parse gap extensions SQL → gapExtensions.json (tables, columns, gap module)
# 10. Parse enrichment from 16 prompts → pakistanEnrichment.json
# 11. Generate index.json with stats and metadata
```

---

## 3. APPLICATION MODULES (8 Tabs)

### MODULE 1: Dashboard (Home)

**Route:** `/`

**Content:**
- Hero stats bar: 3,917 entities | 112 capabilities | 793 BACR questions | 16 domains | 6 BVF themes
- Donut chart: Entities by domain (16 segments)
- Bar chart: Capabilities by theme (Marketing, Finance, Product, Risk, Security, Compliance)
- Maturity summary radar (if assessment completed — shows scores by category)
- Quick links to each module
- Pakistan banking context card (key metrics: PKR 35T assets, 33 banks, 17.5% SBP rate)

**Components:** `StatBar`, `DomainDonut`, `CapabilityBar`, `MaturityRadar`, `QuickNav`, `PakistanCard`

---

### MODULE 2: FSDM Model Explorer

**Route:** `/model`

**Content:**
- Left panel: Domain tree (16 domains, expandable to entities)
- Center panel: Entity detail card (name, domain, description, attribute count)
  - Attributes table (name, datatype, classword — lazy loaded for large entities)
  - Relationships (parent entities, child entities — clickable links)
  - Inheritance chain (if applicable)
- Right panel: "Used By" — which BVF capabilities depend on this entity
  - Reuse score badge (P1/P2/P3/P4 tier)
  - List of capabilities with link to Module 3
- Top: Search bar (entity name search, fuzzy)
- Top: Filter (domain dropdown, P-tier filter, min attribute count)

**Key Interactions:**
- Click entity → loads detail + relationships + capability usage
- Click relationship → navigates to parent/child entity
- Click capability → navigates to Module 3

**Components:** `DomainTree`, `EntityCard`, `AttributeTable`, `RelationshipGraph`, `CapabilityUsageList`, `EntitySearch`

---

### MODULE 3: BVF Capability Navigator

**Route:** `/capabilities`

**Content:**
- Left panel: BVF hierarchy (Theme → Capability Group → Sub-Capability)
  ```
  ▼ Marketing & Customer Experience
    ▼ Customer Information & Insight Analytics
      → Construct Single Customer View
      → Analyze Customer Behavior
      → ...
    ▼ Customer Lifecycle Management
      → ...
  ▼ Finance & Performance Management
    ▼ Accounting Operations & Close
      → Billing & Collections
      → ...
    ▼ Enterprise Performance Management
      → Profitability Modelling ★ (starred = critical for Pakistan)
      → ...
  ▼ Product Management
    → ...
  ```
- Center panel: Capability detail
  - Header: Theme > Group > Sub-Capability name
  - Data Requirements (list with count)
  - FSDM Entities Required (from dependency mapping)
  - Pakistan Enrichment (from our 16 prompts — objectives, data, outcomes, challenges)
  - Maturity Level (current vs. desired — editable if assessment done)
- Right panel: Related capabilities (from reuse matrix — top 10 most similar)

**Key Data:**
- `capabilities.json` → hierarchy
- `dependencies.json` → FSDM entities per capability
- `pakistanEnrichment.json` → Pakistan context per capability
- `reuseMatrix.json` → related capabilities

**Components:** `BvfTree`, `CapabilityDetail`, `DataRequirementList`, `FsdmEntityChips`, `PakistanContext`, `RelatedCapabilities`

---

### MODULE 4: Dependency Graph (Interactive Visualization)

**Route:** `/graph`

**Content:**
- Interactive force-directed / Sankey visualization showing:
  ```
  BVF Themes (3) → Capability Groups (12) → FSDM Domains (16) → Top FSDM Entities (P1/P2)
  ```
- Controls:
  - View mode: Sankey | Force-directed | Chord diagram
  - Filter by theme (Marketing, Finance, Product)
  - Filter by domain
  - Highlight P1 entities (53 critical entities used by 70+ capabilities)
  - Show/hide relationships
- Hover: tooltip with entity name, domain, reuse score, capabilities using it
- Click node: navigates to Module 2 (entity) or Module 3 (capability)

**Implementation:** D3.js force-directed graph or Recharts Sankey

**Components:** `SankeyView`, `ForceGraph`, `ChordDiagram`, `GraphControls`, `NodeTooltip`

---

### MODULE 5: Maturity Assessment (BACR)

**Route:** `/maturity`

**Content:**
- Assessment wizard (step-by-step through 9 categories):
  ```
  1. Business (Strategy, Summary, Priorities)
  2. Culture (Organization, Skills, Change Mgmt)
  3. Governance (Data Governance, Metadata, Stewardship)
  4. Information (Data Quality, Integration, Master Data)
  5. Applications (BI, Analytics, Visualization)
  6. Systems (Architecture, Infrastructure, Platform)
  7. Agility (Speed, Automation, Self-Service)
  8. Outcomes (Business Impact, ROI, Value)
  9. Category (Overall Assessment)
  ```
- Per question: Current State (1-5 slider) + Desired State (1-5 slider)
- Maturity level descriptions shown alongside (Emerging → Developing → Practicing → Innovating → Leading)
- Auto-save progress to localStorage (or persist to JSON export)

**Results Dashboard (after completion):**
- Spider/Radar chart: 9 categories, current vs. desired overlay
- Gap analysis table: Category | Current | Desired | Gap | Priority
- Heat map: questions color-coded by gap size
- Export: PDF report, JSON data

**Components:** `AssessmentWizard`, `QuestionCard`, `MaturitySlider`, `RadarChart`, `GapTable`, `HeatMap`, `ExportButton`

---

### MODULE 6: Profitability Engine

**Route:** `/profitability`

**Content:**
- **Star Schema Viewer:**
  - Visual ERD: FACT_CUSTOMER_PROFITABILITY at center, 7 dimensions around it
  - Click table → show columns, data types, FSDM source annotation
  - Color-coded: Fact (gold), Dimensions (blue), Aggregates (green), Views (purple)

- **P&L Builder (Interactive):**
  ```
  Line  1: Gross Interest Income          [from FSDM: Interest_Accrual]
  Line  2: - Interest Expense             [from FSDM: Interest_Expense]
  Line  3: = Net Interest Income (NII)
  Line  4: +/- FTP Adjustment             [KIBOR yield-curve based]
  Line  5: = FTP-Adjusted NII
  Line  6: + Fee & Commission Income
  Line  7: + Other Income
  Line  8: = Total Income
  Line  9: - Direct Costs
  Line 10: - Allocated Costs (ABC)
  Line 11: = Operating Profit
  Line 12: - Provision Charge (IFRS 9 ECL)
  Line 13: = Profit Before Tax
  Line 14: - Capital Charge
  Line 15: = Economic Profit / EVA
  ```
  - Each line: click to expand → see FSDM source entities, calculation logic, Pakistan context

- **Dimension Explorer:**
  - 6 profitability dimensions: Customer | Product | Branch | Segment | Channel | Region
  - Click dimension → see dimension table columns, Pakistan-specific fields (e.g., Islamic_Mode_Cd, SBP_Classification_Cd)

- **Gap Extensions:**
  - 5 gap modules: ABC Costing | CLV | Budget & Forecast | BPM | Operational Metrics
  - Each: show tables, columns, and how they connect to star schema

**Components:** `StarSchemaERD`, `PLBuilder`, `PLLine`, `DimensionExplorer`, `GapModuleCard`, `DDLViewer`

---

### MODULE 7: Roadmap Builder

**Route:** `/roadmap`

**Content:**
- **Capability Selector:** Multi-select from 112 capabilities
  - Pre-built templates: "Quick Wins (6 capabilities)", "Profitability Engine", "Regulatory Compliance", "Digital Transformation", "Full BVF"
- **Auto-Generated Roadmap:**
  - Phase 1 / Phase 2 / Phase 3 timeline (Gantt-style)
  - Per phase: capabilities selected, data requirements, FSDM entities needed, estimated investment (PKR), expected outcomes
  - Data dependency graph: which capabilities share data requirements → can be done together
  - Pakistan implementation considerations per capability
- **Investment Calculator:**
  - Slider: team size, duration, technology cost
  - Auto-estimate based on capability complexity
- **Export:** PowerPoint roadmap (using our prompt format), PDF, JSON

**Components:** `CapabilityMultiSelect`, `TemplateSelector`, `GanttChart`, `PhaseCard`, `InvestmentCalculator`, `RoadmapExport`

---

### MODULE 8: Pakistan Banking Reference

**Route:** `/pakistan`

**Content:**
- **Regulatory Dashboard:**
  - SBP requirements: 30+ statutory returns (table with frequency, description)
  - Basel III: CAR, LCR, NSFR requirements with Pakistan-specific buffers
  - IFRS 9: ECL framework (PD, LGD, EAD)
  - AAOIFI: Islamic accounting standards
  - FBR: Tax rates (39% + 10% super tax, WHT 15%/30%)

- **Industry Metrics:**
  - Banking sector: PKR 35T assets, 33 banks, 16,000 branches, 16,000 ATMs
  - Key ratios: NIM, Cost-to-Income, NPL, CASA, CAR, ADR
  - KIBOR reference rates (table by tenor)

- **Islamic Banking:**
  - Product modes: Murabaha, Ijarah, Diminishing Musharaka, Musharaka, Wakalah, Salam, Istisna
  - Each mode: structure, AAOIFI standard, FSDM entity mapping, P&L treatment

- **Payment Systems:**
  - RAAST (real-time), 1Link (ATM/POS), NIFT (cheques), SWIFT (international)
  - Fintechs: JazzCash, Easypaisa, SadaPay, NayaPay

- **UBL Context:**
  - FSDM v13 → v16 migration path
  - Customer Profitability Engine architecture
  - 4-5 core banking systems integration

**Components:** `RegulatoryTable`, `IndustryMetrics`, `IslamicModes`, `PaymentSystems`, `UBLContext`

---

## 4. TECH STACK

```
Frontend:   React 18 + TypeScript
Routing:    React Router v6
Styling:    Tailwind CSS (utility classes)
Charts:     Recharts (bar, radar, donut) + D3.js (force graph, Sankey)
Icons:      Lucide React
State:      React Context + useReducer (assessment state persistence)
Storage:    localStorage (assessment progress, user preferences)
Build:      Vite
Data:       Static JSON imported at build time (no API needed)
Export:     html2canvas + jspdf (PDF), SheetJS (Excel)
```

---

## 5. FILE STRUCTURE

```
baiw/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.tsx                    # Main app with router
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Tailwind imports
│   │
│   ├── data/                      # Pre-processed JSON (from prepare_data.py)
│   │   ├── entities.json          # 3,917 FSDM entities
│   │   ├── relationships.json     # 5,636 relationships
│   │   ├── domains.json           # 16 domains with entity lists
│   │   ├── capabilities.json      # 112 BVF sub-capabilities
│   │   ├── dataRequirements.json  # 113 data requirements
│   │   ├── dependencies.json      # 5,218 capability→entity dependencies
│   │   ├── mappings.json          # 360 BVF→FSDM entity mappings
│   │   ├── reuseScores.json       # 219 entities with reuse ranking
│   │   ├── lineage.json           # 23 data lineage entries
│   │   ├── starSchema.json        # Parsed star schema DDL
│   │   ├── gapExtensions.json     # Parsed gap extension DDL
│   │   ├── bacrQuestions.json     # 793 BACR maturity questions
│   │   ├── pakistanContext.json   # Pakistan banking reference data
│   │   ├── enrichment.json        # Pakistan enrichment per capability
│   │   ├── benchmarks.json        # Industry benchmarks
│   │   └── index.json             # Metadata and stats
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx        # App navigation sidebar
│   │   │   ├── Header.tsx         # Top bar with search
│   │   │   └── Layout.tsx         # Main layout wrapper
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatBar.tsx
│   │   │   ├── DomainDonut.tsx
│   │   │   ├── CapabilityBar.tsx
│   │   │   └── PakistanCard.tsx
│   │   │
│   │   ├── model/
│   │   │   ├── DomainTree.tsx
│   │   │   ├── EntityCard.tsx
│   │   │   ├── AttributeTable.tsx
│   │   │   ├── RelationshipList.tsx
│   │   │   └── EntitySearch.tsx
│   │   │
│   │   ├── capabilities/
│   │   │   ├── BvfTree.tsx
│   │   │   ├── CapabilityDetail.tsx
│   │   │   ├── FsdmEntityChips.tsx
│   │   │   └── PakistanEnrichment.tsx
│   │   │
│   │   ├── graph/
│   │   │   ├── SankeyView.tsx
│   │   │   ├── ForceGraph.tsx
│   │   │   └── GraphControls.tsx
│   │   │
│   │   ├── maturity/
│   │   │   ├── AssessmentWizard.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── MaturitySlider.tsx
│   │   │   ├── RadarChart.tsx
│   │   │   └── GapTable.tsx
│   │   │
│   │   ├── profitability/
│   │   │   ├── StarSchemaERD.tsx
│   │   │   ├── PLBuilder.tsx
│   │   │   ├── DimensionExplorer.tsx
│   │   │   └── GapModuleCard.tsx
│   │   │
│   │   ├── roadmap/
│   │   │   ├── CapabilitySelector.tsx
│   │   │   ├── GanttChart.tsx
│   │   │   ├── PhaseCard.tsx
│   │   │   └── InvestmentCalculator.tsx
│   │   │
│   │   └── pakistan/
│   │       ├── RegulatoryTable.tsx
│   │       ├── IslamicModes.tsx
│   │       └── PaymentSystems.tsx
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx          # Module 1
│   │   ├── ModelExplorer.tsx      # Module 2
│   │   ├── Capabilities.tsx       # Module 3
│   │   ├── DependencyGraph.tsx    # Module 4
│   │   ├── MaturityAssessment.tsx # Module 5
│   │   ├── ProfitabilityEngine.tsx# Module 6
│   │   ├── RoadmapBuilder.tsx     # Module 7
│   │   └── PakistanReference.tsx  # Module 8
│   │
│   ├── hooks/
│   │   ├── useEntities.ts        # Entity data access
│   │   ├── useCapabilities.ts    # Capability data access
│   │   ├── useAssessment.ts      # Assessment state + localStorage
│   │   └── useSearch.ts          # Fuzzy search across all data
│   │
│   ├── context/
│   │   └── AssessmentContext.tsx  # Global assessment state
│   │
│   └── utils/
│       ├── dataLoader.ts         # JSON import helpers
│       ├── search.ts             # Fuzzy search implementation
│       └── export.ts             # PDF/Excel export utilities
│
├── scripts/
│   └── prepare_data.py           # Converts repo CSV/JSON → app-ready JSON
│
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## 6. KEY DATA RELATIONSHIPS

```
                    ┌─────────────────────┐
                    │   BVF THEMES (3)    │
                    │ Marketing, Finance, │
                    │ Product             │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │  CAPABILITY GROUPS   │
                    │  (12 groups)         │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │  SUB-CAPABILITIES   │───── BACR Questions (793)
                    │  (112 capabilities) │      "How mature is this capability?"
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │  DATA REQUIREMENTS  │
                    │  (113 requirements) │
                    └─────────┬───────────┘
                              │ (360 mappings)
                    ┌─────────▼───────────┐
                    │  FSDM ENTITIES      │───── Star Schema (11 tables)
                    │  (3,917 in 16       │      Gap Extensions (21 tables)
                    │   domains)          │      Data Lineage (23 entries)
                    └─────────────────────┘
```

---

## 7. UI DESIGN PRINCIPLES

- **Dark sidebar** with navigation icons + labels (collapsed/expanded toggle)
- **Light content area** with card-based layouts
- **Color scheme:**
  - Marketing & CX: Blue (#3B82F6)
  - Finance & PM: Amber (#F59E0B)
  - Product Management: Green (#10B981)
  - Risk Management: Red (#EF4444)
  - Security & Fraud: Purple (#8B5CF6)
  - Regulatory Compliance: Indigo (#6366F1)
- **Pakistan accent:** Emerald green (#047857) for Pakistan-specific elements
- **Typography:** System font stack, 14px base, clear hierarchy
- **Responsive:** Desktop-first but functional at tablet width (1024px+)

---

## 8. IMPLEMENTATION PHASES

### Phase 1: Data Pipeline + Shell (Week 1)
- `prepare_data.py` script to convert all repo data
- React app scaffold with Vite + Tailwind + React Router
- Layout (sidebar, header, page structure)
- Dashboard with stat bar and placeholder charts

### Phase 2: Core Modules (Week 2-3)
- Module 2: FSDM Model Explorer (entity browse, search, detail)
- Module 3: BVF Capability Navigator (hierarchy, detail, dependencies)
- Module 6: Profitability Engine (star schema ERD, P&L builder)

### Phase 3: Interactive Modules (Week 3-4)
- Module 4: Dependency Graph (D3 force/Sankey)
- Module 5: Maturity Assessment (BACR wizard + radar chart)
- Module 7: Roadmap Builder (capability selector + Gantt)

### Phase 4: Reference + Polish (Week 4-5)
- Module 8: Pakistan Banking Reference
- Global search across all data
- PDF/Excel export
- Performance optimization (lazy loading large datasets)

---

## 9. CLAUDE CODE PROMPT

This is the prompt to give Claude Code to build Phase 1 + Phase 2 as a working MVP.

---

# CLAUDE CODE PROMPT: Build BAIW MVP

## Task

Build the **Banking Analytics Intelligence Workbench (BAIW)** — a React web application that lets banking consultants explore the Teradata FSDM data model (3,917 entities), BVF capability framework (112 capabilities), and Pakistan banking context in an integrated, interactive platform.

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling — utility classes only)
- React Router v6 (client-side routing)
- Recharts (charts: bar, donut, radar)
- D3.js (force graph for dependency visualization)
- Lucide React (icons)

## Phase 1: Data Pipeline

### Step 1: Create `prepare_data.py`

Script that reads the repo's CSV/JSON/SQL outputs and converts them into optimized JSON files for the React app.

**Input files (in repo root):**
```
fsdm_output/fsdm_entity_catalog.csv          # 3,917 entities
fsdm_output/fsdm_relationships.csv           # 5,636 relationships
fsdm_output/fsdm_domain_map.json             # entity→domain mapping
fsdm_output/fsdm_data_dictionary.csv         # 15,364 attributes
bvf_fsdm_output/bvf_capability_summary.csv   # 112 capabilities
bvf_fsdm_output/bvf_data_requirements.csv    # 113 data requirements
bvf_fsdm_output/bvf_to_fsdm_entity_mapping.csv  # 360 mappings
bvf_fsdm_output/capability_fsdm_dependencies.csv # 5,218 dependencies
bvf_fsdm_output/fsdm_entity_reuse_scores.csv # 219 entities ranked
bvf_fsdm_output/data_lineage.json            # 23 lineage entries
bvf_fsdm_output/profitability_star_schema_enhanced.sql  # Star schema DDL
bvf_fsdm_output/fsdm_gap_extensions.sql      # Gap extension DDL
```

**Output (to `src/data/`):**
```python
# Each output is a JSON file optimized for React import
# entities.json: [{"id": "Party", "domain": "Party Management", "description": "...", "attributeCount": 15}, ...]
# relationships.json: [{"parent": "Party", "child": "Individual", "type": "inheritance"}, ...]
# domains.json: {"Party Management": {"entityCount": 622, "entities": [...]}, ...}
# capabilities.json: [{"theme": "Marketing & CX", "group": "Customer Info", "sub": "Single Customer View", "dataReqs": 5}, ...]
# dependencies.json: {"Single Customer View": {"entities": ["Party", "Individual", ...], "domains": ["Party Management", ...]}, ...}
# mappings.json: [{"requirement": "Customer Demographics", "entity": "Individual", "domain": "Party Management"}, ...]
# reuseScores.json: [{"entity": "Party", "score": 98, "tier": "P1", "capabilitiesSupported": 98}, ...]
# starSchema.json: {"tables": [{"name": "FACT_CUSTOMER_PROFITABILITY", "type": "fact", "columns": [...]}]}
# gapExtensions.json: {"modules": [{"name": "ABC Costing", "tables": [...]}, ...]}
# lineage.json: (passthrough)
```

For MVP, generate SAMPLE data in the correct structure if repo files aren't available. Use the exact numbers from OVERVIEW.md to create realistic sample data:
- 16 FSDM domains with entity counts matching: Party Management (622), Agreement/Account (506), Product Management (209), etc.
- 112 sub-capabilities across 3 themes (Marketing ~40, Finance ~35, Product ~12, Risk ~15, Security ~10, Compliance ~10)
- 793 BACR questions across 9 categories

### Step 2: Create React App

```bash
npm create vite@latest baiw -- --template react-ts
cd baiw
npm install react-router-dom recharts d3 lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

## Phase 2: Build Core UI

### Layout

- **Sidebar** (left, 250px expanded / 60px collapsed):
  - Logo: "BAIW" with banking icon
  - Nav items with icons:
    1. Dashboard (LayoutDashboard icon)
    2. Data Model (Database icon)
    3. Capabilities (Layers icon)
    4. Dependencies (GitBranch icon)
    5. Maturity (Target icon)
    6. Profitability (DollarSign icon)
    7. Roadmap (Map icon)
    8. Pakistan (Globe icon)
  - Collapse toggle at bottom
  - Dark background (#1E293B)

- **Header** (top):
  - Global search bar (searches entities + capabilities)
  - "Export" button
  - Settings gear

- **Main content area** (right of sidebar):
  - Page content with padding
  - Breadcrumb navigation

### Page 1: Dashboard

**Stats bar (top):** 4 cards in a row:
- 3,917 FSDM Entities | 112 BVF Capabilities | 793 BACR Questions | 16 Domains

**Row 1 (2 charts):**
- Left: Donut chart — Entities by Domain (top 8 domains + "Other")
- Right: Horizontal bar chart — Capabilities by Theme

**Row 2 (2 cards):**
- Left: Pakistan Banking Metrics card (PKR 35T assets, 33 banks, 17.5% SBP rate, etc.)
- Right: Top 10 Most Reused FSDM Entities (bar chart from reuseScores)

### Page 2: FSDM Model Explorer

- **Left panel (300px):** Collapsible tree of 16 domains. Click domain → expand to show entities. Entity count badge per domain.
- **Center panel:** Entity detail card. Shows: entity name, domain badge, description, attribute count. Below: Attributes table (sortable). Below: Relationships (parent/child lists with clickable links).
- **Right panel (250px):** "Capabilities Using This Entity" — list of BVF capabilities from dependencies data. Reuse score badge.
- **Top bar:** Search input (filters entity tree as you type).

### Page 3: BVF Capability Navigator

- **Left panel:** BVF hierarchy tree: Theme → Group → Sub-Capability. Expandable/collapsible. Color-coded by theme.
- **Center panel:** Capability detail:
  - Header: breadcrumb (Theme > Group > Sub-Capability)
  - Section 1: "Data Requirements" — numbered list
  - Section 2: "FSDM Entities" — chip/tag list with domain color
  - Section 3: "Pakistan Context" — objectives, data sources, outcomes, challenges (from enrichment data)
  - Section 4: "Implementation" — estimated phase, investment range, quick wins
- **Right panel:** "Related Capabilities" (top 5 from reuse matrix by similarity score)

### Page 6: Profitability Engine

- **Tab 1: Star Schema** — SVG ERD visualization:
  - FACT_CUSTOMER_PROFITABILITY at center (gold box)
  - 7 dimension tables around it (blue boxes): Customer, Product, Branch, Segment, Channel, Time, Agreement
  - 2 aggregate tables (green boxes): Branch Profitability, Segment Profitability
  - Lines showing FK relationships
  - Click any table → expand to show columns

- **Tab 2: P&L Builder** — Interactive 15-line P&L:
  - Each line: label, formula, FSDM source entities
  - Color: Revenue lines (green), Cost lines (red), Subtotals (bold)
  - Click any line → side panel shows calculation detail and FSDM mapping

- **Tab 3: Gap Extensions** — 5 cards for ABC, CLV, Budget, BPM, Operational Metrics:
  - Each card: module name, table count, column count, description
  - Expand → show tables and columns

## Pakistan Banking Reference Data (Hardcoded)

Embed these key reference tables as JSON:

```json
{
  "sbpRates": {
    "policyRate": "17.5%",
    "kibor": {"1M": "17.2%", "3M": "17.5%", "6M": "17.8%", "12M": "18.0%"},
    "minimumSavingsRate": "~11-13%"
  },
  "industryMetrics": {
    "totalAssets": "PKR 35T+",
    "totalDeposits": "PKR 25T+",
    "totalAdvances": "PKR 13T+",
    "nplRatio": "7.5%",
    "casaRatio": "47%",
    "numberOfBanks": 33,
    "islamicBanks": 5,
    "branches": "16,000+",
    "atms": "16,000+",
    "debitCards": "30M+",
    "creditCards": "3M+",
    "corporateTax": "39% + 10% super tax = ~49%",
    "whtOnDeposits": "15% (filers) / 30% (non-filers)"
  },
  "islamicModes": [
    {"name": "Murabaha", "type": "Sale", "use": "Trade finance, auto finance"},
    {"name": "Ijarah", "type": "Lease", "use": "Auto finance, equipment"},
    {"name": "Diminishing Musharaka", "type": "Partnership", "use": "Home finance"},
    {"name": "Musharaka", "type": "Partnership", "use": "Corporate working capital"},
    {"name": "Wakalah", "type": "Agency", "use": "Deposits, investments"},
    {"name": "Salam", "type": "Forward Sale", "use": "Agriculture"},
    {"name": "Istisna", "type": "Manufacturing", "use": "Project finance"}
  ],
  "domains": [
    {"name": "Party Management", "entities": 622, "description": "Customer, organization, individual, relationship management"},
    {"name": "Agreement/Account", "entities": 506, "description": "Deposit accounts, lending facilities, card agreements"},
    {"name": "Product Management", "entities": 209, "description": "Banking products, features, pricing, channels"},
    {"name": "Financial Instrument", "entities": 187, "description": "Securities, derivatives, government bonds"},
    {"name": "Transaction", "entities": 156, "description": "Payments, transfers, settlements"},
    {"name": "Location/Geography", "entities": 143, "description": "Branches, ATMs, regions, countries"},
    {"name": "Market Data", "entities": 128, "description": "Rates, indices, exchange rates, benchmarks"},
    {"name": "General Ledger", "entities": 115, "description": "GL accounts, postings, balances"},
    {"name": "Risk Management", "entities": 98, "description": "Credit risk, market risk, operational risk"},
    {"name": "Regulatory/Compliance", "entities": 87, "description": "Regulatory reports, KYC, AML"},
    {"name": "Channel", "entities": 76, "description": "Branch, ATM, mobile, internet, agent"},
    {"name": "Event/Calendar", "entities": 65, "description": "Business events, calendar, holidays"},
    {"name": "Classification/Reference", "entities": 543, "description": "Code tables, reference data, lookups"},
    {"name": "Campaign/Marketing", "entities": 42, "description": "Campaigns, offers, responses"},
    {"name": "Document/Content", "entities": 38, "description": "Documents, reports, correspondence"},
    {"name": "Other", "entities": 1102, "description": "Uncategorized and cross-domain entities"}
  ]
}
```

## Design Quality

- Professional, enterprise-grade look — think Bloomberg Terminal meets modern dashboard
- Dark sidebar (#1E293B) with light main area (#F8FAFC)
- Card-based layout with subtle shadows
- Smooth transitions between pages
- Loading states with skeleton screens for large datasets
- Responsive sidebar (collapse to icons at <1024px)

## Deliverables

1. `prepare_data.py` — data pipeline script (generates sample data for MVP)
2. Complete React app in `baiw/` directory
3. All 8 pages implemented (Modules 1-3 and 6 fully functional, Modules 4-5 and 7-8 with structure + placeholder content)
4. README.md with setup instructions

Build the full application. Start with `prepare_data.py`, then scaffold the React app, then implement each module.
