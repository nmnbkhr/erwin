# BAIW Phase 2 — Module Depth Enhancements

## Context

BAIW app is built and running at localhost:5173 with all 8 modules functional, global Cmd+K search, localStorage persistence, PDF/JSON/CSV export, and enrichment.json. This prompt adds depth to each module — 25 specific enhancements.

---

## DASHBOARD (Module 1) — 3 Enhancements

### D1: Maturity Radar on Dashboard

If the user has completed (or partially completed) the maturity assessment, show a **mini radar chart** on the dashboard. This creates a visual pull to complete the assessment.

- Add a card in the bottom row (or replace one of the existing cards if layout is 2×2)
- Read assessment data from localStorage (`baiw-assessment`)
- If assessment has answers: show Recharts RadarChart with 9 categories, current scores only (blue line)
- If no assessment data: show an empty state card with "Start Maturity Assessment →" CTA button linking to `/maturity`
- Title: "Analytics Maturity Snapshot"

### D2: Quick Navigation Grid

Below the stats bar, add a **quick nav grid** — 8 small cards (one per module) in a single row. Each card: icon + module name + one-line description. Click → navigates to that module. Use the same Lucide icons from the sidebar.

This helps first-time users understand what's available without reading the sidebar.

```
[🗃️ Data Model]  [📊 Capabilities]  [🔗 Dependencies]  [🎯 Maturity]
[💰 Profitability] [🗺️ Roadmap]    [🇵🇰 Pakistan]     [📈 Dashboard]
```

Each card: `bg-white rounded-lg p-4 hover:shadow-md cursor-pointer transition`

### D3: Stats Bar — Add Dynamic Counts

Make the stats bar dynamic by adding 2 more stats:
- **Assessment Progress:** "X/9 categories assessed" (if any progress) or "Not started"
- **Roadmap:** "X capabilities selected" (if any) or "No roadmap"

These create awareness of the interactive modules.

---

## MODEL EXPLORER (Module 2) — 4 Enhancements

### M1: Inheritance Chain Display

When an entity has inheritance relationships (from `inheritance.json` or similar data), show an **inheritance chain** section in the entity detail card:

```
Inheritance Chain:
  Financial_Entity
    └─ Account
        └─ Deposit_Account
            └─ Savings_Account  ← YOU ARE HERE
```

Use a simple indented tree with connecting lines (CSS border-left + padding). Highlight the current entity. Each ancestor/descendant is clickable to navigate.

If the entity has no inheritance, hide this section.

### M2: P-Tier Filter in Domain Tree

Add filter controls above the domain tree:
- **P-Tier filter:** Dropdown or pill buttons: "All" | "P1 Critical" | "P2 High" | "P3 Medium" | "P4 Low"
- When a P-tier filter is active, only show entities with that reuse tier in the domain tree
- Show count badge: "P1: 53 entities" etc.
- This helps architects quickly find the highest-impact entities

### M3: Clickable Relationships Navigation

In the entity detail's Relationships section (Parents / Children):
- Each parent/child entity should be a **clickable pill/chip**
- Click → updates the center panel to show THAT entity's details (like navigating within the tree)
- Add a **breadcrumb trail** at the top of the center panel: `Party Management > Party > Individual > Individual_Name`
- Back button to return to previous entity

### M4: Entity Comparison

Add a "Compare" button on entity cards. When clicked:
- Enters comparison mode — user selects 2 entities
- Shows side-by-side: entity name, domain, attribute count, reuse tier, capabilities using it, relationships
- Useful for architects deciding between similar entities (e.g., "Should I use Party_Relationship or Party_To_Party_Relationship?")

---

## CAPABILITY NAVIGATOR (Module 3) — 3 Enhancements

### C1: Critical Capabilities Starred

In the BVF tree (left panel), mark critical-for-Pakistan capabilities with a ★ star icon (gold):
- These are capabilities with `priority: "CRITICAL"` in enrichment.json
- Currently 4-5 capabilities: Profitability Modelling, RAROC, Single Customer View, Credit Risk New-to-Lending, ABC Costing
- Star appears next to the sub-capability name in the tree
- Add a filter toggle: "Show critical only" that collapses the tree to only show ★ items

