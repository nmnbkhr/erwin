# BAIW Build Progress

> Generated: 2026-02-28
> Status: **ALL MODULES COMPLETE — BUILD PASSING**

---

## Build Output

```
vite v7.3.1 — production build
✓ 2,765 modules transformed
✓ built in 44.49s

dist/index.html                             0.45 KB │ gzip:   0.29 KB
dist/assets/index.css                      27.51 KB │ gzip:   6.10 KB
dist/assets/index.js                      752.94 KB │ gzip: 225.68 KB
dist/assets/domains.js                      2.75 KB │ gzip:   1.12 KB
dist/assets/pakistanContext.js              4.09 KB │ gzip:   1.78 KB
dist/assets/gapExtensions.js               17.06 KB │ gzip:   3.28 KB
dist/assets/dataRequirements.js            19.38 KB │ gzip:   3.11 KB
dist/assets/starSchema.js                  20.84 KB │ gzip:   3.22 KB
dist/assets/reuseMatrix.js                 22.51 KB │ gzip:   3.31 KB
dist/assets/reuseScores.js                 24.24 KB │ gzip:   3.69 KB
dist/assets/capabilities.js                36.80 KB │ gzip:   2.94 KB
dist/assets/bacrQuestions.js              155.95 KB │ gzip:  11.91 KB
dist/assets/entities.js                   698.23 KB │ gzip:  46.75 KB
dist/assets/relationships.js              706.72 KB │ gzip:  94.51 KB
dist/assets/dependencies.js               762.70 KB │ gzip:  60.71 KB
dist/assets/attributes.js              1,787.53 KB │ gzip:  98.83 KB
```

TypeScript: **0 errors**

---

## Module Progress

| # | Module | Route | Status | Lines | Files |
|---|--------|-------|--------|-------|-------|
| 0 | Layout (Sidebar + Header) | — | DONE | 134 | 3 |
| 1 | Dashboard | `/` | DONE | 60 + 199 | 6 |
| 2 | FSDM Model Explorer | `/model` | DONE | 325 | 1 |
| 3 | BVF Capability Navigator | `/capabilities` | DONE | 331 | 1 |
| 4 | Dependency Graph (D3) | `/graph` | DONE | 317 | 1 |
| 5 | Maturity Assessment | `/maturity` | DONE | 354 | 1 |
| 6 | Profitability Engine | `/profitability` | DONE | 284 | 1 |
| 7 | Roadmap Builder | `/roadmap` | DONE | 287 | 1 |
| 8 | Pakistan Reference | `/pakistan` | DONE | 228 | 1 |

**Total source lines:** ~2,519 (pages) + 333 (components) + 546 (hooks/utils/context/types) = **~3,398 lines of TSX/TS**
**Data generation script:** 2,313 lines of Python

---

## Data Generation Output

```
Script: scripts/generate_sample_data.py
Seed: random.seed(42) — fully reproducible
```

| # | File | Records | Size |
|---|------|---------|------|
| 1 | domains.json | 16 domains | 4 KB |
| 2 | entities.json | 3,917 entities | 820 KB |
| 3 | attributes.json | 15,364 attributes | 2.3 MB |
| 4 | relationships.json | 5,636 relationships | 892 KB |
| 5 | capabilities.json | 112 sub-capabilities | 44 KB |
| 6 | dataRequirements.json | 113 requirements | 24 KB |
| 7 | dependencies.json | 5,218 dependencies | 932 KB |
| 8 | reuseScores.json | 219 scored entities | 32 KB |
| 9 | reuseMatrix.json | 500 similarity pairs | 36 KB |
| 10 | lineage.json | 23 lineage entries | 8 KB |
| 11 | starSchema.json | 1 fact (42 cols) + 7 dims + 2 aggs + 3 views | 36 KB |
| 12 | gapExtensions.json | 5 modules, 21 tables | 32 KB |
| 13 | bacrQuestions.json | 793 questions | 184 KB |
| 14 | pakistanContext.json | regulatory + Islamic + payments | 8 KB |
| 15 | inheritanceTree.json | 839 chains | 116 KB |

**Total data:** ~5.5 MB across 15 JSON files

---

## Module Detail

