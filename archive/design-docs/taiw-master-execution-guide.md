# TAIW — Master Execution Guide

## What We're Building

TAIW (Trade Analytics Intelligence Workbench) is a **separate module** inside the existing BAIW app. Same codebase, separate folders, separate routes, separate color theme.

```
BAIW App (existing)
├── / (dashboard)          ← Banking analytics (purple/blue)
├── /model
├── /capabilities
├── /graph
├── /maturity
├── /analytics
├── /roadmap
├── /pakistan
│
├── /taiw (dashboard)      ← Trade analytics (teal/cyan)  ★ NEW
├── /taiw/model
├── /taiw/capabilities
├── /taiw/graph
├── /taiw/maturity
├── /taiw/analytics
├── /taiw/roadmap
└── /taiw/pakistan
```

## Folder Structure (after all prompts)

```
src/
├── components/           # BAIW components (UNTOUCHED)
├── data/                 # BAIW data (UNTOUCHED)
│   ├── entities.json
│   ├── capabilities.json
│   └── ...
├── data/taiw/            # ★ TAIW data (Prompt 1 output)
│   ├── dataElements.json       # 727 WCO DM elements
│   ├── classes.json             # ~130 classes
│   ├── domains.json             # 14 domains
│   ├── relationships.json       # ~300 class relationships
│   ├── informationPackages.json # 23 IPs
│   ├── codeLists.json           # 50 key code lists
│   ├── capabilities.json        # 96 TCF capabilities
│   ├── dataRequirements.json    # ~120 requirements
│   ├── mappings.json            # ~400 TCF→WCO mappings
│   ├── dependencies.json        # 96 grouped deps
│   ├── reuseScores.json         # ~200 P1-P4 ranked
│   ├── tacrQuestions.json       # 640+ maturity Qs
│   ├── starSchema.json          # 21 tables + 6 views
│   ├── gapExtensions.json       # 25 tables, 5 modules
│   ├── enrichment.json          # Pakistan context per cap
│   ├── pakistanContext.json     # Pakistan trade reference
│   └── index.json               # Metadata
├── taiw/                 # ★ TAIW module (Prompts 2-4)
│   ├── components/
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
│   ├── hooks/
│   ├── utils/
│   └── index.tsx         # TAIW route definitions
├── shared/               # ★ Shared components (Prompt 4)
│   └── ExportButtons.tsx
├── components/SuiteLanding.tsx  # ★ Unified landing (Prompt 4)
└── App.tsx               # Modified: add /taiw/* routes + suite landing
```

---

## Prompt Execution Order

### Prompt 1: Generate Data Repository
**File:** `taiw-prompt-1-data-repo.md`
**What it does:**
- Creates `scripts/generate_taiw_data.py`
- Runs it to produce 17 JSON files in `src/data/taiw/`
- 727 WCO DM elements, 96 TCF capabilities, 640+ TACR questions, star schema, gap extensions, Pakistan context

**Estimated time:** 15-25 min (Python script generation + execution)

**Verify before moving to Prompt 2:**
```bash
ls src/data/taiw/
# Should see 17 .json files
cat src/data/taiw/index.json
# Should show correct counts: 727 elements, 96 capabilities, etc.
```

---

### Prompt 2: Build TAIW App Module
**File:** `taiw-prompt-2-build-app-module.md`
**What it does:**
- Creates `src/taiw/` folder with 10 components
- Creates `TaiwLayout.tsx` (teal/cyan theme, 8 nav links)
- Creates all 8 page components importing from `src/data/taiw/`
- Adds `/taiw/*` routes to `App.tsx`
- Adds module switcher (BAIW ↔ TAIW)

**Estimated time:** 30-45 min

**Verify before moving to Prompt 3:**
```
localhost:5173/taiw           → TAIW Dashboard loads
localhost:5173/taiw/model     → WCO Model Explorer loads
localhost:5173/taiw/capabilities → TCF Navigator loads
... (all 8 pages)
localhost:5173/               → BAIW still works
```