### C2: Maturity Level from Assessment

If the user has completed the maturity assessment, show the **relevant maturity score** on the capability detail card:
- Map BACR categories to BVF themes/groups (approximate mapping):
  ```
  Business → all capabilities (general readiness)
  Information → Customer Information & Insight Analytics capabilities
  Applications → all analytics capabilities
  Governance → Regulatory Compliance capabilities
  Systems → all infrastructure-dependent capabilities
  ```
- Show as a badge: "Maturity: 2.5/5 (Developing)" with color (red=1-2, amber=2.5-3.5, green=4-5)
- If no assessment done, show "Maturity: Not assessed" with link to `/maturity`

### C3: Capability Dependency Count Badge

In the BVF tree, show a small badge next to each sub-capability indicating **how many FSDM entities it requires**:
- `[15]` next to "Profitability Modelling" (needs 15 entities)
- Color: more entities = darker badge (higher implementation complexity)
- Tooltip on hover: "Requires 15 FSDM entities across 4 domains"

---

## DEPENDENCY GRAPH (Module 4) — 3 Enhancements

### G1: View Mode Switcher

Add a toggle in the controls panel for 2 view modes (already has force-directed, add Sankey):

**Sankey View:**
- Left column: BVF Themes (3 nodes)
- Middle column: Capability Groups (12 nodes)
- Right column: FSDM Domains (16 nodes)
- Flows: thickness = number of dependencies
- Use Recharts `Sankey` component or D3 sankey plugin

**Force-Directed (existing):** Keep as is but add the controls below.

Toggle: Two buttons "Force Graph" | "Sankey Flow" — selected one is highlighted.

### G2: P1 Entity Highlight

Add a toggle button: "🔴 Highlight P1 Entities (53)"
- When ON: P1 entities appear as larger, red-bordered nodes in force graph
- When OFF: all nodes same size
- In Sankey view: P1-dependent flows are highlighted red

### G3: Click-to-Navigate from Graph

Currently graph nodes may not navigate. Ensure:
- Click a capability group node → navigates to `/capabilities` filtered to that group
- Click a domain node → navigates to `/model?domain={domainName}`
- Tooltip on hover shows: name, type, connection count, top 3 connected items

---

## MATURITY ASSESSMENT (Module 5) — 3 Enhancements

### A1: Maturity Level Descriptions

Next to each question's sliders, show the **maturity level description** for the currently selected value:

```
Current State: ●●●○○ (3 — Practicing)
"Analytics processes are documented and followed consistently. 
Some self-service capability exists."

Desired State: ●●●●○ (4 — Innovating)
"Advanced analytics actively drives decisions. Predictive models 
deployed in production with measurable business impact."
```

Level descriptions (generic, apply to all questions):
```
1 — Emerging: Ad-hoc, reactive, no formal process. Decisions based on intuition.
2 — Developing: Some awareness, basic reporting, initial processes being established.
3 — Practicing: Documented processes, regular reporting, analytics team in place.
4 — Innovating: Advanced analytics in production, predictive models, measurable ROI.
5 — Leading: AI/ML embedded in operations, real-time decisioning, continuous optimization.
```

### A2: Gap Heat Map in Results

In the Results Dashboard (shown after assessment), add a **heat map** section:
- 9 rows (categories) × 2 columns (Current, Desired)
- Cell color: 1=deep red, 2=red-orange, 3=amber, 4=light green, 5=deep green
- Third column: Gap = Desired − Current, colored by gap size (0=green, 1=yellow, 2+=red)
- This gives a visual "at a glance" view complementing the radar chart

### A3: Category Progress Indicator

In the assessment wizard, show a **progress sidebar/stepper** on the left:
```
✅ Business (completed)
✅ Culture (completed)
🔵 Governance (in progress — 4/10 answered)
⬜ Information
⬜ Applications
⬜ Systems
⬜ Agility
⬜ Outcomes
⬜ Overall Assessment
```
- Click a completed category to review/edit answers
- Show completion percentage per category
- This replaces a simple progress bar with a more informative stepper