### Module 0 — Layout
- **Sidebar.tsx** (73 lines): 64px collapsed / 260px expanded, dark bg (#0F172A), 8 nav items with Lucide icons, active state highlighting
- **Header.tsx** (35 lines): 56px height, global search bar, app title
- **Layout.tsx** (26 lines): Sidebar + Header + content area wrapper, scroll-to-top on navigation

### Module 1 — Dashboard (`/`)
- **StatCard.tsx** (22 lines): Icon + value + label card
- **DomainDonut.tsx** (61 lines): Recharts PieChart, top 8 domains + Other, click navigates to Model Explorer
- **CapabilityBar.tsx** (51 lines): Horizontal bar chart by theme, click navigates to Capability Navigator
- **PakistanCard.tsx** (29 lines): 6 key Pakistan banking metrics (PKR 35T assets, 33 banks, etc.)
- **TopReusedChart.tsx** (36 lines): Top 10 most reused FSDM entities bar chart
- **Dashboard.tsx** (60 lines): Orchestrates 4 stat cards + 2×2 grid of charts

### Module 2 — FSDM Model Explorer (`/model`)
- Three-panel layout: domain tree (280px) | entity detail | capabilities panel (260px)
- Domain tree: 16 domains, expandable with entity count badges, "Load more" pagination (50 at a time)
- Entity detail: name, domain badge, description, attributes table, parent/child relationship pills
- Right panel: capabilities that depend on selected entity, reuse tier badge (P1/P2/P3/P4)
- Fuzzy search bar, domain filter from URL params
- Cross-nav: entity pills clickable, "Used By" links to Capability Navigator

### Module 3 — BVF Capability Navigator (`/capabilities`)
- Three-panel layout: BVF hierarchy tree (300px) | capability detail | related capabilities (250px)
- Hierarchy: 3 themes → 12 groups → 112 sub-capabilities, color-coded accordion
- Detail: breadcrumb, data requirements list, FSDM entity chips (clickable → Model Explorer), Pakistan context, implementation phase/investment
- Right panel: top 5 similar capabilities from reuse matrix with similarity %

### Module 4 — Dependency Graph (`/graph`)
- D3.js force-directed network: 12 capability group nodes + 16 domain nodes
- Edge thickness proportional to dependency count
- Controls: theme checkboxes, show/hide labels, highlight P1 toggle
- Hover tooltip, click navigates to Model Explorer (domain) or Capability Navigator (group)
- Full zoom/pan/drag support

### Module 5 — Maturity Assessment (`/maturity`)
- Assessment mode: step-by-step wizard through 9 BACR categories, 8 representative questions per category
- Per question: current state slider (1-5) + desired state slider (1-5)
- Maturity labels: Emerging → Developing → Practicing → Innovating → Leading
- Category progress dots, overall progress bar
- Results mode: Recharts radar chart (current vs desired overlay), heat map, gap analysis table sorted by gap
- Overall maturity score, export to JSON, reset assessment
- Persists to localStorage across sessions

### Module 6 — Profitability Engine (`/profitability`)
- **Star Schema tab**: SVG ERD visualization (fact center, 7 dims, 2 aggs with FK lines), expandable table details with column lists, Pakistan-specific columns highlighted
- **P&L Builder tab**: 15-line waterfall (revenue green, cost red, subtotal bold, adjustment amber, final gold), click expands to show source FSDM entities, formula, Pakistan notes
- **Gap Extensions tab**: 5 module cards (ABC, CLV, Budget, BPM, Ops Metrics), expandable table/column details

### Module 7 — Roadmap Builder (`/roadmap`)
- Capability picker: multi-select checkboxes organized by group
- 5 pre-built templates: Quick Wins (6), Profitability Engine (8), Regulatory Compliance (6), Digital Transformation (7), Full BVF (112)
- Generated 3-phase Gantt timeline: Phase 1 (0-6mo), Phase 2 (6-18mo), Phase 3 (18-36mo)
- Each phase: capabilities, entity count, data requirements, PKR investment estimate
- Investment summary: total PKR range, capabilities selected, FSDM entities required, expected ROI

### Module 8 — Pakistan Banking Reference (`/pakistan`)
- **Regulatory Framework tab**: SBP key rates, Basel III requirements, IFRS 9 ECL stages, tax rates
- **Industry Metrics tab**: banking sector overview (33 banks, 16K branches), key financial ratios
- **Islamic Banking tab**: 10 product modes table (Murabaha, Ijarah, Musharaka, etc.) with FSDM entity mappings
- **Payment Ecosystem tab**: infrastructure (PRISM, Raast, 1LINK, NIFT), fintechs (JazzCash, Easypaisa, SadaPay, NayaPay)

---

## Cross-Module Navigation

| From | Action | To |
|------|--------|----|
| Dashboard donut | Click domain slice | Model Explorer (filtered by domain) |
| Dashboard bar | Click theme bar | Capability Navigator (filtered by theme) |
| Model Explorer | Click "Used By" capability | Capability Navigator (selected cap) |
| Model Explorer | Click parent/child pill | Model Explorer (different entity) |
| Capability Navigator | Click FSDM entity chip | Model Explorer (search) |
| Capability Navigator | Click related capability | Capability Navigator (different cap) |
| Dependency Graph | Click domain node | Model Explorer (filtered by domain) |
| Dependency Graph | Click capability node | Capability Navigator (filtered by theme) |
| Header | Search and submit | Model Explorer (search) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 7.3 |
| Styling | Tailwind CSS v4 (utility classes only) |
| Routing | React Router v6 |
| Charts | Recharts (pie, bar, radar) |
| Graph | D3.js (force-directed) |
| Icons | Lucide React |
| State | React Context + useReducer |
| Storage | localStorage (assessment persistence) |
