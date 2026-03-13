# TAIW — Prompt 2: Build TAIW App Module Inside BAIW

## Context

BAIW (Banking Analytics Intelligence Workbench) is running at localhost:5173 with 8 modules under routes like `/`, `/model`, `/capabilities`, `/graph`, `/maturity`, `/analytics`, `/roadmap`, `/pakistan`.

TAIW (Trade Analytics Intelligence Workbench) data has been generated in `src/data/taiw/` (Prompt 1 output). Now we build the TAIW app as a **completely separate module** inside the same codebase — own folder, own routes, own components.

---

## Architecture: Separation

```
src/
├── components/          # BAIW components (EXISTING — DO NOT MODIFY)
│   ├── Dashboard.tsx
│   ├── ModelExplorer.tsx
│   ├── CapabilityNavigator.tsx
│   ├── DependencyGraph.tsx
│   ├── MaturityAssessment.tsx
│   ├── ProfitabilityEngine.tsx
│   ├── RoadmapBuilder.tsx
│   ├── PakistanReference.tsx
│   ├── CommandPalette.tsx
│   ├── Layout.tsx
│   └── ...
├── data/                # BAIW data (EXISTING — DO NOT MODIFY)
│   ├── entities.json
│   ├── capabilities.json
│   └── ...
├── taiw/                # ★ NEW — TAIW module (EVERYTHING HERE)
│   ├── components/      # TAIW page components
│   │   ├── TaiwDashboard.tsx
│   │   ├── WCOModelExplorer.tsx
│   │   ├── TCFCapabilityNavigator.tsx
│   │   ├── TradeDependencyGraph.tsx
│   │   ├── TradeMaturityAssessment.tsx
│   │   ├── TradeAnalyticsEngine.tsx
│   │   ├── TradeRoadmapBuilder.tsx
│   │   ├── PakistanTradeReference.tsx
│   │   ├── TaiwLayout.tsx
│   │   └── TaiwCommandPalette.tsx
│   ├── data/            # Symlink or re-export from src/data/taiw/
│   │   └── index.ts     # Central data imports
│   ├── hooks/           # TAIW-specific hooks
│   │   ├── useTaiwSearch.ts
│   │   ├── useTaiwMaturity.ts
│   │   └── useTaiwRoadmap.ts
│   ├── utils/           # TAIW utilities
│   │   └── taiwHelpers.ts
│   └── index.tsx        # TAIW route definitions
├── App.tsx              # MODIFY — add TAIW routes
└── main.tsx
```

