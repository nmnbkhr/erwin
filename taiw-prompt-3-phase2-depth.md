# TAIW — Prompt 3: Phase 2 Depth Enhancements

## Context

TAIW module is running inside the BAIW app at `/taiw/*` routes with 8 pages, teal/cyan theme, and all data from `src/data/taiw/`. This prompt adds 25 depth enhancements across all 8 modules — same pattern as BAIW Phase 2.

**CRITICAL:** All changes go in `src/taiw/` — never modify BAIW components.

---

## 25 Enhancements

### Dashboard (3)

**TD1: Trade Balance Sparkline Card**
Add a card showing Pakistan's trade balance trend (12 months). Use static data from `pakistanContext.json`. Sparkline chart (Recharts) with imports line (red), exports line (teal), deficit area (shaded). Show current deficit: "$26.27B".

**TD2: Quick Nav Grid with Data Counts**
Each of the 8 module cards shows live data count:
```
WCO Model: 727 elements across 14 domains
Capabilities: 96 across 6 themes
Dependencies: 3,000+ mappings
Maturity: X/8 categories (from localStorage)
Analytics: 21 tables + 6 views
Roadmap: X capabilities selected
Pakistan: 8 reference sections
```

**TD3: WCO DM Conformity Score**
Show a gauge/progress circle: "Pakistan WCO DM Conformity: Level 1 of 4" with description. Based on static assessment (Pakistan hasn't published MIP, so Level 1). If TACR assessment done, pull Data Governance category score to refine.

---

### WCO Model Explorer (4)

**TM1: Information Package Filter**
Add a dropdown above the domain tree: "Filter by Information Package". Options: All, Goods Declaration, Cargo Declaration, Transit, Certificate of Origin, etc. (23 IPs from `informationPackages.json`). When selected, tree shows only elements belonging to that IP's classes.

**TM2: Element Usage Heatmap**
Add a mini heatmap bar on each element showing how many TCF capabilities use it (from `reuseScores.json`). P1 = red-hot, P4 = cool blue. Tooltip: "Used by X capabilities".

**TM3: Class Diagram Mini View**
When a class is selected in the tree, show a mini UML-style diagram of its parent class, current class, and child classes with element counts. Use simple div-based layout (not full D3). Show cardinality labels from `relationships.json`.

**TM4: Code List Expansion**
When an element has a code list, show the code values inline (expandable). From `codeLists.json`. Example: clicking "Transport mode" shows: `1=Sea, 2=Rail, 3=Road, 4=Air, 5=Postal, 7=Pipeline, 8=Inland waterway, 9=Not specified`.

---

### TCF Capability Navigator (3)

**TC1: Critical Capability Stars**
Capabilities with `priority: "CRITICAL"` in `enrichment.json` get a ★ gold star icon. Add a toggle: "Show Critical Only" that filters the tree to show only CRITICAL capabilities (~12).

**TC2: TACR Maturity Badge**
If maturity assessment is done, show the relevant category score as a colored badge on each capability. Map capabilities to TACR categories:
- Revenue capabilities → "Outcomes & Impact" category
- Risk capabilities → "Analytics & Technology" category
- Facilitation capabilities → "Processes & Automation" category
- etc.

Color: 1-2 = red, 3 = yellow, 4 = green, 5 = teal.

**TC3: WCO Element Count Badges**
Show `[8]` badge next to each capability name = number of WCO DM elements it depends on (from `dependencies.json`). Click badge → scroll to the "Data Requirements" section in detail panel.

---

### Dependency Graph (3)

**TG1: Sankey View Mode**
Add toggle between force-directed graph and Sankey flow diagram.
Sankey: TCF Themes (left) → TCF Groups (middle) → WCO Domains (right).
Flow width proportional to dependency count.

**TG2: P1 Element Highlight Toggle**
Toggle button: "Highlight P1 Elements". When on, P1 elements (from `reuseScores.json`, ~40 elements) appear as red/larger nodes in the graph. Shows which data elements are most critical.

**TG3: Click-to-Navigate**
- Click TCF group node → navigate to `/taiw/capabilities` with that group pre-selected
- Click WCO domain node → navigate to `/taiw/model` with that domain pre-selected
- Click edge → show tooltip with list of connecting elements

---

### Maturity Assessment (3)

**TA1: Level Descriptions Panel**
Next to each maturity slider (1-5), show the level description text from `tacrQuestions.json`. As the slider moves, highlight the current level's description. This makes the assessment self-guided.

**TA2: Gap Heat Map**
After completing assessment, show an 8×3 grid:
```
Category         | Current | Desired | Gap
Strategy         |   2.3   |   4.1   | 1.8
Organization     |   1.8   |   3.5   | 1.7
Data Governance  |   1.5   |   4.2   | 2.7  ← Red (biggest gap)
...
```
Color coding: Gap < 1 = green, 1-2 = yellow, > 2 = red.

**TA3: Category Stepper with Progress**
Sidebar shows:
```
1. ✅ Strategy & Vision (70/70)
2. 🔵 Organization & Skills (45/80) ← in progress
3. ⬜ Data Governance (0/90)
...
```
Click any completed category → review mode (view answers, can edit).
Show overall progress: "235/640 questions answered (37%)".

---

### Trade Analytics Engine (4)

**TE1: Revenue Waterfall Chart**
Interactive waterfall/Sankey showing Pakistan's duty cascade:
```
CIF Value $58.4B
  └→ Customs Duty (avg 8.5%)
    └→ Regulatory Duty (avg 3.2%)
      └→ Additional CD (avg 2%)
        └→ Sales Tax (18%)
          └→ Advance WHT (1-5.5%)
            └→ FED (varies)
              └→ Total Revenue PKR ~1,100B

Concessions Branch:
  └→ SRO Savings (~PKR 200B)
  └→ FTA Savings (~PKR 80B)
  └→ Fifth Schedule (~PKR 150B)
```

Use Recharts FunnelChart or stacked bar. Static data, visually impressive.

**TE2: Dimension Explorer Cards**
10 dimension cards. Click card → expand to show ALL columns with:
- Column name
- Data type
- Description
- 🇵🇰 flag if Pakistan-specific (`pakSpecific: true` in starSchema.json)
- FK indicator if foreign key

Show sample values for Pakistan-specific columns (e.g., DIM_PORT: "Karachi Port", "Port Qasim", "Gwadar").

**TE3: Gap Extension Deep Dive**
Each of the 5 extension modules, when expanded, shows:
- Table list with column counts
- "Connects to Star Schema" → highlight which FACT/DIM columns this extension feeds
- "Required Capabilities" → clickable links to `/taiw/capabilities`
- Mini ERD showing how extension tables relate to each other

**TE4: View Definitions**
Show the 6 analytical views (VW_TRADE_BALANCE, VW_REVENUE_LEAKAGE, etc.) with:
- View name and description
- Source tables (chips, clickable)
- Sample query pseudocode
- Use case: "Who uses this view and why"

---

### Roadmap Builder (3)

**TR1: Investment Calculator (PKR)**
Sliders:
- Team Size: 10-100 people (default 30)
- Duration: 12-36 months (default 24)
- Technology Cost: PKR 100M-2B (default 500M)
- Training Budget: PKR 10M-200M (default 50M)

Auto-calculate:
```
Personnel Cost = Team × Duration × PKR 250K/month (avg)
Technology = slider value
Training = slider value
Total = Personnel + Technology + Training
Complexity Score = f(selected capabilities count, P1 element coverage)
```

**TR2: Shared Data Foundation Table**
Table showing WCO DM elements reused by 3+ selected capabilities. Columns:
- Element Name
- WCO Domain
- P-Tier
- # Capabilities Using It
- Already Available in WeBOC? (Y/N — static mapping)

This shows the "build once, use many" value proposition.

**TR3: Phase Auto-Suggestions**
When capabilities are selected, auto-assign them to phases based on `implementationPhase` from `enrichment.json`:
- Phase 1: Foundation (enrichment phase = 1)
- Phase 2: Integration (enrichment phase = 2)  
- Phase 3: Intelligence (enrichment phase = 3)

User can drag/override. Show phase summary:
```
Phase 1: 12 capabilities | PKR 350M | 8 P1 elements
Phase 2: 8 capabilities | PKR 280M | 15 P1 elements
Phase 3: 5 capabilities | PKR 200M | 10 P1 elements
```

---

### Pakistan Trade Reference (2)

**TP1: Trade Agreement Deep Dive**
Each trade agreement (CPFTA-II, SAFTA, D-8, etc.) gets an expandable section showing:
- Partner countries
- Coverage (# of tariff lines, % of trade)
- Key sectors affected
- Utilization rate (estimated, static)
- Rules of Origin type (CTC, RVC, Wholly Obtained)
- WCO DM relevance (Certificate of Origin IP)

**TP2: Port Infrastructure Map**
Visual layout (not Google Maps — just a styled Pakistan outline with positioned dots):
- 3 seaports (south coast): Karachi Port, Port Qasim, Gwadar
- Key airports: Karachi, Lahore, Islamabad, Peshawar, Quetta, Sialkot
- Land borders: Wagah (India), Torkham (Afghanistan), Chaman (Afghanistan), Sost (China)
- Dry ports: Lahore, Faisalabad, Peshawar, Multan, Hyderabad, Quetta

Use an SVG-based Pakistan outline or a simple positioned div layout. Each port is a dot with tooltip showing: name, type, terminals, trade share.

---

## Cross-Module Navigation (10+ links)

Verify these cross-module links work:

1. Dashboard donut slice → WCO Model filtered by that domain
2. Dashboard capability bar → Capabilities filtered by that theme
3. Dashboard "Start TACR" → Maturity assessment
4. WCO Model "Used By" capability chip → Capabilities page with that capability selected
5. Capabilities WCO element chip → WCO Model with that element selected
6. Capabilities "View in Graph" → Dependency graph
7. Graph TCF node click → Capabilities page
8. Graph WCO node click → WCO Model page
9. Analytics "Required Capabilities" → Capabilities page
10. Roadmap "Shared Data" element → WCO Model page
11. Pakistan Trade "FTA" → Capabilities "FTA Preference Management"
12. Module Switcher: BAIW ↔ TAIW always works

---

## Build Verification

After all 25 enhancements:
```
□ TypeScript: 0 errors
□ Production build: succeeds (npm run build)
□ All 8 TAIW pages load without errors
□ All BAIW pages still work (no regressions)
□ Module switcher works both directions
□ Cmd+K works on TAIW pages
□ localStorage: taiw_maturity and taiw_roadmap persist
□ Cross-module navigation: all 12 links verified
□ Charts render (Recharts)
□ Exports work (PDF/JSON/CSV on applicable pages)
```