---

### Prompt 3: Phase 2 Depth Enhancements
**File:** `taiw-prompt-3-phase2-depth.md`
**What it does:**
- 25 enhancements across 8 TAIW modules
- Dashboard: trade balance sparkline, data counts, conformity score
- WCO Model: IP filter, usage heatmap, class diagram, code lists
- Capabilities: critical stars, TACR badges, element counts
- Graph: Sankey view, P1 highlight, click navigation
- Maturity: level descriptions, gap heat map, progress stepper
- Analytics: revenue waterfall, dimension cards, extension deep dive, views
- Roadmap: PKR calculator, shared data foundation, phase suggestions
- Pakistan: FTA deep dive, port map

**Estimated time:** 30-45 min

**Verify:**
```
□ All 25 features work
□ Cross-module navigation (12+ links)
□ TypeScript 0 errors
□ Build succeeds
```

---

### Prompt 4: Audit, Suite Landing & Polish
**File:** `taiw-prompt-4-audit-suite-landing.md`
**What it does:**
- Fix Cmd+K palette (scope by module)
- Fix localStorage isolation (taiw_ prefix)
- Add exports (PDF/JSON/CSV) to all TAIW pages
- Complete enrichment.json for all 96 capabilities
- Create Suite Landing Page (unified / route)
- Polish module switcher
- Mobile responsiveness check

**Estimated time:** 20-30 min

**Verify:**
```
□ / shows Suite Landing with both BAIW and TAIW cards
□ Cmd+K works correctly per module
□ Exports work on all TAIW pages
□ All BAIW pages still work
□ Mobile responsive
□ Production build clean
```

---

## Parallel Mapping: BAIW ↔ TAIW

| Aspect | BAIW (Banking) | TAIW (Trade) |
|--------|---------------|--------------|
| **Data Model** | FSDM v13 (3,917 entities, 16 domains) | WCO DM v4.2 (727 elements, 14 domains) |
| **Capability Framework** | BVF (112 sub-capabilities) | TCF (96 sub-capabilities) |
| **Maturity Assessment** | BACR (793 questions, 9 categories) | TACR (640+ questions, 8 categories) |
| **Star Schema** | Customer Profitability (7 dims) | Trade Transaction (10 dims) |
| **Gap Extensions** | 5 modules (ABC, CLV, Budget, BPM, Ops) | 5 modules (AEO, Origin, Valuation, Risk, E-Commerce) |
| **Country Context** | SBP, KIBOR, CASA, Islamic Banking | FBR, WeBOC, PSW, CPEC, HS Tariff |
| **Color Theme** | Purple/Blue | Teal/Cyan |
| **Routes** | /dashboard, /model, /capabilities... | /taiw, /taiw/model, /taiw/capabilities... |
| **Data Folder** | src/data/ | src/data/taiw/ |
| **Components** | src/components/ | src/taiw/components/ |

---

## Total Effort Estimate

| Prompt | Time | Cumulative |
|--------|------|------------|
| 1. Data Repository | 15-25 min | 15-25 min |
| 2. Build App Module | 30-45 min | 45-70 min |
| 3. Phase 2 Depth | 30-45 min | 75-115 min |
| 4. Audit & Polish | 20-30 min | 95-145 min |
| **Total** | **~2-3 hours** | |

Compare to BAIW which took ~4-5 sessions. TAIW is faster because:
- Architecture already proven (reuse BAIW patterns)
- No experimental debugging (we know what works)
- Data generated programmatically (no manual parsing)

---

## Key Principles

1. **Zero BAIW modifications** — Only App.tsx routing gets new lines. All BAIW components/data untouched.
2. **Full isolation** — TAIW has own folder, own data, own theme, own localStorage keys.
3. **Same quality bar** — TypeScript strict, 0 errors, production build clean.
4. **Pakistan-first** — Every TAIW feature has Pakistan trade context (FBR, WeBOC, CPEC, etc.)
5. **Cross-navigable** — Users can switch between BAIW and TAIW seamlessly.