**CRITICAL RULES:**
1. **NEVER modify** any existing BAIW component, data file, or styling
2. All TAIW code goes in `src/taiw/` 
3. TAIW imports its data from `src/data/taiw/`
4. Shared utilities (if any) can be imported from existing `src/utils/`
5. TAIW has its own color theme (teal/cyan gradient vs BAIW's purple/blue)

---

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/taiw` | TaiwDashboard | TAIW landing dashboard |
| `/taiw/model` | WCOModelExplorer | WCO Data Model browser |
| `/taiw/capabilities` | TCFCapabilityNavigator | Trade Capability Framework |
| `/taiw/graph` | TradeDependencyGraph | TCF↔WCO dependency graph |
| `/taiw/maturity` | TradeMaturityAssessment | TACR assessment wizard |
| `/taiw/analytics` | TradeAnalyticsEngine | Star schema & analytics |
| `/taiw/roadmap` | TradeRoadmapBuilder | Trade modernization roadmap |
| `/taiw/pakistan` | PakistanTradeReference | Pakistan trade context |

---

## App.tsx Integration

Add TAIW routes alongside BAIW routes. Add a **module switcher** in the top nav that lets users switch between BAIW and TAIW.

```tsx
// In App.tsx — ADD these routes (don't remove existing)
import TaiwRoutes from './taiw';

// Inside Router:
<Route path="/taiw/*" element={<TaiwRoutes />} />
```

**Module Switcher Component** — Add to the top-right of the existing Layout navbar:

```
[BAIW | TAIW]   ← Toggle/tabs to switch between modules
```

When on BAIW routes (`/`, `/model`, etc.), BAIW nav is active.
When on TAIW routes (`/taiw/*`), TAIW nav is active.

---

## TAIW Color Theme

BAIW uses **purple/blue gradient** (`from-purple-600 to-blue-600`).
TAIW uses **teal/cyan gradient** (`from-teal-600 to-cyan-600`).

Apply this consistently:
- Sidebar/nav background
- Header gradient
- Active link colors
- Button accents
- Chart colors
- Stat card accents

---

## Component Specifications

### 1. `TaiwLayout.tsx` — TAIW Shell

Identical structure to BAIW's `Layout.tsx` but with:
- Teal/cyan color scheme
- TAIW logo text: "TAIW" with subtitle "Trade Analytics Intelligence Workbench"
- TAIW-specific sidebar links:
  ```
  Dashboard       /taiw
  WCO Model       /taiw/model
  Capabilities    /taiw/capabilities
  Dependencies    /taiw/graph
  Maturity        /taiw/maturity
  Analytics       /taiw/analytics
  Roadmap         /taiw/roadmap
  Pakistan Trade  /taiw/pakistan
  ```
- Icons: Use different icons from BAIW to differentiate:
  ```
  Dashboard: LayoutDashboard
  WCO Model: Database (or Globe)
  Capabilities: Target (or Layers)
  Dependencies: Share2 (or Network)
  Maturity: BarChart3
  Analytics: TrendingUp
  Roadmap: Map
  Pakistan Trade: Flag (or MapPin)
  ```
- Footer: "WCO Data Model v4.2 | TCF v1.0 | TACR v1.0 | 🇵🇰 Pakistan Trade Context"
- "Back to BAIW" link in sidebar footer

### 2. `TaiwDashboard.tsx` — Landing Page (`/taiw`)

**Hero Stats Row (4 cards):**
```
727 Data Elements | 96 Capabilities | 640+ Questions | 14 WCO Domains
(with teal accent borders)
```

**Trade Balance Chart:**
- Recharts BarChart showing Pakistan's top 10 trading partners
- Two bars per country: Exports (teal) vs Imports (cyan)
- Data from `pakistanContext.json`

**WCO Domain Distribution:**
- Recharts PieChart/Donut showing 727 elements across 14 domains
- Colors from each domain's assigned color

**TCF Theme Distribution:**
- Horizontal bar chart showing 96 capabilities across 6 themes
- Theme colors (amber, red, blue, violet, emerald, indigo)

**Pakistan Trade Snapshot Card:**
```
🇵🇰 Pakistan Trade FY2024-25
Exports: $32.11B (+4.67%)
Imports: $58.38B
Deficit: $26.27B
Revenue: PKR ~1,100B
GDs Processed: 4M+
Active Traders: 50,000+
```

**Quick Nav Grid (8 cards):**
Same pattern as BAIW — 8 module cards with icons, one-line descriptions, click to navigate.

**Maturity Radar Card:**
- If TACR assessment started (localStorage key: `taiw_maturity`), show mini radar
- Else show CTA: "Start TACR Assessment →"

**Dynamic Stats:**
- TACR Progress: X/8 categories completed
- Roadmap: X capabilities selected

### 3. `WCOModelExplorer.tsx` — WCO Data Model Browser (`/taiw/model`)

**Parallel to BAIW's ModelExplorer but for WCO DM.**

**LEFT Panel — Domain/Class Tree:**
```
▼ Declaration (85 elements)
  ▼ Declaration (25)
    - Identification of declaration
    - Type of declaration
    - Message function code
    - Date of declaration
    ...
  ▼ DeclarationGovernment (12)
  ▼ CustomsDeclarationDocument (8)
  ...
▼ Consignment (65 elements)
  ▼ Consignment (18)
  ▼ ConsignmentItem (15)
  ...
▼ Goods (70 elements)
...
```

**CENTER Panel — Element Detail:**
When an element is clicked:
```
┌─────────────────────────────────────┐
│ Value declared for customs          │
│ ─────────────────────────────       │
│ Domain: Financial                   │
│ Class:  CustomsValuation            │
│ Type:   n..16,2                     │
│ ID:     WCO-FIN-045                 │
│                                     │
│ Definition:                         │
│ The monetary amount declared by the │
│ importer as the value of goods for  │
│ customs purposes, in accordance     │
│ with WTO Valuation Agreement.       │
│                                     │
│ Code List: ISO 4217 Currency        │
│                                     │
│ Information Packages:               │
│ [GoodsDeclaration] [Transit]        │
│ [TemporaryAdmission] [DrawbackClaim]│
│                                     │
│ Used By Capabilities: (8)           │
│ ★ Declared Value Verification       │
│   Transfer Pricing Detection        │
│   Revenue Dashboarding              │
│   ...                               │
└─────────────────────────────────────┘
```

**RIGHT Panel — "Used By Capabilities":**
Show TCF capabilities that depend on selected element. Each is clickable → navigates to `/taiw/capabilities`.

**Features:**
- Search bar: Fuzzy search across 727 elements (name, definition, class, domain)
- Domain filter dropdown: All / Declaration / Consignment / ... 
- Information Package filter: All / GoodsDeclaration / CargoDeclaration / ...
- P-tier filter: All / P1 / P2 / P3 / P4 (from reuseScores)
- Element count badge per class/domain
- Inheritance chain display (class → parent class → domain)

### 4. `TCFCapabilityNavigator.tsx` — Trade Capability Framework (`/taiw/capabilities`)

**Parallel to BAIW's CapabilityNavigator.**

**LEFT Panel — TCF Hierarchy Tree:**
```
▼ Revenue & Duty Management (20) 🟡
  ▼ Customs Valuation Analytics (8)
    ★ Declared Value Verification
      Transfer Pricing Detection
      Transaction Value Database
      ...
  ▼ Tariff & Classification (6)
  ▼ Revenue Collection (6)
▼ Risk Management & Compliance (20) 🔴
  ▼ Risk-Based Selectivity (8)
  ▼ Anti-Smuggling & Enforcement (6)
  ▼ Compliance & Audit (6)
▼ Trade Facilitation & Operations (18) 🔵
...
```

**CENTER Panel — Capability Detail:**
```
┌─────────────────────────────────────┐
│ ★ Declared Value Verification       │
│ ─────────────────────────────       │
│ Theme: Revenue & Duty Management    │
│ Group: Customs Valuation Analytics  │
│ Priority: CRITICAL                  │
│ Phase: 1                            │
│                                     │
│ 🇵🇰 Pakistan Objectives:            │
│ • Detect under-invoicing...         │
│ • Build reference price database... │
│                                     │
│ Data Requirements: (8 WCO elements) │
│ [Value declared for customs]        │
│ [Customs value] [Invoice amount]    │
│ [Exchange rate] [Currency code]     │
│ [Country of origin code]            │
│ [Commodity code (HS)]               │
│ [Party identifier]                  │
│                                     │
│ Expected Outcomes:                  │
│ • Flag 10-15% of GDs for review    │
│ • Reduce false positives to <20%   │
│                                     │
│ Investment: PKR 40-80M              │
│ Challenges: Mirror stats gap...     │
└─────────────────────────────────────┘
```

**RIGHT Panel — Related Capabilities:**
Capabilities sharing 3+ WCO DM elements with current selection.

**Features:**
- ★ Critical capabilities highlighted (CRITICAL priority from enrichment)
- TACR score badge (if assessment done, show maturity level color-coded)
- Dependency count badge: [8] WCO elements needed
- Theme color coding on all capability items
- Click WCO element chip → navigates to `/taiw/model`

### 5. `TradeDependencyGraph.tsx` — Dependency Visualization (`/taiw/graph`)

**Two view modes (toggle):**

**Force-Directed Graph:**
- LEFT nodes: TCF groups (14 groups, colored by theme)
- RIGHT nodes: WCO DM domains (14 domains, colored by domain color)
- Edges: Mapping connections (thicker = more dependencies)
- Click node → navigate to `/taiw/capabilities` or `/taiw/model`

**Sankey Flow:**
- LEFT: 6 TCF Themes
- MIDDLE: 14 TCF Groups
- RIGHT: 14 WCO DM Domains
- Flow width = number of element dependencies

**Features:**
- P1 highlight toggle: Show P1 critical elements in red/larger
- Click-to-navigate: capability node → `/taiw/capabilities`, domain node → `/taiw/model`
- Tooltip on hover: Show element names connecting the two nodes

### 6. `TradeMaturityAssessment.tsx` — TACR Wizard (`/taiw/maturity`)

**Parallel to BAIW's MaturityAssessment.**

**LEFT Sidebar — Category Stepper:**
```
1. ✅ Strategy & Vision (70 Qs)
2. 🔵 Organization & Skills (80 Qs) ← current
3. ⬜ Data Governance (90 Qs)
4. ⬜ Information & Integration (85 Qs)
5. ⬜ Analytics & Technology (80 Qs)
6. ⬜ Infrastructure (75 Qs)
7. ⬜ Processes & Automation (85 Qs)
8. ⬜ Outcomes & Impact (75 Qs)
```

**CENTER — Question Cards:**
```
Q2.1.01: To what extent does customs have dedicated
analytics/data science staff?

Current Maturity: [1] [2] [3] [4] [5]
Desired Maturity: [1] [2] [3] [4] [5]

Level Descriptions:
1 — No dedicated analytics staff. Analysis done ad-hoc by operational officers.
2 — 1-2 MIS staff producing basic Excel reports.
3 — Dedicated analytics unit with 5+ staff, BI tools, standard dashboards.
4 — Data science team using ML/AI, predictive models, embedded in operations.
5 — Center of Excellence with 20+ analysts, continuous model improvement, global benchmarking.
```

**Results View:**
- Radar chart (8 axes, current vs desired)
- Gap heat map (8 categories × 3: current / desired / gap)
- Export: PDF, JSON, CSV

**localStorage key:** `taiw_maturity` (separate from BAIW's `baiw_maturity`)

### 7. `TradeAnalyticsEngine.tsx` — Star Schema & Analytics (`/taiw/analytics`)

**4 Tabs:**

**Tab 1: Star Schema ERD**
- Visual ERD showing FACT_TRADE_TRANSACTION at center
- 10 dimension tables radiating out
- Click table → show columns
- Pakistan-specific columns highlighted with 🇵🇰

**Tab 2: Revenue Waterfall**
- Sankey or waterfall chart showing:
```
CIF Value → Customs Duty → Regulatory Duty → ACD → Sales Tax → WHT → FED → Total Revenue
```
- With concession branches: SRO savings, FTA preference savings
- Static but visually impactful

**Tab 3: Dimensions Explorer**
- 10 dimension cards (DIM_DATE, DIM_TRADER, DIM_COMMODITY, etc.)
- Click card → expand to show columns
- Pakistan-specific columns flagged: `ntn_number`, `weboc_gd_type`, `cpec_route_flag`, `sro_number`, etc.

**Tab 4: Gap Extensions**
- 5 module accordion (AEO Analytics, Origin & FTA, Valuation Intelligence, Risk Scoring, E-Commerce)
- Each shows tables with columns
- "Connects to Star Schema" links
- "Required Capabilities" links to `/taiw/capabilities`

### 8. `TradeRoadmapBuilder.tsx` — Modernization Roadmap (`/taiw/roadmap`)

**Parallel to BAIW's RoadmapBuilder.**

**Capability Picker:**
- Multi-select from 96 capabilities
- Pre-built templates:
  - "Quick Wins" — 8 low-complexity, high-impact capabilities
  - "Revenue Protection" — Valuation + Risk + Compliance capabilities
  - "Trade Facilitation" — Clearance + Port + AEO capabilities
  - "WCO DM Conformity" — Data Quality + Governance + Code Harmonization
  - "Digital Transformation" — WeBOC + PSW + E-Commerce capabilities
  - "Full TCF" — All 96

**3-Phase Timeline:**
Using `implementationPhase` from enrichment.json:
```
Phase 1 (0-12 months): Foundation — Risk, Revenue basics, Data Quality
Phase 2 (12-24 months): Integration — PSW, AEO, Valuation, Classification
Phase 3 (24-36 months): Intelligence — ML models, Predictive, Supply Chain
```

**Investment Calculator:**
- Sliders: Team size (10-100), Duration (12-36 months), Technology cost (PKR 100M-2B)
- Auto-calculate total in PKR
- Complexity score based on selected capabilities

**Shared Data Foundation:**
Table showing WCO DM elements reused by 3+ selected capabilities.

**Export:** PDF, JSON

**localStorage key:** `taiw_roadmap`

### 9. `PakistanTradeReference.tsx` — Pakistan Context (`/taiw/pakistan`)

**Sections (accordion or tabs):**

**1. Institutional Framework**
Table: FBR, PSW, MoC, PBS, SBP, NTC, PRAL, TDAP — with roles and systems

**2. Trade Statistics FY2024-25**
- Export/Import bar chart
- Top sectors table
- Top partners table

**3. Customs Duty Structure**
Table: CD, ACD, RD, ST, WHT, FED with rates, authority, description

**4. Trade Agreements**
Table: CPFTA-II, SAFTA, D-8, ECO, GSP+, APTA with details, coverage, partner

**5. CPEC Context**
- Gwadar Port details
- 9 SEZs listed
- ML-1 Railway
- Digital connectivity with China GACC

**6. Ports & Borders**
- 3 seaports, 9 airports, 7 land borders, 6 dry ports
- Table with type, terminals, share

**7. WeBOC GD Types**
Table: 16 GD types with code, name, description

**8. Key Challenges**
10 challenges with severity badges (CRITICAL/HIGH/MEDIUM)

### 10. `TaiwCommandPalette.tsx` — Cmd+K Search

TAIW-specific command palette (Cmd+K when on `/taiw/*` routes):
- Search WCO data elements (727)
- Search TCF capabilities (96)
- Navigate to TAIW pages
- Quick actions: "Start TACR", "Export Roadmap", "Switch to BAIW"

---

## Module Switcher

Add a small toggle/tabs in the **top navigation bar** of both BAIW and TAIW layouts:

```tsx
// ModuleSwitcher component
<div className="flex bg-gray-800 rounded-lg p-1">
  <Link to="/" className={baiw ? 'bg-purple-600 text-white' : 'text-gray-400'}>
    BAIW
  </Link>
  <Link to="/taiw" className={taiw ? 'bg-teal-600 text-white' : 'text-gray-400'}>
    TAIW
  </Link>
</div>
```

This goes in both `Layout.tsx` (BAIW) and `TaiwLayout.tsx` (TAIW) — but **only add it to BAIW's Layout.tsx as a small non-breaking addition** (a 2-line component in the header area).

---

## Splash Page Update

The existing BAIW splash page (`/splash` or root landing) should show **both modules**:

```
┌─────────────────────────────────────────────┐
│         Analytics Intelligence Suite         │
│                                              │
│  ┌──────────────┐    ┌──────────────┐       │
│  │    BAIW      │    │    TAIW      │       │
│  │  Banking     │    │  Trade       │       │
│  │  Analytics   │    │  Analytics   │       │
│  │              │    │              │       │
│  │  FSDM v13   │    │  WCO DM v4.2│       │
│  │  112 caps   │    │  96 caps     │       │
│  │  Enter →    │    │  Enter →     │       │
│  └──────────────┘    └──────────────┘       │
│                                              │
│         Powered by Claude Code               │
└─────────────────────────────────────────────┘
```

If there's an existing splash/landing page, update it. If not, create `src/components/SuiteLanding.tsx` as the root `/` route, and move BAIW dashboard to `/baiw` — OR keep BAIW at `/dashboard` and add TAIW entry point.

**Simplest approach:** Keep BAIW routes as-is. Add a "TAIW" button in BAIW's sidebar that links to `/taiw`. Add `/taiw/*` routes. Don't break anything.

---

## Global Search Integration

The existing BAIW Cmd+K palette should get a "Switch to TAIW" action.
The TAIW Cmd+K palette should get a "Switch to BAIW" action.

---

## Exports

Every TAIW page with data should support:
- PDF export (same pattern as BAIW)
- JSON export
- CSV export (tables)

Use the same export utilities from BAIW's shared utils if they exist.

---

## Build Requirements

- TypeScript: 0 errors
- No modifications to existing BAIW components (add-only changes to App.tsx/routing)
- TAIW uses same Tailwind classes but different color palette
- All TAIW localStorage keys prefixed with `taiw_` (not conflicting with BAIW)
- Production build succeeds

---

## Summary Checklist

```
□ src/taiw/ folder created with all components
□ TaiwLayout.tsx with teal/cyan theme, 8 nav links
□ TaiwDashboard.tsx with hero stats, charts, quick nav
□ WCOModelExplorer.tsx with domain tree, element detail, capability links
□ TCFCapabilityNavigator.tsx with theme tree, Pakistan context, WCO element chips
□ TradeDependencyGraph.tsx with force-directed + Sankey views
□ TradeMaturityAssessment.tsx with 8-category TACR wizard
□ TradeAnalyticsEngine.tsx with 4 tabs (ERD, waterfall, dimensions, extensions)
□ TradeRoadmapBuilder.tsx with templates, investment calculator
□ PakistanTradeReference.tsx with 8 sections
□ TaiwCommandPalette.tsx for TAIW-specific search
□ Routes added to App.tsx (/taiw/*)
□ Module switcher in navbar (BAIW ↔ TAIW)
□ All data imported from src/data/taiw/
□ TypeScript 0 errors, build succeeds
```