---

## PROFITABILITY ENGINE (Module 6) — 4 Enhancements

### P1: Dimension Explorer Tab

Add a **third tab: "Dimensions"** (alongside Star Schema and P&L Builder, and before Gap Extensions if it's a 4th tab):

Shows 7 dimension cards in a grid:
```
[DIM_CUSTOMER]    [DIM_PRODUCT]     [DIM_BRANCH]
[DIM_SEGMENT]     [DIM_CHANNEL]     [DIM_TIME]
[DIM_AGREEMENT]
```

Each card shows:
- Dimension name (header)
- Column count badge
- Key columns preview (first 5)
- Pakistan-specific columns highlighted with 🇵🇰 flag icon:
  - DIM_CUSTOMER: `cnic_number`, `ntn_number`, `is_islamic_customer`, `zakat_exempt_flag`
  - DIM_PRODUCT: `islamic_mode_cd`, `sbp_product_code`, `shariah_compliant_flag`
  - DIM_BRANCH: `sbp_branch_code`, `is_islamic_branch`, `province_code`
  - DIM_TIME: `pakistan_fiscal_year`, `islamic_month`, `weekly_holiday_friday`
  - DIM_AGREEMENT: `ifrs9_stage`, `sbp_classification_cd`, `collateral_type_sbp`
  - DIM_SEGMENT: `sbp_sector_code`, `sme_definition_sbp`
  - DIM_CHANNEL: `raast_enabled`, `branchless_agent_flag`

Click any card → expand to full column list with datatypes.

### P2: P&L Line Expansion Detail

When clicking a P&L line in the P&L Builder, show an **expansion panel** with:

```
━━━ Line 4: FTP Adjustment ━━━━━━━━━━━━━━━━━

Formula:  FTP Revenue − FTP Charge
          = (Loan Balance × Pool Rate) − (Deposit Balance × Pool Rate)

FSDM Entities:
  [Interest_Rate_Term_Structure]  [FTP_Rate]  [Agreement]  [Account_Balance]

Pakistan Context:
  • FTP based on KIBOR yield curve (O/N to 1Y tenors)
  • SBP minimum savings rate creates FTP floor for deposits
  • Islamic products use Islamic FTP curve (no KIBOR — use Islamic benchmark)
  • FTP methodology is single most impactful decision for profitability accuracy

Related Capabilities:
  → Treasury Insight & Management
  → Profitability Modelling
```

Apply this pattern to all 16 P&L lines — each needs Formula, FSDM Entities, Pakistan Context, and Related Capabilities.

### P3: Gap Extensions — Connection to Star Schema

In the Gap Extensions tab, for each of the 5 gap modules, add a **"Connects To" section** showing which star schema columns depend on this gap module:

```
┌─ ABC Costing (6 tables) ────────────────────┐
│                                              │
│  Feeds into Star Schema:                     │
│  • FACT.abc_allocated_cost ← COST_ALLOCATION │
│  • FACT.direct_cost ← ACTIVITY_RATE          │
│                                              │
│  Required for Capabilities:                  │
│  → Activity Based Costing                    │
│  → Customer Profitability                    │
│  → Channel Cost Analysis                     │
└──────────────────────────────────────────────┘
```

### P4: Views Display

Add a small section at the bottom of the Star Schema tab showing the 3 analytical views:
- `VW_CUSTOMER_PL` — Customer-level P&L statement (aggregates fact by customer)
- `VW_PRODUCT_PL` — Product-level P&L (aggregates fact by product)
- `VW_ISLAMIC_VS_CONVENTIONAL` — Comparison view splitting all metrics by islamic flag

Each view: name, description, key columns, source tables. This completes the star schema picture.

---

## ROADMAP BUILDER (Module 7) — 3 Enhancements

### R1: Investment Calculator

Add an **Investment Calculator** section below the Gantt chart:

```
┌─ Investment Estimate ──────────────────────────┐
│                                                │
│  Team Size:     ■■■■■□□□□□  5 FTEs            │
│  Duration:      ■■■■■■□□□□  18 months         │
│  Tech Platform: ■■■■■□□□□□  PKR 50M           │
│                                                │
│  ── Estimated Investment ──                    │
│  Personnel:     PKR 45M  (5 × PKR 150K/mo × 18)│
│  Technology:    PKR 50M  (licenses + infra)    │
│  Consulting:    PKR 20M  (external advisors)   │
│  Contingency:   PKR 12M  (10%)                │
│  ────────────────────────────────              │
│  TOTAL:         PKR 127M                       │
│                                                │
│  Complexity Score: 7.2/10 (based on 23 caps)  │
└────────────────────────────────────────────────┘
```

Sliders:
- Team size: 2-15 FTEs (default: 5)
- Duration: 6-36 months (default: 18)
- Technology cost: PKR 20-200M (default: 50M)

Auto-calculate:
- Personnel = team_size × PKR 150K/month × duration_months
- Consulting = 15-20% of personnel cost
- Contingency = 10% of total
- Complexity score = selected_capabilities.length × avg_fsdm_entities_per_cap / 100

### R2: Shared Data Requirements Grouping

When capabilities are selected, show a **"Shared Data Foundation"** section:
- Which FSDM entities are needed by MULTIPLE selected capabilities
- These shared entities should be built first (they unlock multiple capabilities)
- Display: table with Entity | Domain | Used By (count) | Capabilities Using It

Example: If user selects "Profitability Modelling" + "RAROC" + "Close Process":
```
Shared Data Foundation (build first):
  Party (3 caps use it) — Customer master data
  Agreement (3 caps use it) — Account/product relationships
  GL_Entry (2 caps use it) — General ledger postings
  Risk_Assessment (2 caps use it) — Credit scoring
```

### R3: Enrichment-Based Phase Suggestions

When user selects capabilities, auto-suggest phases based on enrichment.json `implementationPhase` field:
- Capabilities with `implementationPhase: 1` → Phase 1
- Capabilities with `implementationPhase: 2` → Phase 2
- Capabilities with `implementationPhase: 3` → Phase 3
- User can override by drag-drop or manual reassignment
- Show note: "Phases auto-suggested based on complexity and dependencies"

---

## PAKISTAN REFERENCE (Module 8) — 2 Enhancements

### K1: SBP Statutory Returns Table

Add a comprehensive table of SBP regulatory returns:

```
| Return Code | Name | Frequency | Description |
|-------------|------|-----------|-------------|
| WSP | Weekly Statement of Position | Weekly | Assets, liabilities, capital summary |
| MSA | Monthly Statement of Affairs | Monthly | Detailed balance sheet |
| QFS | Quarterly Financial Statements | Quarterly | Full P&L + balance sheet |
| CAR | Capital Adequacy Return | Quarterly | CET1, Tier 1, Total capital ratios |
| LCR | Liquidity Coverage Ratio | Daily | HQLA / net cash outflows |
| NSFR | Net Stable Funding Ratio | Quarterly | Available stable funding / required |
| ECIB | Enhanced Credit Information Bureau | Monthly | Borrower-level credit data |
| STR | Suspicious Transaction Report | Event | AML/CFT suspicious activity |
| CTR | Currency Transaction Report | Event | Cash transactions > PKR 2M |
| BPD | Branch Profile Data | Quarterly | Branch-level operational data |
| CPC | Consumer Protection Complaints | Quarterly | Customer complaint resolution |
| IBD | Islamic Banking Data | Monthly | Islamic assets, deposits, modes |
```

Show 12-15 key returns. Each row clickable to show: which FSDM entities feed this return + which BVF capabilities relate to it.

### K2: UBL Context Section

Add a **"UBL Implementation Context"** section:

```
┌─ UBL Data Warehouse Architecture ──────────────────┐
│                                                     │
│  FSDM Version: v13.00.00 (migrated to IntelliFlex) │
│  Hardware: Teradata IntelliFlex (prev: TD 2850)     │
│  Core Banking Systems: 4-5 source systems incl. CTL │
│  Key Asset: Customer Profitability Engine            │
│                                                     │
│  Migration Path: v13 → v16                          │
│  ├─ v13: 3,917 entities in ERwin model              │
│  ├─ v16: 3,917 entities in XSD schema               │
│  └─ Gap: ~200 new entities in v16 (estimate)        │
│                                                     │
│  Star Schema: FACT_CUSTOMER_PROFITABILITY            │
│  ├─ 35+ measures (NII, FTP, fees, ABC, ECL, EVA)    │
│  ├─ 7 dimensions (Customer, Product, Branch, etc.)   │
│  ├─ 2 aggregates (Branch P&L, Segment P&L)          │
│  └─ 3 views (Customer P&L, Product P&L, Islamic)    │
│                                                     │
│  Gap Extensions: 5 modules, 21 tables               │
│  (ABC, CLV, Budget, BPM, Operational Metrics)        │
└─────────────────────────────────────────────────────┘
```

---

## CROSS-MODULE NAVIGATION — Verify & Fix

Ensure ALL these cross-links work:

```
Dashboard donut → click domain segment → /model?domain={domain}
Dashboard capability bar → click theme → /capabilities?theme={theme}
Dashboard maturity radar → click → /maturity
Dashboard quick nav cards → click → respective module

Model Explorer entity detail → click "Used By" capability → /capabilities?id={capId}
Model Explorer relationships → click parent/child → loads that entity in center panel
Model Explorer inheritance → click ancestor → loads that entity

Capability Navigator → click FSDM entity chip → /model?search={entityName}
Capability Navigator → click related capability → loads that capability in center panel
Capability Navigator → click maturity badge → /maturity

Dependency Graph → click capability node → /capabilities?group={group}
Dependency Graph → click domain node → /model?domain={domain}

Profitability Engine P&L → click line's FSDM entities → /model?search={entity}
Profitability Engine P&L → click "Related Capabilities" → /capabilities?id={capId}
Profitability Gap Extensions → click "Required for Capabilities" → /capabilities?id={capId}

Roadmap Builder → selected capabilities show enrichment data
Roadmap Builder → shared entities link to /model?search={entity}
```

Test each navigation link. Fix any that return 404 or don't update the target page's selection.

---

## VERIFICATION CHECKLIST

After implementing all 25 enhancements:

```
Dashboard:
□ Maturity radar shows if assessment data exists in localStorage
□ Empty state CTA links to /maturity
□ Quick nav grid — 8 cards, all clickable
□ Stats bar shows assessment progress + roadmap count

Model Explorer:
□ Inheritance chain renders for entities that have parent/child inheritance
□ P-tier filter buttons work (P1/P2/P3/P4/All)
□ Clicking relationship pill loads that entity in center panel
□ Entity comparison mode — select 2, side-by-side display

Capability Navigator:
□ ★ stars on critical capabilities in tree
□ "Show critical only" filter toggle works
□ Maturity badge shows on capability detail (if assessment done)
□ Dependency count badges in tree [15]

Dependency Graph:
□ Sankey view available via toggle
□ Force graph P1 highlight toggle works
□ Click capability node → navigates to /capabilities
□ Click domain node → navigates to /model

Maturity Assessment:
□ Maturity level descriptions appear next to slider values
□ Heat map in results (9 rows × 3 cols: current, desired, gap)
□ Category stepper with ✅/🔵/⬜ status

Profitability Engine:
□ Dimension Explorer tab with 7 dimension cards
□ Pakistan-specific columns have 🇵🇰 flag
□ P&L line expansion shows formula + FSDM entities + Pakistan context
□ Gap extensions show "Connects To" star schema columns
□ Views section at bottom of Star Schema tab

Roadmap Builder:
□ Investment calculator with 3 sliders and auto-calculation
□ Shared data foundation section lists common FSDM entities
□ Phase auto-suggestion from enrichment.json

Pakistan Reference:
□ SBP statutory returns table (12+ returns)
□ UBL Context section with architecture details

Cross-module:
□ At least 10 cross-module navigation links tested and working
□ No 404 errors on any navigation
□ TypeScript compiles clean
□ No console errors
```
